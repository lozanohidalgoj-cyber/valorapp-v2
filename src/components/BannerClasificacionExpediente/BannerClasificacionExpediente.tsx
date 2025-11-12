/**
 * Componente: Banner de Clasificación del Expediente
 * Muestra la clasificación global del expediente en un banner destacado
 */

import type { ResultadoClasificacionExpediente } from '../../types';
import './BannerClasificacionExpediente.css';

interface BannerClasificacionExpedienteProps {
  resultado: ResultadoClasificacionExpediente;
  onIrInicio?: () => void;
}

export const BannerClasificacionExpediente = ({
  resultado,
  onIrInicio,
}: BannerClasificacionExpedienteProps) => {
  // Determinar clase CSS según clasificación
  const obtenerClaseClasificacion = (): string => {
    switch (resultado.clasificacion) {
      case 'Descenso sostenido':
        return 'banner-clasificacion--descenso-sostenido';
      case 'Anomalía indeterminada':
        return 'banner-clasificacion--anomalia-indeterminada';
      case 'No objetivo por cambio de potencia':
        return 'banner-clasificacion--cambio-potencia';
      case 'No anomalía - 0 esperado':
        return 'banner-clasificacion--cero-esperado';
      case 'Consumo bajo con picos':
        return 'banner-clasificacion--bajo-con-picos';
      case 'Sin anomalía':
        return 'banner-clasificacion--sin-anomalia';
      default:
        return 'banner-clasificacion--neutral';
    }
  };

  // Determinar ícono según clasificación
  const obtenerIcono = (): string => {
    switch (resultado.clasificacion) {
      case 'Descenso sostenido':
        return '🚨';
      case 'Anomalía indeterminada':
        return '⚠️';
      case 'No objetivo por cambio de potencia':
        return '🔧';
      case 'No anomalía - 0 esperado':
        return '🏖️';
      case 'Consumo bajo con picos':
        return '📉';
      case 'Sin anomalía':
        return '✅';
      default:
        return '📊';
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha: Date | null): string => {
    if (!fecha) return '-';
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
    }).format(fecha);
  };

  return (
    <div className={`banner-clasificacion ${obtenerClaseClasificacion()}`}>
      <div className="banner-clasificacion__header">
        <span className="banner-clasificacion__icono">{obtenerIcono()}</span>
        <h2 className="banner-clasificacion__titulo">{resultado.clasificacion}</h2>
      </div>

      {/* Mostrar inicio de anomalía cuando esté disponible para más clasificaciones */}
      {[
        'Descenso sostenido',
        'Anomalía indeterminada',
        'No objetivo por cambio de potencia',
        'Consumo bajo con picos',
      ].includes(resultado.clasificacion) &&
        resultado.inicioPeriodoAnomalia && (
          <div className="banner-clasificacion__inicio">
            <div className="banner-clasificacion__inicio-info">
              <span className="banner-clasificacion__label">Inicio de anomalía:</span>
              <span className="banner-clasificacion__valor">
                {formatearFecha(resultado.inicioFechaAnomalia)} ({resultado.inicioPeriodoAnomalia})
              </span>
            </div>

            {resultado.consumoPrevio && resultado.consumoInicio && (
              <div className="banner-clasificacion__consumos">
                <div className="banner-clasificacion__consumo">
                  <span className="banner-clasificacion__consumo-label">Consumo previo:</span>
                  <span className="banner-clasificacion__consumo-valor">
                    {resultado.consumoPrevio.toFixed(0)} kWh
                  </span>
                </div>
                <span className="banner-clasificacion__flecha">→</span>
                <div className="banner-clasificacion__consumo">
                  <span className="banner-clasificacion__consumo-label">Al inicio:</span>
                  <span className="banner-clasificacion__consumo-valor banner-clasificacion__consumo-valor--anomalo">
                    {resultado.consumoInicio.toFixed(0)} kWh
                  </span>
                </div>
                {resultado.variacionInicio && (
                  <div className="banner-clasificacion__variacion">
                    <span className="banner-clasificacion__variacion-valor">
                      {resultado.variacionInicio > 0 ? '+' : ''}
                      {resultado.variacionInicio.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {onIrInicio && (
              <button className="banner-clasificacion__btn-ir" onClick={onIrInicio}>
                📍 Ir al inicio de la anomalía
              </button>
            )}
          </div>
        )}

      <div className="banner-clasificacion__estadisticas">
        <div className="banner-clasificacion__estadistica">
          <span className="banner-clasificacion__estadistica-label">Periodos con anomalía:</span>
          <span className="banner-clasificacion__estadistica-valor">
            {resultado.periodosConAnomalia}
          </span>
        </div>

        {resultado.cambiosPotencia > 0 && (
          <div className="banner-clasificacion__estadistica">
            <span className="banner-clasificacion__estadistica-label">Cambios de potencia:</span>
            <span className="banner-clasificacion__estadistica-valor">
              {resultado.cambiosPotencia}
            </span>
          </div>
        )}

        {resultado.periodosConCeroEsperado > 0 && (
          <div className="banner-clasificacion__estadistica">
            <span className="banner-clasificacion__estadistica-label">
              Periodos con cero esperado:
            </span>
            <span className="banner-clasificacion__estadistica-valor">
              {resultado.periodosConCeroEsperado}
            </span>
          </div>
        )}
      </div>

      {resultado.detalle.length > 0 && (
        <details className="banner-clasificacion__detalle">
          <summary className="banner-clasificacion__detalle-titulo">
            Ver detalles de la clasificación
          </summary>
          <ul className="banner-clasificacion__detalle-lista">
            {resultado.detalle.map((item: string, index: number) => (
              <li key={index} className="banner-clasificacion__detalle-item">
                {item}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
};
