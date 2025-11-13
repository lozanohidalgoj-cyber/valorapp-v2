# PLAN DE ACCIÓN VALORAPP_V2

Fecha: 2025-11-13
Rama base: `refactorizacion`

Este documento define un plan de acción exhaustivo y priorizado para la evolución de ValorApp_v2 durante los próximos ciclos de desarrollo. Se estructura en Fases, Épicas, Objetivos medibles, Roadmap trimestral, Criterios de Aceptación y Riesgos.

---

## 1. Principios Rectores y Filosofía de Desarrollo

### 1.1 Arquitectura Client-Side First

**Justificación:** Los datos provienen de macros Excel que generan CSV/JSON puntuales. No hay necesidad de persistencia ni colaboración multiusuario en esta etapa.

**Beneficios:**

- ✅ Deployment simplificado (solo archivos estáticos)
- ✅ Zero latencia de red en procesamiento
- ✅ Usuario mantiene control total de sus datos (privacidad)
- ✅ Costos de infraestructura = $0

**Límites identificados:**

- ⚠️ Volumen máximo recomendado: ~50,000 registros (navegadores modernos)
- ⚠️ No hay sincronización entre dispositivos
- ⚠️ Sin auditoría persistente de cambios

### 1.2 Código Limpio y Mantenibilidad

**Regla de complejidad:** Ningún archivo debe superar 600 líneas. Si excede, refactorizar en módulos cohesivos.

**Estándares de calidad:**

```typescript
// ✅ BUENO: Función pura, testeable, documentada
/**
 * Calcula Z-Score de un valor en una ventana temporal
 * @param valor - Valor actual a evaluar
 * @param ventana - Valores históricos (últimos N periodos)
 * @returns Z-Score normalizado
 */
export const calcularZScore = (valor: number, ventana: number[]): number => {
  if (ventana.length === 0) return 0;
  const promedio = calcularPromedio(ventana);
  const desviacion = calcularDesviacionEstandar(ventana);
  return desviacion === 0 ? 0 : (valor - promedio) / desviacion;
};

// ❌ MALO: Lógica mezclada con efectos secundarios
const calcularYActualizar = (valor: number) => {
  const resultado = valor * 2; // lógica
  setEstado(resultado); // efecto secundario
  console.log(resultado); // log en producción
  return resultado;
};
```

### 1.3 Observabilidad y Debugging

**Sistema de logging estructurado:**

```typescript
// src/services/loggerService.ts (versión mejorada)
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  stack?: string;
}

class Logger {
  private buffer: LogEntry[] = [];
  private maxBufferSize = 100;

  log(level: LogLevel, message: string, context?: LogContext) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    this.buffer.push(entry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    if (import.meta.env.DEV || level === 'error') {
      this.emitToConsole(entry);
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.buffer, null, 2);
  }
}

export const logger = new Logger();

// Uso:
logger.log('info', 'Análisis iniciado', {
  registros: 1234,
  periodo: '2024-01 a 2024-12',
});
```

### 1.4 Performance como Prioridad

**Métricas objetivo:**

- 🎯 First Contentful Paint: < 1.5s
- 🎯 Time to Interactive: < 3s
- 🎯 Cálculo comparativa mensual (10k registros): < 300ms
- 🎯 Bundle JavaScript inicial: < 250KB gzip

**Estrategias:**

1. **Code Splitting:** Lazy load de páginas y componentes pesados
2. **Memoización:** `useMemo` para cálculos costosos
3. **Virtualización:** Tablas grandes con `react-window`
4. **Web Workers:** Offload de cálculos a thread separado (si >200ms)

### 1.5 Escalabilidad Futura

**Preparar para:**

- 📊 Visualizaciones interactivas (Recharts/D3.js)
- 🔮 Predicciones básicas (promedio móvil + estacionalidad)
- 📄 Exportaciones profesionales (Excel multi-hoja + PDF branded)
- 🌙 Temas personalizables (Dark Mode)
- 🧪 Machine Learning simple (si datos históricos suficientes)

### 1.6 Principio DRY (Don't Repeat Yourself)

**Ejemplo de violación detectada:**

```typescript
// ❌ ANTES: Código duplicado en 3 servicios
const consumoNormalizado1 = (consumo / dias) * 30;
const consumoNormalizado2 = (consumo / dias) * 30;
const consumoNormalizado3 = (consumo / dias) * 30;

// ✅ DESPUÉS: Función reutilizable
export const normalizarA30Dias = (consumo: number, dias: number): number => {
  return dias === 0 ? 0 : (consumo / dias) * 30;
};
```

---

## 2. Resumen Ejecutivo de Fases

| Fase | Objetivo Macro               | Duración estimada | Resultado clave                   |
| ---- | ---------------------------- | ----------------- | --------------------------------- |
| F1   | Saneamiento + Modularización | 2 semanas         | Código segmentado y testeable     |
| F2   | Testing + Calidad            | 2 semanas         | Cobertura ~60% servicios críticos |
| F3   | Performance y UX             | 3 semanas         | Reducción bundle ≥25%, UX fluida  |
| F4   | Visualización avanzada       | 3 semanas         | Gráficos interactivos (Recharts)  |
| F5   | Exportación & Informe        | 2 semanas         | Exportación Excel+PDF completa    |
| F6   | Predicción básica            | 4 semanas         | Algoritmo simple forecast mensual |
| F7   | Observabilidad & Modo Oscuro | 2 semanas         | Logging mejorado + Dark Theme     |
| F8   | Revisión Estratégica         | 1 semana          | Evaluación para posible backend   |

---

## 3. Épicas y Objetivos Detallados

### Épica A: Modularización y Refactor

- Dividir `analisisConsumoService.ts` (>1000 líneas) en submódulos: `anualService`, `mensualService`, `estadisticaService`, `motivosService`.
- Reducir longitud de `clasificadorExpedienteService.ts` (1136 líneas) aplicando estrategia de motores de reglas declarativas.
- Extraer constantes de umbrales a `src/constants/umbrales.ts`.
- Adoptar patrón de “pipelines” para secuencias (normalizar → agrupar → detectar → clasificar).

### Épica B: Test y Calidad

- Introducir Vitest + React Testing Library.
- Suites prioritarias:
  1. `anomaliaService` (umbrales y detecciones)
  2. `detectarInicioAnomaliaService` (descenso sostenido + estacionalidad)
  3. `clasificadorExpedienteService` (categorías correctas)
  4. `importService` (CSV/JSON happy & failure paths)
- Incorporar pruebas de regresión sobre algoritmo de normalización.
- Configurar workflow CI (GitHub Actions) para `lint` + `test`.

### Épica C: Performance

- Medir tiempo de cálculo de comparativa mensual con dataset grande (≥10k filas sintetizadas).
- Implementar memoización granular de ventanas móviles (zScore, tendencia).
- Evaluar uso de Web Worker para cálculos pesados (opcional si >200ms).
- Code splitting de páginas: cada vista bajo `React.lazy` con chunk independiente.
- Remplazar funciones repetidas de parseo por utilidades especializadas.

### Épica D: Visualización Avanzada

- Integrar Recharts: LineChart, BarChart, HeatMap custom.
- Componente `GraficoComparativo` para consumo vs. promedio vs. bandas σ.
- Tooltip contextual con: periodo, consumo normalizado, zScore, índice estacional.
- Selector de métrica (estado centralizado) compartido entre gráfico y matriz.

### Épica E: Exportaciones Profesionales

- `exportacionService`: añadir hoja “Resumen” (totales, variaciones, primeras anomalías).
- Generar informe PDF (jsPDF) con plantilla corporativa (logo, colores primary/secondary).
- Incluir tabla de anomalías ordenada por severidad.
- Agregar metadatos (fecha de generación, versión app, número de registros).

### Épica F: Predicción Básica

- Implementar forecast naive:
  - Promedio móvil de últimos 3 meses.
  - Ajuste estacional: multiplicar por índice estacional histórico.
  - Banda de confianza ±1σ.
- Tipo `PrediccionMes` en `types/`.
- Visualización: línea punteada “Pronóstico” + área de confianza.

### Épica G: Observabilidad y Dark Mode

- Extender `loggerService` a niveles: debug/info/warn/error + canal buffer.
- Modo oscuro:
  - Variables CSS: `--color-bg-dark`, `--color-text-light`.
  - Toggle persistente (localStorage).
  - Validar contraste ≥ AA.

### Épica H: Evaluación Estratégica Backend

- Criterios de migración:
  - Volumen promedio de registros >100k
  - Necesidad de compartir expedientes entre usuarios
  - Requerimiento de auditoría persistente
- Propuesta ligera: API serverless (Edge Functions) para carga masiva y almacenamiento histórico.

---

## 4. Roadmap Trimestral (Q4 2025 – Q1 2026)

| Semana | Actividades                                   | Entregables                |
| ------ | --------------------------------------------- | -------------------------- |
| 1      | Modularización inicial (Épica A)              | Servicios segmentados      |
| 2      | Refactor clasificador + constantes            | `umbrales.ts`, tests smoke |
| 3      | Setup Vitest + primeras pruebas (Épica B)     | CI verde                   |
| 4      | Performance profiling + memoización (Épica C) | Report métricas base       |
| 5      | Code splitting + lazy imports                 | Chunks reducidos           |
| 6      | Integrar Recharts (líneas + barras) (Épica D) | Gráficos MVP               |
| 7      | HeatMap optimizado + tooltips                 | Interacciones fluidas      |
| 8      | Exportación Excel extendida (Épica E)         | Archivo multi-hoja         |
| 9      | Informe PDF básico                            | PDF corporativo            |
| 10     | Predicción naive (Épica F)                    | Pronósticos visibles       |
| 11     | Dark Mode + logger avanzado (Épica G)         | Toggle + logs              |
| 12     | Revisión estratégica backend (Épica H)        | Informe evaluación         |

---

## 5. Backlog Priorizado (MoSCoW)

### MUST

- Refactor de servicios gigantes (>900 líneas).
- Tests en detección de anomalías y clasificación expediente.
- Exportación Excel robusta.
- Performance memo de ventanas.

### SHOULD

- Visualizaciones avanzadas (Recharts).
- Predicción simple.
- Logger estructurado.

### COULD

- Informe PDF con branding avanzado.
- Web Worker para cálculos.
- Modo oscuro.

### WON'T (por ahora)

- Migración a backend persistente.
- Algoritmos ML complejos (ARIMA, LSTM).
- Multi-usuario colaborativo.

---

## 6. Métricas de Éxito

| Área        | Métrica                               | Objetivo              |
| ----------- | ------------------------------------- | --------------------- |
| Código      | Complejidad ciclomat. por servicio    | < 15 promedio         |
| Performance | Tiempo análisis mensual (10k filas)   | < 300 ms              |
| Bundle      | Tamaño JS inicial                     | < 250 KB gzip         |
| Calidad     | Cobertura pruebas servicios críticos  | ≥ 60%                 |
| UX          | Tiempo interactivo inicial            | < 2 s local dev       |
| Exportación | Tiempo generación Excel               | < 2 s (10k filas)     |
| Detección   | Precisión umbrales (falsos positivos) | < 10% dataset control |
| Predicción  | Error MAPE simple                     | < 25%                 |

---

## 7. Criterios de Aceptación por Épica

### A (Modularización)

- Archivos divididos sin introducir efectos secundarios.
- Tipos reusados desde `types/index.ts` sin duplicados.
- Tests smoke pasan tras refactor.

### B (Testing)

- Scripts: `npm run test` + `npm run test:watch`.
- Al menos 4 suites cubren casos borde y normales.
- CI falla si cobertura < objetivo.

### C (Performance)

- Report antes/después en `docs/PERFORMANCE.md`.
- Profiling muestra reducción de re-cálculos.

### D (Visualización)

- Gráficos responden a selección de métricas.
- Tooltips con datos clave (consumo normalizado, zScore, índice estacional).

### E (Exportación)

- Archivo Excel abre y conserva tipos numéricos.
- Hoja Resumen incluye anomalías y KPIs.

### F (Predicción)

- Pronósticos visibles con banda ±1σ.
- Informe `docs/PREDICCION.md` explicando método.

### G (Dark/Logger)

- Toggle persiste tras refresh.
- Logs supuestos filtrables por nivel.

### H (Estrategia Backend)

- Documento `docs/EVALUACION_BACKEND.md` con decisión justificada.

---

## 8. Riesgos y Mitigaciones

| Riesgo                       | Impacto | Mitigación                                      |
| ---------------------------- | ------- | ----------------------------------------------- |
| Refactor rompe lógica        | Alto    | Tests smoke previos + refactor incremental      |
| Falta de datos de prueba     | Medio   | Generador sintético de consumos variados        |
| Bundle crece con librerías   | Medio   | Evaluar alternativa ligera (lightweight charts) |
| Predicción mal interpretada  | Bajo    | Etiquetar claramente “Estimación orientativa”   |
| Falta de disciplina de tests | Alto    | Política PR: requiere tests asociados           |
| Dark Mode reduce contraste   | Medio   | Auditoría WCAG antes de merge                   |

---

## 9. Dependencias Técnicas Nuevas (propuestas)

| Librería                 | Uso                        | Alternativa                          |
| ------------------------ | -------------------------- | ------------------------------------ |
| `vitest`                 | Testing unitario           | Jest (más pesado)                    |
| `@testing-library/react` | Testing componentes        | react-test-renderer                  |
| `recharts`               | Gráficos interactivos      | chart.js (menos integrado con React) |
| `xlsx`                   | Exportación Excel avanzada | SheetJS (ya implícito)               |
| `jspdf`                  | Informe PDF                | PDF-LIB (similar)                    |

---

## 10. Plan de Refactor de Archivos Grandes

| Archivo                            | Líneas | Nuevo Diseño                                                                                                   |
| ---------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| `analisisConsumoService.ts`        | ~1027  | `anualService.ts`, `mensualService.ts`, `estadisticaService.ts`, `motivosService.ts`                           |
| `clasificadorExpedienteService.ts` | ~1136  | `clasificadorBase.ts`, `reglasClasificacion.ts`, `motorClasificacion.ts`                                       |
| `detectarInicioAnomaliaService.ts` | ~945   | `normalizacionService.ts`, `bloquesDescensoService.ts`, `estacionalidadService.ts`, `inicioAnomaliaService.ts` |

---

## 11. Generación de Datos Sintéticos (para Performance / Test)

### Estrategia

- Script generador (pendiente) en `scripts/generar-datos.ts`.
- Parámetros: número de meses, variabilidad, picos, ceros estacionales.
- Output: CSV + JSON (consumos + derivación simulada).

### Parámetros Ejemplo

```json
{
  "meses": 36,
  "contadores": 3,
  "probabilidadPico": 0.08,
  "probabilidadCeroEstacional": 0.12,
  "variacionPromedio": 0.15
}
```

---

## 12. Guía de Contribución Simplificada

1. Crear rama feature: `feature/<breve-descripcion>`.
2. Implementar cambios respetando tipos centralizados.
3. Agregar/actualizar tests y documentación.
4. Ejecutar: `npm run lint && npm run test`.
5. PR con descripción: Motivación, Cambios clave, Riesgos.
6. Revisión: otro dev valida criterios de aceptación.

---

## 13. Checklist de PR Actualizado

- [ ] Refactor sigue convención de nombres español descriptivo.
- [ ] No hay duplicación de tipos.
- [ ] No se usan colores hardcodeados.
- [ ] Tests agregados / actualizados.
- [ ] Documentación extendida (si aplica).
- [ ] Sin `console.log` (solo `loggerService`).
- [ ] Lint y build pasan.

---

## 14. Próximos Documentos Derivados

| Documento               | Propósito                        |
| ----------------------- | -------------------------------- |
| `PERFORMANCE.md`        | Benchmark antes/después refactor |
| `PREDICCION.md`         | Explicación método de forecast   |
| `EVALUACION_BACKEND.md` | Criterios y decisión             |
| `METRICAS_CALIDAD.md`   | Evolución de métricas clave      |
| `GUIA_VISUALIZACION.md` | Patrones y componentes gráficos  |

---

## 15. Conclusión

Este plan permite evolucionar ValorApp_v2 de forma estructurada, minimizando riesgos mientras se incrementa mantenibilidad, performance y valor funcional. La ejecución disciplinada de las fases asegurará una base sólida para futuras expansiones (predicción avanzada, colaboración multiusuario o migración backend). El enfoque incremental con métricas y documentación continua garantiza transparencia y control sobre la evolución del sistema.

---

**Fin del documento.**
