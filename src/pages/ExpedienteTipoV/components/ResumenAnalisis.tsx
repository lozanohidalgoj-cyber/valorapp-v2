/**
 * 📊 Componente de Resumen de Análisis
 * Muestra estadísticas generales del análisis de consumo
 */

import type { ResultadoAnalisis } from '../../../types';
import './ResumenAnalisis.css';

interface ResumenAnalisisProps {
  resultado: ResultadoAnalisis;
}

export const ResumenAnalisis = ({ resultado }: ResumenAnalisisProps) => {
  const { resumen, periodoTotal } = resultado;

  return (
    <div className="expediente-analisis-resumen">
      <div className="analisis-resumen-card">
        <span className="resumen-label">Total Consumo</span>
        <span className="resumen-valor">
          {resumen.consumoTotalGeneral.toLocaleString('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}{' '}
          kWh
        </span>
      </div>

      <div className="analisis-resumen-card">
        <span className="resumen-label">Total Facturas</span>
        <span className="resumen-valor">{resumen.totalFacturas}</span>
      </div>

      <div className="analisis-resumen-card">
        <span className="resumen-label">Periodo</span>
        <span className="resumen-valor">
          {periodoTotal.fechaInicio} - {periodoTotal.fechaFin}
        </span>
      </div>

      <div className="analisis-resumen-card">
        <span className="resumen-label">Promedio Anual</span>
        <span className="resumen-valor">
          {resumen.promedioAnual.toLocaleString('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}{' '}
          kWh
        </span>
      </div>

      <div className="analisis-resumen-card">
        <span className="resumen-label">Anomalías Detectadas</span>
        <span className="resumen-valor anomalia-badge">{resumen.anomaliasDetectadas}</span>
      </div>
    </div>
  );
};
