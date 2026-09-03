# Changelog

## 0.3.0 — 2026-09-03

### The item you're on

Mark a task with **◉** and it shows on the overlay as a bar, arrow, dot, or
highlight, depending on the theme. Nothing shows until you mark something, so
existing themes look the same as before.

Four commands run the list: `advance`, `back`, `reset`, `clear_current`. Each
acts on the list as it stands, so a button bound to one keeps working when the
list changes.

- **Keyboard in the dock.** Space or Enter advances, Backspace steps back and
  un-ticks. Suppressed while you type.
- **OBS custom events.** obs-websocket `CallVendorRequest`, vendor
  `obs-browser`, request `emit_event`, event name `sticky-note`, data
  `{"command": "advance"}`. Per-command event names work for senders that
  can't attach a payload.
- **A `cmd` URL parameter**, for a hidden Browser source refreshed by an OBS
  hotkey. No websocket needed.

### Backing up a list

**Copy list** produces a code holding the title, the tasks, and which are
ticked. **Replace list** and **Add to list** read it back.

Both also take plain text, one task per line. They strip bullets, numbering
and markdown checkboxes, and a ticked box arrives checked off, so a list you
wrote in a notes app pastes straight in. A code belonging to something else
gets refused instead of landing as a task full of base64.

Replacing asks twice before discarding what you have. Adding doesn't ask.

The dock has no Save-to-file button. OBS's browser may not open a file dialog,
and a button that does nothing is worse than no button. The theme builder runs
in your own browser, where dialogs work, and it now reads a `.json` theme as
well as writing one.

### Accents on any theme

`frame` offered three fixed arrangements. Now `frameCorners` takes any of
`tl tr bl br` and `frameEdges` any of `t r b l`, with separate colours,
opacities and weights for corners and edges over a shared inset. The three old
arrangements are selections of these, so old themes and codes still load.

The builder draws this as a diagram of the note: click a corner or an edge to
toggle it, in the colours it will use.

### Finding the theme builder

The dock's **Theme** panel shows the path to `theme-builder.html` next to your
note, with a Copy button. It's a path to copy because clicking a link inside an
OBS dock navigates the dock and loses your note.

## 0.2.0 — 2026-09-02

### Themes became data

A theme used to be five CSS variables plus a hand-written `[data-theme]`
block. Only this repo could add one, and everyone else got two colour pickers.
The Asylum Life theme had already outgrown it, taking about 90 lines of CSS to
override the silhouette, fonts, checkbox and animation.

A theme is now 74 tokens covering colour, paper texture, silhouette, corner
treatment, tape or pushpin, fonts, title styling, checkbox shape, how a
finished task reads, and the stamp. No CSS names a theme any more, Asylum
included.

Themes travel as `sn1:` codes. Paste one into the dock's new **Theme** panel
and it joins your swatches.

Size, Tilt, Paper and Ink became overrides on the current theme instead of a
separate "custom" theme. Clicking a swatch clears them.

### The theme builder

`theme-builder.html`, a second self-contained file you open in your own
browser. Live preview against transparent, dark, bright or busy backgrounds.
**Basics** for the common dozen settings, **Everything** for all of them.
Export as a code or a `.json` file.

Its controls are generated from the token metadata, so it can't fall behind
the schema.

### Corner and paper options

Corner folds: `fold`, `dogear`, `curl`, `torn`, or none, in any corner at any
size. Paper textures: ruled, grid, dots, scanlines, grain. Tape or a pushpin at
the top. Seven fonts, three of them embedded.

### Fixed

- The dock forced itself wider than the pane OBS gave it. The setup panel's URL
  row was missing `min-width: 0`, so the unbreakable `file://` URL set the row's
  minimum width and dragged the layout out with it.
- Striking a finished task out and fading it became independent settings. As
  one setting they couldn't express "struck out but not dimmed".

### Project

- Source split into `src/` with a zero-dependency build. The shipped HTML stays
  committed and CI checks it matches source.
- `tools/check.js` covers the token set, the CSS, and the builder metadata.
- Font licences and attribution under `licenses/` (Caveat and Barlow, SIL OFL
  1.1).
- Generated token reference at `docs/THEMES.md`.

### Upgrading

Tasks, title and theme choice carry over. A custom paper/ink pair becomes an
override on Classic Yellow. A tilt you had set is dropped once, so each theme
starts at the angle its author chose.
