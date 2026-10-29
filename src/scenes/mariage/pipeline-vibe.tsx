/**
 * pipeline-vibe — Du bavardage au compte-rendu, sans quitter la maison (CH.2 — SYSTÈME).
 *
 * Deux personnes parlent, l'onde audio descend dans Vibe (zone « local », cadenas,
 * nuage barré en fond : rien ne part vers le cloud), ressort en transcription,
 * passe par Claude pour devenir un résumé de trois lignes, rangé dans Obsidian.
 * Variante téléphone : l'onde reste bloquée par une barrière tant que la coche
 * de consentement de l'interlocuteur n'est pas verte.
 *
 * Couleur active : vert. Rose uniquement pour le nuage barré, la barrière et la
 * mariée (identité fixe) ; Alex = bleu.
 */
import {makeScene2D, Grid, Circle, Layout, Line, Rect, Txt, Icon} from '@motion-canvas/2d';
import {
  createRef,
  Reference,
  all,
  cancel,
  sequence,
  waitFor,
  waitUntil,
  easeInOutCubic,
  Vector2,
  ThreadGenerator,
} from '@motion-canvas/core';
import {DiagramNode, DiagramEdge, Packet, Terminal, Zone} from '../../components';
import {PALETTE} from '../../theme';
import {sfx, sfxReset, sfxFlush} from '../../sfx';

type Box = {position(): Vector2; width(): number; height(): number};

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  const MONO = 'JetBrains Mono, DM Mono, monospace';

  // ── Géométrie ──────────────────────────────────────────────────────────────
  const badgeSize  = () => vW() * 0.06;
  const edgeMargin = () => vW() * 0.008;

  const alexX = () => -vW() * 0.40;
  const wifeX = () => -vW() * 0.22;
  const waveX = () => -vW() * 0.31;
  const personsY = () => -vH() * 0.33;

  const zoneY = () => vH() * 0.05;
  const vibeY = () => vH() * 0.08;
  const barrierY = () => -vH() * 0.17;

  const terminalX = () => vW() * 0.13;
  const terminalY = () => vH() * 0.08;
  const topRowY   = () => -vH() * 0.30;
  const claudeX   = () => vW() * 0.10;
  const docX      = () => vW() * 0.27;
  const obsidianX = () => vW() * 0.42;

  const barCount = 9;
  const waveBars: Reference<Rect>[] = [];
  for (let i = 0; i < barCount; i++) waveBars.push(createRef<Rect>());

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
  const alexBadge = createRef<Circle>();
  const wifeBadge = createRef<Circle>();
  const interlocutorBadge = createRef<Circle>();
  const waveGroup = createRef<Layout>();

  const localZone = createRef<Zone>();
  const lockIcon = createRef<Icon>();
  const vibeNode = createRef<DiagramNode>();
  const cloudIcon = createRef<Icon>();
  const cloudSlash = createRef<Line>();

  const transcriptTerminal = createRef<Terminal>();
  const vibeToTerminalEdge = createRef<DiagramEdge>();
  const claudeNode = createRef<DiagramNode>();
  const terminalToClaudeEdge = createRef<DiagramEdge>();
  const textPacket = createRef<Packet>();
  const summaryDoc = createRef<Rect>();
  const claudeToDocEdge = createRef<DiagramEdge>();
  const obsidianNode = createRef<DiagramNode>();
  const vaultChip = createRef<Txt>();

  const phoneIcon = createRef<Icon>();
  const consentIcon = createRef<Icon>();
  const barrier = createRef<Rect>();

  /** Fait osciller une barre de l'onde, décalée dans le temps pour un effet organique. */
  function* pulseBar(barRef: Reference<Rect>, barIndex: number): ThreadGenerator {
    const lowHeight = vH() * 0.012;
    const highHeight = vH() * (0.035 + 0.045 * (((barIndex * 7) % 5) / 4));
    yield* waitFor(barIndex * 0.05);
    while (true) {
      yield* barRef().height(highHeight, 0.22 + (barIndex % 3) * 0.04);
      yield* barRef().height(lowHeight, 0.22 + (barIndex % 3) * 0.04);
    }
  }

  // ── Scene tree ─────────────────────────────────────────────────────────────
  view.add(<>
    <Grid key="bg-grid" ref={gridRef}
      width={'100%'} height={'100%'}
      spacing={() => vW() * 0.05}
      stroke={PALETTE.ghost}
      lineWidth={1}
      opacity={0}
    />

    {/* Les deux interlocuteurs */}
    <Circle key="badge-alex" ref={alexBadge}
      width={badgeSize} height={badgeSize}
      fill={PALETTE.nodeBg} stroke={PALETTE.blue} lineWidth={2}
      x={alexX} y={personsY}
      opacity={0}
    >
      <Icon key="badge-alex-icon" icon="mdi:account" color={PALETTE.blue} size={() => vW() * 0.035} />
    </Circle>
    <Circle key="badge-wife" ref={wifeBadge}
      width={badgeSize} height={badgeSize}
      fill={PALETTE.nodeBg} stroke={PALETTE.rose} lineWidth={2}
      x={wifeX} y={personsY}
      opacity={0}
    >
      <Icon key="badge-wife-icon" icon="mdi:account" color={PALETTE.rose} size={() => vW() * 0.035} />
    </Circle>
    <Circle key="badge-interlocutor" ref={interlocutorBadge}
      width={badgeSize} height={badgeSize}
      fill={PALETTE.nodeBg} stroke={PALETTE.secondary} lineWidth={2}
      x={wifeX} y={personsY}
      opacity={0}
    >
      <Icon key="badge-interlocutor-icon" icon="mdi:account" color={PALETTE.secondary} size={() => vW() * 0.035} />
    </Circle>

    {/* Onde audio */}
    <Layout key="wave-group" ref={waveGroup}
      x={waveX} y={personsY}
      opacity={0}
    >
      {waveBars.map((barRef, barIndex) => (
        <Rect key={`wave-bar-${barIndex}`} ref={barRef}
          width={() => vW() * 0.005}
          height={() => vH() * 0.012}
          fill={PALETTE.vert}
          radius={() => vW() * 0.0025}
          x={() => (barIndex - (barCount - 1) / 2) * vW() * 0.011}
        />
      ))}
    </Layout>

    {/* Barrière de consentement (variante téléphone) */}
    <Icon key="phone-icon" ref={phoneIcon}
      icon="mdi:phone" color={PALETTE.secondary}
      size={() => vW() * 0.03}
      x={waveX} y={() => -vH() * 0.44}
      opacity={0}
    />
    <Icon key="consent-icon" ref={consentIcon}
      icon="mdi:account-check" color={PALETTE.ghost}
      size={() => vW() * 0.03}
      x={wifeX} y={() => -vH() * 0.44}
      opacity={0}
    />
    <Rect key="consent-barrier" ref={barrier}
      width={() => vW() * 0.16} height={() => vH() * 0.014}
      fill={PALETTE.rose}
      radius={() => vW() * 0.003}
      x={waveX} y={barrierY}
      opacity={0}
    />

    {/* Zone locale : Vibe + cadenas */}
    <Zone key="local-zone" ref={localZone}
      label="LOCAL"
      color={PALETTE.vert}
      width={() => vW() * 0.26}
      height={() => vH() * 0.30}
      x={waveX} y={zoneY}
      opacity={0}
    />
    <DiagramNode key="vibe-node" ref={vibeNode}
      iconName="mdi:microphone"
      label="VIBE"
      color={PALETTE.vert}
      initialState="idle"
      width={() => vW() * 0.11} height={() => vH() * 0.20}
      x={waveX} y={vibeY}
      opacity={0}
    />
    <Icon key="lock-icon" ref={lockIcon}
      icon="mdi:lock" color={PALETTE.vert}
      size={() => vW() * 0.02}
      x={() => waveX() + vW() * 0.10} y={() => zoneY() - vH() * 0.115}
      opacity={0}
    />

    {/* Nuage barré : rien ne part vers le cloud */}
    <Icon key="cloud-icon" ref={cloudIcon}
      icon="mdi:cloud-outline" color={PALETTE.ghost}
      size={() => vW() * 0.08}
      x={waveX} y={() => vH() * 0.38}
      opacity={0}
    />
    <Line key="cloud-slash" ref={cloudSlash}
      points={() => [
        [waveX() - vW() * 0.05, vH() * 0.38 + vH() * 0.07],
        [waveX() + vW() * 0.05, vH() * 0.38 - vH() * 0.07],
      ]}
      stroke={PALETTE.rose}
      lineWidth={4}
      end={0}
      opacity={0}
    />

    {/* Transcription */}
    <Terminal key="transcript-terminal" ref={transcriptTerminal}
      title="transcription.txt"
      maxLines={5}
      fontSize={() => vW() * 0.0105}
      width={() => vW() * 0.30} height={() => vH() * 0.34}
      x={terminalX} y={terminalY}
      stroke={PALETTE.vert}
      opacity={0}
    />
    <DiagramEdge key="edge-vibe-terminal" ref={vibeToTerminalEdge}
      from={() => edgePoint(vibeNode(), transcriptTerminal(), edgeMargin())}
      to={() => edgePoint(transcriptTerminal(), vibeNode(), edgeMargin())}
      stroke={PALETTE.vert}
      end={0} opacity={0}
    />

    {/* Résumé Claude → Obsidian */}
    <DiagramNode key="claude-node" ref={claudeNode}
      iconName="logos:claude-icon"
      label="CLAUDE"
      color={PALETTE.vert}
      initialState="idle"
      width={() => vW() * 0.10} height={() => vH() * 0.22}
      x={claudeX} y={topRowY}
      opacity={0}
    />
    <DiagramEdge key="edge-terminal-claude" ref={terminalToClaudeEdge}
      from={() => edgePoint(transcriptTerminal(), claudeNode(), edgeMargin())}
      to={() => edgePoint(claudeNode(), transcriptTerminal(), edgeMargin())}
      stroke={PALETTE.vert}
      end={0} opacity={0}
    />
    <Packet key="text-packet" ref={textPacket}
      content="texte"
      color={PALETTE.vert}
      packetSize="sm"
      width={() => vW() * 0.04} height={() => vH() * 0.04}
      x={terminalX} y={() => terminalY() - vH() * 0.17}
      opacity={0}
    />
    <Rect key="summary-doc" ref={summaryDoc}
      width={() => vW() * 0.12} height={() => vH() * 0.2}
      fill={PALETTE.nodeBg}
      stroke={PALETTE.vert}
      lineWidth={2}
      radius={() => vW() * 0.004}
      x={claudeX} y={topRowY}
      opacity={0}
    >
      <Rect key="summary-line-1"
        width={() => vW() * 0.09} height={() => vH() * 0.012}
        fill={PALETTE.vert} radius={() => vW() * 0.002}
        y={() => -vH() * 0.04}
      />
      <Rect key="summary-line-2"
        width={() => vW() * 0.07} height={() => vH() * 0.012}
        fill={PALETTE.secondary} radius={() => vW() * 0.002}
        y={0}
      />
      <Rect key="summary-line-3"
        width={() => vW() * 0.08} height={() => vH() * 0.012}
        fill={PALETTE.secondary} radius={() => vW() * 0.002}
        y={() => vH() * 0.04}
      />
    </Rect>
    <DiagramEdge key="edge-claude-doc" ref={claudeToDocEdge}
      from={() => edgePoint(claudeNode(), summaryDoc(), edgeMargin())}
      to={() => [docX() - vW() * 0.07, topRowY()]}
      stroke={PALETTE.vert}
      end={0} opacity={0}
    />
    <DiagramNode key="obsidian-node" ref={obsidianNode}
      iconName="logos:obsidian-icon"
      label="OBSIDIAN"
      color={PALETTE.vert}
      initialState="idle"
      width={() => vW() * 0.10} height={() => vH() * 0.22}
      x={obsidianX} y={topRowY}
      opacity={0}
    />
    <Txt key="vault-chip" ref={vaultChip}
      text="compte-rendu.md"
      fill={PALETTE.vert}
      fontSize={() => vW() * 0.0095}
      fontFamily={MONO}
      fontWeight={700}
      x={obsidianX} y={() => topRowY() + vH() * 0.15}
      opacity={0}
    />
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────
  let waveTasks: ThreadGenerator[] = [];
  sfxReset();

  /** Un tic discret toutes les 3 lettres, calé sur `typewrite()`. */
  const typingTicks = (text: string, charDelay: number) => {
    for (let i = 0; i < text.length; i += 3) sfx('tick', 0.35, i * charDelay);
  };

  // 1. Deux personnes parlent, l'onde audio vit entre elles
  yield* waitUntil('discussion');
  yield* gridRef().opacity(0.07, 0.6);
  yield* sequence(0.2,
    alexBadge().opacity(1, 0.4),
    wifeBadge().opacity(1, 0.4),
    waveGroup().opacity(1, 0.4),
  );
  for (let i = 0; i < barCount; i++) {
    waveTasks.push(yield pulseBar(waveBars[i], i));
  }
  yield* waitFor(2);

  // 2. L'onde descend dans Vibe — zone locale, cadenas, nuage barré
  yield* waitUntil('vibe');
  yield* all(localZone().opacity(1, 0.5), vibeNode().opacity(1, 0.5), lockIcon().opacity(1, 0.5));
  sfx('travel', 0.5);
  yield* all(
    waveGroup().y(vibeY() - vH() * 0.12, 0.9, easeInOutCubic),
    waveGroup().opacity(0.2, 0.9),
  );
  waveTasks.forEach(task => cancel(task));
  waveTasks = [];
  sfx('activate');
  yield* all(
    vibeNode().setState('active', 0.3),
    waveGroup().opacity(0, 0.3),
  );
  yield* cloudIcon().opacity(1, 0.4);
  cloudSlash().opacity(1);
  sfx('draw', 0.6);
  yield* cloudSlash().end(1, 0.5, easeInOutCubic);
  yield* waitFor(0.5);

  // 3. La sortie : le texte s'écrit
  yield* waitUntil('transcription');
  yield* transcriptTerminal().opacity(1, 0.4);
  vibeToTerminalEdge().opacity(1);
  sfx('draw', 0.6);
  yield* vibeToTerminalEdge().end(1, 0.5, easeInOutCubic);
  for (const line of ['[00:02] A : on valide ?', '[00:05] B : oui.', '[00:08] A : devis lundi.']) {
    typingTicks(line, 0.03);
    yield* transcriptTerminal().typewrite(line, {color: 'vert', charDelay: 0.03});
  }
  yield* transcriptTerminal().hideCursor(0.2);
  yield* waitFor(0.4);

  // 4. Claude résume en trois lignes, le résumé rejoint Obsidian
  yield* waitUntil('resume');
  yield* claudeNode().opacity(1, 0.4);
  terminalToClaudeEdge().opacity(1);
  sfx('draw', 0.6);
  yield* terminalToClaudeEdge().end(1, 0.5, easeInOutCubic);
  yield* textPacket().opacity(1, 0.15);
  sfx('travel');
  yield* textPacket().flyTo(edgePoint(claudeNode(), transcriptTerminal(), 0), 0.8);
  sfx('activate');
  yield* all(textPacket().opacity(0, 0.15), claudeNode().setState('active', 0.3));
  summaryDoc().x(claudeX());
  sfx('travel', 0.4);
  yield* all(
    summaryDoc().opacity(1, 0.4),
    summaryDoc().x(docX(), 0.8, easeInOutCubic),
    obsidianNode().opacity(1, 0.5),
  );
  yield* waitFor(0.4);
  sfx('swap', 0.7);
  yield* all(
    summaryDoc().position(toPoint(obsidianNode().position()), 0.8, easeInOutCubic),
    summaryDoc().scale(0.3, 0.8, easeInOutCubic),
    summaryDoc().opacity(0, 0.8),
  );
  sfx('success', 0.7);
  yield* all(obsidianNode().setState('active', 0.3), vaultChip().opacity(1, 0.4));
  yield* waitFor(0.5);

  // 5. Variante téléphone : l'onde attend la coche de consentement
  yield* waitUntil('telephone');
  yield* all(
    wifeBadge().opacity(0, 0.4),
    interlocutorBadge().opacity(1, 0.4),
    phoneIcon().opacity(1, 0.4),
    consentIcon().opacity(1, 0.4),
    barrier().opacity(1, 0.4),
    vibeNode().setState('idle', 0.4),
  );
  waveGroup().y(personsY());
  waveGroup().opacity(1);
  for (let i = 0; i < barCount; i++) {
    waveTasks.push(yield pulseBar(waveBars[i], i));
  }
  yield* waitFor(0.8);
  // L'onde descend, se heurte à la barrière, rebondit
  sfx('travel', 0.5);
  yield* waveGroup().y(barrierY() - vH() * 0.05, 0.7, easeInOutCubic);
  sfx('failure');
  for (const barRef of waveBars) barRef().fill(PALETTE.rose);
  yield* barrier().scale(1.15, 0.12);
  yield* all(
    barrier().scale(1, 0.2),
    waveGroup().y(personsY() + vH() * 0.06, 0.5, easeInOutCubic),
  );
  for (const barRef of waveBars) barRef().fill(PALETTE.vert);
  yield* waitFor(0.4);
  // La coche passe au vert : la barrière tombe, l'onde entre
  sfx('success', 0.8);
  yield* consentIcon().color(PALETTE.vert, 0.4);
  yield* barrier().opacity(0, 0.3);
  sfx('travel', 0.5);
  yield* waveGroup().y(vibeY() - vH() * 0.12, 0.9, easeInOutCubic);
  waveTasks.forEach(task => cancel(task));
  waveTasks = [];
  sfx('activate');
  yield* all(vibeNode().setState('active', 0.3), waveGroup().opacity(0, 0.3));
  yield* waitFor(1);
  sfxFlush('pipeline-vibe');
});
