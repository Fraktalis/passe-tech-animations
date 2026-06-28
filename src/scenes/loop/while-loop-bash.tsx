import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt, Line} from '@motion-canvas/2d/lib/components';
import {all, createRef, waitUntil, easeInOutCubic} from '@motion-canvas/core';
import {PALETTE} from '../../theme';
import {Terminal, ConnectionArrow, DiagramNode} from '../../components';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  // ── Refs ─────────────────────────────────────────────────────────────────
  const gridRef       = createRef<Grid>();
  const terminalRef   = createRef<Terminal>();
  const nodePromptRef = createRef<DiagramNode>();
  const nodeClaudeRef = createRef<DiagramNode>();
  const nodeApiRef    = createRef<DiagramNode>();
  const arrowP2CRef   = createRef<ConnectionArrow>();
  const arrowC2ARef   = createRef<ConnectionArrow>();
  const loopLineRef   = createRef<Line>();
  const loopLabelRef  = createRef<Txt>();
  const cardCtrlRef   = createRef<DiagramNode>();
  const cardBudgetRef = createRef<DiagramNode>();
  const cardPkillRef  = createRef<DiagramNode>();

  // ── Geometry helpers ─────────────────────────────────────────────────────
  const nodeW  = () => vW() * 0.17;
  const nodeH  = () => vH() * 0.24;
  const nodeY  = () => vH() * 0.05;
  const xPr    = () => vW() * -0.33;
  const xCl    = () => 0;
  const xApi   = () => vW() * 0.33;
  const loopBY  = () => nodeY() + nodeH() * 0.5 + vH() * 0.12;
  // Marge horizontale pour que les segments verticaux dégagent les boîtes
  const loopPad = () => vW() * 0.045;

  // Midpoints of each arrow — où les cartes d'interruption viennent "couper"
  const xCutP2C = () => (xPr() + nodeW() * 0.5 + xCl() - nodeW() * 0.5) / 2;  // -0.165·vW
  const xCutC2A = () => (xCl() + nodeW() * 0.5 + xApi() - nodeW() * 0.5) / 2; //  0.165·vW

  // ── Scene tree ────────────────────────────────────────────────────────────
  view.add(
    <Layout key="root-layout">
      <Rect
        key="scene-bg"
        width={'100%'}
        height={'100%'}
        fill={PALETTE.bg}
        zIndex={-2}
      />
      <Grid
        key="scene-grid"
        ref={gridRef}
        width={'100%'}
        height={'100%'}
        stroke={PALETTE.ghost}
        lineWidth={1}
        spacing={80}
        opacity={0}
        zIndex={-1}
      />

      {/* ── Phase 1 : terminal ── */}
      <Terminal
        key="terminal"
        ref={terminalRef}
        title="bash"
        fontSize={() => vW() * 0.018}
        width={() => vW() * 0.6}
        height={() => vH() * 0.25}
        y={() => vH() * -0.295}
        maxLines={5}
        opacity={0}
      />

      {/* ── Phase 2 : nœuds workflow ── */}
      <DiagramNode
        key="node-prompt"
        ref={nodePromptRef}
        iconName="mdi:file-document-outline"
        label="PROMPT.md"
        sublabel="fichier"
        color={PALETTE.vert}
        width={() => nodeW()}
        height={() => nodeH()}
        x={() => xPr()}
        y={() => nodeY()}
        opacity={0}
      />
      <DiagramNode
        key="node-claude"
        ref={nodeClaudeRef}
        iconName="mdi:console"
        label="claude"
        sublabel="CLI"
        color={PALETTE.blue}
        width={() => nodeW()}
        height={() => nodeH()}
        x={() => xCl()}
        y={() => nodeY()}
        opacity={0}
      />
      <DiagramNode
        key="node-api"
        ref={nodeApiRef}
        iconName="mdi:cloud-outline"
        label="Anthropic"
        sublabel="API"
        color={PALETTE.rose}
        width={() => nodeW()}
        height={() => nodeH()}
        x={() => xApi()}
        y={() => nodeY()}
        opacity={0}
      />

      {/* Flèche PROMPT → claude */}
      <ConnectionArrow
        key="arrow-p2c"
        ref={arrowP2CRef}
        from={() => [xPr()  + nodeW() * 0.5, nodeY()]}
        to={() =>   [xCl()  - nodeW() * 0.5, nodeY()]}
        stroke={PALETTE.vert}
        lineWidth={2}
        end={0}
        opacity={0}
      />

      {/* Flèche claude → API */}
      <ConnectionArrow
        key="arrow-c2a"
        ref={arrowC2ARef}
        from={() => [xCl()  + nodeW() * 0.5, nodeY()]}
        to={() =>   [xApi() - nodeW() * 0.5, nodeY()]}
        stroke={PALETTE.blue}
        lineWidth={2}
        end={0}
        opacity={0}
      />

      {/* Boucle retour API → PROMPT (U sous les nœuds) */}
      <Line
        key="loop-line"
        ref={loopLineRef}
        points={() => [
          [xApi() + nodeW() * 0.5,              nodeY()  ],
          [xApi() + nodeW() * 0.5 + loopPad(),  nodeY()  ],
          [xApi() + nodeW() * 0.5 + loopPad(),  loopBY() ],
          [xPr()  - nodeW() * 0.5 - loopPad(),  loopBY() ],
          [xPr()  - nodeW() * 0.5 - loopPad(),  nodeY()  ],
          [xPr()  - nodeW() * 0.5,              nodeY()  ],
        ]}
        stroke={PALETTE.jaune}
        lineWidth={2}
        radius={() => vW() * 0.028}
        endArrow
        arrowSize={10}
        end={0}
        opacity={0}
      />
      <Txt
        key="loop-label"
        ref={loopLabelRef}
        text="⟳  boucle infinie"
        fontFamily={'DM Sans, sans-serif'}
        fontSize={() => vW() * 0.014}
        fill={PALETTE.jaune}
        y={() => loopBY() + vH() * 0.045}
        opacity={0}
      />

      {/* ── Phase 3 : cartes d'interruption (positionnées off-screen en init) ── */}
      <DiagramNode
        key="card-ctrlc"
        ref={cardCtrlRef}
        iconName="mdi:stop-circle-outline"
        label="Ctrl+C"
        sublabel="interruption"
        color={PALETTE.secondary}
        width={() => vW() * 0.12}
        height={() => vH() * 0.16}
        opacity={0}
      />
      <DiagramNode
        key="card-budget"
        ref={cardBudgetRef}
        iconName="mdi:currency-usd-off"
        label="budget épuisé"
        sublabel="rate limit"
        color={PALETTE.amber}
        width={() => vW() * 0.12}
        height={() => vH() * 0.16}
        opacity={0}
      />
      <DiagramNode
        key="card-pkill"
        ref={cardPkillRef}
        iconName="mdi:skull-outline"
        label="pkill"
        sublabel="-f claude"
        color={PALETTE.dsRose}
        width={() => vW() * 0.12}
        height={() => vH() * 0.16}
        opacity={0}
      />
    </Layout>
  );

  // Positionner les cartes off-screen juste après leur création
  cardCtrlRef().x(0);
  cardCtrlRef().y(loopBY() + vH() * 0.55);

  cardBudgetRef().x(xCutC2A());
  cardBudgetRef().y(nodeY() + vH() * 0.55);

  cardPkillRef().x(xCutP2C());
  cardPkillRef().y(nodeY() + vH() * 0.55);

  // ═══════════════════════════════════════════════════════════════════════════
  // ANIMATION SEQUENCE
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Phase 1 : terminal ───────────────────────────────────────────────────
  yield* waitUntil('intro');
  yield* gridRef().opacity(0.12, 1.0);
  yield* terminalRef().opacity(1, 0.8);

  yield* waitUntil('while');
  yield* terminalRef().typewrite('while :; do', {prompt: true, charDelay: 0.08});

  yield* waitUntil('cat');
  yield* terminalRef().typewrite('  cat PROMPT.md | claude', {charDelay: 0.08, color: 'vert'});

  yield* waitUntil('done');
  yield* terminalRef().typewrite('done', {charDelay: 0.08});

  // ── Phase 2 : nœuds + flèches ────────────────────────────────────────────
  yield* waitUntil('diagram');
  nodePromptRef().opacity(1);
  nodeClaudeRef().opacity(1);
  yield* nodeApiRef().opacity(1, 0.6);

  yield* waitUntil('arrow-p2c');
  arrowP2CRef().opacity(1);
  yield* arrowP2CRef().end(1, 0.6, easeInOutCubic);

  yield* waitUntil('arrow-c2a');
  arrowC2ARef().opacity(1);
  yield* arrowC2ARef().end(1, 0.6, easeInOutCubic);

  yield* waitUntil('loop');
  loopLineRef().opacity(1);
  yield* loopLineRef().end(1, 1.0, easeInOutCubic);
  yield* loopLabelRef().opacity(1, 0.6);

  // ── Phase 3 : interruptions — chaque carte vole vers sa "coupe" ──────────
  yield* waitUntil('exit');

  // 1. Ctrl+C → coupe la branche retour (bas du U)
  cardCtrlRef().opacity(1);
  yield* cardCtrlRef().y(loopBY(), 0.8, easeInOutCubic);
  yield* loopLineRef().stroke(PALETTE.dsRose, 0.2);
  yield* loopLabelRef().opacity(0, 0.2);

  // 2. Budget épuisé → coupe claude → API
  cardBudgetRef().opacity(1);
  yield* cardBudgetRef().y(nodeY(), 0.8, easeInOutCubic);
  yield* all(
    arrowC2ARef().stroke(PALETTE.dsRose, 0.2),
    nodeApiRef().stroke(PALETTE.dsRose, 0.2),
  );

  // 3. pkill → tue le processus claude (coupe PROMPT → claude)
  cardPkillRef().opacity(1);
  yield* cardPkillRef().y(nodeY(), 0.8, easeInOutCubic);
  yield* all(
    arrowP2CRef().stroke(PALETTE.dsRose, 0.2),
    nodeClaudeRef().stroke(PALETTE.dsRose, 0.2),
  );

  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.8),
    terminalRef().opacity(0, 0.8),
    nodePromptRef().opacity(0, 0.8),
    nodeClaudeRef().opacity(0, 0.8),
    nodeApiRef().opacity(0, 0.8),
    arrowP2CRef().opacity(0, 0.8),
    arrowC2ARef().opacity(0, 0.8),
    loopLineRef().opacity(0, 0.8),
    cardCtrlRef().opacity(0, 0.8),
    cardBudgetRef().opacity(0, 0.8),
    cardPkillRef().opacity(0, 0.8),
  );
});
