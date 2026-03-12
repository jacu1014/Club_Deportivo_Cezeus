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

// Componentes
import TermsModal from './components/TermsModal';

// --- COMPONENTE DE RUTA PROTEGIDA ---
const ProtectedRoute = ({ user, page, canAccess, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  
  if (!canAccess(page)) {
    const fallback = user.rol === 'ALUMNO' ? "/alumnos" : "/calendario";
    return <Navigate to={fallback} replace />;
  }

  return <MainLayout user={user}>{children}</MainLayout>;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [legalText, setLegalText] = useState('');

  const canAccess = useCallback((page) => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.rol]?.includes(page);
  }, [user]);

  // 1. Cargar texto legal
  useEffect(() => {
    const fetchLegal = async () => {
      try {
        const { data, error } = await supabase
          .from('configuraciones_club')
          .select('descripcion')
          .eq('nombre_tarifa', 'legal_consentimiento')
          .maybeSingle();
        if (error) throw error;
        if (data) setLegalText(data.descripcion);
      } catch (err) {
        console.error("Error cargando consentimiento:", err.message);
      }
    };
    fetchLegal();
  }, []);

  // 2. Lógica de Autenticación y Despertar de Inactividad
  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async (userId) => {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (error) throw error;
        return data;
      } catch (e) {
        console.error("Error recuperando perfil:", e.message);
        return null;
      }
    };

    const updateUserData = async (session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (isMounted) {
          setUser(profile || { 
            id: session.user.id, 
            primer_nombre: 'Usuario', 
            rol: 'ALUMNO', 
            acepta_terminos: false 
          });
        }
      } else {
        if (isMounted) setUser(null);
      }
    };

    const initApp = async () => {
      const timeout = setTimeout(() => {
        if (isMounted && loading) setLoading(false);
      }, 6000);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        await updateUserData(session);
      } catch (error) {
        console.error("Error inicializando:", error.message);
      } finally {
        if (isMounted) {
          setLoading(false);
          clearTimeout(timeout);
        }
      }
    };

    initApp();

    // Listener de Supabase para eventos de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Manejamos el refresco del token explícitamente
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await updateUserData(session);
      }
      if (event === 'SIGNED_OUT') {
        if (isMounted) setUser(null);
      }
    });

    // --- SOLUCIÓN PARA LA INACTIVIDAD ---
    // Cuando el usuario vuelve a la pestaña, forzamos un chequeo de sesión
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) await updateUserData(session);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const getDefaultRoute = () => {
    if (!user) return "/login";
    return user.rol === 'ALUMNO' ? "/alumnos" : "/calendario";
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
          <Route path="/login" element={!user ? <Login /> : <Navigate to={getDefaultRoute()} replace />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {[
            { path: "/dashboard", page: PaginasApp.DASHBOARD, component: DashboardPage },
            { path: "/notificaciones", page: PaginasApp.NOTIFICACIONES, component: NotificacionesPage },
            { path: "/nosotros", page: PaginasApp.NOSOTROS, component: Nosotros },
            { path: "/alumnos", page: PaginasApp.ALUMNOS, component: Alumnos },
            { path: "/calendario", page: PaginasApp.CALENDARIO, component: CalendarioPage },
            { path: "/configuracion", page: PaginasApp.CONFIGURACION, component: Configuracion },
            { path: "/pagos", page: PaginasApp.PAGOS, component: PagosModule },
          ].map(({ path, page, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute user={user} page={page} canAccess={canAccess}>
                  <Component user={user} userRol={user?.rol} />
                </ProtectedRoute>
              }
            />
          ))}

          <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
          <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
        </Routes>
      </Router>

      {user && user.acepta_terminos === false && legalText && (
        <TermsModal 
          user={user} 
          content={legalText} 
          onAccepted={() => setUser(prev => ({ ...prev, acepta_terminos: true }))} 
        />
      )}

      <Analytics />
    </>
  );
}

export default App;
