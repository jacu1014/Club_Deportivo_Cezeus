/**
 * Manejador de Errores de Autenticación
 * Intercepta errores 401 y reintenta la operación
 */

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb) => {
  refreshSubscribers.push(cb);
};

export const setupAuthErrorHandler = (supabase) => {
  console.log('🔐 Sistema de autenticación inicializado');
};

/**
 * Maneja automáticamente errores 401 refrescando el token
 */
export const createAuthErrorHandler = (supabase) => {
  return {
    handleError: async (error) => {
      // Si no es error de autenticación, no hacemos nada
      if (error?.status !== 401 && !error?.message?.includes('jwt')) {
        return false;
      }

      console.warn('⚠️ Error 401 detectado, intentando refrescar...');

      // Si otra operación ya está refrescando, esperar
      if (isRefreshing) {
        return new Promise(resolve => {
          addRefreshSubscriber(() => resolve(true));
        });
      }

      isRefreshing = true;

      try {
        const { data, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !data.session) {
          throw refreshError || new Error('No session after refresh');
        }

        console.log('✅ Token refrescado exitosamente');
        isRefreshing = false;
        onRefreshed(true);
        return true;
      } catch (err) {
        console.error('❌ No se pudo refrescar el token:', err);
        isRefreshing = false;
        
        // Logout automático
        await supabase.auth.signOut();
        
        // Redirigir al login después de un pequeño delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
        
        return false;
      }
    }
  };
};

