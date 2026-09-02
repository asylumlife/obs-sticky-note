#!/usr/bin/env node
/* Renders every built-in theme onto one page: a visual regression sheet and
   the source of the README's theme grid. `node tools/make-gallery.js [out]` */
'use strict';
var fs = require('fs');
var path = require('path');
var ROOT = path.join(__dirname, '..');
var r = function (p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); };

var out = process.argv[2] || path.join(ROOT, 'tools', 'gallery.html');
var TASKS = [
  ['Set up the scene', true],
  ['Welcome everyone', true],
  ['Finish the character model', false],
  ['Answer chat questions', false]
];

var noteHtml = TASKS.map(function (t) {
  return '<li class="task' + (t[1] ? ' done' : '') + '">'
    + '<button class="checkbox" type="button"><svg viewBox="0 0 26 26">'
    + '<path class="check" d="M5 14 l6 7 L23 3"/></svg></button>'
    + '<span class="text"><span class="txt">' + t[0] + '</span></span></li>';
}).join('');

fs.writeFileSync(out, '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
  + '<title>Theme gallery</title>\n'
  + '<style id="fontface">' + r('src/fonts/caveat.css').trim() + '</style>\n'
  + '<style id="fontface-barlow">' + r('src/fonts/barlow.css').trim() + '</style>\n'
  + '<style>\n' + r('src/note.css')
  + '\n  body { background: #14161a; padding: 22px; }\n'
  + '  .grid { display: flex; flex-wrap: wrap; gap: 30px 26px; align-items: flex-start; }\n'
  + '  .cell { width: 420px; }\n'
  + '  .cap { font: 12px system-ui; color: #8d9299; margin-bottom: 26px; letter-spacing: .4px; }\n'
  + '  .cell .note { margin: 0 auto; }\n'
  + '</style>\n</head>\n<body>\n<div class="grid" id="grid"></div>\n<script>\n'
  + r('src/theme.js') + '\n' + r('src/themes.js') + '\n'
  + 'BUILTINS.forEach(function (th) {\n'
  + '  var cell = document.createElement("div"); cell.className = "cell";\n'
  + '  var cap = document.createElement("div"); cap.className = "cap";\n'
  + '  cap.textContent = th.label + "  \\u00b7  " + th.id;\n'
  + '  var note = document.createElement("div"); note.className = "note";\n'
  + '  note.innerHTML = \'<div class="note-frame"></div><div class="note-pin"></div>\'\n'
  + '    + \'<div class="note-title">Today\\u2019s Goals</div><ul id="tasks">'
  + noteHtml + '</ul>\'\n'
  + '    + \'<div id="progress">2 / 4 done</div>\';\n'
  + '  applyTheme(note, th);\n'
  + '  cell.appendChild(cap); cell.appendChild(note); document.getElementById("grid").appendChild(cell);\n'
  + '});\n</script>\n</body>\n</html>\n');
console.log('wrote ' + path.relative(ROOT, out));
