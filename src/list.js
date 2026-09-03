/* ---------------------------------------------------------------------------
 * Getting a list in and out
 *
 * The list lives in OBS's browser storage, which the README has to warn people
 * is wiped along with OBS's browser cache. Themes could already be copied out
 * and pasted back. The tasks, which is what anyone would actually miss, could
 * not. This closes that.
 *
 * Export is a code, so a list round-trips exactly, done marks included.
 * Import deliberately also takes plain text, because that is where checklists
 * actually come from: a notes app, a Discord message, the description of the
 * stream you are about to do. Making someone retype a list they already wrote
 * would defeat the point.
 * ------------------------------------------------------------------------- */

var LIST_PREFIX = 'snl1:';
var MAX_TASKS = 200;
var MAX_TASK_LEN = 200;

function listToB64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function listFromB64(b64) {
  return decodeURIComponent(escape(atob(b64)));
}

function encodeList(title, tasks) {
  var payload = {
    v: 1,
    title: String(title == null ? '' : title).slice(0, 200),
    tasks: (tasks || []).slice(0, MAX_TASKS).map(function (t) {
      /* ids are local to one machine's storage and mean nothing to whoever
         you send this to, so they are left out */
      return t.done ? [t.text, 1] : [t.text];
    })
  };
  return LIST_PREFIX + listToB64(JSON.stringify(payload));
}

function cleanText(s) {
  return String(s).replace(/\s+/g, ' ').trim().slice(0, MAX_TASK_LEN);
}

/* One task per line. Strips the punctuation lists already carry (bullets,
   numbering, markdown checkboxes) so a list written elsewhere pastes in, and
   reads a ticked markdown box as a finished task. */
function parsePlainList(text) {
  var out = [];
  String(text).split(/\r?\n/).forEach(function (raw) {
    var line = raw.trim();
    if (!line) return;

    /* bullet or numbering: "- ", "* ", "• ", "3. ", "3) " */
    line = line.replace(/^[-*•–—]\s+/, '').replace(/^\d+[.)]\s+/, '');

    /* markdown checkbox, which may follow a bullet */
    var done = false;
    var box = /^\[([ xX\-])\]\s*/.exec(line);
    if (box) {
      done = box[1] !== ' ';
      line = line.slice(box[0].length);
    }

    var text2 = cleanText(line);
    if (!text2) return;
    if (out.length >= MAX_TASKS) return;
    out.push({ text: text2, done: done });
  });
  return out;
}

/* Accepts a code, raw JSON, or a plain list. Returns { title, tasks } with
   title null when the source did not carry one, or null if there is nothing
   usable in there at all. */
function decodeList(text) {
  var raw = String(text == null ? '' : text).trim();
  if (!raw) return null;

  var json = null;
  if (raw.slice(0, LIST_PREFIX.length) === LIST_PREFIX) {
    try { json = listFromB64(raw.slice(LIST_PREFIX.length)); }
    catch (e) { return null; }
  } else if (raw.charAt(0) === '{') {
    json = raw;
  }

  if (json !== null) {
    var data;
    try { data = JSON.parse(json); } catch (e) { return null; }
    if (!data || typeof data !== 'object' || !Array.isArray(data.tasks)) return null;
    var tasks = [];
    data.tasks.slice(0, MAX_TASKS).forEach(function (t) {
      /* the compact pair form, and the plain object form for hand-written JSON */
      var text2 = Array.isArray(t) ? t[0] : (t && t.text);
      var done = Array.isArray(t) ? !!t[1] : !!(t && t.done);
      if (typeof text2 !== 'string') return;
      text2 = cleanText(text2);
      if (text2) tasks.push({ text: text2, done: done });
    });
    if (!tasks.length) return null;
    return {
      title: typeof data.title === 'string' && data.title.trim()
        ? cleanText(data.title) : null,
      tasks: tasks
    };
  }

  /* A code for something else, a theme most likely, would otherwise sail
     through as one plain-text task made of base64. Somebody will paste into
     the wrong box, and a task named "sn1:eyJ2Ijox..." helps nobody. */
  if (/^[a-z][a-z0-9]*:[A-Za-z0-9+/=]+$/.test(raw)) return null;

  var plain = parsePlainList(raw);
  if (!plain.length) return null;
  return { title: null, tasks: plain };
}
