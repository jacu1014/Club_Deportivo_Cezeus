// src/components/Avances/ResumenCiclo.jsx
// Vista de resumen de un ciclo: tabla de alumnos con sus evaluaciones INICIO y FINAL,
// progreso por dimensión, y acceso rápido a evaluar alumnos pendientes.

import React, { useState, useEffect, useMemo } from 'react';
import { useAvances, DIMENSIONES, calcularPromedioDimension } from '../../hooks/useAvances';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PolarRadiusAxis } from 'recharts';

export default function ResumenCiclo({ ciclo, currentUser, onVolver, onEvaluar }) {
  const { fetchEvaluacionesCiclo, canEvaluar } = useAvances(currentUser);
  const [evaluaciones, setEvals]  = useState([]);
  const [loading, setLoading]     = useState(true);
  const [alumnoDetalle, setDetalle] = useState(null);

  useEffect(() => {
    fetchEvaluacionesCiclo(ciclo.id)
      .then(setEvals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ciclo.id, fetchEvaluacionesCiclo]);

  // Agrupar evaluaciones por alumno
  const alumnosMap = useMemo(() => {
    const map = {};
    evaluaciones.forEach(ev => {
      const id = ev.alumno_id;
      if (!map[id]) {
        map[id] = {
          alumno: ev.usuarios,
          inicio: null,
          final:  null,
        };
      }
      if (ev.tipo === 'INICIO') map[id].inicio = ev;
      if (ev.tipo === 'FINAL')  map[id].final  = ev;
    });
    return Object.values(map);
  }, [evaluaciones]);

  // Calcular delta (mejora) entre inicio y final
  const calcDelta = (inicio, final, campos) => {
    if (!inicio || !final) return null;
    const pI = calcularPromedioDimension(inicio, campos);
    const pF = calcularPromedioDimension(final, campos);
    return pF - pI;
  };

  const DeltaBadge = ({ delta }) => {
    if (delta === null) return <span className="text-[8px] text-slate-600 font-bold">—</span>;
    const color = delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-slate-400';
    return (
      <span className={`text-[10px] font-black ${color}`}>
        {delta > 0 ? '+' : ''}{delta}
      </span>
    );
  };

  // Panel de detalle de un alumno
  const PanelDetalle = ({ item }) => {
    const { alumno, inicio, final } = item;
    const radarInicio = inicio ? DIMENSIONES.map(d => ({
      subject: d.label,
      Inicio:  calcularPromedioDimension(inicio, d.campos.map(c => c.key)),
      Final:   final ? calcularPromedioDimension(final, d.campos.map(c => c.key)) : null,
    })) : [];

    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
           onClick={() => setDetalle(null)}>
        <div className="bg-[#0a0f18] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-2xl
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

          {/* Radar comparativo */}
          {inicio && (
            <div className="h-64 mb-6">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 text-center">
                {final ? 'Comparación Inicio vs Final' : 'Evaluación de Inicio'}
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarInicio}>
                  <PolarGrid stroke="#ffffff10" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Inicio" dataKey="Inicio" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
                  {final && (
                    <Radar name="Final" dataKey="Final" stroke="#13ecec" fill="#13ecec" fillOpacity={0.35} />
                  )}
                </RadarChart>
              </ResponsiveContainer>
              {final && (
                <div className="flex justify-center gap-6 mt-2">
                  <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400">
                    <span className="w-3 h-0.5 bg-slate-400 inline-block" />Inicio
                  </span>
                  <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-primary">
                    <span className="w-3 h-0.5 bg-primary inline-block" />Final
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tabla de dimensiones */}
          <div className="space-y-3">
            {DIMENSIONES.map(dim => {
              const campos = dim.campos.map(c => c.key);
              const pI = inicio ? calcularPromedioDimension(inicio, campos) : null;
              const pF = final  ? calcularPromedioDimension(final,  campos) : null;
              const delta = pI !== null && pF !== null ? pF - pI : null;
              return (
                <div key={dim.key} className="flex items-center justify-between bg-white/5 px-5 py-3 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-base ${dim.color}`}>{dim.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{dim.label}</span>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-[8px] text-slate-600 font-bold uppercase">Inicio</p>
                      <p className="font-black text-slate-400 text-sm">{pI ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-600 font-bold uppercase">Final</p>
                      <p className="font-black text-primary text-sm">{pF ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-600 font-bold uppercase">Δ</p>
                      <DeltaBadge delta={delta} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Observaciones */}
          {(inicio?.observaciones || final?.observaciones) && (
            <div className="mt-4 space-y-2">
              {inicio?.observaciones && (
                <div className="bg-white/5 px-5 py-3 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Notas Inicio</p>
                  <p className="text-[11px] text-slate-300 italic">"{inicio.observaciones}"</p>
                </div>
              )}
              {final?.observaciones && (
                <div className="bg-white/5 px-5 py-3 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Notas Final</p>
                  <p className="text-[11px] text-slate-300 italic">"{final.observaciones}"</p>
                </div>
              )}
            </div>
          )}

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
            {alumnosMap.length} alumnos evaluados ·{' '}
            {alumnosMap.filter(a => a.inicio && a.final).length} completos
          </p>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Evaluados"    value={alumnosMap.length}                                          color="primary" />
        <StatCard label="Completos"    value={alumnosMap.filter(a => a.inicio && a.final).length}         color="emerald" />
        <StatCard label="Pendientes"   value={alumnosMap.filter(a => !a.inicio || !a.final).length}       color="amber" />
      </div>

      {loading ? (
        <div className="py-16 text-center text-primary animate-pulse text-[10px] font-black uppercase tracking-widest">
          Cargando evaluaciones...
        </div>
      ) : alumnosMap.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-white/10 rounded-[2rem] space-y-3">
          <span className="material-symbols-outlined text-5xl text-slate-700">assignment</span>
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">
            No hay evaluaciones en este ciclo aún
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alumnosMap.map(item => (
            <AlumnoRow
              key={item.alumno?.id}
              item={item}
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

function AlumnoRow({ item, canEvaluar, onDetalle, onEvaluar }) {
  const { alumno, inicio, final } = item;
  const tieneAmbas = inicio && final;

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

      <div className="flex items-center gap-3">
        <StatusPill label="Inicio" done={!!inicio} />
        <StatusPill label="Final"  done={!!final} />
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

const StatusPill = ({ label, done }) => (
  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full
                    ${done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-slate-600'}`}>
    {done ? '✓ ' : '○ '}{label}
  </span>
);

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