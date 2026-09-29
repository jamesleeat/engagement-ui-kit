# Changelog — Engagement UI kit

## 2.0.0

### ⚠ Breaking: `cw-status-badge`

The status is now one value instead of three booleans that could contradict each other, and
the label is now announced to assistive technology (it was previously `aria-hidden`).

| 1.x                                     | 2.0                            |
| --------------------------------------- | ------------------------------ |
| `[isReady]="true"`                      | `tone="success"`               |
| `[isProcessing]="true"`                 | `tone="warning"`               |
| `[isError]="true"`                      | `tone="danger"`                |
| no flag set                             | `tone="neutral"` (the default) |
| `[isSmall]="true"` / `[isLarge]="true"` | `size="sm"` / `size="lg"`      |
| `label` optional, defaulted to `''`     | `label` **required**           |
| `tooltip`                               | unchanged, now **deprecated**  |

What consumers must check, beyond the mechanical rename:

- **The label is now read aloud.** If you passed a raw enum (`label="READY"`), screen reader
  users now hear it. Pass human-readable text.
- **The badge no longer adds `margin-left: 4px`** inside `.engagement-row`. That rule leaked out
  of the component; if you relied on it, add the spacing in your own layout.
- **Colours now come from semantic tokens**, so the badge follows the active theme. Its default
  (neutral) text is darker than before, which was a contrast failure (2.4:1, now 12:1).
- `tooltip` still renders a `title` attribute, which keyboard and touch users cannot reach.
  Do not put information only there. It will be removed when the kit has an accessible tooltip.

### Added

- `cw-select`: a single-select, form-integrated combobox.
- Semantic token layer and a dark theme (`data-cw-theme="dark"`), plus a forced-colours mapping.
