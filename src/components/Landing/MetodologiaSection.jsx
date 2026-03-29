import React from 'react';

// Iconos SVG consistentes con tu estética de trazos limpios
const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

const MobileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3M12 18.75h.008v.008H12v-.008Z" />
  </svg>
);

const CapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75" />
  </svg>
);

const MetodologiaSection = () => {
  return (
    <section id="metodologia" className="py-24 bg-[#05080d] relative overflow-hidden">
      {/* Elemento decorativo de fondo */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Encabezado — Estilo ModalAsistencia */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Innovación Deportiva</p>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none text-center md:text-left">
            Metodología <span className="text-primary">Tech-Cezeus</span>
          </h2>
          <div className="mt-6 h-1 w-24 bg-primary rounded-full mx-auto md:mx-0"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Columna de Beneficios — Estilo Cards de Asistencia */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="group p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:border-primary/20 hover:bg-white/[0.04] transition-all duration-500">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <ChartIcon />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2 group-hover:text-primary transition-colors">Data en Tiempo Real</h3>
                  <p className="text-slate-500 text-[13px] font-bold leading-relaxed uppercase tracking-wide">
                    Convertimos el entrenamiento en métricas. Cada pase, velocidad y resistencia se registra para optimizar el rendimiento individual.
                  </p>
                </div>
              </div>
            </div>

            <div className="group p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:border-primary/20 hover:bg-white/[0.04] transition-all duration-500">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <MobileIcon />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2 group-hover:text-primary transition-colors">Ecosistema Digital</h3>
                  <p className="text-slate-500 text-[13px] font-bold leading-relaxed uppercase tracking-wide">
                    Asistencia automatizada, carnets digitales y reportes PDF inmediatos. La gestión del club en la palma de tu mano.
                  </p>
                </div>
              </div>
            </div>

            <div className="group p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:border-primary/20 hover:bg-white/[0.04] transition-all duration-500">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <CapIcon />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2 group-hover:text-primary transition-colors">Seguimiento de Carrera</h3>
                  <p className="text-slate-500 text-[13px] font-bold leading-relaxed uppercase tracking-wide">
                    Generamos un historial técnico permanente. No solo entrenamos para hoy, proyectamos el futuro profesional del deportista.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Columna Visual — Estilo Mockup Carnet Digital */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-transparent rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            
            <div className="relative bg-[#0a1118] border border-white/10 p-4 rounded-[3rem] shadow-2xl backdrop-blur-xl">
              <div className="rounded-[2rem] overflow-hidden border border-white/5 bg-[#05080d]">
                <img 
                  src="/assets/img/dashboard-cezeus.png" 
                  alt="Vista Dashboard Cezeus" 
                  className="w-full h-auto opacity-70 group-hover:opacity-100 transition-opacity duration-700"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/600x800/0a1118/00f0ff?text=CEZEUS+DASHBOARD'; }}
                />
              </div>
              
              {/* Badge flotante — Estilo Botones de Estado */}
              <div className="absolute -bottom-6 -left-6 bg-primary text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 italic transform -rotate-3">
                Exclusivo Alumnos
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default MetodologiaSection;