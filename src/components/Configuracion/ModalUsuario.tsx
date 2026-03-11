import React, { useState, useEffect, useRef } from 'react';
import { Usuario, RolUsuario } from '../../types';
import { supabaseAdmin } from '../../lib/supabaseAdmin'; 
import { registrarLog } from '../../lib/activity';
import { 
  EPS_COLOMBIA, 
  TIPOS_DOCUMENTO, 
  GRUPOS_RH, 
  FACTORES_RH 
} from '../../constants/data';

interface ModalUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  usuarioAEditar?: Usuario | null;
}

export const ModalUsuario: React.FC<ModalUsuarioProps> = ({ isOpen, onClose, onSave, usuarioAEditar }) => {
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [mensaje, setMensaje] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (usuarioAEditar) {
        setFechaNacimiento(usuarioAEditar.fecha_nacimiento || '');
        setFotoPreview(usuarioAEditar.foto_url || null);
      } else {
        setFechaNacimiento('');
        setFotoPreview(null);
        setShowPassword(false);
      }
    }
  }, [isOpen, usuarioAEditar]);

  const mostrarMensaje = (texto: string, tipo: 'success' | 'error') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 5000);
  };
  
  const borrarFotoAntigua = async (urlAntigua: string | null) => {
    if (!urlAntigua) return;
    try {
      const urlSinParams = urlAntigua.split('?')[0];
      const partes = urlSinParams.split('Fotos_Administrativos/');
      if (partes.length > 1) {
        const filePathParaBorrar = partes[1];
        const { error } = await supabaseAdmin.storage
          .from('Fotos_Administrativos')
          .remove([filePathParaBorrar]);
        if (error) console.error("Error al borrar foto antigua:", error.message);
      }
    } catch (err) {
      console.error("Error procesando borrado de foto:", err);
    }
  };

  const ejecutarProcesoStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setStatusText(usuarioAEditar ? 'Sincronizando...' : 'Creando credenciales...');
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get('email')?.toString().toLowerCase().trim();
    const numDoc = formData.get('numero_documento')?.toString().trim();
    
    let authUserId = usuarioAEditar?.id || null;

    try {
      if (!usuarioAEditar) {
        const { data: check } = await supabaseAdmin
          .from('usuarios')
          .select('id')
          .or(`numero_documento.eq.${numDoc},email.eq.${email}`)
          .maybeSingle();

        if (check) throw new Error("Documento o correo ya registrados.");

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email!,
          password: formData.get('password')?.toString(),
          email_confirm: true,
          user_metadata: { role: formData.get('rol') }
        });

        if (authError) throw authError;
        authUserId = authData.user?.id;
      }

      let publicUrlFinal = usuarioAEditar?.foto_url || null; 
      const fotoArchivo = fileInputRef.current?.files?.[0];

      if (fotoArchivo && authUserId) {
        setStatusText('Subiendo foto...');
        if (usuarioAEditar?.foto_url) {
          await borrarFotoAntigua(usuarioAEditar.foto_url);
        }

        const fileExt = fotoArchivo.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `staff/${authUserId}/${fileName}`;

        const { error: upError } = await supabaseAdmin.storage
          .from('Fotos_Administrativos')
          .upload(filePath, fotoArchivo, {
            contentType: fotoArchivo.type,
            cacheControl: '3600',
            upsert: true
          });
        
        if (!upError) {
          const { data } = supabaseAdmin.storage
            .from('Fotos_Administrativos')
            .getPublicUrl(filePath);
          publicUrlFinal = `${data.publicUrl}?t=${Date.now()}`;
        }
      }

      setStatusText('Guardando en DB...');
      const estadoSeleccionado = formData.get('estado')?.toString() || 'Activo';
      const rolSeleccionado = formData.get('rol')?.toString();

      const payload = {
        id: authUserId,
        rol: rolSeleccionado,
        estado: estadoSeleccionado,
        email: email,
        primer_nombre: formData.get('primer_nombre')?.toString().toUpperCase(),
        segundo_nombre: formData.get('segundo_nombre')?.toString().toUpperCase() || null,
        primer_apellido: formData.get('primer_apellido')?.toString().toUpperCase(),
        segundo_apellido: formData.get('segundo_apellido')?.toString().toUpperCase() || null,
        tipo_documento: formData.get('tipo_documento'),
        numero_documento: numDoc,
        fecha_nacimiento: fechaNacimiento,
        telefono: formData.get('telefono'),
        direccion: formData.get('direccion')?.toString().toUpperCase(),
        genero: formData.get('genero'),
        eps: formData.get('eps'),
        grupo_sanguineo: formData.get('grupo_sanguineo'),
        factor_rh: formData.get('factor_rh'),
        foto_url: publicUrlFinal 
      };

      const { error: dbError } = await supabaseAdmin
        .from('usuarios')
        .upsert(payload, { onConflict: 'id' });

      if (dbError) throw dbError;

      // --- LOG ACTUALIZADO ---
      await registrarLog({
        accion: usuarioAEditar ? 'ACTUALIZACION_STAFF' : 'REGISTRO_STAFF',
        modulo: 'NOMINA',
        descripcion: `${usuarioAEditar ? 'Actualización' : 'Registro'} de personal: ${payload.primer_nombre} ${payload.primer_apellido}`,
        detalles: { 
          rol: rolSeleccionado, 
          estado: estadoSeleccionado,
          documento: numDoc
        }
      });

      mostrarMensaje("✨ Proceso completado exitosamente", "success");
      
      setTimeout(() => {
        onSave();
        onClose();
      }, 1000);

    } catch (err: any) {
      if (!usuarioAEditar && authUserId) {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
      }
      mostrarMensaje(err.message || "Error al procesar el registro", "error");
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      
      {mensaje && (
        <div className={`fixed top-10 right-10 z-[110] p-5 rounded-2xl border backdrop-blur-md shadow-2xl transition-all ${
          mensaje.tipo === 'success' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'
        }`}>
          <p className="text-[10px] font-black uppercase tracking-widest">{mensaje.texto}</p>
        </div>
      )}

      <div className="bg-[#0a0f18] border border-white/10 w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-[3rem] shadow-2xl no-scrollbar">
        
        <div className="p-8 pb-0 flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
              {usuarioAEditar ? 'Editar' : 'Nuevo'} <span className="text-primary">Staff</span>
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Gestión Administrativa</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-rose-500/20 hover:text-rose-500 transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={ejecutarProcesoStaff} className="p-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-4 space-y-6">
            <section className="bg-slate-900/40 border border-white/10 rounded-[2rem] p-6 text-center">
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className="w-40 h-48 mx-auto bg-slate-800 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden group relative transition-all hover:border-primary/50"
                >
                    {fotoPreview ? (
                      <img src={fotoPreview} className="w-full h-full object-cover" alt="preview" />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-slate-600">add_a_photo</span>
                    )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        if (fotoPreview?.startsWith('blob:')) URL.revokeObjectURL(fotoPreview);
                        setFotoPreview(URL.createObjectURL(file));
                    }
                }} />
                <p className="text-[9px] text-slate-500 mt-3 uppercase font-bold tracking-tighter italic">Foto de Identificación</p>
            </section>

            <section className="bg-slate-900/40 border border-white/10 rounded-[2rem] p-6 space-y-4">
                <h3 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic text-primary">Acceso</h3>
                <Input name="email" type="email" label="Correo Institucional" defaultValue={usuarioAEditar?.email} required disabled={!!usuarioAEditar} />
                
                {!usuarioAEditar && (
                  <Input 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    label="Contraseña Temporal" 
                    required 
                    isPassword={true}
                    showPassword={showPassword}
                    togglePassword={() => setShowPassword(!showPassword)}
                  />
                )}

                <Select 
                  name="rol" 
                  label="Rol" 
                  defaultValue={usuarioAEditar?.rol || RolUsuario.ENTRENADOR} 
                  options={[RolUsuario.DIRECTOR, RolUsuario.ADMINISTRATIVO, RolUsuario.ENTRENADOR, RolUsuario.SUPER_ADMIN, 'CONTADOR']} 
                  required 
                />
                <Select 
                  name="estado" 
                  label="Estado" 
                  defaultValue={usuarioAEditar?.estado || 'Activo'} 
                  options={['Activo', 'Inactivo']} 
                />
            </section>
          </div>

          <div className="xl:col-span-8 space-y-6">
            <div className="bg-slate-900/40 border border-white/10 rounded-[2rem] p-8">
                <h3 className="text-white text-[10px] font-black uppercase tracking-widest mb-6 italic text-primary">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="primer_nombre" label="Primer Nombre" defaultValue={usuarioAEditar?.primer_nombre} required />
                    <Input name="segundo_nombre" label="Segundo Nombre" defaultValue={usuarioAEditar?.segundo_nombre} />
                    <Input name="primer_apellido" label="Primer Apellido" defaultValue={usuarioAEditar?.primer_apellido} required />
                    <Input name="segundo_apellido" label="Segundo Apellido" defaultValue={usuarioAEditar?.segundo_apellido} />
                    <Select name="tipo_documento" label="Tipo Documento" defaultValue={usuarioAEditar?.tipo_documento} options={TIPOS_DOCUMENTO} required />
                    <Input name="numero_documento" label="No. Documento" defaultValue={usuarioAEditar?.numero_documento} required />
                    <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase ml-1 tracking-widest">Fecha Nacimiento</label>
                        <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} required className="w-full bg-slate-800 border-none rounded-xl p-3 text-white text-xs outline-none focus:ring-1 ring-primary [color-scheme:dark]" />
                    </div>
                    <Select name="genero" label="Género" defaultValue={usuarioAEditar?.genero} options={['MASCULINO', 'FEMENINO', 'OTRO']} required />
                </div>
            </div>

            <div className="bg-slate-900/40 border border-white/10 rounded-[2rem] p-8 space-y-4">
                <h3 className="text-white text-[10px] font-black uppercase tracking-widest italic text-primary">Salud y Ubicación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input name="telefono" label="WhatsApp / Teléfono" defaultValue={usuarioAEditar?.telefono} required />
                  <Input name="direccion" label="Dirección de Residencia" defaultValue={usuarioAEditar?.direccion} required />
                  <div className="md:col-span-2">
                    <Select name="eps" label="Entidad de Salud" defaultValue={usuarioAEditar?.eps} options={EPS_COLOMBIA} required />
                  </div>
                  <Select name="grupo_sanguineo" label="Grupo Sanguíneo" defaultValue={usuarioAEditar?.grupo_sanguineo} options={GRUPOS_RH} required />
                  <Select name="factor_rh" label="Factor RH" defaultValue={usuarioAEditar?.factor_rh} options={FACTORES_RH} required />
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-primary py-5 rounded-2xl text-black font-black uppercase tracking-[0.4em] text-[10px] hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></span>
                    {statusText}
                  </>
                ) : usuarioAEditar ? "Actualizar Staff" : "Completar Registro Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Input = ({ label, name, type = "text", required, defaultValue, disabled, isPassword, showPassword, togglePassword }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] text-slate-500 font-bold uppercase ml-1 tracking-widest">{label}</label>
    <div className="relative">
      <input 
        name={name} 
        type={type} 
        required={required} 
        defaultValue={defaultValue} 
        disabled={disabled} 
        autoComplete={isPassword ? "new-password" : "off"} 
        className={`w-full bg-slate-800 border-none rounded-xl p-3 text-white text-xs outline-none focus:ring-1 ring-primary disabled:opacity-30 transition-all uppercase placeholder:lowercase ${isPassword ? 'pr-10' : ''}`} 
      />
      {isPassword && (
        <button
          type="button"
          onClick={togglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[18px]">
            {showPassword ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      )}
    </div>
  </div>
);

const Select = ({ label, name, options, required, defaultValue }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] text-slate-500 font-bold uppercase ml-1 tracking-widest">{label}</label>
    <select name={name} required={required} defaultValue={defaultValue} className="bg-slate-800 border-none rounded-xl p-3 text-white text-xs outline-none focus:ring-1 ring-primary" >
      <option value="">SELECCIONAR...</option>
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);