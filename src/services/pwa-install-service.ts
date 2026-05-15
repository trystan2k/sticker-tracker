export type InstallPlatform = 'chromium' | 'ios' | 'unsupported';

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type IOSNavigator = Navigator & { standalone?: boolean };

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  return Boolean((navigator as IOSNavigator).standalone);
}

export function detectInstallPlatform(): InstallPlatform {
  if (typeof window === 'undefined') {
    return 'unsupported';
  }

  if (isStandaloneDisplayMode()) {
    return 'unsupported';
  }

  const ua = navigator.userAgent;
  const hasMSStream = Boolean(Reflect.get(window, 'MSStream'));
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !hasMSStream;
  const isIPadOS = ua.includes('Macintosh') && navigator.maxTouchPoints > 1;

  if (isIOS || isIPadOS) {
    return 'ios';
  }

  return 'chromium';
}

export function shouldShowInstallEntry(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if (isStandaloneDisplayMode()) {
    return false;
  }

  const platform = detectInstallPlatform();
  return platform === 'chromium' || platform === 'ios';
}

export function shouldShowInstallBanner(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return detectInstallPlatform() === 'chromium';
}
