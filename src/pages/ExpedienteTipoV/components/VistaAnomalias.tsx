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
  const promedioHistoricoPorMes = useMemo(() => {
    const acumulados = new Map<number, { suma: number; cantidad: number }>();

    datos.forEach((registro) => {
      if (!Number.isFinite(registro.consumoPromedioDiario)) {
        return;
      }

      const actual = acumulados.get(registro.mes) ?? { suma: 0, cantidad: 0 };
      acumulados.set(registro.mes, {
        suma: actual.suma + registro.consumoPromedioDiario,
        cantidad: actual.cantidad + 1,
      });
    });

    const promedios = new Map<number, number>();

    acumulados.forEach((valor, mes) => {
      if (valor.cantidad > 0) {
        promedios.set(mes, valor.suma / valor.cantidad);
      }
    });

    return promedios;
  }, [datos]);
  const analisisPorPeriodo = useMemo(() => {
    const ordenados = [...datos].sort((a, b) => a.periodo.localeCompare(b.periodo));
    const resultado = new Map<
      string,
      {
        variacionHistorica: number | null;
        comportamiento: string;
        ceroEsperado: boolean;
      }
    >();
    let totalZerosPrevios = 0;
    let consecutivosZeros = 0;
    let cambioPotenciaActivo = false;

    ordenados.forEach((registro, indice) => {
      const consumoPromedioActual =
        registro.dias > 0 ? registro.consumoTotal / registro.dias : null;
      const promedioHistorico = promedioHistoricoPorMes.get(registro.mes) ?? null;
      const variacionHistorica =
        promedioHistorico === null || promedioHistorico === 0 || consumoPromedioActual === null
          ? null
          : ((consumoPromedioActual - promedioHistorico) / promedioHistorico) * 100;
      const anterior = indice > 0 ? ordenados[indice - 1] : undefined;
      const consumoPromedioAnterior =
        anterior && anterior.dias > 0 ? anterior.consumoTotal / anterior.dias : null;
      const siguiente = indice < ordenados.length - 1 ? ordenados[indice + 1] : undefined;

      const consumoEsCero = registro.consumoTotal === 0;
      const habiaCeroAntes = totalZerosPrevios > 0;
      const repetidoMasDeDos = consumoEsCero && consecutivosZeros + 1 > 2;
      const variacionPosterior = siguiente?.variacionPorcentual;
      const incrementoPosterior =
        consumoEsCero && typeof variacionPosterior === 'number' && variacionPosterior >= 40;
      const potenciaActual = registro.potenciaPromedio;
      const potenciaPeriodoAnterior =
        indice > 0 ? ordenados[indice - 1].potenciaPromedio : potenciaActual;

      if (indice > 0 && potenciaActual !== potenciaPeriodoAnterior) {
        cambioPotenciaActivo = true;
      }

      let comportamiento = 'Normal';

      let ceroEsperadoPersistente = false;

      if (consumoEsCero && (!habiaCeroAntes || repetidoMasDeDos || incrementoPosterior)) {
        comportamiento = 'Cero sospechoso';
      } else if (consumoEsCero) {
        comportamiento = 'Cero esperado estacional';
        ceroEsperadoPersistente = true;
      } else if (
        consumoPromedioAnterior !== null &&
        consumoPromedioAnterior !== 0 &&
        consumoPromedioActual !== null
      ) {
        const variacionMes =
          ((consumoPromedioActual - consumoPromedioAnterior) / consumoPromedioAnterior) * 100;
        if (variacionMes <= -30) {
          comportamiento = 'Descenso brusco mes a mes';
        }
      }

      if (comportamiento === 'Normal' && cambioPotenciaActivo) {
        comportamiento = 'Cambio de potencia';
      } else if (comportamiento === 'Normal' && registro.variacionPorcentual !== null) {
        if (registro.variacionPorcentual > 0) {
          comportamiento = 'Aumento de consumo';
        } else if (registro.variacionPorcentual === 0) {
          comportamiento = 'Sin cambio';
        }
      }

      resultado.set(registro.periodo, {
        variacionHistorica,
        comportamiento,
        ceroEsperado: ceroEsperadoPersistente,
      });

      if (consumoEsCero) {
        consecutivosZeros += 1;
        totalZerosPrevios += 1;
      } else {
        consecutivosZeros = 0;
      }
    });

    const mesesConConsumo = new Map<number, number>();
    const mesesCero = new Map<number, number>();

    ordenados.forEach((registro) => {
      const conteoConsumo = mesesConConsumo.get(registro.mes) ?? 0;
      const conteoCeros = mesesCero.get(registro.mes) ?? 0;

      if (registro.consumoTotal === 0) {
        mesesCero.set(registro.mes, conteoCeros + 1);
      } else {
        mesesConConsumo.set(registro.mes, conteoConsumo + 1);
      }
    });

    resultado.forEach((valor, periodo) => {
      const registro = ordenados.find((item) => item.periodo === periodo);
      if (!registro) {
        return;
      }

      const totalConsumoMes = mesesConConsumo.get(registro.mes) ?? 0;
      const totalCerosMes = mesesCero.get(registro.mes) ?? 0;
      const totalPeriodosMes = totalConsumoMes + totalCerosMes;

      if (
        valor.ceroEsperado &&
        totalConsumoMes >= 1 &&
        totalCerosMes >= totalConsumoMes &&
        totalPeriodosMes >= 3
      ) {
        const nuevoValor = resultado.get(periodo);
        if (nuevoValor) {
          nuevoValor.comportamiento = 'Estacionalidad – uso temporal';
          nuevoValor.ceroEsperado = true;
          resultado.set(periodo, nuevoValor);
        }
      }
    });

    return resultado;
  }, [datos, promedioHistoricoPorMes]);
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
                  <th>Promedio Histórico (mismo mes)</th>
                  <th>Variación Histórica (%)</th>
                  <th>Tipo de comportamiento detectado</th>
                  <th>Variación %</th>
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
                  const promedioHistorico = promedioHistoricoPorMes.get(registro.mes) ?? null;
                  const analisis = analisisPorPeriodo.get(registro.periodo);
                  const variacionHistorica = analisis?.variacionHistorica ?? null;
                  const comportamientoDetectado = analisis?.comportamiento ?? 'Normal';

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
                      <td className="expediente-table-analisis__columna-promedio">
                        {consumoPromedioDiario !== null
                          ? formatearNumero(consumoPromedioDiario, 2)
                          : 'N/A'}
                      </td>
                      <td className="expediente-table-analisis__columna-promedio">
                        {promedioHistorico === null
                          ? 'Sin histórico'
                          : formatearNumero(promedioHistorico, 2)}
                      </td>
                      <td className="expediente-table-analisis__columna-promedio">
                        {variacionHistorica === null
                          ? 'N/A'
                          : `${formatearNumero(variacionHistorica, 2)}%`}
                      </td>
                      <td className="expediente-table-analisis__columna-comportamiento">
                        {comportamientoDetectado}
                      </td>
                      <td>
                        {registro.variacionPorcentual === null
                          ? 'N/A'
                          : `${formatearNumero(registro.variacionPorcentual)}%`}
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
