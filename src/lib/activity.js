// src/lib/activity.js
import { supabase } from './supabaseClient';

/**
 * Registra una actividad en la tabla 'actividad'
 * @param {Object} params - Parámetros del log
 */
export const registrarLog = async ({ 
  accion, 
  descripcion, 
  modulo = 'SISTEMA', 
  detalles = {}, 
  usuarioId = null 
}) => {
  try {
    let finalUserId = usuarioId;

    if (!finalUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) finalUserId = user.id;
    }

    // Sin usuario identificado no registramos
    if (!finalUserId) return;

    const { error } = await supabase.from('actividad').insert([{
      usuario_id: finalUserId,
      accion: accion.toUpperCase(),
      descripcion: descripcion,
      modulo: modulo.toUpperCase(),
      detalles: detalles,
      fecha: new Date().toISOString()
    }]);

    if (error) throw error;

  } catch {
    // Silencioso en produccion — los logs nunca deben romper el flujo principal
  }
};