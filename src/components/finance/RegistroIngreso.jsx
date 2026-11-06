// =====================================================================
// Registro de ingreso de caja (Finanzas & Caja)
// Mismo estilo que el registro de gastos: se elige el tipo de ingreso con
// tarjetas, se puede enlazar al alumno, calcular por sesiones y elegir el
// medio de pago. Al final se ve un resumen de lo que entrará a caja.
// =====================================================================
import React, { useMemo, useState } from "react";
import { TrendingUp, X, Search, CheckCircle2, Info, User, Receipt } from "lucide-react";
import { useGym } from "../../context/GymContext";

export const TIPOS_INGRESO = {
  membership: { icono: "🏋️", titulo: "Membresía / matrícula", sub: "Cuotas, inscripción, carnet", conAlumno: true, concepto: "Pago de membresía" },
  personal_training: { icono: "🧑‍🏫", titulo: "Personal training", sub: "Sesiones o asesorías", conAlumno: true, sesiones: true, concepto: "Personal training" },
  physiotherapy: { icono: "🩺", titulo: "Fisioterapia", sub: "Sesiones de terapia", conAlumno: true, sesiones: true, concepto: "Sesión de fisioterapia" },
  nutrition: { icono: "🥗", titulo: "Nutrición", sub: "Consultas y planes", conAlumno: true, sesiones: true, concepto: "Consulta de nutrición" },
  pos_sale: { icono: "🛒", titulo: "Venta de tienda", sub: "Suplementos, bebidas", conAlumno: true, concepto: "Venta en tienda" },
  other: { icono: "➕", titulo: "Otro ingreso", sub: "Alquiler, eventos, otros", conAlumno: false, concepto: "" },
};

const AVISO = {
  membership: "Para matricular o renovar a un alumno usa Alumnos / Socios: así su membresía queda activa y el pago enlazado. Aquí registra pagos sueltos (inscripción, carnet, cuota atrasada).",
  pos_sale: "Las ventas con productos se hacen en Ventas / POS (descuenta el stock). Aquí solo ingresos de tienda sin producto registrado.",
};

const OTROS_RAPIDOS = ["Alquiler de espacio", "Evento / clase especial", "Carnet o tarjeta", "Casillero", "Toalla / candado", "Donación o patrocinio"];

const METODOS = [
  ["efectivo", "💵", "Efectivo"],
  ["yape_plin", "📱", "Yape / Plin"],
  ["tarjeta", "💳", "Tarjeta"],
  ["transferencia", "🏦", "Transferencia"],
];

const soles = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

export const RegistroIngreso = ({ onCerrar, onGuardar }) => {
  const { members = [] } = useGym();
  const [tipo, setTipo] = useState("membership");
  const [monto, setMonto] = useState("");
  const [sesiones, setSesiones] = useState("1");
  const [precioSesion, setPrecioSesion] = useState("");
  const [concepto, setConcepto] = useState("");
  const [conceptoTocado, setConceptoTocado] = useState(false);
  const [metodo, setMetodo] = useState("efectivo");
  const [comprobante, setComprobante] = useState("");
  const [busca, setBusca] = useState("");
  const [alumno, setAlumno] = useState(null);
  const [error, setError] = useState("");

  const T = TIPOS_INGRESO[tipo];
  const porSesiones = !!T.sesiones && Number(precioSesion) > 0;
  const total = porSesiones ? Math.round(Number(sesiones || 0) * Number(precioSesion) * 100) / 100 : Number(monto) || 0;

  const sugerido = useMemo(() => {
    const base = T.concepto || "";
    const ses = porSesiones ? ` (${sesiones} ${Number(sesiones) === 1 ? "sesión" : "sesiones"} × ${soles(precioSesion)})` : "";
    return `${base}${ses}${alumno ? ` — ${alumno.fullName}` : ""}`.trim();
  }, [T, porSesiones, sesiones, precioSesion, alumno]);
  const conceptoFinal = conceptoTocado ? concepto : sugerido;

  const resultados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (q.length < 2) return [];
    return members
      .filter((m) => `${m.fullName} ${m.dni} ${m.phone || ""}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [busca, members]);

  const elegirTipo = (k) => {
    setTipo(k);
    setError("");
    if (!TIPOS_INGRESO[k].conAlumno) setAlumno(null);
    if (!TIPOS_INGRESO[k].sesiones) setPrecioSesion("");
    if (!conceptoTocado) setConcepto("");
  };

  const guardar = (e) => {
    e.preventDefault();
    setError("");
    if (!(total > 0)) return setError("Escribe el monto que entra a caja.");
    if (!conceptoFinal.trim()) return setError("Escribe el concepto del ingreso.");
    onGuardar({
      type: "income",
      category: tipo,
      amount: total,
      paymentMethod: metodo,
      description: conceptoFinal.trim(),
      receiptNumber: comprobante.trim() || undefined,
      relatedMemberId: alumno?.id,
      relatedMemberName: alumno?.fullName,
    });
  };

  const campo = "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
      <form onSubmit={guardar} className="w-full max-w-3xl mx-auto min-h-full bg-white p-5 sm:p-7 space-y-5 text-slate-800">
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Caja & ingresos del gimnasio</span>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" /> Registro de ingreso
            </h3>
          </div>
          <button type="button" onClick={onCerrar} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Tipo */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-slate-800">1. ¿De qué es el ingreso? *</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(TIPOS_INGRESO).map(([k, t]) => (
              <button
                key={k}
                type="button"
                onClick={() => elegirTipo(k)}
                className={`text-left rounded-2xl border-2 p-3 cursor-pointer transition-all ${
                  tipo === k ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-emerald-300"
                }`}
              >
                <span className="text-2xl leading-none">{t.icono}</span>
                <span className={`block mt-1.5 text-sm font-black ${tipo === k ? "text-emerald-800" : "text-slate-900"}`}>{t.titulo}</span>
                <span className="block text-[11px] text-slate-500">{t.sub}</span>
              </button>
            ))}
          </div>
          {AVISO[tipo] && (
            <p className="flex gap-2 text-xs text-sky-900 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2">
              <Info className="w-4 h-4 shrink-0 text-sky-600" /> {AVISO[tipo]}
            </p>
          )}
        </div>

        {/* 2. Alumno */}
        {T.conAlumno && (
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-800">
              2. ¿De qué alumno? <span className="font-normal text-slate-500">(opcional)</span>
            </p>
            {alumno ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <span className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-emerald-700" />
                  <b className="text-slate-900">{alumno.fullName}</b>
                  <span className="text-slate-500">· DNI {alumno.dni}{alumno.planName ? ` · ${alumno.planName}` : ""}</span>
                </span>
                <button type="button" onClick={() => setAlumno(null)} className="text-xs font-bold text-slate-600 hover:text-rose-600 cursor-pointer">
                  Quitar
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center border border-slate-300 bg-slate-50 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white">
                  <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Busca por nombre, DNI o celular…" className="w-full bg-transparent text-sm text-slate-900 focus:outline-none" />
                </div>
                {resultados.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 divide-y divide-slate-100 overflow-hidden">
                    {resultados.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => (setAlumno(m), setBusca(""))}
                        className="w-full text-left px-3 py-2 hover:bg-emerald-50 cursor-pointer text-sm flex justify-between gap-2"
                      >
                        <b className="text-slate-900 truncate">{m.fullName}</b>
                        <span className="text-xs text-slate-500 whitespace-nowrap">DNI {m.dni}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. Monto */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-slate-800">{T.conAlumno ? "3" : "2"}. ¿Cuánto entra a caja? *</p>
          {T.sesiones && (
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <label className="block text-xs font-bold text-slate-600">
                N° de sesiones
                <input type="number" min="1" step="1" value={sesiones} onChange={(e) => setSesiones(e.target.value)} className={`${campo} mt-1`} />
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Precio por sesión (S/)
                <input type="number" min="0" step="0.1" placeholder="Ej. 40" value={precioSesion} onChange={(e) => setPrecioSesion(e.target.value)} className={`${campo} mt-1`} />
              </label>
              <p className="col-span-2 text-[11px] text-slate-500">Si llenas el precio por sesión, el total se calcula solo. Si no, escribe el monto abajo.</p>
            </div>
          )}
          {porSesiones ? (
            <p className="text-2xl font-black text-emerald-700">{soles(total)}</p>
          ) : (
            <div className="flex items-center rounded-xl border-2 border-emerald-300 bg-white px-3 focus-within:ring-2 focus-within:ring-emerald-500 max-w-xs">
              <span className="text-lg font-black text-emerald-700">S/</span>
              <input type="number" min="0" step="0.1" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} className="w-full px-2 py-2.5 text-2xl font-black text-slate-900 bg-transparent focus:outline-none" />
            </div>
          )}
        </div>

        {/* 4. Medio de pago */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-slate-800">{T.conAlumno ? "4" : "3"}. ¿Cómo pagó?</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {METODOS.map(([k, ic, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setMetodo(k)}
                className={`rounded-xl border-2 px-3 py-2 text-sm font-bold cursor-pointer ${metodo === k ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"}`}
              >
                {ic} {l}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Detalle */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-slate-800">{T.conAlumno ? "5" : "4"}. Detalle</p>
          {tipo === "other" && (
            <div className="flex flex-wrap gap-1.5">
              {OTROS_RAPIDOS.map((o) => (
                <button key={o} type="button" onClick={() => (setConcepto(o), setConceptoTocado(true))} className="px-2.5 py-1 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer">
                  {o}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block text-xs font-bold text-slate-600 sm:col-span-2">
              Concepto *
              <input
                value={conceptoFinal}
                onChange={(e) => (setConcepto(e.target.value), setConceptoTocado(true))}
                placeholder="Ej. Alquiler del salón para evento de baile"
                className={`${campo} mt-1`}
              />
            </label>
            <label className="block text-xs font-bold text-slate-600">
              N° de boleta / operación
              <div className="relative mt-1">
                <Receipt className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={comprobante} onChange={(e) => setComprobante(e.target.value)} placeholder="Opcional" className={`${campo} pl-9`} />
              </div>
            </label>
          </div>
        </div>

        {/* Resumen */}
        <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-700 space-y-0.5">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Entrará a caja</p>
            <p className="text-3xl font-black text-emerald-700 leading-tight">{soles(total)}</p>
            <p>
              {T.icono} {T.titulo} · {METODOS.find((m) => m[0] === metodo)?.[2]}
              {alumno ? ` · ${alumno.fullName}` : ""}
            </p>
          </div>
          <CheckCircle2 className={`w-10 h-10 ${total > 0 ? "text-emerald-500" : "text-slate-300"}`} />
        </div>

        {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button type="button" onClick={onCerrar} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">
            Cancelar
          </button>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow cursor-pointer flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Registrar entrada en caja
          </button>
        </div>
      </form>
    </div>
  );
};
