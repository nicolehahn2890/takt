# Takt

Dein Training, dein Takt: eine Web-App für eigene Home-Workouts mit Timer und Ansagen.

**App:** https://nicolehahn2890.github.io/takt/

## Für die Entwicklung

- Konzept: [docs/KONZEPT.md](docs/KONZEPT.md)
- Bauplan Schritt 1: [docs/superpowers/plans/2026-10-22-schritt-1-grundgeruest.md](docs/superpowers/plans/2026-10-22-schritt-1-grundgeruest.md)

Tests (im Projektordner):

```bash
node tests/run.js
```

Sprachdateien neu erzeugen, nachdem Übungen oder feste Sätze geändert wurden (im Projektordner, braucht `pip install edge-tts`):

```bash
python tools/make_voice.py
```

## Frühere Tests

- iPhone-Test 1: https://nicolehahn2890.github.io/takt/spike/
- iPhone-Test 2 (Browser-Stimme und Spotify): https://nicolehahn2890.github.io/takt/spike2/
- Mockups Training-Screen: https://nicolehahn2890.github.io/takt/mockups/
