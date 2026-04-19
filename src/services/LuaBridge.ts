// src/services/LuaBridge.ts — v2.0
// Comunicación UDP bidireccional con FlyWithLua Bridge v2.0
// Compatible con X-Plane 11.55r2 y X-Plane 12.x
//
// Puerto 49002  →  comandos hacia X-Plane
// Puerto 49001  ←  telemetría + ACKs desde X-Plane

import dgram from 'react-native-udp';
import type {
  TelemetriaSnapshot,
  TelemetriaExtendida,
  BridgeInfo,
  FallasEstado,
  PongResponse,
  ConfigAck,
  AeronaveId,
  EstadoBridge,
  ConfigMeteo,
  FallaRegistrada,
} from '../types';

// ── Constantes ─────────────────────────────────────────────────────────────
const CMD_PORT   = 49002;
const TELEM_PORT = 49001;
const PING_EVERY_MS   = 5_000;   // Ping cada 5s
const PONG_TIMEOUT_MS = 7_000;   // Desconexión si no hay pong en 7s
const RECONNECT_DELAY = 3_000;   // Reintentar conexión cada 3s

// ── Tipos de callbacks ─────────────────────────────────────────────────────
type TelemCallback     = (snap: TelemetriaSnapshot | TelemetriaExtendida) => void;
type ConexionCallback  = (estado: EstadoBridge) => void;
type PongCallback      = (resp: PongResponse) => void;
type InfoCallback      = (info: BridgeInfo) => void;
type FallasCallback    = (estado: FallasEstado) => void;
type AckCallback<T>    = (resp: T) => void;

// ── Callbacks pendientes de ACK ────────────────────────────────────────────
interface PendingAck<T> {
  resolve: (v: T) => void;
  reject:  (e: Error) => void;
  timer:   ReturnType<typeof setTimeout>;
}

// ═══════════════════════════════════════════════════════════════════════════
class LuaBridgeService {

  // ── Sockets ──────────────────────────────────────────────────────────────
  private cmdSocket:   any = null;
  private telemSocket: any = null;
  private xplaneIP:    string = '192.168.1.100';

  // ── Callbacks registrados ─────────────────────────────────────────────────
  private onTelem:    TelemCallback    | null = null;
  private onConexion: ConexionCallback | null = null;
  private onPong:     PongCallback     | null = null;
  private onInfo:     InfoCallback     | null = null;
  private onFallas:   FallasCallback   | null = null;

  // ── Estado del bridge ─────────────────────────────────────────────────────
  private estado: EstadoBridge = {
    conexion:       'DESCONECTADO',
    xp_version:     null,
    bridge_version: null,
    aeronave_xp:    null,
    n_fallas_xp:    0,
    uptime_s:       0,
    log_path:       null,
    telem_ext:      false,
    ultimo_pong:    0,
    latencia_ms:    null,
  };

  // ── Intervalos y timers ───────────────────────────────────────────────────
  private pingInterval:      ReturnType<typeof setInterval> | null = null;
  private watchdogInterval:  ReturnType<typeof setInterval> | null = null;
  private reconnectTimer:    ReturnType<typeof setTimeout>  | null = null;

  // ── Timestamps para latencia ──────────────────────────────────────────────
  private pingEnviado: number = 0;

  // ── Fallas activas locales (mirror del estado de X-Plane) ─────────────────
  private fallasActivas: Map<string, FallaRegistrada> = new Map();

  // ── ACKs pendientes ───────────────────────────────────────────────────────
  private pendingFallaAck:   PendingAck<boolean> | null = null;
  private pendingMeteoAck:   PendingAck<boolean> | null = null;
  private pendingPosicionAck:PendingAck<string>  | null = null;
  private pendingConfigAck:  PendingAck<ConfigAck>| null = null;
  private pendingInfoAck:    PendingAck<BridgeInfo>| null = null;
  private pendingFallasAck:  PendingAck<FallasEstado>| null = null;

  // ══════════════════════════════════════════════════════════════════════════
  // INICIALIZACIÓN
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Iniciar el bridge con la IP de X-Plane y los callbacks.
   * Llamar desde ConfigScreen al aplicar la configuración.
   */
  init(
    ip:         string,
    onTelem:    TelemCallback,
    onConexion: ConexionCallback,
    options?: {
      onPong?:   PongCallback;
      onInfo?:   InfoCallback;
      onFallas?: FallasCallback;
    },
  ) {
    this.xplaneIP   = ip;
    this.onTelem    = onTelem;
    this.onConexion = onConexion;
    this.onPong     = options?.onPong   ?? null;
    this.onInfo     = options?.onInfo   ?? null;
    this.onFallas   = options?.onFallas ?? null;

    this.actualizarEstado({ conexion: 'CONECTANDO' });
    this.initSockets();
    this.startPing();
    this.startWatchdog();
  }

  /** Cambiar IP de X-Plane en caliente (sin reiniciar la app) */
  cambiarIP(ip: string) {
    this.xplaneIP = ip;
    this.destroy();
    this.actualizarEstado({
      conexion: 'CONECTANDO',
      xp_version: null, bridge_version: null, aeronave_xp: null,
      n_fallas_xp: 0, uptime_s: 0, log_path: null,
      telem_ext: false, ultimo_pong: 0, latencia_ms: null,
    });
    this.initSockets();
    this.startPing();
    this.startWatchdog();
  }

  // ── Sockets ───────────────────────────────────────────────────────────────
  private initSockets() {
    // Socket de comandos (envío)
    if (this.cmdSocket) { try { this.cmdSocket.close(); } catch {} }
    this.cmdSocket = dgram.createSocket({ type: 'udp4', debug: false });
    this.cmdSocket.bind(0);
    this.cmdSocket.on('error', (err: Error) => {
      console.warn('[Bridge] cmdSocket error:', err.message);
    });

    // Socket de telemetría (recepción)
    if (this.telemSocket) { try { this.telemSocket.close(); } catch {} }
    this.telemSocket = dgram.createSocket({ type: 'udp4', debug: false });
    this.telemSocket.bind(TELEM_PORT);
    this.telemSocket.on('message', (msg: Buffer) => this.handleMessage(msg));
    this.telemSocket.on('error', (err: Error) => {
      console.warn('[Bridge] telemSocket error:', err.message);
      this.actualizarEstado({ conexion: 'ERROR' });
      this.onConexion?.(this.estado);
      this.scheduleReconnect();
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RECEPCIÓN DE MENSAJES
  // ══════════════════════════════════════════════════════════════════════════
  private handleMessage(msg: Buffer) {
    let data: any;
    try {
      data = JSON.parse(msg.toString());
    } catch {
      return; // Ignorar mensajes inválidos
    }

    const tipo: string = data.type ?? '';

    switch (tipo) {

      // ── PONG ─────────────────────────────────────────────────────────────
      case 'pong': {
        const latencia = this.pingEnviado > 0
          ? Date.now() - this.pingEnviado
          : null;

        const wasConnected = this.estado.conexion === 'CONECTADO';
        this.actualizarEstado({
          conexion:       'CONECTADO',
          xp_version:     data.xp   ?? this.estado.xp_version,
          bridge_version: data.version ?? this.estado.bridge_version,
          aeronave_xp:    data.aeronave ?? this.estado.aeronave_xp,
          n_fallas_xp:    data.n_fallas ?? 0,
          ultimo_pong:    Date.now(),
          latencia_ms:    latencia,
        });

        if (!wasConnected) {
          // Primera conexión — solicitar info completa del bridge
          this.onConexion?.(this.estado);
          setTimeout(() => this.getInfo(), 500);
        }

        this.onPong?.(data as PongResponse);
        break;
      }

      // ── TELEMETRÍA ────────────────────────────────────────────────────────
      case 'telem': {
        const snap = this.parseTelemetria(data);
        this.actualizarEstado({
          n_fallas_xp: data.n_fallas ?? this.estado.n_fallas_xp,
          xp_version:  data.xp ?? this.estado.xp_version,
        });
        this.onTelem?.(snap);
        break;
      }

      // ── FALLA ACK ─────────────────────────────────────────────────────────
      case 'falla_ack': {
        if (this.pendingFallaAck) {
          clearTimeout(this.pendingFallaAck.timer);
          this.pendingFallaAck.resolve(data.ok === true);
          this.pendingFallaAck = null;
        }
        break;
      }

      // ── LIMPIAR ACK ───────────────────────────────────────────────────────
      case 'limpiar_ack': {
        this.fallasActivas.clear();
        this.actualizarEstado({ n_fallas_xp: 0 });
        break;
      }

      // ── METEO ACK ─────────────────────────────────────────────────────────
      case 'meteo_ack': {
        if (this.pendingMeteoAck) {
          clearTimeout(this.pendingMeteoAck.timer);
          this.pendingMeteoAck.resolve(data.ok === true);
          this.pendingMeteoAck = null;
        }
        break;
      }

      // ── POSICION ACK ──────────────────────────────────────────────────────
      case 'posicion_ack': {
        if (this.pendingPosicionAck) {
          clearTimeout(this.pendingPosicionAck.timer);
          this.pendingPosicionAck.resolve(data.nombre ?? data.icao ?? 'OK');
          this.pendingPosicionAck = null;
        }
        break;
      }

      // ── HORA ACK / PAUSA ACK (fire-and-forget) ────────────────────────────
      case 'hora_ack':
      case 'pausa_ack':
        break;

      // ── CONFIG ACK ────────────────────────────────────────────────────────
      case 'config_ack': {
        const ack = data as ConfigAck;
        if (this.pendingConfigAck) {
          clearTimeout(this.pendingConfigAck.timer);
          this.pendingConfigAck.resolve(ack);
          this.pendingConfigAck = null;
        }
        this.actualizarEstado({
          aeronave_xp:    ack.aeronave,
          xp_version:     ack.xp,
          bridge_version: ack.version,
        });
        break;
      }

      // ── FALLAS ESTADO ────────────────────────────────────────────────────
      case 'fallas_estado': {
        const fe = data as FallasEstado;
        if (this.pendingFallasAck) {
          clearTimeout(this.pendingFallasAck.timer);
          this.pendingFallasAck.resolve(fe);
          this.pendingFallasAck = null;
        }
        this.actualizarEstado({ n_fallas_xp: fe.total });
        this.onFallas?.(fe);
        break;
      }

      // ── INFO ─────────────────────────────────────────────────────────────
      case 'info': {
        const info = data as BridgeInfo;
        if (this.pendingInfoAck) {
          clearTimeout(this.pendingInfoAck.timer);
          this.pendingInfoAck.resolve(info);
          this.pendingInfoAck = null;
        }
        this.actualizarEstado({
          xp_version:     info.xp,
          bridge_version: info.version,
          aeronave_xp:    info.aeronave,
          n_fallas_xp:    info.n_fallas,
          uptime_s:       info.uptime_s,
          log_path:       info.log_path,
          telem_ext:      info.telem_ext,
        });
        this.onInfo?.(info);
        break;
      }
    }
  }

  // ── Parser de telemetría ───────────────────────────────────────────────────
  private parseTelemetria(
    d: any,
  ): TelemetriaSnapshot | TelemetriaExtendida {

    const base: TelemetriaSnapshot = {
      // Altimetría
      altitud_ft: Math.round(d.alt  ?? 0),
      agl_ft:     Math.round(d.agl  ?? 0),
      // Velocidades
      ias_kts:    parseFloat((d.ias ?? 0).toFixed(1)),
      gs_kts:     parseFloat((d.gs  ?? 0).toFixed(1)),
      vvi_fpm:    Math.round(d.vvi  ?? 0),
      // Actitud
      pitch_deg:  parseFloat((d.pit ?? 0).toFixed(1)),
      roll_deg:   parseFloat((d.rol ?? 0).toFixed(1)),
      hdg_mag:    Math.round(d.hdg  ?? 0),
      // Motor #1 / Rotor
      n1_pct:     parseFloat((d.n1  ?? 0).toFixed(1)),
      n2_pct:     parseFloat((d.n2  ?? 0).toFixed(1)),
      torque:     parseFloat((d.trq ?? 0).toFixed(1)),
      tot_c:      Math.round(d.tot  ?? 0),
      rpm_motor:  Math.round(d.rpm  ?? 0),
      rpm_rotor:  parseFloat((d.rot ?? 0).toFixed(1)),
      // Estado
      paused:     d.paused === true,
      n_fallas:   d.n_fallas ?? 0,
      timestamp:  Date.now(),
      xp_version: d.xp === 12 ? 12 : 11,
    };

    // Si vienen campos extendidos, retornar TelemetriaExtendida
    if (d.n1_2 !== undefined || d.oilT !== undefined) {
      const ext: TelemetriaExtendida = {
        ...base,
        n1_2_pct:      parseFloat((d.n1_2 ?? 0).toFixed(1)),
        n2_2_pct:      parseFloat((d.n2_2 ?? 0).toFixed(1)),
        torque2:       parseFloat((d.trq2 ?? 0).toFixed(1)),
        tot2_c:        Math.round(d.tot2  ?? 0),
        oil_temp_c:    parseFloat((d.oilT ?? 0).toFixed(1)),
        oil_press_psi: parseFloat((d.oilP ?? 0).toFixed(1)),
        fuel_lbs:      parseFloat((d.fuel ?? 0).toFixed(1)),
        volt_dc:       parseFloat((d.volt ?? 0).toFixed(1)),
        amp_gen1:      parseFloat((d.amp1 ?? 0).toFixed(1)),
        amp_gen2:      parseFloat((d.amp2 ?? 0).toFixed(1)),
        hyd1_psi:      Math.round(d.hyd1 ?? 0),
        hyd2_psi:      Math.round(d.hyd2 ?? 0),
        tas_kts:       parseFloat((d.tas  ?? 0).toFixed(1)),
        hdg_true:      Math.round(d.hdgt ?? 0),
        baro_inhg:     parseFloat((d.baro ?? 29.92).toFixed(2)),
        lat:           d.lat ?? 0,
        lon:           d.lon ?? 0,
        wind_dir:      Math.round(d.wdir ?? 0),
        wind_kts:      parseFloat((d.wkts ?? 0).toFixed(1)),
        oat_c:         parseFloat((d.oat  ?? 0).toFixed(1)),
        fallas_activas:d.fallas ?? [],
      };
      return ext;
    }

    return base;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PING / WATCHDOG
  // ══════════════════════════════════════════════════════════════════════════
  private startPing() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      this.pingEnviado = Date.now();
      this.send({ type: 'ping' });
    }, PING_EVERY_MS);
    // Primer ping inmediato
    this.pingEnviado = Date.now();
    this.send({ type: 'ping' });
  }

  private startWatchdog() {
    if (this.watchdogInterval) clearInterval(this.watchdogInterval);
    this.watchdogInterval = setInterval(() => {
      if (this.estado.conexion !== 'CONECTADO') return;
      const elapsed = Date.now() - this.estado.ultimo_pong;
      if (elapsed > PONG_TIMEOUT_MS) {
        console.warn('[Bridge] Watchdog: sin pong desde', elapsed, 'ms');
        this.actualizarEstado({ conexion: 'DESCONECTADO' });
        this.onConexion?.(this.estado);
      }
    }, 2_000);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.estado.conexion !== 'CONECTADO') {
        console.log('[Bridge] Reintentando conexión...');
        this.initSockets();
      }
    }, RECONNECT_DELAY);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ENVÍO DE COMANDOS
  // ══════════════════════════════════════════════════════════════════════════
  private send(payload: Record<string, unknown>) {
    if (!this.cmdSocket) return;
    try {
      const msg = Buffer.from(JSON.stringify(payload));
      this.cmdSocket.send(
        msg, 0, msg.length,
        CMD_PORT, this.xplaneIP,
        (err: Error | null) => {
          if (err) console.warn('[Bridge] send error:', err.message);
        },
      );
    } catch (e) {
      console.warn('[Bridge] send exception:', e);
    }
  }

  /** Crear una Promise con timeout para esperar un ACK */
  private makeAckPromise<T>(
    holder: { pending: PendingAck<T> | null },
    setter: (p: PendingAck<T>) => void,
    timeoutMs = 3_000,
  ): Promise<T> {
    // Cancelar ACK previo si existía
    if (holder.pending) {
      clearTimeout(holder.pending.timer);
      holder.pending.reject(new Error('Superado por nuevo comando'));
      setter(null as any);
    }
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        setter(null as any);
        reject(new Error('Timeout esperando ACK'));
      }, timeoutMs);
      setter({ resolve, reject, timer });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // API PÚBLICA — COMANDOS HEREDADOS v1.0
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Inyectar una falla en X-Plane.
   * Retorna Promise<boolean> que resuelve cuando llega el ACK.
   */
  setFalla(
    dataref: string,
    valor:   number = 6,
    meta?:   { nombre?: string; sistema?: string; fallaId?: string },
  ): Promise<boolean> {
    this.send({
      type:    'set_falla',
      dataref,
      valor,
      nombre:  meta?.nombre  ?? dataref,
      sistema: meta?.sistema ?? '',
    });

    // Mirror local de fallas
    if (valor !== 0 && meta?.fallaId) {
      this.fallasActivas.set(meta.fallaId, {
        fallaId:     meta.fallaId,
        nombre:      meta.nombre  ?? dataref,
        dataref,
        sistema:     meta.sistema ?? '',
        aeronave:    (this.estado.aeronave_xp ?? 'AW109') as AeronaveId,
        inyectadaEn: Date.now(),
        limpiadaEn:  null,
      });
    } else if (valor === 0 && meta?.fallaId) {
      const prev = this.fallasActivas.get(meta.fallaId);
      if (prev) {
        this.fallasActivas.set(meta.fallaId, { ...prev, limpiadaEn: Date.now() });
      }
    }

    const holder = { pending: this.pendingFallaAck };
    return this.makeAckPromise<boolean>(
      holder,
      (p) => { this.pendingFallaAck = p; },
    );
  }

  /** Limpiar una falla específica */
  limpiarFalla(
    dataref:  string,
    meta?:    { fallaId?: string; nombre?: string; sistema?: string },
  ): Promise<boolean> {
    return this.setFalla(dataref, 0, meta);
  }

  /** Limpiar TODAS las fallas activas */
  limpiarTodasFallas(): void {
    this.send({ type: 'limpiar_fallas' });
    this.fallasActivas.clear();
    this.actualizarEstado({ n_fallas_xp: 0 });
  }

  /** Configurar meteorología */
  setMeteo(params: Partial<ConfigMeteo>): Promise<boolean> {
    this.send({
      type:           'set_meteo',
      viento_dir:     params.viento_dir,
      viento_kts:     params.viento_kts,
      visibilidad_sm: params.visibilidad_sm,
      turbulencia:    params.turbulencia,
      temperatura_c:  params.temperatura_c,
      qnh_inhg:       params.qnh_inhg,
    });
    const holder = { pending: this.pendingMeteoAck };
    return this.makeAckPromise<boolean>(
      holder,
      (p) => { this.pendingMeteoAck = p; },
    );
  }

  /** Teletransportar al aeródromo ICAO */
  setPosicion(icao: string, agl_m?: number): Promise<string> {
    this.send({ type: 'set_posicion', icao, agl_m: agl_m ?? 50 });
    const holder = { pending: this.pendingPosicionAck };
    return this.makeAckPromise<string>(
      holder,
      (p) => { this.pendingPosicionAck = p; },
    );
  }

  /** Configurar hora del simulador */
  setHora(hora_local: string): void {
    const [h = 0, m = 0] = hora_local.split(':').map(Number);
    this.send({ type: 'set_hora', segundos_utc: h * 3600 + m * 60 });
  }

  /** Pausar / reanudar X-Plane */
  setPausa(pausado: boolean): void {
    this.send({ type: 'set_pausa', pausado });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // API PÚBLICA — NUEVOS COMANDOS v2.0
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * set_config — Cambiar configuración del bridge en caliente.
   * No requiere reiniciar X-Plane.
   */
  setConfig(params: {
    aeronave?:     AeronaveId;
    telem_extended?:boolean;
    log_limites?:  boolean;
    log_interval?: number;
  }): Promise<ConfigAck> {
    this.send({ type: 'set_config', ...params });
    const holder = { pending: this.pendingConfigAck };
    return this.makeAckPromise<ConfigAck>(
      holder,
      (p) => { this.pendingConfigAck = p; },
    );
  }

  /**
   * get_fallas — Consultar fallas activas en X-Plane.
   * Útil al reconectar para sincronizar el estado local.
   */
  getFallas(): Promise<FallasEstado> {
    this.send({ type: 'get_fallas' });
    const holder = { pending: this.pendingFallasAck };
    return this.makeAckPromise<FallasEstado>(
      holder,
      (p) => { this.pendingFallasAck = p; },
      5_000,
    );
  }

  /**
   * get_info — Obtener estado completo del bridge.
   * Incluye versión, uptime, aeronave configurada, path del log.
   */
  getInfo(): Promise<BridgeInfo> {
    this.send({ type: 'get_info' });
    const holder = { pending: this.pendingInfoAck };
    return this.makeAckPromise<BridgeInfo>(
      holder,
      (p) => { this.pendingInfoAck = p; },
      5_000,
    );
  }

  /**
   * Cambiar aeronave en X-Plane en caliente.
   * Equivale a set_config({ aeronave }) + actualizar límites en el bridge.
   */
  async cambiarAeronave(aeronave: AeronaveId): Promise<void> {
    try {
      const ack = await this.setConfig({ aeronave });
      console.log('[Bridge] Aeronave cambiada a', ack.aeronave);
    } catch (e) {
      console.warn('[Bridge] Error cambiando aeronave:', e);
    }
  }

  /**
   * Activar telemetría extendida (motor #2, hidráulico, GPS, etc.)
   */
  async setTelemExtendida(activa: boolean): Promise<void> {
    try {
      await this.setConfig({ telem_extended: activa });
      this.actualizarEstado({ telem_ext: activa });
    } catch (e) {
      console.warn('[Bridge] Error setTelemExtendida:', e);
    }
  }

  /**
   * Sincronizar fallas al reconectar.
   * Llama get_fallas y retorna la lista para que el store pueda actualizar.
   */
  async sincronizarFallas(): Promise<FallasEstado | null> {
    try {
      const fe = await this.getFallas();
      this.actualizarEstado({ n_fallas_xp: fe.total });
      return fe;
    } catch {
      return null;
    }
  }

  /**
   * Aplicar configuración completa de sesión de una sola vez.
   * Envía meteo + posición + hora + aeronave en secuencia.
   */
  async aplicarConfigSesion(params: {
    aeronave:   AeronaveId;
    icao:       string;
    hora_local: string;
    meteo:      Partial<ConfigMeteo>;
  }): Promise<{ ok: boolean; errores: string[] }> {
    const errores: string[] = [];

    // 1. Aeronave (si cambió)
    if (params.aeronave !== this.estado.aeronave_xp) {
      try {
        await this.cambiarAeronave(params.aeronave);
      } catch (e) {
        errores.push('Aeronave: ' + String(e));
      }
    }

    // 2. Posición
    try {
      await this.setPosicion(params.icao);
    } catch (e) {
      errores.push('Posición: ' + String(e));
    }

    // 3. Hora
    this.setHora(params.hora_local);

    // 4. Meteorología
    try {
      await this.setMeteo(params.meteo);
    } catch (e) {
      errores.push('Meteo: ' + String(e));
    }

    return { ok: errores.length === 0, errores };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ESTADO Y UTILIDADES
  // ══════════════════════════════════════════════════════════════════════════

  private actualizarEstado(parcial: Partial<EstadoBridge>) {
    this.estado = { ...this.estado, ...parcial };
  }

  /** Estado actual del bridge */
  getEstado(): Readonly<EstadoBridge> {
    return this.estado;
  }

  /** ¿Conectado? */
  isConnected(): boolean {
    return this.estado.conexion === 'CONECTADO';
  }

  /** Fallas activas registradas localmente */
  getFallasActivas(): FallaRegistrada[] {
    return Array.from(this.fallasActivas.values())
      .filter(f => f.limpiadaEn === null);
  }

  /** Cantidad de fallas activas */
  getCantidadFallasActivas(): number {
    return this.getFallasActivas().length;
  }

  /** Historial completo (activas + limpiadas) de la sesión */
  getHistorialFallas(): FallaRegistrada[] {
    return Array.from(this.fallasActivas.values());
  }

  /** Limpiar historial local de fallas (al iniciar nueva sesión) */
  limpiarHistorialLocal() {
    this.fallasActivas.clear();
    this.actualizarEstado({ n_fallas_xp: 0 });
  }

  /** Destruir todos los sockets e intervalos */
  destroy() {
    if (this.pingInterval)     clearInterval(this.pingInterval);
    if (this.watchdogInterval) clearInterval(this.watchdogInterval);
    if (this.reconnectTimer)   clearTimeout(this.reconnectTimer);
    if (this.cmdSocket)   { try { this.cmdSocket.close();   } catch {} }
    if (this.telemSocket) { try { this.telemSocket.close(); } catch {} }
    this.cmdSocket = null;
    this.telemSocket = null;
    this.actualizarEstado({ conexion: 'DESCONECTADO' });
  }
}

// ── Singleton exportado ───────────────────────────────────────────────────
export const luaBridge = new LuaBridgeService();
export type  { LuaBridgeService };
