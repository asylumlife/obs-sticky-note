(function () {
  'use strict';

  /* ---------------------------------------------------------------------
   * Theme Builder
   *
   * Every control on this page is generated from the token metadata in
   * theme.js. Nothing about a specific token is hand-written here, so a token
   * added there shows up with a working control and a sensible range without
   * anyone touching this file.
   *
   * It runs in your ordinary browser, which is a different browser from the
   * one inside OBS with its own separate storage. That is why the output is a
   * code you copy rather than something that reaches the note directly.
   * ------------------------------------------------------------------- */

  var KEY = 'obs-sticky-note-builder';

  var el = {
    name: document.getElementById('theme-name'),
    preset: document.getElementById('preset'),
    detail: document.getElementById('detail'),
    controls: document.getElementById('controls'),
    preview: document.getElementById('preview'),
    canvas: document.getElementById('canvas'),
    bgDots: document.getElementById('bg-dots'),
    doneToggle: document.getElementById('done-toggle'),
    stampToggle: document.getElementById('stamp-toggle'),
    code: document.getElementById('code'),
    copy: document.getElementById('copy'),
    load: document.getElementById('load'),
    download: document.getElementById('download'),
    reset: document.getElementById('reset'),
    msg: document.getElementById('msg'),
    title: document.getElementById('p-title'),
    tasks: document.getElementById('p-tasks'),
    progress: document.getElementById('p-progress'),
    stamp: document.getElementById('p-stamp')
  };

  var theme = normalize(BUILTINS[0]);
  var showAll = false;
  var showDone = true;
  var showStamp = false;
  var inputs = {};   /* token -> refresh function, for redrawing after a load */

  var SAMPLE = [
    ['Set up the scene', true],
    ['Welcome everyone', true],
    ['Finish the character model', false],
    ['Answer chat questions', false],
    ['Announce next stream', false]
  ];

  /* ---------- Preview ---------- */

  function buildPreview() {
    el.tasks.textContent = '';
    SAMPLE.forEach(function (s) {
      var li = document.createElement('li');
      li.className = 'task' + (showDone && s[1] ? ' done' : '');
      li.innerHTML = '<button class="checkbox" type="button" tabindex="-1">'
        + '<svg viewBox="0 0 26 26"><path class="check" d="M5 14 l6 7 L23 3"/></svg>'
        + '</button><span class="text"><span class="txt"></span></span>';
      li.querySelector('.txt').textContent = s[0];
      el.tasks.appendChild(li);
    });
  }

  function refreshPreview() {
    var t = applyTheme(el.preview, theme);
    el.title.textContent = "Today's Goals";
    var done = showDone ? 2 : 0;
    el.progress.hidden = !t.progress;
    el.progress.textContent = done + ' / ' + SAMPLE.length + ' done';
    el.stamp.hidden = !showStamp;
    el.stamp.textContent = t.stampText;
  }

  /* ---------- Output ---------- */

  function refreshCode() {
    theme.label = el.name.value.trim() || 'My Theme';
    theme.id = slug(theme.label);
    el.code.value = encodeTheme(theme);
  }

  function slug(label) {
    var s = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return s.slice(0, 40) || 'my-theme';
  }

  function update() {
    refreshPreview();
    refreshCode();
    try { localStorage.setItem(KEY, JSON.stringify(theme)); } catch (e) { /* private mode */ }
  }

  function flash(text, kind) {
    el.msg.textContent = text;
    el.msg.className = 'msg' + (kind ? ' ' + kind : '');
    if (kind === 'good') {
      setTimeout(function () {
        if (el.msg.textContent === text) el.msg.textContent = '';
      }, 2500);
    }
  }

  /* ---------- Controls, generated from the token metadata ---------- */

  function field(key, label) {
    var row = document.createElement('div');
    row.className = 'field';
    var lab = document.createElement('label');
    lab.textContent = label;
    var ctl = document.createElement('span');
    ctl.className = 'ctl';
    row.appendChild(lab);
    row.appendChild(ctl);

    var def = DEFAULTS[key];
    var set = function (v) { theme[key] = v; clearPreset(); update(); };

    if (ENUM_VALUES[key]) {
      var sel = document.createElement('select');
      ENUM_VALUES[key].forEach(function (v) {
        var o = document.createElement('option');
        o.value = v;
        o.textContent = v.replace(/-/g, ' ');
        sel.appendChild(o);
      });
      sel.value = theme[key];
      sel.addEventListener('change', function () { set(sel.value); });
      ctl.appendChild(sel);
      inputs[key] = function () { sel.value = theme[key]; };

    } else if (typeof def === 'boolean') {
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!theme[key];
      cb.addEventListener('change', function () { set(cb.checked); });
      ctl.appendChild(cb);
      inputs[key] = function () { cb.checked = !!theme[key]; };

    } else if (COLOR_KEYS[key]) {
      var col = document.createElement('input');
      col.type = 'color';
      /* '' means "work it out from another colour"; the picker still needs a
         concrete value to show, so it shows what the theme resolves to */
      col.value = /^#[0-9a-f]{6}$/i.test(theme[key]) ? theme[key] : fallbackFor(key);
      col.addEventListener('input', function () { set(col.value); });
      ctl.appendChild(col);
      inputs[key] = function () {
        col.value = /^#[0-9a-f]{6}$/i.test(theme[key]) ? theme[key] : fallbackFor(key);
      };

      if (def === '') {
        var wrap = document.createElement('label');
        wrap.className = 'auto';
        var auto = document.createElement('input');
        auto.type = 'checkbox';
        auto.checked = theme[key] === '';
        wrap.appendChild(auto);
        wrap.appendChild(document.createTextNode('Auto'));
        auto.addEventListener('change', function () {
          row.classList.toggle('is-auto', auto.checked);
          set(auto.checked ? '' : col.value);
          col.value = /^#[0-9a-f]{6}$/i.test(theme[key]) ? theme[key] : fallbackFor(key);
        });
        ctl.appendChild(wrap);
        row.classList.toggle('is-auto', auto.checked);
        var paint = inputs[key];
        inputs[key] = function () {
          auto.checked = theme[key] === '';
          row.classList.toggle('is-auto', auto.checked);
          paint();
        };
      }

    } else if (typeof def === 'number') {
      var rng = RANGES[key] || [0, 100];
      var sl = document.createElement('input');
      sl.type = 'range';
      sl.min = rng[0];
      sl.max = rng[1];
      sl.step = stepFor(key);
      sl.value = theme[key];
      var num = document.createElement('span');
      num.className = 'num';
      num.textContent = theme[key];
      sl.addEventListener('input', function () {
        num.textContent = sl.value;
        set(parseFloat(sl.value));
      });
      ctl.appendChild(sl);
      ctl.appendChild(num);
      inputs[key] = function () { sl.value = theme[key]; num.textContent = theme[key]; };

    } else {
      var tx = document.createElement('input');
      tx.type = 'text';
      tx.value = theme[key];
      tx.addEventListener('input', function () { set(tx.value); });
      ctl.appendChild(tx);
      inputs[key] = function () { tx.value = theme[key]; };
    }

    return row;
  }

  /* What a derived colour resolves to right now, so an "Auto" picker opens on
     the colour you can actually see rather than on black. */
  function fallbackFor(key) {
    var map = {
      paper2: theme.paper, curl: theme.paper,
      titleColor: theme.ink, checkColor: theme.ink, checkTick: theme.checkColor || theme.ink,
      progressColor: theme.ink, checkFillDone: theme.paper
    };
    var v = map[key] || theme.ink;
    return /^#[0-9a-f]{6}$/i.test(v) ? v : '#888888';
  }

  function buildControls() {
    inputs = {};
    el.controls.textContent = '';

    FIELD_GROUPS.forEach(function (group, i) {
      var fields = group.fields.filter(function (f) {
        return showAll || BASIC_FIELDS[f[0]];
      });
      if (!fields.length) return;

      var d = document.createElement('details');
      d.className = 'group';
      if (i < 3 || !showAll) d.open = true;
      var s = document.createElement('summary');
      s.textContent = group.title;
      d.appendChild(s);
      fields.forEach(function (f) { d.appendChild(field(f[0], f[1])); });
      el.controls.appendChild(d);
    });
  }

  function repaintControls() {
    Object.keys(inputs).forEach(function (k) { inputs[k](); });
  }

  /* ---------- Loading a theme in ---------- */

  function adopt(t, label) {
    theme = normalize(t);
    el.name.value = theme.label;
    buildControls();
    update();
    if (label) flash(label, 'good');
  }

  /* ---------- Wiring ---------- */

  BUILTINS.forEach(function (b) {
    var o = document.createElement('option');
    o.value = b.id;
    o.textContent = b.label;
    el.preset.appendChild(o);
  });

  el.preset.addEventListener('change', function () {
    var b = BUILTINS.filter(function (x) { return x.id === el.preset.value; })[0];
    if (!b) return;
    adopt(b, 'Started from ' + b.label + '.');
  });

  /* Once you edit or load something, the preset no longer describes what is on
     screen, so it goes back to reading as the invitation it is. */
  function clearPreset() { el.preset.value = ''; }

  el.name.addEventListener('input', function () { refreshCode(); });

  el.detail.addEventListener('click', function (ev) {
    var b = ev.target.closest('button');
    if (!b) return;
    showAll = b.dataset.detail === 'all';
    Array.prototype.forEach.call(el.detail.children, function (x) {
      x.classList.toggle('on', x === b);
    });
    buildControls();
  });

  el.bgDots.addEventListener('click', function (ev) {
    var b = ev.target.closest('button');
    if (!b) return;
    el.canvas.dataset.bg = b.dataset.bg;
    Array.prototype.forEach.call(el.bgDots.children, function (x) {
      x.classList.toggle('on', x === b);
    });
  });

  el.doneToggle.addEventListener('change', function () {
    showDone = el.doneToggle.checked;
    buildPreview();
    refreshPreview();
  });
  el.stampToggle.addEventListener('change', function () {
    showStamp = el.stampToggle.checked;
    refreshPreview();
  });

  el.copy.addEventListener('click', function () {
    el.code.select();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(el.code.value).then(
        function () { flash('Copied. Paste it into the note’s Theme panel.', 'good'); },
        function () { flash('Press Cmd/Ctrl+C to copy.', null); }
      );
    } else {
      flash('Press Cmd/Ctrl+C to copy.', null);
    }
  });

  el.load.addEventListener('click', function () {
    var t = decodeTheme(el.code.value);
    if (!t) { flash('That is not a theme code.', 'bad'); return; }
    adopt(t, 'Loaded "' + t.label + '".');
    clearPreset();
  });

  el.download.addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = slug(theme.label) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  el.reset.addEventListener('click', function () {
    adopt(BUILTINS[0], 'Reset.');
    clearPreset();
  });

  /* Pick up where you left off, but never at the cost of opening broken. */
  try {
    var saved = localStorage.getItem(KEY);
    if (saved) {
      var t = decodeTheme(saved);
      if (t) theme = t;
    }
  } catch (e) { /* private mode */ }

  el.name.value = theme.label;
  buildPreview();
  buildControls();
  update();
})();
