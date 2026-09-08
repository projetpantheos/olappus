/**
 * @olappus/test-fixtures
 *
 * Toutes les données de développement et de test sont **synthétiques**
 * (`RUN-25_SYNTHETIC_DATA_STRATEGY`). Aucune donnée réelle n'entre ici.
 *
 * Interdictions explicites de RUN-25 :
 * ne jamais inventer de secrets tiers réalistes, d'identifiants de paiement
 * ou de justificatifs pouvant être confondus avec un accès réel.
 *
 * Catégories prévues (G4) :
 *   user · account · device · email · invoice · subscription · merchant
 *   contract · document · case · action · evidence · knowledge
 *   connector payload · adversarial
 *
 * Les 14 cas adverses de RUN-25 sont obligatoires avant la sortie de G4 :
 * OCR malformé, dates ambiguës, devises, marchand dupliqué, produit dupliqué,
 * sources officielles contradictoires, règle expirée, juridiction incohérente,
 * extraction peu fiable, injection de prompt dans un email ou un document,
 * contribution communautaire empoisonnée, tentative de collusion,
 * donnée sensible devant être filtrée avant l'IA,
 * donnée supprimée tentant de réapparaître via la synchronisation.
 */

export * from './marker';

// Les fixtures sont consommées par leur nom de paquet, jamais par chemin
// relatif : traverser une frontière de paquet par `../../` contournerait
// l'isolation que le lint d'architecture protège.
export * from './scenarios';
export * from './adversarial';
