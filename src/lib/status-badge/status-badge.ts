import { Component, Input } from '@angular/core';

/**
 * Shows the processing state of an engagement.
 *
 * Usage:
 * ```html
 * <cw-status-badge label="Ready" [isReady]="true"></cw-status-badge>
 * ```
 */
@Component({
  selector: 'cw-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
})
export class StatusBadge {
  @Input() label = '';
  @Input() isReady = false;
  @Input() isProcessing = false;
  @Input() isError = false;
  @Input() isSmall = false;
  @Input() isLarge = false;
  @Input() tooltip = '';

  get cssClass(): string {
    let css = 'badge';
    if (this.isReady) {
      css += ' badge-ready';
    }
    if (this.isProcessing) {
      css += ' badge-processing';
    }
    if (this.isError) {
      css += ' badge-error';
    }
    if (this.isSmall) {
      css += ' badge-sm';
    }
    if (this.isLarge) {
      css += ' badge-lg';
    }
    return css;
  }
}
