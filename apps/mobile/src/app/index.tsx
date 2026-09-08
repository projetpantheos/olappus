import { StyleSheet, Text, View } from 'react-native';

/**
 * Écran d'attente de la gate G1.
 *
 * Il ne présente aucune donnée et n'appelle aucun service : à ce stade,
 * la seule chose à démontrer est que l'application se construit et démarre.
 * Le premier écran réel est Hélios, construit en G4 sur des fixtures
 * synthétiques, sans aucun appel externe.
 */
export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Olappus</Text>
      <Text style={styles.promise}>« Et si les dieux étaient avec vous ? »</Text>
      <Text style={styles.gate}>Gate G1 — socle technique</Text>
    </View>
  );
}

// Couleurs issues de PRD-16_DESIGN_TOKENS.json. Elles seront remplacées
// par le système de thème en G4 ; aucune valeur ne doit être inventée ici.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: '#F7F4EC',
  },
  title: {
    fontSize: 34,
    fontWeight: '600',
    color: '#17252A',
  },
  promise: {
    fontSize: 16,
    textAlign: 'center',
    color: '#53636A',
  },
  gate: {
    fontSize: 12,
    color: '#53636A',
  },
});
