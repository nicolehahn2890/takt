Renders an exercise's pink stick figure (the product's only illustration style) or a user photo.
```html
<script src="assets/figure/exercises.js"></script><script src="assets/figure/poses.js"></script><script src="assets/figure/figure.js"></script>
```
```jsx
<ExerciseFigure exId="plank" width={84} height={62} radius={12} />
<ExerciseFigure exId="katze-kuh" animate tint="var(--theme-dehnen)" />
```
Aspect ratio of the figure stage is 216:160. Breathing exercises render an animated breath circle.
