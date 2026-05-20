import {makeScene2D} from '@motion-canvas/2d';
import {Circle, Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  sequence,
  waitFor,
  waitUntil,
} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const C = {
    bg:          '#0D1117',
    grid:        '#21262D',
    cream:       '#F9F9F6',
    ghost:       '#484F58',
    processBg:   '#1C2128',
    mobile:      '#6DFF8A',
    partner:     '#58A6FF',
    agent:       '#FFE14D',
    gateway:     '#FF3E6C',
    service:     '#58A6FF',
    auth:        '#FFE14D',
    ok:          '#3FB950',
    danger:      '#FF3E6C',
  };

  // ── Signals ─────────────────────────────────────────────────────────────────
  const rateLimitCount = createSignal(0);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();

  // Clients gauche
  const mobileClientBox  = createRef<Rect>();
  const partnerClientBox = createRef<Rect>();
  const agentClientBox   = createRef<Rect>();

  // Flèches clients → gateway
  const arrowMobileGw  = createRef<Line>();
  const arrowPartnerGw = createRef<Line>();
  const arrowAgentGw   = createRef<Line>();

  // API Gateway
  const gatewayBox     = createRef<Rect>();
  const jwtBadge       = createRef<Rect>();
  const oauth2Badge    = createRef<Rect>();
  const apiKeyBadge    = createRef<Rect>();
  const rateLimitBadge = createRef<Rect>();
  const quotaBadge     = createRef<Rect>();
  const logsBadge      = createRef<Rect>();

  // Microservices droite
  const ordersServiceBox = createRef<Rect>();
  const usersServiceBox  = createRef<Rect>();
  const adminServiceBox  = createRef<Rect>();

  // Flèches gateway → services
  const arrowGwOrders = createRef<Line>();
  const arrowGwUsers  = createRef<Line>();
  const arrowGwAdmin  = createRef<Line>();

  // Dot animé principal
  const requestDot = createRef<Circle>();

  // Phase intro — questions héritées du LB-aveugle
  const whoLabel    = createRef<Txt>();
  const rightsLabel = createRef<Txt>();
  const quotaLabel  = createRef<Txt>();

  // Labels contextuels
  const bouncerLabel     = createRef<Txt>();
  const rateLimitCounter = createRef<Txt>();
  const blockedLabel     = createRef<Txt>();
  const transformLabel   = createRef<Txt>();
  const ordersRouteLabel = createRef<Txt>();
  const adminBlockLabel  = createRef<Txt>();
  const conditionalLabel = createRef<Txt>();

  // Paquets transformation XML→JSON
  const xmlPacket  = createRef<Rect>();
  const jsonPacket = createRef<Rect>();

  // Lignes de log
  const logLine1 = createRef<Txt>();
  const logLine2 = createRef<Txt>();
  const logLine3 = createRef<Txt>();

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE TREE
  // ══════════════════════════════════════════════════════════════════════════
  view.add(
    <Layout key="root">
      <Rect key="bg" width={'100%'} height={'100%'} fill={C.bg} zIndex={-2} />
      <Grid
        key="grid"
        ref={gridRef}
        width={'100%'}
        height={'100%'}
        stroke={C.grid}
        lineWidth={1}
        spacing={() => vW() * 0.031}
        opacity={0}
        zIndex={-1}
      />

      {/* ═══ CLIENTS (gauche) ════════════════════════════════════════════════ */}
      <Rect
        key="mobile-client-box"
        ref={mobileClientBox}
        x={() => -vW() * 0.38}
        y={() => -vH() * 0.20}
        width={() => vW() * 0.145}
        height={() => vH() * 0.115}
        fill={C.processBg}
        stroke={C.mobile}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.009}
      >
        <Txt key="mobile-icon" text="◉" fill={C.mobile} fontSize={() => vW() * 0.020} fontFamily={'Space Grotesk'} />
        <Txt key="mobile-label" text="Client mobile" fill={C.cream} fontSize={() => vW() * 0.009} fontWeight={600} fontFamily={'Space Grotesk'} />
        <Txt key="mobile-key" text="key: mobile_***" fill={C.ghost} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
      </Rect>

      <Rect
        key="partner-client-box"
        ref={partnerClientBox}
        x={() => -vW() * 0.38}
        y={0}
        width={() => vW() * 0.145}
        height={() => vH() * 0.115}
        fill={C.processBg}
        stroke={C.partner}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.009}
      >
        <Txt key="partner-icon" text="◉" fill={C.partner} fontSize={() => vW() * 0.020} fontFamily={'Space Grotesk'} />
        <Txt key="partner-label" text="Partenaire" fill={C.cream} fontSize={() => vW() * 0.009} fontWeight={600} fontFamily={'Space Grotesk'} />
        <Txt key="partner-key" text="key: partner_***" fill={C.ghost} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
      </Rect>

      <Rect
        key="agent-client-box"
        ref={agentClientBox}
        x={() => -vW() * 0.38}
        y={() => vH() * 0.20}
        width={() => vW() * 0.145}
        height={() => vH() * 0.115}
        fill={C.processBg}
        stroke={C.agent}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.009}
      >
        <Txt key="agent-icon" text="⚙" fill={C.agent} fontSize={() => vW() * 0.020} fontFamily={'Space Grotesk'} />
        <Txt key="agent-label" text="Agent automatisé" fill={C.cream} fontSize={() => vW() * 0.009} fontWeight={600} fontFamily={'Space Grotesk'} />
        <Txt key="agent-key" text="key: agent_***" fill={C.ghost} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
      </Rect>

      {/* Flèches clients → gateway */}
      <Line key="arrow-mobile-gw" ref={arrowMobileGw}
        points={() => [[-vW() * 0.305, -vH() * 0.20], [-vW() * 0.115, 0]]}
        stroke={C.mobile} lineWidth={2} endArrow arrowSize={() => vW() * 0.007} opacity={0} end={0} />
      <Line key="arrow-partner-gw" ref={arrowPartnerGw}
        points={() => [[-vW() * 0.305, 0], [-vW() * 0.115, 0]]}
        stroke={C.partner} lineWidth={2} endArrow arrowSize={() => vW() * 0.007} opacity={0} end={0} />
      <Line key="arrow-agent-gw" ref={arrowAgentGw}
        points={() => [[-vW() * 0.305, vH() * 0.20], [-vW() * 0.115, 0]]}
        stroke={C.agent} lineWidth={2} endArrow arrowSize={() => vW() * 0.007} opacity={0} end={0} />

      {/* ═══ API GATEWAY (centre) ════════════════════════════════════════════ */}
      <Rect
        key="gateway-box"
        ref={gatewayBox}
        x={0}
        y={0}
        width={() => vW() * 0.23}
        height={() => vH() * 0.63}
        fill={C.processBg}
        stroke={C.gateway}
        lineWidth={2}
        radius={() => vW() * 0.007}
        opacity={0}
        clip
        layout direction={'column'} alignItems={'center'} gap={0}
      >
        {/* En-tête */}
        <Rect
          key="gw-header"
          width={'100%'}
          height={() => vH() * 0.085}
          fill={C.gateway + '22'}
          layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.006}
        >
          <Txt key="gw-title" text="API GATEWAY" fill={C.gateway} fontSize={() => vW() * 0.013} fontWeight={700} fontFamily={'Space Grotesk'} />
          <Txt key="gw-subtitle" text="◎  point d'entrée unique" fill={C.ghost} fontSize={() => vW() * 0.008} fontFamily={'Space Grotesk'} />
        </Rect>

        <Rect key="gw-div-top" width={'100%'} height={1} fill={C.gateway + '40'} />

        {/* Auth */}
        <Rect
          key="gw-auth-section"
          width={'100%'}
          height={() => vH() * 0.115}
          layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.010}
        >
          <Txt key="gw-auth-title" text="AUTHENTIFICATION" fill={C.ghost} fontSize={() => vW() * 0.007} fontFamily={'Space Grotesk'} letterSpacing={1} />
          <Rect key="gw-auth-badges" width={'90%'} layout direction={'row'} alignItems={'center'} justifyContent={'center'} gap={() => vW() * 0.006}>
            <Rect key="jwt-badge" ref={jwtBadge}
              fill={C.auth + '18'} stroke={C.auth} lineWidth={1}
              radius={() => vW() * 0.003} padding={() => vW() * 0.007} opacity={0}
              layout justifyContent={'center'}
            >
              <Txt key="jwt-txt" text="JWT" fill={C.auth} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} fontWeight={700} />
            </Rect>
            <Rect key="oauth2-badge" ref={oauth2Badge}
              fill={C.auth + '18'} stroke={C.auth} lineWidth={1}
              radius={() => vW() * 0.003} padding={() => vW() * 0.007} opacity={0}
              layout justifyContent={'center'}
            >
              <Txt key="oauth2-txt" text="OAuth2" fill={C.auth} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} fontWeight={700} />
            </Rect>
            <Rect key="apikey-badge" ref={apiKeyBadge}
              fill={C.auth + '18'} stroke={C.auth} lineWidth={1}
              radius={() => vW() * 0.003} padding={() => vW() * 0.007} opacity={0}
              layout justifyContent={'center'}
            >
              <Txt key="apikey-txt" text="API Key" fill={C.auth} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} fontWeight={700} />
            </Rect>
          </Rect>
        </Rect>

        <Rect key="gw-div-1" width={'90%'} height={1} fill={C.gateway + '30'} />

        {/* Rate limit */}
        <Rect
          key="gw-rl-section"
          width={'100%'}
          height={() => vH() * 0.105}
          layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.010}
        >
          <Txt key="gw-rl-title" text="RATE LIMITING" fill={C.ghost} fontSize={() => vW() * 0.007} fontFamily={'Space Grotesk'} letterSpacing={1} />
          <Rect key="rl-badge" ref={rateLimitBadge}
            fill={C.gateway + '18'} stroke={C.gateway} lineWidth={1}
            radius={() => vW() * 0.003} padding={() => vW() * 0.007} opacity={0}
            layout justifyContent={'center'}
          >
            <Txt key="rl-txt" text="100 req / min" fill={C.gateway} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} fontWeight={700} />
          </Rect>
        </Rect>

        <Rect key="gw-div-2" width={'90%'} height={1} fill={C.gateway + '30'} />

        {/* Quotas */}
        <Rect
          key="gw-quota-section"
          width={'100%'}
          height={() => vH() * 0.105}
          layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.010}
        >
          <Txt key="gw-quota-title" text="QUOTAS & PLANS" fill={C.ghost} fontSize={() => vW() * 0.007} fontFamily={'Space Grotesk'} letterSpacing={1} />
          <Rect key="quota-badge" ref={quotaBadge}
            fill={C.ok + '18'} stroke={C.ok} lineWidth={1}
            radius={() => vW() * 0.003} padding={() => vW() * 0.007} opacity={0}
            layout justifyContent={'center'}
          >
            <Txt key="quota-txt" text="/orders  /users" fill={C.ok} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} fontWeight={700} />
          </Rect>
        </Rect>

        <Rect key="gw-div-3" width={'90%'} height={1} fill={C.gateway + '30'} />

        {/* Logs */}
        <Rect
          key="gw-logs-section"
          width={'100%'}
          grow={1}
          layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.010}
        >
          <Txt key="gw-logs-title" text="LOGS CENTRALISÉS" fill={C.ghost} fontSize={() => vW() * 0.007} fontFamily={'Space Grotesk'} letterSpacing={1} />
          <Rect key="logs-badge" ref={logsBadge}
            fill={C.service + '18'} stroke={C.service} lineWidth={1}
            radius={() => vW() * 0.003} padding={() => vW() * 0.007} opacity={0}
            layout justifyContent={'center'}
          >
            <Txt key="logs-txt" text="WHO · WHAT · WHEN" fill={C.service} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} fontWeight={700} />
          </Rect>
        </Rect>
      </Rect>

      {/* ═══ MICROSERVICES (droite) ══════════════════════════════════════════ */}
      <Rect
        key="orders-service-box"
        ref={ordersServiceBox}
        x={() => vW() * 0.39}
        y={() => -vH() * 0.20}
        width={() => vW() * 0.155}
        height={() => vH() * 0.115}
        fill={C.processBg}
        stroke={C.service}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.008}
      >
        <Txt key="orders-icon" text="▣" fill={C.service} fontSize={() => vW() * 0.018} fontFamily={'Space Grotesk'} />
        <Txt key="orders-label" text="Orders" fill={C.cream} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />
        <Txt key="orders-path" text="/orders" fill={C.service} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
      </Rect>

      <Rect
        key="users-service-box"
        ref={usersServiceBox}
        x={() => vW() * 0.39}
        y={0}
        width={() => vW() * 0.155}
        height={() => vH() * 0.115}
        fill={C.processBg}
        stroke={C.service}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.008}
      >
        <Txt key="users-icon" text="▣" fill={C.service} fontSize={() => vW() * 0.018} fontFamily={'Space Grotesk'} />
        <Txt key="users-label" text="Users" fill={C.cream} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />
        <Txt key="users-path" text="/users" fill={C.service} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
      </Rect>

      <Rect
        key="admin-service-box"
        ref={adminServiceBox}
        x={() => vW() * 0.39}
        y={() => vH() * 0.20}
        width={() => vW() * 0.155}
        height={() => vH() * 0.115}
        fill={C.processBg}
        stroke={C.ghost}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.008}
      >
        <Txt key="admin-icon" text="▣" fill={C.ghost} fontSize={() => vW() * 0.018} fontFamily={'Space Grotesk'} />
        <Txt key="admin-label" text="Admin" fill={C.ghost} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />
        <Txt key="admin-path" text="/admin  🔒" fill={C.ghost} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
      </Rect>

      {/* Flèches gateway → services */}
      <Line key="arrow-gw-orders" ref={arrowGwOrders}
        points={() => [[vW() * 0.115, 0], [vW() * 0.312, -vH() * 0.20]]}
        stroke={C.service} lineWidth={2} endArrow arrowSize={() => vW() * 0.007} opacity={0} end={0} />
      <Line key="arrow-gw-users" ref={arrowGwUsers}
        points={() => [[vW() * 0.115, 0], [vW() * 0.312, 0]]}
        stroke={C.service} lineWidth={2} endArrow arrowSize={() => vW() * 0.007} opacity={0} end={0} />
      <Line key="arrow-gw-admin" ref={arrowGwAdmin}
        points={() => [[vW() * 0.115, 0], [vW() * 0.312, vH() * 0.20]]}
        stroke={C.ghost} lineWidth={2} endArrow arrowSize={() => vW() * 0.007} opacity={0} end={0} />

      {/* ═══ DOT PRINCIPAL ═══════════════════════════════════════════════════ */}
      <Circle key="request-dot" ref={requestDot}
        width={() => vW() * 0.016} height={() => vW() * 0.016}
        fill={C.mobile} shadowColor={C.mobile} shadowBlur={() => vW() * 0.012}
        x={0} y={0} opacity={0} zIndex={5} />

      {/* ═══ LABELS INTRO — questions LB-aveugle ═════════════════════════════ */}
      <Txt key="who-label" ref={whoLabel}
        text="Qui appelle ?" fill={C.danger}
        fontSize={() => vW() * 0.013} fontWeight={600} fontFamily={'Space Grotesk'}
        x={() => -vW() * 0.05} y={() => -vH() * 0.10} opacity={0} />
      <Txt key="rights-label" ref={rightsLabel}
        text="Quels droits ?" fill={C.danger}
        fontSize={() => vW() * 0.013} fontWeight={600} fontFamily={'Space Grotesk'}
        x={() => vW() * 0.07} y={() => vH() * 0.06} opacity={0} />
      <Txt key="quota-label" ref={quotaLabel}
        text="Combien de fois ?" fill={C.danger}
        fontSize={() => vW() * 0.013} fontWeight={600} fontFamily={'Space Grotesk'}
        x={() => -vW() * 0.04} y={() => vH() * 0.24} opacity={0} />

      {/* ═══ VIDEUR LABEL ════════════════════════════════════════════════════ */}
      <Txt key="bouncer-label" ref={bouncerLabel}
        text="Le videur — il connaît ton identité avant de te laisser passer"
        fill={C.gateway} fontSize={() => vW() * 0.013} fontWeight={700} fontFamily={'Space Grotesk'}
        x={0} y={() => vH() * 0.38} opacity={0} />

      {/* ═══ RATE LIMIT COUNTER ══════════════════════════════════════════════ */}
      <Txt key="rate-limit-counter" ref={rateLimitCounter}
        text={() => `${Math.round(rateLimitCount())} / 100 req`}
        fill={C.gateway} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'DM Mono, monospace'}
        x={0} y={() => vH() * 0.385} opacity={0} />
      <Txt key="blocked-label" ref={blockedLabel}
        text="429  TOO MANY REQUESTS"
        fill={C.danger} fontSize={() => vW() * 0.016} fontWeight={800} fontFamily={'DM Mono, monospace'}
        x={0} y={() => vH() * 0.385} opacity={0} />

      {/* ═══ XML → JSON TRANSFORMATION ═══════════════════════════════════════ */}
      <Rect key="xml-packet" ref={xmlPacket}
        x={() => -vW() * 0.35} y={0}
        width={() => vW() * 0.095} height={() => vH() * 0.055}
        fill={C.agent + '20'} stroke={C.agent} lineWidth={2}
        radius={() => vW() * 0.004}
        opacity={0} layout alignItems={'center'} justifyContent={'center'} zIndex={6}
      >
        <Txt key="xml-txt" text="XML" fill={C.agent} fontSize={() => vW() * 0.012} fontWeight={700} fontFamily={'DM Mono, monospace'} />
      </Rect>
      <Rect key="json-packet" ref={jsonPacket}
        x={0} y={0}
        width={() => vW() * 0.095} height={() => vH() * 0.055}
        fill={C.ok + '20'} stroke={C.ok} lineWidth={2}
        radius={() => vW() * 0.004}
        opacity={0} layout alignItems={'center'} justifyContent={'center'} zIndex={6}
      >
        <Txt key="json-txt" text="JSON" fill={C.ok} fontSize={() => vW() * 0.012} fontWeight={700} fontFamily={'DM Mono, monospace'} />
      </Rect>
      <Txt key="transform-label" ref={transformLabel}
        text="traducteur silencieux — chaque côté ignore le format de l'autre"
        fill={C.gateway} fontSize={() => vW() * 0.012} fontWeight={600} fontFamily={'Space Grotesk'}
        x={0} y={() => vH() * 0.385} opacity={0} />

      {/* ═══ ROUTING CONDITIONNEL ════════════════════════════════════════════ */}
      <Txt key="orders-route-label" ref={ordersRouteLabel}
        text="/orders  ✓  plan Partenaire"
        fill={C.ok} fontSize={() => vW() * 0.012} fontWeight={700} fontFamily={'DM Mono, monospace'}
        x={() => vW() * 0.25} y={() => -vH() * 0.33} opacity={0} />
      <Txt key="admin-block-label" ref={adminBlockLabel}
        text="403  FORBIDDEN"
        fill={C.danger} fontSize={() => vW() * 0.014} fontWeight={800} fontFamily={'DM Mono, monospace'}
        x={() => -vW() * 0.18} y={() => vH() * 0.25} opacity={0} />
      <Txt key="conditional-label" ref={conditionalLabel}
        text="routing par identité — pas par adresse"
        fill={C.gateway} fontSize={() => vW() * 0.013} fontWeight={600} fontFamily={'Space Grotesk'}
        x={0} y={() => vH() * 0.385} opacity={0} />

      {/* ═══ LOG LINES ═══════════════════════════════════════════════════════ */}
      <Txt key="log-line-1" ref={logLine1}
        text={'[14:32:01]  mobile_***   GET /orders   200  42ms'}
        fill={C.ok} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'}
        x={0} y={() => vH() * 0.335} opacity={0} />
      <Txt key="log-line-2" ref={logLine2}
        text={'[14:32:04]  agent_***    POST /data    200  18ms'}
        fill={C.ok} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'}
        x={0} y={() => vH() * 0.365} opacity={0} />
      <Txt key="log-line-3" ref={logLine3}
        text={'[14:32:09]  unknown      GET /admin    403   0ms'}
        fill={C.danger} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'}
        x={0} y={() => vH() * 0.395} opacity={0} />
    </Layout>,
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ══════════════════════════════════════════════════════════════════════════

  // ─── Intro : 3 sources + questions LB-aveugle ─────────────────────────────
  yield* waitUntil('intro');

  yield* gridRef().opacity(0.12, 1);
  yield* sequence(0.12,
    mobileClientBox().opacity(1, 0.4),
    partnerClientBox().opacity(1, 0.4),
    agentClientBox().opacity(1, 0.4),
  );

  yield* sequence(0.2,
    whoLabel().opacity(1, 0.4),
    rightsLabel().opacity(1, 0.4),
    quotaLabel().opacity(1, 0.4),
  );

  yield* waitFor(1.5);

  // ─── Gateway apparaît ─────────────────────────────────────────────────────
  yield* waitUntil('gatewayAppears');

  yield* all(
    whoLabel().opacity(0, 0.35),
    rightsLabel().opacity(0, 0.35),
    quotaLabel().opacity(0, 0.35),
  );

  yield* gatewayBox().opacity(1, 0.6);

  yield* all(
    arrowMobileGw().opacity(1, 0.3),  arrowMobileGw().end(1, 0.45),
    arrowPartnerGw().opacity(1, 0.3), arrowPartnerGw().end(1, 0.45),
    arrowAgentGw().opacity(1, 0.3),   arrowAgentGw().end(1, 0.45),
  );

  yield* sequence(0.1,
    all(arrowGwOrders().opacity(1, 0.3), arrowGwOrders().end(1, 0.45)),
    all(arrowGwUsers().opacity(1, 0.3),  arrowGwUsers().end(1, 0.45)),
    all(arrowGwAdmin().opacity(1, 0.3),  arrowGwAdmin().end(1, 0.45)),
  );

  yield* sequence(0.1,
    ordersServiceBox().opacity(1, 0.4),
    usersServiceBox().opacity(1, 0.4),
    adminServiceBox().opacity(1, 0.4),
  );

  yield* bouncerLabel().opacity(1, 0.5);
  yield* waitFor(2);
  yield* bouncerLabel().opacity(0, 0.35);

  // ─── Auth ─────────────────────────────────────────────────────────────────
  yield* waitUntil('authFeatures');

  yield* sequence(0.14,
    jwtBadge().opacity(1, 0.4),
    oauth2Badge().opacity(1, 0.4),
    apiKeyBadge().opacity(1, 0.4),
  );

  // Mobile → gateway (auth check) → Orders
  requestDot().fill(C.mobile);
  requestDot().shadowColor(C.mobile);
  requestDot().x(-vW() * 0.38);
  requestDot().y(-vH() * 0.20);
  requestDot().opacity(1);
  yield* all(
    requestDot().x(0, 0.38, easeInOutCubic),
    requestDot().y(0, 0.38, easeInOutCubic),
  );
  // Flash auth
  gatewayBox().shadowColor(C.auth);
  yield* gatewayBox().shadowBlur(vW() * 0.014, 0.18);
  yield* gatewayBox().shadowBlur(0, 0.18);
  yield* all(
    requestDot().x(vW() * 0.39, 0.35, easeInOutCubic),
    requestDot().y(-vH() * 0.20, 0.35, easeInOutCubic),
  );
  yield* requestDot().opacity(0, 0.15);

  yield* waitFor(1);

  // ─── Rate Limiting ────────────────────────────────────────────────────────
  yield* waitUntil('rateLimiting');

  yield* rateLimitBadge().opacity(1, 0.4);
  yield* rateLimitCounter().opacity(1, 0.4);

  // Compteur monte — trafic qui s'accumule
  yield* rateLimitCount(100, 1.6);

  yield* waitFor(0.25);

  // Nouvelle requête agent → gateway → BLOQUÉE
  requestDot().fill(C.agent);
  requestDot().shadowColor(C.agent);
  requestDot().x(-vW() * 0.38);
  requestDot().y(vH() * 0.20);
  requestDot().opacity(1);
  yield* all(
    requestDot().x(0, 0.30, easeInOutCubic),
    requestDot().y(0, 0.30, easeInOutCubic),
  );

  gatewayBox().shadowColor(C.danger);
  yield* all(
    rateLimitCounter().opacity(0, 0.2),
    blockedLabel().opacity(1, 0.3),
    gatewayBox().stroke(C.danger, 0.3),
    gatewayBox().shadowBlur(vW() * 0.018, 0.3),
  );

  // Rebondit vers l'agent
  yield* all(
    requestDot().x(-vW() * 0.38, 0.30, easeInOutCubic),
    requestDot().y(vH() * 0.20, 0.30, easeInOutCubic),
  );
  yield* requestDot().opacity(0, 0.15);

  yield* waitFor(1);

  yield* all(
    blockedLabel().opacity(0, 0.3),
    gatewayBox().stroke(C.gateway, 0.4),
    gatewayBox().shadowBlur(0, 0.4),
    rateLimitCount(0, 0.35),
    rateLimitCounter().opacity(0, 0.3),
  );

  // ─── Logs centralisés ─────────────────────────────────────────────────────
  yield* waitUntil('centralLogs');

  yield* logsBadge().opacity(1, 0.4);

  // Requête 1 : mobile → gateway → orders
  requestDot().fill(C.mobile);
  requestDot().shadowColor(C.mobile);
  requestDot().x(-vW() * 0.38);
  requestDot().y(-vH() * 0.20);
  requestDot().opacity(1);
  yield* all(
    requestDot().x(0, 0.32, easeInOutCubic),
    requestDot().y(0, 0.32, easeInOutCubic),
  );
  yield* waitFor(0.06);
  yield* all(
    requestDot().x(vW() * 0.39, 0.30, easeInOutCubic),
    requestDot().y(-vH() * 0.20, 0.30, easeInOutCubic),
  );
  yield* requestDot().opacity(0, 0.12);
  yield* logLine1().opacity(1, 0.35);

  // Requête 2 : agent → gateway → users
  requestDot().fill(C.agent);
  requestDot().shadowColor(C.agent);
  requestDot().x(-vW() * 0.38);
  requestDot().y(vH() * 0.20);
  requestDot().opacity(1);
  yield* all(
    requestDot().x(0, 0.32, easeInOutCubic),
    requestDot().y(0, 0.32, easeInOutCubic),
  );
  yield* waitFor(0.06);
  yield* all(
    requestDot().x(vW() * 0.39, 0.30, easeInOutCubic),
    requestDot().y(0, 0.30),
  );
  yield* requestDot().opacity(0, 0.12);
  yield* logLine2().opacity(1, 0.35);

  // Log 3 : refus /admin — sans dot (déjà vu plus haut)
  yield* logLine3().opacity(1, 0.4);

  yield* waitFor(1.5);

  yield* all(
    logLine1().opacity(0, 0.3),
    logLine2().opacity(0, 0.3),
    logLine3().opacity(0, 0.3),
  );

  // ─── XML → JSON Transformation ────────────────────────────────────────────
  yield* waitUntil('xmlToJson');

  // Paquet XML part du partenaire
  xmlPacket().x(-vW() * 0.35);
  xmlPacket().y(0);
  yield* xmlPacket().opacity(1, 0.4);
  yield* xmlPacket().x(0, 0.55, easeInOutCubic);

  // Transformation dans le gateway
  yield* xmlPacket().opacity(0, 0.22);
  jsonPacket().x(0);
  jsonPacket().y(0);
  yield* jsonPacket().opacity(1, 0.28);
  yield* transformLabel().opacity(1, 0.4);

  yield* waitFor(0.35);

  // Paquet JSON repart vers le backend (users)
  yield* all(
    jsonPacket().x(vW() * 0.39, 0.50, easeInOutCubic),
    jsonPacket().y(0, 0.50),
  );
  yield* jsonPacket().opacity(0, 0.18);

  yield* waitFor(1.5);
  yield* transformLabel().opacity(0, 0.3);

  // ─── Routing conditionnel ──────────────────────────────────────────────────
  yield* waitUntil('conditionalRouting');

  yield* quotaBadge().opacity(1, 0.4);

  // Partenaire → /orders (autorisé, plan correspondant)
  requestDot().fill(C.partner);
  requestDot().shadowColor(C.partner);
  requestDot().x(-vW() * 0.38);
  requestDot().y(0);
  requestDot().opacity(1);
  yield* all(
    requestDot().x(0, 0.32, easeInOutCubic),
    requestDot().y(0, 0.32),
  );
  yield* waitFor(0.08);
  yield* all(
    requestDot().x(vW() * 0.39, 0.32, easeInOutCubic),
    requestDot().y(-vH() * 0.20, 0.32, easeInOutCubic),
  );
  ordersServiceBox().shadowColor(C.ok);
  yield* all(
    requestDot().opacity(0, 0.15),
    ordersServiceBox().shadowBlur(vW() * 0.016, 0.30),
  );
  yield* ordersRouteLabel().opacity(1, 0.4);
  yield* ordersServiceBox().shadowBlur(0, 0.4);

  yield* waitFor(0.5);

  // Agent → /admin (bloqué au gateway, jamais transmis)
  requestDot().fill(C.agent);
  requestDot().shadowColor(C.agent);
  requestDot().x(-vW() * 0.38);
  requestDot().y(vH() * 0.20);
  requestDot().opacity(1);
  yield* all(
    requestDot().x(0, 0.32, easeInOutCubic),
    requestDot().y(0, 0.32, easeInOutCubic),
  );

  gatewayBox().shadowColor(C.danger);
  yield* all(
    gatewayBox().shadowBlur(vW() * 0.014, 0.18),
    adminBlockLabel().opacity(1, 0.28),
  );

  // Rebondit
  yield* all(
    requestDot().x(-vW() * 0.38, 0.32, easeInOutCubic),
    requestDot().y(vH() * 0.20, 0.32, easeInOutCubic),
    gatewayBox().shadowBlur(0, 0.35),
  );
  yield* requestDot().opacity(0, 0.15);

  yield* waitFor(0.4);
  yield* conditionalLabel().opacity(1, 0.5);

  yield* waitFor(2);

  // ─── End Scene ────────────────────────────────────────────────────────────
  yield* waitUntil('endScene');

  yield* all(
    gridRef().opacity(0, 0.5),
    mobileClientBox().opacity(0, 0.5),
    partnerClientBox().opacity(0, 0.5),
    agentClientBox().opacity(0, 0.5),
    gatewayBox().opacity(0, 0.5),
    ordersServiceBox().opacity(0, 0.5),
    usersServiceBox().opacity(0, 0.5),
    adminServiceBox().opacity(0, 0.5),
    arrowMobileGw().opacity(0, 0.5),
    arrowPartnerGw().opacity(0, 0.5),
    arrowAgentGw().opacity(0, 0.5),
    arrowGwOrders().opacity(0, 0.5),
    arrowGwUsers().opacity(0, 0.5),
    arrowGwAdmin().opacity(0, 0.5),
    ordersRouteLabel().opacity(0, 0.5),
    adminBlockLabel().opacity(0, 0.5),
    conditionalLabel().opacity(0, 0.5),
  );
});
