// src/components/Avances/ResumenCiclo.jsx
// VERSIÓN ACTUALIZADA - Adaptada a estructura Cabecera-Detalle y Heatmap Dinámico

import React, { useState, useEffect, useMemo } from 'react';
import { useAvances } from '../../hooks/useAvances';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, Radar, 
  ResponsiveContainer, Tooltip 
} from 'recharts';

// Helper de módulo: calcula promedio desde evaluaciones_items (promedio no existe como columna)
const calcularPromedio = (ev) => {
  if (!ev?.evaluaciones_items?.length) return 0;
  const suma = ev.evaluaciones_items.reduce((acc, i) => acc + (i.calificacion ?? 0), 0);
  return suma / ev.evaluaciones_items.length;
};

export default function ResumenCiclo({ ciclo, currentUser, onVolver, onEvaluar }) {
  const { 
    getItemsConCategorias,
    fetchEvaluacionesCiclo,
    canEvaluar
  } = useAvances(currentUser);
  
  const [evaluaciones, setEvals] = useState([]);
  const [itemsCiclo, setItemsCiclo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vistaActiva, setVistaActiva] = useState('RADAR'); // 'RADAR' | 'HEATMAP'

  // 1. Cargar datos del ciclo y evaluaciones (con sus items integrados)
  useEffect(() => {
    async function cargarDatos() {
      if (!ciclo?.id) return;
      setLoading(true);
      try {
        // Ejecutamos en paralelo la carga de la configuración del ciclo y las notas reales
        const [items, evals] = await Promise.all([
          getItemsConCategorias(ciclo.id),
          fetchEvaluacionesCiclo(ciclo.id)
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
  }, [ciclo.id, getItemsConCategorias, fetchEvaluacionesCiclo]);

  // 2. Stats Generales (Promedios y Mejora)
  const stats = useMemo(() => {
    if (!evaluaciones.length) return { promedio: "0.0", total: 0, progreso: 0 };
    
    const promedioGral = evaluaciones.reduce((acc, curr) => acc + calcularPromedio(curr), 0) / evaluaciones.length;
    const alumnosIds = [...new Set(evaluaciones.map(e => e.alumno_id))];
    
    let mejorados = 0;
    alumnosIds.forEach(id => {
      const evalsAl = evaluaciones.filter(e => e.alumno_id === id);
      const inicial = calcularPromedio(evalsAl.find(e => e.tipo === 'INICIAL'));
      const final   = calcularPromedio(evalsAl.find(e => e.tipo === 'FINAL'));
      if (final > inicial && inicial > 0) mejorados++;
    });

    return {
      promedio: promedioGral.toFixed(1),
      total: alumnosIds.length,
      progreso: alumnosIds.length > 0 ? ((mejorados / alumnosIds.length) * 100).toFixed(0) : 0
    };
  }, [evaluaciones]);

  // 3. Datos Radar (Promedio Grupal por Item)
  const datosRadarGrupo = useMemo(() => {
    return itemsCiclo.map(itemConfig => {
      const calificaciones = evaluaciones
        .flatMap(e => e.evaluaciones_items || [])
        .filter(i => i.ciclo_item_id === itemConfig.id)
        .map(i => i.calificacion);
      
      const promedioItem = calificaciones.length 
        ? calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length 
        : 0;

      return {
        subject: itemConfig.nombre,
        Promedio: parseFloat(promedioItem.toFixed(1)),
        fullMark: 10
      };
    });
  }, [itemsCiclo, evaluaciones]);

  // 4. Lógica para el Mapa de Calor (Heatmap)
  const datosHeatmap = useMemo(() => {
    if (!itemsCiclo.length || !evaluaciones.length) return { matrix: [], alumnos: [] };

    const alumnosUnicosIds = [...new Set(evaluaciones.map(e => e.alumno_id))];
    
    const dataFiltrada = alumnosUnicosIds.map(id => {
      const evalsAl = evaluaciones.filter(e => e.alumno_id === id);
      // Mostramos la foto del alumno y sus notas más recientes (FINAL > INICIAL)
      const masReciente = evalsAl.find(e => e.tipo === 'FINAL') || evalsAl.find(e => e.tipo === 'INICIAL');
      
      return {
        alumno: masReciente.alumno, // Obtenido por el join en el hook
        evaluacion: masReciente
      };
    });

    const matrix = dataFiltrada.map(({ evaluacion }) => {
      return itemsCiclo.map(itemConfig => {
        const detalle = evaluacion.evaluaciones_items?.find(i => i.ciclo_item_id === itemConfig.id);
        const cal = detalle ? detalle.calificacion : 0;
        
        let color = 'bg-rose-500/20 text-rose-500'; 
        if (cal >= 8) color = 'bg-emerald-500/40 text-emerald-400';
        else if (cal >= 6) color = 'bg-amber-500/30 text-amber-400';
        
        return { cal, color };
      });
    });

    return { matrix, alumnos: dataFiltrada.map(d => d.alumno) };
  }, [itemsCiclo, evaluaciones]);

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-500 font-black uppercase text-[10px] tracking-[0.2em]">Sincronizando Métricas...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <button onClick={onVolver} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group">
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Volver a Ciclos</span>
        </button>

        <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl">
          {['RADAR', 'HEATMAP'].map(v => (
            <button 
              key={v}
              onClick={() => setVistaActiva(v)}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${vistaActiva === v ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
            >
              {v === 'RADAR' ? 'Balance Grupal' : 'Mapa de Calor'}
            </button>
          ))}
        </div>
      </div>

      {/* Título y Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-black text-white italic uppercase leading-none tracking-tighter">{ciclo.nombre}</h2>
          <p className="text-primary text-[10px] font-black uppercase mt-2 tracking-[0.3em]">Performance Analytics</p>
        </div>
        <div className="flex gap-3 w-full">
          <StatCard label="Promedio Gral" value={stats.promedio} color="primary" />
          <StatCard label="Alumnos" value={stats.total} color="emerald" />
          <StatCard label="Mejora" value={`${stats.progreso}%`} color="amber" />
        </div>
      </div>

      <div className="bg-[#0a0f18]/60 border border-white/5 rounded-[3rem] p-8">
        {vistaActiva === 'RADAR' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Radar Grupal */}
            <div className="lg:col-span-5 flex flex-col items-center">
               <h3 className="text-white/40 font-black uppercase text-[9px] tracking-[0.2em] mb-8 self-start italic">Promedios por Competencia</h3>
               <div className="w-full h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={datosRadarGrupo}>
                      <PolarGrid stroke="#ffffff05" />
                      <PolarAngleAxis dataKey="subject" tick={{fill: '#475569', fontSize: 9, fontWeight: '900'}} />
                      <Radar name="Media Grupal" dataKey="Promedio" stroke="#13ecec" fill="#13ecec" fillOpacity={0.2} />
                      <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff'}} />
                    </RadarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Ranking Lateral */}
            <div className="lg:col-span-7 space-y-4">
               <h3 className="text-white/40 font-black uppercase text-[9px] tracking-[0.2em] mb-4 px-2 italic">Ranking de Rendimiento</h3>
               <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {evaluaciones
                    .filter(e => e.tipo === 'FINAL' || !evaluaciones.some(ev => ev.alumno_id === e.alumno_id && ev.tipo === 'FINAL'))
                    .sort((a,b) => (b.promedio || 0) - (a.promedio || 0))
                    .map(ev => (
                    <AlumnoRow 
                      key={ev.id} 
                      evaluacion={ev} 
                      onEvaluar={() => onEvaluar(ev.alumno, ev.tipo)}
                      canEvaluar={canEvaluar}
                    />
                  ))}
               </div>
            </div>
          </div>
        ) : (
          /* Heatmap View */
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <h3 className="text-white/40 font-black uppercase text-[9px] tracking-[0.2em] italic">Análisis Comparativo por Alumno</h3>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/20 custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="p-4 text-left text-[9px] font-black text-slate-600 uppercase sticky left-0 bg-[#0a0f18] z-10">Alumno</th>
                    {itemsCiclo.map(item => (
                      <th key={item.id} className="p-4 text-[8px] font-black text-slate-500 uppercase tracking-tighter min-w-[100px]">
                        {item.nombre}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datosHeatmap.alumnos.map((al, alIdx) => (
                    <tr key={al.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 sticky left-0 bg-[#0d131f] z-10 border-r border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-primary overflow-hidden border border-white/5">
                            {al.foto_url ? <img src={al.foto_url} alt="" className="w-full h-full object-cover" /> : al.primer_nombre[0]}
                          </div>
                          <span className="text-[10px] text-white font-bold uppercase truncate max-w-[140px]">
                            {al.primer_nombre} {al.primer_apellido}
                          </span>
                        </div>
                      </td>
                      {datosHeatmap.matrix[alIdx].map((celda, cIdx) => (
                        <td key={cIdx} className="p-1">
                          <div className={`w-full py-3 rounded-lg text-center text-[10px] font-black italic shadow-inner ${celda.color}`}>
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

// Subcomponente: Fila de Alumno en el Ranking
function AlumnoRow({ evaluacion, onEvaluar, canEvaluar }) {
  const al = evaluacion.alumno;
  if (!al) return null;
  
  return (
    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between hover:border-primary/40 transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden border border-white/10 shadow-lg">
          {al.foto_url ? <img src={al.foto_url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center font-black text-primary text-xs">{al.primer_nombre[0]}</div>}
        </div>
        <div>
          <p className="text-white font-black uppercase text-[10px] italic leading-tight">{al.primer_nombre} {al.primer_apellido}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full ${evaluacion.tipo === 'FINAL' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest">{evaluacion.tipo}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-primary font-black italic text-xl leading-none">{calcularPromedio(evaluacion).toFixed(1)}</p>
          <p className="text-slate-600 text-[7px] font-black uppercase mt-1">Nota Gral</p>
        </div>
        {canEvaluar && (
          <button onClick={onEvaluar} className="p-2 bg-primary/10 rounded-lg text-primary hover:bg-primary hover:text-black transition-all">
            <span className="material-symbols-outlined text-sm">edit_note</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Subcomponente: Tarjetas de Estadísticas
function StatCard({ label, value, color }) {
  const colors = {
    primary: 'text-primary border-primary/20 bg-primary/5 shadow-primary/5',
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 shadow-emerald-500/5',
    amber: 'text-amber-400 border-amber-500/20 bg-amber-500/5 shadow-amber-500/5'
  };
  return (
    <div className={`flex-1 p-4 rounded-2xl border ${colors[color]} text-center shadow-2xl`}>
      <p className="text-[20px] font-black italic leading-none mb-1 tracking-tighter">{value}</p>
      <p className="text-[7px] font-black uppercase opacity-60 tracking-[0.2em]">{label}</p>
    </div>
  );
}