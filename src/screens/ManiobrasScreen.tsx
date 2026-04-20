// src/screens/ManiobrasScreen.tsx — v2.0
// Pantalla de evaluación de maniobras con criterios detallados, tolerancias y fallas sugeridas

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, Pressable, Animated,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../theme';
import { Card, CardTitle, SectionHeader, Btn } from '../components';
import { useSesionStore }  from '../store/sesionStore';
import { useConfigStore }  from '../store/configStore';
import { MANIOBRAS_AW109, MANIOBRAS_R44, FALLAS_AW109, FALLAS_R44 } from '../data/fallas';
import type { Maniobra, FallaSugerida } from '../data/fallas';
import type { ResultadoManiobra } from '../types';

// ── Criterios visuales ──────────────────────────────────────────────────────
const CRIT: Record<ResultadoManiobra, { color: string; bg: string; border: string; label: string }> = {
  AS: { color:'#275208', bg:'#EAF3DE', border:'#7CB342', label:'Apenas Satisface' },
  S:  { color:'#0C447C', bg:'#E6F1FB', border:'#185FA5', label:'Satisface' },
  SB: { color:'#7B5800', bg:'#FAEEDA', border:'#BA7517', label:'Satisface Bien' },
  NA: { color:'#444441', bg:'#F1EFE8', border:'#9E9C94', label:'No Aplica' },
};

// ── Colores por categoría ─────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  'Control básico':   '#1D9E75',
  'Emergencias':      '#A32D2D',
  'Sistemas':         '#185FA5',
  'IFR':              '#534AB7',
  'Control avanzado': '#BA7517',
  'Normal':           '#5F5E5A',
};

// ══════════════════════════════════════════════════════════════════════════════
export default function ManiobrasScreen() {
  const aeronave     = useConfigStore(s => s.aeronave);
  const sesion       = useSesionStore(s => s.sesion);
  const estado       = useSesionStore(s => s.estado);
  const evalManiobra = useSesionStore(s => s.evalManiobra);
  const activarFalla = useSesionStore(s => s.activarFalla);
  const fallasActivas= useSesionStore(s => s.fallasActivasIds);
  const ultimoAck    = useSesionStore(s => s.ultimoAck);

  const maniobras  = aeronave === 'AW109' ? MANIOBRAS_AW109 : MANIOBRAS_R44;
  const sistFallas = aeronave === 'AW109' ? FALLAS_AW109    : FALLAS_R44;

  const [abierto,  setAbierto]  = useState<string | null>(null);
  const [obsMap,   setObsMap]   = useState<Record<string, string>>({});
  const [evalMap,  setEvalMap]  = useState<Record<string, ResultadoManiobra>>({});
  const [tab,      setTab]      = useState<'criterios' | 'procedimiento' | 'fallas'>('criterios');
  const [catFilter,setCatFilter]= useState<string | null>(null);

  const getEval = useCallback((id: string) =>
    sesion?.evaluaciones.find(e => e.maniobra_id === id)?.resultado
    ?? evalMap[id] ?? null,
  [sesion, evalMap]);

  const setEval = useCallback((id: string, r: ResultadoManiobra) => {
    setEvalMap(prev => ({ ...prev, [id]: r }));
    evalManiobra(id, r, obsMap[id] ?? '');
  }, [obsMap, evalManiobra]);

  // Buscar falla por ID en los sistemas
  const findFalla = useCallback((fallaId: string) => {
    for (const sis of sistFallas) {
      const f = sis.fallas.find(f => f.id === fallaId);
      if (f) return f;
    }
    return null;
  }, [sistFallas]);

  const inyectarFalla = useCallback(async (sug: FallaSugerida) => {
    const falla = findFalla(sug.fallaId);
    if (!falla) {
      Alert.alert('Falla no encontrada', `No se encontró la falla con ID: ${sug.fallaId}`);
      return;
    }
    if (estado === 'IDLE') {
      Alert.alert('Sin sesión', 'Iniciar una sesión antes de inyectar fallas.');
      return;
    }
    Alert.alert(
      '⚠ Inyectar falla',
      `Sistema: ${falla.sistema}\nFalla: ${falla.nombre}\n\nMomento recomendado:\n"${sug.momento}"`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Inyectar',
          style: 'destructive',
          onPress: () => activarFalla(falla.id, falla.dataref, falla.nombre, falla.sistema),
        },
      ],
    );
  }, [findFalla, estado, activarFalla]);

  // Estadísticas
  const categorias = [...new Set(maniobras.map(m => m.categoria))];
  const completados = maniobras.filter(m => getEval(m.id) !== null && getEval(m.id) !== 'NA').length;
  const pct = Math.round((completados / maniobras.length) * 100);

  const counts: Record<ResultadoManiobra, number> = { AS: 0, S: 0, SB: 0, NA: 0 };
  maniobras.forEach(m => { const ev = getEval(m.id); if (ev) counts[ev]++; });

  const maniobrasVisibles = catFilter
    ? maniobras.filter(m => m.categoria === catFilter)
    : maniobras;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>

      {/* ══ CABECERA ══ */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.hTitle}>Evaluación de Maniobras</Text>
          <Text style={s.hSub}>{aeronave} · {completados}/{maniobras.length} evaluadas</Text>
        </View>
        <View style={s.pctBox}>
          <Text style={s.pctNum}>{pct}%</Text>
          <Text style={s.pctLbl}>completado</Text>
        </View>
      </View>

      {/* Barra de progreso */}
      <View style={s.progBg}>
        <View style={[s.progFg, { width: `${pct}%` as any }]} />
      </View>

      {/* ══ AVISO SIN SESIÓN ══ */}
      {estado === 'IDLE' && (
        <View style={s.alertBox}>
          <Text style={s.alertTxt}>
            ⚠  Iniciar una sesión en la pestaña Sesión para habilitar la evaluación.
          </Text>
        </View>
      )}

      {/* ══ RESUMEN DE RESULTADOS ══ */}
      {completados > 0 && (
        <View style={s.resRow}>
          {(['AS','S','SB','NA'] as ResultadoManiobra[]).map(r => (
            <View key={r} style={[s.resChip, { backgroundColor: CRIT[r].bg,
              borderColor: CRIT[r].border, borderWidth: 0.5 }]}>
              <Text style={[s.resNum, { color: CRIT[r].color }]}>{counts[r]}</Text>
              <Text style={[s.resLbl, { color: CRIT[r].color }]}>{r}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ══ FILTRO POR CATEGORÍA ══ */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ marginBottom: Spacing.sm }}>
        <View style={s.catRow}>
          <Pressable
            style={[s.catChip, !catFilter && s.catChipOn]}
            onPress={() => setCatFilter(null)}
          >
            <Text style={[s.catTxt, !catFilter && s.catTxtOn]}>Todas</Text>
          </Pressable>
          {categorias.map(cat => (
            <Pressable
              key={cat}
              style={[s.catChip, catFilter === cat && { backgroundColor: CAT_COLORS[cat] || Colors.blue }]}
              onPress={() => setCatFilter(catFilter === cat ? null : cat)}
            >
              <Text style={[s.catTxt, catFilter === cat && { color: Colors.white, fontWeight: FontWeight.bold }]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* ══ LISTA DE MANIOBRAS ══ */}
      {maniobrasVisibles.map(man => {
        const ev     = getEval(man.id);
        const isOpen = abierto === man.id;
        const catCol = CAT_COLORS[man.categoria] || Colors.gray;
        const hasFallas = man.fallas.length > 0;
        const fallaActiva = man.fallas.some(f => fallasActivas.has(f.fallaId));

        return (
          <View key={man.id} style={[s.manCard, ev && { borderLeftColor: CRIT[ev].border, borderLeftWidth: 3 }]}>

            {/* Header de la maniobra */}
            <TouchableOpacity
              style={[s.manHdr, isOpen && s.manHdrOpen]}
              onPress={() => setAbierto(isOpen ? null : man.id)}
              activeOpacity={0.8}
            >
              <View style={[s.catDot, { backgroundColor: catCol }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.manNom}>{man.nombre}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Text style={[s.manCat, { color: catCol }]}>{man.categoria}</Text>
                  {hasFallas && (
                    <View style={[s.fallaIndicator, fallaActiva && s.fallaIndicatorOn]}>
                      <Text style={[s.fallaIndicatorTxt, fallaActiva && { color: Colors.red }]}>
                        {fallaActiva ? '⚠ FALLA ACTIVA' : `${man.fallas.length} falla${man.fallas.length > 1 ? 's' : ''}`}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              {ev ? (
                <View style={[s.evBadge, { backgroundColor: CRIT[ev].bg, borderColor: CRIT[ev].border }]}>
                  <Text style={[s.evBadgeTxt, { color: CRIT[ev].color }]}>{ev}</Text>
                </View>
              ) : (
                <Text style={s.pendTxt}>Pendiente</Text>
              )}
              <Text style={s.arrTxt}>{isOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {/* Detalle expandible */}
            {isOpen && (
              <View style={s.manBody}>

                {/* Objetivo */}
                <View style={s.objBox}>
                  <Text style={s.objLabel}>OBJETIVO</Text>
                  <Text style={s.objTxt}>{man.objetivo}</Text>
                </View>

                {/* Referencia normativa */}
                <Text style={s.refTxt}>📋 {man.referencia}</Text>

                {/* ── TABS internos ── */}
                <View style={s.inTabs}>
                  {(['criterios','procedimiento','fallas'] as const).map(t => (
                    <Pressable
                      key={t}
                      style={[s.inTab, tab === t && s.inTabOn]}
                      onPress={() => setTab(t)}
                    >
                      <Text style={[s.inTabTxt, tab === t && s.inTabTxtOn]}>
                        {t === 'criterios'     ? '📊 Criterios'    :
                         t === 'procedimiento' ? '📋 Pasos'        :
                         `⚠ Fallas (${man.fallas.length})`}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* TAB: CRITERIOS */}
                {tab === 'criterios' && (
                  <View style={s.tabContent}>
                    {/* Tolerancias */}
                    <View style={s.tolBox}>
                      <Text style={s.tolTitle}>📐 Tolerancias</Text>
                      {man.tolerancias.map((t, i) => (
                        <View key={i} style={s.tolRow}>
                          <Text style={s.tolDot}>▸</Text>
                          <Text style={s.tolTxt}>{t}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Criterios AS/S/SB */}
                    <Text style={s.critTitle}>Descripción por nivel</Text>
                    {(['SB','S','AS'] as const).map(nivel => (
                      <View key={nivel} style={[s.critBox, { backgroundColor: CRIT[nivel].bg,
                        borderLeftColor: CRIT[nivel].border, borderLeftWidth: 3 }]}>
                        <View style={s.critHeader}>
                          <Text style={[s.critCode, { color: CRIT[nivel].color }]}>{nivel}</Text>
                          <Text style={[s.critLabel, { color: CRIT[nivel].color }]}>{CRIT[nivel].label}</Text>
                        </View>
                        <Text style={[s.critDesc, { color: CRIT[nivel].color }]}>
                          {man.criterios[nivel]}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* TAB: PROCEDIMIENTO */}
                {tab === 'procedimiento' && (
                  <View style={s.tabContent}>
                    {man.procedimiento.map((paso, i) => (
                      <View key={i} style={s.pasoRow}>
                        <View style={s.pasoNum}>
                          <Text style={s.pasoNumTxt}>{i + 1}</Text>
                        </View>
                        <Text style={s.pasoTxt}>{paso}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* TAB: FALLAS SUGERIDAS */}
                {tab === 'fallas' && (
                  <View style={s.tabContent}>
                    {man.fallas.length === 0 ? (
                      <View style={s.noFallas}>
                        <Text style={s.noFallasTxt}>
                          Esta maniobra no tiene fallas sugeridas específicas.{'\n'}
                          Puede inyectar fallas desde la pestaña Fallas.
                        </Text>
                      </View>
                    ) : (
                      man.fallas.map((sug, i) => {
                        const falla = findFalla(sug.fallaId);
                        const activa = fallasActivas.has(sug.fallaId);
                        return (
                          <View key={i} style={[s.fallaRow, activa && s.fallaRowActiva]}>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                {activa && <Text style={s.activaDot}>⚠</Text>}
                                <Text style={[s.fallaNom, activa && { color: Colors.red }]}>
                                  {sug.nombre}
                                </Text>
                              </View>
                              <Text style={s.fallaSistema}>{falla?.sistema ?? '—'}</Text>
                              <View style={s.momentoBox}>
                                <Text style={s.momentoLabel}>Cuándo inyectar:</Text>
                                <Text style={s.momentoTxt}>{sug.momento}</Text>
                              </View>
                              {falla && (
                                <Text style={s.fallaDataref} numberOfLines={1}>
                                  {falla.dataref}
                                </Text>
                              )}
                            </View>
                            <Pressable
                              style={[s.inyBtn, activa && s.inyBtnActiva,
                                estado === 'IDLE' && { opacity: 0.4 }]}
                              onPress={() => inyectarFalla(sug)}
                              disabled={estado === 'IDLE'}
                            >
                              <Text style={s.inyBtnTxt}>
                                {activa ? '✓ Activa' : '▶ Inyectar'}
                              </Text>
                            </Pressable>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}

                {/* ── EVALUACIÓN ── */}
                <View style={s.evSection}>
                  <Text style={s.evTitle}>Resultado de evaluación</Text>
                  <View style={s.evBtns}>
                    {(['AS','S','SB','NA'] as ResultadoManiobra[]).map(r => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          s.evBtn,
                          { borderColor: ev === r ? CRIT[r].border : Colors.grayBorder,
                            backgroundColor: ev === r ? CRIT[r].bg : Colors.white,
                            borderWidth: ev === r ? 1.5 : 0.5 },
                        ]}
                        onPress={() => setEval(man.id, r)}
                        disabled={estado === 'IDLE'}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.evBtnCode, { color: ev === r ? CRIT[r].color : Colors.grayMid }]}>
                          {r}
                        </Text>
                        <Text style={[s.evBtnLabel, { color: ev === r ? CRIT[r].color : Colors.gray }]}>
                          {CRIT[r].label.split(' ')[0]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Descripción del criterio seleccionado */}
                  {ev && ev !== 'NA' && (
                    <View style={[s.evDesc, { backgroundColor: CRIT[ev].bg, borderLeftColor: CRIT[ev].border }]}>
                      <Text style={[s.evDescTxt, { color: CRIT[ev].color }]}>
                        {man.criterios[ev]}
                      </Text>
                    </View>
                  )}
                </View>

                {/* ── OBSERVACIONES ── */}
                <Text style={s.obsLabel}>Observaciones del instructor</Text>
                <TextInput
                  style={s.obsInput}
                  multiline
                  numberOfLines={3}
                  placeholder="Comentarios detallados sobre la ejecución..."
                  placeholderTextColor={Colors.grayMid}
                  value={obsMap[man.id] ?? ''}
                  onChangeText={t => {
                    setObsMap(prev => ({ ...prev, [man.id]: t }));
                    if (ev) evalManiobra(man.id, ev, t);
                  }}
                  editable={estado !== 'IDLE'}
                />

              </View>
            )}
          </View>
        );
      })}

      {/* ══ RESUMEN FINAL ══ */}
      {completados > 0 && (
        <>
          <SectionHeader>Resumen de la evaluación</SectionHeader>
          <Card>
            {(['SB','S','AS','NA'] as ResultadoManiobra[]).map(r => {
              const cnt = maniobras.filter(m => getEval(m.id) === r).length;
              if (cnt === 0) return null;
              return (
                <View key={r} style={[s.resDetailRow,
                  { backgroundColor: CRIT[r].bg, borderLeftColor: CRIT[r].border }]}>
                  <View style={[s.resCodeBox, { backgroundColor: CRIT[r].border }]}>
                    <Text style={s.resCode}>{r}</Text>
                  </View>
                  <Text style={[s.resDetailLbl, { color: CRIT[r].color }]}>{CRIT[r].label}</Text>
                  <Text style={[s.resDetailNum, { color: CRIT[r].color }]}>{cnt}</Text>
                  <View style={s.resBar}>
                    <View style={[s.resBarFg, {
                      width: `${Math.round(cnt/maniobras.length*100)}%` as any,
                      backgroundColor: CRIT[r].border,
                    }]} />
                  </View>
                </View>
              );
            })}
          </Card>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  screen:  { flex:1, backgroundColor:Colors.background },
  content: { padding:Spacing.lg },

  // Header
  header:  { flexDirection:'row', alignItems:'center', backgroundColor:Colors.blue,
              borderRadius:Radius.lg, padding:Spacing.md, marginBottom:Spacing.sm },
  hTitle:  { fontSize:FontSize.lg, fontWeight:FontWeight.bold, color:Colors.white },
  hSub:    { fontSize:FontSize.xs, color:'rgba(255,255,255,.75)', marginTop:2 },
  pctBox:  { alignItems:'center' },
  pctNum:  { fontSize:28, fontWeight:FontWeight.bold, color:Colors.white, lineHeight:30 },
  pctLbl:  { fontSize:FontSize.xxs, color:'rgba(255,255,255,.65)' },

  // Progreso
  progBg:  { height:5, backgroundColor:Colors.grayBorder, borderRadius:3,
              overflow:'hidden', marginBottom:Spacing.md },
  progFg:  { height:'100%', backgroundColor:Colors.green, borderRadius:3 },

  // Alerta
  alertBox:{ backgroundColor:Colors.amberLight, borderWidth:0.5, borderColor:Colors.amber,
              borderRadius:Radius.md, padding:Spacing.sm, marginBottom:Spacing.md },
  alertTxt:{ fontSize:FontSize.sm, color:Colors.amber },

  // Resumen chips
  resRow:  { flexDirection:'row', gap:Spacing.xs, marginBottom:Spacing.sm },
  resChip: { flex:1, borderRadius:Radius.md, paddingVertical:Spacing.sm, alignItems:'center' },
  resNum:  { fontSize:FontSize.xl, fontWeight:FontWeight.bold, lineHeight:22 },
  resLbl:  { fontSize:FontSize.xxs, fontWeight:FontWeight.bold },

  // Filtro categoría
  catRow:  { flexDirection:'row', gap:Spacing.xs, paddingVertical:2 },
  catChip: { paddingHorizontal:Spacing.sm, paddingVertical:5, borderRadius:Radius.full,
              backgroundColor:Colors.grayLight, borderWidth:0.5, borderColor:Colors.grayBorder },
  catChipOn:{ backgroundColor:Colors.blue },
  catTxt:  { fontSize:FontSize.xs, color:Colors.gray },
  catTxtOn:{ color:Colors.white, fontWeight:FontWeight.bold },

  // Maniobra card
  manCard: { borderWidth:0.5, borderColor:Colors.grayBorder, borderRadius:Radius.lg,
              overflow:'hidden', marginBottom:Spacing.sm, borderLeftWidth:3, borderLeftColor:Colors.grayBorder },
  manHdr:  { flexDirection:'row', alignItems:'center', padding:Spacing.md,
              backgroundColor:Colors.white, gap:Spacing.xs },
  manHdrOpen:{ backgroundColor:Colors.blueLight },
  catDot:  { width:8, height:8, borderRadius:4, flexShrink:0 },
  manNom:  { fontSize:FontSize.md, fontWeight:FontWeight.medium, color:Colors.text },
  manCat:  { fontSize:FontSize.xxs, fontWeight:FontWeight.bold, letterSpacing:0.3 },
  fallaIndicator:{ backgroundColor:Colors.grayLight, borderRadius:Radius.sm,
                   paddingHorizontal:5, paddingVertical:1 },
  fallaIndicatorOn:{ backgroundColor:Colors.redLight },
  fallaIndicatorTxt:{ fontSize:FontSize.xxs, color:Colors.gray },
  evBadge: { borderRadius:Radius.sm, borderWidth:0.5, paddingHorizontal:8, paddingVertical:3 },
  evBadgeTxt:{ fontSize:FontSize.sm, fontWeight:FontWeight.bold },
  pendTxt: { fontSize:FontSize.xs, color:Colors.grayMid },
  arrTxt:  { fontSize:FontSize.xs, color:Colors.gray },

  // Cuerpo de la maniobra
  manBody: { padding:Spacing.md, borderTopWidth:0.5, borderTopColor:Colors.grayBorder,
              backgroundColor:Colors.white },
  objBox:  { backgroundColor:Colors.blueLight, borderRadius:Radius.md, padding:Spacing.sm,
              marginBottom:Spacing.xs },
  objLabel:{ fontSize:FontSize.xxs, fontWeight:FontWeight.bold, color:Colors.blue,
              letterSpacing:0.8, marginBottom:2 },
  objTxt:  { fontSize:FontSize.sm, color:Colors.text, lineHeight:17 },
  refTxt:  { fontSize:FontSize.xs, color:Colors.gray, marginBottom:Spacing.sm },

  // Tabs internos
  inTabs:  { flexDirection:'row', backgroundColor:Colors.grayLight, borderRadius:Radius.md,
              padding:2, gap:2, marginBottom:Spacing.sm },
  inTab:   { flex:1, paddingVertical:7, borderRadius:Radius.sm, alignItems:'center' },
  inTabOn: { backgroundColor:Colors.white,
              shadowColor:'#000', shadowOpacity:.06, shadowRadius:2,
              shadowOffset:{width:0,height:1}, elevation:2 },
  inTabTxt:{ fontSize:FontSize.xs, color:Colors.gray },
  inTabTxtOn:{ color:Colors.blue, fontWeight:FontWeight.bold },
  tabContent:{ marginBottom:Spacing.sm },

  // Tolerancias
  tolBox:  { backgroundColor:Colors.grayLight, borderRadius:Radius.md, padding:Spacing.sm,
              marginBottom:Spacing.sm },
  tolTitle:{ fontSize:FontSize.xs, fontWeight:FontWeight.bold, color:Colors.text,
              marginBottom:Spacing.xs, letterSpacing:0.3 },
  tolRow:  { flexDirection:'row', alignItems:'flex-start', gap:6, marginBottom:3 },
  tolDot:  { color:Colors.blue, fontSize:FontSize.sm, lineHeight:16 },
  tolTxt:  { fontSize:FontSize.sm, color:Colors.text, flex:1, lineHeight:16 },

  // Criterios
  critTitle:{ fontSize:FontSize.xs, fontWeight:FontWeight.bold, color:Colors.text,
               marginBottom:Spacing.xs, letterSpacing:0.3 },
  critBox:  { borderRadius:Radius.sm, padding:Spacing.sm, marginBottom:6 },
  critHeader:{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:4 },
  critCode: { fontSize:FontSize.md, fontWeight:FontWeight.bold },
  critLabel:{ fontSize:FontSize.xs, fontWeight:FontWeight.medium },
  critDesc: { fontSize:FontSize.sm, lineHeight:16 },

  // Procedimiento
  pasoRow: { flexDirection:'row', alignItems:'flex-start', gap:Spacing.sm, marginBottom:8 },
  pasoNum: { width:22, height:22, borderRadius:11, backgroundColor:Colors.blue,
              alignItems:'center', justifyContent:'center', flexShrink:0 },
  pasoNumTxt:{ fontSize:FontSize.xs, color:Colors.white, fontWeight:FontWeight.bold },
  pasoTxt: { fontSize:FontSize.sm, color:Colors.text, flex:1, lineHeight:17, marginTop:2 },

  // Fallas sugeridas
  noFallas:{ backgroundColor:Colors.grayLight, borderRadius:Radius.md, padding:Spacing.md,
              alignItems:'center' },
  noFallasTxt:{ fontSize:FontSize.sm, color:Colors.gray, textAlign:'center', lineHeight:18 },
  fallaRow:{ flexDirection:'row', alignItems:'flex-start', gap:Spacing.sm,
              padding:Spacing.sm, backgroundColor:Colors.grayLight, borderRadius:Radius.md,
              marginBottom:6, borderWidth:0.5, borderColor:Colors.grayBorder },
  fallaRowActiva:{ backgroundColor:Colors.redLight, borderColor:Colors.redBorder },
  activaDot:{ color:Colors.red, fontSize:FontSize.md },
  fallaNom: { fontSize:FontSize.sm, fontWeight:FontWeight.medium, color:Colors.text },
  fallaSistema:{ fontSize:FontSize.xxs, color:Colors.gray, marginTop:1 },
  momentoBox:{ backgroundColor:'rgba(0,0,0,.04)', borderRadius:Radius.sm,
               padding:Spacing.xs, marginTop:4 },
  momentoLabel:{ fontSize:FontSize.xxs, fontWeight:FontWeight.bold, color:Colors.gray },
  momentoTxt:{ fontSize:FontSize.xs, color:Colors.text, lineHeight:15 },
  fallaDataref:{ fontSize:8, color:Colors.gray, fontFamily:'monospace', marginTop:3 },
  inyBtn:  { backgroundColor:Colors.red, borderRadius:Radius.md, paddingHorizontal:10,
              paddingVertical:10, alignSelf:'center', alignItems:'center', minWidth:72 },
  inyBtnActiva:{ backgroundColor:Colors.green },
  inyBtnTxt:{ fontSize:FontSize.xs, color:Colors.white, fontWeight:FontWeight.bold,
               textAlign:'center' },

  // Evaluación
  evSection:{ marginTop:Spacing.md, borderTopWidth:0.5, borderTopColor:Colors.grayBorder,
               paddingTop:Spacing.md },
  evTitle:  { fontSize:FontSize.xs, fontWeight:FontWeight.bold, color:Colors.text,
               letterSpacing:0.3, marginBottom:Spacing.sm },
  evBtns:   { flexDirection:'row', gap:Spacing.xs, marginBottom:Spacing.sm },
  evBtn:    { flex:1, alignItems:'center', borderRadius:Radius.md, paddingVertical:12 },
  evBtnCode:{ fontSize:FontSize.lg+2, fontWeight:FontWeight.bold },
  evBtnLabel:{ fontSize:FontSize.xxs, marginTop:2 },
  evDesc:   { borderRadius:Radius.sm, borderLeftWidth:3, padding:Spacing.sm, marginBottom:Spacing.sm },
  evDescTxt:{ fontSize:FontSize.sm, lineHeight:16 },

  // Observaciones
  obsLabel: { fontSize:FontSize.xs, fontWeight:FontWeight.bold, color:Colors.text,
               letterSpacing:0.3, marginBottom:4 },
  obsInput: { borderWidth:0.5, borderColor:Colors.grayBorder, borderRadius:Radius.md,
               padding:Spacing.sm, fontSize:FontSize.sm, color:Colors.text,
               backgroundColor:Colors.grayLight, minHeight:72, textAlignVertical:'top' },

  // Resumen final
  resDetailRow:{ flexDirection:'row', alignItems:'center', gap:Spacing.sm,
                  padding:Spacing.sm, marginBottom:4, borderRadius:Radius.sm,
                  borderLeftWidth:3 },
  resCodeBox:  { width:30, height:22, borderRadius:Radius.sm, alignItems:'center', justifyContent:'center' },
  resCode:     { fontSize:FontSize.xs, fontWeight:FontWeight.bold, color:Colors.white },
  resDetailLbl:{ flex:1, fontSize:FontSize.sm, fontWeight:FontWeight.medium },
  resDetailNum:{ fontSize:FontSize.lg, fontWeight:FontWeight.bold, minWidth:20 },
  resBar:      { width:60, height:6, backgroundColor:'rgba(0,0,0,.08)',
                  borderRadius:3, overflow:'hidden' },
  resBarFg:    { height:'100%', borderRadius:3 },
});
