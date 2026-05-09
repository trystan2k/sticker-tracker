export const PAGE_TOTAL = 51;
export const TEAM_PAGE_COUNT = 48;
export const SPECIAL_PAGE_COUNT = 3;

export const STICKERS_PER_TEAM = 20;
export const STICKERS_PER_GROUP = 80;
export const ALBUM_TOTAL = 994;

export const FWC_OPENING_COUNT = 9;
export const FWC_CLOSING_COUNT = 11;
export const COCA_COLA_COUNT = 14;

export const GROUP_LIST = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;

export type Group = (typeof GROUP_LIST)[number];

export type StickerRange = Readonly<{
  start: number;
  end: number;
}>;

export const TEAM_STICKER_RANGES = [
  { start: 1, end: 10 },
  { start: 11, end: 20 }
] as const satisfies readonly StickerRange[];

export type PageId = string & { readonly __brand: 'PageId' };
export type StickerIdentifier = string & { readonly __brand: 'StickerIdentifier' };

export type TeamPage = Readonly<{
  type: 'team';
  pageId: PageId;
  albumCode: string;
  flagCode: string;
  translationKey: string;
  group: Group;
  stickerRanges: readonly StickerRange[];
  stickerIds: readonly StickerIdentifier[];
}>;

export type SpecialPage = Readonly<{
  type: 'special';
  pageId: PageId;
  key: 'fwc-opening' | 'fwc-closing' | 'coca-cola';
  translationKey: string;
  stickerIds: readonly StickerIdentifier[];
}>;

export type AlbumPage = TeamPage | SpecialPage;

function createPageId(value: string): PageId {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as PageId;
}

function createStickerIdentifier(value: string): StickerIdentifier {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as StickerIdentifier;
}

function createTeamPage(input: Omit<TeamPage, 'type'>): TeamPage {
  return {
    type: 'team',
    ...input
  };
}

function createSpecialPage(input: Omit<SpecialPage, 'type'>): SpecialPage {
  return {
    type: 'special',
    ...input
  };
}

function createRangeStickerIds(start: number, end: number): readonly StickerIdentifier[] {
  const stickerIds: StickerIdentifier[] = [];

  for (let index = start; index <= end; index += 1) {
    stickerIds.push(createStickerIdentifier(String(index)));
  }

  return stickerIds;
}

function createTeamStickerIds(albumCode: string): readonly StickerIdentifier[] {
  const stickerIds: StickerIdentifier[] = [];

  for (let index = 1; index <= STICKERS_PER_TEAM; index += 1) {
    stickerIds.push(createStickerIdentifier(`${albumCode}-${index}`));
  }

  return stickerIds;
}

const fwcOpeningPage = createSpecialPage({
  pageId: createPageId('fwc-opening'),
  key: 'fwc-opening',
  translationKey: 'special.fwc-opening',
  stickerIds: [createStickerIdentifier('00'), ...createRangeStickerIds(1, 8)]
});

const fwcClosingPage = createSpecialPage({
  pageId: createPageId('fwc-closing'),
  key: 'fwc-closing',
  translationKey: 'special.fwc-closing',
  stickerIds: createRangeStickerIds(9, 19)
});

const cocaColaPage = createSpecialPage({
  pageId: createPageId('coca-cola'),
  key: 'coca-cola',
  translationKey: 'special.coca-cola',
  stickerIds: Array.from({ length: COCA_COLA_COUNT }, (_, index) =>
    createStickerIdentifier(`CC${index + 1}`)
  )
});

export const albumPages: readonly AlbumPage[] = [
  fwcOpeningPage,
  createTeamPage({
    pageId: createPageId('mex'),
    albumCode: 'MEX',
    flagCode: 'mx',
    translationKey: 'team.mex',
    group: 'A',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('MEX')
  }),
  createTeamPage({
    pageId: createPageId('rsa'),
    albumCode: 'RSA',
    flagCode: 'za',
    translationKey: 'team.rsa',
    group: 'A',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('RSA')
  }),
  createTeamPage({
    pageId: createPageId('kor'),
    albumCode: 'KOR',
    flagCode: 'kr',
    translationKey: 'team.kor',
    group: 'A',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('KOR')
  }),
  createTeamPage({
    pageId: createPageId('cze'),
    albumCode: 'CZE',
    flagCode: 'cz',
    translationKey: 'team.cze',
    group: 'A',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('CZE')
  }),
  createTeamPage({
    pageId: createPageId('can'),
    albumCode: 'CAN',
    flagCode: 'ca',
    translationKey: 'team.can',
    group: 'B',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('CAN')
  }),
  createTeamPage({
    pageId: createPageId('bih'),
    albumCode: 'BIH',
    flagCode: 'ba',
    translationKey: 'team.bih',
    group: 'B',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('BIH')
  }),
  createTeamPage({
    pageId: createPageId('qat'),
    albumCode: 'QAT',
    flagCode: 'qa',
    translationKey: 'team.qat',
    group: 'B',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('QAT')
  }),
  createTeamPage({
    pageId: createPageId('sui'),
    albumCode: 'SUI',
    flagCode: 'ch',
    translationKey: 'team.sui',
    group: 'B',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('SUI')
  }),
  createTeamPage({
    pageId: createPageId('bra'),
    albumCode: 'BRA',
    flagCode: 'br',
    translationKey: 'team.bra',
    group: 'C',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('BRA')
  }),
  createTeamPage({
    pageId: createPageId('mar'),
    albumCode: 'MAR',
    flagCode: 'ma',
    translationKey: 'team.mar',
    group: 'C',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('MAR')
  }),
  createTeamPage({
    pageId: createPageId('hai'),
    albumCode: 'HAI',
    flagCode: 'ht',
    translationKey: 'team.hai',
    group: 'C',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('HAI')
  }),
  createTeamPage({
    pageId: createPageId('sco'),
    albumCode: 'SCO',
    flagCode: 'gb-sct',
    translationKey: 'team.sco',
    group: 'C',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('SCO')
  }),
  createTeamPage({
    pageId: createPageId('usa'),
    albumCode: 'USA',
    flagCode: 'us',
    translationKey: 'team.usa',
    group: 'D',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('USA')
  }),
  createTeamPage({
    pageId: createPageId('par'),
    albumCode: 'PAR',
    flagCode: 'py',
    translationKey: 'team.par',
    group: 'D',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('PAR')
  }),
  createTeamPage({
    pageId: createPageId('aus'),
    albumCode: 'AUS',
    flagCode: 'au',
    translationKey: 'team.aus',
    group: 'D',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('AUS')
  }),
  createTeamPage({
    pageId: createPageId('tur'),
    albumCode: 'TUR',
    flagCode: 'tr',
    translationKey: 'team.tur',
    group: 'D',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('TUR')
  }),
  createTeamPage({
    pageId: createPageId('ger'),
    albumCode: 'GER',
    flagCode: 'de',
    translationKey: 'team.ger',
    group: 'E',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('GER')
  }),
  createTeamPage({
    pageId: createPageId('cuw'),
    albumCode: 'CUW',
    flagCode: 'cw',
    translationKey: 'team.cuw',
    group: 'E',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('CUW')
  }),
  createTeamPage({
    pageId: createPageId('civ'),
    albumCode: 'CIV',
    flagCode: 'ci',
    translationKey: 'team.civ',
    group: 'E',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('CIV')
  }),
  createTeamPage({
    pageId: createPageId('ecu'),
    albumCode: 'ECU',
    flagCode: 'ec',
    translationKey: 'team.ecu',
    group: 'E',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('ECU')
  }),
  createTeamPage({
    pageId: createPageId('ned'),
    albumCode: 'NED',
    flagCode: 'nl',
    translationKey: 'team.ned',
    group: 'F',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('NED')
  }),
  createTeamPage({
    pageId: createPageId('jpn'),
    albumCode: 'JPN',
    flagCode: 'jp',
    translationKey: 'team.jpn',
    group: 'F',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('JPN')
  }),
  createTeamPage({
    pageId: createPageId('swe'),
    albumCode: 'SWE',
    flagCode: 'se',
    translationKey: 'team.swe',
    group: 'F',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('SWE')
  }),
  createTeamPage({
    pageId: createPageId('tun'),
    albumCode: 'TUN',
    flagCode: 'tn',
    translationKey: 'team.tun',
    group: 'F',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('TUN')
  }),
  createTeamPage({
    pageId: createPageId('bel'),
    albumCode: 'BEL',
    flagCode: 'be',
    translationKey: 'team.bel',
    group: 'G',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('BEL')
  }),
  createTeamPage({
    pageId: createPageId('egy'),
    albumCode: 'EGY',
    flagCode: 'eg',
    translationKey: 'team.egy',
    group: 'G',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('EGY')
  }),
  createTeamPage({
    pageId: createPageId('irn'),
    albumCode: 'IRN',
    flagCode: 'ir',
    translationKey: 'team.irn',
    group: 'G',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('IRN')
  }),
  createTeamPage({
    pageId: createPageId('nzl'),
    albumCode: 'NZL',
    flagCode: 'nz',
    translationKey: 'team.nzl',
    group: 'G',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('NZL')
  }),
  createTeamPage({
    pageId: createPageId('esp'),
    albumCode: 'ESP',
    flagCode: 'es',
    translationKey: 'team.esp',
    group: 'H',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('ESP')
  }),
  createTeamPage({
    pageId: createPageId('cpv'),
    albumCode: 'CPV',
    flagCode: 'cv',
    translationKey: 'team.cpv',
    group: 'H',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('CPV')
  }),
  createTeamPage({
    pageId: createPageId('ksa'),
    albumCode: 'KSA',
    flagCode: 'sa',
    translationKey: 'team.ksa',
    group: 'H',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('KSA')
  }),
  createTeamPage({
    pageId: createPageId('uru'),
    albumCode: 'URU',
    flagCode: 'uy',
    translationKey: 'team.uru',
    group: 'H',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('URU')
  }),
  createTeamPage({
    pageId: createPageId('fra'),
    albumCode: 'FRA',
    flagCode: 'fr',
    translationKey: 'team.fra',
    group: 'I',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('FRA')
  }),
  createTeamPage({
    pageId: createPageId('sen'),
    albumCode: 'SEN',
    flagCode: 'sn',
    translationKey: 'team.sen',
    group: 'I',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('SEN')
  }),
  createTeamPage({
    pageId: createPageId('irq'),
    albumCode: 'IRQ',
    flagCode: 'iq',
    translationKey: 'team.irq',
    group: 'I',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('IRQ')
  }),
  createTeamPage({
    pageId: createPageId('nor'),
    albumCode: 'NOR',
    flagCode: 'no',
    translationKey: 'team.nor',
    group: 'I',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('NOR')
  }),
  createTeamPage({
    pageId: createPageId('arg'),
    albumCode: 'ARG',
    flagCode: 'ar',
    translationKey: 'team.arg',
    group: 'J',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('ARG')
  }),
  createTeamPage({
    pageId: createPageId('alg'),
    albumCode: 'ALG',
    flagCode: 'dz',
    translationKey: 'team.alg',
    group: 'J',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('ALG')
  }),
  createTeamPage({
    pageId: createPageId('aut'),
    albumCode: 'AUT',
    flagCode: 'at',
    translationKey: 'team.aut',
    group: 'J',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('AUT')
  }),
  createTeamPage({
    pageId: createPageId('jor'),
    albumCode: 'JOR',
    flagCode: 'jo',
    translationKey: 'team.jor',
    group: 'J',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('JOR')
  }),
  createTeamPage({
    pageId: createPageId('por'),
    albumCode: 'POR',
    flagCode: 'pt',
    translationKey: 'team.por',
    group: 'K',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('POR')
  }),
  createTeamPage({
    pageId: createPageId('cod'),
    albumCode: 'COD',
    flagCode: 'cd',
    translationKey: 'team.cod',
    group: 'K',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('COD')
  }),
  createTeamPage({
    pageId: createPageId('uzb'),
    albumCode: 'UZB',
    flagCode: 'uz',
    translationKey: 'team.uzb',
    group: 'K',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('UZB')
  }),
  createTeamPage({
    pageId: createPageId('col'),
    albumCode: 'COL',
    flagCode: 'co',
    translationKey: 'team.col',
    group: 'K',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('COL')
  }),
  createTeamPage({
    pageId: createPageId('eng'),
    albumCode: 'ENG',
    flagCode: 'gb-eng',
    translationKey: 'team.eng',
    group: 'L',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('ENG')
  }),
  createTeamPage({
    pageId: createPageId('cro'),
    albumCode: 'CRO',
    flagCode: 'hr',
    translationKey: 'team.cro',
    group: 'L',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('CRO')
  }),
  createTeamPage({
    pageId: createPageId('gha'),
    albumCode: 'GHA',
    flagCode: 'gh',
    translationKey: 'team.gha',
    group: 'L',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('GHA')
  }),
  createTeamPage({
    pageId: createPageId('pan'),
    albumCode: 'PAN',
    flagCode: 'pa',
    translationKey: 'team.pan',
    group: 'L',
    stickerRanges: TEAM_STICKER_RANGES,
    stickerIds: createTeamStickerIds('PAN')
  }),
  fwcClosingPage,
  cocaColaPage
];
