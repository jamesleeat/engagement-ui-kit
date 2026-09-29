# Submission notes

## AI usage

I paired with Claude (via Claude Code) throughout. I set the scope and made the decisions
recorded in DECISIONS.md. The AI drafted most of the code and prose, and I reviewed,
questioned and verified it phase by phase before committing. The git history follows those
phases.

**Where it helped most:** reading the starter and listing the inherited badge's problems
quickly, drafting the combobox keyboard handling and the token files, and doing the
mechanical parts (contrast calculations, consumer updates, test scaffolding).

**Where AI output was wrong, and how it was caught.** Accessibility is where generated code is
often confidently wrong, so I did not accept any of it on the strength of looking right:

- **Contrast ratios were asserted, not measured.** The first dark-theme draft annotated tokens
  with ratios that were estimates, several of them wrong (muted text claimed 8.2:1, actually
  7.5:1). Every ratio was then computed with a WCAG relative-luminance script and corrected.
  None crossed a pass/fail threshold.
- **A forced-colours trick applied too widely.** `outline: 2px solid transparent` on every
  option (a common High Contrast technique) would have outlined _all_ options in forced
  colours, making the active one indistinguishable. It became a real outline on the active
  option only.
- **Unpaired system colours.** The forced-colours mapping put `CanvasText` on a `Highlight`
  background for the active option. That pairing isn't guaranteed readable. All backgrounds
  are now `Canvas`, and state is carried by the outline.
- **Typeahead skipped the first match.** With no value, typing "m" jumped to Mateo, not Marta:
  opening made the first option active, then the search began _after_ it. Found by a code
  review pass, then pinned by a regression test.
- **A disabled control was still mouse-focusable** (`tabindex="-1"`), so clicking it could
  mark a disabled control as touched.
- **Primitive tokens leaked into components** twice, despite the rule in the token files. A
  grep found both. This should be a lint rule (ADOPTION.md).
- **A type gap**: an array lookup at index `-1` typed as always defined, caught by an Angular
  extended diagnostic.

**How I verified:**

- I drove every required behaviour by keyboard in a real browser, in both themes: opening,
  arrows, Home/End, typeahead, Escape leaving the value unchanged, Enter on an unavailable
  option doing nothing, Tab marking touched, and scrolling in a 500-option list.
- I followed the ARIA ID references in the DOM rather than trusting that attributes existed.
- I checked the tests against the bugs they claim to catch: with the fixes reverted, the
  typeahead and disabled-state tests fail.

**Not verified:** I have not yet run `cw-select` with a screen reader (NVDA or VoiceOver). The
ARIA follows the APG pattern and was inspected in the DOM, but announcement wording differs
between screen readers, and that is the next check I would make.

## Time spent

About 1 hour building with AI assistance, and about 2 hours reviewing, verifying and working
through the solution until I could explain and defend every part of it. Roughly 3 hours in total.

## What I would do next

1. **Expose validation state** on `cw-select` (see below). This is the most significant gap.
2. **Make generated IDs unique per copy of the kit**, so two versions on one page cannot
   cross-wire `aria-labelledby` and `aria-activedescendant` (ADOPTION.md).
3. **Automate the token contracts:** a stylelint rule banning primitives and hex values in
   components, and a check that every theme declares every colour role.
4. **Screen-reader pass** with NVDA and VoiceOver, and an axe run on the workbench in both
   themes.
5. **API growth when needed:** an option template for rich content, a visually hidden label
   option, a Signal Forms `FormValueControl`, and Popover API positioning so the list can't be
   clipped.
6. When the bound value matches no option, the trigger shows the placeholder, which hides that
   a value exists. That case should be surfaced (or reported in dev mode).

## Known limitation, and the next test I would write

**`cw-select` does not expose validation state.** When the bound control has
`Validators.required` and is invalid, a sighted user sees whatever error message the consuming
screen renders, but the combobox itself carries no `aria-required` or `aria-invalid`, and
nothing links it to the message. A screen-reader user is not told the field is required or
that it failed. The fix is to read the control's state through `NgControl` (which means
replacing the `NG_VALUE_ACCESSOR` provider, to avoid a circular dependency), and to accept an
`aria-describedby` for the error text.

The next test: host `cw-select` with `new FormControl(null, Validators.required)`, focus and
blur it without choosing, and assert that the combobox has `aria-invalid="true"` and
`aria-required="true"`, and that its `aria-describedby` resolves to the rendered error text.
