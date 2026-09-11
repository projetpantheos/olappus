import {
  RECOVERY_GROUPS,
  canCollectSensitiveData,
  generateRecoverySecret,
  platformRandom,
} from '@olappus/core';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { color, fontFamily, fontSize, radius, spacing } from '../../theme/tokens';

/**
 * Création du secret de récupération — `SEC-31`, ADR-0008.
 *
 * `SEC-31` en fait « un moment produit à part entière, avec confirmation de
 * mise en sécurité ». Ce n'est donc pas un réglage caché : c'est un écran qui
 * précède toute connexion, et qui demande une action délibérée.
 *
 * Trois choses y sont dites avant que le secret n'apparaisse, parce qu'après
 * il est trop tard pour les entendre : ce que le secret protège, ce qui arrive
 * si on le perd, et pourquoi nous ne pouvons pas aider.
 */
export default function RecuperationScreen() {
  const [secret, setSecret] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [acknowledgedAt, setAcknowledgedAt] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  const pret = canCollectSensitiveData({
    generated_at: generatedAt,
    acknowledged_at: acknowledgedAt,
  });

  function creer(): void {
    try {
      setSecret(generateRecoverySecret(platformRandom()));
      setGeneratedAt(new Date().toISOString());
    } catch {
      // Aucun repli sur un aléa non cryptographique : un secret faible
      // donnerait l'apparence d'une protection (ADR-0017).
      setUnavailable(
        'Cet appareil ne fournit pas le générateur nécessaire. Olappus préfère ne rien créer plutôt que de créer un secret faible.',
      );
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="recuperation-screen"
    >
      <View style={styles.notice} accessibilityRole="summary">
        <Text style={styles.noticeTitle}>Votre secret de récupération</Text>
        <Text style={styles.body}>
          Vos données sensibles sont chiffrées avec une clé dérivée de ce secret. Il n’en existe
          aucune copie chez nous, même chiffrée.
        </Text>
        <Text style={styles.body}>
          Si vous le perdez, ces données sont définitivement perdues. Nous ne pouvons pas les
          restaurer — c’est précisément ce qui empêche quiconque d’y accéder sans vous.
        </Text>
      </View>

      {unavailable !== null && (
        <View style={styles.blocked} accessibilityRole="alert">
          <Text style={styles.body}>{unavailable}</Text>
        </View>
      )}

      {secret === null ? (
        <Pressable
          style={styles.cta}
          onPress={creer}
          accessibilityRole="button"
          accessibilityLabel="Créer mon secret de récupération"
          accessibilityHint="Affiche un secret à noter et à conserver hors de l’appareil"
          testID="cta-creer"
        >
          <Text style={styles.ctaLabel}>Créer mon secret de récupération</Text>
        </Pressable>
      ) : (
        <>
          <View style={styles.secretBox} accessibilityRole="summary" testID="secret">
            <Text style={styles.secretLabel}>
              Notez ces {RECOVERY_GROUPS} groupes, dans l’ordre
            </Text>
            {secret.split('-').map((groupe, index) => (
              <Text key={groupe} style={styles.group}>
                {`${String(index + 1)}. ${groupe}`}
              </Text>
            ))}
          </View>

          <Text style={styles.footnote}>
            Sur papier, ou dans un gestionnaire de mots de passe. Pas dans une capture d’écran, pas
            dans un message : ces endroits ne sont pas faits pour ça.
          </Text>

          <Pressable
            style={[styles.cta, acknowledgedAt !== null && styles.ctaDone]}
            onPress={() => {
              setAcknowledgedAt(new Date().toISOString());
            }}
            accessibilityRole="button"
            accessibilityState={{ checked: acknowledgedAt !== null }}
            accessibilityLabel="J’ai mis mon secret en sécurité"
            testID="cta-confirmer"
          >
            <Text style={styles.ctaLabel}>
              {acknowledgedAt !== null ? 'Confirmé' : 'J’ai mis mon secret en sécurité'}
            </Text>
          </Pressable>
        </>
      )}

      <View style={styles.status} accessibilityRole="summary" testID="statut-collecte">
        <Text style={styles.statusTitle}>
          {pret ? 'Vous pouvez connecter un service' : 'Aucun service ne peut être connecté'}
        </Text>
        <Text style={styles.body}>
          {pret
            ? 'Vos données sensibles seront chiffrées dès leur arrivée.'
            : 'Olappus ne collecte aucune donnée sensible tant que votre secret n’est pas créé et mis en sécurité. L’ordre compte : être prévenu après la perte ne sert à rien.'}
        </Text>
      </View>
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
  blocked: {
    backgroundColor: color.surface.white,
    borderColor: color.semantic.critical,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  secretBox: {
    backgroundColor: color.surface.white,
    borderColor: color.semantic.attention,
    borderRadius: radius.lg,
    borderWidth: 2,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  secretLabel: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
    marginBottom: spacing.sm,
  },
  group: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.subtitle,
    letterSpacing: 2,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: color.semantic.attention,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  ctaDone: { backgroundColor: color.semantic.success },
  ctaLabel: {
    color: color.surface.white,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  status: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  statusTitle: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  body: { color: color.text.secondary, fontFamily: fontFamily.body, fontSize: fontSize.body },
  footnote: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
  },
});
