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
| Musik + Ansage | Auf dem iPhone getestet (3.1, 3.2): Browser-Stimme stoppt Spotify; Töne und Sprachdateien über Web Audio mischen sich mit Spotify, ohne es leiser zu machen; Stummschalter auf Stumm macht alles still | Ansagen als Sprachdateien über Web Audio im Modus ambient; vor jedem Start Hinweis "Schalter auf Klingeln"; Absenken der Musik erst mit Capacitor |
| Musikquelle | YouTube im Handy-Browser stoppt beim App-Wechsel (ohne Premium) | Empfehlung in der App: Spotify-App (oder Laptop/Tablet) |
| App im Hintergrund | Wechselt man zur Spotify-App, pausiert iOS die Web-App oder lädt sie beim Zurückkehren neu | Laufzustand (Schritt, Startzeitstempel) wird laufend gespeichert und beim Zurückkehren nahtlos fortgesetzt; Hinweis "Musik vor dem Start einschalten, dann App vorne lassen"; Bildschirm bleibt per Wake Lock an |
| Speicher auf iPhone | Safari-Tab und installierte App haben getrennte Speicher; Safari kann Daten nach 7 Tagen ohne Nutzung löschen; Teil-Links öffnen immer in Safari | Installation auf dem Homescreen wird beim ersten Start empfohlen; Backup-Export prominent; Import auch per "Code einfügen", nicht nur per Link |
| Stimmqualität | Safari bietet auf dem iPhone nur einfache, roboterhafte Anna-Stimmen | Natürliche Stimme als vorab erzeugte Dateien (edge-tts); Lizenz vor Veröffentlichung prüfen |
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

### 3.2 Ergebnis iPhone-Test 2 (2026-10-22, gleiches iPhone)

| Prüfpunkt | Ergebnis |
|---|---|
| Verfügbare Stimmen in Safari | nur `com.apple.voice.compact.de-DE.Anna` und `...super-compact...Anna`, beide klingen gleich roboterhaft; eine in den iPhone-Einstellungen geladene bessere Stimme erscheint in Safari nicht |
| Browser-Stimme + Spotify | Spotify stoppt in allen vier Modi (auto, ambient, transient, transient-solo) und startet nicht von selbst wieder |
| Ansage als Datei (Web Audio) + Spotify | Spotify läuft in allen drei Modi (auto, ambient, transient) normal weiter, wird aber nicht leiser |
| App-Wechsel zu Spotify | Seite lief weiter (längste Timer-Pause 2 s), Töne kamen auch im Hintergrund, kein Neuladen; insgesamt 14 s im Hintergrund gemessen |
| "Restzeit war falsch" (Nicoles Beobachtung) | Ursache nicht gefunden. Laut Messung kein Neustart, kein Neuladen, Seite lief durchgehend, Restzeit wird aus der echten Uhrzeit berechnet; im Vorschau-Browser stimmt sie sekundengenau. Wahrscheinlichste Erklärung: Die gefühlte Zeit in Spotify (bis 30 gezählt) war länger als die gemessenen 14 bis 18 s. In Schritt 1 nicht mehr aufgetreten, Uhrzeit-Zeile und Restzeit stimmten (siehe 3.3) |

**Entscheidungen nach Test 2 (Nicole, 2026-10-22), ersetzen die Stimmen-Entscheidung aus 3.1:**
- Ansagen kommen als fertige Sprachdateien mit natürlicher Stimme **Katja** (`de-DE-KatjaNeural`, erzeugt mit dem Python-Werkzeug edge-tts 7.3.1). Die Browser-Stimme wird nicht genutzt, weil sie Spotify stoppt.
- Lizenz-Hinweis: Für Nicoles private Nutzung unkritisch. Vor einer Veröffentlichung für andere muss die Nutzung der Stimme geprüft werden (Alternativen: freie Piper-Stimmen oder ein bezahlter Sprachdienst).
- Selbst eingetippte Übungen: Ton + Name groß auf dem Bildschirm, keine Ansage des Namens.
- Beim Wechsel zu Spotify läuft das Training weiter.
- Spotify wird bei Ansagen nicht leiser (geht in der Web-App nicht). Erst die spätere Store-Version (Capacitor) kann Musik absenken.

### 3.3 Ergebnis iPhone-Test Schritt 1 (2026-10-22, App live, Version v=2)

| Prüfpunkt | Ergebnis |
|---|---|
| Spotify bei Ansagen (Sprachdateien, Modus ambient) | Musik läuft weiter |
| Stimme Katja | gut verständlich, keine abgeschnittenen Wortanfänge gemeldet |
| Bildschirm bleibt an | ja |
| Wechsel zur Spotify-App und zurück | funktioniert, Uhrzeit-Zeile und Restzeit laufen richtig weiter |
| Neuladen mitten im Training | Training läuft an der richtigen Stelle weiter, nach Tipp aufs Banner kommt der Ton zurück |
| Handy sperren und entsperren | während der Sperre ist das Training unterbrochen (iOS hält Web-Apps an, Grenze von Safari); danach erscheint das Banner, nach dem Tipp funktioniert der Ton wieder |

Folgerung: Der Ansage-Weg über Sprachdateien ist bestätigt. Ansagen bei gesperrtem Handy gehen erst mit der Store-Version (Capacitor, Hintergrund-Audio).

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
- Ansagen (Sprachdateien): Übungsname beim Start, "Noch zehn Sekunden", "Pause", "Als Nächstes …", "Seite wechseln", "Geschafft"; "3, 2, 1" als Töne. Selbst eingetippte Übungen: Ton statt Name, Name groß auf dem Bildschirm. Umfang in Einstellungen wählbar (voll / nur Übungsname / nur Töne / still).
- Bildschirm bleibt an (Wake Lock). Querformat (Tablet/TV) nutzt zwei Spalten.

### 4.5 Fertig
- Dauer, Übungen, Anpassungen (z. B. "Plank 2x verlängert").
- Gefühl per Emoji (1 Tipp), optional Notiz.
- Lernende Dauer: Wurde eine Übung in 3 Trainings verlängert/verkürzt, Frage: "Plank standardmäßig auf 60 s setzen?" (Ja/Nein).
- Knöpfe: "Nochmal", "Teilen" (Link), "Zur Startseite".

### 4.6 Einstellungen
- Ansagen: Ansage-Umfang, Testknopf. Die Stimme ist fest (vorab erzeugte Dateien).
- Töne an/aus, Vibration an/aus (Android).
- Standard-Dauer/-Pause für neue Einträge.
- Backup: Export (JSON-Datei) / Import.
- Über die App, Hinweis "kein medizinischer Rat".

## 5. Funktionen V1 im Detail

### 5.1 Pflicht-Basics
- Timer auf Zeitstempel-Basis (nicht Sekunden hochzählen), damit nichts driftet. Laufzustand wird jede Sekunde gespeichert; nach Reload oder App-Wechsel läuft das Training an der richtigen Stelle weiter.
- Wake Lock API; wird er verweigert (z. B. Stromsparmodus) oder fehlt er, Hinweis "Bildschirmsperre ausschalten / Stromsparmodus aus".
- Töne über Web Audio (keine Sounddateien nötig). Der Countdown "3, 2, 1" läuft als Töne, nicht als Sprache (Sprachausgabe startet mit Verzögerung). Vor zeitkritischen Ansagen wird die Sprach-Warteschlange geleert.
- Ansagen als vorab erzeugte MP3-Dateien, abgespielt über Web Audio mit `navigator.audioSession.type = 'ambient'` (mischt sich mit Spotify, getestet). Die Dateien eines Workouts werden vor dem Start geladen und dekodiert. Der Start-Tipp schaltet den Ton frei (iOS-Regel). Keine Browser-Sprachausgabe (stoppt Spotify).
- ~~Vor jedem Start Hinweis "Schalter auf Klingeln, Musik vorher starten".~~ Entfernt 2026-10-24 (v=43): Töne und Ansagen kommen laut Nicole inzwischen auch bei Stummschalter auf Stumm.
- Beim Wechsel zu Spotify läuft das Training weiter; Töne kamen im Test auch im Hintergrund.
- Test-Hilfe (abschaltbar): klein Startuhrzeit und vergangene Zeit anzeigen, damit Nicole die Restzeit mit der iPhone-Uhr vergleichen kann (offene Beobachtung aus Test 2).
- Offline-fähig und installierbar (PWA: manifest + Service Worker).
- Export/Import als JSON.

### 5.2 Vorschau + sanfter Übergang
Nächste Übung immer sichtbar; bei 10 s "noch 10 Sekunden", bei 3 s Countdown; in der Pause Bild der nächsten Übung.

### 5.3 Zeit-Budget
Vor dem Start: Schieber. Alle Dauern und Pausen werden anteilig skaliert (auf 5 s gerundet, Minimum 10 s pro Übung). Blöcke werden nicht gestrichen – nur gekürzt. Ist das Budget kleiner als Übungen × 10 s, fallen Wiederholungen von Blöcken weg (letzte zuerst).

### 5.4 Mix-Modus
Dialog: Themen wählen (Mehrfach), Anzahl Übungen, Dauer je Übung, Pause, Runden. App zieht zufällig aus der Bibliothek (keine Übung doppelt, beidseitige berücksichtigt). Ergebnis kann gespeichert werden.
Umgesetzt: Themen Core, Vacuum, Bauch, Beine & Po, Rücken, Dehnen, Yoga, Ganzkörper; Gesamtdauer 5/10/15/20/30 Min. Ein 5-Min.-Mix hat 1 Aufwärm-Übung (30 s), 4 im Hauptteil und 40 s Abschluss.

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

### 5.10 Ansagen und Stimme
Eine feste natürliche Stimme: **Katja** (`de-DE-KatjaNeural`, gewählt von Nicole am 2026-10-22 aus 3 Proben: Katja, Seraphina, Florian). Feste Sätze ("Noch zehn Sekunden", "Pause", "Als Nächstes", "Seite wechseln", "Links", "Rechts", "Geschafft", Begrüßung) und alle Übungsnamen der Bibliothek liegen als einzelne MP3-Dateien in `assets/voice/`. Erzeugt werden sie einmalig per Script `tools/make_voice.py` (edge-tts) aus `data/strings.js` und `data/exercises.js`; neue Bibliotheksübung = Script erneut laufen lassen. Selbst eingetippte Übungen haben keine Datei: Ton + Name groß. Einstellungen: Ansage-Umfang (voll / nur Übungsname / nur Töne / still). EN/ES später: dieselben Dateien in anderer Sprache erzeugen.

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
  js/voice.js         Web Audio: Töne + Sprachdateien laden, dekodieren, abspielen; Audio-Modus ambient
  js/store.js         localStorage (Workouts, Settings, Log, Anpassungen), IndexedDB nur für Fotos, Export/Import
  js/share.js         Link-Kodierung/Dekodierung
  js/mix.js           Mix-Modus, Zeit-Budget, Intensität (reine Funktionen, testbar)
  data/exercises.js   Bibliothek (als JS mit globaler Variable, damit die App auch per Doppelklick auf index.html und in Capacitor ohne Server läuft)
  data/templates.js   Vorlagen (ebenso)
  data/strings.js     Ansagetexte und Oberflächentexte DE (EN/ES vorbereitet)
  data/badges.js      Abzeichen-Regeln (Name, Bedingung, Icon)
  assets/voice/*.mp3  Sprachdateien (feste Sätze + Übungsnamen), natürliche Stimme
  tools/make_voice.py erzeugt die Sprachdateien mit edge-tts (läuft auf Nicoles PC, nicht in der App)
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

**Browser-APIs:** Web Audio (Oszillator-Töne und Sprachdateien), Audio Session (`navigator.audioSession.type = 'ambient'`), Screen Wake Lock (bei `visibilitychange` erneut anfordern, Fehler abfangen), CompressionStream (Safari ab 16.4; Fallback: nur base64), IndexedDB (Fotos als Blob), Service Worker (Cache-first für App-Dateien, Bilder nachladen). Kein `fetch` auf lokale Dateien, Daten kommen als JS.

**Design:** Peach-Tokens übernehmen: Hintergrund `#1a1418`, Header-Gradient `160deg #2e1a28→#1a1418`, Pink `#C8729A`, Lila `#B88CC0`, Font DM Sans, Pixel-Art-Logo (Pfirsich mit Stoppuhr). Thema-Farben: Vacuum/Core `#C0BEA0`, Bauch `#C8729A`, Dehnen `#A8C4A0`, Yoga `#B88CC0`, Beine/Po `#C4A882`, Rücken `#8AB4C4`. Regeln aus Peach übernehmen: kein `°`-Zeichen in JS-Strings, Sonderzeichen meiden.

**Deployment:** Neues öffentliches Repo `nicolehahn2890/takt` (Privatkonto, wie Peach), GitHub Pages von `main`, Live-URL https://nicolehahn2890.github.io/takt/. Repo und Pages werden schon in Schritt 1 angelegt, damit ab dann auf dem iPhone über HTTPS getestet wird (Wake Lock und Service Worker brauchen HTTPS). Commit + Push nach jedem funktionierenden Schritt, vorher prüfen: keine Keys im Commit.

## 8. Umsetzungsschritte (einzeln abstimmen)

| Schritt | Inhalt | Ergebnis zum Prüfen | Tokens (grob) |
|---|---|---|---|
| 0a | Mockup des Training-Screens (statisches HTML, 2 Varianten) im Browser zeigen | Erledigt: Variante A (Ring) | ~40k |
| 0b | Spike auf Nicoles iPhone (Pflicht, Hauptgerät): Mini-Seite mit Sprachansage, Ton, Bildschirm-an, Spotify nebenbei, Stummschalter, App-Wechsel | Erledigt: Test 1 und 2, Ergebnis in 3.1 und 3.2 | ~30k |
| 1 | Grundgerüst, Design-Tokens, Datenmodell, Timer-Engine, Sprachdateien für feste Sätze (gewählte Stimme), Training-Screen (Ring) mit einem Test-Workout, Test-Hilfe Uhrzeit (Repo + Pages gibt es schon) | Erledigt 2026-10-22 (live, 52 Tests grün, Code-Review ohne kritische Funde, iPhone-Test bestanden, siehe 3.3) | ~220k |
| 2 | Bibliothek (110 Übungen mit animierter Figur statt Bildern, Katja-Ansagen), Übungs-Screens, eigene Übungen mit Foto/Video | Erledigt 2026-10-22 (live, 81 Tests grün, zwei Prüfungen ohne kritische Funde). iPhone-Test durch Nicole steht aus | ~450k |
| 3 | Workout-Editor, Start-Screen, 12 Vorlagen, Zeit-Budget, Intensität, Mix-Modus | Erledigt 2026-10-23 (live v=15, 121 Tests grün, klickbarer Entwurf von Nicole abgenommen, zwei Prüfungen, wichtige Funde behoben). iPhone-Test durch Nicole steht aus | ~290k |
| 4 | Atem-Modus, Seitenwechsel, +15/−15, lernende Dauer, Fertig-Screen, Tagebuch + Abzeichen, Backup (Teilen per Link entfällt vorerst) | Erledigt 2026-10-24 (live v=41, 201 Tests grün, Prüfung ohne kritische Funde; Abzeichen auf Nicoles Wunsch mit Icons + Fortschritt, 22 Stück). iPhone-Test steht aus, siehe 8.6 | ~250k + ~70k Abzeichen v2 |
| 5 | PWA (Manifest, Service Worker, Icons), Querformat, Feinschliff, Installations-Hinweis beim ersten Start, Abschlusstest auf dem iPhone | Installierbar, offline, auf dem Homescreen | ~120k |

Summe grob 1,0–1,2 Mio. Tokens über alle Schritte, verteilt auf mehrere Sitzungen. Jeder Schritt endet mit Test und Push.

### 8.1 Offene Kleinigkeiten aus Schritt 1 (aus den Code-Reviews, bewusst zurückgestellt)

- Kein `apple-touch-icon` / Favicon, Google Fonts extern statt lokal, Test-Hilfe `debugClock` vor Veröffentlichung auf `false` → Schritt 5 (PWA).
- Bei jeder Änderung `?v=` in `index.html` hochzählen (iPhone-Cache); MP3s und Manifest haben keine Version.
- Schließen-Knopf 38 px und Start-Knopf ca. 42 px kleiner als 44 px Touch-Ziel; `safe-area-inset-left/right` im Querformat; `-webkit-text-size-adjust`.
- Wake Lock: Wettlauf, wenn `off()` während einer laufenden Anfrage kommt.
- Abbruch mit ✕ stoppt eine laufende Ansage nicht; vor dem Start werden 4 ungenutzte Sätze (go, side, left, right) mitgeladen.
- „Nochmal“ nach Wiederherstellung ohne Workout-Id wirkungslos; gespeicherter Trainingsstand wird beim Laden nicht auf sein Format geprüft (wichtig, sobald sich das Format in Schritt 2 bis 4 ändert).
- Banner „Einmal tippen“ nach Rückkehr kann einen Tipp verschlucken, wenn der Ton inzwischen von selbst wieder läuft; Töne können sich bei unterbrochenem Ton stauen.
- Stille-Beschnitt der Sprachdateien (Rand 0,03 s) könnte leise Wortanfänge kappen → beim iPhone-Test hören.
- Ring springt sekundenweise statt flüssig.
- Testlücken: `adjust` in der Pause, Wiederherstellen eines pausierten Stands, `prev` in der Vorbereitung, `load` mit falschen Datentypen.

### 8.2 Offene Kleinigkeiten aus Schritt 2 (bewusst zurückgestellt)

- Atem-Vorschau in der Bibliothek zeigt winzigen Text; Figur zeichnet 60× pro Sekunde neu, auch in der Pause (Akku); `prefers-reduced-motion` fehlt.
- Animations-Takt bleibt nach einem Fehler stehen; spät ankommendes Foto kann die aktuelle Figur überschreiben; Vorschau-Adressen werden nicht freigegeben.
- Fotospeicher: Fehler werden für die Sitzung „eingefroren“, englische Rohmeldung, kein Timeout.
- „Ansage anhören“ ohne Rückmeldung bei Stummschalter oder Ladefehler.
- Touch-Ziele der Filter und „+ Eigene“ unter 44 px; Klasse `.bar` kollidiert mit dem Fortschrittsbalken ab 25 Übungen (wichtig für Schritt 3).
- Eigene Übung: führendes „ · eigene“ in der Liste, Hochformat-Fotos werden beschnitten, fehlendes Foto zeigt leere Kachel, gleiche Datei erneut wählen wirkt nicht, Notiz bei sofortigem Zurück evtl. nicht gespeichert.
- Video-Feld ohne `autocapitalize/autocorrect=off`; Suchfeld schließt die Tastatur nicht.
- Bei einigen Übungen kippt ein fast gestrecktes Knie oder ein Ellbogen kurz die Richtung (z. B. Bird Dog, Kickback).
- Hinweis für Schritt 4/5: Safari löscht Daten und Fotos einer Website nach 7 Tagen ohne Nutzung; die Homescreen-App hat eigenen Speicher. Beim Import `exercisesOwn` durch `validateOwn` prüfen.
- Hinweis für Schritt 3: Beim Einfügen eigener Übungen in Workouts den Namen mitspeichern, damit nach dem Löschen nicht nur „Übung“ dasteht. (Erledigt in Schritt 3: Name wird gespeichert, angezeigt wird der aktuelle Bibliotheksname, der gespeicherte nur nach dem Löschen.)

### 8.3 Offene Kleinigkeiten aus Schritt 3 (bewusst zurückgestellt)

- „Nochmal“ tut nichts, wenn das Workout gelöscht wurde oder ein ungespeicherter Mix nach Neuladen fertig wurde; nach Neuladen startet „Nochmal“ ohne die Anpassung (volle Länge).
- Während „Lädt …“ (bis 2,5 s) kann ein zweiter Start über „Anpassen“ ausgelöst werden.
- „Diese Woche x Min.“ zählt Pausenzeit mit (Zeit seit Start). Klären, ob nur Trainingszeit zählen soll.
- Löschen eines Workouts setzt bei vollem Speicher nicht zurück.
- Die Dehnen-Vorlagen haben keinen Block-Namen und zeigen „Block 1“.
- Block-Namen lassen sich im Editor nicht ändern, obwohl der Knopf „+ Block (z. B. Abschluss)“ heißt.
- „Für neue Übungen“: Die Standard-Pause ändert auch bestehende Einträge, die keine eigene Pause haben.
- Touch-Ziele unter 44 px: „Anpassen“-Link (34 px), „Speichern“ im Editor-Kopf, Themen-Chips, ± Knöpfe (42 px).
- Mix für Dehnen oder Yoga beginnt mit sportlichen Aufwärm-Übungen (z. B. Hampelmann); Nicole fragen, ob das so bleiben soll.
- Anpassen: kleinstes Budget immer 5 Min. (bei langen Dehn-Vorlagen werden die Übungen dann sehr kurz).
- `validateWorkout`/`copyWorkout` kennen nur die Bibliothek, nicht eigene Übungen (heute egal, weil der Editor den Namen immer mitspeichert).
- Hintergrund scrollt auf iOS hinter offenen Fenstern mit; Escape schließt Fenster nicht.
- Editor lädt Fotos eigener Übungen bei jedem ± neu; Auswahl zeichnet bei jedem Buchstaben alle Figuren neu.
- Startseite springt nach Zurück aus Vorlage oder Editor nach oben.
- Training ohne Übungen (nur bei von Hand geänderten Daten) wird als „Geschafft“ gezählt; kaputter Eintrag in `workouts` würde die Startseite leeren.
- Budget unter Vorbereitung + 10 s kann überschritten werden (über die Oberfläche nicht erreichbar).
- Tote CSS-Klassen `.ic`, `.is-prep`; Ring-Balken `#t-bar` heißt noch `.bar`.

### 8.4 Design v2 (Teil A, 2026-10-23) – umgesetzt und bewusst zurückgestellt

Design aus Claude Design (`docs/design_handoff_takt_redesign/`) auf alle Screens angewendet (live v=22): neue Farben, Outfit + DM Sans, Figur-Logo und App-Symbol, Karten ohne Randstreifen, fixierte Kopfleisten, Geschafft mit Figur. Plan mit allen Entscheidungen: `docs/superpowers/plans/2026-10-23-design-v2.md`. Teil B (Leiste unten mit Home / Bibliothek / Statistik, Statistik-Screen) folgt nach Nicoles iPhone-Test.

Zurückgestellt:
- Unter 360 px Breite ragen die ± Knöpfe im Editor etwas aus ihrem Feld (kein aktuelles iPhone ist so schmal).
- `color-mix()` ohne Ersatzfarbe: auf Safari älter als 16.2 fehlen die getönten Figuren-Flächen und die Markierung in der Übungs-Auswahl.
- Der Hinweis „Vor dem Start“ steht jetzt fett ohne Doppelpunkt davor (wie im Design).
- Hinweis-Toasts erscheinen im Training über der Zeile „Als Nächstes“ (nur kurz).
- Langer Workout-Name im Training bricht neben dem ✕ um (aus der Design-Grundlage, Training war nicht Teil der Umgestaltung).

### 8.5 Teil B: Leiste unten und Statistik (2026-10-23) – umgesetzt und bewusst zurückgestellt

Leiste unten (Home, Bibliothek, Statistik), Statistik-Seite (Woche/Monat/Jahr, Ring als Vergleich mit gleich vielen Tagen der Vorperiode, Balken, häufigster Bereich), Trainingszeit ohne Pausieren (live v=30). iPhone-Korrekturen dabei: Überschriften 40 px unter den Glas-Bereich von iOS 26 (`--glass-top`), Kopfleisten nicht mehr fixiert, ausgegraute Hauptknöpfe gedämpft rosa. Plan mit allen Entscheidungen: `docs/superpowers/plans/2026-10-23-teil-b-leiste-statistik.md`.
iPhone-Test von Nicole am 2026-10-23 bestanden (Leiste, Statistik, Trainingszeit ohne Pausieren, Überschriften scharf).

Zurückgestellt:
- Umschalter Woche/Monat/Jahr für VoiceOver nicht als Auswahl ausgezeichnet.
- Vergleichstext nennt am 31. „(bis zum 31.)“, obwohl der kürzere Vormonat schon am 28./30. endet (gerechnet wird richtig).
- Bereich-Sekunden können wegen Rundung je Übung ein paar Sekunden über der Trainingszeit liegen (nach Minuten unsichtbar).
- Ein Training, das genau während des Updates lief, zählt die Zeit der Übungen vor dem Update nicht (einmalig).
- Ungenutzter Zurück-Knopf der Bibliothek im Code.
- Auf dem iPhone prüfen: Leiste unten beim Tippen in der Suche über der Tastatur.

### 8.6 Schritt 4 (2026-10-24) – umgesetzt und bewusst zurückgestellt

Seitenwechsel (Ton + „Seite wechseln. Rechts.“, „Links.“ nach dem Namen), Atem-Modus (atmender Kreis, sanfte Töne für Ein- und Ausatmen, kein 3-2-1), Fertig-Screen (trainierte Zeit, Anpassungen in Worten, Notiz, neue Abzeichen, Frage der lernenden Dauer), lernende Dauer (3× gleiche Richtung im selben Workout → Frage; Nein = 10 Trainings Ruhe; Vorlage → Kopie), Abzeichen (22, runde Plaketten mit Icon aus Tabler Icons, Fortschrittsring „4 von 10“, Raster in der Statistik), Tagebuch (letzte 30 Trainings mit Notiz) und Backup (Datei mit allem inkl. Fotos sichern und laden). Teilen per Link ist auf Nicoles Wunsch weggefallen (nur Backup). Gefühl-Abfrage weggelassen. Spec: `docs/superpowers/specs/2026-10-24-schritt-4-design.md`, Plan mit allen Entscheidungen: `docs/superpowers/plans/2026-10-24-schritt-4.md`. Abzeichen auch im Design System (`docs/design_handoff_takt_redesign/design-system/`, Baustein AchievementBadge, Vorschau `guidelines/achievement-badges.html`).

Behoben nach der Prüfung: „Backup sichern“ meldet nur noch echten Erfolg (Knopf erst aktiv, wenn die Fotos geladen sind; in der Home-Bildschirm-App ohne Teilen-Menü ehrlicher Hinweis statt Download).

Zurückgestellt (aus der Prüfung):
- Nach Rückkehr aus dem Hintergrund kann der Seitenwechsel die Ansage des Übungsnamens abschneiden (Bildschirm zeigt den Namen).
- Neuladen genau in der Sekunde des Seitenwechsels: „Seite wechseln“ kann ein zweites Mal kommen.
- „Ja“ bei der lernenden Dauer einer Vorlage feiert „Eigenes Workout gebaut“ erst beim nächsten Training.
- Volle Speicher (privater Modus): Lernfrage, Notiz und Backup-Zeitpunkt melden trotzdem Erfolg.
- Backup laden: scheitert das Speichern der Daten, liegen die Fotos aus der Datei schon im Fotospeicher (keine Daten verloren, Meldung ungenau).
- Ist der Fotospeicher blockiert, wird das Backup ohne Fotos gesichert, ohne Hinweis.
- Sehr kurze beidseitige Übung (10–11 s): Seitenwechsel-Ansage und 3-2-1-Töne liegen dicht beieinander.
- Atem-Ton nach 2 s kann bei langen Übungsnamen kurz in die Namensansage fallen.
- „10 Notizen“ erscheint erst beim Verlassen des Notizfelds; wer direkt auf „Zur Startseite“ tippt, dessen Tipp kann einmal ins Leere gehen (Abzeichen steht danach in der Statistik).
- „5 eigene Übungen“ trägt als Datum den Tag der Prüfung (eigene Übungen merken sich kein Anlegedatum).
- „Alle Vorlagen“ ist fest auf 12 eingestellt; kommen Vorlagen dazu, muss die Zahl in `data/badges.js` mit.
- Kleinkram im Code: doppelte Prüfung in `js/backup.js`, leeres Datum im Laden-Dialog bei kaputtem Zeitstempel, lernende Dauer zählt nach Laden eines älteren Backups etwas später neu.

Auf dem iPhone prüfen (Nicole):
- Atem-Übung mit Spotify: sind die Ein-/Aus-Töne gut hörbar, aber sanft?
- Beidseitige Übung: „Links.“ nach dem Namen, in der Mitte Ton + „Seite wechseln. Rechts.“
- Fertig-Screen: Notiz tippen, Abzeichen-Einblendung, Frage der lernenden Dauer (3× dieselbe Übung im selben Workout verlängern).
- Statistik: Abzeichen-Raster mit Icons und Ringen, Antippen, Tagebuch.
- **Backup sichern in der Home-Bildschirm-App:** öffnet sich das Teilen-Menü mit der Datei, lässt sie sich „In Dateien sichern“? Danach „Backup laden“ mit genau dieser Datei.

### 8.7 Nach dem ersten Benutzen (2026-10-24, v=42)

Wünsche von Nicole nach dem ersten Trainieren mit Schritt 4:
- **Abzeichen fallen kaum auf:** Neue Abzeichen werden jetzt im Vollbild gefeiert (große Plakette in der Gruppenfarbe, Lichtkranz, kurzer Funkenflug, sanfter Dreiklang, „Nächstes Ziel: …“). Nach dem Training kommt die Feier, sobald „Geschafft, super gemacht!“ ausgeklungen ist; mehrere nacheinander („1 von 2“). Im Fertig-Screen stehen sie danach in einer Karte, Antippen zeigt die Feier noch einmal. Editor, eigene Übung und Backup feiern genauso statt nur im Toast; bei „Speichern & Starten“ erst nach dem Training (oder beim Abbrechen). Ein Abzeichen durch die Notiz wird beim Verlassen des Notizfelds gefeiert, nicht mitten im Tippen.
- **Mix 5 Min.:** neue Stufe (1 Aufwärm-Übung, 4 Übungen, kurzer Abschluss; passt immer in 5 Min.).
- **Mix nur Vacuum:** eigenes Thema „Vacuum“ (nur Vacuum-Übungen). „Core“ enthält weiterhin auch Vacuum-Übungen.

- **Hinweis „Vor dem Start“ entfernt (v=43):** Töne und Ansagen kommen laut Nicoles iPhone-Test auch, wenn der Stummschalter auf Stumm steht.

Meine Festlegungen (Nicole kann widersprechen): Feier schließt nur über den Knopf (ein versehentlicher Tipp wischt sie nicht weg); Klang nur, wenn Töne an sind; ohne Animation bei „Bewegung reduzieren“.

## 9. Verifikation

- Pro Schritt: `node --check` auf alle JS-Dateien; Agent `html-app-tester` (statische Prüfung); Vorschau im eingebauten Browser (`python -m http.server` im Projektordner, Handy-Viewport emuliert). Auf dem iPhone immer über die Live-URL (HTTPS), nie über die lokale IP.
- Timer-Logik (Schrittliste, Budget, Intensität, Mix) als reine Funktionen, getestet mit `node tests/run.js` (eigener kleiner Test-Runner, prüft auch: kein Grad-Zeichen, in `js/` nur ASCII).
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
- Stimme (Extra 10) in V1 = eine feste natürliche Stimme als Sprachdateien + einstellbarer Ansage-Umfang (Entscheidung nach Test 2). Englisch/Spanisch kommt später, indem dieselben Dateien in anderer Sprache erzeugt werden.
- Zeit-Budget ist eine harte Obergrenze; Intensität wird davor angewendet.
- Countdown "3, 2, 1" als Töne, nicht als Sprache.

## 11. Version 2 (Ideen, nicht geplant)
- KI: Workout aus einem Satz erzeugen; Übungsname aus Beschreibung/Foto finden (Anthropic API, kleiner Server oder Cloudflare Worker für den Key).
- Capacitor-Verpackung für App Store / Play Store (löst Hintergrund- und Musik-Einschränkungen).
- Drag & Drop im Editor, Hellmodus, Apple Watch (nur nativ).
- Eigene Vorlagen veröffentlichen/teilen über eine Galerie.
