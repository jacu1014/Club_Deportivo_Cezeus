import { defineConfig } from 'vite';
import react   from '@vitejs/plugin-react';
import sitemap from 'vite-plugin-sitemap';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    sitemap({
      hostname: 'https://www.clubdeportivocezeus.com',
      // Rutas públicas de la landing (las del app quedan excluidas porque requieren login)
      dynamicRoutes: [
        '/',
        '/#historia',
        '/#categorias',
        '/#galeria',
        '/#programa',
        '/#valores',
        '/#contacto',
      ],
      // Prioridad y frecuencia de actualización para Google
      changefreq: 'weekly',
      priority:   0.8,
      lastmod:    new Date().toISOString().split('T')[0],
    }),
  ],
});