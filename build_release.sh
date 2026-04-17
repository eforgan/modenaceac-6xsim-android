#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  MODENACEAC 6XSIM — Build APK RELEASE firmado
#  Genera APK optimizado listo para distribución interna
# ═══════════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; GOLD='\033[0;33m'; NC='\033[0m'

KEYSTORE_PATH="android/keystores/release.keystore"
KEYSTORE_ALIAS="modenaceac6xsim"
PROPS_FILE="android/keystores/signing.properties"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    MODENACEAC 6XSIM — Build RELEASE APK                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Generar keystore de release si no existe ─────────────────────────
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo -e "${GOLD}Generando keystore de release...${NC}"
    mkdir -p android/keystores

    echo "Contraseña para el keystore de release (guardar en lugar seguro):"
    read -s STORE_PASS
    echo "Confirmar contraseña:"
    read -s STORE_PASS2
    [ "$STORE_PASS" != "$STORE_PASS2" ] && { echo -e "${RED}Las contraseñas no coinciden${NC}"; exit 1; }

    keytool -genkeypair \
        -alias "$KEYSTORE_ALIAS" \
        -keypass "$STORE_PASS" \
        -keystore "$KEYSTORE_PATH" \
        -storepass "$STORE_PASS" \
        -dname "CN=MODENACEAC 6XSIM, OU=Simuladores de Vuelo, O=MODENACEAC, L=Buenos Aires, ST=Buenos Aires, C=AR" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 36500

    # Guardar propiedades (NO subir a git)
    cat > "$PROPS_FILE" << EOF
MODENACEAC_RELEASE_STORE_FILE=keystores/release.keystore
MODENACEAC_RELEASE_KEY_ALIAS=$KEYSTORE_ALIAS
MODENACEAC_RELEASE_STORE_PASSWORD=$STORE_PASS
MODENACEAC_RELEASE_KEY_PASSWORD=$STORE_PASS
EOF
    echo -e "${GREEN}Keystore generado en $KEYSTORE_PATH${NC}"
    echo -e "${RED}IMPORTANTE: Hacer backup del keystore. Sin él no se puede actualizar la app.${NC}"
fi

# ── Cargar propiedades de firma ───────────────────────────────────────
if [ -f "$PROPS_FILE" ]; then
    export $(grep -v '^#' "$PROPS_FILE" | xargs)
fi

# ── Instalar dependencias ─────────────────────────────────────────────
echo -e "\n${GOLD}Instalando dependencias...${NC}"
npm install

# ── Build release ─────────────────────────────────────────────────────
echo -e "\n${GOLD}Compilando APK release...${NC}"
cd android
./gradlew assembleRelease \
    -PMODENACEAC_RELEASE_STORE_FILE="$MODENACEAC_RELEASE_STORE_FILE" \
    -PMODENACEAC_RELEASE_KEY_ALIAS="$MODENACEAC_RELEASE_KEY_ALIAS" \
    -PMODENACEAC_RELEASE_STORE_PASSWORD="$MODENACEAC_RELEASE_STORE_PASSWORD" \
    -PMODENACEAC_RELEASE_KEY_PASSWORD="$MODENACEAC_RELEASE_KEY_PASSWORD"
cd ..

APK="android/app/build/outputs/apk/release/app-release.apk"
APK_UNIVERSAL="android/app/build/outputs/apk/release/app-universal-release.apk"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  APK Release generado!                                   ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║  APK arm64:     $APK${NC}"
echo -e "${GREEN}║  APK universal: $APK_UNIVERSAL${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║  Instalar en tablet:                                      ║${NC}"
echo -e "${GREEN}║    adb install -r $APK_UNIVERSAL${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Copiar APK a carpeta de salida cómoda ────────────────────────────
mkdir -p dist
cp "$APK_UNIVERSAL" "dist/MODENACEAC_6XSIM_v4.0_$(date +%Y%m%d).apk"
echo -e "${BLUE}APK copiado a: dist/MODENACEAC_6XSIM_v4.0_$(date +%Y%m%d).apk${NC}"
