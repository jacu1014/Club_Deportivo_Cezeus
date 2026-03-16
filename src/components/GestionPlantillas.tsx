import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const GestionPlantillas = ({ onSelect, mostrarNotif }) => {
  const [plantillas, setPlantillas] = useState([]);
  const [idEditando, setIdEditando] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const textareaRef = useRef(null);

  // Mapeo unificado: Mantiene TODO lo anterior + Nuevos campos
  const GRUPOS_CAMPOS = {
    "Datos Alumno": [
      { label: '1er Nombre', tag: '[primer_nombre]' },
      { label: '2do Nombre', tag: '[segundo_nombre]' },
      { label: '1er Apellido', tag: '[primer_apellido]' },
      { label: '2do Apellido', tag: '[segundo_apellido]' },
      { label: 'Género', tag: '[genero]' },
      { label: 'F. Nacimiento', tag: '[fecha_nacimiento]' },
      { label: 'Email', tag: '[email]' },
      { label: 'Teléfono', tag: '[telefono]' },
    ],
    "Acudiente": [
      { label: 'Nombre 1', tag: '[acudiente_primer_nombre]' },
      { label: 'Nombre 2', tag: '[acudiente_segundo_nombre]' },
      { label: 'Apellido 1', tag: '[acudiente_primer_apellido]' },
      { label: 'Apellido 2', tag: '[acudiente_segundo_apellido]' },
      { label: 'Parentesco', tag: '[acudiente_parentesco]' },
      { label: 'Tel. Acudiente', tag: '[acudiente_telefono]' },
    ],
    "Cobros y Tarifas": [
      { label: 'Valor Tarifa', tag: '[valor]', variant: 'emerald' },
      { label: 'Nombre Tarifa', tag: '[nombre_tarifa]', variant: 'emerald' },
      { label: 'Descripción', tag: '[descripcion_tarifa]', variant: 'emerald' },
      { label: 'Mes Actual', tag: '[mes_actual]', variant: 'amber' },
      { label: 'Año Actual', tag: '[año_actual]', variant: 'amber' },
    ],
    "Club / Registro": [
      { label: 'Categoría', tag: '[categoria]' },
      { label: 'Rol', tag: '[rol]' },
      { label: 'Estado', tag: '[estado]' },
      { label: 'F. Inscripción', tag: '[fecha_inscripcion]' },
      { label: 'Tipo Doc', tag: '[tipo_documento]' },
      { label: 'Num Doc', tag: '[numero_documento]' },
    ],
    "Salud / Otros": [
      { label: 'EPS', tag: '[eps]' },
      { label: 'G. Sanguíneo', tag: '[grupo_sanguineo]' },
      { label: 'Factor RH', tag: '[factor_rh]' },
      { label: 'Cond. Médicas', tag: '[condiciones_medicas]' },
      { label: 'Dirección', tag: '[direccion]' },
    ]
  };

  useEffect(() => { fetchPlantillas(); }, []);

  const fetchPlantillas = async () => {
    const { data } = await supabase.from('plantillas_mensajes').select('id, titulo, cuerpo, categoria, creado_por, created_at').order('created_at', { ascending: false });
    setPlantillas(data || []);
  };

  const insertarEtiqueta = (tag) => {
    const cursor = textareaRef.current.selectionStart;
    const nuevoTexto = cuerpo.substring(0, cursor) + tag + cuerpo.substring(cursor);
    setCuerpo(nuevoTexto);
    
    setTimeout(() => {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(cursor + tag.length, cursor + tag.length);
    }, 10);
  };

  const guardar = async () => {
    if (!titulo || !cuerpo) return mostrarNotif("Completa los campos", "error");
    const payload = { titulo: titulo.toUpperCase(), cuerpo };
    const { error } = idEditando 
      ? await supabase.from('plantillas_mensajes').update(payload).eq('id', idEditando)
      : await supabase.from('plantillas_mensajes').insert([payload]);

    if (!error) {
      mostrarNotif("Guardado con éxito", "success");
      setIdEditando(null); setTitulo(''); setCuerpo('');
      fetchPlantillas();
    }
  };

  const eliminar = async (id, e) => {
    e.stopPropagation();
    if(!window.confirm("¿Eliminar esta plantilla?")) return;
    const { error } = await supabase.from('plantillas_mensajes').delete().eq('id', id);
    if(!error) {
        mostrarNotif("Eliminado", "success");
        fetchPlantillas();
        if(idEditando === id) { setIdEditando(null); setTitulo(''); setCuerpo(''); }
    }
  }

  // Función para determinar el estilo del botón según la variante
  const getBtnStyle = (variant) => {
    if (variant === 'emerald') return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black";
    if (variant === 'amber') return "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black";
    return "bg-primary/5 border-primary/10 text-primary hover:bg-primary hover:text-black";
  };

  return (
    <section className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 space-y-6 backdrop-blur-md">
      <div className="flex justify-between items-center">
        <h3 className="text-primary text-[10px] font-black uppercase tracking-widest italic">
            {idEditando ? 'Editando Mensaje' : 'Editor de Plantillas'}
        </h3>
        {idEditando && (
            <button onClick={() => {setIdEditando(null); setTitulo(''); setCuerpo('');}} className="text-[8px] text-slate-500 hover:text-white uppercase font-bold tracking-tighter">
                + Crear Nuevo
            </button>
        )}
      </div>

      <div className="space-y-4">
        <input 
          placeholder="TÍTULO (EJ: AVISO_MEDICO)" 
          value={titulo} onChange={(e) => setTitulo(e.target.value)}
          className="w-full bg-slate-800 border-none rounded-xl p-4 text-white text-[10px] font-bold outline-none focus:ring-1 ring-primary uppercase"
        />

        {/* SELECTOR DE ETIQUETAS DINÁMICO POR GRUPOS */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar border border-white/5 p-4 rounded-2xl bg-black/20">
          {Object.entries(GRUPOS_CAMPOS).map(([grupo, campos]) => (
            <div key={grupo} className="space-y-2">
              <p className="text-[7px] text-slate-500 font-black uppercase tracking-[0.2em]">{grupo}</p>
              <div className="flex flex-wrap gap-1.5">
                {campos.map((campo) => (
                  <button
                    key={campo.tag}
                    onClick={() => insertarEtiqueta(campo.tag)}
                    className={`px-2 py-1.5 border rounded-lg text-[7px] font-bold uppercase transition-all ${getBtnStyle(campo.variant)}`}
                  >
                    + {campo.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <textarea 
          ref={textareaRef}
          placeholder="Escribe el mensaje... Haz clic en las etiquetas para personalizar." 
          value={cuerpo} onChange={(e) => setCuerpo(e.target.value)}
          className="w-full h-40 bg-slate-800 border-none rounded-2xl p-4 text-white text-xs outline-none focus:ring-1 ring-primary resize-none leading-relaxed"
        />

        <button onClick={guardar} className="w-full bg-primary py-4 rounded-xl text-black font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all shadow-lg active:scale-95">
          {idEditando ? 'Actualizar Biblioteca' : 'Guardar en Biblioteca'}
        </button>
      </div>

      <div className="pt-4 border-t border-white/5 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
        {plantillas.map(p => (
          <div key={p.id} className="flex gap-2 group">
              <button 
                onClick={() => { setIdEditando(p.id); setTitulo(p.titulo); setCuerpo(p.cuerpo); onSelect(p.cuerpo); }}
                className={`flex-1 text-left p-3 rounded-xl text-[9px] font-black uppercase italic truncate border transition-all ${idEditando === p.id ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
              >
                {p.titulo}
              </button>
              <button onClick={(e) => eliminar(p.id, e)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors">
                  <span className="material-symbols-outlined text-sm">delete</span>
              </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GestionPlantillas;