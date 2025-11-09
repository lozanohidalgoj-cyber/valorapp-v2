/\*\*

- 🎯 RESUMEN EJECUTIVO - SISTEMA DE DETECCIÓN DE INICIO DE ANOMALÍA
-
- El sistema ahora detecta SOLO el INICIO de anomalías,
- no solo variaciones mes a mes
  \*/

// ============================================================================
// ✅ QUÉ SE IMPLEMENTÓ
// ============================================================================

/\*\*

- NUEVO SERVICIO:
- src/services/detectarInicioAnomaliaService.ts
-
- Detecta anomalías energéticas usando 5 criterios inteligentes:
- 1.  Descenso brusco mes a mes (≥30%)
- 2.  Descenso sostenido (>10% durante 3+ meses)
- 3.  Variación histórica (>20% vs. mismo mes años anteriores)
- 4.  Consumo cero sospechoso (nunca ocurrió antes en ese mes)
- 5.  Sin anomalía (comportamiento normal)
-
- Retorna CLASIFICACIÓN ÚNICA (no múltiples alertas):
- ✅ "Sin anomalía"
- ⚠️ "Determinación del descenso en [mes/año]"
- ❓ "Período indeterminado - necesita análisis por horas"
  \*/

// ============================================================================
// 🎨 VISUALIZACIÓN EN UI
// ============================================================================

/\*\*

- BANNER AUTOMÁTICO en HeatMap de Consumo:
-
- ✅ VERDE (Sin Anomalía):
- "No se detectaron anomalías en los datos"
- Confianza: 90%
-
- ⚠️ ROJO (Anomalía Detectada):
- "Determinación del descenso en marzo 2024"
- 📍 Razón: Descenso brusco >= 30%
- 🎯 Confianza: 95%
-
- ❓ NARANJA (Indeterminado):
- "Período indeterminado, realizar análisis por horas"
- 🎯 Confianza: Variable
-
- Animación: Aparición suave (slideInDown 0.3s)
- Responsive: Ajusta tamaño en dispositivos móviles
  \*/

// ============================================================================
// 📊 CRITERIOS PRINCIPALES (Orden de Evaluación)
// ============================================================================

/\*\*

- CRITERIO 1: DESCENSO BRUSCO MES A MES (95% confianza)
- ────────────────────────────────────────────────────
- Detecta: Caída ≥30% entre mes actual vs. mes anterior
- Requisitos: Al menos 3 facturas previas válidas para confirmar el descenso (sin ese historial → se marca como período indeterminado)
-
- Ejemplo:
- - Febrero 2024: 500 kWh
- - Marzo 2024: 320 kWh → DESCENSO 36%
- - Diciembre 2023 / Enero 2024: sirven como baseline
- ✅ "Determinación del descenso en marzo 2024"

- Caso con historial insuficiente:
- - Enero 2024: 500 kWh
- - Febrero 2024: 320 kWh (única factura previa)
- ❓ "Período indeterminado, validar manualmente"
-
- Indica: Posible avería, cambio de uso o fraude repentino
-
-
- CRITERIO 2: DESCENSO SOSTENIDO SIN RECUPERACIÓN (85% confianza)
- ────────────────────────────────────────────────────────────
- Detecta: Caída >10% durante 3+ meses consecutivos, SIN recuperación posterior
-
- ⚠️ IMPORTANTE: El descenso debe ser SOSTENIDO (sin recuperación)
-
- Ejemplo CORRECTO (SÍ es anomalía):
- - Enero: 500 kWh
- - Febrero: 450 kWh (-10%) 🔻
- - Marzo: 405 kWh (-10%) 🔻
- - Abril: 365 kWh (-10%) 🔻
- - Mayo: 340 kWh (sigue bajo) ← NO recupera
- ✅ "Descenso sostenido 3 meses SIN recuperación"
-
- Ejemplo INCORRECTO (NO es anomalía):
- - Enero: 500 kWh
- - Febrero: 450 kWh (-10%)
- - Marzo: 405 kWh (-10%)
- - Abril: 365 kWh (-10%)
- - Mayo: 480 kWh (¡RECUPERÓ!) ← Se recupera 15%+
- ✅ "Sin anomalía" (fue un descenso temporal)
-
- Indica: Avería persistente, baja no temporal, cambio de proceso permanente
-
-
- CRITERIO 3: VARIACIÓN HISTÓRICA (80% confianza)
- ────────────────────────────────────────────────
- Detecta: Desviación >20% respecto promedio del mismo mes en años anteriores
-
- Ejemplo:
- - Enero promedio (2021-2023): 480 kWh
- - Enero 2024: 360 kWh → DESCENSO 25%
- ✅ "Desviación >20% respecto promedio histórico de enero"
-
- Indica: Sale del patrón estacional esperado
-
-
- CRITERIO 4: CONSUMO CERO SOSPECHOSO (70% confianza)
- ──────────────────────────────────────────────────
- Detecta: Consumo = 0 en mes donde NUNCA antes ocurrió
-
- Ejemplo:
- - Histórico: Febrero siempre tiene 400-500 kWh
- - Febrero 2024: 0 kWh (PRIMERA VEZ)
- ✅ "Consumo cero sospechoso - Primera vez en febrero"
-
- Diferencia:
- ✅ CERO ESPERADO: Ocurre todos los años en mismo mes (vacacional)
-      → No es anomalía
- ⚠️ CERO SOSPECHOSO: Nunca ocurrió antes
-      → Posible fraude, baja no declarada o error
-      → Sistema pregunta: "¿Hubo baja de contrato?"
-
-
- RESULTADO: SIN ANOMALÍA (90% confianza)
- ───────────────────────────────────────
- Detecta: No cumple ninguno de los 4 criterios anteriores
-
- Casos válidos:
- ✅ Cambios menores a 10% mes a mes
- ✅ Un mes bajo aislado, luego recuperación
- ✅ Patrón estacional consistente (bajo en verano, alto en invierno)
- ✅ Cliente de bajo consumo (estable)
- ✅ Crecimiento lento (aumento, no descenso)
- ✅ Datos incompletos (< 2 periodos)
  \*/

// ============================================================================
// 🔄 CICLO DE FACTURACIÓN
// ============================================================================

/\*\*

- El sistema DETECTA automáticamente el tipo de ciclo:
-
- Basado en días entre "Fecha desde" y "Fecha hasta":
- - Mensual: 25-35 días
- - Bimestral: 50-70 días
- - Trimestral: 75-105 días
- - Cuatrimestral: 100-140 días
- - Semestral: 150-200 días
- - Anual: 350-380 días
- - Irregular: Otro
-
- Se incluye en detalles del resultado:
- {
- cicloFacturacion: "bimestral"
- }
  \*/

// ============================================================================
// 💡 DIFERENCIAS CON SISTEMA ANTERIOR
// ============================================================================

/\*\*

- ANTES (anomaliaService.ts):
- - Detectaba todas las variaciones >40%
- - Retornaba múltiples anomalías
- - Era análisis mes a mes
-
- AHORA (detectarInicioAnomaliaService.ts):
- - Detecta SOLO el INICIO de la anomalía
- - Retorna UNA clasificación única
- - Es análisis histórico y contextual
-
- ✅ AMBOS SERVICIOS CONVIVEN:
- - anomaliaService: Para análisis técnico detallado
- - detectarInicioAnomaliaService: Para diagnóstico ejecutivo
    \*/

// ============================================================================
// 🚀 CÓMO SE USA
// ============================================================================

/\*\*

- USO AUTOMÁTICO (Ya implementado):
-
- 1.  Usuario carga datos CSV
- 2.  HeatMapConsumo recibe ConsumoMensual[]
- 3.  useEffect ejecuta:
- const resultado = detectarInicioAnomalia(datos);
- 4.  Banner aparece automáticamente con resultado
-
- NO NECESITA configuración adicional
-
-
- USO PROGRAMÁTICO (Opcional):
-
- import { detectarInicioAnomalia } from './services/detectarInicioAnomaliaService';
-
- const resultado = detectarInicioAnomalia(comparativaMensual);
-
- if (resultado.clasificacion === 'anomalia_detectada') {
- console.log(`⚠️ ${resultado.mensaje}`);
- console.log(`Periodo inicio: ${resultado.periodoLegible}`);
- console.log(`Confianza: ${resultado.confianza}%`);
- }
  \*/

// ============================================================================
// ✅ VALIDACIÓN
// ============================================================================

/\*\*

- ✅ Lint: 0 errores
- ✅ Build: Exitoso (1751 módulos, 458.96 KB)
- ✅ TypeScript: Tipos completos
- ✅ Import/Export: Funcionando
- ✅ UI: Banner renderizándose
- ✅ CSS: 3 variantes funcionando
- ✅ Responsive: Mobile-friendly
-
- ARCHIVOS MODIFICADOS:
- ✅ src/services/detectarInicioAnomaliaService.ts (NEW)
- ✅ src/components/HeatMapConsumo/HeatMapConsumo.tsx
- ✅ src/components/HeatMapConsumo/HeatMapConsumo.css
-
- LÍNEAS AGREGADAS:
- ~420 líneas (servicio)
- ~30 líneas (integración HeatMap)
- ~120 líneas (estilos CSS)
  \*/

// ============================================================================
// 📋 EJEMPLO REAL DE SALIDA
// ============================================================================

/\*\*

- ENTRADA: Array de 36 meses (3 años)
-
- Datos:
- 2022: Consumo estable 480 kWh/mes
- 2023: Consumo estable 475 kWh/mes
- 2024:
- Enero: 470 kWh (normal)
- Febrero: 465 kWh (normal, -1%)
- Marzo: 310 kWh (↓34% - DESCENSO BRUSCO)
- Abril: 280 kWh (↓10%)
- Mayo: 250 kWh (↓11%)
-
- SALIDA:
- {
- clasificacion: 'anomalia_detectada',
- mensaje: 'Determinación del descenso en marzo 2024',
- periodoInicio: '2024-03',
- periodoLegible: 'marzo 2024',
- razon: 'Descenso brusco >= 30% respecto mes anterior (-34%)',
- confianza: 95,
- detalles: {
-     tipo: 'descenso_brusco_mes_a_mes',
-     variacionDetectada: -34,
-     umbral: -30,
-     cicloFacturacion: 'mensual'
- }
- }
-
- UI MOSTRADA:
- ┌──────────────────────────────────────────────────────────┐
- │ ⚠️ Determinación del descenso en marzo 2024 │
- │ ─────────────────────────────────────────────────────── │
- │ 📍 Descenso brusco >= 30% respecto mes anterior (-34%) │
- │ Periodo: marzo 2024 │
- │ 🎯 Confianza: 95% │
- └──────────────────────────────────────────────────────────┘
  \*/

// ============================================================================
// 🔧 CONFIGURACIÓN (UMBRALES)
// ============================================================================

/\*\*

- Los umbrales están HARDCODEADOS en el servicio:
-
- DESCENSO_BRUSCO = 30% (línea 89)
- DESCENSO_MINIMO = 10% (línea 98)
- MESES_REQUERIDOS = 3 (línea 99)
- VARIACION_HISTORICA = 20% (línea 184)
-
- Para ajustar, editar detectarInicioAnomaliaService.ts:
- const UMBRAL_DESCENSO = 30; // Cambiar aquí
  \*/
