import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import ModalAsistencia from '../components/ModalAsistencia';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { generarReporteAsistencia } from '../services/reporteAsistencia'; 

const DashboardPage = ({ user }) => {
  const [asistencias, setAsistencias] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState('ALUMNO');
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Usamos format para asegurar que la fecha sea la local de Colombia y no UTC
  const hoyFecha = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const currentRole = user?.rol || 'ALUMNO';

  useEffect(() => { 
    fetchDatos(); 
  }, [hoyFecha, currentRole]);

  const fetchDatos = async () => {
    setLoading(true);
    try {
      let query = supabase.from('asistencia').select('*, usuarios(*)');

      if (currentRole === 'ALUMNO') {
        const inicioMes = startOfMonth(new Date()).toISOString().split('T')[0];
        const finMes = endOfMonth(new Date()).toISOString().split('T')[0];
        query = query
          .eq('usuario_id', user.id)
          .gte('fecha', inicioMes)
          .lte('fecha', finMes);
      } else {
        // Para Admin/Entrenador vemos lo del día actual
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

    if (!fInicio || !fFin) return alert("Selecciona el rango de fechas.");

    setExportLoading(true);
    try {
      const { data: raw, error } = await supabase
        .from('asistencia')
        .select(`
          fecha, 
          estado, 
          usuarios(primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, rol)
        `)
        .eq('usuarios.rol', 'ALUMNO')
        .gte('fecha', fInicio)
        .lte('fecha', fFin)
        .order('fecha', { ascending: true });

      if (error) throw error;
      if (!raw || raw.length === 0) return alert("No hay registros en esas fechas.");

      // Filtrar fechas únicas (Solo días que tienen registros reales)
      const fechasUnicas = [...new Set(raw.map(a => a.fecha))];

      // Agrupar por nombre completo
      const mapaAlumnos = {};
      raw.forEach(reg => {
        const u = reg.usuarios;
        const nombre = `${u.primer_nombre} ${u.segundo_nombre || ''} ${u.primer_apellido} ${u.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim();
        
        if (!mapaAlumnos[nombre]) {
          mapaAlumnos[nombre] = { nombreCompleto: nombre, asistencias: {} };
        }
        mapaAlumnos[nombre].asistencias[reg.fecha] = reg.estado;
      });

      await generarReporteAsistencia(
        `Reporte del ${fInicio} al ${fFin}`, 
        Object.values(mapaAlumnos), 
        fechasUnicas
      );
    } catch (err) {
      alert("Error al generar PDF: " + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const stats = useMemo(() => {
    const alumnos = asistencias.filter(a => a.usuarios?.rol === 'ALUMNO');
    return {
      alumnosPres: alumnos.filter(a => a.estado === 'PRESENTE').length,
      alumnosFaltas: alumnos.filter(a => a.estado === 'AUSENTE').length,
    };
  }, [asistencias]);

  const handleOpen = (tipo) => {
    setTipoSeleccionado(tipo);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-10 text-slate-200 animate-in fade-in duration-700">
      
      {/* SECCIÓN BIENVENIDA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-white font-black text-4xl uppercase italic tracking-tighter leading-none">
            {currentRole === 'ALUMNO' ? 'Mi' : 'Panel'} <span className="text-cyan-400">{currentRole === 'ALUMNO' ? 'Seguimiento' : 'Cezeus'}</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">
            {format(new Date(), "EEEE dd 'de' MMMM", { locale: es })}
          </p>
        </div>
        <button 
          onClick={fetchDatos}
          className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
          title="Actualizar datos"
        >
          <span className={`material-symbols-outlined text-cyan-400 ${loading ? 'animate-spin' : ''}`}>refresh</span>
        </button>
      </div>

      {/* --- VISTA ADMIN / STAFF --- */}
      {['SUPER_ADMIN', 'DIRECTOR', 'ADMINISTRATIVO', 'ENTRENADOR'].includes(currentRole) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard 
            title="Asistencia Alumnos" 
            count={stats.alumnosPres} 
            label="Presentes Hoy" 
            icon="groups" 
            color="text-cyan-400" 
            btnText="Pasar Lista"
            onBtnClick={() => handleOpen('ALUMNO')}
          />

          {/* Card de Exportación PDF (Solo Admins) */}
          {currentRole !== 'ENTRENADOR' && (
            <div className="bg-[#0a0f18]/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl flex flex-col justify-between group">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Reportes Pro</p>
              <div className="space-y-2 mb-6">
                <input type="date" id="fecha_inicio" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-emerald-500 outline-none" />
                <input type="date" id="fecha_fin" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-emerald-500 outline-none" />
              </div>
              <button 
                onClick={handleExportarPDF}
                disabled={exportLoading}
                className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">{exportLoading ? 'hourglass_empty' : 'picture_as_pdf'}</span>
                {exportLoading ? 'Procesando...' : 'Generar Reporte PDF'}
              </button>
            </div>
          )}

          <RecentActivity asistencias={asistencias} />
        </div>
      )}

      {/* --- VISTA EXCLUSIVA ALUMNO --- */}
      {currentRole === 'ALUMNO' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-[2.5rem] backdrop-blur-xl">
              <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest mb-2">Inasistencias del Mes</p>
              <h3 className="text-6xl font-black text-rose-500">{stats.alumnosFaltas}</h3>
              <p className="text-slate-500 text-[9px] font-bold uppercase mt-4 italic">"La disciplina es el puente entre metas y logros."</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[2.5rem] backdrop-blur-xl">
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">Clases Asistidas</p>
              <h3 className="text-6xl font-black text-emerald-400">{stats.alumnosPres}</h3>
            </div>
          </div>

          <div className="bg-[#0a0f18]/60 border border-white/5 rounded-[2.5rem] overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mi Historial de Entrenamiento</p>
            </div>
            <div className="p-8 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {asistencias.map(a => (
                <div key={a.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center group hover:bg-white/10 transition-all">
                  <span className="text-[9px] font-bold text-slate-500 uppercase mb-1">{format(new Date(a.fecha), "dd MMM")}</span>
                  <span className={`text-[10px] font-black uppercase italic ${a.estado === 'PRESENTE' ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {a.estado === 'PRESENTE' ? '✓ PRESENTE' : 'X AUSENTE'}
                  </span>
                </div>
              ))}
            </div>
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

/* --- SUB-COMPONENTES INTERNOS --- */

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
    <button 
      onClick={onBtnClick}
      className="w-full bg-white/5 text-white border border-white/10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-cyan-400 hover:text-black hover:border-cyan-400 transition-all flex items-center justify-center gap-2"
    >
      <span className="material-symbols-outlined text-sm">assignment_turned_in</span> {btnText}
    </button>
  </div>
);

const RecentActivity = ({ asistencias }) => (
  <div className="bg-[#0a0f18]/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl">
    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">Actividad Reciente</p>
    <div className="space-y-4">
      {asistencias.slice(0, 5).map((reg, i) => (
        <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${reg.estado === 'PRESENTE' ? 'bg-emerald-400' : 'bg-rose-500'}`}></div>
            <span className="text-[10px] font-bold text-white uppercase">{reg.usuarios?.primer_nombre} {reg.usuarios?.primer_apellido}</span>
          </div>
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter bg-white/5 px-2 py-1 rounded-md">{reg.usuarios?.rol}</span>
        </div>
      ))}
      {asistencias.length === 0 && (
        <p className="text-center py-4 text-slate-600 text-[9px] font-black uppercase tracking-widest italic">No hay actividad registrada hoy</p>
      )}
    </div>
  </div>
);

export default DashboardPage;