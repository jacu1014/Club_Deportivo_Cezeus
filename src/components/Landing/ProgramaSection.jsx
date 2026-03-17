// src/pages/landing/components/ProgramaSection.jsx

const HORARIOS = [
  { dia: 'Sábados',  hora: '8:00 – 9:30 AM' },
  { dia: 'Domingos', hora: '8:00 – 9:30 AM' },
];

const COSTOS = [
  { nombre: 'Matrícula',    nota: 'Pago único',             valor: '$15.000' },
  { nombre: 'Mensualidad',  nota: 'Primeros 5 días del mes', valor: '$90.000' },
  { nombre: 'Uniforme',     nota: 'Obligatorio para clases', valor: '$90.000' },
];

export default function ProgramaSection() {
  return (
    <section id="programa" className="py-24 bg-[#05080d]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="flex items-center justify-center gap-3 text-primary text-[11px] font-black uppercase tracking-[0.25em] mb-3">
            <span className="w-6 h-0.5 bg-primary inline-block" /> Información Práctica
          </p>
          <h2 className="font-black italic text-[clamp(40px,5vw,64px)] leading-none">
            HORARIOS <span className="text-primary">&amp; COSTOS</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Horarios */}
          <div className="bg-[#0E1620] border border-primary/12 rounded-[20px] p-9">
            <h3 className="font-black text-[20px] uppercase italic tracking-wide mb-6 flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-lg">⚽</span>
              Fútbol
            </h3>
            {HORARIOS.map(h => (
              <div key={h.dia} className="flex justify-between items-center py-4 border-b border-white/5">
                <span className="font-bold text-[15px]">{h.dia}</span>
                <span className="text-primary font-black text-[18px] italic">{h.hora}</span>
              </div>
            ))}
            <p className="mt-4 text-slate-500 text-[12px] font-black uppercase tracking-widest">
              ⏰ Presentarse 10 min antes
            </p>
          </div>

          {/* Costos */}
          <div className="bg-[#0E1620] border border-white/6 rounded-[20px] p-9">
            <h3 className="font-black text-[20px] uppercase italic tracking-wide mb-6">Inversión</h3>
            {COSTOS.map(c => (
              <div key={c.nombre} className="flex justify-between items-center py-4 border-b border-white/5">
                <div>
                  <div className="font-bold text-[15px]">{c.nombre}</div>
                  <div className="text-slate-400 text-[12px]">{c.nota}</div>
                </div>
                <span className="font-black text-[26px] italic text-primary">{c.valor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA inscripción */}
        <div className="bg-gradient-to-r from-primary/8 to-primary/2 border border-primary/20 rounded-[20px] p-10
                        flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="font-black text-[22px] uppercase italic tracking-wide mb-2">¿Cómo inscribirse?</h3>
            <p className="text-slate-400 text-[15px] max-w-lg">
              Presenta fotocopia de la tarjeta de identidad, documento de EPS y cancela
              matrícula más la primera mensualidad.
            </p>
          </div>
          <div className="flex flex-col gap-3 items-start">
            <a href="#contacto"
               className="bg-primary text-[#05080d] font-black uppercase text-[12px] tracking-widest
                          px-8 py-4 rounded-xl hover:bg-[#0AB5B5] transition-all whitespace-nowrap">
              Iniciar inscripción
            </a>
            <a href="tel:3134185403" className="text-primary text-[13px] font-black">
              📞 3134185403 · Lic. Cesar Ceballos
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}