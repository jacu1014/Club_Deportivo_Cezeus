// src/pages/AvancesPage.jsx
// Página principal del módulo "Avances de Procesos".
import React, { useState, useEffect } from 'react';
import { useAvances } from '../hooks/useAvances';
import ModalCiclo        from '../components/Avances/ModalCiclo';
import FormEvaluacion    from '../components/Avances/FormEvaluacion';
import ResumenCiclo      from '../components/Avances/ResumenCiclo';
import SeguimientoAlumno from '../components/SeguimientoAlumno';
import { supabase } from '../lib/supabaseClient';

const ROLES_EVAL = ['SUPER_ADMIN', 'ADMINISTRATIVO', 'DIRECTOR', 'ENTRENADOR'];

export default function AvancesPage({ user }) {
  const {
    ciclos, loadingCiclos, fetchCiclos,
    crearCiclo, toggleCiclo, eliminarCiclo,
    fetchObservaciones, agregarObservacion, editarObservacion, eliminarObservacion,
    canEvaluar,
  } = useAvances(user);

  // Vista activa: 'ciclos' | 'evaluar' | 'resumen' | 'seguimiento'
  const [vista, setVista]               = useState('ciclos');
  const [cicloSeleccionado, setCiclo]   = useState(null);
  const [alumnoSeleccionado, setAlumno] = useState(null);
  const [observaciones, setObs]         = useState([]);
  const [modalCiclo, setModalCiclo]     = useState(false);
  const [toast, setToast]               = useState(null);

  const mostrarToast = (msg, tipo = 'ok') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  // Para ALUMNO: ir directo a su propia vista de seguimiento
  useEffect(() => {
    if (user?.rol === 'ALUMNO') {
      setAlumno(user);
      setVista('seguimiento');
    }
  }, [user]);

  // Cargar observaciones cuando se selecciona un alumno
  useEffect(() => {
    if (!alumnoSeleccionado?.id) return;
    fetchObservaciones(alumnoSeleccionado.id).then(setObs).catch(console.error);
  }, [alumnoSeleccionado?.id, fetchObservaciones]);

  const handleSeleccionarAlumno = (alumno) => {
    setAlumno(alumno);
    setVista(alumno ? 'seguimiento' : 'ciclos');
  };

  const handleIrAEvaluar = (ciclo, alumno = null) => {
    setCiclo(ciclo);
    setAlumno(alumno);
    setVista('evaluar');
  };

  const handleVerResumen = (ciclo) => {
    setCiclo(ciclo);
    setVista('resumen');
  };

  const handleAgregarNota = async (payload) => {
    try {
      const nueva = await agregarObservacion(payload);
      setObs(prev => [nueva, ...prev]);
      mostrarToast('Nota agregada.');
    } catch (e) { mostrarToast(e.message, 'error'); }
  };

  const handleEditarNota = async (id, nota, categoria) => {
    try {
      const updated = await editarObservacion(id, nota, categoria);
      setObs(prev => prev.map(o => o.id === id ? updated : o));
      mostrarToast('Nota actualizada.');
    } catch (e) { mostrarToast(e.message, 'error'); }
  };

  const handleEliminarNota = async (id) => {
    if (!window.confirm('¿Eliminar esta nota?')) return;
    try {
      await eliminarObservacion(id);
      setObs(prev => prev.filter(o => o.id !== id));
      mostrarToast('Nota eliminada.');
    } catch (e) { mostrarToast(e.message, 'error'); }
  };

  // ── VISTA ALUMNO ─────────────────────────────────────────────────────────────
  if (user?.rol === 'ALUMNO') {
    return (
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <SeguimientoAlumno
          alumno={user}
          currentUser={user}
          observaciones={observaciones}
          onSelectAlumno={handleSeleccionarAlumno}
        />
      </div>
    );
  }

  // ── LAYOUT PRINCIPAL (roles con acceso) ──────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 pb-20 space-y-8 animate-in fade-in duration-500">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-2xl text-[11px] font-black uppercase
                         tracking-widest shadow-xl animate-in slide-in-from-bottom-2
                         ${toast.tipo === 'ok'
                           ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                           : 'bg-rose-500/20 border border-rose-500/30 text-rose-400'}`}>
          {toast.tipo === 'ok' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      {/* Encabezado */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            Avances de <span className="text-primary">Procesos</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
            Evaluación y seguimiento deportivo
          </p>
        </div>

        {/* Breadcrumb de navegación */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
          <button onClick={() => setVista('ciclos')}
                  className={`hover:text-primary transition-colors ${vista === 'ciclos' ? 'text-primary' : ''}`}>
            Ciclos
          </button>
          {(vista === 'evaluar' || vista === 'resumen') && (
            <>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-slate-400">{cicloSeleccionado?.nombre}</span>
            </>
          )}
          {vista === 'seguimiento' && alumnoSeleccionado && (
            <>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-slate-400">
                {alumnoSeleccionado.primer_nombre} {alumnoSeleccionado.primer_apellido}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── VISTA: LISTA DE CICLOS ── */}
      {vista === 'ciclos' && (
        <ListaCiclos
          ciclos={ciclos}
          loading={loadingCiclos}
          canEvaluar={canEvaluar}
          onCrear={() => setModalCiclo(true)}
          onEvaluar={handleIrAEvaluar}
          onResumen={handleVerResumen}
          onToggle={(id, activo) => toggleCiclo(id, activo).then(fetchCiclos).catch(e => mostrarToast(e.message, 'error'))}
          onEliminar={(id, nombre) => 
            eliminarCiclo(id, nombre)
              .then(() => {
                mostrarToast(`Ciclo "${nombre}" eliminado`);
                fetchCiclos(); // Refrescar lista tras eliminar
              })
              .catch(e => mostrarToast(e.message, 'error'))
          }
        />
      )}

      {/* ── VISTA: FORMULARIO DE EVALUACIÓN ── */}
      {vista === 'evaluar' && cicloSeleccionado && (
        <FormEvaluacion
          ciclo={cicloSeleccionado}
          alumnoInicial={alumnoSeleccionado}
          currentUser={user}
          onVolver={() => setVista('ciclos')}
          onGuardado={(msg) => mostrarToast(msg || 'Evaluación guardada')}
        />
      )}

      {/* ── VISTA: RESUMEN DEL CICLO ── */}
      {vista === 'resumen' && cicloSeleccionado && (
        <ResumenCiclo
          ciclo={cicloSeleccionado}
          currentUser={user}
          onVolver={() => setVista('ciclos')}
          onEvaluar={(alumno) => handleIrAEvaluar(cicloSeleccionado, alumno)}
        />
      )}

      {/* ── VISTA: SEGUIMIENTO INDIVIDUAL ── */}
      {vista === 'seguimiento' && (
        <SeguimientoAlumno
          alumno={alumnoSeleccionado}
          currentUser={user}
          observaciones={observaciones}
          onAgregarNota={handleAgregarNota}
          onEditarNota={handleEditarNota}
          onEliminarNota={handleEliminarNota}
          onSelectAlumno={handleSeleccionarAlumno}
        />
      )}

      {/* Modal crear ciclo */}
      {modalCiclo && (
        <ModalCiclo
          onClose={() => setModalCiclo(false)}
          onGuardar={async (payload) => {
            try {
              await crearCiclo(payload);
              setModalCiclo(false);
              fetchCiclos(); // Refrescar tras crear
              mostrarToast('Ciclo creado correctamente.');
            } catch (e) { mostrarToast(e.message, 'error'); }
          }}
        />
      )}
    </div>
  );
}

// ─── Sub-componente: Lista de ciclos ─────────────────────────────────────────
function ListaCiclos({ ciclos, loading, canEvaluar, onCrear, onEvaluar, onResumen, onToggle, onEliminar }) {
  const activos   = ciclos.filter(c => c.activo);
  const inactivos = ciclos.filter(c => !c.activo);

  if (loading) return (
    <div className="py-20 text-center text-primary animate-pulse font-black uppercase text-[10px] tracking-[0.5em]">
      Cargando ciclos...
    </div>
  );

  return (
    <div className="space-y-8">
      {canEvaluar && (
        <div className="flex justify-end">
          <button onClick={onCrear}
                  className="flex items-center gap-2 bg-primary text-[#05080d] px-6 py-3 rounded-xl
                             font-black text-[10px] uppercase tracking-widest hover:bg-[#0AB5B5] transition-all">
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Nuevo Ciclo
          </button>
        </div>
      )}

      {ciclos.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-[2rem] space-y-3">
          <span className="material-symbols-outlined text-5xl text-slate-700">event_note</span>
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">
            No hay ciclos creados aún
          </p>
          {canEvaluar && (
            <p className="text-slate-600 text-[10px] uppercase">
              Crea el primer ciclo para comenzar a evaluar
            </p>
          )}
        </div>
      ) : (
        <>
          {activos.length > 0 && (
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Ciclos Activos
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activos.map(c => (
                  <CicloCard key={c.id} ciclo={c} canEvaluar={canEvaluar}
                    onEvaluar={onEvaluar} onResumen={onResumen}
                    onToggle={onToggle} onEliminar={onEliminar} />
                ))}
              </div>
            </div>
          )}

          {inactivos.length > 0 && (
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
                Ciclos Cerrados
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inactivos.map(c => (
                  <CicloCard key={c.id} ciclo={c} canEvaluar={canEvaluar}
                    onEvaluar={onEvaluar} onResumen={onResumen}
                    onToggle={onToggle} onEliminar={onEliminar} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CicloCard({ ciclo, canEvaluar, onEvaluar, onResumen, onToggle, onEliminar }) {
  const fechaI = new Date(ciclo.fecha_inicio + 'T00:00:00').toLocaleDateString('es-CO', { day:'2-digit', month:'short' });
  const fechaF = new Date(ciclo.fecha_fin    + 'T00:00:00').toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' });

  return (
    <div className={`bg-[#0a0f18]/60 border rounded-[2rem] p-6 space-y-4 transition-all
                     ${ciclo.activo ? 'border-primary/15' : 'border-white/5 opacity-70'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-white uppercase italic text-sm">{ciclo.nombre}</h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            {fechaI} → {fechaF}
          </p>
          {ciclo.descripcion && (
            <p className="text-[10px] text-slate-400 mt-1">{ciclo.descripcion}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full
                            ${ciclo.activo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
            {ciclo.activo ? 'Activo' : 'Cerrado'}
          </span>
          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-primary/10 text-primary">
            {ciclo.categoria}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
        {canEvaluar && ciclo.activo && (
          <button onClick={() => onEvaluar(ciclo)}
                  className="flex items-center gap-1.5 bg-primary text-[#05080d] px-4 py-2 rounded-xl
                             text-[9px] font-black uppercase tracking-widest hover:bg-[#0AB5B5] transition-all">
            <span className="material-symbols-outlined text-sm">edit_note</span>
            Evaluar
          </button>
        )}
        <button onClick={() => onResumen(ciclo)}
                className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300
                           px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest
                           hover:border-primary/30 hover:text-primary transition-all">
          <span className="material-symbols-outlined text-sm">bar_chart</span>
          Resumen
        </button>
        {canEvaluar && (
          <>
            <button onClick={() => onToggle(ciclo.id, ciclo.activo)}
                    className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-400
                               px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest
                               hover:border-yellow-500/30 hover:text-yellow-400 transition-all">
              <span className="material-symbols-outlined text-sm">
                {ciclo.activo ? 'lock' : 'lock_open'}
              </span>
              {ciclo.activo ? 'Cerrar' : 'Reabrir'}
            </button>
            <button onClick={() => window.confirm(`¿Eliminar "${ciclo.nombre}"?`) && onEliminar(ciclo.id, ciclo.nombre)}
                    className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-600
                               px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest
                               hover:border-rose-500/30 hover:text-rose-400 transition-all">
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}