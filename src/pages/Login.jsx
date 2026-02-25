import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Logo from '../components/Logo_Cezeus.jpeg';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Estado para el ojo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const clearSession = async () => {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      console.log("🧼 Sesión limpia lista para nuevo intento.");
    };
    clearSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // 1. Autenticación con Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) throw authError;

      const userId = data.user.id;
      console.log("✅ Auth exitoso. UID:", userId);

      // 2. Consulta a la tabla 'usuarios'
      const { data: usuario, error: dbError } = await supabase
        .from('usuarios')
        .select('rol, primer_nombre')
        .eq('id', userId)
        .maybeSingle();

      // --- LOGICA DE ACCESO FLEXIBLE ---
      if (dbError || !usuario) {
        console.warn("⚠️ Perfil no encontrado en DB, pero Auth es correcto.");
        // Si quieres bloquear si no hay perfil, descomenta la línea de abajo:
        // throw new Error('Usuario autenticado pero sin perfil en la base de datos.');
      }

      console.log("🏆 Acceso concedido.");
      navigate('/alumnos');

    } catch (err) {
      console.error("🛑 Error:", err.message);
      const errorMessages = {
        'Invalid login credentials': 'El correo o la contraseña son incorrectos.',
        'Email not confirmed': 'Debes confirmar tu correo electrónico.',
        'Email logins are disabled': 'El acceso por email está desactivado.'
      };
      setError(errorMessages[err.message] || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Escribe tu email para enviarte el enlace.');
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSuccessMessage('¡Listo! Revisa tu bandeja de entrada.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cezeus-dark flex items-center justify-center p-6 relative overflow-hidden font-display">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-primary/30 rounded-full animate-pulse"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="bg-cezeus-card/40 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl">
          <div className="flex flex-col items-center mb-8 text-center">
            <img src={Logo} alt="Logo Cezeus" className="w-20 h-20 mb-4 object-contain rounded-2xl shadow-lg" />
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
              Club Deportivo <span className="text-primary">Cezeus</span>
            </h1>
            <p className="text-primary/60 text-[10px] font-bold tracking-[0.4em] uppercase mt-1">Escuela de formación</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
              <input 
                required
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/5 rounded-2xl py-4 px-5 text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                placeholder="tu@email.com"
              />
            </div>

            <div className="relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative">
                <input 
                  required
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/5 rounded-2xl py-4 px-5 pr-12 text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors text-xl"
                >
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            {(error || successMessage) && (
              <div className={`p-4 rounded-xl border text-[10px] font-bold text-center uppercase tracking-widest leading-relaxed ${
                error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-primary/10 border-primary/20 text-primary'
              }`}>
                {error || successMessage}
              </div>
            )}

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-primary hover:bg-[#11d8d8] text-cezeus-dark font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-sm shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? 'Verificando...' : 'Entrar al Club'}
            </button>
          </form>

          <button 
            type="button"
            className="w-full mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-primary transition-colors py-2"
            onClick={handleResetPassword}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;