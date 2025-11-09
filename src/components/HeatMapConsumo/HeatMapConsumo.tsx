/**
 * 🔥 Heat Map de Consumo Mensual con métricas múltiples
 * Replica las cuatro tablas dinámicas de la macro de Excel:
 * - Consumo de Energía Activa
 * - Promedio de Energía Activa
 * - Maxímetro
 * - Energía Activa reconstruida (A + B + C)
 */

import { memo, useMemo, useEffect, useRef, useState, Fragment } from 'react';
import type { ConsumoMensual, DerivacionData } from '../../types';
import { formatearNumero, calcularColorHeatMap } from '../../utils';
import './HeatMapConsumo.css';

interface HeatMapConsumoProps {
  datos: ConsumoMensual[];
  detallesPorPeriodo?: Record<string, DerivacionData[]>;
}

type HeatmapMetricId = 'consumoActiva' | 'promedioActiva' | 'maximetro' | 'energiaReconstruida';

interface HeatmapMetricConfig {
  id: HeatmapMetricId;
  titulo: string;
  descripcion: string;
  unidad: string;
  motivoClave?: string;
  decimales?: number;
  extractor: (dato: ConsumoMensual) => number;
}

interface DetalleActivo {
  periodo: string;
  año: number;
  mes: number;
  registros: DerivacionData[];
  valor: number;
  metrica: HeatmapMetricConfig;
}

const METRICAS: HeatmapMetricConfig[] = [
  {
    id: 'consumoActiva',
    titulo: 'Consumo de E. Activa',
    descripcion: 'Suma del campo "Consumo Activa" por mes y año',
    unidad: 'kWh',
    motivoClave: 'variacion_consumo_activa',
    decimales: 0,
    extractor: (dato) => dato.consumoActivaTotal,
  },
  {
    id: 'promedioActiva',
    titulo: 'Promedio de E. Activa',
    descripcion: 'Suma del campo "Promedio Activa" por periodo',
    unidad: 'kWh',
    motivoClave: 'variacion_promedio_activa',
    decimales: 2,
    extractor: (dato) => dato.promedioActivaTotal,
  },
  {
    id: 'maximetro',
    titulo: 'Maxímetro',
    descripcion: 'Sumatoria del campo "Maxímetro" consolidado',
    unidad: 'kW',
    motivoClave: 'variacion_maximetro',
    decimales: 2,
    extractor: (dato) => dato.maximetroTotal,
  },
  {
    id: 'energiaReconstruida',
    titulo: 'E. Activa reconstruida',
    descripcion: 'Suma del campo "A + B + C" (energía reconstruida tras refacturación)',
    unidad: 'kWh',
    motivoClave: 'variacion_energia_reconstruida',
    decimales: 0,
    extractor: (dato) => dato.energiaReconstruidaTotal,
  },
];

const CAMPOS_DETALLE = [
  'Contrato',
  'Secuencial factura',
  'Fecha Inicio',
  'Fecha fin',
  'Consumo Activa',
  'Promedio Activa',
  'Consumo Reactiva',
  'Promedio Reactiva',
  'Cargo abono total',
  'Pérdidas Total',
  'Maxímetro',
  'Lectura',
  'Fuente',
  'Año',
  'Mes',
  'Energía Total Reconstruida',
  'Días',
  'Consumo promedio ciclo',
  'Promedio ER',
  'AB - A',
  'P1',
  'P2',
  'P3',
  'P4',
  'P5',
  'P6',
  'AB - C',
  'A + B + C',
] as const;

const NOMBRES_MESES_CORTO = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];
const NOMBRES_MESES_LARGO = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const HeatMapConsumoComponent = ({ datos, detallesPorPeriodo }: HeatMapConsumoProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(undefined);
  const [metricaSeleccionada, setMetricaSeleccionada] = useState<HeatmapMetricId>('consumoActiva');
  const [detalleActivo, setDetalleActivo] = useState<DetalleActivo | null>(null);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current || !matrixRef.current) return;
      const cRect = containerRef.current.getBoundingClientRect();
      const availableHeight = window.innerHeight - cRect.top - 12;
      const availableWidth = cRect.width - 12;
      const contentHeight = matrixRef.current.scrollHeight;
      const contentWidth = matrixRef.current.scrollWidth;
      const heightScale = availableHeight / contentHeight;
      const widthScale = availableWidth / contentWidth;
      const baseScale = Math.min(heightScale, widthScale);
      const newScale = Math.min(1.15, Math.max(0.8, baseScale));
      setScale(newScale);
      setScaledHeight(Math.ceil(contentHeight * newScale));
    };

    updateScale();

    const ro = new ResizeObserver(() => updateScale());
    if (matrixRef.current) ro.observe(matrixRef.current);
    window.addEventListener('resize', updateScale);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [datos]);

  const metricaActual = useMemo(
    () => METRICAS.find((metrica) => metrica.id === metricaSeleccionada) ?? METRICAS[0],
    [metricaSeleccionada]
  );

  const años = useMemo(() => {
    return Array.from(new Set(datos.map((d) => d.año))).sort((a, b) => a - b);
  }, [datos]);

  const mapaPorPeriodo = useMemo(() => {
    const m = new Map<string, ConsumoMensual>();
    datos.forEach((d) => m.set(`${d.año}-${d.mes}`, d));
    return m;
  }, [datos]);

  const resumenMetricas = useMemo(() => {
    const valores = datos
      .map((dato) => metricaActual.extractor(dato))
      .filter((valor) => Number.isFinite(valor));

    if (valores.length === 0) {
      return { minimo: 0, maximo: 0, promedio: 0 };
    }

    return {
      minimo: Math.min(...valores),
      maximo: Math.max(...valores),
      promedio: valores.reduce((acc, val) => acc + val, 0) / valores.length,
    };
  }, [datos, metricaActual]);

  const detallesMap = detallesPorPeriodo ?? {};

  const handleCellClick = (año: number, mesIndex: number, dato?: ConsumoMensual) => {
    if (!dato) return;
    const periodo = `${año}-${String(mesIndex + 1).padStart(2, '0')}`;
    const registros = detallesMap[periodo] || [];
    setDetalleActivo({
      periodo,
      año,
      mes: mesIndex + 1,
      registros,
      valor: metricaActual.extractor(dato),
      metrica: metricaActual,
    });
  };

  const cerrarDetalle = () => setDetalleActivo(null);

  const columnasDetalle = useMemo(() => {
    if (!detalleActivo) return [] as string[];
    return CAMPOS_DETALLE.filter((campo) =>
      detalleActivo.registros.some((registro) => {
        const valor = (registro as unknown as Record<string, unknown>)[campo];
        return valor !== undefined && valor !== null && valor !== '';
      })
    );
  }, [detalleActivo]);

  const formatearValorDetalle = (valor: unknown): string => {
    if (valor === null || valor === undefined || valor === '') return '-';
    if (typeof valor === 'number') return formatearNumero(valor, 2);
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
    return String(valor);
  };

  if (datos.length === 0) {
    return (
      <div className="heatmap-container">
        <p className="heatmap-no-data">No hay datos disponibles para el mapa de calor</p>
      </div>
    );
  }

  return (
    <div className="heatmap-container" ref={containerRef}>
      <div className="heatmap-matrix-wrapper" style={{ height: scaledHeight }}>
        <div
          className="matrix-scale"
          style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
        >
          <div className="heatmap-matrix heatmap-matrix--integrated" ref={matrixRef}>
            <div
              className="matrix-integrated-header"
              style={{ gridColumn: `1 / span ${años.length + 1}` }}
            >
              <div className="integrated-row">
                <h3 className="heatmap-title integrated-title">🔥 {metricaActual.titulo}</h3>
              </div>
              <div className="heatmap-tabs">
                {METRICAS.map((metrica) => (
                  <button
                    key={metrica.id}
                    type="button"
                    className={`heatmap-tab ${metricaSeleccionada === metrica.id ? 'active' : ''}`}
                    onClick={() => setMetricaSeleccionada(metrica.id)}
                  >
                    {metrica.titulo}
                  </button>
                ))}
              </div>
              <p className="heatmap-description">{metricaActual.descripcion}</p>
              <div className="integrated-chips">
                <div className="heatmap-chip">
                  <span className="chip-label">📊 Promedio</span>
                  <span className="chip-value">
                    {formatearNumero(resumenMetricas.promedio, metricaActual.decimales ?? 0)}{' '}
                    {metricaActual.unidad}
                  </span>
                </div>
                <div className="heatmap-chip">
                  <span className="chip-label">📉 Mínimo</span>
                  <span className="chip-value">
                    {formatearNumero(resumenMetricas.minimo, metricaActual.decimales ?? 0)}{' '}
                    {metricaActual.unidad}
                  </span>
                </div>
                <div className="heatmap-chip">
                  <span className="chip-label">📈 Máximo</span>
                  <span className="chip-value">
                    {formatearNumero(resumenMetricas.maximo, metricaActual.decimales ?? 0)}{' '}
                    {metricaActual.unidad}
                  </span>
                </div>
                <div className="heatmap-chip heatmap-chip--anomalia">
                  <span className="chip-label">⚠️ Anomalías</span>
                  <span className="chip-value">{datos.filter((d) => d.esAnomalia).length}</span>
                </div>
              </div>
              <div className="integrated-row legend-variacion-inline">
                <span className="legend-inline-title">📊 Código de Colores - Variación:</span>
                <div className="legend-inline-items">
                  <span className="legend-inline-item">
                    <span className="legend-inline-box" style={{ background: '#66bb6a' }}></span>
                    Estable (±5%)
                  </span>
                  <span className="legend-inline-item">
                    <span className="legend-inline-box" style={{ background: '#ffca28' }}></span>
                    Leve (5-10%)
                  </span>
                  <span className="legend-inline-item">
                    <span className="legend-inline-box" style={{ background: '#ffa726' }}></span>
                    Moderada (10-20%)
                  </span>
                  <span className="legend-inline-item">
                    <span className="legend-inline-box" style={{ background: '#ff5722' }}></span>
                    Alta (20-40%)
                  </span>
                  <span className="legend-inline-item">
                    <span className="legend-inline-box" style={{ background: '#ff1744' }}></span>⚠️
                    &gt;40%
                  </span>
                  <span className="legend-inline-item intensity-inline">
                    <span
                      className="legend-inline-bar"
                      style={{
                        background:
                          'linear-gradient(to right, rgb(255,0,0), rgb(255,255,0), rgb(0,255,0))',
                      }}
                    ></span>{' '}
                    Intensidad: Bajo → Medio → Alto
                  </span>
                </div>
              </div>
            </div>
            <div className="matrix-corner"></div>
            {/* Encabezados de años (horizontal) */}
            {años.map((año) => (
              <div key={`h-${año}`} className="matrix-header-year">
                {año}
              </div>
            ))}
            {/* Filas de meses (vertical) */}
            {Array.from({ length: 12 }, (_, mesIdx) => {
              const mes = mesIdx + 1;
              return (
                <Fragment key={`mes-${mes}`}>
                  <div className="matrix-month-label">{NOMBRES_MESES_CORTO[mesIdx]}</div>
                  {años.map((año) => {
                    const dato = mapaPorPeriodo.get(`${año}-${mes}`);

                    if (!dato || dato.registros === 0) {
                      return (
                        <div key={`c-${año}-${mes}`} className="matrix-cell matrix-empty">
                          NA
                        </div>
                      );
                    }

                    const valor = metricaActual.extractor(dato);
                    const color = calcularColorHeatMap(
                      valor,
                      resumenMetricas.minimo,
                      resumenMetricas.maximo
                    );
                    const esAnomalia = metricaActual.motivoClave
                      ? dato.motivosAnomalia.includes(metricaActual.motivoClave)
                      : dato.esAnomalia;
                    const tooltipLineas = [
                      `${NOMBRES_MESES_LARGO[mes - 1]} ${año}`,
                      `${formatearNumero(valor, metricaActual.decimales ?? 0)} ${metricaActual.unidad}`,
                      `${dato.registros} registros`,
                    ];
                    if (dato.variacionPorcentual !== null) {
                      tooltipLineas.push(
                        `Variación: ${formatearNumero(dato.variacionPorcentual, 2)} %`
                      );
                    }

                    return (
                      <div
                        key={`c-${año}-${mes}`}
                        className={`matrix-cell matrix-value ${esAnomalia ? 'matrix-anomalia' : ''}`}
                        style={{ backgroundColor: color }}
                        title={`${tooltipLineas.join('\n')}${esAnomalia ? '\n⚠️ Anomalía detectada' : ''}`}
                        onClick={() => handleCellClick(año, mesIdx, dato)}
                      >
                        <span className="matrix-consumo">
                          {formatearNumero(valor, metricaActual.decimales ?? 0)}
                        </span>
                        {esAnomalia && <span className="matrix-alert">⚠️</span>}
                      </div>
                    );
                  })}
                </Fragment>
              );
            })}

            {/* Fila de Total General */}
            <div className="matrix-total-general-label">📊 Total General</div>
            {años.map((año) => {
              const totalAño = Array.from({ length: 12 }).reduce<number>((suma, _, mesIdx) => {
                const mes = mesIdx + 1;
                const dato = mapaPorPeriodo.get(`${año}-${mes}`);
                if (dato && dato.registros > 0) {
                  return suma + metricaActual.extractor(dato);
                }
                return suma;
              }, 0);

              return (
                <div
                  key={`total-${año}`}
                  className="matrix-cell matrix-total-general-cell"
                  title={`Total ${año}: ${formatearNumero(
                    totalAño,
                    metricaActual.decimales ?? 0
                  )} ${metricaActual.unidad}`}
                >
                  <span className="matrix-consumo">
                    {formatearNumero(totalAño, metricaActual.decimales ?? 0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {detalleActivo && (
        <div className="heatmap-modal-backdrop" role="dialog" aria-modal="true">
          <div className="heatmap-modal">
            <div className="heatmap-modal-header">
              <h4>
                Detalles de {detalleActivo.metrica.titulo} – Mes:{' '}
                {NOMBRES_MESES_LARGO[detalleActivo.mes - 1]}, Año: {detalleActivo.año}
              </h4>
              <button type="button" className="heatmap-modal-close" onClick={cerrarDetalle}>
                ×
              </button>
            </div>
            <div className="heatmap-modal-summary">
              <span>
                Valor total:{' '}
                {formatearNumero(detalleActivo.valor, detalleActivo.metrica.decimales ?? 0)}{' '}
                {detalleActivo.metrica.unidad}
              </span>
              <span>Registros: {detalleActivo.registros.length}</span>
            </div>
            <div className="heatmap-modal-table-wrapper">
              <table className="heatmap-modal-table">
                <thead>
                  <tr>
                    {columnasDetalle.map((columna) => (
                      <th key={columna}>{columna}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detalleActivo.registros.map((registro, index) => {
                    const fila = registro as unknown as Record<string, unknown>;
                    return (
                      <tr key={`${detalleActivo.periodo}-${index}`}>
                        {columnasDetalle.map((columna) => {
                          const valor = fila[columna];
                          return <td key={columna}>{formatearValorDetalle(valor)}</td>;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const HeatMapConsumo = memo(HeatMapConsumoComponent);
