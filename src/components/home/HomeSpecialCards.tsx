import { useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import type { SpecialCardData } from './home-state';
import styles from './HomeSpecialCards.module.css';

type HomeSpecialCardsProps = Readonly<{
  cards: readonly SpecialCardData[];
  sectionTitle?: string;
}>;

const COCA_COLA_ACCENT = 'var(--color-brand-sponsor-coca-cola, #CC0000)';
const DEFAULT_ACCENT = 'var(--color-brand-primary)';

interface CardStyle extends React.CSSProperties {
  '--special-card-accent'?: string;
}

type SpecialCardProps = Readonly<{
  card: SpecialCardData;
  accentColor: string;
  onNavigate: (path: string) => void;
  t: ReturnType<typeof useTranslation>['t'];
}>;

function SpecialCard({ card, accentColor, onNavigate, t }: SpecialCardProps) {
  const cardStyle = useMemo<CardStyle>(
    () => ({ '--special-card-accent': accentColor }),
    [accentColor]
  );
  const progressStyle = useMemo(() => ({ width: `${card.percentage}%` }), [card.percentage]);

  const handleCardClick = useCallback(() => {
    onNavigate(card.path);
  }, [onNavigate, card.path]);

  return (
    <article
      className={`${styles.card} ${card.isComplete ? styles.cardComplete : ''}`}
      style={cardStyle}
    >
      <button
        type="button"
        className={styles.cardAction}
        onClick={handleCardClick}
        aria-label={`${t(card.translationKey)} ${card.collected}/${card.total}`}
      />

      <div className={styles.accent} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.cardHead}>
          <p className={styles.name}>{t(card.translationKey)}</p>
          <p className={styles.counter}>
            {card.collected}/{card.total}
          </p>
        </header>

        <div className={styles.progressTrack} aria-hidden="true">
          <div
            className={`${styles.progressFill} ${card.isComplete ? styles.progressComplete : ''}`}
            style={progressStyle}
          />
        </div>
      </div>
    </article>
  );
}

export function HomeSpecialCards({ cards, sectionTitle }: HomeSpecialCardsProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleNavigate = useCallback(
    (path: string) => {
      void navigate({ to: path });
    },
    [navigate]
  );

  return (
    <section className={styles.section}>
      {sectionTitle && <h2 className={styles.title}>{sectionTitle}</h2>}

      <div className={styles.list}>
        {cards.map((card) => {
          const accentColor = card.key === 'coca-cola' ? COCA_COLA_ACCENT : DEFAULT_ACCENT;

          return (
            <SpecialCard
              key={card.pageId}
              card={card}
              accentColor={accentColor}
              onNavigate={handleNavigate}
              t={t}
            />
          );
        })}
      </div>
    </section>
  );
}
