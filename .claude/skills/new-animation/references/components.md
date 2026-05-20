# Available Components

## Reuse Checklist

Before creating any new component:
1. `ls src/components/` — list existing components
2. Read the candidate component before deciding
3. Only create if truly no match exists

**Composants disponibles (≥ 2026-05-20) :**
`Terminal`, `ConnectionArrow`, `InfoCard`, `ConnectedNode`, `AnnotationBox`

Import : `import {InfoCard, ConnectionArrow, ...} from '../../components';`
Palette : `import {PALETTE} from '../../theme';` — ne plus définir `COLORS` inline.

Scènes de démo : `src/scenes/_components/test-*.tsx`

---

## Terminal Component (`src/components/Terminal.tsx`)

Import:
```typescript
import {Terminal} from '../../../components';
// or relative path depending on scene location
```

### Constructor Props

```typescript
interface TerminalProps {
  maxLines?: number;    // default 8 — pre-allocated line slots
  fontSize?: number;    // controls all internal sizing
  // + all Rect props (width, height, x, y, opacity, etc.)
}
```

Typical usage in JSX:
```tsx
<Terminal
  key="terminal"
  ref={termRef}
  maxLines={10}
  fontSize={18}
  width={() => vW() * 0.55}
  height={() => vH() * 0.45}
  x={() => vW() * 0.05}
  opacity={0}
/>
```

### Methods (all return `ThreadGenerator` — use `yield*`)

#### `typewrite(text, options?)`
Animated character-by-character typing.
```typescript
yield* termRef().typewrite('$ docker ps -a', {
  charDelay: 0.04,        // seconds per char (default 0.04)
  color: 'cream',         // TermColor (default 'cream')
  prompt: true,           // show '$ ' prefix (default false)
});
```

#### `writeLine(text, color?)`
Instant line (no animation).
```typescript
yield* termRef().writeLine('CONTAINER ID   IMAGE', 'ghost');
yield* termRef().writeLine('Error: permission denied', 'danger');
```

#### `startBlink()` — returns ThreadGenerator, use `yield` (no *)
```typescript
const blinkTask = yield termRef().startBlink();
yield* someOtherAnimation();
cancel(blinkTask);
```

#### `showCursor()` / `hideCursor()`
```typescript
yield* termRef().showCursor();
yield* termRef().hideCursor();
```

#### `clear(fadeDuration?)`
```typescript
yield* termRef().clear(0.3);
```

### TermColor Type

Named colors: `'cream'` `'ghost'` `'vert'` `'rose'` `'blue'` `'jaune'` `'danger'`
Or raw CSS string: `'#FF3E6C'`

---

## Standard Motion Canvas Components

These come from `@motion-canvas/2d` — no import from `src/components/` needed.

### Layout
Container with flexbox-like behavior:
```tsx
<Layout
  key="container"
  direction={'column'}      // 'row' | 'column'
  gap={() => vW() * 0.02}
  alignItems={'center'}
  justifyContent={'start'}
  layout                    // enable layout engine
>
```

### Rect
Box with optional rounded corners, shadow, stroke:
```tsx
<Rect
  key="panel"
  ref={panelRef}
  width={() => vW() * 0.4}
  height={() => vH() * 0.3}
  fill={COLORS.bg}
  stroke={COLORS.rose}
  lineWidth={2}
  radius={() => vW() * 0.005}
  shadowBlur={() => vW() * 0.015}
  shadowColor={COLORS.rose}
  opacity={0}
/>
```

### Txt
Text node:
```tsx
<Txt
  key="label"
  ref={labelRef}
  text="My Label"
  fill={COLORS.cream}
  fontSize={() => vW() * 0.025}
  fontFamily={'Space Grotesk, sans-serif'}
  fontWeight={700}
  opacity={0}
/>
```

### Line
Arrow or connector:
```tsx
<Line
  key="arrow"
  ref={arrowRef}
  points={() => [[vW() * -0.2, 0], [vW() * 0.2, 0]]}
  stroke={COLORS.rose}
  lineWidth={2}
  endArrow
  arrowSize={10}
  end={0}               // start hidden, animate to 1
  opacity={0}
/>
```

### Circle
```tsx
<Circle
  key="dot"
  ref={dotRef}
  width={() => vW() * 0.015}
  height={() => vW() * 0.015}
  fill={COLORS.vert}
  opacity={0}
/>
```

### Grid
Background grid (animate to low opacity):
```tsx
<Grid
  key="grid"
  width={'100%'}
  height={'100%'}
  spacing={() => vW() * 0.05}
  stroke={COLORS.ghost}
  lineWidth={1}
  opacity={0}
/>
// Fade in: yield* gridRef().opacity(0.12, 0.6)
```

### Img
Image asset (place files in `src/img/`):
```tsx
import logoSrc from '../../img/logo.svg';
<Img key="logo" ref={logoRef} src={logoSrc}
     width={() => vW() * 0.1} opacity={0} />
```
