// src/pages/landing/LandingPage.jsx
//
// Página principal pública del Club Deportivo Cezeus.
// Compone todas las secciones y consume el hook useGaleria para cargar fotos dinámicamente.
//
// Para agregar a las rutas en App.jsx:
//   import LandingPage from './pages/landing/LandingPage';
//   // En el bloque de Routes, ANTES del redirect a /login:
//   <Route path="/inicio" element={<LandingPage />} />
//   // O como ruta raíz pública:
//   <Route path="/" element={!user ? <LandingPage /> : <Navigate to={redirectPath} replace />} />

import { useEffect } from 'react';
import LandingNav       from '../components/Landing/LandingNav'; 
import HeroSection      from '../components/Landing/HeroSection';
import HistoriaSection  from '../components/Landing/HistoriaSection';
import CategoriasSection from '../components/Landing/CategoriasSection';
import GaleriaSection   from '../components/Landing/GaleriaSection';
import ProgramaSection  from '../components/Landing/ProgramaSection';
import ValoresSection   from '../components/Landing/ValoresSection';
import ContactoSection  from '../components/Landing/ContactoSection';
import LandingFooter    from '../components/Landing/LandingFooter';
import { useGaleria }   from './hooks/useGaleria';

export default function LandingPage() {
  const { fotos, loading } = useGaleria();

  // Scroll suave al tope al montar
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-[#05080d] text-slate-200 antialiased overflow-x-hidden">

      {/* ── Navegación fija ── */}
      <LandingNav />

      {/* ── Secciones ── */}
      <main>
        {/* Las fotos del hero y de historia vienen de la misma tabla galeria_publica */}
        <HeroSection     fotos={fotos} />
        <HistoriaSection foto={fotos[2]?.url || null} />
        <CategoriasSection />
        <GaleriaSection  fotos={fotos} loading={loading} />
        <ProgramaSection />
        <ValoresSection />
        <ContactoSection />
      </main>

      <LandingFooter />

      {/* Botón scroll-to-top */}
      <ScrollTop />
    </div>
  );
}

function ScrollTop() {
  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  useEffect(() => {
    const btn = document.getElementById('_scrtop');
    const toggle = () => btn && (btn.style.opacity = window.scrollY > 400 ? '1' : '0');
    window.addEventListener('scroll', toggle, { passive: true });
    return () => window.removeEventListener('scroll', toggle);
  }, []);

  return (
    <button id="_scrtop" onClick={goTop} aria-label="Volver al inicio"
            style={{ opacity: 0 }}
            className="fixed bottom-8 right-8 z-40 w-11 h-11 rounded-full bg-primary text-[#05080d]
                       font-black text-lg flex items-center justify-center
                       hover:bg-[#0AB5B5] transition-all pointer-events-auto">
      ↑
    </button>
  );
}