# OBS Sticky Note Spec

A sticky note for OBS showing a checklist of stream goals. Viewers see it as
an overlay; the streamer checks items off from a clickable panel inside OBS.

## Decisions made

| Question | Decision |
|---|---|
| Check-off method | OBS Custom Browser Dock (control) + Browser Source (display), auto-synced |
| Visibility | Visible on stream as an overlay |
| Style | Sticky-note look with selectable themes; classic yellow is the default |
| Checked items | Strikethrough and dim, staying in place so progress accumulates |

## Architecture

**Self-contained HTML: no server, no runtime dependencies, nothing to install.**
`sticky-note.html` is the app; `theme-builder.html` is an optional companion.
Both are generated from `src/` by a zero-dependency Node script and committed,
so a user downloads one file and is done.

The same note file loads in two places, with a URL parameter choosing the mode:

- `sticky-note.html?view=dock` is added in OBS under *View → Docks → Custom
  Browser Docks*. Full editing UI: add, edit, delete, and reorder tasks,
  check items off, reset.
- `sticky-note.html` (default, overlay mode) is added as a Browser Source in
  the scene. Read-only, transparent page background; only the note itself
  renders.

### Sync between dock and overlay

Both contexts run in OBS's embedded browser (CEF) and share `localStorage`
when they load from the same origin. State lives under one localStorage key
(JSON: list title plus an array of `{id, text, done}`), and the overlay
updates on the `storage` event.

The Browser Source must be configured with *Local file unchecked* and the
same `file:///` URL the dock uses. OBS's "Local file" mode serves the page
from a different internal origin, which would split the localStorage. The
README spells this out.

As a fallback, the overlay also polls localStorage once per second. If events
fail to propagate across CEF contexts, sync still works with at most 1 s of
latency.

localStorage also gives us persistence across OBS restarts for free.

## Features

### Dock (control panel)
- Editable note title (default: "Today's Goals")
- Theme picker: a row of swatches covering the built-ins and any theme the user
  has added; clicking one restyles both the dock preview and the live overlay
  (theme choice is part of the synced state)
- Theme panel: paste a `sn1:` share code or raw JSON to add a theme, copy the
  current theme out to share it, or remove one you added
- Quick overrides: Size (50–200%), Tilt (±15°), Paper, and Ink. These layer on
  top of whatever theme is selected instead of forking a separate one.
  Clicking a swatch clears them.
- Text input + Enter to add a task
- Click a checkbox to toggle done
- Edit task text inline; delete a task; reorder via up/down buttons
- "Uncheck all" (reuse the list next stream) and "Clear list" (with confirm)
- Shows the same sticky-note rendering as the overlay, so what you see is
  what viewers see

### Overlay (browser source)
- Renders the note only, on a transparent page background
- Checking an item: the checkmark draws in like a pen stroke, then an
  animated strikethrough crosses the text; the item dims to about 50% and
  stays in place
- Unchecking reverses the state without replaying animations
- Small progress line at the bottom of the note: "2 / 5 done"
- When the last item is checked, the note wiggles and an "All done!" stamp
  appears. No sound.

## Visual design and themes

**A theme is data, not code.** The governing constraint: there is no per-theme
CSS anywhere in the project. `note.css` contains no theme names; it reads
custom properties and `data-*` attributes that `applyTheme` writes from a token
object. A theme a user writes can therefore do anything a built-in one can.

The Asylum Life theme drove this. Under the old design it needed about 90
lines of its own CSS because it changed the silhouette, not just the colours.
It now serves as the test: if Asylum can't be expressed as data, the token set
is too narrow.

The 74 tokens cover paper (colour, gradient, opacity, six textures), ink and
accent, silhouette (width, radius, tilt, padding, border, shadow), accent
brackets and edge rules (any corners, any edges, separate colours and weights),
corner treatment (five fold styles, any corner, any size), tape or pushpin,
type (seven font stacks, title styling, drop shadow, glow), checkbox (four
shapes, size, stroke, fill and tick colour, hand-drawn jitter), how a finished
task reads (strike and fade, independently), and the progress line and stamp.
`docs/THEMES.md` is the generated reference.

Colour derivation happens in JavaScript, not CSS. `color-mix()` and relative
colour syntax need a newer Chromium than some shipping OBS builds carry, and
themes would lose their colours there.

| Theme | Look |
|---|---|
| **Classic Yellow** (default) | Yellow paper, dark ink |
| **Pink** / **Blue** / **Green** | Pastel paper, dark ink |
| **Lined Notepad** | White paper with ruled lines and a red margin line |
| **Kraft** | Brown paper texture, marker-style dark ink |
| **Midnight** | Dark charcoal note with chalk-white ink |
| **Asylum Life** | Semi-transparent HUD panel: corner brackets, no tilt or fold, condensed uppercase title |

Shared defaults: sticky-note silhouette with a soft shadow, slight tilt, and a
folded corner; handwritten Caveat; hand-drawn checkboxes with pen-stroke check
and strikethrough animations; about 380 px wide at 1080p, growing with the
list. Every one of those is a token a theme can override.

### Sharing

Themes travel as `sn1:` codes: base64 JSON carrying only what differs from the
defaults. The builder produces them and the dock's Theme panel takes them.

Codes are untrusted input. `normalize` drops unknown keys, clamps numbers to
range and rejects enum values outside the set; anything that isn't a theme
returns nothing instead of landing half-applied.

## Theme builder

`theme-builder.html`: standalone, self-contained, opened in an ordinary browser
rather than in OBS. Separate from the dock because you use it occasionally and
the OBS panel should stay small.

- Live preview of the real note, using the same CSS and the same `applyTheme`
- Preview against transparent, dark, bright, or busy backgrounds, since a note
  that reads well on grey can disappear over video
- **Basics** (about a dozen tokens) or **Everything** (all 67)
- Output as a share code or a `.json` download; loads either back in

Its UI is generated from the token metadata in `theme.js`, so it can't drift
from the schema. A new token appears as a working control on its own.

Because it runs in a different browser from OBS's embedded one, with separate
storage, it cannot write to the note directly. Copy-and-paste is the handoff.

## Setup (ships as README)

1. Save `sticky-note.html` anywhere on disk.
2. OBS → View → Docks → Custom Browser Docks → add
   `file:///path/to/sticky-note.html?view=dock`. Dock it wherever you like.
3. Scene → Add → Browser Source → uncheck Local file → URL
   `file:///path/to/sticky-note.html` → size ~470×700.
4. Type tasks in the dock; the overlay follows.

## Out of scope (possible later)

- Multiple simultaneous notes / per-scene lists
- OBS hotkey integration ("check next item" without touching the dock)
- Remote control from a phone
- Sound effects
- Saved list templates (e.g. a recurring pre-stream checklist)
- A gallery of community themes

## Acceptance checklist

- [ ] Adding a task in the dock appears on the overlay within 1 s
- [ ] Checking an item plays the checkmark and strikethrough animation on the
      overlay
- [ ] The item stays visible, crossed out and dimmed
- [ ] All state survives a full OBS restart
- [ ] The overlay background is transparent over any scene
- [ ] Picking a theme in the dock restyles the overlay within 1 s, and the
      choice survives an OBS restart
- [ ] Works with networking disabled
- [ ] The note stays legible with 10+ tasks and long task text (wraps, no
      overflow)
- [ ] The dock fits the pane OBS gives it without forcing a horizontal scroll
- [ ] A theme code from the builder applies in the dock and reaches the overlay
- [ ] A malformed theme code is refused with a message, changing nothing
- [ ] A user theme survives an OBS restart and sits alongside the built-ins
- [ ] No CSS rule anywhere names a specific theme
