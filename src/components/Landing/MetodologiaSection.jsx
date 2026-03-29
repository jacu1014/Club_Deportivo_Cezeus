import React from 'react';

// Iconos optimizados para el lenguaje del proyecto (Evaluación, Radar y Asistencia)
const RadarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3m15.364-6.364l-12.728 12.728m12.728 0L5.636 5.636" />
    <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
  </svg>
);

const AttendanceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const MetodologiaSection = () => {
  return (
    <section id="metodologia" className="py-24 bg-[#05080d] relative overflow-hidden">
      {/* Decoración de fondo coherente con el Dashboard */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Encabezado con la tipografía y estilo de AvancesPage */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(0,240,255,0.5)]"></span>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Evolución Deportiva Inteligente</p>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none text-center md:text-left">
            ADN <span className="text-primary">Cezeus</span>
          </h2>
          <div className="mt-6 h-1 w-24 bg-primary rounded-full mx-auto md:mx-0 shadow-[0_0_15px_rgba(0,240,255,0.3)]"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Columna de Funcionalidades Reales */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="group p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:border-primary/20 hover:bg-white/[0.04] transition-all duration-500">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all">
                  <RadarIcon />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2 group-hover:text-primary transition-colors">Ciclos de Evaluación</h3>
                  <p className="text-slate-500 text-[13px] font-bold leading-relaxed uppercase tracking-wide">
                    Medimos el progreso mediante gráficos de radar dinámicos. Evaluamos pilares técnicos, físicos y tácticos con comparativas entre el estado inicial y final de cada ciclo.
                  </p>
                </div>
              </div>
            </div>

            <div className="group p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:border-primary/20 hover:bg-white/[0.04] transition-all duration-500">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-all">
                  <AttendanceIcon />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2 group-hover:text-primary transition-colors">Control de Asistencia Digital</h3>
                  <p className="text-slate-500 text-[13px] font-bold leading-relaxed uppercase tracking-wide">
                    Gestión en tiempo real de la presencia en cancha. Sincronización inmediata con el perfil del alumno y alertas de inactividad para un seguimiento riguroso.
                  </p>
                </div>
              </div>
            </div>

            <div className="group p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:border-primary/20 hover:bg-white/[0.04] transition-all duration-500">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-all">
                  <HistoryIcon />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2 group-hover:text-primary transition-colors">Bitácora de Seguimiento</h3>
                  <p className="text-slate-500 text-[13px] font-bold leading-relaxed uppercase tracking-wide">
                    Historial permanente de observaciones de los entrenadores. Cada avance técnico queda registrado en una línea de tiempo accesible para el cuerpo técnico.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Columna Visual: Mockup que representa el "Radar" que tanto hemos trabajado */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-transparent rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            
            <div className="relative bg-[#0a1118] border border-white/10 p-4 rounded-[3rem] shadow-2xl backdrop-blur-xl">
              <div className="rounded-[2rem] overflow-hidden border border-white/5 bg-[#05080d] aspect-[4/5] flex items-center justify-center relative">
                {/* Aquí iría el screenshot de la sección SeguimientoAlumno.jsx */}
                <div className="absolute inset-0 bg-[url('/assets/img/radar-mockup.png')] bg-cover bg-center opacity-60 group-hover:opacity-90 transition-opacity"></div>
                
                {/* Elemento gráfico representativo del Radar si no hay imagen */}
                <div className="relative z-10 w-48 h-48 border border-primary/20 rounded-full flex items-center justify-center animate-spin-slow">
                  <div className="w-full h-[1px] bg-primary/40 absolute rotate-45"></div>
                  <div className="w-full h-[1px] bg-primary/40 absolute -rotate-45"></div>
                  <div className="w-32 h-32 border border-primary/40 rounded-full"></div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-primary text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 italic transform rotate-3">
                Tracking 24/7
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default MetodologiaSection;