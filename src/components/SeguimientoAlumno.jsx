// src/components/SeguimientoAlumno.jsx
// VERSIÓN DINÁMICA - Con radar basado en items personalizados

import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAvances } from '../hooks/useAvances';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, PolarRadiusAxis, Legend
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
  const { fetchEvaluacionesAlumno, canEvaluar, getItemsConCategorias } = useAvances(currentUser);

  const [escribiendo, setEscribiendo]   = useState(false);
  const [editandoId, setEditandoId]     = useState(null);
  const [notaTexto, setNotaTexto]       = useState('');
  const [categoriaNota, setCategoriaNota] = useState('Técnica');

  const [alumnos, setAlumnos]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [busqueda, setBusqueda]         = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');
  const [filtroEstado, setFiltroEstado] = useState('ACTIVOS');

  // Evaluaciones del alumno seleccionado
  const [evaluaciones, setEvals]        = useState([]);
  const [loadingEvals, setLoadingEvals] = useState(false);
  const [errorEvals, setErrorEvals]     = useState(null);
  const [itemsPorCiclo, setItemsPorCiclo] = useState({});

  const canManage = ['SUPER_ADMIN', 'ADMINISTRATIVO', 'ENTRENADOR', 'DIRECTOR'].includes(currentUser?.rol);

  useEffect(() => {
    fetchAlumnosSeguimiento();
  }, []);

  useEffect(() => {
    if (!alumno?.id) return;
    setLoadingEvals(true);
    setErrorEvals(null);
    fetchEvaluacionesAlumno(alumno.id)
      .then(async (evals) => {
        setEvals(evals);
        
        // Cargar items de los ciclos de las evaluaciones
        const ciclosIds = [...new Set(evals.map(e => e.ciclo_id))];
        const itemsMap = {};
        for (const cicloId of ciclosIds) {
          try {
            const items = await getItemsConCategorias(cicloId);
            itemsMap[cicloId] = items || [];
          } catch (err) {
            console.error('Error cargando items para ciclo', cicloId, err);
            itemsMap[cicloId] = [];
          }
        }
        setItemsPorCiclo(itemsMap);
      })
      .catch(err => {
        console.error('Error fetching evaluaciones:', err);
        setErrorEvals('Error al cargar las evaluaciones');
      })
      .finally(() => setLoadingEvals(false));
  }, [alumno?.id, fetchEvaluacionesAlumno, getItemsConCategorias]);

  const fetchAlumnosSeguimiento = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, rol, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, foto_url, categoria, estado, fecha_nacimiento, fecha_inscripcion, numero_documento, email, telefono, eps, grupo_sanguineo, factor_rh')
        .eq('rol', 'ALUMNO')
        .order('primer_apellido');
      if (error) throw error;
      setAlumnos(data || []);
    } catch (err) {
      console.error('Error cargando usuarios:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const normalizar = (texto) =>
    (texto || '').toString().toUpperCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const filtrados = useMemo(() => {
    return alumnos.filter(a => {
      const nombreCompleto = `${a.primer_nombre} ${a.segundo_nombre || ''} ${a.primer_apellido} ${a.segundo_apellido || ''}`.toLowerCase();
      const matchBusqueda  = nombreCompleto.includes(busqueda.toLowerCase()) || (a.numero_documento || '').includes(busqueda);
      const catAlumno      = normalizar(a.categoria);
      const catFiltro      = normalizar(filtroCategoria);
      const matchCategoria = filtroCategoria === 'TODOS' || catAlumno.includes(catFiltro);
      const matchEstado    = (a.estado || 'Activo').toLowerCase() === (filtroEstado === 'ACTIVOS' ? 'activo' : 'inactivo');
      return matchBusqueda && matchCategoria && matchEstado;
    });
  }, [alumnos, busqueda, filtroCategoria, filtroEstado]);

  const countCat = (catLabel) => {
    if (catLabel === 'TODOS') return alumnos.length;
    const criterioNorm = normalizar(catLabel);
    return alumnos.filter(a => normalizar(a.categoria).includes(criterioNorm)).length;
  };
  const countEst = (est) => alumnos.filter(a => (a.estado || 'Activo').toLowerCase() === est.toLowerCase()).length;

  // Calcular promedios por categoría para una evaluación
  const calcularPromediosPorCategoria = (evaluacion, itemsDelCiclo) => {
    if (!evaluacion || !evaluacion.items || evaluacion.items.length === 0) return {};
    
    const promedios = {};
    const itemsPorCat = {};
    
    evaluacion.items.forEach(itemEval => {
      const catNombre = itemEval.item?.categoria?.nombre || 'Sin categoría';
      if (!itemsPorCat[catNombre]) {
        itemsPorCat[catNombre] = { suma: 0, count: 0 };
      }
      itemsPorCat[catNombre].suma += itemEval.calificacion;
      itemsPorCat[catNombre].count++;
    });
    
    Object.entries(itemsPorCat).forEach(([cat, data]) => {
      promedios[cat] = Math.round(data.suma / data.count);
    });
    
    return promedios;
  };

  // Preparar datos para el radar
  const radarData = useMemo(() => {
    if (!evaluaciones.length) return [];

    // Buscar el ciclo más reciente con evaluación FINAL, o el más reciente en general
    const evaluacionesConItems = evaluaciones.filter(e => e.items && e.items.length > 0);
    if (evaluacionesConItems.length === 0) return [];

    // Ordenar por fecha y tomar la más reciente
    const evaluacionesOrdenadas = [...evaluacionesConItems].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    const ultimaEval = evaluacionesOrdenadas[0];
    
    const itemsDelCiclo = itemsPorCiclo[ultimaEval.ciclo_id] || [];
    
    // Si no hay items en el ciclo, no podemos mostrar el radar
    if (itemsDelCiclo.length === 0) return [];
    
    // Obtener categorías únicas de este ciclo
    const categorias = [...new Set(itemsDelCiclo.map(i => i.categoria?.nombre).filter(Boolean))];
    
    // Si no hay categorías, no mostrar radar
    if (categorias.length === 0) return [];
    
    // Buscar evaluación del mismo ciclo pero de tipo INICIAL para comparar
    const evalInicioDelMismoCiclo = evaluaciones.find(
      e => e.ciclo_id === ultimaEval.ciclo_id && e.tipo === 'INICIAL' && e.items?.length
    );
    
    // Calcular promedios por categoría
    const promediosFinal = calcularPromediosPorCategoria(ultimaEval, itemsDelCiclo);
    const promediosInicio = evalInicioDelMismoCiclo 
      ? calcularPromediosPorCategoria(evalInicioDelMismoCiclo, itemsDelCiclo)
      : {};
    
    // Construir datos para el radar
    const data = categorias.map(cat => ({
      subject: cat,
      Inicio: promediosInicio[cat] || 0,
      Final: promediosFinal[cat] || 0,
    }));
    
    return data;
  }, [evaluaciones, itemsPorCiclo]);

  const tieneComparacion = radarData.length > 0 && radarData[0]?.Inicio !== undefined && radarData[0]?.Final !== undefined;
  const tieneSoloFinal = radarData.length > 0 && !tieneComparacion;

  // Obtener información del ciclo más reciente
  const cicloInfo = useMemo(() => {
    if (!evaluaciones.length) return null;
    const evaluacionesOrdenadas = [...evaluaciones].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    return evaluacionesOrdenadas[0]?.ciclo;
  }, [evaluaciones]);

  // Si hay error en evaluaciones, mostrar mensaje
  if (errorEvals) {
    return (
      <div className="max-w-[1400px] mx-auto p-4">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-rose-400 mb-2">error</span>
          <p className="text-rose-400 text-[10px] font-black uppercase">{errorEvals}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 text-primary text-[10px] underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (loading && !alumno) {
    return (
      <div className="p-20 text-center animate-pulse">
        <p className="text-primary font-black uppercase tracking-[0.5em] italic">Sincronizando base de datos...</p>
      </div>
    );
  }

  // ── LISTA DE ALUMNOS ─────────────────────────────────────────────────────────
  if (!alumno && canManage) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 px-4">
        <div className="text-center space-y-2">
          <h2 className="text-white font-black text-2xl uppercase italic tracking-tighter">
            Panel de <span className="text-primary">Seguimiento</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
            Expedientes y bitácoras del club
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-primary">search</span>
            <input
              type="text" placeholder="BUSCAR POR NOMBRE O DOCUMENTO..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="w-full bg-[#0a0f18]/80 border border-white/5 rounded-2xl py-5 pl-16 pr-6
                         text-sm text-white focus:border-primary/50 outline-none placeholder:text-slate-700
                         font-bold tracking-widest uppercase italic"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {['TODOS', 'Iniciación', 'Infantil', 'Transición'].map(cat => (
              <button key={cat} onClick={() => setFiltroCategoria(cat)}
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-3 border
                        ${filtroCategoria === cat ? 'bg-primary border-primary text-black' : 'bg-[#0a0f18]/40 border-white/5 text-slate-500 hover:border-white/20'}`}>
                {cat}
                <span className={`px-2 py-0.5 rounded-md text-[8px] ${filtroCategoria === cat ? 'bg-black/20 text-black' : 'bg-white/5 text-slate-600'}`}>
                  {countCat(cat)}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { id: 'ACTIVOS',   label: 'ACTIVOS',   color: 'text-emerald-500', bg: 'border-emerald-500/20' },
              { id: 'INACTIVOS', label: 'INACTIVOS', color: 'text-rose-500',    bg: 'border-rose-500/20' }
            ].map(est => (
              <button key={est.id} onClick={() => setFiltroEstado(est.id)}
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-4 border
                        ${filtroEstado === est.id ? `${est.bg} bg-white/5 ${est.color}` : 'bg-transparent border-transparent text-slate-600 hover:text-slate-400'}`}>
                {est.label}
                <span className="font-bold">{countEst(est.id === 'ACTIVOS' ? 'ACTIVO' : 'INACTIVO')}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.length > 0 ? filtrados.map(a => (
            <button key={a.id} onClick={() => onSelectAlumno?.(a)}
                    className="flex items-center gap-4 p-5 bg-[#0a0f18]/60 border border-white/5 rounded-[2rem]
                               hover:bg-primary/5 hover:border-primary/30 transition-all group text-left">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-black text-primary border border-white/5 overflow-hidden">
                {a.foto_url
                  ? <img src={a.foto_url} className="w-full h-full object-cover" alt="" />
                  : <span>{a.primer_nombre?.[0] || '?'}{a.primer_apellido?.[0] || ''}</span>}
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="text-white font-black text-xs uppercase group-hover:text-primary transition-colors italic truncate">
                  {a.primer_nombre} {a.primer_apellido}
                </h4>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{a.numero_documento}</p>
                <p className="text-[7px] text-primary/60 font-black uppercase mt-1">{a.categoria || 'S/C'}</p>
              </div>
              <span className="material-symbols-outlined text-slate-800 group-hover:text-primary transition-colors text-sm">
                arrow_forward_ios
              </span>
            </button>
          )) : (
            <div className="col-span-full py-20 text-center opacity-40 italic uppercase text-xs tracking-widest text-white">
              No se encontraron alumnos
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!alumno) return null;

  const handleGuardarNota = () => {
    if (!notaTexto.trim()) return;
    if (editandoId) {
      onEditarNota?.(editandoId, notaTexto, categoriaNota);
      setEditandoId(null);
    } else {
      onAgregarNota?.({ usuario_id: alumno.id, nota: notaTexto, categoria_nota: categoriaNota });
    }
    setNotaTexto('');
    setEscribiendo(false);
  };

  // ── DETALLE DEL ALUMNO ───────────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4">

      {canManage && (
        <button onClick={() => onSelectAlumno?.(null)}
                className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-primary transition-all uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Regresar al listado
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Card perfil */}
        <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className={`h-24 bg-gradient-to-b ${alumno.estado?.toLowerCase() === 'activo' ? 'from-emerald-500/10' : 'from-rose-500/10'} to-transparent`} />
          <div className="px-8 pb-8">
            <div className="relative -mt-12 mb-6 flex justify-center lg:justify-start">
              <img
                src={alumno.foto_url || 'https://via.placeholder.com/150'}
                className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-[#0a0f18] shadow-2xl"
                alt="Perfil"
              />
              <div className={`absolute -bottom-2 lg:left-24 px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-lg
                               ${alumno.estado?.toLowerCase() === 'activo' ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'}`}>
                {alumno.estado || 'ACTIVO'}
              </div>
            </div>
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-black text-white uppercase italic leading-none mb-1">
                {alumno.primer_nombre} <span className="text-primary">{alumno.primer_apellido}</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-8">
                {alumno.categoria} • ID: {alumno.numero_documento}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MiniCard label="RH / SANGRE"      val={`${alumno.grupo_sanguineo || 'S'}${alumno.factor_rh || 'N'}`} icon="bloodtype" />
                <MiniCard label="EPS / ASEGURADORA" val={alumno.eps || 'NO REGISTRA'}                                  icon="health_and_safety" />
              </div>
            </div>
          </div>
        </div>

        {/* Radar */}
        <div className="bg-[#0a0f18]/60 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic opacity-60">
              Análisis de Desempeño
            </h3>
            {cicloInfo && (
              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full
                               bg-primary/10 text-primary border border-primary/20">
                {cicloInfo.nombre}
              </span>
            )}
          </div>

          {loadingEvals ? (
            <div className="flex-1 flex items-center justify-center text-primary animate-pulse text-[10px] font-black uppercase tracking-widest">
              Cargando evaluaciones...
            </div>
          ) : radarData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-40">
              <span className="material-symbols-outlined text-5xl text-slate-600">analytics</span>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Sin evaluaciones aún
              </p>
              <p className="text-[8px] text-slate-600 text-center">
                El alumno no tiene evaluaciones o el ciclo no tiene items configurados
              </p>
            </div>
          ) : (
            <div className="flex-1" style={{ minHeight: '260px', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#ffffff10" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  {tieneComparacion && (
                    <>
                      <Radar name="Inicio" dataKey="Inicio" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
                      <Radar name="Final"  dataKey="Final"  stroke="#13ecec" fill="#13ecec" fillOpacity={0.4} />
                      <Legend 
                        iconType="line" 
                        wrapperStyle={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}
                        formatter={(value) => <span className="text-slate-400">{value}</span>}
                      />
                    </>
                  )}
                  {tieneSoloFinal && (
                    <Radar name="Evaluación" dataKey="Final" stroke="#13ecec" fill="#13ecec" fillOpacity={0.4} />
                  )}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Bitácora - sin cambios */}
      <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">history_edu</span>
            <span className="font-black text-[11px] text-white uppercase tracking-widest">Bitácora de Seguimiento</span>
          </div>
          {canManage && !escribiendo && (
            <button onClick={() => { setEditandoId(null); setEscribiendo(true); setNotaTexto(''); }}
                    className="bg-primary text-[#0a1118] text-[9px] font-black px-5 py-2 rounded-xl uppercase transition-all">
              Nueva Nota
            </button>
          )}
        </div>

        {escribiendo && (
          <div className="p-8 bg-primary/5 border-b border-white/10 space-y-5">
            <div className="flex flex-wrap gap-2">
              {['Técnica', 'Física', 'Médica', 'Disciplina', 'General'].map(cat => (
                <button key={cat} onClick={() => setCategoriaNota(cat)}
                        className={`text-[9px] font-black px-4 py-2 rounded-full uppercase transition-all border
                                    ${categoriaNota === cat ? 'bg-primary border-primary text-[#0a1118]' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <textarea
              value={notaTexto} onChange={e => setNotaTexto(e.target.value)}
              placeholder="Escribe la observación aquí..."
              className="w-full bg-[#0a0f18] border border-white/10 rounded-2xl p-5 text-sm text-white outline-none"
              rows={4}
            />
            <div className="flex gap-4 justify-end">
              <button onClick={() => setEscribiendo(false)} className="text-[10px] text-slate-500 font-black uppercase">
                Cancelar
              </button>
              <button onClick={handleGuardarNota}
                      className="bg-primary text-[#0a1118] px-8 py-3 rounded-xl text-[10px] font-black uppercase">
                {editandoId ? 'Actualizar' : 'Publicar'}
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-white/[0.05]">
          {observaciones.length > 0 ? observaciones.map(obs => (
            <ObservationRow key={obs.id} obs={obs} canManage={canManage}
              onEditar={() => { setEditandoId(obs.id); setNotaTexto(obs.nota); setCategoriaNota(obs.categoria_nota); setEscribiendo(true); }}
              onEliminar={() => onEliminarNota?.(obs.id)}
            />
          )) : (
            <div className="p-10 text-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">
              No hay registros en la bitácora
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ObservationRow = ({ obs, canManage, onEditar, onEliminar }) => (
  <div className="px-8 py-6 flex flex-col md:flex-row gap-6 hover:bg-white/[0.01] transition-all group">
    <div className="min-w-[120px]">
      <span className="text-[8px] font-black px-3 py-1.5 rounded-lg border bg-primary/10 border-primary/20 text-primary uppercase">
        {obs.categoria_nota}
      </span>
    </div>
    <div className="flex-1">
      <p className="text-[14px] text-slate-300 italic">"{obs.nota}"</p>
      <div className="flex items-center gap-3 mt-3 text-[9px] text-white/40 font-bold uppercase">
        <span>{obs.autor_nombre || 'Entrenador'}</span>
        <span>•</span>
        <span>{obs.created_at ? new Date(obs.created_at).toLocaleDateString('es-CO') : 'Reciente'}</span>
      </div>
    </div>
    {canManage && (
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEditar}
                className="p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-all">
          <span className="material-symbols-outlined text-sm">edit</span>
        </button>
        <button onClick={onEliminar}
                className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
    )}
  </div>
);

const MiniCard = ({ label, val, icon }) => (
  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4 group hover:border-primary/30 transition-colors">
    <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/5 group-hover:bg-primary/10 transition-all">
      <span className="material-symbols-outlined text-slate-400 text-xl group-hover:text-primary">{icon}</span>
    </div>
    <div>
      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs font-black text-white uppercase">{val}</p>
    </div>
  </div>
);

export default SeguimientoAlumno;