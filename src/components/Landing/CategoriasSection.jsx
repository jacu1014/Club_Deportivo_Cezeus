// src/pages/landing/components/CategoriasSection.jsx

const CATEGORIAS = [
  {
    num: '01', nombre: 'Iniciación', rango: '5 a 7 años',
    desc: 'Primera etapa de contacto con el fútbol. Coordinación, juego y amor por el deporte en un ambiente lúdico.',
    fases: ['Sensibilización al deporte', 'Juego libre con estructura', 'Motricidad básica'],
  },
  {
    num: '02', nombre: 'Infantil', rango: '8 a 10 años',
    desc: 'Consolidación de técnicas básicas. Trabajo en equipo, reglas del juego y desarrollo físico progresivo.',
    fases: ['Iniciación al deporte', 'Técnica individual', 'Aprendizaje táctico'],
  },
  {
    num: '03', nombre: 'Transición', rango: '11 a 13 años',
    desc: 'Perfeccionamiento técnico y táctico. Preparación competitiva y fortalecimiento del carácter deportivo.',
    fases: ['Perfeccionamiento técnico', 'Táctica de equipo', 'Preparación competitiva'],
  },
];

export default function CategoriasSection() {
  return (
    <section id="categorias" className="py-24 bg-[#07090f]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-end mb-14 flex-wrap gap-6">
          <div>
            <p className="flex items-center gap-3 text-primary text-[11px] font-black uppercase tracking-[0.25em] mb-3">
              <span className="w-6 h-0.5 bg-primary inline-block" /> Programa Deportivo
            </p>
            <h2 className="font-black italic text-[clamp(40px,5vw,64px)] leading-none">
              CATEGORÍAS <span className="text-primary">POR EDAD</span>
            </h2>
          </div>
          <p className="text-slate-400 text-[17px] max-w-sm leading-relaxed">
            Grupos organizados pedagógicamente para maximizar el aprendizaje en cada etapa del desarrollo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CATEGORIAS.map(cat => (
            <article key={cat.num}
                     className="bg-[#0E1620] border border-white/6 rounded-[20px] p-10
                                hover:border-primary/25 hover:-translate-y-1 transition-all group relative overflow-hidden">
              {/* Línea top al hover */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />

              <div className="font-black text-[64px] leading-none text-primary/8 mb-2">{cat.num}</div>
              <h3 className="font-black text-[28px] uppercase italic tracking-wide mb-1">{cat.nombre}</h3>
              <p className="text-primary text-[13px] font-black tracking-widest mb-4">{cat.rango}</p>
              <p className="text-slate-400 text-[15px] leading-relaxed mb-5">{cat.desc}</p>

              <div className="space-y-2">
                {cat.fases.map(f => (
                  <div key={f} className="flex items-center gap-3 text-[13px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}