import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import VistaCarnet from './VistaCarnet';
import { 
  EPS_COLOMBIA, 
  TIPOS_DOCUMENTO, 
  GRUPOS_RH, 
  FACTORES_RH, 
  PARENTESCOS, 
  obtenerCategoriaPorFecha 
} from '../constants/data';
import { generarReporteCEZEUS } from '../services/reportePDFService';

const GestorCarnetDigital = ({ user, alumnoPreseleccionado }) => {
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [seleccionado, setSeleccionado] = useState(alumnoPreseleccionado);
  const [editando, setEditando] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  
  // Estado para selección múltiple
  const [seleccionadosIds, setSeleccionadosIds] = useState([]);
  
  const fileInputRef = useRef(null);

  const role = user?.rol; 
  const isAdminOrDirector = ['ADMINISTRATIVO', 'DIRECTOR', 'SUPER_ADMIN'].includes(role);
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAlumno = role === 'ALUMNO';

  useEffect(() => {
    fetchAlumnos();
  }, []);

  const fetchAlumnos = async () => {
    // Usando el nombre de tabla: usuarios
    let query = supabase
      .from('usuarios') 
      .select('id, rol, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, email, foto_url, telefono, estado, categoria, fecha_nacimiento, fecha_inscripcion, tipo_documento, numero_documento, genero, direccion, eps, grupo_sanguineo, factor_rh, condiciones_medicas, acudiente_primer_nombre, acudiente_segundo_nombre, acudiente_primer_apellido, acudiente_segundo_apellido, acudiente_parentesco, acudiente_telefono')
      .eq('rol', 'ALUMNO') 
      .order('primer_apellido');

    if (isAlumno) query = query.eq('email', user.email);
    
    const { data } = await query;
    if (data) {
      setAlumnos(data);
      if (isAlumno) setSeleccionado(data[0]);
      
      if (alumnoPreseleccionado) {
         const encontrado = data.find(a => a.id === alumnoPreseleccionado.id);
         if (encontrado) setSeleccionado(encontrado);
      } else if (!isAlumno && data.length > 0 && !seleccionado) {
          setSeleccionado(data[0]);
      }
    }
  };

  // --- LÓGICA DE SELECCIÓN MÚLTIPLE ---
  const toggleSeleccionarTodo = () => {
    if (seleccionadosIds.length === filtrados.length) {
      setSeleccionadosIds([]);
    } else {
      setSeleccionadosIds(filtrados.map(a => a.id));
    }
  };

  const toggleSeleccionIndividual = (id) => {
    setSeleccionadosIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const manejarCambioFecha = (fecha) => {
    const nuevaCategoria = obtenerCategoriaPorFecha(fecha);
    setEditando({ ...editando, fecha_nacimiento: fecha, categoria: nuevaCategoria });
  };

  const manejarFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editando) return;
    try {
      setSubiendoFoto(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `perfiles/${editando.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('Fotos_Alumnos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('Fotos_Alumnos')
        .getPublicUrl(filePath);

      setEditando({ ...editando, foto_url: publicUrl });
    } catch (error) {
      alert('Error al subir la foto');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    if (!editando?.id) return;

    // Desestructuración para no enviar campos protegidos o autogenerados
    const { 
        id, 
        created_at, 
        updated_at, 
        email, 
        rol, 
        password, 
        ...datosAActualizar 
    } = editando;

    const { error } = await supabase
      .from('usuarios')
      .update(datosAActualizar) 
      .eq('id', id);

    if (!error) {
      setAlumnos(alumnos.map(a => a.id === id ? editando : a));
      setSeleccionado(editando);
      setEditando(null);
      alert("Expediente actualizado con éxito");
    } else {
      console.error("Error al actualizar:", error.message);
      alert(`Error de servidor: ${error.message}`);
    }
  };

  const eliminarAlumno = async (id, nombre) => {
    if (!id) return;
    if (!window.confirm(`¿Seguro que deseas eliminar permanentemente a ${nombre}?`)) return;
    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', id);
      if (error) throw error;
      setAlumnos(alumnos.filter(a => a.id !== id));
      setSeleccionadosIds(prev => prev.filter(item => item !== id));
      if (seleccionado?.id === id) setSeleccionado(null);
      alert("Registro eliminado.");
    } catch (error) { alert(error.message); }
  };

  const resetearPassword = async (email) => {
    if (!window.confirm(`¿Enviar correo de restablecimiento a ${email}?`)) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (!error) alert("Correo enviado.");
    else alert("Error al enviar.");
  };

  const filtrados = alumnos.filter(a => {
    const nombreCompleto = `${a.primer_apellido} ${a.segundo_apellido} ${a.primer_nombre} ${a.segundo_nombre}`.toLowerCase();
    const cumpleBusqueda = nombreCompleto.includes(busqueda.toLowerCase()) || (a.numero_documento || '').includes(busqueda);
    const cumpleCategoria = filtroCategoria === 'TODOS' || (a.categoria || '').toUpperCase().includes(filtroCategoria.toUpperCase());
    const cumpleEstado = filtroEstado === '' || (a.estado || '').toUpperCase() === filtroEstado.toUpperCase();
    return cumpleBusqueda && cumpleCategoria && cumpleEstado;
  });

  const getCount = (cat) => cat === 'TODOS' ? alumnos.length : alumnos.filter(a => (a.categoria || '').toUpperCase().includes(cat.toUpperCase())).length;
  const getCountStatus = (status) => alumnos.filter(a => (a.estado || '').toUpperCase() === status.toUpperCase()).length;

  const descargarReporteAlumnos = () => {
    const dataAReportar = seleccionadosIds.length > 0 
      ? alumnos.filter(a => seleccionadosIds.includes(a.id))
      : filtrados;

    const tituloReporte = seleccionadosIds.length > 0 
      ? `REPORTE SELECCIÓN PERSONALIZADA (${seleccionadosIds.length} ALUMNOS)`
      : `REPORTE INTEGRAL DE ALUMNOS (${filtroCategoria} / ${filtroEstado || 'TODOS'})`;

    const columnasConfig = [
      { header: 'DOCUMENTO', dataKey: 'doc' },
      { header: 'ALUMNO', dataKey: 'nombre_alumno' },
      { header: 'CATEGORÍA', dataKey: 'categoria' },
      { header: 'RH', dataKey: 'rh' },
      { header: 'EPS', dataKey: 'eps' },
      { header: 'ACUDIENTE', dataKey: 'acudiente' },
      { header: 'CONTACTOS', dataKey: 'contactos' },
      { header: 'ESTADO', dataKey: 'estado' }
    ];

    const datosMapeados = dataAReportar.map(a => ({
      doc: `${a.tipo_documento || ''} ${a.numero_documento || ''}`.trim(),
      nombre_alumno: `${a.primer_apellido || ''} ${a.segundo_apellido || ''} ${a.primer_nombre || ''} ${a.segundo_nombre || ''}`.replace(/\s+/g, ' ').trim().toUpperCase(),
      categoria: a.categoria || 'N/A',
      rh: `${a.grupo_sanguineo || ''}${a.factor_rh || ''}` || 'N/A',
      eps: a.eps || 'N/A',
      acudiente: `${a.acudiente_primer_nombre || ''} ${a.acudiente_primer_apellido || ''} (${a.acudiente_parentesco || 'S/P'})`.replace(/\s+/g, ' ').trim().toUpperCase(),
      contactos: `${a.telefono || ''}${a.acudiente_telefono ? ' / ' + a.acudiente_telefono : ''}` || 'SIN TEL',
      estado: (a.estado || 'ACTIVO').toUpperCase()
    }));

    generarReporteCEZEUS(tituloReporte, datosMapeados, columnasConfig);
  };

  return (
    <div className="space-y-8 px-4">
      {!isAlumno && (
        <div className="space-y-6">
          {/* Barra de Búsqueda */}
          <div className="flex gap-4">
            <div className="flex-1 bg-[#0a0f18]/60 border border-white/10 rounded-2xl flex items-center px-6 py-4 backdrop-blur-xl shadow-inner">
              <input 
                type="text" 
                placeholder="BUSCAR POR NOMBRE O CC..." 
                className="bg-transparent w-full text-[11px] font-black text-white outline-none tracking-widest" 
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)} 
              />
            </div>
          </div>

          {/* Filtros y Exportación */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {['TODOS', 'INICIACIÓN', 'INFANTIL', 'TRANSICIÓN'].map(cat => (
                <button key={cat} onClick={() => setFiltroCategoria(cat)} className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all ${filtroCategoria === cat ? 'bg-primary border-primary text-black' : 'bg-[#0a0f18]/40 border-white/10 text-slate-400'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest">{cat}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/10">{getCount(cat)}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 border-t border-white/5 pt-4 items-center justify-between">
              <div className="flex gap-3">
                <button onClick={() => setFiltroEstado(filtroEstado === 'ACTIVO' ? '' : 'ACTIVO')} className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all ${filtroEstado === 'ACTIVO' ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'}`}>
                  <span className="text-[10px] font-black tracking-widest uppercase">ACTIVOS</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/10">{getCountStatus('ACTIVO')}</span>
                </button>
                <button onClick={() => setFiltroEstado(filtroEstado === 'INACTIVO' ? '' : 'INACTIVO')} className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all ${filtroEstado === 'INACTIVO' ? 'bg-rose-500 border-rose-500 text-black' : 'bg-rose-500/5 border-rose-500/20 text-rose-500 hover:bg-rose-500/10'}`}>
                  <span className="text-[10px] font-black tracking-widest uppercase">INACTIVOS</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/10">{getCountStatus('INACTIVO')}</span>
                </button>
              </div>

              <button 
                onClick={descargarReporteAlumnos}
                className={`flex items-center gap-3 px-6 py-2.5 rounded-xl transition-all group ${seleccionadosIds.length > 0 ? 'bg-primary text-black animate-pulse' : 'bg-[#0a0f18]/40 border border-white/10 text-primary hover:bg-primary hover:text-black'}`}
              >
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                <span className="text-[10px] font-black tracking-[0.2em] uppercase">
                    {seleccionadosIds.length > 0 ? `EXPORTAR SELECCIÓN (${seleccionadosIds.length})` : `EXPORTAR PDF (${filtrados.length})`}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="bg-[#0a0f18]/60 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
                <table className="w-full text-[10px]">
                  <thead className="text-primary font-black uppercase border-b border-white/5 bg-white/5">
                    <tr>
                      <th className="p-4 text-center w-10">
                        <input 
                          type="checkbox" 
                          className="accent-primary w-4 h-4 cursor-pointer"
                          checked={seleccionadosIds.length === filtrados.length && filtrados.length > 0}
                          onChange={toggleSeleccionarTodo}
                        />
                      </th>
                      <th className="p-4 text-left">Alumno</th>
                      <th className="p-4 text-left">Categoría / EPS</th>
                      <th className="p-4 text-center">Estado</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtrados.map(alumno => (
                      <tr 
                        key={alumno.id} 
                        onClick={() => setSeleccionado(alumno)} 
                        className={`hover:bg-white/5 transition-colors cursor-pointer ${seleccionado?.id === alumno.id ? 'bg-primary/5' : ''} ${seleccionadosIds.includes(alumno.id) ? 'bg-primary/10' : ''}`}
                      >
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            className="accent-primary w-4 h-4 cursor-pointer"
                            checked={seleccionadosIds.includes(alumno.id)}
                            onChange={() => toggleSeleccionIndividual(alumno.id)}
                          />
                        </td>
                        <td className="p-4 uppercase">
                          <p className="font-bold text-white text-[11px]">{alumno.primer_apellido} {alumno.segundo_apellido}</p>
                          <p className="text-slate-500">{alumno.primer_nombre} {alumno.segundo_nombre}</p>
                        </td>
                        <td className="p-4 uppercase">
                          <p className="text-white font-bold">{alumno.categoria || 'S/C'}</p>
                          <p className="text-slate-500">EPS: {alumno.eps || 'N/A'}</p>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-lg font-black text-[8px] uppercase ${alumno.estado?.toUpperCase() === 'ACTIVO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                            {alumno.estado || 'ACTIVO'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setSeleccionado(alumno)} className="p-1.5 hover:text-primary transition-colors"><span className="material-symbols-outlined text-sm">visibility</span></button>
                            {isAdminOrDirector && (
                              <>
                                <button onClick={() => setEditando(alumno)} className="p-1.5 hover:text-amber-500 transition-colors"><span className="material-symbols-outlined text-sm">edit</span></button>
                                <button onClick={() => eliminarAlumno(alumno.id, alumno.primer_nombre)} className="p-1.5 hover:text-rose-500 transition-colors"><span className="material-symbols-outlined text-sm">delete</span></button>
                              </>
                            )}
                            {isSuperAdmin && (
                              <button onClick={() => resetearPassword(alumno.email)} className="p-1.5 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-sm">lock_reset</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="lg:col-span-4 flex justify-center">
              <div className="sticky top-8"><VistaCarnet alumno={seleccionado} /></div>
            </div>
          </div>
        </div>
      )}

      {isAlumno && seleccionado && (
          <div className="flex justify-center p-10">
              <VistaCarnet alumno={seleccionado} />
          </div>
      )}

      {/* MODAL DE EDICIÓN */}
      {editando && (
        <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={guardarCambios} className="bg-[#0a0f18] border border-white/10 p-6 md:p-8 rounded-[2.5rem] w-full max-w-5xl max-h-[92vh] overflow-y-auto space-y-8 custom-scrollbar shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-primary font-black uppercase tracking-[0.2em] text-lg italic flex items-center gap-3">
                <span className="material-symbols-outlined">edit_square</span> Expediente del Deportista
              </h3>
              <button type="button" onClick={() => setEditando(null)} className="text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="space-y-6">
              <h4 className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">person</span> Datos del Alumno
              </h4>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-3">
                  <div onClick={() => fileInputRef.current?.click()} className="w-36 h-44 bg-[#020617] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 overflow-hidden relative group">
                    {editando.foto_url ? <img src={editando.foto_url} className="w-full h-full object-cover group-hover:opacity-40" alt="Perfil" /> : <span className="material-symbols-outlined text-4xl text-slate-700">add_a_photo</span>}
                    {subiendoFoto && <div className="absolute inset-0 bg-black/60 flex items-center justify-center animate-pulse text-primary font-bold text-[8px]">SUBIENDO...</div>}
                  </div>
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={manejarFoto} />
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white uppercase outline-none focus:border-primary/30" placeholder="Primer Nombre" value={editando.primer_nombre || ''} onChange={e => setEditando({...editando, primer_nombre: e.target.value.toUpperCase()})} />
                  <input className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white uppercase outline-none focus:border-primary/30" placeholder="Segundo Nombre" value={editando.segundo_nombre || ''} onChange={e => setEditando({...editando, segundo_nombre: e.target.value.toUpperCase()})} />
                  <input className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white uppercase outline-none focus:border-primary/30" placeholder="Primer Apellido" value={editando.primer_apellido || ''} onChange={e => setEditando({...editando, primer_apellido: e.target.value.toUpperCase()})} />
                  <input className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white uppercase outline-none focus:border-primary/30" placeholder="Segundo Apellido" value={editando.segundo_apellido || ''} onChange={e => setEditando({...editando, segundo_apellido: e.target.value.toUpperCase()})} />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <select className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white outline-none" value={editando.tipo_documento || ''} onChange={e => setEditando({...editando, tipo_documento: e.target.value})}>
                      <option value="">Tipo Documento</option>
                      {TIPOS_DOCUMENTO.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                    </select>
                    <input className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white outline-none" placeholder="No. Documento" value={editando.numero_documento || ''} onChange={e => setEditando({...editando, numero_documento: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-slate-500 font-black uppercase ml-2 italic">Fecha Nacimiento</label>
                      <input type="date" className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white outline-none [color-scheme:dark]" value={editando.fecha_nacimiento || ''} onChange={e => manejarCambioFecha(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-primary font-black uppercase ml-2 italic">Categoría</label>
                      <div className="bg-[#020617] border border-primary/20 p-4 rounded-2xl text-xs text-primary font-bold">{editando.categoria || 'S/C'}</div>
                    </div>
                  </div>

                  <select className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white outline-none" value={editando.genero || ''} onChange={e => setEditando({...editando, genero: e.target.value})}>
                    <option value="">Género</option>
                    <option value="MASCULINO">MASCULINO</option>
                    <option value="FEMENINO">FEMENINO</option>
                    <option value="OTRO">OTRO</option>
                  </select>
                  <input className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white outline-none" placeholder="Teléfono" value={editando.telefono || ''} onChange={e => setEditando({...editando, telefono: e.target.value})} />
                  
                  <input className="md:col-span-2 bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white uppercase outline-none focus:border-primary/30" placeholder="Dirección de Residencia" value={editando.direccion || ''} onChange={e => setEditando({...editando, direccion: e.target.value.toUpperCase()})} />
                  <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-500 font-black uppercase ml-2 italic">Fecha Inscripción</label>
                  <input type="date" className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white outline-none [color-scheme:dark]" value={editando.fecha_inscripcion || ''} onChange={e => setEditando({...editando, fecha_inscripcion: e.target.value})} />
                </div>
                
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-white/5">
              <h4 className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">groups</span> Datos del Acudiente
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white uppercase outline-none" placeholder="1er Nombre Acudiente" value={editando.acudiente_primer_nombre || ''} onChange={e => setEditando({...editando, acudiente_primer_nombre: e.target.value.toUpperCase()})} />
                <input className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white uppercase outline-none" placeholder="2do Nombre Acudiente" value={editando.acudiente_segundo_nombre || ''} onChange={e => setEditando({...editando, acudiente_segundo_nombre: e.target.value.toUpperCase()})} />
                <input className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white uppercase outline-none" placeholder="1er Apellido Acudiente" value={editando.acudiente_primer_apellido || ''} onChange={e => setEditando({...editando, acudiente_primer_apellido: e.target.value.toUpperCase()})} />
                <input className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white uppercase outline-none" placeholder="2do Apellido Acudiente" value={editando.acudiente_segundo_apellido || ''} onChange={e => setEditando({...editando, acudiente_segundo_apellido: e.target.value.toUpperCase()})} />
                
                <select className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white outline-none" value={editando.acudiente_parentesco || ''} onChange={e => setEditando({...editando, acudiente_parentesco: e.target.value})}>
                  <option value="">Parentesco</option>
                  {PARENTESCOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white outline-none" placeholder="Teléfono Acudiente" value={editando.acudiente_telefono || ''} onChange={e => setEditando({...editando, acudiente_telefono: e.target.value})} />
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-white/5">
              <h4 className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">medical_services</span> Ficha de Salud y Gestión
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <select className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white outline-none" value={editando.eps || ''} onChange={e => setEditando({...editando, eps: e.target.value})}>
                  <option value="">EPS</option>
                  {EPS_COLOMBIA.map(eps => <option key={eps} value={eps}>{eps}</option>)}
                </select>
                <select className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white outline-none" value={editando.grupo_sanguineo || ''} onChange={e => setEditando({...editando, grupo_sanguineo: e.target.value})}>
                  <option value="">Grupo</option>
                  {GRUPOS_RH.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white outline-none" value={editando.factor_rh || ''} onChange={e => setEditando({...editando, factor_rh: e.target.value})}>
                  <option value="">RH</option>
                  {FACTORES_RH.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select className="bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-amber-500 font-bold outline-none" value={editando.estado || 'ACTIVO'} onChange={e => setEditando({...editando, estado: e.target.value})}>
                  <option value="ACTIVO">ESTADO: ACTIVO</option>
                  <option value="INACTIVO">ESTADO: INACTIVO</option>
                </select>
              </div>
              <textarea 
                className="w-full bg-[#020617] border border-white/5 p-4 rounded-2xl text-xs text-white uppercase outline-none min-h-[100px] focus:border-primary/30" 
                placeholder="Condiciones médicas, alergias u observaciones..." 
                value={editando.condiciones_medicas || ''} 
                onChange={e => setEditando({...editando, condiciones_medicas: e.target.value.toUpperCase()})} 
              />
            </div>

            <div className="flex gap-4 pt-6">
              <button type="button" onClick={() => setEditando(null)} className="flex-1 bg-white/5 text-slate-500 font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancelar</button>
              <button type="submit" className="flex-[2] bg-primary text-black font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-[0.3em] shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all">Actualizar Expediente</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default GestorCarnetDigital;