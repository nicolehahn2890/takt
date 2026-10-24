# Takt

Dein Training, dein Takt: eine Web-App für eigene Home-Workouts mit Timer und Ansagen.

**App:** https://nicolehahn2890.github.io/takt/

## Für die Entwicklung

- Konzept und aktueller Stand: [docs/KONZEPT.md](docs/KONZEPT.md)
- Gestaltung: [docs/design_handoff_takt_redesign/design-system/DESIGN_GUIDE.md](docs/design_handoff_takt_redesign/design-system/DESIGN_GUIDE.md)
- Pläne und Specs der einzelnen Schritte: [docs/superpowers/](docs/superpowers/) (Stand ihres Datums; bei Abweichungen gilt das Konzept)

Tests (im Projektordner):

```bash
node tests/run.js
```

Nach Änderungen an Dateien in `js/`: Umlaute als `\u`-Escape (die Tests prüfen das), notfalls automatisch umwandeln:

```bash
python tools/ascii_js.py
```

Bei jeder Änderung an App-Dateien die Cache-Nummer `?v=` in `index.html` hochzählen.

Sprachdateien neu erzeugen, nachdem Übungen oder feste Sätze geändert wurden (im Projektordner, braucht `pip install edge-tts`):

```bash
python tools/make_voice.py
```

## Frühere Tests

- iPhone-Test 1: https://nicolehahn2890.github.io/takt/spike/
- iPhone-Test 2 (Browser-Stimme und Spotify): https://nicolehahn2890.github.io/takt/spike2/
- Mockups Training-Screen: https://nicolehahn2890.github.io/takt/mockups/
- Bildproben (Figur, Schritt 2): https://nicolehahn2890.github.io/takt/spike3/
- Entwurf Workouts (Editor, Schritt 3): https://nicolehahn2890.github.io/takt/mockups/editor/
- Figuren-Galerie: https://nicolehahn2890.github.io/takt/tools/galerie.html
