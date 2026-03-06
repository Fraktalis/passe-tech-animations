import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {all, createRef, waitFor, waitUntil} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const N = 10;
  const MIN_IDX = 3;

  const COLORS = {
    bg:     '#0D1117',
    rose:   '#FF3E6C',
    vert:   '#6DFF8A',
    jaune:  '#FFE14D',
    cream:  '#F9F9F6',
    ghost:  '#484F58',
    dim:    '#1C2128',
    active: '#3FB950',
    self:   '#58A6FF',
  };

  // ─── Position helpers ───
  // Linear blocks: blockW=0.055vW, blockGap=0.007vW → totalW=0.613vW
  // blockX(i) = vW * (-0.279 + i * 0.062)
  const blockX = (i: number) => () => vW() * (-0.279 + i * 0.062);
  const blockY = () => vH() * -0.05;

  // Grid cells: cellW=0.038vW, cellH=0.05vH, gapX=0.006vW, gapY=0.007vH
  // cellX(c) = vW * (-0.198 + c * 0.044)
  // cellY(r) = vH * (-0.2565 + r * 0.057)
  const cellX = (c: number) => () => vW() * (-0.198 + c * 0.044);
  const cellY = (r: number) => () => vH() * (-0.2565 + r * 0.057);

  // ─── Refs ───
  const gridBg      = createRef<Grid>();
  const titleRef    = createRef<Txt>();
  const subtitleRef = createRef<Txt>();

  // Linear blocks
  const linearBlocks = Array.from({length: N}, () => createRef<Rect>());
  const minLabel     = createRef<Txt>();
  const counterTxt   = createRef<Txt>();
  const onLabel      = createRef<Txt>();
  const onDesc       = createRef<Txt>();

  // Grid cells [r*N + c]
  const cells    = Array.from({length: N * N}, () => createRef<Rect>());
  const rowHint  = createRef<Txt>();
  const on2Label = createRef<Txt>();
  const on2Desc  = createRef<Txt>();

  // ═══════════════════════════════════════════
  // SCENE TREE — all elements absolutely positioned
  // ═══════════════════════════════════════════
  view.add(
    <Layout>
      <Rect width={'100%'} height={'100%'} fill={COLORS.bg} zIndex={-2} />
      <Grid ref={gridBg} width={'100%'} height={'100%'} stroke={COLORS.ghost} opacity={0} lineWidth={1} spacing={() => vW() * 0.055} zIndex={-1} />

      {/* Title / subtitle */}
      <Txt ref={titleRef}    text="COMPLEXITÉ ALGORITHMIQUE" fill={COLORS.cream} fontSize={() => vW() * 0.036} fontWeight={800} fontFamily={'Space Grotesk'} y={() => vH() * -0.42} opacity={0} />
      <Txt ref={subtitleRef} text="combien d'opérations pour N données ?"  fill={COLORS.ghost} fontSize={() => vW() * 0.018} fontFamily={'Space Grotesk'} y={() => vH() * -0.35} opacity={0} />

      {/* ══ LINEAR BLOCKS — explicit x/y each ══ */}
      <Rect ref={linearBlocks[0]} x={blockX(0)} y={blockY} width={() => vW() * 0.055} height={() => vH() * 0.13} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={2} radius={() => vW() * 0.004} opacity={0} />
      <Rect ref={linearBlocks[1]} x={blockX(1)} y={blockY} width={() => vW() * 0.055} height={() => vH() * 0.13} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={2} radius={() => vW() * 0.004} opacity={0} />
      <Rect ref={linearBlocks[2]} x={blockX(2)} y={blockY} width={() => vW() * 0.055} height={() => vH() * 0.13} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={2} radius={() => vW() * 0.004} opacity={0} />
      <Rect ref={linearBlocks[3]} x={blockX(3)} y={blockY} width={() => vW() * 0.055} height={() => vH() * 0.13} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={2} radius={() => vW() * 0.004} opacity={0} />
      <Rect ref={linearBlocks[4]} x={blockX(4)} y={blockY} width={() => vW() * 0.055} height={() => vH() * 0.13} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={2} radius={() => vW() * 0.004} opacity={0} />
      <Rect ref={linearBlocks[5]} x={blockX(5)} y={blockY} width={() => vW() * 0.055} height={() => vH() * 0.13} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={2} radius={() => vW() * 0.004} opacity={0} />
      <Rect ref={linearBlocks[6]} x={blockX(6)} y={blockY} width={() => vW() * 0.055} height={() => vH() * 0.13} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={2} radius={() => vW() * 0.004} opacity={0} />
      <Rect ref={linearBlocks[7]} x={blockX(7)} y={blockY} width={() => vW() * 0.055} height={() => vH() * 0.13} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={2} radius={() => vW() * 0.004} opacity={0} />
      <Rect ref={linearBlocks[8]} x={blockX(8)} y={blockY} width={() => vW() * 0.055} height={() => vH() * 0.13} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={2} radius={() => vW() * 0.004} opacity={0} />
      <Rect ref={linearBlocks[9]} x={blockX(9)} y={blockY} width={() => vW() * 0.055} height={() => vH() * 0.13} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={2} radius={() => vW() * 0.004} opacity={0} />

      <Txt ref={minLabel}   text="min"               fill={COLORS.jaune} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} y={() => vH() * -0.135} opacity={0} />
      <Txt ref={counterTxt} text=""                  fill={COLORS.ghost} fontSize={() => vW() * 0.018} fontFamily={'DM Mono, monospace'} y={() => vH() * 0.15} opacity={0} />
      <Txt ref={onLabel}    text="O(n)"              fill={COLORS.vert}  fontSize={() => vW() * 0.065} fontWeight={800} fontFamily={'Space Grotesk'} y={() => vH() * 0.27} opacity={0} />
      <Txt ref={onDesc}     text="linéaire — N opérations" fill={COLORS.ghost} fontSize={() => vW() * 0.018} fontFamily={'Space Grotesk'} y={() => vH() * 0.35} opacity={0} />

      {/* ══ GRID CELLS — row 0 ══ */}
      <Rect ref={cells[0]}  x={cellX(0)} y={cellY(0)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[1]}  x={cellX(1)} y={cellY(0)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[2]}  x={cellX(2)} y={cellY(0)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[3]}  x={cellX(3)} y={cellY(0)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[4]}  x={cellX(4)} y={cellY(0)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[5]}  x={cellX(5)} y={cellY(0)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[6]}  x={cellX(6)} y={cellY(0)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[7]}  x={cellX(7)} y={cellY(0)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[8]}  x={cellX(8)} y={cellY(0)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[9]}  x={cellX(9)} y={cellY(0)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      {/* row 1 */}
      <Rect ref={cells[10]} x={cellX(0)} y={cellY(1)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[11]} x={cellX(1)} y={cellY(1)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[12]} x={cellX(2)} y={cellY(1)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[13]} x={cellX(3)} y={cellY(1)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[14]} x={cellX(4)} y={cellY(1)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[15]} x={cellX(5)} y={cellY(1)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[16]} x={cellX(6)} y={cellY(1)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[17]} x={cellX(7)} y={cellY(1)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[18]} x={cellX(8)} y={cellY(1)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[19]} x={cellX(9)} y={cellY(1)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      {/* row 2 */}
      <Rect ref={cells[20]} x={cellX(0)} y={cellY(2)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[21]} x={cellX(1)} y={cellY(2)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[22]} x={cellX(2)} y={cellY(2)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[23]} x={cellX(3)} y={cellY(2)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[24]} x={cellX(4)} y={cellY(2)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[25]} x={cellX(5)} y={cellY(2)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[26]} x={cellX(6)} y={cellY(2)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[27]} x={cellX(7)} y={cellY(2)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[28]} x={cellX(8)} y={cellY(2)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[29]} x={cellX(9)} y={cellY(2)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      {/* row 3 */}
      <Rect ref={cells[30]} x={cellX(0)} y={cellY(3)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[31]} x={cellX(1)} y={cellY(3)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[32]} x={cellX(2)} y={cellY(3)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[33]} x={cellX(3)} y={cellY(3)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[34]} x={cellX(4)} y={cellY(3)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[35]} x={cellX(5)} y={cellY(3)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[36]} x={cellX(6)} y={cellY(3)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[37]} x={cellX(7)} y={cellY(3)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[38]} x={cellX(8)} y={cellY(3)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[39]} x={cellX(9)} y={cellY(3)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      {/* row 4 */}
      <Rect ref={cells[40]} x={cellX(0)} y={cellY(4)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[41]} x={cellX(1)} y={cellY(4)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[42]} x={cellX(2)} y={cellY(4)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[43]} x={cellX(3)} y={cellY(4)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[44]} x={cellX(4)} y={cellY(4)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[45]} x={cellX(5)} y={cellY(4)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[46]} x={cellX(6)} y={cellY(4)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[47]} x={cellX(7)} y={cellY(4)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[48]} x={cellX(8)} y={cellY(4)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[49]} x={cellX(9)} y={cellY(4)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      {/* row 5 */}
      <Rect ref={cells[50]} x={cellX(0)} y={cellY(5)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[51]} x={cellX(1)} y={cellY(5)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[52]} x={cellX(2)} y={cellY(5)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[53]} x={cellX(3)} y={cellY(5)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[54]} x={cellX(4)} y={cellY(5)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[55]} x={cellX(5)} y={cellY(5)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[56]} x={cellX(6)} y={cellY(5)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[57]} x={cellX(7)} y={cellY(5)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[58]} x={cellX(8)} y={cellY(5)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[59]} x={cellX(9)} y={cellY(5)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      {/* row 6 */}
      <Rect ref={cells[60]} x={cellX(0)} y={cellY(6)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[61]} x={cellX(1)} y={cellY(6)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[62]} x={cellX(2)} y={cellY(6)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[63]} x={cellX(3)} y={cellY(6)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[64]} x={cellX(4)} y={cellY(6)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[65]} x={cellX(5)} y={cellY(6)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[66]} x={cellX(6)} y={cellY(6)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[67]} x={cellX(7)} y={cellY(6)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[68]} x={cellX(8)} y={cellY(6)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[69]} x={cellX(9)} y={cellY(6)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      {/* row 7 */}
      <Rect ref={cells[70]} x={cellX(0)} y={cellY(7)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[71]} x={cellX(1)} y={cellY(7)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[72]} x={cellX(2)} y={cellY(7)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[73]} x={cellX(3)} y={cellY(7)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[74]} x={cellX(4)} y={cellY(7)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[75]} x={cellX(5)} y={cellY(7)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[76]} x={cellX(6)} y={cellY(7)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[77]} x={cellX(7)} y={cellY(7)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[78]} x={cellX(8)} y={cellY(7)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[79]} x={cellX(9)} y={cellY(7)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      {/* row 8 */}
      <Rect ref={cells[80]} x={cellX(0)} y={cellY(8)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[81]} x={cellX(1)} y={cellY(8)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[82]} x={cellX(2)} y={cellY(8)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[83]} x={cellX(3)} y={cellY(8)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[84]} x={cellX(4)} y={cellY(8)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[85]} x={cellX(5)} y={cellY(8)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[86]} x={cellX(6)} y={cellY(8)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[87]} x={cellX(7)} y={cellY(8)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[88]} x={cellX(8)} y={cellY(8)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[89]} x={cellX(9)} y={cellY(8)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      {/* row 9 */}
      <Rect ref={cells[90]} x={cellX(0)} y={cellY(9)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[91]} x={cellX(1)} y={cellY(9)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[92]} x={cellX(2)} y={cellY(9)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[93]} x={cellX(3)} y={cellY(9)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[94]} x={cellX(4)} y={cellY(9)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[95]} x={cellX(5)} y={cellY(9)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[96]} x={cellX(6)} y={cellY(9)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[97]} x={cellX(7)} y={cellY(9)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[98]} x={cellX(8)} y={cellY(9)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />
      <Rect ref={cells[99]} x={cellX(9)} y={cellY(9)} width={() => vW() * 0.038} height={() => vH() * 0.05} fill={COLORS.dim} stroke={COLORS.ghost} lineWidth={1} radius={() => vW() * 0.003} opacity={0} />

      <Txt ref={rowHint}  text=""        fill={COLORS.ghost} fontSize={() => vW() * 0.015} fontFamily={'DM Mono, monospace'} y={() => vH() * 0.35} opacity={0} />
      <Txt ref={on2Label} text="O(n²)"   fill={COLORS.rose}  fontSize={() => vW() * 0.065} fontWeight={800} fontFamily={'Space Grotesk'} y={() => vH() * 0.35} opacity={0} />
      <Txt ref={on2Desc}  text="quadratique — N² opérations" fill={COLORS.ghost} fontSize={() => vW() * 0.018} fontFamily={'Space Grotesk'} y={() => vH() * 0.43} opacity={0} />
    </Layout>,
  );

  // ═══════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════

  // ─── Intro ───
  yield* waitUntil('intro');

  yield* gridBg().opacity(0.12, 0.8);
  yield* all(titleRef().opacity(1, 0.6), subtitleRef().opacity(1, 0.5));
  yield* waitFor(0.8);

  // ─── Linear row fade-in ───
  yield* waitUntil('linearAppear');

  yield* all(...linearBlocks.map(b => b().opacity(1, 0.4)));
  yield* waitFor(0.4);

  // ─── Linear sweep ───
  yield* waitUntil('linearSweep');

  counterTxt().text(`0 / ${N}`);
  yield* counterTxt().opacity(1, 0.3);

  for (let i = 0; i < N; i++) {
    const isMin = i === MIN_IDX;
    yield* all(
      linearBlocks[i]().fill(isMin ? COLORS.jaune : COLORS.active, 0.14),
      linearBlocks[i]().stroke(isMin ? COLORS.jaune : COLORS.vert, 0.14),
    );
    counterTxt().text(`${i + 1} / ${N}`);
    if (isMin) {
      linearBlocks[i]().shadowColor(COLORS.jaune);
      yield* linearBlocks[i]().shadowBlur(vW() * 0.012, 0.18);
    }
    yield* waitFor(0.1);
  }

  // Dim non-minimum blocks
  yield* all(
    ...linearBlocks
      .filter((_, i) => i !== MIN_IDX)
      .map(b => all(b().fill(COLORS.dim, 0.4), b().stroke(COLORS.ghost, 0.4), b().opacity(0.4, 0.4))),
  );

  // "min" label above MIN_IDX — x = vW * (-0.279 + MIN_IDX * 0.062)
  minLabel().x(vW() * (-0.279 + MIN_IDX * 0.062));
  yield* minLabel().opacity(1, 0.4);
  yield* waitFor(0.3);

  // ─── O(n) label ───
  yield* waitUntil('onLabel');

  yield* all(
    onLabel().opacity(1, 0.5),
    onDesc().opacity(1, 0.4),
    counterTxt().opacity(0, 0.3),
  );
  yield* waitFor(1.5);

  // ─── Transition → grid ───
  yield* waitUntil('gridTransition');

  yield* all(
    titleRef().opacity(0, 0.3),
    subtitleRef().opacity(0, 0.3),
    onLabel().opacity(0, 0.3),
    onDesc().opacity(0, 0.3),
    minLabel().opacity(0, 0.3),
    ...linearBlocks.map(b => b().opacity(0, 0.3)),
  );

  titleRef().text('N-BODY : O(n²)');
  subtitleRef().text('chaque particule regarde les N−1 autres');

  yield* all(
    titleRef().opacity(1, 0.4),
    subtitleRef().opacity(1, 0.4),
    ...cells.map(c => c().opacity(1, 0.4)),
  );
  yield* waitFor(0.6);

  // ─── Grid sweep ───
  yield* waitUntil('gridSweep');

  rowHint().opacity(1);

  // Helper : reset all cells to dim
  const resetGrid = () => all(...cells.map(c => all(c().fill(COLORS.dim, 0.08), c().stroke(COLORS.ghost, 0.08))));

  // For each particle r :
  //   1. Reset all cells to dim
  //   2. Light cell[r][r] blue
  //   3. Sweep ALL N² cells sequentially (row by row) in green (skip [r][r])
  //   4. Brief pause, then reset

  // Show 3 complete passes so the pattern is clear, then skip the rest
  for (let r = 0; r < 3; r++) {
    yield* resetGrid();
    rowHint().text(`particule ${r + 1} vérifie les ${N * N - 1} autres`);

    cells[r * N + r]().stroke(COLORS.self);
    cells[r * N + r]().fill(COLORS.self);

    // Sweep entire grid cell by cell, row by row
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (i === r && j === r) continue;
        cells[i * N + j]().stroke(COLORS.vert);
        yield* cells[i * N + j]().fill(COLORS.active, 0.02);
      }
    }
    yield* waitFor(0.3);
  }

  // Remaining particles: flash each one quickly then leave grid fully lit
  yield* resetGrid();
  for (let r = 3; r < N; r++) {
    rowHint().text(`particule ${r + 1} vérifie les ${N * N - 1} autres`);
    cells[r * N + r]().stroke(COLORS.self);
    cells[r * N + r]().fill(COLORS.self);
    yield* all(
      ...cells
        .filter((_, idx) => idx !== r * N + r)
        .map(c => { c().stroke(COLORS.vert); return c().fill(COLORS.active, 0.04); }),
    );
    yield* waitFor(0.08);
  }

  yield* rowHint().opacity(0, 0.3);
  yield* waitFor(0.4);

  // ─── O(n²) label ───
  yield* waitUntil('on2Label');

  yield* all(on2Label().opacity(1, 0.5), on2Desc().opacity(1, 0.4));
  yield* waitFor(2);

  // ─── End ───
  yield* waitUntil('endScene');

  yield* all(
    titleRef().opacity(0, 0.5),
    subtitleRef().opacity(0, 0.5),
    on2Label().opacity(0, 0.5),
    on2Desc().opacity(0, 0.5),
    gridBg().opacity(0, 0.5),
    ...cells.map(c => c().opacity(0, 0.4)),
  );
});
