# Prompt für Claude Code

Lege den Ordner `design_handoff_takt_redesign/` in dein Takt-Repo (z. B. unter `docs/`) und kopiere dann diesen Text in Claude Code:

---

Wende das neue Takt-Design auf die App an. Alle Vorgaben stehen in `docs/design_handoff_takt_redesign/README.md`. Lies sie zuerst komplett.

1. Ersetze `css/app.css` durch `docs/design_handoff_takt_redesign/app.css`.
2. Passe `index.html` an: Google-Fonts-Link (Outfit + DM Sans), `theme-color` #171217, `--theme` der Bibliothek-Karte auf #B794C5. Erhöhe alle `?v=` Cache-Nummern um 1.
3. Ersetze in `js/app.js` den Pixel-Pfirsich durch `assets/takt-mark.svg` (aus dem Handoff-Ordner kopieren) und aktualisiere die `THEMES`-Farben laut README.
4. Optional: passe die Farben in `js/figure.js` laut README Punkt 6 an.
5. Lass Logik, Texte und Struktur unverändert. Führe danach `node tests/run.js` aus und prüfe Start, Training, Geschafft, Bibliothek und Detail im Browser bei 390 px Breite.

Halte dich bei Farben, Größen und Abständen exakt an die Werte aus der README. Keine neuen Frameworks, kein Build-Schritt.
