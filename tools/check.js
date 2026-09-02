#!/usr/bin/env node
/*
 * Consistency checks for the token system. These exist because the three
 * pieces — DEFAULTS, the CSS that reads the properties, and the builder's
 * field groups — are easy to edit out of step, and every way of getting it
 * wrong is silent: a missing default writes "undefinedpx" into a custom
 * property, which invalidates the whole declaration rather than falling back.
 *
 *   node tools/check.js
 */
'use strict';
var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.join(__dirname, '..');
var r = function (p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); };

/* The browser sources are plain scripts, not modules — no exports to require.
   Run them in a context and lift the names out, which also proves they don't
   quietly depend on anything the browser provides beyond what's stubbed here. */
var ctx = vm.createContext({
  btoa: function (s) { return Buffer.from(s, 'binary').toString('base64'); },
  atob: function (s) { return Buffer.from(s, 'base64').toString('binary'); }
});
vm.runInContext(r('src/theme.js') + '\n' + r('src/themes.js'), ctx, { filename: 'theme.js' });

var DEFAULTS = ctx.DEFAULTS, RANGES = ctx.RANGES, ENUMS = ctx.ENUMS;
var SET_VALUES = ctx.SET_VALUES;
var ENUM_VALUES = ctx.ENUM_VALUES, COLOR_KEYS = ctx.COLOR_KEYS;
var FIELD_GROUPS = ctx.FIELD_GROUPS, BASIC_FIELDS = ctx.BASIC_FIELDS;
var BUILTINS = ctx.BUILTINS, applyTheme = ctx.applyTheme;
var normalize = ctx.normalize, encodeTheme = ctx.encodeTheme, decodeTheme = ctx.decodeTheme;

Object.keys({ DEFAULTS: DEFAULTS, RANGES: RANGES, ENUMS: ENUMS, ENUM_VALUES: ENUM_VALUES,
  COLOR_KEYS: COLOR_KEYS, FIELD_GROUPS: FIELD_GROUPS, BASIC_FIELDS: BASIC_FIELDS,
  BUILTINS: BUILTINS, applyTheme: applyTheme, normalize: normalize,
  encodeTheme: encodeTheme, decodeTheme: decodeTheme }).forEach(function (n) {
  if (!eval(n)) throw new Error('src/theme.js did not define ' + n);
});

var fails = [];
var checks = 0;
function ok(name, cond, detail) {
  checks++;
  if (!cond) fails.push(name + (detail ? ': ' + detail : ''));
}

/* --- 1. applyTheme must emit a usable value for every property --- */
function applyToFake(theme) {
  var fake = {
    attrs: {}, style: {},
    setAttribute: function (k, v) { this.attrs[k] = v; }
  };
  fake.style.setProperty = function (k, v) { fake.style[k] = v; };
  var t = applyTheme(fake, theme);
  return { fake: fake, t: t };
}

var base = applyToFake({});
Object.keys(base.fake.style).forEach(function (k) {
  if (k === 'setProperty') return;
  var v = String(base.fake.style[k]);
  ok('property ' + k + ' is defined',
     v.indexOf('undefined') === -1 && v.indexOf('NaN') === -1 && v !== '', v);
});

/* --- 2. every var() the CSS reads is either emitted or set by a CSS rule --- */
var css = r('src/note.css');
/* set by CSS rules rather than by applyTheme: font stacks, and the geometry
   that a specific corner or texture variant works out for itself */
var CSS_OWNED = {
  '--font': 1, '--title-font': 1, '--corner-dir': 1, '--b': 1, '--torn-r': 1
};
['--tex-1', '--tex-2'].forEach(function (p) {
  CSS_OWNED[p] = 1;
  ['-size', '-pos', '-rep'].forEach(function (s) { CSS_OWNED[p + s] = 1; });
});
var read = {};
(css.match(/var\(\s*(--[a-z0-9-]+)/g) || []).forEach(function (m) {
  read[m.replace(/var\(\s*/, '')] = 1;
});
Object.keys(read).forEach(function (k) {
  ok('CSS var ' + k + ' has a source', (k in base.fake.style) || CSS_OWNED[k]);
});

/* --- 3. every data-* attribute the CSS selects on is actually written --- */
var written = {};
Object.keys(base.fake.attrs).forEach(function (a) { written[a] = 1; });
var selected = {};
(css.match(/\[data-[a-z-]+/g) || []).forEach(function (m) {
  selected[m.slice(1)] = 1;
});
Object.keys(selected).forEach(function (a) {
  ok('data attribute ' + a + ' is written', written[a], 'selected in CSS, never set');
});

/* --- 4. enum values in CSS and in the token set agree, both ways --- */

/* `shadow` picks its value from a lookup in applyTheme rather than from a
   selector; its data-* attribute is only a styling hook for anyone layering
   their own CSS on top. Every other enum has to be reachable from the CSS. */
var JS_DRIVEN = { shadow: 1 };
/* values that inherit the base rule and so need no selector of their own */
var INERT = { none: 1, inherit: 1, square: 1, 'strike-dim': 1, br: 1 };

Object.keys(ENUM_VALUES).forEach(function (key) {
  if (JS_DRIVEN[key]) {
    ENUM_VALUES[key].forEach(function (val) {
      ok('enum ' + key + '=' + val + ' has a value in applyTheme',
         String(applyToFake({ shadow: val }).fake.style['--shadow'] || '') !== '');
    });
    return;
  }
  var attr = 'data-' + ENUMS[key];
  ENUM_VALUES[key].forEach(function (val) {
    var styled = css.indexOf('[' + attr + '="' + val + '"]') !== -1;
    ok('enum ' + key + '=' + val + ' is styled or inert', styled || INERT[val]);
  });
});
/* the reverse: a CSS rule for a value the token set would reject is dead code */
(css.match(/\[data-[a-z-]+="[a-z-]+"\]/g) || []).forEach(function (sel) {
  var m = /\[data-([a-z-]+)="([a-z-]+)"\]/.exec(sel);
  var key = Object.keys(ENUMS).filter(function (k) { return ENUMS[k] === m[1]; })[0];
  if (!key) return;
  ok('CSS rule ' + sel + ' matches a real value',
     ENUM_VALUES[key].indexOf(m[2]) !== -1, 'not in ENUM_VALUES.' + key);
});

/* --- 5. builder metadata covers every token exactly once --- */
var META = { v: 1, id: 1, label: 1 };
var inGroups = {};
FIELD_GROUPS.forEach(function (g) {
  g.fields.forEach(function (f) {
    ok('field ' + f[0] + ' not duplicated across groups', !inGroups[f[0]]);
    inGroups[f[0]] = 1;
    ok('field ' + f[0] + ' is a real token', f[0] in DEFAULTS);
  });
});
Object.keys(DEFAULTS).forEach(function (k) {
  if (META[k]) return;
  ok('token ' + k + ' is exposed in the builder', inGroups[k]);
});
Object.keys(BASIC_FIELDS).forEach(function (k) {
  ok('basic field ' + k + ' is a real token', k in DEFAULTS);
});
Object.keys(COLOR_KEYS).forEach(function (k) {
  ok('colour key ' + k + ' is a real token', k in DEFAULTS);
  ok('colour key ' + k + ' defaults to a hex or ""',
     DEFAULTS[k] === '' || /^#[0-9a-f]{6}$/i.test(DEFAULTS[k]), String(DEFAULTS[k]));
});
/* set tokens need a declared vocabulary, or normalizeSet would strip them */
Object.keys(SET_VALUES).forEach(function (k) {
  ok('set token ' + k + ' is a real token', k in DEFAULTS);
  ok('set token ' + k + ' defaults to empty', DEFAULTS[k] === '');
  ok('set token ' + k + ' is not also an enum', !ENUM_VALUES[k]);
});

/* a numeric token with no range would give the builder an unbounded slider */
Object.keys(DEFAULTS).forEach(function (k) {
  if (typeof DEFAULTS[k] !== 'number' || k === 'v') return;
  ok('numeric token ' + k + ' has a range', !!RANGES[k]);
});

/* --- 6. built-ins are valid and survive a code round-trip --- */
var ids = {};
BUILTINS.forEach(function (b) {
  ok('builtin ' + b.id + ' has a unique id', !ids[b.id]);
  ids[b.id] = 1;
  ok('builtin ' + b.id + ' has a label', !!b.label);
  ok('builtin ' + b.id + ' has a swatch', /^#[0-9a-f]{6}$/i.test(b.swatch || ''));

  Object.keys(b).forEach(function (k) {
    if (k === 'swatch') return;
    ok('builtin ' + b.id + ' key ' + k + ' is a real token', k in DEFAULTS);
  });

  var n = normalize(b);
  Object.keys(b).forEach(function (k) {
    if (k === 'swatch') return;
    ok('builtin ' + b.id + '.' + k + ' survives normalize',
       n[k] === b[k], JSON.stringify(b[k]) + ' -> ' + JSON.stringify(n[k]));
  });

  var back = decodeTheme(encodeTheme(b));
  ok('builtin ' + b.id + ' decodes', !!back);
  if (back) {
    Object.keys(n).forEach(function (k) {
      ok('builtin ' + b.id + '.' + k + ' round-trips', n[k] === back[k],
         JSON.stringify(n[k]) + ' -> ' + JSON.stringify(back[k]));
    });
  }

  var applied = applyToFake(b);
  Object.keys(applied.fake.style).forEach(function (k) {
    if (k === 'setProperty') return;
    var v = String(applied.fake.style[k]);
    ok('builtin ' + b.id + ' property ' + k + ' is defined',
       v.indexOf('undefined') === -1 && v.indexOf('NaN') === -1, v);
  });
});

/* --- 6b. frame accents --- */

/* The three background lists must stay the same length whatever is selected;
   a mismatch silently shifts every layer onto the wrong size. */
/* Count top-level commas only: every layer is an rgba() full of commas of
   its own, so a plain split lands at eight times the real layer count. */
function countLayers(v) {
  var s = String(v);
  if (s === 'none') return 0;
  var depth = 0, n = 1;
  for (var i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') depth--;
    else if (s[i] === ',' && depth === 0) n++;
  }
  return n;
}

function frameListsFor(sel) {
  var f = applyToFake(sel).fake.style;
  return [countLayers(f['--frame-img']), countLayers(f['--frame-size']),
          countLayers(f['--frame-pos'])];
}
[
  {}, { frameCorners: 'tl tr bl br' }, { frameEdges: 'l' },
  { frameCorners: 'tl', frameEdges: 't r b l' },
  { frameCorners: 'tl tr bl br', frameEdges: 't r b l' }
].forEach(function (sel) {
  var n = frameListsFor(sel);
  var expect = (sel.frameCorners ? sel.frameCorners.split(' ').length * 2 : 0)
             + (sel.frameEdges ? sel.frameEdges.split(' ').length : 0);
  var label = JSON.stringify(sel);
  if (!expect) {
    /* nothing selected: one inert `none` layer, whatever size/position say */
    ok('no accent draws nothing for ' + label,
       applyToFake(sel).fake.style['--frame-img'] === 'none');
    return;
  }
  ok('frame lists align for ' + label, n[0] === n[1] && n[1] === n[2], n.join('/'));
  ok('frame layer count for ' + label, n[0] === expect, 'got ' + n[0] + ' want ' + expect);
});

/* Selections are order- and case-insensitive going in, canonical coming out,
   so the same choice always encodes to the same string. */
ok('set canonicalises order', normalize({ frameCorners: 'br tl' }).frameCorners === 'tl br');
ok('set lowercases', normalize({ frameCorners: 'TL' }).frameCorners === 'tl');
ok('set dedupes', normalize({ frameCorners: 'tl tl tl' }).frameCorners === 'tl');
ok('set accepts commas', normalize({ frameEdges: 'l,r' }).frameEdges === 'r l');
ok('set drops unknown members', normalize({ frameCorners: 'tl banana' }).frameCorners === 'tl');
ok('set survives a non-string', normalize({ frameCorners: 42 }).frameCorners === '');

/* Every old `frame` value was a selection the new tokens can express; codes
   already in the wild have to keep working. */
[['brackets', 'tl tr bl br', ''], ['rule-left', '', 'l'],
 ['inset', '', 't r b l'], ['none', '', '']].forEach(function (c) {
  var t = normalize({ frame: c[0] });
  ok('legacy frame ' + c[0] + ' maps corners', t.frameCorners === c[1], t.frameCorners);
  ok('legacy frame ' + c[0] + ' maps edges', t.frameEdges === c[2], t.frameEdges);
});
ok('legacy-only code is still recognised as a theme', !!decodeTheme('{"frame":"brackets"}'));
ok('explicit tokens beat the legacy mapping',
   normalize({ frame: 'brackets', frameCorners: 'tl' }).frameCorners === 'tl');
ok('frame is gone from the token set', !('frame' in DEFAULTS));

/* --- 7. hostile input --- */
ok('rejects plain text', decodeTheme('hello') === null);
ok('rejects empty', decodeTheme('') === null);
ok('rejects an array', decodeTheme('[1,2]') === null);
ok('rejects unknown keys only', decodeTheme('{"nope":1}') === null);
ok('rejects broken base64', decodeTheme('sn1:!!!!') === null);
ok('clamps a huge tilt', decodeTheme('{"tilt":9999}').tilt === 15);
ok('clamps a tiny width', decodeTheme('{"width":1}').width === 180);
ok('drops a bogus enum', decodeTheme('{"corner":"banana"}').corner === DEFAULTS.corner);
ok('drops a bogus colour', decodeTheme('{"ink":"red"}').ink === DEFAULTS.ink);
ok('survives a null', decodeTheme('{"paper":null}').paper === DEFAULTS.paper);
ok('truncates a long label', decodeTheme('{"label":"' + new Array(400).join('x') + '"}').label.length === 60);
ok('ignores a prototype key', (function () {
  var t = decodeTheme('{"__proto__":{"x":1},"paper":"#123456"}');
  return t && t.paper === '#123456' && ({}).x === undefined;
})());

/* --- report --- */
if (fails.length) {
  console.error('\n' + fails.length + ' of ' + checks + ' checks FAILED:\n');
  fails.slice(0, 40).forEach(function (f) { console.error('  x ' + f); });
  if (fails.length > 40) console.error('  ... and ' + (fails.length - 40) + ' more');
  process.exit(1);
}
console.log(checks + ' checks passed (' + BUILTINS.length + ' built-in themes, '
  + (Object.keys(DEFAULTS).length - 3) + ' tokens)');
