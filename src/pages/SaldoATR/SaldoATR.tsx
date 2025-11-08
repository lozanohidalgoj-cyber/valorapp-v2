/**
 * Interfaz Saldo ATR
 * Muestra plantilla basada en "Interfaz Saldo ATR.xlsx" (46 columnas A..AT)
 * Permite importar "Saldo ATR.csv" (14 columnas A..N) y mapear a columnas A,C,G,H,I,J,P
 */

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, ArrowLeft, Upload } from 'lucide-react';

import type { SaldoATRRow, SaldoATRColumna } from '../../types';
import './SaldoATR.css';

// Letras de columna A..AT (46 columnas)
const COLUMN_LETTERS: readonly SaldoATRColumna[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z',
  'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ',
  'AK', 'AL', 'AM', 'AN', 'AO', 'AP', 'AQ', 'AR', 'AS', 'AT'
] as const;

// Columnas que deben quedar VACÍAS en la plantilla base
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

/**
 * Parsea el CSV "Interfaz Saldo ATR" base (46 columnas A..AT) para cargar la plantilla inicial.
 */
function parseInterfazBaseCSV(raw: string): { headers: string[]; rows: SaldoATRRow[] } {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0 && !l.startsWith('#'));
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headerLine = lines[0];
  const headerParts = headerLine.split(';').map((h) => h.trim());
  
  if (headerParts.length !== 46) {
    throw new Error(`Se esperaban 46 columnas en base, se recibieron ${headerParts.length}`);
  }

  const parsedRows: SaldoATRRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(';');
    while (parts.length < 46) parts.push('');
    
    const row = crearFilaVacia();
    COLUMN_LETTERS.forEach((colLetter, idx) => {
      if (!COLUMNS_TO_EMPTY.has(colLetter)) {
        (row as Record<string, string>)[colLetter] = (parts[idx] ?? '').trim();
      }
    });
    parsedRows.push(row);
  }
  return { headers: headerParts, rows: parsedRows };
}

/**
 * Parsea el CSV "Saldo ATR.csv" (14 columnas A-N) y mapea a las columnas destino.
 * Mapeo de datos:
 * - CSV[8] Código factura → Destino A (Número Fiscal de Factura)
 * - CSV[1] Contrato ATR → Destino C (Código de contrato externo)
 * - CSV[2] Fecha desde → Destino G (Fecha desde)
 * - CSV[3] Fecha hasta → Destino H (Fecha hasta)
 * - CSV[4] Consumo total activa → Destino I (Importe Factura)
 * - CSV[5] Fuente agregada → Destino J (Fuente de la factura)
 * - CSV[4] Consumo total activa → Destino P (Consumo P1/punta)
 */
function parseSaldoATRImport(raw: string): SaldoATRRow[] {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) throw new Error('El archivo está vacío');
  
  const headerLine = lines[0];
  const headerParts = headerLine.split(';').map((h) => h.trim().replace(/^"|"$/g, ''));
  
  if (headerParts.length !== 14) {
    throw new Error(`El archivo no coincide con el formato esperado de Saldo ATR.csv. Se esperaban 14 columnas, se recibieron ${headerParts.length}.`);
  }

  const mappedRows: SaldoATRRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(';').map(p => p.trim().replace(/^"|"$/g, ''));
    
    while (parts.length < 14) parts.push('');
    
    const row = crearFilaVacia();
    const rowRecord = row as Record<string, string>;
    
    rowRecord['A'] = parts[8] || '';
    rowRecord['C'] = parts[1] || '';
    rowRecord['G'] = parts[2] || '';
    rowRecord['H'] = parts[3] || '';
    rowRecord['I'] = parts[4] || '';
    rowRecord['J'] = parts[5] || '';
    rowRecord['P'] = parts[4] || '';
    
    mappedRows.push(row);
  }
  
  return mappedRows;
}

export const SaldoATR = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { autoOpen?: boolean } };
  const inputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<SaldoATRRow[]>([]);
  const [headers, setHeaders] = useState<string[]>(() => 
    COLUMN_LETTERS.map((c) => DEFAULT_HEADERS[c] ?? `Columna ${c}`)
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.autoOpen) {
      setTimeout(() => inputRef.current?.click(), 0);
    }
  }, [location.state]);

  useEffect(() => {
    const cargarBase = async () => {
      try {
        const resp = await fetch('/saldoATR_base.csv', { cache: 'no-store' });
        if (!resp.ok) throw new Error('No se pudo cargar la base de Saldo ATR');
        
        const text = await resp.text();
        const { headers: h, rows: r } = parseInterfazBaseCSV(text);
        
        setHeaders(h);
        setRows(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar la base de Saldo ATR');
      }
    };
    cargarBase();
  }, []);

  const handleVolver = () => navigate(-1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      setError('Solo se aceptan archivos con extensión .csv');
      return;
    }
    
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string | null;
        if (!raw) throw new Error('Archivo vacío');
        
        const importedRows = parseSaldoATRImport(raw);
        const updatedRows = [...rows];
        
        importedRows.forEach((importedRow, idx) => {
          const importedRecord = importedRow as Record<string, string>;
          
          if (idx < updatedRows.length) {
            const currentRow = updatedRows[idx];
            const merged = { ...currentRow } as Record<string, string>;
            
            ['A', 'C', 'G', 'H', 'I', 'J', 'P'].forEach(col => {
              merged[col] = importedRecord[col] || '';
            });
            
            updatedRows[idx] = merged as SaldoATRRow;
          } else {
            const plantilla = updatedRows[0] || crearFilaVacia();
            const newRow = { ...plantilla } as Record<string, string>;
            
            ['A', 'C', 'G', 'H', 'I', 'J', 'P'].forEach(col => {
              newRow[col] = importedRecord[col] || '';
            });
            
            updatedRows.push(newRow as SaldoATRRow);
          }
        });
        
        setRows(updatedRows);
        setSuccess(`✅ Datos del archivo Saldo ATR cargados correctamente. ${importedRows.length} registros procesados.`);
        setTimeout(() => setSuccess(null), 5000);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al procesar el archivo');
        setTimeout(() => setError(null), 5000);
      }
    };
    
    reader.onerror = () => {
      setError('Error al leer el archivo');
      setTimeout(() => setError(null), 5000);
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
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button className="saldoatr-import-btn" onClick={handleAbrirArchivo}>
            <Upload size={20} /> Importar Saldo ATR
          </button>
          <span className="saldoatr-note">
            Importa el archivo <strong>Saldo ATR.csv</strong> (14 columnas). 
            Se actualizarán automáticamente las columnas A, C, G, H, I, J y P según el mapeo definido.
          </span>
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
                          {value}
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
