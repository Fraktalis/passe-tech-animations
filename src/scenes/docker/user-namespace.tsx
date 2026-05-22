import {makeScene2D, Layout, Rect, Txt, Grid} from '@motion-canvas/2d';
import {createRef, all, sequence, waitFor, waitUntil, cancel} from '@motion-canvas/core';
import {easeInOutCubic} from '@motion-canvas/core/lib/tweening';
import {DiagramNode, DiagramEdge, Zone, Terminal} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef              = createRef<Grid>();
  const titleRef             = createRef<Txt>();
  const containerZoneRef     = createRef<Zone>();
  const hostZoneRef          = createRef<Zone>();
  const containerRootRef     = createRef<DiagramNode>();
  const hostRemappedRef      = createRef<DiagramNode>();
  const hostRootRef          = createRef<DiagramNode>();
  const remapEdgeRef         = createRef<DiagramEdge>();
  const directEdgeRef        = createRef<DiagramEdge>();
  const nsConfigRef          = createRef<Txt>();
  const lazyNoteRef          = createRef<Txt>();
  const terminalRef          = createRef<Terminal>();

  // ── Scène ─────────────────────────────────────────────────────────────────
  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>
      <Rect key="bg" width={'100%'} height={'100%'} fill={PALETTE.bg} />

      <Grid
        key="bg-grid"
        ref={gridRef}
        width={'100%'}
        height={'100%'}
        spacing={() => vW() * 0.04}
        stroke={PALETTE.cream + '15'}
        lineWidth={1}
        opacity={0}
      />

      {/* Titre */}
      <Txt
        key="scene-title"
        ref={titleRef}
        text="user namespace"
        fill={PALETTE.vert}
        fontSize={() => vW() * 0.022}
        fontFamily={'Space Grotesk, DM Sans, sans-serif'}
        fontWeight={700}
        x={0}
        y={() => vH() * -0.46}
        opacity={0}
      />

      {/* Zone CONTAINER (gauche) */}
      <Zone
        key="container-zone"
        ref={containerZoneRef}
        preset="sandbox"
        label="CONTAINER"
        width={() => vW() * 0.26}
        height={() => vH() * 0.50}
        x={() => vW() * -0.28}
        y={() => vH() * -0.09}
        opacity={0}
      />

      {/* Zone HOST (droite) */}
      <Zone
        key="host-zone"
        ref={hostZoneRef}
        preset="trusted"
        label="HOST"
        width={() => vW() * 0.26}
        height={() => vH() * 0.50}
        x={() => vW() * 0.28}
        y={() => vH() * -0.09}
        opacity={0}
      />

      {/* Nœud container : UID 0 (root) */}
      <DiagramNode
        key="container-root"
        ref={containerRootRef}
        preset="person"
        label="UID 0"
        sublabel="root"
        color={PALETTE.rose}
        initialState="error"
        width={() => vW() * 0.125}
        height={() => vH() * 0.15}
        x={() => vW() * -0.28}
        y={() => vH() * -0.09}
        opacity={0}
      />

      {/* Nœud hôte : UID 100000 — avec user namespace (bonne issue) */}
      <DiagramNode
        key="host-remapped"
        ref={hostRemappedRef}
        preset="person"
        label="UID 100000"
        sublabel="user ordinaire"
        color={PALETTE.vert}
        initialState="success"
        width={() => vW() * 0.125}
        height={() => vH() * 0.15}
        x={() => vW() * 0.28}
        y={() => vH() * -0.20}
        opacity={0}
      />

      {/* Nœud hôte : UID 0 — défaut Docker (mauvaise issue) */}
      <DiagramNode
        key="host-root"
        ref={hostRootRef}
        preset="person"
        label="UID 0"
        sublabel="root sur l'hôte"
        color={PALETTE.rose}
        initialState="error"
        width={() => vW() * 0.125}
        height={() => vH() * 0.15}
        x={() => vW() * 0.28}
        y={() => vH() * 0.05}
        opacity={0}
      />

      {/* Flèche de remapping — user namespace (vert, tiretée) */}
      <DiagramEdge
        key="remap-edge"
        ref={remapEdgeRef}
        from={() => [vW() * -0.218, vH() * -0.11]}
        to={() =>   [vW() *  0.218, vH() * -0.20]}
        edgeDirection="uni"
        edgeStyle="dashed"
        label="user namespace"
        stroke={PALETTE.vert}
        end={0}
        opacity={0}
      />

      {/* Flèche directe — défaut Docker (rose, pleine) */}
      <DiagramEdge
        key="direct-edge"
        ref={directEdgeRef}
        from={() => [vW() * -0.218, vH() * -0.07]}
        to={() =>   [vW() *  0.218, vH() *  0.05]}
        edgeDirection="uni"
        edgeStyle="solid"
        label="défaut Docker"
        stroke={PALETTE.rose}
        end={0}
        opacity={0}
      />

      {/* Config user namespace */}
      <Txt
        key="ns-config"
        ref={nsConfigRef}
        text={'{ "userns-remap": "default" }  ← /etc/docker/daemon.json'}
        fill={PALETTE.vert}
        fontSize={() => vW() * 0.011}
        fontFamily={'DM Mono, monospace'}
        x={0}
        y={() => vH() * -0.35}
        opacity={0}
      />

      {/* Note "on a la flemme" */}
      <Txt
        key="lazy-note"
        ref={lazyNoteRef}
        text="configuration supplémentaire → non activé par défaut"
        fill={PALETTE.amber}
        fontSize={() => vW() * 0.014}
        fontFamily={'DM Sans, sans-serif'}
        fontWeight={500}
        x={0}
        y={() => vH() * 0.21}
        opacity={0}
      />

      {/* Terminal */}
      <Terminal
        key="terminal"
        ref={terminalRef}
        title="root@container — bash"
        fontSize={() => vW() * 0.013}
        width={() => vW() * 0.68}
        height={() => vH() * 0.23}
        x={0}
        y={() => vH() * 0.38}
        maxLines={5}
        opacity={0}
      />
    </Layout>
  );

  // ── Phase 1 — Setup : container + UID 0 root ──────────────────────────────
  yield* waitUntil('showSetup');
  yield* all(
    gridRef().opacity(0.12, 0.6),
    titleRef().opacity(1, 0.5),
    containerZoneRef().opacity(1, 0.4),
    sequence(0.2,
      containerRootRef().opacity(1, 0.35),
    ),
  );

  // ── Phase 2 — Présenter le user namespace (la bonne solution, en premier) ─
  yield* waitUntil('showUserNs');
  yield* hostZoneRef().opacity(1, 0.4);
  yield* sequence(0.15,
    hostRemappedRef().opacity(1, 0.35),
    nsConfigRef().opacity(1, 0.35),
  );
  remapEdgeRef().opacity(1);
  yield* remapEdgeRef().end(1, 0.5, easeInOutCubic);

  // ── Phase 3 — "Mais on a la flemme" : effacer le user namespace ────────────
  yield* waitUntil('showLazy');
  yield* all(
    hostRemappedRef().opacity(0.10, 0.5),
    remapEdgeRef().opacity(0.10, 0.5),
    nsConfigRef().opacity(0, 0.4),
    lazyNoteRef().opacity(1, 0.4),
  );

  // ── Phase 4 — Mapping par défaut : root → root (la réalité) ───────────────
  yield* waitUntil('showDefault');
  yield* sequence(0.15,
    hostRootRef().opacity(1, 0.35),
  );
  directEdgeRef().opacity(1);
  yield* directEdgeRef().end(1, 0.5, easeInOutCubic);

  // Terminal : id dans le container → root sur l'hôte
  yield* terminalRef().opacity(1, 0.4);
  const blinkTask = yield terminalRef().startBlink();

  yield* waitUntil('showId');
  yield* terminalRef().typewrite('id', {prompt: true, charDelay: 0.06});
  cancel(blinkTask);
  yield* terminalRef().typewrite(
    "uid=0(root) gid=0(root) groups=0(root)  ← root sur l'hôte",
    {color: 'danger'},
  );

  // Zone hôte passe en rouge — compromission
  yield* all(
    hostZoneRef().fill(PALETTE.rose + '1A', 0.4),
    hostZoneRef().stroke(PALETTE.rose + 'CC', 0.4),
  );

  yield* waitFor(1.5);

  // ── Fin ───────────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.4),
    titleRef().opacity(0, 0.3),
    containerZoneRef().opacity(0, 0.4),
    hostZoneRef().opacity(0, 0.4),
    containerRootRef().opacity(0, 0.3),
    hostRemappedRef().opacity(0, 0.3),
    hostRootRef().opacity(0, 0.3),
    remapEdgeRef().opacity(0, 0.3),
    directEdgeRef().opacity(0, 0.3),
    nsConfigRef().opacity(0, 0.3),
    lazyNoteRef().opacity(0, 0.3),
    terminalRef().opacity(0, 0.3),
  );
});
