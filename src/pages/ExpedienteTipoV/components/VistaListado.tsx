/**
 * Vista de listado completo de datos
 */

import type { DerivacionData } from '../../../types';

interface VistaListadoProps {
  data: DerivacionData[];
  columns: string[];
}

export const VistaListado = ({ data, columns }: VistaListadoProps) => {
  const columnasVisibles = columns.slice(0, 10);
  const totalRegistros = data.length;
  const totalColumnas = columns.length;

  return (
    <div className="expediente-table-wrapper expediente-table-wrapper--listado">
      <div className="listado-header">
        <div>
          <h3>📋 Listado Completo de Registros</h3>
          <p className="listado-subtitle">Vista resumida de las columnas más consultadas</p>
        </div>
        <span className="listado-badge" aria-label={`Total de registros: ${totalRegistros}`}>
          {totalRegistros} registros
        </span>
      </div>
      <table className="expediente-table expediente-table-listado" role="table">
        <thead>
          <tr>
            {columnasVisibles.map((column, columnIndex) => (
              <th
                key={column}
                className={columnIndex === 0 ? 'expediente-table-header--fijo' : undefined}
                scope="col"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {columnasVisibles.map((column, columnIndex) => (
                <td
                  key={`${index}-${column}`}
                  className={
                    columnIndex === 0
                      ? 'expediente-table-cell expediente-table-cell--fija'
                      : 'expediente-table-cell'
                  }
                  data-title={column}
                >
                  {String((row as unknown as Record<string, unknown>)[column] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="listado-nota" role="note">
        ℹ️ Mostrando las primeras 10 columnas. Total de columnas disponibles: {totalColumnas}
      </div>
    </div>
  );
};
