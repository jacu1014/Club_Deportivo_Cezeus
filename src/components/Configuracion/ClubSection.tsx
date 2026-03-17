// src/components/Configuracion/ClubSection.tsx
//
// CAMBIOS v2:
//  1. Props: se agrega `user` (Usuario) para leer el rol y condicionar la galería.
//  2. `fetchData` envuelto en useCallback para eliminarlo como dependencia del useEffect.
//  3. alert() reemplazado por un sistema de toast interno (sin librerías externas).
//  4. Los inputs del form de proveedores se refactorizan con un helper para evitar repetición.
//  5. Se agrega <GaleriaManager> al final, visible solo para SUPER_ADMIN, ADMINISTRATIVO y DIRECTOR.
//  6. GaleriaManager permite subir, activar/ocultar y eliminar fotos de la tabla `galeria_publica`.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ConfigInput } from './ConfigUI';
import { Usuario, RolUsuario } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { CATEGORIAS_FINANZAS } from '../../constants/data';
import { registrarLog } from '../../lib/activity';

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface ClubSectionProps {
  staff?: Usuario[];
  user?: Usuario; // necesario para condicionar la sección de galería
}

interface ToastState {
  msg: string;
  tipo: 'ok' | 'error';
}

// ─── Roles con acceso a galería ───────────────────────────────────────────────
const ROLES_GALERIA: string[] = ['SUPER_ADMIN', 'ADMINISTRATIVO', 'DIRECTOR'];

// ─── Componente principal ────────────────────────────────────────────────────
export const ClubSection: React.FC<ClubSectionProps> = ({ staff = [], user }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState<ToastState | null>(null);

  const [tarifas, setTarifas]         = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm]   = useState('');
  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombre_proveedor: '',
    nit_cc: '',
    telefono: '',
    categoria_servicio: '',
  });

  // ── Toast helper ────────────────────────────────────────────────────────────
  const mostrarToast = (msg: string, tipo: 'ok' | 'error' = 'ok') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch data ───────────────────────────────────────────────────────────────
  // useCallback para que pueda usarse como dependencia estable en useEffect
  // y también llamarse manualmente tras agregar un proveedor.
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resConfig, resProv] = await Promise.all([
        supabase
          .from('configuraciones_club')
          .select('id, nombre_tarifa, categoria_asociada, valor, descripcion, ultima_actualizacion')
          .order('nombre_tarifa', { ascending: true }),
        supabase
          .from('proveedores')
          .select('id, nombre_proveedor, nit_cc, telefono, categoria_servicio, created_at')
          .order('created_at', { ascending: false }),
      ]);
      if (resConfig.data) setTarifas(resConfig.data);
      if (resProv.data)   setProveedores(resProv.data);
    } catch (error) {
      console.error('Error cargando datos del club:', error);
    } finally {
      setLoading(false);
    }
  }, []); // sin dependencias: solo usa supabase y setters estables

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Tarifas ──────────────────────────────────────────────────────────────────
  const handleUpdateTarifa = (id: string, nuevoValor: number) =>
    setTarifas(prev => prev.map(t => (t.id === id ? { ...t, valor: nuevoValor } : t)));

  const handleGuardarTarifas = async () => {
    try {
      setSaving(true);
      await Promise.all(
        tarifas.map(t =>
          supabase.from('configuraciones_club').update({ valor: t.valor }).eq('id', t.id)
        )
      );
      await registrarLog({
        accion: 'ACTUALIZACION_TARIFAS',
        descripcion: 'Se actualizaron los valores de las tarifas globales del club',
        modulo: 'CONFIGURACION',
        detalles: { tarifas_actualizadas: tarifas.map(t => ({ nombre: t.nombre_tarifa, valor: t.valor })) },
      });
      mostrarToast('Tarifas actualizadas correctamente.');
    } catch (error: any) {
      mostrarToast('Error al guardar: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Proveedores ──────────────────────────────────────────────────────────────
  const agregarProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    const nitNorm = nuevoProveedor.nit_cc.trim().toLowerCase();
    if (proveedores.some(p => p.nit_cc.trim().toLowerCase() === nitNorm)) {
      mostrarToast(`El NIT/CC "${nuevoProveedor.nit_cc}" ya existe.`, 'error');
      return;
    }
    try {
      setSaving(true);
      const { error } = await supabase.from('proveedores').insert([{
        ...nuevoProveedor,
        nombre_proveedor: nuevoProveedor.nombre_proveedor.toUpperCase(),
        nit_cc:   nuevoProveedor.nit_cc.trim(),
        telefono: nuevoProveedor.telefono.trim(),
      }]);
      if (error) throw error;
      await registrarLog({
        accion: 'REGISTRO_PROVEEDOR',
        descripcion: `Se registró al proveedor: ${nuevoProveedor.nombre_proveedor.toUpperCase()}`,
        modulo: 'DIRECTORIO',
        detalles: { nit: nuevoProveedor.nit_cc, categoria: nuevoProveedor.categoria_servicio },
      });
      setNuevoProveedor({ nombre_proveedor: '', nit_cc: '', telefono: '', categoria_servicio: '' });
      fetchData();
      mostrarToast('Proveedor registrado correctamente.');
    } catch (error: any) {
      mostrarToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const eliminarProveedor = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar a ${nombre}?`)) return;
    try {
      const { error } = await supabase.from('proveedores').delete().eq('id', id);
      if (error) throw error;
      await registrarLog({
        accion: 'ELIMINACION_PROVEEDOR',
        descripcion: `Se eliminó al proveedor: ${nombre}`,
        modulo: 'DIRECTORIO',
        detalles: { id_eliminado: id },
      });
      setProveedores(prev => prev.filter(p => p.id !== id));
      mostrarToast('Proveedor eliminado.');
    } catch (error: any) {
      mostrarToast(error.message, 'error');
    }
  };

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  const proveedoresFiltrados = proveedores.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      p.nombre_proveedor.toLowerCase().includes(q) ||
      p.nit_cc.includes(q) ||
      p.categoria_servicio.toLowerCase().includes(q)
    );
  });

  // ── Cálculos ─────────────────────────────────────────────────────────────────
  const alumnos = staff.filter(u => u.rol === RolUsuario.ALUMNO);

  const categoriasVisuales = [
    { nombre: 'Iniciación', rango: '5-7 años',   count: alumnos.filter(a => a.categoria?.toLowerCase().includes('iniciación')).length },
    { nombre: 'Infantil',   rango: '8-10 años',  count: alumnos.filter(a => a.categoria?.toLowerCase().includes('infantil')).length },
    { nombre: 'Transición', rango: '11-13 años', count: alumnos.filter(a => a.categoria?.toLowerCase().includes('transición')).length },
  ];

  const valMensualidad = tarifas.find(t => t.categoria_asociada === 'Mensualidad' && t.nombre_tarifa === 'Mensualidad Base Full')?.valor ?? 0;
  const valCanchas     = tarifas.find(t => t.nombre_tarifa.toLowerCase().includes('cancha'))?.valor ?? 0;

  const puedeGestionarGaleria = Boolean(user?.rol && ROLES_GALERIA.includes(user.rol));

  // ── Render de carga ───────────────────────────────────────────────────────────
  if (loading) return (
    <div className="py-20 text-center text-primary animate-pulse font-black uppercase text-[10px] tracking-[0.5em]">
      Sincronizando...
    </div>
  );

  // ── Render principal ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10 relative">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest
                         shadow-xl transition-all animate-in slide-in-from-bottom-2 duration-300
                         ${toast.tipo === 'ok'
                           ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                           : 'bg-rose-500/20 border border-rose-500/30 text-rose-400'}`}>
          {toast.tipo === 'ok' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      {/* ── Métricas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard color="emerald" label="Recaudo Proyectado" value={`$${(alumnos.length * valMensualidad).toLocaleString()}`} />
        <MetricCard color="primary" label="Total Alumnos"      value={`${alumnos.length} Atletas`} />
        <MetricCard color="blue"    label="Gasto Cancha Semanal" value={`$${valCanchas.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Categorías ── */}
        <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] p-6 space-y-4">
          <SectionHeader icon="category" color="text-primary" title="Estructura de Categorías" />
          <div className="space-y-3">
            {categoriasVisuales.map(cat => (
              <div key={cat.nombre} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs text-white font-black uppercase italic">{cat.nombre}</span>
                  <span className="text-[9px] text-primary font-bold tracking-widest">{cat.rango}</span>
                </div>
                <div className="text-white font-black text-sm italic">
                  {cat.count} <span className="text-[7px] text-slate-500 uppercase">Alumnos</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tarifas ── */}
        <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] p-6 space-y-6 shadow-xl">
          <SectionHeader icon="payments" color="text-primary" title="Tarifas Globales" />
          <div className="space-y-4">
            {tarifas.length > 0 ? tarifas.map(t => (
              <div key={t.id} className="relative group">
                <span className="absolute left-4 bottom-[13px] text-primary font-black text-[11px] z-20 pointer-events-none">$</span>
                <ConfigInput
                  label={t.nombre_tarifa}
                  value={t.valor.toString()}
                  onChange={val => handleUpdateTarifa(t.id, Number(val))}
                  className="!pl-9"
                />
              </div>
            )) : (
              <p className="text-[10px] text-slate-500 uppercase font-black text-center py-4">No hay tarifas en DB</p>
            )}
            <button
              onClick={handleGuardarTarifas}
              disabled={saving}
              className="w-full bg-primary text-black py-4 rounded-xl text-[10px] font-black uppercase
                         hover:bg-white transition-all active:scale-95 disabled:opacity-50 mt-2"
            >
              {saving ? 'Guardando...' : 'GUARDAR Y ACTUALIZAR'}
            </button>
          </div>
        </div>

        {/* ── Proveedores ── */}
        <div className="lg:col-span-2 bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <SectionHeader icon="local_shipping" color="text-purple-400" title="Directorio de Proveedores" />
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm
                               group-focus-within:text-purple-400 transition-colors">
                search
              </span>
              <input
                type="text"
                placeholder="BUSCAR POR NOMBRE O NIT..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-white/5 border border-white/10 pl-9 pr-4 py-2 rounded-xl text-[9px] font-bold
                           text-white outline-none focus:border-purple-400/50 w-full md:w-64 transition-all uppercase"
              />
            </div>
          </div>

          {/* Formulario nuevo proveedor */}
          <form
            onSubmit={agregarProveedor}
            className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white/5 p-4 rounded-2xl border border-white/5"
          >
            {[
              { ph: 'RAZÓN SOCIAL', key: 'nombre_proveedor' },
              { ph: 'NIT / CC',     key: 'nit_cc' },
              { ph: 'TELÉFONO',     key: 'telefono' },
            ].map(f => (
              <input
                key={f.key}
                placeholder={f.ph}
                required
                className="bg-[#020617] border border-white/10 p-3 rounded-xl text-[10px] font-bold
                           text-white outline-none focus:border-purple-400 uppercase"
                value={(nuevoProveedor as any)[f.key]}
                onChange={e => setNuevoProveedor({ ...nuevoProveedor, [f.key]: e.target.value })}
              />
            ))}
            <select
              required
              className="bg-[#020617] border border-white/10 p-3 rounded-xl text-[10px] font-bold
                         text-white outline-none focus:border-purple-400 uppercase"
              value={nuevoProveedor.categoria_servicio}
              onChange={e => setNuevoProveedor({ ...nuevoProveedor, categoria_servicio: e.target.value })}
            >
              <option value="">CATEGORÍA</option>
              {CATEGORIAS_FINANZAS.EGRESO.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={saving}
              className="sm:col-span-4 bg-purple-500 text-white p-3 rounded-xl text-[9px] font-black uppercase
                         hover:bg-purple-400 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
            >
              REGISTRAR EN DIRECTORIO
            </button>
          </form>

          {/* Lista de proveedores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {proveedoresFiltrados.length > 0 ? (
              proveedoresFiltrados.map(p => (
                <div
                  key={p.id}
                  className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5
                             group hover:border-purple-500/30 transition-all"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase italic">{p.nombre_proveedor}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{p.nit_cc} • {p.telefono}</span>
                    <span className="text-[8px] text-purple-400 font-black uppercase mt-1 px-2 py-0.5 bg-purple-500/10 rounded-full w-fit">
                      {p.categoria_servicio}
                    </span>
                  </div>
                  <button
                    onClick={() => eliminarProveedor(p.id, p.nombre_proveedor)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full py-10 text-center border border-dashed border-white/10 rounded-2xl">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">
                  No se encontraron proveedores
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Galería pública — solo para roles autorizados ── */}
        {puedeGestionarGaleria && (
          <div className="lg:col-span-2">
            <GaleriaManager />
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  Sub-componentes de UI reutilizables en este archivo
// ═══════════════════════════════════════════════════════════════

/** Tarjeta de métrica en la parte superior */
const MetricCard: React.FC<{ color: string; label: string; value: string }> = ({ color, label, value }) => {
  const styles: Record<string, string> = {
    emerald: 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500',
    primary: 'bg-primary/5 border-primary/10 text-primary',
    blue:    'bg-blue-500/5 border-blue-500/10 text-blue-500',
  };
  return (
    <div className={`border p-5 rounded-[2rem] ${styles[color] ?? styles.primary}`}>
      <span className="text-[9px] font-black uppercase tracking-widest block mb-1">{label}</span>
      <div className="text-2xl font-black text-white italic">{value}</div>
    </div>
  );
};

/** Encabezado de sección con icono de Material Symbols */
const SectionHeader: React.FC<{ icon: string; color: string; title: string }> = ({ icon, color, title }) => (
  <h3 className="text-white font-black text-sm uppercase italic flex items-center gap-2">
    <span className={`material-symbols-outlined ${color}`}>{icon}</span>
    {title}
  </h3>
);

// ═══════════════════════════════════════════════════════════════
//  GaleriaManager
//  Gestiona la tabla `galeria_publica` en Supabase.
//  Requiere:
//    - Tabla: galeria_publica (id, url, descripcion, orden, activa)
//    - Storage bucket: "galeria" (público)
//    - Políticas RLS configuradas (ver supabase_galeria.sql)
// ═══════════════════════════════════════════════════════════════
const GaleriaManager: React.FC = () => {
  const [fotos, setFotos]          = useState<any[]>([]);
  const [loadingFotos, setLoading] = useState(true);
  const [uploading, setUploading]  = useState(false);
  const [desc, setDesc]            = useState('');
  const [toast, setToast]          = useState<ToastState | null>(null);
  const fileRef                    = useRef<HTMLInputElement>(null);

  const mostrarToast = (msg: string, tipo: 'ok' | 'error' = 'ok') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const cargarFotos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('galeria_publica')
      .select('id, url, descripcion, orden, activa')
      .order('orden', { ascending: true });
    setFotos(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { cargarFotos(); }, [cargarFotos]);

  // Subir imagen al bucket y registrar en BD
  const handleSubir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext      = file.name.split('.').pop();
      const fileName = `foto_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('galeria')
        .upload(fileName, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('galeria').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('galeria_publica').insert([{
        url:         urlData.publicUrl,
        descripcion: desc.trim() || `Foto ${fotos.length + 1}`,
        orden:       fotos.length + 1,
        activa:      true,
      }]);
      if (dbError) throw dbError;

      await registrarLog({
        accion: 'GALERIA_SUBIR_FOTO',
        descripcion: `Se subió una foto a la galería pública: ${fileName}`,
        modulo: 'CONFIGURACION',
      });

      setDesc('');
      if (fileRef.current) fileRef.current.value = '';
      cargarFotos();
      mostrarToast('Foto subida correctamente.');
    } catch (err: any) {
      mostrarToast('Error al subir: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Activar / ocultar foto en la landing
  const toggleActiva = async (id: string, activa: boolean) => {
    const { error } = await supabase.from('galeria_publica').update({ activa: !activa }).eq('id', id);
    if (error) { mostrarToast('Error al actualizar.', 'error'); return; }
    setFotos(prev => prev.map(f => f.id === id ? { ...f, activa: !activa } : f));
  };

  // Eliminar foto del storage y de la BD
  const eliminarFoto = async (foto: any) => {
    if (!window.confirm('¿Eliminar esta foto de la galería?')) return;
    try {
      const parts    = foto.url.split('/');
      const fileName = parts[parts.length - 1];
      await supabase.storage.from('galeria').remove([fileName]);
      const { error } = await supabase.from('galeria_publica').delete().eq('id', foto.id);
      if (error) throw error;
      await registrarLog({
        accion: 'GALERIA_ELIMINAR_FOTO',
        descripcion: `Se eliminó la foto: ${fileName}`,
        modulo: 'CONFIGURACION',
      });
      setFotos(prev => prev.filter(f => f.id !== foto.id));
      mostrarToast('Foto eliminada.');
    } catch (err: any) {
      mostrarToast('Error al eliminar: ' + err.message, 'error');
    }
  };

  return (
    <div className="bg-[#0a0f18]/60 border border-white/10 rounded-[2.5rem] p-6 space-y-6 relative">

      {/* Toast local de galería */}
      {toast && (
        <div className={`absolute bottom-4 right-4 z-10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest
                         ${toast.tipo === 'ok'
                           ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                           : 'bg-rose-500/20 border border-rose-500/30 text-rose-400'}`}>
          {toast.tipo === 'ok' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <SectionHeader icon="photo_library" color="text-primary" title="Galería Pública · Landing Page" />
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-3 py-1 rounded-full">
          {fotos.filter(f => f.activa).length} activas · {fotos.length} total
        </span>
      </div>

      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
        Las fotos <span className="text-primary">activas</span> se muestran en la landing pública.
        La primera foto activa es la imagen principal del hero.
      </p>

      {/* Formulario de subida */}
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Subir nueva foto</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="DESCRIPCIÓN (opcional)"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="flex-1 bg-[#020617] border border-white/10 p-3 rounded-xl text-[10px] font-bold
                       text-white outline-none focus:border-primary uppercase"
          />
          <label className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black
                             uppercase tracking-widest cursor-pointer transition-all
                             ${uploading
                               ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                               : 'bg-primary text-[#05080d] hover:bg-[#0AB5B5]'}`}>
            <span className="material-symbols-outlined text-base">upload</span>
            {uploading ? 'Subiendo...' : 'Seleccionar foto'}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={handleSubir}
            />
          </label>
        </div>
        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
          Formatos: JPG, PNG, WebP · Resolución recomendada: 1200 × 800 px o mayor
        </p>
      </div>

      {/* Grid de fotos */}
      {loadingFotos ? (
        <div className="py-10 text-center text-primary animate-pulse text-[10px] font-black uppercase tracking-widest">
          Cargando galería...
        </div>
      ) : fotos.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-white/10 rounded-2xl">
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">
            No hay fotos aún. Sube la primera imagen.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {fotos.map((foto, i) => (
            <div
              key={foto.id}
              className={`relative group rounded-2xl overflow-hidden border-2 transition-all
                          ${foto.activa ? 'border-primary/30' : 'border-white/5 opacity-50'}`}
            >
              <img
                src={foto.url}
                alt={foto.descripcion}
                className="w-full aspect-square object-cover"
                loading="lazy"
              />

              {/* Badge orden */}
              <span className="absolute top-2 left-2 bg-[#05080d]/80 text-primary text-[9px] font-black
                               uppercase tracking-widest px-2 py-0.5 rounded-full">
                #{i + 1}
              </span>

              {/* Badge estado */}
              <span className={`absolute top-2 right-2 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full
                                ${foto.activa ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                {foto.activa ? 'Activa' : 'Oculta'}
              </span>

              {/* Descripción */}
              {foto.descripcion && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-[9px] font-bold uppercase tracking-widest truncate">{foto.descripcion}</p>
                </div>
              )}

              {/* Acciones al hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity
                              flex items-center justify-center gap-3">
                <button
                  onClick={() => toggleActiva(foto.id, foto.activa)}
                  title={foto.activa ? 'Ocultar de la landing' : 'Mostrar en la landing'}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors
                               ${foto.activa
                                 ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40'
                                 : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40'}`}
                >
                  <span className="material-symbols-outlined text-base">
                    {foto.activa ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
                <button
                  onClick={() => eliminarFoto(foto)}
                  title="Eliminar foto"
                  className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/40
                             flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};