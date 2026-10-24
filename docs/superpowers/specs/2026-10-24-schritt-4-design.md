# Takt Schritt 4: Atem-Modus, Seitenwechsel, Fertig-Screen, lernende Dauer, Abzeichen, Tagebuch, Backup

Stand 2026-10-24 · baut auf Schritt 3, Design v2 und Teil B auf · Konzept: `docs/KONZEPT.md` 4.4, 4.5, 5.5, 5.6, 5.8, 5.1 (Export/Import) · Gestaltung: `docs/design_handoff_takt_redesign/`

## Absicht

Takt soll Nicole im Training noch besser führen (Atmen, Seitenwechsel), ihr nach dem Training zeigen, was sie geschafft hat, und sich an ihre Gewohnheiten anpassen (lernende Dauer). Kleine Erfolge (Abzeichen) und ein Tagebuch machen dranbleiben leichter. Ein Backup schützt ihre Daten, weil Safari Web-App-Daten löschen kann und es keine Cloud gibt.

## Ziele

1. **Atem-Modus:** Bei Atem-Übungen (`typ: 'atem'`) ersetzt ein großer atmender Kreis den Ring im Training: er wächst beim Einatmen, bleibt beim Halten, schrumpft beim Ausatmen; in der Mitte „Einatmen“ / „Halten“ / „Ausatmen“ und die Sekunden der Phase, darunter die Restzeit der Übung. **Sanfte Töne** führen: heller Ton zu Beginn von Einatmen, tiefer Ton zu Beginn von Ausatmen, kein Ton beim Halten. Rhythmus aus der Bibliothek (z. B. 4-4-4-4), im Editor nicht änderbar.
2. **Seitenwechsel:** Beidseitige Übungen teilen ihre Zeit in zwei Hälften. Erste Hälfte „Links“, zweite „Rechts“ (Anzeige über der Zeit), in der Mitte Ton + Katja „Seite wechseln.“ und „Rechts.“; beim Start der Übung nach dem Namen „Links.“ (Sprachdateien gibt es schon). ±15 s verschieben die Mitte mit (immer die Hälfte der aktuellen Dauer).
3. **Fertig-Screen:** Figur und „Geschafft!“ wie heute, dazu: trainierte Zeit, Anzahl Übungen, Anpassungen in Worten („Plank 2× verlängert“, „Crunch 1× gekürzt“), ein freiwilliges Notizfeld (wird beim Tippen gespeichert), neu erreichte Abzeichen mit kleiner Einblend-Animation, die Frage der lernenden Dauer (falls fällig), Knöpfe „Nochmal“ und „Zur Startseite“. Kein Gefühl, kein Teilen.
4. **Lernende Dauer:** Wurde dieselbe Übung im **selben Workout** in den letzten 3 Trainings dieses Workouts jedes Mal verlängert (oder jedes Mal gekürzt), fragt der Fertig-Screen: „Plank in ‚Morgen-Core‘ auf 60 s setzen?“ – Ja / Nein. „Ja“ ändert nur dieses Workout (eigenes Workout direkt; bei einer Vorlage: „Als eigenes Workout speichern?“ legt eine Kopie mit der neuen Dauer an). „Nein“ stellt die Frage für diese Übung in diesem Workout für die nächsten 10 Trainings zurück. Ungespeicherte Mixe bekommen keine Frage. Höchstens eine Frage pro Fertig-Screen (die mit der größten Änderung).
5. **Abzeichen** (Zahlen und Worte, keine Icons) – 11 Stück aus dem Konzept: Erstes Training · 3 Tage in Folge · 7 Tage in Folge · 10 Trainings · 100 Minuten · Frühaufsteherin (Training vor 8 Uhr beendet) · Nachteule (nach 21 Uhr) · Alle 6 Themen · Eigenes Workout gebaut · Mix-Meisterin (5 Mixe) · Atemprofi (10 Atem-Übungen). Runde Plaketten mit großer Zahl oder kurzem Wort, erreicht farbig (Themen- bzw. Markenfarbe), gesperrt grau; Antippen zeigt Name, Bedingung und Datum. Einmal erreicht bleibt erreicht (auch wenn z. B. das eigene Workout später gelöscht wird). Regeln als Inhalt in `data/badges.js`.
6. **Tagebuch** in der Statistik: die letzten 30 Trainings (Datum, Workout-Name, Minuten, Notiz falls vorhanden), neueste oben.
7. **Backup** in der Statistik: „Backup sichern“ erstellt eine Datei mit allem (Workouts, eigene Übungen **mit Fotos**, Notizen, Tagebuch, Abzeichen, Einstellungen); auf dem iPhone über das Teilen-Menü (in Dateien sichern) oder als Download. „Backup laden“ liest so eine Datei, zeigt was drin ist und ersetzt nach Rückfrage alles. Hinweis „Letztes Backup: vor 12 Tagen“ bzw. „Noch kein Backup“.

## Nicht-Ziele

- Kein Teilen per Link oder Code (später, wenn andere Takt nutzen).
- Kein Gefühl/Bewertung nach dem Training.
- Keine Einstellungen-Seite, kein Ansage-Umfang-Schalter, kein Rhythmus-Editor.
- Keine neuen Katja-Sprachdateien (Atem nur mit Tönen; „Links/Rechts/Seite wechseln“ existieren).

## Anti-Ziele

- Ein Backup laden zerstört Daten ohne Rückfrage, oder eine kaputte Datei überschreibt gute Daten.
- Töne/Ansagen kommen doppelt, zu spät oder überlagern sich mit dem Countdown 3-2-1.
- Die lernende Dauer fragt dauernd oder ändert eine Vorlage still.
- Abzeichen verschwinden wieder oder werden doppelt gefeiert.

## Daten

- Protokoll-Eintrag (zusätzlich): `source` (`'template'|'own'|'mix'`), `breathCount` (abgeschlossene Atem-Übungen), `note` (Text, max. 500 Zeichen), `startedAt` (Startzeit). Bestehende Felder bleiben.
- `takt_v1` neu: `badges: { [id]: isoDatum }` (erreichte Abzeichen), `learn: { [workoutId + '|' + exId]: { snoozeUntil: Anzahl Trainings } }` (vorhanden im Datenmodell, jetzt genutzt), `settings.lastBackup` (ISO).
- Backup-Datei: JSON `{ app: 'takt', version: 1, exportedAt, data: <takt_v1>, photos: { [photoId]: dataURL } }`, Dateiname `takt-backup-2026-10-24.json`. Laden prüft `app`/`version`, Workouts mit `validateWorkout`, eigene Übungen mit `validateOwn`; ungültige Einträge fallen weg und werden gezählt.

## Festgelegt von Nicole (2026-10-24)

- Alles in einem Plan. Kein Gefühl, nur freiwillige Notiz. Tagebuch, Abzeichen und Backup in der Statistik. Kein Teilen, nur Backup (mit Fotos). Atem mit sanften Tönen. Lernende Dauer ändert nur das jeweilige Workout. Abzeichen mit Zahlen und Worten.
- Leisten-Reiter als abgerundete Rechtecke (Radius 14) wie die Knöpfe (umgesetzt v=31).

## Meine Festlegungen (Nicole kann widersprechen)

- Atem-Töne: Einatmen 660 Hz, Ausatmen 440 Hz, weich ein- und ausgeblendet; 3-2-1-Countdown bleibt bei Atem-Übungen aus, damit sich nichts überlagert.
- Bei beidseitigen Übungen mit ungerader Dauer liegt die Mitte bei der halben Zeit (auf die Millisekunde), angezeigt wird ganze Sekunden.
- Abzeichen-Farben: Markenfarben (Salbei, Rosé, Lavendel) und Themenfarben; Reihe in der Statistik als 4er-Raster.
- „Tage in Folge“ zählt Kalendertage mit mindestens einem Training (Ortszeit); ein heutiger Tag ohne Training unterbricht die Serie erst am nächsten Tag.
- Backup auf dem iPhone über das Teilen-Menü (`navigator.share` mit Datei), sonst Download-Link.

## Nach der Bau-Prüfung geklärt (meine Festlegungen)

**Lernende Dauer**
- Pro Training zählt die **Netto-Richtung** einer Übung (Summe ihrer ±15-Tipps; 0 = keine Änderung). „Jedes Mal verlängert“ = die letzten 3 Trainings **dieses Workouts** haben für die Übung jeweils eine positive (bzw. jeweils negative) Summe.
- Vorgeschlagene Dauer = jetzige Dauer des Eintrags + Durchschnitt der Änderung **je Vorkommen** (Summe ÷ Anzahl der Runden/Vorkommen der Übung im Training) über die 3 Trainings, auf 5 s gerundet, 10–600 s. „Ja“ ändert alle Einträge dieser Übung im Workout.
- Trainings, die über „Anpassen“ (Intensität ≠ normal oder Zeit-Budget) gestartet wurden, zählen nicht (Protokoll-Feld `adjusted: true`).
- Nach „Ja“ zählt die Übung in diesem Workout neu (nur Trainings danach). „Nein“ stellt sie für die nächsten **10 Trainings dieses Workouts** zurück. Bei einer Vorlage legt „Ja“ eine Kopie mit der neuen Dauer an; die Vorlage zählt danach ebenfalls neu. Lehnt Nicole das Kopieren ab, gilt das wie „Nein“.

**Ton-Vorrang**
- Seitenwechsel (Ton + „Seite wechseln.“ + „Rechts.“) hat Vorrang: „Noch zehn Sekunden“ entfällt, wenn der Wechsel weniger als 4 s davor oder danach liegt.
- Bei Atem-Übungen entfallen „Noch zehn Sekunden“ und der 3-2-1-Countdown; der erste Einatmen-Ton kommt erst, wenn die Namensansage vorbei ist (nach 2 s), danach im Rhythmus.
- „Links.“ wird direkt nach dem Übungsnamen in derselben Ansage abgespielt.
- Nach Rückkehr aus dem Hintergrund werden verpasste Atem-Töne nicht nachgeholt; das Seitenwechsel-Ereignis kommt einmal (wie andere Schritte beim Nachholen).

**Abzeichen**
- Alte Trainings zählen mit. Beim ersten Start nach dem Update werden bereits erfüllte Abzeichen **still** eingetragen (Datum des Trainings, das sie erfüllt hat), ohne Feier. Gefeiert wird nur, was das gerade beendete Training neu freischaltet.
- „Eigenes Workout gebaut“: beim ersten Speichern im Editor (neu oder Kopie), sofort mit kurzem Hinweis; ein gespeicherter Mix zählt nicht. Alte vorhandene eigene Workouts zählen beim Nachtragen mit.
- „Mix-Meisterin“: 5 Trainings, die aus dem Mix stammen – ungespeicherte Mixe und gespeicherte Mixe (Workouts behalten dafür die Herkunft `origin: 'mix'`).
- „Alle 6 Themen“: Thema der trainierten Workouts laut Protokoll, Mixe mit ihrem Farb-Thema.
- „Atemprofi“: Atem-Übungen, bei denen mindestens die Hälfte der Zeit gelaufen ist, zusammengezählt über alle Trainings.
- „Frühaufsteherin“ / „Nachteule“: Endzeit des Trainings vor 8:00 bzw. ab 21:00 Ortszeit.

**Backup laden**
- Erst wird alles gelesen und geprüft (Datei, Version, Workouts, eigene Übungen, Fotos); bei einem schweren Fehler passiert gar nichts. Die Rückfrage nennt, was drin ist und was wegfällt („2 ungültige Workouts werden weggelassen“), Nicole kann trotzdem laden oder abbrechen.
- Reihenfolge: Fotos aus der Datei in den Fotospeicher schreiben → Daten (`takt_v1`) ersetzen → nicht mehr benutzte Fotos löschen → Seite neu laden. Scheitert das Schreiben der Fotos, bleiben die alten Daten unangetastet.
- Ein Foto, das in der Datei fehlt, bleibt als Verweis stehen (die Übung zeigt dann die Standardfigur).
- Einstellungen kommen aus der Datei; `lastBackup` = Zeitpunkt der Datei. Beim Sichern wird `lastBackup` gesetzt, sobald das Teilen-Menü erfolgreich war bzw. der Download angestoßen wurde (Abbrechen zählt nicht).

## Dem Bauenden überlassen

- Genaue Aufteilung in Dateien (z. B. `js/badges.js`, `js/backup.js`, `js/learn.js`) und reine Funktionen mit Node-Tests.
- Animation der Abzeichen-Einblendung (kurz, ruhig, ohne Hüpfen).

## Prüfung

- Node-Tests für: Seitenwechsel-Ereignis in der Engine (auch mit ±15 und Pause), Atem-Phasenwechsel → Töne, lernende Dauer (3× gleiche Richtung, gemischt, Zurückstellen, Vorlage, Mix), Abzeichen-Regeln (alle 11, Serien über Monatsgrenze, bleibt erreicht), Backup schreiben/lesen (gültig, kaputt, falsche Version, ungültige Einträge, Fotos).
- Browser 375 × 667: Training mit Atem-Übung und beidseitiger Übung, Fertig-Screen mit Notiz/Abzeichen/Frage, Statistik mit Abzeichen, Tagebuch, Backup sichern und laden.
- Frischer Prüfer, Live-Prüfung, Sync, iPhone-Test durch Nicole (Töne mit Spotify, Teilen-Menü für Backup).
