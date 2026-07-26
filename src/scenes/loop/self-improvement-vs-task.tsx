/**
 * @file self-improvement-vs-task.tsx
 * @description Deux familles de loops — l'une après l'autre.
 * 1) Self-improvement loop : chaque mauvaise suggestion s'installe dans context.md
 *    et biaise toutes les sessions suivantes → DÉRIVE visible.
 * 2) Task loop : critères programmatiques fixes, jamais de contamination.
 */

import {makeScene2D, Grid, Rect, Txt} from '@motion-canvas/2d';
import {createRef, all, waitUntil, waitFor, easeInOutCubic} from '@motion-canvas/core';
import {DiagramNode, ConnectionArrow, Zone, Packet} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Refs ─────────────────────────────────────────────────────────────────────

  const gridRef = createRef<Grid>();

  // Zones
  const selfZoneRef = createRef<Zone>();
  const taskZoneRef = createRef<Zone>();

  // Self-improvement side
  const sessionNRef    = createRef<DiagramNode>();
  const sessionNextRef = createRef<DiagramNode>();
  const contextFileRef = createRef<DiagramNode>();
  const arrowWriteRef  = createRef<ConnectionArrow>();
  const arrowReadRef   = createRef<ConnectionArrow>();
  const packetWriteRef = createRef<Packet>();
  const packetBadRef   = createRef<Packet>();
  const packetReadRef  = createRef<Packet>();
  const driftLabelRef  = createRef<Txt>();
  const newSessionRef  = createRef<Txt>();

  // Task loop side
  const taskAgentRef   = createRef<DiagramNode>();
  const checkerRef     = createRef<DiagramNode>();
  const arrowTaskRef   = createRef<ConnectionArrow>();
  const arrowRetryRef  = createRef<ConnectionArrow>();
  const retryLabelRef  = createRef<Txt>();
  const criteriaBoxRef = createRef<Rect>();
  const crit1Ref       = createRef<Txt>();
  const crit2Ref       = createRef<Txt>();
  const crit3Ref       = createRef<Txt>();
  const doneLabelRef   = createRef<Txt>();
  const packetGoodRef  = createRef<Packet>();
  const packetFailRef  = createRef<Packet>();

  // ── Layout ───────────────────────────────────────────────────────────────────

  const NODE_W = () => vW() * 0.16;
  const NODE_H = () => vH() * 0.30;
  const NODE_Y = () => vH() * -0.05;

  // Self-improvement — centré
  const AGENT_L_X = () => vW() * -0.24;
  const CONTEXT_X = () => vW() *  0.24;

  // Task loop — centré
  const AGENT_R_X = () => vW() * -0.24;
  const CHECKER_X = () => vW() *  0.24;

  const CRIT_Y  = () => vH() *  0.30;
  const DONE_Y  = () => NODE_Y() - NODE_H() * 0.75;

  // ── Scene tree ───────────────────────────────────────────────────────────────

  view.add(
    <>
      {/* Grille de fond */}
      <Grid
        key="bg-grid"
        ref={gridRef}
        width={'100%'}
        height={'100%'}
        spacing={() => vW() * 0.05}
        stroke={PALETTE.ghost}
        lineWidth={1}
        opacity={0}
      />

      {/* Zone SELF-IMPROVEMENT — centrée */}
      <Zone
        key="zone-self"
        ref={selfZoneRef}
        color={PALETTE.amber}
        label="SELF-IMPROVEMENT"
        width={() => vW() * 0.80}
        height={() => vH() * 0.82}
        x={0}
        y={() => vH() * 0.02}
        opacity={0}
      />

      {/* Zone TASK LOOP — centrée, masquée au départ */}
      <Zone
        key="zone-task"
        ref={taskZoneRef}
        color={PALETTE.dsGreen}
        label="TASK LOOP"
        width={() => vW() * 0.80}
        height={() => vH() * 0.82}
        x={0}
        y={() => vH() * 0.02}
        opacity={0}
      />

      {/* ── SELF-IMPROVEMENT ── */}

      <DiagramNode
        key="session-n"
        ref={sessionNRef}
        iconName="mdi:console"
        label="Session N"
        sublabel="LLM · génère"
        color={PALETTE.cyan}
        width={NODE_W}
        height={NODE_H}
        x={AGENT_L_X}
        y={NODE_Y}
        initialState="active"
        opacity={0}
      />

      <DiagramNode
        key="session-next"
        ref={sessionNextRef}
        iconName="mdi:console"
        label="Session N+1"
        sublabel="LLM · lit contexte"
        color={PALETTE.rose}
        width={NODE_W}
        height={NODE_H}
        x={AGENT_L_X}
        y={NODE_Y}
        initialState="idle"
        opacity={0}
      />

      <DiagramNode
        key="context-file"
        ref={contextFileRef}
        iconName="mdi:file-document-outline"
        label="context.md"
        sublabel="mémoire persistante"
        color={PALETTE.dsGreen}
        width={NODE_W}
        height={NODE_H}
        x={CONTEXT_X}
        y={NODE_Y}
        initialState="idle"
        opacity={0}
      />

      {/* Flèche Session N → context.md (rail haut) */}
      <ConnectionArrow
        key="arrow-write"
        ref={arrowWriteRef}
        from={() => [AGENT_L_X() + NODE_W() / 2, NODE_Y() - NODE_H() * 0.08]}
        to={() =>   [CONTEXT_X() - NODE_W() / 2, NODE_Y() - NODE_H() * 0.08]}
        stroke={PALETTE.cyan}
        end={0}
        opacity={0}
      />

      {/* Flèche context.md → Session N+1 (rail bas, tiretée) */}
      <ConnectionArrow
        key="arrow-read"
        ref={arrowReadRef}
        from={() => [CONTEXT_X() - NODE_W() / 2, NODE_Y() + NODE_H() * 0.08]}
        to={() =>   [AGENT_L_X() + NODE_W() / 2, NODE_Y() + NODE_H() * 0.08]}
        stroke={PALETTE.rose}
        dashed
        end={0}
        opacity={0}
      />

      <Packet
        key="packet-write"
        ref={packetWriteRef}
        content="suggestion ok"
        color={PALETTE.cyan}
        packetSize="sm"
        width={() => vW() * 0.12}
        height={() => vH() * 0.06}
        x={AGENT_L_X}
        y={NODE_Y}
        opacity={0}
      />

      <Packet
        key="packet-bad"
        ref={packetBadRef}
        content="mauvaise suggestion"
        color={PALETTE.rose}
        packetSize="sm"
        width={() => vW() * 0.14}
        height={() => vH() * 0.06}
        x={AGENT_L_X}
        y={NODE_Y}
        opacity={0}
      />

      <Packet
        key="packet-read"
        ref={packetReadRef}
        content="contexte biaisé"
        color={PALETTE.rose}
        packetSize="sm"
        width={() => vW() * 0.12}
        height={() => vH() * 0.06}
        x={CONTEXT_X}
        y={NODE_Y}
        opacity={0}
      />

      <Txt
        key="new-session-label"
        ref={newSessionRef}
        text="nouvelle session →"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.014}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        x={AGENT_L_X}
        y={() => NODE_Y() + vH() * 0.23}
        opacity={0}
      />

      <Txt
        key="drift-label"
        ref={driftLabelRef}
        text="DÉRIVE"
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.034}
        fontFamily={'Space Grotesk, DM Sans, sans-serif'}
        fontWeight={800}
        x={CONTEXT_X}
        y={() => NODE_Y() - vH() * 0.32}
        opacity={0}
      />

      {/* ── TASK LOOP ── */}

      <DiagramNode
        key="task-agent"
        ref={taskAgentRef}
        iconName="mdi:console"
        label="Agent"
        sublabel="LLM · produit"
        color={PALETTE.cyan}
        width={NODE_W}
        height={NODE_H}
        x={AGENT_R_X}
        y={NODE_Y}
        initialState="active"
        opacity={0}
      />

      <DiagramNode
        key="checker-node"
        ref={checkerRef}
        iconName="mdi:cog"
        label="Checker"
        sublabel="programmatique"
        color={PALETTE.dsGreen}
        width={NODE_W}
        height={NODE_H}
        x={CHECKER_X}
        y={NODE_Y}
        initialState="idle"
        opacity={0}
      />

      <ConnectionArrow
        key="arrow-task"
        ref={arrowTaskRef}
        from={() => [AGENT_R_X() + NODE_W() / 2, NODE_Y()]}
        to={() =>   [CHECKER_X() - NODE_W() / 2, NODE_Y()]}
        stroke={PALETTE.cyan}
        end={0}
        opacity={0}
      />

      <ConnectionArrow
        key="arrow-retry"
        ref={arrowRetryRef}
        from={() => [CHECKER_X(),  NODE_Y() + NODE_H() / 2]}
        to={() =>   [AGENT_R_X(), NODE_Y() + NODE_H() / 2]}
        via={() => [0, NODE_Y() + NODE_H() / 2 + vH() * 0.054]}
        stroke={PALETTE.rose}
        dashed
        end={0}
        opacity={0}
      />

      <Txt
        key="retry-label"
        ref={retryLabelRef}
        text="retry"
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.015}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
        x={() => (AGENT_R_X() + CHECKER_X()) / 2}
        y={() => NODE_Y() + NODE_H() * 0.80}
        opacity={0}
      />

      <Rect
        key="criteria-box"
        ref={criteriaBoxRef}
        width={() => vW() * 0.38}
        height={() => vH() * 0.18}
        x={() => (AGENT_R_X() + CHECKER_X()) / 2}
        y={CRIT_Y}
        fill={PALETTE.bgCard}
        stroke={PALETTE.dsGreen + '55'}
        lineWidth={1}
        radius={6}
        opacity={0}
      >
        <Txt
          key="crit-1"
          ref={crit1Ref}
          text="tests passent"
          fill={PALETTE.secondary}
          fontSize={() => vW() * 0.015}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          y={() => vH() * -0.048}
        />
        <Txt
          key="crit-2"
          ref={crit2Ref}
          text="diff < 300 lignes"
          fill={PALETTE.secondary}
          fontSize={() => vW() * 0.015}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          y={0}
        />
        <Txt
          key="crit-3"
          ref={crit3Ref}
          text="score eval > 0.85"
          fill={PALETTE.secondary}
          fontSize={() => vW() * 0.015}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          y={() => vH() * 0.048}
        />
      </Rect>

      <Txt
        key="done-label"
        ref={doneLabelRef}
        text="DONE ✓"
        fill={PALETTE.dsGreen}
        fontSize={() => vW() * 0.030}
        fontFamily={'Space Grotesk, DM Sans, sans-serif'}
        fontWeight={800}
        x={CHECKER_X}
        y={DONE_Y}
        opacity={0}
      />

      <Packet
        key="packet-good"
        ref={packetGoodRef}
        content="output"
        color={PALETTE.cyan}
        packetSize="sm"
        width={() => vW() * 0.09}
        height={() => vH() * 0.06}
        x={AGENT_R_X}
        y={NODE_Y}
        opacity={0}
      />

      <Packet
        key="packet-fail"
        ref={packetFailRef}
        content="output ✗"
        color={PALETTE.rose}
        packetSize="sm"
        width={() => vW() * 0.09}
        height={() => vH() * 0.06}
        x={AGENT_R_X}
        y={NODE_Y}
        opacity={0}
      />
    </>,
  );

  // ── ANIMATION ─────────────────────────────────────────────────────────────────

  // intro — grille + zone self-improvement seulement
  yield* waitUntil('intro');
  yield* gridRef().opacity(0.10, 0.5);
  yield* selfZoneRef().opacity(1, 0.4, easeInOutCubic);

  // self-appears — Session N + context.md + flèche écriture
  yield* waitUntil('self-appears');
  yield* all(
    sessionNRef().opacity(1, 0.3),
    contextFileRef().opacity(1, 0.3),
  );
  arrowWriteRef().opacity(1);
  yield* arrowWriteRef().end(1, 0.5, easeInOutCubic);

  // self-write-ok — première suggestion (neutre) enregistrée dans le fichier
  yield* waitUntil('self-write-ok');
  yield* packetWriteRef().opacity(1, 0.2);
  yield* packetWriteRef().flyTo([CONTEXT_X(), NODE_Y()], 0.75);
  yield* packetWriteRef().opacity(0, 0.15);
  yield* contextFileRef().setState('success', 0.2);

  // self-write-bad — mauvaise suggestion → fichier corrompu de façon permanente
  yield* waitUntil('self-write-bad');
  yield* contextFileRef().setState('idle', 0.1);
  yield* packetBadRef().opacity(1, 0.2);
  yield* packetBadRef().flyTo([CONTEXT_X(), NODE_Y()], 0.75);
  yield* packetBadRef().opacity(0, 0.15);
  yield* contextFileRef().setState('error', 0.35);

  // self-new-session — Session N disparaît, Session N+1 lit le contexte corrompu
  yield* waitUntil('self-new-session');
  yield* all(
    sessionNRef().opacity(0, 0.4),
    newSessionRef().opacity(1, 0.25),
  );
  yield* waitFor(0.3);
  yield* all(
    sessionNextRef().opacity(1, 0.4),
    newSessionRef().opacity(0, 0.2),
  );
  arrowReadRef().opacity(1);
  yield* arrowReadRef().end(1, 0.45, easeInOutCubic);
  yield* packetReadRef().opacity(1, 0.2);
  yield* packetReadRef().flyTo([AGENT_L_X(), NODE_Y()], 0.75);
  yield* packetReadRef().opacity(0, 0.15);
  yield* sessionNextRef().setState('error', 0.25);

  // self-drift — DÉRIVE apparaît au-dessus du fichier
  yield* waitUntil('self-drift');
  yield* driftLabelRef().opacity(1, 0.4);

  // task-appears — transition : on efface le self-improvement, on affiche la task loop
  yield* waitUntil('task-appears');
  yield* all(
    selfZoneRef().opacity(0, 0.4),
    sessionNextRef().opacity(0, 0.35),
    contextFileRef().opacity(0, 0.35),
    arrowWriteRef().opacity(0, 0.3),
    arrowReadRef().opacity(0, 0.3),
    driftLabelRef().opacity(0, 0.3),
  );
  yield* taskZoneRef().opacity(1, 0.4, easeInOutCubic);
  yield* all(
    taskAgentRef().opacity(1, 0.3),
    checkerRef().opacity(1, 0.3),
  );
  arrowTaskRef().opacity(1);
  yield* arrowTaskRef().end(1, 0.5, easeInOutCubic);
  yield* criteriaBoxRef().opacity(1, 0.35);

  // task-pass — output valide → critères verts → DONE
  yield* waitUntil('task-pass');
  yield* packetGoodRef().opacity(1, 0.2);
  yield* packetGoodRef().flyTo([CHECKER_X(), NODE_Y()], 0.7);
  yield* packetGoodRef().opacity(0, 0.15);
  yield* checkerRef().setState('active', 0.1);
  yield* all(
    crit1Ref().fill(PALETTE.dsGreen, 0.2),
    crit2Ref().fill(PALETTE.dsGreen, 0.2),
    crit3Ref().fill(PALETTE.dsGreen, 0.2),
  );
  yield* checkerRef().setState('success', 0.15);
  yield* doneLabelRef().opacity(1, 0.35);

  // task-fail — reset, output raté → un critère échoue → retry
  yield* waitUntil('task-fail');
  yield* all(
    doneLabelRef().opacity(0, 0.25),
    checkerRef().setState('idle', 0.15),
  );
  yield* all(
    crit1Ref().fill(PALETTE.secondary, 0.15),
    crit2Ref().fill(PALETTE.secondary, 0.15),
    crit3Ref().fill(PALETTE.secondary, 0.15),
  );
  yield* packetFailRef().opacity(1, 0.2);
  yield* packetFailRef().flyTo([CHECKER_X(), NODE_Y()], 0.7);
  yield* packetFailRef().opacity(0, 0.15);
  yield* checkerRef().setState('error', 0.15);
  yield* crit1Ref().fill(PALETTE.rose, 0.2);
  arrowRetryRef().opacity(1);
  yield* all(
    arrowRetryRef().end(1, 0.5, easeInOutCubic),
    retryLabelRef().opacity(1, 0.25),
  );
  yield* taskAgentRef().setState('highlighted', 0.15);

  // end — tout disparaît
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.4),
    taskZoneRef().opacity(0, 0.5),
    taskAgentRef().opacity(0, 0.4),
    checkerRef().opacity(0, 0.4),
    arrowTaskRef().opacity(0, 0.35),
    arrowRetryRef().opacity(0, 0.35),
    retryLabelRef().opacity(0, 0.3),
    criteriaBoxRef().opacity(0, 0.4),
  );
  yield* waitFor(0.3);
});
