# Takt: Leiste unten und Statistik (Teil B)

Stand 2026-10-23 · baut auf Design v2 (Teil A) auf · Gestaltung nach `docs/design_handoff_takt_redesign/` (Skill `takt-design`)

## Absicht

Nicole will zwischen Start, Übungen und ihrer Trainings-Statistik mit einem Tipp wechseln (Idee aus GPT-Mocks, Aussehen aus dem Claude-Design). Die Statistik soll zeigen, wie viel sie trainiert, ob sie mehr oder weniger macht als vorher und welchen Körperbereich sie am meisten trainiert.

## Ziele

1. **Leiste unten** mit drei Reitern: Home, Bibliothek, Statistik. Nur Text, der aktive Reiter als Lavendel-Pille mit dunkler Schrift, die anderen grau; keine Symbole (Design-Regel). Sichtbar nur auf den drei Hauptseiten; Training, Geschafft, Vorschau, Editor, Auswahl, Übungs-Detail und eigene Übung zeigen sie nicht.
2. **Bibliothek-Reiter** = die bestehende Übungs-Bibliothek (Suche, Filter, Detail, eigene Übung) ohne Stufen-Filter. Auf Home entfällt die Karte „Bibliothek / Übungen“; in der Bibliothek entfällt der Zurück-Knopf (Hauptseite).
3. **Statistik-Seite:**
   - Umschalter Woche / Monat / Jahr (Segmente wie im Anpassen-Fenster).
   - Zeitraum mit ‹ › blättern: „Diese Woche“ / „Letzte Woche“ / sonst Datumsspanne („13.–19. Okt.“); Monat „Oktober 2026“; Jahr „2026“. › endet beim aktuellen Zeitraum.
   - **Ring = Vergleich zur Vorperiode:** füllt sich mit aktuellen Minuten im Verhältnis zur Vorperiode; über 100 % voll, Zusatz „+20 % zur Vorwoche“ (bzw. „−15 % …“, „gleich viel wie …“); ohne Training in der Vorperiode voll mit „Erste Woche mit Training“ (Monat/Jahr sinngemäß); ohne Training im Zeitraum leer mit „Noch kein Training“. In der Mitte die Minuten groß (Outfit) mit „Min.“ und darunter „x Trainings“.
   - **Balken:** Woche 7 Balken Mo–So, Monat ein schmaler Balken pro Tag, Jahr 12 Balken Jan–Dez; Höhe nach Minuten; der heutige Tag bzw. aktuelle Monat hervorgehoben.
   - **Häufigster Bereich:** Körperbereich mit der meisten Trainingszeit im Zeitraum (Core & Vacuum, Bauch, Beine & Po, Rücken, Dehnen, Yoga, Atmung, Ganzkörper), mit Farbpunkt, Anteil in % und Minuten. Gezählt nach den Übungen, nicht nach dem Workout-Thema.
4. **Trainingszeit ohne Pausieren:** Die Minuten eines Trainings zählen ohne die Zeit, in der Nicole auf Pause getippt hat (die eingeplanten Pausen zwischen Übungen zählen mit). Gilt für neue Trainings, für die Statistik und für „Diese Woche“ auf Home.

## Nicht-Ziele

- Kein Profil-Reiter, keine Begrüßung mit Namen, kein Wochenziel.
- Keine Liste der einzelnen Trainings (kommt mit dem Tagebuch in Schritt 4).
- Keine Stufen (Anfänger/Fortgeschritten) für Übungen.
- Keine Änderung an Workouts, Vorlagen, Mix, Editor-Verhalten.

## Anti-Ziele

- Alte Trainings gehen verloren oder verfälschen die Statistik (z. B. doppelt gezählt).
- Die Leiste verdeckt Inhalte oder Knöpfe (Start-Knöpfe, Fußleisten, Hinweise) oder erscheint im Training.
- Woche beginnt nicht am Montag oder Tage verrutschen um Mitternacht/Zeitumstellung (Ortszeit).
- Statistik ruckelt oder lädt lange bei vielen Trainings (hunderte Einträge).

## Daten

- Neues Feld je Trainings-Eintrag im Protokoll (`takt_v1.log[]`, Key bleibt): `activeSec` (Sekunden ohne Pausieren), `theme` (Workout-Thema), `areaSec` (Sekunden je Körperbereich aus den tatsächlich gelaufenen Übungen). `actualSec` bleibt wie bisher (Zeit seit Start), damit alte und neue Einträge vergleichbar gespeichert sind.
- Minuten eines Eintrags = `activeSec`, falls vorhanden, sonst `actualSec` (alte Einträge).
- Körperbereich einer Übung = ihr erster Tag (Reihenfolge wie in der Bibliothek, der erste Tag ist der Haupt-Bereich), der zu einem Bereich gehört: vacuum/core → Core & Vacuum, bauch, beine-po, ruecken, dehnen, yoga, atmung, ganzkoerper/oberkoerper → Ganzkörper; `aufwaermen` zählt nur, wenn die Übung sonst keinen Bereich hat (dann Ganzkörper). Die Reihenfolge der Bereiche entscheidet nur bei Gleichstand der Minuten. Eigene Übungen nach ihren Tags; ohne Tag „Sonstiges“ (nicht als häufigster Bereich gezeigt, wenn ein anderer existiert).
- Gezählt wird die **tatsächlich verbrachte Zeit** je Übung (übersprungene Übungen zählen nur die gelaufenen Sekunden, +15/−15 eingerechnet, ohne Pausieren).
- Alte Einträge ohne `areaSec` zählen bei Minuten, Balken und Ring mit, beim häufigsten Bereich nicht.

## Festgelegt von Nicole (2026-10-23)

- Leiste: Home, Bibliothek, Statistik; nur Text, aktiv als Pille. Kein Profil.
- Bibliothek: Übungen, ohne Stufen-Filter.
- Statistik: Woche/Monat/Jahr, Ring als Vergleich zur Vorperiode, Balken pro Tag (Woche, Monat) und pro Monat (Jahr), häufigster Bereich nach Übungen, Blättern mit ‹ ›.
- Pausieren zählt nicht als Trainingszeit.

## Meine Festlegungen (Nicole kann widersprechen)

- Ring-Darstellung und Texte wie unter Ziel 3; Ringfarbe Salbei, Balken Lavendel, aktueller Tag/Monat Rosé; Ring 11 px Strich wie im Training.
- Statistik-Seite im Stil der Startseite (Titel „Statistik“ Outfit 32 px wie die Marke, Abschnittstitel 24 px), Bereich als Karte wie im Design (Fläche `#241B23`, Radius 18).
- Wo die Leiste sichtbar ist, bekommen die Seiten unten Platz (keine Inhalte darunter); der Hinweis-Toast sitzt über der Leiste.
- Leiste deckend (`#171217`) ohne Weichzeichner (`backdrop-filter`): iOS-Safari zeichnet sonst Text und Knöpfe darin unscharf (auf Nicoles iPhone bei den Kopfleisten beobachtet, 2026-10-23).
- Zuletzt gewählter Reiter wird nicht gespeichert; die App startet immer auf Home (laufendes Training hat Vorrang wie bisher).
- Die Statistik zeigt nur abgeschlossene Trainings (wie das Protokoll heute).

## Nach der Bau-Prüfung geklärt

- **Vergleich laufender Zeitraum (Nicole):** Die laufende Woche / der laufende Monat / das laufende Jahr wird mit **gleich vielen Tagen** der Vorperiode verglichen (Woche: Mo bis heutiger Wochentag; Monat: Tag 1 bis heutiger Tag, bei kürzerem Vormonat bis zu dessen letztem Tag; Jahr: 1. Januar bis heutiges Datum im Vorjahr, 29. Februar → 28.). Text z. B. „+10 % zur Vorwoche (bis Dienstag)“, „−5 % zum Vormonat (bis zum 21.)“, „+30 % zum Vorjahr (bis 23. Okt.)“. Abgeschlossene Zeiträume (beim Blättern) ganz gegen ganz, ohne Zusatz in Klammern.
- **Ring-Texte (meine Festlegung):** Vorperiode ohne Training → Ring voll, „Letzte Woche kein Training“ / „Letzten Monat …“ / „Letztes Jahr …“ (kein „Erste Woche“, weil es nach einer Pause falsch wäre). Zeitraum ohne Training → Ring leer, „Noch kein Training“ (laufend) bzw. „Kein Training“ (vergangen). Gleich viel (±2 %) → „gleich viel wie letzte Woche“.
- **`areaSec` (meine Festlegung):** nur Sekunden der Übungsschritte (ohne eingeplante Pausen und Vorbereitung), tatsächlich gelaufen, ohne Pausieren. Anteil = Bereich ÷ Summe aller `areaSec` im Zeitraum (nur neue Einträge, ergibt zusammen 100 %). Die Karte zeigt „42 %“ und „12 Min. Übungszeit“, damit klar ist, dass Pausen dort fehlen.
- **`activeSec` (meine Festlegung):** Summe der tatsächlich in den Schritten verbrachten Zeit ohne Pausieren; Zeit nach dem Ende des Ablaufs (z. B. Handy gesperrt, Training lief zu Ende) zählt nicht. „Geschafft“ zeigt künftig diese Zeit. Dafür merkt sich die Ablauf-Engine je Schritt die verbrachte Zeit (bleibt beim Neuladen mitten im Training erhalten).
- **Balken lesbar (meine Festlegung):** Jede Ansicht skaliert auf ihren eigenen Höchstwert; unter dem Diagramm eine Zeile mit dem gewählten Balken („Di, 21. Okt. · 25 Min.“). Antippen eines Balkens wählt ihn; anfangs ist heute (laufender Zeitraum) bzw. der letzte Balken mit Training gewählt. Achse nur mit Beschriftung unten (Woche Mo–So, Monat 1/8/15/22/29, Jahr J–D).
- **Weitere Festlegungen:** Ein Training zählt zum Datum seines Endes (Ortszeit). ‹ blättert unbegrenzt zurück, › höchstens bis zum laufenden Zeitraum. Die gewählte Ansicht (Woche/Monat/Jahr, Zeitraum) bleibt bis zum Neuladen erhalten. Gleichstand beim häufigsten Bereich: Reihenfolge der Liste unter „Daten“. Farbpunkte: Core & Vacuum `#C6C5A6`, Bauch `#BE7B9D`, Beine & Po `#C4A882`, Rücken `#8AB4C4`, Dehnen `#A8C4A0`, Yoga `#B794C5`, Atmung `#E2A9C4`, Ganzkörper `#E3A3BF`. Auf Home entfallen Überschrift und Karte „Bibliothek“.

## Dem Bauenden überlassen

- Genaue Darstellung der Balken (SVG oder Blöcke), solange sie bei 31 Tagen auf 320 px passen.
- Aufteilung der reinen Rechen-Logik in eigene Datei (`js/stats.js`) und Tests.

## Prüfung

- Reine Logik (Zeiträume, Summen, Balken, Vergleich, Bereich, Rechnung der Trainingszeit) mit Node-Tests, inkl. Monatswechsel, Jahreswechsel, Sommerzeit-Umstellung, leerem Protokoll, alten Einträgen.
- Browser 375 × 667 und 320 px: Leiste auf den drei Hauptseiten, nicht anderswo; nichts verdeckt; Statistik mit Beispieldaten in allen drei Ansichten und beim Blättern.
- Frischer Prüfer, Live-Prüfung, Sync, iPhone-Test durch Nicole.
