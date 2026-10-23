# Takt Design System

**Takt** – „Dein Training, dein Takt“ – is a German-language mobile web app (PWA, iPhone-first) for home workouts: pick a template or build your own, and a timer with a recorded voice (Katja) guides you through exercise, pause and side switches while your music keeps playing in Spotify. One product, one surface: the phone app at https://nicolehahn2890.github.io/takt/.

Screens: **Start** (weekly stat, Mix / + Neu, Meine Workouts, Vorlagen by theme, Bibliothek) · **Vorschau** of a template · **Anpassen** sheet (time + intensity) · **Training** (ring timer, figure, next-up, transport) · **Geschafft** · **Bibliothek** (search, chips, 110 exercises) · **Übungs-Detail** · eigene Übung / Workout-Editor.

## Sources
- GitHub: **https://github.com/nicolehahn2890/takt** (branch `main`) — `css/app.css`, `index.html`, `js/app.js`, `js/library.js`, `js/figure.js`, `data/*.js`, `mockups/editor/index.html` (workout-editor prototype, matches the three screenshots supplied in chat), `docs/KONZEPT.md`. Explore the repo further for anything this system doesn't cover (editor, picker, Mix logic, voice lines).
- User screenshots of the editor mockup (Start, Vorlage-Vorschau, Anpassen sheet) in `uploads/`.

> **Polish pass.** The user asked for a less "AI-generic" look. Compared with the repo, this system deliberately **removes the coloured left/top border strips on cards, the hairline outlines around every tile and the uppercase letter-spaced section labels**. The theme colour now lives in a dot, the figure tray tint and the Start button. Everything else (palette, type, radii, spacing, layout) follows the source values exactly.

## Index
- `styles.css` → imports `tokens/{fonts,colors,typography,spacing,effects,base}.css`
- `guidelines/` — foundation cards (Colors, Type, Spacing, Brand)
- `components/` — React primitives (see list) + one card per folder
- `ui_kits/app/` — click-through recreation of the app
- `assets/figure/` — figure engine `figure.js`, `poses.js`, `exercises.js` (verbatim from repo) · `assets/photos/` — 3 AI test photos · `assets/takt-mark.svg` (figure mark) + `logo-figure-*.svg` alternates
- `SKILL.md`, `github.md`

## Components
- core: **Button** (primary/secondary/ghost/danger/pill/link), **IconButton**
- forms: **Chip**, **TextField**, **Checkbox**, **Segmented**, **RangeField**, **Stepper**
- content: **ExerciseFigure**, **WorkoutCard**, **QuickTile**, **WeekStat**, **NavCard**, **ExerciseRow**, **Badge**, **BrandHeader**, **SectionTitle**, **TopBar**, **Hint**
- training: **TimerRing**, **ProgressDots**, **NextUp**, **TrainingControls**
- feedback: **Banner**, **Toast**, **Sheet**

Intentional additions: **ExerciseFigure** (React wrapper around `Takt.figure` so figures can be dropped anywhere), **SectionTitle** and **Hint** (replace the old uppercase `h2` and left-border `.ex-hint` patterns as part of the polish pass), **WeekStat** (typographic version of the editor mockup's boxed `.week`).

---

## CONTENT FUNDAMENTALS
- **Language:** German only. Informal **du** throughout („Dein Training“, „Wie viel Zeit hast du?“, „Tippe auf …“). The app never says „ich“; it speaks as a friendly coach.
- **Tone:** calm, short, practical, encouraging without hype. One exclamation at the finish: „Geschafft!“ / voice „Geschafft, super gemacht!“.
- **Casing:** sentence case for everything incl. buttons (`Start`, `Anpassen`, `Speichern & Starten`, `Bearbeiten (als Kopie)`). Section titles are plain nouns: „Meine Workouts“, „Vorlagen“, „Bibliothek“.
- **Numbers & units:** times as `m:ss` (`19:30 Min.`, `0:40`), durations in lists as `40 s`, totals `7 Min. · 8 Übungen`. Middle dot `·` separates meta. Abbreviations with period: „Min.“, „Sek.“, „z. B.“.
- **Placeholders** give a concrete example: „Suchen, z. B. Plank oder Brücke“, „z. B. Knie leicht gebeugt lassen“.
- **Errors** explain and suggest: „Speichern hat nicht geklappt. Ist der Speicher voll oder der private Modus an?“, „Bitte gib dem Workout einen Namen.“
- **Instructional copy** (exercise descriptions) is imperative, body-focused, 1–2 sentences: „Im Vierfüßlerstand ganz ausatmen und den Bauch zur Wirbelsäule hochziehen.“ Hints add one safety cue.
- **Voice lines:** „Mach dich bereit.“ „Los geht's!“ „Pause.“ „Als Nächstes:“ „Noch zehn Sekunden.“ „Seite wechseln.“
- **No emoji.** Unicode glyphs only for controls.

## VISUAL FOUNDATIONS
- **Palette (user spec v2):** Background `#171217` · Surface `#241B23` · Elevated `#30232D` · **Rosé** `#BE7B9D` · **Lavendel** `#B794C5` · **Salbei** `#C6C5A6`. Salbei — the warm yellow-sage — is the default primary button (Los geht's, Starten, Pause); Rosé for emphasis CTAs (Weiter, Bearbeiten); Lavendel for selection (chips, segmented, rest ring). Muted text `#a8949f`. Dark mode only — night-time, soft, calm.
- **Gestaltungsregeln:** spacing rhythm 8 / 12 / 16 / 24 / 32 px · card radius 14–20 px · buttons 52–60 px tall · body 16–18 px · headings 24–32 px.
- **Signature: the exercise figure.** A rounded-stroke stick figure in two pinks (near limbs `#E3A3BF`, far limbs `#9A6B8C`, head `#F0C4D6`) on a faint mat line, 216:160 stage, drawn by code for all 110 exercises. It is THE brand image — appears on cards (strips of 3–4), list rows, detail hero, training and finish. Breathing exercises render a growing lila circle. Props (chair, wall, sofa) are flat plum rectangles. Never replace figures with stock icons or emoji.
- **Theme colours:** six desaturated pastels (core olive-beige, bauch pink, dehnen sage, yoga lila, beine sand, rücken blue-grey). Used as dot, 13% tray tint behind figures, and primary-button fill with dark plum text. **Never as border strips.**
- **Type:** two families. **Outfit 600** (`--font-display`) for the wordmark, headings (32 / 24 / 18), timer and big numbers: round, geometric, sporty but warm. **DM Sans** 400–700 (`--font-sans`) for body (16–18), meta and all UI controls. Tabular numerals wherever time appears. Tight negative tracking on big type (−0.5px brand, −2px timer). Tabular numerals everywhere time appears.
- **Backgrounds:** a single 160° radial-ish glow from `#2e1a28` into `#1a1418` at the top of pages (360px) and across the training screen (55%). No images, patterns or textures behind content.
- **Surfaces & cards:** depth from small surface steps (`#1f171c` sunken → `#241b21` card → `#2a2027` raised) — no outlines, no shadows. Cards radius 18, rows 16, inputs 12, buttons 14, thumbs 10–12, sheet 22 top, chips pill.
- **Shadows:** only on overlays: toast `0 8px 24px rgba(0,0,0,.4)`, sheet upward shadow, device frame.
- **Transparency & blur:** white-alpha fills (7–10%) for secondary buttons/controls; sticky top bar `rgba(26,20,24,.94)` + 8px blur; scrim `rgba(0,0,0,.55)`.
- **Buttons:** filled, dark text on colour; secondary = white 7% fill; "Anpassen" is an underlined muted text link. Min 44px tap target; training controls 58px.
- **Press states:** scale .96 (buttons) / .98 (tiles), 150ms. No hover colour shifts (touch-first); `a:hover` lightens to pink-light.
- **Animation:** functional only — ring dash offset .25s linear per tick, stroke colour .4s on rest, figures loop key frames with smoothstep (hold .6s, move .9s). No bounces, no page transitions.
- **Layout:** single column, max 560px, 16px gutters, safe-area insets. Templates two-up grid gap 10. Fixed elements: sticky top bar, bottom action footer, training screen is a fixed full-height flex column.
- **Imagery:** user photos (or AI test photos) replace the figure, `object-fit: cover` in the same 216:160 frame. Warm, indoor, soft light.

## ICONOGRAPHY
- **No icon font, no SVG icon set.** Takt uses Unicode glyphs: `‹` back, `›` chevron, `✕` close, `◀︎ ▶︎` prev/next/play (with VS15 `&#xFE0E;` to prevent emoji rendering), `❚❚` pause, `−15 / +15` seek, `↑ ↓` reorder, `✓` checked, `+` add. Keep it that way; render them in DM Sans in soft round buttons (see `guidelines/brand-glyphs.html`).
- **Illustration = figures** (`assets/figure/figure.js`). Load `exercises.js`, `poses.js`, `figure.js` and use `<ExerciseFigure exId="…">`.
- **Logo:** the **figure mark** — a side-view lunge with arms extended (Ausfallschritt), built with the same `figure.js` geometry and colours as every exercise figure (`assets/takt-mark.svg`). Pair with the wordmark „Takt“ in Outfit 600. Alternates: `assets/logo-figure-*.svg`. (The pixel peach from `js/app.js` was retired at the user's request.)
- **Emoji:** never.

## Fonts
Outfit + DM Sans load from Google Fonts (production loads only DM Sans; Outfit was added in this design system); no font binaries exist in the repo. If you want offline/self-hosted fonts, add the .woff2 files.
