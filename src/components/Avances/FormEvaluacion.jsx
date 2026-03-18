// src/components/Avances/FormEvaluacion.jsx
// Formulario de evaluación de un alumno en un ciclo.
// Paso 1: seleccionar alumno (si no viene precargado)
// Paso 2: seleccionar tipo INICIO | FINAL
// Paso 3: ajustar sliders por habilidad
// Paso 4: guardar

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAvances, DIMENSIONES, EVAL_INICIAL, evaluacionARadar } from '../../hooks/useAvances';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PolarRadiusAxis } from 'recharts';

const ROLES_EVAL = ['SUPER_ADMIN', 'ADMINISTRATIVO', 'DIRECTOR', 'ENTRENADOR'];

export default function FormEvaluacion({ ciclo, alumnoInicial, currentUser, onVolver, onGuardado }) {
  const { guardarEvaluacion, fetchEvaluacionesAlumno } = useAvances(currentUser);

  const [alumnos, setAlumnos]             = useState([]);
  const [loadingAlumnos, setLoadingA]     = useState(true);
  const [alumno, setAlumno]               = useState(alumnoInicial || null);
  const [busqueda, setBusqueda]           = useState('');
  const [tipo, setTipo]                   = useState('INICIO');
  const [valores, setValores]             = useState({ ...EVAL_INICIAL });
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving]               = useState(false);
  const [evalExistente, setEvalExistente] = useState(null);
  const [activaDim, setActivaDim]         = useState('tecnica');

  // Cargar alumnos filtrados por categoría del ciclo
  useEffect(() => {
    const fetchAlumnos = async () => {
      setLoadingA(true);
      let query = supabase
        .from('usuarios')
        .select('id, primer_nombre, primer_apellido, categoria, foto_url, numero_documento')
        .eq('rol', 'ALUMNO')
        .ilike('estado', 'activo')  // FIX: case-insensitive — BD guarda 'Activo'
        .order('primer_apellido');

      if (ciclo.categoria !== 'TODAS') {
        query = query.ilike('categoria', `%${ciclo.categoria}%`);
      }
      const { data } = await query;
      setAlumnos(data || []);
      setLoadingA(false);
    };
    fetchAlumnos();
  }, [ciclo.categoria]);

  // Cuando se selecciona alumno, buscar evaluación existente
  useEffect(() => {
    if (!alumno?.id) return;
    fetchEvaluacionesAlumno(alumno.id).then(evals => {
      const existente = evals.find(e => e.ciclo_id === ciclo.id && e.tipo === tipo);
      setEvalExistente(existente || null);
      if (existente) {
        // Pre-cargar valores existentes para edición
        const loaded = {};
        DIMENSIONES.flatMap(d => d.campos).forEach(c => {
          loaded[c.key] = existente[c.key] ?? 50;
        });
        setValores(loaded);
        setObservaciones(existente.observaciones || '');
      } else {
        setValores({ ...EVAL_INICIAL });
        setObservaciones('');
      }
    }).catch(console.error);
  }, [alumno?.id, tipo, ciclo.id, fetchEvaluacionesAlumno]);

  const alumnosFiltrados = useMemo(() =>
    alumnos.filter(a => {
      const q = busqueda.toLowerCase();
      return `${a.primer_nombre} ${a.primer_apellido}`.toLowerCase().includes(q) ||
             (a.numero_documento || '').includes(q);
    }), [alumnos, busqueda]);

  const radarData = useMemo(() => evaluacionARadar(valores) || [], [valores]);

  const handleSlider = (key, val) => setValores(prev => ({ ...prev, [key]: Number(val) }));

  const handleGuardar = async () => {
    if (!alumno) return;
    setSaving(true);
    try {
      await guardarEvaluacion({
        alumno_id:    alumno.id,
        ciclo_id:     ciclo.id,
        tipo,
        ...valores,
        observaciones,
      });
      onGuardado(`Evaluación ${tipo} guardada para ${alumno.primer_nombre} ${alumno.primer_apellido}.`);
      // Limpiar para evaluar otro alumno
      setAlumno(null);
      setValores({ ...EVAL_INICIAL });
      setObservaciones('');
      setEvalExistente(null);
    } catch (e) {
      onGuardado('Error: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

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
            {alumnosFiltrados.map(a => (
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
            {alumnosFiltrados.length === 0 && (
              <p className="col-span-full text-center text-slate-600 text-[10px] font-black uppercase tracking-widest py-10">
                No se encontraron alumnos
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Paso 2 y 3: Formulario de evaluación ─────────────────────────────────────
  const dimActiva = DIMENSIONES.find(d => d.key === activaDim);

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
          {evalExistente && (
            <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full
                             bg-amber-500/15 text-amber-400 border border-amber-500/20">
              Editando existente
            </span>
          )}
        </div>
      </div>

      {/* Tipo INICIO / FINAL */}
      <div className="flex gap-3">
        {['INICIO', 'FINAL'].map(t => (
          <button key={t} onClick={() => setTipo(t)}
                  className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest
                               border transition-all flex items-center justify-center gap-2
                               ${tipo === t
                                 ? 'bg-primary border-primary text-[#05080d]'
                                 : 'bg-white/5 border-white/10 text-slate-400 hover:border-primary/30'}`}>
            <span className="material-symbols-outlined text-base">
              {t === 'INICIO' ? 'flag' : 'emoji_events'}
            </span>
            Evaluación de {t === 'INICIO' ? 'Inicio' : 'Fin'} de Ciclo
          </button>
        ))}
      </div>

      {/* Contenido: sliders + radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Sliders */}
        <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2rem] p-6 space-y-5">

          {/* Tabs de dimensión */}
          <div className="flex flex-wrap gap-2">
            {DIMENSIONES.map(d => (
              <button key={d.key} onClick={() => setActivaDim(d.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black
                                   uppercase tracking-widest border transition-all
                                   ${activaDim === d.key
                                     ? 'bg-white/10 border-white/20 text-white'
                                     : 'bg-transparent border-transparent text-slate-600 hover:text-slate-400'}`}>
                <span className={`material-symbols-outlined text-sm ${d.color}`}>{d.icon}</span>
                {d.label}
              </button>
            ))}
          </div>

          {/* Sliders de la dimensión activa */}
          <div className="space-y-5">
            {dimActiva?.campos.map(campo => (
              <div key={campo.key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {campo.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-black italic
                                      ${valores[campo.key] >= 75 ? 'text-emerald-400'
                                        : valores[campo.key] >= 50 ? 'text-primary'
                                        : 'text-amber-400'}`}>
                      {valores[campo.key]}
                    </span>
                    <span className="text-[8px] text-slate-600 font-bold">/100</span>
                  </div>
                </div>
                <input
                  type="range" min="0" max="100" step="5"
                  value={valores[campo.key]}
                  onChange={e => handleSlider(campo.key, e.target.value)}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-700 font-bold uppercase">
                  <span>Bajo</span><span>Medio</span><span>Alto</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar preview */}
        <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2rem] p-6 flex flex-col">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 italic">
            Vista previa del radar
          </p>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#ffffff10" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Habilidades" dataKey="A" stroke="#13ecec" fill="#13ecec" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Observaciones */}
          <div className="mt-4 space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Observaciones generales
            </label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Notas del entrenador sobre esta evaluación..."
              rows={3}
              className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-[11px]
                         text-white outline-none focus:border-primary transition-colors resize-none"
            />
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