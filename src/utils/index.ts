/**
 * 🧮 Utilidades y Funciones Auxiliares
 * 
 * Módulo centralizado de funciones reutilizables para
 * cálculos, formateo, validación y procesamiento de datos.
 */

// ============================================
// 📅 Utilidades de Fecha
// ============================================

/**
 * Formatea una fecha ISO a formato legible
 * @param fechaISO - Fecha en formato ISO 8601
 * @returns Fecha formateada (ej: "15/01/2024")
 */
export const formatearFecha = (fechaISO: string): string => {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Obtiene el periodo en formato YYYY-MM desde una fecha
 * @param fecha - Fecha a convertir
 * @returns Periodo en formato "2024-01"
 */
export const obtenerPeriodo = (fecha: string | Date): string => {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const año = fechaObj.getFullYear();
  const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
  return `${año}-${mes}`;
};

/**
 * Obtiene el nombre del mes en español
 * @param periodo - Periodo en formato YYYY-MM
 * @returns Nombre del mes (ej: "Enero 2024")
 */
export const obtenerNombreMes = (periodo: string): string => {
  const [año, mes] = periodo.split('-');
  const fecha = new Date(parseInt(año), parseInt(mes) - 1);
  return fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
};

// ============================================
// 🔢 Utilidades Numéricas
// ============================================

/**
 * Formatea un número con separadores de miles
 * @param valor - Número a formatear
 * @param decimales - Número de decimales (por defecto 2)
 * @returns Número formateado (ej: "1.234,56")
 */
export const formatearNumero = (valor: number, decimales: number = 2): string => {
  return valor.toLocaleString('es-ES', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  });
};

/**
 * Redondea un número a N decimales
 * @param valor - Número a redondear
 * @param decimales - Número de decimales
 * @returns Número redondeado
 */
export const redondear = (valor: number, decimales: number = 2): number => {
  const multiplicador = Math.pow(10, decimales);
  return Math.round(valor * multiplicador) / multiplicador;
};

/**
 * Calcula el porcentaje de variación entre dos valores
 * @param valorAnterior - Valor anterior
 * @param valorActual - Valor actual
 * @returns Porcentaje de variación
 */
export const calcularVariacionPorcentual = (
  valorAnterior: number,
  valorActual: number
): number => {
  if (valorAnterior === 0) return 0;
  return ((valorActual - valorAnterior) / valorAnterior) * 100;
};

// ============================================
// 📊 Utilidades Estadísticas
// ============================================

/**
 * Calcula el promedio de un array de números
 * @param valores - Array de valores numéricos
 * @returns Promedio
 */
export const calcularPromedio = (valores: number[]): number => {
  if (valores.length === 0) return 0;
  const suma = valores.reduce((acc, val) => acc + val, 0);
  return suma / valores.length;
};

/**
 * Calcula la mediana de un array de números
 * @param valores - Array de valores numéricos
 * @returns Mediana
 */
export const calcularMediana = (valores: number[]): number => {
  if (valores.length === 0) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(ordenados.length / 2);
  
  if (ordenados.length % 2 === 0) {
    return (ordenados[medio - 1] + ordenados[medio]) / 2;
  }
  return ordenados[medio];
};

/**
 * Calcula la desviación estándar de un array de números
 * @param valores - Array de valores numéricos
 * @returns Desviación estándar
 */
export const calcularDesviacionEstandar = (valores: number[]): number => {
  if (valores.length === 0) return 0;
  const promedio = calcularPromedio(valores);
  const varianza = valores.reduce((acc, val) => {
    return acc + Math.pow(val - promedio, 2);
  }, 0) / valores.length;
  return Math.sqrt(varianza);
};

// ============================================
// ✅ Utilidades de Validación
// ============================================

/**
 * Valida si un valor es un número válido
 * @param valor - Valor a validar
 * @returns true si es un número válido
 */
export const esNumeroValido = (valor: any): boolean => {
  return typeof valor === 'number' && !isNaN(valor) && isFinite(valor);
};

/**
 * Valida si una fecha es válida
 * @param fecha - Fecha a validar
 * @returns true si es una fecha válida
 */
export const esFechaValida = (fecha: string): boolean => {
  const fechaObj = new Date(fecha);
  return !isNaN(fechaObj.getTime());
};

/**
 * Valida si un periodo tiene formato correcto (YYYY-MM)
 * @param periodo - Periodo a validar
 * @returns true si el formato es válido
 */
export const esPeriodoValido = (periodo: string): boolean => {
  const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return regex.test(periodo);
};

// ============================================
// 🎨 Utilidades de Color
// ============================================

/**
 * Obtiene el color según el nivel de severidad
 * @param severidad - Nivel de severidad
 * @returns Color en formato hexadecimal
 */
export const obtenerColorSeveridad = (
  severidad: 'baja' | 'media' | 'alta' | 'critica'
): string => {
  const colores = {
    baja: '#4CAF50',      // Verde
    media: '#FF9800',     // Naranja
    alta: '#FF3184',      // Rosa (secundario)
    critica: '#F44336'    // Rojo
  };
  return colores[severidad];
};

/**
 * Obtiene el color para tendencia
 * @param tendencia - Tipo de tendencia
 * @returns Color en formato hexadecimal
 */
export const obtenerColorTendencia = (
  tendencia: 'aumento' | 'descenso' | 'estable'
): string => {
  const colores = {
    aumento: '#4CAF50',   // Verde
    descenso: '#F44336',  // Rojo
    estable: '#2196F3'    // Azul
  };
  return colores[tendencia];
};

// ============================================
// 🔧 Utilidades Generales
// ============================================

/**
 * Genera un ID único
 * @returns ID único alfanumérico
 */
export const generarId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Espera un tiempo determinado (útil para async/await)
 * @param ms - Milisegundos a esperar
 * @returns Promise que se resuelve después del tiempo especificado
 */
export const esperar = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Descarga un archivo en el navegador
 * @param contenido - Contenido del archivo
 * @param nombreArchivo - Nombre del archivo
 * @param tipoMIME - Tipo MIME del archivo
 */
export const descargarArchivo = (
  contenido: string,
  nombreArchivo: string,
  tipoMIME: string = 'text/plain'
): void => {
  const blob = new Blob([contenido], { type: tipoMIME });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
