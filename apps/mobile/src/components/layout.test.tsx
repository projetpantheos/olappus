import { fireEvent, render } from '@testing-library/react-native';

import { Body, Bullet, Button, Caption, Card, Label, Page, Strong, Title } from './layout';
import { fontSize } from '../theme/tokens';

/**
 * Primitives de mise en page.
 *
 * Ces tests ne vérifient pas une apparence — ils vérifient que les primitives
 * ne permettent pas de contourner les interdits de `PRD-15`, et que la
 * hiérarchie typographique existe réellement au lieu d'être déclarée.
 *
 * Rappel : un seul `render` par test, chaque `fireEvent` attendu
 * (`apps/mobile/AGENTS.md`).
 */

describe('Hiérarchie typographique — quatre paliers distincts', () => {
  it.each([
    ['page', fontSize.title],
    ['section', fontSize.section],
    ['card', fontSize.subtitle],
  ] as const)('le titre de niveau %s a sa propre taille', async (niveau, taille) => {
    const { getByTestId } = await render(
      <Title level={niveau} testID="titre">
        Un titre
      </Title>,
    );
    expect(getByTestId('titre').props.style.fontSize).toBe(taille);
  });

  it('sépare réellement les titres du corps de texte', async () => {
    // Avant le 2026-09-11, les titres de section étaient en `body` : l'œil
    // n'avait aucun palier entre le titre d'écran et le texte courant.
    const { getByTestId } = await render(
      <>
        <Title level="section" testID="titre">
          Section
        </Title>
        <Body testID="corps">Texte</Body>
      </>,
    );
    expect(getByTestId('titre').props.style.fontSize).toBeGreaterThan(
      getByTestId('corps').props.style.fontSize,
    );
  });

  it('réserve la serif d’affichage au titre d’écran', async () => {
    // `docs/04` : « les titres ne doivent pas devenir théâtraux ». Une serif
    // répétée dix fois par écran l'est.
    const { getByTestId, unmount } = await render(
      <Title level="page" testID="t">
        Écran
      </Title>,
    );
    expect(getByTestId('t').props.style.fontFamily).toContain('Cinzel');
    unmount();
  });

  it('n’emploie pas la serif d’affichage pour un titre de carte', async () => {
    const { getByTestId } = await render(
      <Title level="card" testID="t">
        Carte
      </Title>,
    );
    expect(getByTestId('t').props.style.fontFamily).not.toContain('Cinzel');
  });

  it('rend les titres lisibles par un lecteur d’écran', async () => {
    const { getByTestId } = await render(<Title testID="titre">Un titre</Title>);
    expect(getByTestId('titre').props.accessibilityRole).toBe('header');
  });
});

describe('Card — le ton appuie, il ne porte jamais seul', () => {
  it('rend son contenu quel que soit le ton', async () => {
    const { getByText } = await render(
      <Card tone="critical">
        <Body>Ce texte porte le sens.</Body>
      </Card>,
    );
    expect(getByText('Ce texte porte le sens.')).toBeOnTheScreen();
  });

  it('n’expose aucun libellé accessible tiré de la seule couleur', async () => {
    // Une carte dont l'état ne serait lisible que par sa bordure serait un
    // état invisible pour un lecteur d'écran, et pour un daltonien.
    const { getByTestId } = await render(
      <Card tone="warning" testID="carte">
        <Body>Texte</Body>
      </Card>,
    );
    expect(getByTestId('carte').props.accessibilityLabel).toBeUndefined();
  });

  it('épaissit la bordure sur demande, sans changer autre chose', async () => {
    const { getByTestId } = await render(
      <Card tone="attention" emphasis testID="carte">
        <Body>Texte</Body>
      </Card>,
    );
    const applique = getByTestId('carte').props.style.flat();
    expect(applique.some((s: { borderWidth?: number }) => s.borderWidth === 2)).toBe(true);
  });

  it('porte une élévation légère, jamais une ombre dure', async () => {
    // `docs/04` : « ombre très légère, jamais noire dure ».
    const { getByTestId } = await render(
      <Card testID="carte">
        <Body>Texte</Body>
      </Card>,
    );
    const applique = getByTestId('carte').props.style.flat();
    const ombre = applique.find(
      (s: { shadowOpacity?: number }) => s.shadowOpacity !== undefined,
    ) as { shadowOpacity: number } | undefined;
    expect(ombre?.shadowOpacity).toBeLessThan(0.1);
  });
});

describe('Button — le libellé est l’action', () => {
  it('prend son libellé comme nom accessible par défaut', async () => {
    const { getByTestId } = await render(
      <Button label="Envoyer la demande" onPress={() => undefined} testID="b" />,
    );
    expect(getByTestId('b')).toHaveAccessibleName('Envoyer la demande');
  });

  it('n’agit pas quand il est inactif', async () => {
    let appels = 0;
    const { getByTestId } = await render(
      <Button
        label="Supprimer"
        disabled
        onPress={() => {
          appels += 1;
        }}
        testID="b"
      />,
    );
    await fireEvent.press(getByTestId('b'));
    expect(appels).toBe(0);
  });

  it('annonce son occupation plutôt que de paraître figé', async () => {
    const { getByTestId } = await render(
      <Button label="Déverrouiller" busy onPress={() => undefined} testID="b" />,
    );
    expect(getByTestId('b').props.accessibilityState).toEqual({ disabled: true, busy: true });
  });

  it('distingue visuellement une action destructrice', async () => {
    const { getByTestId, unmount } = await render(
      <Button label="Supprimer" variant="danger" onPress={() => undefined} testID="b" />,
    );
    const danger = getByTestId('b').props.style.flat();
    unmount();
    expect(danger.some((s: { backgroundColor?: string }) => s.backgroundColor !== undefined)).toBe(
      true,
    );
  });
});

describe('Texte — les rôles secondaires existent', () => {
  it('rend une énumération sans que le point porte du sens', async () => {
    const { getByText } = await render(<Bullet>Une conséquence</Bullet>);
    expect(getByText('• Une conséquence')).toBeOnTheScreen();
  });

  it('rend un sur-titre en capitales', async () => {
    const { getByText } = await render(<Label>Destinataire</Label>);
    expect(getByText('Destinataire').props.style.textTransform).toBe('uppercase');
  });

  it('rend une précision plus discrète que le corps', async () => {
    const { getByTestId } = await render(
      <>
        <Body testID="corps">Texte</Body>
        <Caption testID="legende">Précision</Caption>
      </>,
    );
    expect(getByTestId('legende').props.style.fontSize).toBeLessThan(
      getByTestId('corps').props.style.fontSize,
    );
  });

  it('rend un texte fort plus appuyé que le corps', async () => {
    const { getByText } = await render(<Strong>Sans retour</Strong>);
    expect(getByText('Sans retour').props.style.flat()[0].fontFamily).toContain('SemiBold');
  });
});

describe('Page — le rythme est écrit une seule fois', () => {
  it('rend ses enfants', async () => {
    const { getByText } = await render(
      <Page testID="page">
        <Body>Contenu</Body>
      </Page>,
    );
    expect(getByText('Contenu')).toBeOnTheScreen();
  });
});
