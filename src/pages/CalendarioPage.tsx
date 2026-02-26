import React, { useState, useMemo, useEffect } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, eachDayOfInterval
} from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';
import { CATEGORIAS_EVENTOS, COLORES_CUMPLEANIOS } from '../constants/data';
import ModalEvento from '../components/ModalEvento';

const CalendarioPage = ({ userRol }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  
  const [filtrosActivos, setFiltrosActivos] = useState([
    ...CATEGORIAS_EVENTOS.map(cat => cat.id),
    'CUMPLEAÑOS'
  ]);

  const canManage = ['SUPER_ADMIN', 'ADMINISTRATIVO', 'DIRECTOR'].includes(userRol);

  const fetchEventos = async () => {
    try {
      setLoading(true);
      const { data: dataEventos, error: errorEv } = await supabase.from('eventos').select('*');
      
      // Mantenemos la carga desde la tabla 'usuarios' como recordamos
      const { data: dataUsuarios, error: errorUsr } = await supabase
        .from('usuarios')
        .select('primer_nombre, primer_apellido, fecha_nacimiento, rol')
        .not('fecha_nacimiento', 'is', null);

      if (errorEv) throw errorEv;
      if (errorUsr) throw errorUsr;
      
      const normales = dataEventos.map(ev => {
        const configCategoria = CATEGORIAS_EVENTOS.find(
          cat => cat.id.toUpperCase() === ev.categoria?.toUpperCase()
        );
        const fechaOriginal = new Date(ev.fecha_inicio);
        const fechaAjustada = new Date(fechaOriginal.getTime() + fechaOriginal.getTimezoneOffset() * 60000);

        return {
          ...ev,
          fecha_inicio: fechaAjustada,
          esCumpleanios: false,
          color: configCategoria ? configCategoria.color : (ev.color || '#94a3b8')
        };
      });

      const cumpleanios = dataUsuarios.map(usr => {
        const [anioNac, mesNac, diaNac] = usr.fecha_nacimiento.split('-').map(Number);
        const anioVista = currentMonth.getFullYear();
        const fechaEvento = new Date(anioVista, mesNac - 1, diaNac, 12, 0, 0);
        const trimestre = mesNac <= 3 ? 'T1' : mesNac <= 6 ? 'T2' : mesNac <= 9 ? 'T3' : 'T4';
        const edadCumplida = anioVista - anioNac;

        return {
          id: `cumple-${usr.primer_nombre}-${usr.fecha_nacimiento}`,
          titulo: `CUMPLEAÑOS: ${usr.primer_nombre} ${usr.primer_apellido || ''}`,
          categoria: 'CUMPLEAÑOS',
          fecha_inicio: fechaEvento,
          color: COLORES_CUMPLEANIOS[trimestre],
          esCumpleanios: true,
          rolUsuario: usr.rol,
          edadParaMostrar: edadCumplida
        };
      });
      
      setEventos([...normales, ...cumpleanios]);
    } catch (err) {
      console.error("Error cargando agenda:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEventos(); }, [currentMonth]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const eventosFiltrados = useMemo(() => {
    return eventos.filter(ev => filtrosActivos.includes(ev.categoria));
  }, [eventos, filtrosActivos]);

  const toggleFiltro = (catId) => {
    setFiltrosActivos(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleEditarEvento = (evento) => {
    if (!canManage || evento.esCumpleanios) return; 
    setEventoSeleccionado(evento);
    setShowModal(true);
  };

  const listaFiltros = useMemo(() => {
    const categoriasSinCumple = CATEGORIAS_EVENTOS.filter(c => c.id !== 'CUMPLEAÑOS');
    return [...categoriasSinCumple, { id: 'CUMPLEAÑOS', label: 'CUMPLEAÑOS', color: '#ec4899', icono: 'cake' }];
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4 mt-4 text-slate-200">
      
      {/* 1. HEADER (REGISTRO) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left space-y-1">
          <h2 className="text-white font-black text-3xl uppercase italic tracking-tighter leading-none">
            Calendario de <span className="text-cyan-400">Actividades</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
            Gestión de entrenamientos, partidos y eventos del club
          </p>
        </div>

        {canManage && (
          <button 
            onClick={() => { setEventoSeleccionado(null); setShowModal(true); }}
            className="w-full md:w-auto bg-cyan-400 text-[#0a1118] text-[10px] font-black px-8 py-4 rounded-2xl uppercase transition-all hover:scale-105 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Registrar Nuevo Evento
          </button>
        )}
      </div>

      {/* 2. FILTROS (Layout Horizontal) */}
      <div className="bg-[#0a0f18]/80 border border-white/10 rounded-[2rem] p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-5 px-2">
          <span className="material-symbols-outlined text-cyan-400 text-sm">filter_list</span>
          <h4 className="font-black text-[10px] text-white uppercase tracking-[0.2em]">Filtros Rápidos</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {listaFiltros.map(cat => {
            const isActive = filtrosActivos.includes(cat.id);
            return (
              <button 
                key={cat.id} 
                onClick={() => toggleFiltro(cat.id)}
                className={`flex items-center gap-3 p-2.5 px-4 rounded-xl border transition-all duration-300 ${isActive ? 'bg-[#161b22] border-white/10 shadow-lg' : 'bg-transparent border-transparent opacity-40 hover:opacity-100 hover:bg-white/5'}`}
              >
                <span className="material-symbols-outlined text-[16px]" style={{ color: cat.color }}>{cat.icono || 'label'}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GRID PRINCIPAL: CALENDARIO Y PRÓXIMOS (Responsive) */}
      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-8">
        
        {/* 3. CALENDARIO (3 columnas en PC, Full en Móvil) */}
        <div className="lg:col-span-3 bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] p-4 md:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden order-1">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <h3 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h3>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors">
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <button onClick={() => setCurrentMonth(new Date())} className="px-4 text-[9px] font-black uppercase text-cyan-400 tracking-widest hover:bg-white/5 rounded-lg">Hoy</button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors">
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Wrapper responsivo con scroll horizontal */}
          <div className="w-full overflow-x-auto custom-scrollbar-h">
            <div className="min-w-[750px] lg:min-w-full pb-4">
              <div className="grid grid-cols-7 border-b border-white/5 mb-4 text-center">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                  <div key={d} className="py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">{d}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)] border-l border-t border-white/5">
                {days.map((day, idx) => {
                  const eventosDelDia = eventosFiltrados.filter(ev => isSameDay(ev.fecha_inicio, day));
                  const esHoy = isSameDay(day, new Date());
                  
                  return (
                    <div 
                      key={idx} 
                      className={`border-r border-b border-white/5 p-1.5 transition-all relative flex flex-col h-full min-h-[130px] 
                        ${!isSameMonth(day, currentMonth) ? 'bg-black/40 opacity-20' : 'hover:bg-white/[0.03]'} 
                        ${esHoy ? 'bg-cyan-500/[0.07]' : ''}`}
                    >
                      <div className="flex justify-between items-center mb-1.5 px-1">
                        <span className={`text-[10px] font-black ${esHoy ? 'text-cyan-400 underline decoration-2 underline-offset-4' : 'text-slate-500'}`}>
                          {format(day, 'd')}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
                        {eventosDelDia.map(ev => (
                          <div 
                            key={ev.id} 
                            onClick={() => handleEditarEvento(ev)}
                            className={`w-full p-2 rounded-xl border border-white/10 text-[9px] font-black uppercase italic transition-transform 
                              ${ev.esCumpleanios ? 'cursor-default' : 'cursor-pointer hover:scale-[1.02] active:scale-95'}`}
                            style={{ 
                              backgroundColor: `${ev.color}15`, 
                              color: ev.color, 
                              borderLeft: `3px solid ${ev.color}` 
                            }}
                          >
                            <div className="flex items-center gap-1.5">
                              {ev.esCumpleanios && <span className="material-symbols-outlined text-[12px]">cake</span>}
                              <span className="truncate">
                                {ev.titulo} 
                                {ev.esCumpleanios && ev.rolUsuario === 'ALUMNO' && ` (${ev.edadParaMostrar})`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4. PRÓXIMOS AGENDAMIENTOS (1 columna en PC, Abajo en móvil) */}
        <div className="flex flex-col gap-6 order-2">
          <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] p-6 shadow-xl flex flex-col h-fit lg:max-h-[800px]">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-cyan-400 text-sm">event_upcoming</span>
              <h4 className="font-black text-[10px] text-white uppercase tracking-widest italic opacity-60">Próximos eventos</h4>
            </div>
            
            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
              {eventos
                .filter(ev => ev.fecha_inicio >= new Date().setHours(0, 0, 0, 0))
                .sort((a, b) => a.fecha_inicio - b.fecha_inicio)
                .slice(0, 12)
                .map(ev => (
                  <div key={ev.id} className="relative pl-4 border-l-2 border-white/10 group py-1 hover:border-cyan-400 transition-colors">
                    <p className="text-[8px] font-black text-cyan-400 uppercase">{format(ev.fecha_inicio, "dd MMM", { locale: es })}</p>
                    <h5 className="text-[11px] font-black uppercase italic text-white truncate group-hover:text-cyan-400 transition-colors">
                      {ev.titulo}
                    </h5>
                  </div>
                ))}
              {eventos.length === 0 && !loading && (
                <p className="text-[10px] text-slate-600 text-center py-10 uppercase font-bold italic">No hay eventos próximos</p>
              )}
            </div>
          </div>
        </div>

      </div>

      <ModalEvento 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setEventoSeleccionado(null); }} 
        onSave={fetchEventos}
        eventoParaEditar={eventoSeleccionado}
      />
    </div>
  );
};

export default CalendarioPage;