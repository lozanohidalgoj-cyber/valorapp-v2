/**
 * Vista de gráfico de evolución mensual
 */

import { Download } from 'lucide-react';
import type { ConsumoMensual } from '../../../types';

interface VistaGraficoProps {
  comparativaMensual: ConsumoMensual[];
  onExportar: () => void;
}

const formatearNumero = (numero: number, decimales: number = 0): string => {
  return numero.toLocaleString('es-ES', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
};

export const VistaGrafico = ({ comparativaMensual, onExportar }: VistaGraficoProps) => {
  const consumos = comparativaMensual.map((d) => d.consumoTotal);
  const maxConsumo = Math.max(...consumos);
  const minConsumo = Math.min(...consumos);
  const promedioConsumo = consumos.reduce((acc, val) => acc + val, 0) / consumos.length;

  return (
    <div className="expediente-grafico-wrapper">
      <div className="grafico-header">
        <h3>📈 Evolución del Consumo Mensual</h3>
        <p>Gráfico de tendencia con detección de anomalías</p>
      </div>

      <div className="grafico-container">
        <svg width="100%" height="400" className="grafico-svg">
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#0000D0', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#0000D0', stopOpacity: 0 }} />
            </linearGradient>
          </defs>

          {(() => {
            const rango = maxConsumo - minConsumo || 1;
            const width = 100;
            const height = 80;
            const padding = 10;

            const puntos = comparativaMensual.map((mes, index) => {
              const x = padding + (index / (consumos.length - 1)) * (width - 2 * padding);
              const y =
                height -
                padding -
                ((mes.consumoTotal - minConsumo) / rango) * (height - 2 * padding);
              return { x, y, mes };
            });

            const lineaPath = puntos
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
              .join(' ');

            const areaPath = `M ${padding} ${height - padding} L ${puntos.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${width - padding} ${height - padding} Z`;

            return (
              <g>
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  preserveAspectRatio="none"
                  width="100%"
                  height="100%"
                >
                  <path d={areaPath} fill="url(#areaGradient)" />
                  <path
                    d={lineaPath}
                    fill="none"
                    stroke="#0000D0"
                    strokeWidth="0.5"
                    strokeLinejoin="round"
                  />
                  {puntos.map((punto, i) => (
                    <g key={i}>
                      <circle
                        cx={punto.x}
                        cy={punto.y}
                        r={punto.mes.esAnomalia ? 1 : 0.5}
                        fill={punto.mes.esAnomalia ? '#FF3184' : '#0000D0'}
                        stroke="#ffffff"
                        strokeWidth="0.2"
                      />
                      {punto.mes.esAnomalia && (
                        <circle
                          cx={punto.x}
                          cy={punto.y}
                          r={2}
                          fill="none"
                          stroke="#FF3184"
                          strokeWidth="0.3"
                          opacity="0.5"
                        />
                      )}
                    </g>
                  ))}
                </svg>
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="grafico-stats">
        <div className="stat-card">
          <span className="stat-label">📊 Máximo</span>
          <span className="stat-value">{formatearNumero(maxConsumo)} kWh</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">📉 Mínimo</span>
          <span className="stat-value">{formatearNumero(minConsumo)} kWh</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">📈 Promedio</span>
          <span className="stat-value">{formatearNumero(promedioConsumo)} kWh</span>
        </div>
        <div className="stat-card anomalia-card">
          <span className="stat-label">⚠️ Anomalías</span>
          <span className="stat-value">
            {comparativaMensual.filter((m) => m.esAnomalia).length}
          </span>
        </div>
      </div>

      <div className="grafico-leyenda">
        <div className="leyenda-item">
          <div className="leyenda-icono" style={{ backgroundColor: '#0000D0' }}></div>
          <span>Consumo Normal</span>
        </div>
        <div className="leyenda-item">
          <div className="leyenda-icono" style={{ backgroundColor: '#FF3184' }}></div>
          <span>Anomalía Detectada (±40%)</span>
        </div>
      </div>

      <div className="expediente-export-buttons expediente-export-bottom">
        <button
          className="btn-export btn-export-complete"
          onClick={onExportar}
          title="Exportar análisis completo"
        >
          <Download size={16} />
          Exportar Análisis Completo
        </button>
      </div>
    </div>
  );
};
