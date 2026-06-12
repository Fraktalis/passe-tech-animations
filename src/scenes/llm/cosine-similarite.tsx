/**
 * @file cosine-similarite.tsx
 * @description Vidéo 1 LLM — Score Q·K/√d_k et pondération V par softmax.
 *
 * Rigueur factuelle :
 *   - Le score d'attention N'EST PAS une similarité cosinus — c'est un produit
 *     scalaire brut Q·K divisé par √d_k pour stabiliser les gradients.
 *   - Avec d_k=64 et |Q|=|K|=√64, le score Q·K/√d_k ≈ cos(θ) × 8 → non borné.
 *   - Après softmax (simplifié : 1 token de référence à score 0), le poids est
 *     toujours STRICTEMENT POSITIF entre 0 et 1. Jamais négatif.
 *   - Score = 0 (Q⊥K) → plancher neutre = e⁰/(e⁰+1) = 0.5 (pas zéro).
 *   - Score négatif → poids < 0.5, mais jamais zéro (sauf −∞, cas du masking).
 *   - V est toujours une contribution POSITIVE (moyenne pondérée).
 *
 * Show, don't tell :
 *   - Q (cyan) fixe, K (amber) tourne via un signal réactif.
 *   - Score et poids affichés en temps réel.
 *   - Barre V (vert) toujours positive — se réduit vers 0 mais ne bascule jamais.
 *   - Tick "neutre" visible à 0.5 : quand Q⊥K, la barre V s'arrête exactement là.
 */

import {makeScene2D, Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d';
import {
  all, waitFor, waitUntil, createRef, createSignal,
  easeInOutCubic, easeOutCubic,
} from '@motion-canvas/core';
import {ConnectionArrow, Callout} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const MONO = 'JetBrains Mono, DM Mono, monospace';
  const SANS = 'Space Grotesk';

  // ── Géométrie des vecteurs ─────────────────────────────────────────────────
  const originX   = () => -vW() * 0.12;
  const originY   = () => 0;
  const vectorLen = () => vW() * 0.22;
  const arcRadius = () => vW() * 0.07;

  const ANGLE_Q = -Math.PI * 0.28;
  const angleK  = createSignal(ANGLE_Q + 0.12);

  const qEndX = () => originX() + Math.cos(ANGLE_Q) * vectorLen();
  const qEndY = () => originY() + Math.sin(ANGLE_Q) * vectorLen();
  const kEndX = () => originX() + Math.cos(angleK()) * vectorLen();
  const kEndY = () => originY() + Math.sin(angleK()) * vectorLen();

  // Cosinus de l'angle entre Q et K (composante directionnelle)
  const cosineSim = () => Math.cos(angleK() - ANGLE_Q);

  // Score Q·K/√d_k — avec |Q|=|K|=√d_k, d_k=64 → scale=8
  // Plage réaliste ≈ [-8, +8] (vs cosine borné à [-1,+1])
  const D_K_SCALE = 8;
  const rawScore = () => cosineSim() * D_K_SCALE;

  // Poids softmax simplifié (2 tokens : K + 1 token de référence à score 0)
  // weight = exp(score) / (exp(score) + exp(0)) = sigmoid(score)
  // → TOUJOURS dans (0, 1), JAMAIS négatif
  // Plancher neutre : score=0 → e⁰/(e⁰+1) = 0.5
  const attentionWeight = () => {
    const s = rawScore();
    return Math.exp(s) / (Math.exp(s) + 1);
  };

  // Labels vecteurs (au-delà du tip)
  const labelDist  = () => vectorLen() + vW() * 0.042;
  const qLabelX    = () => originX() + Math.cos(ANGLE_Q) * labelDist();
  const qLabelY    = () => originY() + Math.sin(ANGLE_Q) * labelDist();
  const kLabelX    = () => originX() + Math.cos(angleK()) * labelDist();
  const kLabelY    = () => originY() + Math.sin(angleK()) * labelDist();

  // Arc θ
  const thetaMidAngle  = () => (ANGLE_Q + angleK()) / 2;
  const thetaLabelDist = () => arcRadius() + vW() * 0.028;
  const thetaLabelX    = () => originX() + Math.cos(thetaMidAngle()) * thetaLabelDist();
  const thetaLabelY    = () => originY() + Math.sin(thetaMidAngle()) * thetaLabelDist();

  const arcPoints = (): [number, number][] => {
    const startAngle = ANGLE_Q;
    const endAngle   = angleK();
    const r  = arcRadius();
    const ox = originX();
    const oy = originY();
    const pts: [number, number][] = [];
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      const a = startAngle + (endAngle - startAngle) * t;
      pts.push([ox + Math.cos(a) * r, oy + Math.sin(a) * r] as [number, number]);
    }
    return pts;
  };

  // ── Score bar (Q·K/√d_k, plage [-8, +8]) ─────────────────────────────────
  const barCenterX = () => vW() * 0.32;
  const barCenterY = () => -vH() * 0.06;
  const barHalfW   = () => vW() * 0.11;
  // Le marqueur mappe cosineSim [-1,+1] sur [-barHalfW, +barHalfW]
  // ce qui correspond à rawScore [-8,+8] avec les labels mis à jour
  const markerX = () => barCenterX() + cosineSim() * barHalfW();

  // ── Barre V (poids softmax, toujours [0,1], JAMAIS négatif) ───────────────
  const vBarCenterX  = () => vW() * 0.32;
  const vBarCenterY  = () => vH() * 0.24;
  const vMaxHalfW    = () => vW() * 0.11;
  const vBarLeftEdge = () => vBarCenterX() - vMaxHalfW();
  // Largeur de la barre V = poids * largeur totale (toujours ≥ 0)
  const vBarWidth    = () => attentionWeight() * vMaxHalfW() * 2;
  // Position du plancher neutre (poids=0.5, score=0) = centre de la barre
  const vNeutralX    = () => vBarCenterX();   // = leftEdge + vMaxHalfW

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef        = createRef<Grid>();
  const titleRef       = createRef<Txt>();
  const originDotRef   = createRef<Rect>();

  const vectorQRef     = createRef<ConnectionArrow>();
  const labelQRef      = createRef<Txt>();
  const vectorKRef     = createRef<ConnectionArrow>();
  const labelKRef      = createRef<Txt>();

  const thetaArcRef    = createRef<Line>();
  const thetaLabelRef  = createRef<Txt>();

  const scoreCosLabelRef = createRef<Txt>();
  const scoreValueRef    = createRef<Txt>();
  const scoreTrackRef    = createRef<Rect>();
  const scoreMarkerRef   = createRef<Rect>();
  const scoreMinus8Ref   = createRef<Txt>();
  const scoreZeroRef     = createRef<Txt>();
  const scorePlus8Ref    = createRef<Txt>();

  const formulaRef = createRef<Callout>();

  // V bar refs
  const vSectionLabelRef = createRef<Txt>();
  const vTrackRef        = createRef<Rect>();
  const vFillRef         = createRef<Rect>();     // barre vert, toujours positive
  const vNeutralTickRef  = createRef<Rect>();     // tick "plancher neutre" à 0.5
  const vNeutralLabelRef = createRef<Txt>();      // label "0.5 (neutre)"
  const vLabel0Ref       = createRef<Txt>();      // "0" bout gauche
  const vLabel1Ref       = createRef<Txt>();      // "1" bout droit
  const vWeightRef       = createRef<Txt>();      // "× 0.72" (réactif)

  // ════════════════════════════════════════════════════════════════════════════
  // SCENE TREE
  // ════════════════════════════════════════════════════════════════════════════
  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>
      <Rect key="bg" width={'100%'} height={'100%'} fill={PALETTE.bg} zIndex={-2} />
      <Grid key="grid" ref={gridRef}
        width={'100%'} height={'100%'}
        spacing={() => vW() * 0.05}
        stroke={PALETTE.ghost} lineWidth={1} opacity={0} zIndex={-1} />

      <Txt key="title" ref={titleRef}
        text="ATTENTION : SCORE Q·K"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.014}
        fontFamily={MONO} fontWeight={700}
        x={() => originX()} y={() => -vH() * 0.42}
        opacity={0} />

      <Rect key="origin-dot" ref={originDotRef}
        width={() => vW() * 0.011} height={() => vW() * 0.011}
        fill={PALETTE.secondary}
        radius={() => vW() * 0.006}
        x={originX} y={originY}
        opacity={0} />

      {/* ── Vecteur Q (fixe) ─────────────────────────────────────────────── */}
      <ConnectionArrow key="vector-q" ref={vectorQRef}
        from={() => [originX(), originY()]}
        to={() => [qEndX(), qEndY()]}
        stroke={PALETTE.cyan} lineWidth={3} arrowSize={12}
        end={0} opacity={0} />
      <Txt key="label-q" ref={labelQRef}
        text="Q"
        fill={PALETTE.cyan}
        fontSize={() => vW() * 0.024} fontFamily={MONO} fontWeight={700}
        x={qLabelX} y={qLabelY}
        opacity={0} />

      {/* ── Vecteur K (réactif à angleK) ──────────────────────────────────── */}
      <ConnectionArrow key="vector-k" ref={vectorKRef}
        from={() => [originX(), originY()]}
        to={() => [kEndX(), kEndY()]}
        stroke={PALETTE.amber} lineWidth={3} arrowSize={12}
        end={0} opacity={0} />
      <Txt key="label-k" ref={labelKRef}
        text="K"
        fill={PALETTE.amber}
        fontSize={() => vW() * 0.024} fontFamily={MONO} fontWeight={700}
        x={kLabelX} y={kLabelY}
        opacity={0} />

      {/* ── Arc θ ─────────────────────────────────────────────────────────── */}
      <Line key="theta-arc" ref={thetaArcRef}
        points={arcPoints}
        stroke={PALETTE.secondary} lineWidth={2}
        opacity={0} />
      <Txt key="theta-label" ref={thetaLabelRef}
        text="θ"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.018} fontFamily={SANS} fontWeight={700}
        x={thetaLabelX} y={thetaLabelY}
        opacity={0} />

      {/* ── Score Q·K/√d_k ────────────────────────────────────────────────── */}
      <Txt key="score-formula-label" ref={scoreCosLabelRef}
        text="Q·K / √d_k"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.016} fontFamily={MONO}
        x={() => barCenterX()} y={() => barCenterY() - vH() * 0.20}
        opacity={0} />
      <Txt key="score-value" ref={scoreValueRef}
        text={() => rawScore().toFixed(1)}
        fill={PALETTE.cream}
        fontSize={() => vW() * 0.052} fontFamily={MONO} fontWeight={700}
        x={() => barCenterX()} y={() => barCenterY() - vH() * 0.11}
        opacity={0} />
      <Rect key="score-track" ref={scoreTrackRef}
        width={() => barHalfW() * 2} height={() => vH() * 0.007}
        fill={PALETTE.ghost}
        radius={() => vH() * 0.004}
        x={() => barCenterX()} y={() => barCenterY()}
        opacity={0} />
      <Rect key="score-marker" ref={scoreMarkerRef}
        width={() => vW() * 0.007} height={() => vH() * 0.04}
        fill={PALETTE.cream}
        radius={() => vW() * 0.002}
        x={markerX} y={() => barCenterY()}
        opacity={0} />
      <Txt key="score-minus8" ref={scoreMinus8Ref}
        text="−8"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.012} fontFamily={MONO}
        x={() => barCenterX() - barHalfW()} y={() => barCenterY() + vH() * 0.048}
        opacity={0} />
      <Txt key="score-zero" ref={scoreZeroRef}
        text="0"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.012} fontFamily={MONO}
        x={() => barCenterX()} y={() => barCenterY() + vH() * 0.048}
        opacity={0} />
      <Txt key="score-plus8" ref={scorePlus8Ref}
        text="+8"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.012} fontFamily={MONO}
        x={() => barCenterX() + barHalfW()} y={() => barCenterY() + vH() * 0.048}
        opacity={0} />

      {/* ── Formule ───────────────────────────────────────────────────────── */}
      <Callout key="formula" ref={formulaRef}
        title="score = Q·K / √d_k"
        body="Produit scalaire brut, non borné (≈ ±8 pour d_k=64)"
        color={PALETTE.secondary}
        width={() => vW() * 0.30} height={() => vH() * 0.13}
        x={() => vW() * 0.28} y={() => -vH() * 0.36}
        opacity={0} />

      {/* ── Barre V : poids softmax × V ──────────────────────────────────── */}
      {/* Toujours positive — la softmax garantit des poids ∈ (0,1) */}

      <Txt key="v-section-label" ref={vSectionLabelRef}
        text="poids softmax · V"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.012} fontFamily={MONO}
        x={() => vBarCenterX()} y={() => vBarCenterY() - vH() * 0.065}
        opacity={0} />

      {/* Piste (0 → 1) */}
      <Rect key="v-track" ref={vTrackRef}
        width={() => vMaxHalfW() * 2} height={() => vH() * 0.005}
        fill={PALETTE.ghost}
        radius={() => vH() * 0.003}
        x={() => vBarCenterX()} y={() => vBarCenterY()}
        opacity={0} />

      {/* Remplissage vert — ancré au bord gauche, croît vers la droite */}
      <Rect key="v-fill" ref={vFillRef}
        width={vBarWidth}
        height={() => vH() * 0.03}
        offset={[-1, 0]}
        fill={PALETTE.vert}
        radius={() => vH() * 0.004}
        x={vBarLeftEdge} y={() => vBarCenterY()}
        opacity={0} />

      {/* Tick plancher neutre (score=0 → poids=0.5) */}
      <Rect key="v-neutral-tick" ref={vNeutralTickRef}
        width={() => vW() * 0.0025} height={() => vH() * 0.048}
        fill={PALETTE.secondary}
        x={vNeutralX} y={() => vBarCenterY()}
        opacity={0} />
      <Txt key="v-neutral-label" ref={vNeutralLabelRef}
        text="0.5"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.011} fontFamily={MONO}
        x={vNeutralX} y={() => vBarCenterY() + vH() * 0.048}
        opacity={0} />

      {/* Labels 0 et 1 */}
      <Txt key="v-label-0" ref={vLabel0Ref}
        text="0"
        fill={PALETTE.ghost}
        fontSize={() => vW() * 0.011} fontFamily={MONO}
        x={vBarLeftEdge} y={() => vBarCenterY() + vH() * 0.048}
        opacity={0} />
      <Txt key="v-label-1" ref={vLabel1Ref}
        text="1"
        fill={PALETTE.ghost}
        fontSize={() => vW() * 0.011} fontFamily={MONO}
        x={() => vBarCenterX() + vMaxHalfW()} y={() => vBarCenterY() + vH() * 0.048}
        opacity={0} />

      {/* Multiplicateur réactif */}
      <Txt key="v-weight" ref={vWeightRef}
        text={() => `× ${attentionWeight().toFixed(2)}`}
        fill={PALETTE.vert}
        fontSize={() => vW() * 0.020} fontFamily={MONO} fontWeight={700}
        x={() => vBarCenterX()} y={() => vBarCenterY() + vH() * 0.095}
        opacity={0} />
    </Layout>,
  );

  // ════════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ════════════════════════════════════════════════════════════════════════════

  // ── 1. Intro ──────────────────────────────────────────────────────────────
  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.08, 0.8),
    titleRef().opacity(1, 0.5),
    originDotRef().opacity(1, 0.4),
  );

  // ── 2. Vecteur Q ──────────────────────────────────────────────────────────
  yield* waitUntil('query');
  vectorQRef().opacity(1);
  yield* vectorQRef().end(1, 0.5, easeOutCubic);
  yield* labelQRef().opacity(1, 0.3);

  // ── 3. Vecteur K + arc θ + score display (cos ≈ 0.99 → score ≈ +7.9) ─────
  yield* waitUntil('key');
  vectorKRef().opacity(1);
  yield* vectorKRef().end(1, 0.5, easeOutCubic);
  yield* labelKRef().opacity(1, 0.3);
  yield* waitFor(0.2);
  yield* all(
    thetaArcRef().opacity(0.8, 0.4),
    thetaLabelRef().opacity(1, 0.4),
  );
  yield* waitFor(0.2);
  yield* all(
    scoreCosLabelRef().opacity(1, 0.4),
    scoreValueRef().opacity(1, 0.4),
    scoreTrackRef().opacity(1, 0.4),
    scoreMarkerRef().opacity(1, 0.4),
    scoreMinus8Ref().opacity(0.6, 0.4),
    scoreZeroRef().opacity(0.6, 0.4),
    scorePlus8Ref().opacity(0.6, 0.4),
  );
  yield* waitFor(0.5);

  // ── 4. K → perpendiculaire (score → 0.0, plancher neutre) ─────────────────
  yield* waitUntil('perpendicular');
  yield* angleK(ANGLE_Q + Math.PI / 2, 0.9, easeInOutCubic);
  // Score = 0 : ni pertinent ni rejeté. On accentue le zero.
  yield* scoreValueRef().fill(PALETTE.cream, 0.15);
  yield* waitFor(0.5);

  // ── 5. K → opposé (score → −7.9, poids faible mais pas zéro) ─────────────
  yield* waitUntil('opposed');
  yield* angleK(ANGLE_Q + Math.PI, 0.9, easeInOutCubic);
  yield* scoreValueRef().fill(PALETTE.dsRose, 0.3);
  yield* waitFor(0.5);

  // ── 6. K revient quasi-aligné (score → +7.9) ──────────────────────────────
  yield* waitUntil('realign');
  yield* scoreValueRef().fill(PALETTE.cream, 0.15);
  yield* angleK(ANGLE_Q + 0.05, 1.2, easeInOutCubic);
  yield* scoreValueRef().fill(PALETTE.dsGreen, 0.4);
  yield* waitFor(0.4);

  // ── 7. Formule + légende ──────────────────────────────────────────────────
  yield* waitUntil('formula');
  yield* formulaRef().opacity(1, 0.4);
  yield* formulaRef().hold();

  // ── 8. Barre V apparaît — quasi-pleine (poids ≈ 1.00) ────────────────────
  yield* waitUntil('show-v');
  yield* all(
    vSectionLabelRef().opacity(1, 0.4),
    vTrackRef().opacity(1, 0.4),
    vFillRef().opacity(1, 0.4),
    vNeutralTickRef().opacity(0.7, 0.4),
    vNeutralLabelRef().opacity(0.7, 0.4),
    vLabel0Ref().opacity(0.5, 0.4),
    vLabel1Ref().opacity(0.5, 0.4),
    vWeightRef().opacity(1, 0.4),
  );
  yield* waitFor(0.7);

  // ── 9. K repivote — V scale en direct, plancher visible à 0.5 ─────────────
  yield* waitUntil('v-scale');

  // K → perpendiculaire : V s'arrête exactement sur le tick "plancher neutre"
  yield* all(
    angleK(ANGLE_Q + Math.PI / 2, 0.9, easeInOutCubic),
    scoreValueRef().fill(PALETTE.cream, 0.4),
  );
  // Accentuer le plancher neutre quand V le touche
  yield* vNeutralTickRef().opacity(1, 0.2);
  yield* vNeutralLabelRef().fill(PALETTE.cream, 0.2);
  yield* waitFor(0.5);

  // K → opposé : score −7.9, poids ≈ 0.0003 — V quasi-invisible mais pas zéro
  yield* all(
    angleK(ANGLE_Q + Math.PI, 0.9, easeInOutCubic),
    scoreValueRef().fill(PALETTE.dsRose, 0.5),
    vNeutralTickRef().opacity(0.7, 0.4),
    vNeutralLabelRef().fill(PALETTE.secondary, 0.4),
  );
  yield* waitFor(0.5);

  // K revient aligné : V reprend sa pleine taille
  yield* all(
    angleK(ANGLE_Q + 0.05, 1.2, easeInOutCubic),
    scoreValueRef().fill(PALETTE.dsGreen, 0.5),
  );
  yield* waitFor(0.6);

  // ── 10. Fin ────────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.5),
    titleRef().opacity(0, 0.5),
    originDotRef().opacity(0, 0.4),
    vectorQRef().opacity(0, 0.4),
    labelQRef().opacity(0, 0.4),
    vectorKRef().opacity(0, 0.4),
    labelKRef().opacity(0, 0.4),
    thetaArcRef().opacity(0, 0.4),
    thetaLabelRef().opacity(0, 0.4),
    scoreCosLabelRef().opacity(0, 0.4),
    scoreValueRef().opacity(0, 0.4),
    scoreTrackRef().opacity(0, 0.4),
    scoreMarkerRef().opacity(0, 0.4),
    scoreMinus8Ref().opacity(0, 0.4),
    scoreZeroRef().opacity(0, 0.4),
    scorePlus8Ref().opacity(0, 0.4),
    formulaRef().opacity(0, 0.4),
    vSectionLabelRef().opacity(0, 0.4),
    vTrackRef().opacity(0, 0.4),
    vFillRef().opacity(0, 0.4),
    vNeutralTickRef().opacity(0, 0.4),
    vNeutralLabelRef().opacity(0, 0.4),
    vLabel0Ref().opacity(0, 0.4),
    vLabel1Ref().opacity(0, 0.4),
    vWeightRef().opacity(0, 0.4),
  );
  yield* waitFor(0.3);
});
