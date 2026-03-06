import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import GestionPlantillas from '../components/GestionPlantillas';

const NotificacionesPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filtroRol, setFiltroRol] = useState('ALUMNO');
  const [busqueda, setBusqueda] = useState('');
  const [mensajeActual, setMensajeActual] = useState('');
  const [notif, setNotif] = useState(null);
  
  // Estado para el marcado de enviados
  const [enviados, setEnviados] = useState(new Set());

  const mostrarNotif = (texto, tipo) => {
    setNotif({ texto, tipo });
    setTimeout(() => setNotif(null), 5000);
  };

  useEffect(() => { fetchUsuarios(); }, [filtroRol]);

  const fetchUsuarios = async () => {
    const { data } = await supabase.from('usuarios').select('*').eq('rol', filtroRol).order('primer_nombre');
    setUsuarios(data || []);
  };

  // --- LÓGICA DE REEMPLAZO DINÁMICO ---
  const enviarWA = (u) => {
    if (!mensajeActual) return mostrarNotif("Selecciona un mensaje de la biblioteca", "error");
    
    // Priorizamos el teléfono del acudiente, si no, el del alumno
    const tel = u.acudiente_telefono || u.telefono;
    if (!tel) return mostrarNotif("Este usuario no tiene teléfono registrado", "error");
    
    let msgFinal = mensajeActual;

    /**
     * Recorremos todas las llaves del objeto usuario (u).
     * Si el mensaje contiene [nombre_columna], lo reemplaza por el valor real.
     */
    Object.keys(u).forEach((key) => {
      const valor = u[key] !== null && u[key] !== undefined ? String(u[key]) : "";
      // Usamos una RegExp global para reemplazar todas las ocurrencias de la etiqueta
      const regex = new RegExp(`\\[${key}\\]`, 'g');
      msgFinal = msgFinal.replace(regex, valor);
    });

    // Abrir WhatsApp con el mensaje procesado
    const url = `https://wa.me/${tel.replace(/\D/g, '')}?text=${encodeURIComponent(msgFinal)}`;
    window.open(url, '_blank');

    // Marcamos visualmente como enviado usando el documento o ID
    setEnviados(prev => new Set(prev).add(u.numero_documento || u.id));
  };

  const limpiarMarcas = () => {
    if (window.confirm("¿Deseas resetear el progreso de envío de esta lista?")) {
      setEnviados(new Set());
    }
  };

  const listaFiltrada = usuarios.filter(u => 
    `${u.primer_nombre} ${u.primer_apellido}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* TOAST NOTIFICATIONS */}
      {notif && (
        <div className={`fixed top-10 right-10 z-[100] p-5 rounded-2xl border backdrop-blur-md shadow-2xl transition-all ${
          notif.tipo === 'success' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'
        }`}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">{notif.texto}</p>
        </div>
      )}

      {/* HEADER DINÁMICO */}
      <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-white font-black text-4xl uppercase italic tracking-tighter leading-none">
            CENTRO DE <span className="text-primary">MENSAJERÍA</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-2 italic">Comunicación masiva e inteligente</p>
        </div>
        
        <div className="flex gap-3">
          {enviados.size > 0 && (
            <button onClick={limpiarMarcas} className="px-5 py-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">
              Limpiar Progreso ({enviados.size})
            </button>
          )}
          <div className={`px-6 py-3 rounded-2xl border transition-all duration-500 flex items-center gap-3 ${
            mensajeActual ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-600'
          }`}>
            <span className="material-symbols-outlined text-sm">{mensajeActual ? 'verified' : 'hourglass_empty'}</span>
            <span className="text-[9px] font-black uppercase tracking-widest">{mensajeActual ? 'Listo para enviar' : 'Carga un mensaje'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* PANEL DE GESTIÓN (IZQUIERDA) */}
        <div className="lg:col-span-5 lg:sticky lg:top-10">
          <GestionPlantillas onSelect={setMensajeActual} mostrarNotif={mostrarNotif} />
        </div>

        {/* PANEL DE LISTADO (DERECHA) */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase ml-1 tracking-widest block mb-2">Filtrar Rol</label>
              <select 
                value={filtroRol} 
                onChange={(e) => setFiltroRol(e.target.value)}
                className="w-full bg-slate-800 border-none rounded-xl p-4 text-white text-[10px] font-bold outline-none focus:ring-1 ring-primary uppercase appearance-none"
              >
                <option value="ALUMNO">ALUMNOS</option>
                <option value="ENTRENADOR">ENTRENADORES</option>
                <option value="ADMINISTRATIVO">ADMINISTRATIVOS</option>
              </select>
            </div>
            <div className="flex-[2]">
              <label className="text-[9px] text-slate-500 font-bold uppercase ml-1 tracking-widest block mb-2">Buscador</label>
              <input 
                placeholder="ESCRIBE UN NOMBRE..." 
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-slate-800 border-none rounded-xl p-4 text-white text-[10px] font-bold outline-none focus:ring-1 ring-primary uppercase"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {listaFiltrada.map((u, i) => {
              const checkId = u.numero_documento || u.id;
              const isEnviado = enviados.has(checkId);
              
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
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 italic">{u.categoria || u.rol}</p>
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