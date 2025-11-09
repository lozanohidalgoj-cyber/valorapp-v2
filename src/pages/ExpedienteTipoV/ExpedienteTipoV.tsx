/**
 * Análisis de Expediente Tipo V - Refactorizado
 * Componente container que orquesta el flujo de importación, análisis y visualización
 * Reducido de 654 líneas a menos de 200 mediante extracción de hooks y componentes
 */

import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import {
  exportarVistaAnualExcel,
  exportarComparativaMensualExcel,
  exportarAnalisisCompleto,
} from '../../services/exportacionService';
import {
  guardarDerivacionData,
  recuperarDerivacionData,
  hayDatosGuardados,
  limpiarDatosGuardados,
} from '../../services/persistenciaService';
import { HeatMapConsumo } from '../../components';
import {
  AlertMessages,
  FileUploadSection,
  AnalysisHeader,
  VistaListado,
  VistaGrafico,
  VistaAnual,
  DataTable,
} from './components';
import { useFileLoader, useAnalysis } from './hooks';
import type { DerivacionData, ConsumoAnual, ConsumoMensual } from '../../types';
import './ExpedienteTipoV.css';

export const ExpedienteTipoV = () => {
  const navigate = useNavigate();

  // Hooks personalizados para manejo de estado
  const {
    data: derivacionData,
    columns: derivacionColumns,
    loaded: derivacionLoaded,
    error: fileError,
    loadFile,
    resetData,
    setData,
    setLoaded,
  } = useFileLoader();

  const {
    resultado: resultadoAnalisis,
    mostrandoAnalisis,
    vistaActual,
    analisisHabilitado: analisisConsumoHabilitado,
    ejecutarAnalisis,
    cambiarVista: setVistaActual,
    habilitarAnalisis: setAnalisisConsumoHabilitado,
    resetAnalisis,
  } = useAnalysis();

  // Estado local para mensajes
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Recuperar datos guardados al montar
  useEffect(() => {
    if (hayDatosGuardados()) {
      const datosGuardados = recuperarDerivacionData();
      if (datosGuardados && datosGuardados.length > 0) {
        setData(datosGuardados, Object.keys(datosGuardados[0] || {}));
        setLoaded(true);
        setAnalisisConsumoHabilitado();
        setSuccessMessage(
          `✅ Se recuperaron ${datosGuardados.length} registros guardados anteriormente`
        );
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    }
  }, [setData, setLoaded, setAnalisisConsumoHabilitado]);

  // Guardar datos cuando cambian
  useEffect(() => {
    if (derivacionLoaded && derivacionData.length > 0) {
      guardarDerivacionData(derivacionData);
    }
  }, [derivacionData, derivacionLoaded]);

  // Handlers
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMessage(null);

    try {
      await loadFile(file);
      setSuccessMessage(`✅ Archivo "${file.name}" cargado exitosamente`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(
        `Error al cargar el archivo: ${err instanceof Error ? err.message : 'Error desconocido'}`
      );
    }
  };

  const handleAnularFC = () => {
    const palabrasClaveExcluir = ['ANULADA', 'ANULADOR', 'COMPLEMENTARIA', 'SUSTITUIDA'];

    let registrosExcluidos = 0;

    const datosFiltrados = derivacionData.filter((row) => {
      const estadoOriginal = (
        (row as unknown as Record<string, unknown>)['Estado de la factura'] || ''
      ).toString();
      const estadoNormalizado = estadoOriginal.trim().toUpperCase();

      if (palabrasClaveExcluir.some((p) => estadoNormalizado.includes(p))) {
        registrosExcluidos++;
        return false;
      }

      return true;
    });

    const datosOrdenados = datosFiltrados.sort((a, b) => {
      const fechaA = new Date((a as unknown as Record<string, unknown>)['Fecha desde'] as string);
      const fechaB = new Date((b as unknown as Record<string, unknown>)['Fecha desde'] as string);
      return fechaA.getTime() - fechaB.getTime();
    });

    setData(datosOrdenados, derivacionColumns);
    setAnalisisConsumoHabilitado();

    try {
      const exito = ejecutarAnalisis(datosOrdenados as DerivacionData[], 'mensual');
      if (exito) {
        setSuccessMessage(
          `✅ Filtro aplicado y análisis ejecutado: ${datosOrdenados.length} facturas válidas, ${registrosExcluidos} excluidas`
        );
      }
    } catch {
      setError('Error al ejecutar el análisis tras el filtrado');
    }

    setTimeout(() => setSuccessMessage(null), 6000);
  };

  const handleAnalisisConsumo = () => {
    if (derivacionData.length === 0) {
      setError('No hay datos para analizar');
      return;
    }

    try {
      const exito = ejecutarAnalisis(derivacionData as DerivacionData[], 'anual');
      if (exito) {
        setSuccessMessage(
          `Análisis completado: ${resultadoAnalisis?.vistaAnual.length || 0} años procesados`
        );
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError('Error al realizar el análisis de consumo');
      }
    } catch {
      setError('Error al realizar el análisis de consumo');
    }
  };

  const handleExportarVistaAnual = () => {
    if (!resultadoAnalisis) return;
    try {
      exportarVistaAnualExcel(resultadoAnalisis.vistaAnual as ConsumoAnual[]);
      setSuccessMessage(' Vista por Años exportada exitosamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Error al exportar Vista por Años');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleExportarComparativaMensual = () => {
    if (!resultadoAnalisis) return;
    try {
      exportarComparativaMensualExcel(resultadoAnalisis.comparativaMensual as ConsumoMensual[]);
      setSuccessMessage(' Comparativa Mensual exportada exitosamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Error al exportar Comparativa Mensual');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleExportarAnalisisCompleto = () => {
    if (!resultadoAnalisis) return;
    try {
      exportarAnalisisCompleto(
        resultadoAnalisis.vistaAnual as ConsumoAnual[],
        resultadoAnalisis.comparativaMensual as ConsumoMensual[],
        derivacionData
      );
      setSuccessMessage(' Análisis completo exportado exitosamente (3 hojas)');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Error al exportar análisis completo');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleLimpiarDatosGuardados = () => {
    if (confirm('¿Está seguro de eliminar todos los datos guardados?')) {
      limpiarDatosGuardados();
      resetData();
      resetAnalisis();
      setSuccessMessage(' Datos eliminados correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleVolver = () => {
    navigate('/wart');
  };

  // Error combinado de hook y local
  const displayError = error || fileError;

  return (
    <div className="expediente-container">
      {/* Encabezado: Cambia según si hay datos cargados */}
      {!derivacionLoaded ? (
        <div className="expediente-header-section">
          <h1 className="expediente-header-title">Análisis de Expediente Tipo V</h1>
          <p className="expediente-header-subtitle">
            Importa los archivos necesarios para continuar con el análisis
          </p>
        </div>
      ) : (
        <AnalysisHeader
          analisisHabilitado={analisisConsumoHabilitado}
          registrosCargados={derivacionData.length}
          onAnalizar={handleAnalisisConsumo}
          onAnularFC={handleAnularFC}
          onVolver={handleVolver}
          onLimpiar={handleLimpiarDatosGuardados}
        />
      )}

      <div className="expediente-inner">
        <AlertMessages error={displayError} success={successMessage} />

        {!derivacionLoaded && !mostrandoAnalisis && (
          <div className="expediente-main-content">
            <FileUploadSection
              loaded={derivacionLoaded}
              onFileChange={handleFileChange}
              onClearData={handleLimpiarDatosGuardados}
            />
            <button onClick={() => navigate('/saldo-atr')} className="expediente-saldo-atr-btn">
              Saldo ATR
            </button>
          </div>
        )}

        {derivacionLoaded && !mostrandoAnalisis && (
          <div className="expediente-data-card">
            <DataTable data={derivacionData} columns={derivacionColumns} />
          </div>
        )}

        {mostrandoAnalisis && resultadoAnalisis && (
          <div className="expediente-analisis-container">
            {vistaActual !== 'mensual' && (
              <div className="expediente-analisis-resumen">
                <div className="analisis-resumen-card">
                  <span className="resumen-label">Total Consumo</span>
                  <span className="resumen-valor">
                    {resultadoAnalisis.resumen.consumoTotalGeneral.toFixed(2)} kWh
                  </span>
                </div>
                <div className="analisis-resumen-card">
                  <span className="resumen-label">Total Facturas</span>
                  <span className="resumen-valor">{resultadoAnalisis.resumen.totalFacturas}</span>
                </div>
                <div className="analisis-resumen-card">
                  <span className="resumen-label">Periodo</span>
                  <span className="resumen-valor">
                    {resultadoAnalisis.periodoTotal.fechaInicio} -{' '}
                    {resultadoAnalisis.periodoTotal.fechaFin}
                  </span>
                </div>
                <div className="analisis-resumen-card">
                  <span className="resumen-label">Promedio Anual</span>
                  <span className="resumen-valor">
                    {resultadoAnalisis.resumen.promedioAnual.toFixed(2)} kWh
                  </span>
                </div>
                <div className="analisis-resumen-card">
                  <span className="resumen-label">Anomalías Detectadas</span>
                  <span className="resumen-valor anomalia-badge">
                    {resultadoAnalisis.resumen.anomaliasDetectadas}
                  </span>
                </div>
              </div>
            )}

            <div className="expediente-tabs">
              <button
                className={`expediente-tab ${vistaActual === 'anual' ? 'active' : ''}`}
                onClick={() => setVistaActual('anual')}
              >
                Vista por Años
              </button>
              <button
                className={`expediente-tab ${vistaActual === 'mensual' ? 'active' : ''}`}
                onClick={() => setVistaActual('mensual')}
              >
                Comparativa Mensual
              </button>
              <button
                className={`expediente-tab ${vistaActual === 'listado' ? 'active' : ''}`}
                onClick={() => setVistaActual('listado')}
              >
                Listado
              </button>
              <button
                className={`expediente-tab ${vistaActual === 'grafico' ? 'active' : ''}`}
                onClick={() => setVistaActual('grafico')}
              >
                Gráfico
              </button>
            </div>

            {vistaActual === 'anual' && (
              <VistaAnual
                datos={resultadoAnalisis.vistaAnual as ConsumoAnual[]}
                onExportar={handleExportarVistaAnual}
              />
            )}

            {vistaActual === 'mensual' && (
              <div className="expediente-heatmap-section">
                <div className="expediente-heatmap-wrapper">
                  <HeatMapConsumo
                    datos={resultadoAnalisis.comparativaMensual as ConsumoMensual[]}
                    detallesPorPeriodo={resultadoAnalisis.detallesPorPeriodo}
                  />
                </div>
                <div className="expediente-export-buttons expediente-export-inline">
                  <button className="btn-export" onClick={handleExportarComparativaMensual}>
                    <Download size={16} />
                    Exportar Comparativa Mensual
                  </button>
                  <button
                    className="btn-export btn-export-complete"
                    onClick={handleExportarAnalisisCompleto}
                  >
                    <Download size={16} />
                    Exportar Análisis Completo
                  </button>
                </div>
              </div>
            )}

            {vistaActual === 'listado' && (
              <VistaListado data={derivacionData} columns={derivacionColumns} />
            )}

            {vistaActual === 'grafico' && (
              <VistaGrafico
                comparativaMensual={resultadoAnalisis.comparativaMensual as ConsumoMensual[]}
                onExportar={handleExportarAnalisisCompleto}
              />
            )}
          </div>
        )}

        {!derivacionLoaded && (
          <div className="expediente-footer">
            <button onClick={handleVolver} className="expediente-back-btn">
              <ArrowLeft size={20} />
              <span>Volver</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
