// src/pages/landing/components/LandingNav.jsx
import { useState } from 'react';
import LogoImg from '../Logo_Cezeus.jpeg';

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  const links = [
    { label: 'Historia',    href: '#historia' },
    { label: 'Categorías',  href: '#categorias' },
    { label: 'Galería',     href: '#galeria' },
    { label: 'Programa',    href: '#programa' },
    { label: 'Inscríbete',  href: '#contacto' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center justify-between px-6
                    bg-[#05080d]/85 backdrop-blur-xl border-b border-primary/10">
      {/* Logo */}
      <a href="#hero" className="flex items-center gap-3" aria-label="Club Cezeus - inicio">
        <img src={LogoImg} alt="Logo Cezeus" className="w-11 h-11 rounded-xl object-cover" />
        <span className="font-black text-xl uppercase tracking-widest italic">
          CE<span className="text-primary">ZEUS</span>
        </span>
      </a>

      {/* Desktop links */}
      <ul className="hidden lg:flex items-center gap-8 list-none">
        {links.map(l => (
          <li key={l.href}>
            <a href={l.href}
               className="text-slate-400 hover:text-primary text-[11px] font-black uppercase tracking-widest transition-colors">
              {l.label}
            </a>
          </li>
        ))}
        <li>
          <a href="/login"
             className="bg-primary text-[#05080d] text-[11px] font-black uppercase tracking-widest
                        px-5 py-2.5 rounded-lg hover:bg-[#0AB5B5] transition-all">
            Ingresar al club
          </a>
        </li>
      </ul>

      {/* Mobile hamburger */}
      <button
        className="lg:hidden text-white text-2xl"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        {open ? '✕' : '☰'}
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden absolute top-[72px] left-0 right-0 bg-[#0a1118]
                        border-b border-white/5 flex flex-col">
          {links.map(l => (
            <a key={l.href} href={l.href}
               onClick={() => setOpen(false)}
               className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400
                          hover:text-primary border-b border-white/5 transition-colors">
              {l.label}
            </a>
          ))}
          <div className="p-4">
            <a href="/login"
               className="block text-center bg-primary text-[#05080d] text-[11px] font-black
                          uppercase tracking-widest py-3 rounded-lg">
              Ingresar al club
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}