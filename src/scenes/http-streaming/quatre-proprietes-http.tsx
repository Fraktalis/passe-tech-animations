import {makeScene2D, Grid, Rect, Txt, Layout} from '@motion-canvas/2d';
import {createRef, all, sequence, waitUntil, waitFor, easeInOutCubic} from '@motion-canvas/core';
import {ConnectionArrow, DiagramNode, Packet} from '../../components';
import {PALETTE} from '../../theme';

/**
 * Les 4 propriétés d'HTTP (BASCULE) — chaque propriété a sa démo plein écran,
 * puis son bloc se réduit et glisse dans son quadrant d'une grille 2×2.
 * Couleur active : cyan.
 */
export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Grille 2×2 finale ──────────────────────────────────────────────────────
  const PANEL_W    = () => vW() * 0.445;
  const PANEL_H    = () => vH() * 0.41;
  const QUAD_LEFT_X  = () => -vW() * 0.2475;
  const QUAD_RIGHT_X = () => +vW() * 0.2475;
  const QUAD_TOP_Y    = () => -vH() * 0.225;
  const QUAD_BOTTOM_Y = () => +vH() * 0.225;
  const PARKED_SCALE  = 0.4;
  const PARKED_OFFSET_Y = () => vH() * 0.03;
  const DIMMED_OPACITY  = 0.15;

  // Titre de démo — vit DANS le wrapper (coordonnées locales) pour voyager
  // automatiquement avec le scale/position au moment du parking.
  const DEMO_TITLE_Y = () => -vH() * 0.46;
  const demoTitleStyle = {
    fill: PALETTE.cream,
    fontSize: () => vW() * 0.022,
    fontFamily: 'Space Grotesk, DM Sans, sans-serif',
    fontWeight: 700,
    y: DEMO_TITLE_Y,
    opacity: 0,
  };

  // ── Démo 1 : requête-réponse ───────────────────────────────────────────────
  const D1_NODE_W    = () => vW() * 0.13;
  const D1_NODE_H    = () => vH() * 0.24;
  const D1_CLIENT_X  = () => -vW() * 0.24;
  const D1_SERVER_X  = () => +vW() * 0.24;
  const D1_HALF_W    = () => D1_NODE_W() / 2;
  const D1_REQUEST_Y  = () => -vH() * 0.05;
  const D1_RESPONSE_Y = () => +vH() * 0.05;
  const D1_PUSH_Y     = () => +vH() * 0.15;

  // ── Démo 2 : stateless ─────────────────────────────────────────────────────
  const D2_NODE_W   = () => vW() * 0.11;
  const D2_NODE_H   = () => vH() * 0.20;
  const D2_CLIENT_X = () => -vW() * 0.30;
  const D2_SERVER_X = () => +vW() * 0.18;
  const D2_CLONE_TOP_Y    = () => -vH() * 0.28;
  const D2_CLONE_BOTTOM_Y = () => +vH() * 0.28;
  const D2_GAUGE_Y  = () => -vH() * 0.155;

  // ── Démos 3 & 4 : triplet client / milieu / serveur ────────────────────────
  const D3_NODE_W   = () => vW() * 0.11;
  const D3_NODE_H   = () => vH() * 0.22;
  const TRIPLE_LEFT_X   = () => -vW() * 0.32;
  const TRIPLE_MIDDLE_X = () => 0;
  const TRIPLE_RIGHT_X  = () => +vW() * 0.32;
  const D3_HALF_W   = () => D3_NODE_W() / 2;
  const D3_ENVELOPE_Y = () => vH() * 0.21;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();

  // Démo 1
  const demoOneWrap          = createRef<Layout>();
  const demoOneClient        = createRef<DiagramNode>();
  const demoOneServer        = createRef<DiagramNode>();
  const demoOneRequestArrow  = createRef<ConnectionArrow>();
  const demoOneResponseArrow = createRef<ConnectionArrow>();
  const demoOneRequestPacket  = createRef<Packet>();
  const demoOneResponsePacket = createRef<Packet>();
  const demoOnePushArrow     = createRef<ConnectionArrow>();

  // Démo 2
  const demoTwoWrap          = createRef<Layout>();
  const demoTwoClient        = createRef<DiagramNode>();
  const demoTwoServerMain    = createRef<DiagramNode>();
  const demoTwoCloneTop      = createRef<DiagramNode>();
  const demoTwoCloneBottom   = createRef<DiagramNode>();
  const demoTwoGauge         = createRef<Rect>();
  const demoTwoArrowMain     = createRef<ConnectionArrow>();
  const demoTwoArrowTop      = createRef<ConnectionArrow>();
  const demoTwoArrowBottom   = createRef<ConnectionArrow>();
  const demoTwoRequestPacket  = createRef<Packet>();
  const demoTwoContextBadge  = createRef<Rect>();
  const demoTwoResponsePacket = createRef<Packet>();

  // Démo 3
  const demoThreeWrap       = createRef<Layout>();
  const demoThreeClient     = createRef<DiagramNode>();
  const demoThreeProxy      = createRef<DiagramNode>();
  const demoThreeServer     = createRef<DiagramNode>();
  const demoThreeArrowIn    = createRef<ConnectionArrow>();
  const demoThreeArrowOut   = createRef<ConnectionArrow>();
  const demoThreeEnvelope   = createRef<Layout>();
  const demoThreeHeaderBand = createRef<Rect>();
  const demoThreeBodyBand   = createRef<Rect>();
  const demoThreeReadArrow  = createRef<ConnectionArrow>();

  // Démo 4
  const demoFourWrap          = createRef<Layout>();
  const demoFourClient        = createRef<DiagramNode>();
  const demoFourCdn           = createRef<DiagramNode>();
  const demoFourServer        = createRef<DiagramNode>();
  const demoFourArrowIn       = createRef<ConnectionArrow>();
  const demoFourArrowOut      = createRef<ConnectionArrow>();
  const demoFourRequestPacket = createRef<Packet>();
  const demoFourResponseGroup = createRef<Layout>();
  const demoFourMaxAgeTag     = createRef<Rect>();
  const demoFourCachedCopy    = createRef<Rect>();

  // Grille finale
  const panelOne   = createRef<Rect>();
  const panelTwo   = createRef<Rect>();
  const panelThree = createRef<Rect>();
  const panelFour  = createRef<Rect>();
  const titleOne   = createRef<Txt>();
  const titleTwo   = createRef<Txt>();
  const titleThree = createRef<Txt>();
  const titleFour  = createRef<Txt>();

  // ── Scene tree ─────────────────────────────────────────────────────────────
  view.add(<>
    <Grid
      key="bg-grid"
      ref={gridRef}
      width={'100%'} height={'100%'}
      spacing={() => vW() * 0.05}
      stroke={PALETTE.ghost}
      lineWidth={1}
      opacity={0}
    />

    {/* Panneaux de quadrant (derrière les blocs) */}
    <Rect key="panel-1" ref={panelOne}
      width={PANEL_W} height={PANEL_H} x={QUAD_LEFT_X} y={QUAD_TOP_Y}
      fill={PALETTE.bgCard} stroke={PALETTE.ghost} lineWidth={1.5} radius={10}
      opacity={0}
    />
    <Rect key="panel-2" ref={panelTwo}
      width={PANEL_W} height={PANEL_H} x={QUAD_RIGHT_X} y={QUAD_TOP_Y}
      fill={PALETTE.bgCard} stroke={PALETTE.ghost} lineWidth={1.5} radius={10}
      opacity={0}
    />
    <Rect key="panel-3" ref={panelThree}
      width={PANEL_W} height={PANEL_H} x={QUAD_LEFT_X} y={QUAD_BOTTOM_Y}
      fill={PALETTE.bgCard} stroke={PALETTE.ghost} lineWidth={1.5} radius={10}
      opacity={0}
    />
    <Rect key="panel-4" ref={panelFour}
      width={PANEL_W} height={PANEL_H} x={QUAD_RIGHT_X} y={QUAD_BOTTOM_Y}
      fill={PALETTE.bgCard} stroke={PALETTE.ghost} lineWidth={1.5} radius={10}
      opacity={0}
    />

    {/* ══ Démo 1 : REQUÊTE-RÉPONSE ═══════════════════════════════════════════ */}
    <Layout key="demo-1-wrap" ref={demoOneWrap}>
      <Txt key="d1-title" ref={titleOne} text="Requête-réponse" {...demoTitleStyle} />
      <DiagramNode key="d1-client" ref={demoOneClient}
        iconName="mdi:monitor"
        label="CLIENT"
        color={PALETTE.cyan}
        initialState="idle"
        width={D1_NODE_W} height={D1_NODE_H}
        x={D1_CLIENT_X} y={0}
        opacity={0}
      />
      <DiagramNode key="d1-server" ref={demoOneServer}
        iconName="mdi:server"
        label="SERVEUR"
        color={PALETTE.cyan}
        initialState="idle"
        width={D1_NODE_W} height={D1_NODE_H}
        x={D1_SERVER_X} y={0}
        opacity={0}
      />
      <ConnectionArrow key="d1-request-arrow" ref={demoOneRequestArrow}
        from={() => [D1_CLIENT_X() + D1_HALF_W(), D1_REQUEST_Y()]}
        to={() =>   [D1_SERVER_X() - D1_HALF_W(), D1_REQUEST_Y()]}
        stroke={PALETTE.cyan + '88'}
        end={0} opacity={0}
      />
      <ConnectionArrow key="d1-response-arrow" ref={demoOneResponseArrow}
        from={() => [D1_SERVER_X() - D1_HALF_W(), D1_RESPONSE_Y()]}
        to={() =>   [D1_CLIENT_X() + D1_HALF_W(), D1_RESPONSE_Y()]}
        stroke={PALETTE.cyan + '88'}
        end={0} opacity={0}
      />
      <Packet key="d1-request-packet" ref={demoOneRequestPacket}
        content="GET /"
        color={PALETTE.cyan}
        width={() => vW() * 0.07} height={() => vH() * 0.05}
        x={() => D1_CLIENT_X() + D1_HALF_W() + vW() * 0.045}
        y={D1_REQUEST_Y}
        opacity={0}
      />
      <Packet key="d1-response-packet" ref={demoOneResponsePacket}
        content="200 OK"
        color={PALETTE.cyan}
        width={() => vW() * 0.07} height={() => vH() * 0.05}
        x={() => D1_SERVER_X() - D1_HALF_W() - vW() * 0.045}
        y={D1_RESPONSE_Y}
        opacity={0}
      />
      <ConnectionArrow key="d1-push-arrow" ref={demoOnePushArrow}
        from={() => [D1_SERVER_X() - D1_HALF_W(), D1_PUSH_Y()]}
        to={() =>   [D1_CLIENT_X() + D1_HALF_W(), D1_PUSH_Y()]}
        stroke={PALETTE.dsRose}
        end={0} opacity={0}
      />
    </Layout>

    {/* ══ Démo 2 : STATELESS ═════════════════════════════════════════════════ */}
    <Layout key="demo-2-wrap" ref={demoTwoWrap}>
      <Txt key="d2-title" ref={titleTwo} text="Stateless" {...demoTitleStyle} />
      <DiagramNode key="d2-client" ref={demoTwoClient}
        iconName="mdi:monitor"
        label="CLIENT"
        color={PALETTE.cyan}
        initialState="idle"
        width={D2_NODE_W} height={D2_NODE_H}
        x={D2_CLIENT_X} y={0}
        opacity={0}
      />
      <DiagramNode key="d2-server-main" ref={demoTwoServerMain}
        iconName="mdi:server"
        label="SERVEUR"
        color={PALETTE.cyan}
        initialState="idle"
        width={D2_NODE_W} height={D2_NODE_H}
        x={D2_SERVER_X} y={0}
        opacity={0}
      />
      <DiagramNode key="d2-clone-top" ref={demoTwoCloneTop}
        iconName="mdi:server"
        label="SERVEUR"
        color={PALETTE.cyan}
        initialState="idle"
        width={D2_NODE_W} height={D2_NODE_H}
        x={D2_SERVER_X} y={D2_CLONE_TOP_Y}
        opacity={0}
      />
      <DiagramNode key="d2-clone-bottom" ref={demoTwoCloneBottom}
        iconName="mdi:server"
        label="SERVEUR"
        color={PALETTE.cyan}
        initialState="idle"
        width={D2_NODE_W} height={D2_NODE_H}
        x={D2_SERVER_X} y={D2_CLONE_BOTTOM_Y}
        opacity={0}
      />
      {/* Jauge de mémoire du serveur — reste vide */}
      <Rect key="d2-state-gauge" ref={demoTwoGauge}
        width={() => vW() * 0.085} height={() => vH() * 0.026}
        x={D2_SERVER_X} y={D2_GAUGE_Y}
        fill={'#00000000'} stroke={PALETTE.secondary} lineWidth={1.5} radius={3}
        opacity={0}
      >
        <Txt key="d2-state-gauge-label"
          text="state"
          fill={PALETTE.secondary}
          fontSize={() => vW() * 0.0085}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          x={() => -vW() * 0.062}
        />
      </Rect>
      <ConnectionArrow key="d2-arrow-main" ref={demoTwoArrowMain}
        from={() => [D2_CLIENT_X() + D2_NODE_W() / 2, 0]}
        to={() =>   [D2_SERVER_X() - D2_NODE_W() / 2, 0]}
        stroke={PALETTE.cyan + '88'}
        end={0} opacity={0}
      />
      <ConnectionArrow key="d2-arrow-top" ref={demoTwoArrowTop}
        from={() => [D2_CLIENT_X() + D2_NODE_W() / 2, -vH() * 0.03]}
        to={() =>   [D2_SERVER_X() - D2_NODE_W() / 2, D2_CLONE_TOP_Y()]}
        stroke={PALETTE.cyan + '55'}
        dashed
        end={0} opacity={0}
      />
      <ConnectionArrow key="d2-arrow-bottom" ref={demoTwoArrowBottom}
        from={() => [D2_CLIENT_X() + D2_NODE_W() / 2, +vH() * 0.03]}
        to={() =>   [D2_SERVER_X() - D2_NODE_W() / 2, D2_CLONE_BOTTOM_Y()]}
        stroke={PALETTE.cyan + '55'}
        dashed
        end={0} opacity={0}
      />
      <Packet key="d2-request-packet" ref={demoTwoRequestPacket}
        content="GET /a"
        color={PALETTE.cyan}
        width={() => vW() * 0.065} height={() => vH() * 0.048}
        x={() => D2_CLIENT_X() + D2_NODE_W() / 2 + vW() * 0.04}
        y={0}
        opacity={0}
      />
      {/* Badge contexte — chaque requête transporte son contexte */}
      <Rect key="d2-ctx-badge" ref={demoTwoContextBadge}
        width={() => vW() * 0.028} height={() => vW() * 0.028}
        x={() => demoTwoRequestPacket().x() + vW() * 0.028}
        y={() => demoTwoRequestPacket().y() - vH() * 0.048}
        fill={PALETTE.cyan + '22'} stroke={PALETTE.cyan} lineWidth={1} radius={99}
        opacity={0}
      >
        <Txt key="d2-ctx-badge-label"
          text="ctx"
          fill={PALETTE.cyan}
          fontSize={() => vW() * 0.009}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
        />
      </Rect>
      <Packet key="d2-response-packet" ref={demoTwoResponsePacket}
        content="200"
        color={PALETTE.cyan}
        width={() => vW() * 0.055} height={() => vH() * 0.045}
        x={() => D2_SERVER_X() - D2_NODE_W() / 2 - vW() * 0.04}
        y={() => vH() * 0.06}
        opacity={0}
      />
    </Layout>

    {/* ══ Démo 3 : INTERFACE UNIFORME ════════════════════════════════════════ */}
    <Layout key="demo-3-wrap" ref={demoThreeWrap}>
      <Txt key="d3-title" ref={titleThree} text="Interface uniforme" {...demoTitleStyle} />
      <DiagramNode key="d3-client" ref={demoThreeClient}
        iconName="mdi:monitor"
        label="CLIENT"
        color={PALETTE.cyan}
        initialState="idle"
        width={D3_NODE_W} height={D3_NODE_H}
        x={TRIPLE_LEFT_X} y={0}
        opacity={0}
      />
      <DiagramNode key="d3-proxy" ref={demoThreeProxy}
        iconName="mdi:swap-horizontal"
        label="PROXY"
        color={PALETTE.cyan}
        initialState="idle"
        width={D3_NODE_W} height={D3_NODE_H}
        x={TRIPLE_MIDDLE_X} y={0}
        opacity={0}
      />
      <DiagramNode key="d3-server" ref={demoThreeServer}
        iconName="mdi:server"
        label="SERVEUR"
        color={PALETTE.cyan}
        initialState="idle"
        width={D3_NODE_W} height={D3_NODE_H}
        x={TRIPLE_RIGHT_X} y={0}
        opacity={0}
      />
      <ConnectionArrow key="d3-arrow-in" ref={demoThreeArrowIn}
        from={() => [TRIPLE_LEFT_X() + D3_HALF_W(), 0]}
        to={() =>   [TRIPLE_MIDDLE_X() - D3_HALF_W(), 0]}
        stroke={PALETTE.cyan + '88'}
        end={0} opacity={0}
      />
      <ConnectionArrow key="d3-arrow-out" ref={demoThreeArrowOut}
        from={() => [TRIPLE_MIDDLE_X() + D3_HALF_W(), 0]}
        to={() =>   [TRIPLE_RIGHT_X() - D3_HALF_W(), 0]}
        stroke={PALETTE.cyan + '88'}
        end={0} opacity={0}
      />
      {/* Enveloppe requête : bandeau headers lisible + body estompé */}
      <Layout key="d3-request-envelope" ref={demoThreeEnvelope}
        x={TRIPLE_LEFT_X} y={D3_ENVELOPE_Y}
        opacity={0}
      >
        <Rect key="d3-envelope-headers" ref={demoThreeHeaderBand}
          width={() => vW() * 0.14} height={() => vH() * 0.045}
          y={() => -vH() * 0.043}
          fill={PALETTE.cyan + '22'} stroke={PALETTE.cyan} lineWidth={1.5} radius={4}
        >
          <Txt key="d3-headers-text"
            text="GET /videos · Host"
            fill={PALETTE.cyan}
            fontSize={() => vW() * 0.0085}
            fontFamily={'JetBrains Mono, DM Mono, monospace'}
          />
        </Rect>
        <Rect key="d3-envelope-body" ref={demoThreeBodyBand}
          width={() => vW() * 0.14} height={() => vH() * 0.08}
          y={() => vH() * 0.025}
          fill={PALETTE.nodeBg} stroke={PALETTE.secondary + '66'} lineWidth={1} radius={4}
          opacity={0.4}
        >
          <Txt key="d3-body-text"
            text={'{ ··· body ··· }'}
            fill={PALETTE.secondary}
            fontSize={() => vW() * 0.0085}
            fontFamily={'JetBrains Mono, DM Mono, monospace'}
          />
        </Rect>
      </Layout>
      <ConnectionArrow key="d3-read-arrow" ref={demoThreeReadArrow}
        from={() => [TRIPLE_MIDDLE_X(), D3_NODE_H() / 2]}
        to={() =>   [TRIPLE_MIDDLE_X(), D3_ENVELOPE_Y() - vH() * 0.075]}
        stroke={PALETTE.cyan}
        dashed
        arrowSize={7}
        routing={0}
        end={0} opacity={0}
      />
    </Layout>

    {/* ══ Démo 4 : CACHEABLE ═════════════════════════════════════════════════ */}
    <Layout key="demo-4-wrap" ref={demoFourWrap}>
      <Txt key="d4-title" ref={titleFour} text="Cacheable" {...demoTitleStyle} />
      <DiagramNode key="d4-client" ref={demoFourClient}
        iconName="mdi:monitor"
        label="CLIENT"
        color={PALETTE.cyan}
        initialState="idle"
        width={D3_NODE_W} height={D3_NODE_H}
        x={TRIPLE_LEFT_X} y={0}
        opacity={0}
      />
      <DiagramNode key="d4-cdn" ref={demoFourCdn}
        iconName="mdi:server-network"
        label="CDN"
        color={PALETTE.cyan}
        initialState="idle"
        width={D3_NODE_W} height={D3_NODE_H}
        x={TRIPLE_MIDDLE_X} y={0}
        opacity={0}
      />
      <DiagramNode key="d4-server" ref={demoFourServer}
        iconName="mdi:server"
        label="ORIGINE"
        color={PALETTE.cyan}
        initialState="idle"
        width={D3_NODE_W} height={D3_NODE_H}
        x={TRIPLE_RIGHT_X} y={0}
        opacity={0}
      />
      <ConnectionArrow key="d4-arrow-in" ref={demoFourArrowIn}
        from={() => [TRIPLE_LEFT_X() + D3_HALF_W(), 0]}
        to={() =>   [TRIPLE_MIDDLE_X() - D3_HALF_W(), 0]}
        stroke={PALETTE.cyan + '88'}
        end={0} opacity={0}
      />
      <ConnectionArrow key="d4-arrow-out" ref={demoFourArrowOut}
        from={() => [TRIPLE_MIDDLE_X() + D3_HALF_W(), 0]}
        to={() =>   [TRIPLE_RIGHT_X() - D3_HALF_W(), 0]}
        stroke={PALETTE.cyan + '88'}
        end={0} opacity={0}
      />
      <Packet key="d4-request-packet" ref={demoFourRequestPacket}
        content="GET /img"
        color={PALETTE.cyan}
        width={() => vW() * 0.075} height={() => vH() * 0.048}
        x={() => TRIPLE_LEFT_X() + D3_HALF_W() + vW() * 0.045}
        y={() => -vH() * 0.06}
        opacity={0}
      />
      {/* Réponse : 200 + header max-age en surbrillance */}
      <Layout key="d4-response-group" ref={demoFourResponseGroup}
        x={() => TRIPLE_RIGHT_X() - D3_HALF_W() - vW() * 0.05}
        y={() => vH() * 0.08}
        opacity={0}
      >
        <Rect key="d4-response-packet"
          width={() => vW() * 0.06} height={() => vH() * 0.045}
          fill={PALETTE.cyan + '22'} stroke={PALETTE.cyan} lineWidth={1} radius={4}
        >
          <Txt key="d4-response-packet-text"
            text="200 OK"
            fill={PALETTE.cyan}
            fontSize={() => vW() * 0.009}
            fontFamily={'JetBrains Mono, DM Mono, monospace'}
            fontWeight={700}
          />
        </Rect>
        <Rect key="d4-max-age-tag" ref={demoFourMaxAgeTag}
          width={() => vW() * 0.095} height={() => vH() * 0.036}
          y={() => vH() * 0.052}
          fill={PALETTE.cyan + '33'} stroke={PALETTE.cyan} lineWidth={2} radius={4}
        >
          <Txt key="d4-max-age-text"
            text="max-age=3600"
            fill={PALETTE.cyan}
            fontSize={() => vW() * 0.0085}
            fontFamily={'JetBrains Mono, DM Mono, monospace'}
            fontWeight={700}
          />
        </Rect>
      </Layout>
      {/* Copie mise en cache dans la boîte CDN */}
      <Rect key="d4-cached-copy" ref={demoFourCachedCopy}
        width={() => vW() * 0.095} height={() => vH() * 0.036}
        x={TRIPLE_MIDDLE_X} y={() => vH() * 0.17}
        fill={PALETTE.cyan + '33'} stroke={PALETTE.cyan} lineWidth={2} radius={4}
        opacity={0}
      >
        <Txt key="d4-cached-copy-text"
          text="max-age=3600"
          fill={PALETTE.cyan}
          fontSize={() => vW() * 0.0085}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          fontWeight={700}
        />
      </Rect>
    </Layout>
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  yield* waitUntil('intro');
  yield* gridRef().opacity(0.07, 1.0667);

  // ═══ Démo 1 : REQUÊTE-RÉPONSE ═══════════════════════════════════════════════
  yield* waitUntil('p1-demo');
  yield* sequence(0.2,
    titleOne().opacity(1, 0.6),
    demoOneClient().opacity(1, 0.6),
    demoOneServer().opacity(1, 0.6),
  );
  yield* waitFor(0.2667);
  demoOneRequestArrow().opacity(1);
  yield* demoOneRequestArrow().end(1, 0.6667, easeInOutCubic);
  demoOneResponseArrow().opacity(1);
  yield* demoOneResponseArrow().end(1, 0.6667, easeInOutCubic);
  yield* waitFor(0.4);

  // 3 cycles requête → réponse
  for (let requestIndex = 0; requestIndex < 3; requestIndex++) {
    demoOneRequestPacket().position([D1_CLIENT_X() + D1_HALF_W() + vW() * 0.045, D1_REQUEST_Y()]);
    yield* demoOneRequestPacket().opacity(1, 0.16);
    yield* demoOneRequestPacket().flyTo([D1_SERVER_X() - D1_HALF_W() - vW() * 0.045, D1_REQUEST_Y()], 0.6);
    yield* all(
      demoOneRequestPacket().opacity(0, 0.16),
      demoOneServer().setState('active', 0.16),
    );
    demoOneResponsePacket().position([D1_SERVER_X() - D1_HALF_W() - vW() * 0.045, D1_RESPONSE_Y()]);
    yield* demoOneResponsePacket().opacity(1, 0.16);
    yield* demoOneResponsePacket().flyTo([D1_CLIENT_X() + D1_HALF_W() + vW() * 0.045, D1_RESPONSE_Y()], 0.6);
    yield* all(
      demoOneResponsePacket().opacity(0, 0.16),
      demoOneServer().setState('idle', 0.2667),
    );
    yield* waitFor(0.2);
  }

  // Le serveur tente d'initier → avorte
  yield* waitUntil('p1-abort');
  demoOnePushArrow().opacity(1);
  yield* demoOnePushArrow().end(0.45, 0.6667, easeInOutCubic);
  yield* demoOneServer().setState('error', 0.1333);
  yield* waitFor(0.4);
  yield* all(
    demoOnePushArrow().end(0, 0.4667, easeInOutCubic),
    demoOnePushArrow().opacity(0, 0.5333),
  );
  yield* demoOneServer().setState('idle', 0.4);
  yield* waitFor(0.6667);

  // Parking quadrant haut-gauche
  yield* waitUntil('p1-park');
  yield* all(
    demoOneWrap().scale(PARKED_SCALE, 1.0667, easeInOutCubic),
    demoOneWrap().position([QUAD_LEFT_X(), QUAD_TOP_Y() + PARKED_OFFSET_Y()], 1.0667, easeInOutCubic),
    panelOne().opacity(1, 0.8),
  );
  yield* waitFor(0.5333);

  // ═══ Démo 2 : STATELESS ═════════════════════════════════════════════════════
  yield* waitUntil('p2-demo');
  // La grille se met en veille pendant que la démo joue en plein écran
  yield* demoOneWrap().opacity(DIMMED_OPACITY, 0.5333);
  yield* sequence(0.2,
    titleTwo().opacity(1, 0.6),
    demoTwoClient().opacity(1, 0.6),
    demoTwoServerMain().opacity(1, 0.6),
    demoTwoGauge().opacity(1, 0.5333),
  );
  yield* waitFor(0.2667);
  demoTwoArrowMain().opacity(1);
  yield* demoTwoArrowMain().end(1, 0.6667, easeInOutCubic);
  yield* waitFor(0.2667);

  // Requête n°1 avec contexte attaché — la mémoire du serveur reste vide
  demoTwoRequestPacket().position([D2_CLIENT_X() + D2_NODE_W() / 2 + vW() * 0.04, 0]);
  yield* all(
    demoTwoRequestPacket().opacity(1, 0.2),
    demoTwoContextBadge().opacity(1, 0.2),
  );
  yield* demoTwoRequestPacket().flyTo([D2_SERVER_X() - D2_NODE_W() / 2 - vW() * 0.04, 0], 0.7333);
  yield* all(
    demoTwoRequestPacket().opacity(0, 0.16),
    demoTwoContextBadge().opacity(0, 0.16),
    demoTwoServerMain().setState('active', 0.2),
  );
  // La jauge pulse à vide
  yield* demoTwoGauge().stroke(PALETTE.cream, 0.3333);
  yield* demoTwoGauge().stroke(PALETTE.secondary, 0.5333);
  demoTwoResponsePacket().position([D2_SERVER_X() - D2_NODE_W() / 2 - vW() * 0.04, vH() * 0.06]);
  yield* demoTwoResponsePacket().opacity(1, 0.16);
  yield* demoTwoResponsePacket().flyTo([D2_CLIENT_X() + D2_NODE_W() / 2 + vW() * 0.04, vH() * 0.06], 0.6667);
  yield* all(
    demoTwoResponsePacket().opacity(0, 0.16),
    demoTwoServerMain().setState('idle', 0.2667),
  );
  yield* waitFor(0.4);

  // Requête n°2 sur un serveur cloné — même réponse
  yield* waitUntil('p2-clone');
  yield* demoTwoCloneTop().opacity(1, 0.6);
  yield* waitFor(0.2667);
  demoTwoArrowTop().opacity(1);
  yield* demoTwoArrowTop().end(1, 0.6, easeInOutCubic);
  demoTwoRequestPacket().position([D2_CLIENT_X() + D2_NODE_W() / 2 + vW() * 0.04, -vH() * 0.03]);
  yield* all(
    demoTwoRequestPacket().opacity(1, 0.2),
    demoTwoContextBadge().opacity(1, 0.2),
  );
  yield* demoTwoRequestPacket().flyTo([D2_SERVER_X() - D2_NODE_W() / 2 - vW() * 0.04, D2_CLONE_TOP_Y()], 0.7333);
  yield* all(
    demoTwoRequestPacket().opacity(0, 0.16),
    demoTwoContextBadge().opacity(0, 0.16),
    demoTwoCloneTop().setState('active', 0.2),
  );
  demoTwoResponsePacket().position([D2_SERVER_X() - D2_NODE_W() / 2 - vW() * 0.04, D2_CLONE_TOP_Y() + vH() * 0.06]);
  yield* demoTwoResponsePacket().opacity(1, 0.16);
  yield* demoTwoResponsePacket().flyTo([D2_CLIENT_X() + D2_NODE_W() / 2 + vW() * 0.04, vH() * 0.06], 0.6667);
  yield* all(
    demoTwoResponsePacket().opacity(0, 0.16),
    demoTwoCloneTop().setState('idle', 0.2667),
  );
  yield* waitFor(0.4);

  // Duplication ×3 — les requêtes se répartissent
  yield* waitUntil('p2-scale');
  yield* demoTwoCloneBottom().opacity(1, 0.6);
  demoTwoArrowBottom().opacity(1);
  yield* demoTwoArrowBottom().end(1, 0.6, easeInOutCubic);
  const distributionTargetsY = [D2_CLONE_BOTTOM_Y(), 0];
  const distributionNodes = [demoTwoCloneBottom, demoTwoServerMain];
  for (let requestIndex = 0; requestIndex < 2; requestIndex++) {
    demoTwoRequestPacket().position([D2_CLIENT_X() + D2_NODE_W() / 2 + vW() * 0.04, vH() * 0.03 * (requestIndex === 0 ? 1 : 0)]);
    yield* all(
      demoTwoRequestPacket().opacity(1, 0.16),
      demoTwoContextBadge().opacity(1, 0.16),
    );
    yield* demoTwoRequestPacket().flyTo([D2_SERVER_X() - D2_NODE_W() / 2 - vW() * 0.04, distributionTargetsY[requestIndex]], 0.9);
    yield* all(
      demoTwoRequestPacket().opacity(0, 0.1333),
      demoTwoContextBadge().opacity(0, 0.1333),
      distributionNodes[requestIndex]().setState('active', 0.16),
    );
    yield* distributionNodes[requestIndex]().setState('idle', 0.2667);
  }
  yield* waitFor(0.5333);

  // Parking quadrant haut-droite
  yield* waitUntil('p2-park');
  yield* all(
    demoTwoWrap().scale(PARKED_SCALE, 1.0667, easeInOutCubic),
    demoTwoWrap().position([QUAD_RIGHT_X(), QUAD_TOP_Y() + PARKED_OFFSET_Y()], 1.0667, easeInOutCubic),
    panelTwo().opacity(1, 0.8),
    demoOneWrap().opacity(1, 0.8),
  );
  yield* waitFor(0.5333);

  // ═══ Démo 3 : INTERFACE UNIFORME ════════════════════════════════════════════
  yield* waitUntil('p3-demo');
  // La grille se met en veille pendant que la démo joue en plein écran
  yield* all(
    demoOneWrap().opacity(DIMMED_OPACITY, 0.5333),
    demoTwoWrap().opacity(DIMMED_OPACITY, 0.5333),
  );
  yield* sequence(0.2,
    titleThree().opacity(1, 0.6),
    demoThreeClient().opacity(1, 0.6),
    demoThreeProxy().opacity(1, 0.6),
    demoThreeServer().opacity(1, 0.6),
  );
  yield* waitFor(0.2667);
  demoThreeArrowIn().opacity(1);
  yield* demoThreeArrowIn().end(1, 0.6, easeInOutCubic);
  demoThreeArrowOut().opacity(1);
  yield* demoThreeArrowOut().end(1, 0.6, easeInOutCubic);
  yield* waitFor(0.4);

  // L'enveloppe part du client vers le proxy
  yield* demoThreeEnvelope().opacity(1, 0.3333);
  yield* demoThreeEnvelope().x(TRIPLE_MIDDLE_X(), 0.9333, easeInOutCubic);

  // Le proxy lit le bandeau headers — le body reste estompé
  yield* waitUntil('p3-inspect');
  yield* demoThreeProxy().setState('active', 0.2);
  demoThreeReadArrow().opacity(1);
  yield* demoThreeReadArrow().end(1, 0.4667, easeInOutCubic);
  yield* all(
    demoThreeHeaderBand().fill(PALETTE.cyan + '55', 0.3333),
    demoThreeHeaderBand().lineWidth(3, 0.3333),
  );
  yield* waitFor(0.8);
  yield* all(
    demoThreeHeaderBand().fill(PALETTE.cyan + '22', 0.4),
    demoThreeHeaderBand().lineWidth(1.5, 0.4),
  );

  // ... et route quand même la requête
  yield* waitUntil('p3-route');
  yield* all(
    demoThreeReadArrow().opacity(0, 0.4),
    demoThreeProxy().setState('idle', 0.4),
  );
  yield* demoThreeEnvelope().x(TRIPLE_RIGHT_X(), 0.9333, easeInOutCubic);
  yield* demoThreeServer().setState('active', 0.2);
  yield* waitFor(0.5333);
  yield* demoThreeServer().setState('idle', 0.3333);

  // Parking quadrant bas-gauche
  yield* waitUntil('p3-park');
  yield* all(
    demoThreeWrap().scale(PARKED_SCALE, 1.0667, easeInOutCubic),
    demoThreeWrap().position([QUAD_LEFT_X(), QUAD_BOTTOM_Y() + PARKED_OFFSET_Y()], 1.0667, easeInOutCubic),
    panelThree().opacity(1, 0.8),
    demoOneWrap().opacity(1, 0.8),
    demoTwoWrap().opacity(1, 0.8),
  );
  yield* waitFor(0.5333);

  // ═══ Démo 4 : CACHEABLE ═════════════════════════════════════════════════════
  yield* waitUntil('p4-demo');
  // La grille se met en veille pendant que la démo joue en plein écran
  yield* all(
    demoOneWrap().opacity(DIMMED_OPACITY, 0.5333),
    demoTwoWrap().opacity(DIMMED_OPACITY, 0.5333),
    demoThreeWrap().opacity(DIMMED_OPACITY, 0.5333),
  );
  yield* sequence(0.2,
    titleFour().opacity(1, 0.6),
    demoFourClient().opacity(1, 0.6),
    demoFourCdn().opacity(1, 0.6),
    demoFourServer().opacity(1, 0.6),
  );
  yield* waitFor(0.2667);
  demoFourArrowIn().opacity(1);
  yield* demoFourArrowIn().end(1, 0.6, easeInOutCubic);
  demoFourArrowOut().opacity(1);
  yield* demoFourArrowOut().end(1, 0.6, easeInOutCubic);
  yield* waitFor(0.4);

  // Requête n°1 : traverse le CDN jusqu'à l'origine
  yield* demoFourRequestPacket().opacity(1, 0.16);
  yield* demoFourRequestPacket().flyTo([TRIPLE_MIDDLE_X(), -vH() * 0.06], 0.6);
  yield* demoFourRequestPacket().flyTo([TRIPLE_RIGHT_X() - D3_HALF_W() - vW() * 0.045, -vH() * 0.06], 0.6);
  yield* all(
    demoFourRequestPacket().opacity(0, 0.16),
    demoFourServer().setState('active', 0.2),
  );

  // La réponse revient avec max-age=3600 et se clone dans le CDN
  yield* demoFourResponseGroup().opacity(1, 0.2667);
  yield* demoFourResponseGroup().x(TRIPLE_MIDDLE_X(), 0.8, easeInOutCubic);
  yield* all(
    demoFourCachedCopy().opacity(1, 0.4667),
    demoFourCdn().setState('active', 0.2667),
  );
  yield* waitFor(0.4);
  yield* all(
    demoFourResponseGroup().x(TRIPLE_LEFT_X() + D3_HALF_W() + vW() * 0.05, 0.8, easeInOutCubic),
    demoFourServer().setState('idle', 0.4),
  );
  yield* all(
    demoFourResponseGroup().opacity(0, 0.2),
    demoFourCdn().setState('idle', 0.3333),
  );
  yield* waitFor(0.4);

  // Requête n°2 : la flèche s'arrête au CDN — le trajet vers l'origine reste vide
  yield* waitUntil('p4-cache-hit');
  demoFourRequestPacket().position([TRIPLE_LEFT_X() + D3_HALF_W() + vW() * 0.045, -vH() * 0.06]);
  yield* demoFourRequestPacket().opacity(1, 0.16);
  yield* demoFourRequestPacket().flyTo([TRIPLE_MIDDLE_X(), -vH() * 0.06], 0.6);
  yield* all(
    demoFourRequestPacket().opacity(0, 0.16),
    demoFourCdn().setState('success', 0.2667),
    demoFourArrowOut().opacity(0.15, 0.6667),
    demoFourServer().opacity(0.35, 0.6667),
  );
  yield* demoFourCachedCopy().scale(1.15, 0.2667, easeInOutCubic);
  yield* demoFourCachedCopy().scale(1, 0.2667, easeInOutCubic);
  demoFourResponseGroup().position([TRIPLE_MIDDLE_X(), vH() * 0.08]);
  yield* demoFourResponseGroup().opacity(1, 0.2);
  yield* demoFourResponseGroup().x(TRIPLE_LEFT_X() + D3_HALF_W() + vW() * 0.05, 0.7333, easeInOutCubic);
  yield* demoFourResponseGroup().opacity(0, 0.2);
  yield* demoFourCdn().setState('idle', 0.4);
  yield* waitFor(0.5333);

  // Parking quadrant bas-droite
  yield* waitUntil('p4-park');
  yield* all(
    demoFourWrap().scale(PARKED_SCALE, 1.0667, easeInOutCubic),
    demoFourWrap().position([QUAD_RIGHT_X(), QUAD_BOTTOM_Y() + PARKED_OFFSET_Y()], 1.0667, easeInOutCubic),
    panelFour().opacity(1, 0.8),
    demoOneWrap().opacity(1, 0.8),
    demoTwoWrap().opacity(1, 0.8),
    demoThreeWrap().opacity(1, 0.8),
  );
  yield* waitFor(0.5333);

  // ═══ Grille complète : pulse d'ensemble ═════════════════════════════════════
  yield* waitUntil('grid-pulse');
  yield* all(
    demoOneWrap().scale(PARKED_SCALE * 1.05, 0.4667, easeInOutCubic),
    demoTwoWrap().scale(PARKED_SCALE * 1.05, 0.4667, easeInOutCubic),
    demoThreeWrap().scale(PARKED_SCALE * 1.05, 0.4667, easeInOutCubic),
    demoFourWrap().scale(PARKED_SCALE * 1.05, 0.4667, easeInOutCubic),
    panelOne().stroke(PALETTE.cyan + '88', 0.4667),
    panelTwo().stroke(PALETTE.cyan + '88', 0.4667),
    panelThree().stroke(PALETTE.cyan + '88', 0.4667),
    panelFour().stroke(PALETTE.cyan + '88', 0.4667),
  );
  yield* all(
    demoOneWrap().scale(PARKED_SCALE, 0.5333, easeInOutCubic),
    demoTwoWrap().scale(PARKED_SCALE, 0.5333, easeInOutCubic),
    demoThreeWrap().scale(PARKED_SCALE, 0.5333, easeInOutCubic),
    demoFourWrap().scale(PARKED_SCALE, 0.5333, easeInOutCubic),
    panelOne().stroke(PALETTE.ghost, 0.6667),
    panelTwo().stroke(PALETTE.ghost, 0.6667),
    panelThree().stroke(PALETTE.ghost, 0.6667),
    panelFour().stroke(PALETTE.ghost, 0.6667),
  );
  yield* waitFor(2);

  // ── Fade-out ───────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.6667),
    demoOneWrap().opacity(0, 0.6667),
    demoTwoWrap().opacity(0, 0.6667),
    demoThreeWrap().opacity(0, 0.6667),
    demoFourWrap().opacity(0, 0.6667),
    panelOne().opacity(0, 0.6667),
    panelTwo().opacity(0, 0.6667),
    panelThree().opacity(0, 0.6667),
    panelFour().opacity(0, 0.6667),
    titleOne().opacity(0, 0.6667),
    titleTwo().opacity(0, 0.6667),
    titleThree().opacity(0, 0.6667),
    titleFour().opacity(0, 0.6667),
  );
  yield* waitFor(0.4);
});
