// src/components/AlertasPago.jsx
// Muestra alumnos con pagos pendientes según su fecha_inscripcion.
// Lógica: si hoy > día_inscripcion del mes actual y no tiene pago
// registrado desde ese día, el alumno está PENDIENTE.

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format, getDate, setDate, isAfter, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Dado un alumno con fecha_inscripcion, calcula si está pendiente de pago.
 * Regla: si hoy >= día_de_inscripción del mes actual → debe haber un pago
 * con fecha_pago >= inicio del período de cobro del mes actual.
 */
const calcularEstadoPago = (alumno, pagosMap) => {
  if (!alumno.fecha_inscripcion) return null;

  const hoy         = startOfDay(new Date());
  const diaCorte    = getDate(parseISO(alumno.fecha_inscripcion)); // ej: 15
  // Fecha de corte del mes actual: mismo día pero en el mes de hoy
  const fechaCorte  = startOfDay(setDate(new Date(), diaCorte));

  // Si aún no llegó el día de corte este mes, no hay deuda
  if (!isAfter(hoy, fechaCorte) && hoy.getTime() !== fechaCorte.getTime()) {
    return { estado: 'AL_DIA', fechaCorte };
  }

  // Buscar pagos del alumno desde la fecha de corte
  const pagosAlumno = pagosMap[alumno.id] || [];
  const tienePago   = pagosAlumno.some(p => {
    const fechaPago = startOfDay(new Date(p.fecha_pago));
    return !isAfter(fechaCorte, fechaPago); // fecha_pago >= fechaCorte
  });

  return {
    estado:      tienePago ? 'AL_DIA' : 'PENDIENTE',
    fechaCorte,
    ultimoPago:  pagosAlumno[0] || null,
  };
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function AlertasPago({ currentUser }) {
  const [alumnos,   setAlumnos]   = useState([]);
  const [pagosMap,  setPagosMap]  = useState({});
  const [loading,   setLoading]   = useState(true);
  const [filtro,    setFiltro]    = useState('PENDIENTE'); // 'TODOS' | 'PENDIENTE' | 'AL_DIA'
  const [busqueda,  setBusqueda]  = useState('');

  const canSee = ['SUPER_ADMIN', 'DIRECTOR', 'ADMINISTRATIVO'].includes(currentUser?.rol);
  const esAlumno = currentUser?.rol === 'ALUMNO';

  useEffect(() => {
    if (!canSee && !esAlumno) return;
    fetchDatos();
  }, []);

  const fetchDatos = async () => {
    setLoading(true);
    try {
      // Traer alumnos activos con fecha_inscripcion
      let alumnosQuery = supabase
        .from('usuarios')
        .select('id, primer_nombre, primer_apellido, categoria, foto_url, fecha_inscripcion, estado, email')
        .eq('rol', 'ALUMNO')
        .ilike('estado', 'activo')
        .not('fecha_inscripcion', 'is', null)
        .order('primer_apellido');

      // Si es alumno, solo su propio registro
      if (esAlumno) {
        alumnosQuery = alumnosQuery.eq('id', currentUser.id);
      }

      const { data: alumnosData, error: alumnosError } = await alumnosQuery;
      if (alumnosError) throw alumnosError;

      const ids = (alumnosData || []).map(a => a.id);
      if (!ids.length) { setAlumnos([]); setLoading(false); return; }

      // Traer pagos del último mes hacia adelante para esos alumnos
      const hace60dias = new Date();
      hace60dias.setDate(hace60dias.getDate() - 60);

      const { data: pagosData, error: pagosError } = await supabase
        .from('pagos')
        .select('id, usuario_id, fecha_pago, monto, concepto, estado_pago')
        .in('usuario_id', ids)
        .gte('fecha_pago', hace60dias.toISOString())
        .order('fecha_pago', { ascending: false });

      if (pagosError) throw pagosError;

      // Agrupar pagos por usuario_id
      const mapa = {};
      (pagosData || []).forEach(p => {
        if (!mapa[p.usuario_id]) mapa[p.usuario_id] = [];
        mapa[p.usuario_id].push(p);
      });

      setAlumnos(alumnosData || []);
      setPagosMap(mapa);
    } catch (err) {
      console.error('[AlertasPago]', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estado de cada alumno
  const alumnosConEstado = useMemo(() =>
    alumnos.map(a => ({
      ...a,
      pago: calcularEstadoPago(a, pagosMap),
    })).filter(a => a.pago !== null),
    [alumnos, pagosMap]
  );

  const pendientes = alumnosConEstado.filter(a => a.pago?.estado === 'PENDIENTE');
  const alDia      = alumnosConEstado.filter(a => a.pago?.estado === 'AL_DIA');

  const filtrados = useMemo(() => {
    let base = filtro === 'TODOS'     ? alumnosConEstado
             : filtro === 'PENDIENTE' ? pendientes
             : alDia;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      base = base.filter(a =>
        `${a.primer_nombre} ${a.primer_apellido}`.toLowerCase().includes(q)
      );
    }
    return base;
  }, [alumnosConEstado, filtro, busqueda, pendientes, alDia]);

  // Para ALUMNO: mostrar solo su estado
  if (esAlumno) {
    const miEstado = alumnosConEstado[0];
    if (loading) return null;
    if (!miEstado) return null;
    const pendiente = miEstado.pago?.estado === 'PENDIENTE';
    return (
      <div className={`rounded-[2rem] border p-6 flex items-center gap-4
                       ${pendiente
                         ? 'bg-rose-500/10 border-rose-500/20'
                         : 'bg-emerald-500/10 border-emerald-500/20'}`}>
        <span className={`material-symbols-outlined text-3xl
                          ${pendiente ? 'text-rose-400' : 'text-emerald-400'}`}>
          {pendiente ? 'warning' : 'check_circle'}
        </span>
        <div>
          <p className={`font-black text-[11px] uppercase tracking-widest
                         ${pendiente ? 'text-rose-400' : 'text-emerald-400'}`}>
            {pendiente ? 'Pago pendiente' : 'Pago al día'}
          </p>
          <p className="text-slate-500 text-[10px] font-bold mt-0.5">
            {pendiente
              ? `Tu mensualidad venció el ${format(miEstado.pago.fechaCorte, "d 'de' MMMM", { locale: es })}`
              : `Último pago registrado el ${miEstado.pago.ultimoPago
                  ? format(new Date(miEstado.pago.ultimoPago.fecha_pago), "d 'de' MMMM", { locale: es })
                  : '—'}`}
          </p>
        </div>
      </div>
    );
  }

  if (!canSee) return null;

  return (
    <div className="bg-[#0a0f18]/60 border border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">

      {/* Header - Optimizado para móvil */}
      <div className="px-4 py-5 sm:px-8 sm:py-6 border-b border-white/5 bg-white/[0.02]
                      flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">payments</span>
          <div>
            <p className="font-black text-[10px] sm:text-[11px] text-white uppercase tracking-widest">
              Estado de Pagos
            </p>
            <p className="text-slate-600 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mt-0.5">
              {format(new Date(), "MMMM yyyy", { locale: es }).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Stats rápidas - Ahora se ajustan en móvil */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2 sm:gap-4 bg-white/5 md:bg-transparent p-3 md:p-0 rounded-2xl">
          <div className="text-center flex-1 md:flex-none">
            <p className="text-rose-400 font-black text-lg sm:text-xl">{pendientes.length}</p>
            <p className="text-[7px] sm:text-[8px] text-slate-600 font-bold uppercase tracking-tighter">Pendientes</p>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="text-center flex-1 md:flex-none">
            <p className="text-emerald-400 font-black text-lg sm:text-xl">{alDia.length}</p>
            <p className="text-[7px] sm:text-[8px] text-slate-600 font-bold uppercase tracking-tighter">Al día</p>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <button
            onClick={fetchDatos}
            className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-primary/10 transition-all"
          >
            <span className={`material-symbols-outlined text-slate-400 text-sm ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Filtros y Buscador - Stack en móvil */}
      <div className="px-4 py-4 sm:px-8 border-b border-white/5 flex flex-col gap-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          {[
            { id: 'PENDIENTE', label: 'Pendientes' },
            { id: 'AL_DIA',    label: 'Al día' },
            { id: 'TODOS',      label: 'Todos' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`px-3 py-2 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap
                         ${filtro === f.id
                           ? 'bg-primary/20 border-primary/40 text-primary'
                           : 'bg-transparent border-white/5 text-slate-600'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm">search</span>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar alumno..."
            className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5
                       text-[10px] text-white outline-none focus:border-primary/30 w-full"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="divide-y divide-white/[0.04]">
        {filtrados.map(a => (
          <FilaAlumno key={a.id} alumno={a} />
        ))}
      </div>
    </div>
  );
}

// ─── Fila individual - REFORMATEADA PARA MÓVIL ───────────────────────────────
function FilaAlumno({ alumno }) {
  const pendiente  = alumno.pago?.estado === 'PENDIENTE';
  const fechaCorte = alumno.pago?.fechaCorte;
  const ultimoPago = alumno.pago?.ultimoPago;

  const diasMora = pendiente && fechaCorte
    ? Math.max(0, Math.floor((new Date() - fechaCorte) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-8 py-4 hover:bg-white/[0.02] transition-all
                     ${pendiente ? 'border-l-2 border-rose-500/40' : 'border-l-2 border-transparent'}`}>

      {/* Avatar - Más pequeño en móvil */}
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-800 flex flex-shrink-0 items-center justify-center font-black text-primary text-[10px] sm:text-sm border border-white/5 overflow-hidden">
        {alumno.foto_url
          ? <img src={alumno.foto_url} className="w-full h-full object-cover" alt="" />
          : `${alumno.primer_nombre?.[0] || ''}${alumno.primer_apellido?.[0] || ''}`}
      </div>

      {/* Nombre e Info - Ajuste de truncate */}
      <div className="flex-1 min-w-0 pr-2">
        <p className="font-black text-white text-[10px] sm:text-[11px] uppercase italic truncate leading-none">
          {alumno.primer_nombre} {alumno.primer_apellido}
        </p>
        <p className="text-[7px] sm:text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-1">
          {alumno.categoria} <span className="hidden sm:inline">· Corte: día {fechaCorte ? getDate(fechaCorte) : '—'}</span>
        </p>
      </div>

      {/* Estado - Badges más compactos en móvil */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {pendiente ? (
          <>
            <span className="flex items-center gap-1 text-[7px] sm:text-[9px] font-black uppercase text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-md">
              <span className="material-symbols-outlined text-[10px] sm:text-xs">warning</span>
              PENDIENTE
            </span>
            {diasMora > 0 && (
              <span className="text-[7px] font-bold text-rose-500/80 uppercase">
                {diasMora}d mora
              </span>
            )}
          </>
        ) : (
          <span className="flex items-center gap-1 text-[7px] sm:text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
            <span className="material-symbols-outlined text-[10px] sm:text-xs">check_circle</span>
            AL DÍA
          </span>
        )}
      </div>
    </div>
  );
}