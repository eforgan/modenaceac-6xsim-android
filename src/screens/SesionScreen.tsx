// src/screens/SesionScreen.tsx
// Pantalla 3 — Sesión activa con cronómetro y telemetría UDP en tiempo real

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../theme';
import { Card, CardTitle, Btn, SectionHeader, KpiCard, ConnDot } from '../components';
import { useSesionStore }  from '../store/sesionStore';
import { useConfigStore }  from '../store/configStore';

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtTimer(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

export default function SesionScreen() {
  const cfg          = useConfigStore();
  const sesion       = useSesionStore((s) => s.sesion);
  const estado       = useSesionStore((s) => s.estado);
  const timer        = useSesionStore((s) => s.timerSegundos);
  const telem        = useSesionStore((s) => s.telemetria);
  const conectado    = useSesionStore((s) => s.conectado);
  const fallasCount  = useSesionStore((s) => s.fallasActivasCount);
  const fallasIds    = useSesionStore((s) => s.fallasActivasIds);

  const iniciarSesion  = useSesionStore((s) => s.iniciarSesion);
  const pausarSesion   = useSesionStore((s) => s.pausarSesion);
  const reanudarSesion = useSesionStore((s) => s.reanudarSesion);
  const tickTimer      = useSesionStore((s) => s.tickTimer);
  const limpiarFallas  = useSesionStore((s) => s.limpiarFallas);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cronómetro
  useEffect(() => {
    if (estado === 'EN_CURSO') {
      timerRef.current = setInterval(tickTimer, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [estado]);

  function handleIniciar() {
    if (!cfg.piloto_nombre) {
      Alert.alert('Datos incompletos', 'Ingresar nombre del piloto en la pantalla Config.');
      return;
    }
    iniciarSesion({
      piloto_nombre:     cfg.piloto_nombre,
      piloto_licencia:   cfg.piloto_licencia,
      instructor_nombre: cfg.instructor_nombre,
      aeronave:          cfg.aeronave,
      config: {
        aeronave:  cfg.aeronave,
        icao:      cfg.icao,
        hora_local:cfg.hora_local,
        fecha:     new Date().toISOString().slice(0, 10),
        meteo:     cfg.meteo,
        xplane_ip: cfg.xplane_ip,
      },
    });
  }

  function handlePausaToggle() {
    if (estado === 'EN_CURSO') {
      Alert.alert('Pausar sesión', '¿Pausar el cronómetro?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Pausar', onPress: pausarSesion },
      ]);
    } else {
      reanudarSesion();
    }
  }

  // ── Estado IDLE — sin sesión activa ──────────────────────────────────────
  if (estado === 'IDLE' || estado === 'COMPLETADA') {
    return (
      <ScrollView style={styles.screen}>
        <View style={styles.content}>
          <View style={styles.idleWrap}>
            <Text style={styles.idleIco}>▶</Text>
            <Text style={styles.idleTitle}>Sin sesión activa</Text>
            <Text style={styles.idleSub}>
              {cfg.piloto_nombre
                ? `Piloto: ${cfg.piloto_nombre}`
                : 'Configurar piloto en la pestaña Config'}
            </Text>
            <Text style={styles.idleSub}>
              {cfg.aeronave} · {cfg.icao} · {cfg.hora_local}
            </Text>
            <Btn
              label="Iniciar nueva sesión"
              variant="primary"
              onPress={handleIniciar}
              style={{ marginTop: Spacing.xl }}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  // ── Sesión activa ─────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.screen}>
      <View style={styles.content}>

        {/* Cabecera de sesión */}
        <View style={styles.sesHdr}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pilotNombre}>{sesion?.piloto_nombre}</Text>
            <Text style={styles.pilotSub}>
              {sesion?.piloto_licencia} · {sesion?.aeronave} · {sesion?.instructor_nombre}
            </Text>
          </View>
          <View style={[
            styles.estadoBadge,
            { backgroundColor: estado === 'PAUSADA' ? Colors.amberLight : Colors.greenLight },
          ]}>
            <Text style={[
              styles.estadoTxt,
              { color: estado === 'PAUSADA' ? Colors.amber : Colors.greenDark },
            ]}>
              {estado === 'PAUSADA' ? '⏸ PAUSADA' : '▶ EN CURSO'}
            </Text>
          </View>
        </View>

        {/* Cronómetro */}
        <Card style={styles.timerCard}>
          <Text style={styles.timerTxt}>{fmtTimer(timer)}</Text>
          <Text style={styles.timerLbl}>Tiempo efectivo de sesión</Text>
          <View style={styles.timerBtns}>
            <Btn
              label={estado === 'EN_CURSO' ? '⏸  Pausar' : '▶  Reanudar'}
              variant={estado === 'EN_CURSO' ? 'warning' : 'success'}
              onPress={handlePausaToggle}
              style={{ flex: 1 }}
            />
            <Btn
              label="Limpiar fallas"
              variant="danger"
              onPress={() => {
                Alert.alert('Limpiar fallas', `Limpiar ${fallasCount} falla(s) activa(s)?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Limpiar', style: 'destructive', onPress: limpiarFallas },
                ]);
              }}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Fallas activas */}
        {fallasCount > 0 && (
          <Card>
            <CardTitle>Fallas activas en simulador</CardTitle>
            <View style={styles.fallasWrap}>
              {Array.from(fallasIds).map((id) => (
                <View key={id} style={styles.fallaTag}>
                  <Text style={styles.fallaTagTxt} numberOfLines={1}>{id.replace(/_/g,' ')}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Telemetría */}
        <SectionHeader>Telemetría · UDP {cfg.xplane_ip}:49001</SectionHeader>
        <View style={styles.telemGrid}>
          <TelemCell
            value={telem ? String(telem.altitud_ft) : '---'}
            label="ALT ft"
            color={!telem ? Colors.gray : undefined}
          />
          <TelemCell
            value={telem ? String(telem.vvi_fpm) : '---'}
            label="VVI fpm"
            color={telem && Math.abs(telem.vvi_fpm) > 500 ? Colors.amber : undefined}
          />
          <TelemCell
            value={telem ? String(telem.ias_kts) : '---'}
            label="IAS kts"
          />
          <TelemCell
            value={telem ? telem.pitch_deg.toFixed(1) : '---'}
            label="PITCH °"
            color={telem && Math.abs(telem.pitch_deg) > 30 ? Colors.red : undefined}
          />
          <TelemCell
            value={telem ? telem.roll_deg.toFixed(1) : '---'}
            label="ROLL °"
            color={telem && Math.abs(telem.roll_deg) > 45 ? Colors.red : undefined}
          />
          <TelemCell
            value={telem ? String(telem.hdg_mag) : '---'}
            label="HDG °M"
          />
          <TelemCell
            value={telem ? String(telem.rpm_motor) : '---'}
            label="RPM motor"
          />
          <TelemCell
            value={telem ? String(telem.rpm_rotor) : '---'}
            label="RPM rotor"
            color={telem && telem.rpm_rotor < 360 ? Colors.red : undefined}
          />
          <TelemCell
            value={telem ? telem.torque.toFixed(1) : '---'}
            label="Torque %"
            color={telem && telem.torque > 100 ? Colors.red : undefined}
          />
        </View>

        {/* Estado de conexión UDP */}
        <View style={[
          styles.udpStatus,
          { backgroundColor: conectado ? Colors.greenLight : Colors.redLight,
            borderColor: conectado ? Colors.green : Colors.red },
        ]}>
          <ConnDot connected={conectado} />
          <Text style={[
            styles.udpTxt,
            { color: conectado ? Colors.greenDark : Colors.red },
          ]}>
            {conectado ? `UDP activo · X-Plane en ${cfg.xplane_ip}` : 'Sin conexión UDP con X-Plane'}
          </Text>
        </View>

        {/* Config activa */}
        <SectionHeader>Configuración activa</SectionHeader>
        <Card>
          <View style={styles.configRow}>
            <ConfigItem label="Escenario" value={sesion?.config.icao ?? '—'} />
            <ConfigItem label="Hora local" value={sesion?.config.hora_local ?? '—'} />
            <ConfigItem label="Viento" value={`${sesion?.config.meteo.viento_dir}° / ${sesion?.config.meteo.viento_kts} kts`} />
            <ConfigItem label="Visib." value={`${sesion?.config.meteo.visibilidad_sm} SM`} />
            <ConfigItem label="OAT" value={`${sesion?.config.meteo.temperatura_c}°C`} />
            <ConfigItem label="Nublado" value={sesion?.config.meteo.tipo_nubes ?? '—'} />
          </View>
        </Card>

      </View>
    </ScrollView>
  );
}

// ── Sub-componentes locales ────────────────────────────────────────────────
function TelemCell({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <View style={tc.cell}>
      <Text style={[tc.val, color ? { color } : {}]}>{value}</Text>
      <Text style={tc.lbl}>{label}</Text>
    </View>
  );
}
const tc = StyleSheet.create({
  cell: { backgroundColor:Colors.grayLight, borderRadius:Radius.md, padding:Spacing.sm, alignItems:'center', flex:1, minWidth:'30%' },
  val:  { fontSize:FontSize.xl, fontWeight:FontWeight.medium, color:Colors.text, fontVariant:['tabular-nums'] as any },
  lbl:  { fontSize:FontSize.xxs, color:Colors.gray, marginTop:3, textAlign:'center' },
});

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={ci.row}>
      <Text style={ci.lbl}>{label}</Text>
      <Text style={ci.val}>{value}</Text>
    </View>
  );
}
const ci = StyleSheet.create({
  row: { flexDirection:'row', justifyContent:'space-between', paddingVertical:Spacing.xs, borderBottomWidth:0.5, borderBottomColor:Colors.grayBorder },
  lbl: { fontSize:FontSize.sm, color:Colors.gray },
  val: { fontSize:FontSize.sm, fontWeight:FontWeight.medium, color:Colors.text },
});

const styles = StyleSheet.create({
  screen:      { flex:1, backgroundColor:Colors.background },
  content:     { padding:Spacing.lg, paddingBottom:40 },
  idleWrap:    { alignItems:'center', paddingTop:60 },
  idleIco:     { fontSize:48, color:Colors.grayMid, marginBottom:Spacing.md },
  idleTitle:   { fontSize:FontSize.xl, fontWeight:FontWeight.medium, color:Colors.text, marginBottom:Spacing.sm },
  idleSub:     { fontSize:FontSize.sm, color:Colors.gray, textAlign:'center', marginBottom:4 },
  sesHdr:      { flexDirection:'row', alignItems:'flex-start', gap:Spacing.sm, backgroundColor:Colors.blue, borderRadius:Radius.lg, padding:Spacing.md, marginBottom:Spacing.md },
  pilotNombre: { fontSize:FontSize.lg, fontWeight:FontWeight.bold, color:Colors.white },
  pilotSub:    { fontSize:FontSize.xs, color:'rgba(255,255,255,.75)', marginTop:3 },
  estadoBadge: { borderRadius:Radius.full, paddingHorizontal:10, paddingVertical:4, alignSelf:'flex-start' },
  estadoTxt:   { fontSize:FontSize.xs, fontWeight:FontWeight.bold },
  timerCard:   { alignItems:'center', paddingVertical:Spacing.xl },
  timerTxt:    { fontSize:52, fontWeight:FontWeight.medium, color:Colors.text, fontVariant:['tabular-nums'] as any, letterSpacing:2 },
  timerLbl:    { fontSize:FontSize.sm, color:Colors.gray, marginTop:4, marginBottom:Spacing.md },
  timerBtns:   { flexDirection:'row', gap:Spacing.sm, width:'100%' },
  fallasWrap:  { flexDirection:'row', flexWrap:'wrap', gap:Spacing.xs },
  fallaTag:    { backgroundColor:Colors.redLight, borderWidth:0.5, borderColor:Colors.redBorder, borderRadius:Radius.full, paddingHorizontal:Spacing.sm, paddingVertical:3 },
  fallaTagTxt: { fontSize:FontSize.xxs, color:Colors.red, fontWeight:FontWeight.medium },
  telemGrid:   { flexDirection:'row', flexWrap:'wrap', gap:Spacing.xs, marginBottom:Spacing.md },
  udpStatus:   { flexDirection:'row', alignItems:'center', gap:Spacing.xs, borderWidth:0.5, borderRadius:Radius.md, padding:Spacing.sm, marginBottom:Spacing.md },
  udpTxt:      { fontSize:FontSize.sm, fontWeight:FontWeight.medium },
  configRow:   { gap:0 },
});
