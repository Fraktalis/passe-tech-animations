// mythos/whitebox-vs-blackbox.tsx
// Nuance technique : white-box ≠ black-box
//
// Left  (vert)  : ce que Mythos a vraiment fait
//                 code source fourni, conteneur isolé, debug, cibles connues
// Right (rose)  : ce qu'on entend dans les headlines
//                 "l'IA hacker", pentest autonome, boîte noire
// Centre        : "≠" — la distinction que les headlines ratent

import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {all, createRef, easeOutCubic, sequence, waitFor, waitUntil} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const C = {
    bg:     '#0D1117',
    rose:   '#FF3E6C',
    vert:   '#6DFF8A',
    jaune:  '#FFE14D',
    cream:  '#F9F9F6',
    ghost:  '#484F58',
    danger: '#F85149',
  };

  // ── Positions ──
  const X_LEFT         = -0.245;
  const X_RIGHT        = +0.245;
  const Y_HEADER       = -0.305;
  const Y_SUB          = -0.245;
  const Y_HSEP         = -0.19;
  const Y_PANEL_CENTER = -0.05;
  const ITEMS_Y        = [-0.125, -0.045, 0.035, 0.115, 0.195] as const;

  // ── Refs ──────────────────────────────────────
  const gridRef      = createRef<Grid>();
  const titleRef     = createRef<Txt>();
  const centerLine   = createRef<Rect>();
  const neqSign      = createRef<Txt>();

  // Panneau gauche
  const leftPanel    = createRef<Rect>();
  const leftHeader   = createRef<Txt>();
  const leftSub      = createRef<Txt>();
  const leftSepLine  = createRef<Rect>();
  const leftItem1    = createRef<Txt>();
  const leftItem2    = createRef<Txt>();
  const leftItem3    = createRef<Txt>();
  const leftItem4    = createRef<Txt>();
  const leftItem5    = createRef<Txt>();

  // Panneau droit
  const rightPanel   = createRef<Rect>();
  const rightHeader  = createRef<Txt>();
  const rightSub     = createRef<Txt>();
  const rightSepLine = createRef<Rect>();
  const rightItem1   = createRef<Txt>();
  const rightItem2   = createRef<Txt>();
  const rightItem3   = createRef<Txt>();
  const rightItem4   = createRef<Txt>();

  // Conclusion
  const conclusionBox = createRef<Rect>();

  // ════════════════════════════════════════════
  // SCENE TREE
  // ════════════════════════════════════════════
  view.add(
    <Layout key="root">
      <Rect key="bg" width={'100%'} height={'100%'} fill={C.bg} zIndex={-2} />
      <Grid
        key="grid"
        ref={gridRef}
        width={'100%'} height={'100%'}
        stroke={C.ghost} lineWidth={1} opacity={0}
        spacing={() => vW() * 0.055} zIndex={-1}
      />

      {/* ── Titre ── */}
      <Txt
        key="title"
        ref={titleRef}
        text="WHITE-BOX ≠ BLACK-BOX"
        fill={C.cream}
        fontSize={() => vW() * 0.032}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.43}
        opacity={0}
      />

      {/* ── Séparateur vertical central ── */}
      <Rect
        key="center-line"
        ref={centerLine}
        width={2}
        height={() => vH() * 0.65}
        fill={C.ghost}
        y={() => vH() * Y_PANEL_CENTER}
        opacity={0}
      />

      {/* ── "≠" ── */}
      <Txt
        key="neq-sign"
        ref={neqSign}
        text="≠"
        fill={C.jaune}
        fontSize={() => vW() * 0.075}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        y={() => vH() * Y_PANEL_CENTER}
        shadowColor={C.jaune}
        shadowBlur={() => vW() * 0.025}
        opacity={0}
      />

      {/* ══════════════════════════════════════
          PANNEAU GAUCHE — CE QUE MYTHOS A FAIT
          ══════════════════════════════════════ */}
      <Rect
        key="left-panel"
        ref={leftPanel}
        x={() => vW() * X_LEFT}
        y={() => vH() * Y_PANEL_CENTER}
        width={() => vW() * 0.41}
        height={() => vH() * 0.65}
        fill={`${C.vert}08`}
        stroke={C.vert} lineWidth={2}
        radius={() => vW() * 0.007}
        opacity={0}
      />
      <Txt
        key="left-header"
        ref={leftHeader}
        text="CE QUE MYTHOS A FAIT"
        fill={C.vert}
        fontSize={() => vW() * 0.018}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        x={() => vW() * X_LEFT}
        y={() => vH() * Y_HEADER}
        opacity={0}
      />
      <Txt
        key="left-sub"
        ref={leftSub}
        text="white-box · environnement contrôlé"
        fill={`${C.vert}88`}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * X_LEFT}
        y={() => vH() * Y_SUB}
        opacity={0}
      />
      <Rect
        key="left-sep-line"
        ref={leftSepLine}
        x={() => vW() * X_LEFT}
        y={() => vH() * Y_HSEP}
        width={() => vW() * 0.35}
        height={1}
        fill={`${C.vert}40`}
        scale={[0, 1]}
      />

      {/* Items gauche */}
      <Txt key="left-item1" ref={leftItem1}
        text={"✓   code source  fourni"}
        fill={C.vert} fontSize={() => vW() * 0.016}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * X_LEFT} y={() => vH() * ITEMS_Y[0]} opacity={0}
      />
      <Txt key="left-item2" ref={leftItem2}
        text={"✓   conteneur  isolé, sans réseau"}
        fill={C.vert} fontSize={() => vW() * 0.016}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * X_LEFT} y={() => vH() * ITEMS_Y[1]} opacity={0}
      />
      <Txt key="left-item3" ref={leftItem3}
        text={"✓   outils de debug  fournis"}
        fill={C.vert} fontSize={() => vW() * 0.016}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * X_LEFT} y={() => vH() * ITEMS_Y[2]} opacity={0}
      />
      <Txt key="left-item4" ref={leftItem4}
        text={"✓   cibles  connues à l'avance"}
        fill={C.vert} fontSize={() => vW() * 0.016}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * X_LEFT} y={() => vH() * ITEMS_Y[3]} opacity={0}
      />
      <Txt key="left-item5" ref={leftItem5}
        text={"✓   agents  en parallèle"}
        fill={C.vert} fontSize={() => vW() * 0.016}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * X_LEFT} y={() => vH() * ITEMS_Y[4]} opacity={0}
      />

      {/* ══════════════════════════════════════
          PANNEAU DROIT — CE QU'ON ENTEND
          ══════════════════════════════════════ */}
      <Rect
        key="right-panel"
        ref={rightPanel}
        x={() => vW() * X_RIGHT}
        y={() => vH() * Y_PANEL_CENTER}
        width={() => vW() * 0.41}
        height={() => vH() * 0.65}
        fill={`${C.rose}08`}
        stroke={C.rose} lineWidth={2}
        radius={() => vW() * 0.007}
        opacity={0}
      />
      <Txt
        key="right-header"
        ref={rightHeader}
        text="CE QU'ON ENTEND"
        fill={C.rose}
        fontSize={() => vW() * 0.018}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        x={() => vW() * X_RIGHT}
        y={() => vH() * Y_HEADER}
        opacity={0}
      />
      <Txt
        key="right-sub"
        ref={rightSub}
        text="les headlines"
        fill={`${C.rose}88`}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * X_RIGHT}
        y={() => vH() * Y_SUB}
        opacity={0}
      />
      <Rect
        key="right-sep-line"
        ref={rightSepLine}
        x={() => vW() * X_RIGHT}
        y={() => vH() * Y_HSEP}
        width={() => vW() * 0.35}
        height={1}
        fill={`${C.rose}40`}
        scale={[0, 1]}
      />

      {/* Items droite */}
      <Txt key="right-item1" ref={rightItem1}
        text={`✗   "l'IA hacker"`}
        fill={C.rose} fontSize={() => vW() * 0.016}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * X_RIGHT} y={() => vH() * ITEMS_Y[0]} opacity={0}
      />
      <Txt key="right-item2" ref={rightItem2}
        text={`✗   "pentest autonome"`}
        fill={C.rose} fontSize={() => vW() * 0.016}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * X_RIGHT} y={() => vH() * ITEMS_Y[1]} opacity={0}
      />
      <Txt key="right-item3" ref={rightItem3}
        text={"✗   partir d'une URL  inconnue"}
        fill={C.rose} fontSize={() => vW() * 0.016}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * X_RIGHT} y={() => vH() * ITEMS_Y[2]} opacity={0}
      />
      <Txt key="right-item4" ref={rightItem4}
        text={"✗   boîte noire  zéro accès au code"}
        fill={C.rose} fontSize={() => vW() * 0.016}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * X_RIGHT} y={() => vH() * ITEMS_Y[3]} opacity={0}
      />

      {/* ── Conclusion ── */}
      <Rect
        key="conclusion-box"
        ref={conclusionBox}
        y={() => vH() * 0.40}
        width={() => vW() * 0.72}
        height={() => vH() * 0.1}
        fill={`${C.jaune}10`}
        stroke={C.jaune} lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt key="concl-line1" text={"Anthropic n'a pas prouvé le black-box pentest autonome."} fill={C.jaune} fontSize={() => vW() * 0.016} fontWeight={600} fontFamily={'Space Grotesk'} />
        <Txt key="concl-line2" text={"Personne ne l'a encore prouvé."}                         fill={C.ghost} fontSize={() => vW() * 0.014} fontFamily={'DM Mono, monospace'} />
      </Rect>
    </Layout>,
  );

  // ════════════════════════════════════════════
  // ANIMATIONS
  // ════════════════════════════════════════════

  // ── Intro ──
  yield* waitUntil('intro');
  yield* gridRef().opacity(0.12, 0.8);
  yield* titleRef().opacity(1, 0.55);
  yield* waitFor(0.5);

  // ── Panneau gauche ──
  yield* waitUntil('leftReveal');
  yield* leftPanel().opacity(1, 0.4);
  yield* all(
    leftHeader().opacity(1, 0.4),
    leftSub().opacity(1, 0.35),
  );
  yield* leftSepLine().scale([1, 1], 0.35, easeOutCubic);
  yield* waitFor(0.2);

  yield* sequence(0.25,
    leftItem1().opacity(1, 0.35),
    leftItem2().opacity(1, 0.35),
    leftItem3().opacity(1, 0.35),
    leftItem4().opacity(1, 0.35),
    leftItem5().opacity(1, 0.35),
  );
  yield* waitFor(0.5);

  // ── Panneau droit ──
  yield* waitUntil('rightReveal');
  yield* rightPanel().opacity(1, 0.4);
  yield* all(
    rightHeader().opacity(1, 0.4),
    rightSub().opacity(1, 0.35),
  );
  yield* rightSepLine().scale([1, 1], 0.35, easeOutCubic);
  yield* waitFor(0.2);

  yield* sequence(0.25,
    rightItem1().opacity(1, 0.35),
    rightItem2().opacity(1, 0.35),
    rightItem3().opacity(1, 0.35),
    rightItem4().opacity(1, 0.35),
  );
  yield* waitFor(0.5);

  // ── "≠" central ──
  yield* waitUntil('neqReveal');
  yield* centerLine().opacity(0.35, 0.3);
  yield* neqSign().opacity(1, 0.45);
  yield* waitFor(2.0);

  // ── Conclusion ──
  yield* waitUntil('conclusion');
  yield* conclusionBox().opacity(1, 0.5);
  yield* waitFor(3.5);

  // ── Fin ──
  yield* waitUntil('endScene');
  yield* all(
    gridRef().opacity(0, 0.5),
    titleRef().opacity(0, 0.4),
    leftPanel().opacity(0, 0.4),
    leftHeader().opacity(0, 0.3),
    leftSub().opacity(0, 0.3),
    leftSepLine().opacity(0, 0.3),
    leftItem1().opacity(0, 0.3),
    leftItem2().opacity(0, 0.3),
    leftItem3().opacity(0, 0.3),
    leftItem4().opacity(0, 0.3),
    leftItem5().opacity(0, 0.3),
    rightPanel().opacity(0, 0.4),
    rightHeader().opacity(0, 0.3),
    rightSub().opacity(0, 0.3),
    rightSepLine().opacity(0, 0.3),
    rightItem1().opacity(0, 0.3),
    rightItem2().opacity(0, 0.3),
    rightItem3().opacity(0, 0.3),
    rightItem4().opacity(0, 0.3),
    centerLine().opacity(0, 0.3),
    neqSign().opacity(0, 0.3),
    conclusionBox().opacity(0, 0.4),
  );
});
