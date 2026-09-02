# Changelog

## Unreleased

### Themes are data now

The theme system was rebuilt around tokens. Previously a theme was five CSS
variables plus a hand-written `[data-theme]` block, which meant only the
project could add one, and the two colour pickers were all anyone else got.
The Asylum Life theme had already outgrown it — expressing it took about 90
lines of bespoke CSS overriding the silhouette, fonts, checkbox, and animation.

- A theme is now 67 tokens of plain data covering colour, paper texture,
  silhouette, corner treatment, tape or pushpin, fonts, title styling,
  checkbox shape, how a finished task reads, and the stamp.
- `note.css` contains no theme names at all. Every built-in, Asylum included,
  is data with no CSS of its own.
- Themes travel as `sn1:` share codes — paste one into the dock's new **Theme**
  panel. Your own themes sit alongside the built-ins in the swatch row.
- Size, Tilt, Paper, and Ink are now overrides layered on the current theme
  rather than a separate "custom" theme. Clicking a swatch clears them.

### New: theme builder

`theme-builder.html`, a second self-contained file, opened in a normal browser.
Live preview against transparent, dark, bright, or busy backgrounds; a
**Basics** view for the common dozen tokens and **Everything** for all 67;
export as a share code or `.json`. Its entire UI is generated from the token
metadata, so it cannot fall out of step with the schema.

### Corner and edge accents, on every theme

The `frame` setting used to be one choice of three fixed arrangements:
brackets at all four corners, a rule down the left, or a full inset border.
Those are not three features — they are three selections of the same one, so
picking which corners and which edges carry an accent is now the setting
itself.

- `frameCorners` takes any of `tl tr bl br`, `frameEdges` any of `t r b l`.
  All three old arrangements are ordinary selections of these, which is what
  made replacing them the right call rather than adding a fourth.
- Corners and edges carry their own colour, opacity and weight, plus a shared
  inset, so red brackets over an amber side rule is a theme rather than a
  fork.
- The builder draws this as a clickable diagram of the note: click a corner or
  an edge to toggle it, shown in the colours it will actually use.
- Available to every theme, not just Asylum Life — Kraft with a rule down the
  side, Midnight with two brackets.

Themes and share codes written against the old `frame` setting still load; the
value is translated to the equivalent selection.

### New corner and paper options

Corner folds: `fold`, `dogear`, `curl`, `torn`, or none, in any of the four
corners and at any size. Paper textures: ruled, grid, dots, scanlines, grain.
Tape or a pushpin at the top. Seven font choices, three embedded.

### Fixed

- The dock forced itself wider than the pane OBS gives it. The setup panel's
  URL row was missing `min-width: 0`, so the unbreakable `file://` URL set the
  row's minimum width and dragged the whole layout out with it.
- Striking a finished task out and fading it are now independent. They had been
  bundled into one setting, which could not express "struck out but not
  dimmed".

### Project

- Source split into `src/` with a zero-dependency build. The shipped HTML files
  stay committed; CI verifies they match source.
- `tools/check.js`: consistency checks across the token set, the CSS, and the
  builder metadata.
- Font licences and attribution added under `licenses/` (Caveat and Barlow are
  SIL OFL 1.1).
- Generated token reference at `docs/THEMES.md`.

### Upgrading

Your tasks, title, and theme choice carry over untouched. Two notes: a custom
paper/ink pair becomes an override on Classic Yellow rather than its own
theme, and a tilt you had set is dropped once, so that each theme starts at the
angle its author intended.
