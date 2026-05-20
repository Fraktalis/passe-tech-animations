import {makeScene2D} from '@motion-canvas/2d';
import {Circle, Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {
  all,
  createRef,
  easeInOutCubic,
  easeOutCubic,
  sequence,
  waitFor,
  waitUntil,
} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const C = {
    bg:        '#0D1117',
    grid:      '#21262D',
    cream:     '#F9F9F6',
    ghost:     '#484F58',
    processBg: '#1C2128',
    client:    '#6DFF8A',
    proxy:     '#FFE14D',
    server:    '#58A6FF',
    internal:  '#3FB950',
    danger:    '#FF3E6C',
  };

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();

  // Client
  const clientBox = createRef<Rect>();

  // Phase A — connexion directe
  const directServerBox = createRef<Rect>();
  const directArrow     = createRef<Line>();
  const ipLabel         = createRef<Txt>();

  // Phase B — Reverse Proxy + services
  const proxyBox             = createRef<Rect>();
  const proxyRoutesContainer = createRef<Rect>();
  const routeRule1           = createRef<Txt>();
  const routeRule2           = createRef<Txt>();
  const arrowClientProxy     = createRef<Line>();
  const frontendBox          = createRef<Rect>();
  const backendBox           = createRef<Rect>();
  const arrowProxyFrontend   = createRef<Line>();
  const arrowProxyBackend    = createRef<Line>();

  // Badges bénéfices (contrôle individuel)
  const benefitsRow = createRef<Rect>();
  const tlsBadge    = createRef<Rect>();
  const cacheBadge  = createRef<Rect>();
  const gzipBadge   = createRef<Rect>();

  // Dot animé (paquet de requête)
  const requestDot = createRef<Circle>();

  // ─── TLS ───
  const tlsEncLabel  = createRef<Txt>();  // "🔒 HTTPS" au-dessus de la flèche gauche
  const tlsPlainLabel = createRef<Txt>(); // "HTTP →" au-dessus de la flèche droite (clair)
  const tlsTermLabel  = createRef<Txt>(); // "Terminaison TLS" sous le proxy

  // ─── Cache ───
  const cacheStorageBox = createRef<Rect>(); // indicateur cache sous le proxy
  const cacheMissLabel  = createRef<Txt>();
  const cacheHitLabel   = createRef<Txt>();

  // ─── Compression ───
  const compressionPacket     = createRef<Rect>(); // paquet animé (gros → petit)
  const compressionRatioLabel = createRef<Txt>();  // "−77%"

  // Surcharge finale — multiples clients
  const clientBox2       = createRef<Rect>();
  const clientBox3       = createRef<Rect>();
  const clientBox4       = createRef<Rect>();
  const clientBox5       = createRef<Rect>();
  const arrowClient2Proxy = createRef<Line>();
  const arrowClient3Proxy = createRef<Line>();
  const arrowClient4Proxy = createRef<Line>();
  const arrowClient5Proxy = createRef<Line>();
  const overloadDot2     = createRef<Circle>();
  const overloadDot3     = createRef<Circle>();
  const overloadDot4     = createRef<Circle>();
  const overloadDot5     = createRef<Circle>();
  const overloadGlow     = createRef<Rect>();
  const overloadText     = createRef<Txt>();

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

      {/* ═══ CLIENT ═══════════════════════════════════════════════════════════ */}
      <Rect
        key="client-box"
        ref={clientBox}
        x={() => -vW() * 0.38}
        y={0}
        width={() => vW() * 0.13}
        height={() => vH() * 0.12}
        fill={C.processBg}
        stroke={C.client}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.012}
      >
        <Txt key="client-icon" text="◉" fill={C.client} fontSize={() => vW() * 0.022} fontFamily={'Space Grotesk'} />
        <Txt key="client-label" text="Client" fill={C.cream} fontSize={() => vW() * 0.011} fontWeight={600} fontFamily={'Space Grotesk'} />
      </Rect>

      {/* ═══ PHASE A — SERVEUR EXPOSÉ ════════════════════════════════════════ */}
      <Rect
        key="direct-server-box"
        ref={directServerBox}
        x={() => vW() * 0.38}
        y={0}
        width={() => vW() * 0.18}
        height={() => vH() * 0.14}
        fill={C.processBg}
        stroke={C.danger}
        lineWidth={2}
        radius={() => vW() * 0.006}
        shadowColor={C.danger}
        shadowBlur={() => vW() * 0.014}
        opacity={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.010}
      >
        <Txt key="server-icon" text="▣" fill={C.danger} fontSize={() => vW() * 0.022} fontFamily={'Space Grotesk'} />
        <Txt key="server-ip" text="37.187.42.201:3000" fill={C.danger} fontSize={() => vW() * 0.010} fontWeight={700} fontFamily={'DM Mono, monospace'} />
        <Txt key="server-sublabel" text="ton serveur" fill={C.ghost} fontSize={() => vW() * 0.009} fontFamily={'Space Grotesk'} />
      </Rect>

      <Line
        key="direct-arrow"
        ref={directArrow}
        points={() => [[-vW() * 0.315, 0], [vW() * 0.29, 0]]}
        stroke={C.danger}
        lineWidth={3}
        endArrow
        arrowSize={() => vW() * 0.009}
        opacity={0}
        end={0}
      />
      <Txt
        key="ip-label"
        ref={ipLabel}
        text="http://37.187.42.201:3000"
        fill={C.danger}
        fontSize={() => vW() * 0.011}
        fontWeight={600}
        fontFamily={'DM Mono, monospace'}
        y={() => -vH() * 0.075}
        opacity={0}
      />

      {/* ═══ PHASE B — REVERSE PROXY ═════════════════════════════════════════ */}
      <Rect
        key="proxy-box"
        ref={proxyBox}
        x={0}
        y={0}
        width={() => vW() * 0.22}
        height={() => vH() * 0.38}
        fill={C.processBg}
        stroke={C.proxy}
        lineWidth={2}
        radius={() => vW() * 0.007}
        opacity={0}
        clip
        layout
        direction={'column'}
        alignItems={'center'}
        gap={0}
      >
        {/* En-tête */}
        <Rect
          key="proxy-header"
          width={'100%'}
          height={() => vH() * 0.07}
          fill={C.proxy + '22'}
          layout
          direction={'column'}
          alignItems={'center'}
          justifyContent={'center'}
          gap={() => vH() * 0.006}
        >
          <Txt key="proxy-title" text="REVERSE PROXY" fill={C.proxy} fontSize={() => vW() * 0.012} fontWeight={700} fontFamily={'Space Grotesk'} />
          <Txt key="proxy-domain" text="monapp.fr" fill={C.cream} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} opacity={0.7} />
        </Rect>

        <Rect key="proxy-divider-top" width={'100%'} height={1} fill={C.proxy + '40'} />

        {/* Règles de routage */}
        <Rect
          key="proxy-routes"
          ref={proxyRoutesContainer}
          grow={1}
          width={'100%'}
          layout
          direction={'column'}
          justifyContent={'center'}
          padding={() => vW() * 0.016}
          gap={() => vH() * 0.025}
          opacity={0}
        >
          <Txt key="route-rule-1" ref={routeRule1} text="/      → :3000" fill={C.server} fontSize={() => vW() * 0.010} fontFamily={'DM Mono, monospace'} opacity={0} />
          <Txt key="route-rule-2" ref={routeRule2} text="/api   → :8080" fill={C.internal} fontSize={() => vW() * 0.010} fontFamily={'DM Mono, monospace'} opacity={0} />
        </Rect>

        <Rect key="proxy-divider-bottom" width={'100%'} height={1} fill={C.proxy + '40'} />

        {/* Badges bénéfices — chacun avec ref pour contrôle individuel */}
        <Rect
          key="benefits-row"
          ref={benefitsRow}
          width={'100%'}
          height={() => vH() * 0.09}
          layout
          direction={'row'}
          alignItems={'center'}
          justifyContent={'center'}
          gap={() => vW() * 0.005}
        >
          <Rect key="tls-badge" ref={tlsBadge} fill={'#3FB95018'} stroke={C.internal} lineWidth={1} radius={() => vW() * 0.003} padding={() => vW() * 0.007} opacity={0}>
            <Txt key="tls-txt" text="TLS" fill={C.internal} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} fontWeight={700} />
          </Rect>
          <Rect key="cache-badge" ref={cacheBadge} fill={'#FFE14D18'} stroke={C.proxy} lineWidth={1} radius={() => vW() * 0.003} padding={() => vW() * 0.007} opacity={0}>
            <Txt key="cache-txt" text="CACHE" fill={C.proxy} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} fontWeight={700} />
          </Rect>
          <Rect key="gzip-badge" ref={gzipBadge} fill={'#58A6FF18'} stroke={C.server} lineWidth={1} radius={() => vW() * 0.003} padding={() => vW() * 0.007} opacity={0}>
            <Txt key="gzip-txt" text="GZIP" fill={C.server} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} fontWeight={700} />
          </Rect>
        </Rect>
      </Rect>

      {/* Flèche client → proxy */}
      <Line
        key="arrow-client-proxy"
        ref={arrowClientProxy}
        points={() => [[-vW() * 0.315, 0], [-vW() * 0.11, 0]]}
        stroke={C.client}
        lineWidth={3}
        endArrow
        arrowSize={() => vW() * 0.009}
        opacity={0}
        end={0}
      />

      {/* ═══ FRONTEND ════════════════════════════════════════════════════════ */}
      <Rect
        key="frontend-box"
        ref={frontendBox}
        x={() => vW() * 0.38}
        y={() => -vH() * 0.13}
        width={() => vW() * 0.16}
        height={() => vH() * 0.11}
        fill={C.processBg}
        stroke={C.server}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.010}
      >
        <Txt key="frontend-label" text="Frontend" fill={C.cream} fontSize={() => vW() * 0.011} fontWeight={600} fontFamily={'Space Grotesk'} />
        <Txt key="frontend-port" text="localhost:3000" fill={C.server} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} />
      </Rect>

      <Line
        key="arrow-proxy-frontend"
        ref={arrowProxyFrontend}
        points={() => [[vW() * 0.11, -vH() * 0.05], [vW() * 0.30, -vH() * 0.13]]}
        stroke={C.server}
        lineWidth={2}
        endArrow
        arrowSize={() => vW() * 0.007}
        opacity={0}
        end={0}
      />

      {/* ═══ BACKEND ═════════════════════════════════════════════════════════ */}
      <Rect
        key="backend-box"
        ref={backendBox}
        x={() => vW() * 0.38}
        y={() => vH() * 0.13}
        width={() => vW() * 0.16}
        height={() => vH() * 0.11}
        fill={C.processBg}
        stroke={C.internal}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.010}
      >
        <Txt key="backend-label" text="Backend API" fill={C.cream} fontSize={() => vW() * 0.011} fontWeight={600} fontFamily={'Space Grotesk'} />
        <Txt key="backend-port" text="localhost:8080" fill={C.internal} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} />
      </Rect>

      <Line
        key="arrow-proxy-backend"
        ref={arrowProxyBackend}
        points={() => [[vW() * 0.11, vH() * 0.05], [vW() * 0.30, vH() * 0.13]]}
        stroke={C.internal}
        lineWidth={2}
        endArrow
        arrowSize={() => vW() * 0.007}
        opacity={0}
        end={0}
      />

      {/* ═══ DOT DE REQUÊTE ══════════════════════════════════════════════════ */}
      <Circle
        key="request-dot"
        ref={requestDot}
        width={() => vW() * 0.016}
        height={() => vW() * 0.016}
        fill={C.client}
        shadowColor={C.client}
        shadowBlur={() => vW() * 0.012}
        x={0}
        y={0}
        opacity={0}
        zIndex={5}
      />

      {/* ═══ TLS — labels flottants ══════════════════════════════════════════ */}
      {/* Milieu de la flèche client→proxy : x≈-vW*0.21, y=0 */}
      <Txt
        key="tls-enc-label"
        ref={tlsEncLabel}
        text="🔒  HTTPS"
        fill={C.proxy}
        fontSize={() => vW() * 0.012}
        fontWeight={700}
        fontFamily={'DM Mono, monospace'}
        x={() => -vW() * 0.21}
        y={() => -vH() * 0.055}
        opacity={0}
      />
      {/* Milieu de la flèche proxy→frontend : x≈vW*0.21, y≈-vH*0.09 */}
      <Txt
        key="tls-plain-label"
        ref={tlsPlainLabel}
        text="HTTP (clair)"
        fill={C.ghost}
        fontSize={() => vW() * 0.010}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * 0.21}
        y={() => -vH() * 0.04}
        opacity={0}
      />
      <Txt
        key="tls-term-label"
        ref={tlsTermLabel}
        text="Terminaison TLS"
        fill={C.proxy}
        fontSize={() => vW() * 0.013}
        fontWeight={700}
        fontFamily={'Space Grotesk'}
        x={0}
        y={() => vH() * 0.26}
        opacity={0}
      />

      {/* ═══ CACHE — indicateur + labels ════════════════════════════════════ */}
      <Rect
        key="cache-storage-box"
        ref={cacheStorageBox}
        x={0}
        y={() => vH() * 0.26}
        width={() => vW() * 0.16}
        height={() => vH() * 0.065}
        fill={C.processBg}
        stroke={C.proxy}
        lineWidth={1}
        radius={() => vW() * 0.004}
        opacity={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.006}
      >
        <Txt key="cache-storage-label" text="CACHE" fill={C.proxy} fontSize={() => vW() * 0.010} fontWeight={700} fontFamily={'DM Mono, monospace'} />
        <Txt key="cache-storage-sub" text="vide" fill={C.ghost} fontSize={() => vW() * 0.008} fontFamily={'Space Grotesk'} />
      </Rect>
      <Txt
        key="cache-miss-label"
        ref={cacheMissLabel}
        text="MISS"
        fill={C.danger}
        fontSize={() => vW() * 0.018}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        x={0}
        y={() => -vH() * 0.26}
        opacity={0}
      />
      <Txt
        key="cache-hit-label"
        ref={cacheHitLabel}
        text="HIT ⚡"
        fill={C.internal}
        fontSize={() => vW() * 0.018}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        x={0}
        y={() => -vH() * 0.26}
        opacity={0}
      />

      {/* ═══ COMPRESSION — paquet animé ══════════════════════════════════════ */}
      <Rect
        key="compression-packet"
        ref={compressionPacket}
        x={0}
        y={0}
        width={() => vW() * 0.11}
        height={() => vH() * 0.048}
        fill={C.server + '28'}
        stroke={C.server}
        lineWidth={2}
        radius={() => vW() * 0.004}
        opacity={0}
        layout
        direction={'row'}
        alignItems={'center'}
        justifyContent={'center'}
      >
        <Txt key="packet-size-label" text="80 KB" fill={C.server} fontSize={() => vW() * 0.010} fontWeight={700} fontFamily={'DM Mono, monospace'} />
      </Rect>
      <Txt
        key="compression-ratio-label"
        ref={compressionRatioLabel}
        text="−77%"
        fill={C.internal}
        fontSize={() => vW() * 0.022}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        x={0}
        y={() => -vH() * 0.26}
        opacity={0}
      />

      {/* ═══ SURCHARGE — clients supplémentaires ═══════════════════════════ */}
      {/* Client 2 — au-dessus */}
      <Rect
        key="client-box-2"
        ref={clientBox2}
        x={() => -vW() * 0.38}
        y={() => -vH() * 0.24}
        width={() => vW() * 0.13}
        height={() => vH() * 0.12}
        fill={C.processBg}
        stroke={C.client}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.012}
      >
        <Txt key="c2-icon" text="◉" fill={C.client} fontSize={() => vW() * 0.022} fontFamily={'Space Grotesk'} />
        <Txt key="c2-label" text="Client" fill={C.cream} fontSize={() => vW() * 0.011} fontWeight={600} fontFamily={'Space Grotesk'} />
      </Rect>

      <Rect
        key="client-box-3"
        ref={clientBox3}
        x={() => -vW() * 0.38}
        y={() => -vH() * 0.12}
        width={() => vW() * 0.13}
        height={() => vH() * 0.12}
        fill={C.processBg}
        stroke={C.client}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.012}
      >
        <Txt key="c3-icon" text="◉" fill={C.client} fontSize={() => vW() * 0.022} fontFamily={'Space Grotesk'} />
        <Txt key="c3-label" text="Client" fill={C.cream} fontSize={() => vW() * 0.011} fontWeight={600} fontFamily={'Space Grotesk'} />
      </Rect>

      <Rect
        key="client-box-4"
        ref={clientBox4}
        x={() => -vW() * 0.38}
        y={() => vH() * 0.12}
        width={() => vW() * 0.13}
        height={() => vH() * 0.12}
        fill={C.processBg}
        stroke={C.client}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.012}
      >
        <Txt key="c4-icon" text="◉" fill={C.client} fontSize={() => vW() * 0.022} fontFamily={'Space Grotesk'} />
        <Txt key="c4-label" text="Client" fill={C.cream} fontSize={() => vW() * 0.011} fontWeight={600} fontFamily={'Space Grotesk'} />
      </Rect>

      <Rect
        key="client-box-5"
        ref={clientBox5}
        x={() => -vW() * 0.38}
        y={() => vH() * 0.24}
        width={() => vW() * 0.13}
        height={() => vH() * 0.12}
        fill={C.processBg}
        stroke={C.client}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.012}
      >
        <Txt key="c5-icon" text="◉" fill={C.client} fontSize={() => vW() * 0.022} fontFamily={'Space Grotesk'} />
        <Txt key="c5-label" text="Client" fill={C.cream} fontSize={() => vW() * 0.011} fontWeight={600} fontFamily={'Space Grotesk'} />
      </Rect>

      {/* Flèches : nouveaux clients → proxy */}
      <Line key="arrow-client2-proxy" ref={arrowClient2Proxy}
        points={() => [[-vW() * 0.315, -vH() * 0.24], [-vW() * 0.11, 0]]}
        stroke={C.client} lineWidth={2} endArrow arrowSize={() => vW() * 0.007} opacity={0} end={0} />
      <Line key="arrow-client3-proxy" ref={arrowClient3Proxy}
        points={() => [[-vW() * 0.315, -vH() * 0.12], [-vW() * 0.11, 0]]}
        stroke={C.client} lineWidth={2} endArrow arrowSize={() => vW() * 0.007} opacity={0} end={0} />
      <Line key="arrow-client4-proxy" ref={arrowClient4Proxy}
        points={() => [[-vW() * 0.315, vH() * 0.12], [-vW() * 0.11, 0]]}
        stroke={C.client} lineWidth={2} endArrow arrowSize={() => vW() * 0.007} opacity={0} end={0} />
      <Line key="arrow-client5-proxy" ref={arrowClient5Proxy}
        points={() => [[-vW() * 0.315, vH() * 0.24], [-vW() * 0.11, 0]]}
        stroke={C.client} lineWidth={2} endArrow arrowSize={() => vW() * 0.007} opacity={0} end={0} />

      {/* Dots surcharge — initialisés hors-écran pour éviter le calcul de shadow au premier rendu */}
      <Circle key="overload-dot-2" ref={overloadDot2} width={() => vW() * 0.014} height={() => vW() * 0.014}
        fill={C.client} x={-9999} y={0} opacity={0} zIndex={5} />
      <Circle key="overload-dot-3" ref={overloadDot3} width={() => vW() * 0.014} height={() => vW() * 0.014}
        fill={C.client} x={-9999} y={0} opacity={0} zIndex={5} />
      <Circle key="overload-dot-4" ref={overloadDot4} width={() => vW() * 0.014} height={() => vW() * 0.014}
        fill={C.client} x={-9999} y={0} opacity={0} zIndex={5} />
      <Circle key="overload-dot-5" ref={overloadDot5} width={() => vW() * 0.014} height={() => vW() * 0.014}
        fill={C.client} x={-9999} y={0} opacity={0} zIndex={5} />

      {/* ═══ SURCHARGE ═══════════════════════════════════════════════════════ */}
      <Rect
        key="overload-glow"
        ref={overloadGlow}
        x={() => vW() * 0.38}
        y={() => -vH() * 0.13}
        width={() => vW() * 0.16}
        height={() => vH() * 0.11}
        fill={'#FF3E6C28'}
        stroke={C.danger}
        lineWidth={3}
        radius={() => vW() * 0.006}
        shadowColor={C.danger}
        shadowBlur={() => vW() * 0.018}
        opacity={0}
      />
      <Txt
        key="overload-text"
        ref={overloadText}
        text="Serveur saturé !"
        fill={C.danger}
        fontSize={() => vW() * 0.016}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        x={() => vW() * 0.38}
        y={() => -vH() * 0.27}
        opacity={0}
      />
    </Layout>,
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ══════════════════════════════════════════════════════════════════════════

  // ─── Intro ────────────────────────────────────────────────────────────────
  yield* waitUntil('intro');

  yield* gridRef().opacity(0.12, 1);
  yield* clientBox().opacity(1, 0.5);

  // ─── Phase A : IP exposée ─────────────────────────────────────────────────
  yield* waitUntil('directIP');

  yield* directServerBox().opacity(1, 0.5);
  yield* all(
    directArrow().opacity(1, 0.3),
    directArrow().end(1, 0.5),
  );
  yield* ipLabel().opacity(1, 0.5);

  yield* waitFor(1.5);

  // ─── Phase B : Reverse Proxy ──────────────────────────────────────────────
  yield* waitUntil('addProxy');

  yield* all(
    directArrow().opacity(0, 0.4),
    ipLabel().opacity(0, 0.3),
    directServerBox().opacity(0, 0.4),
  );

  yield* proxyBox().opacity(1, 0.6);
  yield* all(
    arrowClientProxy().opacity(1, 0.3),
    arrowClientProxy().end(1, 0.5),
    frontendBox().opacity(1, 0.5),
  );
  yield* all(
    arrowProxyFrontend().opacity(1, 0.3),
    arrowProxyFrontend().end(1, 0.5),
  );

  yield* waitFor(0.5);

  // ─── Phase B2 : Animation du paquet ──────────────────────────────────────
  yield* waitUntil('requestFlow');

  requestDot().fill(C.client);
  requestDot().shadowColor(C.client);
  requestDot().x(-vW() * 0.38);
  requestDot().y(0);
  requestDot().opacity(1);
  yield* all(
    requestDot().x(-vW() * 0.01, 0.45, easeInOutCubic),
    requestDot().y(0, 0.45, easeInOutCubic),
  );
  yield* waitFor(0.15);
  requestDot().fill(C.server);
  requestDot().shadowColor(C.server);
  yield* all(
    requestDot().x(vW() * 0.38, 0.4, easeInOutCubic),
    requestDot().y(-vH() * 0.13, 0.4, easeInOutCubic),
  );
  yield* requestDot().opacity(0, 0.15);

  yield* waitFor(0.3);

  // ─── Phase C : Routage par path ───────────────────────────────────────────
  yield* waitUntil('pathRouting');

  yield* all(
    backendBox().opacity(1, 0.5),
    arrowProxyBackend().opacity(1, 0.3),
    arrowProxyBackend().end(1, 0.5),
  );
  yield* proxyRoutesContainer().opacity(1, 0.5);
  yield* routeRule1().opacity(1, 0.4);
  yield* routeRule2().opacity(1, 0.4);

  yield* waitFor(0.5);

  // Démo : requête /api → backend
  requestDot().fill(C.internal);
  requestDot().shadowColor(C.internal);
  requestDot().x(-vW() * 0.38);
  requestDot().y(0);
  requestDot().opacity(1);
  yield* all(
    requestDot().x(-vW() * 0.01, 0.45, easeInOutCubic),
    requestDot().y(0, 0.45, easeInOutCubic),
  );
  yield* waitFor(0.1);
  yield* all(
    requestDot().x(vW() * 0.38, 0.4, easeInOutCubic),
    requestDot().y(vH() * 0.13, 0.4, easeInOutCubic),
  );
  yield* requestDot().opacity(0, 0.15);

  yield* waitFor(0.5);

  // ══════════════════════════════════════════════════════════════════════════
  // ─── Bénéfice 1 : TLS ─────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  yield* waitUntil('tls');

  // Badge TLS apparaît dans le proxy
  yield* tlsBadge().opacity(1, 0.4);

  // La flèche client→proxy devient un tunnel TLS (jaune + glow)
  arrowClientProxy().shadowColor(C.proxy);
  yield* all(
    arrowClientProxy().stroke(C.proxy, 0.4),
    arrowClientProxy().shadowBlur(vW() * 0.010, 0.4),
    arrowClientProxy().lineWidth(4, 0.3),
  );
  yield* tlsEncLabel().opacity(1, 0.4);

  yield* waitFor(0.3);

  // Flèche proxy→frontend reste en clair (HTTP interne)
  yield* tlsPlainLabel().opacity(1, 0.4);

  yield* waitFor(0.5);

  // Label "Terminaison TLS" sous le proxy
  yield* tlsTermLabel().opacity(1, 0.5);

  yield* waitFor(2);

  // Nettoyage TLS
  yield* all(
    tlsEncLabel().opacity(0, 0.3),
    tlsPlainLabel().opacity(0, 0.3),
    tlsTermLabel().opacity(0, 0.3),
    arrowClientProxy().stroke(C.client, 0.4),
    arrowClientProxy().shadowBlur(0, 0.4),
    arrowClientProxy().lineWidth(3, 0.3),
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ─── Bénéfice 2 : Cache ───────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  yield* waitUntil('cache');

  yield* cacheBadge().opacity(1, 0.4);

  // Indicateur cache vide apparaît
  yield* cacheStorageBox().opacity(1, 0.5);

  yield* waitFor(0.3);

  // — Requête 1 : MISS → va jusqu'au serveur —
  requestDot().fill(C.client);
  requestDot().shadowColor(C.client);
  requestDot().x(-vW() * 0.38);
  requestDot().y(0);
  requestDot().opacity(1);
  yield* all(
    requestDot().x(-vW() * 0.01, 0.45, easeInOutCubic),
    requestDot().y(0, 0.45, easeInOutCubic),
  );
  // Proxy check: MISS
  yield* cacheMissLabel().opacity(1, 0.2);
  yield* waitFor(0.25);
  // Transmet au frontend
  yield* all(
    requestDot().x(vW() * 0.38, 0.4, easeInOutCubic),
    requestDot().y(-vH() * 0.13, 0.4, easeInOutCubic),
    cacheMissLabel().opacity(0, 0.4),
  );
  yield* requestDot().opacity(0, 0.15);

  yield* waitFor(0.2);

  // Cache se remplit (couleur + glow)
  cacheStorageBox().shadowColor(C.proxy);
  yield* all(
    cacheStorageBox().fill(C.proxy + '28', 0.5),
    cacheStorageBox().stroke(C.proxy, 0.3),
    cacheStorageBox().shadowBlur(vW() * 0.008, 0.4),
  );

  yield* waitFor(0.3);

  // — Requête 2 : HIT → bounce-back depuis le proxy —
  requestDot().fill(C.proxy);
  requestDot().shadowColor(C.proxy);
  requestDot().x(-vW() * 0.38);
  requestDot().y(0);
  requestDot().opacity(1);
  yield* requestDot().x(-vW() * 0.01, 0.45, easeInOutCubic);
  // Proxy check: HIT
  yield* all(
    cacheStorageBox().shadowBlur(vW() * 0.018, 0.2),
    cacheHitLabel().opacity(1, 0.25),
  );
  yield* cacheStorageBox().shadowBlur(vW() * 0.008, 0.3);
  yield* waitFor(0.2);
  // Retour direct au client, pas de serveur sollicité
  yield* requestDot().x(-vW() * 0.38, 0.4, easeInOutCubic);
  yield* requestDot().opacity(0, 0.15);

  yield* waitFor(1);

  // Nettoyage cache
  yield* all(
    cacheHitLabel().opacity(0, 0.3),
    cacheStorageBox().opacity(0, 0.3),
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ─── Bénéfice 3 : Compression ─────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  yield* waitUntil('compression');

  yield* gzipBadge().opacity(1, 0.4);

  yield* waitFor(0.3);

  // Gros paquet : serveur → proxy (de droite vers le centre)
  compressionPacket().x(vW() * 0.28);
  compressionPacket().y(-vH() * 0.13);
  compressionPacket().width(vW() * 0.11);
  compressionPacket().fill(C.server + '28');
  compressionPacket().stroke(C.server);
  compressionPacket().opacity(1);

  yield* all(
    compressionPacket().x(-vW() * 0.01, 0.55, easeInOutCubic),
    compressionPacket().y(0, 0.55, easeInOutCubic),
  );

  // Au proxy : compression (réduction de largeur + changement couleur)
  yield* all(
    compressionPacket().width(vW() * 0.038, 0.4, easeOutCubic),
    compressionPacket().fill(C.internal + '28', 0.4),
    compressionPacket().stroke(C.internal, 0.4),
  );
  yield* compressionRatioLabel().opacity(1, 0.3);

  yield* waitFor(0.3);

  // Petit paquet : proxy → client (de gauche vers le client)
  yield* all(
    compressionPacket().x(-vW() * 0.35, 0.5, easeInOutCubic),
    compressionPacket().y(0, 0.5, easeInOutCubic),
  );
  yield* compressionPacket().opacity(0, 0.2);

  yield* waitFor(1.5);

  // Nettoyage compression
  yield* compressionRatioLabel().opacity(0, 0.3);

  // ─── Phase F : Surcharge — vague de clients ───────────────────────────────
  yield* waitUntil('overload');

  // 1. Les nouveaux clients apparaissent en cascade rapide
  yield* sequence(0.08,
    clientBox2().opacity(1, 0.25),
    clientBox3().opacity(1, 0.25),
    clientBox4().opacity(1, 0.25),
    clientBox5().opacity(1, 0.25),
  );

  yield* waitFor(0.2);

  // 2. Flèches des nouveaux clients → proxy (toutes simultanées)
  yield* all(
    arrowClient2Proxy().opacity(1, 0.2),
    arrowClient2Proxy().end(1, 0.4),
    arrowClient3Proxy().opacity(1, 0.2),
    arrowClient3Proxy().end(1, 0.4),
    arrowClient4Proxy().opacity(1, 0.2),
    arrowClient4Proxy().end(1, 0.4),
    arrowClient5Proxy().opacity(1, 0.2),
    arrowClient5Proxy().end(1, 0.4),
  );

  yield* waitFor(0.25);

  // 3. Salve simultanée : tous les dots partent vers le proxy
  requestDot().fill(C.client);
  requestDot().shadowColor(C.client);
  requestDot().x(-vW() * 0.38);
  requestDot().y(0);
  requestDot().opacity(1);

  overloadDot2().x(-vW() * 0.38);
  overloadDot2().y(-vH() * 0.24);
  overloadDot2().opacity(1);

  overloadDot3().x(-vW() * 0.38);
  overloadDot3().y(-vH() * 0.12);
  overloadDot3().opacity(1);

  overloadDot4().x(-vW() * 0.38);
  overloadDot4().y(vH() * 0.12);
  overloadDot4().opacity(1);

  overloadDot5().x(-vW() * 0.38);
  overloadDot5().y(vH() * 0.24);
  overloadDot5().opacity(1);

  yield* all(
    requestDot().x(-vW() * 0.01, 0.4, easeInOutCubic),
    overloadDot2().x(-vW() * 0.01, 0.4, easeInOutCubic),
    overloadDot2().y(0, 0.4, easeInOutCubic),
    overloadDot3().x(-vW() * 0.01, 0.4, easeInOutCubic),
    overloadDot3().y(0, 0.4, easeInOutCubic),
    overloadDot4().x(-vW() * 0.01, 0.4, easeInOutCubic),
    overloadDot4().y(0, 0.4, easeInOutCubic),
    overloadDot5().x(-vW() * 0.01, 0.4, easeInOutCubic),
    overloadDot5().y(0, 0.4, easeInOutCubic),
  );

  // 4. Du proxy vers le frontend (tous en même temps)
  yield* all(
    requestDot().x(vW() * 0.30, 0.3, easeInOutCubic),
    requestDot().y(-vH() * 0.13, 0.3, easeInOutCubic),
    overloadDot2().x(vW() * 0.30, 0.3, easeInOutCubic),
    overloadDot2().y(-vH() * 0.13, 0.3, easeInOutCubic),
    overloadDot3().x(vW() * 0.30, 0.3, easeInOutCubic),
    overloadDot3().y(-vH() * 0.13, 0.3, easeInOutCubic),
    overloadDot4().x(vW() * 0.30, 0.3, easeInOutCubic),
    overloadDot4().y(-vH() * 0.13, 0.3, easeInOutCubic),
    overloadDot5().x(vW() * 0.30, 0.3, easeInOutCubic),
    overloadDot5().y(-vH() * 0.13, 0.3, easeInOutCubic),
  );

  yield* all(
    requestDot().opacity(0, 0.2),
    overloadDot2().opacity(0, 0.2),
    overloadDot3().opacity(0, 0.2),
    overloadDot4().opacity(0, 0.2),
    overloadDot5().opacity(0, 0.2),
  );

  // 5. Serveur surchargé
  yield* all(
    overloadGlow().opacity(1, 0.5),
    frontendBox().stroke(C.danger, 0.5),
    frontendBox().lineWidth(3, 0.4),
  );
  yield* overloadText().opacity(1, 0.5);

  yield* waitFor(1.5);

  // ─── Fin de scène ─────────────────────────────────────────────────────────
  yield* waitUntil('endScene');

  yield* all(
    gridRef().opacity(0, 0.5),
    clientBox().opacity(0, 0.5),
    clientBox2().opacity(0, 0.5),
    clientBox3().opacity(0, 0.5),
    clientBox4().opacity(0, 0.5),
    clientBox5().opacity(0, 0.5),
    proxyBox().opacity(0, 0.5),
    frontendBox().opacity(0, 0.5),
    backendBox().opacity(0, 0.5),
    arrowClientProxy().opacity(0, 0.5),
    arrowClient2Proxy().opacity(0, 0.5),
    arrowClient3Proxy().opacity(0, 0.5),
    arrowClient4Proxy().opacity(0, 0.5),
    arrowClient5Proxy().opacity(0, 0.5),
    arrowProxyFrontend().opacity(0, 0.5),
    arrowProxyBackend().opacity(0, 0.5),
    overloadGlow().opacity(0, 0.5),
    overloadText().opacity(0, 0.5),
  );
});
