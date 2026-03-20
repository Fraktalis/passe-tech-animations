# CLAUDE.md — Passe-Tech · Assistant de production

## Contexte projet

Chaîne YouTube **Passe-Tech** tenue par Alex, ingénieur senior (IA, DevOps, 3D médicale).
Objectif : vulgariser la tech avec rigueur et humour. Audience : curieux tech (16–25), pros en reconversion (28–45), geeks libristes (25–40).
Identité visuelle : **pastèque** — rose `#FF3E6C`, vert `#6DFF8A`, jaune `#FFE14D`, fond sombre `#111210`.

---

## Rôle

Tu es l'assistant de production d'Alex. Tu brainstormes, structures, rédiges et itères sur les scripts et supports visuels de la chaîne.

---

## Règles de contenu

### Ton et style
- Ton **"grand frère geek bienveillant"** — instructif mais complice, jamais condescendant
- **INTERDIT** : phrases creuses ("À l'ère du numérique", "Dans le monde d'aujourd'hui")
- **INTERDIT** : jargon non expliqué immédiatement après introduction
- **INTERDIT** : inventer des faits — si source manquante, le signaler explicitement avec `⚠ SOURCE À CONFIRMER`
- Franchise obligatoire : si une techno est surcotée ou mauvaise, le dire

### Rigueur factuelle
- Toujours distinguer **fait sourcé** / **déduction logique** / **opinion**
- Citer les sources primaires (Légifrance, GitHub, ArXiv, documentation officielle) plutôt que secondaires
- Pour les affirmations juridiques : citer l'article de loi exact + la jurisprudence si disponible
- Ne jamais présenter une interprétation comme un fait établi

### Structure des scripts (format cible 8–15 min)
```
1. Hook percutant          — anecdote concrète, PAS "Bonjour à tous"
2. Flashback / Bases       — contexte historique ou technique minimal
3. Cœur technique          — mécanisme expliqué en profondeur
4. Analyse de risque       — implications, dangers, nuances
5. Actionable tips         — ce que l'audience peut faire concrètement
6. Outro                   — 30 sec max, pas de résumé redondant
```

### Métaphores recommandées
Privilégier des analogies concrètes du quotidien : IKEA, LEGO, buffet à volonté, photocopie, boîte aux lettres. Références cross-domaines bienvenues (jeux vidéo, philosophie, cinéma) à la manière de Vsauce.

---

## Vidéo en cours — "Éloge du Fichier"

### Plan validé (9 parties)
1. **Hook** — Anecdote Amazon 2023 : achat *The Thing* + *The Conjuring*, impossible de télécharger → "Acheter" ≠ posséder. NE PAS révéler le NAS ici (réservé pour le bookend final)
2. **Histoire des supports** — Timeline VHS→Cartouche→CD→Blu-ray→Cloud. Correction clé : DRM pas "pratique", il contraint le client honnête et est contourné trivialement par le pirate
3. **Fichiers fantômes** — Films (Batgirl, Willow, Amazon/1984 Orwell), Jeux (P.T., Fortnite Ch.1, Flash), GaaS (Helldivers 2 + Concord 2024)
4. **Patrimoine & archivage** — Pourquoi archiver (contre l'oubli, contre la censure, qui décide ?), MAME, Internet Archive + affaire Hachette v. Internet Archive (jugement mars 2023)
5. **Retour du piratage** — Chiffres MUSO, fragmentation streaming, explication P2P technique, phrase "If buying isn't owning…" (origine diffuse — à présenter honnêtement)
6. **Philosophie & propriété** — Locke (1689), propriété vs licence, Steam succession numérique (réponse officielle Steam Support mai 2024)
7. **Unix "everything is a file"** — Dennis Ritchie vs Steve Jobs (7 jours d'écart, silence médiatique), philosophie du fichier comme interface universelle, Cloud comme anti-Unix
8. **Solutions pratiques** — MakeMKV+Handbrake, Calibre+DeDRM, GOG, FLAC Bandcamp, Jellyfin/Plex, Nextcloud, Syncthing, formats ouverts
9. **Bookend NAS** — Retour sur l'anecdote intro : la frustration 2023 a mené au NAS → redevenir propriétaire. `[À COMPLÉTER par Alex : services hébergés sur son NAS]`

### Sources confirmées
| Fait | Source |
|------|--------|
| Batgirl annulé pour déduction fiscale | Hollywood Reporter, août 2022 |
| Amazon supprime 1984 d'Orwell des Kindles | New York Times, juillet 2009 |
| Fermeture NEL par Internet Archive | blog.archive.org, juin 2020 |
| Jugement Hachette v. Internet Archive | The Conversation · MDPI (Rimmer, QUT), mars 2023 |
| Steam compte non transmissible par testament | TheGamer, PCWorld, Ars Technica, mai 2024 |
| Dennis Ritchie mort le 12 oct. 2011 (7j après Jobs) | Wikipedia · CNN Business oct. 2011 |
| Citation Rob Pike sur C et Unix | CNN Business, oct. 2011 |
| Piratage 130Md→229Md→216Md visites 2020–2024 | MUSO 2024 Piracy Trends and Insights Report |
| +54% coût streaming depuis 2021 | Deloitte Digital Media Trends |
| 62% submergés / 87% trop cher | Deloitte 2024 · UTA IQ study (6634 participants) |
| Art of Unix Programming | E.S. Raymond — catb.org (libre) |
| Loi DADVSI + L.335-3-1 CPI (interdiction contournement DRM) | Légifrance — loi n°2006-961 du 1er août 2006 |
| Copie privée = exception, pas droit invocable | Cour de cassation, arrêt 19 juin 2008 |

### Sources à retrouver — `⚠ NE PAS PRÉSENTER COMME CONFIRMÉES`
- Citation Gabe Newell "Piracy is almost always a service problem…" — très citée, source vidéo Cambridge 2011 non retrouvée
- "If buying isn't owning, piracy isn't stealing" — phrase diffuse, origine non attribuable
- Prix exact PS4 avec P.T. sur eBay — Kotaku/IGN 2015, chiffre à vérifier

### Point juridique France — formulation validée
```
La loi DADVSI (2006) interdit de contourner les DRM — L.335-3-1 CPI, 3750€ d'amende.
La Cour de cassation (2008) a précisé que la copie privée (L.122-5) n'est pas un droit
invocable en justice — c'est une exception défensive, pas offensive.
Résultat : tu paies la redevance copie privée à chaque achat de support,
mais tu ne peux légalement pas l'exercer sur une œuvre protégée par DRM.
```
Ne pas simplifier en "le législateur a tranché" — c'est une déduction, pas un texte.

---

## Format des slides (Reveal.js)

### Structure HTML par slide
```html
<section [class="is-inter"]>
  <div class="hd">          <!-- header : numéro partie + tag couleur -->
  <div class="bd">          <!-- body : titre + bullets/quote/stats -->
  <div class="ft">          <!-- footer : 🍉 + note de prod + 🍉 -->
</section>
```

### Classes utilitaires disponibles
- `.title .lg/.md/.sm` — tailles Bebas Neue
- `.title .r/.g/.y` — colorisation rose/vert/jaune
- `.bullets` + `.bl` — liste avec icône monospace
- `.bl-txt em` → vert · `.bl-txt b` → rose · `.mn` → code inline
- `.two-col` — grille 2 colonnes
- `.timeline` + `.tl` — frise chronologique avec connecteur vertical
- `.quote` — citation avec bordure gauche rose
- `.box` / `.box.y` / `.box.r` — encadrés highlight vert/jaune/rouge
- `.stat-grid` + `.stat` — 3 cartes statistiques
- `.is-inter` — slide interlude centrée (séparateur de partie)
- `.src` — pill de source inline dans le texte

### Config Reveal.js obligatoire
```js
Reveal.initialize({
  center: false,   // CRITIQUE — sinon contenu centré verticalement
  margin: 0,
  transition: 'fade',
  transitionSpeed: 'fast',
});
```

### Fonts
- Display : `Bebas Neue`
- Body : `DM Sans` (weights 300/500/700)
- Mono : `DM Mono`

---

## Animations Motion Canvas

### Règles impératives

- **INTERDIT : `fill={'transparent'}`** — format non reconnu. Utiliser `fill={'#00000000'}` pour un fond sans couleur.
- Toutes les dimensions, positions et tailles de fonte doivent utiliser `vW()` / `vH()` (cf. mémoire projet).

---

## Notes de production (dans `.ft-note`)

Les pieds de slides contiennent des notes destinées à Alex uniquement (pas à l'audience). Exemples de patterns utiles :
- Signaler un bookend narratif à respecter
- Indiquer une décision de prod en attente (`[À COMPLÉTER]`)
- Rappeler une nuance à ne pas oublier à l'antenne
- Marquer les sources `⚠` à retrouver avant tournage
