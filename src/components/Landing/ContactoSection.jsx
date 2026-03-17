// src/components/Landing/ContactoSection.jsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const CONTACTOS = [
  { icon: '📞', label: 'Coordinador',   nombre: 'Lic. Cesar Ceballos', tel: '3134185403' },
  { icon: '👩‍💼', label: 'Coordinadora', nombre: 'Gloria Urrego',       tel: '313540606' },
];

const INPUT_CLS = `
  w-full bg-[#0a1220] border border-white/10 rounded-xl
  text-[14px] font-medium text-slate-100
  px-4 py-3.5 outline-none
  focus:border-primary focus:ring-1 focus:ring-primary/20
  transition-colors placeholder:text-slate-600
`;

// Estados del formulario
const ESTADO = { IDLE: 'idle', ENVIANDO: 'enviando', OK: 'ok', ERROR: 'error' };

export default function ContactoSection() {
  const [estado, setEstado] = useState(ESTADO.IDLE);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEstado(ESTADO.ENVIANDO);
    setErrorMsg('');

    const fd = new FormData(e.target);
    const payload = {
      nombre:      fd.get('nombre')?.toString().trim(),
      telefono:    fd.get('tel')?.toString().trim(),
      nombre_nino: fd.get('nino')?.toString().trim(),
      edad:        fd.get('edad') ? Number(fd.get('edad')) : null,
      categoria:   fd.get('cat')?.toString() || '',
      mensaje:     fd.get('msg')?.toString().trim() || '',
    };

    try {
      // Llamar a la Edge Function (guarda en BD + envía correo)
      const { data, error } = await supabase.functions.invoke('enviar-contacto', {
        body: payload,
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setEstado(ESTADO.OK);
      e.target.reset();

      // Volver al formulario después de 6 segundos
      setTimeout(() => setEstado(ESTADO.IDLE), 6000);
    } catch (err) {
      console.error('[ContactoSection]', err);
      setErrorMsg(err.message || 'No se pudo enviar la solicitud. Intenta de nuevo.');
      setEstado(ESTADO.ERROR);
    }
  };

  return (
    <section id="contacto" className="py-24 bg-gradient-to-b from-[#07090f] to-[#05080d]">
      <div className="max-w-6xl mx-auto px-6">

        <div className="mb-14">
          <p className="flex items-center gap-3 text-primary text-[11px] font-black uppercase tracking-[0.25em] mb-3">
            <span className="w-6 h-0.5 bg-primary inline-block" /> Contáctanos
          </p>
          <h2 className="font-black italic text-[clamp(40px,5vw,64px)] leading-none text-white">
            ÚNETE A <span className="text-primary">CEZEUS</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Info de contacto */}
          <div>
            <p className="text-slate-400 text-[17px] leading-relaxed mb-8">
              ¿Tienes preguntas sobre categorías, horarios o el proceso de inscripción?
              Estamos aquí para ayudarte.
            </p>

            {CONTACTOS.map(c => (
              <a key={c.tel} href={`tel:${c.tel}`}
                 className="flex items-center gap-5 p-6 bg-[#0E1620] border border-white/6
                            rounded-2xl mb-4 hover:border-primary/20 transition-all">
                <span className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                  {c.icon}
                </span>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{c.label}</div>
                  <div className="font-black text-[20px] italic text-white">{c.nombre}</div>
                  <div className="text-primary text-[14px] font-black">{c.tel}</div>
                </div>
              </a>
            ))}

            <div className="flex items-center gap-5 p-6 bg-[#0E1620] border border-white/6 rounded-2xl">
              <span className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">📍</span>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ubicación</div>
                <div className="font-black text-[20px] italic text-white">C.C. Diver Plaza · Bogotá</div>
                <div className="text-slate-400 text-[14px]">Resolución 460 I.D.R.D.</div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-[#0E1620] border border-white/6 rounded-[20px] p-10">
            <h3 className="font-black text-[22px] uppercase italic tracking-wide mb-8 text-white">
              Solicitar información
            </h3>

            {/* Estado: Éxito */}
            {estado === ESTADO.OK && (
              <div className="py-12 text-center space-y-4 animate-in fade-in duration-500">
                <span className="text-5xl block">✅</span>
                <p className="font-black text-primary uppercase tracking-widest text-[15px]">
                  ¡Solicitud enviada!
                </p>
                <p className="text-slate-400 text-[13px] leading-relaxed">
                  Los coordinadores recibirán tu información por correo
                  y te contactarán pronto al <strong className="text-white">número indicado</strong>.
                </p>
              </div>
            )}

            {/* Estados: Idle / Enviando / Error */}
            {estado !== ESTADO.OK && (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Tu nombre"  id="nombre" placeholder="Padre / Madre"  required />
                  <Field label="Teléfono"   id="tel"    placeholder="3XX XXX XXXX"   type="tel" required />
                </div>

                <Field label="Nombre del niño/a" id="nino" placeholder="Nombre completo" required />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Edad" id="edad" placeholder="5 – 13" type="number" min="5" max="13" required />

                  <div className="flex flex-col gap-2">
                    <label htmlFor="cat" className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Categoría
                    </label>
                    <select id="cat" name="cat" className={INPUT_CLS} style={{ colorScheme: 'dark' }}>
                      <option value=""       className="bg-[#0a1220] text-slate-400">Seleccionar...</option>
                      <option value="Iniciación (5-7 años)"   className="bg-[#0a1220] text-white">Iniciación (5-7 años)</option>
                      <option value="Infantil (8-10 años)"    className="bg-[#0a1220] text-white">Infantil (8-10 años)</option>
                      <option value="Transición (11-13 años)" className="bg-[#0a1220] text-white">Transición (11-13 años)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="msg" className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Mensaje (opcional)
                  </label>
                  <textarea
                    id="msg" name="msg" rows={3}
                    placeholder="¿Tienes alguna pregunta?"
                    className={`${INPUT_CLS} resize-none`}
                  />
                </div>

                {/* Mensaje de error */}
                {estado === ESTADO.ERROR && (
                  <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20
                                  rounded-xl px-4 py-3 animate-in fade-in duration-300">
                    <span className="text-rose-400 text-lg flex-shrink-0">✕</span>
                    <p className="text-rose-300 text-[12px] font-bold">{errorMsg}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={estado === ESTADO.ENVIANDO}
                  className="w-full bg-primary text-[#05080d] font-black uppercase text-[13px]
                             tracking-widest py-4 rounded-xl hover:bg-[#0AB5B5] transition-all
                             shadow-[0_8px_24px_rgba(19,236,236,0.2)]
                             disabled:opacity-60 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                >
                  {estado === ESTADO.ENVIANDO ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[#05080d]/30 border-t-[#05080d]
                                       rounded-full animate-spin inline-block" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar solicitud ✓'
                  )}
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
      <label htmlFor={id} className="text-[11px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <input id={id} name={id} className={INPUT_CLS} {...props} />
    </div>
  );
}