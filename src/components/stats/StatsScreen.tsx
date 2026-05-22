import { type ReactNode, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { GROUP_LIST, STICKERS_PER_GROUP } from '@/data/album';

import type { StatsState } from './stats-state';
import styles from './StatsScreen.module.css';

type StatsScreenProps = Readonly<{
  onBack: () => void;
  state: StatsState;
}>;

export function StatsScreen({ onBack, state }: StatsScreenProps) {
  const { t, i18n } = useTranslation();
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.resolvedLanguage ?? i18n.language),
    [i18n.language, i18n.resolvedLanguage]
  );

  const readyState = state.kind === 'ready' ? state : null;
  const renderEmptyState = readyState === null;

  const heroSummary =
    state.kind === 'ready'
      ? {
          completedGroups: state.completedGroups,
          incompleteGroups: state.incompleteGroups
        }
      : {
          completedGroups: state.kind === 'all-complete' ? GROUP_LIST : [],
          incompleteGroups: state.kind === 'zero-progress' ? GROUP_LIST : []
        };

  const heroCards = [
    {
      key: 'completed',
      tone: 'success' as const,
      label: t('stats.labels.completedGroups'),
      value:
        heroSummary.completedGroups.length === 0 ? '—' : heroSummary.completedGroups.join(', '),
      detail: t('stats.hero.completedCount', {
        count: numberFormatter.format(heroSummary.completedGroups.length)
      })
    },
    {
      key: 'incomplete',
      tone: 'warning' as const,
      label: t('stats.labels.incompleteGroups'),
      value:
        heroSummary.incompleteGroups.length === 0 ? '—' : heroSummary.incompleteGroups.join(', '),
      detail: t('stats.hero.incompleteCount', {
        count: numberFormatter.format(heroSummary.incompleteGroups.length)
      })
    }
  ];

  const groupSummaryCards =
    state.kind === 'ready'
      ? [
          {
            key: 'topGroup',
            tone: 'success' as const,
            chip: t('stats.panorama.mostStickers'),
            value: `${t('stats.labels.group')} ${state.groups.moreStickers.group}`,
            meta: t('stats.panorama.collectedCount', {
              collected: `${numberFormatter.format(state.groups.moreStickers.collected)}/${numberFormatter.format(state.groups.moreStickers.total)}`
            })
          },
          {
            key: 'bottomGroup',
            tone: 'warning' as const,
            chip: t('stats.panorama.lessStickers'),
            value: `${t('stats.labels.group')} ${state.groups.lessStickers.group}`,
            meta: t('stats.panorama.collectedCount', {
              collected: `${numberFormatter.format(state.groups.lessStickers.collected)}/${numberFormatter.format(state.groups.lessStickers.total)}`
            })
          },
          {
            key: 'completedGroups',
            tone: 'success' as const,
            chip: t('stats.panorama.closed'),
            value: t('stats.panorama.groupsCount', {
              count: numberFormatter.format(state.completedGroups.length)
            }),
            meta:
              state.completedGroups.length === 0
                ? t('stats.labels.none')
                : state.completedGroups.join(', ')
          },
          {
            key: 'incompleteGroups',
            tone: 'warning' as const,
            chip: t('stats.panorama.open'),
            value: t('stats.panorama.groupsCount', {
              count: numberFormatter.format(state.incompleteGroups.length)
            }),
            meta:
              state.incompleteGroups.length === 0
                ? t('stats.labels.none')
                : state.incompleteGroups.join(', ')
          }
        ]
      : [
          {
            key: 'topGroup',
            tone: 'success' as const,
            chip: t('stats.panorama.mostStickers'),
            value: t('stats.labels.none'),
            meta: t('stats.panorama.collectedCount', {
              collected: `0/${numberFormatter.format(STICKERS_PER_GROUP)}`
            })
          },
          {
            key: 'bottomGroup',
            tone: 'warning' as const,
            chip: t('stats.panorama.lessStickers'),
            value: t('stats.labels.none'),
            meta: t('stats.panorama.collectedCount', {
              collected: `0/${numberFormatter.format(STICKERS_PER_GROUP)}`
            })
          },
          {
            key: 'completedGroups',
            tone: 'success' as const,
            chip: t('stats.panorama.closed'),
            value: t('stats.panorama.groupsCount', {
              count:
                state.kind === 'all-complete'
                  ? numberFormatter.format(GROUP_LIST.length)
                  : numberFormatter.format(0)
            }),
            meta:
              state.kind === 'all-complete' ? t('stats.labels.allGroups') : t('stats.labels.none')
          },
          {
            key: 'incompleteGroups',
            tone: 'warning' as const,
            chip: t('stats.panorama.open'),
            value: t('stats.panorama.groupsCount', {
              count:
                state.kind === 'zero-progress'
                  ? numberFormatter.format(GROUP_LIST.length)
                  : numberFormatter.format(0)
            }),
            meta:
              state.kind === 'zero-progress' ? t('stats.labels.allGroups') : t('stats.labels.none')
          }
        ];

  const renderSpotlightCard = ({
    tone,
    chip,
    topValue,
    badge,
    title,
    subtitle,
    collected,
    total,
    metricOverride,
    progressLabel,
    hideRatio
  }: {
    tone: 'success' | 'warning' | 'neutral';
    chip: string;
    topValue: string;
    badge: ReactNode;
    title: string;
    subtitle: string;
    collected: number;
    total: number;
    metricOverride?: string;
    progressLabel?: string;
    hideRatio?: boolean;
  }) => {
    const metric =
      metricOverride ?? `${numberFormatter.format(collected)}/${numberFormatter.format(total)}`;
    const resolvedProgressLabel =
      progressLabel ?? t('stats.spotlight.collectedLabel', { collected: metric });

    return (
      <article
        className={`${styles.spotlightCard} ${tone === 'success' ? styles.spotlightCardSuccess : tone === 'warning' ? styles.spotlightCardWarning : styles.spotlightCardNeutral}`}
      >
        <div className={styles.spotlightHeaderRow}>
          <span
            className={`${styles.spotlightChip} ${tone === 'success' ? styles.spotlightChipSuccess : tone === 'warning' ? styles.spotlightChipWarning : styles.spotlightChipNeutral}`}
          >
            {chip}
          </span>
          <span
            className={`${styles.spotlightTopValue} ${tone === 'success' ? styles.spotlightTopValueSuccess : tone === 'warning' ? styles.spotlightTopValueWarning : styles.spotlightTopValueNeutral}`}
          >
            {topValue}
          </span>
        </div>
        <div className={styles.spotlightMainRow}>
          <span className={styles.spotlightBadge} aria-hidden="true">
            {badge}
          </span>
          <div className={styles.spotlightTextWrap}>
            <p className={styles.spotlightTitle}>{title}</p>
            <p className={styles.spotlightSubtitle}>{subtitle}</p>
          </div>
          <p
            className={`${styles.spotlightMetric} ${tone === 'success' ? styles.spotlightMetricSuccess : tone === 'warning' ? styles.spotlightMetricWarning : styles.spotlightMetricNeutral}`}
          >
            {metric}
          </p>
        </div>
        <div className={styles.progressBlock}>
          <p className={styles.progressLabel}>{resolvedProgressLabel}</p>
          <progress
            className={`${styles.progressTrack} ${tone === 'success' ? styles.progressTrackSuccess : tone === 'warning' ? styles.progressTrackWarning : styles.progressTrackNeutral}`}
            value={hideRatio ? 0 : collected}
            max={hideRatio ? 1 : total}
            aria-label={`${title} — ${resolvedProgressLabel}`}
          />
        </div>
      </article>
    );
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onBack}
          aria-label={t('stats.header.back')}
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>{t('stats.header.title')}</h1>
        <span className={styles.headerSpacer} aria-hidden="true" />
      </header>

      <section className={styles.content} aria-label={t('stats.content.regionLabel')}>
        <a href="#stats-spotlight-section-title" className={styles.skipContentLink}>
          {t('stats.content.skipLink')}
        </a>
        <section className={styles.heroSummarySection}>
          <article className={styles.heroCard}>
            <p className={styles.heroChip}>{t('stats.intro.chip')}</p>
            <h2 className={styles.heroTitle}>{t('stats.intro.title')}</h2>

            <div className={styles.heroStatsGrid}>
              {heroCards.map((card) => (
                <article
                  key={card.key}
                  className={`${styles.heroStatsCard} ${card.tone === 'success' ? styles.heroStatsCardSuccess : styles.heroStatsCardWarning}`}
                >
                  <p className={styles.heroStatsTopLine}>{card.label}</p>
                  <p className={styles.heroStatsValue}>{card.value}</p>
                  <p className={styles.heroStatsBottomLine}>{card.detail}</p>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section className={styles.section} aria-labelledby="stats-spotlight-section-title">
          <h2 id="stats-spotlight-section-title" className={styles.sectionTitle}>
            {t('stats.sections.spotlight')}
          </h2>
          {renderEmptyState ? (
            <div className={styles.spotlightGrid}>
              {renderSpotlightCard({
                tone: 'neutral',
                chip: t('stats.spotlight.mostStickers'),
                topValue: '—',
                badge: '—',
                title: t('stats.labels.none'),
                subtitle: t('stats.empty.description'),
                collected: 0,
                total: 1,
                metricOverride: '—',
                progressLabel: '—',
                hideRatio: true
              })}
              {renderSpotlightCard({
                tone: 'neutral',
                chip: t('stats.spotlight.lessStickers'),
                topValue: '—',
                badge: '—',
                title: t('stats.labels.none'),
                subtitle: t('stats.empty.description'),
                collected: 0,
                total: 1,
                metricOverride: '—',
                progressLabel: '—',
                hideRatio: true
              })}
            </div>
          ) : (
            <div className={styles.spotlightGrid}>
              {renderSpotlightCard({
                tone: 'success',
                chip: t('stats.spotlight.mostStickers'),
                topValue: t('stats.spotlight.missingCount', {
                  count: numberFormatter.format(
                    readyState.teams.moreStickers.total - readyState.teams.moreStickers.collected
                  )
                }),
                badge: <span className={`fi fi-${readyState.teams.moreStickers.flagCode}`} />,
                title: t(readyState.teams.moreStickers.translationKey),
                subtitle: t('stats.spotlight.closestToFinish', {
                  group: readyState.teams.moreStickers.group
                }),
                collected: readyState.teams.moreStickers.collected,
                total: readyState.teams.moreStickers.total,
                progressLabel: t('stats.spotlight.collectedLabel', {
                  collected: `${numberFormatter.format(readyState.teams.moreStickers.collected)}/${numberFormatter.format(readyState.teams.moreStickers.total)}`
                })
              })}
              {renderSpotlightCard({
                tone: 'warning',
                chip: t('stats.spotlight.lessStickers'),
                topValue: t('stats.spotlight.missingCount', {
                  count: numberFormatter.format(
                    readyState.teams.lessStickers.total - readyState.teams.lessStickers.collected
                  )
                }),
                badge: <span className={`fi fi-${readyState.teams.lessStickers.flagCode}`} />,
                title: t(readyState.teams.lessStickers.translationKey),
                subtitle: t('stats.spotlight.largestDelay', {
                  group: readyState.teams.lessStickers.group
                }),
                collected: readyState.teams.lessStickers.collected,
                total: readyState.teams.lessStickers.total,
                progressLabel: t('stats.spotlight.collectedLabel', {
                  collected: `${numberFormatter.format(readyState.teams.lessStickers.collected)}/${numberFormatter.format(readyState.teams.lessStickers.total)}`
                })
              })}
            </div>
          )}
        </section>

        <section className={styles.section} aria-labelledby="stats-panorama-section-title">
          <h2 id="stats-panorama-section-title" className={styles.sectionTitle}>
            {t('stats.sections.panorama')}
          </h2>

          <div className={styles.panoramaGrid}>
            {groupSummaryCards.map((card) => (
              <article
                key={card.key}
                className={`${styles.panoramaCard} ${card.tone === 'success' ? styles.panoramaCardSuccess : styles.panoramaCardWarning}`}
              >
                <span
                  className={`${styles.panoramaChip} ${card.tone === 'success' ? styles.panoramaChipSuccess : styles.panoramaChipWarning}`}
                >
                  {card.chip}
                </span>
                <p className={styles.panoramaValue}>{card.value}</p>
                <p
                  className={`${styles.panoramaMeta} ${card.tone === 'success' ? styles.panoramaMetaSuccess : styles.panoramaMetaWarning}`}
                >
                  {card.meta}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className={styles.safeAreaSpacer} aria-hidden="true" />
      </section>
    </div>
  );
}
