import React, { useState } from 'react';
import { Usuario, RolUsuario } from '../../types';
import { generarReporteCEZEUS } from '../../services/reportePDFService';
// IMPORTACIÓN DEL COMPONENTE DE CARNET
import VistaCarnet from '../VistaCarnet'; 

interface StaffSectionProps {
  staff: Usuario[]; 
  loading: boolean;
  onEdit: (user: Usuario) => void;
  onDelete: (id: string, nombre: string) => void;
  onResetPass: (email: string) => void;
  onRefresh: () => void;
  onAdd: () => void;
  currentUserRole?: RolUsuario | string;
}

export const StaffSection: React.FC<StaffSectionProps> = ({ 
  staff, 
  loading, 
  onEdit, 
  onDelete, 
  onResetPass,
  onRefresh,
  onAdd,
  currentUserRole 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [rolFiltro, setRolFiltro] = useState<string>('TODOS');
  
  // ESTADO PARA CONTROLAR EL CARNET SELECCIONADO
  const [selectedStaffForCard, setSelectedStaffForCard] = useState<Usuario | null>(null);

  // Filtrado de staff con validación de nulidad
  const staffFiltrado = (staff || []).filter(u => {
    const term = searchTerm.toLowerCase();
    const nombreCompleto = `${u.primer_nombre || ''} ${u.segundo_nombre || ''} ${u.primer_apellido || ''} ${u.segundo_apellido || ''}`.toLowerCase();
    const matchesSearch = nombreCompleto.includes(term) || u.numero_documento?.includes(term) || u.email?.toLowerCase().includes(term);
    const matchesRol = rolFiltro === 'TODOS' || u.rol === rolFiltro;
    return matchesSearch && matchesRol && u.rol !== RolUsuario.ALUMNO;
  });

  const obtenerConteoRol = (rol: string) => {
    const staffSinAlumnos = (staff || []).filter(u => u.rol !== RolUsuario.ALUMNO);
    if (rol === 'TODOS') return staffSinAlumnos.length;
    return staffSinAlumnos.filter(u => u.rol === rol).length;
  };

  const handleExportarPDF = () => {
    const columnasStaff = [
      { header: 'DOCUMENTO', dataKey: 'doc' },
      { header: 'NOMBRE COMPLETO', dataKey: 'nombre' },
      { header: 'ROL', dataKey: 'rol' },
      { header: 'CONTACTO', dataKey: 'tel' },
      { header: 'EMAIL', dataKey: 'email' },
      { header: 'EPS', dataKey: 'eps' },
      { header: 'RH', dataKey: 'rh' },
      { header: 'ESTADO', dataKey: 'estado' }
    ];

    const datosMapeados = staffFiltrado.map(u => ({
      doc: `${u.tipo_documento || 'CC'}: ${u.numero_documento}`,
      nombre: `${u.primer_nombre} ${u.segundo_nombre || ''} ${u.primer_apellido} ${u.segundo_apellido || ''}`.trim().toUpperCase(),
      rol: (u.rol || '').replace('_', ' '),
      tel: u.telefono || 'N/A', 
      email: u.email || 'N/A',
      eps: u.eps || 'POR ASIGNAR',
      rh: `${u.grupo_sanguineo || ''}${u.factor_rh || ''}` || 'N/A',
      estado: (u.estado || 'INACTIVO').toUpperCase()
    }));

    generarReporteCEZEUS("Listado Oficial de Personal Staff", datosMapeados, columnasStaff);
  };

  const rolesFiltro = ['TODOS', RolUsuario.SUPER_ADMIN, RolUsuario.DIRECTOR, RolUsuario.ADMINISTRATIVO, RolUsuario.ENTRENADOR];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* MODAL OVERLAY PARA EL CARNET */}
      {selectedStaffForCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative max-w-sm w-full animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedStaffForCard(null)}
              className="absolute -top-12 right-0 flex items-center gap-2 text-white/60 hover:text-primary transition-colors font-black text-[10px] uppercase tracking-widest"
            >
              Cerrar Vista <span className="material-symbols-outlined">close</span>
            </button>
            {/* Se envía el objeto como 'alumno' para que VistaCarnet lo procese correctamente */}
            <VistaCarnet alumno={selectedStaffForCard} />
          </div>
        </div>
      )}

      <div className="flex flex-row justify-end items-center gap-4">
        <button 
          onClick={handleExportarPDF}
          disabled={staffFiltrado.length === 0 || loading}
          className="flex items-center gap-3 px-6 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
          Exportar Personal (.PDF)
        </button>
      </div>

      <div className="relative group">
        <input 
          type="text" 
          placeholder="BUSCAR POR NOMBRE, DOCUMENTO O CORREO..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0a0f18]/60 border border-white/5 rounded-2xl py-5 px-6 text-[11px] font-black text-white uppercase tracking-widest outline-none focus:ring-1 focus:ring-primary/40 transition-all shadow-2xl backdrop-blur-md"
        />
        <button 
          onClick={onRefresh} 
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary p-2 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">refresh</span>
        </button>
      </div>

      {/* CÁPSULAS DE FILTRO */}
      <div className="flex flex-wrap gap-3">
        {rolesFiltro.map((rol) => {
          const cantidad = obtenerConteoRol(rol);
          return (
            <button
              key={rol}
              onClick={() => setRolFiltro(rol)}
              className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-3 ${
                rolFiltro === rol 
                  ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              {rol.replace('_', ' ')}
              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black ${
                rolFiltro === rol ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-500'
              }`}>
                {cantidad}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-[#0a0f18]/40 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-6 text-[10px] font-black text-primary uppercase tracking-widest italic">Integrante Staff</th>
                <th className="px-8 py-6 text-[10px] font-black text-primary uppercase tracking-widest italic">Rol & Documento</th>
                <th className="px-8 py-6 text-[10px] font-black text-primary uppercase tracking-widest italic">Salud (EPS/RH)</th>
                <th className="px-8 py-6 text-[10px] font-black text-primary uppercase tracking-widest italic text-center">Estado</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-primary uppercase tracking-widest italic">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-24 text-center text-[10px] font-black text-slate-500 uppercase animate-pulse">Sincronizando...</td></tr>
              ) : staffFiltrado.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-12 text-center text-[10px] font-bold text-slate-600 uppercase">No se encontró personal</td></tr>
              ) : staffFiltrado.map((u) => {
                const esActivo = u.estado?.toLowerCase() === 'activo';

                return (
                  <tr key={u.id} className="group hover:bg-white/[0.02] transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-inner group-hover:border-primary/30 transition-colors">
                          {u.foto_url ? (
                            <img 
                              src={u.foto_url} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => { 
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${u.primer_nombre}+${u.primer_apellido}&background=0D1117&color=fff`;
                              }}
                            />
                          ) : (
                            <span className="material-symbols-outlined text-slate-600 text-[24px]">person</span>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[13px] font-black text-white uppercase italic mb-0.5 group-hover:text-primary transition-colors">
                            {u.primer_apellido} {u.segundo_apellido || ''}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            {u.primer_nombre} {u.segundo_nombre || ''}
                          </span>
                          <span className="text-[9px] font-black text-primary/60 mt-1 uppercase tracking-tighter">
                            {u.telefono || 'Sin registrar'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="px-3 py-1.5 w-fit rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[9px] font-black uppercase">
                          {u.rol?.replace('_', ' ')}
                        </span>
                        <span className="text-[9px] font-bold text-slate-600 ml-1">
                          {u.tipo_documento}: {u.numero_documento}
                        </span>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                          {u.eps || 'POR ASIGNAR'}
                        </span>
                        <span className="text-[9px] font-black text-rose-500/80 uppercase">
                          RH: {u.grupo_sanguineo || '?'}{u.factor_rh || ''}
                        </span>
                      </div>
                    </td>

                    <td className="px-8 py-6 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase ${
                        esActivo ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        {u.estado || 'Desconocido'}
                      </div>
                    </td>

                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        
                        <button 
                          onClick={() => setSelectedStaffForCard(u)} 
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-white/5 text-slate-400 hover:text-emerald-500 transition-all"
                          title="Visualizar Carnet"
                        >
                          <span className="material-symbols-outlined text-[20px]">badge</span>
                        </button>

                        {currentUserRole === RolUsuario.SUPER_ADMIN && (
                          <>
                            <button onClick={() => onResetPass(u.email)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-white/5 text-slate-400 hover:text-amber-500 transition-all">
                              <span className="material-symbols-outlined text-[20px]">key</span>
                            </button>
                            <button onClick={() => onDelete(u.id, u.primer_nombre)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-white/5 text-slate-400 hover:text-red-500 transition-all">
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </>
                        )}
                        <button onClick={() => onEdit(u)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-white/5 text-slate-400 hover:text-primary transition-all">
                          <span className="material-symbols-outlined text-[20px]">edit_note</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};