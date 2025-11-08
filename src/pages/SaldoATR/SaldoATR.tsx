/**
 * Interfaz Saldo ATR - Refactorizado
 * Muestra plantilla basada en "Interfaz Saldo ATR.xlsx" (46 columnas A..AT)
 * Permite importar "Saldo ATR.csv" (14 columnas A..N) y mapear a columnas A,C,G,H,I,J,P
 * Reducido mediante extracción de componentes, hooks y utilidades
 */

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertMessages, ImportActions, SaldoATRHeader, SaldoATRTable } from './components';
import { useSaldoATRBase, useFileImport } from './hooks';
import type { SaldoATRRow } from '../../types';
import './SaldoATR.css';

export const SaldoATR = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { autoOpen?: boolean } };
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Hook para cargar la base de datos
  const { rows: baseRows, headers, loading, error: loadError } = useSaldoATRBase();

  // Hook para importar archivos
  const { handleFileImport, error: importError, success } = useFileImport();

  // Estado local de filas (puede ser actualizado por importación)
  const [rows, setRows] = useState<SaldoATRRow[]>([]);

  // Sincronizar baseRows con rows locales
  useEffect(() => {
    if (!loading && baseRows.length > 0) {
      setRows(baseRows);
    }
  }, [baseRows, loading]);

  // Auto-abrir selector de archivos si viene de navegación
  useEffect(() => {
    if (location.state?.autoOpen) {
      setTimeout(() => inputRef.current?.click(), 0);
    }
  }, [location.state]);

  // Handlers
  const handleVolver = () => navigate(-1);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const updatedRows = await handleFileImport(file, rows);
      setRows(updatedRows);
    } catch {
      // Error ya manejado por el hook
    }
  };

  // Combinar errores
  const displayError = loadError || importError;

  return (
    <div className="saldoatr-container">
      <SaldoATRHeader onVolver={handleVolver} />

      <AlertMessages error={displayError} success={success} />

      <div className="saldoatr-card">
        <ImportActions inputRef={inputRef} onFileChange={handleFileChange} />

        {loading ? (
          <div className="saldoatr-loading">Cargando plantilla base...</div>
        ) : (
          <SaldoATRTable rows={rows} headers={headers} />
        )}
      </div>
    </div>
  );
};
