/**
 * 📊 ValorApp_v2 - Aplicación Principal
 * 
 * Aplicación de análisis de consumo energético y detección de anomalías.
 * Procesa datos de consumo desde archivos CSV/JSON y detecta patrones anormales.
 */

import { AppProvider } from './context/AppContext';
import { Button } from './components';
import './App.css';

function App() {
  return (
    <AppProvider>
      <div className="app">
        <header className="app-header">
          <h1>📊 ValorApp v2.0</h1>
          <p className="app-subtitle">Análisis de Consumo Energético y Detección de Anomalías</p>
        </header>

        <main className="app-main">
          <section className="welcome-section">
            <h2>Bienvenido a ValorApp</h2>
            <p>
              Sistema profesional para analizar consumos energéticos, detectar anomalías 
              derivadas de fraudes o averías en contadores, y determinar la factura donde 
              inicia la anomalía.
            </p>

            <div className="feature-grid">
              <div className="feature-card">
                <h3>📥 Importación de Datos</h3>
                <p>Carga archivos CSV o JSON con datos de consumo energético.</p>
              </div>

              <div className="feature-card">
                <h3>📊 Análisis Comparativo</h3>
                <p>Compara consumos mensuales y detecta variaciones significativas.</p>
              </div>

              <div className="feature-card">
                <h3>🔍 Detección de Anomalías</h3>
                <p>Identifica descensos anormales, picos y patrones irregulares.</p>
              </div>

              <div className="feature-card">
                <h3>📈 Visualización</h3>
                <p>Gráficos interactivos y reportes detallados de análisis.</p>
              </div>
            </div>

            <div className="action-buttons">
              <Button variant="primary" size="large">
                Comenzar Análisis
              </Button>
              <Button variant="outline" size="large">
                Ver Documentación
              </Button>
            </div>
          </section>
        </main>

        <footer className="app-footer">
          <p>ValorApp v2.0 - Sistema de Análisis Energético © 2025</p>
        </footer>
      </div>
    </AppProvider>
  );
}

export default App;
