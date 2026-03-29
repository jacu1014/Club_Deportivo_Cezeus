import { createClient } from '@supabase/supabase-js';
import { setupAuthErrorHandler } from './authErrorHandler';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Creamos la instancia una sola vez
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'cezeus-auth-token',
    storage: window.localStorage // Asegura persistencia física en el disco del navegador
  }
});

// 🔐 Configurar manejador de errores de autenticación
setupAuthErrorHandler(supabase);
