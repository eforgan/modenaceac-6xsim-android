// src/screens/ConfigScreen.tsx
// Pantalla 1 — Configuración del simulador
// Aeronave · IP · ICAO · Hora · Meteorología · Piloto

import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Switch, Alert,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../theme';
import {
  Card, CardTitle, Btn, SectionHeader, Row, ScreenHeader, ConnDot,
} from '../components';
import { useConfigStore } from '../store/configStore';
import { useSesionStore }  from '../store/sesionStore';
import { luaBridge }        from '../services/LuaBridge';
import { AERODROMOS }       from '../data/fallas';
import type { AeronaveId }  from '../types';

const TURBULENCIAS = ['Ninguna', 'Leve', 'Moderada', 'Severa'];
const NUBES        = ['CAVOK', 'SCT', 'BKN', 'OVC', 'CB', 'FG'];

export default function ConfigScreen() {
  const cfg        = useConfigStore();
  const conectado  = useSesionStore((s) => s.conectado);
  const setConn    = useSesionStore((s) => s.setConectado);
  const setTelem   = useSesionStore((s) => s.setTelemetria);
  const [ipInput,  setIpInput]  = useState(cfg.xplane_ip);
  const [pilInput, setPilInput] = useState(cfg.piloto_nombre);
  const [licInput, setLicInput] = useState(cfg.piloto_licencia);
  const [insInput, setInsInput] = useState(cfg.instructor_nombre);

  // Iniciar bridge UDP al montar
  useEffect(() => {
    cfg.cargar();
    luaBridge.init(cfg.xplane_ip, setTelem, setConn);
    return () => luaBridge.destroy();
  }, []);

  function aplicarConfig() {
    cfg.setXPlaneIP(ipInput);
    cfg.setPiloto(pilInput, licInput);
    cfg.setInstructor(insInput);
    luaBridge.destroy();
    luaBridge.init(ipInput, setTelem, setConn);
    luaBridge.setHora(cfg.hora_local);
    luaBridge.setPosicion(cfg.icao);
    luaBridge.setMeteo({
      viento_dir:     cfg.meteo.viento_dir,
      viento_kts:     cfg.meteo.viento_kts,
      visibilidad_sm: cfg.meteo.visibilidad_sm,
      turbulencia:    cfg.meteo.turbulencia,
      temperatura_c:  cfg.meteo.temperatura_c,
    });
    Alert.alert('Configuración aplicada', `X-Plane en ${ipInput}\nAeronave: ${cfg.aeronave}\nICAO: ${cfg.icao}`);
  }

  return (
    <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>MODENACEAC · 6XSIM</Text>
            <Text style={styles.headerSub}>Configuración del simulador</Text>
          </View>
          <View style={styles.connBadge}>
            <ConnDot connected={conectado} />
            <Text style={[styles.connTxt, { color: conectado ? Colors.greenDark : Colors.red }]}>
              {conectado ? 'X-Plane conectado' : 'Desconectado'}
            </Text>
          </View>
        </View>

        {/* Aeronave */}
        <SectionHeader>Aeronave</SectionHeader>
        <View style={styles.aeroRow}>
          {(['AW109', 'R44'] as AeronaveId[]).map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.aeroBtn, cfg.aeronave === a && styles.aeroBtnOn]}
              onPress={() => cfg.setAeronave(a)}
              activeOpacity={0.75}
            >
              <Text style={[styles.aeroBtnTitle, cfg.aeronave === a && styles.aeroBtnTitleOn]}>
                {a}
              </Text>
              <Text style={styles.aeroBtnSub}>
                {a === 'AW109' ? 'Bimotor · PW206C · FADEC' : 'Monomotor · O-540 · Carburado'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Conexión */}
        <SectionHeader>Conexión X-Plane</SectionHeader>
        <Card>
          <CardTitle>IP del simulador (UDP)</CardTitle>
          <TextInput
            style={styles.input}
            value={ipInput}
            onChangeText={setIpInput}
            placeholder="192.168.1.100"
            placeholderTextColor={Colors.grayMid}
            keyboardType="numeric"
          />
          <Text style={styles.inputHint}>Puerto comandos: 49002 · Puerto telemetría: 49001</Text>
        </Card>

        {/* Escenario */}
        <SectionHeader>Escenario</SectionHeader>
        <Card>
          <CardTitle>Aeródromo ICAO</CardTitle>
          <View style={styles.icaoGrid}>
            {AERODROMOS.map((a) => (
              <TouchableOpacity
                key={a.icao + a.nombre}
                style={[styles.icaoBtn, cfg.icao === a.icao && styles.icaoBtnOn]}
                onPress={() => cfg.setIcao(a.icao)}
                activeOpacity={0.8}
              >
                <Text style={[styles.icaoCode, cfg.icao === a.icao && styles.icaoCodeOn]}>
                  {a.icao}
                </Text>
                <Text style={styles.icaoNombre} numberOfLines={1}>{a.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Hora */}
        <Card>
          <CardTitle>Hora local</CardTitle>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Hora</Text>
            <View style={styles.horaSelector}>
              {['06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00'].map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.horaBtn, cfg.hora_local === h && styles.horaBtnOn]}
                  onPress={() => cfg.setHora(h)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.horaBtnTxt, cfg.hora_local === h && styles.horaBtnTxtOn]}>
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        {/* Meteorología */}
        <SectionHeader>Meteorología</SectionHeader>
        <Card>
          <CardTitle>Viento</CardTitle>
          <Row
            label={`Dirección: ${cfg.meteo.viento_dir}°`}
            value=""
          />
          <SliderRow
            min={0} max={360} step={5}
            value={cfg.meteo.viento_dir}
            onValue={(v) => cfg.setMeteo({ viento_dir: v })}
          />
          <Row label={`Intensidad: ${cfg.meteo.viento_kts} kts`} value="" />
          <SliderRow
            min={0} max={50} step={1}
            value={cfg.meteo.viento_kts}
            onValue={(v) => cfg.setMeteo({ viento_kts: v })}
          />
        </Card>

        <Card>
          <CardTitle>Visibilidad y nubes</CardTitle>
          <Row label={`Visibilidad: ${cfg.meteo.visibilidad_sm} SM`} value="" />
          <SliderRow
            min={0} max={50} step={1}
            value={cfg.meteo.visibilidad_sm}
            onValue={(v) => cfg.setMeteo({ visibilidad_sm: v })}
          />
          <Row label={`Temperatura: ${cfg.meteo.temperatura_c}°C`} value="" />
          <SliderRow
            min={-15} max={45} step={1}
            value={cfg.meteo.temperatura_c}
            onValue={(v) => cfg.setMeteo({ temperatura_c: v })}
          />
          <CardTitle>Tipo de nubes</CardTitle>
          <View style={styles.nubesRow}>
            {NUBES.map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.nubeBtn, cfg.meteo.tipo_nubes === n && styles.nubeBtnOn]}
                onPress={() => cfg.setMeteo({ tipo_nubes: n as any })}
              >
                <Text style={[styles.nubeTxt, cfg.meteo.tipo_nubes === n && styles.nubeTxtOn]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <CardTitle>Turbulencia</CardTitle>
          <View style={styles.nubesRow}>
            {TURBULENCIAS.map((t, i) => (
              <TouchableOpacity
                key={t}
                style={[styles.nubeBtn, cfg.meteo.turbulencia === i && styles.nubeBtnOn]}
                onPress={() => cfg.setMeteo({ turbulencia: i as 0|1|2|3 })}
              >
                <Text style={[styles.nubeTxt, cfg.meteo.turbulencia === i && styles.nubeTxtOn]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Piloto e Instructor */}
        <SectionHeader>Tripulación</SectionHeader>
        <Card>
          <CardTitle>Piloto</CardTitle>
          <TextInput
            style={[styles.input, { marginBottom: Spacing.xs }]}
            value={pilInput}
            onChangeText={setPilInput}
            placeholder="Nombre y apellido del piloto"
            placeholderTextColor={Colors.grayMid}
          />
          <TextInput
            style={styles.input}
            value={licInput}
            onChangeText={setLicInput}
            placeholder="Nro. de licencia (ej. PPL-H-0741)"
            placeholderTextColor={Colors.grayMid}
          />
          <CardTitle>Instructor</CardTitle>
          <TextInput
            style={styles.input}
            value={insInput}
            onChangeText={setInsInput}
            placeholder="Nombre del instructor"
            placeholderTextColor={Colors.grayMid}
          />
        </Card>

        <Btn
          label="Aplicar configuración en X-Plane"
          variant="primary"
          onPress={aplicarConfig}
          fullWidth
          style={{ marginTop: Spacing.sm }}
        />

      </View>
    </ScrollView>
  );
}

// ── SliderRow — componente local de slider numérico ───────────────────────
function SliderRow({ min, max, step, value, onValue }: {
  min: number; max: number; step: number;
  value: number; onValue: (v: number) => void;
}) {
  // Slider manual con botones +/- para React Native puro
  const dec = () => onValue(Math.max(min, value - step));
  const inc = () => onValue(Math.min(max, value + step));
  return (
    <View style={sls.row}>
      <TouchableOpacity style={sls.btn} onPress={dec}><Text style={sls.btnTxt}>−</Text></TouchableOpacity>
      <View style={sls.track}>
        <View style={[sls.fill, { width: `${((value - min) / (max - min)) * 100}%` }]} />
      </View>
      <TouchableOpacity style={sls.btn} onPress={inc}><Text style={sls.btnTxt}>+</Text></TouchableOpacity>
    </View>
  );
}
const sls = StyleSheet.create({
  row:    { flexDirection:'row', alignItems:'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  btn:    { width:32, height:32, borderRadius:Radius.sm, backgroundColor:Colors.grayLight, alignItems:'center', justifyContent:'center' },
  btnTxt: { fontSize:18, color:Colors.blue, fontWeight:FontWeight.medium },
  track:  { flex:1, height:4, backgroundColor:Colors.grayBorder, borderRadius:2, overflow:'hidden' },
  fill:   { height:'100%', backgroundColor:Colors.blue, borderRadius:2 },
});

const styles = StyleSheet.create({
  screen:  { flex:1, backgroundColor:Colors.background },
  content: { padding:Spacing.lg, paddingBottom:40 },
  header:  {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    marginBottom:Spacing.lg,
    backgroundColor:Colors.blue, borderRadius:Radius.lg,
    padding:Spacing.md,
  },
  headerTitle: { fontSize:FontSize.lg, fontWeight:FontWeight.bold, color:Colors.white },
  headerSub:   { fontSize:FontSize.xs, color:'rgba(255,255,255,.7)', marginTop:2 },
  connBadge:   { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'rgba(255,255,255,.15)', borderRadius:Radius.full, paddingHorizontal:10, paddingVertical:4 },
  connTxt:     { fontSize:FontSize.xs, fontWeight:FontWeight.medium },
  aeroRow:     { flexDirection:'row', gap:Spacing.sm, marginBottom:Spacing.sm },
  aeroBtn:     { flex:1, padding:Spacing.md, borderRadius:Radius.lg, borderWidth:1, borderColor:Colors.grayBorder, backgroundColor:Colors.white },
  aeroBtnOn:   { borderColor:Colors.blue, borderWidth:2, backgroundColor:Colors.blueLight },
  aeroBtnTitle:{ fontSize:FontSize.lg, fontWeight:FontWeight.medium, color:Colors.text, marginBottom:4 },
  aeroBtnTitleOn:{ color:Colors.blueDark },
  aeroBtnSub:  { fontSize:FontSize.xxs, color:Colors.gray },
  input:       { borderWidth:0.5, borderColor:Colors.grayBorder, borderRadius:Radius.md, padding:Spacing.sm, fontSize:FontSize.md, color:Colors.text, backgroundColor:Colors.white, marginBottom:Spacing.xs },
  inputHint:   { fontSize:FontSize.xxs, color:Colors.gray, fontStyle:'italic', marginTop:2 },
  icaoGrid:    { flexDirection:'row', flexWrap:'wrap', gap:Spacing.xs },
  icaoBtn:     { paddingHorizontal:Spacing.sm, paddingVertical:Spacing.xs, borderRadius:Radius.sm, borderWidth:0.5, borderColor:Colors.grayBorder, backgroundColor:Colors.white, minWidth:80 },
  icaoBtnOn:   { borderColor:Colors.blue, backgroundColor:Colors.blueLight },
  icaoCode:    { fontSize:FontSize.sm, fontWeight:FontWeight.bold, color:Colors.text },
  icaoCodeOn:  { color:Colors.blue },
  icaoNombre:  { fontSize:FontSize.xxs, color:Colors.gray },
  sliderRow:   { marginBottom:Spacing.sm },
  sliderLabel: { fontSize:FontSize.sm, color:Colors.gray, marginBottom:4 },
  horaSelector:{ flexDirection:'row', flexWrap:'wrap', gap:Spacing.xs },
  horaBtn:     { paddingHorizontal:Spacing.sm, paddingVertical:Spacing.xs, borderRadius:Radius.sm, borderWidth:0.5, borderColor:Colors.grayBorder, backgroundColor:Colors.white },
  horaBtnOn:   { borderColor:Colors.blue, backgroundColor:Colors.blueLight },
  horaBtnTxt:  { fontSize:FontSize.sm, color:Colors.gray },
  horaBtnTxtOn:{ color:Colors.blue, fontWeight:FontWeight.medium },
  nubesRow:    { flexDirection:'row', flexWrap:'wrap', gap:Spacing.xs, marginBottom:Spacing.sm },
  nubeBtn:     { paddingHorizontal:Spacing.sm, paddingVertical:Spacing.xs, borderRadius:Radius.sm, borderWidth:0.5, borderColor:Colors.grayBorder, backgroundColor:Colors.white },
  nubeBtnOn:   { borderColor:Colors.blue, backgroundColor:Colors.blueLight },
  nubeTxt:     { fontSize:FontSize.sm, color:Colors.gray },
  nubeTxtOn:   { color:Colors.blue, fontWeight:FontWeight.medium },
});
