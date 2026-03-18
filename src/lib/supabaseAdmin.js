// src/lib/supabaseAdmin.js
// Ejecuta acciones administrativas a través de la Edge Function admin-action.
// La SERVICE_ROLE_KEY nunca toca el navegador — vive solo en la Edge Function.

import { supabase } from './supabaseClient';

export const adminAction = async (accion, datos = {}) => {
  // FIX: obtener el token de sesión explícitamente y enviarlo en el header
  // supabase.functions.invoke() a veces no propaga el Authorization header
  // cuando se llama desde dominios de producción diferentes al de Supabase
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('No hay sesión activa. Por favor inicia sesión nuevamente.');
  }

  const { data, error } = await supabase.functions.invoke('admin-action', {
    body: { accion, datos },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) throw error;
  return data;
};