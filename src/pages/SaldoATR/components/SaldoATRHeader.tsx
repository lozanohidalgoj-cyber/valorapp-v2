/**
 * Header de SaldoATR con navegación
 * Memoizado para evitar re-renders innecesarios
 */

import { memo } from 'react';
import { ArrowLeft } from 'lucide-react';

interface SaldoATRHeaderProps {
  onVolver: () => void;
}

const SaldoATRHeaderComponent = ({ onVolver }: SaldoATRHeaderProps) => {
  return (
    <div className="saldoatr-header">
      <button className="saldoatr-back" onClick={onVolver}>
        <ArrowLeft size={18} /> Volver
      </button>
      <h1>Interfaz Saldo ATR</h1>
      <div />
    </div>
  );
};

export const SaldoATRHeader = memo(SaldoATRHeaderComponent);
