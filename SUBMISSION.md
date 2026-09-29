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
