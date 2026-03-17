// src/pages/landing/components/GaleriaSection.jsx
import { useState } from 'react';

export default function GaleriaSection({ fotos = [], loading = false }) {
  const [lightbox, setLightbox] = useState(null); // url de la foto abierta

  // Mostramos máx 5 slots; si no hay fotos se muestran placeholders
  const slots = Array.from({ length: 5 }, (_, i) => fotos[i] || null);

  return (
    <section id="galeria" className="py-24 bg-gradient-to-b from-[#07090f] to-[#05080d]">
      <div className="max-w-6xl mx-auto px-6">

        <div className="flex justify-between items-end mb-12 flex-wrap gap-6">
          <div>
            <p className="flex items-center gap-3 text-primary text-[11px] font-black uppercase tracking-[0.25em] mb-3">
              <span className="w-6 h-0.5 bg-primary inline-block" /> Nuestro Trabajo
            </p>
            <h2 className="font-black italic text-[clamp(40px,5vw,64px)] leading-none">
              VIVIENDO EL <span className="text-primary">DEPORTE</span>
            </h2>
          </div>
          <p className="text-slate-400 text-[17px] max-w-xs leading-relaxed">
            Momentos que capturan la esencia de Cezeus.
          </p>
        </div>

        {/* Grid 4 columnas, fila 1 tiene foto destacada (2x2) */}
        <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-4"
             style={{ gridTemplateRows: '220px 220px' }}>

          {/* Foto destacada – ocupa col 1-2, row 1-2 */}
          <GaleriaSlot foto={slots[0]} featured onClick={() => slots[0] && setLightbox(slots[0].url)} loading={loading} />

          {/* Fotos secundarias */}
          {slots.slice(1).map((foto, i) => (
            <GaleriaSlot key={i} foto={foto} onClick={() => foto && setLightbox(foto.url)} loading={loading} />
          ))}
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
               onClick={() => setLightbox(null)}>
            <button className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 text-white text-xl"
                    onClick={() => setLightbox(null)}>✕</button>
            <img src={lightbox} alt="Foto ampliada Club Cezeus"
                 className="max-w-[90vw] max-h-[85vh] rounded-xl object-contain"
                 onClick={e => e.stopPropagation()} />
          </div>
        )}
      </div>
    </section>
  );
}

function GaleriaSlot({ foto, featured = false, onClick, loading }) {
  const base = `rounded-[14px] overflow-hidden bg-[#0E1620] border border-white/6
                cursor-pointer relative group transition-transform hover:scale-[1.02]`;
  const cls  = featured ? `${base} col-span-2 row-span-2` : base;

  return (
    <div className={cls} onClick={onClick}>
      {loading ? (
        <div className="w-full h-full animate-pulse bg-white/5" />
      ) : foto ? (
        <>
          <img src={foto.url} alt={foto.descripcion || 'Foto Club Cezeus'}
               className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-primary/15 opacity-0 group-hover:opacity-100 transition-opacity
                          flex items-center justify-center">
            <span className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-[#05080d] text-xl">🔍</span>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-10">
          <span className="text-4xl">📸</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            {featured ? 'Foto destacada' : 'Foto'}
          </span>
        </div>
      )}
    </div>
  );
}