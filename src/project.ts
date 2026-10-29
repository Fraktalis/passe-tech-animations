import {makeProject} from '@motion-canvas/core';
import {Code, Icon, LezerHighlighter} from '@motion-canvas/2d';
import {parser} from '@lezer/javascript';

Code.defaultHighlighter = new LezerHighlighter(parser);

// Icônes servies par le cache disque de vite.config.ts (iconifyCache) au lieu de l'API
// Iconify directe, qui rate-limite (429) les rendus. getSrc est protégé, d'où le cast.
(Icon.prototype as any).getSrc = function (this: Icon) {
  return `/iconify/${this.icon().replace(':', '/')}.svg?color=${encodeURIComponent(this.color().hex())}`;
};

// ── Scènes de test des composants (≥ 2026-05-20) ────────────────────────────
import testConnectionArrow from './scenes/_components/test-connection-arrow?scene';
import testInfoCard         from './scenes/_components/test-info-card?scene';
import testConnectedNode    from './scenes/_components/test-connected-node?scene';
import testAnnotationBox    from './scenes/_components/test-annotation-box?scene';
import testDs               from './scenes/_components/test-ds?scene';
import testSfx              from './scenes/_components/test-sfx?scene';



// ── Vidéo « Mariage ingénieur » ──────────────────────────────────────────────
import mariageFriseProjet from './scenes/mariage/frise-projet?scene';
import mariageQuestionsPrestataires from './scenes/mariage/questions-prestataires?scene';
import mariageDecisionOrale from './scenes/mariage/decision-orale?scene';
import mariageSystemeBriques from './scenes/mariage/systeme-briques?scene';
import mariagePipelineVibe from './scenes/mariage/pipeline-vibe?scene';
import mariageContraintesPlacement from './scenes/mariage/contraintes-placement?scene';
import mariageCpsatSolution from './scenes/mariage/cpsat-solution?scene';
import mariageDeuxOptions3d from './scenes/mariage/deux-options-3d?scene';
import mariagePipelineJumeau from './scenes/mariage/pipeline-jumeau?scene';
import mariageFfmpegTriImages from './scenes/mariage/ffmpeg-tri-images?scene';
import mariageParallaxe from './scenes/mariage/parallaxe?scene';
import mariageColmapPointsIlots from './scenes/mariage/colmap-points-ilots?scene';
import mariageGaussiennes from './scenes/mariage/gaussiennes?scene';
import mariageBlenderClaudeDefauts from './scenes/mariage/blender-claude-defauts?scene';
import mariageAppPlanJson from './scenes/mariage/app-plan-json?scene';
import mariageSiteRsvp from './scenes/mariage/site-rsvp?scene';
import mariageDocumentsSourceUnique from './scenes/mariage/documents-source-unique?scene';
import mariageLivretTable from './scenes/mariage/livret-table?scene';
import mariageRemiseCles from './scenes/mariage/remise-cles?scene';
import mariagePlanTraiteurTotaux from './scenes/mariage/plan-traiteur-totaux?scene';
import mariageErreursIaRelecture from './scenes/mariage/erreurs-ia-relecture?scene';
import mariageObsidianVersDrive from './scenes/mariage/obsidian-vers-drive?scene';
import mariageSourceDeVerite from './scenes/mariage/source-de-verite?scene';
import mariageEffortVsFun from './scenes/mariage/effort-vs-fun?scene';
import mariageOutroDemenagement from './scenes/mariage/outro-demenagement?scene';

import audio from "../sfx/obsidian-vers-drive.wav";

export default makeProject({
  scenes: [
    // mariageFriseProjet,
    // mariageQuestionsPrestataires,
    // mariageDecisionOrale,
    // mariageSystemeBriques,
    // mariagePipelineVibe,
    // mariageContraintesPlacement,
    // mariageCpsatSolution,
    // mariageDeuxOptions3d,
    // mariagePipelineJumeau,
    // mariageFfmpegTriImages,
    // mariageParallaxe,
    // mariageColmapPointsIlots,
    // mariageGaussiennes,
    // mariageBlenderClaudeDefauts,
    // mariageAppPlanJson,
    // mariageSiteRsvp,
    // testSfx,
    // mariageDocumentsSourceUnique,
    // mariageLivretTable,
    // mariageRemiseCles,
    // mariagePlanTraiteurTotaux,
    // mariageErreursIaRelecture,
    mariageObsidianVersDrive,
    // mariageSourceDeVerite,
    // mariageEffortVsFun,
    // mariageOutroDemenagement,
  ],
  audio
});
