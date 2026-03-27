// src/components/Avances/FormEvaluacion.jsx
// VERSIÓN DINÁMICA - Optimizada para rendimiento

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAvances } from '../../hooks/useAvances';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PolarRadiusAxis } from 'recharts';

export default function FormEvaluacion({ ciclo, alumnoInicial, currentUser, onVolver, onGuardado }) {
  const { 
    guardarEvaluacion, 
    fetchEvaluacionesAlumno, 
    getItemsConCategorias,
    obtenerMensajePorPromedio,
    mensajesPersonalizados 
  } = useAvances(currentUser);

  // Estados
  const [alumnos, setAlumnos] = useState([]);
  const [loadingAlumnos, setLoadingA] = useState(true);
  const [alumno, setAlumno] = useState(alumnoInicial || null);
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('INICIAL');
  const [itemsCiclo, setItemsCiclo] = useState([]);
  const [valores, setValores] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [mensajePersonalizado, setMensajePersonalizado] = useState('');
  const [saving, setSaving] = useState(false);
  const [evalExistente, setEvalExistente] = useState(null);
  const [loadingItems, setLoadingItems] = useState(true);
  const [errorItems, setErrorItems] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  
  // Refs para evitar efectos innecesarios
  const initialLoadDone = useRef(false);
  const isFirstRender = useRef(true);

  // Agrupar items por categoría
  const itemsPorCategoria = useMemo(() => {
    const grouped = {};
    itemsCiclo.forEach(item => {
      const catNombre = item.categoria?.nombre || 'Sin categoría';
      if (!grouped[catNombre]) {
        grouped[catNombre] = {
          categoria_id: item.categoria_id,
          nombre: catNombre,
          items: []
        };
      }
      grouped[catNombre].items.push(item);
    });
    return grouped;
  }, [itemsCiclo]);

  const categoriasList = useMemo(() => Object.keys(itemsPorCategoria), [itemsPorCategoria]);
  
  // Activar primera categoría por defecto (solo una vez)
  useEffect(() => {
    if (categoriasList.length > 0 && !categoriaActiva && !initialLoadDone.current) {
      setCategoriaActiva(categoriasList[0]);
    }
  }, [categoriasList, categoriaActiva]);

  // Cargar alumnos filtrados por categoría del ciclo
  useEffect(() => {
    const fetchAlumnos = async () => {
      setLoadingA(true);
      try {
        let query = supabase
          .from('usuarios')
          .select('id, primer_nombre, primer_apellido, categoria, foto_url, numero_documento')
          .eq('rol', 'ALUMNO')
          .ilike('estado', 'activo')
          .order('primer_apellido');

        if (ciclo.categoria && ciclo.categoria !== 'TODAS') {
          query = query.ilike('categoria', `%${ciclo.categoria}%`);
        }
        const { data, error } = await query;
        if (error) throw error;
        setAlumnos(data || []);
      } catch (err) {
        console.error('Error cargando alumnos:', err);
      } finally {
        setLoadingA(false);
      }
    };
    fetchAlumnos();
  }, [ciclo.categoria]);

  // Cargar items del ciclo (solo una vez)
  useEffect(() => {
    if (!ciclo?.id) return;
    
    setLoadingItems(true);
    setErrorItems(null);
    initialLoadDone.current = false;
    
    getItemsConCategorias(ciclo.id)
      .then(items => {
        if (!items || items.length === 0) {
          setErrorItems('Este ciclo no tiene items configurados. Debes agregar items al crear el ciclo.');
          setItemsCiclo([]);
          return;
        }
        
        setItemsCiclo(items);
        // Inicializar valores por defecto (50 para cada item)
        const initial = {};
        items.forEach(item => {
          initial[item.id] = 50;
        });
        setValores(initial);
        initialLoadDone.current = true;
      })
      .catch(err => {
        console.error('Error al cargar items:', err);
        setErrorItems('Error al cargar los items: ' + (err.message || 'Error de conexión'));
      })
      .finally(() => setLoadingItems(false));
  }, [ciclo?.id, getItemsConCategorias]);

  // Buscar evaluación existente - separado y con dependencias controladas
  useEffect(() => {
    // No ejecutar hasta que los items estén cargados
    if (!alumno?.id || !ciclo?.id || loadingItems || errorItems || !initialLoadDone.current) return;
    
    fetchEvaluacionesAlumno(alumno.id)
      .then(evals => {
        const existente = evals.find(e => e.ciclo_id === ciclo.id && e.tipo === tipo);
        setEvalExistente(existente || null);
        
        if (existente && existente.items && existente.items.length > 0) {
          // Cargar valores existentes
          const loaded = {};
          existente.items.forEach(item => {
            loaded[item.ciclo_item_id] = item.calificacion;
          });
          setValores(loaded);
          setObservaciones(existente.observaciones || '');
          setMensajePersonalizado(existente.mensaje_personalizado || '');
        } else if (!existente && initialLoadDone.current) {
          // Resetear valores por defecto SOLO si no hay evaluación existente
          const reset = {};
          itemsCiclo.forEach(item => {
            reset[item.id] = 50;
          });
          setValores(reset);
          setObservaciones('');
          
          // Calcular mensaje automático
          const mensajeAuto = obtenerMensajePorPromedio(50);
          setMensajePersonalizado(mensajeAuto);
        }
      })
      .catch(err => {
        console.error('Error al buscar evaluaciones:', err);
      });
  }, [alumno?.id, tipo, ciclo?.id, loadingItems, errorItems, fetchEvaluacionesAlumno, obtenerMensajePorPromedio, itemsCiclo]);

  // Calcular promedio actual - optimizado
  const promedioActual = useMemo(() => {
    const calificaciones = Object.values(valores);
    if (calificaciones.length === 0) return 0;
    const suma = calificaciones.reduce((a, b) => a + b, 0);
    return Math.round(suma / calificaciones.length);
  }, [valores]);

  // Actualizar mensaje automático - solo cuando cambia el promedio y no hay evaluación existente
  useEffect(() => {
    if (!evalExistente && itemsCiclo.length > 0 && initialLoadDone.current) {
      const mensajeAuto = obtenerMensajePorPromedio(promedioActual);
      setMensajePersonalizado(mensajeAuto);
    }
  }, [promedioActual, obtenerMensajePorPromedio, evalExistente, itemsCiclo.length]);

  // Manejar cambio de slider - optimizado con useCallback
  const handleSliderChange = useCallback((itemId, event) => {
    const newValue = Number(event.target.value);
    setValores(prev => {
      if (prev[itemId] === newValue) return prev;
      return { ...prev, [itemId]: newValue };
    });
  }, []);

  const handleGuardar = async () => {
    if (!alumno) return;
    if (itemsCiclo.length === 0) {
      onGuardado('No hay items para evaluar en este ciclo.', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const itemsData = Object.entries(valores).map(([ciclo_item_id, calificacion]) => ({
        ciclo_item_id,
        calificacion
      }));

      await guardarEvaluacion({
        evaluacionData: {
          alumno_id: alumno.id,
          ciclo_id: ciclo.id,
          tipo,
          observaciones,
          mensaje_personalizado: mensajePersonalizado,
        },
        itemsData
      });
      
      onGuardado(`Evaluación ${tipo === 'INICIAL' ? 'Inicial' : 'Final'} guardada para ${alumno.primer_nombre} ${alumno.primer_apellido}.`);
      
      // Limpiar para evaluar otro alumno
      setAlumno(null);
      setEvalExistente(null);
    } catch (e) {
      console.error('Error guardando evaluación:', e);
      onGuardado('Error: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Datos para el gráfico radar
  const radarData = useMemo(() => {
    const data = [];
    Object.entries(itemsPorCategoria).forEach(([catNombre, catData]) => {
      const itemsEnCat = catData.items;
      const suma = itemsEnCat.reduce((acc, item) => acc + (valores[item.id] || 0), 0);
      const promedio = itemsEnCat.length > 0 ? Math.round(suma / itemsEnCat.length) : 0;
      data.push({
        subject: catNombre,
        A: promedio,
      });
    });
    return data;
  }, [itemsPorCategoria, valores]);

  // ── Paso 1: Seleccionar alumno ───────────────────────────────────────────────
  if (!alumno) {
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
              Evaluar en: <span className="text-primary">{ciclo.nombre}</span>
            </h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
              Selecciona el alumno a evaluar
            </p>
          </div>
        </div>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary text-sm">search</span>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="BUSCAR ALUMNO..."
            className="w-full bg-[#0a0f18]/80 border border-white/5 rounded-2xl py-4 pl-14 pr-6
                       text-sm text-white focus:border-primary/50 outline-none placeholder:text-slate-700
                       font-bold tracking-widest uppercase"
          />
        </div>

        {loadingAlumnos ? (
          <p className="text-center text-primary animate-pulse text-[10px] font-black uppercase tracking-widest py-10">
            Cargando alumnos...
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alumnos.filter(a => {
              const q = busqueda.toLowerCase();
              return `${a.primer_nombre} ${a.primer_apellido}`.toLowerCase().includes(q) ||
                     (a.numero_documento || '').includes(q);
            }).map(a => (
              <button key={a.id} onClick={() => setAlumno(a)}
                      className="flex items-center gap-3 p-4 bg-[#0a0f18]/60 border border-white/5
                                 rounded-2xl hover:border-primary/30 hover:bg-primary/5 transition-all text-left group">
                <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center
                                font-black text-primary text-sm border border-white/5 flex-shrink-0">
                  {a.foto_url
                    ? <img src={a.foto_url} className="w-full h-full object-cover" alt="" />
                    : `${a.primer_nombre?.[0] || ''}${a.primer_apellido?.[0] || ''}`}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white text-[10px] uppercase italic truncate group-hover:text-primary transition-colors">
                    {a.primer_nombre} {a.primer_apellido}
                  </p>
                  <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">{a.categoria}</p>
                </div>
                <span className="material-symbols-outlined text-slate-700 group-hover:text-primary transition-colors text-sm">
                  arrow_forward_ios
                </span>
              </button>
            ))}
            {alumnos.length === 0 && (
              <p className="col-span-full text-center text-slate-600 text-[10px] font-black uppercase tracking-widest py-10">
                No se encontraron alumnos en esta categoría
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Estado de carga de items
  if (loadingItems) {
    return (
      <div className="py-20 text-center text-primary animate-pulse font-black uppercase text-[10px] tracking-[0.5em]">
        Cargando items de evaluación...
      </div>
    );
  }

  // Estado de error de items
  if (errorItems) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-rose-400 mb-2">error</span>
        <p className="text-rose-400 text-[10px] font-black uppercase">{errorItems}</p>
        <button 
          onClick={onVolver}
          className="mt-4 text-primary text-[10px] underline hover:text-primary/80"
        >
          Volver al ciclo
        </button>
      </div>
    );
  }

  // Si no hay items después de cargar
  if (itemsCiclo.length === 0) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-amber-400 mb-2">info</span>
        <p className="text-amber-400 text-[10px] font-black uppercase">
          Este ciclo no tiene items configurados.
        </p>
        <p className="text-slate-400 text-[8px] mt-2">
          Debes editar el ciclo y agregar items para poder evaluar.
        </p>
        <button 
          onClick={onVolver}
          className="mt-4 text-primary text-[10px] underline hover:text-primary/80"
        >
          Volver al ciclo
        </button>
      </div>
    );
  }

  // ── Paso 2 y 3: Formulario de evaluación dinámico ────────────────────────────
  const categoriaActual = itemsPorCategoria[categoriaActiva];
  const itemsActuales = categoriaActual?.items || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => setAlumno(null)}
                className="flex items-center gap-2 text-[10px] font-black text-slate-500
                           hover:text-primary transition-all uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Cambiar alumno
        </button>
        <div className="flex items-center gap-3 bg-[#0a0f18]/60 border border-white/10 rounded-2xl p-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center
                          font-black text-primary text-sm border border-white/5 flex-shrink-0">
            {alumno.foto_url
              ? <img src={alumno.foto_url} className="w-full h-full object-cover" alt="" />
              : `${alumno.primer_nombre?.[0] || ''}${alumno.primer_apellido?.[0] || ''}`}
          </div>
          <div>
            <p className="font-black text-white text-[11px] uppercase italic">
              {alumno.primer_nombre} {alumno.primer_apellido}
            </p>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{alumno.categoria}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] text-slate-500">Promedio</p>
            <p className={`text-xl font-black italic ${promedioActual >= 75 ? 'text-emerald-400' : promedioActual >= 50 ? 'text-primary' : 'text-amber-400'}`}>
              {promedioActual}
            </p>
          </div>
          {evalExistente && (
            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full
                             bg-amber-500/15 text-amber-400 border border-amber-500/20">
              Editando existente
            </span>
          )}
        </div>
      </div>

      {/* Tipo INICIAL / FINAL */}
      <div className="flex gap-3">
        {['INICIAL', 'FINAL'].map(t => (
          <button key={t} onClick={() => setTipo(t)}
                  className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest
                               border transition-all flex items-center justify-center gap-2
                               ${tipo === t
                                 ? 'bg-primary border-primary text-[#05080d]'
                                 : 'bg-white/5 border-white/10 text-slate-400 hover:border-primary/30'}`}>
            <span className="material-symbols-outlined text-base">
              {t === 'INICIAL' ? 'flag' : 'emoji_events'}
            </span>
            Evaluación {t === 'INICIAL' ? 'Inicial' : 'Final'} de Ciclo
          </button>
        ))}
      </div>

      {/* Contenido: sliders + radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Sliders dinámicos por categoría */}
        <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2rem] p-6 space-y-5">

          {/* Tabs de categorías */}
          {categoriasList.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {categoriasList.map(cat => (
                <button key={cat} onClick={() => setCategoriaActiva(cat)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black
                                     uppercase tracking-widest border transition-all
                                     ${categoriaActiva === cat
                                       ? 'bg-white/10 border-white/20 text-white'
                                       : 'bg-transparent border-transparent text-slate-600 hover:text-slate-400'}`}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Sliders de la categoría activa */}
          <div className="space-y-5">
            {itemsActuales.map(item => {
              const valorActual = valores[item.id] !== undefined ? valores[item.id] : 50;
              return (
                <div key={item.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {item.nombre}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-black italic
                                        ${valorActual >= 75 ? 'text-emerald-400'
                                          : valorActual >= 50 ? 'text-primary'
                                          : 'text-amber-400'}`}>
                        {valorActual}
                      </span>
                      <span className="text-[8px] text-slate-600 font-bold">/100</span>
                    </div>
                  </div>
                  <input
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    value={valorActual}
                    onChange={(e) => handleSliderChange(item.id, e)}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-700 font-bold uppercase">
                    <button 
                      type="button"
                      onClick={() => handleSliderChange(item.id, { target: { value: 0 } })}
                      className="hover:text-primary transition-colors"
                    >
                      0
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleSliderChange(item.id, { target: { value: 25 } })}
                      className="hover:text-primary transition-colors"
                    >
                      25
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleSliderChange(item.id, { target: { value: 50 } })}
                      className="hover:text-primary transition-colors"
                    >
                      50
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleSliderChange(item.id, { target: { value: 75 } })}
                      className="hover:text-primary transition-colors"
                    >
                      75
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleSliderChange(item.id, { target: { value: 100 } })}
                      className="hover:text-primary transition-colors"
                    >
                      100
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Radar preview y mensaje personalizado */}
        <div className="space-y-6">
          <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2rem] p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 italic">
              Vista previa por categorías
            </p>
            <div style={{ height: '220px', minHeight: '220px' }}>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#ffffff10" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Evaluación" dataKey="A" stroke="#13ecec" fill="#13ecec" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-[10px]">
                  Sin datos para mostrar
                </div>
              )}
            </div>
          </div>

          {/* Observaciones */}
          <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2rem] p-6 space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Observaciones generales
            </label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Notas del entrenador sobre esta evaluación..."
              rows={2}
              className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-[11px]
                         text-white outline-none focus:border-primary transition-colors resize-none"
            />
            
            {/* Mensaje personalizado */}
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-2 block">
              Mensaje para el alumno (personalizable)
            </label>
            <textarea
              value={mensajePersonalizado}
              onChange={e => setMensajePersonalizado(e.target.value)}
              placeholder="Mensaje automático basado en el promedio..."
              rows={2}
              className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-[11px]
                         text-white outline-none focus:border-primary transition-colors resize-none"
            />
            <p className="text-[8px] text-slate-600 text-right">
              Promedio actual: {promedioActual} pts
            </p>
          </div>
        </div>
      </div>

      {/* Guardar */}
      <div className="flex gap-4 justify-end">
        <button onClick={onVolver}
                className="px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest
                           border border-white/10 text-slate-400 hover:border-white/20 transition-all">
          Cancelar
        </button>
        <button onClick={handleGuardar} disabled={saving}
                className="flex items-center gap-2 px-10 py-4 rounded-xl text-[10px] font-black uppercase
                           tracking-widest bg-primary text-[#05080d] hover:bg-[#0AB5B5] transition-all
                           disabled:opacity-50 shadow-[0_8px_24px_rgba(19,236,236,0.25)]">
          <span className="material-symbols-outlined text-sm">
            {saving ? 'hourglass_top' : 'save'}
          </span>
          {saving ? 'Guardando...' : evalExistente ? 'Actualizar Evaluación' : 'Guardar Evaluación'}
        </button>
      </div>
    </div>
  );
}