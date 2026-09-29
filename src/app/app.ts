import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { StatusBadge } from '../lib/public-api';
import { CHANGE_GROUPS, ENGAGEMENTS, REVIEWERS } from './data/engagement-fixtures';

/**
 * The workbench: a consumer of the kit in `src/lib`.
 *
 * It exists so components can be built, demonstrated and reviewed in a running
 * application. Change it freely — it is a consumer, not part of the kit.
 */
@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, StatusBadge],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly engagements = ENGAGEMENTS;
  protected readonly reviewers = REVIEWERS;
  protected readonly changeGroups = CHANGE_GROUPS;

  /** A form control for the reviewer filter, ready for a form-integrated control. */
  protected readonly reviewerId = new FormControl<string | null>(null);
}
