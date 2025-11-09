/\*\*

- 👤 GUÍA DEL USUARIO: Cómo Usar el Sistema de Detección de Anomalías
-
- Para: Analistas de energía, especialistas en fraudes, operadores de red
  \*/

// ============================================================================
// 1️⃣ ¿QUÉ VAS A VER?
// ============================================================================

/\*\*

- Cuando cargues datos en el Heatmap de Consumo,
- aparecerá automáticamente un BANNER de colores con el resultado del análisis:
-
- 🎨 3 COLORES POSIBLES:
-
- ✅ VERDE (Sin Anomalía)
- └─ Todo normal. Consumo sigue patrón esperado.
-
- ⚠️ ROJO (Anomalía Detectada)
- └─ Se encontró un CAMBIO ANÓMALO. Aquí empieza el problema.
-       Incluye el mes exacto donde inició.
-
- ❓ NARANJA (Datos Insuficientes)
- └─ No hay suficiente información para análisis. Necesita revisión manual.
  \*/

// ============================================================================
// 2️⃣ INTERPRETACIÓN DE CADA RESULTADO
// ============================================================================

/\*\*

- CASO A: ✅ "No se detectaron anomalías"
- ─────────────────────────────────────────
- QUÉ SIGNIFICA:
- El sistema no encontró cambios anómalos en el consumo.
- Comportamiento normal, sin indicios de fraude o averías.
-
- CUÁNDO OCURRE:
- • Consumo estable mes a mes (variación <10%)
- • Patrón estacional normal (bajo en verano, alto en invierno)
- • Cliente con bajo consumo consistente
- • Cambios leves (subidas/bajadas pero no sostenidas)
-
- EJEMPLOS:
- - Consumo: 500, 495, 510, 520, 515 kWh (sigue patrón)
- - Consumo: 300, 300, 300, 300, 300 kWh (estable bajo)
- - Consumo: 500, 800, 500, 800, 500 kWh (ciclo estacional)
-
- ✅ ACCIÓN DEL ANALISTA:
- - Verificar de forma rutinaria
- - Continuar monitoreo periódico
- - No requiere intervención urgente\n \*
-
-
- CASO B: ⚠️ "Determinación del descenso en [mes/año]"
- ──────────────────────────────────────────────
- QUÉ SIGNIFICA:
- Se encontró un CAMBIO ANÓMALO. El sistema identificó el PERÍODO EXACTO
- donde inició el problema.
-
- POR QUÉ ES IMPORTANTE:
- Conocer cuándo empezó ayuda a relacionarlo con eventos:
- • Cambio de máquinas/producción
- • Instalación de equipos nuevos
- • Mantenimiento realizado\n \* • Baja/cambio de contrato
- • Posible fraude
- • Error en lectura\n \*
- INFORMACIÓN ADICIONAL QUE RECIBIS:
- • Razón específica (descenso brusco, sostenido, etc.)
- • Porcentaje de variación detectado
- • Ciclo de facturación (mensual, bimestral, etc.)
- • Confianza del diagnóstico (70-95%)
-
- EJEMPLOS DE RAZONES:
-
- 1.  "Descenso brusco >= 30% respecto mes anterior"
-      └─ Caída rápida en consumo
-         Posibles causas: Parada de máquina, cierre temporal, fraude
-         Confianza: 95%
-
- 2.  "Descenso sostenido > 10% durante 3 meses"
-      └─ Baja gradual pero consistente
-         Posibles causas: Avería en contador, proceso ineficiente, baja
-         Confianza: 85%
-
- 3.  "Desviación > 20% respecto promedio histórico de [mes]"
-      └─ Muy diferente a años anteriores en el mismo mes
-         Posibles causas: Cambio de ocupación, error estacional, fraude
-         Confianza: 80%
-
- 4.  "Consumo cero registrado en mes donde nunca antes ocurrió"
-      └─ PRIMERA VEZ que consumo es cero en ese mes
-         Posibles causas: Baja de contrato, desconexión, error de lectura
-         Confianza: 70%
-         ❓ PREGUNTA IMPORTANTE: "¿Hubo baja en este mes?"
-
- ⚠️ ACCIÓN DEL ANALISTA:
- 1.  Anotar el mes reportado
- 2.  Investigar qué ocurrió en esa fecha
- 3.  Revisar órdenes de trabajo, cambios de contrato, etc.
- 4.  Verificar lecturas vs historial
- 5.  Inspeccionar contador si hay indicios de fraude
- 6.  Determinar causa raíz
- 7.  Reportar: Fraude / Error / Normal / Otra\n \*
-
-
- CASO C: ❓ "Período indeterminado - Análisis manual por horas"
- ────────────────────────────────────────────────────────────
- QUÉ SIGNIFICA:
- El sistema NO TIENE SUFICIENTE INFORMACIÓN para hacer un diagnóstico.
- Requiere análisis más detallado de horas de consumo.
-
- CUÁNDO OCURRE:
- • < 2 periodos de datos (no hay histórico)
- • Ciclo de facturación muy irregular
- • Datos inconsistentes o incompletos
-
- ❓ ACCIÓN DEL ANALISTA:
- 1.  Obtener datos horarios del contador
- 2.  Analizar patrones por franja horaria
- 3.  Comparar con consumo esperado por tipo de tarifa
- 4.  Buscar anomalías en curva de carga
- 5.  Validar manualmente la lectura
- 6.  Requiere análisis manual del especialista\n \*/

// ============================================================================
// 3️⃣ CASO ESPECIAL: CONSUMO CERO
// ============================================================================

/\*\*

- El sistema diferencia entre CERO ESPERADO y CERO SOSPECHOSO
-
- ✅ CERO ESPERADO (NO es anomalía)
- ──────────────────────────────────
- "Este cliente siempre está en cero en julio (vacaciones)"
-
- Características:
- • Ocurre en el MISMO MES todos los años
- • Patrón comprobado en años anteriores
- • Razón conocida: Vacaciones, cierre estacional, etc.
-
- Ejemplo:
- - 2022 Julio: 0 kWh ✓
- - 2023 Julio: 0 kWh ✓
- - 2024 Julio: 0 kWh ✓
- → "Sin anomalía" (es normal para julio)
-
- ✅ ACCIÓN: Verificar de forma rutinaria, no requiere investigación
-
-
- ⚠️ CERO SOSPECHOSO (SÍ es anomalía)
- ───────────────────────────────────
- "Nunca antes en julio fue cero, ¿qué pasó?"
-
- Características:
- • PRIMERA VEZ que consumo es cero en ese mes
- • NO tiene precedente en años anteriores
- • Inesperado e inusual
-
- Ejemplo:
- - 2022 Julio: 450 kWh
- - 2023 Julio: 480 kWh
- - 2024 Julio: 0 kWh ← PRIMERA VEZ (¿?)
- → ⚠️ "Determinación del descenso en julio 2024"
-
- ⚠️ ACCIÓN:
- ❓ HACER PREGUNTA CLAVE: "¿Hubo baja de contrato en julio 2024?"
-
- SI la respuesta es SÍ:
-     → Normal, cliente cerró. Revisar regularización posterior.
-
- SI la respuesta es NO:
-     → Posible fraude, error de lectura o desconexión ilegal
-     → Requiere investigación inmediata
-
- TAMBIÉN CONSIDERA:
- • ¿Hay una factura "regularizada" o "complementaria" después?
- • ¿El consumo acumulado después se justifica?
- • ¿Cambió el medidor recientemente?
- • ¿Hay registro de inspección?
  \*/

// ============================================================================
// 4️⃣ PASOS PARA INVESTIGAR UNA ANOMALÍA
// ============================================================================

/\*\*

- CUANDO EL SISTEMA REPORTA ⚠️ ANOMALÍA:
-
- PASO 1: Anotar el Periodo
- ───────────────────────────
- Ejemplo: "Marzo 2024"
- Nota la Razón: "Descenso brusco 36%"
-
-
- PASO 2: Revisar Eventos del Periodo
- ────────────────────────────────────
- Buscar en sistema:
- • Cambios de contrato (altas/bajas)
- • Órdenes de mantenimiento
- • Cambios de tarifa
- • Renovación de medidor
- • Inspecciones realizadas
- • Reportes de clientes\n \*
-
- PASO 3: Verificar Historias del Consumo
- ───────────────────────────────────────
- • ¿El patrón es consistente antes de la anomalía?
- • ¿Después de la fecha, se recupera o sigue bajo?
- • ¿Hay regularizaciones posteriores?
-
-
- PASO 4: Validar la Lectura
- ──────────────────────────
- • ¿La lectura está validada?
- • ¿Coincide con ciclo de facturación?
- • ¿El medidor avanzó la cantidad esperada?
- • ¿Hay lecturas estimadas o reales?
-
-
- PASO 5: Inspección Física (si es necesario)
- ────────────────────────────────────────
- Indicios que requieren inspección:
- • Consumo cero pero cliente activo
- • Descenso brusco sin justificación
- • Lectura inconsistente con demanda conocida
- • Patrón anómalo recurrente\n \*
- En inspección revisar:
- • Estado físico del medidor
- • Conexiones eléctricas
- • Posibles tomas no autorizadas
- • Evidencia de manipulación
-
-
- PASO 6: Determinar Causa Raíz
- ──────────────────────────────
- Clasifica como:
-
- ✅ NORMAL
-      - Cliente confirmó baja, vacaciones, o cambio de uso
-      - Cambio de actividad documentado
-      - Razón comercial justificada
-
- ⚠️ ERROR TÉCNICO
-      - Error de lectura del medidor
-      - Problema en transmisión de datos
-      - Lectura estimada incorrecta
-      - Medidor descalibrado
-
- 🚨 POSIBLE FRAUDE
-      - Consumo zero sin justificación
-      - Lectura inconsistente con uso conocido\n *      - Evidencia de manipulación del medidor
-      - Tomas no autorizadas detectadas
-      - Patrón anómalo recurrente
-
- ❓ INDETERMINADO
-      - Requiere análisis adicional
-      - Datos insuficientes
-      - Necesita inspección física\n */

// ============================================================================
// 5️⃣ CONFIANZA DEL DIAGNÓSTICO
// ============================================================================

/\*\*

- Cada resultado incluye un % de CONFIANZA:
-
- 95%: MUY ALTA
- ───────────
- Criterio: Descenso brusco >= 30%
- Significado: "El sistema está prácticamente seguro"
- Acción: Investigación prioritaria
-
-
- 85%: ALTA
- ────────
- Criterio: Descenso sostenido 3+ meses
- Significado: "Patrón claro y consistente"
- Acción: Investigación recomendada\n \*
-
- 80%: BUENA
- ──────────
- Criterio: Variación histórica > 20%
- Significado: "Diferencia significativa vs histórico"
- Acción: Revisar contextualmente\n \*
-
- 70%: MODERADA
- ──────────────
- Criterio: Consumo cero sospechoso
- Significado: "Primera vez en este mes, requiere validación"
- Acción: Verificar eventos, no automatizar decisión\n \*/

// ============================================================================
// 6️⃣ PREGUNTAS FRECUENTES (FAQ)
// ============================================================================

/\*\*

- ❓ P: El sistema dice "sin anomalía" pero el cliente se queja. ¿Qué hago?
- ───────────────────────────────────────────────────────────────────
- R: El sistema busca anomalías matemáticas. Si el cliente reporta algo:
- 1. Escúchalo: Datos de entrada pueden estar incompletos
- 2. Revisa manualmente: Analiza la curva de carga horaria
- 3. Inspecciona: Si el cliente insiste, hacer inspección física
- 4. Compara: ¿Otros clientes similares tienen patrón diferente?
-
-
- ❓ P: ¿Qué significa "ciclo de facturación mensual/bimestral"?
- ────────────────────────────────────────────────────────────
- R: Es cuántos días cubre cada factura:
- • Mensual: 25-35 días (factura cada mes)
- • Bimestral: 50-70 días (factura cada 2 meses)
- • Trimestral: 75-105 días (factura cada 3 meses)
- Importa porque el análisis se ajusta al ciclo\n \*
-
- ❓ P: ¿Cómo diferencio fraude de un error técnico?
- ──────────────────────────────────────────────
- R: Requiere contexto:
- • Fraude: Consumo cero pero instalaciones activas, evidencia física
- • Error: Lectura inconsistente, problema después resuelto
- • Normal: Cliente confirma baja, cambio de proceso, etc.
- El sistema solo marca anomalía matemática. TÚ determinas la causa.\n \*
-
- ❓ P: ¿Qué hago si hay múltiples anomalías?
- ───────────────────────────────────────────
- R: El sistema reporta la PRIMERA/PRINCIPAL. Después de resolver esa:
- 1. Cargar datos nuevos
- 2. Sistema analizará nuevamente
- 3. Puede detectar anomalía secundaria\n \*/

// ============================================================================
// 7️⃣ CHECKLIST DE INVESTIGACIÓN
// ============================================================================

/\*\*

- ⚠️ CUANDO VEAS UN BANNER ROJO (ANOMALÍA DETECTADA)
-
- PASO 1: REGISTRAR INFORMACIÓN
- ☐ Periodo reportado: ********\_********
- ☐ Razón del sistema: ********\_********\n \* ☐ Confianza: \_\_\_\_%
- ☐ Variación detectada: \_\_\_%
- ☐ Ciclo de facturación: ******\_\_\_\_******\n \*
- PASO 2: CONTEXTO EMPRESARIAL
- ☐ ¿Cambios en el contrato? (altas/bajas/mejoras)
- ☐ ¿Cambios en operación? (procesos, máquinas, empleados)
- ☐ ☐ ¿Eventos especiales? (vacaciones, mantenimiento)
- ☐ ¿Cambios tarifarios? (cambio de tarifa, precios)
-
- PASO 3: TÉCNICO
- ☐ ¿Lectura validada vs estimada?
- ☐ ¿Medidor en buen estado?
- ☐ ¿Avance de medidor lógico?
- ☐ ¿Inconsistencias con demanda conocida?
-
- PASO 4: CLIENTE
- ☐ ¿Contactar al cliente para confirmar?
- ☐ ¿Verificar consumo con ellos?
- ☐ ¿Solicitar justificación del cambio?
  _\n _ PASO 5: DECISIÓN
- ☐ Clasificación: [ ] Normal [ ] Error [ ] Fraude [ ] Indeterminado
- ☐ Acción: **************\_**************
- ☐ Seguimiento: ************\_\_************\n \*/

// ============================================================================
// 8️⃣ RESUMEN RÁPIDO
// ============================================================================

/\*\*

- ✅ VERDE = Sin anomalía → Continuar monitoreo rutinario\n _ ⚠️ ROJO = Anomalía detectada → Investigar período reportado\n _ ❓ NARANJA = Datos insuficientes → Análisis manual detallado\n \*
- 📍 PERÍODO = Fecha exacta donde inició el cambio\n _ 📊 RAZÓN = Por qué el sistema lo detectó\n _ 🎯 CONFIANZA = Qué tan seguro está el diagnóstico (70-95%)\n \*
- 🔍 INVESTIGACIÓN = TÚ determinas la causa (normal/error/fraude)\n \*/
