/**
 * 💾 Servicio de Persistencia de Datos
 * 
 * Guarda y recupera datos en localStorage para no perder información
 * al recargar la página. Replica el comportamiento de "guardar archivo"
 * del Excel.
 */

import type { DerivacionData } from '../types';

const STORAGE_KEYS = {
  DERIVACION_DATA: 'valorapp_derivacion_data',
  FILTROS_APLICADOS: 'valorapp_filtros_aplicados',
  ULTIMA_SESION: 'valorapp_ultima_sesion',
  CONFIGURACION: 'valorapp_configuracion'
} as const;

/**
 * Estado de filtros aplicados
 */
export interface FiltrosAplicados {
  anularFC: boolean;
  fechaAplicacion: string;
  registrosEliminados: number;
}

/**
 * Información de la última sesión
 */
export interface UltimaSesion {
  fecha: string;
  nombreArchivo: string;
  registrosTotales: number;
  vistaActiva: 'anual' | 'mensual' | 'listado' | 'grafico';
}

/**
 * Configuración del usuario
 */
export interface Configuracion {
  modoOscuro: boolean;
  mostrarAdvertencias: boolean;
  autoGuardar: boolean;
}

// ============================================
// 💾 FUNCIONES DE PERSISTENCIA
// ============================================

/**
 * Guarda datos de derivación en localStorage
 */
export const guardarDerivacionData = (datos: DerivacionData[]): boolean => {
  try {
    const datosJSON = JSON.stringify(datos);
    localStorage.setItem(STORAGE_KEYS.DERIVACION_DATA, datosJSON);
    
    // Actualizar última sesión
    const ultimaSesion: UltimaSesion = {
      fecha: new Date().toISOString(),
      nombreArchivo: 'datos_importados.csv',
      registrosTotales: datos.length,
      vistaActiva: 'anual'
    };
    localStorage.setItem(STORAGE_KEYS.ULTIMA_SESION, JSON.stringify(ultimaSesion));
    
    return true;
  } catch (error) {
    console.error('Error al guardar datos:', error);
    
    // Si el error es por cuota excedida, limpiar datos antiguos
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('Cuota de localStorage excedida. Limpiando datos antiguos...');
      limpiarDatosAntiguos();
      return false;
    }
    
    return false;
  }
};

/**
 * Recupera datos de derivación desde localStorage
 */
export const recuperarDerivacionData = (): DerivacionData[] | null => {
  try {
    const datosJSON = localStorage.getItem(STORAGE_KEYS.DERIVACION_DATA);
    
    if (!datosJSON) {
      return null;
    }
    
    const datos = JSON.parse(datosJSON) as DerivacionData[];
    
    // Validar que sea un array
    if (!Array.isArray(datos)) {
      console.warn('Datos recuperados no son un array válido');
      return null;
    }
    
    return datos;
  } catch (error) {
    console.error('Error al recuperar datos:', error);
    return null;
  }
};

/**
 * Guarda filtros aplicados
 */
export const guardarFiltrosAplicados = (filtros: FiltrosAplicados): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.FILTROS_APLICADOS, JSON.stringify(filtros));
  } catch (error) {
    console.error('Error al guardar filtros:', error);
  }
};

/**
 * Recupera filtros aplicados
 */
export const recuperarFiltrosAplicados = (): FiltrosAplicados | null => {
  try {
    const filtrosJSON = localStorage.getItem(STORAGE_KEYS.FILTROS_APLICADOS);
    
    if (!filtrosJSON) {
      return null;
    }
    
    return JSON.parse(filtrosJSON) as FiltrosAplicados;
  } catch (error) {
    console.error('Error al recuperar filtros:', error);
    return null;
  }
};

/**
 * Guarda configuración del usuario
 */
export const guardarConfiguracion = (config: Configuracion): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIGURACION, JSON.stringify(config));
  } catch (error) {
    console.error('Error al guardar configuración:', error);
  }
};

/**
 * Recupera configuración del usuario
 */
export const recuperarConfiguracion = (): Configuracion => {
  try {
    const configJSON = localStorage.getItem(STORAGE_KEYS.CONFIGURACION);
    
    if (!configJSON) {
      // Retornar configuración por defecto
      return {
        modoOscuro: false,
        mostrarAdvertencias: true,
        autoGuardar: true
      };
    }
    
    return JSON.parse(configJSON) as Configuracion;
  } catch (error) {
    console.error('Error al recuperar configuración:', error);
    return {
      modoOscuro: false,
      mostrarAdvertencias: true,
      autoGuardar: true
    };
  }
};

/**
 * Recupera información de la última sesión
 */
export const recuperarUltimaSesion = (): UltimaSesion | null => {
  try {
    const sesionJSON = localStorage.getItem(STORAGE_KEYS.ULTIMA_SESION);
    
    if (!sesionJSON) {
      return null;
    }
    
    return JSON.parse(sesionJSON) as UltimaSesion;
  } catch (error) {
    console.error('Error al recuperar última sesión:', error);
    return null;
  }
};

/**
 * Limpia todos los datos guardados
 */
export const limpiarDatosGuardados = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error al limpiar datos:', error);
  }
};

/**
 * Limpia datos antiguos para liberar espacio
 */
const limpiarDatosAntiguos = (): void => {
  try {
    // Eliminar solo los datos de derivación (los más pesados)
    localStorage.removeItem(STORAGE_KEYS.DERIVACION_DATA);
  } catch (error) {
    console.error('Error al limpiar datos antiguos:', error);
  }
};

/**
 * Verifica si hay datos guardados disponibles
 */
export const hayDatosGuardados = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.DERIVACION_DATA) !== null;
};

/**
 * Calcula el tamaño de los datos guardados en KB
 */
export const calcularTamañoDatos = (): number => {
  try {
    let totalSize = 0;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += new Blob([item]).size;
      }
    });
    
    return Math.round(totalSize / 1024); // Convertir a KB
  } catch (error) {
    console.error('Error al calcular tamaño de datos:', error);
    return 0;
  }
};

/**
 * Exporta todos los datos como JSON para backup
 */
export const exportarBackup = (): string => {
  const backup = {
    fecha: new Date().toISOString(),
    datos: recuperarDerivacionData(),
    filtros: recuperarFiltrosAplicados(),
    sesion: recuperarUltimaSesion(),
    configuracion: recuperarConfiguracion()
  };
  
  return JSON.stringify(backup, null, 2);
};

/**
 * Importa datos desde un backup JSON
 */
export const importarBackup = (backupJSON: string): boolean => {
  try {
    const backup = JSON.parse(backupJSON);
    
    if (backup.datos) {
      guardarDerivacionData(backup.datos);
    }
    
    if (backup.filtros) {
      guardarFiltrosAplicados(backup.filtros);
    }
    
    if (backup.configuracion) {
      guardarConfiguracion(backup.configuracion);
    }
    
    return true;
  } catch (error) {
    console.error('Error al importar backup:', error);
    return false;
  }
};
