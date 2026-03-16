import React, { useState, useEffect } from 'react';
import { User, Usuario } from '../types';
import { supabase } from '../lib/supabaseClient';
import { adminAction } from '../lib/supabaseAdmin'; // CORREGIDO: ruta correcta
import { registrarLog } from '../lib/activity';
// --- COMPONENTES ---
import { PerfilSection } from '../components/Configuracion/PerfilSection';
import { StaffSection } from '../components/Configuracion/StaffSection';
import { ClubSection } from '../components/Configuracion/ClubSection';
import { SeguridadSection } from '../components/Configuracion/SeguridadSection';
import { ActividadSection } from '../components/Configuracion/ActividadSection';
import { TabButton } from '../components/Configuracion/ConfigUI';
import { ModalUsuario } from '../components/Configuracion/ModalUsuario';

interface ConfiguracionProps {
  user: User | null;
}

const Configuracion: React.FC<ConfiguracionProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'perfil' | 'club' | 'staff' | 'seguridad' | 'actividad'>('perfil');
  const [staff, setStaff] = useState<Usuario[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);

  const currentRole = user?.rol || '';
  const canManageClub = ['SUPER_ADMIN', 'DIRECTOR'].includes(currentRole);
  const canSeeStaff = ['SUPER_ADMIN', 'ADMINISTRATIVO', 'DIRECTOR'].includes(currentRole);
  const canSeeActivity = ['SUPER_ADMIN', 'DIRECTOR'].includes(currentRole);

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, rol, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, email, telefono, foto_url, estado, tipo_documento, numero_documento, fecha_nacimiento, genero, direccion, eps, grupo_sanguineo, factor_rh, categoria')
        .order('primer_nombre', { ascending: true });
      if (error) throw error;
      setStaff(data || []);
    } catch (err: any) {
      console.error("Error al cargar staff:", err.message);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    if ((activeTab === 'staff' && canSeeStaff) || (activeTab === 'club' && canManageClub)) {
      fetchStaff();
    }
  }, [activeTab, canSeeStaff, canManageClub]);

  const handleOpenModal = (usuario?: Usuario) => {
    setUsuarioSeleccionado(usuario || null);
    setIsModalOpen(true);
  };

  const handleRefreshStaff = () => {
    fetchStaff();
    setIsModalOpen(false);
    setUsuarioSeleccionado(null);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de eliminar permanentemente a ${nombre}?`)) {
      try {
        setLoadingStaff(true);

        // CORREGIDO: eliminar auth via Edge Function
        await adminAction('eliminar-usuario', { userId: id });

        // Eliminar de la tabla usuarios
        const { error: dbErr } = await supabase.from('usuarios').delete().eq('id', id);
        if (dbErr) throw dbErr;

        // NUEVO: registrar log de eliminación
        await registrarLog({
          accion: 'ELIMINAR_USUARIO',
          modulo: 'NOMINA',
          descripcion: `Usuario eliminado: ${nombre}`,
          detalles: { id_eliminado: id }
        });

        alert("Usuario eliminado correctamente.");
        fetchStaff();
      } catch (err: any) {
        alert("Error al eliminar: " + err.message);
      } finally {
        setLoadingStaff(false);
      }
    }
  };

  const handleResetPass = async (email: string) => {
    if (window.confirm(`¿Enviar enlace de recuperación a: ${email}?`)) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        alert("Se ha enviado un correo con las instrucciones.");
      } catch (err: any) {
        alert("Error al enviar correo: " + err.message);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4">
      <div className="text-center lg:text-left space-y-2">
        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
          Panel de <span className="text-primary">Configuración</span>
        </h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">
          Gestión de personal y sistema
        </p>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-white/5 pb-4">
        <TabButton active={activeTab === 'perfil'} onClick={() => setActiveTab('perfil')} icon="person" label="Mi Perfil" />
        {canSeeStaff && (
          <TabButton active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} icon="badge" label="Personal" />
        )}
        {canManageClub && (
          <TabButton active={activeTab === 'club'} onClick={() => setActiveTab('club')} icon="stadium" label="Gestión Club" />
        )}
        {canSeeActivity && (
          <TabButton active={activeTab === 'actividad'} onClick={() => setActiveTab('actividad')} icon="history" label="Actividad" />
        )}
        <TabButton active={activeTab === 'seguridad'} onClick={() => setActiveTab('seguridad')} icon="lock" label="Seguridad" />
      </div>

      <div className="grid grid-cols-1 gap-8 pt-4">
        {activeTab === 'perfil' && <PerfilSection user={user} />}
        {activeTab === 'staff' && canSeeStaff && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button 
                onClick={() => handleOpenModal()}
                className="bg-primary hover:bg-white text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                Nuevo Staff
              </button>
            </div>
            <StaffSection 
              staff={staff.filter(u => u.rol !== 'ALUMNO')} 
              loading={loadingStaff} 
              currentUserRole={currentRole} 
              onEdit={handleOpenModal}
              onDelete={handleDelete}
              onResetPass={handleResetPass}
              onRefresh={fetchStaff}
              onAdd={() => handleOpenModal()}
            />
          </div>
        )}
        {activeTab === 'club' && canManageClub && (
          <ClubSection staff={staff} />
        )}
        {activeTab === 'actividad' && canSeeActivity && (
          <ActividadSection />
        )}
        {activeTab === 'seguridad' && <SeguridadSection />}
      </div>

      <ModalUsuario 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setUsuarioSeleccionado(null);
        }}
        onSave={handleRefreshStaff}
        usuarioAEditar={usuarioSeleccionado}
      />
    </div>
  );
};

export default Configuracion;