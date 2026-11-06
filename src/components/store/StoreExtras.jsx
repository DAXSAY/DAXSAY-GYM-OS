// ============================================================
// TIENDA: movimientos de inventario, kárdex y ventas/reportes
// Todo se lee y guarda en MySQL (productos, ventas, venta_detalle,
// movimientos_inventario) a través de /api/tienda.
// ============================================================
import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  PackagePlus,
  PackageMinus,
  ClipboardCheck,
  History,
  RefreshCw,
  Printer,
  Ban,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Receipt,
  Wallet,
  Boxes,
  AlertTriangle,
} from "lucide-react";
import { api } from "../../api/cliente";
import { hoyISO } from "../../utils/fecha";

const soles = (n) => `S/ ${Number(n || 0).toFixed(2)}`;
const fechaHora = (dt) => {
  if (!dt) return "—";
  const s = String(dt);
  return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)} ${s.slice(11, 16)}`;
};
const METODO = { efectivo: "Efectivo", yape_plin: "Yape / Plin", tarjeta: "Tarjeta", transferencia: "Transferencia" };
const TIPO_KARDEX = {
  inicial: { label: "Stock inicial", color: "bg-slate-100 text-slate-700" },
  entrada: { label: "Entrada", color: "bg-emerald-100 text-emerald-700" },
  venta: { label: "Venta", color: "bg-blue-100 text-blue-700" },
  anulacion: { label: "Anulación", color: "bg-purple-100 text-purple-700" },
  ajuste: { label: "Ajuste", color: "bg-amber-100 text-amber-800" },
  merma: { label: "Merma", color: "bg-rose-100 text-rose-700" },
};

const Pantalla = ({ titulo, subtitulo, onVolver, children, acciones, ancho = "max-w-5xl" }) => (
  <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
    <div className={`w-full ${ancho} mx-auto min-h-full p-4 sm:p-6 space-y-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-sm font-bold flex items-center gap-1.5 cursor-pointer"
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

// ------------------------------------------------------------
// Entrada de mercadería / merma / ajuste por inventario físico
// ------------------------------------------------------------
export const StockMovementScreen = ({ product, puedeAjustar, onVolver, onGuardar }) => {
  const [tipo, setTipo] = useState("entrada");
  const [cantidad, setCantidad] = useState("");
  const [costo, setCosto] = useState(String(product.purchaseCost ?? ""));
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const n = Math.round(Number(cantidad) || 0);
  const resultado = tipo === "entrada" ? product.stock + n : tipo === "merma" ? product.stock - n : n;

  const opciones = [
    { k: "entrada", label: "Ingreso de mercadería", desc: "Llegó producto del proveedor", icon: PackagePlus, color: "emerald" },
    ...(puedeAjustar
      ? [
          { k: "merma", label: "Merma / salida", desc: "Vencido, roto o consumo interno", icon: PackageMinus, color: "rose" },
          { k: "ajuste", label: "Inventario físico", desc: "Corregir con lo que se contó", icon: ClipboardCheck, color: "amber" },
        ]
      : []),
  ];

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    if (resultado < 0) return setError(`Solo hay ${product.stock} unidades.`);
    setEnviando(true);
    try {
      await onGuardar({ tipo, cantidad: n, costo: tipo === "entrada" ? Number(costo) || null : null, motivo });
    } catch (er) {
      setError(er.message);
      setEnviando(false);
    }
  };

  return (
    <Pantalla titulo={`Movimiento de stock · ${product.name}`} subtitulo={`Stock actual: ${product.stock} unidades`} onVolver={onVolver} ancho="max-w-3xl">
      <form onSubmit={guardar} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className={`grid gap-2 ${opciones.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1"}`}>
          {opciones.map(({ k, label, desc, icon: Icono, color }) => (
            <button
              type="button"
              key={k}
              onClick={() => {
                setTipo(k);
                setCantidad(k === "ajuste" ? String(product.stock) : "");
              }}
              className={`p-3 rounded-xl border-2 text-left cursor-pointer ${
                tipo === k
                  ? color === "emerald"
                    ? "border-emerald-500 bg-emerald-50"
                    : color === "rose"
                      ? "border-rose-500 bg-rose-50"
                      : "border-amber-500 bg-amber-50"
                  : "border-slate-200"
              }`}
            >
              <span className="flex items-center gap-1.5 font-black text-sm text-slate-900">
                <Icono className="w-4 h-4" /> {label}
              </span>
              <span className="text-xs text-slate-500">{desc}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              {tipo === "ajuste" ? "Stock contado (unidades)" : "Cantidad (unidades)"}
            </span>
            <input
              type="number"
              min="0"
              step="1"
              required
              autoFocus
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-300 text-2xl font-black"
            />
          </label>
          {tipo === "entrada" ? (
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Costo unitario de compra (S/)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
                className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-300 text-xl font-bold"
              />
              <span className="text-xs text-slate-500">Si cambió, se actualiza el costo del producto.</span>
            </label>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase block">Quedará en stock</span>
              <span className={`text-2xl font-black ${resultado < 0 ? "text-rose-600" : "text-slate-900"}`}>{resultado}</span>
              <span className="text-xs text-slate-500 block">
                {tipo === "ajuste" && `Diferencia: ${resultado - product.stock > 0 ? "+" : ""}${resultado - product.stock}`}
              </span>
            </div>
          )}
        </div>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">
            {tipo === "entrada" ? "Proveedor / guía (opcional)" : "Motivo (obligatorio)"}
          </span>
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required={tipo !== "entrada"}
            placeholder={tipo === "entrada" ? "Ej. Distribuidora Lima · Guía 001-2345" : "Ej. 3 botellas vencidas"}
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
          />
        </label>

        {tipo === "entrada" && n > 0 && (
          <p className="text-sm text-slate-600">
            Stock después del ingreso: <strong>{resultado}</strong>
            {Number(costo) > 0 && <> · Inversión: <strong>{soles(n * Number(costo))}</strong></>}
          </p>
        )}
        {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
        <button disabled={enviando} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black cursor-pointer">
          {enviando ? "Guardando…" : "Registrar movimiento"}
        </button>
      </form>
    </Pantalla>
  );
};

// ------------------------------------------------------------
// Kárdex de un producto
// ------------------------------------------------------------
export const KardexScreen = ({ product, onVolver }) => {
  const [filas, setFilas] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api(`/tienda/productos/${product.id}/kardex`).then(setFilas).catch((e) => setError(e.message));
  }, [product.id]);

  const resumen = useMemo(() => {
    const r = { entradas: 0, ventas: 0, mermas: 0 };
    (filas || []).forEach((f) => {
      if (f.type === "entrada" || f.type === "inicial") r.entradas += f.quantity;
      if (f.type === "venta") r.ventas += -f.quantity;
      if (f.type === "anulacion") r.ventas -= f.quantity;
      if (f.type === "merma") r.mermas += -f.quantity;
    });
    return r;
  }, [filas]);

  return (
    <Pantalla titulo={`Kárdex · ${product.name}`} subtitulo="Historial de entradas y salidas del producto" onVolver={onVolver}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["Stock actual", product.stock],
          ["Ingresado", resumen.entradas],
          ["Vendido", resumen.ventas],
          ["Mermas", resumen.mermas],
        ].map(([l, v]) => (
          <div key={l} className="bg-white rounded-2xl border border-slate-200 p-4">
            <span className="text-xs font-bold text-slate-400 uppercase block">{l}</span>
            <span className="text-xl font-black text-slate-900">{v}</span>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 overflow-x-auto">
        {error && <p className="text-rose-600 font-bold">{error}</p>}
        {!filas ? (
          !error && <p className="text-slate-500">Cargando…</p>
        ) : filas.length === 0 ? (
          <p className="text-center text-slate-500 py-6">Sin movimientos.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-200">
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Movimiento</th>
                <th className="py-2 pr-3">Detalle</th>
                <th className="py-2 pr-3">Usuario</th>
                <th className="py-2 pr-3 text-right">Cantidad</th>
                <th className="py-2 text-right">Stock</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-mono text-slate-500">{fechaHora(f.dateTime)}</td>
                  <td className="py-2 pr-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black ${TIPO_KARDEX[f.type]?.color}`}>
                      {TIPO_KARDEX[f.type]?.label || f.type}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-slate-700">
                    {f.receipt && <span className="font-mono text-xs text-blue-700 mr-1">{f.receipt}</span>}
                    {f.reason}
                    {f.unitCost != null && <span className="text-xs text-slate-500"> · costo {soles(f.unitCost)}</span>}
                  </td>
                  <td className="py-2 pr-3 text-slate-500">{f.user || "—"}</td>
                  <td className={`py-2 pr-3 text-right font-black ${f.quantity >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {f.quantity > 0 ? "+" : ""}
                    {f.quantity}
                  </td>
                  <td className="py-2 text-right font-bold">{f.stockAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Pantalla>
  );
};

// ------------------------------------------------------------
// Anular una venta (pide motivo)
// ------------------------------------------------------------
const AnularVenta = ({ venta, onVolver, onAnulada }) => {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const anular = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      onAnulada(await api(`/tienda/ventas/${venta.id}/anular`, { method: "POST", body: { motivo } }));
    } catch (er) {
      setError(er.message);
      setEnviando(false);
    }
  };
  return (
    <Pantalla titulo={`Anular ${venta.receiptNumber}`} subtitulo={`${venta.customer} · ${soles(venta.total)}`} onVolver={onVolver} ancho="max-w-2xl">
      <form onSubmit={anular} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
          Se devolverán al stock los productos de la venta y se quitará el ingreso de la caja del turno abierto. La venta queda en
          el historial marcada como anulada.
        </div>
        <ul className="text-sm text-slate-700 space-y-1">
          {venta.items.map((i) => (
            <li key={i.productId} className="flex justify-between">
              <span>
                {i.quantity} × {i.productName}
              </span>
              <span className="font-mono">{soles(i.total)}</span>
            </li>
          ))}
        </ul>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Motivo de la anulación</span>
          <input
            required
            minLength={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. Se cobró dos veces / cliente devolvió el producto"
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
          />
        </label>
        {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
        <button disabled={enviando} className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-black cursor-pointer">
          {enviando ? "Anulando…" : "Anular venta"}
        </button>
      </form>
    </Pantalla>
  );
};

// ------------------------------------------------------------
// Ventas y reportes
// ------------------------------------------------------------
const hace = (dias) => {
  const d = new Date(`${hoyISO()}T12:00:00`);
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
};

export const SalesReport = ({ puedeAnular, onReimprimir, onCambio }) => {
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState(hoyISO());
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [abierta, setAbierta] = useState(null);
  const [anulando, setAnulando] = useState(null);
  const [verAnuladas, setVerAnuladas] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    setCargando(true);
    setError("");
    try {
      const [v, r] = await Promise.all([
        api(`/tienda/ventas?desde=${desde}&hasta=${hasta}`),
        api(`/tienda/resumen?desde=${desde}&hasta=${hasta}`),
      ]);
      setVentas(v);
      setResumen(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };
  useEffect(() => {
    cargar();
  }, [desde, hasta]);

  if (anulando)
    return (
      <AnularVenta
        venta={anulando}
        onVolver={() => setAnulando(null)}
        onAnulada={() => {
          setAnulando(null);
          cargar();
          onCambio?.();
        }}
      />
    );

  const lista = verAnuladas ? ventas : ventas.filter((v) => !v.voided);
  const maxUnidades = Math.max(1, ...(resumen?.topProducts || []).map((p) => p.units));
  const rangos = [
    ["Hoy", hoyISO(), hoyISO()],
    ["7 días", hace(6), hoyISO()],
    ["30 días", hace(29), hoyISO()],
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {rangos.map(([l, a, b]) => (
            <button
              key={l}
              onClick={() => {
                setDesde(a);
                setHasta(b);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                desde === a && hasta === b ? "bg-blue-600 text-white" : "bg-gray-100 text-slate-700 hover:bg-gray-200"
              }`}
            >
              {l}
            </button>
          ))}
          <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} className="px-2 py-1 rounded-lg border border-gray-300 text-xs" />
          <span className="text-xs text-slate-400">a</span>
          <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} className="px-2 py-1 rounded-lg border border-gray-300 text-xs" />
        </div>
        <button onClick={cargar} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer" title="Actualizar">
          <RefreshCw className={`w-4 h-4 ${cargando ? "animate-spin" : ""}`} />
        </button>
      </div>
      {error && <p className="text-sm font-bold text-rose-600">{error}</p>}

      {resumen && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              ["Total vendido", soles(resumen.total), Wallet, "text-emerald-600"],
              ["Ventas", resumen.sales, Receipt, "text-slate-900"],
              ["Ticket promedio", soles(resumen.avgTicket), TrendingUp, "text-blue-700"],
              ["Ganancia estimada", soles(resumen.profit), TrendingUp, "text-emerald-700"],
              ["Unidades vendidas", resumen.units, Boxes, "text-slate-900"],
            ].map(([l, v, Icono, c]) => (
              <div key={l} className="bg-white rounded-xl border border-gray-200 p-4">
                <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Icono className="w-3.5 h-3.5" /> {l}
                </span>
                <span className={`text-xl font-black ${c}`}>{v}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4 space-y-2.5">
              <h3 className="text-xs font-black uppercase text-slate-500">Productos más vendidos</h3>
              {resumen.topProducts.length === 0 && <p className="text-sm text-slate-500">Sin ventas en estas fechas.</p>}
              {resumen.topProducts.map((p) => (
                <div key={p.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-800">{p.name}</span>
                    <span className="text-slate-600">
                      {p.units} u · <strong>{soles(p.total)}</strong> <span className="text-emerald-700">(+{soles(p.profit)})</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(p.units / maxUnidades) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
                <h3 className="text-xs font-black uppercase text-slate-500">Por método de pago</h3>
                {Object.entries(METODO).map(([k, l]) => {
                  const m = resumen.byMethod.find((x) => x.method === k);
                  return (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-600">{l}</span>
                      <strong>{soles(m?.total)}</strong>
                    </div>
                  );
                })}
                {resumen.voided > 0 && <p className="text-xs text-rose-600 font-bold pt-1">{resumen.voided} venta(s) anulada(s)</p>}
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
                <h3 className="text-xs font-black uppercase text-slate-500">Inventario hoy</h3>
                <div className="flex justify-between">
                  <span className="text-slate-600">Valor a costo</span>
                  <strong>{soles(resumen.inventory.costValue)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Valor a precio de venta</span>
                  <strong>{soles(resumen.inventory.saleValue)}</strong>
                </div>
                {(resumen.inventory.low > 0 || resumen.inventory.outOfStock > 0) && (
                  <p className="text-xs text-amber-700 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {resumen.inventory.low} con stock bajo · {resumen.inventory.outOfStock} agotados
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
            <History className="w-4 h-4" /> Historial de ventas ({lista.length})
          </h3>
          <label className="text-xs text-slate-600 flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={verAnuladas} onChange={(e) => setVerAnuladas(e.target.checked)} /> Mostrar anuladas
          </label>
        </div>
        {lista.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-6">No hay ventas en estas fechas.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {lista.map((v) => (
              <div key={v.id} className={v.voided ? "opacity-60" : ""}>
                <button onClick={() => setAbierta(abierta === v.id ? null : v.id)} className="w-full py-3 grid grid-cols-2 md:grid-cols-6 gap-2 items-center text-left text-sm cursor-pointer">
                  <span className="font-mono font-bold text-blue-700">{v.receiptNumber}</span>
                  <span className="text-slate-500">{fechaHora(v.dateTime)}</span>
                  <span className="md:col-span-2 text-slate-800 truncate">
                    {v.customer} <span className="text-xs text-slate-400">· {v.items.reduce((a, i) => a + i.quantity, 0)} u</span>
                  </span>
                  <span className="text-slate-600">{METODO[v.paymentMethod]}</span>
                  <span className="flex items-center justify-end gap-2">
                    {v.voided ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700">Anulada</span>
                    ) : (
                      <strong className="text-emerald-700">{soles(v.total)}</strong>
                    )}
                    {abierta === v.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </span>
                </button>
                {abierta === v.id && (
                  <div className="pb-4 px-2 space-y-3">
                    <table className="w-full text-sm">
                      <tbody>
                        {v.items.map((i) => (
                          <tr key={i.productId} className="border-b border-gray-50">
                            <td className="py-1">{i.quantity} × {i.productName}</td>
                            <td className="py-1 text-right font-mono text-slate-500">{soles(i.unitPrice)} c/u</td>
                            <td className="py-1 text-right font-mono font-bold">{soles(i.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-slate-500">
                      Cobró: {v.seller || "—"}
                      {v.voided && ` · Anulada el ${fechaHora(v.voidedAt)}: ${v.voidReason}`}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onReimprimir({ ...v, amount: v.total, relatedMemberName: v.customer })}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> Ver / imprimir ticket
                      </button>
                      {puedeAnular && !v.voided && (
                        <button
                          onClick={() => setAnulando(v)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" /> Anular venta
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
