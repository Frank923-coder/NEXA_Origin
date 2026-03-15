#!/bin/bash
#
# Script de Verificación de Seguridad
# Uso: ./check-security.sh
#
# Verifica que la aplicación cumpla con requisitos mínimos de seguridad
#

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

VULNERABILITIES=0
WARNINGS=0
SUCCESS=0

echo "🔍 Iniciando verificación de seguridad..."
echo "=================================================="
echo ""

# ============================================================
# 1. Verificar que no hay credenciales en código fuente
# ============================================================
echo "📋 Verificando credenciales en código fuente..."

if grep -r "password\s*=\s*['\"]" src/ --include="*.properties" --include="*.yml" 2>/dev/null | \
   grep -v "^\s*#" | grep -v "\${" > /dev/null; then
    echo -e "${RED}✗ CRÍTICA: Credenciales encontradas en código${NC}"
    grep -r "password\s*=" src/ --include="*.properties" --include="*.yml" | grep -v "^\s*#" | grep -v "\${"
    VULNERABILITIES=$((VULNERABILITIES + 1))
else
    echo -e "${GREEN}✓ No hay credenciales hardcodeadas${NC}"
    SUCCESS=$((SUCCESS + 1))
fi

# ============================================================
# 2. Verificar JWT Secret
# ============================================================
echo ""
echo "🔐 Verificando JWT Secret..."

if grep -r "jwt.secret" src/main/resources/application.properties 2>/dev/null | \
   grep -v "\${" | grep -v "^\s*#" > /dev/null; then
    SECRET=$(grep "jwt.secret" src/main/resources/application.properties | grep -v "\${" | cut -d= -f2)
    if [ ${#SECRET} -lt 32 ]; then
        echo -e "${RED}✗ CRÍTICA: JWT Secret muy corto (${#SECRET} caracteres, mínimo 32 requerido)${NC}"
        VULNERABILITIES=$((VULNERABILITIES + 1))
    else
        echo -e "${YELLOW}⚠ JWT Secret encontrado en properties (debería estar en env var)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${GREEN}✓ JWT Secret externalizado correctamente${NC}"
    SUCCESS=$((SUCCESS + 1))
fi

# ============================================================
# 3. Verificar SSL en BD
# ============================================================
echo ""
echo "🔒 Verificando SSL en conexión a BD..."

if grep -r "useSSL\s*=\s*false" src/main/resources/application*.properties 2>/dev/null > /dev/null; then
    echo -e "${RED}✗ CRÍTICA: SSL deshabilitado en conexión a BD${NC}"
    VULNERABILITIES=$((VULNERABILITIES + 1))
else
    echo -e "${GREEN}✓ SSL habilitado en BD${NC}"
    SUCCESS=$((SUCCESS + 1))
fi

# ============================================================
# 4. Verificar Logging de Seguridad
# ============================================================
echo ""
echo "📝 Verificando niveles de logging..."

if grep "logging.level.*TRACE\|logging.level.*DEBUG.*true" src/main/resources/application.properties > /dev/null; then
    echo -e "${YELLOW}⚠ Logging de DEBUG detectado (revisar en producción)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ Niveles de logging configurados correctamente${NC}"
    SUCCESS=$((SUCCESS + 1))
fi

# ============================================================
# 5. Verificar System.out.println de debug
# ============================================================
echo ""
echo "🐛 Verificando System.out.println() inseguro..."

DEBUG_COUNT=$(grep -r "System.out.println" src/main/java --include="*.java" 2>/dev/null | \
             grep -i "token\|password\|secret\|debug\|auth" | wc -l)

if [ $DEBUG_COUNT -gt 0 ]; then
    echo -e "${RED}✗ CRÍTICA: $DEBUG_COUNT instancias de System.out.println con datos sensibles${NC}"
    grep -r "System.out.println" src/main/java --include="*.java" | \
    grep -i "token\|password\|secret\|debug\|auth" | head -5
    VULNERABILITIES=$((VULNERABILITIES + 1))
else
    echo -e "${GREEN}✓ No hay System.out.println con datos sensibles${NC}"
    SUCCESS=$((SUCCESS + 1))
fi

# ============================================================
# 6. Verificar .env en .gitignore
# ============================================================
echo ""
echo "🚫 Verificando .env está en .gitignore..."

if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore && grep -q "application-prod" .gitignore; then
        echo -e "${GREEN}✓ .env y application-prod.properties en .gitignore${NC}"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${RED}✗ CRÍTICA: .env o application-prod.properties NO está en .gitignore${NC}"
        VULNERABILITIES=$((VULNERABILITIES + 1))
    fi
else
    echo -e "${RED}✗ CRÍTICA: .gitignore no existe${NC}"
    VULNERABILITIES=$((VULNERABILITIES + 1))
fi

# ============================================================
# 7. Verificar dependencias vulnerables (si está disponible)
# ============================================================
echo ""
echo "📦 Verificando dependencias vulnerables..."

if command -v mvn &> /dev/null; then
    # Intentar obtener lista de dependencias
    if mvn dependency:tree -DoutputFile=/tmp/deps.txt 2>/dev/null; then
        echo -e "${GREEN}✓ Maven disponible para análisis${NC}"
        WARNINGS=$((WARNINGS + 1))
        echo "  Ejecutar: mvn dependency-check:check"
    fi
else
    echo -e "${YELLOW}⚠ Maven no disponible (necesario para scanning)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# ============================================================
# 8. Verificar certificado SSL (si existe)
# ============================================================
echo ""
echo "🎫 Verificando certificado SSL..."

if [ -f "${SSL_KEYSTORE_PATH:-.}/tomcat.p12" ]; then
    if keytool -list -v -keystore "${SSL_KEYSTORE_PATH:-.}/tomcat.p12" \
               -storepass "${SSL_KEYSTORE_PASSWORD:-pass}" 2>/dev/null | \
               grep -q "Owner:"; then
        echo -e "${GREEN}✓ Certificado SSL disponible${NC}"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${YELLOW}⚠ Certificado SSL encontrado pero no se pudo validar${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠ Certificado SSL no encontrado (requerido para HTTPS)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# ============================================================
# 9. Verificar permisos de archivos sensibles
# ============================================================
echo ""
echo "🔐 Verificando permisos de archivos sensibles..."

if [ -f ".env.local" ]; then
    PERMS=$(stat -c "%a" .env.local 2>/dev/null || stat -f "%OLp" .env.local 2>/dev/null)
    if [ "$PERMS" = "600" ] || [ "$PERMS" = "0600" ]; then
        echo -e "${GREEN}✓ .env.local con permisos 600 (seguro)${NC}"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${RED}✗ CRÍTICA: .env.local con permisos inseguros (actual: $PERMS, debe ser 600)${NC}"
        echo "  Ejecutar: chmod 600 .env.local"
        VULNERABILITIES=$((VULNERABILITIES + 1))
    fi
fi

# ============================================================
# 10. Verificar variables de entorno requeridas
# ============================================================
echo ""
echo "🌍 Verificando variables de entorno..."

REQUIRED_VARS=("DB_USERNAME" "DB_PASSWORD" "JWT_SECRET")
MISSING_VARS=0

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${YELLOW}⚠ Variable de entorno $var no configurada${NC}"
        MISSING_VARS=$((MISSING_VARS + 1))
    fi
done

if [ $MISSING_VARS -eq 0 ]; then
    echo -e "${GREEN}✓ Variables de entorno configuradas${NC}"
    SUCCESS=$((SUCCESS + 1))
else
    echo -e "${YELLOW}⚠ $MISSING_VARS variable(s) de entorno faltante(s)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# ============================================================
# Resumen Final
# ============================================================
echo ""
echo "=================================================="
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "=================================================="
echo -e "${GREEN}✓ Pasadas:${NC} $SUCCESS"
echo -e "${YELLOW}⚠ Advertencias:${NC} $WARNINGS"
echo -e "${RED}✗ Vulnerabilidades:${NC} $VULNERABILITIES"
echo ""

if [ $VULNERABILITIES -eq 0 ]; then
    echo -e "${GREEN}✅ LISTO PARA PRODUCCIÓN${NC}"
    exit 0
elif [ $VULNERABILITIES -lt 3 ]; then
    echo -e "${YELLOW}⚠️  REVISAR ADVERTENCIAS ANTES DE PRODUCCIÓN${NC}"
    exit 1
else
    echo -e "${RED}❌ VULNERABILIDADES CRÍTICAS ENCONTRADAS - NO LISTO PARA PRODUCCIÓN${NC}"
    exit 2
fi
