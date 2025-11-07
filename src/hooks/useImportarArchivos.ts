/**
 * 🪝 Hook para Importación de Archivos
 * 
 * Hook que maneja la importación de archivos CSV y JSON,
 * validación y procesamiento inicial de datos.
 */

import { useState, useCallback } from 'react';
import type { ConsumoEnergetico, ResultadoImportacion } from '../types';
import { importarCSV, importarJSON } from '../services/importService';

interface UseImportarArchivosReturn {
  /** Resultado de la última importación */
  resultado: ResultadoImportacion | null;
  /** Indica si está importando */
  importando: boolean;
  /** Importa un archivo desde un input file */
  importarArchivo: (archivo: File) => Promise<ConsumoEnergetico[]>;
  /** Limpia el resultado de importación */
  limpiarResultado: () => void;
}

/**
 * Hook para manejar importación de archivos
 * @returns Objeto con funciones y estado de importación
 */
export const useImportarArchivos = (): UseImportarArchivosReturn => {
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);
  const [importando, setImportando] = useState(false);

  /**
   * Importa un archivo y retorna los datos procesados
   */
  const importarArchivo = useCallback(async (archivo: File): Promise<ConsumoEnergetico[]> => {
    setImportando(true);
    setResultado(null);

    try {
      const contenido = await leerArchivo(archivo);
      const extension = archivo.name.split('.').pop()?.toLowerCase();

      let resultado: ResultadoImportacion;

      switch (extension) {
        case 'csv':
          resultado = await importarCSV(contenido);
          break;
        case 'json':
          resultado = await importarJSON(contenido);
          break;
        default:
          throw new Error(`Formato de archivo no soportado: ${extension}`);
      }

      setResultado(resultado);
      setImportando(false);

      if (!resultado.exito) {
        throw new Error(resultado.errores.join(', '));
      }

      return resultado.datos;

    } catch (error) {
      const mensajeError = error instanceof Error ? error.message : 'Error desconocido';
      
      setResultado({
        exito: false,
        registrosImportados: 0,
        errores: [mensajeError],
        datos: []
      });
      
      setImportando(false);
      throw error;
    }
  }, []);

  /**
   * Limpia el resultado de importación
   */
  const limpiarResultado = useCallback(() => {
    setResultado(null);
  }, []);

  return {
    resultado,
    importando,
    importarArchivo,
    limpiarResultado
  };
};

// ============================================
// 🔧 Funciones Auxiliares
// ============================================

/**
 * Lee el contenido de un archivo como texto
 */
const leerArchivo = (archivo: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const contenido = e.target?.result as string;
      resolve(contenido);
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsText(archivo);
  });
};
