// src/store/sesionStore.ts
// Estado global de la sesión activa usando Zustand

import { create } from 'zustand';
import type {
  Sesion,
  EstadoSesion,
  ManiobrasEval,
  ResultadoManiobra,
  TelemetriaSnapshot,
  AeronaveId,
} from '../types';
import { luaBridge } from '../services/LuaBridge';

interface SesionState {
  // ── Sesión activa ─────────────────────────────────────────────────
  sesion:            Sesion | null;
  estado:            EstadoSesion;
  timerSegundos:     number;

  // ── Telemetría en tiempo real ──────────────────────────────────────
  telemetria:        TelemetriaSnapshot | null;
  conectado:         boolean;
  errorConexion:     string | null;

  // ── Fallas activas ─────────────────────────────────────────────────
  fallasActivasIds:  Set<string>;
  fallasActivasCount:number;

  // ── Acciones ───────────────────────────────────────────────────────
  iniciarSesion: (datos: {
    piloto_nombre:     string;
    piloto_licencia:   string;
    instructor_nombre: string;
    aeronave:          AeronaveId;
    config:            Sesion['config'];
  }) => void;

  pausarSesion:    () => void;
  reanudarSesion:  () => void;
  finalizarSesion: (firma: string | null, eval_global: ResultadoManiobra, obs: string) => Sesion;
  tickTimer:       () => void;

  setTelemetria:   (snap: TelemetriaSnapshot) => void;
  setConectado:    (ok: boolean, err?: string) => void;

  evalManiobra:    (maniobra_id: string, resultado: ResultadoManiobra, obs: string) => void;

  activarFalla:    (fallaId: string, dataref: string) => void;
  desactivarFalla: (fallaId: string, dataref: string) => void;
  limpiarFallas:   () => void;

  resetSesion:     () => void;
}

const estadoInicial = {
  sesion:             null,
  estado:             'IDLE' as EstadoSesion,
  timerSegundos:      0,
  telemetria:         null,
  conectado:          false,
  errorConexion:      null,
  fallasActivasIds:   new Set<string>(),
  fallasActivasCount: 0,
};

export const useSesionStore = create<SesionState>((set, get) => ({
  ...estadoInicial,

  iniciarSesion: (datos) => {
    const id = `ses_${Date.now()}`;
    const sesion: Sesion = {
      id,
      piloto_nombre:     datos.piloto_nombre,
      piloto_licencia:   datos.piloto_licencia,
      instructor_nombre: datos.instructor_nombre,
      aeronave:          datos.aeronave,
      simulador:         `${datos.aeronave} · X-Plane 11`,
      config:            datos.config,
      estado:            'EN_CURSO',
      hora_inicio:       Date.now(),
      hora_fin:          null,
      duracion_efectiva_s: 0,
      evaluaciones:      [],
      fallas_usadas:     [],
      firma_base64:      null,
      evaluacion_global: null,
      observaciones:     '',
    };
    set({ sesion, estado: 'EN_CURSO', timerSegundos: 0 });

    // Aplicar configuración a X-Plane
    const { config } = datos;
    luaBridge.setHora(config.hora_local);
    luaBridge.setPosicion(config.icao);
    luaBridge.setMeteo({
      viento_dir:     config.meteo.viento_dir,
      viento_kts:     config.meteo.viento_kts,
      visibilidad_sm: config.meteo.visibilidad_sm,
      turbulencia:    config.meteo.turbulencia,
      temperatura_c:  config.meteo.temperatura_c,
    });
  },

  pausarSesion: () => {
    set({ estado: 'PAUSADA' });
    luaBridge.setPausa(true);
  },

  reanudarSesion: () => {
    set({ estado: 'EN_CURSO' });
    luaBridge.setPausa(false);
  },

  finalizarSesion: (firma, eval_global, obs) => {
    const { sesion, timerSegundos, fallasActivasIds } = get();
    if (!sesion) throw new Error('No hay sesión activa');

    const sesionFinal: Sesion = {
      ...sesion,
      estado:              'COMPLETADA',
      hora_fin:            Date.now(),
      duracion_efectiva_s: timerSegundos,
      firma_base64:        firma,
      evaluacion_global:   eval_global,
      observaciones:       obs,
      fallas_usadas:       Array.from(fallasActivasIds),
    };

    luaBridge.limpiarTodasFallas();
    luaBridge.setPausa(false);

    set({
      sesion:             sesionFinal,
      estado:             'COMPLETADA',
      fallasActivasIds:   new Set(),
      fallasActivasCount: 0,
    });

    return sesionFinal;
  },

  tickTimer: () => {
    const { estado, sesion } = get();
    if (estado !== 'EN_CURSO' || !sesion) return;
    set((s) => ({ timerSegundos: s.timerSegundos + 1 }));
  },

  setTelemetria: (snap) => set({ telemetria: snap }),

  setConectado: (ok, err) => set({
    conectado:     ok,
    errorConexion: ok ? null : (err ?? 'Sin conexión'),
  }),

  evalManiobra: (maniobra_id, resultado, obs) => {
    const { sesion } = get();
    if (!sesion) return;
    const prevEvals = sesion.evaluaciones.filter((e) => e.maniobra_id !== maniobra_id);
    const nueva: ManiobrasEval = { maniobra_id, resultado, observaciones: obs };
    set({ sesion: { ...sesion, evaluaciones: [...prevEvals, nueva] } });
  },

  activarFalla: (fallaId, dataref) => {
    luaBridge.setFalla(dataref, 6);
    set((s) => {
      const ids = new Set(s.fallasActivasIds);
      ids.add(fallaId);
      return { fallasActivasIds: ids, fallasActivasCount: ids.size };
    });
  },

  desactivarFalla: (fallaId, dataref) => {
    luaBridge.limpiarFalla(dataref);
    set((s) => {
      const ids = new Set(s.fallasActivasIds);
      ids.delete(fallaId);
      return { fallasActivasIds: ids, fallasActivasCount: ids.size };
    });
  },

  limpiarFallas: () => {
    luaBridge.limpiarTodasFallas();
    set({ fallasActivasIds: new Set(), fallasActivasCount: 0 });
  },

  resetSesion: () => set({ ...estadoInicial }),
}));
