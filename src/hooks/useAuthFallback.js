/**
 * Hook: useAuthFallback
 * Maneja errores de autenticación en componentes
 * Refresca la sesión automáticamente si detecta error 401
 * 
 * Uso:
 * const { handleAuthError } = useAuthFallback();
 * const { data, error } = await supabase.from(...).select(...);
 * if (error) {
 *   const recovered = await handleAuthError(error);
 *   if (recovered) { retry... }
 * }
 */

import { useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useAuthFallback = () => {
  const handleAuthError = useCallback(async (error) => {
    if (!error) return false;

    // Detectar error de autenticación
    const is401 = error.status === 401;
    const isJWTError = error.message?.includes('jwt') || 
                       error.message?.includes('token') ||
                       error.message?.includes('unauthorized');

    if (is401 || isJWTError) {
      console.warn('⚠️ Error de autenticación:', error.message);
      
      try {
        // Intentar obtener sesión actual
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
        
        if (getSessionError) throw getSessionError;
        
        if (session) {
          // Refrescar el token
          const { error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) throw refreshError;
          
          console.log('✅ Sesión refrescada - reintentando operación');
          return true; // Señal para reintentar
        } else {
          // No hay sesión válida, redirigir al login
          console.log('🔓 Sin sesión activa, redirigiendo a login');
          window.location.href = '/login';
          return false;
        }
      } catch (err) {
        console.error('❌ No se pudo recuperar la autenticación:', err);
        // Forzar logout y redirigir
        await supabase.auth.signOut();
        window.location.href = '/login';
        return false;
      }
    }

    return false;
  }, []);

  return { handleAuthError };
};
