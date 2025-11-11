/**
 * Vista de anomalías detectadas en la comparativa mensual
 */

import { useMemo, useRef } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import type { ConsumoMensual, DerivacionData } from '../../../types';
import { HeatMapConsumo, BannerClasificacionExpediente } from '../../../components';
import {
  formatearNumero,
  analizarComportamientoMensual,
  esComportamientoAnomalo,
} from '../../../services/analisisConsumoService';
import { clasificarExpediente } from '../../../services/clasificadorExpedienteService';

interface VistaAnomaliasProps {
  datos: ConsumoMensual[];
  detallesPorPeriodo: Record<string, DerivacionData[]>;
  onExportar?: (filas: ConsumoMensual[]) => void;
}

export const VistaAnomalias = ({ datos, detallesPorPeriodo, onExportar }: VistaAnomaliasProps) => {
  const tableRef = useRef<HTMLTableElement>(null);

  const handleScrollToPeriodo = (periodo: string) => {
    if (!tableRef.current) return;

    // Buscar la fila con el periodo
    const row = tableRef.current.querySelector(`[data-periodo="${periodo}"]`) as HTMLElement;
    if (!row) {
      console.warn(`No se encontró fila con periodo: ${periodo}`);
      return;
    }

    // Hacer scroll del elemento dentro de su contenedor padre más cercano scrolleable
    // Primero, scroll en el contenedor de la tabla
    const tableWrapper = tableRef.current.closest(
      '.expediente-anomalias__table-wrapper'
    ) as HTMLElement;
    if (tableWrapper) {
      const rowTop = row.offsetTop;
      const rowHeight = row.offsetHeight;
      const containerHeight = tableWrapper.clientHeight;

      // Calcular posición para centrar la fila
      const scrollTo = rowTop - containerHeight / 2 + rowHeight / 2;
      tableWrapper.scrollTo({ top: scrollTo, behavior: 'smooth' });
    }

    // También hacer scroll del viewport en caso de que no esté visible
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight temporal
    row.classList.add('expediente-anomalias__row--highlighted');
    setTimeout(() => {
      row.classList.remove('expediente-anomalias__row--highlighted');
    }, 3000);
  };

  const compararPorPeriodo = (a: ConsumoMensual, b: ConsumoMensual) => {
    if (a.año === b.año) {
      return a.mes - b.mes;
    }
    return a.año - b.año;
  };
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
      // Usar consumoTotal en lugar de consumoPromedioDiario
      if (!Number.isFinite(registro.consumoTotal)) {
        return;
      }

      const actual = acumulados.get(registro.mes) ?? { suma: 0, cantidad: 0 };
      acumulados.set(registro.mes, {
        suma: actual.suma + registro.consumoTotal, // ✅ CONSUMO TOTAL
        cantidad: actual.cantidad + 1,
      });
    });

    const promedios = new Map<number, number>();

    acumulados.forEach((valor, mes) => {
      if (valor.cantidad > 0) {
        promedios.set(mes, valor.suma / valor.cantidad); // Promedio del CONSUMO TOTAL de ese mes
      }
    });

    return promedios;
  }, [datos]);
  const analisisPorPeriodo = useMemo(() => analizarComportamientoMensual(datos), [datos]);
  const totalAnomalias = useMemo(() => {
    return datos.reduce((acumulado, registro) => {
      const analisis = analisisPorPeriodo.get(registro.periodo);
      return esComportamientoAnomalo(analisis) ? acumulado + 1 : acumulado;
    }, 0);
  }, [analisisPorPeriodo, datos]);
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
  const resumenGeneral = useMemo(() => {
    if (datos.length === 0) {
      return null;
    }

    const ordenados = [...datos].sort(compararPorPeriodo);
    if (ordenados.length === 0) {
      return null;
    }

    // 1. Verificar si hay cambio de potencia
    let hayCambioPotencia = false;
    let potenciaAnterior = ordenados[0]?.potenciaPromedio ?? null;

    for (let i = 1; i < ordenados.length; i += 1) {
      const potenciaActual = ordenados[i].potenciaPromedio;
      if (potenciaActual !== potenciaAnterior) {
        hayCambioPotencia = true;
        break;
      }
      potenciaAnterior = potenciaActual;
    }

    if (hayCambioPotencia) {
      return {
        tipo: 'warning',
        icono: '⚠️',
        mensaje: 'No objetivo por cambio de potencia',
      } as const;
    }

    // 2. Contar ceros esperados (estacionalidad)
    const registrosCero = ordenados.filter((registro) => registro.consumoTotal === 0);
    if (registrosCero.length > 0) {
      const todosCeroEsperado = registrosCero.every((registro) => {
        const analisis = analisisPorPeriodo.get(registro.periodo);
        return (
          analisis?.comportamiento === 'Estacionalidad – uso temporal' || analisis?.ceroEsperado
        );
      });

      if (todosCeroEsperado) {
        return {
          tipo: 'info',
          icono: '⚪',
          mensaje: 'No anomalía – 0 esperado',
        } as const;
      }
    }

    // 3. Detectar descensos sostenidos (3+ meses consecutivos)
    let rachaDescenso = 0;
    let inicioDescensoSostenido: string | null = null;

    for (const registro of ordenados) {
      const analisis = analisisPorPeriodo.get(registro.periodo);
      if (analisis?.comportamiento === 'Descenso brusco mes a mes') {
        if (rachaDescenso === 0) {
          inicioDescensoSostenido = registro.periodo;
        }
        rachaDescenso += 1;
      } else {
        rachaDescenso = 0;
      }
    }

    if (rachaDescenso >= 3 && inicioDescensoSostenido) {
      const formatearPeriodoLegible = (periodo: string) => {
        const [anioStr, mesStr] = periodo.split('-');
        const anio = Number(anioStr);
        const mes = Number(mesStr);

        if (!Number.isFinite(anio) || !Number.isFinite(mes)) {
          return periodo;
        }

        const fecha = new Date(anio, mes - 1, 1);
        return new Intl.DateTimeFormat('es-ES', {
          month: 'long',
          year: 'numeric',
        }).format(fecha);
      };

      return {
        tipo: 'danger',
        icono: '🔴',
        mensaje: `Descenso sostenido – inicio de anomalía detectado en ${formatearPeriodoLegible(
          inicioDescensoSostenido
        )}`,
      } as const;
    }

    // Si no hay descenso sostenido, es sin anomalía
    // La "anomalía indeterminada" requiere descensos que no forman racha
    const tieneDescensos = ordenados.some((registro) => {
      const analisis = analisisPorPeriodo.get(registro.periodo);
      return analisis?.comportamiento === 'Descenso brusco mes a mes';
    });

    if (!tieneDescensos) {
      return {
        tipo: 'success',
        icono: '✅',
        mensaje: 'Sin anomalía',
      } as const;
    }

    // 4. Si hay descensos pero NO sostenidos, es anomalía indeterminada
    return {
      tipo: 'warning',
      icono: '⚠️',
      mensaje: 'Anomalía indeterminada',
    } as const;
  }, [analisisPorPeriodo, datos]);

  // Clasificación global del expediente
  const clasificacionExpediente = useMemo(() => {
    if (datos.length === 0) return null;
    return clasificarExpediente(datos);
  }, [datos]);

  // Handler para ir al inicio de la anomalía
  const handleIrInicioAnomalia = () => {
    if (clasificacionExpediente?.inicioPeriodoAnomalia) {
      handleScrollToPeriodo(clasificacionExpediente.inicioPeriodoAnomalia);
    }
  };

  return (
    <div className="expediente-anomalias">
      <div className="expediente-heatmap-section expediente-anomalias__heatmap">
        <div className="expediente-heatmap-wrapper">
          <HeatMapConsumo
            datos={datos}
            detallesPorPeriodo={detallesPorPeriodo}
            onCellClick={handleScrollToPeriodo}
          />
        </div>
      </div>

      {/* Banner de Clasificación Global del Expediente */}
      {clasificacionExpediente && (
        <BannerClasificacionExpediente
          resultado={clasificacionExpediente}
          onIrInicio={
            clasificacionExpediente.inicioPeriodoAnomalia ? handleIrInicioAnomalia : undefined
          }
        />
      )}

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
              <h3>Análisis de consumo</h3>
              <p>Visualiza los periodos cargados y revisa los indicadores más relevantes.</p>
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

          {resumenGeneral && (
            <div
              className={`expediente-anomalias__alert expediente-anomalias__alert--${resumenGeneral.tipo}`}
              role="status"
            >
              <span className="expediente-anomalias__alert-icon">{resumenGeneral.icono}</span>
              <span>{resumenGeneral.mensaje}</span>
            </div>
          )}

          {!hayAnomalias && (
            <div className="expediente-anomalias__note">
              <AlertTriangle size={18} />
              <span>No se detectaron anomalías en el periodo analizado.</span>
            </div>
          )}

          <div className="expediente-anomalias__table-wrapper">
            <table className="expediente-table expediente-table-analisis" ref={tableRef}>
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Consumo (kWh)</th>
                  <th>Días</th>
                  <th>Consumo Promedio Diario (kWh)</th>
                  <th>Tipo de comportamiento detectado</th>
                  <th>Potencia (kW)</th>
                  <th>Promedio Histórico (mismo mes)</th>
                  <th>Variación Histórica (%)</th>
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
                  const estiloPeriodo = coloresPorAnio.get(registro.año);
                  const potenciaClave =
                    potenciaPromedio !== null ? Number(potenciaPromedio.toFixed(2)) : null;
                  const colorPotencia =
                    potenciaClave !== null ? coloresPorPotencia.get(potenciaClave) : undefined;
                  const promedioHistorico = promedioHistoricoPorMes.get(registro.mes) ?? null;
                  const analisis = analisisPorPeriodo.get(registro.periodo);
                  const variacionHistorica = analisis?.variacionHistorica ?? null;
                  const comportamientoDetectado = analisis?.comportamiento ?? 'Normal';
                  const esAnomalia = esComportamientoAnomalo(analisis);
                  const claseAnomalia = esAnomalia ? 'expediente-anomalias__row--anomalia' : '';

                  return (
                    <tr
                      key={registro.periodo}
                      data-periodo={registro.periodo}
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
                      <td>{registro.dias}</td>
                      <td className="expediente-table-analisis__columna-promedio">
                        {consumoPromedioDiario !== null
                          ? formatearNumero(consumoPromedioDiario, 2)
                          : 'N/A'}
                      </td>
                      <td className="expediente-table-analisis__columna-comportamiento">
                        {comportamientoDetectado}
                      </td>
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
