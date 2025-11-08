/**
 * 📊 ValorApp_v2 - Aplicación Principal
 *
 * Punto de entrada de la aplicación. Configura el proveedor de contexto global
 * y define las rutas principales de navegación.
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context';
import { Home, Averia, Wart, ExpedienteTipoV, SaldoATR } from './pages';
import './App.css';

/**
 * Componente raíz de la aplicación
 */
function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/averia" element={<Averia />} />
          <Route path="/wart" element={<Wart />} />
          <Route path="/expediente-tipo-v" element={<ExpedienteTipoV />} />
          <Route path="/saldo-atr" element={<SaldoATR />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
