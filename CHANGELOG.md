# Changelog

## 0.3.0 — 2026-09-03

### Saving and pasting in a list

The README had to warn that clearing OBS's browser cache takes your tasks with
it, and there was nothing you could do about that: themes could be copied out
and pasted back, but the tasks — the part anyone would actually miss — could
not.

**Copy list** produces a code carrying the title, the tasks, and which are
ticked. **Replace list** and **Add to list** take it back.

A pasted code rather than a file, because the dock runs inside OBS's own
browser and whether that opens a file dialog is not something this can rely
on. A button that silently does nothing is worse than no button, and text
works everywhere the note does — including in a browser source, and in a
message to somebody else.

The theme builder does read and write `.json` files: it runs in an ordinary
browser, where that is dependable. It gained the **Open .json** it had been
missing, having been able to save one since it was written.

They also take plain text, one task per line, because that is where checklists
actually come from — a notes app, a Discord message, the description of the
stream you are about to do. Bullets, numbering and markdown checkboxes are
stripped, and a ticked box arrives already checked off. Pasting a code meant
for something else is refused rather than becoming a task made of base64.

### The item you're on

A task can be marked as the one you're working on now, picked out on the
overlay as a bar, arrow, dot, or highlight — themeable like everything else,
and off until you actually mark something.

It exists mostly to make one button useful. The commands that drive the list
are verbs about its current state — `advance`, `back`, `reset`,
`clear_current` — never references to a particular task, because a button
bound to "check off item three" is scrap as soon as the list changes while
"advance" works for every list you will ever write.

Three ways to send one:

- **Keyboard in the dock**: Space or Enter advances, Backspace steps back.
  Ignored while you are typing.
- **OBS custom events**: obs-websocket `CallVendorRequest` with vendor
  `obs-browser` and request `emit_event`, event name `sticky-note` and
  `{"command": "advance"}`. Per-command event names exist too for senders that
  cannot attach a payload.
- **A hidden command source**: a Browser source at `?cmd=advance`, refreshed by
  an OBS hotkey. Needs no extra software.

## 0.2.0 — 2026-09-02

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

### Getting to the builder from OBS

The dock's **Theme** panel now shows the path to `theme-builder.html` sitting
next to your note, with a Copy button. It is a path to copy rather than a link
to click because a link clicked inside an OBS dock navigates the dock itself,
replacing the note with the builder.

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
