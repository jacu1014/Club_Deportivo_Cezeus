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

  // Memorizamos canAccess para evitar re-renders innecesarios y asegurar prioridad del rol de DB
  const canAccess = useCallback((page) => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.rol]?.includes(page);
  }, [user]);

  // 1. Cargar texto del consentimiento (Legal)
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

  // 2. Gestión de Autenticación, Perfil y Persistencia al refrescar
  useEffect(() => {
    let isMounted = true;

    // Función para obtener el perfil real de la DB
    const fetchUserProfile = async (userId) => {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error("❌ Error recuperando perfil:", error.message);
          return null;
        }
        return data;
      } catch (e) {
        return null;
      }
    };

    const initApp = async () => {
      // Timeout de seguridad: evita pantalla de carga infinita si la red falla
      const timeout = setTimeout(() => {
        if (isMounted && loading) {
          console.warn("Carga lenta: liberando pantalla de espera...");
          setLoading(false);
        }
      }, 6000);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (isMounted) {
            // Fallback en caso de que el usuario exista en Auth pero no en la tabla usuarios
            setUser(profile || { 
              id: session.user.id, 
              primer_nombre: 'Usuario', 
              rol: 'ALUMNO', 
              acepta_terminos: false 
            });
          }
        }
      } catch (error) {
        console.error("Error en initApp:", error.message);
      } finally {
        if (isMounted) {
          setLoading(false);
          clearTimeout(timeout);
        }
      }
    };

    initApp();

    // Suscripción a cambios de estado (Login/Logout/Refresh de Token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Redirección inteligente basada en rol
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
          {/* Rutas Públicas */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to={getDefaultRoute()} replace />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Rutas Protegidas mapeadas */}
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

          {/* Manejo de rutas raíz y errores 404 */}
          <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
          <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
        </Routes>
      </Router>

      {/* MODAL DE TÉRMINOS (Bloqueo si acepta_terminos es estrictamente false) */}
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
