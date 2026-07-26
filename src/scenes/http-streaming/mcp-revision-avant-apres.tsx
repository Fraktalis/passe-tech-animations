import {makeScene2D, Grid, Rect, Txt} from '@motion-canvas/2d';
import {createRef, all, sequence, waitUntil, waitFor, easeInOutCubic} from '@motion-canvas/core';
import {ConnectionArrow, DiagramNode, InfoCard} from '../../components';
import {PALETTE} from '../../theme';

/**
 * Révision MCP — avant/après (ACTE 3).
 * La colonne avant (Mcp-Session-Id, GET autonome, Last-Event-ID) s'efface ;
 * la colonne après (subscriptions/listen + headers miroir) prend sa place.
 * Une gateway route sur les headers sans ouvrir le body JSON-RPC.
 * Callback final : bandeau « Interface uniforme » (BASCULE).
 * Couleur active : vert — l'ancien en ghost.
 */
export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Dimensions ────────────────────────────────────────────────────────────
  const OLD_CARD_W = () => vW() * 0.20;
  const OLD_CARD_H = () => vH() * 0.20;
  const OLD_COLUMN_X = () => -vW() * 0.26;
  const OLD_ROW_Y = [() => -vH() * 0.27, () => vH() * 0, () => vH() * 0.27];

  const LISTEN_CARD_X = () => -vW() * 0.28;
  const LISTEN_CARD_Y = () => -vH() * 0.05;
  const HEADERS_CARD_X = () => vW() * 0.01;
  const HEADERS_CARD_Y = () => -vH() * 0.05;
  const HEADERS_CARD_W = () => vW() * 0.23;
  const HEADERS_CARD_H = () => vH() * 0.32;
  const BODY_RECT_Y = () => vH() * 0.26;
  const GATEWAY_X = () => vW() * 0.32;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();

  const oldSessionCard = createRef<DiagramNode>();
  const oldGetCard     = createRef<DiagramNode>();
  const oldEventCard   = createRef<DiagramNode>();

  const listenCard    = createRef<InfoCard>();
  const headersCard   = createRef<InfoCard>();
  const methodHighlight = createRef<Rect>();
  const bodyRect      = createRef<Rect>();
  const gatewayNode   = createRef<DiagramNode>();
  const readArrow     = createRef<ConnectionArrow>();
  const routingArrow  = createRef<ConnectionArrow>();

  const basculeBanner = createRef<Txt>();

  const headerLineStyle = {
    fill: PALETTE.amber,
    fontSize: () => vW() * 0.0095,
    fontFamily: 'JetBrains Mono, DM Mono, monospace',
  };

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

    {/* ══ Colonne AVANT — mécanismes retirés ═════════════════════════════════ */}
    <DiagramNode key="old-session-card" ref={oldSessionCard}
      iconName="mdi:identifier"
      label="Mcp-Session-Id"
      color={PALETTE.ghost}
      initialState="active"
      width={OLD_CARD_W} height={OLD_CARD_H}
      x={OLD_COLUMN_X} y={OLD_ROW_Y[0]}
      opacity={0}
    />
    <DiagramNode key="old-get-card" ref={oldGetCard}
      iconName="mdi:download-network-outline"
      label="GET autonome"
      color={PALETTE.ghost}
      initialState="active"
      width={OLD_CARD_W} height={OLD_CARD_H}
      x={OLD_COLUMN_X} y={OLD_ROW_Y[1]}
      opacity={0}
    />
    <DiagramNode key="old-event-card" ref={oldEventCard}
      iconName="mdi:history"
      label="Last-Event-ID"
      color={PALETTE.ghost}
      initialState="active"
      width={OLD_CARD_W} height={OLD_CARD_H}
      x={OLD_COLUMN_X} y={OLD_ROW_Y[2]}
      opacity={0}
    />

    {/* ══ Colonne APRÈS ══════════════════════════════════════════════════════ */}
    <InfoCard key="listen-card" ref={listenCard}
      title="subscriptions/listen"
      subtitle="POST"
      color={PALETTE.dsGreen}
      width={() => vW() * 0.23} height={() => vH() * 0.24}
      x={() => LISTEN_CARD_X() + vW() * 0.10} y={LISTEN_CARD_Y}
      opacity={0}
    >
      <Txt key="listen-card-stream"
        text="→ → →"
        fill={PALETTE.dsGreen}
        fontSize={() => vW() * 0.018}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
      />
    </InfoCard>

    <InfoCard key="headers-card" ref={headersCard}
      title="Headers miroir"
      color={PALETTE.amber}
      width={HEADERS_CARD_W} height={HEADERS_CARD_H}
      x={() => HEADERS_CARD_X() + vW() * 0.10} y={HEADERS_CARD_Y}
      opacity={0}
    >
      <Txt key="header-line-protocol" text="MCP-Protocol-Version" {...headerLineStyle} />
      <Txt key="header-line-method" text="Mcp-Method: tools/call" {...headerLineStyle} />
      <Txt key="header-line-name" text="Mcp-Name: search" {...headerLineStyle} />
    </InfoCard>

    {/* Surbrillance du header lu par la gateway */}
    <Rect key="method-highlight" ref={methodHighlight}
      width={() => vW() * 0.16} height={() => vH() * 0.038}
      x={HEADERS_CARD_X} y={() => HEADERS_CARD_Y() + vH() * 0.018}
      fill={PALETTE.amber + '22'} stroke={PALETTE.amber} lineWidth={2} radius={4}
      opacity={0}
    />

    {/* Body JSON-RPC — jamais ouvert par la gateway */}
    <Rect key="body-rect" ref={bodyRect}
      width={HEADERS_CARD_W} height={() => vH() * 0.16}
      x={HEADERS_CARD_X} y={BODY_RECT_Y}
      fill={PALETTE.nodeBg} stroke={PALETTE.secondary + '55'} lineWidth={1} radius={6}
      opacity={0}
    >
      <Txt key="body-rect-line-1"
        text={'{"jsonrpc":"2.0",'}
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.009}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        y={() => -vH() * 0.02}
        opacity={0.4}
      />
      <Txt key="body-rect-line-2"
        text={'"method": ··· }'}
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.009}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        y={() => vH() * 0.02}
        opacity={0.4}
      />
    </Rect>

    {/* Gateway — lit le header, route sans ouvrir le body */}
    <DiagramNode key="gateway-node" ref={gatewayNode}
      iconName="mdi:swap-horizontal"
      label="GATEWAY"
      color={PALETTE.secondary}
      initialState="idle"
      width={() => vW() * 0.12} height={() => vH() * 0.22}
      x={GATEWAY_X} y={() => -vH() * 0.05}
      opacity={0}
    />
    <ConnectionArrow key="read-arrow" ref={readArrow}
      from={() => [GATEWAY_X() - vW() * 0.06, -vH() * 0.02]}
      to={() =>   [HEADERS_CARD_X() + vW() * 0.085, HEADERS_CARD_Y() + vH() * 0.018]}
      stroke={PALETTE.amber}
      dashed
      arrowSize={7}
      end={0} opacity={0}
    />
    <ConnectionArrow key="routing-arrow" ref={routingArrow}
      from={() => [GATEWAY_X() + vW() * 0.06, -vH() * 0.05]}
      to={() =>   [vW() * 0.47, -vH() * 0.05]}
      stroke={PALETTE.dsGreen}
      end={0} opacity={0}
    />

    {/* ══ Callback BASCULE ═══════════════════════════════════════════════════ */}
    <Txt key="bascule-banner" ref={basculeBanner}
      text="Interface uniforme"
      fill={PALETTE.cream}
      fontSize={() => vW() * 0.022}
      fontFamily={'Space Grotesk, DM Sans, sans-serif'}
      fontWeight={700}
      x={0} y={() => vH() * 0.42}
      opacity={0}
    />
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  yield* waitUntil('intro');
  yield* gridRef().opacity(0.07, 1.6);

  // Colonne AVANT
  yield* waitUntil('avant');
  yield* sequence(0.24,
    oldSessionCard().opacity(1, 0.8),
    oldGetCard().opacity(1, 0.8),
    oldEventCard().opacity(1, 0.8),
  );
  yield* waitFor(1.6);

  // Grisage puis effacement une à une
  yield* waitUntil('effacement');
  yield* all(
    oldSessionCard().opacity(0.45, 1),
    oldGetCard().opacity(0.45, 1),
    oldEventCard().opacity(0.45, 1),
  );
  yield* waitFor(0.6);
  yield* sequence(0.5,
    all(
      oldSessionCard().x(OLD_COLUMN_X() - vW() * 0.09, 1.1, easeInOutCubic),
      oldSessionCard().opacity(0, 1.1),
    ),
    all(
      oldGetCard().x(OLD_COLUMN_X() - vW() * 0.09, 1.1, easeInOutCubic),
      oldGetCard().opacity(0, 1.1),
    ),
    all(
      oldEventCard().x(OLD_COLUMN_X() - vW() * 0.09, 1.1, easeInOutCubic),
      oldEventCard().opacity(0, 1.1),
    ),
  );
  yield* waitFor(0.6);

  // Colonne APRÈS prend la place
  yield* waitUntil('apres');
  yield* all(
    listenCard().opacity(1, 1),
    listenCard().x(LISTEN_CARD_X(), 1.2, easeInOutCubic),
  );
  yield* waitFor(0.4);
  yield* all(
    headersCard().opacity(1, 1),
    headersCard().x(HEADERS_CARD_X(), 1.2, easeInOutCubic),
  );
  yield* bodyRect().opacity(1, 0.8);
  yield* waitFor(1.2);

  // La gateway lit le header et route — le body reste fermé
  yield* waitUntil('gateway-route');
  yield* gatewayNode().opacity(1, 0.9);
  yield* waitFor(0.4);
  readArrow().opacity(1);
  yield* readArrow().end(1, 0.8, easeInOutCubic);
  yield* all(
    methodHighlight().opacity(1, 0.6),
    gatewayNode().setState('active', 0.4),
  );
  yield* waitFor(0.8);
  // Le body s'estompe encore pendant que le routing part
  yield* bodyRect().opacity(0.35, 0.8);
  routingArrow().opacity(1);
  yield* routingArrow().end(1, 1.1, easeInOutCubic);
  yield* waitFor(1.6);

  // Callback visuel vers la BASCULE
  yield* waitUntil('callback-bascule');
  yield* basculeBanner().opacity(1, 1);
  yield* basculeBanner().scale(1.08, 0.7, easeInOutCubic);
  yield* basculeBanner().scale(1, 0.8, easeInOutCubic);
  yield* waitFor(2.4);

  // ── Fade-out ───────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 1),
    listenCard().opacity(0, 1),
    headersCard().opacity(0, 1),
    methodHighlight().opacity(0, 1),
    bodyRect().opacity(0, 1),
    gatewayNode().opacity(0, 1),
    readArrow().opacity(0, 1),
    routingArrow().opacity(0, 1),
    basculeBanner().opacity(0, 1),
  );
  yield* waitFor(0.6);
});
