/* ---------------------------------------------------------------------------
 * Built-in themes
 *
 * Each is a partial: only what differs from DEFAULTS. They are ordinary theme
 * data with no special status. The builder round-trips them, and a theme you
 * paste in sits alongside them as an equal.
 *
 * `swatch` is the toolbar dot only. It isn't a token; it's just the colour
 * that best advertises the theme in a 22px square.
 * ------------------------------------------------------------------------- */

var BUILTINS = [
  {
    id: 'yellow', label: 'Classic Yellow', swatch: '#feff9c',
    paper: '#feff9c', paper2: '#f4e97e', ink: '#3a3833',
    accent: '#d64545', curl: '#e3d768'
  },
  {
    id: 'pink', label: 'Pink', swatch: '#ffd3e0',
    paper: '#ffd3e0', paper2: '#f7bccd', ink: '#4a2b38',
    accent: '#b83a64', curl: '#eaa9bd'
  },
  {
    id: 'blue', label: 'Blue', swatch: '#cfe6ff',
    paper: '#cfe6ff', paper2: '#b6d5f2', ink: '#22384e',
    accent: '#d64545', curl: '#a8c8e6'
  },
  {
    id: 'green', label: 'Green', swatch: '#d6f5c9',
    paper: '#d6f5c9', paper2: '#c1e6b0', ink: '#26402a',
    accent: '#d64545', curl: '#aed69b'
  },
  {
    id: 'lined', label: 'Lined Notepad', swatch: '#fbfbf4',
    paper: '#fbfbf4', paper2: '#fbfbf4', ink: '#2c3350', inkSoftAlpha: 0.45,
    accent: '#d64545', curl: '#e4e4d6',
    texture: 'ruled', textureColor: '#c3d9e8', textureColor2: '#e78f8f',
    textureAlpha: 1, textureGap: 32,
    padLeft: 46
  },
  {
    id: 'kraft', label: 'Kraft', swatch: '#bf9a68',
    paper: '#bf9a68', paper2: '#ab8452', ink: '#35261a',
    accent: '#a2331f', curl: '#97723f',
    texture: 'dots', textureColor: '#ffffff', textureColor2: '#000000',
    textureAlpha: 0.1
  },
  {
    id: 'midnight', label: 'Midnight', swatch: '#33363d',
    paper: '#33363d', paper2: '#292c33', ink: '#eee9db',
    accent: '#ff8a80', curl: '#222429'
  },

  /* Not a repaint like the others: this replaces the sticky-note silhouette
     with an instrument-panel skin: no tilt, no curl, translucent ground, corner
     brackets instead of a frame, Barlow instead of the handwritten face.
     It is the reason the token set looks the way it does. Everything below is
     plain data; there is no Asylum-specific CSS anywhere. */
  {
    id: 'asylum', label: 'Asylum Life', swatch: '#2A2B2A',

    paper: '#201F1D', paper2: '#201F1D', paperAlpha: 0.62,
    ink: '#F1E9D9', inkSoftAlpha: 0.55, accent: '#F3AF3C',

    width: 340, padX: 16, padY: 12, padBottom: 13, radius: 0, tilt: 0,
    borderWidth: 1, borderColor: '#3F92C4', borderAlpha: 0.18,
    shadow: 'none',
    frameCorners: 'tl tr bl br', frameColor: '#DC3E30',

    corner: 'none',
    texture: 'scanlines', textureColor: '#3F92C4', textureAlpha: 0.055,
    textureGap: 3,

    font: 'sans', titleFont: 'condensed',
    titleSize: 16, titleWeight: 700, titleCase: 'upper', titleTrack: 2,
    titleColor: '#3F92C4', titleRule: true,
    taskSize: 20, taskLine: 26,
    textShadow: 1, glow: 0.55,

    progressSize: 15, progressColor: '#F3AF3C', progressWeight: 700,

    check: 'square', checkSize: 14, checkStroke: 2,
    checkColor: '#3F92C4', checkFillDone: '#0A7F20',
    checkTick: '#F1E9D9', checkTickWidth: 3.6, checkTickScale: 1.7,
    checkJitter: false,

    doneStrike: true, doneFade: 'mute', doneDim: 0.4,
    celebrate: false,
    stampSize: 26, stampTrack: 3, stampRadius: 3
  }
];
