// src/layouts/MainLayout.tsx
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { User } from '../types';
import { supabase } from '../lib/supabaseClient';
import confetti from 'canvas-confetti';
import { BIRTHDAY_MESSAGES, ROLE_ANNOUNCEMENTS } from '../constants/messages';

interface MainLayoutProps {
  user: User;
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ user, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [cumpleaniosHoy, setCumpleaniosHoy] = useState<{ nombre: string; esElMismo: boolean }[]>([]);
  const [showBirthdayNotif, setShowBirthdayNotif] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // FIX: ref para evitar setState en componente desmontado
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const yaMostradoCumple = sessionStorage.getItem(`cumple_mostrado_${user.id}`);
    const yaMostradoRol = sessionStorage.getItem(`rol_mostrado_${user.id}`);

    if (!yaMostradoCumple) checkBirthdays();
    if (!yaMostradoRol && ROLE_ANNOUNCEMENTS[user.rol]?.show) {
      if (isMounted.current) setShowRoleModal(true);
    }
  }, [user?.id, user?.rol]);

  const checkBirthdays = async () => {
    try {
      const hoy = new Date();
      const mesDiaHoy = `${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('usuarios')
        .select('id, primer_nombre, primer_apellido, fecha_nacimiento')
        .not('fecha_nacimiento', 'is', null);

      // FIX: si el componente se desmontó mientras esperábamos, no actualizamos estado
      if (!isMounted.current) return;
      if (error) throw error;

      const cumplenHoy = data
        .filter(u => u.fecha_nacimiento?.slice(5, 10) === mesDiaHoy)
        .map(u => ({
          nombre: `${u.primer_nombre} ${u.primer_apellido || ''}`,
          esElMismo: String(u.id) === String(user.id)
        }));

      if (cumplenHoy.length > 0 && isMounted.current) {
        setCumpleaniosHoy(cumplenHoy);
        setShowBirthdayNotif(true);
        sessionStorage.setItem(`cumple_mostrado_${user.id}`, 'true');
        if (cumplenHoy.some(c => c.esElMismo)) triggerConfetti();
      }
    } catch (err: any) {
      // Solo mostrar errores reales, no AbortError (cancelaciones normales de React)
      if (err?.name !== 'AbortError' && isMounted.current) {
        console.error("Error en lógica de cumpleaños:", err);
      }
    }
  };

  const closeRoleModal = () => {
    setShowRoleModal(false);
    sessionStorage.setItem(`rol_mostrado_${user.id}`, 'true');
  };

  const triggerConfetti = () => {
    const end = Date.now() + 4000;
    const colors = ['#22d3ee', '#818cf8', '#ffffff'];
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors, zIndex: 2000 });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors, zIndex: 2000 });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  const roleInfo = ROLE_ANNOUNCEMENTS[user?.rol];
  const esMiCumple = cumpleaniosHoy.some(c => c.esElMismo);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-slate-50 dark:bg-[#05080d] overflow-hidden relative">

        {/* MODAL DE ROL */}
        {showRoleModal && roleInfo && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-[#0a0f18] border-2 border-cyan-500/30 p-10 rounded-[3.5rem] shadow-[0_0_60px_rgba(34,211,238,0.25)] max-w-sm w-full relative text-center border-t-cyan-400">
              <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-cyan-500/20 text-cyan-400">
                <span className="material-symbols-outlined text-4xl">{roleInfo.icon}</span>
              </div>
              <h3 className="text-white font-black text-3xl uppercase italic tracking-tighter mb-4 leading-none">
                {roleInfo.title}
              </h3>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.15em] leading-relaxed mb-10 px-2">
                {roleInfo.message}
              </p>
              <button
                onClick={closeRoleModal}
                className="w-full py-5 bg-cyan-400 text-black font-black uppercase italic rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_20px_rgba(34,211,238,0.3)] text-sm tracking-widest"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* NOTIFICACIÓN DE CUMPLEAÑOS */}
        {showBirthdayNotif && (esMiCumple || BIRTHDAY_MESSAGES.CLUB.VISIBLE_FOR_ROLES.includes(user.rol)) && (
          <div className="fixed top-6 right-6 z-[999] animate-in slide-in-from-right duration-500">
            <div className="bg-[#0a0f18]/95 border-2 border-cyan-500/30 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-[0_0_30px_rgba(34,211,238,0.2)] max-w-sm relative">
              <button onClick={() => setShowBirthdayNotif(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
              {esMiCumple ? (
                <div className="space-y-2 text-white">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-cyan-400 animate-bounce">cake</span>
                    <h4 className="font-black uppercase italic tracking-tighter">¡Feliz Cumpleaños!</h4>
                  </div>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider leading-relaxed">
                    De parte de todo el equipo <span className="text-cyan-400 font-black">CEZEUS</span>, {BIRTHDAY_MESSAGES.PERSONAL.BODY}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 text-white">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-pink-500 animate-pulse">celebration</span>
                    <h4 className="font-black uppercase italic tracking-tighter text-sm">Cumpleaños en el Club</h4>
                  </div>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                    Hoy celebramos a:<br/>
                    <span className="text-cyan-400 font-black block mt-1">{cumpleaniosHoy.map(c => c.nombre).join(', ')}</span>
                  </p>
                  <p className="text-[9px] text-slate-500 italic font-bold uppercase">{BIRTHDAY_MESSAGES.CLUB.FOOTER}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <Sidebar
          user={user}
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          isBirthday={esMiCumple}
        />

        <div className="flex-1 flex flex-col min-w-0 lg:ml-64 h-full">
          <header className="lg:hidden flex items-center h-16 px-4 bg-slate-50/90 dark:bg-[#05080d]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/5 z-30">
            <button
              className="p-2 text-slate-600 dark:text-cyan-400 flex items-center gap-2"
              onClick={() => setIsOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
              <span className="text-[10px] font-black uppercase tracking-widest italic">Menú</span>
            </button>
          </header>
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;