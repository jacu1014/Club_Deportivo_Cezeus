// src/hooks/useAvances.js
// Hook central del módulo Avances de Procesos.
// Centraliza todas las consultas a Supabase para ciclos, evaluaciones y observaciones.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { registrarLog } from '../lib/activity';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Calcula el promedio de un grupo de campos numéricos de una evaluación */
export const calcularPromedioDimension = (eval_, campos) => {
  if (!eval_) return 0;
  const vals = campos.map(c => eval_[c] ?? 50);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
};

/** Convierte una evaluación a los 6 puntos del RadarChart de SeguimientoAlumno */
export const evaluacionARadar = (eval_) => {
  if (!eval_) return null;
  return [
    { subject: 'Técnica',     A: calcularPromedioDimension(eval_, ['tec_control','tec_pase','tec_regate','tec_disparo']) },
    { subject: 'Física',      A: calcularPromedioDimension(eval_, ['fis_velocidad','fis_resistencia','fis_fuerza','fis_coordinacion']) },
    { subject: 'Táctica',     A: calcularPromedioDimension(eval_, ['tac_posicion','tac_equipo','tac_lectura']) },
    { subject: 'Actitud',     A: calcularPromedioDimension(eval_, ['act_disciplina','act_respeto','act_puntualidad']) },
    { subject: 'Pase',        A: eval_.tec_pase        ?? 50 },
    { subject: 'Velocidad',   A: eval_.fis_velocidad   ?? 50 },
  ];
};

/** Estructura de dimensiones con sus campos para el formulario de evaluación */
export const DIMENSIONES = [
  {
    key: 'tecnica', label: 'Técnica', icon: 'sports_soccer', color: 'text-primary',
    campos: [
      { key: 'tec_control',  label: 'Control de balón' },
      { key: 'tec_pase',     label: 'Precisión de pase' },
      { key: 'tec_regate',   label: 'Regate' },
      { key: 'tec_disparo',  label: 'Disparo a puerta' },
    ],
  },
  {
    key: 'fisica', label: 'Física', icon: 'fitness_center', color: 'text-emerald-400',
    campos: [
      { key: 'fis_velocidad',    label: 'Velocidad' },
      { key: 'fis_resistencia',  label: 'Resistencia' },
      { key: 'fis_fuerza',       label: 'Fuerza' },
      { key: 'fis_coordinacion', label: 'Coordinación' },
    ],
  },
  {
    key: 'tactica', label: 'Táctica', icon: 'psychology', color: 'text-purple-400',
    campos: [
      { key: 'tac_posicion', label: 'Posicionamiento' },
      { key: 'tac_equipo',   label: 'Juego en equipo' },
      { key: 'tac_lectura',  label: 'Lectura del juego' },
    ],
  },
  {
    key: 'actitud', label: 'Actitudinal', icon: 'emoji_events', color: 'text-amber-400',
    campos: [
      { key: 'act_disciplina',  label: 'Disciplina' },
      { key: 'act_respeto',     label: 'Respeto' },
      { key: 'act_puntualidad', label: 'Puntualidad' },
    ],
  },
];

/** Valores por defecto de una evaluación en blanco */
export const EVAL_INICIAL = DIMENSIONES.flatMap(d => d.campos).reduce((acc, c) => {
  acc[c.key] = 50;
  return acc;
}, {});

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useAvances(currentUser) {
  const [ciclos, setCiclos]           = useState([]);
  const [loadingCiclos, setLoadingC]  = useState(true);

  const canEvaluar = ['SUPER_ADMIN', 'ADMINISTRATIVO', 'DIRECTOR', 'ENTRENADOR']
    .includes(currentUser?.rol);

  // ── Ciclos ──────────────────────────────────────────────────────────────────
  const fetchCiclos = useCallback(async () => {
    setLoadingC(true);
    const { data, error } = await supabase
      .from('ciclos_evaluacion')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setCiclos(data || []);
    setLoadingC(false);
  }, []);

  useEffect(() => { fetchCiclos(); }, [fetchCiclos]);

  const crearCiclo = async (payload) => {
    const { data, error } = await supabase
      .from('ciclos_evaluacion')
      .insert([{ ...payload, creado_por: currentUser?.id }])
      .select()
      .single();
    if (error) throw error;
    await registrarLog({
      accion: 'CREAR_CICLO',
      descripcion: `Ciclo creado: ${payload.nombre}`,
      modulo: 'AVANCES',
    });
    await fetchCiclos();
    return data;
  };

  const toggleCiclo = async (id, activo) => {
    const { error } = await supabase
      .from('ciclos_evaluacion')
      .update({ activo: !activo })
      .eq('id', id);
    if (error) throw error;
    setCiclos(prev => prev.map(c => c.id === id ? { ...c, activo: !activo } : c));
  };

  const eliminarCiclo = async (id, nombre) => {
    const { error } = await supabase.from('ciclos_evaluacion').delete().eq('id', id);
    if (error) throw error;
    await registrarLog({
      accion: 'ELIMINAR_CICLO',
      descripcion: `Ciclo eliminado: ${nombre}`,
      modulo: 'AVANCES',
    });
    setCiclos(prev => prev.filter(c => c.id !== id));
  };

  // ── Evaluaciones ────────────────────────────────────────────────────────────
  const fetchEvaluacionesAlumno = useCallback(async (alumnoId) => {
    const { data, error } = await supabase
      .from('evaluaciones')
      .select(`*, ciclos_evaluacion(nombre, fecha_inicio, fecha_fin, categoria)`)
      .eq('alumno_id', alumnoId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }, []);

  const fetchEvaluacionesCiclo = useCallback(async (cicloId) => {
    const { data, error } = await supabase
      .from('evaluaciones')
      .select(`*, usuarios!alumno_id(id, primer_nombre, primer_apellido, categoria, foto_url)`)
      .eq('ciclo_id', cicloId);
    if (error) throw error;
    return data || [];
  }, []);

  const guardarEvaluacion = async (payload) => {
    // Upsert: si ya existe (alumno+ciclo+tipo) la sobreescribe
    const { data, error } = await supabase
      .from('evaluaciones')
      .upsert(
        [{ ...payload, entrenador_id: currentUser?.id }],
        { onConflict: 'alumno_id,ciclo_id,tipo' }
      )
      .select()
      .single();
    if (error) throw error;
    await registrarLog({
      accion: 'GUARDAR_EVALUACION',
      descripcion: `Evaluación ${payload.tipo} guardada para alumno ${payload.alumno_id}`,
      modulo: 'AVANCES',
      detalles: { ciclo_id: payload.ciclo_id, tipo: payload.tipo },
    });
    return data;
  };

  // ── Observaciones ───────────────────────────────────────────────────────────
  const fetchObservaciones = useCallback(async (alumnoId) => {
    const { data, error } = await supabase
      .from('observaciones_seguimiento')
      .select('*')
      .eq('alumno_id', alumnoId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }, []);

  const agregarObservacion = async ({ usuario_id, nota, categoria_nota }) => {
    const nombreAutor = currentUser
      ? `${currentUser.primer_nombre} ${currentUser.primer_apellido || ''}`.trim()
      : 'Entrenador';
    const { data, error } = await supabase
      .from('observaciones_seguimiento')
      .insert([{
        alumno_id:      usuario_id,
        autor_id:       currentUser?.id,
        autor_nombre:   nombreAutor,
        nota,
        categoria_nota,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const editarObservacion = async (id, nota, categoria_nota) => {
    const { data, error } = await supabase
      .from('observaciones_seguimiento')
      .update({ nota, categoria_nota })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const eliminarObservacion = async (id) => {
    const { error } = await supabase
      .from('observaciones_seguimiento')
      .delete()
      .eq('id', id);
    if (error) throw error;
  };

  return {
    // ciclos
    ciclos, loadingCiclos, fetchCiclos,
    crearCiclo, toggleCiclo, eliminarCiclo,
    // evaluaciones
    fetchEvaluacionesAlumno, fetchEvaluacionesCiclo, guardarEvaluacion,
    // observaciones
    fetchObservaciones, agregarObservacion, editarObservacion, eliminarObservacion,
    // permisos
    canEvaluar,
  };
}