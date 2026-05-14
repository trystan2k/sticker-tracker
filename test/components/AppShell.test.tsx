import { describe, expect, it } from 'vitest';

import React from 'react';
import { renderToString } from 'react-dom/server';

import { AppShell } from '@/components/AppShell';

describe('AppShell', () => {
  it('renders shell div with children inside main', () => {
    const html = renderToString(
      React.createElement(
        AppShell,
        null,
        React.createElement('div', { 'data-testid': 'child' }, 'Test Content')
      )
    );

    expect(html).toContain('Test Content');
    expect(html).toContain('<main');
    expect(html).toContain('<nav');
    expect(html).toContain('aria-label="Navigation"');
  });

  it('renders overlay and toast divs with aria-live', () => {
    const html = renderToString(
      React.createElement(AppShell, null, React.createElement('span', null, 'content'))
    );

    expect(html).toContain('aria-live="polite"');
    // Two aria-live elements: overlay and toast
    const matches = html.match(/aria-live="polite"/g);
    expect(matches).toHaveLength(2);
  });

  it('renders with null children', () => {
    const html = renderToString(React.createElement(AppShell, null, null));

    expect(html).toContain('<main');
  });

  it('renders with undefined children', () => {
    const html = renderToString(React.createElement(AppShell, null, undefined));

    expect(html).toContain('<main');
  });

  it('renders with multiple children', () => {
    const html = renderToString(
      React.createElement(
        AppShell,
        null,
        React.createElement('div', { 'data-testid': 'first' }, 'First'),
        React.createElement('div', { 'data-testid': 'second' }, 'Second')
      )
    );

    expect(html).toContain('First');
    expect(html).toContain('Second');
  });
});
