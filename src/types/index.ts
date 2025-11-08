/**
 * 📋 Tipos y Definiciones Globales de ValorApp_v2
 * 
 * Archivo centralizado de tipos TypeScript para mantener
 * consistencia en toda la aplicación.
 */

// ============================================
// 📊 Tipos de Datos de Consumo Energético
// ============================================

/**
 * Representa un registro individual de consumo energético
 */
export interface ConsumoEnergetico {
  /** Identificador único del registro */
  id: string;
  /** Fecha de la lectura (formato ISO 8601) */
  fecha: string;
  /** Consumo en kWh */
  consumo: number;
  /** Periodo de facturación (ej: "2024-01") */
  periodo: string;
  /** Número de contador */
  numeroContador: string;
  /** Cliente o contrato asociado */
  cliente?: string;
}

/**
 * Datos agregados por periodo (mes/año)
 */
export interface ConsumoPeriodo {
  /** Periodo en formato YYYY-MM */
  periodo: string;
  /** Consumo total del periodo en kWh */
  consumoTotal: number;
  /** Consumo promedio diario */
  consumoPromedio: number;
  /** Número de días del periodo */
  dias: number;
}

// ============================================
// 🔍 Tipos para Detección de Anomalías
// ============================================

/**
 * Tipo de anomalía detectada
 */
export type TipoAnomalia = 
  | 'descenso_abrupto'    // Descenso repentino > 30%
  | 'descenso_gradual'    // Descenso progresivo
  | 'consumo_cero'        // Consumo nulo o casi nulo
  | 'consumo_negativo'    // Valores negativos (error)
  | 'pico_anomalo';       // Incremento inusual

/**
 * Nivel de severidad de la anomalía
 */
export type NivelSeveridad = 'baja' | 'media' | 'alta' | 'critica';

/**
 * Anomalía detectada en el consumo
 */
export interface Anomalia {
  /** ID único de la anomalía */
  id: string;
  /** Tipo de anomalía detectada */
  tipo: TipoAnomalia;
  /** Periodo donde se detectó */
  periodo: string;
  /** Fecha exacta de detección */
  fechaDeteccion: string;
  /** Nivel de severidad */
  severidad: NivelSeveridad;
  /** Porcentaje de variación respecto al promedio */
  variacionPorcentaje: number;
  /** Consumo esperado en kWh */
  consumoEsperado: number;
  /** Consumo real en kWh */
  consumoReal: number;
  /** Descripción detallada */
  descripcion: string;
  /** Es la primera anomalía en una serie */
  esPrimeraOcurrencia: boolean;
}

// ============================================
// 📈 Tipos para Análisis y Estadísticas
// ============================================

/**
 * Estadísticas de consumo
 */
export interface EstadisticasConsumo {
  /** Promedio de consumo en kWh */
  promedio: number;
  /** Mediana de consumo */
  mediana: number;
  /** Desviación estándar */
  desviacionEstandar: number;
  /** Consumo mínimo registrado */
  minimo: number;
  /** Consumo máximo registrado */
  maximo: number;
  /** Total de registros analizados */
  totalRegistros: number;
}

/**
 * Comparativa entre dos periodos
 */
export interface ComparativaPeriodos {
  /** Periodo anterior */
  periodoAnterior: ConsumoPeriodo;
  /** Periodo actual */
  periodoActual: ConsumoPeriodo;
  /** Diferencia absoluta en kWh */
  diferenciaAbsoluta: number;
  /** Diferencia porcentual */
  diferenciaPorcentual: number;
  /** Tendencia: 'aumento' | 'descenso' | 'estable' */
  tendencia: 'aumento' | 'descenso' | 'estable';
}

// ============================================
// 🎨 Tipos para Visualización
// ============================================

/**
 * Punto de datos para gráficos
 */
export interface PuntoGrafico {
  /** Etiqueta del eje X */
  etiqueta: string;
  /** Valor del eje Y */
  valor: number;
  /** Color (opcional) */
  color?: string;
  /** Metadatos adicionales */
  metadata?: Record<string, unknown>;
}

/**
 * Configuración de gráfico
 */
export interface ConfiguracionGrafico {
  /** Título del gráfico */
  titulo: string;
  /** Tipo de gráfico */
  tipo: 'linea' | 'barra' | 'area' | 'circular';
  /** Datos a visualizar */
  datos: PuntoGrafico[];
  /** Mostrar leyenda */
  mostrarLeyenda?: boolean;
  /** Color primario */
  colorPrimario?: string;
  /** Color secundario */
  colorSecundario?: string;
}

// ============================================
// 🔧 Tipos de Estado y Contexto
// ============================================

/**
 * Estado global de la aplicación
 */
export interface EstadoApp {
  /** Datos de consumo cargados */
  consumos: ConsumoEnergetico[];
  /** Anomalías detectadas */
  anomalias: Anomalia[];
  /** Periodo seleccionado actualmente */
  periodoSeleccionado: string | null;
  /** Indica si hay datos cargados */
  datosCargados: boolean;
  /** Indica si se está procesando */
  procesando: boolean;
  /** Mensaje de error (si aplica) */
  error: string | null;
}

// ============================================
// 📁 Tipos para Importación de Datos
// ============================================

/**
 * Resultado de importación de archivo
 */
export interface ResultadoImportacion {
  /** Indica si la importación fue exitosa */
  exito: boolean;
  /** Número de registros importados */
  registrosImportados: number;
  /** Errores encontrados durante la importación */
  errores: string[];
  /** Advertencias (opcional) */
  advertencias?: string[];
  /** Datos importados */
  datos: ConsumoEnergetico[];
}

/**
 * Opciones de importación
 */
export interface OpcionesImportacion {
  /** Formato del archivo */
  formato: 'csv' | 'json' | 'excel';
  /** Delimitador (para CSV) */
  delimitador?: string;
  /** Codificación del archivo */
  codificacion?: string;
  /** Validar datos al importar */
  validar?: boolean;
}
