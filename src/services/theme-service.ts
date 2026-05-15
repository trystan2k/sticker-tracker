import { read, write, type StorageWriteResult } from '@/lib/storage/app-storage';

export const SUPPORTED_THEMES = ['light', 'dark', 'system'] as const;

export type ThemeValue = (typeof SUPPORTED_THEMES)[number];

function isThemeValue(value: string): value is ThemeValue {
  return SUPPORTED_THEMES.some((theme) => theme === value);
}

export async function readTheme(): Promise<ThemeValue> {
  const result = await read('theme');

  if (result.state !== 'ready') {
    return 'system';
  }

  if (result.value === null || !isThemeValue(result.value)) {
    return 'system';
  }

  return result.value;
}

export async function saveTheme(theme: ThemeValue): Promise<StorageWriteResult> {
  return write('theme', theme);
}

export function applyTheme(theme: ThemeValue): void {
  if (typeof document === 'undefined') {
    return;
  }

  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
    return;
  }

  document.documentElement.setAttribute('data-theme', theme);
}
