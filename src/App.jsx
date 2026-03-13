import React, { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { ROLE_PERMISSIONS, PaginasApp } from './types';
import { Analytics } from '@vercel/analytics/react';

import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import MainLayout from './layouts/MainLayout';
import TermsModal from './components/TermsModal';

const Alumnos            = lazy(() => import('./pages/Alumnos'));
const Configuracion      = lazy(() => import('./pages/Configuracion'));
const PagosModule        = lazy(() => import('./pages/PagosModule'));
const CalendarioPage     = lazy(() => import('./pages/CalendarioPage'));
const Nosotros           = lazy(() => import('./pages/Nosotros'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const NotificacionesPage = lazy(() => import('./pages/NotificacionesPage'));

const PageSpinner = () => (
  <div className="min-h-screen bg-[#05080d] flex flex-col items-center justify-center">
    <div className="w-10 h-10 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
    <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Cargando módulo...</p>
  </div>
);

const RoutePreserver = () => {
  const location = useLocation();
  useEffect(() => {
    if (!['/login', '/reset-password'].includes(location.pathname)) {
      sessionStorage.setItem('last_route', location.pathname);
    }
  }, [location.pathname]);
  return null;
};

function App() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [legalText, setLegalText] = useState(null); // null = aún cargando, '' = cargado vacío
  const isUserLoaded = useRef(false);

  const canAccess = useCallback((page) => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.rol]?.includes(page);
  }, [user]);

  // Carga del texto legal — null mientras carga, string cuando termina
  useEffect(() => {
    const fetchLegal = async () => {
      try {
        const { data } = await supabase
          .from('configuraciones_club')
          .select('descripcion')
          .eq('nombre_tarifa', 'legal_consentimiento')
          .maybeSingle();
        setLegalText(data?.descripcion || 'Al continuar, aceptas los términos y condiciones de participación del Club Deportivo Cezeus.');
      } catch {
        setLegalText(''); // en caso de error, no bloquear
      }
    };
    fetchLegal();
  }, []);

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
      } catch {
        return null;
      }
    };

    const updateUserData = async (session, forceRefresh = false) => {
      if (!session?.user) {
        if (isMounted) {
          setUser(null);
          isUserLoaded.current = false;
          setLoading(false);
        }
        return;
      }

      const roleFromToken = session.user.user_metadata?.rol || 'ALUMNO';

      if (isUserLoaded.current && !forceRefresh) {
        if (user?.rol !== roleFromToken && isMounted) {
          setUser(prev => ({ ...prev, rol: roleFromToken }));
        }
        return;
      }

      const profile = await fetchUserProfile(session.user.id);

      if (isMounted) {
        const finalUser = profile
          ? { ...profile, rol: roleFromToken }
          : {
              id: session.user.id,
              primer_nombre: session.user.user_metadata?.first_name || 'Usuario',
              rol: roleFromToken,
              acepta_terminos: false
            };
        setUser(finalUser);
        isUserLoaded.current = true;
        setLoading(false);
      }
    };

    const initApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // CORREGIDO: siempre cargar el perfil al iniciar, incluye F5
          await updateUserData(session, true);
        } else {
          if (isMounted) setLoading(false);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // CORREGIDO: manejar INITIAL_SESSION con y sin sesión
      if (event === 'INITIAL_SESSION') {
        if (!session && isMounted) setLoading(false);
        // Si hay sesión, initApp ya la manejó — no hacer nada para evitar doble carga
        return;
      }

      if (event === 'SIGNED_IN') {
        await updateUserData(session, true);
      } else if (event === 'TOKEN_REFRESHED') {
        await updateUserData(session, false);
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          isUserLoaded.current = false;
          setLoading(false);
          // CORREGIDO: limpiar la ruta guardada al cerrar sesión
          sessionStorage.removeItem('last_route');
        }
      }
    });

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) await updateUserData(session, false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05080d] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Sincronizando Sistema</p>
      </div>
    );
  }

  const defaultPath  = user?.rol === 'ALUMNO' ? "/alumnos" : "/calendario";
  const lastRoute    = sessionStorage.getItem('last_route');
  const redirectPath = lastRoute && user ? lastRoute : defaultPath;

console.log('DEBUG TERMS:', {
  user_id: user?.id,
  acepta_terminos: user?.acepta_terminos,
  tipo: typeof user?.acepta_terminos,
  legalText: legalText,
  legalText_es_null: legalText === null
});

  // CORREGIDO: mostrar TermsModal solo cuando legalText ya cargó (no null)
  // y el usuario tiene acepta_terminos en false o null
  const mostrarTerms = user && !user.acepta_terminos && legalText !== null;

  return (
    <>
      <Router>
        <RoutePreserver />
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/login"          element={!user ? <Login /> : <Navigate to={redirectPath} replace />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/dashboard" element={
              user && canAccess(PaginasApp.DASHBOARD)
                ? <MainLayout user={user}><DashboardPage user={user} /></MainLayout>
                : <Navigate to={user ? defaultPath : "/login"} replace />
            } />
            <Route path="/notificaciones" element={
              user && canAccess(PaginasApp.NOTIFICACIONES)
                ? <MainLayout user={user}><NotificacionesPage user={user} /></MainLayout>
                : <Navigate to={user ? defaultPath : "/login"} replace />
            } />
            <Route path="/nosotros" element={
              user && canAccess(PaginasApp.NOSOTROS)
                ? <MainLayout user={user}><Nosotros /></MainLayout>
                : <Navigate to={user ? defaultPath : "/login"} replace />
            } />
            <Route path="/alumnos" element={
              user && canAccess(PaginasApp.ALUMNOS)
                ? <MainLayout user={user}><Alumnos /></MainLayout>
                : <Navigate to={user ? defaultPath : "/login"} replace />
            } />
            <Route path="/calendario" element={
              user && canAccess(PaginasApp.CALENDARIO)
                ? <MainLayout user={user}><CalendarioPage userRol={user.rol} /></MainLayout>
                : <Navigate to={user ? defaultPath : "/login"} replace />
            } />
            <Route path="/configuracion" element={
              user && canAccess(PaginasApp.CONFIGURACION)
                ? <MainLayout user={user}><Configuracion user={user} /></MainLayout>
                : <Navigate to={user ? defaultPath : "/login"} replace />
            } />
            <Route path="/pagos" element={
              user && canAccess(PaginasApp.PAGOS)
                ? <MainLayout user={user}><PagosModule user={user} /></MainLayout>
                : <Navigate to={user ? defaultPath : "/login"} replace />
            } />

            <Route path="/"  element={<Navigate to={user ? redirectPath : "/login"} replace />} />
            <Route path="*"  element={<Navigate to={user ? redirectPath : "/login"} replace />} />
          </Routes>
        </Suspense>
      </Router>

      {mostrarTerms && (
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