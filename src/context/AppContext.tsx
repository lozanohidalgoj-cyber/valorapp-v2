/**
 * 🌐 Contexto Global de la Aplicación
 * 
 * Contexto React para gestionar el estado global de ValorApp_v2
 * incluyendo datos de consumo, anomalías y configuración.
 */

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { EstadoApp, ConsumoEnergetico, Anomalia } from '../types';

// ============================================
// 📦 Definición del Contexto
// ============================================

interface AppContextType extends EstadoApp {
  /** Carga datos de consumo en el estado global */
  cargarConsumos: (consumos: ConsumoEnergetico[]) => void;
  /** Establece las anomalías detectadas */
  establecerAnomalias: (anomalias: Anomalia[]) => void;
  /** Cambia el periodo seleccionado */
  seleccionarPeriodo: (periodo: string | null) => void;
  /** Establece el estado de procesamiento */
  establecerProcesando: (procesando: boolean) => void;
  /** Establece un mensaje de error */
  establecerError: (error: string | null) => void;
  /** Limpia todos los datos */
  limpiarDatos: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ============================================
// 🎯 Estado Inicial
// ============================================

const estadoInicial: EstadoApp = {
  consumos: [],
  anomalias: [],
  periodoSeleccionado: null,
  datosCargados: false,
  procesando: false,
  error: null
};

// ============================================
// 🔧 Provider del Contexto
// ============================================

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [estado, setEstado] = useState<EstadoApp>(estadoInicial);

  const cargarConsumos = (consumos: ConsumoEnergetico[]) => {
    setEstado(prev => ({
      ...prev,
      consumos,
      datosCargados: consumos.length > 0,
      error: null
    }));
  };

  const establecerAnomalias = (anomalias: Anomalia[]) => {
    setEstado(prev => ({
      ...prev,
      anomalias
    }));
  };

  const seleccionarPeriodo = (periodo: string | null) => {
    setEstado(prev => ({
      ...prev,
      periodoSeleccionado: periodo
    }));
  };

  const establecerProcesando = (procesando: boolean) => {
    setEstado(prev => ({
      ...prev,
      procesando
    }));
  };

  const establecerError = (error: string | null) => {
    setEstado(prev => ({
      ...prev,
      error,
      procesando: false
    }));
  };

  const limpiarDatos = () => {
    setEstado(estadoInicial);
  };

  const value: AppContextType = {
    ...estado,
    cargarConsumos,
    establecerAnomalias,
    seleccionarPeriodo,
    establecerProcesando,
    establecerError,
    limpiarDatos
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ============================================
// 🪝 Hook Personalizado
// ============================================

/**
 * Hook para acceder al contexto de la aplicación
 * @returns Contexto de la aplicación
 * @throws Error si se usa fuera del AppProvider
 */
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext debe usarse dentro de un AppProvider');
  }
  
  return context;
};
