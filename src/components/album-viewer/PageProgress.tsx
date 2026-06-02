/* oxlint-disable jsx-a11y/prefer-tag-over-role */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './PageProgress.module.css';

type PageProgressProps = Readonly<{
  collectedCount: number;
  totalCount: number;
}>;

export function PageProgress({ collectedCount, totalCount }: PageProgressProps) {
  const { t } = useTranslation();
  const percentage = totalCount === 0 ? 0 : Math.round((collectedCount / totalCount) * 100);
  const fillStyle = useMemo(() => ({ width: `${percentage}%` }), [percentage]);

  return (
    <section className={styles.progressSection} aria-label={t('album.progress.label')}>
      <div className={styles.row}>
        <span className={styles.copy}>
          {t('album.progress.collected', { collected: collectedCount, total: totalCount })}
        </span>
        <span className={styles.percent}>{percentage}%</span>
      </div>

      <div
        className={styles.track}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-valuenow={collectedCount}
        aria-label={t('album.progress.barAriaLabel')}
      >
        <div className={styles.fill} style={fillStyle} />
      </div>
    </section>
  );
}
