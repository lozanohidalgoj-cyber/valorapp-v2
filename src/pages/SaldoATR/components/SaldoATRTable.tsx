/**
 * Tabla de visualización de datos SaldoATR (46 columnas) con paginación y ordenamiento
 * Permite navegar por páginas, cambiar cantidad de items mostrados y ordenar por columnas
 * Memoizado para evitar re-renders innecesarios con grandes datasets
 */

import { memo, useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

import type { SaldoATRRow } from '../../../types';
import { COLUMN_LETTERS, COLUMNS_TO_EMPTY } from '../utils/constants';

/**
 * Props del componente SaldoATRTable
 */
interface SaldoATRTableProps {
  /** Array de filas de datos SaldoATR */
  rows: SaldoATRRow[];
  /** Array de encabezados de columnas */
  headers: string[];
}

/**
 * Genera array de números de página con elipsis para navegación
 * @param currentPage - Página actual
 * @param totalPages - Total de páginas
 * @returns Array con números de página y elipsis
 */
const generarNumerosPagina = (currentPage: number, totalPages: number): (number | string)[] => {
  const maxVisiblePages = 5;

  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];

  // Páginas iniciales
  if (currentPage <= 3) {
    pages.push(1, 2, 3, 4, '...', totalPages);
    return pages;
  }

  // Páginas finales
  if (currentPage >= totalPages - 2) {
    pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    return pages;
  }

  // Páginas del medio
  pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
  return pages;
};

/**
 * Componente de tabla SaldoATR con paginación
 * Muestra 46 columnas (A-AT) con capacidad de importación en columnas específicas
 */
const SaldoATRTableComponent = ({ rows, headers }: SaldoATRTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Función para ordenar filas
  const sortedRows = useMemo(() => {
    if (!sortColumn) return rows;

    const sorted = [...rows].sort((a, b) => {
      const aRow = a as Record<string, string>;
      const bRow = b as Record<string, string>;

      const aValue = aRow[sortColumn] ?? '';
      const bValue = bRow[sortColumn] ?? '';

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
  }, [rows, sortColumn, sortDirection]);

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
      // Volver a página 1 cuando se ordena
      setCurrentPage(1);
    },
    [sortColumn, sortDirection]
  );

  const totalPages = Math.ceil(sortedRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentRows = useMemo(
    () => sortedRows.slice(startIndex, endIndex),
    [sortedRows, startIndex, endIndex]
  );

  const pageNumbers = useMemo(
    () => generarNumerosPagina(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  const handleItemsPerPageChange = useCallback((value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  }, []);

  return (
    <>
      <div className="saldoatr-table-wrapper">
        <table className="saldoatr-table">
          <thead>
            <tr>
              {COLUMN_LETTERS.map((col, idx) => {
                const title = headers[idx] ?? `Columna ${col}`;
                const empty = COLUMNS_TO_EMPTY.has(col);
                const isSort = sortColumn === col;
                return (
                  <th
                    key={col}
                    className={`${empty ? 'th-empty-col' : ''} ${isSort ? 'th-sorted' : ''}`}
                    onClick={() => !empty && handleColumnSort(col)}
                    role={empty ? undefined : 'button'}
                    tabIndex={empty ? undefined : 0}
                    onKeyDown={
                      empty
                        ? undefined
                        : (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleColumnSort(col);
                            }
                          }
                    }
                  >
                    <div className="col-header">
                      <div>
                        <div className="col-letter">{col}</div>
                        <div className="col-title">{title}</div>
                      </div>
                      {!empty && sortColumn === col && (
                        <span className="sort-icon">
                          {sortDirection === 'asc' ? (
                            <ArrowUp size={16} />
                          ) : (
                            <ArrowDown size={16} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {currentRows.length === 0 ? (
              <tr>
                <td colSpan={COLUMN_LETTERS.length} className="empty-row">
                  Sin datos cargados. Importa un archivo Saldo ATR.csv para completar las columnas
                  permitidas.
                </td>
              </tr>
            ) : (
              currentRows.map((r, i) => (
                <tr key={startIndex + i}>
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

      {totalPages > 0 && sortedRows.length > 0 && (
        <div className="saldoatr-pagination-container">
          <div className="saldoatr-pagination-selector">
            <label htmlFor="saldoatr-items-per-page">Filas:</label>
            <select
              id="saldoatr-items-per-page"
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="saldoatr-pagination-select"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="saldoatr-pagination">
            <button
              className="saldoatr-pagination-btn saldoatr-pagination-btn--icon"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              title="Primera página"
            >
              <ChevronsLeft size={18} />
            </button>

            <button
              className="saldoatr-pagination-btn saldoatr-pagination-btn--icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              title="Página anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="saldoatr-pagination-numbers">
              {pageNumbers.map((page, idx) =>
                page === '...' ? (
                  <span
                    key={`ellipsis-${currentPage}-${idx}`}
                    className="saldoatr-pagination-ellipsis"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    className={`saldoatr-pagination-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page as number)}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <button
              className="saldoatr-pagination-btn saldoatr-pagination-btn--icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              title="Página siguiente"
            >
              <ChevronRight size={18} />
            </button>

            <button
              className="saldoatr-pagination-btn saldoatr-pagination-btn--icon"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              title="Última página"
            >
              <ChevronsRight size={18} />
            </button>
          </div>

          <div className="saldoatr-pagination-info">
            {startIndex + 1}-{Math.min(endIndex, sortedRows.length)} de {sortedRows.length}
          </div>
        </div>
      )}
    </>
  );
};

export const SaldoATRTable = memo(SaldoATRTableComponent);
