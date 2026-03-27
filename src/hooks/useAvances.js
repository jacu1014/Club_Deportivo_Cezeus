// src/hooks/useAvances.js
// VERSIÓN RECTIFICADA: Ajustada a la estructura real de Supabase (Tablas dinámicas)

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

// Caché externa para evitar saltos visuales al cambiar entre alumnos
const cacheItems = {};

export const useAvances = (currentUser) => {
  const [ciclos, setCiclos] = useState([]);
  const [loadingCiclos, setLoadingCiclos] = useState(true);

  // 1. Cargar Ciclos de Evaluación
  const fetchCiclos = useCallback(async () => {
    setLoadingCiclos(true);
    try {
      const { data, error } = await supabase
        .from('ciclos_evaluacion') // Nombre real de tu tabla
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCiclos(data || []);
    } catch (err) {
      console.error('Error fetchCiclos:', err.message);
    } finally {
      setLoadingCiclos(false);
    }
  }, []);

  useEffect(() => {
    fetchCiclos();
  }, [fetchCiclos]);

  // 2. Obtener Ítems configurados para un ciclo (Dinámico)
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

  // 3. Guardar Evaluación Completa (Cabecera + Detalle)
  const guardarEvaluacionCompleta = async ({ alumno_id, ciclo_id, tipo, observaciones, notas }) => {
    try {
      // A. Insertar en evaluaciones_avance (Cabecera)
      const { data: evalCabecera, error: errCabecera } = await supabase
        .from('evaluaciones_avance')
        .insert([{
          alumno_id,
          ciclo_id,
          entrenador_id: currentUser?.id,
          tipo, // 'INICIAL' o 'FINAL'
          fecha_evaluacion: new Date().toISOString().split('T')[0],
          observaciones
        }])
        .select()
        .single();

      if (errCabecera) throw errCabecera;

      // B. Preparar y insertar en evaluaciones_items (Detalle)
      // 'notas' debe ser un objeto: { [ciclo_item_id]: calificacion }
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
      console.error('Error en guardado completo:', err.message);
      throw err;
    }
  };

  // 4. Obtener Evaluaciones de un Ciclo (Para Resumen/Heatmap)
  const fetchEvaluacionesCiclo = useCallback(async (cicloId) => {
    try {
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
    } catch (err) {
      console.error('Error fetchEvaluacionesCiclo:', err.message);
      return [];
    }
  }, []);

  // 5. Helpers para Radar Chart
  const prepararDatosComparativos = (itemsCiclo, evalInicial, evalFinal) => {
    return itemsCiclo.map(item => {
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
    getItemsConCategorias,
    guardarEvaluacionCompleta,
    fetchEvaluacionesCiclo,
    prepararDatosComparativos,
    canEvaluar: ['SUPER_ADMIN', 'DIRECTOR', 'ENTRENADOR'].includes(currentUser?.rol)
  };
};