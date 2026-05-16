export type StickerParseResult =
  | {
      state: 'matched';
      code: string;
    }
  | {
      state: 'unmatched';
    };

type StickerParser = (normalizedText: string) => string | null;

function normalizeText(rawText: string): string {
  return rawText
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function normalizeTeamCode(albumCode: string, rawNumber: string): string | null {
  const normalizedNumber = Number.parseInt(rawNumber, 10);

  if (Number.isNaN(normalizedNumber)) {
    return null;
  }

  return `${albumCode}-${normalizedNumber}`;
}

function parseTeamCode(normalizedText: string): string | null {
  const separatedTeamMatches = normalizedText.matchAll(/(?:^| )([A-Z]{3}) (\d{1,3})(?=$| )/g);

  for (const match of separatedTeamMatches) {
    const albumCode = match[1];
    const rawNumber = match[2];

    if (!albumCode || !rawNumber) {
      continue;
    }

    const normalizedTeamCode = normalizeTeamCode(albumCode, rawNumber);

    if (normalizedTeamCode) {
      return normalizedTeamCode;
    }
  }

  const compactTeamMatches = normalizedText.matchAll(/(?:^| )([A-Z]{3})(\d{1,3})(?=$| )/g);

  for (const match of compactTeamMatches) {
    const albumCode = match[1];
    const rawNumber = match[2];

    if (!albumCode || !rawNumber) {
      continue;
    }

    const normalizedTeamCode = normalizeTeamCode(albumCode, rawNumber);

    if (normalizedTeamCode) {
      return normalizedTeamCode;
    }
  }

  return null;
}

function parseOpeningSticker(normalizedText: string): string | null {
  const tokens = normalizedText.split(' ');
  return tokens.includes('00') ? '00' : null;
}

function parseFwcCode(normalizedText: string): string | null {
  const separatedFwcMatches = normalizedText.matchAll(/(?:^| )FWC (00|0?[1-9]|1[0-9])(?=$| )/g);

  for (const match of separatedFwcMatches) {
    const rawNumber = match[1];

    if (!rawNumber) {
      continue;
    }

    if (rawNumber === '00') {
      return '00';
    }

    return String(Number.parseInt(rawNumber, 10));
  }

  const compactFwcMatches = normalizedText.matchAll(/(?:^| )FWC(00|0?[1-9]|1[0-9])(?=$| )/g);

  for (const match of compactFwcMatches) {
    const rawNumber = match[1];

    if (!rawNumber) {
      continue;
    }

    if (rawNumber === '00') {
      return '00';
    }

    return String(Number.parseInt(rawNumber, 10));
  }

  return null;
}

function parseCcCode(normalizedText: string): string | null {
  const separatedCcMatches = normalizedText.matchAll(/(?:^| )CC (\d{1,2})(?=$| )/g);

  for (const match of separatedCcMatches) {
    const rawNumber = match[1];

    if (!rawNumber) {
      continue;
    }

    const normalizedNumber = Number.parseInt(rawNumber, 10);

    if (!Number.isNaN(normalizedNumber) && normalizedNumber >= 1 && normalizedNumber <= 14) {
      return `CC${normalizedNumber}`;
    }
  }

  const compactCcMatches = normalizedText.matchAll(/(?:^| )CC(\d{1,2})(?=$| )/g);

  for (const match of compactCcMatches) {
    const rawNumber = match[1];

    if (!rawNumber) {
      continue;
    }

    const normalizedNumber = Number.parseInt(rawNumber, 10);

    if (!Number.isNaN(normalizedNumber) && normalizedNumber >= 1 && normalizedNumber <= 14) {
      return `CC${normalizedNumber}`;
    }
  }

  return null;
}

const parserPipeline: readonly StickerParser[] = [
  parseFwcCode,
  parseOpeningSticker,
  parseCcCode,
  parseTeamCode
];

export function parseStickerNumber(rawText: string): StickerParseResult {
  const normalizedText = normalizeText(rawText);

  for (const parser of parserPipeline) {
    const parsedCode = parser(normalizedText);

    if (parsedCode) {
      return {
        state: 'matched',
        code: parsedCode
      };
    }
  }

  return {
    state: 'unmatched'
  };
}
