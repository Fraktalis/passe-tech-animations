import {Rect, Txt, Layout, makeScene2D, Grid} from '@motion-canvas/2d';
import {all, createRef, waitFor, waitUntil, loop, chain, sequence} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
    // --- RÉFÉRENCES ---
    const title = createRef<Txt>();
    const bitCells = Array.from({length: 8}, () => createRef<Rect>());
    const bitTexts = Array.from({length: 8}, () => createRef<Txt>());
    const highLabel = createRef<Txt>();
    const lowLabel = createRef<Txt>();

    const COLORS = {
        bg: "#0D1117",
        cell: "#21262D",
        bitOn: "#58A6FF", // Bleu pour le Low Nibble
        bitOff: "#484F58",
        highlight: "#D29922", // Jaune/Orange pour le High Nibble
        text: "#C9D1D9"
    };

    view.add(
        <Layout>
            <Rect fill={COLORS.bg} width={'100%'} height={'100%'} zIndex={-1} />
            
            {/* Titre de la séquence */}
            <Txt 
                ref={title} 
                y={-350} 
                fontSize={60} 
                fill={COLORS.text} 
                text="Focus : Le décalage de bits (Bitwise Shift)" 
            />

            <Layout y={50}>
                {/* Libellés des Nibbles */}
                <Txt ref={highLabel} text="High Nibble (0x6)" y={-150} x={-200} fill={COLORS.highlight} opacity={0} fontSize={40} />
                <Txt ref={lowLabel} text="Low Nibble (0x3)" y={-150} x={200} fill={COLORS.bitOn} opacity={0} fontSize={40} />

                {/* Grille des 8 bits (l'Octet) */}
                <Layout layout gap={15} justifyContent={'center'}>
                    {bitCells.map((ref, i) => (
                        <Rect
                            key={`${i}`}
                            ref={ref}
                            width={100}
                            height={140}
                            fill={COLORS.cell}
                            radius={15}
                            lineWidth={3}
                            stroke={COLORS.bitOff}
                            justifyContent={'center'}
                            alignItems={'center'}
                        >
                            <Txt ref={bitTexts[i]} text="0" fill={COLORS.bitOff} fontSize={50} fontFamily={'monospace'} />
                        </Rect>
                    ))}
                </Layout>
            </Layout>
        </Layout>
    );

    // --- ANIMATION ---

    yield* waitUntil("startBitShift");

    // 1. ARRIVÉE DU HIGH NIBBLE (0110)
    const highPattern = [0, 1, 1, 0]; 
    yield* all(
        title().text("1. Récupération du premier Nibble (0x6)", 0.5),
        highLabel().opacity(1, 0.5),
        ...highPattern.map((val, i) => {
            const idx = i + 4; // On les place à droite initialement
            bitTexts[idx]().text(val.toString());
            return all(
                bitTexts[idx]().fill(COLORS.highlight, 0.5),
                bitCells[idx]().stroke(COLORS.highlight, 0.5)
            );
        })
    );

    yield* waitFor(1);

    // 2. LE DÉCALAGE ( << 4 )
    yield* sequence(0.1,
        title().text("2. high << 4 : Décalage vers la gauche", 0.5),
        ...highPattern.map((val, i) => {
            return all(
                // Les anciennes cases redeviennent vides (0)
                bitTexts[i + 4]().text("0", 0.3),
                bitTexts[i + 4]().fill(COLORS.bitOff, 0.3),
                bitCells[i + 4]().stroke(COLORS.bitOff, 0.3),
                // Les nouvelles cases à gauche prennent les valeurs
                bitTexts[i]().text(val.toString(), 0.3),
                bitTexts[i]().fill(COLORS.highlight, 0.3),
                bitCells[i]().stroke(COLORS.highlight, 0.3),
            );
        })
    );

    yield* waitFor(1);

    // 3. ARRIVÉE DU LOW NIBBLE (0x3 -> 0011)
    const lowPattern = [0, 0, 1, 1];
    yield* all(
        title().text("3. Fusion avec le Low Nibble (0x3)", 0.5),
        lowLabel().opacity(1, 0.5),
        ...lowPattern.map((val, i) => {
            const idx = i + 4; // Remplit les 4 cases de droite laissées vides
            bitTexts[idx]().text(val.toString());
            return all(
                bitTexts[idx]().fill(COLORS.bitOn, 0.5),
                bitCells[idx]().stroke(COLORS.bitOn, 0.5)
            );
        })
    );

    yield* waitFor(1);
    yield* title().text("Résultat final : 01100011 = 'c'", 0.5);

    yield* waitUntil("endOfScene")
});