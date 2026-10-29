/**
 * systeme-briques — Le système construit brique par brique (CH.2 — SYSTÈME).
 *
 * Homelab en deux zones : gestion des tâches (Vikunja, trois projets,
 * « mariage » s'ajoute, la femme s'y connecte dès J+1) et gestion des documents
 * (Obsidian au centre, sous-dossier « mariage », Claude qui lit et écrit dans
 * le vault, puis Syncthing en maillage pair-à-pair entre PC, laptop et
 * téléphone, aucun serveur central).
 *
 * Couleur active : cyan. Alex = bleu, sa femme = rose (identité fixe).
 * Zones « homelab » : même rendu que dans `site-rsvp` (label, cyan, tirets).
 */
import {makeScene2D, Grid, Circle, Rect, Txt, Icon} from '@motion-canvas/2d';
import {
  createRef,
  createSignal,
  Reference,
  all,
  sequence,
  waitFor,
  waitUntil,
  easeInOutCubic,
  Vector2,
} from '@motion-canvas/core';
import {DiagramNode, DiagramEdge, Packet, Zone} from '../../components';
import {PALETTE} from '../../theme';
import {sfx, sfxFill, sfxReset, sfxFlush} from '../../sfx';

type Box = {position(): Vector2; width(): number; height(): number};

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  const MONO = 'JetBrains Mono, DM Mono, monospace';

  // ── Géométrie ──────────────────────────────────────────────────────────────
  const nodeWidth  = () => vW() * 0.12;
  const nodeHeight = () => vH() * 0.22;
  const deviceWidth  = () => vW() * 0.085;
  const deviceHeight = () => vH() * 0.17;
  const badgeSize    = () => vW() * 0.06;
  const edgeMargin   = () => vW() * 0.008;

  const zoneX = () => -vW() * 0.20;
  const zoneLabelSize = () => vW() * 0.32 * 0.035;
  const vikunjaY = () => -vH() * 0.20;
  const rowWidth  = () => vW() * 0.24;
  const rowHeight = () => vH() * 0.065;
  const rowYs = [() => vH() * 0.0, () => vH() * 0.09, () => vH() * 0.18];

  const personX = () => -vW() * 0.43;
  const wifeY   = () => -vH() * 0.25;
  const alexY   = () => -vH() * 0.08;
  const calendarY = () => vH() * 0.18;

  const obsidianX = () => vW() * 0.14;
  const obsidianY = () => -vH() * 0.10;
  const claudeX   = () => vW() * 0.38;

  const toPoint = (vector: Vector2): [number, number] => [vector.x, vector.y];

  /** Point sur le bord de `source` en direction de `target`, décalé de `margin`. */
  const edgePoint = (source: Box, target: Box, margin: number): [number, number] => {
    const sourcePosition = source.position();
    const targetPosition = target.position();
    const deltaX = targetPosition.x - sourcePosition.x;
    const deltaY = targetPosition.y - sourcePosition.y;
    const distance = Math.hypot(deltaX, deltaY) || 1;
    const scaleX = deltaX === 0 ? Infinity : source.width() / 2 / Math.abs(deltaX);
    const scaleY = deltaY === 0 ? Infinity : source.height() / 2 / Math.abs(deltaY);
    const ratio = Math.min(scaleX, scaleY);
    return [
      sourcePosition.x + deltaX * ratio + (deltaX / distance) * margin,
      sourcePosition.y + deltaY * ratio + (deltaY / distance) * margin,
    ];
  };

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const tasksZone = createRef<Zone>();
  const docsZone = createRef<Zone>();
  const vikunjaNode = createRef<DiagramNode>();
  const rowBoulot = createRef<Rect>();
  const rowPerso = createRef<Rect>();
  const rowMariage = createRef<Rect>();
  const wifeBadge = createRef<Circle>();
  const alexBadge = createRef<Circle>();
  const calendarBadge = createRef<Circle>();
  const wifeEdge = createRef<DiagramEdge>();
  const alexEdge = createRef<DiagramEdge>();
  const calendarEdge = createRef<DiagramEdge>();
  const deadlinePacket = createRef<Packet>();
  const dayCounterLabel = createRef<Txt>();
  const dayCounter = createSignal(0);

  const folderCard = createRef<Rect>();
  const subfolderRow = createRef<Rect>();
  const obsidianNode = createRef<DiagramNode>();
  const claudeNode = createRef<DiagramNode>();
  const claudeEdge = createRef<DiagramEdge>();
  const readPacket = createRef<Packet>();
  const writePacket = createRef<Packet>();
  const decisionDocA = createRef<Icon>();
  const decisionDocB = createRef<Icon>();
  const decisionDocC = createRef<Icon>();

  const phoneNode = createRef<DiagramNode>();
  const pcNode = createRef<DiagramNode>();
  const laptopNode = createRef<DiagramNode>();
  const meshPhonePc = createRef<DiagramEdge>();
  const meshPhoneLaptop = createRef<DiagramEdge>();
  const meshPcLaptop = createRef<DiagramEdge>();
  const meshLabel = createRef<Txt>();
  const syncPacketPc = createRef<Packet>();
  const syncPacketLaptop = createRef<Packet>();

  /** Ligne de la liste de projets Vikunja. */
  const projectRow = (
    rowKey: string,
    rowRef: Reference<Rect>,
    label: string,
    color: string,
    positionY: () => number,
  ) => (
    <Rect key={rowKey} ref={rowRef}
      layout
      direction={'row'}
      alignItems={'center'}
      gap={() => vW() * 0.008}
      padding={() => vW() * 0.01}
      width={rowWidth}
      height={rowHeight}
      fill={PALETTE.nodeBg}
      stroke={color}
      lineWidth={2}
      radius={() => vW() * 0.004}
      x={zoneX}
      y={positionY}
      opacity={0}
    >
      <Icon key={`${rowKey}-icon`} icon="mdi:folder-outline" color={color} size={() => vW() * 0.016} />
      <Txt key={`${rowKey}-label`} text={label}
        fill={PALETTE.cream}
        fontSize={() => vW() * 0.012}
        fontFamily={MONO}
        fontWeight={700}
      />
    </Rect>
  );

  /** Pastille « personne » : icône mdi:account sans nom, couleur d'identité. */
  const personBadge = (
    badgeKey: string,
    badgeRef: Reference<Circle>,
    color: string,
    positionY: () => number,
  ) => (
    <Circle key={badgeKey} ref={badgeRef}
      width={badgeSize} height={badgeSize}
      fill={PALETTE.nodeBg}
      stroke={color}
      lineWidth={2}
      x={personX} y={positionY}
      opacity={0}
    >
      <Icon key={`${badgeKey}-icon`} icon="mdi:account" color={color} size={() => vW() * 0.035} />
    </Circle>
  );

  // ── Scene tree ─────────────────────────────────────────────────────────────
  view.add(<>
    <Grid key="bg-grid" ref={gridRef}
      width={'100%'} height={'100%'}
      spacing={() => vW() * 0.05}
      stroke={PALETTE.ghost}
      lineWidth={1}
      opacity={0}
    />

    {/* Deux zones homelab — rendu identique à site-rsvp, même taille de label */}
    <Zone key="tasks-zone" ref={tasksZone}
      label="HOMELAB · GESTION DES TÂCHES"
      labelFontSize={zoneLabelSize}
      color={PALETTE.cyan}
      width={() => vW() * 0.32}
      height={() => vH() * 0.80}
      x={zoneX} y={0}
      opacity={0}
    />
    <Zone key="docs-zone" ref={docsZone}
      label="HOMELAB · GESTION DES DOCUMENTS"
      labelFontSize={zoneLabelSize}
      color={PALETTE.cyan}
      width={() => vW() * 0.49}
      height={() => vH() * 0.94}
      x={() => vW() * 0.225} y={0}
      opacity={0}
    />

    <DiagramNode key="vikunja-node" ref={vikunjaNode}
      iconName="mdi:checkbox-marked-outline"
      label="VIKUNJA"
      color={PALETTE.cyan}
      initialState="idle"
      width={nodeWidth} height={nodeHeight}
      x={zoneX} y={vikunjaY}
      opacity={0}
    />
    {projectRow('row-boulot', rowBoulot, 'boulot', PALETTE.secondary, rowYs[0])}
    {projectRow('row-perso', rowPerso, 'perso', PALETTE.secondary, rowYs[1])}
    {projectRow('row-mariage', rowMariage, 'mariage', PALETTE.cyan, rowYs[2])}

    {/* Les deux mariés + calendrier */}
    {personBadge('badge-wife', wifeBadge, PALETTE.rose, wifeY)}
    {personBadge('badge-alex', alexBadge, PALETTE.blue, alexY)}
    <Circle key="badge-calendar" ref={calendarBadge}
      width={badgeSize} height={badgeSize}
      fill={PALETTE.nodeBg}
      stroke={PALETTE.secondary}
      lineWidth={2}
      x={personX} y={calendarY}
      opacity={0}
    >
      <Icon key="badge-calendar-icon" icon="logos:google-calendar" size={() => vW() * 0.032} />
    </Circle>

    <Txt key="day-counter-label" ref={dayCounterLabel}
      text={() => `J+${Math.round(dayCounter())}`}
      fill={PALETTE.cyan}
      fontSize={() => vW() * 0.016}
      fontFamily={MONO}
      fontWeight={700}
      x={personX} y={() => -vH() * 0.37}
      opacity={0}
    />

    <DiagramEdge key="edge-alex-vikunja" ref={alexEdge}
      from={() => edgePoint(alexBadge(), vikunjaNode(), edgeMargin())}
      to={() => edgePoint(vikunjaNode(), alexBadge(), edgeMargin())}
      stroke={PALETTE.secondary}
      end={0} opacity={0}
    />
    <DiagramEdge key="edge-wife-vikunja" ref={wifeEdge}
      from={() => edgePoint(wifeBadge(), vikunjaNode(), edgeMargin())}
      to={() => edgePoint(vikunjaNode(), wifeBadge(), edgeMargin())}
      stroke={PALETTE.cyan}
      end={0} opacity={0}
    />
    <DiagramEdge key="edge-calendar-mariage" ref={calendarEdge}
      from={() => edgePoint(calendarBadge(), rowMariage(), edgeMargin())}
      to={() => edgePoint(rowMariage(), calendarBadge(), edgeMargin())}
      stroke={PALETTE.cyan}
      edgeStyle="dashed"
      end={0} opacity={0}
    />
    <Packet key="deadline-packet" ref={deadlinePacket}
      content="J-14"
      color={PALETTE.cyan}
      packetSize="sm"
      width={() => vW() * 0.04} height={() => vH() * 0.04}
      x={personX} y={calendarY}
      opacity={0}
    />

    {/* Obsidian + dossiers */}
    <Rect key="folder-card" ref={folderCard}
      width={() => vW() * 0.17} height={() => vH() * 0.13}
      fill={PALETTE.nodeBg}
      stroke={PALETTE.secondary}
      lineWidth={2}
      radius={() => vW() * 0.004}
      x={obsidianX} y={() => -vH() * 0.35}
      opacity={0}
    >
      <Rect key="folder-root-row"
        layout direction={'row'} alignItems={'center'}
        gap={() => vW() * 0.006}
        offset={[-1, 0]}
        x={() => -vW() * 0.075} y={() => -vH() * 0.03}
      >
        <Icon key="folder-root-icon" icon="mdi:folder-outline" color={PALETTE.secondary} size={() => vW() * 0.014} />
        <Txt key="folder-root-label" text="Second cerveau"
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.0105}
          fontFamily={MONO}
        />
      </Rect>
      <Rect key="subfolder-row" ref={subfolderRow}
        layout direction={'row'} alignItems={'center'}
        gap={() => vW() * 0.006}
        offset={[-1, 0]}
        x={() => -vW() * 0.06} y={() => vH() * 0.03}
        opacity={0}
      >
        <Icon key="subfolder-icon" icon="mdi:folder-outline" color={PALETTE.cyan} size={() => vW() * 0.014} />
        <Txt key="subfolder-label" text="mariage"
          fill={PALETTE.cyan}
          fontSize={() => vW() * 0.0105}
          fontFamily={MONO}
          fontWeight={700}
        />
      </Rect>
    </Rect>

    <DiagramNode key="obsidian-node" ref={obsidianNode}
      iconName="logos:obsidian-icon"
      label="OBSIDIAN"
      color={PALETTE.cyan}
      initialState="idle"
      width={nodeWidth} height={nodeHeight}
      x={obsidianX} y={obsidianY}
      opacity={0}
    />
    <Icon key="decision-doc-a" ref={decisionDocA}
      icon="mdi:file-document-outline" color={PALETTE.cyan}
      size={() => vW() * 0.024}
      x={() => vW() * 0.33} y={() => -vH() * 0.36}
      opacity={0}
    />
    <Icon key="decision-doc-b" ref={decisionDocB}
      icon="mdi:file-document-outline" color={PALETTE.cyan}
      size={() => vW() * 0.024}
      x={() => vW() * 0.40} y={() => -vH() * 0.31}
      opacity={0}
    />
    <Icon key="decision-doc-c" ref={decisionDocC}
      icon="mdi:file-document-outline" color={PALETTE.cyan}
      size={() => vW() * 0.024}
      x={() => vW() * 0.43} y={() => -vH() * 0.24}
      opacity={0}
    />

    {/* Claude ↔ Obsidian */}
    <DiagramNode key="claude-node" ref={claudeNode}
      iconName="logos:claude-icon"
      label="CLAUDE"
      color={PALETTE.cyan}
      initialState="idle"
      width={nodeWidth} height={nodeHeight}
      x={claudeX} y={obsidianY}
      opacity={0}
    />
    <DiagramEdge key="edge-obsidian-claude" ref={claudeEdge}
      from={() => edgePoint(obsidianNode(), claudeNode(), edgeMargin())}
      to={() => edgePoint(claudeNode(), obsidianNode(), edgeMargin())}
      edgeDirection="bi"
      stroke={PALETTE.cyan}
      end={0} opacity={0}
    />
    <Packet key="read-packet" ref={readPacket}
      content="lit"
      color={PALETTE.cyan}
      packetSize="sm"
      width={() => vW() * 0.035} height={() => vH() * 0.04}
      x={obsidianX} y={obsidianY}
      opacity={0}
    />
    <Packet key="write-packet" ref={writePacket}
      content="écrit"
      color={PALETTE.cyan}
      packetSize="sm"
      width={() => vW() * 0.045} height={() => vH() * 0.04}
      x={claudeX} y={obsidianY}
      opacity={0}
    />

    {/* Syncthing — maillage pair-à-pair */}
    <DiagramNode key="device-phone" ref={phoneNode}
      iconName="mdi:cellphone"
      label="TÉL."
      color={PALETTE.cyan}
      initialState="idle"
      width={deviceWidth} height={deviceHeight}
      x={obsidianX} y={() => vH() * 0.16}
      opacity={0}
    />
    <DiagramNode key="device-pc" ref={pcNode}
      iconName="mdi:desktop-classic"
      label="PC"
      color={PALETTE.cyan}
      initialState="idle"
      width={deviceWidth} height={deviceHeight}
      x={() => vW() * 0.05} y={() => vH() * 0.37}
      opacity={0}
    />
    <DiagramNode key="device-laptop" ref={laptopNode}
      iconName="mdi:laptop"
      label="LAPTOP"
      color={PALETTE.cyan}
      initialState="idle"
      width={deviceWidth} height={deviceHeight}
      x={() => vW() * 0.25} y={() => vH() * 0.37}
      opacity={0}
    />
    <DiagramEdge key="mesh-phone-pc" ref={meshPhonePc}
      from={() => edgePoint(phoneNode(), pcNode(), edgeMargin())}
      to={() => edgePoint(pcNode(), phoneNode(), edgeMargin())}
      edgeDirection="bi" stroke={PALETTE.cyan} end={0} opacity={0}
    />
    <DiagramEdge key="mesh-phone-laptop" ref={meshPhoneLaptop}
      from={() => edgePoint(phoneNode(), laptopNode(), edgeMargin())}
      to={() => edgePoint(laptopNode(), phoneNode(), edgeMargin())}
      edgeDirection="bi" stroke={PALETTE.cyan} end={0} opacity={0}
    />
    <DiagramEdge key="mesh-pc-laptop" ref={meshPcLaptop}
      from={() => edgePoint(pcNode(), laptopNode(), edgeMargin())}
      to={() => edgePoint(laptopNode(), pcNode(), edgeMargin())}
      edgeDirection="bi" stroke={PALETTE.cyan} end={0} opacity={0}
    />
    <Txt key="mesh-label" ref={meshLabel}
      text="SYNCTHING"
      fill={PALETTE.secondary}
      fontSize={() => vW() * 0.011}
      fontFamily={MONO}
      fontWeight={700}
      x={obsidianX} y={() => vH() * 0.31}
      opacity={0}
    />
    <Packet key="sync-packet-pc" ref={syncPacketPc}
      content="md"
      color={PALETTE.cyan}
      packetSize="sm"
      width={() => vW() * 0.03} height={() => vH() * 0.04}
      x={obsidianX} y={() => vH() * 0.16}
      opacity={0}
    />
    <Packet key="sync-packet-laptop" ref={syncPacketLaptop}
      content="md"
      color={PALETTE.cyan}
      packetSize="sm"
      width={() => vW() * 0.03} height={() => vH() * 0.04}
      x={obsidianX} y={() => vH() * 0.16}
      opacity={0}
    />
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // Icônes chargées avant de mesurer les lignes en layout (edgePoint lit leur taille)
  yield view;
  sfxReset();

  // 1. Vikunja dans le homelab, trois projets, le calendrier branché
  yield* waitUntil('vikunja');
  yield* gridRef().opacity(0.07, 0.6);
  yield* all(tasksZone().opacity(1, 0.5), vikunjaNode().opacity(1, 0.5));
  yield* sequence(0.2, rowBoulot().opacity(1, 0.3), rowPerso().opacity(1, 0.3));
  rowMariage().y(rowYs[2]() + vH() * 0.04);
  yield* all(
    rowMariage().opacity(1, 0.5),
    rowMariage().y(rowYs[2](), 0.5, easeInOutCubic),
  );
  yield* all(alexBadge().opacity(1, 0.4), calendarBadge().opacity(1, 0.4));
  alexEdge().opacity(1);
  calendarEdge().opacity(1);
  sfx('draw', 0.6);
  yield* all(
    alexEdge().end(1, 0.5, easeInOutCubic),
    calendarEdge().end(1, 0.5, easeInOutCubic),
  );
  deadlinePacket().opacity(1);
  sfx('travel');
  yield* deadlinePacket().flyTo(edgePoint(rowMariage(), calendarBadge(), 0), 0.9);
  yield* deadlinePacket().opacity(0, 0.2);

  // 2. Adoption dès le lendemain
  yield* waitUntil('adoption');
  yield* wifeBadge().opacity(1, 0.4);
  wifeEdge().opacity(1);
  sfx('draw', 0.6);
  sfx('activate', 1, 0.3);
  yield* all(
    wifeEdge().end(1, 0.6, easeInOutCubic),
    vikunjaNode().setState('active', 0.4),
  );
  yield* dayCounterLabel().opacity(1, 0.3);
  sfxFill(0, 1, 0.9, {ease: easeInOutCubic, steps: 4});
  yield* dayCounter(1, 0.9, easeInOutCubic);
  yield* waitFor(0.6);

  // 3. Obsidian au centre, sous-dossier « mariage », décisions qui convergent
  yield* waitUntil('obsidian');
  yield* all(docsZone().opacity(1, 0.4), folderCard().opacity(1, 0.4), obsidianNode().opacity(1, 0.5));
  yield* subfolderRow().opacity(1, 0.4);
  yield* sequence(0.2,
    decisionDocA().opacity(1, 0.25),
    decisionDocB().opacity(1, 0.25),
    decisionDocC().opacity(1, 0.25),
  );
  [0, 0.15, 0.3].forEach(delay => sfx('swap', 0.7, delay));
  yield* sequence(0.15,
    all(
      decisionDocA().position(obsidianNode().position(), 0.7, easeInOutCubic),
      decisionDocA().opacity(0, 0.7),
    ),
    all(
      decisionDocB().position(obsidianNode().position(), 0.7, easeInOutCubic),
      decisionDocB().opacity(0, 0.7),
    ),
    all(
      decisionDocC().position(obsidianNode().position(), 0.7, easeInOutCubic),
      decisionDocC().opacity(0, 0.7),
    ),
  );
  sfx('activate');
  yield* obsidianNode().setState('active', 0.3);
  yield* waitFor(0.4);

  // 4. Claude lit et écrit dans le vault (bidirectionnel)
  yield* waitUntil('ia');
  yield* claudeNode().opacity(1, 0.5);
  claudeEdge().opacity(1);
  sfx('draw', 0.6);
  yield* claudeEdge().end(1, 0.5, easeInOutCubic);
  readPacket().position(obsidianNode().position());
  yield* readPacket().opacity(1, 0.15);
  sfx('travel');
  yield* readPacket().flyTo(toPoint(claudeNode().position()), 0.8);
  sfx('activate');
  yield* all(readPacket().opacity(0, 0.15), claudeNode().setState('active', 0.3));
  writePacket().position(claudeNode().position());
  yield* writePacket().opacity(1, 0.15);
  sfx('travel');
  yield* writePacket().flyTo(toPoint(obsidianNode().position()), 0.8);
  sfx('emphasis', 0.7);
  yield* all(writePacket().opacity(0, 0.15), obsidianNode().setState('highlighted', 0.3));
  yield* waitFor(0.4);

  // 5. Syncthing — maillage, sans serveur central
  yield* waitUntil('syncthing');
  yield* sequence(0.2,
    phoneNode().opacity(1, 0.4),
    pcNode().opacity(1, 0.4),
    laptopNode().opacity(1, 0.4),
  );
  meshPhonePc().opacity(1);
  meshPhoneLaptop().opacity(1);
  meshPcLaptop().opacity(1);
  sfx('draw');
  yield* all(
    meshPhonePc().end(1, 0.6, easeInOutCubic),
    meshPhoneLaptop().end(1, 0.6, easeInOutCubic),
    meshPcLaptop().end(1, 0.6, easeInOutCubic),
    meshLabel().opacity(1, 0.6),
  );
  // Une modification sur le téléphone se propage aux deux autres
  sfx('emphasis', 0.7);
  yield* phoneNode().setState('highlighted', 0.3);
  syncPacketPc().position(phoneNode().position());
  syncPacketLaptop().position(phoneNode().position());
  yield* all(syncPacketPc().opacity(1, 0.15), syncPacketLaptop().opacity(1, 0.15));
  sfx('travel');
  sfx('travel', 0.6, 0.05);
  yield* all(
    syncPacketPc().flyTo(toPoint(pcNode().position()), 0.9),
    syncPacketLaptop().flyTo(toPoint(laptopNode().position()), 0.9),
  );
  sfx('success', 0.8);
  yield* all(
    syncPacketPc().opacity(0, 0.15),
    syncPacketLaptop().opacity(0, 0.15),
    pcNode().setState('active', 0.3),
    laptopNode().setState('active', 0.3),
  );
  yield* waitFor(1);
  sfxFlush('systeme-briques');
});
