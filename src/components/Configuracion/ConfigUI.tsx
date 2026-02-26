// src/components/Configuracion/ConfigUI.tsx
import React from 'react';

export const TabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all border ${
      active 
      ? 'bg-primary/10 border-primary text-primary shadow-[0_0_20px_rgba(19,236,236,0.1)]' 
      : 'bg-transparent border-transparent text-slate-500 hover:text-white'
    }`}
  >
    <span className="material-symbols-outlined text-xl">{icon}</span>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

// ACTUALIZADO: Ahora acepta onChange y className
export const ConfigInput = ({ label, value, onChange, disabled = false, className = "" }: any) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type="text" 
      value={value} // Cambiado de defaultValue a value para que sea un componente controlado
      onChange={(e) => onChange && onChange(e.target.value)} // Añadido el evento de cambio
      disabled={disabled}
      className={`w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed font-medium ${className}`}
    />
  </div>
);