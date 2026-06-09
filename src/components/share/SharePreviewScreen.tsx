/* oxlint-disable jsx-a11y/prefer-tag-over-role */

import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getShareModeKeyPrefix, type ShareMode } from '@/components/share/share-mode';
import { SharePreviewCard } from '@/components/share/SharePreviewCard';
import { renderSharePng } from '@/components/share/share-renderer';
import type { SharePreviewPayload } from '@/components/share/share-state';

import styles from './SharePreviewScreen.module.css';

const SHARE_RENDER_OPTIONS = {
  preferredScale: 6,
  maxPixelWidth: 8192,
  fallbackToJpegIfPngExceedsBytes: 24 * 1024 * 1024
} as const;

type SharePreviewScreenProps = Readonly<{
  payload: SharePreviewPayload;
  onBack: () => void;
  mode?: ShareMode;
}>;

export function SharePreviewScreen({ payload, onBack, mode = 'missing' }: SharePreviewScreenProps) {
  const { t } = useTranslation();
  const translationKeyPrefix = getShareModeKeyPrefix(mode);
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState('');
  const prevPayloadRef = useRef(payload);
  const downloadRenderPromiseRef = useRef<Promise<
    Awaited<ReturnType<typeof renderSharePng>>
  > | null>(null);
  const shareRenderPromiseRef = useRef<Promise<Awaited<ReturnType<typeof renderSharePng>>> | null>(
    null
  );

  if (prevPayloadRef.current !== payload) {
    prevPayloadRef.current = payload;
    downloadRenderPromiseRef.current = null;
    shareRenderPromiseRef.current = null;
  }

  const getDownloadAsset = useCallback(() => {
    if (!downloadRenderPromiseRef.current) {
      downloadRenderPromiseRef.current = renderSharePng(payload, t, undefined, mode).catch(
        (err) => {
          downloadRenderPromiseRef.current = null;
          throw err;
        }
      );
    }

    return downloadRenderPromiseRef.current;
  }, [mode, payload, t]);

  const getShareAsset = useCallback(() => {
    if (!shareRenderPromiseRef.current) {
      // Messaging apps often recompress images shared through Web Share.
      // Render a larger source PNG so text stays sharper after that step.
      shareRenderPromiseRef.current = renderSharePng(payload, t, SHARE_RENDER_OPTIONS, mode).catch(
        (err) => {
          shareRenderPromiseRef.current = null;
          throw err;
        }
      );
    }

    return shareRenderPromiseRef.current;
  }, [mode, payload, t]);

  const downloadAsset = useCallback(
    async (withStatus: boolean) => {
      if (withStatus) {
        setStatus(t('share.preview.downloading'));
      }

      const asset = await getDownloadAsset();
      const objectUrl = URL.createObjectURL(asset.blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = asset.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
    },
    [getDownloadAsset, t]
  );

  const handleDownload = useCallback(async () => {
    setIsBusy(true);

    try {
      await downloadAsset(true);
      setStatus('');
    } catch {
      setStatus(t('share.preview.error'));
    } finally {
      setIsBusy(false);
    }
  }, [downloadAsset, t]);

  const handleShare = useCallback(async () => {
    setIsBusy(true);
    setStatus(t('share.preview.sharing'));

    try {
      const asset = await getShareAsset();
      const file = new File([asset.blob], asset.fileName, { type: asset.mimeType });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t('share.brandName') });
        setStatus('');
      } else {
        await downloadAsset(false);
        setStatus(t('share.preview.shareUnsupported'));
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus('');
      } else {
        try {
          await downloadAsset(false);
          setStatus(t('share.preview.shareUnsupported'));
        } catch {
          setStatus(t('share.preview.error'));
        }
      }
    } finally {
      setIsBusy(false);
    }
  }, [downloadAsset, getShareAsset, t]);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onBack}
          aria-label={t(`${translationKeyPrefix}.preview.back`)}
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>{t(`${translationKeyPrefix}.preview.title`)}</h1>
        <span className={styles.headerSpacer} aria-hidden="true" />
      </header>

      <section className={styles.previewArea}>
        <SharePreviewCard payload={payload} t={t} mode={mode} />
      </section>

      {status ? (
        <p className={styles.status} role="status" aria-live="polite" aria-atomic="true">
          {status}
        </p>
      ) : null}

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleShare}
          disabled={isBusy}
        >
          <Share2 size={16} aria-hidden="true" />
          {t('share.preview.share')}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleDownload}
          disabled={isBusy}
        >
          <Download size={16} aria-hidden="true" />
          {t('share.preview.download')}
        </button>
      </footer>
    </div>
  );
}
