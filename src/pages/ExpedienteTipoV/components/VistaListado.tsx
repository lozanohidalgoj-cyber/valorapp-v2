/**
 * Vista de listado completo de datos
 */

import type { DerivacionData } from '../../../types';

interface VistaListadoProps {
  data: DerivacionData[];
  columns: string[];
}

export const VistaListado = ({ data, columns }: VistaListadoProps) => {
  return (
    <div className="expediente-table-wrapper">
      <div className="listado-header">
        <h3>📋 Listado Completo de Registros</h3>
        <p>{data.length} registros totales</p>
      </div>
      <table className="expediente-table expediente-table-listado">
        <thead>
          <tr>
            {columns.slice(0, 10).map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {columns.slice(0, 10).map((column) => (
                <td key={`${index}-${column}`}>
                  {String((row as unknown as Record<string, unknown>)[column] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="listado-nota">
        ℹ️ Mostrando las primeras 10 columnas. Total de columnas: {columns.length}
      </div>
    </div>
  );
};
