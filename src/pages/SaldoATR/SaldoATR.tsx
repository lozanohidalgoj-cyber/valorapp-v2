/**
 * Interfaz Saldo ATR - Refactorizado
 * Muestra plantilla basada en "Interfaz Saldo ATR.xlsx" (46 columnas A..AT)
 * Permite importar "Saldo ATR.csv" (14 columnas A..N) y mapear a columnas A,C,G,H,I,J,P
 * Reducido mediante extracción de componentes, hooks y utilidades
 */

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertMessages, ImportActions, SaldoATRHeader, SaldoATRTable } from './components';
import { useSaldoATRBase, useFileImport } from './hooks';
import { analizarConsumoCompleto } from '../../services/analisisConsumoService';
import {
  exportarAnalisisCompleto,
  exportarComparativaMensualExcel,
  exportarVistaAnualExcel,
} from '../../services/exportacionService';
import type { DerivacionData, ResultadoAnalisis, SaldoATRColumna, SaldoATRRow } from '../../types';
import type { VistaAnalisis } from '../ExpedienteTipoV/types';
import {
  ResumenAnalisis,
  TabsVista,
  VistaAnual,
  VistaAnomalias,
  VistaGrafico,
  VistaListado,
  VistaMensual,
} from '../ExpedienteTipoV/components';
import { COLUMN_LETTERS, DEFAULT_HEADERS } from './utils';
import '../ExpedienteTipoV/ExpedienteTipoV.css';
import './SaldoATR.css';

const PALABRAS_CLAVE_ANULACION = ['ANULADA', 'ANULADOR', 'COMPLEMENTARIA', 'SUSTITUIDA'] as const;
const COLUMNAS_REVISION_ANULACION: readonly SaldoATRColumna[] = ['E', 'F', 'K', 'L'];
const MAX_FACTURAS_DETALLE = 5;

const obtenerIdentificadorSaldoAtr = (fila: SaldoATRRow): string => {
  const numeroFiscal = fila['A']?.trim();
  if (numeroFiscal) {
    return `Factura ${numeroFiscal}`;
  }

  const secuencial = fila['D']?.trim();
  if (secuencial) {
    return `Secuencial ${secuencial}`;
  }

  const contrato = fila['C']?.trim();
  if (contrato) {
    return `Contrato ${contrato}`;
  }

  return 'Registro sin identificador';
};

const obtenerTimestampDesdeFecha = (valor: string): number => {
  if (!valor) {
    return Number.MAX_SAFE_INTEGER;
  }

  const partes = valor.split('/');
  if (partes.length !== 3) {
    return Number.MAX_SAFE_INTEGER;
  }

  const [dia, mes, anio] = partes.map((fragmento) => Number(fragmento));
  if (Number.isNaN(dia) || Number.isNaN(mes) || Number.isNaN(anio)) {
    return Number.MAX_SAFE_INTEGER;
  }

  const fecha = new Date(anio, mes - 1, dia);
  const timestamp = fecha.getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

const convertirSaldoAtrADerivacion = (
  registros: SaldoATRRow[],
  headers: string[]
): { registros: DerivacionData[]; columnas: string[] } => {
  const fallbackHeaders = COLUMN_LETTERS.map((columna) => DEFAULT_HEADERS[columna] ?? '');
  const normalizarNombreColumna = (nombre: string): string => {
    if (!nombre) return '';
    const limpio = nombre.trim();
    if (limpio.toLowerCase() === 'código de empresa distribuidora') {
      return 'Potencia';
    }
    return limpio;
  };

  const nombresColumnas = (
    headers.length === COLUMN_LETTERS.length && headers.some((nombre) => nombre)
      ? headers
      : fallbackHeaders
  ).map(normalizarNombreColumna);

  const registrosDerivacion = registros
    .map((fila) => {
      const registro: Record<string, string | number> = {};

      COLUMN_LETTERS.forEach((columna, indice) => {
        const nombreCampo = nombresColumnas[indice];
        if (nombreCampo) {
          registro[nombreCampo] = fila[columna] ?? '';
        }
      });

      return registro as unknown as DerivacionData;
    })
    .filter((registro) => {
      const fecha = ((registro['Fecha desde'] as string) || '').trim();
      return fecha.length > 0;
    });

  return {
    registros: registrosDerivacion,
    columnas: nombresColumnas,
  };
};

export const SaldoATR = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { autoOpen?: boolean } };
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Hook para cargar la base de datos
  const { rows: baseRows, headers, loading, error: loadError } = useSaldoATRBase();

  // Hook para importar archivos
  const { handleFileImport, error: importError, success } = useFileImport();

  // Estado local de filas (puede ser actualizado por importación)
  const [rows, setRows] = useState<SaldoATRRow[]>([]);
  const [analisisHabilitado, setAnalisisHabilitado] = useState(false);
  const [resultadoAnalisis, setResultadoAnalisis] = useState<ResultadoAnalisis | null>(null);
  const [vistaActual, setVistaActual] = useState<VistaAnalisis>('anual');
  const [registrosDerivacion, setRegistrosDerivacion] = useState<DerivacionData[]>([]);
  const [columnasAnalisis, setColumnasAnalisis] = useState<string[]>([]);
  const [customError, setCustomError] = useState<string | null>(null);
  const [customSuccess, setCustomSuccess] = useState<string | null>(null);

  // Sincronizar baseRows con rows locales
  useEffect(() => {
    if (!loading && baseRows.length > 0) {
      setRows(baseRows);
      setAnalisisHabilitado(false);
      setResultadoAnalisis(null);
      setVistaActual('anual');
      setRegistrosDerivacion([]);
      setColumnasAnalisis([]);
      setCustomError(null);
      setCustomSuccess(null);
    }
  }, [baseRows, loading]);

  // Auto-abrir selector de archivos si viene de navegación
  useEffect(() => {
    if (location.state?.autoOpen) {
      setTimeout(() => inputRef.current?.click(), 0);
    }
  }, [location.state]);

  // Handlers
  const handleVolver = () => navigate(-1);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const updatedRows = await handleFileImport(file, rows);
      setRows(updatedRows);
      setAnalisisHabilitado(false);
      setResultadoAnalisis(null);
      setVistaActual('anual');
      setRegistrosDerivacion([]);
      setColumnasAnalisis([]);
      setCustomError(null);
      setCustomSuccess(null);
    } catch {
      // Error ya manejado por el hook
    }
  };

  const handleLimpiarDatos = () => {
    if (globalThis.confirm('¿Estás seguro de que quieres limpiar todos los datos?')) {
      setRows(baseRows);
      setAnalisisHabilitado(false);
      setResultadoAnalisis(null);
      setVistaActual('anual');
      setRegistrosDerivacion([]);
      setColumnasAnalisis([]);
      setCustomError(null);
      setCustomSuccess('Datos restablecidos correctamente');
      setTimeout(() => setCustomSuccess(null), 3000);
    }
  };

  const handleAnularFC = () => {
    if (rows.length === 0) {
      setCustomError('No hay datos cargados para anular.');
      setTimeout(() => setCustomError(null), 4000);
      return;
    }

    const facturasExcluidas: string[] = [];

    const filasFiltradas = rows.filter((fila) => {
      const contienePalabraClave = COLUMNAS_REVISION_ANULACION.some((columna) => {
        const valor = fila[columna];
        if (valor === undefined || valor === null) {
          return false;
        }

        const texto = valor.toString().trim().toUpperCase();
        if (texto.length === 0) {
          return false;
        }

        return PALABRAS_CLAVE_ANULACION.some((palabra) => texto.includes(palabra));
      });

      if (contienePalabraClave) {
        facturasExcluidas.push(obtenerIdentificadorSaldoAtr(fila));
        return false;
      }

      return true;
    });

    const filasOrdenadas = [...filasFiltradas].sort(
      (a, b) => obtenerTimestampDesdeFecha(a['G']) - obtenerTimestampDesdeFecha(b['G'])
    );

    setRows(filasOrdenadas);
    setAnalisisHabilitado(true);
    setResultadoAnalisis(null);
    setVistaActual('anual');
    setRegistrosDerivacion([]);
    setColumnasAnalisis([]);
    setCustomError(null);

    if (facturasExcluidas.length > 0) {
      const detalle = facturasExcluidas.slice(0, MAX_FACTURAS_DETALLE).join(', ');
      const restante =
        facturasExcluidas.length > MAX_FACTURAS_DETALLE
          ? ` y ${facturasExcluidas.length - MAX_FACTURAS_DETALLE} más`
          : '';
      setCustomSuccess(
        `✅ Se anularon ${facturasExcluidas.length} factura${
          facturasExcluidas.length === 1 ? '' : 's'
        }${detalle ? `: ${detalle}${restante}` : ''}`
      );
    } else {
      setCustomSuccess('No se encontraron facturas para anular. El listado se mantiene igual.');
    }

    setTimeout(() => setCustomSuccess(null), 6000);
  };

  const handleAnalisisConsumo = () => {
    if (!analisisHabilitado) {
      setCustomError('Debe ejecutar Anular FC antes de iniciar el análisis.');
      setTimeout(() => setCustomError(null), 4000);
      return;
    }

    const { registros: registrosConvertidos, columnas } = convertirSaldoAtrADerivacion(
      rows,
      headers
    );

    if (registrosConvertidos.length === 0) {
      setCustomError('No hay registros válidos para analizar.');
      setTimeout(() => setCustomError(null), 4000);
      return;
    }

    try {
      const resultado = analizarConsumoCompleto(registrosConvertidos);
      setResultadoAnalisis(resultado);
      setRegistrosDerivacion(registrosConvertidos);
      setColumnasAnalisis(columnas);
      setVistaActual('anual');
      setCustomError(null);
      setCustomSuccess(null);
    } catch {
      setCustomError('Error al ejecutar el análisis de consumo');
      setTimeout(() => setCustomError(null), 5000);
    }
  };

  const handleExportarVistaAnual = () => {
    if (!resultadoAnalisis) {
      setCustomError('No hay resultados para exportar. Ejecuta el análisis primero.');
      setTimeout(() => setCustomError(null), 4000);
      return;
    }

    try {
      exportarVistaAnualExcel(resultadoAnalisis.vistaAnual);
      setCustomSuccess('Vista por años exportada correctamente');
      setTimeout(() => setCustomSuccess(null), 4000);
    } catch {
      setCustomError('Error al exportar la vista por años');
      setTimeout(() => setCustomError(null), 4000);
    }
  };

  const handleExportarComparativaMensual = () => {
    if (!resultadoAnalisis) {
      setCustomError('No hay resultados para exportar. Ejecuta el análisis primero.');
      setTimeout(() => setCustomError(null), 4000);
      return;
    }

    try {
      exportarComparativaMensualExcel(resultadoAnalisis.comparativaMensual);
      setCustomSuccess('Comparativa mensual exportada correctamente');
      setTimeout(() => setCustomSuccess(null), 4000);
    } catch {
      setCustomError('Error al exportar la comparativa mensual');
      setTimeout(() => setCustomError(null), 4000);
    }
  };

  const handleExportarAnalisisCompleto = () => {
    if (!resultadoAnalisis || registrosDerivacion.length === 0) {
      setCustomError('Ejecuta el análisis antes de exportar el resultado completo.');
      setTimeout(() => setCustomError(null), 4000);
      return;
    }

    try {
      exportarAnalisisCompleto(
        resultadoAnalisis.vistaAnual,
        resultadoAnalisis.comparativaMensual,
        registrosDerivacion
      );
      setCustomSuccess('Análisis completo exportado correctamente');
      setTimeout(() => setCustomSuccess(null), 4000);
    } catch {
      setCustomError('Error al exportar el análisis completo');
      setTimeout(() => setCustomError(null), 4000);
    }
  };

  const handleExportarAnomalias = () => {
    if (!resultadoAnalisis) {
      setCustomError('No hay anomalías disponibles. Ejecuta el análisis primero.');
      setTimeout(() => setCustomError(null), 4000);
      return;
    }

    const anomalías = resultadoAnalisis.comparativaMensual.filter(
      (registro) => registro.esAnomalia
    );

    if (anomalías.length === 0) {
      setCustomError('No se detectaron anomalías para exportar.');
      setTimeout(() => setCustomError(null), 4000);
      return;
    }

    try {
      exportarComparativaMensualExcel(anomalías, 'anomalias_saldo_atr.xlsx');
      setCustomSuccess('Anomalías exportadas correctamente');
      setTimeout(() => setCustomSuccess(null), 4000);
    } catch {
      setCustomError('Error al exportar las anomalías');
      setTimeout(() => setCustomError(null), 4000);
    }
  };

  // Combinar errores
  const displayError = loadError || importError || customError;
  const successMessage = customSuccess ?? success;
  const columnasListado = columnasAnalisis.length > 0 ? columnasAnalisis : headers;
  const puedeExportar = resultadoAnalisis !== null && registrosDerivacion.length > 0;

  return (
    <div className="saldoatr-container">
      <SaldoATRHeader
        onVolver={handleVolver}
        totalRegistros={rows.length}
        onExportar={puedeExportar ? handleExportarAnalisisCompleto : undefined}
        onLimpiarDatos={handleLimpiarDatos}
        onAnularFC={handleAnularFC}
        onAnalizar={handleAnalisisConsumo}
        analisisHabilitado={analisisHabilitado}
      />

      <AlertMessages error={displayError} success={successMessage} />

      <div className="saldoatr-scroll-area">
        <div className="saldoatr-card">
          <ImportActions inputRef={inputRef} onFileChange={handleFileChange} />

          {loading ? (
            <div className="saldoatr-loading">Cargando plantilla base...</div>
          ) : (
            <SaldoATRTable rows={rows} headers={headers} />
          )}
        </div>

        {resultadoAnalisis && (
          <div className="saldoatr-analisis-panel">
            <div className="saldoatr-analisis-panel__header">
              <h2>Resultados del análisis de consumo</h2>
              <p>
                Explora la información por años, meses, listado completo o gráfico para identificar
                patrones y anomalías.
              </p>
            </div>

            <div className="saldoatr-analisis-panel__content expediente-analisis-container">
              {vistaActual !== 'mensual' && <ResumenAnalisis resultado={resultadoAnalisis} />}

              <TabsVista vistaActual={vistaActual} onCambiarVista={setVistaActual} />

              {vistaActual === 'anual' && (
                <VistaAnual
                  datos={resultadoAnalisis.vistaAnual}
                  onExportar={handleExportarVistaAnual}
                />
              )}

              {vistaActual === 'mensual' && (
                <VistaMensual
                  datos={resultadoAnalisis.comparativaMensual}
                  detallesPorPeriodo={resultadoAnalisis.detallesPorPeriodo}
                  onExportarComparativa={handleExportarComparativaMensual}
                  onExportarCompleto={handleExportarAnalisisCompleto}
                />
              )}

              {vistaActual === 'listado' && (
                <VistaListado data={registrosDerivacion} columns={columnasListado} />
              )}

              {vistaActual === 'grafico' && (
                <VistaGrafico
                  comparativaMensual={resultadoAnalisis.comparativaMensual}
                  onExportar={handleExportarAnalisisCompleto}
                />
              )}

              {vistaActual === 'anomalia' && (
                <VistaAnomalias
                  datos={resultadoAnalisis.comparativaMensual}
                  detallesPorPeriodo={resultadoAnalisis.detallesPorPeriodo}
                  onExportar={handleExportarAnomalias}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
