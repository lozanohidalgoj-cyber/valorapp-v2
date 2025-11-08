/**
 * 🗂️ Componente de Pestañas de Vista
 * Navegación entre diferentes vistas del análisis
 */

import type { VistaAnalisis } from '../types';

interface TabsVistaProps {
  vistaActual: VistaAnalisis;
  onCambiarVista: (vista: VistaAnalisis) => void;
}

export const TabsVista = ({ vistaActual, onCambiarVista }: TabsVistaProps) => {
  const tabs: Array<{ id: VistaAnalisis; label: string; icon: string }> = [
    { id: 'anual', label: 'Vista por Años', icon: '📊' },
    { id: 'mensual', label: 'Comparativa Mensual', icon: '📅' },
    { id: 'listado', label: 'Listado', icon: '📋' },
    { id: 'grafico', label: 'Gráfico', icon: '📈' },
  ];

  return (
    <div className="expediente-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`expediente-tab ${vistaActual === tab.id ? 'active' : ''}`}
          onClick={() => onCambiarVista(tab.id)}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
};
