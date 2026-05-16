import workerPath from 'tesseract.js/dist/worker.min.js?url';
import corePath from 'tesseract.js-core/tesseract-core-simd.wasm.js?url';
import engTrainedDataPath from '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz?url';

export const SCAN_DEBOUNCE_MS = 2_000;

const VIDEO_FRAME_UNAVAILABLE_ERROR = 'video-frame-unavailable';

const OCR_ROI_SIZE_RATIO = 0.68;
const OCR_SCALE_FACTOR = 1.6;
const MILD_CONTRAST_FACTOR = 1.2;
const STRONG_CONTRAST_FACTOR = 1.45;
const STRONG_THRESHOLD = 162;

type OcrDebugPreview = Readonly<{
  label: string;
  imageDataUrl: string;
}>;

type RecognizeFromVideoOptions = Readonly<{
  viewfinderElement?: HTMLElement | null;
  onDebugPreview?: (preview: OcrDebugPreview) => void;
}>;

interface OcrWorker {
  recognize: (image: HTMLCanvasElement) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<unknown>;
}

let workerPromise: Promise<OcrWorker> | null = null;

async function createOcrWorker(): Promise<OcrWorker> {
  const tesseractModule = await import('tesseract.js');

  const langDataDirectoryPath = engTrainedDataPath.substring(
    0,
    engTrainedDataPath.lastIndexOf('/')
  );

  const worker = await tesseractModule.createWorker('eng', 1, {
    workerPath,
    corePath,
    langPath: langDataDirectoryPath,
    gzip: true
  });

  await worker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- '
  });

  return {
    recognize: (image) => worker.recognize(image),
    terminate: () => worker.terminate()
  };
}

async function loadOcrWorker(): Promise<OcrWorker> {
  if (workerPromise) {
    return workerPromise;
  }

  const nextWorkerPromise = createOcrWorker().catch((error: unknown) => {
    workerPromise = null;
    throw error;
  });

  workerPromise = nextWorkerPromise;
  return nextWorkerPromise;
}

type RoiRect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

function getCenteredSquareRoi(width: number, height: number): RoiRect {
  const squareSide = Math.floor(Math.min(width, height) * OCR_ROI_SIZE_RATIO);
  const safeSide = Math.max(1, squareSide);

  const x = Math.max(0, Math.floor((width - safeSide) / 2));
  const y = Math.max(0, Math.floor((height - safeSide) / 2));

  return {
    x,
    y,
    width: safeSide,
    height: safeSide
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function mapViewfinderToSourceRoi(
  video: HTMLVideoElement,
  viewfinderElement: HTMLElement
): RoiRect | null {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return null;
  }

  const videoRect = video.getBoundingClientRect();
  const viewfinderRect = viewfinderElement.getBoundingClientRect();

  if (videoRect.width <= 0 || videoRect.height <= 0) {
    return null;
  }

  const scale = Math.max(videoRect.width / sourceWidth, videoRect.height / sourceHeight);
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;

  const offsetX = (videoRect.width - renderedWidth) / 2;
  const offsetY = (videoRect.height - renderedHeight) / 2;

  const leftInVideo = viewfinderRect.left - videoRect.left;
  const topInVideo = viewfinderRect.top - videoRect.top;
  const rightInVideo = viewfinderRect.right - videoRect.left;
  const bottomInVideo = viewfinderRect.bottom - videoRect.top;

  const sourceLeft = clamp((leftInVideo - offsetX) / scale, 0, sourceWidth);
  const sourceTop = clamp((topInVideo - offsetY) / scale, 0, sourceHeight);
  const sourceRight = clamp((rightInVideo - offsetX) / scale, 0, sourceWidth);
  const sourceBottom = clamp((bottomInVideo - offsetY) / scale, 0, sourceHeight);

  const sourceRoiWidth = Math.max(1, Math.floor(sourceRight - sourceLeft));
  const sourceRoiHeight = Math.max(1, Math.floor(sourceBottom - sourceTop));

  if (sourceRoiWidth <= 0 || sourceRoiHeight <= 0) {
    return null;
  }

  return {
    x: Math.floor(sourceLeft),
    y: Math.floor(sourceTop),
    width: sourceRoiWidth,
    height: sourceRoiHeight
  };
}

function resolveSourceRoi(video: HTMLVideoElement, options?: RecognizeFromVideoOptions): RoiRect {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error(VIDEO_FRAME_UNAVAILABLE_ERROR);
  }

  const viewfinderElement = options?.viewfinderElement;

  if (viewfinderElement) {
    const mappedRoi = mapViewfinderToSourceRoi(video, viewfinderElement);

    if (mappedRoi) {
      return mappedRoi;
    }
  }

  return getCenteredSquareRoi(sourceWidth, sourceHeight);
}

function drawBaseRoi(
  video: HTMLVideoElement,
  options?: RecognizeFromVideoOptions
): HTMLCanvasElement {
  const roi = resolveSourceRoi(video, options);

  const outputWidth = Math.max(1, Math.floor(roi.width * OCR_SCALE_FACTOR));
  const outputHeight = Math.max(1, Math.floor(roi.height * OCR_SCALE_FACTOR));

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('canvas-context-unavailable');
  }

  context.imageSmoothingEnabled = true;
  context.drawImage(video, roi.x, roi.y, roi.width, roi.height, 0, 0, outputWidth, outputHeight);

  return canvas;
}

function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const cloned = document.createElement('canvas');
  cloned.width = source.width;
  cloned.height = source.height;

  const context = cloned.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('canvas-context-unavailable');
  }

  context.drawImage(source, 0, 0);
  return cloned;
}

type RelativeRect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

function cropCanvasByRelativeRect(
  source: HTMLCanvasElement,
  rect: RelativeRect
): HTMLCanvasElement {
  const sourceX = Math.floor(source.width * rect.x);
  const sourceY = Math.floor(source.height * rect.y);
  const sourceWidth = Math.floor(source.width * rect.width);
  const sourceHeight = Math.floor(source.height * rect.height);

  const safeX = clamp(sourceX, 0, Math.max(0, source.width - 1));
  const safeY = clamp(sourceY, 0, Math.max(0, source.height - 1));
  const safeWidth = clamp(sourceWidth, 1, Math.max(1, source.width - safeX));
  const safeHeight = clamp(sourceHeight, 1, Math.max(1, source.height - safeY));

  const canvas = document.createElement('canvas');
  canvas.width = safeWidth;
  canvas.height = safeHeight;

  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('canvas-context-unavailable');
  }

  context.drawImage(source, safeX, safeY, safeWidth, safeHeight, 0, 0, safeWidth, safeHeight);

  return canvas;
}

function createTopRightCodeCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  return cropCanvasByRelativeRect(source, {
    x: 0.66,
    y: 0.035,
    width: 0.3,
    height: 0.22
  });
}

function createTopHeaderCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  return cropCanvasByRelativeRect(source, {
    x: 0.08,
    y: 0.02,
    width: 0.84,
    height: 0.33
  });
}

function getBestPass(results: readonly OcrPassResult[]): OcrPassResult {
  return results.reduce((best, current) => {
    return current.score > best.score ? current : best;
  });
}

function emitDebugPreview(
  options: RecognizeFromVideoOptions | undefined,
  label: string,
  canvas: HTMLCanvasElement
): void {
  if (!options?.onDebugPreview) {
    return;
  }

  options.onDebugPreview({
    label,
    imageDataUrl: canvas.toDataURL('image/png')
  });
}

async function runPrimaryHeaderPasses(
  worker: OcrWorker,
  baseCanvas: HTMLCanvasElement
): Promise<readonly OcrPassResult[]> {
  const topRightCanvas = createTopRightCodeCanvas(baseCanvas);
  const topRightRawPass = await runOcrPass(worker, topRightCanvas);

  if (topRightRawPass.score >= 10) {
    return [topRightRawPass];
  }

  const topRightMildCanvas = cloneCanvas(topRightCanvas);
  applyGrayscaleContrast(topRightMildCanvas, MILD_CONTRAST_FACTOR);
  const topRightMildPass = await runOcrPass(worker, topRightMildCanvas);

  if (topRightMildPass.score >= 10) {
    return [topRightRawPass, topRightMildPass];
  }

  const topHeaderCanvas = createTopHeaderCanvas(baseCanvas);
  const topHeaderRawPass = await runOcrPass(worker, topHeaderCanvas);

  if (topHeaderRawPass.score >= 10) {
    return [topRightRawPass, topRightMildPass, topHeaderRawPass];
  }

  const topHeaderMildCanvas = cloneCanvas(topHeaderCanvas);
  applyGrayscaleContrast(topHeaderMildCanvas, MILD_CONTRAST_FACTOR);
  const topHeaderMildPass = await runOcrPass(worker, topHeaderMildCanvas);

  return [topRightRawPass, topRightMildPass, topHeaderRawPass, topHeaderMildPass];
}

async function runFallbackWidePasses(
  worker: OcrWorker,
  baseCanvas: HTMLCanvasElement
): Promise<readonly OcrPassResult[]> {
  const rawPass = await runOcrPass(worker, baseCanvas);

  if (rawPass.score >= 10) {
    return [rawPass];
  }

  const mildCanvas = cloneCanvas(baseCanvas);
  applyGrayscaleContrast(mildCanvas, MILD_CONTRAST_FACTOR);
  const mildPass = await runOcrPass(worker, mildCanvas);

  if (mildPass.score >= 10) {
    return [rawPass, mildPass];
  }

  const enhancedCanvas = cloneCanvas(baseCanvas);
  applyGrayscaleContrast(enhancedCanvas, STRONG_CONTRAST_FACTOR);
  applyThreshold(enhancedCanvas, STRONG_THRESHOLD);
  const enhancedPass = await runOcrPass(worker, enhancedCanvas);

  return [rawPass, mildPass, enhancedPass];
}

function applyGrayscaleContrast(canvas: HTMLCanvasElement, contrastFactor: number): void {
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('canvas-context-unavailable');
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index] ?? 0;
    const green = data[index + 1] ?? 0;
    const blue = data[index + 2] ?? 0;

    const grayscale = red * 0.299 + green * 0.587 + blue * 0.114;
    const contrasted = (grayscale - 128) * contrastFactor + 128;
    const normalized = Math.max(0, Math.min(255, contrasted));

    data[index] = normalized;
    data[index + 1] = normalized;
    data[index + 2] = normalized;
    data[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
}

function applyThreshold(canvas: HTMLCanvasElement, threshold: number): void {
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('canvas-context-unavailable');
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const value = data[index] ?? 0;
    const nextValue = value >= threshold ? 255 : 0;

    data[index] = nextValue;
    data[index + 1] = nextValue;
    data[index + 2] = nextValue;
    data[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
}

type OcrPassResult = Readonly<{
  text: string;
  score: number;
}>;

function scoreRecognizedText(text: string): number {
  const trimmed = text.trim().toUpperCase();

  if (trimmed.length === 0) {
    return 0;
  }

  let score = 0;

  if (/\d/.test(trimmed)) {
    score += 4;
  }

  if (/[A-Z]{3}[\s-]?\d{1,3}|CC[\s-]?\d{1,2}|\b00\b/.test(trimmed)) {
    score += 8;
  }

  const validChars = trimmed.match(/[A-Z0-9\s-]/g)?.length ?? 0;
  score += Math.floor((validChars / trimmed.length) * 3);

  if (trimmed.length <= 24) {
    score += 2;
  }

  return score;
}

async function runOcrPass(worker: OcrWorker, canvas: HTMLCanvasElement): Promise<OcrPassResult> {
  const result = await worker.recognize(canvas);
  const text = result.data.text;

  return {
    text,
    score: scoreRecognizedText(text)
  };
}

export function isVideoFrameUnavailableError(error: unknown): boolean {
  return error instanceof Error && error.message === VIDEO_FRAME_UNAVAILABLE_ERROR;
}

export async function resetScannerOcrSession(): Promise<void> {
  if (!workerPromise) {
    return;
  }

  const currentWorkerPromise = workerPromise;
  workerPromise = null;

  try {
    const worker = await currentWorkerPromise;
    await worker.terminate();
  } catch {
    // Ignore termination errors during session reset.
  }
}

export async function recognizeFromVideo(
  video: HTMLVideoElement,
  options?: RecognizeFromVideoOptions
): Promise<string> {
  const worker = await loadOcrWorker();
  const baseCanvas = drawBaseRoi(video, options);

  emitDebugPreview(options, 'roi-base-raw', baseCanvas);
  const topRightPreviewCanvas = createTopRightCodeCanvas(baseCanvas);
  emitDebugPreview(options, 'roi-top-right-code-primary', topRightPreviewCanvas);

  const topRightRawPass = await runOcrPass(worker, topRightPreviewCanvas);
  const topRightMildCanvas = cloneCanvas(topRightPreviewCanvas);
  applyGrayscaleContrast(topRightMildCanvas, MILD_CONTRAST_FACTOR);
  const topRightMildPass = await runOcrPass(worker, topRightMildCanvas);
  const topRightBestPass = getBestPass([topRightRawPass, topRightMildPass]);

  if (topRightBestPass.score >= 8) {
    return topRightBestPass.text;
  }

  const headerPasses = await runPrimaryHeaderPasses(worker, baseCanvas);
  const headerBestPass = getBestPass(headerPasses);

  if (headerBestPass.score >= 10) {
    return headerBestPass.text;
  }

  const fallbackPasses = await runFallbackWidePasses(worker, baseCanvas);
  const fallbackBestPass = getBestPass(fallbackPasses);

  if (fallbackBestPass.score > headerBestPass.score) {
    return fallbackBestPass.text;
  }

  return headerBestPass.text;
}
