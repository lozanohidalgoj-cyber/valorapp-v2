# ValorApp_v2 - Instrucciones para Agentes IA

## 🎯 Propósito del Proyecto

ValorApp_v2 es una aplicación React+TypeScript+Vite para **análisis de consumo energético y detección de anomalías** (fraudes/averías en contadores). **NO usa backend ni base de datos** - todos los datos se procesan en memoria desde archivos CSV/JSON.

## 🏗️ Arquitectura y Flujo de Datos

### Estructura de Directorios (Obligatoria)

```
src/
├── types/          → Definiciones TypeScript centralizadas
├── utils/          → Funciones puras (cálculos, formateo, validación)
├── services/       → Lógica de negocio (anomaliaService, dataService, importService)
├── hooks/          → Hooks personalizados (useProcesarDatos, useImportarArchivos)
├── context/        → AppContext para estado global (React Context API)
├── components/     → Componentes UI reutilizables
├── pages/          → Vistas completas de pantalla
├── data/           → Archivos de ejemplo/muestra
└── styles/         → Archivos CSS específicos
```

### Flujo de Datos Principal

1. **Importación**: `importService.ts` lee CSV/JSON → valida → retorna `ConsumoEnergetico[]`
2. **Procesamiento**: `dataService.ts` agrupa por periodo → limpia → calcula estadísticas
3. **Detección**: `anomaliaService.ts` analiza tendencias → detecta anomalías → marca primera ocurrencia
4. **Estado Global**: `AppContext` almacena consumos, anomalías, periodo seleccionado
5. **Visualización**: Componentes consumen contexto → muestran gráficos/tablas

## 🎨 Sistema de Diseño (CRÍTICO)

### Colores Corporativos (NO modificar)

```css
--color-primary: #0000d0 /* Azul - botones, encabezados, énfasis */ --color-secondary: #ff3184
  /* Rosa - acentos, hover, interactivos */;
```

**Regla**: Usa `var(--color-primary)` y `var(--color-secondary)` en todos los estilos. Nunca hardcodear colores.

### Convenciones de Componentes

- **Componentes visuales**: Carpeta propia con `Component.tsx` + `Component.css`
- **Props**: Siempre usar interfaces TypeScript con JSDoc
- **Exportación**: Usar barrel exports (`index.ts` en cada carpeta)

Ejemplo real del proyecto:

```tsx
// src/components/Button/Button.tsx
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  // ...
}
```

## 🔧 Patrones de Código Específicos

### 1. Tipos Centralizados

Todos los tipos están en `src/types/index.ts`. **NUNCA** declarar interfaces inline fuera de este archivo.

```typescript
// ✅ CORRECTO - usar tipos del archivo centralizado
import type { ConsumoEnergetico, Anomalia } from '../types';

// ❌ INCORRECTO - no declarar tipos duplicados
interface MyConsumo { ... }
```

### 2. Servicios son Funciones Puras

Los servicios en `src/services/` exportan funciones puras sin estado:

```typescript
// Ejemplo real de anomaliaService.ts
export const detectarAnomalias = (consumosPorPeriodo: ConsumoPeriodo[]): Anomalia[] => {
  // Lógica sin efectos secundarios
};
```

### 3. Hooks Personalizados Encapsulan Lógica

```typescript
// src/hooks/useProcesarDatos.ts
export const useProcesarDatos = () => {
  // Combina múltiples servicios
  const consumosPorPeriodo = useMemo(() => agruparPorPeriodo(...), []);
  const anomalias = useMemo(() => detectarAnomalias(...), []);
  // ...
};
```

### 4. Context para Estado Global (NO Redux)

```typescript
// Acceso al estado global siempre vía hook
const { consumos, anomalias, cargarConsumos } = useAppContext();
```

## 📊 Lógica de Negocio Clave

### Detección de Anomalías (anomaliaService.ts)

**Umbrales configurados** (líneas 15-21):

- Descenso mínimo: 15%
- Descenso abrupto: 30%
- Consumo cero: ≤5 kWh
- Pico anómalo: > promedio + 2×desviación estándar

**Tipos de anomalías detectadas**:

1. `descenso_abrupto` - caída >30% periodo-a-periodo
2. `descenso_gradual` - caída 15-30%
3. `consumo_cero` - lectura ≤5 kWh
4. `consumo_negativo` - valores <0 (error de datos)
5. `pico_anomalo` - consumo excesivamente alto

### Agrupación por Periodo (dataService.ts)

- Usa `obtenerPeriodo()` de utils para convertir fechas a "YYYY-MM"
- Calcula `consumoTotal` y `consumoPromedio` por mes
- Ordena cronológicamente antes de retornar

## 🛠️ Comandos de Desarrollo

```bash
npm run dev      # Desarrollo con HMR en http://localhost:5173
npm run build    # Compilar TypeScript + Vite build
npm run preview  # Preview de producción
npm run lint     # ESLint con reglas TypeScript
```

## 📝 Convenciones de Código

### Comentarios JSDoc Obligatorios

```typescript
/**
 * Detecta anomalías en una serie de consumos por periodo
 * @param consumosPorPeriodo - Array de consumos agrupados por periodo
 * @returns Array de anomalías detectadas
 */
export const detectarAnomalias = (consumosPorPeriodo: ConsumoPeriodo[]): Anomalia[] => {
  // ...
};
```

### Nombres en Español

- Variables/funciones/tipos: español descriptivo (`consumosPorPeriodo`, `detectarAnomalias`)
- Excepción: términos técnicos en inglés (`useMemo`, `useCallback`)

### Importaciones de Tipos

```typescript
// ✅ CORRECTO - import type separado
import type { ReactNode } from 'react';
import { createContext } from 'react';

// ❌ INCORRECTO - mezclar tipos y valores
import { createContext, ReactNode } from 'react';
```

## 🔍 Debugging y Validación

### Validación de Datos Importados

`importService.ts` valida automáticamente:

- Fechas válidas (ISO 8601)
- Consumo numérico válido
- Número de contador presente

Retorna `ResultadoImportacion` con `exito`, `errores[]`, `advertencias[]`.

### Limpieza de Datos

`dataService.ts` elimina:

- Registros sin campos requeridos
- Fechas inválidas
- Consumos NaN/undefined
- Duplicados (misma fecha + contador)

## 🚫 Anti-Patrones a Evitar

1. **NO crear backend/API** - todo se procesa client-side
2. **NO usar Redux** - solo React Context API
3. **NO hardcodear colores** - siempre usar variables CSS
4. **NO duplicar tipos** - usar `src/types/index.ts`
5. **NO mezclar lógica de negocio en componentes** - usar services/hooks

## 📚 Archivos de Referencia Clave

- `src/types/index.ts` - Todas las interfaces TypeScript
- `src/services/anomaliaService.ts` - Lógica de detección de anomalías
- `src/services/dataService.ts` - Procesamiento y agrupación de datos
- `src/utils/index.ts` - Funciones auxiliares (cálculos estadísticos)
- `src/context/AppContext.tsx` - Estado global de la aplicación
- `src/index.css` - Variables CSS y sistema de diseño

## 🎯 Principios de Desarrollo

- **SOLID**: Separación clara de responsabilidades
- **DRY**: Reutilizar componentes y funciones
- **KISS**: Soluciones simples y directas
- **Optimización**: Usar `useMemo`/`useCallback` para cálculos pesados

---

## 📐 Detalles de Arquitectura y Decisiones de Diseño

### Por qué NO Backend/Base de Datos

**Decisión arquitectónica**: Los datos provienen de **macros de Excel** que generan CSV/JSON. El procesamiento es puntual y no requiere persistencia. Mantener todo client-side:

- ✅ Simplifica deployment (solo archivos estáticos)
- ✅ Elimina necesidad de servidor/infraestructura
- ✅ Procesamiento instantáneo sin latencia de red
- ✅ Usuario mantiene control total de sus datos

### Separación de Responsabilidades (Capas)

```
┌─────────────────────────────────────────┐
│  PRESENTACIÓN (components/, pages/)     │  ← Solo renderizado y eventos UI
├─────────────────────────────────────────┤
│  LÓGICA DE APLICACIÓN (hooks/)          │  ← Orquestación de servicios + estado
├─────────────────────────────────────────┤
│  LÓGICA DE NEGOCIO (services/)          │  ← Reglas de negocio puras
├─────────────────────────────────────────┤
│  UTILIDADES (utils/)                    │  ← Funciones matemáticas genéricas
├─────────────────────────────────────────┤
│  ESTADO GLOBAL (context/)               │  ← Compartir datos entre componentes
└─────────────────────────────────────────┘
```

### Flujo Completo de Importación y Detección

```typescript
// 1. Usuario selecciona archivo CSV/JSON
const archivo = event.target.files[0];

// 2. Hook lee y parsea el archivo
const { importarArchivo } = useImportarArchivos();
const datos = await importarArchivo(archivo);
// → importService.importarCSV() → validación → ConsumoEnergetico[]

// 3. Hook procesa datos
const { procesarConsumos } = useProcesarDatos();
procesarConsumos(datos);
// → dataService.limpiarDatos()
// → dataService.eliminarDuplicados()
// → dataService.agruparPorPeriodo() → ConsumoPeriodo[]

// 4. Detección automática (useMemo)
// → anomaliaService.detectarAnomalias(consumosPorPeriodo) → Anomalia[]

// 5. Actualizar contexto global
const { cargarConsumos, establecerAnomalias } = useAppContext();
cargarConsumos(datos);
establecerAnomalias(anomalias);

// 6. Componentes reaccionan automáticamente a cambios de contexto
```

---

## 🔬 Workflows Críticos de Desarrollo

### Workflow 1: Crear un Nuevo Servicio de Análisis

```bash
# 1. Definir tipos en src/types/index.ts
export interface MiNuevoAnalisis {
  periodo: string;
  resultado: number;
}

# 2. Crear servicio en src/services/miAnalisisService.ts
export const calcularMiAnalisis = (consumos: ConsumoEnergetico[]): MiNuevoAnalisis[] => {
  // Lógica pura, sin efectos secundarios
};

# 3. Crear hook en src/hooks/useMiAnalisis.ts
export const useMiAnalisis = () => {
  const { consumos } = useAppContext();
  const resultado = useMemo(() => calcularMiAnalisis(consumos), [consumos]);
  return { resultado };
};

# 4. Usar en componente
const { resultado } = useMiAnalisis();
```

### Workflow 2: Agregar Nueva Página/Vista

```bash
# 1. Crear carpeta src/pages/MiVista/
mkdir src/pages/MiVista

# 2. Crear MiVista.tsx + MiVista.css
# MiVista.tsx debe:
# - Importar tipos de src/types
# - Consumir hooks personalizados (NO lógica inline)
# - Usar componentes de src/components
# - Usar variables CSS del sistema de diseño

# 3. Exportar en src/pages/index.ts
export { MiVista } from './MiVista/MiVista';

# 4. Integrar en App.tsx o router
```

### Workflow 3: Debugging de Anomalías

```typescript
// Revisar umbrales en src/services/anomaliaService.ts líneas 15-21
const UMBRALES = {
  DESCENSO_MINIMO: 15, // Ajustar si detecta demasiado/poco
  DESCENSO_ABRUPTO: 30, // Ajustar sensibilidad
  CONSUMO_CERO: 5, // kWh mínimo para considerar "cero"
  FACTOR_DESVIACION: 2, // Multiplicador σ para picos
};

// Ver datos procesados en consola
console.log('Consumos agrupados:', consumosPorPeriodo);
console.log('Anomalías:', anomalias);
console.log(
  'Primera anomalía:',
  anomalias.find((a) => a.esPrimeraOcurrencia)
);
```

---

## 🧩 Patrones de Integración entre Componentes

### Comunicación Padre-Hijo (Props)

```typescript
// Padre pasa datos y callbacks
<TablaConsumos
  consumos={consumosPorPeriodo}
  onSeleccionar={handleSeleccion}
/>

// Hijo define interface estricta
interface TablaConsumosProps {
  consumos: ConsumoPeriodo[];
  onSeleccionar: (periodo: string) => void;
}
```

### Comunicación entre Componentes Distantes (Context)

```typescript
// Componente A actualiza contexto
const { cargarConsumos } = useAppContext();
cargarConsumos(nuevosDatos);

// Componente B (en otro árbol) reacciona automáticamente
const { consumos } = useAppContext();
useEffect(() => {
  // Se ejecuta cuando consumos cambia
}, [consumos]);
```

### Composición de Hooks

```typescript
// Hook compuesto que orquesta múltiples servicios
export const useAnalisisCompleto = () => {
  const { consumos } = useAppContext();
  const { consumosPorPeriodo, anomalias } = useProcesarDatos();
  const estadisticas = useMemo(() => calcularEstadisticas(consumos), [consumos]);

  return {
    consumosPorPeriodo,
    anomalias,
    estadisticas,
    primeraAnomalia: anomalias.find((a) => a.esPrimeraOcurrencia),
  };
};
```

---

## 📊 Formato de Datos CSV Esperado

```csv
fecha,consumo,numeroContador,cliente,periodo
2024-01-15,245.5,CTR001,Cliente A,2024-01
2024-02-15,238.2,CTR001,Cliente A,2024-02
2024-03-15,89.1,CTR001,Cliente A,2024-03
```

**Campos requeridos**: `fecha`, `consumo`, `numeroContador`  
**Campos opcionales**: `cliente`, `periodo` (se calcula automáticamente si falta)  
**Validación**: Ver `src/services/importService.ts` función `validarConsumo()`

---

## 🎨 Extender Sistema de Diseño

### Agregar Nueva Variable CSS

```css
/* src/index.css - Agregar en sección :root */
--color-warning: #ff9800; /* Para alertas nivel medio */
--spacing-3xl: 4rem; /* Para secciones grandes */
```

### Crear Nuevo Componente Visual

```bash
# Estructura obligatoria
src/components/MiComponente/
├── MiComponente.tsx          # Lógica + JSX
├── MiComponente.css          # Estilos (usar variables CSS)
└── index.ts                  # export { MiComponente } from './MiComponente';

# Exportar en src/components/index.ts
export { MiComponente } from './MiComponente';
```

**Ejemplo real - Card Component**:

```typescript
// src/components/Card/Card.tsx
interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary';
  elevated?: boolean;
}

export const Card = ({ children, variant = 'default', elevated = false }: CardProps) => {
  return (
    <div className={`card card--${variant} ${elevated ? 'card--elevated' : ''}`}>
      {children}
    </div>
  );
};
```

```css
/* src/components/Card/Card.css */
.card {
  background: var(--color-white);
  border-radius: 8px;
  padding: var(--spacing-lg);
}

.card--primary {
  border-left: 4px solid var(--color-primary);
}

.card--elevated {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

---

## 🐛 Debugging y Troubleshooting

### Error: "useAppContext debe usarse dentro de un AppProvider"

**Causa**: Componente no está envuelto en `<AppProvider>`  
**Solución**: Verificar que `App.tsx` tenga la estructura:

```typescript
<AppProvider>
  <MisComponentes />
</AppProvider>
```

### Error: Anomalías no se detectan

**Checklist de diagnóstico**:

1. ✅ ¿Los datos tienen formato de fecha válido? (ISO 8601: "2024-01-15")
2. ✅ ¿Los consumos son numéricos? (no strings)
3. ✅ ¿Hay al menos 2 periodos? (necesario para comparación)
4. ✅ ¿Los umbrales en `anomaliaService.ts` son apropiados para tus datos?

```typescript
// Debug en consola
const { consumosPorPeriodo, anomalias } = useProcesarDatos();
console.table(consumosPorPeriodo); // Ver datos agrupados
console.log('Anomalías:', anomalias.length);
```

### Performance: Re-renders excesivos

**Síntoma**: Aplicación lenta al cargar muchos datos  
**Solución**: Verificar que estés usando `useMemo` y `useCallback`:

```typescript
// ✅ CORRECTO
const anomalias = useMemo(() => detectarAnomalias(consumosPorPeriodo), [consumosPorPeriodo]);

// ❌ INCORRECTO - recalcula en cada render
const anomalias = detectarAnomalias(consumosPorPeriodo);
```

---

## 📦 Dependencias Externas

### Dependencias Actuales

```json
{
  "react": "^19.1.1", // Framework UI
  "react-dom": "^19.1.1", // Renderizado DOM
  "typescript": "~5.9.3", // Type checking
  "vite": "^7.1.7" // Bundler + dev server
}
```

### Librerías Recomendadas para Futura Integración

```bash
# Visualización de gráficos (cuando se necesite)
npm install recharts              # Gráficos React nativos
# o
npm install chart.js react-chartjs-2

# Fechas (si se necesita manipulación compleja)
npm install date-fns              # Ligero y modular

# Exportación a Excel (opcional)
npm install xlsx                  # Leer/escribir Excel
```

**IMPORTANTE**: Al agregar dependencias, actualizar esta sección de instrucciones.

---

## 🔐 Manejo de Errores Estandarizado

### En Servicios (Funciones Puras)

```typescript
// NO lanzar excepciones - retornar objetos con estado
export const importarCSV = async (contenido: string): Promise<ResultadoImportacion> => {
  const errores: string[] = [];

  try {
    // ... procesamiento
    return { exito: true, registrosImportados: n, errores: [], datos };
  } catch (error) {
    errores.push(error.message);
    return { exito: false, registrosImportados: 0, errores, datos: [] };
  }
};
```

### En Hooks

```typescript
export const useImportarArchivos = () => {
  const [error, setError] = useState<string | null>(null);

  const importar = async (archivo: File) => {
    try {
      const resultado = await importarCSV(contenido);
      if (!resultado.exito) {
        setError(resultado.errores.join(', '));
      }
      return resultado.datos;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
};
```

### En Componentes

```typescript
const { error, importarArchivo } = useImportarArchivos();

return (
  <>
    {error && <div className="error-message">{error}</div>}
    <input type="file" onChange={handleChange} />
  </>
);
```

---

## 📝 Checklist de Pull Request / Revisión de Código

Antes de considerar una funcionalidad completa:

- [ ] **Tipos**: ¿Definidos en `src/types/index.ts`?
- [ ] **Servicios**: ¿Son funciones puras sin efectos secundarios?
- [ ] **Hooks**: ¿Usan `useMemo`/`useCallback` apropiadamente?
- [ ] **Componentes**: ¿Tienen carpeta propia con `.tsx` + `.css`?
- [ ] **Colores**: ¿Usan variables CSS (NO hardcoded)?
- [ ] **JSDoc**: ¿Funciones públicas documentadas?
- [ ] **Imports**: ¿Tipos importados con `import type`?
- [ ] **Lint**: ¿`npm run lint` pasa sin errores?
- [ ] **Build**: ¿`npm run build` compila correctamente?

---

## 🚀 Roadmap de Características Futuras

Características planificadas (no implementar hasta que se solicite):

1. **Visualización de gráficos** - Recharts/Chart.js para comparativas mensuales
2. **Exportación de reportes** - PDF/Excel con análisis de anomalías
3. **Filtros avanzados** - Por fecha, cliente, nivel de severidad
4. **Comparativas múltiples** - Comparar múltiples contadores simultáneamente
5. **Predicciones** - ML básico para estimar consumos futuros
6. **Temas visuales** - Dark mode manteniendo paleta corporativa

**Nota**: Mantener la arquitectura flexible para estas integraciones futuras.

---

## Reglas de Desarrollo y Mejores Pr�cticas Modernas

### Limpieza y Refactorizaci�n

#### C�digo Duplicado

- **NUNCA** duplicar l�gica. Extraer a utilidades, hooks o servicios.
- Si un fragmento se repite 2+ veces, refactorizar inmediatamente.
- Usar barrel exports (index.ts) para centralizar importaciones.

#### Tama�o de Componentes

- **M�ximo 200 l�neas** por componente. Si excede, dividir en subcomponentes.
- Separar l�gica compleja en hooks personalizados.
- UI presentation vs. logic containers.

#### Logging y Debugging

- **PROHIBIDO** usar console.log, console.error, console.warn en c�digo de producci�n.
- Usar el servicio loggerService centralizado para todos los logs.
- Eliminar todos los debugger statements.
- Comentarios deben explicar "por qu�", no "qu�" (el c�digo ya lo muestra).

#### Imports

- Ordenar alfab�ticamente: React Externos Internos Tipos Estilos.
- Usar import type para tipos TypeScript.
- Preferir imports nombrados sobre default exports.
- Usar barrel exports para simplificar rutas.

` ypescript
// CORRECTO
import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { useAnalisis } from '../../../hooks';
import type { ConsumoEnergetico } from '../../../types';
import './Component.css';

// INCORRECTO - imports desordenados
import './Component.css';
import type { ConsumoEnergetico } from '../../../types';
import { format } from 'date-fns';
import { useAnalisis } from '../../../hooks';
import { useState, useCallback } from 'react';
