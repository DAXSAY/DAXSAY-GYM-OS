// ============================================================
// CAJA POR TURNOS: apertura, movimientos, arqueo y cierre
// Cada recepcionista abre su caja con el efectivo que recibe, cobra
// (POS, matrículas, renovaciones) y al terminar cuenta el efectivo y
// cierra. El siguiente turno ve lo que dejó el anterior y continúa.
// ============================================================
import React, { useEffect, useMemo, useState } from "react";
import {
  Vault,
  LockOpen,
  Lock,
  Banknote,
  Smartphone,
  CreditCard,
  ArrowLeftRight,
  Plus,
  Minus,
  Calculator,
  Clock,
  ArrowLeft,
  Printer,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  User,
  CalendarDays,
} from "lucide-react";
import { useGym } from "../../context/GymContext";
import { api } from "../../api/cliente";
import { userCan } from "../../config/roles";
import { hoyISO } from "../../utils/fecha";

const soles = (n) => `S/ ${Number(n || 0).toFixed(2)}`;
const hora = (dt) => (dt ? String(dt).slice(11, 16) : "—");
const fechaCorta = (dt) => {
  if (!dt) return "—";
  const [a, m, d] = String(dt).slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
};
const duracion = (desde, hasta) => {
  if (!desde) return "";
  const a = new Date(String(desde).replace(" ", "T"));
  const b = hasta ? new Date(String(hasta).replace(" ", "T")) : new Date();
  const min = Math.max(0, Math.round((b - a) / 60000));
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")} min`;
};
const r2 = (n) => Math.round(Number(n || 0) * 100) / 100;

const DENOMINACIONES = [
  { v: 200, t: "billete" }, { v: 100, t: "billete" }, { v: 50, t: "billete" },
  { v: 20, t: "billete" }, { v: 10, t: "billete" }, { v: 5, t: "moneda" },
  { v: 2, t: "moneda" }, { v: 1, t: "moneda" }, { v: 0.5, t: "moneda" },
  { v: 0.2, t: "moneda" }, { v: 0.1, t: "moneda" },
];

const CATEGORIAS = {
  matricula: "Matrícula / renovación",
  venta: "Venta POS",
  entrenamiento_personal: "Entrenamiento personal",
  fisioterapia: "Fisioterapia",
  nutricion: "Nutrición",
  insumos: "Insumos",
  mantenimiento: "Mantenimiento",
  servicios: "Servicios",
  sueldo: "Sueldo",
  alquiler: "Alquiler",
  marketing: "Marketing",
  averia_equipo: "Avería de equipo",
  otros: "Otros",
};
const CATEGORIAS_TURNO = {
  ingreso: ["otros", "entrenamiento_personal", "fisioterapia", "nutricion"],
  egreso: ["insumos", "mantenimiento", "servicios", "otros"],
};
const METODOS = {
  efectivo: { label: "Efectivo", icon: Banknote },
  yape_plin: { label: "Yape / Plin", icon: Smartphone },
  tarjeta: { label: "Tarjeta", icon: CreditCard },
  transferencia: { label: "Transferencia", icon: ArrowLeftRight },
};

// Pantalla completa reutilizable
const PantallaCompleta = ({ titulo, subtitulo, onVolver, children, acciones }) => (
  <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
    <div className="w-full max-w-6xl mx-auto min-h-full p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900">{titulo}</h2>
            {subtitulo && <p className="text-xs text-slate-500">{subtitulo}</p>}
          </div>
        </div>
        {acciones}
      </div>
      {children}
    </div>
  </div>
);

const Kpi = ({ label, value, tone = "slate", hint, big }) => {
  const tonos = {
    slate: "text-slate-900",
    green: "text-emerald-600",
    red: "text-rose-600",
    blue: "text-blue-700",
    amber: "text-amber-600",
    purple: "text-purple-700",
  };
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-xs ${big ? "ring-2 ring-blue-500/30" : ""}`}>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{label}</span>
      <span className={`${big ? "text-2xl" : "text-xl"} font-black ${tonos[tone]} block mt-1`}>{value}</span>
      {hint && <span className="text-xs text-slate-500 block mt-0.5">{hint}</span>}
    </div>
  );
};

const Diferencia = ({ valor, texto = "" }) => {
  const v = r2(valor);
  if (Math.abs(v) < 0.01)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5" /> Cuadra {texto}
      </span>
    );
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
        v > 0 ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"
      }`}
    >
      <AlertTriangle className="w-3.5 h-3.5" /> {v > 0 ? "Sobra" : "Falta"} {soles(Math.abs(v))} {texto}
    </span>
  );
};

// ------------------------------------------------------------
// Tabla de movimientos de un turno
// ------------------------------------------------------------
const TablaMovimientos = ({ movimientos }) =>
  movimientos.length === 0 ? (
    <p className="text-center text-sm text-slate-500 py-8">
      Aún no hay cobros ni gastos en este turno.
    </p>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-200">
            <th className="py-2 pr-3">Hora</th>
            <th className="py-2 pr-3">Concepto</th>
            <th className="py-2 pr-3">Categoría</th>
            <th className="py-2 pr-3">Método</th>
            <th className="py-2 pr-3">Usuario</th>
            <th className="py-2 text-right">Monto</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((m) => (
            <tr key={m.id} className="border-b border-slate-100">
              <td className="py-2 pr-3 font-mono text-slate-500">{hora(m.dateTime)}</td>
              <td className="py-2 pr-3 text-slate-800">
                {m.description}
                {m.relatedName && <span className="text-xs text-slate-500 block">{m.relatedName}</span>}
              </td>
              <td className="py-2 pr-3 text-slate-600">{CATEGORIAS[m.category] || m.category}</td>
              <td className="py-2 pr-3 text-slate-600">{METODOS[m.paymentMethod]?.label || m.paymentMethod}</td>
              <td className="py-2 pr-3 text-slate-500">{m.user || "—"}</td>
              <td className={`py-2 text-right font-black ${m.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                {m.type === "income" ? "+" : "−"} {soles(m.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

// Resumen por método de pago
const ResumenMetodos = ({ resumen }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {Object.entries(METODOS).map(([k, { label, icon: Icono }]) => (
      <div key={k} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
          <Icono className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase block">{label}</span>
          <span className="text-base font-black text-slate-900">{soles(resumen?.ingresos?.[k])}</span>
          {resumen?.egresos?.[k] > 0 && (
            <span className="text-xs font-bold text-rose-600 block">− {soles(resumen.egresos[k])} gastos</span>
          )}
        </div>
      </div>
    ))}
  </div>
);

// ------------------------------------------------------------
// Formulario: abrir caja
// ------------------------------------------------------------
const AbrirCaja = ({ ultimo, onVolver, onAbierta }) => {
  const { currentUser } = useGym();
  const recibido = ultimo?.nextShiftCash ?? 0;
  const [turnos, setTurnos] = useState([]);
  const [turno, setTurno] = useState("");
  useEffect(() => {
    api("/metas/turnos-recepcion")
      .then((t) => {
        setTurnos(t.filter((x) => x.active));
        const mio = t.find((x) => x.people.some((p) => p.userId === String(currentUser?.id)));
        if (mio) setTurno(mio.id);
      })
      .catch(() => {});
  }, []);
  const [monto, setMonto] = useState(String(recibido.toFixed(2)));
  const [obs, setObs] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const dif = r2(Number(monto || 0) - recibido);

  const abrir = async (e) => {
    e.preventDefault();
    setError("");
    if (monto === "" || Number(monto) < 0) return setError("Ingresa el efectivo que cuentas al abrir.");
    if (ultimo && Math.abs(dif) >= 0.01 && obs.trim().length < 3)
      return setError("El efectivo no coincide con lo que dejó el turno anterior: escribe una observación.");
    setEnviando(true);
    try {
      await api("/turnos-caja/abrir", { method: "POST", body: { montoApertura: Number(monto), observacion: obs, turnoRecepcion: turno || undefined } });
      onAbierta();
    } catch (er) {
      setError(er.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <PantallaCompleta titulo="Abrir mi caja" subtitulo="Cuenta el efectivo que recibes antes de empezar a cobrar." onVolver={onVolver}>
      <form onSubmit={abrir} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Entrega del turno anterior</h3>
          {ultimo ? (
            <div className="space-y-2 text-sm">
              <p className="text-slate-600">
                <strong className="text-slate-900">{ultimo.closedBy}</strong> cerró su caja el {fechaCorta(ultimo.closedAt)} a las{" "}
                {hora(ultimo.closedAt)}.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Kpi label="Dejó en caja" value={soles(recibido)} tone="blue" />
                <Kpi label="Entregó a administración" value={soles(ultimo.deliveredCash)} />
              </div>
              {ultimo.closingNote && (
                <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2">
                  Nota del cierre: {ultimo.closingNote}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Es el primer turno registrado: ingresa el fondo de caja con el que empiezas.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          {turnos.length > 0 && (
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Turno (suma a la meta de)</span>
              <select value={turno} onChange={(e) => setTurno(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white">
                <option value="">Sin turno</option>
                {turnos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.start && `(${t.start} - ${t.end})`}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Efectivo que cuentas al abrir (S/)</span>
            <input
              type="number"
              min="0"
              step="0.10"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-300 text-2xl font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </label>
          {ultimo && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Frente a lo que dejó el turno anterior:</span>
              <Diferencia valor={dif} />
            </div>
          )}
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Observación {ultimo && Math.abs(dif) >= 0.01 && <span className="text-rose-600">(obligatoria)</span>}</span>
            <textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={3}
              placeholder="Ej. Se recibió S/ 5 menos porque…"
              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
          <button
            disabled={enviando}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black flex items-center justify-center gap-2 cursor-pointer"
          >
            <LockOpen className="w-5 h-5" /> {enviando ? "Abriendo…" : "Abrir caja e iniciar mi turno"}
          </button>
        </div>
      </form>
    </PantallaCompleta>
  );
};

// ------------------------------------------------------------
// Formulario: ingreso o gasto del turno
// ------------------------------------------------------------
const MovimientoTurno = ({ turno, onVolver, onGuardado }) => {
  const [tipo, setTipo] = useState("egreso");
  const [categoria, setCategoria] = useState("insumos");
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("efectivo");
  const [descripcion, setDescripcion] = useState("");
  const [relacionado, setRelacionado] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await api(`/turnos-caja/${turno.id}/movimiento`, {
        method: "POST",
        body: { tipo, categoria, monto: Number(monto), metodoPago: metodo, descripcion, relacionado },
      });
      onGuardado();
    } catch (er) {
      setError(er.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <PantallaCompleta
      titulo="Registrar ingreso o gasto del turno"
      subtitulo="Para cobros sueltos o gastos de caja chica. Las ventas del POS y las matrículas se registran solas."
      onVolver={onVolver}
    >
      <form onSubmit={guardar} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 max-w-3xl mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {[
            ["egreso", "Gasto / salida de dinero", Minus, "rose"],
            ["ingreso", "Ingreso / cobro", Plus, "emerald"],
          ].map(([k, label, Icono, color]) => (
            <button
              type="button"
              key={k}
              onClick={() => {
                setTipo(k);
                setCategoria(CATEGORIAS_TURNO[k][0]);
              }}
              className={`p-4 rounded-xl border-2 font-black flex items-center justify-center gap-2 cursor-pointer ${
                tipo === k
                  ? color === "rose"
                    ? "border-rose-500 bg-rose-50 text-rose-700"
                    : "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              <Icono className="w-5 h-5" /> {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Monto (S/)</span>
            <input
              type="number"
              min="0.1"
              step="0.10"
              required
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-300 text-xl font-black"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Categoría</span>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-300 text-sm bg-white"
            >
              {CATEGORIAS_TURNO[tipo].map((c) => (
                <option key={c} value={c}>
                  {CATEGORIAS[c]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <span className="text-sm font-bold text-slate-700">Método</span>
          <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(METODOS).map(([k, { label, icon: Icono }]) => (
              <button
                type="button"
                key={k}
                onClick={() => setMetodo(k)}
                className={`p-2.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  metodo === k ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"
                }`}
              >
                <Icono className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Descripción</span>
          <input
            required
            minLength={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder={tipo === "egreso" ? "Ej. Compra de bidón de agua y lejía" : "Ej. Clase personalizada Juan"}
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Persona o proveedor (opcional)</span>
          <input
            value={relacionado}
            onChange={(e) => setRelacionado(e.target.value)}
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
          />
        </label>
        {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
        <button
          disabled={enviando}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black cursor-pointer"
        >
          {enviando ? "Guardando…" : "Guardar en mi turno"}
        </button>
      </form>
    </PantallaCompleta>
  );
};

// ------------------------------------------------------------
// Formulario: arqueo y cierre
// ------------------------------------------------------------
const CerrarCaja = ({ turno, onVolver, onCerrada }) => {
  const [modoConteo, setModoConteo] = useState(true);
  const [conteo, setConteo] = useState({});
  const [totalDirecto, setTotalDirecto] = useState("");
  const [siguiente, setSiguiente] = useState(String(Number(turno.openingCash).toFixed(2)));
  const [obs, setObs] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const totalConteo = r2(DENOMINACIONES.reduce((s, d) => s + d.v * Number(conteo[d.v] || 0), 0));
  const contado = modoConteo ? totalConteo : r2(totalDirecto);
  const esperado = r2(turno.expectedCash);
  const dif = r2(contado - esperado);
  const queda = Math.min(r2(siguiente), contado);
  const entrega = r2(contado - queda);
  const res = turno.summary;

  const cerrar = async (e) => {
    e.preventDefault();
    setError("");
    if (Math.abs(dif) >= 0.01 && obs.trim().length < 3)
      return setError("Hay diferencia entre lo contado y lo esperado: explica el motivo en la observación.");
    if (r2(siguiente) > contado) return setError("No puedes dejar más efectivo del que contaste.");
    setEnviando(true);
    try {
      const cerrado = await api(`/turnos-caja/${turno.id}/cerrar`, {
        method: "POST",
        body: {
          efectivoContado: contado,
          efectivoSiguiente: r2(siguiente),
          detalleConteo: modoConteo ? conteo : null,
          observacion: obs,
        },
      });
      onCerrada(cerrado);
    } catch (er) {
      setError(er.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <PantallaCompleta
      titulo="Arqueo y cierre de caja"
      subtitulo={`Turno de ${turno.openedBy} · desde las ${hora(turno.openedAt)} (${duracion(turno.openedAt)})`}
      onVolver={onVolver}
    >
      <form onSubmit={cerrar} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Conteo */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Cuenta el efectivo
            </h3>
            <div className="flex p-1 rounded-xl bg-slate-100 text-xs font-bold">
              <button
                type="button"
                onClick={() => setModoConteo(true)}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${modoConteo ? "bg-white shadow-xs text-slate-900" : "text-slate-500"}`}
              >
                Por billetes y monedas
              </button>
              <button
                type="button"
                onClick={() => setModoConteo(false)}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${!modoConteo ? "bg-white shadow-xs text-slate-900" : "text-slate-500"}`}
              >
                Total directo
              </button>
            </div>
          </div>

          {modoConteo ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DENOMINACIONES.map((d) => (
                <div key={d.v} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50">
                  <span
                    className={`w-20 text-center py-1.5 rounded-lg text-xs font-black ${
                      d.t === "billete" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {d.v >= 1 ? `S/ ${d.v}` : `${Math.round(d.v * 100)} cént.`}
                  </span>
                  <span className="text-slate-400 text-sm">×</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={conteo[d.v] ?? ""}
                    onChange={(e) => setConteo({ ...conteo, [d.v]: e.target.value.replace(/\D/g, "") })}
                    placeholder="0"
                    className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 text-sm font-bold text-center bg-white"
                  />
                  <span className="ml-auto text-sm font-bold text-slate-700">{soles(d.v * Number(conteo[d.v] || 0))}</span>
                </div>
              ))}
            </div>
          ) : (
            <input
              type="number"
              min="0"
              step="0.10"
              value={totalDirecto}
              onChange={(e) => setTotalDirecto(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-2xl font-black"
              autoFocus
            />
          )}

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white">
            <span className="font-bold">Efectivo contado</span>
            <span className="text-2xl font-black">{soles(contado)}</span>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Cobros que no son efectivo (no se cuentan en caja)</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                Yape/Plin <strong className="block">{soles(res.ingresos.yape_plin)}</strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                Tarjeta <strong className="block">{soles(res.ingresos.tarjeta)}</strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                Transferencia <strong className="block">{soles(res.ingresos.transferencia)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2 text-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Resultado del arqueo</h3>
            <div className="flex justify-between"><span className="text-slate-500">Efectivo al abrir</span><strong>{soles(turno.openingCash)}</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">+ Cobros en efectivo</span><strong className="text-emerald-600">{soles(res.ingresos.efectivo)}</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">− Gastos en efectivo</span><strong className="text-rose-600">{soles(res.egresos.efectivo)}</strong></div>
            <div className="flex justify-between border-t border-slate-200 pt-2"><span className="font-bold">Debe haber en caja</span><strong className="text-lg">{soles(esperado)}</strong></div>
            <div className="flex justify-between"><span className="font-bold">Contaste</span><strong className="text-lg">{soles(contado)}</strong></div>
            <div className="pt-1"><Diferencia valor={dif} /></div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Efectivo que dejas en caja para el siguiente turno</span>
              <input
                type="number"
                min="0"
                step="0.10"
                value={siguiente}
                onChange={(e) => setSiguiente(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 text-lg font-black"
              />
            </label>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Entregas a administración</span>
              <strong className="text-blue-700">{soles(entrega)}</strong>
            </div>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Observación {Math.abs(dif) >= 0.01 && <span className="text-rose-600">(obligatoria)</span>}
              </span>
              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                rows={3}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                placeholder="Ej. Vuelto mal dado a un cliente…"
              />
            </label>
            {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
            <button
              disabled={enviando}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black disabled:opacity-60 text-white font-black flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-5 h-5" /> {enviando ? "Cerrando…" : "Cerrar mi caja"}
            </button>
          </div>
        </div>
      </form>
    </PantallaCompleta>
  );
};

// ------------------------------------------------------------
// Detalle de un turno (cerrado o abierto)
// ------------------------------------------------------------
const DetalleTurno = ({ id, onVolver }) => {
  const [t, setT] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api(`/turnos-caja/${id}`).then(setT).catch((e) => setError(e.message));
  }, [id]);

  return (
    <PantallaCompleta
      titulo={t ? `Turno #${t.id} · ${t.openedBy}` : "Detalle del turno"}
      subtitulo={t ? `${fechaCorta(t.openedAt)} · ${hora(t.openedAt)} a ${t.closedAt ? hora(t.closedAt) : "en curso"}` : ""}
      onVolver={onVolver}
      acciones={
        <button
          onClick={() => window.print()}
          className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      }
    >
      {error && <p className="text-rose-600 font-bold">{error}</p>}
      {!t ? (
        !error && <p className="text-slate-500">Cargando…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Recibió del turno anterior" value={soles(t.receivedCash)} />
            <Kpi label="Contó al abrir" value={soles(t.openingCash)} hint={Math.abs(t.openingDifference) >= 0.01 ? `Diferencia ${soles(t.openingDifference)}` : "Sin diferencia"} />
            <Kpi label="Efectivo esperado" value={soles(t.expectedCash)} tone="blue" />
            <Kpi
              label="Efectivo contado al cerrar"
              value={t.countedCash != null ? soles(t.countedCash) : "—"}
              tone={t.difference == null ? "slate" : Math.abs(t.difference) < 0.01 ? "green" : "red"}
              hint={t.difference != null ? (Math.abs(t.difference) < 0.01 ? "Cuadra" : `Diferencia ${soles(t.difference)}`) : "Turno en curso"}
            />
            <Kpi label="Total cobrado" value={soles(t.summary.totalIngresos)} tone="green" hint={`${t.summary.operaciones} operaciones`} />
            <Kpi label="Total gastos" value={soles(t.summary.totalEgresos)} tone="red" />
            <Kpi label="Entregó a administración" value={t.deliveredCash != null ? soles(t.deliveredCash) : "—"} />
            <Kpi label="Dejó para el siguiente turno" value={t.nextShiftCash != null ? soles(t.nextShiftCash) : "—"} />
          </div>
          <ResumenMetodos resumen={t.summary} />
          {(t.openingNote || t.closingNote) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900 space-y-1">
              {t.openingNote && <p><strong>Al abrir:</strong> {t.openingNote}</p>}
              {t.closingNote && <p><strong>Al cerrar ({t.closedBy}):</strong> {t.closingNote}</p>}
            </div>
          )}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">Movimientos del turno</h3>
            <TablaMovimientos movimientos={t.movements || []} />
          </div>
        </>
      )}
    </PantallaCompleta>
  );
};

// ------------------------------------------------------------
// Meta del mes del turno (recepción) — resumen
// ------------------------------------------------------------
const MetaDelTurno = ({ turnoId }) => {
  const [metas, setMetas] = useState([]);
  useEffect(() => {
    api(`/metas/metas?mes=${hoyISO().slice(0, 7)}`)
      .then((m) => setMetas(m.filter((x) => x.type === "recepcion" && (!turnoId || x.receptionShiftId === turnoId))))
      .catch(() => setMetas([]));
  }, [turnoId]);
  if (!metas.length) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {metas.map((m) => {
        const p = m.progress;
        return (
          <div key={m.id} className="bg-white rounded-2xl border border-amber-200 p-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-black uppercase text-amber-700">Meta del mes · {m.name}</span>
              <span className="text-sm font-black text-blue-700">{p.porcentaje}%</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full ${p.cumplida ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${p.porcentaje}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div><span className="text-slate-400 font-bold block">FALTA EN EL MES</span><strong className="text-rose-600 text-sm">{soles(p.faltante)}</strong></div>
              <div><span className="text-slate-400 font-bold block">POR DÍA ({p.diasRestantes} días)</span><strong className="text-sm">{soles(p.necesarioPorDia)}</strong></div>
              <div><span className="text-slate-400 font-bold block">HOY</span><strong className="text-emerald-600 text-sm">{soles(p.hoy)}</strong></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------
// Módulo principal
// ------------------------------------------------------------
export const CashShiftsModule = () => {
  const { currentUser, cashShift, refreshCashShift } = useGym();
  const [vista, setVista] = useState(null); // abrir | cerrar | movimiento | {detalle:id}
  const [historial, setHistorial] = useState([]);
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState(hoyISO());
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState("");

  const puedeAbrir = userCan(currentUser, "cash", "crear") || userCan(currentUser, "finance", "crear");
  const puedeCerrar = userCan(currentUser, "cash", "editar") || userCan(currentUser, "finance", "editar");
  const abierto = cashShift?.open || null;
  const ultimo = cashShift?.lastClosed || null;
  const movimientos = cashShift?.openMovements || [];

  const cargarHistorial = async () => {
    setCargando(true);
    try {
      setHistorial(await api(`/turnos-caja?desde=${desde}&hasta=${hasta}`));
    } catch (e) {
      setAviso(e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    refreshCashShift();
  }, []);
  useEffect(() => {
    cargarHistorial();
  }, [desde, hasta, cashShift?.open?.id, cashShift?.lastClosed?.id]);

  // Totales del periodo (todos los turnos listados)
  const totales = useMemo(() => {
    const t = { efectivo: 0, yape_plin: 0, tarjeta: 0, transferencia: 0, gastos: 0, diferencia: 0, entregado: 0 };
    historial.forEach((h) => {
      Object.keys(METODOS).forEach((k) => (t[k] += h.summary.ingresos[k] || 0));
      t.gastos += h.summary.totalEgresos || 0;
      t.diferencia += h.difference || 0;
      t.entregado += h.deliveredCash || 0;
    });
    Object.keys(t).forEach((k) => (t[k] = r2(t[k])));
    return t;
  }, [historial]);

  const terminar = (texto) => {
    setVista(null);
    setAviso(texto);
    refreshCashShift();
    setTimeout(() => setAviso(""), 6000);
  };

  if (vista === "abrir")
    return <AbrirCaja ultimo={ultimo} onVolver={() => setVista(null)} onAbierta={() => terminar("Caja abierta. ¡Buen turno!")} />;
  if (vista === "cerrar" && abierto)
    return (
      <CerrarCaja
        turno={abierto}
        onVolver={() => setVista(null)}
        onCerrada={(t) => {
          terminar(`Caja cerrada. Dejaste ${soles(t.nextShiftCash)} para el siguiente turno.`);
          setVista({ detalle: t.id });
        }}
      />
    );
  if (vista === "movimiento" && abierto)
    return <MovimientoTurno turno={abierto} onVolver={() => setVista(null)} onGuardado={() => terminar("Movimiento guardado en el turno.")} />;
  if (vista?.detalle) return <DetalleTurno id={vista.detalle} onVolver={() => setVista(null)} />;

  const mio = abierto && abierto.openedByUserId === String(currentUser?.id);

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-blue-300 flex items-center gap-1.5">
              <Vault className="w-4 h-4" /> Caja por turnos · Arqueo
            </span>
            <h1 className="text-2xl font-black mt-1">Apertura & Cierre de Caja</h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Cada recepcionista abre su caja con el efectivo que recibe y la cierra contando el dinero. Las ventas, matrículas y
              renovaciones se suman solas al turno abierto.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                refreshCashShift();
                cargarHistorial();
              }}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? "animate-spin" : ""}`} />
            </button>
            {abierto ? (
              <>
                {puedeAbrir && (
                  <button
                    onClick={() => setVista("movimiento")}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Ingreso / gasto
                  </button>
                )}
                {puedeCerrar && (
                  <button
                    onClick={() => setVista("cerrar")}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 font-black text-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" /> Cerrar caja (arqueo)
                  </button>
                )}
              </>
            ) : (
              puedeAbrir && (
                <button
                  onClick={() => setVista("abrir")}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-black text-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <LockOpen className="w-4 h-4" /> Abrir mi caja
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {aviso && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">{aviso}</div>
      )}
      {cashShift?.unassigned > 0 && userCan(currentUser, "finance", "ver") && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          Hay <strong>{cashShift.unassigned}</strong> movimiento(s) de las últimas 24 h registrados con la caja cerrada (no pertenecen a
          ningún turno). Revísalos en Finanzas & Caja.
        </div>
      )}

      <MetaDelTurno turnoId={abierto?.receptionShiftId || null} />

      {/* Estado actual */}
      {abierto ? (
        <>
          <div className="bg-white rounded-2xl border-2 border-emerald-300 p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <LockOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-black uppercase text-emerald-600">Caja abierta {mio ? "· tu turno" : ""}</span>
                <h3 className="text-lg font-black text-slate-900">{abierto.openedBy}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Desde las {hora(abierto.openedAt)} del {fechaCorta(abierto.openedAt)} ·{" "}
                  {duracion(abierto.openedAt)}
                </p>
              </div>
            </div>
            {!mio && (
              <p className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 max-w-md">
                Esta caja la abrió <strong>{abierto.openedBy}</strong>. Si empieza tu turno, ciérrala con el arqueo y luego abre la tuya:
                así cada uno responde por su dinero.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi
              label="Efectivo al abrir"
              value={soles(abierto.openingCash)}
              hint={
                Math.abs(abierto.openingDifference) >= 0.01
                  ? `Recibió ${soles(abierto.receivedCash)} (dif. ${soles(abierto.openingDifference)})`
                  : `Recibido del turno anterior`
              }
            />
            <Kpi label="+ Cobros en efectivo" value={soles(abierto.summary.ingresos.efectivo)} tone="green" />
            <Kpi label="− Gastos en efectivo" value={soles(abierto.summary.egresos.efectivo)} tone="red" />
            <Kpi label="Debe haber en caja" value={soles(abierto.expectedCash)} tone="blue" big />
          </div>
          <ResumenMetodos resumen={abierto.summary} />
          <div className="grid grid-cols-3 gap-3">
            <Kpi label="Total cobrado en el turno" value={soles(abierto.summary.totalIngresos)} tone="green" />
            <Kpi label="Ventas POS" value={abierto.summary.ventas} />
            <Kpi label="Matrículas / renovaciones" value={abierto.summary.matriculas} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">Movimientos de este turno</h3>
            <TablaMovimientos movimientos={movimientos} />
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-slate-500">Caja cerrada</span>
              <h3 className="text-lg font-black text-slate-900">Nadie tiene la caja abierta</h3>
              <p className="text-sm text-slate-500">
                {ultimo
                  ? `Último cierre: ${ultimo.closedBy}, ${fechaCorta(ultimo.closedAt)} a las ${hora(ultimo.closedAt)} · dejó ${soles(
                      ultimo.nextShiftCash,
                    )} en caja.`
                  : "Aún no hay turnos registrados."}{" "}
                Para cobrar en recepción primero abre tu caja.
              </p>
            </div>
          </div>
          {puedeAbrir && (
            <button
              onClick={() => setVista("abrir")}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center gap-2 cursor-pointer"
            >
              <LockOpen className="w-5 h-5" /> Abrir mi caja
            </button>
          )}
        </div>
      )}

      {/* Turnos del periodo */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Turnos {desde === hasta && desde === hoyISO() ? "de hoy" : "del periodo"}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-300" />
            <span className="text-slate-400">a</span>
            <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-300" />
          </div>
        </div>

        {historial.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-6">No hay turnos en estas fechas.</p>
        ) : (
          <>
            <div className="space-y-2">
              {historial.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setVista({ detalle: h.id })}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 grid grid-cols-2 md:grid-cols-6 gap-3 items-center cursor-pointer"
                >
                  <div className="col-span-2 flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        h.status === "abierto" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-sm text-slate-900 block">{h.openedBy}</strong>
                      <span className="text-xs text-slate-500">
                        {fechaCorta(h.openedAt)} · {hora(h.openedAt)} – {h.closedAt ? hora(h.closedAt) : "en curso"}
                        {h.closedBy && h.closedBy !== h.openedBy ? ` (cerró ${h.closedBy})` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-xs text-slate-400 block">Cobrado</span>
                    <strong className="text-emerald-600">{soles(h.summary.totalIngresos)}</strong>
                  </div>
                  <div className="text-sm">
                    <span className="text-xs text-slate-400 block">Efectivo esperado</span>
                    <strong>{soles(h.expectedCash)}</strong>
                  </div>
                  <div className="text-sm">
                    <span className="text-xs text-slate-400 block">Contado</span>
                    <strong>{h.countedCash != null ? soles(h.countedCash) : "—"}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {h.status === "abierto" ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">Abierta</span>
                    ) : (
                      <Diferencia valor={h.difference} />
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-3 border-t border-slate-100 text-sm">
              {[
                ["Efectivo", totales.efectivo],
                ["Yape / Plin", totales.yape_plin],
                ["Tarjeta", totales.tarjeta],
                ["Transferencia", totales.transferencia],
                ["Gastos", -totales.gastos],
                ["Entregado a adm.", totales.entregado],
                ["Diferencias", totales.diferencia],
              ].map(([l, v]) => (
                <div key={l} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-400 font-bold block">{l}</span>
                  <strong className={v < 0 ? "text-rose-600" : "text-slate-900"}>{soles(v)}</strong>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
