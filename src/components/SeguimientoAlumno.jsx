import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, Radar, 
  ResponsiveContainer, PolarRadiusAxis 
} from 'recharts';

const SeguimientoAlumno = ({ 
  alumno, 
  currentUser,
  observaciones = [], 
  onAgregarNota,
  onEditarNota,
  onEliminarNota,
  onSelectAlumno 
}) => {
  const [escribiendo, setEscribiendo] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [notaTexto, setNotaTexto] = useState('');
  const [categoriaNota, setCategoriaNota] = useState('Técnica');
  
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');
  const [filtroEstado, setFiltroEstado] = useState('ACTIVOS');

  const canManage = ['SUPER_ADMIN', 'ADMINISTRATIVO', 'ENTRENADOR', 'DIRECTOR'].includes(currentUser?.rol);

  useEffect(() => {
    fetchAlumnosSeguimiento();
  }, []);

  const fetchAlumnosSeguimiento = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rol', 'ALUMNO')
        .order('primer_apellido');

      if (error) throw error;
      setAlumnos(data || []);
    } catch (err) {
      console.error("Error cargando usuarios:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- HELPER PARA NORMALIZAR TEXTO (Quita tildes y pone en mayúsculas) ---
  const normalizar = (texto) => {
    return (texto || "").toString()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // --- LÓGICA DE FILTRADO ACTUALIZADA ---
  const filtrados = useMemo(() => {
    return alumnos.filter(a => {
      const nombreCompleto = `${a.primer_nombre} ${a.segundo_nombre || ''} ${a.primer_apellido} ${a.segundo_apellido || ''}`.toLowerCase();
      const matchBusqueda = nombreCompleto.includes(busqueda.toLowerCase()) || (a.numero_documento || '').includes(busqueda);
      
      // CAMBIO AQUÍ: Usamos .includes() para que "INFANTIL" entre en "Infantil (8-10 años)"
      const catAlumno = normalizar(a.categoria);
      const catFiltro = normalizar(filtroCategoria);
      const matchCategoria = filtroCategoria === 'TODOS' || catAlumno.includes(catFiltro);
      
      const matchEstado = (a.estado || 'ACTIVO').toUpperCase() === (filtroEstado === 'ACTIVOS' ? 'ACTIVO' : 'INACTIVO');
      
      return matchBusqueda && matchCategoria && matchEstado;
    });
  }, [alumnos, busqueda, filtroCategoria, filtroEstado]);

  // --- CONTADORES ACTUALIZADOS ---
  const countCat = (catLabel) => {
    if (catLabel === 'TODOS') return alumnos.length;
    const criterioNorm = normalizar(catLabel);
    
    return alumnos.filter(a => {
      const alumnoCatNorm = normalizar(a.categoria);
      // CAMBIO AQUÍ: Coincidencia parcial para que cuente correctamente
      return alumnoCatNorm.includes(criterioNorm);
    }).length;
  };

  const countEst = (est) => {
    return alumnos.filter(a => (a.estado || 'ACTIVO').toUpperCase() === est).length;
  };

  if (loading && !alumno) {
    return (
      <div className="p-20 text-center animate-pulse">
        <p className="text-primary font-black uppercase tracking-[0.5em] italic">Sincronizando base de datos...</p>
      </div>
    );
  }

  if (!alumno && canManage) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 px-4">
        <div className="text-center space-y-2">
          <h2 className="text-white font-black text-2xl uppercase italic tracking-tighter">
            Panel de <span className="text-primary">Seguimiento</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
            Administra los expedientes y bitácoras del club
          </p>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform">search</span>
            <input 
              type="text"
              placeholder="BUSCAR POR NOMBRE O DOCUMENTO..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-[#0a0f18]/80 border border-white/5 rounded-2xl py-6 pl-16 pr-6 text-sm text-white focus:border-primary/50 outline-none transition-all placeholder:text-slate-700 font-bold tracking-widest uppercase italic"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              {['TODOS', 'INICIACIÓN', 'INFANTIL', 'TRANSICIÓN'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFiltroCategoria(cat)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-3 border
                    ${filtroCategoria === cat 
                      ? 'bg-primary border-primary text-black' 
                      : 'bg-[#0a0f18]/40 border-white/5 text-slate-500 hover:border-white/20'}`}
                >
                  {cat}
                  <span className={`px-2 py-0.5 rounded-md text-[8px] ${filtroCategoria === cat ? 'bg-black/20 text-black' : 'bg-white/5 text-slate-600'}`}>
                    {countCat(cat)}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { id: 'ACTIVOS', label: 'ACTIVOS', color: 'text-emerald-500', bg: 'border-emerald-500/20' },
                { id: 'INACTIVOS', label: 'INACTIVOS', color: 'text-rose-500', bg: 'border-rose-500/20' }
              ].map(est => (
                <button
                  key={est.id}
                  onClick={() => setFiltroEstado(est.id)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-4 border
                    ${filtroEstado === est.id 
                      ? `${est.bg} bg-white/5 ${est.color}` 
                      : 'bg-transparent border-transparent text-slate-600 hover:text-slate-400'}`}
                >
                  {est.label}
                  <span className="font-bold">{countEst(est.id === 'ACTIVOS' ? 'ACTIVO' : 'INACTIVO')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.length > 0 ? filtrados.map((a) => (
            <button 
              key={a.id}
              onClick={() => onSelectAlumno?.(a)}
              className="flex items-center gap-4 p-5 bg-[#0a0f18]/60 border border-white/5 rounded-[2rem] hover:bg-primary/5 hover:border-primary/30 transition-all group text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-black text-primary border border-white/5 overflow-hidden">
                {a.foto_url ? (
                  <img src={a.foto_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span>{a.primer_nombre ? a.primer_nombre[0] : '?'}{a.primer_apellido ? a.primer_apellido[0] : ''}</span>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="text-white font-black text-xs uppercase group-hover:text-primary transition-colors italic truncate">
                  {a.primer_nombre} {a.primer_apellido}
                </h4>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{a.numero_documento}</p>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-[7px] text-primary/60 font-black uppercase">{a.categoria || 'S/C'}</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-800 group-hover:text-primary transition-colors text-sm">arrow_forward_ios</span>
            </button>
          )) : (
            <div className="col-span-full py-20 text-center opacity-40 italic uppercase text-xs tracking-widest text-white">
              No se encontraron alumnos
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!alumno) return null;

  const radarData = [
    { subject: 'Velocidad', A: alumno.stat_velocidad || 50 },
    { subject: 'Regate', A: alumno.stat_regate || 50 },
    { subject: 'Pase', A: alumno.stat_pase || 50 },
    { subject: 'Resistencia', A: alumno.stat_resistencia || 50 },
    { subject: 'Fuerza', A: alumno.stat_fuerza || 50 },
    { subject: 'Técnica', A: alumno.stat_tecnica || 50 },
  ];

  const handleGuardarNota = () => {
    if (!notaTexto.trim()) return;
    if (editandoId) {
      onEditarNota?.(editandoId, notaTexto, categoriaNota);
      setEditandoId(null);
    } else {
      onAgregarNota?.({
        usuario_id: alumno.id,
        nota: notaTexto,
        categoria_nota: categoriaNota
      });
    }
    setNotaTexto('');
    setEscribiendo(false);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4">
      {canManage && (
        <button 
          onClick={() => onSelectAlumno?.(null)}
          className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-primary transition-all uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Regresar al listado
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          <div className={`h-24 bg-gradient-to-b ${alumno.estado === 'ACTIVO' ? 'from-emerald-500/10' : 'from-rose-500/10'} to-transparent`}></div>
          <div className="px-8 pb-8">
            <div className="relative -mt-12 mb-6 flex justify-center lg:justify-start">
              <img 
                src={alumno.foto_url || "https://via.placeholder.com/150"} 
                className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-[#0a0f18] shadow-2xl"
                alt="Perfil" 
              />
              <div className={`absolute -bottom-2 lg:left-24 px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-lg ${alumno.estado === 'ACTIVO' ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'}`}>
                 {alumno.estado || 'ACTIVO'}
              </div>
            </div>
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-black text-white uppercase italic leading-none mb-1">
                {alumno.primer_nombre} <span className="text-primary">{alumno.primer_apellido}</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-8">
                {alumno.categoria} • ID: {alumno.numero_documento}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MiniCard label="RH / SANGRE" val={`${alumno.grupo_sanguineo || 'S'}${alumno.factor_rh || 'N'}`} icon="bloodtype" />
                <MiniCard label="EPS / ASEGURADORA" val={alumno.eps || 'NO REGISTRA'} icon="health_and_safety" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0f18]/60 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-center items-center">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-4 italic opacity-60">Análisis de Desempeño</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#ffffff10" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Habilidades" dataKey="A" stroke="#13ecec" fill="#13ecec" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">history_edu</span>
            <span className="font-black text-[11px] text-white uppercase tracking-widest">Bitácora de Seguimiento</span>
          </div>
          {canManage && !escribiendo && (
            <button 
              onClick={() => { setEditandoId(null); setEscribiendo(true); setNotaTexto(''); }} 
              className="bg-primary text-[#0a1118] text-[9px] font-black px-5 py-2 rounded-xl uppercase transition-all"
            >
              Nueva Nota
            </button>
          )}
        </div>

        {escribiendo && (
          <div className="p-8 bg-primary/5 border-b border-white/10 space-y-5">
            <div className="flex flex-wrap gap-2">
              {['Técnica', 'Física', 'Médica', 'Disciplina'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setCategoriaNota(cat)}
                  className={`text-[9px] font-black px-4 py-2 rounded-full uppercase transition-all border ${categoriaNota === cat ? 'bg-primary border-primary text-[#0a1118]' : 'bg-white/5 border-white/10 text-slate-500'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <textarea 
              value={notaTexto}
              onChange={(e) => setNotaTexto(e.target.value)}
              placeholder="Escribe la observación aquí..."
              className="w-full bg-[#0a0f18] border border-white/10 rounded-2xl p-5 text-sm text-white outline-none"
              rows={4}
            />
            <div className="flex gap-4 justify-end">
              <button onClick={() => setEscribiendo(false)} className="text-[10px] text-slate-500 font-black uppercase">Cancelar</button>
              <button onClick={handleGuardarNota} className="bg-primary text-[#0a1118] px-8 py-3 rounded-xl text-[10px] font-black uppercase">
                {editandoId ? 'Actualizar' : 'Publicar'}
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-white/[0.05]">
          {observaciones.length > 0 ? observaciones.map((obs) => (
            <ObservationRow key={obs.id} obs={obs} canManage={canManage} />
          )) : (
            <div className="p-10 text-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">
              No hay registros en la bitácora
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ObservationRow = ({ obs, canManage }) => (
  <div className="px-8 py-8 flex flex-col md:flex-row gap-6 hover:bg-white/[0.01] transition-all">
    <div className="min-w-[120px]">
      <span className="text-[8px] font-black px-3 py-1.5 rounded-lg border bg-primary/10 border-primary/20 text-primary uppercase">
        {obs.categoria_nota}
      </span>
    </div>
    <div className="flex-1">
      <p className="text-[14px] text-slate-300 italic">"{obs.nota}"</p>
      <div className="flex items-center gap-3 mt-4 text-[9px] text-white/40 font-bold uppercase">
        <span>{obs.autor_nombre || 'Entrenador'}</span>
        <span>•</span>
        <span>{obs.created_at ? new Date(obs.created_at).toLocaleDateString() : 'Reciente'}</span>
      </div>
    </div>
  </div>
);

const MiniCard = ({ label, val, icon }) => (
  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4 group transition-colors hover:border-primary/30">
    <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/5 group-hover:bg-primary/10 transition-all">
      <span className="material-symbols-outlined text-slate-400 text-xl group-hover:text-primary">{icon}</span>
    </div>
    <div>
      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs font-black text-white uppercase">{val}</p>
    </div>
  </div>
);

export default SeguimientoAlumno;