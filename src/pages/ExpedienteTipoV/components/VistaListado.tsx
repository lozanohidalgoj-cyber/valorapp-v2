/**
 * Vista de listado completo de datos con ordenamiento por columnas
 */

import { useState, useMemo, useCallback } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { DerivacionData } from '../../../types';

interface VistaListadoProps {
  data: DerivacionData[];
  columns: string[];
}

export const VistaListado = ({ data, columns }: VistaListadoProps) => {
  const columnasVisibles = columns.slice(0, 10);
  const totalRegistros = data.length;
  const totalColumnas = columns.length;

  // Estados para ordenamiento
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Función para ordenar filas
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    const sorted = [...data].sort((a, b) => {
      const aRow = a as unknown as Record<string, unknown>;
      const bRow = b as unknown as Record<string, unknown>;

      const aValue = String(aRow[sortColumn] ?? '');
      const bValue = String(bRow[sortColumn] ?? '');

      // Intentar convertir a número para comparación numérica
      const aNum = Number(aValue);
      const bNum = Number(bValue);

      let comparison = 0;
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        // Comparación numérica
        comparison = aNum - bNum;
      } else {
        // Comparación de texto
        comparison = aValue.localeCompare(bValue, 'es', { numeric: true });
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortColumn, sortDirection]);

  // Manejar click en encabezado para ordenar
  const handleColumnSort = useCallback(
    (column: string) => {
      if (sortColumn === column) {
        // Si ya estaba ordenado por esta columna, invertir dirección
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        // Nueva columna, ordenar ascendente
        setSortColumn(column);
        setSortDirection('asc');
      }
    },
    [sortColumn, sortDirection]
  );

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
            {columnasVisibles.map((column) => {
              const isSort = sortColumn === column;
              return (
                <th
                  key={column}
                  className={`${isSort ? 'th-sorted' : ''}`}
                  scope="col"
                  onClick={() => handleColumnSort(column)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleColumnSort(column);
                    }
                  }}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div className="col-header-listado">
                    <span>{column}</span>
                    {isSort && (
                      <span className="sort-icon-listado">
                        {sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => {
            // Crear una clave única basada en los primeros valores disponibles del registro
            const keyValue = columnasVisibles
              .map((col) =>
                String((row as unknown as Record<string, string>)[col] ?? '').slice(0, 5)
              )
              .join('-');
            return (
              <tr key={keyValue || Math.random()}>
                {columnasVisibles.map((column) => (
                  <td
                    key={`${column}-${keyValue}`}
                    className="expediente-table-cell"
                    data-title={column}
                  >
                    {String((row as unknown as Record<string, string>)[column] ?? '')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="listado-nota" role="note">
        ℹ️ Mostrando las primeras 10 columnas. Total de columnas disponibles: {totalColumnas}
      </div>
    </div>
  );
};
