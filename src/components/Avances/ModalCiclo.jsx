// src/components/Avances/ModalCiclo.jsx
// VERSIÓN MODIFICADA - Con items personalizables por categoría

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAvances } from '../../hooks/useAvances';

export default function ModalCiclo({ onClose, onGuardar, currentUser }) {
  const { categoriasBase } = useAvances(currentUser);
  
  const hoy = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    fecha_inicio: hoy,
    fecha_fin: '',
    activo: true,
  });
  
  // Nueva estructura: categorías seleccionadas con sus items
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [paso, setPaso] = useState(1); // 1: datos básicos, 2: items por categoría

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Seleccionar/deseleccionar categoría
  const toggleCategoria = (categoriaId) => {
    setCategoriasSeleccionadas(prev => {
      const existe = prev.find(c => c.id === categoriaId);
      if (existe) {
        return prev.filter(c => c.id !== categoriaId);
      } else {
        const categoria = categoriasBase?.find(c => c.id === categoriaId);
        return [...prev, { 
          id: categoriaId, 
          nombre: categoria?.nombre,
          items: [] 
        }];
      }
    });
  };

  // Agregar item a una categoría
  const agregarItem = (categoriaId, itemNombre) => {
    if (!itemNombre.trim()) return;
    setCategoriasSeleccionadas(prev => prev.map(cat => {
      if (cat.id === categoriaId) {
        return {
          ...cat,
          items: [...cat.items, { nombre: itemNombre.trim(), id: Date.now() }]
        };
      }
      return cat;
    }));
  };

  // Eliminar item de una categoría
  const eliminarItem = (categoriaId, itemIndex) => {
    setCategoriasSeleccionadas(prev => prev.map(cat => {
      if (cat.id === categoriaId) {
        return {
          ...cat,
          items: cat.items.filter((_, idx) => idx !== itemIndex)
        };
      }
      return cat;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (paso === 1) {
      // Validar paso 1 (solo datos básicos, NO items)
      if (!form.nombre.trim()) return setError('El nombre es obligatorio.');
      if (!form.fecha_fin) return setError('La fecha de fin es obligatoria.');
      if (form.fecha_fin < form.fecha_inicio) {
        return setError('La fecha de fin debe ser posterior al inicio.');
      }
      if (categoriasSeleccionadas.length === 0) {
        return setError('Debes seleccionar al menos una categoría.');
      }
      
      // ✅ ELIMINADA la validación de items aquí
      // Los items se agregarán en el Paso 2
      
      setError('');
      setPaso(2);
      return;
    }
    
    // Paso 2: Guardar ciclo con items
    setSaving(true);
    try {
      // ✅ Validar que todas las categorías tengan al menos un item ANTES de guardar
      const categoriasSinItems = categoriasSeleccionadas.filter(cat => cat.items.length === 0);
      if (categoriasSinItems.length > 0) {
        throw new Error(`Las siguientes categorías deben tener al menos un item: ${categoriasSinItems.map(c => c.nombre).join(', ')}`);
      }
      
      // Preparar items para guardar
      const itemsToSave = [];
      categoriasSeleccionadas.forEach(cat => {
        cat.items.forEach((item) => {
          itemsToSave.push({
            categoria_id: cat.id,
            nombre: item.nombre,
            orden: itemsToSave.length
          });
        });
      });
      
      await onGuardar({
        ...form,
        items: itemsToSave
      });
      
      // Si todo sale bien, el modal se cerrará desde onGuardar
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const volverPaso1 = () => {
    setPaso(1);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0a0f18] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-2xl space-y-6
                      animate-in zoom-in-95 fade-in duration-300 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between">
          <h3 className="font-black text-white uppercase italic text-lg tracking-tight">
            {paso === 1 ? 'Nuevo' : 'Configurar'} <span className="text-primary">Ciclo</span>
          </h3>
          <button onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 text-slate-400 hover:text-white
                             flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
          <span className={`px-2 py-1 rounded-full ${paso === 1 ? 'bg-primary text-[#05080d]' : 'bg-white/10 text-slate-500'}`}>
            Paso 1
          </span>
          <span className="text-slate-700">→</span>
          <span className={`px-2 py-1 rounded-full ${paso === 2 ? 'bg-primary text-[#05080d]' : 'bg-white/10 text-slate-500'}`}>
            Paso 2
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* PASO 1: Datos básicos y selección de categorías */}
          {paso === 1 && (
            <>
              {/* Nombre */}
              <Field label="Nombre del ciclo *" hint='Ej: "Ciclo Técnico 2026"'>
                <input
                  value={form.nombre}
                  onChange={e => set('nombre', e.target.value)}
                  placeholder="CICLO TÉCNICO 2026"
                  className={INPUT}
                  required
                />
              </Field>

              {/* Descripción */}
              <Field label="Descripción (opcional)">
                <textarea
                  value={form.descripcion}
                  onChange={e => set('descripcion', e.target.value)}
                  placeholder="Objetivos del ciclo..."
                  rows={2}
                  className={`${INPUT} resize-none`}
                />
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

              {/* Selección de categorías */}
              <Field label="Categorías a evaluar *" hint="Selecciona múltiples categorías">
                <div className="flex flex-wrap gap-2">
                  {categoriasBase?.map(cat => {
                    const seleccionada = categoriasSeleccionadas.some(c => c.id === cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategoria(cat.id)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border
                                     ${seleccionada
                                       ? 'bg-primary border-primary text-[#05080d]'
                                       : 'bg-white/5 border-white/10 text-slate-400 hover:border-primary/30'}`}
                      >
                        {seleccionada ? '✓ ' : '+ '}{cat.nombre}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {/* Lista de categorías seleccionadas con conteo de items */}
              {categoriasSeleccionadas.length > 0 && (
                <div className="bg-white/5 rounded-xl p-4 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Categorías seleccionadas:
                  </p>
                  {categoriasSeleccionadas.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center text-[10px]">
                      <span className="text-white">{cat.nombre}</span>
                      <span className="text-primary text-[8px]">
                        {cat.items.length} {cat.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* PASO 2: Configurar items por categoría */}
          {paso === 2 && (
            <div className="space-y-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Define los items específicos a evaluar en cada categoría
              </p>
              
              {categoriasSeleccionadas.map(categoria => (
                <div key={categoria.id} className="border border-white/10 rounded-xl p-4 space-y-3">
                  <h4 className="font-black text-primary text-[11px] uppercase tracking-wider">
                    {categoria.nombre}
                  </h4>
                  
                  {/* Lista de items existentes */}
                  <div className="space-y-2">
                    {categoria.items.length === 0 ? (
                      <p className="text-[9px] text-slate-500 italic">No hay items agregados aún</p>
                    ) : (
                      categoria.items.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                          <span className="text-[10px] text-white flex-1">{item.nombre}</span>
                          <button
                            type="button"
                            onClick={() => eliminarItem(categoria.id, idx)}
                            className="text-rose-400 hover:text-rose-300 text-[10px]"
                          >
                            Eliminar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Agregar nuevo item */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nuevo item (ej: Pase con orientación)"
                      className="flex-1 bg-[#020617] border border-white/10 rounded-lg px-3 py-2 text-[11px]
                                 text-white outline-none focus:border-primary"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          agregarItem(categoria.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.target.previousSibling;
                        if (input.value.trim()) {
                          agregarItem(categoria.id, input.value);
                          input.value = '';
                        }
                      }}
                      className="bg-primary/20 text-primary px-3 rounded-lg text-[10px] font-black uppercase
                                 hover:bg-primary/30 transition-colors"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10
                          border border-rose-500/20 px-4 py-2 rounded-xl">
              ✕ {error}
            </p>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            {paso === 2 && (
              <button type="button" onClick={volverPaso1}
                      className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest
                                 border border-white/10 text-slate-400 hover:border-white/20 transition-all">
                ← Volver
              </button>
            )}
            <button type="button" onClick={onClose}
                    className={`${paso === 2 ? 'flex-1' : ''} py-3 rounded-xl text-[10px] font-black uppercase tracking-widest
                                 border border-white/10 text-slate-400 hover:border-white/20 transition-all`}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
                    className={`${paso === 2 ? 'flex-1' : ''} py-3 rounded-xl text-[10px] font-black uppercase tracking-widest
                                 bg-primary text-[#05080d] hover:bg-[#0AB5B5] transition-all disabled:opacity-50`}>
              {saving ? 'Creando...' : paso === 1 ? 'Siguiente →' : 'Crear Ciclo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const INPUT = `w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-[11px] font-bold
               text-white outline-none focus:border-primary transition-colors placeholder:text-white/20`;

const Field = ({ label, hint, children }) => (
  <div className="space-y-2">
    <div className="flex items-baseline gap-2">
      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</label>
      {hint && <span className="text-[8px] text-slate-700 italic normal-case">{hint}</span>}
    </div>
    {children}
  </div>
);