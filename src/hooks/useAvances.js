// src/hooks/useAvances.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const cacheItems = {};

export const useAvances = (currentUser) => {
  // Siempre inicializamos con un array vacío para evitar errores de .map()
  const [ciclos, setCiclos] = useState([]);
  const [loadingCiclos, setLoadingCiclos] = useState(true);

  // 1. Cargar Ciclos de Evaluación
  const fetchCiclos = useCallback(async () => {
    setLoadingCiclos(true);
    try {
      const { data, error } = await supabase
        .from('ciclos_evaluacion')
        .select('*')
        .order('fecha_inicio', { ascending: false });
      
      if (error) throw error;
      
      // Garantizamos que si data es null, se guarde un array vacío
      setCiclos(data || []);
    } catch (err) {
      console.error('Error fetchCiclos:', err.message);
      setCiclos([]); 
    } finally {
      setLoadingCiclos(false);
    }
  }, []);

  useEffect(() => {
    fetchCiclos();
  }, [fetchCiclos]);

  // 2. Gestión de Ciclos (Crear, Toggle, Eliminar)
  const crearCiclo = async (payload) => {
    try {
      const { data, error } = await supabase
        .from('ciclos_evaluacion')
        .insert([payload])
        .select()
        .single();
        
      if (error) throw error;
      
      // Actualizamos la lista local inmediatamente después de crear
      await fetchCiclos();
      return data;
    } catch (err) {
      console.error('Error al crear ciclo:', err.message);
      throw err;
    }
  };

  const toggleCiclo = async (id, estadoActual) => {
    const { error } = await supabase
      .from('ciclos_evaluacion')
      .update({ activo: !estadoActual })
      .eq('id', id);
    if (error) throw error;
  };

  const eliminarCiclo = async (id) => {
    const { error } = await supabase
      .from('ciclos_evaluacion')
      .delete()
      .eq('id', id);
    if (error) throw error;
    // Se recomienda llamar a fetchCiclos() en el componente tras esta promesa
  };

  // 3. Ítems del Ciclo
  const getItemsConCategorias = useCallback(async (cicloId) => {
    if (!cicloId) return [];
    if (cacheItems[cicloId]) return cacheItems[cicloId];

    try {
      const { data, error } = await supabase
        .from('ciclos_items')
        .select('*')
        .eq('ciclo_id', cicloId)
        .order('orden', { ascending: true });
      
      if (error) throw error;
      cacheItems[cicloId] = data || [];
      return cacheItems[cicloId];
    } catch (err) {
      console.error('Error getItemsConCategorias:', err.message);
      return [];
    }
  }, []);

  // 4. Guardado de Evaluación Completa
  const guardarEvaluacionCompleta = async ({ alumno_id, ciclo_id, tipo, observaciones, notas }) => {
    try {
      const { data: evalCabecera, error: errCabecera } = await supabase
        .from('evaluaciones_avance')
        .insert([{
          alumno_id,
          ciclo_id,
          entrenador_id: currentUser?.id,
          tipo,
          fecha_evaluacion: new Date().toISOString().split('T')[0],
          observaciones
        }])
        .select()
        .single();

      if (errCabecera) throw errCabecera;

      const registrosNotas = Object.entries(notas).map(([itemId, valor]) => ({
        evaluacion_id: evalCabecera.id,
        ciclo_item_id: itemId,
        calificacion: valor
      }));

      const { error: errNotas } = await supabase
        .from('evaluaciones_items')
        .insert(registrosNotas);

      if (errNotas) throw errNotas;
      return evalCabecera;
    } catch (err) {
      throw err;
    }
  };

  // 5. Observaciones de Seguimiento
  const fetchObservaciones = useCallback(async (alumnoId) => {
    const { data, error } = await supabase
      .from('observaciones_seguimiento')
      .select('*')
      .eq('alumno_id', alumnoId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }, []);

  const agregarObservacion = async (payload) => {
    const { data, error } = await supabase
      .from('observaciones_seguimiento')
      .insert([{ ...payload, entrenador_id: currentUser?.id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const editarObservacion = async (id, nota, categoria) => {
    const { data, error } = await supabase
      .from('observaciones_seguimiento')
      .update({ nota, categoria })
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

  // 6. Reportes y Comparativas
  const fetchEvaluacionesCiclo = useCallback(async (cicloId) => {
    const { data, error } = await supabase
      .from('evaluaciones_avance')
      .select(`
        *,
        usuarios:alumno_id (id, primer_nombre, primer_apellido, foto_url),
        evaluaciones_items (*)
      `)
      .eq('ciclo_id', cicloId);
    if (error) throw error;
    return data || [];
  }, []);

  const prepararDatosComparativos = (itemsCiclo, evalInicial, evalFinal) => {
    return (itemsCiclo || []).map(item => {
      const notaI = evalInicial?.evaluaciones_items?.find(i => i.ciclo_item_id === item.id)?.calificacion || 0;
      const notaF = evalFinal?.evaluaciones_items?.find(i => i.ciclo_item_id === item.id)?.calificacion || 0;
      return {
        subject: item.nombre,
        inicial: notaI,
        final: notaF,
        fullMark: 100,
      };
    });
  };

  return {
    ciclos,
    loadingCiclos,
    fetchCiclos,
    crearCiclo,
    toggleCiclo,
    eliminarCiclo,
    getItemsConCategorias,
    guardarEvaluacionCompleta,
    fetchObservaciones,
    agregarObservacion,
    editarObservacion,
    eliminarObservacion,
    fetchEvaluacionesCiclo,
    prepararDatosComparativos,
    canEvaluar: ['SUPER_ADMIN', 'DIRECTOR', 'ENTRENADOR'].includes(currentUser?.rol)
  };
};