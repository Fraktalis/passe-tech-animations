/**
 * @file verifier-agent.tsx
 * @description ACTE 2 — L'agent juge (LLM-as-judge)
 * Scène : Zone LOOP avec Agent (gauche) et Verifier (droite).
 * L'agent produit du code → flèche vers le verifier → YES (DONE) ou NO (retour).
 */

import {makeScene2D, Rect, Txt} from '@motion-canvas/2d';
import {
  createRef,
  all,
  waitUntil,
  waitFor,
  easeInOutCubic,
} from '@motion-canvas/core';
import {
  DiagramNode,
  ConnectionArrow,
  Zone,
  Callout,
} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  // ── Helpers proportionnels ──────────────────────────────────────────────────
  const vW = () => view.width();
  const vH = () => view.height();

  // ── Refs ────────────────────────────────────────────────────────────────────
  const loopZone          = createRef<Zone>();
  const agentNode         = createRef<DiagramNode>();
  const verifierNode      = createRef<DiagramNode>();
  const doneRect          = createRef<Rect>();
  const doneTxt           = createRef<Txt>();
  const arrowAgentVerif   = createRef<ConnectionArrow>();
  const arrowVerifDone    = createRef<ConnectionArrow>();
  const arrowVerifAgent   = createRef<ConnectionArrow>();  // NO path
  const criteriaCallout   = createRef<Callout>();

  // ── Label "output" sur la flèche Agent→Verifier ─────────────────────────────
  const labelOutput       = createRef<Txt>();
  const labelYes          = createRef<Txt>();
  const labelNo           = createRef<Txt>();

  // ── Layout constants ────────────────────────────────────────────────────────
  // Zone LOOP : centrée, prend ~75% de la largeur, ~55% de la hauteur
  const ZONE_W  = () => vW() * 0.75;
  const ZONE_H  = () => vH() * 0.55;
  const ZONE_X  = () => vW() * -0.025;  // légèrement à gauche du centre
  const ZONE_Y  = () => vH() * -0.05;

  // Agent : dans la zone, quart gauche
  const AGENT_X = () => vW() * -0.22;
  const AGENT_Y = () => ZONE_Y();
  const NODE_W  = () => vW() * 0.15;
  const NODE_H  = () => vH() * 0.34;

  // Verifier : dans la zone, quart droit
  const VERIF_X = () => vW() * 0.17;
  const VERIF_Y = () => ZONE_Y();

  // DONE : hors zone, à droite
  const DONE_X  = () => vW() * 0.38;
  const DONE_Y  = () => vH() * -0.18;
  const DONE_W  = () => vW() * 0.10;
  const DONE_H  = () => vH() * 0.08;

  // ── Scène ───────────────────────────────────────────────────────────────────
  view.add(
    <>
      {/* Zone LOOP (fond + bordure) */}
      <Zone
        key="loop-zone"
        ref={loopZone}
        color={PALETTE.cyan}
        label="LOOP"
        width={ZONE_W}
        height={ZONE_H}
        x={ZONE_X}
        y={ZONE_Y}
        opacity={0}
      />

      {/* Agent LLM */}
      <DiagramNode
        key="agent-node"
        ref={agentNode}
        iconName="mdi:console"
        label="Agent"
        sublabel="Claude · loop"
        color={PALETTE.cyan}
        width={NODE_W}
        height={NODE_H}
        x={AGENT_X}
        y={AGENT_Y}
        initialState="idle"
        opacity={0}
      />

      {/* Verifier (LLM-as-judge) */}
      <DiagramNode
        key="verifier-node"
        ref={verifierNode}
        iconName="mdi:server"
        label="Verifier"
        sublabel="LLM-as-judge"
        color={PALETTE.amber}
        width={NODE_W}
        height={NODE_H}
        x={VERIF_X}
        y={VERIF_Y}
        initialState="idle"
        opacity={0}
      />

      {/* Flèche Agent → Verifier */}
      <ConnectionArrow
        key="arrow-agent-verif"
        ref={arrowAgentVerif}
        from={() => [AGENT_X() + NODE_W() / 2, AGENT_Y()]}
        to={() =>   [VERIF_X() - NODE_W() / 2, VERIF_Y()]}
        stroke={PALETTE.cyan}
        end={0}
        opacity={0}
      />
      {/* Label "output" centré sur la flèche */}
      <Txt
        key="label-output"
        ref={labelOutput}
        text="output"
        fill={PALETTE.cyan}
        fontSize={() => vW() * 0.018}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        x={() => (AGENT_X() + VERIF_X()) / 2}
        y={() => AGENT_Y() - vH() * 0.065}
        opacity={0}
      />

      {/* Nœud DONE (hors zone, succès) */}
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
          ref={doneTxt}
          text="DONE"
          fill={PALETTE.dsGreen}
          fontSize={() => vW() * 0.022}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          fontWeight={700}
        />
      </Rect>

      {/* Flèche Verifier → DONE (YES) */}
      <ConnectionArrow
        key="arrow-verif-done"
        ref={arrowVerifDone}
        from={() => [VERIF_X() + NODE_W() / 2, VERIF_Y() - NODE_H() * 0.18]}
        to={() =>   [DONE_X() - DONE_W() / 2,  DONE_Y()]}
        stroke={PALETTE.dsGreen}
        end={0}
        opacity={0}
      />
      <Txt
        key="label-yes"
        ref={labelYes}
        text="YES"
        fill={PALETTE.dsGreen}
        fontSize={() => vW() * 0.018}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
        x={() => VERIF_X() + NODE_W() * 0.92}
        y={() => VERIF_Y() - NODE_H() * 0.48}
        opacity={0}
      />

      {/* Flèche Verifier → Agent (NO — retour via le bas) */}
      <ConnectionArrow
        key="arrow-verif-agent"
        ref={arrowVerifAgent}
        from={() => [VERIF_X() - NODE_W() * 0.08, VERIF_Y() + NODE_H() / 2]}
        to={() =>   [AGENT_X() + NODE_W() * 0.08,  AGENT_Y() + NODE_H() / 2]}
        stroke={PALETTE.amber}
        dashed
        end={0}
        opacity={0}
      />
      <Txt
        key="label-no"
        ref={labelNo}
        text="NO"
        fill={PALETTE.amber}
        fontSize={() => vW() * 0.018}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
        x={() => (AGENT_X() + VERIF_X()) / 2}
        y={() => AGENT_Y() + NODE_H() * 0.72}
        opacity={0}
      />

      {/* Callout Critères objectifs */}
      <Callout
        key="criteria-callout"
        ref={criteriaCallout}
        title="Critères objectifs"
        body={"tests passent · diff < 300 lignes\ncoverage stable"}
        color={PALETTE.cyan}
        width={() => vW() * 0.28}
        height={() => vH() * 0.17}
        x={() => vW() * -0.025}
        y={() => vH() * 0.32}
        opacity={0}
      />
    </>,
  );

  // ── Séquence d'animation ────────────────────────────────────────────────────

  // intro — Zone LOOP apparaît
  yield* waitUntil('intro');
  yield* loopZone().opacity(1, 0.5, easeInOutCubic);

  // agent — nœud Agent apparaît + passe active
  yield* waitUntil('agent');
  yield* agentNode().opacity(1, 0.3);
  yield* agentNode().setState('active', 0.15);

  // verifier — Verifier apparaît + flèche Agent→Verifier + Verifier devient active
  yield* waitUntil('verifier');
  yield* verifierNode().opacity(1, 0.3);
  arrowAgentVerif().opacity(1);
  yield* all(
    arrowAgentVerif().end(1, 0.5, easeInOutCubic),
    labelOutput().opacity(1, 0.3),
  );
  yield* verifierNode().setState('active', 0.15);

  // criteria — Callout critères objectifs
  yield* waitUntil('criteria');
  yield* criteriaCallout().opacity(1, 0.3);
  yield* criteriaCallout().hold();

  // yes — Verifier success + flèche vers DONE + nœud DONE
  yield* waitUntil('yes');
  yield* verifierNode().setState('success', 0.15);
  arrowVerifDone().opacity(1);
  yield* all(
    arrowVerifDone().end(1, 0.5, easeInOutCubic),
    labelYes().opacity(1, 0.3),
  );
  yield* all(
    doneRect().opacity(1, 0.35),
  );

  // no-path — Verifier error + flèche retour NO + Agent redevient active
  yield* waitUntil('no-path');
  yield* verifierNode().setState('error', 0.08);
  arrowVerifAgent().opacity(1);
  yield* all(
    arrowVerifAgent().end(1, 0.6, easeInOutCubic),
    labelNo().opacity(1, 0.3),
  );
  yield* agentNode().setState('active', 0.15);

  // end — tout fade out
  yield* waitUntil('end');
  yield* all(
    loopZone().opacity(0, 0.5),
    agentNode().opacity(0, 0.5),
    verifierNode().opacity(0, 0.5),
    arrowAgentVerif().opacity(0, 0.5),
    labelOutput().opacity(0, 0.5),
    arrowVerifDone().opacity(0, 0.5),
    labelYes().opacity(0, 0.5),
    doneRect().opacity(0, 0.5),
    arrowVerifAgent().opacity(0, 0.5),
    labelNo().opacity(0, 0.5),
    criteriaCallout().opacity(0, 0.5),
  );
  yield* waitFor(0.3);
});
