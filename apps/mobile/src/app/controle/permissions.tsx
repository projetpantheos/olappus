import type { PermissionLevel } from '@olappus/core';
import { useState } from 'react';

import { ActionSheet } from '../../components/action-sheet';
import { Body, Caption, Card, Page, Title } from '../../components/layout';
import { PermissionRow } from '../../components/permission-row';
import { NIVEAUX_PROPOSES } from '../../demo/controle';

/**
 * Permission — `PRD-14` Journey G.
 *
 * Le parcours commence par une action **bloquée**, et c'est le bon ordre : on
 * ne demande pas une permission « pour plus tard », on la demande au moment où
 * elle sert, pour une chose précise. Une demande hors contexte n'est pas une
 * demande, c'est une collecte.
 *
 * Le niveau exact est demandé, pas un accord global. Et `AUTO_EXECUTE`
 * n'est pas proposé : `docs/10` veut qu'aucune action externe ne parte sans
 * confirmation, et offrir le niveau reviendrait à inviter à s'en passer.
 */
export default function PermissionsScreen() {
  const [accorde, setAccorde] = useState<PermissionLevel | null>(null);
  const [execute, setExecute] = useState(false);

  return (
    <Page testID="permissions">
      <Card tone="warning" emphasis accessibilityRole="alert" testID="action-bloquee">
        <Title>Cette action est bloquée</Title>
        <Body>
          Olappus a repéré un abonnement dont le prix a augmenté, et sait rédiger la demande de
          résiliation. Il ne peut rien faire de plus sans votre accord.
        </Body>
      </Card>

      <Card testID="pourquoi">
        <Title>Pourquoi cet accord est nécessaire</Title>
        <Body>
          Envoyer une demande engage quelque chose en votre nom. Nous ne le ferons jamais sans que
          vous ayez dit jusqu’où vous allez.
        </Body>
      </Card>

      <Title level="section">Jusqu’où Olappus peut aller</Title>

      {NIVEAUX_PROPOSES.map((option) => (
        <PermissionRow
          key={option.niveau}
          level={option.niveau}
          title={option.titre}
          allows={option.permet}
          forbids={option.interdit}
          granted={accorde === option.niveau}
          onToggle={(niveau) => {
            setAccorde(accorde === niveau ? null : niveau);
            setExecute(false);
          }}
          testID={`niveau-${option.niveau}`}
        />
      ))}

      <Caption testID="auto-execute-absent">
        L’exécution automatique, sans confirmation, n’est pas proposée. Olappus n’engage jamais une
        démarche que vous n’avez pas vue partir.
      </Caption>

      {accorde !== null && !execute && (
        <ActionSheet
          action="Envoyer la demande de résiliation"
          recipient="Service client — Marchand de démonstration"
          data={['Votre numéro de contrat', 'La date de la hausse constatée']}
          impact="Le marchand disposera du délai légal pour répondre."
          reversibility="Vous pouvez annuler tant que le message n’est pas parti."
          permission={accorde}
          onConfirm={() => {
            setExecute(true);
          }}
          onCancel={() => {
            setAccorde(null);
          }}
          testID="feuille-action"
        />
      )}

      {execute && (
        <Card tone="success" testID="journal-audit">
          <Title>Inscrit au journal</Title>
          <Body>
            La demande est partie, et la trace en est conservée : quoi, quand, sur quelle
            autorisation. Ce journal est anonymisé à la clôture et ne peut pas être réécrit — il
            existe pour vous, pas pour nous.
          </Body>
        </Card>
      )}
    </Page>
  );
}
