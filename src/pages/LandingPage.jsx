// src/pages/LandingPage.jsx
// SEO: el peso principal está en index.html (meta tags, schema.org).
// Este archivo aporta SEO semántico: H1 único, estructura landmark HTML5,
// aria-labels, y carga optimizada de recursos.

import React, { useEffect } from 'react';
import LandingNav        from '../components/Landing/LandingNav';
import HeroSection       from '../components/Landing/HeroSection';
import HistoriaSection   from '../components/Landing/HistoriaSection';
import CategoriasSection from '../components/Landing/CategoriasSection';
import MetodologiaSection from '../components/Landing/MetodologiaSection';
import GaleriaSection    from '../components/Landing/GaleriaSection';
import ProgramaSection   from '../components/Landing/ProgramaSection';
import ValoresSection    from '../components/Landing/ValoresSection';
import ContactoSection   from '../components/Landing/ContactoSection';
import LandingFooter     from '../components/Landing/LandingFooter';
import { useGaleria }    from '../hooks/useGaleria';

export default function LandingPage() {
  const { fotos, loading } = useGaleria();

  useEffect(() => {
    window.scrollTo({ top: 0 });

    // Actualizar el title según la sección visible (mejora CTR en Google)
    const titles = {
      hero:       'Club Deportivo Cezeus | Escuela de Fútbol para Niños en Bogotá',
      historia:   'Nuestra Historia | Club Deportivo Cezeus',
      categorias: 'Categorías por Edades | Club Deportivo Cezeus',
      metodologia: 'Metodología y Tecnología | Club Deportivo Cezeus',
      galeria:    'Galería | Club Deportivo Cezeus',
      programa:   'Horarios y Costos | Club Deportivo Cezeus',
      contacto:   'Inscríbete | Club Deportivo Cezeus',
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (titles[id]) document.title = titles[id];
          }
        });
      },
      { threshold: 0.4 }
    );

    Object.keys(titles).forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#05080d] text-slate-200 antialiased overflow-x-hidden">

      {/* Navegación — landmark <nav> interno en LandingNav */}
      <LandingNav />

      {/* MAIN — landmark principal, solo debe haber uno por página */}
      <main id="main-content">

        {/* H1 está dentro de HeroSection — único en la página */}
        <HeroSection fotos={fotos} />

        {/* H2: Nuestra Historia */}
        <HistoriaSection foto={fotos[2]?.url || null} />

        {/* H2: Categorías por Edad */}
        <CategoriasSection />
        {/* H2: Metodologia de trabajo */}
        <MetodologiaSection />

        {/* Galería — contenido visual */}
        <GaleriaSection fotos={fotos} loading={loading} />

        {/* H2: Horarios & Costos */}
        <ProgramaSection />

        {/* H2: Nuestros Valores */}
        <ValoresSection />

        {/* H2: Únete a Cezeus — formulario de contacto */}
        <ContactoSection />
      </main>

      {/* Footer — landmark <footer> interno en LandingFooter */}
      <LandingFooter />

      <ScrollTop />
    </div>
  );
}

// ─── Botón scroll-to-top ─────────────────────────────────────────────────────
function ScrollTop() {
  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  useEffect(() => {
    const btn = document.getElementById('_scrtop');
    const toggle = () => {
      if (btn) btn.style.opacity = window.scrollY > 400 ? '1' : '0';
    };
    window.addEventListener('scroll', toggle, { passive: true });
    return () => window.removeEventListener('scroll', toggle);
  }, []);

  return (
    <button
      id="_scrtop"
      onClick={goTop}
      aria-label="Volver al inicio de la página"
      style={{ opacity: 0 }}
      className="fixed bottom-8 right-8 z-40 w-11 h-11 rounded-full bg-primary text-[#05080d]
                 font-black text-lg flex items-center justify-center
                 hover:bg-[#0AB5B5] transition-all pointer-events-auto"
    >
      ↑
    </button>
  );
}