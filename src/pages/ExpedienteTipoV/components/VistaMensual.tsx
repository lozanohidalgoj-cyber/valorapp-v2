/**
 * 📅 Vista Mensual - HeatMap de consumo mensual
 */

import { Download } from 'lucide-react';
import type { ConsumoMensual } from '../../../types';
import { HeatMapConsumo } from '../../../components';

interface VistaMensualProps {
  datos: ConsumoMensual[];
  onExportarComparativa: () => void;
  onExportarCompleto: () => void;
}

export const VistaMensual = ({
  datos,
  onExportarComparativa,
  onExportarCompleto,
}: VistaMensualProps) => {
  return (
    <div className="expediente-heatmap-section">
      <div className="expediente-heatmap-wrapper">
        <HeatMapConsumo datos={datos} />
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
