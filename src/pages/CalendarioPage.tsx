import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, eachDayOfInterval
} from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';
import { CATEGORIAS_EVENTOS, COLORES_CUMPLEANIOS } from '../constants/data';
import ModalEvento from '../components/ModalEvento';
import { usePageLog } from '../hooks/usePageLog';
import { registrarLog } from '../lib/activity';

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

  // NUEVO: log automático de visita
  usePageLog('CALENDARIO', { rol: userRol });

  const fetchEventos = useCallback(async () => {
    try {
      setLoading(true);
      const { data: dataEventos, error: errorEv } = await supabase.from('eventos').select('*');
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
      // silencioso en produccion
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => { fetchEventos(); }, [fetchEventos]);

  // NUEVO: log al guardar un evento (nuevo o editado)
  const handleSaveEvento = async () => {
    await registrarLog({
      accion: eventoSeleccionado ? 'EDITAR_EVENTO' : 'CREAR_EVENTO',
      modulo: 'CALENDARIO',
      descripcion: eventoSeleccionado
        ? `Evento editado: ${eventoSeleccionado.titulo}`
        : 'Nuevo evento creado en el calendario',
      detalles: eventoSeleccionado
        ? { id_evento: eventoSeleccionado.id, categoria: eventoSeleccionado.categoria }
        : {}
    });
    fetchEventos();
  };

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
      
      {/* HEADER */}
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

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-8">
        
        {/* BARRA LATERAL (Filtros) */}
        <div className="order-2 lg:order-2 space-y-6">
          <div className="bg-[#0a0f18]/80 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-8 px-2">
              <span className="material-symbols-outlined text-cyan-400 text-sm">filter_list</span>
              <h4 className="font-black text-[11px] text-white uppercase tracking-[0.2em]">Filtrar Vista</h4>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
              {listaFiltros.map(cat => {
                const isActive = filtrosActivos.includes(cat.id);
                return (
                  <button 
                    key={cat.id} 
                    onClick={() => toggleFiltro(cat.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-[1.2rem] border transition-all duration-300 group
                      ${isActive ? 'bg-[#161b22] border-white/10 shadow-lg' : 'bg-transparent border-transparent opacity-40 hover:opacity-100 hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-[18px]" style={{ color: cat.color }}>
                        {cat.icono || 'label'}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                        {cat.label}
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all
                      ${isActive ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'border-white/10 bg-white/5'}`}>
                      {isActive && <span className="material-symbols-outlined text-[12px] text-black font-black">check</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PRÓXIMOS EN AGENDA */}
          <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] p-6 shadow-xl max-h-[400px] overflow-hidden flex flex-col">
            <h4 className="font-black text-[10px] text-white uppercase tracking-widest mb-6 italic opacity-60">Próximos en agenda</h4>
            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
              {eventos
                .filter(ev => { const hoy = new Date(); hoy.setHours(0,0,0,0); return ev.fecha_inicio >= hoy; })
                .sort((a, b) => a.fecha_inicio - b.fecha_inicio)
                .slice(0, 10)
                .map(ev => (
                  <div 
                    key={ev.id}
                    className={`relative pl-4 border-l-2 transition-all group py-1 ${ev.esCumpleanios ? 'border-pink-500/30 hover:border-pink-500' : 'border-white/10 hover:border-cyan-400/50'}`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[8px] font-black text-cyan-400 uppercase">
                        {format(ev.fecha_inicio, "dd MMM", { locale: es })}
                      </p>
                      {ev.esCumpleanios && <span className="material-symbols-outlined text-[10px] text-pink-500">cake</span>}
                    </div>
                    <h5 className={`text-[11px] font-black uppercase italic transition-colors truncate ${ev.esCumpleanios ? 'text-pink-300 group-hover:text-pink-400' : 'text-white group-hover:text-cyan-400'}`}>
                      {ev.titulo}
                      {ev.esCumpleanios && ev.rolUsuario === 'ALUMNO' && (
                        <span className="ml-1 text-[9px] text-pink-500/80">({ev.edadParaMostrar} AÑOS)</span>
                      )}
                    </h5>
                  </div>
                ))}
              {eventos.filter(ev => ev.fecha_inicio >= new Date().setHours(0,0,0,0)).length === 0 && (
                <p className="text-[10px] text-slate-500 italic text-center py-4 uppercase tracking-widest">Sin actividades próximas</p>
              )}
            </div>
          </div>
        </div>

        {/* CALENDARIO PRINCIPAL */}
        <div className="order-1 lg:order-1 lg:col-span-3 bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] p-4 md:p-8 shadow-2xl backdrop-blur-md relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
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
            {loading && <div className="text-[10px] font-black text-cyan-400 animate-pulse uppercase tracking-widest">Sincronizando...</div>}
          </div>

          <div className="lg:hidden flex justify-end mb-2 animate-bounce">
            <div className="flex items-center gap-1 bg-cyan-400/10 border border-cyan-400/20 px-3 py-1 rounded-full">
              <span className="text-[8px] font-black text-cyan-400 uppercase tracking-tighter">Desliza para ver más</span>
              <span className="material-symbols-outlined text-[12px] text-cyan-400">arrow_forward</span>
            </div>
          </div>

          <div className="w-full select-none">
            <div className="w-full pb-4">
              <div className="grid grid-cols-7 border-b border-white/5 mb-2 text-center">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                  <div key={i} className="py-3 text-[10px] font-black uppercase text-slate-500">
                    <span className="hidden md:inline">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i]}</span>
                    <span className="md:hidden">{d}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)] border-l border-t border-white/5">
                {days.map((day, idx) => {
                  const eventosDelDia = eventosFiltrados.filter(ev => isSameDay(ev.fecha_inicio, day));
                  const numEventos = eventosDelDia.length;
                  const esHoy = isSameDay(day, new Date());
                  const esMesActual = isSameMonth(day, currentMonth);
                  const esMuchosEventos = numEventos > 2;
                  return (
                    <div 
                      key={idx}
                      className={`border-r border-b border-white/5 p-1 md:p-2 transition-all relative flex flex-col min-h-[80px] md:min-h-[140px]
                        ${!esMesActual ? 'bg-black/40 opacity-20' : 'hover:bg-white/[0.03]'}
                        ${esHoy ? 'bg-cyan-500/[0.05]' : ''}`}
                    >
                      <div className="flex justify-between items-center mb-1 px-1">
                        <span className={`text-[10px] md:text-[11px] font-black ${esHoy ? 'text-cyan-400 bg-cyan-400/10 px-1.5 rounded-md' : 'text-slate-500'}`}>
                          {format(day, 'd')}
                        </span>
                        {numEventos > 0 && (
                          <div className="flex gap-0.5">
                            {eventosDelDia.slice(0, 3).map(ev => (
                              <div key={ev.id} className="w-1 h-1 rounded-full" style={{ backgroundColor: ev.color }} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={`flex-1 flex gap-1.5 overflow-y-auto custom-scrollbar pr-0.5
                        ${esMuchosEventos ? 'flex-row flex-wrap content-start' : 'flex-col'}`}>
                        {eventosDelDia.map(ev => {
                          const configCat = CATEGORIAS_EVENTOS.find(c => c.id.toUpperCase() === ev.categoria?.toUpperCase());
                          return (
                            <div 
                              key={ev.id}
                              onClick={() => handleEditarEvento(ev)}
                              className={`relative font-bold uppercase italic flex flex-col items-center justify-center border transition-all duration-300 shadow-sm shrink-0 overflow-hidden
                                ${ev.esCumpleanios ? 'cursor-default' : 'cursor-pointer hover:scale-[1.02] active:scale-95 hover:shadow-xl hover:z-10'}
                                ${esMuchosEventos 
                                  ? 'w-[calc(50%-4px)] h-12 rounded-xl p-1' 
                                  : numEventos === 2
                                    ? 'w-full py-2 px-3 min-h-[48px] rounded-xl'
                                    : 'w-full py-4 px-3 min-h-[65px] rounded-2xl'}`}
                              style={{ 
                                backgroundColor: `${ev.color}12`, 
                                borderColor: `${ev.color}30`, 
                                color: ev.color,
                                borderTopWidth: esMuchosEventos ? '2px' : '4px',
                                borderTopColor: ev.color,
                              }}
                            >
                              <span className={`material-symbols-outlined leading-none shrink-0 ${esMuchosEventos ? 'text-[15px]' : 'text-[20px]'}`}>
                                {ev.esCumpleanios ? 'cake' : (configCat?.icono || 'event')}
                              </span>
                              {!esMuchosEventos && (
                                <span className={`tracking-tight font-black leading-tight text-center mt-1.5 break-words line-clamp-2 ${numEventos === 2 ? 'text-[8px]' : 'text-[10px]'}`}>
                                  {ev.titulo}
                                  {ev.esCumpleanios && ev.rolUsuario === 'ALUMNO' && ` (${ev.edadParaMostrar})`}
                                </span>
                              )}
                              {!esMuchosEventos && !ev.esCumpleanios && (
                                <div className="flex items-center gap-1 mt-1 opacity-70">
                                  <span className="text-[7px] font-black bg-white/10 px-1.5 py-0.5 rounded-md">
                                    {format(ev.fecha_inicio, 'HH:mm')}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ModalEvento 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setEventoSeleccionado(null); }}
        onSave={handleSaveEvento}
        eventoParaEditar={eventoSeleccionado}
      />
    </div>
  );
};

export default CalendarioPage;