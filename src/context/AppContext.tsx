/**
 * 🌐 Proveedor del Contexto Global - AppProvider
 *
 * Gestiona el estado global de la aplicación usando React Context.
 * Centraliza el estado de consumos, anomalías y operaciones globales.
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import { AppContext, type AppContextType } from './AppContextDefinition';
import type { EstadoApp, ConsumoEnergetico, Anomalia } from '../types';

export type { AppContextType } from './AppContextDefinition';

const estadoInicial: EstadoApp = {
  consumos: [],
  anomalias: [],
  periodoSeleccionado: null,
  datosCargados: false,
  procesando: false,
  error: null,
};

interface AppProviderProps {
  children: ReactNode;
}

/**
 * Proveedor del contexto global de la aplicación
 */
export const AppProvider = ({ children }: AppProviderProps) => {
  const [estado, setEstado] = useState<EstadoApp>(estadoInicial);

  const cargarConsumos = (consumos: ConsumoEnergetico[]) => {
    setEstado((prev) => ({
      ...prev,
      consumos,
      datosCargados: consumos.length > 0,
      error: null,
    }));
  };

  const establecerAnomalias = (anomalias: Anomalia[]) => {
    setEstado((prev) => ({
      ...prev,
      anomalias,
    }));
  };

  const seleccionarPeriodo = (periodo: string | null) => {
    setEstado((prev) => ({
      ...prev,
      periodoSeleccionado: periodo,
    }));
  };

  const establecerProcesando = (procesando: boolean) => {
    setEstado((prev) => ({
      ...prev,
      procesando,
    }));
  };

  const establecerError = (error: string | null) => {
    setEstado((prev) => ({
      ...prev,
      error,
      procesando: false,
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
    limpiarDatos,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
