# Homeworkout-Timer-App – Konzept und Umsetzungsplan

Name: **Takt** – "Dein Training, dein Takt" · Repo `nicolehahn2890/takt` (öffentlich) · Live: https://nicolehahn2890.github.io/takt/
Stand: 2026-10-25 (live v=52) · Ordner: `C:\Users\nicol\.claude\Projekt Homeworkout\`

Dieses Dokument beschreibt den aktuellen Stand. Pläne und Specs unter `docs/superpowers/` sind Momentaufnahmen ihres Datums; weicht etwas ab, gilt dieses Dokument. Gestaltung: `docs/design_handoff_takt_redesign/design-system/DESIGN_GUIDE.md`.

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
| Musik + Ansage | Auf dem iPhone getestet (3.1, 3.2): Browser-Stimme stoppt Spotify; Töne und Sprachdateien über Web Audio mischen sich mit Spotify, ohne es leiser zu machen. Stummschalter auf Stumm: über den Lautsprecher ist alles still, mit Kopfhörern kommen Töne und Ansagen (iPhone-Test 2026-10-24). iOS-Regel für Töne, die sich mit anderer Musik mischen; ein Modus, der den Schalter übergeht, hält Spotify an | Ansagen als Sprachdateien über Web Audio im Modus ambient; ohne Kopfhörer muss der Schalter auf Klingeln stehen, die Startseite erinnert daran (seit v=46 wieder, siehe 8.7); den Schalter übergehen und Musik absenken geht erst mit Capacitor |
| Musikquelle | YouTube im Handy-Browser stoppt beim App-Wechsel (ohne Premium) | Spotify-App nutzen (oder Laptop/Tablet); in der App steht dazu kein Hinweis mehr (entfernt v=43) |
| App im Hintergrund | Wechselt man zur Spotify-App, pausiert iOS die Web-App oder lädt sie beim Zurückkehren neu | Laufzustand (Schritt, Startzeitstempel) wird laufend gespeichert und beim Zurückkehren nahtlos fortgesetzt; Bildschirm bleibt per Wake Lock an |
| Speicher auf iPhone | Safari-Tab und installierte App haben getrennte Speicher; Safari kann Daten nach 7 Tagen ohne Nutzung löschen; Teil-Links öffnen immer in Safari | Backup als Datei in der Statistik (Schritt 4); Installations-Hinweis beim ersten Start folgt in Schritt 5; Teilen per Link entfällt vorerst |
| Stimmqualität | Safari bietet auf dem iPhone nur einfache, roboterhafte Anna-Stimmen | Natürliche Stimme als vorab erzeugte Dateien (edge-tts); Lizenz vor Veröffentlichung prüfen |
| Übungsbilder | Freie Datenbank (free-exercise-db, Public Domain) ist englisch, überwiegend Studio-Kraft; Dehnen/Bodyweight teilweise, Vacuum/Yoga fehlen | Deutsche Bibliothek selbst geschrieben; statt Bildern hat jede Übung eine animierte Figur (`js/figure.js`), Atem-Übungen einen Atem-Kreis; eigene Fotos jederzeit möglich |
| Trainingsinhalte | Ich bin kein Trainer | Vorlagen aus etablierten Standardübungen; Nicole prüft; Hinweis in der App "kein medizinischer Rat" (noch offen, wichtig, sobald andere sie nutzen) |

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
- Immer Modus "mit Musik": Die App mischt sich in die Musik, der Stummschalter muss auf Klingeln stehen. Die App erinnert vor jedem Start daran. Kein eigener "Ohne Musik"-Modus. (Gilt weiter ohne Kopfhörer; mit Kopfhörern ist auch bei Stumm alles hörbar. Die Startseite erinnert daran.)
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

Stand v=52. Was noch fehlt oder bewusst wegfällt, ist markiert.

### 4.1 Home (Startseite)
- Kopf: Logo-Figur, „Takt“, „Dein Training, dein Takt“. Darunter Minuten und Anzahl Trainings dieser Woche.
- Kacheln **„Mix“** (Zufalls-Workout, siehe 5.4) und **„+ Neu“** (Editor).
- „Meine Workouts“ (eigene, kopierte Vorlagen, gespeicherte Mixe): Karte mit Name, Thema, Dauer, Anzahl Übungen, Figuren-Streifen, „Start“ und „Anpassen“. Antippen öffnet den Editor.
- „Vorlagen“ nach Thema, je „Kurz“ und „Lang“. Antippen öffnet die Vorschau mit „Start“, „Anpassen“ und „Bearbeiten (als Kopie)“.
- „Start“ startet sofort. **„Anpassen“** öffnet ein Fenster mit Zeit-Budget (Schieber) und Intensität (leicht/normal/hart); die letzten Werte werden je Workout gemerkt.
- Darunter der Hinweis „Vor dem Start: Ohne Kopfhörer: Schalter am iPhone auf Klingeln, sonst bleibt Takt stumm.“
- Unten die Leiste Home / Bibliothek / Statistik. Abzeichen stehen in der Statistik, nicht auf der Startseite. Eine eigene Anzeige der Serie (Tage in Folge) gibt es nicht; sie zeigt sich über die Abzeichen „3/7/14/30 Tage in Folge“ mit Fortschritt.

### 4.2 Workout-Editor
- Name, Thema (Farbe), Werte für neue Übungen: Dauer 40 s, Pause 15 s (mit ±).
- Liste aus **Blöcken** mit Runden 1–10 (z. B. Hauptteil 3×). Eintrag: Übung aus der Bibliothek (Auswahl mit Suche und Filtern, auch eigene Übungen), Dauer, Pause danach (leer = Standard; bei der letzten Übung steht „Ende“, danach gibt es keine Pause), beidseitig (immer aus der Bibliothek, auch wenn eine eigene Übung später geändert wird; Name und beidseitig werden in den Workouts nachgezogen).
- Reihenfolge per Pfeile hoch/runter (Drag & Drop ist auf dem Handy unzuverlässig, evtl. V2). Gesamtdauer oben.
- „Speichern“, „Speichern & Starten“, „Löschen“. Vorlagen sind schreibgeschützt; „Bearbeiten (als Kopie)“ legt eine Kopie unter „Meine Workouts“ an, „Zurück“ führt dann wieder in die Vorschau. Meldungen wie „Füge mindestens eine Übung hinzu.“ verschwinden, sobald der Fehler behoben ist.

### 4.3 Übungsbibliothek
- 150 Übungen (5 davon mit Besenstiel). Suche (Umlaute auch als ae, oe, ue) und Filter: Alle, Core, Bauch, Rücken, Beine & Po, Dehnen, Yoga, Atmung & Vacuum, Ganzkörper, Eigene.
- Übungs-Detail: animierte Figur (oder eigenes Foto), Alias, Markierungen (Themen, beidseitig, Hilfsmittel), Beschreibung, Hinweis, Atem-Rhythmus, „Ansage anhören“, Video-Link, eigene Notiz.
- Eigene Übung: Name, Beschreibung, Themen, beidseitig, Foto (auf max. 600 px verkleinert), Video-Link; bearbeiten und löschen.

### 4.4 Training (der wichtigste Screen)
- Ring mit Restzeit in der Mitte (darüber Runde, „Links“/„Rechts“ oder „Pause“), darunter kleine Figur, Übungsname und Kurzbeschreibung; Fortschritt als Punkte oben; Leiste „Als Nächstes“ mit Dauer.
- Steuerung: Zurück, −15 s, Pause/Weiter (groß, Themenfarbe), +15 s, Nächste. Tipp auf die Mitte = Pause/Weiter. ✕ beendet nach Rückfrage, die die trainierte Zeit nennt: Ab der Hälfte der geplanten Zeit wird gespeichert wie am Schluss (Fertig-Screen, Tagebuch, Abzeichen), darunter verworfen (seit v=49, vorher wurde immer verworfen).
- Pausen zeigen „Durchatmen“ und die nächste Übung mit Figur.
- Beidseitige Übungen: Zeit wird geteilt, „Links“ / „Rechts“, in der Mitte Ton + „Seite wechseln. Rechts.“ (5.6).
- Atem-Übungen: statt Ring ein atmender Kreis mit „Einatmen / Halten / Ausatmen“ und Sekunden, sanfte Töne; der Rhythmus kommt aus der Bibliothek (im Editor nicht änderbar).
- Ansagen und Töne siehe 5.10. Eigene Übungen: Ton statt Name, Name groß auf dem Bildschirm.
- Bildschirm bleibt an (Wake Lock). Nach Neuladen oder App-Wechsel läuft das Training an der richtigen Stelle weiter (bis 30 Min. danach).
- Querformat mit zwei Spalten (Tablet/TV): Schritt 5.

### 4.5 Fertig
- Figur, „Geschafft!“, trainierte Zeit und Anzahl Übungen („10 von 13 Übungen“, wenn welche übersprungen wurden oder das Training mit ✕ früher endete), Anpassungen in Worten („Plank 2× verlängert“).
- Neue Abzeichen: zuerst große Feier im Vollbild, danach als Karte (5.8, 8.7).
- Frage der lernenden Dauer, falls fällig (5.5).
- Freiwillige Notiz, wird beim Tippen gespeichert.
- „Nochmal“ und „Zur Startseite“. Gefühl-Abfrage und „Teilen“ entfallen (Nicole, 2026-10-24).
- **Zählt nur ab der Hälfte der geplanten Zeit** (Nicole, 2026-10-24): Wer weniger trainiert hat (z. B. durchgeklickt oder kurz reingeschaut), sieht „Kurz reingeschaut“ mit „0:12 trainiert · zählt erst ab der Hälfte der geplanten Zeit (4:33)“. Kein Eintrag im Tagebuch, keine Statistik, keine Abzeichen, keine Lern-Frage, keine Notiz, statt „Geschafft, super gemacht!“ nur der Schlusston. „Trainiert“ ist die Zeit ohne Pausieren, geplant die Dauer vor ±15. Gilt ab v=46, ältere Einträge bleiben.

### 4.6 Statistik
- Woche / Monat / Jahr: Ring als Vergleich mit gleich vielen Tagen der Vorperiode (der Text sagt das dazu, z. B. „Vorwoche ohne Training (bis Montag)“), Balken, häufigster Bereich.
- Abzeichen (22) als Raster mit Fortschritt; Antippen zeigt Bedingung und Datum.
- Tagebuch: die letzten 30 Trainings mit Notiz.
- Backup sichern und laden (Datei mit allem inkl. Fotos), Hinweis „Letztes Backup: vor … Tagen“.
- Zurücksetzen: „Alles löschen“ entfernt Workouts, eigene Übungen mit Fotos, Notizen, Tagebuch, Abzeichen und Einstellungen (wie neu installiert; Vorlagen und Bibliothek bleiben). Zwei Rückfragen, die erste nennt den Stand des letzten Backups.

### 4.7 Einstellungen
- Keine eigene Seite (bewusst zurückgestellt). Feste Werte: Vorbereitung 5 s, Ansagen voll, Töne an. Die Test-Hilfe mit der Uhrzeit im Training ist seit v=51 entfernt.
- Offen für später: Ansage-Umfang, Töne an/aus, Standard-Dauer/-Pause, „Über die App“ mit Hinweis „kein medizinischer Rat“ (wichtig, sobald andere die App nutzen).

## 5. Funktionen V1 im Detail

### 5.1 Pflicht-Basics
- Timer auf Zeitstempel-Basis (nicht Sekunden hochzählen), damit nichts driftet. Laufzustand wird jede Sekunde gespeichert; nach Reload oder App-Wechsel läuft das Training an der richtigen Stelle weiter.
- Wake Lock API; wird er verweigert (z. B. Stromsparmodus) oder fehlt er, Hinweis "Bildschirmsperre ausschalten / Stromsparmodus aus".
- Töne über Web Audio (keine Sounddateien nötig). Der Countdown "3, 2, 1" läuft als Töne, nicht als Sprache (Sprachausgabe startet mit Verzögerung). Vor zeitkritischen Ansagen wird die Sprach-Warteschlange geleert.
- Ansagen als vorab erzeugte MP3-Dateien, abgespielt über Web Audio mit `navigator.audioSession.type = 'ambient'` (mischt sich mit Spotify, getestet). Die Dateien eines Workouts werden vor dem Start geladen und dekodiert. Der Start-Tipp schaltet den Ton frei (iOS-Regel). Keine Browser-Sprachausgabe (stoppt Spotify).
- Hinweis auf der Startseite „Vor dem Start: Ohne Kopfhörer: Schalter am iPhone auf Klingeln, sonst bleibt Takt stumm.“ (v=46; vorher mit „Musik in Spotify starten, Takt vorne lassen“, in v=43 kurz entfernt, siehe 8.7).
- Beim Wechsel zu Spotify läuft das Training weiter; Töne kamen im Test auch im Hintergrund.
- Test-Hilfe: klein Startuhrzeit und vergangene Zeit anzeigen, damit Nicole die Restzeit mit der iPhone-Uhr vergleichen kann (offene Beobachtung aus Test 2). Die Zeiten stimmten (3.3), die Zeile ist seit v=51 entfernt (Nicole, 2026-10-25).
- Offline-fähig und installierbar (PWA: Manifest + Service Worker): Schritt 5.
- Export/Import als JSON: umgesetzt als Backup in der Statistik (Schritt 4).

### 5.2 Vorschau + sanfter Übergang
Nächste Übung immer sichtbar; bei 10 s "noch 10 Sekunden", bei 3 s Countdown; in der Pause Bild der nächsten Übung.

### 5.3 Zeit-Budget
Im Fenster „Anpassen“: Schieber ab 5 Min. bis zur vollen Länge bei der gewählten Intensität (bei „hart“ also länger). Alle Dauern ohne die 5 s Vorbereitung, wie auf Karte und Vorschau. Erst werden alle Dauern und Pausen anteilig gekürzt (auf 5 s gerundet, mindestens 10 s je Übung, nie länger als geplant). Reicht das nicht, fallen Runden weg (zuerst die letzte Runde des Blocks mit den meisten Runden), dann die Pausen, zuletzt Übungen von hinten.

### 5.4 Mix-Modus
Fenster „Mix“: Themen antippen (mehrere möglich): Core, Vacuum, Bauch, Beine & Po, Rücken, Dehnen, Yoga, Ganzkörper; Gesamtdauer 5, 10, 15, 20 oder 30 Min. Schalter „Besenstiel“ unter „Hilfsmittel“ (seit v=48, zu Beginn aus). Themen, Dauer und Schalter merkt sich das Fenster sofort (seit v=49, vorher erst beim Mischen). Takt zieht zufällig aus der Bibliothek (nur Zeit-Übungen mit Figur, ohne Hilfsmittel außer Matte, Wand und mit Schalter Besenstiel, keine Übung doppelt), bei mehreren Themen reihum aus jedem Thema. „Core“ enthält auch die Vacuum-Übungen, „Vacuum“ nur diese. Aufbau seit v=47 (Nicole, 2026-10-25, Hintergrund in 8.8 und 8.9):
- **Zirkel** (Core, Bauch, Beine & Po, Rücken, Ganzkörper, Vacuum): 5 Übungen (5 Min.: 4, 30 Min.: 6), Pause 15 s. Runden (bis 4) und Arbeitszeit (20–60 s) füllen die Zeit bis auf 5 %, die Arbeitszeit liegt dabei möglichst nah an 40 s; die Gesamtdauer wird nie überschritten. Beidseitige Übungen bekommen wie in den Vorlagen das Anderthalbfache (40 s, beidseitig 60 s = 30 s je Seite). Ein dünnes Thema wird mit Core und Ganzkörper aufgefüllt.
- **Bewegungsmuster** (seit v=48): Je Thema kommen feste Muster in dieser Reihenfolge dran, welche Übung es wird, bleibt Zufall. Bauch: Crunch, Stabilität (z. B. Dead Bug), Drehung, untere Bauchmuskeln, seitliche Bauchmuskeln. Beine & Po: Kniebeuge, Hüftstreckung (Brücke, Kickback), Ausfallschritt, Abspreizen, Hüftbeuge, dann Innenschenkel, Wade. Core: Stabilität, Seitstütz, ruhiges Vakuum, Drehung, gegengleich (Bird Dog, Swimmer), dann Brücke. Rücken: Rückenstrecker, Schulterblätter, gegengleich, Hüftbeuge (Good Morning, Standwaage), Schulterblätter. Ganzkörper: Kniebeuge-Sprung, Drücken (Liegestütz), Cardio, Stütz, Cardio, dann Hüftstreckung. Vacuum: halten, mit Bewegung, halten, unter Last, halten. Bei mehreren Themen zählen die Muster der anderen mit. Dehnungen und Mobilisation haben kein Muster und kommen nicht in den Zirkel (vorher z. B. Knie zur Brust im Rücken-Zirkel).
- **Aufwärmen nur bei Kraft-Themen** (Core, Bauch, Beine & Po, Rücken, Ganzkörper): erst den Puls heben (Laufen auf der Stelle, Hampelmann, Kniehebelauf, Seilspringen, Schattenboxen), dann die Gelenke des Themas bewegen (z. B. Hüftkreisen vor Beine & Po, Schulterkreisen vor Rücken, Katze-Kuh vor Bauch), je 40 s mit 5 s Wechsel; im 5-Min.-Mix nur die Mobilisation (30 s). Dehnen, Vacuum und Yoga ohne Aufwärm-Block.
- **Durchgang** (Dehnen, Yoga): keine Runden, so viele Übungen, wie in die Zeit passen, 5 s Wechsel. Dehnungen 60 s (beidseitig 45 s je Seite), bei übriger Zeit bis zum Doppelten; Kraft- und Balance-Haltungen (z. B. Boot, Krieger, Heuschrecke) 45 s (beidseitig 30 s je Seite); nie unter 30 s je Seite. Passt die nächste Übung nicht mehr ganz, kommt eine mit kürzerer Haltezeit dazu. Dehnen ohne Aufwärm-, Vacuum- und Ganzkörper-Übungen (z. B. Armkreisen, Inchworm). Dehnen geht reihum die Körperregionen durch: Beinrückseite, Hüftbeuger/vorderer Oberschenkel, Hüfte/Po, Wirbelsäule, Schultern/Brust/Nacken, Flanke; Yoga die Arten: Stand, Rückbeuge, Hüftöffner, Vorbeuge, Balance, Wirbelsäule, Seite, Schultern, Rumpf. Mit Schalter Besenstiel kommen die Stab-Übungen zuerst dran (Region Schultern). Yoga beginnt mit dem Sonnengruß. Am Ende steht die Totenstellung (60 s, 5 Min.: 40 s).
- **Kombination** von Zirkel und Durchgang: nacheinander, erst der Zirkel („Hauptteil“), dann ein Block „Dehnen“, „Yoga“ oder „Dehnen & Yoga“, dann die Totenstellung. Die Zeit teilt sich nach Anzahl der Themen. Nach einem Kraft-Zirkel kommen zuerst die Regionen mit Dehnungen für die Muskeln, die gearbeitet haben (z. B. Beinrückseite, Hüftbeuger, Hüfte nach Beine & Po), dann der Rest des Körpers.
- **Positionen:** Jeder Teil läuft vom Stehen zum Liegen (Stehen, Stütz, Knien, Bauchlage, Sitzen, Seitenlage, Rückenlage). Das Aufwärmen endet nicht tiefer, als der Zirkel beginnt. Abschluss nach einem Zirkel ohne Durchgang: eine Dehnung für die Themen (z. B. Figur 4 nach Beine & Po, Kobra nach Bauch, Kindhaltung nach Rücken) in der Position, in der der Zirkel endet, oder tiefer; 60 s (5 Min.: 40 s).

Danach „Neu mischen“, „Speichern“ (unter „Meine Workouts“) oder „Starten“.

### 5.5 Lernende Dauer
Jede +15/−15-Änderung wird mit Übung und Workout protokolliert. Wurde dieselbe Übung im **selben Workout** in den letzten 3 Trainings dieses Workouts jedes Mal verlängert (oder jedes Mal gekürzt), fragt der Fertig-Screen z. B. „Plank in ‚Morgen-Core‘ auf 60 s setzen?“. „Ja“ ändert nur dieses Workout (bei einer Vorlage entsteht eine Kopie), „Nein“ stellt die Frage für die nächsten 10 Trainings dieses Workouts zurück. Trainings über „Anpassen“ und ungespeicherte Mixe zählen nicht. Kommt eine Übung mit verschiedenen Dauern vor (z. B. Plank 20 s im Aufwärmen, 60 s im Hauptteil), fragt Takt bei ihr nicht (seit v=49; vorher setzte „Ja“ alle auf denselben Wert). Details: Spec Schritt 4.

### 5.6 Seitenwechsel
Übung "beidseitig" → Dauer halbiert pro Seite, Ansage und Ton in der Mitte, Anzeige "Links" / "Rechts".

### 5.7 Teilen per Link
**Entfällt vorerst** (Nicole, 2026-10-24: nur Backup). Ursprüngliche Idee, falls später andere Takt nutzen: Workout als JSON → gzip (CompressionStream) → base64url → `index.html#w=…`. Empfänger öffnet den Link, sieht Vorschau, "Speichern". Weil Links auf dem iPhone in Safari statt in der installierten App öffnen, gibt es zusätzlich "Code kopieren / Code einfügen" (derselbe Text ohne URL). Fremde Übungen (nicht in Bibliothek) kommen als Inline-Übungen mit, Fotos werden nicht mitgeschickt.

### 5.8 Tagebuch und Abzeichen
**Tagebuch** in der Statistik: die letzten 30 Trainings (Datum, Workout, Minuten, Notiz), neueste oben. Keine Gefühl-Abfrage. Ein Training kommt nur hinein, wenn mindestens die Hälfte der geplanten Zeit trainiert wurde (4.5). Die Startseite zeigt die Minuten dieser Woche.

**Abzeichen** (Wunsch von Nicole 2026-10-22, umgesetzt in Schritt 4): 22 Stück in 6 Gruppen (Trainings, Minuten, Tage in Folge, Tageszeit, Abwechslung, Entdecken). Runde Plaketten mit Icon, erreicht in der Gruppenfarbe, gesperrt grau mit Fortschrittsring „4 von 10“. Raster in der Statistik, Antippen zeigt Bedingung und Datum. Neue Abzeichen werden im Vollbild gefeiert (8.7) und stehen danach als Karte im Fertig-Screen. Einmal erreicht bleibt erreicht. Tageszeit: „Frühaufsteherin“ = Training zwischen 4 und 8 Uhr beendet, „Nachteule“ = zwischen 21 und 4 Uhr (seit v=49; vorher zählte ein Ende um 0:20 als früh). Die Regeln liegen als Liste in `data/badges.js`, neue Abzeichen sind nur Inhalt.

### 5.9 Intensitäts-Regler
leicht: Arbeit ×0,8, Pause ×1,5 · normal: ×1/×1 · hart: Arbeit ×1,2, Pause ×0,6. Reihenfolge: erst Intensität, dann Zeit-Budget. Das Budget ist eine harte Obergrenze für das Training: "15 Minuten" ergibt nie mehr als 15 Minuten (dazu kommen nur die 5 s Vorbereitung).

### 5.10 Ansagen und Stimme
Eine feste natürliche Stimme: **Katja** (`de-DE-KatjaNeural`, gewählt von Nicole am 2026-10-22 aus 3 Proben: Katja, Seraphina, Florian). Feste Sätze („Mach dich bereit.“, „Pause.“, „Als Nächstes:“, „Noch zehn Sekunden.“, „Seite wechseln.“, „Links.“, „Rechts.“, „Geschafft, super gemacht!“, Liste in `data/strings.js`) und alle Übungsnamen der Bibliothek liegen als einzelne MP3-Dateien in `assets/voice/` („Los geht's!“ wurde nie gespielt und ist seit v=49 entfernt). Erzeugt werden sie einmalig per Script `tools/make_voice.py` (edge-tts) aus `data/strings.js` und `data/exercises.js`; neue Bibliotheksübung = Script erneut laufen lassen. Wo Katja einen Namen falsch liest, steht ein eigener Ansagetext (`ansage` in `data/exercises.js`): „Stomach Vacuum …“ wird „Bauch-Vakuum …“, sonst „Vacuum“ → „Vakuum“, „90/90 Hüfte“ → „Neunzig neunzig Hüfte“. Eigene Übungen haben keine Datei: Ton + Name groß. „3, 2, 1“ als Töne; Töne für Atem-Übungen und ein Dreiklang für neue Abzeichen. Ansage-Umfang (voll / nur Übungsname / nur Töne / still) ist im Code vorbereitet, aber noch ohne Einstellung (immer voll). EN/ES später: dieselben Dateien in anderer Sprache erzeugen.

## 6. Inhalte

### 6.1 Übungsbibliothek (150 Übungen, deutsch)
Felder: `id, name, alias[], beschreibung, hinweis, tags[], beidseitig, typ ('zeit'|'atem'), atem {ein, halten, aus, haltenLeer}, hilfsmittel[], bild, icon, quelle, position, muster, fokus`, wo nötig `ansage` (5.10). `bild` (immer null) und `icon` werden nirgends angezeigt (Reserve, die Figur ersetzt beide).
Jede Zeit-Übung hat eine Ausgangsposition (`position`, seit v=47): `stehen, stuetz, knien, bauchlage, sitzen, seitenlage, rueckenlage`, in dieser Reihenfolge von oben nach unten (`T.POSITIONS`). Mix und Vorlagen laufen danach.
Kraft-Übungen haben ein Bewegungsmuster (`muster`, z. B. `kniebeuge`, `huefte-strecken`, `drehen`), Dehnungen und Yoga-Haltungen einen Schwerpunkt (`fokus`, z. B. `beine-hinten`, `wirbelsaeule`, `oben`), beide seit v=48; der Mix wählt danach (5.4).
Hilfsmittel: Matte, Wand, Stuhl, Band, Tisch, Sofa und seit v=48 Stab (Anzeige „Besenstiel“). Die Figur hält den Stab in beiden Händen (`js/figure.js`, Prop `stab`).
144 Übungen haben eine animierte Figur (`data/poses.js`), die 6 Atem-Übungen den Atem-Kreis. Bilder aus free-exercise-db werden nicht genutzt (Figur statt Bild). Ursprünglich 110 Übungen, am 2026-10-23 kamen 36 dazu (davon 12 Vacuum-Varianten), eine fiel weg, am 2026-10-25 kamen 5 mit Besenstiel dazu.
Themen (eine Übung kann mehrere haben): Core 43, Dehnen 33, Beine/Po 32, Yoga 24, Rücken 23, Bauch 20, Vacuum 17, Ganzkörper 13, Aufwärmen 10, Oberkörper 8, Atmung 7.

### 6.2 Vorlagen (12)
Je Thema „Kurz“ (~10 Min) und „Lang“ (~20 Min): Vacuum & Core, Bauch, Dehnen & Rücken, Yoga & Atmung, Beine & Po, Starker Rücken. Vacuum & Core: kein Aufwärmen, sondern 60 s Bauchatmung zum Ankommen (seit v=52, Nicole: vor Vacuum ergibt Aufwärmen keinen Sinn), dann Hauptteil (2–3 Runden) und Abschluss. Kraft-Vorlagen (Bauch, Beine & Po, Starker Rücken): Aufwärmen (2–3 Übungen, seit v=50 wie im Mix: erst den Puls heben, dann die Gelenke des Themas, 5 s Wechsel, endet nicht tiefer als der Hauptteil beginnt), Hauptteil als Block mit 2–3 Runden, Abschluss (Dehnen/Atmung). Dehnen & Rücken: ein Durchgang ohne Block-Namen. Yoga & Atmung: Ankommen, Sonnengruß (2 Runden), Haltungen, Abschluss. Seit v=47 läuft der Hauptteil vom Stehen zum Liegen; in den anderen Blöcken (außer dem Aufwärmen) steht man nicht mitten im Block wieder auf (nur die Reihenfolge geändert, Übungen und Zeiten gleich). Nicole prüft die Vorlagen vor einer Veröffentlichung.

## 7. Technik

**Grundsatz:** Kein Framework, kein Build-Schritt, wie Peach – aber mehrere Dateien, damit Inhalte und Logik getrennt bleiben (Voraussetzung für Capacitor und für andere Nutzer).

```
Projekt Homeworkout/  (Repo takt)
  index.html          alle Screens als <section>, Skripte und CSS mit ?v= (Cache-Nummer)
  css/app.css         Gestaltung (Design v2)
  js/core.js          Namensraum und kleine Helfer
  js/store.js         localStorage (takt_v1, takt_run_v1), Prüfung eigener Übungen
  js/plan.js          Workout -> Schrittliste (prep, work, rest)
  js/workouts.js      Intensität, Zeit-Budget, Workouts prüfen/kopieren, Mix
  js/engine.js        Timer-Engine auf Zeitstempeln (Ereignisse step, warn, count, side, done)
  js/announce.js      welche Ansage / welcher Ton je Ereignis
  js/audio.js         Web Audio: Töne + Sprachdateien, Modus ambient
  js/breath.js        Atem-Modus (Atem-Uhr, Töne)
  js/learn.js         lernende Dauer
  js/stats.js         Statistik-Rechnung
  js/badges.js        Abzeichen-Regeln und Plaketten
  js/backup.js        Backup schreiben und lesen
  js/wake.js          Bildschirm bleibt an
  js/figure.js        animierte Figur
  js/photos.js        Fotos eigener Übungen (IndexedDB)
  js/app.js           Training, Fertig-Screen, Verdrahtung
  js/home.js          Startseite, Vorlagen-Vorschau, Anpassen, Mix
  js/editor.js        Workout-Editor und Übungs-Auswahl
  js/library.js       Bibliothek, Übungs-Detail, eigene Übungen
  js/statsview.js     Statistik-Seite mit Abzeichen, Tagebuch, Backup
  js/celebrate.js     Vollbild-Feier für neue Abzeichen
  data/*.js           Inhalte als JS (laufen ohne Server): exercises, poses, templates, strings, voice-manifest, badges, badge-icons
  assets/voice/*.mp3  Sprachdateien (Katja)
  assets/takt-mark.svg, icon-180.png   Logo und App-Symbol
  tools/              make_voice.py (Sprachdateien mit edge-tts, auf Nicoles PC), ascii_js.py, galerie.html, voice-lines.js
  tests/              node tests/run.js
  docs/               dieses Konzept, Design-Handoff, Pläne und Specs
  spike*/, mockups/   frühere iPhone-Tests und Entwürfe
Geplant (Schritt 5): manifest.webmanifest, sw.js, weitere App-Icons, Schrift lokal
```

**Datenmodell (localStorage-Key `takt_v1`, nie umbenennen):**
```
{ version: 1,
  workouts: [ { id, name, theme, defaultWork, defaultRest, blocks: [ { label, repeat, items: [ { exId|null, name, duration, rest|null, bilateral } ] } ],
                source: 'own', origin?: 'mix', createdAt, updatedAt } ],
  exercisesOwn: [ …wie Bibliothek, quelle: 'eigen', videoUrl, photoId ],
  settings: { announce: 'full'|'name'|'beeps'|'silent', sounds, prepSeconds, budgetLast: { [workoutId]: { minutes, intensity } },
              mixLast: { themes, minutes, stab }, lastBackup,
              lang, defaultWork, defaultRest, intensity, showImages },   // die letzten fünf vorgesehen, noch ungenutzt
  log: [ { id, workoutId, name, date, plannedSec, actualSec, activeSec, theme, areaSec, adjustments: [ { exId, delta } ],
           source: 'template'|'own'|'mix', origin, adjusted, breathCount, startedAt, note } ],
  learn: { [workoutId + '|' + exId]: { since, snoozeUntil } },
  notes: { [exId]: Notiz },
  badges: { [badgeId]: isoDatum } }
```
Dazu `takt_run_v1` (laufendes Training samt zurückgestellter Abzeichen-Feiern, wird bis 30 Min. fortgesetzt) und IndexedDB `takt_photos_v1` (Fotos). Vorlagen liegen in `data/templates.js` (`source: 'template'`), nicht im Speicher.

**Browser-APIs:** Web Audio (Oszillator-Töne und Sprachdateien), Audio Session (`navigator.audioSession.type = 'ambient'`), Screen Wake Lock (bei `visibilitychange` erneut anfordern, Fehler abfangen), IndexedDB (Fotos), Web Share mit Datei (Backup; sonst Download). Service Worker: Schritt 5. Kein `fetch` auf lokale Daten, Inhalte kommen als JS.

**Design:** Design v2 (2026-10-23, aus Claude Design): Farben Hintergrund `#171217`, Fläche `#241B23`, Rosé `#BE7B9D`, Lavendel `#B794C5`, Salbei `#C6C5A6`; Schriften Outfit (Überschriften, Zahlen) und DM Sans, beide von Google Fonts; die Übungsfigur ist das Logo. Thema-Farben: Vacuum & Core `#C6C5A6`, Bauch `#BE7B9D`, Dehnen `#A8C4A0`, Yoga `#B794C5`, Beine & Po `#C4A882`, Rücken `#8AB4C4`. Maßgeblich: `docs/design_handoff_takt_redesign/design-system/DESIGN_GUIDE.md`. Regeln: kein `°`-Zeichen, in `js/` nur ASCII (Umlaute als `\u`-Escape, `python tools/ascii_js.py`; die Tests prüfen beides), keine Emojis.

**Deployment:** Öffentliches Repo `nicolehahn2890/takt` (Privatkonto, wie Peach), GitHub Pages von `main`, Live-URL https://nicolehahn2890.github.io/takt/. Bei jeder Änderung an App-Dateien `?v=` in `index.html` hochzählen (iPhone-Cache). Commit + Push nach jedem funktionierenden Schritt, vorher prüfen: keine Keys im Commit.

## 8. Umsetzungsschritte (einzeln abstimmen)

| Schritt | Inhalt | Ergebnis zum Prüfen | Tokens (grob) |
|---|---|---|---|
| 0a | Mockup des Training-Screens (statisches HTML, 2 Varianten) im Browser zeigen | Erledigt: Variante A (Ring) | ~40k |
| 0b | Spike auf Nicoles iPhone (Pflicht, Hauptgerät): Mini-Seite mit Sprachansage, Ton, Bildschirm-an, Spotify nebenbei, Stummschalter, App-Wechsel | Erledigt: Test 1 und 2, Ergebnis in 3.1 und 3.2 | ~30k |
| 1 | Grundgerüst, Design-Tokens, Datenmodell, Timer-Engine, Sprachdateien für feste Sätze (gewählte Stimme), Training-Screen (Ring) mit einem Test-Workout, Test-Hilfe Uhrzeit (Repo + Pages gibt es schon) | Erledigt 2026-10-22 (live, 52 Tests grün, Code-Review ohne kritische Funde, iPhone-Test bestanden, siehe 3.3) | ~220k |
| 2 | Bibliothek (110 Übungen mit animierter Figur statt Bildern, Katja-Ansagen; seit 2026-10-23 145), Übungs-Screens, eigene Übungen mit Foto/Video | Erledigt 2026-10-22 (live, 81 Tests grün, zwei Prüfungen ohne kritische Funde). iPhone-Test bestanden 2026-10-24 (Figuren flüssig, Ansage anhören, eigenes Foto, Suche mit Tastatur) | ~450k |
| 3 | Workout-Editor, Start-Screen, 12 Vorlagen, Zeit-Budget, Intensität, Mix-Modus | Erledigt 2026-10-23 (live v=15, 121 Tests grün, klickbarer Entwurf von Nicole abgenommen, zwei Prüfungen, wichtige Funde behoben). iPhone-Test bestanden 2026-10-24 (Editor, Kopie einer Vorlage, Anpassen) | ~290k |
| 4 | Atem-Modus, Seitenwechsel, +15/−15, lernende Dauer, Fertig-Screen, Tagebuch + Abzeichen, Backup (Teilen per Link entfällt vorerst) | Erledigt 2026-10-24 (live v=41, 201 Tests grün, Prüfung ohne kritische Funde; Abzeichen auf Nicoles Wunsch mit Icons + Fortschritt, 22 Stück). Nachbesserungen nach dem ersten Benutzen v=42–44 (8.7), 205 Tests grün. iPhone-Test 2026-10-24 bestanden bis auf die lernende Dauer (noch nicht geprüft), siehe 8.6 | ~250k + ~70k Abzeichen v2 |
| 5 | PWA (Manifest, Service Worker, Icons), Querformat, Feinschliff, Installations-Hinweis beim ersten Start, Abschlusstest auf dem iPhone | Installierbar, offline, auf dem Homescreen | ~120k |

Summe grob 1,0–1,2 Mio. Tokens über alle Schritte, verteilt auf mehrere Sitzungen. Jeder Schritt endet mit Test und Push.

### 8.1 Offene Kleinigkeiten aus Schritt 1 (aus den Code-Reviews, bewusst zurückgestellt)

- Google Fonts extern statt lokal → Schritt 5 (PWA). (Die Test-Hilfe `debugClock` ist seit v=51 entfernt; ältere Speicherstände behalten den Schlüssel, er wird nicht mehr gelesen.) (Favicon und `apple-touch-icon` gibt es seit Design v2.)
- Bei jeder Änderung `?v=` in `index.html` hochzählen (iPhone-Cache); MP3s und Manifest haben keine Version.
- Schließen-Knopf 38 px und Start-Knopf ca. 42 px kleiner als 44 px Touch-Ziel; `safe-area-inset-left/right` im Querformat; `-webkit-text-size-adjust`.
- Wake Lock: Wettlauf, wenn `off()` während einer laufenden Anfrage kommt. (Erledigt v=49: eine Anfrage, die nach `off()` zurückkommt, wird sofort freigegeben.)
- (Erledigt v=49:) Abbruch mit ✕ stoppt jetzt eine laufende Ansage. Von den 4 ungenutzten Sätzen war nur „Los geht's!“ (go) übrig (side, left, right sind seit Schritt 4 in Gebrauch); er ist entfernt.
- „Nochmal“ nach Wiederherstellung ohne Workout-Id wirkungslos; gespeicherter Trainingsstand wird beim Laden nicht auf sein Format geprüft (wichtig, sobald sich das Format in Schritt 2 bis 4 ändert).
- Banner „Einmal tippen“ nach Rückkehr kann einen Tipp verschlucken, wenn der Ton inzwischen von selbst wieder läuft; Töne können sich bei unterbrochenem Ton stauen.
- Stille-Beschnitt der Sprachdateien (Rand 0,03 s) könnte leise Wortanfänge kappen → beim iPhone-Test hören.
- Ring springt sekundenweise statt flüssig.
- Testlücken: `adjust` in der Pause, Wiederherstellen eines pausierten Stands, `prev` in der Vorbereitung, `load` mit falschen Datentypen.

### 8.2 Offene Kleinigkeiten aus Schritt 2 (bewusst zurückgestellt)

- Atem-Vorschau in der Bibliothek zeigt winzigen Text; Figur zeichnet 60× pro Sekunde neu, auch in der Pause (Akku); `prefers-reduced-motion` fehlt.
- Animations-Takt bleibt nach einem Fehler stehen; spät ankommendes Foto kann die aktuelle Figur überschreiben; Vorschau-Adressen werden nicht freigegeben.
- Fotospeicher: Fehler werden für die Sitzung „eingefroren“, englische Rohmeldung, kein Timeout. (v=49: Bricht der Speicher ab, z. B. weil er voll ist, kommt eine deutsche Meldung statt endlosem Warten.)
- „Ansage anhören“ ohne Rückmeldung bei Stummschalter oder Ladefehler.
- Touch-Ziele der Filter und „+ Eigene“ unter 44 px; Klasse `.bar` kollidiert mit dem Fortschrittsbalken ab 25 Übungen (wichtig für Schritt 3).
- Eigene Übung: führendes „ · eigene“ in der Liste, Hochformat-Fotos werden beschnitten, fehlendes Foto zeigt leere Kachel, gleiche Datei erneut wählen wirkt nicht, Notiz bei sofortigem Zurück evtl. nicht gespeichert.
- Video-Feld ohne `autocapitalize/autocorrect=off`; Suchfeld schließt die Tastatur nicht.
- Bei einigen Übungen kippt ein fast gestrecktes Knie oder ein Ellbogen kurz die Richtung (z. B. Bird Dog, Kickback).
- Hinweis für Schritt 4/5: Safari löscht Daten und Fotos einer Website nach 7 Tagen ohne Nutzung; die Homescreen-App hat eigenen Speicher. Beim Import `exercisesOwn` durch `validateOwn` prüfen.
- Hinweis für Schritt 3: Beim Einfügen eigener Übungen in Workouts den Namen mitspeichern, damit nach dem Löschen nicht nur „Übung“ dasteht. (Erledigt in Schritt 3: Name wird gespeichert, angezeigt wird der aktuelle Bibliotheksname, der gespeicherte nur nach dem Löschen.)

### 8.3 Offene Kleinigkeiten aus Schritt 3 (bewusst zurückgestellt)

- „Nochmal“ tut nichts, wenn das Workout gelöscht wurde oder ein ungespeicherter Mix nach Neuladen fertig wurde; nach Neuladen startet „Nochmal“ ohne die Anpassung (volle Länge).
- (Erledigt v=49:) Während „Lädt …“ (bis 2,5 s) konnte ein zweiter Start über „Anpassen“ ausgelöst werden. Jetzt wird er ignoriert, offene Fenster schließen sich beim Start, und die Knöpfe zeigen danach wieder „Start“.
- „Diese Woche x Min.“ zählt Pausenzeit mit (Zeit seit Start). Klären, ob nur Trainingszeit zählen soll.
- Löschen eines Workouts setzt bei vollem Speicher nicht zurück.
- Die Dehnen-Vorlagen haben keinen Block-Namen und zeigen „Block 1“.
- Block-Namen lassen sich im Editor nicht ändern, obwohl der Knopf „+ Block (z. B. Abschluss)“ heißt.
- „Für neue Übungen“: Die Standard-Pause ändert auch bestehende Einträge, die keine eigene Pause haben.
- Touch-Ziele unter 44 px: „Anpassen“-Link (34 px), „Speichern“ im Editor-Kopf, Themen-Chips, ± Knöpfe (42 px).
- Mix für Dehnen, Yoga oder Vacuum begann mit sportlichen Aufwärm-Übungen (z. B. Hampelmann, Schattenboxen). (Erledigt v=47: Dehnen und Vacuum ohne Aufwärmen, Yoga beginnt mit dem Sonnengruß, siehe 8.8.)
- Anpassen: kleinstes Budget immer 5 Min. (bei langen Dehn-Vorlagen werden die Übungen dann sehr kurz).
- `validateWorkout`/`copyWorkout` kennen nur die Bibliothek, nicht eigene Übungen (heute egal, weil der Editor den Namen immer mitspeichert).
- Hintergrund scrollt auf iOS hinter offenen Fenstern mit; Escape schließt Fenster nicht.
- Editor lädt Fotos eigener Übungen bei jedem ± neu; Auswahl zeichnet bei jedem Buchstaben alle Figuren neu.
- Startseite springt nach Zurück aus Vorlage oder Editor nach oben.
- Kaputter Eintrag in `workouts` würde die Startseite leeren. (Ein Training ohne Übungen zählt seit v=46 nicht mehr.)
- Budget unter Vorbereitung + 10 s kann überschritten werden (über die Oberfläche nicht erreichbar).
- Ring-Balken `#t-bar` heißt noch `.bar`. (Die toten Klassen `.ic`, `.is-prep` sind seit v=49 weg.)

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
- Auf dem iPhone prüfen: Leiste unten beim Tippen in der Suche über der Tastatur. (Geprüft 2026-10-24: passt.)

### 8.6 Schritt 4 (2026-10-24) – umgesetzt und bewusst zurückgestellt

Seitenwechsel (Ton + „Seite wechseln. Rechts.“, „Links.“ nach dem Namen), Atem-Modus (atmender Kreis, sanfte Töne für Ein- und Ausatmen, kein 3-2-1), Fertig-Screen (trainierte Zeit, Anpassungen in Worten, Notiz, neue Abzeichen, Frage der lernenden Dauer), lernende Dauer (3× gleiche Richtung im selben Workout → Frage; Nein = 10 Trainings Ruhe; Vorlage → Kopie), Abzeichen (22, runde Plaketten mit Icon aus Tabler Icons, Fortschrittsring „4 von 10“, Raster in der Statistik), Tagebuch (letzte 30 Trainings mit Notiz) und Backup (Datei mit allem inkl. Fotos sichern und laden). Teilen per Link ist auf Nicoles Wunsch weggefallen (nur Backup). Gefühl-Abfrage weggelassen. Spec: `docs/superpowers/specs/2026-10-24-schritt-4-design.md`, Plan mit allen Entscheidungen: `docs/superpowers/plans/2026-10-24-schritt-4.md`. Abzeichen auch im Design System (`docs/design_handoff_takt_redesign/design-system/`, Baustein AchievementBadge, Vorschau `guidelines/achievement-badges.html`).

Behoben nach der Prüfung: „Backup sichern“ meldet nur noch echten Erfolg (Knopf erst aktiv, wenn die Fotos geladen sind; in der Home-Bildschirm-App ohne Teilen-Menü ehrlicher Hinweis statt Download).

Zurückgestellt (aus der Prüfung):
- (Erledigt v=49:) Nach Rückkehr aus dem Hintergrund konnte der Seitenwechsel die Ansage des Übungsnamens abschneiden. Jetzt wird alles aus einem Takt nacheinander abgespielt.
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

iPhone-Test (Nicole, 2026-10-24): Backup sichern und laden in der Home-Bildschirm-App, Seitenwechsel, Notiz, Tagebuch, Abzeichen-Feier und Statistik bestanden; Atem-Töne „etwas leise“ (lauter gemacht in v=45). **Noch offen:** lernende Dauer (3× dieselbe Übung im selben Workout mit +15 verlängern, dann kommt die Frage im Fertig-Screen).

Ursprüngliche Checkliste:
- Atem-Übung mit Spotify: sind die Ein-/Aus-Töne gut hörbar, aber sanft?
- Beidseitige Übung: „Links.“ nach dem Namen, in der Mitte Ton + „Seite wechseln. Rechts.“
- Fertig-Screen: Notiz tippen, Abzeichen-Einblendung, Frage der lernenden Dauer (3× dieselbe Übung im selben Workout verlängern).
- Statistik: Abzeichen-Raster mit Icons und Ringen, Antippen, Tagebuch.
- **Backup sichern in der Home-Bildschirm-App:** öffnet sich das Teilen-Menü mit der Datei, lässt sie sich „In Dateien sichern“? Danach „Backup laden“ mit genau dieser Datei.

### 8.7 Nach dem ersten Benutzen (2026-10-24, v=42–44)

Wünsche von Nicole nach dem ersten Trainieren mit Schritt 4:
- **Abzeichen fallen kaum auf:** Neue Abzeichen werden jetzt im Vollbild gefeiert (große Plakette in der Gruppenfarbe, Lichtkranz, kurzer Funkenflug, sanfter Dreiklang, „Nächstes Ziel: …“). Nach dem Training kommt die Feier, sobald „Geschafft, super gemacht!“ ausgeklungen ist; mehrere nacheinander („1 von 2“). Im Fertig-Screen stehen sie danach in einer Karte, Antippen zeigt die Feier noch einmal. Editor, eigene Übung und Backup feiern genauso statt nur im Toast; bei „Speichern & Starten“ erst nach dem Training (oder beim Abbrechen). Ein Abzeichen durch die Notiz wird beim Verlassen des Notizfelds gefeiert, nicht mitten im Tippen.
- **Mix 5 Min.:** neue Stufe (1 Aufwärm-Übung, 4 Übungen, kurzer Abschluss; passt immer in 5 Min.).
- **Mix nur Vacuum:** eigenes Thema „Vacuum“ (nur Vacuum-Übungen). „Core“ enthält weiterhin auch Vacuum-Übungen.

- **Hinweis „Vor dem Start“ entfernt (v=43):** Anlass war die Beobachtung, dass Töne und Ansagen auch bei Stumm kommen. Später am selben Tag geklärt: Das gilt nur mit Kopfhörern; über den Lautsprecher bleibt Takt bei Stumm still (iOS-Regel, siehe Abschnitt 3).
- **Hinweis zurück (v=46):** Kurz: „Vor dem Start: Ohne Kopfhörer: Schalter am iPhone auf Klingeln, sonst bleibt Takt stumm.“
- **Zurücksetzen (v=46):** „Alles löschen“ in der Statistik (Nicole: alles, nicht nur Trainings), siehe 4.6.
- **Training zählt erst ab der Hälfte der geplanten Zeit (v=46):** Nicole fand es nicht sinnvoll, dass kurzes Reinschauen oder Durchklicken als absolviert zählt. Gilt nur ab jetzt; alte Einträge bleiben (für einen sauberen Neustart „Alles löschen“). Siehe 4.5. Dabei behoben: „1 Übungen“ im Fertig-Screen heißt jetzt „1 Übung“.
- **Atem-Töne lauter (v=45):** Nicole fand sie etwas leise; Lautstärke von 0,3 auf 0,5 (andere Töne 0,6), weiter weich eingeblendet.
- **Unterlagen abgeglichen (v=44):** Konzept, README, Design-Guide und Code-Kommentare auf den aktuellen Stand gebracht; keine Änderung am Verhalten.

Meine Festlegungen (Nicole kann widersprechen): Feier schließt nur über den Knopf (ein versehentlicher Tipp wischt sie nicht weg); Klang nur, wenn Töne an sind; ohne Animation bei „Bewegung reduzieren“.

### 8.8 Mix nach Positionen und Thema (2026-10-25, v=47)

Wunsch von Nicole: Vor Dehnen und Vacuum ergibt Aufwärmen keinen Sinn. Die Workouts sollen fachlich sinnvoll zusammengestellt sein, auch beim Ablauf der Positionswechsel. Anlass war ein Mix „Vacuum, Dehnen“: Aufwärmen mit Sonnengruß und Laufen auf der Stelle, im Hauptteil Inchworm (Stehen und Stütz), Taube (Boden), Armkreisen (Stehen), und das in 2 Runden mit 15 s Pause.

Entscheidungen (Nicole, 2026-10-25): Dehnen und Yoga als ein Durchgang statt in Runden. Kombinationen nacheinander (erst Zirkel, dann Dehnen oder Yoga, dann Totenstellung). Die 12 Vorlagen werden nach Positionen umsortiert.

Umgesetzt: Ausgangsposition für alle 139 Zeit-Übungen (`data/exercises.js`, 6.1), neuer Mix-Aufbau (5.4), Vorlagen umsortiert (6.2; „Dehnen & Rücken kurz“ beginnt weiter mit Katze-Kuh als sanftem Einstieg). Hinweis im Mix-Fenster: „Takt stellt den Rest zusammen, vom Stehen zum Liegen.“ Die Tests prüfen alle 255 Themen-Kombinationen in 5 Dauern: nie länger als gewählt, mindestens 90 % der Zeit, jeder Teil von oben nach unten, Aufwärmen nur bei Kraft-Themen.

Fachlicher Hintergrund:
- Dehnen: Das ACSM (Garber u. a. 2011) empfiehlt, eine Dehnung 10–30 s zu halten (Ältere 30–60 s), zusammen etwa 60 s je Muskelgruppe. In einer Studie brachte ein Aufwärmen vor dem Dehnen (10 Min. Treppensteigen) keinen messbaren Zusatznutzen für die Beweglichkeit (de Weijer u. a. 2003).
- Vor Kraft-Übungen dynamisch aufwärmen: erst den Puls heben, dann die Gelenke bewegen. Langes statisches Dehnen (60 s und mehr je Muskel) direkt vor Belastung mindert die Leistung leicht (Behm u. a. 2016), deshalb stehen Dehnungen am Ende.
- Reihenfolge: Übungen am Anfang einer Einheit gelingen mit mehr Wiederholungen (Simão u. a. 2012). Weil der Mix vom Stehen zum Liegen läuft, kommen die großen Übungen im Stehen (Kniebeugen, Ausfallschritte) zuerst.
- Vacuum: kaum Studien zur Reihenfolge. Umgesetzt sind kein Aufwärmen, 15 s Pause zum Durchatmen und der Ablauf nach Positionen.

Meine Festlegungen (Nicole kann widersprechen): Yoga beginnt mit dem Sonnengruß, ohne eigenen Aufwärm-Block. Jeder Mix mit Dehnen oder Yoga endet mit der Totenstellung. Haltezeiten wie in 5.4. Ab 30 Min. sechs Übungen im Zirkel (sonst kam ein 30-Min.-Vacuum-Mix nur auf 26 Min.). Arbeitszeit im Zirkel möglichst nah an 40 s, solange die Zeit damit bis auf 5 % gefüllt ist (sonst z. B. 20-s-Haltezeiten beim Vacuum). Beidseitige Übungen im Zirkel bekommen das Anderthalbfache (vorher bekamen sie im Mix dieselbe Zeit, bei 25 s also nur gut 12 s je Seite).

Zurückgestellt:
- (Erledigt v=48, siehe 8.9:) Innerhalb eines Themas waren die Übungen nicht nach Bewegungsmuster ausgewogen.
- Bei Kombinationen läuft jeder Teil für sich vom Stehen zum Liegen, zwischen Zirkel und Dehnen steht man einmal auf. Auch zwischen den Runden eines Zirkels steht man wieder auf (eine Runde geht einmal vom Stehen zum Boden).
- In kurzen Kombinationen (10 Min.) hat der Dehn-Teil oft nur 2–3 Dehnungen, eine davon kürzer (30 s).

Ansage „Vakuum“ (Nicole, 2026-10-25): „Vacuum mit Fersentippen“ las Katja noch englisch (die anderen 15 Vacuum-Übungen heißen „Stomach Vacuum …“ und werden schon als „Bauch-Vakuum …“ gesprochen). Der Ansagetext ist jetzt „Vakuum mit Fersentippen“, ein Test verhindert „Vacuum“ in Ansagen. Die Sprachdatei hat Nicole am selben Tag auf ihrem PC neu erzeugt (`python tools/make_voice.py` erzeugt nur diese eine Datei und aktualisiert `data/voice-manifest.js`), weil der Sprachdienst (`speech.platform.bing.com`) aus der Cloud-Sitzung gesperrt ist. Die App lädt die neue Datei von selbst, weil `js/audio.js` den Ansagetext an die Adresse hängt.

### 8.9 Übungen mit Hand und Fuß, Besenstiel (2026-10-25, v=48)

Wunsch von Nicole: Die Übungen im Mix sollen Hand und Fuß haben. Vorher zog der Zufall teils nur Cardio für Ganzkörper, drei Kniebeugen ohne Brücke für Beine & Po, bis zu vier Vacuum-Übungen für Core, Dehnungen in den Rücken-Zirkel. Dazu Dehnübungen mit dem Besenstiel, die sie gern macht.

Entscheidungen (Nicole, 2026-10-25): Besenstiel über einen Schalter im Mix-Fenster (gemerkt). Fünf Übungen aus „Schultern & Brust“ und „Am Boden“: Schulter-Durchzug, Schulterdehnung (Stab senkrecht hinter dem Rücken), Brustöffner (Stab hinter dem Rücken), Kindhaltung mit Stab, Überkopf-Dehnung (liegend). Nicht gewählt: Seitbeuge und Rumpfdrehung mit Stab, Vorbeuge mit Stab und tiefe Hocke mit Stab über dem Kopf. Fertig direkt in `main`.

Umgesetzt: `muster` und `fokus` für alle Übungen (6.1), Auswahl nach festen Schwerpunkten je Thema (5.4), 5 Stab-Übungen mit Figur (`data/poses.js`, Stab in `js/figure.js`), Schalter im Mix-Fenster, Hilfsmittel „Besenstiel“ in der Bibliothek. Tests: je Thema die festen Muster über 20 Mixe mit mindestens 10 verschiedenen Übungen, Dehnen und Yoga mit verschiedenen Regionen, Stab nur mit Schalter und dann zuerst, alle 255 Themen-Kombinationen auch mit Besenstiel (Dauer, Positionen, Speichern), Stab und Figur in jedem Bild der Animation im Bild.

Meine Festlegungen (Nicole kann widersprechen): Damit kein Muster nur eine einzige Übung hat (sonst käme sie in jedem Mix), gehören Plank und Bärenstand jetzt auch zu Ganzkörper, Swimmer zu Core und Standwaage zu Rücken. Die Stab-Übungen gehören zu Dehnen und Yoga (mit Gurt oder Stab sind sie auch im Yoga üblich). Mit Schalter kann der Schulter-Durchzug auch im Aufwärmen von Rücken und Ganzkörper kommen, im Abschluss Kindhaltung mit Stab (Rücken) oder Brustöffner (Ganzkörper). Der Schalter ist zu Beginn aus.

Die Sprachdateien der 5 Stab-Übungen hat Nicole am selben Tag auf ihrem PC erzeugt (`python tools/make_voice.py`, der Sprachdienst ist aus der Cloud-Sitzung gesperrt); damit sind alle Tests grün.

### 8.10 Prüfung der ganzen App (2026-10-25, v=49)

Wunsch von Nicole: die komplette App auf Fehler prüfen und alle Unterlagen auf Widersprüche und Veraltetes. Geprüft: alle Tests (auch in 5 Zeitzonen), Querverweise der Daten (150 Übungen, 144 Figuren, Sprachdateien, 12 Vorlagen, 22 Abzeichen), alle Screens im Browser, dazu drei unabhängige Code-Prüfungen (Training; Speichern und Statistik; Workouts, Editor und Bibliothek). Kein Absturz, kein Datenverlust gespeicherter Daten, keine Sicherheitslücke.

Behoben (Entscheidungen Nicole, 2026-10-25: alles außer dem Entwurfs-Speicher, ✕ ab der Hälfte speichern, toten Code entfernen):
- Statistik: Im laufenden Zeitraum nennt jeder Vergleichstext, bis wann verglichen wird („Vorwoche ohne Training (bis Montag)“). Vorher stand am Montag „Vorwoche ohne Training“, obwohl nur der Montag davor leer war (4.6).
- ✕ ab der Hälfte der geplanten Zeit speichert wie am Schluss (4.4).
- Anpassen: Der Schieber passt zur Intensität (vorher bei „hart“ z. B. 10 Min. nicht wählbar, bei „leicht“ mehrere Stufen mit derselben Dauer). Dauern und Budget gelten ohne die 5 s Vorbereitung wie überall (vorher Vorschau 9:40, Anpassen 9:45) (5.3).
- Der Bildschirm blieb an, wenn ein Training bei gesperrtem Handy endete (8.1).
- Eine eigene Übung, die nachträglich auf beidseitig gestellt wird, bekommt auch in bestehenden Workouts den Seitenwechsel (4.2).
- Lernende Dauer fragt nicht bei Übungen mit verschiedenen Dauern im selben Workout (5.5).
- Kleinere: Frühaufsteherin und Nachteule nach Mitternacht (5.8); „Als Nächstes:“ kam ohne Namen, wenn eine Sprachdatei nicht laden konnte; „Noch zehn Sekunden“ schnitt nach der Rückkehr aus einer anderen App den Seitenwechsel ab; eine zurückgestellte Abzeichen-Feier ging beim Neuladen verloren; Fenster und „Lädt …“ beim Start (8.3); voller Fotospeicher (8.2); Editor-Meldungen, Zurück aus der Kopie, „Ende“ statt Pause bei der letzten Übung (4.2); Suche mit ae, oe, ue (4.3); Mix-Fenster merkt die Auswahl sofort (5.4).
- Aufgeräumt: ungenutzte Funktionen und CSS, der nie gespielte Satz „Los geht's!“ samt Datei.
- Unterlagen abgeglichen: dieses Konzept (u. a. 6.1, 6.2, 8.8, 8.9), Design-Guide samt Kopie im Design-Skill (150 Übungen, Besenstiel), Figuren-Galerie (Filter Aufwärmen).
- Uhrzeit-Zeile unten im Training (Test-Hilfe aus Schritt 1) entfernt (v=51, Nicole).
- Aufwärmen der Kraft-Vorlagen nach dem Schema des Mix (v=50, Vorschlag von Nicole abgenommen): erst den Puls heben (Auf der Stelle laufen, Hampelmann, Kniehebelauf, Schattenboxen), dann die Gelenke des Themas (Hüftkreisen, Inchworm, World's Greatest Stretch, Katze-Kuh, Arm- und Schulterkreisen), 5 s Wechsel statt 15 s Pause. Raus aus dem Aufwärmen: Mountain Climbers, Squat Jacks und die doppelte Kniebeuge (Beine & Po kurz). Bei „Starker Rücken lang“ steht man nach dem Aufwärmen nicht mehr vom Boden auf. Vacuum & Core (v=52, Nicole): gar kein Aufwärmen, wie beim Mix „Vacuum“; stattdessen 60 s Bauchatmung als „Ankommen“, die beim vollständigen Ausatmen für das Vakuum hilft. Dauern: Vacuum & Core 10:10 / 19:00, Bauch 9:40 / 20:25, Beine & Po 10:40 / 20:15, Starker Rücken 10:00 / 20:05. Ein Test prüft beides.

Zurückgestellt:
- Neuladen (z. B. wenn iOS die Home-Bildschirm-App im Hintergrund beendet) verwirft ungespeicherte Eingaben im Editor und im Formular für eigene Übungen; dafür bräuchte es einen Entwurfs-Speicher.
- Das Ende eines Trainings prüft nicht, ob das Speichern geklappt hat (wie 8.6, volle Speicher).

## 9. Verifikation

- Pro Schritt: `node --check` auf alle JS-Dateien; Agent `html-app-tester` (statische Prüfung); Vorschau im eingebauten Browser (`python -m http.server` im Projektordner, Handy-Viewport emuliert). Auf dem iPhone immer über die Live-URL (HTTPS), nie über die lokale IP.
- Timer-Logik (Schrittliste, Budget, Intensität, Mix) als reine Funktionen, getestet mit `node tests/run.js` (eigener kleiner Test-Runner, prüft auch: kein Grad-Zeichen, in `js/` nur ASCII).
- Auf dem iPhone (Nicole): Sprachansage, Wake Lock, Installation auf Homescreen, Spotify nebenbei, App-Wechsel und Zurückkehren, Backup sichern und laden.
- Ende: Vorlagen inhaltlich von Nicole abgenommen.

## 10. Offene Entscheidungen und meine Festlegungen

**Entschieden (Nicole, 2026-10-22):** Name **Takt**, Repo `takt` öffentlich, Hauptgerät iPhone, Workouts werden am selben iPhone gebaut und trainiert (kein Geräte-Transport nötig, Teilen/Export bleibt in Schritt 4; dort umgesetzt als Backup, Teilen entfällt vorerst).

**Training-Screen (Schritt 0a, entschieden 2026-10-22):** Variante **A · Ring** – großer Ring mit Zeit in der Mitte, darunter kleines Bild, Übungsname und Kurzbeschreibung, Leiste "Als Nächstes". Steuerung wie im Mockup: Zurück, −15, Pause (groß, Thema-Farbe), +15, Weiter; Tipp auf die Mitte = Pause/Weiter. Vorlage: `mockups/training-a.html`.

**Offen (niedrig, wird zu Beginn von Schritt 2 gefragt):** Gibt es konkrete Routinen oder Videos als Vorlage für Bibliothek und Vorlagen? Sonst Standardübungen.

**Meine Festlegungen (änderbar):**
- Mehrere Dateien statt einer HTML-Datei (wegen Capacitor, Bibliothek, Wartbarkeit).
- Reihenfolge im Editor per Pfeile, kein Drag & Drop in V1.
- Fotos auf 600 px verkleinert in IndexedDB; sie kommen mit ins Backup.
- Alles zeitbasiert, keine Wiederholungs-Übungen.
- Vorlagen schreibgeschützt, Bearbeiten erzeugt Kopie.
- Nur Dunkelmodus in V1 (Design v2).
- Stimme (Extra 10) in V1 = eine feste natürliche Stimme als Sprachdateien + einstellbarer Ansage-Umfang (Entscheidung nach Test 2; der Umfang ist im Code vorbereitet, eine Einstellung fehlt noch). Englisch/Spanisch kommt später, indem dieselben Dateien in anderer Sprache erzeugt werden.
- Zeit-Budget ist eine harte Obergrenze; Intensität wird davor angewendet.
- Countdown "3, 2, 1" als Töne, nicht als Sprache.

## 11. Version 2 (Ideen, nicht geplant)
- KI: Workout aus einem Satz erzeugen; Übungsname aus Beschreibung/Foto finden (Anthropic API, kleiner Server oder Cloudflare Worker für den Key).
- Capacitor-Verpackung für App Store / Play Store (löst Hintergrund- und Musik-Einschränkungen).
- Drag & Drop im Editor, Hellmodus, Apple Watch (nur nativ).
- Eigene Vorlagen veröffentlichen/teilen über eine Galerie.
