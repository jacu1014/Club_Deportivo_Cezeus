// src/components/Avances/ModalCiclo.jsx
import React, { useState } from 'react';

const CATEGORIAS = ['TODAS', 'INICIACION', 'INFANTIL', 'TRANSICION'];

export default function ModalCiclo({ onClose, onGuardar }) {
  const hoy = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    nombre:       '',
    descripcion:  '',
    categoria:    'TODAS',
    fecha_inicio: hoy,
    fecha_fin:    '',
    activo:       true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim())      return setError('El nombre es obligatorio.');
    if (!form.fecha_fin)          return setError('La fecha de fin es obligatoria.');
    if (form.fecha_fin < form.fecha_inicio) return setError('La fecha de fin debe ser posterior al inicio.');
    setError('');
    setSaving(true);
    try {
      await onGuardar(form);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0a0f18] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-md space-y-6
                      animate-in zoom-in-95 fade-in duration-300">

        <div className="flex items-center justify-between">
          <h3 className="font-black text-white uppercase italic text-lg tracking-tight">
            Nuevo <span className="text-primary">Ciclo</span>
          </h3>
          <button onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 text-slate-400 hover:text-white
                             flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <Field label="Nombre del ciclo *" hint='Ej: "Ciclo 1 · 2025"'>
            <input
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              placeholder="CICLO 1 · 2025"
              className={INPUT}
              required
            />
          </Field>

          {/* Descripción */}
          <Field label="Descripción (opcional)">
            <input
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
              placeholder="Primer semestre del año..."
              className={INPUT}
            />
          </Field>

          {/* Categoría */}
          <Field label="Categoría">
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => set('categoria', cat)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border
                               ${form.categoria === cat
                                 ? 'bg-primary border-primary text-[#05080d]'
                                 : 'bg-white/5 border-white/10 text-slate-400 hover:border-primary/30'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Field>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha inicio *">
              <input type="date" value={form.fecha_inicio}
                     onChange={e => set('fecha_inicio', e.target.value)}
                     className={INPUT} required />
            </Field>
            <Field label="Fecha fin *">
              <input type="date" value={form.fecha_fin}
                     onChange={e => set('fecha_fin', e.target.value)}
                     min={form.fecha_inicio}
                     className={INPUT} required />
            </Field>
          </div>

          {error && (
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10
                          border border-rose-500/20 px-4 py-2 rounded-xl">
              ✕ {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
                    className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest
                               border border-white/10 text-slate-400 hover:border-white/20 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
                    className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest
                               bg-primary text-[#05080d] hover:bg-[#0AB5B5] transition-all disabled:opacity-50">
              {saving ? 'Creando...' : 'Crear Ciclo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const INPUT = `w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-[11px] font-bold
               text-white outline-none focus:border-primary transition-colors uppercase placeholder:text-white/20`;

const Field = ({ label, hint, children }) => (
  <div className="space-y-2">
    <div className="flex items-baseline gap-2">
      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</label>
      {hint && <span className="text-[8px] text-slate-700 italic normal-case">{hint}</span>}
    </div>
    {children}
  </div>
);