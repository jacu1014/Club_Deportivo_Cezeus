// src/hooks/useAvances.js
// VERSIÓN OPTIMIZADA: Con Caché, Comparativas y Lógica Centralizada

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { registrarLog } from '../lib/activity';

// Objeto externo para persistir caché entre re-renders del hook
const cacheItems = {};

export const useAvances = (currentUser) => {
  const [ciclos, setCiclos] = useState([]);
  const [loadingCiclos, setLoadingCiclos] = useState(true);

  const fetchCiclos = useCallback(async () => {
    setLoadingCiclos(true);
    try {
      const { data, error } = await supabase
        .from('ciclos_avances')
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

  /** * Obtiene items de un ciclo con CACHÉ para optimizar fluidez 
   */
  const getItemsConCategorias = useCallback(async (cicloId) => {
    if (!cicloId) return [];
    if (cacheItems[cicloId]) return cacheItems[cicloId];

    try {
      const { data, error } = await supabase
        .from('ciclos_items')
        .select('*, categoria:categorias_base(*)')
        .eq('ciclo_id', cicloId)
        .order('orden');
      
      if (error) throw error;
      cacheItems[cicloId] = data || [];
      return cacheItems[cicloId];
    } catch (err) {
      console.error('Error getItemsConCategorias:', err.message);
      return [];
    }
  }, []);

  /**
   * Prepara datos para Radar Chart: Alumno (Inicial vs Final)
   */
  const prepararDatosComparativos = (itemsCiclo, evalInicial, evalFinal) => {
    return itemsCiclo.map(item => {
      const notaI = evalInicial?.items?.find(i => i.item_id === item.id)?.calificacion || 0;
      const notaF = evalFinal?.items?.find(i => i.item_id === item.id)?.calificacion || 0;
      return {
        subject: item.nombre,
        inicial: notaI,
        final: notaF,
        fullMark: 10,
      };
    });
  };

  /**
   * Prepara datos para Radar Chart: Versus entre dos alumnos
   */
  const prepararVersus = (itemsCiclo, evalAlumnoA, evalAlumnoB) => {
    return itemsCiclo.map(item => ({
      subject: item.nombre,
      alumnoA: evalAlumnoA?.items?.find(i => i.item_id === item.id)?.calificacion || 0,
      alumnoB: evalAlumnoB?.items?.find(i => i.item_id === item.id)?.calificacion || 0,
      fullMark: 10,
    }));
  };

  /**
   * Lógica de guardado con validación de ciclo activo
   */
  const guardarEvaluacion = async (payload, cicloActivo) => {
    if (!cicloActivo) throw new Error("No se pueden crear evaluaciones en un ciclo cerrado.");
    
    const { data, error } = await supabase
      .from('evaluaciones_procesos')
      .upsert([payload])
      .select();
    
    if (error) throw error;
    return data;
  };

  // --- LOGICA DE OBSERVACIONES (Simplificada y fluida) ---

  const fetchObservaciones = async (alumnoId) => {
    const { data, error } = await supabase
      .from('observaciones_seguimiento')
      .select('*')
      .eq('alumno_id', alumnoId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  };

  const agregarObservacion = async (alumno_id, nota, categoria_nota) => {
    const nombreAutor = `${currentUser?.primer_nombre || ''} ${currentUser?.primer_apellido || ''}`.trim();
    const { data, error } = await supabase
      .from('observaciones_seguimiento')
      .insert([{
        alumno_id,
        autor_id: currentUser?.id,
        autor_nombre: nombreAutor || 'Entrenador',
        nota,
        categoria_nota,
      }])
      .select().single();
    if (error) throw error;
    return data;
  };

  return {
    ciclos, 
    loadingCiclos, 
    fetchCiclos,
    getItemsConCategorias,
    prepararDatosComparativos,
    prepararVersus,
    guardarEvaluacion,
    fetchObservaciones,
    agregarObservacion,
    canEvaluar: ['SUPER_ADMIN', 'DIRECTOR', 'ENTRENADOR'].includes(currentUser?.rol),
    categoriasBase: [
      { id: 'tecnica', nombre: 'Técnica', icono: 'sports_soccer' },
      { id: 'fisica', nombre: 'Física', icono: 'fitness_center' },
      { id: 'tactica', nombre: 'Táctica', icono: 'strategy' },
      { id: 'psicologica', nombre: 'Psicológica', icono: 'psychology' }
    ]
  };
};