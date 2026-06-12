/**
 * @file summary-pipeline.tsx
 * @description Vidéo 1 LLM — Résumé global : le parcours d'une phrase de bout en bout.
 *
 * Show, don't tell : on suit UNE phrase à travers toutes les étapes vues dans la vidéo,
 * et à chaque station on montre LA FORME que prend la donnée intermédiaire.
 *
 *   1. TEXTE         — « La capitale de la France est »
 *   2. TOKENISATION  — fragments réels (pas des mots) : convention d'espace « · »,
 *                      et un mot scindé en sous-mots (·capit + ale).
 *   3. VECTEURS      — chaque token devient des NOMBRES (embeddings)
 *   4. ATTENTION     — le dernier token regarde tous les autres ; éventail de liens
 *                      pondérés (poids forts vers ·France / ·capit) → Σ pondérée des V.
 *   5. PROBAS        — distribution sur le prochain TOKEN (·Paris l'emporte)
 *   6. DÉTOKENISATION— le token ·Paris est redécodé en texte « Paris » → réinjecté.
 *
 * ⚠ Découpage des tokens + poids d'attention = ILLUSTRATIFS. À confirmer contre le vrai
 *   tokenizer o200k (GPT-4o/o1) avant tournage. La convention « · » = espace de tête.
 *
 * Couleur de flux = cyan ; token gagnant / sortie texte = vert.
 */

import {makeScene2D, Circle, Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d';
import {
  all, sequence, waitFor, waitUntil, createRef,
  easeInOutCubic, easeOutCubic, easeOutBack,
} from '@motion-canvas/core';
import {Callout} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const MONO = 'JetBrains Mono, DM Mono, monospace';
  const SANS = 'Space Grotesk';

  // ── Géométrie des 6 stations ──────────────────────────────────────────────
  const N = 6;
  const cardX = (i: number) => () => (i - (N - 1) / 2) * vW() * 0.16;
  const Wc = () => vW() * 0.13;
  const Hc = () => vH() * 0.34;
  const halfW = () => Wc() / 2;

  const STAGES = ['1 · TEXTE', '2 · TOKENISATION', '3 · VECTEURS', '4 · ATTENTION', '5 · PROBAS', '6 · DÉTOKEN.'];

  // ── Tokens (⚠ illustratifs) — « · » = espace de tête ; « capitale » scindé ──
  const TOKENS = ['La', '·capit', 'ale', '·de', '·la', '·France', '·est'];
  // couleurs : les 2 fragments de « capitale » partagent une teinte (mot scindé)
  const TOKEN_COLORS = [
    PALETTE.cyan, PALETTE.jaune, PALETTE.jaune, PALETTE.vert,
    PALETTE.blue, PALETTE.amber, PALETTE.cyan,
  ];
  const T = TOKENS.length;

  // ── Refs : décor + stations ───────────────────────────────────────────────
  const gridRef   = createRef<Grid>();
  const titleRef  = createRef<Txt>();
  const cards     = STAGES.map(() => createRef<Rect>());
  const stageLabels = STAGES.map(() => createRef<Txt>());
  const connectors = Array.from({length: N - 1}, () => createRef<Line>());
  const pulse     = createRef<Circle>();
  const content   = STAGES.map(() => createRef<Layout>());

  // Station 1 : texte
  const inputTxt = createRef<Txt>();

  // Station 2 : tokenisation
  const tokenChips = TOKENS.map(() => createRef<Rect>());
  const spaceLegend = createRef<Txt>();

  // Station 3 : vecteurs — un vecteur (embedding) par token, tronqué par « ⋯ »
  const VECS = [
    '0.21 −0.04 0.88 0.13 ⋯',
    '−0.31 0.07 0.66 −0.18 ⋯',
    '0.40 0.02 −0.77 0.34 ⋯',
    '0.45 0.12 −0.50 0.28 ⋯',
    '−0.22 0.83 0.05 −0.41 ⋯',
    '0.63 −0.15 0.27 0.94 ⋯',
    '0.08 0.49 −0.62 0.11 ⋯',
  ];
  const vectorRows = VECS.map(() => createRef<Rect>());
  const dimCallout = createRef<Callout>();

  // Station 4 : attention (éventail pondéré du dernier token)
  const attnWeights = [0.05, 0.22, 0.04, 0.03, 0.06, 0.45, 0.15]; // ⚠ illustratif, Σ≈1
  const attnDots = TOKENS.map(() => createRef<Circle>());
  const attnArcs = TOKENS.map(() => createRef<Line>());
  const queryNode = createRef<Circle>();
  const attnTokX = () => -Wc() * 0.30;
  const attnTokY = (i: number) => () => (i - (T - 1) / 2) * vH() * 0.040;
  const attnQX   = () => Wc() * 0.30;
  const attnDotR = () => vW() * 0.005;

  // Station 5 : probabilités (sur le prochain TOKEN)
  const CANDIDATES = [
    {tok: '·Paris', p: 0.91, win: true},
    {tok: '·Lyon',  p: 0.03, win: false},
    {tok: '·Nice',  p: 0.02, win: false},
    {tok: '…',      p: 0.04, win: false},
  ];
  const probBars   = CANDIDATES.map(() => createRef<Rect>());
  const probLabels = CANDIDATES.map(() => createRef<Txt>());
  const winPct     = createRef<Txt>();
  const barBaseY = () => vH() * 0.10;
  const barMaxH  = () => vH() * 0.17;

  // Station 6 : détokenisation (token → texte)
  const detokChip  = createRef<Rect>();
  const detokArrow = createRef<Line>();
  const detokText  = createRef<Txt>();
  const detokNote  = createRef<Txt>();

  // Boucle d'autorégression
  const loopArrow = createRef<Line>();
  const loopLabel = createRef<Txt>();

  // Station 6 : label interne du chip (pour mise à jour en autorégression)
  const detokChipLabel = createRef<Txt>();

  // ════════════════════════════════════════════════════════════════════════
  // SCENE TREE
  // ════════════════════════════════════════════════════════════════════════
  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>
      <Rect key="bg" width={'100%'} height={'100%'} fill={PALETTE.bg} zIndex={-2} />
      <Grid key="grid" ref={gridRef}
        width={'100%'} height={'100%'}
        spacing={() => vW() * 0.05}
        stroke={PALETTE.ghost} lineWidth={1} opacity={0} zIndex={-1} />

      <Txt key="title" ref={titleRef}
        text="GÉNÉRATION AUTOGREGRESSIVE"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.014}
        fontFamily={MONO} fontWeight={700}
        y={() => vH() * -0.43}
        opacity={0} />

      {/* connecteurs entre stations */}
      {connectors.map((c, i) => (
        <Line key={`conn-${i}`} ref={c}
          points={() => [
            [cardX(i)() + halfW(), 0],
            [cardX(i + 1)() - halfW(), 0],
          ]}
          stroke={PALETTE.ghost} lineWidth={2} endArrow arrowSize={9}
          end={0} opacity={0.5} />
      ))}

      {/* stations */}
      {STAGES.map((label, i) => (
        <Rect key={`card-${i}`} ref={cards[i]}
          width={Wc} height={Hc}
          fill={PALETTE.nodeBg} stroke={PALETTE.ghost} lineWidth={2}
          radius={() => vW() * 0.01}
          x={cardX(i)} y={0}
          opacity={0} />
      ))}
      {STAGES.map((label, i) => (
        <Txt key={`stage-label-${i}`} ref={stageLabels[i]}
          text={label} fill={PALETTE.secondary}
          fontSize={() => vW() * 0.0105} fontFamily={MONO} fontWeight={700}
          x={cardX(i)} y={() => vH() * -0.23}
          opacity={0} />
      ))}

      {/* pulse de données */}
      <Circle key="pulse" ref={pulse}
        width={() => vW() * 0.018} height={() => vW() * 0.018}
        fill={PALETTE.cyan}
        shadowColor={PALETTE.cyan} shadowBlur={() => vW() * 0.012}
        x={cardX(0)} y={0}
        opacity={0} />

      {/* ── station 1 : TEXTE ─────────────────────────────────────────────── */}
      <Layout key="c1" ref={content[0]} x={cardX(0)} opacity={0}>
        <Txt ref={inputTxt}
          text={'« La capitale\nde la France\nest »'}
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.014} fontFamily={MONO}
          textAlign={'center'} lineHeight={() => vW() * 0.022} />
      </Layout>

      {/* ── station 2 : TOKENISATION ──────────────────────────────────────── */}
      <Layout key="c2" ref={content[1]} x={cardX(1)} opacity={0}>
        {TOKENS.map((tok, i) => (
          <Rect key={`chip-${i}`} ref={tokenChips[i]}
            width={() => Wc() * 0.74} height={() => vH() * 0.032}
            fill={PALETTE.nodeActiveBg} stroke={TOKEN_COLORS[i]} lineWidth={2}
            radius={() => vW() * 0.004}
            y={() => (i - (T - 1) / 2) * vH() * 0.040}
            opacity={0} scale={0.7}>
            <Txt text={tok} fill={PALETTE.cream}
              fontSize={() => vW() * 0.0115} fontFamily={MONO} fontWeight={700} />
          </Rect>
        ))}
        <Txt key="space-legend" ref={spaceLegend}
          text="· = espace" fill={PALETTE.secondary}
          fontSize={() => vW() * 0.0095} fontFamily={MONO}
          y={() => vH() * 0.155} opacity={0} />
      </Layout>

      {/* ── station 3 : VECTEURS (un par token) ───────────────────────────── */}
      <Layout key="c3" ref={content[2]} x={cardX(2)} opacity={0}>
        {VECS.map((vec, i) => (
          <Rect key={`vec-${i}`} ref={vectorRows[i]}
            width={() => Wc() * 0.97} height={() => vH() * 0.034}
            fill={PALETTE.nodeActiveBg} stroke={TOKEN_COLORS[i]} lineWidth={1.5}
            radius={() => vW() * 0.003}
            y={() => (i - (T - 1) / 2) * vH() * 0.042}
            opacity={0} scale={0.8}>
            <Txt text={vec} fill={PALETTE.cyan}
              fontSize={() => vW() * 0.0082} fontFamily={MONO} />
          </Rect>
        ))}
      </Layout>

      {/* note : la vraie dimensionnalité des embeddings */}
      <Callout key="dim-callout" ref={dimCallout}
        title="Embeddings"
        body="≈ 12 288 nombres par token (GPT-3)"
        color={PALETTE.cyan}
        width={() => vW() * 0.24} height={() => vH() * 0.11}
        x={cardX(2)} y={() => vH() * -0.34}
        opacity={0} />

      {/* ── station 4 : ATTENTION ─────────────────────────────────────────── */}
      <Layout key="c4" ref={content[3]} x={cardX(3)} opacity={0}>
        {/* arcs pondérés (sous les nœuds) */}
        {TOKENS.map((_, i) => (
          <Line key={`attn-arc-${i}`} ref={attnArcs[i]}
            points={() => [[attnTokX(), attnTokY(i)()], [attnQX(), 0]]}
            stroke={PALETTE.cyan} lineWidth={1} opacity={0.25} end={0} />
        ))}
        {/* tokens (colonne gauche) */}
        {TOKENS.map((_, i) => (
          <Circle key={`attn-dot-${i}`} ref={attnDots[i]}
            width={() => attnDotR() * 2} height={() => attnDotR() * 2}
            fill={TOKEN_COLORS[i]}
            x={attnTokX} y={attnTokY(i)}
            opacity={0} scale={0} />
        ))}
        {/* query = dernier token */}
        <Circle key="query-node" ref={queryNode}
          width={() => attnDotR() * 3} height={() => attnDotR() * 3}
          fill={PALETTE.nodeActiveBg} stroke={PALETTE.cyan} lineWidth={2}
          x={attnQX} y={0}
          opacity={0}>
          <Txt text="Q" fill={PALETTE.cyan}
            fontSize={() => vW() * 0.011} fontFamily={MONO} fontWeight={700} />
        </Circle>
        <Txt key="attn-note" text="·est → ?"
          fill={PALETTE.secondary}
          fontSize={() => vW() * 0.0095} fontFamily={MONO}
          y={() => vH() * 0.155} />
      </Layout>

      {/* ── station 5 : PROBAS ────────────────────────────────────────────── */}
      <Layout key="c5" ref={content[4]} x={cardX(4)} opacity={0}>
        {CANDIDATES.map((cand, i) => (
          <Rect key={`bar-${i}`} ref={probBars[i]}
            width={() => Wc() * 0.13} height={0}
            offset={[0, 1]}
            fill={cand.win ? PALETTE.vert : PALETTE.secondary}
            radius={() => vW() * 0.003}
            x={() => (i - 1.5) * Wc() * 0.24} y={barBaseY} />
        ))}
        {CANDIDATES.map((cand, i) => (
          <Txt key={`bar-label-${i}`} ref={probLabels[i]}
            text={cand.tok}
            fill={cand.win ? PALETTE.vert : PALETTE.secondary}
            fontSize={() => vW() * 0.0095} fontFamily={MONO} fontWeight={cand.win ? 700 : 400}
            x={() => (i - 1.5) * Wc() * 0.24} y={() => barBaseY() + vH() * 0.035}
            opacity={0} />
        ))}
        <Txt key="win-pct" ref={winPct}
          text="0.91" fill={PALETTE.vert}
          fontSize={() => vW() * 0.013} fontFamily={MONO} fontWeight={700}
          x={() => -1.5 * Wc() * 0.24} y={() => barBaseY() - barMaxH() - vH() * 0.025}
          opacity={0} />
      </Layout>

      {/* ── station 6 : DÉTOKENISATION ────────────────────────────────────── */}
      <Layout key="c6" ref={content[5]} x={cardX(5)} opacity={0}>
        <Rect ref={detokChip}
          width={() => Wc() * 0.6} height={() => vH() * 0.05}
          fill={PALETTE.nodeActiveBg} stroke={PALETTE.cyan} lineWidth={2}
          radius={() => vW() * 0.004}
          y={() => vH() * -0.08}
          opacity={0} scale={0.7}>
          <Txt ref={detokChipLabel} text="·Paris" fill={PALETTE.cyan}
            fontSize={() => vW() * 0.013} fontFamily={MONO} fontWeight={700} />
        </Rect>
        <Line ref={detokArrow}
          points={() => [[0, vH() * -0.04], [0, vH() * 0.01]]}
          stroke={PALETTE.vert} lineWidth={2.5} endArrow arrowSize={9}
          end={0} opacity={0} />
        <Txt ref={detokText}
          text="Paris" fill={PALETTE.vert}
          fontSize={() => vW() * 0.03} fontFamily={SANS} fontWeight={700}
          y={() => vH() * 0.06} opacity={0} />
        <Txt ref={detokNote}
          text="· → espace" fill={PALETTE.secondary}
          fontSize={() => vW() * 0.0095} fontFamily={MONO}
          y={() => vH() * 0.135} opacity={0} />
      </Layout>

      {/* ── boucle d'autorégression ───────────────────────────────────────── */}
      <Line key="loop-arrow" ref={loopArrow}
        points={() => [
          [cardX(5)(), Hc() / 2],
          [cardX(5)(), Hc() / 2 + vH() * 0.10],
          [cardX(0)(), Hc() / 2 + vH() * 0.10],
          [cardX(0)(), Hc() / 2],
        ]}
        stroke={PALETTE.vert} lineWidth={2.5} lineDash={[8, 6]}
        endArrow arrowSize={11} radius={() => vW() * 0.02}
        end={0} opacity={0} />
      <Txt key="loop-label" ref={loopLabel}
        text="autorégression — et on recommence"
        fill={PALETTE.vert}
        fontSize={() => vW() * 0.014} fontFamily={SANS} fontWeight={500}
        y={() => Hc() / 2 + vH() * 0.135}
        opacity={0} />
    </Layout>,
  );

  // ════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ════════════════════════════════════════════════════════════════════════

  const advanceTo = function* (i: number) {
    yield* all(
      connectors[i - 1]().stroke(PALETTE.cyan, 0.3),
      connectors[i - 1]().end(1, 0.45, easeOutCubic),
      pulse().x(cardX(i)(), 0.5, easeInOutCubic),
    );
    yield* all(
      cards[i]().stroke(PALETTE.cyan, 0.3),
      stageLabels[i]().fill(PALETTE.cyan, 0.3),
    );
  };

  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.1, 0.8),
    titleRef().opacity(1, 0.5),
  );
  yield* sequence(0.1,
    ...cards.map((c, i) => all(c().opacity(1, 0.3), stageLabels[i]().opacity(1, 0.3))),
  );

  // ── 1 · TEXTE ─────────────────────────────────────────────────────────────
  yield* waitUntil('text');
  yield* all(
    cards[0]().stroke(PALETTE.cyan, 0.3),
    stageLabels[0]().fill(PALETTE.cyan, 0.3),
    content[0]().opacity(1, 0.4),
  );
  yield* pulse().opacity(1, 0.3);

  // ── 2 · TOKENISATION ──────────────────────────────────────────────────────
  yield* waitUntil('tokens');
  yield* advanceTo(1);
  yield* content[1]().opacity(1, 0.01);
  yield* sequence(0.06,
    ...tokenChips.map(c => all(c().opacity(1, 0.25), c().scale(1, 0.3, easeOutBack))),
  );
  // souligner le mot scindé : les deux fragments « ·capit » + « ale » pulsent ensemble
  yield* all(
    tokenChips[1]().scale(1.12, 0.18).to(1, 0.18),
    tokenChips[2]().scale(1.12, 0.18).to(1, 0.18),
  );
  yield* spaceLegend().opacity(1, 0.3);

  // ── 3 · VECTEURS ──────────────────────────────────────────────────────────
  yield* waitUntil('numbers');
  yield* advanceTo(2);
  yield* content[2]().opacity(1, 0.01);
  yield* sequence(0.06,
    ...vectorRows.map(r => all(r().opacity(1, 0.25), r().scale(1, 0.3, easeOutBack))));
  yield* dimCallout().opacity(1, 0.3);

  // ── 4 · ATTENTION ─────────────────────────────────────────────────────────
  yield* waitUntil('attention');
  yield* advanceTo(3);
  yield* content[3]().opacity(1, 0.01);
  yield* all(
    sequence(0.04, ...attnDots.map(d => all(d().opacity(1, 0.2), d().scale(1, 0.25, easeOutBack)))),
    queryNode().opacity(1, 0.3),
  );
  // les liens se tracent tous (le token regarde TOUS les autres en même temps)
  yield* all(...attnArcs.map(a => a().end(1, 0.45, easeOutCubic)));
  // puis les poids : épaisseur ∝ score, les forts vers ·France / ·capit
  yield* all(
    ...attnArcs.map((a, i) => all(
      a().lineWidth(1 + attnWeights[i] * 14, 0.5),
      a().opacity(Math.min(1, 0.2 + attnWeights[i] * 1.9), 0.5),
    )),
  );
  yield* attnArcs[5]().stroke(PALETTE.cyan, 0.2); // ·France : lien dominant
  yield* all(attnDots[5]().scale(1.5, 0.2).to(1, 0.2));

  // ── 5 · PROBAS ────────────────────────────────────────────────────────────
  yield* waitUntil('probas');
  yield* advanceTo(4);
  yield* content[4]().opacity(1, 0.01);
  yield* all(...probLabels.map(l => l().opacity(1, 0.3)));
  yield* sequence(0.1,
    ...CANDIDATES.map((cand, i) =>
      probBars[i]().height(cand.p * barMaxH(), 0.5, easeOutCubic)),
  );
  yield* winPct().opacity(1, 0.3);
  yield* probBars[0]().scale(1.06, 0.15).to(1, 0.15);

  // ── 6 · DÉTOKENISATION ────────────────────────────────────────────────────
  yield* waitUntil('detok');
  yield* advanceTo(5);
  yield* content[5]().opacity(1, 0.01);
  // le token gagnant arrive…
  yield* all(detokChip().opacity(1, 0.3), detokChip().scale(1, 0.3, easeOutBack));
  // …et se fait redécoder en texte
  yield* detokArrow().opacity(1, 0.01);
  yield* detokArrow().end(1, 0.35, easeOutCubic);
  yield* all(
    detokText().opacity(1, 0.4),
    detokNote().opacity(1, 0.3),
  );
  yield* all(
    cards[5]().stroke(PALETTE.vert, 0.3),
    stageLabels[5]().fill(PALETTE.vert, 0.3),
    detokText().scale(1.12, 0.2).to(1, 0.2),
  );

  // ── Boucle d'autorégression ───────────────────────────────────────────────
  yield* waitUntil('loop');
  yield* loopArrow().opacity(1, 0.01);
  yield* loopArrow().end(1, 0.8, easeInOutCubic);
  yield* loopLabel().opacity(1, 0.4);
  yield* inputTxt().text('« La capitale\nde la France\nest Paris »', 0.5);
  yield* inputTxt().fill(PALETTE.vert, 0.3);
  yield* waitFor(1.0);

  // ── Itérations autorégressives rapides ──────────────────────────────────
  yield* waitUntil('autoregress');

  // Réinitialise la couleur du texte d'entrée (était vert après la 1ère boucle)
  yield* inputTxt().fill(PALETTE.cream, 0.15);

  const fastIter = function* (inputCtx: string | null, outToken: string, outText: string) {
    // Remet toutes les stations en mode fantôme
    yield* all(
      ...cards.map(c => c().stroke(PALETTE.ghost, 0.12)),
      ...stageLabels.map(l => l().fill(PALETTE.secondary, 0.12)),
      ...connectors.map(c => c().stroke(PALETTE.ghost, 0.08)),
    );
    // Met à jour le texte d'entrée si fourni
    if (inputCtx !== null) {
      yield* inputTxt().text(inputCtx, 0.18);
    }
    // Active la station 1
    yield* all(
      cards[0]().stroke(PALETTE.cyan, 0.08),
      stageLabels[0]().fill(PALETTE.cyan, 0.08),
    );
    // Remet le pulse au départ (instant)
    yield* pulse().x(cardX(0)(), 0);
    // Balayage rapide : pulse + éclairage séquentiel des connecteurs et cartes
    yield* all(
      pulse().x(cardX(5)(), 0.4, easeInOutCubic),
      sequence(0.06,
        connectors[0]().stroke(PALETTE.cyan, 0.05),
        connectors[1]().stroke(PALETTE.cyan, 0.05),
        connectors[2]().stroke(PALETTE.cyan, 0.05),
        connectors[3]().stroke(PALETTE.cyan, 0.05),
        connectors[4]().stroke(PALETTE.cyan, 0.05),
      ),
      sequence(0.06,
        cards[1]().stroke(PALETTE.cyan, 0.05),
        cards[2]().stroke(PALETTE.cyan, 0.05),
        cards[3]().stroke(PALETTE.cyan, 0.05),
        cards[4]().stroke(PALETTE.cyan, 0.05),
        cards[5]().stroke(PALETTE.vert, 0.05),
      ),
      sequence(0.06,
        stageLabels[1]().fill(PALETTE.cyan, 0.05),
        stageLabels[2]().fill(PALETTE.cyan, 0.05),
        stageLabels[3]().fill(PALETTE.cyan, 0.05),
        stageLabels[4]().fill(PALETTE.cyan, 0.05),
        stageLabels[5]().fill(PALETTE.vert, 0.05),
      ),
    );
    // Met à jour le token de sortie en station 6
    detokChipLabel().text(outToken);
    yield* detokText().text(outText, 0);
    yield* all(
      cards[5]().stroke(PALETTE.vert, 0.08),
      stageLabels[5]().fill(PALETTE.vert, 0.08),
      detokText().scale(1.18, 0.13).to(1, 0.13),
    );
    // Clignote la flèche de boucle pour signaler la réinjection
    yield* loopArrow().opacity(0.35, 0.07).to(1, 0.1);
    yield* waitFor(0.12);
  };

  // Tokens : [La, capitale, de, la, France, est, Paris, ",", ville, de, 2, …]
  // Iter 1 : contexte «…est Paris» → génère ","
  yield* fastIter(null,                   ',',      ','    );
  // Iter 2 : contexte «…est Paris,» → génère "ville"
  yield* fastIter('« …est\nParis, »',    '·ville', 'ville');
  // Iter 3 : contexte «…Paris, ville» → génère "de"
  yield* fastIter('« …Paris,\nville »',  '·de',    'de'   );

  // Résultat final accumulé
  yield* inputTxt().text('« …Paris,\nville de »', 0.3);
  yield* inputTxt().fill(PALETTE.vert, 0.25);
  yield* waitFor(0.5);

  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.5),
    titleRef().opacity(0, 0.5),
    pulse().opacity(0, 0.5),
    dimCallout().opacity(0, 0.5),
    loopLabel().opacity(0, 0.5),
    ...cards.map(c => c().opacity(0, 0.5)),
    ...stageLabels.map(l => l().opacity(0, 0.5)),
    ...connectors.map(c => c().opacity(0, 0.5)),
    ...content.map(c => c().opacity(0, 0.5)),
    loopArrow().opacity(0, 0.5),
  );
  yield* waitFor(0.3);
});
