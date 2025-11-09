/\*\*

- 🎯 SISTEMA DE DETECCIÓN DE INICIO DE ANOMALÍA - DOCUMENTACIÓN COMPLETA
-
- Implementación del detector experto de anomalías energéticas
- Categoriza en 3 resultados únicos: Sin Anomalía, Indeterminado, o Anomalía Detectada
  \*/

// ============================================================================
// 📊 RESUMEN DE CAMBIOS Y CARACTERÍSTICAS IMPLEMENTADAS
// ============================================================================

/\*\*

- NUEVOS ARCHIVOS CREADOS:
- ✅ src/services/detectarInicioAnomaliaService.ts (420 líneas)
- - Sistema experto multicriterio para detección de anomalías
- - 5 funciones de análisis independientes
- - Retorna clasificación única (NO todas las anomalías)
-
- ARCHIVOS MODIFICADOS:
- ✅ src/components/HeatMapConsumo/HeatMapConsumo.tsx
- - Integración de detectarInicioAnomalia
- - Estado para almacenar resultado
- - useEffect para calcular al cargar datos
- - Banner visual con resultado
-
- ✅ src/components/HeatMapConsumo/HeatMapConsumo.css
- - Estilos para 3 variantes de banner
- - Animación de aparición
- - Responsive design
    \*/

// ============================================================================
// 🔍 CRITERIOS DE DETECCIÓN (Reglas del Sistema Experto)
// ============================================================================

/\*\*

- El sistema evalúa en este orden (primero que coincida, se reporta):
-
- REGLA 1️⃣ - DESCENSO BRUSCO (Mes a Mes)
- ────────────────────────────────────────
- CRITERIO: Caída ≥ 30% en consumo activa respecto mes anterior
- CONFIANZA: 95%
- EJEMPLO:
- - Febrero: 500 kWh
- - Marzo: 320 kWh
- - Variación: -36%
- → ⚠️ "Determinación del descenso en marzo 2024"
-
- PRECONDICIONES:
- - Consumo anterior > 0
- - Variación ≤ -30%
- - Al menos 3 facturas previas válidas para estimar baseline (si no, se marca como período indeterminado)
-
- VALOR AGREGADO:
- - Tipo de ciclo de facturación detectado (mensual, bimestral, etc.)
- - Variación exacta reportada
-
-
- REGLA 2️⃣ - DESCENSO SOSTENIDO (3+ Meses Consecutivos)
- ──────────────────────────────────────────────────────
- CRITERIO: Caída >10% durante 3 meses consecutivos (indicador de averías)
- CONFIANZA: 85%
- EJEMPLO:
- - Enero: 500 kWh
- - Febrero: 450 kWh (-10%)
- - Marzo: 405 kWh (-10%)
- - Abril: 365 kWh (-10%)
- → ⚠️ "Determinación del descenso en febrero 2024 (descenso sostenido 3 meses)"
-
- INTERPRETACIÓN:
- - No es un mes bajo aislado, es un patrón
- - Sugiere baja de contrato o avería sistémica
-
-
- REGLA 3️⃣ - VARIACIÓN HISTÓRICA (vs. Mismo Mes de Años Anteriores)
- ─────────────────────────────────────────────────────────────────
- CRITERIO: Variación >20% respecto promedio histórico del mismo mes
- CONFIANZA: 80%
- EJEMPLO:
- - Enero (promedio histórico años pasados): 480 kWh
- - Enero (año actual): 360 kWh (-25%)
- → ⚠️ "Determinación del descenso en enero 2024"
- 📍 "Descenso > 20% respecto al promedio histórico de enero"
-
- VALOR: Detecta cambios de comportamiento respecto a estacionalidad
-
-
- REGLA 4️⃣ - CONSUMO CERO SOSPECHOSO (Desvío del Patrón)
- ────────────────────────────────────────────────────
- CRITERIO: Consumo = 0 en mes donde NUNCA antes ocurrió
- CONFIANZA: 70%
- EJEMPLO:
- - 2023-01: 450 kWh
- - 2023-02: 480 kWh
- - ...
- - 2024-02: 0 kWh (por primera vez en febrero)
- → ⚠️ "Determinación del descenso en febrero 2024 (consumo cero sospechoso)"
-
- DIFERENCIACIÓN:
- - CERO ESPERADO: Ocurre en mismo mes años anteriores (vacacional, etc)
- - CERO SOSPECHOSO: Nunca ocurrió antes (posible fraude/avería)
-
- PREGUNTA USUARIO: ¿Hubo baja de contrato en esta fecha?
- - SÍ → Normal (pero revisar regularizaciones posteriores)
- - NO → Posible fraude o error técnico
-
-
- SIN ANOMALÍA ✅
- ───────────────
- CRITERIO: No cumple ninguno de los 4 criterios anteriores
- CONFIANZA: 90%
- CASOS VÁLIDOS:
- ✅ Cambios < 10% mes a mes (variabilidad normal)
- ✅ Descenso 1-2 meses, luego recuperación (lecturas parciales)
- ✅ Mismo mes bajo todos los años (estacionalidad comprobada)
- ✅ Consumo estable bajo (cliente de bajo consumo)
- ✅ Aumento lento por crecimiento (no es descenso)
- ✅ Datos incompletos (no suficiente histórico)
-
-
- PERÍODO INDETERMINADO ❓
- ────────────────────────
- CRITERIO: Datos insuficientes para análisis
- CONFIANZA: Variable
- CASOS:
- ❓ < 2 periodos de datos (imposible comparar)
- ❓ Ciclo de facturación muy irregular
- ❓ Faltan datos de referencia histórica
  \*/

// ============================================================================
// 🎯 FLUJO DE EJECUCIÓN
// ============================================================================

/\*\*

- PASO 1: CARGA DE DATOS
- ─────────────────────
- El usuario importa CSV/JSON con datos de derivación
- analisisConsumoService.analizarConsumoCompleto()
- ↓ genera: ConsumoMensual[] (datos agregados por mes)
-
-
- PASO 2: DETECCIÓN AUTOMÁTICA (En HeatMapConsumo.tsx)
- ─────────────────────────────────────────────────────
- useEffect(() => {
- const resultado = detectarInicioAnomalia(datos);
- setResultadoAnomalia(resultado);
- }, [datos]);
-
- Se ejecuta AUTOMÁTICAMENTE cuando:
- - Se cargan datos iniciales
- - Se selecciona otra métrica
- - Los datos cambian
-
-
- PASO 3: CLASIFICACIÓN ÚNICA
- ────────────────────────────
- detectarInicioAnomalia(comparativa) → ResultadoDeteccionInicio {
- clasificacion: 'sin_anomalia' | 'anomalia_detectada' | 'periodo_indeterminado'
- mensaje: string (legible para usuario)
- periodoInicio?: string (formato '2024-03')
- periodoLegible?: string (formato 'marzo 2024')
- razon: string (factor detectado)
- confianza: number (0-100%)
- detalles: Record<string, unknown> (debugging)
- }
-
-
- PASO 4: VISUALIZACIÓN (Banner en HeatMap)
- ──────────────────────────────────────────
- 3 variantes de banner CSS según clasificación:
-
- ✅ sin_anomalia:
- - Fondo verde claro
- - Border izquierdo verde
- - Mensaje: "No se detectaron anomalías"
-
- ⚠️ anomalia_detectada:
- - Fondo rojo claro
- - Border izquierdo rojo
- - Mensaje: "Determinación del descenso en [mes/año]"
- - Muestra: Razón, Periodo, Confianza
-
- ❓ periodo_indeterminado:
- - Fondo naranja claro
- - Border izquierdo naranja
- - Mensaje: "Datos insuficientes"
- - Solicita análisis manual por horas
    \*/

// ============================================================================
// 💾 ESTRUCTURA DE DATOS
// ============================================================================

/\*\*

- INPUT: ConsumoMensual[] (Array de datos mensuales)
- ────────────────────────────────────────────────
- Cada elemento contiene:
- {
- año: number
- mes: number (1-12)
- periodo: "2024-01"
- consumoActivaTotal: number (kWh P1+P2+P3)
- promedioActivaTotal: number
- maximetroTotal: number (kW)
- energiaReconstruidaTotal: number (kWh A+B+C)
- consumoPromedioDiario: number (kWh/día)
- dias: number
- variacionPorcentual: number | null
- esAnomalia: boolean (criterio 40% anterior)
- tipoVariacion: 'aumento' | 'descenso' | 'estable' | null
- motivosAnomalia: string[]
- registros: number
- }
-
-
- OUTPUT: ResultadoDeteccionInicio
- ─────────────────────────────────
- Resultado único con:
- - Clasificación (enum 3 valores)
- - Mensaje legible
- - Periodo de inicio (si detectó anomalía)
- - Razón/factor
- - Confianza porcentual
- - Detalles técnicos para debugging
    \*/

// ============================================================================
// 🔧 IMPLEMENTACIÓN TÉCNICA
// ============================================================================

/\*\*

- ARCHIVO: src/services/detectarInicioAnomaliaService.ts
- ──────────────────────────────────────────────────────
-
- FUNCIONES EXPORTADAS:
-
- 1.  detectarInicioAnomalia(comparativa: ConsumoMensual[])
- ├─ Entrada: Array de datos mensuales
- ├─ Salida: ResultadoDeteccionInicio
- └─ Lógica:
-        ├─ Itera 4 reglas en orden de prioridad
-        ├─ Retorna al encontrar primer match
-        └─ Si no hay match → "Sin anomalía"
-
- 2.  formatearResultadoDeteccion(resultado)
- ├─ Entrada: ResultadoDeteccionInicio
- ├─ Salida: string formateado
- └─ Uso: Debug en consola
-
-
- FUNCIONES INTERNAS:
-
- detectarCicloFacturacion(dias: number) → string
- - Convierte días → tipo de ciclo
- - Valores posibles:
-     • 'mensual' (25-35 días)
-     • 'bimestral' (50-70 días)
-     • 'trimestral' (75-105 días)
-     • etc.
-
- calcularPromedioHistoricoMes(comparativa, mes, año) → number
- - Busca todos los años anteriores
- - Filtra por mes especificado
- - Excluye consumo = 0
- - Retorna promedio
-
- hayDescensoSostenido(comparativa, indice) → { detectado, duracionMeses }
- - Analiza hacia atrás desde índice
- - Busca 3+ descensos consecutivos > 10%
- - Retorna duración si aplica
-
- esCeroEsperado(comparativa, mes, año) → boolean
- - Revisa si en años anteriores hubo cero en ese mes
- - true → Es patrón histórico
- - false → Sospechoso (primera vez)
    \*/

// ============================================================================
// 🎨 INTEGRACIÓN EN UI (HeatMapConsumo)
// ============================================================================

/\*\*

- CAMBIOS EN: src/components/HeatMapConsumo/HeatMapConsumo.tsx
- ─────────────────────────────────────────────────────────────
-
- IMPORT:
- import { detectarInicioAnomalia, type ResultadoDeteccionInicio }
- from '../../services/detectarInicioAnomaliaService';
-
-
- ESTADO:
- const [resultadoAnomalia, setResultadoAnomalia] = useState<ResultadoDeteccionInicio | null>(null);
-
-
- EFECTO:
- useEffect(() => {
- if (datos.length > 0) {
-     const resultado = detectarInicioAnomalia(datos);
-     setResultadoAnomalia(resultado);
- }
- }, [datos]);
-
-
- JSX (Renderizado del Banner):
- {resultadoAnomalia && (
- <div className={`anomalia-banner anomalia-banner--${resultadoAnomalia.clasificacion}`}>
-     <div className="anomalia-header">
-       {/* Emoji según clasificación */}
-       {resultadoAnomalia.clasificacion === 'sin_anomalia' && '✅'}
-       {resultadoAnomalia.clasificacion === 'anomalia_detectada' && '⚠️'}
-       {resultadoAnomalia.clasificacion === 'periodo_indeterminado' && '❓'}
-       <span className="anomalia-titulo">{resultadoAnomalia.mensaje}</span>
-     </div>
-     <div className="anomalia-detalles">
-       <p className="anomalia-razon">📍 {resultadoAnomalia.razon}</p>
-       {resultadoAnomalia.periodoInicio && (
-         <p className="anomalia-periodo">
-           <strong>Periodo:</strong> {resultadoAnomalia.periodoLegible}
-         </p>
-       )}
-       <p className="anomalia-confianza">
-         🎯 Confianza: <strong>{resultadoAnomalia.confianza}%</strong>
-       </p>
-     </div>
- </div>
- )}
  \*/

// ============================================================================
// 🎨 ESTILOS CSS (HeatMapConsumo.css)
// ============================================================================

/\*\*

- CLASES NUEVAS:
-
- .anomalia-banner
- - Base: padding 0.8rem, border-left 4px
- - Animación: slideInDown (0.3s)
- - Responsive: Media query 768px
-
- .anomalia-banner--sin_anomalia
- - Border: Verde #66bb6a
- - Fondo: Gradiente verde claro
- - Texto: Verde oscuro
-
- .anomalia-banner--anomalia_detectada
- - Border: Rojo #ef5350
- - Fondo: Gradiente naranja claro
- - Texto: Rojo oscuro
-
- .anomalia-banner--periodo_indeterminado
- - Border: Naranja #ffa726
- - Fondo: Gradiente amarillo claro
- - Texto: Naranja oscuro
-
- .anomalia-header
- - Display: flex, gap 0.5rem
- - Alineación vertical
-
- .anomalia-detalles
- - Margin-left: 1.5rem
- - Border-left: Línea fina
- - Smaller font size
-
- @keyframes slideInDown
- - from: opacity 0, translateY(-10px)
- - to: opacity 1, translateY(0)
    \*/

// ============================================================================
// 📈 EJEMPLOS DE USO
// ============================================================================

/\*\*

- EJEMPLO 1: Descenso Brusco (30%+)
- ──────────────────────────────────
- Datos:
- - Enero 2024: 500 kWh
- - Febrero 2024: 320 kWh (-36%)
-
- Resultado:
- {
-     clasificacion: 'anomalia_detectada',
-     mensaje: 'Determinación del descenso en febrero 2024',
-     periodoInicio: '2024-02',
-     periodoLegible: 'febrero 2024',
-     razon: 'Descenso brusco >= 30% respecto mes anterior (-36%)',
-     confianza: 95,
-     detalles: {
-       tipo: 'descenso_brusco_mes_a_mes',
-       variacionDetectada: -36,
-       umbral: -30,
-       cicloFacturacion: 'mensual'
-     }
- }
-
- UI: Banner rojo con ⚠️ "Determinación del descenso en febrero 2024"
-
-
- EJEMPLO 2: Sin Anomalía (Variación Normal)
- ────────────────────────────────────────────
- Datos:
- - Enero 2024: 500 kWh
- - Febrero 2024: 490 kWh (-2%)
- - Marzo 2024: 510 kWh (+4%)
-
- Resultado:
- {
-     clasificacion: 'sin_anomalia',
-     mensaje: 'No se detectaron anomalías en los datos',
-     razon: 'Cambios menores al 40%, comportamiento estacional normal o contrato con bajo uso',
-     confianza: 90,
-     detalles: {
-       tipo: 'sin_anomalia',
-       umbralesVerificados: [...]
-     }
- }
-
- UI: Banner verde con ✅ "No se detectaron anomalías"
-
-
- EJEMPLO 3: Consumo Cero Sospechoso
- ───────────────────────────────────
- Datos históricos:
- - 2022: enero 450 kWh, febrero 480 kWh
- - 2023: enero 440 kWh, febrero 470 kWh
- - 2024: enero 430 kWh, febrero 0 kWh (PRIMERA VEZ EN FEBRERO)
-
- Resultado:
- {
-     clasificacion: 'anomalia_detectada',
-     mensaje: 'Determinación del descenso en febrero 2024 (consumo cero sospechoso)',
-     periodoInicio: '2024-02',
-     periodoLegible: 'febrero 2024',
-     razon: 'Consumo cero registrado en mes donde nunca antes ocurrió',
-     confianza: 70,
-     detalles: {
-       tipo: 'consumo_cero_sospechoso',
-       cicloFacturacion: 'mensual'
-     }
- }
-
- ACCIÓN: Sistema pregunta "¿Hubo baja de contrato en febrero 2024?"
  \*/

// ============================================================================
// 🔍 DIFERENCIAS CON SISTEMA ANTERIOR (anomaliaService.ts)
// ============================================================================

/\*\*

- ANTERIOR (anomaliaService.ts):
- ──────────────────────────────
- - Marcaba TODAS las anomalías (mes a mes)
- - Umbrales: 40% de variación
- - Retornaba: Array<Anomalia> (múltiples resultados)
- - Uso: Detector simple por variación
-
- NUEVO (detectarInicioAnomaliaService.ts):
- ──────────────────────────────────────────
- - Detecta SOLO EL INICIO de la anomalía
- - Múltiples criterios (descenso, histórico, consumo cero)
- - Retorna: Resultado ÚNICO con clasificación
- - Uso: Sistema experto para diagnóstico
-
- CONVIVENCIA:
- - Ambos servicios son complementarios
- - anomaliaService: "¿Hay variación >40%?" → Análisis técnico
- - detectarInicioAnomaliaService: "¿Cuándo empieza la anomalía?" → Diagnóstico
-
- Se pueden usar juntos:
- const anomalia = detectarInicioAnomalia(comparativa);
- const detalles = anomaliaService.detectarAnomalias(consumosPorPeriodo);
  \*/

// ============================================================================
// 📊 MATRIZ DE DECISIÓN (Flujo Interno)
// ============================================================================

/\*\*

- El detector evalúa en este orden:
-
- ┌─────────────────────────────────────────────────────────────┐
- │ DESCENSO BRUSCO (≥30% mes a mes)? │
- │ ├─ SÍ → "Determinación del descenso en [mes] (95% confianza)" │
- │ └─ NO → Continuar │
- └─────────────────────────────────────────────────────────────┘
-                            ↓
- ┌─────────────────────────────────────────────────────────────┐
- │ DESCENSO SOSTENIDO (>10% por 3+ meses)? │
- │ ├─ SÍ → "Descenso sostenido [N] meses (85% confianza)" │
- │ └─ NO → Continuar │
- └─────────────────────────────────────────────────────────────┘
-                            ↓
- ┌─────────────────────────────────────────────────────────────┐
- │ VARIACIÓN HISTÓRICA (>20% vs mismo mes años anteriores)? │
- │ ├─ SÍ → "Desviación >20% respecto histórico (80% confianza)"│
- │ └─ NO → Continuar │
- └─────────────────────────────────────────────────────────────┘
-                            ↓
- ┌─────────────────────────────────────────────────────────────┐
- │ CONSUMO CERO SOSPECHOSO (nunca antes en ese mes)? │
- │ ├─ SÍ → "Cero sospechoso en [mes] (70% confianza)" │
- │ └─ NO → Continuar │
- └─────────────────────────────────────────────────────────────┘
-                            ↓
- ┌─────────────────────────────────────────────────────────────┐
- │ RESULTADO: SIN ANOMALÍA (90% confianza) │
- └─────────────────────────────────────────────────────────────┘
  \*/

// ============================================================================
// ✅ CHECKLIST DE VALIDACIÓN
// ============================================================================

/\*\*

- IMPLEMENTACIÓN:
- ✅ Servicio creado: detectarInicioAnomaliaService.ts
- ✅ 5 criterios implementados (4 + sin anomalía)
- ✅ Ciclo de facturación detectado
- ✅ Confianza asignada por criterio
- ✅ Integración en HeatMapConsumo.tsx
- ✅ Banner visual con 3 variantes
- ✅ Estilos CSS responsive
- ✅ Animación de aparición
- ✅ Lint: 0 errores
- ✅ Build: Exitoso (1751 módulos)
-
- TESTING:
- ✅ Imports correctos
- ✅ Types exportados
- ✅ useEffect ejecutándose
- ✅ Resultado calculado al cargar datos
- ✅ Banner renderizándose según clasificación
-
- PRÓXIMOS PASOS (OPCIONAL):
- ⏳ Agregar logs de debug (console.log → loggerService)
- ⏳ Testing con datos reales Excel
- ⏳ Ajustar umbrales según feedback del negocio
- ⏳ Exportar reporte con clasificación de anomalía
  \*/

// ============================================================================
// 📚 REFERENCIAS
// ============================================================================

/\*\*

- ARCHIVOS RELACIONADOS:
- - src/services/detectarInicioAnomaliaService.ts (420 líneas)
- - src/components/HeatMapConsumo/HeatMapConsumo.tsx (modificado)
- - src/components/HeatMapConsumo/HeatMapConsumo.css (estilos nuevos)
- - src/services/anomaliaService.ts (anterior, complementario)
- - src/services/analisisConsumoService.ts (genera ConsumoMensual)
- - src/services/extractorMetricasService.ts (métricas validadas)
-
- TIPOS:
- - ResultadoDeteccionInicio (nuevo)
- - ClasificacionAnomalia (tipo enum: 3 valores)
- - ConsumoMensual (input al detector)
    \*/
