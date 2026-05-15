import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  detectInstallPlatform,
  isStandaloneDisplayMode,
  shouldShowInstallBanner,
  shouldShowInstallEntry
} from '@/services/pwa-install-service';

type MutableNavigator = Navigator & {
  standalone?: boolean;
  userAgent: string;
  maxTouchPoints: number;
};

function stubWindow(config: {
  mediaMatch?: boolean;
  userAgent?: string;
  maxTouchPoints?: number;
  standalone?: boolean;
  hasMSStream?: boolean;
}) {
  vi.stubGlobal('window', {
    matchMedia: vi
      .fn<(query: string) => { matches: boolean }>()
      .mockReturnValue({ matches: config.mediaMatch ?? false }),
    MSStream: config.hasMSStream ? {} : undefined
  });

  vi.stubGlobal('navigator', {
    userAgent: config.userAgent ?? 'Mozilla/5.0 Chrome/122.0.0.0 Safari/537.36',
    maxTouchPoints: config.maxTouchPoints ?? 0,
    standalone: config.standalone
  } as MutableNavigator);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('pwa-install-service', () => {
  it('returns unsupported states without window', () => {
    vi.unstubAllGlobals();

    expect(isStandaloneDisplayMode()).toBe(false);
    expect(detectInstallPlatform()).toBe('unsupported');
    expect(shouldShowInstallEntry()).toBe(false);
    expect(shouldShowInstallBanner()).toBe(false);
  });

  it('detects standalone via display-mode media query', () => {
    stubWindow({ mediaMatch: true });

    expect(isStandaloneDisplayMode()).toBe(true);
    expect(detectInstallPlatform()).toBe('unsupported');
  });

  it('detects standalone via iOS navigator flag', () => {
    stubWindow({ standalone: true });

    expect(isStandaloneDisplayMode()).toBe(true);
  });

  it('detects ios platform', () => {
    stubWindow({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' });

    expect(detectInstallPlatform()).toBe('ios');
    expect(shouldShowInstallEntry()).toBe(true);
    expect(shouldShowInstallBanner()).toBe(false);
  });

  it('detects iPadOS platform from Macintosh + touch points', () => {
    stubWindow({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 5 });

    expect(detectInstallPlatform()).toBe('ios');
  });

  it('defaults to chromium when supported and not iOS', () => {
    stubWindow({});

    expect(detectInstallPlatform()).toBe('chromium');
    expect(shouldShowInstallEntry()).toBe(true);
    expect(shouldShowInstallBanner()).toBe(true);
  });

  it('hides install entry when already standalone', () => {
    stubWindow({ mediaMatch: true });

    expect(shouldShowInstallEntry()).toBe(false);
  });
});
