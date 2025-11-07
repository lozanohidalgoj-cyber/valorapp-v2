/**
 * 📊 Servicio de Procesamiento de Datos
 * 
 * Módulo para transformar, agrupar y procesar datos de consumo energético.
 */

import type { ConsumoEnergetico, ConsumoPeriodo, EstadisticasConsumo, ComparativaPeriodos } from '../types';
import { obtenerPeriodo, calcularPromedio, calcularMediana, calcularDesviacionEstandar } from '../utils';

// ============================================
// 📦 Agrupación de Datos
// ============================================

/**
 * Agrupa consumos por periodo (mes/año)
 * @param consumos - Array de registros de consumo
 * @returns Array de consumos agrupados por periodo
 */
export const agruparPorPeriodo = (consumos: ConsumoEnergetico[]): ConsumoPeriodo[] => {
  const agrupado = consumos.reduce((acc, consumo) => {
    const periodo = obtenerPeriodo(consumo.fecha);
    
    if (!acc[periodo]) {
      acc[periodo] = {
        periodo,
        consumoTotal: 0,
        consumoPromedio: 0,
        dias: 0
      };
    }
    
    acc[periodo].consumoTotal += consumo.consumo;
    acc[periodo].dias += 1;
    
    return acc;
  }, {} as Record<string, ConsumoPeriodo>);

  // Calcular promedios y ordenar por periodo
  return Object.values(agrupado)
    .map(p => ({
      ...p,
      consumoPromedio: p.consumoTotal / p.dias
    }))
    .sort((a, b) => a.periodo.localeCompare(b.periodo));
};

/**
 * Filtra consumos por rango de fechas
 * @param consumos - Array de consumos
 * @param fechaInicio - Fecha de inicio
 * @param fechaFin - Fecha de fin
 * @returns Consumos filtrados
 */
export const filtrarPorRangoFechas = (
  consumos: ConsumoEnergetico[],
  fechaInicio: string,
  fechaFin: string
): ConsumoEnergetico[] => {
  const inicio = new Date(fechaInicio).getTime();
  const fin = new Date(fechaFin).getTime();
  
  return consumos.filter(c => {
    const fecha = new Date(c.fecha).getTime();
    return fecha >= inicio && fecha <= fin;
  });
};

// ============================================
// 📈 Cálculos Estadísticos
// ============================================

/**
 * Calcula estadísticas generales de consumo
 * @param consumos - Array de consumos
 * @returns Estadísticas calculadas
 */
export const calcularEstadisticas = (consumos: ConsumoEnergetico[]): EstadisticasConsumo => {
  if (consumos.length === 0) {
    return {
      promedio: 0,
      mediana: 0,
      desviacionEstandar: 0,
      minimo: 0,
      maximo: 0,
      totalRegistros: 0
    };
  }

  const valores = consumos.map(c => c.consumo);
  
  return {
    promedio: calcularPromedio(valores),
    mediana: calcularMediana(valores),
    desviacionEstandar: calcularDesviacionEstandar(valores),
    minimo: Math.min(...valores),
    maximo: Math.max(...valores),
    totalRegistros: consumos.length
  };
};

/**
 * Compara dos periodos de consumo
 * @param periodoAnterior - Periodo anterior
 * @param periodoActual - Periodo actual
 * @returns Comparativa entre periodos
 */
export const compararPeriodos = (
  periodoAnterior: ConsumoPeriodo,
  periodoActual: ConsumoPeriodo
): ComparativaPeriodos => {
  const diferencia = periodoActual.consumoTotal - periodoAnterior.consumoTotal;
  const porcentaje = ((diferencia / periodoAnterior.consumoTotal) * 100);
  
  let tendencia: 'aumento' | 'descenso' | 'estable';
  if (Math.abs(porcentaje) < 5) {
    tendencia = 'estable';
  } else if (porcentaje > 0) {
    tendencia = 'aumento';
  } else {
    tendencia = 'descenso';
  }

  return {
    periodoAnterior,
    periodoActual,
    diferenciaAbsoluta: diferencia,
    diferenciaPorcentual: porcentaje,
    tendencia
  };
};

// ============================================
// 🧹 Limpieza y Validación
// ============================================

/**
 * Limpia datos inválidos de consumo
 * @param consumos - Array de consumos
 * @returns Array de consumos válidos
 */
export const limpiarDatos = (consumos: ConsumoEnergetico[]): ConsumoEnergetico[] => {
  return consumos.filter(c => {
    // Validar que tenga campos requeridos
    if (!c.id || !c.fecha || c.consumo === undefined) return false;
    
    // Validar que la fecha sea válida
    const fecha = new Date(c.fecha);
    if (isNaN(fecha.getTime())) return false;
    
    // Validar que el consumo sea un número
    if (typeof c.consumo !== 'number' || isNaN(c.consumo)) return false;
    
    return true;
  });
};

/**
 * Elimina duplicados basándose en fecha y contador
 * @param consumos - Array de consumos
 * @returns Array sin duplicados
 */
export const eliminarDuplicados = (consumos: ConsumoEnergetico[]): ConsumoEnergetico[] => {
  const vistos = new Set<string>();
  
  return consumos.filter(c => {
    const clave = `${c.fecha}-${c.numeroContador}`;
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
};

// ============================================
// 🔄 Transformaciones
// ============================================

/**
 * Convierte consumos a formato para gráficos
 * @param consumosPorPeriodo - Consumos agrupados por periodo
 * @returns Datos formateados para visualización
 */
export const prepararDatosGrafico = (consumosPorPeriodo: ConsumoPeriodo[]) => {
  return consumosPorPeriodo.map(p => ({
    etiqueta: p.periodo,
    valor: p.consumoTotal,
    metadata: {
      promedio: p.consumoPromedio,
      dias: p.dias
    }
  }));
};
