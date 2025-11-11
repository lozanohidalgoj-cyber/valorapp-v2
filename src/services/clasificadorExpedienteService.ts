/**
 * Servicio de clasificación global de expedientes
 * Analiza toda la serie temporal de consumos y determina la clasificación general
 */

import type { ConsumoMensual, ResultadoClasificacionExpediente } from '../types';

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
  // Criterios más estrictos usando análisis global:
  // - Debe haber inicio de anomalía detectado
  // - Al menos 3 periodos consecutivos en descenso
  // - Consumo actual significativamente inferior al promedio global (< -30%)
  if (inicioAnomalia) {
    const periodosConsecutivosDescenso = contarPeriodosConsecutivosDescenso(
      consumosMensuales,
      inicioAnomalia.indice
    );

    // Consumo promedio DESPUÉS del inicio de la anomalía
    const consumosDespuesAnomalia = consumosMensuales
      .slice(inicioAnomalia.indice)
      .map((c) => c.consumoActivaTotal);
    const promedioDespuesAnomalia =
      consumosDespuesAnomalia.reduce((sum, val) => sum + val, 0) / consumosDespuesAnomalia.length;

    // Variación del consumo post-anomalía vs. promedio global
    const variacionVsGlobal = ((promedioDespuesAnomalia - promedioGlobal) / promedioGlobal) * 100;

    // Es descenso sostenido si:
    // 1. Al menos 3 periodos consecutivos en descenso
    // 2. El promedio post-anomalía es al menos 30% menor que el promedio global
    if (periodosConsecutivosDescenso >= 3 && variacionVsGlobal <= -30) {
      confianza = 90;
      detalle.push(`Inicio de anomalía detectado en: ${inicioAnomalia.periodo}`);
      detalle.push(`Consumo previo: ${inicioAnomalia.consumoPrevio?.toFixed(0)} kWh`);
      detalle.push(`Consumo al inicio: ${inicioAnomalia.consumo?.toFixed(0)} kWh`);
      detalle.push(`Variación inicial: ${inicioAnomalia.variacion?.toFixed(1)}%`);
      detalle.push(
        `Descenso sostenido durante ${periodosConsecutivosDescenso} periodos consecutivos`
      );
      detalle.push(`Promedio global: ${promedioGlobal.toFixed(0)} kWh`);
      detalle.push(`Promedio post-anomalía: ${promedioDespuesAnomalia.toFixed(0)} kWh`);
      detalle.push(`Reducción vs. promedio global: ${variacionVsGlobal.toFixed(1)}%`);

      return {
        clasificacion: 'Descenso sostenido',
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
  // IMPORTANTE: Empezar desde índice 2 (3er periodo) para tener suficiente histórico
  for (let i = 2; i < consumos.length; i++) {
    const actual = consumos[i];
    const anterior = consumos[i - 1];

    // FILTRO CRÍTICO: Ignorar si hubo cambio de potencia (≥ 0.5 kW)
    const potenciaActual = actual.potenciaPromedio;
    const potenciaAnterior = anterior.potenciaPromedio;
    const huboCAMBIO_POTENCIA =
      potenciaActual !== null &&
      potenciaAnterior !== null &&
      Math.abs(potenciaActual - potenciaAnterior) >= 0.5;

    // Si hubo cambio de potencia, NO es anomalía de fraude/avería
    if (huboCAMBIO_POTENCIA) {
      continue; // Saltar este periodo
    }

    // CRITERIO 1: Descenso mes-a-mes muy fuerte (≤ -40%)
    const esDescensoMuyFuerte =
      actual.variacionPorcentual !== null && actual.variacionPorcentual <= -40;

    // CRITERIO 2: Consumo extremadamente bajo (<= 10 kWh) cuando el promedio global es alto (>100 kWh)
    const esConsumoExtremadamenteBajo = actual.consumoActivaTotal <= 10 && promedioGlobal > 100;

    // CRITERIO 3: Descenso moderado (≤ -30%) + consumo muy por debajo del promedio del mes (< -50%)
    const esDescensoModerado =
      actual.variacionPorcentual !== null && actual.variacionPorcentual <= -30;
    const promedioMes = promediosPorMes.get(actual.mes);
    const esMuyBajoVsHistoricoMes =
      promedioMes && promedioMes > 0
        ? ((actual.consumoActivaTotal - promedioMes) / promedioMes) * 100 < -50
        : false;

    // CRITERIO 4: Z-Score muy bajo (< -2.5) respecto al promedio global
    const desviacionDelPromedio = actual.consumoActivaTotal - promedioGlobal;
    const zScoreGlobal = desviacionGlobal > 0 ? desviacionDelPromedio / desviacionGlobal : 0;
    const esMuyBajoVsGlobal = zScoreGlobal < -2.5;

    // Es anomalía si cumple CUALQUIERA de estos casos:
    // - Descenso muy fuerte mes-a-mes (≤ -40%)
    // - Consumo extremadamente bajo (<= 10 kWh)
    // - Descenso moderado (≤ -30%) Y muy por debajo del promedio del mes (< -50%)
    // - Z-Score muy bajo (< -2.5) Y descenso mes-a-mes significativo (≤ -25%)
    const esAnomalia =
      esDescensoMuyFuerte ||
      esConsumoExtremadamenteBajo ||
      (esDescensoModerado && esMuyBajoVsHistoricoMes) ||
      (esMuyBajoVsGlobal &&
        actual.variacionPorcentual !== null &&
        actual.variacionPorcentual <= -25);

    if (esAnomalia) {
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
 * Cuenta periodos consecutivos con descenso a partir de un índice
 */
function contarPeriodosConsecutivosDescenso(
  consumos: ConsumoMensual[],
  indiceInicio: number
): number {
  let consecutivos = 0;

  for (let i = indiceInicio; i < consumos.length; i++) {
    const variacion = consumos[i].variacionPorcentual;

    // Considerar descenso si:
    // 1. Variación negativa
    // 2. O consumo muy bajo (< 100 kWh)
    const esDescenso =
      (variacion !== null && variacion < 0) || consumos[i].consumoActivaTotal < 100;

    if (esDescenso) {
      consecutivos++;
    } else {
      // Si hay un periodo sin descenso, rompe la racha
      // PERO permitir 1 periodo de "recuperación" antes de romper
      if (
        i + 1 < consumos.length &&
        consumos[i + 1].variacionPorcentual !== null &&
        consumos[i + 1].variacionPorcentual! < 0
      ) {
        consecutivos++; // Incluir este periodo como parte de la tendencia
        continue;
      }
      break;
    }
  }

  return consecutivos;
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
