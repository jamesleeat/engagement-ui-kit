# Submission notes

_Draft, filled in as the work progresses._

## AI usage

I paired with Claude (Claude Code) throughout. I set the direction and made the decisions; it
drafted code, which I reviewed and verified phase by phase.

Where AI output was corrected or verified:

- **Token contrast ratios.** The first draft of the dark theme annotated each token with a
  contrast ratio. Several were estimates and were wrong (e.g. muted text claimed 8.2:1, actually
  7.5:1; disabled text claimed 5.5:1, actually 5.2:1). All ratios were then computed with a WCAG
  relative-luminance script and the comments corrected. None of the errors crossed a pass/fail
  threshold, but the annotations are now measured rather than asserted.
- **Forced-colours outline.** A drafted `cw-select` style put `outline: 2px solid transparent`
  on every option, the common trick for making an indicator appear only in forced-colours
  mode. Applied to every option it would have outlined *all* of them in Windows High Contrast,
  so the active option would have been indistinguishable. Replaced with a real outline on the
  active option only.
- **Index typing.** `items()[selectedIndex()]` is typed as always defined, but the index can be
  `-1`. The Angular extended diagnostic (NG8102) caught it via a now-meaningful `??`; the
  `undefined` case is now explicit in the type.
- **Primitive leaks.** After the badge rework I grepped every kit stylesheet for primitive
  tokens. It found two slips in AI-drafted styles: the badge's small size used
  `--cw-font-size-xs` and the select's listbox used `--cw-space-1`. Both now go through
  semantic tokens. This check is cheap and should be automated (see ADOPTION.md).
- **A review pass before writing tests found three bugs in AI-drafted code** that the earlier
  browser checks had not exercised:
  - Typeahead from a closed control with no value skipped the first match: opening made the
    first option active, then the search started *after* it (typing "m" went to Mateo, not
    Marta). Found by reading the code, then pinned by a regression test.
  - A disabled control had `tabindex="-1"`, which is still mouse-focusable, so clicking it could
    mark a disabled control as touched. The tabindex is now removed entirely.
  - The forced-colours mapping set the active option's background to `Highlight` while its text
    stayed `CanvasText`, an unpaired system-colour combination that can be unreadable. All
    backgrounds are now `Canvas`, and state is carried by the `Highlight` outline.
- **Tests were checked against the bugs they claim to catch**: with the fixes reverted, the
  typeahead and disabled-state tests fail (`expected 'Mateo' to contain 'Marta'`).
- **Keyboard behaviour was verified in a real browser**, not only in unit tests: opening,
  arrows, Home/End, typeahead (including multi-character and space), Escape leaving the value
  unchanged, Enter on an unavailable option doing nothing, Tab marking the control touched,
  and the active option scrolling into view in a 500-option list.

## Time spent

_TBD_

## What I would do next

_TBD_

## Known limitation and the next test I would write

_TBD_
