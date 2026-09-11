import { ALLOWED_SCOPES, canCollectSensitiveData, missingBeforeCollection } from '@olappus/core';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import {
  Body,
  Bullet,
  Button,
  Caption,
  Card,
  Label,
  Page,
  Strong,
  Title,
} from '../../components/layout';
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

  return (
    <Page testID="connecter">
      <Card testID="pourquoi">
        <Title>Pourquoi connecter votre messagerie</Title>
        <Body>
          Vos droits de consommateur naissent d’un achat : garantie, rétractation, résiliation. La
          trace d’un achat arrive presque toujours par courriel.
        </Body>
        <Body>
          Sans cette connexion, Olappus ne peut que vous montrer des exemples. Avec elle, il regarde
          vos propres situations — et rien d’autre.
        </Body>
      </Card>

      {!pret && (
        <Card tone="warning" emphasis accessibilityRole="alert" testID="prealable">
          <Title>Une chose doit être faite avant</Title>
          <Body>
            Vos données seront chiffrées avec une clé qui n’appartient qu’à vous. Il faut donc
            qu’elle existe avant qu’elles arrivent — être prévenu après coup ne sert à rien.
          </Body>
          {missingBeforeCollection(recovery).map((phrase) => (
            <Bullet key={phrase}>{phrase}</Bullet>
          ))}
          <Link href="/recuperation" asChild>
            <Pressable
              style={styles.lien}
              accessibilityRole="link"
              accessibilityLabel="Créer mon secret de récupération"
              testID="cta-recuperation"
            >
              <Text style={styles.lienLabel}>Créer mon secret de récupération</Text>
            </Pressable>
          </Link>
        </Card>
      )}

      <Title level="section">Ce que nous demandons, et rien de plus</Title>

      <Card testID="scope">
        <Strong>
          {SCOPES_DEMANDES.length === 1
            ? 'Une seule autorisation'
            : `${String(SCOPES_DEMANDES.length)} autorisations`}
        </Strong>
        {SCOPES_DEMANDES.map((scope) => (
          <Caption key={scope}>{scope}</Caption>
        ))}

        <Label>Ce que cela permet</Label>
        {CE_QUE_CELA_PERMET.map((element) => (
          <Bullet key={element}>{element}</Bullet>
        ))}

        <Label>Ce qui reste impossible</Label>
        {CE_QUI_RESTE_IMPOSSIBLE.map((element) => (
          <Bullet key={element}>{element}</Bullet>
        ))}
      </Card>

      <Caption>
        Cette liste n’est pas une intention : demander davantage est refusé par le code et par la
        base. Un accès plus large ne peut pas être enregistré, même par erreur.
      </Caption>

      {pret && !consenti && (
        <Button
          label="Autoriser cet accès"
          onPress={() => {
            setConsenti(true);
          }}
          accessibilityLabel="Autoriser cet accès et connecter"
          testID="cta-consentir"
        />
      )}

      {consenti && !teste && (
        <Card testID="epreuve">
          <Title>Éprouvons la connexion</Title>
          <Body>
            Nous n’annonçons pas « connecté » avant d’avoir vérifié. Un succès annoncé sans preuve
            reporte simplement la déception au premier usage.
          </Body>
          <Button
            label="Vérifier la connexion"
            onPress={() => {
              setTeste(true);
            }}
            accessibilityLabel="Vérifier que la connexion fonctionne"
            testID="cta-tester"
          />
        </Card>
      )}

      {teste && (
        <Card testID="resultat-test">
          <StatusBadge
            state="UNKNOWN"
            reason="Aucun fournisseur réel n’est encore branché : la vérification ne peut pas conclure."
            testID="etat-connexion"
          />
          <Body>
            Le mécanisme fonctionne, la connexion réelle arrive avec le connecteur. Olappus préfère
            vous dire qu’il ne sait pas plutôt que d’afficher un succès qui n’en est pas un.
          </Body>
        </Card>
      )}
    </Page>
  );
}

/** Un lien d'apparence de bouton : `Button` ne sait pas naviguer. */
const styles = StyleSheet.create({
  lien: {
    alignItems: 'center',
    backgroundColor: color.semantic.attention,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  lienLabel: {
    color: color.surface.white,
    fontFamily: fontFamily.bodyStrong,
    fontSize: fontSize.body,
  },
});
