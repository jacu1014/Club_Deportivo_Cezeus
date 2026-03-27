// src/components/Avances/FormEvaluacion.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAvances } from '../../hooks/useAvances';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

export default function FormEvaluacion({ ciclo, alumnoInicial, currentUser, onVolver, onGuardado }) {
  const { 
    guardarEvaluacionCompleta, // Función para guardar en ambas tablas
    getItemsConCategorias,
    mensajesPersonalizados,
    fetchEvaluacionesAlumno 
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
  const [saving, setSaving] = useState(false);
  const [evalExistente, setEvalExistente] = useState(null);

  // 1. Cargar Alumnos activos
  useEffect(() => {
    async function fetchAlumnos() {
      const { data } = await supabase
        .from('usuarios')
        .select('id, primer_nombre, primer_apellido, categoria, foto_url')
        .eq('rol', 'ALUMNO')
        .eq('estado', 'ACTIVO')
        .order('primer_nombre');
      setAlumnos(data || []);
      setLoadingA(false);
    }
    fetchAlumnos();
  }, []);

  // 2. Cargar Items del Ciclo y datos previos si existen
  useEffect(() => {
    if (!ciclo?.id) return;

    const cargarDatos = async () => {
      // Cargar los ítems configurados para este ciclo
      const items = await getItemsConCategorias(ciclo.id);
      setItemsCiclo(items);

      // Si hay un alumno seleccionado, buscar si ya tiene evaluación de este tipo
      if (alumno) {
        const evals = await fetchEvaluacionesAlumno(alumno.id);
        const existente = evals.find(e => e.ciclo_id === ciclo.id && e.tipo === tipo);
        
        if (existente) {
          setEvalExistente(existente);
          setObservaciones(existente.observaciones || '');
          // Mapear las notas existentes al estado de valores
          const notasPrevias = {};
          existente.items?.forEach(it => {
            notasPrevias[it.item_id] = it.calificacion;
          });
          setValores(notasPrevias);
        } else {
          setEvalExistente(null);
          setObservaciones('');
          const initialValores = {};
          items.forEach(it => { initialValores[it.id] = 0; });
          setValores(initialValores);
        }
      }
    };

    cargarDatos();
  }, [ciclo, alumno, tipo]);

  // 3. Buscador de alumnos
  const alumnosFiltrados = useMemo(() => {
    if (!busqueda) return [];
    return alumnos.filter(a => 
      `${a.primer_nombre} ${a.primer_apellido}`.toLowerCase().includes(busqueda.toLowerCase())
    ).slice(0, 5);
  }, [busqueda, alumnos]);

  // 4. Radar y Promedios
  const datosRadar = useMemo(() => {
    return itemsCiclo.map(item => ({
      subject: item.nombre,
      A: valores[item.id] || 0,
      fullMark: 10
    }));
  }, [itemsCiclo, valores]);

  const promedioActual = useMemo(() => {
    const vals = Object.values(valores);
    if (vals.length === 0) return "0.0";
    const suma = vals.reduce((a, b) => a + b, 0);
    return (suma / vals.length).toFixed(1);
  }, [valores]);

  const handleGuardar = async () => {
    if (!alumno) return alert("Selecciona un alumno");
    if (!ciclo.activo) return alert("El ciclo está cerrado");
    
    setSaving(true);
    try {
      const payload = {
        alumno_id: alumno.id,
        ciclo_id: ciclo.id,
        tipo,
        observaciones,
        notas: valores // El hook se encarga de repartir esto en las dos tablas
      };

      await guardarEvaluacionCompleta(payload);
      alert(evalExistente ? "Evaluación actualizada" : "Evaluación guardada con éxito");
      if (onGuardado) onGuardado();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {!ciclo.activo && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3">
          <span className="material-symbols-outlined text-rose-500">lock</span>
          <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest">
            Ciclo Finalizado: Solo lectura.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0f18]/60 border border-white/5 p-6 rounded-[2.5rem] space-y-6">
            <h3 className="text-white font-black uppercase text-xs italic tracking-widest">Configuración</h3>
            
            <div className="relative">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 mb-1 block">Alumno</label>
              <input 
                type="text"
                placeholder="Buscar nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-primary/50 transition-all"
              />
              {alumnosFiltrados.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-[#0f172a] border border-white/10 rounded-xl mt-2 overflow-hidden z-50 shadow-2xl">
                  {alumnosFiltrados.map(a => (
                    <button key={a.id} onClick={() => { setAlumno(a); setBusqueda(''); }} className="w-full p-3 flex items-center gap-3 hover:bg-primary/10 text-left border-b border-white/5 last:border-0">
                      <span className="text-[10px] text-white font-bold uppercase">{a.primer_nombre} {a.primer_apellido}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 mb-2 block">Momento</label>
              <div className="grid grid-cols-2 gap-2">
                {['INICIAL', 'FINAL'].map(t => (
                  <button key={t} onClick={() => setTipo(t)} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${tipo === t ? 'bg-primary text-black' : 'bg-white/5 text-slate-500'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            {evalExistente && (
              <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl">
                <p className="text-primary text-[9px] font-black uppercase text-center">
                  Ya existe una evaluación. Al guardar se actualizará.
                </p>
              </div>
            )}
          </div>

          <div className="h-[300px] bg-black/20 rounded-[2.5rem] border border-white/5 p-4">
             <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={datosRadar}>
                  <PolarGrid stroke="#ffffff05" />
                  <PolarAngleAxis dataKey="subject" tick={{fill: '#475569', fontSize: 8}} />
                  <Radar name="Nota" dataKey="A" stroke="#13ecec" fill="#13ecec" fillOpacity={0.4} />
                </RadarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#0a0f18]/60 border border-white/5 p-8 rounded-[3rem]">
            <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
              <div>
                <h2 className="text-white font-black uppercase italic text-xl">Calificaciones</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase">{alumno ? `${alumno.primer_nombre} - ${ciclo.nombre}` : 'Seleccione un alumno'}</p>
              </div>
              <div className="text-right">
                <span className="text-primary text-3xl font-black italic">{promedioActual}</span>
                <p className="text-slate-600 text-[9px] font-black uppercase">Promedio</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {itemsCiclo.map(item => (
                <div key={item.id} className="space-y-3 group">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-black uppercase text-[10px] tracking-widest">{item.nombre}</span>
                    <span className="text-primary font-black text-xs">{valores[item.id] || 0}</span>
                  </div>
                  <input 
                    type="range" min="0" max="10" step="0.5"
                    value={valores[item.id] || 0}
                    onChange={(e) => setValores({...valores, [item.id]: parseFloat(e.target.value)})}
                    className="w-full accent-primary h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="mt-12 space-y-4">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 block">Análisis Técnico</label>
              <textarea 
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-primary/50 transition-all resize-none"
                placeholder="Análisis detallado..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button onClick={onVolver} className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all">
              Cancelar
            </button>
            <button 
              onClick={handleGuardar} 
              disabled={saving || !ciclo.activo || !alumno}
              className="px-12 py-4 rounded-2xl bg-primary text-black font-black uppercase text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-30 transition-all"
            >
              {saving ? 'Guardando...' : evalExistente ? 'Actualizar Evaluación' : 'Finalizar Evaluación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}