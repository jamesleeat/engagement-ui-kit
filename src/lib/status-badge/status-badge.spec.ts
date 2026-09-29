import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { StatusBadge } from './status-badge';

/**
 * The regression that matters for the badge is the one it shipped with: the
 * status being invisible to assistive technology. These pin that down.
 */

@Component({
  imports: [StatusBadge],
  template: `
    <cw-status-badge id="plain" tone="danger" label="Error" />
    <cw-status-badge id="tip" tone="warning" label="Processing" tooltip="Still preparing" />
  `,
})
class Host {}

describe('StatusBadge', () => {
  async function render(): Promise<HTMLElement> {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('exposes its label as text that assistive technology can read', async () => {
    const badge = (await render()).querySelector<HTMLElement>('#plain')!;

    expect(badge.textContent?.trim()).toBe('Error');
    // Nothing that carries the label may be hidden from assistive technology.
    for (const hidden of Array.from(badge.querySelectorAll('[aria-hidden="true"]'))) {
      expect(hidden.textContent?.trim()).toBe('');
    }
  });

  it('is not a live region, so a list of badges does not announce itself', async () => {
    const badge = (await render()).querySelector<HTMLElement>('#plain')!;
    expect(badge.getAttribute('role')).toBeNull();
    expect(badge.getAttribute('aria-live')).toBeNull();
  });

  it('renders a title only when a tooltip is given', async () => {
    const root = await render();
    expect(root.querySelector('#plain')!.hasAttribute('title')).toBe(false);
    expect(root.querySelector('#tip')!.getAttribute('title')).toBe('Still preparing');
  });
});
