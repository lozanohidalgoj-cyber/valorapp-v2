/**
 * Análisis de Expediente Tipo V
 * Interfaz para importar y procesar datos de expedientes tipo V
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, AlertCircle, CheckCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { analizarConsumoCompleto, formatearNumero } from '../../services/analisisConsumoService';
import { 
  exportarVistaAnualExcel, 
  exportarComparativaMensualExcel, 
  exportarAnalisisCompleto 
} from '../../services/exportacionService';
import {
  guardarDerivacionData,
  recuperarDerivacionData,
  hayDatosGuardados,
  limpiarDatosGuardados
} from '../../services/persistenciaService';
import { HeatMapConsumo } from '../../components';
import type { DerivacionData, ResultadoAnalisis } from '../../types';
import './ExpedienteTipoV.css';

type VistaAnalisis = 'anual' | 'mensual' | 'listado' | 'grafico';

export const ExpedienteTipoV = () => {
  const navigate = useNavigate();
  const derivacionInputRef = useRef<HTMLInputElement>(null);
  
  const [derivacionData, setDerivacionData] = useState<DerivacionData[]>([]);
  const [derivacionColumns, setDerivacionColumns] = useState<string[]>([]);
  const [derivacionLoaded, setDerivacionLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [analisisConsumoHabilitado, setAnalisisConsumoHabilitado] = useState(false);
  const [resultadoAnalisis, setResultadoAnalisis] = useState<ResultadoAnalisis | null>(null);
  const [mostrandoAnalisis, setMostrandoAnalisis] = useState(false);
  const [vistaActual, setVistaActual] = useState<VistaAnalisis>('anual');

  useEffect(() => {
    if (hayDatosGuardados()) {
      const datosGuardados = recuperarDerivacionData();
      if (datosGuardados && datosGuardados.length > 0) {
        setDerivacionData(datosGuardados);
        setDerivacionLoaded(true);
        setAnalisisConsumoHabilitado(true);
        setSuccessMessage(`✅ Se recuperaron ${datosGuardados.length} registros guardados anteriormente`);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    }
  }, []);

  useEffect(() => {
    if (derivacionData.length > 0) {
      guardarDerivacionData(derivacionData);
    }
  }, [derivacionData]);

  const handleVolver = () => {
    navigate('/wart');
  };

  const handleAnularFC = () => {
    const palabrasClaveExcluir = ['ANULADA', 'ANULADOR', 'COMPLEMENTARIA', 'SUSTITUIDA'];

    let registrosExcluidos = 0;

    const datosFiltrados = derivacionData.filter((row) => {
      const estadoOriginal = (row['Estado de la factura'] || '').toString();
      const estadoNormalizado = estadoOriginal.trim().toUpperCase();

      // Coincidencia por palabra clave (contiene). Se usa 'ANULADOR' para capturar ANULADA/ANULADORA.
      if (palabrasClaveExcluir.some(p => estadoNormalizado.includes(p))) {
        registrosExcluidos++;
        return false;
      }

      return true;
    });

    const datosOrdenados = datosFiltrados.sort((a, b) => {
      const fechaA = new Date(a['Fecha desde']);
      const fechaB = new Date(b['Fecha desde']);
      return fechaA.getTime() - fechaB.getTime();
    });

    setDerivacionData(datosOrdenados);
    setAnalisisConsumoHabilitado(true);

    try {
      const resultado = analizarConsumoCompleto(datosOrdenados as DerivacionData[]);
      setResultadoAnalisis(resultado);
      setMostrandoAnalisis(true);
      setVistaActual('mensual');
      setSuccessMessage(`✅ Filtro aplicado y análisis ejecutado: ${datosOrdenados.length} facturas válidas, ${registrosExcluidos} excluidas`);
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
      const resultado = analizarConsumoCompleto(derivacionData as DerivacionData[]);
      setResultadoAnalisis(resultado);
      setMostrandoAnalisis(true);
      setVistaActual('anual');
      setSuccessMessage(`Análisis completado: ${resultado.vistaAnual.length} años y ${resultado.comparativaMensual.length} meses procesados`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch {
      setError('Error al realizar el análisis de consumo');
    }
  };

  // Exportaciones
  const handleExportarVistaAnual = () => {
    if (!resultadoAnalisis) return;
    try {
      exportarVistaAnualExcel(resultadoAnalisis.vistaAnual);
      setSuccessMessage('✅ Vista por Años exportada exitosamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Error al exportar Vista por Años');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleExportarComparativaMensual = () => {
    if (!resultadoAnalisis) return;
    try {
      exportarComparativaMensualExcel(resultadoAnalisis.comparativaMensual);
      setSuccessMessage('✅ Comparativa Mensual exportada exitosamente');
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
        resultadoAnalisis.vistaAnual,
        resultadoAnalisis.comparativaMensual,
        derivacionData
      );
      setSuccessMessage('✅ Análisis completo exportado exitosamente (3 hojas)');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Error al exportar análisis completo');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleLimpiarDatosGuardados = () => {
    if (confirm('¿Está seguro de eliminar todos los datos guardados?')) {
      limpiarDatosGuardados();
      setDerivacionData([]);
      setDerivacionLoaded(false);
      setMostrandoAnalisis(false);
      setResultadoAnalisis(null);
      setAnalisisConsumoHabilitado(false);
      setSuccessMessage('✅ Datos eliminados correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleDerivacionClick = () => {
    derivacionInputRef.current?.click();
  };

  // Importación de Saldo ATR: input eliminado según solicitud

  const handleDerivacionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setDerivacionLoaded(false);

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let jsonData: DerivacionData[] = [];

        if (file.name.endsWith('.csv')) {
          const csvText = data as string;
          const workbook = XLSX.read(csvText, { 
            type: 'string',
            raw: true,
            codepage: 65001
          });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet) as DerivacionData[];
        } else {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet) as DerivacionData[];
        }

        if (jsonData.length === 0) {
          setError('El archivo está vacío o no tiene el formato esperado');
          return;
        }

        const columns = Object.keys(jsonData[0]);
        setDerivacionColumns(columns);
        setDerivacionData(jsonData);
        setDerivacionLoaded(true);
      } catch {
        setError('El archivo no tiene el formato esperado');
        setDerivacionData([]);
        setDerivacionColumns([]);
      }
    };

    reader.onerror = () => {
      setError('Error al leer el archivo');
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsBinaryString(file);
    }
  };

  return (
    <div className="expediente-container">
      <div className="expediente-content">
        {derivacionLoaded && (
          <div className="expediente-header-inline">
            <button
              onClick={handleVolver}
              className="expediente-back-btn-inline"
              title="Volver al módulo WART"
            >
              <ArrowLeft size={20} />
              <span>Volver</span>
            </button>
            <div className="expediente-header-actions">
              <div className="expediente-title-inline">
                <h1>Carga de derivación</h1>
                <p>{derivacionData.length} registros cargados</p>
              </div>
              <button
                onClick={handleAnularFC}
                className="expediente-anular-btn-header"
              >
                Anular FC
              </button>
              <button
                onClick={handleAnalisisConsumo}
                disabled={!analisisConsumoHabilitado}
                className="expediente-analisis-btn-header"
                title={!analisisConsumoHabilitado ? 'Primero debe ejecutar Anular FC' : 'Iniciar análisis de consumo'}
              >
                Análisis de Consumo
              </button>
              <button
                onClick={handleLimpiarDatosGuardados}
                className="expediente-limpiar-btn-header"
                title="Eliminar todos los datos guardados"
              >
                🗑️ Limpiar Datos
              </button>
            </div>
          </div>
        )}

        {!derivacionLoaded && (
          <div className="expediente-header">
            <h1 className="expediente-title">Análisis de Expediente Tipo V</h1>
            <p className="expediente-subtitle">
              Importe los archivos necesarios para continuar con el análisis
            </p>
          </div>
        )}

        {error && (
          <div className="expediente-alert expediente-alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="expediente-alert expediente-alert-success">
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {!derivacionLoaded ? (
          <div className="expediente-card">
            <div className="expediente-upload-section">
              <button
                onClick={handleDerivacionClick}
                className="expediente-upload-btn"
              >
                <Upload size={32} />
                <span className="expediente-upload-title">Derivación Individual</span>
                <span className="expediente-upload-description">
                  Haga clic para importar archivo CSV o Excel
                </span>
              </button>
              <input
                ref={derivacionInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleDerivacionChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        ) : mostrandoAnalisis && resultadoAnalisis ? (
          <div className="expediente-data-card">
            <div className="expediente-analisis-header">
              <h2>Análisis de Consumo</h2>
            </div>

            {vistaActual !== 'mensual' && (
            <div className="expediente-analisis-resumen">
              <div className="analisis-resumen-card">
                <span className="resumen-label">Total Consumo</span>
                <span className="resumen-valor">{formatearNumero(resultadoAnalisis.resumen.consumoTotalGeneral)} kWh</span>
              </div>
              <div className="analisis-resumen-card">
                <span className="resumen-label">Total Facturas</span>
                <span className="resumen-valor">{resultadoAnalisis.resumen.totalFacturas}</span>
              </div>
              <div className="analisis-resumen-card">
                <span className="resumen-label">Periodo</span>
                <span className="resumen-valor">{resultadoAnalisis.periodoTotal.fechaInicio} - {resultadoAnalisis.periodoTotal.fechaFin}</span>
              </div>
              <div className="analisis-resumen-card">
                <span className="resumen-label">Promedio Anual</span>
                <span className="resumen-valor">{formatearNumero(resultadoAnalisis.resumen.promedioAnual)} kWh</span>
              </div>
              <div className="analisis-resumen-card">
                <span className="resumen-label">Anomalías Detectadas</span>
                <span className="resumen-valor anomalia-badge">{resultadoAnalisis.resumen.anomaliasDetectadas}</span>
              </div>
            </div>
            )}

            {(
            <div className="expediente-tabs">
              <button 
                className={`expediente-tab ${vistaActual === 'anual' ? 'active' : ''}`}
                onClick={() => setVistaActual('anual')}
              >
                📊 Vista por Años
              </button>
              <button 
                className={`expediente-tab ${vistaActual === 'mensual' ? 'active' : ''}`}
                onClick={() => setVistaActual('mensual')}
              >
                📅 Comparativa Mensual
              </button>
              <button 
                className={`expediente-tab ${vistaActual === 'listado' ? 'active' : ''}`}
                onClick={() => setVistaActual('listado')}
              >
                📋 Listado
              </button>
              <button 
                className={`expediente-tab ${vistaActual === 'grafico' ? 'active' : ''}`}
                onClick={() => setVistaActual('grafico')}
              >
                📈 Gráfico
              </button>
            </div>
            )}

            {/* Vista por Años */}
            {vistaActual === 'anual' && (
              <div className="expediente-table-wrapper">
                <table className="expediente-table expediente-table-analisis">
                  <thead>
                    <tr>
                      <th>Año</th>
                      <th>Suma Consumo Activa (kWh)</th>
                      <th>Máx Maxímetro</th>
                      <th>Periodos Facturados</th>
                      <th>Suma de Días</th>
                      <th>Promedio Consumo por Día (kWh)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultadoAnalisis.vistaAnual.map((consumo) => (
                      <tr key={consumo.año}>
                        <td className="td-año">{consumo.año}</td>
                        <td className="td-numero">{formatearNumero(consumo.sumaConsumoActiva)}</td>
                        <td className="td-numero">{consumo.maxMaximetro > 0 ? formatearNumero(consumo.maxMaximetro) : '-'}</td>
                        <td className="td-numero">{consumo.periodosFacturados}</td>
                        <td className="td-numero">{consumo.sumaDias}</td>
                        <td className="td-numero">{formatearNumero(consumo.promedioConsumoPorDia)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {vistaActual === 'mensual' && (
              <div className="expediente-heatmap-section">
                <div className="expediente-heatmap-wrapper">
                  <HeatMapConsumo datos={resultadoAnalisis.comparativaMensual} />
                </div>
                <div className="expediente-export-buttons expediente-export-inline">
                  <button 
                    className="btn-export"
                    onClick={handleExportarComparativaMensual}
                    title="Exportar Comparativa Mensual a Excel"
                  >
                    <Download size={16} />
                    Exportar Comparativa Mensual
                  </button>
                  <button 
                    className="btn-export btn-export-complete"
                    onClick={handleExportarAnalisisCompleto}
                    title="Exportar análisis completo con todas las vistas"
                  >
                    <Download size={16} />
                    Exportar Análisis Completo
                  </button>
                </div>
              </div>
            )}

            {vistaActual === 'listado' && (
              <div className="expediente-table-wrapper">
                <div className="listado-header">
                  <h3>📋 Listado Completo de Registros</h3>
                  <p>{derivacionData.length} registros totales</p>
                </div>
                <table className="expediente-table expediente-table-listado">
                  <thead>
                    <tr>
                      {derivacionColumns.slice(0, 10).map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {derivacionData.map((row, index) => (
                      <tr key={index}>
                        {derivacionColumns.slice(0, 10).map((column) => (
                          <td key={`${index}-${column}`}>
                            {String((row as unknown as Record<string, unknown>)[column] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="listado-nota">
                  ℹ️ Mostrando las primeras 10 columnas. Total de columnas: {derivacionColumns.length}
                </div>
              </div>
            )}

            {vistaActual === 'grafico' && (
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
                      const consumos = resultadoAnalisis.comparativaMensual.map(m => m.consumoTotal);
                      const maxConsumo = Math.max(...consumos);
                      const minConsumo = Math.min(...consumos);
                      const rango = maxConsumo - minConsumo || 1;
                      
                      const width = 100; // Usaremos viewBox para responsive
                      const height = 80;
                      const padding = 10;
                      
                      const puntos = resultadoAnalisis.comparativaMensual.map((mes, index) => {
                        const x = padding + (index / (consumos.length - 1)) * (width - 2 * padding);
                        const y = height - padding - ((mes.consumoTotal - minConsumo) / rango) * (height - 2 * padding);
                        return { x, y, mes };
                      });
                      
                      const lineaPath = puntos.map((p, i) => 
                        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                      ).join(' ');
                      
                      const areaPath = `M ${padding} ${height - padding} L ${puntos.map(p => `${p.x} ${p.y}`).join(' L ')} L ${width - padding} ${height - padding} Z`;
                      
                      return (
                        <g>
                          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" width="100%" height="100%">
                            {/* Área bajo la curva */}
                            <path d={areaPath} fill="url(#areaGradient)" />
                            
                            {/* Línea principal */}
                            <path 
                              d={lineaPath} 
                              fill="none" 
                              stroke="#0000D0" 
                              strokeWidth="0.5"
                              strokeLinejoin="round"
                            />
                            
                            {/* Puntos */}
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
                    <span className="stat-value">
                      {formatearNumero(Math.max(...resultadoAnalisis.comparativaMensual.map(m => m.consumoTotal)))} kWh
                    </span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">📉 Mínimo</span>
                    <span className="stat-value">
                      {formatearNumero(Math.min(...resultadoAnalisis.comparativaMensual.map(m => m.consumoTotal)))} kWh
                    </span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">📈 Promedio</span>
                    <span className="stat-value">
                      {formatearNumero(
                        resultadoAnalisis.comparativaMensual.reduce((sum, m) => sum + m.consumoTotal, 0) / 
                        resultadoAnalisis.comparativaMensual.length
                      )} kWh
                    </span>
                  </div>
                  <div className="stat-card anomalia-card">
                    <span className="stat-label">⚠️ Anomalías</span>
                    <span className="stat-value">
                      {resultadoAnalisis.comparativaMensual.filter(m => m.esAnomalia).length}
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
              </div>
            )}

            {vistaActual !== 'mensual' && (
              <div className="expediente-export-buttons expediente-export-bottom">
                {vistaActual === 'anual' && (
                  <button 
                    className="btn-export"
                    onClick={handleExportarVistaAnual}
                    title="Exportar Vista por Años a Excel"
                  >
                    <Download size={16} />
                    Exportar Vista por Años
                  </button>
                )}
                {vistaActual === 'grafico' && (
                  <button 
                    className="btn-export btn-export-complete"
                    onClick={handleExportarAnalisisCompleto}
                    title="Exportar análisis completo"
                  >
                    <Download size={16} />
                    Exportar Análisis Completo
                  </button>
                )}
                {vistaActual === 'listado' && (
                  <button 
                    className="btn-export btn-export-complete"
                    onClick={handleExportarAnalisisCompleto}
                    title="Exportar análisis completo"
                  >
                    <Download size={16} />
                    Exportar Análisis Completo
                  </button>
                )}
              </div>
            )}

          </div>
        ) : (
          <div className="expediente-data-card">
            <div className="expediente-table-wrapper">
              <table className="expediente-table">
                <thead>
                  <tr>
                    {derivacionColumns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {derivacionData.map((row, index) => (
                    <tr key={index}>
                      {derivacionColumns.map((column) => (
                        <td key={`${index}-${column}`}>
                          {String((row as unknown as Record<string, unknown>)[column] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {!derivacionLoaded && (
          <div className="expediente-footer">
            <button
              onClick={handleVolver}
              className="expediente-back-btn"
              title="Volver al módulo WART"
            >
              <ArrowLeft size={20} />
              <span>Volver</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
