# Schritt 3: Eigene Workouts, Vorlagen, Zeit-Budget, Mix – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nicole stellt sich in Takt eigene Workouts zusammen, startet eine von 12 Vorlagen oder einen Zufalls-Mix und kann vor dem Start Minuten und Intensität anpassen.

**Architecture:** Neue reine Logik in `js/workouts.js` (Workouts prüfen, kopieren, Dauer rechnen, Intensität, Zeit-Budget, Mix) wird in Node getestet. Die Oberfläche (Startseite neu, Editor, Übungs-Auswahl, Anpassen-Fenster, Mix-Fenster) kommt in `js/editor.js` und `js/home.js`; `js/app.js` startet Trainings weiterhin selbst. Zuerst gibt es einen klickbaren HTML-Entwurf, den Nicole auf dem iPhone prüft; die Oberflächen-Tasks setzen ihr Feedback um.

**Tech Stack:** wie bisher (Vanilla JS an `window.Takt`, Node-Test-Runner `node tests/run.js`, edge-tts Katja für neue Sätze).

**Spec:** `docs/KONZEPT.md` (4.1 Start, 4.2 Editor, 5.3 Zeit-Budget, 5.4 Mix, 5.9 Intensität, 6.2 Vorlagen) plus Entscheidungen vom 2026-10-23 unten.

## Entscheidungen von Nicole (2026-10-23)

- Zeit-Budget und Intensität nur auf Wunsch: „Start“ startet sofort, daneben „Anpassen“.
- Vorlagen: Claude schlägt 12 vor (Liste unten), Nicole prüft vor dem Bau.
- Editor: erst klickbarer HTML-Entwurf im bestehenden Repo, Nicole testet auf dem iPhone, dann Bau.
- Mix-Modus: wenig Einstellungen (Themen + Gesamtdauer), die App verteilt den Rest; Mix lässt sich speichern und im Editor anpassen.

## Global Constraints

- Alles aus Schritt 1 und 2 gilt weiter: Keys `takt_v1`/`takt_run_v1`, IndexedDB `takt_photos_v1` nie umbenennen; `js/` nur ASCII (`python tools/ascii_js.py`); kein Grad-Zeichen; keine `speechSynthesis`; relative Pfade; Peach-Farben; bei jeder Veröffentlichung `?v=` hochzählen (Start: `v=11`).
- **GitHub nur über das Privatkonto.** Vor jedem Push `git remote get-url origin` muss `nicolehahn2890/takt` zeigen. Push: `git -c credential.helper= -c 'credential.helper=!f() { echo username=nicolehahn2890; echo "password=$(gh auth token -u nicolehahn2890)"; }; f' push origin main`.
- **Am Ende jedes Tasks synchron:** Arbeit passiert im Ordner `C:\Users\nicol\.claude\Projekt Homeworkout`; nach dem Push prüfen, dass `git status -sb` „main...origin/main“ ohne „ahead/behind“ zeigt und nichts offen ist (Nicoles Wunsch).
- Vorlagen sind schreibgeschützt; „Bearbeiten“ erstellt eine Kopie unter „Meine Workouts“.
- Reihenfolge im Editor per Pfeile hoch/runter (kein Drag & Drop).
- Zeit-Budget ist harte Obergrenze; Intensität wird vorher angewendet: leicht Arbeit ×0,8 Pause ×1,5 · normal ×1/×1 · hart Arbeit ×1,2 Pause ×0,6.
- Beidseitige Übungen: Dauer gilt für beide Seiten zusammen (der automatische Seitenwechsel kommt in Schritt 4).
- Ein Workout-Eintrag speichert immer auch den Namen der Übung (`name`), damit nach dem Löschen einer eigenen Übung nicht nur „Übung“ dasteht.
- Das alte „Test: Core kurz“ entfällt; Test-Workout für Tests ist ab jetzt die Vorlage `vacuum-core-kurz`.

## Review Focus

1. **Zeit-Budget kleiner als machbar** (z. B. 3 Minuten für ein 20-Minuten-Workout mit 12 Übungen): Ergebnis bleibt ≤ Budget, jede Übung mindestens 10 s, notfalls fallen Wiederholungsrunden weg; nie leeres Training. Test `fitBudget sehr kleines Budget` in Task 2.
2. **Mix mit Themen, die wenig Übungen haben** (nur „Atmung“): Mix nimmt nur Zeit-Übungen mit Figur, füllt mit verwandten Themen auf statt doppelt, und Atem-Übungen höchstens als Abschluss. Test `mix mit duennem Thema` in Task 3.
3. **Workout ohne Übungen speichern oder starten** (Editor leer, Block leer): Speichern zeigt Hinweis, Start-Knopf ist aus. Test `validateWorkout leer` in Task 4 plus Browser-Prüfung in Task 6.
4. **Gelöschte eigene Übung in einem gespeicherten Workout**: Workout lässt sich öffnen und starten, Eintrag zeigt den gespeicherten Namen und die Standardfigur. Test `buildSteps mit geloeschter eigener Uebung` in Task 4.
5. **Laufendes Training, während das Workout im Editor geändert oder gelöscht wird** (nach Neuladen): Das laufende Training nutzt seinen eigenen gespeicherten Ablauf und läuft unverändert weiter. Browser-Prüfung in Task 7.

---

## Dateien

| Datei | Aufgabe |
|---|---|
| `mockups/editor/index.html` | klickbarer Entwurf (Startseite, Editor, Übungs-Auswahl, Anpassen, Mix) mit echten Übungsdaten, ohne Speichern |
| `js/workouts.js` | reine Logik: `validateWorkout`, `copyWorkout`, `workoutSeconds`, `applyIntensity`, `fitBudget`, `makeMix`, `rng` |
| `data/templates.js` | die 12 Vorlagen (ersetzt das Test-Workout) |
| `js/home.js` | Startseite: Meine Workouts, Vorlagen nach Thema, Mix, Neu, Wochenminuten |
| `js/editor.js` | Editor und Übungs-Auswahl |
| `js/app.js` | Start eines Workouts mit Optionen `{ budgetSec, intensity }`; Anpassen-Fenster |
| `index.html`, `css/app.css` | neue Screens und Fenster |
| `tests/workouts.test.js`, `tests/data.test.js`, `tests/plan.test.js` | Tests |

---

### Task 1: Klickbarer Entwurf (Gate)

**Files:** Create `mockups/editor/index.html` (lädt `data/*.js`, `js/core.js`, `js/figure.js`, `js/plan.js` für echte Namen, Figuren und Dauer; Zustand nur im Speicher der Seite)

**Inhalt:** Startseite (Meine Workouts, Vorlagen nach Thema mit „Start“ und „Anpassen“, Knöpfe „Mix“ und „+ Neu“, „Diese Woche: x Min.“), Editor (Name, Thema, Standard-Dauer und -Pause, Blöcke mit „Wiederholen 1–10×“, Einträge mit Figur, Name, Dauer ±5 s, Pause, Pfeile hoch/runter, Löschen, „+ Übung“, „+ Block“, Gesamtdauer live), Übungs-Auswahl (Suche + Themen-Filter, Mehrfachauswahl, „Hinzufügen“), Anpassen-Fenster (Minuten-Regler, leicht/normal/hart, neue Gesamtdauer), Mix-Fenster (Themen antippen, Gesamtdauer 10/15/20/30 Min., „Mixen“, Ergebnis als Liste, „Starten“/„Speichern“).

- [ ] Entwurf bauen, im Vorschau-Browser 375 × 667 durchklicken, ohne Konsolenfehler
- [ ] Commit `Schritt 3: klickbarer Entwurf`, Push, live unter `…/takt/mockups/editor/`, synchron prüfen
- [ ] **Stopp:** Nicole testet auf dem iPhone; Feedback als Änderungen in Task 5–7 übernehmen (im Ledger notieren)

### Task 2: Intensität und Zeit-Budget

**Files:** Create `js/workouts.js`, `tests/workouts.test.js`; Modify `tests/run.js` (lädt `js/workouts.js`)

**Interfaces – Produces:**
- `Takt.INTENSITY = { leicht: { work: 0.8, rest: 1.5 }, normal: { work: 1, rest: 1 }, hart: { work: 1.2, rest: 0.6 } }`
- `Takt.applyIntensity(steps, level) -> Step[]` (neue Liste; `work` und `rest` skaliert, auf 5 s gerundet, `work` mindestens 10 s, `rest` mindestens 5 s; `prep` unverändert; unbekannter Level wie `normal`)
- `Takt.fitBudget(steps, budgetSec) -> Step[]`: Gesamtdauer ≤ `budgetSec`; zuerst alle `work`/`rest` anteilig kürzen (auf 5 s abrunden, `work` ≥ 10 s, `rest` ≥ 5 s); reicht das nicht, letzte Runde eines wiederholten Blocks entfernen (Block mit den meisten Runden zuerst, von hinten) und neu skalieren; reicht auch das nicht, Pausen auf 0 und danach Übungen von hinten entfernen, mindestens 1 Übung bleibt; `budgetSec` ≥ Gesamtdauer gibt die Liste unverändert zurück
- `Takt.prepareSteps(workout, exIndex, opts) -> Step[]` mit `opts = { prepSeconds, intensity, budgetSec }`: `buildSteps` → `applyIntensity` → `fitBudget` (nur wenn `budgetSec` gesetzt)

- [ ] Failing tests: `applyIntensity hart` (Vorlage `vacuum-core-kurz`: work 40 → 50, rest 15 → 10); `applyIntensity leicht` (40 → 30, 15 → 25); `fitBudget kuerzt anteilig` (600-s-Workout auf 450 s: Summe ≤ 450 und ≥ 420); `fitBudget streicht Runden` (Block 3× mit 4 Übungen à 40 s, Budget 200 s: Runden < 3, Summe ≤ 200, jede Übung ≥ 10 s); `fitBudget sehr kleines Budget` (Budget 30 s bei 12 Übungen: Summe ≤ 30, ≥ 1 `work`); `fitBudget groesser als Dauer` (unverändert); `prepareSteps Reihenfolge` (hart + Budget: Summe ≤ Budget)
- [ ] FAIL → umsetzen → alle grün; Commit `Schritt 3: Intensitaet und Zeit-Budget`, Push, synchron prüfen

### Task 3: Mix-Generator

**Files:** Modify `js/workouts.js`, `tests/workouts.test.js`

**Interfaces – Produces:**
- `Takt.rng(seed:int) -> () => float` (deterministisch, 0 ≤ x < 1)
- `Takt.MIX_THEMES = { core: ['core','vacuum'], bauch: ['bauch'], beine: ['beine-po'], ruecken: ['ruecken'], dehnen: ['dehnen'], yoga: ['yoga'], ganz: ['ganzkoerper','oberkoerper'] }`
- `Takt.makeMix({ themes: string[], minutes: 10|15|20|30, seed }, exercises) -> Workout`: Aufbau Aufwärmen (2 Übungen mit Tag `aufwaermen`, je 40 s) · Hauptblock (5 Übungen aus den Themen, keine doppelt, nur `typ:'zeit'`, Arbeit 40 s, Pause 15 s, Runden so, dass die Zieldauer am besten passt, 1–4) · Abschluss (1 Übung mit Tag `dehnen`, 60 s); Name „Mix: <Themen>“, `source:'mix'`, `theme` = erstes Thema; danach `fitBudget` auf `minutes*60`
- Gibt es in den Themen weniger als 5 passende Übungen, wird mit `core` und `ganz` aufgefüllt.

- [ ] Failing tests: `mix gleicher seed gleiches Ergebnis`; `mix keine Uebung doppelt im Hauptblock`; `mix Dauer passt` (für 10/15/20/30 Minuten: Dauer ≤ Ziel und ≥ 80 % davon); `mix nur Zeit-Uebungen mit Figur` (jede `exId` hat `Takt.POSES`); `mix mit duennem Thema` (nur `['yoga']` liefert trotzdem 5 verschiedene Übungen)
- [ ] FAIL → umsetzen → grün; Commit `Schritt 3: Mix-Generator`, Push, synchron prüfen

### Task 4: Workouts speichern und 12 Vorlagen

**Files:** Modify `js/workouts.js`, `data/templates.js`, `tests/workouts.test.js`, `tests/data.test.js`, `tests/plan.test.js`, `js/app.js` (Test-Workout-Bezug entfernen)

**Interfaces – Produces:**
- `Takt.validateWorkout(input) -> { ok, errors: [{field, msg}], workout }`: Name 1–40 Zeichen, mindestens ein Eintrag in irgendeinem Block, `repeat` 1–10, `duration` 10–600 s, `rest` 0–120 s oder `null`, jeder Eintrag hat `name`; Id `w-<uid>` wenn fehlt; `source:'own'`; `createdAt`/`updatedAt` als ISO-Text
- `Takt.copyWorkout(workout) -> Workout` (neue Id, Name „<Name> (Kopie)“ bei Vorlagen „<Name>“, `source:'own'`)
- `Takt.workoutSeconds(workout, exIndex) -> int` (Gesamtdauer ohne Vorbereitung)
- `Takt.TEMPLATES`: die 12 Vorlagen aus dem Anhang; Felder wie bisher plus `id`, `theme`, `level:'kurz'|'lang'`

- [ ] Failing tests: `validateWorkout leer` (keine Einträge → Fehler `blocks`); `validateWorkout Name zu lang`; `validateWorkout setzt name aus Bibliothek`; `copyWorkout Vorlage`; `buildSteps mit geloeschter eigener Uebung` (Eintrag `{exId:'own-weg', name:'Meine Übung'}` → Schritt heißt „Meine Übung“); `data: 12 Vorlagen` (Ids eindeutig, alle `exId` existieren, Themen gültig); `data: Vorlagen-Dauer` (kurz 8–12 Min., lang 17–23 Min. laut `workoutSeconds`)
- [ ] FAIL → umsetzen (Test-Workout „Test: Core kurz“ entfernen, `tests/announce.test.js` und `tests/plan.test.js` auf `vacuum-core-kurz` umstellen) → grün; Commit `Schritt 3: Workouts speichern und 12 Vorlagen`, Push, synchron prüfen

### Task 5: Startseite und Anpassen-Fenster

**Files:** Create `js/home.js`; Modify `js/app.js`, `index.html`, `css/app.css`

**Verhalten:** Startseite wie im Entwurf (nach Nicoles Feedback): „Diese Woche: x Min.“ (Summe `actualSec` der Log-Einträge seit Montag), Meine Workouts (Karte: Name, Dauer, Thema-Farbe, „Start“, „Anpassen“, Antippen öffnet Editor), Vorlagen gruppiert nach Thema (Antippen zeigt Ablauf mit „Bearbeiten“ = Kopie), Knöpfe „Mix“, „+ Neu“, „Übungen“. Anpassen-Fenster: Minuten-Regler (5 Min. bis volle Dauer, 1-Min.-Schritte), leicht/normal/hart, „Starten“ zeigt neue Dauer; letzte Wahl je Workout wird in `settings.budgetLast` gemerkt, „Start“ ohne Anpassen nutzt immer die volle Dauer und `normal`.
`app.js`: `startWorkout(id, opts)` nutzt `Takt.prepareSteps`; das laufende Training speichert seine Schritte im Snapshot (unverändert zu Schritt 1).

- [ ] Umsetzen; Tests grün; Browser 375 × 667: Vorlage starten, Anpassen auf 5 Min./hart → Training-Gesamtdauer ≤ 5:00; Wochenminuten nach einem Training erhöht
- [ ] Commit `Schritt 3: Startseite und Anpassen`, Push, synchron prüfen

### Task 6: Editor und Übungs-Auswahl

**Files:** Create `js/editor.js`; Modify `index.html`, `css/app.css`, `js/library.js` (Auswahl-Modus der Liste wiederverwenden)

**Verhalten:** wie im Entwurf (nach Feedback). Speichern über `validateWorkout`, Fehler am Feld; „Speichern & Starten“; „Löschen“ mit Nachfrage; Zurück fragt bei ungespeicherten Änderungen. Neue Einträge übernehmen `defaultWork`/`defaultRest` des Workouts (Start 40 s / 15 s).

- [ ] Umsetzen; Tests grün; Browser 375 × 667: neues Workout mit 2 Blöcken anlegen, Reihenfolge ändern, speichern, neu laden → noch da, starten → Ablauf stimmt; leeres Workout lässt sich nicht speichern und nicht starten
- [ ] Commit `Schritt 3: Workout-Editor`, Push, synchron prüfen

### Task 7: Mix-Fenster, Prüfung, Übergabe

**Files:** Modify `js/home.js`, `index.html`, `css/app.css`, `docs/KONZEPT.md`

- [ ] Mix-Fenster: Themen-Chips, 10/15/20/30 Min., „Mixen“ (neuer Seed) zeigt Liste, „Starten“, „Speichern“ (als eigenes Workout)
- [ ] Browser: laufendes Training, dann im Editor das Workout löschen, Seite neu laden → Training läuft weiter (Review Focus 5)
- [ ] `html-app-tester` und frischer Gesamt-Prüfer; wichtige Funde beheben, Kleinigkeiten in `KONZEPT.md` 8.3
- [ ] `?v=11`, Commit, Push, warten bis live, Live-Prüfung, **synchron prüfen** (`git status -sb` sauber, lokal = GitHub)
- [ ] Nicole bekommt iPhone-Checkliste

---

## Kostenschätzung

| Teil | Tokens (grob) |
|---|---|
| Task 1 Entwurf | 35.000 |
| Task 2 Intensität + Budget | 25.000 |
| Task 3 Mix | 25.000 |
| Task 4 Speichern + 12 Vorlagen | 35.000 |
| Task 5 Startseite + Anpassen | 40.000 |
| Task 6 Editor + Auswahl | 60.000 |
| Task 7 Mix-Fenster, Prüfungen, Übergabe | 70.000 |
| **Summe** | **ca. 290.000** |

Etwas mehr als die 250.000 aus dem Konzept, weil der Entwurf dazukommt.

---

## Anhang: Die 12 Vorlagen (zum Prüfen)

Format: Übung Sekunden. „2 Runden“ wiederholt den Hauptteil. Pausen 15 s, wenn nicht anders angegeben. „bs“ = beidseitig, Zeit für beide Seiten zusammen.

**1 · Vacuum & Core kurz (~11 Min.)** – Thema core
- Aufwärmen: Bauchatmung 60 · Katze-Kuh 45
- Hauptteil, 2 Runden: Stomach Vacuum Vierfüßler 30 · Dead Bug 40 · Stomach Vacuum liegend 30 · Plank 30 · Vacuum mit Fersentippen 40
- Abschluss: Kindhaltung 45

**2 · Vacuum & Core lang (~21 Min.)** – Thema core
- Aufwärmen: Bauchatmung 60 · Katze-Kuh 45 · Hüftkreisen 40
- Hauptteil, 3 Runden: Stomach Vacuum vorgebeugt 30 · Stomach Vacuum Vierfüßler 30 · Dead Bug 40 · Bird Dog 40 · Stomach Vacuum im Unterarmstütz 30 · Stomach Vacuum in der Glute Bridge 40
- Abschluss: Hypopressive Atmung 90 · Kindhaltung 60

**3 · Bauch kurz (~10 Min.)** – Thema bauch
- Aufwärmen: Hampelmann 40 · Mountain Climbers 30
- Hauptteil, 2 Runden: Crunch 40 · Reverse Crunch 40 · Fahrrad-Crunch 40 · Plank 40
- Abschluss: Kobra 40

**4 · Bauch lang (~20 Min.)** – Thema bauch
- Aufwärmen: Hampelmann 45 · Kniehebelauf 30 · Hüftkreisen 30
- Hauptteil, 3 Runden: Crunch mit Beinen in der Luft 40 · Beinheben liegend 40 · Russian Twist 40 · Fahrrad-Crunch 40 · Flutter Kicks 30 · Plank Schulter-Tippen 40
- Abschluss: Kobra 45 · Liegender Twist 60 (bs)

**5 · Dehnen & Rücken kurz (~10 Min.)** – Thema dehnen, Pausen 5 s
- Katze-Kuh 60 · Kindhaltung 60 · Faden einfädeln 90 (bs) · Hüftbeuger-Dehnung 90 (bs) · Herabschauender Hund 45 · Liegender Twist 90 (bs) · Knie zur Brust 60 · Totenstellung 60

**6 · Dehnen & Rücken lang (~20 Min.)** – Thema dehnen, Pausen 5 s
- Schulterkreisen 40 · Nacken seitlich dehnen 90 (bs) · Katze-Kuh 60 · Open Book 90 (bs) · Faden einfädeln 90 (bs) · Herabschauender Hund 45 · Hüftbeuger-Dehnung 90 (bs) · Taube 120 (bs) · Oberschenkel hinten dehnen 90 (bs) · Figur 4 liegend 90 (bs) · Schmetterling 60 · Liegender Twist 90 (bs) · Knie zur Brust 60 · Totenstellung 90

**7 · Yoga & Atmung kurz (~10 Min.)** – Thema yoga, Pausen 5 s
- Bauchatmung 60 · Sonnengruß 2 Runden à 90 · Krieger mit Armen oben 60 (bs) · Krieger mit Armen seitlich 60 (bs) · Baum 60 (bs) · Kindhaltung 60 · Lange Ausatmung 90

**8 · Yoga & Atmung lang (~19 Min.)** – Thema yoga, Pausen 5 s
- Box-Atmung 90 · Katze-Kuh 60 · Sonnengruß 2 Runden à 90 · Krieger mit Armen oben 60 (bs) · Krieger mit Armen seitlich 60 (bs) · Dreieck 60 (bs) · Krieger auf einem Bein 60 (bs) · Stuhl 45 · Baum 60 (bs) · Sphinx 60 · Heuschrecke 40 · Happy Baby 60 · Totenstellung 120 · 4-7-8-Atmung 90

**9 · Beine & Po kurz (~11 Min.)** – Thema beine
- Aufwärmen: Hampelmann 40 · Kniebeuge 40
- Hauptteil, 2 Runden: Kniebeuge 40 · Glute Bridge 40 · Ausfallschritt rückwärts 40 · Fire Hydrants 60 (bs)
- Abschluss: Figur 4 liegend 60 (bs)

**10 · Beine & Po lang (~20 Min.)** – Thema beine
- Aufwärmen: Hampelmann 45 · Hüftkreisen 30 · Squat Jacks 30
- Hauptteil, 3 Runden: Sumo-Kniebeuge 40 · Glute Bridge einbeinig 60 (bs) · Curtsy Lunge 40 · Clamshells 60 (bs) · Kniebeuge mit Nachfedern 30
- Abschluss: Hüftbeuger-Dehnung 60 (bs) · Taube 60 (bs)

**11 · Starker Rücken kurz (~10 Min.)** – Thema ruecken
- Aufwärmen: Schulterkreisen 40 · Katze-Kuh 45
- Hauptteil, 2 Runden: Superman 40 · Bird Dog 40 · Y-T-W 40 · Reverse Snow Angels 40
- Abschluss: Kindhaltung 60

**12 · Starker Rücken lang (~21 Min.)** – Thema ruecken
- Aufwärmen: Schulterkreisen 40 · Armkreisen 40 · Katze-Kuh 45
- Hauptteil, 2 Runden: Superman 40 · Swimmer 30 · Y-T-W 45 · Reverse Snow Angels 40 · Prone Cobra 30 · Bird Dog 40 · Wall Angels 40 · Good Morning 40
- Abschluss: Sphinx 60 · Kindhaltung 60 · Knie zur Brust 60

Die genauen Minuten rechnet der Test `data: Vorlagen-Dauer` nach; weicht eine Vorlage ab, werden Sekunden angepasst, nicht Übungen getauscht.
