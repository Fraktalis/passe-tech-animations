/**
 * outro-demenagement — OUTRO : « un déménagement à organiser ».
 *
 * Une liste de projets Vikunja. « mariage » se coche et s'archive (vert) ;
 * un nouveau projet « déménagement » est créé, vide, avec un curseur qui
 * clignote. Trois cartons deviennent les premières tâches. Fin sur la pastèque.
 *
 * Couleur active : cyan (le nouveau projet). Vert uniquement pour le projet clos.
 *
 * Battements : nouveau-projet · premieres-taches
 */
import {makeScene2D, Grid, Icon, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  cancel,
  createRef,
  createRefArray,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  loop,
  sequence,
  waitFor,
  waitUntil,
} from '@motion-canvas/core';
import {PALETTE} from '../../theme';

const FONT_MONO = 'JetBrains Mono, DM Mono, monospace';
const PROJECT_LABELS = ['boulot', 'perso', 'mariage', 'déménagement'];
const MARIAGE_INDEX = 2;
const NEW_PROJECT_INDEX = 3;
const TASK_COUNT = 3;

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Géométrie ──────────────────────────────────────────────────────────────
  const projectPanelX = () => vW() * -0.17;
  const taskPanelX = () => vW() * 0.2;
  const panelHeight = () => vH() * 0.62;
  /** Y local (dans un panneau) de la k-ième ligne. */
  const projectRowY = (rowIndex: number) => vH() * (-0.13 + rowIndex * 0.09);
  const taskRowY = (rowIndex: number) => vH() * (-0.13 + rowIndex * 0.09);
  const projectRowWidth = () => vW() * 0.24;
  const taskRowWidth = () => vW() * 0.3;
  const rowHeight = () => vH() * 0.07;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const projectPanel = createRef<Rect>();
  const projectRows = createRefArray<Rect>();
  const projectLabels = createRefArray<Txt>();
  const mariageCheckIcon = createRef<Icon>();
  const mariageArchiveIcon = createRef<Icon>();
  const taskPanel = createRef<Rect>();
  const taskHeader = createRef<Txt>();
  const inputRow = createRef<Rect>();
  const caret = createRef<Rect>();
  const taskRows = createRefArray<Rect>();
  const watermelonIcon = createRef<Icon>();

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

    {/* Panneau des projets */}
    <Rect
      key="project-panel"
      ref={projectPanel}
      width={() => vW() * 0.28}
      height={panelHeight}
      radius={() => vW() * 0.008}
      fill={PALETTE.bgCard}
      stroke={PALETTE.secondary}
      lineWidth={2}
      x={projectPanelX}
      opacity={0}
    >
      <Icon
        key="project-panel-icon"
        icon="mdi:checkbox-marked-outline"
        color={PALETTE.cyan}
        size={() => vW() * 0.024}
        x={() => vW() * -0.045}
        y={() => vH() * -0.255}
      />
      <Txt
        key="project-panel-title"
        text="Vikunja"
        fill={PALETTE.cream}
        fontSize={() => vW() * 0.016}
        fontFamily={FONT_MONO}
        fontWeight={700}
        x={() => vW() * 0.015}
        y={() => vH() * -0.255}
      />
      {PROJECT_LABELS.map((projectLabel, rowIndex) => (
        <Rect
          key={`project-row-${rowIndex}`}
          ref={projectRows}
          width={projectRowWidth}
          height={rowHeight}
          radius={() => vW() * 0.005}
          fill={PALETTE.nodeBg}
          stroke={rowIndex === NEW_PROJECT_INDEX ? PALETTE.cyan : PALETTE.ghost}
          lineWidth={2}
          y={() => projectRowY(rowIndex)}
          opacity={0}
        >
          <Icon
            key={`project-folder-${rowIndex}`}
            icon="mdi:folder-outline"
            color={rowIndex === NEW_PROJECT_INDEX ? PALETTE.cyan : PALETTE.secondary}
            size={() => vW() * 0.02}
            x={() => vW() * -0.1}
          />
          <Txt
            key={`project-label-${rowIndex}`}
            ref={projectLabels}
            text={rowIndex === NEW_PROJECT_INDEX ? '' : projectLabel}
            fill={rowIndex === NEW_PROJECT_INDEX ? PALETTE.cyan : PALETTE.cream}
            fontSize={() => vW() * 0.015}
            fontFamily={FONT_MONO}
            fontWeight={700}
            offset={[-1, 0]}
            x={() => vW() * -0.075}
          />
          {rowIndex === MARIAGE_INDEX && (
            <Icon
              key="mariage-check-icon"
              ref={mariageCheckIcon}
              icon="mdi:check-circle"
              color={PALETTE.vert}
              size={() => vW() * 0.02}
              x={() => vW() * 0.095}
              opacity={0}
            />
          )}
          {rowIndex === MARIAGE_INDEX && (
            <Icon
              key="mariage-archive-icon"
              ref={mariageArchiveIcon}
              icon="mdi:archive-outline"
              color={PALETTE.vert}
              size={() => vW() * 0.02}
              x={() => vW() * 0.095}
              opacity={0}
            />
          )}
        </Rect>
      ))}
    </Rect>

    {/* Panneau des tâches du nouveau projet */}
    <Rect
      key="task-panel"
      ref={taskPanel}
      width={() => vW() * 0.34}
      height={panelHeight}
      radius={() => vW() * 0.008}
      fill={PALETTE.bgCard}
      stroke={PALETTE.cyan}
      lineWidth={2}
      x={taskPanelX}
      opacity={0}
    >
      <Txt
        key="task-header"
        ref={taskHeader}
        text="déménagement"
        fill={PALETTE.cyan}
        fontSize={() => vW() * 0.016}
        fontFamily={FONT_MONO}
        fontWeight={700}
        y={() => vH() * -0.255}
      />

      {/* Ligne de saisie vide : le curseur clignote */}
      <Rect
        key="input-row"
        ref={inputRow}
        width={taskRowWidth}
        height={rowHeight}
        radius={() => vW() * 0.005}
        fill={'#00000000'}
        stroke={PALETTE.cyan}
        lineWidth={2}
        lineDash={() => [vW() * 0.006, vW() * 0.004]}
        y={() => taskRowY(0)}
      >
        <Rect
          key="input-caret"
          ref={caret}
          width={() => vW() * 0.002}
          height={() => vH() * 0.035}
          fill={PALETTE.cyan}
          x={() => vW() * -0.13}
        />
      </Rect>

      {/* Trois cartons = trois premières tâches */}
      {Array.from({length: TASK_COUNT}, (_, taskIndex) => (
        <Rect
          key={`task-row-${taskIndex}`}
          ref={taskRows}
          width={taskRowWidth}
          height={rowHeight}
          radius={() => vW() * 0.005}
          fill={PALETTE.nodeBg}
          stroke={PALETTE.cyan}
          lineWidth={2}
          y={() => taskRowY(taskIndex)}
          opacity={0}
        >
          <Icon
            key={`task-checkbox-${taskIndex}`}
            icon="mdi:checkbox-blank-outline"
            color={PALETTE.secondary}
            size={() => vW() * 0.02}
            x={() => vW() * -0.125}
          />
          <Icon
            key={`task-box-${taskIndex}`}
            icon="mdi:package-variant"
            color={PALETTE.cyan}
            size={() => vW() * 0.026}
            x={() => vW() * -0.075}
          />
          <Rect
            key={`task-skeleton-${taskIndex}`}
            width={() => vW() * (0.1 + taskIndex * 0.02)}
            height={() => vH() * 0.012}
            radius={() => vW() * 0.002}
            fill={PALETTE.ghost}
            offset={[-1, 0]}
            x={() => vW() * -0.04}
          />
        </Rect>
      ))}
    </Rect>

    {/* Fin : la pastèque */}
    <Icon
      key="watermelon-icon"
      ref={watermelonIcon}
      icon="twemoji:watermelon"
      size={() => vW() * 0.14}
      scale={0.4}
      opacity={0}
    />
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // 1. nouveau-projet — « mariage » clos et archivé, « déménagement » créé, vide
  yield* waitUntil('nouveau-projet');
  yield* all(
    gridRef().opacity(0.07, 0.8),
    projectPanel().opacity(1, 0.6),
  );
  yield* sequence(0.15,
    projectRows[0].opacity(1, 0.4),
    projectRows[1].opacity(1, 0.4),
    projectRows[MARIAGE_INDEX].opacity(1, 0.4),
  );
  yield* waitFor(0.4);

  // mariage : coché (vert) puis archivé
  yield* all(
    projectRows[MARIAGE_INDEX].stroke(PALETTE.vert, 0.4),
    projectLabels[MARIAGE_INDEX].fill(PALETTE.vert, 0.4),
    mariageCheckIcon().opacity(1, 0.4),
  );
  yield* waitFor(0.5);
  yield* all(
    mariageCheckIcon().opacity(0, 0.3),
    mariageArchiveIcon().opacity(1, 0.3),
    projectRows[MARIAGE_INDEX].opacity(0.45, 0.6),
  );
  yield* waitFor(0.4);

  // déménagement : le nom se tape dans la nouvelle ligne
  projectRows[NEW_PROJECT_INDEX].opacity(1);
  const newProjectName = PROJECT_LABELS[NEW_PROJECT_INDEX];
  for (let charCount = 1; charCount <= newProjectName.length; charCount++) {
    yield* projectLabels[NEW_PROJECT_INDEX].text(newProjectName.substring(0, charCount), 0.06);
  }
  yield* waitFor(0.3);

  // le projet est vide : curseur qui clignote dans son panneau de tâches
  yield* taskPanel().opacity(1, 0.5);
  const caretBlink = yield loop(Infinity, function* () {
    yield* caret().opacity(0, 0.4);
    yield* caret().opacity(1, 0.4);
  });
  yield* waitFor(1.6);

  // 2. premieres-taches — trois cartons, puis la pastèque
  yield* waitUntil('premieres-taches');
  cancel(caretBlink);
  caret().opacity(1);
  yield* inputRow().y(taskRowY(TASK_COUNT), 0.4, easeInOutCubic);
  yield* sequence(0.35,
    ...taskRows.map(taskRow => taskRow.opacity(1, 0.4)),
  );
  yield* waitFor(1.4);

  yield* all(
    projectPanel().opacity(0, 0.8),
    taskPanel().opacity(0, 0.8),
    gridRef().opacity(0, 0.8),
  );
  yield* all(
    watermelonIcon().opacity(1, 0.5),
    watermelonIcon().scale(1, 0.7, easeOutBack),
  );
  yield* waitFor(1.5);
});
