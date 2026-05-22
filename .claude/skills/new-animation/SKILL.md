---
name: new-animation
description: Create a new Motion Canvas animation scene for the Passe-Tech YouTube channel. Use when asked to create, add, or build a new animation or scene in this repository.
---

## Purpose

Create Motion Canvas 2D animation scenes for Passe-Tech, a French tech-education YouTube channel (audience: curious devs 16–25, CS students, pros reconverting 28–45, ethical geeks 25–40). Animations explain computer science concepts visually — Docker, networking, security, LLM internals, etc.

## Principe cardinal — Show, Don't Tell

**Montrer un phénomène vaut mieux que l'expliquer avec des phrases.**

Avant d'écrire un `Txt` explicatif, demande-toi : *est-ce que le mouvement, la forme ou la couleur peut transmettre cette information à ma place ?*

| Intention | ✗ Tell (à éviter) | ✓ Show (à privilégier) |
|-----------|-------------------|------------------------|
| Expliquer l'effet avalanche du hash | Txt `"Δ 1 octet → hash totalement différent"` | Faisceau qui scanne deux fichiers similaires → deux hashes monospace complètement différents apparaissent |
| Montrer qu'un tag est mutable | Callout `"Le tag peut pointer vers n'importe quelle image"` | Badge `nginx:1.31` qui glisse d'une image vers une autre via un signal animé |
| Indiquer une erreur | Label rouge `"Erreur de connexion"` | Node qui pulse en rose, flèche animée qui se bloque et rebondit |
| Montrer que données transitent | Txt `"Le paquet voyage de A vers B"` | `Packet` qui se déplace le long d'un `DiagramEdge` animé |

**Règle pratique :** si un `Txt` décrit ce que l'animation montre déjà, supprime-le. Un label court (nom d'un nœud, valeur d'un compteur) reste utile — une phrase explicative est toujours suspecte.

Les callouts et annotations courts (`Callout`, `AnnotationBox`) sont acceptables pour ancrer un terme technique précis, jamais pour raconter ce que le visuel fait déjà.

---

## Workflow

0. **Consult Obsidian notes** — read the two vault references before starting:
   - `🍉 PasseTech Youtube Channel/motion_canvas_component_library.md` — DS palette, 6 primitives API, MC constraints, Icon catalog
   - `🍉 PasseTech Youtube Channel/Descriptif de la chaine.md` — channel identity, audience personas, editorial strategy
1. **Clarify the concept** — ask what the animation should show if not specified
2. **Check `src/components/`** — list existing components, read candidates before creating anything new (see `references/components.md`)
3. **Choose a folder** under `src/scenes/` matching the video topic (e.g. `docker/`, `litellm/`, `reverse-proxy/`). Create a new subfolder if no match exists.
4. **Create the scene file** — use `PALETTE` from `'../../theme'`, not inline COLORS
5. **Register** in `src/project.ts` — set the new scene as the active one
6. **Verify** in the Motion Canvas viewer (`npm start`)

## Mandatory Rules (from CLAUDE.md)

| Rule | Bad | Good |
|------|-----|------|
| Responsive sizing | `x={300}` | `x={() => vW() * 0.295}` |
| `key` on every JSX node | none | `key="host-box"` |
| Transparent fill | `fill={'transparent'}` | `fill={'#00000000'}` |
| Variable names | `cur`, `idx`, `ref` | `activeCursor`, `lineIndex`, `boxRef` |
| Fonts (technical) | anything else | `JetBrains Mono` (labels, data, protocols) |
| Fonts (conceptual) | anything else | `Space Grotesk` (titles), `DM Sans` (body) |
| Palette | inline `COLORS = {...}` | `import {PALETTE} from '../../theme'` |

## Design System — Palette

Import from theme (never define inline in new scenes):

```typescript
import {PALETTE} from '../../theme';
// PALETTE.bg        = '#0D0D0D'   — scene background
// PALETTE.nodeBg    = '#1A1A1A'   — node interior
// PALETTE.nodeActive= '#252525'   — node involved in current action
// PALETTE.text      = '#F5F5F0'   — main labels
// PALETTE.muted     = '#6B7280'   — secondary, inactive
// PALETTE.rose      = '#FF4D6D'   — danger, attacker, error
// PALETTE.vert      = '#4ADE80'   — valid, encrypted, success
// PALETTE.cyan      = '#38BDF8'   — data in transit, active network
// PALETTE.ambre     = '#FBBF24'   — warning, storage
```

### Single active color rule

**One scene = one active color.** The active color carries all semantic meaning; the rest stays in `muted`. Exception: explicit valid/compromised contrast uses vert + rose together.

## Design System — Available Components

All scenes created after 2026-05-20 must use `src/components/`. Import:

```typescript
import {DiagramNode, DiagramEdge, Packet, Zone, Callout, Slot, SlotGroup,
        Terminal, ConnectionArrow, InfoCard, ConnectedNode, AnnotationBox}
  from '../../components';
```

### The 6 DS Primitives (post-2026-05-20)

| Component | Represents | Key props |
|-----------|-----------|-----------|
| `DiagramNode` | Any box entity (server, container, DB, person…) | `label`, `sublabel`, `icon`, `color`, `nodeState`, `preset`, `borderStyle` |
| `DiagramEdge` | Connection between two nodes | `from`/`to` (refs), `edgeDirection`, `edgeStyle`, `label` |
| `Packet` | Data traveling along an edge | `content`, `color`, `packetSize`, `flyTo(target, duration)` |
| `Zone` | Perimeter grouping nodes | `label`, `color`, `borderStyle`, `preset` |
| `Callout` | Anchored annotation box | `title`, `body`, `color`, `calloutState` (+ separate `ConnectionArrow`) |
| `Slot` / `SlotGroup` | Cell in spatial data structure | `index`, `content`, `color`, `slotState` |

Pre-built presets for `DiagramNode`: `server`, `container`, `database`, `file`, `browser`, `terminal`, `person`, `org`
Pre-built presets for `Zone`: `network`, `cloud`, `trusted`, `untrusted`, `sandbox`, `cluster`

See `references/components.md` for full API, API divergences vs spec, and MC circular-dependency constraints.

### Legacy components (pre-2026-05-20, still valid)

| Component | Usage |
|-----------|-------|
| `Terminal` | Animated terminal window — `.typewrite()`, `.writeLine()`, `.clear()` |
| `ConnectionArrow` | Reactive arrow between two points — `from/to: () => [x, y]` |
| `InfoCard` | Colored header card + free children body |
| `ConnectedNode` | Diagram node (icon + label + external counter signal) |
| `AnnotationBox` | Annotation box (title + lines), arrow handled via `ConnectionArrow` |

## Icon Component

Motion Canvas exposes `<Icon />` natively — no extra install needed:

```typescript
import {Icon} from '@motion-canvas/2d';

// Brand logos (never override color — brand colors are intentional)
<Icon key="docker-icon" icon="logos:docker-icon" size={() => vW() * 0.03} />

// Generic icons (assign semantic palette color)
<Icon key="server-icon" icon="lucide:server" size={() => vW() * 0.03} color={PALETTE.muted} />
<Icon key="lock-icon"   icon="lucide:lock"   size={() => vW() * 0.03} color={PALETTE.vert} />
<Icon key="skull-icon"  icon="lucide:skull"  size={() => vW() * 0.03} color={PALETTE.rose} />
```

Collections: `logos:` (brand logos), `lucide:` (generic — preferred), `material-symbols:`, `mdi:`.
Full catalog: icones.js.org

## Scene File Skeleton

```typescript
import {makeScene2D, Layout, Rect, Txt} from '@motion-canvas/2d';
import {createRef, all, sequence, waitFor, waitUntil} from '@motion-canvas/core';
import {DiagramNode, DiagramEdge, Zone} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  // 1. Declare refs
  const serverRef = createRef<DiagramNode>();

  // 2. Build scene tree (all opacity={0} initially)
  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>
      <Rect key="bg" width={'100%'} height={'100%'} fill={PALETTE.bg} />
      <DiagramNode
        key="server"
        ref={serverRef}
        preset="server"
        label="api.example.com"
        sublabel="nginx 1.25"
        color={PALETTE.cyan}
        x={() => vW() * 0.0}
        y={() => vH() * 0.0}
        opacity={0}
      />
    </Layout>
  );

  // 3. Animation phases (semantic names tied to narration)
  yield* waitUntil('showServer');
  yield* serverRef().opacity(1, 0.3);
  yield* waitUntil('end');
  yield* serverRef().opacity(0, 0.3);
});
```

## Project Registration (`src/project.ts`)

```typescript
// Add import at the top
import myNewScene from './scenes/topic/my-new-scene?scene';

// Replace active scene
export default makeProject({ scenes: [myNewScene] });
```

## References

- `references/choreography.md` — animation patterns (sequence, all, waitUntil, camera, typewriter)
- `references/components.md` — full API for all 11 components + MC constraints
- `assets/scene-boilerplate.tsx` — full-featured starter template
- Obsidian: `motion_canvas_component_library.md` — canonical DS spec + icon catalog
- Obsidian: `Descriptif de la chaine.md` — channel identity and editorial rules
