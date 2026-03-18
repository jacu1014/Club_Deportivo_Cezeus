// src/lib/supabaseAdmin.js
import { supabase } from './supabaseClient';

export const adminAction = async (accion, datos = {}) => {
  // Obtener sesión activa
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('No hay sesión activa. Por favor inicia sesión nuevamente.');
  }

  const { data, error } = await supabase.functions.invoke('admin-action', {
    body: {
      accion,
      datos,
      token: session.access_token, // fallback por si el header no llega
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) throw error;
  return data;
};