/**
 * 🔍 Servicio de Detección de Anomalías
 * 
 * Módulo especializado en detectar anomalías en datos de consumo energético,
 * identificando descensos anormales, picos y patrones irregulares.
 */

import type { ConsumoPeriodo, Anomalia, TipoAnomalia, NivelSeveridad } from '../types';
import { calcularPromedio, calcularDesviacionEstandar, generarId } from '../utils';

// ============================================
// 🎯 Configuración de Umbrales
// ============================================

const UMBRALES = {
  /** Porcentaje mínimo de descenso para considerar anomalía */
  DESCENSO_MINIMO: 15,
  /** Porcentaje para descenso abrupto */
  DESCENSO_ABRUPTO: 30,
  /** Consumo considerado como "cero" */
  CONSUMO_CERO: 5,
  /** Multiplicador de desviación estándar para pico anómalo */
  FACTOR_DESVIACION: 2
};

// ============================================
// 🔍 Funciones de Detección
// ============================================

/**
 * Detecta anomalías en una serie de consumos por periodo
 * @param consumosPorPeriodo - Array de consumos agrupados por periodo
 * @returns Array de anomalías detectadas
 */
export const detectarAnomalias = (consumosPorPeriodo: ConsumoPeriodo[]): Anomalia[] => {
  if (consumosPorPeriodo.length < 2) return [];

  const anomalias: Anomalia[] = [];
  const consumos = consumosPorPeriodo.map(c => c.consumoTotal);
  const promedio = calcularPromedio(consumos);
  const desviacionEstandar = calcularDesviacionEstandar(consumos);

  consumosPorPeriodo.forEach((periodo, index) => {
    // Saltar el primer periodo (no hay referencia anterior)
    if (index === 0) return;

    const periodoAnterior = consumosPorPeriodo[index - 1];
    const variacion = ((periodo.consumoTotal - periodoAnterior.consumoTotal) / periodoAnterior.consumoTotal) * 100;

    // 1. Detectar descenso abrupto
    if (variacion < -UMBRALES.DESCENSO_ABRUPTO) {
      anomalias.push(crearAnomalia(
        'descenso_abrupto',
        periodo,
        periodoAnterior.consumoTotal,
        periodo.consumoTotal,
        variacion,
        'alta'
      ));
    }
    // 2. Detectar descenso gradual
    else if (variacion < -UMBRALES.DESCENSO_MINIMO) {
      anomalias.push(crearAnomalia(
        'descenso_gradual',
        periodo,
        periodoAnterior.consumoTotal,
        periodo.consumoTotal,
        variacion,
        'media'
      ));
    }

    // 3. Detectar consumo cero o casi cero
    if (periodo.consumoTotal <= UMBRALES.CONSUMO_CERO) {
      anomalias.push(crearAnomalia(
        'consumo_cero',
        periodo,
        promedio,
        periodo.consumoTotal,
        -100,
        'critica'
      ));
    }

    // 4. Detectar consumo negativo
    if (periodo.consumoTotal < 0) {
      anomalias.push(crearAnomalia(
        'consumo_negativo',
        periodo,
        promedio,
        periodo.consumoTotal,
        -100,
        'critica'
      ));
    }

    // 5. Detectar picos anómalos (consumo excesivamente alto)
    const umbralSuperior = promedio + (desviacionEstandar * UMBRALES.FACTOR_DESVIACION);
    if (periodo.consumoTotal > umbralSuperior) {
      anomalias.push(crearAnomalia(
        'pico_anomalo',
        periodo,
        promedio,
        periodo.consumoTotal,
        variacion,
        'media'
      ));
    }
  });

  // Marcar la primera ocurrencia de cada tipo
  marcarPrimerasOcurrencias(anomalias);

  return anomalias;
};

/**
 * Crea un objeto de anomalía
 */
const crearAnomalia = (
  tipo: TipoAnomalia,
  periodo: ConsumoPeriodo,
  consumoEsperado: number,
  consumoReal: number,
  variacion: number,
  severidad: NivelSeveridad
): Anomalia => {
  const descripciones: Record<TipoAnomalia, string> = {
    descenso_abrupto: `Descenso abrupto del ${Math.abs(variacion).toFixed(1)}% en el consumo respecto al periodo anterior.`,
    descenso_gradual: `Descenso gradual del ${Math.abs(variacion).toFixed(1)}% en el consumo respecto al periodo anterior.`,
    consumo_cero: `Consumo prácticamente nulo (${consumoReal.toFixed(2)} kWh). Posible contador detenido o avería.`,
    consumo_negativo: `Consumo negativo detectado (${consumoReal.toFixed(2)} kWh). Error en los datos.`,
    pico_anomalo: `Consumo anormalmente alto. Incremento del ${variacion.toFixed(1)}% respecto al promedio histórico.`
  };

  return {
    id: generarId(),
    tipo,
    periodo: periodo.periodo,
    fechaDeteccion: new Date().toISOString(),
    severidad,
    variacionPorcentaje: variacion,
    consumoEsperado,
    consumoReal,
    descripcion: descripciones[tipo],
    esPrimeraOcurrencia: false // Se actualiza después
  };
};

/**
 * Marca la primera ocurrencia de cada tipo de anomalía
 */
const marcarPrimerasOcurrencias = (anomalias: Anomalia[]): void => {
  const tiposEncontrados = new Set<TipoAnomalia>();

  anomalias.forEach(anomalia => {
    if (!tiposEncontrados.has(anomalia.tipo)) {
      anomalia.esPrimeraOcurrencia = true;
      tiposEncontrados.add(anomalia.tipo);
    }
  });
};

/**
 * Filtra anomalías por nivel de severidad
 * @param anomalias - Array de anomalías
 * @param severidad - Nivel mínimo de severidad
 * @returns Anomalías filtradas
 */
export const filtrarPorSeveridad = (
  anomalias: Anomalia[],
  severidad: NivelSeveridad
): Anomalia[] => {
  const niveles: Record<NivelSeveridad, number> = {
    baja: 1,
    media: 2,
    alta: 3,
    critica: 4
  };

  const nivelMinimo = niveles[severidad];
  return anomalias.filter(a => niveles[a.severidad] >= nivelMinimo);
};

/**
 * Obtiene la primera anomalía de una serie
 * @param anomalias - Array de anomalías
 * @returns Primera anomalía o undefined
 */
export const obtenerPrimeraAnomalia = (anomalias: Anomalia[]): Anomalia | undefined => {
  return anomalias.find(a => a.esPrimeraOcurrencia);
};
