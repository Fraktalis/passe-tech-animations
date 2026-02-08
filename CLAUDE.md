# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Motion Canvas animation project for the **Passe-Tech** YouTube channel. Each scene is a standalone TypeScript/JSX animation explaining a technical concept (DNS, SSR, RSC, bitwise operations, etc.). The target audience is French-speaking.

- **Framework:** Motion Canvas 3.17.2 (2D animation engine using generator functions)
- **Language:** TypeScript 5.2 with JSX
- **Build:** Vite 4 + Motion Canvas Vite Plugin + FFmpeg plugin for video export
- **Rendering:** 4K (3840x2160), preview at 30fps, export at 60fps

## Commands

```bash
npm start          # Start dev server with Motion Canvas editor (also: npm run serve)
npm run build      # TypeScript check + Vite production build
```

No test runner or linter is configured.

## Architecture

**`src/project.ts`** is the entry point. It calls `makeProject()` with an array of scenes and optional audio. To work on a scene, import it with the `?scene` query suffix and add it to the `scenes` array.

**`src/scenes/*.tsx`** contain individual animations. Each scene exports a `makeScene2D` generator function. Scenes are independent and self-contained.

**`src/scenes/*.meta`** are paired metadata files with `timeEvents` (named markers used by `waitUntil()` for synchronization) and a random seed. These are managed by the Motion Canvas editor UI.

**`src/img/`** and **`src/audio/`** hold static assets referenced by scenes.

## Scene Structure Pattern

Every scene follows this structure:

```tsx
import { makeScene2D } from '@motion-canvas/2d';
import { /* Rect, Txt, Circle, Layout, Line, Grid, SVG */ } from '@motion-canvas/2d/lib/components';
import { /* all, sequence, chain, waitFor, waitUntil, createRef, createSignal */ } from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  // 1. Create refs and signals
  const boxRef = createRef<Rect>();

  // 2. Define color palette as a COLORS constant
  const COLORS = { bg: '#1B1F23', accent: '#0099FF', /* ... */ };

  // 3. Build scene tree with JSX, attaching refs
  view.add(<Rect ref={boxRef} /* ... */ />);

  // 4. Animate with generator yields
  yield* all(boxRef().opacity(1, 0.5), boxRef().y(0, 1));
  yield* waitUntil('markerName');  // sync to .meta timeEvent
});
```

## Conventions

- **Responsive sizing:** positions and font sizes are computed from view dimensions, e.g. `x={() => view.width() * 0.25}`, `fontSize={() => view.width() * 0.02}`
- **Color palettes:** each scene defines a local `COLORS` object with semantic keys (bg, text, accent, danger, success)
- **Dark aesthetic:** dark backgrounds (#1B1F23, #0D1117) with bright accents
- **Animation composition:** `all()` for parallel, `sequence()` for staggered, `chain()` for sequential, `loop()` for repeating
- **Timing sync:** `waitUntil('eventName')` syncs to named markers in `.meta` files; `waitFor(seconds)` for fixed delays
- **License:** GNU AGPL v3

## Utility

**`src/applyRecursivelyToPath.ts`** provides `applyRecursivelyToSVGSubPath()` for applying styles recursively to complex SVG elements loaded via the `<SVG>` component.
