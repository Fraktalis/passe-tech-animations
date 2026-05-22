import {makeScene2D, Layout, Rect, Txt, Grid} from '@motion-canvas/2d';
import {createRef, all, sequence, waitFor, waitUntil, cancel, spawn} from '@motion-canvas/core';
import {easeInOutCubic} from '@motion-canvas/core/lib/tweening';
import {DiagramNode, DiagramEdge, Zone, Terminal, Callout, ConnectionArrow} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef            = createRef<Grid>();
  const titleRef           = createRef<Txt>();
  const hostZoneRef        = createRef<Zone>();
  const containerZoneRef   = createRef<Zone>();
  const etcNodeRef         = createRef<DiagramNode>();
  const homeNodeRef        = createRef<DiagramNode>();
  const rootUserRef        = createRef<DiagramNode>();
  const appUserRef         = createRef<DiagramNode>();
  const attackerRef        = createRef<DiagramNode>();
  const rootToEtcEdgeRef   = createRef<DiagramEdge>();
  const rootToHomeEdgeRef  = createRef<DiagramEdge>();
  const attackerEdgeRef    = createRef<DiagramEdge>();
  const blockedEdgeRef     = createRef<DiagramEdge>();
  const emptyBoxCalloutRef = createRef<Callout>();
  const calloutArrowRef    = createRef<ConnectionArrow>();
  const terminalRef        = createRef<Terminal>();

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

      <Txt
        key="scene-title"
        ref={titleRef}
        text="USER app"
        fill={PALETTE.vert}
        fontSize={() => vW() * 0.022}
        fontFamily={'Space Grotesk, DM Sans, sans-serif'}
        fontWeight={700}
        x={0}
        y={() => vH() * -0.46}
        opacity={0}
      />

      {/* Zone HOST — filesystem de l'hôte */}
      <Zone
        key="host-zone"
        ref={hostZoneRef}
        preset="trusted"
        label="HOST"
        width={() => vW() * 0.28}
        height={() => vH() * 0.50}
        x={() => vW() * -0.295}
        y={() => vH() * -0.07}
        opacity={0}
      />

      {/* Zone CONTAINER — sandbox isolée */}
      <Zone
        key="container-zone"
        ref={containerZoneRef}
        preset="sandbox"
        label="CONTAINER"
        width={() => vW() * 0.28}
        height={() => vH() * 0.50}
        x={() => vW() * 0.12}
        y={() => vH() * -0.07}
        opacity={0}
      />

      {/* /etc — config système */}
      <DiagramNode
        key="etc-node"
        ref={etcNodeRef}
        preset="file"
        iconName="mdi:folder-cog-outline"
        label="/etc"
        color={PALETTE.secondary}
        width={() => vW() * 0.105}
        height={() => vH() * 0.085}
        x={() => vW() * -0.355}
        y={() => vH() * -0.04}
        opacity={0}
      />

      {/* /home — données utilisateur */}
      <DiagramNode
        key="home-node"
        ref={homeNodeRef}
        preset="file"
        iconName="mdi:home-outline"
        label="/home"
        color={PALETTE.secondary}
        width={() => vW() * 0.105}
        height={() => vH() * 0.085}
        x={() => vW() * -0.235}
        y={() => vH() * -0.04}
        opacity={0}
      />

      {/* UID 0 — root dans le container (configuration dangereuse) */}
      <DiagramNode
        key="root-user"
        ref={rootUserRef}
        preset="person"
        iconName="lucide:skull"
        label="UID 0"
        sublabel="root"
        color={PALETTE.rose}
        initialState="error"
        width={() => vW() * 0.12}
        height={() => vH() * 0.14}
        x={() => vW() * 0.12}
        y={() => vH() * -0.07}
        opacity={0}
      />

      {/* app (UID 1000) — utilisateur dédié sans privilèges */}
      <DiagramNode
        key="app-user"
        ref={appUserRef}
        preset="person"
        label="app"
        sublabel="UID 1000"
        color={PALETTE.vert}
        initialState="success"
        width={() => vW() * 0.12}
        height={() => vH() * 0.14}
        x={() => vW() * 0.12}
        y={() => vH() * -0.07}
        opacity={0}
      />

      {/* Attaquant — externe, qui compromet l'application */}
      <DiagramNode
        key="attacker"
        ref={attackerRef}
        preset="person"
        iconName="lucide:skull"
        label="attaquant"
        color={PALETTE.rose}
        initialState="error"
        width={() => vW() * 0.115}
        height={() => vH() * 0.14}
        x={() => vW() * 0.42}
        y={() => vH() * -0.07}
        opacity={0}
      />

      {/* Flèche root → /etc — root du container = root sur l'hôte */}
      <DiagramEdge
        key="root-to-etc"
        ref={rootToEtcEdgeRef}
        from={() => [vW() * 0.058, vH() * -0.085]}
        to={() =>   [vW() * -0.302, vH() * -0.04]}
        edgeDirection="uni"
        edgeStyle="animated"
        stroke={PALETTE.rose}
        end={0}
        opacity={0}
      />

      {/* Flèche root → /home */}
      <DiagramEdge
        key="root-to-home"
        ref={rootToHomeEdgeRef}
        from={() => [vW() * 0.058, vH() * -0.055]}
        to={() =>   [vW() * -0.182, vH() * -0.04]}
        edgeDirection="uni"
        edgeStyle="animated"
        stroke={PALETTE.rose}
        end={0}
        opacity={0}
      />

      {/* Flèche attaquant → container */}
      <DiagramEdge
        key="attacker-edge"
        ref={attackerEdgeRef}
        from={() => [vW() * 0.362, vH() * -0.07]}
        to={() =>   [vW() * 0.262, vH() * -0.07]}
        edgeDirection="uni"
        edgeStyle="solid"
        stroke={PALETTE.rose}
        end={0}
        opacity={0}
      />

      {/* Flèche bloquée — l'attaquant tente d'accéder au host, s'arrête en chemin */}
      <DiagramEdge
        key="blocked-edge"
        ref={blockedEdgeRef}
        from={() => [vW() * -0.022, vH() * -0.07]}
        to={() =>   [vW() * -0.155, vH() * -0.07]}
        edgeDirection="uni"
        edgeStyle="dashed"
        stroke={PALETTE.rose}
        end={0}
        opacity={0}
      />

      {/* Callout "boîte vide" — ancré au container */}
      <Callout
        key="empty-box-callout"
        ref={emptyBoxCalloutRef}
        title="boîte vide"
        body="pas de shell · pas de home · pas de privilèges"
        color={PALETTE.vert}
        width={() => vW() * 0.28}
        height={() => vH() * 0.13}
        x={() => vW() * 0.12}
        y={() => vH() * 0.22}
        opacity={0}
      />

      <ConnectionArrow
        key="callout-arrow"
        ref={calloutArrowRef}
        from={() => [vW() * 0.12, vH() * 0.155]}
        to={() =>   [vW() * 0.12, vH() * 0.035]}
        stroke={PALETTE.vert}
        dashed
        end={0}
        opacity={0}
      />

      {/* Terminal — Dockerfile fix */}
      <Terminal
        key="terminal"
        ref={terminalRef}
        title="Dockerfile"
        fontSize={() => vW() * 0.014}
        width={() => vW() * 0.68}
        height={() => vH() * 0.22}
        x={0}
        y={() => vH() * 0.38}
        maxLines={5}
        opacity={0}
      />
    </Layout>
  );

  // ── Phase 1 — Setup : zones vides + filesystem hôte ──────────────────────
  yield* waitUntil('showSetup');
  yield* all(
    gridRef().opacity(0.12, 0.6),
    titleRef().opacity(1, 0.5),
    hostZoneRef().opacity(1, 0.4),
    containerZoneRef().opacity(1, 0.4),
    sequence(0.12,
      etcNodeRef().opacity(1, 0.3),
      homeNodeRef().opacity(1, 0.3),
    ),
  );

  // ── Phase 2 — Root user dans le container ─────────────────────────────────
  yield* waitUntil('showRootContainer');
  yield* rootUserRef().opacity(1, 0.35);

  // ── Phase 3 — Root → accès libre au filesystem hôte ──────────────────────
  yield* waitUntil('showRootFlows');
  rootToEtcEdgeRef().opacity(1);
  rootToHomeEdgeRef().opacity(1);
  yield* all(
    rootToEtcEdgeRef().end(1, 0.5, easeInOutCubic),
    rootToHomeEdgeRef().end(1, 0.5, easeInOutCubic),
  );
  spawn(rootToEtcEdgeRef().animateDash());
  spawn(rootToHomeEdgeRef().animateDash());

  yield* all(
    hostZoneRef().fill(PALETTE.dsRose + '1A', 0.4),
    hostZoneRef().stroke(PALETTE.dsRose + 'CC', 0.4),
    etcNodeRef().setState('error', 0.2),
    homeNodeRef().setState('error', 0.2),
  );

  // ── Phase 4 — Fix Dockerfile : USER app ───────────────────────────────────
  yield* waitUntil('showDockerfileFix');
  yield* all(
    rootToEtcEdgeRef().opacity(0, 0.3),
    rootToHomeEdgeRef().opacity(0, 0.3),
    rootUserRef().opacity(0, 0.3),
    hostZoneRef().fill(PALETTE.dsGreen + '0F', 0.4),
    hostZoneRef().stroke(PALETTE.dsGreen + '99', 0.4),
    etcNodeRef().setState('idle', 0.2),
    homeNodeRef().setState('idle', 0.2),
    terminalRef().opacity(1, 0.4),
  );

  const blinkTask = yield terminalRef().startBlink();
  yield* terminalRef().typewrite('# avant CMD', {color: 'ghost'});
  yield* terminalRef().typewrite(
    'RUN groupadd -r app && useradd -r -g app app',
    {color: 'vert', charDelay: 0.022},
  );
  yield* terminalRef().typewrite('USER app', {color: 'jaune', charDelay: 0.05});
  cancel(blinkTask);
  yield* terminalRef().hideCursor();

  // ── Phase 5 — Container rebuild : app user (UID 1000) remplace root ───────
  yield* waitUntil('showAppContainer');
  yield* appUserRef().opacity(1, 0.35);

  // ── Phase 6 — Attaquant compromet l'application ───────────────────────────
  yield* waitUntil('showAttacker');
  yield* attackerRef().opacity(1, 0.35);
  attackerEdgeRef().opacity(1);
  yield* attackerEdgeRef().end(1, 0.45, easeInOutCubic);

  // ── Phase 7 — Attaquant coincé : la flèche vers le host s'arrête ─────────
  yield* waitUntil('showAttackBlocked');
  blockedEdgeRef().opacity(0.55);
  yield* blockedEdgeRef().end(0.65, 0.4, easeInOutCubic);
  yield* waitFor(0.3);
  yield* blockedEdgeRef().opacity(0, 0.35);

  // Callout "boîte vide" — l'attaquant est enfermé dans le vide
  calloutArrowRef().opacity(1);
  yield* calloutArrowRef().end(1, 0.35, easeInOutCubic);
  yield* emptyBoxCalloutRef().opacity(1, 0.3);

  yield* waitFor(2.0);

  // ── Fin ───────────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.4),
    titleRef().opacity(0, 0.3),
    hostZoneRef().opacity(0, 0.4),
    containerZoneRef().opacity(0, 0.4),
    etcNodeRef().opacity(0, 0.25),
    homeNodeRef().opacity(0, 0.25),
    rootUserRef().opacity(0, 0.3),
    appUserRef().opacity(0, 0.3),
    attackerRef().opacity(0, 0.3),
    rootToEtcEdgeRef().opacity(0, 0.3),
    rootToHomeEdgeRef().opacity(0, 0.3),
    attackerEdgeRef().opacity(0, 0.3),
    blockedEdgeRef().opacity(0, 0.3),
    emptyBoxCalloutRef().opacity(0, 0.3),
    calloutArrowRef().opacity(0, 0.3),
    terminalRef().opacity(0, 0.3),
  );
});
