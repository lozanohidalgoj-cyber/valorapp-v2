/**
 * 📤 Servicio de Exportación de Datos
 * 
 * Exporta análisis a formatos Excel y CSV para compartir resultados.
 * Replica la funcionalidad de "Guardar como" del Excel.
 */

import * as XLSX from 'xlsx';
import type { ConsumoAnual, ConsumoMensual, DerivacionData } from '../types';

/**
 * Exporta Vista por Años a archivo Excel
 */
export const exportarVistaAnualExcel = (datos: ConsumoAnual[], nombreArchivo: string = 'vista_por_anos.xlsx'): void => {
  try {
    // Crear hoja de trabajo
    const datosParaExcel = datos.map(registro => ({
      'Año': registro.año,
      'Suma Consumo Activa (kWh)': registro.sumaConsumoActiva.toFixed(2),
      'Máx Maxímetro (kW)': registro.maxMaximetro.toFixed(2),
      'Periodos': registro.periodosFacturados,
      'Días': registro.sumaDias,
      'Promedio/Día (kWh)': registro.promedioConsumoPorDia.toFixed(2)
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(datosParaExcel);
    
    // Ajustar ancho de columnas
    worksheet['!cols'] = [
      { wch: 10 },  // Año
      { wch: 25 },  // Suma Consumo Activa
      { wch: 20 },  // Máx Maxímetro
      { wch: 12 },  // Periodos
      { wch: 10 },  // Días
      { wch: 20 }   // Promedio/Día
    ];
    
    // Crear libro de trabajo
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vista por años');
    
    // Descargar archivo
    XLSX.writeFile(workbook, nombreArchivo);
    
  // Exportación completada
  } catch (error) {
    console.error('Error al exportar Vista por años:', error);
    throw new Error('No se pudo exportar el archivo Excel');
  }
};

/**
 * Exporta Comparativa Mensual a archivo Excel
 */
export const exportarComparativaMensualExcel = (
  datos: ConsumoMensual[],
  nombreArchivo: string = 'comparativa_mensual.xlsx'
): void => {
  try {
    // Crear hoja de trabajo con todas las métricas
    const datosParaExcel = datos.map(registro => ({
      'Año': registro.año,
      'Mes': registro.mes,
      'Periodo': registro.periodo,
      'Consumo Total (kWh)': registro.consumoTotal.toFixed(2),
      'Consumo Promedio Diario (kWh)': registro.consumoPromedioDiario.toFixed(2),
      'Días': registro.dias,
      'Variación %': registro.variacionPorcentual !== null 
        ? registro.variacionPorcentual.toFixed(2) + '%' 
        : 'N/A',
      'Tipo Variación': registro.tipoVariacion || 'N/A',
      'Es Anomalía': registro.esAnomalia ? 'SÍ' : 'NO'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(datosParaExcel);
    
    // Ajustar ancho de columnas
    worksheet['!cols'] = [
      { wch: 10 },  // Año
      { wch: 8 },   // Mes
      { wch: 12 },  // Periodo
      { wch: 20 },  // Consumo Total
      { wch: 25 },  // Consumo Promedio Diario
      { wch: 8 },   // Días
      { wch: 15 },  // Variación %
      { wch: 15 },  // Tipo Variación
      { wch: 12 }   // Es Anomalía
    ];
    
    // Aplicar formato condicional a anomalías (fondo rojo)
    // Nota: xlsx no soporta estilos completos, pero podemos marcarlas
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Comparativa Mensual');
    
    XLSX.writeFile(workbook, nombreArchivo);
    
  // Exportación completada
  } catch (error) {
    console.error('Error al exportar Comparativa mensual:', error);
    throw new Error('No se pudo exportar el archivo Excel');
  }
};

/**
 * Exporta datos de derivación completos a Excel
 */
export const exportarDerivacionCompleta = (
  datos: DerivacionData[],
  nombreArchivo: string = 'derivacion_completa.xlsx'
): void => {
  try {
    // Convertir datos a formato plano
    const worksheet = XLSX.utils.json_to_sheet(datos);
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Entrada datos');
    
    XLSX.writeFile(workbook, nombreArchivo);
    
  // Exportación completada
  } catch (error) {
    console.error('Error al exportar derivación completa:', error);
    throw new Error('No se pudo exportar el archivo Excel');
  }
};

/**
 * Exporta Vista por Años a CSV
 */
export const exportarVistaAnualCSV = (datos: ConsumoAnual[]): string => {
  const encabezados = [
    'Año',
    'Suma Consumo Activa (kWh)',
    'Máx Maxímetro (kW)',
    'Periodos',
    'Días',
    'Promedio/Día (kWh)'
  ];
  
  const filas = datos.map(registro => [
    registro.año,
    registro.sumaConsumoActiva.toFixed(2),
    registro.maxMaximetro.toFixed(2),
    registro.periodosFacturados,
    registro.sumaDias,
    registro.promedioConsumoPorDia.toFixed(2)
  ]);
  
  return [
    encabezados.join(','),
    ...filas.map(fila => fila.join(','))
  ].join('\n');
};

/**
 * Exporta Comparativa Mensual a CSV
 */
export const exportarComparativaMensualCSV = (datos: ConsumoMensual[]): string => {
  const encabezados = [
    'Año',
    'Mes',
    'Periodo',
    'Consumo Total (kWh)',
    'Consumo Promedio Diario (kWh)',
    'Días',
    'Variación %',
    'Tipo Variación',
    'Es Anomalía'
  ];
  
  const filas = datos.map(registro => [
    registro.año,
    registro.mes,
    registro.periodo,
    registro.consumoTotal.toFixed(2),
    registro.consumoPromedioDiario.toFixed(2),
    registro.dias,
    registro.variacionPorcentual !== null ? registro.variacionPorcentual.toFixed(2) : 'N/A',
    registro.tipoVariacion || 'N/A',
    registro.esAnomalia ? 'SÍ' : 'NO'
  ]);
  
  return [
    encabezados.join(','),
    ...filas.map(fila => fila.join(','))
  ].join('\n');
};

/**
 * Descarga un string como archivo
 */
export const descargarArchivo = (contenido: string, nombreArchivo: string, tipo: string = 'text/csv'): void => {
  try {
    const blob = new Blob([contenido], { type: tipo });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
  // Descarga completada
  } catch (error) {
    console.error('Error al descargar archivo:', error);
    throw new Error('No se pudo descargar el archivo');
  }
};

/**
 * Exporta análisis completo en un solo archivo Excel con múltiples hojas
 */
export const exportarAnalisisCompleto = (
  vistaAnual: ConsumoAnual[],
  comparativaMensual: ConsumoMensual[],
  derivacionData: DerivacionData[],
  nombreArchivo: string = 'analisis_completo.xlsx'
): void => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Hoja 1: Vista por años
    const datosAnuales = vistaAnual.map(r => ({
      'Año': r.año,
      'Suma Consumo Activa (kWh)': r.sumaConsumoActiva.toFixed(2),
      'Máx Maxímetro (kW)': r.maxMaximetro.toFixed(2),
      'Periodos': r.periodosFacturados,
      'Días': r.sumaDias,
      'Promedio/Día (kWh)': r.promedioConsumoPorDia.toFixed(2)
    }));
    const wsAnual = XLSX.utils.json_to_sheet(datosAnuales);
    XLSX.utils.book_append_sheet(workbook, wsAnual, 'Vista por años');
    
    // Hoja 2: Comparativa Mensual
    const datosMensuales = comparativaMensual.map(r => ({
      'Año': r.año,
      'Mes': r.mes,
      'Periodo': r.periodo,
      'Consumo Total (kWh)': r.consumoTotal.toFixed(2),
      'Consumo Promedio Diario (kWh)': r.consumoPromedioDiario.toFixed(2),
      'Días': r.dias,
      'Variación %': r.variacionPorcentual !== null ? r.variacionPorcentual.toFixed(2) + '%' : 'N/A',
      'Tipo Variación': r.tipoVariacion || 'N/A',
      'Es Anomalía': r.esAnomalia ? 'SÍ' : 'NO'
    }));
    const wsMensual = XLSX.utils.json_to_sheet(datosMensuales);
    XLSX.utils.book_append_sheet(workbook, wsMensual, 'Comparativa Mensual');
    
    // Hoja 3: Entrada datos (primeras 100 filas para no saturar)
    const datosLimitados = derivacionData.slice(0, 100);
    const wsEntrada = XLSX.utils.json_to_sheet(datosLimitados);
    XLSX.utils.book_append_sheet(workbook, wsEntrada, 'Entrada datos');
    
    // Descargar archivo
    XLSX.writeFile(workbook, nombreArchivo);
    
  // Exportación completada
  } catch (error) {
    console.error('Error al exportar análisis completo:', error);
    throw new Error('No se pudo exportar el análisis completo');
  }
};
