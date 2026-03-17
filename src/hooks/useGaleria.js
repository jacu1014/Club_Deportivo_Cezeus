// src/pages/landing/hooks/useGaleria.js
// Hook que carga las fotos públicas de la galería desde Supabase.
// La tabla `galeria_publica` debe tener:
//   id, url (text), descripcion (text), orden (int), activa (bool)
// Con una política RLS de SELECT pública.

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export function useGaleria() {
  const [fotos, setFotos]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let mounted = true;

    const cargar = async () => {
      try {
        const { data, error: err } = await supabase
          .from('galeria_publica')
          .select('id, url, descripcion, orden')
          .eq('activa', true)
          .order('orden', { ascending: true });

        if (err) throw err;
        if (mounted) setFotos(data || []);
      } catch (e) {
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    cargar();
    return () => { mounted = false; };
  }, []);

  return { fotos, loading, error };
}