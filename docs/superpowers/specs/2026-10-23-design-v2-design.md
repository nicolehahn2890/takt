# Takt: Design v2 auf die App anwenden (Teil A)

Stand 2026-10-23 · Quelle der Gestaltung: `docs/design_handoff_takt_redesign/` (aus Claude Design, von Nicole geliefert)

## Absicht

Nicole will das Takt-Design aus Claude Design **genau so** in der App sehen: neue Farben, Outfit für Überschriften und Zahlen, die Übungsfigur als Logo statt des Pixel-Pfirsichs, weniger „KI-typischer“ Look (keine farbigen Randstreifen an Karten, keine Umrandungen um jede Kachel, keine Großbuchstaben-Überschriften). Die App soll ruhig, weich und hochwertig wirken, auf dem iPhone am Abend.

Das ist **Teil A**. **Teil B** (Leiste unten mit Home / Bibliothek / Statistik, Statistik-Screen) kommt erst nach Nicoles iPhone-Test von Teil A und wird eigens besprochen.

## Verbindliche Quelle

- `docs/design_handoff_takt_redesign/README.md` (Werte für Farben, Schrift, Abstände, Rundungen, Knopfhöhen; Schritt-für-Schritt-Anleitung) – **verbindlich, Werte exakt übernehmen**.
- `design-system/components/*.jsx.txt` und `design-system/ui_kits/app/*.jsx.txt` – genaue Maße für Startseite (BrandHeader, WeekStat, QuickTile, WorkoutCard, SectionTitle, NavCard, Hint), Vorschau (TopBar, ExerciseRow), Anpassen-Fenster (Sheet, RangeField, Segmented), Training, Geschafft, Bibliothek, Detail.
- `design-system/tokens/*.css` – Farb- und Maß-Variablen.
- `app.css` im Handoff – Ersatz für `css/app.css`, **aber auf dem Stand vor Schritt 3** (kennt Startseite neu, Vorschau, Fenster, Editor, Auswahl, Mix nicht).

## Ziele

1. Alle Screens im neuen Design: Start, Vorlagen-Vorschau, Anpassen-Fenster, Mix-Fenster, Training, Geschafft, Bibliothek, Übungs-Detail, eigene Übung, Workout-Editor, Übungs-Auswahl.
2. Werte exakt nach README und Bausteinen: Hintergrund `#171217`, Fläche `#241B23`, erhöht `#30232D`, vertieft `#1d161c`, Rosé `#BE7B9D`, Lavendel `#B794C5`, Salbei `#C6C5A6`; Themen core `#C6C5A6` · bauch `#BE7B9D` · dehnen `#A8C4A0` · yoga `#B794C5` · beine `#C4A882` · rücken `#8AB4C4`; Abstände 8/12/16/24/32; Karten-Radius 18, Zeilen 16, Eingaben 12, Knöpfe 14, Fenster 22; Knöpfe 52 px (groß 58), mind. 44 px.
3. Logo: `assets/takt-mark.svg` (Ausfallschritt-Figur) im Kopf der Startseite; Pixel-Pfirsich entfällt.
4. App-Symbol schon jetzt mit dem Logo (Nicoles Wunsch): `apple-touch-icon` 180 px als PNG auf `#171217` mit etwa 16 % Rand, dazu Favicon.
5. Figur-Farben laut README Punkt 6 (Pfeil Rosé, Atemkreis Lavendel); Gliedmaßen-Farben bleiben.

## Nicht-Ziele

- Keine neuen Funktionen, keine Leiste unten, keine Statistik (Teil B).
- Keine Änderung an Logik, Abläufen, Texten, gespeicherten Daten oder Tests (außer Farbwerten, die Tests prüfen).
- Kein React, kein Build-Schritt, keine Icon-Schrift. Zeichen wie ‹ › ✕ ◀︎ ▶︎ ❚❚ bleiben.
- Antippen einer Übung in der Vorschau öffnet **nicht** das Detail (im Design-Klickdummy so, aber die README sagt „Verhalten unverändert“).

## Anti-Ziele (wäre ein Fehlschlag)

- Farbige Randstreifen, Umrandungen um Kacheln oder Großbuchstaben-Überschriften tauchen irgendwo wieder auf.
- Knöpfe werden kleiner oder schwerer zu treffen als heute; Querscrollen bei 375 px.
- Die Themenfarbe einer Karte passt nicht zu Start-Knopf, Punkt und Figuren-Hintergrund.
- Das iPhone mischt alte und neue Dateien (Cache): jede geänderte Datei bekommt ein neues `?v=`.

## Festgelegt von Nicole (2026-10-23)

- Design genau so übernehmen; Teil A zuerst, iPhone-Test, dann Teil B.
- Design-Unterlagen liegen im Repo unter `docs/design_handoff_takt_redesign/` (erledigt).
- Design-Skill `takt-design` in beiden Skill-Ordnern installiert (erledigt).
- App-Symbol mit Logo jetzt.

## Meine Festlegungen (Nicole kann widersprechen)

- **Vorgehen CSS:** Handoff-`app.css` als Grundlage übernehmen, die Schritt-3-Regeln (Startseite neu, Vorschau, Fenster, Editor, Auswahl, Mix) neu im selben Stil und mit denselben Variablen schreiben; alte Schritt-3-Regeln mit Streifen/Großbuchstaben fallen weg.
- **Start-Knöpfe** in der Themenfarbe (README Punkt 5); Salbei für allgemeine Hauptknöpfe (Nochmal, Starten im Anpassen-Fenster); Rosé für „Bearbeiten (als Kopie)“, „Speichern & Starten“, „+ Neu“; Lavendel für Auswahl (Chips, Segmente, Pause-Ring, Mix-Kachel).
- **Startseite** wie `StartScreen`: Wochen-Zahl groß ohne Kasten (WeekStat), Mix/+ Neu als Kacheln (QuickTile, 84 px), Abschnittstitel 24 px Outfit mit Anzahl rechts, Workout-Karten mit Figuren-Streifen in Themen-Tönung (13 %), Start-Knopf und „Anpassen“-Link; Vorlagen pro Thema mit Punkt und Zweier-Raster.
- **Vorschau** wie `PreviewScreen`: Kopfleiste mit Titel 18 px + Zeile darunter, Start/Anpassen groß (58 px), Blocktitel 17 px mit „x Runden“ rechts, Übungszeilen ohne Kartenfläche, Fuß mit Verlauf statt Kante.
- **Fenster** (Anpassen, Mix) wie `Sheet`: Griff oben, Titel 24 px, Abschnitts-Beschriftung 13 px statt Großbuchstaben, Regler mit eigener Spur (RangeField), Segmente auf vertiefter Fläche, „Neue Dauer“ 28 px Outfit.
- **Editor und Auswahl** (nicht im Design gezeichnet) nach denselben Bausteinen: Kopfleiste wie TopBar (sticky), Eingabefeld wie TextField (ohne Rand, Lavendel beim Fokus), Themen als Chips mit Farbpunkt, Werte als Stepper, Blöcke als Karten (18), Einträge auf vertiefter Fläche (16), Übungs-Auswahl als ExerciseRow mit Lavendel-Markierung und Nummer.
- **Hinweis-Toast** unten mittig hell (Design), bleibt aber über Fenstern und Fußleisten sichtbar (Fund aus Schritt 3).
- **Logo-Datei** unverändert aus dem Handoff; PNG für das App-Symbol rendere ich selbst.

## Nach der Bau-Prüfung geklärt (meine Festlegungen aus Nicoles „genau so“)

- **Das UI-Kit gewinnt bei allem Sichtbaren**, auch wo README oder heutige App weniger zeigen. Daraus folgt:
  - Geschafft-Screen bekommt die animierte Figur „Kindhaltung“ (fest, wie im Kit), 220 × 163 px, Radius 20, Themen-Tönung, über „Geschafft!“; sie wird beim Verlassen des Screens wieder abgemeldet (Startseite, Nochmal, Neuladen).
  - Kopfleisten von Vorschau, Bibliothek, Übungs-Detail, eigener Übung, Editor und Auswahl sind wie TopBar fixiert (sticky, leicht durchscheinend mit Unschärfe), mit sauberem Abstand zur iPhone-Statusleiste.
  - Karten unter „Meine Workouts“ zeigen das Thema in der Zeile: „Bauch · 12 Min. · 8 Übungen“.
- **Verhalten bleibt**, wo das Kit Verhalten zeigt, das es heute nicht gibt (z. B. Antippen einer Übung in der Vorschau).
- **App-Symbol:** Ich rendere `assets/takt-mark.svg` im Vorschau-Browser auf 180 × 180 px (Hintergrund `#171217`, 16 % Rand) als `assets/icon-180.png` und binde es als `apple-touch-icon` ein; Favicon = `assets/takt-mark.svg`. Kein Web-Manifest und kein Service Worker (das ist Schritt 5).
- **Vergleich:** Es gibt keine gerenderten Bilder des Kits im Repo. Geprüft wird über die Zahlen aus README und `.jsx.txt` (gemessen im Browser) plus Bildschirmfotos für Nicole. Hat Nicole Bildschirmfotos aus Claude Design, werden sie zusätzlich zum Vergleich genutzt.

## Dem Bauenden überlassen

- Genaue Klassennamen und Aufteilung in `css/app.css`, solange alle vom JS erzeugten Klassen eine Regel haben.
- Kleine DOM-Ergänzungen, wo das Design sie braucht (z. B. Farbpunkt, Griff im Fenster, Figuren-Streifen), solange Texte und Verhalten gleich bleiben.

## Prüfung

- `node tests/run.js` grün; `js/` nur ASCII.
- Vorschau-Browser bei 390 px und 375 px: jeder Screen und jedes Fenster einmal als Bild, Vergleich mit den UI-Kit-Werten; keine Konsolenfehler, kein Querscrollen.
- Unabhängige Prüfung (frischer Prüfer) vor der Übergabe.
- Live-Prüfung, Sync lokal = GitHub, danach iPhone-Test durch Nicole.
