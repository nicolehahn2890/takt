# Takt app – UI kit

Click-through recreation of the Takt PWA (https://nicolehahn2890.github.io/takt/), built from `index.html`, `css/app.css`, `js/app.js`, `js/library.js` and the workout-editor mockup `mockups/editor/index.html` in nicolehahn2890/takt — with the polish pass of this design system (no border strips, sentence-case section titles, figure-first cards).

Flow: Start → tap a template card → Vorschau → Start / Anpassen (sheet) → Training (live fake timer, tap centre = Pause) → Geschafft. Start → Übungen → search/filter → Übungs-Detail.

Files: `data.jsx` (templates from the editor mockup, step builder), `StartScreen`, `PreviewScreen`, `AdjustSheet`, `TrainingScreen`, `DoneScreen`, `LibraryScreen`, `ExerciseScreen`.
Figures render via `assets/figure/*.js` (copied verbatim from the repo).
Not recreated: workout editor, exercise picker, own-exercise form, Mix sheet (only toasts).

Snapshot of Design v2 (2026-10-23). Added in the app since then and not in this kit: bottom tab bar, Statistik page, breathing circle and side switch in training, finish screen with note, badges and celebration, Mix with Vacuum and 5 Min. The „Vor dem Start“ hint on Start has new text since v=46: „Ohne Kopfhörer: Schalter am iPhone auf Klingeln, sonst bleibt Takt stumm.“ Later (2026-10-25): Mix by positions and movement patterns (v=47/48), Besenstiel switch and the stick in the figure (v=48), ✕ in training saves from half the planned time (v=49), the clock line under the training controls removed (v=51), new warm-ups in the strength templates and „Vacuum & Core“ starting with 60 s Bauchatmung instead of a warm-up (v=50/52). `data.jsx` still holds the old templates; the source of truth is `data/templates.js` in the repo.
