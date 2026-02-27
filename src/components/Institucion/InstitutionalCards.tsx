import React from 'react';

export const MissionCard = () => (
  <div className="group relative bg-[#0a0f18]/60 border border-white/10 rounded-[3rem] p-10 overflow-hidden shadow-2xl backdrop-blur-md hover:border-primary/40 transition-all duration-500">
    <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-all"></div>
    <div className="relative space-y-6">
      <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
        <span className="material-symbols-outlined text-primary text-3xl italic">rocket_launch</span>
      </div>
      <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Misión</h3>
      <p className="text-slate-300 text-sm leading-relaxed font-medium italic border-l-2 border-primary/40 pl-6">
        Favorecer a través de la práctica deportiva sistemática y debidamente planificada, 
        contribuir a los procesos de <span className="text-white">formación deportiva y de crecimiento personal</span> con sentido humano, 
        infundiendo principios y valores en cada uno de los niños, niñas y jóvenes que hacen parte de nuestro Club.
      </p>
    </div>
  </div>
);

export const VisionCard = () => (
  <div className="group relative bg-[#0a0f18]/60 border border-white/10 rounded-[3rem] p-10 overflow-hidden shadow-2xl backdrop-blur-md hover:border-blue-500/40 transition-all duration-500">
    <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-[80px] group-hover:bg-blue-500/20 transition-all"></div>
    <div className="relative space-y-6">
      <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
        <span className="material-symbols-outlined text-blue-400 text-3xl italic">visibility</span>
      </div>
      <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Visión</h3>
      <p className="text-slate-300 text-sm leading-relaxed font-medium italic border-l-2 border-blue-500/40 pl-6">
        Desarrollará, descubrirá y orientará el <span className="text-white">talento humano y deportivo</span> que cada atleta posee, 
        de manera que comprendan la necesidad, importancia y gusto por la actividad física, 
        el deporte y el cuidado por la vida.
      </p>
    </div>
  </div>
);