import { Circle, Grid, Layout, Line, makeScene2D, Rect, Txt, SVG } from '@motion-canvas/2d';
import { all, createRef, easeInCubic, easeOutCubic, sequence, chain, waitFor, waitUntil, createSignal } from '@motion-canvas/core';

export default makeScene2D(function* (view) {
    const grid = createRef<Grid>();
    const llmCircle = createRef<Circle>();
    const websiteRect = createRef<Rect>();
    const llmsFileRect = createRef<Rect>();
    const container = createRef<Layout>();

    // Couleurs de ton charte
    const COLORS = {
        bg: "#1B1F23",
        grid: "#6E7681",
        green: "#2F9E44",
        red: "#FF4F64",
        white: "#F9F9F6"
    };

    view.add(
        <Layout ref={container}>
            <Grid
                ref={grid}
                width={'100%'}
                height={'100%'}
                stroke={COLORS.grid}
                lineWidth={2}
                spacing={80}
                end={0}
                opacity={1}
            />

            <Rect fill={COLORS.bg} width={'100%'} height={'100%'} zIndex={-1} />

            {/* Agent LLM au centre */}
            <Circle
                ref={llmCircle}
                width={2*view.width() / 16} height={2*view.height() / 9}
                stroke={COLORS.white}
                lineWidth={8}
                fill={COLORS.bg}
                zIndex={10}
                scale={0}
            >
                <Txt fontFamily="monospace"text="LLM" fill={COLORS.white} fontSize={200} fontWeight={1200} />
            </Circle>

            {/* Source 1: Site Web Classique */}
            <Rect
                ref={websiteRect}
                position={[-1500, 0]}
                opacity={0}
                fill="#0D1117"
                width={view.width() / 4} height={view.height() / 2}
                stroke={COLORS.red}
                lineWidth={4}
                radius={20}
                clip // Pour que le contenu ne dépasse pas
                layout // Active le mode Flexbox
                direction={'column'}
                padding={0}
  
                alignItems={'start'}
                gap={0}
            >
                {/* Header du fichier */}
                <Txt fontFamily="monospace"text="Website.html" scale={0.8} fill={COLORS.red} marginBottom={10} />

                <Txt fontFamily="monospace"text="<header>...</header>" fontSize={30}  fill={COLORS.grid} />
                <Txt fontFamily="monospace"text="<body>" fill={COLORS.grid} fontSize={30} />
                <Txt fontFamily="monospace"text="‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ <nav> [ Link ] [ Link ] </nav>" fill={COLORS.grid}  fontSize={30}/>
                <Layout direction={'row'} gap={0} alignItems={'start'}>
                    <Txt fontFamily="monospace"text="‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ <img " fill={COLORS.grid} fontSize={30} />
                    <Rect width={60} height={40} fill={COLORS.grid} opacity={0.3} radius={4}>
                        <Line points={[[-10, -10], [10, 10]]} stroke={COLORS.grid} lineWidth={2} />
                        <Line points={[[10, -10], [-10, 10]]} stroke={COLORS.grid} lineWidth={2} />
                    </Rect>
                    <Txt fontFamily="monospace"text=" />"  fill={COLORS.grid} fontSize={30} />
                </Layout>
                <Txt fontFamily="monospace"text="
              
                
                ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ..." fontSize={100} fill={COLORS.grid} />
                <Txt fontFamily="monospace"text="
                
                
                
                
                
                
                </body>" fontSize={30} fill={COLORS.grid} />
            </Rect>

            {/* Source 2: llms.txt */}
            <Rect
                ref={llmsFileRect}
                fill="#0D1117"
                position={[1500, 0]}
                width={view.width() / 4} height={view.height() / 2}
                stroke={COLORS.green}
                lineWidth={4}
                radius={20}
                opacity={0}
                layout
                direction={"column"}
                gap={0}
            >
                <Txt fontFamily="monospace"text="/llms.txt" scale={1} y={-100} fill={COLORS.green} />
                <Txt fontFamily="monospace"
                text="
# Nimbus Framework

> Nimbus est une fausse bibliothèque ultra-légère de mise en cache distribuée conçue pour les microservices.

## Core Concepts

- **Cell**: L'unité de stockage atomique (TTL par défaut : 3600s).
- **Pulse**: Le mécanisme de synchronisation entre les nœuds.
- **Backbone**: L'adaptateur de transport (Redis, In-Memory, ou gRPC).

## Installation

```bash
npm install @nimbus/core
```

## Quick Usage

```TypeScript
import { Nimbus } from '@nimbus/core';
const cache = new Nimbus({ strategy: 'lru', size: 1024 });
await cache.set('key', 'value');
```

## Secondary Resources

[Full Documentation]: Contient l'intégralité des spécifications API.

[Architecture Guide]: Détails sur le protocole de synchronisation Pulse.

[Security Policy]: Guide sur le chiffrement des données au repos.

## API Reference Shortcuts

`cache.set(key, value, options?)`: Stocke une valeur.

`cache.get(key)`: Récupère une valeur.

`cache.sync()`: Force la synchronisation avec le Backbone.

                " fontSize={16} fill={COLORS.green} />
                <Txt fontFamily="monospace"text="" scale={0.4} fill={COLORS.green} />
                <Txt fontFamily="monospace"text="" scale={0.4} fill={COLORS.green} />
            </Rect>
        </Layout>
    );


    // 1. Création du signal pour animer le nombre
    const tokenCount = createSignal(0);
    const tokenTxt = createRef<Txt>();





    yield* grid().end(1, 1);

    yield* waitUntil("startWebsite")
    // 1. Initialisation Grid
    yield* all(
        
        llmCircle().scale(0, 0).to(1, 0.6, easeOutCubic),
        websiteRect().opacity(1, 0.5),
        websiteRect().position([-1200, 0], 0.5),
    );

        view.add(
  <Layout position={[0, 450]} layout direction={'row'} alignItems={'center'} gap={20}>
    <Txt 
      text="CONTEXT SIZE:" 
      fill={COLORS.grid} 
      fontFamily={'JetBrains Mono, monospace'} 
      fontSize={50} 
    />
    <Txt 
      ref={tokenTxt}
      // Le texte se met à jour automatiquement quand le signal change
      text={() => `${Math.floor(tokenCount()).toLocaleString()} tokens`} 
      fill={COLORS.white} 
      fontFamily={'JetBrains Mono, monospace'}
      fontWeight={700}
       
    />
  </Layout>
);

    // 2. Scénario "Bruit" : Le site web sature l'IA
    const noiseDots: Circle[] = [];
    for (let i = 0; i < 12; i++) {
        const dot = (<Circle width={50} height={50} fill={COLORS.red} position={[websiteRect().x() + websiteRect().width() / 2, 0]} />) as Circle;
        noiseDots.push(dot);
        container().add(dot);
    }

    yield* all(
        sequence(0.20, ...noiseDots.map(dot =>
            chain(
                dot.position([-100, Math.random() * 100 - 50], 0.5, easeInCubic),
                all(dot.scale(0, 0.2), llmCircle().stroke(COLORS.red, 0.1).to(COLORS.white, 0.1), )
            )
        )),
    tokenCount(18000, 2.4),
    tokenTxt().fill(COLORS.red, 2.4)
    );

    yield* waitUntil("endWebsite")

    yield* websiteRect().opacity(0.3, 0.5); // On grise le mauvais élève

    // 3. Apparition du llms.txt
    yield* all(
        llmsFileRect().opacity(1, 0.5),
        llmsFileRect().position([1000, 0], 0.5),
    );

    // 4. Scénario "Efficacité" : Flux propre
    const cleanDots: Circle[] = [];
    for (let i = 0; i < 5; i++) {
        const dot = (<Circle width={50} height={50} fill={COLORS.green} position={[llmsFileRect().x() - llmsFileRect().width() / 2, 0]} />) as Circle;
        cleanDots.push(dot);
        container().add(dot);
    }

    yield* all(sequence(0.30, ...cleanDots.map(dot =>
        all(
            dot.position([0, 0], 0.6, easeOutCubic),
            dot.scale(0, 0.8),
            llmCircle().fill(COLORS.green, 0.2).to(COLORS.bg, 0.4)
        )
    )),
    tokenCount(450, 1.5),
    tokenTxt().fill(COLORS.green, 1.5)
);

    // Conclusion : L'IA est "boostée"
    yield* all(
        llmCircle().scale(1.2, 0.3).to(1, 0.3),
        llmCircle().stroke(COLORS.green, 0.3),
        llmsFileRect().scale(1.1, 0.3).to(1, 0.3),
    );

    yield* waitFor(3);
});