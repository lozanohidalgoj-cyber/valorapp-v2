/**
 * 🧮 Utilidades
 *
 * Funciones auxiliares reutilizables para cálculos,
 * formateo, validación y procesamiento de datos.
 */

/**
 * Formatea una fecha ISO a formato legible
 */
export const formatearFecha = (fechaISO: string): string => {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Obtiene el periodo en formato YYYY-MM desde una fecha
 */
export const obtenerPeriodo = (fecha: string | Date): string => {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const año = fechaObj.getFullYear();
  const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
  return `${año}-${mes}`;
};

/**
 * Obtiene el nombre del mes en español
 */
export const obtenerNombreMes = (periodo: string): string => {
  const [año, mes] = periodo.split('-');
  const fecha = new Date(parseInt(año), parseInt(mes) - 1);
  return fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
};

/**
 * Formatea un número con separadores de miles
 */
export const formatearNumero = (valor: number, decimales: number = 2): string => {
  return valor.toLocaleString('es-ES', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
};

/**
 * Redondea un número a N decimales
 */
export const redondear = (valor: number, decimales: number = 2): number => {
  const multiplicador = Math.pow(10, decimales);
  return Math.round(valor * multiplicador) / multiplicador;
};

/**
 * Calcula el porcentaje de variación entre dos valores
 */
export const calcularVariacionPorcentual = (valorAnterior: number, valorActual: number): number => {
  if (valorAnterior === 0) return 0;
  return ((valorActual - valorAnterior) / valorAnterior) * 100;
};

/**
 * Calcula el promedio de un array de números
 */
export const calcularPromedio = (valores: number[]): number => {
  if (valores.length === 0) return 0;
  const suma = valores.reduce((acc, val) => acc + val, 0);
  return suma / valores.length;
};

/**
 * Calcula la mediana de un array de números
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
 */
export const calcularDesviacionEstandar = (valores: number[]): number => {
  if (valores.length === 0) return 0;
  const promedio = calcularPromedio(valores);
  const varianza = valores.reduce((acc, val) => {
    return acc + Math.pow(val - promedio, 2);
  }, 0) / valores.length;
  return Math.sqrt(varianza);
};

/**
 * Valida si un valor es un número válido
 */
export const esNumeroValido = (valor: unknown): boolean => {
  return typeof valor === 'number' && !isNaN(valor) && isFinite(valor);
};

/**
 * Valida si una fecha es válida
 */
export const esFechaValida = (fecha: string): boolean => {
  const fechaObj = new Date(fecha);
  return !isNaN(fechaObj.getTime());
};

/**
 * Valida si un periodo tiene formato YYYY-MM
 */
export const esPeriodoValido = (periodo: string): boolean => {
  const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return regex.test(periodo);
};

/**
 * Obtiene el color según el nivel de severidad
 */
export const obtenerColorSeveridad = (
  severidad: 'baja' | 'media' | 'alta' | 'critica'
): string => {
  const colores = {
    baja: '#4CAF50',
    media: '#FF9800',
    alta: '#FF3184',
    critica: '#F44336',
  };
  return colores[severidad];
};

/**
 * Obtiene el color para tendencia
 */
export const obtenerColorTendencia = (
  tendencia: 'aumento' | 'descenso' | 'estable'
): string => {
  const colores = {
    aumento: '#4CAF50',
    descenso: '#F44336',
    estable: '#2196F3',
  };
  return colores[tendencia];
};

/**
 * Genera un ID único
 */
export const generarId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Espera un tiempo determinado
 */
export const esperar = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Descarga un archivo en el navegador
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
