import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {
  all, createRef, createSignal, easeInOutCubic, easeOutCubic,
  sequence, waitFor, waitUntil,
} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const COLORS = {
    bg:        '#0D1117',
    cream:     '#F9F9F6',
    ghost:     '#3D444D',
    ghostText: '#484F58',
    rose:      '#FF3E6C',
    vert:      '#6DFF8A',
    jaune:     '#FFE14D',
    bleu:      '#58A6FF',
    danger:    '#F85149',
    terminal:  '#161B22',
    processBg: '#1C2128',
  };

  // Per-tenant accent colors: A=bleu, B=vert, C=jaune
  const TC = [COLORS.bleu, COLORS.vert, COLORS.jaune] as const;
  // Tenant horizontal centers (fraction of vW)
  const TX = [-0.27, -0.10, 0.07] as const;

  // ─── Resource fill signals ────────────────────────────────────────────────
  const cpuWA = createSignal(0);
  const cpuWB = createSignal(0);
  const cpuWC = createSignal(0);
  const ramWA = createSignal(0);
  const ramWB = createSignal(0);
  const ramWC = createSignal(0);

  // Pool geometry
  const POOL_CX   = () => vW() * -0.085;
  const POOL_W    = () => vW() * 0.480;
  const POOL_LEFT = () => POOL_CX() - POOL_W() / 2;
  const CPU_Y     = () => vH() * 0.350;
  const RAM_Y     = () => vH() * 0.400;

  // ─── Refs ─────────────────────────────────────────────────────────────────
  const gridRef     = createRef<Grid>();
  const titleRef    = createRef<Txt>();
  const subtitleRef = createRef<Txt>();

  const machineBar  = createRef<Rect>();
  const machineLbl  = createRef<Txt>();

  const cpuPool     = createRef<Rect>();
  const ramPool     = createRef<Rect>();
  const cpuLbl      = createRef<Txt>();
  const ramLbl      = createRef<Txt>();

  const cpuA = createRef<Rect>();
  const cpuB = createRef<Rect>();
  const cpuC = createRef<Rect>();
  const ramA = createRef<Rect>();
  const ramB = createRef<Rect>();
  const ramC = createRef<Rect>();

  // Tenant boxes
  const boxA   = createRef<Rect>();
  const boxB   = createRef<Rect>();
  const boxC   = createRef<Rect>();
  const subA   = createRef<Txt>();
  const subB   = createRef<Txt>();
  const subC   = createRef<Txt>();
  const osA    = createRef<Rect>();
  const osB    = createRef<Rect>();
  const osC    = createRef<Rect>();

  // Namespace glows (Era 3)
  const nsA    = createRef<Rect>();
  const nsB    = createRef<Rect>();
  const nsC    = createRef<Rect>();

  // Quota badges (Era 1)
  const quotaA = createRef<Rect>();
  const quotaB = createRef<Rect>();
  const quotaC = createRef<Rect>();

  // Kernel (Era 1 + 3)
  const kernelBox  = createRef<Rect>();

  // Hypervisor (Era 2)
  const hyperBar   = createRef<Rect>();

  // Connection lines
  const lineA  = createRef<Line>();
  const lineB  = createRef<Line>();
  const lineC  = createRef<Line>();

  // Overhead badge (Era 2)
  const overhead   = createRef<Rect>();

  // Right panel
  const rightPanel = createRef<Rect>();
  const rightYear  = createRef<Txt>();
  const rightTitle = createRef<Txt>();
  const rightBody  = createRef<Txt>();

  // Caption
  const captionNum = createRef<Txt>();
  const captionTxt = createRef<Txt>();

  // ─── Reusable box factory (inline in JSX isn't possible for repeated patterns,
  //     so tenant boxes are listed explicitly below) ──────────────────────────

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE TREE
  // ═══════════════════════════════════════════════════════════════════════════
  view.add(
    <Layout>
      <Rect width={'100%'} height={'100%'} fill={COLORS.bg} zIndex={-2} />
      <Grid
        ref={gridRef}
        width={'100%'} height={'100%'}
        stroke={COLORS.ghost} lineWidth={1}
        spacing={() => vW() * 0.031}
        opacity={0} zIndex={-1}
      />

      {/* ─── Title ─── */}
      <Txt
        ref={titleRef}
        text="L'ÉVOLUTION DE L'ISOLATION"
        fill={COLORS.cream}
        fontSize={() => vW() * 0.027} fontWeight={800}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.415} opacity={0}
      />
      <Txt
        ref={subtitleRef}
        text="partager les ressources sans se marcher dessus"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.013} fontFamily={'Space Grotesk'}
        y={() => vH() * -0.353} opacity={0}
      />

      {/* ─── Machine bar (physical hardware) ─── */}
      <Rect
        ref={machineBar}
        x={() => vW() * -0.10} y={() => vH() * 0.378}
        width={() => vW() * 0.565} height={() => vH() * 0.155}
        fill={COLORS.processBg} stroke={COLORS.ghost}
        lineWidth={2} radius={() => vW() * 0.007}
        opacity={0}
      />
      <Txt
        ref={machineLbl}
        text="MACHINE PHYSIQUE"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.0085} fontWeight={700}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * -0.10} y={() => vH() * 0.315}
        opacity={0}
      />

      {/* ─── CPU pool background ─── */}
      <Rect
        ref={cpuPool}
        x={() => POOL_CX()} y={() => CPU_Y()}
        width={() => POOL_W()} height={() => vH() * 0.038}
        fill={COLORS.ghost} radius={() => vW() * 0.003}
        opacity={0}
      />
      <Txt
        ref={cpuLbl} text="CPU"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.0085} fontWeight={700}
        fontFamily={'DM Mono, monospace'}
        x={() => POOL_LEFT() - vW() * 0.025} y={() => CPU_Y()}
        opacity={0}
      />

      {/* ─── RAM pool background ─── */}
      <Rect
        ref={ramPool}
        x={() => POOL_CX()} y={() => RAM_Y()}
        width={() => POOL_W()} height={() => vH() * 0.038}
        fill={COLORS.ghost} radius={() => vW() * 0.003}
        opacity={0}
      />
      <Txt
        ref={ramLbl} text="RAM"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.0085} fontWeight={700}
        fontFamily={'DM Mono, monospace'}
        x={() => POOL_LEFT() - vW() * 0.025} y={() => RAM_Y()}
        opacity={0}
      />

      {/* ─── CPU fills (reactive positions) ─── */}
      <Rect
        ref={cpuA}
        x={() => POOL_LEFT() + cpuWA() / 2}
        y={() => CPU_Y()}
        width={() => cpuWA()} height={() => vH() * 0.038}
        fill={TC[0]} radius={() => vW() * 0.003}
        opacity={0}
      />
      <Rect
        ref={cpuB}
        x={() => POOL_LEFT() + cpuWA() + cpuWB() / 2}
        y={() => CPU_Y()}
        width={() => cpuWB()} height={() => vH() * 0.038}
        fill={TC[1]} radius={() => vW() * 0.003}
        opacity={0}
      />
      <Rect
        ref={cpuC}
        x={() => POOL_LEFT() + cpuWA() + cpuWB() + cpuWC() / 2}
        y={() => CPU_Y()}
        width={() => cpuWC()} height={() => vH() * 0.038}
        fill={TC[2]} radius={() => vW() * 0.003}
        opacity={0}
      />

      {/* ─── RAM fills (reactive positions) ─── */}
      <Rect
        ref={ramA}
        x={() => POOL_LEFT() + ramWA() / 2}
        y={() => RAM_Y()}
        width={() => ramWA()} height={() => vH() * 0.038}
        fill={TC[0]} radius={() => vW() * 0.003}
        opacity={0}
      />
      <Rect
        ref={ramB}
        x={() => POOL_LEFT() + ramWA() + ramWB() / 2}
        y={() => RAM_Y()}
        width={() => ramWB()} height={() => vH() * 0.038}
        fill={TC[1]} radius={() => vW() * 0.003}
        opacity={0}
      />
      <Rect
        ref={ramC}
        x={() => POOL_LEFT() + ramWA() + ramWB() + ramWC() / 2}
        y={() => RAM_Y()}
        width={() => ramWC()} height={() => vH() * 0.038}
        fill={TC[2]} radius={() => vW() * 0.003}
        opacity={0}
      />

      {/* ─── Connection lines (tenant → kernel) ─── */}
      <Line
        ref={lineA}
        points={() => [[vW() * TX[0], vH() * 0.018], [vW() * TX[0], vH() * 0.175]]}
        stroke={COLORS.ghostText} lineWidth={2}
        opacity={0} end={0}
      />
      <Line
        ref={lineB}
        points={() => [[vW() * TX[1], vH() * 0.018], [vW() * TX[1], vH() * 0.175]]}
        stroke={COLORS.ghostText} lineWidth={2}
        opacity={0} end={0}
      />
      <Line
        ref={lineC}
        points={() => [[vW() * TX[2], vH() * 0.018], [vW() * TX[2], vH() * 0.175]]}
        stroke={COLORS.ghostText} lineWidth={2}
        opacity={0} end={0}
      />

      {/* ─── Shared kernel (Era 1 + Era 3) ─── */}
      <Rect
        ref={kernelBox}
        x={() => vW() * -0.10} y={() => vH() * 0.215}
        width={() => vW() * 0.50} height={() => vH() * 0.065}
        fill={`${COLORS.vert}08`} stroke={COLORS.vert}
        lineWidth={2} radius={() => vW() * 0.006}
        opacity={0}
        layout alignItems={'center'} justifyContent={'center'}
      >
        <Txt
          text="KERNEL"
          fill={COLORS.vert}
          fontSize={() => vW() * 0.014} fontWeight={700}
          fontFamily={'DM Mono, monospace'}
        />
      </Rect>

      {/* ─── Hypervisor bar (Era 2) ─── */}
      <Rect
        ref={hyperBar}
        x={() => vW() * -0.10} y={() => vH() * 0.215}
        width={() => vW() * 0.50} height={() => vH() * 0.055}
        fill={`${COLORS.jaune}10`} stroke={COLORS.jaune}
        lineWidth={2} radius={() => vW() * 0.006}
        opacity={0}
        layout alignItems={'center'} justifyContent={'center'}
      >
        <Txt
          text="HYPERVISEUR"
          fill={COLORS.jaune}
          fontSize={() => vW() * 0.013} fontWeight={700}
          fontFamily={'DM Mono, monospace'}
        />
      </Rect>

      {/* ─── Tenant A ─── */}
      <Rect
        ref={boxA}
        x={() => vW() * TX[0]} y={() => vH() * -0.075}
        width={() => vW() * 0.13} height={() => vH() * 0.175}
        fill={COLORS.processBg} stroke={TC[0]}
        lineWidth={2} radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'}
        justifyContent={'center'} gap={() => vH() * 0.010}
      >
        <Rect
          ref={osA}
          width={() => vW() * 0.095} height={() => vH() * 0.045}
          fill={`${COLORS.ghostText}18`} stroke={COLORS.ghostText}
          lineWidth={1} radius={() => vW() * 0.003}
          opacity={0}
          layout alignItems={'center'} justifyContent={'center'}
        >
          <Txt text="OS" fill={COLORS.ghostText}
            fontSize={() => vW() * 0.009} fontWeight={700}
            fontFamily={'DM Mono, monospace'} />
        </Rect>
        <Txt text="alice" fill={TC[0]}
          fontSize={() => vW() * 0.014} fontWeight={700}
          fontFamily={'DM Mono, monospace'} />
        <Txt ref={subA} text="USER"
          fill={COLORS.ghostText} opacity={0.6}
          fontSize={() => vW() * 0.009}
          fontFamily={'DM Sans, Space Grotesk'} />
      </Rect>

      {/* ─── Tenant B ─── */}
      <Rect
        ref={boxB}
        x={() => vW() * TX[1]} y={() => vH() * -0.075}
        width={() => vW() * 0.13} height={() => vH() * 0.175}
        fill={COLORS.processBg} stroke={TC[1]}
        lineWidth={2} radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'}
        justifyContent={'center'} gap={() => vH() * 0.010}
      >
        <Rect
          ref={osB}
          width={() => vW() * 0.095} height={() => vH() * 0.045}
          fill={`${COLORS.ghostText}18`} stroke={COLORS.ghostText}
          lineWidth={1} radius={() => vW() * 0.003}
          opacity={0}
          layout alignItems={'center'} justifyContent={'center'}
        >
          <Txt text="OS" fill={COLORS.ghostText}
            fontSize={() => vW() * 0.009} fontWeight={700}
            fontFamily={'DM Mono, monospace'} />
        </Rect>
        <Txt text="bob" fill={TC[1]}
          fontSize={() => vW() * 0.014} fontWeight={700}
          fontFamily={'DM Mono, monospace'} />
        <Txt ref={subB} text="USER"
          fill={COLORS.ghostText} opacity={0.6}
          fontSize={() => vW() * 0.009}
          fontFamily={'DM Sans, Space Grotesk'} />
      </Rect>

      {/* ─── Tenant C ─── */}
      <Rect
        ref={boxC}
        x={() => vW() * TX[2]} y={() => vH() * -0.075}
        width={() => vW() * 0.13} height={() => vH() * 0.175}
        fill={COLORS.processBg} stroke={TC[2]}
        lineWidth={2} radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'}
        justifyContent={'center'} gap={() => vH() * 0.010}
      >
        <Rect
          ref={osC}
          width={() => vW() * 0.095} height={() => vH() * 0.045}
          fill={`${COLORS.ghostText}18`} stroke={COLORS.ghostText}
          lineWidth={1} radius={() => vW() * 0.003}
          opacity={0}
          layout alignItems={'center'} justifyContent={'center'}
        >
          <Txt text="OS" fill={COLORS.ghostText}
            fontSize={() => vW() * 0.009} fontWeight={700}
            fontFamily={'DM Mono, monospace'} />
        </Rect>
        <Txt text="charlie" fill={TC[2]}
          fontSize={() => vW() * 0.014} fontWeight={700}
          fontFamily={'DM Mono, monospace'} />
        <Txt ref={subC} text="USER"
          fill={COLORS.ghostText} opacity={0.6}
          fontSize={() => vW() * 0.009}
          fontFamily={'DM Sans, Space Grotesk'} />
      </Rect>

      {/* ─── Namespace glows (Era 3) ─── */}
      <Rect
        ref={nsA}
        x={() => vW() * TX[0]} y={() => vH() * -0.075}
        width={() => vW() * 0.150} height={() => vH() * 0.195}
        stroke={COLORS.rose} lineWidth={3}
        radius={() => vW() * 0.010} fill={'#FF3E6C06'}
        opacity={0}
        shadowColor={COLORS.rose} shadowBlur={() => vW() * 0.015}
      />
      <Rect
        ref={nsB}
        x={() => vW() * TX[1]} y={() => vH() * -0.075}
        width={() => vW() * 0.150} height={() => vH() * 0.195}
        stroke={COLORS.rose} lineWidth={3}
        radius={() => vW() * 0.010} fill={'#FF3E6C06'}
        opacity={0}
        shadowColor={COLORS.rose} shadowBlur={() => vW() * 0.015}
      />
      <Rect
        ref={nsC}
        x={() => vW() * TX[2]} y={() => vH() * -0.075}
        width={() => vW() * 0.150} height={() => vH() * 0.195}
        stroke={COLORS.rose} lineWidth={3}
        radius={() => vW() * 0.010} fill={'#FF3E6C06'}
        opacity={0}
        shadowColor={COLORS.rose} shadowBlur={() => vW() * 0.015}
      />

      {/* ─── Quota badges (Era 1) ─── */}
      <Rect
        ref={quotaA}
        x={() => vW() * TX[0]} y={() => vH() * -0.228}
        width={() => vW() * 0.090} height={() => vH() * 0.044}
        fill={`${TC[0]}12`} stroke={`${TC[0]}50`}
        lineWidth={1} radius={() => vW() * 0.004}
        opacity={0}
        layout direction={'column'} alignItems={'center'}
        justifyContent={'center'} gap={() => vH() * 0.004}
      >
        <Txt text="QUOTA" fill={TC[0]}
          fontSize={() => vW() * 0.008} fontWeight={700}
          fontFamily={'DM Mono, monospace'} />
        <Txt text="souple" fill={COLORS.ghostText}
          fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
      </Rect>
      <Rect
        ref={quotaB}
        x={() => vW() * TX[1]} y={() => vH() * -0.228}
        width={() => vW() * 0.090} height={() => vH() * 0.044}
        fill={`${TC[1]}12`} stroke={`${TC[1]}50`}
        lineWidth={1} radius={() => vW() * 0.004}
        opacity={0}
        layout direction={'column'} alignItems={'center'}
        justifyContent={'center'} gap={() => vH() * 0.004}
      >
        <Txt text="QUOTA" fill={TC[1]}
          fontSize={() => vW() * 0.008} fontWeight={700}
          fontFamily={'DM Mono, monospace'} />
        <Txt text="souple" fill={COLORS.ghostText}
          fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
      </Rect>
      <Rect
        ref={quotaC}
        x={() => vW() * TX[2]} y={() => vH() * -0.228}
        width={() => vW() * 0.090} height={() => vH() * 0.044}
        fill={`${TC[2]}12`} stroke={`${TC[2]}50`}
        lineWidth={1} radius={() => vW() * 0.004}
        opacity={0}
        layout direction={'column'} alignItems={'center'}
        justifyContent={'center'} gap={() => vH() * 0.004}
      >
        <Txt text="QUOTA" fill={TC[2]}
          fontSize={() => vW() * 0.008} fontWeight={700}
          fontFamily={'DM Mono, monospace'} />
        <Txt text="souple" fill={COLORS.ghostText}
          fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
      </Rect>

      {/* ─── Right panel ─── */}
      <Rect
        ref={rightPanel}
        x={() => vW() * 0.352} y={() => vH() * 0.015}
        width={() => vW() * 0.248} height={() => vH() * 0.800}
        fill={COLORS.terminal} stroke={COLORS.ghost}
        lineWidth={2} radius={() => vW() * 0.008}
        opacity={0}
      />
      <Txt
        ref={rightYear} text=""
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.010} fontWeight={700}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * 0.352} y={() => vH() * -0.305}
        opacity={0}
      />
      <Txt
        ref={rightTitle} text=""
        fill={COLORS.cream}
        fontSize={() => vW() * 0.017} fontWeight={800}
        fontFamily={'Space Grotesk'}
        x={() => vW() * 0.352} y={() => vH() * -0.245}
        opacity={0} textAlign={'center'}
      />
      <Txt
        ref={rightBody} text=""
        fill={COLORS.cream}
        fontSize={() => vW() * 0.011} fontFamily={'Space Grotesk'}
        x={() => vW() * 0.352} y={() => vH() * -0.120}
        width={() => vW() * 0.210}
        opacity={0} textWrap textAlign={'left'}
        lineHeight={() => vH() * 0.048}
      />

      {/* ─── Caption ─── */}
      <Layout
        x={0} y={() => vH() * 0.440}
        layout direction={'row'} alignItems={'center'}
        gap={() => vW() * 0.010}
      >
        <Txt
          ref={captionNum} text=""
          fill={COLORS.rose}
          fontSize={() => vW() * 0.017} fontWeight={700}
          fontFamily={'DM Mono, monospace'} opacity={0}
        />
        <Txt
          ref={captionTxt} text=""
          fill={COLORS.cream}
          fontSize={() => vW() * 0.016} fontWeight={600}
          fontFamily={'Space Grotesk'} opacity={0}
        />
      </Layout>
    </Layout>,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  function* showCaption(num: string, text: string, color: string = COLORS.rose) {
    if (captionNum().opacity() > 0) {
      yield* all(captionNum().opacity(0, 0.2), captionTxt().opacity(0, 0.2));
    }
    captionNum().text(num);
    captionNum().fill(color);
    captionTxt().text(text);
    yield* all(captionNum().opacity(1, 0.35), captionTxt().opacity(1, 0.35));
  }

  function* swapPanel(year: string, title: string, body: string) {
    if (rightPanel().opacity() > 0) {
      yield* all(
        rightYear().opacity(0, 0.2),
        rightTitle().opacity(0, 0.2),
        rightBody().opacity(0, 0.2),
      );
    }
    rightYear().text(year);
    rightTitle().text(title);
    rightBody().text(body);
    yield* all(
      rightPanel().opacity(1, 0.4),
      rightYear().opacity(1, 0.4),
      rightTitle().opacity(1, 0.4),
      rightBody().opacity(0.72, 0.4),
    );
  }

  // Animate both CPU and RAM fills simultaneously
  function* setFills(
    wA: number, wB: number, wC: number,
    rA: number, rB: number, rC: number,
    dur = 0.55,
  ) {
    yield* all(
      cpuWA(vW() * wA, dur, easeInOutCubic),
      cpuWB(vW() * wB, dur, easeInOutCubic),
      cpuWC(vW() * wC, dur, easeInOutCubic),
      ramWA(vW() * rA, dur, easeInOutCubic),
      ramWB(vW() * rB, dur, easeInOutCubic),
      ramWC(vW() * rC, dur, easeInOutCubic),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  yield* waitUntil('intro');

  yield* all(gridRef().opacity(0.12, 0.8), titleRef().opacity(1, 0.6));
  yield* subtitleRef().opacity(1, 0.5);
  yield* waitFor(0.3);

  // Machine bar + resource pools appear
  yield* machineBar().opacity(1, 0.6);
  yield* all(
    machineLbl().opacity(1, 0.4),
    cpuPool().opacity(1, 0.4),
    ramPool().opacity(1, 0.4),
    cpuLbl().opacity(0.6, 0.4),
    ramLbl().opacity(0.6, 0.4),
  );
  yield* waitFor(0.4);

  // ─── ERA 1: UNIX 70s ──────────────────────────────────────────────────────
  yield* waitUntil('unix');

  yield* showCaption('01', 'UNIX 70s — QUOTA PAR UTILISATEUR', COLORS.bleu);

  yield* swapPanel(
    '≈ 1970',
    'UNIX MULTI-USER',
    'Plusieurs utilisateurs sur\nune seule machine.\nKernel partagé entre tous.\nQuotas souples par compte.',
  );

  // Tenant boxes appear
  yield* sequence(0.12,
    boxA().opacity(1, 0.4),
    boxB().opacity(1, 0.4),
    boxC().opacity(1, 0.4),
  );

  // Kernel appears
  yield* kernelBox().opacity(1, 0.5);

  // Connection lines draw from top to bottom
  lineA().opacity(1); lineB().opacity(1); lineC().opacity(1);
  yield* all(
    lineA().end(1, 0.40),
    lineB().end(1, 0.40),
    lineC().end(1, 0.40),
  );

  // Quota badges appear
  yield* sequence(0.10,
    quotaA().opacity(1, 0.3),
    quotaB().opacity(1, 0.3),
    quotaC().opacity(1, 0.3),
  );

  // Resource fills — Era 1: soft quotas, moderate usage, lots of free space
  yield* all(
    cpuA().opacity(1, 0.3), cpuB().opacity(1, 0.3), cpuC().opacity(1, 0.3),
    ramA().opacity(1, 0.3), ramB().opacity(1, 0.3), ramC().opacity(1, 0.3),
  );
  yield* setFills(0.090, 0.090, 0.080, 0.075, 0.075, 0.065);

  yield* waitFor(1.5);

  // ─── ERA 2: VMs 2000s ─────────────────────────────────────────────────────
  yield* waitUntil('vms');

  yield* showCaption('02', 'VM — 2000s — ISOLATION COMPLÈTE', COLORS.jaune);

  // Fade lines, kernel, quota badges
  yield* all(
    lineA().opacity(0, 0.3), lineB().opacity(0, 0.3), lineC().opacity(0, 0.3),
    kernelBox().opacity(0, 0.3),
    quotaA().opacity(0, 0.3), quotaB().opacity(0, 0.3), quotaC().opacity(0, 0.3),
  );

  // Boxes grow taller (full VM with embedded OS)
  yield* all(
    boxA().height(vH() * 0.265, 0.5, easeInOutCubic),
    boxB().height(vH() * 0.265, 0.5, easeInOutCubic),
    boxC().height(vH() * 0.265, 0.5, easeInOutCubic),
  );

  // OS layers appear inside each VM
  yield* sequence(0.10,
    osA().opacity(1, 0.35),
    osB().opacity(1, 0.35),
    osC().opacity(1, 0.35),
  );

  // Sub-labels → VM
  subA().text('VM'); subB().text('VM'); subC().text('VM');

  // Hypervisor bar replaces kernel
  yield* hyperBar().opacity(1, 0.5);

  // Right panel update
  yield* swapPanel(
    '≈ 2000',
    'VM + HYPERVISEUR',
    'Chaque VM embarque\nun OS complet.\nIsolation forte — mais\nchaque OS consomme\nCPU et RAM en permanence.',
  );

  // Resource fills — Era 2: VMs allocate big fixed blocks (OS overhead)
  yield* setFills(0.150, 0.150, 0.150, 0.140, 0.140, 0.140);

  yield* waitFor(1.5);

  // ─── ERA 3: Docker 2013 ───────────────────────────────────────────────────
  yield* waitUntil('docker');

  yield* showCaption('03', 'DOCKER 2013 — NAMESPACES + CGROUPS', COLORS.rose);

  // OS layers and overhead fade
  yield* all(
    osA().opacity(0, 0.3), osB().opacity(0, 0.3), osC().opacity(0, 0.3),
    hyperBar().opacity(0, 0.3),
  );

  // Boxes shrink to slim containers
  yield* all(
    boxA().height(vH() * 0.145, 0.5, easeInOutCubic),
    boxB().height(vH() * 0.145, 0.5, easeInOutCubic),
    boxC().height(vH() * 0.145, 0.5, easeInOutCubic),
  );

  // Sub-labels → CONTAINER
  subA().text('CONTAINER'); subB().text('CONTAINER'); subC().text('CONTAINER');

  // Namespace glows pulse in
  yield* sequence(0.10,
    nsA().opacity(1, 0.45),
    nsB().opacity(1, 0.45),
    nsC().opacity(1, 0.45),
  );

  // Kernel reappears (shared)
  yield* kernelBox().opacity(1, 0.5);

  // Connection lines redraw
  lineA().end(0); lineB().end(0); lineC().end(0);
  lineA().opacity(1); lineB().opacity(1); lineC().opacity(1);
  yield* all(
    lineA().end(1, 0.4),
    lineB().end(1, 0.4),
    lineC().end(1, 0.4),
  );

  // Right panel update
  yield* swapPanel(
    '2013',
    'DOCKER — CONTAINERS',
    'Kernel partagé.\nNamespaces : chaque\nprocessus croit être seul.\nCgroups : quota fin\nsur CPU, RAM, I/O.',
  );

  // Resource fills — Era 3: small cgroup allocations, lots of free space
  yield* setFills(0.070, 0.070, 0.060, 0.060, 0.060, 0.050);

  yield* waitFor(2.0);

  // ─── Outro ────────────────────────────────────────────────────────────────
  yield* waitUntil('endScene');

  yield* all(
    boxA().opacity(0, 0.5), boxB().opacity(0, 0.5), boxC().opacity(0, 0.5),
    nsA().opacity(0, 0.5),  nsB().opacity(0, 0.5),  nsC().opacity(0, 0.5),
    lineA().opacity(0, 0.5), lineB().opacity(0, 0.5), lineC().opacity(0, 0.5),
    kernelBox().opacity(0, 0.5),
    machineBar().opacity(0, 0.5), machineLbl().opacity(0, 0.5),
    cpuPool().opacity(0, 0.5), ramPool().opacity(0, 0.5),
    cpuLbl().opacity(0, 0.5), ramLbl().opacity(0, 0.5),
    cpuA().opacity(0, 0.5), cpuB().opacity(0, 0.5), cpuC().opacity(0, 0.5),
    ramA().opacity(0, 0.5), ramB().opacity(0, 0.5), ramC().opacity(0, 0.5),
    rightPanel().opacity(0, 0.5),
    rightYear().opacity(0, 0.5), rightTitle().opacity(0, 0.5),
    rightBody().opacity(0, 0.5),
    captionNum().opacity(0, 0.5), captionTxt().opacity(0, 0.5),
    titleRef().opacity(0, 0.5), subtitleRef().opacity(0, 0.5),
    gridRef().opacity(0, 0.5),
  );
});
