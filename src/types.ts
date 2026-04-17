// src/types.ts — Tipos globales de la app Android 6XSIM

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
export interface TelemetriaSnapshot {
  altitud_ft:    number;
  vvi_fpm:       number;
  ias_kts:       number;
  pitch_deg:     number;
  roll_deg:      number;
  hdg_mag:       number;
  rpm_motor:     number;
  rpm_rotor:     number;
  torque:        number;
  timestamp:     number;
}

// ── Fallas X-Plane ────────────────────────────────────────────────────────
export interface FallaXPlane {
  id:          string;
  nombre:      string;
  dataref:     string;
  sistema:     string;
  aeronave:    AeronaveId | 'AMBAS';
  activa:      boolean;
}

export interface SistemaFallas {
  sistema:     string;
  icono:       string;
  color:       string;
  nota:        string;
  aeronave:    AeronaveId | 'AMBAS';
  fallas:      FallaXPlane[];
}

// ── Meteorología ──────────────────────────────────────────────────────────
export interface ConfigMeteo {
  viento_dir:    number;   // grados
  viento_kts:    number;
  visibilidad_sm:number;
  turbulencia:   0 | 1 | 2 | 3;
  tipo_nubes:    'CAVOK' | 'SCT' | 'BKN' | 'OVC' | 'CB' | 'FG';
  techo_ft:      number;
  temperatura_c: number;
}

// ── Configuración de sesión ───────────────────────────────────────────────
export interface ConfigSesion {
  aeronave:      AeronaveId;
  icao:          string;
  hora_local:    string;  // 'HH:MM'
  fecha:         string;  // 'YYYY-MM-DD'
  meteo:         ConfigMeteo;
  xplane_ip:     string;
}

// ── Maniobras ─────────────────────────────────────────────────────────────
export type ResultadoManiobra = 'AS' | 'S' | 'SB' | 'NA';

export interface Maniobra {
  id:          string;
  nombre:      string;
  categoria:   string;
  descripcion: string;
}

export interface ManiobrasEval {
  maniobra_id:  string;
  resultado:    ResultadoManiobra | null;
  observaciones:string;
}

// ── Sesión ────────────────────────────────────────────────────────────────
export type EstadoSesion = 'IDLE' | 'EN_CURSO' | 'PAUSADA' | 'COMPLETADA' | 'ABORTADA';

export interface Sesion {
  id:               string;
  piloto_nombre:    string;
  piloto_licencia:  string;
  instructor_nombre:string;
  aeronave:         AeronaveId;
  simulador:        string;
  config:           ConfigSesion;
  estado:           EstadoSesion;
  hora_inicio:      number;  // timestamp ms
  hora_fin:         number | null;
  duracion_efectiva_s: number;
  evaluaciones:     ManiobrasEval[];
  fallas_usadas:    string[];  // IDs de fallas inyectadas
  firma_base64:     string | null;
  evaluacion_global:ResultadoManiobra | null;
  observaciones:    string;
}

// ── Estado de conexión ────────────────────────────────────────────────────
export type EstadoConexion = 'DESCONECTADO' | 'CONECTANDO' | 'CONECTADO' | 'ERROR';
