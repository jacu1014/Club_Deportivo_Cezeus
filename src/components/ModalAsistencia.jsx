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
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
  if (isOpen) {
    // Solo forzamos la fecha del Dashboard la PRIMERA VEZ que se abre
    setFechaRegistro(fechaInicial);
  }
}, [isOpen]); // Quitamos las otras dependencias para que no se resetee al cambiar la fecha

useEffect(() => {
  if (isOpen) {
    // Cada vez que cambie la fechaRegistro (manualmente), traemos los datos de ese día
    fetchDatos();
  }
}, [isOpen, tipo, fechaRegistro]);

  const fetchDatos = async () => {
    try {
      setLoading(true);
      
      // 1. Cargar usuarios (nombre de tabla: usuarios)
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

      // 2. Cargar asistencias
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
      const { error } = await supabase
        .from('asistencias')
        .upsert(
          {
            usuario_id: uId,
            fecha: fechaRegistro,
            estado: estado,
            tipo_event: 'DIARIO'
          }, 
          { onConflict: 'usuario_id,fecha' }
        );

      if (error) throw error;

      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);

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
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[#05080d]/90 backdrop-blur-xl" onClick={onClose}></div>
      
      {/* TOAST NOTIFICACIÓN */}
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[130] flex items-center gap-3 bg-emerald-500 text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/40 animate-in slide-in-from-top-10">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          Registro Guardado
        </div>
      )}

      <div className="relative bg-[#0a1118] border border-white/10 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className={`p-8 border-b border-white/5 space-y-6 ${tipo === 'ALUMNO' ? 'bg-cyan-400/5' : 'bg-emerald-500/5'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-white font-black text-2xl md:text-3xl italic uppercase tracking-tighter">
                Control de <span className={tipo === 'ALUMNO' ? 'text-cyan-400' : 'text-emerald-400'}>{tipo}s</span>
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{fechaRegistro}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* FILTROS HEADER */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {tipo === 'ALUMNO' && (
              <select 
                value={categoriaSel}
                onChange={(e) => setCategoriaSel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-[11px] font-black text-cyan-400 focus:outline-none focus:border-cyan-400/50 uppercase appearance-none cursor-pointer"
              >
                <option value="TODAS">TODAS LAS CATEGORÍAS</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <input 
            type="date" 
            value={fechaRegistro}
            max={new Date().toISOString().split("T")[0]} // Evita fechas futuras
            onChange={(e) => setFechaRegistro(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-[11px] font-black text-white focus:outline-none focus:border-white/30 cursor-pointer"
            />
            <div className="relative md:col-span-1">
              <input 
                type="text"
                placeholder="BUSCAR..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 pl-10 text-[11px] font-black text-white placeholder:text-slate-600 focus:outline-none focus:border-white/30 uppercase"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm">search</span>
            </div>
          </div>
        </div>

        {/* LISTA DE USUARIOS */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="py-24 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizando...</p>
            </div>
          ) : usuariosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {usuariosFiltrados.map(u => {
                const asis = asistencias.find(a => a.usuario_id === u.id);
                return (
                  <div key={u.id} className="flex items-center justify-between p-5 bg-white/[0.02] rounded-[2rem] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all group">
                    <div className="flex flex-col gap-1">
                      <span className="text-[13px] font-black text-white uppercase italic leading-none group-hover:text-cyan-400 transition-colors">
                        {u.primer_nombre} {u.primer_apellido}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                        {u.categoria || u.rol}
                      </span>
                    </div>
                    
                    <div className="flex gap-3">
                      <button 
                        disabled={saving}
                        onClick={() => registrarAsistencia(u.id, 'PRESENTE')}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${asis?.estado === 'PRESENTE' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 scale-110' : 'bg-white/5 text-slate-600 hover:bg-emerald-500/10 hover:text-emerald-500'}`}
                      >
                        <span className="material-symbols-outlined text-2xl font-bold">done_all</span>
                      </button>
                      <button 
                        disabled={saving}
                        onClick={() => registrarAsistencia(u.id, 'AUSENTE')}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${asis?.estado === 'AUSENTE' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-110' : 'bg-white/5 text-slate-600 hover:bg-rose-500/10 hover:text-rose-500'}`}
                      >
                        <span className="material-symbols-outlined text-2xl font-bold">close</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-slate-800">person_search</span>
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">No se encontraron registros</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-8 bg-black/20 border-t border-white/5 flex justify-center">
          <button 
            onClick={onClose}
            className="w-full max-w-xs py-4 bg-white/5 rounded-2xl text-[11px] font-black text-white uppercase tracking-[0.2em] hover:bg-white/10 transition-all border border-white/10 active:scale-95"
          >
            Finalizar y Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAsistencia;