import React, { useEffect, useState } from 'react';
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

  // Función para obtener perfil de la DB sin repetir código
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error al obtener perfil de usuario:", err);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && isMounted) {
          const dbUser = await fetchUserProfile(session.user.id);
          setUser(dbUser || { 
            id: session.user.id, 
            primer_nombre: 'Usuario', 
            primer_apellido: 'Cezeus', 
            rol: 'ALUMNO' 
          });
        }
      } catch (error) {
        console.error("Error en inicialización:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initApp();

    // Listener de cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const dbUser = await fetchUserProfile(session.user.id);
        if (isMounted) setUser(dbUser || { id: session.user.id, primer_nombre: 'Usuario', rol: 'ALUMNO' });
      } else {
        if (isMounted) setUser(null);
      }
      // Aseguramos que el loading se apague tras cualquier cambio de estado
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const canAccess = (page) => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.rol]?.includes(page);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05080d] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Iniciando Cezeus</p>
      </div>
    );
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* DASHBOARD */}
          <Route 
            path="/dashboard" 
            element={
              user && canAccess(PaginasApp.DASHBOARD) ? (
                <MainLayout user={user}>
                  <DashboardPage user={user} />
                </MainLayout>
              ) : <Navigate to="/login" replace />
            } 
          />

          {/* NOTIFICACIONES */}
          <Route 
            path="/notificaciones" 
            element={
              user && canAccess(PaginasApp.NOTIFICACIONES) ? (
                <MainLayout user={user}>
                  <NotificacionesPage user={user} />
                </MainLayout>
              ) : <Navigate to={user ? "/dashboard" : "/login"} replace />
            } 
          />

          {/* NOSOTROS */}
          <Route 
            path="/nosotros" 
            element={
              user && canAccess(PaginasApp.NOSOTROS) ? (
                <MainLayout user={user}>
                  <Nosotros />
                </MainLayout>
              ) : <Navigate to="/login" replace />
            } 
          />
          
          {/* ALUMNOS */}
          <Route 
            path="/alumnos" 
            element={
              user && canAccess(PaginasApp.ALUMNOS) ? (
                <MainLayout user={user}>
                  <Alumnos />
                </MainLayout>
              ) : <Navigate to={user ? "/calendario" : "/login"} replace />
            } 
          />

          {/* CALENDARIO */}
          <Route 
            path="/calendario" 
            element={
              user && canAccess(PaginasApp.CALENDARIO) ? (
                <MainLayout user={user}>
                  <CalendarioPage userRol={user.rol} />
                </MainLayout>
              ) : <Navigate to="/login" replace />
            } 
          />

          {/* CONFIGURACIÓN */}
          <Route 
            path="/configuracion" 
            element={
              user && canAccess(PaginasApp.CONFIGURACION) ? (
                <MainLayout user={user}>
                  <Configuracion user={user} />
                </MainLayout>
              ) : <Navigate to="/login" replace />
            } 
          />

          {/* PAGOS */}
          <Route 
            path="/pagos" 
            element={
              user && canAccess(PaginasApp.PAGOS) ? (
                <MainLayout user={user}>
                  <PagosModule user={user} /> 
                </MainLayout>
              ) : <Navigate to="/login" replace />
            } 
          />

          {/* REDIRECCIONES POR DEFECTO */}
          <Route path="/" element={<Navigate to={user ? (user.rol === 'ALUMNO' ? "/alumnos" : "/calendario") : "/login"} replace />} />
          <Route path="*" element={<Navigate to={user ? (user.rol === 'ALUMNO' ? "/alumnos" : "/calendario") : "/login"} replace />} />
        </Routes>
      </Router>
      <Analytics />
    </>
  );
}

export default App;