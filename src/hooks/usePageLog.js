// src/hooks/usePageLog.js
import { useEffect } from 'react';
import { registrarLog } from '../lib/activity';

/**
 * Hook que registra automáticamente la visita a una página.
 * Uso: usePageLog('DASHBOARD')  <- una sola línea en cada página
 * 
 * @param {string} nombrePagina - Nombre del módulo (ej: 'DASHBOARD', 'PAGOS')
 * @param {object} detallesExtra - Info adicional opcional
 */
export const usePageLog = (nombrePagina, detallesExtra = {}) => {
  useEffect(() => {
    registrarLog({
      accion: 'VISITA_PAGINA',
      modulo: nombrePagina.toUpperCase(),
      descripcion: `Usuario navegó a: ${nombrePagina}`,
      detalles: {
        ...detallesExtra,
        ruta: window.location.pathname,
        timestamp: new Date().toISOString()
      }
    }).catch(() => {}); // silencioso si falla el log
  }, []); // solo al montar el componente
};