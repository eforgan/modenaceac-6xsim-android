#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  MODENACEAC 6XSIM — Script de build APK (Linux / macOS)
#  Ejecutar desde la raíz del proyecto: ./build_apk.sh
# ═══════════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; GOLD='\033[0;33m'; NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       MODENACEAC 6XSIM — Build APK Android              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Verificar prerrequisitos ──────────────────────────────────────────
echo -e "${GOLD}[1/6] Verificando prerrequisitos...${NC}"

command -v node >/dev/null 2>&1 || { echo -e "${RED}ERROR: Node.js no instalado${NC}"; exit 1; }
command -v java >/dev/null 2>&1 || { echo -e "${RED}ERROR: Java no instalado (requiere JDK 17+)${NC}"; exit 1; }
command -v keytool >/dev/null 2>&1 || { echo -e "${RED}ERROR: keytool no encontrado (instalar JDK)${NC}"; exit 1; }

[ -z "$ANDROID_HOME" ] && { echo -e "${RED}ERROR: ANDROID_HOME no configurado${NC}"; echo "Exportar: export ANDROID_HOME=~/Android/Sdk"; exit 1; }

echo -e "      Node: $(node --version) ${GREEN}OK${NC}"
echo -e "      Java: $(java -version 2>&1 | head -1) ${GREEN}OK${NC}"
echo -e "      ANDROID_HOME: $ANDROID_HOME ${GREEN}OK${NC}"

# ── Instalar dependencias ─────────────────────────────────────────────
echo -e "\n${GOLD}[2/6] Instalando dependencias npm...${NC}"
npm install
echo -e "${GREEN}      npm install OK${NC}"

# ── Generar keystore si no existe ────────────────────────────────────
echo -e "\n${GOLD}[3/6] Verificando keystore de debug...${NC}"
if [ ! -f "android/app/debug.keystore" ]; then
    echo "      Generando debug.keystore..."
    keytool -genkeypair \
        -alias androiddebugkey \
        -keypass android \
        -keystore android/app/debug.keystore \
        -storepass android \
        -dname "CN=MODENACEAC 6XSIM, OU=Simuladores, O=MODENACEAC, L=Buenos Aires, ST=Buenos Aires, C=AR" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000
    echo -e "${GREEN}      debug.keystore generado OK${NC}"
else
    echo -e "${GREEN}      debug.keystore ya existe OK${NC}"
fi

# ── Limpiar build anterior ────────────────────────────────────────────
echo -e "\n${GOLD}[4/6] Limpiando build anterior...${NC}"
cd android
chmod +x gradlew
./gradlew clean
cd ..
echo -e "${GREEN}      Clean OK${NC}"

# ── Build APK Debug ──────────────────────────────────────────────────
echo -e "\n${GOLD}[5/6] Compilando APK debug...${NC}"
cd android
./gradlew assembleDebug --stacktrace 2>&1 | tail -20
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
[ ! -f "$APK_PATH" ] && { echo -e "${RED}ERROR: APK no generado${NC}"; cd ..; exit 1; }
APK_SIZE=$(du -sh "$APK_PATH" | cut -f1)
cd ..
echo -e "${GREEN}      Build OK — Tamaño: $APK_SIZE${NC}"

# ── Resultado ─────────────────────────────────────────────────────────
APK_FULL="android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  [6/6] APK generado exitosamente!                        ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║  Ubicación: $APK_FULL${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║  Para instalar en la tablet por USB:                      ║${NC}"
echo -e "${GREEN}║    adb install -r $APK_FULL                               ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║  O copiar el APK a la tablet y abrir con el explorador    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Instalar si hay tablet conectada ─────────────────────────────────
if command -v adb >/dev/null 2>&1; then
    DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l)
    if [ "$DEVICES" -gt 0 ]; then
        echo -e "${BLUE}Tablet detectada. Instalando APK...${NC}"
        adb install -r "$APK_FULL"
        echo -e "${GREEN}APK instalado. Buscar 'MODENACEAC 6XSIM' en el launcher.${NC}"
        # Lanzar la app automáticamente
        adb shell am start -n "com.modenaceac.sixsim.debug/com.modenaceac.sixsim.MainActivity"
    else
        echo "Para instalar: conectar la tablet por USB con depuración USB habilitada."
    fi
fi
