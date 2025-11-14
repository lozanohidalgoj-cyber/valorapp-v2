# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

# 📊 ValorApp_v2

**Aplicación de análisis de consumo energético y detección de anomalías**

ValorApp_v2 es una herramienta desarrollada en **React + TypeScript + Vite** diseñada para **analizar consumos energéticos, detectar anomalías derivadas de fraudes o averías en contadores**, y determinar en qué factura inicia una anomalía.

---

## 🎯 Propósito

Esta aplicación procesa **datos de consumo energético previamente cargados desde macros en Excel** (archivos CSV/JSON) y realiza:

- ✅ **Análisis comparativo** de consumos mensuales
- ✅ **Detección de descensos anormales** en el consumo
- ✅ **Identificación de la factura inicial** donde comienza la anomalía
- ✅ **Visualización clara y profesional** mediante gráficos interactivos
- ✅ **Cálculos estadísticos** y proyecciones

**No requiere backend ni base de datos**: todos los datos se procesan en memoria o mediante archivos locales.

---

## 🧱 Arquitectura del Proyecto

La estructura sigue principios de **separación de responsabilidades** para mantener el código escalable, modular y mantenible:

```
src/
│
├── components/       → Componentes reutilizables (gráficos, tablas, botones, etc.)
├── pages/            → Pantallas principales (Vista previa ATR, Comparativa mensual, etc.)
├── hooks/            → Hooks personalizados (gestión de estado, cálculos, efectos)
├── utils/            → Funciones auxiliares y cálculos matemáticos
├── data/             → Archivos de muestra o importación temporal (JSON, CSV)
├── services/         → Módulos que procesan o limpian datos
├── context/          → Contextos globales para estado compartido
├── styles/           → Archivos CSS o módulos de estilo
└── App.tsx           → Punto de entrada principal
```

---

## 🎨 Paleta de Colores Corporativa

Los colores oficiales del proyecto deben respetarse en toda la interfaz:

| Color                | Código HEX | Uso                                                        |
| -------------------- | ---------- | ---------------------------------------------------------- |
| **Azul Corporativo** | `#0000D0`  | Encabezados, botones principales, enlaces activos, énfasis |
| **Rosa Vibrante**    | `#FF3184`  | Acentos, resaltes, elementos interactivos, hover           |
| **Blanco**           | `#FFFFFF`  | Fondos, tarjetas, contenedores                             |
| **Gris Claro**       | `#F5F5F5`  | Fondo general de la aplicación                             |
| **Gris Medio**       | `#D9D9D9`  | Bordes, separadores                                        |
| **Gris Oscuro**      | `#333333`  | Texto principal                                            |

---

## ⚙️ Tecnologías Utilizadas

- **React 19** con **TypeScript**
- **Vite** como bundler y servidor de desarrollo
- **CSS Variables** para sistema de diseño
- **Recharts** o **Chart.js** para visualizaciones (a integrar según necesidad)
- **React Context API** para gestión de estado global

---

## 🚀 Instalación y Uso

### Prerrequisitos

- **Node.js** versión 18+
- **npm** o **yarn**

### Instalación

```bash
# Clonar el repositorio (si aplica)
git clone <url-del-repositorio>

# Navegar al directorio
cd valorapp-v2

# Instalar dependencias
npm install
```

### Comandos Disponibles

```bash
# Modo desarrollo con hot reload
npm run dev

# Compilar proyecto para producción
npm run build

# Previsualizar build de producción
npm run preview

# Ejecutar linter
npm run lint

# Corregir errores de linter automáticamente
npm run lint:fix

# Formatear código con Prettier
npm run format

# Verificar formato sin modificar archivos
npm run format:check

# Type checking sin compilar
npm run type-check

# Validación completa (type-check + lint + format)
npm run validate
```

---

## 🎯 Path Aliases Configurados

Para mejorar la legibilidad y mantenibilidad del código, el proyecto usa **path aliases**:

```typescript
import { Button } from '@components/Button';
import { useAppContext } from '@context';
import { detectarAnomalias } from '@services/anomaliaService';
import type { ConsumoEnergetico } from '@types';
```

**Aliases disponibles**:

- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@pages/*` → `src/pages/*`
- `@services/*` → `src/services/*`
- `@utils/*` → `src/utils/*`
- `@hooks/*` → `src/hooks/*`
- `@types` → `src/types/index.ts`
- `@constants/*` → `src/constants/*`
- `@context/*` → `src/context/*`
- `@styles/*` → `src/styles/*`

---

## 📂 Módulos Implementados

### 🔹 Componentes (`/components`)

Componentes reutilizables como botones, tarjetas, gráficos y tablas.

### 🔹 Páginas (`/pages`)

Vistas completas de la aplicación (ej: Dashboard, Vista ATR, Comparativa Mensual).

### 🔹 Hooks (`/hooks`)

Lógica personalizada y reutilizable para manejo de estado y efectos.

### 🔹 Utilidades (`/utils`)

Funciones auxiliares para cálculos matemáticos, formateo de datos, validaciones.

### 🔹 Servicios (`/services`)

Procesamiento y limpieza de datos importados (CSV/JSON).

### 🔹 Contextos (`/context`)

Gestión global del estado de la aplicación mediante React Context.

### 🔹 Datos (`/data`)

Archivos de ejemplo o plantillas para carga de datos.

---

## 🧩 Principios de Desarrollo

- **SOLID**: Diseño orientado a responsabilidades únicas
- **DRY**: No repetir código, maximizar reutilización
- **KISS**: Mantener soluciones simples y directas
- **Código limpio**: Nombres descriptivos, estructura clara, comentarios JSDoc
- **Optimización**: Uso de `useMemo`, `useCallback` y lazy loading

---

## 📊 Funcionalidades Clave

1. **Carga de datos**: Importación de archivos CSV/JSON con datos de consumo energético
2. **Análisis comparativo**: Comparación mensual de consumos
3. **Detección de anomalías**: Identificación automática de descensos anormales
4. **Visualización interactiva**: Gráficos y tablas con información clara
5. **Determinación de factura inicial**: Identificación del momento donde comienza la anomalía

---

## 🧪 Testing (Próximamente)

Se recomienda integrar:

- **Vitest** para pruebas unitarias
- **React Testing Library** para pruebas de componentes

---

## 📝 Licencia

_Especificar licencia del proyecto si aplica._

---

## 👥 Contribuciones

Este proyecto sigue una arquitectura clara y documentada. Para contribuir:

1. Respetar la estructura de carpetas
2. Usar la paleta de colores corporativa
3. Seguir los principios de código limpio
4. Documentar funciones complejas con JSDoc
5. Mantener consistencia en nombres y estilos

---

## 📧 Contacto

_Información de contacto del equipo o desarrollador principal._

---

**ValorApp_v2** - Análisis energético profesional y confiable 🔋⚡

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
