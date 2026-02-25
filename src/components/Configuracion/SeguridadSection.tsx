import React from 'react';

export const SeguridadSection: React.FC = () => (
  <div className="max-w-2xl bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] p-8 animate-in slide-in-from-bottom-4 duration-500">
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-5 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
        <span className="material-symbols-outlined text-rose-500 text-3xl">shield_lock</span>
        <div>
          <h4 className="text-rose-200 text-[11px] font-black uppercase italic">Protección de Cuenta</h4>
          <p className="text-[10px] text-rose-200/50 font-bold uppercase leading-relaxed mt-1">
            Por seguridad, para cambiar tu contraseña se enviará un token de validación a tu correo registrado.
          </p>
        </div>
      </div>
      <button className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3 group">
        Solicitar enlace de recuperación
        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">open_in_new</span>
      </button>
    </div>
  </div>
);