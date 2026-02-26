import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CATEGORIAS_FINANZAS } from '../constants/data';

// Importación de subcomponentes
import FinanceDashboard from '../components/FinanceDashboard';
import FinanceTable from '../components/FinanceTable';
import ModalNuevoPago from '../components/ModalNuevoPago';

const PagosModule = ({ user }: { user: any }) => {
  const [datos, setDatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [pagoAEditar, setPagoAEditar] = useState<any | null>(null);
  const [toasts, setToasts] = useState<any[]>([]);

  const [filtros, setFiltros] = useState({
    busqueda: '',
    fechaEspecifica: '',
    mes: null,
    anio: new Date().getFullYear(),
    categoria: null as string | null,
    estado: null as string | null,
    metodo: null as string | null,
    tipo: null as string | null
  });

  const userRol = user?.rol || user?.user_metadata?.rol;

  const mostrarToast = useCallback((mensaje: string, tipo: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // --- CARGA DE DATOS ACTUALIZADA ---
  const cargarCaja = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pagos')
        .select(`
          *, 
          usuarios (
            id, numero_documento, primer_nombre, segundo_nombre, 
            primer_apellido, segundo_apellido, rol
          ),
          proveedores (
            id, nombre_proveedor, nit_cc
          )
        `); // <-- Se agregó la relación con proveedores

      if (userRol === 'ALUMNO' || userRol === 'ENTRENADOR') {
        query = query.eq('usuario_id', user.id);
      }

      const { data, error } = await query.order('fecha_pago', { ascending: false });
      if (error) throw error;
      if (data) setDatos(data);
    } catch (error) {
      mostrarToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, userRol, mostrarToast]);

  useEffect(() => {
    cargarCaja();
  }, [cargarCaja]);

  // --- LÓGICA DE FILTRADO MAESTRA ACTUALIZADA ---
  const datosFiltrados = useMemo(() => {
    return datos.filter(d => {
      const fechaObj = new Date(d.fecha_pago);
      const m = fechaObj.getUTCMonth() + 1;
      const a = fechaObj.getUTCFullYear();
      const fechaISO = d.fecha_pago.split('T')[0];

      const coincideFecha = !filtros.fechaEspecifica || fechaISO === filtros.fechaEspecifica;
      const coincideMes = filtros.fechaEspecifica ? true : (filtros.mes === null || m === filtros.mes);
      const coincideAnio = filtros.fechaEspecifica ? true : (filtros.anio === null || a === filtros.anio);
      const coincideCat = !filtros.categoria || d.categoria === filtros.categoria;
      const coincideEstado = !filtros.estado || d.estado_pago === filtros.estado;
      const coincideMetodo = !filtros.metodo || d.metodo_pago === filtros.metodo;
      
      const esIngreso = CATEGORIAS_FINANZAS.INGRESO.includes(d.categoria);
      const tipoReal = esIngreso ? 'INGRESO' : 'EGRESO';
      const coincideTipo = !filtros.tipo || tipoReal === filtros.tipo;

      const term = filtros.busqueda.toLowerCase().trim();
      
      // Lógica para detectar nombre ya sea Usuario o Proveedor
      const u = d.usuarios;
      const p = d.proveedores;
      
      const nombreUsuario = u ? [u.primer_nombre, u.segundo_nombre, u.primer_apellido, u.segundo_apellido].filter(Boolean).join(' ') : '';
      const nombreProveedor = p ? p.nombre_proveedor : '';
      
      const docUsuario = u?.numero_documento || '';
      const nitProveedor = p?.nit_cc || '';

      const coincideBusqueda = !term || 
        nombreUsuario.toLowerCase().includes(term) || 
        nombreProveedor.toLowerCase().includes(term) ||
        docUsuario.toLowerCase().includes(term) ||
        nitProveedor.toLowerCase().includes(term) ||
        (d.concepto || '').toLowerCase().includes(term);

      return coincideFecha && coincideMes && coincideAnio && coincideCat && coincideEstado && coincideMetodo && coincideTipo && coincideBusqueda;
    });
  }, [datos, filtros]);

  const handleAbrirEdicion = (movimiento: any) => {
    setPagoAEditar(movimiento);
    setMostrarModal(true);
  };

  const handleCerrarModal = () => {
    setMostrarModal(false);
    setPagoAEditar(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-[#020617] min-h-screen text-white relative">
      
      {/* TOASTS */}
      <div className="fixed top-4 right-4 left-4 md:left-auto md:top-6 md:right-6 z-[100] space-y-3">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border shadow-2xl animate-in slide-in-from-right duration-300 ${t.tipo === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
            <span className="material-symbols-outlined text-sm md:text-base">{t.tipo === 'success' ? 'check_circle' : 'error'}</span>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{t.mensaje}</span>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter text-primary uppercase">PAGOS</h1>
          <p className="text-slate-500 text-[8px] md:text-[10px] font-bold tracking-[0.3em] uppercase">Gestión de flujos y estados</p>
        </div>
        
        {['SUPER_ADMIN', 'ADMINISTRATIVO', 'DIRECTOR'].includes(userRol) && (
          <button 
            onClick={() => { setPagoAEditar(null); setMostrarModal(true); }} 
            className="w-full sm:w-auto bg-primary text-black px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex justify-center items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm md:text-base">add_circle</span> Nuevo Movimiento
          </button>
        )}
      </div>

      <FinanceDashboard datos={datosFiltrados} userRol={userRol} busqueda={filtros.busqueda} />

      <FinanceTable 
        datosOriginales={datos}
        datosFiltrados={datosFiltrados} 
        filtros={filtros}
        setFiltros={setFiltros}
        userRol={userRol} 
        onUpdate={cargarCaja} 
        onEdit={handleAbrirEdicion}
        mostrarToast={mostrarToast}
      />

      <ModalNuevoPago 
        isOpen={mostrarModal} 
        onClose={handleCerrarModal} 
        onSuccess={cargarCaja}
        editData={pagoAEditar}
      />

      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110]">
          <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default PagosModule;