import type { PageId, StickerIdentifier } from '@/data/album';

export const STICKER_CELL_DOUBLE_TAP_THRESHOLD_MS = 250;

export function getStickerInteractionKey(pageId: PageId, stickerId: StickerIdentifier): string {
  return `${pageId}:${stickerId}`;
}

export function getNextStickerQuantityForSingleTap(quantity: number): number {
  return quantity <= 0 ? 1 : quantity + 1;
}

export function getNextStickerQuantityForDoubleTap(quantity: number): number {
  return Math.max(0, quantity - 1);
}
