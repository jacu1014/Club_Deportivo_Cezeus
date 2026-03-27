// src/hooks/useAvances.js (versión modificada)
// Hook central del módulo Avances de Procesos - VERSIÓN DINÁMICA

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { registrarLog } from '../lib/activity';

// ============================================
// NUEVAS FUNCIONES PARA ESTRUCTURA DINÁMICA
// ============================================

/** Obtiene los items de un ciclo con sus categorías */
export const getItemsConCategorias = async (cicloId) => {
  const { data, error } = await supabase
    .from('ciclos_items')
    .select(`
      *,
      categoria:categorias_base(*)
    `)
    .eq('ciclo_id', cicloId)
    .order('orden');
  
  if (error) throw error;
  return data || [];
};

/** Calcula el promedio de calificaciones de una evaluación */
export const calcularPromedioEvaluacion = (itemsCalificaciones) => {
  if (!itemsCalificaciones || itemsCalificaciones.length === 0) return 0;
  const suma = itemsCalificaciones.reduce((acc, item) => acc + item.calificacion, 0);
  return Math.round(suma / itemsCalificaciones.length);
};

/** Agrupa calificaciones por categoría para gráficos */
export const agruparPorCategoria = (itemsConCalificaciones, categorias) => {
  const resultado = {};
  itemsConCalificaciones.forEach(item => {
    const catNombre = item.item?.categoria?.nombre || 'Sin categoría';
    if (!resultado[catNombre]) {
      resultado[catNombre] = {
        categoria: catNombre,
        items: [],
        promedio: 0
      };
    }
    resultado[catNombre].items.push({
      nombre: item.item.nombre,
      calificacion: item.calificacion
    });
  });
  
  // Calcular promedios por categoría
  Object.keys(resultado).forEach(cat => {
    const items = resultado[cat].items;
    const suma = items.reduce((acc, i) => acc + i.calificacion, 0);
    resultado[cat].promedio = Math.round(suma / items.length);
  });
  
  return resultado;
};

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useAvances(currentUser) {
  const [ciclos, setCiclos]           = useState([]);
  const [loadingCiclos, setLoadingC]  = useState(true);
  const [categoriasBase, setCategoriasBase] = useState([]);
  const [mensajesPersonalizados, setMensajesPersonalizados] = useState([]);

  const canEvaluar = ['SUPER_ADMIN', 'ADMINISTRATIVO', 'DIRECTOR', 'ENTRENADOR']
    .includes(currentUser?.rol);

  // ── Cargar datos maestros ──────────────────────────────────────────────────
  const cargarDatosMaestros = useCallback(async () => {
    // Cargar categorías base
    const { data: cats } = await supabase
      .from('categorias_base')
      .select('*')
      .order('orden');
    if (cats) setCategoriasBase(cats);
    
    // Cargar mensajes personalizados
    const { data: msgs } = await supabase
      .from('mensajes_personalizados_club')
      .select('*')
      .eq('activo', true)
      .order('rango_min');
    if (msgs) setMensajesPersonalizados(msgs);
  }, []);

  useEffect(() => { cargarDatosMaestros(); }, [cargarDatosMaestros]);

  // ── Ciclos (MODIFICADO: ahora trabaja con la tabla sin categoría) ─────────
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
    // payload ahora incluye nombre, descripcion, fecha_inicio, fecha_fin, items (array de items por categoría)
    const { items, ...cicloData } = payload;
    
    // 1. Crear el ciclo
    const { data: ciclo, error: cicloError } = await supabase
      .from('ciclos_evaluacion')
      .insert([{ ...cicloData, creado_por: currentUser?.id, activo: true }])
      .select()
      .single();
    if (cicloError) throw cicloError;
    
    // 2. Crear los items del ciclo
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item, idx) => ({
        ciclo_id: ciclo.id,
        categoria_id: item.categoria_id,
        nombre: item.nombre,
        orden: idx
      }));
      
      const { error: itemsError } = await supabase
        .from('ciclos_items')
        .insert(itemsToInsert);
      if (itemsError) throw itemsError;
    }
    
    await registrarLog({
      accion: 'CREAR_CICLO',
      descripcion: `Ciclo creado: ${payload.nombre}`,
      modulo: 'AVANCES',
    });
    await fetchCiclos();
    return ciclo;
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
    // Las tablas relacionadas tienen ON DELETE CASCADE
    const { error } = await supabase.from('ciclos_evaluacion').delete().eq('id', id);
    if (error) throw error;
    await registrarLog({
      accion: 'ELIMINAR_CICLO',
      descripcion: `Ciclo eliminado: ${nombre}`,
      modulo: 'AVANCES',
    });
    setCiclos(prev => prev.filter(c => c.id !== id));
  };

  // ── Evaluaciones (NUEVA ESTRUCTURA) ─────────────────────────────────────────
  const fetchEvaluacionesAlumno = useCallback(async (alumnoId) => {
    // Obtener evaluaciones con sus items y los items del ciclo
    const { data, error } = await supabase
      .from('evaluaciones_avance')
      .select(`
        *,
        items:evaluaciones_items(
          *,
          item:ciclos_items(
            *,
            categoria:categorias_base(*)
          )
        ),
        ciclo:ciclos_evaluacion(*)
      `)
      .eq('alumno_id', alumnoId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }, []);

  const fetchEvaluacionesCiclo = useCallback(async (cicloId) => {
    // Obtener todas las evaluaciones de un ciclo con alumnos y sus items
    const { data, error } = await supabase
      .from('evaluaciones_avance')
      .select(`
        *,
        items:evaluaciones_items(
          *,
          item:ciclos_items(*)
        ),
        alumno:usuarios(id, primer_nombre, primer_apellido, categoria, foto_url)
      `)
      .eq('ciclo_id', cicloId);
    
    if (error) throw error;
    return data || [];
  }, []);

  const guardarEvaluacion = async (payload) => {
    // payload = { evaluacion: {...}, items: [{ ciclo_item_id, calificacion }] }
    const { evaluacionData, itemsData } = payload;
    
    // 1. Guardar la evaluación (upsert por alumno+ciclo+tipo)
    const { data: evaluacion, error: evalError } = await supabase
      .from('evaluaciones_avance')
      .upsert(
        [{ 
          ...evaluacionData, 
          entrenador_id: currentUser?.id,
          fecha_evaluacion: new Date().toISOString().split('T')[0]
        }],
        { onConflict: 'alumno_id,ciclo_id,tipo' }
      )
      .select()
      .single();
    if (evalError) throw evalError;
    
    // 2. Eliminar items existentes (para sobrescribir)
    await supabase
      .from('evaluaciones_items')
      .delete()
      .eq('evaluacion_id', evaluacion.id);
    
    // 3. Insertar nuevos items
    if (itemsData && itemsData.length > 0) {
      const itemsToInsert = itemsData.map(item => ({
        evaluacion_id: evaluacion.id,
        ciclo_item_id: item.ciclo_item_id,
        calificacion: item.calificacion
      }));
      
      const { error: itemsError } = await supabase
        .from('evaluaciones_items')
        .insert(itemsToInsert);
      if (itemsError) throw itemsError;
    }
    
    await registrarLog({
      accion: 'GUARDAR_EVALUACION',
      descripcion: `Evaluación ${evaluacionData.tipo} guardada para alumno ${evaluacionData.alumno_id}`,
      modulo: 'AVANCES',
      detalles: { ciclo_id: evaluacionData.ciclo_id, tipo: evaluacionData.tipo },
    });
    
    return evaluacion;
  };

  const obtenerMensajePorPromedio = (promedio) => {
    const mensaje = mensajesPersonalizados.find(
      m => promedio >= m.rango_min && promedio <= m.rango_max
    );
    return mensaje?.mensaje || 'Evaluación completada.';
  };

  // ── Observaciones (sin cambios) ────────────────────────────────────────────
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
    // datos maestros
    categoriasBase,
    mensajesPersonalizados,
    // ciclos
    ciclos, loadingCiclos, fetchCiclos,
    crearCiclo, toggleCiclo, eliminarCiclo,
    // items del ciclo
    getItemsConCategorias: (cicloId) => getItemsConCategorias(cicloId),
    // evaluaciones
    fetchEvaluacionesAlumno, fetchEvaluacionesCiclo, guardarEvaluacion,
    obtenerMensajePorPromedio,
    // utilidades
    calcularPromedioEvaluacion,
    agruparPorCategoria,
    // observaciones
    fetchObservaciones, agregarObservacion, editarObservacion, eliminarObservacion,
    // permisos
    canEvaluar,
  };
}