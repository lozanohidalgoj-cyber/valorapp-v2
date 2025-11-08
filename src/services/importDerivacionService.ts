/**
 * 📥 Servicio de Importación de Derivación Individual
 * 
 * Importa y valida archivos CSV de derivación individual del SCE
 * con las 45 columnas exactas esperadas por el sistema.
 * 
 * Replica la lógica de importación de la macro Excel.
 */

import type { DerivacionData } from '../types';
import * as XLSX from 'xlsx';

/**
 * Estructura de encabezados esperados (45 columnas A-AS)
 * Basado en el análisis del código VBA Módulo4
 */
const ENCABEZADOS_ESPERADOS = [
  'Número Fiscal de Factura',          // A
  'Código de Empresa Distribuidora',    // B
  'Código de contrato externo - interfaz', // C
  'Secuencial de factura',              // D
  'Tipo de factura',                    // E
  'Estado de la factura',               // F - CAMPO DE FILTRO 1
  'Fecha desde',                        // G - CAMPO DE ORDENACIÓN
  'Fecha hasta',                        // H
  'Importe Factura',                    // I
  'Fuente de la factura',               // J
  'Tipo de Fuente',                     // K
  'Descripción Tipo de fuente',         // L
  'Tipo de Fuente Anterior',            // M
  'Descripción Tipo de fuente Anterior', // N
  'Tipo de punto de medida',            // O
  'Consumo P1/punta',                   // P - SUMA
  'Consumo P2/llano',                   // Q - SUMA
  'Consumo P3/valle',                   // R - SUMA
  'Consumo P4/supervalle',              // S - FILTRO 2 (DGE)
  'Consumo P5',                         // T
  'Consumo P6',                         // U
  'Consumo Reactiva1',                  // V
  'Consumo Reactiva2',                  // W
  'Consumo Reactiva3',                  // X
  'Consumo Reactiva4',                  // Y
  'Consumo Reactiva5',                  // Z
  'Consumo Reactiva6',                  // AA
  'Consumo cargo-abono P1/punta',       // AB
  'Consumo cargo-abono P2/llano',       // AC
  'Consumo cargo-abono P3/valle',       // AD
  'Consumo cargo/abono P4',             // AE
  'Consumo cargo/abono P5',             // AF
  'Consumo cargo/abono P6',             // AG
  'Consumo pérdidas P1/punta',          // AH
  'Consumo pérdidas P2/llano',          // AI
  'Consumo pérdidas P3/valle',          // AJ
  'Consumo pérdidas P4',                // AK
  'Consumo pérdidas P5',                // AL
  'Consumo pérdidas P6',                // AM
  'Maxímetro P1/Punta',                 // AN
  'Maxímetro P2/Llano',                 // AO
  'Maxímetro P3/Valle',                 // AP
  'Maxímetro P4',                       // AQ
  'Maxímetro P5',                       // AR
  'Maxímetro P6',                       // AS
] as const;

/**
 * Resultado de la importación con validación detallada
 */
export interface ResultadoImportacionDerivacion {
  exito: boolean;
  registrosImportados: number;
  registrosRechazados: number;
  errores: ErrorImportacion[];
  advertencias: string[];
  datos: DerivacionData[];
  vistaPrevia: DerivacionData[];
}

/**
 * Error de importación con contexto
 */
export interface ErrorImportacion {
  fila: number;
  columna?: string;
  mensaje: string;
  valorProblematico?: string;
}

/**
 * Importa archivo CSV/Excel de derivación individual
 * 
 * @param archivo - File object del input
 * @returns Resultado de importación con errores detallados
 */
export const importarArchivoDerivacion = async (
  archivo: File
): Promise<ResultadoImportacionDerivacion> => {
  const errores: ErrorImportacion[] = [];
  const advertencias: string[] = [];
  const datos: DerivacionData[] = [];
  
  try {
    // Leer archivo (soporta .csv, .xlsx, .xls)
    const buffer = await archivo.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    
    // Tomar primera hoja
    const primeraHoja = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[primeraHoja];
    
    // Convertir a JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      raw: false,
      dateNF: 'dd/mm/yyyy'
    }) as string[][];
    
    if (jsonData.length === 0) {
      errores.push({
        fila: 0,
        mensaje: 'El archivo está vacío'
      });
      return crearResultadoVacio(errores, advertencias);
    }
    
    // Validar encabezados
    const encabezadosArchivo = jsonData[0];
    const errorEncabezados = validarEncabezados(encabezadosArchivo);
    
    if (errorEncabezados) {
      errores.push({
        fila: 1,
        mensaje: errorEncabezados
      });
      
      // Si faltan columnas críticas, retornar error
      const columnasCriticas = ['Fecha desde', 'Estado de la factura'];
      const faltanCriticas = columnasCriticas.some(c => !encabezadosArchivo.includes(c));
      
      if (faltanCriticas) {
        return crearResultadoVacio(errores, advertencias);
      } else {
        advertencias.push('Algunas columnas opcionales están ausentes');
      }
    }
    
    // Procesar filas de datos (desde fila 2)
    for (let i = 1; i < jsonData.length; i++) {
      const fila = jsonData[i];
      const numeroFila = i + 1;
      
      try {
        const registro = parsearFilaDerivacion(encabezadosArchivo, fila);
        
        // Validar registro
        const erroresValidacion = validarRegistroDerivacion(registro, numeroFila);
        
        if (erroresValidacion.length > 0) {
          errores.push(...erroresValidacion);
          // Continuar procesando (registro rechazado pero no para ejecución)
        } else {
          datos.push(registro);
        }
        
      } catch (error) {
        errores.push({
          fila: numeroFila,
          mensaje: `Error al procesar fila: ${error instanceof Error ? error.message : 'Error desconocido'}`
        });
      }
    }
    
    // Generar vista previa (primeras 10 filas)
    const vistaPrevia = datos.slice(0, 10);
    
    return {
      exito: datos.length > 0,
      registrosImportados: datos.length,
      registrosRechazados: jsonData.length - 1 - datos.length,
      errores,
      advertencias,
      datos,
      vistaPrevia
    };
    
  } catch (error) {
    errores.push({
      fila: 0,
      mensaje: `Error fatal al leer archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`
    });
    return crearResultadoVacio(errores, advertencias);
  }
};

/**
 * Valida que los encabezados del archivo coincidan con los esperados
 */
const validarEncabezados = (encabezados: string[]): string | null => {
  const faltantes: string[] = [];
  const extras: string[] = [];
  
  // Verificar columnas faltantes
  ENCABEZADOS_ESPERADOS.forEach(esperado => {
    if (!encabezados.includes(esperado)) {
      faltantes.push(esperado);
    }
  });
  
  // Verificar columnas extra
  encabezados.forEach(real => {
    if (!ENCABEZADOS_ESPERADOS.includes(real as typeof ENCABEZADOS_ESPERADOS[number])) {
      extras.push(real);
    }
  });
  
  if (faltantes.length > 0 || extras.length > 0) {
    const mensajes: string[] = [];
    
    if (faltantes.length > 0) {
      mensajes.push(`Columnas faltantes: ${faltantes.slice(0, 3).join(', ')}${faltantes.length > 3 ? '...' : ''}`);
    }
    
    if (extras.length > 0) {
      mensajes.push(`Columnas extra: ${extras.slice(0, 3).join(', ')}${extras.length > 3 ? '...' : ''}`);
    }
    
    return mensajes.join(' | ');
  }
  
  return null;
};

/**
 * Parsea una fila del CSV a objeto DerivacionData
 */
const parsearFilaDerivacion = (
  encabezados: string[],
  valores: string[]
): DerivacionData => {
  const registro: Partial<DerivacionData> = {};
  
  const registroMutable = registro as Record<string, string>;
  encabezados.forEach((encabezado, index) => {
    const valor = valores[index] || '';
    // Asignar valor al campo correspondiente sólo si es uno de los esperados
    if (ENCABEZADOS_ESPERADOS.includes(encabezado as typeof ENCABEZADOS_ESPERADOS[number])) {
      registroMutable[encabezado] = valor;
    }
  });
  
  return registro as DerivacionData;
};

/**
 * Valida un registro de derivación
 */
const validarRegistroDerivacion = (
  registro: DerivacionData,
  numeroFila: number
): ErrorImportacion[] => {
  const errores: ErrorImportacion[] = [];
  
  // Validar fecha obligatoria
  if (!registro['Fecha desde']) {
    errores.push({
      fila: numeroFila,
      columna: 'Fecha desde',
      mensaje: 'Fecha desde es obligatoria'
    });
  } else if (!validarFormatoFecha(registro['Fecha desde'])) {
    errores.push({
      fila: numeroFila,
      columna: 'Fecha desde',
      mensaje: 'Formato de fecha inválido (esperado DD/MM/YYYY)',
      valorProblematico: registro['Fecha desde']
    });
  }
  
  // Validar estado de factura
  if (!registro['Estado de la factura']) {
    errores.push({
      fila: numeroFila,
      columna: 'Estado de la factura',
      mensaje: 'Estado de factura es obligatorio'
    });
  }
  
  // Validar consumos numéricos
  const camposConsumo = [
    'Consumo P1/punta',
    'Consumo P2/llano',
    'Consumo P3/valle'
  ] as const;
  
  camposConsumo.forEach(campo => {
    const valor = registro[campo];
    if (valor && valor !== '-' && isNaN(convertirANumero(valor))) {
      errores.push({
        fila: numeroFila,
        columna: campo,
        mensaje: 'Valor numérico inválido',
        valorProblematico: String(valor)
      });
    }
  });
  
  return errores;
};

/**
 * Valida formato de fecha DD/MM/YYYY
 */
const validarFormatoFecha = (fecha: string): boolean => {
  if (!fecha) return false;
  
  // Formato DD/MM/YYYY
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = fecha.match(regex);
  
  if (!match) return false;
  
  const [, dia, mes, año] = match.map(Number);
  
  // Validar rangos
  if (mes < 1 || mes > 12) return false;
  if (dia < 1 || dia > 31) return false;
  if (año < 1900 || año > 2100) return false;
  
  return true;
};

/**
 * Convierte string con formato español a número
 * Ejemplo: "1.234,56" -> 1234.56
 */
const convertirANumero = (valor: string | number): number => {
  if (typeof valor === 'number') return valor;
  if (!valor || valor === '-') return 0;
  
  // Reemplazar formato español: 1.234,56 -> 1234.56
  const numeroStr = String(valor)
    .replace(/\./g, '')  // Eliminar separador de miles
    .replace(',', '.');  // Reemplazar coma decimal por punto
  
  const numero = parseFloat(numeroStr);
  
  return isNaN(numero) ? 0 : numero;
};

/**
 * Crea resultado vacío con errores
 */
const crearResultadoVacio = (
  errores: ErrorImportacion[],
  advertencias: string[]
): ResultadoImportacionDerivacion => {
  return {
    exito: false,
    registrosImportados: 0,
    registrosRechazados: 0,
    errores,
    advertencias,
    datos: [],
    vistaPrevia: []
  };
};

/**
 * Formatea errores para mostrar al usuario
 */
export const formatearErroresImportacion = (errores: ErrorImportacion[]): string => {
  if (errores.length === 0) return '';
  
  const erroresPorFila = errores.slice(0, 5); // Mostrar solo primeros 5
  const mensajes = erroresPorFila.map(e => {
    let mensaje = `Fila ${e.fila}`;
    if (e.columna) mensaje += ` - ${e.columna}`;
    mensaje += `: ${e.mensaje}`;
    if (e.valorProblematico) mensaje += ` (valor: "${e.valorProblematico}")`;
    return mensaje;
  });
  
  if (errores.length > 5) {
    mensajes.push(`... y ${errores.length - 5} errores más`);
  }
  
  return mensajes.join('\n');
};

export { ENCABEZADOS_ESPERADOS };
