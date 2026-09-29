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

## Time spent

_TBD_

## What I would do next

_TBD_

## Known limitation and the next test I would write

_TBD_
