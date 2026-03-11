import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LogActividad {
  id: string;
  created_at: string;
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

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('actividad') // Asegúrate que tu tabla se llame así
        .select(`
          *,
          usuarios:usuario_id (
            primer_nombre,
            primer_apellido,
            foto_url,
            rol
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Error al cargar logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const getAccionColor = (accion: string) => {
    if (accion.includes('ELIMINAR') || accion.includes('BAJA')) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (accion.includes('CREAR') || accion.includes('NUEVO')) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (accion.includes('EXPORT') || accion.includes('VISUAL')) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER DE LA SECCIÓN */}
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-white font-black uppercase italic tracking-tighter text-xl">
            Historial de <span className="text-primary">Actividad</span>
          </h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            Auditoría de movimientos en tiempo real
          </p>
        </div>
        <button 
          onClick={fetchLogs}
          className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">refresh</span>
        </button>
      </div>

      {/* CONTENEDOR DE LA TABLA */}
      <div className="bg-slate-950/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuario</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Acción</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Descripción</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-8"><div className="h-4 bg-white/5 rounded-full w-full"></div></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <p className="text-slate-500 uppercase text-[10px] font-black tracking-widest">No hay registros de actividad aún</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                          {log.usuarios?.foto_url ? (
                            <img src={log.usuarios.foto_url} alt="User" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-500 text-sm">person</span>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-bold text-xs">
                            {log.usuarios?.primer_nombre} {log.usuarios?.primer_apellido}
                          </p>
                          <p className="text-[9px] text-slate-500 uppercase font-black">{log.usuarios?.rol?.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black border ${getAccionColor(log.accion)}`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-300 text-xs line-clamp-1 group-hover:line-clamp-none transition-all">
                        {log.descripcion}
                      </p>
                      <p className="text-[9px] text-slate-600 uppercase font-bold mt-1">{log.modulo}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-white font-mono text-[10px]">
                        {format(new Date(log.created_at), 'HH:mm:ss')}
                      </p>
                      <p className="text-[9px] text-slate-500 uppercase">
                        {format(new Date(log.created_at), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};