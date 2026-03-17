// src/types/index.ts

export enum RolUsuario {
  SUPER_ADMIN    = 'SUPER_ADMIN',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  ENTRENADOR     = 'ENTRENADOR',
  DIRECTOR       = 'DIRECTOR',
  ALUMNO         = 'ALUMNO'
}

export enum PaginasApp {
  DASHBOARD      = 'dashboard',
  ALUMNOS        = 'alumnos',
  // FIX: se agrega EVALUACION como alias de AVANCES para mantener compatibilidad
  // con el Sidebar y App.jsx que lo usan indistintamente
  AVANCES        = 'avances',
  EVALUACION     = 'avances',   // ← mismo valor que AVANCES — resuelve la pérdida de permisos
  PAGOS          = 'pagos',
  CALENDARIO     = 'calendar_today',
  NOTIFICACIONES = 'notifications_active',
  CONFIGURACION  = 'settings',
  NOSOTROS       = 'info'
}

export interface Usuario {
  id:                         string;
  rol:                        RolUsuario;
  email:                      string;
  primer_nombre:              string;
  segundo_nombre?:            string;
  primer_apellido:            string;
  segundo_apellido?:          string;
  foto_url?:                  string;
  telefono?:                  string;
  estado?:                    string;
  categoria?:                 string;
  acepta_terminos?:           boolean;
  fecha_nacimiento?:          string;
  fecha_inscripcion?:         string;
  tipo_documento?:            string;
  numero_documento?:          string;
  genero?:                    string;
  direccion?:                 string;
  eps?:                       string;
  grupo_sanguineo?:           string;
  factor_rh?:                 string;
  condiciones_medicas?:       string;
  acudiente_primer_nombre?:   string;
  acudiente_segundo_nombre?:  string;
  acudiente_primer_apellido?: string;
  acudiente_segundo_apellido?:string;
  acudiente_parentesco?:      string;
  acudiente_telefono?:        string;
}

// Alias para compatibilidad con componentes que usan User
export interface User extends Usuario {}
export type AppPages = PaginasApp;

// ─── Permisos por rol ─────────────────────────────────────────────────────────
// IMPORTANTE: usar Object.values(PaginasApp) puede incluir duplicados (AVANCES y EVALUACION)
// esto no causa problema porque el array de permisos simplemente tendrá el valor dos veces
export const ROLE_PERMISSIONS: Record<string, PaginasApp[]> = {
  [RolUsuario.SUPER_ADMIN]: [
    PaginasApp.DASHBOARD,
    PaginasApp.ALUMNOS,
    PaginasApp.AVANCES,
    PaginasApp.PAGOS,
    PaginasApp.CALENDARIO,
    PaginasApp.NOTIFICACIONES,
    PaginasApp.CONFIGURACION,
    PaginasApp.NOSOTROS,
  ],
  [RolUsuario.DIRECTOR]: [
    PaginasApp.DASHBOARD,
    PaginasApp.ALUMNOS,
    PaginasApp.AVANCES,
    PaginasApp.PAGOS,
    PaginasApp.CALENDARIO,
    PaginasApp.NOTIFICACIONES,
    PaginasApp.CONFIGURACION,
    PaginasApp.NOSOTROS,
  ],
  [RolUsuario.ADMINISTRATIVO]: [
    PaginasApp.DASHBOARD,
    PaginasApp.ALUMNOS,
    PaginasApp.AVANCES,
    PaginasApp.PAGOS,
    PaginasApp.CALENDARIO,
    PaginasApp.NOTIFICACIONES,
    PaginasApp.CONFIGURACION,
    PaginasApp.NOSOTROS,
  ],
  [RolUsuario.ENTRENADOR]: [
    PaginasApp.DASHBOARD,
    PaginasApp.ALUMNOS,
    PaginasApp.AVANCES,
    PaginasApp.PAGOS,
    PaginasApp.CALENDARIO,
    PaginasApp.CONFIGURACION,
    PaginasApp.NOSOTROS,
  ],
  [RolUsuario.ALUMNO]: [
    PaginasApp.DASHBOARD,
    PaginasApp.ALUMNOS,
    PaginasApp.AVANCES,
    PaginasApp.PAGOS,
    PaginasApp.CALENDARIO,
    PaginasApp.CONFIGURACION,
    PaginasApp.NOSOTROS,
  ],
};