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
    bg:        '#0D1117',
    grid:      '#21262D',
    cream:     '#F9F9F6',
    ghost:     '#484F58',
    processBg: '#1C2128',
    client:    '#6DFF8A',
    lb:        '#FFE14D',
    server:    '#58A6FF',
    internal:  '#3FB950',
    danger:    '#FF3E6C',
  };

  // ── Signals ────────────────────────────────────────────────────────────────
  const s1ConnCount = createSignal(0);
  const s2ConnCount = createSignal(0);
  const s3ConnCount = createSignal(0);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();

  // Phase 0/1 — single server
  const singleClientBox  = createRef<Rect>();
  const singleServerBox  = createRef<Rect>();
  const singleArrow      = createRef<Line>();
  const overloadGlow     = createRef<Rect>();
  const cpuRamLabel      = createRef<Txt>();
  const saturatedLabel   = createRef<Txt>();
  const scalingLabel     = createRef<Txt>();

  // Phase 2 — 3 instances
  const server1Box   = createRef<Rect>();
  const server2Box   = createRef<Rect>();
  const server3Box   = createRef<Rect>();
  const questionLabel = createRef<Txt>();

  // Phase 3 — LB
  const lbBox          = createRef<Rect>();
  const lbBadgesRow    = createRef<Rect>();
  const rrBadge        = createRef<Rect>();
  const lcBadge        = createRef<Rect>();
  const ihBadge        = createRef<Rect>();

  const clientBox1     = createRef<Rect>();
  const clientBox2     = createRef<Rect>();
  const clientBox3     = createRef<Rect>();
  const arrowClient1Lb = createRef<Line>();
  const arrowClient2Lb = createRef<Line>();
  const arrowClient3Lb = createRef<Line>();
  const arrowLbS1      = createRef<Line>();
  const arrowLbS2      = createRef<Line>();
  const arrowLbS3      = createRef<Line>();

  // Dots
  const requestDot  = createRef<Circle>();
  const floodDot2   = createRef<Circle>();
  const floodDot3   = createRef<Circle>();

  // Phase 4/5 labels
  const roundRobinLabel = createRef<Txt>();
  const algorithmLabel  = createRef<Txt>();

  // Phase 7 — health check
  const s2DeadGlow       = createRef<Rect>();
  const s2DeadLabel      = createRef<Txt>();
  const healthCheckLabel = createRef<Txt>();
  const usersNoticeLabel = createRef<Txt>();

  // Phase 8 — blind
  const floodClientBox4 = createRef<Rect>();
  const floodClientBox5 = createRef<Rect>();
  const blindLabel      = createRef<Txt>();
  const whoLabel        = createRef<Txt>();
  const rightsLabel     = createRef<Txt>();
  const quotaLabel      = createRef<Txt>();

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

      {/* ═══ PHASE 0/1 — CLIENT + SERVEUR UNIQUE ════════════════════════════ */}
      <Rect
        key="single-client-box"
        ref={singleClientBox}
        x={() => -vW() * 0.38}
        y={0}
        width={() => vW() * 0.13}
        height={() => vH() * 0.12}
        fill={C.processBg}
        stroke={C.client}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.012}
      >
        <Txt key="sc-icon" text="◉" fill={C.client} fontSize={() => vW() * 0.022} fontFamily={'Space Grotesk'} />
        <Txt key="sc-label" text="Client" fill={C.cream} fontSize={() => vW() * 0.011} fontWeight={600} fontFamily={'Space Grotesk'} />
      </Rect>

      <Rect
        key="single-server-box"
        ref={singleServerBox}
        x={() => vW() * 0.38}
        y={0}
        width={() => vW() * 0.16}
        height={() => vH() * 0.13}
        fill={C.processBg}
        stroke={C.server}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.010}
      >
        <Txt key="ss-icon" text="▣" fill={C.server} fontSize={() => vW() * 0.022} fontFamily={'Space Grotesk'} />
        <Txt key="ss-label" text="Serveur" fill={C.cream} fontSize={() => vW() * 0.011} fontWeight={600} fontFamily={'Space Grotesk'} />
      </Rect>

      <Line
        key="single-arrow"
        ref={singleArrow}
        points={() => [[-vW() * 0.315, 0], [vW() * 0.30, 0]]}
        stroke={C.server}
        lineWidth={3}
        endArrow
        arrowSize={() => vW() * 0.009}
        opacity={0}
        end={0}
      />

      <Rect
        key="overload-glow"
        ref={overloadGlow}
        x={() => vW() * 0.38}
        y={0}
        width={() => vW() * 0.16}
        height={() => vH() * 0.13}
        fill={'#FF3E6C18'}
        stroke={C.danger}
        lineWidth={3}
        radius={() => vW() * 0.006}
        shadowColor={C.danger}
        shadowBlur={() => vW() * 0.022}
        opacity={0}
      />

      <Txt
        key="cpu-ram-label"
        ref={cpuRamLabel}
        text="CPU · RAM · Connexions"
        fill={C.ghost}
        fontSize={() => vW() * 0.011}
        fontWeight={600}
        fontFamily={'Space Grotesk'}
        x={() => vW() * 0.38}
        y={() => -vH() * 0.115}
        opacity={0}
      />
      <Txt
        key="saturated-label"
        ref={saturatedLabel}
        text="SATURÉ"
        fill={C.danger}
        fontSize={() => vW() * 0.022}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        x={() => vW() * 0.38}
        y={() => -vH() * 0.165}
        opacity={0}
      />
      <Txt
        key="scaling-label"
        ref={scalingLabel}
        text="Scaling vertical  ✗"
        fill={C.danger}
        fontSize={() => vW() * 0.014}
        fontWeight={700}
        fontFamily={'Space Grotesk'}
        x={0}
        y={() => vH() * 0.30}
        opacity={0}
      />

      {/* ═══ PHASE 2 — 3 INSTANCES ══════════════════════════════════════════ */}
      <Rect
        key="server1-box"
        ref={server1Box}
        x={() => vW() * 0.38}
        y={() => -vH() * 0.18}
        width={() => vW() * 0.16}
        height={() => vH() * 0.13}
        fill={C.processBg}
        stroke={C.server}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.008}
      >
        <Txt key="s1-icon" text="▣" fill={C.server} fontSize={() => vW() * 0.018} fontFamily={'Space Grotesk'} />
        <Txt key="s1-label" text="Instance 1" fill={C.cream} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />
        <Txt key="s1-counter" text={() => `conn: ${Math.round(s1ConnCount())}`} fill={C.ghost} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} />
      </Rect>

      <Rect
        key="server2-box"
        ref={server2Box}
        x={() => vW() * 0.38}
        y={0}
        width={() => vW() * 0.16}
        height={() => vH() * 0.13}
        fill={C.processBg}
        stroke={C.server}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.008}
      >
        <Txt key="s2-icon" text="▣" fill={C.server} fontSize={() => vW() * 0.018} fontFamily={'Space Grotesk'} />
        <Txt key="s2-label" text="Instance 2" fill={C.cream} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />
        <Txt key="s2-counter" text={() => `conn: ${Math.round(s2ConnCount())}`} fill={C.ghost} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} />
      </Rect>

      <Rect
        key="server3-box"
        ref={server3Box}
        x={() => vW() * 0.38}
        y={() => vH() * 0.18}
        width={() => vW() * 0.16}
        height={() => vH() * 0.13}
        fill={C.processBg}
        stroke={C.server}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.008}
      >
        <Txt key="s3-icon" text="▣" fill={C.server} fontSize={() => vW() * 0.018} fontFamily={'Space Grotesk'} />
        <Txt key="s3-label" text="Instance 3" fill={C.cream} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />
        <Txt key="s3-counter" text={() => `conn: ${Math.round(s3ConnCount())}`} fill={C.ghost} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} />
      </Rect>

      <Txt
        key="question-label"
        ref={questionLabel}
        text="Qui décide ?"
        fill={C.lb}
        fontSize={() => vW() * 0.020}
        fontWeight={700}
        fontFamily={'Space Grotesk'}
        x={0}
        y={0}
        opacity={0}
      />

      {/* ═══ PHASE 3 — LOAD BALANCER ════════════════════════════════════════ */}
      <Rect
        key="lb-box"
        ref={lbBox}
        x={0}
        y={0}
        width={() => vW() * 0.22}
        height={() => vH() * 0.34}
        fill={C.processBg}
        stroke={C.lb}
        lineWidth={2}
        radius={() => vW() * 0.007}
        opacity={0}
        clip
        layout direction={'column'} alignItems={'center'} gap={0}
      >
        <Rect
          key="lb-header"
          width={'100%'}
          height={() => vH() * 0.09}
          fill={C.lb + '22'}
          layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.006}
        >
          <Txt key="lb-title" text="LOAD BALANCER" fill={C.lb} fontSize={() => vW() * 0.012} fontWeight={700} fontFamily={'Space Grotesk'} />
          <Txt key="lb-subtitle" text="◎  voit toutes les requêtes" fill={C.ghost} fontSize={() => vW() * 0.008} fontFamily={'Space Grotesk'} />
        </Rect>

        <Rect key="lb-divider" width={'100%'} height={1} fill={C.lb + '40'} />

        <Rect
          key="lb-badges-row"
          ref={lbBadgesRow}
          grow={1}
          width={'100%'}
          layout direction={'column'} justifyContent={'center'} alignItems={'center'}
          padding={() => vW() * 0.012}
          gap={() => vH() * 0.020}
          opacity={0}
        >
          <Rect key="rr-badge" ref={rrBadge}
            fill={C.lb + '18'} stroke={C.lb} lineWidth={1}
            radius={() => vW() * 0.003} padding={() => vW() * 0.009}
            opacity={0} width={'80%'} layout justifyContent={'center'}
          >
            <Txt key="rr-txt" text="ROUND ROBIN" fill={C.lb} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} fontWeight={700} />
          </Rect>
          <Rect key="lc-badge" ref={lcBadge}
            fill={C.internal + '18'} stroke={C.internal} lineWidth={1}
            radius={() => vW() * 0.003} padding={() => vW() * 0.009}
            opacity={0} width={'80%'} layout justifyContent={'center'}
          >
            <Txt key="lc-txt" text="LEAST CONN" fill={C.internal} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} fontWeight={700} />
          </Rect>
          <Rect key="ih-badge" ref={ihBadge}
            fill={C.server + '18'} stroke={C.server} lineWidth={1}
            radius={() => vW() * 0.003} padding={() => vW() * 0.009}
            opacity={0} width={'80%'} layout justifyContent={'center'}
          >
            <Txt key="ih-txt" text="IP HASH" fill={C.server} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} fontWeight={700} />
          </Rect>
        </Rect>
      </Rect>

      {/* Clients phase 3+ */}
      <Rect key="client-box-1" ref={clientBox1}
        x={() => -vW() * 0.38} y={() => -vH() * 0.12}
        width={() => vW() * 0.13} height={() => vH() * 0.10}
        fill={C.processBg} stroke={C.client} lineWidth={2}
        radius={() => vW() * 0.006} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.010}
      >
        <Txt key="c1-icon" text="◉" fill={C.client} fontSize={() => vW() * 0.018} fontFamily={'Space Grotesk'} />
        <Txt key="c1-label" text="Client" fill={C.cream} fontSize={() => vW() * 0.009} fontWeight={600} fontFamily={'Space Grotesk'} />
      </Rect>

      <Rect key="client-box-2" ref={clientBox2}
        x={() => -vW() * 0.38} y={0}
        width={() => vW() * 0.13} height={() => vH() * 0.10}
        fill={C.processBg} stroke={C.client} lineWidth={2}
        radius={() => vW() * 0.006} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.010}
      >
        <Txt key="c2-icon" text="◉" fill={C.client} fontSize={() => vW() * 0.018} fontFamily={'Space Grotesk'} />
        <Txt key="c2-label" text="Client" fill={C.cream} fontSize={() => vW() * 0.009} fontWeight={600} fontFamily={'Space Grotesk'} />
      </Rect>

      <Rect key="client-box-3" ref={clientBox3}
        x={() => -vW() * 0.38} y={() => vH() * 0.12}
        width={() => vW() * 0.13} height={() => vH() * 0.10}
        fill={C.processBg} stroke={C.client} lineWidth={2}
        radius={() => vW() * 0.006} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.010}
      >
        <Txt key="c3-icon" text="◉" fill={C.client} fontSize={() => vW() * 0.018} fontFamily={'Space Grotesk'} />
        <Txt key="c3-label" text="Client" fill={C.cream} fontSize={() => vW() * 0.009} fontWeight={600} fontFamily={'Space Grotesk'} />
      </Rect>

      {/* Flèches clients → LB */}
      <Line key="arrow-c1-lb" ref={arrowClient1Lb}
        points={() => [[-vW() * 0.315, -vH() * 0.12], [-vW() * 0.11, 0]]}
        stroke={C.client} lineWidth={2} endArrow arrowSize={() => vW() * 0.007} opacity={0} end={0} />
      <Line key="arrow-c2-lb" ref={arrowClient2Lb}
        points={() => [[-vW() * 0.315, 0], [-vW() * 0.11, 0]]}
        stroke={C.client} lineWidth={2} endArrow arrowSize={() => vW() * 0.007} opacity={0} end={0} />
      <Line key="arrow-c3-lb" ref={arrowClient3Lb}
        points={() => [[-vW() * 0.315, vH() * 0.12], [-vW() * 0.11, 0]]}
        stroke={C.client} lineWidth={2} endArrow arrowSize={() => vW() * 0.007} opacity={0} end={0} />

      {/* Flèches LB → Serveurs */}
      <Line key="arrow-lb-s1" ref={arrowLbS1}
        points={() => [[vW() * 0.11, 0], [vW() * 0.30, -vH() * 0.18]]}
        stroke={C.server} lineWidth={2} endArrow arrowSize={() => vW() * 0.007} opacity={0} end={0} />
      <Line key="arrow-lb-s2" ref={arrowLbS2}
        points={() => [[vW() * 0.11, 0], [vW() * 0.30, 0]]}
        stroke={C.server} lineWidth={2} endArrow arrowSize={() => vW() * 0.007} opacity={0} end={0} />
      <Line key="arrow-lb-s3" ref={arrowLbS3}
        points={() => [[vW() * 0.11, 0], [vW() * 0.30, vH() * 0.18]]}
        stroke={C.server} lineWidth={2} endArrow arrowSize={() => vW() * 0.007} opacity={0} end={0} />

      {/* ═══ DOT PRINCIPAL ══════════════════════════════════════════════════ */}
      <Circle
        key="request-dot"
        ref={requestDot}
        width={() => vW() * 0.016}
        height={() => vW() * 0.016}
        fill={C.client}
        shadowColor={C.client}
        shadowBlur={() => vW() * 0.012}
        x={0} y={0} opacity={0} zIndex={5}
      />

      {/* Labels phase 4/5 */}
      <Txt key="round-robin-label" ref={roundRobinLabel}
        text="Round-Robin"
        fill={C.lb} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'}
        x={0} y={() => vH() * 0.33} opacity={0}
      />
      <Txt key="algorithm-label" ref={algorithmLabel}
        text="Least Connections → Instance 2"
        fill={C.internal} fontSize={() => vW() * 0.013} fontWeight={600} fontFamily={'Space Grotesk'}
        x={0} y={() => vH() * 0.33} opacity={0}
      />

      {/* ═══ PHASE 7 — HEALTH CHECK ════════════════════════════════════════ */}
      <Rect key="s2-dead-glow" ref={s2DeadGlow}
        x={() => vW() * 0.38} y={0}
        width={() => vW() * 0.16} height={() => vH() * 0.13}
        fill={'#FF3E6C18'} stroke={C.danger} lineWidth={3}
        radius={() => vW() * 0.006}
        shadowColor={C.danger} shadowBlur={() => vW() * 0.020}
        opacity={0}
      />
      <Txt key="s2-dead-label" ref={s2DeadLabel}
        text="DEAD"
        fill={C.danger} fontSize={() => vW() * 0.014} fontWeight={800} fontFamily={'Space Grotesk'}
        x={() => vW() * 0.38} y={() => -vH() * 0.105} opacity={0}
      />
      <Txt key="health-check-label" ref={healthCheckLabel}
        text="Health Check  ✗"
        fill={C.danger} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'}
        x={0} y={() => -vH() * 0.33} opacity={0}
      />
      <Txt key="users-notice-label" ref={usersNoticeLabel}
        text="Tes utilisateurs ne voient rien"
        fill={C.internal} fontSize={() => vW() * 0.014} fontWeight={600} fontFamily={'Space Grotesk'}
        x={0} y={() => vH() * 0.33} opacity={0}
      />

      {/* ═══ PHASE 8 — AVEUGLE ══════════════════════════════════════════════ */}
      <Rect key="flood-client-4" ref={floodClientBox4}
        x={() => -vW() * 0.38} y={() => -vH() * 0.25}
        width={() => vW() * 0.13} height={() => vH() * 0.10}
        fill={C.processBg} stroke={C.client} lineWidth={2}
        radius={() => vW() * 0.006} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.010}
      >
        <Txt key="fc4-icon" text="◉" fill={C.client} fontSize={() => vW() * 0.018} fontFamily={'Space Grotesk'} />
        <Txt key="fc4-label" text="Client" fill={C.cream} fontSize={() => vW() * 0.009} fontWeight={600} fontFamily={'Space Grotesk'} />
      </Rect>

      <Rect key="flood-client-5" ref={floodClientBox5}
        x={() => -vW() * 0.38} y={() => vH() * 0.25}
        width={() => vW() * 0.13} height={() => vH() * 0.10}
        fill={C.processBg} stroke={C.client} lineWidth={2}
        radius={() => vW() * 0.006} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={() => vH() * 0.010}
      >
        <Txt key="fc5-icon" text="◉" fill={C.client} fontSize={() => vW() * 0.018} fontFamily={'Space Grotesk'} />
        <Txt key="fc5-label" text="Client" fill={C.cream} fontSize={() => vW() * 0.009} fontWeight={600} fontFamily={'Space Grotesk'} />
      </Rect>

      <Circle key="flood-dot-2" ref={floodDot2}
        width={() => vW() * 0.014} height={() => vW() * 0.014}
        fill={C.client} x={-9999} y={0} opacity={0} zIndex={5} />
      <Circle key="flood-dot-3" ref={floodDot3}
        width={() => vW() * 0.014} height={() => vW() * 0.014}
        fill={C.client} x={-9999} y={0} opacity={0} zIndex={5} />

      <Txt key="blind-label" ref={blindLabel}
        text="AVEUGLE"
        fill={C.danger} fontSize={() => vW() * 0.020} fontWeight={800} fontFamily={'Space Grotesk'}
        x={0} y={() => -vH() * 0.22} opacity={0}
      />
      <Txt key="who-label" ref={whoLabel}
        text="Qui appelle ?"
        fill={C.danger} fontSize={() => vW() * 0.012} fontWeight={600} fontFamily={'Space Grotesk'}
        x={() => -vW() * 0.05} y={() => -vH() * 0.09} opacity={0}
      />
      <Txt key="rights-label" ref={rightsLabel}
        text="Quels droits ?"
        fill={C.danger} fontSize={() => vW() * 0.012} fontWeight={600} fontFamily={'Space Grotesk'}
        x={() => vW() * 0.07} y={() => vH() * 0.08} opacity={0}
      />
      <Txt key="quota-label" ref={quotaLabel}
        text="Combien de fois ?"
        fill={C.danger} fontSize={() => vW() * 0.012} fontWeight={600} fontFamily={'Space Grotesk'}
        x={() => -vW() * 0.06} y={() => vH() * 0.23} opacity={0}
      />
    </Layout>,
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ══════════════════════════════════════════════════════════════════════════

  // ─── Phase 0 : Intro ─────────────────────────────────────────────────────
  yield* waitUntil('intro');

  yield* gridRef().opacity(0.12, 1);
  yield* all(
    singleClientBox().opacity(1, 0.5),
    singleServerBox().opacity(1, 0.5),
  );
  yield* all(
    singleArrow().opacity(1, 0.3),
    singleArrow().end(1, 0.5),
  );

  // Deux dots — trafic normal
  for (let i = 0; i < 2; i++) {
    requestDot().fill(C.client);
    requestDot().shadowColor(C.client);
    requestDot().x(-vW() * 0.38);
    requestDot().y(0);
    requestDot().opacity(1);
    yield* requestDot().x(vW() * 0.38, 0.35, easeInOutCubic);
    yield* requestDot().opacity(0, 0.1);
    yield* waitFor(0.15);
  }

  // ─── Phase 1 : Saturation ────────────────────────────────────────────────
  yield* waitUntil('saturation');

  yield* cpuRamLabel().opacity(1, 0.5);
  yield* all(
    overloadGlow().opacity(1, 0.5),
    singleServerBox().stroke(C.danger, 0.5),
    singleArrow().stroke(C.danger, 0.4),
  );
  yield* saturatedLabel().opacity(1, 0.4);

  // Dots rapides — serveur qui rame
  for (let i = 0; i < 3; i++) {
    requestDot().fill(C.danger);
    requestDot().shadowColor(C.danger);
    requestDot().x(-vW() * 0.38);
    requestDot().y(0);
    requestDot().opacity(1);
    yield* requestDot().x(vW() * 0.30, 0.22, easeInOutCubic);
    yield* requestDot().opacity(0, 0.08);
    yield* waitFor(0.06);
  }

  yield* scalingLabel().opacity(1, 0.5);
  yield* waitFor(0.8);

  // ─── Phase 2 : Scaling horizontal ────────────────────────────────────────
  yield* waitUntil('horizontalScaling');

  yield* all(
    singleServerBox().opacity(0, 0.4),
    overloadGlow().opacity(0, 0.3),
    cpuRamLabel().opacity(0, 0.3),
    saturatedLabel().opacity(0, 0.3),
    scalingLabel().opacity(0, 0.3),
    singleArrow().opacity(0, 0.3),
  );

  yield* sequence(0.12,
    server1Box().opacity(1, 0.4),
    server2Box().opacity(1, 0.4),
    server3Box().opacity(1, 0.4),
  );

  yield* waitFor(0.3);
  yield* questionLabel().opacity(1, 0.5);
  yield* waitFor(1);

  // ─── Phase 3 : LB apparaît ───────────────────────────────────────────────
  yield* waitUntil('lbAppears');

  yield* all(
    questionLabel().opacity(0, 0.4),
    singleClientBox().opacity(0, 0.3),
  );

  yield* lbBox().opacity(1, 0.6);

  yield* all(
    clientBox1().opacity(1, 0.35),
    clientBox2().opacity(1, 0.35),
    clientBox3().opacity(1, 0.35),
  );
  yield* all(
    arrowClient1Lb().opacity(1, 0.3), arrowClient1Lb().end(1, 0.45),
    arrowClient2Lb().opacity(1, 0.3), arrowClient2Lb().end(1, 0.45),
    arrowClient3Lb().opacity(1, 0.3), arrowClient3Lb().end(1, 0.45),
  );
  yield* sequence(0.1,
    all(arrowLbS1().opacity(1, 0.3), arrowLbS1().end(1, 0.45)),
    all(arrowLbS2().opacity(1, 0.3), arrowLbS2().end(1, 0.45)),
    all(arrowLbS3().opacity(1, 0.3), arrowLbS3().end(1, 0.45)),
  );

  yield* waitFor(0.5);

  // ─── Phase 4 : Round-Robin ───────────────────────────────────────────────
  yield* waitUntil('roundRobin');

  // helper : dot client → LB → server (cible en Y)
  const sendDot = function* (targetY: number, serverStroke: string, counter: ReturnType<typeof createSignal>, newCount: number) {
    requestDot().fill(C.client);
    requestDot().shadowColor(C.client);
    requestDot().x(-vW() * 0.38);
    requestDot().y(0);
    requestDot().opacity(1);
    yield* all(
      requestDot().x(0, 0.32, easeInOutCubic),
      requestDot().y(0, 0.32),
    );
    yield* waitFor(0.08);
    yield* all(
      requestDot().x(vW() * 0.38, 0.32, easeInOutCubic),
      requestDot().y(targetY, 0.32, easeInOutCubic),
      counter(newCount, 0.28),
    );
    yield* requestDot().opacity(0, 0.12);
    yield* waitFor(0.12);
  };

  yield* sendDot(-vH() * 0.18, C.lb, s1ConnCount, 1);
  yield* sendDot(0,            C.lb, s2ConnCount, 1);
  yield* sendDot(vH() * 0.18,  C.lb, s3ConnCount, 1);
  yield* sendDot(-vH() * 0.18, C.lb, s1ConnCount, 2); // S1 à nouveau

  yield* roundRobinLabel().opacity(1, 0.5);
  yield* waitFor(1);

  // ─── Phase 5 : Algorithmes ───────────────────────────────────────────────
  yield* waitUntil('algorithms');

  yield* roundRobinLabel().opacity(0, 0.3);
  yield* lbBadgesRow().opacity(1, 0.4);
  yield* sequence(0.12,
    rrBadge().opacity(1, 0.4),
    lcBadge().opacity(1, 0.4),
    ihBadge().opacity(1, 0.4),
  );

  yield* waitFor(0.4);

  // Compteurs asymétriques pour illustrer least-conn
  yield* all(
    s1ConnCount(3, 0.5),
    s2ConnCount(1, 0.5),
    s3ConnCount(2, 0.5),
  );

  yield* waitFor(0.4);

  // Nouvelle requête → S2 (conn = 1, le moins chargé)
  requestDot().fill(C.internal);
  requestDot().shadowColor(C.internal);
  requestDot().x(-vW() * 0.38);
  requestDot().y(0);
  requestDot().opacity(1);
  yield* all(
    requestDot().x(0, 0.32, easeInOutCubic),
    requestDot().y(0, 0.32),
  );
  yield* waitFor(0.08);
  arrowLbS2().shadowColor(C.internal);
  yield* all(
    arrowLbS2().stroke(C.internal, 0.25),
    arrowLbS2().shadowBlur(vW() * 0.008, 0.25),
    lcBadge().fill(C.internal + '40', 0.25),
    requestDot().x(vW() * 0.38, 0.32, easeInOutCubic),
    requestDot().y(0, 0.32),
    s2ConnCount(2, 0.28),
  );
  yield* requestDot().opacity(0, 0.12);

  yield* algorithmLabel().opacity(1, 0.4);
  yield* waitFor(1.2);

  yield* all(
    algorithmLabel().opacity(0, 0.3),
    arrowLbS2().stroke(C.server, 0.3),
    arrowLbS2().shadowBlur(0, 0.3),
    lcBadge().fill(C.internal + '18', 0.3),
    s1ConnCount(0, 0.4),
    s2ConnCount(0, 0.4),
    s3ConnCount(0, 0.4),
  );

  // ─── Phase 7 : Health Check ──────────────────────────────────────────────
  yield* waitUntil('healthCheck');

  yield* all(
    s2DeadGlow().opacity(1, 0.5),
    server2Box().stroke(C.danger, 0.5),
  );
  yield* s2DeadLabel().opacity(1, 0.4);
  yield* all(
    arrowLbS2().opacity(0, 0.4),
    healthCheckLabel().opacity(1, 0.5),
  );

  yield* waitFor(0.4);

  // Trafic continue sur S1 et S3 uniquement
  yield* sendDot(-vH() * 0.18, C.lb, s1ConnCount, 1);
  yield* sendDot(vH() * 0.18,  C.lb, s3ConnCount, 1);

  yield* usersNoticeLabel().opacity(1, 0.5);
  yield* waitFor(1.5);

  yield* all(
    s2DeadGlow().opacity(0, 0.4),
    s2DeadLabel().opacity(0, 0.3),
    healthCheckLabel().opacity(0, 0.3),
    usersNoticeLabel().opacity(0, 0.3),
    server2Box().stroke(C.server, 0.4),
    arrowLbS2().opacity(1, 0.4),
    s1ConnCount(0, 0.3),
    s3ConnCount(0, 0.3),
  );

  // ─── Phase 8 : LB aveugle ────────────────────────────────────────────────
  yield* waitUntil('blind');

  yield* sequence(0.1,
    floodClientBox4().opacity(1, 0.25),
    floodClientBox5().opacity(1, 0.25),
  );
  yield* waitFor(0.2);

  // Salve de 3 dots simultanés
  requestDot().fill(C.client);
  requestDot().shadowColor(C.client);
  requestDot().x(-vW() * 0.38);
  requestDot().y(0);
  requestDot().opacity(1);
  floodDot2().x(-vW() * 0.38);
  floodDot2().y(-vH() * 0.25);
  floodDot2().opacity(1);
  floodDot3().x(-vW() * 0.38);
  floodDot3().y(vH() * 0.25);
  floodDot3().opacity(1);

  yield* all(
    requestDot().x(0, 0.38, easeInOutCubic), requestDot().y(0, 0.38),
    floodDot2().x(0, 0.38, easeInOutCubic),  floodDot2().y(0, 0.38, easeInOutCubic),
    floodDot3().x(0, 0.38, easeInOutCubic),  floodDot3().y(0, 0.38, easeInOutCubic),
  );
  yield* all(
    requestDot().x(vW() * 0.30, 0.30, easeInOutCubic), requestDot().y(-vH() * 0.18, 0.30, easeInOutCubic),
    floodDot2().x(vW() * 0.30, 0.30, easeInOutCubic),  floodDot2().y(0, 0.30, easeInOutCubic),
    floodDot3().x(vW() * 0.30, 0.30, easeInOutCubic),  floodDot3().y(vH() * 0.18, 0.30, easeInOutCubic),
  );
  yield* all(
    requestDot().opacity(0, 0.18),
    floodDot2().opacity(0, 0.18),
    floodDot3().opacity(0, 0.18),
  );

  // LB devient aveugle
  yield* blindLabel().opacity(1, 0.5);
  yield* waitFor(0.3);
  yield* sequence(0.15,
    whoLabel().opacity(1, 0.4),
    rightsLabel().opacity(1, 0.4),
    quotaLabel().opacity(1, 0.4),
  );

  lbBox().shadowColor(C.danger);
  yield* all(
    lbBox().stroke(C.danger, 0.5),
    lbBox().shadowBlur(vW() * 0.015, 0.5),
  );

  yield* waitFor(2);

  // ─── End Scene ───────────────────────────────────────────────────────────
  yield* waitUntil('endScene');

  yield* all(
    gridRef().opacity(0, 0.5),
    lbBox().opacity(0, 0.5),
    server1Box().opacity(0, 0.5),
    server2Box().opacity(0, 0.5),
    server3Box().opacity(0, 0.5),
    clientBox1().opacity(0, 0.5),
    clientBox2().opacity(0, 0.5),
    clientBox3().opacity(0, 0.5),
    floodClientBox4().opacity(0, 0.5),
    floodClientBox5().opacity(0, 0.5),
    arrowClient1Lb().opacity(0, 0.5),
    arrowClient2Lb().opacity(0, 0.5),
    arrowClient3Lb().opacity(0, 0.5),
    arrowLbS1().opacity(0, 0.5),
    arrowLbS2().opacity(0, 0.5),
    arrowLbS3().opacity(0, 0.5),
    blindLabel().opacity(0, 0.5),
    whoLabel().opacity(0, 0.5),
    rightsLabel().opacity(0, 0.5),
    quotaLabel().opacity(0, 0.5),
  );
});
