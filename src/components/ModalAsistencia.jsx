import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

const ModalAsistencia = ({ isOpen, onClose, tipo, fechaInicial, onSaveSuccess }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [categorias, setCategorias] = useState([]); 
  const [categoriaSel, setCategoriaSel] = useState('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [fechaRegistro, setFechaRegistro] = useState(fechaInicial);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false); // Estado para la notificación

  useEffect(() => {
    if (isOpen) {
      setFechaRegistro(fechaInicial);
      fetchDatos();
    }
  }, [isOpen, tipo, fechaRegistro]);

  const fetchDatos = async () => {
    try {
      setLoading(true);
      
      // 1. Cargar usuarios
      let query = supabase.from('usuarios')
        .select('id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, rol, categoria');
      
      if (tipo === 'ALUMNO') {
        query = query.eq('rol', 'ALUMNO');
      } else {
        query = query.in('rol', ['ADMINISTRATIVO', 'ENTRENADOR', 'DIRECTOR', 'SUPER_ADMIN']);
      }
      
      const { data: dataUsr, error: errUsr } = await query;
      if (errUsr) throw errUsr;
      
      setUsuarios(dataUsr || []);

      if (tipo === 'ALUMNO') {
        const cats = [...new Set(dataUsr.map(u => u.categoria).filter(Boolean))].sort();
        setCategorias(cats);
      }

      // 2. Cargar asistencias (Tabla: asistencias)
      const { data: dataAsis, error: errAsis } = await supabase
        .from('asistencias')
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

  const usuariosFiltrados = useMemo(() => {
    let filtrados = usuarios;
    if (categoriaSel !== 'TODAS') {
      filtrados = filtrados.filter(u => u.categoria === categoriaSel);
    }
    const term = busqueda.toLowerCase().trim();
    if (term) {
      filtrados = filtrados.filter(u => {
        const full = `${u.primer_nombre} ${u.segundo_nombre || ''} ${u.primer_apellido} ${u.segundo_apellido || ''}`.toLowerCase();
        return full.includes(term);
      });
    }
    return filtrados;
  }, [busqueda, usuarios, categoriaSel]);

  const registrarAsistencia = async (uId, estado) => {
    try {
      setSaving(true);
      
      // UPSERT corregido para coincidir con la restricción única
      const { error } = await supabase
        .from('asistencias')
        .upsert(
          {
            usuario_id: uId,
            fecha: fechaRegistro,
            estado: estado,
            tipo_event: 'DIARIO'
          }, 
          { onConflict: 'usuario_id,fecha' } // Debe coincidir exactamente con el CONSTRAINT de SQL
        );

      if (error) throw error;

      // Feedback visual: Toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);

      // Actualización local para que el círculo cambie de color inmediatamente
      setAsistencias(prev => {
        const existe = prev.find(a => a.usuario_id === uId);
        if (existe) {
          return prev.map(a => a.usuario_id === uId ? { ...a, estado } : a);
        }
        return [...prev, { usuario_id: uId, estado }];
      });

      if (onSaveSuccess) onSaveSuccess();
      
    } catch (err) {
      console.error("Error al registrar:", err.message);
      alert("Error de base de datos: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#05080d]/95 backdrop-blur-md" onClick={onClose}></div>
      
      {/* TOAST NOTIFICACIÓN */}
      {showToast && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-3 bg-emerald-500 text-black px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/40 animate-in slide-in-from-top-4 duration-300">
          <span className="material-symbols-outlined text-sm font-bold">verified</span>
          ¡Registro Actualizado!
        </div>
      )}

      <div className="relative bg-[#0a1118] border border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        
        {/* HEADER */}
        <div className={`p-6 border-b border-white/5 space-y-4 ${tipo === 'ALUMNO' ? 'bg-cyan-400/5' : 'bg-emerald-500/5'}`}>
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-white font-black text-xl italic uppercase tracking-tighter">
                Lista de <span className={tipo === 'ALUMNO' ? 'text-cyan-400' : 'text-emerald-400'}>{tipo}s</span>
              </h4>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{fechaRegistro}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {tipo === 'ALUMNO' && (
              <select 
                value={categoriaSel}
                onChange={(e) => setCategoriaSel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-[10px] font-black text-cyan-400 focus:outline-none focus:border-cyan-400/50 uppercase"
              >
                <option value="TODAS">TODAS LAS CATEGORÍAS</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input 
                type="date" 
                value={fechaRegistro}
                onChange={(e) => setFechaRegistro(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-[11px] font-black text-white focus:outline-none focus:border-white/30"
              />
              <input 
                type="text"
                placeholder="BUSCAR NOMBRE..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-[11px] font-black text-white placeholder:text-slate-600 focus:outline-none focus:border-white/30 uppercase"
              />
            </div>
          </div>
        </div>

        {/* LISTA DE USUARIOS */}
        <div className="p-4 max-h-[45vh] overflow-y-auto space-y-2 custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-slate-500 uppercase">Cargando base de datos...</p>
            </div>
          ) : usuariosFiltrados.length > 0 ? (
            usuariosFiltrados.map(u => {
              const asis = asistencias.find(a => a.usuario_id === u.id);
              return (
                <div key={u.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-3xl border border-white/5 hover:bg-white/5 transition-all">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-white uppercase italic leading-tight">
                      {u.primer_nombre} {u.primer_apellido}
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">
                      {u.categoria || u.rol}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      disabled={saving}
                      onClick={() => registrarAsistencia(u.id, 'PRESENTE')}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${asis?.estado === 'PRESENTE' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-500 hover:bg-emerald-500/10'}`}
                    >
                      <span className="material-symbols-outlined text-xl">done_all</span>
                    </button>
                    <button 
                      disabled={saving}
                      onClick={() => registrarAsistencia(u.id, 'AUSENTE')}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${asis?.estado === 'AUSENTE' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white/5 text-slate-500 hover:bg-rose-500/10'}`}
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-slate-600 text-[10px] font-black uppercase">Sin resultados</div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-black/40 border-t border-white/5 flex justify-center">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white/5 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
          >
            Finalizar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAsistencia;