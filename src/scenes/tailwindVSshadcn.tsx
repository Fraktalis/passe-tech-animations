import {Circle, Grid, Layout, Line, makeScene2D, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeInCubic, easeOutCubic, sequence, createSignal, chain, waitFor, loop, waitUntil} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
    const grid = createRef<Grid>();
    const nodeModules = createRef<Rect>();
    const myProject = createRef<Rect>();
    const componentCode = createRef<Rect>();
    const terminalText = createRef<Txt>();
    const terminalCursor = createRef<Rect>();
    const title = createRef<Txt>();

    const COLORS = {
        bg: "#1B1F23",
        grid: "#6E7681",
        green: "#2F9E44",
        red: "#FF4F64",
        white: "#F9F9F6",
        blue: "#3B82F6",
        terminal: "#0D1117"
    };

    view.add(
        <Layout>

            <Grid ref={grid} width={'100%'} height={'100%'} stroke={COLORS.grid} opacity={0.2} />
            <Rect fill={COLORS.bg} width={'100%'} height={'100%'} zIndex={-1} />

            <Txt ref={title} fontSize={80} text="Standard : Composant installé comme une boite noire" y={-450} fill={COLORS.white} />

            {/* Zone node_modules */}
            <Rect ref={nodeModules} x={-800} width={view.width() / 4} height={view.height() / 4} stroke={COLORS.red} lineWidth={4} radius={20} layout direction={'column'} padding={20} alignItems={'center'}>
                <Txt text="node_modules"  fill={COLORS.red} marginBottom={20} />
                {/* Le Composant */}
                <Rect scale={0} ref={componentCode} width={view.width() / 10} height={view.height() / 10} fill={COLORS.blue} radius={10} zIndex={100} layout justifyContent={'center'}  alignItems={'center'}>
                    <Txt text="Button.tsx"  fill={COLORS.white} fontWeight={700} />
                </Rect>

            </Rect>

            {/* Zone Mon Projet */}
            <Rect ref={myProject} x={800} width={view.width() / 4} height={view.height() / 4} stroke={COLORS.green} lineWidth={4} radius={20} layout direction={'column'} padding={20} alignItems={'center'}>
                <Txt text="src/components"   fill={COLORS.green} marginBottom={20} />
            </Rect>


            {/* TERMINAL CLI */}
            <Rect 
                y={350}
                width={view.width() / 3}
                height={80}
                fill={COLORS.terminal}
                radius={10}
                stroke={COLORS.grid}
                lineWidth={2}
                layout
                padding={20}
                alignItems={'center'}
                gap={10}
            >
                <Txt text="$" fill={COLORS.green} scale={0.6} />
                <Txt ref={terminalText} text="" fill={COLORS.white} scale={1} fontFamily={'monospace'} />
                <Rect ref={terminalCursor} width={15} height={30} fill={COLORS.white} />
            </Rect>
        </Layout>
    );

    // --- LOGIQUE ANIMATION ---

    


    // 1. État Initial
    componentCode().position([-400, 0]); 
    
    // Curseur clignotant (boucle infinie en parallèle)
    const cursorBlink = yield loop(() => 
        chain(terminalCursor().opacity(0, 0.4), terminalCursor().opacity(1, 0.4))
    );

    yield* waitUntil("startNpmInstall")

        // 2. Saisie de la commande
    const firstCommand = "npm install button@latest";
    for (let i = 0; i <= firstCommand.length; i++) {
        yield* terminalText().text(firstCommand .substring(0, i), 0.05);
    }

    yield* waitFor(1);

    yield* componentCode().scale(1.1, 1, easeOutCubic).to(1, 0.5);


    yield* waitUntil("endNpmInstall")

       yield* waitUntil("startCopyPaste")

    // 2. Saisie de la commande
    const command = "npx shadcn-ui@latest add button";
    for (let i = 0; i <= command.length; i++) {
        yield* terminalText().text(command.substring(0, i), 0.05);
    }

    yield* waitFor(0.5);

    yield* componentCode().reparent(myProject());

    // 3. TRANSFERT (L'effet Shadcn)
    yield* all(
        title().text("Shadcn : Découplage du dossier node_modules", 0.5),
        // Le composant quitte node_modules
        componentCode().position([400, 0], 1.2, easeOutCubic),
        // Changement de style visuel pour marquer l'appartenance
        componentCode().fill(COLORS.green, 0.8),
        nodeModules().opacity(0.3, 0.8),
    );

    // 4. MODIFICATION DU CODE (Preuve d'ownership)
    yield* all(
        title().text("Contrôle total : Tu peux modifier le code source directement !", 0.5),
        componentCode().scale(1.1, 0.3).to(1, 0.3),
        // On simule une modification graphique du composant
        componentCode().radius(100, 0.5), 
        componentCode().stroke(COLORS.white, 0.5),
        componentCode().lineWidth(4, 0.5)
    );

    yield* waitFor(2);
});