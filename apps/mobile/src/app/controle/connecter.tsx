import { ALLOWED_SCOPES, canCollectSensitiveData, missingBeforeCollection } from '@olappus/core';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '../../components/status-badge';
import { color, fontFamily, fontSize, radius, spacing } from '../../theme/tokens';

/**
 * Connexion d'un service — `PRD-14` Journey B.
 *
 * Quatre étapes imposées : expliquer pourquoi, montrer le scope minimal,
 * recueillir le consentement, éprouver la connexion.
 *
 * ## Le préalable qui n'est pas négociable
 *
 * `SEC-31` : « L'utilisateur est informé **avant** la collecte de la première
 * donnée sensible, pas au moment de la perte. » Cet écran refuse donc de
 * connecter quoi que ce soit tant que le secret de récupération n'est pas créé
 * **et** confirmé — et il dit ce qui manque plutôt que de griser un bouton
 * sans explication.
 *
 * C'est le même ordre que celui tenu depuis le début : construire la
 * protection avant la chose qu'elle protège.
 *
 * ## Le test de connexion
 *
 * Journey B se termine par une épreuve, pas par un message de succès. Annoncer
 * « connecté » sans avoir rien lu, c'est reporter la déception au premier
 * usage réel.
 */

export interface ConnecterProps {
  /** État du parcours de récupération. Rien n'est encore persisté (G6b). */
  readonly recovery?: { generated_at: string | null; acknowledged_at: string | null };
}

const SCOPES_DEMANDES = ALLOWED_SCOPES['google-synthetique'] ?? [];

const CE_QUE_CELA_PERMET = ['Repérer un achat récent et sa date', 'Retrouver le marchand concerné'];

const CE_QUI_RESTE_IMPOSSIBLE = [
  'Lire le contenu de vos messages',
  'Ouvrir vos pièces jointes',
  'Envoyer quoi que ce soit en votre nom',
];

export default function ConnecterScreen({
  recovery = { generated_at: null, acknowledged_at: null },
}: ConnecterProps = {}) {
  const [consenti, setConsenti] = useState(false);
  const [teste, setTeste] = useState(false);

  const pret = canCollectSensitiveData(recovery);
  const manquant = missingBeforeCollection(recovery);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID="connecter">
      <View style={styles.notice} accessibilityRole="summary" testID="pourquoi">
        <Text style={styles.noticeTitre}>Pourquoi connecter votre messagerie</Text>
        <Text style={styles.body}>
          Vos droits de consommateur naissent d’un achat : garantie, rétractation, résiliation. La
          trace d’un achat arrive presque toujours par courriel.
        </Text>
        <Text style={styles.body}>
          Sans cette connexion, Olappus ne peut que vous montrer des exemples. Avec elle, il regarde
          vos propres situations — et rien d’autre.
        </Text>
      </View>

      {!pret && (
        <View style={styles.prealable} accessibilityRole="alert" testID="prealable">
          <Text style={styles.prealableTitre}>Une chose doit être faite avant</Text>
          <Text style={styles.body}>
            Vos données seront chiffrées avec une clé qui n’appartient qu’à vous. Il faut donc
            qu’elle existe avant qu’elles arrivent — être prévenu après coup ne sert à rien.
          </Text>
          {manquant.map((phrase) => (
            <Text key={phrase} style={styles.manque}>
              • {phrase}
            </Text>
          ))}
          <Link href="/recuperation" asChild>
            <Pressable
              style={styles.cta}
              accessibilityRole="link"
              accessibilityLabel="Créer mon secret de récupération"
              testID="cta-recuperation"
            >
              <Text style={styles.ctaLabel}>Créer mon secret de récupération</Text>
            </Pressable>
          </Link>
        </View>
      )}

      <Text style={styles.sectionTitre} accessibilityRole="header">
        Ce que nous demandons, et rien de plus
      </Text>

      <View style={styles.scope} accessibilityRole="summary" testID="scope">
        <Text style={styles.scopeTitre}>
          {SCOPES_DEMANDES.length === 1
            ? 'Une seule autorisation'
            : `${String(SCOPES_DEMANDES.length)} autorisations`}
        </Text>
        {SCOPES_DEMANDES.map((scope) => (
          <Text key={scope} style={styles.scopeCode}>
            {scope}
          </Text>
        ))}

        <Text style={styles.libelle}>Ce que cela permet</Text>
        {CE_QUE_CELA_PERMET.map((element) => (
          <Text key={element} style={styles.detail}>
            • {element}
          </Text>
        ))}

        <Text style={styles.libelle}>Ce qui reste impossible</Text>
        {CE_QUI_RESTE_IMPOSSIBLE.map((element) => (
          <Text key={element} style={styles.detail}>
            • {element}
          </Text>
        ))}
      </View>

      <Text style={styles.footnote}>
        Cette liste n’est pas une intention : demander davantage est refusé par le code et par la
        base. Un accès plus large ne peut pas être enregistré, même par erreur.
      </Text>

      {pret && !consenti && (
        <Pressable
          style={styles.cta}
          onPress={() => {
            setConsenti(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Autoriser cet accès et connecter"
          testID="cta-consentir"
        >
          <Text style={styles.ctaLabel}>Autoriser cet accès</Text>
        </Pressable>
      )}

      {consenti && !teste && (
        <View style={styles.epreuve} accessibilityRole="summary" testID="epreuve">
          <Text style={styles.sectionTitre}>Éprouvons la connexion</Text>
          <Text style={styles.body}>
            Nous n’annonçons pas « connecté » avant d’avoir vérifié. Un succès annoncé sans preuve
            reporte simplement la déception au premier usage.
          </Text>
          <Pressable
            style={styles.cta}
            onPress={() => {
              setTeste(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Vérifier que la connexion fonctionne"
            testID="cta-tester"
          >
            <Text style={styles.ctaLabel}>Vérifier la connexion</Text>
          </Pressable>
        </View>
      )}

      {teste && (
        <View style={styles.resultat} accessibilityRole="summary" testID="resultat-test">
          <StatusBadge
            state="UNKNOWN"
            reason="Aucun fournisseur réel n’est encore branché : la vérification ne peut pas conclure."
            testID="etat-connexion"
          />
          <Text style={styles.body}>
            Le mécanisme fonctionne, la connexion réelle arrive avec le connecteur. Olappus préfère
            vous dire qu’il ne sait pas plutôt que d’afficher un succès qui n’en est pas un.
          </Text>
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
  noticeTitre: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.subtitle,
  },
  prealable: {
    backgroundColor: color.surface.white,
    borderColor: color.semantic.warning,
    borderRadius: radius.lg,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  prealableTitre: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.subtitle,
  },
  manque: { color: color.text.primary, fontFamily: fontFamily.body, fontSize: fontSize.body },
  sectionTitre: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  scope: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  scopeTitre: {
    color: color.text.primary,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  scopeCode: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
  },
  libelle: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  detail: { color: color.text.primary, fontFamily: fontFamily.body, fontSize: fontSize.body },
  footnote: {
    color: color.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: color.semantic.attention,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  ctaLabel: {
    color: color.surface.white,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
  epreuve: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  resultat: {
    backgroundColor: color.surface.white,
    borderColor: color.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  body: { color: color.text.secondary, fontFamily: fontFamily.body, fontSize: fontSize.body },
});
