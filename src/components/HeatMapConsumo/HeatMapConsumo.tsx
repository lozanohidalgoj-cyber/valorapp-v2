/**
 * 🔥 Heat Map de Consumo Mensual
 * Visualización con degradado rojo → amarillo → verde
 * - Rojo: Consumos mínimos
 * - Amarillo: Consumos promedio (percentil 50)
 * - Verde: Consumos máximos
 */

import { useMemo, useEffect, useRef, useState } from 'react';
import type { ConsumoMensual } from '../../types';
import './HeatMapConsumo.css';

interface HeatMapConsumoProps {
  datos: ConsumoMensual[];
}

/**
 * Formatea número con separadores de miles
 */
const formatearNumero = (numero: number, decimales: number = 0): string => {
  return numero.toLocaleString('es-ES', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  });
};

/**
 * Calcula el color del heat map basado en el valor
 * Rojo (mínimo) → Amarillo (percentil 50) → Verde (máximo)
 */
const calcularColorHeatMap = (valor: number, min: number, max: number): string => {
  const rango = max - min;
  if (rango === 0) return 'rgb(255, 255, 0)';
  
  const normalizado = (valor - min) / rango;
  
  let r, g, b;
  
  if (normalizado <= 0.5) {
    // Rojo → Amarillo (0 a 0.5)
    const t = normalizado * 2;
    r = 255;
    g = Math.round(255 * t);
    b = 0;
  } else {
    // Amarillo → Verde (0.5 a 1)
    const t = (normalizado - 0.5) * 2;
    r = Math.round(255 * (1 - t));
    g = 255;
    b = 0;
  }
  
  return `rgb(${r}, ${g}, ${b})`;
};

export const HeatMapConsumo = ({ datos }: HeatMapConsumoProps) => {
  // Escalado automático para encajar en el viewport sin scroll vertical
  const containerRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current || !matrixRef.current) return;
      const cRect = containerRef.current.getBoundingClientRect();
  const availableHeight = window.innerHeight - cRect.top - 12; // margen inferior de seguridad
  const availableWidth = cRect.width - 12; // pequeño margen lateral
      const contentHeight = matrixRef.current.scrollHeight;
      const contentWidth = matrixRef.current.scrollWidth;
    const heightScale = availableHeight / contentHeight;
    const widthScale = availableWidth / contentWidth;
    // Se toma el menor de ambos para evitar desbordes. Se habilita ligero upscale hasta 1.15.
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
  // Calcular min y max del consumo total
  const { minConsumo, maxConsumo, promedioConsumo } = useMemo(() => {
    if (datos.length === 0) return { minConsumo: 0, maxConsumo: 0, promedioConsumo: 0 };

    const consumos = datos.map(d => d.consumoTotal);
    const suma = consumos.reduce((acc, val) => acc + val, 0);

    return {
      minConsumo: Math.min(...consumos),
      maxConsumo: Math.max(...consumos),
      promedioConsumo: suma / consumos.length
    };
  }, [datos]);

  // Estructuras auxiliares
  const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const años = useMemo(() => Array.from(new Set(datos.map(d => d.año))).sort((a, b) => a - b), [datos]);

  // Mapa rápido para buscar mes por año y mes
  const mapaPorPeriodo = useMemo(() => {
    const m = new Map<string, ConsumoMensual>();
    datos.forEach(d => m.set(`${d.año}-${d.mes}`, d));
    return m;
  }, [datos]);

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
  <div className="matrix-scale" style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
          <div className="heatmap-matrix heatmap-matrix--integrated" ref={matrixRef}>
            {/* Fila superior integrada: título + chips + leyendas */}
            <div className="matrix-integrated-header" style={{ gridColumn: '1 / span 13' }}>
              <div className="integrated-row">
                <h3 className="heatmap-title integrated-title">🔥 Mapa de Calor</h3>
                <div className="integrated-chips">
                  <div className="heatmap-chip"><span className="chip-label">📊 Promedio</span><span className="chip-value">{formatearNumero(promedioConsumo)} kWh</span></div>
                  <div className="heatmap-chip"><span className="chip-label">📉 Mínimo</span><span className="chip-value">{formatearNumero(minConsumo)} kWh</span></div>
                  <div className="heatmap-chip"><span className="chip-label">📈 Máximo</span><span className="chip-value">{formatearNumero(maxConsumo)} kWh</span></div>
                  <div className="heatmap-chip heatmap-chip--anomalia"><span className="chip-label">⚠️ Anomalías</span><span className="chip-value">{datos.filter(d => d.esAnomalia).length}</span></div>
                </div>
              </div>
              <div className="integrated-row legend-variacion-inline">
                <span className="legend-inline-title">📊 Código de Colores - Variación:</span>
                <div className="legend-inline-items">
                  <span className="legend-inline-item"><span className="legend-inline-box" style={{ background:'#66bb6a' }}></span>Estable (±5%)</span>
                  <span className="legend-inline-item"><span className="legend-inline-box" style={{ background:'#ffca28' }}></span>Leve (5-10%)</span>
                  <span className="legend-inline-item"><span className="legend-inline-box" style={{ background:'#ffa726' }}></span>Moderada (10-20%)</span>
                  <span className="legend-inline-item"><span className="legend-inline-box" style={{ background:'#ff5722' }}></span>Alta (20-40%)</span>
                  <span className="legend-inline-item"><span className="legend-inline-box" style={{ background:'#ff1744' }}></span>⚠️ &gt;40%</span>
                  <span className="legend-inline-item intensity-inline"><span className="legend-inline-bar" style={{ background:'linear-gradient(to right, rgb(255,0,0), rgb(255,255,0), rgb(0,255,0))' }}></span> Intensidad: Bajo → Medio → Alto</span>
                </div>
              </div>
            </div>
            {/* Celda vacía esquina superior izquierda debajo del header integrado */}
            <div className="matrix-corner"></div>
            {/* Encabezados de meses */}
            {nombresMeses.map((m, idx) => (
              <div key={`h-${idx}`} className="matrix-header-month">{m}</div>
            ))}
            {/* Filas por año */}
            {años.map((año) => (
              <>
                <div key={`yl-${año}`} className="matrix-year-label">{año}</div>
                {Array.from({ length: 12 }, (_, i) => {
                  const mes = i + 1;
                  const dato = mapaPorPeriodo.get(`${año}-${mes}`);
                  if (!dato) {
                    return (
                      <div key={`c-${año}-${mes}`} className="matrix-cell matrix-empty">-</div>
                    );
                  }
                  const color = calcularColorHeatMap(dato.consumoTotal, minConsumo, maxConsumo);
                  const esAnomalia = dato.esAnomalia;
                  return (
                    <div
                      key={`c-${año}-${mes}`}
                      className={`matrix-cell matrix-value ${esAnomalia ? 'matrix-anomalia' : ''}`}
                      style={{ backgroundColor: color }}
                      title={`${nombresMeses[mes - 1]} ${año}\n${formatearNumero(dato.consumoTotal)} kWh\n${dato.dias} días\n${formatearNumero(dato.consumoPromedioDiario, 1)} kWh/día${esAnomalia ? '\n⚠️ ANOMALÍA DETECTADA' : ''}`}
                    >
                      <span className="matrix-consumo">{formatearNumero(dato.consumoTotal)}</span>
                      {esAnomalia && <span className="matrix-alert">⚠️</span>}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
