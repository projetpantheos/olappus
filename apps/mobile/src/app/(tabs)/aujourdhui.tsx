import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { CaseCard } from '../../components/case-card';
import { Body, Caption, Page } from '../../components/layout';
import { ScreenState } from '../../components/screen-state';
import { demoAttentionItems } from '../../demo/attention';

/**
 * Hélios — « Aujourd'hui ».
 *
 * `PRD-01` : l'inbox d'attention répond à « qu'est-ce qui mérite mon attention
 * maintenant ? ». Ce n'est ni un tableau de bord de modules, ni un chatbot.
 *
 * `PRD-01` encore : **si rien d'important n'est détecté, Olappus reste
 * silencieux**. L'écran vide n'est donc pas un échec à masquer, c'est le
 * comportement attendu — et il dit qu'Olappus a bien regardé.
 *
 * La source est le Demo Mode : mêmes objets métier, mêmes moteurs
 * déterministes, aucun appel externe.
 */
export default function TodayScreen() {
  const router = useRouter();

  // L'horloge est figée par scénario : l'écran doit être reproductible, sinon
  // son contenu changerait sans explication d'un jour à l'autre.
  const items = useMemo(() => demoAttentionItems(new Date('2026-09-08T00:00:00Z')), []);

  if (items.length === 0) {
    return <ScreenState kind="empty" />;
  }

  return (
    <Page testID="today-screen">
      {/* L'en-tête d'onglet porte déjà « Aujourd'hui ». Le répéter coûtait une
          bande entière au-dessus de la ligne de flottaison — défaut corrigé en
          G5 sur trois écrans, et oublié sur celui-ci jusqu'au 2026-09-11. */}
      <Body>
        {items.length} situation{items.length > 1 ? 's' : ''} méritent votre attention.
      </Body>

      {items.map((item) => (
        <CaseCard
          key={item.id}
          item={item}
          onPress={() => router.push(`/case/${encodeURIComponent(item.id)}`)}
        />
      ))}

      <Caption>Mode démonstration : ces situations reposent sur des données synthétiques.</Caption>
    </Page>
  );
}
