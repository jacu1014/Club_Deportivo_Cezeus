import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import ModalAsistencia from '../components/ModalAsistencia';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { generarReporteAsistencia } from '../services/reporteAsistencia'; 

const DashboardPage = ({ user }) => {
  const [asistencias, setAsistencias] = useState([]);
  const [categorias, setCategorias] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState('ALUMNO');
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Usamos la fecha local para las consultas diarias
  const hoyFecha = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const currentRole = user?.rol || 'ALUMNO';

  useEffect(() => { 
    fetchDatos();
    fetchCategorias();
  }, [hoyFecha, currentRole]);

  // 1. OBTENER CATEGORÍAS REALES
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
      console.error("Error al obtener categorías:", err.message);
    }
  };

  // 2. FETCH DATOS (TABLA: asistencias)
  const fetchDatos = async () => {
    setLoading(true);
    try {
      // Cambio clave: 'asistencias' en plural
      let query = supabase.from('asistencias').select('*, usuarios(*)');

      if (['ALUMNO', 'ENTRENADOR'].includes(currentRole)) {
        // Vista personal: historial del mes
        const inicioMes = startOfMonth(new Date()).toISOString().split('T')[0];
        const finMes = endOfMonth(new Date()).toISOString().split('T')[0];
        query = query.eq('usuario_id', user.id).gte('fecha', inicioMes).lte('fecha', finMes);
      } else {
        // Vista Admin: registros de hoy
        query = query.eq('fecha', hoyFecha);
      }

      const { data, error } = await query.order('fecha', { ascending: false });
      if (error) throw error;
      setAsistencias(data || []);
    } catch (err) {
      console.error("Error en Fetch Dashboard:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. EXPORTAR PDF (TABLA: asistencias)
  const handleExportarPDF = async () => {
    const fInicio = document.getElementById('fecha_inicio').value;
    const fFin = document.getElementById('fecha_fin').value;
    const catFiltro = document.getElementById('filtro_categoria_pdf').value;

    if (!fInicio || !fFin) return alert("Por favor selecciona el rango de fechas.");

    setExportLoading(true);
    try {
      // Cambio clave: 'asistencias' en plural
      let query = supabase
        .from('asistencias')
        .select(`
          fecha, 
          estado, 
          usuarios!inner(primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, rol, categoria)
        `)
        .eq('usuarios.rol', 'ALUMNO')
        .gte('fecha', fInicio)
        .lte('fecha', fFin);

      if (catFiltro !== 'TODAS') {
        query = query.eq('usuarios.categoria', catFiltro);
      }

      const { data: raw, error } = await query.order('fecha', { ascending: true });

      if (error) throw error;
      if (!raw || raw.length === 0) return alert("No se encontraron registros para este filtro.");

      // Procesar datos para el reporte
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
      alert("Error en reporte: " + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  // 4. ESTADÍSTICAS EN TIEMPO REAL
  const stats = useMemo(() => {
    const alumnos = asistencias.filter(a => a.usuarios?.rol === 'ALUMNO');
    const staff = asistencias.filter(a => ['ADMINISTRATIVO', 'ENTRENADOR', 'DIRECTOR', 'SUPER_ADMIN'].includes(a.usuarios?.rol));
    
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
        <button onClick={fetchDatos} className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group">
          <span className={`material-symbols-outlined text-cyan-400 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}>refresh</span>
        </button>
      </div>

      {/* VISTA STAFF */}
      {['SUPER_ADMIN', 'DIRECTOR', 'ADMINISTRATIVO'].includes(currentRole) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard title="Alumnos" count={stats.alumnosPres} label="Hoy" icon="groups" color="text-cyan-400" btnText="Pasar/Editar Lista" onBtnClick={() => handleOpen('ALUMNO')} />
          <DashboardCard title="Staff" count={stats.staffPres} label="Hoy" icon="badge" color="text-emerald-400" btnText="Gestionar Staff" onBtnClick={() => handleOpen('STAFF')} />

          <div className="bg-[#0a0f18]/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl flex flex-col justify-between">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 italic">Reportes PDF</p>
            <div className="space-y-2 mb-4">
              <select id="filtro_categoria_pdf" className="w-full bg-white/10 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-cyan-400 uppercase font-bold">
                <option value="TODAS">TODAS LAS CATEGORÍAS</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input type="date" id="fecha_inicio" className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-2 text-[10px] text-white font-bold" defaultValue={hoyFecha}/>
                <input type="date" id="fecha_fin" className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-2 text-[10px] text-white font-bold" defaultValue={hoyFecha}/>
              </div>
            </div>
            <button onClick={handleExportarPDF} disabled={exportLoading} className="w-full bg-emerald-500 text-black py-3 rounded-2xl font-black uppercase text-[10px] hover:bg-emerald-400 transition-all disabled:opacity-50">
              {exportLoading ? 'Generando...' : 'Exportar PDF'}
            </button>
          </div>

          <RecentActivity asistencias={asistencias} />
        </div>
      )}

      {/* VISTA ENTRENADOR RÁPIDA */}
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

      {/* HISTORIAL PERSONAL */}
      {['ALUMNO', 'ENTRENADOR'].includes(currentRole) && (
        <div className="bg-[#0a0f18]/60 border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumen Mensual de Asistencias</p>
          </div>
          <div className="p-8 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {asistencias.length > 0 ? asistencias.map(a => (
              <div key={a.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center hover:bg-white/10 transition-all">
                <span className="text-[9px] font-bold text-slate-500 uppercase mb-1">{format(new Date(a.fecha), "dd MMM")}</span>
                <span className={`text-[10px] font-black uppercase italic ${a.estado === 'PRESENTE' ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {a.estado === 'PRESENTE' ? '✓ Presente' : 'X Ausente'}
                </span>
              </div>
            )) : (
              <p className="col-span-full text-center text-[10px] uppercase font-bold text-slate-600">No hay registros este mes</p>
            )}
          </div>
        </div>
      )}

      <ModalAsistencia 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        tipo={tipoSeleccionado}
        fechaInicial={hoyFecha}
        onSaveSuccess={fetchDatos} // Esto actualiza el dashboard al cerrar el modal
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
    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6 italic">Actividad Reciente</p>
    <div className="space-y-4 overflow-y-auto max-h-[150px] pr-2 custom-scrollbar">
      {asistencias.length > 0 ? asistencias.slice(0, 5).map((reg, i) => (
        <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${reg.estado === 'PRESENTE' ? 'bg-emerald-400' : 'bg-rose-500'}`}></div>
            <span className="text-[10px] font-bold text-white uppercase">{reg.usuarios?.primer_nombre} {reg.usuarios?.primer_apellido}</span>
          </div>
          <span className="text-[8px] font-black text-slate-400 uppercase px-2 py-1 bg-white/5 rounded-md">
            {reg.usuarios?.categoria || reg.usuarios?.rol}
          </span>
        </div>
      )) : (
        <p className="text-[9px] text-slate-600 uppercase font-black text-center py-4 italic">Sin actividad hoy</p>
      )}
    </div>
  </div>
);

export default DashboardPage;