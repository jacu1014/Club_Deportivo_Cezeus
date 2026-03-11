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

    // 1. Si no se provee un ID, intentamos obtener el de la sesión actual
    if (!finalUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        finalUserId = user.id;
      }
    }

    if (!finalUserId) {
      console.warn("⚠️ No se pudo registrar el log: No hay identificador de usuario.");
      return;
    }

    // 2. Insertar en la tabla 'actividad' con las columnas exactas de tu DB
    const { error } = await supabase.from('actividad').insert([
      {
        usuario_id: finalUserId,
        accion: accion.toUpperCase(),
        descripcion: descripcion,
        modulo: modulo.toUpperCase(),
        detalles: detalles, 
        fecha: new Date().toISOString()
      }
    ]);

    if (error) throw error;

  } catch (error) {
    console.error("❌ Error al registrar log de actividad:", error.message);
  }
};