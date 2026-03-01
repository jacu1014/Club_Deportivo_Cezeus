import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import ModalAsistencia from '../components/ModalAsistencia';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const DashboardPage = ({ user }) => {
  const [asistenciasHoy, setAsistenciasHoy] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState('ALUMNO');
  const [loading, setLoading] = useState(true);
  
  const hoyFecha = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => { 
    fetchDatos(); 
  }, [hoyFecha]);

  const fetchDatos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('asistencia')
      .select('*, usuarios(rol, primer_nombre)')
      .eq('fecha', hoyFecha);
    setAsistenciasHoy(data || []);
    setLoading(false);
  };

  // Cálculos de métricas para las tarjetas
  const stats = useMemo(() => {
    const alumnos = asistenciasHoy.filter(a => a.usuarios?.rol === 'ALUMNO');
    const staff = asistenciasHoy.filter(a => ['ADMINISTRATIVO', 'ENTRENADOR', 'DIRECTOR'].includes(a.usuarios?.rol));
    
    return {
      alumnosPres: alumnos.filter(a => a.estado === 'PRESENTE').length,
      staffPres: staff.filter(a => a.estado === 'PRESENTE').length,
      totalRegistros: asistenciasHoy.length
    };
  }, [asistenciasHoy]);

  const handleOpen = (tipo) => {
    setTipoSeleccionado(tipo);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-10 text-slate-200 animate-in fade-in duration-700">
      
      {/* SECCIÓN BIENVENIDA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-white font-black text-4xl uppercase italic tracking-tighter">
            Panel <span className="text-cyan-400">Cezeus</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">
            {format(new Date(), "EEEE dd 'de' MMMM", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Sistema Activo</span>
        </div>
      </div>

      {/* GRID DE TARJETAS VISUALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card Alumnos */}
        <div className="bg-[#0a0f18]/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl relative group overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-9xl text-cyan-400">groups</span>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Asistencia Alumnos</p>
          <div className="flex items-end gap-2 mb-6">
            <h3 className="text-5xl font-black text-white leading-none">{stats.alumnosPres}</h3>
            <span className="text-cyan-400 text-xs font-bold mb-1 uppercase italic">Presentes</span>
          </div>
          <button 
            onClick={() => handleOpen('ALUMNO')}
            className="w-full bg-cyan-400 text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">how_to_reg</span> Pasar Lista
          </button>
        </div>

        {/* Card Staff */}
        <div className="bg-[#0a0f18]/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl relative group overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-9xl text-emerald-400">badge</span>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Personal en Turno</p>
          <div className="flex items-end gap-2 mb-6">
            <h3 className="text-5xl font-black text-white leading-none">{stats.staffPres}</h3>
            <span className="text-emerald-400 text-xs font-bold mb-1 uppercase italic">Activos</span>
          </div>
          <button 
            onClick={() => handleOpen('STAFF')}
            className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">verified_user</span> Registrar Staff
          </button>
        </div>

        {/* Card Resumen Rápido */}
        <div className="bg-[#0a0f18]/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl lg:col-span-1 md:col-span-2">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">Actividad Reciente</p>
          <div className="space-y-4">
            {asistenciasHoy.slice(0, 3).map((reg, i) => (
              <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${reg.estado === 'PRESENTE' ? 'bg-emerald-400' : 'bg-rose-500'}`}></div>
                  <span className="text-[10px] font-bold text-white uppercase">{reg.usuarios?.primer_nombre}</span>
                </div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">{reg.usuarios?.rol}</span>
              </div>
            ))}
            {asistenciasHoy.length === 0 && (
              <p className="text-center py-4 text-slate-600 text-[9px] font-black uppercase tracking-widest italic">Sin movimientos hoy</p>
            )}
          </div>
        </div>

      </div>

      {/* EL MODAL INDEPENDIENTE */}
      <ModalAsistencia 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        tipo={tipoSeleccionado}
        fecha={hoyFecha}
        onSaveSuccess={fetchDatos}
      />
    </div>
  );
};

export default DashboardPage;