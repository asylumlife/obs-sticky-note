#!/usr/bin/env node
/*
 * Inlines src/ into the standalone HTML files that ship to users.
 *
 * No dependencies, no config: `node build.js` writes the outputs, and
 * `node build.js --check` verifies the committed outputs match src/ without
 * touching anything (that's what CI runs).
 *
 * Everything ends up in one file on purpose. OBS loads these over file://,
 * where a second request for a stylesheet or a font is a support ticket.
 */
'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = __dirname;
var CHECK = process.argv.indexOf('--check') !== -1;

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

/* Slot values are file contents, so a `$&` or `$1` inside them would be eaten
   by String.replace's substitution syntax. Splice on the literal instead. */
function fill(tpl, marker, value, file) {
  var at = tpl.indexOf(marker);
  if (at === -1) throw new Error('missing ' + marker + ' in ' + file);
  if (tpl.indexOf(marker, at + marker.length) !== -1) {
    throw new Error('duplicate ' + marker + ' in ' + file);
  }
  return tpl.slice(0, at) + value + tpl.slice(at + marker.length);
}

/* The note's stylesheet is shared: the builder previews the real thing rather
   than an approximation, which is the only way a preview is worth having. */
var FONTS = function () {
  return '<style id="fontface">' + read('src/fonts/caveat.css').trim() + '</style>\n'
       + '<style id="fontface-barlow">' + read('src/fonts/barlow.css').trim() + '</style>';
};

var TARGETS = [
  {
    out: 'sticky-note.html',
    template: 'src/note.template.html',
    slots: {
      '<!--@fonts-->': FONTS,
      '/*@css*/': function () { return read('src/note.css').replace(/\s+$/, ''); },
      '<!--@body-->': function () { return read('src/note.body.html').replace(/\s+$/, ''); },
      /* theme.js and themes.js first: note.js closes over them */
      '/*@js*/': function () {
        return [read('src/theme.js'), read('src/themes.js'), read('src/list.js'),
                read('src/note.js')]
          .map(function (s) { return s.replace(/\s+$/, ''); })
          .join('\n\n');
      }
    }
  },
  {
    out: 'theme-builder.html',
    template: 'src/builder.template.html',
    slots: {
      '<!--@fonts-->': FONTS,
      '/*@css*/': function () {
        return read('src/note.css').replace(/\s+$/, '')
          + '\n\n  /* ---------- Builder chrome ---------- */\n'
          + read('src/builder.css').replace(/\s+$/, '');
      },
      '<!--@body-->': function () { return read('src/builder.body.html').replace(/\s+$/, ''); },
      '/*@js*/': function () {
        return [read('src/theme.js'), read('src/themes.js'), read('src/files.js'),
                read('src/builder.js')]
          .map(function (s) { return s.replace(/\s+$/, ''); })
          .join('\n\n');
      }
    }
  }
];

var failed = 0;

TARGETS.forEach(function (t) {
  var html = read(t.template);
  Object.keys(t.slots).forEach(function (marker) {
    html = fill(html, marker, t.slots[marker](), t.template);
  });

  var outPath = path.join(ROOT, t.out);
  var current = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : null;

  if (CHECK) {
    if (current === html) {
      console.log('ok       ' + t.out);
    } else {
      failed++;
      console.error('STALE    ' + t.out + '  (run `node build.js`)');
    }
    return;
  }

  if (current === html) {
    console.log('unchanged ' + t.out);
  } else {
    fs.writeFileSync(outPath, html);
    console.log('wrote     ' + t.out + '  (' + Math.round(html.length / 1024) + ' KB)');
  }
});

if (failed) process.exit(1);
