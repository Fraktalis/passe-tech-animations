import {makeScene2D} from '@motion-canvas/2d';
import {Code, LezerHighlighter, lines} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {all, createRef, waitFor, waitUntil} from '@motion-canvas/core';
import {parser} from '@lezer/javascript';
import {HighlightStyle} from '@codemirror/language';
import {tags} from '@lezer/highlight';

// ─────────────────────────────────────────────────────────────────────────────
// JIT Compiler animation - uses Motion Canvas Code component (Lezer highlight)
// Left  : JS code panel with real syntax highlighting
// Right : JIT register table (identifier | type | value)
// Deopt : warning banner when score changes number → string
// ─────────────────────────────────────────────────────────────────────────────

// Passe-Tech syntax theme
const PasteTechTheme = HighlightStyle.define([
  {tag: tags.keyword,              color: '#FF7B93', fontWeight: '600'},
  {tag: tags.variableName,         color: '#79C0FF'},
  {tag: tags.propertyName,         color: '#79C0FF'},
  {tag: tags.definition(tags.variableName), color: '#79C0FF'},
  {tag: tags.function(tags.variableName),   color: '#D2A8FF'},
  {tag: tags.function(tags.definition(tags.variableName)), color: '#D2A8FF'},
  {tag: tags.string,               color: '#6DFF8A'},
  {tag: tags.number,               color: '#FFE14D'},
  {tag: tags.operator,             color: '#8B949E'},
  {tag: tags.punctuation,          color: '#6E7681'},
  {tag: tags.comment,              color: '#484F58', fontStyle: 'italic'},
  {tag: tags.typeName,             color: '#D2A8FF'},
  {tag: tags.bool,                 color: '#FFE14D'},
  {tag: tags.null,                 color: '#8B949E'},
]);

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const C = {
    bg:     '#0D1117',
    panel:  '#161B22',
    border: '#30363D',
    dim:    '#1C2128',
    ghost:  '#8B949E',
    cream:  '#E6EDF3',
    rose:   '#FF3E6C',
    vert:   '#6DFF8A',
    jaune:  '#FFE14D',
    blue:   '#79C0FF',
    purple: '#D2A8FF',
    orange: '#F0883E',
  };

  // ── Layout ─────────────────────────────────────────────────────────────────
  const LCX = () => vW() * -0.235;
  const RCX = () => vW() *  0.245;
  const PW  = () => vW() *  0.44;
  const PH  = () => vH() *  0.84;

  // Register columns - textAlign='left' + explicit width → text left-aligned
  const RL   = () => RCX() - PW() * 0.5 + PW() * 0.045;  // content left edge
  const CW1  = () => PW() * 0.28;
  const CW2  = () => PW() * 0.22;
  const CW3  = () => PW() * 0.28;
  const CC1  = () => RL() + CW1() * 0.5;
  const CC2  = () => RL() + CW1() + CW2() * 0.5;
  const CC3  = () => RL() + CW1() + CW2() + CW3() * 0.5;
  const RF   = () => vW() * 0.014;
  const RY   = (i: number) => () => vH() * (-0.19 + i * 0.10);

  type RegRow = {
    bg:   ReturnType<typeof createRef<Rect>>;
    name: ReturnType<typeof createRef<Txt>>;
    type: ReturnType<typeof createRef<Txt>>;
    val:  ReturnType<typeof createRef<Txt>>;
  };
  const regRows: RegRow[] = Array.from({length: 4}, () => ({
    bg:   createRef<Rect>(),
    name: createRef<Txt>(),
    type: createRef<Txt>(),
    val:  createRef<Txt>(),
  }));

  // Misc refs
  const gridBg      = createRef<Grid>();
  const leftPanel   = createRef<Rect>();
  const rightPanel  = createRef<Rect>();
  const lFilename   = createRef<Txt>();
  const codeRef     = createRef<Code>();
  const rightTitle  = createRef<Txt>();
  const colHdrName  = createRef<Txt>();
  const colHdrType  = createRef<Txt>();
  const colHdrVal   = createRef<Txt>();
  const colDivider  = createRef<Rect>();
  const deoptBanner = createRef<Rect>();
  const deoptLabel  = createRef<Txt>();
  const deoptSub    = createRef<Txt>();

  const JS_CODE = `\
let score = 100;
let player = "Alex";

function multiply(a, b) {
  return a * b;
}

let bonus = multiply(score, 2);
score = "niveau max";`;

  // ── Scene graph ────────────────────────────────────────────────────────────
  view.add(
    <Layout>
      <Rect width={'100%'} height={'100%'} fill={C.bg} zIndex={-2} />
      <Grid
        ref={gridBg} width={'100%'} height={'100%'}
        stroke={C.ghost} lineWidth={1} opacity={0}
        spacing={() => vW() * 0.055} zIndex={-1}
      />

      {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
      <Rect
        ref={leftPanel}
        x={LCX} y={0} width={PW} height={PH}
        fill={C.panel} stroke={C.border} lineWidth={2}
        radius={() => vW() * 0.007} opacity={0}
      />
      <Txt
        ref={lFilename}
        x={LCX} y={() => -PH() * 0.46}
        text="main.js"
        fill={C.ghost} fontSize={() => vW() * 0.013}
        fontFamily={'DM Mono, monospace'} opacity={0}
      />

      {/* Code component - positioned top-left inside left panel */}
      <Code
        ref={codeRef}
        highlighter={new LezerHighlighter(parser, PasteTechTheme)}
        code={''}
        fontSize={() => vW() * 0.016}
        fontFamily={'DM Mono, monospace'}
        x={LCX} y={0}
        opacity={0}
        zIndex={3}
      />

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
      <Rect
        ref={rightPanel}
        x={RCX} y={0} width={PW} height={PH}
        fill={C.panel} stroke={C.border} lineWidth={2}
        radius={() => vW() * 0.007} opacity={0}
      />
      <Txt
        ref={rightTitle}
        x={RCX} y={() => -PH() * 0.43}
        text="REGISTRE JIT"
        fill={C.blue} fontSize={() => vW() * 0.016}
        fontWeight={700} fontFamily={'Space Grotesk'} opacity={0}
      />

      {/* Column headers */}
      <Txt ref={colHdrName} x={CC1} y={() => -PH() * 0.34} width={CW1} textAlign={'left'}
        text="identifiant" fill={C.ghost} fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'} opacity={0} />
      <Txt ref={colHdrType} x={CC2} y={() => -PH() * 0.34} width={CW2} textAlign={'left'}
        text="type"        fill={C.ghost} fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'} opacity={0} />
      <Txt ref={colHdrVal}  x={CC3} y={() => -PH() * 0.34} width={CW3} textAlign={'left'}
        text="valeur"      fill={C.ghost} fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'} opacity={0} />
      <Rect
        ref={colDivider}
        x={RCX} y={() => -PH() * 0.295}
        width={() => PW() * 0.90} height={1}
        fill={C.border} opacity={0}
      />

      {/* Register rows */}
      {regRows.map((row, i) => (
        <Layout key={i}>
          <Rect
            ref={row.bg}
            x={RCX} y={RY(i)}
            width={() => PW() * 0.92} height={() => vH() * 0.078}
            fill={C.dim} stroke={C.border} lineWidth={1}
            radius={() => vW() * 0.004} opacity={0}
          />
          <Txt ref={row.name} x={CC1} y={RY(i)} width={CW1} textAlign={'left'}
            text="" fill={C.cream}   fontSize={RF} fontFamily={'DM Mono, monospace'} opacity={0} />
          <Txt ref={row.type} x={CC2} y={RY(i)} width={CW2} textAlign={'left'}
            text="" fill={C.blue}   fontSize={RF} fontFamily={'DM Mono, monospace'} opacity={0} />
          <Txt ref={row.val}  x={CC3} y={RY(i)} width={CW3} textAlign={'left'}
            text="" fill={C.vert}   fontSize={RF} fontFamily={'DM Mono, monospace'} opacity={0} />
        </Layout>
      ))}

      {/* Deopt banner */}
      <Rect
        ref={deoptBanner}
        x={RCX} y={() => vH() * 0.275}
        width={() => PW() * 0.90} height={() => vH() * 0.135}
        fill={'#2D0A14'} stroke={C.rose} lineWidth={3}
        radius={() => vW() * 0.005} opacity={0}
      />
      <Txt
        ref={deoptLabel}
        x={RCX} y={() => vH() * 0.258}
        text="⚠  DÉOPTIMISATION"
        fill={C.rose} fontSize={() => vW() * 0.021}
        fontWeight={800} fontFamily={'Space Grotesk'} opacity={0}
      />
      <Txt
        ref={deoptSub}
        x={RCX} y={() => vH() * 0.295}
        text="score : number → string"
        fill={C.jaune} fontSize={() => vW() * 0.013}
        fontFamily={'DM Mono, monospace'} opacity={0}
      />
    </Layout>,
  );

  // ── Register helpers ───────────────────────────────────────────────────────
  function* addRegRow(idx: number, name: string, type: string, val: string, typeColor: string) {
    regRows[idx].name().text(name);
    regRows[idx].type().text(type);
    regRows[idx].val().text(val);
    regRows[idx].type().fill(typeColor);
    yield* all(
      regRows[idx].bg().opacity(1, 0.3),
      regRows[idx].name().opacity(1, 0.3),
      regRows[idx].type().opacity(1, 0.3),
      regRows[idx].val().opacity(1, 0.3),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANIMATION SEQUENCE
  // ═══════════════════════════════════════════════════════════════════════════

  yield* waitUntil('intro');

  yield* all(
    gridBg().opacity(0.08, 0.8),
    leftPanel().opacity(1, 0.5),
    rightPanel().opacity(1, 0.5),
  );
  yield* all(
    lFilename().opacity(1, 0.4),
    rightTitle().opacity(1, 0.4),
    colHdrName().opacity(1, 0.4),
    colHdrType().opacity(1, 0.4),
    colHdrVal().opacity(1, 0.4),
    colDivider().opacity(1, 0.4),
  );

  // Show full code block dimmed via selection (no selection = full dim)
  yield* codeRef().code(JS_CODE, 0.5);
  yield* codeRef().opacity(1, 0.4);
  // Dim everything - selection with empty range dims non-selected lines
  yield* codeRef().selection(lines(0, 100), 0.3);

  yield* waitFor(0.5);

  // ── Line 1 : let score = 100; ─────────────────────────────────────────────
  yield* waitUntil('line1');

  yield* codeRef().selection(lines(0), 0.25);
  yield* waitFor(0.25);
  yield* addRegRow(0, 'score', 'number', '100', C.blue);
  yield* waitFor(0.5);

  // ── Line 2 : let player = "Alex"; ────────────────────────────────────────
  yield* waitUntil('line2');

  yield* codeRef().selection(lines(1), 0.25);
  yield* waitFor(0.25);
  yield* addRegRow(1, 'player', 'string', '"Alex"', C.orange);
  yield* waitFor(0.5);

  // ── Lines 3-5 : function multiply ────────────────────────────────────────
  yield* waitUntil('line3');

  yield* codeRef().selection(lines(3, 5), 0.25);
  yield* waitFor(0.25);
  yield* addRegRow(2, 'multiply', 'function', '(a, b) => a * b', C.purple);
  yield* waitFor(0.5);

  // ── Line 8 : let bonus = multiply(score, 2); ─────────────────────────────
  yield* waitUntil('line6');

  yield* codeRef().selection(lines(7), 0.25);
  yield* waitFor(0.25);
  yield* addRegRow(3, 'bonus', 'number', '200', C.blue);
  yield* waitFor(0.5);

  // ── Line 9 : score = "niveau max";  → DÉOPTIMISATION ─────────────────────
  yield* waitUntil('deopt');

  yield* codeRef().selection(lines(8), 0.25);
  yield* waitFor(0.35);

  // Flash the score row red
  yield* all(
    regRows[0].bg().fill('#2D0A14', 0.2),
    regRows[0].bg().stroke(C.rose, 0.2),
    regRows[0].bg().lineWidth(2, 0.2),
  );

  // Deopt banner
  yield* all(
    deoptBanner().opacity(1, 0.3),
    deoptLabel().opacity(1, 0.3),
    deoptSub().opacity(1, 0.3),
  );

  yield* waitFor(0.4);

  // Update score row: type number → string
  yield* all(
    regRows[0].type().opacity(0, 0.18),
    regRows[0].val().opacity(0, 0.18),
  );
  regRows[0].type().text('string');
  regRows[0].type().fill(C.orange);
  regRows[0].val().text('"niveau max"');
  yield* all(
    regRows[0].type().opacity(1, 0.25),
    regRows[0].val().opacity(1, 0.25),
  );

  // Banner pulse
  yield* deoptBanner().stroke(C.jaune, 0.2);
  yield* deoptBanner().stroke(C.rose, 0.2);

  yield* waitFor(1.0);

  // ── End ───────────────────────────────────────────────────────────────────
  yield* waitUntil('endScene');

  yield* all(
    leftPanel().opacity(0, 0.5),
    rightPanel().opacity(0, 0.5),
    lFilename().opacity(0, 0.3),
    codeRef().opacity(0, 0.4),
    rightTitle().opacity(0, 0.3),
    colHdrName().opacity(0, 0.3),
    colHdrType().opacity(0, 0.3),
    colHdrVal().opacity(0, 0.3),
    colDivider().opacity(0, 0.3),
    deoptBanner().opacity(0, 0.4),
    deoptLabel().opacity(0, 0.4),
    deoptSub().opacity(0, 0.4),
    gridBg().opacity(0, 0.5),
    ...regRows.map(row => all(
      row.bg().opacity(0, 0.3),
      row.name().opacity(0, 0.3),
      row.type().opacity(0, 0.3),
      row.val().opacity(0, 0.3),
    )),
  );
});
