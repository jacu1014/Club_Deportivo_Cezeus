// src/components/Avances/ModalCiclo.jsx
// VERSIÓN OPTIMIZADA - Creación de estructura dinámica paso a paso

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAvances } from '../../hooks/useAvances';

export default function ModalCiclo({ onClose, onGuardar, currentUser }) {
  const { categoriasBase } = useAvances(currentUser);
  
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
  });
  
  // Estructura: [{ id: 'tecnica', items: ['Pase', 'Control'] }, ...]
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleCategoria = (cat) => {
    setCategoriasSeleccionadas(prev => {
      const existe = prev.find(c => c.id === cat.id);
      if (existe) return prev.filter(c => c.id !== cat.id);
      return [...prev, { ...cat, items: [''] }]; // Inicia con un item vacío
    });
  };

  const handleItemChange = (catId, index, value) => {
    setCategoriasSeleccionadas(prev => prev.map(c => {
      if (c.id === catId) {
        const nuevosItems = [...c.items];
        nuevosItems[index] = value;
        return { ...c, items: nuevosItems };
      }
      return c;
    }));
  };

  const addItem = (catId) => {
    setCategoriasSeleccionadas(prev => prev.map(c => 
      c.id === catId ? { ...c, items: [...c.items, ''] } : c
    ));
  };

  const removeItem = (catId, index) => {
    setCategoriasSeleccionadas(prev => prev.map(c => 
      c.id === catId ? { ...c, items: c.items.filter((_, i) => i !== index) } : c
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (paso === 1) {
      if (!form.nombre || categoriasSeleccionadas.length === 0) {
        return setError('Nombre y al menos una categoría son obligatorios');
      }
      setError('');
      setPaso(2);
      return;
    }

    // Guardado Final
    setSaving(true);
    try {
      // 1. Crear el Ciclo
      const { data: cicloId, error: errC } = await supabase.rpc('crear_ciclo_completo', {
        p_nombre: form.nombre,
        p_desc: form.descripcion,
        p_inicio: form.fecha_inicio,
        p_fin: form.fecha_fin,
        p_creador: currentUser.id,
        p_categorias: categoriasSeleccionadas.map(c => ({
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-md">
      <div className="bg-[#0a0f18] border border-white/10 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-8">
          
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-white font-black italic uppercase text-2xl">Nuevo Ciclo</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                Paso {paso} de 2: {paso === 1 ? 'Configuración Básica' : 'Estructura Técnica'}
              </p>
            </div>
            <button type="button" onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {paso === 1 ? (
            <div className="space-y-6">
              <Field label="Nombre del Ciclo" hint="Ej: Primer Semestre 2026">
                <input type="text" value={form.nombre} onChange={e => set(e.target.name, e.target.value)} name="nombre" placeholder="Nombre..." className={INPUT} required />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Fecha Inicio">
                  <input type="date" value={form.fecha_inicio} onChange={e => set(e.target.name, e.target.value)} name="fecha_inicio" className={INPUT} />
                </Field>
                <Field label="Fecha Fin (Opcional)">
                  <input type="date" value={form.fecha_fin} onChange={e => set(e.target.name, e.target.value)} name="fecha_fin" className={INPUT} />
                </Field>
              </div>

              <Field label="Categorías a Evaluar" hint="Selecciona los pilares del ciclo">
                <div className="flex flex-wrap gap-2">
                  {categoriasBase.map(cat => {
                    const sel = categoriasSeleccionadas.find(c => c.id === cat.id);
                    return (
                      <button key={cat.id} type="button" onClick={() => toggleCategoria(cat)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border ${
                          sel ? 'bg-primary text-black border-primary' : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/20'
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
              {categoriasSeleccionadas.map(cat => (
                <div key={cat.id} className="bg-white/5 border border-white/5 rounded-[2rem] p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-primary font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">{cat.icono}</span>
                      {cat.nombre}
                    </span>
                    <button type="button" onClick={() => addItem(cat.id)} className="text-[9px] font-black uppercase text-slate-500 hover:text-white flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">add</span> Añadir Item
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {cat.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input type="text" value={item} onChange={e => handleItemChange(cat.id, idx, e.target.value)} 
                          placeholder="Ej: Control dirigido, Resistencia física..." className={INPUT} />
                        <button type="button" onClick={() => removeItem(cat.id, idx)} className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-rose-500 text-[9px] font-black uppercase text-center">{error}</p>}

          <div className="flex gap-3 pt-4">
            {paso === 2 && (
              <button type="button" onClick={() => setPaso(1)} className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-500 border border-white/10 hover:border-white/20">
                Atrás
              </button>
            )}
            <button type="submit" disabled={saving} className="flex-[2] py-4 rounded-2xl bg-primary text-black font-black uppercase text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              {saving ? 'Procesando...' : paso === 1 ? 'Siguiente Paso' : 'Confirmar y Crear Ciclo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const Field = ({ label, hint, children }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-end px-2">
      <label className="text-white font-black uppercase text-[10px] tracking-widest">{label}</label>
      {hint && <span className="text-slate-600 text-[8px] font-bold uppercase">{hint}</span>}
    </div>
    {children}
  </div>
);

const INPUT = `w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white outline-none focus:border-primary/40 transition-all placeholder:text-slate-700`;