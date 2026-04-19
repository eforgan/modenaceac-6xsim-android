// src/screens/SesionScreen.tsx — v2.0
// Pantalla de sesión activa con telemetría extendida y gestión de fallas activas

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Animated, Pressable,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../theme';
import { Card, CardTitle, Btn, SectionHeader, ConnDot } from '../components';
import { useSesionStore }  from '../store/sesionStore';
import { useConfigStore }  from '../store/configStore';
import type { TelemetriaExtendida, FallaRegistrada } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(s: number): string {
  return `${String(Math.floor(s / 3600)).padStart(2,'0')}:`
       + `${String(Math.floor((s % 3600) / 60)).padStart(2,'0')}:`
       + `${String(s % 60).padStart(2,'0')}`;
}
function fmtAgo(ms: number): string {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60)  return `hace ${s}s`;
  if (s < 3600)return `hace ${Math.floor(s/60)}m`;
  return `hace ${Math.floor(s/3600)}h`;
}
function esTelExtendida(t: any): t is TelemetriaExtendida {
  return t != null && ('n1_2_pct' in t || 'oil_temp_c' in t);
}

// ══════════════════════════════════════════════════════════════════════════════
export default function SesionScreen() {
  const cfg  = useConfigStore();
  const {
    sesion, estado, timerSegundos: timer,
    telemetria: telem, telemExtendida,
    tieneTelExtendida,
    estadoBridge, bridgeInfo, ultimoAck,
    fallasActivasIds, fallasActivasCount, historialFallas,
    iniciarSesion, pausarSesion, reanudarSesion,
    tickTimer, limpiarFallas, desactivarFalla,
    setTelemExtendida, sincronizarFallas,
  } = useSesionStore();

  const conectado   = estadoBridge?.conexion === 'CONECTADO';
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const ackFade     = useRef(new Animated.Value(0)).current;
  const [telemTab, setTelemTab] = useState<'basica' | 'motor' | 'sistemas' | 'nav'>('basica');
  const [showHistorial, setShowHistorial] = useState(false);

  // ── Cronómetro ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (estado === 'EN_CURSO') {
      timerRef.current = setInterval(tickTimer, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [estado]);

  // ── Toast de ACK ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ultimoAck) return;
    Animated.sequence([
      Animated.timing(ackFade, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(ackFade, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [ultimoAck]);

  // ── Iniciar sesión ──────────────────────────────────────────────────────────
  const handleIniciar = useCallback(() => {
    if (!cfg.piloto_nombre) {
      Alert.alert('Datos incompletos', 'Ingresar nombre del piloto en Config.');
      return;
    }
    iniciarSesion({
      piloto_nombre:     cfg.piloto_nombre,
      piloto_licencia:   cfg.piloto_licencia,
      instructor_nombre: cfg.instructor_nombre,
      aeronave:          cfg.aeronave,
      config: {
        aeronave:   cfg.aeronave,
        icao:       cfg.icao,
        hora_local: cfg.hora_local,
        fecha:      new Date().toISOString().slice(0, 10),
        meteo:      cfg.meteo,
        xplane_ip:  cfg.xplane_ip,
      },
    });
  }, [cfg]);

  const handlePausaToggle = useCallback(() => {
    if (estado === 'EN_CURSO') {
      Alert.alert('Pausar sesión', '¿Pausar el cronómetro?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Pausar',   onPress: pausarSesion },
      ]);
    } else {
      reanudarSesion();
    }
  }, [estado]);

  // ── IDLE ────────────────────────────────────────────────────────────────────
  if (estado === 'IDLE' || estado === 'COMPLETADA') {
    return (
      <ScrollView style={s.screen}>
        <View style={s.content}>
          <View style={s.idleWrap}>
            <Text style={s.idleIco}>▶</Text>
            <Text style={s.idleTitle}>Sin sesión activa</Text>
            <Text style={s.idleSub}>
              {cfg.piloto_nombre
                ? `Piloto: ${cfg.piloto_nombre}`
                : 'Configurar piloto en la pestaña Config'}
            </Text>
            <Text style={s.idleSub}>
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
          {/* Estado del bridge en IDLE */}
          <BridgeStatusBar conectado={conectado} bridge={estadoBridge} ip={cfg.xplane_ip} />
        </View>
      </ScrollView>
    );
  }

  // ── SESIÓN ACTIVA ──────────────────────────────────────────────────────────
  const ext = tieneTelExtendida ? (telemExtendida ?? (esTelExtendida(telem) ? telem : null)) : null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={s.screen} contentContainerStyle={s.content}>

        {/* ══ CABECERA DE SESIÓN ══ */}
        <View style={s.sesHdr}>
          <View style={{ flex: 1 }}>
            <Text style={s.pilotNombre}>{sesion?.piloto_nombre}</Text>
            <Text style={s.pilotSub}>
              {sesion?.piloto_licencia} · {sesion?.aeronave} · {sesion?.instructor_nombre}
            </Text>
          </View>
          <View style={[
            s.estadoBadge,
            { backgroundColor: estado === 'PAUSADA' ? Colors.amberLight : '#d4edda' },
          ]}>
            <Text style={[
              s.estadoTxt,
              { color: estado === 'PAUSADA' ? Colors.amber : Colors.green },
            ]}>
              {estado === 'PAUSADA' ? '⏸ PAUSADA' : '▶ EN CURSO'}
            </Text>
          </View>
        </View>

        {/* ══ CRONÓMETRO ══ */}
        <Card style={s.timerCard}>
          <Text style={[
            s.timerTxt,
            estado === 'PAUSADA' && { color: Colors.amber },
          ]}>
            {fmt(timer)}
          </Text>
          <Text style={s.timerLbl}>
            {estado === 'PAUSADA' ? 'Sesión pausada' : 'Tiempo efectivo de sesión'}
          </Text>
          <View style={s.timerBtns}>
            <Btn
              label={estado === 'EN_CURSO' ? '⏸  Pausar' : '▶  Reanudar'}
              variant={estado === 'EN_CURSO' ? 'warning' : 'success'}
              onPress={handlePausaToggle}
              style={{ flex: 1 }}
            />
            <Btn
              label={`Limpiar fallas${fallasActivasCount > 0 ? ` (${fallasActivasCount})` : ''}`}
              variant="danger"
              onPress={() => {
                if (fallasActivasCount === 0) return;
                Alert.alert('Limpiar fallas', `Limpiar ${fallasActivasCount} falla(s) activa(s)?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Limpiar', style: 'destructive', onPress: limpiarFallas },
                ]);
              }}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* ══ FALLAS ACTIVAS ══ */}
        <FallasActivasPanel
          fallasIds={fallasIds}
          historial={historialFallas}
          onDesactivar={desactivarFalla}
          showHistorial={showHistorial}
          onToggleHistorial={() => setShowHistorial(v => !v)}
        />

        {/* ══ TELEMETRÍA — TABS ══ */}
        <View style={s.telemHeader}>
          <Text style={s.telemTitle}>Telemetría UDP</Text>
          <View style={s.telemTabs}>
            {(['basica','motor','sistemas','nav'] as const).map(tab => (
              <Pressable
                key={tab}
                onPress={() => setTelemTab(tab)}
                style={[s.telemTab, telemTab === tab && s.telemTabOn]}
              >
                <Text style={[s.telemTabTxt, telemTab === tab && s.telemTabTxtOn]}>
                  {tab === 'basica'   ? 'Vuelo' :
                   tab === 'motor'    ? 'Motor' :
                   tab === 'sistemas' ? 'Sistemas' : 'Nav'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {telemTab === 'basica'   && <TelemBasica   telem={telem} />}
        {telemTab === 'motor'    && <TelemMotor    ext={ext} aeronave={sesion?.aeronave ?? 'AW109'} />}
        {telemTab === 'sistemas' && <TelemSistemas ext={ext} />}
        {telemTab === 'nav'      && <TelemNav      telem={telem} ext={ext} />}

        {/* Botón telem extendida */}
        {!tieneTelExtendida && (
          <Pressable
            style={s.telemExtBtn}
            onPress={() => setTelemExtendida(true)}
          >
            <Text style={s.telemExtTxt}>
              ⚡ Activar telemetría extendida (motor #2, hidráulico, GPS)
            </Text>
          </Pressable>
        )}

        {/* ══ BRIDGE STATUS ══ */}
        <BridgeStatusBar conectado={conectado} bridge={estadoBridge} ip={cfg.xplane_ip} />
        {bridgeInfo && (
          <View style={s.bridgeInfoRow}>
            <InfoChip label="Bridge" value={`v${bridgeInfo.version}`} />
            <InfoChip label="X-Plane" value={`XP${bridgeInfo.xp}`} />
            <InfoChip label="Aeronave" value={bridgeInfo.aeronave} />
            <InfoChip label="Uptime" value={`${Math.floor(bridgeInfo.uptime_s / 60)}m`} />
            {estadoBridge?.latencia_ms != null && (
              <InfoChip
                label="Latencia"
                value={`${estadoBridge.latencia_ms}ms`}
                warn={estadoBridge.latencia_ms > 100}
              />
            )}
          </View>
        )}

        {/* ══ BOTÓN SYNC FALLAS ══ */}
        <Pressable style={s.syncBtn} onPress={() => sincronizarFallas()}>
          <Text style={s.syncTxt}>↻ Sincronizar fallas con X-Plane</Text>
        </Pressable>

        {/* ══ CONFIG ACTIVA ══ */}
        <SectionHeader>Configuración activa</SectionHeader>
        <Card>
          {[
            ['Escenario',  sesion?.config.icao ?? '—'],
            ['Hora local', sesion?.config.hora_local ?? '—'],
            ['Viento',     `${sesion?.config.meteo.viento_dir ?? 0}° / ${sesion?.config.meteo.viento_kts ?? 0} kts`],
            ['Visibilidad',`${sesion?.config.meteo.visibilidad_sm ?? 10} SM`],
            ['OAT',        `${sesion?.config.meteo.temperatura_c ?? 15}°C`],
            ['Nubes',      sesion?.config.meteo.tipo_nubes ?? '—'],
            ['QNH',        `${sesion?.config.meteo.qnh_inhg ?? 29.92} inHg`],
          ].map(([label, val]) => (
            <View key={label} style={ci.row}>
              <Text style={ci.lbl}>{label}</Text>
              <Text style={ci.val}>{val}</Text>
            </View>
          ))}
        </Card>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ══ TOAST ACK ══ */}
      {ultimoAck && (
        <Animated.View style={[s.toast, { opacity: ackFade,
          backgroundColor: ultimoAck.ok ? Colors.green : Colors.red }]}>
          <Text style={s.toastTxt}>{ultimoAck.mensaje}</Text>
        </Animated.View>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ══════════════════════════════════════════════════════════════════════════════

// ── Panel de fallas activas ────────────────────────────────────────────────
function FallasActivasPanel({
  fallasIds, historial, onDesactivar, showHistorial, onToggleHistorial,
}: {
  fallasIds:        Set<string>;
  historial:        FallaRegistrada[];
  onDesactivar:     (id: string, dr: string, nombre?: string, sistema?: string) => Promise<boolean>;
  showHistorial:    boolean;
  onToggleHistorial:() => void;
}) {
  const activas = historial.filter(f => f.limpiadaEn === null);

  if (activas.length === 0 && historial.length === 0) return null;

  return (
    <Card style={s.fallasCard}>
      <View style={s.fallasHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[s.fallasDot, activas.length > 0 && s.fallasDotOn]} />
          <CardTitle style={{ marginBottom: 0 }}>
            Fallas en simulador
          </CardTitle>
          {activas.length > 0 && (
            <View style={s.fallasBadge}>
              <Text style={s.fallasBadgeTxt}>{activas.length}</Text>
            </View>
          )}
        </View>
        {historial.length > activas.length && (
          <Pressable onPress={onToggleHistorial}>
            <Text style={s.histBtn}>{showHistorial ? '▲ ocultar' : '▼ historial'}</Text>
          </Pressable>
        )}
      </View>

      {/* Fallas activas */}
      {activas.length === 0 ? (
        <Text style={s.noFallas}>Sin fallas activas en el simulador</Text>
      ) : (
        activas.map(f => (
          <View key={f.fallaId} style={s.fallaRow}>
            <View style={s.fallaLeft}>
              <View style={s.fallaTagCrit}>
                <Text style={s.fallaTagCritTxt}>{f.sistema}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fallaNombre} numberOfLines={1}>{f.nombre}</Text>
                <Text style={s.fallaDr} numberOfLines={1}>{f.dataref}</Text>
              </View>
              <Text style={s.fallaTs}>{fmtAgo(f.inyectadaEn)}</Text>
            </View>
            <Pressable
              style={s.fallaLimpiar}
              onPress={() => {
                Alert.alert('Limpiar falla', `¿Limpiar "${f.nombre}"?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Limpiar', style: 'destructive',
                    onPress: () => onDesactivar(f.fallaId, f.dataref, f.nombre, f.sistema),
                  },
                ]);
              }}
            >
              <Text style={s.fallaLimpiarTxt}>✕</Text>
            </Pressable>
          </View>
        ))
      )}

      {/* Historial de fallas limpiadas */}
      {showHistorial && historial.filter(f => f.limpiadaEn !== null).length > 0 && (
        <>
          <Text style={s.histTitle}>Limpiadas en esta sesión</Text>
          {historial.filter(f => f.limpiadaEn !== null).map(f => (
            <View key={`h-${f.fallaId}-${f.inyectadaEn}`} style={[s.fallaRow, s.fallaRowHist]}>
              <View style={s.fallaLeft}>
                <View style={[s.fallaTagCrit, { backgroundColor: Colors.grayLight }]}>
                  <Text style={[s.fallaTagCritTxt, { color: Colors.gray }]}>{f.sistema}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.fallaNombre, { color: Colors.gray }]} numberOfLines={1}>
                    {f.nombre}
                  </Text>
                </View>
                <Text style={s.fallaTs}>✓ {fmtAgo(f.limpiadaEn!)}</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </Card>
  );
}

// ── Telemetría básica — vuelo ─────────────────────────────────────────────
function TelemBasica({ telem }: { telem: any }) {
  const cells = [
    { val: telem ? String(telem.altitud_ft) : '—', label: 'ALT ft',
      warn: false, crit: false },
    { val: telem ? String(telem.agl_ft ?? '—') : '—', label: 'AGL ft',
      warn: false, crit: telem && telem.agl_ft < 50 },
    { val: telem ? String(telem.vvi_fpm) : '—', label: 'VVI fpm',
      warn: telem && Math.abs(telem.vvi_fpm) > 500,
      crit: telem && Math.abs(telem.vvi_fpm) > 1500 },
    { val: telem ? String(telem.ias_kts) : '—', label: 'IAS kts',
      warn: false, crit: false },
    { val: telem ? String(telem.gs_kts ?? '—') : '—', label: 'GS kts',
      warn: false, crit: false },
    { val: telem ? telem.pitch_deg.toFixed(1) : '—', label: 'PITCH °',
      warn: telem && Math.abs(telem.pitch_deg) > 20,
      crit: telem && Math.abs(telem.pitch_deg) > 35 },
    { val: telem ? telem.roll_deg.toFixed(1) : '—', label: 'ROLL °',
      warn: telem && Math.abs(telem.roll_deg) > 30,
      crit: telem && Math.abs(telem.roll_deg) > 60 },
    { val: telem ? String(telem.hdg_mag) : '—', label: 'HDG °M',
      warn: false, crit: false },
    { val: telem ? String(telem.n_fallas ?? 0) : '—', label: 'FALLAS',
      warn: telem && telem.n_fallas > 0,
      crit: telem && telem.n_fallas >= 3 },
  ];
  return <TelemGrid cells={cells} />;
}

// ── Telemetría motor ──────────────────────────────────────────────────────
function TelemMotor({ ext, aeronave }: { ext: TelemetriaExtendida | null; aeronave: string }) {
  const isAW = aeronave === 'AW109';
  if (!ext) return <TelemNoExtended />;

  const cells = isAW ? [
    { val: ext.n1_pct.toFixed(1),    label: 'N1 M.1 %',  warn: ext.n1_pct > 100,  crit: ext.n1_pct > 107 },
    { val: ext.n1_2_pct.toFixed(1),  label: 'N1 M.2 %',  warn: ext.n1_2_pct > 100,crit: ext.n1_2_pct > 107 },
    { val: ext.n2_pct.toFixed(1),    label: 'N2 M.1 %',  warn: false,              crit: false },
    { val: ext.n2_2_pct.toFixed(1),  label: 'N2 M.2 %',  warn: false,              crit: false },
    { val: String(ext.tot_c),        label: 'TOT M.1 °C', warn: ext.tot_c > 800,   crit: ext.tot_c > 860 },
    { val: String(ext.tot2_c),       label: 'TOT M.2 °C', warn: ext.tot2_c > 800,  crit: ext.tot2_c > 860 },
    { val: ext.torque.toFixed(1),    label: 'TRQ M.1 %',  warn: ext.torque > 95,   crit: ext.torque > 100 },
    { val: ext.torque2.toFixed(1),   label: 'TRQ M.2 %',  warn: ext.torque2 > 95,  crit: ext.torque2 > 100 },
    { val: ext.rpm_rotor.toFixed(1), label: 'NR %',        warn: ext.rpm_rotor < 95 || ext.rpm_rotor > 107, crit: ext.rpm_rotor < 90 },
  ] : [
    { val: ext.n1_pct.toFixed(1),    label: 'Governor %', warn: ext.n1_pct < 97 || ext.n1_pct > 110, crit: ext.n1_pct < 90 || ext.n1_pct > 115 },
    { val: String(ext.tot_c),        label: 'CHT °C',     warn: ext.tot_c > 250,   crit: ext.tot_c > 305 },
    { val: ext.torque.toFixed(1),    label: 'MP inHg',    warn: false,              crit: false },
    { val: String(ext.rpm_motor),    label: 'RPM motor',  warn: false,              crit: false },
    { val: ext.rpm_rotor.toFixed(1), label: 'NR %',       warn: ext.rpm_rotor < 97 || ext.rpm_rotor > 110, crit: ext.rpm_rotor < 90 },
    { val: ext.fuel_lbs.toFixed(1),  label: 'Combustible', warn: ext.fuel_lbs < 20, crit: ext.fuel_lbs < 10 },
  ];
  return <TelemGrid cells={cells} />;
}

// ── Telemetría sistemas ───────────────────────────────────────────────────
function TelemSistemas({ ext }: { ext: TelemetriaExtendida | null }) {
  if (!ext) return <TelemNoExtended />;
  const cells = [
    { val: ext.oil_temp_c.toFixed(1),  label: 'Aceite T °C',  warn: ext.oil_temp_c > 130,  crit: ext.oil_temp_c > 150 },
    { val: ext.oil_press_psi.toFixed(0),label:'Aceite P PSI', warn: ext.oil_press_psi < 35, crit: ext.oil_press_psi < 25 },
    { val: ext.fuel_lbs.toFixed(1),    label: 'Fuel lbs',     warn: ext.fuel_lbs < 50,      crit: ext.fuel_lbs < 20 },
    { val: ext.volt_dc.toFixed(1),     label: 'Bus DC V',     warn: ext.volt_dc < 26,        crit: ext.volt_dc < 24 },
    { val: ext.amp_gen1.toFixed(0),    label: 'Gen.1 A',      warn: false,                   crit: false },
    { val: ext.amp_gen2.toFixed(0),    label: 'Gen.2 A',      warn: false,                   crit: false },
    { val: String(ext.hyd1_psi),       label: 'Hyd N.1 PSI',  warn: ext.hyd1_psi < 1400,    crit: ext.hyd1_psi < 800 },
    { val: String(ext.hyd2_psi),       label: 'Hyd N.2 PSI',  warn: ext.hyd2_psi < 1400,    crit: ext.hyd2_psi < 800 },
    { val: ext.baro_inhg.toFixed(2),   label: 'QNH inHg',     warn: false,                   crit: false },
  ];
  return <TelemGrid cells={cells} />;
}

// ── Telemetría navegación + meteo ─────────────────────────────────────────
function TelemNav({ telem, ext }: { telem: any; ext: TelemetriaExtendida | null }) {
  const cells = [
    { val: telem ? String(telem.hdg_mag) : '—', label: 'HDG °M',     warn: false, crit: false },
    { val: ext ? String(ext.hdg_true) : '—',    label: 'HDG °T',     warn: false, crit: false },
    { val: ext ? ext.tas_kts.toFixed(1) : '—',  label: 'TAS kts',    warn: false, crit: false },
    { val: telem ? String(telem.ias_kts) : '—', label: 'IAS kts',    warn: false, crit: false },
    { val: ext ? ext.lat.toFixed(4) : '—',      label: 'LAT °',      warn: false, crit: false },
    { val: ext ? ext.lon.toFixed(4) : '—',      label: 'LON °',      warn: false, crit: false },
    { val: ext ? String(ext.wind_dir) + '°' : '—', label: 'Viento dir', warn: false, crit: false },
    { val: ext ? ext.wind_kts.toFixed(1) : '—', label: 'Viento kts', warn: false, crit: false },
    { val: ext ? ext.oat_c.toFixed(1) + '°C' : '—', label: 'OAT',   warn: false, crit: false },
  ];
  return <TelemGrid cells={cells} />;
}

// ── Grid de telemetría ─────────────────────────────────────────────────────
function TelemGrid({ cells }: { cells: Array<{val:string;label:string;warn:boolean;crit:boolean}> }) {
  return (
    <View style={tg.grid}>
      {cells.map(c => (
        <View key={c.label} style={[tg.cell, c.crit && tg.cellCrit, c.warn && !c.crit && tg.cellWarn]}>
          <Text style={[tg.val, c.crit && tg.valCrit, c.warn && !c.crit && tg.valWarn]}>
            {c.val}
          </Text>
          <Text style={tg.lbl}>{c.label}</Text>
          {c.crit && <View style={tg.critDot} />}
        </View>
      ))}
    </View>
  );
}
const tg = StyleSheet.create({
  grid:     { flexDirection:'row', flexWrap:'wrap', gap:Spacing.xs, marginBottom:Spacing.md },
  cell:     { backgroundColor:Colors.grayLight, borderRadius:Radius.md, padding:Spacing.sm,
              alignItems:'center', flex:1, minWidth:'30%', position:'relative' },
  cellWarn: { backgroundColor:Colors.amberLight, borderWidth:0.5, borderColor:'#E8A730' },
  cellCrit: { backgroundColor:Colors.redLight,   borderWidth:0.5, borderColor:Colors.redBorder },
  val:      { fontSize:FontSize.xl+2, fontWeight:FontWeight.medium, color:Colors.text,
              fontVariant:['tabular-nums'] as any },
  valWarn:  { color: Colors.amber },
  valCrit:  { color: Colors.red },
  lbl:      { fontSize:FontSize.xxs, color:Colors.gray, marginTop:3, textAlign:'center' },
  critDot:  { position:'absolute', top:4, right:4, width:6, height:6,
              borderRadius:3, backgroundColor:Colors.red },
});

function TelemNoExtended() {
  return (
    <View style={tne.wrap}>
      <Text style={tne.ico}>📡</Text>
      <Text style={tne.txt}>Telemetría extendida no activa</Text>
      <Text style={tne.sub}>Activar en el botón de abajo para ver motor #2, hidráulico y más</Text>
    </View>
  );
}
const tne = StyleSheet.create({
  wrap: { alignItems:'center', paddingVertical:Spacing.xxl, backgroundColor:Colors.grayLight,
          borderRadius:Radius.md, marginBottom:Spacing.md },
  ico:  { fontSize:28, marginBottom:Spacing.sm },
  txt:  { fontSize:FontSize.md, fontWeight:FontWeight.medium, color:Colors.text },
  sub:  { fontSize:FontSize.sm, color:Colors.gray, textAlign:'center', marginTop:4, paddingHorizontal:20 },
});

// ── Bridge status bar ──────────────────────────────────────────────────────
function BridgeStatusBar({ conectado, bridge, ip }: {
  conectado: boolean;
  bridge:    any;
  ip:        string;
}) {
  return (
    <View style={[
      bs.wrap,
      { backgroundColor: conectado ? Colors.greenLight : Colors.redLight,
        borderColor:      conectado ? Colors.green      : Colors.redBorder },
    ]}>
      <ConnDot connected={conectado} />
      <Text style={[bs.txt, { color: conectado ? Colors.greenDark : Colors.red }]}>
        {conectado
          ? `UDP activo · ${ip}:49001${bridge?.latencia_ms != null ? ` · ${bridge.latencia_ms}ms` : ''}`
          : `Sin conexión UDP con X-Plane (${ip})`}
      </Text>
    </View>
  );
}
const bs = StyleSheet.create({
  wrap: { flexDirection:'row', alignItems:'center', gap:Spacing.xs,
          borderWidth:0.5, borderRadius:Radius.md, padding:Spacing.sm, marginBottom:Spacing.sm },
  txt:  { fontSize:FontSize.sm, fontWeight:FontWeight.medium, flex:1 },
});

// ── Info chip ──────────────────────────────────────────────────────────────
function InfoChip({ label, value, warn = false }: { label:string; value:string; warn?:boolean }) {
  return (
    <View style={[ic.chip, warn && ic.chipWarn]}>
      <Text style={ic.lbl}>{label}</Text>
      <Text style={[ic.val, warn && ic.valWarn]}>{value}</Text>
    </View>
  );
}
const ic = StyleSheet.create({
  chip:     { backgroundColor:Colors.grayLight, borderRadius:Radius.sm,
              paddingHorizontal:Spacing.sm, paddingVertical:3 },
  chipWarn: { backgroundColor:Colors.amberLight },
  lbl:      { fontSize:FontSize.xxs, color:Colors.gray, textAlign:'center' },
  val:      { fontSize:FontSize.xs, fontWeight:FontWeight.bold, color:Colors.text, textAlign:'center' },
  valWarn:  { color:Colors.amber },
});

const ci = StyleSheet.create({
  row: { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
         paddingVertical:Spacing.xs, borderBottomWidth:0.5, borderBottomColor:Colors.grayBorder },
  lbl: { fontSize:FontSize.sm, color:Colors.gray },
  val: { fontSize:FontSize.sm, fontWeight:FontWeight.medium, color:Colors.text },
});

// ── Styles principales ────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:       { flex:1, backgroundColor:Colors.background },
  content:      { padding:Spacing.lg, paddingBottom:40 },
  idleWrap:     { alignItems:'center', paddingTop:60 },
  idleIco:      { fontSize:48, color:Colors.grayMid, marginBottom:Spacing.md },
  idleTitle:    { fontSize:FontSize.xl, fontWeight:FontWeight.medium,
                  color:Colors.text, marginBottom:Spacing.sm },
  idleSub:      { fontSize:FontSize.sm, color:Colors.gray, textAlign:'center', marginBottom:4 },

  sesHdr:       { flexDirection:'row', alignItems:'flex-start', gap:Spacing.sm,
                  backgroundColor:Colors.blue, borderRadius:Radius.lg,
                  padding:Spacing.md, marginBottom:Spacing.md },
  pilotNombre:  { fontSize:FontSize.lg, fontWeight:FontWeight.bold, color:Colors.white },
  pilotSub:     { fontSize:FontSize.xs, color:'rgba(255,255,255,.75)', marginTop:3 },
  estadoBadge:  { borderRadius:Radius.full, paddingHorizontal:10,
                  paddingVertical:4, alignSelf:'flex-start' },
  estadoTxt:    { fontSize:FontSize.xs, fontWeight:FontWeight.bold },

  timerCard:    { alignItems:'center', paddingVertical:Spacing.xl },
  timerTxt:     { fontSize:54, fontWeight:FontWeight.medium, color:Colors.text,
                  fontVariant:['tabular-nums'] as any, letterSpacing:2 },
  timerLbl:     { fontSize:FontSize.sm, color:Colors.gray, marginTop:4, marginBottom:Spacing.md },
  timerBtns:    { flexDirection:'row', gap:Spacing.sm, width:'100%' },

  // Fallas card
  fallasCard:   { marginBottom:Spacing.md },
  fallasHeader: { flexDirection:'row', alignItems:'center',
                  justifyContent:'space-between', marginBottom:Spacing.sm },
  fallasDot:    { width:8, height:8, borderRadius:4, backgroundColor:Colors.grayBorder },
  fallasDotOn:  { backgroundColor:Colors.red },
  fallasBadge:  { backgroundColor:Colors.red, borderRadius:Radius.full,
                  width:20, height:20, alignItems:'center', justifyContent:'center' },
  fallasBadgeTxt:{ fontSize:FontSize.xs, color:Colors.white, fontWeight:FontWeight.bold },
  noFallas:     { fontSize:FontSize.sm, color:Colors.gray,
                  textAlign:'center', paddingVertical:Spacing.md },
  fallaRow:     { flexDirection:'row', alignItems:'center', gap:Spacing.sm,
                  paddingVertical:Spacing.xs, borderBottomWidth:0.5,
                  borderBottomColor:Colors.grayBorder },
  fallaRowHist: { opacity: 0.6 },
  fallaLeft:    { flex:1, flexDirection:'row', alignItems:'center', gap:Spacing.xs },
  fallaTagCrit: { backgroundColor:Colors.redLight, borderRadius:Radius.sm,
                  paddingHorizontal:5, paddingVertical:2 },
  fallaTagCritTxt:{ fontSize:FontSize.xxs, color:Colors.red, fontWeight:FontWeight.bold },
  fallaNombre:  { fontSize:FontSize.sm, fontWeight:FontWeight.medium,
                  color:Colors.text, flex:1 },
  fallaDr:      { fontSize:FontSize.xxs, color:Colors.gray, fontFamily:'monospace' },
  fallaTs:      { fontSize:FontSize.xxs, color:Colors.gray },
  fallaLimpiar: { width:28, height:28, borderRadius:14, backgroundColor:Colors.redLight,
                  alignItems:'center', justifyContent:'center' },
  fallaLimpiarTxt:{ fontSize:FontSize.sm, color:Colors.red, fontWeight:FontWeight.bold },
  histBtn:      { fontSize:FontSize.xs, color:Colors.blue },
  histTitle:    { fontSize:FontSize.xs, color:Colors.gray, marginTop:Spacing.sm,
                  marginBottom:Spacing.xs, fontWeight:FontWeight.bold,
                  textTransform:'uppercase', letterSpacing:0.5 },

  // Telemetría tabs
  telemHeader:  { flexDirection:'row', alignItems:'center',
                  justifyContent:'space-between', marginBottom:Spacing.sm },
  telemTitle:   { fontSize:FontSize.md, fontWeight:FontWeight.bold, color:Colors.text },
  telemTabs:    { flexDirection:'row', gap:4, backgroundColor:Colors.grayLight,
                  borderRadius:Radius.md, padding:3 },
  telemTab:     { paddingHorizontal:10, paddingVertical:5, borderRadius:Radius.sm },
  telemTabOn:   { backgroundColor:Colors.white,
                  shadowColor:'#000', shadowOpacity:.08, shadowRadius:3,
                  shadowOffset:{ width:0, height:1 }, elevation:2 },
  telemTabTxt:  { fontSize:FontSize.xs, color:Colors.gray },
  telemTabTxtOn:{ color:Colors.blue, fontWeight:FontWeight.bold },

  telemExtBtn:  { flexDirection:'row', alignItems:'center', justifyContent:'center',
                  padding:Spacing.sm, backgroundColor:Colors.blueLight,
                  borderRadius:Radius.md, marginBottom:Spacing.md,
                  borderWidth:0.5, borderColor:Colors.blueMid },
  telemExtTxt:  { fontSize:FontSize.sm, color:Colors.blue, fontWeight:FontWeight.medium },

  // Bridge info
  bridgeInfoRow:{ flexDirection:'row', flexWrap:'wrap', gap:Spacing.xs,
                  marginBottom:Spacing.sm },
  syncBtn:      { alignItems:'center', paddingVertical:Spacing.sm,
                  marginBottom:Spacing.md },
  syncTxt:      { fontSize:FontSize.sm, color:Colors.blue },

  // Toast
  toast:        { position:'absolute', bottom:20, left:Spacing.lg, right:Spacing.lg,
                  padding:Spacing.sm, borderRadius:Radius.md, alignItems:'center' },
  toastTxt:     { color:Colors.white, fontWeight:FontWeight.bold, fontSize:FontSize.sm },
});
