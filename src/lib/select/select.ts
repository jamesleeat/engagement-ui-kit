import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** How long a pause ends a typeahead search, in ms. */
const TYPEAHEAD_RESET_MS = 500;

/** How far PageUp / PageDown move the active option. */
const PAGE_SIZE = 10;

let nextId = 0;

interface SelectItem<V> {
  label: string;
  value: V;
  disabled: boolean;
  /** Lower-cased label, precomputed once per options change for typeahead. */
  search: string;
}

/**
 * A single-select control: a labelled trigger that opens a list of options.
 *
 * Follows the WAI-ARIA "select-only combobox" pattern. DOM focus stays on the
 * trigger at all times; the option being navigated is exposed through
 * `aria-activedescendant`. Integrates with Angular forms as a
 * `ControlValueAccessor`.
 *
 * Options are passed in as data, of any shape. Accessors say how to read an
 * option's label, value and availability, so domain objects can be passed
 * as they are:
 *
 * ```html
 * <cw-select
 *   label="Reviewer"
 *   [options]="reviewers"
 *   [optionLabel]="reviewerName"
 *   [optionValue]="reviewerId"
 *   [optionDisabled]="isUnavailable"
 *   [formControl]="reviewerControl"
 * />
 * ```
 *
 * The form value is whatever `optionValue` returns, compared with
 * `Object.is`. With the default accessors, `options` is a list of strings
 * and the value is the chosen string.
 */
@Component({
  selector: 'cw-select',
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Select), multi: true }],
})
export class Select<T, V = T> implements ControlValueAccessor {
  /** Visible label. Required: every instance must have an accessible name. */
  readonly label = input.required<string>();

  /** The options, in display order. */
  readonly options = input.required<readonly T[]>();

  /** Reads an option's display text. Also its accessible name and typeahead key. */
  readonly optionLabel = input<(option: T) => string>(String);

  /** Reads an option's form value. Defaults to the option itself. */
  readonly optionValue = input<(option: T) => V>((option) => option as unknown as V);

  /** Marks options that are shown but cannot be chosen. */
  readonly optionDisabled = input<(option: T) => boolean>(() => false);

  /** Shown in the trigger while there is no value. */
  readonly placeholder = input('Select an option');

  /** Visible hint beside options that cannot be chosen. */
  readonly unavailableText = input('Unavailable');

  private readonly trigger = viewChild.required<ElementRef<HTMLElement>>('trigger');
  private readonly listbox = viewChild.required<ElementRef<HTMLElement>>('listbox');

  protected readonly id = `cw-select-${nextId++}`;
  protected readonly labelId = `${this.id}-label`;
  protected readonly listboxId = `${this.id}-listbox`;

  protected readonly value = signal<V | null>(null);
  protected readonly disabled = signal(false);
  protected readonly isOpen = signal(false);
  protected readonly activeIndex = signal(-1);

  protected readonly items = computed<SelectItem<V>[]>(() => {
    const label = this.optionLabel();
    const value = this.optionValue();
    const disabled = this.optionDisabled();
    return this.options().map((option) => {
      const text = label(option);
      return {
        label: text,
        value: value(option),
        disabled: disabled(option),
        search: text.toLocaleLowerCase(),
      };
    });
  });

  protected readonly selectedIndex = computed(() => {
    const value = this.value();
    return value === null ? -1 : this.items().findIndex((item) => Object.is(item.value, value));
  });

  /** `undefined` when there is no value, or the value matches no option. */
  protected readonly selectedLabel = computed<string | undefined>(
    () => this.items()[this.selectedIndex()]?.label,
  );

  protected readonly activeDescendant = computed(() => {
    const index = this.activeIndex();
    return this.isOpen() && index >= 0 && index < this.items().length ? this.optionId(index) : null;
  });

  private onChange: (value: V | null) => void = () => {};
  private onTouched: () => void = () => {};

  private typeaheadBuffer = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.typeaheadTimer));

    // Keep the active option visible as it moves through a long list.
    afterRenderEffect(() => {
      const id = this.activeDescendant();
      if (id) {
        // `scrollIntoView` is absent in some DOM implementations (e.g. jsdom).
        this.listbox()
          .nativeElement.querySelector(`#${id}`)
          ?.scrollIntoView?.({ block: 'nearest' });
      }
    });
  }

  protected optionId(index: number): string {
    return `${this.id}-option-${index}`;
  }

  // --- ControlValueAccessor ---------------------------------------------------

  writeValue(value: V | null | undefined): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: V | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (isDisabled) {
      this.close();
    }
  }

  // --- Interaction ------------------------------------------------------------

  protected focusTrigger(): void {
    this.trigger().nativeElement.focus();
  }

  protected onTriggerClick(): void {
    if (this.disabled()) {
      return;
    }
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  protected onTriggerBlur(): void {
    // Clicks inside the listbox do not blur the trigger (their mousedown is
    // prevented), so a blur always means focus has left the control.
    this.close();
    this.onTouched();
  }

  protected onOptionClick(index: number): void {
    this.commit(index);
  }

  protected onOptionPointerMove(index: number): void {
    // pointermove rather than mouseenter: the list scrolling under a resting
    // pointer during keyboard navigation must not steal the active option.
    if (this.activeIndex() !== index) {
      this.activeIndex.set(index);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }
    if (this.isOpen()) {
      this.onKeydownOpen(event);
    } else {
      this.onKeydownClosed(event);
    }
  }

  private onKeydownClosed(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.open();
        return;
      case 'Home':
        event.preventDefault();
        this.open(0);
        return;
      case 'End':
        event.preventDefault();
        this.open(this.items().length - 1);
        return;
    }
    if (isPrintableKey(event)) {
      event.preventDefault();
      // Search from the current value, so that with no value the first match
      // wins rather than the one after the default active option.
      this.open(this.selectedIndex());
      this.typeahead(event.key);
      if (this.activeIndex() < 0) {
        this.open();
      }
    }
  }

  private onKeydownOpen(event: KeyboardEvent): void {
    const last = this.items().length - 1;
    const active = this.activeIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.set(Math.min(active + 1, last));
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (event.altKey) {
          this.commit(active);
        } else {
          this.activeIndex.set(Math.max(active - 1, 0));
        }
        return;
      case 'Home':
        event.preventDefault();
        this.activeIndex.set(0);
        return;
      case 'End':
        event.preventDefault();
        this.activeIndex.set(last);
        return;
      case 'PageDown':
        event.preventDefault();
        this.activeIndex.set(Math.min(active + PAGE_SIZE, last));
        return;
      case 'PageUp':
        event.preventDefault();
        this.activeIndex.set(Math.max(active - PAGE_SIZE, 0));
        return;
      case 'Enter':
        event.preventDefault();
        this.commit(active);
        return;
      case ' ':
        event.preventDefault();
        // Mid-search, space is part of the query ("Jean-Baptiste M…").
        if (this.typeaheadBuffer) {
          this.typeahead(' ');
        } else {
          this.commit(active);
        }
        return;
      case 'Escape':
        // Handled here, so an enclosing dialog must not also close.
        event.preventDefault();
        event.stopPropagation();
        this.close();
        return;
      case 'Tab':
        // Leave the value alone and let focus move on normally.
        this.close();
        return;
    }
    if (isPrintableKey(event)) {
      event.preventDefault();
      this.typeahead(event.key);
    }
  }

  // --- State transitions ------------------------------------------------------

  private open(activeIndex?: number): void {
    const items = this.items();
    const firstEnabled = items.findIndex((item) => !item.disabled);
    const selected = this.selectedIndex();
    this.activeIndex.set(activeIndex ?? (selected >= 0 ? selected : Math.max(firstEnabled, 0)));
    this.isOpen.set(true);
  }

  private close(): void {
    this.isOpen.set(false);
    this.resetTypeahead();
  }

  /** Chooses the option at `index` and closes, unless it cannot be chosen. */
  private commit(index: number): void {
    const item: SelectItem<V> | undefined = this.items()[index];
    if (!item || item.disabled) {
      return;
    }
    if (!Object.is(item.value, this.value())) {
      this.value.set(item.value);
      this.onChange(item.value);
    }
    this.close();
  }

  /**
   * Moves the active option to the next label starting with what has been
   * typed. Typing one character repeatedly cycles through the labels starting
   * with it; a pause of TYPEAHEAD_RESET_MS starts a new search.
   */
  private typeahead(char: string): void {
    clearTimeout(this.typeaheadTimer);
    this.typeaheadBuffer += char.toLocaleLowerCase();
    this.typeaheadTimer = setTimeout(() => this.resetTypeahead(), TYPEAHEAD_RESET_MS);

    const buffer = this.typeaheadBuffer;
    const cycling = [...buffer].every((c) => c === buffer[0]);
    const query = cycling ? buffer[0] : buffer;

    const items = this.items();
    const active = this.activeIndex();
    // A fresh or cycling search looks past the current option; a longer query
    // may still match the current one, so it starts there.
    const start = cycling ? active + 1 : Math.max(active, 0);

    for (let offset = 0; offset < items.length; offset++) {
      const index = (start + offset) % items.length;
      if (items[index].search.startsWith(query)) {
        this.activeIndex.set(index);
        return;
      }
    }
  }

  private resetTypeahead(): void {
    clearTimeout(this.typeaheadTimer);
    this.typeaheadBuffer = '';
  }
}

function isPrintableKey(event: KeyboardEvent): boolean {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}
