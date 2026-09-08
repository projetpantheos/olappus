# OLAPPUS DESIGN SYSTEM

<!-- AUTHORITY-BANNER -->
> **Statut : CHECKLIST** — la direction artistique fait foi, mais **les valeurs de couleur font foi dans `compiled_decisions/product/16_DESIGN_TOKENS.json`**. Voir `docs/DEPRECATION_MAP.md`.


## Direction artistique
**Fusion entre héritage grec antique et technologie contemporaine.**

Mots-clés :
- sobre ;
- lumineux ;
- minéral ;
- rassurant ;
- intemporel ;
- solide ;
- précis ;
- élégant sans ostentation ;
- bien-être ;
- confiance.

Référence principale : `references/olappus_da_light_reference.png`.
Ancienne référence sombre : `references/poseidon_dark_reference.png`.

## Signature
**« Et si les dieux étaient avec vous ? »**

## Base neutre
- Background principal : `#F7F4EC` (ivoire chaud).
- Surface : `#FFFDFC`.
- Texte primaire : `#17252A`.
- Texte secondaire : `#53636A`.
- Bordure : `#D9D5CC`.
- Ombre : très légère, jamais noire dure.

## Couleurs thématiques
### 🌿 Santé & bien-être — Olive
- Primary `#526B4A`
- Dark `#3F5439`
- Soft `#DCE5D7`
- Usage : santé, nutrition, animaux, bien-être, hygiène.

### 🪙 Finance & patrimoine — Bronze/Cuivre
- Primary `#7A4E22` (cuivre/bronze sombre, fonctionnel)
- Accent `#A86F45` (cuivre clair, surfaces et graphiques)
- Antique gold `#B28A4A` uniquement décoratif
- Silver/pewter `#5F666B` (argent patiné, secondaire et lisible sur clair)
- Soft `#EEE1D2`
- Usage : budget, abonnements, économies, patrimoine, prix.

Ne pas utiliser le doré clair comme texte sur fond clair ; il manque de contraste. Le bronze/cuivre sombre ou l'argent patiné portent les informations fonctionnelles ; l'or antique reste un accent premium.

### 🛡️ Protection & sécurité — Bleu profond
- Primary `#24556A`
- Dark `#163E4E`
- Soft `#DCE9ED`
- Usage : protection consommateur, sécurité, garanties, contrats, preuves, confiance.

### 🔮 Organisation & temps — Lavande
- Primary `#655B7A`
- Dark `#4E465F`
- Soft `#E8E3ED`
- Usage : agenda, échéances, objectifs, productivité, mémoire structurée.

### 🏺 Maison & quotidien — Terracotta
- Primary `#7C4332`
- Accent `#9A553E` (surfaces et graphiques uniquement)
- Soft `#F0DED7`
- Usage : logement, travaux, achats maison, vie quotidienne, foyer.

> **Corrigé le 2026-09-08 (D9).** La version précédente donnait `#9A553E` comme couleur primaire, avec un contraste d'environ 4,35:1 sur `#F7F4EC` — sous le seuil WCAG AA de 4,5:1 pour le texte normal, alors que AA est la cible affichée. `compiled_decisions/product/16_DESIGN_TOKENS.json` fait foi : `home.primary = #7C4332`, `#9A553E` en accent non textuel.

### 🌊 Voyages & loisirs — Bleu Égée
- Primary `#2E6F82`
- Dark `#1F5667`
- Soft `#DDECEF`
- Usage : voyages, sorties, activités, mobilité légère.

## Contrastes indicatifs sur #F7F4EC
- Olive : ~5.37:1.
- Bronze : ~6.50:1.
- Bleu profond : ~7.40:1.
- Lavande : ~5.74:1.
- Terracotta `#7C4332` : à mesurer (l'ancienne valeur `#9A553E`, ~4.35:1, échouait au seuil AA pour le texte normal).
- Bleu Égée : ~5.15:1.

Les contrastes doivent être re-testés dans le composant final ; ne pas se fier uniquement aux hexadécimaux.

## Typographie
- Titres / identité : serif élégante de type Cinzel, mais utiliser une police libre adaptée à la distribution si Cinzel n'est pas choisie.
- Corps : Inter ou équivalent sans-serif libre.
- Les titres ne doivent pas devenir théâtraux.

## Iconographie
Ligne fine, géométrie calme. Motifs grecs : colonne, laurier, trident, olivier, soleil, vagues. Les motifs mythologiques sont secondaires aux icônes fonctionnelles.

## Composants
Cartes arrondies modérées, espacement généreux, pas de “glassmorphism” excessif, états actifs avec teinte thématique, profondeur minimale.

## Motion
Micro-animations discrètes. Aucun effet spectaculaire qui augmente la distraction.
