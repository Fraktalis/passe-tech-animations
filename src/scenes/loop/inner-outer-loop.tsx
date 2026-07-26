/**
 * @file inner-outer-loop.tsx
 * @description Deux espaces : intérieur (agent libre) vs extérieur (verifier mécanique).
 * Show don't tell — aucun callout explicatif. Le comportement EST le message.
 */

import {makeScene2D, Grid, Rect, Txt} from '@motion-canvas/2d';
import {
  createRef,
  all,
  sequence,
  waitUntil,
  waitFor,
  easeInOutCubic,
} from '@motion-canvas/core';
import {DiagramNode, ConnectionArrow, Zone} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef        = createRef<Grid>();
  const outerZone      = createRef<Zone>();
  const innerZone      = createRef<Zone>();
  const agentNode      = createRef<DiagramNode>();
  const toolSearch     = createRef<DiagramNode>();
  const toolCode       = createRef<DiagramNode>();
  const toolBash       = createRef<DiagramNode>();
  const verifierNode   = createRef<DiagramNode>();
  const arrowToSearch  = createRef<ConnectionArrow>();
  const arrowToCode    = createRef<ConnectionArrow>();
  const arrowToBash    = createRef<ConnectionArrow>();
  const arrowToVerif   = createRef<ConnectionArrow>();
  const arrowRetry     = createRef<ConnectionArrow>();
  const arrowDone      = createRef<ConnectionArrow>();
  const doneRect       = createRef<Rect>();

  // ── Layout ─────────────────────────────────────────────────────────────────
  // Agent — légèrement à gauche du centre, au milieu de la zone intérieure
  const AGENT_X = () => vW() * -0.10;
  const NODE_W  = () => vW() * 0.12;
  const NODE_H  = () => vH() * 0.26;

  // Outils — colonne à gauche de l'agent (dans la zone intérieure)
  const TOOL_X = () => vW() * -0.26;
  const TOOL_W = () => vW() * 0.10;
  const TOOL_H = () => vH() * 0.15;

  // Verifier — droite, dans la zone extérieure (hors zone intérieure)
  const VERIF_X = () => vW() * 0.27;

  // DONE — à l'extrémité droite, hors boucle
  const DONE_X = () => vW() * 0.43;
  const DONE_Y = () => vH() * -0.20;
  const DONE_W = () => vW() * 0.09;
  const DONE_H = () => vH() * 0.07;

  // ── Scene tree ─────────────────────────────────────────────────────────────
  view.add(
    <>
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

      {/* Zone extérieure — amber : périmètre du loop, verifier à droite */}
      <Zone
        key="outer-zone"
        ref={outerZone}
        color={PALETTE.amber}
        label="LOOP"
        width={() => vW() * 0.84}
        height={() => vH() * 0.80}
        x={0}
        y={0}
        scale={0.88}
        opacity={0}
      />

      {/* Zone intérieure — cyan : espace de l'agent */}
      <Zone
        key="inner-zone"
        ref={innerZone}
        color={PALETTE.cyan}
        label="AGENT"
        width={() => vW() * 0.46}
        height={() => vH() * 0.72}
        x={AGENT_X}
        y={0}
        opacity={0}
      />

      {/* Agent */}
      <DiagramNode
        key="agent-node"
        ref={agentNode}
        iconName="mdi:console"
        label="Agent"
        sublabel="Claude"
        color={PALETTE.cyan}
        width={NODE_W}
        height={NODE_H}
        x={AGENT_X}
        y={0}
        opacity={0}
      />

      {/* Outil : search */}
      <DiagramNode
        key="tool-search"
        ref={toolSearch}
        iconName="lucide:search"
        label="search"
        color={PALETTE.secondary}
        width={TOOL_W}
        height={TOOL_H}
        x={TOOL_X}
        y={() => vH() * -0.17}
        opacity={0}
      />

      {/* Outil : code */}
      <DiagramNode
        key="tool-code"
        ref={toolCode}
        iconName="mdi:code-braces"
        label="code"
        color={PALETTE.secondary}
        width={TOOL_W}
        height={TOOL_H}
        x={TOOL_X}
        y={0}
        opacity={0}
      />

      {/* Outil : bash */}
      <DiagramNode
        key="tool-bash"
        ref={toolBash}
        iconName="mdi:console"
        label="bash"
        color={PALETTE.secondary}
        width={TOOL_W}
        height={TOOL_H}
        x={TOOL_X}
        y={() => vH() * 0.17}
        opacity={0}
      />

      {/* Flèches agent → outils
          from.y est clampé au bord du nœud agent (±NODE_H/2) car les outils
          sont à ±0.17*vH mais l'agent ne fait que ±0.13*vH de demi-hauteur.
          L'écart crée un routing diagonal géré automatiquement. */}
      <ConnectionArrow
        key="arrow-to-search"
        ref={arrowToSearch}
        from={() => [AGENT_X() - NODE_W() / 2, -NODE_H() / 2]}
        to={() =>   [TOOL_X() + TOOL_W() / 2,  vH() * -0.17]}
        stroke={PALETTE.cyan}
        end={0}
        opacity={0}
      />
      <ConnectionArrow
        key="arrow-to-code"
        ref={arrowToCode}
        from={() => [AGENT_X() - NODE_W() / 2, 0]}
        to={() =>   [TOOL_X() + TOOL_W() / 2,  0]}
        stroke={PALETTE.cyan}
        end={0}
        opacity={0}
      />
      <ConnectionArrow
        key="arrow-to-bash"
        ref={arrowToBash}
        from={() => [AGENT_X() - NODE_W() / 2, NODE_H() / 2]}
        to={() =>   [TOOL_X() + TOOL_W() / 2,  vH() * 0.17]}
        stroke={PALETTE.cyan}
        end={0}
        opacity={0}
      />

      {/* Flèche agent → verifier (output) */}
      <ConnectionArrow
        key="arrow-to-verifier"
        ref={arrowToVerif}
        from={() => [AGENT_X() + NODE_W() / 2, 0]}
        to={() =>   [VERIF_X() - NODE_W() / 2, 0]}
        stroke={PALETTE.cyan}
        end={0}
        opacity={0}
      />

      {/* Verifier — hors zone intérieure, dans zone extérieure */}
      <DiagramNode
        key="verifier-node"
        ref={verifierNode}
        iconName="mdi:check-circle-outline"
        label="Verifier"
        sublabel="critère objectif"
        color={PALETTE.amber}
        width={NODE_W}
        height={NODE_H}
        x={VERIF_X}
        y={0}
        opacity={0}
      />

      {/* Flèche verifier → DONE (succès) */}
      <ConnectionArrow
        key="arrow-done"
        ref={arrowDone}
        from={() => [VERIF_X() + NODE_W() / 2, -NODE_H() * 0.2]}
        to={() =>   [DONE_X() - DONE_W() / 2,  DONE_Y()]}
        stroke={PALETTE.dsGreen}
        end={0}
        opacity={0}
      />

      {/* Flèche verifier → agent (retry — arc en U sous les nœuds) */}
      <ConnectionArrow
        key="arrow-retry"
        ref={arrowRetry}
        from={() => [VERIF_X() - NODE_W() * 0.1, NODE_H() / 2]}
        to={() =>   [AGENT_X() + NODE_W() * 0.1, NODE_H() / 2]}
        via={() =>  [(AGENT_X() + VERIF_X()) / 2, NODE_H() / 2 + vH() * 0.12]}
        stroke={PALETTE.amber}
        dashed
        end={0}
        opacity={0}
      />

      {/* Nœud DONE */}
      <Rect
        key="done-rect"
        ref={doneRect}
        width={DONE_W}
        height={DONE_H}
        x={DONE_X}
        y={DONE_Y}
        fill={PALETTE.dsGreen + '14'}
        stroke={PALETTE.dsGreen}
        lineWidth={2}
        radius={8}
        opacity={0}
      >
        <Txt
          key="done-txt"
          text="DONE"
          fill={PALETTE.dsGreen}
          fontSize={() => vW() * 0.02}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          fontWeight={700}
        />
      </Rect>
    </>
  );

  // ── Séquence ───────────────────────────────────────────────────────────────

  // ACTE 1 — Zone intérieure : l'agent et ses outils
  yield* waitUntil('inner');
  yield* all(
    gridRef().opacity(0.12, 0.6),
    innerZone().opacity(1, 0.5, easeInOutCubic),
  );
  yield* agentNode().opacity(1, 0.3);
  yield* agentNode().setState('active', 0.15);

  yield* waitUntil('tools');
  yield* sequence(0.12,
    toolSearch().opacity(1, 0.25),
    toolCode().opacity(1, 0.25),
    toolBash().opacity(1, 0.25),
  );

  // ACTE 2 — L'agent navigue : essaie, échoue, adapte
  // Essai 1 : search → succès
  yield* waitUntil('try-search');
  arrowToSearch().opacity(1);
  yield* arrowToSearch().end(1, 0.4, easeInOutCubic);
  yield* toolSearch().setState('active', 0.1);
  yield* waitFor(0.3);
  yield* toolSearch().setState('success', 0.15);
  yield* waitFor(0.35);
  yield* all(
    arrowToSearch().opacity(0, 0.25),
    toolSearch().setState('idle', 0.3),
  );

  // Essai 2 : code → ÉCHEC — l'agent change de route
  yield* waitUntil('try-code');
  arrowToCode().opacity(1);
  yield* arrowToCode().end(1, 0.4, easeInOutCubic);
  yield* toolCode().setState('active', 0.1);
  yield* waitFor(0.25);
  yield* toolCode().setState('error', 0.08);
  yield* waitFor(0.4);
  yield* all(
    arrowToCode().opacity(0, 0.25),
    toolCode().setState('idle', 0.35),
  );

  // Essai 3 : bash — nouvelle approche → succès
  yield* waitUntil('try-bash');
  arrowToBash().opacity(1);
  yield* arrowToBash().end(1, 0.4, easeInOutCubic);
  yield* toolBash().setState('active', 0.1);
  yield* waitFor(0.3);
  yield* toolBash().setState('success', 0.15);
  yield* agentNode().setState('success', 0.15);

  // ACTE 3 — Zone extérieure : le verifier mécanique
  yield* waitUntil('outer');
  yield* all(
    arrowToBash().opacity(0, 0.3),
    toolBash().setState('idle', 0.3),
    agentNode().setState('active', 0.2),
  );
  yield* all(
    outerZone().opacity(1, 0.55, easeInOutCubic),
    outerZone().scale(1, 0.55, easeInOutCubic),
  );
  yield* verifierNode().opacity(1, 0.3);

  // Agent envoie son output au verifier
  yield* waitUntil('output');
  arrowToVerif().opacity(1);
  yield* arrowToVerif().end(1, 0.55, easeInOutCubic);
  yield* verifierNode().setState('active', 0.15);

  // Vérification réussie → DONE
  yield* waitUntil('check-yes');
  yield* verifierNode().setState('success', 0.2);
  arrowDone().opacity(1);
  yield* arrowDone().end(1, 0.45, easeInOutCubic);
  yield* doneRect().opacity(1, 0.3);

  // Alternative : vérification échouée → retour agent
  yield* waitUntil('check-no');
  yield* all(
    doneRect().opacity(0, 0.2),
    arrowDone().opacity(0, 0.2),
  );
  yield* verifierNode().setState('error', 0.08);
  yield* waitFor(0.2);
  arrowRetry().opacity(1);
  yield* arrowRetry().end(1, 0.55, easeInOutCubic);
  yield* agentNode().setState('active', 0.15);

  // ── Fade out ───────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.4),
    outerZone().opacity(0, 0.5),
    innerZone().opacity(0, 0.5),
    agentNode().opacity(0, 0.5),
    toolSearch().opacity(0, 0.5),
    toolCode().opacity(0, 0.5),
    toolBash().opacity(0, 0.5),
    verifierNode().opacity(0, 0.5),
    arrowToVerif().opacity(0, 0.5),
    arrowDone().opacity(0, 0.5),
    arrowRetry().opacity(0, 0.5),
    doneRect().opacity(0, 0.5),
  );
});
