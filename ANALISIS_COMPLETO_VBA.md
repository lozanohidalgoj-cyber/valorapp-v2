# 📊 ANÁLISIS EXHAUSTIVO - Código VBA y Macro Excel

**Fecha de análisis:** 8 de noviembre de 2025  
**Archivo fuente:** `Codigo_Completo.txt` + `Macro 2025 ejemplo.xlsm`  
**Objetivo:** Replicar 100% de la funcionalidad Excel en React

---

## 📑 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estructura del Código VBA](#estructura-del-código-vba)
3. [Flujos de Datos Completos](#flujos-de-datos-completos)
4. [Reglas de Negocio Detalladas](#reglas-de-negocio-detalladas)
5. [Fórmulas y Cálculos](#fórmulas-y-cálculos)
6. [Plan de Acción por Fases](#plan-de-acción-por-fases)
7. [Gap Analysis](#gap-analysis)

---

## 1. RESUMEN EJECUTIVO

### 🎯 Propósito del Sistema Excel

El sistema "Análisis de Expedientes.xlsm" procesa datos de facturación eléctrica extraídos del SCE (Sistema Central de Energía) para:

1. **Limpiar datos**: Eliminar facturas anuladas, anuladoras, fraudes y sustituidas
2. **Analizar consumo**: Agrupar por años y meses con métricas estadísticas
3. **Detectar anomalías**: Identificar variaciones >40% en consumo mensual
4. **Generar reportes**: 4 vistas (Vista por años, Comparativa mensual, Listado, Gráfico)

### 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│  ORIGEN DE DATOS: Derivación Individual (CSV del SCE)       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  MÓDULO 4/8: Copia_y_abre_hoja_análisis3()                 │
│  - Copia datos desde archivo origen                         │
│  - Abre "Análisis de Expedientes.xlsm"                      │
│  - Pega en hoja "Entrada datos"                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  FILTROS AUTOMÁTICOS (AutoFilter)                           │
│  ✓ Campo 1 (F): Estado de factura                           │
│  ✓ Campo 19 (S): Consumo P4/supervalle                      │
│  ✓ Ordenación: Por fecha ascendente (columna G)             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  ACTUALIZACIÓN DE FÓRMULAS (RefreshAll)                     │
│  - Recalcula tablas dinámicas                               │
│  - Actualiza hoja "Vista por años"                          │
│  - Actualiza hoja "Comparativa mensual"                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  SALIDAS: 4 VISTAS                                          │
│  1. Vista por años (resumen anual)                          │
│  2. Comparativa mensual (evolución temporal)                │
│  3. Listado (datos tabulares)                               │
│  4. Gráfico (visualización)                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. ESTRUCTURA DEL CÓDIGO VBA

### 📦 Módulos Identificados

| Módulo | Nombre de Macro | Función Principal | Estado |
|--------|----------------|-------------------|--------|
| **Module1** | `Exportar_Todos_Los_Modulos()` | Exporta código VBA a archivos .bas/.cls | ⚙️ Utilidad |
| **Módulo1-3, 5, 9-10** | (Vacíos) | Sin código | ⚠️ No usados |
| **Módulo4** ⭐ | `Copia_y_abre_hoja_análisis3()` | **MACRO PRINCIPAL** - Proceso completo | ✅ CRÍTICO |
| **Módulo6** | `Abre_Informe_DGE()` | Genera informe DGE con filtros especiales | 🔷 Secundario |
| **Módulo7** | `Abre_Informe()` | Variante de informe DGE | 🔷 Secundario |
| **Módulo8** | `Copia_y_abre_hoja_Análisis()` | Versión alternativa de Módulo4 | 🔄 Duplicado |
| **Módulo11** | `ComplementarInformacion()` | VLOOKUP entre archivos | 📊 Complemento |

### 🎯 Macro Principal: `Copia_y_abre_hoja_análisis3()` (Módulo4)

**Atajo de teclado:** `CTRL+Y`

#### Pasos Detallados:

```vba
' PASO 1: COPIAR DATOS ORIGEN
Cells.Select
Selection.Copy

' PASO 2: ABRIR ARCHIVO DESTINO
ChDir "C:\AD_Expedientes"
Workbooks.Open Filename:="C:\AD_Expedientes\Análisis de Expedientes.xlsm"

' PASO 3: PEGAR DATOS
Range("A1").Select
ActiveSheet.Paste

' PASO 4: ELIMINAR BOTÓN PREVIO (si existe)
ActiveSheet.Shapes.Range(Array("Rounded Rectangle 10")).Select
Selection.Delete

' PASO 5: FILTRO POR ESTADO DE FACTURA (Columna F - Field 1)
ActiveSheet.Range("$F$1:$F$137").AutoFilter Field:=1, Criteria1:=Array( _
    "ANULADORA(ES PARA FACTURA DE ABONO DE FACTURA TIPO A)", _
    "ANULADORA (ES PARA LA FACTURA DE ABONO SUSTITUIDA TIPO S)", _
    "FRAUDE", _
    "A", _
    "S", _
    "SUSTITUIDA" _
), Operator:=xlFilterValues

Application.CutCopyMode = False
Selection.ClearContents  ' ← ELIMINA FILAS FILTRADAS

' PASO 6: COPIAR ENCABEZADOS DESDE HOJA "Comentario"
Sheets("Comentario").Select
Rows("50:50").Select  ' Fila 50 contiene los encabezados correctos
Selection.Copy
Sheets("Entrada datos").Select
Range("A1").Select
ActiveSheet.Paste

' PASO 7: QUITAR FILTRO TEMPORAL
Application.CutCopyMode = False
Selection.AutoFilter

' PASO 8: ORDENAR POR FECHA DESCENDENTE (primer ordenamiento)
ActiveWorkbook.Worksheets("Entrada datos").AutoFilter.Sort.SortFields.Clear
ActiveWorkbook.Worksheets("Entrada datos").AutoFilter.Sort.SortFields.Add _
    Key:=Range("G1"), SortOn:=xlSortOnValues, Order:=xlDescending

' PASO 9: ORDENAR POR FECHA ASCENDENTE (ordenamiento final)
Cells.Select
ActiveWorkbook.Worksheets("Entrada datos").Sort.SortFields.Clear
ActiveWorkbook.Worksheets("Entrada datos").Sort.SortFields.Add _
    Key:=Range("G2:G200"), SortOn:=xlSortOnValues, Order:=xlAscending

With ActiveWorkbook.Worksheets("Entrada datos").Sort
    .SetRange Range("A1:AS200")  ' ← RANGO COMPLETO: 45 COLUMNAS (A-AS)
    .Header = xlYes
    .MatchCase = False
    .Orientation = xlTopToBottom
    .SortMethod = xlPinYin
    .Apply
End With

' PASO 10: ACTUALIZAR FÓRMULAS Y NAVEGAR A RESULTADO
Sheets("Vista por años").Select
ActiveWorkbook.RefreshAll  ' ← RECALCULA TODAS LAS FÓRMULAS
```

---

## 3. FLUJOS DE DATOS COMPLETOS

### 🔄 Flujo Principal (Módulo4)

```
📥 ENTRADA
├─ Archivo: CSV de derivación individual del SCE
├─ Formato: 45 columnas (A-AS), hasta 200 filas
└─ Ubicación: Cualquier archivo Excel abierto

    ⬇️ COPIA (Cells.Select + Copy)

📋 PROCESAMIENTO
├─ Destino: C:\AD_Expedientes\Análisis de Expedientes.xlsm
├─ Hoja destino: "Entrada datos"
└─ Operación: Pega en A1

    ⬇️ FILTRADO

🔍 LIMPIEZA DE DATOS
├─ Filtro 1 (Columna F - Estado de factura):
│   ├─ Elimina: "ANULADORA(ES PARA FACTURA DE ABONO DE FACTURA TIPO A)"
│   ├─ Elimina: "ANULADORA (ES PARA LA FACTURA DE ABONO SUSTITUIDA TIPO S)"
│   ├─ Elimina: "FRAUDE"
│   ├─ Elimina: "A"
│   ├─ Elimina: "S"
│   └─ Elimina: "SUSTITUIDA"
│
└─ Resultado: Filas filtradas se eliminan (ClearContents)

    ⬇️ ENCABEZADOS

📄 RESTAURACIÓN DE ENCABEZADOS
├─ Origen: Hoja "Comentario", Fila 50
├─ Destino: Hoja "Entrada datos", Fila 1
└─ Razón: Los filtros pueden corromper encabezados

    ⬇️ ORDENACIÓN

↕️ ORDENAMIENTO
├─ Campo: Columna G ("Fecha desde")
├─ Orden: Ascendente (del más antiguo al más reciente)
├─ Rango: A1:AS200
└─ Encabezados: SÍ (Header = xlYes)

    ⬇️ ACTUALIZACIÓN

🔄 RECALCULAR FÓRMULAS
├─ Comando: RefreshAll
├─ Afecta: Todas las tablas dinámicas y fórmulas del libro
├─ Hojas actualizadas:
│   ├─ "Vista por años"
│   ├─ "Comparativa mensual"
│   ├─ "Listado"
│   └─ "Gráfico"

    ⬇️ SALIDA

📊 RESULTADO FINAL
├─ Navegación automática a: "Vista por años"
└─ Usuario puede cambiar entre pestañas para ver otras vistas
```

### 🔄 Flujo Alternativo: Informe DGE (Módulo6/7)

```
📥 ENTRADA
└─ Archivo: Datos ya procesados

    ⬇️

📋 DESTINO
├─ Archivo: C:\AD Expedientes\Informe DGE - Definitivo (Prueba).xlsm
└─ Operación: Pega datos en A1

    ⬇️

🔍 FILTROS ESPECIALES DGE
├─ Filtro 1 (Columna AA - Field 27):
│   └─ Elimina: "#¡VALOR!" (errores de fórmula)
│
├─ Filtro 2 (Columna S - Field 19):
│   └─ Elimina: "-" (consumo P4 no válido)
│
└─ Ordenación: Por columna L (Field 12) ascendente

    ⬇️

📊 RESULTADO
└─ Hoja limpia para informe DGE
```

---

## 4. REGLAS DE NEGOCIO DETALLADAS

### 📋 Regla 1: Criterios de Exclusión de Facturas

**Ubicación:** Módulo4, líneas 24-29

| Campo | Columna Excel | Valores a Eliminar | Razón de Negocio |
|-------|---------------|-------------------|------------------|
| **Estado de la factura** | F (Field 1) | `"ANULADORA(ES PARA FACTURA DE ABONO DE FACTURA TIPO A)"` | Factura que anula otra tipo A (no consumo real) |
| | | `"ANULADORA (ES PARA LA FACTURA DE ABONO SUSTITUIDA TIPO S)"` | Factura que anula otra tipo S (no consumo real) |
| | | `"FRAUDE"` | Factura de fraude detectado (no consumo válido) |
| | | `"A"` | Factura tipo A (abono/anulación) |
| | | `"S"` | Factura sustituida (reemplazada por otra) |
| | | `"SUSTITUIDA"` | Factura que fue sustituida |

**Implementación VBA:**
```vba
ActiveSheet.Range("$F$1:$F$137").AutoFilter Field:=1, Criteria1:=Array( _
    "ANULADORA(ES PARA FACTURA DE ABONO DE FACTURA TIPO A)", _
    "ANULADORA (ES PARA LA FACTURA DE ABONO SUSTITUIDA TIPO S)", _
    "FRAUDE", "A", "S", "SUSTITUIDA" _
), Operator:=xlFilterValues
Selection.ClearContents  ' ← ELIMINACIÓN FÍSICA
```

**⚠️ CRÍTICO:** La eliminación es **FÍSICA** (ClearContents), no solo ocultar filas.

---

### 📋 Regla 2: Filtro de Consumo P4 Inválido

**Ubicación:** Módulo6/7 (Informe DGE)

| Campo | Columna Excel | Valores a Eliminar | Razón |
|-------|---------------|-------------------|-------|
| **Consumo P4/supervalle** | S (Field 19) | `"-"` | Valor no numérico, dato corrupto |

**Implementación VBA:**
```vba
ActiveSheet.Range("$A$1:$AR$200").AutoFilter Field:=19, Criteria1:="-"
Rows("3:200").Select
Selection.ClearContents  ' ← ELIMINA desde fila 3 (mantiene encabezados)
```

**Nota:** Este filtro solo se aplica en el flujo de "Informe DGE", NO en el flujo principal.

---

### 📋 Regla 3: Ordenación Cronológica Obligatoria

**Ubicación:** Módulo4, líneas 42-53

**Criterio:**
- Campo de ordenación: **Columna G** ("Fecha desde")
- Orden: **Ascendente** (del más antiguo al más reciente)
- Rango completo: **A1:AS200** (incluye encabezados)
- Método: **xlPinYin** (ordenamiento chino, pero funciona para fechas DD/MM/YYYY)

**Razón de negocio:** 
- Permite análisis cronológico correcto
- Las fórmulas de "Comparativa mensual" dependen del orden temporal
- Facilita detección de tendencias y variaciones mes a mes

---

### 📋 Regla 4: Restauración de Encabezados

**Ubicación:** Módulo4, líneas 32-39

**Proceso:**
1. Los filtros automáticos pueden corromper la fila 1 (encabezados)
2. Se copian encabezados "limpios" desde hoja "Comentario", fila 50
3. Se pegan en hoja "Entrada datos", fila 1

**Encabezados esperados (45 columnas):**
```
A: Número Fiscal de Factura
B: Código de Empresa Distribuidora
C: Código de contrato externo - interfaz
D: Secuencial de factura
E: Tipo de factura
F: Estado de la factura ← CAMPO DE FILTRO 1
G: Fecha desde ← CAMPO DE ORDENACIÓN
H: Fecha hasta
I: Importe Factura
J: Fuente de la factura
K: Tipo de Fuente
L: Descripción Tipo de fuente
M: Tipo de Fuente Anterior
N: Descripción Tipo de fuente Anterior
O: Tipo de punto de medida
P: Consumo P1/punta
Q: Consumo P2/llano
R: Consumo P3/valle
S: Consumo P4/supervalle ← CAMPO DE FILTRO 2 (DGE)
T: Consumo P5
U: Consumo P6
V: Consumo Reactiva1
W: Consumo Reactiva2
X: Consumo Reactiva3
Y: Consumo Reactiva4
Z: Consumo Reactiva5
AA: Consumo Reactiva6
AB: Consumo cargo-abono P1/punta
AC: Consumo cargo-abono P2/llano
AD: Consumo cargo-abono P3/valle
AE: Consumo cargo/abono P4
AF: Consumo cargo/abono P5
AG: Consumo cargo/abono P6
AH: Consumo pérdidas P1/punta
AI: Consumo pérdidas P2/llano
AJ: Consumo pérdidas P3/valle
AK: Consumo pérdidas P4
AL: Consumo pérdidas P5
AM: Consumo pérdidas P6
AN: Maxímetro P1/Punta
AO: Maxímetro P2/Llano
AP: Maxímetro P3/Valle
AQ: Maxímetro P4
AR: Maxímetro P5
AS: Maxímetro P6
```

---

## 5. FÓRMULAS Y CÁLCULOS

### 🧮 Vista por Años - Fórmulas Excel

**Basado en:** Hoja "Vista por años" del Excel

| Métrica | Fórmula Excel Equivalente | Descripción |
|---------|--------------------------|-------------|
| **Año** | `=YEAR([Fecha desde])` | Extrae año de la fecha de inicio |
| **Suma Consumo Activa** | `=SUMIFS(P:P, G:G, ">=01/01/YYYY", G:G, "<=31/12/YYYY") + SUMIFS(Q:Q, ...) + SUMIFS(R:R, ...)` | **P1 + P2 + P3** del año |
| **Máx Maxímetro** | `=MAX(IF(YEAR(G:G)=YYYY, MAX(AN:AS, "")))` | Mayor maxímetro de todos los periodos (P1-P6) |
| **Periodos** | `=COUNTIFS(G:G, ">=01/01/YYYY", G:G, "<=31/12/YYYY")` | Número de facturas del año |
| **Días** | `=SUMPRODUCT((YEAR(G:G)=YYYY)*(H:H-G:G))` | Suma de días entre fecha desde y fecha hasta |
| **Promedio/Día** | `=[Suma Consumo Activa] / [Días]` | Consumo diario promedio |

**Ejemplo de cálculo manual:**
```
Datos de entrada (año 2024):
- Factura 1: Fecha desde: 15/01/2024, Fecha hasta: 14/02/2024
  P1=100 kWh, P2=150 kWh, P3=80 kWh, Días=30
- Factura 2: Fecha desde: 15/02/2024, Fecha hasta: 14/03/2024
  P1=110 kWh, P2=160 kWh, P3=85 kWh, Días=28

Cálculos:
1. Suma Consumo Activa = (100+150+80) + (110+160+85) = 330 + 355 = 685 kWh
2. Periodos = 2
3. Días = 30 + 28 = 58
4. Promedio/Día = 685 / 58 = 11.81 kWh/día
```

---

### 📅 Comparativa Mensual - Fórmulas Excel

| Métrica | Fórmula Excel Equivalente | Descripción |
|---------|--------------------------|-------------|
| **Año** | `=YEAR([Fecha desde])` | Año del periodo |
| **Mes** | `=MONTH([Fecha desde])` | Mes del periodo (1-12) |
| **Periodo** | `=TEXT([Fecha desde], "YYYY-MM")` | Formato "2024-01" |
| **Consumo Total** | `=SUMIFS(P:P, G:G, ">=01/MM/YYYY", G:G, "<=31/MM/YYYY") + ...` | **P1 + P2 + P3** del mes |
| **Días** | `=SUMPRODUCT((TEXT(G:G,"YYYY-MM")=periodo)*(H:H-G:G))` | Días del periodo |
| **Consumo Promedio Diario** | `=[Consumo Total] / [Días]` | Consumo/día del mes |
| **Variación %** | `=([Consumo mes actual] - [Consumo mes anterior]) / [Consumo mes anterior] * 100` | Variación porcentual |
| **Es Anomalía** | `=IF(ABS([Variación %]) > 40, TRUE, FALSE)` | Umbral: ±40% |

**Lógica de detección de anomalías:**
```
SI variación > 40% ENTONCES
  esAnomalia = TRUE
  tipoVariacion = "aumento"
SI variación < -40% ENTONCES
  esAnomalia = TRUE
  tipoVariacion = "descenso"
SI -5% <= variación <= 5% ENTONCES
  tipoVariacion = "estable"
```

**Ejemplo:**
```
Enero 2024: 500 kWh
Febrero 2024: 300 kWh
Variación = (300 - 500) / 500 * 100 = -40%
esAnomalia = TRUE (justo en el umbral)
tipoVariacion = "descenso"
```

---

### 🎨 Heat Map - Reglas de Color

**Gradiente de colores:**
```
Valor Mínimo (0%)  → RGB(255, 0, 0)    [ROJO]
        ↓
Percentil 50%      → RGB(255, 255, 0)  [AMARILLO]
        ↓
Valor Máximo (100%)→ RGB(0, 255, 0)    [VERDE]
```

**Fórmula de interpolación:**
```javascript
normalizado = (valor - min) / (max - min);

if (normalizado < 0.5) {
  // Rojo → Amarillo
  t = normalizado * 2;
  r = 255;
  g = 255 * t;
  b = 0;
} else {
  // Amarillo → Verde
  t = (normalizado - 0.5) * 2;
  r = 255 * (1 - t);
  g = 255;
  b = 0;
}
```

**Detección de outliers (valores fuera del promedio):**
```
promedio = AVERAGE(valores)
desviacionEstandar = STDEV(valores)

SI valor > (promedio + desviacionEstandar) ENTONCES
  aplicarFormato = NEGRITA + COLOR_ROJO + BORDE
SI valor < (promedio - desviacionEstandar) ENTONCES
  aplicarFormato = NEGRITA + COLOR_ROJO + BORDE
```

---

## 6. PLAN DE ACCIÓN POR FASES

### 🎯 FASE 1: IMPORTACIÓN Y VALIDACIÓN DE DATOS

**Objetivo:** Replicar el proceso de "Copia y Pega" del VBA

#### Tareas:

1. **Crear servicio de importación mejorado**
   - Archivo: `src/services/importService.ts`
   - Funciones:
     - `validarEstructuraCSV()`: Verificar 45 columnas esperadas
     - `validarFormatoFechas()`: Asegurar DD/MM/YYYY
     - `validarNumericos()`: Convertir formato español ("1.234,56" → 1234.56)
     - `importarConValidacion()`: Retornar errores detallados

2. **Mejorar manejo de errores**
   - Mostrar errores por fila específica
   - Sugerir correcciones automáticas
   - Permitir importación parcial (con advertencias)

3. **Agregar vista previa**
   - Mostrar primeras 10 filas antes de confirmar
   - Indicar número de registros válidos vs inválidos
   - Resaltar campos problemáticos

#### Criterios de Aceptación:
- ✅ Importa CSV con 45 columnas correctamente
- ✅ Detecta y reporta errores de formato
- ✅ Convierte fechas DD/MM/YYYY a objetos Date
- ✅ Maneja números con formato español
- ✅ Muestra resumen de importación (X registros válidos, Y errores)

---

### 🎯 FASE 2: FILTROS Y LIMPIEZA DE DATOS

**Objetivo:** Replicar EXACTAMENTE los AutoFilter del VBA

#### Tareas:

1. **Implementar filtro por "Estado de la factura"** ✅ (YA HECHO)
   - Archivo: `src/pages/ExpedienteTipoV/ExpedienteTipoV.tsx`
   - Función: `handleAnularFC()`
   - Estados a eliminar (6 valores exactos):
     ```typescript
     const estadosAEliminar = [
       'ANULADORA(ES PARA FACTURA DE ABONO DE FACTURA TIPO A)',
       'ANULADORA (ES PARA LA FACTURA DE ABONO SUSTITUIDA TIPO S)',
       'FRAUDE',
       'A',
       'S',
       'SUSTITUIDA'
     ];
     ```

2. **Implementar filtro por "Consumo P4"** ✅ (YA HECHO)
   - Campo: `'Consumo P4/supervalle'`
   - Eliminar si valor es `"-"` o vacío

3. **Implementar ordenación cronológica** ✅ (YA HECHO)
   - Campo: `'Fecha desde'`
   - Orden: Ascendente
   - Aplicar DESPUÉS de filtros

4. **Agregar logging de filtros**
   - Mostrar: "Eliminados X registros por estado, Y por P4"
   - Mostrar: "Ordenados Z registros por fecha"
   - Permitir deshacer filtros (guardar estado previo)

#### Criterios de Aceptación:
- ✅ Elimina EXACTAMENTE los mismos registros que VBA
- ✅ Ordena cronológicamente idéntico a Excel
- ✅ Muestra contador de registros eliminados
- ✅ Permite deshacer filtros (opcional)

---

### 🎯 FASE 3: CÁLCULOS Y AGREGACIONES

**Objetivo:** Replicar fórmulas de "Vista por años" y "Comparativa mensual"

#### Tareas:

1. **Verificar cálculo de "Vista por años"** ✅ (YA HECHO PARCIALMENTE)
   - Archivo: `src/services/analisisConsumoService.ts`
   - Función: `generarVistaAnual()`
   - Verificar:
     - ✅ Suma Consumo Activa = P1 + P2 + P3
     - ✅ Máx Maxímetro = MAX(Maxímetro P1-P6)
     - ✅ Periodos = COUNT(facturas del año)
     - ✅ Días = SUM(Fecha hasta - Fecha desde)
     - ✅ Promedio/Día = Consumo / Días

2. **Mejorar "Comparativa mensual"** ⚠️ (REVISAR)
   - Función: `generarComparativaMensual()`
   - Verificar:
     - ✅ Agrupación por YYYY-MM correcta
     - ✅ Consumo Total = P1 + P2 + P3
     - ✅ Variación % correcta
     - ⚠️ Umbral de anomalía: 40% (verificar si es correcto)
     - ✅ Clasificación: aumento/descenso/estable

3. **Agregar métricas estadísticas adicionales**
   - Media móvil de 3 meses
   - Desviación estándar por año
   - Tendencia (regresión lineal simple)

4. **Crear servicio de validación de cálculos**
   - Comparar resultados React vs Excel (manualmente)
   - Exportar resultados a CSV para comparación
   - Generar reporte de diferencias

#### Criterios de Aceptación:
- ✅ Resultados numéricos IDÉNTICOS a Excel (±0.01%)
- ✅ Detección de anomalías coincide con Excel
- ✅ Clasificaciones (aumento/descenso) correctas
- ✅ Heat map con colores correctos

---

### 🎯 FASE 4: VISUALIZACIÓN Y UX

**Objetivo:** Replicar las 4 vistas del Excel con UX mejorada

#### Tareas:

1. **Vista por Años** ✅ (YA HECHO)
   - Tabla con 6 columnas
   - Formato de números con separadores de miles
   - Totales al pie de tabla
   - Exportar a Excel/PDF

2. **Comparativa Mensual** ✅ (YA HECHO)
   - Heat map con gradiente rojo-amarillo-verde
   - Detección de outliers (±1σ) con negrita roja
   - Tooltip con estadísticas (media, σ)
   - Filtro por año
   - Gráfico de línea complementario

3. **Listado** ✅ (YA HECHO)
   - Tabla con primeras 10 columnas
   - Scroll horizontal para ver todas
   - Búsqueda y filtros por columna
   - Paginación (20 registros/página)
   - Exportar selección a CSV

4. **Gráfico** ✅ (YA HECHO)
   - Chart.js o Recharts
   - Línea de consumo mensual
   - Área bajo la curva
   - Marcadores de anomalías
   - Zoom y pan interactivo

5. **Mejoras UX adicionales**
   - Breadcrumbs: Inicio > Wart > Expediente Tipo V
   - Guardar estado en localStorage
   - Modo oscuro (opcional)
   - Accesibilidad (ARIA labels)

#### Criterios de Aceptación:
- ✅ 4 vistas funcionales
- ✅ Heat map visualmente idéntico a Excel
- ✅ Gráficos interactivos
- ✅ Exportación a Excel/CSV funcional
- ✅ Responsive design (funciona en tablet)

---

### 🎯 FASE 5: OPTIMIZACIÓN Y TESTING

**Objetivo:** Rendimiento óptimo y cobertura de tests

#### Tareas:

1. **Optimización de rendimiento**
   - Lazy loading de vistas
   - Virtualización de tablas (react-window)
   - Memoización con `useMemo` y `useCallback`
   - Web Workers para cálculos pesados

2. **Testing**
   - Unit tests para servicios (Jest)
   - Integration tests para flujo completo (React Testing Library)
   - E2E tests con Playwright (opcional)
   - Cobertura mínima: 80%

3. **Documentación**
   - JSDoc completo en todos los servicios
   - README con guía de usuario
   - Guía de comparación React vs Excel
   - Video tutorial (opcional)

4. **Deployment**
   - Build optimizado (<500 KB gzip)
   - PWA (opcional)
   - Hosting en Vercel/Netlify

#### Criterios de Aceptación:
- ✅ Tiempo de carga inicial <2 segundos
- ✅ Procesamiento de 200 registros <500 ms
- ✅ Cobertura de tests >80%
- ✅ Build size <600 KB gzip
- ✅ Lighthouse score >90

---

## 7. GAP ANALYSIS

### ✅ Funcionalidades YA IMPLEMENTADAS

| Funcionalidad | Estado | Archivo | Comentario |
|---------------|--------|---------|------------|
| Importación CSV | ✅ Completo | `importService.ts` | Soporta 46 campos |
| Filtro por "Estado de factura" | ✅ Completo | `ExpedienteTipoV.tsx` | 6 valores exactos |
| Filtro por "Consumo P4" | ✅ Completo | `ExpedienteTipoV.tsx` | Elimina "-" |
| Ordenación por fecha | ✅ Completo | `ExpedienteTipoV.tsx` | Ascendente |
| Vista por Años | ✅ Completo | `analisisConsumoService.ts` | 6 métricas |
| Comparativa Mensual | ✅ Completo | `analisisConsumoService.ts` | Con anomalías |
| Heat Map | ✅ Completo | `ExpedienteTipoV.tsx` | Gradiente RGB |
| Detección de outliers | ✅ Completo | `ExpedienteTipoV.tsx` | ±1σ negrita roja |
| Listado (tabla) | ✅ Completo | `ExpedienteTipoV.tsx` | 10 columnas visibles |
| Gráfico SVG | ✅ Completo | `ExpedienteTipoV.tsx` | Chart de línea |

### ⚠️ Funcionalidades PARCIALES

| Funcionalidad | Estado | Falta | Prioridad |
|---------------|--------|-------|-----------|
| Validación de importación | ⚠️ Parcial | - Validar 45 columnas exactas<br>- Detectar errores por fila<br>- Vista previa antes de importar | MEDIA |
| Manejo de errores | ⚠️ Parcial | - Mensajes más descriptivos<br>- Sugerencias de corrección | BAJA |
| Exportación de datos | ⚠️ Parcial | - Exportar Vista por Años a Excel<br>- Exportar Comparativa a CSV | MEDIA |
| Logging de operaciones | ⚠️ Parcial | - Registrar filtros aplicados<br>- Deshacer/Rehacer | BAJA |

### ❌ Funcionalidades FALTANTES

| Funcionalidad | Prioridad | Razón | Esfuerzo Estimado |
|---------------|-----------|-------|-------------------|
| Restauración de encabezados (VBA línea 32-39) | 🔴 ALTA | VBA copia desde hoja "Comentario"<br>React no tiene esta hoja | 2 horas |
| Informe DGE (Módulo6/7) | 🟡 MEDIA | Flujo secundario, no crítico | 4 horas |
| VLOOKUP complementario (Módulo11) | 🟢 BAJA | Funcionalidad adicional | 3 horas |
| RefreshAll explícito | 🟡 MEDIA | React recalcula automáticamente,<br>pero podría necesitar invalidación manual | 1 hora |

### 🔍 Diferencias Arquitectónicas React vs VBA

| Aspecto | VBA/Excel | React | Equivalencia |
|---------|-----------|-------|--------------|
| **Almacenamiento** | Archivo .xlsm en disco | Estado en memoria (Context API) | ⚠️ React pierde datos al recargar |
| **Fórmulas** | Celdas con `=SUMA()`, `=SI()` | Funciones JavaScript | ✅ Equivalente |
| **Actualización** | `RefreshAll` manual | Re-render automático | ✅ Equivalente |
| **Filtros** | AutoFilter con UI | `.filter()` programático | ✅ Equivalente |
| **Ordenación** | `.Sort` con UI | `.sort()` programático | ✅ Equivalente |
| **Hojas múltiples** | Pestañas de Excel | Componentes/vistas | ✅ Equivalente |
| **Persistencia** | Guardar archivo | localStorage / IndexedDB | ⚠️ Requiere implementación |

---

## 8. RECOMENDACIONES FINALES

### 🎯 Acciones Inmediatas (Sprint 1)

1. **Validar cálculos numéricamente**
   - Exportar resultados de React a CSV
   - Comparar con Excel usando DIFF
   - Ajustar fórmulas si hay discrepancias >0.01%

2. **Implementar persistencia**
   - Guardar datos importados en localStorage
   - Guardar filtros aplicados
   - Opción "Guardar sesión"

3. **Agregar exportación**
   - Botón "Exportar a Excel" en cada vista
   - Usar biblioteca `xlsx` para generar .xlsx

### 🔬 Testing Recomendado

```typescript
// Test de cálculo de Vista por Años
it('debe calcular Suma Consumo Activa correctamente', () => {
  const datos: DerivacionData[] = [
    { 'Fecha desde': '15/01/2024', 'Consumo P1/punta': '100', 'Consumo P2/llano': '150', 'Consumo P3/valle': '80' },
    { 'Fecha desde': '15/02/2024', 'Consumo P1/punta': '110', 'Consumo P2/llano': '160', 'Consumo P3/valle': '85' }
  ];
  
  const resultado = generarVistaAnual(datos);
  
  expect(resultado[0].sumaConsumoActiva).toBe(685); // 100+150+80+110+160+85
});

// Test de detección de anomalías
it('debe detectar anomalía con variación >40%', () => {
  const datos = [
    { periodo: '2024-01', consumo: 500 },
    { periodo: '2024-02', consumo: 300 } // -40% exacto
  ];
  
  const resultado = generarComparativaMensual(datos);
  
  expect(resultado[1].esAnomalia).toBe(true);
  expect(resultado[1].tipoVariacion).toBe('descenso');
});
```

### 📊 Métricas de Éxito

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| **Exactitud de cálculos** | 100% igual a Excel | Comparación CSV |
| **Tiempo de procesamiento** | <500 ms para 200 registros | Performance API |
| **Tamaño de build** | <600 KB gzip | `npm run build` |
| **Cobertura de tests** | >80% | Jest coverage |
| **Accesibilidad** | WCAG 2.1 AA | axe DevTools |

---

## 📚 APÉNDICES

### A. Estructura de Archivos Excel

```
Análisis de Expedientes.xlsm
├── Hojas:
│   ├── "Entrada datos" ← Datos pegados desde CSV
│   ├── "Comentario" ← Fila 50 contiene encabezados correctos
│   ├── "Vista por años" ← Tabla dinámica con fórmulas
│   ├── "Comparativa mensual" ← Tabla dinámica con fórmulas
│   ├── "Listado" ← Vista tabular
│   └── "Gráfico" ← Chart visual
│
├── Módulos VBA:
│   ├── Módulo4 ⭐ (Macro principal)
│   ├── Módulo6 (Informe DGE)
│   ├── Módulo7 (Informe alternativo)
│   ├── Módulo8 (Variante de Módulo4)
│   └── Módulo11 (VLOOKUP complementario)
│
└── Objetos:
    └── "Rounded Rectangle 10" ← Botón que se elimina antes de pegar
```

### B. Mapping de Columnas CSV → TypeScript

```typescript
interface DerivacionData {
  'Número Fiscal de Factura': string;              // Columna A
  'Código de Empresa Distribuidora': string;       // Columna B
  'Código de contrato externo - interfaz': string; // Columna C
  'Secuencial de factura': string;                 // Columna D
  'Tipo de factura': string;                       // Columna E
  'Estado de la factura': string;                  // Columna F ← FILTRO 1
  'Fecha desde': string;                           // Columna G ← ORDENACIÓN
  'Fecha hasta': string;                           // Columna H
  'Importe Factura': string | number;              // Columna I
  'Fuente de la factura': string;                  // Columna J
  'Tipo de Fuente': string;                        // Columna K
  'Descripción Tipo de fuente': string;            // Columna L
  'Tipo de Fuente Anterior': string;               // Columna M
  'Descripción Tipo de fuente Anterior': string;   // Columna N
  'Tipo de punto de medida': string;               // Columna O
  'Consumo P1/punta': string | number;             // Columna P ← SUMA
  'Consumo P2/llano': string | number;             // Columna Q ← SUMA
  'Consumo P3/valle': string | number;             // Columna R ← SUMA
  'Consumo P4/supervalle': string | number;        // Columna S ← FILTRO 2 (DGE)
  'Consumo P5': string | number;                   // Columna T
  'Consumo P6': string | number;                   // Columna U
  // ... (resto de columnas hasta AS)
}
```

### C. Comandos de Testing

```bash
# Ejecutar tests unitarios
npm run test

# Ejecutar con cobertura
npm run test:coverage

# Ejecutar en modo watch
npm run test:watch

# Build de producción con análisis
npm run build -- --mode production

# Analizar tamaño de bundle
npx vite-bundle-visualizer
```

---

**Documento generado:** 8 de noviembre de 2025  
**Autor:** GitHub Copilot  
**Versión:** 1.0  
**Estado:** ✅ Completo y listo para implementación
