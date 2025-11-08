/**
 * Tabla de visualización de datos SaldoATR (46 columnas)
 * Memoizado para evitar re-renders innecesarios con grandes datasets
 */

import { memo } from 'react';
import type { SaldoATRRow } from '../../../types';
import { COLUMN_LETTERS, COLUMNS_TO_EMPTY } from '../utils/constants';

interface SaldoATRTableProps {
  rows: SaldoATRRow[];
  headers: string[];
}

const SaldoATRTableComponent = ({ rows, headers }: SaldoATRTableProps) => {
  return (
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
                Sin datos cargados. Importa un archivo Saldo ATR.csv para completar las columnas
                permitidas.
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
  );
};

export const SaldoATRTable = memo(SaldoATRTableComponent);
