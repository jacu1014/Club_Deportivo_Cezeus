import React from 'react';

// Iconos definidos como componentes internos para evitar dependencias externas
const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

const MobileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3M12 18.75h.008v.008H12v-.008Z" />
  </svg>
);

const CapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75" />
  </svg>
);

const MetodologiaSection = () => {
  return (
    <section id="metodologia" className="py-20 bg-[#0a0f18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tight">
            Tecnología <span className="text-primary">Cezeus</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light">
            Fuimos creados para formar deportistas integrales. Somos el único club que utiliza una 
            plataforma propia para medir el crecimiento de cada talento en tiempo real.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Columna de Beneficios */}
          <div className="space-y-10">
            <div className="flex items-start group">
              <div className="flex-shrink-0 bg-primary/20 p-4 rounded-2xl border border-primary/30 group-hover:bg-primary transition-colors duration-300">
                <ChartIcon />
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-bold text-white mb-2">Evaluación con Datos Reales</h3>
                <p className="text-slate-400 leading-relaxed">
                  Realizamos pruebas técnicas mensuales. Los resultados alimentan nuestro motor de datos para generar un historial de progreso objetivo por cada niño.
                </p>
              </div>
            </div>

            <div className="flex items-start group">
              <div className="flex-shrink-0 bg-primary/20 p-4 rounded-2xl border border-primary/30 group-hover:bg-primary transition-colors duration-300">
                <MobileIcon />
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-bold text-white mb-2">Perfil Digital del Deportista</h3>
                <p className="text-slate-400 leading-relaxed">
                  Acceso a un carnet digital y seguimiento de asistencias. Cada alumno tiene su propio espacio en nuestra nube.
                </p>
              </div>
            </div>

            <div className="flex items-start group">
              <div className="flex-shrink-0 bg-primary/20 p-4 rounded-2xl border border-primary/30 group-hover:bg-primary transition-colors duration-300">
                <CapIcon />
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-bold text-white mb-2">Gráficas de Radar (Habilidades)</h3>
                <p className="text-slate-400 leading-relaxed">
                  Visualiza el equilibrio entre técnica, táctica y físico. Una herramienta clara para que los padres entiendan la evolución de sus hijos.
                </p>
              </div>
            </div>
          </div>

          {/* Columna Visual */}
          <div className="relative">
            {/* Brillo de fondo para resaltar la imagen */}
            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-3xl opacity-30"></div>
            
            <div className="relative bg-slate-800/50 rounded-3xl p-3 backdrop-blur-sm border border-slate-700 shadow-2xl">
              <div className="rounded-2xl overflow-hidden border border-slate-600 bg-slate-900">
                <img 
                  src="/assets/img/dashboard-cezeus.png" 
                  alt="Plataforma Cezeus" 
                  className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity duration-500"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/600x450/0f172a/00f0ff?text=Dashboard+Cezeus+Active'; }}
                />
              </div>
            </div>
            
            {/* Badge decorativo */}
            <div className="absolute -bottom-8 -right-4 bg-primary text-[#05080d] px-6 py-4 rounded-2xl font-black shadow-xl transform -rotate-3">
              APP EXCLUSIVA
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default MetodologiaSection;