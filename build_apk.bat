@echo off
REM ═══════════════════════════════════════════════════════════════════
REM  MODENACEAC 6XSIM — Script de build APK (Windows)
REM  Ejecutar desde la raíz del proyecto: build_apk.bat
REM ═══════════════════════════════════════════════════════════════════

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║       MODENACEAC 6XSIM — Build APK Android              ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM ── Verificar prerrequisitos ────────────────────────────────────────
echo [1/6] Verificando prerrequisitos...

where node >nul 2>&1 || (echo ERROR: Node.js no instalado & exit /b 1)
where java >nul 2>&1 || (echo ERROR: Java no instalado & exit /b 1)
echo       Node: OK
echo       Java: OK

REM ── Instalar dependencias ───────────────────────────────────────────
echo [2/6] Instalando dependencias npm...
call npm install
if %ERRORLEVEL% neq 0 (echo ERROR: npm install falló & exit /b 1)

REM ── Generar keystore si no existe ──────────────────────────────────
echo [3/6] Verificando keystore de debug...
if not exist "android\app\debug.keystore" (
    echo       Generando debug.keystore...
    keytool -genkeypair ^
        -alias androiddebugkey ^
        -keypass android ^
        -keystore android\app\debug.keystore ^
        -storepass android ^
        -dname "CN=MODENACEAC 6XSIM, OU=Simuladores, O=MODENACEAC, L=Buenos Aires, ST=Buenos Aires, C=AR" ^
        -keyalg RSA ^
        -keysize 2048 ^
        -validity 10000
    echo       debug.keystore generado OK
) else (
    echo       debug.keystore ya existe OK
)

REM ── Limpiar build anterior ──────────────────────────────────────────
echo [4/6] Limpiando build anterior...
cd android
call gradlew.bat clean
cd ..

REM ── Build APK Debug ────────────────────────────────────────────────
echo [5/6] Compilando APK debug...
cd android
call gradlew.bat assembleDebug --stacktrace
if %ERRORLEVEL% neq 0 (
    echo ERROR: Build falló. Ver log arriba.
    cd ..
    exit /b 1
)
cd ..

REM ── Resultado ──────────────────────────────────────────────────────
echo [6/6] Build completado!
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  APK generado en:                                        ║
echo ║  android\app\build\outputs\apk\debug\                   ║
echo ║  app-debug.apk                                           ║
echo ║                                                          ║
echo ║  Para instalar en la tablet:                             ║
echo ║  adb install android\app\build\outputs\apk\debug\app-debug.apk
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM ── Instalar en tablet si está conectada ──────────────────────────
where adb >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Tablet detectada. Instalando APK...
    adb install -r android\app\build\outputs\apk\debug\app-debug.apk
    echo APK instalado! Buscar MODENACEAC 6XSIM en el launcher.
) else (
    echo ADB no encontrado. Instalar manualmente el APK en la tablet.
)

pause
