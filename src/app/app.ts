import { DOCUMENT } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { Select, StatusBadge, StatusBadgeTone } from '../lib/public-api';
import {
  CHANGE_GROUPS,
  ENGAGEMENTS,
  EngagementStatus,
  REVIEWERS,
  ReviewerOption,
} from './data/engagement-fixtures';

type WorkbenchTheme = 'light' | 'dark';

/**
 * How this product presents engagement states. Domain knowledge lives here,
 * not in the kit; a `Record` makes a new state a compile error until mapped.
 */
const ENGAGEMENT_STATUS_BADGE: Record<EngagementStatus, { tone: StatusBadgeTone; label: string }> =
  {
    READY: { tone: 'success', label: 'Ready' },
    PROCESSING: { tone: 'warning', label: 'Processing' },
    ERROR: { tone: 'danger', label: 'Error' },
  };

/**
 * The workbench: a consumer of the kit in `src/lib`.
 *
 * It exists so components can be built, demonstrated and reviewed in a running
 * application. Change it freely — it is a consumer, not part of the kit.
 */
@Component({
  selector: 'app-root',
  imports: [FormsModule, ReactiveFormsModule, Select, StatusBadge],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly engagements = ENGAGEMENTS;
  protected readonly reviewers = REVIEWERS;
  protected readonly changeGroups = CHANGE_GROUPS;
  protected readonly statusBadge = ENGAGEMENT_STATUS_BADGE;

  /** A form control for the reviewer filter, ready for a form-integrated control. */
  protected readonly reviewerId = new FormControl<string | null>(null);

  protected readonly reviewerName = (reviewer: ReviewerOption) =>
    `${reviewer.name} (${reviewer.role})`;
  protected readonly reviewerKey = (reviewer: ReviewerOption) => reviewer.id;
  protected readonly isUnavailable = (reviewer: ReviewerOption) => reviewer.unavailable === true;

  /** Template-driven, plain strings, default accessors: a non-reviewer use. */
  protected changeGroup: string | null = null;

  /** A long list, to exercise scrolling and typeahead at scale. */
  protected readonly manyOptions = Array.from(
    { length: 500 },
    (_, i) => `Account ${String(i + 1).padStart(4, '0')}`,
  );
  protected account: string | null = null;

  protected readonly theme = signal<WorkbenchTheme>('light');

  constructor() {
    // The kit's theming contract is one attribute; putting it on <html> themes
    // the whole document, including anything rendered outside this component.
    const root = inject(DOCUMENT).documentElement;
    effect(() => root.setAttribute('data-cw-theme', this.theme()));
  }

  protected toggleTheme(): void {
    this.theme.update((theme) => (theme === 'light' ? 'dark' : 'light'));
  }

  protected toggleReviewerDisabled(): void {
    if (this.reviewerId.disabled) {
      this.reviewerId.enable();
    } else {
      this.reviewerId.disable();
    }
  }
}
