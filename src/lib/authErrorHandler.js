/**
 * Manejador de Errores de Autenticación
 * Escucha cambios de sesión y maneja errores sin interferir con la API
 * 
 * Uso: import { setupAuthErrorHandler } from './authErrorHandler';
 *      setupAuthErrorHandler(supabase);
 */

export const setupAuthErrorHandler = (supabase) => {
  // Manejador de errores de autenticación
  const handleAuthError = async (error) => {
    // Si es error 401 (token expirado/inválido)
    if (error?.status === 401 || error?.message?.includes('jwt')) {
      console.warn('⚠️ Token expirado, intentando refrescar sesión...');
      
      try {
        // Intentar refrescar el token
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) throw refreshError;
        
        console.log('✅ Sesión refrescada exitosamente');
        return true;
      } catch (err) {
        console.error('❌ No se pudo refrescar la sesión:', err);
        await supabase.auth.signOut();
        window.location.href = '/login';
        return false;
      }
    }
    return false;
  };

  // Escuchar cambios de autenticación automáticamente
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('✅ Token refrescado automáticamente por Supabase');
    } else if (event === 'SIGNED_OUT') {
      console.log('🔓 Sesión cerrada');
    }
  });

  // Guardar referencia global para uso en componentes
  window.__supabaseAuthHandler = handleAuthError;

  console.log('🔐 Manejador de errores de autenticación activado');
};

/**
 * Hook para manejar errores de Supabase en componentes
 * Uso: const { handleError } = useAuthErrorHandler();
 *      const { data, error } = await supabase.from(...);
 *      if (error) await handleError(error);
 */
export const createAuthErrorHandler = (supabase) => {
  return {
    handleError: async (error) => {
      if (!error) return false;
      
      if (error.status === 401 || error.message?.includes('jwt')) {
        console.warn('⚠️ Error de autenticación detectado:', error.message);
        
        try {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) throw refreshError;
          
          console.log('✅ Sesión sincronizada');
          return true;
        } catch (err) {
          console.error('❌ No se puede recuperar la sesión:', err);
          await supabase.auth.signOut();
          // Redirigir al login
          window.location.href = '/login';
          return false;
        }
      }
      
      return false;
    }
  };
};
