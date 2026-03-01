import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

const ModalAsistencia = ({ isOpen, onClose, tipo, fechaInicial, onSaveSuccess }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [fechaRegistro, setFechaRegistro] = useState(fechaInicial);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sincronizar fecha inicial cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      setFechaRegistro(fechaInicial);
      fetchDatos();
    }
  }, [isOpen, tipo, fechaRegistro]);

  const fetchDatos = async () => {
    try {
      setLoading(true);
      
      // 1. Cargar usuarios con todos los campos de nombre para la búsqueda avanzada
      let query = supabase.from('usuarios')
        .select('id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, rol');
      
      if (tipo === 'ALUMNO') {
        query = query.eq('rol', 'ALUMNO');
      } else {
        query = query.in('rol', ['ADMINISTRATIVO', 'ENTRENADOR', 'DIRECTOR', 'SUPER_ADMIN']);
      }
      
      const { data: dataUsr, error: errUsr } = await query;
      if (errUsr) throw errUsr;
      setUsuarios(dataUsr || []);

      // 2. Cargar asistencias registradas para la fecha seleccionada en el input
      const { data: dataAsis, error: errAsis } = await supabase
        .from('asistencia')
        .select('usuario_id, estado')
        .eq('fecha', fechaRegistro);
      
      if (errAsis) throw errAsis;
      setAsistencias(dataAsis || []);
      
    } catch (err) {
      console.error("Error en ModalAsistencia:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda inteligente por cualquier parte del nombre completo
  const usuariosFiltrados = useMemo(() => {
    const term = busqueda.toLowerCase().trim();
    if (!term) return usuarios;

    return usuarios.filter(u => {
      const full = `${u.primer_nombre} ${u.segundo_nombre || ''} ${u.primer_apellido} ${u.segundo_apellido || ''}`.toLowerCase();
      return full.includes(term);
    });
  }, [busqueda, usuarios]);

  const registrarAsistencia = async (uId, estado) => {
    try {
      setSaving(true);
      const { error } = await supabase.from('asistencia').upsert({
        usuario_id: uId,
        fecha: fechaRegistro,
        estado: estado,
        tipo_event: 'DIARIO'
      }, { onConflict: 'usuario_id,fecha' });

      if (error) throw error;

      // Actualizar estado local para feedback visual inmediato
      setAsistencias(prev => {
        const existe = prev.find(a => a.usuario_id === uId);
        if (existe) {
          return prev.map(a => a.usuario_id === uId ? { ...a, estado } : a);
        }
        return [...prev, { usuario_id: uId, estado }];
      });

      // Notificar al Dashboard para actualizar contadores
      if (onSaveSuccess) onSaveSuccess();
      
    } catch (err) {
      alert("Error al guardar asistencia: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay con desenfoque */}
      <div className="absolute inset-0 bg-[#05080d]/95 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-[#0a1118] border border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        
        {/* HEADER: Selector de fecha y Buscador */}
        <div className={`p-6 border-b border-white/5 space-y-4 ${tipo === 'ALUMNO' ? 'bg-cyan-400/5' : 'bg-emerald-500/5'}`}>
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-white font-black text-xl italic uppercase tracking-tighter">
                Control de <span className={tipo === 'ALUMNO' ? 'text-cyan-400' : 'text-emerald-400'}>{tipo}</span>
              </h4>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Registro de asistencia</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Input de Fecha */}
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 text-sm">calendar_today</span>
              <input 
                type="date" 
                value={fechaRegistro}
                onChange={(e) => setFechaRegistro(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[11px] font-black text-white focus:outline-none focus:border-cyan-400/50 transition-all uppercase"
              />
            </div>
            {/* Input de Búsqueda */}
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm group-focus-within:text-white transition-colors">search</span>
              <input 
                type="text"
                placeholder="BUSCAR POR NOMBRE..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[11px] font-black text-white placeholder:text-slate-600 focus:outline-none focus:border-white/30 transition-all uppercase tracking-widest"
              />
            </div>
          </div>
        </div>

        {/* LISTA DE USUARIOS */}
        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-2 custom-scrollbar">
          {loading ? (
            <div className="py-10 text-center text-cyan-400 animate-pulse text-[10px] font-black uppercase tracking-widest">Sincronizando base de datos...</div>
          ) : usuariosFiltrados.length > 0 ? (
            usuariosFiltrados.map(u => {
              const asis = asistencias.find(a => a.usuario_id === u.id);
              return (
                <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all group">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase italic">
                      {u.primer_nombre} {u.segundo_nombre && `${u.segundo_nombre[0]}.`} {u.primer_apellido}
                    </span>
                    <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">{u.rol}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      disabled={saving}
                      onClick={() => registrarAsistencia(u.id, 'PRESENTE')}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${asis?.estado === 'PRESENTE' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/40' : 'bg-white/5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                    >
                      <span className="material-symbols-outlined text-lg font-black">check</span>
                    </button>
                    <button 
                      disabled={saving}
                      onClick={() => registrarAsistencia(u.id, 'AUSENTE')}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${asis?.estado === 'AUSENTE' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40' : 'bg-white/5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'}`}
                    >
                      <span className="material-symbols-outlined text-lg font-black">close</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center">
              <p className="text-slate-600 text-[10px] font-black uppercase italic tracking-widest">Sin resultados coincidentes</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-black/20 text-center border-t border-white/5">
          <button 
            onClick={onClose}
            className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
          >
            Finalizar sesión de registro
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAsistencia;