import { render } from '@testing-library/react-native';

import Index from './index';

/**
 * Premier test de rendu de l'application.
 *
 * Sa raison d'être immédiate est de prouver que la chaîne de test React Native
 * fonctionne : sans elle, les tests d'accessibilité 34 et 35 de `RUN-24`
 * resteraient non couverts, et la cible WCAG AA de `PRD-14` §18 serait une
 * intention invérifiable plutôt qu'un engagement.
 *
 * `render` est **asynchrone** depuis `@testing-library/react-native` v14 :
 * sans `await`, aucune requête n'est disponible et `screen` reste vide.
 */
describe('Écran d’attente', () => {
  it('affiche la promesse du produit', async () => {
    const { getByText } = await render(<Index />);
    expect(getByText(/Olappus/)).toBeOnTheScreen();
  });

  it('annonce la gate courante sans prétendre à une valeur produit', async () => {
    const { getByText } = await render(<Index />);
    expect(getByText(/Gate G1/)).toBeOnTheScreen();
  });

  it('expose son texte au lecteur d’écran', async () => {
    // PRD-14 §18 : l'information ne doit jamais dépendre d'un seul canal.
    // Un composant Text est nativement accessible ; ce test garantit qu'aucune
    // refonte ne le rendra silencieux sans qu'on le voie.
    const { getByText } = await render(<Index />);
    expect(getByText(/Et si les dieux étaient avec vous/)).toBeOnTheScreen();
  });
});
