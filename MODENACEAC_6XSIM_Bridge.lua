-- ══════════════════════════════════════════════════════════════════════════════
-- MODENACEAC_6XSIM_Bridge.lua  v2.0
-- FlyWithLua NG · X-Plane 11.55r2 / X-Plane 12.x
-- MODENACEAC · Departamento 6XSIM · Eduardo Forgan
--
-- INSTALACIÓN:
--   1. Copiar en X-Plane/Resources/plugins/FlyWithLua/Scripts/
--   2. Copiar dkjson.lua en la misma carpeta
--   3. Editar TABLET_IP con la IP real de la tablet Android
--   4. Ajustar AERONAVE a "AW109" o "R44" según el simulador
--   5. Reiniciar X-Plane
--
-- PUERTOS UDP:
--   49002  ←  Escucha comandos desde tablet Android
--   49001  →  Envía telemetría hacia tablet (cada 250 ms)
--
-- NOVEDADES v2.0 vs v1.0:
--   - Detección automática XP11 / XP12 (datarefs de weather diferenciados)
--   - Telemetría extendida: motor#2, hidráulico, eléctrico, GPS, baro
--   - Logging automático de sesión en Scripts/6xsim_logs/sesion_YYYYMMDD.log
--   - Log periódico de parámetros de vuelo (tabla cada 5s)
--   - Alertas automáticas cuando se superan límites operacionales
--   - Watchdog de conexión: detecta tablet desconectada (sin ping >10s)
--   - Nuevos comandos: set_config · get_fallas · get_info
--   - 20 aeródromos argentinos (antes 8)
--   - Confirmaciones ACK para cada comando
--   - Procesamiento de hasta 10 comandos por frame
--   - Historial de fallas al cierre de sesión
-- ══════════════════════════════════════════════════════════════════════════════

local json   = require("dkjson")
local socket = require("socket")

-- ── CONFIGURACIÓN ──────────────────────────────────────────────────────────
local CONFIG = {
  TABLET_IP      = "192.168.1.200",  -- ← CAMBIAR: IP de la tablet Android
  CMD_PORT       = 49002,
  TELEM_PORT     = 49001,
  TELEM_INTERVAL = 0.25,             -- Telemetría cada 250 ms
  LOG_INTERVAL   = 5.0,             -- Log de vuelo cada 5 s
  PING_TIMEOUT   = 10.0,            -- Desconexión si no hay ping en 10 s
  VERSION        = "2.0",
  AERONAVE       = "AW109",         -- "AW109" o "R44"
  LOG_DIR        = "6xsim_logs",    -- Subcarpeta para los logs
  LOG_LIMITES    = true,            -- Loggear alertas de límites
  LOG_FALLAS     = true,            -- Loggear fallas inyectadas
  TELEM_EXTENDED = true,            -- Telemetría extendida (motor#2, hidráulico, etc.)
}

-- ── DETECCIÓN XP11 / XP12 ──────────────────────────────────────────────────
local XP_VERSION = 0
do
  local dv = XPLMFindDataRef("sim/version/xplane_internal_version")
  if dv then XP_VERSION = math.floor(XPLMGetDatai(dv) / 10000) end
end
local IS_XP12 = (XP_VERSION >= 12)

-- ══════════════════════════════════════════════════════════════════════════════
-- LOGGING AUTOMÁTICO DE SESIÓN
-- ══════════════════════════════════════════════════════════════════════════════
local log_file     = nil
local log_path     = nil
local log_lineas   = 0
local session_start= os.time()

local function ts_now()
  return os.date("%H:%M:%S")
end

local function log_write(nivel, msg)
  logMsg("[6XSIM " .. nivel .. "] " .. msg)
  if log_file then
    log_file:write(os.date("%Y-%m-%d %H:%M:%S") .. " [" .. nivel .. "] " .. msg .. "\n")
    log_file:flush()
    log_lineas = log_lineas + 1
  end
end

local function init_log()
  local scripts_path = SCRIPT_DIRECTORY or ""
  local ts_str = os.date("%Y%m%d_%H%M%S")
  -- Intentar en subcarpeta primero
  log_path = scripts_path .. CONFIG.LOG_DIR .. "/sesion_" .. ts_str .. ".log"
  log_file = io.open(log_path, "w")
  -- Si falla (carpeta no existe), escribir en raíz de Scripts
  if not log_file then
    log_path = scripts_path .. "6xsim_" .. ts_str .. ".log"
    log_file = io.open(log_path, "w")
  end
  if log_file then
    log_file:write("═══════════════════════════════════════════════════\n")
    log_file:write(" MODENACEAC 6XSIM · Bridge v" .. CONFIG.VERSION .. "\n")
    log_file:write(" Inicio:   " .. os.date("%Y-%m-%d %H:%M:%S") .. "\n")
    log_file:write(" Aeronave: " .. CONFIG.AERONAVE .. "\n")
    log_file:write(" X-Plane:  " .. (IS_XP12 and "XP12" or "XP11") .. " (v" .. XP_VERSION .. ")\n")
    log_file:write(" Tablet:   " .. CONFIG.TABLET_IP .. "\n")
    log_file:write("═══════════════════════════════════════════════════\n")
    log_file:flush()
    logMsg("[6XSIM] Log: " .. log_path)
  else
    logMsg("[6XSIM WARN] No se pudo crear log de sesión")
  end
end

local function close_log(fallas_log)
  if not log_file then return end
  if fallas_log and #fallas_log > 0 then
    log_write("INFO", "── Historial de fallas ──")
    for i, fl in ipairs(fallas_log) do
      log_write("FALLA",
        string.format("  [%02d] %s [%s] %s", i, fl.ts, fl.sistema or "?", fl.nombre))
    end
  end
  local dur = os.time() - session_start
  log_file:write("═══════════════════════════════════════════════════\n")
  log_file:write(string.format(" Duración: %02dh %02dm %02ds · %d líneas\n",
    math.floor(dur/3600), math.floor((dur%3600)/60), dur%60, log_lineas))
  log_file:write("═══════════════════════════════════════════════════\n")
  log_file:close()
  log_file = nil
  logMsg("[6XSIM] Log cerrado: " .. (log_path or ""))
end

-- ══════════════════════════════════════════════════════════════════════════════
-- DATAREFS — TELEMETRÍA
-- ══════════════════════════════════════════════════════════════════════════════
local function find(path)
  local dr = XPLMFindDataRef(path)
  if not dr then logMsg("[6XSIM WARN] DR no encontrado: " .. path) end
  return dr
end

local DR = {
  -- Altimetría / posición vertical
  alt_ind  = find("sim/flightmodel/misc/h_ind"),
  alt_agl  = find("sim/flightmodel/position/y_agl"),
  alt_msl  = find("sim/flightmodel/position/elevation"),
  -- Velocidades
  ias      = find("sim/flightmodel/position/indicated_airspeed"),
  tas      = find("sim/flightmodel/position/true_airspeed"),
  gs       = find("sim/flightmodel/position/groundspeed"),
  vvi      = find("sim/flightmodel/position/vh_ind"),
  -- Actitud
  pitch    = find("sim/flightmodel/position/theta"),
  roll     = find("sim/flightmodel/position/phi"),
  hdg_mag  = find("sim/flightmodel/position/mag_psi"),
  hdg_true = find("sim/flightmodel/position/true_psi"),
  -- GPS
  lat      = find("sim/flightmodel/position/latitude"),
  lon      = find("sim/flightmodel/position/longitude"),
  -- Motor / turbina
  n1_0     = find("sim/cockpit2/engine/indicators/N1_percent[0]"),
  n1_1     = find("sim/cockpit2/engine/indicators/N1_percent[1]"),
  n2_0     = find("sim/cockpit2/engine/indicators/N2_percent[0]"),
  n2_1     = find("sim/cockpit2/engine/indicators/N2_percent[1]"),
  torq_0   = find("sim/cockpit2/engine/indicators/torque_n_mtr[0]"),
  torq_1   = find("sim/cockpit2/engine/indicators/torque_n_mtr[1]"),
  tot_0    = find("sim/cockpit2/engine/indicators/ITT_deg_C[0]"),
  tot_1    = find("sim/cockpit2/engine/indicators/ITT_deg_C[1]"),
  oilT_0   = find("sim/cockpit2/engine/indicators/oil_temperature_deg_C[0]"),
  oilP_0   = find("sim/cockpit2/engine/indicators/oil_pressure_psi[0]"),
  fuel_0   = find("sim/cockpit2/fuel/fuel_quantity[0]"),
  rpm_e0   = find("sim/cockpit2/engine/indicators/engine_speed_rpm[0]"),
  rpm_r    = find("sim/flightmodel/engine/ENGN_N2_[0]"),
  -- Eléctrico
  volt_dc1 = find("sim/cockpit2/electrical/bus_volts[0]"),
  amp_gen1 = find("sim/cockpit2/electrical/generator_amps[0]"),
  amp_gen2 = find("sim/cockpit2/electrical/generator_amps[1]"),
  -- Hidráulico
  hyd_p1   = find("sim/cockpit2/hydraulics/actuator/hydraulic_pressure[0]"),
  hyd_p2   = find("sim/cockpit2/hydraulics/actuator/hydraulic_pressure[1]"),
  -- Barométrico
  baro     = find("sim/weather/barometer_sealevel_inhg"),
  -- Simulador
  zulu     = find("sim/time/zulu_time_sec"),
  paused   = find("sim/time/paused"),
}

-- Datarefs de weather diferenciados por versión
local WX = {}
if IS_XP12 then
  WX.wind_dir = XPLMFindDataRef("sim/weather/region/wind_direction_degt[0]")
  WX.wind_kts = XPLMFindDataRef("sim/weather/region/wind_speed_kt[0]")
  WX.vis_sm   = XPLMFindDataRef("sim/weather/region/visibility_reported_sm")
  WX.temp     = XPLMFindDataRef("sim/weather/region/temperature_sealevel_c")
  WX.turb     = XPLMFindDataRef("sim/weather/region/turbulence[0]")
  WX.dewpoint = XPLMFindDataRef("sim/weather/region/dewpnt_sealevel_c")
  log_write("INFO", "XP12: datarefs weather region activados")
else
  WX.wind_dir = find("sim/weather/wind_direction_degt[0]")
  WX.wind_kts = find("sim/weather/wind_speed_kt[0]")
  WX.vis_m    = find("sim/weather/visibility_reported_m")
  WX.temp     = find("sim/weather/temperature_sealevel_c")
  WX.turb     = find("sim/weather/turbulence[0]")
end

-- ══════════════════════════════════════════════════════════════════════════════
-- FALLAS
-- ══════════════════════════════════════════════════════════════════════════════
local falla_cache   = {}
local fallas_activas= {}
local fallas_log    = {}

local function get_falla_dr(nombre)
  if not falla_cache[nombre] then
    falla_cache[nombre] = XPLMFindDataRef(nombre)
    if not falla_cache[nombre] then
      log_write("WARN", "Falla DR no encontrado: " .. nombre)
    end
  end
  return falla_cache[nombre]
end

-- ══════════════════════════════════════════════════════════════════════════════
-- LÍMITES OPERACIONALES
-- ══════════════════════════════════════════════════════════════════════════════
local lim_aw109 = {
  { dr="n1_0",   max=107,  nombre="N1 Mot.1 (%)"   },
  { dr="n1_1",   max=107,  nombre="N1 Mot.2 (%)"   },
  { dr="tot_0",  max=860,  nombre="TOT Mot.1 (°C)" },
  { dr="tot_1",  max=860,  nombre="TOT Mot.2 (°C)" },
  { dr="torq_0", max=100,  nombre="Torque Mot.1 (%)"},
  { dr="oilT_0", max=150,  nombre="Aceite T (°C)"  },
  { dr="oilP_0", min=30,   nombre="Aceite P (PSI)" },
  { dr="volt_dc1",min=24,  nombre="Bus DC (V)"     },
  { dr="ias",    max=150,  nombre="IAS (kts)"       },
}
local lim_r44 = {
  { dr="rpm_r",  min=97, max=110, nombre="RPM Rotor (%)"},
  { dr="tot_0",  max=305,          nombre="CHT (°C)"    },
  { dr="oilT_0", max=118,          nombre="Aceite T (°C)"},
  { dr="oilP_0", min=25, max=100,  nombre="Aceite P (PSI)"},
  { dr="ias",    max=130,          nombre="IAS (kts)"   },
}

local limites = CONFIG.AERONAVE == "R44" and lim_r44 or lim_aw109
local lim_alerta = {}

local function safe_getf(dr) if not dr then return 0 end; local ok,v=pcall(XPLMGetDataf,dr); return ok and (v or 0) or 0 end
local function safe_geti(dr) if not dr then return 0 end; local ok,v=pcall(XPLMGetDatai,dr); return ok and (v or 0) or 0 end
local function safe_getd(dr) if not dr then return 0 end; local ok,v=pcall(XPLMGetDatad,dr); return ok and (v or 0) or 0 end
local function round(n,d)    local f=10^(d or 0); return math.floor(n*f+0.5)/f end

local function verificar_limites()
  if not CONFIG.LOG_LIMITES then return end
  for _, lim in ipairs(limites) do
    local dr  = DR[lim.dr]
    local val = safe_getf(dr)
    local alerta = (lim.max and val > lim.max) or (lim.min and val < lim.min)
    if alerta then
      if not lim_alerta[lim.dr] then
        lim_alerta[lim.dr] = true
        local razon = lim.max and val > lim.max
          and string.format("%.1f > MAX %.1f", val, lim.max)
          or  string.format("%.1f < MIN %.1f", val, lim.min)
        log_write("ALERTA", "⚠ LÍMITE " .. lim.nombre .. ": " .. razon)
      end
    else
      lim_alerta[lim.dr] = nil
    end
  end
end

-- ══════════════════════════════════════════════════════════════════════════════
-- SOCKETS UDP
-- ══════════════════════════════════════════════════════════════════════════════
local udp_cmd   = nil
local udp_telem = nil
local last_ping = os.clock()
local connected = false

local function init_sockets()
  udp_cmd = socket.udp()
  udp_cmd:setsockname("*", CONFIG.CMD_PORT)
  udp_cmd:settimeout(0)
  udp_telem = socket.udp()
  udp_telem:settimeout(0)
  log_write("INFO", "UDP CMD :" .. CONFIG.CMD_PORT ..
    " · TELEM → " .. CONFIG.TABLET_IP .. ":" .. CONFIG.TELEM_PORT)
end

local function send_json(data)
  if not udp_telem then return end
  local ok, msg = pcall(json.encode, data)
  if ok then udp_telem:sendto(msg, CONFIG.TABLET_IP, CONFIG.TELEM_PORT) end
end

-- ══════════════════════════════════════════════════════════════════════════════
-- TELEMETRÍA
-- ══════════════════════════════════════════════════════════════════════════════
local last_telem_t = 0

local function enviar_telemetria()
  if not udp_telem then return end
  local now = os.clock()
  if (now - last_telem_t) < CONFIG.TELEM_INTERVAL then return end
  last_telem_t = now

  local nf = 0; for _ in pairs(fallas_activas) do nf = nf + 1 end

  local data = {
    type    = "telem",
    ts      = now,
    xp      = IS_XP12 and 12 or 11,
    -- Altimetría
    alt     = round(safe_getf(DR.alt_ind), 0),
    agl     = round(safe_getf(DR.alt_agl), 0),
    -- Velocidades
    ias     = round(safe_getf(DR.ias),     1),
    gs      = round(safe_getf(DR.gs) * 1.94384, 1),
    vvi     = round(safe_getf(DR.vvi),     0),
    -- Actitud
    pit     = round(safe_getf(DR.pitch),   1),
    rol     = round(safe_getf(DR.roll),    1),
    hdg     = round(safe_getf(DR.hdg_mag), 0),
    -- Motor #1
    n1      = round(safe_getf(DR.n1_0),   1),
    n2      = round(safe_getf(DR.n2_0),   1),
    trq     = round(safe_getf(DR.torq_0), 1),
    tot     = round(safe_getf(DR.tot_0),  0),
    -- Rotor
    rpm     = round(safe_getf(DR.rpm_e0), 0),
    rot     = round(safe_getf(DR.rpm_r),  1),
    -- Estado
    paused  = safe_geti(DR.paused) == 1,
    n_fallas= nf,
  }

  -- Telemetría extendida
  if CONFIG.TELEM_EXTENDED then
    -- Motor #2
    data.n1_2  = round(safe_getf(DR.n1_1),   1)
    data.n2_2  = round(safe_getf(DR.n2_1),   1)
    data.trq2  = round(safe_getf(DR.torq_1), 1)
    data.tot2  = round(safe_getf(DR.tot_1),  0)
    -- Sistemas
    data.oilT  = round(safe_getf(DR.oilT_0), 1)
    data.oilP  = round(safe_getf(DR.oilP_0), 1)
    data.fuel  = round(safe_getf(DR.fuel_0),  1)
    data.volt  = round(safe_getf(DR.volt_dc1),1)
    data.amp1  = round(safe_getf(DR.amp_gen1),1)
    data.amp2  = round(safe_getf(DR.amp_gen2),1)
    data.hyd1  = round(safe_getf(DR.hyd_p1),  0)
    data.hyd2  = round(safe_getf(DR.hyd_p2),  0)
    -- Navegación
    data.tas   = round(safe_getf(DR.tas) * 1.94384, 1)
    data.hdgt  = round(safe_getf(DR.hdg_true), 0)
    data.baro  = round(safe_getf(DR.baro), 2)
    data.lat   = round(safe_getd(DR.lat),  4)
    data.lon   = round(safe_getd(DR.lon),  4)
    -- Meteo
    data.wdir  = round(safe_getf(WX.wind_dir), 0)
    data.wkts  = round(safe_getf(WX.wind_kts), 1)
    data.oat   = round(safe_getf(WX.temp), 1)
    -- Fallas activas
    if nf > 0 then
      local fa = {}
      for k in pairs(fallas_activas) do
        table.insert(fa, k:match("failures/(.+)$") or k)
      end
      data.fallas = fa
    end
  end

  send_json(data)
end

-- ══════════════════════════════════════════════════════════════════════════════
-- LOG PERIÓDICO DE VUELO
-- ══════════════════════════════════════════════════════════════════════════════
local last_log_t   = 0
local log_count    = 0

local function log_vuelo()
  local now = os.clock()
  if (now - last_log_t) < CONFIG.LOG_INTERVAL then return end
  last_log_t = now
  log_count  = log_count + 1

  -- Cabecera cada 20 líneas
  if log_count % 20 == 1 then
    log_write("DATA", string.format(
      "%-8s %7s %6s %7s %+6s %6s %6s %6s %6s %5s",
      "HORA","ALT(ft)","IAS(kt)","HDG(°)","VVI","N1_1%","N1_2%","TOT1","RPM%","F.A."))
  end

  local nf = 0; for _ in pairs(fallas_activas) do nf=nf+1 end

  log_write("DATA", string.format(
    "%-8s %7.0f %6.1f %7.1f %+6.0f %6.1f %6.1f %6.0f %6.1f %5d",
    ts_now(),
    safe_getf(DR.alt_ind),  safe_getf(DR.ias),
    safe_getf(DR.hdg_mag),  safe_getf(DR.vvi),
    safe_getf(DR.n1_0),     safe_getf(DR.n1_1),
    safe_getf(DR.tot_0),    safe_getf(DR.rpm_r), nf
  ))

  verificar_limites()
end

-- ══════════════════════════════════════════════════════════════════════════════
-- AERÓDROMOS ARGENTINOS (20 aeródromos)
-- ══════════════════════════════════════════════════════════════════════════════
local ICAO = {
  SAEZ={lat=-34.8222,lon=-58.5358,alt=20, nombre="Ezeiza Pistarini"},
  SABE={lat=-34.5592,lon=-58.4156,alt=14, nombre="Aeroparque J. Newbery"},
  SADF={lat=-34.4553,lon=-58.5897,alt=13, nombre="El Palomar / Morón"},
  SADP={lat=-34.6097,lon=-58.7122,alt=17, nombre="Don Torcuato"},
  SARC={lat=-27.4500,lon=-59.0559,alt=52, nombre="Resistencia"},
  SAME={lat=-32.8317,lon=-68.7928,alt=704,nombre="Mendoza El Plumerillo"},
  SACO={lat=-31.3236,lon=-64.2080,alt=495,nombre="Córdoba A. Taravella"},
  SAZR={lat=-36.5883,lon=-64.2758,alt=207,nombre="Santa Rosa"},
  SAZH={lat=-31.7117,lon=-60.8119,alt=20, nombre="Reconquista"},
  SAAG={lat=-34.5597,lon=-60.9306,alt=81, nombre="General Villegas"},
  SASA={lat=-24.8560,lon=-65.4869,alt=1240,nombre="Salta"},
  SASJ={lat=-24.3964,lon=-65.0978,alt=905,nombre="Jujuy"},
  SANC={lat=-28.7961,lon=-64.9614,alt=200,nombre="Santiago del Estero"},
  SAVC={lat=-45.7853,lon=-67.4656,alt=58, nombre="Comodoro Rivadavia"},
  SAWH={lat=-54.8433,lon=-68.2958,alt=31, nombre="Ushuaia Malvinas"},
  SAWG={lat=-51.6089,lon=-69.3122,alt=200,nombre="Río Gallegos"},
  SAVB={lat=-41.1511,lon=-71.1578,alt=826,nombre="Bariloche"},
  SAVM={lat=-46.5378,lon=-68.7783,alt=230,nombre="Perito Moreno"},
  SARP={lat=-27.3856,lon=-55.9706,alt=90, nombre="Posadas"},
  SARI={lat=-25.7303,lon=-54.4736,alt=270,nombre="Puerto Iguazú"},
}

-- ══════════════════════════════════════════════════════════════════════════════
-- HANDLERS DE COMANDOS
-- ══════════════════════════════════════════════════════════════════════════════
local handlers = {}

-- PING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
handlers.ping = function(_)
  last_ping = os.clock()
  if not connected then
    connected = true
    log_write("INFO", "✓ Tablet conectada: " .. CONFIG.TABLET_IP)
  end
  local nf = 0; for _ in pairs(fallas_activas) do nf=nf+1 end
  send_json({
    type     = "pong",
    ts       = os.clock(),
    version  = CONFIG.VERSION,
    xp       = IS_XP12 and 12 or 11,
    aeronave = CONFIG.AERONAVE,
    n_fallas = nf,
  })
end

-- SET_FALLA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
handlers.set_falla = function(data)
  local dr_name = data.dataref
  local valor   = tonumber(data.valor) or 6
  local nombre  = data.nombre or dr_name or "?"
  if not dr_name then return end

  local dr = get_falla_dr(dr_name)
  if not dr then return end

  local ok = pcall(XPLMSetDatai, dr, valor)
  if not ok then pcall(XPLMSetDataf, dr, valor) end

  if valor ~= 0 then
    fallas_activas[dr_name] = valor
    if CONFIG.LOG_FALLAS then
      table.insert(fallas_log, {
        ts=ts_now(), dr=dr_name, nombre=nombre, sistema=data.sistema})
      log_write("FALLA", string.format(
        "▶ [%s] %s (val=%d)", data.sistema or "?", nombre, valor))
    end
  else
    fallas_activas[dr_name] = nil
    if CONFIG.LOG_FALLAS then
      log_write("FALLA", "✓ Limpiada: " .. nombre)
    end
  end

  send_json({type="falla_ack", dataref=dr_name, valor=valor, ok=true})
end

-- LIMPIAR_FALLAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
handlers.limpiar_fallas = function(_)
  local count = 0
  for dr_name in pairs(fallas_activas) do
    local dr = get_falla_dr(dr_name)
    if dr then pcall(XPLMSetDatai, dr, 0); count = count + 1 end
  end
  fallas_activas = {}
  lim_alerta = {}
  log_write("FALLA", string.format("✓ %d fallas limpiadas", count))
  send_json({type="limpiar_ack", count=count})
end

-- SET_METEO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
handlers.set_meteo = function(data)
  local function setf(path_12, path_11, val)
    if val == nil then return end
    local path = IS_XP12 and path_12 or path_11
    local dr   = XPLMFindDataRef(path)
    if dr then pcall(XPLMSetDataf, dr, val) end
  end

  setf("sim/weather/region/wind_direction_degt[0]",
       "sim/weather/wind_direction_degt[0]", data.viento_dir)
  setf("sim/weather/region/wind_speed_kt[0]",
       "sim/weather/wind_speed_kt[0]", data.viento_kts)
  setf("sim/weather/region/temperature_sealevel_c",
       "sim/weather/temperature_sealevel_c", data.temperatura_c)
  setf("sim/weather/region/turbulence[0]",
       "sim/weather/turbulence[0]",
       data.turbulencia and (data.turbulencia / 3.0) or nil)

  -- Visibilidad: XP12 en SM, XP11 en metros
  if data.visibilidad_sm then
    if IS_XP12 then
      setf("sim/weather/region/visibility_reported_sm", nil, data.visibilidad_sm)
    else
      local dr = XPLMFindDataRef("sim/weather/visibility_reported_m")
      if dr then pcall(XPLMSetDataf, dr, data.visibilidad_sm * 1852) end
    end
  end
  if data.qnh_inhg then
    local dr = XPLMFindDataRef("sim/weather/barometer_sealevel_inhg")
    if dr then pcall(XPLMSetDataf, dr, data.qnh_inhg) end
  end

  log_write("METEO", string.format(
    "%s°/%skts Vis:%sSM T:%s°C Turb:%s QNH:%s",
    data.viento_dir  or"—", data.viento_kts or"—",
    data.visibilidad_sm or"—", data.temperatura_c or"—",
    data.turbulencia or"—", data.qnh_inhg or"—"))
  send_json({type="meteo_ack", ok=true})
end

-- SET_POSICION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
handlers.set_posicion = function(data)
  local icao = ((data.icao or "SAEZ"):upper())
  local pos  = ICAO[icao] or ICAO["SAEZ"]
  local alt  = (pos.alt or 0) + (data.agl_m or 50)

  local dr_lat = XPLMFindDataRef("sim/flightmodel/position/latitude")
  local dr_lon = XPLMFindDataRef("sim/flightmodel/position/longitude")
  local dr_ele = XPLMFindDataRef("sim/flightmodel/position/elevation")
  if dr_lat then pcall(XPLMSetDatad, dr_lat, pos.lat) end
  if dr_lon then pcall(XPLMSetDatad, dr_lon, pos.lon) end
  if dr_ele then pcall(XPLMSetDatad, dr_ele, alt) end

  log_write("POS", string.format("→ %s (%s) %.4f/%.4f alt=%dm",
    icao, pos.nombre, pos.lat, pos.lon, math.floor(alt)))
  send_json({type="posicion_ack", icao=icao, nombre=pos.nombre, ok=true})
end

-- SET_HORA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
handlers.set_hora = function(data)
  local seg = tonumber(data.segundos_utc) or 36000
  if DR.zulu then pcall(XPLMSetDataf, DR.zulu, seg) end
  log_write("CONFIG", string.format("Hora UTC: %02d:%02d",
    math.floor(seg/3600), math.floor((seg%3600)/60)))
  send_json({type="hora_ack", segundos_utc=seg, ok=true})
end

-- SET_PAUSA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
handlers.set_pausa = function(data)
  local p = data.pausado and 1 or 0
  if DR.paused then pcall(XPLMSetDatai, DR.paused, p) end
  log_write("CONFIG", p==1 and "PAUSADO" or "REANUDADO")
  send_json({type="pausa_ack", pausado=p==1})
end

-- SET_CONFIG (nuevo v2.0) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
handlers.set_config = function(data)
  if data.aeronave == "AW109" or data.aeronave == "R44" then
    CONFIG.AERONAVE = data.aeronave
    limites   = CONFIG.AERONAVE == "R44" and lim_r44 or lim_aw109
    lim_alerta= {}
    log_write("CONFIG", "Aeronave → " .. CONFIG.AERONAVE)
  end
  if data.telem_extended  ~= nil then CONFIG.TELEM_EXTENDED = data.telem_extended end
  if data.log_limites     ~= nil then CONFIG.LOG_LIMITES    = data.log_limites    end
  if data.log_interval    ~= nil then CONFIG.LOG_INTERVAL   = data.log_interval   end
  send_json({type="config_ack", aeronave=CONFIG.AERONAVE,
    xp=IS_XP12 and 12 or 11, version=CONFIG.VERSION, ok=true})
end

-- GET_FALLAS (nuevo v2.0) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
handlers.get_fallas = function(_)
  local lista = {}
  for k, v in pairs(fallas_activas) do
    table.insert(lista, {
      dataref = k,
      sufijo  = k:match("failures/(.+)$") or k,
      valor   = v,
    })
  end
  send_json({type="fallas_estado", fallas=lista, total=#lista})
end

-- GET_INFO (nuevo v2.0) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
handlers.get_info = function(_)
  local nf = 0; for _ in pairs(fallas_activas) do nf=nf+1 end
  send_json({
    type       = "info",
    version    = CONFIG.VERSION,
    xp         = IS_XP12 and 12 or 11,
    aeronave   = CONFIG.AERONAVE,
    tablet_ip  = CONFIG.TABLET_IP,
    n_fallas   = nf,
    uptime_s   = os.time() - session_start,
    log_path   = log_path or "—",
    conectado  = connected,
    telem_ext  = CONFIG.TELEM_EXTENDED,
  })
end

-- ── Dispatcher ──────────────────────────────────────────────────────────────
local function procesar_comando(msg)
  local ok, data = pcall(json.decode, msg)
  if not ok or type(data) ~= "table" then
    log_write("WARN", "JSON inválido: " .. tostring(msg):sub(1,60))
    return
  end
  local tipo = data.type or ""
  local h    = handlers[tipo]
  if h then
    local hok, err = pcall(h, data)
    if not hok then log_write("ERROR", tipo .. ": " .. tostring(err)) end
  else
    log_write("WARN", "Comando desconocido: " .. tipo)
  end
end

-- ══════════════════════════════════════════════════════════════════════════════
-- WATCHDOG
-- ══════════════════════════════════════════════════════════════════════════════
local function watchdog()
  if connected and (os.clock() - last_ping) > CONFIG.PING_TIMEOUT then
    connected = false
    log_write("WARN", "⚠ Tablet desconectada (sin ping >" ..
      CONFIG.PING_TIMEOUT .. "s)")
  end
end

-- ══════════════════════════════════════════════════════════════════════════════
-- FLIGHT LOOP (callback de X-Plane)
-- ══════════════════════════════════════════════════════════════════════════════
local loop_count = 0

local function flight_loop(elapsed, elapsed_sim, counter, ref)
  loop_count = loop_count + 1

  enviar_telemetria()
  log_vuelo()

  if loop_count % 20 == 0 then watchdog() end

  -- Leer hasta 10 comandos por frame
  if udp_cmd then
    for _ = 1, 10 do
      local msg = udp_cmd:receive()
      if not msg then break end
      procesar_comando(msg)
    end
  end

  return CONFIG.TELEM_INTERVAL
end

-- ══════════════════════════════════════════════════════════════════════════════
-- ARRANQUE
-- ══════════════════════════════════════════════════════════════════════════════
init_log()
init_sockets()

XPLMRegisterFlightLoopCallback(flight_loop, CONFIG.TELEM_INTERVAL, nil)

log_write("INFO", string.format(
  "Bridge v%s listo · %s · %s · Tablet: %s:%d",
  CONFIG.VERSION, CONFIG.AERONAVE,
  IS_XP12 and "XP12" or "XP11",
  CONFIG.TABLET_IP, CONFIG.TELEM_PORT
))

-- Cleanup al cerrar
do_on_exit("SIXSIM_BRIDGE_CLEANUP()")
function SIXSIM_BRIDGE_CLEANUP()
  log_write("INFO", "Cerrando bridge...")
  close_log(fallas_log)
end
