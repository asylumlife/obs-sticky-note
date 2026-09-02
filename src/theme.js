/* ---------------------------------------------------------------------------
 * Theme tokens
 *
 * A theme is plain data. Nothing here knows about a specific built-in, and the
 * built-ins below get no privileges a user's theme doesn't also have — that's
 * the whole point. If a look can't be expressed as a token, the token set is
 * wrong, not the theme.
 *
 * Derived values (soft ink, gradient partner, curl shade) are computed here in
 * JS rather than in CSS. color-mix() and relative color syntax would be tidier
 * but they need a newer Chromium than some shipping OBS builds carry, and a
 * theme that silently loses its colors on someone's older OBS is worse than a
 * few lines of arithmetic. It also means the note and the builder apply themes
 * through exactly the same code path.
 * ------------------------------------------------------------------------- */

var THEME_V = 1;

var DEFAULTS = {
  v: THEME_V,
  id: 'untitled',
  label: 'Untitled',

  /* paper */
  paper: '#feff9c',
  paper2: '',            /* '' → derived as a slightly darker paper */
  paperAngle: 160,
  paperAlpha: 1,
  texture: 'none',       /* none | ruled | grid | dots | scanlines | grain */
  textureColor: '#000000',
  textureColor2: '#ffffff',
  textureAlpha: 0.09,
  textureGap: 32,

  /* ink */
  ink: '#3a3833',
  inkSoftAlpha: 0.5,
  accent: '#d64545',

  /* shape */
  width: 380,
  radius: 2,
  tilt: -2,
  padX: 26,
  padY: 24,
  padLeft: 0,            /* 0 → same as padX */
  padBottom: 16,
  borderWidth: 0,
  borderColor: '#000000',
  borderAlpha: 0.18,
  shadow: 'soft',        /* none | soft | hard | lift */

  /* Corner brackets and edge rules are two selections of the same idea, so
     they are sets rather than an enum of the handful of combinations someone
     thought of first. Empty means no accent at all. */
  frameCorners: '',      /* any of: tl tr bl br */
  frameEdges: '',        /* any of: t r b l */
  frameWidth: 2,         /* bracket arm thickness */
  frameLength: 18,       /* bracket arm length */
  frameEdgeWidth: 3,     /* edge rule thickness */
  frameInset: 0,         /* how far in from the paper edge */
  frameColor: '#DC3E30',
  frameAlpha: 1,
  frameEdgeColor: '',    /* '' → the corner colour */
  frameEdgeAlpha: 1,

  /* folded corner */
  corner: 'fold',        /* none | fold | dogear | curl | torn */
  cornerAt: 'br',        /* tl | tr | bl | br */
  cornerSize: 32,
  curl: '',              /* '' → derived from paper */

  /* tape or pushpin */
  pin: 'none',           /* none | tape | pushpin */
  pinColor: '#f4f1e4',
  pinAlpha: 0.75,

  /* type */
  font: 'hand',          /* hand | sans | condensed | system | serif | mono | marker */
  titleFont: 'inherit',
  titleSize: 34,
  titleWeight: 700,
  titleCase: 'none',     /* none | upper */
  titleTrack: 0,
  titleColor: '',        /* '' → ink */
  titleRule: false,
  taskSize: 26,
  taskLine: 32,
  textShadow: 0,         /* 0..1 dark drop shadow, for legibility over video */
  glow: 0,               /* 0..1 emissive halo, tinted per element */

  /* progress line */
  progressSize: 20,
  progressColor: '',     /* '' -> soft ink */
  progressWeight: 400,

  /* checkbox */
  check: 'square',       /* square | sharp | circle | none */
  checkSize: 22,
  checkStroke: 2,
  checkColor: '',        /* '' → ink */
  checkFillDone: '',     /* '' → stays transparent when checked */
  checkTick: '',         /* '' → checkColor; set it when the box fills in */
  checkTickWidth: 3.2,
  checkTickScale: 1.18,  /* tick size relative to the box; >1 overhangs */
  checkJitter: true,

  /* behaviour */
  /* Striking a task out and fading it are separate decisions — the original
     Asylum skin wanted the strike but not the fade — so they are separate
     tokens rather than one enum of every combination. */
  doneStrike: true,
  doneFade: 'dim',       /* none | dim | mute */
  doneDim: 0.55,
  strikeWidth: 2.5,
  celebrate: true,
  progress: true,
  stampText: 'All done!',
  stampSize: 32,
  stampTrack: 1,
  stampRadius: 8
};

/* Enumerated tokens become data-* attributes; anything not listed here is
   either a scalar/colour written as a custom property, or metadata. */
var ENUMS = {
  texture: 'texture', corner: 'corner', cornerAt: 'corner-at',
  pin: 'pin', font: 'font', titleFont: 'title-font', titleCase: 'title-case',
  check: 'check', doneFade: 'done-fade', shadow: 'shadow'
};

var ENUM_VALUES = {
  texture: ['none', 'ruled', 'grid', 'dots', 'scanlines', 'grain'],
  corner: ['none', 'fold', 'dogear', 'curl', 'torn'],
  cornerAt: ['tl', 'tr', 'bl', 'br'],
  pin: ['none', 'tape', 'pushpin'],
  font: ['hand', 'sans', 'condensed', 'system', 'serif', 'mono', 'marker'],
  titleFont: ['inherit', 'hand', 'sans', 'condensed', 'system', 'serif', 'mono', 'marker'],
  titleCase: ['none', 'upper'],
  check: ['square', 'sharp', 'circle', 'none'],
  doneFade: ['none', 'dim', 'mute'],
  shadow: ['none', 'soft', 'hard', 'lift']
};

/* Numeric tokens and the range the builder (and a pasted theme) must respect. */
/* Tokens holding a set of flags. Order in the list is canonical, so two themes
   that pick the same corners encode to the same string and compare equal. */
var SET_VALUES = {
  frameCorners: ['tl', 'tr', 'bl', 'br'],
  frameEdges: ['t', 'r', 'b', 'l']
};

var RANGES = {
  paperAngle: [0, 360], paperAlpha: [0, 1], textureAlpha: [0, 1], textureGap: [2, 80],
  inkSoftAlpha: [0, 1], width: [180, 900], radius: [0, 40], tilt: [-15, 15],
  padX: [0, 80], padY: [0, 80], padLeft: [0, 120], padBottom: [0, 80],
  borderWidth: [0, 8],
  borderAlpha: [0, 1], frameAlpha: [0, 1], frameEdgeAlpha: [0, 1],
  frameWidth: [1, 12], frameLength: [4, 200], frameEdgeWidth: [1, 12],
  frameInset: [-20, 40], cornerSize: [0, 90], pinAlpha: [0, 1],
  titleSize: [8, 90], titleWeight: [100, 900], titleTrack: [-2, 10],
  taskSize: [8, 70], taskLine: [8, 90], textShadow: [0, 1], glow: [0, 1],
  progressSize: [8, 48], progressWeight: [100, 900], checkSize: [8, 44],
  checkStroke: [0, 6], checkTickWidth: [0.5, 8], checkTickScale: [0.6, 2.4],
  doneDim: [0.1, 1],
  strikeWidth: [0.5, 8],
  stampSize: [8, 80], stampTrack: [-2, 12], stampRadius: [0, 40]
};

var HEX_RE = /^#[0-9a-fA-F]{6}$/;

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
}

/* amt < 0 darkens toward black, amt > 0 lightens toward white */
function shade(hex, amt) {
  var c = hexToRgb(hex).map(function (v) {
    v = Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
    return Math.max(0, Math.min(255, v));
  });
  return 'rgb(' + c.join(',') + ')';
}

function shadeHex(hex, amt) {
  var c = hexToRgb(hex).map(function (v) {
    v = Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
    return Math.max(0, Math.min(255, v));
  });
  return '#' + c.map(function (v) {
    return (v < 16 ? '0' : '') + v.toString(16);
  }).join('');
}

function rgba(hex, a) {
  return 'rgba(' + hexToRgb(hex).join(',') + ',' + a + ')';
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/* Keep only recognised members, drop duplicates, and emit them in the
   canonical order so the same selection always serialises identically. */
function normalizeSet(value, allowed) {
  var seen = {};
  String(value == null ? '' : value).split(/[\s,]+/).forEach(function (k) {
    k = k.toLowerCase();
    if (allowed.indexOf(k) !== -1) seen[k] = 1;
  });
  return allowed.filter(function (k) { return seen[k]; }).join(' ');
}

/* `frame` used to be one enum picking a fixed arrangement. Themes and share
   codes written against it still load: each old value is just a selection the
   new tokens can express, which is why replacing it was the right move. */
var RETIRED_KEYS = { frame: 1 };

var LEGACY_FRAME = {
  'brackets':  { frameCorners: 'tl tr bl br' },
  'rule-left': { frameEdges: 'l', frameEdgeWidth: 3 },
  'inset':     { frameEdges: 't r b l', frameEdgeWidth: 1, frameInset: 5 },
  'none':      {}
};

function migrate(src) {
  if (!src || typeof src !== 'object' || typeof src.frame !== 'string') return src;
  var add = LEGACY_FRAME[src.frame];
  if (!add) return src;
  var out = {};
  Object.keys(src).forEach(function (k) { out[k] = src[k]; });
  Object.keys(add).forEach(function (k) {
    if (out[k] === undefined) out[k] = add[k];
  });
  return out;
}

/* Fill in every missing field and drop anything malformed, so downstream code
   never has to guard. A pasted theme is untrusted input: it comes off someone
   else's clipboard and only the shapes below are honoured. */
function normalize(theme) {
  var out = {};
  var src = migrate((theme && typeof theme === 'object') ? theme : {});

  Object.keys(DEFAULTS).forEach(function (k) {
    var def = DEFAULTS[k];
    var val = src[k];

    if (val === undefined || val === null) { out[k] = def; return; }

    if (SET_VALUES[k]) {
      out[k] = normalizeSet(val, SET_VALUES[k]);
    } else if (ENUM_VALUES[k]) {
      out[k] = ENUM_VALUES[k].indexOf(val) !== -1 ? val : def;
    } else if (typeof def === 'boolean') {
      out[k] = !!val;
    } else if (typeof def === 'number') {
      var n = parseFloat(val);
      if (!isFinite(n)) { out[k] = def; }
      else if (RANGES[k]) { out[k] = clamp(n, RANGES[k][0], RANGES[k][1]); }
      else { out[k] = n; }
    } else if (k === 'id' || k === 'label' || k === 'stampText') {
      out[k] = String(val).slice(0, 60);
    } else {
      /* colour slots: '' is meaningful (means "derive me") */
      out[k] = (val === '' || HEX_RE.test(val)) ? val : def;
    }
  });

  out.v = THEME_V;
  return out;
}

/* Everything a theme implies, resolved: the '' slots filled in from their
   source colour so the CSS never has to fall back. */
function resolve(t) {
  var paper2 = t.paper2 || shadeHex(t.paper, -0.08);
  return {
    paper: t.paperAlpha < 1 ? rgba(t.paper, t.paperAlpha) : t.paper,
    paper2: t.paperAlpha < 1 ? rgba(paper2, t.paperAlpha) : paper2,
    curl: t.curl || shadeHex(t.paper, -0.16),
    ink: t.ink,
    inkSoft: rgba(t.ink, t.inkSoftAlpha),
    titleColor: t.titleColor || t.ink,
    progressColor: t.progressColor || rgba(t.ink, t.inkSoftAlpha),
    checkColor: t.checkColor || t.ink,
    checkFillDone: t.checkFillDone || 'transparent',
    checkTick: t.checkTick || t.checkColor || t.ink,
    /* 'mute' reuses doneDim as a text alpha rather than an element opacity,
       so a finished task can recede without dimming its checkbox too */
    doneColor: rgba(t.ink, t.doneDim),
    border: rgba(t.borderColor, t.borderAlpha),
    frame: rgba(t.frameColor, t.frameAlpha),
    frameEdge: rgba(t.frameEdgeColor || t.frameColor, t.frameEdgeAlpha),
    pin: rgba(t.pinColor, t.pinAlpha),
    texA: rgba(t.textureColor, t.textureAlpha),
    texB: rgba(t.textureColor2, t.textureAlpha)
  };
}

function shadowOf(strength) {
  if (strength <= 0) return 'none';
  return '0 1px 3px rgba(0,0,0,' + (strength * 0.85).toFixed(2) + ')';
}

/* A halo in the element's own colour, stacked on the legibility shadow so a
   theme can have both. `colour` may already be an rgba() string, so the alpha
   rides on the blur radius instead of the colour. */
function glowOf(strength, colour, shadowStrength) {
  var base = shadowOf(shadowStrength);
  if (strength <= 0) return base;
  var halo = '0 0 ' + (4 + strength * 9).toFixed(1) + 'px ' + colour;
  return base === 'none' ? halo : halo + ', ' + base;
}

/* Where each accent anchors. A corner contributes two layers (one arm each
   way); an edge contributes one running the full side. */
var CORNER_AT = { tl: '0 0', tr: '100% 0', bl: '0 100%', br: '100% 100%' };
var EDGE_AT   = { t: '0 0', r: '100% 0', b: '0 100%', l: '0 0' };

/* The old version hardcoded eight layers in CSS, which is why it could only
   ever draw four corners. Generating the lists means any selection works and
   the three background lists stay aligned by construction. */
function frameLayers(t, c) {
  var img = [], size = [], pos = [];
  var cg = 'linear-gradient(' + c.frame + ',' + c.frame + ')';
  var eg = 'linear-gradient(' + c.frameEdge + ',' + c.frameEdge + ')';

  (t.frameCorners ? t.frameCorners.split(' ') : []).forEach(function (k) {
    if (!CORNER_AT[k]) return;
    img.push(cg); size.push(t.frameLength + 'px ' + t.frameWidth + 'px'); pos.push(CORNER_AT[k]);
    img.push(cg); size.push(t.frameWidth + 'px ' + t.frameLength + 'px'); pos.push(CORNER_AT[k]);
  });

  (t.frameEdges ? t.frameEdges.split(' ') : []).forEach(function (k) {
    if (!EDGE_AT[k]) return;
    img.push(eg);
    size.push(k === 't' || k === 'b'
      ? '100% ' + t.frameEdgeWidth + 'px'
      : t.frameEdgeWidth + 'px 100%');
    pos.push(EDGE_AT[k]);
  });

  if (!img.length) return { img: 'none', size: 'auto', pos: '0 0' };
  return { img: img.join(','), size: size.join(','), pos: pos.join(',') };
}

var SHADOWS = {
  none: 'none',
  soft: '0 8px 18px rgba(0,0,0,.28), 0 2px 4px rgba(0,0,0,.18)',
  hard: '5px 5px 0 rgba(0,0,0,.32)',
  lift: '0 16px 30px rgba(0,0,0,.38), 0 5px 10px rgba(0,0,0,.22)'
};

/* Write a normalized theme onto an element as data-* attributes plus custom
   properties. Called by both the note and the builder preview. */
function applyTheme(note, theme) {
  var t = normalize(theme);
  var c = resolve(t);
  var frame = frameLayers(t, c);

  Object.keys(ENUMS).forEach(function (k) {
    note.setAttribute('data-' + ENUMS[k], t[k]);
  });
  note.setAttribute('data-jitter', t.checkJitter ? 'on' : 'off');
  note.setAttribute('data-done-strike', t.doneStrike ? 'on' : 'off');
  note.setAttribute('data-celebrate', t.celebrate ? 'on' : 'off');
  note.setAttribute('data-title-rule', t.titleRule ? 'on' : 'off');

  var vars = {
    '--paper': c.paper,
    '--paper2': c.paper2,
    '--paper-angle': t.paperAngle + 'deg',
    '--ink': c.ink,
    '--ink-soft': c.inkSoft,
    '--accent': t.accent,
    '--curl': c.curl,

    '--note-width': t.width + 'px',
    '--note-radius': t.radius + 'px',
    '--rot': t.tilt + 'deg',
    '--pad-x': t.padX + 'px',
    '--pad-y': t.padY + 'px',
    '--pad-left': (t.padLeft || t.padX) + 'px',
    '--pad-bottom': t.padBottom + 'px',
    '--border-w': t.borderWidth + 'px',
    '--border-c': c.border,
    '--shadow': SHADOWS[t.shadow],

    '--frame-c': c.frame,
    '--frame-img': frame.img,
    '--frame-size': frame.size,
    '--frame-pos': frame.pos,
    '--frame-inset': t.frameInset + 'px',
    '--corner-size': t.cornerSize + 'px',
    '--pin-c': c.pin,

    '--tex-a': c.texA,
    '--tex-b': c.texB,
    '--tex-gap': t.textureGap + 'px',

    '--title-size': t.titleSize + 'px',
    '--title-weight': t.titleWeight,
    '--title-track': t.titleTrack + 'px',
    '--title-c': c.titleColor,
    '--task-size': t.taskSize + 'px',
    '--task-line': t.taskLine + 'px',
    /* Three separate effects, because they do different jobs. The drop shadow
       buys legibility over moving video; the halos are decorative and take the
       colour of whatever they sit under, so a title and the progress count can
       glow in their own hues rather than a single shared one. */
    '--text-shadow': shadowOf(t.textShadow),
    '--title-glow': glowOf(t.glow, c.titleColor, t.textShadow),
    '--progress-glow': glowOf(t.glow, c.progressColor, t.textShadow),

    '--progress-size': t.progressSize + 'px',
    '--progress-c': c.progressColor,
    '--progress-weight': t.progressWeight,

    '--stamp-size': t.stampSize + 'px',
    '--stamp-track': t.stampTrack + 'px',
    '--stamp-radius': t.stampRadius + 'px',

    '--check-size': t.checkSize + 'px',
    '--check-stroke': t.checkStroke + 'px',
    '--check-c': c.checkColor,
    '--check-fill-done': c.checkFillDone,
    '--check-tick': c.checkTick,
    '--check-tick-w': t.checkTickWidth,
    '--check-tick-scale': t.checkTickScale,

    '--done-dim': t.doneDim,
    '--done-c': c.doneColor,
    '--strike-w': t.strikeWidth + 'px'
  };

  Object.keys(vars).forEach(function (k) {
    note.style.setProperty(k, vars[k]);
  });

  return t;
}

/* ---------------------------------------------------------------------------
 * Share codes
 *
 * The builder runs in your desktop browser; the note runs inside OBS's
 * embedded one. They are separate browsers with separate storage, so a theme
 * has to travel as text you can copy into a chat window. Codes carry only what
 * differs from DEFAULTS, which keeps them short and lets a theme made against
 * an older token set still load once new tokens land.
 * ------------------------------------------------------------------------- */

var CODE_PREFIX = 'sn1:';

function toB64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function fromB64(b64) {
  return decodeURIComponent(escape(atob(b64)));
}

function encodeTheme(theme) {
  var t = normalize(theme);
  var min = { v: t.v, id: t.id, label: t.label };
  Object.keys(DEFAULTS).forEach(function (k) {
    if (k === 'v' || k === 'id' || k === 'label') return;
    if (t[k] !== DEFAULTS[k]) min[k] = t[k];
  });
  if (theme && theme.swatch) min.swatch = theme.swatch;
  return CODE_PREFIX + toB64(JSON.stringify(min));
}

/* Accepts a share code or raw JSON, so pasting either works. Returns null when
   it isn't a theme at all — the caller says so rather than applying junk. */
function decodeTheme(text) {
  var raw = String(text == null ? '' : text).trim();
  if (!raw) return null;

  var json = raw;
  if (raw.slice(0, CODE_PREFIX.length) === CODE_PREFIX) {
    try { json = fromB64(raw.slice(CODE_PREFIX.length)); }
    catch (e) { return null; }
  }

  var data;
  try { data = JSON.parse(json); } catch (e) { return null; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;

  /* A parsed object of entirely unknown keys is someone's clipboard, not a
     theme; normalize() would happily turn it into the default yellow note.
     Retired keys count as known, so a code written against an older token set
     is still recognisably a theme — migrate() handles it from there. */
  var known = Object.keys(data).filter(function (k) {
    return Object.prototype.hasOwnProperty.call(DEFAULTS, k) || RETIRED_KEYS[k];
  });
  if (!known.length) return null;

  var theme = normalize(data);
  if (data.swatch && HEX_RE.test(data.swatch)) theme.swatch = data.swatch;
  return theme;
}

/* ---------------------------------------------------------------------------
 * Field metadata
 *
 * The builder's whole UI is generated from this. A control's type is inferred
 * from the token's default (enum -> select, boolean -> checkbox, number ->
 * slider) with colours listed explicitly, because a colour and a label are
 * both strings. Adding a token to DEFAULTS and naming it in a group below is
 * all it takes to get a working control — there is no hand-written form to
 * fall out of sync.
 *
 * `basic` names the handful of tokens most people actually reach for; the
 * builder opens on those and keeps the rest behind a toggle.
 * ------------------------------------------------------------------------- */

var COLOR_KEYS = {
  paper: 1, paper2: 1, curl: 1, ink: 1, accent: 1,
  textureColor: 1, textureColor2: 1, borderColor: 1, pinColor: 1,
  frameColor: 1, frameEdgeColor: 1,
  titleColor: 1, progressColor: 1, checkColor: 1, checkFillDone: 1, checkTick: 1
};

var FIELD_GROUPS = [
  { title: 'Paper', fields: [
    ['paper', 'Colour'], ['paper2', 'Gradient to'], ['paperAngle', 'Gradient angle'],
    ['paperAlpha', 'Opacity'],
    ['texture', 'Texture'], ['textureColor', 'Texture colour'],
    ['textureColor2', 'Second colour'], ['textureAlpha', 'Texture strength'],
    ['textureGap', 'Texture spacing']
  ]},
  { title: 'Ink', fields: [
    ['ink', 'Ink'], ['inkSoftAlpha', 'Faded ink'], ['accent', 'Accent (stamp)'],
    ['font', 'Font'], ['textShadow', 'Drop shadow'], ['glow', 'Glow']
  ]},
  { title: 'Shape', fields: [
    ['width', 'Width'], ['radius', 'Rounding'], ['tilt', 'Tilt'],
    ['shadow', 'Shadow'],
    ['padX', 'Padding sides'], ['padY', 'Padding top'],
    ['padBottom', 'Padding bottom'], ['padLeft', 'Padding left'],
    ['borderWidth', 'Border'], ['borderColor', 'Border colour'],
    ['borderAlpha', 'Border opacity'],
    ['frameCorners', 'Accents'], ['frameEdges', 'Accent edges'],
    ['frameColor', 'Corner colour'], ['frameAlpha', 'Corner opacity'],
    ['frameWidth', 'Corner weight'], ['frameLength', 'Corner length'],
    ['frameEdgeColor', 'Edge colour'], ['frameEdgeAlpha', 'Edge opacity'],
    ['frameEdgeWidth', 'Edge weight'], ['frameInset', 'Accent inset']
  ]},
  { title: 'Corner', fields: [
    ['corner', 'Fold style'], ['cornerAt', 'Which corner'],
    ['cornerSize', 'Fold size'], ['curl', 'Fold colour'],
    ['pin', 'Tape or pin'], ['pinColor', 'Tape colour'], ['pinAlpha', 'Tape opacity']
  ]},
  { title: 'Title', fields: [
    ['titleFont', 'Font'], ['titleSize', 'Size'], ['titleWeight', 'Weight'],
    ['titleCase', 'Case'], ['titleTrack', 'Letter spacing'],
    ['titleColor', 'Colour'], ['titleRule', 'Rule underneath']
  ]},
  { title: 'Tasks', fields: [
    ['taskSize', 'Text size'], ['taskLine', 'Line height'],
    ['check', 'Checkbox'], ['checkSize', 'Checkbox size'],
    ['checkStroke', 'Checkbox line'], ['checkColor', 'Checkbox colour'],
    ['checkFillDone', 'Fill when done'], ['checkTick', 'Tick colour'],
    ['checkTickWidth', 'Tick weight'], ['checkTickScale', 'Tick size'],
    ['checkJitter', 'Hand-drawn tilt'],
    ['doneStrike', 'Strike out when done'], ['doneFade', 'Fade when done'],
    ['doneDim', 'Fade amount'],
    ['strikeWidth', 'Strike weight']
  ]},
  { title: 'Progress & stamp', fields: [
    ['progress', 'Show progress'], ['progressSize', 'Progress size'],
    ['progressColor', 'Progress colour'], ['progressWeight', 'Progress weight'],
    ['stampText', 'Stamp text'], ['stampSize', 'Stamp size'],
    ['stampTrack', 'Stamp spacing'], ['stampRadius', 'Stamp rounding'],
    ['celebrate', 'Wiggle when done']
  ]}
];

var BASIC_FIELDS = {
  paper: 1, ink: 1, accent: 1, font: 1, texture: 1,
  tilt: 1, width: 1, corner: 1, cornerAt: 1, shadow: 1,
  titleSize: 1, taskSize: 1, check: 1, doneStrike: 1, doneFade: 1, pin: 1,
  frameCorners: 1, frameEdges: 1, frameColor: 1
};

/* Step size for a slider: fractional tokens need fine steps, pixel ones don't. */
function stepFor(key) {
  var r = RANGES[key];
  if (!r) return 1;
  if (r[1] <= 1) return 0.01;
  if (key === 'checkTickWidth' || key === 'strikeWidth') return 0.1;
  return 1;
}
