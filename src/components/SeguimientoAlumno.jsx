// src/components/SeguimientoAlumno.jsx
// VERSIÓN OPTIMIZADA - Con Radar Comparativo y Adaptación Móvil

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
  onEliminarNota,
  onSelectAlumno
}) => {
  const { 
    getItemsConCategorias, 
    prepararDatosComparativos, 
    canEvaluar 
  } = useAvances(currentUser);

  // Estados de UI
  const [escribiendo, setEscribiendo] = useState(false);
  const [notaTexto, setNotaTexto] = useState('');
  const [categoriaNota, setCategoriaNota] = useState('Técnica');
  const [loading, setLoading] = useState(true);

  // Estados de Datos
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [itemsCiclo, setItemsCiclo] = useState([]);
  const [modoGrafico, setModoGrafico] = useState('AMBOS'); // 'INICIAL' | 'FINAL' | 'AMBOS'

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      if (!alumno?.id) return;
      setLoading(true);
      try {
        // 1. Obtener evaluaciones del alumno (Asumiendo tabla evaluaciones_procesos)
        const { data: evals } = await supabase
          .from('evaluaciones_procesos')
          .select('*')
          .eq('alumno_id', alumno.id)
          .order('created_at', { ascending: false });

        setEvaluaciones(evals || []);

        // 2. Obtener items del ciclo más reciente del alumno para el Radar
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
  }, [alumno, getItemsConCategorias]);

  // Procesar datos para el gráfico
  const datosRadar = useMemo(() => {
    if (!itemsCiclo.length || !evaluaciones.length) return [];
    
    const inicial = evaluaciones.find(e => e.tipo === 'INICIAL');
    const final = evaluaciones.find(e => e.tipo === 'FINAL');

    return prepararDatosComparativos(itemsCiclo, inicial, final);
  }, [itemsCiclo, evaluaciones, prepararDatosComparativos]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Cargando Progreso...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER COMPARATIVO */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5 border border-white/10 p-6 rounded-[2.5rem]">
        <div>
          <h3 className="text-white font-black italic uppercase text-lg leading-none">Análisis de Desempeño</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase mt-1">Comparativa de evolución técnica</p>
        </div>

        {/* Selector de modo (Pills) */}
        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
          {['INICIAL', 'FINAL', 'AMBOS'].map(m => (
            <button
              key={m}
              onClick={() => setModoGrafico(m)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all ${
                modoGrafico === m ? 'bg-primary text-[#05080d]' : 'text-slate-500 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ÁREA DEL GRÁFICO (Mobile Optimized) */}
      <div className="relative h-[350px] sm:h-[450px] w-full bg-[#0a0f18]/40 rounded-[3rem] border border-white/5 p-4 sm:p-8 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={datosRadar}>
            <PolarGrid stroke="#ffffff10" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#64748b', fontSize: 9, fontWeight: '900', letterSpacing: '-0.02em' }} 
            />
            
            {/* Capa Inicial (Azul Sky) */}
            {(modoGrafico === 'INICIAL' || modoGrafico === 'AMBOS') && (
              <Radar
                name="Evaluación Inicial"
                dataKey="inicial"
                stroke="#38bdf8"
                fill="#38bdf8"
                fillOpacity={0.4}
                animationDuration={1000}
              />
            )}
            
            {/* Capa Final (Esmeralda) */}
            {(modoGrafico === 'FINAL' || modoGrafico === 'AMBOS') && (
              <Radar
                name="Evaluación Final"
                dataKey="final"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.5}
                animationDuration={1500}
              />
            )}

            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '10px', color: '#fff' }}
              itemStyle={{ fontWeight: '800', textTransform: 'uppercase' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* SECCIÓN DE OBSERVACIONES / NOTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
           {/* Aquí iría el mapeo de tus observaciones con el diseño que ya tienes */}
           <h4 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2">
             <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
             Bitácora de Seguimiento
           </h4>
           {/* ... Resto del componente de notas ... */}
        </div>

        {/* RESUMEN RÁPIDO (MiniCards) */}
        <div className="space-y-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-[2rem]">
               <p className="text-emerald-400 font-black text-[9px] uppercase">Progreso General</p>
               <h4 className="text-2xl text-white font-black italic">+15% <span className="text-[10px] not-italic text-slate-500 uppercase">vs mes anterior</span></h4>
            </div>
            {/* Botón para nueva nota solo si canEvaluar es true */}
            {canEvaluar && (
              <button onClick={() => setEscribiendo(true)} className="w-full py-4 bg-primary text-black font-black uppercase text-[10px] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                Redactar Nueva Nota
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default SeguimientoAlumno;