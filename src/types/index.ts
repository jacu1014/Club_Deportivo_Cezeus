// src/types/index.ts

export enum RolUsuario {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  ENTRENADOR = 'ENTRENADOR',
  DIRECTOR = 'DIRECTOR',
  ALUMNO = 'ALUMNO'
}

export enum PaginasApp {
  DASHBOARD = 'dashboard',
  ALUMNOS = 'alumnos',
  EVALUACION = 'evaluacion',
  PAGOS = 'pagos',
  CALENDARIO = 'calendar_today',
  NOTIFICACIONES = 'notifications_active',
  CONFIGURACION = 'settings',
  NOSOTROS = 'info'
}

// Interfaces para TypeScript
export interface Usuario {
  id: string;
  rol: RolUsuario;
  email: string;
  primer_nombre: string;
  primer_apellido: string;
  foto_url?: string;
  fecha_inscripcion?: string;
}

// Alias para que el Sidebar no de error
export interface User extends Usuario {}
export type AppPages = PaginasApp;

// Configuración de permisos: Qué ve cada quién
export const ROLE_PERMISSIONS: Record<string, PaginasApp[]> = {
  // Permisos Totales
  [RolUsuario.SUPER_ADMIN]: Object.values(PaginasApp),
  [RolUsuario.DIRECTOR]: Object.values(PaginasApp),
  [RolUsuario.ADMINISTRATIVO]: Object.values(PaginasApp),

  // Permisos Limitados para Entrenador
  [RolUsuario.ENTRENADOR]: [
    PaginasApp.DASHBOARD, 
    PaginasApp.ALUMNOS, 
    PaginasApp.EVALUACION,
    PaginasApp.PAGOS, // <-- AHORA INCLUIDO PARA VER MOVIMIENTOS PROPIOS
    PaginasApp.CALENDARIO,
    PaginasApp.CONFIGURACION,
    PaginasApp.NOSOTROS
  ],

  // Permisos Mínimos para Alumno
  [RolUsuario.ALUMNO]: [
    PaginasApp.DASHBOARD,
    PaginasApp.ALUMNOS,
    PaginasApp.PAGOS, // <-- AHORA INCLUIDO PARA VER PAGOS PERSONALES
    PaginasApp.CALENDARIO,
    PaginasApp.CONFIGURACION,
    PaginasApp.NOSOTROS
  ]
};