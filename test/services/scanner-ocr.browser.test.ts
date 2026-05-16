import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isVideoFrameUnavailableError,
  resetScannerOcrSession,
  SCAN_DEBOUNCE_MS,
  recognizeFromVideo
} from '@/services/scanner-ocr';

const workerRecognizeMock = vi.fn<(image: unknown) => Promise<{ data: { text: string } }>>();
const workerTerminateMock = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const workerSetParametersMock = vi.fn<(parameters: unknown) => Promise<void>>().mockResolvedValue();
const createWorkerMock = vi.fn<() => Promise<unknown>>().mockImplementation(async () => {
  return {
    recognize: workerRecognizeMock,
    terminate: workerTerminateMock,
    setParameters: workerSetParametersMock
  };
});

vi.mock('tesseract.js', () => ({
  createWorker: createWorkerMock
}));

function makeMockContext(): CanvasRenderingContext2D {
  return {
    drawImage: vi.fn<() => void>(),
    getImageData: vi
      .fn<() => ImageData>()
      .mockReturnValue(new ImageData(new Uint8ClampedArray(16), 2, 2)),
    putImageData: vi.fn<() => void>(),
    imageSmoothingEnabled: true
  } as unknown as CanvasRenderingContext2D;
}

function makeMockCanvas(context: CanvasRenderingContext2D): HTMLCanvasElement {
  return {
    width: 0,
    height: 0,
    getContext: vi.fn<() => CanvasRenderingContext2D | null>().mockReturnValue(context),
    toDataURL: vi.fn<() => string>().mockReturnValue('data:image/png;base64,mock')
  } as unknown as HTMLCanvasElement;
}

function makeMockVideo(width = 640, height = 480): HTMLVideoElement {
  return {
    videoWidth: width,
    videoHeight: height,
    getBoundingClientRect: vi.fn<() => DOMRect>().mockReturnValue({
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      x: 0,
      y: 0,
      toJSON: () => ({})
    } as DOMRect)
  } as unknown as HTMLVideoElement;
}

describe('scanner-ocr', () => {
  describe('isVideoFrameUnavailableError', () => {
    it('returns true only for video-frame-unavailable error', () => {
      expect(isVideoFrameUnavailableError(new Error('video-frame-unavailable'))).toBe(true);
      expect(isVideoFrameUnavailableError(new Error('other'))).toBe(false);
      expect(isVideoFrameUnavailableError('video-frame-unavailable')).toBe(false);
    });
  });

  describe('SCAN_DEBOUNCE_MS', () => {
    it('exports a debounce constant of 2000ms', () => {
      expect(SCAN_DEBOUNCE_MS).toBe(2000);
    });
  });

  describe('recognizeFromVideo', () => {
    let mockContext: CanvasRenderingContext2D;
    let mockCanvas: HTMLCanvasElement;
    let mockVideo: HTMLVideoElement;

    beforeEach(() => {
      mockContext = makeMockContext();
      mockCanvas = makeMockCanvas(mockContext);
      mockVideo = makeMockVideo();

      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          return mockCanvas;
        }
        return document.createElement(tag);
      });

      workerRecognizeMock.mockReset();
      workerTerminateMock.mockClear();
      workerSetParametersMock.mockClear();
      createWorkerMock.mockClear();
    });

    afterEach(async () => {
      vi.restoreAllMocks();
      await resetScannerOcrSession();
    });

    it('creates roi canvas and recognizes text from worker', async () => {
      workerRecognizeMock.mockResolvedValue({ data: { text: 'BRA-1' } });

      const result = await recognizeFromVideo(mockVideo);

      expect(document.createElement).toHaveBeenCalledWith('canvas');
      expect(mockCanvas.width).toBeGreaterThan(0);
      expect(mockCanvas.height).toBeGreaterThan(0);
      expect(mockContext.drawImage).toHaveBeenCalled();
      expect(workerRecognizeMock).toHaveBeenCalledWith(mockCanvas);
      expect(result).toBe('BRA-1');
    });

    it('initializes worker once and reuses between scans', async () => {
      workerRecognizeMock.mockResolvedValue({ data: { text: 'CC1' } });

      await recognizeFromVideo(mockVideo);
      await recognizeFromVideo(mockVideo);

      // Worker created exactly once across multiple scans
      expect(createWorkerMock).toHaveBeenCalledTimes(1);
      // setParameters called exactly once during worker init
      expect(workerSetParametersMock).toHaveBeenCalledTimes(1);
      // recognize called multiple times due to multi-pass pipeline
      // (top-right raw + mild + header passes + fallback passes)
      const recognizeCallCount = workerRecognizeMock.mock.calls.length;
      expect(recognizeCallCount).toBeGreaterThan(1);
    });

    it('applies OCR tuning parameters', async () => {
      workerRecognizeMock.mockResolvedValue({ data: { text: 'MEX-5' } });

      await recognizeFromVideo(mockVideo);

      // Current pipeline only sets char whitelist with trailing space
      // No tessedit_pageseg_mode — relies on default auto segmentation
      expect(workerSetParametersMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- '
        })
      );
      expect(createWorkerMock).toHaveBeenCalledWith(
        'eng',
        1,
        expect.objectContaining({
          corePath: '/ocr-core',
          langPath: '/ocr-lang',
          gzip: true
        })
      );
    });

    it('throws when video dimensions are invalid', async () => {
      const badVideo = { videoWidth: 0, videoHeight: 480 } as unknown as HTMLVideoElement;

      await expect(recognizeFromVideo(badVideo)).rejects.toThrow('video-frame-unavailable');
    });

    it('throws when canvas context is unavailable', async () => {
      mockCanvas.getContext = vi.fn<() => null>().mockReturnValue(null);

      await expect(recognizeFromVideo(mockVideo)).rejects.toThrow('canvas-context-unavailable');
    });

    it('terminates worker on reset session', async () => {
      workerRecognizeMock.mockResolvedValue({ data: { text: 'ARG-1' } });

      await recognizeFromVideo(mockVideo);
      await resetScannerOcrSession();

      expect(workerTerminateMock).toHaveBeenCalledTimes(1);
    });

    it('calls onDebugPreview callback when provided', async () => {
      workerRecognizeMock.mockResolvedValue({ data: { text: 'BRA-1' } });
      const onDebugPreview = vi.fn<(preview: { label: string; imageDataUrl: string }) => void>();

      await recognizeFromVideo(mockVideo, { onDebugPreview });

      expect(onDebugPreview).toHaveBeenCalled();
      expect(onDebugPreview.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(onDebugPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          label: expect.stringContaining('roi-base-raw'),
          imageDataUrl: expect.stringContaining('data:image/png')
        })
      );
    });

    it('uses viewfinder element for ROI mapping when provided', async () => {
      workerRecognizeMock.mockResolvedValue({ data: { text: 'BRA-1' } });

      const mockViewfinder = {
        getBoundingClientRect: vi.fn<() => DOMRect>().mockReturnValue({
          left: 100,
          top: 100,
          right: 300,
          bottom: 300,
          width: 200,
          height: 200,
          x: 100,
          y: 100,
          toJSON: () => ({})
        } as DOMRect)
      } as unknown as HTMLElement;

      await recognizeFromVideo(mockVideo, { viewfinderElement: mockViewfinder });

      // Should have drawn with viewfinder-mapped ROI
      expect(mockContext.drawImage).toHaveBeenCalled();
      expect(workerRecognizeMock).toHaveBeenCalled();
    });

    it('returns early when top-right pass has high score', async () => {
      // First call returns high-score text (BRA-1 pattern scores >= 8)
      workerRecognizeMock.mockResolvedValue({ data: { text: 'BRA-1' } });

      const result = await recognizeFromVideo(mockVideo);

      expect(result).toBe('BRA-1');
      // Should have called recognize for top-right raw + mild, then returned early
      // without running header or fallback passes
      const callCount = workerRecognizeMock.mock.calls.length;
      expect(callCount).toBeGreaterThanOrEqual(2);
    });

    it('falls back to header passes when top-right score is low', async () => {
      // First calls return low-score text, later call returns high-score
      workerRecognizeMock
        .mockResolvedValueOnce({ data: { text: '' } }) // top-right raw: empty, score 0
        .mockResolvedValueOnce({ data: { text: '' } }) // top-right mild: empty, score 0
        .mockResolvedValueOnce({ data: { text: 'BRA-1' } }); // header raw: high score

      const result = await recognizeFromVideo(mockVideo);

      expect(result).toBe('BRA-1');
    });

    it('falls back to wide passes when header score is also low', async () => {
      // All early passes return low score, fallback wide pass returns high score
      workerRecognizeMock
        .mockResolvedValueOnce({ data: { text: '' } }) // top-right raw
        .mockResolvedValueOnce({ data: { text: '' } }) // top-right mild
        .mockResolvedValueOnce({ data: { text: '' } }) // header raw
        .mockResolvedValueOnce({ data: { text: '' } }) // header mild
        .mockResolvedValueOnce({ data: { text: 'BRA-1' } }); // fallback raw: high score

      const result = await recognizeFromVideo(mockVideo);

      expect(result).toBe('BRA-1');
    });

    it('returns header best when fallback score is not better', async () => {
      // Top-right low, header medium, fallback lower than header
      workerRecognizeMock
        .mockResolvedValueOnce({ data: { text: '' } }) // top-right raw: score 0
        .mockResolvedValueOnce({ data: { text: '' } }) // top-right mild: score 0
        .mockResolvedValueOnce({ data: { text: 'MEX-5' } }) // header raw: score >= 10
        .mockResolvedValueOnce({ data: { text: '' } }); // fallback raw: score 0

      const result = await recognizeFromVideo(mockVideo);

      // Header pass scored >= 10, so it returns header text directly
      expect(result).toBe('MEX-5');
    });

    it('returns fallback best when fallback score beats header', async () => {
      // Top-right low, header low, fallback high
      workerRecognizeMock
        .mockResolvedValueOnce({ data: { text: '' } }) // top-right raw: score 0
        .mockResolvedValueOnce({ data: { text: '' } }) // top-right mild: score 0
        .mockResolvedValueOnce({ data: { text: '' } }) // header raw: score 0
        .mockResolvedValueOnce({ data: { text: '' } }) // header mild: score 0
        .mockResolvedValueOnce({ data: { text: '' } }) // fallback raw: score 0
        .mockResolvedValueOnce({ data: { text: '' } }) // fallback mild: score 0
        .mockResolvedValueOnce({ data: { text: 'BRA-1' } }); // fallback enhanced: high score

      const result = await recognizeFromVideo(mockVideo);

      expect(result).toBe('BRA-1');
    });
  });
});
