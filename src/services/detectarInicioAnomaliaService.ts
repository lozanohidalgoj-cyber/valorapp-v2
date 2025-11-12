/**
 * 🔍 Servicio de Detección de Inicio de Anomalía (Sistema Experto)
 *
 * Detecta SOLO EL INICIO de anomalías considerando múltiples factores:
 * - Descenso sostenido (>10% durante 3+ meses)
 * - Variación anómala (>20% vs histórico del mismo mes)
 * - Consumo cero (esperado vs sospechoso)
 * - Descenso brusco mes a mes (≥30%)
 * - Ciclo de facturación
 *
 * Retorna clasificación en 3 categorías:
 * 1. "Anomalía indeterminada" - No hay descenso claro o es estacional
 * 2. "Período indeterminado" - Necesita análisis por horas
 * 3. "Determinación del descenso en [mes/año]" - Inicio detectado
 */

import type { ConsumoMensual } from '../types';

// ============================================================================
// 📊 TIPOS INTERNOS
// ============================================================================

/**
 * Clasificación de anomalía
 */
export type ClasificacionAnomalia = 'sin_anomalia' | 'periodo_indeterminado' | 'anomalia_detectada';

/**
 * Resultado de detección de anomalía
 */
export interface ResultadoDeteccionInicio {
  /** Clasificación de la anomalía */
  clasificacion: ClasificacionAnomalia;
  /** Mensaje legible para el usuario */
  mensaje: string;
  /** Periodo donde inicia la anomalía (si aplica) */
  periodoInicio?: string;
  /** Mes y año legible (ej: "enero 2024") */
  periodoLegible?: string;
  /** Razón/factor detectado */
  razon: string;
  /** Confianza de la detección (0-100) */
  confianza: number;
  /** Detalles técnicos para debugging */
  detalles: Record<string, unknown>;
}

// ============================================================================
// 🛠️ UTILIDADES INTERNAS
// ============================================================================

/**
 * Detecta el tipo de ciclo de facturación basado en días
 * @param dias - Número de días del período
 * @returns Tipo de ciclo ('mensual', 'bimestral', 'trimestral', etc.)
 */
const detectarCicloFacturacion = (dias: number): string => {
  if (dias >= 25 && dias <= 35) return 'mensual';
  if (dias >= 50 && dias <= 70) return 'bimestral';
  if (dias >= 75 && dias <= 105) return 'trimestral';
  if (dias >= 100 && dias <= 140) return 'cuatrimestral';
  if (dias >= 150 && dias <= 200) return 'semestral';
  if (dias >= 350 && dias <= 380) return 'anual';
  return 'irregular';
};

/**
 * Normaliza el consumo activo a un periodo equivalente de 30 días.
 * Considera los días facturados para evitar falsos descensos por ciclos cortos.
 *
 * @param registro - Datos mensuales agregados
 * @returns Consumo equivalente a 30 días
 */
const obtenerConsumoNormalizadoMensual = (registro: ConsumoMensual): number => {
  const consumoBase =
    registro.consumoActivaTotal > 0
      ? registro.consumoActivaTotal
      : registro.consumoTotal > 0
        ? registro.consumoTotal
        : registro.energiaReconstruidaTotal;

  if (registro.dias > 0 && consumoBase > 0) {
    const normalizado = (consumoBase / registro.dias) * 30;
    if (Number.isFinite(normalizado)) return normalizado;
  }

  if (registro.consumoPromedioDiario > 0) {
    const normalizado = registro.consumoPromedioDiario * 30;
    if (Number.isFinite(normalizado)) return normalizado;
  }

  if (Number.isFinite(consumoBase)) {
    return consumoBase;
  }

  return 0;
};

const calcularBaselineNormalizado = (
  normalizados: number[],
  indice: number,
  minimo: number,
  maximo: number
): number | null => {
  const valores: number[] = [];

  for (let i = indice - 1; i >= 0 && valores.length < maximo; i--) {
    const valor = normalizados[i];
    if (!Number.isFinite(valor) || valor <= 0) {
      continue;
    }
    valores.push(valor);
  }

  if (valores.length < minimo) {
    return null;
  }

  const suma = valores.reduce((acc, val) => acc + val, 0);
  return suma / valores.length;
};

/**
 * Calcula el promedio histórico de un mes específico
 * excluyendo el año actual
 * @param comparativa - Array de datos mensuales
 * @param mesObjetivo - Mes a analizar (1-12)
 * @param añoActual - Año actual (para excluir)
 * @returns Promedio histórico del mes
 */
const calcularPromedioHistoricoMes = (
  comparativa: ConsumoMensual[],
  mesObjetivo: number,
  añoActual: number
): number => {
  const registrosMes = comparativa.filter(
    (c) => c.mes === mesObjetivo && c.año !== añoActual && obtenerConsumoNormalizadoMensual(c) > 0
  );

  if (registrosMes.length === 0) return 0;

  const suma = registrosMes.reduce((acc, r) => acc + obtenerConsumoNormalizadoMensual(r), 0);
  return suma / registrosMes.length;
};

/**
 * Calcula promedio anual
 * @param comparativa - Array de datos mensuales
 * @param año - Año a promediar
 * @returns Promedio anual
 */
const calcularPromedioAnual = (comparativa: ConsumoMensual[], año: number): number => {
  const registrosAño = comparativa.filter(
    (c) => c.año === año && obtenerConsumoNormalizadoMensual(c) > 0
  );

  if (registrosAño.length === 0) return 0;

  const suma = registrosAño.reduce((acc, r) => acc + obtenerConsumoNormalizadoMensual(r), 0);
  return suma / registrosAño.length;
};

/**
 * Verifica si un consumo cero es esperado (patrón histórico)
 * @param comparativa - Array de datos mensuales
 * @param mes - Mes actual
 * @param año - Año actual
 * @returns true si el cero es esperado en historial
 */
const esCeroEsperado = (comparativa: ConsumoMensual[], mes: number, año: number): boolean => {
  // Revisar años anteriores para ver si en este mes había ceros
  const cerosEnMes = comparativa.filter(
    (c) => c.mes === mes && c.año !== año && c.consumoActivaTotal === 0
  );

  return cerosEnMes.length > 0; // Si hay precedente, es esperado
};

/**
 * Detecta descenso sostenido SIN RECUPERACIÓN (>10% durante 3+ meses)
 * ⚠️ IMPORTANTE: Solo marca anomalía si NO hay recuperación posterior
 *
 * CASOS:
 * ✅ Detecta: 500→450→405→365→340 (baja continua, SIN recuperación)
 * ❌ NO detecta: 500→450→405→480→510 (hay recuperación, es normal)
 *
 * @param comparativa - Array de datos mensuales
 * @param índiceActual - Índice del mes actual (se asume orden cronológico)
 * @returns { detectado, duracionMeses, huboRecuperacion, indiceInicio, umbralRecuperacion }
 */
const detectarDescensoSostenidoSinRecuperacion = (
  comparativa: ConsumoMensual[]
): {
  detectado: boolean;
  indiceInicio: number;
  indiceFin: number;
  duracionMeses: number;
  huboRecuperacion: boolean;
  promedioBaseline: number;
  consumoNormalizadoInicio: number;
  consumoMinimoNormalizado: number;
  variacionInicioBaseline: number;
  variacionMinimaBaseline: number;
  umbralRecuperacion: number;
} => {
  const UMBRAL_DESCENSO = 10; // %
  const MESES_REQUERIDOS = 3;
  const MESES_BASELINE_MAX = 3;
  const MESES_BASELINE_MIN = 2;
  const FACTOR_RECUPERACION = 1.15;

  if (comparativa.length < MESES_REQUERIDOS) {
    return {
      detectado: false,
      indiceInicio: -1,
      indiceFin: -1,
      duracionMeses: 0,
      huboRecuperacion: false,
      promedioBaseline: 0,
      consumoNormalizadoInicio: 0,
      consumoMinimoNormalizado: 0,
      variacionInicioBaseline: 0,
      variacionMinimaBaseline: 0,
      umbralRecuperacion: 0,
    };
  }

  const normalizados = comparativa.map(obtenerConsumoNormalizadoMensual);

  for (let i = 0; i < comparativa.length; i++) {
    const consumoActual = normalizados[i];

    if (!Number.isFinite(consumoActual) || consumoActual <= 0) {
      continue;
    }

    const baseline = calcularBaselineNormalizado(
      normalizados,
      i,
      MESES_BASELINE_MIN,
      MESES_BASELINE_MAX
    );

    if (baseline === null || baseline <= 0) {
      continue;
    }

    const umbralDescensoAbsoluto = baseline * (1 - UMBRAL_DESCENSO / 100);

    if (consumoActual > umbralDescensoAbsoluto) {
      continue;
    }

    let indiceFin = i;
    let consumoMinimo = consumoActual;

    for (let j = i + 1; j < comparativa.length; j++) {
      const consumoEvaluado = normalizados[j];

      if (!Number.isFinite(consumoEvaluado) || consumoEvaluado <= 0) {
        break;
      }

      if (consumoEvaluado <= umbralDescensoAbsoluto) {
        indiceFin = j;
        consumoMinimo = Math.min(consumoMinimo, consumoEvaluado);
      } else {
        break;
      }
    }

    const duracion = indiceFin - i + 1;

    if (duracion < MESES_REQUERIDOS) {
      i = indiceFin;
      continue;
    }

    const umbralRecuperacion = consumoMinimo * FACTOR_RECUPERACION;
    let huboRecuperacion = false;

    for (let k = indiceFin + 1; k < comparativa.length; k++) {
      const consumoPosterior = normalizados[k];
      if (!Number.isFinite(consumoPosterior) || consumoPosterior <= 0) {
        continue;
      }

      if (consumoPosterior >= umbralRecuperacion) {
        huboRecuperacion = true;
        break;
      }
    }

    if (!huboRecuperacion) {
      const variacionInicioBaseline = ((consumoActual - baseline) / baseline) * 100;
      const variacionMinimaBaseline = ((consumoMinimo - baseline) / baseline) * 100;

      return {
        detectado: true,
        indiceInicio: i,
        indiceFin,
        duracionMeses: duracion,
        huboRecuperacion,
        promedioBaseline: baseline,
        consumoNormalizadoInicio: consumoActual,
        consumoMinimoNormalizado: consumoMinimo,
        variacionInicioBaseline,
        variacionMinimaBaseline,
        umbralRecuperacion,
      };
    }

    i = indiceFin;
  }

  return {
    detectado: false,
    indiceInicio: -1,
    indiceFin: -1,
    duracionMeses: 0,
    huboRecuperacion: false,
    promedioBaseline: 0,
    consumoNormalizadoInicio: 0,
    consumoMinimoNormalizado: 0,
    variacionInicioBaseline: 0,
    variacionMinimaBaseline: 0,
    umbralRecuperacion: 0,
  };
};

/**
 * Detecta descenso brusco mes a mes (≥30%)
 * @param consumoActual - Consumo actual
 * @param consumoAnterior - Consumo mes anterior
 * @returns true si hay descenso ≥ 30%
 */
const hayDescensobrusCo = (consumoActual: number, consumoAnterior: number): boolean => {
  if (consumoAnterior === 0) return false;

  const variacion = ((consumoActual - consumoAnterior) / consumoAnterior) * 100;
  return variacion <= -30;
};

/**
 * Convierte mes (1-12) a nombre español
 * @param mes - Número de mes
 * @returns Nombre del mes
 */
const getNombreMes = (mes: number): string => {
  const meses = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  return meses[mes - 1] || '';
};

/**
 * Analiza la serie de variaciones mes-a-mes para identificar:
 * - Bloques de descensos consecutivos (variación < 0)
 * - Inicio de recuperación (cambio de signo: negativo → positivo o cero)
 * - Recuperación confirmada (≥2 aumentos consecutivos: variación > 0)
 */
const analizarTendencias = (comparativa: ConsumoMensual[]) => {
  const ordenada = [...comparativa].sort((a, b) => a.año - b.año || a.mes - b.mes);
  const variaciones: Array<number | null> = ordenada.map((c) => {
    // Usar la variaciónPorcentual ya calculada en generarComparativaMensual
    // Puede ser null para el primer mes
    return typeof c.variacionPorcentual === 'number' ? c.variacionPorcentual : null;
  });

  // Encontrar primer bloque de ≥3 descensos consecutivos (variación < 0)
  let inicioBloqueDescenso = -1;
  let finBloqueDescenso = -1;
  let longitudBloque = 0;

  for (let i = 0; i < variaciones.length; i++) {
    const v = variaciones[i];
    if (v !== null && v < 0) {
      if (inicioBloqueDescenso === -1) inicioBloqueDescenso = i;
      finBloqueDescenso = i;
      longitudBloque++;
      if (longitudBloque >= 3) {
        // Tomamos el primer bloque que cumpla
        break;
      }
    } else {
      // Se rompió la racha; resetear
      inicioBloqueDescenso = -1;
      finBloqueDescenso = -1;
      longitudBloque = 0;
    }
  }

  // Buscar inicio de recuperación (cambio de signo de negativo a >= 0) y recuperación confirmada (≥2 aumentos > 0)
  let indiceInicioRecuperacion = -1;
  let recuperacionConfirmada = false;

  if (longitudBloque >= 3) {
    // Empezar a evaluar a partir del mes siguiente al final del bloque
    const startEval = finBloqueDescenso + 1;

    // Buscar el primer cambio a variación >= 0
    for (let i = startEval; i < variaciones.length; i++) {
      const v = variaciones[i];
      if (v !== null && v >= 0) {
        indiceInicioRecuperacion = i;
        // Verificar si hay dos aumentos consecutivos (> 0) desde aquí
        const v1 = variaciones[i];
        const v2 = i + 1 < variaciones.length ? variaciones[i + 1] : null;
        if (v1 !== null && v1 > 0 && v2 !== null && v2 > 0) {
          recuperacionConfirmada = true;
        }
        break;
      }
    }
  }

  return {
    tieneBloqueDescenso: longitudBloque >= 3,
    inicioBloqueDescenso,
    finBloqueDescenso,
    longitudBloque,
    indiceInicioRecuperacion,
    recuperacionConfirmada,
    periodoInicioBloque: longitudBloque >= 3 ? ordenada[inicioBloqueDescenso].periodo : undefined,
    periodoInicioRecuperacion:
      indiceInicioRecuperacion >= 0 ? ordenada[indiceInicioRecuperacion].periodo : undefined,
  } as const;
};

// ============================================================================
// 🔍 DETECTOR PRINCIPAL
// ============================================================================

/**
 * Detecta el INICIO de anomalía en los datos
 * Retorna clasificación única con periodo de inicio
 *
 * @param comparativa - Array de datos mensuales ordenados cronológicamente
 * @returns Resultado con clasificación y periodo de inicio
 *
 * @example
 * const resultado = detectarInicioAnomalia(comparativaMensual);
 * // {
 * //   clasificacion: 'anomalia_detectada',
 * //   mensaje: 'Determinación del descenso en marzo 2024',
 * //   periodoInicio: '2024-03',
 * //   periodoLegible: 'marzo 2024',
 * //   razon: 'Descenso brusco >= 30% respecto mes anterior',
 * //   confianza: 95
 * // }
 */
export const detectarInicioAnomalia = (comparativa: ConsumoMensual[]): ResultadoDeteccionInicio => {
  // Validar entrada
  if (!comparativa || comparativa.length === 0) {
    return {
      clasificacion: 'periodo_indeterminado',
      mensaje: 'No hay suficientes datos para análisis',
      razon: 'Datos insuficientes',
      confianza: 0,
      detalles: { tipo: 'sin_datos' },
    };
  }

  // Ordenar cronológicamente
  const comparativaOrdenada = [...comparativa].sort((a, b) => {
    if (a.año !== b.año) return a.año - b.año;
    return a.mes - b.mes;
  });

  // REGLA 0: INTERPRETACIÓN DE TENDENCIA
  // =====================================
  // ≥ 3 descensos consecutivos → inicio de anomalía en el primer mes del bloque
  // Cambio de signo negativo→positivo → inicio de recuperación
  // ≥ 2 aumentos consecutivos tras descensos → recuperación confirmada
  const tendencia = analizarTendencias(comparativaOrdenada);
  if (tendencia.tieneBloqueDescenso) {
    const periodoInicio = tendencia.periodoInicioBloque!;
    const [anioInicio, mesInicio] = periodoInicio.split('-').map(Number);

    // Si hay recuperación confirmada posteriormente, NO declarar anomalía por tendencia
    // (se permite que otras reglas determinen si hubo anomalía puntual)
    if (!tendencia.recuperacionConfirmada) {
      return {
        clasificacion: 'anomalia_detectada',
        mensaje: `Determinación del descenso en ${getNombreMes(mesInicio)} ${anioInicio}`,
        periodoInicio,
        periodoLegible: `${getNombreMes(mesInicio)} ${anioInicio}`,
        razon:
          'Tendencia descendente sostenida: ≥ 3 descensos consecutivos (variación mes a mes < 0)',
        confianza: 88,
        detalles: {
          tipo: 'tendencia_descendente_sostenida',
          inicioBloqueIndice: tendencia.inicioBloqueDescenso,
          finBloqueIndice: tendencia.finBloqueDescenso,
          longitudBloque: tendencia.longitudBloque,
          inicioRecuperacionIndice: tendencia.indiceInicioRecuperacion,
          recuperacionConfirmada: tendencia.recuperacionConfirmada,
        },
      };
    }
    // Si hubo recuperación confirmada, seguimos con el resto de reglas sin marcar inicio por tendencia
  }

  // REGLA 1: DESCENSO BRUSCO (mes a mes, ≥30%)
  // ============================================
  const consumosNormalizados = comparativaOrdenada.map(obtenerConsumoNormalizadoMensual);

  let descensoBruscoSinHistorial = false;

  for (let i = 1; i < comparativaOrdenada.length; i++) {
    const actual = comparativaOrdenada[i];
    const anterior = comparativaOrdenada[i - 1];

    const consumoAnteriorNormalizado = consumosNormalizados[i - 1];
    const consumoActualNormalizado = consumosNormalizados[i];

    if (
      !Number.isFinite(consumoAnteriorNormalizado) ||
      consumoAnteriorNormalizado <= 0 ||
      !Number.isFinite(consumoActualNormalizado) ||
      consumoActualNormalizado <= 0
    ) {
      continue;
    }

    if (!hayDescensobrusCo(consumoActualNormalizado, consumoAnteriorNormalizado)) {
      continue;
    }

    const MESES_BASELINE_DESCENSO_BRUSCO_MIN = 3;
    const MESES_BASELINE_DESCENSO_BRUSCO_MAX = 6;
    const baseline = calcularBaselineNormalizado(
      consumosNormalizados,
      i,
      MESES_BASELINE_DESCENSO_BRUSCO_MIN,
      MESES_BASELINE_DESCENSO_BRUSCO_MAX
    );

    if (baseline === null || baseline <= 0) {
      descensoBruscoSinHistorial = true;
      continue;
    }

    const variacion =
      ((consumoActualNormalizado - consumoAnteriorNormalizado) / consumoAnteriorNormalizado) * 100;
    const variacionVsBaseline = ((consumoActualNormalizado - baseline) / baseline) * 100;

    const ciclo = detectarCicloFacturacion(actual.dias);

    return {
      clasificacion: 'anomalia_detectada',
      mensaje: `Determinación del descenso en ${getNombreMes(actual.mes)} ${actual.año}`,
      periodoInicio: actual.periodo,
      periodoLegible: `${getNombreMes(actual.mes)} ${actual.año}`,
      razon: `Descenso brusco >= 30% respecto mes anterior (normalizado por días facturados: ${variacion.toFixed(1)}%)`,
      confianza: 95,
      detalles: {
        tipo: 'descenso_brusco_mes_a_mes',
        variacionDetectada: variacion,
        variacionVsBaseline,
        umbral: -30,
        cicloFacturacion: ciclo,
        consumoAnteriorNormalizado,
        consumoActualNormalizado,
        baselineHistorial: baseline,
        diasAnterior: anterior.dias,
        diasActual: actual.dias,
      },
    };
  }

  if (descensoBruscoSinHistorial) {
    return {
      clasificacion: 'periodo_indeterminado',
      mensaje:
        'Se detectó un descenso brusco, pero solo hay 1-2 facturas previas. Requiere validar manualmente con más historial.',
      razon: 'Descenso brusco sin suficiente historial previo para confirmar anomalía',
      confianza: 40,
      detalles: {
        tipo: 'descenso_brusco_sin_historial',
        minimoFacturasRequeridas: 3,
      },
    };
  }

  // REGLA 2: DESCENSO SOSTENIDO SIN RECUPERACIÓN (>10% durante 3+ meses)
  // =====================================================================
  const descensoSostenido = detectarDescensoSostenidoSinRecuperacion(comparativaOrdenada);

  if (descensoSostenido.detectado && descensoSostenido.indiceInicio >= 0) {
    const {
      indiceInicio,
      duracionMeses,
      promedioBaseline,
      consumoNormalizadoInicio,
      consumoMinimoNormalizado,
      variacionInicioBaseline,
      variacionMinimaBaseline,
      umbralRecuperacion,
    } = descensoSostenido;

    const periodoInicio = comparativaOrdenada[indiceInicio];
    const promedioAnterior = calcularPromedioAnual(comparativaOrdenada, periodoInicio.año - 1);
    const variacionPromedio =
      promedioAnterior > 0
        ? ((consumoNormalizadoInicio - promedioAnterior) / promedioAnterior) * 100
        : variacionInicioBaseline;

    return {
      clasificacion: 'anomalia_detectada',
      mensaje: `Determinación del descenso en ${getNombreMes(periodoInicio.mes)} ${periodoInicio.año} (descenso sostenido ${duracionMeses} meses sin recuperación)`,
      periodoInicio: periodoInicio.periodo,
      periodoLegible: `${getNombreMes(periodoInicio.mes)} ${periodoInicio.año}`,
      razon: `Descenso sostenido > 10% durante ${duracionMeses} meses consecutivos SIN recuperación posterior (normalizado por días facturados)`,
      confianza: 85,
      detalles: {
        tipo: 'descenso_sostenido_sin_recuperacion',
        variacionDetectada: variacionPromedio,
        umbral: -10,
        duracionMeses,
        huboRecuperacion: false,
        indiceInicio,
        umbralRecuperacion,
        consumoMinimoNormalizado,
        promedioBaseline,
        variacionInicioBaseline,
        variacionMinimaBaseline,
        consumoNormalizadoInicio,
      },
    };
  }

  // REGLA 3: VARIACIÓN ANÓMALA (>20% vs histórico del mismo mes)
  // ============================================================
  const añoActual = Math.max(...comparativaOrdenada.map((c) => c.año));

  for (const registro of comparativaOrdenada.filter((c) => c.año === añoActual)) {
    const promedioHistorico = calcularPromedioHistoricoMes(
      comparativaOrdenada,
      registro.mes,
      añoActual
    );

    if (promedioHistorico === 0) continue; // Sin histórico

    const consumoActualNormalizado = obtenerConsumoNormalizadoMensual(registro);

    const variacion = ((consumoActualNormalizado - promedioHistorico) / promedioHistorico) * 100;

    if (Math.abs(variacion) > 20) {
      const tipo = variacion < 0 ? 'Descenso' : 'Aumento';
      const ciclo = detectarCicloFacturacion(registro.dias);

      return {
        clasificacion: 'anomalia_detectada',
        mensaje: `Determinación del descenso en ${getNombreMes(registro.mes)} ${registro.año}`,
        periodoInicio: registro.periodo,
        periodoLegible: `${getNombreMes(registro.mes)} ${registro.año}`,
        razon: `${tipo} > 20% respecto al promedio histórico de ${getNombreMes(registro.mes)}`,
        confianza: 80,
        detalles: {
          tipo: 'variacion_historio_anual',
          variacionDetectada: variacion,
          historicoPromedio: promedioHistorico,
          umbral: 20,
          cicloFacturacion: ciclo,
          consumoActualNormalizado,
        },
      };
    }
  }

  // REGLA 4: CONSUMO CERO (sospechoso vs esperado)
  // ==============================================
  for (let i = 0; i < comparativaOrdenada.length; i++) {
    const registro = comparativaOrdenada[i];

    if (registro.consumoActivaTotal === 0 && registro.registros > 0) {
      const esEsperado = esCeroEsperado(comparativaOrdenada, registro.mes, registro.año);
      const ciclo = detectarCicloFacturacion(registro.dias);

      if (!esEsperado) {
        // Cero sospechoso
        return {
          clasificacion: 'anomalia_detectada',
          mensaje: `Determinación del descenso en ${getNombreMes(registro.mes)} ${registro.año} (consumo cero sospechoso)`,
          periodoInicio: registro.periodo,
          periodoLegible: `${getNombreMes(registro.mes)} ${registro.año}`,
          razon: 'Consumo cero registrado en mes donde nunca antes ocurrió',
          confianza: 70,
          detalles: {
            tipo: 'consumo_cero_sospechoso',
            cicloFacturacion: ciclo,
            registrosEnPeriodo: registro.registros,
          },
        };
      }
    }
  }

  // NINGUNA ANOMALÍA DETECTADA
  // ==========================
  return {
    clasificacion: 'sin_anomalia',
    mensaje: 'No se detectaron anomalías en los datos',
    razon: 'Cambios menores al 40%, comportamiento estacional normal o contrato con bajo uso',
    confianza: 90,
    detalles: {
      tipo: 'sin_anomalia',
      umbralesVerificados: [
        'descenso_brusco: < -30%',
        'descenso_sostenido: < -10% por 3+ meses',
        'variacion_historica: < 20%',
      ],
    },
  };
};

/**
 * Convierte un resultado a formato legible para mostrar en UI
 * @param resultado - Resultado de detección
 * @returns Mensaje formateado
 */
export const formatearResultadoDeteccion = (resultado: ResultadoDeteccionInicio): string => {
  if (resultado.clasificacion === 'sin_anomalia') {
    return `⚠️ Anomalía indeterminada - ${resultado.mensaje}`;
  }

  if (resultado.clasificacion === 'anomalia_detectada') {
    return `⚠️ ${resultado.mensaje}\n📍 Razón: ${resultado.razon}\n🎯 Confianza: ${resultado.confianza}%`;
  }

  return `❓ ${resultado.mensaje}`;
};
