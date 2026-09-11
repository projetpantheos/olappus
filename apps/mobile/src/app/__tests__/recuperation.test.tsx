import { checkRecoverySecret } from '@olappus/core';
import { fireEvent, render } from '@testing-library/react-native';

import PerteScreen from '../recuperation/perte';
import RecuperationScreen from '../recuperation/index';

/**
 * Parcours de récupération — `SEC-31`, ADR-0008.
 *
 * Ce que ces tests protègent : la tentation, un jour de pression sur le taux de
 * conversion, de rendre la confirmation implicite ou d'adoucir le message de
 * perte. Les deux videraient ADR-0008 de son sens sans qu'aucun test de
 * chiffrement ne bronche.
 */

describe('Création du secret — un moment produit, pas un réglage', () => {
  it('prévient de la perte AVANT d’afficher le secret', async () => {
    // « L'utilisateur est informé avant la collecte de la première donnée
    // sensible, pas au moment de la perte » (SEC-31).
    const { getByText, queryByTestId } = await render(<RecuperationScreen />);
    expect(getByText(/définitivement perdues/)).toBeOnTheScreen();
    expect(queryByTestId('secret')).toBeNull();
  });

  it('dit qu’aucune copie n’existe chez nous', async () => {
    const { getByText } = await render(<RecuperationScreen />);
    expect(getByText(/aucune copie chez nous, même chiffrée/)).toBeOnTheScreen();
  });

  it('interdit toute connexion tant que rien n’est créé', async () => {
    const { getByText } = await render(<RecuperationScreen />);
    expect(getByText('Aucun service ne peut être connecté')).toBeOnTheScreen();
  });

  it('affiche un secret valide, en groupes numérotés', async () => {
    const { getByTestId, getAllByText } = await render(<RecuperationScreen />);
    await fireEvent.press(getByTestId('cta-creer'));

    const groupes = getAllByText(/^\d+\. [0-9A-Z]{5}$/);
    expect(groupes).toHaveLength(8);

    const secret = groupes.map((g) => String(g.props.children).replace(/^\d+\.\s*/, '')).join('');
    expect(checkRecoverySecret(secret).ok).toBe(true);
  });

  it('n’autorise toujours pas la connexion après simple affichage', async () => {
    // Le piège exact que SEC-31 vise : « l'écran a été vu » n'est pas « la
    // personne a mis son secret en sécurité ».
    const { getByTestId, getByText } = await render(<RecuperationScreen />);
    await fireEvent.press(getByTestId('cta-creer'));
    expect(getByText('Aucun service ne peut être connecté')).toBeOnTheScreen();
  });

  it('n’autorise la connexion qu’après confirmation explicite', async () => {
    const { getByTestId, getByText } = await render(<RecuperationScreen />);
    await fireEvent.press(getByTestId('cta-creer'));
    await fireEvent.press(getByTestId('cta-confirmer'));
    expect(getByText('Vous pouvez connecter un service')).toBeOnTheScreen();
  });

  it('déconseille les endroits où un secret finit par fuiter', async () => {
    const { getByTestId, getByText } = await render(<RecuperationScreen />);
    await fireEvent.press(getByTestId('cta-creer'));
    expect(getByText(/Pas dans une capture d’écran/)).toBeOnTheScreen();
  });
});

describe('Perte du secret — le compte revient, les données non', () => {
  it('annonce la distinction avant toute saisie', async () => {
    const { getByText } = await render(<PerteScreen />);
    expect(getByText('Retrouver son compte, retrouver ses données')).toBeOnTheScreen();
  });

  it('distingue une faute de recopie d’une perte réelle', async () => {
    // Sans cette distinction, une transposition de deux caractères ferait
    // croire à quelqu'un que ses données sont détruites.
    const { getByTestId, getByText } = await render(<PerteScreen />);
    await fireEvent.changeText(
      getByTestId('champ-secret'),
      'ABCDE-FGHJK-MNPQR-STVWX-YZ012-34567-89ABC-DEFGH',
    );
    await fireEvent.press(getByTestId('cta-verifier'));
    expect(getByText(/Ce n’est pas votre secret qui est perdu/)).toBeOnTheScreen();
  });

  it('signale une longueur fausse sans parler de perte', async () => {
    const { getByTestId, getByText } = await render(<PerteScreen />);
    await fireEvent.changeText(getByTestId('champ-secret'), 'ABCDE');
    await fireEvent.press(getByTestId('cta-verifier'));
    expect(getByText(/Il manque des caractères/)).toBeOnTheScreen();
  });

  it('énonce les deux issues séparément', async () => {
    const { getByTestId, getByText } = await render(<PerteScreen />);
    await fireEvent.press(getByTestId('cta-sans-secret'));
    expect(getByText('Compte : récupéré')).toBeOnTheScreen();
    expect(getByText('Données chiffrées : définitivement perdues')).toBeOnTheScreen();
  });

  it('ne laisse espérer aucun recours', async () => {
    // ADR-0008 : aucun escrow, aucune récupération de service. Suggérer de
    // contacter un support serait une cruauté, pas une délicatesse.
    const { getByTestId, getByText, queryByText } = await render(<PerteScreen />);
    await fireEvent.press(getByTestId('cta-sans-secret'));
    expect(getByText(/nous non plus/)).toBeOnTheScreen();
    expect(queryByText(/contactez|support|assistance|peut-être/i)).toBeNull();
  });

  it('explique pourquoi, au lieu de s’excuser', async () => {
    const { getByTestId, getByText } = await render(<PerteScreen />);
    await fireEvent.press(getByTestId('cta-sans-secret'));
    expect(getByText(/empêche quiconque d’y accéder sans vous/)).toBeOnTheScreen();
  });
});
