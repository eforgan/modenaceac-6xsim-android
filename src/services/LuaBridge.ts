// src/services/LuaBridge.ts
// Comunicación UDP bidireccional con FlyWithLua en X-Plane 11/12
// Puerto 49002 → comandos hacia X-Plane
// Puerto 49001 → telemetría desde X-Plane

import dgram from 'react-native-udp';
import type { TelemetriaSnapshot } from '../types';

const CMD_PORT  = 49002;  // tablet → X-Plane
const TELEM_PORT = 49001; // X-Plane → tablet

type TelemetriaCallback = (snap: TelemetriaSnapshot) => void;
type ConexionCallback   = (ok: boolean, error?: string) => void;

class LuaBridgeService {
  private cmdSocket:   any = null;
  private telemSocket: any = null;
  private xplaneIP:    string = '192.168.1.100';
  private onTelem:     TelemetriaCallback | null = null;
  private onConexion:  ConexionCallback   | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private lastPong:    number = 0;
  private connected:   boolean = false;

  // ── Inicializar ──────────────────────────────────────────────────────────
  init(ip: string, onTelem: TelemetriaCallback, onConexion: ConexionCallback) {
    this.xplaneIP   = ip;
    this.onTelem    = onTelem;
    this.onConexion = onConexion;
    this.initCmdSocket();
    this.initTelemSocket();
    this.startPing();
  }

  private initCmdSocket() {
    if (this.cmdSocket) this.cmdSocket.close();
    this.cmdSocket = dgram.createSocket({ type: 'udp4', debug: false });
    this.cmdSocket.bind(0);
    this.cmdSocket.on('error', (err: Error) => {
      console.warn('[LuaBridge] cmdSocket error:', err.message);
    });
  }

  private initTelemSocket() {
    if (this.telemSocket) this.telemSocket.close();
    this.telemSocket = dgram.createSocket({ type: 'udp4', debug: false });
    this.telemSocket.bind(TELEM_PORT);

    this.telemSocket.on('message', (msg: Buffer) => {
      try {
        const data = JSON.parse(msg.toString());

        // PONG de ping
        if (data.type === 'pong') {
          this.lastPong = Date.now();
          if (!this.connected) {
            this.connected = true;
            this.onConexion?.(true);
          }
          return;
        }

        // Telemetría de vuelo
        if (data.type === 'telem') {
          const snap: TelemetriaSnapshot = {
            altitud_ft:  Math.round(data.alt  ?? 0),
            vvi_fpm:     Math.round(data.vvi  ?? 0),
            ias_kts:     Math.round(data.ias  ?? 0),
            pitch_deg:   parseFloat((data.pit ?? 0).toFixed(1)),
            roll_deg:    parseFloat((data.rol ?? 0).toFixed(1)),
            hdg_mag:     Math.round(data.hdg  ?? 0),
            rpm_motor:   Math.round(data.rpm  ?? 0),
            rpm_rotor:   Math.round(data.rot  ?? 0),
            torque:      parseFloat((data.trq ?? 0).toFixed(1)),
            timestamp:   Date.now(),
          };
          this.onTelem?.(snap);
        }
      } catch {
        // Mensaje inválido — ignorar
      }
    });

    this.telemSocket.on('error', (err: Error) => {
      console.warn('[LuaBridge] telemSocket error:', err.message);
      this.connected = false;
      this.onConexion?.(false, err.message);
    });
  }

  // ── Ping periódico ───────────────────────────────────────────────────────
  private startPing() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      this.enviarComando({ type: 'ping' });
      // Si no recibimos pong en 3s, marcar desconectado
      setTimeout(() => {
        if (Date.now() - this.lastPong > 3500) {
          if (this.connected) {
            this.connected = false;
            this.onConexion?.(false, 'Tiempo de espera agotado');
          }
        }
      }, 3000);
    }, 5000);
  }

  // ── Enviar comando genérico ──────────────────────────────────────────────
  private enviarComando(payload: Record<string, unknown>) {
    if (!this.cmdSocket) return;
    const msg = Buffer.from(JSON.stringify(payload));
    this.cmdSocket.send(msg, 0, msg.length, CMD_PORT, this.xplaneIP, (err: Error | null) => {
      if (err) console.warn('[LuaBridge] send error:', err.message);
    });
  }

  // ── API pública ──────────────────────────────────────────────────────────

  /** Inyectar una falla en X-Plane */
  setFalla(dataref: string, valor: number = 6) {
    this.enviarComando({ type: 'set_falla', dataref, valor });
  }

  /** Limpiar una falla específica */
  limpiarFalla(dataref: string) {
    this.enviarComando({ type: 'set_falla', dataref, valor: 0 });
  }

  /** Limpiar TODAS las fallas activas */
  limpiarTodasFallas() {
    this.enviarComando({ type: 'limpiar_fallas' });
  }

  /** Configurar meteorología */
  setMeteo(params: {
    viento_dir: number;
    viento_kts: number;
    visibilidad_sm: number;
    turbulencia: number;
    temperatura_c: number;
  }) {
    this.enviarComando({ type: 'set_meteo', ...params });
  }

  /** Configurar posición inicial */
  setPosicion(icao: string) {
    this.enviarComando({ type: 'set_posicion', icao });
  }

  /** Configurar hora local del simulador */
  setHora(hora_local: string) {
    const [h, m] = hora_local.split(':').map(Number);
    const segundos = (h * 3600) + (m * 60);
    this.enviarComando({ type: 'set_hora', segundos_utc: segundos });
  }

  /** Pausar/reanudar X-Plane */
  setPausa(pausado: boolean) {
    this.enviarComando({ type: 'set_pausa', pausado });
  }

  /** Estado de conexión actual */
  isConnected(): boolean {
    return this.connected;
  }

  /** Destruir todos los sockets */
  destroy() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.cmdSocket)   this.cmdSocket.close();
    if (this.telemSocket) this.telemSocket.close();
    this.connected = false;
  }
}

export const luaBridge = new LuaBridgeService();
