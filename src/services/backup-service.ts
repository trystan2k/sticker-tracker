import { albumPages } from '@/data/album';
import type { PersistedCollection } from '@/lib/storage/app-storage';
import { serializeCollectionState, type CollectionState } from '@/services/collection-service';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/services/locale-service';
import { SUPPORTED_THEMES, type ThemeValue } from '@/services/theme-service';
import { APP_VERSION } from '@/version';

type BackupPayload = {
  version: 1;
  exportedAt: string;
  appVersion: string;
  collection: PersistedCollection;
  locale?: string;
  theme?: string;
};

type BackupDownloadResult = { state: 'success' } | { state: 'cancelled' } | { state: 'error' };

export type BackupErrorCode =
  | 'read-error'
  | 'invalid-json'
  | 'invalid-schema'
  | 'unsupported-version'
  | 'missing-collection'
  | 'invalid-collection'
  | 'invalid-page-id'
  | 'invalid-sticker-id'
  | 'duplicate-sticker-id'
  | 'invalid-locale'
  | 'invalid-theme';

export type BackupRestoreReadResult =
  | {
      state: 'success';
      collection: PersistedCollection;
      locale?: SupportedLocale;
      theme?: ThemeValue;
    }
  | { state: 'cancelled' }
  | { state: 'error'; code: BackupErrorCode; metadata?: { pageId?: string; stickerId?: string } };

type BackupParseResult = {
  state:
    | 'success'
    | 'invalid-json'
    | 'invalid-schema'
    | 'unsupported-version'
    | 'missing-collection'
    | 'invalid-collection'
    | 'invalid-page-id'
    | 'invalid-sticker-id'
    | 'duplicate-sticker-id'
    | 'invalid-locale'
    | 'invalid-theme'
    | 'error';
  collection?: PersistedCollection;
  locale?: SupportedLocale;
  theme?: ThemeValue;
  metadata?: { pageId?: string; stickerId?: string };
};

type SaveFilePickerType = {
  accept: Record<string, string[]>;
  description: string;
};

type SaveFilePickerOptions = {
  suggestedName: string;
  types: SaveFilePickerType[];
};

type OpenFilePickerType = {
  accept: Record<string, string[]>;
  description: string;
};

type OpenFilePickerOptions = {
  types: OpenFilePickerType[];
};

type FileSystemWritableFileStreamLike = {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
};

type FileSystemFileHandleLike = {
  createWritable: () => Promise<FileSystemWritableFileStreamLike>;
  getFile: () => Promise<File>;
};

type SaveFilePickerFunction = (options: SaveFilePickerOptions) => Promise<FileSystemFileHandleLike>;

type OpenFilePickerFunction = (
  options: OpenFilePickerOptions
) => Promise<readonly FileSystemFileHandleLike[]>;

const BACKUP_FILE_MIME_TYPE = 'application/json';

const pageById = new Map(albumPages.map((page) => [page.pageId as string, page]));
const stickerIdsByPage = new Map(
  albumPages.map(
    (page) => [page.pageId as string, new Set(page.stickerIds as readonly string[])] as const
  )
);

function createBackupBlob(payload: BackupPayload): Blob {
  return new Blob([JSON.stringify(payload, null, 2)], {
    type: BACKUP_FILE_MIME_TYPE
  });
}

function getSaveFilePicker(): SaveFilePickerFunction | null {
  const picker = (window as Window & { showSaveFilePicker?: SaveFilePickerFunction })
    .showSaveFilePicker;

  if (!picker) {
    return null;
  }

  return picker;
}

function getOpenFilePicker(): OpenFilePickerFunction | null {
  const picker = (window as Window & { showOpenFilePicker?: OpenFilePickerFunction })
    .showOpenFilePicker;

  if (!picker) {
    return null;
  }

  return picker;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function triggerAnchorDownload(payload: BackupPayload): void {
  const backupBlob = createBackupBlob(payload);
  const objectUrl = URL.createObjectURL(backupBlob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = buildBackupFileName(payload.exportedAt);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseResultToErrorCode(state: BackupParseResult['state']): BackupErrorCode {
  if (state === 'error') {
    return 'read-error';
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return state as BackupErrorCode;
}

function isPersistedCollectionRecord(value: unknown): value is Record<string, unknown> {
  return isObjectRecord(value);
}

function isValidISODateString(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString() === value;
}

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.some((supportedLocale) => supportedLocale === locale);
}

function isSupportedTheme(theme: string): theme is ThemeValue {
  return SUPPORTED_THEMES.some((supportedTheme) => supportedTheme === theme);
}

export function generateBackupPayload(
  collection: CollectionState,
  locale?: string,
  theme?: string
): BackupPayload {
  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    collection: serializeCollectionState(collection)
  };

  if (locale !== undefined) {
    payload.locale = locale;
  }

  if (theme !== undefined) {
    payload.theme = theme;
  }

  return payload;
}

function buildBackupFileName(exportedAt: string): string {
  const safeName = exportedAt.replace(/[:]/g, '-').replace(/\..*$/, '');
  return `sticker-tracker-backup-${safeName}.json`;
}

export async function triggerBackupDownload(payload: BackupPayload): Promise<BackupDownloadResult> {
  try {
    const saveFilePicker = getSaveFilePicker();

    if (saveFilePicker) {
      const handle = await saveFilePicker({
        suggestedName: buildBackupFileName(payload.exportedAt),
        types: [
          {
            description: 'JSON files',
            accept: {
              [BACKUP_FILE_MIME_TYPE]: ['.json']
            }
          }
        ]
      });

      const writable = await handle.createWritable();
      await writable.write(createBackupBlob(payload));
      await writable.close();

      return { state: 'success' };
    }

    triggerAnchorDownload(payload);
    return { state: 'success' };
  } catch (error) {
    if (isAbortError(error)) {
      return { state: 'cancelled' };
    }

    return { state: 'error' };
  }
}

export function parseAndValidate(rawText: string): BackupParseResult {
  let payload: unknown;

  try {
    payload = JSON.parse(rawText) as unknown;
  } catch {
    return { state: 'invalid-json' };
  }

  if (!isObjectRecord(payload)) {
    return { state: 'invalid-schema' };
  }

  if (!('version' in payload)) {
    return { state: 'invalid-schema' };
  }

  if (payload.version !== 1) {
    return { state: 'unsupported-version' };
  }

  if (typeof payload.exportedAt !== 'string' || !isValidISODateString(payload.exportedAt)) {
    return { state: 'invalid-schema' };
  }

  if (typeof payload.appVersion !== 'string') {
    return { state: 'invalid-schema' };
  }

  if (!('collection' in payload)) {
    return { state: 'missing-collection' };
  }

  if (!isPersistedCollectionRecord(payload.collection)) {
    return { state: 'invalid-collection' };
  }

  const persistedCollection = payload.collection;
  const normalizedCollection: Record<string, string[]> = {};

  for (const [rawPageId, rawStickerIds] of Object.entries(persistedCollection)) {
    if (typeof rawPageId !== 'string' || rawPageId.length === 0) {
      return {
        state: 'invalid-page-id'
      };
    }

    if (!pageById.has(rawPageId)) {
      return {
        state: 'invalid-page-id',
        metadata: {
          pageId: rawPageId
        }
      };
    }

    if (rawStickerIds === null || !Array.isArray(rawStickerIds)) {
      return {
        state: 'invalid-collection',
        metadata: {
          pageId: rawPageId
        }
      };
    }

    const stickerSet = stickerIdsByPage.get(rawPageId);

    if (!stickerSet) {
      return {
        state: 'invalid-page-id',
        metadata: {
          pageId: rawPageId
        }
      };
    }

    const seen = new Set<string>();

    const normalizedStickerIds: string[] = [];

    for (const rawStickerId of rawStickerIds) {
      if (typeof rawStickerId !== 'string') {
        return {
          state: 'invalid-sticker-id',
          metadata: {
            pageId: rawPageId
          }
        };
      }

      if (!stickerSet.has(rawStickerId)) {
        return {
          state: 'invalid-sticker-id',
          metadata: {
            pageId: rawPageId,
            stickerId: rawStickerId
          }
        };
      }

      if (seen.has(rawStickerId)) {
        return {
          state: 'duplicate-sticker-id',
          metadata: {
            pageId: rawPageId,
            stickerId: rawStickerId
          }
        };
      }

      seen.add(rawStickerId);
      normalizedStickerIds.push(rawStickerId);
    }

    normalizedCollection[rawPageId] = normalizedStickerIds;
  }

  if (payload.locale !== undefined) {
    if (typeof payload.locale !== 'string' || !isSupportedLocale(payload.locale)) {
      return { state: 'invalid-locale' };
    }
  }

  if (payload.theme !== undefined) {
    if (typeof payload.theme !== 'string' || !isSupportedTheme(payload.theme)) {
      return { state: 'invalid-theme' };
    }
  }

  return {
    state: 'success',
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    collection: normalizedCollection as unknown as PersistedCollection,
    ...(payload.locale !== undefined ? { locale: payload.locale } : {}),
    ...(payload.theme !== undefined ? { theme: payload.theme } : {})
  };
}

async function readFromInputFallback(): Promise<string | null> {
  return await new Promise<string | null>((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';

    const cleanup = (): void => {
      input.removeEventListener('change', handleChange);
      window.removeEventListener('focus', handleFocus);

      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };

    const handleFocus = (): void => {
      setTimeout(() => {
        if (input.files?.length) {
          return;
        }

        cleanup();
        resolve(null);
      }, 0);
    };

    const handleChange = (): void => {
      const file = input.files?.[0];

      if (!file) {
        cleanup();
        resolve(null);
        return;
      }

      const reader = new FileReader();

      reader.addEventListener('load', () => {
        cleanup();
        resolve(typeof reader.result === 'string' ? reader.result : null);
      });

      reader.addEventListener('error', () => {
        cleanup();
        reject(new Error('file-read-error'));
      });

      reader.readAsText(file);
    };

    input.addEventListener('change', handleChange);
    window.addEventListener('focus', handleFocus, { once: true });
    document.body.appendChild(input);
    input.click();
  });
}

export async function triggerRestore(): Promise<BackupRestoreReadResult> {
  try {
    const openFilePicker = getOpenFilePicker();
    let rawText: string | null = null;

    if (openFilePicker) {
      const [fileHandle] = await openFilePicker({
        types: [
          {
            description: 'Backup JSON',
            accept: {
              [BACKUP_FILE_MIME_TYPE]: ['.json']
            }
          }
        ]
      });

      if (!fileHandle) {
        return { state: 'cancelled' };
      }

      const file = await fileHandle.getFile();
      rawText = await file.text();
    } else {
      rawText = await readFromInputFallback();
    }

    if (rawText === null) {
      return { state: 'cancelled' };
    }

    const parseResult = parseAndValidate(rawText);

    if (parseResult.state === 'success' && parseResult.collection) {
      return {
        state: 'success',
        collection: parseResult.collection,
        ...(parseResult.locale !== undefined ? { locale: parseResult.locale } : {}),
        ...(parseResult.theme !== undefined ? { theme: parseResult.theme } : {})
      };
    }

    // Map parse failure states to BackupErrorCode
    const errorCode = parseResultToErrorCode(parseResult.state);

    return {
      state: 'error',
      code: errorCode,
      ...(parseResult.metadata ? { metadata: parseResult.metadata } : {})
    };
  } catch (error) {
    if (isAbortError(error)) {
      return { state: 'cancelled' };
    }

    return { state: 'error', code: 'read-error' };
  }
}
