import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { Select } from './select';

/**
 * Tests target where a regression would reach a user, not coverage:
 *
 * - the ARIA contract assistive technology depends on (role, expanded,
 *   active option), which breaks silently for sighted developers;
 * - dismissing without changing the value, and unavailable options, because
 *   both are "the control did something I didn't ask for" failures;
 * - forms state (value / dirty / touched / disabled), which consumers build
 *   validation and save logic on;
 * - typeahead, which has already regressed once during development.
 *
 * Everything is driven through the DOM, the way a user drives it.
 */

interface Person {
  id: string;
  name: string;
  away?: boolean;
}

const PEOPLE: Person[] = [
  { id: 'p1', name: 'Marta' },
  { id: 'p2', name: 'Aisha' },
  { id: 'p3', name: 'Chen', away: true },
  { id: 'p4', name: 'Aidan' },
  { id: 'p5', name: 'Mateo' },
];

@Component({
  imports: [ReactiveFormsModule, Select],
  template: `
    <div (keydown)="outerKeydowns = outerKeydowns + 1">
      <cw-select
        label="Reviewer"
        placeholder="Choose a reviewer"
        [options]="people"
        [optionLabel]="name"
        [optionValue]="id"
        [optionDisabled]="away"
        [formControl]="control"
      />
    </div>
  `,
})
class Host {
  people = PEOPLE;
  control = new FormControl<string | null>(null);
  outerKeydowns = 0;
  name = (p: Person) => p.name;
  id = (p: Person) => p.id;
  away = (p: Person) => p.away === true;
}

describe('Select', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let trigger: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
    trigger = query('[role="combobox"]');
    trigger.focus();
  });

  function query<E extends HTMLElement = HTMLElement>(selector: string): E {
    const el = (fixture.nativeElement as HTMLElement).querySelector<E>(selector);
    if (!el) throw new Error(`No element for ${selector}`);
    return el;
  }

  async function press(key: string, init: KeyboardEventInit = {}): Promise<KeyboardEvent> {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    trigger.dispatchEvent(event);
    await fixture.whenStable();
    return event;
  }

  /** The option assistive technology is told is active, by following the ARIA references. */
  function activeOption(): HTMLElement | null {
    const id = trigger.getAttribute('aria-activedescendant');
    return id ? document.getElementById(id) : null;
  }

  function isExpanded(): boolean {
    return trigger.getAttribute('aria-expanded') === 'true';
  }

  describe('ARIA contract', () => {
    it('is a labelled, collapsed combobox showing its placeholder', () => {
      const labelId = trigger.getAttribute('aria-labelledby')!;
      expect(document.getElementById(labelId)?.textContent?.trim()).toBe('Reviewer');
      expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
      expect(isExpanded()).toBe(false);
      expect(trigger.hasAttribute('aria-activedescendant')).toBe(false);
      expect(trigger.textContent?.trim()).toBe('Choose a reviewer');
    });

    it('when opened, points aria-activedescendant at an option inside the controlled listbox', async () => {
      await press('ArrowDown');

      expect(isExpanded()).toBe(true);
      const listbox = document.getElementById(trigger.getAttribute('aria-controls')!);
      expect(listbox?.getAttribute('role')).toBe('listbox');
      expect(listbox?.hidden).toBe(false);

      const active = activeOption();
      expect(active?.getAttribute('role')).toBe('option');
      expect(listbox?.contains(active!)).toBe(true);
      expect(active?.textContent).toContain('Marta');
    });

    it('marks the current value with aria-selected, independently of the active option', async () => {
      host.control.setValue('p4');
      await fixture.whenStable();
      await press('ArrowDown'); // opens on Aidan
      await press('ArrowDown'); // moves to Mateo

      expect(activeOption()?.textContent).toContain('Mateo');
      const selected = Array.from(document.querySelectorAll('[role="option"][aria-selected="true"]'));
      expect(selected.map((o) => o.textContent?.trim())).toEqual(['✓Aidan']);
    });

    it('keeps focus on the trigger throughout', async () => {
      await press('ArrowDown');
      await press('ArrowDown');
      await press('Enter');
      expect(document.activeElement).toBe(trigger);
    });
  });

  describe('dismissing', () => {
    it('Escape closes without changing the value, and does not reach an enclosing handler', async () => {
      host.control.setValue('p1');
      await fixture.whenStable();
      await press('ArrowDown');
      await press('ArrowDown');
      host.outerKeydowns = 0;

      await press('Escape');

      expect(isExpanded()).toBe(false);
      expect(host.control.value).toBe('p1');
      expect(host.control.dirty).toBe(false);
      expect(document.activeElement).toBe(trigger);
      // e.g. an enclosing dialog must not also close on the same Escape.
      expect(host.outerKeydowns).toBe(0);
    });

    it('Tab closes without choosing the active option', async () => {
      await press('ArrowDown');
      await press('ArrowDown');
      await press('Tab');

      expect(isExpanded()).toBe(false);
      expect(host.control.value).toBeNull();
    });
  });

  describe('unavailable options', () => {
    it('are exposed as aria-disabled and cannot be chosen by keyboard or pointer', async () => {
      await press('c'); // opens and jumps to Chen, who is away
      const chen = activeOption()!;
      expect(chen.textContent).toContain('Chen');
      expect(chen.getAttribute('aria-disabled')).toBe('true');

      await press('Enter');
      expect(host.control.value).toBeNull();
      expect(isExpanded()).toBe(true);

      chen.click();
      await fixture.whenStable();
      expect(host.control.value).toBeNull();
    });
  });

  describe('forms integration', () => {
    it('a keyboard choice updates the value and dirty; touched follows blur', async () => {
      await press('ArrowDown');
      await press('ArrowDown'); // Aisha
      await press('Enter');

      expect(host.control.value).toBe('p2');
      expect(host.control.dirty).toBe(true);
      expect(host.control.touched).toBe(false);
      expect(isExpanded()).toBe(false);
      expect(trigger.textContent?.trim()).toBe('Aisha');

      trigger.blur();
      await fixture.whenStable();
      expect(host.control.touched).toBe(true);
    });

    it('a programmatic value is shown but does not mark the control dirty', async () => {
      host.control.setValue('p5');
      await fixture.whenStable();

      expect(trigger.textContent?.trim()).toBe('Mateo');
      expect(host.control.dirty).toBe(false);
    });

    it('when disabled, is exposed as disabled, leaves the tab order and ignores keys', async () => {
      host.control.disable();
      await fixture.whenStable();

      expect(trigger.getAttribute('aria-disabled')).toBe('true');
      expect(trigger.hasAttribute('tabindex')).toBe(false);

      await press('ArrowDown');
      expect(isExpanded()).toBe(false);
    });
  });

  describe('typeahead', () => {
    it('with no value, jumps to the first match, not the one after it', async () => {
      // Regression: opening set Marta active, then the search began after her.
      await press('m');
      expect(activeOption()?.textContent).toContain('Marta');
    });

    it('repeating a letter cycles through the matches', async () => {
      await press('a');
      expect(activeOption()?.textContent).toContain('Aisha');
      await press('a');
      expect(activeOption()?.textContent).toContain('Aidan');
    });

    it('several letters typed together narrow the match', async () => {
      await press('m');
      await press('a');
      await press('t');
      await press('e');
      expect(activeOption()?.textContent).toContain('Mateo');
    });
  });
});

describe('Select with several hundred options', () => {
  @Component({
    imports: [ReactiveFormsModule, Select],
    template: `<cw-select label="Account" [options]="options" [formControl]="control" />`,
  })
  class LargeHost {
    options = Array.from({ length: 500 }, (_, i) => `Account ${String(i + 1).padStart(4, '0')}`);
    control = new FormControl<string | null>(null);
  }

  it('reaches and chooses the last option by keyboard', async () => {
    TestBed.configureTestingModule({ imports: [LargeHost] });
    const fixture = TestBed.createComponent(LargeHost);
    await fixture.whenStable();
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '[role="combobox"]',
    )!;

    const press = async (key: string) => {
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      await fixture.whenStable();
    };

    await press('End');
    const active = document.getElementById(trigger.getAttribute('aria-activedescendant')!);
    expect(active?.textContent?.trim()).toBe('Account 0500');

    await press('Enter');
    expect(fixture.componentInstance.control.value).toBe('Account 0500');
  });
});
