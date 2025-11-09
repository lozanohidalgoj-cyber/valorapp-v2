/\*\*

- 🔄 ACTUALIZACIÓN: Criterio de Descenso Sostenido Refactorizado
-
- CAMBIO IMPORTANTE: El sistema ahora distingue entre:
- ✅ Descenso temporal (con recuperación) = NO es anomalía
- ⚠️ Descenso sostenido (sin recuperación) = SÍ es anomalía
  \*/

// ============================================================================
// ❌ PROBLEMA ANTERIOR
// ============================================================================

/\*\*

- El criterio anterior detectaba CUALQUIER descenso sostenido:
-
- EJEMPLO INCORRECTO:
- - Enero: 500 kWh
- - Febrero: 450 kWh (-10%)
- - Marzo: 405 kWh (-10%)
- - Abril: 365 kWh (-10%)
- - Mayo: 500 kWh (¡RECUPERÓ!)
-
- RESULTADO ANTERIOR: ⚠️ "Anomalía detectada" (INCORRECTO)
- PROBLEMA: Era un descenso temporal, NO una anomalía real
  \*/

// ============================================================================
// ✅ SOLUCIÓN IMPLEMENTADA
// ============================================================================

/\*\*

- NUEVA LÓGICA: Verificar si hay recuperación posterior
-
- PASO 1: Detectar 3+ meses con descenso >10%
- PASO 2: Verificar si hay RECUPERACIÓN después
-         (consumo sube 15%+ desde el mínimo alcanzado)
-
- REGLA FINAL:
- - ✅ Anomalía SÍ = Descenso sostenido SIN recuperación
- - ✅ Normal = Descenso temporal CON recuperación
-
- Umbral de recuperación: 15% arriba del mínimo alcanzado
  \*/

// ============================================================================
// 📊 EJEMPLOS DE DECISIÓN
// ============================================================================

/\*\*

- CASO 1: Descenso Temporal (SIN anomalía)
- ─────────────────────────────────────────
- Enero: 500 kWh
- Febrero: 450 kWh (-10%) ✓
- Marzo: 405 kWh (-10%) ✓
- Abril: 365 kWh (-10%) ✓
- Mayo: 500 kWh (¡RECUPERÓ 15%+!)
-
- SISTEMA DETECTA:
- ✓ 3 meses descenso (-10% c/u)
- ✓ Luego RECUPERA a 500 (arriba del mínimo 365)
- ✅ RESULTADO: "Sin anomalía" (es normal)
-
- INTERPRETACIÓN:
- Fue un descenso puntual por una razón temporal
- (vacaciones, parada de máquina, etc.) pero se recuperó
-
-
- CASO 2: Descenso Sostenido (SÍ es anomalía)
- ────────────────────────────────────────────
- Enero: 500 kWh
- Febrero: 450 kWh (-10%) ✓
- Marzo: 405 kWh (-10%) ✓
- Abril: 365 kWh (-10%) ✓
- Mayo: 355 kWh (-3%) ← NO recupera, sigue bajo
- Junio: 350 kWh (-1%) ← Sigue bajísimo
-
- SISTEMA DETECTA:
- ✓ 3+ meses descenso (-10% c/u)
- ✗ NO hay recuperación posterior (se mantiene bajo)
- ⚠️ RESULTADO: "Determinación del descenso en febrero 2024"
- Confianza: 85%
-
- INTERPRETACIÓN:
- Es un descenso sostenido sin recuperación
- Indica: Avería, baja, cambio de proceso, fraude, etc.
-
-
- CASO 3: Recuperación Parcial (¿Anomalía?)
- ──────────────────────────────────────────
- Enero: 500 kWh
- Febrero: 450 kWh (-10%)
- Marzo: 405 kWh (-10%)
- Abril: 365 kWh (-10%) ← Mínimo
- Mayo: 420 kWh (+15%) ← Sube 15% desde mínimo
- Junio: 420 kWh (estable)
-
- SISTEMA DETECTA:
- ✓ 3 meses descenso
- ✓ Mayo sube 15% (umbral de recuperación)
- ✅ RESULTADO: "Sin anomalía"
-
- INTERPRETACIÓN:
- Aunque no volvió al 100%, recuperó significativamente
- Indica: Problema temporal resuelto (NO anomalía persistente)
  \*/

// ============================================================================
// 🔧 CONFIGURACIÓN TÉCNICA
// ============================================================================

/\*\*

- FUNCIÓN ACTUALIZADA:
- hayDescensoSostenidoSinRecuperacion()
-
- PARÁMETROS:
- - comparativa: ConsumoMensual[] (datos ordenados)
- - índiceActual: número (posición en array)
-
- RETORNA:
- {
- detectado: boolean // true = anomalía, false = no
- duracionMeses: number // cuántos meses bajó
- huboRecuperacion: boolean // recuperó o no
- }
-
- LÓGICA:
- 1.  Busca 3+ meses consecutivos con descenso >10%
- 2.  Marca el período de inicio
- 3.  Busca recuperación después (15%+ desde mínimo)
- 4.  Retorna anomalía SOLO si NO hay recuperación
-
- UMBRALES:
- - UMBRAL_DESCENSO: 10% (baja mínima para contar)
- - MESES_REQUERIDOS: 3 (meses consecutivos)
- - umbralRecuperacion: mínimo _ 1.15 (15% arriba)
    _/

// ============================================================================
// ✅ RESULTADO FINAL
// ============================================================================

/\*\*

- EL SISTEMA AHORA:
-
- ✅ IGNORA descensos temporales con recuperación
- └─ "Sin anomalía" (es normal)
-
- ✅ DETECTA descensos sostenidos sin recuperación
- └─ ⚠️ "Anomalía detectada" (requiere investigación)
-
- ✅ MANTIENE confianza 85% para descenso sostenido
- └─ Criterio muy fiable
-
- ✅ MENSAJE MEJORADO
- └─ Ahora dice: "descenso sostenido X meses SIN recuperación"
  \*/

// ============================================================================
// 📝 ARCHIVOS MODIFICADOS
// ============================================================================

/\*\*

- src/services/detectarInicioAnomaliaService.ts
- ├─ Función antigua: hayDescensoSostenido() ❌ REEMPLAZADA
- └─ Función nueva: hayDescensoSostenidoSinRecuperacion() ✅
-
- CAMBIOS:
- - Lógica de detección mejorada
- - Verifica recuperación posterior
- - Retorna información de recuperación
- - Mismo umbral (10% por 3 meses)
    \*/

// ============================================================================
// 🔍 EJEMPLO REAL DE CAMBIO
// ============================================================================

/\*\*

- ESCENARIO: Mantenimiento de máquina en marzo-abril
-
- HISTORIAL:
- Enero 2024: 500 kWh (normal)
- Febrero: 495 kWh (normal)
- Marzo: 450 kWh ← Baja por mantenimiento (-9%)
- Abril: 405 kWh ← Sigue bajo (-10%)
- Mayo: 365 kWh ← Llega al mínimo (-10%)
- Junio: 480 kWh ← ¡RECUPERÓ! (+31% vs mínimo)
- Julio: 505 kWh (vuelto a normal)
-
- ANÁLISIS ANTERIOR:
- ❌ Detectaría: ⚠️ "Anomalía en marzo"
- Problema: Era solo mantenimiento, se recuperó
-
- ANÁLISIS NUEVO:
- ✅ Detecta: Sin anomalía
- Razón: Hay recuperación posterior
- Correcto: El descenso fue temporal
  \*/

// ============================================================================
// 🎯 IMPLICACIONES
// ============================================================================

/\*\*

- MENOS FALSOS POSITIVOS:
- Los descensos temporales no se reportarán como anomalías
- → Menos investigaciones innecesarias
-
- MÁS PRECISIÓN:
- Solo se detectan problemas reales y sostenidos
- → Análisis más confiables
-
- MEJOR USER EXPERIENCE:
- Menos alarmas falsas
- → Usuario confía más en el sistema
-
- MISMA CONFIANZA (85%):
- Descenso sostenido sin recuperación es muy fiable
  \*/

// ============================================================================
// ⚙️ CÓMO AJUSTAR SI ES NECESARIO
// ============================================================================

/\*\*

- Si quieres cambiar el umbral de recuperación (actualmente 15%):
-
- Ubicación: detectarInicioAnomaliaService.ts
- Línea: ~170
-
- const umbralRecuperacion = consumoMínimo \* 1.15; // ← 15%
-
- CAMBIAR A:
- const umbralRecuperacion = consumoMínimo \* 1.10; // ← 10%
- const umbralRecuperacion = consumoMínimo \* 1.20; // ← 20%
- const umbralRecuperacion = consumoMínimo \* 1.25; // ← 25%
-
- RECOMENDACIONES:
- - 10%: Muy sensible (casi cualquier suba cuenta)
- - 15%: Recomendado (equilibrado)
- - 20%: Menos sensible (debe recuperar bastante)
- - 25%: Muy estricto (solo recuperación casi completa)
    \*/
