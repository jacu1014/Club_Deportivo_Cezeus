import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CATEGORIAS_FINANZAS, METODOS_PAGO, OPCIONES_ESTADO_PAGO } from '../constants/data';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any; // Añadido para soportar edición
}

const ModalNuevoPago = ({ isOpen, onClose, onSuccess, editData }: Props) => {
  const [loading, setLoading] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<any[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null);

  const initialFormState = {
    monto: '',
    categoria: '',
    concepto: '',
    metodo_pago: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    estado_pago: 'PENDIENTE'
  };

  const [formData, setFormData] = useState(initialFormState);

  // --- LÓGICA DE CARGA Y LIMPIEZA ---
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        // Si estamos editando, precargamos los datos
        setFormData({
          monto: editData.monto.toString(),
          categoria: editData.categoria,
          concepto: editData.concepto,
          metodo_pago: editData.metodo_pago,
          fecha_pago: editData.fecha_pago.split('T')[0],
          estado_pago: editData.estado_pago
        });
        setUsuarioSeleccionado(editData.usuarios);
      } else {
        // Si es nuevo, reseteamos
        setFormData(initialFormState);
        setUsuarioSeleccionado(null);
      }
    } else {
      setBusquedaUsuario('');
      setUsuariosFiltrados([]);
    }
  }, [isOpen, editData]);

  // --- BUSCADOR DE USUARIOS ---
  useEffect(() => {
    const buscarUsuarios = async () => {
      if (busquedaUsuario.length < 2) {
        setUsuariosFiltrados([]);
        return;
      }
      
      const { data } = await supabase
        .from('usuarios')
        .select('id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, numero_documento')
        .or(`primer_nombre.ilike.%${busquedaUsuario}%,segundo_nombre.ilike.%${busquedaUsuario}%,primer_apellido.ilike.%${busquedaUsuario}%,segundo_apellido.ilike.%${busquedaUsuario}%,numero_documento.ilike.%${busquedaUsuario}%`)
        .limit(5);
        
      setUsuariosFiltrados(data || []);
    };
    
    const timer = setTimeout(buscarUsuarios, 300);
    return () => clearTimeout(timer);
  }, [busquedaUsuario]);

  // --- PROCESO DE BASE DE DATOS (ACTUALIZADO) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioSeleccionado) return alert("Debes seleccionar un usuario");

    setLoading(true);
    
    const payload = {
      usuario_id: usuarioSeleccionado.id,
      monto: parseFloat(formData.monto),
      categoria: formData.categoria,
      concepto: formData.concepto,
      metodo_pago: formData.metodo_pago,
      fecha_pago: formData.fecha_pago,
      estado_pago: formData.estado_pago 
    };

    try {
      let result;
      
      if (editData) {
        // ACTUALIZAR REGISTRO EXISTENTE
        result = await supabase
          .from('pagos')
          .update(payload)
          .eq('id', editData.id);
      } else {
        // INSERTAR NUEVO REGISTRO
        result = await supabase
          .from('pagos')
          .insert([payload]);
      }

      if (result.error) throw result.error;

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error Supabase:", error);
      alert("Error al procesar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0a0f18] border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black italic text-primary uppercase tracking-tighter">
              {editData ? 'Editar Movimiento' : 'Nuevo Movimiento'}
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Buscador de Usuario */}
            <div className="relative">
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-2">Asignar Usuario</label>
              {usuarioSeleccionado ? (
                <div className="flex justify-between items-center bg-primary/10 border border-primary/30 p-4 rounded-2xl">
                  <span className="text-sm font-bold text-primary uppercase">
                    {usuarioSeleccionado.primer_nombre} {usuarioSeleccionado.primer_apellido}
                  </span>
                  <button type="button" onClick={() => setUsuarioSeleccionado(null)} className="text-primary hover:scale-110">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="BUSCAR POR NOMBRE O DOCUMENTO..."
                  className="w-full bg-[#020617] border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-primary uppercase"
                  value={busquedaUsuario}
                  onChange={(e) => setBusquedaUsuario(e.target.value)}
                />
              )}
              
              {usuariosFiltrados.length > 0 && !usuarioSeleccionado && (
                <div className="absolute z-10 w-full mt-2 bg-[#161b26] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                  {usuariosFiltrados.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setUsuarioSeleccionado(u)}
                      className="w-full p-4 text-left hover:bg-primary hover:text-black transition-colors border-b border-white/5 last:border-0"
                    >
                      <p className="text-xs font-black uppercase">
                        {u.primer_nombre} {u.segundo_nombre || ''} {u.primer_apellido} {u.segundo_apellido || ''}
                      </p>
                      <p className="text-[9px] opacity-70">DOC: {u.numero_documento}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-2">Monto ($)</label>
                <input
                  type="number"
                  required
                  className="w-full bg-[#020617] border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-primary"
                  value={formData.monto}
                  onChange={(e) => setFormData({...formData, monto: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-2">Fecha</label>
                <input
                  type="date"
                  required
                  className="w-full bg-[#020617] border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-primary"
                  value={formData.fecha_pago}
                  onChange={(e) => setFormData({...formData, fecha_pago: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-2">Categoría</label>
                <select
                  required
                  className="w-full bg-[#020617] border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-primary uppercase cursor-pointer"
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                >
                  <option value="">Seleccionar...</option>
                  <optgroup label="INGRESOS">
                    {CATEGORIAS_FINANZAS.INGRESO.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                  <optgroup label="EGRESOS">
                    {CATEGORIAS_FINANZAS.EGRESO.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-2">Medio de Pago</label>
                <select
                  required
                  className="w-full bg-[#020617] border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-primary uppercase cursor-pointer"
                  value={formData.metodo_pago}
                  onChange={(e) => setFormData({...formData, metodo_pago: e.target.value})}
                >
                  <option value="">Seleccionar...</option>
                  {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-2">Concepto / Detalle</label>
              <textarea
                required
                rows={2}
                className="w-full bg-[#020617] border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-primary uppercase resize-none"
                value={formData.concepto}
                onChange={(e) => setFormData({...formData, concepto: e.target.value})}
              ></textarea>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-2">Estado del Movimiento</label>
              <div className="flex gap-2">
                {OPCIONES_ESTADO_PAGO.map((estado) => (
                  <button
                    key={estado}
                    type="button"
                    onClick={() => setFormData({ ...formData, estado_pago: estado })}
                    className={`flex-1 p-3 rounded-xl text-[10px] font-black transition-all border ${
                      formData.estado_pago === estado
                        ? 'bg-primary border-primary text-black'
                        : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'
                    }`}
                  >
                    {estado}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-black uppercase tracking-widest p-5 rounded-2xl mt-4 hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {loading ? 'PROCESANDO...' : editData ? 'ACTUALIZAR MOVIMIENTO' : 'REGISTRAR MOVIMIENTO'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalNuevoPago;