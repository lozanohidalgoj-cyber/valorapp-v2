/**
 * 📅 Vista Mensual - HeatMap de consumo mensual
 */

import { useRef } from 'react';
import { Download } from 'lucide-react';
import type { ConsumoMensual, DerivacionData } from '../../../types';
import { HeatMapConsumo } from '../../../components';
import { formatearNumero } from '../../../services/analisisConsumoService';

interface VistaMensualProps {
  datos: ConsumoMensual[];
  detallesPorPeriodo: Record<string, DerivacionData[]>;
  onExportarComparativa: () => void;
  onExportarCompleto: () => void;
}

export const VistaMensual = ({
  datos,
  detallesPorPeriodo,
  onExportarComparativa,
  onExportarCompleto,
}: VistaMensualProps) => {
  const tableRef = useRef<HTMLTableElement>(null);

  const handleScrollToPeriodo = (periodo: string) => {
    if (!tableRef.current) return;

    // Buscar la fila con el periodo
    const row = tableRef.current.querySelector(`[data-periodo="${periodo}"]`) as HTMLElement;
    if (!row) {
      return;
    }

    // Hacer scroll del elemento dentro de su contenedor padre más cercano scrolleable
    const tableWrapper = tableRef.current.closest(
      '.expediente-mensual__table-wrapper'
    ) as HTMLElement;
    if (tableWrapper) {
      const rowTop = row.offsetTop;
      const rowHeight = row.offsetHeight;
      const containerHeight = tableWrapper.clientHeight;

      // Calcular posición para centrar la fila
      const scrollTo = rowTop - containerHeight / 2 + rowHeight / 2;
      tableWrapper.scrollTo({ top: scrollTo, behavior: 'smooth' });
    }

    // También hacer scroll del viewport
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight temporal
    row.classList.add('expediente-mensual__row--highlighted');
    setTimeout(() => {
      row.classList.remove('expediente-mensual__row--highlighted');
    }, 3000);
  };

  const ordenados = [...datos].sort((a, b) => {
    if (a.año === b.año) return a.mes - b.mes;
    return a.año - b.año;
  });

  return (
    <div className="expediente-heatmap-section">
      <div className="expediente-heatmap-wrapper">
        <HeatMapConsumo
          datos={datos}
          detallesPorPeriodo={detallesPorPeriodo}
          onCellClick={handleScrollToPeriodo}
        />
      </div>

      <div className="expediente-export-buttons expediente-export-inline">
        <button
          className="btn-export"
          onClick={onExportarComparativa}
          title="Exportar Comparativa Mensual a Excel"
        >
          <Download size={16} />
          Exportar Comparativa Mensual
        </button>

        <button
          className="btn-export btn-export-complete"
          onClick={onExportarCompleto}
          title="Exportar análisis completo con todas las vistas"
        >
          <Download size={16} />
          Exportar Análisis Completo
        </button>
      </div>

      {/* Tabla de detalles mensuales */}
      <div className="expediente-mensual__table-wrapper">
        <table className="expediente-table expediente-table-mensual" ref={tableRef}>
          <thead>
            <tr>
              <th>Periodo</th>
              <th>Consumo (kWh)</th>
              <th>Días</th>
              <th>Consumo Promedio Diario (kWh)</th>
              <th>Variación %</th>
              <th>Potencia (kW)</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((registro) => {
              // Usar el campo ya calculado en el servicio
              const consumoPromedioDiario = registro.consumoPromedioDiario;

              return (
                <tr
                  key={registro.periodo}
                  data-periodo={registro.periodo}
                  className="expediente-mensual__row"
                >
                  <td style={{ fontWeight: 700 }}>{registro.periodo}</td>
                  <td>{formatearNumero(registro.consumoTotal)}</td>
                  <td>{registro.dias}</td>
                  <td>
                    {consumoPromedioDiario > 0 ? formatearNumero(consumoPromedioDiario, 2) : 'N/A'}
                  </td>
                  <td>
                    {registro.variacionPorcentual === null
                      ? 'N/A'
                      : `${formatearNumero(registro.variacionPorcentual)}%`}
                  </td>
                  <td>
                    {registro.potenciaPromedio !== null
                      ? `${formatearNumero(registro.potenciaPromedio, 2)} kW`
                      : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
