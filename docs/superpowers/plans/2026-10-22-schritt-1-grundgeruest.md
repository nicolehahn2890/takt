# Schritt 1: Grundgerüst, Timer und Training-Screen – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auf https://nicolehahn2890.github.io/takt/ läuft ein fertiges Test-Workout mit Ring-Timer, Katja-Ansagen und Tönen, während Spotify weiterspielt und der Bildschirm anbleibt.

**Architecture:** Klassische Script-Dateien ohne Build, alle hängen sich an `window.Takt`. Reine Logik (Schrittliste, Timer-Engine, Ansage-Entscheidung, Speicher) ist von Browser-Teilen (Web Audio, Wake Lock, Oberfläche) getrennt und wird in Node mit einem kleinen eigenen Test-Runner getestet. Sprachdateien erzeugt ein Python-Script einmalig mit edge-tts.

**Tech Stack:** HTML, CSS, Vanilla JS (ES5-Stil plus Promises), Web Audio, Audio Session API, Screen Wake Lock, Node 24 (nur Tests und Werkzeug), Python 3.14 + edge-tts 7.3.1 (nur Werkzeug).

**Spec:** `docs/KONZEPT.md` (Abschnitte 3.1, 3.2, 4.4, 5.1, 5.10, 7)

## Global Constraints

- localStorage-Key `takt_v1` für Nutzerdaten, `takt_run_v1` für das laufende Training. Nie umbenennen.
- Kein `°`-Zeichen in `js/` und `data/`. In `js/*.js` Umlaute in Strings als `ä` usw.; in `data/*.js` sind UTF-8-Umlaute erlaubt.
- Kein Framework, kein Build-Schritt, keine ES-Module. Alle Pfade relativ (App läuft unter `/takt/`).
- Keine Browser-Sprachausgabe (`speechSynthesis`). Ton nur über Web Audio, vorher `navigator.audioSession.type = 'ambient'` (falls vorhanden).
- Stimme: `de-DE-KatjaNeural` über edge-tts.
- Peach-Design: Hintergrund `#1a1418`, Verlauf `linear-gradient(160deg,#2e1a28,#1a1418)`, Pink `#C8729A`, Lila `#B88CC0`, Text `#f6edf1`, gedämpft `#a8949f`, Schrift DM Sans. Thema-Farben: core `#C0BEA0`, bauch `#C8729A`, dehnen `#A8C4A0`, yoga `#B88CC0`, beine `#C4A882`, ruecken `#8AB4C4`.
- Training läuft beim App-Wechsel weiter. Zeit immer aus Zeitstempeln, nie hochzählen.
- Selbst eingetippte Übungen ohne Sprachdatei: Ton statt Name.
- Commit mit der privaten E-Mail (globale Git-Einstellung), Push auf `main`. Falls Push hängt: `git -c credential.helper= -c "credential.helper=!gh auth git-credential" push origin main`.

## Review Focus

1. **Rückkehr nach langer Abwesenheit** (Spotify länger offen als mehrere Schritte): Training steht an der richtigen Stelle, keine Ton-Lawine. Test: `catch-up nach 95 s` in Task 3.
2. **Neuladen mitten im Training** (iOS lädt die Seite neu): Training läuft an der richtigen Stelle weiter, Banner „Einmal tippen für Ton“. Test: `snapshot und restore` in Task 3, Browser-Prüfung in Task 6.
3. **−15 s bei weniger als 15 s Rest**: springt sauber zur nächsten Übung, die bei voller Länge startet. Test: `adjust unter null` in Task 3.
4. **Kaputter oder leerer Speicher** (Safari löscht Daten, alter Stand): App startet mit Standardwerten statt abzustürzen. Test: `load mit kaputtem JSON` in Task 1.
5. **Kleines iPhone (375 × 667)**: Ring, Name, „Als Nächstes“ und alle fünf Knöpfe passen ohne Scrollen. Prüfung im Browser in Task 6.

---

## Dateien

| Datei | Aufgabe |
|---|---|
| `tests/run.js` | Mini-Test-Runner für Node: lädt Quelldateien in eine `vm`-Umgebung mit `window`, führt `tests/*.test.js` aus |
| `js/core.js` | Namensraum, `fmt`, `uid`, `esc` |
| `js/store.js` | Laden/Speichern `takt_v1` und `takt_run_v1`, Standardwerte |
| `js/plan.js` | Workout → Schrittliste |
| `js/engine.js` | Timer-Laufzeit mit Ereignissen, Pause, Sprung, ±15 s, Speichern/Wiederherstellen |
| `js/announce.js` | Entscheidet pro Ereignis, welche Sprachdateien und Töne kommen |
| `js/audio.js` | Web Audio: freischalten, Dateien laden, Töne und Dateien nacheinander abspielen |
| `js/wake.js` | Bildschirm-an |
| `js/app.js` | Screens Start, Training, Fertig; verdrahtet alles |
| `css/app.css` | Gestaltung nach Mockup A |
| `index.html` | App (ersetzt die Platzhalter-Startseite) |
| `data/strings.js` | `Takt.VOICE_LINES` (feste Sätze) |
| `data/exercises.js` | `Takt.EXERCISES`, Startbestand für das Test-Workout |
| `data/templates.js` | `Takt.TEMPLATES`, enthält das Test-Workout |
| `data/voice-manifest.js` | generiert: `Takt.VOICE_FILES` |
| `tools/voice-lines.js` | Node: gibt alle Ansagetexte als JSON aus |
| `tools/make_voice.py` | erzeugt `assets/voice/*.mp3` und `data/voice-manifest.js` |

---

### Task 1: Test-Runner, Grundfunktionen und Speicher

**Files:**
- Create: `tests/run.js`, `js/core.js`, `js/store.js`, `tests/core.test.js`, `tests/store.test.js`

**Interfaces:**
- Produces:
  - `tests/run.js`: `node tests/run.js` lädt der Reihe nach `data/*.js` (alphabetisch) und die Dateien `js/core.js, js/store.js, js/plan.js, js/engine.js, js/announce.js` (nur vorhandene) in einen gemeinsamen `vm`-Kontext mit `window` = Kontext, dann jede `tests/*.test.js`. Globale Helfer im Kontext: `test(name, fn)`, `eq(actual, expected, msg)` (Vergleich per `JSON.stringify`), `ok(value, msg)`, `FakeStorage()` (Objekt mit `getItem`, `setItem`, `removeItem`). Ausgabe je Test `ok`/`FAIL`, am Ende `N bestanden, M fehlgeschlagen`, Exit-Code 1 bei Fehlern. Zusätzlich prüft der Runner, dass in `js/` und `data/` kein `°` vorkommt.
  - `Takt.fmt(sec:number) -> string` „m:ss“, negative Werte → `"0:00"`, Eingabe wird abgerundet.
  - `Takt.uid(prefix:string) -> string` eindeutig, beginnt mit `prefix`.
  - `Takt.esc(s:any) -> string` HTML-escaped (`& < > " '`).
  - `Takt.store.defaults() -> Data` mit `{version:1, workouts:[], exercisesOwn:[], settings:{lang:'de', announce:'full', sounds:true, defaultWork:40, defaultRest:10, prepSeconds:5, debugClock:true, intensity:'normal', budgetLast:null, showImages:true}, log:[], learn:{}}`
  - `Takt.store.load(storage) -> Data` (fehlende Felder mit Standardwerten auffüllen, auch innerhalb `settings`), `Takt.store.save(data, storage) -> boolean`
  - `Takt.store.loadRun(storage) -> object|null`, `Takt.store.saveRun(snap, storage) -> boolean`, `Takt.store.clearRun(storage)`
  - `storage` ist optional und fällt auf `window.localStorage` zurück; jeder Zugriff steckt in try/catch.

- [ ] **Step 1: Failing tests schreiben** in `tests/core.test.js` und `tests/store.test.js`:
  - `fmt`: `fmt(0)==="0:00"`, `fmt(5)==="0:05"`, `fmt(65)==="1:05"`, `fmt(600)==="10:00"`, `fmt(-3)==="0:00"`, `fmt(59.9)==="0:59"`
  - `esc`: `esc('<a href="x">&\'')==='&lt;a href=&quot;x&quot;&gt;&amp;&#39;'`
  - `uid`: zwei Aufrufe mit `'w'` sind verschieden und beginnen mit `'w'`
  - `load leer`: `load(FakeStorage())` gleicht `defaults()`
  - `load mit kaputtem JSON`: Storage mit `takt_v1 = "{kaputt"` → `defaults()`
  - `load ergänzt fehlende settings`: gespeichert `{settings:{announce:'beeps'}}` → `settings.announce==='beeps'` und `settings.defaultRest===10`, `workouts` ist `[]`
  - `save und load`: Workout-Liste bleibt erhalten
  - `run speichern/löschen`: `saveRun({a:1})` → `loadRun()` gleicht `{a:1}`; nach `clearRun()` → `null`
- [ ] **Step 2:** `node tests/run.js` → FAIL (Funktionen fehlen)
- [ ] **Step 3:** `tests/run.js`, `js/core.js`, `js/store.js` umsetzen
- [ ] **Step 4:** `node tests/run.js` → alle bestanden
- [ ] **Step 5:** Commit `Schritt 1: Test-Runner, Grundfunktionen, Speicher` und Push

### Task 2: Übungs-Startbestand, Test-Workout und Schrittliste

**Files:**
- Create: `data/exercises.js`, `data/templates.js`, `js/plan.js`, `tests/plan.test.js`

**Interfaces:**
- Produces:
  - `Takt.EXERCISES`: Array mit genau diesen Einträgen (Felder laut Konzept 6.1: `id, name, alias:[], beschreibung, hinweis, tags:[], beidseitig:false, typ:'zeit', atem:null, bild:null, icon:'core'|'dehnen'|'beine'|'ganz', quelle:'takt'`):
    - `hampelmann` „Hampelmann“, `plank` „Plank“, `glute-bridge` „Glute Bridge“, `dead-bug` „Dead Bug“, `kindhaltung` „Kindhaltung“. Beschreibung je 1 bis 2 kurze Sätze.
  - `Takt.TEMPLATES`: Array mit einem Workout `{id:'test-core', name:'Test: Core kurz', theme:'core', defaultWork:30, defaultRest:10, source:'template', blocks:[{repeat:1, items:[{exId:'hampelmann', name:null, duration:30, rest:null, bilateral:false}]}, {repeat:2, items:[plank 30, glute-bridge 30, dead-bug 30 (alle rest:null)]}, {repeat:1, items:[{exId:'kindhaltung', duration:40, rest:0}]}]}`
  - `Takt.indexExercises(list) -> {[id]: exercise}`
  - `Takt.buildSteps(workout, exIndex, opts) -> Step[]`, `opts.prepSeconds` (Standard 0). `Step = {kind:'prep'|'work'|'rest', duration:int, exId:string|null, name:string, workIndex:int|null, round:int, rounds:int, blockIndex:int}`
  - `Takt.totalSeconds(steps) -> int`, `Takt.workCount(steps) -> int`
- Regeln für `buildSteps`:
  - Bei `prepSeconds > 0` zuerst ein `prep`-Schritt mit `exId`/`name` der ersten Übung.
  - Je Block `repeat` Runden (auf 1 bis 10 begrenzt, leere Blöcke übersprungen), je Runde alle Einträge als `work`. Dauer `item.duration ?? workout.defaultWork`.
  - Nach jedem `work` ein `rest` mit `item.rest ?? workout.defaultRest`, nur wenn > 0 und nicht nach dem allerletzten `work`. `rest` hat `exId:null, name:'Pause'`.
  - Name: `item.name` vor `exIndex[exId].name` vor `'Übung'`. `workIndex` zählt `work`-Schritte ab 0.

- [ ] **Step 1: Failing tests** in `tests/plan.test.js`:
  - `Test-Workout ohne prep`: 8 `work`-Schritte, 7 `rest`-Schritte, `totalSeconds === 320`
  - `Test-Workout mit prep 5`: erster Schritt `{kind:'prep', duration:5, exId:'hampelmann'}`, `totalSeconds === 325`
  - `kein rest nach letzter Übung`: letzter Schritt ist `work` `kindhaltung` mit 40
  - `Runden`: Schritt mit `exId:'plank'` kommt zweimal vor, mit `round` 1 und 2 und `rounds` 2
  - `rest 0 erzeugt keine Pause`; `repeat 0 wird zu 1`; `repeat 99 wird zu 10`; `leerer Block wird übersprungen`
  - `eigener Name`: Eintrag `{exId:null, name:'Mein Ding', duration:20}` → `name:'Mein Ding'`, `exId:null`
- [ ] **Step 2:** `node tests/run.js` → FAIL
- [ ] **Step 3:** Dateien umsetzen
- [ ] **Step 4:** `node tests/run.js` → alle bestanden
- [ ] **Step 5:** Commit `Schritt 1: Schrittliste und Test-Workout` und Push

### Task 3: Timer-Engine

**Files:**
- Create: `js/engine.js`, `tests/engine.test.js`

**Interfaces:**
- Consumes: `Step[]` aus Task 2
- Produces: `Takt.Engine(steps, opts)` mit `opts.now: () => ms` (Standard `Date.now`), Methoden:
  - `start() -> Event[]`
  - `tick() -> Event[]`
  - `toggle() -> boolean` (true = jetzt pausiert), `pause()`, `resume()`
  - `next() -> Event[]`, `prev() -> Event[]`, `adjust(deltaSec:int) -> Event[]`
  - `view() -> {index, step, next, nextWork, remaining:int, duration:int, paused:bool, done:bool, workPos:int, workTotal:int, remainingTotal:int, startedAt:ms, pausedSec:int}`
  - `snapshot() -> object` (JSON-tauglich, enthält `steps`), `Takt.Engine.restore(snap, opts) -> Engine`
  - Eigenschaft `adjustments: [{exId, delta}]`
  - `Event = {type:'step', index, catchUp:bool} | {type:'warn'} | {type:'count', n:1|2|3} | {type:'done'}`
- Regeln:
  - `remaining = ceil((duration*1000 - elapsedMs)/1000)`; bei Pause bleibt `elapsedMs` stehen; `resume` verschiebt den Schrittbeginn um die Pausenlänge.
  - Ist ein Schritt abgelaufen, beginnt der nächste genau am Ende des alten (Zeit wird mitgenommen, kein Drift). Mehrere abgelaufene Schritte in einem `tick` ergeben **ein** `step`-Ereignis mit `catchUp:true` für den aktuellen Schritt und keine `warn`/`count` für übersprungene. Nach dem letzten Schritt: `done`, danach liefert `tick` nichts mehr.
  - `warn` einmal, wenn ein `work`-Schritt mit Dauer ≥ 20 von über 10 auf ≤ 10 Restsekunden fällt.
  - `count` beim Wechsel auf 3, 2 und 1 Restsekunden, nur bei Schritten mit Dauer > 3. Springt ein `tick` über mehrere Zahlen, nur die kleinste.
  - `next()`: nächster Schritt beginnt jetzt (oder `done`). `prev()`: sind im Schritt mehr als 3 s vergangen, startet er neu, sonst vorheriger Schritt (mindestens Index 0). In Pause bleibt die Pause bestehen.
  - `adjust(d)`: ändert die Dauer des aktuellen Schritts um `d`; fällt sie unter die bereits vergangene Zeit, wirkt es wie `next()`. Bei `work` wird `{exId, delta:d}` in `adjustments` notiert.
  - `nextWork`: nächster `work`-Schritt nach `index` oder `null`. `workPos`: 1-basiert, Position des aktuellen bzw. nächsten `work`-Schritts.

- [ ] **Step 1: Failing tests** in `tests/engine.test.js` mit Uhr `var t=0; now=()=>t` und Schritten `[work 30 (a), rest 10, work 30 (b)]`:
  - `start`: `start()` liefert `[{type:'step', index:0, catchUp:false}]`, `view().remaining===30`
  - `warn bei 10`: `t=19000; tick()` → `[]`; `t=20000; tick()` → `[{type:'warn'}]`
  - `count 3 2 1`: bei `t=27000, 28000, 29000` je `{type:'count', n:3/2/1}`
  - `Wechsel ohne Drift`: `t=30500; tick()` → `[{type:'step', index:1, catchUp:false}]`, `view().remaining===10`
  - `catch-up nach 95 s`: von `start()` direkt `t=95000; tick()` → genau `[{type:'done'}]`; zweite Engine mit `t=45000` → `[{type:'step', index:2, catchUp:true}]` und `remaining===25`
  - `Pause`: `t=5000; toggle()`, `t=65000; tick()` → `[]`, `remaining===25`; `toggle()` bei `t=65000`, `t=66000` → `remaining===24`, `view().pausedSec===60`
  - `next und prev`: `t=2000; next()` → Index 1; `t=6000; prev()` → bleibt Index 1, `remaining===10`; `t=7000; prev()` → Index 0, `remaining===30`
  - `adjust plus`: `t=10000; adjust(15)` → `remaining===35`, `adjustments` gleicht `[{exId:'a', delta:15}]`
  - `adjust unter null`: `t=20000; adjust(-15)` → `[{type:'step', index:1, catchUp:false}]`, `remaining===10`
  - `done`: nach dem letzten Schritt `[{type:'done'}]`, danach `tick()` → `[]`, `view().done===true`
  - `snapshot und restore`: bei `t=40000` Snapshot, `JSON.parse(JSON.stringify(snap))`, `restore(snap,{now})` → gleicher `view().index` und `remaining`; `t=41000` weiter korrekt
  - `remainingTotal`: bei `t=0` nach `start()` gleich 70
- [ ] **Step 2:** `node tests/run.js` → FAIL
- [ ] **Step 3:** `js/engine.js` umsetzen
- [ ] **Step 4:** `node tests/run.js` → alle bestanden
- [ ] **Step 5:** Commit `Schritt 1: Timer-Engine` und Push

### Task 4: Katja-Sprachdateien und Ansage-Logik

**Files:**
- Create: `data/strings.js`, `tools/voice-lines.js`, `tools/make_voice.py`, `assets/voice/*.mp3` (generiert), `data/voice-manifest.js` (generiert), `js/announce.js`, `tests/announce.test.js`

**Interfaces:**
- Produces:
  - `Takt.VOICE_LINES = {ready:'Mach dich bereit.', go:'Los geht\'s!', pause:'Pause.', next:'Als Nächstes:', warn10:'Noch zehn Sekunden.', side:'Seite wechseln.', left:'Links.', right:'Rechts.', done:'Geschafft, super gemacht!'}`
  - `tools/voice-lines.js`: `node tools/voice-lines.js` gibt JSON `{key: text}` aus: alle `VOICE_LINES` plus `ex_<id>: name` für jede Übung in `Takt.EXERCISES`.
  - `tools/make_voice.py`: ruft `node tools/voice-lines.js` auf, erzeugt für jeden Schlüssel `assets/voice/<key>.mp3` mit `de-DE-KatjaNeural`, überspringt Schlüssel, deren Text sich laut bestehendem Manifest nicht geändert hat, entfernt nichts. Schreibt `data/voice-manifest.js`: `window.Takt=window.Takt||{}; Takt.VOICE_FILES={key:{src:'assets/voice/key.mp3', text:'…'}};`
  - `Takt.announce(event, ctx) -> Action[]`, `ctx = {steps, index, settings:{announce, sounds}, hasClip:(key)=>bool}`, `Action = {type:'clip', key} | {type:'beep', tone:'go'|'tick'|'warn'|'rest'|'end'}`
- Regeln `announce` bei `full`:
  - `step` auf `work`: `[beep go, clip ex_<exId>]`; ohne Datei nur `[beep go]`
  - `step` auf `rest`: `[clip pause, clip next, clip ex_<nextWork.exId>]`; fehlt die Übungsdatei, entfallen `next` und Übung
  - `step` auf `prep`: `[clip ready, clip ex_<exId>]`
  - `warn`: `[clip warn10]`; `count`: `[beep tick]`; `done`: `[beep end, clip done]`
  - Bei `name`: `work` → `[beep go, clip ex_…]`, `rest` → `[beep rest]`, `prep` → `[clip ex_…]`, `warn` → `[]`, `count` → `[beep tick]`, `done` → `[beep end]`
  - Bei `beeps`: alle Dateien weg; `work` → `go`, `rest` → `rest`, `prep` → `[]`, `warn` → `warn`, `count` → `tick`, `done` → `end`
  - Bei `silent`: immer `[]`. `sounds:false` entfernt alle `beep`. Fehlende Dateien (`hasClip` false) werden immer entfernt.

- [ ] **Step 1: Failing tests** in `tests/announce.test.js` mit den Schritten des Test-Workouts (prep 5) und `hasClip = () => true`:
  - `work full` (Index 1, Hampelmann): `[{type:'beep',tone:'go'},{type:'clip',key:'ex_hampelmann'}]`
  - `rest full` (Index 2): `[{clip pause},{clip next},{clip ex_plank}]`
  - `prep full`: `[{clip ready},{clip ex_hampelmann}]`
  - `eigene Übung ohne Datei`: `hasClip = k => k !== 'ex_x'` → `work` ergibt nur `[{beep go}]`
  - `beeps`, `name`, `silent` und `sounds:false` je ein Fall nach den Regeln oben
- [ ] **Step 2:** `node tests/run.js` → FAIL
- [ ] **Step 3:** `data/strings.js`, `js/announce.js`, `tools/voice-lines.js`, `tools/make_voice.py` umsetzen
- [ ] **Step 4:** `node tests/run.js` → alle bestanden
- [ ] **Step 5:** `python tools/make_voice.py` → meldet 14 erzeugte Dateien (9 Sätze + 5 Übungen); zweiter Aufruf meldet 0 erzeugt. Im Vorschau-Browser jede Datei per `decodeAudioData` dekodierbar, Dauer jeweils zwischen 0,5 und 4 s.
- [ ] **Step 6:** Commit `Schritt 1: Katja-Ansagen und Ansage-Logik` und Push

### Task 5: Oberfläche, Ton, Bildschirm-an und Verdrahtung

**Files:**
- Create: `js/audio.js`, `js/wake.js`, `js/app.js`, `css/app.css`
- Modify: `index.html` (komplett ersetzen), `README.md`

**Interfaces:**
- Consumes: alles aus Task 1 bis 4
- Produces:
  - `Takt.audio.unlock() -> Promise` (AudioContext beim Tippen anlegen, `navigator.audioSession.type='ambient'`, `resume()`), `Takt.audio.unlocked() -> boolean`, `Takt.audio.hasClip(key) -> boolean` (laut `Takt.VOICE_FILES`), `Takt.audio.load(keys) -> Promise<int>` (holt und dekodiert, Fehler werden still übergangen), `Takt.audio.play(actions)` (bricht laufende Ansage ab, spielt Töne und Dateien nacheinander mit 0,12 s Abstand). Töne: `tick` 880 Hz 0,15 s, `go` 1320 Hz 0,35 s, `warn` 660 Hz 0,25 s, `rest` 520 Hz 0,3 s, `end` 1320 Hz 0,6 s.
  - `Takt.wake.on() -> Promise<boolean>`, `Takt.wake.off()`; holt sich die Sperre nach `visibilitychange` zurück, solange `on`.
- Verhalten `app.js`:
  - **Start-Screen:** Kopf „Takt“ mit Unterzeile „Dein Training, dein Takt“; Karte je Vorlage (Name, Dauer `fmt(totalSeconds)`, Anzahl Übungen, Thema-Farbe, Knopf „Start“); darunter Hinweis „Vor dem Start: Schalter auf Klingeln und Musik in Spotify starten.“
  - **Start-Tipp:** `audio.unlock()`, `audio.load(alle Schlüssel des Workouts)`, `wake.on()`, `buildSteps` mit `settings.prepSeconds`, `Engine.start()`, Training-Screen.
  - **Training-Screen** wie `mockups/training-a.html`: Name des Workouts, „Übung x von y · noch m:ss“, Punkte-Leiste (ab 25 Übungen durchgehender Balken), Ring mit Phase („Gleich geht's los“ bei prep, „Pause“ bei rest), Zeit, „von m:ss“, Icon, Übungsname, Beschreibung; Leiste „Als Nächstes“ (während `work` mit folgender Pause: „Pause“ + Dauer, sonst nächste Übung); Knöpfe Zurück, −15, Pause/Weiter, +15, Weiter; Tippen auf die Mitte = Pause/Weiter; „✕“ fragt „Training beenden?“. Ring-Farbe = Thema-Farbe, in der Pause Lila.
  - **Test-Hilfe** bei `settings.debugClock`: kleine Zeile „Start 10:13:10 · seit Start 1:36 · Pausen 0:00 · Rest gesamt 3:49“.
  - **Takt:** alle 250 ms `tick()`, Ereignisse an `announce` → `audio.play`, Anzeige neu; `saveRun(snapshot)` höchstens einmal pro Sekunde und bei jeder Bedienung.
  - **Neu laden:** liegt ein laufendes Training in `takt_run_v1`, direkt Training-Screen mit wiederhergestellter Engine; Banner „Einmal tippen, damit der Ton wieder geht“, verschwindet nach dem ersten Tippen (`unlock` + `load`).
  - **Fertig:** Log-Eintrag `{id, workoutId, name, date (ISO), plannedSec, actualSec, adjustments}` in `takt_v1.log`, `clearRun`, `wake.off()`; Screen „Geschafft!“ mit Dauer und Anzahl Übungen, Knöpfe „Nochmal“ und „Zur Startseite“.
  - Wird Bildschirm-an verweigert: einmalige Meldung „Bildschirm bleibt evtl. nicht an. Stromsparmodus aus?“.

- [ ] **Step 1:** Dateien umsetzen; `node --check` auf alle `js/*.js` → ohne Fehler; `node tests/run.js` → alle bestanden
- [ ] **Step 2: Browser-Prüfung Handy-Format 375 × 812** über `http://localhost:8765/`: Start-Screen zeigt „Test: Core kurz · 5:25“; Start → Training-Screen ohne Konsolenfehler; `Weiter` springt durch alle Schritte bis „Geschafft!“; Log-Eintrag vorhanden; `takt_run_v1` danach leer
- [ ] **Step 3: Browser-Prüfung Neuladen:** Training starten, zwei Schritte weiter, Seite neu laden → Training-Screen mit gleichem Schritt, Banner sichtbar
- [ ] **Step 4: Browser-Prüfung 375 × 667:** Ring, Name, „Als Nächstes“ und alle fünf Knöpfe sichtbar ohne Scrollen (`document.scrollingElement.scrollHeight <= innerHeight`)
- [ ] **Step 5:** Agent `html-app-tester` statisch über `index.html` und `js/` laufen lassen; echte Fehler beheben
- [ ] **Step 6:** `README.md`: Link zur App oben, Hinweis `node tests/run.js` und `python tools/make_voice.py`
- [ ] **Step 7:** Commit `Schritt 1: Training-Screen und App` und Push

### Task 6: Live prüfen und an Nicole übergeben

- [ ] **Step 1:** Warten, bis `https://nicolehahn2890.github.io/takt/` und `.../assets/voice/go.mp3` HTTP 200 liefern
- [ ] **Step 2:** Live-Seite im Vorschau-Browser: Start-Screen, Training startet, keine Konsolenfehler, Sprachdateien laden (Netzwerk 200)
- [ ] **Step 3:** `docs/KONZEPT.md` Abschnitt 8: Schritt 1 als erledigt markieren; Memory-Stand aktualisieren; Commit und Push
- [ ] **Step 4:** Nicole bekommt eine kurze iPhone-Checkliste: Spotify läuft weiter bei Ansagen, Katja verständlich, Bildschirm bleibt an, Wechsel zu Spotify und zurück, Restzeit mit der Test-Hilfe gegen die iPhone-Uhr vergleichen, Neuladen mitten im Training.
