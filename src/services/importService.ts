/**
 * 📥 Servicio de Importación de Datos
 * 
 * Módulo para manejar la importación de archivos CSV, JSON
 * y procesamiento de datos desde fuentes externas.
 */

import type { ConsumoEnergetico, ResultadoImportacion, OpcionesImportacion } from '../types';
import { generarId, esFechaValida, esNumeroValido } from '../utils';

// ============================================
// 📄 Importación de CSV
// ============================================

/**
 * Parsea un archivo CSV y lo convierte a array de consumos
 * @param contenido - Contenido del archivo CSV
 * @param opciones - Opciones de importación
 * @returns Resultado de la importación
 */
export const importarCSV = async (
  contenido: string,
  opciones: OpcionesImportacion = { formato: 'csv', delimitador: ',' }
): Promise<ResultadoImportacion> => {
  const errores: string[] = [];
  const advertencias: string[] = [];
  const datos: ConsumoEnergetico[] = [];

  try {
    const delimitador = opciones.delimitador || ',';
    const lineas = contenido.split('\n').filter(l => l.trim());

    if (lineas.length === 0) {
      errores.push('El archivo está vacío');
      return { exito: false, registrosImportados: 0, errores, datos };
    }

    // Leer encabezados
    const encabezados = lineas[0].split(delimitador).map(h => h.trim().toLowerCase());
    
    // Validar encabezados requeridos
    const encabezadosRequeridos = ['fecha', 'consumo', 'numerocontador'];
    const faltantes = encabezadosRequeridos.filter(h => !encabezados.includes(h));
    
    if (faltantes.length > 0) {
      errores.push(`Faltan columnas requeridas: ${faltantes.join(', ')}`);
      return { exito: false, registrosImportados: 0, errores, datos };
    }

    // Procesar filas de datos
    for (let i = 1; i < lineas.length; i++) {
      const valores = lineas[i].split(delimitador).map(v => v.trim());
      
      try {
        const consumo = parsearFilaCSV(encabezados, valores);
        
        // Validar si es necesario
        if (opciones.validar) {
          const errorValidacion = validarConsumo(consumo);
          if (errorValidacion) {
            advertencias.push(`Fila ${i + 1}: ${errorValidacion}`);
            continue;
          }
        }
        
        datos.push(consumo);
      } catch (error) {
        advertencias.push(`Fila ${i + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    return {
      exito: datos.length > 0,
      registrosImportados: datos.length,
      errores,
      advertencias,
      datos
    };

  } catch (error) {
    errores.push(`Error al procesar CSV: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    return { exito: false, registrosImportados: 0, errores, datos };
  }
};

/**
 * Parsea una fila de CSV a objeto ConsumoEnergetico
 */
const parsearFilaCSV = (encabezados: string[], valores: string[]): ConsumoEnergetico => {
  const obj: Record<string, string> = {};
  encabezados.forEach((h, i) => {
    obj[h] = valores[i] || '';
  });

  return {
    id: generarId(),
    fecha: obj['fecha'],
    consumo: parseFloat(obj['consumo']),
    periodo: obj['periodo'] || '',
    numeroContador: obj['numerocontador'] || obj['contador'] || '',
    cliente: obj['cliente']
  };
};

// ============================================
// 📄 Importación de JSON
// ============================================

/**
 * Parsea un archivo JSON y lo convierte a array de consumos
 * @param contenido - Contenido del archivo JSON
 * @returns Resultado de la importación
 */
export const importarJSON = async (contenido: string): Promise<ResultadoImportacion> => {
  const errores: string[] = [];
  const advertencias: string[] = [];
  const datos: ConsumoEnergetico[] = [];

  try {
    const parsedData = JSON.parse(contenido);
    
    // Verificar si es un array
    const array = Array.isArray(parsedData) ? parsedData : [parsedData];

    array.forEach((item, index) => {
      try {
        const consumo: ConsumoEnergetico = {
          id: item.id || generarId(),
          fecha: item.fecha,
          consumo: Number(item.consumo),
          periodo: item.periodo || '',
          numeroContador: item.numeroContador || item.contador || '',
          cliente: item.cliente
        };

        const errorValidacion = validarConsumo(consumo);
        if (errorValidacion) {
          advertencias.push(`Registro ${index + 1}: ${errorValidacion}`);
        } else {
          datos.push(consumo);
        }
      } catch (error) {
        advertencias.push(`Registro ${index + 1}: Error al procesar`);
      }
    });

    return {
      exito: datos.length > 0,
      registrosImportados: datos.length,
      errores,
      advertencias,
      datos
    };

  } catch (error) {
    errores.push(`Error al parsear JSON: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    return { exito: false, registrosImportados: 0, errores, datos };
  }
};

// ============================================
// ✅ Validación
// ============================================

/**
 * Valida un registro de consumo
 * @param consumo - Registro a validar
 * @returns Mensaje de error o null si es válido
 */
const validarConsumo = (consumo: ConsumoEnergetico): string | null => {
  if (!consumo.fecha || !esFechaValida(consumo.fecha)) {
    return 'Fecha inválida';
  }
  
  if (!esNumeroValido(consumo.consumo)) {
    return 'Consumo inválido';
  }
  
  if (!consumo.numeroContador) {
    return 'Número de contador requerido';
  }
  
  return null;
};

// ============================================
// 📤 Exportación
// ============================================

/**
 * Exporta consumos a formato CSV
 * @param consumos - Array de consumos a exportar
 * @returns Contenido CSV como string
 */
export const exportarCSV = (consumos: ConsumoEnergetico[]): string => {
  const encabezados = ['ID', 'Fecha', 'Consumo', 'Periodo', 'NumeroContador', 'Cliente'];
  const filas = consumos.map(c => [
    c.id,
    c.fecha,
    c.consumo.toString(),
    c.periodo,
    c.numeroContador,
    c.cliente || ''
  ]);

  return [
    encabezados.join(','),
    ...filas.map(f => f.join(','))
  ].join('\n');
};

/**
 * Exporta consumos a formato JSON
 * @param consumos - Array de consumos a exportar
 * @returns Contenido JSON como string
 */
export const exportarJSON = (consumos: ConsumoEnergetico[]): string => {
  return JSON.stringify(consumos, null, 2);
};
