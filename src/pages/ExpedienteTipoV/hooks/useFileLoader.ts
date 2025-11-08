/**
 * Hook personalizado para manejar la carga y procesamiento de archivos de derivación
 */

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { DerivacionData } from '../../../types';

interface UseFileLoaderReturn {
  data: DerivacionData[];
  columns: string[];
  loaded: boolean;
  error: string | null;
  loadFile: (file: File) => Promise<void>;
  resetData: () => void;
  setData: (newData: DerivacionData[], newColumns: string[]) => void;
  setLoaded: (isLoaded: boolean) => void;
}

export const useFileLoader = (): UseFileLoaderReturn => {
  const [data, setData] = useState<DerivacionData[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(async (file: File): Promise<void> => {
    setError(null);
    setLoaded(false);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const fileData = e.target?.result;
          let jsonData: DerivacionData[] = [];

          if (file.name.endsWith('.csv')) {
            const csvText = fileData as string;
            const workbook = XLSX.read(csvText, {
              type: 'string',
              raw: true,
              codepage: 65001,
            });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            jsonData = XLSX.utils.sheet_to_json(worksheet) as DerivacionData[];
          } else {
            const workbook = XLSX.read(fileData, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            jsonData = XLSX.utils.sheet_to_json(worksheet) as DerivacionData[];
          }

          if (jsonData.length === 0) {
            setError('El archivo está vacío o no tiene el formato esperado');
            reject(new Error('Archivo vacío'));
            return;
          }

          const fileColumns = Object.keys(jsonData[0]);
          setColumns(fileColumns);
          setData(jsonData);
          setLoaded(true);
          resolve();
        } catch (err) {
          setError('El archivo no tiene el formato esperado');
          setData([]);
          setColumns([]);
          reject(err);
        }
      };

      reader.onerror = () => {
        setError('Error al leer el archivo');
        reject(new Error('Error de lectura'));
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file, 'UTF-8');
      } else {
        reader.readAsBinaryString(file);
      }
    });
  }, []);

  const resetData = useCallback(() => {
    setData([]);
    setColumns([]);
    setLoaded(false);
    setError(null);
  }, []);

  const updateData = useCallback((newData: DerivacionData[], newColumns: string[]) => {
    setData(newData);
    setColumns(newColumns);
  }, []);

  const updateLoaded = useCallback((isLoaded: boolean) => {
    setLoaded(isLoaded);
  }, []);

  return {
    data,
    columns,
    loaded,
    error,
    loadFile,
    resetData,
    setData: updateData,
    setLoaded: updateLoaded,
  };
};
