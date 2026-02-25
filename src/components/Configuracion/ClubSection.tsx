import React, { useState, useEffect } from 'react';
import { ConfigInput } from './ConfigUI';
import { Usuario, RolUsuario } from '../../types';
import { supabase } from '../../lib/supabaseClient';

interface ClubSectionProps {
  staff?: Usuario[];
}

export const ClubSection: React.FC<ClubSectionProps> = ({ staff = [] }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [tarifas, setTarifas] = useState({
    mensualidad_base: 0,
    inscripcion_anual: 0,
    valor_uniforme: 0,
    costo_canchas_semanal: 0
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('configuraciones_club')
          .select('*')
          .order('fecha_cambio', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setTarifas({
            mensualidad_base: data.mensualidad_base,
            inscripcion_anual: data.inscripcion_anual,
            valor_uniforme: data.valor_uniforme,
            costo_canchas_semanal: data.costo_canchas_semanal
          });
        }
      } catch (error) {
        console.error("Error cargando configuración:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleGuardar = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('configuraciones_club')
        .insert([tarifas]);

      if (error) throw error;
      alert("Tarifas actualizadas correctamente en el historial.");
    } catch (error: any) {
      alert("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // 1. Filtrar solo alumnos
  const alumnos = (staff || []).filter(u => u.rol === RolUsuario.ALUMNO);
  
  // 2. Lógica de conteo por categoría (Corregido según tu esquema de base de datos)
  const categoriasVisuales = [
    { 
      nombre: 'Iniciación', 
      rango: '5-7 años', 
      count: alumnos.filter(a => 
        a.categoria?.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("INICIACION")
      ).length 
    },
    { 
      nombre: 'Infantil', 
      rango: '8-10 años', 
      count: alumnos.filter(a => 
        a.categoria?.toUpperCase().includes("INFANTIL")
      ).length 
    },
    { 
      nombre: 'Transición', 
      rango: '11-13 años', 
      count: alumnos.filter(a => 
        a.categoria?.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("TRANSICION")
      ).length 
    },
  ];

  // KPIs dinámicos
  const proyeccionMensual = alumnos.length * tarifas.mensualidad_base;

  if (loading) return (
    <div className="py-20 text-center text-primary animate-pulse font-black uppercase text-[10px] tracking-[0.5em]">
      Sincronizando con la base de datos...
    </div>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* PANEL DE MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-[2rem] flex flex-col gap-1 shadow-inner">
          <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">Recaudo Proyectado</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white italic">${proyeccionMensual.toLocaleString()}</span>
            <span className="text-[8px] text-emerald-500 font-bold uppercase">Mes</span>
          </div>
        </div>
        
        <div className="bg-primary/5 border border-primary/10 p-5 rounded-[2rem] flex flex-col gap-1 shadow-inner">
          <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">Total Alumnos</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white italic">{alumnos.length}</span>
            <span className="text-[8px] text-primary font-bold uppercase">Atletas</span>
          </div>
        </div>

        <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-[2rem] flex flex-col gap-1 shadow-inner">
          <span className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest">Gasto Cancha Semanal</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white italic">${tarifas.costo_canchas_semanal.toLocaleString()}</span>
            <span className="text-[8px] text-blue-500 font-bold uppercase">Base</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Columna: Categorías Dinámicas */}
        <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2rem] p-6 space-y-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-black text-sm uppercase italic flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">category</span> 
              Estructura de Categorías
            </h3>
            <span className="text-[8px] bg-white/5 text-slate-400 px-2 py-1 rounded border border-white/5 font-bold uppercase tracking-tighter">
              Sincronizado
            </span>
          </div>

          <div className="space-y-3">
            {categoriasVisuales.map((cat) => (
              <div 
                key={cat.nombre} 
                className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all"
              >
                <div className="flex flex-col">
                  <span className="text-xs text-white font-black uppercase italic">{cat.nombre}</span>
                  <span className="text-[9px] text-primary font-bold tracking-widest">{cat.rango}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-white font-black text-sm italic">{cat.count}</span>
                    <span className="text-[7px] text-slate-500 font-bold uppercase">Alumnos</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-700 group-hover:text-primary/40 transition-colors text-sm">verified</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
            <p className="text-[9px] text-primary/80 font-medium leading-relaxed uppercase italic">
              * Datos extraídos de la columna <span className="text-primary font-black italic">categoria</span> de la tabla usuarios.
            </p>
          </div>
        </div>
        
        {/* Columna: Tarifas (VARIABLES CONECTADAS) */}
        <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2rem] p-6 space-y-4 shadow-xl backdrop-blur-md">
          <div className="flex flex-col gap-1">
            <h3 className="text-white font-black text-sm uppercase italic flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span> 
              Tarifas Globales
            </h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Configuración de ingresos COP</p>
          </div>
          
          <div className="space-y-5 pt-2">
            <ConfigInput 
              label="Mensualidad Base" 
              value={tarifas.mensualidad_base.toString()} 
              onChange={(val) => setTarifas({...tarifas, mensualidad_base: Number(val)})}
            />
            <ConfigInput 
              label="Inscripción Anual" 
              value={tarifas.inscripcion_anual.toString()} 
              onChange={(val) => setTarifas({...tarifas, inscripcion_anual: Number(val)})}
            />
            <ConfigInput 
              label="Valor Uniforme" 
              value={tarifas.valor_uniforme.toString()} 
              onChange={(val) => setTarifas({...tarifas, valor_uniforme: Number(val)})}
            />
            <ConfigInput 
              label="Costo Canchas (Semanal)" 
              value={tarifas.costo_canchas_semanal.toString()} 
              onChange={(val) => setTarifas({...tarifas, costo_canchas_semanal: Number(val)})}
            />
            
            <div className="pt-4 flex flex-col gap-3">
              <button 
                onClick={handleGuardar}
                disabled={saving}
                className="w-full bg-primary text-black py-4 rounded-xl text-[10px] font-black uppercase hover:bg-white transition-all shadow-lg shadow-primary/10 active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar y Actualizar'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};