Achievement plaque (Abzeichen) on the statistics page and the finish screen. Round, 64 px, one Tabler outline icon (stroke 1.8) — the only place in Takt that uses icons.
Earned: filled with the group colour, dark plum icon, title in text colour. Locked: ghost disc on a sunken inner disc, muted icon; if the goal is a count (need > 1) a conic progress ring in the group colour plus „4 von 10“ underneath. Grid of 4 columns, gap 14/8. Tap shows one line below the grid: „Title · Rule · erreicht am 24. Okt. 2026“ or „· 4 von 10 Trainings“.
Finish screen: card „Neues Abzeichen“ (15 px) above a centred row; new plaques fade/scale in (.8 → 1, 300 ms, 120 ms stagger); tapping one replays the celebration. New badges are first celebrated full-screen (large plaque, glow, rays, spark burst, chime), see DESIGN_GUIDE „Celebration“.
```jsx
<AchievementBadge badge={Takt.BADGES[0]} earned />
<AchievementBadge badge={Takt.BADGES[1]} progress={{ have: 6, need: 10 }} />
<AchievementBadge badge={Takt.BADGES[12]} />
<AchievementBadge badge={Takt.BADGES[9]} earned celebrate delay={120} />
```
