import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Logo from '../components/Logo_Cezeus.jpeg';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // --- NUEVO: Capturar la sesión del enlace del correo ---
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setMessage({ 
          type: 'error', 
          text: 'El enlace ha expirado o es inválido. Solicita uno nuevo.' 
        });
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Mínimo 6 caracteres' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Intentamos actualizar
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        // Si sale el error de sesión, damos un mensaje más claro
        const errorText = error.message.includes('session') 
          ? 'Sesión expirada. Por favor, solicita un nuevo correo.' 
          : error.message;
        setMessage({ type: 'error', text: errorText });
      } else {
        setMessage({ 
          type: 'success', 
          text: '¡Clave actualizada! Entrando...' 
        });
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cezeus-dark flex items-center justify-center p-6 font-display">
      <div className="w-full max-w-md">
        <div className="bg-cezeus-card/40 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl">
          
          <div className="flex flex-col items-center mb-8 text-center">
            <img src={Logo} alt="Logo" className="w-20 h-20 mb-4 object-contain" />
            <h2 className="text-xl font-black text-white uppercase">
              Nueva <span className="text-primary">Contraseña</span>
            </h2>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <input 
              required
              type="password" 
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none focus:ring-1 focus:ring-primary"
            />
            <input 
              required
              type="password" 
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none focus:ring-1 focus:ring-primary"
            />

            <button 
              disabled={loading}
              className="w-full bg-primary text-cezeus-dark font-black py-4 rounded-2xl uppercase tracking-widest text-sm disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Actualizar'}
            </button>
          </form>

          {message.text && (
            <div className={`mt-6 p-3 rounded-xl border text-center text-[10px] font-bold uppercase ${
              message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-primary/10 border-primary/20 text-primary'
            }`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;