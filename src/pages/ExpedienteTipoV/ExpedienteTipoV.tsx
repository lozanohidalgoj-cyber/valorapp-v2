/**
 * Análisis de Expediente Tipo V
 * Interfaz para importar y procesar datos de expedientes tipo V
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import './ExpedienteTipoV.css';

interface DerivacionData {
  [key: string]: string | number;
}

export const ExpedienteTipoV = () => {
  const navigate = useNavigate();
  const saldoATRInputRef = useRef<HTMLInputElement>(null);
  const derivacionInputRef = useRef<HTMLInputElement>(null);
  
  const [derivacionData, setDerivacionData] = useState<DerivacionData[]>([]);
  const [derivacionColumns, setDerivacionColumns] = useState<string[]>([]);
  const [derivacionLoaded, setDerivacionLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [analisisConsumoHabilitado, setAnalisisConsumoHabilitado] = useState(false);

  const handleVolver = () => {
    navigate('/wart');
  };

  const handleAnularFC = () => {
    const palabrasClave = ['anuladas', 'anuladoras', 'complementarias', 'sustituidas'];
    
    const datosFiltrados = derivacionData.filter((row) => {
      const rowString = Object.values(row).join(' ').toLowerCase();
      return !palabrasClave.some(palabra => rowString.includes(palabra));
    });
    
    const eliminados = derivacionData.length - datosFiltrados.length;
    setDerivacionData(datosFiltrados);
    
    if (eliminados > 0) {
      setSuccessMessage(`Se eliminaron ${eliminados} registro(s) con facturas anuladas, anuladoras, complementarias o sustituidas`);
      setError(null);
      setAnalisisConsumoHabilitado(true);
    } else {
      setSuccessMessage('No se encontraron registros para eliminar');
      setError(null);
      setAnalisisConsumoHabilitado(true);
    }
    
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleSaldoATRClick = () => {
    saldoATRInputRef.current?.click();
  };

  const handleAnalisisConsumo = () => {
    // TODO: Implementar lógica de análisis de consumo
  };

  const handleDerivacionClick = () => {
    derivacionInputRef.current?.click();
  };

  const handleSaldoATRChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Implementar importación de Saldo ATR
    }
  };

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
      } catch (err) {
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
                onClick={handleSaldoATRClick}
                className="expediente-upload-btn"
              >
                <Upload size={32} />
                <span className="expediente-upload-title">Saldo ATR</span>
                <span className="expediente-upload-description">
                  Haga clic para importar archivo
                </span>
              </button>
              <input
                ref={saldoATRInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleSaldoATRChange}
                style={{ display: 'none' }}
              />
            </div>

            <div className="expediente-separator"></div>

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
                          {row[column]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="expediente-actions">
              <button
                onClick={() => {
                  setDerivacionLoaded(false);
                  setDerivacionData([]);
                  setDerivacionColumns([]);
                  setAnalisisConsumoHabilitado(false);
                }}
                className="expediente-reload-btn"
              >
                Cargar otro archivo
              </button>
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
