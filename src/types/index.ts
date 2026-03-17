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
  // FIX: AVANCES y EVALUACION apuntan al mismo valor 'avances'
  // El Sidebar usa PaginasApp.AVANCES → path '/avances'
  // App.jsx registra la ruta como path="/avances"
  // Ambos enums son iguales para no romper código existente
  AVANCES        = 'avances',
  EVALUACION     = 'avances',
  PAGOS          = 'pagos',
  CALENDARIO     = 'calendar_today',
  NOTIFICACIONES = 'notifications_active',
  CONFIGURACION  = 'settings',
  NOSOTROS       = 'info'
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface Usuario {
  id:                          string;
  rol:                         RolUsuario;
  email:                       string;
  primer_nombre:               string;
  segundo_nombre?:             string;
  primer_apellido:             string;
  segundo_apellido?:           string;
  foto_url?:                   string;
  telefono?:                   string;
  estado?:                     string;
  categoria?:                  string;
  acepta_terminos?:            boolean;
  fecha_nacimiento?:           string;
  fecha_inscripcion?:          string;
  tipo_documento?:             string;
  numero_documento?:           string;
  genero?:                     string;
  direccion?:                  string;
  eps?:                        string;
  grupo_sanguineo?:            string;
  factor_rh?:                  string;
  condiciones_medicas?:        string;
  acudiente_primer_nombre?:    string;
  acudiente_segundo_nombre?:   string;
  acudiente_primer_apellido?:  string;
  acudiente_segundo_apellido?: string;
  acudiente_parentesco?:       string;
  acudiente_telefono?:         string;
}

// Alias para compatibilidad con componentes que usan User
export interface User extends Usuario {}
export type AppPages = PaginasApp;

// ─── Permisos por rol ─────────────────────────────────────────────────────────
// FIX: listas explícitas en lugar de Object.values(PaginasApp)
// Object.values() sobre enums con alias duplicados puede dar resultados impredecibles
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