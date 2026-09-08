import { fireEvent, render } from '@testing-library/react-native';

// Jest exige que les variables d une fabrique de mock soient prefixees
// par `mock` : garde contre les variables non initialisees au hoisting.
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));

import AccueilScreen from '../index';

/**
 * Ce test vit dans un dossier prefixe par _ : Expo Router ignore ces chemins,
 * sinon un fichier de test place dans src/app deviendrait une route et le
 * routeur tenterait de le charger au demarrage.
 *
 * Première valeur — `PRD-14` Journey A, tests d'acceptation P0 n°1 et n°2.
 *
 * Ce que ces tests protègent : la tentation, à chaque itération, d'ajouter
 * « juste une petite demande » à l'écran d'accueil. Le parcours exige
 * l'inverse — comprendre la valeur **avant** qu'on demande des données.
 */
describe('Écran de bienvenue', () => {
  it('porte la promesse du produit', async () => {
    const { getByText } = await render(<AccueilScreen />);
    expect(getByText('OLAPPUS')).toBeOnTheScreen();
    expect(getByText(/Et si les dieux étaient avec vous/)).toBeOnTheScreen();
  });

  it('mène à un exemple concret, sans permission ni connexion', async () => {
    // Test d'acceptation n°1 : entrer en Demo Mode sans permission externe.
    const { getByTestId } = await render(<AccueilScreen />);
    const cta = getByTestId('cta-demo');
    expect(cta).toHaveAccessibleName('Voir un exemple concret');
    expect(cta).toHaveProp(
      'accessibilityHint',
      'Ouvre le mode démonstration, sans connexion ni permission',
    );
  });

  it('ne demande aucune permission et le dit explicitement', async () => {
    // docs/03_UX_SPEC : ne pas demander huit permissions d'un coup. Ici, zéro —
    // et l'utilisateur doit pouvoir le lire, pas seulement le constater.
    const { getByText, queryByText } = await render(<AccueilScreen />);
    expect(
      getByText(/Aucune connexion, aucune permission, aucune donnée personnelle/),
    ).toBeOnTheScreen();
    expect(queryByText(/autoriser|connecter|se connecter|créer un compte/i)).toBeNull();
  });

  it('annonce le silence comme un comportement, pas comme une panne', async () => {
    const { getByText } = await render(<AccueilScreen />);
    expect(getByText(/Le silence est un comportement, pas une panne/)).toBeOnTheScreen();
  });

  it('annonce qu’aucune démarche n’est engagée sans confirmation', async () => {
    const { getByText } = await render(<AccueilScreen />);
    expect(getByText(/Il n’en engage aucune sans votre confirmation/)).toBeOnTheScreen();
  });
});

describe('Première valeur — la destination du parcours', () => {
  it('mène à l’écran Aujourd’hui, sans étape intermédiaire', async () => {
    // Vérifié par test plutôt que par clic manuel : une cible de navigation
    // fausse ne se voit qu'à l'usage, et le parcours de première valeur ne
    // supporte aucune étape en trop (PRD-14 Journey A).
    const { getByTestId } = await render(<AccueilScreen />);
    fireEvent.press(getByTestId('cta-demo'));
    expect(mockReplace).toHaveBeenCalledWith('/aujourdhui');
  });
});
