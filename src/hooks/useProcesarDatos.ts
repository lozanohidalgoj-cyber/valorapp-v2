/**
 * 🪝 Hook Personalizado para Procesamiento de Datos
 * 
 * Hook que encapsula la lógica de procesamiento de consumos,
 * detección de anomalías y cálculos estadísticos.
 */

import { useState, useCallback, useMemo } from 'react';
import type { ConsumoEnergetico, ConsumoPeriodo, Anomalia, EstadisticasConsumo } from '../types';
import { agruparPorPeriodo, calcularEstadisticas, limpiarDatos, eliminarDuplicados } from '../services/dataService';
import { detectarAnomalias } from '../services/anomaliaService';

interface UseProcesarDatosReturn {
  /** Consumos procesados y limpios */
  consumosProcesados: ConsumoEnergetico[];
  /** Consumos agrupados por periodo */
  consumosPorPeriodo: ConsumoPeriodo[];
  /** Anomalías detectadas */
  anomalias: Anomalia[];
  /** Estadísticas generales */
  estadisticas: EstadisticasConsumo;
  /** Indica si hay datos disponibles */
  hayDatos: boolean;
  /** Procesa un array de consumos */
  procesarConsumos: (consumos: ConsumoEnergetico[]) => void;
  /** Limpia todos los datos procesados */
  limpiar: () => void;
}

/**
 * Hook para procesar datos de consumo energético
 * @returns Objeto con datos procesados y funciones de control
 */
export const useProcesarDatos = (): UseProcesarDatosReturn => {
  const [consumosProcesados, setConsumosProcesados] = useState<ConsumoEnergetico[]>([]);

  // Agrupar consumos por periodo
  const consumosPorPeriodo = useMemo(() => {
    if (consumosProcesados.length === 0) return [];
    return agruparPorPeriodo(consumosProcesados);
  }, [consumosProcesados]);

  // Detectar anomalías
  const anomalias = useMemo(() => {
    if (consumosPorPeriodo.length === 0) return [];
    return detectarAnomalias(consumosPorPeriodo);
  }, [consumosPorPeriodo]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    if (consumosProcesados.length === 0) {
      return {
        promedio: 0,
        mediana: 0,
        desviacionEstandar: 0,
        minimo: 0,
        maximo: 0,
        totalRegistros: 0
      };
    }
    return calcularEstadisticas(consumosProcesados);
  }, [consumosProcesados]);

  /**
   * Procesa y limpia un array de consumos
   */
  const procesarConsumos = useCallback((consumos: ConsumoEnergetico[]) => {
    // Limpiar datos inválidos
    let consumosLimpios = limpiarDatos(consumos);
    
    // Eliminar duplicados
    consumosLimpios = eliminarDuplicados(consumosLimpios);
    
    // Ordenar por fecha
    consumosLimpios.sort((a, b) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
    
    setConsumosProcesados(consumosLimpios);
  }, []);

  /**
   * Limpia todos los datos procesados
   */
  const limpiar = useCallback(() => {
    setConsumosProcesados([]);
  }, []);

  return {
    consumosProcesados,
    consumosPorPeriodo,
    anomalias,
    estadisticas,
    hayDatos: consumosProcesados.length > 0,
    procesarConsumos,
    limpiar
  };
};
