import { albumPages, type AlbumPage, type StickerIdentifier } from '@/data/album';
import {
  read,
  type PersistedScannerLookup,
  type PersistedScannerLookupEntry,
  write
} from '@/lib/storage/app-storage';
import { hydrateCollectionState } from '@/services/collection-service';
import { parseStickerNumber } from '@/services/scanner-parser';

export type StickerLookupResult =
  | {
      state: 'matched';
      stickerId: StickerIdentifier;
      pageId: PersistedScannerLookupEntry['pageId'];
      pageType: PersistedScannerLookupEntry['pageType'];
      translationKey: string;
      albumCode: string | null;
      group: string | null;
      flagCode: string | null;
      hasSticker: boolean;
      missingSticker: boolean;
    }
  | {
      state: 'unmatched';
      reason: 'parse-failed' | 'unknown-sticker' | 'storage-unavailable';
      parsedCode: string | null;
    };

let lookupCache: PersistedScannerLookup | null = null;

function appendHash(hash: number, value: string): number {
  let nextHash = hash;

  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index);
    nextHash ^= codePoint;
    nextHash = Math.imul(nextHash, 16_777_619);
  }

  return nextHash >>> 0;
}

function createLookupEntry(
  page: AlbumPage,
  stickerId: StickerIdentifier
): PersistedScannerLookupEntry {
  if (page.type === 'team') {
    return {
      stickerId,
      pageId: page.pageId,
      pageType: page.type,
      translationKey: page.translationKey,
      albumCode: page.albumCode,
      group: page.group,
      flagCode: page.flagCode
    };
  }

  return {
    stickerId,
    pageId: page.pageId,
    pageType: page.type,
    translationKey: page.translationKey,
    albumCode: null,
    group: null,
    flagCode: null
  };
}

export function getScannerLookupVersion(): number {
  let hash = 2_166_136_261;

  for (const page of albumPages) {
    hash = appendHash(hash, page.pageId);
    hash = appendHash(hash, page.type);
    hash = appendHash(hash, page.translationKey);
    hash = appendHash(hash, page.type === 'team' ? page.albumCode : '');
    hash = appendHash(hash, page.type === 'team' ? page.group : '');
    hash = appendHash(hash, page.type === 'team' ? page.flagCode : '');

    for (const stickerId of page.stickerIds) {
      hash = appendHash(hash, stickerId);
    }
  }

  return hash;
}

export function buildScannerLookupIndex(): PersistedScannerLookup {
  const entries: Record<string, PersistedScannerLookupEntry> = {};

  for (const page of albumPages) {
    for (const stickerId of page.stickerIds) {
      entries[stickerId] = createLookupEntry(page, stickerId);
    }
  }

  return {
    version: getScannerLookupVersion(),
    entries
  };
}

export async function ensureScannerLookupIndex(): Promise<PersistedScannerLookup | null> {
  const expectedVersion = getScannerLookupVersion();

  const readResult = await read('scannerLookup');

  if (readResult.state !== 'ready') {
    return null;
  }

  if (readResult.value && readResult.value.version === expectedVersion) {
    if (lookupCache && lookupCache.version === expectedVersion) {
      return lookupCache;
    }

    lookupCache = readResult.value;

    return lookupCache;
  }

  const rebuiltIndex = buildScannerLookupIndex();
  const writeResult = await write('scannerLookup', rebuiltIndex);

  if (writeResult.state !== 'ready') {
    return null;
  }

  lookupCache = rebuiltIndex;

  return lookupCache;
}

export function findScannerMatch(
  lookup: PersistedScannerLookup,
  normalizedCode: string
): PersistedScannerLookupEntry | null {
  return lookup.entries[normalizedCode] ?? null;
}

export async function lookupSticker(ocrText: string): Promise<StickerLookupResult> {
  const parsedSticker = parseStickerNumber(ocrText);

  if (parsedSticker.state !== 'matched') {
    return {
      state: 'unmatched',
      reason: 'parse-failed',
      parsedCode: null
    };
  }

  const lookup = await ensureScannerLookupIndex();

  if (!lookup) {
    return {
      state: 'unmatched',
      reason: 'storage-unavailable',
      parsedCode: parsedSticker.code
    };
  }

  const match = findScannerMatch(lookup, parsedSticker.code);

  if (!match) {
    return {
      state: 'unmatched',
      reason: 'unknown-sticker',
      parsedCode: parsedSticker.code
    };
  }

  const collectionRead = await read('collection');

  if (collectionRead.state !== 'ready') {
    return {
      state: 'unmatched',
      reason: 'storage-unavailable',
      parsedCode: parsedSticker.code
    };
  }

  const collectionState = hydrateCollectionState(collectionRead.value);
  const pageState = collectionState[match.pageId];
  const hasSticker = pageState ? pageState.has(match.stickerId) : false;

  return {
    state: 'matched',
    stickerId: match.stickerId,
    pageId: match.pageId,
    pageType: match.pageType,
    translationKey: match.translationKey,
    albumCode: match.albumCode,
    group: match.group,
    flagCode: match.flagCode,
    hasSticker,
    missingSticker: !hasSticker
  };
}
