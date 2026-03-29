// src/components/SeguimientoAlumno.jsx
import React, { useState, useMemo, useEffect } from 'react';
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
  onEliminarNota
}) => {
  const { 
    getItemsConCategorias, 
    fetchEvaluacionesAlumno,
    canEvaluar 
  } = useAvances(currentUser);

  // Estados
  const [loading, setLoading] = useState(true);
  const [modoGrafico, setModoGrafico] = useState('AMBOS'); 
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [itemsCiclo, setItemsCiclo] = useState([]);
  const [nuevaNota, setNuevaNota] = useState('');

  // 1. Cargar Historial y Configuración de Items
  useEffect(() => {
    const cargarDatos = async () => {
      if (!alumno?.id) return;
      setLoading(true);
      try {
        const evals = await fetchEvaluacionesAlumno(alumno.id);
        setEvaluaciones(evals || []);

        if (evals?.length > 0) {
          // Obtenemos los items técnicos del ciclo más reciente evaluado
          const items = await getItemsConCategorias(evals[0].ciclo_id);
          setItemsCiclo(items || []);
        }
      } catch (err) {
        console.error("Error cargando seguimiento:", err);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [alumno?.id, fetchEvaluacionesAlumno, getItemsConCategorias]);

  // 2. Procesar datos para el Radar (Comparativa Dinámica)
  const datosRadar = useMemo(() => {
    if (!itemsCiclo.length || !evaluaciones.length) return [];
    
    const inicial = evaluaciones.find(e => e.tipo === 'INICIAL');
    const final = evaluaciones.find(e => e.tipo === 'FINAL');

    return itemsCiclo.map(itemConfig => {
      // Buscamos la calificación en las distintas estructuras posibles (items o evaluaciones_items)
      const buscarNota = (evaluacion) => {
        if (!evaluacion) return 0;
        const encontrado = evaluacion.items?.find(i => i.item_id === itemConfig.id) || 
                           evaluacion.evaluaciones_items?.find(i => i.ciclo_item_id === itemConfig.id);
        return encontrado?.calificacion || 0;
      };

      return {
        subject: itemConfig.nombre,
        inicial: buscarNota(inicial),
        final: buscarNota(final),
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

  const handleEnviarNota = () => {
    if (!nuevaNota.trim()) return;
    onAgregarNota({
      alumno_id: alumno.id,
      nota: nuevaNota,
      autor_id: currentUser.id,
      autor_nombre: currentUser.primer_nombre
    });
    setNuevaNota('');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Sincronizando Evolución...</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* VISUALIZACIÓN RADAR */}
        <div className="lg:col-span-8 relative h-[480px] bg-[#0a0f18]/40 rounded-[3.5rem] border border-white/5 p-8 overflow-hidden group">
          <div className="absolute top-8 left-8 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm">monitoring</span>
            <h3 className="text-white/40 font-black uppercase text-[10px] tracking-[0.4em] italic">Análisis de Competencias</h3>
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

        {/* SIDEBAR DE MÉTRICAS & BITÁCORA */}
        <div className="lg:col-span-4 space-y-4">
          <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${mejoraGral > 0 ? 'bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-white/5 border-white/10'}`}>
            <p className="text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] mb-2">Mejora en el Ciclo</p>
            <div className="flex items-baseline gap-2">
              <h4 className={`text-5xl font-black italic tracking-tighter ${mejoraGral > 0 ? 'text-emerald-400' : 'text-white'}`}>
                {mejoraGral > 0 ? `+${mejoraGral}%` : `${mejoraGral}%`}
              </h4>
              <span className={`material-symbols-outlined font-black ${mejoraGral > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                {mejoraGral > 0 ? 'trending_up' : 'trending_flat'}
              </span>
            </div>
          </div>

          <div className="bg-[#0a0f18]/60 border border-white/5 p-8 rounded-[2.5rem]">
             <p className="text-slate-600 font-black text-[9px] uppercase tracking-[0.2em] mb-2">Promedio General (Final)</p>
             <h4 className="text-4xl text-primary font-black italic">
               {evaluaciones.find(e => e.tipo === 'FINAL')?.promedio?.toFixed(1) || 'N/A'}
             </h4>
          </div>

          {/* BITÁCORA INTERACTIVA */}
          <div className="pt-4 space-y-4">
            <h4 className="text-white font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2 px-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              Bitácora de Observaciones
            </h4>

            {canEvaluar && (
              <div className="relative group">
                <textarea
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  placeholder="Añadir nota técnica o avance..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:border-primary/30 transition-all resize-none min-h-[100px]"
                />
                <button 
                  onClick={handleEnviarNota}
                  disabled={!nuevaNota.trim()}
                  className="absolute bottom-3 right-3 p-2 bg-primary text-black rounded-xl disabled:opacity-20 hover:scale-110 transition-all shadow-lg"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            )}

            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
              {observaciones.length > 0 ? (
                observaciones.map((obs) => (
                  <div key={obs.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl group relative">
                    <p className="text-white/80 text-[10px] leading-relaxed italic">"{obs.nota}"</p>
                    <div className="flex justify-between items-center mt-3 text-[7px] font-black uppercase text-slate-500 tracking-widest">
                      <span className="text-primary/70">{obs.autor_nombre}</span>
                      <span>{new Date(obs.created_at).toLocaleDateString()}</span>
                    </div>
                    {canEvaluar && (
                      <button 
                        onClick={() => onEliminarNota(obs.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:bg-rose-500/10 rounded-md transition-all"
                      >
                        <span className="material-symbols-outlined text-xs">delete</span>
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-600 text-[9px] uppercase font-black px-2 italic text-center py-8 border border-dashed border-white/5 rounded-2xl">
                  No hay notas registradas
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeguimientoAlumno;