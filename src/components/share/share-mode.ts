export type ShareMode = 'missing' | 'repeated';

export function getShareModeKeyPrefix(mode: ShareMode): string {
  return mode === 'repeated' ? 'share.repeated' : 'share';
}
