import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { ViewfinderOverlay } from '@/components/scanner/ViewfinderOverlay';

function mount(child: React.ReactNode): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(child);

  return { container, root };
}

function cleanup({ container, root }: { container: HTMLDivElement; root: Root }) {
  root.unmount();
  container.remove();
}

describe('ViewfinderOverlay', () => {
  it('renders overlay container with aria-hidden', async () => {
    const mounted = mount(React.createElement(ViewfinderOverlay, { isScanning: false }));

    try {
      await vi.waitFor(
        () => {
          expect(mounted.container.firstChild).not.toBeNull();
        },
        { timeout: 3000 }
      );

      const outerDiv = mounted.container.firstChild as HTMLElement;
      expect(outerDiv?.getAttribute('aria-hidden')).toBe('true');
    } finally {
      cleanup(mounted);
    }
  });

  it('renders multiple div elements for layout', async () => {
    const mounted = mount(React.createElement(ViewfinderOverlay, { isScanning: false }));

    try {
      await new Promise((r) => requestAnimationFrame(r));

      const allDivs = mounted.container.querySelectorAll('div');
      expect(allDivs.length).toBeGreaterThanOrEqual(5);
    } finally {
      cleanup(mounted);
    }
  });

  it('renders corner and scan line spans', async () => {
    const mounted = mount(React.createElement(ViewfinderOverlay, { isScanning: false }));

    try {
      await new Promise((r) => requestAnimationFrame(r));

      const spans = mounted.container.querySelectorAll('span');
      // 4 corners + 1 scan line = 5 spans
      expect(spans.length).toBeGreaterThanOrEqual(5);
    } finally {
      cleanup(mounted);
    }
  });

  it('scan line does not have active class when isScanning is false', async () => {
    const mounted = mount(React.createElement(ViewfinderOverlay, { isScanning: false }));

    try {
      await new Promise((r) => requestAnimationFrame(r));

      const spans = mounted.container.querySelectorAll('span');
      const hasActiveClass = Array.from(spans).some((s) => s.className.includes('scanLineActive'));
      expect(hasActiveClass).toBe(false);
    } finally {
      cleanup(mounted);
    }
  });

  it('scan line has active class when isScanning is true', async () => {
    const mounted = mount(React.createElement(ViewfinderOverlay, { isScanning: true }));

    try {
      await new Promise((r) => requestAnimationFrame(r));

      const spans = mounted.container.querySelectorAll('span');
      const activeScanLine = Array.from(spans).find((s) => s.className.includes('scanLineActive'));
      expect(activeScanLine).toBeDefined();
    } finally {
      cleanup(mounted);
    }
  });
});
