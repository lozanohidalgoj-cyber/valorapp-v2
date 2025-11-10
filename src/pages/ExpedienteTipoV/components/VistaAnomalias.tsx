/**
 * Vista de anomalías detectadas en la comparativa mensual
 */

import { useMemo } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import type { ConsumoMensual, DerivacionData } from '../../../types';
import { HeatMapConsumo } from '../../../components';
import { formatearNumero } from '../../../services/analisisConsumoService';

interface VistaAnomaliasProps {
  datos: ConsumoMensual[];
  detallesPorPeriodo: Record<string, DerivacionData[]>;
  onExportar?: (filas: ConsumoMensual[]) => void;
}

export const VistaAnomalias = ({ datos, detallesPorPeriodo, onExportar }: VistaAnomaliasProps) => {
  const totalAnomalias = datos.filter((registro) => registro.esAnomalia).length;
  const coloresPorAnio = useMemo(() => {
    const palette = [
      { background: 'rgba(0, 0, 208, 0.12)', text: 'var(--color-primary)' },
      { background: 'rgba(255, 49, 132, 0.14)', text: 'var(--color-secondary)' },
      { background: 'rgba(16, 185, 129, 0.18)', text: '#065f46' },
      { background: 'rgba(250, 204, 21, 0.18)', text: '#92400e' },
      { background: 'rgba(99, 102, 241, 0.18)', text: '#312e81' },
      { background: 'rgba(236, 72, 153, 0.18)', text: '#9d174d' },
    ];

    const years = Array.from(
      new Set(
        datos
          .map((registro) => registro.año)
          .filter((anio): anio is number => typeof anio === 'number' && Number.isFinite(anio))
      )
    ).sort((a, b) => a - b);

    const mapa = new Map<number, { background: string; text: string }>();
    years.forEach((year, index) => {
      mapa.set(year, palette[index % palette.length]);
    });

    return mapa;
  }, [datos]);
  const coloresPorPotencia = useMemo(() => {
    const palette = [
      { background: 'rgba(0, 0, 208, 0.14)', text: 'var(--color-primary)' },
      { background: 'rgba(255, 49, 132, 0.16)', text: 'var(--color-secondary)' },
      { background: 'rgba(16, 185, 129, 0.18)', text: '#065f46' },
      { background: 'rgba(250, 204, 21, 0.2)', text: '#92400e' },
      { background: 'rgba(99, 102, 241, 0.2)', text: '#312e81' },
      { background: 'rgba(236, 72, 153, 0.2)', text: '#9d174d' },
    ];

    const valoresUnicos = Array.from(
      new Set(
        datos
          .map((registro) =>
            registro.potenciaPromedio !== null ? Number(registro.potenciaPromedio.toFixed(2)) : null
          )
          .filter((valor): valor is number => valor !== null)
      )
    ).sort((a, b) => a - b);

    const mapa = new Map<number, { background: string; text: string }>();
    valoresUnicos.forEach((valor, indice) => {
      mapa.set(valor, palette[indice % palette.length]);
    });

    return mapa;
  }, [datos]);
  const motivosLegibles: Record<string, string> = {
    variacion_consumo_activa: 'Variación consumo activa',
    variacion_promedio_activa: 'Variación promedio activa',
    variacion_energia_reconstruida: 'Variación energía reconstruida',
    variacion_maximetro: 'Variación maxímetro',
  };

  const obtenerClaseFilaPotencia = (variacion: number | null): string => {
    if (variacion === null || variacion === 0) {
      return '';
    }
    return variacion > 0
      ? 'expediente-anomalias__row--potencia-subida'
      : 'expediente-anomalias__row--potencia-bajada';
  };

  const hayDatos = datos.length > 0;
  const hayAnomalias = totalAnomalias > 0;

  return (
    <div className="expediente-anomalias">
      <div className="expediente-heatmap-section expediente-anomalias__heatmap">
        <div className="expediente-heatmap-wrapper">
          <HeatMapConsumo datos={datos} detallesPorPeriodo={detallesPorPeriodo} />
        </div>
      </div>

      {!hayDatos ? (
        <div className="expediente-anomalias__empty">
          <AlertTriangle size={36} />
          <div>
            <h3>Sin datos disponibles</h3>
            <p>Carga información para visualizar el detalle de periodos y anomalías.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="expediente-anomalias__header">
            <div>
              <h3>
                ⚠️ {totalAnomalias} anomalía{totalAnomalias === 1 ? '' : 's'} detectada
                {totalAnomalias === 1 ? '' : 's'}
              </h3>
              <p>
                Se listan los periodos con cambios superiores al umbral configurado. Revisa los
                motivos para priorizar la investigación.
              </p>
            </div>
            {onExportar && (
              <button
                className="btn-export"
                onClick={() => onExportar(datos)}
                title="Exportar anomalías a Excel"
              >
                <Download size={16} />
                Exportar anomalías
              </button>
            )}
          </div>

          {!hayAnomalias && (
            <div className="expediente-anomalias__note">
              <AlertTriangle size={18} />
              <span>No se detectaron anomalías en el periodo analizado.</span>
            </div>
          )}

          <div className="expediente-anomalias__table-wrapper">
            <table className="expediente-table expediente-table-analisis">
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Consumo (kWh)</th>
                  <th>Potencia (kW)</th>
                  <th>Días</th>
                  <th>Consumo Promedio Diario (kWh)</th>
                  <th>Variación %</th>
                  <th>Tipo</th>
                  <th>Motivos</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((registro) => {
                  const consumoPromedioDiario =
                    registro.dias > 0 ? registro.consumoTotal / registro.dias : null;
                  const potenciaPromedio = registro.potenciaPromedio;
                  const variacionPotencia = registro.variacionPotenciaPorcentual;
                  const claseFilaPotencia = obtenerClaseFilaPotencia(variacionPotencia);
                  const claseAnomalia = registro.esAnomalia
                    ? 'expediente-anomalias__row--anomalia'
                    : '';
                  const estiloPeriodo = coloresPorAnio.get(registro.año);
                  const potenciaClave =
                    potenciaPromedio !== null ? Number(potenciaPromedio.toFixed(2)) : null;
                  const colorPotencia =
                    potenciaClave !== null ? coloresPorPotencia.get(potenciaClave) : undefined;

                  return (
                    <tr
                      key={registro.periodo}
                      className={`expediente-anomalias__row ${claseFilaPotencia} ${claseAnomalia}`.trim()}
                    >
                      <td
                        style={
                          estiloPeriodo
                            ? {
                                backgroundColor: estiloPeriodo.background,
                                color: estiloPeriodo.text,
                                fontWeight: 700,
                              }
                            : undefined
                        }
                      >
                        {registro.periodo}
                      </td>
                      <td>{formatearNumero(registro.consumoTotal)}</td>
                      <td
                        style={
                          colorPotencia
                            ? {
                                backgroundColor: colorPotencia.background,
                                color: colorPotencia.text,
                                fontWeight: 700,
                              }
                            : undefined
                        }
                      >
                        {potenciaPromedio !== null
                          ? `${formatearNumero(potenciaPromedio, 2)} kW`
                          : 'N/A'}
                      </td>
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
