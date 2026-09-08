import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * Racine de navigation.
 *
 * G1 : une seule route, le temps de prouver que l'application démarre.
 * G4 : navigation primaire à quatre entrées — Aujourd'hui, Protection,
 *      Mémoire, Plus (PRD-14_UX_JOURNEY_BIBLE §2), Hélios étant « Aujourd'hui ».
 */
export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="dark" />
    </>
  );
}
