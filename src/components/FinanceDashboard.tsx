import React, { useMemo, useState } from 'react';
import { 
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, 
  Tooltip, PieChart, Pie, Cell, AreaChart, Area, Sector 
} from 'recharts';
import { CATEGORIAS_FINANZAS } from '../constants/data';

interface Props {
  datos: any[];
  userRol: string;
  busqueda?: string;
}

const COLORS = ['#22d3ee', '#818cf8', '#c084fc', '#2dd4bf', '#fb7185', '#facc15'];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={8}
      />
    </g>
  );
};

const FinanceDashboard = ({ datos = [], userRol, busqueda }: Props) => {
  const isAdmin = ['SUPER_ADMIN', 'DIRECTOR', 'ADMINISTRATIVO'].includes(userRol);
  const isCoach = ['ENTRENADOR', 'COACH'].includes(userRol);
  const [activeIndex, setActiveIndex] = useState(-1);

  // 1. Cálculos de estadísticas generales (Mantiene tu lógica original)
  const stats = useMemo(() => {
    return datos.reduce((acc, curr) => {
      const valor = Number(curr.monto) || 0;
      const esIngreso = CATEGORIAS_FINANZAS.INGRESO.includes(curr.categoria);
      const estaPagado = curr.estado_pago === 'PAGADO';

      if (esIngreso) {
        if (estaPagado) acc.dineroHoy += valor;
        else acc.porCobrar += valor;
      } else {
        if (estaPagado) acc.dineroHoy -= valor;
        else acc.porPagar += valor;
      }
      return acc;
    }, { dineroHoy: 0, porCobrar: 0, porPagar: 0 });
  }, [datos]);

  // 2. Lógica específica para el entrenador (Mantenida)
  const statsEntrenador = useMemo(() => {
    if (!isCoach) return null;
    return {
      clasesPagadas: datos.filter(d => d.estado_pago === 'PAGADO' && !CATEGORIAS_FINANZAS.INGRESO.includes(d.categoria)).length,
      clasesPendientes: datos.filter(d => d.estado_pago !== 'PAGADO' && !CATEGORIAS_FINANZAS.INGRESO.includes(d.categoria)).length
    };
  }, [datos, isCoach]);

  // 3. Datos para gráfica de área (Mantenida y corregida para datos vacíos)
  const dataGraficaSimple = useMemo(() => {
    if (datos.length === 0) return [];
    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const agrupado = datos.reduce((acc: any, d) => {
      const fecha = new Date(d.fecha_pago);
      const mesIdx = isNaN(fecha.getTime()) ? 0 : fecha.getUTCMonth();
      if (!acc[mesIdx]) acc[mesIdx] = { name: mesesNombres[mesIdx], ingresos: 0, egresos: 0, index: mesIdx };
      
      const valor = Number(d.monto) || 0;
      if (CATEGORIAS_FINANZAS.INGRESO.includes(d.categoria)) {
        acc[mesIdx].ingresos += valor;
      } else {
        acc[mesIdx].egresos += valor;
      }
      return acc;
    }, {});
    
    return Object.values(agrupado).sort((a: any, b: any) => a.index - b.index);
  }, [datos]);

  // 4. Datos para el PieChart (Mantenida)
  const pieData = useMemo(() => {
    if (datos.length === 0) return [];
    const agrupado = datos.reduce((acc: any, curr) => {
      if (!CATEGORIAS_FINANZAS.INGRESO.includes(curr.categoria)) {
        acc[curr.categoria] = (acc[curr.categoria] || 0) + Number(curr.monto);
      }
      return acc;
    }, {});

    const totalGastos = Object.values(agrupado).reduce((a: any, b: any) => a + b, 0) as number;

    return Object.keys(agrupado).map(cat => ({
      name: cat.toUpperCase(),
      value: agrupado[cat],
      porcentaje: totalGastos > 0 ? ((Number(agrupado[cat]) / totalGastos) * 100).toFixed(1) : 0
    })).sort((a: any, b: any) => b.value - a.value);
  }, [datos]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const proyeccionFinal = stats.dineroHoy + stats.porCobrar - stats.porPagar;
  
  const tieneDeudaOpendiente = isAdmin 
    ? (stats.porPagar > 0) 
    : isCoach 
      ? (stats.porPagar > 0) 
      : (stats.porCobrar > 0); 

  const esPositivo = proyeccionFinal >= 0 && !tieneDeudaOpendiente;

  // ESTADO VACÍO: Si no hay datos, mostramos un mensaje elegante en lugar de gráficos rotos
  if (datos.length === 0) {
    return (
      <div className="p-10 bg-[#0a0f18] rounded-[2rem] border border-white/5 text-center">
        <span className="material-symbols-outlined text-slate-600 text-5xl mb-3">analytics</span>
        <h3 className="text-white font-black uppercase text-xs tracking-widest">Sin movimientos registrados</h3>
        <p className="text-slate-500 text-[10px] mt-2 font-bold uppercase">No hay datos para mostrar en este periodo</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      
      {/* 1. SECCIÓN DE CARDS (ADMIN O COACH/USER) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isAdmin ? (
          <>
            <div className="bg-emerald-500 border-l-4 border-emerald-300 p-5 rounded-2xl shadow-lg shadow-emerald-500/10">
              <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest">Dinero que tienes hoy</p>
              <h4 className="text-2xl font-black text-white">${stats.dineroHoy.toLocaleString('es-CO')}</h4>
              <p className="text-emerald-200 text-[9px] mt-1 font-bold">¡Esto es lo que hay en caja!</p>
            </div>

            <div className="bg-[#1e293b] border-l-4 border-cyan-400 p-5 rounded-2xl">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Falta por cobrar</p>
              <h4 className="text-2xl font-black text-cyan-400">${stats.porCobrar.toLocaleString('es-CO')}</h4>
              <p className="text-slate-500 text-[9px] mt-1 font-bold">Dinero pendiente de ingresos.</p>
            </div>

            <div className="bg-[#1e293b] border-l-4 border-rose-500 p-5 rounded-2xl">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Cuentas por pagar</p>
              <h4 className="text-2xl font-black text-rose-400">${stats.porPagar.toLocaleString('es-CO')}</h4>
              <p className="text-slate-500 text-[9px] mt-1 font-bold">Gastos o nóminas pendientes.</p>
            </div>
          </>
        ) : (
          <div className={`col-span-3 p-8 rounded-[2rem] flex items-center justify-between border-b-4 transition-all duration-500 ${
            (isCoach ? stats.porPagar > 0 : stats.porCobrar > 0) 
              ? 'bg-rose-500/10 border-rose-500 shadow-xl shadow-rose-500/5' 
              : 'bg-emerald-500/10 border-emerald-400 shadow-xl shadow-emerald-500/5'
          }`}>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${
                (isCoach ? stats.porPagar > 0 : stats.porCobrar > 0) ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {isCoach ? 'Control de Honorarios' : 'Estado de cuenta personal'}
              </p>
              <h2 className="text-3xl font-black text-white italic tracking-tighter">
                {isCoach 
                  ? (stats.porPagar > 0 ? `Tienes $${stats.porPagar.toLocaleString('es-CO')} por cobrar` : '¡Estás al día con tus pagos!')
                  : (stats.porCobrar > 0 ? `Saldo pendiente de $${stats.porCobrar.toLocaleString('es-CO')}` : '¡Excelente! Estás al día')
                }
              </h2>
              <p className="text-slate-400 text-xs mt-2 font-medium">
                {isCoach 
                  ? `Resumen: ${statsEntrenador?.clasesPagadas} pagadas y ${statsEntrenador?.clasesPendientes} pendientes.`
                  : (stats.porCobrar > 0 ? 'Recuerda ponerte al día con la escuela.' : 'Gracias por tu puntualidad.')
                }
              </p>
            </div>
            <div className={`flex items-center justify-center w-16 h-16 rounded-full border-2 ${
              (isCoach ? stats.porPagar > 0 : stats.porCobrar > 0) ? 'border-rose-500/30 bg-rose-500/10' : 'border-emerald-400/30 bg-emerald-400/10'
            }`}>
              <span className={`material-symbols-outlined text-4xl ${
                (isCoach ? stats.porPagar > 0 : stats.porCobrar > 0) ? 'text-rose-500 animate-pulse' : 'text-emerald-400'
              }`}>
                {(isCoach ? stats.porPagar > 0 : stats.porCobrar > 0) ? 'payments' : 'check_circle'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. SECCIÓN DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfica de Área (Flujo Mensual) */}
        <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} bg-[#0a0f18] border border-white/5 p-6 rounded-[2rem]`}>
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
            <div>
              <h3 className="text-xs font-black uppercase text-white tracking-widest">Realidad Financiera</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 italic">Flujo mensual auto-ajustado</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-cyan-400"></div><span className="text-[9px] font-black text-slate-400 uppercase">Entradas</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-[9px] font-black text-slate-400 uppercase">Salidas</span></div>
            </div>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataGraficaSimple} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngreso" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorEgreso" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fb7185" stopOpacity={0.1}/><stop offset="95%" stopColor="#fb7185" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 9}} tickFormatter={(v) => `$${v.toLocaleString('es-CO', { notation: 'compact' })}`} />
                <Tooltip cursor={{ stroke: '#ffffff10', strokeWidth: 2 }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }} itemStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="ingresos" stroke="#22d3ee" strokeWidth={4} fillOpacity={1} fill="url(#colorIngreso)" name="Ingresos" />
                <Area type="monotone" dataKey="egresos" stroke="#fb7185" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorEgreso)" name="Egresos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica de Torta (Solo Admin) */}
        {isAdmin && (
          <div className="bg-[#0a0f18] border border-white/5 p-6 rounded-[2rem] flex flex-col">
            <h3 className="text-xs font-black uppercase text-white mb-2 tracking-widest text-center italic">¿En qué se va el dinero?</h3>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={pieData} 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={2} 
                    dataKey="value"
                    stroke="none"
                    onMouseEnter={onPieEnter}
                    onMouseLeave={() => setActiveIndex(-1)}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={6} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} itemStyle={{color: '#fff', fontSize: '11px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-1.5 overflow-y-auto max-h-[120px] pr-2 custom-scrollbar">
              {pieData.slice(0, 4).map((entry, index) => (
                <div key={index} className={`flex justify-between items-center border px-3 py-2 rounded-xl transition-all ${activeIndex === index ? 'bg-white/10 border-white/20' : 'bg-white/[0.02] border-white/5'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-300 uppercase leading-none">{entry.name}</span>
                      <span className="text-[8px] font-bold text-cyan-500/70">{entry.porcentaje}%</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-white">${entry.value.toLocaleString('es-CO')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. BARRA DE BALANCE FINAL */}
      <div className="bg-[#0a0f18] border border-white/5 p-5 rounded-[2rem] flex flex-col md:flex-row items-center gap-6 overflow-hidden relative">
        <div className={`absolute -right-4 -top-4 w-32 h-32 blur-3xl opacity-10 rounded-full ${esPositivo ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full animate-pulse ${esPositivo ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
              {isAdmin ? "Balance Final Esperado" : isCoach ? "Total por Recibir" : "Tu Proyección de Cuenta"}
            </p>
          </div>
          <div className="flex items-baseline gap-3">
            <h2 className={`text-4xl font-black italic tracking-tighter ${esPositivo ? 'text-white' : 'text-rose-400'}`}>
              {isCoach ? `$${stats.porPagar.toLocaleString('es-CO')}` : `$${proyeccionFinal.toLocaleString('es-CO')}`}
            </h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${esPositivo ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' : 'text-rose-400 border-rose-400/30 bg-rose-400/10'}`}>
              {isCoach ? (stats.porPagar > 0 ? 'Pendiente' : 'Al día') : (esPositivo ? 'Superávit' : 'Pendiente')}
            </span>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-center gap-1 px-6 border-x border-white/5">
            <p className="text-[9px] font-black text-slate-600 uppercase">{isCoach ? 'Progreso Cobros' : 'Estado de Cuenta'}</p>
            <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                 className={`h-full transition-all duration-1000 ${esPositivo ? 'bg-emerald-500' : 'bg-rose-500'}`}
                 style={{ width: `${esPositivo ? 100 : 40}%` }}
                ></div>
            </div>
        </div>

        <div className="bg-white/5 p-3 px-5 rounded-2xl border border-white/10 flex items-center gap-4 shrink-0">
           <div>
             <p className="text-[9px] font-black text-slate-500 uppercase">Actividad</p>
             <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white">{datos.length}</span>
                <span className="text-[9px] font-bold text-slate-400 italic">Movs.</span>
             </div>
           </div>
           <span className="material-symbols-outlined text-white/20 text-3xl">{isCoach ? 'sports_soccer' : 'insights'}</span>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
