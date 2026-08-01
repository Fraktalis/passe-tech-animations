# 🎬 Motion Canvas – Animations Passe-Tech

Animations Motion Canvas utilisées dans les vidéos YouTube [Passe-Tech](https://www.youtube.com/@passe-tech) 🍉.

## 📂 Contenu

- **`src/scenes/`** — Scènes Motion Canvas (`.tsx`), une par séquence animée.
- **`src/components/`** — Composants réutilisables entre scènes.
- **`src/img/`** — Icônes, images et éléments graphiques utilisés dans les animations.
- **`src/theme.ts`** — Palette et constantes visuelles de la charte Passe-Tech.
- **`src/project.ts`** / **`src/project.meta`** — Config du projet Motion Canvas.
- **`src/applyRecursivelyToPath.ts`** — Utilitaire pour appliquer une transformation à un chemin SVG/vectoriel de façon récursive.
- **`passe_tech_kit_html_css.html`** — Kit de marque (HTML/CSS) : couleurs, typographies, éléments d'identité visuelle Passe-Tech.

## 🚀 Utilisation

```bash
npm install
npm run start
```

Ouvrir l'URL locale fournie par Vite. Modifier ou créer une scène dans `src/scenes/`.

Build de production :

```bash
npm run build
```

## 🎨 Pourquoi Motion Canvas ?

Coder les animations plutôt que les monter dans After Effects les rend versionnables, réutilisables d'une vidéo à l'autre, et cohérentes avec l'identité "ingénierie" de la chaîne.

## 🤝 Contribution

Dépôt personnel, pas de process de contribution externe à ce stade.

## 📜 Licence

Le code de ce dépôt (`src/`, config) est sous licence **MIT** — voir [`LICENSE`](./LICENSE).

Le kit de marque Passe-Tech (`passe_tech_kit_html_css.html`, logo, identité visuelle) n'est **pas couvert par cette licence** et reste protégé par le droit d'auteur : tous droits réservés.
