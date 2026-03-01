import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

const ModalAsistencia = ({ isOpen, onClose, tipo, fecha, onSaveSuccess }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [asistenciasHoy, setAsistenciasHoy] = useState([]);
  const [busqueda, setBusqueda] = useState(''); // <--- ESTADO PARA EL BUSCADOR
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDatos();
      setBusqueda(''); // Limpiar búsqueda al abrir
    }
  }, [isOpen, tipo]);

  const fetchDatos = async () => {
    try {
      setLoading(true);
      let query = supabase.from('usuarios').select('id, primer_nombre, primer_apellido, rol');
      if (tipo === 'ALUMNO') {
        query = query.eq('rol', 'ALUMNO');
      } else {
        query = query.in('rol', ['ADMINISTRATIVO', 'ENTRENADOR', 'DIRECTOR']);
      }
      const { data: dataUsr } = await query;
      setUsuarios(dataUsr || []);

      const { data: dataAsis } = await supabase
        .from('asistencia')
        .select('usuario_id, estado')
        .eq('fecha', fecha);
      setAsistenciasHoy(dataAsis || []);
    } catch (err) {
      console.error("Error cargando modal:", err);
    } finally {
      setLoading(false);
    }
  };

  // Lógica de filtrado en tiempo real
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => 
      `${u.primer_nombre} ${u.primer_apellido}`.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [busqueda, usuarios]);

  const registrarAsistencia = async (uId, estado) => {
    try {
      setSaving(true);
      const { error } = await supabase.from('asistencia').upsert({
        usuario_id: uId,
        fecha: fecha,
        estado: estado,
        tipo_event: 'DIARIO'
      }, { onConflict: 'usuario_id,fecha' });

      if (error) throw error;
      
      setAsistenciasHoy(prev => {
        const existente = prev.find(a => a.usuario_id === uId);
        if (existente) return prev.map(a => a.usuario_id === uId ? { ...a, estado } : a);
        return [...prev, { usuario_id: uId, estado }];
      });

      onSaveSuccess(); 
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#05080d]/95 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-[#0a1118] border border-white/10 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        
        {/* HEADER */}
        <div className={`p-6 border-b border-white/5 ${tipo === 'ALUMNO' ? 'bg-cyan-400/5' : 'bg-emerald-500/5'}`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-white font-black text-lg uppercase italic tracking-tighter">
                Pase de Lista: <span className={tipo === 'ALUMNO' ? 'text-cyan-400' : 'text-emerald-400'}>{tipo}</span>
              </h4>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">{fecha}</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* BUSCADOR */}
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm group-focus-within:text-cyan-400 transition-colors">search</span>
            <input 
              type="text"
              placeholder={`BUSCAR ${tipo}...`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-black text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:bg-cyan-400/5 transition-all uppercase tracking-widest"
            />
          </div>
        </div>

        {/* LISTA */}
        <div className="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar space-y-3">
          {loading ? (
            <div className="py-10 text-center text-cyan-400 animate-pulse text-[10px] font-black uppercase">Cargando...</div>
          ) : usuariosFiltrados.length > 0 ? (
            usuariosFiltrados.map(u => {
              const asistencia = asistenciasHoy.find(a => a.usuario_id === u.id);
              return (
                <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all group">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase italic">{u.primer_nombre} {u.primer_apellido}</span>
                    <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">{u.rol}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      disabled={saving}
                      onClick={() => registrarAsistencia(u.id, 'PRESENTE')}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${asistencia?.estado === 'PRESENTE' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/40' : 'bg-white/5 text-slate-500 hover:bg-emerald-500/20 hover:text-emerald-400'}`}
                    >
                      <span className="material-symbols-outlined text-lg font-black">check</span>
                    </button>
                    <button 
                      disabled={saving}
                      onClick={() => registrarAsistencia(u.id, 'AUSENTE')}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${asistencia?.estado === 'AUSENTE' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40' : 'bg-white/5 text-slate-500 hover:bg-rose-500/20 hover:text-rose-400'}`}
                    >
                      <span className="material-symbols-outlined text-lg font-black">close</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center">
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest italic">No se encontraron resultados</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-black/20 text-center border-t border-white/5">
          <button onClick={onClose} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
            Guardar y volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAsistencia;