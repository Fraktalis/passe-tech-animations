import {makeScene2D} from '@motion-canvas/2d';
import {Circle, Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {
  all,
  createRef,
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
    layerDim:    '#161B22',
    layerBorder: '#30363D',
    processBg:   '#1C2128',
    transport:   '#FFE14D',  // L4
    application: '#6DFF8A',  // L7
    ok:          '#3FB950',
    danger:      '#FF3E6C',
  };

  // ── Refs ────────────────────────────────────────────────────────────────────
  const gridRef        = createRef<Grid>();
  const pyramidWrapper = createRef<Layout>();
  const osiTitle       = createRef<Txt>();

  // Pyramid layers (index 0 = L1 bottom, index 6 = L7 top)
  const layer1 = createRef<Rect>();
  const layer2 = createRef<Rect>();
  const layer3 = createRef<Rect>();
  const layer4 = createRef<Rect>();
  const layer5 = createRef<Rect>();
  const layer6 = createRef<Rect>();
  const layer7 = createRef<Rect>();

  // L4 LB box
  const l4Box        = createRef<Rect>();
  const l4TcpBadge   = createRef<Rect>();
  const l4UdpBadge   = createRef<Rect>();
  const l4SpeedLabel = createRef<Txt>();
  const l4UsageLabel = createRef<Txt>();

  // L7 LB box
  const l7Box         = createRef<Rect>();
  const l7HttpBadge   = createRef<Rect>();
  const l7PathBadge   = createRef<Rect>();
  const l7HeadBadge   = createRef<Rect>();
  const l7RouteLabel  = createRef<Txt>();
  const l7PowerLabel  = createRef<Txt>();

  // Comparison
  const l4CompareLabel = createRef<Txt>();
  const l7CompareLabel = createRef<Txt>();

  // Dot
  const requestDot = createRef<Circle>();

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

      {/* ═══ TITRE ════════════════════════════════════════════════════════════ */}
      <Txt
        key="osi-title"
        ref={osiTitle}
        text="MODÈLE OSI — 7 COUCHES"
        fill={C.ghost}
        fontSize={() => vW() * 0.013}
        fontWeight={700}
        fontFamily={'Space Grotesk'}
        letterSpacing={2}
        x={0}
        y={() => -vH() * 0.38}
        opacity={0}
      />

      {/* ═══ PYRAMIDE OSI ════════════════════════════════════════════════════ */}
      <Layout key="pyramid-wrapper" ref={pyramidWrapper} x={0} y={0}>

        {/* L1 — Physical (bas, plus large) */}
        <Rect
          key="layer-1-box"
          ref={layer1}
          x={0}
          y={() => vH() * 0.21}
          width={() => vW() * 0.50}
          height={() => vH() * 0.062}
          fill={C.layerDim}
          stroke={C.layerBorder}
          lineWidth={1}
          radius={() => vW() * 0.003}
          opacity={0}
          layout direction={'row'} alignItems={'center'} justifyContent={'space-between'}
          paddingLeft={() => vW() * 0.016} paddingRight={() => vW() * 0.016}
        >
          <Txt key="l1-num"    text="L1" fill={C.ghost} fontSize={() => vW() * 0.013} fontWeight={700} fontFamily={'DM Mono, monospace'} />
          <Txt key="l1-name"   text="Physical" fill={C.ghost} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />
          <Txt key="l1-detail" text="bits · câbles" fill={C.ghost + '66'} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
        </Rect>

        {/* L2 — Data Link */}
        <Rect
          key="layer-2-box"
          ref={layer2}
          x={0}
          y={() => vH() * 0.14}
          width={() => vW() * 0.44}
          height={() => vH() * 0.062}
          fill={C.layerDim}
          stroke={C.layerBorder}
          lineWidth={1}
          radius={() => vW() * 0.003}
          opacity={0}
          layout direction={'row'} alignItems={'center'} justifyContent={'space-between'}
          paddingLeft={() => vW() * 0.014} paddingRight={() => vW() * 0.014}
        >
          <Txt key="l2-num"    text="L2" fill={C.ghost} fontSize={() => vW() * 0.013} fontWeight={700} fontFamily={'DM Mono, monospace'} />
          <Txt key="l2-name"   text="Data Link" fill={C.ghost} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />
          <Txt key="l2-detail" text="MAC · Ethernet" fill={C.ghost + '66'} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
        </Rect>

        {/* L3 — Network */}
        <Rect
          key="layer-3-box"
          ref={layer3}
          x={0}
          y={() => vH() * 0.07}
          width={() => vW() * 0.38}
          height={() => vH() * 0.062}
          fill={C.layerDim}
          stroke={C.layerBorder}
          lineWidth={1}
          radius={() => vW() * 0.003}
          opacity={0}
          layout direction={'row'} alignItems={'center'} justifyContent={'space-between'}
          paddingLeft={() => vW() * 0.012} paddingRight={() => vW() * 0.012}
        >
          <Txt key="l3-num"    text="L3" fill={C.ghost} fontSize={() => vW() * 0.013} fontWeight={700} fontFamily={'DM Mono, monospace'} />
          <Txt key="l3-name"   text="Network" fill={C.ghost} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />
          <Txt key="l3-detail" text="IP" fill={C.ghost + '66'} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
        </Rect>

        {/* L4 — Transport (focus LB) */}
        <Rect
          key="layer-4-box"
          ref={layer4}
          x={0}
          y={0}
          width={() => vW() * 0.32}
          height={() => vH() * 0.062}
          fill={C.layerDim}
          stroke={C.transport + '55'}
          lineWidth={2}
          radius={() => vW() * 0.003}
          opacity={0}
          layout direction={'row'} alignItems={'center'} justifyContent={'space-between'}
          paddingLeft={() => vW() * 0.010} paddingRight={() => vW() * 0.010}
        >
          <Txt key="l4-num"    text="L4" fill={C.transport + '99'} fontSize={() => vW() * 0.013} fontWeight={700} fontFamily={'DM Mono, monospace'} />
          <Txt key="l4-name"   text="Transport" fill={C.cream + 'BB'} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />
          <Txt key="l4-detail" text="TCP · UDP" fill={C.transport + '77'} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
        </Rect>

        {/* L5 — Session */}
        <Rect
          key="layer-5-box"
          ref={layer5}
          x={0}
          y={() => -vH() * 0.07}
          width={() => vW() * 0.26}
          height={() => vH() * 0.062}
          fill={C.layerDim}
          stroke={C.layerBorder}
          lineWidth={1}
          radius={() => vW() * 0.003}
          opacity={0}
          layout direction={'row'} alignItems={'center'} justifyContent={'space-between'}
          paddingLeft={() => vW() * 0.009} paddingRight={() => vW() * 0.009}
        >
          <Txt key="l5-num"    text="L5" fill={C.ghost} fontSize={() => vW() * 0.012} fontWeight={700} fontFamily={'DM Mono, monospace'} />
          <Txt key="l5-name"   text="Session" fill={C.ghost} fontSize={() => vW() * 0.009} fontWeight={600} fontFamily={'Space Grotesk'} />
          <Txt key="l5-detail" text="sessions" fill={C.ghost + '66'} fontSize={() => vW() * 0.007} fontFamily={'DM Mono, monospace'} />
        </Rect>

        {/* L6 — Presentation */}
        <Rect
          key="layer-6-box"
          ref={layer6}
          x={0}
          y={() => -vH() * 0.14}
          width={() => vW() * 0.20}
          height={() => vH() * 0.062}
          fill={C.layerDim}
          stroke={C.layerBorder}
          lineWidth={1}
          radius={() => vW() * 0.003}
          opacity={0}
          layout direction={'row'} alignItems={'center'} justifyContent={'space-between'}
          paddingLeft={() => vW() * 0.008} paddingRight={() => vW() * 0.008}
        >
          <Txt key="l6-num"  text="L6" fill={C.ghost} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'DM Mono, monospace'} />
          <Txt key="l6-name" text="Présentation" fill={C.ghost} fontSize={() => vW() * 0.008} fontWeight={600} fontFamily={'Space Grotesk'} />
        </Rect>

        {/* L7 — Application (haut, focus LB) */}
        <Rect
          key="layer-7-box"
          ref={layer7}
          x={0}
          y={() => -vH() * 0.21}
          width={() => vW() * 0.14}
          height={() => vH() * 0.062}
          fill={C.layerDim}
          stroke={C.application + '55'}
          lineWidth={2}
          radius={() => vW() * 0.003}
          opacity={0}
          layout direction={'column'} alignItems={'center'} justifyContent={'center'}
          gap={() => vH() * 0.004}
        >
          <Txt key="l7-num"  text="L7" fill={C.application + '99'} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'DM Mono, monospace'} />
          <Txt key="l7-name" text="Application" fill={C.cream + 'BB'} fontSize={() => vW() * 0.007} fontWeight={600} fontFamily={'Space Grotesk'} />
        </Rect>
      </Layout>

      {/* ═══ L4 LB BOX (droite, haut) ════════════════════════════════════════ */}
      <Rect
        key="l4-box"
        ref={l4Box}
        x={() => vW() * 0.27}
        y={() => -vH() * 0.165}
        width={() => vW() * 0.30}
        height={() => vH() * 0.21}
        fill={C.processBg}
        stroke={C.transport}
        lineWidth={2}
        radius={() => vW() * 0.007}
        opacity={0}
        clip
        layout direction={'column'} alignItems={'center'} gap={0}
      >
        <Rect
          key="l4-header"
          width={'100%'}
          height={() => vH() * 0.065}
          fill={C.transport + '22'}
          layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.005}
        >
          <Txt key="l4-title"    text="L4  ·  LOAD BALANCER" fill={C.transport} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'Space Grotesk'} />
          <Txt key="l4-subtitle" text="couche Transport — routage pur" fill={C.ghost} fontSize={() => vW() * 0.008} fontFamily={'Space Grotesk'} />
        </Rect>
        <Rect key="l4-divider" width={'100%'} height={1} fill={C.transport + '40'} />
        <Rect
          key="l4-body"
          grow={1} width={'100%'}
          layout direction={'column'} alignItems={'center'} justifyContent={'center'}
          gap={() => vH() * 0.015}
          padding={() => vW() * 0.013}
        >
          <Rect key="l4-badges-row" width={'100%'} layout direction={'row'} alignItems={'center'} justifyContent={'center'} gap={() => vW() * 0.010}>
            <Rect key="tcp-badge" ref={l4TcpBadge}
              fill={C.transport + '18'} stroke={C.transport} lineWidth={1}
              radius={() => vW() * 0.003} padding={() => vW() * 0.010} opacity={0}
              layout justifyContent={'center'}
            >
              <Txt key="tcp-txt" text="TCP" fill={C.transport} fontSize={() => vW() * 0.010} fontFamily={'DM Mono, monospace'} fontWeight={700} />
            </Rect>
            <Rect key="udp-badge" ref={l4UdpBadge}
              fill={C.transport + '18'} stroke={C.transport} lineWidth={1}
              radius={() => vW() * 0.003} padding={() => vW() * 0.010} opacity={0}
              layout justifyContent={'center'}
            >
              <Txt key="udp-txt" text="UDP" fill={C.transport} fontSize={() => vW() * 0.010} fontFamily={'DM Mono, monospace'} fontWeight={700} />
            </Rect>
          </Rect>
          <Txt key="l4-blind-txt" text="ne lit pas le contenu" fill={C.ghost} fontSize={() => vW() * 0.009} fontFamily={'Space Grotesk'} />
          <Txt key="l4-speed-label" ref={l4SpeedLabel}
            text="vitesse maximale — overhead minimal"
            fill={C.transport} fontSize={() => vW() * 0.010} fontWeight={700} fontFamily={'Space Grotesk'}
            opacity={0} />
          <Txt key="l4-usage-label" ref={l4UsageLabel}
            text="gaming · streaming · DNS · UDP brut"
            fill={C.ghost} fontSize={() => vW() * 0.009} fontFamily={'Space Grotesk'}
            opacity={0} />
        </Rect>
      </Rect>

      {/* ═══ L7 LB BOX (droite, bas) ════════════════════════════════════════ */}
      <Rect
        key="l7-box"
        ref={l7Box}
        x={() => vW() * 0.27}
        y={() => vH() * 0.165}
        width={() => vW() * 0.30}
        height={() => vH() * 0.21}
        fill={C.processBg}
        stroke={C.application}
        lineWidth={2}
        radius={() => vW() * 0.007}
        opacity={0}
        clip
        layout direction={'column'} alignItems={'center'} gap={0}
      >
        <Rect
          key="l7-header"
          width={'100%'}
          height={() => vH() * 0.065}
          fill={C.application + '22'}
          layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.005}
        >
          <Txt key="l7-title"    text="L7  ·  LOAD BALANCER" fill={C.application} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'Space Grotesk'} />
          <Txt key="l7-subtitle" text="couche Application — routing intelligent" fill={C.ghost} fontSize={() => vW() * 0.008} fontFamily={'Space Grotesk'} />
        </Rect>
        <Rect key="l7-divider" width={'100%'} height={1} fill={C.application + '40'} />
        <Rect
          key="l7-body"
          grow={1} width={'100%'}
          layout direction={'column'} alignItems={'center'} justifyContent={'center'}
          gap={() => vH() * 0.013}
          padding={() => vW() * 0.013}
        >
          <Rect key="l7-badges-row" width={'100%'} layout direction={'row'} alignItems={'center'} justifyContent={'center'} gap={() => vW() * 0.008}>
            <Rect key="http-badge" ref={l7HttpBadge}
              fill={C.application + '18'} stroke={C.application} lineWidth={1}
              radius={() => vW() * 0.003} padding={() => vW() * 0.009} opacity={0}
              layout justifyContent={'center'}
            >
              <Txt key="http-txt" text="HTTP" fill={C.application} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} fontWeight={700} />
            </Rect>
            <Rect key="path-badge" ref={l7PathBadge}
              fill={C.application + '18'} stroke={C.application} lineWidth={1}
              radius={() => vW() * 0.003} padding={() => vW() * 0.009} opacity={0}
              layout justifyContent={'center'}
            >
              <Txt key="path-txt" text="/path" fill={C.application} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} fontWeight={700} />
            </Rect>
            <Rect key="head-badge" ref={l7HeadBadge}
              fill={C.application + '18'} stroke={C.application} lineWidth={1}
              radius={() => vW() * 0.003} padding={() => vW() * 0.009} opacity={0}
              layout justifyContent={'center'}
            >
              <Txt key="head-txt" text="headers" fill={C.application} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} fontWeight={700} />
            </Rect>
          </Rect>
          <Txt key="l7-route-label" ref={l7RouteLabel}
            text="/api → cluster A  ·  /static → cluster B"
            fill={C.application} fontSize={() => vW() * 0.009} fontWeight={600} fontFamily={'DM Mono, monospace'}
            opacity={0} />
          <Txt key="l7-power-label" ref={l7PowerLabel}
            text="comprend ce qu'il transporte"
            fill={C.ghost} fontSize={() => vW() * 0.009} fontFamily={'Space Grotesk'}
            opacity={0} />
        </Rect>
      </Rect>

      {/* ═══ COMPARE LABELS ══════════════════════════════════════════════════ */}
      <Txt key="l4-compare-label" ref={l4CompareLabel}
        text="rapide · simple · distribution brute"
        fill={C.transport} fontSize={() => vW() * 0.011} fontWeight={600} fontFamily={'Space Grotesk'}
        x={() => vW() * 0.27} y={() => -vH() * 0.295} opacity={0} />
      <Txt key="l7-compare-label" ref={l7CompareLabel}
        text="puissant · plus lourd · routing par contenu"
        fill={C.application} fontSize={() => vW() * 0.011} fontWeight={600} fontFamily={'Space Grotesk'}
        x={() => vW() * 0.27} y={() => vH() * 0.295} opacity={0} />

      {/* ═══ DOT PRINCIPAL ═══════════════════════════════════════════════════ */}
      <Circle key="request-dot" ref={requestDot}
        width={() => vW() * 0.016} height={() => vW() * 0.016}
        fill={C.transport} shadowColor={C.transport} shadowBlur={() => vW() * 0.012}
        x={0} y={0} opacity={0} zIndex={5} />
    </Layout>,
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ══════════════════════════════════════════════════════════════════════════

  // ─── Intro ────────────────────────────────────────────────────────────────
  yield* waitUntil('intro');

  yield* gridRef().opacity(0.12, 1);
  yield* osiTitle().opacity(1, 0.5);

  // ─── Pyramide OSI — construction couche par couche ────────────────────────
  yield* waitUntil('osiPyramid');

  // L1 en premier (bas), puis on monte vers L7
  yield* sequence(0.13,
    layer1().opacity(1, 0.4),
    layer2().opacity(1, 0.4),
    layer3().opacity(1, 0.4),
    layer4().opacity(1, 0.4),
    layer5().opacity(1, 0.4),
    layer6().opacity(1, 0.4),
    layer7().opacity(1, 0.4),
  );

  yield* waitFor(1.5);

  // ─── Pyramide se réduit, se décale à gauche ───────────────────────────────
  yield* waitUntil('pyramidShrinks');

  yield* all(
    osiTitle().x(-vW() * 0.26, 0.65, easeInOutCubic),
    pyramidWrapper().x(-vW() * 0.26, 0.65, easeInOutCubic),
    pyramidWrapper().scale(0.62, 0.65, easeInOutCubic),
    osiTitle().opacity(0, 0.45),
  );

  yield* waitFor(0.3);

  // ─── L4 — couche Transport ────────────────────────────────────────────────
  yield* waitUntil('l4Focus');

  // L4 s'allume dans la pyramide
  layer4().shadowColor(C.transport);
  yield* all(
    layer4().fill(C.transport + '20', 0.4),
    layer4().stroke(C.transport, 0.4),
    layer4().shadowBlur(vW() * 0.018, 0.4),
  );

  yield* l4Box().opacity(1, 0.55);
  yield* sequence(0.13,
    l4TcpBadge().opacity(1, 0.35),
    l4UdpBadge().opacity(1, 0.35),
  );

  yield* waitFor(0.5);

  // ─── L4 Demo — dot ultra-rapide (pas d'inspection) ────────────────────────
  yield* waitUntil('l4Demo');

  requestDot().fill(C.transport);
  requestDot().shadowColor(C.transport);
  requestDot().x(-vW() * 0.49);
  requestDot().y(-vH() * 0.165);
  requestDot().opacity(1);
  // Traversée rapide sans pause = routage pur
  yield* requestDot().x(vW() * 0.49, 0.20);
  yield* requestDot().opacity(0, 0.08);

  yield* l4SpeedLabel().opacity(1, 0.4);
  yield* l4UsageLabel().opacity(1, 0.4);

  yield* waitFor(1.5);

  // ─── L7 — couche Application ──────────────────────────────────────────────
  yield* waitUntil('l7Focus');

  // L4 revient en état dim
  yield* all(
    layer4().fill(C.layerDim, 0.35),
    layer4().stroke(C.transport + '55', 0.35),
    layer4().shadowBlur(0, 0.35),
  );

  // L7 s'allume
  layer7().shadowColor(C.application);
  yield* all(
    layer7().fill(C.application + '20', 0.4),
    layer7().stroke(C.application, 0.4),
    layer7().shadowBlur(vW() * 0.018, 0.4),
  );

  yield* l7Box().opacity(1, 0.55);
  yield* sequence(0.13,
    l7HttpBadge().opacity(1, 0.35),
    l7PathBadge().opacity(1, 0.35),
    l7HeadBadge().opacity(1, 0.35),
  );

  yield* waitFor(0.5);

  // ─── L7 Demo — dot avec pause d'inspection puis routing ──────────────────
  yield* waitUntil('l7Demo');

  // Requête /api : arrive au LB, PAUSE (inspection), continue vers service A
  requestDot().fill(C.application);
  requestDot().shadowColor(C.application);
  requestDot().x(-vW() * 0.49);
  requestDot().y(vH() * 0.165);
  requestDot().opacity(1);
  // Client → LB
  yield* all(
    requestDot().x(vW() * 0.27, 0.45, easeInOutCubic),
    requestDot().y(vH() * 0.165, 0.45),
  );
  // Pause = L7 lit le header/path
  l7Box().shadowColor(C.application);
  yield* l7Box().shadowBlur(vW() * 0.014, 0.18);
  yield* l7Box().shadowBlur(0, 0.18);
  yield* l7RouteLabel().opacity(1, 0.35);
  // LB → service A (route haute)
  yield* all(
    requestDot().x(vW() * 0.49, 0.35, easeInOutCubic),
    requestDot().y(-vH() * 0.06, 0.35, easeInOutCubic),
  );
  yield* requestDot().opacity(0, 0.12);

  yield* waitFor(0.4);

  // Requête /static : même LB, autre route (route basse)
  requestDot().fill(C.ok);
  requestDot().shadowColor(C.ok);
  requestDot().x(-vW() * 0.49);
  requestDot().y(vH() * 0.165);
  requestDot().opacity(1);
  yield* all(
    requestDot().x(vW() * 0.27, 0.45, easeInOutCubic),
    requestDot().y(vH() * 0.165, 0.45),
  );
  yield* l7Box().shadowBlur(vW() * 0.012, 0.15);
  yield* l7Box().shadowBlur(0, 0.15);
  yield* all(
    requestDot().x(vW() * 0.49, 0.35, easeInOutCubic),
    requestDot().y(vH() * 0.28, 0.35, easeInOutCubic),
  );
  yield* requestDot().opacity(0, 0.12);
  yield* l7PowerLabel().opacity(1, 0.4);

  yield* waitFor(1.2);

  // ─── Comparison — les deux couches s'allument en même temps ──────────────
  yield* waitUntil('comparison');

  layer4().shadowColor(C.transport);
  yield* all(
    layer4().fill(C.transport + '20', 0.4),
    layer4().stroke(C.transport, 0.4),
    layer4().shadowBlur(vW() * 0.013, 0.4),
  );

  yield* all(
    l4CompareLabel().opacity(1, 0.4),
    l7CompareLabel().opacity(1, 0.4),
  );

  yield* waitFor(2.5);

  // ─── End Scene ────────────────────────────────────────────────────────────
  yield* waitUntil('endScene');

  yield* all(
    gridRef().opacity(0, 0.5),
    pyramidWrapper().opacity(0, 0.5),
    l4Box().opacity(0, 0.5),
    l7Box().opacity(0, 0.5),
    l4CompareLabel().opacity(0, 0.5),
    l7CompareLabel().opacity(0, 0.5),
  );
});
