// src/constants/messages.ts

export const BIRTHDAY_MESSAGES = {
  PERSONAL: {
    TITLE: "¡Feliz Cumpleaños!",
    BODY: "te deseamos un día extraordinario. ¡A darlo todo hoy!",
    ICON: "cake",
    COLOR_ICON: "text-cyan-400"
  },
  CLUB: {
    TITLE: "Cumpleaños en el Club",
    SUBTITLE: "Hoy celebramos a:",
    FOOTER: "¡Salúdalo en el campo!",
    ICON: "celebration",
    COLOR_ICON: "text-pink-500",
    // Roles que pueden ver los cumpleaños de los demás
    VISIBLE_FOR_ROLES: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'DIRECTOR', 'ALUMNO','ENTRENADOR']
  }
};

export const ROLE_ANNOUNCEMENTS: Record<string, { title: string; message: string; icon: string; show: boolean }> = {
  ALUMNO: {
    title: "Panel del Jugador",
    message: "Bienvenido a tu portal. Aquí podrás ver tus entrenamientos y progreso deportivo.",
    icon: "sports_soccer",
    show: false
  },
  DIRECTOR: {
    title: "Gestión Directiva",
    message: "Panel de control activo. Recuerda revisar las novedades del personal hoy.",
    icon: "analytics",
    show: false
  },
  ADMINISTRATIVO: {
    title: "Portal Administrativo",
    message: "Gestión de usuarios y pagos activa. Revisa la bandeja de entrada para pendientes.",
    icon: "admin_panel_settings",
    show: false
  },
   ENTRENADOR: {
    title: "Panel del Entrenador",
    message: "Bienvenido a tu portal. Aquí podrás ver tus entrenamientos y progreso deportivo.",
    icon: "sports_soccer",
    show: false
  }

};