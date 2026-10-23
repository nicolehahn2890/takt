Card for a workout (own or template) with figure strip and Start/Anpassen.
```jsx
<WorkoutCard name="Mein Morgen-Core" meta="7 Min. · 8 Übungen" themeLabel="Vacuum & Core" theme="var(--theme-core)" exIds={['vacuum-stehend','plank','dead-bug','glute-bridge']} onStart={go} onAdjust={adj} />
<WorkoutCard name="Kurz" meta="10 Min." theme="var(--theme-bauch)" exIds={['crunch','reverse-crunch','plank']} onStart={go} onAdjust={adj} />
```
Needs the figure scripts (see ExerciseFigure). Put templates two-up in a grid with gap 10px.
