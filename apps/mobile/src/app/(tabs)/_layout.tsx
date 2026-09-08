import { Tabs } from 'expo-router';

import { color } from '../../theme/tokens';

/**
 * Navigation primaire — `PRD-14` §2.
 *
 * Quatre entrées : Aujourd'hui, Protection, Mémoire, Plus.
 * Hélios est l'écran « Aujourd'hui » et la porte d'entrée principale.
 *
 * `PRD-14` : les noms fonctionnels restent compréhensibles sans connaissance
 * de la mythologie — l'onglet s'appelle « Aujourd'hui », pas « Hélios ».
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: color.surface.ivory },
        headerTitleStyle: { color: color.text.primary },
        tabBarActiveTintColor: color.semantic.attention,
        tabBarInactiveTintColor: color.text.secondary,
        tabBarStyle: { backgroundColor: color.surface.white },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Aujourd’hui' }} />
      <Tabs.Screen name="protection" options={{ title: 'Protection' }} />
      <Tabs.Screen name="memoire" options={{ title: 'Mémoire' }} />
      <Tabs.Screen name="plus" options={{ title: 'Plus' }} />
    </Tabs>
  );
}
