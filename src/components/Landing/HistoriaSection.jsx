// src/pages/landing/components/HistoriaSection.jsx

export default function HistoriaSection({ foto = null }) {
  return (
    <section id="historia" className="py-24 bg-gradient-to-b from-[#05080d] to-[#070c14] relative overflow-hidden">
      <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full
                      bg-[radial-gradient(circle,rgba(19,236,236,0.04),transparent_70%)]" />

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          {/* Visual */}
          <div className="relative pb-12 lg:pb-0">
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#0E1620] border border-primary/10">
              {foto
                ? <img src={foto} alt="Historia Club Cezeus" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center opacity-20 text-5xl">📸</div>
              }
            </div>
            {/* Quote flotante */}
            <blockquote className="absolute -bottom-6 lg:-right-8 bg-primary text-[#05080d] rounded-2xl p-5 max-w-[280px] shadow-xl">
              <p className="font-black italic text-[15px] leading-snug">
                "Espacio de crecimiento y formación personal de calidad humana por el deporte"
              </p>
              <cite className="not-italic text-[10px] font-black uppercase tracking-widest opacity-60 mt-2 block">
                Club Deportivo Cezeus
              </cite>
            </blockquote>
          </div>

          {/* Contenido */}
          <div>
            <p className="flex items-center gap-3 text-primary text-[11px] font-black uppercase tracking-[0.25em] mb-4">
              <span className="w-6 h-0.5 bg-primary inline-block" /> Nuestra Historia
            </p>
            <h2 className="font-black italic text-[clamp(40px,5vw,64px)] leading-none tracking-tight mb-6">
              MÁS QUE UN<br /><span className="text-primary">CLUB</span>
            </h2>
            <p className="text-slate-400 text-[17px] leading-relaxed mb-5">
              El Club Deportivo Cezeus nació con una misión clara: transformar vidas a través del deporte.
              Con la Resolución 460 del I.D.R.D., hemos construido un espacio seguro y estructurado
              donde los niños y jóvenes de Bogotá desarrollan sus habilidades deportivas y personales.
            </p>
            <p className="text-slate-400 text-[17px] leading-relaxed mb-8">
              Nuestros entrenadores son Licenciados en Educación Física con amplia experiencia en
              formación deportiva infantil.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🎯', title: 'Misión', text: 'Favorecer los procesos de formación deportiva y crecimiento personal con sentido humano.' },
                { icon: '🚀', title: 'Visión',  text: 'Desarrollar y orientar el talento de cada niño para que comprendan la importancia del deporte.' },
              ].map(mv => (
                <div key={mv.title} className="bg-[#0E1620] border border-white/10 rounded-2xl p-5">
                  <h3 className="text-primary font-black text-[15px] uppercase tracking-widest mb-2">{mv.icon} {mv.title}</h3>
                  <p className="text-slate-400 text-[13px] leading-relaxed">{mv.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}