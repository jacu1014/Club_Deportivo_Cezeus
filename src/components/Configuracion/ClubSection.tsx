import React, { useState, useEffect } from 'react';
import { ConfigInput } from './ConfigUI';
import { Usuario, RolUsuario } from '../../types';
import { supabase } from '../../lib/supabaseClient';
// Importación de constantes centralizadas
import { CATEGORIAS_FINANZAS } from '../../constants/data';

interface ClubSectionProps {
  staff?: Usuario[];
}

export const ClubSection: React.FC<ClubSectionProps> = ({ staff = [] }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estado para tarifas (Dinámico desde DB)
  const [tarifas, setTarifas] = useState<any[]>([]);
  
  // Estado para proveedores
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombre_proveedor: '',
    nit_cc: '',
    telefono: '',
    categoria_servicio: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // Carga paralela de configuraciones y proveedores
      const [resConfig, resProv] = await Promise.all([
        supabase.from('configuraciones_club').select('*').order('nombre_tarifa', { ascending: true }),
        supabase.from('proveedores').select('*').order('created_at', { ascending: false })
      ]);

      if (resConfig.data) setTarifas(resConfig.data);
      if (resProv.data) setProveedores(resProv.data);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- LÓGICA DE TARIFAS ---
  const handleUpdateTarifa = (id: string, nuevoValor: number) => {
    setTarifas(tarifas.map(t => t.id === id ? { ...t, valor: nuevoValor } : t));
  };

  const handleGuardarTarifas = async () => {
    try {
      setSaving(true);
      const updates = tarifas.map(t => 
        supabase.from('configuraciones_club').update({ valor: t.valor }).eq('id', t.id)
      );
      await Promise.all(updates);
      alert("Tarifas actualizadas correctamente.");
    } catch (error: any) {
      alert("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // --- LÓGICA DE PROVEEDORES ---
  const agregarProveedor = async (e: React.FormEvent) => {
    e.preventDefault();

    // VALIDACIÓN DE DUPLICIDAD (Por NIT/CC)
    const nitNormalizado = nuevoProveedor.nit_cc.trim().toLowerCase();
    const existe = proveedores.some(p => p.nit_cc.trim().toLowerCase() === nitNormalizado);

    if (existe) {
      alert(`El NIT/CC "${nuevoProveedor.nit_cc}" ya se encuentra registrado.`);
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from('proveedores').insert([
        {
          ...nuevoProveedor,
          nombre_proveedor: nuevoProveedor.nombre_proveedor.toUpperCase(),
          nit_cc: nuevoProveedor.nit_cc.trim()
        }
      ]);

      if (error) throw error;

      alert("Proveedor registrado exitosamente.");
      setNuevoProveedor({ nombre_proveedor: '', nit_cc: '', telefono: '', categoria_servicio: '' });
      fetchData(); // Recargar lista
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const eliminarProveedor = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar al proveedor ${nombre}?`)) return;
    
    try {
      const { error } = await supabase.from('proveedores').delete().eq('id', id);
      if (error) throw error;
      setProveedores(proveedores.filter(p => p.id !== id));
    } catch (error: any) {
      alert("No se pudo eliminar: " + error.message);
    }
  };

  // --- CÁLCULOS Y KPIs ---
  const alumnos = (staff || []).filter(u => u.rol === RolUsuario.ALUMNO);
  // Buscamos el valor de mensualidad en el array dinámico para el KPI
  const valMensualidad = tarifas.find(t => t.categoria_asociada === 'Mensualidad')?.valor || 0;
  const proyeccionMensual = alumnos.length * valMensualidad;

  if (loading) return (
    <div className="py-20 text-center text-primary animate-pulse font-black uppercase text-[10px] tracking-[0.5em]">
      Sincronizando Sistema...
    </div>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* PANEL DE MÉTRICAS (RESPONSIVE) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-[2rem] flex flex-col gap-1 shadow-inner">
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Recaudo Estimado</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white italic">${proyeccionMensual.toLocaleString()}</span>
            <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-tighter">Mensual</span>
          </div>
        </div>
        
        <div className="bg-primary/5 border border-primary/10 p-5 rounded-[2rem] flex flex-col gap-1 shadow-inner">
          <span className="text-[9px] font-black text-primary uppercase tracking-widest">Atletas Activos</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white italic">{alumnos.length}</span>
            <span className="text-[8px] text-primary font-bold uppercase">Inscritos</span>
          </div>
        </div>

        <div className="bg-purple-500/5 border border-purple-500/10 p-5 rounded-[2rem] flex flex-col gap-1 shadow-inner">
          <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Proveedores</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white italic">{proveedores.length}</span>
            <span className="text-[8px] text-purple-400 font-bold uppercase">Registrados</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUMNA: TARIFAS MAESTRAS */}
        <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col gap-1">
            <h3 className="text-white font-black text-sm uppercase italic flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span> 
              Configuración de Tarifas
            </h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Valores globales de ingreso</p>
          </div>
          
          <div className="space-y-4">
            {tarifas.map((t) => (
              <ConfigInput 
                key={t.id}
                label={t.nombre_tarifa} 
                value={t.valor.toString()} 
                onChange={(val) => handleUpdateTarifa(t.id, Number(val))}
              />
            ))}
            
            <button 
              onClick={handleGuardarTarifas}
              disabled={saving}
              className="w-full bg-primary text-black py-4 rounded-xl text-[10px] font-black uppercase hover:bg-white transition-all active:scale-95 disabled:opacity-50 mt-4"
            >
              {saving ? 'PROCESANDO...' : 'GUARDAR CAMBIOS'}
            </button>
          </div>
        </div>

        {/* COLUMNA: GESTIÓN DE PROVEEDORES */}
        <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col gap-1">
            <h3 className="text-white font-black text-sm uppercase italic flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400">local_shipping</span> 
              Directorio de Proveedores
            </h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Gestión de aliados y egresos</p>
          </div>

          {/* Formulario de registro */}
          <form onSubmit={agregarProveedor} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
            <input 
              placeholder="NOMBRE O RAZÓN SOCIAL"
              className="sm:col-span-2 bg-[#020617] border border-white/10 p-3 rounded-xl text-[10px] font-bold text-white outline-none focus:border-purple-400 uppercase"
              value={nuevoProveedor.nombre_provider}
              onChange={e => setNuevoProveedor({...nuevoProveedor, nombre_proveedor: e.target.value})}
              required
            />
            <input 
              placeholder="NIT / CC"
              className="bg-[#020617] border border-white/10 p-3 rounded-xl text-[10px] font-bold text-white outline-none focus:border-purple-400 uppercase"
              value={nuevoProveedor.nit_cc}
              onChange={e => setNuevoProveedor({...nuevoProveedor, nit_cc: e.target.value})}
              required
            />
            <select 
              className="bg-[#020617] border border-white/10 p-3 rounded-xl text-[10px] font-bold text-white outline-none focus:border-purple-400 uppercase"
              value={nuevoProveedor.categoria_servicio}
              onChange={e => setNuevoProveedor({...nuevoProveedor, categoria_servicio: e.target.value})}
              required
            >
              <option value="">SERVICIO / CATEGORÍA</option>
              {CATEGORIAS_FINANZAS.EGRESO.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button type="submit" className="sm:col-span-2 bg-purple-500 text-white p-3 rounded-xl text-[9px] font-black uppercase hover:bg-purple-400 transition-all">
              REGISTRAR PROVEEDOR
            </button>
          </form>

          {/* Lista con Scroll */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
            {proveedores.map(p => (
              <div key={p.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 group hover:border-purple-500/30 transition-all">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white uppercase italic">{p.nombre_proveedor}</span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                    {p.nit_cc} • <span className="text-purple-400">{p.categoria_servicio}</span>
                  </span>
                </div>
                <button 
                  onClick={() => eliminarProveedor(p.id, p.nombre_proveedor)}
                  className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};