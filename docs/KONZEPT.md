# Homeworkout-Timer-App – Konzept und Umsetzungsplan

Name: **Takt** – "Dein Training, dein Takt" · Repo `nicolehahn2890/takt` (öffentlich) · Live: https://nicolehahn2890.github.io/takt/
Stand: 2026-10-22 · Ordner: `C:\Users\nicol\.claude\Projekt Homeworkout\`

---

## 1. Kontext – warum diese App

Nicole trainiert zu Hause (Vacuum, Core, Dehnen, Yoga, Beine/Po). YouTube-Videos und Abo-Apps (Gymondo & Co.) geben alles vor: Übung, Dauer, Reihenfolge, Musik. Man sieht immer dieselben Videos, kann nichts anpassen und braucht oft ein Abo.

Gewünscht ist eine App, in der man **eigene Trainings** aus Übung + Dauer zusammenstellt, eine große Uhr abläuft und die Übungen **angesagt** werden, während die **eigene Musik** nebenbei läuft. Dazu **fertige Vorlagen** zu Themen.

**Ehrliche Marktlage (recherchiert 2026-10-22):** Timer-Apps mit benannten Intervallen und Sprachansage gibt es (Seconds Pro ~8 €, Inter, Intervall Timer, Rep Repeat; neu auch KI-Timer wie TempoFit, EasyTimer AI). Die Lücke, die diese App füllt:
- frei, ohne Store, ohne Konto, auf jedem Gerät (Handy, Tablet, Laptop, TV-Spiegelung)
- deutsch gedacht, mit Übungs-Beschreibungen und Bildern für Leute, die Übungsnamen nicht kennen
- Abwechslung und Anpassung eingebaut (Mix-Modus, Zeit-Budget, lernende Dauer, Atem-Modus)

## 2. Ziele, Nicht-Ziele, Anti-Ziele

**Ziele (V1)**
- Eigenes Training in unter 2 Minuten zusammenklicken und sofort starten.
- Beim Training: Handy liegt auf der Matte, Bildschirm bleibt an, Übung wird angesagt, nächste Übung ist sichtbar, Bedienung mit einem Tipp.
- 6 Themen mit je 2 fertigen Vorlagen (kurz ~10 Min, lang ~20 Min).
- Übungsbibliothek (deutsch, ~100 Home-Übungen) mit Kurzbeschreibung, Bild wo vorhanden, eigene Übungen/Fotos/Video-Links möglich.
- Später ohne Umbau als Store-App verpackbar (Capacitor) und für andere nutzbar.

**Nicht-Ziele (V1)**
- Keine KI-Funktionen (kommen in V2, brauchen API-Key).
- Keine eigene Musik in der App. Musik läuft in Spotify/YouTube nebenbei.
- Keine Konten, kein Server, keine Cloud-Synchronisation.
- Keine Wiederholungs-Übungen ohne Timer ("12 Reps") – alles ist zeitbasiert.
- Kein Gewichts-/Satz-Tracking (das macht Peach).

**Anti-Ziele (was die App scheitern ließe)**
- Timer stottert, Ansage kommt zu spät oder gar nicht.
- Bildschirm geht während des Trainings aus.
- Man muss sich durch Menüs tippen, um loszulegen.
- Daten gehen verloren (Browser-Speicher gelöscht, kein Backup).

## 3. Ehrliche Einschränkungen (Web-App)

| Thema | Realität | Umgang |
|---|---|---|
| Musik + Ansage | Android senkt Musik bei Ansage automatisch ab (Ducking). iOS kann Musik bei Ansage kurz unterbrechen statt absenken; der Stummschalter schaltet Web-Audio-Töne stumm | Vor Schritt 1 ein Spike auf dem echten Handy (Sprache + Ton + Spotify + Stummschalter + Bildschirm an). Danach Entscheidung: Töne/Ansage wie geplant oder angepasst. Capacitor löst das später sauber |
| Musikquelle | YouTube im Handy-Browser stoppt beim App-Wechsel (ohne Premium) | Empfehlung in der App: Spotify-App (oder Laptop/Tablet) |
| App im Hintergrund | Wechselt man zur Spotify-App, pausiert iOS die Web-App oder lädt sie beim Zurückkehren neu | Laufzustand (Schritt, Startzeitstempel) wird laufend gespeichert und beim Zurückkehren nahtlos fortgesetzt; Hinweis "Musik vor dem Start einschalten, dann App vorne lassen"; Bildschirm bleibt per Wake Lock an |
| Speicher auf iPhone | Safari-Tab und installierte App haben getrennte Speicher; Safari kann Daten nach 7 Tagen ohne Nutzung löschen; Teil-Links öffnen immer in Safari | Installation auf dem Homescreen wird beim ersten Start empfohlen; Backup-Export prominent; Import auch per "Code einfügen", nicht nur per Link |
| Stimmqualität | Browser-Stimmen schwanken (iOS Siri gut, Android Google gut, Windows ok) | Stimme in Einstellungen wählbar, Testknopf |
| Übungsbilder | Freie Datenbank (free-exercise-db, Public Domain) ist englisch, überwiegend Studio-Kraft; Dehnen/Bodyweight teilweise, Vacuum/Yoga fehlen | Ich schreibe die deutsche Bibliothek selbst, verknüpfe passende Bilder (werden ins Repo kopiert, damit offline), Rest bekommt Icons; eigene Fotos jederzeit möglich |
| Trainingsinhalte | Ich bin kein Trainer | Vorlagen aus etablierten Standardübungen; Nicole prüft; Hinweis in der App "kein medizinischer Rat" (wichtig, sobald andere sie nutzen) |

### 3.1 Ergebnis iPhone-Test 1 (2026-10-22, iPhone mit iOS 18.7, Safari)

| Prüfpunkt | Ergebnis |
|---|---|
| Bildschirm bleibt an (Wake Lock) | klappt; wird beim App-Wechsel freigegeben und beim Zurückkommen automatisch neu gesetzt |
| Töne (Web Audio) im Modus "ambient" | Spotify läuft normal weiter |
| Töne/Ansage im Modus "auto" | Nicole notierte "Musik wird leiser"; nicht eindeutig, wird in Test 2 geprüft |
| Browser-Stimme (speechSynthesis) | nur "Anna" (2 Einträge mit gleichem Namen, Testseite konnte sie nicht unterscheiden); klingt roboterhaft; Aussprache von Umlauten korrekt |
| Browser-Stimme + Spotify | Spotify stoppt und startet nicht von selbst wieder (Hauptproblem) |
| Stummschalter auf Stumm | weder Töne noch Ansage hörbar |
| Timer nach App-Wechsel | Zeit stimmt; Hintergrund-Test war nur ca. 1 s lang, daher nicht aussagekräftig; wird in Test 2 wiederholt |
| Audio-Modi (navigator.audioSession) | werden unterstützt |
| Vibration | nicht verfügbar (iPhone) |

**Entscheidungen danach (Nicole, 2026-10-22):**
- Ansagen vorerst mit der Browser-Stimme (Roboterstimme). Fertige Sprachdateien mit natürlicher Stimme bleiben eine Option für später.
- Immer Modus "mit Musik": Die App mischt sich in die Musik, der Stummschalter muss auf Klingeln stehen. Die App erinnert vor jedem Start daran. Kein eigener "Ohne Musik"-Modus.
- Test 2 klärt: Gibt es einen Audio-Modus, bei dem die Browser-Stimme Spotify nicht stoppt? Zum Vergleich wird dieselbe Ansage als Datei abgespielt.

## 4. Produkt – Screens und Verhalten

### 4.1 Start
- Oben: Streak (Tage in Folge), Minuten diese Woche und die Abzeichen-Reihe (siehe 5.8).
- "Meine Workouts" (eigene + bearbeitete Vorlagen), je Karte: Name, Dauer, Thema-Farbe, Start-Knopf.
- "Vorlagen" nach Thema gruppiert.
- Großer Knopf **"Mix"** (Zufalls-Workout, siehe 5.4) und **"Neu"**.
- Vor jedem Start ein Mini-Dialog: **Zeit-Budget** (Schieber "Ich habe … Minuten") und **Intensität** (leicht/normal/hart). Standardwerte merken.

### 4.2 Workout-Editor
- Name, Thema (Farbe), Standard-Pause (z. B. 10 s), Standard-Dauer (z. B. 40 s).
- Liste aus **Blöcken**. Ein Block hat "Wiederholen: 1–10x" und eine Liste von Einträgen.
- Eintrag: Übung (aus Bibliothek oder frei getippt), Dauer, Pause danach (leer = Standard), Markierung "beidseitig".
- Reihenfolge per Pfeile hoch/runter (Drag & Drop ist auf dem Handy unzuverlässig, kommt evtl. V2).
- Gesamtdauer live oben.
- Vorlagen sind schreibgeschützt; "Bearbeiten" erstellt eine Kopie unter "Meine Workouts".

### 4.3 Übungsbibliothek
- Suche + Filter nach Tags (Core, Vacuum, Bauch, Rücken, Beine/Po, Dehnen, Yoga, Atmung, Ganzkörper).
- Übungs-Detail: Name, Beschreibung (2–4 Sätze), Hinweise, Bild/Icon, Video-Link, eigene Notiz, Markierungen beidseitig / Atem-Übung.
- Eigene Übung anlegen: Name, Beschreibung, Foto (wird auf max. 600 px verkleinert), Video-Link.

### 4.4 Training (der wichtigste Screen)
- Vollbild, Hintergrund in Thema-Farbe, Timer riesig (Minuten:Sekunden), ringförmiger Fortschritt.
- Übungsname groß, darunter Bild/Icon (abschaltbar) und Kurzbeschreibung klein.
- Leiste "Als Nächstes: …" mit Dauer.
- **Tipp-Zonen**: ganze Fläche tippen = Pause/Weiter. Links/rechts große Knöpfe: "Zurück", "Überspringen". Unten: "+15 s", "−15 s".
- Pausen zeigen Countdown und Vorschau der nächsten Übung mit Bild.
- Beidseitige Übungen: Zeit wird geteilt, Mitte: Ansage "Seite wechseln" + Ton.
- Atem-Übungen: statt Ring ein atmender Kreis mit "Einatmen / Halten / Ausatmen" und Sekunden, Rhythmus pro Übung einstellbar (z. B. 4-4-6).
- Ansagen: Übungsname beim Start, "noch 10 Sekunden", "3, 2, 1", "Pause", "Seite wechseln", "Geschafft". Umfang in Einstellungen wählbar (voll / nur Übungsname / nur Töne / still).
- Bildschirm bleibt an (Wake Lock). Querformat (Tablet/TV) nutzt zwei Spalten.

### 4.5 Fertig
- Dauer, Übungen, Anpassungen (z. B. "Plank 2x verlängert").
- Gefühl per Emoji (1 Tipp), optional Notiz.
- Lernende Dauer: Wurde eine Übung in 3 Trainings verlängert/verkürzt, Frage: "Plank standardmäßig auf 60 s setzen?" (Ja/Nein).
- Knöpfe: "Nochmal", "Teilen" (Link), "Zur Startseite".

### 4.6 Einstellungen
- Stimme: Stimme aus Liste (deutsche Stimmen des Geräts), Testknopf, Ansage-Umfang.
- Töne an/aus, Vibration an/aus (Android).
- Standard-Dauer/-Pause für neue Einträge.
- Backup: Export (JSON-Datei) / Import.
- Über die App, Hinweis "kein medizinischer Rat".

## 5. Funktionen V1 im Detail

### 5.1 Pflicht-Basics
- Timer auf Zeitstempel-Basis (nicht Sekunden hochzählen), damit nichts driftet. Laufzustand wird jede Sekunde gespeichert; nach Reload oder App-Wechsel läuft das Training an der richtigen Stelle weiter.
- Wake Lock API; wird er verweigert (z. B. Stromsparmodus) oder fehlt er, Hinweis "Bildschirmsperre ausschalten / Stromsparmodus aus".
- Töne über Web Audio (keine Sounddateien nötig). Der Countdown "3, 2, 1" läuft als Töne, nicht als Sprache (Sprachausgabe startet mit Verzögerung). Vor zeitkritischen Ansagen wird die Sprach-Warteschlange geleert.
- Ansagen über Browser-Sprachausgabe (speechSynthesis). Erste Ansage wird durch den Start-Tipp freigeschaltet (iOS-Regel). Stimmenliste: `getVoices()` sofort abfragen und zusätzlich auf `voiceschanged` hören (iOS feuert das Event oft nicht).
- Offline-fähig und installierbar (PWA: manifest + Service Worker).
- Export/Import als JSON.

### 5.2 Vorschau + sanfter Übergang
Nächste Übung immer sichtbar; bei 10 s "noch 10 Sekunden", bei 3 s Countdown; in der Pause Bild der nächsten Übung.

### 5.3 Zeit-Budget
Vor dem Start: Schieber. Alle Dauern und Pausen werden anteilig skaliert (auf 5 s gerundet, Minimum 10 s pro Übung). Blöcke werden nicht gestrichen – nur gekürzt. Ist das Budget kleiner als Übungen × 10 s, fallen Wiederholungen von Blöcken weg (letzte zuerst).

### 5.4 Mix-Modus
Dialog: Themen wählen (Mehrfach), Anzahl Übungen, Dauer je Übung, Pause, Runden. App zieht zufällig aus der Bibliothek (keine Übung doppelt, beidseitige berücksichtigt). Ergebnis kann gespeichert werden.

### 5.5 Lernende Dauer
Jede +15/−15-Änderung wird mit Übung + Workout protokolliert. Nach 3 gleichgerichteten Änderungen derselben Übung Vorschlag im Fertig-Screen. Antwort "Nein" stellt die Frage für diese Übung für 10 Trainings zurück.

### 5.6 Seitenwechsel
Übung "beidseitig" → Dauer halbiert pro Seite, Ansage und Ton in der Mitte, Anzeige "Links" / "Rechts".

### 5.7 Teilen per Link
Workout als JSON → gzip (CompressionStream) → base64url → `index.html#w=…`. Empfänger öffnet den Link, sieht Vorschau, "Speichern". Weil Links auf dem iPhone in Safari statt in der installierten App öffnen, gibt es zusätzlich "Code kopieren / Code einfügen" (derselbe Text ohne URL). Fremde Übungen (nicht in Bibliothek) kommen als Inline-Übungen mit, Fotos werden nicht mitgeschickt.

### 5.8 Tagebuch light
Trainingsprotokoll (Datum, Workout, Dauer, Gefühl). Startseite zeigt Streak und Wochenminuten. Liste der letzten 30 Trainings in den Einstellungen.

**Abzeichen (wie Apple Health, Wunsch von Nicole 2026-10-22):** kleine Erfolge, die man sammelt und die sich aus dem Protokoll ergeben, z. B. "Erstes Training", "3 Tage in Folge", "7 Tage in Folge", "10 Trainings", "100 Minuten", "Frühaufsteherin" (Training vor 8 Uhr), "Nachteule" (nach 21 Uhr), "Alle 6 Themen ausprobiert", "Eigenes Workout gebaut", "Mix-Meisterin" (5 Mix-Workouts), "Atemprofi" (10 Atem-Übungen). Anzeige: Reihe runder Abzeichen auf der Startseite im Peach-Stil (grau = noch gesperrt, farbig = erreicht), Detailansicht mit Datum. Neues Abzeichen wird im Fertig-Screen mit kleiner Feier-Animation gezeigt. Regeln liegen als Liste in `data/badges.js`, damit neue Abzeichen nur Inhalt sind.

### 5.9 Intensitäts-Regler
leicht: Arbeit ×0,8, Pause ×1,5 · normal: ×1/×1 · hart: Arbeit ×1,2, Pause ×0,6. Reihenfolge: erst Intensität, dann Zeit-Budget. Das Budget ist eine harte Obergrenze: "15 Minuten" ergibt nie mehr als 15 Minuten.

### 5.10 Stimme wählbar
V1: Auswahl unter den deutschen Stimmen des Geräts, Testknopf, Ansage-Umfang (voll / nur Übungsname / nur Töne / still). Ansagetexte liegen in `data/strings.js`, EN/ES-Spalten vorbereitet, Aktivierung in V2 mit übersetzten Übungsnamen. Übungsnamen werden so angesagt, wie sie in der Bibliothek stehen, bei eigener Übung wie getippt.

## 6. Inhalte

### 6.1 Übungsbibliothek (ca. 100 Übungen, deutsch)
Felder: `id, name, alias[], beschreibung, hinweis, tags[], beidseitig, typ ('zeit'|'atem'), atem {ein, halten, aus, haltenLeer}, bild (Pfad im Repo oder null), icon, quelle`.
Verteilung (Richtwert): Vacuum/Atmung 10, Core/Taille 20, Bauch 15, Rücken (stark) 15, Beine/Po 20, Dehnen/Mobility 20, Yoga 10. Bilder: passende Übungen aus free-exercise-db (Public Domain, Unlicense) ins Repo kopieren (`assets/ex/…jpg`, verkleinert auf 600 px); für den Rest ein neutrales Linien-Icon je Tag.

### 6.2 Vorlagen (12)
Je Thema kurz (~10 Min) und lang (~20 Min): Vacuum/Core/Taille, Sixpack/Bauch, Dehnen/Mobility/Rücken, Yoga/Atmung, Beine/Po, Starker Rücken. Jede Vorlage: Aufwärmen (2–3 Übungen), Hauptteil als Block mit Wiederholung, Abschluss (Dehnen/Atmung). Nicole prüft die Vorlagen vor Veröffentlichung.

## 7. Technik

**Grundsatz:** Kein Framework, kein Build-Schritt, wie Peach – aber mehrere Dateien, damit Inhalte und Logik getrennt bleiben (Voraussetzung für Capacitor und für andere Nutzer).

```
Projekt Homeworkout/
  index.html          Oberfläche (Screens als <section>, ein Script-Einstieg)
  css/app.css         Peach-Design-Tokens, Layout, Querformat
  js/app.js           Router, Screens, Rendering (reines DOM, keine Lib)
  js/timer.js         Ablauf-Engine: baut aus Workout + Budget + Intensität die Schrittliste, läuft auf Zeitstempeln, feuert Events (start, tick, warn10, countdown, rest, side, done)
  js/voice.js         speechSynthesis + Web-Audio-Töne, Sprachtexte DE/EN/ES
  js/store.js         localStorage (Workouts, Settings, Log, Anpassungen), IndexedDB nur für Fotos, Export/Import
  js/share.js         Link-Kodierung/Dekodierung
  js/mix.js           Mix-Modus, Zeit-Budget, Intensität (reine Funktionen, testbar)
  data/exercises.js   Bibliothek (als JS mit globaler Variable, damit die App auch per Doppelklick auf index.html und in Capacitor ohne Server läuft)
  data/templates.js   Vorlagen (ebenso)
  data/strings.js     Ansagetexte und Oberflächentexte DE (EN/ES vorbereitet)
  data/badges.js      Abzeichen-Regeln (Name, Bedingung, Icon)
  assets/ex/*.jpg     Übungsbilder (Public Domain)
  assets/icons/*.svg  Tag-Icons
  assets/app-icon-180.png, -192.png, -512.png   App-Icons als PNG (iOS ignoriert SVG-Icons); einmalig per Script aus dem SVG erzeugt
  assets/fonts/DMSans*.woff2   Schrift im Repo (OFL-Lizenz), damit die App offline gleich aussieht
  manifest.webmanifest, sw.js   PWA; Service-Worker-Scope und IndexedDB-Name eindeutig (gleiche Origin wie Peach auf github.io)
  docs/KONZEPT.md     dieses Dokument
```

**Datenmodell (localStorage-Key `takt_v1`, nie umbenennen):**
```
{ workouts: [ { id, name, theme, defaultWork, defaultRest, blocks: [ { repeat, items: [ { exId|null, name, duration, rest|null, bilateral } ] } ], source: 'own'|'template'|'shared', createdAt, updatedAt } ],
  exercisesOwn: [ …wie Bibliothek, plus photoId ],
  settings: { lang, voiceName, announce: 'full'|'name'|'beeps'|'silent', sounds, vibrate, defaultWork, defaultRest, intensity, budgetLast, showImages },
  log: [ { id, workoutId, name, date, plannedSec, actualSec, feeling, adjustments: [ {exId, delta} ] } ],
  learn: { [exId]: { plus: n, minus: n, snoozeUntilLog: n } } }
```

**Browser-APIs:** speechSynthesis (`getVoices()` + `voiceschanged`), Web Audio (Oszillator-Beeps), Screen Wake Lock (bei `visibilitychange` erneut anfordern, Fehler abfangen), CompressionStream (Safari ab 16.4; Fallback: nur base64), IndexedDB (Fotos als Blob), Service Worker (Cache-first für App-Dateien, Bilder nachladen). Kein `fetch` auf lokale Dateien, Daten kommen als JS.

**Design:** Peach-Tokens übernehmen: Hintergrund `#1a1418`, Header-Gradient `160deg #2e1a28→#1a1418`, Pink `#C8729A`, Lila `#B88CC0`, Font DM Sans, Pixel-Art-Logo (Pfirsich mit Stoppuhr). Thema-Farben: Vacuum/Core `#C0BEA0`, Bauch `#C8729A`, Dehnen `#A8C4A0`, Yoga `#B88CC0`, Beine/Po `#C4A882`, Rücken `#8AB4C4`. Regeln aus Peach übernehmen: kein `°`-Zeichen in JS-Strings, Sonderzeichen meiden.

**Deployment:** Neues öffentliches Repo `nicolehahn2890/takt` (Privatkonto, wie Peach), GitHub Pages von `main`, Live-URL https://nicolehahn2890.github.io/takt/. Repo und Pages werden schon in Schritt 1 angelegt, damit ab dann auf dem iPhone über HTTPS getestet wird (Wake Lock und Service Worker brauchen HTTPS). Commit + Push nach jedem funktionierenden Schritt, vorher prüfen: keine Keys im Commit.

## 8. Umsetzungsschritte (einzeln abstimmen)

| Schritt | Inhalt | Ergebnis zum Prüfen | Tokens (grob) |
|---|---|---|---|
| 0a | Mockup des Training-Screens (statisches HTML, 2 Varianten) im Browser zeigen | Nicole wählt Richtung | ~40k |
| 0b | Spike auf Nicoles iPhone (Pflicht, Hauptgerät): Mini-Seite mit Sprachansage, Ton, Bildschirm-an, Spotify nebenbei, Stummschalter, App-Wechsel | Klarheit, was auf dem iPhone wirklich geht; Ergebnis fließt in Schritt 1 | ~30k |
| 1 | Repo `takt` + GitHub Pages anlegen; Grundgerüst, Design-Tokens, Datenmodell, Timer-Engine, Voice, Training-Screen mit einem Test-Workout | Timer läuft auf dem iPhone über die Live-URL, spricht, bleibt an | ~200k |
| 2 | Bibliothek (100 Übungen, Bilder), Übungs-Screens, eigene Übungen mit Foto/Video | Übungen durchsuchbar, eigene anlegen | ~250k |
| 3 | Workout-Editor, Start-Screen, 12 Vorlagen, Zeit-Budget, Intensität, Mix-Modus | Eigenes Workout bauen und starten | ~250k |
| 4 | Atem-Modus, Seitenwechsel, +15/−15, lernende Dauer, Fertig-Screen, Tagebuch + Abzeichen, Teilen, Export/Import | Alle Extras nutzbar | ~220k |
| 5 | PWA (Manifest, Service Worker, Icons), Querformat, Feinschliff, Installations-Hinweis beim ersten Start, Abschlusstest auf dem iPhone | Installierbar, offline, auf dem Homescreen | ~120k |

Summe grob 1,0–1,2 Mio. Tokens über alle Schritte, verteilt auf mehrere Sitzungen. Jeder Schritt endet mit Test und Push.

## 9. Verifikation

- Pro Schritt: `node --check` auf alle JS-Dateien; Agent `html-app-tester` (statische Prüfung); Vorschau im eingebauten Browser (`python -m http.server` im Projektordner, Handy-Viewport emuliert). Auf dem iPhone immer über die Live-URL (HTTPS), nie über die lokale IP.
- Timer-Logik (Schrittliste, Budget, Intensität, Mix) als reine Funktionen mit einer kleinen Testseite `test.html`, die Fälle durchrechnet und grün/rot zeigt.
- Auf dem iPhone (Nicole): Sprachansage, Wake Lock, Installation auf Homescreen, Spotify nebenbei, App-Wechsel und Zurückkehren, Link/Code-Teilen (z. B. an den Laptop).
- Ende: Vorlagen inhaltlich von Nicole abgenommen.

## 10. Offene Entscheidungen und meine Festlegungen

**Entschieden (Nicole, 2026-10-22):** Name **Takt**, Repo `takt` öffentlich, Hauptgerät iPhone, Workouts werden am selben iPhone gebaut und trainiert (kein Geräte-Transport nötig, Teilen/Export bleibt in Schritt 4).

**Training-Screen (Schritt 0a, entschieden 2026-10-22):** Variante **A · Ring** – großer Ring mit Zeit in der Mitte, darunter kleines Bild, Übungsname und Kurzbeschreibung, Leiste "Als Nächstes". Steuerung wie im Mockup: Zurück, −15, Pause (groß, Thema-Farbe), +15, Weiter; Tipp auf die Mitte = Pause/Weiter. Vorlage: `mockups/training-a.html`.

**Offen (niedrig, wird zu Beginn von Schritt 2 gefragt):** Gibt es konkrete Routinen oder Videos als Vorlage für Bibliothek und Vorlagen? Sonst Standardübungen.

**Meine Festlegungen (änderbar):**
- Mehrere Dateien statt einer HTML-Datei (wegen Capacitor, Bibliothek, Wartbarkeit).
- Reihenfolge im Editor per Pfeile, kein Drag & Drop in V1.
- Fotos auf 600 px verkleinert in IndexedDB; Fotos werden beim Link-Teilen nicht mitgeschickt.
- Alles zeitbasiert, keine Wiederholungs-Übungen.
- Vorlagen schreibgeschützt, Bearbeiten erzeugt Kopie.
- Nur Dunkelmodus in V1 (Peach-Stil).
- Stimme wählbar (Extra 10) in V1 = Auswahl unter den deutschen Stimmen des Geräts + Ansage-Umfang. Englisch/Spanisch als Ansagesprache kommt in V2 zusammen mit übersetzten Übungsnamen (eine englische Stimme, die "Beckenheben" vorliest, klingt schlecht). Die Texte sind in V1 schon so abgelegt, dass das nur Inhalt ist, kein Umbau.
- Zeit-Budget ist eine harte Obergrenze; Intensität wird davor angewendet.
- Countdown "3, 2, 1" als Töne, nicht als Sprache.

## 11. Version 2 (Ideen, nicht geplant)
- KI: Workout aus einem Satz erzeugen; Übungsname aus Beschreibung/Foto finden (Anthropic API, kleiner Server oder Cloudflare Worker für den Key).
- Capacitor-Verpackung für App Store / Play Store (löst Hintergrund- und Musik-Einschränkungen).
- Drag & Drop im Editor, Hellmodus, Apple Watch (nur nativ).
- Eigene Vorlagen veröffentlichen/teilen über eine Galerie.
