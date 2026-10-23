# Takt app – UI kit

Click-through recreation of the Takt PWA (https://nicolehahn2890.github.io/takt/), built from `index.html`, `css/app.css`, `js/app.js`, `js/library.js` and the workout-editor mockup `mockups/editor/index.html` in nicolehahn2890/takt — with the polish pass of this design system (no border strips, sentence-case section titles, figure-first cards).

Flow: Start → tap a template card → Vorschau → Start / Anpassen (sheet) → Training (live fake timer, tap centre = Pause) → Geschafft. Start → Übungen → search/filter → Übungs-Detail.

Files: `data.jsx` (templates from the editor mockup, step builder), `StartScreen`, `PreviewScreen`, `AdjustSheet`, `TrainingScreen`, `DoneScreen`, `LibraryScreen`, `ExerciseScreen`.
Figures render via `assets/figure/*.js` (copied verbatim from the repo).
Not recreated: workout editor, exercise picker, own-exercise form, Mix sheet (only toasts).
