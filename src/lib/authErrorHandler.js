/**
 * Manejador de Errores de Autenticación
 * Intercepta errores 401 y reintenta sincronizar la sesión
 * 
 * Uso: import { setupAuthErrorHandler } from './authErrorHandler';
 *      setupAuthErrorHandler(supabase);
 */

export const setupAuthErrorHandler = (supabase) => {
  // Interceptor de errores de autenticación
  const authErrorInterceptor = async (error) => {
    // Si es error 401 (token expirado/inválido)
    if (error.status === 401 || error.message?.includes('jwt expired')) {
      console.warn('⚠️ Token expirado, intentando refrescar sesión...');
      
      try {
        // Intentar refrescar el token
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) throw refreshError;
        
        console.log('✅ Sesión refrescada exitosamente');
        return true; // Indicar que se debe reintentar
      } catch (err) {
        console.error('❌ No se pudo refrescar la sesión:', err);
        // Forzar logout si no se puede refrescar
        await supabase.auth.signOut();
        return false;
      }
    }
    return false;
  };

  // Interceptor global para todas las llamadas a Supabase
  // Envolvemos los métodos principales de la API
  const originalFrom = supabase.from.bind(supabase);
  
  supabase.from = function(table) {
    const tableClient = originalFrom(table);
    
    // Wrapper para select, insert, update, delete
    const wrapWithErrorHandling = (method) => {
      return async function(...args) {
        try {
          const result = await method.apply(this, args);
          
          // Revisar si hay error en la respuesta
          if (result.error?.status === 401) {
            const shouldRetry = await authErrorInterceptor(result.error);
            if (shouldRetry) {
              // Reintentar la operación
              return await method.apply(this, args);
            }
          }
          
          return result;
        } catch (err) {
          if (err.status === 401 || err.message?.includes('jwt')) {
            const shouldRetry = await authErrorInterceptor(err);
            if (shouldRetry) {
              return await method.apply(this, args);
            }
          }
          throw err;
        }
      };
    };
    
    // Aplicar wrapper a los métodos principales
    if (tableClient.select) tableClient.select = wrapWithErrorHandling(tableClient.select);
    if (tableClient.insert) tableClient.insert = wrapWithErrorHandling(tableClient.insert);
    if (tableClient.update) tableClient.update = wrapWithErrorHandling(tableClient.update);
    if (tableClient.delete) tableClient.delete = wrapWithErrorHandling(tableClient.delete);
    
    return tableClient;
  };

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
