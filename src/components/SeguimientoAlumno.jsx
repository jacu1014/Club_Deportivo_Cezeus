// src/components/SeguimientoAlumno.jsx
// VERSIÓN ACTUALIZADA - Comparativa Dinámica Cabecera-Detalle

import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAvances } from '../hooks/useAvances';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Legend, Tooltip
} from 'recharts';

const SeguimientoAlumno = ({
  alumno,
  currentUser,
  observaciones = [],
  onAgregarNota,
  onEditarNota,
  onEliminarNota
}) => {
  const { 
    getItemsConCategorias, 
    fetchEvaluacionesAlumno, // Usamos la función del hook que ya trae los items
    canEvaluar 
  } = useAvances(currentUser);

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [modoGrafico, setModoGrafico] = useState('AMBOS'); 

  // Estados de Datos
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [itemsCiclo, setItemsCiclo] = useState([]);

  // 1. Cargar Historial y Configuración de Items
  useEffect(() => {
    const cargarDatos = async () => {
      if (!alumno?.id) return;
      setLoading(true);
      try {
        // Traemos las evaluaciones (incluyendo el array de items gracias al join del hook)
        const evals = await fetchEvaluacionesAlumno(alumno.id);
        setEvaluaciones(evals || []);

        // Si hay evaluaciones, cargamos qué items se evaluaron en el ciclo más reciente
        if (evals?.length > 0) {
          const items = await getItemsConCategorias(evals[0].ciclo_id);
          setItemsCiclo(items);
        }
      } catch (err) {
        console.error("Error cargando seguimiento:", err);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [alumno?.id, fetchEvaluacionesAlumno, getItemsConCategorias]);

  // 2. Procesar datos para el Radar Comparativo
  const datosRadar = useMemo(() => {
    if (!itemsCiclo.length || !evaluaciones.length) return [];
    
    // Filtramos las dos evaluaciones clave del ciclo actual/más reciente
    const inicial = evaluaciones.find(e => e.tipo === 'INICIAL');
    const final = evaluaciones.find(e => e.tipo === 'FINAL');

    // Mapeamos los items configurados para el ciclo y buscamos la nota del alumno en cada uno
    return itemsCiclo.map(itemConfig => {
      // Buscamos la calificación en el array 'items' que viene de la tabla evaluaciones_items
      const notaInicial = inicial?.items?.find(i => i.item_id === itemConfig.id)?.calificacion || 0;
      const notaFinal = final?.items?.find(i => i.item_id === itemConfig.id)?.calificacion || 0;

      return {
        subject: itemConfig.nombre,
        inicial: notaInicial,
        final: notaFinal,
        fullMark: 10
      };
    });
  }, [itemsCiclo, evaluaciones]);

  // 3. Cálculo de mejora porcentual
  const mejoraGral = useMemo(() => {
    const inicial = evaluaciones.find(e => e.tipo === 'INICIAL')?.promedio || 0;
    const final = evaluaciones.find(e => e.tipo === 'FINAL')?.promedio || 0;
    if (inicial === 0) return 0;
    return (((final - inicial) / inicial) * 100).toFixed(0);
  }, [evaluaciones]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Calculando Evolución...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
      
      {/* HEADER: Perfil Alumno */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-[#0a0f18]/80 border border-white/5 p-8 rounded-[3rem]">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-800 border-2 border-primary/20 overflow-hidden shadow-2xl shadow-primary/10">
            {alumno.foto_url ? (
              <img src={alumno.foto_url} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-black text-primary">
                {alumno.primer_nombre?.[0]}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase leading-none">
              {alumno.primer_nombre} {alumno.primer_apellido}
            </h2>
            <div className="flex gap-2 mt-2">
              <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-black text-primary uppercase tracking-widest">
                {alumno.categoria || 'Sin Categoría'}
              </span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">
                ID: {alumno.identificacion || '---'}
              </span>
            </div>
          </div>
        </div>

        {/* Filtros de Gráfico */}
        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
          {['INICIAL', 'FINAL', 'AMBOS'].map(m => (
            <button
              key={m}
              onClick={() => setModoGrafico(m)}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black transition-all duration-300 ${
                modoGrafico === m ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'
              }`}
            >
              {m === 'AMBOS' ? 'Comparativa' : `Ver ${m}`}
            </button>
          ))}
        </div>
      </div>

      {/* VISUALIZACIÓN RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 relative h-[450px] bg-[#0a0f18]/40 rounded-[3.5rem] border border-white/5 p-8 overflow-hidden group">
          <div className="absolute top-8 left-8">
            <h3 className="text-white/20 font-black uppercase text-[10px] tracking-[0.4em] italic">Análisis de Competencias</h3>
          </div>
          
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={datosRadar}>
              <PolarGrid stroke="#ffffff05" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#475569', fontSize: 9, fontWeight: '900', letterSpacing: '0.05em' }} 
              />
              
              {(modoGrafico === 'INICIAL' || modoGrafico === 'AMBOS') && (
                <Radar
                  name="Punto de Partida"
                  dataKey="inicial"
                  stroke="#38bdf8"
                  fill="#38bdf8"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              )}
              
              {(modoGrafico === 'FINAL' || modoGrafico === 'AMBOS') && (
                <Radar
                  name="Estado Actual"
                  dataKey="final"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.25}
                  strokeWidth={3}
                />
              )}

              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontSize: '10px' }}
                itemStyle={{ color: '#fff', fontWeight: '900', textTransform: 'uppercase' }}
              />
              <Legend verticalAlign="bottom" iconType="diamond" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#64748b' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* SIDEBAR DE MÉTRICAS */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card Mejora */}
          <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${mejoraGral > 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
            <p className="text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] mb-2">Crecimiento en el Ciclo</p>
            <div className="flex items-baseline gap-2">
              <h4 className={`text-5xl font-black italic tracking-tighter ${mejoraGral > 0 ? 'text-emerald-400' : 'text-white'}`}>
                {mejoraGral > 0 ? `+${mejoraGral}%` : `${mejoraGral}%`}
              </h4>
              <span className="material-symbols-outlined text-emerald-400 font-black">
                {mejoraGral > 0 ? 'trending_up' : 'trending_flat'}
              </span>
            </div>
          </div>

          {/* Card Promedio Final */}
          <div className="bg-[#0a0f18]/60 border border-white/5 p-8 rounded-[2.5rem]">
             <p className="text-slate-600 font-black text-[9px] uppercase tracking-[0.2em] mb-2">Promedio General (Final)</p>
             <h4 className="text-4xl text-primary font-black italic">
               {evaluaciones.find(e => e.tipo === 'FINAL')?.promedio?.toFixed(1) || 'N/A'}
             </h4>
          </div>

          {/* Observaciones (Bitácora) */}
          <div className="pt-4">
            <h4 className="text-white font-black uppercase text-[10px] tracking-[0.2em] mb-4 flex items-center gap-2 px-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              Observaciones Recientes
            </h4>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {observaciones.length > 0 ? (
                observaciones.slice(0, 3).map((obs) => (
                  <div key={obs.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <p className="text-white/80 text-[10px] leading-relaxed italic">"{obs.nota}"</p>
                    <div className="flex justify-between items-center mt-3 text-[7px] font-black uppercase text-slate-500 tracking-widest">
                      <span>{obs.autor_nombre}</span>
                      <span>{new Date(obs.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-600 text-[9px] uppercase font-black px-2 italic">No hay notas registradas</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeguimientoAlumno;