// src/screens/FallasScreen.tsx
// Pantalla 2 — Inyección de fallas en X-Plane
// 10 sistemas AW109 · 4 sistemas R44 · toggles individuales

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../theme';
import { Card, Btn, SectionHeader, Toggle, ConnDot } from '../components';
import { useSesionStore }  from '../store/sesionStore';
import { useConfigStore }  from '../store/configStore';
import { FALLAS_AW109, FALLAS_R44 } from '../data/fallas';
import type { SistemaFallas, FallaXPlane } from '../types';

export default function FallasScreen() {
  const aeronave        = useConfigStore((s) => s.aeronave);
  const conectado       = useSesionStore((s) => s.conectado);
  const fallasActivasIds= useSesionStore((s) => s.fallasActivasIds);
  const fallasCount     = useSesionStore((s) => s.fallasActivasCount);
  const activarFalla    = useSesionStore((s) => s.activarFalla);
  const desactivarFalla = useSesionStore((s) => s.desactivarFalla);
  const limpiarFallas   = useSesionStore((s) => s.limpiarFallas);

  const [abiertos, setAbiertos] = useState<Set<number>>(new Set());

  const sistemas: SistemaFallas[] = aeronave === 'AW109' ? FALLAS_AW109 : FALLAS_R44;

  function toggleSistema(i: number) {
    setAbiertos((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function onToggleFalla(falla: FallaXPlane) {
    if (!conectado) {
      Alert.alert('Sin conexión', 'Conectar X-Plane antes de inyectar fallas.');
      return;
    }
    if (fallasActivasIds.has(falla.id)) {
      desactivarFalla(falla.id, falla.dataref);
    } else {
      activarFalla(falla.id, falla.dataref);
    }
  }

  function confirmarLimpiar() {
    Alert.alert(
      'Limpiar todas las fallas',
      `Se enviarán ${fallasCount} comandos de limpieza a X-Plane.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpiar todo', style: 'destructive', onPress: limpiarFallas },
      ],
    );
  }

  return (
    <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Panel de Fallas</Text>
            <Text style={styles.headerSub}>{aeronave} · X-Plane 11/12</Text>
          </View>
          <View style={styles.connRow}>
            <ConnDot connected={conectado} />
            <Text style={styles.connTxt}>{conectado ? 'Conectado' : 'Desconectado'}</Text>
          </View>
        </View>

        {/* Barra de fallas activas */}
        {fallasCount > 0 && (
          <View style={styles.fallasBanner}>
            <Text style={styles.fallasBannerTxt}>
              ⚠  {fallasCount} falla{fallasCount !== 1 ? 's' : ''} activa{fallasCount !== 1 ? 's' : ''} en X-Plane
            </Text>
            <TouchableOpacity onPress={confirmarLimpiar} style={styles.clearBtn}>
              <Text style={styles.clearBtnTxt}>Limpiar todo</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.hint}>
          {aeronave === 'AW109'
            ? `${FALLAS_AW109.reduce((a, s) => a + s.fallas.length, 0)} fallas · 10 sistemas · valor 6 = falla total · 0 = normal`
            : `${FALLAS_R44.reduce((a, s) => a + s.fallas.length, 0)} fallas · 4 sistemas · verificar con DataRefTool`
          }
        </Text>

        {/* Sistemas */}
        {sistemas.map((sis, i) => {
          const open   = abiertos.has(i);
          const activos = sis.fallas.filter((f) => fallasActivasIds.has(f.id)).length;
          return (
            <View key={sis.sistema} style={styles.sistemaWrap}>
              {/* Header del sistema */}
              <TouchableOpacity
                style={[styles.sisHdr, open && styles.sisHdrOpen]}
                onPress={() => toggleSistema(i)}
                activeOpacity={0.8}
              >
                <Text style={styles.sisIcono}>{sis.icono}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sisTxt, { color: sis.color }]}>{sis.sistema}</Text>
                  {open && <Text style={styles.sisNota}>{sis.nota}</Text>}
                </View>
                <View style={[
                  styles.sisCnt,
                  { backgroundColor: activos > 0 ? Colors.redLight : Colors.greenLight },
                ]}>
                  <Text style={[
                    styles.sisCntTxt,
                    { color: activos > 0 ? Colors.red : Colors.greenDark },
                  ]}>
                    {activos} / {sis.fallas.length}
                  </Text>
                </View>
                <Text style={styles.sisArr}>{open ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {/* Fallas del sistema */}
              {open && (
                <View style={styles.fallasBody}>
                  {sis.fallas.map((falla) => {
                    const activa = fallasActivasIds.has(falla.id);
                    return (
                      <View
                        key={falla.id}
                        style={[styles.fallaRow, activa && styles.fallaRowActiva]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.fallaNombre, activa && styles.fallaNombreActiva]}>
                            {falla.nombre}
                          </Text>
                          <Text style={styles.fallaDataref}>{falla.dataref}</Text>
                        </View>
                        <Toggle
                          value={activa}
                          onToggle={() => onToggleFalla(falla)}
                        />
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Acciones rápidas */}
        <SectionHeader>Acciones rápidas</SectionHeader>
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: Colors.redLight, borderColor: Colors.red }]}
            onPress={() => {
              if (!conectado) return;
              Alert.alert(
                'Falla de motor completa',
                aeronave === 'AW109'
                  ? 'Inyectar falla de motor #1 + motor #2 (doble falla de motor)'
                  : 'Inyectar falla de motor O-540 (pérdida de potencia total)',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Inyectar', style: 'destructive', onPress: () => {
                    const f1 = aeronave === 'AW109' ? FALLAS_AW109[0].fallas[0] : FALLAS_R44[0].fallas[0];
                    activarFalla(f1.id, f1.dataref);
                  }},
                ],
              );
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.quickIcn, { color: Colors.red }]}>🔴</Text>
            <Text style={[styles.quickTxt, { color: Colors.red }]}>Falla motor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: Colors.amberLight, borderColor: Colors.amber }]}
            onPress={() => {
              if (!conectado) return;
              const idx = aeronave === 'AW109' ? 2 : 1;
              const sis = sistemas[idx];
              sis.fallas.slice(0, 1).forEach((f) => activarFalla(f.id, f.dataref));
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.quickIcn, { color: Colors.amber }]}>🔄</Text>
            <Text style={[styles.quickTxt, { color: Colors.amber }]}>Falla TR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: Colors.blueLight, borderColor: Colors.blue }]}
            onPress={() => {
              if (!conectado) return;
              const idx = aeronave === 'AW109' ? 3 : 3;
              const sis = sistemas[idx];
              sis.fallas.slice(0, 1).forEach((f) => activarFalla(f.id, f.dataref));
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.quickIcn, { color: Colors.blue }]}>💧</Text>
            <Text style={[styles.quickTxt, { color: Colors.blue }]}>Falla hidráulico</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: Colors.grayLight, borderColor: Colors.grayBorder }]}
            onPress={confirmarLimpiar}
            activeOpacity={0.8}
          >
            <Text style={[styles.quickIcn, { color: Colors.gray }]}>✓</Text>
            <Text style={[styles.quickTxt, { color: Colors.gray }]}>Limpiar todo</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex:1, backgroundColor:Colors.background },
  content: { padding:Spacing.lg, paddingBottom:40 },
  header:  {
    flexDirection:'row', alignItems:'center', backgroundColor:Colors.blue,
    borderRadius:Radius.lg, padding:Spacing.md, marginBottom:Spacing.md,
  },
  headerTitle: { fontSize:FontSize.lg, fontWeight:FontWeight.bold, color:Colors.white },
  headerSub:   { fontSize:FontSize.xs, color:'rgba(255,255,255,.7)', marginTop:2 },
  connRow:     { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'rgba(255,255,255,.15)', borderRadius:Radius.full, paddingHorizontal:10, paddingVertical:4 },
  connTxt:     { fontSize:FontSize.xxs, color:Colors.white },
  fallasBanner:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:Colors.redLight, borderWidth:0.5, borderColor:Colors.redBorder, borderRadius:Radius.md, padding:Spacing.sm, marginBottom:Spacing.sm },
  fallasBannerTxt:{ fontSize:FontSize.sm, color:Colors.red, fontWeight:FontWeight.medium, flex:1 },
  clearBtn:    { backgroundColor:Colors.red, borderRadius:Radius.sm, paddingHorizontal:Spacing.sm, paddingVertical:Spacing.xs },
  clearBtnTxt: { fontSize:FontSize.xs, color:Colors.white, fontWeight:FontWeight.medium },
  hint:        { fontSize:FontSize.xxs, color:Colors.gray, fontStyle:'italic', marginBottom:Spacing.md },
  sistemaWrap: { marginBottom:Spacing.xs },
  sisHdr:      { flexDirection:'row', alignItems:'center', gap:Spacing.sm, padding:Spacing.sm, backgroundColor:Colors.grayLight, borderRadius:Radius.md, marginBottom:1 },
  sisHdrOpen:  { backgroundColor:Colors.blueLight },
  sisIcono:    { fontSize:14, width:22, textAlign:'center' },
  sisTxt:      { fontSize:FontSize.sm, fontWeight:FontWeight.medium },
  sisNota:     { fontSize:FontSize.xxs, color:Colors.gray, marginTop:2, fontStyle:'italic' },
  sisCnt:      { borderRadius:Radius.full, paddingHorizontal:8, paddingVertical:2 },
  sisCntTxt:   { fontSize:FontSize.xxs, fontWeight:FontWeight.medium },
  sisArr:      { fontSize:FontSize.xxs, color:Colors.gray },
  fallasBody:  { backgroundColor:Colors.white, borderWidth:0.5, borderColor:Colors.grayBorder, borderRadius:Radius.md, overflow:'hidden', marginBottom:Spacing.xs },
  fallaRow:    { flexDirection:'row', alignItems:'center', padding:Spacing.sm, borderBottomWidth:0.5, borderBottomColor:Colors.grayBorder },
  fallaRowActiva:{ backgroundColor:'#FFF5F5' },
  fallaNombre: { fontSize:FontSize.sm, color:Colors.text },
  fallaNombreActiva:{ color:Colors.red, fontWeight:FontWeight.medium },
  fallaDataref:{ fontSize:8, color:Colors.gray, fontFamily:'monospace', marginTop:2 },
  quickRow:    { flexDirection:'row', flexWrap:'wrap', gap:Spacing.sm },
  quickBtn:    { flex:1, minWidth:'44%', borderWidth:0.5, borderRadius:Radius.md, padding:Spacing.md, alignItems:'center', gap:Spacing.xs },
  quickIcn:    { fontSize:22 },
  quickTxt:    { fontSize:FontSize.xs, fontWeight:FontWeight.medium, textAlign:'center' },
});
