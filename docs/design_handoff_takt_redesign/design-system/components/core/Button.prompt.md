Takt's button — use for every tappable action (Start, Speichern, Anpassen, Löschen).
```jsx
<Button variant="primary" theme="var(--theme-dehnen)">Start</Button>
<Button variant="link">Anpassen</Button>
<Button variant="primary" size="lg" block>Starten</Button>
```
- primary fill = Salbei by default, or the workout theme colour via `theme`; Rosé (`var(--rose)`) for "Weiter"/footer CTAs. Text is dark plum (never white).
- secondary = soft white-alpha fill; danger = red tint; pill = lila "+ Eigene" header action; link = muted underlined secondary action.
- Press: scales to .96. Heights: sm 44 · md 52 · lg 58.
