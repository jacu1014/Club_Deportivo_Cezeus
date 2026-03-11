import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { registrarLog } from '../lib/activity'; // 1. Importamos tu función de log
import LogoCezeus from '../components/Logo_Cezeus.jpeg';

const TermsModal = ({ user, content, onAccepted }) => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50) setHasScrolled(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // 2. Actualizamos el estado del usuario
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ acepta_terminos: true })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 3. Registramos la actividad en la tabla 'actividad'
      await registrarLog({
        accion: 'ACEPTACION_TERMINOS',
        descripcion: `Consentimiento firmado por el acudiente de ${user.primer_nombre} ${user.primer_apellido}`,
        modulo: 'LEGAL',
        detalles: { 
          version: '2026.1',
          plataforma: 'Web App',
          usuario_rol: user.rol 
        }
      });

      onAccepted();
    } catch (err) {
      console.error("Error al firmar el consentimiento:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#05080d]/98 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#0b121f] border border-cyan-500/30 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Encabezado con Logo */}
        <div className="p-6 border-b border-cyan-500/10 bg-[#0d1726] flex items-center space-x-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden border border-cyan-500/20 bg-black/40 p-1">
            <img 
              src={LogoCezeus} 
              alt="Logo Cezeus" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-cyan-400 font-black uppercase tracking-widest text-lg leading-tight">
              Consentimiento Informado
            </h2>
            <p className="text-gray-500 text-[10px] font-bold tracking-[0.3em] uppercase">
              Club Deportivo Cezeus
            </p>
          </div>
        </div>

        {/* Cuerpo del Consentimiento */}
        <div 
          onScroll={handleScroll}
          className="p-8 overflow-y-auto text-gray-300 text-sm leading-relaxed space-y-6 custom-scrollbar bg-black/10 relative"
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
             <img src={LogoCezeus} alt="" className="w-64 h-64 grayscale" />
          </div>

          <div className="relative z-10">
            <p className="font-bold text-gray-100 mb-4 border-l-2 border-cyan-500 pl-3">
              Estimado acudiente de {user.primer_nombre} {user.primer_apellido}:
            </p>
            <div className="whitespace-pre-wrap font-light text-justify">
              {content?.split('\\n').join('\n')}
            </div>
          </div>
        </div>

        {/* Footer de Firma */}
        <div className="p-6 border-t border-cyan-500/10 bg-[#0d1726] space-y-4">
          <label className="flex items-start space-x-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                disabled={!hasScrolled}
                checked={checked}
                onChange={() => setChecked(!checked)}
                className="w-5 h-5 rounded border-cyan-500/50 bg-black text-cyan-500 focus:ring-cyan-500 disabled:opacity-20 transition-all"
              />
            </div>
            <span className={`text-xs leading-tight ${!hasScrolled ? 'text-gray-600' : 'text-gray-300 group-hover:text-cyan-400'}`}>
              {!hasScrolled 
                ? "Por favor, lea el documento completo hasta el final para habilitar la firma digital..." 
                : "Confirmo que he leído íntegramente este documento y acepto los términos y condiciones de participación."}
            </span>
          </label>

          <button
            onClick={handleConfirm}
            disabled={!checked || loading}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800/50 disabled:text-gray-600 text-white font-black rounded-xl transition-all shadow-lg shadow-cyan-500/10 uppercase tracking-[0.2em] text-[11px] active:scale-[0.98]"
          >
            {loading ? "Registrando Firma Digital..." : "Firmar y Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;