import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import GestionPlantillas from '../components/GestionPlantillas';

const NotificacionesPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [configuraciones, setConfiguraciones] = useState([]); // Nueva tabla
  const [filtroRol, setFiltroRol] = useState('ALUMNO');
  const [busqueda, setBusqueda] = useState('');
  const [mensajeActual, setMensajeActual] = useState('');
  const [notif, setNotif] = useState(null);
  const [enviados, setEnviados] = useState(new Set());

  const mostrarNotif = (texto, tipo) => {
    setNotif({ texto, tipo });
    setTimeout(() => setNotif(null), 5000);
  };

  useEffect(() => { 
    fetchUsuarios(); 
    fetchConfiguraciones();
  }, [filtroRol]);

  const fetchUsuarios = async () => {
    const { data } = await supabase.from('usuarios').select('*').eq('rol', filtroRol).order('primer_nombre');
    setUsuarios(data || []);
  };

  const fetchConfiguraciones = async () => {
    const { data } = await supabase.from('configuraciones_club').select('*');
    setConfiguraciones(data || []);
  };

  // --- LÓGICA DE ENVÍO MAESTRA ---
  const enviarWA = (u) => {
    // Ahora permite enviar si hay texto manual en mensajeActual aunque no venga de plantilla
    if (!mensajeActual.trim()) return mostrarNotif("Escribe un mensaje o selecciona una plantilla", "error");
    
    const telRaw = u.acudiente_telefono || u.telefono;
    if (!telRaw) return mostrarNotif("Este usuario no tiene teléfono registrado", "error");

    let telLimpio = telRaw.replace(/\D/g, '');
    if (!telLimpio.startsWith('57')) telLimpio = `57${telLimpio}`;
    
    let msgFinal = mensajeActual;

    // 1. REEMPLAZO DATOS USUARIO (EXISTENTE)
    Object.keys(u).forEach((key) => {
      const valor = u[key] !== null && u[key] !== undefined ? String(u[key]) : "";
      const regex = new RegExp(`\\[${key}\\]`, 'g');
      msgFinal = msgFinal.replace(regex, valor);
    });

    // 2. REEMPLAZO DATOS CONFIGURACIÓN (RELACIONADO POR CATEGORÍA)
    const configCategoria = configuraciones.find(c => c.categoria_asociada === u.categoria);
    if (configCategoria) {
      const valorFormateado = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(configCategoria.valor);
      
      msgFinal = msgFinal.replace(/\[valor\]/g, valorFormateado);
      msgFinal = msgFinal.replace(/\[nombre_tarifa\]/g, configCategoria.nombre_tarifa || "");
      msgFinal = msgFinal.replace(/\[descripcion_tarifa\]/g, configCategoria.descripcion || "");
    }

    // 3. REEMPLAZO FECHAS DINÁMICAS
    const fecha = new Date();
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    msgFinal = msgFinal.replace(/\[mes_actual\]/g, meses[fecha.getMonth()]);
    msgFinal = msgFinal.replace(/\[año_actual\]/g, fecha.getFullYear().toString());

    const url = `https://wa.me/${telLimpio}?text=${encodeURIComponent(msgFinal.trim())}`;
    window.open(url, '_blank');

    setEnviados(prev => new Set(prev).add(u.numero_documento || u.id));
  };

  const listaFiltrada = usuarios.filter(u => 
    `${u.primer_nombre} ${u.primer_apellido}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* NOTIFICACIONES TOAST */}
      {notif && (
        <div className={`fixed top-10 right-10 z-[100] p-5 rounded-2xl border backdrop-blur-md shadow-2xl transition-all ${
          notif.tipo === 'success' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'
        }`}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">{notif.texto}</p>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl backdrop-blur-sm">
        <div className="text-center md:text-left">
          <h2 className="text-white font-black text-4xl uppercase italic tracking-tighter leading-none">
            CENTRO DE <span className="text-primary">MENSAJERÍA</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-2 italic">Comunicación inteligente Cezeus</p>
        </div>
        
        <div className="flex gap-3">
          {enviados.size > 0 && (
            <button onClick={() => setEnviados(new Set())} className="px-5 py-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">
              Resetear ({enviados.size})
            </button>
          )}
          <div className={`px-6 py-3 rounded-2xl border transition-all duration-500 flex items-center gap-3 ${
            mensajeActual ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-600'
          }`}>
            <span className="material-symbols-outlined text-sm">{mensajeActual ? 'edit_note' : 'hourglass_empty'}</span>
            <span className="text-[9px] font-black uppercase tracking-widest">{mensajeActual ? 'Mensaje listo' : 'Esperando mensaje'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* PANEL IZQUIERDO: GESTIÓN Y EDITOR LIBRE */}
        <div className="lg:col-span-5 lg:sticky lg:top-10 space-y-6">
          <GestionPlantillas onSelect={setMensajeActual} mostrarNotif={mostrarNotif} />
          
          {/* EDITOR MANUAL / VISTA PREVIA */}
          <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-6 backdrop-blur-md shadow-inner">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-black text-xs uppercase italic tracking-widest">Editor de Mensaje</h3>
              <span className="text-[8px] text-primary font-bold bg-primary/10 px-2 py-1 rounded-lg uppercase">Modo Libre Activo</span>
            </div>
            <textarea 
              value={mensajeActual}
              onChange={(e) => setMensajeActual(e.target.value)}
              placeholder="Escribe aquí un mensaje manual o selecciona una plantilla..."
              className="w-full h-40 bg-black/20 border border-white/5 rounded-2xl p-4 text-white text-[11px] leading-relaxed outline-none focus:ring-1 ring-primary transition-all custom-scrollbar"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-[7px] text-slate-500 font-bold bg-white/5 px-2 py-1 rounded-md">[mes_actual]</span>
              <span className="text-[7px] text-slate-500 font-bold bg-white/5 px-2 py-1 rounded-md">[valor]</span>
              <span className="text-[7px] text-slate-500 font-bold bg-white/5 px-2 py-1 rounded-md">[nombre_tarifa]</span>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: LISTADO */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase ml-1 tracking-widest block mb-2">Filtrar Rol</label>
              <select 
                value={filtroRol} 
                onChange={(e) => setFiltroRol(e.target.value)}
                className="w-full bg-slate-800 border-none rounded-xl p-4 text-white text-[10px] font-bold outline-none focus:ring-1 ring-primary uppercase appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
              >
                <option value="ALUMNO">ALUMNOS</option>
                <option value="ENTRENADOR">ENTRENADORES</option>
                <option value="ADMINISTRATIVO">ADMINISTRATIVOS</option>
                <option value="DIRECTOR">DIRECTORES</option>
              </select>
            </div>
            <div className="flex-[2]">
              <label className="text-[9px] text-slate-500 font-bold uppercase ml-1 tracking-widest block mb-2">Buscador Especializado</label>
              <input 
                placeholder="BUSCAR POR NOMBRE O APELLIDO..." 
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-slate-800 border-none rounded-xl p-4 text-white text-[10px] font-bold outline-none focus:ring-1 ring-primary uppercase transition-all"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {listaFiltrada.map((u, i) => {
              const checkId = u.numero_documento || u.id;
              const isEnviado = enviados.has(checkId);
              const hasConfig = configuraciones.some(c => c.categoria_asociada === u.categoria);
              
              return (
                <div key={i} className={`group flex items-center justify-between p-5 rounded-[2rem] border transition-all duration-500 ${
                  isEnviado ? 'bg-emerald-500/5 border-emerald-500/40 opacity-70' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                }`}>
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-500 ${
                      isEnviado 
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                      : mensajeActual ? 'bg-primary text-black scale-105 shadow-xl shadow-primary/20' : 'bg-slate-800 text-slate-600'
                    }`}>
                      {isEnviado ? <span className="material-symbols-outlined font-black">done_all</span> : `${u.primer_nombre[0]}${u.primer_apellido?.[0]}`}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`font-black uppercase italic text-[12px] transition-colors ${isEnviado ? 'text-emerald-400' : 'text-white'}`}>
                          {u.primer_nombre} {u.primer_apellido}
                        </h4>
                        {isEnviado && <span className="text-[7px] bg-emerald-500 text-black px-2 py-0.5 rounded-full font-black uppercase italic">Enviado</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] italic">{u.categoria || u.rol}</p>
                        {u.rol === 'ALUMNO' && (
                          <span className={`text-[7px] font-black uppercase ${hasConfig ? 'text-emerald-500/50' : 'text-rose-500/50'}`}>
                            {hasConfig ? '• Tarifa OK' : '• Sin Tarifa'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => enviarWA(u)}
                    className={`p-4 rounded-2xl flex items-center justify-center transition-all duration-500 active:scale-90 ${
                      isEnviado
                      ? 'bg-white/5 text-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400'
                      : mensajeActual 
                        ? 'bg-emerald-500 text-black shadow-lg hover:bg-white hover:scale-110' 
                        : 'bg-slate-800 text-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <span className="material-symbols-outlined font-bold text-xl">
                      {isEnviado ? 'history' : (mensajeActual ? 'send' : 'lock')}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificacionesPage;