/**
 * 🔌 Módulo WART - Verificación de Anomalías de Carga
 *
 * Interfaz para verificar dos condiciones críticas en la detección de WART:
 * 1. Diferencia de tiempo entre carga y WART ≤ 1 minuto
 * 2. Diferencia de carga real (acometida - contador) > 0.5 kW
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Wart.css';

interface WartState {
  check1: boolean;
  check2: boolean;
}

export const Wart = () => {
  const navigate = useNavigate();
  const [checks, setChecks] = useState<WartState>({
    check1: false,
    check2: false,
  });

  const handleCheckChange = (checkId: keyof WartState) => {
    setChecks((prev) => ({
      ...prev,
      [checkId]: !prev[checkId],
    }));
  };

  const ambosChequeos = checks.check1 && checks.check2;

  const handleVolver = () => {
    navigate('/averia');
  };

  const handleContinuar = () => {
    if (ambosChequeos) {
      // TODO: Implementar navegación al siguiente paso
    }
  };

  return (
    <div className="wart-container">
      <div className="wart-content">
        <div className="wart-header">
          <h1 className="wart-title">Módulo WART</h1>
          <p className="wart-subtitle">Antes de continuar recuerde revisar:</p>
        </div>

        <div className="wart-card">
          <div className="wart-check-item">
            <input
              type="checkbox"
              id="check1"
              checked={checks.check1}
              onChange={() => handleCheckChange('check1')}
            />
            <label htmlFor="check1" className="wart-check-label">
              <p className="wart-check-title">
                La diferencia de tiempo entre carga y WART es menor o igual a un
                minuto
              </p>
              <p className="wart-check-description">
                Verifica que el tiempo transcurrido sea ≤ 60 segundos
              </p>
            </label>
          </div>

          <div className="wart-separator"></div>

          <div className="wart-check-item">
            <input
              type="checkbox"
              id="check2"
              checked={checks.check2}
              onChange={() => handleCheckChange('check2')}
            />
            <div className="wart-check-label">
              <p className="wart-check-title">
                La resta de la carga real en acometida y la carga real en
                contador es mayor a 0,5
              </p>
              <p className="wart-check-description">
                (Carga Acometida - Carga Contador) &gt; 0.5 kW
              </p>
            </div>
          </div>
        </div>

        <div className="wart-footer">
          <button
            onClick={handleVolver}
            className="wart-back-btn"
            title="Volver a la interfaz anterior"
          >
            <ArrowLeft size={20} />
            <span>Volver</span>
          </button>

          <button
            onClick={handleContinuar}
            disabled={!ambosChequeos}
            className="wart-continue-btn"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};
