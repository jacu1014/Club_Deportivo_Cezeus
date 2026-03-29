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
// IMPORTANTE: usar la misma key que supabaseClient.storageKey para evitar conflictos
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

  // FIX: canAccess usa PaginasApp correctamente
  // Si PaginasApp.EVALUACION no existe en types, canAccess devuelve false
  // y redirige al login en lugar de cargar la página
  const canAccess = useCallback((page) => {
    if (!user) return false;
    // Protección extra: si page es undefined (enum inexistente), denegar acceso
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

    // FIX: leer rol desde app_metadata primero (más confiable),
    // luego user_metadata como fallback
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

      // TOKEN_REFRESHED (~60s): NO re-fetchear perfil, solo sincronizar rol si cambió
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

      // SIGNED_IN o primer arranque: fetch completo del perfil
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

        saveProfile(finalUser);
        setUser(finalUser);
        isUserLoaded.current = true;
        setLoading(false);

        if (!finalUser.acepta_terminos) fetchLegal();
        else setLegalText('');
      }
    };

    const initApp = async () => {
      // Simplificado: dejar que onAuthStateChange maneje todo
      // Solo cargar desde cache para UI responsiva
      const cached = loadProfile();
      if (cached && isMounted) {
        setUser(cached);
        isUserLoaded.current = true;
        setLoading(false);
        if (!cached.acepta_terminos) fetchLegal();
        else setLegalText('');
      } else {
        // Sin cache, mostrar spinner breve mientras se obtiene sesión
        if (isMounted) setLoading(true);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Auth event: ${event}`, session ? 'with session' : 'no session');
      
      if (event === 'INITIAL_SESSION') {
        // Este evento dispara cuando Supabase termina de restaurar la sesión
        if (session && isMounted) {
          // Hay sesión guardada, cargarla
          console.log('📦 Sesión encontrada en INITIAL_SESSION');
          await updateUserData(session, true);
        } else if (isMounted) {
          // No hay sesión, mostrar login
          console.log('🔓 Sin sesión, mostrando login');
          setUser(null);
          clearProfile();
          setLoading(false);
          setLegalText('');
        }
        return;
      }
      
      if (event === 'SIGNED_IN') {
        console.log('✅ Usuario logueado');
        if (session && isMounted) {
          await updateUserData(session, true);
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refrescado');
        if (session && isMounted) {
          await updateUserData(session, false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🔓 Usuario deslogueado');
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
    let isSyncing = false; // Flag para evitar sincronizaciones simultáneas
    
    const handleVisibilityChange = async () => {
      clearTimeout(visTimer);
      
      // Solo sincronizar si regresa de background y no está en proceso
      if (document.visibilityState === 'visible' && !isSyncing && user) {
        visTimer = setTimeout(async () => {
          isSyncing = true;
          try {
            // Solo refrescar si hay sesión válida (sin bloquear)
            const { data: { session } } = await supabase.auth.getSession();
            if (session && isMounted) {
              // Refrescar el token (timeout: 5s para no bloquear)
              const refreshPromise = supabase.auth.refreshSession();
              await Promise.race([
                refreshPromise,
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Timeout')), 5000)
                )
              ]).catch(() => {
                // Silencioso si falla o timeout
                console.log('⏱️ Timeout refrescando token, continuamos');
              });
            }
          } catch (err) {
            console.warn('⚠️ Error en sincronización:', err.message);
          } finally {
            isSyncing = false;
          }
        }, 800); // Esperar 800ms para que usuario termine de navegar
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearTimeout(visTimer);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchLegal]);

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

  const defaultPath  = user?.rol === 'ALUMNO' ? '/alumnos' : '/calendario';
  const lastRoute    = loadRoute();
  const redirectPath = lastRoute && user && !EXCLUDED_ROUTES.includes(lastRoute)
    ? lastRoute
    : defaultPath;

  const mostrarTerms = Boolean(user && !user.acepta_terminos && legalText);

  return (
    <>
      <Router>
        <RoutePreserver />
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/" element={!user ? <LandingPage /> : <Navigate to={redirectPath} replace />} />
            <Route path="/login"          element={!user ? <Login /> : <Navigate to={redirectPath} replace />} />
            <Route path="/reset-password" element={<ResetPassword />} />

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
            {/* FIX: usar PaginasApp.AVANCES (no EVALUACION que no existe en types) */}
            {/* Avances — el Sidebar apunta a /avances, la ruta coincide */}
            <Route path="/avances" element={
              user && canAccess(PaginasApp.AVANCES)
                ? <MainLayout user={user}><AvancesPage user={user} /></MainLayout>
                : <Navigate to={user ? defaultPath : '/login'} replace />
            } />
            {/* Alias /evaluacion por compatibilidad con links existentes */}
            <Route path="/evaluacion" element={<Navigate to="/avances" replace />} />

            <Route path="*" element={<Navigate to={user ? redirectPath : '/login'} replace />} />
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