import {makeScene2D} from '@motion-canvas/2d';
import {Circle, Grid, Line, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {all, easeInOutCubic, easeOutCubic, loop, sequence, waitFor, waitUntil} from '@motion-canvas/core';
import {createRef} from '@motion-canvas/core/lib/utils';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const COLORS = {
    bg: '#1B1F23',
    rose: '#e42951',
    blue: '#0099FF',
    green: '#4ADE80',
    orange: '#F59E0B',
    purple: '#A78BFA',
    cream: '#F9F9F6',
    react: '#FF6B6B',
    skillTerminal: '#22C55E',
    skillFilesys: '#60A5FA',
    skillBrowser: '#F472B6',
  };

  // --- Positions (fractions du viewport) ---
  const inputX = () => vW() * -0.35;
  const gatewayX = () => vW() * -0.05;
  const llmX = () => vW() * 0.20;
  const skillsX = () => vW() * 0.42;

  const userY = () => vH() * -0.24;
  const heartbeatY = () => vH() * -0.08;
  const cronY = () => vH() * 0.08;
  const hooksY = () => vH() * 0.24;

  const terminalY = () => vH() * -0.13;
  const filesysY = () => 0;
  const browserY = () => vH() * 0.13;

  const reactY = () => vH() * 0.20;

  // --- Dimensions ---
  const inputW = () => vW() * 0.16;
  const inputH = () => vH() * 0.12;
  const gatewayW = () => vW() * 0.32;
  const gatewayH = () => vH() * 0.24;
  const llmW = () => vW() * 0.14;
  const llmH = () => vH() * 0.16;
  const skillW = () => vW() * 0.12;
  const skillH = () => vH() * 0.09;
  const reactStepW = () => vW() * 0.08;
  const reactStepH = () => vH() * 0.05;

  // --- Refs : Blocs d'entrée ---
  const userRef = createRef<Rect>();
  const heartbeatRef = createRef<Rect>();
  const heartbeatPulseRef = createRef<Circle>();
  const cronRef = createRef<Rect>();
  const hooksRef = createRef<Rect>();

  // --- Refs : Core ---
  const gatewayRef = createRef<Rect>();
  const gatewayFill = createRef<Rect>();
  const llmRef = createRef<Rect>();

  // --- Refs : Boucle ReAct ---
  const reactLabelRef = createRef<Txt>();
  const thoughtRef = createRef<Rect>();
  const actionRef = createRef<Rect>();
  const obsRef = createRef<Rect>();
  const reactArrow1 = createRef<Line>();
  const reactArrow2 = createRef<Line>();
  const reactArrowBack = createRef<Line>();

  // --- Refs : Skills ---
  const terminalRef = createRef<Rect>();
  const filesysRef = createRef<Rect>();
  const browserRef = createRef<Rect>();

  // --- Refs : Lignes connectrices ---
  const lineUserGw = createRef<Line>();
  const lineHbGw = createRef<Line>();
  const lineCronGw = createRef<Line>();
  const lineHooksGw = createRef<Line>();
  const lineGwLlm = createRef<Line>();
  const lineLlmTerminal = createRef<Line>();
  const lineLlmFilesys = createRef<Line>();
  const lineLlmBrowser = createRef<Line>();

  // --- Ref : Grid ---
  const gridRef = createRef<Grid>();

  // --- Ref : Particule de données ---
  const particleRef = createRef<Circle>();

  // --- Coordonnées des bords pour les lignes ---
  const inputRightX = () => inputX() + inputW() / 2;
  const gwLeftX = () => gatewayX() - gatewayW() / 2;
  const gwRightX = () => gatewayX() + gatewayW() / 2;
  const llmLeftX = () => llmX() - llmW() / 2;
  const llmRightX = () => llmX() + llmW() / 2;
  const skillLeftX = () => skillsX() - skillW() / 2;

  // Positions ReAct (3 blocs horizontaux sous le LLM)
  const thoughtX = () => llmX() - vW() * 0.09;
  const actionX = () => llmX();
  const obsX = () => llmX() + vW() * 0.09;

  // ================================================================
  // SCENE
  // ================================================================
  view.add(
    <Rect width="100%" height="100%" fill={COLORS.bg}>

      {/* ====== GRID BACKGROUND ====== */}
      <Grid ref={gridRef} width={'100%'} height={'100%'} opacity={0.5}   stroke={'#6E7681'} lineWidth={2} spacing={80} end={0} />

      {/* ====== BLOCS D'ENTRÉE (gauche) ====== */}

      <Rect ref={userRef} x={inputX} y={userY} opacity={0}>
        <Rect width={inputW} height={inputH} stroke={COLORS.blue} lineWidth={4} radius={20} fill={`${COLORS.blue}15`}>
          <Txt text="USER CHAT" y={() => vH() * -0.015} fill={COLORS.blue} fontFamily="Space Grotesk" fontWeight={800} fontSize={() => vW() * 0.014} />
          <Txt text="WhatsApp, Telegram..." y={() => vH() * 0.02} fill={COLORS.cream} fontFamily="monospace" fontSize={() => vW() * 0.008} opacity={0.6} />
        </Rect>
      </Rect>

      <Rect ref={heartbeatRef} x={inputX} y={heartbeatY} opacity={0}>
        <Rect width={inputW} height={inputH} stroke={COLORS.green} lineWidth={4} radius={20} fill={`${COLORS.green}15`}>
          <Txt text="HEARTBEAT" y={() => vH() * -0.015} fill={COLORS.green} fontFamily="Space Grotesk" fontWeight={800} fontSize={() => vW() * 0.014} />
          <Txt text="Heartbeat.md" y={() => vH() * 0.02} fill={COLORS.cream} fontFamily="monospace" fontSize={() => vW() * 0.008} opacity={0.6} />
        </Rect>
        <Circle ref={heartbeatPulseRef} width={inputW} height={inputH} stroke={COLORS.green} lineWidth={3} opacity={0} />
      </Rect>

      <Rect ref={cronRef} x={inputX} y={cronY} opacity={0}>
        <Rect width={inputW} height={inputH} stroke={COLORS.orange} lineWidth={4} radius={20} fill={`${COLORS.orange}15`}>
          <Txt text="CRON" y={() => vH() * -0.015} fill={COLORS.orange} fontFamily="Space Grotesk" fontWeight={800} fontSize={() => vW() * 0.014} />
          <Txt text="Planificateur" y={() => vH() * 0.02} fill={COLORS.cream} fontFamily="monospace" fontSize={() => vW() * 0.008} opacity={0.6} />
        </Rect>
      </Rect>

      <Rect ref={hooksRef} x={inputX} y={hooksY} opacity={0}>
        <Rect width={inputW} height={inputH} stroke={COLORS.purple} lineWidth={4} radius={20} fill={`${COLORS.purple}15`}>
          <Txt text="HOOKS" y={() => vH() * -0.015} fill={COLORS.purple} fontFamily="Space Grotesk" fontWeight={800} fontSize={() => vW() * 0.014} />
          <Txt text="GitHub, Discord, APIs..." y={() => vH() * 0.02} fill={COLORS.cream} fontFamily="monospace" fontSize={() => vW() * 0.008} opacity={0.6} />
        </Rect>
      </Rect>

      {/* ====== GATEWAY (centre) ====== */}

      <Rect ref={gatewayRef} x={gatewayX} y={0} scale={0}>
        <Rect ref={gatewayFill} width={gatewayW} height={gatewayH} fill={COLORS.rose} radius={28}>
          <Txt text="GATEWAY" y={() => vH() * -0.035} fill={COLORS.cream} fontFamily="Space Grotesk" fontWeight={800} fontSize={() => vW() * 0.022} />
          <Txt text="L'aiguilleur" y={() => vH() * 0.03} fill={COLORS.cream} fontFamily="monospace" fontSize={() => vW() * 0.011} opacity={0.8} />
        </Rect>
      </Rect>

      {/* ====== LLM (centre-droit) ====== */}

      <Rect ref={llmRef} x={llmX} y={0} opacity={0}>
        <Rect width={llmW} height={llmH} stroke={COLORS.cream} lineWidth={4} radius={24} fill={`${COLORS.cream}08`}>
          <Txt text="LLM" y={() => vH() * -0.03} fill={COLORS.cream} fontFamily="Space Grotesk" fontWeight={800} fontSize={() => vW() * 0.02} />
          <Txt text="Le cerveau" y={() => vH() * 0.025} fill={COLORS.cream} fontFamily="monospace" fontSize={() => vW() * 0.01} opacity={0.6} />
        </Rect>
      </Rect>

      {/* ====== BOUCLE ReAct (sous le LLM) ====== */}

      <Txt ref={reactLabelRef} text="Boucle ReAct" x={llmX} y={() => reactY() - vH() * 0.055}
        fill={COLORS.react} fontFamily="Space Grotesk" fontWeight={700} fontSize={() => vW() * 0.013} opacity={0} />

      <Rect ref={thoughtRef} x={thoughtX} y={reactY} opacity={0}>
        <Rect width={reactStepW} height={reactStepH} fill={`${COLORS.react}25`} stroke={COLORS.react} lineWidth={2} radius={12}>
          <Txt text="Thought" fill={COLORS.react} fontFamily="Space Grotesk" fontWeight={700} fontSize={() => vW() * 0.01} />
        </Rect>
      </Rect>

      <Rect ref={actionRef} x={actionX} y={reactY} opacity={0}>
        <Rect width={reactStepW} height={reactStepH} fill={`${COLORS.react}25`} stroke={COLORS.react} lineWidth={2} radius={12}>
          <Txt text="Action" fill={COLORS.react} fontFamily="Space Grotesk" fontWeight={700} fontSize={() => vW() * 0.01} />
        </Rect>
      </Rect>

      <Rect ref={obsRef} x={obsX} y={reactY} opacity={0}>
        <Rect width={reactStepW} height={reactStepH} fill={`${COLORS.react}25`} stroke={COLORS.react} lineWidth={2} radius={12}>
          <Txt text="Observation" fill={COLORS.react} fontFamily="Space Grotesk" fontWeight={700} fontSize={() => vW() * 0.01} />
        </Rect>
      </Rect>

      {/* Flèches ReAct : Thought → Action → Observation, retour en arc */}
      <Line ref={reactArrow1}
        points={() => [[thoughtX() + reactStepW() / 2, reactY()], [actionX() - reactStepW() / 2, reactY()]]}
        stroke={COLORS.react} lineWidth={3} endArrow arrowSize={12} end={0} />
      <Line ref={reactArrow2}
        points={() => [[actionX() + reactStepW() / 2, reactY()], [obsX() - reactStepW() / 2, reactY()]]}
        stroke={COLORS.react} lineWidth={3} endArrow arrowSize={12} end={0} />
      <Line ref={reactArrowBack}
        points={() => [
          [obsX(), reactY() + reactStepH() / 2 + 5],
          [actionX(), reactY() + vH() * 0.04],
          [thoughtX(), reactY() + reactStepH() / 2 + 5],
        ]}
        stroke={COLORS.react} lineWidth={2} endArrow arrowSize={10} lineDash={[8, 4]} end={0} />

      {/* ====== SKILLS (droite) ====== */}

      <Rect ref={terminalRef} x={skillsX} y={terminalY} opacity={0}>
        <Rect width={skillW} height={skillH} fill={COLORS.skillTerminal} radius={16}>
          <Txt text="Terminal" y={() => vH() * -0.012} fill={'#052E16'} fontFamily="Space Grotesk" fontWeight={700} fontSize={() => vW() * 0.012} />
          <Txt text="Shell / CLI" y={() => vH() * 0.018} fill={'#052E16'} fontFamily="monospace" fontSize={() => vW() * 0.008} opacity={0.7} />
        </Rect>
      </Rect>

      <Rect ref={filesysRef} x={skillsX} y={filesysY} opacity={0}>
        <Rect width={skillW} height={skillH} fill={COLORS.skillFilesys} radius={16}>
          <Txt text="Filesystem" y={() => vH() * -0.012} fill={'#020617'} fontFamily="Space Grotesk" fontWeight={700} fontSize={() => vW() * 0.012} />
          <Txt text="Fichiers" y={() => vH() * 0.018} fill={'#020617'} fontFamily="monospace" fontSize={() => vW() * 0.008} opacity={0.7} />
        </Rect>
      </Rect>

      <Rect ref={browserRef} x={skillsX} y={browserY} opacity={0}>
        <Rect width={skillW} height={skillH} fill={COLORS.skillBrowser} radius={16}>
          <Txt text="Browser" y={() => vH() * -0.012} fill={'#1B1F23'} fontFamily="Space Grotesk" fontWeight={700} fontSize={() => vW() * 0.012} />
          <Txt text="Playwright" y={() => vH() * 0.018} fill={'#1B1F23'} fontFamily="monospace" fontSize={() => vW() * 0.008} opacity={0.7} />
        </Rect>
      </Rect>

      {/* ====== LIGNES CONNECTRICES ====== */}

      {/* Entrées → Gateway (convergent sur le bord gauche) */}
      <Line ref={lineUserGw}
        points={() => [[inputRightX(), userY()], [gwLeftX(), vH() * -0.06]]}
        stroke={COLORS.blue} lineWidth={3} endArrow arrowSize={14} end={0} />
      <Line ref={lineHbGw}
        points={() => [[inputRightX(), heartbeatY()], [gwLeftX(), vH() * -0.02]]}
        stroke={COLORS.green} lineWidth={3} endArrow arrowSize={14} end={0} />
      <Line ref={lineCronGw}
        points={() => [[inputRightX(), cronY()], [gwLeftX(), vH() * 0.02]]}
        stroke={COLORS.orange} lineWidth={3} endArrow arrowSize={14} end={0} />
      <Line ref={lineHooksGw}
        points={() => [[inputRightX(), hooksY()], [gwLeftX(), vH() * 0.06]]}
        stroke={COLORS.purple} lineWidth={3} endArrow arrowSize={14} end={0} />

      {/* Gateway → LLM */}
      <Line ref={lineGwLlm}
        points={() => [[gwRightX(), 0], [llmLeftX(), 0]]}
        stroke={COLORS.cream} lineWidth={4} endArrow arrowSize={16} end={0} />

      {/* LLM → Skills */}
      <Line ref={lineLlmTerminal}
        points={() => [[llmRightX(), vH() * -0.03], [skillLeftX(), terminalY()]]}
        stroke={COLORS.skillTerminal} lineWidth={3} endArrow arrowSize={12} end={0} />
      <Line ref={lineLlmFilesys}
        points={() => [[llmRightX(), 0], [skillLeftX(), filesysY()]]}
        stroke={COLORS.skillFilesys} lineWidth={3} endArrow arrowSize={12} end={0} />
      <Line ref={lineLlmBrowser}
        points={() => [[llmRightX(), vH() * 0.03], [skillLeftX(), browserY()]]}
        stroke={COLORS.skillBrowser} lineWidth={3} endArrow arrowSize={12} end={0} />

      {/* ====== PARTICULE ====== */}
      <Circle ref={particleRef}
        width={() => vW() * 0.015} height={() => vW() * 0.015}
        fill={COLORS.cream} opacity={0} zIndex={100} />

    </Rect>
  );

  // ================================================================
  // ANIMATION
  // ================================================================

  // --- 0. Grid d'arrière-plan ---
  yield* gridRef().end(1, 1);

  // --- 1. La Gateway apparaît ---
  yield* waitUntil('showGateway');
  yield* gatewayRef().scale(1, 0.6, easeOutCubic);

  // --- 2. User Chat ---
  yield* waitUntil('showUserChat');
  yield* all(
    userRef().opacity(1, 0.5),
    lineUserGw().end(1, 0.7),
  );

  // --- 3. Heartbeat ---
  yield* waitUntil('showHeartbeat');
  yield* all(
    heartbeatRef().opacity(1, 0.5),
    lineHbGw().end(1, 0.7),
  );
  // Animation de pulsation cardiaque
  yield* heartbeatPulseRef().opacity(0.8, 0.1);
  yield* loop(3, function* () {
    heartbeatPulseRef().opacity(0.7);
    heartbeatPulseRef().scale(1);
    yield* all(
      heartbeatPulseRef().scale(1.5, 0.5),
      heartbeatPulseRef().opacity(0, 0.5),
    );
  });

  // --- 4. Cron ---
  yield* waitUntil('showCron');
  yield* all(
    cronRef().opacity(1, 0.5),
    lineCronGw().end(1, 0.7),
  );

  // --- 5. Hooks ---
  yield* waitUntil('showHooks');
  yield* all(
    hooksRef().opacity(1, 0.5),
    lineHooksGw().end(1, 0.7),
  );
  // Flash réactif
  yield* hooksRef().scale(1.08, 0.1).to(1, 0.15);

  // --- 6. Flux : User → Gateway ---
  yield* waitUntil('flowUserToGateway');
  particleRef().position(userRef().position());
  particleRef().fill(COLORS.blue);
  yield* particleRef().opacity(1, 0.15);
  yield* particleRef().position(gatewayRef().position(), 0.6, easeInOutCubic);
  yield* all(
    gatewayRef().scale(1.05, 0.1).to(1, 0.15),
    particleRef().opacity(0, 0.15),
  );

  // --- 7. Flux : Heartbeat → Gateway ---
  yield* waitUntil('flowHeartbeatToGateway');
  particleRef().position(heartbeatRef().position());
  particleRef().fill(COLORS.green);
  yield* particleRef().opacity(1, 0.15);
  yield* particleRef().position(gatewayRef().position(), 0.6, easeInOutCubic);
  yield* all(
    gatewayFill().fill(COLORS.green, 0.15).to(COLORS.rose, 0.4),
    particleRef().opacity(0, 0.15),
  );

  // --- 8. Le LLM apparaît ---
  yield* waitUntil('showLLM');
  yield* all(
    llmRef().opacity(1, 0.5),
    lineGwLlm().end(1, 0.7),
  );

  // --- 9. Boucle ReAct ---
  yield* waitUntil('showReActLoop');
  yield* reactLabelRef().opacity(1, 0.3);
  yield* sequence(0.2,
    thoughtRef().opacity(1, 0.3),
    actionRef().opacity(1, 0.3),
    obsRef().opacity(1, 0.3),
  );
  yield* sequence(0.15,
    reactArrow1().end(1, 0.3),
    reactArrow2().end(1, 0.3),
    reactArrowBack().end(1, 0.4),
  );
  // Cycle highlight : la lumière parcourt Thought → Action → Observation (x2)
  for (let i = 0; i < 2; i++) {
    yield* all(
      thoughtRef().opacity(1, 0.2),
      actionRef().opacity(0.3, 0.2),
      obsRef().opacity(0.3, 0.2),
    );
    yield* waitFor(0.25);
    yield* all(
      thoughtRef().opacity(0.3, 0.2),
      actionRef().opacity(1, 0.2),
    );
    yield* waitFor(0.25);
    yield* all(
      actionRef().opacity(0.3, 0.2),
      obsRef().opacity(1, 0.2),
    );
    yield* waitFor(0.25);
  }
  // Reset opacités
  yield* all(
    thoughtRef().opacity(1, 0.2),
    actionRef().opacity(1, 0.2),
    obsRef().opacity(1, 0.2),
  );

  // --- 10. Skills ---
  yield* waitUntil('showSkills');
  yield* sequence(0.25,
    all(terminalRef().opacity(1, 0.4), lineLlmTerminal().end(1, 0.5)),
    all(filesysRef().opacity(1, 0.4), lineLlmFilesys().end(1, 0.5)),
    all(browserRef().opacity(1, 0.4), lineLlmBrowser().end(1, 0.5)),
  );

  // --- 11. Démo du flux complet ---
  yield* waitUntil('flowFullDemo');

  // User → Gateway → LLM
  particleRef().fill(COLORS.cream);
  particleRef().position(userRef().position());
  yield* particleRef().opacity(1, 0.15);
  yield* particleRef().position(gatewayRef().position(), 0.5, easeInOutCubic);
  yield* gatewayRef().scale(1.03, 0.08).to(1, 0.1);
  yield* particleRef().position(llmRef().position(), 0.5, easeInOutCubic);
  yield* particleRef().opacity(0, 0.1);

  // Cycle ReAct 1 : Thought → Action → Terminal → Observation
  yield* all(
    thoughtRef().opacity(1, 0.15),
    actionRef().opacity(0.3, 0.15),
    obsRef().opacity(0.3, 0.15),
  );
  yield* waitFor(0.3);
  yield* all(
    thoughtRef().opacity(0.3, 0.15),
    actionRef().opacity(1, 0.15),
  );
  particleRef().fill(COLORS.react);
  particleRef().position(llmRef().position());
  yield* particleRef().opacity(1, 0.1);
  yield* particleRef().position(terminalRef().position(), 0.4, easeInOutCubic);
  yield* terminalRef().scale(1.08, 0.1).to(1, 0.1);
  yield* particleRef().position(llmRef().position(), 0.4, easeInOutCubic);
  yield* all(
    actionRef().opacity(0.3, 0.15),
    obsRef().opacity(1, 0.15),
  );
  yield* waitFor(0.2);

  // Cycle ReAct 2 : Thought → Action → Filesystem → Observation
  yield* all(
    obsRef().opacity(0.3, 0.15),
    thoughtRef().opacity(1, 0.15),
  );
  yield* waitFor(0.2);
  yield* all(
    thoughtRef().opacity(0.3, 0.15),
    actionRef().opacity(1, 0.15),
  );
  yield* particleRef().position(filesysRef().position(), 0.4, easeInOutCubic);
  yield* filesysRef().scale(1.08, 0.1).to(1, 0.1);
  yield* particleRef().position(llmRef().position(), 0.4, easeInOutCubic);
  yield* all(
    actionRef().opacity(0.3, 0.15),
    obsRef().opacity(1, 0.15),
  );
  yield* waitFor(0.2);

  // Reset ReAct
  yield* all(
    thoughtRef().opacity(1, 0.2),
    actionRef().opacity(1, 0.2),
    obsRef().opacity(1, 0.2),
  );

  // Réponse finale : LLM → Gateway → User
  particleRef().fill(COLORS.cream);
  yield* particleRef().position(gatewayRef().position(), 0.4, easeInOutCubic);
  yield* particleRef().position(userRef().position(), 0.5, easeInOutCubic);
  yield* all(
    particleRef().opacity(0, 0.2),
    userRef().scale(1.05, 0.15).to(1, 0.15),
  );

  // --- 12. Fin ---
  yield* waitUntil('endScene');
  yield* waitFor(1);
});
