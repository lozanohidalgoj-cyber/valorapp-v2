/**
 * 📅 Vista Mensual - HeatMap de consumo mensual
 */

import { Download } from 'lucide-react';
import type { ConsumoMensual, DerivacionData } from '../../../types';
import { HeatMapConsumo } from '../../../components';

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
  return (
    <div className="expediente-heatmap-section">
      <div className="expediente-heatmap-wrapper">
        <HeatMapConsumo datos={datos} detallesPorPeriodo={detallesPorPeriodo} />
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
    </div>
  );
};
