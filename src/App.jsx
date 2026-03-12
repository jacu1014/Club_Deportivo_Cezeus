import React, { useEffect, useState, useCallback, useRef } from 'react';
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
// Componentes adicionales
import TermsModal from './components/TermsModal';

function App() {
  // 1. HIDRATACIÓN INICIAL (Mantenemos tu lógica que es buena)
  const [user, setUser] = useState(() => {
    const sessionKey = Object.keys(localStorage).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
    if (sessionKey) {
      try {
        const session = JSON.parse(localStorage.getItem(sessionKey));
        return session?.user ? { 
          ...session.user, 
          rol: session.user.user_metadata?.rol || 'ALUMNO',
          primer_nombre: session.user.user_metadata?.first_name || 'Usuario'
        } : null;
      } catch { return null; }
    }
    return null;
  });

  const [loading, setLoading] = useState(!user); 
  const [legalText, setLegalText] = useState('');
  const isUserLoaded = useRef(false);

  const canAccess = useCallback((page) => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.rol]?.includes(page);
  }, [user]);

  useEffect(() => {
    const fetchLegal = async () => {
      try {
        const { data } = await supabase
          .from('configuraciones_club')
          .select('descripcion')
          .eq('nombre_tarifa', 'legal_consentimiento')
          .maybeSingle();
        if (data) setLegalText(data.descripcion);
      } catch (err) { console.error("Error legal:", err.message); }
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
      } catch (e) { return null; }
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
        setLoading(false);
        return;
      }

      const profile = await fetchUserProfile(session.user.id);

      if (isMounted) {
        const finalUser = profile ? { ...profile, rol: roleFromToken } : {
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
          await updateUserData(session, false);
        } else {
          if (isMounted) setLoading(false);
        }
      } catch (error) {
        if (isMounted) setLoading(false);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        await updateUserData(session, event === 'SIGNED_IN');
      } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        if (isMounted) {
          if (event === 'SIGNED_OUT') setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- CAMBIO CLAVE: PROTECCIÓN DE RUTAS DURANTE CARGA ---
  // Esta función evita que el componente Navigate te eche si el sistema está "pensando"
  const renderProtectedRoute = (page, Component, props = {}) => {
    if (user && canAccess(page)) {
      return <MainLayout user={user}><Component {...props} /></MainLayout>;
    }
    // Si está cargando, NO redireccionamos. Devolvemos null para mantener la vista actual.
    if (loading) return null; 
    
    // Solo si terminó de cargar y NO hay usuario, mandamos al login
    return <Navigate to={user ? defaultPath : "/login"} replace />;
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#05080d] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Sincronizando Sistema</p>
      </div>
    );
  }

  const defaultPath = user?.rol === 'ALUMNO' ? "/alumnos" : "/calendario";

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={!user && !loading ? <Login /> : (loading ? null : <Navigate to={defaultPath} replace />)} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/dashboard" element={renderProtectedRoute(PaginasApp.DASHBOARD, DashboardPage, { user })} />
          <Route path="/notificaciones" element={renderProtectedRoute(PaginasApp.NOTIFICACIONES, NotificacionesPage, { user })} />
          <Route path="/nosotros" element={renderProtectedRoute(PaginasApp.NOSOTROS, Nosotros)} />
          <Route path="/alumnos" element={renderProtectedRoute(PaginasApp.ALUMNOS, Alumnos)} />
          <Route path="/calendario" element={renderProtectedRoute(PaginasApp.CALENDARIO, CalendarioPage, { userRol: user?.rol })} />
          <Route path="/configuracion" element={renderProtectedRoute(PaginasApp.CONFIGURACION, Configuracion, { user })} />
          <Route path="/pagos" element={renderProtectedRoute(PaginasApp.PAGOS, PagosModule, { user })} />
          
          <Route path="/" element={loading ? null : <Navigate to={user ? defaultPath : "/login"} replace />} />
          <Route path="*" element={loading ? null : <Navigate to={user ? defaultPath : "/login"} replace />} />
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
