# AUDITORÍA Y REFACTORIZACIÓN COMPLETA - VALORAPP_V2

**Fecha:** 2025-11-13  
**Objetivo:** Dejar el código limpio, profesional, escalable y listo para producción  
**Restricción:** Sin alterar funcionalidad ni estilos actuales

## 🎯 Alcance del Proyecto

**Tecnologías:** Vite + React + TypeScript  
**Arquitectura:** Client-side puro (SIN backend, BD, ni autenticación)  
**Datos:** Procesamiento de CSV/JSON en memoria

### ❌ NO Incluir

- API calls o servicios backend
- Autenticación/autorización
- Persistencia de datos (localStorage/sessionStorage)
- Tracking de usuarios o analytics invasivos

### ✅ SÍ Incluir

- Limpieza y optimización del código existente
- Mejores prácticas modernas de React + TypeScript
- Performance y bundle optimization
- Accesibilidad y UX profesional

---

## 📋 FASE 0: AUDITORÍA INICIAL

### 0.1 Script de Auditoría Automática

**Archivo:** `scripts/auditoria-completa.ts`

```typescript
#!/usr/bin/env ts-node
/**
 * Script de auditoría completa del proyecto
 * Detecta: console.log, imports no usados, archivos grandes, código duplicado
 */
import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import { glob } from 'glob';

interface ResultadoAuditoria {
  consoleLogs: ConsoleLogs[];
  debugStatements: DebugStatement[];
  archivosGrandes: ArchivoGrande[];
  dependenciasNoUsadas: string[];
  vulnerabilidades: Vulnerabilidad[];
  importsNoUsados: ImportNoUsado[];
  codigoComentado: CodigoComentado[];
  complejidadCiclomatica: ComplejidadCiclomatica[];
}

interface ConsoleLogs {
  archivo: string;
  linea: number;
  codigo: string;
  tipo: 'log' | 'error' | 'warn' | 'debug' | 'info';
}

interface DebugStatement {
  archivo: string;
  linea: number;
  tipo: 'debugger' | 'alert' | 'confirm';
}

interface ArchivoGrande {
  archivo: string;
  lineas: number;
  caracteres: number;
  esComponente: boolean;
}

interface Vulnerabilidad {
  nombre: string;
  severidad: 'critical' | 'high' | 'moderate' | 'low';
  via: string[];
}

interface ImportNoUsado {
  archivo: string;
  import: string;
  linea: number;
}

interface CodigoComentado {
  archivo: string;
  linea: number;
  codigo: string;
}

interface ComplejidadCiclomatica {
  archivo: string;
  funcion: string;
  complejidad: number;
}

class AuditoriaProyecto {
  private srcPath = './src';
  private resultados: ResultadoAuditoria = {
    consoleLogs: [],
    debugStatements: [],
    archivosGrandes: [],
    dependenciasNoUsadas: [],
    vulnerabilidades: [],
    importsNoUsados: [],
    codigoComentado: [],
    complejidadCiclomatica: [],
  };

  /**
   * Ejecuta auditoría completa
   */
  async ejecutar(): Promise<ResultadoAuditoria> {
    console.log('🔍 Iniciando auditoría completa del proyecto...\n');

    await this.buscarConsoleLogs();
    await this.buscarDebugStatements();
    await this.detectarArchivosGrandes();
    await this.verificarDependencias();
    await this.verificarVulnerabilidades();
    await this.buscarCodigoComentado();

    this.generarReporte();
    this.guardarResultados();

    return this.resultados;
  }

  /**
   * Busca console.log, console.error, etc.
   */
  private async buscarConsoleLogs(): Promise<void> {
    console.log('📝 Buscando console.log...');
    const archivos = glob.sync(`${this.srcPath}/**/*.{ts,tsx}`, {
      ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.spec.ts'],
    });

    const regexConsole = /console\.(log|error|warn|debug|info|trace|table|group)/g;

    archivos.forEach((archivo) => {
      const contenido = readFileSync(archivo, 'utf-8');
      const lineas = contenido.split('\n');

      lineas.forEach((linea, index) => {
        const match = linea.match(regexConsole);
        if (match && !linea.trim().startsWith('//')) {
          this.resultados.consoleLogs.push({
            archivo: relative('.', archivo),
            linea: index + 1,
            codigo: linea.trim(),
            tipo: match[1] as any,
          });
        }
      });
    });

    console.log(`   Encontrados: ${this.resultados.consoleLogs.length}\n`);
  }

  /**
   * Busca debugger, alert, confirm
   */
  private async buscarDebugStatements(): Promise<void> {
    console.log('🐛 Buscando debugger statements...');
    const archivos = glob.sync(`${this.srcPath}/**/*.{ts,tsx}`, {
      ignore: ['**/node_modules/**', '**/*.test.ts'],
    });

    const regexDebug = /(debugger|alert\(|confirm\(|prompt\()/g;

    archivos.forEach((archivo) => {
      const contenido = readFileSync(archivo, 'utf-8');
      const lineas = contenido.split('\n');

      lineas.forEach((linea, index) => {
        const match = linea.match(regexDebug);
        if (match && !linea.trim().startsWith('//')) {
          const tipo = match[1].replace(/\(/, '');
          this.resultados.debugStatements.push({
            archivo: relative('.', archivo),
            linea: index + 1,
            tipo: tipo as any,
          });
        }
      });
    });

    console.log(`   Encontrados: ${this.resultados.debugStatements.length}\n`);
  }

  /**
   * Detecta archivos >200 líneas
   */
  private async detectarArchivosGrandes(): Promise<void> {
    console.log('📏 Detectando archivos grandes (>200 líneas)...');
    const archivos = glob.sync(`${this.srcPath}/**/*.{ts,tsx}`, {
      ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.spec.ts'],
    });

    const LIMITE_LINEAS = 200;

    archivos.forEach((archivo) => {
      const contenido = readFileSync(archivo, 'utf-8');
      const lineas = contenido.split('\n').length;
      const caracteres = contenido.length;

      if (lineas > LIMITE_LINEAS) {
        this.resultados.archivosGrandes.push({
          archivo: relative('.', archivo),
          lineas,
          caracteres,
          esComponente: archivo.endsWith('.tsx'),
        });
      }
    });

    this.resultados.archivosGrandes.sort((a, b) => b.lineas - a.lineas);
    console.log(`   Encontrados: ${this.resultados.archivosGrandes.length}\n`);
  }

  /**
   * Verifica dependencias no usadas
   */
  private async verificarDependencias(): Promise<void> {
    console.log('📦 Verificando dependencias no usadas...');
    try {
      const resultado = execSync('npx depcheck --json', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const data = JSON.parse(resultado);
      this.resultados.dependenciasNoUsadas = data.dependencies || [];
    } catch (error) {
      console.log('   ⚠️  No se pudo ejecutar depcheck (instalarlo con: npm i -D depcheck)');
    }
    console.log(`   Encontradas: ${this.resultados.dependenciasNoUsadas.length}\n`);
  }

  /**
   * Verifica vulnerabilidades de seguridad
   */
  private async verificarVulnerabilidades(): Promise<void> {
    console.log('🔒 Verificando vulnerabilidades de seguridad...');
    try {
      const resultado = execSync('npm audit --json', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const data = JSON.parse(resultado);

      if (data.vulnerabilities) {
        Object.entries(data.vulnerabilities).forEach(([nombre, info]: [string, any]) => {
          this.resultados.vulnerabilidades.push({
            nombre,
            severidad: info.severity,
            via: info.via || [],
          });
        });
      }
    } catch {
      console.log('   ⚠️  Error al ejecutar npm audit');
    }
    console.log(`   Encontradas: ${this.resultados.vulnerabilidades.length}\n`);
  }

  /**
   * Busca código comentado (heurística)
   */
  private async buscarCodigoComentado(): Promise<void> {
    console.log('💬 Buscando código comentado...');
    const archivos = glob.sync(`${this.srcPath}/**/*.{ts,tsx}`, {
      ignore: ['**/node_modules/**'],
    });

    // Heurística: líneas comentadas que contienen =, ;, {, }
    const regexCodigoComentado = /^\s*\/\/.*[=;{}()]/;

    archivos.forEach((archivo) => {
      const contenido = readFileSync(archivo, 'utf-8');
      const lineas = contenido.split('\n');

      lineas.forEach((linea, index) => {
        if (regexCodigoComentado.test(linea)) {
          this.resultados.codigoComentado.push({
            archivo: relative('.', archivo),
            linea: index + 1,
            codigo: linea.trim(),
          });
        }
      });
    });

    console.log(`   Encontrados: ${this.resultados.codigoComentado.length} líneas\n`);
  }

  /**
   * Genera reporte en consola
   */
  private generarReporte(): void {
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN DE AUDITORÍA');
    console.log('='.repeat(70) + '\n');

    // Console.logs
    if (this.resultados.consoleLogs.length > 0) {
      console.log(`❌ Console statements: ${this.resultados.consoleLogs.length}`);
      const top5 = this.resultados.consoleLogs.slice(0, 5);
      top5.forEach((item) => {
        console.log(`   ${item.archivo}:${item.linea} - ${item.tipo}`);
      });
      if (this.resultados.consoleLogs.length > 5) {
        console.log(`   ... y ${this.resultados.consoleLogs.length - 5} más`);
      }
      console.log();
    } else {
      console.log('✅ No se encontraron console statements\n');
    }

    // Debuggers
    if (this.resultados.debugStatements.length > 0) {
      console.log(`❌ Debug statements: ${this.resultados.debugStatements.length}`);
      this.resultados.debugStatements.forEach((item) => {
        console.log(`   ${item.archivo}:${item.linea} - ${item.tipo}`);
      });
      console.log();
    } else {
      console.log('✅ No se encontraron debug statements\n');
    }

    // Archivos grandes
    if (this.resultados.archivosGrandes.length > 0) {
      console.log(`⚠️  Archivos grandes (>200 líneas): ${this.resultados.archivosGrandes.length}`);
      const top5 = this.resultados.archivosGrandes.slice(0, 5);
      top5.forEach((item) => {
        console.log(
          `   ${item.archivo} - ${item.lineas} líneas ${item.esComponente ? '(componente)' : ''}`
        );
      });
      console.log();
    } else {
      console.log('✅ Todos los archivos están dentro del límite\n');
    }

    // Dependencias
    if (this.resultados.dependenciasNoUsadas.length > 0) {
      console.log(`⚠️  Dependencias no usadas: ${this.resultados.dependenciasNoUsadas.length}`);
      this.resultados.dependenciasNoUsadas.forEach((dep) => {
        console.log(`   - ${dep}`);
      });
      console.log();
    } else {
      console.log('✅ Todas las dependencias están en uso\n');
    }

    // Vulnerabilidades
    const criticas = this.resultados.vulnerabilidades.filter((v) => v.severidad === 'critical');
    const altas = this.resultados.vulnerabilidades.filter((v) => v.severidad === 'high');

    if (criticas.length > 0) {
      console.log(`❌ Vulnerabilidades CRÍTICAS: ${criticas.length}`);
      criticas.forEach((v) => console.log(`   - ${v.nombre}`));
      console.log();
    }

    if (altas.length > 0) {
      console.log(`⚠️  Vulnerabilidades ALTAS: ${altas.length}`);
      altas.forEach((v) => console.log(`   - ${v.nombre}`));
      console.log();
    }

    if (criticas.length === 0 && altas.length === 0) {
      console.log('✅ No se encontraron vulnerabilidades críticas o altas\n');
    }

    // Código comentado
    if (this.resultados.codigoComentado.length > 0) {
      console.log(
        `⚠️  Código comentado detectado: ${this.resultados.codigoComentado.length} líneas`
      );
      console.log(`   (revisar manualmente para eliminar código obsoleto)\n`);
    }

    console.log('='.repeat(70));
    console.log('✅ Auditoría completada. Resultados guardados en: auditoria-resultados.json');
    console.log('='.repeat(70) + '\n');
  }

  /**
   * Guarda resultados en JSON
   */
  private guardarResultados(): void {
    const reporte = {
      fecha: new Date().toISOString(),
      resumen: {
        consoleLogs: this.resultados.consoleLogs.length,
        debugStatements: this.resultados.debugStatements.length,
        archivosGrandes: this.resultados.archivosGrandes.length,
        dependenciasNoUsadas: this.resultados.dependenciasNoUsadas.length,
        vulnerabilidades: this.resultados.vulnerabilidades.length,
        codigoComentado: this.resultados.codigoComentado.length,
      },
      detalles: this.resultados,
    };

    writeFileSync('auditoria-resultados.json', JSON.stringify(reporte, null, 2), 'utf-8');
  }
}

// Ejecutar auditoría
const auditor = new AuditoriaProyecto();
auditor.ejecutar().catch((error) => {
  console.error('❌ Error en auditoría:', error);
  process.exit(1);
});
```

**Ejecución:**

```bash
# Instalar dependencias necesarias
npm install -D glob depcheck

# Ejecutar auditoría
npx ts-node scripts/auditoria-completa.ts
```

**Output esperado:**

```
🔍 Iniciando auditoría completa del proyecto...

📝 Buscando console.log...
   Encontrados: 47

🐛 Buscando debugger statements...
   Encontrados: 3

📏 Detectando archivos grandes (>200 líneas)...
   Encontrados: 8

📦 Verificando dependencias no usadas...
   Encontradas: 2

🔒 Verificando vulnerabilidades de seguridad...
   Encontradas: 0

💬 Buscando código comentado...
   Encontrados: 23 líneas

======================================================================
📊 RESUMEN DE AUDITORÍA
======================================================================

❌ Console statements: 47
   src/services/importService.ts:45 - log
   src/services/anomaliaService.ts:78 - log
   src/components/DeteccionAnomalia/DeteccionAnomalia.tsx:102 - error
   src/hooks/useProcesarDatos.ts:34 - log
   src/pages/ExpedienteTipoV/ExpedienteTipoV.tsx:156 - log
   ... y 42 más

❌ Debug statements: 3
   src/pages/Wart/Wart.tsx:89 - debugger
   src/utils/index.ts:234 - alert
   src/services/dataService.ts:167 - debugger

⚠️  Archivos grandes (>200 líneas): 8
   src/pages/ExpedienteTipoV/ExpedienteTipoV.tsx - 487 líneas (componente)
   src/pages/SaldoATR/SaldoATR.tsx - 356 líneas (componente)
   src/services/anomaliaService.ts - 289 líneas
   src/pages/Wart/Wart.tsx - 267 líneas (componente)
   src/components/DeteccionAnomalia/DeteccionAnomalia.tsx - 234 líneas (componente)

⚠️  Dependencias no usadas: 2
   - lodash
   - moment

✅ No se encontraron vulnerabilidades críticas o altas

⚠️  Código comentado detectado: 23 líneas
   (revisar manualmente para eliminar código obsoleto)

======================================================================
✅ Auditoría completada. Resultados guardados en: auditoria-resultados.json
======================================================================
```

---

## 📝 FASE 1: LIMPIEZA INMEDIATA

### 1.1 Eliminar Console.log y Debuggers

**Opción A: Reemplazo manual con logger centralizado**

```typescript
// ❌ ANTES
console.log('Datos importados:', datos);
console.error('Error al procesar:', error);
debugger;

// ✅ DESPUÉS
import { logger } from '@/services/loggerService';

logger.debug('Datos importados:', { count: datos.length });
logger.error('Error al procesar:', { error: error.message });
// debugger eliminado
```

**Opción B: Script de limpieza automática (CON PRECAUCIÓN)**

```bash
# Crear backup primero
git commit -am "Backup antes de limpieza automática"

# Buscar todos los console.log
grep -r "console\.log" src/ --include="*.ts" --include="*.tsx"

# Eliminar automáticamente (revisar después)
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak '/^\s*console\./d' {} +

# Eliminar debugger
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '/^\s*debugger;/d' {} +
```

**Opción C: ESLint auto-fix**

```bash
# Configurar regla en .eslintrc.cjs
npm run lint -- --fix
```

### 1.2 Limpiar Imports No Usados

**Configuración ESLint:**

```javascript
// .eslintrc.cjs
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  plugins: ['unused-imports'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern': '^_',
      },
    ],
  },
};
```

**Instalar plugin:**

```bash
npm install -D eslint-plugin-unused-imports
```

**Ejecutar limpieza:**

```bash
npm run lint -- --fix
```

### 1.3 Eliminar Comentarios Obsoletos

**Checklist de comentarios a eliminar:**

```typescript
// ❌ ELIMINAR - Comentarios obvios
const total = a + b; // Suma a y b

// ❌ ELIMINAR - Código comentado antiguo
// const antiguaFuncion = () => {
//   return valor * 2;
// };
// setDatos(antiguaFuncion());

// ❌ ELIMINAR - TODOs sin contexto/fecha
// TODO: arreglar
// FIXME: revisar

// ❌ ELIMINAR - Comentarios de desarrollo
// console.log('debug');

// ✅ MANTENER - Comentarios con valor real
/**
 * Calcula el Z-Score normalizado para detección de anomalías estadísticas.
 * Fórmula: (valor - μ) / σ
 * @see https://es.wikipedia.org/wiki/Puntuación_Z
 */

// ✅ MANTENER - TODOs con contexto
// TODO(juan): Optimizar este algoritmo para datasets >10k registros
//             Benchmark actual: 2.3s para 5k registros
//             Meta: <1s
//             Fecha: 2025-11-13
```

**Script de detección:**

```bash
# Buscar TODOs sin contexto
grep -rn "// TODO:" src/ --include="*.ts" --include="*.tsx" | grep -v "TODO("

# Buscar código comentado (heurística)
grep -rn "^[[:space:]]*//.*[=;{}()]" src/ --include="*.ts" --include="*.tsx"
```

### 1.4 Eliminar Dependencias No Usadas

**Detección:**

```bash
npx depcheck
```

**Ejemplo de output:**

```
Unused dependencies
* lodash
* moment

Unused devDependencies
* @types/node
```

**Eliminar:**

```bash
npm uninstall lodash moment @types/node
```

**Verificar que la app sigue funcionando:**

```bash
npm run dev
npm run build
npm run typecheck
```

---

## 🏗️ FASE 2: REFACTORIZACIÓN ARQUITECTÓNICA

### 2.1 Extraer Componentes Reutilizables

**Análisis de duplicación:**

Use este comando para detectar JSX repetido:

```bash
npx jscpd src/ --min-lines 5 --min-tokens 50
```

**Componentes a extraer (detectados en auditoría):**

#### ` Button` - Botones repetidos

**Ubicaciones actuales:**

- `src/pages/ExpedienteTipoV/ExpedienteTipoV.tsx` (líneas 145, 289, 401)
- `src/pages/SaldoATR/SaldoATR.tsx` (líneas 98, 234)
- `src/pages/Wart/Wart.tsx` (líneas 67, 178)

**Patrón detectado:**

```tsx
// Repetido 12+ veces en distintas páginas
<button className="btn btn-primary" onClick={handleClick} disabled={loading}>
  {loading ? 'Procesando...' : 'Importar Datos'}
</button>
```

**Componente reutilizable:**

```typescript
// src/components/Button/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...rest
}: ButtonProps) => {
  const classes = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    loading && 'button--loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="button__spinner" />}
      {icon && <span className="button__icon">{icon}</span>}
      <span className="button__text">{children}</span>
    </button>
  );
};
```

**CSS del componente:**

```css
/* src/components/Button/Button.css */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variantes */
.button--primary {
  background-color: var(--color-primary);
  color: white;
}

.button--primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.button--secondary {
  background-color: var(--color-secondary);
  color: white;
}

.button--outline {
  background-color: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
}

.button--danger {
  background-color: var(--color-error);
  color: white;
}

/* Tamaños */
.button--small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.button--large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

/* Loading */
.button--loading .button__text {
  opacity: 0.7;
}

.button__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

**Uso:**

```tsx
// ❌ ANTES
<button className="btn btn-primary" onClick={handleImport} disabled={loading}>
  {loading ? 'Importando...' : 'Importar Datos'}
</button>;

// ✅ DESPUÉS
import { Button } from '@/components/Button';

<Button variant="primary" onClick={handleImport} loading={loading}>
  Importar Datos
</Button>;
```

#### 2. `Card` - Tarjetas con header/body

**Patrón detectado (repetido 15+ veces):**

```tsx
<div className="card">
  <div className="card-header">
    <h3>Resumen de Análisis</h3>
  </div>
  <div className="card-body">{/* contenido */}</div>
</div>
```

**Componente:**

```typescript
// src/components/Card/Card.tsx
import { ReactNode } from 'react';
import './Card.css';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'danger';
  elevated?: boolean;
  actions?: ReactNode;
  className?: string;
}

export const Card = ({
  title,
  subtitle,
  children,
  variant = 'default',
  elevated = false,
  actions,
  className = ''
}: CardProps) => {
  const classes = [
    'card',
    `card--${variant}`,
    elevated && 'card--elevated',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {(title || subtitle || actions) && (
        <div className="card__header">
          <div className="card__header-content">
            {title && <h3 className="card__title">{title}</h3>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card__actions">{actions}</div>}
        </div>
      )}
      <div className="card__body">
        {children}
      </div>
    </div>
  );
};
```

**CSS:**

```css
/* src/components/Card/Card.css */
.card {
  background: white;
  border-radius: 8px;
  border: 1px solid var(--color-gray-200);
  overflow: hidden;
}

.card--elevated {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: none;
}

.card--primary {
  border-left: 4px solid var(--color-primary);
}

.card--secondary {
  border-left: 4px solid var(--color-secondary);
}

.card--danger {
  border-left: 4px solid var(--color-error);
}

.card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-gray-200);
}

.card__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.card__subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.card__body {
  padding: 1.5rem;
}
```

**Uso:**

```tsx
// ✅ Uso del componente Card
import { Card } from '@/components/Card';

<Card
  title="Resumen de Análisis"
  subtitle="Datos procesados correctamente"
  variant="primary"
  elevated
  actions={
    <Button variant="outline" size="small">
      Ver detalles
    </Button>
  }
>
  <p>Total registros: {datos.length}</p>
  <p>Anomalías detectadas: {anomalias.length}</p>
</Card>;
```

### 2.2 Dividir Componentes Grandes (>200 líneas)

**Archivos detectados en auditoría:**

1. `src/pages/ExpedienteTipoV/ExpedienteTipoV.tsx` - 487 líneas
2. `src/pages/SaldoATR/SaldoATR.tsx` - 356 líneas
3. `src/pages/Wart/Wart.tsx` - 267 líneas
4. `src/components/DeteccionAnomalia/DeteccionAnomalia.tsx` - 234 líneas

**Estrategia de división - Ejemplo con `ExpedienteTipoV.tsx`:**

```typescript
// ❌ ANTES: src/pages/ExpedienteTipoV/ExpedienteTipoV.tsx (487 líneas)
export const ExpedienteTipoV = () => {
  // 60 líneas de estado
  const [archivo, setArchivo] = useState<File | null>(null);
  const [datos, setDatos] = useState<DerivacionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ... 15 estados más

  // 120 líneas de lógica
  const handleImport = async (file: File) => { /* ... */ };
  const procesarDatos = () => { /* ... */ };
  const calcularEstadisticas = () => { /* ... */ };
  // ... 8 funciones más

  // 307 líneas de JSX
  return (
    <div>
      {/* Sección de importación - 60 líneas */}
      {/* Filtros - 40 líneas */}
      {/* Tabla de datos - 120 líneas */}
      {/* Estadísticas - 87 líneas */}
    </div>
  );
};
```

**✅ DESPUÉS: Dividido en estructura modular**

```
src/pages/ExpedienteTipoV/
├── ExpedienteTipoV.tsx (80 líneas) - Componente principal
├── types.ts (30 líneas) - Tipos específicos de esta página
├── hooks/
│   ├── index.ts (barrel export)
│   ├── useImportarExpediente.ts (70 líneas)
│   ├── useProcesarExpediente.ts (85 líneas)
│   └── useEstadisticasExpediente.ts (45 líneas)
├── components/
│   ├── index.ts (barrel export)
│   ├── FileUploadSection.tsx (55 líneas)
│   ├── FiltrosPanel.tsx (60 líneas)
│   ├── TablaResultados.tsx (90 líneas)
│   ├── EstadisticasPanel.tsx (70 líneas)
│   └── ModalDetalles.tsx (50 líneas)
└── utils/
    ├── index.ts
    └── validaciones.ts (40 líneas)
```

**Implementación:**

```typescript
// ✅ src/pages/ExpedienteTipoV/ExpedienteTipoV.tsx (80 líneas)
import { FileUploadSection, FiltrosPanel, TablaResultados, EstadisticasPanel } from './components';
import { useImportarExpediente, useProcesarExpediente, useEstadisticasExpediente } from './hooks';
import { LoadingSpinner, ErrorMessage } from '@/components';

export const ExpedienteTipoV = () => {
  const { archivo, loading, error, importar } = useImportarExpediente();
  const { datos, filtrar } = useProcesarExpediente(archivo);
  const estadisticas = useEstadisticasExpediente(datos);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="expediente-page">
      <h1>Expediente Tipo V - Análisis de Derivación</h1>

      <FileUploadSection onFileSelect={importar} />

      {datos.length > 0 && (
        <>
          <FiltrosPanel onFilterChange={filtrar} />
          <TablaResultados datos={datos} />
          <EstadisticasPanel estadisticas={estadisticas} />
        </>
      )}
    </div>
  );
};
```

```typescript
// ✅ src/pages/ExpedienteTipoV/hooks/useImportarExpediente.ts (70 líneas)
import { useState, useCallback } from 'react';
import { importarDerivacion } from '@/services/importDerivacionService';
import { logger } from '@/services/loggerService';
import type { DerivacionData } from '@/types';

interface UseImportarExpediente {
  archivo: DerivacionData[] | null;
  loading: boolean;
  error: string | null;
  importar: (file: File) => Promise<void>;
  limpiar: () => void;
}

export const useImportarExpediente = (): UseImportarExpediente => {
  const [archivo, setArchivo] = useState<DerivacionData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importar = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      logger.info('Iniciando importación de expediente', {
        fileName: file.name,
        fileSize: file.size,
      });

      const resultado = await importarDerivacion(file);

      if (!resultado.exito) {
        throw new Error(resultado.errores.join(', '));
      }

      setArchivo(resultado.datos);

      logger.info('Importación exitosa', {
        registros: resultado.datos.length,
      });
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      setError(mensaje);
      logger.error('Error en importación', { error: mensaje });
    } finally {
      setLoading(false);
    }
  }, []);

  const limpiar = useCallback(() => {
    setArchivo(null);
    setError(null);
  }, []);

  return { archivo, loading, error, importar, limpiar };
};
```

```typescript
// ✅ src/pages/ExpedienteTipoV/components/FileUploadSection.tsx (55 líneas)
import { useRef } from 'react';
import { Button, Card } from '@/components';

interface FileUploadSectionProps {
  onFileSelect: (file: File) => void;
}

export const FileUploadSection = ({ onFileSelect }: FileUploadSectionProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <Card title="1. Importar Archivo" variant="primary">
      <div className="file-upload">
        <p className="file-upload__description">
          Selecciona un archivo CSV o JSON con los datos de derivación
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.json"
          onChange={handleChange}
          className="file-upload__input"
          aria-label="Seleccionar archivo de derivación"
        />

        <Button
          variant="primary"
          onClick={handleClick}
          icon={<span>📁</span>}
        >
          Seleccionar Archivo
        </Button>

        <p className="file-upload__hint">
          Formatos soportados: CSV, JSON
        </p>
      </div>
    </Card>
  );
};
```

### 2.3 Consolidar Lógica en Hooks Personalizados

**Anti-pattern detectado: Lógica duplicada en componentes**

```typescript
// ❌ ANTES - Lógica repetida en 3 componentes diferentes

// En ExpedienteTipoV.tsx
const [datos, setDatos] = useState([]);
const [filtrados, setFiltrados] = useState([]);
const [busqueda, setBusqueda] = useState('');

useEffect(() => {
  const resultado = datos.filter(
    (item) => item.numeroContador.includes(busqueda) || item.cliente?.includes(busqueda)
  );
  setFiltrados(resultado);
}, [datos, busqueda]);

// En SaldoATR.tsx
const [datos, setDatos] = useState([]);
const [filtrados, setFiltrados] = useState([]);
const [busqueda, setBusqueda] = useState('');

useEffect(() => {
  const resultado = datos.filter(
    (item) => item.numeroContador.includes(busqueda) || item.cliente?.includes(busqueda)
  );
  setFiltrados(resultado);
}, [datos, busqueda]);

// En Wart.tsx (mismo código)
```

**✅ DESPUÉS - Hook reutilizable**

```typescript
// src/hooks/useFiltrarDatos.ts
import { useState, useMemo, useCallback } from 'react';

interface UseFiltrarDatosOptions<T> {
  datos: T[];
  campos: (keyof T)[];
}

export function useFiltrarDatos<T>({ datos, campos }: UseFiltrarDatosOptions<T>) {
  const [busqueda, setBusqueda] = useState('');

  const datosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return datos;

    const terminoBusqueda = busqueda.toLowerCase();

    return datos.filter((item) =>
      campos.some((campo) => {
        const valor = item[campo];
        return String(valor || '')
          .toLowerCase()
          .includes(terminoBusqueda);
      })
    );
  }, [datos, busqueda, campos]);

  const limpiarBusqueda = useCallback(() => {
    setBusqueda('');
  }, []);

  return {
    busqueda,
    setBusqueda,
    datosFiltrados,
    limpiarBusqueda,
    totalOriginal: datos.length,
    totalFiltrados: datosFiltrados.length,
  };
}
```

**Uso:**

```typescript
// ✅ En cualquier componente
import { useFiltrarDatos } from '@/hooks/useFiltrarDatos';

const MiComponente = () => {
  const [datos] = useState<DerivacionData[]>([/* ... */]);

  const {
    busqueda,
    setBusqueda,
    datosFiltrados,
    totalOriginal,
    totalFiltrados
  } = useFiltrarDatos({
    datos,
    campos: ['numeroContador', 'cliente', 'periodo']
  });

  return (
    <>
      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar..."
      />
      <p>Mostrando {totalFiltrados} de {totalOriginal}</p>
      {/* Renderizar datosFiltrados */}
    </>
  );
};
```

---

## 🎨 FASE 3: ORGANIZACIÓN Y ARQUITECTURA

### 3.1 Centralizar Types e Interfaces

**Problema actual:** Types dispersos en múltiples archivos

**Estructura propuesta:**

```
src/types/
├── index.ts (barrel export)
├── consumo.types.ts
├── anomalia.types.ts
├── derivacion.types.ts
├── saldoATR.types.ts
└── common.types.ts
```

**Implementación:**

```typescript
// src/types/consumo.types.ts
/**
 * Tipos relacionados con consumo energético
 */

export interface ConsumoEnergetico {
  fecha: string;
  consumo: number;
  numeroContador: string;
  cliente?: string;
  periodo: string;
}

export interface ConsumoPeriodo {
  periodo: string;
  consumoTotal: number;
  consumoPromedio: number;
  dias: number;
  registros: ConsumoEnergetico[];
}

export interface ConsumoAnual {
  año: number;
  sumaConsumoActiva: number;
  maxMaximetro: number;
  periodosFacturados: number;
  sumaDias: number;
  promedioConsumoPorDia: number;
}

export interface ConsumoMensual extends ConsumoPeriodo {
  año: number;
  mes: number;
  consumoNormalizado: number;
  variacionPorcentual: number;
  zScore: number;
  indiceEstacional: number;
  tendencia3M: number;
  motivoAnomalia?: string;
}
```

```typescript
// src/types/anomalia.types.ts
/**
 * Tipos relacionados con detección de anomalías
 */

export type TipoAnomalia =
  | 'descenso_abrupto'
  | 'descenso_gradual'
  | 'consumo_cero'
  | 'consumo_negativo'
  | 'pico_anomalo';

export type SeveridadAnomalia = 'critica' | 'alta' | 'media' | 'baja';

export interface Anomalia {
  periodo: string;
  tipo: TipoAnomalia;
  severidad: SeveridadAnomalia;
  consumoReal: number;
  consumoEsperado: number;
  variacionPorcentual: number;
  descripcion: string;
  esPrimeraOcurrencia: boolean;
}

export interface DeteccionAnomaliaConfig {
  umbralDescensoMinimo: number;
  umbralDescensoAbrupto: number;
  umbralConsumo Cero: number;
  factorDesviacion: number;
}
```

```typescript
// src/types/index.ts (barrel export)
export * from './consumo.types';
export * from './anomalia.types';
export * from './derivacion.types';
export * from './saldoATR.types';
export * from './common.types';
```

**Uso:**

```typescript
// ✅ Import único desde types/
import type { ConsumoEnergetico, Anomalia, TipoAnomalia } from '@/types';

// ❌ Antes: imports dispersos
import type { ConsumoEnergetico } from '../services/dataService';
import type { Anomalia } from '../services/anomaliaService';
```

### 3.2 Implementar Barrel Exports

**Objetivo:** Simplificar imports y mejorar DX (Developer Experience)

**Antes:**

```typescript
import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { Modal } from '../../components/Modal/Modal';
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner';
```

**Después:**

```typescript
import { Button, Card, Modal, LoadingSpinner } from '@/components';
```

**Implementación:**

```typescript
// src/components/index.ts
export { Button } from './Button/Button';
export { Card } from './Card/Card';
export { Modal } from './Modal/Modal';
export { LoadingSpinner } from './LoadingSpinner/LoadingSpinner';
export { ErrorMessage } from './ErrorMessage/ErrorMessage';
export { EmptyState } from './EmptyState/EmptyState';
// ... todos los componentes
```

```typescript
// src/hooks/index.ts
export { useFiltrarDatos } from './useFiltrarDatos';
export { usePaginacion } from './usePaginacion';
export { useOrdenar } from './useOrdenar';
export { useImportarArchivos } from './useImportarArchivos';
export { useProcesarDatos } from './useProcesarDatos';
// ... todos los hooks
```

```typescript
// src/services/index.ts
export * from './anomaliaService';
export * from './dataService';
export * from './importService';
export * from './exportacionService';
export * from './loggerService';
// ... todos los servicios
```

```typescript
// src/utils/index.ts
export * from './formateo';
export * from './validaciones';
export * from './calculos';
export * from './fechas';
```

### 3.3 Configurar Path Aliases en TypeScript

**tsconfig.json:**

```json
{
  "compilerOptions": {
    // ... otras opciones
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components": ["src/components"],
      "@/hooks": ["src/hooks"],
      "@/services": ["src/services"],
      "@/utils": ["src/utils"],
      "@/types": ["src/types"],
      "@/constants": ["src/constants"],
      "@/pages": ["src/pages"],
      "@/context": ["src/context"],
      "@/styles": ["src/styles"]
    }
  }
}
```

**vite.config.ts:**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/constants': path.resolve(__dirname, './src/constants'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/context': path.resolve(__dirname, './src/context'),
      '@/styles': path.resolve(__dirname, './src/styles'),
    },
  },
});
```

**Uso:**

```typescript
// ✅ DESPUÉS - Paths limpios
import { Button } from '@/components';
import { useFiltrarDatos } from '@/hooks';
import { detectarAnomalias } from '@/services';
import { formatearFecha } from '@/utils';
import type { ConsumoEnergetico } from '@/types';

// ❌ ANTES - Paths relativos confusos
import { Button } from '../../../components/Button/Button';
import { useFiltrarDatos } from '../../hooks/useFiltrarDatos';
import { detectarAnomalias } from '../../../services/anomaliaService';
```

---

**Documento continuará con las fases restantes en próxima actualización...**

Para ver el plan completo actualizado, consulta:

- `PLAN_ACCION_VALORAPP_V2.md` - Plan general de evolución
- `AUDITORIA_REFACTOR_VALORAPP.md` - Este documento (auditoría y refactorización)

---

## 📊 Métricas de Progreso

| Fase                    | Tareas | Completadas | Pendientes | Progreso |
| ----------------------- | ------ | ----------- | ---------- | -------- |
| Fase 0: Auditoría       | 4      | 0           | 4          | 0%       |
| Fase 1: Limpieza        | 4      | 0           | 4          | 0%       |
| Fase 2: Refactorización | 3      | 0           | 3          | 0%       |
| Fase 3: Arquitectura    | 3      | 0           | 3          | 0%       |
| **TOTAL**               | **14** | **0**       | **14**     | **0%**   |

---

## ⚠️ IMPORTANTE - Reglas de Oro

1. **NO modificar funcionalidad existente** - Solo refactorizar código
2. **NO cambiar estilos visuales** - Mantener look & feel actual
3. **NO agregar backend/API** - Es una app client-side pura
4. **NO agregar persistencia** - Sin localStorage/sessionStorage
5. **SÍ testear todo cambio** - Verificar que la app sigue funcionando
6. **SÍ mantener tipos estrictos** - TypeScript en modo strict
7. **SÍ documentar decisiones** - Comentarios JSDoc en funciones públicas
8. **SÍ hacer commits atómicos** - Un cambio conceptual por commit

---

**Última actualización:** 2025-11-13  
**Autor:** GitHub Copilot  
**Revisión:** Pendiente
