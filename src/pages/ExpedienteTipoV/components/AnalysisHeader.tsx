/**
 * Header con acciones de análisis cuando hay datos cargados
 * Muestra título, cantidad de registros y botones de acción
 */

import { BarChart2, Trash2 } from 'lucide-react';

/**
 * Props del componente AnalysisHeader
 */
interface AnalysisHeaderProps {
  /** Indica si el análisis está habilitado */
  analisisHabilitado: boolean;
  /** Indica si se está mostrando el análisis */
  mostrandoAnalisis: boolean;
  /** Callback para iniciar análisis */
  onAnalizar: () => void;
  /** Callback para alternar vista entre datos y análisis */
  onToggleVista: () => void;
  /** Callback para limpiar datos guardados */
  onLimpiarDatos: () => void;
  /** Total de registros cargados */
  totalRegistros?: number;
}

/**
 * Componente de encabezado con acciones de análisis
 * Muestra controles principales cuando hay datos cargados
 */
export const AnalysisHeader = ({
  analisisHabilitado,
  mostrandoAnalisis,
  onAnalizar,
  onToggleVista,
  onLimpiarDatos,
  totalRegistros = 0,
}: AnalysisHeaderProps) => {
  return (
    <div className="expediente-header-inline">
      <div className="expediente-title-inline">
        <h1 className="expediente-title">Análisis de Expediente Tipo V</h1>
        <p>{totalRegistros} registros cargados</p>
      </div>
      <div className="expediente-header-actions">
        <button onClick={onToggleVista} className="expediente-anular-btn-header">
          {mostrandoAnalisis ? 'Ver Datos' : 'Anular FC'}
        </button>
        <button
          onClick={onAnalizar}
          disabled={!analisisHabilitado}
          className="expediente-analisis-btn-header"
          title={analisisHabilitado ? 'Iniciar análisis de consumo' : 'Cargue datos primero'}
        >
          <BarChart2 size={20} />
          Análisis de Consumo
        </button>
        <button onClick={onLimpiarDatos} className="expediente-limpiar-btn-header">
          <Trash2 size={18} />
          Limpiar Datos
        </button>
      </div>
    </div>
  );
};
