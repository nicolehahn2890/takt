# Schritt 2: Übungsbibliothek mit animierter Figur – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Takt bekommt eine Bibliothek mit 110 Home-Übungen (deutsche Beschreibung, Katja-Ansage, animierte Figur im Peach-Stil), durchsuchbar und filterbar, plus eigene Übungen mit Foto und Video-Link; der Training-Screen zeigt die Figur statt des Icons.

**Architecture:** Neue reine Logik-Datei `js/figure.js` (Gelenk-Rechnung, Überblenden von Haltungen, SVG-Text) wird in Node getestet; die Übungsdaten liegen in `data/exercises.js`, die Haltungen getrennt in `data/poses.js`. Daten-Tests prüfen jede Übung und jede Haltung automatisch. Eine Galerie-Seite `tools/galerie.html` zeigt alle Figuren gleichzeitig zum Prüfen. Bibliothek und eigene Übungen sind neue Screens in `js/library.js`; Fotos liegen in IndexedDB.

**Tech Stack:** wie Schritt 1 (Vanilla JS, klassische Scripts an `window.Takt`, Node-Test-Runner, edge-tts für Katja), zusätzlich IndexedDB und `<canvas>` zum Verkleinern von Fotos.

**Spec:** `docs/KONZEPT.md` (Abschnitte 4.3, 4.4, 6.1, 7; Entscheidungen 2026-10-22: animierte Figur statt Bilder, Namen gemischt deutsch/englisch, zusätzlich Oberkörper/Ganzkörper)

## Global Constraints

- Alles aus Schritt 1 gilt weiter (Keys `takt_v1`/`takt_run_v1` nie umbenennen, `js/` nur ASCII, kein Grad-Zeichen, keine `speechSynthesis`, Ton nur Web Audio `ambient`, relative Pfade, Peach-Farben).
- **GitHub nur über das Privatkonto `nicolehahn2890`.** Push immer so: `git -c credential.helper= -c 'credential.helper=!f() { echo username=nicolehahn2890; echo "password=$(gh auth token -u nicolehahn2890)"; }; f' push origin main`. Nie das Firmenkonto.
- Das Schreib-Werkzeug wandelt `\u`-Escapes beim Speichern in echte Zeichen um: nach dem Schreiben von `js/`-Dateien `python tools/ascii_js.py` laufen lassen (Task 1 legt es an); der Test-Runner meldet Verstöße.
- Bei jeder Veröffentlichung `?v=` in `index.html` hochzählen (Start: `v=3`).
- Figur: Seitenansicht oder Vorderansicht, `viewBox="12 18 216 160"`, Boden bei y = 166; Segmentlängen Oberschenkel 40, Unterschenkel 40, Oberarm 30, Unterarm 28, Hals 6, Kopf-Radius 10; Farben vorne `#E3A3BF`, hinten `#9A6B8C`, Kopf `#F0C4D6`.
- Übungsnamen gemischt: deutsch, wo gebräuchlich; englisch, wo verbreitet; der andere Name als `alias`.
- Selbst eingetippte Übungen: Ton statt Name (wie bisher), Foto statt Figur, ohne Foto eine stehende Standardfigur.

## Review Focus

1. **Figur sieht falsch aus** (Knie knickt nach hinten, Arm durch den Boden, Kopf im Boden): Test `jede Haltung bleibt im Bild und über dem Boden` in Task 2 plus Sichtprüfung aller 110 in der Galerie.
2. **Viele animierte Figuren gleichzeitig** (Liste mit 110 Einträgen auf dem iPhone ruckelt oder leert den Akku): Liste zeigt stehende Vorschaubilder, nur die Detailansicht und das Training animieren; Test `Liste erzeugt keine Animation` (Zähler der laufenden Animationen) in Task 5.
3. **Großes Handyfoto** (12 MP, HEIC vom iPhone) beim eigenen Foto: wird auf 600 px verkleinert und als JPEG gespeichert; ein nicht lesbares Format zeigt eine Meldung statt abzustürzen. Browser-Prüfung in Task 5.
4. **Ungültiger Video-Link** (ohne `https://`, Leerzeichen, `javascript:`): nur `http`/`https` werden gespeichert, sonst Meldung. Test `normalizeUrl` in Task 4.
5. **Training mit gelöschter eigener Übung**: Schritt zeigt den gespeicherten Namen und die Standardfigur statt zu crashen. Test in Task 4.

---

## Dateien

| Datei | Aufgabe |
|---|---|
| `js/figure.js` | Figur: `ik`, `frameAt`, `svg`, Animations-Takt im Browser |
| `data/poses.js` | `Takt.POSES`: Haltungen je Übung |
| `data/exercises.js` | 110 Übungen (ersetzt den Startbestand, Ids des Test-Workouts bleiben) |
| `tools/galerie.html` | alle Figuren animiert nebeneinander, zum Prüfen |
| `tools/ascii_js.py` | wandelt Nicht-ASCII in `js/` in `\u`-Escapes |
| `js/store.js` | + `notes`, eigene Übungen prüfen, `normalizeUrl` |
| `js/photos.js` | Fotos in IndexedDB: speichern, laden, löschen, verkleinern |
| `js/library.js` | Screens Bibliothek, Übungs-Detail, Eigene Übung |
| `js/app.js`, `index.html`, `css/app.css` | Einstieg „Übungen“ auf dem Start-Screen, Figur im Training |
| `tests/figure.test.js`, `tests/data.test.js`, `tests/store.test.js` | Tests |

---

### Task 1: Figur-Rechnung

**Files:** Create `js/figure.js`, `tests/figure.test.js`, `tools/ascii_js.py`; Modify `tests/run.js` (lädt `js/figure.js`)

**Interfaces – Produces:**
- `Takt.figure.SEG` = `{thigh:40, shin:40, upper:30, fore:28, neck:6, head:10}`
- `Takt.figure.ik(a, c, l1, l2, bend) -> {mid:[x,y], end:[x,y]}` (Ziel außer Reichweite: gestreckt Richtung Ziel)
- `Takt.figure.frameAt(pose, ms) -> Frame`: `pose = {frames:[Frame, ...], hold?:number, move?:number}`; spätere Frames erben fehlende Werte vom vorigen; Ablauf je Übergang: halten `hold` s (Standard 0,6), weich bewegen `move` s (Standard 0,9), am Ende zurück zum ersten Frame; ein einzelner Frame bekommt eine leichte Atembewegung (Schultern und Hüfte ±1,5 px)
- `Frame = {hip, sh, footN, footF, handN, handF, kneeN, kneeF, elbowN, elbowF, footDirN, footDirF, headDir?, hipW?, shW?}`; `hipW`/`shW` = halbe Breite für Vorderansicht (Standard 0)
- `Takt.figure.svg(frame) -> string` (SVG-Inhalt: Matte, hintere Glieder, Rumpf, vordere Glieder, Kopf)
- `Takt.figure.bounds(frame) -> {minX, maxX, minY, maxY}` aller gezeichneten Punkte
- Browser: `Takt.figure.mount(svgEl, pose)` startet die Animation, `Takt.figure.unmount(svgEl)`, `Takt.figure.running() -> int`; ein gemeinsamer `requestAnimationFrame`-Takt, pausiert bei verstecktem Tab

- [ ] Failing tests: `ik` Längen stimmen (Abstand a–mid = l1, mid–end = l2 auf 0,01 genau); `ik` außer Reichweite liefert gestreckte Linie; `frameAt` bei 0 ms = Frame 1, nach `hold+move` = Frame 2, erbt fehlende Werte; einzelner Frame bewegt sich höchstens 1,5 px; `svg` enthält 11 Striche (`<line`), 1 Kreis, 1 Matte und keine `NaN`
- [ ] `node tests/run.js` → FAIL; umsetzen (aus `spike3/index.html` übernehmen und aufräumen); `python tools/ascii_js.py`; → alle bestanden
- [ ] Commit `Schritt 2: Figur-Rechnung` und Push (Privatkonto)

### Task 2: 110 Übungen und ihre Haltungen

**Files:** Modify `data/exercises.js`; Create `data/poses.js`, `tests/data.test.js`, `tools/galerie.html`

**Interfaces – Produces:**
- `Takt.EXERCISES`: genau die Liste im Anhang, Felder `{id, name, alias:[], beschreibung (2 bis 3 Sätze, Du-Form), hinweis (1 Satz), tags:[], beidseitig, typ:'zeit'|'atem', atem:{ein,halten,aus,haltenLeer}|null, hilfsmittel:[], bild:null, icon, quelle:'takt'}`
- Erlaubte `tags`: `vacuum, atmung, core, bauch, ruecken, beine-po, dehnen, yoga, ganzkoerper, oberkoerper, aufwaermen`; erlaubte `hilfsmittel`: `band, stuhl, tisch, sofa, wand, matte`
- `Takt.POSES`: für jede Übung mit `typ:'zeit'` ein Eintrag `{frames:[...], hold?, move?}`; Atem-Übungen haben keinen
- `tools/galerie.html`: lädt Daten und Figur, zeigt alle Übungen als Karten mit animierter Figur, Name und Id; Filter nach Tag

- [ ] Failing tests in `tests/data.test.js`: Ids eindeutig und `a-z0-9-`; genau 110 Übungen; Ids des Test-Workouts (`hampelmann, plank, glute-bridge, dead-bug, kindhaltung`) vorhanden; Pflichtfelder gesetzt, Tags und Hilfsmittel nur aus den erlaubten Listen; `typ:'atem'` hat `atem`-Rhythmus mit `ein+aus > 0`; jede `zeit`-Übung hat Haltungen, jede Atem-Übung keine; **jede Haltung bleibt im Bild und über dem Boden** (für jeden Frame: `bounds` innerhalb `12..228 / 18..170`, kein Punkt unter y = 170); keine Beschreibung länger als 320 Zeichen
- [ ] FAIL; Daten in Blöcken je Thema schreiben; nach jedem Block Galerie im Vorschau-Browser ansehen (Screenshots in zwei Bewegungsphasen) und falsche Haltungen korrigieren; → alle bestanden
- [ ] Commit `Schritt 2: 110 Übungen mit Haltungen` und Push

### Task 3: Katja-Ansagen für alle Übungen

**Files:** generiert `assets/voice/ex_*.mp3`, `data/voice-manifest.js`; Modify `tests/data.test.js`

- [ ] Failing test: jede Übung hat einen Eintrag `ex_<id>` in `Takt.VOICE_FILES`
- [ ] `python tools/make_voice.py` → meldet 105 neu erzeugt (5 gibt es schon); zweiter Lauf 0; Stichprobe von 10 Dateien im Browser dekodierbar
- [ ] → alle bestanden; Commit `Schritt 2: Ansagen für alle Übungen` und Push

### Task 4: Speicher für Notizen und eigene Übungen

**Files:** Modify `js/store.js`, `js/plan.js`, `tests/store.test.js`, `tests/plan.test.js`; Create `js/photos.js`

**Interfaces – Produces:**
- `defaults()` bekommt `notes: {}` (Notiz je Übungs-Id)
- `Takt.store.normalizeUrl(s) -> string|null`: trimmt, ergänzt `https://` wenn kein Schema, erlaubt nur `http:`/`https:`, sonst `null`
- `Takt.store.validateOwn(input) -> {ok:boolean, errors:string[], exercise}`: Name 1 bis 60 Zeichen Pflicht, Beschreibung bis 320, Tags nur erlaubte, Id `own-<uid>`, `quelle:'eigen'`, `typ:'zeit'`, `videoUrl` über `normalizeUrl`, `photoId` optional
- `Takt.exerciseFor(exId, exIndex, fallbackName) -> exercise` (in `js/plan.js`): unbekannte Id ergibt `{id, name: fallbackName, beidseitig:false, typ:'zeit', tags:[]}` statt `undefined`
- `Takt.photos.save(blob) -> Promise<photoId>` (verkleinert auf längste Seite 600 px, JPEG 0,82), `load(id) -> Promise<url|null>`, `remove(id)`; IndexedDB-Name `takt_photos_v1`

- [ ] Failing tests: `normalizeUrl` für `youtu.be/x` → `https://youtu.be/x`, `  https://a.b/c ` → getrimmt, `javascript:alert(1)` → `null`, `ftp://x` → `null`, `''` → `null`; `validateOwn` ohne Namen → Fehler; mit 61 Zeichen → Fehler; gültig → `id` beginnt mit `own-`; `exerciseFor` mit gelöschter Id → Fallback-Name; `load` alter Daten ohne `notes` ergänzt `{}`
- [ ] FAIL; umsetzen; → alle bestanden
- [ ] Commit `Schritt 2: Notizen und eigene Übungen im Speicher` und Push

### Task 5: Bibliothek, Detail, eigene Übung

**Files:** Create `js/library.js`; Modify `index.html`, `css/app.css`, `js/app.js`

**Verhalten:**
- Start-Screen bekommt neben „Vorlagen“ einen Knopf **„Übungen“** → Bibliothek.
- **Bibliothek:** Suchfeld (Name und Zweitname, ohne Groß/Klein und ohne Umlaut-Unterschied), Filter-Chips (Alle, Core, Bauch, Rücken, Beine & Po, Dehnen, Yoga, Atmung & Vacuum, Ganzkörper, Eigene), Liste mit **stehender** Vorschau-Figur (erster Frame), Name, Zweitname, Hilfsmittel-Hinweis; oben „+ Eigene Übung“.
- **Detail:** animierte Figur groß (Atem-Übungen: atmender Kreis nach Rhythmus), Name, Zweitname, Beschreibung, Hinweis, Tags, „beidseitig“, Hilfsmittel, eigene Notiz (speichert beim Tippen, kurz verzögert), Knopf „Ansage anhören“; bei eigenen Übungen Foto, Video-Link (öffnet neuen Tab), „Bearbeiten“, „Löschen“ (mit Nachfrage).
- **Eigene Übung anlegen/bearbeiten:** Name, Beschreibung, Tags, beidseitig, Foto (Kamera oder Mediathek, `accept="image/*"`), Video-Link; Fehler aus `validateOwn` direkt am Feld.
- Zurück-Knopf auf jedem Screen; der Zurück-Wisch des iPhones bleibt ohne Verlauf (eine Seite).

- [ ] Umsetzen; `node --check`, `python tools/ascii_js.py`, `node tests/run.js` grün
- [ ] Browser 375 × 667: Suche „brücke“ findet Glute Bridge über den Zweitnamen; Filter „Yoga“ zeigt 15; Detail Dead Bug animiert; `Takt.figure.running()` in der Liste = 0, im Detail = 1
- [ ] Browser: eigene Übung mit Foto (Testbild 4000 × 3000) anlegen → gespeichertes Foto längste Seite 600; ungültiger Video-Link zeigt Fehler; Löschen entfernt Übung und Foto
- [ ] Commit `Schritt 2: Bibliothek und eigene Übungen` und Push

### Task 6: Figur im Training

**Files:** Modify `js/app.js`, `index.html`, `css/app.css`

- Training-Screen: statt Icon die animierte Figur der aktuellen Übung (bei Pause und Vorbereitung die der kommenden), eigene Übung: Foto oder Standardfigur; Atem-Übung: atmender Kreis.
- [ ] Umsetzen; Tests grün; `?v=3`
- [ ] Browser 375 × 667 und 844 × 390: alles sichtbar ohne Scrollen, `Takt.figure.running()` = 1 im Training, 0 nach „Geschafft!“
- [ ] Commit `Schritt 2: Figur im Training` und Push

### Task 7: Prüfen, live stellen, übergeben

- [ ] Agent `html-app-tester`; danach frischer Gesamt-Prüfer (wie Schritt 1); wichtige Funde beheben, Kleinigkeiten in `KONZEPT.md` 8.1
- [ ] Warten bis live; Live-Prüfung im Vorschau-Browser
- [ ] `KONZEPT.md` Abschnitt 8: Schritt 2 erledigt; Memory aktualisieren; Commit und Push (Privatkonto)
- [ ] Nicole bekommt: Link zur Galerie zum Durchsehen aller 110 Figuren und eine kurze iPhone-Checkliste

---

## Kostenschätzung

| Teil | Tokens (grob) |
|---|---|
| Task 1 Figur-Rechnung | 30.000 |
| Task 2 Übungen + Haltungen inkl. Sichtprüfung | 170.000 |
| Task 3 Ansagen | 10.000 |
| Task 4 Speicher | 30.000 |
| Task 5 Bibliothek + eigene Übungen | 90.000 |
| Task 6 Figur im Training | 25.000 |
| Task 7 Prüfungen und Übergabe | 90.000 |
| **Summe** | **ca. 450.000** |

Mehr als die 270.000 aus dem Konzept, weil 110 Figuren gezeichnet und einzeln angesehen werden.

---

## Anhang: Übungsliste (110)

Spalten: Id · Name · Zweitname · Tags · beidseitig (B) · Typ · Hilfsmittel

**Atmung & Vacuum (10)**
| Id | Name | Zweitname | Tags | B | Typ | Hilfsmittel |
|---|---|---|---|---|---|---|
| vacuum-stehend | Stomach Vacuum stehend | Bauch-Vakuum | vacuum, core | | zeit | |
| vacuum-vierfuessler | Stomach Vacuum Vierfüßler | Vakuum kniend | vacuum, core | | zeit | matte |
| vacuum-liegend | Stomach Vacuum liegend | Vakuum Rückenlage | vacuum, core | | zeit | matte |
| vacuum-sitzend | Stomach Vacuum sitzend | Vakuum Sitz | vacuum, core | | zeit | stuhl |
| transversus | Bauchnabel nach innen | Drawing-in | vacuum, core | | zeit | matte |
| bauchatmung | Bauchatmung | Zwerchfellatmung | atmung | | atem | |
| box-atmung | Box-Atmung | 4-4-4-4 | atmung | | atem | |
| atmung-478 | 4-7-8-Atmung | Einschlaf-Atmung | atmung | | atem | |
| wechselatmung | Wechselatmung | Nadi Shodhana | atmung, yoga | | atem | |
| lange-ausatmung | Lange Ausatmung | Entspannungsatmung | atmung | | atem | |

**Core & Taille (17)**
| Id | Name | Zweitname | Tags | B | Typ | Hilfsmittel |
|---|---|---|---|---|---|---|
| plank | Plank | Unterarmstütz | core | | zeit | matte |
| high-plank | Hoher Stütz | High Plank | core, oberkoerper | | zeit | matte |
| seitstuetz | Seitstütz | Side Plank | core | B | zeit | matte |
| seitstuetz-hueftheben | Seitstütz mit Hüftheben | Side Plank Dips | core | B | zeit | matte |
| dead-bug | Dead Bug | Toter Käfer | core, bauch | | zeit | matte |
| bird-dog | Bird Dog | Vierfüßler diagonal | core, ruecken | | zeit | matte |
| hollow-hold | Hollow Body Hold | Schiffchen | core, bauch | | zeit | matte |
| hollow-rocks | Hollow Rocks | Schaukeln | core, bauch | | zeit | matte |
| plank-shoulder-taps | Plank Schulter-Tippen | Shoulder Taps | core | | zeit | matte |
| plank-hip-dips | Plank Hüftdrehung | Hip Dips | core | | zeit | matte |
| baerenstand | Bärenstand | Bear Hold | core | | zeit | matte |
| mountain-climbers | Mountain Climbers | Bergsteiger | core, ganzkoerper | | zeit | matte |
| plank-jacks | Plank Jacks | Plank-Hampelmann | core, ganzkoerper | | zeit | matte |
| pallof-press | Pallof Press | Anti-Rotation | core | B | zeit | band |
| russian-twist | Russian Twist | Rumpfdrehung sitzend | core, bauch | | zeit | matte |
| spiderman-plank | Spiderman Plank | Knie zum Ellbogen | core | | zeit | matte |
| plank-rock | Plank vor und zurück | Body Saw | core | | zeit | matte |

**Bauch (13)**
| Id | Name | Zweitname | Tags | B | Typ | Hilfsmittel |
|---|---|---|---|---|---|---|
| crunch | Crunch | Bauchpresse | bauch | | zeit | matte |
| reverse-crunch | Reverse Crunch | Umgekehrter Crunch | bauch | | zeit | matte |
| fahrrad-crunch | Fahrrad-Crunch | Bicycle Crunch | bauch | | zeit | matte |
| beinheben | Beinheben liegend | Leg Raises | bauch | | zeit | matte |
| flutter-kicks | Flutter Kicks | Beinschlag | bauch | | zeit | matte |
| scherenschlag | Scherenschlag | Scissor Kicks | bauch | | zeit | matte |
| v-ups | V-Ups | Klappmesser | bauch | | zeit | matte |
| sit-up | Sit-up | Aufsitzen | bauch | | zeit | matte |
| heel-touches | Fersen-Tippen | Heel Touches | bauch | | zeit | matte |
| toe-touches | Crunch zu den Zehen | Toe Touches | bauch | | zeit | matte |
| scheibenwischer | Scheibenwischer | Windshield Wipers | bauch, core | | zeit | matte |
| seitlicher-crunch | Seitlicher Crunch | Oblique Crunch | bauch | B | zeit | matte |
| kreuz-crunch | Kreuz-Crunch | Cross-Body Crunch | bauch | | zeit | matte |

**Starker Rücken (12)**
| Id | Name | Zweitname | Tags | B | Typ | Hilfsmittel |
|---|---|---|---|---|---|---|
| superman | Superman | Rückenheben | ruecken | | zeit | matte |
| swimmer | Swimmer | Schwimmer | ruecken | | zeit | matte |
| ytw | Y-T-W | Schulterblatt-Heben | ruecken | | zeit | matte |
| snow-angels | Reverse Snow Angels | Rücken-Engel | ruecken | | zeit | matte |
| rueckenstrecker | Rückenstrecker | Back Extension | ruecken | | zeit | matte |
| prone-cobra | Prone Cobra | Kobra-Halten | ruecken | | zeit | matte |
| wall-angels | Wall Angels | Wand-Engel | ruecken | | zeit | wand |
| good-morning | Good Morning | Hüftbeuge stehend | ruecken, beine-po | | zeit | |
| band-rudern | Rudern mit Band | Band Row | ruecken, oberkoerper | | zeit | band |
| band-pull-apart | Band Pull-Apart | Band auseinanderziehen | ruecken | | zeit | band |
| tisch-rudern | Rudern unter dem Tisch | Inverted Row | ruecken, oberkoerper | | zeit | tisch |
| arm-bein-bauchlage | Arm und Bein gegengleich | Bauchlage diagonal | ruecken | | zeit | matte |

**Beine & Po (20)**
| Id | Name | Zweitname | Tags | B | Typ | Hilfsmittel |
|---|---|---|---|---|---|---|
| kniebeuge | Kniebeuge | Squat | beine-po | | zeit | |
| sumo-kniebeuge | Sumo-Kniebeuge | Sumo Squat | beine-po | | zeit | |
| ausfallschritt | Ausfallschritt vorwärts | Forward Lunge | beine-po | | zeit | |
| ausfallschritt-rueck | Ausfallschritt rückwärts | Reverse Lunge | beine-po | | zeit | |
| seitlicher-ausfallschritt | Seitlicher Ausfallschritt | Side Lunge | beine-po | | zeit | |
| bulgarian-split-squat | Bulgarian Split Squat | Ausfallschritt am Stuhl | beine-po | B | zeit | stuhl |
| glute-bridge | Glute Bridge | Beckenheben | beine-po, core | | zeit | matte |
| glute-bridge-einbeinig | Glute Bridge einbeinig | Single-Leg Bridge | beine-po | B | zeit | matte |
| hip-thrust | Hip Thrust | Beckenheben am Sofa | beine-po | | zeit | sofa |
| donkey-kicks | Donkey Kicks | Esel-Kick | beine-po | B | zeit | matte |
| fire-hydrants | Fire Hydrants | Hydrant | beine-po | B | zeit | matte |
| clamshells | Clamshells | Muschel | beine-po | B | zeit | matte |
| beinheben-seitlich | Seitliches Beinheben | Side Leg Raise | beine-po | B | zeit | matte |
| wandsitzen | Wandsitzen | Wall Sit | beine-po | | zeit | wand |
| wadenheben | Wadenheben | Calf Raises | beine-po | | zeit | |
| step-ups | Step-ups | Aufsteigen am Stuhl | beine-po | B | zeit | stuhl |
| frog-pumps | Frog Pumps | Frosch-Beckenheben | beine-po | | zeit | matte |
| curtsy-lunge | Curtsy Lunge | Knicks-Ausfallschritt | beine-po | | zeit | |
| sprung-kniebeuge | Sprung-Kniebeuge | Jump Squat | beine-po, ganzkoerper | | zeit | |
| kickback | Kickback gestreckt | Glute Kickback | beine-po | B | zeit | matte |

**Dehnen & Mobility (18)**
| Id | Name | Zweitname | Tags | B | Typ | Hilfsmittel |
|---|---|---|---|---|---|---|
| katze-kuh | Katze-Kuh | Cat-Cow | dehnen, ruecken, yoga | | zeit | matte |
| hueftbeuger-dehnung | Hüftbeuger-Dehnung | Kniender Ausfallschritt | dehnen | B | zeit | matte |
| taube | Taube | Pigeon Pose | dehnen, yoga | B | zeit | matte |
| kindhaltung | Kindhaltung | Child's Pose | dehnen, yoga | | zeit | matte |
| herabschauender-hund | Herabschauender Hund | Downward Dog | dehnen, yoga | | zeit | matte |
| hamstring-dehnung | Oberschenkel hinten dehnen | Hamstring Stretch | dehnen | B | zeit | matte |
| quad-dehnung | Oberschenkel vorne dehnen | Quad Stretch | dehnen | B | zeit | |
| schmetterling | Schmetterling | Butterfly | dehnen | | zeit | matte |
| figur-vier | Figur 4 liegend | Figure Four | dehnen | B | zeit | matte |
| open-book | Open Book | Brustwirbelsäule öffnen | dehnen, ruecken | B | zeit | matte |
| nacken-dehnung | Nacken seitlich dehnen | Neck Stretch | dehnen | B | zeit | |
| schulterkreisen | Schulterkreisen | Shoulder Rolls | dehnen, aufwaermen | | zeit | |
| armkreisen | Armkreisen | Arm Circles | dehnen, aufwaermen | | zeit | |
| hueftkreisen | Hüftkreisen | Hip Circles | dehnen, aufwaermen | | zeit | |
| liegender-twist | Liegender Twist | Supine Twist | dehnen, ruecken | B | zeit | matte |
| worlds-greatest | World's Greatest Stretch | Weltbeste Dehnung | dehnen, aufwaermen | B | zeit | matte |
| huefte-90-90 | 90/90 Hüfte | Hip 90/90 | dehnen | B | zeit | matte |
| seitdehnung | Seitliche Rumpfdehnung | Side Bend | dehnen | B | zeit | |

**Yoga (10)**
| Id | Name | Zweitname | Tags | B | Typ | Hilfsmittel |
|---|---|---|---|---|---|---|
| sonnengruss | Sonnengruß | Sun Salutation | yoga, aufwaermen | | zeit | matte |
| krieger-1 | Krieger I | Warrior I | yoga | B | zeit | matte |
| krieger-2 | Krieger II | Warrior II | yoga | B | zeit | matte |
| baum | Baum | Tree Pose | yoga | B | zeit | |
| dreieck | Dreieck | Triangle | yoga, dehnen | B | zeit | matte |
| stuhl | Stuhl | Chair Pose | yoga, beine-po | | zeit | |
| kobra | Kobra | Cobra | yoga, ruecken | | zeit | matte |
| heuschrecke | Heuschrecke | Locust | yoga, ruecken | | zeit | matte |
| happy-baby | Happy Baby | Glückliches Baby | yoga, dehnen | | zeit | matte |
| totenstellung | Totenstellung | Savasana | yoga, atmung | | zeit | matte |

**Ganzkörper & Oberkörper (10)**
| Id | Name | Zweitname | Tags | B | Typ | Hilfsmittel |
|---|---|---|---|---|---|---|
| hampelmann | Hampelmann | Jumping Jacks | ganzkoerper, aufwaermen | | zeit | |
| laufen-stelle | Auf der Stelle laufen | Running in Place | ganzkoerper, aufwaermen | | zeit | |
| kniehebelauf | Kniehebelauf | High Knees | ganzkoerper, aufwaermen | | zeit | |
| burpees | Burpees | Hock-Streck-Sprung | ganzkoerper | | zeit | matte |
| squat-jacks | Squat Jacks | Hampelmann-Kniebeuge | ganzkoerper, beine-po | | zeit | |
| inchworm | Inchworm | Raupe | ganzkoerper, dehnen | | zeit | matte |
| liegestuetz | Liegestütz | Push-up | oberkoerper | | zeit | matte |
| knie-liegestuetz | Knie-Liegestütz | Knee Push-up | oberkoerper | | zeit | matte |
| stuhl-dips | Trizeps-Dips am Stuhl | Chair Dips | oberkoerper | | zeit | stuhl |
| pike-pushup | Pike Push-up | Schulter-Liegestütz | oberkoerper | | zeit | matte |

Summe: 10 + 17 + 13 + 12 + 20 + 18 + 10 + 10 = **110**. Den Tag `yoga` haben 15 Übungen (die 10 Yoga-Übungen plus Wechselatmung, Katze-Kuh, Taube, Kindhaltung, Herabschauender Hund).
