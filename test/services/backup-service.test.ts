import {
  generateBackupPayload,
  parseAndValidate,
  triggerBackupDownload,
  triggerRestore
} from '@/services/backup-service';
import type { PageId, StickerIdentifier } from '@/data/album';
import { afterEach, describe, expect, it, vi } from 'vitest';

function asPageId(value: string): PageId {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as PageId;
}

function asStickerIdentifier(value: string): StickerIdentifier {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as StickerIdentifier;
}

describe('backup-service parseAndValidate', () => {
  const validMeta = {
    exportedAt: '2026-01-01T00:00:00.000Z',
    appVersion: '1.0.0'
  };

  it('returns invalid-json for malformed json', () => {
    expect(parseAndValidate('{')).toEqual({ state: 'invalid-json' });
  });

  it('returns invalid-schema when root is not object', () => {
    expect(parseAndValidate('[]')).toEqual({ state: 'invalid-schema' });
  });

  it('returns unsupported-version for non-v1 backup', () => {
    expect(parseAndValidate(JSON.stringify({ version: 2, collection: {} }))).toEqual({
      state: 'unsupported-version'
    });
  });

  it('returns invalid-schema when version key is missing', () => {
    expect(parseAndValidate(JSON.stringify({ collection: {} }))).toEqual({
      state: 'invalid-schema'
    });
  });

  it('returns missing-collection when backup has no collection', () => {
    expect(parseAndValidate(JSON.stringify({ version: 1, ...validMeta }))).toEqual({
      state: 'missing-collection'
    });
  });

  it('returns invalid-collection when collection has wrong shape', () => {
    expect(parseAndValidate(JSON.stringify({ version: 1, collection: [], ...validMeta }))).toEqual({
      state: 'invalid-collection'
    });
  });

  it('returns invalid-collection when page stickers is not array', () => {
    expect(
      parseAndValidate(JSON.stringify({ version: 1, collection: { mex: 'MEX-1' }, ...validMeta }))
    ).toEqual({
      state: 'invalid-collection',
      metadata: { pageId: 'mex' }
    });
  });

  it('returns invalid-page-id when page not in album map', () => {
    expect(
      parseAndValidate(
        JSON.stringify({ version: 1, collection: { unknown: ['MEX-1'] }, ...validMeta })
      )
    ).toEqual({
      state: 'invalid-page-id',
      metadata: { pageId: 'unknown' }
    });
  });

  it('returns invalid-sticker-id when sticker not in page', () => {
    expect(
      parseAndValidate(JSON.stringify({ version: 1, collection: { mex: ['BAD-1'] }, ...validMeta }))
    ).toEqual({
      state: 'invalid-sticker-id',
      metadata: { pageId: 'mex', stickerId: 'BAD-1' }
    });
  });

  it('returns invalid-sticker-id when sticker value is not string', () => {
    expect(
      parseAndValidate(JSON.stringify({ version: 1, collection: { mex: [1] }, ...validMeta }))
    ).toEqual({
      state: 'invalid-sticker-id',
      metadata: { pageId: 'mex' }
    });
  });

  it('returns duplicate-sticker-id when duplicates found', () => {
    expect(
      parseAndValidate(
        JSON.stringify({ version: 1, collection: { mex: ['MEX-1', 'MEX-1'] }, ...validMeta })
      )
    ).toEqual({
      state: 'duplicate-sticker-id',
      metadata: { pageId: 'mex', stickerId: 'MEX-1' }
    });
  });

  it('returns success for valid backup payload', () => {
    const collection = {
      [asPageId('mex')]: new Set([asStickerIdentifier('MEX-1')])
    };

    const payload = generateBackupPayload(collection);
    const result = parseAndValidate(JSON.stringify(payload));

    expect(result.state).toBe('success');
    expect(result.collection).toEqual({ mex: ['MEX-1'] });
  });

  it('returns invalid-locale for unsupported locale in backup', () => {
    const result = parseAndValidate(
      JSON.stringify({
        version: 1,
        collection: { mex: ['MEX-1'] },
        locale: 'de',
        ...validMeta
      })
    );

    expect(result).toEqual({ state: 'invalid-locale' });
  });

  it('returns invalid-theme for unsupported theme in backup', () => {
    const result = parseAndValidate(
      JSON.stringify({
        version: 1,
        collection: { mex: ['MEX-1'] },
        theme: 'amoled',
        ...validMeta
      })
    );

    expect(result).toEqual({ state: 'invalid-theme' });
  });

  it('accepts valid locale and theme in backup', () => {
    const result = parseAndValidate(
      JSON.stringify({
        version: 1,
        collection: { mex: ['MEX-1'] },
        locale: 'pt-BR',
        theme: 'dark',
        ...validMeta
      })
    );

    expect(result).toEqual({
      state: 'success',
      collection: { mex: ['MEX-1'] },
      locale: 'pt-BR',
      theme: 'dark'
    });
  });

  it('backup without locale/theme still valid (backward compat)', () => {
    const result = parseAndValidate(
      JSON.stringify({
        version: 1,
        collection: { mex: ['MEX-1'] },
        ...validMeta
      })
    );

    expect(result).toEqual({
      state: 'success',
      collection: { mex: ['MEX-1'] }
    });
  });

  it('returns success for empty collection backup', () => {
    const payload = generateBackupPayload({});
    const result = parseAndValidate(JSON.stringify(payload));

    expect(result.state).toBe('success');
  });

  it('returns invalid-page-id when page id is not a known string id', () => {
    const result = parseAndValidate(
      JSON.stringify({
        version: 1,
        collection: { '123': ['MEX-1'] },
        ...validMeta
      })
    );

    expect(result.state).toBe('invalid-page-id');
  });

  it('ignores unknown top-level fields', () => {
    const result = parseAndValidate(
      JSON.stringify({
        version: 1,
        collection: { mex: ['MEX-1'] },
        extraField: 'should be ignored',
        ...validMeta
      })
    );

    expect(result.state).toBe('success');
  });

  it('accepts page with empty sticker array', () => {
    const result = parseAndValidate(
      JSON.stringify({
        version: 1,
        collection: { mex: [] },
        ...validMeta
      })
    );

    expect(result.state).toBe('success');
  });

  it('returns invalid-schema when exportedAt is not a valid ISO date string', () => {
    const result = parseAndValidate(
      JSON.stringify({
        version: 1,
        exportedAt: 'not-a-date',
        collection: { mex: ['MEX-1'] }
      })
    );

    expect(result.state).toBe('invalid-schema');
  });

  it('returns invalid-schema when appVersion is not a string', () => {
    const result = parseAndValidate(
      JSON.stringify({
        version: 1,
        appVersion: 123,
        collection: { mex: ['MEX-1'] }
      })
    );

    expect(result.state).toBe('invalid-schema');
  });
});

describe('backup-service file api flows', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns success when save file picker writes backup', async () => {
    const write = vi.fn<(data: Blob) => Promise<void>>(async () => {});
    const close = vi.fn<() => Promise<void>>(async () => {});
    const createWritable = vi.fn<
      () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>
    >(async () => ({ write, close }));
    const showSaveFilePicker = vi.fn<() => Promise<{ createWritable: typeof createWritable }>>(
      async () => ({ createWritable })
    );
    vi.stubGlobal('window', { showSaveFilePicker });

    const payload = generateBackupPayload({
      [asPageId('mex')]: new Set([asStickerIdentifier('MEX-1')])
    });

    const result = await triggerBackupDownload(payload);

    expect(result).toEqual({ state: 'success' });
    expect(showSaveFilePicker).toHaveBeenCalledTimes(1);
    expect(createWritable).toHaveBeenCalledTimes(1);
  });

  it('returns cancelled when save picker aborts', async () => {
    const showSaveFilePicker = vi.fn<() => Promise<never>>(async () => {
      throw new DOMException('cancelled', 'AbortError');
    });
    vi.stubGlobal('window', { showSaveFilePicker });

    const payload = generateBackupPayload({
      [asPageId('mex')]: new Set([asStickerIdentifier('MEX-1')])
    });

    await expect(triggerBackupDownload(payload)).resolves.toEqual({ state: 'cancelled' });
  });

  it('returns error when save picker fails', async () => {
    const showSaveFilePicker = vi.fn<() => Promise<never>>(async () => {
      throw new Error('boom');
    });
    vi.stubGlobal('window', { showSaveFilePicker });

    const payload = generateBackupPayload({
      [asPageId('mex')]: new Set([asStickerIdentifier('MEX-1')])
    });

    await expect(triggerBackupDownload(payload)).resolves.toEqual({ state: 'error' });
  });

  it('restores successfully from open file picker', async () => {
    const text = JSON.stringify({
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      appVersion: '1.0.0',
      collection: { mex: ['MEX-1'] },
      locale: 'en',
      theme: 'system'
    });
    const showOpenFilePicker = vi.fn<
      () => Promise<readonly [{ getFile: () => Promise<{ text: () => Promise<string> }> }]>
    >(async () => [
      {
        getFile: async () => ({ text: async () => text })
      }
    ]);

    vi.stubGlobal('window', { showOpenFilePicker });

    await expect(triggerRestore()).resolves.toEqual({
      state: 'success',
      collection: { mex: ['MEX-1'] },
      locale: 'en',
      theme: 'system'
    });
  });

  it('returns cancelled when open picker aborts', async () => {
    const showOpenFilePicker = vi.fn<() => Promise<never>>(async () => {
      throw new DOMException('cancelled', 'AbortError');
    });

    vi.stubGlobal('window', { showOpenFilePicker });

    await expect(triggerRestore()).resolves.toEqual({ state: 'cancelled' });
  });

  it('returns cancelled when open picker returns no file handle', async () => {
    const showOpenFilePicker = vi.fn<() => Promise<readonly []>>(async () => []);

    vi.stubGlobal('window', { showOpenFilePicker });

    await expect(triggerRestore()).resolves.toEqual({ state: 'cancelled' });
  });

  it('returns error code from validation failures', async () => {
    const text = JSON.stringify({ version: 2, collection: {} });
    const showOpenFilePicker = vi.fn<
      () => Promise<readonly [{ getFile: () => Promise<{ text: () => Promise<string> }> }]>
    >(async () => [
      {
        getFile: async () => ({ text: async () => text })
      }
    ]);

    vi.stubGlobal('window', { showOpenFilePicker });

    await expect(triggerRestore()).resolves.toEqual({
      state: 'error',
      code: 'unsupported-version'
    });
  });

  it('returns read-error when picker throws unknown error', async () => {
    const showOpenFilePicker = vi.fn<() => Promise<never>>(async () => {
      throw new Error('read fail');
    });

    vi.stubGlobal('window', { showOpenFilePicker });

    await expect(triggerRestore()).resolves.toEqual({
      state: 'error',
      code: 'read-error'
    });
  });

  it('returns read-error when parse result state is error', async () => {
    // This tests the parseResultToErrorCode mapping for 'error' state
    // The 'error' state can only come from readFromInputFallback rejection
    // which is mapped to 'read-error' in parseResultToErrorCode
    const showOpenFilePicker = vi.fn<() => Promise<never>>(async () => {
      throw new Error('file read failed');
    });

    vi.stubGlobal('window', { showOpenFilePicker });

    await expect(triggerRestore()).resolves.toEqual({
      state: 'error',
      code: 'read-error'
    });
  });
});
