// src/navigation/TabNavigator.tsx
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors, FontSize, FontWeight } from '../theme';

import ConfigScreen   from '../screens/ConfigScreen';
import FallasScreen   from '../screens/FallasScreen';
import SesionScreen   from '../screens/SesionScreen';
import ManiobrasScreen from '../screens/ManiobrasScreen';
import ReporteScreen  from '../screens/ReporteScreen';
import { useSesionStore } from '../store/sesionStore';

const Tab = createBottomTabNavigator();

// ── Iconos SVG simples usando Text Unicode ─────────────────────────────────
function TabIcon({ label, focused, badge }: { label: string; focused: boolean; badge?: number }) {
  const icons: Record<string, string> = {
    Config:    '⚙',
    Fallas:    '⚠',
    Sesión:    '▶',
    Maniobras: '✓',
    Reporte:   '📄',
  };
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.icon, focused && styles.iconActive]}>
        {icons[label] ?? '•'}
      </Text>
      {!!badge && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabNavigator() {
  const fallasCount = useSesionStore((s) => s.fallasActivasCount);
  const estado      = useSesionStore((s) => s.estado);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   Colors.blue,
        tabBarInactiveTintColor: Colors.gray,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <TabIcon
            label={route.name}
            focused={focused}
            badge={route.name === 'Fallas' ? fallasCount : undefined}
          />
        ),
      })}
    >
      <Tab.Screen name="Config"    component={ConfigScreen}    />
      <Tab.Screen name="Fallas"    component={FallasScreen}    />
      <Tab.Screen
        name="Sesión"
        component={SesionScreen}
        options={{
          tabBarBadge: estado === 'EN_CURSO' ? '●' : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.green, fontSize: 8 },
        }}
      />
      <Tab.Screen name="Maniobras" component={ManiobrasScreen} />
      <Tab.Screen name="Reporte"   component={ReporteScreen}   />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height:            60,
    backgroundColor:   Colors.white,
    borderTopWidth:    0.5,
    borderTopColor:    Colors.grayBorder,
    paddingBottom:     Platform.OS === 'android' ? 4 : 8,
    paddingTop:        4,
    elevation:         8,
  },
  tabLabel: {
    fontSize:   FontSize.xxs,
    fontWeight: FontWeight.medium,
    marginTop:  2,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
  },
  icon: {
    fontSize:   20,
    color:      Colors.gray,
  },
  iconActive: {
    color: Colors.blue,
  },
  badge: {
    position:        'absolute',
    top:             -4,
    right:           -8,
    backgroundColor: Colors.red,
    borderRadius:    10,
    minWidth:        16,
    height:          16,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 3,
  },
  badgeTxt: {
    color:      Colors.white,
    fontSize:   9,
    fontWeight: FontWeight.bold,
  },
});
