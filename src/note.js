(function () {
  'use strict';

  var qs = new URLSearchParams(location.search);
  var IS_DOCK = qs.get('view') === 'dock';
  var DEMO_MODE = qs.get('demo');
  var IS_DEMO = DEMO_MODE !== null;
  var SCALE = parseFloat(qs.get('scale') || '1');
  var KEY = 'obs-sticky-note-v1';
  var DEFAULT_TITLE = "Today's Goals";

  var el = {
    toolbar: document.getElementById('toolbar'),
    swatches: document.getElementById('swatches'),
    themeBtn: document.getElementById('theme-btn'),
    themePanel: document.getElementById('theme-panel'),
    themeCode: document.getElementById('theme-code'),
    themeApply: document.getElementById('theme-apply'),
    themeCopy: document.getElementById('theme-copy'),
    themeRemove: document.getElementById('theme-remove'),
    themeMsg: document.getElementById('theme-msg'),
    themeBuilder: document.getElementById('theme-builder'),
    builderUrl: document.getElementById('builder-url'),
    builderCopy: document.getElementById('builder-copy'),
    builderHint: document.getElementById('builder-hint'),
    uncheckAll: document.getElementById('uncheck-all'),
    clearList: document.getElementById('clear-list'),
    sizeSlider: document.getElementById('size-slider'),
    sizeVal: document.getElementById('size-val'),
    rotSlider: document.getElementById('rot-slider'),
    rotVal: document.getElementById('rot-val'),
    paperColor: document.getElementById('paper-color'),
    inkColor: document.getElementById('ink-color'),
    note: document.getElementById('note'),
    title: document.getElementById('title'),
    tasks: document.getElementById('tasks'),
    addRow: document.getElementById('add-row'),
    addInput: document.getElementById('add-input'),
    progress: document.getElementById('progress'),
    stamp: document.getElementById('stamp')
  };

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  /* ---------- State ----------
   * The theme is a reference (themeId) plus a few live overrides, not a copy.
   * Overrides are what the toolbar's sliders and colour pickers write, so
   * nudging the tilt doesn't fork a whole theme; picking a swatch clears them
   * and you're back on that theme exactly as its author made it. */

  function defaultState() {
    return {
      title: DEFAULT_TITLE,
      tasks: [],
      size: 1,
      themeId: 'yellow',
      themes: [],       /* themes pasted in from the builder */
      current: null,    /* id of the task you are on right now */
      rotation: null,   /* null = use the theme's tilt */
      paper: null,
      ink: null
    };
  }

  function demoState() {
    var s = defaultState();
    s.tasks = [
      { id: uid(), text: 'Set up the scene', done: true },
      { id: uid(), text: 'Welcome everyone', done: true },
      { id: uid(), text: 'Finish the character model', done: false },
      { id: uid(), text: 'Answer chat questions', done: false },
      { id: uid(), text: 'Announce next stream', done: false }
    ];
    return s;
  }

  function parseState(raw) {
    var s = defaultState();
    if (!raw) return s;
    try {
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return s;

      if (typeof data.title === 'string') s.title = data.title;
      if (typeof data.size === 'number' && isFinite(data.size)) {
        s.size = Math.min(2, Math.max(0.5, data.size));
      }

      if (Array.isArray(data.themes)) {
        s.themes = data.themes
          .map(function (t) { return normalize(t); })
          .filter(function (t) { return t.id; })
          .slice(0, 40);
      }

      /* Pre-token saves stored `theme: 'yellow' | 'custom'` with the two custom
         colours alongside, and always carried a concrete `rotation` even when
         the user had never touched the slider. Reading that back as an
         override would pin every theme to the old default angle — Asylum, for
         one, is designed flat — so on migration the tilt is deliberately left
         to the theme. A save that already knows about themeId came from this
         version, where a rotation really is a deliberate override. */
      if (typeof data.themeId === 'string') {
        s.themeId = data.themeId;
        if (typeof data.rotation === 'number' && isFinite(data.rotation)) {
          s.rotation = Math.min(15, Math.max(-15, Math.round(data.rotation)));
        }
      } else if (typeof data.theme === 'string') {
        if (data.theme === 'custom') {
          s.themeId = 'yellow';
          if (HEX_RE.test(data.customPaper || '')) s.paper = data.customPaper;
          if (HEX_RE.test(data.customInk || '')) s.ink = data.customInk;
        } else {
          s.themeId = data.theme;
        }
      }
      if (HEX_RE.test(data.paper || '')) s.paper = data.paper;
      if (HEX_RE.test(data.ink || '')) s.ink = data.ink;
      if (typeof data.current === 'string') s.current = data.current;

      if (Array.isArray(data.tasks)) {
        s.tasks = data.tasks
          .filter(function (t) { return t && typeof t.text === 'string'; })
          .map(function (t) {
            return {
              id: typeof t.id === 'string' ? t.id : uid(),
              text: t.text,
              done: !!t.done
            };
          });
      }
      /* a pointer at a task that no longer exists would mark nothing forever */
      if (s.current && !s.tasks.some(function (t) { return t.id === s.current; })) {
        s.current = null;
      }
      return s;
    } catch (e) {
      return s;
    }
  }

  var state;
  var lastRaw = null;
  var prevAllDone = false;

  if (IS_DEMO) {
    state = demoState();
    var demoTheme = qs.get('theme');
    if (demoTheme) state.themeId = demoTheme;
    if (DEMO_MODE === 'all') {
      state.tasks.forEach(function (t) { t.done = true; });
    }
  } else {
    lastRaw = localStorage.getItem(KEY);
    state = parseState(lastRaw);
  }

  function save() {
    if (IS_DEMO) return;
    var raw = JSON.stringify(state);
    try { localStorage.setItem(KEY, raw); } catch (e) { /* storage unavailable */ }
    lastRaw = raw;
  }

  function commit() {
    save();
    render(false);
  }

  /* ---------- Theme resolution ---------- */

  function allThemes() {
    return BUILTINS.concat(state.themes);
  }

  function themeById(id) {
    var all = allThemes();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) return all[i];
    }
    return BUILTINS[0];
  }

  function isBuiltin(id) {
    return BUILTINS.some(function (t) { return t.id === id; });
  }

  /* Base theme with the toolbar's overrides layered on top. */
  function activeTheme() {
    var base = themeById(state.themeId);
    var t = {};
    Object.keys(base).forEach(function (k) { t[k] = base[k]; });
    if (state.rotation !== null) t.tilt = state.rotation;
    if (state.paper) {
      t.paper = state.paper;
      /* the author's derived shades belong to the author's paper, so let them
         be re-derived rather than clashing with a colour they never saw */
      t.paper2 = '';
      t.curl = '';
    }
    if (state.ink) {
      t.ink = state.ink;
      if (!base.titleColor) t.titleColor = '';
      if (!base.checkColor) t.checkColor = '';
    }
    return t;
  }

  /* ---------- Rendering (patches DOM in place so CSS transitions animate) ---------- */

  function buildTask(t) {
    var li = document.createElement('li');
    li.className = 'task' + (t.done ? ' done' : '')
      + (t.id === state.current ? ' current' : '');
    li.dataset.id = t.id;

    var box = document.createElement('button');
    box.className = 'checkbox';
    box.type = 'button';
    box.innerHTML = '<svg viewBox="0 0 26 26"><path class="check" d="M5 14 l6 7 L23 3"/></svg>';
    li.appendChild(box);

    var span = document.createElement('span');
    span.className = 'text';
    var txt = document.createElement('span');
    txt.className = 'txt';
    txt.textContent = t.text;
    span.appendChild(txt);
    li.appendChild(span);

    if (IS_DOCK) {
      box.title = 'Check off';
      box.addEventListener('click', function () { toggleTask(li.dataset.id); });

      txt.setAttribute('contenteditable', 'plaintext-only');
      txt.addEventListener('focus', function () { txt.dataset.orig = txt.textContent; });
      txt.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); txt.blur(); }
        if (ev.key === 'Escape') {
          txt.textContent = txt.dataset.orig || '';
          txt.blur();
        }
      });
      txt.addEventListener('blur', function () {
        var text = txt.textContent.replace(/\s+/g, ' ').trim();
        var task = findTask(li.dataset.id);
        if (!task) return;
        if (!text) { txt.textContent = task.text; return; }
        if (text !== task.text) { task.text = text; commit(); }
        else { txt.textContent = task.text; }
      });

      var controls = document.createElement('span');
      controls.className = 'controls';
      [
        ['◉', 'Mark as the one you are on', function () { setCurrent(li.dataset.id); }],
        ['▲', 'Move up',   function () { moveTask(li.dataset.id, -1); }],
        ['▼', 'Move down', function () { moveTask(li.dataset.id, 1); }],
        ['✕', 'Delete',    function () { removeTask(li.dataset.id); }]
      ].forEach(function (def) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = def[0];
        b.title = def[1];
        b.addEventListener('click', def[2]);
        controls.appendChild(b);
      });
      li.appendChild(controls);
    } else {
      box.tabIndex = -1;
    }
    return li;
  }

  function patchTasks() {
    var existing = {};
    Array.prototype.forEach.call(el.tasks.children, function (li) {
      existing[li.dataset.id] = li;
    });
    var seen = {};
    var prev = null;

    state.tasks.forEach(function (t) {
      var li = existing[t.id];
      if (!li) {
        li = buildTask(t);
      } else {
        li.classList.toggle('done', t.done);
        li.classList.toggle('current', t.id === state.current);
        var txt = li.querySelector('.txt');
        if (document.activeElement !== txt && txt.textContent !== t.text) {
          txt.textContent = t.text;
        }
      }
      seen[t.id] = true;
      var ref = prev ? prev.nextSibling : el.tasks.firstChild;
      if (li !== ref) el.tasks.insertBefore(li, ref);
      prev = li;
    });

    Object.keys(existing).forEach(function (id) {
      if (!seen[id]) existing[id].remove();
    });
  }

  function renderSwatches() {
    var all = allThemes();
    el.swatches.textContent = '';
    all.forEach(function (th) {
      var b = document.createElement('button');
      b.className = 'swatch' + (isBuiltin(th.id) ? '' : ' custom');
      b.type = 'button';
      b.title = th.label + (isBuiltin(th.id) ? '' : ' (yours)');
      b.dataset.theme = th.id;
      b.style.background = th.swatch || th.paper || '#ccc';
      b.addEventListener('click', function () {
        state.themeId = th.id;
        /* a swatch means "this theme as its author made it" */
        state.rotation = null;
        state.paper = null;
        state.ink = null;
        commit();
      });
      el.swatches.appendChild(b);
    });
  }

  function render(initial) {
    var applied = applyTheme(el.note, activeTheme());
    el.note.style.zoom = state.size;

    if (document.activeElement !== el.title && el.title.textContent !== state.title) {
      el.title.textContent = state.title;
    }
    el.stamp.textContent = applied.stampText;

    patchTasks();

    var total = state.tasks.length;
    var done = state.tasks.filter(function (t) { return t.done; }).length;
    el.progress.hidden = total === 0 || !applied.progress;
    el.progress.textContent = done + ' / ' + total + ' done';

    var allDone = total > 0 && done === total;
    el.stamp.hidden = !allDone;
    if (allDone && !prevAllDone && !initial) {
      el.stamp.classList.add('pop');
      el.note.classList.add('celebrate');
      setTimeout(function () {
        el.stamp.classList.remove('pop');
        el.note.classList.remove('celebrate');
      }, 800);
    }
    prevAllDone = allDone;

    if (IS_DOCK) {
      if (el.swatches.children.length !== allThemes().length) renderSwatches();
      Array.prototype.forEach.call(el.swatches.children, function (b) {
        b.classList.toggle('selected', b.dataset.theme === state.themeId);
      });
      var pct = Math.round(state.size * 100);
      if (document.activeElement !== el.sizeSlider) el.sizeSlider.value = pct;
      el.sizeVal.textContent = pct + '%';
      if (document.activeElement !== el.rotSlider) el.rotSlider.value = applied.tilt;
      el.rotVal.textContent = applied.tilt + '°';
      if (document.activeElement !== el.paperColor) el.paperColor.value = applied.paper;
      if (document.activeElement !== el.inkColor) el.inkColor.value = applied.ink;
      el.themeRemove.hidden = isBuiltin(state.themeId);
    }
  }

  /* ---------- Mutations ---------- */

  function findTask(id) {
    for (var i = 0; i < state.tasks.length; i++) {
      if (state.tasks[i].id === id) return state.tasks[i];
    }
    return null;
  }

  function toggleTask(id) {
    var t = findTask(id);
    if (!t) return;
    t.done = !t.done;
    commit();
  }

  function addTask(text) {
    state.tasks.push({ id: uid(), text: text, done: false });
    commit();
  }

  function moveTask(id, delta) {
    var i = state.tasks.map(function (t) { return t.id; }).indexOf(id);
    var j = i + delta;
    if (i < 0 || j < 0 || j >= state.tasks.length) return;
    var tmp = state.tasks[i];
    state.tasks[i] = state.tasks[j];
    state.tasks[j] = tmp;
    commit();
  }

  function removeTask(id) {
    state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
    if (state.current === id) state.current = null;
    commit();
  }

  /* ---------- Commands ----------
   * Everything that drives the list from outside goes through here, and every
   * command is a verb about the list's current state rather than a reference
   * to a particular task. That is deliberate: a button wired to "check off
   * item three" is scrap the moment the list changes, whereas "advance" keeps
   * working for every list you ever write. Bind a key or a Stream Deck button
   * once and never touch it again.
   */

  function firstUnfinished() {
    for (var i = 0; i < state.tasks.length; i++) {
      if (!state.tasks[i].done) return state.tasks[i];
    }
    return null;
  }

  function setCurrent(id) {
    state.current = (state.current === id) ? null : id;
    commit();
  }

  /* Tick off whatever you are on and move to the next thing left. With nothing
     marked yet it just marks where you are, so the first press never skips a
     task by surprise. */
  function advance() {
    if (!state.tasks.length) return;
    var cur = findTask(state.current);
    if (!cur) {
      var start = firstUnfinished();
      state.current = start ? start.id : null;
      commit();
      return;
    }
    cur.done = true;
    var next = firstUnfinished();
    state.current = next ? next.id : null;
    commit();
  }

  /* Step back to the previous task and un-tick it — the undo for a fumbled
     advance, which on a live stream is the button you actually need. */
  function back() {
    var ids = state.tasks.map(function (t) { return t.id; });
    var at = state.current ? ids.indexOf(state.current) : state.tasks.length;
    for (var i = at - 1; i >= 0; i--) {
      if (state.tasks[i].done) {
        state.tasks[i].done = false;
        state.current = state.tasks[i].id;
        commit();
        return;
      }
    }
    if (state.tasks.length) {
      state.current = state.tasks[0].id;
      commit();
    }
  }

  var COMMANDS = {
    advance: advance,
    back: back,
    reset: function () {
      state.tasks.forEach(function (t) { t.done = false; });
      state.current = null;
      commit();
    },
    clear_current: function () {
      state.current = null;
      commit();
    }
  };

  function runCommand(name) {
    var fn = COMMANDS[String(name || '').toLowerCase()];
    if (!fn) return false;
    fn();
    return true;
  }

  /* ---------- Dock-only setup ---------- */

  /* Clipboard access can be refused; falling back to a selection at least lets
     someone hit Ctrl+C without retyping a file path by hand. */
  function selectText(node) {
    var r = document.createRange();
    r.selectNodeContents(node);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }

  function flashMsg(text, kind) {
    el.themeMsg.textContent = text;
    el.themeMsg.className = 'theme-msg' + (kind ? ' ' + kind : '');
    if (kind === 'good') {
      setTimeout(function () {
        if (el.themeMsg.textContent === text) el.themeMsg.textContent = '';
      }, 2500);
    }
  }

  /* The builder lives next to this file. Deliberately a copyable path rather
     than a link: a link clicked inside an OBS dock navigates the dock itself,
     which would replace your note with the builder and leave you hunting for
     the way back. Paste it into a real browser instead. */
  function builderPath() {
    var base = location.href.split('#')[0].split('?')[0];
    var cut = base.lastIndexOf('/');
    if (cut === -1) return null;
    return base.slice(0, cut + 1) + 'theme-builder.html';
  }

  function setupBuilderLink() {
    var url = builderPath();
    if (!url) return;

    el.builderUrl.textContent = url;
    el.builderHint.textContent = 'Open this in your normal browser to design a '
      + 'theme, then paste the code it gives you into the box above. It has to '
      + 'be a separate browser: OBS keeps its own, so the builder cannot reach '
      + 'this note directly.';

    el.builderCopy.addEventListener('click', function () {
      var done = function () {
        el.builderCopy.textContent = 'Copied!';
        setTimeout(function () { el.builderCopy.textContent = 'Copy'; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () {
          selectText(el.builderUrl);
        });
      } else {
        selectText(el.builderUrl);
      }
    });

    el.themeBuilder.hidden = false;
  }

  function setupThemePanel() {
    el.themeBtn.addEventListener('click', function () {
      el.themePanel.hidden = !el.themePanel.hidden;
      if (!el.themePanel.hidden) el.themeCode.focus();
    });

    el.themeApply.addEventListener('click', function () {
      var theme = decodeTheme(el.themeCode.value);
      if (!theme) {
        flashMsg('That is not a theme code.', 'bad');
        return;
      }
      /* Ids collide easily — two people both start from "Classic Yellow" in
         the builder. Keep the incoming label but give it a fresh id unless it
         is genuinely replacing one of your own. */
      if (isBuiltin(theme.id)) theme.id = theme.id + '-' + uid().slice(0, 4);
      var at = -1;
      state.themes.forEach(function (t, i) { if (t.id === theme.id) at = i; });
      if (at >= 0) state.themes[at] = theme; else state.themes.push(theme);

      state.themeId = theme.id;
      state.rotation = null;
      state.paper = null;
      state.ink = null;
      el.themeCode.value = '';
      renderSwatches();
      commit();
      flashMsg('Added "' + theme.label + '".', 'good');
    });

    el.themeCopy.addEventListener('click', function () {
      var t = activeTheme();
      var base = themeById(state.themeId);
      t.label = base.label + (isBuiltin(state.themeId) ? ' (edited)' : '');
      var code = encodeTheme(t);
      el.themeCode.value = code;
      el.themeCode.select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(
          function () { flashMsg('Copied.', 'good'); },
          function () { flashMsg('Select the box and copy.', null); }
        );
      } else {
        flashMsg('Select the box and copy.', null);
      }
    });

    el.themeRemove.addEventListener('click', function () {
      if (isBuiltin(state.themeId)) return;
      var gone = state.themeId;
      state.themes = state.themes.filter(function (t) { return t.id !== gone; });
      state.themeId = 'yellow';
      renderSwatches();
      commit();
      flashMsg('Removed.', 'good');
    });
  }

  function setupDock() {
    el.toolbar.hidden = false;
    el.addRow.hidden = false;

    renderSwatches();
    setupThemePanel();
    setupBuilderLink();

    el.sizeSlider.addEventListener('input', function () {
      state.size = el.sizeSlider.value / 100;
      commit();
    });
    el.rotSlider.addEventListener('input', function () {
      state.rotation = parseInt(el.rotSlider.value, 10);
      commit();
    });
    el.paperColor.addEventListener('input', function () {
      state.paper = el.paperColor.value;
      commit();
    });
    el.inkColor.addEventListener('input', function () {
      state.ink = el.inkColor.value;
      commit();
    });

    el.title.setAttribute('contenteditable', 'plaintext-only');
    el.title.addEventListener('focus', function () { el.title.dataset.orig = el.title.textContent; });
    el.title.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); el.title.blur(); }
      if (ev.key === 'Escape') {
        el.title.textContent = el.title.dataset.orig || DEFAULT_TITLE;
        el.title.blur();
      }
    });
    el.title.addEventListener('blur', function () {
      var text = el.title.textContent.replace(/\s+/g, ' ').trim();
      if (!text) { el.title.textContent = state.title; return; }
      if (text !== state.title) { state.title = text; commit(); }
    });

    el.addInput.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      var text = el.addInput.value.replace(/\s+/g, ' ').trim();
      if (!text) return;
      el.addInput.value = '';
      addTask(text);
      el.addInput.focus();
    });

    el.uncheckAll.addEventListener('click', function () {
      state.tasks.forEach(function (t) { t.done = false; });
      commit();
    });

    var clearTimer = 0;
    el.clearList.addEventListener('click', function () {
      if (!clearTimer) {
        el.clearList.textContent = 'Really clear?';
        el.clearList.classList.add('armed');
        clearTimer = setTimeout(function () {
          clearTimer = 0;
          el.clearList.textContent = 'Clear list';
          el.clearList.classList.remove('armed');
        }, 3000);
      } else {
        clearTimeout(clearTimer);
        clearTimer = 0;
        el.clearList.textContent = 'Clear list';
        el.clearList.classList.remove('armed');
        state.tasks = [];
        commit();
      }
    });
  }

  /* ---------- Setup-URLs panel ---------- */

  function setupUrlPanel() {
    var inOBS = !!window.obsstudio;
    if (!IS_DOCK && inOBS) return; // on-stream overlay: never show

    var panel = document.getElementById('setup');
    var base = location.href.split('#')[0].split('?')[0];

    var title = document.createElement('div');
    title.className = 'setup-title';
    title.textContent = IS_DOCK
      ? 'This note lives at these URLs. If you move the file, update them in OBS:'
      : 'Add this sticky note to OBS:';
    panel.appendChild(title);

    [['Dock', base + '?view=dock'], ['Overlay', base]].forEach(function (pair) {
      var row = document.createElement('div');
      row.className = 'url-row';
      var lab = document.createElement('span');
      lab.className = 'url-label';
      lab.textContent = pair[0];
      var txt = document.createElement('span');
      txt.className = 'url-text';
      txt.textContent = pair[1];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.addEventListener('click', function () {
        var done = function () {
          btn.textContent = 'Copied!';
          setTimeout(function () { btn.textContent = 'Copy'; }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(pair[1]).then(done, function () { selectText(txt); });
        } else {
          selectText(txt);
        }
      });
      row.appendChild(lab);
      row.appendChild(txt);
      row.appendChild(btn);
      panel.appendChild(row);
    });

    var hint = document.createElement('div');
    hint.className = 'setup-hint';
    hint.textContent = 'Dock URL goes in View → Docks → Custom Browser Docks. '
      + 'Overlay URL goes in a Browser source with “Local file” unchecked.';
    panel.appendChild(hint);

    panel.hidden = false;
  }

  /* ---------- Ways to run a command ----------
   * Three transports, one command set. The commands stay verbs so a binding
   * made once survives every list you write afterwards.
   */

  /* 1. The keyboard, in the dock. Free, works today, no setup. */
  function setupKeys() {
    document.addEventListener('keydown', function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      /* never while a task, the title, or the add box is being typed into */
      var a = document.activeElement;
      if (a && (a.isContentEditable || a.tagName === 'INPUT'
                || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT')) return;

      if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); runCommand('advance'); }
      else if (ev.key === 'Backspace') { ev.preventDefault(); runCommand('back'); }
    });
  }

  /* 2. OBS custom events, which is how anything outside OBS reaches this page.
   *    obs-websocket's CallVendorRequest with vendorName "obs-browser" and
   *    requestType "emit_event" dispatches a DOM event into browser sources,
   *    so a Stream Deck, a Companion button or a script can drive the list
   *    without knowing anything about what is on it.
   *
   *    Listened for in both the overlay and the dock: whichever receives it
   *    writes to storage, and the other picks the change up on its next poll.
   */
  function setupObsEvents() {
    ['sticky-note', 'obs-sticky-note'].forEach(function (name) {
      window.addEventListener(name, function (ev) {
        var d = ev && ev.detail;
        var cmd = d && (typeof d === 'string' ? d : d.command || d.cmd);
        runCommand(cmd);
      });
    });
    /* one event per command too, so a sender that cannot attach a payload
       still has something to aim at */
    Object.keys(COMMANDS).forEach(function (cmd) {
      window.addEventListener('sticky-note-' + cmd.replace(/_/g, '-'), function () {
        runCommand(cmd);
      });
    });
  }

  /* 3. A URL parameter, for a hidden browser source used as a command channel:
   *    point one at ?cmd=advance and have a hotkey refresh it. Clumsy, but it
   *    needs no websocket and no extra software. It runs once on load and only
   *    ever writes — it never renders anything.
   */
  function runUrlCommand() {
    var cmd = qs.get('cmd');
    if (!cmd || IS_DEMO) return false;
    return runCommand(cmd);
  }

  /* ---------- Sync (storage event + polling fallback) ---------- */

  function refreshFromStorage() {
    var raw = localStorage.getItem(KEY);
    if (raw === lastRaw) return;
    lastRaw = raw;
    state = parseState(raw);
    if (IS_DOCK) renderSwatches();
    render(false);
  }

  /* ---------- Init ---------- */

  document.body.classList.add(IS_DOCK ? 'dock' : 'overlay');
  document.title = IS_DOCK ? 'Sticky Note (Dock)' : 'Sticky Note';
  if (SCALE && SCALE !== 1 && SCALE > 0.2 && SCALE <= 5) {
    document.body.style.zoom = SCALE;
  }

  if (IS_DOCK) {
    setupDock();
    setupKeys();
  }
  setupObsEvents();
  setupUrlPanel();

  if (!IS_DEMO) {
    window.addEventListener('storage', function (ev) {
      if (ev.key === KEY || ev.key === null) refreshFromStorage();
    });
    setInterval(refreshFromStorage, 1000);
  }

  runUrlCommand();
  render(true);
})();
