/**
 * @file test-ds.tsx
 * @description Scène de validation visuelle — Design System Passe-Tech (≥ 2026-05-20).
 * Démontre les 6 primitives : DiagramNode, DiagramEdge, Packet, Zone, Callout, Slot/SlotGroup.
 */

import {makeScene2D, Grid, Txt, Layout} from '@motion-canvas/2d';
import {all, sequence, waitFor, waitUntil, createRef} from '@motion-canvas/core';
import {linear} from '@motion-canvas/core/lib/tweening';
import {
  DiagramNode, DiagramEdge, Packet, Zone, Callout, Slot, SlotGroup, ConnectionArrow,
} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  // ── Refs ─────────────────────────────────────────────────────────────────

  const gridRef      = createRef<Grid>();
  const titleRef     = createRef<Txt>();

  // Section 1 — DiagramNode (presets)
  const serverRef    = createRef<DiagramNode>();
  const containerRef = createRef<DiagramNode>();
  const dbRef        = createRef<DiagramNode>();
  const personRef    = createRef<DiagramNode>();

  // Section 2 — DiagramEdge
  const edgeSolid    = createRef<DiagramEdge>();
  const edgeDashed   = createRef<DiagramEdge>();
  const edgeAnim     = createRef<DiagramEdge>();

  // Section 3 — Packet
  const pktRef       = createRef<Packet>();

  // Section 4 — Zone
  const zoneRef      = createRef<Zone>();

  // Section 5 — Callout
  const calloutRef   = createRef<Callout>();
  const callArrow    = createRef<ConnectionArrow>();

  // Section 6 — SlotGroup + Slots individuels
  const slotGroupRef = createRef<SlotGroup>();
  const slot0        = createRef<Slot>();
  const slot1        = createRef<Slot>();
  const slot2        = createRef<Slot>();
  const slot3        = createRef<Slot>();

  // ── Scene tree ────────────────────────────────────────────────────────────

  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>

      <Grid key="grid" ref={gridRef}
        width={'100%'} height={'100%'}
        spacing={() => vW() * 0.05}
        stroke={PALETTE.ghost} lineWidth={1} opacity={0} />

      <Txt key="title" ref={titleRef}
        text="Design System — 6 Primitives"
        fill={PALETTE.cream}
        fontSize={() => vW() * 0.028}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
        y={() => vH() * -0.43}
        opacity={0} />

      {/* ── 1. DiagramNode — rangée de presets ──────────────────────────── */}

      <DiagramNode key="server"    ref={serverRef}
        preset="server"    label="web-01"    sublabel="nginx:80"
        width={() => vW() * 0.1} height={() => vH() * 0.22}
        x={() => vW() * -0.38} y={() => vH() * -0.17}
        opacity={0} />

      <DiagramNode key="container" ref={containerRef}
        preset="container" label="api"       sublabel="node:18"
        width={() => vW() * 0.1} height={() => vH() * 0.22}
        x={() => vW() * -0.25} y={() => vH() * -0.17}
        opacity={0} />

      <DiagramNode key="database"  ref={dbRef}
        preset="database"  label="pg-prod"   sublabel="5432"
        width={() => vW() * 0.1} height={() => vH() * 0.22}
        x={() => vW() * -0.12} y={() => vH() * -0.17}
        opacity={0} />

      <DiagramNode key="person"    ref={personRef}
        preset="person"    label="Attacker"
        color={PALETTE.dsRose}
        width={() => vW() * 0.1} height={() => vH() * 0.22}
        x={() => vW() *  0.01} y={() => vH() * -0.17}
        opacity={0} />

      {/* ── 2. DiagramEdge — 3 styles ───────────────────────────────────── */}

      <DiagramEdge key="edge-solid" ref={edgeSolid}
        from={() => [vW() * -0.38, vH() * 0.07]}
        to={() =>   [vW() * -0.22, vH() * 0.07]}
        edgeStyle="solid"
        label="solid"
        stroke={PALETTE.secondary}
        end={0} opacity={0} />

      <DiagramEdge key="edge-dashed" ref={edgeDashed}
        from={() => [vW() * -0.17, vH() * 0.07]}
        to={() =>   [vW() * -0.01, vH() * 0.07]}
        edgeStyle="dashed"
        label="dashed"
        stroke={PALETTE.secondary}
        end={0} opacity={0} />

      <DiagramEdge key="edge-anim" ref={edgeAnim}
        from={() => [vW() * 0.04, vH() * 0.07]}
        to={() =>   [vW() * 0.20, vH() * 0.07]}
        edgeStyle="animated"
        label="animated"
        stroke={PALETTE.cyan}
        edgeDirection="bi"
        end={0} opacity={0} />

      {/* ── 3. Packet ────────────────────────────────────────────────────── */}

      <Packet key="pkt" ref={pktRef}
        content="GET /api"
        color={PALETTE.cyan}
        packetSize="md"
        width={() => vW() * 0.1}
        height={() => vH() * 0.065}
        x={() => vW() * 0.32}
        y={() => vH() * 0.07}
        opacity={0} />

      {/* ── 4. Zone ──────────────────────────────────────────────────────── */}

      <Zone key="zone-trusted" ref={zoneRef}
        preset="trusted"
        label="INTERNAL NETWORK"
        width={() => vW() * 0.26}
        height={() => vH() * 0.18}
        x={() => vW() * 0.33}
        y={() => vH() * -0.17}
        opacity={0} />

      {/* ── 5. Callout ───────────────────────────────────────────────────── */}

      <Callout key="callout" ref={calloutRef}
        title="Token expiré"
        body="401 → redirect /login"
        color={PALETTE.dsRose}
        width={() => vW() * 0.2}
        height={() => vH() * 0.12}
        x={() => vW() * 0.32}
        y={() => vH() * 0.22}
        opacity={0} />

      <ConnectionArrow key="callout-arrow" ref={callArrow}
        from={() => [vW() * 0.22, vH() * 0.22]}
        to={() =>   [vW() * 0.08, vH() * 0.15]}
        stroke={PALETTE.dsRose}
        dashed
        end={0} opacity={0} />

      {/* ── 6. SlotGroup + Slots ─────────────────────────────────────────── */}

      <SlotGroup key="queue" ref={slotGroupRef}
        label="QUEUE · CAPACITY 4"
        color={PALETTE.amber}
        width={() => vW() * 0.42}
        height={() => vH() * 0.15}
        x={() => vW() * -0.15}
        y={() => vH() * 0.32}
        opacity={0}
      >
        <Slot key="slot-0" ref={slot0} index={0} content="msg-01"
          initialState="filled" color={PALETTE.amber}
          width={() => vW() * 0.07} height={() => vH() * 0.1} />
        <Slot key="slot-1" ref={slot1} index={1} content="msg-02"
          initialState="filled" color={PALETTE.amber}
          width={() => vW() * 0.07} height={() => vH() * 0.1} />
        <Slot key="slot-2" ref={slot2} index={2} content=""
          initialState="empty" color={PALETTE.amber}
          width={() => vW() * 0.07} height={() => vH() * 0.1} />
        <Slot key="slot-3" ref={slot3} index={3} content=""
          initialState="empty" color={PALETTE.amber}
          width={() => vW() * 0.07} height={() => vH() * 0.1} />
      </SlotGroup>

    </Layout>
  );

  // ── Animation ─────────────────────────────────────────────────────────────

  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.12, 0.6),
    titleRef().opacity(1, 0.5),
  );

  // 1. DiagramNode — presets et transitions d'état
  yield* waitUntil('showNodes');
  yield* sequence(0.12,
    serverRef().opacity(1, 0.3),
    containerRef().opacity(1, 0.3),
    dbRef().opacity(1, 0.3),
    personRef().opacity(1, 0.3),
  );

  yield* waitUntil('nodeStates');
  yield* all(
    serverRef().setState('active', 0.15),
    dbRef().setState('active', 0.15),
  );
  yield* waitFor(0.5);
  yield* personRef().setState('error', 0.08);
  yield* waitFor(0.4);
  yield* all(
    serverRef().setState('idle', 0.2),
    dbRef().setState('idle', 0.2),
    personRef().setState('idle', 0.2),
  );

  // Zone
  yield* waitUntil('showZone');
  yield* zoneRef().opacity(1, 0.4);

  // 2. DiagramEdge — 3 styles
  yield* waitUntil('showEdges');
  edgeSolid().opacity(1);
  yield* edgeSolid().end(1, 0.4);

  yield* waitFor(0.2);
  edgeDashed().opacity(1);
  yield* edgeDashed().end(1, 0.4);

  yield* waitFor(0.2);
  edgeAnim().opacity(1);
  yield* edgeAnim().end(1, 0.4);

  // Ant-march : quelques cycles pour la démo (pas de background thread)
  for (let dashIdx = 0; dashIdx < 5; dashIdx++) {
    yield* edgeAnim().lineDashOffset(edgeAnim().lineDashOffset() - 18, 0.65, linear);
  }

  // 3. Packet — flyTo
  yield* waitUntil('showPacket');
  yield* pktRef().opacity(1, 0.2);
  yield* pktRef().flyTo([vW() * 0.32, vH() * -0.17], 0.7);
  yield* waitFor(0.3);
  yield* pktRef().flyTo([vW() * 0.32, vH() * 0.07], 0.5);

  // 4. Callout + flèche
  yield* waitUntil('showCallout');
  yield* calloutRef().opacity(1, 0.2);
  callArrow().opacity(1);
  yield* callArrow().end(1, 0.35);
  yield* waitFor(0.3);
  yield* calloutRef().setState('error', 0.08);
  yield* waitFor(0.6);
  yield* calloutRef().setState('idle', 0.2);

  // 5. SlotGroup + transitions
  yield* waitUntil('showSlots');
  yield* slotGroupRef().opacity(1, 0.4);
  yield* waitFor(0.4);
  yield* slot0().setState('active', 0.12);
  yield* waitFor(0.25);
  yield* slot0().setState('consumed', 0.25);
  yield* slot1().setState('active', 0.12);
  yield* waitFor(0.25);
  yield* slot1().setState('consumed', 0.25);

  yield* waitFor(1.0);

  // Fin — fade-out général
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.4),
    titleRef().opacity(0, 0.4),
    serverRef().opacity(0, 0.4),
    containerRef().opacity(0, 0.4),
    dbRef().opacity(0, 0.4),
    personRef().opacity(0, 0.4),
    edgeSolid().opacity(0, 0.4),
    edgeDashed().opacity(0, 0.4),
    edgeAnim().opacity(0, 0.4),
    pktRef().opacity(0, 0.4),
    zoneRef().opacity(0, 0.4),
    calloutRef().opacity(0, 0.4),
    callArrow().opacity(0, 0.4),
    slotGroupRef().opacity(0, 0.4),
  );
  yield* waitFor(0.3);
});
