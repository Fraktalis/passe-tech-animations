import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {all, createRef, easeInOutCubic, easeOutCubic, sequence, waitFor, waitUntil} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const COLORS = {
    bg:        '#0D1117',
    cream:     '#F9F9F6',
    ghost:     '#3D444D',
    ghostText: '#484F58',
    rose:      '#FF3E6C',  // membrane / namespace
    vert:      '#6DFF8A',  // ADN / Docker image
    jaune:     '#FFE14D',  // mitochondrie / ATP
    bleu:      '#58A6FF',  // cgroups / budget
    danger:    '#F85149',  // apoptose / dysfonctionnement
    terminal:  '#161B22',
    processBg: '#1C2128',
  };

  // ─── Refs ─────────────────────────────────────────────────────────────────
  const gridRef      = createRef<Grid>();
  const titleRef     = createRef<Txt>();
  const subtitleRef  = createRef<Txt>();

  // Cellule — couches concentriques
  const cellOuter    = createRef<Rect>();   // membrane plasmique
  const membraneGlow = createRef<Rect>();   // halo rose membrane
  const nucleus      = createRef<Rect>();   // noyau (ADN)
  const nucleusGlow  = createRef<Rect>();   // halo vert noyau
  const mito1        = createRef<Rect>();   // mitochondrie 1
  const mito2        = createRef<Rect>();   // mitochondrie 2

  // Badge lecture seule (affiché dans le noyau)
  const readOnlyBadge = createRef<Rect>();

  // Badges cgroups / budget ATP
  const atpBadge      = createRef<Rect>();
  const glucoseBadge  = createRef<Rect>();

  // Boîte d'analogie Docker (droite)
  const analogyBox    = createRef<Rect>();
  const analogyTitle  = createRef<Txt>();
  const analogyBody   = createRef<Txt>();

  // Terminal apoptose
  const termBox  = createRef<Rect>();
  const termLine = createRef<Txt>();

  // Caption bas
  const captionNum = createRef<Txt>();
  const captionTxt = createRef<Txt>();

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE TREE
  // ═══════════════════════════════════════════════════════════════════════════
  view.add(
    <Layout>
      <Rect width={'100%'} height={'100%'} fill={COLORS.bg} zIndex={-2} />
      <Grid
        ref={gridRef}
        width={'100%'} height={'100%'}
        stroke={COLORS.ghost}
        lineWidth={1}
        spacing={() => vW() * 0.031}
        opacity={0}
        zIndex={-1}
      />

      {/* ─── Titre ─── */}
      <Txt
        ref={titleRef}
        text="BIOLOGIE & DOCKER"
        fill={COLORS.cream}
        fontSize={() => vW() * 0.030}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.41}
        opacity={0}
      />
      <Txt
        ref={subtitleRef}
        text="la cellule eucaryote est un container biologique"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.013}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.345}
        opacity={0}
      />

      {/* ─── Halo membrane (derrière la bordure) ─── */}
      <Rect
        ref={membraneGlow}
        x={() => vW() * -0.10}
        y={() => vH() * 0.020}
        width={() => vW() * 0.320}
        height={() => vH() * 0.530}
        stroke={COLORS.rose}
        lineWidth={10}
        radius={() => vW() * 0.075}
        opacity={0}
        shadowColor={COLORS.rose}
        shadowBlur={() => vW() * 0.030}
      />

      {/* ─── Cellule — bordure membrane ─── */}
      <Rect
        ref={cellOuter}
        x={() => vW() * -0.10}
        y={() => vH() * 0.020}
        width={() => vW() * 0.320}
        height={() => vH() * 0.530}
        stroke={COLORS.rose}
        lineWidth={3}
        radius={() => vW() * 0.075}
        fill={`${COLORS.rose}05`}
        opacity={0}
      />

      {/* ─── Mitochondrie 1 ─── */}
      <Rect
        ref={mito1}
        x={() => vW() * -0.170}
        y={() => vH() * 0.060}
        width={() => vW() * 0.080}
        height={() => vH() * 0.058}
        stroke={COLORS.jaune}
        lineWidth={2}
        radius={() => vW() * 0.012}
        fill={`${COLORS.jaune}10`}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'}
        gap={() => vH() * 0.004}
      >
        <Txt text="MITO" fill={COLORS.jaune} fontSize={() => vW() * 0.009} fontWeight={700} fontFamily={'DM Mono, monospace'} />
        <Txt text="ATP ×n" fill={COLORS.ghostText} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
      </Rect>

      {/* ─── Mitochondrie 2 ─── */}
      <Rect
        ref={mito2}
        x={() => vW() * -0.025}
        y={() => vH() * 0.155}
        width={() => vW() * 0.080}
        height={() => vH() * 0.058}
        stroke={COLORS.jaune}
        lineWidth={2}
        radius={() => vW() * 0.012}
        fill={`${COLORS.jaune}10`}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'}
        gap={() => vH() * 0.004}
      >
        <Txt text="MITO" fill={COLORS.jaune} fontSize={() => vW() * 0.009} fontWeight={700} fontFamily={'DM Mono, monospace'} />
        <Txt text="ATP ×n" fill={COLORS.ghostText} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
      </Rect>

      {/* ─── Halo noyau ─── */}
      <Rect
        ref={nucleusGlow}
        x={() => vW() * -0.10}
        y={() => vH() * -0.090}
        width={() => vW() * 0.148}
        height={() => vH() * 0.175}
        stroke={COLORS.vert}
        lineWidth={7}
        lineDash={[10, 6]}
        radius={() => vW() * 0.020}
        opacity={0}
        shadowColor={COLORS.vert}
        shadowBlur={() => vW() * 0.025}
      />

      {/* ─── Noyau (ADN) ─── */}
      <Rect
        ref={nucleus}
        x={() => vW() * -0.10}
        y={() => vH() * -0.090}
        width={() => vW() * 0.148}
        height={() => vH() * 0.175}
        stroke={COLORS.vert}
        lineWidth={2}
        lineDash={[10, 6]}
        radius={() => vW() * 0.020}
        fill={`${COLORS.vert}08`}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'}
        gap={() => vH() * 0.010}
      >
        <Txt text="ADN" fill={COLORS.vert} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'DM Mono, monospace'} />
        {/* Badge lecture seule — caché au départ */}
        <Rect
          ref={readOnlyBadge}
          width={() => vW() * 0.095}
          height={() => vH() * 0.036}
          fill={`${COLORS.vert}18`}
          stroke={`${COLORS.vert}55`}
          lineWidth={1}
          radius={() => vW() * 0.004}
          opacity={0}
          layout alignItems={'center'} justifyContent={'center'}
        >
          <Txt text="READ ONLY" fill={COLORS.vert} fontSize={() => vW() * 0.009} fontWeight={700} fontFamily={'DM Mono, monospace'} />
        </Rect>
      </Rect>

      {/* ─── Badge ATP (cgroups) — au-dessus de mito1 ─── */}
      <Rect
        ref={atpBadge}
        x={() => vW() * -0.170}
        y={() => vH() * -0.010}
        width={() => vW() * 0.090}
        height={() => vH() * 0.046}
        fill={`${COLORS.bleu}12`}
        stroke={`${COLORS.bleu}50`}
        lineWidth={1}
        radius={() => vW() * 0.004}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'}
        gap={() => vH() * 0.004}
      >
        <Txt text="ATP" fill={COLORS.bleu} fontSize={() => vW() * 0.009} fontWeight={700} fontFamily={'DM Mono, monospace'} />
        <Txt text="budget limité" fill={COLORS.ghostText} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
      </Rect>

      {/* ─── Badge Glucose (cgroups) — au-dessus de mito2 ─── */}
      <Rect
        ref={glucoseBadge}
        x={() => vW() * -0.025}
        y={() => vH() * 0.095}
        width={() => vW() * 0.090}
        height={() => vH() * 0.046}
        fill={`${COLORS.bleu}12`}
        stroke={`${COLORS.bleu}50`}
        lineWidth={1}
        radius={() => vW() * 0.004}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'}
        gap={() => vH() * 0.004}
      >
        <Txt text="GLUCOSE" fill={COLORS.bleu} fontSize={() => vW() * 0.009} fontWeight={700} fontFamily={'DM Mono, monospace'} />
        <Txt text="↓ 0 = mort" fill={COLORS.ghostText} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
      </Rect>

      {/* ─── Boîte analogie Docker (droite) ─── */}
      <Rect
        ref={analogyBox}
        x={() => vW() * 0.280}
        y={() => vH() * 0.020}
        width={() => vW() * 0.285}
        height={() => vH() * 0.300}
        fill={COLORS.terminal}
        stroke={COLORS.ghost}
        lineWidth={2}
        radius={() => vW() * 0.008}
        opacity={0}
        layout direction={'column'}
        alignItems={'flex-start'}
        padding={() => vW() * 0.020}
        gap={() => vH() * 0.022}
      >
        <Txt
          ref={analogyTitle}
          text=""
          fill={COLORS.bleu}
          fontSize={() => vW() * 0.014}
          fontWeight={700}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          ref={analogyBody}
          text=""
          fill={COLORS.cream}
          fontSize={() => vW() * 0.012}
          fontFamily={'Space Grotesk'}
          textWrap
          width={'100%'}
          opacity={0.72}
          lineHeight={() => vH() * 0.048}
        />
      </Rect>

      {/* ─── Terminal apoptose ─── */}
      <Rect
        ref={termBox}
        x={() => vW() * 0.280}
        y={() => vH() * 0.020}
        width={() => vW() * 0.285}
        height={() => vH() * 0.160}
        fill={COLORS.terminal}
        stroke={COLORS.ghost}
        lineWidth={2}
        radius={() => vW() * 0.008}
        opacity={0}
        layout direction={'column'}
        padding={() => vW() * 0.018}
        gap={() => vH() * 0.014}
        clip
      >
        <Layout direction={'row'} gap={8} alignItems={'center'}>
          <Rect width={12} height={12} fill={'#F85149'} radius={6} />
          <Rect width={12} height={12} fill={'#D29922'} radius={6} />
          <Rect width={12} height={12} fill={'#3FB950'} radius={6} />
          <Txt text="  bash" fill={COLORS.ghostText} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} />
        </Layout>
        <Txt
          ref={termLine}
          text=""
          fill={COLORS.vert}
          fontSize={() => vW() * 0.014}
          fontFamily={'DM Mono, monospace'}
          fontWeight={600}
        />
      </Rect>

      {/* ─── Caption bas de frame ─── */}
      <Layout
        x={0}
        y={() => vH() * 0.432}
        layout direction={'row'}
        alignItems={'center'}
        gap={() => vW() * 0.010}
      >
        <Txt
          ref={captionNum}
          text=""
          fill={COLORS.rose}
          fontSize={() => vW() * 0.017}
          fontWeight={700}
          fontFamily={'DM Mono, monospace'}
          opacity={0}
        />
        <Txt
          ref={captionTxt}
          text=""
          fill={COLORS.cream}
          fontSize={() => vW() * 0.016}
          fontFamily={'Space Grotesk'}
          fontWeight={600}
          opacity={0}
        />
      </Layout>
    </Layout>,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  function* typewrite(ref: ReturnType<typeof createRef<Txt>>, text: string, charDelay = 0.04) {
    for (let i = 0; i <= text.length; i++) {
      yield* ref().text(text.substring(0, i), charDelay);
    }
  }

  function* showCaption(num: string, text: string, color: string) {
    if (captionNum().opacity() > 0) {
      yield* all(captionNum().opacity(0, 0.2), captionTxt().opacity(0, 0.2));
    }
    captionNum().text(num);
    captionNum().fill(color);
    captionTxt().text(text);
    yield* all(captionNum().opacity(1, 0.35), captionTxt().opacity(1, 0.35));
  }

  function* swapAnalogy(title: string, body: string) {
    if (analogyBox().opacity() > 0) {
      yield* analogyBox().opacity(0, 0.25);
    }
    analogyTitle().text(title);
    analogyBody().text(body);
    yield* analogyBox().opacity(1, 0.40);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Intro — cellule complète ─────────────────────────────────────────────
  yield* waitUntil('intro');

  yield* all(
    gridRef().opacity(0.12, 0.8),
    titleRef().opacity(1, 0.6),
  );
  yield* subtitleRef().opacity(1, 0.5);
  yield* waitFor(0.3);

  // Cellule apparaît couche par couche
  yield* cellOuter().opacity(1, 0.6);
  yield* sequence(0.15,
    nucleus().opacity(1, 0.5),
    mito1().opacity(1, 0.4),
    mito2().opacity(1, 0.4),
  );

  yield* waitFor(0.5);

  // ─── Section 1 — Membrane = Namespace ────────────────────────────────────
  yield* waitUntil('membrane');

  yield* showCaption('01', 'MEMBRANE PLASMIQUE', COLORS.rose);

  // Mise en évidence de la membrane
  yield* all(
    membraneGlow().opacity(0.55, 0.5),
    cellOuter().lineWidth(5, 0.4),
  );

  yield* swapAnalogy(
    '→ NAMESPACE',
    'Ne laisse entrer que ce qui est autorisé.\nIsole la cellule du reste du système.',
  );

  yield* waitFor(1);

  // ─── Section 2 — ATP = cgroups ────────────────────────────────────────────
  yield* waitUntil('atp');

  yield* all(
    membraneGlow().opacity(0, 0.3),
    cellOuter().lineWidth(3, 0.3),
  );

  yield* showCaption('02', 'BUDGET ATP / GLUCOSE', COLORS.bleu);

  // Pulse mitochondries
  yield* all(
    mito1().scale(1.12, 0.20, easeOutCubic),
    mito2().scale(1.12, 0.20, easeOutCubic),
  );
  yield* all(
    mito1().scale(1.0, 0.18, easeOutCubic),
    mito2().scale(1.0, 0.18, easeOutCubic),
  );

  // Badges cgroups apparaissent
  yield* sequence(0.12,
    atpBadge().opacity(1, 0.4),
    glucoseBadge().opacity(1, 0.4),
  );

  yield* swapAnalogy(
    '→ CGROUPS',
    'Budget de ressources plafonné.\nATP = 0 → cellule meurt.\nRAM dépassée → container tué.',
  );

  yield* waitFor(1);

  // ─── Section 3 — ADN = Docker image ──────────────────────────────────────
  yield* waitUntil('dna');

  yield* all(
    atpBadge().opacity(0, 0.3),
    glucoseBadge().opacity(0, 0.3),
  );

  yield* showCaption('03', 'ADN — PLAN DE CONSTRUCTION', COLORS.vert);

  // Halo noyau
  yield* all(
    nucleusGlow().opacity(0.45, 0.5),
    nucleus().lineWidth(4, 0.4),
  );

  // Badge READ ONLY apparaît dans le noyau
  yield* readOnlyBadge().opacity(1, 0.45);

  yield* swapAnalogy(
    '→ IMAGE DOCKER',
    "Immuable. Jamais exécuté directement.\nADN → ARN → protéines\n≡\nImage → container en cours d'exécution.",
  );

  yield* waitFor(1);

  // ─── Section 4 — Apoptose = docker stop ──────────────────────────────────
  yield* waitUntil('apoptose');

  yield* all(
    nucleusGlow().opacity(0, 0.3),
    nucleus().lineWidth(2, 0.3),
    readOnlyBadge().opacity(0, 0.3),
    analogyBox().opacity(0, 0.3),
  );

  yield* showCaption('04', 'APOPTOSE', COLORS.danger);

  // Cellule vire au rouge — dysfonctionnelle
  yield* all(
    cellOuter().stroke(COLORS.danger, 0.45),
    cellOuter().fill(`${COLORS.danger}08`, 0.45),
    mito1().stroke(COLORS.danger, 0.45),
    mito2().stroke(COLORS.danger, 0.45),
    nucleus().stroke(COLORS.danger, 0.45),
  );

  yield* waitFor(0.4);

  // Terminal docker stop
  yield* termBox().opacity(1, 0.4);
  yield* typewrite(termLine, '$ docker stop my-container', 0.045);

  yield* waitFor(0.35);

  // Cellule meurt proprement
  yield* all(
    cellOuter().opacity(0, 0.7, easeInOutCubic),
    nucleus().opacity(0, 0.5, easeInOutCubic),
    mito1().opacity(0, 0.5, easeInOutCubic),
    mito2().opacity(0, 0.5, easeInOutCubic),
    cellOuter().scale(0.82, 0.7, easeInOutCubic),
  );

  yield* waitFor(0.3);
  yield* termBox().opacity(0, 0.25);

  // Analogie finale
  yield* swapAnalogy(
    '→ DOCKER STOP',
    'Destruction propre du container.\nSans dégâts collatéraux.\nNouvelle version relancée — ni vu ni connu.',
  );

  yield* waitFor(1.5);

  // ─── Fin ─────────────────────────────────────────────────────────────────
  yield* waitUntil('endScene');

  yield* all(
    analogyBox().opacity(0, 0.5),
    captionNum().opacity(0, 0.5),
    captionTxt().opacity(0, 0.5),
    titleRef().opacity(0, 0.5),
    subtitleRef().opacity(0, 0.5),
    gridRef().opacity(0, 0.5),
  );
});
