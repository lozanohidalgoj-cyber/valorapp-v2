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
  return Object.keys(datosPorAño)
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
};

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
      const diasAnteriores = agregadoAnterior.sumaDias;
      const consumoPromedioDiarioAnterior =
        diasAnteriores > 0 ? consumoAnterior / diasAnteriores : null;

      if (consumoPromedioDiarioAnterior !== null && consumoPromedioDiarioAnterior > 0) {
        variacionPorcentual =
          ((consumoPromedioDiario - consumoPromedioDiarioAnterior) /
            consumoPromedioDiarioAnterior) *
          100;

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
    };
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

  // Primera pasada: detectar descensos mes a mes
  const descentosPorIndice = new Map<number, boolean>();

  ordenados.forEach((registro, indice) => {
    registrosPorPeriodo.set(registro.periodo, registro);
    const consumoPromedioActual = registro.dias > 0 ? registro.consumoTotal / registro.dias : null;
    const anterior = indice > 0 ? ordenados[indice - 1] : undefined;
    const consumoPromedioAnterior =
      anterior && anterior.dias > 0 ? anterior.consumoTotal / anterior.dias : null;

    if (
      consumoPromedioAnterior !== null &&
      consumoPromedioAnterior !== 0 &&
      consumoPromedioActual !== null
    ) {
      const variacionMes =
        ((consumoPromedioActual - consumoPromedioAnterior) / consumoPromedioAnterior) * 100;
      // Marcar descenso si es negativo (cualquier descenso, no solo >= -30%)
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

      // Si hay 3 o más descensos en la ventana, marcar todo como sostenido
      if (descuentosEnVentana >= 3) {
        for (let j = i; j <= ventanaFin; j++) {
          indicesDescentoSostenido.add(j);
        }
      }
    }
  }

  ordenados.forEach((registro, indice) => {
    registrosPorPeriodo.set(registro.periodo, registro);
    const consumoPromedioActual = registro.dias > 0 ? registro.consumoTotal / registro.dias : null;
    const promedioHistorico = promedioHistoricoPorMes.get(registro.mes) ?? null;
    const variacionHistorica =
      promedioHistorico === null || promedioHistorico === 0 || consumoPromedioActual === null
        ? null
        : ((consumoPromedioActual - promedioHistorico) / promedioHistorico) * 100;
    const variacionGlobal =
      promedioGlobalConsumoDiario === null ||
      promedioGlobalConsumoDiario === 0 ||
      consumoPromedioActual === null
        ? null
        : ((consumoPromedioActual - promedioGlobalConsumoDiario) / promedioGlobalConsumoDiario) *
          100;
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

    if (consumoEsCero && (!habiaCeroAntes || repetidoMasDeDos || incrementoPosterior)) {
      comportamiento = 'Cero sospechoso';
    } else if (consumoEsCero) {
      comportamiento = 'Cero esperado estacional';
      ceroEsperadoPersistente = true;
    } else if (descentosPorIndice.has(indice)) {
      // Marcar como descenso ANY mes con descenso mes-a-mes (no solo rachas sostenidas)
      comportamiento = 'Descenso brusco mes a mes';
    }

    if (comportamiento === 'Normal' && cambioPotenciaActivo) {
      comportamiento = 'Cambio de potencia';
    } else if (comportamiento === 'Normal' && variacionGlobal !== null) {
      if (variacionGlobal >= 30) {
        comportamiento = 'Aumento de consumo';
      } else if (Math.abs(variacionGlobal) <= 5) {
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
