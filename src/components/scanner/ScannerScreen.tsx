import { ArrowLeft, Camera, ClipboardCheck, ShieldAlert, Smartphone } from 'lucide-react';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FEATURE_FLAGS } from '@/config/features';
import { AppStateContext } from '@/providers/AppStateProvider';
import { lookupSticker } from '@/services/scanner-lookup';
import {
  isVideoFrameUnavailableError,
  resetScannerOcrSession,
  SCAN_DEBOUNCE_MS,
  recognizeFromVideo
} from '@/services/scanner-ocr';

import { ReviewModal } from './ReviewModal';
import { ScanResultPopup } from './ScanResultPopup';
import { ViewfinderOverlay } from './ViewfinderOverlay';
import styles from './ScannerScreen.module.css';

type ScannerState = 'idle' | 'active' | 'denied' | 'unsupported';

type ScannedReviewItem = Readonly<{
  id: string;
  rawText: string;
  stickerNumber: string;
}>;

type ScannerScreenProps = Readonly<{
  onBack?: () => void;
  onFinishScanning?: () => void;
}>;

const STICKER_REDETECTION_COOLDOWN_MS = 4_000;

export function ScannerScreen({ onBack, onFinishScanning }: ScannerScreenProps) {
  const appState = useContext(AppStateContext);
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const viewfinderRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const popupOpenRef = useRef(false);
  const reviewItemIdRef = useRef(0);
  const sessionIdRef = useRef(0);
  const isVideoReadyRef = useRef(false);
  const lastDetectedRef = useRef<{
    stickerNumber: string;
    detectedAt: number;
  } | null>(null);

  const [state, setState] = useState<ScannerState>('idle');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanText, setLastScanText] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResultPopup, setScanResultPopup] = useState<{
    stickerNumber: string;
    hasSticker: boolean;
  } | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<readonly ScannedReviewItem[]>([]);
  const [hasReviewSuccess, setHasReviewSuccess] = useState(false);
  const [ocrDebugPreview, setOcrDebugPreview] = useState<{
    label: string;
    imageDataUrl: string;
  } | null>(null);

  const isActive = state === 'active';

  const stopStream = useCallback(() => {
    if (scanTimerRef.current) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    sessionIdRef.current += 1;

    const stream = streamRef.current;

    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }

    streamRef.current = null;
    isVideoReadyRef.current = false;
    lastDetectedRef.current = null;
    void resetScannerOcrSession();

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
    setOcrDebugPreview(null);
  }, []);

  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !streamRef.current || !isVideoReadyRef.current) {
      return;
    }

    if (popupOpenRef.current) {
      setIsScanning(false);
      return;
    }

    const currentSessionId = sessionIdRef.current;

    setIsScanning(true);

    try {
      const text = await recognizeFromVideo(videoRef.current, {
        viewfinderElement: viewfinderRef.current,
        ...(FEATURE_FLAGS.scannerDiagnosticsEnabled
          ? {
              onDebugPreview: (preview: { label: string; imageDataUrl: string }) => {
                setOcrDebugPreview(preview);
              }
            }
          : {})
      });

      if (currentSessionId !== sessionIdRef.current) {
        return;
      }

      const normalizedText = text.trim();

      setLastScanText(normalizedText || null);
      setScanError(null);

      if (normalizedText) {
        const lookupResult = await lookupSticker(normalizedText);

        if (currentSessionId !== sessionIdRef.current) {
          return;
        }

        if (lookupResult.state === 'matched') {
          const now = Date.now();
          const lastDetected = lastDetectedRef.current;
          const isRepeatedStickerWithinCooldown =
            lastDetected !== null &&
            lastDetected.stickerNumber === lookupResult.stickerId &&
            now - lastDetected.detectedAt < STICKER_REDETECTION_COOLDOWN_MS;

          if (!isRepeatedStickerWithinCooldown) {
            lastDetectedRef.current = {
              stickerNumber: lookupResult.stickerId,
              detectedAt: now
            };

            if (!lookupResult.hasSticker) {
              setScannedItems((currentItems) => {
                const alreadyScanned = currentItems.some(
                  (item) => item.stickerNumber === lookupResult.stickerId
                );

                if (alreadyScanned) {
                  return currentItems;
                }

                return [
                  ...currentItems,
                  {
                    id: `scan-${reviewItemIdRef.current++}`,
                    rawText: normalizedText,
                    stickerNumber: lookupResult.stickerId
                  }
                ];
              });
            }

            popupOpenRef.current = true;
            setScanResultPopup({
              stickerNumber: lookupResult.stickerId,
              hasSticker: lookupResult.hasSticker
            });
          }
        }
      }
    } catch (error) {
      if (!isVideoFrameUnavailableError(error)) {
        setScanError(t('scanner.scanError', { defaultValue: 'Could not read the camera frame.' }));
      }
    }

    if (popupOpenRef.current) {
      setIsScanning(false);
      return;
    }

    setIsScanning(false);

    scanTimerRef.current = window.setTimeout(() => {
      scanTimerRef.current = null;
      void scanFrame();
    }, SCAN_DEBOUNCE_MS);
  }, [t]);

  const startScanner = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unsupported');
      return;
    }

    setIsRequestingPermission(true);
    setScanError(null);
    setHasReviewSuccess(false);

    try {
      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: 'environment'
            }
          },
          audio: false
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      isVideoReadyRef.current = false;
      setState('active');
    } catch {
      setState('denied');
    } finally {
      setIsRequestingPermission(false);
    }
  }, []);

  const handleStartScanner = useCallback(() => {
    void startScanner();
  }, [startScanner]);

  const handleViewfinderElementChange = useCallback((element: HTMLDivElement | null) => {
    viewfinderRef.current = element;
  }, []);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const stream = streamRef.current;
    const video = videoRef.current;

    if (!stream || !video) {
      return undefined;
    }

    let cancelled = false;
    const currentSessionId = sessionIdRef.current;

    const scheduleScanLoop = () => {
      if (cancelled || currentSessionId !== sessionIdRef.current || scanTimerRef.current) {
        return;
      }

      scanTimerRef.current = window.setTimeout(() => {
        void scanFrame();
      }, SCAN_DEBOUNCE_MS);
    };

    const handleVideoReady = () => {
      if (cancelled || currentSessionId !== sessionIdRef.current) {
        return;
      }

      isVideoReadyRef.current = true;
      scheduleScanLoop();
    };

    video.srcObject = stream;

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      handleVideoReady();
    } else {
      video.addEventListener('loadedmetadata', handleVideoReady, { once: true });
      video.addEventListener('loadeddata', handleVideoReady, { once: true });
    }

    void video.play().catch(() => {
      // iOS Safari may reject autoplay while still allowing metadata readiness.
    });

    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', handleVideoReady);
      video.removeEventListener('loadeddata', handleVideoReady);
    };
  }, [isActive, scanFrame]);

  const finishScanning = useCallback(() => {
    stopStream();
    sessionIdRef.current += 1;
    setState('idle');
    setIsReviewModalOpen(true);
    setScanError(null);
    setReviewError(null);
    popupOpenRef.current = false;
    setScanResultPopup(null);
  }, [stopStream]);

  const closeReviewModalAndResetToIdle = useCallback(() => {
    setIsReviewModalOpen(false);
    setState('idle');
    setReviewError(null);
    popupOpenRef.current = false;
    setScanResultPopup(null);
  }, []);

  const handleConfirmReview = useCallback(
    async (stickerIds: readonly string[]) => {
      if (!appState) {
        return;
      }

      setIsSubmittingReview(true);
      setReviewError(null);

      try {
        const result = await appState.markScannedStickersAsHave([...stickerIds]);

        if (result.state !== 'ready') {
          setReviewError(
            t('scanner.review.saveError', {
              defaultValue: 'Failed to save stickers. Try again.'
            })
          );
          return;
        }

        setScannedItems([]);
        setHasReviewSuccess(true);
        closeReviewModalAndResetToIdle();

        if (onFinishScanning) {
          onFinishScanning();
        }
      } catch {
        setReviewError(
          t('scanner.review.saveError', {
            defaultValue: 'Failed to save stickers. Try again.'
          })
        );
      } finally {
        setIsSubmittingReview(false);
      }
    },
    [appState, closeReviewModalAndResetToIdle, onFinishScanning, t]
  );

  const handleCancelReview = useCallback(() => {
    setScannedItems([]);
    setHasReviewSuccess(false);
    closeReviewModalAndResetToIdle();
  }, [closeReviewModalAndResetToIdle]);

  const handleCloseScanResultPopup = useCallback(() => {
    popupOpenRef.current = false;
    setScanResultPopup(null);
  }, []);

  useEffect(() => {
    if (state !== 'active' || popupOpenRef.current || scanResultPopup !== null) {
      return;
    }

    if (!streamRef.current || scanTimerRef.current) {
      return;
    }

    scanTimerRef.current = window.setTimeout(() => {
      scanTimerRef.current = null;
      void scanFrame();
    }, SCAN_DEBOUNCE_MS);
  }, [scanFrame, scanResultPopup, state]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const statusLabel = useMemo(() => {
    if (isRequestingPermission) {
      return t('scanner.requestingPermission', { defaultValue: 'Requesting camera permission...' });
    }

    if (isScanning) {
      return t('scanner.scanning', { defaultValue: 'Scanning...' });
    }

    return t('scanner.readyToScan', { defaultValue: 'Point camera at sticker code.' });
  }, [isRequestingPermission, isScanning, t]);

  if (isActive) {
    return (
      <>
        <main className={styles.activeScreen}>
          <header className={styles.activeHeader}>
            <button
              type="button"
              onClick={onBack}
              className={styles.iconButton}
              aria-label={t('scanner.back', { defaultValue: 'Back' })}
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
            <h1 className={styles.activeTitle}>
              {t('scanner.title', { defaultValue: 'Scanner' })}
            </h1>
            <button
              type="button"
              onClick={finishScanning}
              className={`${styles.iconButton} ${styles.finishButton}`}
              data-testid="scanner-finish-button"
            >
              <ClipboardCheck size={18} aria-hidden="true" />
              <span>{t('scanner.finish', { defaultValue: 'Finish scanning' })}</span>
            </button>
          </header>

          <section
            className={styles.viewfinderRegion}
            aria-label={t('scanner.viewfinder', { defaultValue: 'Camera viewfinder' })}
          >
            <video
              ref={videoRef}
              className={styles.video}
              data-testid="scanner-video"
              autoPlay
              playsInline
              muted
              aria-hidden="true"
            />
            <ViewfinderOverlay
              isScanning={isScanning}
              onViewfinderElementChange={handleViewfinderElementChange}
            />
          </section>

          <section className={styles.bottomSheet} aria-live="polite" data-testid="scanner-status">
            <p className={styles.status}>{statusLabel}</p>
            {lastScanText ? (
              <p className={styles.scanResult}>
                {t('scanner.lastRead', { defaultValue: 'Last read: {{text}}', text: lastScanText })}
              </p>
            ) : null}
            {scanError ? <p className={styles.error}>{scanError}</p> : null}
            {FEATURE_FLAGS.scannerDiagnosticsEnabled && ocrDebugPreview ? (
              <figure className={styles.ocrDebugPreview}>
                <figcaption className={styles.ocrDebugLabel}>{ocrDebugPreview.label}</figcaption>
                <img
                  src={ocrDebugPreview.imageDataUrl}
                  alt={t('scanner.ocrDebugPreviewAlt', { defaultValue: 'OCR debug preview' })}
                  className={styles.ocrDebugImage}
                />
              </figure>
            ) : null}
          </section>
        </main>

        <ScanResultPopup
          isOpen={scanResultPopup !== null}
          stickerNumber={scanResultPopup?.stickerNumber ?? ''}
          hasSticker={scanResultPopup?.hasSticker ?? false}
          onClose={handleCloseScanResultPopup}
        />
      </>
    );
  }

  const stateCopy =
    state === 'denied'
      ? {
          icon: <ShieldAlert size={28} aria-hidden="true" />,
          badge: t('scanner.permissionDeniedBadge', { defaultValue: 'Permission needed' }),
          heading: t('scanner.permissionDeniedTitle', { defaultValue: 'Camera access blocked' }),
          description: t('scanner.permissionDeniedDescription', {
            defaultValue: 'Enable camera permission in browser settings, then try again.'
          }),
          cta: t('scanner.tryAgain', { defaultValue: 'Try again' })
        }
      : state === 'unsupported'
        ? {
            icon: <Smartphone size={28} aria-hidden="true" />,
            badge: t('scanner.unsupportedBadge', { defaultValue: 'Unsupported device' }),
            heading: t('scanner.unsupportedTitle', { defaultValue: 'Camera unavailable' }),
            description: t('scanner.unsupportedDescription', {
              defaultValue: 'This device or browser does not support camera capture.'
            }),
            cta: t('scanner.backToAlbum', { defaultValue: 'Back' })
          }
        : {
            icon: <Camera size={28} aria-hidden="true" />,
            badge: t('scanner.badge', { defaultValue: 'NEW' }),
            heading: t('scanner.idleTitle', { defaultValue: 'Scan your stickers' }),
            description: t('scanner.idleDescription', {
              defaultValue: 'Point camera at sticker code and keep card inside frame.'
            }),
            cta: t('scanner.start', { defaultValue: 'Iniciar' })
          };

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <button
          type="button"
          onClick={onBack}
          className={styles.iconButton}
          aria-label={t('scanner.back', { defaultValue: 'Back' })}
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>{t('scanner.title', { defaultValue: 'Scanner' })}</h1>
        <div className={styles.headerSpacer} aria-hidden="true" />
      </header>

      <section className={styles.idleBody}>
        <div className={styles.iconBadge} aria-hidden="true">
          {stateCopy.icon}
        </div>
        <span className={styles.badge} data-testid="scanner-badge">
          {stateCopy.badge}
        </span>
        <h2 className={styles.heading} data-testid="scanner-heading">
          {stateCopy.heading}
        </h2>
        <p className={styles.description} data-testid="scanner-description">
          {stateCopy.description}
        </p>
      </section>

      <section className={styles.ctaArea}>
        {hasReviewSuccess ? (
          <p className={styles.status} role="status" aria-live="polite">
            {t('scanner.review.success', {
              defaultValue: 'Stickers marked as collected successfully.'
            })}
          </p>
        ) : null}

        <button
          type="button"
          className={styles.primaryButton}
          data-testid="scanner-cta-button"
          onClick={state === 'unsupported' ? onBack : handleStartScanner}
          disabled={isRequestingPermission}
        >
          {isRequestingPermission
            ? t('scanner.requestingPermissionShort', { defaultValue: 'Loading...' })
            : stateCopy.cta}
        </button>
      </section>

      <ReviewModal
        isOpen={isReviewModalOpen}
        items={scannedItems}
        isSubmitting={isSubmittingReview}
        submitErrorMessage={reviewError}
        onConfirm={handleConfirmReview}
        onCancel={handleCancelReview}
      />
    </main>
  );
}
