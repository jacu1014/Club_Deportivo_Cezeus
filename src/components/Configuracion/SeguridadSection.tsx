import React, { useState } from 'react';
import { supabase } from '../../lib/supabase'; // Asegúrate de tener la ruta correcta
import { registrarLog } from '../../lib/activity';

export const SeguridadSection: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleRecuperacion = async () => {
    setLoading(true);
    try {
      // 1. Obtenemos el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) throw new Error("No se encontró el correo del usuario");

      // 2. Disparamos el correo de recuperación de Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      // 3. REGISTRO DEL LOG (Crítico)
      await registrarLog({
        accion: 'SOLICITUD_RECUPERACION_PASS',
        modulo: 'SEGURIDAD',
        descripcion: `El usuario solicitó un enlace de restablecimiento de contraseña para: ${user.email}`,
        detalles: { plataforma: 'Web App', ip_solicitud: 'browser_action' }
      });

      alert("Enlace enviado a tu correo institucional.");

    } catch (error: any) {
      console.error("Error en seguridad:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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
        
        <button 
          onClick={handleRecuperacion}
          disabled={loading}
          className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
        >
          {loading ? "Procesando..." : "Solicitar enlace de recuperación"}
          <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">open_in_new</span>
        </button>
      </div>
    </div>
  );
};