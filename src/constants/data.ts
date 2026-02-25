// src/constants/data.ts

export const EPS_COLOMBIA = [
  "Sura", "Sanitas", "Salud Total", "Nueva EPS", "Compensar", 
  "Coosalud", "Mutual Ser", "Famisanar", "Aliansalud", "Ecopetrol",
  "Capresoca", "Capital Salud", "Cajacopi", "Asmet Salud", "Emsanar",
  "Pijaos Salud", "Saviasalud", "Ferrocarriles Nacionales", "Especial"
].sort();

export const TIPOS_DOCUMENTO = [
  "Tarjeta de Identidad", 
  "Registro Civil", 
  "Cédula de Ciudadanía", 
  "Cédula de Extranjería", 
  "PEP"
];

export const GRUPOS_RH = ["O", "A", "B", "AB"];
export const FACTORES_RH = ["+", "-"];

export const PARENTESCOS = [
  "Padre", "Madre", "Tío", "Tía", 
  "Abuelo", "Abuela", "Hermano/a", 
  "Tutor Legal", "Conyugue", "Otro"
];

/* ============================================================
   CONSTANTES PARA EL MÓDULO DE PAGOS
   ============================================================ */

export const METODOS_PAGO = [
  "Transferencia Bancaria",
  "Efectivo",
  "Nequi",
  "Daviplata",
  "Tarjeta Crédito/Débito",
  "Otro"
];

export const OPCIONES_ESTADO_PAGO = [
  "PENDIENTE",
  "PAGADO"
];

export const ESTADOS_PAGO = [
  "Pendiente",
  "Completado",
  "Rechazado",
  "En Revisión"
];

// Centralizamos las categorías divididas por flujo
export const CATEGORIAS_FINANZAS = {
  INGRESO: [
    "Mensualidad",
    "Matrícula",
    "Uniforme",
    "Pago para Torneo",
    "Transporte",
    "Viáticos Alumno",
    "Donación",
    "Otro Ingreso"
  ],
  EGRESO: [
    "Pago Entrenador",
    "Pago Administrativo",
    "Alquiler de Canchas",
    "Implementos Deportivos",
    "Servicios Públicos",
    "Viáticos Staff",
    "Mantenimiento",
    "Otro Egreso"
  ]
};

/* ============================================================
   CONSTANTES PARA EL MÓDULO DE CALENDARIO
   ============================================================ */

export const CATEGORIAS_EVENTOS = [
  { id: 'ENTRENAMIENTO', label: 'Entrenamiento', color: '#2dd4bf', icono: 'exercise' },
  { id: 'PARTIDO', label: 'Partido Oficial', color: '#818cf8', icono: 'sports_soccer' },
  { id: 'CUMPLEAÑOS', label: 'Cumpleaños', color: '#fb7185', icono: 'cake' },
  { id: 'REUNION', label: 'Reunión de Padres', color: '#fbbf24', icono: 'groups' },
  { id: 'EVENTO_ESPECIAL', label: 'Evento Especial', color: '#a855f7', icono: 'star' }
];

// Para usar solo los IDs en validaciones o selects rápidos
export const TIPOS_EVENTO_IDS = CATEGORIAS_EVENTOS.map(cat => cat.id);

export const COLORES_CUMPLEANIOS = {
  T1: '#3b82f6', // Ene-Mar (Azul)
  T2: '#818cf8', // Abr-Jun (Indigo)
  T3: '#34d399', // Jul-Sep (Esmeralda)
  T4: '#fbbf24'  // Oct-Dic (Ámbar)
};

/**
 * LÓGICA DE CATEGORIZACIÓN AUTOMÁTICA DE ALUMNOS
 */
export const obtenerCategoriaPorFecha = (fechaISO: string): string => {
  if (!fechaISO) return 'Sin fecha';
  
  const fechaNac = new Date(fechaISO);
  fechaNac.setMinutes(fechaNac.getMinutes() + fechaNac.getTimezoneOffset());
  
  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const m = hoy.getMonth() - fechaNac.getMonth();
  
  if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }

  if (edad < 5) return 'Menor de 5 años';
  if (edad >= 5 && edad <= 7) return 'Iniciación (5-7 años)';
  if (edad >= 8 && edad <= 10) return 'Infantil (8-10 años)';
  if (edad >= 11 && edad <= 13) return 'Transición (11-13 años)';
  
  return 'Categoría Superior (14+)';
};