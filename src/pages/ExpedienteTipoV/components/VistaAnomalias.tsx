/**
 * Vista de anomalías detectadas en la comparativa mensual
 */

import { AlertTriangle, Download } from 'lucide-react';
import type { ConsumoMensual, DerivacionData } from '../../../types';
import { HeatMapConsumo } from '../../../components';
import { formatearNumero } from '../../../services/analisisConsumoService';

interface VistaAnomaliasProps {
  datos: ConsumoMensual[];
  detallesPorPeriodo: Record<string, DerivacionData[]>;
  onExportar?: () => void;
}

export const VistaAnomalias = ({ datos, detallesPorPeriodo, onExportar }: VistaAnomaliasProps) => {
  const anomalías = datos.filter((registro) => registro.esAnomalia);
  const motivosLegibles: Record<string, string> = {
    variacion_consumo_activa: 'Variación consumo activa',
    variacion_promedio_activa: 'Variación promedio activa',
    variacion_energia_reconstruida: 'Variación energía reconstruida',
    variacion_maximetro: 'Variación maxímetro',
  };

  const hayAnomalias = anomalías.length > 0;

  return (
    <div className="expediente-anomalias">
      <div className="expediente-heatmap-section expediente-anomalias__heatmap">
        <div className="expediente-heatmap-wrapper">
          <HeatMapConsumo datos={datos} detallesPorPeriodo={detallesPorPeriodo} />
        </div>
      </div>

      {!hayAnomalias && (
        <div className="expediente-anomalias__empty">
          <AlertTriangle size={36} />
          <div>
            <h3>Sin anomalías detectadas</h3>
            <p>
              Ejecuta el análisis con más periodos o ajusta los filtros para detectar variaciones
              significativas en el consumo.
            </p>
          </div>
        </div>
      )}

      {hayAnomalias && (
        <>
          <div className="expediente-anomalias__header">
            <div>
              <h3>
                ⚠️ {anomalías.length} anomalía{anomalías.length === 1 ? '' : 's'} detectada
                {anomalías.length === 1 ? '' : 's'}
              </h3>
              <p>
                Se listan los periodos con cambios superiores al umbral configurado. Revisa los
                motivos para priorizar la investigación.
              </p>
            </div>
            {onExportar && (
              <button
                className="btn-export"
                onClick={onExportar}
                title="Exportar anomalías a Excel"
              >
                <Download size={16} />
                Exportar anomalías
              </button>
            )}
          </div>

          <div className="expediente-anomalias__table-wrapper">
            <table className="expediente-table expediente-table-analisis">
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Consumo (kWh)</th>
                  <th>Días</th>
                  <th>Consumo Promedio Diario (kWh)</th>
                  <th>Variación %</th>
                  <th>Tipo</th>
                  <th>Motivos</th>
                </tr>
              </thead>
              <tbody>
                {anomalías.map((registro) => {
                  const consumoPromedioDiario =
                    registro.dias > 0 ? registro.consumoTotal / registro.dias : null;

                  return (
                    <tr key={registro.periodo} className="expediente-anomalias__row">
                      <td>{registro.periodo}</td>
                      <td>{formatearNumero(registro.consumoTotal)}</td>
                      <td>{registro.dias}</td>
                      <td>
                        {consumoPromedioDiario !== null
                          ? formatearNumero(consumoPromedioDiario, 2)
                          : 'N/A'}
                      </td>
                      <td>
                        {registro.variacionPorcentual === null
                          ? 'N/A'
                          : `${formatearNumero(registro.variacionPorcentual)}%`}
                      </td>
                      <td className="expediente-anomalias__tipo">
                        {registro.tipoVariacion ?? 'N/A'}
                      </td>
                      <td>
                        {registro.motivosAnomalia.length === 0
                          ? 'Sin detalle'
                          : registro.motivosAnomalia
                              .map((motivo) => motivosLegibles[motivo] ?? motivo)
                              .join(', ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
