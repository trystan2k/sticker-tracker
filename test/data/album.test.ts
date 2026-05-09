import { describe, expect, it } from 'vitest';

import {
  ALBUM_TOTAL,
  COCA_COLA_COUNT,
  FWC_CLOSING_COUNT,
  FWC_OPENING_COUNT,
  GROUP_LIST,
  PAGE_TOTAL,
  SPECIAL_PAGE_COUNT,
  STICKERS_PER_GROUP,
  STICKERS_PER_TEAM,
  TEAM_PAGE_COUNT,
  TEAM_STICKER_RANGES,
  albumPages
} from '@/data/album';

const expectedPageOrder = [
  'fwc-opening',
  'mex',
  'rsa',
  'kor',
  'cze',
  'can',
  'bih',
  'qat',
  'sui',
  'bra',
  'mar',
  'hai',
  'sco',
  'usa',
  'par',
  'aus',
  'tur',
  'ger',
  'cuw',
  'civ',
  'ecu',
  'ned',
  'jpn',
  'swe',
  'tun',
  'bel',
  'egy',
  'irn',
  'nzl',
  'esp',
  'cpv',
  'ksa',
  'uru',
  'fra',
  'sen',
  'irq',
  'nor',
  'arg',
  'alg',
  'aut',
  'jor',
  'por',
  'cod',
  'uzb',
  'col',
  'eng',
  'cro',
  'gha',
  'pan',
  'fwc-closing',
  'coca-cola'
] as const;

const expectedSpecialStickerIds = {
  'fwc-opening': ['00', '1', '2', '3', '4', '5', '6', '7', '8'],
  'fwc-closing': ['9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'],
  'coca-cola': [
    'CC1',
    'CC2',
    'CC3',
    'CC4',
    'CC5',
    'CC6',
    'CC7',
    'CC8',
    'CC9',
    'CC10',
    'CC11',
    'CC12',
    'CC13',
    'CC14'
  ]
} as const;

describe('album dataset integrity', () => {
  it('matches expected page totals and composition', () => {
    expect(albumPages).toHaveLength(PAGE_TOTAL);

    const teamPages = albumPages.filter((page) => page.type === 'team');
    const specialPages = albumPages.filter((page) => page.type === 'special');

    expect(teamPages).toHaveLength(TEAM_PAGE_COUNT);
    expect(specialPages).toHaveLength(SPECIAL_PAGE_COUNT);
  });

  it('keeps team sticker range constants stable', () => {
    expect(TEAM_STICKER_RANGES).toEqual([
      { start: 1, end: 10 },
      { start: 11, end: 20 }
    ]);
  });

  it('keeps unique page ids and exact album order', () => {
    const pageIds = albumPages.map((page) => page.pageId);

    expect(pageIds).toEqual(expectedPageOrder);
    expect(new Set(pageIds).size).toBe(pageIds.length);
  });

  it('keeps unique sticker identifiers across full album and total 994 stickers', () => {
    const allStickerIds = albumPages.flatMap((page) => page.stickerIds);

    expect(allStickerIds).toHaveLength(ALBUM_TOTAL);
    expect(new Set(allStickerIds).size).toBe(allStickerIds.length);
  });

  it('enforces 80 stickers per group and all 12 groups present', () => {
    const teamPages = albumPages.filter((page) => page.type === 'team');

    const stickersByGroup = GROUP_LIST.map((group) => {
      const groupPages = teamPages.filter((page) => page.group === group);
      const groupTotal = groupPages.reduce((total, page) => total + page.stickerIds.length, 0);

      return { groupPages, groupTotal };
    });

    for (const { groupPages, groupTotal } of stickersByGroup) {
      expect(groupPages).toHaveLength(4);
      expect(groupTotal).toBe(STICKERS_PER_GROUP);
    }
  });

  it('enforces per-team metadata and sticker structure', () => {
    const teamPages = albumPages.filter((page) => page.type === 'team');

    const engPage = teamPages.find((page) => page.albumCode === 'ENG')!;
    const scoPage = teamPages.find((page) => page.albumCode === 'SCO')!;

    // England uses non-standard regional flag code
    expect(engPage.flagCode).toBe('gb-eng');
    // Scotland uses non-standard regional flag code
    expect(scoPage.flagCode).toBe('gb-sct');

    for (const page of teamPages) {
      expect(page.albumCode).toMatch(/^[A-Z]{3}$/);
      expect(page.albumCode.toLowerCase()).toBe(page.pageId);
      expect(page.translationKey).toBe(`team.${page.pageId}`);
      expect(page.stickerRanges).toEqual(TEAM_STICKER_RANGES);
      expect(page.stickerIds).toHaveLength(STICKERS_PER_TEAM);
      expect(page.flagCode.length).toBeGreaterThanOrEqual(2);
      expect(page.group).toMatch(/^[A-L]$/);

      const [first, ...rest] = page.stickerIds;
      expect(first).toBe(`${page.albumCode}-1`);
      expect(rest.at(-1)).toBe(`${page.albumCode}-${STICKERS_PER_TEAM}`);
    }
  });

  it('enforces special page counts and ordered sticker ids', () => {
    const specialPages = albumPages.filter((page) => page.type === 'special');

    const opening = specialPages.find((page) => page.key === 'fwc-opening');
    const closing = specialPages.find((page) => page.key === 'fwc-closing');
    const cocaCola = specialPages.find((page) => page.key === 'coca-cola');

    expect(opening).toBeDefined();
    expect(closing).toBeDefined();
    expect(cocaCola).toBeDefined();

    expect(opening!.stickerIds).toHaveLength(FWC_OPENING_COUNT);
    expect(closing!.stickerIds).toHaveLength(FWC_CLOSING_COUNT);
    expect(cocaCola!.stickerIds).toHaveLength(COCA_COLA_COUNT);

    expect(opening!.stickerIds).toEqual(expectedSpecialStickerIds['fwc-opening']);
    expect(closing!.stickerIds).toEqual(expectedSpecialStickerIds['fwc-closing']);
    expect(cocaCola!.stickerIds).toEqual(expectedSpecialStickerIds['coca-cola']);

    expect(opening!.translationKey).toBe('special.fwc-opening');
    expect(closing!.translationKey).toBe('special.fwc-closing');
    expect(cocaCola!.translationKey).toBe('special.coca-cola');
  });
});
