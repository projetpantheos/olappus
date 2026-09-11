import { useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Bullet, Caption, Card, Page, Title } from '../../components/layout';
import { ScreenState } from '../../components/screen-state';
import { explain, findAttentionItem } from '../../demo/attention';
import { attentionStyle, confidenceLabel, fontFamily, fontSize } from '../../theme/tokens';

/**
 * Détail d'une situation — parcours `WHY → PROOF → OPTIONS → ACTION`
 * (`PRD-01`, `PRD-14` §6 et §14).
 *
 * Quatre exigences tenues ici :
 * 1. **WHY** : l'explication est chiffrée et provient de la règle, pas d'une
 *    formule décorative.
 * 2. **PROOF** : les preuves utilisées sont listées, avec la règle et sa
 *    version — sans elles, l'explication n'est pas reproductible.
 * 3. **CONFIDENCE** : affichée en langage humain, jamais en pourcentage inventé.
 * 4. **ACTION** : préparée, jamais exécutée. `PRD-01` : READ → SUGGEST →
 *    PREPARE → EXECUTE_WITH_CONFIRMATION, et aucune auto-exécution en P0.
 */
export default function CaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const item = useMemo(
    () =>
      id ? findAttentionItem(new Date('2026-09-08T00:00:00Z'), decodeURIComponent(id)) : undefined,
    [id],
  );

  if (!item) {
    return (
      <ScreenState kind="unknown" reason="Cette situation n’existe pas ou n’est plus disponible." />
    );
  }

  const style = attentionStyle[item.level];

  return (
    <Page testID="case-screen">
      <View>
        {/* Le niveau d'attention est écrit, jamais réduit à sa couleur (`PRD-15`). */}
        <Text style={[styles.niveau, { color: style.color }]}>{style.label}</Text>
        <Title level="page">{item.title}</Title>
        <Caption>Confiance : {confidenceLabel[item.detection.confidence]}</Caption>
      </View>

      <Section titre="Pourquoi">
        <Body>{explain(item.detection)}</Body>
      </Section>

      <Section titre="Preuves">
        {item.detection.evidence_refs.map((ref) => (
          <Body key={ref} testID={`evidence-${ref}`}>
            • {ref}
          </Body>
        ))}
        <Caption>
          Règle {item.detection.rule_id} (version {item.detection.rule_version})
        </Caption>
      </Section>

      <Section titre="Ce que cela implique">
        <Body>{item.scenario.what_the_user_should_understand}</Body>
      </Section>

      <Section titre="Options">
        <Bullet>Préparer une démarche</Bullet>
        <Bullet>Reporter à plus tard</Bullet>
        <Bullet>Ignorer cette situation</Bullet>
      </Section>

      {/* `PRD-15` : ne jamais présenter une action comme exécutable si elle ne
          l'est pas. Aucune action externe n'existe encore : le dire est plus
          honnête que d'afficher un bouton inerte. */}
      <Card>
        <Title>Aucune action n’est exécutée à ce stade</Title>
        <Body>
          Olappus prépare, vous confirmez. En mode démonstration, aucune démarche n’est réellement
          engagée.
        </Body>
      </Card>
    </Page>
  );
}

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <Card>
      <Title>{titre}</Title>
      {children}
    </Card>
  );
}

/** Le seul style propre à cet écran : le niveau d'attention, en tête. */
const styles = StyleSheet.create({
  niveau: { fontFamily: fontFamily.bodyStrong, fontSize: fontSize.caption },
});
