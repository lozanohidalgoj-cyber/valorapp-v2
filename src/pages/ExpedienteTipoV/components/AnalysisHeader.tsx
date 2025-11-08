/**
 * Header con acciones de análisis cuando hay datos cargados
 */

import { BarChart2, Eye, EyeOff } from 'lucide-react';

interface AnalysisHeaderProps {
  analisisHabilitado: boolean;
  mostrandoAnalisis: boolean;
  onAnalizar: () => void;
  onToggleVista: () => void;
}

export const AnalysisHeader = ({
  analisisHabilitado,
  mostrandoAnalisis,
  onAnalizar,
  onToggleVista,
}: AnalysisHeaderProps) => {
  return (
    <div className="expediente-header-inline">
      <div className="expediente-header-actions">
        <button
          onClick={onAnalizar}
          disabled={!analisisHabilitado}
          className="expediente-analisis-btn-header"
          title={!analisisHabilitado ? 'Cargue datos primero' : 'Iniciar análisis de consumo'}
        >
          <BarChart2 size={20} />
          Análisis de Consumo
        </button>
        {mostrandoAnalisis && (
          <button
            onClick={onToggleVista}
            className="expediente-toggle-btn-header"
            title="Alternar vista de datos/análisis"
          >
            {mostrandoAnalisis ? <EyeOff size={20} /> : <Eye size={20} />}
            {mostrandoAnalisis ? 'Ver Datos' : 'Ver Análisis'}
          </button>
        )}
      </div>
    </div>
  );
};
