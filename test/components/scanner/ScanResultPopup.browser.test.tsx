import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { ScanResultPopup } from '@/components/scanner/ScanResultPopup';

function waitFor(predicate: () => boolean, timeoutMs = 8000): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();

    function check() {
      try {
        if (predicate()) {
          resolve();
          return;
        }
      } catch {
        // predicate may throw, keep polling
      }

      if (Date.now() - start > timeoutMs) {
        reject(new Error('waitFor timeout'));
        return;
      }

      requestAnimationFrame(check);
    }

    check();
  });
}

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

describe('ScanResultPopup', () => {
  it('does not render when isOpen is false', async () => {
    const mounted = mount(
      React.createElement(ScanResultPopup, {
        isOpen: false,
        stickerNumber: 'BRA-1',
        hasSticker: false,
        onClose: () => {}
      })
    );

    try {
      await new Promise((r) => requestAnimationFrame(r));

      const dialog = document.body.querySelector('[role="dialog"]');
      expect(dialog).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders popup with sticker number when open', async () => {
    const mounted = mount(
      React.createElement(ScanResultPopup, {
        isOpen: true,
        stickerNumber: 'BRA-1',
        hasSticker: false,
        onClose: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const dialog = document.body.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.getAttribute('aria-modal')).toBe('true');

      const stickerLabel = document.body.querySelector('p');
      expect(stickerLabel?.textContent).toContain('BRA-1');
    } finally {
      cleanup(mounted);
    }
  });

  it('shows "Missing!" status for new sticker', async () => {
    const mounted = mount(
      React.createElement(ScanResultPopup, {
        isOpen: true,
        stickerNumber: 'BRA-1',
        hasSticker: false,
        onClose: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const statusText = document.body.querySelector('[class*="statusText"]');
      expect(statusText?.textContent).toBe('Missing!');
    } finally {
      cleanup(mounted);
    }
  });

  it('shows "Already have" status for collected sticker', async () => {
    const mounted = mount(
      React.createElement(ScanResultPopup, {
        isOpen: true,
        stickerNumber: 'BRA-1',
        hasSticker: true,
        onClose: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const statusText = document.body.querySelector('[class*="statusText"]');
      expect(statusText?.textContent).toBe('Already have');
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onClose when OK button is clicked', async () => {
    const onClose = vi.fn<() => void>();
    const mounted = mount(
      React.createElement(ScanResultPopup, {
        isOpen: true,
        stickerNumber: 'BRA-1',
        hasSticker: false,
        onClose
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const okButton = document.body.querySelector(
        'button[class*="okButton"]'
      ) as HTMLButtonElement;
      expect(okButton).not.toBeNull();

      okButton?.click();
      expect(onClose).toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });

  it('does not close when Escape key is pressed', async () => {
    const onClose = vi.fn<() => void>();
    const mounted = mount(
      React.createElement(ScanResultPopup, {
        isOpen: true,
        stickerNumber: 'BRA-1',
        hasSticker: false,
        onClose
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      await new Promise((resolve) => requestAnimationFrame(resolve));

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(onClose).not.toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });

  it('does not call onClose when Enter key is pressed', async () => {
    const onClose = vi.fn<() => void>();
    const mounted = mount(
      React.createElement(ScanResultPopup, {
        isOpen: true,
        stickerNumber: 'BRA-1',
        hasSticker: false,
        onClose
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      await new Promise((resolve) => requestAnimationFrame(resolve));

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(onClose).not.toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });

  it('does not close when backdrop is clicked', async () => {
    const onClose = vi.fn<() => void>();
    const mounted = mount(
      React.createElement(ScanResultPopup, {
        isOpen: true,
        stickerNumber: 'BRA-1',
        hasSticker: false,
        onClose
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const backdrop = document.body.querySelector('div[class*="backdrop"]') as HTMLDivElement;
      expect(backdrop).not.toBeNull();

      backdrop?.click();
      expect(onClose).not.toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders non-interactive backdrop while waiting for Ok', async () => {
    const mounted = mount(
      React.createElement(ScanResultPopup, {
        isOpen: true,
        stickerNumber: 'BRA-1',
        hasSticker: false,
        onClose: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const backdrop = document.body.querySelector('div[class*="backdrop"]') as HTMLDivElement;
      expect(backdrop).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  describe('Tab key trap', () => {
    it('ignores non-Tab keys (does not call onClose)', async () => {
      const onClose = vi.fn<() => void>();
      const mounted = mount(
        React.createElement(ScanResultPopup, {
          isOpen: true,
          stickerNumber: 'BRA-1',
          hasSticker: false,
          onClose
        })
      );

      try {
        await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);
        await new Promise((resolve) => requestAnimationFrame(resolve));

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
        expect(onClose).not.toHaveBeenCalled();
      } finally {
        cleanup(mounted);
      }
    });

    it('traps Tab key within dialog (single focusable element stays focused)', async () => {
      const mounted = mount(
        React.createElement(ScanResultPopup, {
          isOpen: true,
          stickerNumber: 'BRA-1',
          hasSticker: false,
          onClose: () => {}
        })
      );

      try {
        await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);
        await new Promise((resolve) => requestAnimationFrame(resolve));

        // The dialog only has one focusable button (OK button)
        // The backdrop button is outside the dialog, not in the trap scope
        const dialog = document.body.querySelector('[role="dialog"]');
        const dialogButtons = dialog?.querySelectorAll('button');
        expect(dialogButtons?.length).toBe(1);

        const okButton = dialogButtons?.[0] as HTMLButtonElement;
        okButton?.focus();

        // Wait for focus to settle
        await new Promise((resolve) => setTimeout(resolve, 50));

        const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
        document.dispatchEvent(event);

        // With single focusable element, Tab should prevent default and keep focus on same element
        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(document.activeElement).toBe(okButton);
      } finally {
        cleanup(mounted);
      }
    });

    it('traps Shift+Tab key within dialog (single focusable element stays focused)', async () => {
      const mounted = mount(
        React.createElement(ScanResultPopup, {
          isOpen: true,
          stickerNumber: 'BRA-1',
          hasSticker: false,
          onClose: () => {}
        })
      );

      try {
        await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);
        await new Promise((resolve) => requestAnimationFrame(resolve));

        const dialog = document.body.querySelector('[role="dialog"]');
        const dialogButtons = dialog?.querySelectorAll('button');
        const okButton = dialogButtons?.[0] as HTMLButtonElement;
        okButton?.focus();

        // Wait for focus to settle
        await new Promise((resolve) => setTimeout(resolve, 50));

        const event = new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: true,
          bubbles: true,
          cancelable: true
        });
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
        document.dispatchEvent(event);

        // With single focusable element, Shift+Tab should also prevent default
        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(document.activeElement).toBe(okButton);
      } finally {
        cleanup(mounted);
      }
    });
  });
});
