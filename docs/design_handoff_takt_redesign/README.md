# Handoff: Takt Redesign v2 (Design System „Takt“)

## Overview
Visual update of the Takt PWA (repo `nicolehahn2890/takt`, live at https://nicolehahn2890.github.io/takt/). The structure, screens, copy and logic stay the same. What changes:
- new palette (Background / Surface / Elevated, Rosé / Lavendel / Salbei)
- **Outfit** for headings and numbers, DM Sans for everything else
- the **exercise figure becomes the logo**; the pixel peach is gone
- less generic look: no coloured border strips on cards, no outlines on tiles, no uppercase letter-spaced section labels
- layout rules: spacing 8/12/16/24/32 px, card radius 14–20 px, buttons 52–60 px tall, body text 16–18 px, headings 24–32 px

## About the design files
Everything in `design-system/` is a **design reference built in HTML/React**. It shows the intended look and behaviour; it is not production code to paste in. The task is to apply this design to the **existing vanilla HTML/CSS/JS app** using its own patterns (plain CSS classes, `index.html` sections, the `js/*.js` renderers). Don't add React or a build step.

`app.css` in this folder is the exception: it is a **ready-to-use replacement for `css/app.css`**. It keeps every existing selector, so the JS that renders HTML strings keeps working.

## Fidelity
**High fidelity.** Colours, type sizes, radii and spacing are final. Copy the values exactly.

---

## Step-by-step for the repo

### 1. `css/app.css`
Replace it with `app.css` from this folder. Bump the cache-buster in `index.html` (`app.css?v=10` → `?v=11`, and do the same for all scripts).

### 2. `index.html` `<head>`
```html
<meta name="theme-color" content="#171217">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
```
(This replaces the current DM Sans-only link.)

### 3. Logo: replace the pixel peach
- Copy `assets/takt-mark.svg` to the repo as `assets/takt-mark.svg`. Also use it for the apple-touch-icon and manifest icon. If PNGs are needed for the icons, render them on `#171217`, with about 16% padding.
- In `js/app.js`, delete `PEACH`, `PEACH_COLORS` and `peachSvg()`. In `renderStart()` replace
  `$('brand-logo').innerHTML = peachSvg();`
  with
  `$('brand-logo').innerHTML = '<img src="assets/takt-mark.svg" alt="">';`
- The header stays `Takt` + tagline. The new CSS puts the tagline on the same baseline as the wordmark.

### 4. Theme colours (`js/app.js` → `THEMES`)
```js
var THEMES = { core: '#C6C5A6', bauch: '#BE7B9D', dehnen: '#A8C4A0', yoga: '#B794C5', beine: '#C4A882', ruecken: '#8AB4C4' };
```
In `index.html` set the library nav card's inline style to `style="--theme:#B794C5"`.

### 5. Main button colour
Salbei `#C6C5A6` is the default primary colour (e.g. `.btn.main` „Nochmal“). Start buttons and the training Pause button keep the workout's **theme** colour, which `--theme` already handles. Rosé `#BE7B9D` is for emphasis CTAs such as „Weiter“ or „Bearbeiten (als Kopie)“ in the coming editor.

### 6. Figure colours (`js/figure.js`, optional but recommended)
`COL.arrow: '#BE7B9D'`. In `breathSvg()` replace `rgba(184,140,192,…)` with `rgba(183,148,197,…)` and `#B88CC0` with `#B794C5`. Limb colours stay (`#E3A3BF` / `#9A6B8C` / `#F0C4D6`). They are the brand.

### 7. Things the CSS already handles (no JS change)
- `.card`: no border and no left strip. A theme dot is drawn by `article.card p::before`.
- `.start h2`: 24px Outfit, sentence case. The HTML text („Vorlagen“, „Bibliothek“) is already sentence case.
- `.ex-hint`: no left border; it gets a pink „Tipp“ lead-in via `::before`.
- `.chip`: soft fill instead of an outline.
- `.toast`: light on dark with a shadow, moved to the bottom centre.
- `.t-next .nl`: „Als Nächstes“ in sentence case.

---

## Screens
All screens keep their current DOM. Visual spec:

**Start (`#screen-start`)**
- Page padding 24/16/32, max width 560, glow `linear-gradient(160deg,#2a1c27,#171217 360px)`.
- Brand row: mark 44px + „Takt“ Outfit 600 32px −0.6px + tagline DM Sans 14 `#a8949f`, gap 12. Margin below: 32.
- Section titles: Outfit 600 24px, 32px above, 12px below.
- Workout card: `#241B23`, radius 18, padding 16, no border. Title Outfit 600 18. Meta 13px muted, with an 8px theme dot before it. Start button: theme fill, text `#171217`, 52px tall, radius 14, 700 16px.

**Training (`#screen-train`)**
- Ring: stroke 11, track white 8%, bar theme colour (Lavendel during rest).
- Time: Outfit 600, `clamp(44px,10.5dvh,76px)`, −1.5px, tabular numerals.
- Phase label: 13px 600 Lavendel (Rosé when paused).
- Figure tray: theme colour 13% mixed into `#1d161c`, radius 16, max 190px wide.
- Controls: grid `1fr 1fr 1.4fr 1fr 1fr`, gap 8, 58px tall, radius 16. Centre button filled with the theme colour.

**Geschafft (`#screen-done`)**
- „Geschafft!“ Outfit 600 40px.
- Buttons 52px: „Nochmal“ Salbei, „Zur Startseite“ white 7% fill.

**Bibliothek / Detail / Eigene Übung (`.page`)**
- Header: back button is a bare ‹ at 30px; title Outfit 600 24px.
- „+ Eigene“: Lavendel pill, 44px tall.
- Search and inputs: `#241B23`, no visible border, Lavendel 1px border on focus, 16px text.
- Library rows: `#241B23`, radius 16, thumb 84×62 radius 12 on `#1d161c`.
- Detail: description 18px / 1.5.

## Interactions
- Press state: buttons `scale(.96)` for 150ms.
- Ring: `stroke-dashoffset .25s linear`, `stroke .4s`.
- Dots: background `.3s`.
- No hover effects (the app is touch-first). Behaviour and logic are unchanged.

## Design tokens
| Token | Value |
|---|---|
| Background | `#171217` |
| Surface (cards) | `#241B23` |
| Elevated | `#30232D` |
| Sunken (figure trays) | `#1d161c` |
| Glow | `#2a1c27` |
| Rosé | `#BE7B9D` (light `#E2A9C4`) |
| Lavendel | `#B794C5` |
| Salbei (primary) | `#C6C5A6` |
| Text | `#f6edf1` |
| Muted | `#a8949f` |
| Danger | `#f0b4b4` on `rgba(216,104,104,.18)` |
| Warning banner | `#e8b860` |
| Ghost fill | `rgba(255,255,255,.07)` |
| Themes | core `#C6C5A6` · bauch `#BE7B9D` · dehnen `#A8C4A0` · yoga `#B794C5` · beine `#C4A882` · rücken `#8AB4C4` |
| Fonts | Outfit 600 (display: 40/32/24/18, timer 76) · DM Sans 400–700 (body 16–18, UI 13–15) |
| Spacing | 8 / 12 / 16 / 24 / 32; page gutter 16; max width 560 |
| Radius | thumb 10–12 · input 12 · button 14 · row 16 · card 18 · hero figure 20 · sheet 22 · chip pill |
| Buttons | 52 default, 58 large, 44 min (pill/chips 40–44) |
| Shadows | only on overlays: toast `0 8px 24px rgba(0,0,0,.4)` |

## Assets
- `assets/takt-mark.svg`: the logo, a lunge figure (Ausfallschritt) in the figure colours.
- `assets/alternates/`: other figure marks (Krieger-2, Hampelmann).
- Exercise figures: keep using `js/figure.js`, `data/poses.js`, `data/exercises.js` from the repo.
- Icons: Unicode glyphs as before (‹ › ✕ ◀︎ ▶︎ ❚❚ −15 +15). No icon font.

## Files in this bundle
- `app.css`: drop-in replacement for `css/app.css`.
- `assets/`: logo and alternates.
- `design-system/DESIGN_GUIDE.md`: full guide (tone of voice, visual foundations, iconography).
- `design-system/tokens/*.css`: tokens as CSS custom properties.
- `design-system/components/`: React reference components saved as `.jsx.txt` / `.d.ts.txt` (exact inline style values) with usage notes (`.prompt.md`). Use them as a visual spec, not as code to import.
- `design-system/ui_kits/app/*.jsx.txt`: source of the click-through reference for Start, Vorschau, Anpassen, Training, Geschafft, Bibliothek and Detail. Read it for layout values; the live version is in the Takt Design System project.
- `design-system/guidelines/`: specimen pages for colours, type, spacing and brand.
- `takt-design-skill/`: a Claude Code skill. Copy it to `~/.claude/skills/takt-design/` so Claude uses the brand automatically.
- `CLAUDE_CODE_PROMPT.md`: a prompt to paste into Claude Code.
