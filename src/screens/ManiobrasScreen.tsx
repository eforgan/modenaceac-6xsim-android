// src/screens/ManiobrasScreen.tsx
// Pantalla 4 — Evaluación de maniobras con criterios AS/S/SB/NA

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../theme';
import { Card, CardTitle, SectionHeader, Btn } from '../components';
import { useSesionStore }  from '../store/sesionStore';
import { useConfigStore }  from '../store/configStore';
import {
  MANIOBRAS_AW109, MANIOBRAS_R44,
  FALLAS_AW109, FALLAS_R44,
} from '../data/fallas';
import type { ResultadoManiobra } from '../types';

const CRITERIOS: Record<ResultadoManiobra, { color: string; bg: string; desc: string }> = {
  AS: { color:'#27500A', bg:'#EAF3DE', desc:'Apenas Satisface — procedimiento completado con errores notables' },
  S:  { color:'#042C53', bg:'#E6F1FB', desc:'Satisface — procedimiento correcto con alguna deficiencia menor' },
  SB: { color:'#412402', bg:'#FAEEDA', desc:'Satisface Bien — procedimiento correcto y bien ejecutado' },
  NA: { color:'#444441', bg:'#F1EFE8', desc:'No Aplica — maniobra no ejecutada en esta sesión' },
};

export default function ManiobrasScreen() {
  const aeronave     = useConfigStore((s) => s.aeronave);
  const sesion       = useSesionStore((s) => s.sesion);
  const estado       = useSesionStore((s) => s.estado);
  const evalManiobra = useSesionStore((s) => s.evalManiobra);
  const activarFalla = useSesionStore((s) => s.activarFalla);

  const maniobras = aeronave === 'AW109' ? MANIOBRAS_AW109 : MANIOBRAS_R44;
  const sistFallas = aeronave === 'AW109' ? FALLAS_AW109 : FALLAS_R44;

  const [abierto,   setAbierto]   = useState<string | null>(null);
  const [obsMap,    setObsMap]     = useState<Record<string, string>>({});
  const [evalMap,   setEvalMap]    = useState<Record<string, ResultadoManiobra>>({});

  function getEval(id: string) {
    return sesion?.evaluaciones.find((e) => e.maniobra_id === id)?.resultado ?? evalMap[id] ?? null;
  }

  function setEval(id: string, r: ResultadoManiobra) {
    setEvalMap((prev) => ({ ...prev, [id]: r }));
    evalManiobra(id, r, obsMap[id] ?? '');
  }

  function completados() {
    return maniobras.filter((m) => getEval(m.id) !== null && getEval(m.id) !== 'NA').length;
  }

  const pct = Math.round((completados() / maniobras.length) * 100);

  // ── Sugerencias de falla por maniobra ─────────────────────────────────────
  function getFallasSugeridas(manId: string): string[] {
    const map: Record<string, string[]> = {
      m_autorot: ['Motor #1'],
      m_falla1:  ['Motor #1'],
      m_falla2:  ['Motor #1'],
      m_tr:      ['Rotor de cola'],
      m_hyd:     ['Hidráulico N.1'],
      m_afcs:    ['AFCS roll', 'AFCS pitch'],
      r_autorot: ['Motor O-540'],
      r_falla1:  ['Motor O-540'],
      r_falla2:  ['Motor O-540'],
      r_tr:      ['Rotor de cola'],
      r_hyd:     ['Hidráulico'],
      r_gov:     ['Governor RPM'],
    };
    return map[manId] ?? [];
  }

  function inyectarFallaSugerida(manId: string) {
    const sugeridas = getFallasSugeridas(manId);
    if (!sugeridas.length) return;

    // Buscar en los sistemas
    for (const sis of sistFallas) {
      for (const f of sis.fallas) {
        if (sugeridas.some((s) => f.nombre.includes(s.split(' ')[0]))) {
          activarFalla(f.id, f.dataref);
          Alert.alert('Falla inyectada', `${f.nombre}\n${f.dataref}`);
          return;
        }
      }
    }
  }

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Evaluación de Maniobras</Text>
            <Text style={styles.headerSub}>
              {aeronave} · {completados()} / {maniobras.length} evaluadas
            </Text>
          </View>
          <View style={styles.pctWrap}>
            <Text style={styles.pctVal}>{pct}%</Text>
            <Text style={styles.pctLbl}>completo</Text>
          </View>
        </View>

        {/* Barra de progreso */}
        <View style={styles.progBar}>
          <View style={[styles.progFill, { width: `${pct}%` }]} />
        </View>

        {/* Sin sesión */}
        {estado === 'IDLE' && (
          <View style={styles.alertWrap}>
            <Text style={styles.alertTxt}>
              ⚠  Iniciar una sesión en la pestaña Sesión para habilitar la evaluación de maniobras.
            </Text>
          </View>
        )}

        {/* Leyenda AS/S/SB/NA */}
        <SectionHeader>Escala de evaluación</SectionHeader>
        <View style={styles.leyendaRow}>
          {(Object.entries(CRITERIOS) as [ResultadoManiobra, typeof CRITERIOS[ResultadoManiobra]][]).map(([r, c]) => (
            <View key={r} style={[styles.leyendaItem, { backgroundColor: c.bg }]}>
              <Text style={[styles.leyendaLabel, { color: c.color }]}>{r}</Text>
            </View>
          ))}
        </View>

        {/* Lista de maniobras */}
        {maniobras.map((man) => {
          const ev      = getEval(man.id);
          const isOpen  = abierto === man.id;
          const sugs    = getFallasSugeridas(man.id);

          return (
            <View key={man.id} style={styles.manCard}>
              {/* Header de la maniobra */}
              <TouchableOpacity
                style={[styles.manHdr, isOpen && styles.manHdrOpen]}
                onPress={() => setAbierto(isOpen ? null : man.id)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.manNombre}>{man.nombre}</Text>
                  <Text style={styles.manCat}>{man.categoria}</Text>
                </View>
                {ev ? (
                  <View style={[styles.evBadge, { backgroundColor: CRITERIOS[ev].bg }]}>
                    <Text style={[styles.evBadgeTxt, { color: CRITERIOS[ev].color }]}>{ev}</Text>
                  </View>
                ) : (
                  <Text style={styles.pendTxt}>Pendiente</Text>
                )}
                <Text style={styles.arrTxt}>{isOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {/* Detalle expandible */}
              {isOpen && (
                <View style={styles.manBody}>

                  {/* Botones de evaluación */}
                  <CardTitle>Evaluación</CardTitle>
                  <View style={styles.evRow}>
                    {(Object.entries(CRITERIOS) as [ResultadoManiobra, typeof CRITERIOS[ResultadoManiobra]][]).map(([r, c]) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.evBtn,
                          { backgroundColor: ev === r ? c.bg : Colors.white,
                            borderColor:      ev === r ? c.color : Colors.grayBorder,
                            borderWidth:      ev === r ? 1.5 : 0.5 },
                        ]}
                        onPress={() => setEval(man.id, r)}
                        activeOpacity={0.8}
                        disabled={estado === 'IDLE'}
                      >
                        <Text style={[styles.evBtnLbl, { color: ev === r ? c.color : Colors.gray }]}>
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Descripción del criterio seleccionado */}
                  {ev && (
                    <View style={[styles.critDesc, { backgroundColor: CRITERIOS[ev].bg }]}>
                      <Text style={[styles.critDescTxt, { color: CRITERIOS[ev].color }]}>
                        {CRITERIOS[ev].desc}
                      </Text>
                    </View>
                  )}

                  {/* Observaciones */}
                  <CardTitle>Observaciones</CardTitle>
                  <TextInput
                    style={styles.obsInput}
                    multiline
                    numberOfLines={3}
                    placeholder="Comentarios del instructor sobre la ejecución de esta maniobra..."
                    placeholderTextColor={Colors.grayMid}
                    value={obsMap[man.id] ?? ''}
                    onChangeText={(t) => {
                      setObsMap((prev) => ({ ...prev, [man.id]: t }));
                      if (ev) evalManiobra(man.id, ev, t);
                    }}
                    editable={estado !== 'IDLE'}
                  />

                  {/* Falla sugerida */}
                  {sugs.length > 0 && (
                    <View style={styles.sugsWrap}>
                      <Text style={styles.sugsTxt}>
                        💡  Falla sugerida para esta maniobra: {sugs.join(' · ')}
                      </Text>
                      <Btn
                        label="Inyectar falla"
                        variant="danger"
                        onPress={() => inyectarFallaSugerida(man.id)}
                        disabled={estado === 'IDLE'}
                        style={{ marginTop: Spacing.xs }}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* Resumen rápido */}
        {completados() > 0 && (
          <>
            <SectionHeader>Resumen de evaluaciones</SectionHeader>
            <Card>
              <View style={styles.resRow}>
                {(['AS','S','SB','NA'] as ResultadoManiobra[]).map((r) => {
                  const cnt = maniobras.filter((m) => getEval(m.id) === r).length;
                  return (
                    <View key={r} style={[styles.resItem, { backgroundColor: CRITERIOS[r].bg }]}>
                      <Text style={[styles.resVal, { color: CRITERIOS[r].color }]}>{cnt}</Text>
                      <Text style={[styles.resLbl, { color: CRITERIOS[r].color }]}>{r}</Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          </>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:    { flex:1, backgroundColor:Colors.background },
  content:   { padding:Spacing.lg, paddingBottom:40 },
  header:    { flexDirection:'row', alignItems:'center', backgroundColor:Colors.blue, borderRadius:Radius.lg, padding:Spacing.md, marginBottom:Spacing.sm },
  headerTitle:{ fontSize:FontSize.lg, fontWeight:FontWeight.bold, color:Colors.white },
  headerSub: { fontSize:FontSize.xs, color:'rgba(255,255,255,.75)', marginTop:2 },
  pctWrap:   { alignItems:'center' },
  pctVal:    { fontSize:FontSize.xxl, fontWeight:FontWeight.bold, color:Colors.white },
  pctLbl:    { fontSize:FontSize.xxs, color:'rgba(255,255,255,.7)' },
  progBar:   { height:5, backgroundColor:Colors.grayBorder, borderRadius:3, overflow:'hidden', marginBottom:Spacing.md },
  progFill:  { height:'100%', backgroundColor:Colors.green, borderRadius:3 },
  alertWrap: { backgroundColor:Colors.amberLight, borderWidth:0.5, borderColor:Colors.amber, borderRadius:Radius.md, padding:Spacing.sm, marginBottom:Spacing.md },
  alertTxt:  { fontSize:FontSize.sm, color:Colors.amber },
  leyendaRow:{ flexDirection:'row', gap:Spacing.xs, marginBottom:Spacing.sm },
  leyendaItem:{ flex:1, borderRadius:Radius.sm, padding:Spacing.xs, alignItems:'center' },
  leyendaLabel:{ fontSize:FontSize.sm, fontWeight:FontWeight.bold },
  manCard:   { borderWidth:0.5, borderColor:Colors.grayBorder, borderRadius:Radius.lg, overflow:'hidden', marginBottom:Spacing.sm },
  manHdr:    { flexDirection:'row', alignItems:'center', padding:Spacing.md, backgroundColor:Colors.white },
  manHdrOpen:{ backgroundColor:Colors.blueLight },
  manNombre: { fontSize:FontSize.md, fontWeight:FontWeight.medium, color:Colors.text },
  manCat:    { fontSize:FontSize.xxs, color:Colors.gray, marginTop:2 },
  evBadge:   { borderRadius:Radius.sm, paddingHorizontal:Spacing.sm, paddingVertical:Spacing.xs },
  evBadgeTxt:{ fontSize:FontSize.sm, fontWeight:FontWeight.bold },
  pendTxt:   { fontSize:FontSize.xs, color:Colors.grayMid },
  arrTxt:    { fontSize:FontSize.xs, color:Colors.gray, marginLeft:Spacing.xs },
  manBody:   { padding:Spacing.md, borderTopWidth:0.5, borderTopColor:Colors.grayBorder, backgroundColor:Colors.white },
  evRow:     { flexDirection:'row', gap:Spacing.xs, marginBottom:Spacing.sm },
  evBtn:     { flex:1, alignItems:'center', justifyContent:'center', borderRadius:Radius.md, paddingVertical:14 },
  evBtnLbl:  { fontSize:FontSize.lg, fontWeight:FontWeight.bold },
  critDesc:  { borderRadius:Radius.sm, padding:Spacing.sm, marginBottom:Spacing.sm },
  critDescTxt:{ fontSize:FontSize.sm },
  obsInput:  { borderWidth:0.5, borderColor:Colors.grayBorder, borderRadius:Radius.md, padding:Spacing.sm, fontSize:FontSize.sm, color:Colors.text, backgroundColor:Colors.grayLight, minHeight:70, textAlignVertical:'top', marginBottom:Spacing.sm },
  sugsWrap:  { backgroundColor:Colors.purpleLight, borderRadius:Radius.md, padding:Spacing.sm },
  sugsTxt:   { fontSize:FontSize.sm, color:Colors.purple },
  resRow:    { flexDirection:'row', gap:Spacing.sm },
  resItem:   { flex:1, borderRadius:Radius.md, padding:Spacing.sm, alignItems:'center' },
  resVal:    { fontSize:FontSize.xxl, fontWeight:FontWeight.bold },
  resLbl:    { fontSize:FontSize.xxs, fontWeight:FontWeight.medium, marginTop:2 },
});
