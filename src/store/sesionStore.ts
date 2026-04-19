// src/store/sesionStore.ts — v2.0
// Estado global de la sesión activa usando Zustand
// Integrado con LuaBridge v2.0: telemetría extendida, ACKs, historial de fallas

import { create } from 'zustand';
import type {
  Sesion,
  EstadoSesion,
  ManiobrasEval,
  ResultadoManiobra,
  TelemetriaSnapshot,
  TelemetriaExtendida,
  AeronaveId,
  FallaRegistrada,
  FallasEstado,
  BridgeInfo,
  EstadoBridge,
  ConfigMeteo,
} from '../types';
import { luaBridge } from '../services/LuaBridge';

// ── Tipos del store ────────────────────────────────────────────────────────
interface SesionState {
  // ── Sesión activa ──────────────────────────────────────────────────────
  sesion:            Sesion | null;
  estado:            EstadoSesion;
  timerSegundos:     number;

  // ── Telemetría ─────────────────────────────────────────────────────────
  telemetria:        TelemetriaSnapshot | null;
  telemExtendida:    TelemetriaExtendida | null;  // Cuando TELEM_EXTENDED=true
  tieneTelExtendida: boolean;

  // ── Estado del bridge ──────────────────────────────────────────────────
  estadoBridge:      EstadoBridge | null;
  bridgeInfo:        BridgeInfo   | null;

  // ── Fallas ────────────────────────────────────────────────────────────
  fallasActivasIds:   Set<string>;
  fallasActivasCount: number;
  historialFallas:    FallaRegistrada[];  // Todas las fallas de la sesión

  // ── Última respuesta ACK (para UI feedback) ────────────────────────────
  ultimoAck: {
    tipo:      string;
    ok:        boolean;
    mensaje:   string;
    timestamp: number;
  } | null;

  // ── Acciones — Sesión ──────────────────────────────────────────────────
  iniciarSesion: (datos: {
    piloto_nombre:     string;
    piloto_licencia:   string;
    instructor_nombre: string;
    aeronave:          AeronaveId;
    config:            Sesion['config'];
  }) => void;
  pausarSesion:    () => void;
  reanudarSesion:  () => void;
  finalizarSesion: (
    firma:       string | null,
    eval_global: ResultadoManiobra,
    obs:         string,
  ) => Sesion;
  tickTimer:       () => void;
  resetSesion:     () => void;

  // ── Acciones — Telemetría y bridge ────────────────────────────────────
  setTelemetria:   (snap: TelemetriaSnapshot | TelemetriaExtendida) => void;
  setEstadoBridge: (estado: EstadoBridge) => void;
  setBridgeInfo:   (info: BridgeInfo) => void;

  // ── Acciones — Fallas con Bridge v2.0 ────────────────────────────────
  /** Inyectar falla y esperar ACK del bridge */
  activarFalla:      (fallaId: string, dataref: string, nombre: string, sistema: string) => Promise<boolean>;
  /** Limpiar falla específica y esperar ACK */
  desactivarFalla:   (fallaId: string, dataref: string, nombre?: string, sistema?: string) => Promise<boolean>;
  /** Limpiar todas las fallas (fire-and-forget) */
  limpiarFallas:     () => void;
  /** Sincronizar fallas con X-Plane (get_fallas) */
  sincronizarFallas: () => Promise<void>;

  // ── Acciones — Configuración en caliente ──────────────────────────────
  /** Cambiar aeronave en caliente sin reiniciar */
  cambiarAeronave:     (aeronave: AeronaveId) => Promise<void>;
  /** Activar/desactivar telemetría extendida */
  setTelemExtendida:   (activa: boolean) => Promise<void>;
  /** Aplicar config completa de sesión (meteo + posición + hora + aeronave) */
  aplicarConfigSesion: (params: {
    aeronave:   AeronaveId;
    icao:       string;
    hora_local: string;
    meteo:      Partial<ConfigMeteo>;
  }) => Promise<{ ok: boolean; errores: string[] }>;

  // ── Acciones — Maniobras ──────────────────────────────────────────────
  evalManiobra: (maniobra_id: string, resultado: ResultadoManiobra, obs: string) => void;

  // ── ACK feedback ──────────────────────────────────────────────────────
  setUltimoAck: (ack: SesionState['ultimoAck']) => void;
}

// ── Estado inicial ─────────────────────────────────────────────────────────
const ESTADO_INICIAL: Pick<SesionState,
  'sesion' | 'estado' | 'timerSegundos' | 'telemetria' | 'telemExtendida' |
  'tieneTelExtendida' | 'estadoBridge' | 'bridgeInfo' | 'fallasActivasIds' |
  'fallasActivasCount' | 'historialFallas' | 'ultimoAck'
> = {
  sesion:             null,
  estado:             'IDLE',
  timerSegundos:      0,
  telemetria:         null,
  telemExtendida:     null,
  tieneTelExtendida:  false,
  estadoBridge:       null,
  bridgeInfo:         null,
  fallasActivasIds:   new Set(),
  fallasActivasCount: 0,
  historialFallas:    [],
  ultimoAck:          null,
};

// ═══════════════════════════════════════════════════════════════════════════
export const useSesionStore = create<SesionState>()((set, get) => ({

  ...ESTADO_INICIAL,

  // ══════════════════════════════════════════════════════════════════════════
  // TELEMETRÍA Y BRIDGE
  // ══════════════════════════════════════════════════════════════════════════

  setTelemetria: (snap) => {
    const esExtendida = 'n1_2_pct' in snap || 'oil_temp_c' in snap;
    set(s => ({
      telemetria:        snap,
      telemExtendida:    esExtendida ? snap as TelemetriaExtendida : s.telemExtendida,
      tieneTelExtendida: esExtendida || s.tieneTelExtendida,
      // Actualizar conteo de fallas desde telemetría
      fallasActivasCount: snap.n_fallas ?? s.fallasActivasCount,
    }));
  },

  setEstadoBridge: (estado) => {
    set({ estadoBridge: estado });
    // Si acaba de conectarse, sincronizar fallas
    if (estado.conexion === 'CONECTADO') {
      setTimeout(() => get().sincronizarFallas(), 800);
    }
  },

  setBridgeInfo: (info) => {
    set({
      bridgeInfo:        info,
      tieneTelExtendida: info.telem_ext,
    });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SESIÓN
  // ══════════════════════════════════════════════════════════════════════════

  iniciarSesion: (datos) => {
    const sesion: Sesion = {
      id:                  Math.random().toString(36).slice(2),
      piloto_nombre:       datos.piloto_nombre,
      piloto_licencia:     datos.piloto_licencia,
      instructor_nombre:   datos.instructor_nombre,
      aeronave:            datos.aeronave,
      simulador:           datos.aeronave === 'AW109'
                             ? 'AgustaWestland AW109E'
                             : 'Robinson R44 II',
      config:              datos.config,
      estado:              'EN_CURSO',
      hora_inicio:         Date.now(),
      hora_fin:            null,
      duracion_efectiva_s: 0,
      evaluaciones:        [],
      fallas_usadas:       [],
      firma_base64:        null,
      evaluacion_global:   null,
      observaciones:       '',
    };

    // Limpiar historial de fallas de sesión anterior
    luaBridge.limpiarHistorialLocal();

    set({
      sesion,
      estado:             'EN_CURSO',
      timerSegundos:      0,
      fallasActivasIds:   new Set(),
      fallasActivasCount: 0,
      historialFallas:    [],
      ultimoAck:          null,
    });
  },

  pausarSesion: () => {
    luaBridge.setPausa(true);
    set({ estado: 'PAUSADA' });
  },

  reanudarSesion: () => {
    luaBridge.setPausa(false);
    set({ estado: 'EN_CURSO' });
  },

  finalizarSesion: (firma, eval_global, observaciones) => {
    const s = get();
    const sesion = s.sesion!;

    // Limpiar todas las fallas al finalizar
    luaBridge.limpiarTodasFallas();
    luaBridge.setPausa(false);

    const sesionFinal: Sesion = {
      ...sesion,
      estado:              'COMPLETADA',
      hora_fin:            Date.now(),
      duracion_efectiva_s: s.timerSegundos,
      evaluaciones:        sesion.evaluaciones,
      fallas_usadas:       s.historialFallas,
      firma_base64:        firma,
      evaluacion_global:   eval_global,
      observaciones,
    };

    set({
      sesion:             sesionFinal,
      estado:             'COMPLETADA',
      fallasActivasIds:   new Set(),
      fallasActivasCount: 0,
    });

    return sesionFinal;
  },

  tickTimer: () => {
    set(s => {
      if (s.estado !== 'EN_CURSO') return {};
      const nuevo = s.timerSegundos + 1;
      // Actualizar duración en la sesión
      return {
        timerSegundos: nuevo,
        sesion: s.sesion
          ? { ...s.sesion, duracion_efectiva_s: nuevo }
          : null,
      };
    });
  },

  resetSesion: () => {
    luaBridge.limpiarTodasFallas();
    luaBridge.limpiarHistorialLocal();
    set({ ...ESTADO_INICIAL });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FALLAS — integración Bridge v2.0
  // ══════════════════════════════════════════════════════════════════════════

  activarFalla: async (fallaId, dataref, nombre, sistema) => {
    const s = get();
    if (s.fallasActivasIds.has(fallaId)) return true; // Ya activa

    let ok = false;
    try {
      ok = await luaBridge.setFalla(dataref, 6, { fallaId, nombre, sistema });
    } catch (e) {
      console.warn('[Store] activarFalla error:', e);
      ok = false;
    }

    if (ok) {
      const nuevasIds = new Set(s.fallasActivasIds);
      nuevasIds.add(fallaId);

      const nuevaFalla: FallaRegistrada = {
        fallaId,
        nombre,
        dataref,
        sistema,
        aeronave: (s.estadoBridge?.aeronave_xp ?? 'AW109') as AeronaveId,
        inyectadaEn: Date.now(),
        limpiadaEn:  null,
      };

      set(prev => ({
        fallasActivasIds:   nuevasIds,
        fallasActivasCount: nuevasIds.size,
        historialFallas:    [...prev.historialFallas, nuevaFalla],
        sesion: prev.sesion
          ? { ...prev.sesion, fallas_usadas: [...prev.historialFallas, nuevaFalla] }
          : null,
        ultimoAck: {
          tipo: 'falla_activa', ok: true,
          mensaje: `✓ Falla inyectada: ${nombre}`, timestamp: Date.now(),
        },
      }));
    } else {
      set({
        ultimoAck: {
          tipo: 'falla_activa', ok: false,
          mensaje: `✕ Error al inyectar: ${nombre}`, timestamp: Date.now(),
        },
      });
    }

    return ok;
  },

  desactivarFalla: async (fallaId, dataref, nombre, sistema) => {
    let ok = false;
    try {
      ok = await luaBridge.limpiarFalla(dataref, { fallaId, nombre, sistema });
    } catch (e) {
      console.warn('[Store] desactivarFalla error:', e);
      ok = false;
    }

    set(prev => {
      const nuevasIds = new Set(prev.fallasActivasIds);
      nuevasIds.delete(fallaId);

      // Marcar como limpiada en el historial
      const historial = prev.historialFallas.map(f =>
        f.fallaId === fallaId && f.limpiadaEn === null
          ? { ...f, limpiadaEn: Date.now() }
          : f,
      );

      return {
        fallasActivasIds:   nuevasIds,
        fallasActivasCount: nuevasIds.size,
        historialFallas:    historial,
        ultimoAck: {
          tipo: 'falla_limpiada', ok,
          mensaje: ok ? `✓ Falla limpiada: ${nombre ?? fallaId}` : `✕ Error al limpiar`,
          timestamp: Date.now(),
        },
      };
    });

    return ok;
  },

  limpiarFallas: () => {
    luaBridge.limpiarTodasFallas();
    set(prev => ({
      fallasActivasIds:   new Set(),
      fallasActivasCount: 0,
      // Marcar todas como limpiadas
      historialFallas: prev.historialFallas.map(f =>
        f.limpiadaEn === null ? { ...f, limpiadaEn: Date.now() } : f,
      ),
      ultimoAck: {
        tipo: 'limpiar_todas', ok: true,
        mensaje: '✓ Todas las fallas limpiadas', timestamp: Date.now(),
      },
    }));
  },

  sincronizarFallas: async () => {
    const fe: FallasEstado | null = await luaBridge.sincronizarFallas();
    if (!fe) return;
    // Reconstruir el set de IDs activos desde la respuesta de X-Plane
    // (usamos el sufijo del dataref como identificador si no tenemos el ID completo)
    set({
      fallasActivasCount: fe.total,
      ultimoAck: {
        tipo: 'sync_fallas', ok: true,
        mensaje: `Sync: ${fe.total} fallas activas en XP`,
        timestamp: Date.now(),
      },
    });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN EN CALIENTE — Bridge v2.0
  // ══════════════════════════════════════════════════════════════════════════

  cambiarAeronave: async (aeronave) => {
    try {
      await luaBridge.cambiarAeronave(aeronave);
      set({
        ultimoAck: {
          tipo: 'cambiar_aeronave', ok: true,
          mensaje: `✓ Aeronave → ${aeronave}`, timestamp: Date.now(),
        },
      });
    } catch (e) {
      set({
        ultimoAck: {
          tipo: 'cambiar_aeronave', ok: false,
          mensaje: `✕ Error: ${String(e)}`, timestamp: Date.now(),
        },
      });
    }
  },

  setTelemExtendida: async (activa) => {
    try {
      await luaBridge.setTelemExtendida(activa);
      set(prev => ({
        tieneTelExtendida: activa,
        ultimoAck: {
          tipo: 'telem_ext', ok: true,
          mensaje: `✓ Telemetría extendida: ${activa ? 'ON' : 'OFF'}`,
          timestamp: Date.now(),
        },
      }));
    } catch (e) {
      set({
        ultimoAck: {
          tipo: 'telem_ext', ok: false,
          mensaje: `✕ Error: ${String(e)}`, timestamp: Date.now(),
        },
      });
    }
  },

  aplicarConfigSesion: async (params) => {
    const result = await luaBridge.aplicarConfigSesion(params);
    set({
      ultimoAck: {
        tipo:    'config_sesion',
        ok:      result.ok,
        mensaje: result.ok
          ? '✓ Configuración aplicada en X-Plane'
          : `⚠ Parcial (${result.errores.join(', ')})`,
        timestamp: Date.now(),
      },
    });
    return result;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MANIOBRAS
  // ══════════════════════════════════════════════════════════════════════════

  evalManiobra: (maniobra_id, resultado, observaciones) => {
    set(s => {
      if (!s.sesion) return {};
      const ya = s.sesion.evaluaciones.findIndex(e => e.maniobra_id === maniobra_id);
      const evals = [...s.sesion.evaluaciones];
      if (ya >= 0) {
        evals[ya] = { maniobra_id, resultado, observaciones };
      } else {
        evals.push({ maniobra_id, resultado, observaciones });
      }
      return { sesion: { ...s.sesion, evaluaciones: evals } };
    });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ACK FEEDBACK
  // ══════════════════════════════════════════════════════════════════════════

  setUltimoAck: (ack) => set({ ultimoAck: ack }),

}));

// ── Helpers de acceso rápido ───────────────────────────────────────────────
export const getSesion        = () => useSesionStore.getState().sesion;
export const getEstado        = () => useSesionStore.getState().estado;
export const getTelemetria    = () => useSesionStore.getState().telemetria;
export const getTelemExtendida= () => useSesionStore.getState().telemExtendida;
export const getEstadoBridge  = () => useSesionStore.getState().estadoBridge;
export const getBridgeInfo    = () => useSesionStore.getState().bridgeInfo;
export const getFallasCount   = () => useSesionStore.getState().fallasActivasCount;
export const getHistorialFallas=() => useSesionStore.getState().historialFallas;
