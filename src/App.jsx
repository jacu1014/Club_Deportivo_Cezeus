import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { ROLE_PERMISSIONS, PaginasApp } from './types'; 
// NUEVO: Importación para Analítica de Vercel
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

  useEffect(() => {
    // Mantengo tu timeout: si algo falla con la red, la app arranca a los 5s
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("La carga inicial tardó demasiado. Forzando inicio...");
        setLoading(false);
      }
    }, 5000);

    const initApp = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError) throw authError;

        if (session?.user) {
          const { data: dbUser, error: dbError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (dbError) console.error("Error consultando tabla usuarios:", dbError);

          setUser(dbUser || { 
            id: session.user.id, 
            primer_nombre: 'Usuario', 
            primer_apellido: 'Cezeus', 
            rol: 'ALUMNO' 
          });
        }
      } catch (error) {
        console.error("Error crítico en initApp:", error.message);
      } finally {
        setLoading(false);
        clearTimeout(timeout);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        supabase.from('usuarios').select('*').eq('id', session.user.id).maybeSingle()
          .then(({ data }) => {
            setUser(data || { id: session.user.id, primer_nombre: 'Usuario', rol: 'ALUMNO' });
            setLoading(false); // Apaga el loading tras recuperar el perfil
          });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
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
          {/* Al entrar al login, si ya hay sesión, mandamos a /alumnos */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/alumnos" replace />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* RUTA PRINCIPAL: ALUMNOS */}
          <Route 
            path="/alumnos" 
            element={
              user && canAccess(PaginasApp.ALUMNOS) ? (
                <MainLayout user={user}>
                  <Alumnos />
                </MainLayout>
              ) : <Navigate to="/login" replace />
            } 
          />

          <Route 
            path="/dashboard" 
            element={
              user && canAccess(PaginasApp.DASHBOARD) ? (
                <MainLayout user={user}>
                  <DashboardPage user={user} />
                </MainLayout>
              ) : <Navigate to="/alumnos" replace />
            } 
          />

          <Route 
            path="/notificaciones" 
            element={
              user && canAccess(PaginasApp.NOTIFICACIONES) ? (
                <MainLayout user={user}>
                  <NotificacionesPage user={user} />
                </MainLayout>
              ) : <Navigate to="/alumnos" replace />
            } 
          />

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

          {/* Redirecciones automáticas a Alumnos */}
          <Route path="/" element={<Navigate to={user ? "/alumnos" : "/login"} replace />} />
          <Route path="*" element={<Navigate to={user ? "/alumnos" : "/login"} replace />} />
        </Routes>
      </Router>
      <Analytics />
    </>
  );
}

export default App;