import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The meaning a badge carries. Consumers map their own states onto these. */
export type StatusBadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

export type StatusBadgeSize = 'sm' | 'md' | 'lg';

/**
 * A short, non-interactive status label, such as an engagement's processing
 * state.
 *
 * The label text *is* the status: it is what assistive technology reads, and
 * the colour and dot only reinforce it. The badge is deliberately not a live
 * region. If a status change needs announcing, that is the page's decision.
 *
 * ```html
 * <cw-status-badge tone="success" label="Ready" />
 * ```
 *
 * Breaking change from 1.x: `isReady` / `isProcessing` / `isError` are
 * replaced by `tone`, `isSmall` / `isLarge` by `size`, and `label` is now
 * required. See ADOPTION.md.
 */
@Component({
  selector: 'cw-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tone]': 'tone()',
    '[attr.data-size]': 'size()',
    '[attr.title]': 'tooltip() || null',
  },
})
export class StatusBadge {
  /** The visible and accessible text of the status. */
  readonly label = input.required<string>();

  readonly tone = input<StatusBadgeTone>('neutral');

  readonly size = input<StatusBadgeSize>('md');

  /**
   * @deprecated A `title` tooltip cannot be reached by keyboard or touch, and
   * screen readers treat it inconsistently. Never put information only here.
   * Kept for compatibility until an accessible tooltip exists in the kit.
   */
  readonly tooltip = input<string>('');
}
