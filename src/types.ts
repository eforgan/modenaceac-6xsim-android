// src/types.ts — Tipos globales app Android MODENACEAC 6XSIM
// Actualizado para Bridge v2.0

// ── Aeronave ──────────────────────────────────────────────────────────────
export type AeronaveId = 'AW109' | 'R44';

export interface Aeronave {
  id:         AeronaveId;
  nombre:     string;
  tipo:       string;
  ip:         string;
  puerto_udp: number;
  xplane_ver: 'XP11' | 'XP12';
}

// ── Telemetría ────────────────────────────────────────────────────────────

/** Telemetría básica — siempre disponible */
export interface TelemetriaSnapshot {
  // Altimetría
  altitud_ft:    number;
  agl_ft:        number;
  // Velocidades
  ias_kts:       number;
  gs_kts:        number;
  vvi_fpm:       number;
  // Actitud
  pitch_deg:     number;
  roll_deg:      number;
  hdg_mag:       number;
  // Motor #1 y rotor
  n1_pct:        number;
  n2_pct:        number;
  torque:        number;
  tot_c:         number;
  rpm_motor:     number;
  rpm_rotor:     number;
  // Estado
  paused:        boolean;
  n_fallas:      number;
  timestamp:     number;
  // Versión X-Plane que generó la trama
  xp_version:    11 | 12;
}

/** Telemetría extendida — disponible cuando TELEM_EXTENDED=true en Lua */
export interface TelemetriaExtendida extends TelemetriaSnapshot {
  // Motor #2
  n1_2_pct:      number;
  n2_2_pct:      number;
  torque2:       number;
  tot2_c:        number;
  // Sistemas
  oil_temp_c:    number;
  oil_press_psi: number;
  fuel_lbs:      number;
  volt_dc:       number;
  amp_gen1:      number;
  amp_gen2:      number;
  hyd1_psi:      number;
  hyd2_psi:      number;
  // Navegación
  tas_kts:       number;
  hdg_true:      number;
  baro_inhg:     number;
  lat:           number;
  lon:           number;
  // Meteorología live
  wind_dir:      number;
  wind_kts:      number;
  oat_c:         number;
  // Fallas activas como array de sufijos
  fallas_activas?: string[];
}

// ── Bridge v2.0 — respuestas ACK ─────────────────────────────────────────

export interface PongResponse {
  type:      'pong';
  ts:        number;
  version:   string;
  xp:        11 | 12;
  aeronave:  AeronaveId;
  n_fallas:  number;
}

export interface FallaAck {
  type:    'falla_ack';
  dataref: string;
  valor:   number;
  ok:      boolean;
}

export interface LimpiarAck {
  type:  'limpiar_ack';
  count: number;
}

export interface MeteoAck {
  type: 'meteo_ack';
  ok:   boolean;
}

export interface PosicionAck {
  type:    'posicion_ack';
  icao:    string;
  nombre:  string;
  ok:      boolean;
}

export interface HoraAck {
  type:         'hora_ack';
  segundos_utc: number;
  ok:           boolean;
}

export interface PausaAck {
  type:    'pausa_ack';
  pausado: boolean;
}

export interface ConfigAck {
  type:     'config_ack';
  aeronave: AeronaveId;
  xp:       11 | 12;
  version:  string;
  ok:       boolean;
}

export interface FallasEstado {
  type:   'fallas_estado';
  fallas: Array<{ dataref: string; sufijo: string; valor: number }>;
  total:  number;
}

export interface BridgeInfo {
  type:        'info';
  version:     string;
  xp:          11 | 12;
  aeronave:    AeronaveId;
  tablet_ip:   string;
  n_fallas:    number;
  uptime_s:    number;
  log_path:    string;
  conectado:   boolean;
  telem_ext:   boolean;
}

export type BridgeResponse =
  | PongResponse
  | FallaAck
  | LimpiarAck
  | MeteoAck
  | PosicionAck
  | HoraAck
  | PausaAck
  | ConfigAck
  | FallasEstado
  | BridgeInfo;

// ── Fallas X-Plane ────────────────────────────────────────────────────────
export interface FallaXPlane {
  id:       string;
  nombre:   string;
  dataref:  string;
  sistema:  string;
  aeronave: AeronaveId | 'AMBAS';
  activa:   boolean;
}

export interface SistemaFallas {
  sistema:  string;
  icono:    string;
  color:    string;
  nota:     string;
  aeronave: AeronaveId | 'AMBAS';
  fallas:   FallaXPlane[];
}

/** Registro de una falla inyectada en la sesión */
export interface FallaRegistrada {
  fallaId:     string;
  nombre:      string;
  dataref:     string;
  sistema:     string;
  aeronave:    AeronaveId;
  inyectadaEn: number; // timestamp ms
  limpiadaEn:  number | null;
}

// ── Meteorología ──────────────────────────────────────────────────────────
export interface ConfigMeteo {
  viento_dir:     number;
  viento_kts:     number;
  visibilidad_sm: number;
  turbulencia:    0 | 1 | 2 | 3;
  tipo_nubes:     'CAVOK' | 'SCT' | 'BKN' | 'OVC' | 'CB' | 'FG';
  techo_ft:       number;
  temperatura_c:  number;
  qnh_inhg:       number;
}

// ── Configuración de sesión ───────────────────────────────────────────────
export interface ConfigSesion {
  aeronave:   AeronaveId;
  icao:       string;
  hora_local: string;   // 'HH:MM'
  fecha:      string;   // 'YYYY-MM-DD'
  meteo:      ConfigMeteo;
  xplane_ip:  string;
}

// ── Maniobras ─────────────────────────────────────────────────────────────
// Maniobra interface with full details is defined in src/data/fallas.ts
export type ResultadoManiobra = 'AS' | 'S' | 'SB' | 'NA';

export interface ManiobrasEval {
  maniobra_id:   string;
  resultado:     ResultadoManiobra | null;
  observaciones: string;
}

// ── Sesión ────────────────────────────────────────────────────────────────
export type EstadoSesion = 'IDLE' | 'EN_CURSO' | 'PAUSADA' | 'COMPLETADA' | 'ABORTADA';

export interface Sesion {
  id:                  string;
  piloto_nombre:       string;
  piloto_licencia:     string;
  instructor_nombre:   string;
  aeronave:            AeronaveId;
  simulador:           string;
  config:              ConfigSesion;
  estado:              EstadoSesion;
  hora_inicio:         number;
  hora_fin:            number | null;
  duracion_efectiva_s: number;
  evaluaciones:        ManiobrasEval[];
  fallas_usadas:       FallaRegistrada[];
  firma_base64:        string | null;
  evaluacion_global:   ResultadoManiobra | null;
  observaciones:       string;
}

// ── Estado de conexión ────────────────────────────────────────────────────
export type EstadoConexion = 'DESCONECTADO' | 'CONECTANDO' | 'CONECTADO' | 'ERROR';

export interface EstadoBridge {
  conexion:     EstadoConexion;
  xp_version:   11 | 12 | null;
  bridge_version: string | null;
  aeronave_xp:  AeronaveId | null;
  n_fallas_xp:  number;
  uptime_s:     number;
  log_path:     string | null;
  telem_ext:    boolean;
  ultimo_pong:  number;
  latencia_ms:  number | null;
}
