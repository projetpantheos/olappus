import { generateRecoverySecret } from '@olappus/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import DeverrouillageScreen from '../deverrouillage';

/**
 * Déverrouillage — `SEC-31`, `SEC-35`.
 *
 * Ce que ces tests protègent : la tentation d'accélérer la dérivation pour
 * rendre l'écran plus vif, et celle de ranger la clé « quelque part » sur une
 * plateforme qui n'a pas de coffre. Les deux échangeraient de la sécurité
 * contre du confort, sans que rien ne le signale.
 */

const secretValide = (): string =>
  generateRecoverySecret((n) => {
    // Aléa déterministe : ces tests éprouvent l'écran, pas le générateur.
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) out[i] = (i * 37 + 11) % 251;
    return out;
  });

describe('Déverrouillage — ce que l’écran dit avant d’agir', () => {
  it('annonce que les données sont verrouillées', async () => {
    const { getByText } = await render(<DeverrouillageScreen />);
    expect(getByText('Vos données sont verrouillées')).toBeOnTheScreen();
  });

  it('dit que personne ne peut déverrouiller à la place de l’utilisateur', async () => {
    const { getByText } = await render(<DeverrouillageScreen />);
    expect(getByText(/nous non plus/)).toBeOnTheScreen();
  });

  it('dit où ira la clé avant qu’on saisisse quoi que ce soit', async () => {
    // Sur le web il n'y a pas de coffre. Le dire d'avance vaut mieux que de
    // laisser découvrir que le secret est redemandé à chaque fois.
    const { getByTestId } = await render(<DeverrouillageScreen />);
    expect(getByTestId('destination-cle')).toBeOnTheScreen();
  });
});

describe('Saisie — la forme est vérifiée avant de faire patienter', () => {
  it('refuse immédiatement une saisie trop courte, sans attente', async () => {
    // Faire patienter trois secondes pour annoncer un caractère manquant
    // serait une lenteur sans contrepartie.
    const { getByTestId, getByText, queryByTestId } = await render(<DeverrouillageScreen />);
    await fireEvent.changeText(getByTestId('champ-secret'), 'ABCDE');
    await fireEvent.press(getByTestId('cta-deverrouiller'));
    expect(getByText(/Il manque des caractères/)).toBeOnTheScreen();
    expect(queryByTestId('attente')).toBeNull();
  });

  it('distingue une faute de recopie d’un secret en cause', async () => {
    const { getByTestId, getByText } = await render(<DeverrouillageScreen />);
    await fireEvent.changeText(
      getByTestId('champ-secret'),
      'ABCDE-FGHJK-MNPQR-STVWX-YZ012-34567-89ABC-DEFGH',
    );
    await fireEvent.press(getByTestId('cta-deverrouiller'));
    expect(getByText(/ce n’est pas votre secret qui est en cause/)).toBeOnTheScreen();
  });

  it('ouvre les données quand le secret est bon', async () => {
    const { getByTestId, queryByTestId } = await render(<DeverrouillageScreen />);
    await fireEvent.changeText(getByTestId('champ-secret'), secretValide());
    await fireEvent.press(getByTestId('cta-deverrouiller'));
    await waitFor(() => {
      expect(screen.getByTestId('ouvert')).toBeOnTheScreen();
    });
    expect(queryByTestId('erreur-saisie')).toBeNull();
  });
});

describe('L’attente est annoncée, pas subie', () => {
  /** Dérivation lente et contrôlée : c'est l'état d'attente qu'on observe. */
  function derivationLente(): {
    onUnlock: (canonical: string) => Promise<void>;
    terminer: () => void;
  } {
    let terminer = (): void => undefined;
    const attente = new Promise<void>((resolve) => {
      terminer = resolve;
    });
    return {
      onUnlock: () => attente,
      terminer: () => {
        terminer();
      },
    };
  }

  it('montre l’attente pendant la dérivation', async () => {
    const { onUnlock, terminer } = derivationLente();
    const { getByTestId } = await render(<DeverrouillageScreen onUnlock={onUnlock} />);
    await fireEvent.changeText(getByTestId('champ-secret'), secretValide());
    await fireEvent.press(getByTestId('cta-deverrouiller'));

    await waitFor(() => {
      expect(screen.getByTestId('attente')).toBeOnTheScreen();
    });
    terminer();
  });

  it('explique pourquoi c’est lent, au lieu de s’en excuser', async () => {
    // La lenteur EST la protection. Un écran qui s'excuse invite à la
    // supprimer ; un écran qui l'explique la rend défendable.
    const { onUnlock, terminer } = derivationLente();
    const { getByTestId } = await render(<DeverrouillageScreen onUnlock={onUnlock} />);
    await fireEvent.changeText(getByTestId('champ-secret'), secretValide());
    await fireEvent.press(getByTestId('cta-deverrouiller'));

    await waitFor(() => {
      expect(screen.getByText(/Cette lenteur est voulue/)).toBeOnTheScreen();
    });
    expect(screen.queryByText(/désolé|patience|veuillez patienter/i)).toBeNull();
    terminer();
  });

  it('empêche une seconde tentative pendant la première', async () => {
    const { onUnlock, terminer } = derivationLente();
    const { getByTestId } = await render(<DeverrouillageScreen onUnlock={onUnlock} />);
    await fireEvent.changeText(getByTestId('champ-secret'), secretValide());
    await fireEvent.press(getByTestId('cta-deverrouiller'));

    await waitFor(() => {
      expect(screen.getByTestId('cta-deverrouiller')).toBeDisabled();
    });
    expect(screen.getByTestId('cta-deverrouiller')).toHaveProp('accessibilityState', {
      disabled: true,
      busy: true,
    });
    terminer();
  });

  it('ne distingue pas un mauvais secret d’une clé qui n’ouvre pas', async () => {
    // Les distinguer renseignerait un attaquant sur ce qui existe.
    const { getByTestId, getByText } = await render(
      <DeverrouillageScreen onUnlock={() => Promise.reject(new Error('peu importe'))} />,
    );
    await fireEvent.changeText(getByTestId('champ-secret'), secretValide());
    await fireEvent.press(getByTestId('cta-deverrouiller'));
    await waitFor(() => {
      expect(getByText('Ce secret n’ouvre pas ces données.')).toBeOnTheScreen();
    });
  });
});
