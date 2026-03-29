/**
 * Hook: useAuthFallback
 * Reintenta operaciones automáticamente si fallan con 401
 * 
 * Uso:
 * const { executeWithAuthRetry } = useAuthFallback();
 * const { data, error } = await executeWithAuthRetry(() => 
 *   supabase.from('tabla').select()
 * );
 */

import { useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { createAuthErrorHandler } from '../lib/authErrorHandler';

export const useAuthFallback = () => {
  const authHandler = createAuthErrorHandler(supabase);

  const executeWithAuthRetry = useCallback(async (operation, maxRetries = 2) => {
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        // Ejecutar la operación (debe retornar { data, error })
        const result = await operation();
        
        // Si hay error 401, intentar refrescar
        if (result?.error?.status === 401) {
          const recovered = await authHandler.handleError(result.error);
          if (recovered && attempt < maxRetries - 1) {
            attempt++;
            continue; // Reintentar
          }
        }
        
        // Retornar resultado (éxito o error final)
        return result;
      } catch (err) {
        console.error(`Error en intento ${attempt + 1}:`, err);
        
        // Si es error de autenticación, intentar refrescar
        if (err.message?.includes('401') || err.message?.includes('jwt')) {
          const recovered = await authHandler.handleError(err);
          if (recovered && attempt < maxRetries - 1) {
            attempt++;
            continue;
          }
        }
        
        // Si es el último intento o error no-auth, retornar error
        throw err;
      }
    }
  }, [authHandler]);

  return { executeWithAuthRetry };
};
