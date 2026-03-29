// src/components/Avances/ModalCiclo.jsx
// VERSIÓN FINAL - Multicategoría de Alumnos y Estructura Técnica Dinámica

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

// Categorías exactas sincronizadas con la base de datos y data.ts
const CATEGORIAS_ALUMNOS = [
  'Iniciación (5-7 años)',
  'Infantil (8-10 años)',
  'Transición (11-13 años)',
  'Categoría Superior (14+)'
];

// Pilares técnicos para el radar — se usan como dimensiones de evaluación
const CATEGORIAS_BASE = [
  { id: 'tecnica',      nombre: 'Técnica',      icono: 'sports_soccer' },
  { id: 'tactica',      nombre: 'Táctica',      icono: 'psychology'    },
  { id: 'fisico',       nombre: 'Físico',        icono: 'fitness_center'},
  { id: 'psicologico',  nombre: 'Psicológico',   icono: 'self_improvement' },
  { id: 'actitudinal',  nombre: 'Actitudinal',   icono: 'star'          },
];

export default function ModalCiclo({ onClose, onGuardar, currentUser }) {
  const categoriasBase = CATEGORIAS_BASE;
  
  const hoy = new Date().toISOString().split('T')[0];
  const [paso, setPaso] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    fecha_inicio: hoy,
    fecha_fin: '',
    activo: true,
    categorias_objetivo: [], // Soporta multiselección
  });
  
  const [pilaresTecnicos, setPilaresTecnicos] = useState([]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Manejo de categorías de ALUMNOS (Multiselección)
  const toggleCatObjetivo = (cat) => {
    setForm(p => ({
      ...p,
      categorias_objetivo: p.categorias_objetivo.includes(cat)
        ? p.categorias_objetivo.filter(c => c !== cat)
        : [...p.categorias_objetivo, cat]
    }));
  };

  // Manejo de pilares TÉCNICOS (Radar)
  const togglePilarTecnico = (cat) => {
    setPilaresTecnicos(prev => {
      const existe = prev.find(c => c.id === cat.id);
      if (existe) return prev.filter(c => c.id !== cat.id);
      // Al activar un pilar, se inicializa con un item vacío
      return [...prev, { ...cat, items: [''] }]; 
    });
  };

  const handleItemChange = (catId, index, value) => {
    setPilaresTecnicos(prev => prev.map(c => {
      if (c.id === catId) {
        const nuevosItems = [...c.items];
        nuevosItems[index] = value;
        return { ...c, items: nuevosItems };
      }
      return c;
    }));
  };

  const addItem = (catId) => {
    setPilaresTecnicos(prev => prev.map(c => 
      c.id === catId ? { ...c, items: [...c.items, ''] } : c
    ));
  };

  const removeItem = (catId, index) => {
    setPilaresTecnicos(prev => prev.map(c => 
      c.id === catId ? { ...c, items: c.items.filter((_, i) => i !== index) } : c
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (paso === 1) {
      if (!form.nombre || form.categorias_objetivo.length === 0 || pilaresTecnicos.length === 0) {
        return setError('Faltan datos: Nombre, Categorías y Pilares son obligatorios');
      }
      setError('');
      setPaso(2);
      return;
    }

    setSaving(true);
    try {
      const { data, error: errC } = await supabase.rpc('crear_ciclo_completo', {
        p_nombre: form.nombre,
        p_desc: form.descripcion,
        p_inicio: form.fecha_inicio,
        p_fin: form.fecha_fin,
        p_creador: currentUser.id,
        p_cats_alumnos: form.categorias_objetivo, 
        p_estructura_tecnica: pilaresTecnicos.map(c => ({
          id: c.id,
          items: c.items.filter(i => i.trim() !== '')
        }))
      });

      if (errC) throw errC;
      onGuardar();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-xl">
      <div className="bg-[#0a0f18] border border-white/10 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-8">
          
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-white font-black italic uppercase text-2xl tracking-tighter">Configurar Ciclo</h2>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-1">
                Paso {paso} de 2: {paso === 1 ? 'Alcance y Categorías' : 'Definición de Items'}
              </p>
            </div>
            <button type="button" onClick={onClose} className="text-slate-700 hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {paso === 1 ? (
            <div className="space-y-6">
              <Field label="Identificación" hint="Nombre del periodo evaluativo">
                <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Macrociclo de Apertura 2026" className={INPUT} required />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Inicio">
                  <input type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} className={INPUT} />
                </Field>
                <Field label="Cierre">
                  <input type="date" value={form.fecha_fin} onChange={e => set('fecha_fin', e.target.value)} className={INPUT} />
                </Field>
              </div>

              <Field label="Categorías de Alumnos" hint="Puedes seleccionar varias categorías mixtas">
                <div className="flex flex-wrap gap-2">
                  {CATEGORIAS_ALUMNOS.map(cat => (
                    <button key={cat} type="button" onClick={() => toggleCatObjetivo(cat)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border ${
                        form.categorias_objetivo.includes(cat) 
                          ? 'bg-emerald-500 text-black border-emerald-500 shadow-lg shadow-emerald-500/20' 
                          : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/30'
                      }`}>
                      {cat}
                    </button>
                  ))}
                  <button type="button" onClick={() => set('categorias_objetivo', [...CATEGORIAS_ALUMNOS])}
                    className="px-4 py-2 rounded-xl text-[9px] font-black uppercase bg-white/5 text-white border border-white/10 hover:bg-white/10">
                    Todas
                  </button>
                </div>
              </Field>

              <Field label="Pilares Técnicos (Radar)" hint="Dimensiones que se graficarán">
                <div className="flex flex-wrap gap-2">
                  {categoriasBase.map(cat => {
                    const sel = pilaresTecnicos.find(c => c.id === cat.id);
                    return (
                      <button key={cat.id} type="button" onClick={() => togglePilarTecnico(cat)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 border ${
                          sel ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-500 border-white/10'
                        }`}>
                        <span className="material-symbols-outlined text-xs">{cat.icono}</span>
                        {cat.nombre}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          ) : (
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {pilaresTecnicos.map(cat => (
                <div key={cat.id} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-primary font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">{cat.icono}</span>
                      {cat.nombre}
                    </span>
                    <button type="button" onClick={() => addItem(cat.id)} className="text-[9px] font-black uppercase text-slate-500 hover:text-primary flex items-center gap-1 transition-colors">
                      <span className="material-symbols-outlined text-xs">add_circle</span> Añadir Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {cat.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 group">
                        <input type="text" value={item} onChange={e => handleItemChange(cat.id, idx, e.target.value)} 
                          placeholder={`Ej: ${cat.nombre === 'Técnica' ? 'Control de balón' : 'Puntualidad'}...`} className={INPUT} />
                        <button type="button" onClick={() => removeItem(cat.id, idx)} className="p-3 text-slate-600 hover:text-rose-500 transition-colors">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl animate-shake">
              <p className="text-rose-500 text-[9px] font-black uppercase text-center tracking-widest">{error}</p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            {paso === 2 && (
              <button type="button" onClick={() => setPaso(1)} className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-500 border border-white/10 hover:bg-white/5 transition-all">
                Atrás
              </button>
            )}
            <button type="submit" disabled={saving} 
              className="flex-[2] py-4 rounded-2xl bg-primary text-black font-black uppercase text-[10px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
              {saving ? 'Guardando...' : paso === 1 ? 'Siguiente Paso' : 'Finalizar y Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const Field = ({ label, hint, children }) => (
  <div className="space-y-2.5">
    <div className="flex justify-between items-end px-3">
      <label className="text-white font-black uppercase text-[10px] tracking-widest opacity-80">{label}</label>
      {hint && <span className="text-slate-600 text-[8px] font-black uppercase italic">{hint}</span>}
    </div>
    {children}
  </div>
);

const INPUT = `w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white outline-none focus:border-primary/40 focus:bg-primary/5 transition-all placeholder:text-slate-800 font-bold`;