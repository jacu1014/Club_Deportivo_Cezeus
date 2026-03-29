// src/pages/landing/components/MetodologiaSection.jsx
import React from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Legend, Tooltip
} from 'recharts';

// Iconos SVG personalizados Cezeus (Estilo trazos limpios)
const DataAnalyticsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

const PlatformIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3M12 18.75h.008v.008H12v-.008Z" />
  </svg>
);

const CareerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
  </svg>
);

// Datos Estáticos para el Radar "Tipo FIFA"
const radarData = [
  { subject: 'Técnica', A: 85, fullMark: 100 },
  { subject: 'Táctica', A: 70, fullMark: 100 },
  { subject: 'Físico', A: 90, fullMark: 100 },
  { subject: 'Mente', A: 78, fullMark: 100 },
  { subject: 'Disciplina', A: 95, fullMark: 100 },
  { subject: 'Liderazgo', A: 65, fullMark: 100 },
];

const MetodologiaSection = () => {
  return (
    <section id="metodologia" className="py-24 bg-[#05080d] relative overflow-hidden">
      {/* Elemento decorativo de fondo */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] -z-10"></div>
      
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        
        {/* Encabezado con la tipografía Cezeus */}
        <div className="mb-20">
          <p className="flex items-center gap-3 text-primary text-[11px] font-black uppercase tracking-[0.25em] mb-3 justify-center md:justify-start">
            <span className="w-6 h-0.5 bg-primary inline-block" /> Innovación Deportiva
          </p>
          <h2 className="font-black italic text-[clamp(40px,5vw,64px)] leading-none text-white text-center md:text-left">
            METODOLOGÍA <span className="text-primary">CEZEUS</span>
          </h2>
          <div className="mt-6 h-1 w-24 bg-primary rounded-full mx-auto md:mx-0 shadow-[0_0_15px_#13ecec]"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Columna de Beneficios Actualizados */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="group p-8 bg-[#0E1620] border border-white/6 rounded-[2.5rem] hover:border-primary/25 hover:bg-black/20 transition-all duration-500">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(19,236,236,0.1)] transition-all">
                  <DataAnalyticsIcon />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2 group-hover:text-primary transition-colors">Data en Tiempo Real</h3>
                  <p className="text-slate-500 text-[13px] font-bold leading-relaxed uppercase tracking-wide">
                    Registramos métricas de cada entrenamiento y partido para optimizar el rendimiento técnico y físico de forma instantánea.
                  </p>
                </div>
              </div>
            </div>

            <div className="group p-8 bg-[#0E1620] border border-white/6 rounded-[2.5rem] hover:border-primary/25 hover:bg-black/20 transition-all duration-500">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-all">
                  <PlatformIcon />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2 group-hover:text-primary transition-colors">Ecosistema Digital</h3>
                  <p className="text-slate-500 text-[13px] font-bold leading-relaxed uppercase tracking-wide">
                    Gestión total del club en la palma de tu mano. Carnets digitales, asistencia automatizada y reportes inmediatos.
                  </p>
                </div>
              </div>
            </div>

            <div className="group p-8 bg-[#0E1620] border border-white/6 rounded-[2.5rem] hover:border-primary/25 hover:bg-black/20 transition-all duration-500">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-all">
                  <CareerIcon />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2 group-hover:text-primary transition-colors">Seguimiento de Carrera</h3>
                  <p className="text-slate-500 text-[13px] font-bold leading-relaxed uppercase tracking-wide">
                    Generamos un historial técnico permanente que proyecta y documenta el futuro profesional del deportista.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Columna Visual — Mockup Radar "Tipo FIFA" Estático */}
          <div className="lg:col-span-5 relative group h-[450px]">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-transparent rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            
            <div className="relative h-full bg-[#0a1118] border border-white/10 rounded-[3rem] shadow-2xl backdrop-blur-xl flex items-center justify-center p-8">
              <div className="absolute top-8 left-8">
                <p className="text-white/20 font-black uppercase text-[10px] tracking-[0.4em] italic">Perfil Cezeus 24/25</p>
              </div>
              
              <ResponsiveContainer width="100%" height="90%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#ffffff15" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: '900', letterSpacing: '0.05em' }} 
                  />
                  <Radar 
                    name="Performance" 
                    dataKey="A" 
                    stroke="#13ecec" 
                    fill="#13ecec" 
                    fillOpacity={0.1} 
                    strokeWidth={2}
                  />
                  {/* Tooltip personalizado estático */}
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontSize: '10px' }}
                    itemStyle={{ color: '#fff', fontWeight: '900', textTransform: 'uppercase' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
              
              <div className="absolute -bottom-6 -left-6 bg-primary text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 italic transform -rotate-3">
                Tracking Dinámico 24/7
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default MetodologiaSection;