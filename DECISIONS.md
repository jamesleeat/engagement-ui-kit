# Decisions

The decisions below are the ones where another reasonable implementation would have behaved
differently. Each names the alternative I considered and what would have changed.

## 1. The picker is a select-only combobox; focus never leaves the trigger

`cw-select` follows the WAI-ARIA select-only combobox pattern. DOM focus stays on the
`role="combobox"` trigger for the whole interaction, and the option being navigated is exposed
with `aria-activedescendant`. The listbox's `mousedown` is cancelled, so pointer use doesn't
move focus either.

This makes two required behaviours structural rather than something every code path must
remember: focus cannot be lost to the document, and dismissing needs no focus restoration,
because focus never left.

**Alternative: roving focus** (real DOM focus moves onto each option). This is better supported
by some older screen-reader and browser combinations. But every close path (Escape, Tab, click
outside, option removed while focused, control disabled mid-interaction) would have to restore
focus correctly, and that is where these components usually break.

Two places where I deliberately depart from the APG _example_ (not the pattern):

- **`aria-selected` marks the current value**, not the active option. The example moves
  `aria-selected` with the active option. Keeping "active" (`aria-activedescendant`) and
  "selected" (the value) as separate facts lets assistive technology tell "where I am" from
  "what is chosen".
- **Tab closes the list without committing.** In the example, Tab commits the active option.
  For assigning a reviewer, silently reassigning because someone tabbed away is the worse
  failure. Enter, Space and click are the only ways to choose.

## 2. Options are data read through accessors, not projected children

```html
<cw-select [options]="reviewers" [optionLabel]="name" [optionValue]="id" [optionDisabled]="away" />
```

Consumers pass their domain objects as they are. The form value is whatever `optionValue`
returns, compared with `Object.is`. With the defaults, a plain `string[]` works with no
accessors at all, which the change-group picker in the workbench demonstrates. One `computed()`
maps options to items, so typeahead searches precomputed lower-case labels even at several
hundred options.

**Alternative: projected `<cw-option [value]>` children.** Rich option content (avatars,
secondary text) would come for free, but at the cost of content-query bookkeeping, a component
instance per option, and a looser contract about what an option's accessible name is. If rich
content becomes a requirement, I would add an optional `<ng-template>` for option content and
keep data as the source of truth.

Related choices:

- **Typing jumps; it does not filter.** It matches the native `<select>` behaviour users
  already know. Filtering would make this an editable combobox, a different pattern with a text
  input.
- **Unavailable options stay in the arrow-key sequence**, with `aria-disabled="true"`, and
  cannot be chosen. Skipping them would hide from screen-reader users that Chen Wei exists but
  is unavailable, which is information sighted users get. The visible "Unavailable" hint is
  `aria-hidden`, because `aria-disabled` already announces it.

## 3. Forms integration is a `ControlValueAccessor`, and forms are the only value API

The starter hands the component a reactive `FormControl`, and CVA works with reactive and
template-driven forms alike (the workbench uses both). I did not add a parallel
`[(value)]`/`model()` API. Two ways to own the value invites conflicts (`[value]` and
`[formControl]` on the same element).

**Alternative: Angular 21 Signal Forms (`FormValueControl`)**, the more current idiom. I chose
CVA because Signal Forms is still experimental, and a shared kit should not make every
consuming team adopt an experimental API to use a select. A CVA also keeps working once teams
migrate. Adding a `FormValueControl` alongside it is the natural next step.

**Known consequence:** the component does not yet reflect validation state (`aria-invalid`,
`aria-required`) from the bound control. See SUBMISSION.md.

## 4. Tokens name roles; a theme is a re-declaration of colour roles on an attribute

Kit components consume only semantic tokens (`--cw-color-text-muted`,
`--cw-color-border-control`, `--cw-control-padding-inline`). Primitives are never referenced
outside `tokens/`, which I checked with a grep that caught two slips (see SUBMISSION.md).

- A **theme** is one file that re-declares every colour role under
  `[data-cw-theme='<name>']`. Because these are custom properties, the attribute works on
  `<html>` or on any subtree, and `[data-cw-theme='light']` restores the default inside a dark
  region. The dark theme needed no new primitives.
- **Themes are opt-in, not tied to `prefers-color-scheme`.** A product should not flip dark
  before its own screens are ready. The application decides; following the OS is one line in
  the app.
- **Forced colours** is handled once, in the token layer, by mapping roles to paired system
  colours. Components only have to avoid carrying state on background alone.
- `border-control` (3:1 against its surface, WCAG 1.4.11) is deliberately separate from the
  decorative `border-default`. Merging them would force heavy borders everywhere or leave
  controls with invisible edges. Every contrast figure in the token comments is computed, not
  estimated.

**Alternative: compile-time SCSS themes** (a stylesheet per theme). This produces smaller CSS
and allows static contrast checks, but switching themes needs a stylesheet swap, a region of a
page can't be themed, and every component's styles are duplicated per theme, which is exactly
what the brief asked to avoid.

## 5. `cw-status-badge`: one tone, a required label, and a deliberate break

The inherited badge hid its label from assistive technology (`aria-hidden` on the text),
conveyed state by dot colour alone, allowed contradictory states (`isReady` and `isError`
together), and leaked a margin into a consumer (`::ng-deep .engagement-row .badge`). I replaced
the booleans with `tone: 'neutral' | 'success' | 'warning' | 'danger'` and
`size: 'sm' | 'md' | 'lg'`, and made `label` required.

- **Tone, not engagement status.** A kit badge shouldn't know what an engagement is. The
  workbench maps `EngagementStatus` to tone and label with a `Record`, so a new status is a
  compile error until someone decides how it looks and reads.
- **`label` is a required input, not projected content**, because the compiler can enforce a
  required input, and an empty badge is an accessibility failure.
- **Deliberately not a live region.** `role="status"` would make a list of badges announce
  itself on every re-render. Announcing a _change_ of status is a page-level decision.
- **Deliberately left: `tooltip`.** It still renders `title` (no longer an empty one), and is
  marked `@deprecated`. It is supplementary, since the status is in the text. The right
  replacement is an accessible tooltip component, not a patch here, and removing it would have
  widened the break for no user benefit today.

**Alternative: a non-breaking bridge**, keeping the boolean inputs as deprecated aliases that
compute `tone`. I implemented the end state instead and describe the bridge as the release
path in ADOPTION.md. The accessibility fixes are the same either way.

## Assumptions

- A disabled select is removed from the tab order, like a native disabled `<select>`, rather
  than being focusable but inert.
- The popup is positioned absolutely below the trigger. Collision handling is out of scope, so
  it can be clipped by an `overflow: hidden` ancestor. The Popover API or CSS anchor positioning
  would be the fix.
- Default strings ("Select an option", "Unavailable") are English inputs that consumers
  override. The kit has no i18n story yet.
