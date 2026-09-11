# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Tests d'écran — deux pièges qui coûtent cher

La bibliothèque de test React Native 14 avec React 19 ouvre une portée `act()`
à chaque rendu et à chaque événement. Deux conséquences, constatées trois fois
sur ce dépôt les 9 et 11 septembre 2026 :

1. **`await` chaque `fireEvent`.** Sans cela la portée reste ouverte, et ce
   sont les tests **suivants** qui échouent — loin de la cause, avec un message
   sans rapport (« Unable to find an element with testID… »).

2. **Un seul `render` par test.** Une boucle qui rend plusieurs variantes dans
   un même test fait se chevaucher les portées et casse tout le fichier.
   Utiliser `it.each`, ou vérifier la propriété sur les données plutôt que sur
   le rendu quand c'en est une.

Le symptôme commun est `console.error: You seem to have overlapping act() calls`
au milieu d'échecs qui semblent n'avoir aucun rapport. Le chercher d'abord.
