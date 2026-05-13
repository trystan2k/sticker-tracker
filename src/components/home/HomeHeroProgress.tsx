import type { HomeSummary } from './home-state';

import styles from './HomeHeroProgress.module.css';

type HomeHeroProgressProps = Readonly<{
  summary: HomeSummary;
  completeLabel: string;
  collectedFormatted: string;
  totalFormatted: string;
  percentFormatted: string;
}>;

const RING_RADIUS = 75;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function HomeHeroProgress({
  summary,
  completeLabel,
  collectedFormatted,
  totalFormatted,
  percentFormatted
}: HomeHeroProgressProps) {
  const normalizedProgress = Math.max(0, Math.min(100, summary.percentage));
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - normalizedProgress / 100);

  return (
    <section className={styles.hero} aria-label="Home progress">
      <div className={styles.ringWrap}>
        <svg
          className={styles.ringSvg}
          width="160"
          height="160"
          viewBox="0 0 160 160"
          role="img"
          aria-label={`${collectedFormatted} / ${totalFormatted} - ${percentFormatted} ${completeLabel}`}
        >
          <circle className={styles.track} cx="80" cy="80" r={RING_RADIUS} />
          <circle
            className={styles.progress}
            cx="80"
            cy="80"
            r={RING_RADIUS}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
          />
          <circle className={styles.hole} cx="80" cy="80" r="65" />
        </svg>

        <div className={styles.stats}>
          <p className={styles.mainStat}>
            {collectedFormatted} / {totalFormatted}
          </p>
          <p className={styles.subStat}>
            {percentFormatted} {completeLabel}
          </p>
        </div>
      </div>
    </section>
  );
}
