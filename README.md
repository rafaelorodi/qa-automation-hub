# 🧪 QA Automation Hub

Framework de automatización de pruebas para Raspberry Pi con GitHub Actions.

## 📁 Estructura del Proyecto

```
qa-automation-hub/
├── tests-playwright/          # Pruebas Playwright
│   ├── HU001_Login/          # Historia de Usuario 1: Login
│   ├── HU002_Products/       # Historia de Usuario 2: Productos
│   └── HU003_Orders/         # Historia de Usuario 3: Pedidos
├── tests-karate/             # Pruebas API con Karate
│   ├── HU001_Login/
│   ├── HU002_Products/
│   └── HU003_Orders/
├── tests-postman/            # Colecciones Postman
├── tests-jmeter/             # Pruebas de rendimiento
├── playwright.config.ts      # Configuración Playwright
├── .env.test                 # Variables de entorno
└── run-tests.js              # Script para ejecutar pruebas
```

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Verificar conectividad a Raspberry Pi
```bash
ping 192.168.18.9
```

### 3. Ejecutar pruebas locales

#### Todas las pruebas de una HU
```bash
# Solo HU001 en Playwright
npm run test:local:hu001

# Solo HU001 en Karate
npm run test:karate:hu001

# Todas las HUs en Playwright
npm run test:playwright

# Todas las HUs en Karate
npm run test:karate
```

#### Usando el script auxiliar
```bash
# HU001 en Playwright
node run-tests.js hu001 playwright

# Todas en todos los frameworks
node run-tests.js all all

# Solo HU002 en Karate
node run-tests.js hu002 karate
```

## 🔧 Configuración

### .env.test
Archivo para configurar qué HUs ejecutar:
```env
RUN_PLAYWRIGHT_HUS=HU001,HU002
RUN_KARATE_HUS=HU001
```

### playwright.config.ts
```typescript
// Desarrollo local
baseURL: 'http://localhost:5173',

// Raspberry Pi (para GitHub Actions)
baseURL: 'http://192.168.18.9:5173',
```

## 📊 GitHub Actions

### Ejecución manual con selección de HUs

1. Ve a **Actions** en tu repositorio
2. Selecciona **"QA Tests - Selectable HUs"**
3. Haz clic en **"Run workflow"**
4. Elige qué HUs ejecutar:
   - `HU001` (Login)
   - `HU001,HU002` (Login y Productos)
   - `HU001,HU002,HU003` (Todas)

### Ejecución automática en push
Automáticamente ejecuta `HU001` cuando hagas push a `main` o `develop`.

## 📝 Crear una Nueva Historia de Usuario

1. Crea carpetas en Playwright y Karate:
   ```
   tests-playwright/HU004_NewFeature/
   tests-karate/HU004_NewFeature/
   ```

2. Agrega tus archivos de prueba
3. Añade un script en `package.json`:
   ```json
   "test:local:hu004": "playwright test tests-playwright/HU004_NewFeature"
   ```

## 🧬 Reporting

### Allure Reports
Los reportes se generan automáticamente en:
- Local: `allure-results/`
- GitHub Actions: Se descargan como artefactos

Ver reporte local:
```bash
npx allure serve allure-results
```

## ✅ Checklist Antes de Commit

- [ ] Ejecuté `npm run test:local:hu00X` en mi HU
- [ ] Todos los tests pasaron localmente
- [ ] Verifiqué conectividad a Raspberry Pi
- [ ] Actualicé `.env.test` si cambié URLs

## 🐛 Troubleshooting

### No puedo conectar a la Raspberry Pi
```bash
ping 192.168.18.9
# Si no responde, verifica que esté en la misma red WiFi
```

### Playwright tests no encuentran elementos
- Verifica que la web esté corriendo en `http://localhost:5173` o `http://192.168.18.9:5173`
- Revisa el `baseURL` en `playwright.config.ts`

### Karate tests fallan con 401
- Verifica que el backend está corriendo en `http://localhost:8001`
- Revisa las credenciales en `smoke-test.feature`
