# Available Components

## Reuse Checklist

Before creating any new component:
1. `ls src/components/` — list existing components
2. Read the candidate component before deciding
3. Only create if truly no match exists

**All components available (import via `../../components`):**

```typescript
// DS Primitives (≥ 2026-05-20) — use these for new scenes
import {DiagramNode, DiagramEdge, Packet, Zone, Callout, Slot, SlotGroup} from '../../components';

// Legacy components — still valid, not to be rétro-fitted in old scenes
import {Terminal, ConnectionArrow, InfoCard, ConnectedNode, AnnotationBox} from '../../components';
```

**Palette — never define COLORS inline in new scenes:**
```typescript
import {PALETTE} from '../../theme';
```

Demo scenes for each component: `src/scenes/_components/test-*.tsx`

---

## DS Primitives (≥ 2026-05-20)

### DiagramNode

Any box entity: server, container, DB, person, organization, file, etc. Same component everywhere — props differentiate.

```typescript
<DiagramNode
  key="server"
  ref={nodeRef}
  label="api.example.com"        // required — main text (JetBrains Mono)
  sublabel="nginx 1.25"          // optional — secondary text
  icon="lucide:server"           // optional — Iconify identifier
  preset="server"                // optional — pre-fills icon + color (see presets below)
  color={PALETTE.cyan}           // border color (default: PALETTE.muted)
  nodeState="idle"               // 'idle' | 'active' | 'highlighted' | 'error' | 'success'
  borderStyle="solid"            // 'solid' | 'dashed'  (dashed = isolated/virtualized)
  x={() => vW() * 0.2}
  y={() => vH() * -0.1}
  opacity={0}
/>
```

**Available presets** (pre-fill `icon` + default `color`):

| Preset | Icon | Default color |
|--------|------|---------------|
| `server` | `lucide:server` | `PALETTE.muted` |
| `container` | `logos:docker-icon` | `PALETTE.cyan` |
| `database` | `lucide:database` | `PALETTE.ambre` |
| `file` | `lucide:file` | `PALETTE.muted` |
| `browser` | `lucide:monitor` | `PALETTE.muted` |
| `terminal` | `lucide:terminal` | `PALETTE.vert` |
| `person` | `lucide:user` | `PALETTE.text` |
| `org` | `lucide:building-2` | `PALETTE.muted` |

**State → visual mapping:**

| `nodeState` | Border | Background |
|-------------|--------|------------|
| `idle` | `color` at 40% | `#1A1A1A` |
| `active` | `color` at 100% | `#252525` |
| `highlighted` | `color` at 100%, ×1.5 width | `#252525` |
| `error` | `#FF4D6D` | `#FF4D6D` at 8% |
| `success` | `#4ADE80` | `#4ADE80` at 8% |

**Animating state:**
```typescript
// Animate state via signal (nodeState is a SimpleSignal)
yield* nodeRef().nodeState('active', 0.15);
yield* nodeRef().nodeState('error', 0.08);  // brutal — linear implied
```

**MC constraint — circular deps:** `DiagramNode` uses `width: 2000` + `clip: true` for the accent bar instead of `() => this.width()`. Never read `this.height()` / `this.width()` inside a flex child. See MC Constraints section below.

---

### DiagramEdge

Connection between two `DiagramNode` instances.

```typescript
<DiagramEdge
  key="edge-client-server"
  ref={edgeRef}
  from={clientRef}               // required — source node ref
  to={serverRef}                 // required — target node ref
  edgeDirection="uni"            // 'uni' | 'bi'  (⚠ NOT direction — conflicts with FlexDirection)
  edgeStyle="solid"              // 'solid' | 'dashed' | 'animated'
  label="HTTPS"                  // optional — shown mid-line, monospace 10px
  color={PALETTE.cyan}           // line color (default: PALETTE.muted)
  opacity={0}
  end={0}                        // set 0 to animate drawing
/>
```

**Edge styles:**
- `solid` — established static connection
- `dashed` — possible but inactive connection, or logical (not physical) link
- `animated` — active flow — dash-offset animation (ants marching)

**Animate drawing:**
```typescript
yield* edgeRef().opacity(1);
yield* edgeRef().end(1, 0.45, easeInOutCubic);
```

**One label per edge.** If more info is needed, anchor a `Callout` to the edge instead.

---

### Packet

A unit of data traveling along a `DiagramEdge`. Represents: network packet, HTTP request, message, JWT, payload.

```typescript
<Packet
  key="packet-get"
  ref={packetRef}
  content="GET /api/v1"          // required — short string (monospace 11px)
  color={PALETTE.cyan}           // background + border color
  packetSize="md"                // 'sm' | 'md' | 'lg'  (⚠ NOT size — conflicts with Vector2 size)
  opacity={0}
  x={() => vW() * -0.3}
  y={() => vH() * 0.0}
/>
```

**Animate movement along an edge:**
```typescript
// flyTo() — ⚠ NOT moveTo() (conflicts with Node.moveTo(index))
yield* packetRef().opacity(1, 0.1);
yield* packetRef().flyTo(serverRef, 0.8, easeInOutCubic);
yield* packetRef().opacity(0, 0.1);
```

**packetSize guidelines:** `sm` for low-level packets (SYN, ACK), `md` for application data (JWT, 200 OK), `lg` for large payloads.

Max 2 packets moving simultaneously — beyond that it becomes unreadable.

---

### Zone

A perimeter that groups other primitives. Represents: network, cluster, datacenter, trust zone, sandbox.

```typescript
<Zone
  key="internal-network"
  ref={zoneRef}
  label="INTERNAL NETWORK"       // displayed top-left, caps, monospace 10px
  preset="network"               // optional — pre-fills color + borderStyle
  color={PALETTE.muted}          // border + tinted background
  borderStyle="dashed"           // always dashed unless physical zone (= solid)
  opacity={0}
  width={() => vW() * 0.5}
  height={() => vH() * 0.6}
  x={() => vW() * -0.1}
>
  <DiagramNode key="db" preset="database" label="postgres" />
  <DiagramNode key="api" preset="server" label="api" />
</Zone>
```

**Available presets:**

| Preset | Color | Border | Usage |
|--------|-------|--------|-------|
| `network` | `PALETTE.muted` | dashed | Internal network, LAN |
| `cloud` | `PALETTE.cyan` | dashed | Cloud provider, region |
| `trusted` | `PALETTE.vert` | dashed | Trust zone, internal DMZ |
| `untrusted` | `PALETTE.rose` | dashed | Internet, hostile zone |
| `sandbox` | `PALETTE.rose` | dashed double | Isolated env, honeypot |
| `cluster` | `PALETTE.cyan` | dashed | k8s cluster, compose stack |

No color = neutral (datacenter, generic). Color = semantic (vert = trusted, rose = compromised).

---

### Callout

An annotation box anchored to a node/edge/zone via a separate `ConnectionArrow`. Never floating.

```typescript
<Callout
  key="callout-cert"
  ref={calloutRef}
  title="TLS 1.3"                // required — one line max, sans-serif bold 12px
  body="cert expires 2027-01-01" // optional — two lines max, 11px muted
  color={PALETTE.vert}           // border color
  calloutState="idle"            // 'idle' | 'active' | 'error' | 'success'
  x={() => vW() * 0.35}
  y={() => vH() * -0.2}
  opacity={0}
/>
```

**The anchor line is a separate `ConnectionArrow`** (not a child of `Callout`):
```typescript
const calloutArrowRef = createRef<ConnectionArrow>();
// ...
<ConnectionArrow
  key="callout-arrow"
  ref={calloutArrowRef}
  from={() => [nodeRef().x() + vW() * 0.06, nodeRef().y()]}
  to={() => [calloutRef().x() - vW() * 0.05, calloutRef().y()]}
  color={PALETTE.muted}
  lineWidth={1}
  opacity={0}
/>
```

If the callout body needs more than 2 lines, the content is too dense — split into sequential callouts or simplify.

---

### Slot / SlotGroup

A cell in a spatial data structure: message in a queue, index entry, stack frame, memory cell, blockchain block.

```typescript
<Slot
  key="slot-0"
  ref={slotRef}
  index={0}                      // number or string — displayed top
  content="msg-42"              // short string — displayed bottom
  color={PALETTE.nodeBg}        // slot background
  slotState="filled"            // 'empty' | 'filled' | 'active' | 'consumed' | 'error'
  opacity={0}
/>
```

**SlotGroup** — container for ordered slots (queue, stack, log):
```typescript
<SlotGroup
  key="queue"
  ref={queueRef}
  label="QUEUE · CAPACITY 8"    // displayed above, monospace caps
  slots={8}                      // number of pre-allocated slots
  color={PALETTE.ambre}
  x={() => vW() * 0.0}
  y={() => vH() * 0.1}
  opacity={0}
/>
// Animate individual slots:
yield* queueRef().setSlotState(0, 'active', 0.12);
yield* queueRef().setSlotState(0, 'consumed', 0.25);
```

**slotState → visual:**

| State | Background | Border |
|-------|------------|--------|
| `empty` | `#1A1A1A` | muted 20% |
| `filled` | `#252525` | muted 60% |
| `active` | theme color 15% | theme color |
| `consumed` | `#1A1A1A` | muted 20% |
| `error` | rose 10% | rose |

**MC constraint:** Slot uses `_h` lambda instead of `this.height()` to avoid circular deps in flex children. See MC Constraints below.

---

## Icon Component

From `@motion-canvas/2d` — no extra install:

```typescript
import {Icon} from '@motion-canvas/2d';

// Brand logos — NEVER override color
<Icon key="docker-logo" icon="logos:docker-icon" size={() => vW() * 0.03} />
<Icon key="k8s-logo"    icon="logos:kubernetes"   size={() => vW() * 0.03} />
<Icon key="pg-logo"     icon="logos:postgresql"   size={() => vW() * 0.03} />

// Generic icons — assign semantic palette color
<Icon key="server"  icon="lucide:server"     size={() => vW() * 0.03} color={PALETTE.muted} />
<Icon key="lock"    icon="lucide:lock"       size={() => vW() * 0.03} color={PALETTE.vert} />
<Icon key="lockopen" icon="lucide:lock-open" size={() => vW() * 0.03} color={PALETTE.rose} />
<Icon key="skull"   icon="lucide:skull"      size={() => vW() * 0.03} color={PALETTE.rose} />
<Icon key="shield"  icon="lucide:shield"     size={() => vW() * 0.03} color={PALETTE.vert} />
<Icon key="db"      icon="lucide:database"   size={() => vW() * 0.03} color={PALETTE.ambre} />
<Icon key="hdd"     icon="lucide:hard-drive" size={() => vW() * 0.03} color={PALETTE.ambre} />
<Icon key="user"    icon="lucide:user"       size={() => vW() * 0.03} color={PALETTE.text} />
<Icon key="router"  icon="lucide:router"     size={() => vW() * 0.03} color={PALETTE.cyan} />
<Icon key="term"    icon="lucide:terminal"   size={() => vW() * 0.03} color={PALETTE.vert} />
```

One icon per node max. If two pieces of info seem to need icons, one becomes a `sublabel` text.
Full catalog: icones.js.org

---

## Terminal Component (`src/components/Terminal.tsx`)

```typescript
import {Terminal} from '../../components';
```

### Props
```typescript
interface TerminalProps {
  maxLines?: number;    // default 8 — pre-allocated line slots
  fontSize?: number;    // controls all internal sizing
  // + all Rect props (width, height, x, y, opacity, etc.)
}
```

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

### Methods

```typescript
// Animated character-by-character typing
yield* termRef().typewrite('$ docker ps -a', {
  charDelay: 0.04,     // seconds per char (default 0.04)
  color: 'cream',      // TermColor (default 'cream')
  prompt: true,        // show '$ ' prefix (default false)
});

// Instant line
yield* termRef().writeLine('CONTAINER ID   IMAGE', 'ghost');
yield* termRef().writeLine('Error: permission denied', 'danger');

// Cursor blink (spawn, don't yield*)
const blinkTask = yield termRef().startBlink();
yield* someOtherAnimation();
cancel(blinkTask);

// Show/hide cursor
yield* termRef().showCursor();
yield* termRef().hideCursor();

// Clear
yield* termRef().clear(0.3);
```

### TermColor type
Named: `'cream'` `'ghost'` `'vert'` `'rose'` `'blue'` `'jaune'` `'danger'`
Or raw CSS: `'#FF4D6D'`

---

## Standard Motion Canvas Components

From `@motion-canvas/2d` — no import from `src/components/` needed.

### Layout
```tsx
<Layout key="container" direction={'column'} gap={() => vW() * 0.02}
        alignItems={'center'} justifyContent={'start'} layout>
```

### Rect
```tsx
<Rect key="panel" ref={panelRef}
  width={() => vW() * 0.4} height={() => vH() * 0.3}
  fill={PALETTE.nodeBg} stroke={PALETTE.rose} lineWidth={2}
  radius={() => vW() * 0.005}
  shadowBlur={() => vW() * 0.015} shadowColor={PALETTE.rose}
  opacity={0} />
```

### Txt
```tsx
<Txt key="label" ref={labelRef} text="My Label"
  fill={PALETTE.text} fontSize={() => vW() * 0.025}
  fontFamily={'Space Grotesk, sans-serif'} fontWeight={700} opacity={0} />
```

### Line (arrow)
```tsx
<Line key="arrow" ref={arrowRef}
  points={() => [[vW() * -0.2, 0], [vW() * 0.2, 0]]}
  stroke={PALETTE.rose} lineWidth={2} endArrow arrowSize={10}
  end={0} opacity={0} />
```

### Grid (background, animate to low opacity)
```tsx
<Grid key="grid" width={'100%'} height={'100%'}
  spacing={() => vW() * 0.05} stroke={PALETTE.muted} lineWidth={1} opacity={0} />
// Fade in: yield* gridRef().opacity(0.12, 0.6)
```

---

## MC Constraints — Circular Dependency Patterns

Motion Canvas invalidates all signals simultaneously on seek/rewind. If a child reads `this.height()` or `this.width()` from a parent that is itself a flex child, MC detects a false cycle and throws.

Three fix patterns used in the DS components:

### Pattern 1 — Accent bar (DiagramNode, Callout)
Set `width: 2000` on the bar, put `clip: true` on the parent. Never `() => this.width()`.

### Pattern 2 — Inner Layout auto-sizing (DiagramNode, Callout)
No explicit `width`/`height` on the inner Layout — it auto-sizes from content. Lambdas for padding remain valid (one-way dependency).

### Pattern 3 — Slot in flex child
`_h: () => number` stores the height lambda passed as prop. Children use `this._h()` instead of `this.height()`, bypassing the MC layout signal.

**General rule:** inside a component whose instances will be flex children, never write `() => this.height()` or `() => this.width()` in sub-children. Either pass the lambda source directly, or use constant + `clip: true`.

---

## API Divergences (spec → actual code)

| Spec (Obsidian doc) | Actual prop/method | Reason |
|---------------------|--------------------|--------|
| `Edge.direction` | `edgeDirection` | Conflicts with `FlexDirection` from `LineProps` |
| `Packet.size` | `packetSize` | Conflicts with `Vector2 size` from `RectProps` |
| `Packet.moveTo()` | `flyTo(target, duration)` | `moveTo(index)` exists on MC `Node` |
| `Callout` anchor | Separate `ConnectionArrow` | Arrow is a `Line`, not a child of `Rect` |
| `Node.state` | `nodeState` | Avoids shadowing base `Node.state` |
| `Callout.state` | `calloutState` | Same reason |
| `Slot.state` | `slotState` | Same reason |
