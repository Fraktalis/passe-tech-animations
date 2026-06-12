/**
 * @file tokenisation.tsx
 * @description Vidéo 1 LLM — Chapitre 3 « Découper le langage ».
 *
 * Show, don't tell : on ne dit pas « le modèle découpe en fragments », on le MONTRE.
 *   1. "ChatGPT"  → [Chat][GPT]            (2 tokens) — un mot familier éclate.
 *   2. variabilité → "tokenisation" = 2,    "Anticonstitutionnellement" = 5.
 *      Le compte de tokens ≠ le nombre de lettres. Ni par mot, ni par lettre.
 *   3. BPE — comment le vocabulaire se construit : fusion des paires fréquentes → "tion".
 *   4. Payoff "strawberry" → [straw][berry]. Les 3 « r » se font avaler par les
 *      fragments (1 dans "straw", 2 dans "berry"). Le modèle voit des morceaux,
 *      pas des lettres → il répond « 2 ».
 *
 * Découpages conformes au tokenizer o200k (GPT-4o / o1 / GPT-5.x).
 *
 * Couleur : une teinte distincte par token (cycle cyan/jaune/vert/bleu/ambre).
 * Le ROSE est gardé hors-cycle — réservé aux 3 « r » et à la mauvaise réponse.
 */

import {makeScene2D, Grid, Layout, Rect, Txt} from '@motion-canvas/2d';
import {
  all, sequence, waitFor, waitUntil, createRef, easeOutBack, easeOutCubic, easeInCubic,
} from '@motion-canvas/core';
import {Slot, SlotGroup, Callout} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const MONO = 'JetBrains Mono, DM Mono, monospace';
  const SANS = 'Space Grotesk';

  // une couleur par token — rose volontairement absent (réservé à l'erreur)
  const TOKEN_COLORS = [PALETTE.cyan, PALETTE.jaune, PALETTE.vert, PALETTE.blue, PALETTE.amber];

  const slotW = (frag: string) => () => vW() * (0.016 * frag.length + 0.03);
  const slotH = () => vH() * 0.16;

  // ── Refs : décor ─────────────────────────────────────────────────────────
  const gridRef     = createRef<Grid>();
  const topLabelRef = createRef<Txt>();

  // ── Refs : Phase 1 — ChatGPT ─────────────────────────────────────────────
  const p1GroupRef = createRef<Layout>();
  const p1WordRef  = createRef<Txt>();
  const p1RowRef   = createRef<SlotGroup>();
  const p1Slots    = ['Chat', 'GPT'].map(() => createRef<Slot>());
  const p1CountRef = createRef<Txt>();

  // ── Refs : Phase 2 — variabilité ─────────────────────────────────────────
  const p2GroupRef = createRef<Layout>();
  const p2WordRef  = createRef<Txt>();
  const tokRowRef  = createRef<SlotGroup>();
  const tokSlots   = ['token', 'isation'].map(() => createRef<Slot>());
  const antiRowRef = createRef<SlotGroup>();
  const antiFrags  = ['Ant', 'icon', 'stitution', 'nel', 'lement'];
  const antiSlots  = antiFrags.map(() => createRef<Slot>());
  const p2CountRef = createRef<Txt>();

  // ── Refs : Phase 3 — BPE ─────────────────────────────────────────────────
  const p3GroupRef = createRef<Layout>();
  const bpeCorpus  = createRef<Txt>();
  const bpeChars   = ['t', 'i', 'o', 'n'].map(() => createRef<Slot>());
  const bpeMerged  = createRef<Slot>();
  const bpeCallout = createRef<Callout>();

  // ── Refs : Phase 4 — strawberry ──────────────────────────────────────────
  const p4GroupRef   = createRef<Layout>();
  const strawLetters = 'strawberry'.split('').map(() => createRef<Txt>());
  const strawRowRef  = createRef<SlotGroup>();
  const strawFrags   = ['straw', 'berry'];
  const strawSlots   = strawFrags.map(() => createRef<Slot>());
  const humanCountRef  = createRef<Txt>();
  const questionRef    = createRef<Txt>();
  const modelAnswerRef = createRef<Txt>();

  // ── Refs : Phase 5 — thèse ───────────────────────────────────────────────
  const thesisRef = createRef<Txt>();

  // index des « r » dans "strawberry" : s t r a w b e r r y → 2, 7, 8
  const rIndices = [2, 7, 8];
  const letterSpacing = () => vW() * 0.032;

  // helper : pop d'un slot (scale + opacity) — robuste en flex child
  const popSlot = (ref: () => Slot) =>
    all(ref().opacity(1, 0.3), ref().scale(1, 0.3, easeOutBack));

  // ════════════════════════════════════════════════════════════════════════
  // SCENE TREE
  // ════════════════════════════════════════════════════════════════════════
  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>
      <Rect key="bg" width={'100%'} height={'100%'} fill={PALETTE.bg} zIndex={-2} />
      <Grid key="grid" ref={gridRef}
        width={'100%'} height={'100%'}
        spacing={() => vW() * 0.05}
        stroke={PALETTE.ghost} lineWidth={1} opacity={0} zIndex={-1} />

      <Txt key="top-label" ref={topLabelRef}
        text="TOKENISATION"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.014}
        fontFamily={MONO} fontWeight={700}
        y={() => vH() * -0.42}
        opacity={0} />

      {/* ── Phase 1 — ChatGPT ─────────────────────────────────────────────── */}
      <Layout key="p1" ref={p1GroupRef} opacity={0}>
        <Txt key="p1-word" ref={p1WordRef}
          text="ChatGPT"
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.07}
          fontFamily={MONO} fontWeight={700}
          y={() => vH() * -0.13} />

        <SlotGroup key="p1-row" ref={p1RowRef}
          color={PALETTE.ghost}
          width={() => vW() * 0.5} height={() => vH() * 0.2}
          gap={() => vW() * 0.012}
          y={() => vH() * 0.05}
          opacity={0}>
          {['Chat', 'GPT'].map((frag, i) => (
            <Slot key={`p1-slot-${i}`} ref={p1Slots[i]}
              index={i} content={frag} color={TOKEN_COLORS[i]} initialState="active"
              width={slotW(frag)} height={slotH}
              opacity={0} scale={0.6} />
          ))}
        </SlotGroup>

        <Txt key="p1-count" ref={p1CountRef}
          text="1 mot · 2 tokens"
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.022}
          fontFamily={MONO} fontWeight={700}
          y={() => vH() * 0.3}
          opacity={0} />
      </Layout>

      {/* ── Phase 2 — variabilité ─────────────────────────────────────────── */}
      <Layout key="p2" ref={p2GroupRef} opacity={0}>
        <Txt key="p2-word" ref={p2WordRef}
          text="tokenisation"
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.06}
          fontFamily={MONO} fontWeight={700}
          y={() => vH() * -0.13} />

        {/* "tokenisation" → 2 tokens */}
        <SlotGroup key="tok-row" ref={tokRowRef}
          color={PALETTE.ghost}
          width={() => vW() * 0.5} height={() => vH() * 0.2}
          gap={() => vW() * 0.012}
          y={() => vH() * 0.05}
          opacity={0}>
          {['token', 'isation'].map((frag, i) => (
            <Slot key={`tok-slot-${i}`} ref={tokSlots[i]}
              index={i} content={frag} color={TOKEN_COLORS[i]} initialState="active"
              width={slotW(frag)} height={slotH}
              opacity={0} scale={0.6} />
          ))}
        </SlotGroup>

        {/* "Anticonstitutionnellement" → 5 tokens */}
        <SlotGroup key="anti-row" ref={antiRowRef}
          color={PALETTE.ghost}
          width={() => vW() * 0.92} height={() => vH() * 0.2}
          gap={() => vW() * 0.01}
          y={() => vH() * 0.05}
          opacity={0}>
          {antiFrags.map((frag, i) => (
            <Slot key={`anti-slot-${i}`} ref={antiSlots[i]}
              index={i} content={frag} color={TOKEN_COLORS[i]} initialState="active"
              width={slotW(frag)} height={slotH}
              opacity={0} scale={0.6} />
          ))}
        </SlotGroup>

        <Txt key="p2-count" ref={p2CountRef}
          text=""
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.022}
          fontFamily={MONO} fontWeight={700}
          y={() => vH() * 0.3}
          opacity={0} />
      </Layout>

      {/* ── Phase 3 — BPE ─────────────────────────────────────────────────── */}
      <Layout key="p3" ref={p3GroupRef} opacity={0}>
        <Txt key="bpe-corpus" ref={bpeCorpus}
          text="ac·tion   informa·tion   édu·ca·tion"
          fill={PALETTE.secondary}
          fontSize={() => vW() * 0.026}
          fontFamily={MONO}
          y={() => vH() * -0.22}
          opacity={0} />

        {['t', 'i', 'o', 'n'].map((ch, i) => (
          <Slot key={`bpe-char-${i}`} ref={bpeChars[i]}
            index={i} content={ch} color={PALETTE.secondary} initialState="filled"
            width={() => vW() * 0.05} height={() => vH() * 0.14}
            x={() => vW() * (i - 1.5) * 0.058}
            y={() => vH() * 0.02}
            opacity={0} />
        ))}

        <Slot key="bpe-merged" ref={bpeMerged}
          index={0} content="tion" color={PALETTE.cyan} initialState="active"
          width={() => vW() * 0.11} height={() => vH() * 0.15}
          x={0} y={() => vH() * 0.02}
          opacity={0} />

        <Callout key="bpe-callout" ref={bpeCallout}
          title="Byte Pair Encoding"
          body="fusionne les paires fréquentes"
          color={PALETTE.cyan}
          width={() => vW() * 0.26} height={() => vH() * 0.12}
          x={() => vW() * 0.28} y={() => vH() * 0.24}
          opacity={0} />
      </Layout>

      {/* ── Phase 4 — strawberry ──────────────────────────────────────────── */}
      <Layout key="p4" ref={p4GroupRef} opacity={0}>
        {'strawberry'.split('').map((ch, i) => (
          <Txt key={`straw-letter-${i}`} ref={strawLetters[i]}
            text={ch}
            fill={PALETTE.cream}
            fontSize={() => vW() * 0.06}
            fontFamily={MONO} fontWeight={700}
            x={() => (i - 4.5) * letterSpacing()}
            y={() => vH() * -0.05}
            opacity={0} />
        ))}

        {/* tokens [straw][berry] — révélés quand les lettres se font avaler */}
        <SlotGroup key="straw-row" ref={strawRowRef}
          color={PALETTE.ghost}
          width={() => vW() * 0.5} height={() => vH() * 0.2}
          gap={() => vW() * 0.012}
          y={() => vH() * -0.05}
          opacity={0}>
          {strawFrags.map((frag, i) => (
            <Slot key={`straw-slot-${i}`} ref={strawSlots[i]}
              index={i} content={frag} color={TOKEN_COLORS[i]} initialState="active"
              width={slotW(frag)} height={slotH} />
          ))}
        </SlotGroup>

        <Txt key="human-count" ref={humanCountRef}
          text=""
          fill={PALETTE.rose}
          fontSize={() => vW() * 0.03}
          fontFamily={MONO} fontWeight={700}
          y={() => vH() * 0.14}
          opacity={0} />

        <Txt key="question" ref={questionRef}
          text="« combien de r ? »"
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.03}
          fontFamily={SANS} fontWeight={500}
          y={() => vH() * 0.24}
          opacity={0} />

        <Txt key="model-answer" ref={modelAnswerRef}
          text="il voit des fragments, pas des lettres → « 2 »"
          fill={PALETTE.rose}
          fontSize={() => vW() * 0.026}
          fontFamily={MONO} fontWeight={700}
          y={() => vH() * 0.36}
          opacity={0} />
      </Layout>

      {/* ── Phase 5 — thèse ───────────────────────────────────────────────── */}
      <Txt key="thesis" ref={thesisRef}
        text="Il ne lit pas des lettres. Il lit des fragments."
        fill={PALETTE.cream}
        fontSize={() => vW() * 0.038}
        fontFamily={SANS} fontWeight={700}
        opacity={0} />
    </Layout>,
  );

  // ════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ════════════════════════════════════════════════════════════════════════

  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.1, 0.8),
    topLabelRef().opacity(1, 0.5),
  );

  // ── Phase 1 — ChatGPT éclate en 2 ─────────────────────────────────────────
  yield* waitUntil('chatgpt');
  yield* p1GroupRef().opacity(1, 0.4);
  yield* waitFor(0.4);

  yield* waitUntil('split');
  yield* all(
    p1WordRef().opacity(0.15, 0.4),
    p1RowRef().opacity(1, 0.3),
  );
  yield* sequence(0.15, ...p1Slots.map(popSlot));
  yield* waitFor(0.2);
  yield* p1CountRef().opacity(1, 0.4);
  yield* waitFor(0.6);

  // ── Phase 2 — variabilité ────────────────────────────────────────────────
  yield* waitUntil('variability');
  yield* p1GroupRef().opacity(0, 0.4);
  yield* p2GroupRef().opacity(1, 0.01);

  // "tokenisation" → 2 tokens
  yield* p2WordRef().opacity(1, 0.3);
  yield* waitFor(0.3);
  yield* all(
    p2WordRef().opacity(0.15, 0.3),
    tokRowRef().opacity(1, 0.3),
  );
  yield* sequence(0.12, ...tokSlots.map(popSlot));
  p2CountRef().text('tokenisation → 2 tokens');
  yield* p2CountRef().opacity(1, 0.3);
  yield* waitFor(0.7);

  // bascule vers "Anticonstitutionnellement" → 5 tokens
  yield* waitUntil('long-word');
  yield* all(
    p2WordRef().opacity(0, 0.25),
    tokRowRef().opacity(0, 0.25),
    p2CountRef().opacity(0, 0.25),
  );
  p2WordRef().text('Anticonstitutionnellement');
  p2WordRef().fontSize(() => vW() * 0.04);
  yield* p2WordRef().opacity(1, 0.3);
  yield* waitFor(0.3);
  yield* all(
    p2WordRef().opacity(0.15, 0.3),
    antiRowRef().opacity(1, 0.3),
  );
  yield* sequence(0.1, ...antiSlots.map(popSlot));
  p2CountRef().text('25 lettres → 5 tokens');
  yield* p2CountRef().opacity(1, 0.3);
  yield* waitFor(0.8);

  // ── Phase 3 — BPE ─────────────────────────────────────────────────────────
  yield* waitUntil('bpe');
  yield* p2GroupRef().opacity(0, 0.4);
  yield* p3GroupRef().opacity(1, 0.01);

  yield* bpeCorpus().opacity(1, 0.4);
  yield* waitFor(0.4);
  yield* sequence(0.08, ...bpeChars.map(slot => slot().opacity(1, 0.25)));
  yield* waitFor(0.3);

  // fusion : les 4 chars convergent puis fondent en un token "tion"
  yield* waitUntil('merge');
  yield* all(...bpeChars.map(slot => slot().x(0, 0.5, easeInCubic)));
  yield* all(
    ...bpeChars.map(slot => slot().opacity(0, 0.25)),
    bpeMerged().opacity(1, 0.35),
  );
  yield* bpeMerged().scale(1.15, 0.15).to(1, 0.15);
  yield* bpeCallout().opacity(1, 0.3);
  yield* waitFor(0.8);

  // ── Phase 4 — strawberry (payoff) ─────────────────────────────────────────
  yield* waitUntil('strawberry');
  yield* all(
    p3GroupRef().opacity(0, 0.4),
    topLabelRef().opacity(0, 0.4),
  );
  yield* p4GroupRef().opacity(1, 0.01);

  yield* sequence(0.05, ...strawLetters.map(l => l().opacity(1, 0.2)));
  yield* waitFor(0.4);

  // compter les « r » : les 3 r passent en rose et pulsent
  yield* waitUntil('countR');
  yield* all(...rIndices.map(idx => strawLetters[idx]().fill(PALETTE.rose, 0.3)));
  yield* sequence(0.2,
    ...rIndices.map(idx =>
      strawLetters[idx]().scale(1.4, 0.18, easeOutCubic).to(1, 0.18),
    ),
  );
  humanCountRef().text('r : 3  ✓');
  yield* humanCountRef().opacity(1, 0.3);
  yield* waitFor(0.6);

  // vision du modèle : les lettres se font avaler par [st][raw][berry]
  yield* waitUntil('modelView');
  yield* all(
    ...strawLetters.map(l => l().opacity(0, 0.4)),
    strawRowRef().opacity(1, 0.4),
    humanCountRef().opacity(0, 0.3),
  );
  yield* waitFor(0.3);

  // la question + la mauvaise réponse
  yield* questionRef().opacity(1, 0.3);
  yield* waitFor(0.3);
  yield* waitUntil('wrongAnswer');
  yield* modelAnswerRef().opacity(1, 0.4);
  yield* all(...strawSlots.map(slot => slot().setState('error', 0.2)));
  yield* waitFor(1.0);

  // ── Phase 5 — thèse ───────────────────────────────────────────────────────
  yield* waitUntil('thesis');
  yield* all(
    p4GroupRef().opacity(0, 0.5),
    gridRef().opacity(0.04, 0.5),
  );
  yield* thesisRef().opacity(1, 0.6);
  yield* waitFor(1.0);

  yield* waitUntil('end');
  yield* all(
    thesisRef().opacity(0, 0.5),
    gridRef().opacity(0, 0.5),
  );
  yield* waitFor(0.3);
});
