/**
 * Vista de gráfico de evolución mensual
 */

import { useMemo } from 'react';
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

const obtenerEtiquetaMes = (periodo: string): string => {
  const [año, mes] = periodo.split('-').map(Number);
  if (!año || !mes) {
    return periodo;
  }

  const fecha = new Date(año, mes - 1, 1);
  return fecha.toLocaleDateString('es-ES', {
    month: 'short',
    year: '2-digit',
  });
};

export const VistaGrafico = ({ comparativaMensual, onExportar }: VistaGraficoProps) => {
  const datosVacios = comparativaMensual.length === 0;

  const gradientId = useMemo(() => `grafico-area-${Math.random().toString(36).slice(2, 9)}`, []);

  const { maxConsumo, minConsumo, promedioConsumo, totalAnomalias, totalMeses, graficoConfig } =
    useMemo(() => {
      if (comparativaMensual.length === 0) {
        return {
          maxConsumo: 0,
          minConsumo: 0,
          promedioConsumo: 0,
          totalAnomalias: 0,
          totalMeses: 0,
          graficoConfig: null,
        };
      }

      const consumos = comparativaMensual.map((d) => d.consumoTotal);
      const maximo = Math.max(...consumos);
      const minimo = Math.min(...consumos);
      const promedio = consumos.reduce((acc, val) => acc + val, 0) / consumos.length;
      const anomaliasDetectadas = comparativaMensual.filter((m) => m.esAnomalia).length;
      const meses = comparativaMensual.length;

      const rango = Math.max(maximo - minimo, 1);
      const width = 120;
      const height = 80;
      const paddingX = 14;
      const paddingY = 16;
      const areaHeight = height - paddingY * 2;
      const safeLength = Math.max(comparativaMensual.length - 1, 1);

      const puntos = comparativaMensual.map((mes, index) => {
        const avanceX = comparativaMensual.length === 1 ? 0.5 : index / safeLength;
        const x = paddingX + avanceX * (width - paddingX * 2);
        const valorNormalizado = (mes.consumoTotal - minimo) / rango;
        const y = height - paddingY - valorNormalizado * areaHeight;
        return {
          x,
          y,
          mes,
          etiqueta: obtenerEtiquetaMes(mes.periodo),
        };
      });

      const lineaPath = puntos.reduce((acumulado, punto, indice) => {
        const comando = indice === 0 ? 'M' : 'L';
        return `${acumulado} ${comando} ${punto.x} ${punto.y}`.trim();
      }, '');

      const areaPath = [
        `M ${puntos[0]?.x ?? paddingX} ${height - paddingY}`,
        ...puntos.map((p) => `L ${p.x} ${p.y}`),
        `L ${puntos[puntos.length - 1]?.x ?? width - paddingX} ${height - paddingY}`,
        'Z',
      ].join(' ');

      const promedioY = height - paddingY - ((promedio - minimo) / rango) * areaHeight;

      const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const valor = minimo + ratio * (maximo - minimo);
        const y = height - paddingY - ratio * areaHeight;
        return { y, valor };
      });

      return {
        maxConsumo: maximo,
        minConsumo: minimo,
        promedioConsumo: promedio,
        totalAnomalias: anomaliasDetectadas,
        totalMeses: meses,
        graficoConfig: {
          width,
          height,
          paddingX,
          paddingY,
          puntos,
          lineaPath,
          areaPath,
          promedioY,
          gridLines,
        },
      };
    }, [comparativaMensual]);

  if (datosVacios || !graficoConfig) {
    return (
      <div className="expediente-grafico-wrapper expediente-grafico-wrapper--empty">
        <div className="grafico-header">
          <h3>📈 Evolución del Consumo Mensual</h3>
          <p>
            No hay datos suficientes para construir el gráfico. Importa un archivo para comenzar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="expediente-grafico-wrapper">
      <div className="grafico-header">
        <div>
          <h3>📈 Evolución del Consumo Mensual</h3>
          <p>Tendencia de consumo activo con referencia al promedio y anomalías destacadas</p>
        </div>
        <span className="grafico-tag" aria-label={`Meses analizados: ${totalMeses}`}>
          {totalMeses} meses
        </span>
      </div>

      <div className="grafico-container">
        <svg
          className="grafico-svg"
          role="img"
          aria-label="Gráfico de evolución del consumo mensual"
          viewBox={`0 0 ${graficoConfig.width} ${graficoConfig.height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {graficoConfig.gridLines.map((linea, indice) => (
            <g key={`grid-${indice}`} className="grafico-grid">
              <line
                x1={graficoConfig.paddingX}
                y1={linea.y}
                x2={graficoConfig.width - graficoConfig.paddingX}
                y2={linea.y}
                className="grafico-grid-line"
              />
              <text
                x={graficoConfig.paddingX - 2}
                y={linea.y + 1.5}
                className="grafico-grid-label"
                textAnchor="end"
              >
                {formatearNumero(linea.valor)} kWh
              </text>
            </g>
          ))}

          <line
            x1={graficoConfig.paddingX}
            y1={graficoConfig.promedioY}
            x2={graficoConfig.width - graficoConfig.paddingX}
            y2={graficoConfig.promedioY}
            className="grafico-promedio-line"
          />
          <text
            x={graficoConfig.width - graficoConfig.paddingX}
            y={graficoConfig.promedioY - 1.5}
            className="grafico-promedio-label"
            textAnchor="end"
          >
            Promedio {formatearNumero(promedioConsumo)} kWh
          </text>

          <path d={graficoConfig.areaPath} className="grafico-area" fill={`url(#${gradientId})`} />
          <path d={graficoConfig.lineaPath} className="grafico-line" fill="none" />

          {graficoConfig.puntos.map((punto, indice) => (
            <g key={`${punto.mes.periodo}-${indice}`} className="grafico-punto-grupo">
              <circle
                className={`grafico-punto ${punto.mes.esAnomalia ? 'grafico-punto--anomalia' : ''}`}
                cx={punto.x}
                cy={punto.y}
                r={punto.mes.esAnomalia ? 1.2 : 0.8}
              >
                <title>{`${punto.etiqueta}: ${formatearNumero(punto.mes.consumoTotal)} kWh`}</title>
              </circle>
              {punto.mes.esAnomalia && (
                <circle className="grafico-punto-onda" cx={punto.x} cy={punto.y} r={2.6} />
              )}
            </g>
          ))}

          <line
            x1={graficoConfig.paddingX}
            y1={graficoConfig.height - graficoConfig.paddingY}
            x2={graficoConfig.width - graficoConfig.paddingX}
            y2={graficoConfig.height - graficoConfig.paddingY}
            className="grafico-eje-base"
          />
        </svg>
      </div>

      <div className="grafico-eje-x" role="presentation">
        {graficoConfig.puntos.map((punto) => (
          <span
            key={`label-${punto.mes.periodo}`}
            className={`grafico-eje-x-item ${punto.mes.esAnomalia ? 'grafico-eje-x-item--anomalia' : ''}`}
          >
            <strong>{punto.etiqueta}</strong>
            <small>{formatearNumero(punto.mes.consumoTotal)} kWh</small>
          </span>
        ))}
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
          <span className="stat-value">{totalAnomalias}</span>
        </div>
      </div>

      <div className="grafico-leyenda">
        <div className="leyenda-item">
          <span className="leyenda-icono leyenda-icono--normal" aria-hidden="true" />
          <span>Consumo normal</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-icono leyenda-icono--anomalia" aria-hidden="true" />
          <span>Anomalía detectada (±40%)</span>
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
