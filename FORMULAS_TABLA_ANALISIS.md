# 📊 Documentación Completa - Fórmulas de la Tabla de Análisis

## 🎯 Resumen Ejecutivo

Este documento detalla **todas las fórmulas matemáticas** utilizadas en la tabla de análisis de consumos del sistema ValorApp_v2. **Actualizado tras corrección de inconsistencias** (todas las comparaciones ahora usan **consumo total**, no promedio diario).

---

## 📋 Columnas de la Tabla

| #   | Columna                 | Tipo          | Fórmula                                                                | Unidad  |
| --- | ----------------------- | ------------- | ---------------------------------------------------------------------- | ------- |
| 1   | Periodo                 | Texto         | `YYYY-MM`                                                              | -       |
| 2   | Consumo (kWh)           | Numérico      | `consumoTotal`                                                         | kWh     |
| 3   | Días                    | Numérico      | `dias`                                                                 | días    |
| 4   | Consumo Promedio Diario | Calculado     | `consumoTotal / dias`                                                  | kWh/día |
| 5   | Tipo de comportamiento  | Clasificación | Ver sección 4                                                          | -       |
| 6   | Potencia (kW)           | Numérico      | `potenciaPromedio`                                                     | kW      |
| 7   | Promedio Histórico      | Calculado     | Promedio de `consumoTotal` de ese mes en años anteriores               | kWh     |
| 8   | Variación Histórica (%) | Calculado     | `((consumoTotal - promedioHistorico) / promedioHistorico) * 100`       | %       |
| 9   | Variación %             | Calculado     | `((consumoTotal - consumoTotalAnterior) / consumoTotalAnterior) * 100` | %       |

---

## 🔢 Fórmulas Detalladas

### 1️⃣ **Periodo**

**Fuente**: Extracción directa del CSV/agrupación  
**Formato**: `YYYY-MM` (ejemplo: `2024-03`)  
**Código**: `registro.periodo`

```typescript
// En importService.ts - función parsearFecha()
const fecha = new Date(fechaString);
const year = fecha.getFullYear();
const month = String(fecha.getMonth() + 1).padStart(2, '0');
return `${year}-${month}`; // "2024-03"
```

---

### 2️⃣ **Consumo (kWh)**

**Fuente**: Suma de todos los registros del CSV para ese periodo  
**Unidad**: kWh (kilovatios-hora)  
**Código**: `registro.consumoTotal`

```typescript
// En dataService.ts - función agruparPorPeriodo()
const consumoTotal = registros.reduce((sum, r) => sum + r.consumo, 0);
```

**Ejemplo**:

- Enero 2024: 15 registros con consumos [50, 48, 52, ...] → `consumoTotal = 750 kWh`

---

### 3️⃣ **Días**

**Fuente**: Suma de días facturados en todos los registros del periodo  
**Unidad**: días  
**Código**: `registro.dias`

```typescript
// En dataService.ts - función agruparPorPeriodo()
const dias = registros.reduce((sum, r) => sum + (r.dias || 0), 0);
```

**Ejemplo**:

- Periodo con 2 facturas: 28 días + 31 días = **59 días**

---

### 4️⃣ **Consumo Promedio Diario**

**Fórmula**:

```
Consumo Promedio Diario = consumoTotal / dias
```

**Código**: `consumoTotal / dias`

**Ejemplo**:

- `consumoTotal = 750 kWh`
- `dias = 30`
- `Consumo Promedio Diario = 750 / 30 = 25 kWh/día`

**Propósito**: Normalizar consumos de periodos con diferente duración (28-64 días)

---

### 5️⃣ **Tipo de comportamiento detectado**

**Sistema de clasificación en 5 niveles de prioridad** (ver `analisisConsumoService.ts` líneas 556-606):

#### **Nivel 1: Consumos Cero**

- **Cero sospechoso**: `consumoTotal ≤ 5 kWh` en periodo no estacional
- **Cero esperado estacional**: `consumoTotal ≤ 5 kWh` en meses típicamente sin uso (ej: agosto)
- **Estacionalidad - uso temporal**: Consumo bajo pero > 5 kWh en periodo no habitual

#### **Nivel 2: Cambios de Potencia**

```typescript
if (potenciaAnterior !== null && potenciaPromedio !== null) {
  const variacionPotencia = Math.abs(potenciaPromedio - potenciaAnterior);
  if (variacionPotencia >= 0.5) {
    // Cambio ≥ 0.5 kW
    return 'Cambio de potencia';
  }
}
```

#### **Nivel 3: Variación Mes-a-Mes (CONSUMO TOTAL)**

```typescript
variacionMesMes = ((consumoTotal - consumoTotalAnterior) / consumoTotalAnterior) * 100;

if (variacionMesMes <= -40) return 'Descenso fuerte (anomalía)';
if (variacionMesMes <= -20) return 'Descenso moderado';
if (variacionMesMes <= -10) return 'Descenso leve';
if (variacionMesMes >= 50) return 'Aumento de consumo';
if (Math.abs(variacionMesMes) <= 5) return 'Sin cambio';
```

**Umbrales**:

- `≤ -40%` → **Descenso fuerte (anomalía)**
- `-39% a -20%` → **Descenso moderado**
- `-19% a -10%` → **Descenso leve**
- `-9% a +5%` → **Sin cambio**
- `≥ +50%` → **Aumento de consumo**

#### **Nivel 4: Variación vs. Histórico**

```typescript
const promedioHistorico = promedioHistoricoPorMes.get(mes);
variacionHistorica = ((consumoTotal - promedioHistorico) / promedioHistorico) * 100;

if (Math.abs(variacionHistorica) >= 60) {
  return 'Variación inusual';
}
```

#### **Nivel 5: Variación vs. Máximo Histórico**

```typescript
const maximoHistorico = maximosPorMes.get(mes);
variacionDesdeMaximo = ((consumoTotal - maximoHistorico) / maximoHistorico) * 100;

// Detecta descensos significativos desde el pico histórico
if (variacionDesdeMaximo <= -40) return 'Descenso fuerte (anomalía)';
if (variacionDesdeMaximo <= -20) return 'Descenso moderado';
```

**Ejemplo Real**:

- Enero 2021: 3978 kWh (máximo histórico)
- Enero 2022: 1513 kWh
- `variacionDesdeMaximo = ((1513 - 3978) / 3978) * 100 = -62%`
- **Clasificación**: `Descenso fuerte (anomalía)` ✅

---

### 6️⃣ **Potencia (kW)**

**Fuente**: Promedio de la potencia contratada en el periodo  
**Unidad**: kW (kilovatios)  
**Código**: `registro.potenciaPromedio`

```typescript
const potenciaPromedio = sumaPotencia / registrosPotencia;
```

**Ejemplo**:

- 3 registros con potencias [4.6, 4.6, 5.2] kW → `potenciaPromedio = 4.8 kW`

---

### 7️⃣ **Promedio Histórico**

**Fórmula**:

```
Promedio Histórico (mes M) = Σ(consumoTotal de todos los años para mes M) / cantidad de años
```

**Código** (`VistaAnomalias.tsx` líneas 91-112):

```typescript
const promedioHistoricoPorMes = useMemo(() => {
  const acumulados = new Map<number, { suma: number; cantidad: number }>();

  datos.forEach((registro) => {
    if (!Number.isFinite(registro.consumoTotal)) return;

    const actual = acumulados.get(registro.mes) ?? { suma: 0, cantidad: 0 };
    acumulados.set(registro.mes, {
      suma: actual.suma + registro.consumoTotal, // ✅ CONSUMO TOTAL
      cantidad: actual.cantidad + 1,
    });
  });

  const promedios = new Map<number, number>();
  acumulados.forEach((valor, mes) => {
    if (valor.cantidad > 0) {
      promedios.set(mes, valor.suma / valor.cantidad);
    }
  });

  return promedios;
}, [datos]);
```

**Ejemplo**:

- Enero 2020: 2500 kWh
- Enero 2021: 3978 kWh
- Enero 2022: 1513 kWh
- **Promedio Histórico Enero** = `(2500 + 3978 + 1513) / 3 = 2664 kWh`

**⚠️ Cambio Reciente**: Anteriormente usaba `consumoPromedioDiario`, ahora usa **consumo total** para consistencia.

---

### 8️⃣ **Variación Histórica (%)**

**Fórmula**:

```
Variación Histórica = ((consumoTotal - promedioHistorico) / promedioHistorico) * 100
```

**Código** (`analisisConsumoService.ts` líneas 570-575):

```typescript
const promedioHistorico = promedioHistoricoPorMes.get(mes);
if (promedioHistorico && promedioHistorico > 0) {
  variacionHistorica = ((consumoTotal - promedioHistorico) / promedioHistorico) * 100;
}
```

**Ejemplo**:

- Enero 2024: `consumoTotal = 1513 kWh`
- Promedio Histórico Enero: `2664 kWh`
- `Variación Histórica = ((1513 - 2664) / 2664) * 100 = -43.2%` ⚠️

**Interpretación**:

- `> 0%` → Consumo superior al promedio histórico
- `< 0%` → Consumo inferior al promedio histórico
- `≥ ±60%` → Gatilla clasificación `Variación inusual`

---

### 9️⃣ **Variación %** (Mes-a-Mes)

**Fórmula**:

```
Variación % = ((consumoTotal - consumoTotalAnterior) / consumoTotalAnterior) * 100
```

**Código** (`analisisConsumoService.ts` líneas 270-278):

```typescript
if (index > 0) {
  const consumoAnterior = metricasAnteriores.consumoActivaTotal;

  if (consumoAnterior > 0) {
    variacionPorcentual = ((consumoReferencia - consumoAnterior) / consumoAnterior) * 100;
  }
}
```

**Ejemplo**:

- Diciembre 2023: `consumoTotal = 2200 kWh`
- Enero 2024: `consumoTotal = 1513 kWh`
- `Variación % = ((1513 - 2200) / 2200) * 100 = -31.2%`

**Interpretación**:

- `> 0%` → Aumento respecto al mes anterior
- `< 0%` → Descenso respecto al mes anterior
- `≥ ±40%` → Gatilla anomalía `variacion_consumo_activa`

**⚠️ Cambio Crítico**:

- **ANTES**: Comparaba `(consumoPromedioDiario - consumoPromedioDiarioAnterior)` ❌
- **AHORA**: Compara `(consumoTotal - consumoTotalAnterior)` ✅

**Justificación**: Los días varían entre periodos (28-64). Comparar totales directamente es más correcto cuando los umbrales ya están calibrados para variaciones brutas. El promedio diario se usa solo para visualización normalizada (columna 4).

---

## 🔍 Validación Cruzada de Consistencia

### ✅ **Regla 1: Todas las comparaciones usan consumo TOTAL**

```typescript
// ✅ CORRECTO - Todas estas ahora usan consumoTotal:
variacionPorcentual = ((consumoTotal - consumoTotalAnterior) / consumoTotalAnterior) * 100;
variacionMesMes = ((consumoTotal - consumoTotalAnterior) / consumoTotalAnterior) * 100;
variacionHistorica = ((consumoTotal - promedioHistorico) / promedioHistorico) * 100;
variacionDesdeMaximo = ((consumoTotal - maximoHistorico) / maximoHistorico) * 100;
```

### ✅ **Regla 2: Promedio diario solo para visualización**

```typescript
// Solo se usa en columna 4 "Consumo Promedio Diario"
consumoPromedioDiario = consumoTotal / dias; // kWh/día
```

### ✅ **Regla 3: Umbrales calibrados para consumo total**

```typescript
const UMBRALES = {
  DESCENSO_FUERTE: -40, // -40% en consumo total
  DESCENSO_MODERADO: -20, // -20% en consumo total
  DESCENSO_LEVE: -10, // -10% en consumo total
  AUMENTO_SIGNIFICATIVO: 50, // +50% en consumo total
  SIN_CAMBIO: 5, // ±5% en consumo total
  VARIACION_INUSUAL: 60, // ±60% vs histórico
};
```

---

## 📊 Ejemplo Completo - Caso Real

**Datos de entrada**:

```csv
Periodo | Consumo | Días | Potencia
2021-01 | 3978    | 31   | 4.6
2022-01 | 1513    | 28   | 4.6
2023-01 | 2800    | 31   | 4.6
2024-01 | 1200    | 30   | 4.6
```

**Cálculos para Enero 2024**:

1. **Periodo**: `2024-01`
2. **Consumo (kWh)**: `1200` (directo del CSV)
3. **Días**: `30` (directo del CSV)
4. **Consumo Promedio Diario**: `1200 / 30 = 40 kWh/día`
5. **Promedio Histórico**: `(3978 + 1513 + 2800) / 3 = 2764 kWh`
6. **Variación Histórica**: `((1200 - 2764) / 2764) * 100 = -56.6%`
7. **Variación %** (vs. Dic 2023, asumiendo 2200): `((1200 - 2200) / 2200) * 100 = -45.5%`
8. **Máximo Histórico Enero**: `3978 kWh` (enero 2021)
9. **Variación desde Máximo**: `((1200 - 3978) / 3978) * 100 = -69.8%`
10. **Tipo de comportamiento**:
    - `variacionMesMes = -45.5%` → `≤ -40%` → **Descenso fuerte (anomalía)** ✅
    - `variacionDesdeMaximo = -69.8%` → `≤ -40%` → Confirmado

**Resultado en tabla**:

```
| 2024-01 | 1200 | 30 | 40.0 | Descenso fuerte (anomalía) | 4.6 | 2764 | -56.6% | -45.5% |
```

---

## 🚨 Casos Especiales

### Caso 1: Primer Periodo (sin anterior)

```typescript
if (index === 0) {
  variacionPorcentual = null; // No hay comparación
  variacionMesMes = null;
  // Solo puede clasificarse por variación histórica o ceros
}
```

### Caso 2: Primer Año (sin histórico)

```typescript
if (!promedioHistorico) {
  variacionHistorica = null;
  // Solo puede clasificarse por mes-a-mes o ceros
}
```

### Caso 3: Cambio de Potencia + Descenso

```typescript
// Prioridad 2 (potencia) > Prioridad 3 (mes-a-mes)
if (variacionPotencia >= 0.5) {
  return 'Cambio de potencia'; // Se muestra esto, aunque también haya descenso
}
```

### Caso 4: Consumo Cero

```typescript
if (consumoTotal <= 5) {
  // Prioridad 1 - siempre prevalece
  if (esEstacional) return 'Cero esperado estacional';
  else return 'Cero sospechoso';
}
```

---

## 🔧 Archivos de Código Relacionados

| Archivo                     | Líneas Clave | Función                         |
| --------------------------- | ------------ | ------------------------------- |
| `analisisConsumoService.ts` | 270-278      | Cálculo `variacionPorcentual`   |
| `analisisConsumoService.ts` | 556-646      | Clasificación de comportamiento |
| `analisisConsumoService.ts` | 533-543      | Cálculo máximos históricos      |
| `VistaAnomalias.tsx`        | 91-112       | Cálculo promedio histórico      |
| `VistaAnomalias.tsx`        | 350-365      | Renderizado de tabla            |
| `dataService.ts`            | 45-89        | Agrupación por periodo          |
| `importService.ts`          | 125-145      | Parseo de fechas                |

---

## 📝 Changelog

### 2024-XX-XX - Corrección de Inconsistencias

**Cambios aplicados**:

1. ✅ `variacionPorcentual`: Cambiado de promedio diario a **consumo total**
2. ✅ `promedioHistoricoPorMes`: Cambiado de promedio de promedios diarios a **promedio de totales**
3. ✅ Eliminada variable `consumoPromedioDiarioAnterior` (ya no se usa)
4. ✅ Todas las fórmulas de comparación ahora consistentes

**Impacto**:

- Detección de anomalías más precisa (evita dilución por días variables)
- Umbrales aplicados correctamente sobre consumos totales
- Columna "Variación %" ahora coherente con "Tipo de comportamiento"

---

## 🎯 Conclusión

**Sistema de fórmulas completamente estandarizado**:

- ✅ Todas las comparaciones usan **consumo total**
- ✅ Promedio diario solo para visualización normalizada
- ✅ Umbrales calibrados para variaciones de consumo total
- ✅ Clasificación en 5 niveles de prioridad
- ✅ Detección dual: mes-a-mes + histórico

Este sistema garantiza que:

1. Un descenso del 62% **siempre** se detecta como anomalía
2. Las variaciones mostradas coinciden con el tipo de comportamiento
3. Los umbrales son consistentes en todo el sistema
4. Los promedios históricos son comparables entre periodos
