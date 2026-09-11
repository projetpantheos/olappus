import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import ConnecterScreen from '../controle/connecter';

/**
 * Connexion d'un service — `PRD-14` Journey B.
 *
 * Ce que ces tests protègent : l'ordre. Il serait plus simple, et bien meilleur
 * pour un taux de conversion, de connecter d'abord et de parler du secret de
 * récupération ensuite. `SEC-31` l'interdit, et rien d'autre que ces tests ne
 * le vérifierait — aucune suite de chiffrement ne bronche si l'ordre s'inverse.
 *
 * Rappel : un seul `render` par test, chaque `fireEvent` attendu
 * (`apps/mobile/AGENTS.md`).
 */

const PRET = {
  generated_at: '2026-09-11T10:00:00Z',
  acknowledged_at: '2026-09-11T10:02:00Z',
};

describe('Journey B — expliquer avant de demander', () => {
  it('dit pourquoi la connexion sert, avant tout le reste', async () => {
    const { getByTestId } = await render(<ConnecterScreen />);
    expect(getByTestId('pourquoi')).toBeOnTheScreen();
  });

  it('dit aussi ce qu’Olappus vaut sans connexion', async () => {
    // Une explication qui ne présente que l'avantage de céder est un argument
    // de vente, pas une information.
    const { getByText } = await render(<ConnecterScreen />);
    expect(getByText(/ne peut que vous montrer des exemples/)).toBeOnTheScreen();
  });

  it('montre le scope demandé et ce qu’il ne permet pas', async () => {
    const { getByText } = await render(<ConnecterScreen />);
    expect(getByText('Ce qui reste impossible')).toBeOnTheScreen();
    expect(getByText('• Lire le contenu de vos messages')).toBeOnTheScreen();
  });

  it('dit que la limite est tenue par le code, pas par une intention', async () => {
    const { getByText } = await render(<ConnecterScreen />);
    expect(getByText(/refusé par le code et par la base/)).toBeOnTheScreen();
  });
});

describe('Journey B — l’ordre imposé par SEC-31', () => {
  it('refuse de connecter tant que le secret n’existe pas', async () => {
    // Il serait plus simple de connecter d'abord. C'est précisément pour cela
    // que ce test existe.
    const { getByTestId, queryByTestId } = await render(<ConnecterScreen />);
    expect(getByTestId('prealable')).toBeOnTheScreen();
    expect(queryByTestId('cta-consentir')).toBeNull();
  });

  it('énonce ce qui manque, au lieu de griser un bouton', async () => {
    const { getByText } = await render(<ConnecterScreen />);
    expect(getByText('• Aucun secret de récupération n’a été créé.')).toBeOnTheScreen();
  });

  it('explique pourquoi cet ordre, pas seulement qu’il existe', async () => {
    const { getByText } = await render(<ConnecterScreen />);
    expect(getByText(/être prévenu après coup ne sert à rien/)).toBeOnTheScreen();
  });

  it('mène là où l’on peut lever le blocage', async () => {
    const { getByTestId } = await render(<ConnecterScreen />);
    expect(getByTestId('cta-recuperation')).toBeOnTheScreen();
  });

  it('n’autorise le consentement qu’une fois le secret confirmé', async () => {
    const { getByTestId, queryByTestId } = await render(<ConnecterScreen recovery={PRET} />);
    expect(queryByTestId('prealable')).toBeNull();
    expect(getByTestId('cta-consentir')).toBeOnTheScreen();
  });

  it('ne suffit pas d’avoir affiché le secret : il faut l’avoir confirmé', async () => {
    const { getByTestId } = await render(
      <ConnecterScreen
        recovery={{ generated_at: '2026-09-11T10:00:00Z', acknowledged_at: null }}
      />,
    );
    expect(getByTestId('prealable')).toBeOnTheScreen();
  });
});

describe('Journey B — éprouver plutôt qu’annoncer', () => {
  it('propose une vérification après le consentement', async () => {
    const { getByTestId } = await render(<ConnecterScreen recovery={PRET} />);
    await fireEvent.press(getByTestId('cta-consentir'));
    await waitFor(() => {
      expect(screen.getByTestId('cta-tester')).toBeOnTheScreen();
    });
  });

  it('n’annonce jamais « connecté » sans avoir vérifié', async () => {
    // Un succès annoncé sans preuve reporte la déception au premier usage réel.
    const { getByTestId, queryByText } = await render(<ConnecterScreen recovery={PRET} />);
    await fireEvent.press(getByTestId('cta-consentir'));
    await waitFor(() => {
      expect(screen.getByTestId('epreuve')).toBeOnTheScreen();
    });
    expect(queryByText(/^Connecté$/)).toBeNull();
  });

  it('dit qu’il ne sait pas, plutôt que d’afficher un faux succès', async () => {
    const { getByTestId, getByText } = await render(<ConnecterScreen recovery={PRET} />);
    await fireEvent.press(getByTestId('cta-consentir'));
    await waitFor(() => {
      expect(screen.getByTestId('cta-tester')).toBeOnTheScreen();
    });
    await fireEvent.press(screen.getByTestId('cta-tester'));
    await waitFor(() => {
      expect(screen.getByTestId('resultat-test')).toBeOnTheScreen();
    });
    expect(getByText(/plutôt que d’afficher un succès qui n’en est pas un/)).toBeOnTheScreen();
  });
});
