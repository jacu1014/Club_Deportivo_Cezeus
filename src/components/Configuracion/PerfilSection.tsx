import React from 'react';
import { User } from '../../types';
import { ConfigInput } from './ConfigUI';

interface PerfilSectionProps {
  user: User | null;
}

export const PerfilSection: React.FC<PerfilSectionProps> = ({ user }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* CARD PRINCIPAL: AVATAR Y DATOS BÁSICOS */}
      <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-md">
        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img 
                src={user?.foto_url || "https://via.placeholder.com/150"} 
                className="w-40 h-40 rounded-[2.5rem] object-cover border-4 border-primary/20 shadow-[0_0_30px_rgba(19,236,236,0.15)]"
                alt="Avatar" 
              />
              <div className="absolute -bottom-2 -right-2 bg-primary text-black px-4 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter shadow-xl">
                {user?.rol}
              </div>
            </div>
          </div>

          {/* Grid de Datos Personales */}
          <div className="flex-1 w-full space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ConfigInput label="Primer Nombre" value={user?.primer_nombre} disabled />
              <ConfigInput label="Segundo Nombre" value={user?.segundo_nombre || 'N/A'} disabled />
              <ConfigInput label="Primer Apellido" value={user?.primer_apellido} disabled />
              <ConfigInput label="Segundo Apellido" value={user?.segundo_apellido || 'N/A'} disabled />
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            {/* Fila 2: Documentación y Nacimiento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ConfigInput label="Tipo de Documento" value={user?.tipo_documento} disabled />
              <ConfigInput label="Número de Documento" value={user?.numero_documento} disabled />
              <ConfigInput label="Fecha de Nacimiento" value={user?.fecha_nacimiento} disabled />
            </div>
          </div>
        </div>
      </div>

      {/* SEGUNDA FILA: CONTACTO Y SALUD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bloque: Contacto y Ubicación */}
        <div className="lg:col-span-2 bg-[#0a0f18]/60 border border-white/10 rounded-[2rem] p-8 space-y-6">
          <h3 className="text-white font-black text-[10px] uppercase italic tracking-[0.2em] flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm">contact_mail</span>
            Información de Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ConfigInput label="Correo Institucional" value={user?.email} disabled />
            <ConfigInput label="Teléfono / WhatsApp" value={user?.telefono} disabled />
            <div className="md:col-span-2">
              <ConfigInput label="Dirección de Residencia" value={user?.direccion} disabled />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <ConfigInput label="Género" value={user?.genero} disabled />
            <ConfigInput label="Estado de Cuenta" value={user?.estado} disabled />
          </div>
        </div>

        {/* Bloque: Salud */}
        <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2rem] p-8 space-y-6">
          <h3 className="text-white font-black text-[10px] uppercase italic tracking-[0.2em] flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500 text-sm">medical_services</span>
            Ficha Médica
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <ConfigInput label="Grupo Sanguíneo" value={user?.grupo_sanguineo} disabled />
              <ConfigInput label="Factor RH" value={user?.factor_rh} disabled />
            </div>
            <ConfigInput label="EPS" value={user?.eps} disabled />
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Condiciones Médicas</label>
              <div className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[11px] text-slate-400 min-h-[80px]">
                {user?.condiciones_medicas || 'Sin observaciones médicas registradas.'}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Informativo */}
      <div className="flex justify-between items-center px-8 py-4 bg-white/[0.02] rounded-2xl border border-white/5">
        <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">
          Última actualización: {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
        </p>
      </div>
    </div>
  );
};