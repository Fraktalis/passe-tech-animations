import {Rect, Txt, Layout, Grid, makeScene2D, Line} from '@motion-canvas/2d';
import {all, createRef, easeInCubic, easeOutCubic, createSignal, chain, waitFor, waitUntil, loop} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
    const editorRect = createRef<Rect>();
    const payloadTxt = createRef<Txt>();
    const decodeBox = createRef<Rect>();
    const bitLeft = createRef<Txt>();
    const bitRight = createRef<Txt>();
    const resultChar = createRef<Txt>();
    const title = createRef<Txt>();
    const grid = createRef<Grid>();

    const COLORS = {
        bg: "#0D1117",
        text: "#C9D1D9",
        vsCodeBlue: "#24292E",
        accent: "#58A6FF",
        danger: "#F85149",
        success: "#3FB950",
        ghost: "#484F58"
    };

    view.add(
        <Layout>
            <Rect  fill={COLORS.bg} width={'100%'} height={'100%'} />
            <Grid  ref={grid} end={0}  width={'100%'} height={'100%'} stroke={COLORS.ghost}   />

            <Txt ref={title} y={-400} fontSize={60} fill={COLORS.text} text="Anatomie d'un Payload Invisible" />

            {/* Faux Éditeur VS Code */}
            <Rect ref={editorRect} width={view.width() * 0.8} height={200} fill={COLORS.vsCodeBlue} radius={20} lineWidth={2} stroke={COLORS.ghost} layout padding={40} alignItems={'center'}>
                <Txt text="const payload = " fill={COLORS.accent} fontFamily={'monospace'} />
                <Txt ref={payloadTxt} text='""' fill={COLORS.success} fontFamily={'monospace'} />
                <Txt text=';' fill={COLORS.success} fontFamily={'monospace'} />
            </Rect>

            {/* Zone de Décryptage (Invisible au début) */}
            <Rect ref={decodeBox} y={250} width={800} height={300} opacity={0} layout direction={'column'} alignItems={'center'} gap={40}>
                <Layout gap={100}>
                    <Rect width={200} height={120} fill={COLORS.ghost} radius={10} layout justifyContent={'center'} alignItems={'center'}>
                        <Txt ref={bitLeft} text="0x0" fill={COLORS.text} />
                    </Rect>
                    <Txt text="+" fontSize={80} fill={COLORS.text} />
                    <Rect width={200} height={120} fill={COLORS.ghost} radius={10} layout justifyContent={'center'} alignItems={'center'}>
                        <Txt ref={bitRight} text="0x0" fill={COLORS.text} />
                    </Rect>
                </Layout>
                
                <Line points={[[-50, 0], [50, 0]]} stroke={COLORS.text} lineWidth={4} />
                <Txt ref={resultChar} text="?" fontSize={120} fill={COLORS.accent} fontWeight={700} />
            </Rect>
        </Layout>
    );

    // --- SÉQUENCE D'ANIMATION ---

    yield* waitUntil("start");
    yield* grid().end(1, 0.3);

    // 1. L'ILLUSION
    yield* payloadTxt().text('"  "', 1); // On dirait qu'il n'y a qu'un espace
    yield* title().text("Étape 1 : L'illusion d'une chaîne vide", 0.5);
    yield* waitFor(1);

    // 2. RÉVÉLATION (Zoom sur Unicode)
    yield* all(
        title().text("Étape 2 : Révélation des Variation Selectors", 0.5),
        payloadTxt().text('"\\ufe06\\ufe03..."', 1, easeOutCubic),
        payloadTxt().fill(COLORS.danger, 1),
    );
    yield* waitFor(1);

    // 3. LE MÉCANISME DES NIBBLES
    yield* all(
        decodeBox().opacity(1, 0.5),
        decodeBox().y(300, 0.5),
        title().text("Étape 3 : Décodage des Nibbles (4-bit)", 0.5),
    );

    // Simulation du décodage de la première lettre 'c' (0x63)
    // 0xFE06 -> 6
    // 0xFE03 -> 3
    yield* all(
        bitLeft().text("0x6", 0.5),
        bitLeft().fill(COLORS.danger, 0.5),
    );
    yield* waitFor(0.3);
    yield* all(
        bitRight().text("0x3", 0.5),
        bitRight().fill(COLORS.danger, 0.5),
    );

    yield* waitFor(0.5);

    // Fusion
    yield* all(
        resultChar().text("'c'", 0.5),
        resultChar().scale(1.2, 0.3).to(1, 0.3),
        title().text("6 << 4 | 3 = 0x63 ('c')", 0.5),
    );

    yield* waitFor(1);

    // 4. RÉCONSTRUCTION FINALE
    yield* all(
        decodeBox().opacity(0, 0.5),
        title().text("Payload reconstruit et prêt pour eval()", 0.5),
        payloadTxt().text('"console.log(\'Abonnez-vous !\')" ', 1),
        payloadTxt().fill(COLORS.success, 1),
        editorRect().stroke(COLORS.success, 1),
    );

    yield* waitFor(2);
});