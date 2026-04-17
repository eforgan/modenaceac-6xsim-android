# MODENACEAC 6XSIM — App Android Tablet

App React Native para tablet Android 10" · Departamento 6XSIM

---

## Estructura del proyecto

```
6xsim-android/
├── App.tsx                          ← Punto de entrada
├── package.json
├── tsconfig.json
├── MODENACEAC_6XSIM_Bridge.lua      ← Script FlyWithLua para X-Plane
└── src/
    ├── theme.ts                     ← Tokens de diseño
    ├── types.ts                     ← Tipos TypeScript
    ├── data/
    │   └── fallas.ts                ← Fallas AW109 + R44 + maniobras
    ├── services/
    │   └── LuaBridge.ts             ← Comunicación UDP con X-Plane
    ├── store/
    │   ├── sesionStore.ts           ← Estado global de sesión (Zustand)
    │   └── configStore.ts           ← Configuración persistida
    ├── navigation/
    │   └── TabNavigator.tsx         ← Navegación inferior 5 tabs
    ├── components/
    │   └── index.tsx                ← Componentes reutilizables
    └── screens/
        ├── ConfigScreen.tsx         ← Pantalla 1: Configuración
        ├── FallasScreen.tsx         ← Pantalla 2: Fallas X-Plane
        ├── SesionScreen.tsx         ← Pantalla 3: Sesión activa + telemetría
        ├── ManiobrasScreen.tsx      ← Pantalla 4: Evaluación maniobras
        └── ReporteScreen.tsx        ← Pantalla 5: Reporte + firma digital
```

---

## Pantallas

| Tab       | Función                                                        |
|-----------|----------------------------------------------------------------|
| Config    | Selección de aeronave, IP X-Plane, ICAO, hora, meteorología, piloto |
| Fallas    | 10 sistemas AW109 / 4 sistemas R44 · toggles individuales · acciones rápidas |
| Sesión    | Cronómetro · telemetría UDP en tiempo real · fallas activas |
| Maniobras | Evaluación AS/S/SB/NA · observaciones · inyección de fallas sugeridas |
| Reporte   | Resumen de sesión · evaluación global · firma digital · cierre |

---

## Comunicación UDP con X-Plane

```
Tablet Android ──► X-Plane (FlyWithLua)
      UDP 49002 · Comandos JSON

X-Plane (FlyWithLua) ──► Tablet Android
      UDP 49001 · Telemetría JSON cada 250ms
```

### Comandos disponibles (tablet → X-Plane)

```json
{ "type": "ping" }
{ "type": "pong" }
{ "type": "set_falla",    "dataref": "sim/operation/failures/rel_engfai0", "valor": 6 }
{ "type": "limpiar_fallas" }
{ "type": "set_meteo",    "viento_dir": 240, "viento_kts": 15, "visibilidad_sm": 5, "turbulencia": 1, "temperatura_c": 18 }
{ "type": "set_posicion", "icao": "SAEZ" }
{ "type": "set_hora",     "segundos_utc": 36000 }
{ "type": "set_pausa",    "pausado": true }
```

### Telemetría (X-Plane → tablet)

```json
{
  "type": "telem",
  "alt":  1250,   // altitud ft
  "vvi":  -120,   // tasa descenso fpm
  "ias":  45,     // velocidad indicada kts
  "pit":  -2.1,   // pitch grados
  "rol":  0.8,    // roll grados
  "hdg":  245,    // rumbo magnético
  "rpm":  6420,   // RPM motor
  "rot":  324,    // RPM rotor (N2)
  "trq":  78.5,   // torque %
  "ts":   12345.6 // timestamp
}
```

---

## Instalación

### 1. App Android

```bash
# Instalar dependencias
npm install

# Correr en dispositivo Android
npx react-native run-android
```

**Requisitos:**
- Node.js 20+
- JDK 17+
- Android SDK API 34+
- Tablet Android 10" con Android 12+

### 2. Script FlyWithLua en X-Plane

1. Copiar `MODENACEAC_6XSIM_Bridge.lua` a:
   ```
   X-Plane/Resources/plugins/FlyWithLua/Scripts/
   ```

2. Descargar `dkjson.lua` y copiarlo en la misma carpeta:
   ```
   https://dkolf.de/dkjson-lua/dkjson.lua
   ```

3. Editar la línea en `MODENACEAC_6XSIM_Bridge.lua`:
   ```lua
   local TABLET_IP = "192.168.1.200"  -- ← IP de la tablet Android
   ```

4. Reiniciar X-Plane. El script se activa automáticamente.

---

## Red WiFi

Tablet y PC con X-Plane deben estar en la **misma red WiFi**.

```
Tablet Android: 192.168.1.200  (configurar en el router)
PC X-Plane:     192.168.1.100  (configurar en la app)
```

Verificar que el firewall de Windows permite UDP en los puertos 49001 y 49002.

---

## Datarefs de fallas

Prefijo: `sim/operation/failures/`
Valor: `6` = falla total · `0` = normal

| Sistema         | Dataref clave         |
|-----------------|-----------------------|
| Motor #1        | `rel_engfai0`         |
| Motor #2        | `rel_engfai1`         |
| Aceite motor    | `rel_engoilP0`        |
| MGB             | `rel_gearbox`         |
| Rotor de cola   | `rel_tail_rotor`      |
| Eje transmisión | `rel_taildriveshaft`  |
| Hidráulico N.1  | `rel_hydpmp0`         |
| Hidráulico N.2  | `rel_hydpmp1`         |
| Generador #1    | `rel_genera0`         |
| Batería         | `rel_bat_lo0`         |
| FADEC/governor  | `rel_govern0`         |
| Altímetro       | `rel_ss_alt`          |
| AHRS            | `rel_ss_ahrs`         |
| EDU 1 (IDS)     | `rel_efis_1`          |
| Piloto automático| `rel_autopilot`      |

Verificar efecto real en el modelo específico con **DataRefTool** plugin.

---

## Stack tecnológico

- React Native 0.76.5
- TypeScript 5.3
- React Navigation 6 (Bottom Tabs)
- Zustand 5 (estado global)
- react-native-udp (comunicación UDP)
- AsyncStorage (configuración persistida)
- react-native-signature-canvas (firma digital)
