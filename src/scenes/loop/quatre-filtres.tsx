import {makeScene2D, Grid, Rect, Txt, Icon} from '@motion-canvas/2d';
import {createRef, all, sequence, waitUntil, waitFor, easeInOutCubic, loop, cancel} from '@motion-canvas/core';
import {ConnectionArrow, DiagramNode} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Dimensions communes ────────────────────────────────────────────────────
  const NW  = () => vW() * 0.14;   // nœud principal (sections plein écran)
  const NH  = () => vH() * 0.26;
  const PNW = () => vW() * 0.095;  // nœud pipeline Q3
  const PNH = () => vH() * 0.20;
  const NY  = () => vH() * 0.06;   // centre vertical du contenu

  // Summary 2×2
  const SPW  = () => vW() * 0.445;
  const SPH  = () => vH() * 0.41;
  const SQ1X = () => -vW() * 0.2475;
  const SQ2X = () => +vW() * 0.2475;
  const SQ3X = () => -vW() * 0.2475;
  const SQ4X = () => +vW() * 0.2475;
  const STY  = () => -vH() * 0.225;
  const SBY  = () => +vH() * 0.225;
  const SNW  = () => vW() * 0.08;
  const SNH  = () => vH() * 0.155;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();

  // Q1
  const q1Header    = createRef<Txt>();
  const q1TaskNode  = createRef<DiagramNode>();
  const q1FinNode   = createRef<DiagramNode>();
  const q1Arrow     = createRef<ConnectionArrow>();
  const q1BadLabel  = createRef<Txt>();
  const q1LoopIcon  = createRef<Icon>();
  const q1GoodLabel = createRef<Txt>();

  // Q2
  const q2Header    = createRef<Txt>();
  const q2AgentNode = createRef<DiagramNode>();
  const q2Arrow     = createRef<ConnectionArrow>();
  const q2ExitNode  = createRef<DiagramNode>();
  const q2ExitBad   = createRef<Txt>();
  const q2ExitGood  = createRef<Txt>();

  // Q3
  const q3Header      = createRef<Txt>();
  const q3S1          = createRef<DiagramNode>();
  const q3S2          = createRef<DiagramNode>();
  const q3S3          = createRef<DiagramNode>();
  const q3S4          = createRef<DiagramNode>();
  const q3Arrow12     = createRef<ConnectionArrow>();
  const q3Arrow23     = createRef<ConnectionArrow>();
  const q3Arrow34     = createRef<ConnectionArrow>();
  const q3Cp1         = createRef<Rect>();
  const q3Cp2         = createRef<Rect>();
  const q3Cp3         = createRef<Rect>();
  const q3RestartBad  = createRef<ConnectionArrow>();
  const q3CostLabel   = createRef<Txt>();
  const q3RestartGood = createRef<ConnectionArrow>();

  // Q4
  const q4Header      = createRef<Txt>();
  const q4AgentNode   = createRef<DiagramNode>();
  const q4BadArrow    = createRef<ConnectionArrow>();
  const q4HumanNode   = createRef<DiagramNode>();
  const q4Hourglass   = createRef<Icon>();
  const q4WaitLabel   = createRef<Txt>();
  const q4LoopLabel   = createRef<Txt>();
  const q4GoodArrow   = createRef<ConnectionArrow>();
  const q4ApproveNode = createRef<DiagramNode>();

  // Summary
  const sPanel1    = createRef<Rect>();
  const sPanel2    = createRef<Rect>();
  const sPanel3    = createRef<Rect>();
  const sPanel4    = createRef<Rect>();
  const sH1        = createRef<Txt>();
  const sH2        = createRef<Txt>();
  const sH3        = createRef<Txt>();
  const sH4        = createRef<Txt>();
  const sQ1Task    = createRef<DiagramNode>();
  const sQ1Loop    = createRef<Icon>();
  const sQ2Agent   = createRef<DiagramNode>();
  const sQ2Arrow   = createRef<ConnectionArrow>();
  const sQ2Exit    = createRef<DiagramNode>();
  const sQ3S1      = createRef<DiagramNode>();
  const sQ3S2      = createRef<DiagramNode>();
  const sQ3S3      = createRef<DiagramNode>();
  const sQ3S4      = createRef<DiagramNode>();
  const sQ4Agent   = createRef<DiagramNode>();
  const sQ4Arrow   = createRef<ConnectionArrow>();
  const sQ4Approve = createRef<DiagramNode>();

  // ── Scene tree ─────────────────────────────────────────────────────────────
  view.add(<>
    <Grid
      key="bg-grid"
      ref={gridRef}
      width={'100%'} height={'100%'}
      spacing={() => vW() * 0.05}
      stroke={PALETTE.ghost}
      lineWidth={1}
      opacity={0}
    />

    {/* ══ Q1: RÉCURRENCE ══════════════════════════════════════════════════════ */}
    <Txt key="q1-header" ref={q1Header}
      text="01 · RÉCURRENCE"
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.024}
      fontFamily={'Space Grotesk, DM Sans, sans-serif'}
      fontWeight={700}
      x={0} y={() => -vH() * 0.37}
      opacity={0}
    />
    <DiagramNode key="q1-task" ref={q1TaskNode}
      iconName="mdi:clipboard-text-outline"
      label="TÂCHE"
      color={PALETTE.cyan}
      initialState="idle"
      width={NW} height={NH}
      x={() => -vW() * 0.22} y={NY}
      opacity={0}
    />
    <ConnectionArrow key="q1-arrow" ref={q1Arrow}
      from={() => [-vW() * 0.22 + NW() / 2, NY()]}
      to={() =>   [+vW() * 0.22 - NW() / 2, NY()]}
      stroke={PALETTE.ghost}
      end={0} opacity={0}
    />
    <DiagramNode key="q1-fin" ref={q1FinNode}
      iconName="mdi:flag-checkered"
      label="FIN"
      color={PALETTE.ghost}
      initialState="idle"
      width={NW} height={NH}
      x={() => +vW() * 0.22} y={NY}
      opacity={0}
    />
    <Txt key="q1-bad-label" ref={q1BadLabel}
      text="× one-shot"
      fill={PALETTE.dsRose}
      fontSize={() => vW() * 0.018}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={0} y={() => NY() - NH() / 2 - vH() * 0.09}
      opacity={0}
    />
    <Icon key="q1-loop-icon" ref={q1LoopIcon}
      icon="lucide:refresh-cw"
      size={() => vW() * 0.07}
      color={PALETTE.cyan}
      x={() => +vW() * 0.22} y={NY}
      opacity={0}
    />
    <Txt key="q1-good-label" ref={q1GoodLabel}
      text="✓ récurrente"
      fill={PALETTE.dsGreen}
      fontSize={() => vW() * 0.018}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={0} y={() => NY() - NH() / 2 - vH() * 0.09}
      opacity={0}
    />

    {/* ══ Q2: CONDITION D'ARRÊT ════════════════════════════════════════════ */}
    <Txt key="q2-header" ref={q2Header}
      text="02 · CONDITION D'ARRÊT"
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.024}
      fontFamily={'Space Grotesk, DM Sans, sans-serif'}
      fontWeight={700}
      x={0} y={() => -vH() * 0.37}
      opacity={0}
    />
    <DiagramNode key="q2-agent" ref={q2AgentNode}
      iconName="mdi:robot"
      label="AGENT"
      color={PALETTE.amber}
      initialState="active"
      width={NW} height={NH}
      x={() => -vW() * 0.22} y={NY}
      opacity={0}
    />
    <ConnectionArrow key="q2-arrow" ref={q2Arrow}
      from={() => [-vW() * 0.22 + NW() / 2, NY()]}
      to={() =>   [+vW() * 0.22 - NW() / 2, NY()]}
      stroke={PALETTE.dsRose}
      end={0} opacity={0}
    />
    <DiagramNode key="q2-exit" ref={q2ExitNode}
      iconName="mdi:exit-to-app"
      label="SORTIE"
      color={PALETTE.dsRose}
      initialState="error"
      width={NW} height={NH}
      x={() => +vW() * 0.22} y={NY}
      opacity={0}
    />
    <Txt key="q2-exit-bad" ref={q2ExitBad}
      text="exit ???"
      fill={PALETTE.dsRose}
      fontSize={() => vW() * 0.022}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={() => +vW() * 0.22} y={() => NY() + NH() / 2 + vH() * 0.07}
      opacity={0}
    />
    <Txt key="q2-exit-good" ref={q2ExitGood}
      text="sortie_ok == true"
      fill={PALETTE.dsGreen}
      fontSize={() => vW() * 0.016}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={() => +vW() * 0.22} y={() => NY() + NH() / 2 + vH() * 0.07}
      opacity={0}
    />

    {/* ══ Q3: COÛT DE REPRISE ══════════════════════════════════════════════ */}
    <Txt key="q3-header" ref={q3Header}
      text="03 · COÛT DE REPRISE"
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.024}
      fontFamily={'Space Grotesk, DM Sans, sans-serif'}
      fontWeight={700}
      x={0} y={() => -vH() * 0.37}
      opacity={0}
    />
    <DiagramNode key="q3-s1" ref={q3S1}
      iconName="mdi:numeric-1-circle-outline"
      label="S1"
      color={PALETTE.amber}
      initialState="idle"
      width={PNW} height={PNH}
      x={() => -vW() * 0.30} y={NY}
      opacity={0}
    />
    <DiagramNode key="q3-s2" ref={q3S2}
      iconName="mdi:numeric-2-circle-outline"
      label="S2"
      color={PALETTE.amber}
      initialState="idle"
      width={PNW} height={PNH}
      x={() => -vW() * 0.10} y={NY}
      opacity={0}
    />
    <DiagramNode key="q3-s3" ref={q3S3}
      iconName="mdi:numeric-3-circle-outline"
      label="S3"
      color={PALETTE.amber}
      initialState="idle"
      width={PNW} height={PNH}
      x={() => +vW() * 0.10} y={NY}
      opacity={0}
    />
    <DiagramNode key="q3-s4" ref={q3S4}
      iconName="mdi:numeric-4-circle-outline"
      label="S4"
      color={PALETTE.amber}
      initialState="idle"
      width={PNW} height={PNH}
      x={() => +vW() * 0.30} y={NY}
      opacity={0}
    />
    <ConnectionArrow key="q3-arrow-12" ref={q3Arrow12}
      from={() => [-vW() * 0.30 + PNW() / 2, NY()]}
      to={() =>   [-vW() * 0.10 - PNW() / 2, NY()]}
      stroke={PALETTE.amber + '88'}
      end={0} opacity={0}
    />
    <ConnectionArrow key="q3-arrow-23" ref={q3Arrow23}
      from={() => [-vW() * 0.10 + PNW() / 2, NY()]}
      to={() =>   [+vW() * 0.10 - PNW() / 2, NY()]}
      stroke={PALETTE.amber + '88'}
      end={0} opacity={0}
    />
    <ConnectionArrow key="q3-arrow-34" ref={q3Arrow34}
      from={() => [+vW() * 0.10 + PNW() / 2, NY()]}
      to={() =>   [+vW() * 0.30 - PNW() / 2, NY()]}
      stroke={PALETTE.amber + '88'}
      end={0} opacity={0}
    />
    <Rect key="q3-cp1" ref={q3Cp1}
      width={() => vW() * 0.038} height={() => vH() * 0.038}
      x={() => -vW() * 0.30} y={() => NY() + PNH() / 2 + vH() * 0.055}
      fill={PALETTE.dsGreen + '22'} stroke={PALETTE.dsGreen} lineWidth={1.5} radius={4}
      opacity={0}
    >
      <Txt key="q3-cp1-txt" text="✓"
        fill={PALETTE.dsGreen}
        fontSize={() => vW() * 0.013}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
      />
    </Rect>
    <Rect key="q3-cp2" ref={q3Cp2}
      width={() => vW() * 0.038} height={() => vH() * 0.038}
      x={() => -vW() * 0.10} y={() => NY() + PNH() / 2 + vH() * 0.055}
      fill={PALETTE.dsGreen + '22'} stroke={PALETTE.dsGreen} lineWidth={1.5} radius={4}
      opacity={0}
    >
      <Txt key="q3-cp2-txt" text="✓"
        fill={PALETTE.dsGreen}
        fontSize={() => vW() * 0.013}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
      />
    </Rect>
    <Rect key="q3-cp3" ref={q3Cp3}
      width={() => vW() * 0.038} height={() => vH() * 0.038}
      x={() => +vW() * 0.10} y={() => NY() + PNH() / 2 + vH() * 0.055}
      fill={PALETTE.dsGreen + '22'} stroke={PALETTE.dsGreen} lineWidth={1.5} radius={4}
      opacity={0}
    >
      <Txt key="q3-cp3-txt" text="✓"
        fill={PALETTE.dsGreen}
        fontSize={() => vW() * 0.013}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
      />
    </Rect>
    <ConnectionArrow key="q3-restart-bad" ref={q3RestartBad}
      from={() => [+vW() * 0.30, NY() + PNH() / 2]}
      to={() =>   [-vW() * 0.30, NY() + PNH() / 2]}
      via={() =>  [0, NY() + PNH() / 2 + vH() * 0.22]}
      stroke={PALETTE.dsRose}
      dashed
      end={0} opacity={0}
    />
    <Txt key="q3-cost-label" ref={q3CostLabel}
      text="×3 tours perdus"
      fill={PALETTE.dsRose}
      fontSize={() => vW() * 0.014}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={0} y={() => NY() + PNH() / 2 + vH() * 0.265}
      opacity={0}
    />
    <ConnectionArrow key="q3-restart-good" ref={q3RestartGood}
      from={() => [+vW() * 0.30, NY() + PNH() / 2]}
      to={() =>   [+vW() * 0.10, NY() + PNH() / 2]}
      via={() =>  [+vW() * 0.20, NY() + PNH() / 2 + vH() * 0.13]}
      stroke={PALETTE.dsGreen}
      end={0} opacity={0}
    />

    {/* ══ Q4: AUTONOMIE ═══════════════════════════════════════════════════ */}
    <Txt key="q4-header" ref={q4Header}
      text="04 · AUTONOMIE"
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.024}
      fontFamily={'Space Grotesk, DM Sans, sans-serif'}
      fontWeight={700}
      x={0} y={() => -vH() * 0.37}
      opacity={0}
    />
    <DiagramNode key="q4-agent" ref={q4AgentNode}
      iconName="mdi:robot"
      label="AGENT"
      color={PALETTE.cyan}
      initialState="active"
      width={NW} height={NH}
      x={() => -vW() * 0.22} y={NY}
      opacity={0}
    />
    <ConnectionArrow key="q4-bad-arrow" ref={q4BadArrow}
      from={() => [-vW() * 0.22 + NW() / 2, NY()]}
      to={() =>   [+vW() * 0.22 - NW() / 2, NY()]}
      stroke={PALETTE.amber}
      end={0} opacity={0}
    />
    <DiagramNode key="q4-human" ref={q4HumanNode}
      iconName="mdi:account"
      label="HUMAIN"
      sublabel="décide"
      color={PALETTE.amber}
      initialState="highlighted"
      width={NW} height={NH}
      x={() => +vW() * 0.22} y={NY}
      opacity={0}
    />
    <Icon key="q4-hourglass" ref={q4Hourglass}
      icon="lucide:hourglass"
      size={() => vW() * 0.048}
      color={PALETTE.dsRose}
      x={() => +vW() * 0.22} y={() => NY() - NH() / 2 - vH() * 0.09}
      opacity={0}
    />
    <Txt key="q4-wait-label" ref={q4WaitLabel}
      text="en attente..."
      fill={PALETTE.amber}
      fontSize={() => vW() * 0.014}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={() => +vW() * 0.22} y={() => NY() + NH() / 2 + vH() * 0.06}
      opacity={0}
    />
    <Txt key="q4-loop-label" ref={q4LoopLabel}
      text="↺ n itérations"
      fill={PALETTE.cyan}
      fontSize={() => vW() * 0.016}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={() => -vW() * 0.22} y={() => NY() - NH() / 2 - vH() * 0.07}
      opacity={0}
    />
    <ConnectionArrow key="q4-good-arrow" ref={q4GoodArrow}
      from={() => [-vW() * 0.22 + NW() / 2, NY()]}
      to={() =>   [+vW() * 0.22 - NW() / 2, NY()]}
      stroke={PALETTE.dsGreen}
      end={0} opacity={0}
    />
    <DiagramNode key="q4-approve" ref={q4ApproveNode}
      iconName="mdi:check-circle-outline"
      label="APPROUVER"
      sublabel="fin de boucle"
      color={PALETTE.dsGreen}
      initialState="success"
      width={NW} height={NH}
      x={() => +vW() * 0.22} y={NY}
      opacity={0}
    />

    {/* ══ SUMMARY: photo finish 2×2 ════════════════════════════════════════ */}
    <Rect key="s-panel-1" ref={sPanel1}
      width={SPW} height={SPH} x={SQ1X} y={STY}
      fill={PALETTE.bgCard} stroke={PALETTE.ghost} lineWidth={1.5} radius={10}
      opacity={0}
    />
    <Rect key="s-panel-2" ref={sPanel2}
      width={SPW} height={SPH} x={SQ2X} y={STY}
      fill={PALETTE.bgCard} stroke={PALETTE.ghost} lineWidth={1.5} radius={10}
      opacity={0}
    />
    <Rect key="s-panel-3" ref={sPanel3}
      width={SPW} height={SPH} x={SQ3X} y={SBY}
      fill={PALETTE.bgCard} stroke={PALETTE.ghost} lineWidth={1.5} radius={10}
      opacity={0}
    />
    <Rect key="s-panel-4" ref={sPanel4}
      width={SPW} height={SPH} x={SQ4X} y={SBY}
      fill={PALETTE.bgCard} stroke={PALETTE.ghost} lineWidth={1.5} radius={10}
      opacity={0}
    />
    <Txt key="s-h1" ref={sH1}
      text="01 · RÉCURRENCE"
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.013}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={SQ1X} y={() => STY() - SPH() / 2 + vH() * 0.065}
      opacity={0}
    />
    <Txt key="s-h2" ref={sH2}
      text="02 · CONDITION D'ARRÊT"
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.013}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={SQ2X} y={() => STY() - SPH() / 2 + vH() * 0.065}
      opacity={0}
    />
    <Txt key="s-h3" ref={sH3}
      text="03 · COÛT DE REPRISE"
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.013}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={SQ3X} y={() => SBY() - SPH() / 2 + vH() * 0.065}
      opacity={0}
    />
    <Txt key="s-h4" ref={sH4}
      text="04 · AUTONOMIE"
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.013}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={SQ4X} y={() => SBY() - SPH() / 2 + vH() * 0.065}
      opacity={0}
    />
    {/* Q1 summary: TÂCHE + loop */}
    <DiagramNode key="s-q1-task" ref={sQ1Task}
      iconName="mdi:clipboard-text-outline"
      label="TÂCHE"
      color={PALETTE.cyan}
      initialState="active"
      width={SNW} height={SNH}
      x={() => SQ1X() - vW() * 0.07} y={() => STY() + vH() * 0.02}
      opacity={0}
    />
    <Icon key="s-q1-loop" ref={sQ1Loop}
      icon="lucide:refresh-cw"
      size={() => vW() * 0.05}
      color={PALETTE.cyan}
      x={() => SQ1X() + vW() * 0.07} y={() => STY() + vH() * 0.02}
      opacity={0}
    />
    {/* Q2 summary: AGENT → SORTIE */}
    <DiagramNode key="s-q2-agent" ref={sQ2Agent}
      iconName="mdi:robot"
      label="AGENT"
      color={PALETTE.amber}
      initialState="active"
      width={SNW} height={SNH}
      x={() => SQ2X() - vW() * 0.08} y={() => STY() + vH() * 0.02}
      opacity={0}
    />
    <ConnectionArrow key="s-q2-arrow" ref={sQ2Arrow}
      from={() => [SQ2X() - vW() * 0.08 + SNW() / 2, STY() + vH() * 0.02]}
      to={() =>   [SQ2X() + vW() * 0.08 - SNW() / 2, STY() + vH() * 0.02]}
      stroke={PALETTE.dsGreen}
      end={0} opacity={0}
    />
    <DiagramNode key="s-q2-exit" ref={sQ2Exit}
      iconName="mdi:exit-to-app"
      label="SORTIE"
      color={PALETTE.dsGreen}
      initialState="success"
      width={SNW} height={SNH}
      x={() => SQ2X() + vW() * 0.08} y={() => STY() + vH() * 0.02}
      opacity={0}
    />
    {/* Q3 summary: S1✓ S2✓ S3✓ S4✗ */}
    <DiagramNode key="s-q3-s1" ref={sQ3S1}
      iconName="mdi:numeric-1-circle-outline"
      label="S1"
      color={PALETTE.dsGreen}
      initialState="success"
      width={() => vW() * 0.065} height={() => vH() * 0.13}
      x={() => SQ3X() - vW() * 0.135} y={() => SBY() + vH() * 0.02}
      opacity={0}
    />
    <DiagramNode key="s-q3-s2" ref={sQ3S2}
      iconName="mdi:numeric-2-circle-outline"
      label="S2"
      color={PALETTE.dsGreen}
      initialState="success"
      width={() => vW() * 0.065} height={() => vH() * 0.13}
      x={() => SQ3X() - vW() * 0.045} y={() => SBY() + vH() * 0.02}
      opacity={0}
    />
    <DiagramNode key="s-q3-s3" ref={sQ3S3}
      iconName="mdi:numeric-3-circle-outline"
      label="S3"
      color={PALETTE.dsGreen}
      initialState="success"
      width={() => vW() * 0.065} height={() => vH() * 0.13}
      x={() => SQ3X() + vW() * 0.045} y={() => SBY() + vH() * 0.02}
      opacity={0}
    />
    <DiagramNode key="s-q3-s4" ref={sQ3S4}
      iconName="mdi:numeric-4-circle-outline"
      label="S4"
      color={PALETTE.dsRose}
      initialState="error"
      width={() => vW() * 0.065} height={() => vH() * 0.13}
      x={() => SQ3X() + vW() * 0.135} y={() => SBY() + vH() * 0.02}
      opacity={0}
    />
    {/* Q4 summary: AGENT → APPROUVER */}
    <DiagramNode key="s-q4-agent" ref={sQ4Agent}
      iconName="mdi:robot"
      label="AGENT"
      color={PALETTE.cyan}
      initialState="active"
      width={SNW} height={SNH}
      x={() => SQ4X() - vW() * 0.08} y={() => SBY() + vH() * 0.02}
      opacity={0}
    />
    <ConnectionArrow key="s-q4-arrow" ref={sQ4Arrow}
      from={() => [SQ4X() - vW() * 0.08 + SNW() / 2, SBY() + vH() * 0.02]}
      to={() =>   [SQ4X() + vW() * 0.08 - SNW() / 2, SBY() + vH() * 0.02]}
      stroke={PALETTE.dsGreen}
      end={0} opacity={0}
    />
    <DiagramNode key="s-q4-approve" ref={sQ4Approve}
      iconName="mdi:check-circle-outline"
      label="APPROUVER"
      color={PALETTE.dsGreen}
      initialState="success"
      width={SNW} height={SNH}
      x={() => SQ4X() + vW() * 0.08} y={() => SBY() + vH() * 0.02}
      opacity={0}
    />
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  yield* waitUntil('intro');
  yield* gridRef().opacity(0.07, 0.8);
  yield* waitFor(0.3);

  // ═══ Q1: RÉCURRENCE ═══════════════════════════════════════════════════════
  yield* waitUntil('q1');
  yield* q1Header().fill(PALETTE.cream, 0.4);
  yield* q1Header().opacity(1, 0.5);
  yield* waitFor(0.4);
  yield* q1TaskNode().opacity(1, 0.45);
  yield* waitFor(0.25);
  q1Arrow().opacity(1);
  yield* q1Arrow().end(1, 0.6, easeInOutCubic);
  yield* waitFor(0.2);
  yield* q1FinNode().opacity(1, 0.45);
  yield* waitFor(0.3);
  yield* q1BadLabel().opacity(1, 0.4);
  yield* waitFor(0.8);

  yield* waitUntil('q1-good');
  yield* all(
    q1BadLabel().opacity(0, 0.3),
    q1FinNode().opacity(0, 0.35),
    q1Arrow().opacity(0, 0.35),
  );
  yield* waitFor(0.2);
  yield* q1TaskNode().setState('active', 0.3);
  yield* waitFor(0.2);
  yield* all(
    q1LoopIcon().opacity(1, 0.45),
    q1GoodLabel().opacity(1, 0.4),
  );
  yield* waitFor(1.2);

  yield* all(
    q1Header().opacity(0, 0.4),
    q1TaskNode().opacity(0, 0.4),
    q1LoopIcon().opacity(0, 0.4),
    q1GoodLabel().opacity(0, 0.4),
  );
  yield* waitFor(0.3);

  // ═══ Q2: CONDITION D'ARRÊT ════════════════════════════════════════════════
  yield* waitUntil('q2');
  yield* q2Header().fill(PALETTE.cream, 0.4);
  yield* q2Header().opacity(1, 0.5);
  yield* waitFor(0.4);
  yield* q2AgentNode().opacity(1, 0.45);
  yield* waitFor(0.25);
  q2Arrow().opacity(1);
  yield* q2Arrow().end(1, 0.6, easeInOutCubic);
  yield* waitFor(0.2);
  yield* q2ExitNode().opacity(1, 0.45);
  yield* waitFor(0.3);
  yield* q2ExitBad().opacity(1, 0.4);
  yield* waitFor(0.8);

  yield* waitUntil('q2-good');
  yield* all(
    q2ExitBad().opacity(0, 0.3),
    q2ExitNode().setState('success', 0.4),
    q2Arrow().stroke(PALETTE.dsGreen, 0.4),
  );
  yield* q2ExitGood().opacity(1, 0.45);
  yield* waitFor(1.2);

  yield* all(
    q2Header().opacity(0, 0.4),
    q2AgentNode().opacity(0, 0.4),
    q2Arrow().opacity(0, 0.4),
    q2ExitNode().opacity(0, 0.4),
    q2ExitGood().opacity(0, 0.4),
  );
  yield* waitFor(0.3);

  // ═══ Q3: COÛT DE REPRISE ══════════════════════════════════════════════════
  yield* waitUntil('q3');
  yield* q3Header().fill(PALETTE.cream, 0.4);
  yield* q3Header().opacity(1, 0.5);
  yield* waitFor(0.4);
  yield* sequence(0.1,
    q3S1().opacity(1, 0.35),
    q3S2().opacity(1, 0.35),
    q3S3().opacity(1, 0.35),
    q3S4().opacity(1, 0.35),
  );
  yield* waitFor(0.25);
  q3Arrow12().opacity(1);
  q3Arrow23().opacity(1);
  q3Arrow34().opacity(1);
  yield* all(
    q3Arrow12().end(1, 0.35, easeInOutCubic),
    q3Arrow23().end(1, 0.35, easeInOutCubic),
    q3Arrow34().end(1, 0.35, easeInOutCubic),
  );
  yield* waitFor(0.4);
  yield* q3S1().setState('success', 0.25);
  yield* waitFor(0.25);
  yield* q3S2().setState('success', 0.25);
  yield* waitFor(0.25);
  yield* q3S3().setState('success', 0.25);
  yield* waitFor(0.3);
  yield* q3S4().setState('error', 0.08);
  yield* waitFor(0.6);

  yield* waitUntil('q3-crash');
  q3RestartBad().opacity(1);
  yield* q3RestartBad().end(1, 0.9, easeInOutCubic);
  yield* waitFor(0.3);
  yield* q3CostLabel().opacity(1, 0.45);
  yield* waitFor(1.5);

  yield* waitUntil('q3-checkpoint');
  yield* all(
    q3RestartBad().opacity(0, 0.4),
    q3CostLabel().opacity(0, 0.35),
  );
  yield* waitFor(0.2);
  yield* sequence(0.12,
    q3Cp1().opacity(1, 0.3),
    q3Cp2().opacity(1, 0.3),
    q3Cp3().opacity(1, 0.3),
  );
  yield* waitFor(0.5);
  q3RestartGood().opacity(1);
  yield* q3RestartGood().end(1, 0.55, easeInOutCubic);
  yield* waitFor(1.2);

  yield* all(
    q3Header().opacity(0, 0.4),
    q3S1().opacity(0, 0.4),
    q3S2().opacity(0, 0.4),
    q3S3().opacity(0, 0.4),
    q3S4().opacity(0, 0.4),
    q3Arrow12().opacity(0, 0.4),
    q3Arrow23().opacity(0, 0.4),
    q3Arrow34().opacity(0, 0.4),
    q3Cp1().opacity(0, 0.4),
    q3Cp2().opacity(0, 0.4),
    q3Cp3().opacity(0, 0.4),
    q3RestartGood().opacity(0, 0.4),
  );
  yield* waitFor(0.3);

  // ═══ Q4: AUTONOMIE ════════════════════════════════════════════════════════
  yield* waitUntil('q4');
  yield* q4Header().fill(PALETTE.cream, 0.4);
  yield* q4Header().opacity(1, 0.5);
  yield* waitFor(0.4);
  yield* q4AgentNode().opacity(1, 0.45);
  yield* waitFor(0.25);
  q4BadArrow().opacity(1);
  yield* q4BadArrow().end(1, 0.55, easeInOutCubic);
  yield* waitFor(0.2);
  yield* q4HumanNode().opacity(1, 0.45);
  yield* all(
    q4Hourglass().opacity(1, 0.4),
    q4WaitLabel().opacity(1, 0.4),
  );
  const hourglassLoop = yield loop(Infinity, function* () {
    yield* q4Hourglass().rotation(180, 0.7, easeInOutCubic);
    yield* waitFor(0.3);
    yield* q4Hourglass().rotation(360, 0.7, easeInOutCubic);
    yield* waitFor(0.3);
    q4Hourglass().rotation(0);
  });
  yield* waitFor(3.5);
  cancel(hourglassLoop);

  yield* waitUntil('q4-good');
  yield* all(
    q4HumanNode().opacity(0, 0.35),
    q4Hourglass().opacity(0, 0.35),
    q4WaitLabel().opacity(0, 0.35),
    q4BadArrow().opacity(0, 0.35),
  );
  yield* waitFor(0.25);
  yield* q4LoopLabel().opacity(1, 0.4);
  yield* waitFor(0.3);
  q4GoodArrow().opacity(1);
  yield* q4GoodArrow().end(1, 0.65, easeInOutCubic);
  yield* waitFor(0.25);
  yield* q4ApproveNode().opacity(1, 0.5);
  yield* waitFor(1.2);

  yield* all(
    q4Header().opacity(0, 0.4),
    q4AgentNode().opacity(0, 0.4),
    q4LoopLabel().opacity(0, 0.4),
    q4GoodArrow().opacity(0, 0.4),
    q4ApproveNode().opacity(0, 0.4),
  );
  yield* waitFor(0.3);

  // ═══ SUMMARY: photo finish ════════════════════════════════════════════════
  yield* waitUntil('summary');
  yield* sequence(0.08,
    sPanel1().opacity(1, 0.45),
    sPanel2().opacity(1, 0.45),
    sPanel3().opacity(1, 0.45),
    sPanel4().opacity(1, 0.45),
  );
  yield* waitFor(0.1);
  yield* all(
    sH1().opacity(1, 0.35),
    sH2().opacity(1, 0.35),
    sH3().opacity(1, 0.35),
    sH4().opacity(1, 0.35),
  );
  yield* waitFor(0.3);
  yield* all(
    sQ1Task().opacity(1, 0.4),
    sQ1Loop().opacity(1, 0.4),
    sQ2Agent().opacity(1, 0.4),
    sQ2Exit().opacity(1, 0.4),
    sQ3S1().opacity(1, 0.4),
    sQ3S2().opacity(1, 0.4),
    sQ3S3().opacity(1, 0.4),
    sQ3S4().opacity(1, 0.4),
    sQ4Agent().opacity(1, 0.4),
    sQ4Approve().opacity(1, 0.4),
  );
  yield* waitFor(0.3);
  sQ2Arrow().opacity(1);
  yield* sQ2Arrow().end(1, 0.45, easeInOutCubic);
  sQ4Arrow().opacity(1);
  yield* sQ4Arrow().end(1, 0.45, easeInOutCubic);
  yield* waitFor(2.0);

  // ── Fade-out ───────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.5),
    sPanel1().opacity(0, 0.5),
    sPanel2().opacity(0, 0.5),
    sPanel3().opacity(0, 0.5),
    sPanel4().opacity(0, 0.5),
    sH1().opacity(0, 0.5),
    sH2().opacity(0, 0.5),
    sH3().opacity(0, 0.5),
    sH4().opacity(0, 0.5),
    sQ1Task().opacity(0, 0.5),
    sQ1Loop().opacity(0, 0.5),
    sQ2Agent().opacity(0, 0.5),
    sQ2Arrow().opacity(0, 0.5),
    sQ2Exit().opacity(0, 0.5),
    sQ3S1().opacity(0, 0.5),
    sQ3S2().opacity(0, 0.5),
    sQ3S3().opacity(0, 0.5),
    sQ3S4().opacity(0, 0.5),
    sQ4Agent().opacity(0, 0.5),
    sQ4Arrow().opacity(0, 0.5),
    sQ4Approve().opacity(0, 0.5),
  );
  yield* waitFor(0.3);
});
