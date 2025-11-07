# 🏛️ Arquitectura y Guía de Desarrollo - ValorApp_v2

## 📋 Tabla de Contenidos

1. [Visión General del Proyecto](#visión-general-del-proyecto)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Estructura de Directorios](#estructura-de-directorios)
4. [Flujo de Datos](#flujo-de-datos)
5. [Sistema de Diseño](#sistema-de-diseño)
6. [Patrones y Convenciones](#patrones-y-convenciones)
7. [Reglas de Desarrollo](#reglas-de-desarrollo)
8. [Buenas Prácticas](#buenas-prácticas)
9. [Workflows de Desarrollo](#workflows-de-desarrollo)
10. [Debugging y Troubleshooting](#debugging-y-troubleshooting)
11. [Testing](#testing)
12. [Deployment](#deployment)

---

## 🎯 Visión General del Proyecto

### Propósito

ValorApp_v2 es una **aplicación web de análisis de consumo energético** desarrollada en **React + TypeScript + Vite** que permite:

- 📊 Analizar datos de consumo energético de múltiples contadores
- 🔍 Detectar anomalías derivadas de fraudes o averías
- 📈 Visualizar comparativas mensuales y tendencias
- 📍 Identificar la factura exacta donde inicia una anomalía
- 📥 Procesar datos desde archivos CSV/JSON (sin backend)

### Características Clave

- ✅ **Sin Backend**: Todo el procesamiento se realiza en el navegador
- ✅ **Sin Base de Datos**: Datos en memoria o localStorage
- ✅ **Procesamiento Client-Side**: Rápido y privado
- ✅ **Detección Inteligente**: 5 tipos de anomalías con umbrales configurables
- ✅ **Responsive**: Diseño adaptable a móviles, tablets y desktop
- ✅ **Profesional**: Sistema de diseño corporativo estricto

### Stack Tecnológico

```json
{
  "frontend": "React 19.1.1",
  "lenguaje": "TypeScript 5.9.3",
  "bundler": "Vite 7.1.7",
  "estilos": "CSS Variables + CSS Modules",
  "estado": "React Context API",
  "visualización": "Recharts / Chart.js (futuro)",
  "validación": "Funciones puras TypeScript"
}
```

---

## 🏗️ Arquitectura del Sistema

### Decisiones Arquitectónicas Fundamentales

#### 1. ¿Por qué NO Backend?

**Contexto**: Los datos provienen de **macros de Excel** que generan archivos CSV/JSON con consumos históricos.

**Razones**:
- Los datos ya están preprocesados por las macros
- No se requiere persistencia a largo plazo
- El análisis es puntual y temporal
- Privacidad: los datos nunca salen del navegador del usuario

**Ventajas**:
- ✅ **Deployment simple**: Solo archivos estáticos (Netlify, Vercel, GitHub Pages)
- ✅ **Sin costos de servidor**: No se requiere infraestructura backend
- ✅ **Rendimiento**: Sin latencia de red, procesamiento instantáneo
- ✅ **Privacidad**: Usuario mantiene control total de sus datos sensibles
- ✅ **Escalabilidad**: El navegador del usuario es el servidor

#### 2. ¿Por qué React Context API en lugar de Redux?

- El estado es relativamente simple (consumos, anomalías, periodo seleccionado)
- No se requiere time-travel debugging
- Menor complejidad y menos boilerplate
- Context API es suficiente para las necesidades del proyecto

#### 3. ¿Por qué TypeScript?

- Validación de tipos en tiempo de desarrollo
- Autocompletado y mejor DX (Developer Experience)
- Menos errores en producción
- Documentación implícita a través de tipos

### Capas de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                   CAPA DE PRESENTACIÓN                      │
│  • components/ - Componentes UI reutilizables               │
│  • pages/ - Vistas completas de pantalla                    │
│  • App.tsx - Punto de entrada de la aplicación              │
│                                                             │
│  Responsabilidad: Renderizado, eventos de usuario, UI/UX    │
└─────────────────────────────────────────────────────────────┘
                           ↓ Props / Callbacks ↓
┌─────────────────────────────────────────────────────────────┐
│              CAPA DE LÓGICA DE APLICACIÓN                   │
│  • hooks/ - Hooks personalizados                            │
│    - useProcesarDatos()                                     │
│    - useImportarArchivos()                                  │
│    - useAnalisisCompleto()                                  │
│                                                             │
│  Responsabilidad: Orquestación de servicios, estado local   │
└─────────────────────────────────────────────────────────────┘
                           ↓ Llamadas a funciones ↓
┌─────────────────────────────────────────────────────────────┐
│               CAPA DE LÓGICA DE NEGOCIO                     │
│  • services/ - Servicios especializados                     │
│    - anomaliaService.ts (detección de fraudes)              │
│    - dataService.ts (procesamiento y agrupación)            │
│    - importService.ts (parsing CSV/JSON)                    │
│                                                             │
│  Responsabilidad: Reglas de negocio, cálculos, validaciones │
└─────────────────────────────────────────────────────────────┘
                           ↓ Funciones puras ↓
┌─────────────────────────────────────────────────────────────┐
│                   CAPA DE UTILIDADES                        │
│  • utils/ - Funciones auxiliares genéricas                  │
│    - Formateo de fechas y números                           │
│    - Cálculos estadísticos (promedio, mediana, σ)           │
│    - Validaciones                                           │
│                                                             │
│  Responsabilidad: Funciones matemáticas y de formateo       │
└─────────────────────────────────────────────────────────────┘
                           ↓ Tipos compartidos ↓
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE TIPOS                            │
│  • types/ - Definiciones TypeScript centralizadas           │
│    - ConsumoEnergetico, Anomalia, ConsumoPeriodo            │
│    - EstadisticasConsumo, ResultadoImportacion              │
│                                                             │
│  Responsabilidad: Contratos de datos en toda la aplicación  │
└─────────────────────────────────────────────────────────────┘
                           ↓ Estado compartido ↓
┌─────────────────────────────────────────────────────────────┐
│                   ESTADO GLOBAL                             │
│  • context/ - React Context API                             │
│    - AppContext (consumos, anomalías, periodo)              │
│                                                             │
│  Responsabilidad: Compartir datos entre componentes         │
└─────────────────────────────────────────────────────────────┘
```

### Principios SOLID Aplicados

1. **Single Responsibility Principle (SRP)**
   - Cada servicio tiene una responsabilidad única
   - `anomaliaService.ts` → solo detección de anomalías
   - `dataService.ts` → solo procesamiento de datos
   - `importService.ts` → solo importación de archivos

2. **Open/Closed Principle (OCP)**
   - Los servicios están abiertos a extensión pero cerrados a modificación
   - Se pueden agregar nuevos tipos de anomalías sin modificar la lógica existente

3. **Liskov Substitution Principle (LSP)**
   - Los componentes usan interfaces consistentes
   - Cualquier componente puede reemplazarse sin romper la aplicación

4. **Interface Segregation Principle (ISP)**
   - Interfaces específicas para cada necesidad
   - No se obliga a implementar métodos innecesarios

5. **Dependency Inversion Principle (DIP)**
   - Los componentes dependen de abstracciones (tipos), no de implementaciones
   - Los hooks orquestan servicios sin conocer detalles de implementación

---

## 📁 Estructura de Directorios

```
valorapp-v2/
│
├── .github/
│   └── copilot-instructions.md          # Instrucciones para agentes IA
│
├── public/                              # Archivos estáticos
│   └── vite.svg
│
├── src/
│   ├── assets/                          # Imágenes, iconos, logos
│   │   └── react.svg
│   │
│   ├── components/                      # Componentes UI reutilizables
│   │   ├── Button/
│   │   │   ├── Button.tsx               # Lógica del componente
│   │   │   ├── Button.css               # Estilos del componente
│   │   │   └── index.ts                 # Barrel export
│   │   ├── Card/
│   │   ├── Table/
│   │   ├── Chart/
│   │   └── index.ts                     # Exporta todos los componentes
│   │
│   ├── pages/                           # Vistas completas
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Dashboard.css
│   │   │   └── index.ts
│   │   ├── VistaATR/
│   │   ├── ComparativaMensual/
│   │   └── index.ts
│   │
│   ├── hooks/                           # Hooks personalizados
│   │   ├── useProcesarDatos.ts          # Procesamiento de consumos
│   │   ├── useImportarArchivos.ts       # Importación de archivos
│   │   ├── useAnalisisCompleto.ts       # Análisis completo
│   │   └── index.ts
│   │
│   ├── services/                        # Lógica de negocio
│   │   ├── anomaliaService.ts           # Detección de anomalías
│   │   ├── dataService.ts               # Procesamiento de datos
│   │   ├── importService.ts             # Importación CSV/JSON
│   │   └── index.ts
│   │
│   ├── utils/                           # Funciones auxiliares
│   │   ├── index.ts                     # Todas las utilidades
│   │   └── constants.ts                 # Constantes globales
│   │
│   ├── types/                           # Definiciones TypeScript
│   │   └── index.ts                     # Todos los tipos/interfaces
│   │
│   ├── context/                         # Estado global
│   │   ├── AppContext.tsx               # Context principal
│   │   └── index.ts
│   │
│   ├── data/                            # Datos de ejemplo/muestra
│   │   ├── ejemplo-consumos.csv
│   │   └── ejemplo-consumos.json
│   │
│   ├── styles/                          # Estilos globales/módulos
│   │   ├── variables.css                # Variables CSS (si se separan)
│   │   └── animations.css               # Animaciones
│   │
│   ├── App.tsx                          # Componente raíz
│   ├── App.css                          # Estilos del App
│   ├── main.tsx                         # Punto de entrada
│   └── index.css                        # Estilos globales + variables
│
├── .gitignore
├── eslint.config.js                     # Configuración ESLint
├── index.html                           # HTML principal
├── package.json                         # Dependencias
├── tsconfig.json                        # Configuración TypeScript
├── tsconfig.app.json                    # TS config para app
├── tsconfig.node.json                   # TS config para Node
├── vite.config.ts                       # Configuración Vite
├── README.md                            # Documentación del proyecto
└── ARCHITECTURE.md                      # Este archivo
```

### Convenciones de Nombres

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Componentes | PascalCase | `Button.tsx`, `TablaConsumos.tsx` |
| Hooks | camelCase con prefijo `use` | `useProcesarDatos.ts` |
| Servicios | camelCase con sufijo `Service` | `anomaliaService.ts` |
| Tipos/Interfaces | PascalCase | `ConsumoEnergetico`, `Anomalia` |
| Funciones | camelCase en español | `detectarAnomalias`, `calcularPromedio` |
| Variables | camelCase en español | `consumosPorPeriodo`, `anomalias` |
| Constantes | UPPER_SNAKE_CASE | `UMBRALES`, `COLOR_PRIMARY` |
| Archivos CSS | kebab-case o PascalCase | `Button.css`, `tabla-consumos.css` |

---

## 🔄 Flujo de Datos

### 1. Flujo Completo: Importación → Detección → Visualización

```typescript
// ═══════════════════════════════════════════════════════════
// PASO 1: Usuario selecciona archivo
// ═══════════════════════════════════════════════════════════
const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
  const archivo = event.target.files?.[0];
  if (!archivo) return;

  // ═══════════════════════════════════════════════════════════
  // PASO 2: Hook de importación lee y parsea
  // ═══════════════════════════════════════════════════════════
  const { importarArchivo } = useImportarArchivos();
  
  try {
    const datos = await importarArchivo(archivo);
    // → importService.importarCSV(contenido)
    // → validación de campos requeridos
    // → retorna ConsumoEnergetico[]

    // ═══════════════════════════════════════════════════════════
    // PASO 3: Hook de procesamiento limpia y agrupa
    // ═══════════════════════════════════════════════════════════
    const { procesarConsumos } = useProcesarDatos();
    procesarConsumos(datos);
    // → dataService.limpiarDatos(datos)
    // → dataService.eliminarDuplicados(datosLimpios)
    // → dataService.agruparPorPeriodo(datosSinDuplicados)
    // → retorna ConsumoPeriodo[]

    // ═══════════════════════════════════════════════════════════
    // PASO 4: Detección automática (dentro de useProcesarDatos)
    // ═══════════════════════════════════════════════════════════
    // useMemo(() => {
    //   const anomalias = anomaliaService.detectarAnomalias(consumosPorPeriodo);
    //   return anomalias;
    // }, [consumosPorPeriodo]);

    // ═══════════════════════════════════════════════════════════
    // PASO 5: Actualizar contexto global
    // ═══════════════════════════════════════════════════════════
    const { cargarConsumos, establecerAnomalias } = useAppContext();
    cargarConsumos(datos);
    establecerAnomalias(anomalias);

  } catch (error) {
    console.error('Error al importar:', error);
  }
};

// ═══════════════════════════════════════════════════════════
// PASO 6: Componentes reaccionan automáticamente
// ═══════════════════════════════════════════════════════════
const TablaAnomalias = () => {
  const { anomalias } = useAppContext();
  
  // Se re-renderiza automáticamente cuando anomalias cambia
  return (
    <table>
      {anomalias.map(a => <tr key={a.id}>...</tr>)}
    </table>
  );
};
```

### 2. Flujo de Datos en el Context

```
Usuario → Componente → Hook → Servicio → Utilidad
   ↓          ↓          ↓         ↓          ↓
   →  Event  →  State  →  Logic  →  Calc   →  Result
                  ↓
            Context API
                  ↓
      ┌─────────┴─────────┐
      ↓                   ↓
Componente A        Componente B
(actualiza)         (reacciona)
```

### 3. Detección de Anomalías - Algoritmo

```typescript
/**
 * Algoritmo de Detección de Anomalías
 * 
 * INPUT: ConsumoPeriodo[] (consumos agrupados por mes)
 * OUTPUT: Anomalia[] (anomalías detectadas)
 */

function detectarAnomalias(consumosPorPeriodo: ConsumoPeriodo[]): Anomalia[] {
  // 1. Calcular estadísticas globales
  const consumos = consumosPorPeriodo.map(c => c.consumoTotal);
  const promedio = calcularPromedio(consumos);
  const σ = calcularDesviacionEstandar(consumos);
  
  const anomalias: Anomalia[] = [];
  
  // 2. Iterar periodo por periodo
  for (let i = 1; i < consumosPorPeriodo.length; i++) {
    const actual = consumosPorPeriodo[i];
    const anterior = consumosPorPeriodo[i - 1];
    
    // 3. Calcular variación porcentual
    const variacion = ((actual.consumoTotal - anterior.consumoTotal) / anterior.consumoTotal) * 100;
    
    // 4. Aplicar umbrales y detectar
    if (variacion < -30) {
      // DESCENSO ABRUPTO (>30%)
      anomalias.push(crearAnomalia('descenso_abrupto', actual, variacion, 'alta'));
    } else if (variacion < -15) {
      // DESCENSO GRADUAL (15-30%)
      anomalias.push(crearAnomalia('descenso_gradual', actual, variacion, 'media'));
    }
    
    if (actual.consumoTotal <= 5) {
      // CONSUMO CERO (≤5 kWh)
      anomalias.push(crearAnomalia('consumo_cero', actual, -100, 'critica'));
    }
    
    if (actual.consumoTotal < 0) {
      // CONSUMO NEGATIVO (error de datos)
      anomalias.push(crearAnomalia('consumo_negativo', actual, -100, 'critica'));
    }
    
    if (actual.consumoTotal > promedio + 2 * σ) {
      // PICO ANÓMALO (> μ + 2σ)
      anomalias.push(crearAnomalia('pico_anomalo', actual, variacion, 'media'));
    }
  }
  
  // 5. Marcar primera ocurrencia de cada tipo
  marcarPrimerasOcurrencias(anomalias);
  
  return anomalias;
}
```

---

## 🎨 Sistema de Diseño

### Paleta de Colores Corporativa

```css
/* ══════════════════════════════════════════
   COLORES CORPORATIVOS (NO MODIFICAR)
   ══════════════════════════════════════════ */

:root {
  /* Colores principales */
  --color-primary: #0000D0;      /* Azul corporativo */
  --color-secondary: #FF3184;    /* Rosa vibrante */
  
  /* Tonos neutros */
  --color-white: #FFFFFF;
  --color-light-gray: #F5F5F5;
  --color-medium-gray: #D9D9D9;
  --color-dark-gray: #333333;
  
  /* Texto */
  --color-text-primary: #333333;
  --color-text-secondary: #666666;
  
  /* Estados */
  --color-success: #4CAF50;
  --color-warning: #FF9800;
  --color-error: #F44336;
  --color-info: #2196F3;
}
```

### Uso de Colores

| Elemento | Color | Variable CSS | Uso |
|----------|-------|--------------|-----|
| Botón primario | Azul #0000D0 | `var(--color-primary)` | Acciones principales |
| Botón hover | Rosa #FF3184 | `var(--color-secondary)` | Estado hover/activo |
| Encabezados | Azul #0000D0 | `var(--color-primary)` | Títulos H1-H6 |
| Enlaces | Azul #0000D0 | `var(--color-primary)` | Links de navegación |
| Acentos | Rosa #FF3184 | `var(--color-secondary)` | Resaltes, badges |
| Texto principal | Gris #333333 | `var(--color-text-primary)` | Cuerpo de texto |
| Texto secundario | Gris #666666 | `var(--color-text-secondary)` | Descripciones |

### Espaciado

```css
:root {
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
  --spacing-3xl: 4rem;     /* 64px */
}
```

### Tipografía

```css
:root {
  /* Familias */
  font-family: 'Inter', system-ui, -apple-system, Avenir, Helvetica, Arial, sans-serif;
  
  /* Tamaños */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-md: 1rem;       /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 2rem;      /* 32px */
  
  /* Pesos */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### Componentes Estándar

#### Botón

```tsx
// Variantes: primary, secondary, outline
<Button variant="primary" size="medium">
  Analizar Consumos
</Button>

// Con icono
<Button variant="secondary" size="large">
  📥 Importar CSV
</Button>
```

**Estilos**:
```css
.btn--primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.btn--primary:hover {
  background-color: var(--color-secondary);
}
```

#### Card

```tsx
<Card variant="primary" elevated>
  <h3>Anomalías Detectadas</h3>
  <p>Se encontraron 5 anomalías críticas</p>
</Card>
```

**Estilos**:
```css
.card--primary {
  border-left: 4px solid var(--color-primary);
}

.card--elevated {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

---

## 🔧 Patrones y Convenciones

### 1. Tipos Centralizados

**REGLA**: Todos los tipos deben estar en `src/types/index.ts`. **NUNCA** declarar interfaces inline.

```typescript
// ✅ CORRECTO
import type { ConsumoEnergetico, Anomalia } from '../types';

const procesarConsumos = (consumos: ConsumoEnergetico[]): Anomalia[] => {
  // ...
};

// ❌ INCORRECTO
interface MiConsumo {
  fecha: string;
  consumo: number;
}

const procesarConsumos = (consumos: MiConsumo[]) => {
  // ...
};
```

### 2. Importaciones de Tipos

**REGLA**: Usar `import type` para importaciones de solo tipo (cuando `verbatimModuleSyntax` está habilitado).

```typescript
// ✅ CORRECTO
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { ConsumoEnergetico } from '../types';

// ❌ INCORRECTO
import { useState, ReactNode } from 'react';
import { ConsumoEnergetico } from '../types';
```

### 3. Servicios como Funciones Puras

**REGLA**: Los servicios NO deben tener estado. Son funciones puras que reciben input y retornan output.

```typescript
// ✅ CORRECTO - Función pura
export const detectarAnomalias = (
  consumosPorPeriodo: ConsumoPeriodo[]
): Anomalia[] => {
  // No usa variables externas
  // No modifica el input
  // Siempre retorna el mismo output para el mismo input
  const anomalias: Anomalia[] = [];
  // ... lógica
  return anomalias;
};

// ❌ INCORRECTO - Con estado
let anomaliasDetectadas: Anomalia[] = []; // Estado global

export const detectarAnomalias = (consumos: ConsumoPeriodo[]) => {
  anomaliasDetectadas.push(...nuevasAnomalias); // Modifica estado
  return anomaliasDetectadas;
};
```

### 4. Hooks Personalizados

**REGLA**: Los hooks encapsulan lógica reutilizable y orquestan servicios.

```typescript
// ✅ CORRECTO - Hook bien estructurado
export const useProcesarDatos = (): UseProcesarDatosReturn => {
  const [consumosProcesados, setConsumosProcesados] = useState<ConsumoEnergetico[]>([]);
  
  // Cálculos derivados con useMemo
  const consumosPorPeriodo = useMemo(
    () => agruparPorPeriodo(consumosProcesados),
    [consumosProcesados]
  );
  
  const anomalias = useMemo(
    () => detectarAnomalias(consumosPorPeriodo),
    [consumosPorPeriodo]
  );
  
  // Función de procesamiento con useCallback
  const procesarConsumos = useCallback((consumos: ConsumoEnergetico[]) => {
    const limpios = limpiarDatos(consumos);
    const sinDuplicados = eliminarDuplicados(limpios);
    setConsumosProcesados(sinDuplicados);
  }, []);
  
  return {
    consumosProcesados,
    consumosPorPeriodo,
    anomalias,
    procesarConsumos
  };
};
```

### 5. Componentes

**REGLA**: Cada componente visual tiene su carpeta con `.tsx` + `.css` + `index.ts`.

```
src/components/TablaConsumos/
├── TablaConsumos.tsx      # Lógica y JSX
├── TablaConsumos.css      # Estilos (usar variables CSS)
└── index.ts               # export { TablaConsumos } from './TablaConsumos';
```

```typescript
// TablaConsumos.tsx
import type { ConsumoPeriodo } from '../../types';
import './TablaConsumos.css';

interface TablaConsumosProps {
  /** Consumos a mostrar */
  consumos: ConsumoPeriodo[];
  /** Callback al seleccionar un periodo */
  onSeleccionar?: (periodo: string) => void;
}

/**
 * Tabla para visualizar consumos por periodo
 */
export const TablaConsumos = ({ consumos, onSeleccionar }: TablaConsumosProps) => {
  return (
    <table className="tabla-consumos">
      {/* ... */}
    </table>
  );
};
```

### 6. Comentarios JSDoc

**REGLA**: Todas las funciones públicas y componentes deben tener JSDoc.

```typescript
/**
 * Detecta anomalías en una serie de consumos por periodo
 * 
 * Analiza variaciones entre periodos consecutivos y compara con
 * estadísticas globales para identificar patrones anormales.
 * 
 * @param consumosPorPeriodo - Array de consumos agrupados por periodo (YYYY-MM)
 * @returns Array de anomalías detectadas, ordenadas cronológicamente
 * 
 * @example
 * ```typescript
 * const consumos = agruparPorPeriodo(datosRaw);
 * const anomalias = detectarAnomalias(consumos);
 * console.log(`Detectadas ${anomalias.length} anomalías`);
 * ```
 */
export const detectarAnomalias = (
  consumosPorPeriodo: ConsumoPeriodo[]
): Anomalia[] => {
  // ...
};
```

### 7. Barrel Exports

**REGLA**: Usar archivos `index.ts` para exportar múltiples elementos de una carpeta.

```typescript
// src/components/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { TablaConsumos } from './TablaConsumos';
export { GraficoComparativo } from './GraficoComparativo';

// Uso en otro archivo
import { Button, Card, TablaConsumos } from '@/components';
```

### 8. Manejo de Errores

**REGLA**: Los servicios retornan objetos con estado en lugar de lanzar excepciones.

```typescript
// ✅ CORRECTO - Retornar objeto con estado
export const importarCSV = async (
  contenido: string
): Promise<ResultadoImportacion> => {
  const errores: string[] = [];
  
  try {
    // ... procesamiento
    return {
      exito: true,
      registrosImportados: datos.length,
      errores: [],
      datos
    };
  } catch (error) {
    errores.push(error instanceof Error ? error.message : 'Error desconocido');
    return {
      exito: false,
      registrosImportados: 0,
      errores,
      datos: []
    };
  }
};

// Uso en componente
const { resultado } = useImportarArchivos();
if (!resultado.exito) {
  console.error('Errores:', resultado.errores);
}
```

---

## 📜 Reglas de Desarrollo

### Reglas Obligatorias (MUST)

1. ✅ **Usar variables CSS** para colores - NUNCA hardcodear `#0000D0` o `#FF3184`
2. ✅ **Tipos en `src/types/index.ts`** - NO declarar interfaces inline
3. ✅ **Servicios son funciones puras** - Sin estado, sin efectos secundarios
4. ✅ **Importar tipos con `import type`** - Cuando sea solo tipo
5. ✅ **JSDoc en funciones públicas** - Documentar parámetros y retornos
6. ✅ **Hooks inician con `use`** - Convención de React
7. ✅ **Componentes en carpeta propia** - `.tsx` + `.css` + `index.ts`
8. ✅ **Nombres en español** - Variables, funciones (excepto términos técnicos)
9. ✅ **No usar Redux** - Solo React Context API
10. ✅ **No crear backend** - Todo client-side

### Reglas Recomendadas (SHOULD)

1. 🟡 Usar `useMemo` para cálculos pesados
2. 🟡 Usar `useCallback` para funciones pasadas como props
3. 🟡 Validar datos en servicios antes de procesar
4. 🟡 Manejar errores con objetos de estado, no excepciones
5. 🟡 Escribir tests para servicios críticos
6. 🟡 Usar lazy loading para componentes pesados
7. 🟡 Optimizar re-renders con React.memo si es necesario
8. 🟡 Mantener componentes pequeños (< 200 líneas)
9. 🟡 Separar lógica de presentación
10. 🟡 Usar constantes para valores "mágicos"

### Reglas Prohibidas (MUST NOT)

1. ❌ NO hardcodear colores fuera de variables CSS
2. ❌ NO duplicar tipos/interfaces
3. ❌ NO mezclar lógica de negocio en componentes
4. ❌ NO crear backend o APIs
5. ❌ NO usar Redux o MobX (solo Context API)
6. ❌ NO modificar directamente el estado (inmutabilidad)
7. ❌ NO usar `any` en TypeScript (usar tipos específicos)
8. ❌ NO crear servicios con estado interno
9. ❌ NO ignorar warnings de ESLint sin justificación
10. ❌ NO hacer commits sin ejecutar `npm run lint`

---

## ✨ Buenas Prácticas

### Código Limpio

```typescript
// ✅ BUENO - Nombres descriptivos
const calcularVariacionPorcentual = (anterior: number, actual: number): number => {
  return ((actual - anterior) / anterior) * 100;
};

// ❌ MALO - Nombres poco claros
const calc = (a: number, b: number): number => {
  return ((b - a) / a) * 100;
};
```

```typescript
// ✅ BUENO - Funciones pequeñas y enfocadas
const validarFecha = (fecha: string): boolean => {
  return !isNaN(new Date(fecha).getTime());
};

const validarConsumo = (consumo: number): boolean => {
  return typeof consumo === 'number' && !isNaN(consumo);
};

const validarRegistro = (registro: ConsumoEnergetico): boolean => {
  return validarFecha(registro.fecha) && validarConsumo(registro.consumo);
};

// ❌ MALO - Función monolítica
const validar = (registro: any): boolean => {
  if (registro.fecha && !isNaN(new Date(registro.fecha).getTime())) {
    if (typeof registro.consumo === 'number' && !isNaN(registro.consumo)) {
      return true;
    }
  }
  return false;
};
```

### Performance

```typescript
// ✅ BUENO - Memoización de cálculos pesados
const ComponenteConsumos = () => {
  const { consumos } = useAppContext();
  
  const estadisticas = useMemo(() => {
    return calcularEstadisticas(consumos); // Solo recalcula si consumos cambia
  }, [consumos]);
  
  return <div>{estadisticas.promedio}</div>;
};

// ❌ MALO - Cálculo en cada render
const ComponenteConsumos = () => {
  const { consumos } = useAppContext();
  const estadisticas = calcularEstadisticas(consumos); // Se ejecuta en cada render
  
  return <div>{estadisticas.promedio}</div>;
};
```

### Inmutabilidad

```typescript
// ✅ BUENO - No mutar el estado
const agregarAnomalia = (anomalias: Anomalia[], nueva: Anomalia): Anomalia[] => {
  return [...anomalias, nueva]; // Crea nuevo array
};

// ❌ MALO - Mutar el estado
const agregarAnomalia = (anomalias: Anomalia[], nueva: Anomalia): Anomalia[] => {
  anomalias.push(nueva); // Modifica array original
  return anomalias;
};
```

### Separación de Responsabilidades

```typescript
// ✅ BUENO - Lógica separada de presentación
const useDeteccionAnomalias = () => {
  const { consumos } = useAppContext();
  const anomalias = useMemo(() => detectarAnomalias(consumos), [consumos]);
  return { anomalias };
};

const ComponenteAnomalias = () => {
  const { anomalias } = useDeteccionAnomalias();
  return <TablaAnomalias anomalias={anomalias} />;
};

// ❌ MALO - Lógica mezclada en componente
const ComponenteAnomalias = () => {
  const { consumos } = useAppContext();
  const anomalias: Anomalia[] = [];
  
  // Lógica compleja dentro del componente
  consumos.forEach((consumo, i) => {
    if (i > 0) {
      const anterior = consumos[i - 1];
      const variacion = ((consumo.consumo - anterior.consumo) / anterior.consumo) * 100;
      if (variacion < -30) {
        anomalias.push({/* ... */});
      }
    }
  });
  
  return <TablaAnomalias anomalias={anomalias} />;
};
```

---

## 🔬 Workflows de Desarrollo

### Workflow 1: Agregar Nueva Funcionalidad

```bash
# 1. Definir tipos necesarios
# Editar src/types/index.ts

export interface NuevoTipoAnalisis {
  periodo: string;
  resultado: number;
  metadata: Record<string, any>;
}

# 2. Crear servicio con lógica de negocio
# Crear src/services/nuevoAnalisisService.ts

/**
 * Calcula análisis personalizado
 */
export const calcularNuevoAnalisis = (
  consumos: ConsumoEnergetico[]
): NuevoTipoAnalisis[] => {
  // Lógica pura sin efectos secundarios
  return [];
};

# 3. Crear hook que orquesta el servicio
# Crear src/hooks/useNuevoAnalisis.ts

export const useNuevoAnalisis = () => {
  const { consumos } = useAppContext();
  
  const resultado = useMemo(
    () => calcularNuevoAnalisis(consumos),
    [consumos]
  );
  
  return { resultado };
};

# 4. Crear componente de visualización
# Crear src/components/NuevoAnalisis/

NuevoAnalisis/
├── NuevoAnalisis.tsx
├── NuevoAnalisis.css
└── index.ts

# 5. Integrar en la aplicación
# Editar src/App.tsx o página correspondiente

import { NuevoAnalisis } from './components';

// ... en el JSX
<NuevoAnalisis />

# 6. Verificar
npm run lint
npm run build
```

### Workflow 2: Debugging de Anomalías

```typescript
// 1. Verificar datos crudos
console.log('📊 Datos importados:', consumos);
console.table(consumos.slice(0, 5)); // Primeros 5 registros

// 2. Verificar agrupación por periodo
const { consumosPorPeriodo } = useProcesarDatos();
console.log('📅 Agrupados por periodo:', consumosPorPeriodo);

// 3. Verificar umbrales
// En src/services/anomaliaService.ts
const UMBRALES = {
  DESCENSO_MINIMO: 15,    // ← Ajustar si detecta demasiado/poco
  DESCENSO_ABRUPTO: 30,   // ← Ajustar sensibilidad
  CONSUMO_CERO: 5,        // ← kWh mínimo
  FACTOR_DESVIACION: 2    // ← Multiplicador σ
};

// 4. Verificar anomalías detectadas
console.log('🔍 Anomalías detectadas:', anomalias);
console.log('🚨 Primera anomalía:', anomalias.find(a => a.esPrimeraOcurrencia));

// 5. Verificar estadísticas
const estadisticas = calcularEstadisticas(consumos);
console.log('📈 Estadísticas:', {
  promedio: estadisticas.promedio,
  desviacion: estadisticas.desviacionEstandar,
  min: estadisticas.minimo,
  max: estadisticas.maximo
});
```

### Workflow 3: Agregar Nueva Página

```bash
# 1. Crear estructura de carpeta
mkdir src/pages/MiNuevaPagina

# 2. Crear archivos
touch src/pages/MiNuevaPagina/MiNuevaPagina.tsx
touch src/pages/MiNuevaPagina/MiNuevaPagina.css
touch src/pages/MiNuevaPagina/index.ts

# 3. Implementar componente
# src/pages/MiNuevaPagina/MiNuevaPagina.tsx
```

```typescript
import { useAppContext } from '../../context';
import { Button } from '../../components';
import './MiNuevaPagina.css';

export const MiNuevaPagina = () => {
  const { consumos } = useAppContext();
  
  return (
    <div className="mi-nueva-pagina">
      <h1>Mi Nueva Página</h1>
      <p>Consumos cargados: {consumos.length}</p>
    </div>
  );
};
```

```bash
# 4. Exportar
# src/pages/MiNuevaPagina/index.ts
export { MiNuevaPagina } from './MiNuevaPagina';

# 5. Agregar a barrel export
# src/pages/index.ts
export { MiNuevaPagina } from './MiNuevaPagina';

# 6. Integrar en App.tsx
import { MiNuevaPagina } from './pages';
```

---

## 🐛 Debugging y Troubleshooting

### Errores Comunes y Soluciones

#### 1. "useAppContext debe usarse dentro de un AppProvider"

**Causa**: Componente no está envuelto en `<AppProvider>`.

**Solución**:
```typescript
// ✅ CORRECTO - App.tsx
import { AppProvider } from './context';

function App() {
  return (
    <AppProvider>
      <MisComponentes />
    </AppProvider>
  );
}
```

#### 2. Anomalías no se detectan

**Checklist de diagnóstico**:

```typescript
// 1. ✅ Verificar formato de fecha (ISO 8601)
console.log('Fecha válida:', esFechaValida('2024-01-15')); // true
console.log('Fecha inválida:', esFechaValida('15-01-2024')); // false

// 2. ✅ Verificar que consumos son numéricos
consumos.forEach(c => {
  if (typeof c.consumo !== 'number') {
    console.error('Consumo no numérico:', c);
  }
});

// 3. ✅ Verificar que hay al menos 2 periodos
console.log('Periodos:', consumosPorPeriodo.length); // >= 2

// 4. ✅ Verificar umbrales
const UMBRALES = {
  DESCENSO_MINIMO: 15,
  DESCENSO_ABRUPTO: 30,
  CONSUMO_CERO: 5,
  FACTOR_DESVIACION: 2
};
console.log('Umbrales actuales:', UMBRALES);
```

#### 3. Re-renders excesivos (Performance)

**Síntoma**: Aplicación lenta al cargar datos.

**Diagnóstico**:
```typescript
// Instalar React DevTools Profiler

// Verificar uso de useMemo
const ComponenteProblematico = () => {
  const { consumos } = useAppContext();
  
  // ❌ MALO - Recalcula en cada render
  const estadisticas = calcularEstadisticas(consumos);
  
  // ✅ BUENO - Solo recalcula si consumos cambia
  const estadisticas = useMemo(
    () => calcularEstadisticas(consumos),
    [consumos]
  );
};
```

#### 4. Tipos TypeScript no coinciden

**Error**: `Type 'X' is not assignable to type 'Y'`

**Solución**:
```typescript
// Verificar que usas los tipos centralizados
import type { ConsumoEnergetico } from '../types';

// No crear tipos duplicados
// ❌ INCORRECTO
interface MiConsumo { ... }

// ✅ CORRECTO - Usar tipo existente o extenderlo
import type { ConsumoEnergetico } from '../types';

interface ConsumoExtendido extends ConsumoEnergetico {
  campoAdicional: string;
}
```

#### 5. CSS no se aplica

**Causa**: Variables CSS no definidas o mal referenciadas.

**Solución**:
```css
/* ✅ CORRECTO */
.mi-componente {
  background-color: var(--color-primary);
  color: var(--color-white);
}

/* ❌ INCORRECTO */
.mi-componente {
  background-color: #0000D0; /* NO hardcodear */
  color: white; /* Usar variable */
}
```

---

## 🧪 Testing

### Estrategia de Testing

```
Prioridad de Testing:
1. 🥇 Servicios (lógica de negocio) - CRÍTICO
2. 🥈 Hooks personalizados - IMPORTANTE
3. 🥉 Componentes UI - DESEABLE
```

### Testing de Servicios (Vitest)

```typescript
// src/services/__tests__/anomaliaService.test.ts

import { describe, it, expect } from 'vitest';
import { detectarAnomalias } from '../anomaliaService';
import type { ConsumoPeriodo } from '../../types';

describe('anomaliaService', () => {
  describe('detectarAnomalias', () => {
    it('debe detectar descenso abrupto >30%', () => {
      const consumos: ConsumoPeriodo[] = [
        { periodo: '2024-01', consumoTotal: 300, consumoPromedio: 10, dias: 30 },
        { periodo: '2024-02', consumoTotal: 200, consumoPromedio: 7, dias: 28 },  // -33%
      ];

      const anomalias = detectarAnomalias(consumos);

      expect(anomalias).toHaveLength(1);
      expect(anomalias[0].tipo).toBe('descenso_abrupto');
      expect(anomalias[0].severidad).toBe('alta');
    });

    it('debe marcar la primera ocurrencia', () => {
      const consumos: ConsumoPeriodo[] = [
        { periodo: '2024-01', consumoTotal: 300, consumoPromedio: 10, dias: 30 },
        { periodo: '2024-02', consumoTotal: 200, consumoPromedio: 7, dias: 28 },
        { periodo: '2024-03', consumoTotal: 100, consumoPromedio: 3, dias: 31 },
      ];

      const anomalias = detectarAnomalias(consumos);
      const primeraOcurrencia = anomalias.find(a => a.esPrimeraOcurrencia);

      expect(primeraOcurrencia).toBeDefined();
      expect(primeraOcurrencia?.periodo).toBe('2024-02');
    });
  });
});
```

### Testing de Hooks (React Testing Library)

```typescript
// src/hooks/__tests__/useProcesarDatos.test.ts

import { renderHook, act } from '@testing-library/react';
import { useProcesarDatos } from '../useProcesarDatos';
import type { ConsumoEnergetico } from '../../types';

describe('useProcesarDatos', () => {
  it('debe procesar y agrupar consumos', () => {
    const { result } = renderHook(() => useProcesarDatos());

    const consumos: ConsumoEnergetico[] = [
      {
        id: '1',
        fecha: '2024-01-15',
        consumo: 100,
        periodo: '2024-01',
        numeroContador: 'CTR001'
      },
      {
        id: '2',
        fecha: '2024-01-20',
        consumo: 120,
        periodo: '2024-01',
        numeroContador: 'CTR001'
      }
    ];

    act(() => {
      result.current.procesarConsumos(consumos);
    });

    expect(result.current.consumosPorPeriodo).toHaveLength(1);
    expect(result.current.consumosPorPeriodo[0].consumoTotal).toBe(220);
  });
});
```

---

## 🚀 Deployment

### Build para Producción

```bash
# 1. Verificar que no hay errores de lint
npm run lint

# 2. Compilar TypeScript y construir
npm run build

# 3. Previsualizar build localmente
npm run preview

# 4. Verificar que la aplicación funciona correctamente
# Abrir http://localhost:4173
```

### Deployment en Netlify

```bash
# 1. Conectar repositorio a Netlify

# 2. Configurar build settings:
Build command: npm run build
Publish directory: dist

# 3. Variables de entorno (si aplica)
# Ninguna necesaria por ahora

# 4. Deploy
# Netlify automáticamente hace deploy en cada push
```

### Deployment en Vercel

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Deploy a producción
vercel --prod
```

### Deployment en GitHub Pages

```bash
# 1. Instalar gh-pages
npm install --save-dev gh-pages

# 2. Agregar scripts a package.json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}

# 3. Configurar base en vite.config.ts
export default defineConfig({
  base: '/valorapp-v2/',
  // ...
});

# 4. Deploy
npm run deploy
```

---

## 📚 Recursos y Referencias

### Documentación Oficial

- [React 19 Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [MDN Web Docs](https://developer.mozilla.org/)

### Librerías Recomendadas

```bash
# Visualización de gráficos
npm install recharts
npm install chart.js react-chartjs-2

# Manipulación de fechas
npm install date-fns

# Exportación a Excel
npm install xlsx

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### Herramientas de Desarrollo

- **ESLint**: Linting de código
- **TypeScript**: Type checking
- **React DevTools**: Debugging de componentes
- **Vite DevTools**: Performance y bundle analysis

---

## 🔄 Versionado y Git

### Estrategia de Branches

```
main              → Producción (siempre estable)
  ↑
develop           → Desarrollo (integración)
  ↑
feature/nombre    → Nuevas funcionalidades
hotfix/nombre     → Correcciones urgentes
```

### Commits Semánticos

```bash
feat: Agregar detección de picos anómalos
fix: Corregir cálculo de variación porcentual
docs: Actualizar ARCHITECTURE.md
style: Aplicar formato de código con Prettier
refactor: Extraer lógica de validación a servicio
test: Agregar tests para anomaliaService
chore: Actualizar dependencias
```

### .gitignore

```
# Dependencias
node_modules/

# Build
dist/
dist-ssr/

# Logs
*.log
npm-debug.log*

# Editor
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Env
.env
.env.local
```

---

## 📝 Conclusión

Este documento es la **fuente de verdad** para la arquitectura y desarrollo de ValorApp_v2. Debe actualizarse cuando:

- Se agregan nuevas convenciones
- Se cambian decisiones arquitectónicas
- Se integran nuevas librerías o herramientas
- Se descubren nuevos patrones o anti-patrones

**Manténlo actualizado** para que sea útil para todo el equipo y agentes IA.

---

**Última actualización**: 6 de noviembre de 2025  
**Versión**: 1.0.0  
**Autor**: Equipo ValorApp
