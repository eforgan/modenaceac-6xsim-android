// src/screens/ReporteScreen.tsx
// Pantalla 5 — Reporte final con firma digital y cierre de sesión

import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert,
} from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../theme';
import { Card, CardTitle, Btn, SectionHeader, Row, Divider } from '../components';
import { useSesionStore }  from '../store/sesionStore';
import { useConfigStore }  from '../store/configStore';
import { MANIOBRAS_AW109, MANIOBRAS_R44 } from '../data/fallas';
import type { ResultadoManiobra } from '../types';

function fmtTimer(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

const RC: Record<ResultadoManiobra, { bg: string; color: string }> = {
  AS: { bg:'#EAF3DE', color:'#27500A' },
  S:  { bg:'#E6F1FB', color:'#042C53' },
  SB: { bg:'#FAEEDA', color:'#412402' },
  NA: { bg:'#F1EFE8', color:'#444441' },
};

export default function ReporteScreen() {
  const aeronave         = useConfigStore((s) => s.aeronave);
  const sesion           = useSesionStore((s) => s.sesion);
  const estado           = useSesionStore((s) => s.estado);
  const timer            = useSesionStore((s) => s.timerSegundos);
  const fallasUsadas     = useSesionStore((s) => s.fallasActivasIds);
  const finalizarSesion  = useSesionStore((s) => s.finalizarSesion);
  const resetSesion      = useSesionStore((s) => s.resetSesion);

  const [evalGlobal,  setEvalGlobal]  = useState<ResultadoManiobra | null>(null);
  const [observaciones, setObs]       = useState('');
  const [firmada,     setFirmada]     = useState(false);
  const [firmaB64,    setFirmaB64]    = useState<string | null>(null);
  const [mostrarFirma,setMostrarFirma]= useState(false);
  const sigRef = useRef<any>(null);

  const maniobras = aeronave === 'AW109' ? MANIOBRAS_AW109 : MANIOBRAS_R44;

  function getEval(id: string): ResultadoManiobra | null {
    return sesion?.evaluaciones.find((e) => e.maniobra_id === id)?.resultado ?? null;
  }

  const evaluadasCount = maniobras.filter((m) => {
    const ev = getEval(m.id);
    return ev !== null && ev !== 'NA';
  }).length;

  function handleFinalizar() {
    if (!evalGlobal) {
      Alert.alert('Evaluación global requerida', 'Seleccionar la evaluación global del piloto.');
      return;
    }
    if (!firmada) {
      Alert.alert('Firma requerida', 'El instructor debe firmar el reporte antes de finalizar.');
      return;
    }
    Alert.alert(
      'Finalizar sesión',
      '¿Confirmar el cierre de esta sesión? Se generará el reporte PDF.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar y guardar',
          onPress: () => {
            finalizarSesion(firmaB64, evalGlobal, observaciones);
            Alert.alert(
              '✓ Sesión finalizada',
              'Reporte registrado correctamente.\nEl PDF se generará y enviará automáticamente al piloto.',
              [{ text: 'OK', onPress: resetSesion }],
            );
          },
        },
      ],
    );
  }

  // ── Sin sesión activa ─────────────────────────────────────────────────────
  if (estado === 'IDLE' || (!sesion && estado !== 'COMPLETADA')) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyIco}>📄</Text>
        <Text style={styles.emptyTitle}>Sin sesión para reportar</Text>
        <Text style={styles.emptySub}>Iniciar una sesión en la pestaña Sesión</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reporte Final de Sesión</Text>
          <Text style={styles.headerSub}>
            {sesion?.aeronave} · {new Date(sesion?.hora_inicio ?? 0).toLocaleDateString('es-AR')}
          </Text>
        </View>

        {/* Datos de sesión */}
        <SectionHeader>Datos de la sesión</SectionHeader>
        <Card>
          <Row label="Piloto"       value={sesion?.piloto_nombre ?? '—'} />
          <Row label="Licencia"     value={sesion?.piloto_licencia ?? '—'} />
          <Row label="Instructor"   value={sesion?.instructor_nombre ?? '—'} />
          <Row label="Simulador"    value={sesion?.simulador ?? '—'} />
          <Row label="Escenario"    value={sesion?.config.icao ?? '—'} />
          <Row label="Duración"     value={fmtTimer(timer)} />
          <Row label="Maniobras"    value={`${evaluadasCount} / ${maniobras.length} evaluadas`} />
          <Row label="Fallas usadas"value={`${fallasUsadas.size} inyectadas`} />
        </Card>

        {/* Evaluaciones por maniobra */}
        <SectionHeader>Evaluaciones</SectionHeader>
        <Card>
          {maniobras.map((man) => {
            const ev  = getEval(man.id);
            const obs = sesion?.evaluaciones.find((e) => e.maniobra_id === man.id)?.observaciones;
            return (
              <View key={man.id} style={styles.manRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.manNombre}>{man.nombre}</Text>
                  <Text style={styles.manCat}>{man.categoria}</Text>
                  {obs ? <Text style={styles.manObs}>{obs}</Text> : null}
                </View>
                {ev ? (
                  <View style={[styles.evBadge, { backgroundColor: RC[ev].bg }]}>
                    <Text style={[styles.evTxt, { color: RC[ev].color }]}>{ev}</Text>
                  </View>
                ) : (
                  <Text style={styles.noEv}>—</Text>
                )}
              </View>
            );
          })}
        </Card>

        {/* Condiciones meteorológicas */}
        <SectionHeader>Condiciones meteorológicas</SectionHeader>
        <Card>
          <Row label="Viento"      value={`${sesion?.config.meteo.viento_dir}° / ${sesion?.config.meteo.viento_kts} kts`} />
          <Row label="Visibilidad" value={`${sesion?.config.meteo.visibilidad_sm} SM`} />
          <Row label="Temperatura" value={`${sesion?.config.meteo.temperatura_c}°C`} />
          <Row label="Nubes"       value={sesion?.config.meteo.tipo_nubes ?? '—'} />
          <Row label="Turbulencia" value={['Ninguna','Leve','Moderada','Severa'][sesion?.config.meteo.turbulencia ?? 0]} />
        </Card>

        {/* Evaluación global */}
        <SectionHeader>Evaluación global del piloto</SectionHeader>
        <Card>
          <View style={styles.evGlobalRow}>
            {(['AS','S','SB','NA'] as ResultadoManiobra[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.evGlobalBtn,
                  {
                    backgroundColor: evalGlobal === r ? RC[r].bg : Colors.white,
                    borderColor:     evalGlobal === r ? RC[r].color : Colors.grayBorder,
                    borderWidth:     evalGlobal === r ? 2 : 0.5,
                  },
                ]}
                onPress={() => setEvalGlobal(r)}
                activeOpacity={0.8}
              >
                <Text style={[styles.evGlobalLbl, { color: evalGlobal === r ? RC[r].color : Colors.gray }]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <CardTitle>Observaciones generales</CardTitle>
          <TextInput
            style={styles.obsInput}
            multiline
            numberOfLines={4}
            placeholder="Comentarios generales sobre el desempeño del piloto en esta sesión..."
            placeholderTextColor={Colors.grayMid}
            value={observaciones}
            onChangeText={setObs}
          />
        </Card>

        {/* Firma digital */}
        <SectionHeader>Firma del instructor</SectionHeader>
        <Card>
          {!firmada ? (
            <>
              {mostrarFirma ? (
                <View>
                  <View style={styles.sigWrap}>
                    <SignatureCanvas
                      ref={sigRef}
                      onOK={(sig: string) => {
                        setFirmaB64(sig);
                        setFirmada(true);
                        setMostrarFirma(false);
                      }}
                      onEmpty={() => Alert.alert('Firma vacía', 'Dibujar la firma antes de confirmar.')}
                      descriptionText=""
                      clearText="Borrar"
                      confirmText="Confirmar firma"
                      webStyle={sigStyle}
                      autoClear={false}
                      style={{ height: 200, width: '100%' }}
                    />
                  </View>
                  <Btn
                    label="Cancelar"
                    variant="ghost"
                    onPress={() => setMostrarFirma(false)}
                    style={{ marginTop: Spacing.xs }}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.sigPlaceholder}
                  onPress={() => setMostrarFirma(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sigPlaceholderTxt}>Tocar para firmar digitalmente</Text>
                  <Text style={styles.sigPlaceholderSub}>
                    {sesion?.instructor_nombre ?? 'Instructor'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.firmadoWrap}>
              <Text style={styles.firmadoIco}>✓</Text>
              <View>
                <Text style={styles.firmadoTxt}>Firmado digitalmente</Text>
                <Text style={styles.firmadoSub}>
                  {sesion?.instructor_nombre} · {new Date().toLocaleString('es-AR')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setFirmada(false); setFirmaB64(null); }}>
                <Text style={styles.refirmarTxt}>Refirmar</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        <Divider />

        {/* Acciones finales */}
        <View style={styles.finalBtns}>
          <Btn
            label="Finalizar y guardar sesión"
            variant="primary"
            onPress={handleFinalizar}
            fullWidth
            disabled={!evalGlobal || !firmada}
          />
          <Btn
            label="Volver a la sesión"
            variant="ghost"
            onPress={() => {}}
            fullWidth
            style={{ marginTop: Spacing.xs }}
          />
        </View>

        {(!evalGlobal || !firmada) && (
          <View style={styles.reqsWrap}>
            {!evalGlobal && (
              <Text style={styles.reqTxt}>• Falta: evaluación global del piloto</Text>
            )}
            {!firmada && (
              <Text style={styles.reqTxt}>• Falta: firma digital del instructor</Text>
            )}
          </View>
        )}

      </View>
    </ScrollView>
  );
}

// Estilos del canvas de firma (se inyectan como webStyle en SignatureCanvas)
const sigStyle = `
  .m-signature-pad { box-shadow: none; border: 1px solid #D3D1C7; border-radius: 8px; }
  .m-signature-pad--body { border: none; }
  .m-signature-pad--footer { background: #F1EFE8; padding: 8px; }
  .button { border-radius: 6px; padding: 8px 16px; font-size: 13px; font-weight: 500; }
  .button.clear { background: #F1EFE8; color: #5F5E5A; border: 1px solid #D3D1C7; }
  .button.save  { background: #185FA5; color: #fff; border: none; }
`;

const styles = StyleSheet.create({
  screen:        { flex:1, backgroundColor:Colors.background },
  content:       { padding:Spacing.lg, paddingBottom:60 },
  emptyWrap:     { flex:1, alignItems:'center', justifyContent:'center', padding:Spacing.xxl },
  emptyIco:      { fontSize:48, marginBottom:Spacing.md },
  emptyTitle:    { fontSize:FontSize.xl, fontWeight:FontWeight.medium, color:Colors.text, marginBottom:Spacing.xs },
  emptySub:      { fontSize:FontSize.sm, color:Colors.gray, textAlign:'center' },
  header:        { backgroundColor:Colors.blue, borderRadius:Radius.lg, padding:Spacing.md, marginBottom:Spacing.md },
  headerTitle:   { fontSize:FontSize.xl, fontWeight:FontWeight.bold, color:Colors.white },
  headerSub:     { fontSize:FontSize.sm, color:'rgba(255,255,255,.75)', marginTop:3 },
  manRow:        { flexDirection:'row', alignItems:'flex-start', paddingVertical:Spacing.sm, borderBottomWidth:0.5, borderBottomColor:Colors.grayBorder },
  manNombre:     { fontSize:FontSize.sm, fontWeight:FontWeight.medium, color:Colors.text },
  manCat:        { fontSize:FontSize.xxs, color:Colors.gray, marginTop:1 },
  manObs:        { fontSize:FontSize.xxs, color:Colors.blue, marginTop:3, fontStyle:'italic' },
  evBadge:       { borderRadius:Radius.sm, paddingHorizontal:Spacing.sm, paddingVertical:Spacing.xs, marginLeft:Spacing.sm, alignSelf:'flex-start' },
  evTxt:         { fontSize:FontSize.sm, fontWeight:FontWeight.bold },
  noEv:          { fontSize:FontSize.sm, color:Colors.grayMid, marginLeft:Spacing.sm },
  evGlobalRow:   { flexDirection:'row', gap:Spacing.sm, marginBottom:Spacing.md },
  evGlobalBtn:   { flex:1, alignItems:'center', justifyContent:'center', borderRadius:Radius.md, paddingVertical:18 },
  evGlobalLbl:   { fontSize:FontSize.xl, fontWeight:FontWeight.bold },
  obsInput:      { borderWidth:0.5, borderColor:Colors.grayBorder, borderRadius:Radius.md, padding:Spacing.sm, fontSize:FontSize.sm, color:Colors.text, backgroundColor:Colors.grayLight, minHeight:90, textAlignVertical:'top', marginBottom:Spacing.sm },
  sigWrap:       { borderWidth:0.5, borderColor:Colors.grayBorder, borderRadius:Radius.md, overflow:'hidden', marginBottom:Spacing.sm },
  sigPlaceholder:{ borderWidth:1.5, borderColor:Colors.grayBorder, borderStyle:'dashed', borderRadius:Radius.md, alignItems:'center', justifyContent:'center', height:120, backgroundColor:Colors.grayLight },
  sigPlaceholderTxt:{ fontSize:FontSize.md, color:Colors.gray },
  sigPlaceholderSub:{ fontSize:FontSize.xs, color:Colors.grayMid, marginTop:4 },
  firmadoWrap:   { flexDirection:'row', alignItems:'center', gap:Spacing.md, backgroundColor:Colors.greenLight, borderWidth:0.5, borderColor:Colors.green, borderRadius:Radius.md, padding:Spacing.md },
  firmadoIco:    { fontSize:28, color:Colors.greenDark },
  firmadoTxt:    { fontSize:FontSize.md, fontWeight:FontWeight.medium, color:Colors.greenDark },
  firmadoSub:    { fontSize:FontSize.xs, color:Colors.green, marginTop:2 },
  refirmarTxt:   { fontSize:FontSize.xs, color:Colors.blue, textDecorationLine:'underline', marginLeft:'auto' },
  finalBtns:     { marginTop:Spacing.md },
  reqsWrap:      { backgroundColor:Colors.amberLight, borderWidth:0.5, borderColor:Colors.amber, borderRadius:Radius.md, padding:Spacing.sm, marginTop:Spacing.sm },
  reqTxt:        { fontSize:FontSize.sm, color:Colors.amber },
});
