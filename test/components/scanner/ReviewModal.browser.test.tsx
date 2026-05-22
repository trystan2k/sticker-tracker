import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { ReviewModal } from '@/components/scanner/ReviewModal';

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

describe('ReviewModal', () => {
  const sampleItems = [
    {
      id: 'scan-1',
      rawText: 'BRA 12',
      stickerNumber: 'BRA-12'
    }
  ];

  it('does not render when isOpen is false', async () => {
    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: false,
        items: sampleItems,
        onConfirm: () => {},
        onCancel: () => {}
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

  it('renders modal with title when open', async () => {
    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: sampleItems,
        onConfirm: () => {},
        onCancel: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const dialog = document.body.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.getAttribute('aria-modal')).toBe('true');

      const title = document.body.querySelector('h2');
      expect(title?.textContent).toContain('Review');
    } finally {
      cleanup(mounted);
    }
  });

  it('shows sticker input with correct value', async () => {
    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: sampleItems,
        onConfirm: () => {},
        onCancel: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const input = document.body.querySelector('input[type="text"]') as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input?.value).toBe('BRA-12');
    } finally {
      cleanup(mounted);
    }
  });

  it('shows raw OCR text', async () => {
    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: sampleItems,
        onConfirm: () => {},
        onCancel: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const rawText = document.body.querySelector('[id*="-raw"]');
      expect(rawText?.textContent).toContain('BRA 12');
    } finally {
      cleanup(mounted);
    }
  });

  it('shows invalid state for unparseable input', async () => {
    const invalidItems = [
      {
        id: 'scan-2',
        rawText: 'garbage',
        stickerNumber: 'garbage'
      }
    ];

    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: invalidItems,
        onConfirm: () => {},
        onCancel: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const input = document.body.querySelector('input[type="text"]') as HTMLInputElement;
      expect(input?.getAttribute('aria-invalid')).toBe('true');

      const errorText = document.body.querySelector('[class*="errorText"]');
      expect(errorText).not.toBeNull();
      expect(errorText?.textContent).toContain('Invalid format');
    } finally {
      cleanup(mounted);
    }
  });

  it('confirm button disabled when input is invalid', async () => {
    const invalidItems = [
      {
        id: 'scan-3',
        rawText: 'garbage',
        stickerNumber: 'garbage'
      }
    ];

    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: invalidItems,
        onConfirm: () => {},
        onCancel: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const confirmButton = document.body.querySelector(
        'button[class*="primaryButton"]'
      ) as HTMLButtonElement;
      expect(confirmButton?.disabled).toBe(true);
    } finally {
      cleanup(mounted);
    }
  });

  it('confirm button enabled when input is valid', async () => {
    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: sampleItems,
        onConfirm: () => {},
        onCancel: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const confirmButton = document.body.querySelector(
        'button[class*="primaryButton"]'
      ) as HTMLButtonElement;
      expect(confirmButton?.disabled).toBe(false);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onConfirm with valid sticker ids', async () => {
    const onConfirm = vi.fn<(ids: readonly string[]) => void>();

    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: sampleItems,
        onConfirm,
        onCancel: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const confirmButton = document.body.querySelector(
        'button[class*="primaryButton"]'
      ) as HTMLButtonElement;
      confirmButton?.click();

      expect(onConfirm).toHaveBeenCalledWith(['BRA-12']);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn<() => void>();

    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: sampleItems,
        onConfirm: () => {},
        onCancel
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const cancelButton = document.body.querySelector(
        'button[class*="secondaryButton"]'
      ) as HTMLButtonElement;
      cancelButton?.click();

      expect(onCancel).toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onCancel when Escape key is pressed', async () => {
    const onCancel = vi.fn<() => void>();

    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: sampleItems,
        onConfirm: () => {},
        onCancel
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      await new Promise((resolve) => requestAnimationFrame(resolve));

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(onCancel).toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onCancel when close button is clicked', async () => {
    const onCancel = vi.fn<() => void>();

    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: sampleItems,
        onConfirm: () => {},
        onCancel
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const closeButton = document.body.querySelector(
        'button[class*="iconButton"][aria-label*="Close review"]'
      ) as HTMLButtonElement;
      expect(closeButton).not.toBeNull();

      closeButton?.click();
      expect(onCancel).toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onCancel when backdrop is clicked', async () => {
    const onCancel = vi.fn<() => void>();

    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: sampleItems,
        onConfirm: () => {},
        onCancel
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const backdrop = document.body.querySelector(
        'button[class*="backdrop"]'
      ) as HTMLButtonElement;
      expect(backdrop).not.toBeNull();

      backdrop?.click();
      expect(onCancel).toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });

  it('blocks cancel interactions while submitting', async () => {
    const onCancel = vi.fn<() => void>();

    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: sampleItems,
        isSubmitting: true,
        onConfirm: () => {},
        onCancel
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const cancelButton = document.body.querySelector(
        'button[class*="secondaryButton"]'
      ) as HTMLButtonElement;
      const closeButton = document.body.querySelector(
        'button[class*="iconButton"][aria-label*="Close review"]'
      ) as HTMLButtonElement;
      const backdrop = document.body.querySelector(
        'button[class*="backdrop"]'
      ) as HTMLButtonElement;

      expect(cancelButton.disabled).toBe(true);
      expect(closeButton.disabled).toBe(true);

      cancelButton.click();
      closeButton.click();
      backdrop.click();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(onCancel).not.toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });

  it('allows editing sticker number', async () => {
    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: sampleItems,
        onConfirm: () => {},
        onCancel: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const input = document.body.querySelector('input[type="text"]') as HTMLInputElement;
      expect(input).not.toBeNull();

      // Simulate editing the input
      input.value = 'BRA-15';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise((r) => requestAnimationFrame(r));

      expect(input.value).toBe('BRA-15');
    } finally {
      cleanup(mounted);
    }
  });

  it('shows delete button for each item', async () => {
    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: sampleItems,
        onConfirm: () => {},
        onCancel: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const deleteButton = document.body.querySelector('button[class*="deleteButton"]');
      expect(deleteButton).not.toBeNull();
      expect(deleteButton?.textContent).toContain('Delete');
    } finally {
      cleanup(mounted);
    }
  });

  it('shows duplicate warning when same sticker appears twice', async () => {
    const duplicateItems = [
      { id: 'scan-1', rawText: 'BRA-12', stickerNumber: 'BRA-12' },
      { id: 'scan-2', rawText: 'BRA 12', stickerNumber: 'BRA-12' }
    ];

    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: duplicateItems,
        onConfirm: () => {},
        onCancel: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const helperText = document.body.querySelector('[class*="helperText"]');
      expect(helperText?.textContent).toContain('Duplicate');
      expect(helperText?.textContent).toContain('1 duplicate');
    } finally {
      cleanup(mounted);
    }
  });

  it('shows empty message when all items deleted', async () => {
    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: [],
        onConfirm: () => {},
        onCancel: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const helperText = document.body.querySelector('[class*="helperText"]');
      expect(helperText?.textContent).toContain('No stickers');
    } finally {
      cleanup(mounted);
    }
  });

  it('shows submitting state when isSubmitting is true', async () => {
    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: sampleItems,
        isSubmitting: true,
        onConfirm: () => {},
        onCancel: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const confirmButton = document.body.querySelector(
        'button[class*="primaryButton"]'
      ) as HTMLButtonElement;
      expect(confirmButton?.disabled).toBe(true);
      expect(confirmButton?.textContent).toContain('Confirming');
    } finally {
      cleanup(mounted);
    }
  });

  it('does not call onConfirm when confirm clicked with mixed valid/invalid items', async () => {
    const onConfirm = vi.fn<(ids: readonly string[]) => void>();
    const mixedItems = [
      { id: 'scan-1', rawText: 'BRA 12', stickerNumber: 'BRA-12' },
      { id: 'scan-2', rawText: 'garbage', stickerNumber: 'garbage' }
    ];

    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: mixedItems,
        onConfirm,
        onCancel: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const confirmButton = document.body.querySelector(
        'button[class*="primaryButton"]'
      ) as HTMLButtonElement;
      expect(confirmButton?.disabled).toBe(true);

      confirmButton?.click();
      expect(onConfirm).not.toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });

  it('filters duplicates and calls onConfirm with unique ids only', async () => {
    const onConfirm = vi.fn<(ids: readonly string[]) => void>();
    const duplicateItems = [
      { id: 'scan-1', rawText: 'BRA-12', stickerNumber: 'BRA-12' },
      { id: 'scan-2', rawText: 'BRA 12', stickerNumber: 'BRA-12' },
      { id: 'scan-3', rawText: 'MEX-1', stickerNumber: 'MEX-1' }
    ];

    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: duplicateItems,
        onConfirm,
        onCancel: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const confirmButton = document.body.querySelector(
        'button[class*="primaryButton"]'
      ) as HTMLButtonElement;
      expect(confirmButton?.disabled).toBe(false);

      confirmButton?.click();
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledWith(['BRA-12', 'MEX-1']);
    } finally {
      cleanup(mounted);
    }
  });

  it('ignores non-Escape keydown events', async () => {
    const onCancel = vi.fn<() => void>();

    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: sampleItems,
        onConfirm: () => {},
        onCancel
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      await new Promise((resolve) => requestAnimationFrame(resolve));

      // Dispatch a non-Escape key
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(onCancel).not.toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });

  it('resets draftItems when modal reopens with different items', async () => {
    const firstItems = [{ id: 'scan-1', rawText: 'BRA 12', stickerNumber: 'BRA-12' }];
    const secondItems = [{ id: 'scan-2', rawText: 'MEX 1', stickerNumber: 'MEX-1' }];
    const onCancel = () => {};
    const onConfirm = () => {};

    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: firstItems,
        onConfirm,
        onCancel
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      let dialog = document.body.querySelector('[role="dialog"]');
      let input = dialog?.querySelector('input[type="text"]') as HTMLInputElement | null;
      expect(input?.value).toBe('BRA-12');

      input?.focus();
      if (input) {
        input.value = 'BRA-99';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }

      await waitFor(() => {
        const currentDialog = document.body.querySelector('[role="dialog"]');
        const currentInput = currentDialog?.querySelector('input[type="text"]') as HTMLInputElement | null;
        return currentInput?.value === 'BRA-99';
      });

      mounted.root.render(
        React.createElement(ReviewModal, {
          isOpen: false,
          items: secondItems,
          onConfirm,
          onCancel
        })
      );

      await waitFor(() => document.body.querySelector('[role="dialog"]') === null);

      mounted.root.render(
        React.createElement(ReviewModal, {
          isOpen: true,
          items: secondItems,
          onConfirm,
          onCancel
        })
      );

      await waitFor(() => {
        const currentDialog = document.body.querySelector('[role="dialog"]');
        const currentInput = currentDialog?.querySelector('input[type="text"]') as HTMLInputElement | null;
        return currentInput?.value === 'MEX-1';
      });

      dialog = document.body.querySelector('[role="dialog"]');
      input = dialog?.querySelector('input[type="text"]') as HTMLInputElement | null;
      expect(input?.value).toBe('MEX-1');
    } finally {
      cleanup(mounted);
    }
  });

  it('moves focus into modal when opened', async () => {
    const triggerButton = document.createElement('button');
    triggerButton.textContent = 'open';
    document.body.appendChild(triggerButton);
    triggerButton.focus();

    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: sampleItems,
        onConfirm: () => {},
        onCancel: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);
      await new Promise((r) => requestAnimationFrame(r));

      const closeButton = document.body.querySelector(
        'button[class*="iconButton"][aria-label*="Close review"]'
      ) as HTMLButtonElement;
      expect(document.activeElement).toBe(closeButton);
    } finally {
      cleanup(mounted);
      triggerButton.remove();
    }
  });

  it('traps tab navigation inside modal', async () => {
    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: sampleItems,
        onConfirm: () => {},
        onCancel: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);
      await new Promise((r) => requestAnimationFrame(r));

      const closeButton = document.body.querySelector(
        'button[class*="iconButton"][aria-label*="Close review"]'
      ) as HTMLButtonElement;
      const confirmButton = document.body.querySelector(
        'button[class*="primaryButton"]'
      ) as HTMLButtonElement;

      confirmButton.focus();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      expect(document.activeElement).toBe(closeButton);

      closeButton.focus();
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })
      );
      expect(document.activeElement).toBe(confirmButton);
    } finally {
      cleanup(mounted);
    }
  });

  it('restores focus to previous element when closed', async () => {
    const triggerButton = document.createElement('button');
    triggerButton.textContent = 'open';
    document.body.appendChild(triggerButton);
    triggerButton.focus();

    const mounted = mount(
      React.createElement(ReviewModal, {
        isOpen: true,
        items: sampleItems,
        onConfirm: () => {},
        onCancel: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      mounted.root.render(
        React.createElement(ReviewModal, {
          isOpen: false,
          items: sampleItems,
          onConfirm: () => {},
          onCancel: () => {}
        })
      );

      await new Promise((r) => requestAnimationFrame(r));
      expect(document.activeElement).toBe(triggerButton);
    } finally {
      cleanup(mounted);
      triggerButton.remove();
    }
  });
});
