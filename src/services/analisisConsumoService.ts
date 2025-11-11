/**
 * 📊 Servicio de Análisis de Consumo
 *
 * Replica la funcionalidad del Excel "Análisis de Expedientes.xlsm"
 * - Vista por años: Agrupación anual con todas las métricas
 * - Comparativa mensual: Evolución mes a mes con detección de anomalías (umbral 40%)
 */

import type {
  DerivacionData,
  ConsumoAnual,
  ConsumoMensual,
  ResultadoAnalisis,
  AnalisisPeriodoConsumo,
} from '../types';
import {
  convertirNumeroEspañol,
  extraerAñoDeFormato,
  extraerMesDeFormato,
  calcularDiasEntreFechas,
  formatearNumero,
} from '../utils';

/**
 * Genera la vista anual con todas las métricas del Excel
 * Calcula: Suma Consumo Activa, Máx Maxímetro, Periodos facturados,
 * Suma de días, Promedio consumo por día
 * @param datos - Array de registros de derivación individual
 * @returns Array de consumos anuales con todas las métricas calculadas
 */
const generarVistaAnual = (datos: DerivacionData[]): ConsumoAnual[] => {
  const datosPorAño: { [año: number]: DerivacionData[] } = {};

  // Agrupar por año
  datos.forEach((registro) => {
    const año = extraerAñoDeFormato(registro['Fecha desde']);
    if (año > 0) {
      if (!datosPorAño[año]) {
        datosPorAño[año] = [];
      }
      datosPorAño[año].push(registro);
    }
  });

  // Calcular métricas por año
  const consumosPorAño = Object.keys(datosPorAño)
    .map(Number)
    .sort((a, b) => a - b)
    .map((año) => {
      const registrosAño = datosPorAño[año];

      // 1. Suma Consumo Activa (P1 + P2 + P3)
      const sumaConsumoActiva = registrosAño.reduce((suma, registro) => {
        const p1 = convertirNumeroEspañol(registro['Consumo P1/punta']);
        const p2 = convertirNumeroEspañol(registro['Consumo P2/llano']);
        const p3 = convertirNumeroEspañol(registro['Consumo P3/valle']);
        return suma + p1 + p2 + p3;
      }, 0);

      // 2. Máx de Maxímetro (mayor valor de todos los periodos)
      const maxMaximetro = registrosAño.reduce((max, registro) => {
        const maxP1 = convertirNumeroEspañol(registro['Maxímetro P1/Punta']);
        const maxP2 = convertirNumeroEspañol(registro['Maxímetro P2/Llano']);
        const maxP3 = convertirNumeroEspañol(registro['Maxímetro P3/Valle']);
        const maxP4 = convertirNumeroEspañol(registro['Maxímetro P4']);
        const maxP5 = convertirNumeroEspañol(registro['Maxímetro P5']);
        const maxP6 = convertirNumeroEspañol(registro['Maxímetro P6']);
        const maxActual = Math.max(maxP1, maxP2, maxP3, maxP4, maxP5, maxP6);
        return Math.max(max, maxActual);
      }, 0);

      // 3. Periodos facturados (número de facturas)
      const periodosFacturados = registrosAño.length;

      // 4. Suma de Días
      const sumaDias = registrosAño.reduce((suma, registro) => {
        const dias = calcularDiasEntreFechas(registro['Fecha desde'], registro['Fecha hasta']);
        return suma + dias;
      }, 0);

      // 5. Promedio consumo por día
      const promedioConsumoPorDia = sumaDias > 0 ? sumaConsumoActiva / sumaDias : 0;

      return {
        año,
        sumaConsumoActiva,
        maxMaximetro,
        periodosFacturados,
        sumaDias,
        promedioConsumoPorDia,
      };
    });

  return consumosPorAño;
};

// ==================== FUNCIONES AUXILIARES PARA MÉTRICAS ADICIONALES ====================

/**
 * Calcula el Z-Score (desviaciones estándar) de un consumo respecto a los últimos 6 meses
 * @param consumos - Array de consumos mensuales ordenados cronológicamente
 * @param indiceActual - Índice del mes a analizar
 * @returns Z-Score o null si no hay suficientes datos
 */
function calcularZScore(consumos: number[], indiceActual: number): number | null {
  if (indiceActual < 2) return null; // Necesitamos al menos 3 datos históricos

  // Tomar hasta 6 meses previos (sin incluir el actual)
  const inicio = Math.max(0, indiceActual - 6);
  const historicos = consumos.slice(inicio, indiceActual);

  if (historicos.length < 2) return null;

  // Calcular media
  const media = historicos.reduce((sum, val) => sum + val, 0) / historicos.length;

  // Calcular desviación estándar
  const varianza =
    historicos.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / historicos.length;
  const desviacion = Math.sqrt(varianza);

  if (desviacion === 0) return 0; // Consumo totalmente estable

  // Calcular Z-Score
  const consumoActual = consumos[indiceActual];
  const zScore = (consumoActual - media) / desviacion;

  return zScore;
}

/**
 * Calcula el índice estacional (consumo actual / promedio histórico del mes * 100)
 * @param consumoActual - Consumo del periodo actual
 * @param promedioHistorico - Promedio histórico del mes
 * @returns Índice estacional (100 = normal) o null si no hay histórico
 */
function calcularIndiceEstacional(
  consumoActual: number,
  promedioHistorico: number | null
): number | null {
  if (!promedioHistorico || promedioHistorico === 0) return null;
  return (consumoActual / promedioHistorico) * 100;
}

/**
 * Calcula la tendencia en kWh/mes sobre los últimos 3 meses
 * @param consumos - Array de consumos mensuales
 * @param indiceActual - Índice del mes actual
 * @returns Tendencia en kWh/mes o null si no hay suficientes datos
 */
function calcularTendencia3M(consumos: number[], indiceActual: number): number | null {
  if (indiceActual < 2) return null; // Necesitamos al menos 3 meses

  const consumoActual = consumos[indiceActual];
  const consumoHace3Meses = consumos[indiceActual - 2];

  // Tendencia = (consumoActual - consumoHace3Meses) / 3
  const tendencia = (consumoActual - consumoHace3Meses) / 3;

  return tendencia;
}

/**
 * Calcula días transcurridos desde la última anomalía
 * @param comparativa - Array de consumos mensuales
 * @param indiceActual - Índice del periodo actual
 * @returns Número de días desde última anomalía o null si no hay anomalías previas
 */
function calcularDiasDesdeAnomalia(
  comparativa: Partial<ConsumoMensual>[],
  indiceActual: number
): number | null {
  // Buscar hacia atrás la última anomalía
  for (let i = indiceActual - 1; i >= 0; i--) {
    if (comparativa[i].esAnomalia) {
      // Calcular días entre periodos (aproximado)
      const diasTranscurridos = (indiceActual - i) * 30; // Aproximación
      return diasTranscurridos;
    }
  }

  return null; // No hay anomalías previas
}

/**
 * Calcula el ratio Consumo/Potencia
 * @param consumoTotal - Consumo total en kWh
 * @param potencia - Potencia contratada en kW
 * @param dias - Número de días del periodo
 * @returns Ratio entre 0 y 1, o null si no hay potencia
 */
function calcularRatioConsumoPotencia(
  consumoTotal: number,
  potencia: number | null,
  dias: number
): number | null {
  if (!potencia || potencia === 0 || dias === 0) return null;

  // Ratio = consumoTotal / (potencia * dias * 24)
  const consumoMaximoPosible = potencia * dias * 24;
  const ratio = consumoTotal / consumoMaximoPosible;

  return ratio;
}

/**
 * Calcula el coeficiente de variación histórico (desviación estándar / media * 100)
 * @param consumos - Array de todos los consumos históricos
 * @returns Coeficiente de variación en % o null si no hay suficientes datos
 */
function calcularCoeficienteVariacion(consumos: number[]): number | null {
  if (consumos.length < 3) return null;

  const media = consumos.reduce((sum, val) => sum + val, 0) / consumos.length;
  if (media === 0) return null;

  const varianza =
    consumos.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / consumos.length;
  const desviacion = Math.sqrt(varianza);

  const cv = (desviacion / media) * 100;

  return cv;
}

/**
 * Genera la comparativa mensual con detección de anomalías
 * Detecta variaciones > 40% como anomalías
 * @param datos - Array de registros de derivación individual
 * @returns Array de consumos mensuales con detección de anomalías
 */
const generarComparativaMensual = (
  datos: DerivacionData[]
): {
  comparativa: ConsumoMensual[];
  detalles: Record<string, DerivacionData[]>;
} => {
  const datosPorMes: Record<
    string,
    {
      registros: DerivacionData[];
      sumaConsumoP123: number;
      sumaConsumoActiva: number;
      sumaPromedioActiva: number;
      sumaMaximetro: number;
      sumaEnergiaReconstruida: number;
      sumaDias: number;
      sumaPotencia: number;
      registrosPotencia: number;
      tieneConsumoActiva: boolean;
      tienePromedioActiva: boolean;
      tieneEnergiaReconstruida: boolean;
    }
  > = {};

  // Agrupar por periodo (YYYY-MM)
  datos.forEach((registro) => {
    const año = extraerAñoDeFormato(registro['Fecha desde']);
    const mes = extraerMesDeFormato(registro['Fecha desde']);
    if (año > 0 && mes > 0) {
      const periodo = `${año}-${mes.toString().padStart(2, '0')}`;
      if (!datosPorMes[periodo]) {
        datosPorMes[periodo] = {
          registros: [],
          sumaConsumoP123: 0,
          sumaConsumoActiva: 0,
          sumaPromedioActiva: 0,
          sumaMaximetro: 0,
          sumaEnergiaReconstruida: 0,
          sumaDias: 0,
          sumaPotencia: 0,
          registrosPotencia: 0,
          tieneConsumoActiva: false,
          tienePromedioActiva: false,
          tieneEnergiaReconstruida: false,
        };
      }

      const entrada = datosPorMes[periodo];
      entrada.registros.push(registro);

      const consumoP1 = convertirNumeroEspañol(registro['Consumo P1/punta']);
      const consumoP2 = convertirNumeroEspañol(registro['Consumo P2/llano']);
      const consumoP3 = convertirNumeroEspañol(registro['Consumo P3/valle']);
      entrada.sumaConsumoP123 += consumoP1 + consumoP2 + consumoP3;

      const valorConsumoActiva = convertirNumeroEspañol(registro['Consumo Activa']);
      if (
        Object.prototype.hasOwnProperty.call(registro, 'Consumo Activa') &&
        registro['Consumo Activa'] !== '' &&
        registro['Consumo Activa'] !== null &&
        registro['Consumo Activa'] !== undefined
      ) {
        entrada.sumaConsumoActiva += valorConsumoActiva;
        entrada.tieneConsumoActiva = true;
      }

      const valorPromedioActiva = convertirNumeroEspañol(registro['Promedio Activa']);
      if (
        Object.prototype.hasOwnProperty.call(registro, 'Promedio Activa') &&
        registro['Promedio Activa'] !== '' &&
        registro['Promedio Activa'] !== null &&
        registro['Promedio Activa'] !== undefined
      ) {
        entrada.sumaPromedioActiva += valorPromedioActiva;
        entrada.tienePromedioActiva = true;
      }

      const maximetroCampo = convertirNumeroEspañol(registro['Maxímetro']);
      const maximetroDerivado = Math.max(
        convertirNumeroEspañol(registro['Maxímetro P1/Punta']),
        convertirNumeroEspañol(registro['Maxímetro P2/Llano']),
        convertirNumeroEspañol(registro['Maxímetro P3/Valle']),
        convertirNumeroEspañol(registro['Maxímetro P4']),
        convertirNumeroEspañol(registro['Maxímetro P5']),
        convertirNumeroEspañol(registro['Maxímetro P6'])
      );
      entrada.sumaMaximetro += maximetroCampo > 0 ? maximetroCampo : maximetroDerivado;

      const energiaReconstruida = convertirNumeroEspañol(
        registro['A + B + C'] ?? registro['Energía Total Reconstruida']
      );
      const tieneEnergiaReconstruida =
        (Object.prototype.hasOwnProperty.call(registro, 'A + B + C') &&
          registro['A + B + C'] !== '' &&
          registro['A + B + C'] !== null &&
          registro['A + B + C'] !== undefined) ||
        (Object.prototype.hasOwnProperty.call(registro, 'Energía Total Reconstruida') &&
          registro['Energía Total Reconstruida'] !== '' &&
          registro['Energía Total Reconstruida'] !== null &&
          registro['Energía Total Reconstruida'] !== undefined);

      if (tieneEnergiaReconstruida) {
        entrada.sumaEnergiaReconstruida += energiaReconstruida;
        entrada.tieneEnergiaReconstruida = true;
      }

      const diasDeclarados = convertirNumeroEspañol(registro['Días']);
      const diasCalculados = calcularDiasEntreFechas(
        registro['Fecha desde'],
        registro['Fecha hasta']
      );
      entrada.sumaDias += diasDeclarados > 0 ? diasDeclarados : diasCalculados;

      if (
        Object.prototype.hasOwnProperty.call(registro, 'Potencia') &&
        registro['Potencia'] !== '' &&
        registro['Potencia'] !== null &&
        registro['Potencia'] !== undefined
      ) {
        const potenciaDeclarada = convertirNumeroEspañol(registro['Potencia']);
        if (!Number.isNaN(potenciaDeclarada)) {
          entrada.sumaPotencia += potenciaDeclarada;
          entrada.registrosPotencia += 1;
        }
      }
    }
  });

  // Ordenar periodos cronológicamente
  const periodosOrdenados = Object.keys(datosPorMes).sort();

  const obtenerMetricas = (agrupado: (typeof datosPorMes)[string]) => {
    const consumoActivaTotal = agrupado.tieneConsumoActiva
      ? agrupado.sumaConsumoActiva
      : agrupado.sumaConsumoP123;

    const promedioActivaTotal = agrupado.tienePromedioActiva
      ? agrupado.sumaPromedioActiva
      : consumoActivaTotal;

    const energiaReconstruidaTotal = agrupado.tieneEnergiaReconstruida
      ? agrupado.sumaEnergiaReconstruida
      : agrupado.sumaConsumoP123;

    return {
      consumoActivaTotal,
      promedioActivaTotal,
      energiaReconstruidaTotal,
    };
  };

  // Calcular métricas por mes
  const comparativaMensual: ConsumoMensual[] = periodosOrdenados.map((periodo, index) => {
    const agrupado = datosPorMes[periodo];
    const [año, mes] = periodo.split('-').map(Number);

    const metricasActuales = obtenerMetricas(agrupado);

    const consumoReferencia = metricasActuales.consumoActivaTotal;
    const dias = agrupado.sumaDias;
    const consumoPromedioDiario = dias > 0 ? consumoReferencia / dias : 0;
    const potenciaPromedio =
      agrupado.registrosPotencia > 0 ? agrupado.sumaPotencia / agrupado.registrosPotencia : null;

    let variacionPorcentual: number | null = null;
    let variacionPotenciaPorcentual: number | null = null;
    let tipoVariacion: 'aumento' | 'descenso' | 'estable' | null = null;
    const motivosAnomalia: string[] = [];

    if (index > 0) {
      const periodoAnterior = periodosOrdenados[index - 1];
      const agregadoAnterior = datosPorMes[periodoAnterior];
      const metricasAnteriores = obtenerMetricas(agregadoAnterior);
      const consumoAnterior = metricasAnteriores.consumoActivaTotal;

      // Calcular variación porcentual usando CONSUMO TOTAL (no promedio diario)
      // Esto es consistente con la lógica de detección de anomalías
      if (consumoAnterior > 0) {
        variacionPorcentual = ((consumoReferencia - consumoAnterior) / consumoAnterior) * 100;

        if (variacionPorcentual > 5) {
          tipoVariacion = 'aumento';
        } else if (variacionPorcentual < -5) {
          tipoVariacion = 'descenso';
        } else {
          tipoVariacion = 'estable';
        }

        if (Math.abs(variacionPorcentual) >= 40) {
          motivosAnomalia.push('variacion_consumo_activa');
        }

        const variacionPromActiva =
          metricasAnteriores.promedioActivaTotal > 0
            ? ((metricasActuales.promedioActivaTotal - metricasAnteriores.promedioActivaTotal) /
                metricasAnteriores.promedioActivaTotal) *
              100
            : null;
        if (variacionPromActiva !== null && Math.abs(variacionPromActiva) >= 40) {
          motivosAnomalia.push('variacion_promedio_activa');
        }

        const variacionEnergia =
          metricasAnteriores.energiaReconstruidaTotal > 0
            ? ((metricasActuales.energiaReconstruidaTotal -
                metricasAnteriores.energiaReconstruidaTotal) /
                metricasAnteriores.energiaReconstruidaTotal) *
              100
            : null;
        if (variacionEnergia !== null && Math.abs(variacionEnergia) >= 40) {
          motivosAnomalia.push('variacion_energia_reconstruida');
        }

        const variacionMaximetro =
          agregadoAnterior.sumaMaximetro > 0
            ? ((agrupado.sumaMaximetro - agregadoAnterior.sumaMaximetro) /
                agregadoAnterior.sumaMaximetro) *
              100
            : null;
        if (variacionMaximetro !== null && Math.abs(variacionMaximetro) >= 40) {
          motivosAnomalia.push('variacion_maximetro');
        }
      }

      const potenciaAnterior =
        agregadoAnterior.registrosPotencia > 0
          ? agregadoAnterior.sumaPotencia / agregadoAnterior.registrosPotencia
          : null;

      if (potenciaPromedio !== null && potenciaAnterior !== null && potenciaAnterior !== 0) {
        variacionPotenciaPorcentual =
          ((potenciaPromedio - potenciaAnterior) / potenciaAnterior) * 100;
      }
    }

    // ==== NUEVAS MÉTRICAS ADICIONALES ====
    // Necesitamos calcularlas después del bucle principal para tener acceso a todos los datos
    // Por ahora retornamos null, se calcularán en un segundo paso
    const zScore: number | null = null;
    const indiceEstacional: number | null = null;
    const tendencia3M: number | null = null;
    const diasDesdeAnomalia: number | null = null;
    const ratioConsumoPotencia = calcularRatioConsumoPotencia(
      consumoReferencia,
      potenciaPromedio,
      dias
    );
    const coeficienteVariacion: number | null = null;

    return {
      año,
      mes,
      periodo,
      consumoTotal: consumoReferencia,
      consumoActivaTotal: metricasActuales.consumoActivaTotal,
      promedioActivaTotal: metricasActuales.promedioActivaTotal,
      maximetroTotal: agrupado.sumaMaximetro,
      energiaReconstruidaTotal: metricasActuales.energiaReconstruidaTotal,
      consumoPromedioDiario,
      potenciaPromedio,
      variacionPotenciaPorcentual,
      dias,
      variacionPorcentual,
      esAnomalia: motivosAnomalia.length > 0,
      tipoVariacion,
      motivosAnomalia,
      registros: agrupado.registros.length,
      zScore,
      indiceEstacional,
      tendencia3M,
      diasDesdeAnomalia,
      ratioConsumoPotencia,
      coeficienteVariacion,
    };
  });

  // ==== SEGUNDO PASO: CALCULAR MÉTRICAS QUE REQUIEREN TODA LA SERIE ====
  const consumosTotales = comparativaMensual.map((c) => c.consumoActivaTotal);
  const coeficienteVariacionGlobal = calcularCoeficienteVariacion(consumosTotales);

  // Calcular promedios históricos por mes (para índice estacional)
  const promediosPorMes = new Map<number, number>();
  const acumuladosPorMes = new Map<number, { suma: number; cantidad: number }>();

  comparativaMensual.forEach((c) => {
    const actual = acumuladosPorMes.get(c.mes) ?? { suma: 0, cantidad: 0 };
    acumuladosPorMes.set(c.mes, {
      suma: actual.suma + c.consumoActivaTotal,
      cantidad: actual.cantidad + 1,
    });
  });

  acumuladosPorMes.forEach((valor, mes) => {
    if (valor.cantidad > 1) {
      // Solo si hay al menos 2 años
      promediosPorMes.set(mes, valor.suma / valor.cantidad);
    }
  });

  // Actualizar cada registro con las métricas calculadas
  comparativaMensual.forEach((registro, index) => {
    registro.zScore = calcularZScore(consumosTotales, index);
    registro.indiceEstacional = calcularIndiceEstacional(
      registro.consumoActivaTotal,
      promediosPorMes.get(registro.mes) ?? null
    );
    registro.tendencia3M = calcularTendencia3M(consumosTotales, index);
    registro.diasDesdeAnomalia = calcularDiasDesdeAnomalia(comparativaMensual, index);
    registro.coeficienteVariacion = coeficienteVariacionGlobal;
  });

  const detallesPorPeriodo: Record<string, DerivacionData[]> = {};
  periodosOrdenados.forEach((periodo) => {
    detallesPorPeriodo[periodo] = datosPorMes[periodo].registros;
  });

  return { comparativa: comparativaMensual, detalles: detallesPorPeriodo };
};

/**
 * Analiza los datos de derivación y genera el análisis completo
 * Replica todas las funcionalidades del Excel
 * @param datos - Array de registros de derivación
 * @returns Resultado del análisis completo con vistas anual y mensual
 */
export const analizarConsumoCompleto = (datos: DerivacionData[]): ResultadoAnalisis => {
  // Generar vista anual
  const vistaAnual = generarVistaAnual(datos);

  // Generar comparativa mensual
  const { comparativa: comparativaMensual, detalles: detallesPorPeriodo } =
    generarComparativaMensual(datos);

  // Calcular periodo total
  const fechas = datos
    .map((d) => {
      const año = extraerAñoDeFormato(d['Fecha desde']);
      const mes = extraerMesDeFormato(d['Fecha desde']);
      return { año, mes, fecha: d['Fecha desde'] };
    })
    .sort((a, b) => a.año - b.año || a.mes - b.mes);

  const periodoTotal = {
    fechaInicio: fechas.length > 0 ? fechas[0].fecha : '',
    fechaFin: fechas.length > 0 ? fechas[fechas.length - 1].fecha : '',
    totalAños: vistaAnual.length,
    totalMeses: comparativaMensual.length,
  };

  // Calcular resumen ejecutivo
  const consumoTotalGeneral = vistaAnual.reduce((suma, año) => suma + año.sumaConsumoActiva, 0);
  const maxMaximetroGeneral = vistaAnual.reduce((max, año) => Math.max(max, año.maxMaximetro), 0);
  const promedioAnual = vistaAnual.length > 0 ? consumoTotalGeneral / vistaAnual.length : 0;
  const anomaliasDetectadas = comparativaMensual.filter((m) => m.esAnomalia).length;

  return {
    vistaAnual,
    comparativaMensual,
    detallesPorPeriodo,
    periodoTotal,
    resumen: {
      consumoTotalGeneral,
      promedioAnual,
      maxMaximetroGeneral,
      totalFacturas: datos.length,
      anomaliasDetectadas,
    },
  };
};

// Re-exportar formatearNumero para retrocompatibilidad
export { formatearNumero };

const COMPORTAMIENTOS_NO_ANOMALIA = new Set([
  'Normal',
  'Sin cambio',
  'Estacionalidad – uso temporal',
  'Cero esperado estacional',
  'Descenso leve',
  'Aumento de consumo',
]);

/**
 * Analiza una serie de consumos mensuales y determina el comportamiento por periodo
 * replicando la lógica empleada en la vista de anomalías.
 * @param datos Serie mensual de consumos
 * @returns Mapa periodo -> análisis detectado
 */
export const analizarComportamientoMensual = (
  datos: ConsumoMensual[]
): Map<string, AnalisisPeriodoConsumo> => {
  const compararPorPeriodo = (a: ConsumoMensual, b: ConsumoMensual) => {
    if (a.año === b.año) {
      return a.mes - b.mes;
    }
    return a.año - b.año;
  };

  const promedioHistoricoPorMes = new Map<number, number>();
  const acumulados = new Map<number, { suma: number; cantidad: number }>();

  datos.forEach((registro) => {
    if (!Number.isFinite(registro.consumoPromedioDiario)) {
      return;
    }

    const actual = acumulados.get(registro.mes) ?? { suma: 0, cantidad: 0 };
    acumulados.set(registro.mes, {
      suma: actual.suma + registro.consumoPromedioDiario,
      cantidad: actual.cantidad + 1,
    });
  });

  acumulados.forEach((valor, mes) => {
    if (valor.cantidad > 0) {
      promedioHistoricoPorMes.set(mes, valor.suma / valor.cantidad);
    }
  });

  const consumos = datos
    .map((registro) => (registro.dias > 0 ? registro.consumoTotal / registro.dias : null))
    .filter((valor): valor is number => typeof valor === 'number' && Number.isFinite(valor));

  const promedioGlobalConsumoDiario =
    consumos.length === 0
      ? null
      : consumos.reduce((acumulado, valor) => acumulado + valor, 0) / consumos.length;

  const ordenados = [...datos].sort(compararPorPeriodo);
  const registrosPorPeriodo = new Map<string, ConsumoMensual>();
  const resultado = new Map<string, AnalisisPeriodoConsumo>();
  let totalZerosPrevios = 0;
  let consecutivosZeros = 0;
  let cambioPotenciaActivo = false;

  // Primera pasada: detectar descensos mes a mes (usando consumo TOTAL)
  const descentosPorIndice = new Map<number, boolean>();

  ordenados.forEach((registro, indice) => {
    registrosPorPeriodo.set(registro.periodo, registro);
    const anterior = indice > 0 ? ordenados[indice - 1] : undefined;

    if (anterior && anterior.consumoTotal !== 0 && registro.consumoTotal !== null) {
      const variacionMes =
        ((registro.consumoTotal - anterior.consumoTotal) / anterior.consumoTotal) * 100;
      // Marcar descenso si es negativo
      if (variacionMes < 0) {
        descentosPorIndice.set(indice, true);
      }
    }
  });

  // Identificar descensos sostenidos (3+ meses en ventana de 5 meses, tolerando 1-2 meses de recuperación)
  const indicesDescentoSostenido = new Set<number>();
  for (let i = 0; i < ordenados.length; i++) {
    if (descentosPorIndice.get(i)) {
      // Contar descensos en ventana de hasta 5 meses permitiendo máximo 2 meses sin descenso
      let descuentosEnVentana = 0;
      let mesesSinDescenso = 0;
      let ventanaFin = i;

      for (let j = i; j < Math.min(i + 5, ordenados.length); j++) {
        if (descentosPorIndice.get(j)) {
          descuentosEnVentana += 1;
          mesesSinDescenso = 0; // Reset contador
        } else {
          mesesSinDescenso += 1;
          // Si llegamos a 3 meses sin descenso, salir de la ventana
          if (mesesSinDescenso >= 3) {
            break;
          }
        }
        ventanaFin = j;
      }

      // Si hay 3 o más descensos en la ventana, marcar TODO como sostenido (incluyendo recuperaciones)
      if (descuentosEnVentana >= 3) {
        for (let j = i; j <= ventanaFin; j++) {
          indicesDescentoSostenido.add(j);
        }
      }
    }
  }

  // Calcular MÁXIMO histórico por mes (para detectar descensos desde picos)
  const maximoHistoricoPorMes = new Map<number, number>();
  datos.forEach((registro) => {
    const consumoTotal = registro.consumoTotal;
    const maximoActual = maximoHistoricoPorMes.get(registro.mes) ?? 0;
    if (consumoTotal > maximoActual) {
      maximoHistoricoPorMes.set(registro.mes, consumoTotal);
    }
  });

  // Umbrales de clasificación de comportamiento (basados en análisis estadístico)
  const UMBRALES = {
    DESCENSO_FUERTE: -40, // Descenso fuerte (anomalía) - variaciones críticas
    DESCENSO_MODERADO: -20, // Descenso moderado - variaciones significativas
    DESCENSO_LEVE: -10, // Descenso leve - variaciones normales
    VARIACION_INUSUAL: 60, // Variación histórica inusual (±60% respecto al promedio)
    AUMENTO_SIGNIFICATIVO: 50, // Aumento de consumo significativo
    SIN_CAMBIO: 5, // Sin cambio (±5%)
  };

  ordenados.forEach((registro, indice) => {
    registrosPorPeriodo.set(registro.periodo, registro);
    const consumoPromedioActual = registro.dias > 0 ? registro.consumoTotal / registro.dias : null;
    const promedioHistorico = promedioHistoricoPorMes.get(registro.mes) ?? null;
    const maximoHistorico = maximoHistoricoPorMes.get(registro.mes) ?? null;

    const variacionHistorica =
      promedioHistorico === null || promedioHistorico === 0 || consumoPromedioActual === null
        ? null
        : ((consumoPromedioActual - promedioHistorico) / promedioHistorico) * 100;

    // Variación respecto al MÁXIMO histórico del mismo mes
    const variacionDesdeMaximo =
      maximoHistorico === null || maximoHistorico === 0 || registro.consumoTotal === null
        ? null
        : ((registro.consumoTotal - maximoHistorico) / maximoHistorico) * 100;

    const variacionGlobal =
      promedioGlobalConsumoDiario === null ||
      promedioGlobalConsumoDiario === 0 ||
      consumoPromedioActual === null
        ? null
        : ((consumoPromedioActual - promedioGlobalConsumoDiario) / promedioGlobalConsumoDiario) *
          100;

    // Obtener variación mes-a-mes comparando CONSUMO TOTAL (no promedio diario)
    const anterior = indice > 0 ? ordenados[indice - 1] : undefined;
    let variacionMesMes: number | null = null;
    if (anterior && anterior.consumoTotal !== 0 && registro.consumoTotal !== null) {
      // Comparar consumo TOTAL directamente
      variacionMesMes =
        ((registro.consumoTotal - anterior.consumoTotal) / anterior.consumoTotal) * 100;
    }

    const siguiente = indice < ordenados.length - 1 ? ordenados[indice + 1] : undefined;

    const consumoEsCero = registro.consumoTotal === 0;
    const habiaCeroAntes = totalZerosPrevios > 0;
    const repetidoMasDeDos = consumoEsCero && consecutivosZeros + 1 > 2;
    const variacionPosterior = siguiente?.variacionPorcentual;
    const incrementoPosterior =
      consumoEsCero && typeof variacionPosterior === 'number' && variacionPosterior >= 40;
    const potenciaActual = registro.potenciaPromedio;
    const potenciaPeriodoAnterior =
      indice > 0 ? ordenados[indice - 1].potenciaPromedio : potenciaActual;

    if (indice > 0 && potenciaActual !== potenciaPeriodoAnterior) {
      cambioPotenciaActivo = true;
    }

    let comportamiento = 'Normal';
    let ceroEsperadoPersistente = false;

    // Prioridad 1: Detección de ceros
    if (consumoEsCero && (!habiaCeroAntes || repetidoMasDeDos || incrementoPosterior)) {
      comportamiento = 'Cero sospechoso';
    } else if (consumoEsCero) {
      comportamiento = 'Cero esperado estacional';
      ceroEsperadoPersistente = true;
    }
    // Prioridad 2: Cambio de potencia
    else if (cambioPotenciaActivo) {
      comportamiento = 'Cambio de potencia';
    }
    // Prioridad 3: Clasificar descensos y aumentos por variación mes-a-mes
    else if (variacionMesMes !== null) {
      if (variacionMesMes < UMBRALES.DESCENSO_FUERTE) {
        // < -40%
        comportamiento = 'Descenso fuerte (anomalía)';
      } else if (variacionMesMes < UMBRALES.DESCENSO_MODERADO) {
        // -40% a -20%
        comportamiento = 'Descenso moderado';
      } else if (variacionMesMes < UMBRALES.DESCENSO_LEVE) {
        // -20% a -10%
        comportamiento = 'Descenso leve';
      } else if (variacionMesMes < 0) {
        // -10% a 0% (descensos menores)
        comportamiento = 'Descenso leve';
      } else if (variacionMesMes <= UMBRALES.SIN_CAMBIO) {
        // 0% a +5% - PERO verificar si hay descenso desde máximo histórico
        if (variacionDesdeMaximo !== null && variacionDesdeMaximo < UMBRALES.DESCENSO_FUERTE) {
          comportamiento = 'Descenso fuerte (anomalía)';
        } else if (
          variacionDesdeMaximo !== null &&
          variacionDesdeMaximo < UMBRALES.DESCENSO_MODERADO
        ) {
          comportamiento = 'Descenso moderado';
        } else if (variacionDesdeMaximo !== null && variacionDesdeMaximo < UMBRALES.DESCENSO_LEVE) {
          comportamiento = 'Descenso leve';
        } else {
          comportamiento = 'Sin cambio';
        }
      } else if (variacionMesMes >= UMBRALES.AUMENTO_SIGNIFICATIVO) {
        // >= +50%
        comportamiento = 'Aumento de consumo';
      } else {
        // +5% a +50% (aumentos moderados) - PERO verificar descenso desde máximo
        if (variacionDesdeMaximo !== null && variacionDesdeMaximo < UMBRALES.DESCENSO_FUERTE) {
          comportamiento = 'Descenso fuerte (anomalía)';
        } else if (
          variacionDesdeMaximo !== null &&
          variacionDesdeMaximo < UMBRALES.DESCENSO_MODERADO
        ) {
          comportamiento = 'Descenso moderado';
        } else if (variacionDesdeMaximo !== null && variacionDesdeMaximo < UMBRALES.DESCENSO_LEVE) {
          comportamiento = 'Descenso leve';
        } else {
          comportamiento = 'Sin cambio';
        }
      }
    }
    // Prioridad 4: Si no hay variación mes-a-mes, usar variación histórica
    else if (variacionHistorica !== null) {
      if (Math.abs(variacionHistorica) >= UMBRALES.VARIACION_INUSUAL) {
        comportamiento = 'Variación inusual respecto al promedio histórico';
      } else if (variacionHistorica >= UMBRALES.AUMENTO_SIGNIFICATIVO) {
        comportamiento = 'Aumento de consumo';
      } else if (Math.abs(variacionHistorica) <= UMBRALES.SIN_CAMBIO) {
        comportamiento = 'Sin cambio';
      }
    }
    // Prioridad 5: Usar variación global como último recurso
    else if (variacionGlobal !== null) {
      if (variacionGlobal >= UMBRALES.AUMENTO_SIGNIFICATIVO) {
        comportamiento = 'Aumento de consumo';
      } else if (Math.abs(variacionGlobal) <= UMBRALES.SIN_CAMBIO) {
        comportamiento = 'Sin cambio';
      }
    }

    resultado.set(registro.periodo, {
      variacionHistorica,
      variacionGlobal,
      comportamiento,
      ceroEsperado: ceroEsperadoPersistente,
    });

    if (consumoEsCero) {
      consecutivosZeros += 1;
      totalZerosPrevios += 1;
    } else {
      consecutivosZeros = 0;
    }
  });

  const mesesConConsumo = new Map<number, number>();
  const mesesCero = new Map<number, number>();

  ordenados.forEach((registro) => {
    const conteoConsumo = mesesConConsumo.get(registro.mes) ?? 0;
    const conteoCeros = mesesCero.get(registro.mes) ?? 0;

    if (registro.consumoTotal === 0) {
      mesesCero.set(registro.mes, conteoCeros + 1);
    } else {
      mesesConConsumo.set(registro.mes, conteoConsumo + 1);
    }
  });

  resultado.forEach((valor, periodo) => {
    const registro = registrosPorPeriodo.get(periodo);
    if (!registro) {
      return;
    }

    const totalConsumoMes = mesesConConsumo.get(registro.mes) ?? 0;
    const totalCerosMes = mesesCero.get(registro.mes) ?? 0;
    const totalPeriodosMes = totalConsumoMes + totalCerosMes;

    if (
      valor.ceroEsperado &&
      totalConsumoMes >= 1 &&
      totalCerosMes >= totalConsumoMes &&
      totalPeriodosMes >= 3
    ) {
      const nuevoValor = resultado.get(periodo);
      if (nuevoValor) {
        nuevoValor.comportamiento = 'Estacionalidad – uso temporal';
        nuevoValor.ceroEsperado = true;
        resultado.set(periodo, nuevoValor);
      }
    }
  });

  return resultado;
};

/**
 * Determina si un comportamiento detectado debe marcarse como anomalía.
 * @param analisis Resultado del análisis por periodo
 * @returns Verdadero si el comportamiento es anómalo
 */
export const esComportamientoAnomalo = (
  analisis: AnalisisPeriodoConsumo | null | undefined
): boolean => {
  if (!analisis) {
    return false;
  }
  return !COMPORTAMIENTOS_NO_ANOMALIA.has(analisis.comportamiento);
};
