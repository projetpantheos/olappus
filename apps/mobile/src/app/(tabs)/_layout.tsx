import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { color, fontFamily } from '../../theme/tokens';

/**
 * Navigation primaire — `PRD-14` §2, confirmée par **ADR-0016**.
 *
 * Aujourd'hui · Protection · Mémoire · Plus. Hélios est l'écran « Aujourd'hui ».
 * Les libellés restent compréhensibles sans connaissance de la mythologie.
 *
 * Iconographie : jeu neutre en G4. L'iconographie grecque de la planche de
 * direction artistique — colonne, laurier, trident, olivier — est un livrable
 * de design ultérieur (`docs/UX_DESIGN_PLAN`), pas une improvisation ici.
 *
 * `PRD-15` interdit « les icônes ambiguës sans label accessible ». Chaque
 * onglet porte donc son libellé **et** son icône : l'icône n'est jamais seule.
 */
const ICONS = {
  aujourdhui: 'sun',
  protection: 'shield',
  memoire: 'book-open',
  plus: 'more-horizontal',
} as const;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: color.surface.ivory },
        headerShadowVisible: false,
        headerTitleStyle: { color: color.text.primary, fontFamily: fontFamily.display },
        tabBarActiveTintColor: color.semantic.attention,
        tabBarInactiveTintColor: color.text.secondary,
        tabBarLabelStyle: { fontFamily: fontFamily.body },
        tabBarStyle: { backgroundColor: color.surface.white, borderTopColor: color.border.default },
        sceneStyle: { backgroundColor: color.surface.ivory },
      }}
    >
      <Tabs.Screen
        name="aujourdhui"
        options={{
          title: 'Aujourd’hui',
          tabBarIcon: ({ color: tint, size }) => (
            <Feather name={ICONS.aujourdhui} size={size} color={tint} />
          ),
        }}
      />
      <Tabs.Screen
        name="protection"
        options={{
          title: 'Protection',
          tabBarIcon: ({ color: tint, size }) => (
            <Feather name={ICONS.protection} size={size} color={tint} />
          ),
        }}
      />
      <Tabs.Screen
        name="memoire"
        options={{
          title: 'Mémoire',
          tabBarIcon: ({ color: tint, size }) => (
            <Feather name={ICONS.memoire} size={size} color={tint} />
          ),
        }}
      />
      <Tabs.Screen
        name="plus"
        options={{
          title: 'Plus',
          tabBarIcon: ({ color: tint, size }) => (
            <Feather name={ICONS.plus} size={size} color={tint} />
          ),
        }}
      />
    </Tabs>
  );
}
