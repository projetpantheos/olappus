import { Cinzel_600SemiBold, useFonts } from '@expo-google-fonts/cinzel';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ScreenState } from '../components/screen-state';
import { color } from '../theme/tokens';

/**
 * Racine de navigation.
 *
 * Deux familles typographiques, conformes à `docs/04` et à la planche de
 * direction artistique (moodboard, ADR-0016) :
 *   - Cinzel pour les titres et l'identité — serif à l'antique, licence OFL ;
 *   - Inter pour le texte — lisibilité moderne.
 *
 * `docs/04` prévient : « les titres ne doivent pas devenir théâtraux ». Cinzel
 * est donc réservé à l'identité et aux titres d'écran, jamais au corps de texte.
 *
 * L'écran d'accueil est la route initiale : c'est le parcours de première valeur
 * de `PRD-14` Journey A — comprendre la valeur avant qu'on demande des données.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cinzel_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    // Un état de chargement explicite plutôt qu'un écran blanc : `PRD-14` §15
    // exige que chaque écran définisse son état de chargement.
    return <ScreenState kind="loading" />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: color.surface.ivory },
          headerTitleStyle: { color: color.text.primary, fontFamily: 'Cinzel_600SemiBold' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: color.surface.ivory },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="case/[id]" options={{ title: 'Situation' }} />
        {/* Sans ces deux lignes, l'en-tête affiche « RECUPERATION/INDEX » —
            le nom de route brut. Défaut invisible aux tests, visible dès qu'on
            ouvre l'application. */}
        <Stack.Screen name="recuperation" options={{ title: 'Récupération' }} />
        <Stack.Screen name="recuperation/perte" options={{ title: 'Secret perdu' }} />
        <Stack.Screen name="deverrouillage" options={{ title: 'Déverrouiller' }} />
        <Stack.Screen name="controle/connecter" options={{ title: 'Connecter un service' }} />
        <Stack.Screen name="controle/connexions" options={{ title: 'Services connectés' }} />
        <Stack.Screen name="controle/donnees" options={{ title: 'Mes données' }} />
        <Stack.Screen name="controle/permissions" options={{ title: 'Ce qu’Olappus peut faire' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
