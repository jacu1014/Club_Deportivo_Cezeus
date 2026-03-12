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

  const canAccess = (page) => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.rol]?.includes(page);
  };

  // 1. Cargar texto legal desde la configuración
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

  // 2. Gestión de Sesión y Perfil de Usuario
  useEffect(() => {
    let isMounted = true;

    // Función para obtener datos reales de la tabla 'usuarios'
    const fetchUserProfile = async (userId) => {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error("❌ Error al recuperar perfil (Revisar RLS):", error.message);
          return null;
        }
        return data;
      } catch (e) {
        return null;
      }
    };

    const initApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (isMounted) setUser(profile);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initApp();

    // Escuchar cambios en el estado de autenticación (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (isMounted) setUser(profile);
      } else {
        if (isMounted) setUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Pantalla de Carga
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
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Rutas Protegidas */}
          <Route path="/dashboard" element={
            <ProtectedRoute user={user} page={PaginasApp.DASHBOARD} canAccess={canAccess}>
              <DashboardPage user={user} />
            </ProtectedRoute>
          } />

          <Route path="/notificaciones" element={
            <ProtectedRoute user={user} page={PaginasApp.NOTIFICACIONES} canAccess={canAccess}>
              <NotificacionesPage user={user} />
            </ProtectedRoute>
          } />

          <Route path="/nosotros" element={
            <ProtectedRoute user={user} page={PaginasApp.NOSOTROS} canAccess={canAccess}>
              <Nosotros />
            </ProtectedRoute>
          } />

          <Route path="/alumnos" element={
            <ProtectedRoute user={user} page={PaginasApp.ALUMNOS} canAccess={canAccess}>
              <Alumnos />
            </ProtectedRoute>
          } />

          <Route path="/calendario" element={
            <ProtectedRoute user={user} page={PaginasApp.CALENDARIO} canAccess={canAccess}>
              <CalendarioPage userRol={user?.rol} />
            </ProtectedRoute>
          } />

          <Route path="/configuracion" element={
            <ProtectedRoute user={user} page={PaginasApp.CONFIGURACION} canAccess={canAccess}>
              <Configuracion user={user} />
            </ProtectedRoute>
          } />

          <Route path="/pagos" element={
            <ProtectedRoute user={user} page={PaginasApp.PAGOS} canAccess={canAccess}>
              <PagosModule user={user} />
            </ProtectedRoute>
          } />

          {/* Redirección Inteligente según Rol */}
          <Route 
            path="/" 
            element={
              user ? (
                <Navigate to={user.rol === 'ALUMNO' ? "/alumnos" : "/calendario"} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          
          <Route 
            path="*" 
            element={
              user ? (
                <Navigate to={user.rol === 'ALUMNO' ? "/alumnos" : "/calendario"} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        </Routes>
      </Router>

      {/* MODAL DE TÉRMINOS Y CONDICIONES */}
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
