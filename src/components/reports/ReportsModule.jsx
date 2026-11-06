// ============================================================
// REPORTES (administración)
// Filtra alumnos, matrículas, ingresos, asistencias y metas; lo que
// queda en pantalla se exporta a Excel/PDF o se envía por WhatsApp.
// ============================================================
import React, { useEffect, useMemo, useState } from "react";
import {
  FileBarChart,
  Users,
  CreditCard,
  Wallet,
  UserCheck,
  Trophy,
  Search,
  FileSpreadsheet,
  FileText,
  Send,
  RefreshCw,
  X,
  Filter,
  HandCoins,
  MessageCircle,
  Snowflake,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie, Legend } from "recharts";
import { enlaceRecordatorioDeuda } from "../members/DebtDueDate";
import { useGym } from "../../context/GymContext";
import { api } from "../../api/cliente";
import { hoyISO } from "../../utils/fecha";
import { crearExcel, crearPDF, descargar, enviarPorWhatsApp } from "../../utils/exportar";
import { TelWhatsApp } from "../common/TelWhatsApp";

const soles = (n) => `S/ ${Number(n || 0).toFixed(2)}`;
const fCorta = (f) => (f ? `${String(f).slice(8, 10)}/${String(f).slice(5, 7)}/${String(f).slice(0, 4)}` : "");
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const nombreMes = (m) => (m ? `${MESES[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}` : "");
const sumarDias = (f, n) => {
  const d = new Date(`${f}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const finDeMes = (m) => {
  const [a, mm] = m.split("-").map(Number);
  return new Date(Date.UTC(a, mm, 0)).toISOString().slice(0, 10);
};
const METODO = { efectivo: "Efectivo", yape_plin: "Yape/Plin", tarjeta: "Tarjeta", transferencia: "Transferencia" };
const CATEGORIA = {
  matricula: "Matrículas", venta: "Tienda", entrenamiento_personal: "Entrenamiento personal", fisioterapia: "Fisioterapia",
  nutricion: "Nutrición", insumos: "Insumos", sueldo: "Sueldos/bonos", mantenimiento: "Mantenimiento", servicios: "Servicios",
  alquiler: "Alquiler", marketing: "Marketing", averia_equipo: "Avería de equipo", otros: "Otros",
};
const COLORES = ["#0c8794", "#16a34a", "#f59e0b", "#db2777", "#7c3aed", "#0891b2", "#dc2626", "#65a30d"];
const EDADES = {
  menores: ["Menores de edad (<18)", 0, 17],
  jovenes: ["Jóvenes (18-29)", 18, 29],
  adultos: ["Adultos (30-59)", 30, 59],
  mayores: ["Adultos mayores (60+)", 60, 200],
  mayores_edad: ["Mayores de edad (18+)", 18, 200],
};

// ---------- piezas de interfaz ----------
// Un filtro con valor elegido se resalta para ver de un vistazo qué está aplicado
const Sel = ({ label, value, onChange, children }) => {
  const activo = value !== "" && value !== "todos" && value != null;
  return (
    <label className="block text-xs">
      <span className={`font-bold flex items-center gap-1 ${activo ? "text-blue-700" : "text-slate-500"}`}>
        {activo && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-0.5 w-full px-2 py-1.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
          activo ? "border-blue-400 bg-blue-50 text-blue-900 font-semibold" : "border-slate-200 bg-white"
        }`}
      >
        {children}
      </select>
    </label>
  );
};

// Color de cada atajo según lo que filtra
const TONOS_CHIP = {
  rose: ["bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100", "bg-rose-600 border-rose-600 text-white", "bg-rose-500"],
  amber: ["bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100", "bg-amber-500 border-amber-500 text-white", "bg-amber-500"],
  emerald: ["bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100", "bg-emerald-600 border-emerald-600 text-white", "bg-emerald-500"],
  sky: ["bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100", "bg-sky-600 border-sky-600 text-white", "bg-sky-500"],
  pink: ["bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100", "bg-pink-600 border-pink-600 text-white", "bg-pink-500"],
  indigo: ["bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100", "bg-indigo-600 border-indigo-600 text-white", "bg-indigo-500"],
  violet: ["bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100", "bg-violet-600 border-violet-600 text-white", "bg-violet-500"],
  orange: ["bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100", "bg-orange-500 border-orange-500 text-white", "bg-orange-500"],
  fuchsia: ["bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100", "bg-fuchsia-600 border-fuchsia-600 text-white", "bg-fuchsia-500"],
  slate: ["bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100", "bg-slate-700 border-slate-700 text-white", "bg-slate-400"],
  blue: ["bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100", "bg-blue-600 border-blue-600 text-white", "bg-blue-500"],
};
const tonoDeTexto = (t) => {
  const x = String(t).toLowerCase();
  if (/vencid|moros|deuda|pendiente|sin pagar/.test(x)) return "rose";
  if (/por vencer|vencen|parcial|caducan/.test(x)) return "amber";
  if (/congel|vuelven|empiezan|programad/.test(x)) return "sky";
  if (/mujer/.test(x)) return "pink";
  if (/varon|varón/.test(x)) return "indigo";
  if (/menor|joven|mayor/.test(x)) return "violet";
  if (/sin entrenador|no vienen|anulad|terminad/.test(x)) return "orange";
  if (/cumple/.test(x)) return "fuchsia";
  if (/activo|pagad|cumplid|al día/.test(x)) return "emerald";
  if (/^todo/.test(x)) return "slate";
  return "blue";
};
const textoPlano = (n) => (Array.isArray(n) ? n.map(textoPlano).join("") : typeof n === "object" && n ? textoPlano(n.props?.children) : String(n ?? ""));
const Chip = ({ activo, onClick, children, tono }) => {
  const [suave, fuerte, punto] = TONOS_CHIP[tono || tonoDeTexto(textoPlano(children))];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer border inline-flex items-center gap-1.5 transition-all ${
        activo ? `${fuerte} shadow-sm scale-[1.03]` : suave
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${activo ? "bg-white" : punto}`} />
      {children}
    </button>
  );
};

// Grupo de filtros con cabecera de color
const COLOR_GRUPO = {
  blue: "border-blue-200 bg-blue-50/50 text-blue-700",
  violet: "border-violet-200 bg-violet-50/50 text-violet-700",
  orange: "border-orange-200 bg-orange-50/50 text-orange-700",
};
const Grupo = ({ titulo, color = "blue", children }) => (
  <fieldset className={`rounded-xl border p-3 space-y-2 ${COLOR_GRUPO[color]}`}>
    <legend className="px-2.5 py-0.5 rounded-full bg-white border border-current text-[11px] font-black uppercase tracking-wider">{titulo}</legend>
    {children}
  </fieldset>
);

// Tarjeta de indicador con franja de color según el tono
const BORDE_TONO = { rose: "border-l-rose-500", emerald: "border-l-emerald-500", amber: "border-l-amber-500", blue: "border-l-blue-500", indigo: "border-l-indigo-500", sky: "border-l-sky-500", slate: "border-l-slate-300" };
const FONDO_TONO = { rose: "bg-rose-500", emerald: "bg-emerald-500", amber: "bg-amber-500", blue: "bg-blue-500", indigo: "bg-indigo-500", sky: "bg-sky-500", slate: "bg-slate-400" };
const Kpi = ({ label, value, tone = "text-slate-900" }) => {
  const color = Object.keys(BORDE_TONO).find((k) => tone.includes(k)) || "blue";
  return (
    <div className={`relative overflow-hidden bg-white rounded-xl border border-slate-200 border-l-4 ${BORDE_TONO[color]} px-3 py-2.5 shadow-sm`}>
      <span className={`pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full opacity-15 ${FONDO_TONO[color]}`} />
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">{label}</span>
      <span className={`text-xl font-black ${tone}`}>{value}</span>
    </div>
  );
};
const Barras = ({ datos, valor = "valor", nombre = "nombre", formato, alto = 220 }) => (
  <div style={{ height: alto }}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={datos} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={nombre} tick={{ fontSize: 11 }} interval={0} angle={datos.length > 6 ? -25 : 0} textAnchor={datos.length > 6 ? "end" : "middle"} height={datos.length > 6 ? 60 : 30} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => (formato ? formato(v) : v)} />
        <Bar dataKey={valor} radius={[6, 6, 0, 0]}>
          {datos.map((_, i) => (
            <Cell key={i} fill={COLORES[i % COLORES.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// Selector de periodo reutilizable
const Periodo = ({ desde, hasta, setRango }) => {
  const h = hoyISO();
  const mes = h.slice(0, 7);
  const lunes = sumarDias(h, -((new Date(`${h}T12:00:00`).getDay() + 6) % 7));
  const mesAnt = (() => {
    const d = new Date(`${mes}-15T12:00:00`);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  })();
  const opciones = [
    ["Hoy", h, h],
    ["Ayer", sumarDias(h, -1), sumarDias(h, -1)],
    ["Esta semana", lunes, h],
    ["Este mes", `${mes}-01`, h],
    ["Mes anterior", `${mesAnt}-01`, finDeMes(mesAnt)],
    ["Últimos 90 días", sumarDias(h, -89), h],
  ];
  return (
    <div className="flex flex-wrap items-end gap-1.5">
      {opciones.map(([l, a, b]) => (
        <Chip key={l} activo={desde === a && hasta === b} onClick={() => setRango(a, b)}>
          {l}
        </Chip>
      ))}
      <label className="text-xs">
        <span className="font-bold text-slate-500 block">Mes</span>
        <input
          type="month"
          value={desde.slice(0, 7) === hasta.slice(0, 7) && desde.endsWith("-01") ? desde.slice(0, 7) : ""}
          onChange={(e) => e.target.value && setRango(`${e.target.value}-01`, finDeMes(e.target.value))}
          className="px-2 py-1 rounded-lg border border-slate-300 text-sm"
        />
      </label>
      <label className="text-xs">
        <span className="font-bold text-slate-500 block">Desde</span>
        <input type="date" value={desde} max={hasta} onChange={(e) => setRango(e.target.value, hasta)} className="px-2 py-1 rounded-lg border border-slate-300 text-sm" />
      </label>
      <label className="text-xs">
        <span className="font-bold text-slate-500 block">Hasta</span>
        <input type="date" value={hasta} min={desde} onChange={(e) => setRango(desde, e.target.value)} className="px-2 py-1 rounded-lg border border-slate-300 text-sm" />
      </label>
    </div>
  );
};

// Tabla genérica (muestra hasta 500 filas; la exportación lleva todas)
// Colores de estado (pastilla y franja de la fila)
const ESTILO_ESTADO = {
  Activo: ["bg-emerald-100 text-emerald-800 border-emerald-200", "border-l-emerald-500"],
  Activa: ["bg-emerald-100 text-emerald-800 border-emerald-200", "border-l-emerald-500"],
  "Por vencer": ["bg-amber-100 text-amber-800 border-amber-200", "border-l-amber-500"],
  Vencido: ["bg-rose-100 text-rose-800 border-rose-200", "border-l-rose-500"],
  Vencida: ["bg-rose-100 text-rose-800 border-rose-200", "border-l-rose-500"],
  Congelado: ["bg-sky-100 text-sky-800 border-sky-200", "border-l-sky-500"],
  Congelada: ["bg-sky-100 text-sky-800 border-sky-200", "border-l-sky-500"],
  Programado: ["bg-indigo-100 text-indigo-800 border-indigo-200", "border-l-indigo-500"],
  "En plazo": ["bg-blue-100 text-blue-800 border-blue-200", "border-l-blue-500"],
  Cumplido: ["bg-slate-100 text-slate-600 border-slate-200", "border-l-slate-300"],
  "Terminado antes": ["bg-amber-100 text-amber-800 border-amber-200", "border-l-amber-500"],
  Anulado: ["bg-rose-50 text-rose-700 border-rose-200", "border-l-rose-300"],
  Anulada: ["bg-rose-50 text-rose-700 border-rose-200", "border-l-rose-300"],
  "Sin matrícula": ["bg-slate-100 text-slate-500 border-slate-200", "border-l-slate-300"],
  "Sin fecha": ["bg-slate-100 text-slate-500 border-slate-200", "border-l-slate-300"],
  "De baja": ["bg-slate-200 text-slate-600 border-slate-300", "border-l-slate-400"],
  Cumplida: ["bg-emerald-100 text-emerald-800 border-emerald-200", "border-l-emerald-500"],
  "En curso": ["bg-blue-100 text-blue-800 border-blue-200", "border-l-blue-500"],
};
const DINERO = ["deuda", "saldo", "monto", "pagado", "precio", "total", "cobrado", "pendiente"];

const Tabla = ({ columnas, filas, franja: franjaFila }) => (
  <div className="overflow-x-auto max-h-[520px] overflow-y-auto rounded-xl border border-slate-200">
    <table className="w-full text-sm border-collapse">
      <thead className="sticky top-0 z-10">
        <tr className="text-left text-[11px] uppercase tracking-wide text-blue-900 bg-blue-50 border-b-2 border-blue-200">
          {columnas.map((c) => (
            <th key={c.key} className={`py-2.5 px-3 whitespace-nowrap font-bold ${DINERO.includes(c.key) ? "text-right" : ""}`}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filas.slice(0, 500).map((f, i) => {
          const franja = (franjaFila && franjaFila(f)) || ESTILO_ESTADO[f.estado]?.[1] || "border-l-transparent";
          return (
            <tr key={f.id || i} className={`border-b border-slate-100 hover:bg-blue-50/50 ${i % 2 ? "bg-slate-50/60" : "bg-white"}`}>
              {columnas.map((c, k) => {
                const pastilla = c.key === "estado" && !c.ver && ESTILO_ESTADO[f.estado];
                return (
                  <td
                    key={c.key}
                    className={`py-2 px-3 whitespace-nowrap ${k === 0 ? `border-l-4 ${franja}` : ""} ${DINERO.includes(c.key) ? "text-right tabular-nums" : ""} ${
                      pastilla ? "" : c.clase ? c.clase(f) : "text-slate-700"
                    }`}
                  >
                    {pastilla ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-bold ${ESTILO_ESTADO[f.estado][0]}`}>{f.estado}</span>
                    ) : c.ver ? (
                      c.ver(f)
                    ) : c.excel ? (
                      c.excel(f)
                    ) : c.key === "telefono" && f.telefono ? (
                      <TelWhatsApp tel={f.telefono} />
                    ) : (
                      f[c.key]
                    )}
                  </td>
                );
              })}
            </tr>
          );
        })}
        {filas.length === 0 && (
          <tr>
            <td colSpan={columnas.length} className="py-10 text-center text-slate-500">
              Ningún registro coincide con los filtros.
            </td>
          </tr>
        )}
      </tbody>
    </table>
    {filas.length > 500 && <p className="text-xs text-slate-500 p-2 bg-slate-50">Se muestran 500 de {filas.length}. La exportación incluye todos.</p>}
  </div>
);

// Barra de exportación: solo lo filtrado
const Exportar = ({ titulo, filtros, columnas, filas, totales }) => {
  const { gymConfig } = useGym();
  const [trabajando, setTrabajando] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [formato, setFormato] = useState("excel");
  // Las columnas de acción (botones) solo se ven en pantalla
  const datos = { titulo, filtros, columnas: columnas.filter((c) => !c.soloPantalla), filas, totales, gimnasio: gymConfig?.gym_nombre || "RADICAL" };
  const crear = (f) => (f === "excel" ? crearExcel(datos) : crearPDF(datos));
  const hacer = async (accion) => {
    if (!filas.length) return setMensaje("No hay filas para exportar con estos filtros.");
    setTrabajando(accion);
    setMensaje("");
    try {
      if (accion === "excel" || accion === "pdf") {
        descargar(await crear(accion));
      } else {
        const archivo = await crear(formato);
        const r = await enviarPorWhatsApp(
          archivo,
          gymConfig?.admin_whatsapp,
          `${datos.gimnasio} · ${titulo} (${filas.length} registros)${filtros.length ? `\nFiltros: ${filtros.join(" · ")}` : ""}`,
        );
        if (r === "descargado")
          setMensaje(
            gymConfig?.admin_whatsapp
              ? "Se descargó el archivo y se abrió el chat del administrador: arrástralo al chat para enviarlo."
              : "Se descargó el archivo. Configura el WhatsApp del administrador en Usuarios & Accesos > Configuración.",
          );
      }
    } catch (e) {
      setMensaje(`No se pudo generar: ${e.message}`);
    } finally {
      setTrabajando("");
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-500 font-bold">{filas.length} registro(s)</span>
      <button onClick={() => hacer("excel")} disabled={!!trabajando} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60">
        <FileSpreadsheet className="w-3.5 h-3.5" /> {trabajando === "excel" ? "Generando…" : "Excel"}
      </button>
      <button onClick={() => hacer("pdf")} disabled={!!trabajando} className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60">
        <FileText className="w-3.5 h-3.5" /> {trabajando === "pdf" ? "Generando…" : "PDF"}
      </button>
      <div className="flex items-center rounded-lg border border-green-600 overflow-hidden">
        <select value={formato} onChange={(e) => setFormato(e.target.value)} className="px-1.5 py-1.5 text-xs bg-white border-r border-green-600">
          <option value="excel">Excel</option>
          <option value="pdf">PDF</option>
        </select>
        <button onClick={() => hacer("wpp")} disabled={!!trabajando} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60">
          <Send className="w-3.5 h-3.5" /> {trabajando === "wpp" ? "Preparando…" : "WhatsApp del administrador"}
        </button>
      </div>
      {mensaje && <span className="text-xs text-slate-600 w-full">{mensaje}</span>}
    </div>
  );
};

// ============================================================
// 1. ALUMNOS
// ============================================================
const ReporteAlumnos = () => {
  const { plans, trainers } = useGym();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [f, setF] = useState({
    estado: "todos", plan: "", sexo: "", edad: "", edadMin: "", edadMax: "", deuda: "", entrenador: "", objetivo: "",
    registro: "", mesRegistro: "", sinAsistir: "", cumple: false, restricciones: false, venceDesde: "", venceHasta: "", texto: "",
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const cargar = () => api("/reportes/alumnos").then(setDatos).catch((e) => setError(e.message));
  useEffect(() => {
    cargar();
  }, []);

  const h = hoyISO();
  const filas = useMemo(() => {
    if (!datos) return [];
    return datos.filter((a) => {
      if (f.estado !== "todos" && a.estado !== f.estado) return false;
      if (f.plan && a.planId !== f.plan) return false;
      if (f.sexo && a.sexo !== f.sexo) return false;
      if (f.edad) {
        const [, min, max] = EDADES[f.edad];
        if (a.edad == null || a.edad < min || a.edad > max) return false;
      }
      if (f.edadMin !== "" && (a.edad == null || a.edad < Number(f.edadMin))) return false;
      if (f.edadMax !== "" && (a.edad == null || a.edad > Number(f.edadMax))) return false;
      if (f.deuda === "si" && !(a.deuda > 0)) return false;
      if (f.deuda === "no" && a.deuda > 0) return false;
      if (f.entrenador === "ninguno" && a.entrenadorId) return false;
      if (f.entrenador && f.entrenador !== "ninguno" && a.entrenadorId !== f.entrenador) return false;
      if (f.objetivo && a.objetivo !== f.objetivo) return false;
      if (f.registro === "hoy" && a.registro !== h) return false;
      if (f.registro === "mes" && String(a.registro).slice(0, 7) !== (f.mesRegistro || h.slice(0, 7))) return false;
      if (f.sinAsistir) {
        const limite = sumarDias(h, -Number(f.sinAsistir));
        if (a.ultimaAsistencia && a.ultimaAsistencia > limite) return false;
      }
      if (f.cumple && (!a.fechaNacimiento || String(a.fechaNacimiento).slice(5, 7) !== h.slice(5, 7))) return false;
      if (f.restricciones && !a.restricciones) return false;
      if (f.venceDesde && (!a.vence || a.vence < f.venceDesde)) return false;
      if (f.venceHasta && (!a.vence || a.vence > f.venceHasta)) return false;
      if (f.texto && !`${a.codigo} ${String(a.codigo).replace("-", "")} ${a.nombre} ${a.dni} ${a.telefono}`.toLowerCase().includes(f.texto.toLowerCase())) return false;
      return true;
    });
  }, [datos, f, h]);

  const descripcion = useMemo(() => {
    const d = [];
    if (f.estado !== "todos") d.push(`Estado: ${f.estado}`);
    if (f.plan) d.push(`Plan: ${plans.find((p) => p.id === f.plan)?.name || f.plan}`);
    if (f.sexo) d.push(f.sexo === "Mujer" ? "Mujeres" : "Varones");
    if (f.edad) d.push(EDADES[f.edad][0]);
    if (f.edadMin !== "" || f.edadMax !== "") d.push(`Edad ${f.edadMin || 0}-${f.edadMax || "+"}`);
    if (f.deuda) d.push(f.deuda === "si" ? "Con deuda" : "Sin deuda");
    if (f.entrenador) d.push(`Entrenador: ${f.entrenador === "ninguno" ? "sin asignar" : trainers.find((t) => t.id === f.entrenador)?.name}`);
    if (f.objetivo) d.push(`Objetivo: ${f.objetivo}`);
    if (f.registro === "hoy") d.push("Matriculados hoy");
    if (f.registro === "mes") d.push(`Inscritos en ${nombreMes(f.mesRegistro || h.slice(0, 7))}`);
    if (f.sinAsistir) d.push(`Sin asistir ${f.sinAsistir}+ días`);
    if (f.cumple) d.push("Cumpleaños este mes");
    if (f.restricciones) d.push("Con restricciones médicas");
    if (f.venceDesde || f.venceHasta) d.push(`Vence ${fCorta(f.venceDesde) || "…"} a ${fCorta(f.venceHasta) || "…"}`);
    if (f.texto) d.push(`Búsqueda: ${f.texto}`);
    return d;
  }, [f, plans, trainers, h]);

  const columnas = [
    { key: "codigo", label: "Código", clase: () => "font-mono font-bold text-blue-700" },
    { key: "dni", label: "DNI" },
    { key: "nombre", label: "Alumno", clase: () => "font-semibold text-slate-900" },
    { key: "sexo", label: "Sexo" },
    { key: "edad", label: "Edad" },
    { key: "telefono", label: "Celular" },
    { key: "plan", label: "Plan" },
    { key: "vence", label: "Vence", excel: (a) => fCorta(a.vence) },
    {
      key: "estado",
      label: "Estado",
      clase: (a) =>
        `font-bold ${a.estado === "Vencido" ? "text-rose-600" : a.estado === "Por vencer" ? "text-amber-600" : a.estado === "Activo" ? "text-emerald-600" : a.estado === "Congelado" ? "text-sky-600" : "text-slate-500"}`,
    },
    {
      key: "congelamiento",
      label: "Congelamiento",
      excel: (a) =>
        a.congeladoHasta
          ? `Congelado hasta ${fCorta(a.congeladoHasta)}`
          : a.congelamientoDias
            ? `Quedan ${a.congelamientoRestante} de ${a.congelamientoDias} días`
            : "Sin derecho",
      clase: (a) => (a.congeladoHasta ? "font-bold text-sky-700" : a.congelamientoDias ? "text-slate-600" : "text-slate-400"),
    },
    { key: "deuda", label: "Deuda", excel: (a) => a.deuda, ver: (a) => (a.deuda > 0 ? soles(a.deuda) : "—"), clase: (a) => (a.deuda > 0 ? "font-bold text-rose-600" : "text-slate-400") },
    { key: "limitePago", label: "Límite de pago", excel: (a) => (a.deuda > 0 ? `${fCorta(a.limitePago)} (${a.estadoDeuda})` : ""), clase: (a) => (a.estadoDeuda === "Vencida" ? "font-bold text-rose-700" : "text-slate-600") },
    { key: "entrenador", label: "Entrenador" },
    { key: "objetivo", label: "Objetivo" },
    { key: "registro", label: "Inscrito", excel: (a) => fCorta(a.registro) },
    { key: "ultimaAsistencia", label: "Última asistencia", excel: (a) => fCorta(a.ultimaAsistencia) || "Nunca" },
    { key: "totalPagado", label: "Total pagado", excel: (a) => a.totalPagado, ver: (a) => soles(a.totalPagado) },
  ];
  const deudaTotal = filas.reduce((s, a) => s + a.deuda, 0);
  const conEdad = filas.filter((a) => a.edad != null);
  const porPlan = Object.entries(filas.reduce((m, a) => ((m[a.plan || "Sin plan"] = (m[a.plan || "Sin plan"] || 0) + 1), m), {}))
    .map(([nombre, valor]) => ({ nombre, valor }))
    .sort((a, b) => b.valor - a.valor);
  const porEdad = Object.entries({ menores: 0, jovenes: 0, adultos: 0, mayores: 0 }).map(([k]) => ({
    nombre: EDADES[k][0].split(" (")[0],
    valor: filas.filter((a) => a.edad != null && a.edad >= EDADES[k][1] && a.edad <= EDADES[k][2]).length,
  }));
  const totales = [
    ["Alumnos", filas.length],
    ["Mujeres", filas.filter((a) => a.sexo === "Mujer").length],
    ["Varones", filas.filter((a) => a.sexo === "Varón").length],
    ["Deuda total", soles(deudaTotal)],
  ];
  const rapido = (cambios) => setF((p) => ({ ...p, ...Object.fromEntries(Object.keys(p).map((k) => [k, k === "estado" ? "todos" : typeof p[k] === "boolean" ? false : ""])), ...cambios }));

  return (
    <div className="space-y-4">
      <div className="rd-filtros bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        {/* Buscar + limpiar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input value={f.texto} onChange={(e) => set("texto", e.target.value)} placeholder="Buscar por código, nombre, DNI o celular" className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm" />
          </div>
          <button type="button" onClick={() => rapido({})} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1 cursor-pointer">
            <X className="w-3.5 h-3.5" /> Limpiar filtros
          </button>
        </div>

        {/* Atajos */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-black text-blue-700 uppercase tracking-wider mr-1 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Atajos</span>
          <Chip activo={f.estado === "Vencido"} onClick={() => rapido({ estado: "Vencido" })}>Vencidos</Chip>
          <Chip activo={f.estado === "Por vencer"} onClick={() => rapido({ estado: "Por vencer" })}>Por vencer (7 días)</Chip>
          <Chip activo={f.deuda === "si"} onClick={() => rapido({ deuda: "si" })}>Con deuda</Chip>
          <Chip activo={f.registro === "hoy"} onClick={() => rapido({ registro: "hoy" })}>Matriculados hoy</Chip>
          <Chip activo={f.registro === "mes"} onClick={() => rapido({ registro: "mes" })}>Inscritos este mes</Chip>
          <Chip activo={f.sinAsistir === "15"} onClick={() => rapido({ sinAsistir: "15", estado: "Activo" })}>Activos que no vienen (15+ días)</Chip>
          <Chip activo={f.cumple} onClick={() => rapido({ cumple: true })}>Cumpleaños del mes</Chip>
          <Chip activo={f.entrenador === "ninguno"} onClick={() => rapido({ entrenador: "ninguno" })}>Sin entrenador</Chip>
          <Chip activo={f.sexo === "Mujer"} onClick={() => rapido({ sexo: "Mujer" })}>Mujeres</Chip>
          <Chip activo={f.sexo === "Varón"} onClick={() => rapido({ sexo: "Varón" })}>Varones</Chip>
          <Chip activo={f.edad === "menores"} onClick={() => rapido({ edad: "menores" })}>Menores de edad</Chip>
          <Chip activo={f.edad === "jovenes"} onClick={() => rapido({ edad: "jovenes" })}>Jóvenes</Chip>
          <Chip activo={f.edad === "mayores_edad"} onClick={() => rapido({ edad: "mayores_edad" })}>Mayores de edad</Chip>
        </div>

        {/* Filtros detallados por grupo */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Grupo titulo="Membresía" color="blue">
            <div className="grid grid-cols-2 gap-2">
              <Sel label="Estado" value={f.estado} onChange={(v) => set("estado", v)}>
                {["todos", "Activo", "Por vencer", "Vencido", "Congelado", "Sin matrícula", "De baja"].map((x) => (
                  <option key={x} value={x}>{x === "todos" ? "Todos" : x}</option>
                ))}
              </Sel>
              <Sel label="Plan / paquete" value={f.plan} onChange={(v) => set("plan", v)}>
                <option value="">Todos</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Sel>
              <Sel label="Deuda" value={f.deuda} onChange={(v) => set("deuda", v)}>
                <option value="">Todos</option>
                <option value="si">Con deuda pendiente</option>
                <option value="no">Sin deuda</option>
              </Sel>
              <span />
              <label className="block text-xs">
                <span className="font-bold text-slate-500">Vence desde</span>
                <input type="date" value={f.venceDesde} onChange={(e) => set("venceDesde", e.target.value)} className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm" />
              </label>
              <label className="block text-xs">
                <span className="font-bold text-slate-500">Vence hasta</span>
                <input type="date" value={f.venceHasta} onChange={(e) => set("venceHasta", e.target.value)} className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm" />
              </label>
            </div>
          </Grupo>

          <Grupo titulo="Alumno" color="violet">
            <div className="grid grid-cols-2 gap-2">
              <Sel label="Sexo" value={f.sexo} onChange={(v) => set("sexo", v)}>
                <option value="">Todos</option>
                <option value="Mujer">Mujeres</option>
                <option value="Varón">Varones</option>
              </Sel>
              <Sel label="Grupo de edad" value={f.edad} onChange={(v) => set("edad", v)}>
                <option value="">Todas</option>
                {Object.entries(EDADES).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
              </Sel>
              <label className="block text-xs">
                <span className="font-bold text-slate-500">Edad desde</span>
                <input type="number" min="0" placeholder="Ej. 18" value={f.edadMin} onChange={(e) => set("edadMin", e.target.value)} className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm" />
              </label>
              <label className="block text-xs">
                <span className="font-bold text-slate-500">Edad hasta</span>
                <input type="number" min="0" placeholder="Ej. 35" value={f.edadMax} onChange={(e) => set("edadMax", e.target.value)} className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm" />
              </label>
              <label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-slate-600 pt-1">
                <input type="checkbox" checked={f.restricciones} onChange={(e) => set("restricciones", e.target.checked)} className="accent-blue-600" /> Con restricciones médicas
              </label>
              <label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
                <input type="checkbox" checked={f.cumple} onChange={(e) => set("cumple", e.target.checked)} className="accent-blue-600" /> Cumpleaños este mes
              </label>
            </div>
          </Grupo>

          <Grupo titulo="Actividad" color="orange">
            <div className="grid grid-cols-2 gap-2">
              <Sel label="Entrenador" value={f.entrenador} onChange={(v) => set("entrenador", v)}>
                <option value="">Todos</option>
                <option value="ninguno">Sin entrenador</option>
                {trainers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Sel>
              <Sel label="Objetivo" value={f.objetivo} onChange={(v) => set("objetivo", v)}>
                <option value="">Todos</option>
                {["Hipertrofia", "Pérdida de peso", "Fuerza", "Resistencia", "Tonificación", "Rehabilitación"].map((o) => <option key={o}>{o}</option>)}
              </Sel>
              <Sel label="Inscripción" value={f.registro} onChange={(v) => set("registro", v)}>
                <option value="">Cualquier fecha</option>
                <option value="hoy">Hoy</option>
                <option value="mes">En un mes…</option>
              </Sel>
              <Sel label="Sin asistir" value={f.sinAsistir} onChange={(v) => set("sinAsistir", v)}>
                <option value="">—</option>
                <option value="7">7+ días</option>
                <option value="15">15+ días</option>
                <option value="30">30+ días</option>
              </Sel>
              {f.registro === "mes" && (
                <label className="block text-xs col-span-2">
                  <span className="font-bold text-slate-500">Mes de inscripción</span>
                  <input type="month" value={f.mesRegistro || h.slice(0, 7)} onChange={(e) => set("mesRegistro", e.target.value)} className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm" />
                </label>
              )}
            </div>
          </Grupo>
        </div>
      </div>

      {error && <p className="text-rose-600 font-bold text-sm">{error}</p>}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi label="Alumnos" value={filas.length} />
        <Kpi label="Mujeres / Varones" value={`${filas.filter((a) => a.sexo === "Mujer").length} / ${filas.filter((a) => a.sexo === "Varón").length}`} />
        <Kpi label="Edad promedio" value={conEdad.length ? Math.round(conEdad.reduce((s, a) => s + a.edad, 0) / conEdad.length) : "—"} />
        <Kpi label="Con deuda" value={filas.filter((a) => a.deuda > 0).length} tone="text-rose-600" />
        <Kpi label="Deuda total" value={soles(deudaTotal)} tone="text-rose-600" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Alumnos por plan</h4>
          <Barras datos={porPlan} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Alumnos por edad</h4>
          <Barras datos={porEdad} />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-black text-slate-900">Alumnos {descripcion.length ? `· ${descripcion.join(" · ")}` : ""}</h4>
          <Exportar titulo="Reporte de alumnos" filtros={descripcion} columnas={columnas} filas={filas} totales={totales} />
        </div>
        {!datos ? <p className="text-slate-500 text-sm">Cargando…</p> : <Tabla columnas={columnas} filas={filas} />}
      </div>
    </div>
  );
};

// ============================================================
// 2. MATRÍCULAS Y PAQUETES
// ============================================================
const ReporteMatriculas = () => {
  const { plans } = useGym();
  const h = hoyISO();
  const [desde, setDesde] = useState(`${h.slice(0, 7)}-01`);
  const [hasta, setHasta] = useState(h);
  const [datos, setDatos] = useState(null);
  const [f, setF] = useState({ plan: "", tipo: "", metodo: "", saldo: "", sexo: "", usuario: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  useEffect(() => {
    setDatos(null);
    api(`/reportes/matriculas?desde=${desde}&hasta=${hasta}`).then((r) => setDatos(r.filas)).catch(() => setDatos([]));
  }, [desde, hasta]);

  const filas = useMemo(
    () =>
      (datos || []).filter(
        (m) =>
          m.estado !== "anulada" &&
          (!f.plan || m.planId === f.plan) &&
          (!f.tipo || m.tipo === f.tipo) &&
          (!f.metodo || m.metodo === f.metodo) &&
          (!f.saldo || (f.saldo === "si" ? m.saldo > 0 : m.saldo === 0)) &&
          (!f.sexo || m.sexo === f.sexo) &&
          (!f.usuario || m.registradoPor === f.usuario),
      ),
    [datos, f],
  );
  const usuarios = [...new Set((datos || []).map((m) => m.registradoPor).filter(Boolean))];
  const ranking = Object.values(
    filas.reduce((acc, m) => {
      acc[m.plan] = acc[m.plan] || { nombre: m.plan, valor: 0, monto: 0 };
      acc[m.plan].valor++;
      acc[m.plan].monto += m.precio;
      return acc;
    }, {}),
  ).sort((a, b) => b.valor - a.valor);
  const porDia = Object.entries(filas.reduce((m, x) => ((m[x.dia] = (m[x.dia] || 0) + 1), m), {}))
    .sort()
    .map(([dia, valor]) => ({ nombre: fCorta(dia).slice(0, 5), valor }));
  const descripcion = [
    `Del ${fCorta(desde)} al ${fCorta(hasta)}`,
    ...(f.plan ? [`Plan: ${plans.find((p) => p.id === f.plan)?.name}`] : []),
    ...(f.tipo ? [f.tipo] : []),
    ...(f.metodo ? [METODO[f.metodo]] : []),
    ...(f.saldo ? [f.saldo === "si" ? "Con saldo pendiente" : "Pagadas completas"] : []),
    ...(f.sexo ? [f.sexo === "Mujer" ? "Mujeres" : "Varones"] : []),
    ...(f.usuario ? [`Registró: ${f.usuario}`] : []),
  ];
  const columnas = [
    { key: "fecha", label: "Fecha", excel: (m) => `${fCorta(m.fecha)} ${String(m.fecha).slice(11, 16)}` },
    { key: "dni", label: "DNI" },
    { key: "alumno", label: "Alumno", clase: () => "font-semibold text-slate-900" },
    { key: "sexo", label: "Sexo" },
    { key: "edad", label: "Edad" },
    { key: "plan", label: "Plan" },
    {
      key: "tipo",
      label: "Tipo",
      ver: (m) => (
        <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-bold ${m.tipo === "Renovación" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
          {m.tipo}
        </span>
      ),
    },
    { key: "inicio", label: "Inicio", excel: (m) => fCorta(m.inicio) },
    { key: "vence", label: "Vence", excel: (m) => fCorta(m.vence) },
    { key: "precio", label: "Precio", excel: (m) => m.precio, ver: (m) => soles(m.precio) },
    { key: "pagado", label: "Pagado", excel: (m) => m.pagado, ver: (m) => soles(m.pagado), clase: () => "font-semibold text-emerald-700" },
    { key: "saldo", label: "Saldo", excel: (m) => m.saldo, ver: (m) => (m.saldo > 0 ? soles(m.saldo) : "—"), clase: (m) => (m.saldo > 0 ? "font-bold text-rose-600" : "text-slate-400") },
    { key: "metodo", label: "Método", excel: (m) => METODO[m.metodo] },
    { key: "registradoPor", label: "Registró" },
  ];
  const t = filas.reduce((a, m) => ({ precio: a.precio + m.precio, pagado: a.pagado + m.pagado, saldo: a.saldo + m.saldo }), { precio: 0, pagado: 0, saldo: 0 });
  const totales = [
    ["Matrículas", filas.length],
    ["Nuevas", filas.filter((m) => m.tipo === "Nueva").length],
    ["Renovaciones", filas.filter((m) => m.tipo === "Renovación").length],
    ["Vendido", soles(t.precio)],
    ["Cobrado", soles(t.pagado)],
    ["Saldo pendiente", soles(t.saldo)],
  ];
  return (
    <div className="space-y-4">
      <div className="rd-filtros bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <Periodo desde={desde} hasta={hasta} setRango={(a, b) => { setDesde(a); setHasta(b); }} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <Sel label="Plan / paquete" value={f.plan} onChange={(v) => set("plan", v)}>
            <option value="">Todos</option>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Sel>
          <Sel label="Tipo" value={f.tipo} onChange={(v) => set("tipo", v)}>
            <option value="">Nuevas y renovaciones</option>
            <option value="Nueva">Solo nuevas</option>
            <option value="Renovación">Solo renovaciones</option>
          </Sel>
          <Sel label="Método de pago" value={f.metodo} onChange={(v) => set("metodo", v)}>
            <option value="">Todos</option>
            {Object.entries(METODO).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Sel>
          <Sel label="Pago" value={f.saldo} onChange={(v) => set("saldo", v)}>
            <option value="">Todos</option>
            <option value="si">Con saldo pendiente</option>
            <option value="no">Pagadas completas</option>
          </Sel>
          <Sel label="Sexo" value={f.sexo} onChange={(v) => set("sexo", v)}>
            <option value="">Todos</option>
            <option value="Mujer">Mujeres</option>
            <option value="Varón">Varones</option>
          </Sel>
          <Sel label="Registrado por" value={f.usuario} onChange={(v) => set("usuario", v)}>
            <option value="">Todos</option>
            {usuarios.map((u) => <option key={u}>{u}</option>)}
          </Sel>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {totales.map(([k, v]) => <Kpi key={k} label={k} value={v} tone={k === "Saldo pendiente" ? "text-rose-600" : k === "Cobrado" ? "text-emerald-600" : "text-slate-900"} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Paquetes más comprados</h4>
          <Barras datos={ranking} />
          <ul className="text-xs text-slate-600 mt-2 space-y-0.5">
            {ranking.map((r, i) => (
              <li key={r.nombre}>
                {i + 1}. <strong>{r.nombre}</strong>: {r.valor} matrícula(s) · {soles(r.monto)}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Matrículas por día</h4>
          <Barras datos={porDia} />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-black text-slate-900">Matrículas · {descripcion.join(" · ")}</h4>
          <Exportar titulo="Reporte de matrículas" filtros={descripcion} columnas={columnas} filas={filas} totales={totales} />
        </div>
        {!datos ? <p className="text-slate-500 text-sm">Cargando…</p> : <Tabla columnas={columnas} filas={filas} franja={(m) => (m.saldo > 0 ? "border-l-rose-400" : "border-l-emerald-400")} />}
      </div>
    </div>
  );
};

// ============================================================
// 3. INGRESOS Y EGRESOS (CAJA)
// ============================================================
const ReporteIngresos = () => {
  const h = hoyISO();
  const [desde, setDesde] = useState(`${h.slice(0, 7)}-01`);
  const [hasta, setHasta] = useState(h);
  const [datos, setDatos] = useState(null);
  const [f, setF] = useState({ tipo: "", categoria: "", metodo: "", turno: "", cajero: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  useEffect(() => {
    setDatos(null);
    api(`/reportes/ingresos?desde=${desde}&hasta=${hasta}`).then((r) => setDatos(r.filas)).catch(() => setDatos([]));
  }, [desde, hasta]);
  const filas = useMemo(
    () =>
      (datos || []).filter(
        (m) =>
          (!f.tipo || m.tipo === f.tipo) &&
          (!f.categoria || m.categoria === f.categoria) &&
          (!f.metodo || m.metodo === f.metodo) &&
          (!f.turno || m.turnoRecepcion === f.turno) &&
          (!f.cajero || m.cajero === f.cajero),
      ),
    [datos, f],
  );
  const lista = (k) => [...new Set((datos || []).map((m) => m[k]))].filter(Boolean);
  const ingresos = filas.filter((m) => m.tipo === "Ingreso").reduce((a, m) => a + m.monto, 0);
  const egresos = filas.filter((m) => m.tipo === "Egreso").reduce((a, m) => a + m.monto, 0);
  const porCategoria = Object.entries(filas.filter((m) => m.tipo === "Ingreso").reduce((a, m) => ((a[CATEGORIA[m.categoria] || m.categoria] = (a[CATEGORIA[m.categoria] || m.categoria] || 0) + m.monto), a), {}))
    .map(([nombre, valor]) => ({ nombre, valor: Math.round(valor * 100) / 100 }))
    .sort((a, b) => b.valor - a.valor);
  const porTurno = Object.entries(filas.filter((m) => m.tipo === "Ingreso").reduce((a, m) => ((a[m.turnoRecepcion] = (a[m.turnoRecepcion] || 0) + m.monto), a), {})).map(([nombre, valor]) => ({ nombre, valor: Math.round(valor * 100) / 100 }));
  const descripcion = [
    `Del ${fCorta(desde)} al ${fCorta(hasta)}`,
    ...(f.tipo ? [f.tipo + "s"] : []),
    ...(f.categoria ? [CATEGORIA[f.categoria]] : []),
    ...(f.metodo ? [METODO[f.metodo]] : []),
    ...(f.turno ? [f.turno] : []),
    ...(f.cajero ? [`Cajero: ${f.cajero}`] : []),
  ];
  const columnas = [
    { key: "fecha", label: "Fecha", excel: (m) => `${fCorta(m.fecha)} ${String(m.fecha).slice(11, 16)}` },
    { key: "tipo", label: "Tipo", clase: (m) => (m.tipo === "Ingreso" ? "font-bold text-emerald-600" : "font-bold text-rose-600") },
    { key: "categoria", label: "Categoría", excel: (m) => CATEGORIA[m.categoria] || m.categoria },
    { key: "descripcion", label: "Descripción" },
    { key: "metodo", label: "Método", excel: (m) => METODO[m.metodo] },
    { key: "monto", label: "Monto", excel: (m) => m.monto, ver: (m) => soles(m.monto) },
    { key: "turnoRecepcion", label: "Turno" },
    { key: "cajero", label: "Cajero" },
    { key: "comprobante", label: "Comprobante" },
  ];
  const totales = [["Ingresos", soles(ingresos)], ["Egresos", soles(egresos)], ["Neto", soles(ingresos - egresos)]];
  return (
    <div className="space-y-4">
      <div className="rd-filtros bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <Periodo desde={desde} hasta={hasta} setRango={(a, b) => { setDesde(a); setHasta(b); }} />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Sel label="Tipo" value={f.tipo} onChange={(v) => set("tipo", v)}>
            <option value="">Ingresos y egresos</option>
            <option value="Ingreso">Solo ingresos</option>
            <option value="Egreso">Solo egresos</option>
          </Sel>
          <Sel label="Categoría" value={f.categoria} onChange={(v) => set("categoria", v)}>
            <option value="">Todas</option>
            {lista("categoria").map((c) => <option key={c} value={c}>{CATEGORIA[c] || c}</option>)}
          </Sel>
          <Sel label="Método" value={f.metodo} onChange={(v) => set("metodo", v)}>
            <option value="">Todos</option>
            {Object.entries(METODO).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Sel>
          <Sel label="Turno de recepción" value={f.turno} onChange={(v) => set("turno", v)}>
            <option value="">Todos</option>
            {lista("turnoRecepcion").map((c) => <option key={c}>{c}</option>)}
          </Sel>
          <Sel label="Cajero" value={f.cajero} onChange={(v) => set("cajero", v)}>
            <option value="">Todos</option>
            {lista("cajero").map((c) => <option key={c}>{c}</option>)}
          </Sel>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Ingresos" value={soles(ingresos)} tone="text-emerald-600" />
        <Kpi label="Egresos" value={soles(egresos)} tone="text-rose-600" />
        <Kpi label="Neto" value={soles(ingresos - egresos)} tone="text-blue-700" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Ingresos por categoría</h4>
          <Barras datos={porCategoria} formato={soles} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Ingresos por turno de recepción</h4>
          <Barras datos={porTurno} formato={soles} />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-black text-slate-900">Movimientos · {descripcion.join(" · ")}</h4>
          <Exportar titulo="Reporte de ingresos y egresos" filtros={descripcion} columnas={columnas} filas={filas} totales={totales} />
        </div>
        {!datos ? <p className="text-slate-500 text-sm">Cargando…</p> : <Tabla columnas={columnas} filas={filas} franja={(m) => (m.tipo === "Ingreso" ? "border-l-emerald-400" : "border-l-rose-400")} />}
      </div>
    </div>
  );
};

// ============================================================
// 3b. DEUDAS Y PENDIENTES DE PAGO
// ============================================================
const COLOR_ESTADO = { Vencida: "#dc2626", "Por vencer": "#f59e0b", "En plazo": "#0c8794", "Sin fecha": "#94a3b8" };
const TRAMOS = [
  ["Vencida +30 días", (d) => d < -30],
  ["Vencida 8-30 días", (d) => d < -7 && d >= -30],
  ["Vencida 1-7 días", (d) => d < 0 && d >= -7],
  ["Vence hoy-3 días", (d) => d >= 0 && d <= 3],
  ["Vence 4-15 días", (d) => d > 3 && d <= 15],
  ["Vence +15 días", (d) => d > 15],
];
const ReporteDeudas = () => {
  const { gymConfig } = useGym();
  const h = hoyISO();
  const [datos, setDatos] = useState(null);
  const [desde, setDesde] = useState(`${h.slice(0, 7)}-01`);
  const [hasta, setHasta] = useState(h);
  const [f, setF] = useState({ estado: "", plan: "", vence: "", texto: "", tipo: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  useEffect(() => {
    setDatos(null);
    api(`/reportes/deudas?desde=${desde}&hasta=${hasta}`).then(setDatos).catch(() => setDatos({ deudas: [], cobros: [] }));
  }, [desde, hasta]);
  const todas = datos?.deudas || [];
  const filas = useMemo(() => {
    const t = f.texto.trim().toLowerCase();
    return todas.filter(
      (d) =>
        (!f.estado || d.estado === f.estado) &&
        (!f.plan || d.plan === f.plan) &&
        (!f.tipo || d.tipo === f.tipo) &&
        (!f.vence ||
          (f.vence === "semana" && d.dias >= 0 && d.dias <= 7) ||
          (f.vence === "mes" && d.limite?.slice(0, 7) === h.slice(0, 7)) ||
          (f.vence === "vencidas30" && d.dias < -30)) &&
        (!t || d.alumno.toLowerCase().includes(t) || d.dni.includes(t)),
    );
  }, [todas, f]);
  const total = filas.reduce((a, d) => a + d.saldo, 0);
  const suma = (est) => filas.filter((d) => d.estado === est).reduce((a, d) => a + d.saldo, 0);
  const alumnos = new Set(filas.map((d) => d.alumnoId)).size;
  const cobrado = (datos?.cobros || []).reduce((a, c) => a + c.monto, 0);
  const r2 = (n) => Math.round(n * 100) / 100;
  const porEstado = ["Vencida", "Por vencer", "En plazo", "Sin fecha"]
    .map((e) => ({ nombre: e, valor: r2(suma(e)), n: filas.filter((d) => d.estado === e).length }))
    .filter((x) => x.n > 0);
  const porTramo = TRAMOS.map(([nombre, ok]) => ({ nombre, valor: r2(filas.filter((d) => d.dias != null && ok(d.dias)).reduce((a, d) => a + d.saldo, 0)) }));
  const topDeudores = Object.values(
    filas.reduce((m, d) => ((m[d.alumnoId] = m[d.alumnoId] || { nombre: d.alumno.split(" ").slice(0, 2).join(" "), valor: 0 }), (m[d.alumnoId].valor += d.saldo), m), {}),
  )
    .map((x) => ({ ...x, valor: r2(x.valor) }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);
  const porPlan = Object.entries(filas.reduce((m, d) => ((m[d.plan] = (m[d.plan] || 0) + d.saldo), m), {}))
    .map(([nombre, valor]) => ({ nombre, valor: r2(valor) }))
    .sort((a, b) => b.valor - a.valor);
  const cobrosPorDia = Object.entries((datos?.cobros || []).reduce((m, c) => ((m[c.fecha] = (m[c.fecha] || 0) + c.monto), m), {}))
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([d, valor]) => ({ nombre: fCorta(d).slice(0, 5), valor: r2(valor) }));
  const lista = (k) => [...new Set(todas.map((d) => d[k]))].filter(Boolean).sort();
  const descripcion = [
    `Al ${fCorta(h)}`,
    ...(f.estado ? [`Estado: ${f.estado}`] : []),
    ...(f.vence === "semana" ? ["Vencen en 7 días"] : f.vence === "mes" ? ["Vencen este mes"] : f.vence === "vencidas30" ? ["Vencidas hace más de 30 días"] : []),
    ...(f.plan ? [`Plan: ${f.plan}`] : []),
    ...(f.tipo ? [f.tipo] : []),
    ...(f.texto ? [`Búsqueda: ${f.texto}`] : []),
  ];
  const columnas = [
    { key: "dni", label: "DNI" },
    { key: "alumno", label: "Alumno", clase: () => "font-semibold text-slate-900", excel: (d) => `${d.alumno}${d.deBaja ? " (de baja)" : ""}` },
    { key: "telefono", label: "Celular" },
    { key: "plan", label: "Plan" },
    { key: "tipo", label: "Tipo" },
    { key: "fechaMatricula", label: "Matriculó", excel: (d) => fCorta(d.fechaMatricula) },
    { key: "precio", label: "Precio", excel: (d) => d.precio, ver: (d) => soles(d.precio) },
    { key: "pagado", label: "Pagado", excel: (d) => d.pagado, ver: (d) => soles(d.pagado), clase: () => "text-emerald-700" },
    { key: "saldo", label: "Saldo", excel: (d) => d.saldo, ver: (d) => soles(d.saldo), clase: () => "font-black text-rose-600" },
    { key: "limite", label: "Límite de pago", excel: (d) => `${fCorta(d.limite)}${d.limiteFijado ? "" : " (fin del plan)"}` },
    {
      key: "dias",
      label: "Plazo",
      excel: (d) => (d.dias < 0 ? `Vencida hace ${-d.dias} días` : d.dias === 0 ? "Vence hoy" : `Faltan ${d.dias} días`),
      clase: (d) => (d.dias < 0 ? "font-bold text-rose-700" : d.dias <= 3 ? "font-bold text-amber-600" : "text-slate-600"),
    },
    {
      key: "estado",
      label: "Estado",
      ver: (d) => (
        <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: COLOR_ESTADO[d.estado] }}>
          {d.estado}
        </span>
      ),
    },
    { key: "registradoPor", label: "Registró" },
    {
      key: "wsp",
      label: "Recordar",
      soloPantalla: true,
      ver: (d) => {
        const link = enlaceRecordatorioDeuda({ nombre: d.alumno, telefono: d.telefono, monto: d.saldo, fecha: d.limite, gym: gymConfig?.gym_nombre || "RADICAL" });
        return link ? (
          <a href={link} target="_blank" rel="noreferrer" className="text-emerald-600 font-bold flex items-center gap-1 hover:underline">
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </a>
        ) : (
          "—"
        );
      },
    },
  ];
  const totales = [
    ["Total por cobrar", soles(total)],
    ["Vencido", soles(suma("Vencida"))],
    ["Por vencer (3 días)", soles(suma("Por vencer"))],
    ["Alumnos con deuda", String(alumnos)],
  ];
  return (
    <div className="space-y-4">
      <div className="rd-filtros bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <Chip activo={!f.estado && !f.vence} onClick={() => setF((p) => ({ ...p, estado: "", vence: "" }))}>Todas ({todas.length})</Chip>
          {["Vencida", "Por vencer", "En plazo"].map((e) => (
            <Chip key={e} activo={f.estado === e} onClick={() => set("estado", f.estado === e ? "" : e)}>
              {e === "Vencida" ? "Pago vencido" : e === "Por vencer" ? "Vencen en 3 días" : "En plazo"} ({todas.filter((d) => d.estado === e).length})
            </Chip>
          ))}
          <Chip activo={f.vence === "semana"} onClick={() => set("vence", f.vence === "semana" ? "" : "semana")}>Vencen esta semana</Chip>
          <Chip activo={f.vence === "mes"} onClick={() => set("vence", f.vence === "mes" ? "" : "mes")}>Vencen este mes</Chip>
          <Chip activo={f.vence === "vencidas30"} onClick={() => set("vence", f.vence === "vencidas30" ? "" : "vencidas30")}>Morosos +30 días</Chip>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <label className="block text-xs col-span-2 md:col-span-1">
            <span className="font-bold text-slate-500">Buscar alumno o DNI</span>
            <div className="relative mt-0.5">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
              <input value={f.texto} onChange={(e) => set("texto", e.target.value)} className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-slate-300 text-sm" />
            </div>
          </label>
          <Sel label="Plan" value={f.plan} onChange={(v) => set("plan", v)}>
            <option value="">Todos</option>
            {lista("plan").map((p) => <option key={p}>{p}</option>)}
          </Sel>
          <Sel label="Tipo" value={f.tipo} onChange={(v) => set("tipo", v)}>
            <option value="">Matrículas y renovaciones</option>
            <option>Matrícula</option>
            <option>Renovación</option>
          </Sel>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi label="Total por cobrar" value={soles(total)} tone="text-rose-600" />
        <Kpi label="Vencido" value={soles(suma("Vencida"))} tone="text-rose-700" />
        <Kpi label="Vence en 3 días" value={soles(suma("Por vencer"))} tone="text-amber-600" />
        <Kpi label="Alumnos con deuda" value={alumnos} />
        <Kpi label="Saldos cobrados (periodo)" value={soles(cobrado)} tone="text-emerald-600" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Deuda por estado</h4>
          {porEstado.length === 0 ? (
            <p className="text-sm text-slate-500 py-16 text-center">Sin deudas pendientes 🎉</p>
          ) : (
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, bottom: 4, left: 10, right: 10 }}>
                  <Pie data={porEstado} dataKey="valor" nameKey="nombre" innerRadius={45} outerRadius={72} paddingAngle={2} isAnimationActive={false} label={(e) => soles(e.valor)}>
                    {porEstado.map((e) => (
                      <Cell key={e.nombre} fill={COLOR_ESTADO[e.nombre]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n, p) => [`${soles(v)} · ${p.payload.n} pendiente(s)`, n]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Antigüedad de la deuda (por fecha límite)</h4>
          <Barras datos={porTramo} formato={soles} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Mayores deudores</h4>
          <Barras datos={topDeudores} formato={soles} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Deuda por plan</h4>
          <Barras datos={porPlan} formato={soles} />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-black text-slate-900">Pendientes de pago · {descripcion.join(" · ")}</h4>
          <Exportar titulo="Reporte de deudas y pendientes de pago" filtros={descripcion} columnas={columnas} filas={filas} totales={totales} />
        </div>
        {!datos ? <p className="text-slate-500 text-sm">Cargando…</p> : <Tabla columnas={columnas} filas={filas} />}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-black text-slate-900">Saldos cobrados</h4>
          <Periodo desde={desde} hasta={hasta} setRango={(a, b) => { setDesde(a); setHasta(b); }} />
        </div>
        {cobrosPorDia.length > 0 && <Barras datos={cobrosPorDia} formato={soles} alto={180} />}
        <Tabla
          columnas={[
            { key: "fecha", label: "Fecha", excel: (c) => fCorta(c.fecha) },
            { key: "alumno", label: "Alumno", clase: () => "font-semibold text-slate-900" },
            { key: "plan", label: "Plan" },
            { key: "metodo", label: "Método", excel: (c) => METODO[c.metodo] },
            { key: "monto", label: "Monto", ver: (c) => soles(c.monto), clase: () => "font-bold text-emerald-600" },
            { key: "usuario", label: "Cobró" },
          ]}
          filas={datos?.cobros || []}
        />
      </div>
    </div>
  );
};

// ============================================================
// 4. ASISTENCIAS
// ============================================================
const ReporteAsistencias = () => {
  const h = hoyISO();
  const [desde, setDesde] = useState(sumarDias(h, -6));
  const [hasta, setHasta] = useState(h);
  const [datos, setDatos] = useState(null);
  const [sexo, setSexo] = useState("");
  useEffect(() => {
    setDatos(null);
    api(`/reportes/asistencias?desde=${desde}&hasta=${hasta}`).then((r) => setDatos(r.filas)).catch(() => setDatos([]));
  }, [desde, hasta]);
  const filas = (datos || []).filter((a) => !sexo || a.sexo === sexo);
  const porHora = Array.from({ length: 18 }, (_, i) => i + 5).map((hh) => ({
    nombre: `${String(hh).padStart(2, "0")}h`,
    valor: filas.filter((a) => Number(a.hora.slice(0, 2)) === hh).length,
  }));
  const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const porDia = DIAS.map((d, i) => ({ nombre: d, valor: filas.filter((a) => new Date(`${a.dia}T12:00:00`).getDay() === i).length })).slice(1).concat({ nombre: "Dom", valor: filas.filter((a) => new Date(`${a.dia}T12:00:00`).getDay() === 0).length });
  const top = Object.values(filas.reduce((m, a) => ((m[a.dni] = m[a.dni] || { nombre: a.alumno, valor: 0 }), m[a.dni].valor++, m), {})).sort((a, b) => b.valor - a.valor).slice(0, 10);
  const descripcion = [`Del ${fCorta(desde)} al ${fCorta(hasta)}`, ...(sexo ? [sexo === "Mujer" ? "Mujeres" : "Varones"] : [])];
  const columnas = [
    { key: "dia", label: "Fecha", excel: (a) => fCorta(a.dia) },
    { key: "hora", label: "Hora" },
    { key: "dni", label: "DNI" },
    { key: "alumno", label: "Alumno", clase: () => "font-semibold text-slate-900" },
    { key: "sexo", label: "Sexo" },
    { key: "resultado", label: "Resultado" },
  ];
  return (
    <div className="space-y-4">
      <div className="rd-filtros bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-end justify-between gap-3">
        <Periodo desde={desde} hasta={hasta} setRango={(a, b) => { setDesde(a); setHasta(b); }} />
        <div className="w-40">
          <Sel label="Sexo" value={sexo} onChange={setSexo}>
            <option value="">Todos</option>
            <option value="Mujer">Mujeres</option>
            <option value="Varón">Varones</option>
          </Sel>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Ingresos al gimnasio" value={filas.length} />
        <Kpi label="Alumnos distintos" value={new Set(filas.map((a) => a.dni)).size} />
        <Kpi label="Hora punta" value={porHora.reduce((a, b) => (b.valor > a.valor ? b : a), { nombre: "—", valor: 0 }).nombre} tone="text-blue-700" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 lg:col-span-2">
          <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Afluencia por hora</h4>
          <Barras datos={porHora} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Por día de la semana</h4>
          <Barras datos={porDia} />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Alumnos más constantes</h4>
        <ol className="text-sm text-slate-700 grid grid-cols-1 md:grid-cols-2 gap-x-6">
          {top.map((t, i) => <li key={t.nombre}>{i + 1}. {t.nombre}: <strong>{t.valor}</strong> asistencias</li>)}
          {!top.length && <li className="text-slate-500">Sin asistencias en el periodo.</li>}
        </ol>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-black text-slate-900">Asistencias · {descripcion.join(" · ")}</h4>
          <Exportar titulo="Reporte de asistencias" filtros={descripcion} columnas={columnas} filas={filas} totales={[["Asistencias", filas.length]]} />
        </div>
        {!datos ? <p className="text-slate-500 text-sm">Cargando…</p> : <Tabla columnas={columnas} filas={filas} />}
      </div>
    </div>
  );
};

// ============================================================
// 5. METAS, LOGROS Y BONOS
// ============================================================
const ReporteMetas = () => {
  const [mes, setMes] = useState(hoyISO().slice(0, 7));
  const [metas, setMetas] = useState(null);
  const [logros, setLogros] = useState([]);
  useEffect(() => {
    setMetas(null);
    api(`/metas/metas?mes=${mes}`).then(setMetas).catch(() => setMetas([]));
    api(`/metas/logros?mes=${mes}`).then(setLogros).catch(() => setLogros([]));
  }, [mes]);
  const filas = (metas || []).map((m) => ({
    id: m.id,
    meta: m.type === "recepcion" ? "Recepción" : "Entrenador",
    nombre: m.name,
    categoria: m.category === "ingresos" ? "Ingresos" : m.category === "composicion" ? "Peso / masa" : m.category === "lesion" ? "Lesión / dolor" : "General",
    periodo: `${fCorta(m.start)} a ${fCorta(m.end)}`,
    objetivo: m.type === "recepcion" ? soles(m.progress.objetivo) : `${m.progress.objetivo} logros`,
    logrado: m.type === "recepcion" ? soles(m.progress.logrado) : `${m.progress.logrado} logros`,
    avance: `${m.progress.porcentaje}%`,
    faltante: m.type === "recepcion" ? soles(m.progress.faltante) : `${m.progress.faltante} logros`,
    estado: m.progress.cumplida ? "Cumplida" : "En curso",
    bono: m.bonusStatus ? `${soles(m.bonus)} (${m.bonusStatus})` : m.bonus ? soles(m.bonus) : "—",
  }));
  const columnas = ["meta", "nombre", "categoria", "periodo", "objetivo", "logrado", "avance", "faltante", "estado", "bono"].map((k) => ({
    key: k,
    label: { meta: "Meta", nombre: "Turno / entrenador", categoria: "Tipo", periodo: "Periodo", objetivo: "Objetivo", logrado: "Logrado", avance: "Avance", faltante: "Falta", estado: "Estado", bono: "Bono" }[k],
  }));
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-end gap-3">
        <label className="text-xs">
          <span className="font-bold text-slate-500 block">Mes</span>
          <input type="month" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-300 text-sm" />
        </label>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Avance de metas de recepción (%)</h4>
          <Barras datos={(metas || []).filter((m) => m.type === "recepcion").map((m) => ({ nombre: m.name, valor: m.progress.porcentaje }))} formato={(v) => `${v}%`} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Logros de entrenadores en {nombreMes(mes)}</h4>
          <Barras datos={logros.map((l) => ({ nombre: l.name, valor: l.total }))} />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-black text-slate-900">Metas de {nombreMes(mes)}</h4>
          <Exportar titulo={`Metas ${nombreMes(mes)}`} filtros={[nombreMes(mes)]} columnas={columnas} filas={filas} totales={[["Metas", filas.length], ["Cumplidas", filas.filter((f) => f.estado === "Cumplida").length]]} />
        </div>
        {!metas ? <p className="text-slate-500 text-sm">Cargando…</p> : <Tabla columnas={columnas} filas={filas} />}
      </div>
    </div>
  );
};

// ============================================================
// ============================================================
// CONGELAMIENTOS
// ============================================================
const ESTADO_CONG = ["Congelado", "Programado", "Cumplido", "Terminado antes", "Anulado"];
const COLOR_CONG = { Congelado: "#0284c7", Programado: "#6366f1", Cumplido: "#94a3b8", "Terminado antes": "#f59e0b", Anulado: "#e11d48" };

const ReporteCongelamientos = () => {
  const h = hoyISO();
  const [vista, setVista] = useState("historial");
  const [datos, setDatos] = useState(null);
  const [desde, setDesde] = useState(sumarDias(h, -89));
  const [hasta, setHasta] = useState(h);
  const [f, setF] = useState({ estado: "", plan: "", motivo: "", rapido: "", texto: "" });
  const [fd, setFd] = useState({ plan: "", caduca: "", texto: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  useEffect(() => {
    setDatos(null);
    api(`/reportes/congelamientos?desde=${desde}&hasta=${hasta}`).then(setDatos).catch(() => setDatos({ congelamientos: [], derechos: [] }));
  }, [desde, hasta]);

  const todos = datos?.congelamientos || [];
  const tipoMotivo = (r) => String(r || "").split(":")[0].trim() || "Otro";
  const finSemana = sumarDias(h, 7);
  const filas = useMemo(() => {
    const t = f.texto.trim().toLowerCase();
    return todos.filter(
      (c) =>
        (!f.estado || c.statusLabel === f.estado) &&
        (!f.plan || c.planName === f.plan) &&
        (!f.motivo || tipoMotivo(c.reason) === f.motivo) &&
        (!f.rapido ||
          (f.rapido === "vuelven" && c.status === "activo" && c.returnDate <= finSemana) ||
          (f.rapido === "empiezan" && c.status === "programado" && c.startDate <= finSemana)) &&
        (!t || c.memberName.toLowerCase().includes(t) || c.memberDni.includes(t)),
    );
  }, [todos, f]);
  const lista = (arr, fn) => [...new Set(arr.map(fn))].filter(Boolean).sort();
  const validos = filas.filter((c) => c.status !== "anulado");
  const diasCongelados = validos.reduce((a, c) => a + (c.daysUsed ?? c.days), 0);
  const porEstado = ESTADO_CONG.map((e) => ({ nombre: e, valor: filas.filter((c) => c.statusLabel === e).length })).filter((x) => x.valor);
  const porMotivo = Object.entries(validos.reduce((m, c) => ((m[tipoMotivo(c.reason)] = (m[tipoMotivo(c.reason)] || 0) + 1), m), {}))
    .map(([nombre, valor]) => ({ nombre, valor }))
    .sort((a, b) => b.valor - a.valor);
  const porMes = Object.entries(validos.reduce((m, c) => ((m[c.startDate.slice(0, 7)] = (m[c.startDate.slice(0, 7)] || 0) + 1), m), {}))
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([mes, valor]) => ({ nombre: `${nombreMes(mes).slice(0, 3)} ${mes.slice(0, 4)}`, valor }));
  const porPlan = Object.entries(validos.reduce((m, c) => ((m[c.planName] = (m[c.planName] || 0) + 1), m), {})).map(([nombre, valor]) => ({ nombre, valor }));

  const columnas = [
    { key: "memberDni", label: "DNI" },
    { key: "memberName", label: "Alumno", clase: () => "font-bold text-slate-800" },
    { key: "memberPhone", label: "Celular" },
    { key: "planName", label: "Plan" },
    { key: "startDate", label: "Desde", excel: (c) => fCorta(c.startDate) },
    { key: "endDate", label: "Hasta", excel: (c) => fCorta(c.endDate) },
    { key: "returnDate", label: "Vuelve", excel: (c) => (c.status === "anulado" ? "" : fCorta(c.status === "terminado_antes" ? sumarDias(c.endDate, 1) : c.returnDate)) },
    { key: "days", label: "Días", excel: (c) => (c.daysUsed != null ? `${c.days} (usó ${c.daysUsed})` : c.days) },
    { key: "reason", label: "Motivo" },
    {
      key: "statusLabel",
      label: "Estado",
      ver: (c) => (
        <span className="px-2 py-0.5 rounded-md text-xs font-bold text-white" style={{ background: COLOR_CONG[c.statusLabel] }}>
          {c.statusLabel}
        </span>
      ),
      excel: (c) => c.statusLabel,
    },
    { key: "venc", label: "Vencimiento membresía", excel: (c) => `${fCorta(c.membershipEndBefore)} → ${fCorta(c.membershipEndAfter)}` },
    { key: "registeredBy", label: "Registró", excel: (c) => `${c.registeredBy}${c.closedBy ? ` / cerró ${c.closedBy}` : ""}` },
  ];
  const descripcion = [
    `Del ${fCorta(desde)} al ${fCorta(hasta)} (más los programados)`,
    ...(f.estado ? [`Estado: ${f.estado}`] : []),
    ...(f.rapido === "vuelven" ? ["Vuelven en 7 días"] : f.rapido === "empiezan" ? ["Empiezan en 7 días"] : []),
    ...(f.plan ? [`Plan: ${f.plan}`] : []),
    ...(f.motivo ? [`Motivo: ${f.motivo}`] : []),
    ...(f.texto ? [`Búsqueda: ${f.texto}`] : []),
  ];

  // Derechos sin usar
  const derechos = useMemo(() => {
    const t = fd.texto.trim().toLowerCase();
    return (datos?.derechos || []).filter(
      (d) =>
        (!fd.plan || d.planName === fd.plan) &&
        (!fd.caduca || (fd.caduca === "30" && d.daysLeft > 0 && d.expiresOn <= sumarDias(h, 30)) || (fd.caduca === "conDias" && d.daysLeft > 0) || (fd.caduca === "agotado" && d.daysLeft === 0)) &&
        (!t || d.memberName.toLowerCase().includes(t) || d.memberDni.includes(t)),
    );
  }, [datos, fd]);
  const colDerechos = [
    { key: "memberDni", label: "DNI" },
    { key: "memberName", label: "Alumno", clase: () => "font-bold text-slate-800" },
    { key: "memberPhone", label: "Celular" },
    { key: "planName", label: "Plan" },
    { key: "rules", label: "Condición del plan" },
    { key: "usedDays", label: "Usados" },
    { key: "daysLeft", label: "Quedan", clase: (d) => (d.daysLeft ? "font-bold text-sky-700" : "text-slate-400") },
    { key: "partsLeft", label: "Partes libres" },
    { key: "expiresOn", label: "Caduca el", excel: (d) => fCorta(d.expiresOn), clase: (d) => (d.daysLeft && d.expiresOn <= sumarDias(h, 30) ? "font-bold text-rose-600" : "text-slate-600") },
  ];

  if (!datos) return <p className="text-sm text-slate-500 py-10 text-center">Cargando…</p>;
  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        <Chip activo={vista === "historial"} onClick={() => setVista("historial")}>
          Congelamientos ({todos.length})
        </Chip>
        <Chip activo={vista === "derechos"} onClick={() => setVista("derechos")}>
          Días por usar y caducidad ({(datos.derechos || []).length})
        </Chip>
      </div>

      {vista === "historial" ? (
        <>
          <div className="rd-filtros bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <Periodo desde={desde} hasta={hasta} setRango={(a, b) => (setDesde(a), setHasta(b))} />
            <div className="flex flex-wrap gap-1.5">
              <Chip activo={!f.estado && !f.rapido} onClick={() => setF((p) => ({ ...p, estado: "", rapido: "" }))}>Todos</Chip>
              <Chip activo={f.estado === "Congelado"} onClick={() => setF((p) => ({ ...p, estado: "Congelado", rapido: "" }))}>Congelados hoy ({todos.filter((c) => c.status === "activo").length})</Chip>
              <Chip activo={f.estado === "Programado"} onClick={() => setF((p) => ({ ...p, estado: "Programado", rapido: "" }))}>Programados ({todos.filter((c) => c.status === "programado").length})</Chip>
              <Chip activo={f.rapido === "vuelven"} onClick={() => setF((p) => ({ ...p, estado: "", rapido: "vuelven" }))}>Vuelven esta semana</Chip>
              <Chip activo={f.rapido === "empiezan"} onClick={() => setF((p) => ({ ...p, estado: "", rapido: "empiezan" }))}>Empiezan esta semana</Chip>
              <Chip activo={f.estado === "Terminado antes"} onClick={() => setF((p) => ({ ...p, estado: "Terminado antes", rapido: "" }))}>Terminados antes</Chip>
              <Chip activo={f.estado === "Anulado"} onClick={() => setF((p) => ({ ...p, estado: "Anulado", rapido: "" }))}>Anulados</Chip>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <label className="text-xs">
                <span className="font-bold text-slate-500 block mb-1">Buscar alumno o DNI</span>
                <input value={f.texto} onChange={(e) => set("texto", e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm" />
              </label>
              <Sel label="Estado" value={f.estado} onChange={(v) => set("estado", v)}>
                <option value="">Todos</option>
                {ESTADO_CONG.map((e) => <option key={e}>{e}</option>)}
              </Sel>
              <Sel label="Plan" value={f.plan} onChange={(v) => set("plan", v)}>
                <option value="">Todos</option>
                {lista(todos, (c) => c.planName).map((x) => <option key={x}>{x}</option>)}
              </Sel>
              <Sel label="Motivo" value={f.motivo} onChange={(v) => set("motivo", v)}>
                <option value="">Todos</option>
                {lista(todos, (c) => tipoMotivo(c.reason)).map((x) => <option key={x}>{x}</option>)}
              </Sel>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Congelados hoy" value={filas.filter((c) => c.status === "activo").length} tone="text-sky-600" />
            <Kpi label="Programados" value={filas.filter((c) => c.status === "programado").length} tone="text-indigo-600" />
            <Kpi label="Días congelados" value={diasCongelados} />
            <Kpi label="Terminados antes" value={filas.filter((c) => c.status === "terminado_antes").length} tone="text-amber-600" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Por estado</h4>
              {porEstado.length ? (
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, bottom: 4 }}>
                      <Pie data={porEstado} dataKey="valor" nameKey="nombre" innerRadius={40} outerRadius={68} isAnimationActive={false} label={(e) => e.valor}>
                        {porEstado.map((e) => <Cell key={e.nombre} fill={COLOR_CONG[e.nombre]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-slate-500 py-16 text-center">Sin congelamientos</p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Por motivo</h4>
              <Barras datos={porMotivo} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Por mes de inicio</h4>
              <Barras datos={porMes} />
            </div>
          </div>
          {porPlan.length > 1 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Por plan</h4>
              <Barras datos={porPlan} alto={180} />
            </div>
          )}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-extrabold text-slate-800">Congelamientos</h3>
              <Exportar
                titulo="Reporte de congelamientos"
                filtros={descripcion}
                columnas={columnas}
                filas={filas}
                totales={[["Congelamientos", String(filas.length)], ["Días congelados", String(diasCongelados)]]}
              />
            </div>
            <Tabla columnas={columnas} filas={filas} />
          </div>
        </>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <Chip activo={!fd.caduca} onClick={() => setFd((p) => ({ ...p, caduca: "" }))}>Todas las membresías vigentes</Chip>
              <Chip activo={fd.caduca === "conDias"} onClick={() => setFd((p) => ({ ...p, caduca: "conDias" }))}>Con días por usar</Chip>
              <Chip activo={fd.caduca === "30"} onClick={() => setFd((p) => ({ ...p, caduca: "30" }))}>Caducan en 30 días</Chip>
              <Chip activo={fd.caduca === "agotado"} onClick={() => setFd((p) => ({ ...p, caduca: "agotado" }))}>Ya usaron todo</Chip>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="text-xs">
                <span className="font-bold text-slate-500 block mb-1">Buscar alumno o DNI</span>
                <input value={fd.texto} onChange={(e) => setFd((p) => ({ ...p, texto: e.target.value }))} className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm" />
              </label>
              <Sel label="Plan" value={fd.plan} onChange={(v) => setFd((p) => ({ ...p, plan: v }))}>
                <option value="">Todos</option>
                {lista(datos.derechos || [], (d) => d.planName).map((x) => <option key={x}>{x}</option>)}
              </Sel>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Membresías con derecho" value={derechos.length} />
            <Kpi label="Días por usar" value={derechos.reduce((a, d) => a + d.daysLeft, 0)} tone="text-sky-600" />
            <Kpi label="Caducan en 30 días" value={derechos.filter((d) => d.daysLeft && d.expiresOn <= sumarDias(h, 30)).length} tone="text-rose-600" />
            <Kpi label="Ya usaron todo" value={derechos.filter((d) => !d.daysLeft).length} tone="text-slate-500" />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-extrabold text-slate-800">Días de congelamiento por usar · Al {fCorta(h)}</h3>
              <Exportar
                titulo="Congelamiento: días por usar y caducidad"
                filtros={[`Al ${fCorta(h)}`, ...(fd.plan ? [`Plan: ${fd.plan}`] : []), ...(fd.caduca === "30" ? ["Caducan en 30 días"] : fd.caduca === "conDias" ? ["Con días por usar"] : fd.caduca === "agotado" ? ["Ya usaron todo"] : [])]}
                columnas={colDerechos}
                filas={derechos}
                totales={[["Días por usar", String(derechos.reduce((a, d) => a + d.daysLeft, 0))]]}
              />
            </div>
            <Tabla columnas={colDerechos} filas={derechos} />
          </div>
        </>
      )}
    </div>
  );
};

export const ReportsModule = () => {
  const [tab, setTab] = useState("alumnos");
  const [clave, setClave] = useState(0);
  const tabs = [
    ["alumnos", "Alumnos", Users, "from-blue-600 to-blue-500", "text-blue-600"],
    ["matriculas", "Matrículas y paquetes", CreditCard, "from-indigo-600 to-violet-500", "text-indigo-600"],
    ["ingresos", "Ingresos y egresos", Wallet, "from-emerald-600 to-emerald-500", "text-emerald-600"],
    ["deudas", "Deudas y pendientes", HandCoins, "from-rose-600 to-orange-500", "text-rose-600"],
    ["congelamientos", "Congelamientos", Snowflake, "from-sky-600 to-cyan-500", "text-sky-600"],
    ["asistencias", "Asistencias", UserCheck, "from-amber-500 to-orange-500", "text-amber-600"],
    ["metas", "Metas y logros", Trophy, "from-fuchsia-600 to-pink-500", "text-fuchsia-600"],
  ];
  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden bg-gradient-to-br from-marino-900 via-marino-800 to-blue-800 rounded-3xl p-6 text-white shadow-lg flex flex-wrap items-start justify-between gap-4">
        <div className="pointer-events-none absolute -right-10 -top-16 w-64 h-64 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute right-40 -bottom-20 w-56 h-56 rounded-full bg-orange-500/15 blur-3xl" />
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-blue-300 flex items-center gap-1.5">
            <FileBarChart className="w-4 h-4" /> Administración
          </span>
          <h1 className="text-2xl font-black mt-1">Reportes</h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Elige el reporte, aplica los filtros y exporta exactamente lo que ves a Excel o PDF, o envíalo al WhatsApp del administrador.
          </p>
        </div>
        <button onClick={() => setClave((k) => k + 1)} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer" title="Actualizar datos">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200">
        {tabs.map(([k, l, Icono, degradado, colorIcono]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-all ${tab === k ? `bg-gradient-to-r ${degradado} text-white shadow-md` : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Icono className={`w-4 h-4 ${tab === k ? "text-white" : colorIcono}`} /> {l}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-slate-400 flex items-center gap-1 pr-2">
          <Filter className="w-3.5 h-3.5" /> Se exporta solo lo filtrado
        </span>
      </div>
      <div key={`${tab}-${clave}`}>
        {tab === "alumnos" && <ReporteAlumnos />}
        {tab === "matriculas" && <ReporteMatriculas />}
        {tab === "ingresos" && <ReporteIngresos />}
        {tab === "asistencias" && <ReporteAsistencias />}
        {tab === "deudas" && <ReporteDeudas />}
        {tab === "congelamientos" && <ReporteCongelamientos />}
        {tab === "metas" && <ReporteMetas />}
      </div>
    </div>
  );
};
