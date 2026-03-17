// src/pages/landing/components/ValoresSection.jsx

const VALORES = [
  { icon: '🤝', title: 'Respeto',          desc: 'Tratamos a cada estudiante y familia con dignidad. El respeto es la base de nuestra comunidad.' },
  { icon: '⭐', title: 'Disciplina',        desc: 'La constancia y el esfuerzo diario son los pilares del crecimiento deportivo y personal.' },
  { icon: '👥', title: 'Trabajo en equipo', desc: 'Los logros colectivos superan los individuales. Juntos somos más fuertes dentro y fuera de la cancha.' },
  { icon: '💪', title: 'Superación',        desc: 'Cada reto es una oportunidad para ser mejores personas y mejores deportistas.' },
];

export default function ValoresSection() {
  return (
    <section id="valores" className="py-24 bg-[#07090f] text-center">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl mx-auto mb-16">
          <p className="flex items-center justify-center gap-3 text-primary text-[11px] font-black uppercase tracking-[0.25em] mb-3">
            <span className="w-6 h-0.5 bg-primary inline-block" /> Lo que nos define
          </p>
          <h2 className="font-black italic text-[clamp(40px,5vw,64px)] leading-none">
            NUESTROS <span className="text-primary">VALORES</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALORES.map(v => (
            <div key={v.title}
                 className="bg-[#0E1620] border border-white/6 rounded-[18px] p-8
                            hover:border-primary/20 hover:-translate-y-1 transition-all">
              <span className="text-3xl block mb-4">{v.icon}</span>
              <h3 className="text-primary font-black text-[18px] uppercase italic tracking-wide mb-3">{v.title}</h3>
              <p className="text-slate-400 text-[14px] leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}