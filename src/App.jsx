import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { ROLE_PERMISSIONS, PaginasApp } from './types'; 
import { Analytics } from '@vercel/analytics/react';

// Layouts y Páginas
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import MainLayout from './layouts/MainLayout';
import Alumnos from './pages/Alumnos';
import Configuracion from './pages/Configuracion'; 
import PagosModule from './pages/PagosModule';
import CalendarioPage from './pages/CalendarioPage';
import Nosotros from './pages/Nosotros';
import DashboardPage from './pages/DashboardPage';
import NotificacionesPage from './pages/NotificacionesPage';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para obtener datos extendidos del usuario desde la tabla 'usuarios'
  const fetchUserData = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error al obtener datos del usuario:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initApp = async () => {
      try {
        // Intentamos recuperar la sesión persistente de Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session?.user && isMounted) {
          const dbUser = await fetchUserData(session.user.id);
          if (isMounted) {
            setUser(dbUser || { 
              id: session.user.id, 
              primer_nombre: 'Usuario', 
              primer_apellido: 'Cezeus', 
              rol: 'ALUMNO' 
            });
          }
        }
      } catch (error) {
        console.error("Error crítico en initApp:", error.message);
        if (isMounted) setUser(null);
      } finally {
        // ESTO ES CLAVE: pase lo que pase, dejamos de mostrar la pantalla de carga
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initApp();

    // Escuchamos cambios de estado (Login, Logout, Token renovado)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user) {
          const dbUser = await fetchUserData(session.user.id);
          if (isMounted) {
            setUser(dbUser || { id: session.user.id, primer_nombre: 'Usuario', rol: 'ALUMNO' });
            setLoading(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  // Validación de permisos según el rol del usuario
  const canAccess = (page) => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.rol]?.includes(page) || false;
  };

  // Función para determinar la ruta de inicio según el rol
  const getHomeRoute = () => {
    if (!user) return "/login";
    return user.rol === 'ALUMNO' ? "/alumnos" : "/dashboard";
  };

  // Pantalla de carga mientras se sincroniza la sesión
  if (loading) {
    return (
      <div className="min-h-screen bg-[#05080d] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-cyan-400/10 border-t-cyan-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-cyan-400/30 rounded-full animate-pulse"></div>
        </div>
        <p className="text-cyan-400 text-[9px] font-black uppercase tracking-[0.4em] mt-6 animate-pulse">
          Sincronizando Cezeus
        </p>
      </div>
    );
  }

  return ( 
    <>
      <Router>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to={getHomeRoute()} replace />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Rutas Protegidas */}
          <Route path="/dashboard" element={user && canAccess(PaginasApp.DASHBOARD) ? (
            <MainLayout user={user}><DashboardPage user={user} /></MainLayout>
          ) : <Navigate to="/login" replace />} />

          <Route path="/notificaciones" element={user && canAccess(PaginasApp.NOTIFICACIONES) ? (
            <MainLayout user={user}><NotificacionesPage user={user} /></MainLayout>
          ) : <Navigate to={user ? "/dashboard" : "/login"} replace />} />

          <Route path="/nosotros" element={user && canAccess(PaginasApp.NOSOTROS) ? (
            <MainLayout user={user}><Nosotros /></MainLayout>
          ) : <Navigate to="/login" replace />} />
          
          <Route path="/alumnos" element={user && canAccess(PaginasApp.ALUMNOS) ? (
            <MainLayout user={user}><Alumnos /></MainLayout>
          ) : <Navigate to={user ? "/calendario" : "/login"} replace />} />

          <Route path="/calendario" element={user && canAccess(PaginasApp.CALENDARIO) ? (
            <MainLayout user={user}><CalendarioPage userRol={user.rol} /></MainLayout>
          ) : <Navigate to="/login" replace />} />

          <Route path="/configuracion" element={user && canAccess(PaginasApp.CONFIGURACION) ? (
            <MainLayout user={user}><Configuracion user={user} /></MainLayout>
          ) : <Navigate to="/login" replace />} />

          <Route path="/pagos" element={user && canAccess(PaginasApp.PAGOS) ? (
            <MainLayout user={user}><PagosModule user={user} /></MainLayout>
          ) : <Navigate to="/login" replace />} />

          {/* Fallbacks y Redirecciones Automáticas */}
          <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
          <Route path="*" element={<Navigate to={getHomeRoute()} replace />} />
        </Routes>
      </Router>
      <Analytics />
    </>
  );
}

export default App;
