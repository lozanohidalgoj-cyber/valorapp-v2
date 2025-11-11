/**
 * Servicio de clasificación global de expedientes
 * Analiza toda la serie temporal de consumos y determina la clasificación general
 */

import type { ConsumoMensual, ResultadoClasificacionExpediente } from '../types';

/**
 * 🌈 Análisis avanzado del patrón de mapa de calor
 * Detecta tipos de anomalías específicas
 * basándose en colores, tendencias y distribución temporal
 */
/* function analizarPatronMapaCalor(consumos: ConsumoMensual[]): {
  patronDetectado: string;
  justificacion: string;
  mostrarInicioAnomalia: boolean;
} {
  if (consumos.length < 3) {
    return {
      patronDetectado: 'datos_insuficientes',
      justificacion: 'Necesita al menos 3 periodos para análisis',
      mostrarInicioAnomalia: false
    };
  }

  // Calcular baseline de primeros periodos (30% o máximo 12 meses)
  const periodoBaseline = Math.min(12, Math.floor(consumos.length * 0.3));
  const consumosBaseline = consumos.slice(0, periodoBaseline).map(c => c.consumoActivaTotal);
  const promedioBaseline = consumosBaseline.reduce((sum, val) => sum + val, 0) / consumosBaseline.length;
  
  // Analizar distribución de consumos por rangos de color
  let periodosVerdes = 0;     // Consumo normal (≥ 80% baseline)
  let periodosAmarillos = 0;  // Consumo moderado (50-80% baseline)
  let periodosNaranjas = 0;   // Consumo bajo (20-50% baseline)
  let periodosRojos = 0;      // Consumo crítico (< 20% baseline)
  let periodosConCambios = 0; // Cambios de potencia
  
  // Detectar patrones temporales
  let bloquesCeroConsecutivos = 0;
  let periodosSinAnomalias = 0;
  let descensoSostenidoDetectado = false;
  let cambiosPotenciaTotales = 0;

  consumos.forEach((consumo, indice) => {
    const porcentajeVsBaseline = (consumo.consumoActivaTotal / promedioBaseline) * 100;
    
    // Clasificar por color según porcentaje del baseline
    if (porcentajeVsBaseline >= 80) {
      periodosVerdes++;
    } else if (porcentajeVsBaseline >= 50) {
      periodosAmarillos++;
    } else if (porcentajeVsBaseline >= 20) {
      periodosNaranjas++;
    } else {
      periodosRojos++;
    }

    // Detectar cambios de potencia
    if (indice > 0) {
      const actual = consumo.potenciaPromedio;
      const anterior = consumos[indice - 1].potenciaPromedio;
      if (actual !== null && anterior !== null && Math.abs(actual - anterior) >= 0.5) {
        cambiosPotenciaTotales++;
        periodosConCambios++;
      }
    }

    // Detectar bloques de cero
    if (consumo.consumoActivaTotal === 0) {
      bloquesCeroConsecutivos++;
    }

    // Verificar si es periodo sin anomalías (comportamiento normal)
    if (porcentajeVsBaseline >= 75 && porcentajeVsBaseline <= 125) {
      periodosSinAnomalias++;
    }
  });

  // Detectar descenso sostenido: 3+ periodos rojos/naranjas consecutivos o distribuidos
  const periodosAnomalos = periodosNaranjas + periodosRojos;
  const porcentajeAnomalos = (periodosAnomalos / consumos.length) * 100;
  
  if (periodosAnomalos >= 3 && porcentajeAnomalos >= 30) {
    descensoSostenidoDetectado = true;
  }

  // 🎯 REGLAS DE CLASIFICACIÓN BASADAS EN PATRONES VISUALES

  // REGLA 1: No anomalía - 0 esperado (patrones estacionales de ceros)
  if (bloquesCeroConsecutivos >= 3 && periodosVerdes >= consumos.length * 0.6) {
    return {
      patronDetectado: 'No anomalía - 0 esperado',
      justificacion: `${bloquesCeroConsecutivos} periodos con cero esperado estacional, ${periodosVerdes} periodos normales`,
      mostrarInicioAnomalia: false
    };
  }

  // REGLA 2: Sin anomalía (mayoría verde/amarillo, patrón estable)
  if (periodosSinAnomalias >= consumos.length * 0.75 && periodosRojos === 0) {
    return {
      patronDetectado: 'Sin anomalía',
      justificacion: `${periodosSinAnomalias}/${consumos.length} periodos con comportamiento normal`,
      mostrarInicioAnomalia: false
    };
  }

  // REGLA 3: No objetivo por cambio de potencia (cambios frecuentes)
  if (cambiosPotenciaTotales >= 2 && periodosConCambios >= consumos.length * 0.3) {
    return {
      patronDetectado: 'No objetivo por cambio de potencia',
      justificacion: `${cambiosPotenciaTotales} cambios de potencia detectados, ${periodosConCambios} periodos afectados`,
      mostrarInicioAnomalia: false
    };
  }

  // REGLA 4: Descenso sostenido (patrón rojo/naranja dominante CON tendencia descendente)
  if (descensoSostenidoDetectado && (periodosRojos >= 2 || periodosNaranjas >= 3)) {
    return {
      patronDetectado: 'Descenso sostenido',
      justificacion: `${periodosAnomalos} periodos anómalos (${periodosRojos} críticos, ${periodosNaranjas} bajos), ${porcentajeAnomalos.toFixed(1)}% del total`,
      mostrarInicioAnomalia: true // ✅ ÚNICO QUE MUESTRA INICIO
    };
  }

  // REGLA 5: Anomalía indeterminada (patrones mixtos sin tendencia clara)
  return {
    patronDetectado: 'Anomalía indeterminada',
    justificacion: `Patrón mixto: ${periodosVerdes}V ${periodosAmarillos}A ${periodosNaranjas}N ${periodosRojos}R, sin tendencia clara`,
    mostrarInicioAnomalia: false
  };
} */

/**
 * Clasifica el expediente completo en una de las 5 categorías globales
 * @param consumosMensuales - Array de consumos mensuales ordenados cronológicamente
 * @returns Resultado de la clasificación global con detalles
 */
export const clasificarExpediente = (
  consumosMensuales: ConsumoMensual[]
): ResultadoClasificacionExpediente => {
  if (!consumosMensuales || consumosMensuales.length === 0) {
    return {
      clasificacion: 'Sin anomalía',
      inicioPeriodoAnomalia: null,
      inicioFechaAnomalia: null,
      consumoInicio: null,
      consumoPrevio: null,
      variacionInicio: null,
      periodosConAnomalia: 0,
      cambiosPotencia: 0,
      periodosConCeroEsperado: 0,
      detalle: ['No hay datos suficientes para clasificar'],
      confianza: 0,
    };
  }

  // Si hay menos de 3 periodos, no hay suficiente histórico para detectar anomalías
  if (consumosMensuales.length < 3) {
    return {
      clasificacion: 'Sin anomalía',
      inicioPeriodoAnomalia: null,
      inicioFechaAnomalia: null,
      consumoInicio: null,
      consumoPrevio: null,
      variacionInicio: null,
      periodosConAnomalia: 0,
      cambiosPotencia: 0,
      periodosConCeroEsperado: 0,
      detalle: [
        `Solo ${consumosMensuales.length} periodo(s) disponible(s)`,
        'Se necesitan al menos 3 periodos para establecer un patrón de referencia',
      ],
      confianza: 0,
    };
  }

  // 🌈 NUEVO: Análisis basado en patrones del mapa de calor
  // const analisisVisual = analizarPatronMapaCalor(consumosMensuales);

  // Usar la clasificación del análisis visual como base
  // let clasificacionFinal = analisisVisual.patronDetectado as any;
  // const mostrarInicio = analisisVisual.mostrarInicioAnomalia;

  const detalle: string[] = [];
  let confianza = 0;

  // 1. CONTAR ESTADÍSTICAS GENERALES
  const totalPeriodos = consumosMensuales.length;
  const periodosConCeroEsperado = consumosMensuales.filter(
    (c) => c.consumoActivaTotal <= 5 && esEstacional(c.mes)
  ).length;

  const cambiosPotencia = contarCambiosPotencia(consumosMensuales);

  // Anomalías por tipo de comportamiento
  // IMPORTANTE: Ignorar los primeros 2 periodos (índices 0 y 1) porque no tienen histórico suficiente
  const periodosConDescensoFuerte = consumosMensuales
    .slice(2) // Saltar los primeros 2 periodos
    .filter((c) => c.motivosAnomalia.includes('variacion_consumo_activa')).length;

  const periodosConDescensoModerado = consumosMensuales
    .slice(2) // Saltar los primeros 2 periodos
    .filter(
      (c) => c.tipoVariacion === 'descenso' && c.variacionPorcentual && c.variacionPorcentual <= -20
    ).length;

  const periodosConAnomalia = periodosConDescensoFuerte + periodosConDescensoModerado;

  // 2. CALCULAR ESTADÍSTICAS GLOBALES (TODO EL HISTÓRICO)
  const consumosTotales = consumosMensuales.map((c) => c.consumoActivaTotal);
  const promedioGlobal =
    consumosTotales.reduce((sum, val) => sum + val, 0) / consumosTotales.length;

  // Desviación estándar global
  const varianzaGlobal =
    consumosTotales.reduce((sum, val) => sum + Math.pow(val - promedioGlobal, 2), 0) /
    consumosTotales.length;
  const desviacionGlobal = Math.sqrt(varianzaGlobal);

  // Promedio histórico por mes (para comparar enero con enero, febrero con febrero, etc.)
  const promediosPorMes = new Map<number, number>();
  const acumuladosPorMes = new Map<number, { suma: number; cantidad: number }>();

  consumosMensuales.forEach((c) => {
    const actual = acumuladosPorMes.get(c.mes) ?? { suma: 0, cantidad: 0 };
    acumuladosPorMes.set(c.mes, {
      suma: actual.suma + c.consumoActivaTotal,
      cantidad: actual.cantidad + 1,
    });
  });

  acumuladosPorMes.forEach((valor, mes) => {
    promediosPorMes.set(mes, valor.suma / valor.cantidad);
  });

  // 3. ENCONTRAR INICIO DE ANOMALÍA usando análisis global
  // 2.5. ANALIZAR TENDENCIAS (≥3 descensos consecutivos / recuperación)
  const ordenados = [...consumosMensuales].sort((a, b) => a.año - b.año || a.mes - b.mes);
  const variaciones = ordenados.map((c) =>
    typeof c.variacionPorcentual === 'number' ? c.variacionPorcentual : null
  );
  let inicioBloqueDescenso = -1;
  let finBloqueDescenso = -1;
  let longitudBloque = 0;
  for (let i = 0; i < variaciones.length; i++) {
    const v = variaciones[i];
    if (v !== null && v < 0) {
      if (inicioBloqueDescenso === -1) inicioBloqueDescenso = i;
      finBloqueDescenso = i;
      longitudBloque++;
      if (longitudBloque >= 3) break;
    } else {
      inicioBloqueDescenso = -1;
      finBloqueDescenso = -1;
      longitudBloque = 0;
    }
  }
  let recuperacionConfirmada = false;
  if (longitudBloque >= 3) {
    const startEval = finBloqueDescenso + 1;
    for (let i = startEval; i < variaciones.length; i++) {
      const v = variaciones[i];
      if (v !== null && v >= 0) {
        const v1 = variaciones[i];
        const v2 = i + 1 < variaciones.length ? variaciones[i + 1] : null;
        if (v1 !== null && v1 > 0 && v2 !== null && v2 > 0) {
          recuperacionConfirmada = true;
        }
        break;
      }
    }
  }

  const inicioAnomalia = encontrarInicioAnomalia(
    consumosMensuales,
    promedioGlobal,
    desviacionGlobal,
    promediosPorMes
  );

  // 4. ANÁLISIS DE TENDENCIA GLOBAL
  const tendenciaGlobal = calcularTendenciaGlobal(consumosMensuales);

  // 5. LÓGICA DE CLASIFICACIÓN (en orden de prioridad)

  // CASO 1: Todos los consumos son cero esperado (estacional)
  if (periodosConCeroEsperado === totalPeriodos) {
    confianza = 100;
    detalle.push(`Todos los ${totalPeriodos} periodos tienen consumo cero esperado`);
    detalle.push('Patrón consistente con uso estacional (ej: vivienda vacacional)');
    return {
      clasificacion: 'No anomalía - 0 esperado',
      inicioPeriodoAnomalia: null,
      inicioFechaAnomalia: null,
      consumoInicio: null,
      consumoPrevio: null,
      variacionInicio: null,
      periodosConAnomalia: 0,
      cambiosPotencia,
      periodosConCeroEsperado,
      detalle,
      confianza,
    };
  }

  // CASO 2: Mayoría de periodos con cero esperado (> 60%)
  if (periodosConCeroEsperado / totalPeriodos > 0.6) {
    confianza = 95;
    detalle.push(
      `${periodosConCeroEsperado} de ${totalPeriodos} periodos con consumo cero esperado (${Math.round((periodosConCeroEsperado / totalPeriodos) * 100)}%)`
    );
    detalle.push('Uso predominantemente estacional');
    return {
      clasificacion: 'No anomalía - 0 esperado',
      inicioPeriodoAnomalia: null,
      inicioFechaAnomalia: null,
      consumoInicio: null,
      consumoPrevio: null,
      variacionInicio: null,
      periodosConAnomalia: 0,
      cambiosPotencia,
      periodosConCeroEsperado,
      detalle,
      confianza,
    };
  }

  // CASO 3: Cambio de potencia significativo (> 0.5 kW) durante la anomalía
  if (cambiosPotencia > 0 && inicioAnomalia) {
    const cambioPotenciaEnAnomalia = verificarCambioPotenciaEnAnomalia(
      consumosMensuales,
      inicioAnomalia.indice
    );
    if (cambioPotenciaEnAnomalia) {
      confianza = 90;
      detalle.push(`Cambio de potencia detectado en periodo ${inicioAnomalia.periodo}`);
      detalle.push(`Variación de potencia: ${cambioPotenciaEnAnomalia.variacion.toFixed(2)} kW`);
      detalle.push('El descenso de consumo coincide con cambio de potencia contratada');
      return {
        clasificacion: 'No objetivo por cambio de potencia',
        inicioPeriodoAnomalia: inicioAnomalia.periodo,
        inicioFechaAnomalia: new Date(inicioAnomalia.periodo + '-01'),
        consumoInicio: inicioAnomalia.consumo,
        consumoPrevio: inicioAnomalia.consumoPrevio,
        variacionInicio: inicioAnomalia.variacion,
        periodosConAnomalia,
        cambiosPotencia,
        periodosConCeroEsperado,
        detalle,
        confianza,
      };
    }
  }

  // CASO 4: Descenso sostenido
  // Criterios usando análisis GLOBAL (no consecutividad estricta):
  // - Debe haber inicio de anomalía detectado
  // - Al menos 3 periodos TOTALES (no necesariamente consecutivos) con consumo bajo
  // - Consumo promedio post-anomalía significativamente inferior al promedio global (≤ -20%)
  if (inicioAnomalia || (longitudBloque >= 3 && !recuperacionConfirmada)) {
    // Preferir inicio por tendencia si existe bloque de ≥3 descensos y NO hay recuperación confirmada
    const usarInicioPorTendencia = longitudBloque >= 3 && !recuperacionConfirmada;
    const inicioPeriodo = usarInicioPorTendencia
      ? ordenados[inicioBloqueDescenso].periodo
      : inicioAnomalia!.periodo;
    const indiceInicio = usarInicioPorTendencia ? inicioBloqueDescenso : inicioAnomalia!.indice;

    // Consumo promedio DESPUÉS del inicio de la anomalía
    const consumosDespuesAnomalia = consumosMensuales
      .slice(indiceInicio)
      .map((c) => c.consumoActivaTotal);
    const promedioDespuesAnomalia =
      consumosDespuesAnomalia.reduce((sum, val) => sum + val, 0) / consumosDespuesAnomalia.length;

    // Variación del consumo post-anomalía vs. promedio global
    const variacionVsGlobal = ((promedioDespuesAnomalia - promedioGlobal) / promedioGlobal) * 100;

    // 🌍 NUEVO: Contar periodos con consumo significativamente bajo (no necesariamente consecutivos)
    const periodosConConsumoBajo = consumosMensuales.slice(indiceInicio).filter((c) => {
      const zScore =
        desviacionGlobal > 0 ? (c.consumoActivaTotal - promedioGlobal) / desviacionGlobal : 0;
      // Consumo bajo si Z-Score < -1.5 O consumo < 50% del promedio global
      return zScore < -1.5 || c.consumoActivaTotal < promedioGlobal * 0.5;
    }).length;

    // Es descenso sostenido si CUMPLE CUALQUIERA de estos criterios:
    // OPCIÓN 1: ≥3 periodos con consumo bajo Y promedio post-anomalía ≤ -20% vs global
    // OPCIÓN 2: ≥5 periodos con consumo bajo (incluso sin -20% de reducción)
    // OPCIÓN 3: Promedio post-anomalía ≤ -40% vs global (descenso muy fuerte)
    const tienePeriodosSuficientes = periodosConConsumoBajo >= 3;
    const tieneDescensoSignificativo = variacionVsGlobal <= -20; // Reducido de -30% a -20%
    const tieneMuchosPeriodosBajos = periodosConConsumoBajo >= 5;
    const tieneDescensoMuyFuerte = variacionVsGlobal <= -40;

    const esDescensoSostenido =
      (tienePeriodosSuficientes && tieneDescensoSignificativo) || // Criterio normal
      tieneMuchosPeriodosBajos || // Muchos periodos bajos
      tieneDescensoMuyFuerte; // Descenso drástico

    if (esDescensoSostenido) {
      confianza = 90;
      detalle.push(`Inicio de anomalía detectado en: ${inicioPeriodo}`);
      if (usarInicioPorTendencia) {
        detalle.push(
          `Regla de tendencia: ≥3 descensos consecutivos (recuperación confirmada: ${recuperacionConfirmada ? 'sí' : 'no'})`
        );
      } else if (inicioAnomalia) {
        detalle.push(`Consumo previo: ${inicioAnomalia.consumoPrevio?.toFixed(0)} kWh`);
        detalle.push(`Consumo al inicio: ${inicioAnomalia.consumo?.toFixed(0)} kWh`);
        detalle.push(`Variación inicial: ${inicioAnomalia.variacion?.toFixed(1)}%`);
      }
      detalle.push(
        `${periodosConConsumoBajo} periodos con consumo significativamente bajo detectados`
      );
      detalle.push(`Promedio global histórico: ${promedioGlobal.toFixed(0)} kWh`);
      detalle.push(`Promedio desde inicio de anomalía: ${promedioDespuesAnomalia.toFixed(0)} kWh`);
      detalle.push(`Reducción vs. promedio global: ${variacionVsGlobal.toFixed(1)}%`);

      return {
        clasificacion: 'Descenso sostenido',
        inicioPeriodoAnomalia: inicioPeriodo,
        inicioFechaAnomalia: new Date(inicioPeriodo + '-01'),
        consumoInicio: inicioAnomalia?.consumo ?? null,
        consumoPrevio: inicioAnomalia?.consumoPrevio ?? null,
        variacionInicio: inicioAnomalia?.variacion ?? null,
        periodosConAnomalia,
        cambiosPotencia,
        periodosConCeroEsperado,
        detalle,
        confianza,
      };
    }
  }

  // CASO 5: Anomalía indeterminada
  // Solo si hay variaciones significativas pero no cumplen criterios de descenso sostenido
  // Verifica que al menos algunos periodos estén fuera del rango normal (±1.5 desviaciones)
  if (inicioAnomalia) {
    const periodosAnomalosVsGlobal = consumosMensuales
      .slice(2) // Ignorar primeros 2 periodos
      .filter((c) => {
        const zScore = (c.consumoActivaTotal - promedioGlobal) / desviacionGlobal;
        return Math.abs(zScore) > 1.5; // Fuera de rango normal
      }).length;

    // Es anomalía indeterminada si:
    // - Hay al menos 2 periodos anómalos respecto al promedio global
    // - Pero NO cumple criterios de descenso sostenido
    if (periodosAnomalosVsGlobal >= 2) {
      confianza = 70;
      detalle.push(`${periodosAnomalosVsGlobal} periodos fuera del rango normal de consumo`);
      detalle.push(`Promedio global: ${promedioGlobal.toFixed(0)} kWh`);
      detalle.push(
        `Rango normal: ${(promedioGlobal - 1.5 * desviacionGlobal).toFixed(0)} - ${(promedioGlobal + 1.5 * desviacionGlobal).toFixed(0)} kWh`
      );
      detalle.push('Patrón de consumo irregular sin tendencia sostenida clara');

      return {
        clasificacion: 'Anomalía indeterminada',
        inicioPeriodoAnomalia: inicioAnomalia?.periodo || null,
        inicioFechaAnomalia: inicioAnomalia ? new Date(inicioAnomalia.periodo + '-01') : null,
        consumoInicio: inicioAnomalia?.consumo || null,
        consumoPrevio: inicioAnomalia?.consumoPrevio || null,
        variacionInicio: inicioAnomalia?.variacion || null,
        periodosConAnomalia: periodosAnomalosVsGlobal,
        cambiosPotencia,
        periodosConCeroEsperado,
        detalle,
        confianza,
      };
    }
  }

  // CASO 6: Sin anomalía (comportamiento normal)
  confianza = 95;
  detalle.push('No se detectaron anomalías significativas');
  detalle.push(`${totalPeriodos} periodos analizados con comportamiento normal`);

  if (tendenciaGlobal > 0) {
    detalle.push(`Tendencia al alza: +${tendenciaGlobal.toFixed(0)} kWh/mes`);
  } else if (tendenciaGlobal < 0 && tendenciaGlobal > -50) {
    detalle.push(`Tendencia descendente leve: ${tendenciaGlobal.toFixed(0)} kWh/mes`);
  } else {
    detalle.push('Consumo estable');
  }

  return {
    clasificacion: 'Sin anomalía',
    inicioPeriodoAnomalia: null,
    inicioFechaAnomalia: null,
    consumoInicio: null,
    consumoPrevio: null,
    variacionInicio: null,
    periodosConAnomalia: 0,
    cambiosPotencia,
    periodosConCeroEsperado,
    detalle,
    confianza,
  };
};

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Determina si un mes es estacional (meses típicos de vacaciones)
 */
function esEstacional(mes: number): boolean {
  // Meses de verano (julio, agosto) e invierno (diciembre, enero)
  return mes === 7 || mes === 8 || mes === 12 || mes === 1;
}

/**
 * Cuenta el número de cambios de potencia significativos (≥ 0.5 kW)
 */
function contarCambiosPotencia(consumos: ConsumoMensual[]): number {
  let cambios = 0;

  for (let i = 1; i < consumos.length; i++) {
    const potenciaActual = consumos[i].potenciaPromedio;
    const potenciaAnterior = consumos[i - 1].potenciaPromedio;

    if (
      potenciaActual !== null &&
      potenciaAnterior !== null &&
      Math.abs(potenciaActual - potenciaAnterior) >= 0.5
    ) {
      cambios++;
    }
  }

  return cambios;
}

/**
 * Encuentra el primer periodo donde se detectó una anomalía significativa
 * Considera TODO el histórico (anterior Y posterior) para determinar si es anomalía real
 * IGNORA periodos con cambio de potencia (no son anomalías reales)
 * IGNORA primeros periodos (necesita baseline histórico)
 */
function encontrarInicioAnomalia(
  consumos: ConsumoMensual[],
  promedioGlobal: number,
  desviacionGlobal: number,
  promediosPorMes: Map<number, number>
): {
  periodo: string;
  indice: number;
  consumo: number;
  consumoPrevio: number | null;
  variacion: number | null;
} | null {
  // Calcular promedio de los primeros 12 meses (o todos si hay menos)
  const periodoBaseline = Math.min(12, Math.floor(consumos.length * 0.3));
  const consumosBaseline = consumos.slice(0, periodoBaseline).map((c) => c.consumoActivaTotal);
  const promedioBaseline =
    consumosBaseline.reduce((sum, val) => sum + val, 0) / consumosBaseline.length;

  // IMPORTANTE: Empezar desde después del periodo de baseline
  const indiceInicio = Math.max(2, periodoBaseline);

  for (let i = indiceInicio; i < consumos.length; i++) {
    const actual = consumos[i];
    const anterior = consumos[i - 1];

    // FILTRO CRÍTICO 1: Ignorar si hubo cambio de potencia (≥ 0.5 kW)
    const potenciaActual = actual.potenciaPromedio;
    const potenciaAnterior = anterior.potenciaPromedio;
    const huboCAMBIO_POTENCIA =
      potenciaActual !== null &&
      potenciaAnterior !== null &&
      Math.abs(potenciaActual - potenciaAnterior) >= 0.5;

    if (huboCAMBIO_POTENCIA) {
      continue; // Saltar este periodo
    }

    // Z-Score Global para este periodo
    const desviacionDelPromedio = actual.consumoActivaTotal - promedioGlobal;
    const zScoreGlobal = desviacionGlobal > 0 ? desviacionDelPromedio / desviacionGlobal : 0;

    // Variación vs promedio histórico del mes
    const promedioMes = promediosPorMes.get(actual.mes);
    const variacionVsHistoricoMes =
      promedioMes && promedioMes > 0
        ? ((actual.consumoActivaTotal - promedioMes) / promedioMes) * 100
        : null;

    // 🎯 PRIORIDAD 1: Consumo CERO o extremadamente bajo (≤ 15 kWh)
    // Este es el indicador más claro de anomalía (fraude/avería)
    if (actual.consumoActivaTotal <= 15) {
      return {
        periodo: actual.periodo,
        indice: i,
        consumo: actual.consumoActivaTotal,
        consumoPrevio: anterior.consumoActivaTotal,
        variacion: actual.variacionPorcentual,
      };
    }

    // 🎯 PRIORIDAD 2: Descenso mes-a-mes muy fuerte (≤ -50%)
    const esDescensoMuyFuerte =
      actual.variacionPorcentual !== null && actual.variacionPorcentual <= -50;

    if (esDescensoMuyFuerte) {
      return {
        periodo: actual.periodo,
        indice: i,
        consumo: actual.consumoActivaTotal,
        consumoPrevio: anterior.consumoActivaTotal,
        variacion: actual.variacionPorcentual,
      };
    }

    // 🎯 PRIORIDAD 2.5: Consumo muy bajo vs baseline (≤ 60% del promedio histórico)
    // Detecta anomalías moderadas que se mantienen sostenidas
    const esConsumoMuyBajoVsBaseline = actual.consumoActivaTotal <= promedioBaseline * 0.6;

    if (esConsumoMuyBajoVsBaseline) {
      return {
        periodo: actual.periodo,
        indice: i,
        consumo: actual.consumoActivaTotal,
        consumoPrevio: anterior.consumoActivaTotal,
        variacion: actual.variacionPorcentual,
      };
    }

    // 🎯 PRIORIDAD 2.7: Descenso significativo vs baseline (< 70% Y descenso mes-a-mes)
    // Para casos donde el consumo no es extremadamente bajo pero sí representa un descenso claro
    const esConsumoBajoConDescenso =
      actual.consumoActivaTotal < promedioBaseline * 0.7 &&
      actual.variacionPorcentual !== null &&
      actual.variacionPorcentual < -15;

    if (esConsumoBajoConDescenso) {
      return {
        periodo: actual.periodo,
        indice: i,
        consumo: actual.consumoActivaTotal,
        consumoPrevio: anterior.consumoActivaTotal,
        variacion: actual.variacionPorcentual,
      };
    }

    // 🎯 PRIORIDAD 3: Z-Score muy bajo (< -2.5) + consumo bajo vs baseline (< 40%)
    const esZScoreMuyBajo = zScoreGlobal < -2.5;
    const esConsumoBajoVsBaseline = actual.consumoActivaTotal < promedioBaseline * 0.4;

    if (esZScoreMuyBajo && esConsumoBajoVsBaseline) {
      return {
        periodo: actual.periodo,
        indice: i,
        consumo: actual.consumoActivaTotal,
        consumoPrevio: anterior.consumoActivaTotal,
        variacion: actual.variacionPorcentual,
      };
    }

    // 🎯 PRIORIDAD 4: Descenso muy fuerte (≤ -40%) + muy por debajo del histórico del mes (< -70%)
    const esDescensoFuerte =
      actual.variacionPorcentual !== null && actual.variacionPorcentual <= -40;
    const esMuyBajoVsHistoricoMes =
      variacionVsHistoricoMes !== null && variacionVsHistoricoMes < -70;

    if (esDescensoFuerte && esMuyBajoVsHistoricoMes) {
      return {
        periodo: actual.periodo,
        indice: i,
        consumo: actual.consumoActivaTotal,
        consumoPrevio: anterior.consumoActivaTotal,
        variacion: actual.variacionPorcentual,
      };
    }
  }

  return null;
}

/**
 * Calcula la tendencia global de consumo (kWh/mes) usando regresión lineal simple
 */
function calcularTendenciaGlobal(consumos: ConsumoMensual[]): number {
  if (consumos.length < 3) return 0;

  const n = consumos.length;
  let sumaX = 0;
  let sumaY = 0;
  let sumaXY = 0;
  let sumaX2 = 0;

  consumos.forEach((c, index) => {
    const x = index;
    const y = c.consumoActivaTotal;
    sumaX += x;
    sumaY += y;
    sumaXY += x * y;
    sumaX2 += x * x;
  });

  // Pendiente de la regresión lineal
  const pendiente = (n * sumaXY - sumaX * sumaY) / (n * sumaX2 - sumaX * sumaX);

  return pendiente; // kWh/mes
}

/**
 * Verifica si hubo cambio de potencia cerca del inicio de la anomalía (±2 periodos)
 */
function verificarCambioPotenciaEnAnomalia(
  consumos: ConsumoMensual[],
  indiceAnomalia: number
): { variacion: number } | null {
  const rango = 2; // Buscar ±2 periodos

  for (
    let i = Math.max(0, indiceAnomalia - rango);
    i <= Math.min(consumos.length - 1, indiceAnomalia + rango);
    i++
  ) {
    if (i === 0) continue; // Saltar primer periodo (no tiene anterior)

    const potenciaActual = consumos[i].potenciaPromedio;
    const potenciaAnterior = consumos[i - 1].potenciaPromedio;

    if (
      potenciaActual !== null &&
      potenciaAnterior !== null &&
      Math.abs(potenciaActual - potenciaAnterior) >= 0.5
    ) {
      return {
        variacion: potenciaActual - potenciaAnterior,
      };
    }
  }

  return null;
}
