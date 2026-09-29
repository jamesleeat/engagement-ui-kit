# Adoption

## Releasing the `cw-status-badge` change

The new API is breaking, so its end state is a **major (2.0.0)**. With several teams depending
on the kit, I would get there in two steps. First, a **minor** adds `tone` and `size` alongside
the old booleans, which become deprecated aliases that log a one-time dev-mode warning (and
warn loudly on contradictions such as `isReady` + `isError`). The accessibility and token fixes
ship in that minor too, because they are fixes, not API changes. Second, **2.0.0** removes the
aliases and makes `label` required. Consumers follow the [CHANGELOG](CHANGELOG.md) table. The
renames are mechanical; the two changes that need judgment are passing human-readable labels,
since the label is now read aloud (`"READY"` is what a screen reader would say today), and
re-adding any spacing they got from the removed `::ng-deep` margin.

## Making adoption safe, not merely possible

Ship an `ng update` migration that rewrites the simple bindings and _flags_ dynamic ones it
can't map safely, rather than guessing. In CI, enforce the contracts the design relies on: a
stylelint rule banning hex values and primitive tokens inside kit components (a grep caught
two such slips during this work), a check that every theme re-declares every colour role, axe
runs on the workbench in both themes, and the focused tests that pin the ARIA contract.

## Two kit versions on one page

Both copies write the same global `:root` tokens, and the last stylesheet loaded wins. So a
semantic token renamed or re-pointed in one version silently restyles the other. Worse,
`cw-select` IDs come from a per-copy counter starting at 0, so both copies produce
`cw-select-0-label`. `aria-labelledby` and `aria-activedescendant` can then resolve to the
other copy's elements: the screen reader reads the wrong label, and nothing looks broken. The
design helps in that components consume only semantic tokens, so token names are the entire
cross-version contract, and both versions respond to one `data-cw-theme` attribute. It hurts
in that those names are unversioned globals. I would treat semantic token names as
semver-governed public API, derive ID prefixes per copy, and share the kit as a federation
singleton (`strictVersion`), so a second copy is a build error rather than a runtime surprise.
