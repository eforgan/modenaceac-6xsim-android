-- MODENACEAC_6XSIM_Bridge.lua
-- Script FlyWithLua para X-Plane 11/12
-- Instalación: X-Plane/Resources/plugins/FlyWithLua/Scripts/
-- Dependencia: dkjson.lua en la misma carpeta
--
-- Puertos:
--   49002 → escucha comandos desde la tablet Android
--   49001 → emite telemetría hacia la tablet Android (cada 250ms)
--
-- Configurar la IP de la tablet en la línea TABLET_IP

local json    = require("dkjson")
local socket  = require("socket")

-- ── Configuración ──────────────────────────────────────────────────────────
local TABLET_IP   = "192.168.1.200"  -- ← CAMBIAR a la IP de la tablet
local CMD_PORT    = 49002            -- Puerto de escucha (comandos entrantes)
local TELEM_PORT  = 49001            -- Puerto de envío (telemetría saliente)
local TELEM_INTERVAL = 0.25          -- Segundos entre envíos de telemetría

-- ── Datarefs de telemetría ────────────────────────────────────────────────
local DR = {
  alt    = XPLMFindDataRef("sim/flightmodel/misc/h_ind"),
  vvi    = XPLMFindDataRef("sim/flightmodel/position/vh_ind"),
  ias    = XPLMFindDataRef("sim/flightmodel/position/indicated_airspeed"),
  pitch  = XPLMFindDataRef("sim/flightmodel/position/theta"),
  roll   = XPLMFindDataRef("sim/flightmodel/position/phi"),
  hdg    = XPLMFindDataRef("sim/flightmodel/position/mag_psi"),
  rpm_e0 = XPLMFindDataRef("sim/cockpit2/engine/indicators/engine_speed_rpm[0]"),
  rpm_r  = XPLMFindDataRef("sim/flightmodel/engine/ENGN_N2_[0]"),
  torque = XPLMFindDataRef("sim/cockpit2/engine/indicators/torque_n_mtr[0]"),
  -- Datarefs de configuración
  zulu   = XPLMFindDataRef("sim/time/zulu_time_sec"),
  pausa  = XPLMFindDataRef("sim/time/paused"),
}

-- ── Datarefs de fallas ────────────────────────────────────────────────────
-- Valor 6 = falla · 0 = normal
local FALLA_PREFIX = "sim/operation/failures/"

-- Cache de datarefs de fallas ya resueltos
local falla_dr_cache = {}
local function get_falla_dr(nombre)
  if not falla_dr_cache[nombre] then
    falla_dr_cache[nombre] = XPLMFindDataRef(nombre)
  end
  return falla_dr_cache[nombre]
end

-- Lista de todas las fallas activas (para limpiar todas)
local fallas_activas = {}

-- ── Sockets UDP ───────────────────────────────────────────────────────────
local udp_cmd  = nil   -- socket de escucha (recibe comandos)
local udp_telem = nil  -- socket de envío  (envía telemetría)

local function init_sockets()
  -- Socket de comandos (escucha en 49002)
  udp_cmd = socket.udp()
  udp_cmd:setsockname("*", CMD_PORT)
  udp_cmd:settimeout(0)   -- no bloqueante

  -- Socket de telemetría (envía a tablet)
  udp_telem = socket.udp()
  udp_telem:settimeout(0)

  logMsg("[6XSIM Bridge] Sockets iniciados. IP tablet: " .. TABLET_IP)
  logMsg("[6XSIM Bridge] Escucha CMD en :" .. CMD_PORT .. " · Telemetría hacia " .. TABLET_IP .. ":" .. TELEM_PORT)
end

-- ── Enviar telemetría ─────────────────────────────────────────────────────
local last_telem = 0

local function enviar_telemetria()
  if not udp_telem then return end
  local now = os.clock()
  if (now - last_telem) < TELEM_INTERVAL then return end
  last_telem = now

  local data = {
    type = "telem",
    alt  = XPLMGetDataf(DR.alt)   or 0,
    vvi  = XPLMGetDataf(DR.vvi)   or 0,
    ias  = XPLMGetDataf(DR.ias)   or 0,
    pit  = XPLMGetDataf(DR.pitch) or 0,
    rol  = XPLMGetDataf(DR.roll)  or 0,
    hdg  = XPLMGetDataf(DR.hdg)   or 0,
    rpm  = XPLMGetDataf(DR.rpm_e0)or 0,
    rot  = XPLMGetDataf(DR.rpm_r) or 0,
    trq  = XPLMGetDataf(DR.torque)or 0,
    ts   = now,
  }

  local msg = json.encode(data)
  udp_telem:sendto(msg, TABLET_IP, TELEM_PORT)
end

-- ── Procesar comando entrante ─────────────────────────────────────────────
local function procesar_comando(msg)
  local ok, data = pcall(json.decode, msg)
  if not ok or type(data) ~= "table" then return end

  local tipo = data.type or ""

  -- PING → responder PONG
  if tipo == "ping" then
    if udp_telem then
      local pong = json.encode({ type = "pong", ts = os.clock() })
      udp_telem:sendto(pong, TABLET_IP, TELEM_PORT)
    end

  -- SET_FALLA → inyectar una falla
  elseif tipo == "set_falla" then
    local dr_name = data.dataref
    local valor   = tonumber(data.valor) or 6
    if dr_name then
      local dr = get_falla_dr(dr_name)
      if dr then
        XPLMSetDatai(dr, valor)
        if valor > 0 then
          fallas_activas[dr_name] = valor
        else
          fallas_activas[dr_name] = nil
        end
        logMsg("[6XSIM] Falla: " .. dr_name .. " = " .. valor)
      else
        logMsg("[6XSIM] WARN: Dataref no encontrado: " .. tostring(dr_name))
      end
    end

  -- LIMPIAR_FALLAS → poner todas las fallas activas a 0
  elseif tipo == "limpiar_fallas" then
    local count = 0
    for dr_name, _ in pairs(fallas_activas) do
      local dr = get_falla_dr(dr_name)
      if dr then
        XPLMSetDatai(dr, 0)
        count = count + 1
      end
    end
    fallas_activas = {}
    logMsg("[6XSIM] Fallas limpiadas: " .. count)

  -- SET_METEO → configurar meteorología
  elseif tipo == "set_meteo" then
    local dr_vdir = XPLMFindDataRef("sim/weather/wind_direction_degt[0]")
    local dr_vkts = XPLMFindDataRef("sim/weather/wind_speed_kt[0]")
    local dr_vis  = XPLMFindDataRef("sim/weather/visibility_reported_m")
    local dr_turb = XPLMFindDataRef("sim/weather/turbulence[0]")
    local dr_temp = XPLMFindDataRef("sim/weather/temperature_sealevel_c")

    if dr_vdir and data.viento_dir then XPLMSetDataf(dr_vdir, data.viento_dir) end
    if dr_vkts and data.viento_kts then XPLMSetDataf(dr_vkts, data.viento_kts) end
    if dr_vis  and data.visibilidad_sm then
      XPLMSetDataf(dr_vis, data.visibilidad_sm * 1852) -- SM → metros
    end
    if dr_turb and data.turbulencia then
      -- 0=none 1=light 2=moderate 3=severe → XP usa 0..1
      XPLMSetDataf(dr_turb, (data.turbulencia or 0) / 3.0)
    end
    if dr_temp and data.temperatura_c then XPLMSetDataf(dr_temp, data.temperatura_c) end
    logMsg("[6XSIM] Meteorología configurada")

  -- SET_POSICION → teletransportar al ICAO
  elseif tipo == "set_posicion" then
    -- Coordenadas básicas de aeródromos argentinos
    local icao_coords = {
      SAEZ = { lat=-34.8222, lon=-58.5358, alt=20  },
      SABE = { lat=-34.5592, lon=-58.4156, alt=14  },
      SARC = { lat=-27.4500, lon=-59.0559, alt=52  },
      SAME = { lat=-32.8317, lon=-68.7928, alt=704 },
      SACO = { lat=-31.3236, lon=-64.2080, alt=495 },
      SAWH = { lat=-54.8433, lon=-68.2958, alt=31  },
      SAZH = { lat=-31.7117, lon=-60.8119, alt=20  },
      SAAG = { lat=-34.5597, lon=-60.9306, alt=81  },
    }
    local icao = data.icao or "SAEZ"
    local pos  = icao_coords[icao] or icao_coords["SAEZ"]

    -- Usar XPLMWorldToLocal + XPLMSetDatad para teletransportar
    local dr_lat = XPLMFindDataRef("sim/flightmodel/position/latitude")
    local dr_lon = XPLMFindDataRef("sim/flightmodel/position/longitude")
    local dr_ele = XPLMFindDataRef("sim/flightmodel/position/elevation")
    if dr_lat and dr_lon and dr_ele then
      XPLMSetDatad(dr_lat, pos.lat)
      XPLMSetDatad(dr_lon, pos.lon)
      XPLMSetDatad(dr_ele, pos.alt)
    end
    logMsg("[6XSIM] Posición: " .. icao .. " lat=" .. pos.lat .. " lon=" .. pos.lon)

  -- SET_HORA → configurar hora del simulador
  elseif tipo == "set_hora" then
    local seg = tonumber(data.segundos_utc) or 36000
    if DR.zulu then
      XPLMSetDataf(DR.zulu, seg)
    end
    logMsg("[6XSIM] Hora configurada: " .. seg .. "s UTC")

  -- SET_PAUSA → pausar/reanudar X-Plane
  elseif tipo == "set_pausa" then
    if DR.pausa then
      XPLMSetDatai(DR.pausa, data.pausado and 1 or 0)
    end
    logMsg("[6XSIM] Pausa: " .. tostring(data.pausado))
  end
end

-- ── Bucle principal (flight loop) ─────────────────────────────────────────
local function flight_loop(elapsed, elapsed_sim, counter, ref)
  -- Enviar telemetría
  enviar_telemetria()

  -- Leer comandos entrantes
  if udp_cmd then
    local msg, ip, port = udp_cmd:receivefrom()
    if msg then
      procesar_comando(msg)
    end
  end

  return TELEM_INTERVAL  -- llamar de nuevo en 250ms
end

-- ── Arranque ──────────────────────────────────────────────────────────────
do_often("") -- forzar carga del módulo

init_sockets()

-- Registrar el flight loop
XPLMRegisterFlightLoopCallback(flight_loop, TELEM_INTERVAL, nil)

logMsg("[6XSIM Bridge] Iniciado. Tablet IP: " .. TABLET_IP)
logMsg("[6XSIM Bridge] Comandos en :" .. CMD_PORT .. " · Telemetría → " .. TELEM_PORT)
