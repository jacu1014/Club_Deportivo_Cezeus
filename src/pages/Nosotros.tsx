import React from 'react';
import { MissionCard, VisionCard } from '../components/Institucion/InstitutionalCards';

const Nosotros = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 px-4 py-12">
      
      {/* HEADER INSTITUCIONAL */}
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <span className="px-4 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
            Club Deportivo Cezeus
          </span>
        </div>
        <h2 className="text-white font-black text-5xl md:text-6xl uppercase italic tracking-tighter leading-tight">
          NUESTRA <span className="text-primary text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-blue-500">ESENCIA</span>
        </h2>
        <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.5em] max-w-2xl mx-auto">
          Formando deportistas íntegros para los retos del mañana
        </p>
      </div>

      {/* GRID DE CONTENIDO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-16">
        <MissionCard />
        <VisionCard />
      </div>

      {/* PIE DE PÁGINA INSTITUCIONAL */}
      <div className="bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 rounded-[3rem] p-12 text-center">
        <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-8 italic">Valores Fundamentales</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { lab: 'Sentido Humano', icon: 'favorite' },
            { lab: 'Disciplina', icon: 'sports_soccer' },
            { lab: 'Principios', icon: 'verified_user' },
            { lab: 'Cuidado por la vida', icon: 'eco' }
          ].map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all duration-300">
                <span className="material-symbols-outlined text-2xl">{v.icon}</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">
                {v.lab}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Nosotros;