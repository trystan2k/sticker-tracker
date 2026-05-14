import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SharePreviewCard } from '@/components/share/SharePreviewCard';
import { renderSharePng } from '@/components/share/share-renderer';
import type { SharePreviewPayload } from '@/components/share/share-state';

import styles from './SharePreviewScreen.module.css';

type SharePreviewScreenProps = Readonly<{
  payload: SharePreviewPayload;
  onBack: () => void;
}>;

export function SharePreviewScreen({ payload, onBack }: SharePreviewScreenProps) {
  const { t } = useTranslation();
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState('');
  const renderPromiseRef = useRef<Promise<Awaited<ReturnType<typeof renderSharePng>>> | null>(null);

  useEffect(() => {
    const renderPromise = renderSharePng(payload, t).catch((err) => {
      renderPromiseRef.current = null;
      throw err;
    });

    renderPromiseRef.current = renderPromise;
    void renderPromise.catch(() => undefined);
  }, [payload, t]);

  const getAsset = useCallback(() => {
    return renderPromiseRef.current ?? Promise.reject(new Error('No render in progress'));
  }, []);

  const downloadAsset = useCallback(
    async (withStatus: boolean) => {
      if (withStatus) {
        setStatus(t('share.preview.downloading'));
      }

      const asset = await getAsset();
      const objectUrl = URL.createObjectURL(asset.blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = asset.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
    },
    [getAsset, t]
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
      const asset = await getAsset();
      const file = new File([asset.blob], asset.fileName, { type: 'image/png' });

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
        setStatus(t('share.preview.error'));
      }
    } finally {
      setIsBusy(false);
    }
  }, [downloadAsset, getAsset, t]);

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onBack}
          aria-label={t('share.preview.back')}
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>{t('share.preview.title')}</h1>
        <span className={styles.headerSpacer} aria-hidden="true" />
      </header>

      <section className={styles.previewArea}>
        <SharePreviewCard payload={payload} t={t} />
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
    </main>
  );
}
