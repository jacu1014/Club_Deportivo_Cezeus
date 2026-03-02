import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Legend 
} from 'recharts';
import { format, parseISO } from 'date-fns';
import es from 'date-fns/locale/es';

const AttendanceChart = ({ asistencias }) => {
  // Estado para el filtro rápido: 'ALL', 'ALUMNO', 'STAFF'
  const [activeFilter, setActiveFilter] = useState('ALL');

  const dataGrafica = useMemo(() => {
    const conteo = asistencias.reduce((acc, curr) => {
      const fechaRaw = curr.fecha; 
      const fechaLabel = format(parseISO(fechaRaw), 'dd MMM', { locale: es });
      
      if (!acc[fechaRaw]) {
        acc[fechaRaw] = { 
          fechaSort: fechaRaw, 
          fechaDisplay: fechaLabel, 
          Alumnos: 0, 
          Staff: 0,
          categorias: {} // Guardamos conteo interno por categoría
        };
      }
      
      if (curr.estado === 'PRESENTE') {
        const esAlumno = curr.usuarios?.rol === 'ALUMNO';
        const cat = curr.usuarios?.categoria || 'Sin Categoría';

        if (esAlumno) {
          acc[fechaRaw].Alumnos += 1;
          acc[fechaRaw].categorias[cat] = (acc[fechaRaw].categorias[cat] || 0) + 1;
        } else {
          acc[fechaRaw].Staff += 1;
        }
      }
      return acc;
    }, {});

    return Object.values(conteo).sort((a, b) => a.fechaSort.localeCompare(b.fechaSort));
  }, [asistencias]);

  // Tooltip personalizado para ver categorías al pasar el mouse
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0a0f18] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
          <p className="text-[10px] font-black text-slate-500 mb-2 uppercase italic">{label}</p>
          {payload.map((p, i) => (
            <div key={i} className="flex justify-between gap-6 mb-1">
              <span className="text-[11px] font-bold" style={{ color: p.color }}>{p.name}:</span>
              <span className="text-[11px] font-black text-white">{p.value}</span>
            </div>
          ))}
          
          {/* Mostrar categorías solo si hay alumnos presentes en ese día */}
          {data.Alumnos > 0 && activeFilter !== 'STAFF' && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Por Categoría:</p>
              {Object.entries(data.categorias).map(([cat, val]) => (
                <div key={cat} className="flex justify-between text-[9px]">
                  <span className="text-slate-500">{cat}:</span>
                  <span className="font-bold text-cyan-400">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (asistencias.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center border border-white/5 rounded-[2.5rem] bg-white/[0.02]">
        <p className="text-[10px] uppercase font-black text-slate-600 italic tracking-widest">Sin datos en este rango</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* SELECTOR DE FILTROS RÁPIDOS */}
      <div className="flex gap-2 mb-6">
        {['ALL', 'ALUMNO', 'STAFF'].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[9px] font-black transition-all border ${
              activeFilter === f 
              ? 'bg-cyan-400 text-black border-cyan-400 shadow-lg shadow-cyan-400/20' 
              : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/20'
            }`}
          >
            {f === 'ALL' ? 'VISTA GENERAL' : f}
          </button>
        ))}
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dataGrafica} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="alumnoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
                <stop offset="100%" stopColor="#0891b2" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="staffGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis dataKey="fechaDisplay" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
            <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
            
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />

            {(activeFilter === 'ALL' || activeFilter === 'ALUMNO') && (
              <Bar name="Alumnos" dataKey="Alumnos" fill="url(#alumnoGradient)" radius={[4, 4, 0, 0]} barSize={activeFilter === 'ALL' ? 12 : 30} />
            )}
            
            {(activeFilter === 'ALL' || activeFilter === 'STAFF') && (
              <Bar name="Staff" dataKey="Staff" fill="url(#staffGradient)" radius={[4, 4, 0, 0]} barSize={activeFilter === 'ALL' ? 12 : 30} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendanceChart;