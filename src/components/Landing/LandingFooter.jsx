// src/pages/landing/components/LandingFooter.jsx

export default function LandingFooter() {
  return (
    <footer className="bg-[#0a1118] border-t border-white/5 pt-14 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Marca */}
          <div className="lg:col-span-2">
            <div className="font-black text-[28px] uppercase italic tracking-widest mb-4">
              CE<span className="text-primary">ZEUS</span>
            </div>
            <p className="text-slate-400 text-[14px] leading-relaxed max-w-xs">
              Formando campeones de vida a través del deporte desde hace más de 10 años en Bogotá.
            </p>
            <p className="text-primary/50 text-[10px] font-black uppercase tracking-widest mt-3">
              Resolución 460 I.D.R.D. · Bogotá, Colombia
            </p>
          </div>

          <FooterCol title="Programa" links={[
            { label: 'Iniciación',      href: '#categorias' },
            { label: 'Infantil',        href: '#categorias' },
            { label: 'Transición',      href: '#categorias' },
            { label: 'Horarios',        href: '#programa'   },
          ]} />

          <FooterCol title="Acceso" links={[
            { label: 'Ingresar al portal', href: '/login'    },
            { label: 'Inscríbete',         href: '#contacto' },
            { label: 'Contacto',           href: '#contacto' },
          ]} />
        </div>

        <div className="border-t border-white/5 pt-6 flex justify-between items-center flex-wrap gap-4">
          <p className="text-slate-500 text-[13px]">© 2026 Club Deportivo Cezeus. Todos los derechos reservados.</p>
          <p className="text-slate-500 text-[13px]">Hecho con ❤️ en Bogotá, Colombia</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-5">{title}</h4>
      <ul className="space-y-3 list-none">
        {links.map(l => (
          <li key={l.label}>
            <a href={l.href}
               className="text-slate-400 hover:text-primary text-[14px] transition-colors">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}