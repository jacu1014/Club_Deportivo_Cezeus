import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LogActividad {
  id: string;
  fecha: string;
  accion: string;
  modulo: string;
  descripcion: string;
  detalles: any;
  usuarios?: {
    primer_nombre: string;
    primer_apellido: string;
    foto_url: string;
    rol: string;
  };
}

export const ActividadSection: React.FC = () => {
  const [logs, setLogs] = useState<LogActividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogActividad | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterModulo, setFilterModulo] = useState('TODOS');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('actividad')
        .select(`
          *,
          usuarios:usuario_id (
            primer_nombre,
            primer_apellido,
            foto_url,
            rol
          )
        `)
        .order('fecha', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Error al cargar logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Lógica de filtrado en el cliente (más rápida para el usuario)
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const nombreCompleto = `${log.usuarios?.primer_nombre} ${log.usuarios?.primer_apellido}`.toLowerCase();
      const matchUsuario = nombreCompleto.includes(searchTerm.toLowerCase()) || 
                          log.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchModulo = filterModulo === 'TODOS' || log.modulo === filterModulo;
      
      const matchFecha = !filterDate || log.fecha.startsWith(filterDate);

      return matchUsuario && matchModulo && matchFecha;
    });
  }, [logs, searchTerm, filterModulo, filterDate]);

  const modulosDisponibles = useMemo(() => {
    const mods = new Set(logs.map(l => l.modulo));
    return ['TODOS', ...Array.from(mods)];
  }, [logs]);

  const getAccionColor = (accion: string) => {
    const act = (accion || '').toUpperCase();
    if (act.includes('ELIMINAR') || act.includes('BAJA')) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (act.includes('CREAR') || act.includes('NUEVO')) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h3 className="text-white font-black uppercase italic tracking-tighter text-xl">
            Historial de <span className="text-primary">Actividad</span>
          </h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Auditoría con filtros inteligentes</p>
        </div>
        
        {/* BARRA DE FILTROS */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
            <input 
              type="text"
              placeholder="BUSCAR POR USUARIO O ACCIÓN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold text-white uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          
          <input 
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-[10px] font-bold text-white uppercase focus:outline-none transition-all"
          />

          <select 
            value={filterModulo}
            onChange={(e) => setFilterModulo(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-[10px] font-bold text-white uppercase focus:outline-none transition-all"
          >
            {modulosDisponibles.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
          </select>

          <button onClick={fetchLogs} className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all">
            <span className="material-symbols-outlined text-[20px]">refresh</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-950/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuario</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Acción / Módulo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={3} className="px-6 py-8"><div className="h-4 bg-white/5 rounded-full w-full"></div></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center text-slate-500 uppercase text-[10px] font-black tracking-widest">
                    No se encontraron resultados con estos filtros
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)} 
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                          <img 
                            src={log.usuarios?.foto_url || `https://ui-avatars.com/api/?name=${log.usuarios?.primer_nombre || 'S'}&background=random&color=fff`} 
                            className="w-full h-full object-cover" 
                            alt="Avatar"
                          />
                        </div>
                        <div>
                          <p className="text-white font-bold text-xs">
                            {log.usuarios ? `${log.usuarios.primer_nombre} ${log.usuarios.primer_apellido}` : 'Sistema'}
                          </p>
                          <p className="text-[9px] text-slate-500 uppercase font-black">{log.usuarios?.rol || 'PROCESO'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${getAccionColor(log.accion)}`}>
                          {log.accion}
                        </span>
                        <span className="text-[8px] font-black text-primary uppercase tracking-widest opacity-70">
                          {log.modulo}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px] mt-1 line-clamp-1">{log.descripcion}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-white font-mono text-[10px]">{format(new Date(log.fecha), 'HH:mm:ss')}</p>
                      <p className="text-[9px] text-slate-500 uppercase">{format(new Date(log.fecha), 'dd MMM yyyy', { locale: es })}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE DETALLES (Mismo de antes) */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <h4 className="text-white font-black uppercase italic tracking-tighter text-lg">Detalles Técnicos</h4>
                <p className="text-[10px] text-primary uppercase font-bold tracking-widest">{selectedLog.modulo}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-500 hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
              <pre className="text-primary font-mono text-[11px] overflow-auto max-h-60 custom-scrollbar">
                {JSON.stringify(selectedLog.detalles, null, 2)}
              </pre>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
               <p className="text-slate-300 text-xs italic">"{selectedLog.descripcion}"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};