# MODENACEAC 6XSIM — Guía de instalación del APK

## Requisitos de la PC de compilación

| Herramienta | Versión mínima | Descarga |
|-------------|----------------|----------|
| Node.js     | 18 LTS         | https://nodejs.org |
| JDK         | 17 (OpenJDK)   | https://adoptium.net |
| Android SDK | API 34         | Via Android Studio |
| Android Studio | Hedgehog+   | https://developer.android.com/studio |

---

## Paso 1 — Instalar Android Studio y SDK

1. Descargar e instalar [Android Studio](https://developer.android.com/studio)
2. Al abrir Android Studio → **More Actions → SDK Manager**
3. En **SDK Platforms**: instalar **Android 14.0 (API 34)**
4. En **SDK Tools**: instalar:
   - Android SDK Build-Tools 34
   - Android SDK Platform-Tools
   - Android Emulator (opcional)
   - NDK 26.1.10909125

5. Configurar variables de entorno:

**Windows** (agregar a variables de usuario):
```
ANDROID_HOME = C:\Users\TU_USUARIO\AppData\Local\Android\Sdk
Path += %ANDROID_HOME%\platform-tools
Path += %ANDROID_HOME%\tools
```

**Linux/macOS** (agregar a `~/.bashrc` o `~/.zshrc`):
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

---

## Paso 2 — Preparar la tablet Android

1. En la tablet: **Configuración → Acerca del dispositivo**
2. Tocar **Número de compilación** 7 veces → activa modo desarrollador
3. Ir a **Configuración → Opciones de desarrollador**:
   - Activar **Depuración USB**
   - Activar **Instalación vía USB** (si aparece)
4. Conectar la tablet a la PC por USB
5. En la tablet: confirmar el cuadro de diálogo de confianza

Verificar que la tablet es reconocida:
```bash
adb devices
# Debe mostrar: XXXXXXXX  device
```

---

## Paso 3 — Compilar e instalar (método rápido)

### Windows
```cmd
cd 6xsim-android
build_apk.bat
```

### Linux / macOS
```bash
cd 6xsim-android
chmod +x build_apk.sh
./build_apk.sh
```

El script:
1. Verifica prerrequisitos
2. Instala dependencias npm
3. Genera keystore de debug automáticamente
4. Compila el APK
5. Si la tablet está conectada, lo instala automáticamente

---

## Paso 4 — Instalación manual del APK (alternativa)

Si preferís transferir el APK directamente a la tablet:

1. Compilar:
```bash
npm install
cd android && ./gradlew assembleDebug && cd ..
```

2. El APK queda en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

3. Copiar el APK a la tablet por USB o compartirlo por red WiFi

4. En la tablet: abrir el archivo APK con el **Explorador de archivos**
   - Si aparece "Fuentes desconocidas": ir a Configuración → Seguridad → Permitir fuentes desconocidas

---

## Paso 5 — Build Release (distribución interna)

Para generar un APK firmado y optimizado:

```bash
./build_release.sh
```

El script genera:
- `android/keystores/release.keystore` (¡hacer backup!)
- `dist/MODENACEAC_6XSIM_v4.0_YYYYMMDD.apk`

**IMPORTANTE**: Guardar el archivo `release.keystore` en lugar seguro.
Sin él no se pueden instalar actualizaciones sobre la misma app.

---

## Configuración de red WiFi

La tablet y el PC con X-Plane deben estar en la **misma red WiFi**.

```
Tablet Android:  192.168.1.200  (asignar IP fija en router)
PC X-Plane:      192.168.1.100  (configurar en la app)
```

**En Windows**: verificar que el Firewall permite UDP en puertos 49001 y 49002:
```cmd
netsh advfirewall firewall add rule name="6XSIM UDP" ^
  dir=in action=allow protocol=UDP localport=49001-49002
```

---

## Instalación de FlyWithLua Bridge en X-Plane

1. Instalar el plugin **FlyWithLua** en X-Plane:
   - Descargar: https://forums.x-plane.org/index.php?/files/file/38445-flywithlua-ng-next-generation-edition-for-x-plane-11-and-12/
   - Copiar carpeta `FlyWithLua` en `X-Plane/Resources/plugins/`

2. Descargar **dkjson.lua**:
   - https://dkolf.de/dkjson-lua/dkjson.lua
   - Copiar en `X-Plane/Resources/plugins/FlyWithLua/Scripts/`

3. Copiar el script bridge:
   - `MODENACEAC_6XSIM_Bridge.lua` → `X-Plane/Resources/plugins/FlyWithLua/Scripts/`

4. Editar la IP de la tablet en el script:
   ```lua
   local TABLET_IP = "192.168.1.200"  -- ← IP de la tablet
   ```

5. Reiniciar X-Plane → el script se carga automáticamente

---

## Verificar la conexión

1. Abrir la app en la tablet
2. Ir a la pestaña **Config**
3. Configurar la IP del PC con X-Plane
4. Tocar **Aplicar configuración**
5. El indicador de conexión debe ponerse verde: `● X-Plane conectado`

---

## Solución de problemas frecuentes

| Problema | Solución |
|----------|----------|
| `adb devices` no muestra la tablet | Habilitar Depuración USB · probar otro cable · instalar driver ADB del fabricante |
| Build falla con "SDK not found" | Verificar `ANDROID_HOME` apunta al SDK correcto |
| Build falla con "NDK not found" | Instalar NDK 26.1.10909125 desde SDK Manager |
| App se cierra al abrir | Verificar `adb logcat` para ver el error específico |
| UDP no conecta | Verificar misma red WiFi · firewall · IP correcta en Config |
| FlyWithLua no carga | Verificar que `dkjson.lua` está en la misma carpeta |
| Fallas no aplican en X-Plane | Verificar datarefs con DataRefTool plugin |

---

## Estructura del APK generado

```
MODENACEAC_6XSIM_v4.0.apk
├── com.modenaceac.sixsim      (package ID)
├── Pantalla 1: Config          (aeronave · IP · ICAO · hora · meteo · piloto)
├── Pantalla 2: Fallas          (77 fallas AW109 · 26 fallas R44 · toggles)
├── Pantalla 3: Sesión          (cronómetro · telemetría UDP en tiempo real)
├── Pantalla 4: Maniobras       (9-11 maniobras · evaluación AS/S/SB/NA)
└── Pantalla 5: Reporte         (resumen · firma digital · cierre de sesión)
```

---

*MODENACEAC · Departamento 6XSIM · v4.0 · Abril 2026*
