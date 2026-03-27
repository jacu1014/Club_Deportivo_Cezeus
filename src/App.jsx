// src/App.jsx
import React, { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { ROLE_PERMISSIONS, PaginasApp } from './types';
import { Analytics } from '@vercel/analytics/react';
import Login         from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import MainLayout    from './layouts/MainLayout';
import TermsModal    from './components/TermsModal';
import LandingPage   from './pages/LandingPage';

const Alumnos            = lazy(() => import('./pages/Alumnos'));
const Configuracion      = lazy(() => import('./pages/Configuracion'));
const PagosModule        = lazy(() => import('./pages/PagosModule'));
const CalendarioPage     = lazy(() => import('./pages/CalendarioPage'));
const Nosotros           = lazy(() => import('./pages/Nosotros'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const NotificacionesPage = lazy(() => import('./pages/NotificacionesPage'));
const AvancesPage        = lazy(() => import('./pages/AvancesPage'));

// ─── Persistencia del perfil ──────────────────────────────────────────────────
const PROFILE_KEY = 'cezeus_user_profile';
const ROUTE_KEY   = 'cezeus_last_route';

const saveProfile  = (p) => { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {} };
const loadProfile  = ()  => { try { return JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch { return null; } };
const clearProfile = ()  => localStorage.removeItem(PROFILE_KEY);
const saveRoute    = (p) => localStorage.setItem(ROUTE_KEY, p);
const loadRoute    = ()  => localStorage.getItem(ROUTE_KEY) || null;
const clearRoute   = ()  => localStorage.removeItem(ROUTE_KEY);

const EXCLUDED_ROUTES = ['/', '/login', '/reset-password'];

// ─── Spinner ──────────────────────────────────────────────────────────────────
const PageSpinner = () => (
  <div className="min-h-screen bg-[#05080d] flex flex-col items-center justify-center">
    <div className="w-10 h-10 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-4" />
    <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
      Cargando módulo...
    </p>
  </div>
);

// ─── RoutePreserver ───────────────────────────────────────────────────────────
const RoutePreserver = () => {
  const location = useLocation();
  useEffect(() => {
    if (!EXCLUDED_ROUTES.includes(location.pathname)) {
      saveRoute(location.pathname);
    }
  }, [location.pathname]);
  return null;
};

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser]       = useState(() => loadProfile());
  const [loading, setLoading] = useState(true);
  const [legalText, setLegalText] = useState(null);
  const isUserLoaded = useRef(Boolean(loadProfile()));

  const canAccess = useCallback((page) => {
    if (!user) return false;
    if (!page) return false;
    return ROLE_PERMISSIONS[user.rol]?.includes(page) ?? false;
  }, [user]);

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

    const getRoleFromSession = (session) =>
      session.user.app_metadata?.rol  ||
      session.user.user_metadata?.rol ||
      'ALUMNO';

    const updateUserData = async (session, forceRefresh = false) => {
      if (!session?.user) {
        if (isMounted) {
          setUser(null);
          clearProfile();
          isUserLoaded.current = false;
          setLoading(false);
          setLegalText(null);
        }
        return;
      }

      const roleFromToken = getRoleFromSession(session);

      if (isUserLoaded.current && !forceRefresh) {
        if (isMounted) {
          setUser(prev => {
            if (!prev) return prev;
            if (prev.rol === roleFromToken) return prev;
            const updated = { ...prev, rol: roleFromToken };
            saveProfile(updated);
            return updated;
          });
          setLoading(false);
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
              rol:              roleFromToken,
              acepta_terminos: false,
            };

        saveProfile(finalUser);
        setUser(finalUser);
        isUserLoaded.current = true;
        setLoading(false);

        if (!finalUser.acepta_terminos) fetchLegal();
        else setLegalText('');
      }
    };

    const initApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const cached = loadProfile();
          if (cached && isUserLoaded.current) {
            const roleFromToken = getRoleFromSession(session);
            if (isMounted) {
              if (cached.rol !== roleFromToken) {
                const updated = { ...cached, rol: roleFromToken };
                saveProfile(updated);
                setUser(updated);
              }
              setLoading(false);
              if (!cached.acepta_terminos) fetchLegal();
              else setLegalText('');
            }
          } else {
            await updateUserData(session, true);
          }
        } else {
          clearProfile();
          clearRoute();
          if (isMounted) {
            setUser(null);
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
      if (event === 'INITIAL_SESSION') {
        if (!session && isMounted) {
          clearProfile();
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
          clearProfile();
          clearRoute();
          isUserLoaded.current = false;
          setLoading(false);
          setLegalText(null);
        }
      }
    });

    let visTimer;
    const handleVisibilityChange = () => {
      clearTimeout(visTimer);
      visTimer = setTimeout(async () => {
        if (document.visibilityState !== 'visible') return;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await updateUserData(session, false);
          } else {
            if (isMounted) {
              setUser(null);
              clearProfile();
              isUserLoaded.current = false;
            }
          }
        } catch {}
      }, 3000);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearTimeout(visTimer);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchLegal]);

  // Spinner inicial solo si NO tenemos nada en caché
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#05080d] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-4" />
        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
          Sincronizando Sistema
        </p>
      </div>
    );
  }

  const defaultPath   = user?.rol === 'ALUMNO' ? '/alumnos' : '/calendario';
  const lastRoute    = loadRoute();
  const redirectPath = lastRoute && user && !EXCLUDED_ROUTES.includes(lastRoute)
    ? lastRoute
    : defaultPath;

  const mostrarTerms = Boolean(user && !user.acepta_terminos && legalText);

  // ─── FUNCIÓN DE RENDERIZADO SEGURO ──────────────────────────────────────────
  const renderProtectedRoute = (page, Component, props = {}) => {
    // Si todavía está validando con Supabase, NO redirigimos, mantenemos la pantalla actual.
    if (loading) return null; 
    
    if (user && canAccess(page)) {
      return <MainLayout user={user}><Component {...props} user={user} /></MainLayout>;
    }
    return <Navigate to={user ? defaultPath : '/login'} replace />;
  };

  return (
    <>
      <Router>
        <RoutePreserver />
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/" element={!user ? <LandingPage /> : <Navigate to={redirectPath} replace />} />
            <Route path="/login"          element={!user ? <Login /> : <Navigate to={redirectPath} replace />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/dashboard"      element={renderProtectedRoute(PaginasApp.DASHBOARD, DashboardPage)} />
            <Route path="/notificaciones" element={renderProtectedRoute(PaginasApp.NOTIFICACIONES, NotificacionesPage)} />
            <Route path="/nosotros"       element={renderProtectedRoute(PaginasApp.NOSOTROS, Nosotros)} />
            <Route path="/alumnos"        element={renderProtectedRoute(PaginasApp.ALUMNOS, Alumnos)} />
            <Route path="/calendario"     element={renderProtectedRoute(PaginasApp.CALENDARIO, CalendarioPage, { userRol: user?.rol })} />
            <Route path="/configuracion"  element={renderProtectedRoute(PaginasApp.CONFIGURACION, Configuracion)} />
            <Route path="/pagos"          element={renderProtectedRoute(PaginasApp.PAGOS, PagosModule)} />
            <Route path="/avances"        element={renderProtectedRoute(PaginasApp.AVANCES, AvancesPage)} />

            <Route path="/evaluacion"     element={<Navigate to="/avances" replace />} />
            <Route path="*"               element={<Navigate to={user ? redirectPath : '/login'} replace />} />
          </Routes>
        </Suspense>
      </Router>

      {mostrarTerms && (
        <TermsModal
          user={user}
          content={legalText}
          onAccepted={() => {
            setUser(prev => {
              const updated = { ...prev, acepta_terminos: true };
              saveProfile(updated);
              return updated;
            });
          }}
        />
      )}
      <Analytics />
    </>
  );
}

export default App;