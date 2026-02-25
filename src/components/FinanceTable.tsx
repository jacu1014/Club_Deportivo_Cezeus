// src/components/FinanceTable.tsx
import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CATEGORIAS_FINANZAS, METODOS_PAGO } from '../constants/data';
import * as XLSX from 'xlsx';

interface Props {
  datosOriginales: any[];
  datosFiltrados: any[];
  filtros: any;
  setFiltros: (f: any) => void;
  userRol: string;
  onUpdate: () => void;
  onEdit: (movimiento: any) => void;
  mostrarToast: (msj: string, tipo?: 'success' | 'error') => void;
}

const FinanceTable = ({ 
  datosOriginales, 
  datosFiltrados, 
  filtros, 
  setFiltros, 
  userRol, 
  onUpdate, 
  onEdit, 
  mostrarToast 
}: Props) => {
  
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // --- ACCIONES ---
  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from('pagos')
        .update({ estado_pago: nuevoEstado })
        .eq('id', id);

      if (error) throw error;
      mostrarToast(`Estado actualizado a ${nuevoEstado}`, 'success');
      onUpdate();
    } catch (error: any) {
      mostrarToast('Error al actualizar el estado', 'error');
    }
  };

  const handleEliminar = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este registro permanentemente?")) return;
    setIsDeleting(id);
    try {
      const { data, error } = await supabase
        .from('pagos')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        mostrarToast("No tienes permisos suficientes o el registro no existe", 'error');
      } else {
        mostrarToast("Registro eliminado correctamente", 'success');
        onUpdate();
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      mostrarToast("Error al eliminar el registro", 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  const exportarExcel = () => {
    const dataParaExcel = datosFiltrados.map(m => ({
      FECHA: m.fecha_pago.split('T')[0],
      USUARIO: `${m.usuarios?.primer_nombre || ''} ${m.usuarios?.primer_apellido || ''}`.toUpperCase(),
      DOCUMENTO: m.usuarios?.numero_documento || 'N/A',
      CONCEPTO: (m.concepto || '').toUpperCase(),
      CATEGORIA: m.categoria.toUpperCase(),
      FLUJO: CATEGORIAS_FINANZAS.INGRESO.includes(m.categoria) ? 'INGRESO' : 'EGRESO',
      MONTO: Number(m.monto),
      METODO: m.metodo_pago.toUpperCase(),
      ESTADO: m.estado_pago.toUpperCase()
    }));

    const ws = XLSX.utils.json_to_sheet(dataParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
    XLSX.writeFile(wb, `REPORTE_FINANZAS_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const opcionesDeAnios = useMemo(() => {
    const anios = datosOriginales.map(d => new Date(d.fecha_pago).getUTCFullYear());
    return Array.from(new Set(anios)).filter(a => !isNaN(a)).sort((a, b) => b - a);
  }, [datosOriginales]);

  const updateFiltro = (campo: string, valor: any) => {
    setFiltros((prev: any) => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      fechaEspecifica: '',
      mes: null,
      anio: null,
      categoria: null,
      estado: null,
      metodo: null,
      tipo: null
    });
  };

  // Verificación de roles para filtros administrativos
  const esAdmin = ['ADMINISTRATIVO', 'DIRECTOR', 'SUPER_ADMIN'].includes(userRol);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end px-2">
        <h2 className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">Historial Transaccional</h2>
        <button onClick={exportarExcel} className="flex items-center gap-2 text-[10px] font-black text-primary hover:scale-105 transition-all uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm">download</span> Exportar Excel
        </button>
      </div>

      <div className="bg-[#0a0f18] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 space-y-4 bg-white/[0.01]">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px] relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
              <input 
                type="text" placeholder="BUSCAR POR NOMBRE, DOCUMENTO O CONCEPTO..." 
                value={filtros.busqueda}
                onChange={(e) => updateFiltro('busqueda', e.target.value)}
                className="w-full bg-[#020617] border border-white/10 pl-12 pr-4 py-3 rounded-xl text-[10px] font-black text-white outline-none focus:border-primary uppercase transition-all"
              />
            </div>
            <div className="flex items-center bg-[#020617] border border-white/10 rounded-xl px-3">
              <span className="material-symbols-outlined text-slate-500 text-sm mr-2">calendar_today</span>
              <input 
                type="date" 
                value={filtros.fechaEspecifica} 
                onChange={(e) => updateFiltro('fechaEspecifica', e.target.value)} 
                className="bg-transparent py-3 text-[10px] font-black text-primary outline-none uppercase cursor-pointer" 
              />
            </div>
            <button 
              onClick={limpiarFiltros} 
              className="bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-rose-500/20 hover:text-rose-500 text-slate-400 transition-all"
            >
              <span className="material-symbols-outlined text-sm">filter_alt_off</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Filtros básicos para todos */}
            <select value={filtros.mes || ""} onChange={(e) => updateFiltro('mes', e.target.value ? Number(e.target.value) : null)} className="bg-[#020617] border border-white/10 px-4 py-2 rounded-lg text-[9px] font-black text-primary outline-none uppercase">
              <option value="">Mes (Todos)</option>
              {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{new Intl.DateTimeFormat('es', { month: 'long' }).format(new Date(2026, i)).toUpperCase()}</option>)}
            </select>
            <select value={filtros.anio || ""} onChange={(e) => updateFiltro('anio', e.target.value ? Number(e.target.value) : null)} className="bg-[#020617] border border-white/10 px-4 py-2 rounded-lg text-[9px] font-black text-primary outline-none">
              <option value="">Año</option>
              {opcionesDeAnios.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            
            <select value={filtros.metodo || ""} onChange={(e) => updateFiltro('metodo', e.target.value || null)} className="bg-[#020617] border border-white/10 px-4 py-2 rounded-lg text-[9px] font-black text-primary outline-none uppercase cursor-pointer">
               <option value="">Medio de Pago</option>
               {METODOS_PAGO.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
            </select>

            {/* Filtros Administrativos (Solo Super Admin, Admin, Director) */}
            {esAdmin && (
              <>
                <select value={filtros.categoria || ""} onChange={(e) => updateFiltro('categoria', e.target.value || null)} className="bg-[#020617] border border-white/10 px-4 py-2 rounded-lg text-[9px] font-black text-primary outline-none uppercase cursor-pointer">
                   <option value="">Categoría</option>
                   {Object.values(CATEGORIAS_FINANZAS).flat().map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                </select>
                <select value={filtros.tipo || ""} onChange={(e) => updateFiltro('tipo', e.target.value || null)} className="bg-[#020617] border border-white/10 px-4 py-2 rounded-lg text-[9px] font-black text-primary outline-none">
                  <option value="">Flujo (Ambos)</option>
                  <option value="INGRESO">SÓLO INGRESOS</option>
                  <option value="EGRESO">SÓLO EGRESOS</option>
                </select>

                {/* NUEVO: Filtro por Estado (Visible para todos) */}
                <select value={filtros.estado || ""} onChange={(e) => updateFiltro('estado', e.target.value || null)} className="bg-[#020617] border border-white/10 px-4 py-2 rounded-lg text-[9px] font-black text-emerald-400 outline-none uppercase cursor-pointer">
                  <option value="">Estado de Pago</option>
                  <option value="PAGADO">PAGADO</option>
                  <option value="PENDIENTE">PENDIENTE</option>
                </select>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* ... Resto de la tabla (thead y tbody) se mantiene igual ... */}
          <table className="w-full text-left text-[11px]">
            <thead className="bg-white/5 text-slate-500 font-black uppercase tracking-widest">
              <tr>
                <th className="p-5">Fecha</th>
                <th className="p-5">Usuario / Documento</th>
                <th className="p-5 text-center">Categoría</th>
                <th className="p-5 text-center">Método</th>
                <th className="p-5 text-right">Monto</th>
                <th className="p-5 text-center">Estado</th>
                <th className="p-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {datosFiltrados.length > 0 ? datosFiltrados.map(m => {
                const esIngreso = CATEGORIAS_FINANZAS.INGRESO.includes(m.categoria);
                const colorEstado = m.estado_pago === 'PAGADO' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                const puedeEditar = ['ADMINISTRATIVO', 'DIRECTOR', 'SUPER_ADMIN'].includes(userRol);

                return (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-all group">
                    <td className="p-5">
                      <p className="text-slate-400 font-bold">{new Date(m.fecha_pago).toLocaleDateString('es-CO')}</p>
                    </td>
                    <td className="p-5">
                      <p className="font-bold text-white uppercase leading-tight">
                        {m.usuarios?.primer_nombre} {m.usuarios?.primer_apellido}
                      </p>
                      <p className="text-primary font-black text-[8px]">DOC: {m.usuarios?.numero_documento}</p>
                      <p className="text-slate-500 italic text-[9px] truncate max-w-[150px]">{m.concepto}</p>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-[8px] uppercase ${esIngreso ? 'bg-cyan-500/10 text-cyan-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                        {m.categoria}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <span className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">{m.metodo_pago}</span>
                    </td>
                    <td className={`p-5 text-right font-black text-sm ${esIngreso ? 'text-cyan-400' : 'text-indigo-400'}`}>
                      {esIngreso ? '+' : '-'}${Number(m.monto).toLocaleString('es-CO')}
                    </td>
                    <td className="p-5 text-center">
                      {puedeEditar ? (
                        <select 
                          value={m.estado_pago} 
                          onChange={(e) => handleCambiarEstado(m.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-full font-black text-[8px] uppercase border outline-none cursor-pointer transition-all ${colorEstado} appearance-none text-center`}
                        >
                          <option value="PAGADO" className="bg-[#020617]">PAGADO</option>
                          <option value="PENDIENTE" className="bg-[#020617]">PENDIENTE</option>
                        </select>
                      ) : (
                        <span className={`px-4 py-1.5 rounded-full font-black text-[8px] uppercase border ${colorEstado}`}>
                          {m.estado_pago}
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {puedeEditar && (
                          <button 
                            onClick={() => onEdit(m)}
                            className="p-1.5 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                            title="Editar registro"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                        )}
                        {userRol === 'SUPER_ADMIN' && (
                          <button 
                            onClick={() => handleEliminar(m.id)}
                            disabled={isDeleting === m.id}
                            className="p-1.5 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors"
                            title="Eliminar registro"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {isDeleting === m.id ? 'hourglass_empty' : 'delete'}
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="p-20 text-center text-slate-600 uppercase font-black tracking-[0.5em] text-[10px]">
                    No se encontraron movimientos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceTable;