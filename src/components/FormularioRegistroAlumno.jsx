import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { adminAction } from '../lib/supabaseAdmin';
import { registrarLog } from '../lib/activity';
import { 
  EPS_COLOMBIA, 
  TIPOS_DOCUMENTO, 
  GRUPOS_RH, 
  FACTORES_RH, 
  PARENTESCOS,
  obtenerCategoriaPorFecha 
} from '../constants/data';

const FormularioRegistroAlumno = () => {
  const [fotoPreview, setFotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');  
  
  const [parentesco, setParentesco] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  // NUEVO: Estado para visibilidad de contraseña
  const [showPassword, setShowPassword] = useState(false);
  
  const [fechaInscripcion, setFechaInscripcion] = useState(new Date().toISOString().split('T')[0]);
  const [categoriaAuto, setCategoriaAuto] = useState('Esperando fecha...');
  const [contacto1, setContacto1] = useState(''); 
  const [contacto2, setContacto2] = useState(''); 

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 5000);
  };

  const handleFechaChange = (e) => {
    const fecha = e.target.value;
    setFechaNacimiento(fecha);
    if (fecha) {
        try {
            setCategoriaAuto(obtenerCategoriaPorFecha(fecha));
        } catch (err) {
            setCategoriaAuto("Error en fecha");
        }
    }
  };

  const handlePhoneChange = (e, setter) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setter(value);
  };

  const registrarAlumno = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setStatusText('Validando disponibilidad...');
    
    let userIdParaRollback = null;
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const numDoc = formData.get('numero_documento')?.trim();
    const emailNormalizado = formData.get('email')?.toLowerCase().trim();

    try {
      const checkRes = await supabase
        .from('usuarios')
        .select('id')
        .or(`numero_documento.eq.${numDoc},email.eq.${emailNormalizado}`)
        .maybeSingle();

      // Crear usuario auth via Edge Function (reemplaza supabaseAdmin)
      const authRes = await adminAction('crear-usuario', {
        email: emailNormalizado,
        password: formData.get('password'),
        user_metadata: { role: 'ALUMNO' }
      });

      if (checkRes.data) throw new Error("El documento o correo ya están registrados.");
      if (authRes.error) throw authRes.error;

      userIdParaRollback = authRes.data.user?.id;
      setStatusText('Procesando fotografía...');

      let publicUrlFinal = null;
      const fotoArchivo = fileInputRef.current?.files?.[0];
      
     if (fotoArchivo && userIdParaRollback) {
        const filePath = `${userIdParaRollback}/${Date.now()}_foto`;
        const { error: upError } = await supabase.storage.from('Fotos_Alumnos').upload(filePath, fotoArchivo);
        
        if (!upError) {
          publicUrlFinal = supabase.storage.from('Fotos_Alumnos').getPublicUrl(filePath).data.publicUrl;
        }
      }

      setStatusText('Sincronizando base de datos...');

      const datosAInsertar = {
        id: userIdParaRollback,
        rol: 'ALUMNO',
        estado: 'Activo',
        email: emailNormalizado,
        primer_nombre: formData.get('primer_nombre')?.trim().toUpperCase(),
        segundo_nombre: formData.get('segundo_nombre')?.trim().toUpperCase() || null,
        primer_apellido: formData.get('primer_apellido')?.trim().toUpperCase(),
        segundo_apellido: formData.get('segundo_apellido')?.trim().toUpperCase() || null,
        tipo_documento: formData.get('tipo_documento'),
        numero_documento: numDoc,
        fecha_nacimiento: fechaNacimiento,
        fecha_inscripcion: fechaInscripcion, 
        telefono: contacto1,
        foto_url: publicUrlFinal,
        direccion: formData.get('direccion')?.trim().toUpperCase(),
        genero: formData.get('genero'),
        eps: formData.get('eps'),
        grupo_sanguineo: formData.get('grupo_sanguineo'),
        factor_rh: formData.get('factor_rh'),
        condiciones_medicas: formData.get('condiciones_medicas')?.trim() || 'NINGUNA',
        categoria: categoriaAuto,
        acudiente_primer_nombre: formData.get('acudiente_primer_nombre')?.trim().toUpperCase(),
        acudiente_segundo_nombre: formData.get('acudiente_segundo_nombre')?.trim().toUpperCase() || null,
        acudiente_primer_apellido: formData.get('acudiente_primer_apellido')?.trim().toUpperCase(),
        acudiente_segundo_apellido: formData.get('acudiente_segundo_apellido')?.trim().toUpperCase() || null,
        acudiente_parentesco: parentesco,
        acudiente_telefono: contacto2
      };

      const { error: dbError } = await supabase
  .from('usuarios')
  .upsert(datosAInsertar, { onConflict: 'id' });
if (dbError) throw dbError;

// Corregido: llamada con objeto de parámetros (antes estaba mal)
await registrarLog({
  accion: 'REGISTRO_ALUMNO',
  modulo: 'MATRICULAS',
  descripcion: `Nuevo atleta matriculado: ${datosAInsertar.primer_nombre} ${datosAInsertar.primer_apellido}`,
  detalles: { categoria: datosAInsertar.categoria, documento: datosAInsertar.numero_documento }
});

mostrarMensaje("✨ ¡Matrícula deportiva completada!", "success");

form.reset();
setFotoPreview(null);
setContacto1(''); setContacto2('');
setParentesco(''); setFechaNacimiento('');
setFechaInscripcion(new Date().toISOString().split('T')[0]);
setCategoriaAuto('Esperando fecha...');
} catch (err) {
  console.error("Error en registro:", err);
  if (userIdParaRollback) {
    // Rollback: eliminar usuario auth si falló algo después
    await adminAction('eliminar-usuario', { userId: userIdParaRollback });
  }
  mostrarMensaje(err.message || "Error al procesar registro", "error");
} finally {
  setLoading(false);
  setStatusText('');
}

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-10 pb-20">
      {mensaje && (
        <div className={`fixed top-10 right-10 z-50 p-5 rounded-2xl border backdrop-blur-md shadow-2xl transition-all ${
          mensaje.tipo === 'success' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'
        }`}>
          <p className="text-xs font-bold uppercase tracking-widest">{mensaje.texto}</p>
        </div>
      )}

      <form onSubmit={registrarAlumno} className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-4 space-y-6">
            <section className="bg-slate-900/40 border border-white/10 rounded-[2rem] p-6 text-center">
                <div onClick={() => fileInputRef.current?.click()} className="w-40 h-48 mx-auto bg-slate-800 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden group hover:border-primary/50 transition-all">
                    {fotoPreview ? <img src={fotoPreview} className="w-full h-full object-cover" alt="preview" /> : <span className="material-symbols-outlined text-4xl text-slate-600">add_a_photo</span>}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setFotoPreview(URL.createObjectURL(file));
                }} />
                <p className="text-[9px] text-slate-500 mt-3 uppercase font-bold tracking-tighter italic">Cargar Fotografía Oficial</p>
            </section>

            <section className="bg-slate-900/40 border border-white/10 rounded-[2rem] p-6 space-y-4">
                <h3 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic text-primary">Credenciales de Acceso</h3>
                <Input name="email" type="email" label="Correo Electrónico" required />
                <Input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  label="Contraseña del Alumno" 
                  required 
                  isPassword
                  onToggleVisible={() => setShowPassword(!showPassword)}
                  visibleStatus={showPassword}
                />
            </section>
        </div>

        <div className="xl:col-span-8 space-y-6">
            <div className="bg-slate-900/40 border border-white/10 rounded-[2rem] p-8">
                <h3 className="text-white text-[10px] font-black uppercase tracking-widest mb-6 italic text-primary">Datos del Deportista</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="primer_nombre" label="Primer Nombre" required />
                    <Input name="segundo_nombre" label="Segundo Nombre" />
                    <Input name="primer_apellido" label="Primer Apellido" required />
                    <Input name="segundo_apellido" label="Segundo Apellido" />
                    <Select name="tipo_documento" label="Tipo Documento" options={TIPOS_DOCUMENTO} required />
                    <Input name="numero_documento" label="No. Documento" required />
                    
                    <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase ml-1 tracking-widest">Fecha Nacimiento</label>
                        <input type="date" value={fechaNacimiento} onChange={handleFechaChange} required className="w-full bg-slate-800 border-none rounded-xl p-3 text-white text-xs outline-none focus:ring-1 ring-primary [color-scheme:dark]" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase ml-1 tracking-widest">Fecha de Inscripción</label>
                        <input type="date" value={fechaInscripcion} onChange={(e) => setFechaInscripcion(e.target.value)} required className="w-full bg-slate-800 border-none rounded-xl p-3 text-white text-xs outline-none focus:ring-1 ring-primary [color-scheme:dark]" />
                    </div>
                    
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-[9px] text-primary font-bold uppercase ml-1 tracking-widest text-center block">Categoría Automática</label>
                        <div className="w-full bg-primary/5 border border-primary/20 rounded-xl p-3 text-primary text-xs font-black uppercase italic text-center">{categoriaAuto}</div>
                    </div>

                    <Select name="genero" label="Género" options={['MASCULINO', 'FEMENINO', 'OTRO']} required />
                    <Input name="direccion" label="Dirección Residencia" required />
                    <Input label="Teléfono de Contacto" value={contacto1} onChange={(e) => handlePhoneChange(e, setContacto1)} required />
                </div>
            </div>

            <div className="bg-slate-900/40 border border-white/10 rounded-[2rem] p-8">
                <h3 className="text-white text-[10px] font-black uppercase tracking-widest mb-6 italic text-primary">Información del Acudiente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="acudiente_primer_nombre" label="Primer Nombre" required />
                    <Input name="acudiente_segundo_nombre" label="Segundo Nombre" />
                    <Input name="acudiente_primer_apellido" label="Primer Apellido" required />
                    <Input name="acudiente_segundo_apellido" label="Segundo Apellido" />
                    <Select label="Parentesco" value={parentesco} options={PARENTESCOS} onChange={(e) => setParentesco(e.target.value)} required />
                    <Input label="Teléfono Acudiente" value={contacto2} onChange={(e) => handlePhoneChange(e, setContacto2)} required />
                </div>
            </div>

            <div className="bg-slate-900/40 border border-white/10 rounded-[2rem] p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><Select name="eps" label="EPS del Alumno" options={EPS_COLOMBIA} required /></div>
                <Select name="grupo_sanguineo" label="Grupo Sanguíneo" options={GRUPOS_RH} required />
                <Select name="factor_rh" label="Factor RH" options={FACTORES_RH} required />
                <div className="md:col-span-2">
                    <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">Condiciones Médicas / Alergias</label>
                    <textarea name="condiciones_medicas" className="w-full bg-slate-800 rounded-xl p-4 text-white text-xs h-20 outline-none focus:ring-1 ring-primary resize-none" placeholder="Escriba aquí si el alumno padece alguna condición..."></textarea>
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-primary py-5 rounded-2xl text-black font-black uppercase tracking-[0.4em] text-[10px] hover:bg-white hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></span>
                    {statusText}
                  </>
                ) : "Finalizar Matrícula Deportiva"}
            </button>
        </div>
      </form>
    </div>
  );
};

// Sub-componentes actualizados para soportar visibilidad
const Input = ({ label, name, type = "text", required, value, onChange, isPassword, onToggleVisible, visibleStatus }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] text-slate-500 font-bold uppercase ml-1 tracking-widest">{label}</label>
      <div className="relative">
        <input 
          name={name} 
          type={type} 
          required={required} 
          value={value} 
          onChange={onChange} 
          autoComplete="off" 
          className={`w-full bg-slate-800 border-none rounded-xl p-3 text-white text-xs outline-none focus:ring-1 ring-primary transition-all ${isPassword ? 'pr-10' : ''}`} 
        />
        {isPassword && (
          <button
            type="button"
            onClick={onToggleVisible}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg select-none">
              {visibleStatus ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>
    </div>
);
  
const Select = ({ label, name, options, required, value, onChange }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] text-slate-500 font-bold uppercase ml-1 tracking-widest">{label}</label>
      <select name={name} required={required} value={value} onChange={onChange} className="bg-slate-800 border-none rounded-xl p-3 text-white text-xs outline-none focus:ring-1 ring-primary" >
        <option value="">SELECCIONAR...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
);

export default FormularioRegistroAlumno;