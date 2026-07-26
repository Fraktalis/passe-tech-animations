/**
 * @scene ralph-wiggum-session
 * @video Loop Engineering — ACTE 1 : Mémoire entre sessions (analogie Memento)
 *
 * Deux sessions LLM flanquent un nœud central fix_plan.md.
 * Session N écrit dans le fichier (Packet amber), disparaît.
 * Session N+1 apparaît, lit le fichier (Packet amber), repart.
 * Illustre le paradoxe Memento : pas de mémoire de session, seul le fichier survit.
 */

import {makeScene2D, Txt} from '@motion-canvas/2d';
import {createRef, waitUntil, all, easeInOutCubic} from '@motion-canvas/core';
import {DiagramNode, ConnectionArrow, Packet, Callout} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  view.fill(PALETTE.bg);

  const vW = () => view.width();
  const vH = () => view.height();

  // ── Refs ──────────────────────────────────────────────────────────────────
  const sessionNRef        = createRef<DiagramNode>();
  const fixPlanRef         = createRef<DiagramNode>();
  const sessionNextRef     = createRef<DiagramNode>();
  const arrowWriteRef      = createRef<ConnectionArrow>();
  const arrowReadRef       = createRef<ConnectionArrow>();
  const packetWriteRef     = createRef<Packet>();
  const packetReadRef      = createRef<Packet>();
  const newSessionLabelRef = createRef<Txt>();
  const calloutMementoRef  = createRef<Callout>();

  // ── Scene tree ────────────────────────────────────────────────────────────
  view.add(
    <>
      {/* Session N — LLM sans mémoire */}
      <DiagramNode
        ref={sessionNRef}
        key="node-session-n"
        iconName="mdi:console"
        color={PALETTE.vert}
        label="Session N"
        sublabel="LLM · sans mémoire"
        initialState="active"
        width={() => vW() * 0.20}
        height={() => vH() * 0.25}
        x={() => vW() * -0.35}
        y={0}
        opacity={0}
      />

      {/* fix_plan.md — mémoire externe persistante */}
      <DiagramNode
        ref={fixPlanRef}
        key="node-fix-plan"
        iconName="mdi:file-document-outline"
        label="fix_plan.md"
        sublabel="mémoire externe"
        color={PALETTE.amber}
        initialState="idle"
        width={() => vW() * 0.20}
        height={() => vH() * 0.25}
        x={0}
        y={0}
        opacity={0}
      />

      {/* Session N+1 — révélée après la fin de Session N */}
      <DiagramNode
        ref={sessionNextRef}
        key="node-session-next"
        iconName="mdi:console"
        color={PALETTE.vert}
        label="Session N+1"
        sublabel="LLM · sans mémoire"
        initialState="idle"
        width={() => vW() * 0.20}
        height={() => vH() * 0.25}
        x={() => vW() * 0.35}
        y={0}
        opacity={0}
      />

      {/* Flèche écriture : Session N → fix_plan.md */}
      <ConnectionArrow
        ref={arrowWriteRef}
        key="arrow-write"
        from={() => [vW() * -0.25, 0]}
        to={() => [vW() * -0.105, 0]}
        stroke={PALETTE.amber}
        end={0}
        opacity={0}
      />

      {/* Flèche lecture : fix_plan.md → Session N+1 */}
      <ConnectionArrow
        ref={arrowReadRef}
        key="arrow-read"
        from={() => [vW() * 0.105, 0]}
        to={() => [vW() * 0.25, 0]}
        stroke={PALETTE.amber}
        end={0}
        opacity={0}
      />

      {/* Packet écriture — naît sur Session N, vole vers fix_plan.md */}
      <Packet
        ref={packetWriteRef}
        key="packet-write"
        content="état du travail"
        color={PALETTE.amber}
        packetSize="sm"
        width={() => vW() * 0.14}
        height={() => vH() * 0.065}
        x={() => vW() * -0.35}
        y={0}
        opacity={0}
      />

      {/* Packet lecture — naît sur fix_plan.md, vole vers Session N+1 */}
      <Packet
        ref={packetReadRef}
        key="packet-read"
        content="état"
        color={PALETTE.amber}
        packetSize="sm"
        width={() => vW() * 0.09}
        height={() => vH() * 0.065}
        x={0}
        y={0}
        opacity={0}
      />

      {/* Label transitoire affiché quand Session N disparaît */}
      <Txt
        ref={newSessionLabelRef}
        key="label-new-session"
        text="nouvelle session →"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.018}
        fontFamily={'Inter, DM Sans, sans-serif'}
        x={() => vW() * -0.35}
        y={() => vH() * 0.21}
        opacity={0}
      />

      {/* Callout Memento — affiché après la lecture de Session N+1 */}
      <Callout
        ref={calloutMementoRef}
        key="callout-memento"
        title="Memento"
        body={"pas de mémoire de session\nseul le fichier survit"}
        color={PALETTE.amber}
        width={() => vW() * 0.28}
        height={() => vH() * 0.14}
        x={0}
        y={() => vH() * 0.38}
        opacity={0}
      />
    </>
  );

  // ── ACTE 1 : intro — Session N + fix_plan.md apparaissent ─────────────────
  yield* waitUntil('intro');
  yield* all(
    sessionNRef().opacity(1, 0.4),
    fixPlanRef().opacity(1, 0.4),
  );

  // ── write — packet "état du travail" voyage Session N → fix_plan.md ────────
  yield* waitUntil('write');
  arrowWriteRef().opacity(1);
  yield* arrowWriteRef().end(1, 0.4, easeInOutCubic);
  yield* packetWriteRef().opacity(1, 0.2);
  yield* packetWriteRef().flyTo([0, 0], 0.8);
  yield* packetWriteRef().opacity(0, 0.15);
  yield* all(
    sessionNRef().setState('idle', 0.15),
    fixPlanRef().setState('active', 0.15),
  );

  // ── session-ends — Session N s'efface, label "nouvelle session →" ──────────
  yield* waitUntil('session-ends');
  yield* all(
    sessionNRef().opacity(0, 0.5),
    newSessionLabelRef().opacity(1, 0.3),
  );

  // ── new-session — Session N+1 entre en scène ───────────────────────────────
  yield* waitUntil('new-session');
  yield* all(
    newSessionLabelRef().opacity(0, 0.2),
    sessionNextRef().opacity(1, 0.4),
  );

  // ── read — packet "état" voyage fix_plan.md → Session N+1 ─────────────────
  yield* waitUntil('read');
  arrowReadRef().opacity(1);
  yield* arrowReadRef().end(1, 0.4, easeInOutCubic);
  yield* packetReadRef().opacity(1, 0.2);
  yield* packetReadRef().flyTo([vW() * 0.35, 0], 0.8);
  yield* packetReadRef().opacity(0, 0.15);
  yield* all(
    sessionNextRef().setState('active', 0.15),
    fixPlanRef().setState('idle', 0.15),
  );
  yield* calloutMementoRef().opacity(1, 0.3);
  yield* calloutMementoRef().hold();  // dwell ∝ longueur du texte (titre + body)

  // ── end — tout fade out ────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    sessionNextRef().opacity(0, 0.5),
    fixPlanRef().opacity(0, 0.5),
    arrowWriteRef().opacity(0, 0.4),
    arrowReadRef().opacity(0, 0.4),
    calloutMementoRef().opacity(0, 0.4),
  );
});
