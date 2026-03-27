// src/components/Avances/ResumenCiclo.jsx
// VERSIÓN DINÁMICA - Con items personalizados por ciclo

import React, { useState, useEffect, useMemo } from 'react';
import { useAvances } from '../../hooks/useAvances';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PolarRadiusAxis, Legend } from 'recharts';

export default function ResumenCiclo({ ciclo, currentUser, onVolver, onEvaluar }) {
  const { 
    fetchEvaluacionesCiclo, 
    canEvaluar, 
    getItemsConCategorias,
    calcularPromedioEvaluacion,
    agruparPorCategoria
  } = useAvances(currentUser);
  
  const [evaluaciones, setEvals] = useState([]);
  const [itemsCiclo, setItemsCiclo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorItems, setErrorItems] = useState(null);
  const [alumnoDetalle, setDetalle] = useState(null);

  // Cargar items del ciclo
  useEffect(() => {
    if (!ciclo?.id) return;
    setErrorItems(null);
    getItemsConCategorias(ciclo.id)
      .then(items => {
        if (!items || items.length === 0) {
          setErrorItems('Este ciclo no tiene items configurados');
        }
        setItemsCiclo(items || []);
      })
      .catch(err => {
        console.error('Error cargando items:', err);
        setErrorItems('Error al cargar los items del ciclo');
      });
  }, [ciclo?.id, getItemsConCategorias]);

  // Cargar evaluaciones del ciclo
  useEffect(() => {
    fetchEvaluacionesCiclo(ciclo.id)
      .then(setEvals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ciclo.id, fetchEvaluacionesCiclo]);

  // Si hay error con los items, mostrar mensaje
  if (errorItems) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-4">
          <button onClick={onVolver}
                  className="flex items-center gap-2 text-[10px] font-black text-slate-500
                             hover:text-primary transition-all uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver
          </button>
          <div>
            <h3 className="font-black text-white uppercase italic text-base">
              Resumen: <span className="text-primary">{ciclo.nombre}</span>
            </h3>
          </div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-amber-400 mb-2">warning</span>
          <p className="text-amber-400 text-[10px] font-black uppercase">{errorItems}</p>
          <p className="text-slate-400 text-[8px] mt-2">
            No se puede mostrar el resumen porque el ciclo no tiene items configurados.
          </p>
          <button 
            onClick={onVolver}
            className="mt-4 text-primary text-[10px] underline hover:text-primary/80"
          >
            Volver al ciclo
          </button>
        </div>
      </div>
    );
  }

  // Agrupar evaluaciones por alumno y calcular promedios por categoría
  const alumnosMap = useMemo(() => {
    const map = {};
    
    evaluaciones.forEach(ev => {
      const id = ev.alumno_id;
      if (!map[id]) {
        map[id] = {
          alumno: ev.alumno,
          inicio: null,
          final: null,
          inicioPromedios: {},
          finalPromedios: {}
        };
      }
      
      // Calcular promedios por categoría para esta evaluación
      const itemsPorCat = {};
      if (ev.items && ev.items.length > 0) {
        ev.items.forEach(item => {
          const catNombre = item.item?.categoria?.nombre || 'Sin categoría';
          if (!itemsPorCat[catNombre]) {
            itemsPorCat[catNombre] = {
              suma: 0,
              count: 0,
              items: []
            };
          }
          itemsPorCat[catNombre].suma += item.calificacion;
          itemsPorCat[catNombre].count++;
          itemsPorCat[catNombre].items.push({
            nombre: item.item.nombre,
            calificacion: item.calificacion
          });
        });
      }
      
      // Calcular promedios
      const promedios = {};
      Object.entries(itemsPorCat).forEach(([cat, data]) => {
        promedios[cat] = Math.round(data.suma / data.count);
      });
      
      if (ev.tipo === 'INICIAL') {
        map[id].inicio = ev;
        map[id].inicioPromedios = promedios;
      } else if (ev.tipo === 'FINAL') {
        map[id].final = ev;
        map[id].finalPromedios = promedios;
      }
    });
    
    return Object.values(map);
  }, [evaluaciones]);

  // Obtener lista de categorías únicas de este ciclo
  const categoriasDelCiclo = useMemo(() => {
    const cats = new Set();
    itemsCiclo.forEach(item => {
      if (item.categoria?.nombre) {
        cats.add(item.categoria.nombre);
      }
    });
    return Array.from(cats);
  }, [itemsCiclo]);

  // Calcular delta de mejora por categoría
  const calcDeltaCategoria = (inicioProm, finalProm, categoria) => {
    const inicio = inicioProm[categoria] || 0;
    const final = finalProm[categoria] || 0;
    return final - inicio;
  };

  const DeltaBadge = ({ delta }) => {
    if (delta === null || delta === undefined) return <span className="text-[8px] text-slate-600 font-bold">—</span>;
    const color = delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-slate-400';
    return (
      <span className={`text-[10px] font-black ${color}`}>
        {delta > 0 ? '+' : ''}{delta}
      </span>
    );
  };

  // Panel de detalle de un alumno (con radar dinámico)
  const PanelDetalle = ({ item }) => {
    const { alumno, inicio, final, inicioPromedios, finalPromedios } = item;
    
    // Preparar datos para el radar (promedios por categoría)
    const radarData = categoriasDelCiclo.map(cat => ({
      subject: cat,
      Inicio: inicioPromedios[cat] || 0,
      Final: finalPromedios[cat] || 0,
    }));

    // Obtener items detallados por categoría
    const itemsDetalle = useMemo(() => {
      const detalle = {};
      if (inicio?.items) {
        inicio.items.forEach(itemEval => {
          const cat = itemEval.item?.categoria?.nombre || 'Sin categoría';
          if (!detalle[cat]) detalle[cat] = { inicio: [], final: [] };
          detalle[cat].inicio.push({
            nombre: itemEval.item.nombre,
            calificacion: itemEval.calificacion
          });
        });
      }
      if (final?.items) {
        final.items.forEach(itemEval => {
          const cat = itemEval.item?.categoria?.nombre || 'Sin categoría';
          if (!detalle[cat]) detalle[cat] = { inicio: [], final: [] };
          detalle[cat].final.push({
            nombre: itemEval.item.nombre,
            calificacion: itemEval.calificacion
          });
        });
      }
      return detalle;
    }, [inicio, final]);

    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
           onClick={() => setDetalle(null)}>
        <div className="bg-[#0a0f18] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-3xl
                        max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-300"
             onClick={e => e.stopPropagation()}>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-white uppercase italic text-lg">
                {alumno?.primer_nombre} <span className="text-primary">{alumno?.primer_apellido}</span>
              </h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{alumno?.categoria}</p>
            </div>
            <button onClick={() => setDetalle(null)}
                    className="w-8 h-8 rounded-full bg-white/5 text-slate-400 hover:text-white
                               flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Radar comparativo dinámico */}
          {inicio && (
            <div className="h-72 mb-6">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 text-center">
                {final ? 'Comparación Inicio vs Final por Categoría' : 'Evaluación de Inicio'}
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#ffffff10" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Inicio" dataKey="Inicio" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
                  {final && (
                    <Radar name="Final" dataKey="Final" stroke="#13ecec" fill="#13ecec" fillOpacity={0.35} />
                  )}
                  <Legend 
                    wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}
                    formatter={(value) => <span className="text-slate-400">{value}</span>}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabla de categorías con promedios */}
          <div className="space-y-4 mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Promedios por categoría
            </p>
            {categoriasDelCiclo.map(cat => {
              const pI = inicioPromedios[cat] || 0;
              const pF = finalPromedios[cat] || 0;
              const delta = pF - pI;
              return (
                <div key={cat} className="bg-white/5 px-5 py-3 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-primary">{cat}</span>
                    <DeltaBadge delta={delta} />
                  </div>
                  <div className="flex gap-6 text-right">
                    <div className="flex-1">
                      <p className="text-[8px] text-slate-600 font-bold uppercase">Inicio</p>
                      <p className="font-black text-slate-400 text-lg">{pI}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[8px] text-slate-600 font-bold uppercase">Final</p>
                      <p className="font-black text-primary text-lg">{pF || '—'}</p>
                    </div>
                  </div>
                  
                  {/* Items detallados de esta categoría */}
                  <div className="mt-3 pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
                    {itemsDetalle[cat]?.inicio.map((item, idx) => {
                      const itemFinal = itemsDetalle[cat]?.final.find(i => i.nombre === item.nombre);
                      return (
                        <div key={idx} className="text-[9px] flex justify-between">
                          <span className="text-slate-500">{item.nombre}</span>
                          <div className="flex gap-2">
                            <span className="text-slate-400">{item.calificacion}</span>
                            {itemFinal && (
                              <span className="text-primary">→ {itemFinal.calificacion}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Observaciones y mensaje personalizado */}
          <div className="space-y-3">
            {inicio?.observaciones && (
              <div className="bg-white/5 px-5 py-3 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Notas Inicio</p>
                <p className="text-[11px] text-slate-300 italic">"{inicio.observaciones}"</p>
              </div>
            )}
            {inicio?.mensaje_personalizado && (
              <div className="bg-primary/10 px-5 py-3 rounded-2xl border border-primary/20">
                <p className="text-[8px] font-black uppercase tracking-widest text-primary mb-1">Mensaje al alumno</p>
                <p className="text-[11px] text-primary/80 italic">"{inicio.mensaje_personalizado}"</p>
              </div>
            )}
            {final?.observaciones && (
              <div className="bg-white/5 px-5 py-3 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Notas Final</p>
                <p className="text-[11px] text-slate-300 italic">"{final.observaciones}"</p>
              </div>
            )}
            {final?.mensaje_personalizado && final !== inicio && (
              <div className="bg-primary/10 px-5 py-3 rounded-2xl border border-primary/20">
                <p className="text-[8px] font-black uppercase tracking-widest text-primary mb-1">Mensaje al alumno</p>
                <p className="text-[11px] text-primary/80 italic">"{final.mensaje_personalizado}"</p>
              </div>
            )}
          </div>

          {canEvaluar && ciclo.activo && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => { setDetalle(null); onEvaluar(alumno); }}
                className="flex items-center gap-2 bg-primary text-[#05080d] px-6 py-3 rounded-xl
                           text-[9px] font-black uppercase tracking-widest hover:bg-[#0AB5B5] transition-all">
                <span className="material-symbols-outlined text-sm">edit_note</span>
                {final ? 'Editar evaluación' : 'Completar evaluación final'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Calcular estadísticas
  const totalAlumnos = alumnosMap.length;
  const completos = alumnosMap.filter(a => a.inicio && a.final).length;
  const pendientes = alumnosMap.filter(a => !a.inicio || !a.final).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      <div className="flex items-center gap-4">
        <button onClick={onVolver}
                className="flex items-center gap-2 text-[10px] font-black text-slate-500
                           hover:text-primary transition-all uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Volver
        </button>
        <div>
          <h3 className="font-black text-white uppercase italic text-base">
            Resumen: <span className="text-primary">{ciclo.nombre}</span>
          </h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
            {totalAlumnos} alumnos inscritos · {completos} evaluaciones completas
          </p>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Inscritos" value={totalAlumnos} color="primary" />
        <StatCard label="Completos" value={completos} color="emerald" />
        <StatCard label="Pendientes" value={pendientes} color="amber" />
      </div>

      {loading ? (
        <div className="py-16 text-center text-primary animate-pulse text-[10px] font-black uppercase tracking-widest">
          Cargando evaluaciones...
        </div>
      ) : totalAlumnos === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-white/10 rounded-[2rem] space-y-3">
          <span className="material-symbols-outlined text-5xl text-slate-700">group_add</span>
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">
            No hay alumnos inscritos en este ciclo
          </p>
          <p className="text-slate-600 text-[8px] uppercase">
            Inscribe alumnos desde el panel de administración
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alumnosMap.map(item => (
            <AlumnoRow
              key={item.alumno?.id}
              item={item}
              categoriasDelCiclo={categoriasDelCiclo}
              canEvaluar={canEvaluar && ciclo.activo}
              onDetalle={() => setDetalle(item)}
              onEvaluar={() => onEvaluar(item.alumno)}
            />
          ))}
        </div>
      )}

      {alumnoDetalle && <PanelDetalle item={alumnoDetalle} />}
    </div>
  );
}

function AlumnoRow({ item, categoriasDelCiclo, canEvaluar, onDetalle, onEvaluar }) {
  const { alumno, inicio, final, inicioPromedios, finalPromedios } = item;
  const tieneAmbas = inicio && final;
  
  // Calcular promedio general
  const promedioGeneralInicio = Object.values(inicioPromedios).reduce((a, b) => a + b, 0) / (Object.keys(inicioPromedios).length || 1);
  const promedioGeneralFinal = Object.values(finalPromedios).reduce((a, b) => a + b, 0) / (Object.keys(finalPromedios).length || 1);
  
  return (
    <div className="flex items-center gap-4 p-5 bg-[#0a0f18]/60 border border-white/5 rounded-2xl
                    hover:border-white/10 transition-all">
      <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center
                      font-black text-primary text-sm border border-white/5 flex-shrink-0">
        {alumno?.foto_url
          ? <img src={alumno.foto_url} className="w-full h-full object-cover" alt="" />
          : `${alumno?.primer_nombre?.[0] || ''}${alumno?.primer_apellido?.[0] || ''}`}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-black text-white text-[10px] uppercase italic truncate">
          {alumno?.primer_nombre} {alumno?.primer_apellido}
        </p>
        <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">{alumno?.categoria}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[8px] text-slate-600">Inicio</p>
          <p className="font-black text-slate-400 text-sm">{Math.round(promedioGeneralInicio) || '—'}</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-slate-600">Final</p>
          <p className="font-black text-primary text-sm">{Math.round(promedioGeneralFinal) || '—'}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onDetalle}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-[9px] font-black uppercase
                           tracking-widest bg-white/5 border border-white/10 text-slate-400
                           hover:border-primary/30 hover:text-primary transition-all">
          <span className="material-symbols-outlined text-sm">bar_chart</span>
          Ver
        </button>
        {canEvaluar && (
          <button onClick={onEvaluar}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-[9px] font-black uppercase
                             tracking-widest bg-primary/10 border border-primary/20 text-primary
                             hover:bg-primary hover:text-[#05080d] transition-all">
            <span className="material-symbols-outlined text-sm">edit_note</span>
            {tieneAmbas ? 'Editar' : 'Evaluar'}
          </button>
        )}
      </div>
    </div>
  );
}

const StatCard = ({ label, value, color }) => {
  const colors = {
    primary: 'text-primary bg-primary/5 border-primary/10',
    emerald: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10',
    amber:   'text-amber-400 bg-amber-500/5 border-amber-500/10',
  };
  return (
    <div className={`border rounded-[1.5rem] p-5 ${colors[color]}`}>
      <div className="text-2xl font-black italic">{value}</div>
      <div className="text-[9px] font-black uppercase tracking-widest opacity-70 mt-1">{label}</div>
    </div>
  );
};