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

/**
 * Calcula el color para la métrica de detección de anomalías
 * Usa la misma paleta que calcularColorHeatMap: Rojo → Amarillo → Verde
 * Incluye detección de cambios de potencia
 */
const calcularColorAnomalia = (consumoPromedioDiario: number, baseline: number): string => {
  if (consumoPromedioDiario === 0 || baseline === 0) {
    return 'rgb(255, 0, 0)'; // Rojo para cero consumo
  }

  const porcentajeVsBaseline = (consumoPromedioDiario / baseline) * 100;

  // Mapear porcentaje a rango 0-1 para usar la misma lógica que calcularColorHeatMap
  // 0% = 0 (rojo), 100% = 0.5 (amarillo), 200% = 1 (verde)
  let normalizado: number;

  if (porcentajeVsBaseline <= 100) {
    // 0-100%: mapear a 0-0.5 (rojo a amarillo)
    normalizado = (porcentajeVsBaseline / 100) * 0.5;
  } else {
    // 100-200%: mapear a 0.5-1 (amarillo a verde)
    const exceso = Math.min(porcentajeVsBaseline - 100, 100); // máximo 100% exceso
    normalizado = 0.5 + (exceso / 100) * 0.5;
  }

  // Misma lógica que calcularColorHeatMap
  let r, g, b;

  if (normalizado < 0.5) {
    // Rojo → Amarillo (0 a 0.5)
    const t = normalizado * 2; // 0 a 1
    r = 255;
    g = Math.round(255 * t);
    b = 0;
  } else {
    // Amarillo → Verde (0.5 a 1)
    const t = (normalizado - 0.5) * 2; // 0 a 1
    r = Math.round(255 * (1 - t));
    g = 255;
    b = 0;
  }

  return `rgb(${r}, ${g}, ${b})`;
};
import {
  extraerConsumoActiva,
  extraerPromedioActiva,
  extraerMaximetro,
  extraerEnergiaReconstruida,
} from '../../services/extractorMetricasService';
import './HeatMapConsumo.css';

interface HeatMapConsumoProps {
  datos: ConsumoMensual[];
  detallesPorPeriodo?: Record<string, DerivacionData[]>;
  onCellClick?: (periodo: string) => void;
}

type HeatmapMetricId =
  | 'consumoActiva'
  | 'promedioActiva'
  | 'maximetro'
  | 'energiaReconstruida'
  | 'deteccionAnomalias';

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

// Interfaces para eventos
interface CambioTitular {
  fecha: string;
  activo: boolean;
}

interface FechaActa {
  fecha: string;
  activo: boolean;
}

// ✅ USAR EXTRACTORES VALIDADOS DEL SERVICIO
const METRICAS: HeatmapMetricConfig[] = [
  {
    id: 'deteccionAnomalias',
    titulo: '🎯 Detección de Anomalías',
    descripcion: 'Análisis de anomalías basado en consumo promedio diario',
    unidad: 'kWh/día',
    motivoClave: 'variacion_consumo_activa',
    decimales: 1,
    extractor: (dato: ConsumoMensual) => dato.consumoPromedioDiario,
  },
  {
    id: 'consumoActiva',
    titulo: 'Consumo de E. Activa',
    descripcion: 'Suma del consumo activo (P1+P2+P3) en kWh',
    unidad: 'kWh',
    motivoClave: 'variacion_consumo_activa',
    decimales: 0,
    extractor: extraerConsumoActiva,
  },
  {
    id: 'promedioActiva',
    titulo: 'Promedio de E. Activa',
    descripcion: 'Consumo diario promedio en kWh/día',
    unidad: 'kWh/día',
    motivoClave: 'variacion_promedio_activa',
    decimales: 2,
    extractor: extraerPromedioActiva,
  },
  {
    id: 'maximetro',
    titulo: 'Maxímetro',
    descripcion: 'Máxima demanda instantánea en kW',
    unidad: 'kW',
    motivoClave: 'variacion_maximetro',
    decimales: 2,
    extractor: extraerMaximetro,
  },
  {
    id: 'energiaReconstruida',
    titulo: 'E. Activa reconstruida',
    descripcion: 'Energía reconstruida (A+B+C) en kWh',
    unidad: 'kWh',
    motivoClave: 'variacion_energia_reconstruida',
    decimales: 0,
    extractor: extraerEnergiaReconstruida,
  },
];

const CAMPOS_DETALLE = [
  'Contrato',
  'Secuencial factura',
  'Fecha Inicio',
  'Fecha fin',
  'Consumo Activa',
  'Potencia',
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

const HeatMapConsumoComponent = ({
  datos,
  detallesPorPeriodo,
  onCellClick,
}: HeatMapConsumoProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(undefined);
  const [metricaSeleccionada, setMetricaSeleccionada] =
    useState<HeatmapMetricId>('deteccionAnomalias');
  const [detalleActivo, setDetalleActivo] = useState<DetalleActivo | null>(null);
  const filaSeleccionadaRef = useRef<HTMLTableRowElement>(null);
  const tablaWrapperRef = useRef<HTMLDivElement>(null);

  // Estados para eventos
  const [cambioTitular, setCambioTitular] = useState<CambioTitular | null>(null);
  const [fechaActa, setFechaActa] = useState<FechaActa | null>(null);

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

  // Hacer scroll a la fila seleccionada cuando se abre el modal
  useEffect(() => {
    if (detalleActivo && filaSeleccionadaRef.current && tablaWrapperRef.current) {
      // Esperar a que el DOM se actualice
      setTimeout(() => {
        if (filaSeleccionadaRef.current && tablaWrapperRef.current) {
          const rowTop = filaSeleccionadaRef.current.offsetTop;
          const wrapperHeight = tablaWrapperRef.current.clientHeight;
          const rowHeight = filaSeleccionadaRef.current.clientHeight;
          const scrollTo = rowTop - wrapperHeight / 2 + rowHeight / 2;

          tablaWrapperRef.current.scrollTop = Math.max(0, scrollTo);
        }
      }, 50);
    }
  }, [detalleActivo]);

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

  // Calcular baseline para detección de anomalías
  const baselineAnomalias = useMemo(() => {
    if (metricaSeleccionada !== 'deteccionAnomalias' || datos.length < 3) {
      return 0;
    }

    const periodoBaseline = Math.min(12, Math.floor(datos.length * 0.3));
    const datosBaseline = datos.slice(0, periodoBaseline);
    const promediosBaseline = datosBaseline
      .map((d) => d.consumoPromedioDiario)
      .filter((p) => p > 0);

    if (promediosBaseline.length === 0) return 0;

    return promediosBaseline.reduce((sum, val) => sum + val, 0) / promediosBaseline.length;
  }, [datos, metricaSeleccionada]);

  const detallesMap = detallesPorPeriodo ?? {};

  const handleCellClick = (año: number, mesIndex: number, dato?: ConsumoMensual) => {
    if (!dato) return;

    const periodo = `${año}-${String(mesIndex + 1).padStart(2, '0')}`;

    // Siempre priorizar callback externo si existe (navegación/scroll en tablas)
    if (onCellClick) {
      onCellClick(periodo);
      return;
    }

    // Si no hay callback, no abrir modal cuando la métrica es de detección de anomalías
    if (metricaSeleccionada === 'deteccionAnomalias') {
      return;
    }

    const registros = detallesMap[periodo] || [];

    // Comportamiento por defecto: mostrar modal
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
    <div className="heatmap-container-wrapper">
      {/* Layout horizontal: Mapa de calor + Panel PA */}
      <div className="heatmap-horizontal-layout">
        {/* Mapa de calor a la izquierda */}
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
                    {metricaSeleccionada === 'deteccionAnomalias' && (
                      <div className="heatmap-chip heatmap-chip--baseline">
                        <span className="chip-label">🎯 Baseline</span>
                        <span className="chip-value">
                          {formatearNumero(baselineAnomalias, 1)} {metricaActual.unidad}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="integrated-row legend-variacion-inline">
                    {metricaSeleccionada === 'deteccionAnomalias' ? (
                      <>
                        <span className="legend-inline-title">
                          🎯 Código de Colores - Anomalías:
                        </span>
                        <div className="legend-inline-items">
                          <span className="legend-inline-item">
                            <span
                              className="legend-inline-box"
                              style={{ background: 'rgb(255, 0, 0)' }}
                            ></span>
                            Crítico (0-25%)
                          </span>
                          <span className="legend-inline-item">
                            <span
                              className="legend-inline-box"
                              style={{ background: 'rgb(255, 128, 0)' }}
                            ></span>
                            Bajo (25-75%)
                          </span>
                          <span className="legend-inline-item">
                            <span
                              className="legend-inline-box"
                              style={{ background: 'rgb(255, 255, 0)' }}
                            ></span>
                            Normal (75-125%)
                          </span>
                          <span className="legend-inline-item">
                            <span
                              className="legend-inline-box"
                              style={{ background: 'rgb(128, 255, 0)' }}
                            ></span>
                            Elevado (125-175%)
                          </span>
                          <span className="legend-inline-item">
                            <span
                              className="legend-inline-box"
                              style={{ background: 'rgb(0, 255, 0)' }}
                            ></span>
                            Muy alto (&gt;175%)
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="legend-inline-title">
                          📊 Código de Colores - Variación:
                        </span>
                        <div className="legend-inline-items">
                          <span className="legend-inline-item">
                            <span
                              className="legend-inline-box"
                              style={{ background: '#66bb6a' }}
                            ></span>
                            Estable (±5%)
                          </span>
                          <span className="legend-inline-item">
                            <span
                              className="legend-inline-box"
                              style={{ background: '#ffca28' }}
                            ></span>
                            Leve (5-10%)
                          </span>
                          <span className="legend-inline-item">
                            <span
                              className="legend-inline-box"
                              style={{ background: '#ffa726' }}
                            ></span>
                            Moderada (10-20%)
                          </span>
                          <span className="legend-inline-item">
                            <span
                              className="legend-inline-box"
                              style={{ background: '#ff5722' }}
                            ></span>
                            Alta (20-40%)
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
                      </>
                    )}
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

                        // Obtener dato del periodo anterior para información del tooltip
                        const periodoAnterior = `${mes === 1 ? año - 1 : año}-${mes === 1 ? 12 : mes - 1}`;
                        const datoAnterior = mapaPorPeriodo.get(periodoAnterior);

                        // Usar colores especiales para detección de anomalías
                        const color =
                          metricaSeleccionada === 'deteccionAnomalias'
                            ? calcularColorAnomalia(valor, baselineAnomalias)
                            : calcularColorHeatMap(
                                valor,
                                resumenMetricas.minimo,
                                resumenMetricas.maximo
                              );

                        // Tooltip personalizado para detección de anomalías
                        const tooltipLineas =
                          metricaSeleccionada === 'deteccionAnomalias'
                            ? (() => {
                                const lineasBase = [
                                  `${NOMBRES_MESES_LARGO[mes - 1]} ${año}`,
                                  `${formatearNumero(valor, metricaActual.decimales ?? 0)} ${metricaActual.unidad}`,
                                  `Baseline: ${formatearNumero(baselineAnomalias, 1)} kWh/día`,
                                  `Variación: ${formatearNumero((valor / baselineAnomalias - 1) * 100, 0)}%`,
                                  `${dato.dias} días facturados`,
                                ];

                                // Agregar información de cambio de potencia si se detecta
                                if (
                                  datoAnterior &&
                                  dato.potenciaPromedio !== null &&
                                  datoAnterior.potenciaPromedio !== null
                                ) {
                                  const cambioPotencia = Math.abs(
                                    dato.potenciaPromedio - datoAnterior.potenciaPromedio
                                  );
                                  if (cambioPotencia >= 0.5) {
                                    lineasBase.push(
                                      `⚡ Cambio de potencia: ${formatearNumero(cambioPotencia, 1)} kW`
                                    );
                                  }
                                }

                                return lineasBase;
                              })()
                            : [
                                `${NOMBRES_MESES_LARGO[mes - 1]} ${año}`,
                                `${formatearNumero(valor, metricaActual.decimales ?? 0)} ${metricaActual.unidad}`,
                                `${dato.dias} días facturados`,
                              ];

                        const periodo = `${año}-${String(mes).padStart(2, '0')}`;

                        // Verificar si hay fechas marcadas para este periodo
                        const tieneFechaActa =
                          fechaActa?.activo &&
                          fechaActa.fecha &&
                          fechaActa.fecha.startsWith(periodo);
                        const tieneCambioTitular =
                          cambioTitular?.activo &&
                          cambioTitular.fecha &&
                          cambioTitular.fecha.startsWith(periodo);
                        const tieneEvento = tieneFechaActa || tieneCambioTitular;

                        const claseCelda = `matrix-cell matrix-value${
                          tieneFechaActa ? ' matrix-cell--evento-temp' : ''
                        }${tieneCambioTitular ? ' matrix-cell--evento-aplicado' : ''}`;

                        // Construir información de evento para tooltip
                        const infoEvento = [];
                        if (tieneFechaActa)
                          infoEvento.push(`📝 Fecha de Acta: ${fechaActa?.fecha}`);
                        if (tieneCambioTitular)
                          infoEvento.push(`� Cambio de Titular: ${cambioTitular?.fecha}`);
                        const textoEvento = infoEvento.join(' | ');

                        return (
                          <div
                            key={`c-${año}-${mes}`}
                            className={claseCelda}
                            style={{ backgroundColor: color }}
                            title={[...tooltipLineas, tieneEvento ? textoEvento : null]
                              .filter(Boolean)
                              .join('\n')}
                            onClick={() => handleCellClick(año, mesIdx, dato)}
                          >
                            <span className="matrix-consumo">
                              {formatearNumero(valor, metricaActual.decimales ?? 0)}
                            </span>
                            {tieneFechaActa && <span className="evento-indicator">🏠</span>}
                            {tieneCambioTitular && !tieneFechaActa && (
                              <span className="evento-indicator">👤</span>
                            )}
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
        </div>

        {/* Panel PA a la derecha */}
        <div className="heatmap-control-panel">
          <h3 className="control-panel-title">Datos PA</h3>

          <div className="control-row">
            <div className="control-group">
              <label htmlFor="fecha-acta">Fecha de Acta:</label>
              <input
                id="fecha-acta"
                type="date"
                value={fechaActa?.fecha || ''}
                onChange={(e) => {
                  const fecha = e.target.value;
                  setFechaActa(fecha ? { fecha, activo: true } : null);
                }}
                className={`control-input ${fechaActa?.fecha ? 'control-input--active' : ''}`}
              />
            </div>

            <div className="control-group">
              <label htmlFor="cambio-titular">Cambio de Titular:</label>
              <input
                id="cambio-titular"
                type="date"
                value={cambioTitular?.fecha || ''}
                onChange={(e) => {
                  const fecha = e.target.value;
                  setCambioTitular(fecha ? { fecha, activo: true } : null);
                }}
                className={`control-input ${cambioTitular?.fecha ? 'control-input--active' : ''}`}
              />
            </div>
          </div>
        </div>
        {/* Fin heatmap-control-panel */}
      </div>
      {/* Fin heatmap-horizontal-layout */}

      {/* Modal del mapa de calor */}
      {detalleActivo && metricaSeleccionada !== 'deteccionAnomalias' && (
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
            <div className="heatmap-modal-table-wrapper" ref={tablaWrapperRef}>
              <table className="heatmap-modal-table">
                <thead>
                  <tr>
                    {columnasDetalle.map((columna) => (
                      <th key={columna}>{columna}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Fila especial para mostrar fechas marcadas */}
                  {(fechaActa?.fecha || cambioTitular?.fecha) && (
                    <tr style={{ backgroundColor: 'rgba(0, 0, 208, 0.1)', fontWeight: 'bold' }}>
                      <td
                        colSpan={columnasDetalle.length}
                        style={{ textAlign: 'center', padding: '12px' }}
                      >
                        📅 <strong>Fechas Marcadas en este Periodo:</strong>
                        {fechaActa?.fecha && fechaActa.fecha.startsWith(detalleActivo.periodo) && (
                          <span style={{ margin: '0 10px', color: 'var(--color-primary)' }}>
                            📝 Fecha de Acta: {fechaActa.fecha}
                          </span>
                        )}
                        {cambioTitular?.fecha &&
                          cambioTitular.fecha.startsWith(detalleActivo.periodo) && (
                            <span style={{ margin: '0 10px', color: 'var(--color-primary)' }}>
                              👤 Cambio de Titular: {cambioTitular.fecha}
                            </span>
                          )}
                        {(!fechaActa?.fecha ||
                          !fechaActa.fecha.startsWith(detalleActivo.periodo)) &&
                          (!cambioTitular?.fecha ||
                            !cambioTitular.fecha.startsWith(detalleActivo.periodo)) && (
                            <span style={{ color: '#666', fontSize: '0.9em' }}>
                              Sin fechas marcadas para este periodo
                            </span>
                          )}
                      </td>
                    </tr>
                  )}

                  {/* Fila especial para mostrar cambios de potencia */}
                  {(() => {
                    const periodoActual = detalleActivo.periodo;
                    const [año, mes] = periodoActual.split('-').map(Number);

                    // Buscar datos del periodo actual
                    const datoActual = datos.find((d) => d.año === año && d.mes === mes);

                    // Buscar dato del periodo anterior
                    const periodoAnteriorMes = mes === 1 ? 12 : mes - 1;
                    const periodoAnteriorAño = mes === 1 ? año - 1 : año;
                    const datoAnterior = datos.find(
                      (d) => d.año === periodoAnteriorAño && d.mes === periodoAnteriorMes
                    );

                    // Verificar si hay cambio de potencia significativo
                    if (
                      datoActual?.potenciaPromedio !== null &&
                      datoAnterior?.potenciaPromedio !== null &&
                      datoActual?.potenciaPromedio !== undefined &&
                      datoAnterior?.potenciaPromedio !== undefined
                    ) {
                      const potenciaActual = datoActual.potenciaPromedio;
                      const potenciaAnterior = datoAnterior.potenciaPromedio;
                      const cambioPotencia = Math.abs(potenciaActual - potenciaAnterior);
                      const variacionPorcentual =
                        ((potenciaActual - potenciaAnterior) / potenciaAnterior) * 100;

                      if (cambioPotencia >= 0.5) {
                        return (
                          <tr
                            style={{
                              backgroundColor: 'rgba(255, 193, 7, 0.1)',
                              fontWeight: 'bold',
                            }}
                          >
                            <td
                              colSpan={columnasDetalle.length}
                              style={{ textAlign: 'center', padding: '12px' }}
                            >
                              ⚡ <strong>Cambio de Potencia Detectado:</strong>
                              <span style={{ margin: '0 15px', color: 'var(--color-primary)' }}>
                                Periodo Anterior: {formatearNumero(potenciaAnterior, 2)} kW
                              </span>
                              <span style={{ margin: '0 15px', color: 'var(--color-primary)' }}>
                                Periodo Actual: {formatearNumero(potenciaActual, 2)} kW
                              </span>
                              <span
                                style={{
                                  margin: '0 15px',
                                  color: variacionPorcentual > 0 ? '#28a745' : '#dc3545',
                                  fontWeight: 'bold',
                                }}
                              >
                                Variación: {variacionPorcentual > 0 ? '+' : ''}
                                {formatearNumero(variacionPorcentual, 1)}% (
                                {variacionPorcentual > 0 ? '+' : ''}
                                {formatearNumero(cambioPotencia, 2)} kW)
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    }
                    return null;
                  })()}

                  {detalleActivo.registros.map((registro, index) => {
                    const fila = registro as unknown as Record<string, unknown>;

                    // Resaltar solo la primera fila para indicar el periodo clickeado
                    const esPrimeraFila = index === 0;

                    return (
                      <tr
                        key={`${detalleActivo.periodo}-${index}`}
                        ref={esPrimeraFila ? filaSeleccionadaRef : null}
                        style={{
                          backgroundColor: esPrimeraFila ? '#fff3cd' : undefined,
                          fontWeight: esPrimeraFila ? 'bold' : undefined,
                        }}
                      >
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
