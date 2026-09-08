# UX SPEC

## Objectif

Créer une application qui diminue la charge mentale, pas une app de plus à consulter.

## Navigation

Bottom navigation recommandée :

- Aujourd'hui
- Protection
- Mémoire
- Plus

Bouton global : `+ Ajouter`.

Les noms grecs peuvent apparaître dans les titres de modules, mais les libellés fonctionnels restent compréhensibles sans connaissance de la mythologie.

## Premier lancement

Ne pas demander 8 permissions d'un coup.

Étape 1 : promesse.
Étape 2 : exemple synthétique.
Étape 3 : importer 1 document ou 3 emails de test.
Étape 4 : montrer la valeur détectée.
Étape 5 : proposer la connexion Gmail/Calendar au contexte où elle devient utile.
Étape 6 : expliquer exactement ce qui sera lu, stocké, supprimé et pourquoi.

## Hélios

Structure :

- salutation ;
- état global ;
- carte principale de contexte ;
- à traiter ;
- à surveiller ;
- opportunités ;
- dernières synchronisations.

## Carte d'insight

Toujours afficher : titre, importance, source, date, confiance, raison courte, CTA.

## “Pourquoi ?”

Afficher une chaîne explicable :
`Source → fait détecté → règle → comparaison → conséquence → confiance`.

## “Prouver”

Lister les preuves utilisées. Permettre de retirer une preuve et de recalculer l'analyse.

## “Agir”

Afficher : action, impact attendu, données qui seront envoyées, destinataire, réversibilité, confirmation.

## Notifications

- Urgent : immédiat.
- Important : digest.
- Information : silencieux.
- Regroupement par cas.
- Limite douce configurable par l'utilisateur.

## Accessibilité

Contraste AA minimum pour texte et contrôles importants. Les couleurs ne doivent jamais être l'unique porteur du sens. Taille de police dynamique, zones tactiles confortables, états loading/empty/error/offline.

## État de confiance

Utiliser un langage humain : “Vérifié”, “Probable”, “À confirmer”, “Information contradictoire”. Ne pas donner l'illusion d'une précision mathématique injustifiée.
