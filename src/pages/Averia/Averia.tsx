/**
 * ⚙️ Página de Selección de Tipo de Avería
 *
 * Pantalla que permite seleccionar el tipo específico de avería a analizar:
 * WART, ERROR DE MONTAJE o ERROR DE AVERÍA.
 */

import { useNavigate } from 'react-router-dom';

export const Averia = () => {
  const navigate = useNavigate();

  const handleVolver = () => {
    navigate('/');
  };

  const handleTipoAveriaClick = (tipo: string) => {
    if (tipo === 'WART') {
      navigate('/wart');
    } else {
      alert(`Proceso de valoración de ${tipo} próximamente`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 overflow-hidden">
      <div className="relative max-w-5xl w-full">
        <button
          onClick={() => navigate(-1)}
          aria-label="Volver atrás"
          className="absolute top-0 left-0 w-11 h-11 flex items-center justify-center rounded-full 
                     bg-primary text-white shadow-lg hover:bg-primary-light 
                     hover:ring-2 hover:ring-white/50
                     transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white/40"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center mb-12 mt-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-poppins">
            Seleccione el subtipo de Avería
          </h2>
          <p className="text-lg text-white/70 max-w-xl mx-auto font-light">
            Elija una opción para continuar con el proceso de valoración
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => handleTipoAveriaClick('WART')}
            className="group relative w-full bg-gradient-to-br from-secondary to-secondary-dark 
                     text-white font-semibold text-lg
                     py-16 px-6 rounded-2xl shadow-pink-glow 
                     hover:shadow-pink-glow-lg hover:scale-105
                     transform transition-all duration-300 ease-out
                     focus:outline-none focus:ring-4 focus:ring-white/30
                     overflow-hidden"
          >
            <span className="relative z-10 text-2xl font-semibold">WART</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>

          <button
            onClick={() => handleTipoAveriaClick('ERROR DE MONTAJE')}
            className="group relative w-full bg-gradient-to-br from-secondary to-secondary-dark 
                     text-white font-semibold text-lg
                     py-16 px-6 rounded-2xl shadow-pink-glow 
                     hover:shadow-pink-glow-lg hover:scale-105
                     transform transition-all duration-300 ease-out
                     focus:outline-none focus:ring-4 focus:ring-white/30
                     overflow-hidden"
          >
            <span className="relative z-10 text-2xl font-semibold">ERROR DE MONTAJE</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>

          <button
            onClick={() => handleTipoAveriaClick('ERROR DE AVERÍA')}
            className="group relative w-full bg-gradient-to-br from-secondary to-secondary-dark 
                     text-white font-semibold text-lg
                     py-16 px-6 rounded-2xl shadow-pink-glow 
                     hover:shadow-pink-glow-lg hover:scale-105
                     transform transition-all duration-300 ease-out
                     focus:outline-none focus:ring-4 focus:ring-white/30
                     overflow-hidden"
          >
            <span className="relative z-10 text-2xl font-semibold">ERROR DE AVERÍA</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleVolver}
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 
                     text-white font-semibold 
                     py-2 px-4 rounded-lg border border-white/30
                     hover:border-white/50 hover:scale-105
                     transition-all duration-300 ease-out
                     focus:outline-none focus:ring-4 focus:ring-white/30
                     flex items-center justify-center gap-2 text-sm"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Volver</span>
          </button>
        </div>
      </div>
    </div>
  );
};
