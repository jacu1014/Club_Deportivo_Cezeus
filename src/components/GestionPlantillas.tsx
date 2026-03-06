import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const GestionPlantillas = ({ onSelect, mostrarNotif }) => {
  const [plantillas, setPlantillas] = useState([]);
  const [idEditando, setIdEditando] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');

  useEffect(() => {
    fetchPlantillas();
  }, []);

  const fetchPlantillas = async () => {
    const { data } = await supabase.from('plantillas_mensajes').select('*').order('created_at', { ascending: false });
    setPlantillas(data || []);
  };

  const guardar = async () => {
    if (!titulo || !cuerpo) return mostrarNotif("Completa los campos obligatorios", "error");
    const payload = { titulo: titulo.toUpperCase(), cuerpo };

    const { error } = idEditando 
      ? await supabase.from('plantillas_mensajes').update(payload).eq('id', idEditando)
      : await supabase.from('plantillas_mensajes').insert([payload]);

    if (!error) {
      mostrarNotif(idEditando ? "Plantilla actualizada" : "Plantilla guardada", "success");
      limpiar();
      fetchPlantillas();
    } else {
      mostrarNotif("Error al procesar solicitud", "error");
    }
  };

  const eliminar = async (id, e) => {
    e.stopPropagation(); // Evita que se seleccione al intentar borrar
    if (!window.confirm("¿Deseas eliminar esta plantilla de la biblioteca?")) return;
    const { error } = await supabase.from('plantillas_mensajes').delete().eq('id', id);
    if (!error) {
      mostrarNotif("Plantilla eliminada", "success");
      fetchPlantillas();
      if (idEditando === id) limpiar();
    }
  };

  const limpiar = () => {
    setIdEditando(null);
    setTitulo('');
    setCuerpo('');
    onSelect(''); // Opcional: limpiar el mensaje preparado al resetear editor
  };

  return (
    <section className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 space-y-6 backdrop-blur-md">
      <div className="flex justify-between items-center">
        <h3 className="text-primary text-[10px] font-black uppercase tracking-widest italic">
          {idEditando ? 'Editando Plantilla' : 'Biblioteca de Mensajes'}
        </h3>
        {idEditando && (
          <button onClick={limpiar} className="text-[9px] text-slate-500 hover:text-white font-bold uppercase tracking-tighter transition-colors">
            + Crear Nueva
          </button>
        )}
      </div>

      <div className="space-y-3">
        <input 
          placeholder="TÍTULO (EJ: RECORDATORIO_PAGO)" 
          value={titulo} onChange={(e) => setTitulo(e.target.value)}
          className="w-full bg-slate-800 border-none rounded-xl p-4 text-white text-[10px] font-bold outline-none focus:ring-1 ring-primary uppercase transition-all"
        />
        <textarea 
          placeholder="Escribe el mensaje aquí... Usa [NOMBRE] para personalizar automáticamente." 
          value={cuerpo} onChange={(e) => setCuerpo(e.target.value)}
          className="w-full h-32 bg-slate-800 border-none rounded-2xl p-4 text-white text-xs outline-none focus:ring-1 ring-primary resize-none transition-all"
        />
        <button onClick={guardar} className="w-full bg-primary py-4 rounded-xl text-black font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all shadow-lg active:scale-95">
          {idEditando ? 'Actualizar Plantilla' : 'Guardar en Biblioteca'}
        </button>
      </div>

      <div className="pt-4 border-t border-white/5 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
        <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mb-2">Mensajes Guardados</p>
        {plantillas.map(p => (
          <div key={p.id} className="flex items-center gap-2">
            <button 
              onClick={() => { setIdEditando(p.id); setTitulo(p.titulo); setCuerpo(p.cuerpo); onSelect(p.cuerpo); }}
              className={`flex-1 text-left p-3 rounded-xl border transition-all ${idEditando === p.id ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
            >
              <p className="text-[9px] font-black uppercase italic truncate">{p.titulo}</p>
            </button>
            <button onClick={(e) => eliminar(p.id, e)} className="p-2 text-slate-700 hover:text-rose-500 transition-colors">
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GestionPlantillas;