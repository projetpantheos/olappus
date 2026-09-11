import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import ConnexionsScreen from '../controle/connexions';
import DonneesScreen from '../controle/donnees';
import PermissionsScreen from '../controle/permissions';

/**
 * Les trois parcours qui décident de la confiance — `PRD-14` Journeys G, H, I.
 *
 * Ce que ces tests protègent : chacun ferme une porte par laquelle un produit
 * dérive. Déconnecter en laissant croire qu'on a supprimé. Supprimer en
 * demandant qu'on vous croie sur parole. Demander une permission globale plutôt
 * que le niveau exact. Aucune de ces dérives ne fait échouer un test de
 * sécurité — elles se voient seulement ici.
 *
 * Rappel : un seul `render` par test, et chaque `fireEvent` attendu
 * (voir `apps/mobile/AGENTS.md`).
 */

describe('Journey I — se déconnecter n’est pas supprimer', () => {
  it('le dit avant de faire choisir', async () => {
    // Beaucoup de gens croient que retirer un accès efface ce qui en a été
    // tiré. Laisser cette croyance, c'est laisser quelqu'un penser qu'il a
    // effacé ses données alors qu'elles sont toujours là.
    const { getByText } = await render(<ConnexionsScreen />);
    expect(getByText('Se déconnecter n’est pas supprimer')).toBeOnTheScreen();
  });

  it('montre ce que l’accès permet, pas seulement son nom', async () => {
    const { getByText } = await render(<ConnexionsScreen />);
    expect(getByText(/sans lire le contenu/)).toBeOnTheScreen();
  });

  it('ne présélectionne aucune des deux issues', async () => {
    // Une option cochée d'avance oriente une décision qui n'appartient qu'à
    // l'utilisateur.
    const { getByTestId } = await render(<ConnexionsScreen />);
    expect(getByTestId('choix-conserver').props.accessibilityState.checked).toBe(false);
    expect(getByTestId('choix-supprimer').props.accessibilityState.checked).toBe(false);
  });

  it('empêche de déconnecter avant d’avoir choisi', async () => {
    const { getByTestId } = await render(<ConnexionsScreen />);
    expect(getByTestId('cta-deconnecter')).toBeDisabled();
  });

  it('annonce la perte sur l’option qui supprime', async () => {
    const { getByText } = await render(<ConnexionsScreen />);
    expect(getByText(/C’est sans retour./)).toBeOnTheScreen();
  });

  it('déconnecte une fois le choix fait', async () => {
    const { getByTestId } = await render(<ConnexionsScreen />);
    await fireEvent.press(getByTestId('choix-conserver'));
    await fireEvent.press(getByTestId('cta-deconnecter'));
    await waitFor(() => {
      expect(screen.getByTestId('resultat')).toBeOnTheScreen();
    });
  });

  it('dit que l’effacement des jetons est une contrainte, pas une promesse', async () => {
    const { getByTestId, getByText } = await render(<ConnexionsScreen />);
    await fireEvent.press(getByTestId('choix-supprimer'));
    await fireEvent.press(getByTestId('cta-deconnecter'));
    await waitFor(() => {
      expect(getByText(/la base refuse/)).toBeOnTheScreen();
    });
  });
});

describe('Journey H — supprimer, puis le prouver', () => {
  it('dit ce que chaque catégorie contient et ce que sa perte change', async () => {
    const { getByText } = await render(<DonneesScreen />);
    expect(getByText('Situations et décisions')).toBeOnTheScreen();
    expect(getByText(/Olappus oublie ce qu’il a compris/)).toBeOnTheScreen();
  });

  it('dit qu’un journal s’anonymise au lieu de disparaître', async () => {
    // Il doit rester vérifiable pour protéger l'utilisateur : le supprimer
    // servirait celui qui aurait agi en son nom.
    const { getByText } = await render(<DonneesScreen />);
    expect(getByText(/anonymisé, pas effacé/)).toBeOnTheScreen();
  });

  it('n’affiche la confirmation qu’après une sélection', async () => {
    const { queryByTestId } = await render(<DonneesScreen />);
    expect(queryByTestId('confirmation')).toBeNull();
  });

  it('exige deux gestes pour une suppression sans retour', async () => {
    // Un geste unique se déclenche par inadvertance ; ici il n'y a pas de
    // retour en arrière.
    const { getByTestId } = await render(<DonneesScreen />);
    await fireEvent.press(getByTestId('categorie-situations'));
    await fireEvent.press(getByTestId('cta-supprimer'));
    await waitFor(() => {
      expect(screen.getByTestId('cta-supprimer')).toHaveAccessibleName(
        'Supprimer définitivement, sans retour possible',
      );
    });
    expect(screen.queryByTestId('verification')).toBeNull();
  });

  it('propose d’exporter avant de supprimer', async () => {
    const { getByTestId } = await render(<DonneesScreen />);
    await fireEvent.press(getByTestId('categorie-situations'));
    await waitFor(() => {
      expect(screen.getByTestId('cta-exporter')).toBeOnTheScreen();
    });
  });

  it('énumère ce qui a été vérifié après suppression', async () => {
    // Supprimer sans montrer ce qui a été supprimé, c'est demander qu'on vous
    // croie sur parole au moment où l'on n'a plus de raison de le faire.
    const { getByTestId, getByText } = await render(<DonneesScreen />);
    await fireEvent.press(getByTestId('categorie-situations'));
    await fireEvent.press(getByTestId('cta-supprimer'));
    await fireEvent.press(getByTestId('cta-supprimer'));
    await waitFor(() => {
      expect(getByText('✓ Base de données principale')).toBeOnTheScreen();
    });
  });

  it('énumère aussi ce qu’il ne peut PAS vérifier', async () => {
    // `SEC-33` recense douze emplacements, six existent. Annoncer une purge
    // complète serait la promesse la plus grave que ce produit puisse rompre.
    const { getByTestId, getByText } = await render(<DonneesScreen />);
    await fireEvent.press(getByTestId('categorie-situations'));
    await fireEvent.press(getByTestId('cta-supprimer'));
    await fireEvent.press(getByTestId('cta-supprimer'));
    await waitFor(() => {
      expect(getByText('Ce que nous ne pouvons pas encore vérifier')).toBeOnTheScreen();
    });
    expect(getByText('Sauvegardes')).toBeOnTheScreen();
  });
});

describe('Journey G — le niveau exact, au moment où il sert', () => {
  it('part d’une action bloquée, pas d’une demande hors contexte', async () => {
    // Une demande de permission hors contexte n'est pas une demande, c'est une
    // collecte.
    const { getByTestId } = await render(<PermissionsScreen />);
    expect(getByTestId('action-bloquee')).toBeOnTheScreen();
  });

  it('explique le besoin avant de demander', async () => {
    const { getByTestId } = await render(<PermissionsScreen />);
    expect(getByTestId('pourquoi')).toBeOnTheScreen();
  });

  it('ne propose jamais l’exécution automatique', async () => {
    // `docs/10` : aucune action externe sans confirmation. Offrir le niveau
    // reviendrait à inviter à s'en passer.
    const { queryByTestId, getByText } = await render(<PermissionsScreen />);
    expect(queryByTestId('niveau-AUTO_EXECUTE')).toBeNull();
    expect(
      getByText(/L’exécution automatique, sans confirmation, n’est pas proposée/),
    ).toBeOnTheScreen();
  });

  it('n’affiche la feuille d’action qu’après un niveau accordé', async () => {
    const { queryByTestId } = await render(<PermissionsScreen />);
    expect(queryByTestId('feuille-action')).toBeNull();
  });

  it('montre la feuille d’action complète une fois le niveau choisi', async () => {
    const { getByTestId } = await render(<PermissionsScreen />);
    await fireEvent.press(getByTestId('niveau-EXECUTE_WITH_CONFIRMATION'));
    await waitFor(() => {
      expect(screen.getByTestId('feuille-action')).toBeOnTheScreen();
    });
    expect(screen.getByTestId('action-reversibilite')).toBeOnTheScreen();
  });

  it('inscrit au journal après exécution', async () => {
    const { getByTestId } = await render(<PermissionsScreen />);
    await fireEvent.press(getByTestId('niveau-PREPARE'));
    await waitFor(() => {
      expect(screen.getByTestId('action-confirmer')).toBeOnTheScreen();
    });
    await fireEvent.press(screen.getByTestId('action-confirmer'));
    await waitFor(() => {
      expect(screen.getByTestId('journal-audit')).toBeOnTheScreen();
    });
  });

  it('dit que le journal ne peut pas être réécrit', async () => {
    const { getByTestId } = await render(<PermissionsScreen />);
    await fireEvent.press(getByTestId('niveau-PREPARE'));
    await waitFor(() => {
      expect(screen.getByTestId('action-confirmer')).toBeOnTheScreen();
    });
    await fireEvent.press(screen.getByTestId('action-confirmer'));
    await waitFor(() => {
      expect(screen.getByText(/ne peut pas être réécrit/)).toBeOnTheScreen();
    });
  });
});
