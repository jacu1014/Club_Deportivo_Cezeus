import React, { useState } from 'react';
import LogoCezeus from './Logo_Cezeus.jpeg';

const VistaCarnet = ({ alumno }) => {
  const [girado, setGirado] = useState(false);

  if (!alumno) {
    return (
      <div className="w-72 h-[450px] bg-slate-900/50 border-2 border-dashed border-white/10 rounded-[2rem] flex items-center justify-center p-8 text-center">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
          Selecciona un integrante para previsualizar el carnet
        </p>
      </div>
    );
  }

  const esStaff = alumno.rol && alumno.rol !== 'ALUMNO';
  const etiquetaRol = esStaff 
    ? (alumno.rol.replace('_', ' ')) 
    : (alumno.categoria?.split(' ')[0] || 'DEPORTISTA');

  const nombres = [alumno.primer_nombre, alumno.segundo_nombre].filter(Boolean).join(' ');
  const apellidos = [alumno.primer_apellido, alumno.segundo_apellido].filter(Boolean).join(' ');

  const esActivo = alumno.estado?.toUpperCase() === 'ACTIVO';
  const colorEstado = esActivo ? 'bg-emerald-500' : 'bg-rose-500';

  const manejarImpresion = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <style>
        {`
          @media print {
            @page {
              size: portrait;
              margin: 0;
            }

            body * { visibility: hidden; }

            /* Fijamos el contenedor al ancho real de una hoja A4 para evitar que el navegador comprima */
            .print-container-wrapper, .print-container-wrapper * { 
              visibility: visible !important; 
            }
            
            .print-container-wrapper { 
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 210mm !important; 
              height: 100vh !important;
              padding: 10mm !important;
              background: white !important;
              z-index: 9999;
              display: block !important;
            }

            .card-inner { 
              transform: none !important; 
              display: flex !important;
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 8mm !important;
              width: 100% !important;
            }

            .card-face {
              position: relative !important;
              width: 55mm !important; 
              height: 85mm !important;
              min-width: 55mm !important; /* BLOQUEO DE COMPRESIÓN */
              min-height: 85mm !important;
              display: flex !important;
              flex-direction: column !important;
              transform: none !important;
              backface-visibility: visible !important;
              box-shadow: none !important;
              border: 0.1mm solid #000 !important; 
              border-radius: 4mm !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              page-break-inside: avoid !important;
            }

            /* Bloqueamos el tamaño de la foto para que no se aplaste */
            .photo-box-print {
              width: 32mm !important;
              height: 42mm !important;
              min-width: 32mm !important;
              min-height: 42mm !important;
            }

            .face-back { 
              transform: none !important; 
              left: 0 !important;
              top: 0 !important;
            }

            .no-print { display: none !important; }
          }
        `}
      </style>

      <div className="print-container-wrapper">
        <div 
          className="w-[55mm] h-[85mm] cursor-pointer [perspective:1000px] group"
          onClick={() => setGirado(!girado)}
        >
          <div className={`card-inner relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${girado ? '[transform:rotateY(180deg)]' : ''}`}>
            
            {/* --- CARA FRONTAL --- */}
            <div className="card-face absolute inset-0 w-full h-full [backface-visibility:hidden] bg-[#0a0f18] border border-white/10 rounded-[1.5rem] overflow-hidden shadow-2xl flex flex-col">
              <div className="absolute top-0 left-0 w-full h-16 bg-primary/10 -skew-y-6 -mt-8" />
              
              <div className="relative pt-3 px-2 text-center flex flex-col items-center">
                <div className="w-7 h-7 mb-1 bg-white/10 rounded-full p-1 border border-white/5">
                  <img src={LogoCezeus} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-primary font-black italic uppercase tracking-tighter text-sm leading-none">CLUB DEPORTIVO CEZEUS</h2>
                <p className="text-[5px] text-white/40 font-bold tracking-[0.3em] uppercase">Carnet Oficial</p>
              </div>

              {/* FOTO: Clase photo-box-print añadida */}
              <div className="relative mt-1 flex justify-center">
                <div className="photo-box-print w-20 h-28 bg-slate-800 rounded-xl border-2 border-primary/20 overflow-hidden shadow-xl relative z-10">
                  {alumno.foto_url ? (
                    <img 
                      src={alumno.foto_url} 
                      alt="Perfil" 
                      className="w-full h-full object-cover object-top" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-600">
                      <span className="material-symbols-outlined text-3xl">person</span>
                    </div>
                  )}
                </div>
                <div className={`absolute -bottom-1.5 z-20 ${esStaff ? 'bg-white text-black' : 'bg-primary text-black'} px-2 py-0.5 rounded-md text-[6px] font-black uppercase italic shadow-lg`}>
                  {etiquetaRol}
                </div>
              </div>

              <div className="mt-2 px-3 text-center flex-1 flex flex-col justify-between mb-2">
                <div className="space-y-0.5">
                  <h3 className="text-white font-black uppercase text-[10px] leading-tight">{nombres}</h3>
                  <h3 className="text-primary font-black uppercase text-[10px] leading-tight">{apellidos}</h3>
                </div>
                
                <div className="space-y-0.5">
                  <p className="text-slate-500 text-[6px] font-black uppercase tracking-widest leading-none">{alumno.tipo_documento || 'DOCUMENTO'}</p>
                  <p className="text-white text-[9px] font-bold leading-none">{alumno.numero_documento}</p>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="bg-white/5 p-1 rounded-lg border border-white/5 flex flex-col items-center justify-center h-7">
                    <p className="text-[5px] text-slate-500 uppercase font-black">EPS</p>
                    <p className="text-white text-[7px] font-black truncate w-full text-center">{alumno.eps || 'N/A'}</p>
                  </div>
                  <div className="bg-white/5 p-1 rounded-lg border border-white/5 flex flex-col items-center justify-center h-7">
                    <p className="text-[5px] text-slate-500 uppercase font-black">RH</p>
                    <p className="text-white text-[8px] font-black italic text-center">
                      {alumno.grupo_sanguineo || ''}{alumno.factor_rh || ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${colorEstado} w-full py-1.5 flex items-center justify-center shadow-[0_-4px_10px_rgba(0,0,0,0.3)]`}>
                 <span className="text-black font-black text-[8px] uppercase tracking-[0.2em]">
                   {esActivo ? 'ACTIVO' : 'INACTIVO'}
                 </span>
              </div>
            </div>

            {/* --- CARA POSTERIOR --- */}
            <div className="card-face face-back absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#0a0f18] border border-white/10 rounded-[1.5rem] overflow-hidden shadow-2xl flex flex-col p-4 text-center">
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                  <img src={LogoCezeus} alt="Watermark" className="w-28 grayscale" />
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-3 relative z-10">
                <h4 className="text-primary font-black uppercase text-[10px] tracking-widest border-b border-white/10 pb-1">
                  {esStaff ? 'Información Staff' : 'Contacto'}
                </h4>
                
                {esStaff ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[6px] text-slate-500 uppercase font-black">Correo Electrónico</p>
                      <p className="text-white text-[9px] font-bold lowercase leading-tight break-all">
                        {alumno.email || '---'}
                      </p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                      <p className="text-[6px] text-slate-500 uppercase font-black mb-1">Teléfono Personal</p>
                      <p className="text-white text-[11px] font-black tracking-widest leading-none">
                        {alumno.telefono || '---'}
                      </p>
                    </div>
                    <p className="text-white/40 text-[7px] font-bold uppercase italic leading-tight px-2">
                      Este carnet acredita al portador como personal oficial del Club.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-[6px] text-slate-500 uppercase font-black">Acudiente</p>
                      <p className="text-white text-[11px] font-bold uppercase leading-tight">
                        {alumno.acudiente_primer_nombre} {alumno.acudiente_primer_apellido}
                      </p>
                      <p className="text-primary text-[8px] font-bold">({alumno.acudiente_parentesco || 'S/P'})</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                      <p className="text-[6px] text-slate-500 uppercase font-black mb-1">Emergencia</p>
                      <p className="text-white text-[11px] font-black tracking-widest leading-none mb-1">{alumno.acudiente_telefono || '---'}</p>
                      <p className="text-white/60 text-[10px] font-black tracking-widest leading-none">{alumno.telefono || '---'}</p>
                    </div>
                    <div>
                       <p className="text-[6px] text-slate-500 uppercase font-black">Observaciones Médicas</p>
                       <p className="text-white text-[8px] italic leading-tight uppercase line-clamp-2 text-center">
                         {alumno.condiciones_medicas || 'Sin novedades'}
                       </p>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-2 pt-2 border-t border-white/5 relative z-10">
                <p className="text-primary font-black text-[11px] italic uppercase leading-none">Club Deportivo Cezeus</p>
                <p className="text-white/40 text-[8px] font-bold tracking-tight mt-1">3134185403 - 3133540606</p>
              </div>
              <div className={`absolute bottom-0 left-0 ${colorEstado} w-full h-1.5`} />
            </div>
          </div>
        </div>
      </div>
      
      {/* --- BOTONES --- */}
      <div className="no-print flex flex-col gap-3 w-full max-w-[55mm]">
        <div className="flex justify-center items-center gap-2 text-slate-500 cursor-pointer" onClick={() => setGirado(!girado)}>
            <span className="material-symbols-outlined text-sm">screen_rotation</span>
            <span className="text-[8px] font-black uppercase tracking-widest italic">Ver reverso</span>
        </div>

        <button 
          onClick={manejarImpresion}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 text-black font-black uppercase text-[10px] py-3 px-6 rounded-xl transition-all shadow-lg"
        >
          <span className="material-symbols-outlined text-sm">print</span>
          IMPRIMIR CARNET
        </button>
      </div>
    </div>
  );
};

export default VistaCarnet;