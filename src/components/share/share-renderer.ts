import type { SharePreviewPayload } from '@/components/share/share-state';

type RenderSharePngOptions = {
  preferredScale?: number;
  maxPixelWidth?: number;
  maxPixelHeight?: number;
};

type RenderedSharePng = {
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
  scale: number;
};

const CARD_WIDTH = 320;
const HEADER_HEIGHT = 74;
const FOOTER_HEIGHT = 34;
const CARD_PADDING_X = 16;
const CARD_PADDING_TOP = 12;
const BLOCK_HEIGHT = 52;
const EMPTY_BLOCK_HEIGHT = 52;
const MIN_CARD_BODY_HEIGHT = 80;

const DEFAULT_MAX_PIXEL_WIDTH = 4096;
const DEFAULT_MAX_PIXEL_HEIGHT = 16384;
const DEFAULT_PREFERRED_SCALE = 2;

const FONT_STACK = "'Barlow Condensed', 'Barlow', sans-serif";

const COLOR_CARD_BG = '#1A221A';
const COLOR_CARD_CHROME_BG = '#141A14';
const COLOR_DIVIDER = 'rgba(255, 255, 255, 0.1)';
const COLOR_TITLE_TEXT = '#FFF9E6';
const COLOR_TEXT_SECONDARY = '#E8F0E8';
const COLOR_TEXT_PRIMARY = '#FBF8EE';

type RenderBlock = {
  title: string;
  missingText: string;
  showFlag: boolean;
  flagCode: string;
};

function buildBlocks(
  payload: SharePreviewPayload,
  t: (key: string) => string
): readonly RenderBlock[] {
  const blocks = payload.sections
    .flatMap((section) => section.pages)
    .map((page) => {
      const title = t(page.title);
      const missingText = `${t('share.preview.missingPrefix')}: ${page.compressedMissingText}`;

      const isFifaSpecial = page.specialKey === 'fwc-opening' || page.specialKey === 'fwc-closing';
      const isCocaCola = page.specialKey === 'coca-cola';

      if ((page.pageType === 'team' && page.flagCode) || isFifaSpecial || isCocaCola) {
        const result: RenderBlock = {
          title,
          missingText,
          showFlag: true,
          flagCode: isFifaSpecial ? 'fifa' : isCocaCola ? 'cocacola' : (page.flagCode ?? '')
        };
        return result;
      }

      const result: RenderBlock = {
        title,
        missingText,
        showFlag: false,
        flagCode: ''
      };
      return result;
    });

  if (blocks.length > 0) {
    return blocks;
  }

  return [
    {
      title: t('share.preview.emptyTitle'),
      missingText: t('share.preview.emptyDescription'),
      showFlag: false,
      flagCode: ''
    }
  ];
}

const flagCache = new Map<string, HTMLImageElement>();

function waitForImageLoad(image: HTMLImageElement): Promise<void> {
  if (image.complete && image.naturalWidth > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    image.addEventListener('load', () => resolve(), { once: true });
    image.addEventListener(
      'error',
      () => reject(new Error(`Unable to load flag image: ${image.src}`)),
      { once: true }
    );
  });
}

const FIFA_ICON_PATH = '/images/fifa.png';
const COCACOLA_ICON_PATH = '/images/cocacola.png';
const FIFA_26_LOGO_PATH = '/images/fifa-26-logo.jpg';

const logoCache = new Map<string, HTMLImageElement>();

async function loadLogoImage(): Promise<HTMLImageElement> {
  const cached = logoCache.get('fifa-26-logo');

  if (cached) {
    return cached;
  }

  const image = new Image();
  image.src = FIFA_26_LOGO_PATH;

  if (typeof image.decode === 'function') {
    try {
      await image.decode();
    } catch {
      if (!image.complete) {
        await waitForImageLoad(image);
      }
    }
  } else {
    await waitForImageLoad(image);
  }

  if (image.naturalWidth === 0) {
    throw new Error('Unable to load FIFA 26 logo image');
  }

  logoCache.set('fifa-26-logo', image);

  return image;
}

async function loadFlagImage(flagCode: string): Promise<HTMLImageElement> {
  const cached = flagCache.get(flagCode);

  if (cached) {
    return cached;
  }

  const image = new Image();

  if (flagCode === 'fifa') {
    image.src = FIFA_ICON_PATH;
  } else if (flagCode === 'cocacola') {
    image.src = COCACOLA_ICON_PATH;
  } else {
    image.src = `/images/flags/${flagCode}.svg`;
  }

  if (typeof image.decode === 'function') {
    try {
      await image.decode();
    } catch {
      if (!image.complete) {
        await waitForImageLoad(image);
      }
    }
  } else {
    await waitForImageLoad(image);
  }

  if (image.naturalWidth === 0) {
    throw new Error(`Unable to load flag image: ${flagCode}`);
  }

  flagCache.set(flagCode, image);

  return image;
}

async function preloadFlagImages(blocks: readonly RenderBlock[]): Promise<void> {
  const uniqueCodes = new Set(
    blocks.flatMap((block) => (block.showFlag && block.flagCode ? [block.flagCode] : []))
  );

  await Promise.all([...uniqueCodes].map((code) => loadFlagImage(code)));
}

function computeLogicalHeight(blockCount: number): number {
  const dividerGapHeight = blockCount > 1 ? (blockCount - 1) * 10 : 0;
  const bodyHeight = Math.max(
    MIN_CARD_BODY_HEIGHT,
    CARD_PADDING_TOP +
      (blockCount === 0 ? EMPTY_BLOCK_HEIGHT : blockCount * BLOCK_HEIGHT + dividerGapHeight) +
      10
  );

  return HEADER_HEIGHT + bodyHeight + FOOTER_HEIGHT;
}

function computeScale(
  logicalWidth: number,
  logicalHeight: number,
  options?: RenderSharePngOptions
): number {
  const preferred = Math.max(1, options?.preferredScale ?? DEFAULT_PREFERRED_SCALE);
  const maxWidth = options?.maxPixelWidth ?? DEFAULT_MAX_PIXEL_WIDTH;
  const maxHeight = options?.maxPixelHeight ?? DEFAULT_MAX_PIXEL_HEIGHT;

  const maxScaleByWidth = Math.floor(maxWidth / logicalWidth);
  const maxScaleByHeight = Math.floor(maxHeight / logicalHeight);
  const maxScale = Math.min(maxScaleByWidth, maxScaleByHeight);
  const scale = Math.min(preferred, maxScale);

  if (scale < 1) {
    throw new Error('Unable to render PNG: card exceeds maximum pixel constraints.');
  }

  return scale;
}

function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Unable to render PNG blob.'));
        return;
      }

      resolve(blob);
    }, 'image/png');
  });
}

export async function renderSharePng(
  payload: SharePreviewPayload,
  t: (key: string) => string,
  options?: RenderSharePngOptions
): Promise<RenderedSharePng> {
  const blocks = buildBlocks(payload, t);
  const logicalWidth = CARD_WIDTH;
  const logicalHeight = computeLogicalHeight(blocks.length);
  const scale = computeScale(logicalWidth, logicalHeight, options);

  await Promise.all([
    preloadFlagImages(blocks),
    loadLogoImage(),
    typeof document.fonts?.ready !== 'undefined' ? document.fonts.ready : Promise.resolve()
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = logicalWidth * scale;
  canvas.height = logicalHeight * scale;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Unable to render PNG: 2D canvas context unavailable.');
  }

  context.scale(scale, scale);

  context.fillStyle = COLOR_CARD_BG;
  context.fillRect(0, 0, logicalWidth, logicalHeight);

  context.fillStyle = COLOR_CARD_CHROME_BG;
  context.fillRect(0, 0, logicalWidth, HEADER_HEIGHT);

  context.strokeStyle = COLOR_DIVIDER;
  context.beginPath();
  context.moveTo(0, HEADER_HEIGHT + 0.5);
  context.lineTo(logicalWidth, HEADER_HEIGHT + 0.5);
  context.stroke();

  context.fillStyle = COLOR_TITLE_TEXT;
  context.font = `600 32px ${FONT_STACK}`;
  context.fillText(t('share.brandName'), CARD_PADDING_X, 34, logicalWidth - CARD_PADDING_X * 2);

  context.fillStyle = COLOR_TEXT_SECONDARY;
  context.font = `400 14px ${FONT_STACK}`;
  context.fillText(
    t('share.preview.subtitle'),
    CARD_PADDING_X,
    52,
    logicalWidth - CARD_PADDING_X * 2
  );

  const logoImage = logoCache.get('fifa-26-logo');

  if (logoImage) {
    const logoSize = 48;
    const logoX = logicalWidth - CARD_PADDING_X - logoSize;
    const logoY = (HEADER_HEIGHT - logoSize) / 2;

    context.save();
    context.beginPath();
    context.roundRect(logoX, logoY, logoSize, logoSize, 8);
    context.clip();
    context.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    context.restore();
  }

  let y = HEADER_HEIGHT + CARD_PADDING_TOP;

  blocks.forEach((block, index) => {
    if (index > 0) {
      context.strokeStyle = COLOR_DIVIDER;
      context.beginPath();
      context.moveTo(CARD_PADDING_X, y + 0.5);
      context.lineTo(logicalWidth - CARD_PADDING_X, y + 0.5);
      context.stroke();
      y += 10;
    }

    let titleX = CARD_PADDING_X;

    if (block.showFlag && block.flagCode) {
      const flagImage = flagCache.get(block.flagCode);

      if (flagImage) {
        context.drawImage(flagImage, CARD_PADDING_X, y + 1, 22, 15);
      }

      titleX = CARD_PADDING_X + 30;
    }

    context.fillStyle = COLOR_TEXT_PRIMARY;
    context.font = `600 16px ${FONT_STACK}`;
    context.fillText(block.title, titleX, y + 13, logicalWidth - CARD_PADDING_X - titleX);

    context.fillStyle = COLOR_TEXT_SECONDARY;
    context.font = `400 14px ${FONT_STACK}`;
    context.fillText(block.missingText, CARD_PADDING_X, y + 32, logicalWidth - CARD_PADDING_X * 2);

    y += BLOCK_HEIGHT;
  });

  context.fillStyle = COLOR_CARD_CHROME_BG;
  context.fillRect(0, logicalHeight - FOOTER_HEIGHT, logicalWidth, FOOTER_HEIGHT);

  context.strokeStyle = COLOR_DIVIDER;
  context.beginPath();
  context.moveTo(0, logicalHeight - FOOTER_HEIGHT + 0.5);
  context.lineTo(logicalWidth, logicalHeight - FOOTER_HEIGHT + 0.5);
  context.stroke();

  context.fillStyle = COLOR_TEXT_SECONDARY;
  context.font = `400 14px ${FONT_STACK}`;
  context.fillText(
    t('share.brandDomain'),
    CARD_PADDING_X,
    logicalHeight - 12,
    logicalWidth - CARD_PADDING_X * 2
  );

  const blob = await toPngBlob(canvas);

  return {
    blob,
    fileName: t('share.fileName'),
    width: canvas.width,
    height: canvas.height,
    scale
  };
}
