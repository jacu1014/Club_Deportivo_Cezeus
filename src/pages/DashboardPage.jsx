import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import ModalAsistencia from '../components/ModalAsistencia';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { generarReporteAsistencia } from '../services/reporteAsistencia'; 

const DashboardPage = ({ user }) => {
  const [asistencias, setAsistencias] = useState([]);
  const [categorias, setCategorias] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState('ALUMNO');
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  
  // 1. Rango de fechas para la visualización del Dashboard
  const [rangoDashboard, setRangoDashboard] = useState({
    inicio: format(new Date(), 'yyyy-MM-dd'),
    fin: format(new Date(), 'yyyy-MM-dd')
  });

  const currentRole = user?.rol || 'ALUMNO';

  useEffect(() => { 
    fetchDatos();
    fetchCategorias();
  }, [rangoDashboard, currentRole]);

  // OBTENER CATEGORÍAS
  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('categoria')
        .not('categoria', 'is', null)
        .eq('rol', 'ALUMNO');
      if (error) throw error;
      const unicas = [...new Set(data.map(u => u.categoria))].sort();
      setCategorias(unicas);
    } catch (err) {
      console.error("Error categorías:", err.message);
    }
  };

  // FETCH DATOS CON RANGO DINÁMICO
  const fetchDatos = async () => {
    setLoading(true);
    try {
      let query = supabase.from('asistencias').select('*, usuarios(*)');

      if (['ALUMNO', 'ENTRENADOR'].includes(currentRole)) {
        const inicioMes = startOfMonth(new Date()).toISOString().split('T')[0];
        const finMes = endOfMonth(new Date()).toISOString().split('T')[0];
        query = query.eq('usuario_id', user.id).gte('fecha', inicioMes).lte('fecha', finMes);
      } else {
        // Filtro global del Dashboard por rango seleccionado
        query = query.gte('fecha', rangoDashboard.inicio).lte('fecha', rangoDashboard.fin);
      }

      const { data, error } = await query.order('fecha', { ascending: false });
      if (error) throw error;
      setAsistencias(data || []);
    } catch (err) {
      console.error("Error Fetch Dashboard:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // MANEJO DE PDF (Sin cambios en lógica, solo integración)
  const handleExportarPDF = async () => {
    const fInicio = document.getElementById('fecha_inicio').value;
    const fFin = document.getElementById('fecha_fin').value;
    const catFiltro = document.getElementById('filtro_categoria_pdf').value;
    const rolFiltro = document.getElementById('filtro_rol_pdf')?.value || 'ALUMNO';

    if (!fInicio || !fFin) return alert("Selecciona fechas.");
    setExportLoading(true);
    try {
      let query = supabase.from('asistencias').select(`fecha, estado, usuarios!inner(*)`).gte('fecha', fInicio).lte('fecha', fFin);
      if (rolFiltro === 'ALUMNO') {
        query = query.eq('usuarios.rol', 'ALUMNO');
        if (catFiltro !== 'TODAS') query = query.eq('usuarios.categoria', catFiltro);
      } else {
        query = query.neq('usuarios.rol', 'ALUMNO');
      }
      const { data: raw, error } = await query.order('fecha', { ascending: true });
      if (error) throw error;
      if (!raw?.length) return alert("Sin datos.");

      const fechasUnicas = [...new Set(raw.map(a => a.fecha))].sort();
      const mapaRegistros = {};
      raw.forEach(reg => {
        const nombre = `${reg.usuarios.primer_nombre} ${reg.usuarios.primer_apellido}`.toUpperCase();
        if (!mapaRegistros[nombre]) mapaRegistros[nombre] = { nombreCompleto: nombre, asistencias: {} };
        mapaRegistros[nombre].asistencias[reg.fecha] = reg.estado;
      });

      const subtitulo = rolFiltro === 'ALUMNO' ? (catFiltro === 'TODAS' ? "Alumnos" : `Cat. ${catFiltro}`) : "Staff";
      await generarReporteAsistencia(`${subtitulo} (${fInicio} / ${fFin})`, Object.values(mapaRegistros), fechasUnicas);
    } catch (err) {
      alert(err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const stats = useMemo(() => {
    const alumnos = asistencias.filter(a => a.usuarios?.rol === 'ALUMNO');
    const staff = asistencias.filter(a => ['ADMINISTRATIVO', 'ENTRENADOR', 'DIRECTOR', 'SUPER_ADMIN'].includes(a.usuarios?.rol));
    return {
      alumnosPres: alumnos.filter(a => a.estado === 'PRESENTE').length,
      staffPres: staff.filter(a => a.estado === 'PRESENTE').length,
      misAsistencias: asistencias.filter(a => a.usuario_id === user.id && a.estado === 'PRESENTE').length,
    };
  }, [asistencias, user.id]);

  return (
    <div className="min-h-screen bg-[#05080d] text-slate-200 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8 md:space-y-12">
        
        {/* HEADER RESPONSIVE */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/5 pb-8">
          <div className="space-y-2">
            <h2 className="text-white font-black text-3xl md:text-5xl uppercase italic tracking-tighter leading-none">
              {['ALUMNO', 'ENTRENADOR'].includes(currentRole) ? 'Mi' : 'Panel'} <span className="text-cyan-400">Cezeus</span>
            </h2>
            
            {!['ALUMNO', 'ENTRENADOR'].includes(currentRole) && (
              <div className="flex flex-wrap items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5 w-fit">
                <span className="text-[9px] font-black text-slate-500 uppercase px-2">Rango Visual:</span>
                <input 
                  type="date" 
                  value={rangoDashboard.inicio}
                  onChange={(e) => setRangoDashboard(p => ({...p, inicio: e.target.value}))}
                  className="bg-transparent text-cyan-400 text-[11px] font-bold outline-none"
                />
                <span className="text-slate-700 font-bold">→</span>
                <input 
                  type="date" 
                  value={rangoDashboard.fin}
                  onChange={(e) => setRangoDashboard(p => ({...p, fin: e.target.value}))}
                  className="bg-transparent text-cyan-400 text-[11px] font-bold outline-none"
                />
              </div>
            )}
          </div>
          
          <button onClick={fetchDatos} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-cyan-400/10 transition-all group shrink-0">
            <span className={`material-symbols-outlined text-cyan-400 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}>refresh</span>
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL - GRID DINÁMICO */}
        {['SUPER_ADMIN', 'DIRECTOR', 'ADMINISTRATIVO'].includes(currentRole) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            
            <DashboardCard 
              title="Alumnos" 
              count={stats.alumnosPres} 
              label="En Rango" 
              icon="groups" 
              color="text-cyan-400" 
              btnText="Pasar/Editar" 
              onBtnClick={() => { setTipoSeleccionado('ALUMNO'); setIsModalOpen(true); }} 
            />

            <DashboardCard 
              title="Staff" 
              count={stats.staffPres} 
              label="En Rango" 
              icon="badge" 
              color="text-emerald-400" 
              btnText="Gestionar" 
              onBtnClick={() => { setTipoSeleccionado('STAFF'); setIsModalOpen(true); }} 
            />

            {/* SECCIÓN EXPORTAR - Mejorada visualmente */}
            <div className="bg-[#0a0f18]/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl flex flex-col justify-between min-h-[320px]">
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 italic">Exportar Reporte PDF</p>
                <div className="space-y-3">
                  <select id="filtro_rol_pdf" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] text-white font-bold uppercase focus:border-cyan-400 outline-none">
                    <option value="ALUMNO">ALUMNOS</option>
                    <option value="STAFF">TODO EL STAFF</option>
                  </select>
                  <select id="filtro_categoria_pdf" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] text-white font-bold uppercase focus:border-cyan-400 outline-none">
                    <option value="TODAS">CATEGORÍAS</option>
                    {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input type="date" id="fecha_inicio" className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-2 text-[10px] text-white font-bold" defaultValue={rangoDashboard.inicio}/>
                    <input type="date" id="fecha_fin" className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-2 text-[10px] text-white font-bold" defaultValue={rangoDashboard.fin}/>
                  </div>
                </div>
              </div>
              <button onClick={handleExportarPDF} disabled={exportLoading} className="w-full mt-6 bg-emerald-500 text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-400 transition-all">
                {exportLoading ? 'Procesando...' : 'Generar PDF'}
              </button>
            </div>

            <RecentActivity asistencias={asistencias} />
          </div>
        ) : (
          /* VISTA ENTRENADOR / ALUMNO */
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentRole === 'ENTRENADOR' && (
                <button onClick={() => { setTipoSeleccionado('ALUMNO'); setIsModalOpen(true); }} className="h-48 bg-gradient-to-br from-cyan-400 to-blue-600 text-black rounded-[2.5rem] font-black uppercase italic text-2xl flex flex-col items-center justify-center gap-3 hover:scale-[1.01] transition-all shadow-2xl shadow-cyan-500/20">
                  <span className="material-symbols-outlined text-6xl">inventory</span>
                  Pasar Asistencia Hoy
                </button>
              )}
              <div className="bg-[#0a0f18]/60 border border-white/5 p-10 rounded-[2.5rem] flex flex-col justify-center">
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">Asistencias del Mes</p>
                <h3 className="text-7xl font-black text-white">{stats.misAsistencias} <span className="text-xl text-slate-500 uppercase">Días</span></h3>
              </div>
            </div>
            
            {/* HISTORIAL PERSONAL TABULAR */}
            <div className="bg-[#0a0f18]/60 border border-white/5 rounded-[2.5rem] overflow-hidden">
              <div className="p-6 bg-white/[0.02] border-b border-white/5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Historial Reciente</p>
              </div>
              <div className="p-6 md:p-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {asistencias.map(a => (
                  <div key={a.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-1 hover:bg-white/10 transition-all">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">{format(new Date(a.fecha), "dd MMM")}</span>
                    <span className={`text-[10px] font-black uppercase italic ${a.estado === 'PRESENTE' ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {a.estado === 'PRESENTE' ? '✓ Presente' : 'X Ausente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <ModalAsistencia 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        tipo={tipoSeleccionado}
        fechaInicial={rangoDashboard.inicio} 
        onSaveSuccess={fetchDatos} 
      />
    </div>
  );
};

/* --- COMPONENTES AUXILIARES CON REFACTOR --- */

const DashboardCard = ({ title, count, label, icon, color, btnText, onBtnClick }) => (
  <div className="bg-[#0a0f18]/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl relative group overflow-hidden flex flex-col justify-between min-h-[320px]">
    <div className={`absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity ${color}`}>
      <span className="material-symbols-outlined text-[140px] leading-none">{icon}</span>
    </div>
    <div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">{title}</p>
      <div className="flex items-end gap-2">
        <h3 className="text-6xl font-black text-white leading-none">{count}</h3>
        <span className={`${color} text-[10px] font-bold mb-1 uppercase italic`}>{label}</span>
      </div>
    </div>
    <button onClick={onBtnClick} className="w-full mt-8 bg-white/5 text-white border border-white/10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-cyan-400 hover:text-black hover:border-cyan-400 transition-all flex items-center justify-center gap-2">
      <span className="material-symbols-outlined text-sm">edit_square</span> {btnText}
    </button>
  </div>
);

const RecentActivity = ({ asistencias }) => (
  <div className="bg-[#0a0f18]/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl flex flex-col h-full min-h-[320px]">
    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6 italic">Actividad en Rango</p>
    <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
      {asistencias.length > 0 ? asistencias.slice(0, 8).map((reg, i) => (
        <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${reg.estado === 'PRESENTE' ? 'bg-emerald-400' : 'bg-rose-500'}`}></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white uppercase leading-none">{reg.usuarios?.primer_nombre}</span>
              <span className="text-[8px] text-slate-500 uppercase mt-1">{reg.fecha}</span>
            </div>
          </div>
          <span className="text-[8px] font-black text-slate-400 uppercase px-2 py-1 bg-white/5 rounded-md">
            {reg.usuarios?.categoria || reg.usuarios?.rol}
          </span>
        </div>
      )) : (
        <p className="text-[9px] text-slate-600 uppercase font-black text-center py-10 italic">Sin registros</p>
      )}
    </div>
  </div>
);

export default DashboardPage;