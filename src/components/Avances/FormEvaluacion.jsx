// src/components/Avances/FormEvaluacion.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAvances } from '../../hooks/useAvances';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

export default function FormEvaluacion({ ciclo, alumnoInicial, currentUser, onVolver, onGuardado }) {
  const { 
    guardarEvaluacionCompleta, 
    getItemsConCategorias, 
    fetchEvaluacionesAlumno 
  } = useAvances(currentUser);

  // --- Validación de Roles Autorizados ---
  const rolesAutorizados = ['ENTRENADOR', 'ADMINISTRATIVO', 'DIRECTOR', 'SUPER_ADMIN'];
  const tienePermiso = rolesAutorizados.includes(currentUser?.rol);
  const puedeEditar = tienePermiso && ciclo?.activo;

  // Estados
  const [alumnos, setAlumnos] = useState([]);
  const [evaluacionesRealizadas, setEvaluacionesRealizadas] = useState([]);
  const [loadingAlumnos, setLoadingA] = useState(true);
  const [alumno, setAlumno] = useState(alumnoInicial || null);
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('INICIAL');
  const [itemsCiclo, setItemsCiclo] = useState([]);
  const [valores, setValores] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);
  const [evalExistente, setEvalExistente] = useState(null);
  const [showResumen, setShowResumen] = useState(false);

  // 1. Cargar Alumnos y sus estados de evaluación (Resumen de Grupo)
  const refrescarEstadoGrupo = async () => {
    setLoadingA(true);
    try {
      // Cargamos todos los alumnos activos — ciclos_evaluacion no guarda categorias_objetivo
      const { data: listaAlumnos } = await supabase
        .from('usuarios')
        .select('id, primer_nombre, primer_apellido, categoria, foto_url')
        .eq('rol', 'ALUMNO')
        .eq('estado', 'ACTIVO')
        .order('primer_nombre');
      setAlumnos(listaAlumnos || []);

      // Tabla correcta: evaluaciones_avance (no 'evaluaciones')
      const { data: evals } = await supabase
        .from('evaluaciones_avance')
        .select('alumno_id')
        .eq('ciclo_id', ciclo.id)
        .eq('tipo', tipo);
      
      setEvaluacionesRealizadas(evals?.map(e => e.alumno_id) || []);
    } catch (err) {
      console.error("Error cargando grupo:", err);
    } finally {
      setLoadingA(false);
    }
  };

  useEffect(() => {
    refrescarEstadoGrupo();
  }, [ciclo, tipo]);

  // 2. Cargar Items del ciclo y datos previos del alumno seleccionado
  useEffect(() => {
    if (!ciclo?.id) return;

    const cargarDatos = async () => {
      const items = await getItemsConCategorias(ciclo.id);
      setItemsCiclo(items);

      if (alumno) {
        const evals = await fetchEvaluacionesAlumno(alumno.id);
        const existente = evals.find(e => e.ciclo_id === ciclo.id && e.tipo === tipo);
        
        if (existente) {
          setEvalExistente(existente);
          setObservaciones(existente.observaciones || '');
          const notasPrevias = {};
          existente.items_evaluados?.forEach(it => {
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

  // Memorias para UI
  const indexActual = useMemo(() => alumnos.findIndex(a => a.id === alumno?.id), [alumnos, alumno]);
  const completados = evaluacionesRealizadas.length;

  const alumnosFiltradosBusqueda = useMemo(() => {
    if (!busqueda.trim()) return [];
    return alumnos.filter(a => 
      `${a.primer_nombre} ${a.primer_apellido}`.toLowerCase().includes(busqueda.toLowerCase())
    ).slice(0, 5);
  }, [busqueda, alumnos]);

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

  // Manejo de Guardado
  const handleGuardar = async () => {
    if (!tienePermiso || !alumno || !ciclo.activo) return;
    
    setSaving(true);
    try {
      await guardarEvaluacionCompleta({
        alumno_id: alumno.id,
        ciclo_id: ciclo.id,
        tipo,
        observaciones,
        notas: valores 
      });

      // Actualizar progreso local
      if (!evaluacionesRealizadas.includes(alumno.id)) {
        setEvaluacionesRealizadas([...evaluacionesRealizadas, alumno.id]);
      }

      const siguienteAlumno = alumnos[indexActual + 1];
      if (siguienteAlumno) {
        setAlumno(siguienteAlumno);
        setBusqueda('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert("¡Felicidades! Has completado las evaluaciones de este grupo.");
        if (onGuardado) onGuardado();
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Header de Progreso y Acceso a Resumen */}
      <div className="bg-[#0a0f18]/80 border border-white/5 p-4 rounded-[2rem] flex flex-wrap gap-4 items-center justify-between px-8 backdrop-blur-md sticky top-4 z-40">
           <div className="flex items-center gap-6">
              <div>
                <p className="text-primary text-[8px] font-black uppercase tracking-[0.2em]">Progreso del Grupo</p>
                <p className="text-white text-xs font-bold">{completados} / {alumnos.length} Evaluados</p>
              </div>
              <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                <div 
                  className="h-full bg-primary transition-all duration-700 shadow-[0_0_10px_#13ecec]" 
                  style={{ width: `${(completados / alumnos.length) * 100}%` }}
                />
              </div>
           </div>

           <button 
             onClick={() => setShowResumen(true)}
             className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase transition-all"
           >
             <span className="material-symbols-outlined text-sm">group</span>
             Resumen de Grupo
           </button>
      </div>

      {/* 2. Modal de Resumen */}
      {showResumen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-2xl rounded-[3rem] p-8 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-black italic uppercase tracking-tighter text-xl">Estado de Evaluación</h3>
              <button onClick={() => setShowResumen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="overflow-y-auto pr-2 space-y-2">
              {alumnos.map((a) => {
                const isDone = evaluacionesRealizadas.includes(a.id);
                return (
                  <div key={a.id} onClick={() => { setAlumno(a); setShowResumen(false); }} className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${alumno?.id === a.id ? 'bg-primary/20 border border-primary/30' : 'bg-white/5 border border-transparent hover:border-white/10'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isDone ? 'bg-green-500 shadow-[0_0_8px_green]' : 'bg-slate-700'}`} />
                      <span className="text-white text-[11px] font-bold uppercase">{a.primer_nombre} {a.primer_apellido}</span>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${isDone ? 'text-green-500 bg-green-500/10' : 'text-slate-500'}`}>
                      {isDone ? 'Completado' : 'Pendiente'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Layout Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Perfil y Radar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0f18]/60 border border-white/5 p-6 rounded-[2.5rem] space-y-6">
            <div className="relative">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 mb-1 block">Buscar Alumno</label>
              <input 
                type="text" placeholder="Nombre del alumno..." value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-primary/50 transition-all"
              />
              {busqueda && alumnosFiltradosBusqueda.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-[#0f172a] border border-white/10 rounded-xl mt-2 overflow-hidden z-50 shadow-2xl">
                  {alumnosFiltradosBusqueda.map(a => (
                    <button key={a.id} onClick={() => { setAlumno(a); setBusqueda(''); }} className="w-full p-3 flex items-center gap-3 hover:bg-primary/10 text-left border-b border-white/5 last:border-0">
                       <span className="text-[10px] text-white font-bold uppercase">{a.primer_nombre} {a.primer_apellido}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {alumno && (
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black overflow-hidden">
                  {alumno.foto_url ? <img src={alumno.foto_url} alt="" className="w-full h-full object-cover" /> : alumno.primer_nombre[0]}
                </div>
                <div>
                  <p className="text-white font-black uppercase text-[10px]">{alumno.primer_nombre} {alumno.primer_apellido}</p>
                  <p className="text-primary text-[9px] font-bold uppercase tracking-tighter">{alumno.categoria}</p>
                </div>
              </div>
            )}

            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 mb-2 block">Momento del Ciclo</label>
              <div className="grid grid-cols-2 gap-2">
                {['INICIAL', 'FINAL'].map(t => (
                  <button 
                    key={t} type="button" onClick={() => setTipo(t)} 
                    className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${tipo === t ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-500'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[320px] bg-black/20 rounded-[2.5rem] border border-white/5 p-4 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <RadarChart data={datosRadar}>
                 <PolarGrid stroke="#ffffff10" />
                 <PolarAngleAxis dataKey="subject" tick={{fill: '#475569', fontSize: 7, fontWeight: 'bold'}} />
                 <Radar name="Nota" dataKey="A" stroke="#13ecec" fill="#13ecec" fillOpacity={0.4} />
               </RadarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Notas */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#0a0f18]/60 border border-white/5 p-8 rounded-[3rem]">
            <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
              <div>
                <h2 className="text-white font-black uppercase italic text-xl tracking-tighter">Calificaciones</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  {alumno ? `Editando ficha de ${alumno.primer_nombre}` : 'Esperando selección de alumno'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-primary text-4xl font-black italic leading-none">{promedioActual}</span>
                <p className="text-slate-600 text-[9px] font-black uppercase mt-1">Promedio</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {itemsCiclo.map(item => (
                <div key={item.id} className="space-y-3 group">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-black uppercase text-[10px] tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">
                      {item.nombre}
                    </span>
                    <span className="text-primary font-black text-sm bg-primary/10 px-2 py-0.5 rounded-md min-w-[30px] text-center">
                      {valores[item.id] || 0}
                    </span>
                  </div>
                  <input 
                    type="range" min="0" max="10" step="0.5"
                    disabled={!puedeEditar || !alumno}
                    value={valores[item.id] || 0}
                    onChange={(e) => setValores({...valores, [item.id]: parseFloat(e.target.value)})}
                    className="w-full accent-primary h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="mt-12 space-y-4">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 block">Observaciones del Entrenador</label>
              <textarea 
                value={observaciones}
                disabled={!puedeEditar || !alumno}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-primary/50 transition-all resize-none"
                placeholder="Describe el avance técnico o físico..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button onClick={onVolver} className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all">
              Volver
            </button>
            <button 
              onClick={handleGuardar} 
              disabled={saving || !puedeEditar || !alumno || itemsCiclo.length === 0}
              className="px-12 py-4 rounded-2xl bg-primary text-black font-black uppercase text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.02] disabled:opacity-20 transition-all"
            >
              {saving ? 'Guardando...' : (
                <div className="flex items-center gap-2">
                  <span>{evalExistente ? 'Actualizar' : 'Guardar y Continuar'}</span>
                  <span className="opacity-50 text-[8px] border-l border-black/20 pl-2">SIGUIENTE →</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}