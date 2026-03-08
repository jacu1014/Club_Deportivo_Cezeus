import React, { useState, useEffect } from 'react';
import { RolUsuario } from '../types'; 
import { useOutletContext } from 'react-router-dom';
import SeguimientoAlumno from '../components/SeguimientoAlumno';
import FormularioRegistroAlumno from '../components/FormularioRegistroAlumno';
import GestorCarnetDigital from '../components/GestorCarnetDigital';
// --- NUEVAS IMPORTACIONES ---
import ClubSection from '../components/ClubSection';
import StaffSection from '../components/StaffSection';
import { supabase } from '../lib/supabaseClient'; 

const AlumnosModule = () => {
  const context = useOutletContext();
  const [user, setUser] = useState(context?.user || context || null);
  const [loading, setLoading] = useState(!user);
  const [activeTab, setActiveTab] = useState('SEGUIMIENTO');
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);

  useEffect(() => {
    const fetchUserManual = async () => {
      if (!user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profile) setUser(profile);
        }
      }
      setLoading(false);
    };
    fetchUserManual();
  }, [user]);

  const isAdmin = user && [
    RolUsuario.ADMINISTRATIVO, 
    RolUsuario.DIRECTOR, 
    RolUsuario.SUPER_ADMIN,
    'SUPER_ADMIN',
    'ADMINISTRATIVO'
  ].includes(user?.rol);

  const isAlumno = user?.rol === RolUsuario.ALUMNO || user?.rol === 'ALUMNO';
  const isEntrenador = user?.rol === RolUsuario.ENTRENADOR || user?.rol === 'ENTRENADOR';

  useEffect(() => {
    if (isAlumno && user) setAlumnoSeleccionado(user);
  }, [isAlumno, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="text-primary font-black uppercase tracking-widest text-xs italic">Verificando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-2 md:p-6 animate-in fade-in duration-700">
      
      <div className="flex flex-col gap-1 px-4">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
          {isAlumno ? 'Mi Ficha' : 'Gestión de'} <span className="text-primary">{isAlumno ? 'Técnica' : 'Alumnos'}</span>
        </h1>
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
           <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Club Deportivo Cezeus / {activeTab}</p>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 bg-white/[0.02] p-1.5 rounded-2xl border border-white/5 w-fit mx-4 backdrop-blur-sm">
        <button 
          onClick={() => setActiveTab('SEGUIMIENTO')} 
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'SEGUIMIENTO' ? 'bg-primary text-[#0a1118]' : 'text-slate-500 hover:text-white'}`}
        >
          <span className="material-symbols-outlined text-sm">monitoring</span> 
          {isAlumno ? 'Rendimiento' : 'Seguimiento'}
        </button>
        
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('REGISTRO')} 
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'REGISTRO' ? 'bg-primary text-[#0a1118]' : 'text-slate-500 hover:text-white'}`}
          >
            <span className="material-symbols-outlined text-sm">person_add</span> Registro
          </button>
        )}

        {/* --- NUEVAS PESTAÑAS --- */}
        <button 
          onClick={() => setActiveTab('CLUB')} 
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'CLUB' ? 'bg-primary text-[#0a1118]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
        >
          <span className="material-symbols-outlined text-sm">shield</span> Club
        </button>

        <button 
          onClick={() => setActiveTab('STAFF')} 
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'STAFF' ? 'bg-primary text-[#0a1118]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
        >
          <span className="material-symbols-outlined text-sm">groups</span> Staff
        </button>

        {!isEntrenador && (
          <button 
            onClick={() => setActiveTab('CARNET')} 
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'CARNET' ? 'bg-primary text-[#0a1118] shadow-[0_0_20px_rgba(19,236,236,0.2)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <span className="material-symbols-outlined text-sm">badge</span> 
            {isAlumno ? 'Mi Carnet' : 'Carnet Digital'}
          </button>
        )}
      </nav>

      <main className="relative min-h-[500px] px-4">
        {activeTab === 'SEGUIMIENTO' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <SeguimientoAlumno alumno={alumnoSeleccionado} currentUser={user} onSelectAlumno={setAlumnoSeleccionado} />
          </div>
        )}
        
        {activeTab === 'REGISTRO' && isAdmin && (
          <div className="animate-in zoom-in-95 duration-500">
            <FormularioRegistroAlumno />
          </div>
        )}

        {/* --- RENDERIZADO DE NUEVAS SECCIONES --- */}
        {activeTab === 'CLUB' && (
          <div className="animate-in fade-in duration-500">
            <ClubSection />
          </div>
        )}

        {activeTab === 'STAFF' && (
          <div className="animate-in fade-in duration-500">
            <StaffSection />
          </div>
        )}
        
        {activeTab === 'CARNET' && !isEntrenador && (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <GestorCarnetDigital user={user} alumnoPreseleccionado={alumnoSeleccionado} />
          </div>
        )}
      </main>
    </div>
  );
};

export default AlumnosModule;