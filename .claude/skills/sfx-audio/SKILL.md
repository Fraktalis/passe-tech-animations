---
name: sfx-audio
description: Ajoute et génère le bruitage (sound effects) d'une scène Motion Canvas Passe-Tech avec la librairie `src/sfx/`. À utiliser quand Alex demande « l'audio / le son / les sfx / les bruitages » d'une animation, ou de régénérer un WAV.
---

## Principe

Les sons sont synthétisés (`src/sfx/library.mjs`), jamais choisis un par un dans les scènes. Une scène n'appelle que des **intentions** ; aucune fréquence, forme d'onde ni volume absolu dans une scène (CLAUDE.md, section « Sound effects »).

## Règle de style — parcimonie

Un seul son par temps fort de l'animation, pas un son par objet qui apparaît. Référence : `systeme-briques.tsx`, `site-rsvp.tsx`, `documents-source-unique.tsx` (≈ 10–20 appels par scène).

- **Pas de `appear` / `disappear` / `transition`** pour des fondus d'opacité : trop de sons, Alex les a refusés (2026-10-29). Les apparitions de nœuds restent muettes.
- `tick` : bon pour les actions de frappe ou d'empilement discrètes (texte tapé, console, blocs qui s'empilent, ex. `effort-vs-fun`), car très discret. Éviter en revanche un `tick` sur chaque icône qui apparaît ou chaque secousse.
- Un déplacement groupé (plusieurs fichiers qui glissent) = un `travel` par objet au plus, décalés comme l'animation.

| Intention | Quand |
|---|---|
| `draw` | une ligne / flèche se trace |
| `travel` | un objet ou un curseur traverse l'écran |
| `activate` | un nœud passe à l'état actif |
| `emphasis` | on souligne, pulse, clignote |
| `land` / `collapse` | pose / effondrement de blocs |
| `swap` | échange, réorganisation |
| `tick` | pas discret isolé |
| `success` | résolution finale, vert |
| `failure` | conflit, erreur (deux bips) |
| `warning` | alerte dramatique (~2 s, la couvre) |
| `sfxFill(from, to, durée, {ease, steps})` | jauge, compte à rebours, barre |

## Dans la scène

```ts
import {sfx, sfxFill, sfxReset, sfxFlush} from '../../sfx';

sfxReset();                       // début de scène (le preview rejoue à chaque seek)
sfx('travel', 0.4);               // (intention, volume 0–1, délai en s)
yield* cursor().position(...);
sfxFlush('nom-de-la-scene');      // dernière ligne
```

- `sfx()` note l'instant **courant** (`useTime()` + délai) : l'appeler *juste avant* le `yield*` qu'il accompagne.
- Dans un `sequence(0.3, a, b, c)` ou après un `all(...)` de durée d, compter le décalage à la main en délai : `sfx('travel', 0.5, d + 0.3 * i)`.
- Le nom passé à `sfxFlush` = nom du fichier de scène (kebab-case, `[a-z0-9-]` seulement).

## Générer le WAV

1. `src/project.ts` : ne garder que la scène voulue dans `scenes` (sauvegarder le fichier avant avec `git stash`/copie dans le scratchpad, **pas dans `/tmp`** : chemin différent entre Python et bash sous Windows ; le restaurer après).
2. Lancer le preview (`preview_start` `motion-canvas`, port 9000 ou le suivant libre).
3. **Lancer la lecture** (bouton Play) et attendre la fin de la scène : `sfxFlush` n'écrit `sfx/<scène>.json` que si la scène va jusqu'au bout. Un simple rechargement ou un hot-reload laisse parfois un JSON périmé : vérifier que son contenu reflète les derniers `sfx()`.
4. `node scripts/render-sfx.mjs sfx/<scène>.json` → `sfx/<scène>.wav` (mono 48 kHz, ~16 bits, affiche nb de sons / durée / crête).
5. Pour l'écouter dans le preview : `import audio from '../sfx/<scène>.wav'` + `audio` dans `makeProject` (seul un WAV à la fois).
6. Restaurer `project.ts`, arrêter le serveur.

Les `.wav` sont gitignorés (`*.wav`) ; les `sfx/*.json` sont versionnés et suffisent à régénérer.

## Changer un son

Uniquement dans `src/sfx/library.mjs` (catalogue `SOUNDS`, niveaux `LEVELS`, gamme la mineur pentatonique). Toute nouvelle intention doit aussi être ajoutée à `SFX_INTENTS` dans `src/sfx/index.ts`. Banc d'essai : `src/scenes/_components/test-sfx.tsx`.
