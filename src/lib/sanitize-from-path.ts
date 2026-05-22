export function sanitizeFromPath(raw: string | undefined | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) {
    return '/';
  }

  return raw;
}
