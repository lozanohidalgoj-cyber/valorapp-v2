/**
 * Interfaz Saldo ATR
 * Muestra plantilla basada en "Interfaz Saldo ATR.xlsx" (46 columnas A..AT)
 * Permite importar "Saldo ATR.csv" (14 columnas A..N) y completar columnas A,C,G,H,I,J,P
 */

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, ArrowLeft, Upload } from 'lucide-react';
import './SaldoATR.css';

import type { SaldoATRRow, SaldoATRColumna } from '../../types';

// Letras de columna A..AT (46 columnas)
const COLUMN_LETTERS: readonly SaldoATRColumna[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z',
  'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ',
  'AK', 'AL', 'AM', 'AN', 'AO', 'AP', 'AQ', 'AR', 'AS', 'AT'
] as const;

// Columnas que deben quedar VACÍAS según la nueva instrucción
// A, C, G, H, I, J y P (manteniendo encabezados, bordes y estilo)
const COLUMNS_TO_EMPTY = new Set<SaldoATRColumna>(['A', 'C', 'G', 'H', 'I', 'J', 'P']);

/**
 * Crea una fila vacía con todas las columnas A..AT inicializadas
 */
const crearFilaVacia = (): SaldoATRRow => {
  const row = {} as Record<string, string>;
  COLUMN_LETTERS.forEach((col) => {
    row[col] = '';
  });
  return row as SaldoATRRow;
};

// Encabezados por defecto (fallback si no se ha importado archivo todavía)
const DEFAULT_HEADERS: Partial<Record<string, string>> = {
  A: 'Número Fiscal de Factura',
  B: 'Código de Empresa Distribuidora',
  C: 'Código de contrato externo - interfaz',
  D: 'Secuencial de factura',
  E: 'Tipo de factura',
  F: 'Estado de la factura',
  G: 'Fecha desde',
  H: 'Fecha hasta',
  I: 'Importe Factura',
  J: 'Fuente de la factura',
  K: 'Tipo de Fuente',
  L: 'Descripción Tipo de fuente',
  M: 'Tipo de Fuente Anterior',
  N: 'Descripción Tipo de fuente Anterior',
  O: 'Tipo de punto de medida',
  P: 'Consumo P1/punta',
  Q: 'Consumo P2/llano',
  R: 'Consumo P3/valle',
  S: 'Consumo P4/supervalle',
  T: 'Consumo P5',
  U: 'Consumo P6',
  V: 'Consumo Reactiva1',
  W: 'Consumo Reactiva2',
  X: 'Consumo Reactiva3',
  Y: 'Consumo Reactiva4',
  Z: 'Consumo Reactiva5',
  AA: 'Consumo Reactiva6',
  AB: 'Consumo cargo-abono P1/punta',
  AC: 'Consumo cargo-abono P2/llano',
  AD: 'Consumo cargo-abono P3/valle',
  AE: 'Consumo cargo/abono P4',
  AF: 'Consumo cargo/abono P5',
  AG: 'Consumo cargo/abono P6',
  AH: 'Consumo pérdidas P1/punta',
  AI: 'Consumo pérdidas P2/llano',
  AJ: 'Consumo pérdidas P3/valle',
  AK: 'Consumo pérdidas P4',
  AL: 'Consumo pérdidas P5',
  AM: 'Consumo pérdidas P6',
  AN: 'Maxímetro P1/Punta',
  AO: 'Maxímetro P2/Llano',
  AP: 'Maxímetro P3/Valle',
  AQ: 'Maxímetro P4',
  AR: 'Maxímetro P5',
  AS: 'Maxímetro P6',
  AT: 'Origen',
};

export const SaldoATR = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { autoOpen?: boolean } };
  const inputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<SaldoATRRow[]>([]);
  const [headers, setHeaders] = useState<string[]>(() => COLUMN_LETTERS.map((c) => DEFAULT_HEADERS[c] ?? `Columna ${c}`));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-abrir selector si venimos con intención de importar
  useEffect(() => {
    if (location.state?.autoOpen) {
      setTimeout(() => inputRef.current?.click(), 0);
    }
  }, [location.state]);

  // Cargar automáticamente la plantilla/base desde public para conservar valores D..AT
  useEffect(() => {
    const cargarBase = async () => {
      try {
        const resp = await fetch('/saldoATR_base.csv', { cache: 'no-store' });
        if (!resp.ok) throw new Error('No se pudo cargar la base de Saldo ATR');
        const text = await resp.text();
        const { headers: h, rows: r } = parseSaldoATRCSV(text);
        // Garantizar al menos 105 filas para pruebas/visualización
        const minRows = 105;
        const plantilla: SaldoATRRow = r[0] ?? crearFilaVacia();
        const rowsAseguradas: SaldoATRRow[] = [...r];
        while (rowsAseguradas.length < minRows) {
          // clonar para no referenciar el mismo objeto
          rowsAseguradas.push({ ...plantilla });
        }
        setHeaders(h);
        setRows(rowsAseguradas);
      } catch (e) {
        // No bloqueante: mostramos una pista, pero la vista sigue operativa
        setError(e instanceof Error ? e.message : 'Error al cargar la base de Saldo ATR');
      }
    };
    cargarBase();
  }, []);

  const handleVolver = () => navigate(-1);

  /**
   * Parsea el CSV "Interfaz Saldo ATR" completo conservando TODAS las columnas.
   * Solo deja vacías A, C, G, H, I, J y P (COLUMNS_TO_EMPTY).
   */
  const parseSaldoATRCSV = (raw: string): { headers: string[]; rows: SaldoATRRow[] } => {
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const headerLine = lines[0];
    const headerParts = headerLine.split(';').map((h) => h.trim());
    // Validación mínima: esperamos 46 encabezados (A..AT)
    if (headerParts.length !== 46) {
      throw new Error(`Se esperaban 46 columnas, se recibieron ${headerParts.length}`);
    }

    const parsedRows: SaldoATRRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(';');
      // Permitir líneas cortas: rellenar con vacío
      while (parts.length < 46) parts.push('');
      const row = crearFilaVacia();
      COLUMN_LETTERS.forEach((colLetter, idx) => {
        // Si la columna debe quedar vacía, forzamos string vacío
        if (!COLUMNS_TO_EMPTY.has(colLetter)) {
          (row as Record<string, string>)[colLetter] = (parts[idx] ?? '').trim();
        }
      });
      parsedRows.push(row);
    }
    return { headers: headerParts, rows: parsedRows };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string | null;
        if (!raw) throw new Error('Archivo vacío');
        const { headers: h, rows: r } = parseSaldoATRCSV(raw);
        // Actualizamos encabezados con los originales del archivo
        setHeaders(h);
        setRows(r);
        setSuccess('Archivo "Interfaz Saldo ATR" cargado. Columnas A, C, G, H, I, J y P se han dejado vacías.');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al procesar el archivo');
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleAbrirArchivo = () => inputRef.current?.click();

  return (
    <div className="saldoatr-container">
      <div className="saldoatr-header">
        <button className="saldoatr-back" onClick={handleVolver}>
          <ArrowLeft size={18} /> Volver
        </button>
        <h1>Interfaz Saldo ATR</h1>
        <div />
      </div>

      {error && (
        <div className="saldoatr-alert error">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {success && (
        <div className="saldoatr-alert success">
          <CheckCircle size={18} /> {success}
        </div>
      )}

      <div className="saldoatr-card">
        <div className="saldoatr-actions">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button className="saldoatr-import-btn" onClick={handleAbrirArchivo}>
            <Upload size={20} /> Importar Saldo ATR.csv
          </button>
          <span className="saldoatr-note">Regla: solo columnas A, C, G, H, I, J y P se muestran vacías; el resto conserva los valores del archivo.</span>
        </div>

        <div className="saldoatr-table-wrapper">
          <table className="saldoatr-table">
            <thead>
              <tr>
                {COLUMN_LETTERS.map((col, idx) => {
                  const title = headers[idx] ?? `Columna ${col}`;
                  const empty = COLUMNS_TO_EMPTY.has(col);
                  return (
                    <th key={col} className={empty ? 'th-empty-col' : ''}>
                      <div className="col-letter">{col}</div>
                      <div className="col-title">{title}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMN_LETTERS.length} className="empty-row">
                    Sin datos cargados. Importa un archivo Saldo ATR.csv para completar las columnas permitidas.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i}>
                    {COLUMN_LETTERS.map((c) => {
                      const rowData = r as Record<string, string>;
                      const value = rowData[c] ?? '';
                      const isEmpty = COLUMNS_TO_EMPTY.has(c);
                      return (
                        <td key={c} className={isEmpty ? 'col-force-empty' : 'col-value'}>
                          {isEmpty ? '' : value}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
