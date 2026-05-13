import { useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import type { GroupCardData } from './home-state';
import styles from './HomeGroupCards.module.css';

type HomeGroupCardsProps = Readonly<{
  groups: readonly GroupCardData[];
}>;

const FLAG_FALLBACK_MAP: Record<string, string> = {
  'gb-eng': 'gb',
  'gb-sct': 'gb'
};

function buildFlagUrl(flagCode: string): string {
  return `https://flagcdn.com/w80/${flagCode.toLowerCase()}.png`;
}

function getSafeFlagCode(flagCode: string): string {
  return FLAG_FALLBACK_MAP[flagCode] ?? flagCode;
}

function handleFlagError(event: React.SyntheticEvent<HTMLImageElement>): void {
  const target = event.currentTarget;
  const fallbackCode = getSafeFlagCode(target.dataset.flagCode ?? '');
  const fallbackUrl = buildFlagUrl(fallbackCode);

  if (target.dataset.fallbackApplied === 'true') {
    return;
  }

  if (target.src.endsWith(`/${fallbackCode}.png`)) {
    target.dataset.fallbackApplied = 'true';
    return;
  }

  target.dataset.fallbackApplied = 'true';
  target.src = fallbackUrl;
}

type GroupCardProps = Readonly<{
  groupData: GroupCardData;
  onNavigate: (path: string) => void;
  t: ReturnType<typeof useTranslation>['t'];
}>;

function GroupCard({ groupData, onNavigate, t }: GroupCardProps) {
  const progressStyle = useMemo(
    () => ({ width: `${groupData.percentage}%` }),
    [groupData.percentage]
  );

  const handleGroupClick = useCallback(() => {
    onNavigate(groupData.firstPagePath);
  }, [onNavigate, groupData.firstPagePath]);

  return (
    <article className={`${styles.card} ${groupData.isComplete ? styles.cardComplete : ''}`}>
      <button
        type="button"
        className={styles.cardAction}
        onClick={handleGroupClick}
        aria-label={`${t(groupData.label, { group: groupData.group })} ${groupData.collected}/${groupData.total}`}
      />

      <header className={styles.cardHead}>
        <p className={styles.groupName}>{t(groupData.label, { group: groupData.group })}</p>
        <p className={styles.counter}>
          {groupData.collected}/{groupData.total}
        </p>
      </header>

      <div className={styles.progressTrack} aria-hidden="true">
        <div
          className={`${styles.progressFill} ${groupData.isComplete ? styles.progressComplete : ''}`}
          style={progressStyle}
        />
      </div>

      <div className={styles.teamsGrid}>
        {groupData.teams.map((team) => (
          <TeamTile
            key={team.pageId}
            team={team}
            teamPath={team.path}
            onNavigate={onNavigate}
            t={t}
          />
        ))}
      </div>
    </article>
  );
}

type TeamTileProps = Readonly<{
  team: GroupCardData['teams'][number];
  teamPath: string;
  onNavigate: (path: string) => void;
  t: ReturnType<typeof useTranslation>['t'];
}>;

function TeamTile({ team, teamPath, onNavigate, t }: TeamTileProps) {
  const handleTeamClick = useCallback(() => {
    onNavigate(teamPath);
  }, [onNavigate, teamPath]);

  return (
    <button type="button" className={styles.teamTile} onClick={handleTeamClick}>
      <img
        className={styles.flagImage}
        src={buildFlagUrl(team.flagCode)}
        alt={t(team.name)}
        loading="lazy"
        data-flag-code={team.flagCode}
        onError={handleFlagError}
      />

      <div className={styles.teamOverlay}>
        <p className={styles.teamCode}>{team.albumCode}</p>
        <p className={styles.teamName}>{t(team.name)}</p>
      </div>
    </button>
  );
}

export function HomeGroupCards({ groups }: HomeGroupCardsProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleNavigate = useCallback(
    (path: string) => {
      void navigate({ to: path });
    },
    [navigate]
  );

  return (
    <section className={styles.section} aria-labelledby="home-groups-title">
      <h2 id="home-groups-title" className={styles.title}>
        {t('home.groups.title')}
      </h2>

      <div className={styles.list}>
        {groups.map((groupData) => (
          <GroupCard
            key={groupData.group}
            groupData={groupData}
            onNavigate={handleNavigate}
            t={t}
          />
        ))}
      </div>
    </section>
  );
}
