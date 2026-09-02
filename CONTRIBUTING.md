# Contributing

No dependencies, no install step. Any Node 14 or newer will run everything
here.

```sh
node build.js          # rebuild the two shipped HTML files from src/
node build.js --check   # verify the committed files match src/
node tools/check.js     # token system consistency checks
node tools/make-docs.js # regenerate docs/THEMES.md
```

## How the repo fits together

The two files at the root — `sticky-note.html` and `theme-builder.html` — are
**generated and committed**. Committing build output is usually a smell, but
here it is the product: someone downloads one file, drops it anywhere, and
points OBS at it. Nobody should need Node to use this. CI runs
`node build.js --check` so the committed files can never drift from source.

Edit `src/`, never the root HTML.

```
src/
  theme.js           token definitions, validation, share codes, field metadata
  themes.js          the eight built-in themes, as data
  note.css           all styling for the note and the dock
  note.js            the note app (state, sync, dock controls)
  note.body.html     the note's markup
  builder.css        the builder's own chrome
  builder.js         the builder (generated from theme.js metadata)
  builder.body.html  the builder's markup
  fonts/             base64 woff2, isolated so they never appear in a diff
tools/
  check.js           consistency checks
  make-docs.js       generates docs/THEMES.md
  make-gallery.js    renders every theme onto one page, for screenshots
```

The fonts live in their own files for one reason: they are 160 KB of base64 and
would otherwise make every diff of the app unreadable.

## Adding a theme

Don't write CSS. A theme is data in `src/themes.js`: a partial object listing
only what differs from the defaults. Easiest path is to design it in
`theme-builder.html`, click **Save .json**, and paste the values in.

If you find yourself wanting a selector to express your theme, that is a
missing token — see below.

## Adding a token

The rule this project holds itself to: **no per-theme CSS.** Every look is
reachable through tokens, so a theme somebody writes can do anything a built-in
can. `note.css` contains no theme names, and `tools/check.js` fails if a
`data-*` value appears in CSS that the token set would reject.

To add one:

1. Add it to `DEFAULTS` in `src/theme.js`, with a trailing comment — that
   comment becomes its description in the generated docs.
2. Add a range to `RANGES` if it is numeric, or values to `ENUM_VALUES` if it
   is a fixed set. Numeric tokens without a range fail the checks, because the
   builder would give them an unbounded slider.
3. List it in `COLOR_KEYS` if it is a colour.
4. Emit it in `applyTheme` as a custom property, or as a `data-*` attribute if
   CSS needs to select on it.
5. Read it in `src/note.css`.
6. Name it in a `FIELD_GROUPS` entry so the builder grows a control for it.
   Add it to `BASIC_FIELDS` only if most people would reach for it.

Then `node tools/check.js`. It verifies every token is exposed exactly once,
every custom property the CSS reads is actually produced, every `data-*` the
CSS selects on is written, and that all eight built-ins still round-trip
through a share code unchanged. Skipping a step is caught rather than shipped:
a token that is emitted but has no default writes `undefinedpx` into a custom
property, which invalidates the whole declaration instead of falling back.

## Things worth knowing

**Colour maths happens in JavaScript, not CSS.** `color-mix()` and relative
colour syntax would be tidier, but they need a newer Chromium than some
shipping OBS builds carry, and a theme that silently loses its colours on
someone's OBS is a bad trade for shorter code.

**The dock and the overlay are the same file** with a `?view=dock` parameter,
kept in sync through `localStorage` plus a one-second poll. The poll is the
fallback for when `storage` events don't cross OBS's browser contexts.

**The builder cannot talk to the note.** It runs in your desktop browser; the
note runs inside OBS's embedded one. Separate browsers, separate storage. That
is why themes travel as a code you copy, and it is not a limitation worth
trying to engineer around.

**Anything pasted in is untrusted.** `decodeTheme` takes a code off someone's
clipboard, so it drops unknown keys, clamps numbers to their ranges, rejects
values outside an enum, and returns `null` rather than half-applying junk.

## Checking your work

`tools/make-gallery.js` renders all eight themes onto one page — useful for
eyeballing a change across every theme at once, and it is where the README's
theme grid comes from.

For a real check, load the file in OBS. Some things only show up there:
transparency over live video, how the dock behaves at the width OBS gives it,
and whether the overlay picks up a change within a second.
