// src/components/index.tsx — Componentes reutilizables

import React, { ReactNode } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../theme';

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CardTitle({ children }: { children: string }) {
  return <Text style={styles.cardTitle}>{children}</Text>;
}

// ── Badge ─────────────────────────────────────────────────────────────────
type BadgeVariant = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'gray';
const badgeColors: Record<BadgeVariant, { bg: string; text: string }> = {
  blue:   { bg: Colors.blueLight,   text: Colors.blueDark   },
  green:  { bg: Colors.greenLight,  text: Colors.greenDark  },
  red:    { bg: Colors.redLight,    text: Colors.red        },
  amber:  { bg: Colors.amberLight,  text: Colors.amber      },
  purple: { bg: Colors.purpleLight, text: Colors.purple     },
  gray:   { bg: Colors.grayLight,   text: Colors.gray       },
};
export function Badge({ label, variant = 'blue' }: { label: string; variant?: BadgeVariant }) {
  const c = badgeColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeTxt, { color: c.text }]}>{label}</Text>
    </View>
  );
}

// ── Button ────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'danger' | 'success' | 'warning' | 'ghost';
const btnColors: Record<BtnVariant, { bg: string; text: string; border: string }> = {
  primary: { bg: Colors.blue,       text: Colors.white, border: Colors.blue      },
  danger:  { bg: Colors.redLight,   text: Colors.red,   border: Colors.red       },
  success: { bg: Colors.greenLight, text: Colors.greenDark, border: Colors.green },
  warning: { bg: Colors.amberLight, text: Colors.amber, border: Colors.amber     },
  ghost:   { bg: Colors.white,      text: Colors.text,  border: Colors.grayBorder},
};
export function Btn({
  label, onPress, variant = 'ghost', disabled = false, loading = false,
  style, fullWidth = false,
}: {
  label:     string;
  onPress:   () => void;
  variant?:  BtnVariant;
  disabled?: boolean;
  loading?:  boolean;
  style?:    ViewStyle;
  fullWidth?:boolean;
}) {
  const c = btnColors[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        { backgroundColor: c.bg, borderColor: c.border },
        fullWidth && { width: '100%' },
        (disabled || loading) && styles.btnDisabled,
        style,
      ]}
      activeOpacity={0.75}
    >
      {loading
        ? <ActivityIndicator size="small" color={c.text} />
        : <Text style={[styles.btnTxt, { color: c.text }]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────
export function Toggle({ value, onToggle, color = Colors.red }: {
  value:    boolean;
  onToggle: () => void;
  color?:   string;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[
        styles.togTrack,
        { backgroundColor: value ? color : Colors.grayBorder },
      ]}
      activeOpacity={0.8}
    >
      <View style={[styles.togThumb, value && styles.togThumbOn]} />
    </TouchableOpacity>
  );
}

// ── KPI metric card ───────────────────────────────────────────────────────
export function KpiCard({ value, label, color }: {
  value: string | number;
  label: string;
  color?: string;
}) {
  return (
    <View style={styles.kpi}>
      <Text style={[styles.kpiVal, color ? { color } : {}]}>
        {value}
      </Text>
      <Text style={styles.kpiLbl}>{label}</Text>
    </View>
  );
}

// ── Section header ────────────────────────────────────────────────────────
export function SectionHeader({ children }: { children: string }) {
  return <Text style={styles.sectionHdr}>{children}</Text>;
}

// ── Row ───────────────────────────────────────────────────────────────────
export function Row({ label, value, style }: {
  label: string; value: string; style?: ViewStyle;
}) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

// ── Screen wrapper ────────────────────────────────────────────────────────
export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.screenContent, style]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

// ── Screen header ─────────────────────────────────────────────────────────
export function ScreenHeader({ title, subtitle, right }: {
  title:     string;
  subtitle?: string;
  right?:    ReactNode;
}) {
  return (
    <View style={styles.screenHdr}>
      <View style={{ flex: 1 }}>
        <Text style={styles.screenTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.screenSub}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

// ── Connection dot ────────────────────────────────────────────────────────
export function ConnDot({ connected }: { connected: boolean }) {
  return (
    <View style={[
      styles.connDot,
      { backgroundColor: connected ? Colors.green : Colors.red },
    ]} />
  );
}

// ── Divider ───────────────────────────────────────────────────────────────
export function Divider() {
  return <View style={styles.divider} />;
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    borderWidth:     0.5,
    borderColor:     Colors.grayBorder,
    padding:         Spacing.md,
    marginBottom:    Spacing.md,
  },
  cardTitle: {
    fontSize:      FontSize.xxs,
    fontWeight:    FontWeight.bold,
    color:         Colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom:  Spacing.sm,
  },
  badge: {
    borderRadius:    Radius.full,
    paddingHorizontal: 8,
    paddingVertical:   2,
    alignSelf:       'flex-start',
  },
  badgeTxt: {
    fontSize:   FontSize.xxs,
    fontWeight: FontWeight.medium,
  },
  btn: {
    borderRadius:     Radius.md,
    borderWidth:      0.5,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    alignItems:       'center',
    justifyContent:   'center',
    flexDirection:    'row',
  },
  btnDisabled: { opacity: 0.5 },
  btnTxt: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  togTrack: {
    width:        44,
    height:       24,
    borderRadius: Radius.full,
    padding:      3,
    justifyContent: 'center',
  },
  togThumb: {
    width:           18,
    height:          18,
    borderRadius:    Radius.full,
    backgroundColor: Colors.white,
    elevation:       2,
  },
  togThumbOn: {
    transform: [{ translateX: 20 }],
  },
  kpi: {
    backgroundColor: Colors.grayLight,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    alignItems:      'center',
  },
  kpiVal: {
    fontSize:   FontSize.xxl,
    fontWeight: FontWeight.medium,
    color:      Colors.text,
    lineHeight: 28,
  },
  kpiLbl: {
    fontSize:   FontSize.xxs,
    color:      Colors.gray,
    marginTop:  4,
    textAlign:  'center',
  },
  sectionHdr: {
    fontSize:      FontSize.xxs,
    fontWeight:    FontWeight.bold,
    color:         Colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop:     Spacing.md,
    marginBottom:  Spacing.xs,
  },
  row: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.grayBorder,
  },
  rowLabel: { fontSize: FontSize.sm, color: Colors.gray },
  rowValue: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text },
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenContent: {
    padding:        Spacing.lg,
    paddingBottom:  Spacing.xxl,
  },
  screenHdr: {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   Spacing.lg,
    gap:            Spacing.sm,
  },
  screenTitle: {
    fontSize:   FontSize.xl,
    fontWeight: FontWeight.medium,
    color:      Colors.text,
  },
  screenSub: {
    fontSize:  FontSize.sm,
    color:     Colors.gray,
    marginTop: 2,
  },
  connDot: {
    width:        8,
    height:       8,
    borderRadius: Radius.full,
  },
  divider: {
    height:          0.5,
    backgroundColor: Colors.grayBorder,
    marginVertical:  Spacing.sm,
  },
});
