/\*\*

- ✅ REFACTORIZACIÓN COMPLETADA: Criterio de Descenso Sostenido
-
- CAMBIO IMPORTANTE IMPLEMENTADO
- Fecha: 9 de Noviembre de 2025
  \*/

// ============================================================================
// 🎯 QUÉ SE ARREGLÓ
// ============================================================================

/\*\*

- PROBLEMA REPORTADO POR EL USUARIO:
- "Si tiene un descenso del consumo y luego vuelve a estar normal,
- NO podemos señalarlo como inicio de la anomalía.
- Se tomarán los descensos sostenidos donde NO hubo recuperación,
- después de ese descenso los consumos son más bajos."
-
- SOLUCIÓN IMPLEMENTADA:
- El criterio de DESCENSO SOSTENIDO ahora verifica recuperación posterior
  \*/

// ============================================================================
// 📊 COMPARATIVA ANTES vs DESPUÉS
// ============================================================================

/\*\*

- ESCENARIO: Baja temporal en abril-mayo (mantenimiento de máquina)
-
- Datos:
- Marzo: 500 kWh
- Abril: 450 kWh (-10%)
- Mayo: 405 kWh (-10%)
- Junio: 365 kWh (-10%)
- Julio: 480 kWh (¡RECUPERÓ!)
-
- RESULTADO ANTERIOR ❌:
- ⚠️ "Determinación del descenso en abril"
- Problema: Fue solo una baja temporal, se recuperó
-
- RESULTADO NUEVO ✅:
- ✅ "Sin anomalía"
- Razón: Hay recuperación posterior (480 kWh)
- Correcto: El descenso fue temporal, no persistente
  \*/

// ============================================================================
// 🔧 CAMBIO TÉCNICO
// ============================================================================

/\*\*

- FUNCIÓN ANTIGUA:
- hayDescensoSostenido()
- ├─ Detectaba: 3+ meses con descenso >10%
- └─ Retornaba: boolean (detectado)
-
- FUNCIÓN NUEVA:
- hayDescensoSostenidoSinRecuperacion()
- ├─ Detecta: 3+ meses con descenso >10%
- ├─ Verifica: ¿Hay recuperación posterior?
- └─ Retorna: {
- detectado: boolean, // true solo si NO hay recuperación
- duracionMeses: number, // cuántos meses bajó
- huboRecuperacion: boolean // información de debug
- }
-
- LÓGICA:
- 1.  Busca 3+ meses consecutivos con descenso >10%
- 2.  Marca consumo mínimo alcanzado
- 3.  Busca si después hay recuperación (15%+ arriba del mínimo)
- 4.  Retorna anomalía SOLO si NO hay recuperación
      \*/

// ============================================================================
// 📈 EJEMPLOS DE DECISIÓN DESPUÉS DEL CAMBIO
// ============================================================================

/\*\*

- CASO 1: Baja Permanente (SÍ es anomalía) ✅
- ───────────────────────────────────────────
- Enero: 500 kWh
- Febrero: 450 kWh (-10%)
- Marzo: 405 kWh (-10%)
- Abril: 365 kWh (-10%)
- Mayo: 355 kWh (-2%) ← Sigue bajo
- Junio: 350 kWh (-1%) ← Sigue bajo
-
- SISTEMA:
- ✓ Detecta 3+ meses descenso >10%
- ✗ NO hay recuperación posterior
- ✅ RESULTADO: ⚠️ "Determinación del descenso en febrero"
- Confianza: 85%
- Razón: Descenso sostenido SIN recuperación
-
-
- CASO 2: Baja Temporal (NO es anomalía) ✅
- ──────────────────────────────────────
- Enero: 500 kWh
- Febrero: 450 kWh (-10%)
- Marzo: 405 kWh (-10%)
- Abril: 365 kWh (-10%)
- Mayo: 480 kWh (+31%) ← Recupera!
- Junio: 510 kWh (vuelve a normal)
-
- SISTEMA:
- ✓ Detecta 3 meses descenso >10%
- ✓ Hay recuperación posterior (480 > 365\*1.15)
- ✅ RESULTADO: "Sin anomalía"
- Razón: Fue un descenso temporal, se recuperó
-
-
- CASO 3: Baja Lenta (SÍ es anomalía) ✅
- ──────────────────────────────────
- Enero: 500 kWh
- Febrero: 480 kWh (-4%)
- Marzo: 455 kWh (-5%)
- Abril: 430 kWh (-6%)
- Mayo: 400 kWh (-7%)
- Junio: 380 kWh (-5%)
-
- SISTEMA:
- ✗ NO hay 3 meses con descenso >10%
- ❌ RESULTADO: "Sin anomalía"
- Razón: Los descensos individuales son menores a 10%
- (El descenso acumulado es 24%, pero no alcanza 3 meses de >10%)
  \*/

// ============================================================================
// 🎯 IMPACTO DEL CAMBIO
// ============================================================================

/\*\*

- BENEFICIOS:
- ✅ Menos falsos positivos
- - Los descensos temporales no se reportan como anomalías
- - Menos investigaciones innecesarias
-
- ✅ Mayor precisión
- - Solo se detectan problemas reales y persistentes
- - Análisis más confiables
-
- ✅ Mejor experiencia de usuario
- - Menos alarmas falsas
- - Usuario confía más en el sistema
-
- ✅ Mejor clasificación de anomalías
- - Anomalía = Problema REAL y SOSTENIDO
- - No anomalía = Variabilidad normal o temporal
    \*/

// ============================================================================
// ⚙️ CONFIGURACIÓN (UMBRALES PERSONALIZABLES)
// ============================================================================

/\*\*

- Si necesitas ajustar la sensibilidad:
-
- UBICACIÓN: src/services/detectarInicioAnomaliaService.ts
- Línea: ~145 y ~170
-
- 1.  UMBRAL DE DESCENSO MENSUAL:
- const UMBRAL_DESCENSO = 10; // % ← AQUÍ
- Cambiar a:
- - 5: Muy sensible (casi cualquier baja cuenta)
- - 10: Recomendado (actual)
- - 15: Menos sensible (debe bajar bastante)
-
- 2.  MESES REQUERIDOS:
- const MESES_REQUERIDOS = 3; // meses ← AQUÍ
- Cambiar a:
- - 2: Muy sensible (solo 2 meses)
- - 3: Recomendado (actual)
- - 4: Menos sensible (debe durar 4 meses)
-
- 3.  UMBRAL DE RECUPERACIÓN:
- const umbralRecuperacion = consumoMínimo \* 1.15; // 15% ← AQUÍ
- Cambiar a:
- - 1.10: 10% de recuperación (menos exigente)
- - 1.15: 15% de recuperación (recomendado)
- - 1.20: 20% de recuperación (más exigente)
- - 1.30: 30% de recuperación (muy exigente)
    \*/

// ============================================================================
// 📁 ARCHIVOS MODIFICADOS
// ============================================================================

/\*\*

- src/services/detectarInicioAnomaliaService.ts
- ├─ Línea ~130-185: Nueva función hayDescensoSostenidoSinRecuperacion()
- ├─ Línea ~303-335: Actualizar lógica de REGLA 2
- └─ Mensaje mejorado con "SIN recuperación"
-
- RESUMEN_DETECCION_ANOMALIAS.md
- └─ Actualizado CRITERIO 2 con nuevos ejemplos
-
- CAMBIO_CRITERIO_DESCENSO_SOSTENIDO.md (NEW)
- └─ Documentación detallada del cambio
  \*/

// ============================================================================
// ✅ VALIDACIÓN
// ============================================================================

/\*\*

- ✅ Lint: 0 errores
- ✅ Build: Exitoso (1751 módulos)
- ✅ Types: TypeScript correcto
- ✅ Runtime: Cambio integrado
-
- CAMBIOS IMPLEMENTADOS:
- - Nueva función de detección
- - Lógica de recuperación agregada
- - Documentación actualizada
- - Mensaje mejorado
    \*/

// ============================================================================
// 📊 MATRIZ DE DECISIÓN ACTUALIZADA
// ============================================================================

/\*\*

- REGLA 1: Descenso Brusco ≥30%
- ↓ (NO coincide)
- REGLA 2: Descenso Sostenido >10% x3 meses SIN RECUPERACIÓN ← ACTUALIZADO
- ↓ (NO coincide)
- REGLA 3: Variación Histórica >20%
- ↓ (NO coincide)
- REGLA 4: Consumo Cero Sospechoso
- ↓ (NO coincide)
- RESULTADO: Sin Anomalía
  \*/

// ============================================================================
// 🎉 RESULTADO FINAL
// ============================================================================

/\*\*

- EL SISTEMA AHORA:
-
- ✅ Distingue entre:
- - Baja temporal (con recuperación) → Sin anomalía ✅
- - Baja persistente (sin recuperación) → Anomalía ⚠️
-
- ✅ Más preciso:
- - Reporta solo problemas reales
- - Menos falsos positivos
-
- ✅ Mensaje mejorado:
- - "Descenso sostenido X meses SIN recuperación"
- - Deja claro que es un problema persistente
-
- ✅ Confianza mantenida:
- - 85% (muy confiable)
-
- ✅ Documentación completa:
- - Cambios explicados
- - Ejemplos detallados
- - Configuración personalizable
    \*/
