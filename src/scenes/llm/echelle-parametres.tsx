/**
 * @file echelle-parametres.tsx
 * @description Vidéo 1 LLM — L'échelle des paramètres : GPT-2 → GPT-3 → modèles frontière.
 *
 * Speaker text :
 *   « GPT-2, sorti en 2019, avait 1,5 milliard de poids. À l'époque, c'était
 *    suffisamment impressionnant pour qu'OpenAI hésite à le publier. GPT-3 un an
 *    plus tard : 175 milliards. Les modèles frontière actuels (Claude, Gemini) :
 *    probablement plus de mille milliards — le chiffre exact n'a jamais été confirmé
 *    officiellement, et si les rumeurs d'architecture mixture-of-experts sont exactes,
 *    comparer ce chiffre aux 175 milliards de GPT-3 ne voudrait de toute façon plus
 *    dire grand-chose. »
 *
 * Show, don't tell — l'ÉCHELLE par le redimensionnement de l'axe :
 *   1. GPT-2 (1,5 Md) seul, pleine hauteur → impressionnant.
 *   2. GPT-3 (175 Md) entre. L'axe se recalibre (×117) : GPT-2 s'effondre en sliver.
 *   3. Claude · Gemini (> 1 000 Md) entrent, sommet incertain (hachuré + « ? »).
 *      L'axe se recalibre encore : GPT-3 rétrécit, GPT-2 disparaît.
 *   4. Caveat MoE : comparer le total brut ne veut plus dire grand-chose.
 *
 * Le « ruler » (graduation max à gauche) change à chaque étape — c'est la règle
 * elle-même qui doit s'allonger pour contenir le nouveau modèle.
 *
 * Rigueur : Claude/Gemini jamais confirmés (Anthropic et Google ne publient pas leurs
 * tailles). La barre solide s'arrête à ~1 000 Md, le reste est une extension hachurée
 * d'incertitude (rumeur MoE ≈ 1 800 Md).
 */

import {makeScene2D, Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d';
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

  // ── Données ────────────────────────────────────────────────────────────────
  // GPT-4 : valeur visuelle = portion confirmée (~1000) + extension incertaine.
  const G4_SOLID = 1000;   // « plus de mille milliards » — plancher assumé
  const G4_RUMOR = 1800;   // rumeur MoE ≈ 1,8 T (haut de la zone hachurée)

  const MODELS = [
    {name: 'GPT-2',           year: '2019',      value: 1.5,      label: '1,5 Md',     color: PALETTE.blue},
    {name: 'GPT-3',           year: '2020',      value: 175,      label: '175 Md',     color: PALETTE.jaune},
    {name: 'Claude · Gemini', year: '2025-2026', value: G4_RUMOR, label: '> 1 000 Md', color: PALETTE.rose},
  ];

  // ── Géométrie ──────────────────────────────────────────────────────────────
  const baselineY = () => vH() * 0.34;          // sol commun des barres
  const maxBarH   = () => vH() * 0.56;           // hauteur de la plus haute barre
  const barX      = (i: number) => () => (i - 1) * vW() * 0.26;
  const barW      = () => vW() * 0.11;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef  = createRef<Grid>();
  const titleRef = createRef<Txt>();
  const baseline = createRef<Line>();

  const bars       = MODELS.map(() => createRef<Rect>());
  const g4Hatch    = createRef<Rect>();          // extension d'incertitude (GPT-4)
  const g4Question = createRef<Txt>();
  const valueLabels = MODELS.map(() => createRef<Txt>());
  const nameLabels  = MODELS.map(() => createRef<Txt>());
  const yearLabels  = MODELS.map(() => createRef<Txt>());

  // graduation max de l'axe (le « ruler » qui s'allonge)
  const axisLine  = createRef<Line>();
  const axisTick  = createRef<Line>();
  const axisLabel = createRef<Txt>();

  // facteurs de croissance entre barres
  const factor23 = createRef<Txt>();   // ×117 entre GPT-2 et GPT-3

  const moeCallout = createRef<Callout>();

  // ── État courant de l'échelle ──────────────────────────────────────────────
  // currentMax = valeur représentée par la pleine hauteur. Recalibré à chaque étape.
  let currentMax = MODELS[0].value;

  const heightFor = (value: number) => (value / currentMax) * maxBarH();

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
        text="NOMBRE DE PARAMÈTRES"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.014}
        fontFamily={MONO} fontWeight={700}
        y={() => vH() * -0.42}
        opacity={0} />

      {/* axe vertical + graduation max (le « ruler ») */}
      <Line key="axis-line" ref={axisLine}
        points={() => [
          [-vW() * 0.42, baselineY()],
          [-vW() * 0.42, baselineY() - maxBarH() - vH() * 0.02],
        ]}
        stroke={PALETTE.ghost} lineWidth={2}
        opacity={0} />
      <Line key="axis-tick" ref={axisTick}
        points={() => [
          [-vW() * 0.42, baselineY() - maxBarH()],
          [-vW() * 0.405, baselineY() - maxBarH()],
        ]}
        stroke={PALETTE.secondary} lineWidth={2}
        opacity={0} />
      <Txt key="axis-label" ref={axisLabel}
        text={MODELS[0].label}
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.013} fontFamily={MONO}
        textAlign={'right'} offset={[1, 0]}
        x={() => -vW() * 0.425} y={() => baselineY() - maxBarH()}
        opacity={0} />

      {/* sol commun */}
      <Line key="baseline" ref={baseline}
        points={() => [
          [-vW() * 0.42, baselineY()],
          [vW() * 0.44, baselineY()],
        ]}
        stroke={PALETTE.ghost} lineWidth={2}
        opacity={0} />

      {/* barres (offset bas → poussent vers le haut) */}
      {MODELS.map((m, i) => (
        <Rect key={`bar-${m.name}`} ref={bars[i]}
          width={barW} height={0}
          offset={[0, 1]}
          fill={m.color} radius={() => vW() * 0.004}
          shadowColor={m.color} shadowBlur={() => vW() * 0.012}
          x={barX(i)} y={baselineY}
          opacity={0} />
      ))}

      {/* GPT-4 : extension d'incertitude hachurée, empilée au-dessus de la partie solide */}
      <Rect key="g4-hatch" ref={g4Hatch}
        width={barW} height={0}
        offset={[0, 1]}
        fill={'#00000000'}
        stroke={PALETTE.rose} lineWidth={2}
        lineDash={[8, 8]}
        radius={() => vW() * 0.004}
        x={barX(2)} y={() => baselineY() - heightFor(G4_SOLID)}
        opacity={0} />
      <Txt key="g4-question" ref={g4Question}
        text="?"
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.035} fontFamily={SANS} fontWeight={800}
        x={barX(2)}
        y={() => baselineY() - heightFor((G4_SOLID + G4_RUMOR) / 2)}
        scale={0}
        opacity={0} />

      {/* valeurs (au-dessus de chaque barre) */}
      {MODELS.map((m, i) => (
        <Txt key={`val-${m.name}`} ref={valueLabels[i]}
          text={m.label} fill={m.color}
          fontSize={() => vW() * 0.02} fontFamily={MONO} fontWeight={700}
          x={barX(i)}
          y={() => baselineY() - bars[i]().height() - vH() * 0.035}
          opacity={0} />
      ))}

      {/* noms + années (sous le sol) */}
      {MODELS.map((m, i) => (
        <Txt key={`name-${m.name}`} ref={nameLabels[i]}
          text={m.name} fill={PALETTE.cream}
          fontSize={() => vW() * (i === 2 ? 0.018 : 0.022)} fontFamily={SANS} fontWeight={700}
          x={barX(i)} y={() => baselineY() + vH() * 0.05}
          opacity={0} />
      ))}
      {MODELS.map((m, i) => (
        <Txt key={`year-${m.name}`} ref={yearLabels[i]}
          text={m.year} fill={PALETTE.secondary}
          fontSize={() => vW() * 0.014} fontFamily={MONO}
          x={barX(i)} y={() => baselineY() + vH() * 0.09}
          opacity={0} />
      ))}

      {/* facteur de croissance GPT-2 → GPT-3 */}
      <Txt key="factor-23" ref={factor23}
        text="×117" fill={PALETTE.jaune}
        fontSize={() => vW() * 0.018} fontFamily={MONO} fontWeight={700}
        x={() => barX(1)() - vW() * 0.13} y={() => baselineY() - vH() * 0.04}
        opacity={0} />

      {/* caveat mixture-of-experts */}
      <Callout key="moe" ref={moeCallout}
        title="Mixture-of-Experts ?"
        body="Si la rumeur est vraie, comparer ce total brut à GPT-3 ne veut plus dire grand-chose."
        color={PALETTE.rose}
        width={() => vW() * 0.30} height={() => vH() * 0.17}
        x={() => vW() * 0.26} y={() => vH() * -0.28}
        opacity={0} />
    </Layout>,
  );

  // ════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════════════════════

  // Recalibre l'échelle : nouveau max → toutes les barres visibles + l'axe se redimensionnent.
  const recalibrate = function* (newMax: number, axisText: string, dur: number, visible: number) {
    currentMax = newMax;
    yield* all(
      // barres
      ...bars.slice(0, visible).map((b, i) => b().height(heightFor(MODELS[i].value), dur, easeInOutCubic)),
      // graduation de l'axe
      axisLabel().text(axisText, dur * 0.6),
    );
  };

  // ════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ════════════════════════════════════════════════════════════════════════

  // ── GPT-2 seul : 1,5 Md, ça impressionnait ────────────────────────────────
  yield* waitUntil('gpt2');
  yield* all(
    gridRef().opacity(0.08, 0.8),
    titleRef().opacity(1, 0.5),
    baseline().opacity(1, 0.5),
    axisLine().opacity(0.6, 0.5),
    axisTick().opacity(1, 0.5),
    axisLabel().opacity(1, 0.5),
  );
  yield* all(
    bars[0]().opacity(1, 0.3),
    bars[0]().height(heightFor(MODELS[0].value), 0.7, easeOutCubic),
    nameLabels[0]().opacity(1, 0.4),
    yearLabels[0]().opacity(1, 0.4),
  );
  yield* valueLabels[0]().opacity(1, 0.4);
  yield* waitFor(0.4);

  // ── GPT-3 : 175 Md. L'axe explose, GPT-2 s'effondre ───────────────────────
  yield* waitUntil('gpt3');
  // la barre GPT-3 entre brièvement à pleine échelle ACTUELLE (déborde) puis l'axe se recalibre
  yield* all(
    bars[1]().opacity(1, 0.3),
    nameLabels[1]().opacity(1, 0.4),
    yearLabels[1]().opacity(1, 0.4),
  );
  // recalibrage : max passe à 175 → GPT-3 monte tout en haut, GPT-2 s'écrase
  yield* recalibrate(MODELS[1].value, MODELS[1].label, 0.9, 2);
  yield* all(
    axisLabel().fill(MODELS[1].color, 0.4),
    axisTick().stroke(MODELS[1].color, 0.4),
    valueLabels[1]().opacity(1, 0.4),
    // la valeur de GPT-2 s'estompe : la barre est devenue un sliver
    valueLabels[0]().fill(PALETTE.secondary, 0.4),
    valueLabels[0]().fontSize(vW() * 0.014, 0.4),
  );
  yield* all(
    factor23().opacity(1, 0.4),
    factor23().scale(1.15, 0.2).to(1, 0.2),
  );
  yield* waitFor(0.5);

  // ── Claude · Gemini : > 1 000 Md, sommet incertain. L'axe re-explose ───────
  yield* waitUntil('frontier');
  yield* all(
    bars[2]().opacity(1, 0.3),
    nameLabels[2]().opacity(1, 0.4),
    yearLabels[2]().opacity(1, 0.4),
    factor23().opacity(0, 0.3),     // on libère la place, le facteur n'a plus de sens
  );
  // recalibrage final : max passe à la rumeur MoE → GPT-3 rétrécit, GPT-2 disparaît
  yield* all(
    recalibrate(G4_RUMOR, MODELS[2].label, 1.0, 3),
    axisLabel().fill(MODELS[2].color, 0.5),
    axisTick().stroke(MODELS[2].color, 0.5),
  );
  yield* all(
    valueLabels[2]().opacity(1, 0.4),
    // GPT-3 à son tour devient secondaire
    valueLabels[1]().fill(PALETTE.secondary, 0.4),
    valueLabels[1]().fontSize(vW() * 0.014, 0.4),
  );
  yield* waitFor(0.3);

  // sommet incertain : extension hachurée qui pousse au-dessus de la partie solide + « ? »
  yield* all(
    g4Hatch().opacity(1, 0.4),
    g4Hatch().height(heightFor(G4_RUMOR) - heightFor(G4_SOLID), 0.7, easeOutCubic),
  );
  yield* all(
    g4Question().opacity(1, 0.4),
    g4Question().scale(1, 0.4, easeOutBack),
  );
  yield* waitFor(0.4);

  // ── Caveat mixture-of-experts ──────────────────────────────────────────────
  yield* waitUntil('moe');
  yield* moeCallout().opacity(1, 0.4);
  yield* moeCallout().hold();

  // ── Clôture ────────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.5),
    titleRef().opacity(0, 0.5),
    baseline().opacity(0, 0.5),
    axisLine().opacity(0, 0.5),
    axisTick().opacity(0, 0.5),
    axisLabel().opacity(0, 0.5),
    moeCallout().opacity(0, 0.5),
    ...bars.map(b => b().opacity(0, 0.5)),
    g4Hatch().opacity(0, 0.5),
    g4Question().opacity(0, 0.5),
    ...valueLabels.map(l => l().opacity(0, 0.5)),
    ...nameLabels.map(l => l().opacity(0, 0.5)),
    ...yearLabels.map(l => l().opacity(0, 0.5)),
  );
  yield* waitFor(0.3);
});
