# 📘 Análisis Exhaustivo del Proyecto: ValorApp_v2

**Fecha:** 13 de noviembre de 2025  
**Versión del Proyecto:** 2.0  
**Stack Tecnológico:** React 19.1.1 + TypeScript 5.9.3 + Vite 7.1.7  
**Autor del Análisis:** GitHub Copilot (GPT-5-Codex)

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Objetivos y Alcance](#2-objetivos-y-alcance)
3. [Arquitectura por Capas](#3-arquitectura-por-capas)
4. [Estructura de Directorios](#4-estructura-de-directorios)
5. [Modelado de Tipos](#5-modelado-de-tipos)
6. [Servicios - Lógica de Negocio](#6-servicios---lógica-de-negocio)
7. [Hooks Personalizados](#7-hooks-personalizados)
8. [Contexto Global](#8-contexto-global)
9. [Páginas y Componentes](#9-páginas-y-componentes)
10. [Utilidades (Utils)](#10-utilidades-utils)
11. [Reglas de Negocio Críticas](#11-reglas-de-negocio-críticas)
12. [Sistema de Diseño y Variables CSS](#12-sistema-de-diseño-y-variables-css)
13. [Convenciones de Código](#13-convenciones-de-código)
14. [Dependencias y Herramientas](#14-dependencias-y-herramientas)
15. [Workflows Completos](#15-workflows-completos)
16. [Formatos de Datos](#16-formatos-de-datos)
17. [Performance y Optimización](#17-performance-y-optimizacion)
18. [Testing y Validación](#18-testing-y-validación)
19. [Deployment y Build](#19-deployment-y-build)
20. [Antipatrones y Mejores Prácticas](#20-antipatrones-y-mejores-prácticas)
21. [Roadmap y Mejoras Futuras](#21-roadmap-y-mejoras-futuras)
22. [Referencias y Documentación](#22-referencias-y-documentación)

---

## 1. Resumen Ejecutivo

### 1.1 Descripción General

ValorApp_v2 es una **aplicación web empresarial** desarrollada con React + TypeScript + Vite, especializada en el **análisis avanzado de consumos energéticos** y la **detección inteligente de anomalías** (fraudes, averías en contadores eléctricos). El sistema opera completamente **client-side**, procesando archivos CSV/JSON generados por macros de Excel del SCE (Sistema Central de Energía).

### 1.2 Propósito del Negocio

El proyecto moderniza la funcionalidad de dos macros Excel críticas, eliminando la dependencia de VBA y proporcionando:

- ✅ Interfaz web responsive
- ✅ Procesamiento instantáneo en el navegador
- ✅ Visualizaciones interactivas (tablas, gráficos, mapa de calor)
- ✅ Detección automática del inicio de anomalías
- ✅ Exportación a CSV, JSON y Excel
- ✅ Persistencia local sin backend

### 1.3 Usuarios Objetivo

- Analistas de energía eléctrica
- Inspectores de fraude
- Técnicos de mantenimiento
- Gestores de expedientes

### 1.4 Valor Diferencial

- **Sin infraestructura**: despliegue como estático
- **Privacidad**: sin envío de datos sensibles
- **Velocidad**: cero latencia de red
- **Escalabilidad**: el navegador es el runtime
- **Portabilidad**: funciona offline tras cargar

---

## 2. Objetivos y Alcance

### 2.1 Objetivos Funcionales

- Importar datos (CSV, JSON, Derivación, Saldo ATR)
- Limpiar, normalizar y agrupar consumos
- Detectar anomalías y su inicio exacto
- Clasificar expedientes con nivel de confianza
- Visualizar datos en múltiples vistas (tabla, gráfico, heatmap)
- Exportar resultados (CSV/JSON/XLSX)
- Persistir sesión en `localStorage`

### 2.2 Objetivos No Funcionales

- Performance: procesamiento < 500ms para 1000 registros
- Usabilidad: responsive + accesible
- Mantenibilidad: tipos centralizados, servicios puros
- Seguridad: validación estricta, sin fuga de datos

### 2.3 Fuera de Alcance

- Backend/API, bases de datos, autenticación, comunicación en tiempo real

---

## 3. Arquitectura por Capas

```
Presentación (components/, pages/)
    ↓
Lógica de Aplicación (hooks/)
    ↓
Lógica de Negocio (services/)
    ↓
Utilidades (utils/)
    ↓
Tipos Centralizados (types/)
    ↓
Estado Global (context/)
```

- **Presentación**: renderizar UI, manejar eventos
- **Hooks**: orquestar servicios, memoizar resultados
- **Servicios**: reglas de negocio puras, sin efectos secundarios
- **Utilidades**: cálculos, formateo, helpers
- **Tipos**: contratos compartidos
- **Contexto**: estado global (consumos, anomalías, flags)

Referencias: `src/App.tsx`, `src/context/AppContext.tsx`, `ARCHITECTURE.md`.

---

## 4. Estructura de Directorios

```
src/
├── assets/            # Imágenes, iconos
├── components/        # UI reusable (Button, HeatMap, Banner...)
├── pages/             # Vistas (Home, Averia, Wart, ExpedienteTipoV, SaldoATR)
├── hooks/             # useProcesarDatos, useImportarArchivos, etc.
├── services/          # Lógica de negocio (anomalias, análisis, import, export)
├── utils/             # Funciones auxiliares
├── types/             # Tipos TypeScript centralizados
├── context/           # AppContext (estado global)
├── constants/         # Configuración, rutas, diseño
├── data/              # CSV/plantillas
├── styles/            # CSS global y específicos
└── main.tsx, App.tsx  # Entradas de React
```

Documentación complementaria:

- `ARCHITECTURE.md`
- `UI-README.md`
- `docs/ANALISIS_COMPLETO_VBA.md`

---

## 5. Modelado de Tipos (src/types/index.ts - 513 líneas)

### 5.1 Datos de Consumo Base

#### ConsumoEnergetico

```typescript
interface ConsumoEnergetico {
  /** Identificador único del registro */
  id: string;
  /** Fecha de la lectura (formato ISO 8601: YYYY-MM-DD) */
  fecha: string;
  /** Consumo en kWh */
  consumo: number;
  /** Periodo de facturación (formato: YYYY-MM) */
  periodo: string;
  /** Número de contador (identificador único del medidor) */
  numeroContador: string;
  /** Cliente o contrato asociado (opcional) */
  cliente?: string;
}
```

**Uso:** Representa cada registro individual importado desde CSV/JSON.

**Validaciones requeridas:**

- `fecha`: debe ser ISO 8601 válida o formato DD/MM/YYYY convertible
- `consumo`: número positivo o cero (negativos marcan error)
- `numeroContador`: no vacío
- `periodo`: calculado automáticamente si falta (formato YYYY-MM)

#### ConsumoPeriodo

```typescript
interface ConsumoPeriodo {
  /** Periodo en formato YYYY-MM */
  periodo: string;
  /** Consumo total del periodo en kWh */
  consumoTotal: number;
  /** Consumo promedio diario */
  consumoPromedio: number;
  /** Número de días del periodo */
  dias: number;
}
```

**Cálculo:** Resultado de `dataService.agruparPorPeriodo()` que suma consumos por mes.

### 5.2 Anomalías

#### TipoAnomalia

```typescript
type TipoAnomalia =
  | 'descenso_abrupto' // Descenso repentino >30%
  | 'descenso_gradual' // Descenso progresivo 15-30%
  | 'consumo_cero' // Consumo nulo o casi nulo ≤5 kWh
  | 'consumo_negativo' // Valores negativos (error de datos)
  | 'pico_anomalo'; // Incremento inusual >promedio+2σ
```

#### Anomalia (completa)

```typescript
interface Anomalia {
  /** ID único de la anomalía */
  id: string;
  /** Tipo de anomalía detectada */
  tipo: TipoAnomalia;
  /** Periodo donde se detectó (YYYY-MM) */
  periodo: string;
  /** Fecha exacta de detección (timestamp ISO) */
  fechaDeteccion: string;
  /** Nivel de severidad */
  severidad: NivelSeveridad;
  /** Porcentaje de variación respecto al promedio */
  variacionPorcentaje: number;
  /** Consumo esperado en kWh (baseline o promedio) */
  consumoEsperado: number;
  /** Consumo real en kWh */
  consumoReal: number;
  /** Descripción detallada generada automáticamente */
  descripcion: string;
  /** Marca si es la primera anomalía de este tipo en la serie */
  esPrimeraOcurrencia: boolean;
}
```

#### NivelSeveridad

```typescript
type NivelSeveridad = 'baja' | 'media' | 'alta' | 'critica';
```

**Mapeo de colores:**

- `baja`: Verde (#4CAF50)
- `media`: Naranja (#FF9800)
- `alta`: Rosa corporativo (#FF3184)
- `critica`: Rojo (#F44336)

### 5.3 Derivación Individual (CSV VBA)

#### DerivacionData (45 campos A-AS)

```typescript
interface DerivacionData {
  'Número Fiscal de Factura': string;
  Potencia: string;
  'Código de contrato externo - interfaz': string;
  Contrato?: string;
  'Secuencial de factura': string;
  'Tipo de factura': string;
  'Estado de la factura': string;
  'Fecha desde': string; // Formato DD/MM/YYYY
  'Fecha hasta': string; // Formato DD/MM/YYYY
  'Importe Factura': string | number;
  'Fuente de la factura': string;
  'Estado medida': string;
  'Tipo de factura (detalle)': string;
  'Tipo de Fuente Anterior': string;
  'Descripción Tipo de fuente Anterior': string;
  'Tipo de punto de medida': string;

  // Consumos activos por periodo (P1-P6)
  'Consumo P1/punta': string | number;
  'Consumo P2/llano': string | number;
  'Consumo P3/valle': string | number;
  'Consumo P4/supervalle': string | number;
  'Consumo P5': string | number;
  'Consumo P6': string | number;

  // Consumos reactivos (R1-R6)
  'Consumo Reactiva1': string | number;
  'Consumo Reactiva2': string | number;
  'Consumo Reactiva3': string | number;
  'Consumo Reactiva4': string | number;
  'Consumo Reactiva5': string | number;
  'Consumo Reactiva6': string | number;

  // Cargo-abono (P1-P6)
  'Consumo cargo-abono P1/punta': string | number;
  'Consumo cargo-abono P2/llano': string | number;
  'Consumo cargo-abono P3/valle': string | number;
  'Consumo cargo/abono P4': string | number;
  'Consumo cargo/abono P5': string | number;
  'Consumo cargo/abono P6': string | number;

  // Pérdidas (P1-P6)
  'Consumo pérdidas P1/punta': string | number;
  'Consumo pérdidas P2/llano': string | number;
  'Consumo pérdidas P3/valle': string | number;
  'Consumo pérdidas P4': string | number;
  'Consumo pérdidas P5': string | number;
  'Consumo pérdidas P6': string | number;

  // Maxímetros (P1-P6)
  'Maxímetro P1/Punta': string | number;
  'Maxímetro P2/Llano': string | number;
  'Maxímetro P3/Valle': string | number;
  'Maxímetro P4': string | number;
  'Maxímetro P5': string | number;
  'Maxímetro P6': string | number;

  // Campos calculados/agregados opcionales
  Maxímetro?: string | number;
  'Consumo Activa'?: string | number;
  'Promedio Activa'?: string | number;
  'Consumo Reactiva'?: string | number;
  'Promedio Reactiva'?: string | number;
  'Energía Total Reconstruida'?: string | number;
  'A + B + C'?: string | number;
  'AB - A'?: string | number;
  'AB - C'?: string | number;
  'Tipo de Fuente'?: string;
  'Descripción Tipo de fuente'?: string;
  P1?: string | number;
  P2?: string | number;
  P3?: string | number;
  P4?: string | number;
  P5?: string | number;
  P6?: string | number;
  Días?: string | number;
  'Consumo promedio ciclo'?: string | number;
  'Promedio ER'?: string | number;
  Origen: string;
}
```

**Notas de implementación:**

- Campos con formato español: números con coma decimal
- Conversión via `convertirNumeroEspañol()` en utils
- Fechas en DD/MM/YYYY convertidas con helpers específicos

### 5.4 Análisis y Estadísticas

#### ConsumoAnual

```typescript
interface ConsumoAnual {
  /** Año */
  año: number;
  /** Suma total del consumo activo (P1+P2+P3) en kWh */
  sumaConsumoActiva: number;
  /** Máximo de maxímetro registrado en el año */
  maxMaximetro: number;
  /** Número de periodos (facturas) en el año */
  periodosFacturados: number;
  /** Suma total de días facturados */
  sumaDias: number;
  /** Promedio de consumo por día */
  promedioConsumoPorDia: number;
}
```

**Fuente:** `generarVistaAnual()` en `analisisConsumoService.ts`

#### ConsumoMensual (estructura completa con 20+ campos)

```typescript
interface ConsumoMensual {
  /** Año */
  año: number;
  /** Mes (1-12) */
  mes: number;
  /** Periodo en formato "YYYY-MM" */
  periodo: string;

  // Consumos agregados
  /** Consumo total del mes basado en energía activa */
  consumoTotal: number;
  /** Sumatoria del campo "Consumo Activa" */
  consumoActivaTotal: number;
  /** Sumatoria del campo "Promedio Activa" */
  promedioActivaTotal: number;
  /** Sumatoria del campo "Maxímetro" */
  maximetroTotal: number;
  /** Sumatoria del campo "A + B + C" / Energía reconstruida */
  energiaReconstruidaTotal: number;

  // Métricas de periodo
  /** Consumo promedio diario */
  consumoPromedioDiario: number;
  /** Potencia promedio declarada en el periodo */
  potenciaPromedio: number | null;
  /** Variación porcentual de la potencia respecto al periodo anterior */
  variacionPotenciaPorcentual: number | null;
  /** Número de días del periodo */
  dias: number;
  /** Número de registros aportados al periodo */
  registros: number;

  // Variaciones y detección
  /** Variación porcentual respecto al mes anterior */
  variacionPorcentual: number | null;
  /** Es anomalía (variación >40% o múltiples motivos) */
  esAnomalia: boolean;
  /** Tipo de variación */
  tipoVariacion: 'aumento' | 'descenso' | 'estable' | null;
  /** Motivos para clasificar una anomalía */
  motivosAnomalia: string[];

  // Métricas estadísticas avanzadas
  /** Z-Score (desviaciones estándar respecto a media móvil de 6 meses) */
  zScore: number | null;
  /** Índice estacional (consumo actual / promedio histórico del mes * 100) */
  indiceEstacional: number | null;
  /** Tendencia en kWh/mes (calculada sobre 3 meses) */
  tendencia3M: number | null;
  /** Días transcurridos desde la última anomalía */
  diasDesdeAnomalia: number | null;
  /** Ratio Consumo/Potencia (consumo / (potencia * dias * 24)) */
  ratioConsumoPotencia: number | null;
  /** Coeficiente de variación histórico (%) */
  coeficienteVariacion: number | null;
}
```

**Cálculos clave:**

- `zScore`: ventana de 6 meses previos
- `indiceEstacional`: comparación contra promedio histórico del mismo mes
- `tendencia3M`: pendiente lineal sobre últimos 3 meses
- `ratioConsumoPotencia`: eficiencia de uso (0-1, valores cercanos a 1 = uso continuo)

### 5.5 Clasificación de Expedientes

#### ClasificacionExpediente

```typescript
type ClasificacionExpediente =
  | 'No anomalía - 0 esperado'
  | 'Anomalía indeterminada'
  | 'Descenso sostenido'
  | 'No objetivo por cambio de potencia'
  | 'Consumo bajo con picos';
```

#### ResultadoClasificacionExpediente (completo)

```typescript
interface ResultadoClasificacionExpediente {
  /** Clasificación global del expediente */
  clasificacion: ClasificacionExpediente;
  /** Periodo donde inició la anomalía (YYYY-MM) */
  inicioPeriodoAnomalia: string | null;
  /** Fecha exacta donde inició la anomalía */
  inicioFechaAnomalia: Date | null;
  /** Consumo total del periodo donde inició */
  consumoInicio: number | null;
  /** Consumo previo al inicio de la anomalía */
  consumoPrevio: number | null;
  /** Variación porcentual en el inicio */
  variacionInicio: number | null;
  /** Número de periodos con anomalía */
  periodosConAnomalia: number;
  /** Número de cambios de potencia detectados */
  cambiosPotencia: number;
  /** Periodos con consumo cero esperado */
  periodosConCeroEsperado: number;
  /** Detalle adicional (razones de la clasificación) */
  detalle: string[];
  /** Nivel de confianza de la clasificación (0-100) */
  confianza: number;
  /** Periodos con descenso temporal que luego se recuperaron */
  periodosConRecuperacion?: Array<{
    periodoDescenso: string;
    periodoRecuperacion: string;
    consumoDescenso: number;
    consumoRecuperacion: number;
    variacionDescenso: number;
  }>;
}
```

**Reglas de confianza:**

- 95-100%: Evidencia contundente
- 80-94%: Alta probabilidad
- 60-79%: Probable
- <60%: Indeterminado

### 5.6 Saldo ATR

#### SaldoATRColumna

```typescript
type SaldoATRColumna =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z'
  | 'AA'
  | 'AB'
  | 'AC'
  | 'AD'
  | 'AE'
  | 'AF'
  | 'AG'
  | 'AH'
  | 'AI'
  | 'AJ'
  | 'AK'
  | 'AL'
  | 'AM'
  | 'AN'
  | 'AO'
  | 'AP'
  | 'AQ'
  | 'AR'
  | 'AS'
  | 'AT';
```

#### SaldoATRRow

```typescript
type SaldoATRRow = Record<SaldoATRColumna, string>;
```

**Total:** 46 columnas (A-AT), interfaz de lectura/escritura para plantilla Excel.

### 5.7 Otros Tipos Importantes

#### EstadisticasConsumo

```typescript
interface EstadisticasConsumo {
  promedio: number;
  mediana: number;
  desviacionEstandar: number;
  minimo: number;
  maximo: number;
  totalRegistros: number;
}
```

#### ResultadoImportacion

```typescript
interface ResultadoImportacion {
  exito: boolean;
  registrosImportados: number;
  errores: string[];
  advertencias?: string[];
  datos: ConsumoEnergetico[];
}
```

#### OpcionesImportacion

```typescript
interface OpcionesImportacion {
  formato: 'csv' | 'json' | 'excel';
  delimitador?: string;
  codificacion?: string;
  validar?: boolean;
}
```

**Regla crítica:** Todos los tipos centralizados en `src/types/index.ts`. Importación siempre con `import type { ... }` para separar tipos de valores en build.

---

## 6. Servicios - Lógica de Negocio

Todos los servicios son **funciones puras** sin estado interno, siguiendo principios de programación funcional. Residen en `src/services/` y son consumidos por hooks personalizados.

---

### 6.1 `anomaliaService.ts` - Detección de Anomalías

**Ubicación:** `src/services/anomaliaService.ts` (aprox. 180 líneas)

#### Umbrales de Detección (Constantes Configuradas)

```typescript
const UMBRALES = {
  DESCENSO_MINIMO: 15, // % - Descenso gradual (15-30%)
  DESCENSO_ABRUPTO: 30, // % - Descenso severo (>30%)
  CONSUMO_CERO: 5, // kWh - Umbral para considerar "consumo cero"
  FACTOR_DESVIACION: 2, // σ - Multiplicador para detección de picos anómalos
};
```

#### Algoritmo Principal: `detectarAnomalias()`

**Entrada:** `ConsumoPeriodo[]` (consumos agrupados por mes, ordenados cronológicamente)  
**Salida:** `Anomalia[]` (lista de anomalías detectadas con metadatos)

**Pseudocódigo:**

```
FUNCIÓN detectarAnomalias(consumosPorPeriodo):
  SI consumosPorPeriodo.length < 2:
    RETORNAR []  // No hay comparación posible

  // Paso 1: Cálculo de baseline global
  promedioGlobal ← CALCULAR_PROMEDIO(consumosPorPeriodo.map(c => c.consumoTotal))
  desviacionEstandar ← CALCULAR_DESVIACION(consumosPorPeriodo.map(c => c.consumoTotal))

  anomalias ← []
  ocurrenciasPorTipo ← Map<TipoAnomalia, boolean>

  // Paso 2: Análisis periodo-a-periodo
  PARA i = 0 HASTA consumosPorPeriodo.length - 1:
    periodoActual ← consumosPorPeriodo[i]
    consumoActual ← periodoActual.consumoTotal

    // 2.1 Detección de consumo negativo (error de datos)
    SI consumoActual < 0:
      CREAR_ANOMALIA(tipo: "consumo_negativo", severidad: "critica")
      CONTINUAR

    // 2.2 Detección de consumo cero
    SI consumoActual <= CONSUMO_CERO:
      CREAR_ANOMALIA(tipo: "consumo_cero", severidad: "alta")
      CONTINUAR

    // 2.3 Análisis de variación vs periodo anterior
    SI i > 0:
      periodoAnterior ← consumosPorPeriodo[i-1]
      consumoAnterior ← periodoAnterior.consumoTotal
      variacion ← ((consumoActual - consumoAnterior) / consumoAnterior) * 100

      SI variacion <= -DESCENSO_ABRUPTO:
        CREAR_ANOMALIA(tipo: "descenso_abrupto", severidad: "critica")
      SINO SI variacion <= -DESCENSO_MINIMO:
        CREAR_ANOMALIA(tipo: "descenso_gradual", severidad: "alta")

    // 2.4 Detección de picos anómalos (método Z-Score)
    zScore ← (consumoActual - promedioGlobal) / desviacionEstandar
    SI zScore > FACTOR_DESVIACION:
      CREAR_ANOMALIA(tipo: "pico_anomalo", severidad: "media")

  // Paso 3: Marcar primera ocurrencia de cada tipo
  PARA CADA anomalia EN anomalias:
    SI NO ocurrenciasPorTipo[anomalia.tipo]:
      anomalia.esPrimeraOcurrencia ← true
      ocurrenciasPorTipo[anomalia.tipo] ← true
    SINO:
      anomalia.esPrimeraOcurrencia ← false

  RETORNAR anomalias
```

**Ejemplo de código real (simplificado):**

```typescript
export const detectarAnomalias = (consumosPorPeriodo: ConsumoPeriodo[]): Anomalia[] => {
  if (consumosPorPeriodo.length < 2) return [];

  const consumos = consumosPorPeriodo.map((c) => c.consumoTotal);
  const promedioGlobal = calcularPromedio(consumos);
  const desviacionEstandar = calcularDesviacionEstandar(consumos);

  const anomalias: Anomalia[] = [];
  const primerasOcurrencias = new Map<TipoAnomalia, boolean>();

  consumosPorPeriodo.forEach((periodo, index) => {
    const { consumoTotal, periodo: periodoStr } = periodo;

    // Consumo negativo
    if (consumoTotal < 0) {
      anomalias.push(
        crearAnomalia({
          tipo: 'consumo_negativo',
          periodo: periodoStr,
          severidad: 'critica',
          consumoReal: consumoTotal,
          consumoEsperado: 0,
          variacion: -100,
          descripcion: `Consumo negativo: ${consumoTotal} kWh`,
        })
      );
      return;
    }

    // Consumo cero
    if (consumoTotal <= UMBRALES.CONSUMO_CERO) {
      anomalias.push(
        crearAnomalia({
          tipo: 'consumo_cero',
          periodo: periodoStr,
          severidad: 'alta',
          consumoReal: consumoTotal,
          consumoEsperado: promedioGlobal,
          variacion: calcularVariacionPorcentual(consumoTotal, promedioGlobal),
        })
      );
      return;
    }

    // Descenso vs periodo anterior
    if (index > 0) {
      const consumoAnterior = consumosPorPeriodo[index - 1].consumoTotal;
      const variacion = calcularVariacionPorcentual(consumoTotal, consumoAnterior);

      if (variacion <= -UMBRALES.DESCENSO_ABRUPTO) {
        anomalias.push(
          crearAnomalia({
            tipo: 'descenso_abrupto',
            severidad: 'critica',
            consumoEsperado: consumoAnterior,
            variacion,
          })
        );
      } else if (variacion <= -UMBRALES.DESCENSO_MINIMO) {
        anomalias.push(
          crearAnomalia({
            tipo: 'descenso_gradual',
            severidad: 'alta',
            consumoEsperado: consumoAnterior,
            variacion,
          })
        );
      }
    }

    // Pico anómalo (Z-Score)
    const zScore = (consumoTotal - promedioGlobal) / desviacionEstandar;
    if (zScore > UMBRALES.FACTOR_DESVIACION) {
      anomalias.push(
        crearAnomalia({
          tipo: 'pico_anomalo',
          severidad: 'media',
          consumoEsperado: promedioGlobal,
          variacion: calcularVariacionPorcentual(consumoTotal, promedioGlobal),
        })
      );
    }
  });

  // Marcar primeras ocurrencias
  anomalias.forEach((anomalia) => {
    if (!primerasOcurrencias.has(anomalia.tipo)) {
      anomalia.esPrimeraOcurrencia = true;
      primerasOcurrencias.set(anomalia.tipo, true);
    }
  });

  return anomalias;
};
```

#### Funciones Auxiliares

**`filtrarPorSeveridad(anomalias, severidad)`**

```typescript
export const filtrarPorSeveridad = (
  anomalias: Anomalia[],
  severidad: NivelSeveridad
): Anomalia[] => {
  return anomalias.filter((a) => a.severidad === severidad);
};
```

**`obtenerPrimeraAnomalia(anomalias)`**

```typescript
export const obtenerPrimeraAnomalia = (anomalias: Anomalia[]): Anomalia | null => {
  const ordenadas = anomalias.sort(
    (a, b) => new Date(a.fechaDeteccion).getTime() - new Date(b.fechaDeteccion).getTime()
  );
  return ordenadas[0] || null;
};
```

**`agruparPorTipo(anomalias)`**

```typescript
export const agruparPorTipo = (anomalias: Anomalia[]): Record<TipoAnomalia, Anomalia[]> => {
  return anomalias.reduce(
    (acc, anomalia) => {
      if (!acc[anomalia.tipo]) acc[anomalia.tipo] = [];
      acc[anomalia.tipo].push(anomalia);
      return acc;
    },
    {} as Record<TipoAnomalia, Anomalia[]>
  );
};
```

**Métricas de Detección:**

- **Tasa de Falsos Positivos:** Depende de umbrales; configurar según contexto (industrial vs residencial)
- **Sensibilidad:** `DESCENSO_MINIMO` más bajo = más detecciones (más sensible)
- **Especificidad:** `FACTOR_DESVIACION` más alto = menos picos detectados (más específico)

---

### 6.2 `dataService.ts` - Procesamiento y Agrupación

**Ubicación:** `src/services/dataService.ts` (aprox. 250 líneas)

#### Función Principal: `agruparPorPeriodo()`

**Algoritmo:**

```typescript
/**
 * Agrupa consumos por periodo mensual (YYYY-MM)
 * @param consumos - Array de consumos individuales
 * @returns Array de consumos agrupados por mes
 */
export const agruparPorPeriodo = (consumos: ConsumoEnergetico[]): ConsumoPeriodo[] => {
  // Paso 1: Crear mapa de acumulación
  const mapa = new Map<string, { total: number; cantidad: number }>();

  consumos.forEach((consumo) => {
    const periodo = obtenerPeriodo(consumo.fecha); // "2024-01"

    if (!mapa.has(periodo)) {
      mapa.set(periodo, { total: 0, cantidad: 0 });
    }

    const acumulador = mapa.get(periodo)!;
    acumulador.total += consumo.consumo;
    acumulador.cantidad += 1;
  });

  // Paso 2: Convertir a array y calcular promedios
  const resultado: ConsumoPeriodo[] = Array.from(mapa.entries()).map(([periodo, datos]) => ({
    periodo,
    consumoTotal: datos.total,
    consumoPromedio: datos.total / datos.cantidad,
    cantidadRegistros: datos.cantidad,
  }));

  // Paso 3: Ordenar cronológicamente
  return resultado.sort((a, b) => a.periodo.localeCompare(b.periodo));
};
```

#### Limpieza y Validación de Datos

**`limpiarDatos(consumos)`**

```typescript
export const limpiarDatos = (consumos: ConsumoEnergetico[]): ConsumoEnergetico[] => {
  return consumos.filter((consumo) => {
    // Validación de ID
    if (!consumo.id || consumo.id.trim() === '') return false;

    // Validación de fecha
    if (!esFechaValida(consumo.fecha)) return false;

    // Validación de consumo numérico
    if (!esNumeroValido(consumo.consumo)) return false;

    // Validación de número de contador
    if (!consumo.numeroContador) return false;

    return true;
  });
};
```

**`eliminarDuplicados(consumos)`**

```typescript
export const eliminarDuplicados = (consumos: ConsumoEnergetico[]): ConsumoEnergetico[] => {
  const vistos = new Set<string>();

  return consumos.filter((consumo) => {
    const clave = `${consumo.fecha}-${consumo.numeroContador}`;

    if (vistos.has(clave)) {
      return false; // Duplicado
    }

    vistos.add(clave);
    return true;
  });
};
```

#### Cálculo de Estadísticas

**`calcularEstadisticas(consumos)`**

```typescript
export const calcularEstadisticas = (consumos: ConsumoEnergetico[]): Estadisticas => {
  if (consumos.length === 0) {
    return {
      promedio: 0,
      mediana: 0,
      desviacionEstandar: 0,
      minimo: 0,
      maximo: 0,
      total: 0,
      cantidad: 0,
    };
  }

  const valores = consumos.map((c) => c.consumo).sort((a, b) => a - b);

  return {
    promedio: calcularPromedio(valores),
    mediana: calcularMediana(valores),
    desviacionEstandar: calcularDesviacionEstandar(valores),
    minimo: Math.min(...valores),
    maximo: Math.max(...valores),
    total: valores.reduce((sum, v) => sum + v, 0),
    cantidad: consumos.length,
  };
};
```

#### Comparación de Periodos

**`compararPeriodos(anterior, actual)`**

```typescript
export const compararPeriodos = (
  anterior: ConsumoPeriodo,
  actual: ConsumoPeriodo
): ComparacionPeriodo => {
  const diferencia = actual.consumoTotal - anterior.consumoTotal;
  const variacion = calcularVariacionPorcentual(actual.consumoTotal, anterior.consumoTotal);

  // Determinar tendencia (±5% = estable)
  let tendencia: 'subida' | 'bajada' | 'estable';
  if (variacion > 5) tendencia = 'subida';
  else if (variacion < -5) tendencia = 'bajada';
  else tendencia = 'estable';

  return {
    periodoAnterior: anterior.periodo,
    periodoActual: actual.periodo,
    diferenciaAbsoluta: diferencia,
    diferenciaRelativa: variacion,
    tendencia,
  };
};
```

---

### 6.3 `importService.ts` - Importación y Exportación

**Ubicación:** `src/services/importService.ts` (aprox. 200 líneas)

#### Importación CSV

**`importarCSV(contenido, opciones)`**

```typescript
export const importarCSV = async (
  contenido: string,
  opciones: OpcionesImportacion = { formato: 'csv', delimitador: ',' }
): Promise<ResultadoImportacion> => {
  const errores: string[] = [];
  const advertencias: string[] = [];
  const datos: ConsumoEnergetico[] = [];

  try {
    const lineas = contenido
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lineas.length === 0) {
      return { exito: false, registrosImportados: 0, errores: ['Archivo vacío'], datos: [] };
    }

    // Paso 1: Parsear encabezados
    const encabezados = lineas[0].split(opciones.delimitador!).map((h) => h.trim());

    // Paso 2: Validar encabezados requeridos
    const requeridos = ['fecha', 'consumo', 'numeroContador'];
    const faltantes = requeridos.filter(
      (r) => !encabezados.some((h) => h.toLowerCase() === r.toLowerCase())
    );

    if (faltantes.length > 0) {
      return {
        exito: false,
        registrosImportados: 0,
        errores: [`Faltan columnas requeridas: ${faltantes.join(', ')}`],
        datos: [],
      };
    }

    // Paso 3: Mapear índices de columnas
    const indices = {
      fecha: encabezados.findIndex((h) => h.toLowerCase() === 'fecha'),
      consumo: encabezados.findIndex((h) => h.toLowerCase() === 'consumo'),
      numeroContador: encabezados.findIndex((h) => h.toLowerCase() === 'numerocontador'),
      cliente: encabezados.findIndex((h) => h.toLowerCase() === 'cliente'),
      periodo: encabezados.findIndex((h) => h.toLowerCase() === 'periodo'),
    };

    // Paso 4: Procesar filas de datos
    for (let i = 1; i < lineas.length; i++) {
      const valores = lineas[i].split(opciones.delimitador!);

      try {
        const consumo: ConsumoEnergetico = {
          id: generarId(),
          fecha: valores[indices.fecha].trim(),
          consumo: parseFloat(valores[indices.consumo]),
          numeroContador: valores[indices.numeroContador].trim(),
          cliente: indices.cliente >= 0 ? valores[indices.cliente] : undefined,
          periodo:
            indices.periodo >= 0
              ? valores[indices.periodo]
              : obtenerPeriodo(valores[indices.fecha]),
        };

        // Validación opcional
        if (opciones.validar !== false) {
          if (!validarConsumo(consumo)) {
            advertencias.push(`Fila ${i + 1}: Datos inválidos`);
            continue;
          }
        }

        datos.push(consumo);
      } catch (error) {
        errores.push(`Fila ${i + 1}: ${error.message}`);
      }
    }

    return {
      exito: datos.length > 0,
      registrosImportados: datos.length,
      errores,
      advertencias,
      datos,
    };
  } catch (error) {
    return {
      exito: false,
      registrosImportados: 0,
      errores: [error.message],
      datos: [],
    };
  }
};
```

**`validarConsumo(consumo)`**

```typescript
const validarConsumo = (consumo: ConsumoEnergetico): boolean => {
  if (!esFechaValida(consumo.fecha)) return false;
  if (!esNumeroValido(consumo.consumo)) return false;
  if (!consumo.numeroContador || consumo.numeroContador.trim() === '') return false;
  return true;
};
```

#### Exportación CSV

**`exportarCSV(consumos)`**

```typescript
export const exportarCSV = (consumos: ConsumoEnergetico[]): string => {
  const encabezados = ['id', 'fecha', 'consumo', 'numeroContador', 'cliente', 'periodo'];
  const lineas = [encabezados.join(',')];

  consumos.forEach((consumo) => {
    const fila = [
      consumo.id,
      consumo.fecha,
      consumo.consumo.toString(),
      consumo.numeroContador,
      consumo.cliente || '',
      consumo.periodo || '',
    ];
    lineas.push(fila.join(','));
  });

  return lineas.join('\n');
};
```

---

### 6.4 `analisisConsumoService.ts` - Réplica de Lógica VBA

**Ubicación:** `src/services/analisisConsumoService.ts` (1027 líneas) - **EL MÁS COMPLEJO**

Este servicio replica exactamente la lógica de las macros VBA de Excel, transformando tablas dinámicas en funciones TypeScript puras.

#### Vista Anual: `generarVistaAnual()`

**Propósito:** Generar resumen agregado por año (similar a tabla dinámica de Excel)

**Algoritmo:**

```typescript
export const generarVistaAnual = (datos: DerivacionData[]): ConsumoAnual[] => {
  // Paso 1: Agrupar por año
  const porAño = new Map<number, DerivacionData[]>();

  datos.forEach((registro) => {
    const año = obtenerAñoDesde(registro['Fecha desde']);
    if (!porAño.has(año)) porAño.set(año, []);
    porAño.get(año)!.push(registro);
  });

  // Paso 2: Calcular métricas por año
  const resultado: ConsumoAnual[] = [];

  porAño.forEach((registros, año) => {
    const consumosActivos = registros.map(
      (r) =>
        convertirNumeroEspañol(r['P1'] || '0') +
        convertirNumeroEspañol(r['P2'] || '0') +
        convertirNumeroEspañol(r['P3'] || '0')
    );

    const maximetros = registros.map((r) => convertirNumeroEspañol(r['Maxímetro'] || '0'));
    const dias = registros.map((r) => convertirNumeroEspañol(r['Días'] || '0'));

    resultado.push({
      año,
      sumaConsumoActiva: consumosActivos.reduce((sum, c) => sum + c, 0),
      maxMaximetro: Math.max(...maximetros),
      periodosFacturados: registros.length,
      sumaDias: dias.reduce((sum, d) => sum + d, 0),
      promedioConsumoPorDia: calcularPromedio(consumosActivos) / calcularPromedio(dias),
    });
  });

  return resultado.sort((a, b) => a.año - b.año);
};
```

#### Vista Mensual: `generarComparativaMensual()`

**Propósito:** Análisis mensual detallado con métricas avanzadas (20+ campos calculados)

**Código simplificado:**

```typescript
export const generarComparativaMensual = (datos: DerivacionData[]): ConsumoMensual[] => {
  // Agrupar por periodo (YYYY-MM)
  const porPeriodo = agruparPorPeriodoDerivacion(datos);
  const resultado: ConsumoMensual[] = [];

  // Calcular baseline global
  const todosLosConsumos = datos.map((d) => obtenerConsumoTotal(d));
  const promedioGlobal = calcularPromedio(todosLosConsumos);
  const desviacionGlobal = calcularDesviacionEstandar(todosLosConsumos);

  // Procesar cada periodo
  porPeriodo.forEach((registros, periodo) => {
    const consumoTotal = registros.reduce((sum, r) => sum + obtenerConsumoTotal(r), 0);
    const dias = registros.reduce((sum, r) => sum + convertirNumeroEspañol(r['Días'] || '0'), 0);
    const potencia = Math.max(
      ...registros.map((r) => convertirNumeroEspañol(r['Potencia'] || '0'))
    );

    // Normalizar a 30 días
    const consumoNormalizado = (consumoTotal / dias) * 30;

    // Calcular variación vs periodo anterior
    const periodoAnterior = obtenerPeriodoAnterior(periodo);
    const consumoAnterior = porPeriodo.get(periodoAnterior)?.[0];
    const variacion = consumoAnterior
      ? calcularVariacionPorcentual(consumoNormalizado, obtenerConsumoTotal(consumoAnterior))
      : null;

    // Z-Score (ventana móvil de 6 meses)
    const ventana6M = obtenerUltimosNPeriodos(porPeriodo, periodo, 6);
    const consumosVentana = ventana6M.map((v) => obtenerConsumoTotal(v[0]));
    const zScore = calcularZScore(consumoNormalizado, consumosVentana);

    // Índice estacional (comparar mes actual con promedio histórico de ese mes)
    const mesActual = parseInt(periodo.split('-')[1]);
    const consumosHistoricos = obtenerConsumosMes(porPeriodo, mesActual);
    const indiceEstacional = consumoNormalizado / calcularPromedio(consumosHistoricos);

    // Tendencia 3 meses (regresión lineal simple)
    const ventana3M = obtenerUltimosNPeriodos(porPeriodo, periodo, 3);
    const tendencia = calcularTendencia3M(ventana3M.map((v) => obtenerConsumoTotal(v[0])));

    // Ratio Consumo/Potencia (eficiencia de uso)
    const ratioConsumoPotencia = consumoTotal / (potencia * dias * 24);

    // Detectar motivos de anomalía
    const motivos: string[] = [];
    if (zScore > 2) motivos.push('Pico anómalo (>2σ)');
    if (zScore < -2) motivos.push('Descenso anómalo (<-2σ)');
    if (variacion && variacion < -15) motivos.push(`Descenso ${variacion.toFixed(1)}%`);
    if (consumoNormalizado < 10) motivos.push('Consumo casi nulo');
    if (indiceEstacional < 0.5) motivos.push('Fuera de patrón estacional');

    resultado.push({
      periodo,
      año: parseInt(periodo.split('-')[0]),
      mes: mesActual,
      consumoTotal,
      consumoNormalizado,
      dias,
      potencia,
      variacionPorcentaje: variacion,
      zScore,
      indiceEstacional,
      tendencia3M: tendencia,
      ratioConsumoPotencia,
      motivoAnomalia: motivos.join('; ') || null,
      // ... más campos (ver tipos completos)
    });
  });

  return resultado;
};
```

#### Métodos Auxiliares Matemáticos

**`calcularZScore(valor, ventana)`**

```typescript
const calcularZScore = (valor: number, ventana: number[]): number => {
  if (ventana.length === 0) return 0;
  const promedio = calcularPromedio(ventana);
  const desviacion = calcularDesviacionEstandar(ventana);
  return desviacion === 0 ? 0 : (valor - promedio) / desviacion;
};
```

**`calcularIndiceEstacional(valorActual, historico)`**

```typescript
const calcularIndiceEstacional = (valorActual: number, historico: number[]): number => {
  const promedioHistorico = calcularPromedio(historico);
  return promedioHistorico === 0 ? 1 : valorActual / promedioHistorico;
};
```

**`calcularTendencia3M(valores)`** - Regresión lineal simple

```typescript
const calcularTendencia3M = (valores: number[]): number => {
  if (valores.length < 2) return 0;

  const n = valores.length;
  const x = Array.from({ length: n }, (_, i) => i); // [0, 1, 2, ...]
  const y = valores;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  // Pendiente: m = (n*ΣXY - ΣX*ΣY) / (n*ΣX² - (ΣX)²)
  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  return m; // Pendiente positiva = tendencia al alza
};
```

---

### 6.5 `detectarInicioAnomaliaService.ts` - Sistema Experto

**Ubicación:** `src/services/detectarInicioAnomaliaService.ts` (945 líneas) - **SISTEMA EXPERTO**

Este servicio implementa un **motor de reglas heurísticas** para detectar el punto exacto donde inicia una anomalía sostenida.

#### Lógica Principal

**`detectarInicioAnomalia(datos)`**

**Pasos del algoritmo:**

1. **Normalización:** Convertir todos los consumos a periodo de 30 días
2. **Detección de descenso sostenido:** ≥3 meses consecutivos con descenso >10%
3. **Verificación de recuperación:** Asegurar que NO haya recuperación posterior ≥15%
4. **Análisis de estacionalidad:** Determinar si ceros son esperados
5. **Cálculo de confianza:** Basado en número de evidencias y consistencia
6. **Generación de mensaje:** Texto legible para usuario

**Pseudocódigo:**

```
FUNCIÓN detectarInicioAnomalia(datos):
  // Paso 1: Normalización
  datosNormalizados ← NORMALIZAR_A_30_DIAS(datos)

  // Paso 2: Analizar descensos sostenidos
  bloques ← DETECTAR_BLOQUES_DESCENSO(datosNormalizados, umbralDescenso=10%, minPeriodos=3)

  SI bloques.length === 0:
    RETORNAR { clasificacion: 'sin_anomalia', mensaje: 'No se detectó descenso sostenido' }

  // Paso 3: Filtrar bloques con recuperación
  bloquesSinRecuperacion ← FILTRAR(bloques, bloque =>
    NO_TIENE_RECUPERACION(bloque, umbralRecuperacion=15%)
  )

  SI bloquesSinRecuperacion.length === 0:
    RETORNAR { clasificacion: 'periodo_indeterminado', mensaje: 'Descenso con recuperación posterior' }

  // Paso 4: Seleccionar primer bloque válido
  primerBloque ← bloquesSinRecuperacion[0]
  periodoInicio ← primerBloque.periodoInicio
  consumoInicio ← primerBloque.consumoInicio
  consumoPrevio ← primerBloque.consumoPrevio

  // Paso 5: Verificar si cero es esperado (estacionalidad)
  SI consumoInicio <= 5:
    esEstacional ← ANALIZAR_ESTACIONALIDAD(datos, periodoInicio)
    SI esEstacional:
      RETORNAR { clasificacion: 'sin_anomalia', mensaje: 'Consumo cero esperado (patrón estacional)' }

  // Paso 6: Calcular confianza
  evidencias ← [
    primerBloque.periodosDescenso >= 3,
    primerBloque.variacion <= -15,
    NO_TIENE_RECUPERACION(primerBloque),
    NO_HAY_CAMBIO_POTENCIA(datos, periodoInicio)
  ]
  confianza ← (evidencias.filter(e => e).length / evidencias.length) * 100

  // Paso 7: Generar resultado
  RETORNAR {
    clasificacion: 'anomalia_detectada',
    periodoInicio,
    consumoInicio,
    consumoPrevio,
    variacion: CALCULAR_VARIACION(consumoInicio, consumoPrevio),
    confianza,
    mensaje: GENERAR_MENSAJE_DETALLADO(...),
    razon: 'Descenso sostenido sin recuperación',
    detalles: GENERAR_DETALLES_TECNICOS(...)
  }
```

**Código real (fragmento clave):**

```typescript
export const detectarInicioAnomalia = (
  datos: DerivacionData[]
): ResultadoDeteccionInicio => {
  // Normalizar a 30 días
  const normalizados = normalizarConsumos(datos);

  // Detectar bloques de descenso
  const bloques = detectarBloquesDescenso(normalizados, {
    umbralDescenso: 10,
    minimoPerio dos: 3
  });

  if (bloques.length === 0) {
    return {
      clasificacion: 'sin_anomalia',
      mensaje: 'No se detectaron descensos sostenidos significativos',
      periodoInicio: null,
      razon: null,
      confianza: 0,
      detalles: []
    };
  }

  // Filtrar bloques sin recuperación
  const bloquesSinRecuperacion = bloques.filter(bloque =>
    !tieneRecuperacion(normalizados, bloque, 15)
  );

  if (bloquesSinRecuperacion.length === 0) {
    return {
      clasificacion: 'periodo_indeterminado',
      mensaje: 'Se detectó descenso pero con recuperación posterior',
      periodoInicio: bloques[0].periodoInicio,
      razon: 'Descenso temporal',
      confianza: 30,
      detalles: ['Recuperación detectada']
    };
  }

  // Seleccionar primer bloque válido
  const bloque = bloquesSinRecuperacion[0];

  // Verificar estacionalidad para ceros
  if (bloque.consumoInicio <= 5) {
    const esEstacional = analizarEstacionalidad(normalizados, bloque.periodoInicio);
    if (esEstacional) {
      return {
        clasificacion: 'sin_anomalia',
        mensaje: 'Consumo cero esperado según patrón histórico',
        periodoInicio: bloque.periodoInicio,
        razon: 'Patrón estacional',
        confianza: 85,
        detalles: ['Consumo cero recurrente en este periodo']
      };
    }
  }

  // Calcular confianza
  const evidencias = [
    bloque.periodosDescenso >= 3,
    bloque.variacion <= -15,
    !tieneRecuperacion(normalizados, bloque, 15),
    !hayCambioPotencia(datos, bloque.periodoInicio)
  ];
  const confianza = (evidencias.filter(e => e).length / evidencias.length) * 100;

  return {
    clasificacion: 'anomalia_detectada',
    periodoInicio: bloque.periodoInicio,
    consumoInicio: bloque.consumoInicio,
    consumoPrevio: bloque.consumoPrevio,
    variacion: calcularVariacionPorcentual(bloque.consumoInicio, bloque.consumoPrevio),
    confianza,
    mensaje: `Anomalía detectada en ${bloque.periodoInicio} con descenso de ${bloque.variacion.toFixed(1)}%`,
    razon: 'Descenso sostenido sin recuperación',
    detalles: generarDetallesTecnicos(bloque, evidencias)
  };
};
```

---

### 6.6 `clasificadorExpedienteService.ts` - Clasificación Global

**Ubicación:** `src/services/clasificadorExpedienteService.ts` (1136 líneas) - **HEURÍSTICA COMPLEJA**

#### Categorías de Clasificación

```typescript
type ClasificacionExpediente =
  | 'No anomalía - 0 esperado' // Consumo cero estacional
  | 'Anomalía indeterminada' // Patrones confusos
  | 'Descenso sostenido' // Anomalía clara
  | 'No objetivo por cambio de potencia' // Cambio contractual
  | 'Consumo bajo con picos'; // Patrón irregular
```

#### Algoritmo de Clasificación v3

**`clasificarExpediente(datos)`**

```typescript
export const clasificarExpediente = (datos: DerivacionData[]): ResultadoClasificacionExpediente => {
  const detalle: string[] = [];

  // Paso 1: Análisis de cambios de potencia
  const cambiosPotencia = detectarCambiosPotencia(datos);
  if (cambiosPotencia > 0) {
    detalle.push(`${cambiosPotencia} cambio(s) de potencia detectados`);
    return {
      clasificacion: 'No objetivo por cambio de potencia',
      cambiosPotencia,
      detalle,
      nivelConfianza: 90,
    };
  }

  // Paso 2: Análisis de ceros esperados
  const consumosNormalizados = normalizarConsumos(datos);
  const periodosConCero = consumosNormalizados.filter((c) => c.consumoNormalizado <= 5);
  const cerosEsperados = periodosConCero.filter((c) => esConsumoEsperado(datos, c.periodo)).length;

  if (cerosEsperados > periodosConCero.length * 0.7) {
    detalle.push(`${cerosEsperados} periodos con cero esperado`);
    return {
      clasificacion: 'No anomalía - 0 esperado',
      periodosConCeroEsperado: cerosEsperados,
      detalle,
      nivelConfianza: 85,
    };
  }

  // Paso 3: Detectar inicio de anomalía
  const resultadoInicio = detectarInicioAnomalia(datos);

  if (resultadoInicio.clasificacion === 'anomalia_detectada') {
    detalle.push(resultadoInicio.mensaje);
    detalle.push(...resultadoInicio.detalles);

    return {
      clasificacion: 'Descenso sostenido',
      inicioPeriodoAnomalia: resultadoInicio.periodoInicio,
      inicioFechaAnomalia: parsearFecha(resultadoInicio.periodoInicio),
      consumoInicio: resultadoInicio.consumoInicio,
      consumoPrevio: resultadoInicio.consumoPrevio,
      variacionInicio: resultadoInicio.variacion,
      detalle,
      nivelConfianza: resultadoInicio.confianza,
    };
  }

  // Paso 4: Análisis de picos con consumo bajo
  const promedioConsumo = calcularPromedio(consumosNormalizados.map((c) => c.consumoNormalizado));
  const picosDetectados = consumosNormalizados.filter((c) => c.zScore > 2).length;

  if (promedioConsumo < 50 && picosDetectados >= 2) {
    detalle.push(`Consumo promedio bajo (${promedioConsumo.toFixed(1)} kWh/30d)`);
    detalle.push(`${picosDetectados} picos anómalos detectados`);

    return {
      clasificacion: 'Consumo bajo con picos',
      detalle,
      nivelConfianza: 70,
    };
  }

  // Paso 5: Clasificación indeterminada
  detalle.push('Patrones no concluyentes');
  return {
    clasificacion: 'Anomalía indeterminada',
    detalle,
    nivelConfianza: 40,
  };
};
```

---

### 6.7 `persistenciaService.ts` - LocalStorage

**Clave de almacenamiento:** `valorapp-v2`

```typescript
export const guardarDatos = (datos: DatosDerivacion): boolean => {
  try {
    const json = JSON.stringify(datos);

    // Validar tamaño (límite 5MB)
    if (json.length > 5 * 1024 * 1024) {
      loggerService.warn('Datos exceden límite de almacenamiento (5MB)');
      return false;
    }

    localStorage.setItem('valorapp-v2', json);
    loggerService.info(`Datos guardados: ${(json.length / 1024).toFixed(2)} KB`);
    return true;
  } catch (error) {
    loggerService.error('Error al guardar datos', error);
    return false;
  }
};

export const recuperarDatos = (): DatosDerivacion | null => {
  try {
    const json = localStorage.getItem('valorapp-v2');
    if (!json) return null;

    return JSON.parse(json);
  } catch (error) {
    loggerService.error('Error al recuperar datos', error);
    return null;
  }
};
```

---

### 6.8 Otros Servicios

**`loggerService.ts`** - Logging centralizado

```typescript
export const loggerService = {
  debug: (mensaje: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${mensaje}`, ...args);
    }
  },
  info: (mensaje: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(`[INFO] ${mensaje}`, ...args);
    }
  },
  warn: (mensaje: string, ...args: any[]) => {
    console.warn(`[WARN] ${mensaje}`, ...args);
  },
  error: (mensaje: string, ...args: any[]) => {
    console.error(`[ERROR] ${mensaje}`, ...args);
  },
};
```

**Regla crítica:** NUNCA usar `console.log` directamente - siempre usar `loggerService`

---

## 7. Hooks Personalizados - Orquestación de Lógica

Los hooks encapsulan **lógica de negocio + estado + side-effects**, actuando como capa intermedia entre componentes y servicios. Todos los hooks personalizados están en `src/hooks/` (globales) o `src/pages/*/hooks/` (específicos de página).

---

### 7.1 `useProcesarDatos` - Pipeline de Procesamiento

**Ubicación:** `src/hooks/useProcesarDatos.ts` (75 líneas)

**Propósito:** Orquestar el pipeline completo de procesamiento: limpieza → deduplicación → agrupación → detección de anomalías → cálculo de estadísticas.

#### Interfaz del Hook

```typescript
interface UseProcesarDatosReturn {
  /** Consumos después de limpieza y deduplicación */
  consumosProcesados: ConsumoEnergetico[];

  /** Consumos agrupados por mes (YYYY-MM) */
  consumosPorPeriodo: ConsumoPeriodo[];

  /** Anomalías detectadas automáticamente */
  anomalias: Anomalia[];

  /** Estadísticas globales (promedio, mediana, desviación, etc.) */
  estadisticas: EstadisticasConsumo;

  /** Flag de datos cargados */
  hayDatos: boolean;

  /** Ejecutar pipeline de procesamiento */
  procesarConsumos: (consumos: ConsumoEnergetico[]) => void;

  /** Limpiar estado */
  limpiar: () => void;
}
```

#### Implementación Completa

```typescript
export const useProcesarDatos = (): UseProcesarDatosReturn => {
  // Estado local (único source of truth)
  const [consumosProcesados, setConsumosProcesados] = useState<ConsumoEnergetico[]>([]);

  // Memoización 1: Agrupación por periodo
  const consumosPorPeriodo = useMemo(() => {
    if (consumosProcesados.length === 0) return [];
    return agruparPorPeriodo(consumosProcesados);
  }, [consumosProcesados]);

  // Memoización 2: Detección de anomalías
  const anomalias = useMemo(() => {
    if (consumosPorPeriodo.length === 0) return [];
    return detectarAnomalias(consumosPorPeriodo);
  }, [consumosPorPeriodo]);

  // Memoización 3: Estadísticas globales
  const estadisticas = useMemo(() => {
    if (consumosProcesados.length === 0) {
      return {
        promedio: 0,
        mediana: 0,
        desviacionEstandar: 0,
        minimo: 0,
        maximo: 0,
        totalRegistros: 0,
      };
    }
    return calcularEstadisticas(consumosProcesados);
  }, [consumosProcesados]);

  // Pipeline de procesamiento
  const procesarConsumos = useCallback((consumos: ConsumoEnergetico[]) => {
    // Paso 1: Limpieza (eliminar registros inválidos)
    let consumosLimpios = limpiarDatos(consumos);

    // Paso 2: Deduplicación (clave: fecha + numeroContador)
    consumosLimpios = eliminarDuplicados(consumosLimpios);

    // Paso 3: Ordenamiento cronológico
    consumosLimpios.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // Paso 4: Actualizar estado (desencadena memoizaciones)
    setConsumosProcesados(consumosLimpios);
  }, []);

  const limpiar = useCallback(() => {
    setConsumosProcesados([]);
  }, []);

  return {
    consumosProcesados,
    consumosPorPeriodo,
    anomalias,
    estadisticas,
    hayDatos: consumosProcesados.length > 0,
    procesarConsumos,
    limpiar,
  };
};
```

#### Diagrama de Flujo

```
                  ┌─────────────────────────┐
                  │ procesarConsumos(data)  │
                  └────────────┬────────────┘
                               │
                  ┌────────────▼────────────┐
                  │ 1. limpiarDatos()       │
                  │    - Validar ID         │
                  │    - Validar fecha      │
                  │    - Validar consumo    │
                  └────────────┬────────────┘
                               │
                  ┌────────────▼────────────┐
                  │ 2. eliminarDuplicados() │
                  │    - Clave: fecha+CTR   │
                  └────────────┬────────────┘
                               │
                  ┌────────────▼────────────┐
                  │ 3. sort(by fecha ASC)   │
                  └────────────┬────────────┘
                               │
                  ┌────────────▼────────────┐
                  │ setConsumosProcesados   │
                  └────────────┬────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
       ┌────────▼──────┐  ┌───▼────┐  ┌──────▼─────┐
       │ agruparPor... │  │detectar│  │calcular... │
       │ Periodo()     │  │Anomalías│  │Estadísticas│
       └───────────────┘  └────────┘  └────────────┘
              │               │              │
       consumosPorPeriodo  anomalias    estadisticas
```

#### Optimización de Performance

**useMemo Dependencies:**

- `consumosPorPeriodo`: Depende de `consumosProcesados` → recalcula solo cuando cambian los datos procesados
- `anomalias`: Depende de `consumosPorPeriodo` → recalcula solo cuando cambia la agrupación
- `estadisticas`: Depende de `consumosProcesados` → recalcula solo cuando cambian los datos

**Beneficio:** Con 10,000 registros, evita recálculos innecesarios. Solo se ejecutan servicios cuando sus dependencias realmente cambian.

---

### 7.2 `useImportarArchivos` - Gestión de Importación

**Ubicación:** `src/hooks/useImportarArchivos.ts` (101 líneas)

**Propósito:** Manejar importación de archivos CSV/JSON con validación, estados de carga y manejo de errores.

#### Interfaz del Hook

```typescript
interface UseImportarArchivosReturn {
  /** Resultado de la última importación */
  resultado: ResultadoImportacion | null;

  /** Estado de importación en curso */
  importando: boolean;

  /** Importar archivo y retornar datos válidos */
  importarArchivo: (archivo: File) => Promise<ConsumoEnergetico[]>;

  /** Limpiar resultado anterior */
  limpiarResultado: () => void;
}
```

#### Implementación con Manejo de Errores

```typescript
export const useImportarArchivos = (): UseImportarArchivosReturn => {
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);
  const [importando, setImportando] = useState(false);

  const importarArchivo = useCallback(async (archivo: File): Promise<ConsumoEnergetico[]> => {
    setImportando(true);
    setResultado(null);

    try {
      // Paso 1: Leer archivo con FileReader API
      const contenido = await leerArchivo(archivo);

      // Paso 2: Detectar formato por extensión
      const extension = archivo.name.split('.').pop()?.toLowerCase();

      let resultado: ResultadoImportacion;

      // Paso 3: Importar según formato
      switch (extension) {
        case 'csv':
          resultado = await importarCSV(contenido);
          break;
        case 'json':
          resultado = await importarJSON(contenido);
          break;
        default:
          throw new Error(`Formato no soportado: ${extension}`);
      }

      setResultado(resultado);
      setImportando(false);

      // Paso 4: Validar éxito
      if (!resultado.exito) {
        throw new Error(resultado.errores.join(', '));
      }

      return resultado.datos;
    } catch (error) {
      const mensajeError = error instanceof Error ? error.message : 'Error desconocido';

      setResultado({
        exito: false,
        registrosImportados: 0,
        errores: [mensajeError],
        datos: [],
      });

      setImportando(false);
      throw error; // Re-lanzar para que componente maneje
    }
  }, []);

  const limpiarResultado = useCallback(() => {
    setResultado(null);
  }, []);

  return {
    resultado,
    importando,
    importarArchivo,
    limpiarResultado,
  };
};
```

#### Helper: `leerArchivo()` - Promisificación de FileReader

```typescript
/**
 * Lee el contenido de un archivo como texto usando FileReader API
 * @param archivo - Archivo a leer
 * @returns Promise con el contenido del archivo
 */
const leerArchivo = (archivo: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const contenido = e.target?.result as string;
      resolve(contenido);
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    // Iniciar lectura
    reader.readAsText(archivo);
  });
};
```

#### Uso en Componentes

```typescript
const MiComponente = () => {
  const { importarArchivo, importando, resultado } = useImportarArchivos();
  const { procesarConsumos } = useProcesarDatos();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

    try {
      const datos = await importarArchivo(archivo);
      procesarConsumos(datos);
      // ✅ Datos importados y procesados
    } catch (error) {
      // ❌ Mostrar error al usuario
      console.error('Error al importar:', error);
    }
  };

  return (
    <>
      <input type="file" onChange={handleFileChange} disabled={importando} />
      {importando && <Spinner />}
      {resultado && !resultado.exito && (
        <Alert>{resultado.errores.join(', ')}</Alert>
      )}
    </>
  );
};
```

---

### 7.3 Hooks Específicos de Páginas

Los hooks de página encapsulan lógica específica de flujos complejos (importación + análisis + persistencia + navegación).

---

#### 7.3.1 `useFileLoader` - Carga de Derivaciones

**Ubicación:** `src/pages/ExpedienteTipoV/hooks/useFileLoader.ts` (110 líneas)

**Propósito:** Cargar archivos de derivación (45 columnas), validar estructura, ordenar columnas según estándar.

**Interfaz:**

```typescript
interface UseFileLoaderReturn {
  data: DerivacionData[]; // Datos cargados
  columns: string[]; // Columnas detectadas (ordenadas)
  loaded: boolean; // Flag de carga exitosa
  error: string | null; // Mensaje de error
  loadFile: (file: File) => Promise<void>;
  resetData: () => void;
  setData: (newData: DerivacionData[], newColumns: string[]) => void;
  setLoaded: (isLoaded: boolean) => void;
}
```

**Lógica de Ordenamiento de Columnas:**

```typescript
const loadFile = useCallback(async (file: File): Promise<void> => {
  setError(null);
  setLoaded(false);

  try {
    const resultado = await importarArchivoDerivacion(file);

    if (!resultado.exito || resultado.datos.length === 0) {
      throw new Error('No se pudo importar el archivo');
    }

    // Detectar columnas presentes
    const columnasPresentes = new Set<string>();
    resultado.datos.forEach((registro) => {
      Object.keys(registro).forEach((columna) => {
        if (columna) columnasPresentes.add(columna);
      });
    });

    // Paso 1: Ordenar según lista estándar (COLUMNAS_PERMITIDAS)
    const columnasOrdenadas = COLUMNAS_PERMITIDAS.filter((columna) =>
      columnasPresentes.has(columna)
    );

    // Paso 2: Agregar columnas extras (no estándar) al final, ordenadas alfabéticamente
    const columnasExtras = Array.from(columnasPresentes)
      .filter((columna) => !COLUMNAS_PERMITIDAS.includes(columna))
      .sort();

    const columnasFinales = [...columnasOrdenadas, ...columnasExtras];

    setColumns(columnasFinales);
    setData(resultado.datos);
    setLoaded(true);

    // Advertencias (no bloquean carga)
    if (resultado.advertencias.length > 0) {
      setError(resultado.advertencias.join('\n'));
    }
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'Error desconocido';
    setError(mensaje);
    setData([]);
    setColumns([]);
    setLoaded(false);
    throw err;
  }
}, []);
```

**Beneficio:** Columnas siempre ordenadas de forma predecible (estándar → extras alfabéticas).

---

#### 7.3.2 `useAnalysis` - Gestión de Análisis

**Ubicación:** `src/pages/ExpedienteTipoV/hooks/useAnalysis.ts` (75 líneas)

**Propósito:** Orquestar análisis completo (anual/mensual/anomalías) y gestionar vistas.

**Interfaz:**

```typescript
type VistaAnalisis = 'anual' | 'mensual' | 'listado' | 'grafico' | 'anomalia';

interface UseAnalysisReturn {
  resultado: ResultadoAnalisis | null;
  mostrandoAnalisis: boolean;
  vistaActual: VistaAnalisis;
  analisisHabilitado: boolean;
  ejecutarAnalisis: (datos: DerivacionData[], vistaInicial?: VistaAnalisis) => boolean;
  cambiarVista: (vista: VistaAnalisis) => void;
  habilitarAnalisis: () => void;
  resetAnalisis: () => void;
  setMostrandoAnalisis: (mostrar: boolean) => void;
}
```

**Lógica de Ejecución:**

```typescript
const ejecutarAnalisis = useCallback(
  (datos: DerivacionData[], vistaInicial: VistaAnalisis = 'anual'): boolean => {
    if (datos.length === 0) return false;

    try {
      // Ejecutar análisis completo (1027 líneas de lógica en servicio)
      const resultadoAnalisis = analizarConsumoCompleto(datos);

      setResultado(resultadoAnalisis);
      setMostrandoAnalisis(true);
      setVistaActual(vistaInicial);

      return true; // ✅ Análisis exitoso
    } catch {
      return false; // ❌ Error en análisis
    }
  },
  []
);
```

**Flujo de Vistas:**

```
Inicial: 'anual'
    │
    ├─→ 'mensual' (comparativa detallada)
    ├─→ 'listado' (tabla completa)
    ├─→ 'grafico' (visualización)
    └─→ 'anomalia' (detección)
```

**Uso en Componente:**

```typescript
const ExpedienteTipoV = () => {
  const { data, loadFile } = useFileLoader();
  const { ejecutarAnalisis, resultado, vistaActual, cambiarVista } = useAnalysis();

  const handleAnalizar = () => {
    const exito = ejecutarAnalisis(data);
    if (!exito) {
      alert('Error al analizar datos');
    }
  };

  return (
    <>
      <input type="file" onChange={(e) => loadFile(e.target.files[0])} />
      <button onClick={handleAnalizar} disabled={data.length === 0}>
        Analizar
      </button>

      {resultado && (
        <TabsVista vistaActual={vistaActual} cambiarVista={cambiarVista}>
          <VistaAnual datos={resultado.vistaAnual} />
          <VistaMensual datos={resultado.comparativaMensual} />
          <VistaAnomalias anomalias={resultado.anomalias} />
        </TabsVista>
      )}
    </>
  );
};
```

---

### 7.4 Patrón de Composición de Hooks

**Ejemplo: Orquestar múltiples hooks en un flujo completo**

```typescript
const MiPaginaCompleja = () => {
  // Hook 1: Importación de archivos
  const { importarArchivo, importando } = useImportarArchivos();

  // Hook 2: Procesamiento de datos
  const { procesarConsumos, anomalias, estadisticas } = useProcesarDatos();

  // Hook 3: Contexto global
  const { cargarConsumos, establecerAnomalias } = useAppContext();

  // Hook 4: Persistencia local
  const { guardar, recuperar } = usePersistencia();

  const handleImportarYProcesar = async (archivo: File) => {
    try {
      // Paso 1: Importar
      const datos = await importarArchivo(archivo);

      // Paso 2: Procesar
      procesarConsumos(datos);

      // Paso 3: Actualizar contexto global
      cargarConsumos(datos);
      establecerAnomalias(anomalias);

      // Paso 4: Persistir en localStorage
      guardar({ datos, anomalias, estadisticas });

      // ✅ Flujo completo ejecutado
    } catch (error) {
      console.error('Error en pipeline:', error);
    }
  };

  return (
    <div>
      <FileUploader onUpload={handleImportarYProcesar} loading={importando} />
      {/* ... resto del componente */}
    </div>
  );
};
```

---

### 7.5 Reglas de Hooks en ValorApp_v2

#### ✅ Buenas Prácticas

1. **Separación de responsabilidades:**
   - Hooks globales en `src/hooks/` (reutilizables)
   - Hooks específicos en `src/pages/*/hooks/` (lógica de página)

2. **Memoización obligatoria:**
   - `useMemo` para cálculos pesados (> 100ms)
   - `useCallback` para funciones pasadas como props

3. **Nombres descriptivos:**
   - `useImportarArchivos` ✅ (verbo + objeto)
   - `useData` ❌ (muy genérico)

4. **Retornar objetos (no arrays):**

   ```typescript
   // ✅ CORRECTO - nombres explícitos
   const { importarArchivo, importando } = useImportarArchivos();

   // ❌ INCORRECTO - orden importa
   const [importar, loading] = useImportarArchivos();
   ```

5. **Documentación JSDoc:**
   ```typescript
   /**
    * Hook para procesar datos de consumo energético
    * @returns Objeto con consumos procesados y métodos de procesamiento
    */
   export const useProcesarDatos = (): UseProcesarDatosReturn => {
     // ...
   };
   ```

#### ❌ Anti-Patrones a Evitar

1. **NO poner lógica de negocio en hooks:**

   ```typescript
   // ❌ INCORRECTO - lógica de negocio inline
   const anomalias = useMemo(() => {
     return consumos.filter((c) => c.consumo < promedio * 0.7);
   }, [consumos]);

   // ✅ CORRECTO - delegar a servicio
   const anomalias = useMemo(() => {
     return detectarAnomalias(consumosPorPeriodo);
   }, [consumosPorPeriodo]);
   ```

2. **NO crear hooks innecesarios:**

   ```typescript
   // ❌ INCORRECTO - hook trivial
   const useNumeroFormateado = (num: number) => {
     return useMemo(() => formatearNumero(num), [num]);
   };

   // ✅ CORRECTO - usar función directamente
   const numeroFormateado = formatearNumero(num);
   ```

3. **NO mezclar estado local y global sin razón:**

   ```typescript
   // ❌ INCORRECTO - duplicación de estado
   const [consumos, setConsumos] = useState([]);
   const { consumos: consumosGlobales } = useAppContext();

   // ✅ CORRECTO - usar solo contexto
   const { consumos } = useAppContext();
   ```

---

### 7.6 Hooks de SaldoATR (Específicos)

**Ubicación:** `src/pages/SaldoATR/hooks/`

#### `useSaldoATRBase`

- Carga archivo base de 46 columnas
- Validación de estructura estándar
- Detección de columnas faltantes/extras

#### `useFileImport`

- Mapeo de columnas personalizado
- Conversión de formatos de fecha
- Parseo de números con formato español (coma decimal)

**Ejemplo de uso conjunto:**

```typescript
const SaldoATR = () => {
  const { cargarBase, baseLoaded } = useSaldoATRBase();
  const { importarArchivoUsuario, mapearColumnas } = useFileImport();

  const handleImportar = async (archivoBase: File, archivoUsuario: File) => {
    // Paso 1: Cargar plantilla base
    await cargarBase(archivoBase);

    // Paso 2: Importar archivo usuario
    const datosUsuario = await importarArchivoUsuario(archivoUsuario);

    // Paso 3: Mapear columnas automáticamente
    const datosMapeados = mapearColumnas(datosUsuario, COLUMNAS_SALDO_ATR);

    // Paso 4: Procesar...
  };
};
```

---

## 8. Contexto Global

- `AppContext.tsx` + `AppContextDefinition.ts`
- Estado inicial:
  ```typescript
  const estadoInicial = {
    consumos: [],
    anomalias: [],
    periodoSeleccionado: null,
    datosCargados: false,
    procesando: false,
    error: null,
  };
  ```
- Acciones:
  - `cargarConsumos(consumos)`
  - `establecerAnomalias(anomalias)`
  - `seleccionarPeriodo(periodo)`
  - `establecerProcesando(flag)`
  - `establecerError(mensaje)`
  - `limpiarDatos()`
- Consumido vía `useAppContext()` (enganche en `src/context/useAppContext.ts`)

---

## 9. Páginas y Componentes

### 9.1 Páginas Principales

- `Home`: bienvenida, selección Fraude/Avería con botones animados
- `Averia`: opciones Wart/Error montaje/Error anomalía, navegación con `react-router-dom`
- `Wart`: flujo específico (detalle visual + interacciones)
- `ExpedienteTipoV`: contenedor principal de análisis (importación, limpieza, vistas, exportaciones, persistencia)
- `SaldoATR`: interfaz de 46 columnas, importación y mapeo CSV, análisis compartido

### 9.2 Componentes Destacados (`src/components`)

- `HeatMapConsumo`: matriz interactiva con 5 métricas
- `BannerClasificacionExpediente`: resumen visual del estado global
- `DeteccionAnomalia`: tarjetas informativas de anomalías
- `Button`, `ButtonTailwind`: botones con variantes (primary, secondary, outline)
- `TabsVista`, `VistaAnual`, `VistaMensual`, `VistaAnomalias`, `VistaGrafico`, `VistaListado`
- `AlertMessages`, `AnalysisHeader`, `FileUploadSection`, `DataTable`

### 9.3 Patrón de Componentes

- Carpeta propia + `index.ts` (barrel export)
- Estilos locales `.css` con variables CSS corporativas
- Props tipados con interfaces desde `src/types`

---

## 10. Utilidades (src/utils/index.ts)

Funciones clave:

- Formateo: `formatearFecha`, `formatearNumero`, `redondear`
- Cálculos: `calcularPromedio`, `calcularMediana`, `calcularDesviacionEstandar`, `calcularVariacionPorcentual`
- Validaciones: `esNumeroValido`, `esFechaValida`, `esPeriodoValido`
- Colores: `calcularColorHeatMap`, `calcularColorTexto`, `obtenerColorSeveridad`, `obtenerColorTendencia`
- Helpers: `generarId`, `esperar`, `descargarArchivo`
- Conversión de números con formato español: `convertirNumeroEspañol`
- Extracción de año/mes y cálculo de días desde fechas en formato DD/MM/YYYY

---

## 11. Reglas de Negocio Críticas

1. **Umbrales de anomalía:** 15%, 30%, 5 kWh, 2σ
2. **Anulación de facturas:** estados con palabras clave (“ANULADA”, “ANULADOR”, “COMPLEMENTARIA”, “SUSTITUIDA”, “SUSTITUYENTE”)
3. **Normalización:** consumos convertidos a 30 días para evitar falsos descensos
4. **Estacionalidad:** ceros esperados detectados comparando histórico
5. **Clasificación:** considera descensos, potencia, ceros, recuperaciones, z-score
6. **Persistencia:** límites de tamaño, manejo de errores al guardar/cargar
7. **Visualización:** colores corporativos obligatorios (no hardcode)

---

## 12. Sistema de Diseño y Variables CSS

- Variables definidas en `src/index.css`:
  ```css
  :root {
    --color-primary: #0000d0;
    --color-secondary: #ff3184;
    --color-white: #ffffff;
    --color-light-gray: #f5f5f5;
    --color-medium-gray: #d9d9d9;
    --color-dark-gray: #333333;
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    --spacing-2xl: 3rem;
    --spacing-3xl: 4rem;
  }
  ```
- `src/constants/design.ts` expone colores, espaciados, radios de borde, transiciones, breakpoints
- Reglas: siempre usar `var(--color-...)` en CSS, respetar paleta corporativa

---

## 13. Convenciones de Código

- Tipos centralizados (`src/types/index.ts`) – sin duplicado
- Imports de tipos con `import type { ... }`
- Hooks prefijo `use`, funciones en español, componentes PascalCase
- Barrel exports (`index.ts`) por carpeta
- Componentes < 200 líneas (si excede, dividir)
- JSDoc obligatorio en funciones públicas
- Sin `console.log` en producción (usar `loggerService`)
- Orden de imports: externos → internos → tipos → estilos

---

## 14. Dependencias y Herramientas

### 14.1 Dependencias principales

- `react`, `react-dom`, `react-router-dom`
- `typescript`, `vite`
- `lucide-react` (iconos)
- `recharts` (gráficos)
- `xlsx` (exportación Excel)

### 14.2 Dev dependencies

- ESLint 9, Prettier, Husky, lint-staged
- Tailwind PostCSS, autoprefixer
- `@vitejs/plugin-react`

### 14.3 Scripts (`package.json`)

- `dev`, `build`, `preview`
- `lint`, `lint:fix`
- `format`, `format:check`
- `type-check`, `validate`
- `clean`, `prepare` (husky)

---

## 15. Workflows Completos

### 15.1 Pipeline principal (importación → análisis)

1. Usuario selecciona archivo CSV/JSON
2. `useImportarArchivos.importarArchivo()` → `importService` → valida, parsea
3. Resultado enviado a `useProcesarDatos.procesarConsumos()`
4. Pipeline: limpiar → deduplicar → ordenar → agrupar
5. `anomaliaService` detecta anomalías
6. Estado global se actualiza (`AppContext`)
7. Componentes se renderizan con datos memorizados

### 15.2 Detección de inicio de anomalía

1. `generarComparativaMensual` produce `ConsumoMensual[]`
2. `detectarInicioAnomalia(comparativa)` analiza normalización, baseline, histórico
3. Devuelve clasificación con confianza y detalles técnicos
4. `clasificarExpediente` combina interpretación global

### 15.3 Interfaz Saldo ATR

1. Carga plantilla base (46 columnas) vía `useSaldoATRBase`
2. Importación CSV 14 columnas → mapeo a columnas objetivo (A, C, G, H, I, J, P ...)
3. Filtrado y ordenación por fechas (DD/MM/YYYY)
4. Generación de registros derivación (para análisis compartido)
5. Integración con vistas de ExpedienteTipoV (reutilización de componentes)

### 15.4 Exportaciones

- `exportacionService`: construye archivos Excel con múltiples hojas y formato
- `exportarCSV`/`JSON`: usa helpers de utils para descarga

---

## 16. Formatos de Datos

### 16.1 CSV Básico (Consumos simplificados)

```
fecha,consumo,numeroContador,cliente,periodo
2024-01-15,245.5,CTR001,Cliente A,2024-01
2024-02-15,238.2,CTR001,Cliente A,2024-02
```

### 16.2 Derivación Individual (macro VBA)

- 45 columnas (A..AS), incluye campos reactivas, maxímetros, consumos por periodo, fuentes

### 16.3 Saldo ATR (14 columnas → 46 columnas)

- Mapeo definido en `UI-README.md` y `src/pages/SaldoATR`
- Validaciones: número de columnas, encabezados, datos obligatorios

---

## 17. Performance y Optimización

- Lazy loading de páginas (`React.lazy`, `Suspense`)
- Memoización (`useMemo`, `useCallback`) en hooks
- Calculadoras puras para evitar recomputación
- Virtualización de tablas (pendiente o planificada)
- Limitación de logs en producción
- Agrupación en memoria optimizada (uso de objetos y arrays ordenados)

---

## 18. Testing y Validación

- **Actual:** No hay pruebas automatizadas integradas
- **Recomendaciones:**
  - Unit tests con Vitest/React Testing Library para servicios críticos
  - Validaciones de importación y detección de anomalías
  - Tests de regresión visual para componentes (Chromatic/Storybook)
- Scripts sugeridos: `npm run test` (pendiente)

---

## 19. Deployment y Build

- `npm run build`: `tsc -b` + `vite build`
- `vite preview`: servidor de previsualización
- `vercel.json`: configuración para despliegue en Vercel (SPA: redirects al index)
- `npm run clean`: eliminar `dist`
- Build genera assets estáticos listos para Netlify/Vercel/Static hosting

---

## 20. Antipatrones y Mejores Prácticas

### 20.1 No Permitido

- Backend/API
- Redux (usar Context API)
- Duplicar tipos
- Hardcodear colores
- Lógica de negocio en componentes
- `console.log` en producción
- Componentes > 200 líneas sin refactorizar

### 20.2 Recomendado

- Mantener SOLID (SRP en servicios)
- Importaciones ordenadas y consistentes
- Reutilización de hooks y servicios
- Documentar con JSDoc
- Extraer lógica repetitiva a utils/services

---

## 21. Roadmap y Mejoras Futuras

1. Integrar gráficos avanzados (Recharts completo, Chart.js)
2. Exportación a PDF/Excel enriquecido
3. Filtros avanzados por cliente, periodo, severidad
4. Comparativas múltiples de contadores
5. Predicción (ML básico)
6. Modo oscuro manteniendo paleta corporativa
7. Test unitarios e2e automatizados
8. Configuración externa de umbrales (archivo JSON)

---

## 22. Referencias y Documentación

- `ARCHITECTURE.md`: guía arquitectónica completa (1462 líneas)
- `docs/ANALISIS_COMPLETO_VBA.md`: análisis profundo de macros VBA
- `UI-README.md`: detalle de la interfaz y flujos
- `src/services/`: lógica de negocio detallada
- `src/utils/`: helpers reutilizables
- `src/types/`: contratos de datos

---

**Conclusión:** ValorApp_v2 ofrece una arquitectura robusta, modular y alineada con las mejores prácticas modernas de React + TypeScript, reproduciendo fielmente la lógica crítica de las macros Excel y preparando el terreno para refactorizaciones evolutivas y mejoras futuras.
