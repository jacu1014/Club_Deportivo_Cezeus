import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import ModalAsistencia from '../components/ModalAsistencia';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { generarReporteAsistencia } from '../services/reporteAsistencia'; 

const DashboardPage = ({ user }) => {
  const [asistencias, setAsistencias] = useState([]);
  const [categorias, setCategorias] = useState([]); // Estado para categorías de la DB
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState('ALUMNO');
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  
  const hoyFecha = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const currentRole = user?.rol || 'ALUMNO';

  useEffect(() => { 
    fetchDatos();
    fetchCategorias(); // Traemos las categorías al cargar la página
  }, [hoyFecha, currentRole]);

  // 1. OBTENER CATEGORÍAS REALES DE LA BASE DE DATOS
  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('categoria')
        .not('categoria', 'is', null)
        .eq('rol', 'ALUMNO');

      if (error) throw error;
      
      // Limpiamos duplicados y ordenamos
      const unicas = [...new Set(data.map(u => u.categoria))].sort();
      setCategorias(unicas);
    } catch (err) {
      console.error("Error al obtener categorías:", err.message);
    }
  };

  const fetchDatos = async () => {
    setLoading(true);
    try {
      let query = supabase.from('asistencia').select('*, usuarios(*)');

      if (['ALUMNO', 'ENTRENADOR'].includes(currentRole)) {
        const inicioMes = startOfMonth(new Date()).toISOString().split('T')[0];
        const finMes = endOfMonth(new Date()).toISOString().split('T')[0];
        query = query.eq('usuario_id', user.id).gte('fecha', inicioMes).lte('fecha', finMes);
      } else {
        query = query.eq('fecha', hoyFecha);
      }

      const { data, error } = await query.order('fecha', { ascending: false });
      if (error) throw error;
      setAsistencias(data || []);
    } catch (err) {
      console.error("Error en Fetch:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportarPDF = async () => {
    const fInicio = document.getElementById('fecha_inicio').value;
    const fFin = document.getElementById('fecha_fin').value;
    const catFiltro = document.getElementById('filtro_categoria_pdf').value;

    if (!fInicio || !fFin) return alert("Por favor selecciona el rango de fechas.");

    setExportLoading(true);
    try {
      let query = supabase
        .from('asistencia')
        .select(`fecha, estado, usuarios(primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, rol, categoria)`)
        .eq('usuarios.rol', 'ALUMNO')
        .gte('fecha', fInicio)
        .lte('fecha', fFin);

      if (catFiltro !== 'TODAS') {
        query = query.eq('usuarios.categoria', catFiltro);
      }

      const { data: raw, error } = await query.order('fecha', { ascending: true });

      if (error) throw error;
      if (!raw || raw.length === 0) return alert("No se encontraron registros.");

      const fechasUnicas = [...new Set(raw.map(a => a.fecha))];
      const mapaAlumnos = {};
      
      raw.forEach(reg => {
        const u = reg.usuarios;
        const nombre = `${u.primer_nombre} ${u.primer_apellido}`.trim();
        if (!mapaAlumnos[nombre]) {
          mapaAlumnos[nombre] = { nombreCompleto: nombre, asistencias: {} };
        }
        mapaAlumnos[nombre].asistencias[reg.fecha] = reg.estado;
      });

      const titulo = catFiltro === 'TODAS' ? `General` : `Cat. ${catFiltro}`;
      await generarReporteAsistencia(`Reporte ${titulo} (${fInicio} a ${fFin})`, Object.values(mapaAlumnos), fechasUnicas);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const stats = useMemo(() => {
    const alumnos = asistencias.filter(a => a.usuarios?.rol === 'ALUMNO');
    const staff = asistencias.filter(a => ['ADMINISTRATIVO', 'ENTRENADOR', 'DIRECTOR'].includes(a.usuarios?.rol));
    
    return {
      alumnosPres: alumnos.filter(a => a.estado === 'PRESENTE').length,
      staffPres: staff.filter(a => a.estado === 'PRESENTE').length,
      misAsistencias: asistencias.filter(a => a.usuario_id === user.id && a.estado === 'PRESENTE').length,
      misFaltas: asistencias.filter(a => a.usuario_id === user.id && a.estado === 'AUSENTE').length,
    };
  }, [asistencias, user.id]);

  const handleOpen = (tipo) => {
    setTipoSeleccionado(tipo);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-10 text-slate-200 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-white font-black text-4xl uppercase italic tracking-tighter leading-none">
            {['ALUMNO', 'ENTRENADOR'].includes(currentRole) ? 'Mi' : 'Panel'} <span className="text-cyan-400">Cezeus</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">
            {format(new Date(), "EEEE dd 'de' MMMM", { locale: es })}
          </p>
        </div>
        <button onClick={fetchDatos} className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
          <span className={`material-symbols-outlined text-cyan-400 ${loading ? 'animate-spin' : ''}`}>refresh</span>
        </button>
      </div>

      {/* --- VISTA STAFF (ADMINS/DIRECTOR) --- */}
      {['SUPER_ADMIN', 'DIRECTOR', 'ADMINISTRATIVO'].includes(currentRole) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard title="Alumnos" count={stats.alumnosPres} label="Hoy" icon="groups" color="text-cyan-400" btnText="Pasar/Editar Lista" onBtnClick={() => handleOpen('ALUMNO')} />
          <DashboardCard title="Staff" count={stats.staffPres} label="Hoy" icon="badge" color="text-emerald-400" btnText="Gestionar Staff" onBtnClick={() => handleOpen('STAFF')} />

          {/* Exportación PDF Dinámica */}
          <div className="bg-[#0a0f18]/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl flex flex-col justify-between">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 italic">Reportes</p>
            <div className="space-y-2 mb-4">
              <select id="filtro_categoria_pdf" className="w-full bg-white/10 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-cyan-400">
                <option value="TODAS">TODAS LAS CATEGORÍAS</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input type="date" id="fecha_inicio" className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-2 text-[10px] text-white" />
                <input type="date" id="fecha_fin" className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-2 text-[10px] text-white" />
              </div>
            </div>
            <button onClick={handleExportarPDF} disabled={exportLoading} className="w-full bg-emerald-500 text-black py-3 rounded-2xl font-black uppercase text-[10px] hover:bg-emerald-400 transition-all">
              {exportLoading ? '...' : 'Exportar PDF'}
            </button>
          </div>

          <RecentActivity asistencias={asistencias} />
        </div>
      )}

      {/* --- VISTA ENTRENADOR --- */}
      {currentRole === 'ENTRENADOR' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={() => handleOpen('ALUMNO')}
            className="h-44 bg-gradient-to-br from-cyan-400 to-blue-600 text-black rounded-[2.5rem] font-black uppercase italic text-xl flex flex-col items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-xl shadow-cyan-500/20"
          >
            <span className="material-symbols-outlined text-5xl">inventory</span>
            Pasar Asistencia Hoy
          </button>
          <div className="bg-[#0a0f18]/60 border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-center">
            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">Mi Asistencia (Mes)</p>
            <h3 className="text-6xl font-black text-white">{stats.misAsistencias} <span className="text-xl text-slate-500">Días</span></h3>
          </div>
        </div>
      )}

      {/* --- HISTORIAL PERSONAL (Alumnos/Entrenadores) --- */}
      {['ALUMNO', 'ENTRENADOR'].includes(currentRole) && (
        <div className="bg-[#0a0f18]/60 border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historial Detallado</p>
          </div>
          <div className="p-8 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {asistencias.map(a => (
              <div key={a.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center hover:bg-white/10 transition-all">
                <span className="text-[9px] font-bold text-slate-500 uppercase mb-1">{format(new Date(a.fecha), "dd MMM")}</span>
                <span className={`text-[10px] font-black uppercase italic ${a.estado === 'PRESENTE' ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {a.estado === 'PRESENTE' ? '✓ Presente' : 'X Ausente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ModalAsistencia 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        tipo={tipoSeleccionado}
        fechaInicial={hoyFecha}
        onSaveSuccess={fetchDatos}
      />
    </div>
  );
};

/* --- SUB-COMPONENTES --- */

const DashboardCard = ({ title, count, label, icon, color, btnText, onBtnClick }) => (
  <div className="bg-[#0a0f18]/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl relative group overflow-hidden">
    <div className={`absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity ${color}`}>
      <span className="material-symbols-outlined text-9xl">{icon}</span>
    </div>
    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">{title}</p>
    <div className="flex items-end gap-2 mb-6">
      <h3 className="text-5xl font-black text-white leading-none">{count}</h3>
      <span className={`${color} text-xs font-bold mb-1 uppercase italic`}>{label}</span>
    </div>
    <button onClick={onBtnClick} className="w-full bg-white/5 text-white border border-white/10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-cyan-400 hover:text-black hover:border-cyan-400 transition-all flex items-center justify-center gap-2">
      <span className="material-symbols-outlined text-sm">edit_square</span> {btnText}
    </button>
  </div>
);

const RecentActivity = ({ asistencias }) => (
  <div className="bg-[#0a0f18]/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl flex flex-col">
    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6 italic">Actividad Hoy</p>
    <div className="space-y-4 overflow-y-auto max-h-[150px] pr-2 custom-scrollbar">
      {asistencias.slice(0, 5).map((reg, i) => (
        <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${reg.estado === 'PRESENTE' ? 'bg-emerald-400' : 'bg-rose-500'}`}></div>
            <span className="text-[10px] font-bold text-white uppercase">{reg.usuarios?.primer_nombre}</span>
          </div>
          <span className="text-[8px] font-black text-slate-400 uppercase px-2 py-1 bg-white/5 rounded-md">
            {reg.usuarios?.categoria || reg.usuarios?.rol}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default DashboardPage;