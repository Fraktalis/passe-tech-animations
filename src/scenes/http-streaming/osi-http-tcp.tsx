/**
 * osi-http-tcp — Positionnement d'HTTP (L7) et TCP (L4) dans le modèle OSI.
 *
 * BASCULE vidéo SSE/WebSocket/Streamable HTTP : HTTP est une couche applicative
 * qui repose sur TCP pour le transport — fiabilité, ordre, retransmission,
 * au prix d'un handshake avant le premier octet utile.
 *
 * Reprend la construction pyramidale de `reverse-proxy/lb-osi.tsx` (même
 * langage visuel entre vidéos OSI), portée sur PALETTE + composants DS.
 * Couleur active : cyan (data en transit).
 */
import {makeScene2D, Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  easeInOutCubic,
  sequence,
  waitFor,
  waitUntil,
} from '@motion-canvas/core';
import {ConnectionArrow, DiagramNode, Packet} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const camera          = createRef<Layout>();
  const gridRef        = createRef<Grid>();
  const osiTitle        = createRef<Txt>();
  const pyramidWrapper  = createRef<Layout>();

  // Couches (L1 bas → L7 haut)
  const layer1 = createRef<Rect>();
  const layer2 = createRef<Rect>();
  const layer3 = createRef<Rect>();
  const layer4 = createRef<Rect>();
  const layer5 = createRef<Rect>();
  const layer6 = createRef<Rect>();
  const layer7 = createRef<Rect>();

  // Boîte HTTP (L7)
  const httpBox      = createRef<Rect>();
  const httpBadge     = createRef<Rect>();

  // Boîte TCP (L4)
  const tcpBox         = createRef<Rect>();
  const reliableBadge  = createRef<Rect>();
  const orderedBadge   = createRef<Rect>();
  const retransmitBadge = createRef<Rect>();

  // Flèche de dépendance HTTP → TCP
  const dependsArrow = createRef<ConnectionArrow>();
  const dependsLabel = createRef<Txt>();

  // Mini handshake (dans la boîte TCP) — un Packet par message, contenu fixe
  const handshakeClient = createRef<DiagramNode>();
  const handshakeServer = createRef<DiagramNode>();
  const synPacket       = createRef<Packet>();
  const synAckPacket    = createRef<Packet>();
  const ackPacket       = createRef<Packet>();
  const requestPacket   = createRef<Packet>();
  const overheadLabel   = createRef<Txt>();
  const connectionWire  = createRef<Line>();

  // Géométrie de la boîte TCP / mini handshake
  const TCP_BOX_X = () => vW() * 0.27;
  const TCP_BOX_Y = () => vH() * 0.165;
  const HS_NODE_W = () => vW() * 0.045;
  const HS_NODE_H = () => vH() * 0.075;
  const HS_CLIENT_X = () => TCP_BOX_X() - vW() * 0.095;
  const HS_SERVER_X = () => TCP_BOX_X() + vW() * 0.095;
  const HS_Y        = () => TCP_BOX_Y() + vH() * 0.055;

  // Zoom caméra — plonge sur le mini handshake, plein écran
  const ZOOM_SCALE = 2.6;

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE TREE
  // ══════════════════════════════════════════════════════════════════════════
  view.add(
    <Layout key="root" ref={camera}>
      <Grid
        key="grid"
        ref={gridRef}
        width={'100%'} height={'100%'}
        spacing={() => vW() * 0.031}
        stroke={PALETTE.ghost}
        lineWidth={1}
        opacity={0}
      />

      <Txt
        key="osi-title"
        ref={osiTitle}
        text="MODÈLE OSI — 7 COUCHES"
        fill={PALETTE.ghost}
        fontSize={() => vW() * 0.013}
        fontWeight={700}
        fontFamily={'Space Grotesk, DM Sans, sans-serif'}
        letterSpacing={2}
        x={0}
        y={() => -vH() * 0.38}
        opacity={0}
      />

      {/* ═══ PYRAMIDE OSI ══════════════════════════════════════════════════ */}
      <Layout key="pyramid-wrapper" ref={pyramidWrapper} x={() => -vW() * 0.26} y={0} scale={0.62}>
        <Rect key="layer-1-box" ref={layer1}
          x={0} y={() => vH() * 0.21}
          width={() => vW() * 0.50} height={() => vH() * 0.062}
          fill={PALETTE.bgCard} stroke={PALETTE.ghost} lineWidth={1}
          radius={() => vW() * 0.003} opacity={0}
          layout direction={'row'} alignItems={'center'} justifyContent={'space-between'}
          paddingLeft={() => vW() * 0.016} paddingRight={() => vW() * 0.016}
        >
          <Txt key="l1-num" text="L1" fill={PALETTE.ghost} fontSize={() => vW() * 0.013} fontWeight={700} fontFamily={'JetBrains Mono, DM Mono, monospace'} />
          <Txt key="l1-name" text="Physical" fill={PALETTE.ghost} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk, DM Sans, sans-serif'} />
          <Txt key="l1-detail" text="bits · câbles" fill={PALETTE.ghost + '99'} fontSize={() => vW() * 0.008} fontFamily={'JetBrains Mono, DM Mono, monospace'} />
        </Rect>

        <Rect key="layer-2-box" ref={layer2}
          x={0} y={() => vH() * 0.14}
          width={() => vW() * 0.44} height={() => vH() * 0.062}
          fill={PALETTE.bgCard} stroke={PALETTE.ghost} lineWidth={1}
          radius={() => vW() * 0.003} opacity={0}
          layout direction={'row'} alignItems={'center'} justifyContent={'space-between'}
          paddingLeft={() => vW() * 0.014} paddingRight={() => vW() * 0.014}
        >
          <Txt key="l2-num" text="L2" fill={PALETTE.ghost} fontSize={() => vW() * 0.013} fontWeight={700} fontFamily={'JetBrains Mono, DM Mono, monospace'} />
          <Txt key="l2-name" text="Data Link" fill={PALETTE.ghost} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk, DM Sans, sans-serif'} />
          <Txt key="l2-detail" text="MAC · Ethernet" fill={PALETTE.ghost + '99'} fontSize={() => vW() * 0.008} fontFamily={'JetBrains Mono, DM Mono, monospace'} />
        </Rect>

        <Rect key="layer-3-box" ref={layer3}
          x={0} y={() => vH() * 0.07}
          width={() => vW() * 0.38} height={() => vH() * 0.062}
          fill={PALETTE.bgCard} stroke={PALETTE.ghost} lineWidth={1}
          radius={() => vW() * 0.003} opacity={0}
          layout direction={'row'} alignItems={'center'} justifyContent={'space-between'}
          paddingLeft={() => vW() * 0.012} paddingRight={() => vW() * 0.012}
        >
          <Txt key="l3-num" text="L3" fill={PALETTE.ghost} fontSize={() => vW() * 0.013} fontWeight={700} fontFamily={'JetBrains Mono, DM Mono, monospace'} />
          <Txt key="l3-name" text="Network" fill={PALETTE.ghost} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk, DM Sans, sans-serif'} />
          <Txt key="l3-detail" text="IP" fill={PALETTE.ghost + '99'} fontSize={() => vW() * 0.008} fontFamily={'JetBrains Mono, DM Mono, monospace'} />
        </Rect>

        {/* L4 — Transport (TCP, focus) */}
        <Rect key="layer-4-box" ref={layer4}
          x={0} y={0}
          width={() => vW() * 0.32} height={() => vH() * 0.062}
          fill={PALETTE.bgCard} stroke={PALETTE.cyan + '55'} lineWidth={2}
          radius={() => vW() * 0.003} opacity={0}
          layout direction={'row'} alignItems={'center'} justifyContent={'space-between'}
          paddingLeft={() => vW() * 0.010} paddingRight={() => vW() * 0.010}
        >
          <Txt key="l4-num" text="L4" fill={PALETTE.cyan + '99'} fontSize={() => vW() * 0.013} fontWeight={700} fontFamily={'JetBrains Mono, DM Mono, monospace'} />
          <Txt key="l4-name" text="Transport" fill={PALETTE.cream + 'BB'} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk, DM Sans, sans-serif'} />
          <Txt key="l4-detail" text="TCP" fill={PALETTE.cyan + '77'} fontSize={() => vW() * 0.008} fontFamily={'JetBrains Mono, DM Mono, monospace'} />
        </Rect>

        <Rect key="layer-5-box" ref={layer5}
          x={0} y={() => -vH() * 0.07}
          width={() => vW() * 0.26} height={() => vH() * 0.062}
          fill={PALETTE.bgCard} stroke={PALETTE.ghost} lineWidth={1}
          radius={() => vW() * 0.003} opacity={0}
          layout direction={'row'} alignItems={'center'} justifyContent={'space-between'}
          paddingLeft={() => vW() * 0.009} paddingRight={() => vW() * 0.009}
        >
          <Txt key="l5-num" text="L5" fill={PALETTE.ghost} fontSize={() => vW() * 0.012} fontWeight={700} fontFamily={'JetBrains Mono, DM Mono, monospace'} />
          <Txt key="l5-name" text="Session" fill={PALETTE.ghost} fontSize={() => vW() * 0.009} fontWeight={600} fontFamily={'Space Grotesk, DM Sans, sans-serif'} />
          <Txt key="l5-detail" text="sessions" fill={PALETTE.ghost + '99'} fontSize={() => vW() * 0.007} fontFamily={'JetBrains Mono, DM Mono, monospace'} />
        </Rect>

        <Rect key="layer-6-box" ref={layer6}
          x={0} y={() => -vH() * 0.14}
          width={() => vW() * 0.20} height={() => vH() * 0.062}
          fill={PALETTE.bgCard} stroke={PALETTE.ghost} lineWidth={1}
          radius={() => vW() * 0.003} opacity={0}
          layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.004}
        >
          <Txt key="l6-num" text="L6" fill={PALETTE.ghost} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'JetBrains Mono, DM Mono, monospace'} />
          <Txt key="l6-name" text="Présentation" fill={PALETTE.ghost} fontSize={() => vW() * 0.008} fontWeight={600} fontFamily={'Space Grotesk, DM Sans, sans-serif'} />
        </Rect>

        {/* L7 — Application (HTTP, focus) */}
        <Rect key="layer-7-box" ref={layer7}
          x={0} y={() => -vH() * 0.21}
          width={() => vW() * 0.14} height={() => vH() * 0.062}
          fill={PALETTE.bgCard} stroke={PALETTE.cyan + '55'} lineWidth={2}
          radius={() => vW() * 0.003} opacity={0}
          layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.004}
        >
          <Txt key="l7-num" text="L7" fill={PALETTE.cyan + '99'} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'JetBrains Mono, DM Mono, monospace'} />
          <Txt key="l7-name" text="Application" fill={PALETTE.cream + 'BB'} fontSize={() => vW() * 0.007} fontWeight={600} fontFamily={'Space Grotesk, DM Sans, sans-serif'} />
        </Rect>
      </Layout>

      {/* ═══ FLÈCHE DE DÉPENDANCE HTTP → TCP ═════════════════════════════════ */}
      <ConnectionArrow key="depends-arrow" ref={dependsArrow}
        from={() => [TCP_BOX_X(), -vH() * 0.055]}
        to={() =>   [TCP_BOX_X(), TCP_BOX_Y() - vH() * 0.105]}
        stroke={PALETTE.cyan}
        end={0} opacity={0}
      />
      <Txt key="depends-label" ref={dependsLabel}
        text="repose sur"
        fill={PALETTE.cyan}
        fontSize={() => vW() * 0.009}
        fontFamily={'Space Grotesk, DM Sans, sans-serif'}
        fontWeight={600}
        x={() => TCP_BOX_X() + vW() * 0.035}
        y={() => (-vH() * 0.055 + TCP_BOX_Y() - vH() * 0.105) / 2}
        opacity={0}
      />

      {/* ═══ BOÎTE HTTP (L7, droite haut) ════════════════════════════════════ */}
      <Rect key="http-box" ref={httpBox}
        x={TCP_BOX_X} y={() => -vH() * 0.165}
        width={() => vW() * 0.30} height={() => vH() * 0.185}
        fill={PALETTE.nodeBg} stroke={PALETTE.cyan} lineWidth={2}
        radius={() => vW() * 0.007} opacity={0} clip
        layout direction={'column'} alignItems={'center'} gap={0}
      >
        <Rect key="http-header" width={'100%'} height={() => vH() * 0.06}
          fill={PALETTE.cyan + '22'}
          layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.005}
        >
          <Txt key="http-title" text="L7 · HTTP" fill={PALETTE.cyan} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'Space Grotesk, DM Sans, sans-serif'} />
          <Txt key="http-subtitle" text="couche Application" fill={PALETTE.secondary} fontSize={() => vW() * 0.008} fontFamily={'Space Grotesk, DM Sans, sans-serif'} />
        </Rect>
        <Rect key="http-divider" width={'100%'} height={1} fill={PALETTE.cyan + '40'} />
        <Rect key="http-body" grow={1} width={'100%'}
          layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.014}
        >
          <Rect key="http-badge" ref={httpBadge}
            fill={PALETTE.cyan + '18'} stroke={PALETTE.cyan} lineWidth={1}
            radius={() => vW() * 0.003} padding={() => vW() * 0.010} opacity={0}
            layout justifyContent={'center'}
          >
            <Txt key="http-badge-text" text="HTTP/1.1" fill={PALETTE.cyan} fontSize={() => vW() * 0.010} fontFamily={'JetBrains Mono, DM Mono, monospace'} fontWeight={700} />
          </Rect>
          <Txt key="http-role" text="requête → réponse, une seule fois" fill={PALETTE.secondary} fontSize={() => vW() * 0.009} fontFamily={'Space Grotesk, DM Sans, sans-serif'} />
        </Rect>
      </Rect>

      {/* ═══ BOÎTE TCP (L4, droite bas) ══════════════════════════════════════ */}
      <Rect key="tcp-box" ref={tcpBox}
        x={TCP_BOX_X} y={TCP_BOX_Y}
        width={() => vW() * 0.30} height={() => vH() * 0.235}
        fill={PALETTE.nodeBg} stroke={PALETTE.cyan} lineWidth={2}
        radius={() => vW() * 0.007} opacity={0} clip
        layout direction={'column'} alignItems={'center'} gap={0}
      >
        <Rect key="tcp-header" width={'100%'} height={() => vH() * 0.06}
          fill={PALETTE.cyan + '22'}
          layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.005}
        >
          <Txt key="tcp-title" text="L4 · TCP" fill={PALETTE.cyan} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'Space Grotesk, DM Sans, sans-serif'} />
          <Txt key="tcp-subtitle" text="couche Transport" fill={PALETTE.secondary} fontSize={() => vW() * 0.008} fontFamily={'Space Grotesk, DM Sans, sans-serif'} />
        </Rect>
        <Rect key="tcp-divider" width={'100%'} height={1} fill={PALETTE.cyan + '40'} />
        <Rect key="tcp-body" grow={1} width={'100%'}
          layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.010}
          padding={() => vW() * 0.010}
        >
          <Rect key="tcp-badges-row" width={'100%'} layout direction={'row'} alignItems={'center'} justifyContent={'center'} gap={() => vW() * 0.007}>
            <Rect key="reliable-badge" ref={reliableBadge}
              fill={PALETTE.cyan + '18'} stroke={PALETTE.cyan} lineWidth={1}
              radius={() => vW() * 0.003} padding={() => vW() * 0.007} opacity={0}
              layout justifyContent={'center'}
            >
              <Txt key="reliable-text" text="fiabilité" fill={PALETTE.cyan} fontSize={() => vW() * 0.008} fontFamily={'JetBrains Mono, DM Mono, monospace'} fontWeight={700} />
            </Rect>
            <Rect key="ordered-badge" ref={orderedBadge}
              fill={PALETTE.cyan + '18'} stroke={PALETTE.cyan} lineWidth={1}
              radius={() => vW() * 0.003} padding={() => vW() * 0.007} opacity={0}
              layout justifyContent={'center'}
            >
              <Txt key="ordered-text" text="ordre" fill={PALETTE.cyan} fontSize={() => vW() * 0.008} fontFamily={'JetBrains Mono, DM Mono, monospace'} fontWeight={700} />
            </Rect>
            <Rect key="retransmit-badge" ref={retransmitBadge}
              fill={PALETTE.cyan + '18'} stroke={PALETTE.cyan} lineWidth={1}
              radius={() => vW() * 0.003} padding={() => vW() * 0.007} opacity={0}
              layout justifyContent={'center'}
            >
              <Txt key="retransmit-text" text="retransmission" fill={PALETTE.cyan} fontSize={() => vW() * 0.008} fontFamily={'JetBrains Mono, DM Mono, monospace'} fontWeight={700} />
            </Rect>
          </Rect>
        </Rect>
      </Rect>

      {/* ═══ MINI HANDSHAKE — démonstration visuelle du surcoût ═══════════════
          Positionné en coordonnées monde (hors flex layout de tcp-box) pour
          que .position()/.flyTo() pilotent librement les paquets. */}
      {/* Fil de connexion — tracé une fois le handshake terminé */}
      <Line key="connection-wire" ref={connectionWire}
        points={() => [[HS_CLIENT_X(), HS_Y()], [HS_SERVER_X(), HS_Y()]]}
        stroke={PALETTE.dsGreen}
        lineWidth={2}
        end={0}
        opacity={0}
        zIndex={-1}
      />
      <DiagramNode key="hs-client" ref={handshakeClient}
        iconName="mdi:web"
        label="CLIENT"
        color={PALETTE.secondary}
        initialState="idle"
        width={HS_NODE_W} height={HS_NODE_H}
        x={HS_CLIENT_X} y={HS_Y}
        opacity={0}
      />
      <DiagramNode key="hs-server" ref={handshakeServer}
        iconName="mdi:server"
        label="SERVEUR"
        color={PALETTE.secondary}
        initialState="idle"
        width={HS_NODE_W} height={HS_NODE_H}
        x={HS_SERVER_X} y={HS_Y}
        opacity={0}
      />
      <Packet key="syn-packet" ref={synPacket}
        content="SYN"
        color={PALETTE.cyan}
        packetSize="sm"
        width={() => vW() * 0.045} height={() => vH() * 0.03}
        x={HS_CLIENT_X} y={HS_Y}
        opacity={0}
      />
      <Packet key="syn-ack-packet" ref={synAckPacket}
        content="SYN-ACK"
        color={PALETTE.cyan}
        packetSize="sm"
        width={() => vW() * 0.065} height={() => vH() * 0.03}
        x={HS_SERVER_X} y={HS_Y}
        opacity={0}
      />
      <Packet key="ack-packet" ref={ackPacket}
        content="ACK"
        color={PALETTE.cyan}
        packetSize="sm"
        width={() => vW() * 0.04} height={() => vH() * 0.03}
        x={HS_CLIENT_X} y={HS_Y}
        opacity={0}
      />
      <Txt key="overhead-label" ref={overheadLabel}
        text="0 octet utile transmis"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.008}
        fontFamily={'Space Grotesk, DM Sans, sans-serif'}
        x={TCP_BOX_X}
        y={() => HS_Y() + vH() * 0.06}
        opacity={0}
      />

      {/* Packet HTTP qui traverse une fois la connexion établie */}
      <Packet key="request-packet" ref={requestPacket}
        content="GET /"
        color={PALETTE.cyan}
        packetSize="sm"
        width={() => vW() * 0.05} height={() => vH() * 0.032}
        x={HS_CLIENT_X} y={HS_Y}
        opacity={0}
      />
    </Layout>,
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ══════════════════════════════════════════════════════════════════════════

  // ─── Intro ────────────────────────────────────────────────────────────────
  yield* waitUntil('intro');
  yield* gridRef().opacity(0.07, 1);
  yield* osiTitle().opacity(1, 0.5);

  // ─── Pyramide OSI — construction couche par couche ────────────────────────
  yield* waitUntil('osiPyramid');
  yield* sequence(0.13,
    layer1().opacity(1, 0.4),
    layer2().opacity(1, 0.4),
    layer3().opacity(1, 0.4),
    layer4().opacity(1, 0.4),
    layer5().opacity(1, 0.4),
    layer6().opacity(1, 0.4),
    layer7().opacity(1, 0.4),
  );
  yield* waitFor(1);

  // ─── L7 — HTTP s'allume ────────────────────────────────────────────────────
  yield* waitUntil('httpFocus');
  layer7().shadowColor(PALETTE.cyan);
  yield* all(
    layer7().fill(PALETTE.cyan + '20', 0.4),
    layer7().stroke(PALETTE.cyan, 0.4),
    layer7().shadowBlur(vW() * 0.018, 0.4),
  );
  yield* httpBox().opacity(1, 0.55);
  yield* httpBadge().opacity(1, 0.35);
  yield* waitFor(1.2);

  // ─── L4 — TCP s'allume, flèche de dépendance ──────────────────────────────
  yield* waitUntil('tcpFocus');
  layer4().shadowColor(PALETTE.cyan);
  yield* all(
    layer4().fill(PALETTE.cyan + '20', 0.4),
    layer4().stroke(PALETTE.cyan, 0.4),
    layer4().shadowBlur(vW() * 0.018, 0.4),
  );
  yield* tcpBox().opacity(1, 0.55);
  dependsArrow().opacity(1);
  yield* dependsArrow().end(1, 0.6, easeInOutCubic);
  yield* dependsLabel().opacity(1, 0.4);
  yield* sequence(0.1,
    reliableBadge().opacity(1, 0.3),
    orderedBadge().opacity(1, 0.3),
    retransmitBadge().opacity(1, 0.3),
  );
  yield* waitFor(1);

  // ─── Handshake — zoom plein écran, le reste s'efface ──────────────────────
  yield* waitUntil('handshake');
  yield* all(
    camera().scale(ZOOM_SCALE, 1, easeInOutCubic),
    camera().position([-ZOOM_SCALE * TCP_BOX_X(), -ZOOM_SCALE * HS_Y()], 1, easeInOutCubic),
    gridRef().opacity(0, 0.7),
    osiTitle().opacity(0, 0.7),
    pyramidWrapper().opacity(0, 0.7),
    httpBox().opacity(0, 0.7),
    tcpBox().opacity(0, 0.7),
    dependsArrow().opacity(0, 0.7),
    dependsLabel().opacity(0, 0.7),
  );

  // 3 allers-retours avant le premier octet utile
  yield* sequence(0.15,
    handshakeClient().opacity(1, 0.4),
    handshakeServer().opacity(1, 0.4),
  );
  yield* overheadLabel().opacity(1, 0.4);

  // SYN →
  synPacket().position([HS_CLIENT_X(), HS_Y()]);
  yield* synPacket().opacity(1, 0.15);
  yield* synPacket().flyTo([HS_SERVER_X(), HS_Y()], 0.4);
  yield* all(
    synPacket().opacity(0, 0.15),
    handshakeServer().setState('active', 0.15),
  );

  // ← SYN-ACK
  synAckPacket().position([HS_SERVER_X(), HS_Y()]);
  yield* synAckPacket().opacity(1, 0.15);
  yield* synAckPacket().flyTo([HS_CLIENT_X(), HS_Y()], 0.4);
  yield* all(
    synAckPacket().opacity(0, 0.15),
    handshakeServer().setState('idle', 0.15),
    handshakeClient().setState('active', 0.15),
  );

  // ACK →
  ackPacket().position([HS_CLIENT_X(), HS_Y()]);
  yield* ackPacket().opacity(1, 0.15);
  yield* ackPacket().flyTo([HS_SERVER_X(), HS_Y()], 0.4);
  yield* all(
    handshakeClient().setState('idle', 0.15),
    handshakeServer().setState('active', 0.15),
    ackPacket().opacity(0, 0.2),
  );
  yield* overheadLabel().opacity(0, 0.3);
  yield* waitFor(0.2);

  // Connexion établie — les deux blocs passent au vert, un fil les relie
  yield* all(
    handshakeClient().setState('success', 0.35),
    handshakeServer().setState('success', 0.35),
  );
  // Fond opaque — le fill par défaut de l'état 'success' est translucide (8%),
  // ce qui laisserait transparaître le fil vert derrière les blocs.
  yield* all(
    handshakeClient().fill(PALETTE.nodeBg, 0.2),
    handshakeServer().fill(PALETTE.nodeBg, 0.2),
  );
  connectionWire().opacity(1);
  yield* connectionWire().end(1, 0.4, easeInOutCubic);
  yield* waitFor(0.4);

  // La connexion est utilisable — la requête HTTP peut enfin voyager
  requestPacket().position([HS_CLIENT_X(), HS_Y()]);
  yield* requestPacket().opacity(1, 0.2);
  yield* requestPacket().flyTo([HS_SERVER_X(), HS_Y()], 0.5);
  yield* requestPacket().opacity(0, 0.2);
  yield* waitFor(1);

  // ─── Dézoom — retour sur l'ensemble du modèle OSI ─────────────────────────
  yield* all(
    camera().scale(1, 1, easeInOutCubic),
    camera().position([0, 0], 1, easeInOutCubic),
    handshakeClient().opacity(0, 0.5),
    handshakeServer().opacity(0, 0.5),
    connectionWire().opacity(0, 0.5),
    gridRef().opacity(0.07, 0.7),
    osiTitle().opacity(1, 0.7),
    pyramidWrapper().opacity(1, 0.7),
    httpBox().opacity(1, 0.7),
    tcpBox().opacity(1, 0.7),
    dependsArrow().opacity(1, 0.7),
    dependsLabel().opacity(1, 0.7),
  );
  yield* waitFor(1);

  // ─── End Scene ────────────────────────────────────────────────────────────
  yield* waitUntil('endScene');
  yield* all(
    gridRef().opacity(0, 0.5),
    osiTitle().opacity(0, 0.5),
    pyramidWrapper().opacity(0, 0.5),
    httpBox().opacity(0, 0.5),
    tcpBox().opacity(0, 0.5),
    dependsArrow().opacity(0, 0.5),
    dependsLabel().opacity(0, 0.5),
    handshakeClient().opacity(0, 0.5),
    handshakeServer().opacity(0, 0.5),
  );
  yield* waitFor(0.3);
});
