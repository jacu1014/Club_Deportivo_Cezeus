// src/pages/landing/components/ContactoSection.jsx
import { useState } from 'react';

const CONTACTOS = [
  { icon: '📞', label: 'Coordinador',   nombre: 'Lic. Cesar Ceballos', tel: '3134185403' },
  { icon: '👩‍💼', label: 'Coordinadora', nombre: 'Gloria E. Urrego',    tel: '3313540606' },
];

export default function ContactoSection() {
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí puedes conectar a Supabase, un webhook, o WhatsApp Business API
    setEnviado(true);
    setTimeout(() => setEnviado(false), 5000);
    e.target.reset();
  };

  return (
    <section id="contacto" className="py-24 bg-gradient-to-b from-[#07090f] to-[#05080d]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-14">
          <p className="flex items-center gap-3 text-primary text-[11px] font-black uppercase tracking-[0.25em] mb-3">
            <span className="w-6 h-0.5 bg-primary inline-block" /> Contáctanos
          </p>
          <h2 className="font-black italic text-[clamp(40px,5vw,64px)] leading-none">
            ÚNETE A <span className="text-primary">CEZEUS</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Info contacto */}
          <div>
            <p className="text-slate-400 text-[17px] leading-relaxed mb-8">
              ¿Tienes preguntas sobre categorías, horarios o el proceso de inscripción? Estamos aquí para ayudarte.
            </p>

            {CONTACTOS.map(c => (
              <a key={c.tel} href={`tel:${c.tel}`}
                 className="flex items-center gap-5 p-6 bg-[#0E1620] border border-white/6 rounded-2xl mb-4
                            hover:border-primary/20 transition-all">
                <span className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">{c.icon}</span>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{c.label}</div>
                  <div className="font-black text-[20px] italic">{c.nombre}</div>
                  <div className="text-primary text-[14px] font-black">{c.tel}</div>
                </div>
              </a>
            ))}

            <div className="flex items-center gap-5 p-6 bg-[#0E1620] border border-white/6 rounded-2xl">
              <span className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">📍</span>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ubicación</div>
                <div className="font-black text-[20px] italic">Bogotá, Colombia</div>
                <div className="text-slate-400 text-[14px]">Resolución 460 I.D.R.D.</div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-[#0E1620] border border-white/6 rounded-[20px] p-10">
            <h3 className="font-black text-[22px] uppercase italic tracking-wide mb-8">Solicitar información</h3>

            {enviado ? (
              <div className="py-12 text-center">
                <span className="text-4xl block mb-4">✅</span>
                <p className="font-black text-primary uppercase tracking-widest text-[14px]">¡Solicitud enviada!</p>
                <p className="text-slate-400 text-[13px] mt-2">Te contactaremos pronto.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <Field label="Tu nombre" id="nombre" placeholder="Padre / Madre" required />
                  <Field label="Teléfono" id="tel" type="tel" placeholder="3XX XXX XXXX" required />
                </div>
                <Field label="Nombre del niño/a" id="nino" placeholder="Nombre completo" required className="mb-5" />
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <Field label="Edad" id="edad" type="number" placeholder="5 – 13" min="5" max="13" required />
                  <div className="flex flex-col gap-2">
                    <label htmlFor="cat" className="text-[11px] font-black uppercase tracking-widest text-slate-400">Categoría</label>
                    <select id="cat" name="cat"
                            className="bg-white/4 border border-white/10 rounded-xl text-[14px] font-bold text-white px-4 py-3.5
                                       outline-none focus:border-primary transition-colors">
                      <option value="">Seleccionar...</option>
                      <option>Iniciación (5-7 años)</option>
                      <option>Infantil (8-10 años)</option>
                      <option>Transición (11-13 años)</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-2 mb-6">
                  <label htmlFor="msg" className="text-[11px] font-black uppercase tracking-widest text-slate-400">Mensaje (opcional)</label>
                  <textarea id="msg" name="msg" rows={3} placeholder="¿Tienes alguna pregunta?"
                            className="bg-white/4 border border-white/10 rounded-xl text-[14px] text-white px-4 py-3
                                       outline-none focus:border-primary transition-colors resize-none" />
                </div>
                <button type="submit"
                        className="w-full bg-primary text-[#05080d] font-black uppercase text-[13px] tracking-widest
                                   py-4 rounded-xl hover:bg-[#0AB5B5] transition-all">
                  Enviar solicitud ✓
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, id, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</label>
      <input id={id} name={id}
             className="bg-white/4 border border-white/10 rounded-xl text-[14px] text-white px-4 py-3.5
                        outline-none focus:border-primary transition-colors placeholder:text-white/20"
             {...props} />
    </div>
  );
}