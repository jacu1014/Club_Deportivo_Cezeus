import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // DEBUG: Verificamos si hay sesión activa
      const { data: session } = await supabase.auth.getSession();
      console.log("Sesión activa:", session);

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
        .limit(50);

      if (error) {
        console.error("Error detallado de Supabase:", error.message, error.details, error.hint);
        throw error;
      }

      console.log("Datos recibidos de la tabla actividad:", data);
      setLogs(data || []);
    } catch (err) {
      console.error("Error al cargar logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const getAccionColor = (accion: string) => {
    const act = (accion || '').toUpperCase();
    if (act.includes('ELIMINAR') || act.includes('BAJA')) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (act.includes('CREAR') || act.includes('NUEVO')) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (act.includes('EXPORT') || act.includes('VISUAL')) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-white font-black uppercase italic tracking-tighter text-xl">
            Historial de <span className="text-primary">Actividad</span>
          </h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Auditoría en tiempo real</p>
        </div>
        <button onClick={fetchLogs} className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all">
          <span className="material-symbols-outlined text-[20px]">refresh</span>
        </button>
      </div>

      <div className="bg-slate-950/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuario</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Acción</th>
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
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center text-slate-500 uppercase text-[10px] font-black tracking-widest">
                    No hay registros (Revisa consola para errores de RLS)
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} onClick={() => setSelectedLog(log)} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                          {log.usuarios?.foto_url ? <img src={log.usuarios.foto_url} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-500 text-sm">person</span>}
                        </div>
                        <div>
                          <p className="text-white font-bold text-xs">{log.usuarios ? `${log.usuarios.primer_nombre} ${log.usuarios.primer_apellido}` : 'Sistema'}</p>
                          <p className="text-[9px] text-slate-500 uppercase font-black">{log.usuarios?.rol || 'SISTEMA'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black border ${getAccionColor(log.accion)}`}>{log.accion}</span>
                      <p className="text-slate-400 text-[10px] mt-1 line-clamp-1">{log.descripcion}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-white font-mono text-[10px]">{log.fecha ? format(new Date(log.fecha), 'HH:mm:ss') : '--'}</p>
                      <p className="text-[9px] text-slate-500 uppercase">{log.fecha ? format(new Date(log.fecha), 'dd MMM yyyy', { locale: es }) : '--'}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE DETALLES */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h4 className="text-white font-black uppercase italic tracking-tighter">Detalles de Actividad</h4>
              <button onClick={() => setSelectedLog(null)} className="text-slate-500 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
              <pre className="text-primary font-mono text-[10px] overflow-auto max-h-60 custom-scrollbar">
                {JSON.stringify(selectedLog.detalles, null, 2)}
              </pre>
            </div>
            <p className="text-slate-400 text-xs italic">"{selectedLog.descripcion}"</p>
          </div>
        </div>
      )}
    </div>
  );
};