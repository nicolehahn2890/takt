"""Wandelt Nicht-ASCII-Zeichen in js/*.js in Unicode-Escapes um (Regel: js/ nur ASCII).

Aufruf im Projektordner:  python tools/ascii_js.py
Noetig, weil das Schreib-Werkzeug Escapes beim Speichern in echte Zeichen verwandelt.
"""
import glob
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKSLASH = chr(92)

changed = 0
for path in sorted(glob.glob(os.path.join(ROOT, "js", "*.js"))):
    with io.open(path, encoding="utf-8") as f:
        text = f.read()
    fixed = "".join(c if ord(c) < 128 else BACKSLASH + "u%04x" % ord(c) for c in text)
    if fixed != text:
        with io.open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(fixed)
        changed += 1
        print("umgewandelt:", os.path.relpath(path, ROOT))
print(changed, "Datei(en) geaendert")
