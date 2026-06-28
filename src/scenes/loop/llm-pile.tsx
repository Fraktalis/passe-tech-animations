/**
 * @file llm-pile.tsx
 * @description ACTE 1 — Double pile : Informatique Classique vs Agentic (vidéo Loop Engineering)
 * Deux colonnes côte à côte, révélées ligne par ligne pour montrer l'équivalence :
 *   INSTRUCTIONS ≡ PROMPT  |  MODULES ≡ SKILLS  |  FONCTIONS ≡ MCP TOOLS  |  BOUCLE ≡ LOOP
 */

import {makeScene2D, Layout, Rect, Txt} from '@motion-canvas/2d';
import {createRef, all, sequence, waitUntil} from '@motion-canvas/core';
import {DiagramNode} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  // ── Layout ────────────────────────────────────────────────────────────────
  const leftX  = () => -vW() * 0.28;
  const rightX = () =>  vW() * 0.28;
  const nodeW  = () =>  vW() * 0.30;
  const nodeH  = () =>  vH() * 0.14;

  const ROW_Y = [
    () => vH() * -0.300,
    () => vH() * -0.140,
    () => vH() *  0.020,
    () => vH() *  0.180,
    () => vH() *  0.340,
  ];

  const TRAD_COLOR  = PALETTE.jaune;
  const AGENT_COLOR = PALETTE.cyan;

  // ── Refs — classique (gauche) ─────────────────────────────────────────────
  const instrNodeRef  = createRef<DiagramNode>();
  const modNodeRef    = createRef<DiagramNode>();
  const fnNodeRef     = createRef<DiagramNode>();
  const boucleNodeRef = createRef<DiagramNode>();

  // ── Refs — agentic (droite) ───────────────────────────────────────────────
  const promptNodeRef = createRef<DiagramNode>();
  const skillsNodeRef = createRef<DiagramNode>();
  const toolsNodeRef  = createRef<DiagramNode>();
  const loopNodeRef   = createRef<DiagramNode>();

  // ── Refs — UI ─────────────────────────────────────────────────────────────
  const titleRef       = createRef<Txt>();
  const headerLeftRef  = createRef<Txt>();
  const headerRightRef = createRef<Txt>();
  const conn1Ref       = createRef<Txt>();
  const conn2Ref       = createRef<Txt>();
  const conn3Ref       = createRef<Txt>();
  const conn4Ref       = createRef<Txt>();
  const conn5Ref       = createRef<Txt>();

  // ── Refs — 5e ligne : le conditionnel manquant ─────────────────────────────
  const ifNodeRef       = createRef<DiagramNode>();
  const verifierNodeRef = createRef<DiagramNode>();

  // ── Scene tree ────────────────────────────────────────────────────────────

  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>

      <Rect key="bg" width={'100%'} height={'100%'} fill={PALETTE.bg} />

      {/* Titre */}
      <Txt
        key="title"
        ref={titleRef}
        text="LES BLOCS DE BASE"
        fill={PALETTE.cream}
        fontSize={() => vW() * 0.018}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
        y={() => vH() * -0.470}
        opacity={0}
      />

      {/* En-têtes de colonnes */}
      <Txt
        key="header-left"
        ref={headerLeftRef}
        text="INFORMATIQUE CLASSIQUE"
        fill={TRAD_COLOR}
        fontSize={() => vW() * 0.012}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
        x={leftX}
        y={() => vH() * -0.410}
        opacity={0}
      />
      <Txt
        key="header-right"
        ref={headerRightRef}
        text="IA AGENTIQUE"
        fill={AGENT_COLOR}
        fontSize={() => vW() * 0.012}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
        x={rightX}
        y={() => vH() * -0.410}
        opacity={0}
      />

      {/* Connecteurs ≡ entre paires */}
      <Txt key="conn-1" ref={conn1Ref} text="≡" fill={PALETTE.ghost} fontSize={() => vW() * 0.022} fontFamily={'DM Mono, monospace'} x={0} y={ROW_Y[0]} opacity={0} />
      <Txt key="conn-2" ref={conn2Ref} text="≡" fill={PALETTE.ghost} fontSize={() => vW() * 0.022} fontFamily={'DM Mono, monospace'} x={0} y={ROW_Y[1]} opacity={0} />
      <Txt key="conn-3" ref={conn3Ref} text="≡" fill={PALETTE.ghost} fontSize={() => vW() * 0.022} fontFamily={'DM Mono, monospace'} x={0} y={ROW_Y[2]} opacity={0} />
      <Txt key="conn-4" ref={conn4Ref} text="≡" fill={PALETTE.ghost} fontSize={() => vW() * 0.022} fontFamily={'DM Mono, monospace'} x={0} y={ROW_Y[3]} opacity={0} />
      {/* ≈ : équivalence imparfaite — le conditionnel n'est pas déterministe côté LLM */}
      <Txt key="conn-5" ref={conn5Ref} text="≈" fill={PALETTE.rose} fontSize={() => vW() * 0.022} fontFamily={'DM Mono, monospace'} x={0} y={ROW_Y[4]} opacity={0} />

      {/* ── Classique (gauche) ── */}
      <DiagramNode
        key="node-instr"
        ref={instrNodeRef}
        iconName="mdi:code-braces"
        color={TRAD_COLOR}
        label="INSTRUCTIONS"
        sublabel="écrire ce que la machine fait"
        initialState="idle"
        width={nodeW}
        height={nodeH}
        x={leftX}
        y={ROW_Y[0]}
        opacity={0}
      />
      <DiagramNode
        key="node-mod"
        ref={modNodeRef}
        iconName="mdi:package-variant"
        color={TRAD_COLOR}
        label="MODULES"
        sublabel="import, réutilisation"
        initialState="idle"
        width={nodeW}
        height={nodeH}
        x={leftX}
        y={ROW_Y[1]}
        opacity={0}
      />
      <DiagramNode
        key="node-fn"
        ref={fnNodeRef}
        iconName="mdi:function-variant"
        color={TRAD_COLOR}
        label="FONCTIONS"
        sublabel="isolation + effets de bord"
        initialState="idle"
        width={nodeW}
        height={nodeH}
        x={leftX}
        y={ROW_Y[2]}
        opacity={0}
      />
      <DiagramNode
        key="node-boucle"
        ref={boucleNodeRef}
        iconName="mdi:repeat"
        color={TRAD_COLOR}
        label="BOUCLE"
        sublabel="while condition: ..."
        initialState="idle"
        width={nodeW}
        height={nodeH}
        x={leftX}
        y={ROW_Y[3]}
        opacity={0}
      />

      {/* ── Agentic (droite) ── */}
      <DiagramNode
        key="node-prompt"
        ref={promptNodeRef}
        iconName="mdi:chat-outline"
        color={AGENT_COLOR}
        label="PROMPT"
        sublabel="instruction au modèle"
        initialState="idle"
        width={nodeW}
        height={nodeH}
        x={rightX}
        y={ROW_Y[0]}
        opacity={0}
      />
      <DiagramNode
        key="node-skills"
        ref={skillsNodeRef}
        iconName="mdi:layers-outline"
        color={AGENT_COLOR}
        label="SKILLS"
        sublabel="contexte importé"
        initialState="idle"
        width={nodeW}
        height={nodeH}
        x={rightX}
        y={ROW_Y[1]}
        opacity={0}
      />
      <DiagramNode
        key="node-tools"
        ref={toolsNodeRef}
        iconName="mdi:server"
        color={AGENT_COLOR}
        label="MCP TOOLS"
        sublabel="actions sur l'extérieur"
        initialState="idle"
        width={nodeW}
        height={nodeH}
        x={rightX}
        y={ROW_Y[2]}
        opacity={0}
      />
      <DiagramNode
        key="node-loop"
        ref={loopNodeRef}
        iconName="mdi:console"
        color={AGENT_COLOR}
        label="LOOP"
        sublabel="while True: claude(prompt)"
        initialState="idle"
        width={nodeW}
        height={nodeH}
        x={rightX}
        y={ROW_Y[3]}
        opacity={0}
      />

      {/* ── 5e ligne — Le conditionnel manquant ── */}
      <DiagramNode
        key="node-if"
        ref={ifNodeRef}
        iconName="mdi:call-split"
        color={TRAD_COLOR}
        label="CONDITIONNEL"
        sublabel="if / else — toujours certain"
        initialState="idle"
        width={nodeW}
        height={nodeH}
        x={leftX}
        y={ROW_Y[4]}
        opacity={0}
      />
      <DiagramNode
        key="node-verifier"
        ref={verifierNodeRef}
        iconName="mdi:gavel"
        color={PALETTE.rose}
        label="VERIFIER AGENT"
        sublabel="LLM as a judge — probabiliste"
        initialState="idle"
        width={nodeW}
        height={nodeH}
        x={rightX}
        y={ROW_Y[4]}
        opacity={0}
      />

    </Layout>
  );

  // ── Animation ─────────────────────────────────────────────────────────────

  yield* waitUntil('intro');
  yield* all(
    titleRef().opacity(1, 0.4),
    headerLeftRef().opacity(1, 0.4),
    headerRightRef().opacity(1, 0.4),
  );

  // Ligne 1 — INSTRUCTIONS ≡ PROMPT
  yield* waitUntil('prompt');
  yield* sequence(0.3,
    instrNodeRef().opacity(1, 0.3),
    promptNodeRef().opacity(1, 0.3),
    conn1Ref().opacity(1, 0.3),
  );
  yield* all(
    instrNodeRef().setState('highlighted', 0.15),
    promptNodeRef().setState('highlighted', 0.15),
  );

  // Ligne 2 — MODULES ≡ SKILLS
  yield* waitUntil('skills');
  yield* sequence(0.3,
    modNodeRef().opacity(1, 0.3),
    skillsNodeRef().opacity(1, 0.3),
    conn2Ref().opacity(1, 0.3),
  );
  yield* all(
    modNodeRef().setState('highlighted', 0.15),
    skillsNodeRef().setState('highlighted', 0.15),
  );

  // Ligne 3 — FONCTIONS ≡ MCP TOOLS
  yield* waitUntil('tools');
  yield* sequence(0.3,
    fnNodeRef().opacity(1, 0.3),
    toolsNodeRef().opacity(1, 0.3),
    conn3Ref().opacity(1, 0.3),
  );
  yield* all(
    fnNodeRef().setState('highlighted', 0.15),
    toolsNodeRef().setState('highlighted', 0.15),
  );

  // Ligne 4 — BOUCLE ≡ LOOP
  yield* waitUntil('loop');
  yield* sequence(0.3,
    boucleNodeRef().opacity(1, 0.3),
    loopNodeRef().opacity(1, 0.3),
    conn4Ref().opacity(1, 0.3),
  );
  yield* all(
    boucleNodeRef().setState('highlighted', 0.15),
    loopNodeRef().setState('highlighted', 0.15),
  );

  // Full — les deux piles actives en cascade gauche → droite
  yield* waitUntil('full');
  yield* sequence(0.06,
    instrNodeRef().setState('active', 0.2),
    promptNodeRef().setState('active', 0.2),
    modNodeRef().setState('active', 0.2),
    skillsNodeRef().setState('active', 0.2),
    fnNodeRef().setState('active', 0.2),
    toolsNodeRef().setState('active', 0.2),
    boucleNodeRef().setState('active', 0.2),
    loopNodeRef().setState('active', 0.2),
  );

  // Ligne 5 — CONDITIONNEL ≈ VERIFIER AGENT (le conditionnel manquant)
  yield* waitUntil('verifier');
  yield* sequence(0.3,
    ifNodeRef().opacity(1, 0.3),
    verifierNodeRef().opacity(1, 0.3),
    conn5Ref().opacity(1, 0.3),
  );
  yield* all(
    ifNodeRef().setState('highlighted', 0.15),
    verifierNodeRef().setState('highlighted', 0.15),
  );

  // End — fade out général
  yield* waitUntil('end');
  yield* all(
    titleRef().opacity(0, 0.4),
    headerLeftRef().opacity(0, 0.4),
    headerRightRef().opacity(0, 0.4),
    instrNodeRef().opacity(0, 0.4),
    modNodeRef().opacity(0, 0.4),
    fnNodeRef().opacity(0, 0.4),
    boucleNodeRef().opacity(0, 0.4),
    promptNodeRef().opacity(0, 0.4),
    skillsNodeRef().opacity(0, 0.4),
    toolsNodeRef().opacity(0, 0.4),
    loopNodeRef().opacity(0, 0.4),
    ifNodeRef().opacity(0, 0.4),
    verifierNodeRef().opacity(0, 0.4),
    conn1Ref().opacity(0, 0.4),
    conn2Ref().opacity(0, 0.4),
    conn3Ref().opacity(0, 0.4),
    conn4Ref().opacity(0, 0.4),
    conn5Ref().opacity(0, 0.4),
  );
});
