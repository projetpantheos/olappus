import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react-native';
import { parse } from 'yaml';

import { KNOWLEDGE_SOURCES, INGESTIBLE_STATUSES } from '../../demo/knowledge';
import ProtectionScreen from '../(tabs)/protection';

/**
 * Provenance — `PRD-14` Journey J, et visibilité du License Gate.
 *
 * Deux choses sont vérifiées ici, et la seconde est la plus importante :
 * l'écran dit la vérité, **et** cette vérité ne diverge pas du registre de
 * sources. Deux vérités sur le même sujet en produisent toujours une fausse.
 */

interface SourceRegistry {
  readonly ingestible_statuses: readonly string[];
  readonly sources: readonly { source_id: string; status: string }[];
}

const registry = parse(
  readFileSync(
    join(__dirname, '..', '..', '..', '..', '..', 'governance', 'source_registry.yaml'),
    'utf8',
  ),
) as SourceRegistry;

describe('Provenance — l’écran et le registre disent la même chose', () => {
  it('affiche exactement les sources du registre', () => {
    expect(KNOWLEDGE_SOURCES.map((s) => s.id).sort()).toEqual(
      registry.sources.map((s) => s.source_id).sort(),
    );
  });

  it('reprend le statut réel de chaque source', () => {
    const shown = KNOWLEDGE_SOURCES.map((s) => `${s.id}=${s.status}`).sort();
    const declared = registry.sources.map((s) => `${s.source_id}=${s.status}`).sort();
    expect(shown).toEqual(declared);
  });

  it('reprend les statuts ouvrant l’ingestion', () => {
    expect([...INGESTIBLE_STATUSES].sort()).toEqual([...registry.ingestible_statuses].sort());
  });
});

describe('Provenance — ce que l’écran dit à l’utilisateur', () => {
  it('annonce qu’aucune connaissance juridique n’est disponible', async () => {
    // Le License Gate devient visible. Un produit qui protège doit expliquer
    // ce qu'il ne sait pas encore, plutôt que d'afficher une page vide.
    const { getByText } = await render(<ProtectionScreen />);
    expect(getByText('Aucune connaissance juridique disponible')).toBeOnTheScreen();
  });

  it('explique le silence plutôt que de le subir', async () => {
    const { getByText } = await render(<ProtectionScreen />);
    expect(getByText(/préfère se taire qu’affirmer une chose incertaine/)).toBeOnTheScreen();
  });

  it('énonce ce qui manque, en langage compréhensible', async () => {
    const { getAllByText } = await render(<ProtectionScreen />);
    const blocked = getAllByText(/Licence non vérifiée à la source primaire/);
    expect(blocked.length).toBe(KNOWLEDGE_SOURCES.length);
  });

  it('écrit le statut de chaque source, sans le réduire à une couleur', async () => {
    // PRD-15 : la couleur n'est jamais le seul porteur d'un état.
    const { getAllByText, getByTestId } = await render(<ProtectionScreen />);
    expect(getAllByText('Non vérifiée').length).toBe(KNOWLEDGE_SOURCES.length);
    expect(getByTestId('source-legifrance')).toHaveAccessibleName('Légifrance. Non vérifiée.');
  });

  it('n’affiche aucune affirmation juridique', async () => {
    // docs/10 : ne jamais présenter une analyse comme une affirmation de droit.
    const { queryByText } = await render(<ProtectionScreen />);
    expect(queryByText(/vous avez droit|la loi prévoit|vous pouvez exiger/i)).toBeNull();
  });
});
