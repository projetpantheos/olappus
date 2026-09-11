import { CAPABILITY_STATES, PERMISSION_LEVELS } from '@olappus/core';
import { fireEvent, render } from '@testing-library/react-native';

import { ActionSheet } from './action-sheet';
import { PermissionRow } from './permission-row';
import { ETATS, StatusBadge } from './status-badge';

/**
 * Composants de confiance — `PRD-15`, `PRD-14` Journeys G, H, I.
 *
 * `docs/UX_DESIGN_PLAN` §6 : « Les écrans qui décideront de la confiance sont
 * ceux de la permission, de la suppression et de la déconnexion. »
 *
 * Ces tests tiennent les cinq interdits de `PRD-15`. Ce ne sont pas des
 * contrôles esthétiques : chacun ferme une porte par laquelle une pression sur
 * un taux de conversion entrerait un jour.
 */

describe('StatusBadge — la couleur n’est jamais seule', () => {
  it.each(CAPABILITY_STATES)('écrit l’état %s en toutes lettres', async (etat) => {
    // Un rendu par test : deux rendus dans un même test font se chevaucher les
    // portées act() de React 19, et ce sont les tests suivants qui échouent.
    const { getByTestId } = await render(<StatusBadge state={etat} testID="badge" />);
    const libelle = getByTestId('badge').props.accessibilityLabel as string;
    expect(libelle.length).toBeGreaterThan(3);
    expect(libelle).not.toMatch(/^#|rgb|couleur/i);
  });

  it('donne un libellé distinct à chaque état', () => {
    // Vérifié sur la table plutôt que par quatre rendus : c'est une propriété
    // des données, pas du rendu. Notamment, « inconnu » ne se replie pas sur
    // « indisponible » — annoncer une certitude qu'on n'a pas, dans un sens
    // comme dans l'autre, est un mensonge.
    const libelles = CAPABILITY_STATES.map((etat) => ETATS[etat].label);
    expect(new Set(libelles).size).toBe(CAPABILITY_STATES.length);
    expect(ETATS.UNKNOWN.label).not.toBe(ETATS.BLOCKED.label);
  });

  it('porte sa raison dans le libellé accessible', async () => {
    const { getByTestId } = await render(
      <StatusBadge state="BLOCKED" reason="Aucune source officielle vérifiée." testID="badge" />,
    );
    expect(getByTestId('badge')).toHaveAccessibleName(
      'Indisponible. Aucune source officielle vérifiée.',
    );
  });
});

describe('ActionSheet — les sept éléments de PRD-15', () => {
  const proprietes = {
    action: 'Envoyer la demande de remboursement',
    recipient: 'Service client — Marchand SYNTHETIQUE',
    data: ['Votre numéro de commande', 'La date d’achat'],
    impact: 'Le marchand disposera de 14 jours pour répondre.',
    reversibility: 'Vous pouvez annuler tant que le message n’est pas parti.',
    permission: 'EXECUTE_WITH_CONFIRMATION' as const,
    onConfirm: () => undefined,
    onCancel: () => undefined,
  };

  it('affiche les sept éléments obligatoires', async () => {
    // `PRD-15` les énumère. Ils sont ici des propriétés requises : un
    // ActionSheet amputé de l'impact ou de la réversibilité ne compile pas.
    const { getByTestId, getAllByText } = await render(<ActionSheet {...proprietes} />);
    // Deux fois, et c'est voulu : en titre, puis sur le bouton qui l'exécute.
    expect(getAllByText(proprietes.action)).toHaveLength(2);
    for (const element of [
      'action-destinataire',
      'action-donnees',
      'action-impact',
      'action-reversibilite',
      'action-permission',
      'action-confirmer',
    ]) {
      expect(getByTestId(element)).toBeOnTheScreen();
    }
  });

  it('énumère les données envoyées, sans les résumer', async () => {
    // « Vos données » n'est pas une réponse à « qu'est-ce qui sort ? ».
    const { getByText } = await render(<ActionSheet {...proprietes} />);
    for (const donnee of proprietes.data) {
      expect(getByText(`• ${donnee}`)).toBeOnTheScreen();
    }
  });

  it('dit explicitement quand rien ne sort', async () => {
    const { getByText } = await render(<ActionSheet {...proprietes} data={[]} />);
    expect(getByText('Aucune donnée ne sort de votre appareil.')).toBeOnTheScreen();
  });

  it('nomme le bouton de confirmation par l’action', async () => {
    // Interdit de `PRD-15` : les boutons d'action ambiguës. « Continuer » et
    // « OK » laissent confirmer sans savoir quoi.
    const { getByTestId } = await render(<ActionSheet {...proprietes} />);
    expect(getByTestId('action-confirmer')).toHaveAccessibleName(proprietes.action);
    expect(getByTestId('action-confirmer').props.accessibilityLabel).not.toMatch(
      /^(continuer|ok|valider|suivant)$/i,
    );
  });

  it('offre un refus aussi lisible que l’acceptation', async () => {
    // Un bouton de refus effacé ou nommé « plus tard » est un dark pattern.
    const { getByTestId } = await render(<ActionSheet {...proprietes} />);
    expect(getByTestId('action-annuler')).toHaveAccessibleName('Ne rien faire');
  });

  it('n’agit que sur confirmation explicite', async () => {
    let confirme = 0;
    const { getByTestId } = await render(
      <ActionSheet
        {...proprietes}
        onConfirm={() => {
          confirme += 1;
        }}
      />,
    );
    expect(confirme).toBe(0);
    await fireEvent.press(getByTestId('action-confirmer'));
    expect(confirme).toBe(1);
  });

  it('traduit le niveau de permission en langage humain', async () => {
    const { getByTestId } = await render(<ActionSheet {...proprietes} />);
    expect(getByTestId('action-permission')).toHaveAccessibleName(
      'Permission : Exécution après votre confirmation',
    );
  });
});

describe('PermissionRow — ce qui reste impossible est dit aussi', () => {
  const proprietes = {
    level: 'READ' as const,
    title: 'Lire les en-têtes de vos courriels',
    allows: ['Repérer un achat récent', 'Retrouver une date de commande'],
    forbids: ['Lire le contenu des messages', 'Envoyer quoi que ce soit en votre nom'],
    granted: false,
    onToggle: () => undefined,
  };

  it('affiche les gains ET les limites', async () => {
    // Une demande qui n'énumère que des gains est une demande à laquelle on ne
    // peut pas répondre en connaissance de cause.
    const { getByText } = await render(<PermissionRow {...proprietes} />);
    expect(getByText('Ce que cela permet')).toBeOnTheScreen();
    expect(getByText('Ce qui reste impossible')).toBeOnTheScreen();
    for (const interdit of proprietes.forbids) {
      expect(getByText(`• ${interdit}`)).toBeOnTheScreen();
    }
  });

  it('écrit son état plutôt que de le colorer seulement', async () => {
    const { getByText } = await render(<PermissionRow {...proprietes} />);
    expect(getByText('Non accordée')).toBeOnTheScreen();
  });

  it('n’est jamais accordée par défaut', async () => {
    // Une case pré-cochée est un consentement qu'on n'a pas donné.
    const { getByTestId } = await render(<PermissionRow {...proprietes} testID="row" />);
    expect(getByTestId('row').props.accessibilityState.checked).toBe(false);
  });

  it('rend l’état lisible par un lecteur d’écran', async () => {
    const { getByTestId } = await render(<PermissionRow {...proprietes} granted testID="row" />);
    expect(getByTestId('row')).toHaveAccessibleName(`${proprietes.title}. Accordée.`);
  });

  it.each(PERMISSION_LEVELS)('accepte le niveau %s déclaré par le Core', async (niveau) => {
    // Si un niveau apparaissait dans le Core sans être accepté ici, l'écran
    // afficherait un champ vide au moment d'une demande de permission.
    const { getByTestId } = await render(
      <PermissionRow {...proprietes} level={niveau} testID="row" />,
    );
    expect(getByTestId('row').props.accessibilityLabel).toContain(proprietes.title);
  });
});
