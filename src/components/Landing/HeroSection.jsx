// src/pages/landing/components/HeroSection.jsx

export default function HeroSection({ fotos = [] }) {
  const fotoMain      = fotos[0]?.url || null;
  const fotoSecundaria = fotos[1]?.url || null;

  return (
    <section id="hero" className="min-h-screen flex items-center relative overflow-hidden pt-[72px]">
      {/* Fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(19,236,236,0.07),transparent_70%),radial-gradient(ellipse_60%_80%_at_20%_80%,rgba(255,107,53,0.04),transparent_60%)]" />
      <div className="absolute inset-0 opacity-30"
           style={{ backgroundImage: 'linear-gradient(rgba(19,236,236,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(19,236,236,0.03) 1px,transparent 1px)', backgroundSize:'60px 60px' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Texto */}
          <div>
            <p className="flex items-center gap-3 text-primary text-[11px] font-black uppercase tracking-[0.25em] mb-5">
              <span className="w-8 h-0.5 bg-primary inline-block" />
              Resolución 460 I.D.R.D. · Bogotá, Colombia
            </p>

            <h1 className="font-black text-[clamp(56px,7vw,96px)] leading-none tracking-tight italic mb-6">
              FORMAMOS<br />
              <span className="text-primary">CAMPEONES</span><br />
              DE VIDA
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed max-w-md mb-10">
              Más de una décadas formando niños y jóvenes a través del fútbol,
              infundiendo valores, disciplina y amor por el deporte.
              Categorías para edades de <strong className="text-white">5 a 13 años</strong>.
            </p>

            <div className="flex gap-4 flex-wrap mb-14">
              <a href="#contacto"
                 className="bg-primary text-[#05080d] font-black uppercase text-[13px] tracking-widest
                            px-9 py-4 rounded-xl hover:bg-[#0AB5B5] transition-all shadow-[0_8px_24px_rgba(19,236,236,0.25)]">
                Inscribir a mi hijo
              </a>
              <a href="#historia"
                 className="border border-white/20 text-white font-black uppercase text-[13px] tracking-widest
                            px-9 py-4 rounded-xl hover:border-primary hover:bg-primary/5 transition-all">
                Conoce el club
              </a>
            </div>

            {/* Stats */}
            <div className="flex gap-10">
              {[
                { num: '+10', label: 'Años de historia' },
                { num: '3',   label: 'Categorías' },
                { num: '100%',label: 'Entrenadores licenciados' },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-primary font-black text-4xl leading-none italic">{s.num}</div>
                  <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative h-[520px] hidden lg:block">
            {/* Foto principal */}
            <div className="absolute top-0 left-5 right-0 bottom-16 rounded-2xl overflow-hidden
                            bg-[#0E1620] border border-primary/10">
              {fotoMain
                ? <img src={fotoMain} alt="Club Cezeus entrenamiento" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center flex-col gap-3 opacity-20">
                    <span className="text-5xl">⚽</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Foto principal</span>
                  </div>
              }
            </div>
            {/* Foto secundaria */}
            <div className="absolute bottom-0 left-0 w-48 h-40 rounded-xl overflow-hidden bg-[#0E1620] border-2 border-primary">
              {fotoSecundaria
                ? <img src={fotoSecundaria} alt="Club Cezeus" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center opacity-20 text-3xl">🏆</div>
              }
            </div>
            {/* Badge */}
            <div className="absolute top-5 right-0 bg-[#0a1118] border border-primary/20 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">⚽</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-primary">Fútbol<br />Formativo</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}