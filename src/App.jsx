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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [legalText, setLegalText] = useState('');
  const isUserLoaded = useRef(false);

  const canAccess = useCallback((page) => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.rol]?.includes(page);
  }, [user]);

  // Carga de texto legal
  useEffect(() => {
    const fetchLegal = async () => {
      try {
        const { data } = await supabase
          .from('configuraciones_club')
          .select('descripcion')
          .eq('nombre_tarifa', 'legal_consentimiento')
          .maybeSingle();
        if (data) setLegalText(data.descripcion);
      } catch (err) {
        console.error("Error legal:", err.message);
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
      } catch (e) {
        console.error("Error recuperando perfil de DB:", e.message);
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
          await updateUserData(session, true);
        } else {
          if (isMounted) setLoading(false);
        }
      } catch (error) {
        console.error("Error init:", error.message);
        if (isMounted) setLoading(false);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION' && !session) {
        if (isMounted) setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await updateUserData(session, event === 'SIGNED_IN');
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          isUserLoaded.current = false;
          setLoading(false);
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

  const defaultPath = user?.rol === 'ALUMNO' ? "/alumnos" : "/calendario";

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to={defaultPath} replace />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Rutas Protegidas */}
          <Route path="/dashboard" element={user && canAccess(PaginasApp.DASHBOARD) ? <MainLayout user={user}><DashboardPage user={user} /></MainLayout> : <Navigate to={user ? defaultPath : "/login"} replace />} />
          <Route path="/notificaciones" element={user && canAccess(PaginasApp.NOTIFICACIONES) ? <MainLayout user={user}><NotificacionesPage user={user} /></MainLayout> : <Navigate to={user ? defaultPath : "/login"} replace />} />
          <Route path="/nosotros" element={user && canAccess(PaginasApp.NOSOTROS) ? <MainLayout user={user}><Nosotros /></MainLayout> : <Navigate to={user ? defaultPath : "/login"} replace />} />
          <Route path="/alumnos" element={user && canAccess(PaginasApp.ALUMNOS) ? <MainLayout user={user}><Alumnos /></MainLayout> : <Navigate to={user ? defaultPath : "/login"} replace />} />
          <Route path="/calendario" element={user && canAccess(PaginasApp.CALENDARIO) ? <MainLayout user={user}><CalendarioPage userRol={user.rol} /></MainLayout> : <Navigate to={user ? defaultPath : "/login"} replace />} />
          <Route path="/configuracion" element={user && canAccess(PaginasApp.CONFIGURACION) ? <MainLayout user={user}><Configuracion user={user} /></MainLayout> : <Navigate to={user ? defaultPath : "/login"} replace />} />
          <Route path="/pagos" element={user && canAccess(PaginasApp.PAGOS) ? <MainLayout user={user}><PagosModule user={user} /></MainLayout> : <Navigate to={user ? defaultPath : "/login"} replace />} />
          <Route path="/" element={<Navigate to={user ? defaultPath : "/login"} replace />} />
          <Route path="*" element={<Navigate to={user ? defaultPath : "/login"} replace />} />
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
