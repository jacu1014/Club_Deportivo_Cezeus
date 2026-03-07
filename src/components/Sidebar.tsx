// src/components/Sidebar.tsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, RolUsuario, ROLE_PERMISSIONS, PaginasApp } from '../types';
import { supabase } from '../lib/supabaseClient';
import LogoImg from './Logo_Cezeus.jpeg';

interface SidebarProps {
  user: User | null;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isOpen: boolean;
  onClose: () => void;
  isBirthday?: boolean; // Prop para el estilo de cumpleaños
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  isDarkMode,
  toggleTheme,
  isOpen,
  onClose,
  isBirthday = false // Por defecto en false
}) => {
  const navigate = useNavigate();

  /* =======================
      INFO DE USUARIO
  ======================= */
  const displayName = user?.primer_nombre 
    ? `${user.primer_nombre} ${user.primer_apellido || ''}`.trim().toUpperCase() 
    : 'CARGANDO...';

  const initials = user?.primer_nombre 
    ? `${user.primer_nombre[0]}${user.primer_apellido?.[0] || ''}`.toUpperCase() 
    : 'U';

  const getRoleLabel = (role: string | undefined) => {
    const roles: Record<string, string> = {
      SUPER_ADMIN: 'SUPER ADMIN',
      ADMINISTRATIVO: 'ADMINISTRATIVO',
      ENTRENADOR: 'ENTRENADOR',
      DIRECTOR: 'DIRECTOR',
      ALUMNO: 'ALUMNO',
    };
    return roles[role || ''] || 'USUARIO';
  };

  /* =======================
      DEFINICIÓN DEL MENÚ
  ======================= */
  const menuItems = [
    { id: PaginasApp.DASHBOARD, label: 'ASISTENCIA', icon: 'grid_view', path: '/dashboard' },
    { id: PaginasApp.ALUMNOS, label: 'ALUMNOS', icon: 'groups', path: '/alumnos' },
    { id: PaginasApp.EVALUACION, label: 'EVALUACIÓN', icon: 'analytics', path: '/evaluacion' },
    { id: PaginasApp.PAGOS, label: 'PAGOS', icon: 'account_balance_wallet', path: '/pagos' },
    { id: PaginasApp.CALENDARIO, label: 'CALENDARIO', icon: 'calendar_today', path: '/calendario' },
    { id: PaginasApp.NOTIFICACIONES, label: 'NOTIFICACIONES', icon: 'notifications_active', path: '/notificaciones' },
    { id: PaginasApp.NOSOTROS, label: 'NOSOTROS', icon: 'shield', path: '/nosotros' },
    { id: PaginasApp.CONFIGURACION, label: 'CONFIGURACIÓN', icon: 'settings', path: '/configuracion' },
  ];

  const currentRole = user?.rol || RolUsuario.ALUMNO;
  const allowedPages = ROLE_PERMISSIONS[currentRole] || [];

  const filteredMenu = menuItems.filter(item => {
    const isAllowed = allowedPages.includes(item.id);
    if (item.id === PaginasApp.CONFIGURACION) {
      return ['SUPER_ADMIN', 'ADMINISTRATIVO', 'DIRECTOR', 'ENTRENADOR', 'ALUMNO'].includes(currentRole);
    }
    return isAllowed;
  }).map(item => {
    if (currentRole === RolUsuario.ALUMNO && item.id === PaginasApp.ALUMNOS) {
      return { 
        ...item, 
        label: 'MI SEGUIMIENTO', 
        icon: 'monitoring' 
      };
    }
    return item;
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/');
  };

  return (
    <>
      {/* OVERLAY PARA MÓVILES */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />

      {/* ASIDE PRINCIPAL */}
      <aside className={`w-72 lg:w-64 bg-[#0a1118] border-r border-white/5 fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* CABECERA: LOGO */}
        <div className="p-8 flex flex-col items-center shrink-0">
          <img src={LogoImg} alt="Logo" className="w-16 h-16 rounded-xl mb-4 border border-white/10 shadow-2xl" />
          <h2 className="text-[10px] tracking-[0.3em] text-white/40 uppercase font-bold">Club Deportivo</h2>
          <h1 className="text-xl font-black text-white tracking-tighter italic">CE<span className="text-primary">ZEUS</span></h1>
        </div>

        {/* NAVEGACIÓN CON SCROLL INTERNO */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar py-4">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center px-4 py-3 rounded-xl transition-all group
                ${isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(19,236,236,0.05)]' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'}
              `}
            >
              <span className={`material-symbols-outlined mr-4 text-2xl transition-transform group-hover:scale-110`}>
                {item.icon}
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-wide uppercase italic">{item.label}</span>
                <span className="text-[7px] opacity-20 uppercase tracking-[0.2em] font-bold">{item.id}</span>
              </div>
            </NavLink>
          ))}
        </nav>

        {/* FOOTER: AJUSTES Y PERFIL */}
        <div className="p-4 border-t border-white/5 space-y-3 bg-black/20 shrink-0">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all group border border-transparent hover:border-white/10">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors">
                {isDarkMode ? 'dark_mode' : 'light_mode'}
              </span>
              <span className="text-[10px] font-black text-slate-500 group-hover:text-white uppercase tracking-tighter">Modo Oscuro</span>
            </div>
            <div className={`w-8 h-4 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-primary' : 'bg-slate-700'}`}>
              <div className={`w-2 h-2 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>

          {/* User Profile Card */}
          <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-500 ${
            isBirthday 
              ? 'bg-gradient-to-r from-amber-400/20 to-yellow-600/20 border-yellow-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse' 
              : 'bg-primary/5 border-primary/10'
          }`}>
            <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-lg transition-colors ${
              isBirthday 
                ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-black' 
                : 'bg-primary text-[#0a1118]'
            }`}>
              {initials}
              {isBirthday && (
                <span className="absolute -top-3 -left-1 text-amber-400 rotate-[-20deg] drop-shadow-md">
                  <span className="material-symbols-outlined text-lg">crown</span>
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-black truncate uppercase italic ${isBirthday ? 'text-yellow-400' : 'text-white'}`}>
                {displayName}
              </p>
              <p className={`text-[8px] font-black tracking-widest uppercase ${isBirthday ? 'text-amber-500/80' : 'text-primary/80'}`}>
                {getRoleLabel(user?.rol)}
              </p>
            </div>
            <button 
              onClick={handleLogout} 
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
              title="Cerrar Sesión"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;