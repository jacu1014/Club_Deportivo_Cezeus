// src/components/Landing/ProgramaSection.jsx
const HORARIOS = [
  { dia: 'Sábados',  hora: '8:00 – 9:30 AM' },
  { dia: 'Domingos', hora: '8:00 – 9:30 AM' },
];

export default function ProgramaSection() {
  return (
    <section id="programa" className="py-24 bg-[#05080d]">
      <div className="max-w-6xl mx-auto px-6">

        <div className="text-center mb-14">
          <p className="flex items-center justify-center gap-3 text-primary text-[11px] font-black uppercase tracking-[0.25em] mb-3">
            <span className="w-6 h-0.5 bg-primary inline-block" /> Información Práctica
          </p>
          <h2 className="font-black italic text-[clamp(40px,5vw,64px)] leading-none text-white">
            HORARIOS <span className="text-primary">&amp; UBICACIÓN</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* Horarios */}
          <div className="bg-[#0E1620] border border-primary/12 rounded-[20px] p-9">
            <h3 className="font-black text-[20px] uppercase italic tracking-wide mb-6 flex items-center gap-3 text-white">
              <span className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-lg">⚽</span>
              Entrenamiento
            </h3>
            {HORARIOS.map(h => (
              <div key={h.dia} className="flex justify-between items-center py-4 border-b border-white/5">
                <span className="font-bold text-[15px] text-white">{h.dia}</span>
                <span className="text-primary font-black text-[18px] italic">{h.hora}</span>
              </div>
            ))}
            <p className="mt-6 text-slate-500 text-[12px] font-black uppercase tracking-widest">
              ⏰ Presentarse 10 min antes del inicio
            </p>
            <p className="mt-2 text-slate-600 text-[11px] font-bold uppercase tracking-widest">
              📋 Resolución 460 I.D.R.D. · Bogotá
            </p>
          </div>

          {/* Ubicación */}
          <div className="bg-[#0E1620] border border-white/6 rounded-[20px] overflow-hidden flex flex-col">
            {/* Mapa embed */}
            <div className="flex-1 min-h-[220px] relative">
              <iframe
                title="Ubicación Club Deportivo Cezeus"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.3!2d-74.1174663!3d4.7007414!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9b51a4bdbd81%3A0x3c32170578887ea5!2sDiverplaza!5e0!3m2!1ses!2sco!4v1710000000000!5m2!1ses!2sco"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '220px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 w-full h-full"
              />
            </div>
            {/* Info ubicación */}
            <div className="p-6 border-t border-white/5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-base flex-shrink-0">📍</span>
                <div>
                  <p className="font-black text-white text-[13px] uppercase italic">C.C. Diver Plaza</p>
                  <p className="text-slate-400 text-[11px] font-bold">Canchas deportivas · Bogotá, Colombia</p>
                </div>
              </div>
              <a
                href="https://maps.app.goo.gl/ycH8kbWyQzwRY7Sp8"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary text-[11px] font-black uppercase tracking-widest
                           hover:text-[#0AB5B5] transition-colors"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                Ver en Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* CTA inscripción */}
        <div className="bg-gradient-to-r from-primary/8 to-primary/2 border border-primary/20 rounded-[20px] p-10
                        flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="font-black text-[22px] uppercase italic tracking-wide mb-2 text-white">¿Cómo inscribirse?</h3>
            <p className="text-slate-400 text-[15px] max-w-lg">
              Presenta fotocopia de la tarjeta de identidad, documento de EPS y cancela
              la matrícula más la primera mensualidad.
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