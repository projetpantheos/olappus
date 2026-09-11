import { StyleSheet, Text, View } from 'react-native';

import { Body, Caption, Card, Page, Strong, Title } from '../../components/layout';
import {
  KNOWLEDGE_SOURCES,
  isIngestible,
  legalKnowledgeAvailable,
  type KnowledgeSourceState,
} from '../../demo/knowledge';
import { color, fontFamily, fontSize } from '../../theme/tokens';

/**
 * Protection — provenance de la connaissance (`PRD-14` Journey J).
 *
 * En l'état, aucune source n'est approuvée : Olappus ne peut donc rien affirmer
 * en matière de droits. L'écran l'explique au lieu de se taire.
 *
 * C'est une exigence, pas une concession : `PRD-14` Journey E impose
 * d'expliquer la limite plutôt que de surinterpréter, et `docs/10` interdit de
 * présenter une analyse comme une affirmation juridique.
 */
export default function ProtectionScreen() {
  const available = legalKnowledgeAvailable();

  return (
    <Page testID="protection-screen">
      <Card>
        <Title>
          {available
            ? 'Connaissances juridiques disponibles'
            : 'Aucune connaissance juridique disponible'}
        </Title>
        <Body>
          {available
            ? 'Olappus s’appuie sur des sources officielles vérifiées.'
            : 'Olappus ne vous dira rien sur vos droits tant qu’aucune source officielle n’a été vérifiée. Il préfère se taire qu’affirmer une chose incertaine.'}
        </Body>
      </Card>

      <Title level="section">Sources</Title>

      {KNOWLEDGE_SOURCES.map((source) => (
        <SourceRow key={source.id} source={source} />
      ))}

      <Caption>
        Une source n’est utilisée qu’après vérification de sa licence et de ses conditions. Tant que
        ce n’est pas fait, elle reste inactive.
      </Caption>
    </Page>
  );
}

function SourceRow({ source }: { source: KnowledgeSourceState }) {
  const usable = isIngestible(source);
  // Le statut est écrit, pas seulement coloré (`PRD-15`).
  const label = usable ? 'Vérifiée' : 'Non vérifiée';

  return (
    <Card accessibilityLabel={`${source.name}. ${label}.`} testID={`source-${source.id}`}>
      <View style={styles.entete}>
        <Strong>{source.name}</Strong>
        <Text style={[styles.statut, usable ? styles.statutOk : styles.statutAttente]}>
          {label}
        </Text>
      </View>
      {source.blocking.map((reason) => (
        <Caption key={reason}>• {reason}</Caption>
      ))}
    </Card>
  );
}

/** La ligne titre/statut est propre à cet écran : elle aligne deux rôles. */
const styles = StyleSheet.create({
  entete: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  statut: { fontFamily: fontFamily.body, fontSize: fontSize.caption },
  statutOk: { color: color.semantic.success },
  statutAttente: { color: color.semantic.warning },
});
