---
name: new-animation
description: Create a new Motion Canvas animation scene for the Passe-Tech YouTube channel. Use when asked to create, add, or build a new animation or scene in this repository.
---

## Purpose

Create Motion Canvas 2D animation scenes for Passe-Tech, a French tech-education YouTube channel (audience: curious devs, CS students, pros reconverting). Animations explain computer science concepts visually — Docker, networking, security, LLM internals, etc.

## Workflow

1. **Clarify the concept** — ask what the animation should show if not specified
2. **Choose a folder** under `src/scenes/` matching the video topic (e.g. `docker/`, `litellm/`, `reverse-proxy/`). Create a new subfolder if no match exists.
3. **Create the scene file** following the boilerplate in `assets/scene-boilerplate.tsx`
4. **Register** in `src/project.ts` — set the new scene as the active one
5. **Verify** in the Motion Canvas viewer (`npm start`)

## Mandatory Rules (from CLAUDE.md)

| Rule | Bad | Good |
|------|-----|------|
| Responsive sizing | `x={300}` | `x={() => vW() * 0.295}` |
| `key` on every JSX node | none | `key="host-box"` |
| Transparent fill | `fill={'transparent'}` | `fill={'#00000000'}` |
| Variable names | `cur`, `idx`, `ref` | `activeCursor`, `lineIndex`, `boxRef` |
| Fonts | anything else | `Space Grotesk` (display), `DM Mono` (code) |

## Brand Palette

```typescript
const COLORS = {
  bg:      '#0D1117',  // dark background
  cream:   '#F9F9F6',  // main text
  ghost:   '#484F58',  // secondary / muted
  rose:    '#FF3E6C',  // Passe-Tech accent — danger, highlight
  vert:    '#6DFF8A',  // success, safe
  jaune:   '#FFE14D',  // warning, info
  blue:    '#58A6FF',  // primary element
};
```

## Scene File Skeleton

```typescript
import {makeScene2D, Rect, Txt, Layout} from '@motion-canvas/2d';
import {createRef, all, sequence, waitFor, waitUntil} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const COLORS = { bg: '#0D1117', cream: '#F9F9F6' /* ... */ };

  // 1. Declare refs
  const titleRef = createRef<Txt>();

  // 2. Build scene tree (all opacity={0} initially)
  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>
      <Rect key="bg" width={'100%'} height={'100%'} fill={COLORS.bg} />
      <Txt key="title" ref={titleRef} text="Title" fill={COLORS.cream}
           fontSize={() => vW() * 0.04} opacity={0} />
    </Layout>
  );

  // 3. Animation phases
  yield* waitUntil('intro');
  yield* titleRef().opacity(1, 0.5);
  yield* waitUntil('end');
  yield* titleRef().opacity(0, 0.4);
});
```

## Project Registration (`src/project.ts`)

```typescript
// Add import at the top
import myNewScene from './scenes/topic/my-new-scene?scene';

// Replace active scene
export default makeProject({ scenes: [myNewScene] });
```

## Before Creating a Component

Check `src/components/` first — a `Terminal` component already exists with typewrite, writeLine, startBlink, etc. See `references/components.md` for its full API.

## References

- `references/choreography.md` — animation patterns (sequence, all, waitUntil, camera, typewriter)
- `references/components.md` — Terminal component API and reuse checklist
- `assets/scene-boilerplate.tsx` — full-featured starter template
