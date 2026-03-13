import { supabase } from './supabaseClient'

/**
 * Ejecuta acciones administrativas a través de la Edge Function.
 * La SERVICE_ROLE_KEY nunca toca el navegador.
 * @param {string} accion - 'crear-usuario' | 'eliminar-usuario' | 'actualizar-rol'
 * @param {object} datos  - Parámetros de la acción
 */
export const adminAction = async (accion, datos = {}) => {
  const { data, error } = await supabase.functions.invoke('admin-action', {
    body: { accion, datos }
  })
  if (error) throw error
  return data
}