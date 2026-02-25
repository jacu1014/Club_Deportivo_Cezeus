import { supabase } from './supabaseClient';

/**
 * Registra una actividad en la tabla 'actividad'
 * @param {string} accion - Ejemplo: 'REGISTRO', 'ELIMINACION', 'ACTUALIZACION'
 * @param {string} descripcion - Texto descriptivo de la acción
 * @param {string} modulo - Módulo donde ocurre (ej: 'ALUMNOS', 'PAGOS')
 * @param {object} detalles - Objeto con datos adicionales (se guardará como JSONB)
 */
export const registrarLog = async (accion, descripcion, modulo = 'SISTEMA', detalles = {}) => {
  try {
    // 1. Obtener la sesión actual para saber quién hace la acción
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn("⚠️ No se pudo registrar el log: No hay usuario autenticado.");
      return;
    }

    // 2. Insertar en la tabla 'actividad'
    const { error } = await supabase.from('actividad').insert([
      {
        usuario_id: user.id,
        accion: accion.toUpperCase(),
        descripcion: descripcion,
        modulo: modulo.toUpperCase(),
        detalles: detalles, // Supabase maneja el objeto JS como JSONB automáticamente
        fecha: new Date().toISOString()
      }
    ]);

    if (error) throw error;

  } catch (error) {
    console.error("❌ Error al registrar log de actividad:", error.message);
  }
};