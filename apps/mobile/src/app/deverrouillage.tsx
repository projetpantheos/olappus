import { checkRecoverySecret } from '@olappus/core';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { hasDeviceVault } from '../vault/secure-store';
import { color, fontFamily, fontSize, radius, spacing } from '../theme/tokens';

/**
 * Déverrouillage — `SEC-31`, `SEC-35`, ADR-0019.
 *
 * Deux choses que cet écran doit faire, et qu'un écran de mot de passe
 * ordinaire ne fait pas.
 *
 * **Annoncer l'attente.** La transformation du secret en clé est lente par
 * construction : c'est ce qui coûte cher à quelqu'un qui essaierait des
 * millions de combinaisons. Sur un téléphone modeste elle se compte en
 * secondes. Un écran figé pendant trois secondes passe pour une panne ; un
 * écran qui prévient passe pour un travail.
 *
 * **Dire où va la clé.** Sur téléphone, elle est rangée dans le coffre du
 * système et l'utilisateur n'aura pas à ressaisir son secret avant douze
 * heures. Sur le web, il n'y a pas de coffre : le secret sera redemandé, et
 * l'écran le dit plutôt que de le laisser découvrir.
 */

/** Ce qui ne va pas dans la saisie. Jamais un code d'erreur. */
const RAISONS: Readonly<Record<string, string>> = {
  length: 'Il manque des caractères, ou il y en a trop. Le secret en compte 40, en 8 groupes.',
  alphabet: 'Un caractère n’appartient pas au secret. Vérifiez votre recopie.',
  checksum:
    'Un caractère semble faux, ou deux ont été intervertis. Reprenez la saisie : ce n’est pas votre secret qui est en cause.',
};

/**
 * La dérivation est **injectée**, comme l'horloge des moteurs de règles.
 *
 * L'écran n'a pas à savoir comment une clé se calcule ; il doit savoir qu'elle
 * est lente et le dire. L'injection rend aussi l'attente éprouvable : sans
 * elle, l'état d'attente serait inatteignable en test, donc jamais vérifié —
 * et c'est précisément l'état où l'écran a le plus de chances de mal se tenir.
 */
export interface DeverrouillageProps {
  readonly onUnlock?: (canonical: string) => Promise<void>;
}

/** Par défaut, rien : la dérivation réelle arrive avec le connecteur (G6b). */
const NO_OP = (): Promise<void> => Promise.resolve();

export default function DeverrouillageScreen({ onUnlock = NO_OP }: DeverrouillageProps = {}) {
  const [saisie, setSaisie] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [ouvert, setOuvert] = useState(false);

  const coffre = hasDeviceVault();

  async function deverrouiller(): Promise<void> {
    const controle = checkRecoverySecret(saisie);
    if (!controle.ok) {
      // La vérification de forme est immédiate : inutile de faire patienter
      // quelqu'un trois secondes pour lui dire qu'il a oublié un caractère.
      setErreur(RAISONS[controle.reason] ?? 'Saisie non reconnue.');
      return;
    }
    setErreur(null);
    setEnCours(true);
    try {
      await onUnlock(controle.canonical);
      setOuvert(true);
    } catch {
      // Une clé qui n'ouvre pas est indiscernable d'un secret qui n'est pas le
      // bon : le dire autrement renseignerait un attaquant.
      setErreur('Ce secret n’ouvre pas ces données.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="deverrouillage-screen"
    >
      <View style={styles.notice} accessibilityRole="summary">
        <Text style={styles.noticeTitle}>Vos données sont verrouillées</Text>
        <Text style={styles.body}>
          Saisissez votre secret de récupération pour les rouvrir. Personne d’autre ne peut le faire
          à votre place — nous non plus.
        </Text>
      </View>

      <TextInput
        style={styles.input}
        value={saisie}
        onChangeText={setSaisie}
        placeholder="ABCDE-FGHJK-…"
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!enCours}
        accessibilityLabel="Votre secret de récupération"
        accessibilityHint="Les tirets, les espaces et la casse sont sans importance"
        testID="champ-secret"
      />

      {erreur !== null && (
        <View style={styles.erreur} accessibilityRole="alert" testID="erreur-saisie">
          <Text style={styles.body}>{erreur}</Text>
        </View>
      )}

      <Pressable
        style={[styles.cta, enCours && styles.ctaAttente]}
        onPress={() => void deverrouiller()}
        disabled={enCours}
        accessibilityRole="button"
        accessibilityState={{ disabled: enCours, busy: enCours }}
        accessibilityLabel="Déverrouiller mes données"
        testID="cta-deverrouiller"
      >
        <Text style={styles.ctaLabel}>{enCours ? 'Déverrouillage…' : 'Déverrouiller'}</Text>
      </Pressable>

      {enCours && (
        <View style={styles.attente} accessibilityRole="alert" testID="attente">
          <ActivityIndicator color={color.semantic.attention} />
          <Text style={styles.body}>
            Quelques secondes. Cette lenteur est voulue : c’est elle qui rend une attaque par essais
            successifs hors de portée.
          </Text>
        </View>
      )}

      <View style={styles.destination} accessibilityRole="summary" testID="destination-cle">
        <Text style={styles.statusTitle}>
          {coffre
            ? 'La clé restera dans le coffre de l’appareil'
            : 'Aucun coffre sur cette version'}
        </Text>
        <Text style={styles.body}>
          {coffre
            ? 'Rangée dans le coffre du système, elle ne quitte pas cet appareil et ne part dans aucune sauvegarde. Votre secret ne vous sera pas redemandé avant douze heures.'
            : 'La version web ne dispose d’aucun coffre sécurisé. Olappus n’y range pas de clé dans un stockage non protégé : votre secret vous sera redemandé à chaque session.'}
        </Text>
      </View>

      {ouvert && (
        <View style={styles.ouvert} accessibilityRole="summary" testID="ouvert">
          <Text style={styles.statusTitle}>Données déverrouillées</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: color.surface.ivory, flex: 1 },
  content: { gap: spacing.lg, padding: spacing.lg },
  notice: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  noticeTitle: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.subtitle,
  },
  input: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
    letterSpacing: 2,
    padding: spacing.lg,
  },
  erreur: {
    backgroundColor: color.surface.white,
    borderColor: color.semantic.warning,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: color.semantic.attention,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  ctaAttente: { backgroundColor: color.semantic.neutral },
  ctaLabel: {
    color: color.surface.white,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  attente: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  destination: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  ouvert: {
    backgroundColor: color.surface.white,
    borderColor: color.semantic.success,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  statusTitle: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  body: { color: color.text.secondary, fontFamily: fontFamily.body, fontSize: fontSize.body },
});
