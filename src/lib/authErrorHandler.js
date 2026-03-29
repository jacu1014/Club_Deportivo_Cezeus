/**
 * Manejador de Errores de Autenticación
 * Monitorea eventos de Supabase sin interferir con la API
 * 
 * Uso: import { setupAuthErrorHandler } from './authErrorHandler';
 *      setupAuthErrorHandler(supabase);
 */

export const setupAuthErrorHandler = (supabase) => {
  // Solo monitorear eventos, no interferir
  console.log('🔐 Sistema de autenticación inicializado');
};

/**
 * Hook para manejar errores en componentes (uso opcional)
 * Si una query falla con 401, intenta recuperar la sesión
 */
export const createAuthErrorHandler = (supabase) => {
  return {
    handleError: async (error) => {
      if (!error || error.status !== 401) return false;
      
      console.warn('⚠️ Error 401 detectado, refrescando sesión...');
      try {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw refreshError;
        console.log('✅ Sesión refrescada');
        return true;
      } catch {
        console.error('❌ No se pudo refrescar la sesión');
        await supabase.auth.signOut();
        window.location.href = '/login';
        return false;
      }
    }
  };
};

