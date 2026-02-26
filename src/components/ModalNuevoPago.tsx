import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CATEGORIAS_FINANZAS, METODOS_PAGO } from '../constants/data';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}

const ModalNuevoPago = ({ isOpen, onClose, onSuccess, editData }: Props) => {
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [resultadosFiltrados, setResultadosFiltrados] = useState<any[]>([]);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState<any>(null);
  
  // --- ESTADO PARA TARIFAS DINÁMICAS ---
  const [tarifasGlobales, setTarifasGlobales] = useState<any[]>([]);

  const initialFormState = {
    monto: '',
    categoria: '',
    concepto: '',
    metodo_pago: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    estado_pago: 'PENDIENTE'
  };

  const [formData, setFormData] = useState(initialFormState);

  // --- 1. CARGAR CONFIGURACIONES DEL CLUB ---
  useEffect(() => {
    const fetchConfiguraciones = async () => {
      try {
        const { data, error } = await supabase
          .from('configuraciones_club')
          .select('*');
        
        if (error) throw error;
        setTarifasGlobales(data || []);
      } catch (err) {
        console.error("Error cargando tarifas:", err);
      }
    };

    if (isOpen) fetchConfiguraciones();
  }, [isOpen]);

  // --- 2. LÓGICA DE DETECCIÓN DE TARIFAS (INTELIGENCIA DE DATOS) ---
  // Se dispara cuando cambia la categoría
  useEffect(() => {
    if (!formData.categoria || editData) return; // No auto-llenar si estamos editando (respetar valor guardado)

    const tarifaEncontrada = tarifasGlobales.find(
      t => t.categoria_asociada?.toUpperCase() === formData.categoria.toUpperCase()
    );

    if (tarifaEncontrada) {
      setFormData(prev => ({
        ...prev,
        monto: tarifaEncontrada.valor.toString(),
        concepto: tarifaEncontrada.nombre_tarifa // Sugerir el nombre de la tarifa como concepto
      }));
    }
  }, [formData.categoria, tarifasGlobales, editData]);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          monto: editData.monto.toString(),
          categoria: editData.categoria,
          concepto: editData.concepto || '',
          metodo_pago: editData.metodo_pago,
          fecha_pago: editData.fecha_pago.split('T')[0],
          estado_pago: editData.estado_pago
        });
        setEntidadSeleccionada(editData.usuarios ? { ...editData.usuarios, tipo: 'ALUMNO', nombreMostrar: `${editData.usuarios.primer_nombre} ${editData.usuarios.primer_apellido}` } : { ...editData.proveedores, tipo: 'PROVEEDOR', nombreMostrar: editData.proveedores?.nombre_proveedor });
      } else {
        setFormData(initialFormState);
        setEntidadSeleccionada(null);
      }
    } else {
      setBusqueda('');
      setResultadosFiltrados([]);
    }
  }, [isOpen, editData]);

  // --- BUSCADOR UNIFICADO ---
  useEffect(() => {
    const buscarEntidades = async () => {
      if (busqueda.length < 2) {
        setResultadosFiltrados([]);
        return;
      }
      
      const promiseUsuarios = supabase
        .from('usuarios')
        .select('id, primer_nombre, primer_apellido, numero_documento')
        .or(`primer_nombre.ilike.%${busqueda}%,primer_apellido.ilike.%${busqueda}%,numero_documento.ilike.%${busqueda}%`)
        .limit(3);

      const promiseProveedores = supabase
        .from('proveedores')
        .select('id, nombre_proveedor, nit_cc')
        .ilike('nombre_proveedor', `%${busqueda}%`)
        .limit(3);

      const [resUsr, resProv] = await Promise.all([promiseUsuarios, promiseProveedores]);

      const unificados = [
        ...(resUsr.data?.map(u => ({ ...u, nombreMostrar: `${u.primer_nombre} ${u.primer_apellido}`, sub: u.numero_documento, tipo: 'ALUMNO' })) || []),
        ...(resProv.data?.map(p => ({ ...p, nombreMostrar: p.nombre_proveedor, sub: p.nit_cc, tipo: 'PROVEEDOR' })) || [])
      ];
      
      setResultadosFiltrados(unificados);
    };
    
    const timer = setTimeout(buscarEntidades, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entidadSeleccionada) return alert("Debes seleccionar un beneficiario/pagador");
    
    const montoNumerico = parseFloat(formData.monto);
    if (isNaN(montoNumerico) || montoNumerico <= 0) return alert("Monto inválido");

    setLoading(true);
    
    const payload: any = {
      monto: montoNumerico,
      categoria: formData.categoria,
      concepto: formData.concepto,
      metodo_pago: formData.metodo_pago,
      fecha_pago: formData.fecha_pago,
      estado_pago: formData.estado_pago,
      usuario_id: entidadSeleccionada.tipo === 'ALUMNO' ? entidadSeleccionada.id : null,
      proveedor_id: entidadSeleccionada.tipo === 'PROVEEDOR' ? entidadSeleccionada.id : null
    };

    try {
      let result;
      if (editData) {
        result = await supabase.from('pagos').update(payload).eq('id', editData.id);
      } else {
        result = await supabase.from('pagos').insert([payload]);
      }

      if (result.error) throw result.error;
      onSuccess();
      onClose();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[#0a0f18] border border-white/10 w-full max-w-lg rounded-t-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
                <h2 className="text-xl sm:text-2xl font-black italic text-cyan-400 uppercase tracking-tighter">
                {editData ? 'Editar Movimiento' : 'Nuevo Movimiento'}
                </h2>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Módulo de Gestión Financiera</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Buscador Dinámico */}
            <div className="relative">
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-2">Asignar a (Alumno o Proveedor)</label>
              {entidadSeleccionada ? (
                <div className={`flex justify-between items-center border p-4 rounded-2xl animate-in fade-in zoom-in duration-300 ${entidadSeleccionada.tipo === 'ALUMNO' ? 'bg-cyan-400/10 border-cyan-400/30' : 'bg-purple-400/10 border-purple-400/30'}`}>
                  <div>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full mb-1 block w-fit ${entidadSeleccionada.tipo === 'ALUMNO' ? 'bg-cyan-400 text-black' : 'bg-purple-400 text-white'}`}>
                      {entidadSeleccionada.tipo}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                      {entidadSeleccionada.nombreMostrar}
                    </span>
                  </div>
                  <button type="button" onClick={() => setEntidadSeleccionada(null)} className="text-slate-400 hover:text-white p-2 bg-white/5 rounded-full transition-all">
                    <span className="material-symbols-outlined text-sm">edit_off</span>
                  </button>
                </div>
              ) : (
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">person_search</span>
                    <input
                        type="text"
                        placeholder="BUSCAR POR NOMBRE O DOCUMENTO..."
                        className="w-full bg-[#020617] border border-white/10 p-4 pl-12 rounded-2xl text-[11px] font-bold text-white outline-none focus:border-cyan-400 uppercase transition-all"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
              )}
              
              {resultadosFiltrados.length > 0 && !entidadSeleccionada && (
                <div className="absolute z-20 w-full mt-2 bg-[#161b26] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-top-2">
                  {resultadosFiltrados.map(ent => (
                    <button
                      key={ent.id}
                      type="button"
                      onClick={() => setEntidadSeleccionada(ent)}
                      className="w-full p-4 text-left hover:bg-cyan-400/10 transition-colors border-b border-white/5 last:border-0 flex justify-between items-center group"
                    >
                      <div>
                        <p className="text-[10px] font-black uppercase text-white group-hover:text-cyan-400 transition-colors">{ent.nombreMostrar}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-tighter">{ent.tipo} — {ent.sub}</p>
                      </div>
                      <span className={`material-symbols-outlined text-lg ${ent.tipo === 'ALUMNO' ? 'text-cyan-400' : 'text-purple-400'}`}>
                        {ent.tipo === 'ALUMNO' ? 'person' : 'local_shipping'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-2">Categoría del Movimiento</label>
                    <select
                        required
                        className="w-full bg-[#020617] border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-cyan-400 uppercase cursor-pointer"
                        value={formData.categoria}
                        onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    >
                        <option value="">Seleccionar Categoría...</option>
                        <optgroup label="INGRESOS (ALUMNOS)" className="text-cyan-400 bg-[#0a0f18]">
                            {CATEGORIAS_FINANZAS.INGRESO.map(c => <option key={c} value={c} className="text-white">{c}</option>)}
                        </optgroup>
                        <optgroup label="EGRESOS (GASTOS/PROVEEDORES)" className="text-rose-400 bg-[#0a0f18]">
                            {CATEGORIAS_FINANZAS.EGRESO.map(c => <option key={c} value={c} className="text-white">{c}</option>)}
                        </optgroup>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-2">Fecha del Registro</label>
                    <input
                        type="date"
                        required
                        className="w-full bg-[#020617] border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-cyan-400 cursor-pointer"
                        value={formData.fecha_pago}
                        onChange={(e) => setFormData({...formData, fecha_pago: e.target.value})}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-2">Monto del Pago ($)</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 font-bold">$</span>
                    <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        className="w-full bg-[#020617] border border-white/10 p-4 pl-8 rounded-2xl text-xs font-black text-white outline-none focus:border-cyan-400"
                        value={formData.monto}
                        onChange={(e) => setFormData({...formData, monto: e.target.value})}
                    />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-2">Medio de Pago</label>
                <select
                  required
                  className="w-full bg-[#020617] border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-cyan-400 uppercase cursor-pointer"
                  value={formData.metodo_pago}
                  onChange={(e) => setFormData({...formData, metodo_pago: e.target.value})}
                >
                  <option value="">Seleccionar Medio...</option>
                  {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-2">Concepto Detallado</label>
                <input
                    type="text"
                    placeholder="EJ: PAGO MES DE MARZO / COMPRA DE MATERIALES..."
                    className="w-full bg-[#020617] border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-cyan-400 uppercase"
                    value={formData.concepto}
                    onChange={(e) => setFormData({...formData, concepto: e.target.value})}
                />
            </div>

            <div className="pt-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-cyan-400 text-black font-black uppercase tracking-[0.2em] p-5 rounded-2xl hover:bg-cyan-300 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-cyan-400/20 flex items-center justify-center gap-3"
                >
                    <span className="material-symbols-outlined text-xl">
                        {editData ? 'update' : 'account_balance_wallet'}
                    </span>
                    {loading ? 'PROCESANDO TRANSACCIÓN...' : editData ? 'ACTUALIZAR REGISTRO' : 'REGISTRAR MOVIMIENTO'}
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalNuevoPago;