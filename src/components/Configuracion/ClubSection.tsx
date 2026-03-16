import React, { useState, useEffect } from 'react';
import { ConfigInput } from './ConfigUI';
import { Usuario, RolUsuario } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { CATEGORIAS_FINANZAS } from '../../constants/data';
import { registrarLog } from '../../lib/activity'; // Importamos el logger

interface ClubSectionProps {
  staff?: Usuario[];
}

export const ClubSection: React.FC<ClubSectionProps> = ({ staff = [] }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [tarifas, setTarifas] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombre_proveedor: '',
    nit_cc: '',
    telefono: '',
    categoria_servicio: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resConfig, resProv] = await Promise.all([
        supabase.from('configuraciones_club').select('id, nombre_tarifa, categoria_asociada, valor, descripcion, ultima_actualizacion').order('nombre_tarifa', { ascending: true }),
        supabase.from('proveedores').select('id, nombre_proveedor, nit_cc, telefono, categoria_servicio, created_at').order('created_at', { ascending: false })
      ]);

      if (resConfig.data) setTarifas(resConfig.data);
      if (resProv.data) setProveedores(resProv.data);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LÓGICA TARIFAS ---
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

      // LOG: Registro de actualización de tarifas
      await registrarLog({
        accion: 'ACTUALIZACION_TARIFAS',
        descripcion: 'Se actualizaron los valores de las tarifas globales del club',
        modulo: 'CONFIGURACION',
        detalles: { tarifas_actualizadas: tarifas.map(t => ({ nombre: t.nombre_tarifa, valor: t.valor })) }
      });

      alert("Tarifas actualizadas correctamente.");
    } catch (error: any) {
      alert("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // --- LÓGICA PROVEEDORES ---
  const agregarProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    const nitNormalizado = nuevoProveedor.nit_cc.trim().toLowerCase();
    const existe = proveedores.some(p => p.nit_cc.trim().toLowerCase() === nitNormalizado);

    if (existe) {
      alert(`El NIT/CC "${nuevoProveedor.nit_cc}" ya existe.`);
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from('proveedores').insert([{
        ...nuevoProveedor,
        nombre_proveedor: nuevoProveedor.nombre_proveedor.toUpperCase(),
        nit_cc: nuevoProveedor.nit_cc.trim(),
        telefono: nuevoProveedor.telefono.trim()
      }]);

      if (error) throw error;

      // LOG: Nuevo proveedor
      await registrarLog({
        accion: 'REGISTRO_PROVEEDOR',
        descripcion: `Se registró al proveedor: ${nuevoProveedor.nombre_proveedor.toUpperCase()}`,
        modulo: 'DIRECTORIO',
        detalles: { nit: nuevoProveedor.nit_cc, categoria: nuevoProveedor.categoria_servicio }
      });

      setNuevoProveedor({ nombre_proveedor: '', nit_cc: '', telefono: '', categoria_servicio: '' });
      fetchData();
    } catch (error: any) { alert(error.message); } finally { setSaving(false); }
  };

  const eliminarProveedor = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar a ${nombre}?`)) return;
    try {
      const { error } = await supabase.from('proveedores').delete().eq('id', id);
      if (error) throw error;

      // LOG: Eliminación
      await registrarLog({
        accion: 'ELIMINACION_PROVEEDOR',
        descripcion: `Se eliminó al proveedor: ${nombre}`,
        modulo: 'DIRECTORIO',
        detalles: { id_eliminado: id }
      });

      setProveedores(proveedores.filter(p => p.id !== id));
    } catch (error: any) { alert(error.message); }
  };

  // --- FILTRADO DINÁMICO ---
  const proveedoresFiltrados = proveedores.filter(p => 
    p.nombre_proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nit_cc.includes(searchTerm) ||
    p.categoria_servicio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- CÁLCULOS ---
  const alumnos = (staff || []).filter(u => u.rol === RolUsuario.ALUMNO);
  const categoriasVisuales = [
  { 
    nombre: 'Iniciación', 
    rango: '5-7 años', 
    count: alumnos.filter(a => 
      a.categoria?.toLowerCase().includes("iniciación")
    ).length 
  },
  { 
    nombre: 'Infantil', 
    rango: '8-10 años', 
    count: alumnos.filter(a => 
      a.categoria?.toLowerCase().includes("infantil")
    ).length 
  },
  { 
    nombre: 'Transición', 
    rango: '11-13 años', 
    count: alumnos.filter(a => 
      a.categoria?.toLowerCase().includes("transición")
    ).length 
  },
  
];

  const valMensualidad = tarifas.find(t => t.categoria_asociada === 'Mensualidad' && t.nombre_tarifa === 'Mensualidad Base Full')?.valor || 0;
  const valCanchas = tarifas.find(t => t.nombre_tarifa.toLowerCase().includes('cancha'))?.valor || 0;

  if (loading) return <div className="py-20 text-center text-primary animate-pulse font-black uppercase text-[10px] tracking-[0.5em]">Sincronizando...</div>;

  return (
    <div className="space-y-6 pb-10">
      
      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-[2rem]">
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Recaudo Proyectado</span>
          <div className="text-2xl font-black text-white italic">${(alumnos.length * valMensualidad).toLocaleString()}</div>
        </div>
        <div className="bg-primary/5 border border-primary/10 p-5 rounded-[2rem]">
          <span className="text-[9px] font-black text-primary uppercase tracking-widest">Total Alumnos</span>
          <div className="text-2xl font-black text-white italic">{alumnos.length} Atletas</div>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-[2rem]">
          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Gasto Cancha Semanal</span>
          <div className="text-2xl font-black text-white italic">${valCanchas.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* IZQUIERDA: CATEGORÍAS */}
        <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] p-6 space-y-4">
          <h3 className="text-white font-black text-sm uppercase italic flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">category</span> Estructura de Categorías
          </h3>
          <div className="space-y-3">
            {categoriasVisuales.map((cat) => (
              <div key={cat.nombre} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs text-white font-black uppercase italic">{cat.nombre}</span>
                  <span className="text-[9px] text-primary font-bold tracking-widest">{cat.rango}</span>
                </div>
                <div className="text-white font-black text-sm italic">{cat.count} <span className="text-[7px] text-slate-500 uppercase">Alumnos</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* DERECHA: TARIFAS */}
        <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] p-6 space-y-6 shadow-xl">
          <h3 className="text-white font-black text-sm uppercase italic flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">payments</span> Tarifas Globales
          </h3>
          
          <div className="space-y-4">
            {tarifas.length > 0 ? tarifas.map((t) => (
              <div key={t.id} className="relative group">
                <span className="absolute left-4 bottom-[13px] text-primary font-black text-[11px] z-20 pointer-events-none">
                  $
                </span>
                
                <ConfigInput 
                  label={t.nombre_tarifa} 
                  value={t.valor.toString()} 
                  onChange={(val) => handleUpdateTarifa(t.id, Number(val))}
                  className="!pl-9" 
                />
              </div>
            )) : (
              <p className="text-[10px] text-slate-500 uppercase font-black text-center py-4">
                No hay tarifas en DB
              </p>
            )}
            
            <button 
              onClick={handleGuardarTarifas}
              disabled={saving}
              className="w-full bg-primary text-black py-4 rounded-xl text-[10px] font-black uppercase hover:bg-white transition-all active:scale-95 disabled:opacity-50 mt-2"
            >
              {saving ? 'Guardando...' : 'GUARDAR Y ACTUALIZAR'}
            </button>
          </div>
        </div>

        {/* FULL WIDTH / ABAJO: PROVEEDORES */}
        <div className="lg:col-span-2 bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-white font-black text-sm uppercase italic flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400">local_shipping</span> Directorio de Proveedores
            </h3>
            
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm group-focus-within:text-purple-400 transition-colors">search</span>
              <input 
                type="text"
                placeholder="BUSCAR POR NOMBRE O NIT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/5 border border-white/10 pl-9 pr-4 py-2 rounded-xl text-[9px] font-bold text-white outline-none focus:border-purple-400/50 w-full md:w-64 transition-all uppercase"
              />
            </div>
          </div>

          <form onSubmit={agregarProveedor} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
            <input 
              placeholder="RAZÓN SOCIAL"
              className="bg-[#020617] border border-white/10 p-3 rounded-xl text-[10px] font-bold text-white outline-none focus:border-purple-400 uppercase"
              value={nuevoProveedor.nombre_proveedor}
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
            <input 
              placeholder="TELÉFONO"
              className="bg-[#020617] border border-white/10 p-3 rounded-xl text-[10px] font-bold text-white outline-none focus:border-purple-400 uppercase"
              value={nuevoProveedor.telefono}
              onChange={e => setNuevoProveedor({...nuevoProveedor, telefono: e.target.value})}
              required
            />
            <select 
              className="bg-[#020617] border border-white/10 p-3 rounded-xl text-[10px] font-bold text-white outline-none focus:border-purple-400 uppercase"
              value={nuevoProveedor.categoria_servicio}
              onChange={e => setNuevoProveedor({...nuevoProveedor, categoria_servicio: e.target.value})}
              required
            >
              <option value="">CATEGORÍA</option>
              {CATEGORIAS_FINANZAS.EGRESO.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <button type="submit" className="sm:col-span-4 bg-purple-500 text-white p-3 rounded-xl text-[9px] font-black uppercase hover:bg-purple-400 transition-all shadow-lg shadow-purple-500/20">
              REGISTRAR EN DIRECTORIO
            </button>
          </form>

          {/* LISTA FILTRADA */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {proveedoresFiltrados.length > 0 ? (
              proveedoresFiltrados.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 group hover:border-purple-500/30 transition-all animate-in fade-in duration-300">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase italic">{p.nombre_proveedor}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{p.nit_cc} • {p.telefono}</span>
                    <span className="text-[8px] text-purple-400 font-black uppercase mt-1 px-2 py-0.5 bg-purple-500/10 rounded-full w-fit">
                      {p.categoria_servicio}
                    </span>
                  </div>
                  <button onClick={() => eliminarProveedor(p.id, p.nombre_proveedor)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full py-10 text-center border border-dashed border-white/10 rounded-2xl">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">No se encontraron proveedores</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};