// litellm/conclusion-remediation.tsx
// Conclusion — plan d'action post-infection
// Étape 1 : vérifier  ·  Étape 2 : nettoyer  ·  Étape 3 : protéger
// Structure identique à payload-decode : panel éditeur + Code + overlay

import {makeScene2D} from '@motion-canvas/2d';
import {Code, LezerHighlighter, lines} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {all, createRef, DEFAULT, waitFor, waitUntil} from '@motion-canvas/core';
import {parser} from '@lezer/python';
import {HighlightStyle} from '@codemirror/language';
import {tags} from '@lezer/highlight';

// ── Passe-Tech syntax theme (identique à payload-decode) ───────────────────
const PasseTechTheme = HighlightStyle.define([
  {tag: tags.keyword,                       color: '#FF7B93', fontWeight: '600'},
  {tag: tags.variableName,                  color: '#79C0FF'},
  {tag: tags.propertyName,                  color: '#79C0FF'},
  {tag: tags.definition(tags.variableName), color: '#79C0FF'},
  {tag: tags.string,                        color: '#6DFF8A'},
  {tag: tags.number,                        color: '#FFE14D'},
  {tag: tags.operator,                      color: '#8B949E'},
  {tag: tags.punctuation,                   color: '#6E7681'},
  {tag: tags.comment,                       color: '#484F58', fontStyle: 'italic'},
  {tag: tags.bool,                          color: '#FFE14D'},
]);

// ── Code snippets ──────────────────────────────────────────────────────────
// Étape 1 : vérifier la présence de l'infection
// Ligne 0  → version installée
// Lignes 2–3 → fichier .pth malveillant dans les caches pip/uv
// Lignes 5–6 → backdoor sysmon (persistance systemd)
// Ligne 8  → pods Kubernetes node-setup-* dans kube-system
const CODE_ETAPE1 = `\
pip show litellm

find ~/.cache/uv  -name "litellm_init.pth"
find ~/.cache/pip -name "litellm_init.pth"

ls ~/.config/sysmon/sysmon.py
ls ~/.config/systemd/user/sysmon.service

kubectl get pods -n kube-system | grep node-setup`;

// Étape 2 : purger les caches — étape que tout le monde oublie
// Ligne 0 → pip cache purge
// Ligne 2 → rm -rf ~/.cache/uv (alternative uv)
const CODE_ETAPE2 = `\
pip cache purge
# ou
rm -rf ~/.cache/uv`;

// Étape 3 : épinglement SHA pour les GitHub Actions
// Lignes 0–1 → mauvaise pratique : tag mutable
// Lignes 3–4 → bonne pratique : SHA immuable
const CODE_ETAPE3 = `\
# Pas ça
uses: aquasecurity/trivy-action@v0.34.2

# Ça
uses: aquasecurity/trivy-action@a1b2c3d4ef...`;

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const C = {
    bg:     '#0D1117',
    panel:  '#161B22',
    border: '#30363D',
    ghost:  '#484F58',
    cream:  '#F9F9F6',
    rose:   '#FF3E6C',
    vert:   '#6DFF8A',
    jaune:  '#FFE14D',
    blue:   '#58A6FF',
    danger: '#F85149',
  };

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef        = createRef<Grid>();
  const titleRef       = createRef<Txt>();
  const stepBadgeRef   = createRef<Txt>();
  const editorPanel    = createRef<Rect>();
  const editorFilename = createRef<Txt>();
  const codeRef        = createRef<Code>();
  const highlightBox   = createRef<Rect>();
  const highlightLabel = createRef<Txt>();

  // ── Helper : positionne l'overlay sur une sélection de lignes ─────────────
  // Identique à payload-decode — repositionne sync, puis on animate opacity
  function placeOverlay(
    range: [[number, number], [number, number]][],
    accentColor: string,
    labelText: string,
  ) {
    const bboxes = codeRef().getSelectionBBox(range);
    if (!bboxes.length) return;

    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    for (const bbox of bboxes) {
      x1 = Math.min(x1, bbox.x);
      y1 = Math.min(y1, bbox.y);
      x2 = Math.max(x2, bbox.x + bbox.width);
      y2 = Math.max(y2, bbox.y + bbox.height);
    }

    const codeX = codeRef().x();
    const codeY = codeRef().y();

    highlightBox().x(codeX + (x1 + x2) / 2);
    highlightBox().y(codeY + (y1 + y2) / 2);
    highlightBox().width(x2 - x1 + 24);
    highlightBox().height(y2 - y1 + 12);
    highlightBox().stroke(accentColor);
    highlightBox().shadowColor(accentColor);

    highlightLabel().x(codeX + (x1 + x2) / 2);
    highlightLabel().y(codeY + y2 + 28);
    highlightLabel().fill(accentColor);
    highlightLabel().text(labelText);
  }

  // ── Helper : masque l'overlay (réutilisé plusieurs fois) ──────────────────
  function* hideOverlay(duration = 0.2) {
    yield* all(
      highlightBox().opacity(0, duration),
      highlightLabel().opacity(0, duration),
    );
  }

  // ── Helper : révèle l'overlay (après placeOverlay) ────────────────────────
  function* showOverlay(duration = 0.35) {
    yield* all(
      highlightBox().opacity(1, duration),
      highlightLabel().opacity(1, duration),
    );
  }

  // ── Scene tree ────────────────────────────────────────────────────────────
  view.add(
    <Layout key="root">
      <Rect key="bg" width={'100%'} height={'100%'} fill={C.bg} zIndex={-2} />
      <Grid
        key="grid"
        ref={gridRef}
        width={'100%'} height={'100%'}
        stroke={C.ghost} lineWidth={1} opacity={0}
        spacing={() => vW() * 0.055} zIndex={-1}
      />

      {/* ── Titre fixe ── */}
      <Txt
        key="title"
        ref={titleRef}
        text="PLAN D'ACTION"
        fill={C.cream}
        fontSize={() => vW() * 0.02}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.43}
        opacity={0}
      />

      {/* ── Badge d'étape — texte mis à jour entre les étapes ── */}
      <Txt
        key="step-badge"
        ref={stepBadgeRef}
        text="ÉTAPE 01 / 03  ·  VÉRIFIER"
        fill={C.ghost}
        fontSize={() => vW() * 0.013}
        fontWeight={700}
        fontFamily={'DM Mono, monospace'}
        y={() => vH() * -0.385}
        opacity={0}
      />

      {/* ── Panel éditeur ── */}
      <Rect
        key="editor-panel"
        ref={editorPanel}
        x={0}
        y={() => vH() * 0.025}
        width={() => vW() * 0.82}
        height={() => vH() * 0.74}
        fill={C.panel}
        stroke={C.border}
        lineWidth={2}
        radius={() => vW() * 0.007}
        opacity={0}
        clip
        layout direction={'column'} alignItems={'stretch'} justifyContent={'start'}
      >
        {/* Barre de titre macOS */}
        <Rect
          key="title-bar"
          width={'100%'}
          height={() => vH() * 0.052}
          fill={`${C.ghost}20`}
          layout direction={'row'}
          alignItems={'center'}
          padding={[0, 20]}
          gap={10}
        >
          <Rect key="dot-close"    width={13} height={13} fill={C.danger} radius={7} />
          <Rect key="dot-minimize" width={13} height={13} fill={C.jaune}  radius={7} />
          <Rect key="dot-maximize" width={13} height={13} fill={C.vert}   radius={7} />
          <Txt
            key="editor-filename"
            ref={editorFilename}
            text="bash"
            fill={C.ghost}
            fontSize={() => vW() * 0.012}
            fontFamily={'DM Mono, monospace'}
          />
        </Rect>
      </Rect>

      {/* Code — sibling du panel, centré par-dessus ── */}
      <Code
        key="code"
        ref={codeRef}
        highlighter={new LezerHighlighter(parser, PasseTechTheme)}
        code={''}
        fontSize={() => vW() * 0.0155}
        fontFamily={'DM Mono, monospace'}
        x={0}
        y={() => vH() * 0.055}
        opacity={0}
        zIndex={3}
      />

      {/* ── Overlay glow (repositionné via placeOverlay) ── */}
      <Rect
        key="highlight-box"
        ref={highlightBox}
        fill={'#00000000'}
        stroke={C.jaune}
        lineWidth={2}
        radius={() => vW() * 0.003}
        shadowColor={C.jaune}
        shadowBlur={() => vW() * 0.012}
        opacity={0}
        zIndex={4}
      />
      <Txt
        key="highlight-label"
        ref={highlightLabel}
        text=""
        fill={C.jaune}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        opacity={0}
        zIndex={4}
      />
    </Layout>,
  );

  // ── Animations ─────────────────────────────────────────────────────────────

  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.12, 0.8),
    editorPanel().opacity(1, 0.5),
    titleRef().opacity(1, 0.45),
  );
  yield* all(
    stepBadgeRef().opacity(1, 0.4),
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 1 — VÉRIFIER
  // ══════════════════════════════════════════════════════════════════════════
  yield* waitUntil('etape1');
  yield* codeRef().code(CODE_ETAPE1, 0.6);
  yield* codeRef().opacity(1, 0.4);
  yield* waitFor(0.6);

  // pip show litellm — vérifier la version
  yield* waitUntil('cmd-version');
  yield* codeRef().selection(lines(0, 0), 0.3);
  placeOverlay(lines(0, 0), C.jaune, 'version installée — compromis entre 1.82.7 et 1.82.8');
  yield* showOverlay();
  yield* waitFor(1.5);

  // find .pth — détecter le fichier malveillant
  yield* waitUntil('cmd-pth');
  yield* hideOverlay();
  yield* codeRef().selection(lines(2, 3), 0.3);
  placeOverlay(lines(2, 3), C.jaune, 'fichier .pth présent = infection confirmée');
  yield* showOverlay();
  yield* waitFor(1.5);

  // ls sysmon — backdoor de persistance
  yield* waitUntil('cmd-sysmon');
  yield* hideOverlay();
  yield* codeRef().selection(lines(5, 6), 0.3);
  placeOverlay(lines(5, 6), C.rose, 'backdoor sysmon — persistance post-reboot via systemd');
  yield* showOverlay();
  yield* waitFor(1.5);

  // kubectl — pods Kubernetes malveillants
  yield* waitUntil('cmd-kube');
  yield* hideOverlay();
  yield* codeRef().selection(lines(8, 8), 0.3);
  placeOverlay(lines(8, 8), C.danger, 'pods K8s — node-setup-* dans kube-system');
  yield* showOverlay();
  yield* waitFor(1.5);

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 2 — NETTOYER
  // ══════════════════════════════════════════════════════════════════════════
  yield* waitUntil('etape2');
  yield* hideOverlay();
  yield* codeRef().selection(DEFAULT, 0);
  yield* editorPanel().stroke(C.border, 0.3);

  // Text swap du badge : fade out → change → fade in
  yield* stepBadgeRef().opacity(0, 0.2);
  stepBadgeRef().text('ÉTAPE 02 / 03  ·  NETTOYER');
  yield* stepBadgeRef().opacity(1, 0.3);

  yield* codeRef().code(CODE_ETAPE2, 0.65);
  yield* waitFor(0.5);

  // pip cache purge
  yield* waitUntil('cmd-purge');
  yield* codeRef().selection(lines(0, 0), 0.3);
  placeOverlay(lines(0, 0), C.jaune, 'vide le cache pip — empêche réinstallation silencieuse');
  yield* showOverlay();
  yield* waitFor(1.5);

  // rm -rf ~/.cache/uv
  yield* waitUntil('cmd-rm');
  yield* hideOverlay();
  yield* codeRef().selection(lines(2, 2), 0.3);
  placeOverlay(lines(2, 2), C.danger, 'purge complète du cache uv — même logique');
  yield* showOverlay();
  yield* waitFor(1.5);

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 3 — SE PROTÉGER
  // ══════════════════════════════════════════════════════════════════════════
  yield* waitUntil('etape3');
  yield* hideOverlay();
  yield* codeRef().selection(DEFAULT, 0);
  yield* editorPanel().stroke(C.border, 0.3);

  yield* stepBadgeRef().opacity(0, 0.2);
  stepBadgeRef().text('ÉTAPE 03 / 03  ·  SE PROTÉGER');
  yield* stepBadgeRef().opacity(1, 0.3);

  editorFilename().text('workflow.yml');

  yield* codeRef().code(CODE_ETAPE3, 0.7);
  // YAML plus court — augmenter légèrement la fonte pour la lisibilité
  yield* codeRef().fontSize(() => vW() * 0.018, 0.3);
  yield* waitFor(0.5);

  // Tag mutable — mauvaise pratique (bordure danger)
  yield* waitUntil('yaml-bad');
  yield* codeRef().selection(lines(0, 1), 0.3);
  placeOverlay(lines(0, 1), C.danger, '76 tags ont été overwrite comme ça sur trivy-action');
  yield* all(
    showOverlay(),
    editorPanel().stroke(C.danger, 0.4),
  );
  yield* waitFor(1.8);

  // SHA immuable — bonne pratique (bordure vert)
  yield* waitUntil('yaml-good');
  yield* hideOverlay(0.15);
  yield* codeRef().selection(lines(3, 4), 0.3);
  placeOverlay(lines(3, 4), C.vert, 'SHA immuable — ne peut pas être overwrite');
  yield* all(
    showOverlay(),
    editorPanel().stroke(C.vert, 0.4),
  );
  yield* waitFor(2.0);

  // ── End ──────────────────────────────────────────────────────────────────
  yield* waitUntil('endScene');
  yield* all(
    gridRef().opacity(0, 0.5),
    editorPanel().opacity(0, 0.5),
    codeRef().opacity(0, 0.4),
    highlightBox().opacity(0, 0.3),
    highlightLabel().opacity(0, 0.3),
    titleRef().opacity(0, 0.4),
    stepBadgeRef().opacity(0, 0.4),
  );
});
