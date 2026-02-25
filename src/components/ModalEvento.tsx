import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CATEGORIAS_EVENTOS } from '../constants/data';

interface ModalEventoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  eventoParaEditar?: any; // Añadimos esta prop
}

const ModalEvento = ({ isOpen, onClose, onSave, eventoParaEditar }: ModalEventoProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    categoria: 'ENTRENAMIENTO',
    fecha_inicio: '',
    ubicacion: '',
    descripcion: '',
    color: '#2dd4bf'
  });

  // Efecto para cargar datos si vamos a editar
  useEffect(() => {
    if (isOpen && eventoParaEditar) {
      // Convertir la fecha al formato que requiere el input datetime-local (YYYY-MM-DDTHH:MM)
      const fecha = new Date(eventoParaEditar.fecha_inicio);
      const tzOffset = fecha.getTimezoneOffset() * 60000;
      const localISOTime = new Date(fecha.getTime() - tzOffset).toISOString().slice(0, 16);

      setFormData({
        titulo: eventoParaEditar.titulo || '',
        categoria: eventoParaEditar.categoria || 'ENTRENAMIENTO',
        fecha_inicio: localISOTime,
        ubicacion: eventoParaEditar.ubicacion || '',
        descripcion: eventoParaEditar.descripcion || '',
        color: eventoParaEditar.color || '#2dd4bf'
      });
    } else {
      // Resetear formulario si es nuevo
      setFormData({
        titulo: '',
        categoria: 'ENTRENAMIENTO',
        fecha_inicio: '',
        ubicacion: '',
        descripcion: '',
        color: '#2dd4bf'
      });
    }
  }, [isOpen, eventoParaEditar]);

  if (!isOpen) return null;

  const handleCategoriaChange = (catId: string) => {
    const categoriaSeleccionada = CATEGORIAS_EVENTOS.find(c => c.id === catId);
    setFormData({
      ...formData,
      categoria: catId,
      color: categoriaSeleccionada?.color || '#2dd4bf'
    });
  };

  const handleEliminar = async () => {
    if (!eventoParaEditar?.id) return;
    if (!window.confirm("¿Estás seguro de que deseas eliminar este evento?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', eventoParaEditar.id);

      if (error) throw error;
      onSave();
      onClose();
    } catch (error: any) {
      alert("Error al eliminar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        titulo: formData.titulo,
        categoria: formData.categoria,
        fecha_inicio: formData.fecha_inicio,
        ubicacion: formData.ubicacion,
        descripcion: formData.descripcion,
        color: formData.color
      };

      if (eventoParaEditar?.id) {
        // ACTUALIZAR EXISTENTE
        const { error } = await supabase
          .from('eventos')
          .update(payload)
          .eq('id', eventoParaEditar.id);
        if (error) throw error;
      } else {
        // INSERTAR NUEVO
        const { error } = await supabase
          .from('eventos')
          .insert([payload]);
        if (error) throw error;
      }
      
      onSave();
      onClose();
    } catch (error: any) {
      alert("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0a0f18] border border-white/10 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full"></div>

        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02] relative z-10">
          <div>
            <h3 className="text-white font-black text-xl uppercase italic tracking-tighter">
              {eventoParaEditar ? 'Editar Evento' : 'Registrar Nuevo Evento'}
            </h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Completa los detalles de la actividad</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-2 tracking-widest">Nombre del Evento</label>
              <input 
                required
                className="w-full bg-[#05080d] border border-white/5 rounded-2xl p-4 text-xs text-white outline-none focus:border-cyan-400/50 transition-all shadow-inner"
                placeholder="Ej: Final Torneo Local"
                value={formData.titulo}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-2 tracking-widest">Tipo de Actividad</label>
              <select 
                className="w-full bg-[#05080d] border border-white/5 rounded-2xl p-4 text-xs text-white outline-none appearance-none cursor-pointer"
                value={formData.categoria}
                onChange={(e) => handleCategoriaChange(e.target.value)}
              >
                {CATEGORIAS_EVENTOS.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-2 tracking-widest">Fecha y Hora de Inicio</label>
              <input 
                type="datetime-local"
                required
                className="w-full bg-[#05080d] border border-white/5 rounded-2xl p-4 text-xs text-white outline-none focus:border-cyan-400/50"
                value={formData.fecha_inicio}
                onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-2 tracking-widest">Ubicación / Lugar</label>
              <input 
                className="w-full bg-[#05080d] border border-white/5 rounded-2xl p-4 text-xs text-white outline-none focus:border-cyan-400/50"
                placeholder="Cancha 5 o Google Meet"
                value={formData.ubicacion}
                onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-2 tracking-widest">Descripción</label>
              <textarea 
                rows={4}
                className="w-full bg-[#05080d] border border-white/5 rounded-2xl p-4 text-xs text-white outline-none resize-none focus:border-cyan-400/50"
                placeholder="Indica materiales o notas..."
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="md:col-span-2 flex justify-between items-center mt-4 pt-6 border-t border-white/5">
            <div>
              {eventoParaEditar && (
                <button 
                  type="button"
                  onClick={handleEliminar}
                  disabled={loading}
                  className="px-6 py-4 text-[10px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Eliminar
                </button>
              )}
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
              >
                Cerrar
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="bg-cyan-400 text-[#0a1118] px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Procesando...' : eventoParaEditar ? 'Guardar Cambios' : 'Confirmar Evento'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEvento;