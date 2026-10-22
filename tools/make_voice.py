"""Erzeugt die Takt-Sprachdateien mit der Stimme Katja (edge-tts).

Aufruf im Projektordner:  python tools/make_voice.py
Braucht: Node (fuer tools/voice-lines.js) und  pip install edge-tts

- Erzeugt assets/voice/<key>.mp3 fuer jeden festen Satz und jede Uebung.
- Ueberspringt Dateien, deren Text sich nicht geaendert hat.
- Loescht nichts.
- Schreibt data/voice-manifest.js (Takt.VOICE_FILES).
"""
import asyncio
import json
import os
import subprocess

import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICE = "de-DE-KatjaNeural"
OUT_DIR = os.path.join(ROOT, "assets", "voice")
MANIFEST = os.path.join(ROOT, "data", "voice-manifest.js")
MARK = "Takt.VOICE_FILES = "


def load_lines():
    result = subprocess.run(
        ["node", os.path.join(ROOT, "tools", "voice-lines.js")],
        capture_output=True, check=True,
    )
    return json.loads(result.stdout.decode("utf-8"))


def load_manifest():
    if not os.path.exists(MANIFEST):
        return {}
    with open(MANIFEST, encoding="utf-8") as f:
        text = f.read()
    start = text.find(MARK)
    if start < 0:
        return {}
    body = text[start + len(MARK):].strip().rstrip(";")
    try:
        return json.loads(body)
    except ValueError:
        return {}


def write_manifest(entries):
    with open(MANIFEST, "w", encoding="utf-8", newline="\n") as f:
        f.write("/* Takt: Sprachdateien (Stimme Katja). GENERIERT von tools/make_voice.py, nicht von Hand aendern. */\n")
        f.write("window.Takt = window.Takt || {};\n")
        f.write(MARK + json.dumps(entries, ensure_ascii=False, indent=1, sort_keys=True) + ";\n")


async def main():
    lines = load_lines()
    old = load_manifest()
    os.makedirs(OUT_DIR, exist_ok=True)
    entries = {}
    made = 0
    for key, text in lines.items():
        rel = "assets/voice/" + key + ".mp3"
        path = os.path.join(ROOT, rel)
        if old.get(key, {}).get("text") == text and os.path.exists(path):
            entries[key] = {"src": rel, "text": text}
            continue
        await edge_tts.Communicate(text, VOICE).save(path)
        made += 1
        entries[key] = {"src": rel, "text": text}
        print("erzeugt:", rel, "-", text)
    for key, entry in old.items():
        if key not in entries and os.path.exists(os.path.join(ROOT, entry.get("src", ""))):
            entries[key] = entry
    write_manifest(entries)
    print(made, "erzeugt,", len(entries), "im Manifest")


if __name__ == "__main__":
    asyncio.run(main())
