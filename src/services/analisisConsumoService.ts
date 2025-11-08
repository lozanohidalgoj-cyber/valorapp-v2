/**
 * 📊 Servicio de Análisis de Consumo
 * 
 * Replica la funcionalidad del Excel "Análisis de Expedientes.xlsm"
 * - Vista por años: Agrupación anual con todas las métricas
 * - Comparativa mensual: Evolución mes a mes con detección de anomalías (umbral 40%)
 */

import type { DerivacionData, ConsumoAnual, ConsumoMensual, ResultadoAnalisis } from '../types';
import {
  convertirNumeroEspañol,
  extraerAñoDeFormato,
  extraerMesDeFormato,
  calcularDiasEntreFechas,
  formatearNumero,
} from '../utils';

/**
 * Genera la vista anual con todas las métricas del Excel
 * Calcula: Suma Consumo Activa, Máx Maxímetro, Periodos facturados, 
 * Suma de días, Promedio consumo por día
 * @param datos - Array de registros de derivación individual
 * @returns Array de consumos anuales con todas las métricas calculadas
 */
const generarVistaAnual = (datos: DerivacionData[]): ConsumoAnual[] => {
  const datosPorAño: { [año: number]: DerivacionData[] } = {};
  
  // Agrupar por año
  datos.forEach(registro => {
    const año = extraerAñoDeFormato(registro['Fecha desde']);
    if (año > 0) {
      if (!datosPorAño[año]) {
        datosPorAño[año] = [];
      }
      datosPorAño[año].push(registro);
    }
  });
  
  // Calcular métricas por año
  return Object.keys(datosPorAño)
    .map(Number)
    .sort((a, b) => a - b)
    .map(año => {
      const registrosAño = datosPorAño[año];
      
      // 1. Suma Consumo Activa (P1 + P2 + P3)
      const sumaConsumoActiva = registrosAño.reduce((suma, registro) => {
        const p1 = convertirNumeroEspañol(registro['Consumo P1/punta']);
        const p2 = convertirNumeroEspañol(registro['Consumo P2/llano']);
        const p3 = convertirNumeroEspañol(registro['Consumo P3/valle']);
        return suma + p1 + p2 + p3;
      }, 0);
      
      // 2. Máx de Maxímetro (mayor valor de todos los periodos)
      const maxMaximetro = registrosAño.reduce((max, registro) => {
        const maxP1 = convertirNumeroEspañol(registro['Maxímetro P1/Punta']);
        const maxP2 = convertirNumeroEspañol(registro['Maxímetro P2/Llano']);
        const maxP3 = convertirNumeroEspañol(registro['Maxímetro P3/Valle']);
        const maxP4 = convertirNumeroEspañol(registro['Maxímetro P4']);
        const maxP5 = convertirNumeroEspañol(registro['Maxímetro P5']);
        const maxP6 = convertirNumeroEspañol(registro['Maxímetro P6']);
        const maxActual = Math.max(maxP1, maxP2, maxP3, maxP4, maxP5, maxP6);
        return Math.max(max, maxActual);
      }, 0);
      
      // 3. Periodos facturados (número de facturas)
      const periodosFacturados = registrosAño.length;
      
      // 4. Suma de Días
      const sumaDias = registrosAño.reduce((suma, registro) => {
        const dias = calcularDiasEntreFechas(registro['Fecha desde'], registro['Fecha hasta']);
        return suma + dias;
      }, 0);
      
      // 5. Promedio consumo por día
      const promedioConsumoPorDia = sumaDias > 0 ? sumaConsumoActiva / sumaDias : 0;
      
      return {
        año,
        sumaConsumoActiva,
        maxMaximetro,
        periodosFacturados,
        sumaDias,
        promedioConsumoPorDia
      };
    });
};

/**
 * Genera la comparativa mensual con detección de anomalías
 * Detecta variaciones > 40% como anomalías
 * @param datos - Array de registros de derivación individual
 * @returns Array de consumos mensuales con detección de anomalías
 */
const generarComparativaMensual = (datos: DerivacionData[]): ConsumoMensual[] => {
  const datosPorMes: { [periodo: string]: DerivacionData[] } = {};
  
  // Agrupar por periodo (YYYY-MM)
  datos.forEach(registro => {
    const año = extraerAñoDeFormato(registro['Fecha desde']);
    const mes = extraerMesDeFormato(registro['Fecha desde']);
    if (año > 0 && mes > 0) {
      const periodo = `${año}-${mes.toString().padStart(2, '0')}`;
      if (!datosPorMes[periodo]) {
        datosPorMes[periodo] = [];
      }
      datosPorMes[periodo].push(registro);
    }
  });
  
  // Ordenar periodos cronológicamente
  const periodosOrdenados = Object.keys(datosPorMes).sort();
  
  // Calcular métricas por mes
  const comparativaMensual: ConsumoMensual[] = periodosOrdenados.map((periodo, index) => {
    const registrosMes = datosPorMes[periodo];
    const [año, mes] = periodo.split('-').map(Number);
    
    // Consumo total del mes (P1 + P2 + P3)
    const consumoTotal = registrosMes.reduce((suma, registro) => {
      const p1 = convertirNumeroEspañol(registro['Consumo P1/punta']);
      const p2 = convertirNumeroEspañol(registro['Consumo P2/llano']);
      const p3 = convertirNumeroEspañol(registro['Consumo P3/valle']);
      return suma + p1 + p2 + p3;
    }, 0);
    
    // Días del periodo
    const dias = registrosMes.reduce((suma, registro) => {
      return suma + calcularDiasEntreFechas(registro['Fecha desde'], registro['Fecha hasta']);
    }, 0);
    
    // Consumo promedio diario
    const consumoPromedioDiario = dias > 0 ? consumoTotal / dias : 0;
    
    // Variación porcentual respecto al mes anterior
    let variacionPorcentual: number | null = null;
    let esAnomalia = false;
    let tipoVariacion: 'aumento' | 'descenso' | 'estable' | null = null;
    
    if (index > 0) {
      const periodoAnterior = periodosOrdenados[index - 1];
      const consumoAnterior = datosPorMes[periodoAnterior].reduce((suma, registro) => {
        const p1 = convertirNumeroEspañol(registro['Consumo P1/punta']);
        const p2 = convertirNumeroEspañol(registro['Consumo P2/llano']);
        const p3 = convertirNumeroEspañol(registro['Consumo P3/valle']);
        return suma + p1 + p2 + p3;
      }, 0);
      
      if (consumoAnterior > 0) {
        variacionPorcentual = ((consumoTotal - consumoAnterior) / consumoAnterior) * 100;
        
        // Detectar anomalía: variación > 40%
        if (Math.abs(variacionPorcentual) > 40) {
          esAnomalia = true;
        }
        
        // Tipo de variación
        if (variacionPorcentual > 5) {
          tipoVariacion = 'aumento';
        } else if (variacionPorcentual < -5) {
          tipoVariacion = 'descenso';
        } else {
          tipoVariacion = 'estable';
        }
      }
    }
    
    return {
      año,
      mes,
      periodo,
      consumoTotal,
      consumoPromedioDiario,
      dias,
      variacionPorcentual,
      esAnomalia,
      tipoVariacion
    };
  });
  
  return comparativaMensual;
};

/**
 * Analiza los datos de derivación y genera el análisis completo
 * Replica todas las funcionalidades del Excel
 * @param datos - Array de registros de derivación
 * @returns Resultado del análisis completo con vistas anual y mensual
 */
export const analizarConsumoCompleto = (datos: DerivacionData[]): ResultadoAnalisis => {
  // Generar vista anual
  const vistaAnual = generarVistaAnual(datos);
  
  // Generar comparativa mensual
  const comparativaMensual = generarComparativaMensual(datos);
  
  // Calcular periodo total
  const fechas = datos.map(d => {
    const año = extraerAñoDeFormato(d['Fecha desde']);
    const mes = extraerMesDeFormato(d['Fecha desde']);
    return { año, mes, fecha: d['Fecha desde'] };
  }).sort((a, b) => a.año - b.año || a.mes - b.mes);
  
  const periodoTotal = {
    fechaInicio: fechas.length > 0 ? fechas[0].fecha : '',
    fechaFin: fechas.length > 0 ? fechas[fechas.length - 1].fecha : '',
    totalAños: vistaAnual.length,
    totalMeses: comparativaMensual.length
  };
  
  // Calcular resumen ejecutivo
  const consumoTotalGeneral = vistaAnual.reduce((suma, año) => suma + año.sumaConsumoActiva, 0);
  const maxMaximetroGeneral = vistaAnual.reduce((max, año) => Math.max(max, año.maxMaximetro), 0);
  const promedioAnual = vistaAnual.length > 0 ? consumoTotalGeneral / vistaAnual.length : 0;
  const anomaliasDetectadas = comparativaMensual.filter(m => m.esAnomalia).length;
  
  return {
    vistaAnual,
    comparativaMensual,
    periodoTotal,
    resumen: {
      consumoTotalGeneral,
      promedioAnual,
      maxMaximetroGeneral,
      totalFacturas: datos.length,
      anomaliasDetectadas
    }
  };
};

// Re-exportar formatearNumero para retrocompatibilidad
export { formatearNumero };
