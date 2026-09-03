/* ---------------------------------------------------------------------------
 * Saving to and loading from a file
 *
 * Both need a click behind them. A page cannot write to a path of its
 * choosing, or read one, without you saying so. That is also why
 * there is no "keep list.json next to the app and load it on startup": a
 * file:// page gets an opaque origin, so fetching a file sitting beside it is
 * a cross-origin request and is blocked. Verified, not assumed.
 *
 * So files are the good option for keeping a backup on disk, and pasted text
 * stays the one that always works, including inside a browser source and
 * when sending a list to somebody else.
 * ------------------------------------------------------------------------- */

function saveTextFile(name, text, mime) {
  var blob = new Blob([text], { type: mime || 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  /* revoked late: Safari has been known to cancel the download if the URL
     dies before it has finished reading it */
  setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
}

/* Opens a picker and hands back the file's text. The input is rebuilt each
   time so picking the same file twice in a row still fires a change event. */
function openTextFile(accept, onText, onFail) {
  var input = document.createElement('input');
  input.type = 'file';
  if (accept) input.accept = accept;
  input.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px';

  input.addEventListener('change', function () {
    var file = input.files && input.files[0];
    document.body.removeChild(input);
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () { onText(String(reader.result), file.name); };
    reader.onerror = function () { if (onFail) onFail('That file could not be read.'); };
    reader.readAsText(file);
  });

  document.body.appendChild(input);
  input.click();
}
