// =====================================================================
// CONGELAMIENTO DE MEMBRESÍAS
//
// Reglas (las define cada plan y se copian a la matrícula al venderla):
//   total   = días que se pueden congelar (0 = el plan no permite)
//   partes  = en cuántas veces como máximo (1 = todo de una vez)
//   minimo  = mínimo de días por congelamiento
// "Todo o nada": no se puede ir congelando de a pocos.
//   - Si queda una sola parte, se congelan TODOS los días que quedan.
//   - Cada parte tiene al menos el mínimo, y lo que sobra también debe
//     alcanzar el mínimo (ej. 30 días en 2 partes, mín. 15 -> 30, o 15 + 15).
//   - Si el alumno vuelve antes, los días no usados se pierden.
// El derecho caduca cuando vence la membresía.
// =====================================================================
import { ErrorHttp } from "./seguridad.js";

// Fecha de hoy en Lima (AAAA-MM-DD). Se guarda 1 minuto: calcularla con zona horaria
// para cada fila de una lista grande era lo más lento de la API.
const FORMATO_LIMA = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" });
let cacheHoy = { t: 0, v: "" };
export const hoyLima = () => {
  const ahora = Date.now();
  if (ahora - cacheHoy.t > 60000) cacheHoy = { t: ahora, v: FORMATO_LIMA.format(ahora) };
  return cacheHoy.v;
};

export function sumarDias(fecha, dias) {
  const d = new Date(`${String(fecha).slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Number(dias));
  return d.toISOString().slice(0, 10);
}

export const diasEntre = (desde, hasta) =>
  Math.round((new Date(`${String(hasta).slice(0, 10)}T12:00:00Z`) - new Date(`${String(desde).slice(0, 10)}T12:00:00Z`)) / 86400000);

const fecha = (v) => (v ? (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10)) : null);

/** Reglas de una fila con columnas congelamiento_* (de la matrícula o del plan) */
export function reglas(f) {
  const total = Math.max(0, Number(f?.congelamiento_dias || 0));
  const partes = Math.max(1, Number(f?.congelamiento_partes || 1));
  const minimo = total > 0 ? Math.min(total, Math.max(1, Number(f?.congelamiento_min_dias || 0) || (partes === 1 ? total : 1))) : 0;
  return { total, partes: total > 0 ? partes : 0, minimo: partes === 1 ? total : minimo };
}

/** Texto corto de las reglas, para tarjetas de plan, reportes y portal */
export function textoReglas(r) {
  if (!r.total) return "Sin congelamiento";
  if (r.partes === 1) return `${r.total} días de congelamiento (todo de una vez)`;
  return `${r.total} días de congelamiento, hasta ${r.partes} partes de mínimo ${r.minimo} días`;
}

/** Estado de un congelamiento según sus fechas */
export function estadoCongelamiento(c, hoy = hoyLima()) {
  if (c.estado === "anulado") return "anulado";
  if (c.estado === "terminado_antes") return "terminado_antes";
  const ini = fecha(c.fecha_inicio);
  const fin = fecha(c.fecha_fin);
  if (hoy < ini) return "programado";
  if (hoy <= fin) return "activo";
  return "cumplido";
}

export const ETIQUETA_ESTADO = {
  programado: "Programado",
  activo: "Congelado",
  cumplido: "Cumplido",
  terminado_antes: "Terminado antes",
  anulado: "Anulado",
};

/**
 * Saldo del derecho a congelar de una matrícula.
 * @param m   matrícula con congelamiento_* (ya resuelto con el plan) y fecha_fin
 * @param lista congelamientos de esa matrícula
 */
export function saldo(m, lista, hoy = hoyLima()) {
  const r = reglas(m);
  const validos = lista.filter((c) => c.estado !== "anulado");
  const usados = validos.reduce((s, c) => s + Number(c.dias), 0);
  const partesUsadas = validos.length;
  const restante = Math.max(0, r.total - usados);
  const partesRestantes = Math.max(0, r.partes - partesUsadas);
  const finMembresia = fecha(m.fecha_fin);
  const caducado = !!finMembresia && finMembresia < hoy;
  let motivoNo = null;
  if (!r.total) motivoNo = "El plan de esta membresía no incluye congelamiento";
  else if (caducado) motivoNo = "La membresía ya venció: el derecho a congelar caducó";
  else if (!restante) motivoNo = "Ya usó todos los días de congelamiento de esta membresía";
  else if (!partesRestantes) motivoNo = `Ya usó los ${r.partes} congelamiento(s) permitidos`;
  const ultimaParte = partesRestantes === 1;
  return {
    ...r,
    texto: textoReglas(r),
    usados,
    partesUsadas,
    restante,
    partesRestantes,
    caducaEl: finMembresia,
    puede: !motivoNo,
    motivoNo,
    // Rango permitido para el próximo congelamiento
    minDias: !motivoNo ? (ultimaParte ? restante : Math.min(r.minimo, restante)) : 0,
    maxDias: !motivoNo ? restante : 0,
    debeUsarTodo: !motivoNo && (ultimaParte || restante <= r.minimo),
  };
}

/** Valida los días pedidos contra el saldo ("todo o nada") */
export function validarDias(s, dias) {
  if (!s.puede) throw new ErrorHttp(400, s.motivoNo);
  if (!Number.isInteger(dias) || dias < 1) throw new ErrorHttp(400, "Indica cuántos días se congela");
  if (s.debeUsarTodo && dias !== s.restante) {
    throw new ErrorHttp(400, `Es todo o nada: debe congelar los ${s.restante} días que le quedan en una sola vez`);
  }
  if (dias > s.restante) throw new ErrorHttp(400, `Solo le quedan ${s.restante} días de congelamiento`);
  if (dias < s.minimo) throw new ErrorHttp(400, `Cada congelamiento debe ser de al menos ${s.minimo} días`);
  const sobra = s.restante - dias;
  if (sobra > 0 && sobra < s.minimo) {
    throw new ErrorHttp(
      400,
      `No puede quedar un saldo menor al mínimo: congele ${s.restante} días, o como máximo ${s.restante - s.minimo} para dejar ${s.minimo}`,
    );
  }
}

/** Convierte una fila de la tabla congelamientos al formato de la app */
export function aCongelamiento(c, hoy = hoyLima()) {
  const est = estadoCongelamiento(c, hoy);
  return {
    id: String(c.idcongelamiento),
    enrollmentId: String(c.idmatricula),
    memberId: String(c.idalumno),
    startDate: fecha(c.fecha_inicio),
    endDate: fecha(c.fecha_fin),
    returnDate: sumarDias(c.fecha_fin, 1),
    days: Number(c.dias),
    daysUsed: c.dias_usados != null ? Number(c.dias_usados) : null,
    reason: c.motivo,
    status: est,
    statusLabel: ETIQUETA_ESTADO[est],
    daysLeft: est === "activo" ? diasEntre(hoy, c.fecha_fin) + 1 : est === "programado" ? diasEntre(hoy, c.fecha_inicio) : null,
    membershipEndBefore: fecha(c.fin_membresia_antes),
    membershipEndAfter: fecha(c.fin_membresia_despues),
    registeredBy: c.registrado_por || "",
    registeredAt: c.fecha_registro,
    closedBy: c.cerrado_por || "",
    closedAt: c.fecha_cierre,
    closeNote: c.observacion_cierre || "",
    planName: c.plan || "",
    memberName: c.alumno || "",
    memberDni: c.dni || "",
    memberPhone: c.telefono || "",
  };
}

export const SQL_CONGELAMIENTOS = `
  SELECT c.*, ur.usuario AS registrado_por, uc.usuario AS cerrado_por, p.nombre AS plan,
         CONCAT(a.nombres, ' ', a.apellidos) AS alumno, a.dni, a.telefono
    FROM congelamientos c
    JOIN matriculas m ON m.idmatricula = c.idmatricula
    JOIN planes p ON p.idplan = m.idplan
    JOIN alumnos a ON a.idalumno = c.idalumno
    LEFT JOIN usuarios ur ON ur.idusuario = c.idusuario_registro
    LEFT JOIN usuarios uc ON uc.idusuario = c.idusuario_cierre`;

/**
 * Mueve el vencimiento de la matrícula (y las renovaciones que empiezan
 * después de ella) en "dias" (positivo = alarga, negativo = acorta).
 */
export async function moverMembresia(cx, m, dias) {
  if (!dias) return;
  const finAnterior = fecha(m.fecha_fin);
  await cx.query(
    `UPDATE matriculas SET fecha_inicio = DATE_ADD(fecha_inicio, INTERVAL ? DAY), fecha_fin = DATE_ADD(fecha_fin, INTERVAL ? DAY)
      WHERE idalumno = ? AND idmatricula <> ? AND estado <> 'anulada' AND fecha_inicio > ?`,
    [dias, dias, m.idalumno, m.idmatricula, finAnterior],
  );
  await cx.query("UPDATE matriculas SET fecha_fin = DATE_ADD(fecha_fin, INTERVAL ? DAY) WHERE idmatricula = ?", [dias, m.idmatricula]);
  // Recalcula el estado de las matrículas tocadas
  await cx.query(
    `UPDATE matriculas SET estado = CASE
        WHEN fecha_fin < CURDATE() THEN 'vencida'
        WHEN fecha_fin <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'por_vencer'
        ELSE 'activa' END
      WHERE idalumno = ? AND estado IN ('activa','por_vencer','vencida','congelada')`,
    [m.idalumno],
  );
}
