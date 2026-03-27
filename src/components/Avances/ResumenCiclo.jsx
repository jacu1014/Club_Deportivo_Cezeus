// src/components/Avances/ResumenCiclo.jsx
// VERSIÓN ACTUALIZADA - Con Heatmap Grupal y Selector de Vistas

import React, { useState, useEffect, useMemo } from 'react';
import { useAvances } from '../../hooks/useAvances';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, Radar, 
  ResponsiveContainer, Tooltip 
} from 'recharts';
import { supabase } from '../../lib/supabaseClient';

export default function ResumenCiclo({ ciclo, currentUser, onVolver, onEvaluar }) {
  const { 
    getItemsConCategorias,
    canEvaluar
  } = useAvances(currentUser);
  
  const [evaluaciones, setEvals] = useState([]);
  const [itemsCiclo, setItemsCiclo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vistaActiva, setVistaActiva] = useState('RADAR'); // 'RADAR' | 'HEATMAP'

  // 1. Cargar datos del ciclo y evaluaciones
  useEffect(() => {
    async function cargarDatos() {
      setLoading(true);
      try {
        const [items, { data: evals }] = await Promise.all([
          getItemsConCategorias(ciclo.id),
          supabase.from('evaluaciones_procesos').select('*, alumno:usuarios(*)').eq('ciclo_id', ciclo.id)
        ]);
        setItemsCiclo(items);
        setEvals(evals || []);
      } catch (err) {
        console.error("Error cargando resumen:", err);
      } finally {
        setLoading(false);
      }
    }
    cargarDatos();
  }, [ciclo.id, getItemsConCategorias]);

  // 2. Stats Generales
  const stats = useMemo(() => {
    if (!evaluaciones.length) return { promedio: 0, total: 0, progreso: 0 };
    const promedio = evaluaciones.reduce((acc, curr) => acc + curr.promedio, 0) / evaluaciones.length;
    const alumnosIds = [...new Set(evaluaciones.map(e => e.alumno_id))];
    let mejorados = 0;
    alumnosIds.forEach(id => {
      const evalsAl = evaluaciones.filter(e => e.alumno_id === id);
      const inicial = evalsAl.find(e => e.tipo === 'INICIAL')?.promedio || 0;
      const final = evalsAl.find(e => e.tipo === 'FINAL')?.promedio || 0;
      if (final > inicial) mejorados++;
    });

    return {
      promedio: promedio.toFixed(1),
      total: alumnosIds.length,
      progreso: ((mejorados / alumnosIds.length) * 100).toFixed(0)
    };
  }, [evaluaciones]);

  // 3. Datos Radar (Promedio Grupal)
  const datosRadarGrupo = useMemo(() => {
    return itemsCiclo.map(item => {
      const calificaciones = evaluaciones
        .flatMap(e => e.items || [])
        .filter(i => i.item_id === item.id)
        .map(i => i.calificacion);
      
      const promedioItem = calificaciones.length 
        ? calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length 
        : 0;

      return {
        subject: item.nombre,
        Promedio: parseFloat(promedioItem.toFixed(1)),
        fullMark: 10
      };
    });
  }, [itemsCiclo, evaluaciones]);

  // 4. Lógica para el Mapa de Calor (Heatmap)
  const datosHeatmap = useMemo(() => {
    if (!itemsCiclo.length || !evaluaciones.length) return { matrix: [], alumnos: [] };

    // Solo comparamos las evaluaciones más recientes (o finales) de cada alumno
    const alumnosUnicosIds = [...new Set(evaluaciones.map(e => e.alumno_id))];
    const alumnosData = alumnosUnicosIds.map(id => {
      const evalsAl = evaluaciones.filter(e => e.alumno_id === id);
      // Priorizamos la FINAL, si no existe usamos la INICIAL
      return evalsAl.find(e => e.tipo === 'FINAL') || evalsAl[0];
    });

    const matrix = alumnosData.map(evaluacion => {
      return itemsCiclo.map(item => {
        const cal = evaluacion.items?.find(i => i.item_id === item.id)?.calificacion || 0;
        let color = 'bg-rose-500/20 text-rose-500'; // Bajo
        if (cal >= 8) color = 'bg-emerald-500/40 text-emerald-400'; // Excelente
        else if (cal >= 6) color = 'bg-amber-500/30 text-amber-400'; // Regular
        
        return { cal, color };
      });
    });

    return { matrix, alumnos: alumnosData.map(e => e.alumno) };
  }, [itemsCiclo, evaluaciones]);

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-500 font-black uppercase text-[10px]">Analizando Datos...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* Header y Navegación */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <button onClick={onVolver} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group">
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Panel de Ciclos</span>
        </button>

        <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl">
          <button 
            onClick={() => setVistaActiva('RADAR')}
            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${vistaActiva === 'RADAR' ? 'bg-primary text-black' : 'text-slate-500 hover:text-white'}`}
          >
            Balance Grupal
          </button>
          <button 
            onClick={() => setVistaActiva('HEATMAP')}
            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${vistaActiva === 'HEATMAP' ? 'bg-primary text-black' : 'text-slate-500 hover:text-white'}`}
          >
            Mapa de Calor
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-black text-white italic uppercase leading-none">{ciclo.nombre}</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase mt-2 tracking-widest">Inteligencia de Rendimiento Deportivo</p>
        </div>
        <div className="flex gap-3 w-full">
          <StatCard label="Promedio Gral" value={stats.promedio} color="primary" />
          <StatCard label="Total Alumnos" value={stats.total} color="emerald" />
          <StatCard label="Tasa Mejora" value={`${stats.progreso}%`} color="amber" />
        </div>
      </div>

      {/* Visualización Principal */}
      <div className="bg-[#0a0f18]/60 border border-white/5 rounded-[3rem] p-8">
        {vistaActiva === 'RADAR' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5 flex flex-col items-center">
               <h3 className="text-white font-black uppercase text-[10px] tracking-widest mb-8 self-start">Distribución de Fortalezas</h3>
               <div className="w-full h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={datosRadarGrupo}>
                      <PolarGrid stroke="#ffffff05" />
                      <PolarAngleAxis dataKey="subject" tick={{fill: '#475569', fontSize: 9, fontWeight: '900'}} />
                      <Radar name="Media Grupal" dataKey="Promedio" stroke="#13ecec" fill="#13ecec" fillOpacity={0.3} />
                      <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff'}} />
                    </RadarChart>
                  </ResponsiveContainer>
               </div>
            </div>
            <div className="lg:col-span-7 space-y-4">
               <h3 className="text-white font-black uppercase text-[10px] tracking-widest mb-4 px-2">Ranking de Evaluación</h3>
               <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {evaluaciones
                    .filter(e => e.tipo === 'FINAL' || !evaluaciones.some(ev => ev.alumno_id === e.alumno_id && ev.tipo === 'FINAL'))
                    .sort((a,b) => b.promedio - a.promedio)
                    .map(ev => (
                    <AlumnoRow 
                      key={ev.id} 
                      evaluacion={ev} 
                      onVer={() => {}} // Aquí podrías abrir el modal de seguimiento
                      onEvaluar={() => onEvaluar(ev.alumno, ev.tipo)}
                      canEvaluar={canEvaluar}
                    />
                  ))}
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <h3 className="text-white font-black uppercase text-[10px] tracking-widest">Mapa de Calor por Competencia</h3>
              <div className="flex gap-4">
                <span className="flex items-center gap-1 text-[8px] font-black text-emerald-400 uppercase"><span className="w-2 h-2 rounded-full bg-emerald-500/40"/> +8.0</span>
                <span className="flex items-center gap-1 text-[8px] font-black text-amber-400 uppercase"><span className="w-2 h-2 rounded-full bg-amber-500/30"/> +6.0</span>
                <span className="flex items-center gap-1 text-[8px] font-black text-rose-500 uppercase"><span className="w-2 h-2 rounded-full bg-rose-500/20"/> -6.0</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/20 custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="p-4 text-left text-[9px] font-black text-slate-500 uppercase sticky left-0 bg-[#0a0f18] z-10">Alumno</th>
                    {itemsCiclo.map(item => (
                      <th key={item.id} className="p-4 text-[8px] font-black text-slate-500 uppercase tracking-tighter min-w-[90px]">
                        {item.nombre}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datosHeatmap.alumnos.map((al, alIdx) => (
                    <tr key={al.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 sticky left-0 bg-[#0d131f] z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-slate-800 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-primary overflow-hidden">
                            {al.foto_url ? <img src={al.foto_url} alt="" /> : al.primer_nombre[0]}
                          </div>
                          <span className="text-[10px] text-white font-bold uppercase truncate max-w-[120px]">
                            {al.primer_nombre} {al.primer_apellido}
                          </span>
                        </div>
                      </td>
                      {datosHeatmap.matrix[alIdx].map((celda, cIdx) => (
                        <td key={cIdx} className="p-1">
                          <div className={`w-full py-3 rounded-lg text-center text-[10px] font-black italic ${celda.color}`}>
                            {celda.cal.toFixed(1)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AlumnoRow({ evaluacion, onVer, onEvaluar, canEvaluar }) {
  const al = evaluacion.alumno;
  return (
    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between hover:border-primary/40 transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden border border-white/10">
          {al.foto_url ? <img src={al.foto_url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center font-black text-primary text-xs">{al.primer_nombre[0]}</div>}
        </div>
        <div>
          <p className="text-white font-black uppercase text-[10px] italic">{al.primer_nombre} {al.primer_apellido}</p>
          <p className="text-slate-500 text-[8px] font-bold uppercase">{al.categoria}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-primary font-black italic text-lg leading-none">{evaluacion.promedio}</p>
          <p className="text-slate-600 text-[7px] font-black uppercase">Nota Final</p>
        </div>
        <div className="flex gap-2">
          {canEvaluar && (
            <button onClick={onEvaluar} className="p-2 bg-primary/10 rounded-lg text-primary hover:bg-primary hover:text-black transition-all">
              <span className="material-symbols-outlined text-sm">edit_note</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    primary: 'text-primary border-primary/20 bg-primary/5',
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    amber: 'text-amber-400 border-amber-500/20 bg-amber-500/5'
  };
  return (
    <div className={`flex-1 p-4 rounded-2xl border ${colors[color]} text-center`}>
      <p className="text-[18px] font-black italic leading-none mb-1">{value}</p>
      <p className="text-[8px] font-black uppercase opacity-60 tracking-tighter">{label}</p>
    </div>
  );
}