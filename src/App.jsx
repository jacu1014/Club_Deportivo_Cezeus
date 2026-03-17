// src/App.jsx
import React, { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { ROLE_PERMISSIONS, PaginasApp } from './types';
import { Analytics } from '@vercel/analytics/react';
import Login          from './pages/Login';
import ResetPassword  from './pages/ResetPassword';
import MainLayout     from './layouts/MainLayout';
import TermsModal     from './components/TermsModal';
// FIX: ruta corregida según tu nueva estructura src/components/Landing/
import LandingPage    from './components/Landing/LandingPage';

// Lazy-loaded pages (sin cambios)
const Alumnos            = lazy(() => import('./pages/Alumnos'));
const Configuracion      = lazy(() => import('./pages/Configuracion'));
const PagosModule        = lazy(() => import('./pages/PagosModule'));
const CalendarioPage     = lazy(() => import('./pages/CalendarioPage'));
const Nosotros           = lazy(() => import('./pages/Nosotros'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const NotificacionesPage = lazy(() => import('./pages/NotificacionesPage'));

// ─── Spinner de carga de módulo ───────────────────────────────────────────────
const PageSpinner = () => (
  <div className="min-h-screen bg-[#05080d] flex flex-col items-center justify-center">
    <div className="w-10 h-10 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-4" />
    <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
      Cargando módulo...
    </p>
  </div>
);

// ─── Persiste la última ruta visitada (para restaurar tras refrescar) ─────────
// FIX: excluye '/' para que la landing no sobreescriba la última ruta de app
const RoutePreserver = () => {
  const location = useLocation();
  useEffect(() => {
    const excluded = ['/', '/login', '/reset-password'];
    if (!excluded.includes(location.pathname)) {
      sessionStorage.setItem('last_route', location.pathname);
    }
  }, [location.pathname]);
  return null;
};

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [legalText, setLegalText] = useState(null); // null = aún no cargado
  const isUserLoaded              = useRef(false);

  // FIX: canAccess como useCallback sin dependencia de `user` en el closure;
  // recibe user directamente desde el estado de React en cada render.
  const canAccess = useCallback((page) => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.rol]?.includes(page) ?? false;
  }, [user]);

  // Carga el texto legal desde Supabase (solo cuando el usuario no lo ha aceptado)
  const fetchLegal = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('configuraciones_club')
        .select('descripcion')
        .eq('nombre_tarifa', 'legal_consentimiento')
        .maybeSingle();
      setLegalText(
        data?.descripcion ||
        'Al continuar, aceptas los términos y condiciones de participación del Club Deportivo Cezeus.'
      );
    } catch {
      setLegalText('Al continuar, aceptas los términos y condiciones de participación del Club Deportivo Cezeus.');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Consulta el perfil extendido del usuario desde la tabla `usuarios`
    const fetchUserProfile = async (userId) => {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select(
            'id, rol, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, ' +
            'email, foto_url, telefono, estado, categoria, acepta_terminos, fecha_nacimiento, ' +
            'fecha_inscripcion, tipo_documento, numero_documento, genero, direccion, eps, ' +
            'grupo_sanguineo, factor_rh, condiciones_medicas, acudiente_primer_nombre, ' +
            'acudiente_segundo_nombre, acudiente_primer_apellido, acudiente_segundo_apellido, ' +
            'acudiente_parentesco, acudiente_telefono'
          )
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
          setLegalText(null);
        }
        return;
      }

      const roleFromToken = session.user.user_metadata?.rol || 'ALUMNO';

      // Si ya cargamos el perfil y no se pide refrescar, solo sincronizamos el rol si cambió
      if (isUserLoaded.current && !forceRefresh) {
        if (isMounted) {
          setUser(prev => {
            if (!prev || prev.rol === roleFromToken) return prev;
            return { ...prev, rol: roleFromToken };
          });
        }
        return;
      }

      const profile = await fetchUserProfile(session.user.id);

      if (isMounted) {
        const finalUser = profile
          ? { ...profile, rol: roleFromToken }
          : {
              id:              session.user.id,
              primer_nombre:   session.user.user_metadata?.first_name || 'Usuario',
              rol:             roleFromToken,
              acepta_terminos: false,
            };

        setUser(finalUser);
        isUserLoaded.current = true;
        setLoading(false);

        // Carga el texto legal solo si el usuario aún no lo aceptó
        if (!finalUser.acepta_terminos) {
          fetchLegal();
        } else {
          setLegalText('');
        }
      }
    };

    const initApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await updateUserData(session, true);
        } else {
          if (isMounted) {
            setLoading(false);
            setLegalText('');
          }
        }
      } catch {
        if (isMounted) {
          setLoading(false);
          setLegalText('');
        }
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // INITIAL_SESSION lo maneja initApp(), lo ignoramos aquí para evitar doble ejecución
      if (event === 'INITIAL_SESSION') {
        if (!session && isMounted) {
          setLoading(false);
          setLegalText('');
        }
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
          setLegalText(null);
          sessionStorage.clear();
          // La redirección la maneja el Router al detectar user=null
        }
      }
    });

    // FIX: debounce en visibilitychange para evitar re-fetches innecesarios
    // cuando el usuario cambia de pestaña brevemente
    let visTimer;
    const handleVisibilityChange = () => {
      clearTimeout(visTimer);
      visTimer = setTimeout(async () => {
        if (document.visibilityState === 'visible') {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) await updateUserData(session, false);
        }
      }, 2000);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearTimeout(visTimer);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchLegal]);

  // Pantalla de carga inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-[#05080d] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-4" />
        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
          Sincronizando Sistema
        </p>
      </div>
    );
  }

  const defaultPath  = user?.rol === 'ALUMNO' ? '/alumnos' : '/calendario';
  const lastRoute    = sessionStorage.getItem('last_route');
  const redirectPath = lastRoute && user ? lastRoute : defaultPath;

  // Mostrar modal de términos solo cuando: hay usuario, no aceptó, y el texto ya cargó
  const mostrarTerms = Boolean(user && !user.acepta_terminos && legalText);

  return (
    <>
      <Router>
        <RoutePreserver />
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            {/* ── Ruta raíz: landing para visitantes, app para usuarios ── */}
            <Route
              path="/"
              element={!user ? <LandingPage /> : <Navigate to={redirectPath} replace />}
            />

            {/* ── Autenticación ── */}
            <Route path="/login"          element={!user ? <Login /> : <Navigate to={redirectPath} replace />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ── Módulos protegidos ── */}
            <Route path="/dashboard" element={
              user && canAccess(PaginasApp.DASHBOARD)
                ? <MainLayout user={user}><DashboardPage user={user} /></MainLayout>
                : <Navigate to={user ? defaultPath : '/login'} replace />
            } />
            <Route path="/notificaciones" element={
              user && canAccess(PaginasApp.NOTIFICACIONES)
                ? <MainLayout user={user}><NotificacionesPage user={user} /></MainLayout>
                : <Navigate to={user ? defaultPath : '/login'} replace />
            } />
            <Route path="/nosotros" element={
              user && canAccess(PaginasApp.NOSOTROS)
                ? <MainLayout user={user}><Nosotros /></MainLayout>
                : <Navigate to={user ? defaultPath : '/login'} replace />
            } />
            <Route path="/alumnos" element={
              user && canAccess(PaginasApp.ALUMNOS)
                ? <MainLayout user={user}><Alumnos /></MainLayout>
                : <Navigate to={user ? defaultPath : '/login'} replace />
            } />
            <Route path="/calendario" element={
              user && canAccess(PaginasApp.CALENDARIO)
                ? <MainLayout user={user}><CalendarioPage userRol={user.rol} /></MainLayout>
                : <Navigate to={user ? defaultPath : '/login'} replace />
            } />
            <Route path="/configuracion" element={
              user && canAccess(PaginasApp.CONFIGURACION)
                ? <MainLayout user={user}><Configuracion user={user} /></MainLayout>
                : <Navigate to={user ? defaultPath : '/login'} replace />
            } />
            <Route path="/pagos" element={
              user && canAccess(PaginasApp.PAGOS)
                ? <MainLayout user={user}><PagosModule user={user} /></MainLayout>
                : <Navigate to={user ? defaultPath : '/login'} replace />
            } />

            {/* FIX: se elimina la ruta "/" duplicada que estaba al final.
                El catch-all redirige según estado de sesión. */}
            <Route path="*" element={<Navigate to={user ? redirectPath : '/login'} replace />} />
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