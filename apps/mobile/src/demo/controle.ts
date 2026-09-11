/**
 * « Mon contrôle » — `PRD-14` Journeys G, H, I.
 *
 * Ces trois parcours décident de la confiance : permission, suppression,
 * déconnexion. Les données ci-dessous sont synthétiques — aucune connexion
 * réelle n'existe avant G6b — mais **les limites qu'elles décrivent sont
 * vraies**, et c'est ce qui compte.
 *
 * En particulier : la liste de ce que la suppression vérifie, et de ce qu'elle
 * ne peut pas encore vérifier, reprend l'inventaire de `SEC-33` tel qu'il est
 * réellement implémenté aujourd'hui. Annoncer une purge complète alors que six
 * emplacements sur douze existent serait la promesse la plus grave que ce
 * produit puisse rompre.
 */

export interface Connexion {
  readonly id: string;
  readonly fournisseur: string;
  readonly scopes: readonly { intitule: string; permet: string }[];
  readonly connecteLe: string;
}

export const CONNEXIONS: readonly Connexion[] = [
  {
    id: 'google-synthetique',
    fournisseur: 'Compte de démonstration',
    scopes: [
      {
        intitule: 'En-têtes de messages',
        permet: 'Repérer un achat et sa date, sans lire le contenu.',
      },
    ],
    connecteLe: '2026-09-11',
  },
];

/** Ce que la déconnexion fait, et ne fait pas. Journey I l'exige explicitement. */
export const DECONNEXION_CHOIX = [
  {
    id: 'conserver',
    titre: 'Déconnecter, et conserver ce qui a été compris',
    consequence:
      'Vos situations en cours restent lisibles. Olappus cesse d’aller chercher quoi que ce soit de nouveau.',
    perte: 'Rien n’est supprimé.',
  },
  {
    id: 'supprimer',
    titre: 'Déconnecter, et supprimer tout ce qui en vient',
    consequence: 'Olappus se coupe de la source et efface ce qu’il en avait tiré.',
    perte: 'Les situations issues de cette source disparaissent. C’est sans retour.',
  },
] as const;

export type ChoixDeconnexion = (typeof DECONNEXION_CHOIX)[number]['id'];

export interface CategorieDonnees {
  readonly id: string;
  readonly titre: string;
  readonly contenu: string;
  readonly impactSuppression: string;
  readonly exportable: boolean;
}

export const CATEGORIES: readonly CategorieDonnees[] = [
  {
    id: 'situations',
    titre: 'Situations et décisions',
    contenu: 'Ce qu’Olappus a repéré, la règle appliquée et les preuves retenues.',
    impactSuppression: 'Olappus oublie ce qu’il a compris. Les mêmes situations pourront revenir.',
    exportable: true,
  },
  {
    id: 'connexions',
    titre: 'Connexions à des services',
    contenu: 'Les accès accordés, chiffrés, et leur date.',
    impactSuppression: 'Les accès sont révoqués. Il faudra les redonner pour reconnecter.',
    exportable: false,
  },
  {
    id: 'journal',
    titre: 'Journal des actions',
    contenu: 'Ce qui a été fait en votre nom, quand, et sur quelle autorisation.',
    impactSuppression:
      'Le journal est anonymisé, pas effacé : il doit rester vérifiable pour vous protéger.',
    exportable: true,
  },
];

/**
 * Ce que la suppression vérifie réellement, emplacement par emplacement.
 *
 * `SEC-33` en recense douze. Six existent aujourd'hui. Les six autres ne sont
 * pas « en cours de vérification » : ils **n'existent pas encore**, et le dire
 * vaut mieux que de laisser croire à une purge complète.
 */
export const VERIFICATION_SUPPRESSION = {
  verifies: [
    'Base de données principale',
    'Situations, preuves et résultats liés',
    'Connexions et accès chiffrés',
    'Charges brutes en quarantaine',
    'Références croisées entre tables',
    'Journal d’audit, anonymisé et non effacé',
  ],
  nonVerifiables: [
    {
      emplacement: 'Sauvegardes',
      pourquoi:
        'La durée après laquelle une donnée supprimée disparaît de toutes les copies n’est pas encore fixée. Nous ne l’annoncerons pas tant qu’elle ne le sera pas.',
    },
    {
      emplacement: 'Copie locale sur l’appareil',
      pourquoi: 'Le fonctionnement hors ligne n’existe pas encore : il n’y a rien à purger.',
    },
  ],
} as const;

export interface NiveauPermission {
  readonly niveau: 'READ' | 'SUGGEST' | 'PREPARE' | 'EXECUTE_WITH_CONFIRMATION' | 'AUTO_EXECUTE';
  readonly titre: string;
  readonly permet: readonly string[];
  readonly interdit: readonly string[];
}

/**
 * Les niveaux proposés pour une action donnée.
 *
 * `AUTO_EXECUTE` n'y figure pas, et son absence est une décision : `docs/10`
 * et `PRD-12` veulent qu'aucune action externe ne parte sans confirmation.
 * Offrir le niveau reviendrait à inviter à s'en passer.
 */
export const NIVEAUX_PROPOSES: readonly NiveauPermission[] = [
  {
    niveau: 'READ',
    titre: 'Regarder seulement',
    permet: ['Repérer une situation', 'Vous l’expliquer avec ses preuves'],
    interdit: ['Préparer quoi que ce soit', 'Contacter qui que ce soit'],
  },
  {
    niveau: 'PREPARE',
    titre: 'Préparer, sans envoyer',
    permet: ['Rédiger la demande à votre place', 'Vous la montrer avant tout envoi'],
    interdit: ['Envoyer sans votre accord', 'Modifier le destinataire'],
  },
  {
    niveau: 'EXECUTE_WITH_CONFIRMATION',
    titre: 'Envoyer, après votre confirmation',
    permet: ['Envoyer la demande une fois que vous avez dit oui'],
    interdit: ['Envoyer sans confirmation', 'Recommencer seul en cas d’échec'],
  },
];
