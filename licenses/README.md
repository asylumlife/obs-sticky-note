# Third-party fonts

Three typefaces are embedded in `sticky-note.html` and `theme-builder.html` as
base64 woff2. They are embedded rather than linked so a theme renders correctly
with networking disabled — an overlay that loses its font mid-stream because a
CDN blinked is worse than a slightly larger file.

All three are licensed under the SIL Open Font License 1.1, whose full text is
in this directory. The OFL permits embedding, and requires that the licence
travel with the font.

| Font | Copyright | Licence |
|---|---|---|
| Caveat | Copyright 2014 The Caveat Project Authors — https://github.com/googlefonts/caveat | [OFL-caveat.txt](OFL-caveat.txt) |
| Barlow | Copyright 2017 The Barlow Project Authors — https://github.com/jpt/barlow | [OFL-barlow.txt](OFL-barlow.txt) |
| Barlow Condensed | Copyright 2017 The Barlow Project Authors — https://github.com/jpt/barlow | [OFL-barlow.txt](OFL-barlow.txt) |

Barlow and Barlow Condensed come from one project and share a single licence
file.

Only latin subsets are embedded, to keep the files down. Themes that pick
`system`, `serif`, `mono`, or `marker` resolve against fonts already on the
viewer's machine and carry no embedded data.

The licence covers the fonts only. The project's own code is covered by the
licence at the repository root.
