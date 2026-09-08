/**
 * Jetons de design — dérivés de `PRD-16_DESIGN_TOKENS.json`.
 *
 * Aucune valeur n'est inventée ici : chacune vient du fichier de jetons, qui
 * fait foi (`docs/DEPRECATION_MAP`). Le thème sombre est `OPEN` (OPEN-01) :
 * aucun composant ne doit supposer son existence.
 */

export const color = {
  surface: {
    ivory: '#F7F4EC',
    white: '#FFFDFC',
  },
  text: {
    primary: '#17252A',
    secondary: '#53636A',
  },
  border: {
    default: '#D9D5CC',
  },
  // Rôles sémantiques. `PRD-16` : les couleurs encodent une sémantique,
  // jamais un module seul.
  semantic: {
    success: '#526B4A', // health.primary
    warning: '#7A4E22', // finance.primary
    attention: '#24556A', // protection.primary
    critical: '#7C4332', // home.primary — corrigé par D9, contraste AA
    neutral: '#53636A',
  },
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const fontSize = {
  caption: 12,
  body: 16,
  subtitle: 18,
  title: 24,
  display: 34,
} as const;

/**
 * Correspondance niveau d'attention → rôle sémantique **et** libellé.
 *
 * `PRD-15` interdit que la couleur soit le seul porteur d'un état. Chaque
 * niveau porte donc un libellé textuel, et les composants doivent l'afficher —
 * un test le vérifie.
 */
export const attentionStyle = {
  URGENT: { color: color.semantic.critical, label: 'Urgent' },
  ACTION: { color: color.semantic.warning, label: 'Action recommandée' },
  ATTENTION: { color: color.semantic.attention, label: 'À surveiller' },
  INFO: { color: color.semantic.neutral, label: 'Information' },
  SILENCE: { color: color.semantic.neutral, label: 'Rien à signaler' },
} as const;

/**
 * Libellés de confiance en langage humain.
 *
 * `docs/03_UX_SPEC` : ne pas donner l'illusion d'une précision mathématique
 * injustifiée. « 87 % » serait une invention ; « À confirmer » est honnête.
 */
export const confidenceLabel = {
  CONFIRMED: 'Vérifié',
  HIGH_CONFIDENCE: 'Très probable',
  PROBABLE: 'Probable',
  UNCERTAIN: 'À confirmer',
  INSUFFICIENT_DATA: 'Données insuffisantes',
} as const;

/**
 * Familles typographiques — `docs/04` et planche de direction artistique.
 *
 * Cinzel porte l'identité et les titres d'écran. `docs/04` prévient : « les
 * titres ne doivent pas devenir théâtraux » — elle ne descend donc jamais dans
 * le corps de texte, qui reste en Inter pour la lisibilité.
 */
export const fontFamily = {
  display: 'Cinzel_600SemiBold',
  body: 'Inter_400Regular',
  bodyStrong: 'Inter_600SemiBold',
} as const;
