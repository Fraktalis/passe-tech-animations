# Plan des animations — « Comment un ingénieur planifie son mariage »

Source : script Obsidian `🍉 PasseTech Youtube Channel/Mariage Ingénieur/script.md` (version 10, 15/10/2026).
Dossier : `src/scenes/mariage/`. Une scène = un fichier `.tsx`.

## Règles communes à toutes les scènes

- **Anonymisation stricte** : ni prénom de la mariée, ni vrai nom d'invité, de prestataire, de domaine ou de lieu d'hébergement. Les deux mariés sont deux icônes `mdi:account` sans nom (Alex = bleu `PALETTE.blue`, sa femme = rose `PALETTE.rose`, couleurs fixes dans toutes les scènes). Invités : prénoms fictifs ou « Invité 12 ».
- **Show, don't tell** : aucun `Txt`/`Callout` qui paraphrase la voix off. Labels courts uniquement (nom d'outil, chiffre, date).
- Une couleur active par scène (indiquée ci-dessous), le reste en `PALETTE.secondary` / `ghost`.
- Composants de `src/components/` obligatoires (≥ 2026-05-20), `PALETTE` depuis `../../theme`, `vW()/vH()` partout, `key` sur chaque nœud, noms de variables en toutes lettres, `Callout` masqué → `.hold()`.
- Chaque battement est précédé d'un `yield* waitUntil('nom-du-battement')` (synchronisation voix off au montage).
- Logos de marque : `logos:` quand l'icône existe (Iconify), sinon `mdi:` / `lucide:` générique.

## Couverture par chapitre

| Ch. | Moment du script | Scène | Couleur active |
|-----|------------------|-------|----------------|
| 0 | COLD OPEN | *Capture de l'appli 3D — pas d'animation Motion Canvas* | — |
| 0 | HOOK : 3 ans de fiançailles, puis 1 an de projet | `frise-projet` | jaune |
| 1 | Salon : les questions des prestataires | `questions-prestataires` | jaune |
| 1 | « On avait dit quoi déjà ? » / les écrits restent | `decision-orale` | rose → vert |
| 2 | Vikunja, Calendar, Obsidian, Syncthing, IA | `systeme-briques` | cyan |
| 2 | Vibe : transcription locale → résumé Claude | `pipeline-vibe` | vert |
| 3 | Règles de placement (3 familles) | `contraintes-placement` | jaune |
| 3 | CP-SAT → tables, validation, chambres | `cpsat-solution` | vert |
| 4 | Télémètre + Blender vs Gaussian Splats | `deux-options-3d` | cyan |
| 4 | Chaîne complète vidéo → appli | `pipeline-jumeau` | cyan |
| 4 | ffmpeg + tri des images | `ffmpeg-tri-images` | jaune |
| 4 | Parallaxe (autoroute) → triangulation | `parallaxe` | jaune |
| 4 | Points saillants, échec piste de danse | `colmap-points-ilots` | vert / rose |
| 4 | Gaussiennes, RTX 3070, 1,5 M | `gaussiennes` | rose |
| 4 | Claude dans Blender : doublons, fenêtres, low-poly | `blender-claude-defauts` | rose |
| 4 | plan.json → THREE.js, survol de chaise | `app-plan-json` | jaune |
| 4 | Site invités et RSVP → Google Form | `site-rsvp` | cyan |
| 5 | Une source → 7 documents (13–18 août) | `documents-source-unique` | jaune |
| 5 | Livret par table + légende | `livret-table` | vert |
| 5 | Remise des clés | `remise-cles` | vert |
| 5 | Plan traiteur : totaux par plat | `plan-traiteur-totaux` | rose |
| 6 | Erreurs de l'IA trouvées à la relecture | `erreurs-ia-relecture` | rose |
| 6 | Obsidian → Drive, deux versions | `obsidian-vers-drive` | rose → vert |
| 7 | Source de vérité où chacun écrit | `source-de-verite` | vert |
| 7 | Jumeau : effort vs gain vs fun | `effort-vs-fun` | jaune |
| 8 | THÈSE | *Plan caméra — pas d'animation* | — |
| 8 | OUTRO : « un déménagement à organiser » | `outro-demenagement` + `_shared/subscribe-cta` existant | cyan |

---

## Déroulés

### `frise-projet` (HOOK)
1. `fiancailles` — Frise horizontale. À gauche, une bague (`mdi:ring`) ; trois segments « année » s'allongent lentement, vides, gris (rien ne se passe) ; un compteur de tâches reste à `0`.
2. `salon` — Un point jaune « 13/09/2025 » tombe sur la frise : coup de pied (le segment suivant s'allume en jaune).
3. `un-an` — La frise jaune file jusqu'à « 22/08/2026 » (cœur `mdi:heart`). Pendant le trajet, des micro-icônes (✓ tâches, réunions `mdi:account-group`, `mdi:format-list-checks`) s'empilent au-dessus de la frise de plus en plus vite ; le compteur de tâches défile.
4. `question` — Tout se condense en une seule icône « projet » (`mdi:clipboard-check-outline`) à côté de l'anneau : signe `≟` entre les deux. Rien d'autre.

### `questions-prestataires` (BASCULE)
1. `stands` — Les deux icônes mariés au centre. Autour, 8 nœuds prestataires apparaissent en cercle (icônes : appareil photo, caméra, toque, platine DJ, fleur, chapeau magicien, cocktail, agenda/wedding planner) avec label court.
2. `questions` — Chaque prestataire envoie une bulle `?` vers les mariés ; deux bulles portent « Quel jour ? » et « Combien ? ». Les bulles s'accumulent sur les mariés, qui restent sans réponse (aucune flèche retour).
3. `wedding-planner` — Le nœud wedding planner passe en rose et est barré (Line diagonale) puis s'estompe : seule certitude.
4. `pas-prets` — Les bulles restent en pile, jaunes ; les mariés rétrécissent légèrement. Fin.

### `decision-orale` (BASCULE)
1. `oral` — Deux icônes (Alex/femme) face à face ; une bulle de parole commune « ✓ décision » apparaît entre eux (rendu « audio » : ondes).
2. `envol` — La bulle se fragmente en particules qui s'envolent vers le haut et disparaissent.
3. `deux-versions` — Chaque personne repart avec sa propre bulle, différente (même forme, contenu qui diverge : ex. « 80 invités » vs « 120 invités », couleurs différentes).
4. `six-mois` — Un compteur de mois défile jusqu'à `+6` ; les deux bulles se heurtent en rose (conflit), flash.
5. `ecrits-restent` — Rejouer : la décision est tapée dans un document (`mdi:file-document-outline`) posé entre eux ; les deux lisent le même document (deux flèches vers le doc), le doc reste net quand le compteur repasse à `+6`. Couleur passe au vert.

### `systeme-briques` (SYSTÈME)
Construction brique par brique d'un diagramme, centré sur Obsidian.
1. `vikunja` — Nœud « Vikunja » (`mdi:checkbox-marked-outline`) dans une `Zone` « HOMELAB · GESTION DES TÂCHES » ; à l'intérieur, trois projets en liste (« boulot », « perso », puis « mariage » qui s'ajoute en cyan). Petite icône Calendar (`logos:google-calendar`) qui se connecte : échéances.
2. `adoption` — L'icône femme se connecte à Vikunja (edge cyan) — « dès le lendemain » montré par un mini compteur « J+1 ».
3. `obsidian` — Seconde `Zone` « HOMELAB · GESTION DES DOCUMENTS » (contient Obsidian, Claude et Syncthing). Nœud « Obsidian » (`logos:obsidian` si dispo, sinon `mdi:notebook`) au centre ; dossier « Second cerveau » existant, sous-dossier « mariage » ajouté. Les décisions (petits docs) convergent vers lui.
4. `ia` — Nœud « Claude » relié à Obsidian par une edge bidirectionnelle (lecture + écriture : paquets dans les deux sens).
5. `syncthing` — Trois appareils (PC, laptop, téléphone) autour ; edges Syncthing en maillage pair-à-pair (pas de serveur central : chaque appareil relié aux autres) ; un paquet modifié sur le téléphone se propage aux deux autres.

### `pipeline-vibe` (SYSTÈME)
1. `discussion` — Deux icônes qui parlent ; forme d'onde audio animée entre elles.
2. `vibe` — L'onde entre dans un nœud « Vibe » dans une `Zone` « local » (cadenas, aucune flèche vers le cloud : un nuage barré en fond).
3. `transcription` — Sortie : lignes de texte qui s'écrivent (typewriter) dans un Terminal ou un doc.
4. `resume` — Le texte part vers « Claude » → ressort court (3 lignes) → se range dans Obsidian (doc « compte-rendu.md »).
5. `telephone` — Variante téléphone (`mdi:phone`) : avant que l'onde parte, une coche de consentement (`mdi:account-check`) doit s'allumer côté interlocuteur ; tant qu'elle n'est pas verte, l'onde est bloquée (barrière).

### `contraintes-placement` (SOLVEUR)
1. `invites` — 60 points (cercles) en nuage désordonné, compteur « 60 ».
2. `ensemble` — Des liens rigides apparaissent : couples (2), trios (3) deviennent des blocs indivisibles (capsules) ; familles entourées d'un contour commun.
3. `regrouper` — Des groupes (collègues, amis) s'attirent : liens élastiques tiretés qui rapprochent les points.
4. `separer` — Des liens rose « ↔ » repoussent certains points (générations, personnes à éloigner) ; ressorts qui s'écartent.
5. `a-la-main` — Tentatives manuelles : les points sautent d'une table à l'autre, chaque essai viole une règle (lien qui clignote rose) ; un compteur de combinaisons explose (notation 10^xx qui grimpe).

### `cpsat-solution` (SOLVEUR)
1. `solveur` — Les règles (icônes des 3 types de liens) entrent dans un nœud « CP-SAT » (sublabel « OR-Tools »).
2. `tables` — Sortie : table d'honneur rectangulaire + 7 tables rondes ; les 60 points se posent dessus (tailles 7, 8, 6, 8, 8, 8, 7, 8), tous les liens passent au vert.
3. `validation` — Une loupe passe table par table ; deux points s'échangent à la main (petite retouche), les liens restent verts.
4. `chambres` — Même nuage réutilisé : les points se redistribuent dans des rectangles « chambres » (grille de lits) ; plus rapide.

### `deux-options-3d` (JUMEAU)
1. `fork` — Une icône salle (`mdi:greenhouse` ou équivalent) ; seule la branche gauche « Télémètre + Blender » apparaît (la droite « Gaussian Splats » est gardée pour `option-splats`).
2. `option-laser` — Gauche : un faisceau laser mesure un mur → cote ; puis les difficultés s'empilent en vignettes (coin arrondi, sol en pierre, portes/fenêtres, toit à barres parallèles dont les barres se multiplient). Le chronomètre de la branche gauche file.
3. `option-splats` — La branche « Gaussian Splats » apparaît (flèche, titre, chronomètre), puis : téléphone → boîte « magique » (`mdi:auto-fix`) → nuage 3D ; badge « 2023 » (article fondateur).
4. `choix` — La branche droite s'allume, la gauche s'estompe.

### `pipeline-jumeau` (JUMEAU — fil conducteur du chapitre)
Chaîne horizontale de nœuds révélés un à un, puis maintenue comme carte : `Vidéo (3 min)` → `ffmpeg` (images) → `tri` → `COLMAP` (poses caméra) → `LichtFeld Studio` (sublabel « RTX 3070 · 7-8 h ») → `1,5 M gaussiennes` → `Blender` (meshes) → `THREE.js` (appli). Après `Vidéo`, battement `suspense` : la caméra recule et les 7 autres blocs apparaissent en « ? » (écho de la boîte « magique » de `deux-options-3d`), chacun se transformant en vrai nœud à sa révélation. Un `waitUntil` par nœud ; un `Packet` voyage le long de la chaîne. À la fin, caméra qui recule pour montrer toute la chaîne (réutilisable comme carte entre les sous-parties).

### `ffmpeg-tri-images` (JUMEAU)
1. `decoupe` — Une bande vidéo (rect avec perforations) passe dans un nœud « ffmpeg » et sort en pile d'images (vignettes).
2. `tri` — Les images floues (vignette floutée/ondulée) tombent en rose ; les doublons (deux vignettes identiques côte à côte) : une des deux disparaît.
3. `recouvrement` — Les images gardées s'alignent en chaîne, chaque paire voisine se recouvre partiellement (zone de recouvrement surlignée en jaune) ; on retire une image au milieu → trou, la chaîne se casse (rose) → on la remet.

### `parallaxe` (JUMEAU)
1. `autoroute` — Vue latérale stylisée par la vitre : trois plans — barrière (proche, poteaux), arbres (moyen), lune (fond). Défilement : barrière très rapide, arbres lents, lune immobile.
2. `mesure` — Figer ; une flèche de déplacement sur chaque plan montre la longueur du glissement (longue / moyenne / nulle).
3. `deux-vues` — Vue de dessus : deux positions de caméra (le téléphone qui marche) ; un point de la salle ; deux rayons qui se croisent → le point se fixe en 3D. Répété sur plusieurs points : un petit nuage de points apparaît, et les deux caméras se positionnent elles-mêmes (pyramides de pose).
4. `immobile` — Contre-exemple : caméras au même endroit → les rayons sont confondus, aucun croisement, le point reste flou (rose).

### `colmap-points-ilots` (JUMEAU)
1. `points-saillants` — Deux images côte à côte : une « verrière » stylisée (dalles de pierre + barres du toit) se couvre de points verts ; une image « mur blanc » ne reçoit presque aucun point.
2. `correspondances` — Deux vues de la verrière : des lignes relient les mêmes points d'une image à l'autre (centaines de correspondances).
3. `graphe` — Les images deviennent des nœuds d'un graphe ; les correspondances forment des arêtes ; tout se connecte en un bloc → une salle reconstruite.
4. `piste-de-danse` — Salle sombre (images assombries et floues) : peu de points, le graphe se fragmente en îlots séparés (rose) qui ne se recollent jamais ; un indicateur de convergence échoue.

### `gaussiennes` (JUMEAU)
1. `ellipse` — Une seule gaussienne : ellipse floue colorée ; ses paramètres s'affichent en labels courts autour (position, taille, rotation, couleur, opacité) et varient.
2. `accumulation` — Des centaines d'ellipses se superposent et reconstituent progressivement une forme reconnaissable (silhouette de verrière : arche + barres).
3. `entrainement` — Nœud GPU (`mdi:expansion-card`, label « RTX 3070 ») ; une horloge défile jusqu'à 7-8 h ; un compteur monte jusqu'à `1 500 000`.

### `blender-claude-defauts` (JUMEAU)
1. `doublons` — Une table modélisée ; une copie parfaitement superposée apparaît (décalage d'un pixel puis recalée) ; au rendu, la zone devient noire (scintillement rose).
2. `fenetres` — Coupe du nuage de points : murs denses, trous là où sont les vitres ; un cadre de fenêtre posé par Claude « tombe » au mauvais endroit dans le trou, puis est recalé à la main.
3. `nettoyage` — Doublons supprimés un à un (curseur main), rendu redevient correct ; une horloge montre « heures → jours » gagnés.
4. `low-poly` — Un couteau stylisé se réduit en parallélépipède gris ; fourchette et bougie idem (gag visuel, aucun texte).

### `app-plan-json` (JUMEAU)
1. `json` — Un fichier `plan.json` (Terminal ou bloc de code) : 3 entrées anonymisées `{ "table": 3, "invite": "Invité 12", "menu": "risotto" }`. Le nœud CP-SAT (petit) alimente le fichier.
2. `edition` — Les deux icônes mariés éditent le même fichier (deux curseurs de couleur).
3. `lecture-seule` — Flèche unique `plan.json` → appli THREE.js (`logos:threejs`) ; aucune flèche retour.
4. `survol` — Vue de dessus d'une table ronde ; un curseur passe sur une chaise : la chaise s'illumine (jaune), une petite carte affiche « Invité 12 · risotto ».
5. `lumieres` — Bougies/guirlandes : un curseur de réglage d'intensité + couleur ; bascule ciel jour → nuit (fond qui s'assombrit, points lumineux qui ressortent).

### `site-rsvp` (JUMEAU → site)
1. `site` — Nœud navigateur « site invités » (Astro `logos:astro`) servi depuis la `Zone` homelab ; pages en vignettes : carte, FAQ, photos. Flèches uniquement sortantes (lecture seule), tout est calme et vert.
2. `formulaire` — Un champ de saisie apparaît sur le site : instantanément, une pile de blocs s'empile sous le homelab : « base de données », « CSRF », « anti-bot », « sauvegarde ». La pile vacille (cyan → rose).
3. `une-fois` — Compteur « utilisations : 1 ».
4. `google-form` — La pile s'effondre / disparaît ; le champ est remplacé par un lien vers un nœud Google Forms (`logos:google-forms` si dispo) hors du homelab. Retour au calme.

### `documents-source-unique` (DOCUMENTS)
1. `deux-semaines` — Compte à rebours « J-14 ».
2. `sources` — À gauche : `plan.json`, notes, et la charte (palette de couleurs + 2 polices + motif floral) en trois nœuds.
3. `claude` — Tout converge vers « Claude » ; la charte est montrée comme un gabarit imposé (cadre verrouillé `mdi:lock`).
4. `sept-documents` — En éventail à droite, 7 documents sortent, un par un, avec la même bordure/couleur de charte ; une frise « 13 → 18 août » se remplit en dessous. Labels courts : panneaux, clés, cocktail, menu, tables, bancs, traiteur.

### `livret-table` (DOCUMENTS)
1. `tables` — Table d'honneur + 7 rondes (vue de dessus, mêmes positions que `cpsat-solution`), compteur 60.
2. `fiche` — Zoom sur une table → elle se déplie en une fiche : liste de convives fictifs avec, pour chacun, le plat et des pictogrammes.
3. `legende` — Légende des 5 pictogrammes (végétarien, produits laitiers, alcool, fruits de mer, poisson) ; chaque pictogramme de la fiche pulse quand sa ligne de légende s'allume.
4. `meme-fichier` — Une flèche relie la fiche au même `plan.json` que le jumeau.

### `remise-cles` (DOCUMENTS)
1. `tableau` — Deux tableaux (« Hébergement A », « Hébergement B ») ; lignes = logements, colonnes « remises » / « rendues ».
2. `arrivee` — Les cases « remises » se cochent une par une (vert).
3. `depart` — Lendemain : tout le monde part en même temps, les cases « rendues » se cochent très vite ; une ligne reste vide et clignote (jaune) puis se coche.

### `plan-traiteur-totaux` (DOCUMENTS)
1. `plan` — Plan de salle mis à plat (tables de `cpsat-solution`), avec liste de convives par table.
2. `totaux` — En bas, les totaux par plat (« risotto 32 », « jarret 28 » — valeurs d'exemple cohérentes avec 60) se calculent.
3. `fusion` — Deux convives au prénom presque identique (ex. « Mathis » / « Matis ») : Claude les fusionne en une seule ligne (les deux lignes glissent l'une sur l'autre) → le total tombe à 59, mis en rose face au « 60 » attendu.
4. `verification` — La ligne est restaurée, total à 60 en vert. Icône main + loupe.

### `erreurs-ia-relecture` (CRISE)
1. `relecture` — Une pile de documents ; une loupe les passe un par un.
2. `diffs` — Sur des prénoms fictifs, les erreurs sont surlignées comme un diff : accent ajouté (« Helene » → « Hélène »), lettre ajoutée (« Anais » → « Annais »), lettre supprimée (« Mathilde » → « Mathide »). Caractère fautif en rose.
3. `compteur` — Compteur d'erreurs qui s'arrête sous 10.
4. `tampon` — Chaque document reçoit un tampon vert « relu » avant de partir vers une imprimante (`mdi:printer`).

### `obsidian-vers-drive` (CRISE)
1. `config` — Deux ordinateurs ; sur celui de la femme, Obsidian + Syncthing tourne, mais le badge de compte est celui d'Alex (couleur bleue sur le PC rose).
2. `simultane` — Les deux veulent éditer le plan de table en même temps : deux curseurs sur le même fichier → conflit (fichier qui se dédouble, rose).
3. `drive` — Les fichiers Markdown glissent vers un nœud Google Drive (`logos:google-drive`).
4. `deux-versions` — Le même « plan » existe maintenant à deux endroits (Obsidian et Drive) : deux copies qui divergent (contenus différents qui clignotent).
5. `bascule` — Obsidian s'estompe pour le plan ; les deux curseurs (bleu + rose) écrivent dans le Drive en même temps sans conflit (vert).

### `source-de-verite` (LEÇON)
1. `source` — Un nœud central « source » (vert). Les deux mariés y écrivent (flèches entrantes des deux).
2. `un-seul-ecrivain` — Variante ratée en flashback rapide : une seule flèche d'écriture, l'autre personne reste à l'extérieur (rose, barrière) → la source se périme (opacité qui baisse).
3. `ia-comparee` — Une sortie IA (document) est posée à côté de la source ; une ligne de comparaison balaie les deux ; une différence fine (un accent) est détectée et surlignée.

### `effort-vs-fun` (LEÇON)
1. `effort` — Barre « effort » du jumeau qui monte très haut (heures empilées).
2. `gain` — Barre « gain » à côté, minuscule.
3. `fun` — Troisième barre « fun » qui monte, dépasse le cadre du graphique et sort de l'écran (le cadre se déforme / la caméra recule). Couleur jaune.

### `outro-demenagement` (OUTRO)
1. `nouveau-projet` — Vikunja : liste de projets avec « mariage » (coché, archivé, vert) ; un nouveau projet « déménagement » est créé, vide, avec un curseur qui clignote.
2. `premieres-taches` — Trois cartons (`mdi:package-variant`) apparaissent comme premières tâches. Fin sur la pastèque 🍉.

---

## Hors périmètre Motion Canvas
- COLD OPEN : capture vidéo de l'appli THREE.js (survol, bougies, ciel jour/nuit).
- Photos (salon, alliances, costumes, bannière) : montage, floutage selon flag 7.
- THÈSE : plan face caméra.
