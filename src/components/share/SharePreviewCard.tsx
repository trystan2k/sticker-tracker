import type { SharePreviewPayload } from '@/components/share/share-state';

import styles from './SharePreviewCard.module.css';

type SharePreviewCardProps = {
  payload: SharePreviewPayload;
  t: (key: string) => string;
};

export function SharePreviewCard({ payload, t }: SharePreviewCardProps) {
  const pageBlocks = payload.sections.flatMap((section) => section.pages);

  return (
    <article className={styles.card} aria-label={t('share.preview.ariaLabel')}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>{t('share.brandName')}</h2>
          <p className={styles.subtitle}>{t('share.preview.subtitle')}</p>
        </div>
        <img src="/images/fifa-26-logo.jpg" alt="" className={styles.logo} aria-hidden="true" />
      </header>

      <div className={styles.content}>
        {pageBlocks.length === 0 ? (
          <div className={styles.pageBlock}>
            <p className={styles.pageTitle}>{t('share.preview.emptyTitle')}</p>
            <p className={styles.missingText}>{t('share.preview.emptyDescription')}</p>
          </div>
        ) : (
          pageBlocks.map((page) => (
            <div key={page.pageId} className={styles.pageBlock}>
              <div className={styles.pageHeader}>
                {page.pageType === 'team' ? (
                  <span className={`fi fi-${page.flagCode} ${styles.flag}`} aria-hidden="true" />
                ) : page.specialKey === 'fwc-opening' || page.specialKey === 'fwc-closing' ? (
                  <img src="/images/fifa.png" alt="" className={styles.flag} aria-hidden="true" />
                ) : page.specialKey === 'coca-cola' ? (
                  <img
                    src="/images/cocacola.png"
                    alt=""
                    className={styles.flag}
                    aria-hidden="true"
                  />
                ) : null}
                <p className={styles.pageTitle}>{t(page.title)}</p>
              </div>
              <p className={styles.missingText}>
                {t('share.preview.missingPrefix')}: {page.compressedMissingText}
              </p>
            </div>
          ))
        )}
      </div>

      <footer className={styles.footer}>{t('share.brandDomain')}</footer>
    </article>
  );
}
