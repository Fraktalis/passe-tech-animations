# Animation Choreography Patterns

## Phase Architecture

Every scene uses `waitUntil('phaseName')` to create named sync points the editor can trigger:

```typescript
yield* waitUntil('showDiagram');    // pause here until timeline marker
yield* all(boxA().opacity(1, 0.4), boxB().opacity(1, 0.4));
yield* waitUntil('showDetail');
yield* sequence(0.1, line1().opacity(1, 0.3), line2().opacity(1, 0.3));
yield* waitUntil('end');
yield* all(...refs.map(r => r().opacity(0, 0.3)));
```

Use semantic phase names tied to the narration script.

## Core Patterns

### Staggered reveal
```typescript
yield* sequence(0.06,
  nodeA().opacity(1, 0.28),
  nodeB().opacity(1, 0.28),
  nodeC().opacity(1, 0.28),
);
```

### Parallel animation
```typescript
yield* all(
  boxRef().opacity(1, 0.5),
  labelRef().opacity(1, 0.5),
  lineRef().end(1, 0.55),
);
```

### Line drawing (set `end={0}` in JSX)
```typescript
// In JSX: <Line ref={arrowRef} end={0} ... />
yield* arrowRef().opacity(1);
yield* arrowRef().end(1, 0.45, easeInOutCubic);
```

### Text swap (no flash)
```typescript
yield* labelRef().opacity(0, 0.2);
labelRef().text('New Text');
labelRef().fill(COLORS.rose);
yield* labelRef().opacity(1, 0.3);
```

### Color pulse (alert/highlight)
```typescript
yield* boxRef().fill(COLORS.rose, 0.25);
yield* waitFor(0.5);
yield* boxRef().fill(COLORS.bg, 0.4);
```

### Move + resize
```typescript
yield* all(
  nodeRef().x(vW() * 0.3, 0.6, easeInOutCubic),
  nodeRef().y(vH() * -0.1, 0.6, easeInOutCubic),
  nodeRef().width(vW() * 0.2, 0.6),
);
```

### Camera zoom (wrap content in Layout ref)
```typescript
// In JSX: <Layout ref={camera} key="camera"> ... </Layout>
const scale = 1.8;
const focusX = vW() * 0.1;
const focusY = vH() * -0.05;
yield* all(
  camera().scale(scale, 0.7, easeInOutCubic),
  camera().position([-scale * focusX, -scale * focusY], 0.7, easeInOutCubic),
);
// Reset
yield* all(camera().scale(1, 0.5), camera().position([0, 0], 0.5));
```

## Easing Usage

| Use case | Easing |
|----------|--------|
| Smooth movement/zoom | `easeInOutCubic` |
| Quick settle | `easeOutCubic` |
| Simple fade | default (linear) |

## Typewriter (manual, no component)

```typescript
const fullText = 'docker run --rm -it alpine';
for (let i = 0; i <= fullText.length; i++) {
  yield* codeRef().text(fullText.substring(0, i), 0.04);
}
```

## Background Loop (e.g. blinking)

```typescript
function* blink(ref: Reference<Rect>) {
  while (true) {
    yield* ref().opacity(0, 0.4);
    yield* ref().opacity(1, 0.4);
  }
}

const blinkTask = yield blink(cursorRef);   // spawn (no *)
yield* someAnimation();
cancel(blinkTask);
```

## Dynamic Line Points

For arrows/connections between moving elements:

```typescript
<Line
  key="arrow"
  ref={arrowRef}
  points={() => [
    [vW() * -0.2, vH() * 0.1],
    [vW() * 0.2,  vH() * -0.1],
  ]}
  stroke={COLORS.rose}
  lineWidth={2}
  endArrow
  end={0}
/>
```

## Timing Conventions

- Short reveal: `0.28–0.35s`
- Standard transition: `0.5–0.6s`
- Slow zoom/pan: `0.7–0.9s`
- Pause between phases: `yield* waitFor(0.8)`
- Stagger delay in `sequence()`: `0.06–0.12s`
