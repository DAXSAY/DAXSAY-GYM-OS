// =====================================================================
// REPORTE FINANCIERO DETALLADO (ingresos y egresos)
// Todo se calcula con los movimientos reales de caja (tabla movimientos_caja).
// =====================================================================
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, Percent, Receipt, CalendarDays, CreditCard, Tags, Users, Trophy, FileSpreadsheet, FileText, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { hoyISO } from "../../utils/fecha";
import { crearExcel, crearPDF, descargar } from "../../utils/exportar";

export const NOMBRE_CATEGORIA = {
  membership: "Membresías y matrículas",
  pos_sale: "Ventas de tienda (POS)",
  personal_training: "Entrenamiento personal",
  physiotherapy: "Fisioterapia",
  nutrition: "Nutrición",
  salary: "Sueldos del personal",
  staff_payroll: "Sueldos del personal",
  equipment_breakdown: "Averías de equipos",
  maintenance: "Mantenimiento",
  rent: "Alquiler del local",
  utilities: "Servicios (luz, agua, internet)",
  supplies: "Insumos / stock",
  marketing: "Publicidad y marketing",
  free_expense: "Gasto libre / compras",
  other: "Otros",
};
const NOMBRE_METODO = { efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia", yape_plin: "Yape / Plin" };
const COLOR_METODO = { efectivo: "#10b981", tarjeta: "#6366f1", transferencia: "#0ea7b3", yape_plin: "#a855f7" };
const PALETA = ["#0ea7b3", "#10b981", "#f59e0b", "#6366f1", "#f43f5e", "#a855f7", "#38bdf8", "#f97316", "#84cc16", "#64748b"];
const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const soles = (n) => `S/ ${Number(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const solesCorto = (n) => (Math.abs(n) >= 1000 ? `S/${(n / 1000).toFixed(1)}k` : `S/${Math.round(n)}`);
const sumar = (l) => l.reduce((a, t) => a + (Number(t.amount) || 0), 0);
const sumarDias = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
const finDeMes = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
};
const diasEntre = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000) + 1;
const fCorta = (iso) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "");

/** Agrupa por una clave y devuelve [{nombre, valor, n}] ordenado de mayor a menor */
const agrupar = (lista, clave, nombre = (k) => k) =>
  Object.values(
    lista.reduce((m, t) => {
      const k = clave(t) || "—";
      m[k] = m[k] || { clave: k, nombre: nombre(k), valor: 0, n: 0 };
      m[k].valor += Number(t.amount) || 0;
      m[k].n += 1;
      return m;
    }, {}),
  ).sort((a, b) => b.valor - a.valor);

const TooltipSoles = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xl text-xs">
      {label && <p className="font-black text-slate-900 mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey || p.name} className="flex items-center gap-2 text-slate-600">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.color }} />
          {p.name}: <b className="text-slate-900">{soles(p.value)}</b>
        </p>
      ))}
    </div>
  );
};

const Tarjeta = ({ titulo, icono: Icono, color, children, accion }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm rd-aparece">
    <div className="flex items-center justify-between gap-2 mb-3">
      <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-2">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
          <Icono className="w-4 h-4" />
        </span>
        {titulo}
      </h4>
      {accion}
    </div>
    {children}
  </div>
);

const Variacion = ({ actual, anterior, invertir = false }) => {
  if (!anterior) return <span className="text-[11px] text-slate-400">sin periodo anterior</span>;
  const pct = ((actual - anterior) / Math.abs(anterior)) * 100;
  const bueno = invertir ? pct <= 0 : pct >= 0;
  const Flecha = pct >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${bueno ? "text-emerald-600" : "text-rose-600"}`}>
      <Flecha className="w-3.5 h-3.5" /> {pct >= 0 ? "+" : ""}
      {pct.toFixed(1)}% vs periodo anterior
    </span>
  );
};

/** Lista con barras de porcentaje (clic para filtrar) */
const ListaBarras = ({ filas, total, colorDe, activo, onClick }) => (
  <div className="space-y-2">
    {filas.length === 0 && <p className="text-xs text-slate-400 py-6 text-center">Sin movimientos en este periodo.</p>}
    {filas.map((f, i) => {
      const pct = total > 0 ? (f.valor / total) * 100 : 0;
      const c = colorDe ? colorDe(f, i) : PALETA[i % PALETA.length];
      return (
        <button
          key={f.clave}
          type="button"
          onClick={() => onClick?.(f.clave)}
          className={`w-full text-left rounded-lg px-2 py-1.5 transition-colors cursor-pointer ${activo === f.clave ? "bg-blue-50 ring-1 ring-blue-300" : "hover:bg-slate-50"}`}
        >
          <div className="flex justify-between text-xs gap-2">
            <span className="font-semibold text-slate-700 truncate">{f.nombre}</span>
            <span className="font-black text-slate-900 whitespace-nowrap">
              {soles(f.valor)} <span className="text-slate-400 font-semibold">· {pct.toFixed(0)}% · {f.n} mov.</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 mt-1 overflow-hidden">
            <div className="h-full rounded-full rd-crece" style={{ width: `${pct}%`, background: c }} />
          </div>
        </button>
      );
    })}
  </div>
);

export const ReporteFinanciero = ({ transactions }) => {
  const h = hoyISO();
  const mes = h.slice(0, 7);
  const [rango, setRango] = useState({ desde: `${mes}-01`, hasta: h, etiqueta: "Este mes" });
  const [filtroCat, setFiltroCat] = useState("");
  const [filtroMetodo, setFiltroMetodo] = useState("");

  const opciones = useMemo(() => {
    const mesAnt = (() => {
      const d = new Date(`${mes}-15T12:00:00Z`);
      d.setUTCMonth(d.getUTCMonth() - 1);
      return d.toISOString().slice(0, 7);
    })();
    return [
      ["Hoy", h, h],
      ["Últimos 7 días", sumarDias(h, -6), h],
      ["Este mes", `${mes}-01`, h],
      ["Mes anterior", `${mesAnt}-01`, finDeMes(mesAnt)],
      ["Últimos 90 días", sumarDias(h, -89), h],
      ["Este año", `${h.slice(0, 4)}-01-01`, h],
    ];
  }, [h, mes]);

  const enRango = (t, a, b) => t.date >= a && t.date <= b;
  const dias = diasEntre(rango.desde, rango.hasta);
  const antDesde = sumarDias(rango.desde, -dias);
  const antHasta = sumarDias(rango.desde, -1);

  const base = useMemo(
    () =>
      transactions.filter(
        (t) => (!filtroCat || t.category === filtroCat || (filtroCat === "salary" && t.category === "staff_payroll")) && (!filtroMetodo || t.paymentMethod === filtroMetodo),
      ),
    [transactions, filtroCat, filtroMetodo],
  );
  const lista = useMemo(() => base.filter((t) => enRango(t, rango.desde, rango.hasta)), [base, rango]);
  const anterior = useMemo(() => base.filter((t) => enRango(t, antDesde, antHasta)), [base, antDesde, antHasta]);

  const ing = lista.filter((t) => t.type === "income");
  const egr = lista.filter((t) => t.type === "expense");
  const totIng = sumar(ing);
  const totEgr = sumar(egr);
  const util = totIng - totEgr;
  const antIng = sumar(anterior.filter((t) => t.type === "income"));
  const antEgr = sumar(anterior.filter((t) => t.type === "expense"));
  const margen = totIng > 0 ? (util / totIng) * 100 : 0;
  const ticket = ing.length ? totIng / ing.length : 0;

  // Flujo por día (o por mes si el rango es largo) con saldo acumulado
  const flujo = useMemo(() => {
    const porMes = dias > 62;
    const puntos = [];
    if (porMes) {
      let cur = rango.desde.slice(0, 7);
      while (cur <= rango.hasta.slice(0, 7)) {
        const a = cur === rango.desde.slice(0, 7) ? rango.desde : `${cur}-01`;
        const b = cur === rango.hasta.slice(0, 7) ? rango.hasta : finDeMes(cur);
        puntos.push({ etiqueta: `${cur.slice(5)}/${cur.slice(2, 4)}`, a, b });
        const d = new Date(`${cur}-15T12:00:00Z`);
        d.setUTCMonth(d.getUTCMonth() + 1);
        cur = d.toISOString().slice(0, 7);
      }
    } else {
      for (let i = 0; i < dias; i++) {
        const d = sumarDias(rango.desde, i);
        puntos.push({ etiqueta: `${d.slice(8)}/${d.slice(5, 7)}`, a: d, b: d });
      }
    }
    let acum = 0;
    return puntos.map((p) => {
      const ingresos = sumar(ing.filter((t) => enRango(t, p.a, p.b)));
      const egresos = sumar(egr.filter((t) => enRango(t, p.a, p.b)));
      acum += ingresos - egresos;
      return { etiqueta: p.etiqueta, ingresos, egresos, acumulado: Math.round(acum * 100) / 100 };
    });
  }, [lista, rango, dias]);

  const ingCat = agrupar(ing, (t) => t.category, (k) => NOMBRE_CATEGORIA[k] || k);
  const egrCat = agrupar(egr, (t) => (t.category === "staff_payroll" ? "salary" : t.category), (k) => NOMBRE_CATEGORIA[k] || k);
  const ingMet = agrupar(ing, (t) => t.paymentMethod, (k) => NOMBRE_METODO[k] || k);
  const egrMet = agrupar(egr, (t) => t.paymentMethod, (k) => NOMBRE_METODO[k] || k);
  const porUsuario = agrupar(lista, (t) => t.registeredBy || "Sin dato");
  const porSemana = DIAS_SEMANA.map((d, i) => {
    const del = (l) => l.filter((t) => (new Date(`${t.date}T12:00:00Z`).getUTCDay() + 6) % 7 === i);
    return { dia: d, ingresos: sumar(del(ing)), egresos: sumar(del(egr)) };
  });
  const porTurno = agrupar(lista.filter((t) => t.type === "income"), (t) => (t.shiftId ? `Turno #${t.shiftId} · ${t.shiftOpenedBy || ""}` : "Fuera de turno"));
  const topIng = [...ing].sort((a, b) => b.amount - a.amount).slice(0, 8);
  const topEgr = [...egr].sort((a, b) => b.amount - a.amount).slice(0, 8);

  const filtrosTexto = [
    `${rango.etiqueta || "Periodo"}: ${fCorta(rango.desde)} al ${fCorta(rango.hasta)}`,
    ...(filtroCat ? [`Categoría: ${NOMBRE_CATEGORIA[filtroCat] || filtroCat}`] : []),
    ...(filtroMetodo ? [`Medio de pago: ${NOMBRE_METODO[filtroMetodo]}`] : []),
  ];
  const columnas = [
    { key: "fecha", label: "Fecha" },
    { key: "tipo", label: "Tipo" },
    { key: "categoria", label: "Categoría" },
    { key: "detalle", label: "Detalle" },
    { key: "metodo", label: "Medio de pago" },
    { key: "registro", label: "Registró" },
    { key: "monto", label: "Monto" },
  ];
  const filasExport = lista.map((t) => ({
    fecha: fCorta(t.date),
    tipo: t.type === "income" ? "Ingreso" : "Egreso",
    categoria: NOMBRE_CATEGORIA[t.category] || t.category,
    detalle: t.description || "",
    metodo: NOMBRE_METODO[t.paymentMethod] || t.paymentMethod || "",
    registro: t.registeredBy || "",
    monto: t.type === "income" ? t.amount : -t.amount,
  }));
  const totalesExport = [
    ["Ingresos", soles(totIng)],
    ["Egresos", soles(totEgr)],
    ["Utilidad", soles(util)],
    ["Margen", `${margen.toFixed(1)}%`],
  ];
  const exportar = async (tipo) => {
    const datos = { titulo: "Reporte financiero detallado", filtros: filtrosTexto, columnas, filas: filasExport, totales: totalesExport };
    descargar(tipo === "pdf" ? await crearPDF(datos) : await crearExcel(datos));
  };

  const Kpi = ({ titulo, valor, icono: Icono, tono, children }) => (
    <div className={`relative overflow-hidden rounded-2xl border p-4 rd-aparece ${tono}`}>
      <Icono className="absolute -right-2 -bottom-2 w-16 h-16 opacity-10" />
      <p className="text-[11px] font-black uppercase tracking-wider opacity-80">{titulo}</p>
      <p className="text-2xl font-black mt-0.5">{valor}</p>
      <div className="mt-1">{children}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Periodo y filtros */}
      <div className="rd-filtros bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-blue-600 mr-1" />
          {opciones.map(([l, a, b]) => (
            <button
              key={l}
              type="button"
              onClick={() => setRango({ desde: a, hasta: b, etiqueta: l })}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all ${
                rango.desde === a && rango.hasta === b ? "bg-blue-600 border-blue-600 text-white shadow" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {l}
            </button>
          ))}
          <label className="text-xs flex items-center gap-1 ml-2">
            <span className="font-bold text-slate-500">Desde</span>
            <input type="date" value={rango.desde} max={rango.hasta} onChange={(e) => e.target.value && setRango((r) => ({ ...r, desde: e.target.value, etiqueta: "Personalizado" }))} className="px-2 py-1 rounded-lg border border-slate-200 text-xs" />
          </label>
          <label className="text-xs flex items-center gap-1">
            <span className="font-bold text-slate-500">Hasta</span>
            <input type="date" value={rango.hasta} min={rango.desde} onChange={(e) => e.target.value && setRango((r) => ({ ...r, hasta: e.target.value, etiqueta: "Personalizado" }))} className="px-2 py-1 rounded-lg border border-slate-200 text-xs" />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)} className={`px-2 py-1.5 rounded-lg border text-xs ${filtroCat ? "border-blue-400 bg-blue-50 font-bold" : "border-slate-200 bg-white"}`}>
            <option value="">Todas las categorías</option>
            {Object.entries(NOMBRE_CATEGORIA)
              .filter(([k]) => k !== "staff_payroll")
              .map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
          </select>
          <select value={filtroMetodo} onChange={(e) => setFiltroMetodo(e.target.value)} className={`px-2 py-1.5 rounded-lg border text-xs ${filtroMetodo ? "border-blue-400 bg-blue-50 font-bold" : "border-slate-200 bg-white"}`}>
            <option value="">Todos los medios de pago</option>
            {Object.entries(NOMBRE_METODO).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {(filtroCat || filtroMetodo) && (
            <button type="button" onClick={() => (setFiltroCat(""), setFiltroMetodo(""))} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">
              Quitar filtros
            </button>
          )}
          <span className="text-xs text-slate-500 ml-auto">{lista.length} movimientos · {dias} día(s)</span>
          <button type="button" onClick={() => exportar("excel")} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button type="button" onClick={() => exportar("pdf")} className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer">
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi titulo="Ingresos" valor={soles(totIng)} icono={TrendingUp} tono="bg-emerald-50 border-emerald-200 text-emerald-900">
          <Variacion actual={totIng} anterior={antIng} />
        </Kpi>
        <Kpi titulo="Egresos" valor={soles(totEgr)} icono={TrendingDown} tono="bg-rose-50 border-rose-200 text-rose-900">
          <Variacion actual={totEgr} anterior={antEgr} invertir />
        </Kpi>
        <Kpi titulo="Utilidad" valor={soles(util)} icono={Wallet} tono={util >= 0 ? "bg-blue-50 border-blue-200 text-blue-900" : "bg-amber-50 border-amber-200 text-amber-900"}>
          <Variacion actual={util} anterior={antIng - antEgr} />
        </Kpi>
        <Kpi titulo="Margen" valor={`${margen.toFixed(1)}%`} icono={Percent} tono="bg-indigo-50 border-indigo-200 text-indigo-900">
          <span className="text-[11px] font-semibold">de cada S/ 100 quedan S/ {Math.max(0, margen).toFixed(0)}</span>
        </Kpi>
        <Kpi titulo="Ticket promedio" valor={soles(ticket)} icono={Receipt} tono="bg-amber-50 border-amber-200 text-amber-900">
          <span className="text-[11px] font-semibold">{ing.length} cobros · {egr.length} gastos</span>
        </Kpi>
      </div>

      {/* Flujo */}
      <Tarjeta titulo={dias > 62 ? "Flujo mensual y saldo acumulado" : "Flujo diario y saldo acumulado"} icono={TrendingUp} color="bg-blue-100 text-blue-700">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={flujo} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
              <defs>
                <linearGradient id="rfAcum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea7b3" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0ea7b3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="etiqueta" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={solesCorto} />
              <Tooltip content={<TooltipSoles />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="acumulado" name="Saldo acumulado" stroke="#0ea7b3" fill="url(#rfAcum)" strokeWidth={2} animationDuration={1200} />
              <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[5, 5, 0, 0]} animationDuration={900} />
              <Bar dataKey="egresos" name="Egresos" fill="#f43f5e" radius={[5, 5, 0, 0]} animationDuration={900} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Tarjeta>

      {/* Categorías */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Tarjeta titulo="Ingresos por categoría" icono={Tags} color="bg-emerald-100 text-emerald-700" accion={<span className="text-[11px] text-slate-400">clic para filtrar</span>}>
          <ListaBarras filas={ingCat} total={totIng} activo={filtroCat} onClick={(k) => setFiltroCat((f) => (f === k ? "" : k))} />
        </Tarjeta>
        <Tarjeta titulo="Egresos por categoría" icono={Tags} color="bg-rose-100 text-rose-700" accion={<span className="text-[11px] text-slate-400">clic para filtrar</span>}>
          <ListaBarras filas={egrCat} total={totEgr} activo={filtroCat} colorDe={(_, i) => ["#f43f5e", "#f97316", "#f59e0b", "#a855f7", "#64748b", "#38bdf8", "#84cc16"][i % 7]} onClick={(k) => setFiltroCat((f) => (f === k ? "" : k))} />
        </Tarjeta>
      </div>

      {/* Medios de pago */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          ["Cobros por medio de pago", ingMet, totIng],
          ["Pagos por medio de pago", egrMet, totEgr],
        ].map(([t, filas, total]) => (
          <Tarjeta key={t} titulo={t} icono={CreditCard} color="bg-indigo-100 text-indigo-700">
            <div className="grid grid-cols-5 gap-3 items-center">
              <div className="col-span-2 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={filas} dataKey="valor" nameKey="nombre" innerRadius="55%" outerRadius="90%" paddingAngle={3} animationDuration={1000} onClick={(d) => setFiltroMetodo((f) => (f === d.clave ? "" : d.clave))} className="cursor-pointer">
                      {filas.map((f) => (
                        <Cell key={f.clave} fill={COLOR_METODO[f.clave] || "#94a3b8"} stroke="none" opacity={!filtroMetodo || filtroMetodo === f.clave ? 1 : 0.35} />
                      ))}
                    </Pie>
                    <Tooltip content={<TooltipSoles />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="col-span-3">
                <ListaBarras filas={filas} total={total} activo={filtroMetodo} colorDe={(f) => COLOR_METODO[f.clave] || "#94a3b8"} onClick={(k) => setFiltroMetodo((f) => (f === k ? "" : k))} />
              </div>
            </div>
          </Tarjeta>
        ))}
      </div>

      {/* Día de la semana y quién registró */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Tarjeta titulo="Movimiento por día de la semana" icono={CalendarDays} color="bg-amber-100 text-amber-700">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porSemana} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={solesCorto} />
                <Tooltip content={<TooltipSoles />} cursor={{ fill: "rgba(14,167,179,0.08)" }} />
                <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} animationDuration={900} />
                <Bar dataKey="egresos" name="Egresos" fill="#f43f5e" radius={[6, 6, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tarjeta>
        <Tarjeta titulo="Por quién registró y por turno de caja" icono={Users} color="bg-sky-100 text-sky-700">
          <p className="text-[11px] font-bold uppercase text-slate-400 mb-1">Usuario que registró (ingresos y egresos)</p>
          <ListaBarras filas={porUsuario} total={sumar(lista)} colorDe={(_, i) => PALETA[(i + 3) % PALETA.length]} />
          <p className="text-[11px] font-bold uppercase text-slate-400 mt-3 mb-1">Cobros por turno de caja</p>
          <ListaBarras filas={porTurno.slice(0, 6)} total={totIng} colorDe={(_, i) => PALETA[(i + 5) % PALETA.length]} />
        </Tarjeta>
      </div>

      {/* Mayores movimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          ["Mayores ingresos", topIng, "text-emerald-600", "bg-emerald-100 text-emerald-700"],
          ["Mayores gastos", topEgr, "text-rose-600", "bg-rose-100 text-rose-700"],
        ].map(([t, filas, colorMonto, colorIcono]) => (
          <Tarjeta key={t} titulo={t} icono={Trophy} color={colorIcono}>
            <div className="divide-y divide-slate-100">
              {filas.length === 0 && <p className="text-xs text-slate-400 py-6 text-center">Sin movimientos en este periodo.</p>}
              {filas.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3 py-2 text-xs">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate">{m.description || NOMBRE_CATEGORIA[m.category]}</p>
                    <p className="text-slate-400">
                      {fCorta(m.date)} · {NOMBRE_CATEGORIA[m.category] || m.category} · {NOMBRE_METODO[m.paymentMethod] || "—"}
                      {m.registeredBy ? ` · ${m.registeredBy}` : ""}
                    </p>
                  </div>
                  <b className={`whitespace-nowrap ${colorMonto}`}>{soles(m.amount)}</b>
                </div>
              ))}
            </div>
          </Tarjeta>
        ))}
      </div>
    </div>
  );
};
