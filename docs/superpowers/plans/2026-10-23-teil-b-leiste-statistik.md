# Teil B: Leiste unten und Statistik – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Takt bekommt eine Leiste unten (Home, Bibliothek, Statistik) und eine Statistik-Seite, die Trainingsminuten pro Woche/Monat/Jahr, den Vergleich zur Vorperiode und den häufigsten Körperbereich zeigt.

**Architecture:** Die Ablauf-Engine merkt sich je Schritt die tatsächlich verbrachte Zeit; daraus schreibt `finish()` neue Felder ins Protokoll (`activeSec`, `theme`, `areaSec`). Reine Rechen-Logik (Zeiträume, Summen, Balken, Vergleich, Bereich, Texte) liegt in `js/stats.js` und wird in Node getestet; `js/statsview.js` zeichnet die Seite. Die Leiste ist ein festes Element in `index.html`, `show()` in `app.js` blendet sie auf den drei Hauptseiten ein.

**Tech Stack:** wie bisher (Vanilla JS an `window.Takt`, `node tests/run.js`, Design v2).

**Spec:** `docs/superpowers/specs/2026-10-23-teil-b-leiste-statistik-design.md`

## Global Constraints

- Alles aus Schritt 3 und Design v2 gilt: Keys `takt_v1`/`takt_run_v1` nie umbenennen; `js/` nur ASCII (`python tools/ascii_js.py`); Design-Werte aus `docs/design_handoff_takt_redesign/`; keine Icons, nur Text und Zeichen; **kein `backdrop-filter`** (iOS zeichnet sonst unscharf).
- Bei jedem Push mit geänderten App-Dateien `?v=` hochzählen (Start: `v=24`).
- GitHub nur Privatkonto (`nicolehahn2890/takt`), Push mit Privat-Token, danach `git status -sb` = „main...origin/main“, nichts offen.
- Alte Protokoll-Einträge bleiben unverändert und zählen bei Minuten/Balken/Ring mit (`activeSec` fehlt → `actualSec`), beim Bereich nicht.
- Ortszeit; Woche Mo–So; ein Training zählt zum Datum seines Endes.
- Bereiche (Reihenfolge = Gleichstand-Regel, Farbe): core „Core & Vacuum“ `#C6C5A6` (Tags vacuum, core) · bauch „Bauch“ `#BE7B9D` · beine „Beine & Po“ `#C4A882` (beine-po) · ruecken „Rücken“ `#8AB4C4` · dehnen „Dehnen“ `#A8C4A0` · yoga „Yoga“ `#B794C5` · atmung „Atmung“ `#E2A9C4` · ganz „Ganzkörper“ `#E3A3BF` (ganzkoerper, oberkoerper; nur `aufwaermen` → ganz) · sonst „Sonstiges“ (keine passenden Tags; nie häufigster Bereich, wenn ein anderer existiert).

## Review Focus

1. **Zeitumstellung und Grenzen:** Woche mit dem 25. 10. 2026 (Sommerzeit-Ende), Monatswechsel, Jahreswechsel, 29. Februar: Zeiträume beginnen Mo/1./1.1. um 0 Uhr Ortszeit, kein Training fällt doppelt oder gar nicht. Tests in Task 3.
2. **Leeres oder altes Protokoll:** keine Trainings, nur alte Einträge ohne `areaSec`, kaputte Einträge: Seite zeigt sinnvolle Texte, kein Absturz, Bereich-Karte versteckt. Tests in Task 3, Browser in Task 5.
3. **Neuladen mitten im Training:** die verbrachte Zeit je Schritt bleibt erhalten, `activeSec` stimmt danach. Test in Task 1.
4. **Leiste verdeckt nichts:** nicht im Training, Editor, Vorschau, Detail, eigener Übung, Auswahl, Geschafft; auf den Hauptseiten bleibt der letzte Inhalt erreichbar; Toast und Fenster liegen darüber. Browser in Task 4.
5. **31 Balken bei 320 px** lesbar und antippbar, Auswahlzeile stimmt. Browser in Task 5.

---

## Dateien

| Datei | Aufgabe |
|---|---|
| `js/engine.js` | verbrachte Zeit je Schritt (`spent`), `activeSec` in `view()` |
| `js/stats.js` (neu) | `AREAS`, `areaOf`, `areaSeconds`, `entrySeconds`, `periodRange`, `periodStats` |
| `js/statsview.js` (neu) | Statistik-Seite zeichnen und bedienen |
| `js/app.js` | Protokoll-Felder, Geschafft-Zeit, Leiste in `show()`, Reiter-Wechsel |
| `js/workouts.js` | `weekStats` nutzt `entrySeconds` |
| `js/home.js`, `js/library.js` | Bibliothek-Karte weg, Bibliothek ohne Zurück als Reiter |
| `index.html`, `css/app.css` | Leiste, Statistik-Seite, Platz unten |
| `tests/engine.test.js`, `tests/stats.test.js` (neu), `tests/workouts.test.js`, `tests/run.js` | Tests |

---

### Task 1: Engine merkt sich die verbrachte Zeit

**Files:** Modify `js/engine.js`, `tests/engine.test.js`

**Interfaces – Produces:** Zustand `st.spent: number[]` (ms je Schritt, Start 0, beim Wiederherstellen alter Stände ergänzt); `view().activeSec` = gerundete Summe von `spent` plus die bisher im aktuellen Schritt verbrachte Zeit (höchstens dessen Dauer), Pausieren nie mitgezählt; `api.spentSeconds() -> number[]` (Sekunden je Schritt, gerundet).

**Regeln:** Beim regulären Ende eines Schritts (`tick`) zählt seine volle (ggf. angepasste) Dauer; beim Springen (`next`, `prev`, `adjust` über das Ende hinaus) und bei `finish` die bisher verbrachte Zeit, höchstens die Dauer; `prev` innerhalb eines Schritts zählt die bisherige Zeit und beginnt neu.

- [ ] Failing tests (mit Fake-Uhr): `engine spent volle Schritte` (2 Schritte à 10 s durchlaufen → `[10,10]`, `activeSec` 20); `engine spent Ueberspringen` (nach 4 s `next` → erster Schritt 4); `engine spent ohne Pausieren` (5 s laufen, 30 s pausiert, 5 s laufen → 10); `engine spent nach Ende gesperrt` (Uhr 10 Min. nach Ablauf-Ende, `tick` → `activeSec` = Summe der Dauern); `engine spent mit +15` (Dauer 10 + 15 → 25 gezählt); `engine spent bleibt nach restore` (Snapshot mitten im 2. Schritt, `restore`, weiterlaufen → Summe stimmt); `engine restore alter Snapshot ohne spent` (kein Absturz, `activeSec` ≥ 0)
- [ ] FAIL sehen → umsetzen → alle grün; Commit `Teil B: Engine merkt sich Trainingszeit`, Push, synchron prüfen

### Task 2: Bereiche und Protokoll

**Files:** Create `js/stats.js` (erster Teil); Modify `tests/run.js` (lädt `js/stats.js`), `js/app.js` (`finish`), `js/workouts.js` (`weekStats`), `tests/stats.test.js` (neu), `tests/workouts.test.js`

**Interfaces – Produces:** `Takt.AREAS` (Liste aus Global Constraints, Objekte `{key,label,color,tags}`); `Takt.areaOf(exercise) -> key`; `Takt.areaSeconds(steps, spentSec, exIndex) -> { [key]: sec }` (nur `kind:'work'`, Sekunden > 0); `Takt.entrySeconds(entry) -> int` (`activeSec` wenn Zahl ≥ 0, sonst `actualSec`, sonst 0).
**Protokoll:** `finish()` ergänzt `activeSec` (`view().activeSec`), `theme`, `areaSec`; „Geschafft“ zeigt `activeSec`. `weekStats` summiert `entrySeconds`.

**Regel `areaOf`:** der erste Tag **in der Reihenfolge der Übung**, der zu einem Bereich gehört (der erste Tag ist in `data/exercises.js` der Haupt-Bereich); `aufwaermen` wird übersprungen; nur `aufwaermen` → ganz; kein passender Tag → sonst.

- [ ] Failing tests: `areaOf erster Tag der Uebung` (plank → core, crunch → bauch, glute-bridge → beine, katze-kuh → dehnen, vacuum-stehend → core, hampelmann → ganz, schulterkreisen → dehnen, eigene Übung ohne Tags → sonst); `areaSeconds nur Uebungen` (prep/rest ignoriert, zwei Übungen gleichen Bereichs summiert); `entrySeconds alt und neu`; `weekStats nutzt activeSec`
- [ ] FAIL → umsetzen → grün; Browser: Training durchspielen, Protokoll-Eintrag hat die drei Felder, Geschafft zeigt aktive Zeit; Commit `Teil B: Bereiche und Protokoll`, Push, synchron prüfen

### Task 3: Statistik-Logik

**Files:** Modify `js/stats.js`, `tests/stats.test.js`

**Interfaces – Produces:**
- `Takt.periodRange(kind:'week'|'month'|'year', offset:int<=0, now:Date) -> { start:Date, end:Date }` (Ende exklusiv, 0 Uhr Ortszeit)
- `Takt.periodStats(log, kind, offset, now) -> { label, current, seconds, count, bars:[{ label, seconds, start:Date, today }], compare:{ prevSeconds, pct|null, state:'up'|'down'|'same'|'noprev'|'empty', text }, ring:0..1, top:{ key, label, color, share, seconds }|null, selected:int }`
- Texte: `label` „Diese Woche“ / „Letzte Woche“ / „13.–19. Okt.“ (über Monatsgrenze „27. Okt.–2. Nov.“), „Oktober 2026“, „2026“; Balken-Beschriftung Woche „Mo“…„So“, Monat Tageszahl, Jahr „J F M A M J J A S O N D“; `compare.text` laut Spec („+10 % zur Vorwoche (bis Dienstag)“, „−5 % zum Vormonat (bis zum 21.)“, „+30 % zum Vorjahr (bis 23. Okt.)“, „gleich viel wie letzte Woche“, „Letzte Woche kein Training“, „Noch kein Training“, „Kein Training“); `ring` = `seconds / prevSeconds` gedeckelt auf 1 (noprev → 1, empty → 0); `selected` = heute (laufend) bzw. letzter Balken mit Training, sonst −1.

- [ ] Failing tests: `periodRange Woche Mo bis So` (Do 22.10.2026 → Mo 19.10.–Mo 26.10.); `periodRange Sommerzeit-Ende` (Woche 19.–25.10.2026: Training So 25.10. 23:30 zählt in diese Woche, Mo 26.10. 0:30 in die nächste); `periodRange Monat und Jahr mit offset`; `periodStats Balken` (7/31/12 Balken, Summen stimmen); `periodStats Vergleich gleiche Spanne` (Di: 20 Min. gegen 18 Min. Mo–Di der Vorwoche → „+11 % zur Vorwoche (bis Dienstag)“, Training Mi der Vorwoche zählt nicht); `periodStats Vormonat kuerzer` (31.3. gegen Februar bis 28./29.); `periodStats vergangen ganz gegen ganz`; `periodStats leer und alt` (leeres Log, Einträge ohne `areaSec`, kaputter Eintrag → kein Fehler, `top` null); `periodStats Bereich Anteil` (Anteile aus `areaSec`, Gleichstand nach Reihenfolge, sonst nie vor anderem)
- [ ] FAIL → umsetzen → grün; Commit `Teil B: Statistik-Logik`, Push, synchron prüfen

### Task 4: Leiste unten, Bibliothek als Reiter

**Files:** Modify `index.html`, `css/app.css`, `js/app.js` (`show`, Reiter-Klicks), `js/home.js` (Bibliothek-Karte weg), `js/library.js` (kein Zurück auf Hauptseite)

**Aussehen:** feste Leiste unten, max. 560 px, Hintergrund `#171217` deckend mit oberer Linie `rgba(255,255,255,.07)`, Innenabstand `8px 16px calc(8px + env(safe-area-inset-bottom))`, drei gleich breite Knöpfe 44 px hoch, Radius rund, Schrift 15 px; aktiv Lavendel-Pille mit `#171217` fett, sonst `#a8949f` 600; Druck `scale(.96)`.
**Verhalten:** sichtbar nur bei `start`, `lib`, `stats`; Seiten mit Leiste bekommen unten zusätzlich Platz; Toast liegt darüber. Home-Reiter → Startseite, Bibliothek → `T.library.open()`, Statistik → Statistik-Seite (bis Task 5: leere Seite mit Titel).

- [ ] Umsetzen; Tests grün; Browser 375 × 667 und 320 px: Leiste auf den 3 Hauptseiten, nicht in Training, Geschafft, Vorschau, Editor, Auswahl, Detail, eigener Übung; letzter Inhalt jeder Hauptseite oberhalb der Leiste erreichbar; Commit `Teil B: Leiste unten`, Push, synchron prüfen

### Task 5: Statistik-Seite

**Files:** Create `js/statsview.js`; Modify `index.html`, `css/app.css`, `js/app.js` (Reiter öffnet Seite)

**Aussehen (Design v2):** Titel „Statistik“ Outfit 600 32 px; Segmente Woche/Monat/Jahr wie im Anpassen-Fenster; Zeile ‹ Zeitraum › (‹ › als 44-px-Rundknöpfe ohne Fläche, Zeitraum 17 px Outfit, › aus beim laufenden Zeitraum); Ring 200 px, Strich 11, Spur `rgba(255,255,255,.08)`, Füllung Salbei, in der Mitte Minuten Outfit 600 40 px mit „Min.“ 17 px und darunter „3 Trainings“ 13 px muted, unter dem Ring der Vergleichstext 14 px muted; Balken auf `--card`-Fläche Radius 18, Innenabstand 16, Höhe 120 px, Balken Lavendel Radius 4 oben, heute/aktueller Monat Rosé, gewählter Balken voll deckend und andere 70 %, Beschriftung 11 px muted, Auswahlzeile 14 px („Di, 21. Okt. · 25 Min.“); Bereich-Karte wie Workout-Karte: Titel „Häufigster Bereich“ 17 px, Farbpunkt 9 px, Name Outfit 18, rechts „42 %“, darunter „12 Min. Übungszeit“; ohne Bereich-Daten keine Karte.

- [ ] Umsetzen; Tests grün; Browser mit Beispiel-Protokoll (per Konsole erzeugt, danach wieder entfernt): alle drei Ansichten, ‹ › blättern, Balken antippen, leere Woche, nur alte Einträge; 375 und 320 px ohne Querscrollen; Bildschirmfotos
- [ ] Commit `Teil B: Statistik-Seite`, Push, synchron prüfen

### Task 6: Prüfung und Übergabe

- [ ] Frischer Gesamt-Prüfer (Review Focus oben), wichtige Funde mit Test/Messung beheben, Kleinigkeiten in `KONZEPT.md` 8.5
- [ ] `?v=` hoch, Commit, Push, warten bis live, Live-Prüfung, synchron prüfen; Bildschirmfotos und iPhone-Checkliste an Nicole

---

## Kostenschätzung

| Teil | Tokens (grob) |
|---|---|
| Task 1 Engine | 20.000 |
| Task 2 Bereiche + Protokoll | 20.000 |
| Task 3 Statistik-Logik | 35.000 |
| Task 4 Leiste | 25.000 |
| Task 5 Statistik-Seite | 40.000 |
| Task 6 Prüfung, Übergabe | 35.000 |
| **Summe** | **ca. 175.000** |

---

## Umsetzung: Entscheidungen und zurückgestellte Punkte (2026-10-23)

Aus dem Arbeitsprotokoll. Format: Entscheidung — Grund — Kosten, falls falsch.

### Entscheidungen

- Setup: Ruling: direkt auf main, Push mit Privatkonto, Sync-Check nach jedem Task — Nicoles Vorgaben — Kosten: keine
- Task 1: Ruling: prev() innerhalb eines Schritts verbucht die bisherige Zeit und zaehlt beim Wiederholen erneut — es ist tatsaechlich trainierte Zeit — Kosten: keine
- Task 3: Ruling: Text ohne Training in der Vorperiode einheitlich "Vorwoche/Vormonat/Vorjahr ohne Training" statt "Letzte Woche kein Training" — passt zu "+10 % zur Vorwoche" und stimmt auch beim Zurueckblaettern — Kosten: nur Wortlaut
- Task 3: Ruling: Testfall Datums-Spanne ueber Monatsgrenze auf Woche -2 gesetzt (Woche -1 heisst immer "Letzte Woche") — Testfehler, nicht Code — Kosten: keine
- Zwischen-Fix (Nicole, iPhone): Ruling: Kopfleisten der Unterseiten nicht mehr fixiert — iOS 26 legt ueber fixierte Leisten am oberen Rand einen Glas-Schleier (Titel unscharf trotz entferntem backdrop-filter; nur Seiten mit fixierter Leiste betroffen, Startseite nicht) — Kosten falls falsch: Kopfleiste scrollt weg (Abweichung vom Design-TopBar), Schleier bliebe
- Task 5: Ruling: bei 320 px sind Monats-Balken nur ca. 6 px breit (volle Hoehe antippbar) — 31 Tage passen sonst nicht — Kosten: auf sehr kleinen Handys fummelig
- Zwischen-Fix (Nicole, iPhone v=28): Ruling: Ursache korrigiert — Glas-Schleier haengt an der Position oben (auch ohne fixierte Leiste unscharf); Ueberschriften auf allen Seiten 40 px tiefer (--glass-top), Kopfleisten bleiben nicht fixiert — Kosten falls falsch: mehr Leerraum oben
- Final: Ruling: gesperrtes Handy mitten im Training zaehlt als Trainingszeit (Ablauf laeuft mit Ton weiter); "Sonstiges" nie haeufigster Bereich neben anderen; Wochenlabel ueber Neujahr ohne Jahr; kleiner Punkt im leeren Ring wie im Trainingsring; geringe Kontrastwerte ausgegrauter Knoepfe (Nicoles Wunsch); Speichern-Pill im Editor scrollt weg (Fuss-Knopf bleibt) — vom Pruefer bewusst ausgelassen, bleiben so — Kosten: keine

### Zurückgestellt (klein, auch in KONZEPT.md 8.5)

- Segment-Umschalter Woche/Monat/Jahr hat role=radiogroup ohne radio/aria-checked (VoiceOver)
- Vergleichstext "(bis zum 31.)" obwohl der Vormonat schon am 28. endet (Fenster selbst richtig)
- Rundung je Schritt kann areaSec-Summe um wenige Sekunden ueber activeSec heben (nach Minuten-Rundung unsichtbar)
- Training, das waehrend des Updates lief, verliert die Zeit der Schritte davor (einmalig)
- ungenutzter Zurueck-Knopf der Bibliothek samt Listener im Code
- auf dem iPhone pruefen, ob die Leiste unten beim Tippen in der Suche ueber der Tastatur haengt
