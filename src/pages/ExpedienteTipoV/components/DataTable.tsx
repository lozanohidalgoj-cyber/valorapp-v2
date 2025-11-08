/**
 * Tabla de datos de derivación
 */

import type { DerivacionData } from '../../../types';

interface DataTableProps {
  data: DerivacionData[];
  columns: string[];
}

export const DataTable = ({ data, columns }: DataTableProps) => {
  return (
    <div className="expediente-table-wrapper">
      <table className="expediente-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={`${index}-${column}`}>
                  {String((row as unknown as Record<string, unknown>)[column] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
