import {makeScene2D, Camera} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt, Line} from '@motion-canvas/2d/lib/components';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic, sequence, waitFor, waitUntil} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  // ─── Timeline helpers ───
  // Maps year → fraction of vW (center = 0)
  // Range 1993–2022 (29 years) → [-0.43, +0.43]
  const xf  = (y: number) => -0.43 + ((y - 1993) / 29) * 0.86;
  const xyr = (y: number) => () => vW() * xf(y);   // reactive
  const xypx = (y: number) => vW() * xf(y);         // pixel (call inside generator)

  const COLORS = {
    bg:    '#0D1117',
    cream: '#F9F9F6',
    ghost: '#707781ff',
    java:  '#FFE14D',
    flash: '#FF3E6C',
    nacl:  '#58A6FF',
    death: '#F85149',
    dim:   '#1C2128',
  };

  // Vertical positions
  const AXIS_Y  = () => vH() *  0.01;
  const JAVA_Y  = () => vH() *  0.13;
  const FLASH_Y = () => vH() *  0.23;
  const NACL_Y  = () => vH() *  0.33;
  const BAR_H   = () => vH() *  0.055;
  const TICK_H  = () => vH() * -0.035;  // upward ticks

  // ─── Refs ───
  const camera     = createRef<Camera>();
  const gridBg     = createRef<Grid>();
  const titleRef   = createRef<Txt>();
  const subtitleRef = createRef<Txt>();

  // Axis
  const axisLine = createRef<Line>();
  const yr1995 = createRef<Txt>(); const yr2000 = createRef<Txt>();
  const yr2005 = createRef<Txt>(); const yr2010 = createRef<Txt>();
  const yr2015 = createRef<Txt>(); const yr2020 = createRef<Txt>();

  // Bars
  const javaBar    = createRef<Rect>(); const javaLabel    = createRef<Txt>();
  const flashBar   = createRef<Rect>(); const flashLabel   = createRef<Txt>();
  const naclBar    = createRef<Rect>(); const naclLabel    = createRef<Txt>();

  // Date end-markers
  const javaEndMark  = createRef<Txt>();
  const flashEndMark = createRef<Txt>();
  const naclEndMark  = createRef<Txt>();

  // Flash events
  const jobsTick  = createRef<Line>();
  const jobsLabel = createRef<Txt>();
  const eolTick   = createRef<Line>();
  const eolLabel  = createRef<Txt>();

  // Summary cards
  const summaryTitle = createRef<Txt>();
  const javaCard = createRef<Rect>(); const javaCardName = createRef<Txt>(); const javaCardBody = createRef<Txt>();
  const flashCard = createRef<Rect>(); const flashCardName = createRef<Txt>(); const flashCardBody = createRef<Txt>();
  const naclCard = createRef<Rect>(); const naclCardName = createRef<Txt>(); const naclCardBody = createRef<Txt>();

  // ═══════════════════════════════════════════
  // SCENE TREE
  // ═══════════════════════════════════════════
  view.add(
    <Camera ref={camera}>
      <Rect width={'100%'} height={'100%'} fill={COLORS.bg} zIndex={-2} />
      <Grid ref={gridBg} width={'100%'} height={'100%'} stroke={COLORS.ghost} end={0} opacity={0.18} lineWidth={1} spacing={() => vW() * 0.055} zIndex={-1} />

      {/* Title */}
      <Txt ref={titleRef}    text="AVANT WASM"                    fill={COLORS.cream} fontSize={() => vW() * 0.042} fontWeight={800} fontFamily={'Space Grotesk'} y={() => vH() * -0.41} opacity={0} />
      <Txt ref={subtitleRef} text="trois tentatives - trois échecs" fill={COLORS.ghost} fontSize={() => vW() * 0.018} fontFamily={'Space Grotesk'} y={() => vH() * -0.34} opacity={0} />

      {/* ══ AXIS ══ */}
      <Line
        ref={axisLine}
        stroke={COLORS.ghost} lineWidth={2} opacity={0}
        points={() => [[vW() * -0.43, AXIS_Y()], [vW() * 0.43, AXIS_Y()]]}
        end={0}
      />

      {/* Year labels */}
      <Txt ref={yr1995} text="1995" fill={COLORS.ghost} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} x={xyr(1995)} y={() => AXIS_Y() - vH() * 0.055} opacity={0} />
      <Txt ref={yr2000} text="2000" fill={COLORS.ghost} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} x={xyr(2000)} y={() => AXIS_Y() - vH() * 0.055} opacity={0} />
      <Txt ref={yr2005} text="2005" fill={COLORS.ghost} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} x={xyr(2005)} y={() => AXIS_Y() - vH() * 0.055} opacity={0} />
      <Txt ref={yr2010} text="2010" fill={COLORS.ghost} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} x={xyr(2010)} y={() => AXIS_Y() - vH() * 0.055} opacity={0} />
      <Txt ref={yr2015} text="2015" fill={COLORS.ghost} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} x={xyr(2015)} y={() => AXIS_Y() - vH() * 0.055} opacity={0} />
      <Txt ref={yr2020} text="2020" fill={COLORS.ghost} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} x={xyr(2020)} y={() => AXIS_Y() - vH() * 0.055} opacity={0} />

      {/* ══ JAVA BAR (1995–2017) ══ */}
      <Rect
        ref={javaBar}
        x={xyr(1995)} y={JAVA_Y} width={0} height={BAR_H}
        fill={`${COLORS.java}22`} stroke={COLORS.java} lineWidth={0}
        radius={() => vW() * 0.004} opacity={1}
      />
      <Txt ref={javaLabel}   text="JAVA APPLETS" fill={COLORS.java}  fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'} x={() => vW() * xf(1995)} y={JAVA_Y}  opacity={0} />
      <Txt ref={javaEndMark} text="† 2017"        fill={COLORS.death} fontSize={() => vW() * 0.012} fontWeight={700} fontFamily={'DM Mono, monospace'} x={xyr(2017)} y={() => JAVA_Y() + BAR_H() * 0.95} opacity={0} />

      {/* ══ FLASH BAR (1996–2020) ══ */}
      <Rect
        ref={flashBar}
        x={xyr(1996)} y={FLASH_Y} width={0} height={BAR_H}
        fill={`${COLORS.flash}22`} stroke={COLORS.flash} lineWidth={0}
        radius={() => vW() * 0.004} opacity={1}
      />
      <Txt ref={flashLabel}   text="FLASH"   fill={COLORS.flash} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'} x={() => vW() * xf(1996)} y={FLASH_Y} opacity={0} />
      <Txt ref={flashEndMark} text="† 2020"  fill={COLORS.death} fontSize={() => vW() * 0.012} fontWeight={700} fontFamily={'DM Mono, monospace'} x={xyr(2020)} y={() => FLASH_Y() + BAR_H() * 0.95} opacity={0} />

      {/* ══ NACL BAR (2008–2017) ══ */}
      <Rect
        ref={naclBar}
        x={xyr(2008)} y={NACL_Y} width={0} height={BAR_H}
        fill={`${COLORS.nacl}22`} stroke={COLORS.nacl} lineWidth={0}
        radius={() => vW() * 0.004} opacity={1}
      />
      <Txt ref={naclLabel}   text="NaCl (Google)" fill={COLORS.nacl}  fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'} x={() => vW() * xf(2008)} y={NACL_Y}  opacity={0} />
      <Txt ref={naclEndMark} text="† 2017"         fill={COLORS.death} fontSize={() => vW() * 0.012} fontWeight={700} fontFamily={'DM Mono, monospace'} x={xyr(2017)} y={() => NACL_Y() + BAR_H() * 0.95} opacity={0} />

      {/* ══ FLASH EVENTS ══ */}
      {/* Jobs letter - 29 avril 2010 */}
      <Line
        ref={jobsTick}
        stroke={COLORS.flash} lineWidth={2} opacity={0} lineDash={[5, 4]}
        points={() => [
          [vW() * xf(2010), AXIS_Y() + vH() * 0.08],
          [vW() * xf(2010), FLASH_Y() - BAR_H() * 0.5],
        ]}
      />
      <Txt
        ref={jobsLabel}
        text={'«Thoughts\non Flash»\n29/04/2010'}
        fill={COLORS.flash} fontSize={() => vW() * 0.011}
        fontFamily={'Space Grotesk'} textAlign={'center'}
        x={xyr(2010)} y={() => AXIS_Y() + vH() * 0.06}
        opacity={0}
      />

      {/* Flash EOL - 31 déc. 2020 */}
      <Line
        ref={eolTick}
        stroke={COLORS.death} lineWidth={2} opacity={0} lineDash={[5, 4]}
        points={() => [
          [vW() * xf(2020), AXIS_Y() + vH() * 0.08],
          [vW() * xf(2020), FLASH_Y() - BAR_H() * 0.5],
        ]}
      />
      <Txt
        ref={eolLabel}
        text={'EOL\n31.12.2020'}
        fill={COLORS.death} fontSize={() => vW() * 0.011}
        fontFamily={'Space Grotesk'} textAlign={'center'}
        x={xyr(2020)} y={() => AXIS_Y() + vH() * 0.06}
        opacity={0}
      />

      {/* ══ SUMMARY CARDS ══ */}
      <Txt
        ref={summaryTitle}
        text="TROIS CAUSES DE MORT DIFFÉRENTES"
        fill={COLORS.cream} fontSize={() => vW() * 0.03} fontWeight={800} fontFamily={'Space Grotesk'}
        y={() => vH() * -0.33} opacity={0}
      />

      {/* Java card */}
      <Rect ref={javaCard}
        x={() => vW() * -0.3} y={() => vH() * 0.06}
        width={() => vW() * 0.27} height={() => vH() * 0.32}
        fill={`${COLORS.java}12`} stroke={COLORS.java} lineWidth={2} radius={() => vW() * 0.008}
        opacity={0}
      />
      <Txt ref={javaCardName} text="JAVA APPLETS" fill={COLORS.java}
        fontSize={() => vW() * 0.018} fontWeight={700} fontFamily={'Space Grotesk'}
        x={() => vW() * -0.3} y={() => vH() * -0.075} opacity={0} />
      <Txt ref={javaCardBody}
        text={'1995 – 2017\n\nSécurité catastrophique.\nPerformances décevantes'}
        fill={COLORS.cream} fontSize={() => vW() * 0.013} fontFamily={'Space Grotesk'} textAlign={'center'}
        x={() => vW() * -0.3} y={() => vH() * 0.085} opacity={0} />

      {/* Flash card */}
      <Rect ref={flashCard}
        x={0} y={() => vH() * 0.06}
        width={() => vW() * 0.27} height={() => vH() * 0.32}
        fill={`${COLORS.flash}12`} stroke={COLORS.flash} lineWidth={2} radius={() => vW() * 0.008}
        opacity={0}
      />
      <Txt ref={flashCardName} text="FLASH" fill={COLORS.flash}
        fontSize={() => vW() * 0.018} fontWeight={700} fontFamily={'Space Grotesk'}
        x={0} y={() => vH() * -0.075} opacity={0} />
      <Txt ref={flashCardBody}
        text={'1996 – 2020\n\nPropriétaire & fermé.\nApple a claqué la porte.\nUne entreprise, une décision.'}
        fill={COLORS.cream} fontSize={() => vW() * 0.013} fontFamily={'Space Grotesk'} textAlign={'center'}
        x={0} y={() => vH() * 0.085} opacity={0} />

      {/* NaCl card */}
      <Rect ref={naclCard}
        x={() => vW() * 0.3} y={() => vH() * 0.06}
        width={() => vW() * 0.27} height={() => vH() * 0.32}
        fill={`${COLORS.nacl}12`} stroke={COLORS.nacl} lineWidth={2} radius={() => vW() * 0.008}
        opacity={0}
      />
      <Txt ref={naclCardName} text="NaCl" fill={COLORS.nacl}
        fontSize={() => vW() * 0.018} fontWeight={700} fontFamily={'Space Grotesk'}
        x={() => vW() * 0.3} y={() => vH() * -0.075} opacity={0} />
      <Txt ref={naclCardBody}
        text={'2008 – 2017\n\nChrome only.\nFirefox & Safari ont refusé.\nSans standard, pas d\'avenir.'}
        fill={COLORS.cream} fontSize={() => vW() * 0.013} fontFamily={'Space Grotesk'} textAlign={'center'}
        x={() => vW() * 0.3} y={() => vH() * 0.085} opacity={0} />
    </Camera>,
  );

  // ═══════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════

  camera()
    .scene()
    .position(
      createSignal(() => {
        return view
          .size()
          .div(2)
          .add(camera().position().mul(-1).mul(camera().zoom()));
      }),
    );

  camera().scene().scale(camera().zoom);

  camera().cache(false);



  // ─── Intro ───
  yield* waitUntil('intro');
  yield* gridBg().end(1, 0.8);
  yield* all(titleRef().opacity(1, 0.6), subtitleRef().opacity(1, 0.5));
  yield* waitFor(0.5);

  // ─── Axis draws in ───
  yield* waitUntil('axisAppears');
  axisLine().opacity(1);
  yield* axisLine().end(1, 0.7, easeOutCubic);
  yield* all(
    yr1995().opacity(1, 0.3), yr2000().opacity(1, 0.3),
    yr2005().opacity(1, 0.3), yr2010().opacity(1, 0.3),
    yr2015().opacity(1, 0.3), yr2020().opacity(1, 0.3),
  );
  yield* waitFor(0.3);

  // ─── Java bar draws in (1995 → 2017) ───
  yield* waitUntil('javaBar');
  {
    const w = (xf(2017) - xf(1995)) * vW();
    const cx = (xf(1995) + xf(2017)) / 2 * vW();
    yield* all(
      javaBar().x(cx, 0.7, easeOutCubic),
      javaBar().width(w, 0.7, easeOutCubic),
      javaBar().lineWidth(2, 0.2, easeOutCubic)
    );
    javaLabel().x(cx);
    yield* all(javaLabel().opacity(1, 0.4), javaEndMark().opacity(1, 0.4));
  }
  yield* waitFor(0.5);

  // ─── Flash bar draws in (1996 → 2020) ───
  yield* waitUntil('flashBar');
  {
    const w = (xf(2020) - xf(1996)) * vW();
    const cx = (xf(1996) + xf(2020)) / 2 * vW();
    yield* all(
      flashBar().x(cx, 0.8, easeOutCubic),
      flashBar().width(w, 0.8, easeOutCubic),
      flashBar().lineWidth(2, 0.2, easeOutCubic)
    );
    flashLabel().x(cx);
    yield* all(flashLabel().opacity(1, 0.4), flashEndMark().opacity(1, 0.4));
  }
  yield* waitFor(1.0);

  // ─── Zoom on Flash story ───
  yield* waitUntil('flashZoom');

  // Dim Java
  yield* all(
    javaBar().opacity(0.2, 0.4),   javaLabel().opacity(0.2, 0.4),
    yr1995().opacity(0.2, 0.3),    yr2005().opacity(0.2, 0.3),
  );




  // Camera zooms into Flash area - center on year 2012, Flash bar height
  yield* all(
    camera().centerOn([xf(2012) * vW(), FLASH_Y()], 0.7, easeInOutCubic),
    camera().zoom(1.8, 0.7, easeInOutCubic),
  );

  yield* waitFor(0.3);

  // Jobs letter marker appears
  yield* waitUntil('jobsLetter');
  yield* all(jobsTick().opacity(1, 0.4), jobsLabel().opacity(1, 0.4));
  yield* waitFor(1.5);

  // Flash EOL marker
  yield* waitUntil('flashEol');
  yield* all(eolTick().opacity(1, 0.4), eolLabel().opacity(1, 0.4));
  yield* waitFor(1.5);

  // Camera zooms back out
  yield* waitUntil('zoomOut');
  yield* all(
    camera().reset(0.7, easeInOutCubic),
    javaBar().opacity(1, 0.5),    javaLabel().opacity(1, 0.5),
    yr1995().opacity(1, 0.4),     yr2005().opacity(1, 0.4),
    all(eolTick().opacity(0, 0.4), eolLabel().opacity(0, 0.4)),
    all(jobsTick().opacity(0, 0.4), jobsLabel().opacity(0, 0.4))
  );
  yield* waitFor(0.5);

  // ─── NaCl bar draws in (2008 → 2017) ───
  yield* waitUntil('naclBar');
  {
    const w = (xf(2017) - xf(2008)) * vW();
    const cx = (xf(2008) + xf(2017)) / 2 * vW();
    yield* all(
      naclBar().x(cx, 0.5, easeOutCubic),
      naclBar().width(w, 0.5, easeOutCubic),
      naclBar().lineWidth(2, 0.2, easeOutCubic)
    );
    naclLabel().x(cx);
    yield* all(naclLabel().opacity(1, 0.4), naclEndMark().opacity(1, 0.4));
  }
  yield* waitFor(1.0);

  // ─── Transition to summary table ───
  yield* waitUntil('summaryTable');

  // Fade timeline out
  yield* all(
    titleRef().opacity(0, 0.3),   subtitleRef().opacity(0, 0.3),
    axisLine().opacity(0, 0.3),
    yr1995().opacity(0, 0.3), yr2000().opacity(0, 0.3),
    yr2005().opacity(0, 0.3), yr2010().opacity(0, 0.3),
    yr2015().opacity(0, 0.3), yr2020().opacity(0, 0.3),
    javaBar().opacity(0, 0.3),  javaLabel().opacity(0, 0.3),  javaEndMark().opacity(0, 0.3),
    flashBar().opacity(0, 0.3), flashLabel().opacity(0, 0.3), flashEndMark().opacity(0, 0.3),
    naclBar().opacity(0, 0.3),  naclLabel().opacity(0, 0.3),  naclEndMark().opacity(0, 0.3),
    jobsTick().opacity(0, 0.3), jobsLabel().opacity(0, 0.3),
    eolTick().opacity(0, 0.3),  eolLabel().opacity(0, 0.3),
  );

  titleRef().text('TROIS CAUSES DE MORT DIFFÉRENTES');
  yield* titleRef().opacity(1, 0.5);

  yield* waitFor(0.3);

  // Cards appear in sequence
  yield* sequence(0.15,
    all(javaCard().opacity(1, 0.4),  javaCardName().opacity(1, 0.4),  javaCardBody().opacity(1, 0.4)),
    all(flashCard().opacity(1, 0.4), flashCardName().opacity(1, 0.4), flashCardBody().opacity(1, 0.4)),
    all(naclCard().opacity(1, 0.4),  naclCardName().opacity(1, 0.4),  naclCardBody().opacity(1, 0.4)),
  );

  yield* waitFor(2.5);

  // ─── End ───
  yield* waitUntil('endScene');
  yield* all(
    titleRef().opacity(0, 0.5),
    javaCard().opacity(0, 0.4), javaCardName().opacity(0, 0.4), javaCardBody().opacity(0, 0.4),
    flashCard().opacity(0, 0.4), flashCardName().opacity(0, 0.4), flashCardBody().opacity(0, 0.4),
    naclCard().opacity(0, 0.4), naclCardName().opacity(0, 0.4), naclCardBody().opacity(0, 0.4),
    gridBg().opacity(0, 0.5),
  );
});
