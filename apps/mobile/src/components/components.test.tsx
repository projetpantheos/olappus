import { render } from '@testing-library/react-native';

import type { AttentionItem } from '../demo/attention';
import { CaseCard } from './case-card';
import { ScreenState } from './screen-state';

/**
 * Tests d'accessibilité et d'états d'écran — tests d'acceptation P0 n°32, 34 et 35.
 *
 * Ce sont les deux tests que la carte des tests signalait comme **non couverts**
 * jusqu'au choix d'outillage. Ils vérifient deux exigences de `PRD-14` §18 et
 * `PRD-15` que rien d'autre ne peut garantir :
 *   - tout contrôle interactif porte un libellé accessible ;
 *   - la couleur n'est jamais le seul porteur d'un état.
 *
 * `render` est asynchrone depuis RNTL v14.
 */

const item = (level: AttentionItem['level']): AttentionItem => ({
  id: 'demo:regle',
  title: 'Votre abonnement a augmenté de 4 € par mois',
  level,
  detection: {
    rule_id: 'subscription.amount_increase',
    rule_version: '1.0.0',
    reason_code: 'SUBSCRIPTION_AMOUNT_INCREASED',
    subject: 'fournisseur-fictif-a',
    evidence_refs: ['ev-facture-juillet', 'ev-facture-aout'],
    confidence: 'CONFIRMED',
    details: { previous_amount_minor: 2990, new_amount_minor: 3390, delta_minor: 400 },
  },
  scenario: {
    id: 'demo-hausse-abonnement',
    title: 'Votre abonnement a augmenté de 4 € par mois',
    what_the_user_should_understand: 'Le prix a changé, de combien et depuis quand.',
    facts: [],
    _source: 'SYNTHETIC',
  },
});

describe('Carte d’attention — accessibilité', () => {
  it('expose un libellé accessible décrivant la situation entière', async () => {
    // Test d'acceptation n°34. Sans libellé, un lecteur d'écran devrait
    // parcourir les enfants et perdrait le niveau d'attention.
    const { getByRole } = await render(<CaseCard item={item('ACTION')} />);
    const card = getByRole('button');
    expect(card).toHaveAccessibleName(
      'Action recommandée. Votre abonnement a augmenté de 4 € par mois. Confiance : Vérifié.',
    );
  });

  it('annonce ce que fait l’appui', async () => {
    const { getByRole } = await render(<CaseCard item={item('URGENT')} />);
    expect(getByRole('button')).toHaveProp('accessibilityHint', 'Ouvre le détail de la situation');
  });

  it('affiche le niveau d’attention en toutes lettres, pas seulement en couleur', async () => {
    // Test d'acceptation n°35. Un utilisateur daltonien, ou un lecteur
    // d'écran, doit obtenir la même information que la pastille colorée.
    for (const [level, label] of [
      ['URGENT', 'Urgent'],
      ['ACTION', 'Action recommandée'],
      ['ATTENTION', 'À surveiller'],
      ['INFO', 'Information'],
    ] as const) {
      const { getByText } = await render(<CaseCard item={item(level)} />);
      expect(getByText(label)).toBeOnTheScreen();
    }
  });

  it('affiche la confiance en langage humain, sans pourcentage inventé', async () => {
    const { getByText, queryByText } = await render(<CaseCard item={item('ACTION')} />);
    expect(getByText('Vérifié')).toBeOnTheScreen();
    expect(queryByText(/\d+\s?%/)).toBeNull();
  });

  it('annonce le nombre de preuves', async () => {
    const { getByText } = await render(<CaseCard item={item('ACTION')} />);
    expect(getByText('2 preuves')).toBeOnTheScreen();
  });
});

describe('États d’écran — PRD-14 §15', () => {
  it('rend chacun des sept états', async () => {
    // Test d'acceptation n°32 : chaque écran doit définir ses états.
    for (const kind of [
      'loading',
      'empty',
      'error',
      'degraded',
      'offline',
      'blocked',
      'unknown',
    ] as const) {
      const { getByTestId } = await render(<ScreenState kind={kind} reason="Motif de test" />);
      expect(getByTestId(`screen-state-${kind}`)).toBeOnTheScreen();
    }
  });

  it('affiche toujours une raison pour un état bloqué', async () => {
    // PRD-15 : jamais d'état affiché sans explication compréhensible.
    const { getByText } = await render(
      <ScreenState kind="blocked" reason="Permission révoquée pour ce connecteur." />,
    );
    expect(getByText('Permission révoquée pour ce connecteur.')).toBeOnTheScreen();
  });

  it('dit qu’Olappus a regardé quand il n’y a rien', async () => {
    // Le silence est un comportement produit : l'écran vide doit rassurer,
    // pas laisser croire à une panne.
    const { getByText } = await render(<ScreenState kind="empty" />);
    expect(getByText(/n’a rien trouvé qui mérite votre attention/)).toBeOnTheScreen();
  });

  it('annonce le chargement au lecteur d’écran', async () => {
    const { getByLabelText } = await render(<ScreenState kind="loading" />);
    expect(getByLabelText('Chargement en cours')).toBeOnTheScreen();
  });
});
