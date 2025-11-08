/**
 * 📊 Servicio de Análisis de Consumo
 * 
 * Replica la funcionalidad del Excel "Análisis de Expedientes.xlsm"
 * - Vista por años: Agrupación anual con todas las métricas
 * - Comparativa mensual: Evolución mes a mes con detección de anomalías (umbral 40%)
 */

import type { DerivacionData, ConsumoAnual, ConsumoMensual, ResultadoAnalisis } from '../types';

// ============================================
// 🔧 FUNCIONES AUXILIARES
// ============================================

/**
 * Convierte un string con formato de número español a número
 * Ejemplo: "167,893" -> 167.893
 */
const convertirANumero = (valor: string | number | undefined): number => {
  if (typeof valor === 'number') return valor;
  if (!valor || valor === '-') return 0;
  
  const numeroStr = String(valor).replace(',', '.');
  const numero = parseFloat(numeroStr);
  
  return isNaN(numero) ? 0 : numero;
};

/**
 * Extrae el año de una fecha en formato DD/MM/YYYY
 */
const extraerAño = (fecha: string): number => {
  if (!fecha) return 0;
  const partes = fecha.split('/');
  if (partes.length === 3) {
    return parseInt(partes[2], 10);
  }
  return 0;
};

/**
 * Extrae el mes de una fecha en formato DD/MM/YYYY
 */
const extraerMes = (fecha: string): number => {
  if (!fecha) return 0;
  const partes = fecha.split('/');
  if (partes.length === 3) {
    return parseInt(partes[1], 10);
  }
  return 0;
};

/**
 * Calcula los días entre dos fechas en formato DD/MM/YYYY
 */
const calcularDias = (fechaDesde: string, fechaHasta: string): number => {
  if (!fechaDesde || !fechaHasta) return 0;
  
  const parsearFecha = (fecha: string): Date => {
    const [dia, mes, año] = fecha.split('/').map(Number);
    return new Date(año, mes - 1, dia);
  };
  
  const desde = parsearFecha(fechaDesde);
  const hasta = parsearFecha(fechaHasta);
  const dias = Math.ceil((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24));
  
  return dias > 0 ? dias : 0;
};

/**
 * Formatea un número con separadores de miles
 */
const formatearNumero = (numero: number, decimales: number = 2): string => {
  return numero.toLocaleString('es-ES', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  });
};

// ============================================
// 📊 VISTA POR AÑOS
// ============================================

/**
 * Genera la vista anual con todas las métricas del Excel
 * Calcula: Suma Consumo Activa, Máx Maxímetro, Periodos facturados, 
 * Suma de días, Promedio consumo por día
 */
const generarVistaAnual = (datos: DerivacionData[]): ConsumoAnual[] => {
  const datosPorAño: { [año: number]: DerivacionData[] } = {};
  
  // Agrupar por año
  datos.forEach(registro => {
    const año = extraerAño(registro['Fecha desde']);
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
        const p1 = convertirANumero(registro['Consumo P1/punta']);
        const p2 = convertirANumero(registro['Consumo P2/llano']);
        const p3 = convertirANumero(registro['Consumo P3/valle']);
        return suma + p1 + p2 + p3;
      }, 0);
      
      // 2. Máx de Maxímetro (mayor valor de todos los periodos)
      const maxMaximetro = registrosAño.reduce((max, registro) => {
        const maxP1 = convertirANumero(registro['Maxímetro P1/Punta']);
        const maxP2 = convertirANumero(registro['Maxímetro P2/Llano']);
        const maxP3 = convertirANumero(registro['Maxímetro P3/Valle']);
        const maxP4 = convertirANumero(registro['Maxímetro P4']);
        const maxP5 = convertirANumero(registro['Maxímetro P5']);
        const maxP6 = convertirANumero(registro['Maxímetro P6']);
        const maxActual = Math.max(maxP1, maxP2, maxP3, maxP4, maxP5, maxP6);
        return Math.max(max, maxActual);
      }, 0);
      
      // 3. Periodos facturados (número de facturas)
      const periodosFacturados = registrosAño.length;
      
      // 4. Suma de Días
      const sumaDias = registrosAño.reduce((suma, registro) => {
        const dias = calcularDias(registro['Fecha desde'], registro['Fecha hasta']);
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

// ============================================
// 📅 COMPARATIVA MENSUAL
// ============================================

/**
 * Genera la comparativa mensual con detección de anomalías
 * Detecta variaciones > 40% como anomalías
 */
const generarComparativaMensual = (datos: DerivacionData[]): ConsumoMensual[] => {
  const datosPorMes: { [periodo: string]: DerivacionData[] } = {};
  
  // Agrupar por periodo (YYYY-MM)
  datos.forEach(registro => {
    const año = extraerAño(registro['Fecha desde']);
    const mes = extraerMes(registro['Fecha desde']);
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
      const p1 = convertirANumero(registro['Consumo P1/punta']);
      const p2 = convertirANumero(registro['Consumo P2/llano']);
      const p3 = convertirANumero(registro['Consumo P3/valle']);
      return suma + p1 + p2 + p3;
    }, 0);
    
    // Días del periodo
    const dias = registrosMes.reduce((suma, registro) => {
      return suma + calcularDias(registro['Fecha desde'], registro['Fecha hasta']);
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
        const p1 = convertirANumero(registro['Consumo P1/punta']);
        const p2 = convertirANumero(registro['Consumo P2/llano']);
        const p3 = convertirANumero(registro['Consumo P3/valle']);
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

// ============================================
// 🎯 FUNCIÓN PRINCIPAL
// ============================================

/**
 * Analiza los datos de derivación y genera el análisis completo
 * Replica todas las funcionalidades del Excel
 * 
 * @param datos - Array de registros de derivación
 * @returns Resultado del análisis completo
 */
export const analizarConsumoCompleto = (datos: DerivacionData[]): ResultadoAnalisis => {
  // Generar vista anual
  const vistaAnual = generarVistaAnual(datos);
  
  // Generar comparativa mensual
  const comparativaMensual = generarComparativaMensual(datos);
  
  // Calcular periodo total
  const fechas = datos.map(d => {
    const año = extraerAño(d['Fecha desde']);
    const mes = extraerMes(d['Fecha desde']);
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

/**
 * Calcula el color de heat map para un valor dentro de un rango
 * Rojo (mínimo) → Amarillo (percentil medio) → Verde (máximo)
 * 
 * @param valor - Valor actual
 * @param min - Valor mínimo del rango
 * @param max - Valor máximo del rango
 * @returns Color en formato RGB
 */
export const calcularColorHeatMap = (valor: number, min: number, max: number): string => {
  if (max === min) return 'rgb(255, 255, 0)'; // Amarillo por defecto
  
  // Normalizar el valor entre 0 y 1
  const normalizado = (valor - min) / (max - min);
  
  let r, g, b;
  
  if (normalizado < 0.5) {
    // Rojo → Amarillo (0 a 0.5)
    const t = normalizado * 2; // 0 a 1
    r = 255;
    g = Math.round(255 * t);
    b = 0;
  } else {
    // Amarillo → Verde (0.5 a 1)
    const t = (normalizado - 0.5) * 2; // 0 a 1
    r = Math.round(255 * (1 - t));
    g = 255;
    b = 0;
  }
  
  return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Calcula el color del texto basado en el fondo (contraste)
 */
export const calcularColorTexto = (colorFondo: string): string => {
  // Extraer valores RGB
  const match = colorFondo.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return '#000000';
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  // Calcular luminancia
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Retornar negro o blanco según luminancia
  return luminancia > 0.5 ? '#000000' : '#ffffff';
};

export { formatearNumero };
