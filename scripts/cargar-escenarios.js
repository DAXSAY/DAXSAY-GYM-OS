// =====================================================================
// ESCENARIOS DE DEMOSTRACIÓN (segunda carga, complementa cargar-demo.js)
// 21 alumnos más (DNI 70900021 a 70900041) en situaciones distintas para
// ver cómo se comporta el sistema:
//   * vencidos que NO renovaron (hace 3, 9, 16 y 35 días)
//   * por vencer (en 1, 3 y 6 días) - uno con saldo pendiente
//   * renovaron antes de vencer / renovaron después de vencer
//   * congelados (hoy) y con congelamiento programado
//   * pagos por partes (abonos, saldo pendiente, deuda que vence pronto)
//   * dejaron de venir (con notas de seguimiento: lesión, trabajo...)
//   * recién matriculados
// Todo por la misma API que usa la app (queda en MySQL y sincronizado).
// Se puede ejecutar varias veces: lo que ya existe no se repite.
//
// Uso (sesión de ADMINISTRADOR abierta, en la consola del navegador):
//   const m = await import("/scripts/cargar-escenarios.js"); await m.cargarEscenarios();
// Para producción se borra todo con base_datos/99_reiniciar_para_produccion.sql
// =====================================================================

const TZ = "America/Lima";
const hoyISO = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });
const sumarDias = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
const hora12 = (h, m) => `${String(((h + 11) % 12) + 1).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
const diaSemana = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();

let semilla = 1;
const sembrar = (clave) => {
  semilla = 2166136261;
  for (const ch of String(clave)) semilla = Math.imul(semilla ^ ch.charCodeAt(0), 16777619) >>> 0;
  semilla = (semilla % 2147483646) + 1;
};
const azar = () => ((semilla = (semilla * 48271) % 2147483647) / 2147483647);
const entre = (a, b) => a + Math.floor(azar() * (b - a + 1));
const uno = (l) => l[Math.floor(azar() * l.length)];

// nombre, sexo, nacimiento, plan, escenario, parámetro, objetivo
const ESCENARIOS = [
  // Vencidos que no renovaron (parámetro = días que lleva vencido)
  ["Martín Eduardo Salazar Ccori", "M", "1992-05-11", "mensual", "vencido", 3, "hipertrofia"],
  ["Rosa Elena Quispe Mamani", "F", "1990-08-30", "mensual", "vencido", 9, "perdida_peso"],
  ["Hugo Alberto Condori Apaza", "M", "1986-01-15", "mensual", "vencido", 16, "salud"],
  ["Claudia Beatriz Ñahui Ttito", "F", "1999-03-22", "mensual", "vencido", 35, "tonificacion"],
  // Por vencer (parámetro = días que le quedan)
  ["Pedro Pablo Huillca Roque", "M", "1994-12-03", "mensual", "por_vencer", 1, "hipertrofia"],
  ["Jimena Lucía Alarcón Peña", "F", "2001-07-07", "mensual", "por_vencer", 3, "tonificacion"],
  ["Sergio Andrés Pumacahua Vela", "M", "1997-04-19", "mensual", "por_vencer_deuda", 6, "rendimiento"],
  // Renovaron
  ["Andrea Carolina Mendoza Tupa", "F", "1995-10-25", "mensual", "renovo_antes", 27, "perdida_peso"],
  ["Bruno Alexis Gamarra Choque", "M", "1993-06-01", "mensual", "renovo_antes", 25, "hipertrofia"],
  ["Milagros Yeni Cusi Huamán", "F", "1988-09-09", "mensual", "renovo_despues", 38, "salud"],
  // Congelamientos (plan que permite congelar)
  ["Ricardo Javier Loayza Soto", "M", "1990-02-14", "semestral", "congelado_hoy", 15, "hipertrofia"],
  ["Natalia Fiorella Villena Ríos", "F", "1996-11-28", "anual", "congelado_hoy", 15, "tonificacion"],
  ["Gustavo Adolfo Tapia Ramos", "M", "1984-07-03", "semestral", "congelado_programado", 15, "salud"],
  // Pagos por partes
  ["Karen Lizbeth Huanca Puma", "F", "2000-05-05", "trimestral", "pago_completo_partes", 0, "tonificacion"],
  ["Jhon Franklin Arias Ccahua", "M", "1998-01-20", "trimestral", "pago_parcial_abono", 0, "hipertrofia"],
  ["Elizabeth Mery Coaquira Yupanqui", "F", "1991-03-31", "trimestral", "deuda_vence_pronto", 2, "perdida_peso"],
  // Dejaron de venir (parámetro = días sin venir)
  ["Iván Gonzalo Mamani Laura", "M", "1995-08-08", "semestral", "ausente", 12, "hipertrofia"],
  ["Paola Vanessa Chura Quispe", "F", "1997-12-17", "semestral", "ausente", 18, "tonificacion"],
  ["Walter Rubén Ccama Huarca", "M", "1980-10-10", "trimestral", "ausente", 25, "salud"],
  // Recién matriculados (parámetro = hace cuántos días)
  ["Lucía Fernanda Paz Chávez", "F", "2005-02-02", "mensual", "nuevo", 2, "tonificacion"],
  ["Adrián Mateo Cornejo Vargas", "M", "2004-09-15", "mensual", "nuevo", 0, "rendimiento"],
];

const NOTAS_AUSENCIA = {
  vencido: [
    { reason: "economico", channel: "whatsapp", detail: "Dice que renueva a fin de mes, cuando le paguen" },
    { reason: "viaje", channel: "llamada", detail: "Viajó a Arequipa por un mes; vuelve y renueva" },
    { reason: "horario", channel: "whatsapp", detail: "Cambió de trabajo y no le acomoda el horario; ofrecer turno noche" },
    { reason: "motivacion", channel: "ninguno", detail: "No contesta. Volver a escribir el lunes" },
  ],
  ausente: [
    { reason: "lesion", channel: "llamada", detail: "Se torció el tobillo jugando fútbol; derivar a fisioterapia" },
    { reason: "trabajo", channel: "whatsapp", detail: "Tiene inventario en su trabajo, regresa la próxima semana" },
    { reason: "salud", channel: "presencial", detail: "Vino a avisar que tuvo gripe fuerte" },
  ],
};

export async function cargarEscenarios({ base = "/api", token, log = console.log } = {}) {
  const tok = token || (typeof localStorage !== "undefined" && localStorage.getItem("radicalgym_token"));
  if (!tok) throw new Error("Inicia sesión como administrador antes de cargar los escenarios.");
  const api = async (ruta, metodo = "GET", body) => {
    const r = await fetch(base + ruta, { method: metodo, headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`${metodo} ${ruta}: ${j.error || r.status}`);
    return j;
  };
  const reg = (modulo, id, datos) => api(`/registros/${modulo}/${encodeURIComponent(id)}`, "PUT", { datos: { ...datos, id } });
  const resumen = {};
  const sumar = (k, n = 1) => (resumen[k] = (resumen[k] || 0) + n);
  const hoy = hoyISO();

  const yo = await api("/auth/yo");
  if (yo.usuario?.role !== "admin") throw new Error("Los escenarios solo los puede cargar el administrador.");

  // Planes: el más parecido por duración, sin los de prueba
  const planes = (await api("/planes")).filter((p) => p.active !== false && !/prueba|promo|diario/i.test(p.name));
  const elegir = (dias, palabra, congelable = false) => {
    const l = planes.filter((p) => !congelable || Number(p.freezeDays || 0) > 0);
    return (
      l.find((p) => new RegExp(palabra, "i").test(p.name)) ||
      l.slice().sort((a, b) => Math.abs(a.durationDays - dias) - Math.abs(b.durationDays - dias))[0] ||
      planes[0]
    );
  };
  const PLAN = { mensual: elegir(30, "mensual"), trimestral: elegir(90, "trimestral"), semestral: elegir(180, "semestral", true), anual: elegir(360, "anual", true) };
  const dur = (p) => Number(p?.durationDays) || 30;
  log("Planes:", Object.fromEntries(Object.entries(PLAN).map(([k, p]) => [k, `${p?.name} (${dur(p)} días)`])));
  const entrenadores = await api("/entrenadores").catch(() => []);
  const existentes = await api("/alumnos");

  for (const [i, [nombre, sexo, nac, tipoPlan, esc, par, objetivo]] of ESCENARIOS.entries()) {
    sembrar(`escenario-${i}`);
    const dni = String(70900021 + i);
    const plan = PLAN[tipoPlan];
    const d = dur(plan);
    // Fecha de inicio según el escenario
    const inicio =
      esc === "vencido" ? sumarDias(hoy, -(d + par - 1)) :
      esc.startsWith("por_vencer") ? sumarDias(hoy, -(d - par - 1)) :
      esc === "renovo_antes" ? sumarDias(hoy, -par) :
      esc === "renovo_despues" ? sumarDias(hoy, -par) :
      esc === "ausente" ? sumarDias(hoy, -60) :
      esc === "nuevo" ? sumarDias(hoy, -par) :
      sumarDias(hoy, -entre(20, 40));
    const conDeuda = ["por_vencer_deuda", "pago_completo_partes", "pago_parcial_abono", "deuda_vence_pronto"].includes(esc);
    const pagoInicial = esc === "pago_parcial_abono" ? 0.5 : conDeuda ? 0.4 : 1;

    let a = existentes.find((m) => m.dni === dni);
    const nuevo = !a;
    if (!a) {
      a = await api("/alumnos", "POST", {
        dni, fullName: nombre, gender: sexo, birthDate: nac, phone: `+519${String(62000000 + i * 41113).slice(0, 8)}`, email: "",
        address: uno(["Av. Ejército 980, Cusco", "Urb. Santa Mónica C-4", "Jr. Ayacucho 215", "Calle Belén 101", "Av. Tullumayo 760"]),
        emergencyContact: { name: "Familiar de " + nombre.split(" ")[0], phone: "+51974000" + String(200 + i), relationship: uno(["Madre", "Padre", "Esposo(a)", "Hermano(a)"]) },
        objective: objetivo, planId: plan.id, planName: plan.name, membershipStartDate: inicio,
        assignedTrainerId: entrenadores.length ? entrenadores[i % entrenadores.length].id : undefined,
        amountPaid: pagoInicial < 1 ? Math.round(plan.price * pagoInicial) : undefined,
        debtDueDate: pagoInicial < 1 ? sumarDias(hoy, esc === "deuda_vence_pronto" ? par : esc === "por_vencer_deuda" ? par : 12) : undefined,
        paymentMethod: uno(["efectivo", "yape_plin", "tarjeta", "transferencia"]),
        notes: `Alumno de demostración · escenario: ${esc}`,
      });
      sumar("alumnos");
    }
    const id = a.id;

    // ---------- Acciones del escenario (solo la primera vez) ----------
    if (nuevo) {
      try {
        if (esc === "renovo_antes") {
          const sig = esc === "renovo_antes" && i % 2 ? PLAN.trimestral : PLAN.mensual;
          await api(`/alumnos/${id}/renovar`, "POST", { planId: sig.id, paymentMethod: "yape_plin" });
          sumar("renovaciones");
        }
        if (esc === "renovo_despues") {
          await api(`/alumnos/${id}/renovar`, "POST", { planId: PLAN.mensual.id, paymentMethod: "efectivo" });
          sumar("renovaciones");
        }
      } catch (e) {
        log(`Aviso (${nombre}):`, e.message);
      }
    }
    if (esc === "congelado_hoy" || esc === "congelado_programado") {
      try {
        const previos = await api(`/alumnos/${id}/congelamientos`).catch(() => []);
        const lista = previos.history || [];
        if (!lista.some((c) => !/anulad|voided/i.test(String(c.status || "")))) {
          const desde = esc === "congelado_hoy" ? hoy : sumarDias(hoy, 5);
          const dias = par;
          const motivo = esc === "congelado_programado" ? "Operación de menisco programada; reposo indicado por el médico" : uno(["Viaje de trabajo a Lima", "Viaje familiar por vacaciones"]);
          await api(`/alumnos/${id}/congelamientos`, "POST", { startDate: desde, days: dias, reason: motivo });
          sumar("congelamientos");
        }
      } catch (e) {
        log(`Aviso (${nombre}):`, e.message);
      }
    }
    if (nuevo) {
      try {
        if (esc === "pago_completo_partes") {
          // 40 % al matricularse, 30 % la semana siguiente y el resto hoy
          await api(`/alumnos/${id}/pagos`, "POST", { monto: Math.round(plan.price * 0.3), metodoPago: "yape_plin", notas: "Segundo abono", fechaLimite: sumarDias(hoy, 7) });
          const est = await api(`/alumnos/${id}/pagos`);
          const resto = Math.round((est.matriculas || []).reduce((t, m) => t + Number(m.balance || 0), 0) * 100) / 100;
          if (resto > 0) await api(`/alumnos/${id}/pagos`, "POST", { monto: resto, metodoPago: "efectivo", notas: "Canceló el saldo" });
          sumar("abonos", 2);
        }
        if (esc === "pago_parcial_abono") {
          await api(`/alumnos/${id}/pagos`, "POST", { monto: Math.round(plan.price * 0.25), metodoPago: "efectivo", notas: "Abono parcial", fechaLimite: sumarDias(hoy, 15) });
          sumar("abonos");
        }
      } catch (e) {
        log(`Aviso (${nombre}):`, e.message);
      }
    }

    // ---------- Asistencias según el escenario ----------
    const fin = sumarDias(inicio, d - 1);
    let hasta = esc === "vencido" ? fin : hoy;
    if (esc === "ausente") hasta = sumarDias(hoy, -par);
    const congDesde = esc === "congelado_hoy" ? hoy : null;
    const frecuencia = esc === "ausente" ? 0.6 : esc === "vencido" ? 0.45 : 0.55; // probabilidad de venir cada día hábil
    const horaBase = entre(6, 20);
    for (let f = inicio; f <= hasta && f <= hoy; f = sumarDias(f, 1)) {
      if (diaSemana(f) === 0) continue; // domingo
      if (congDesde && f >= congDesde) break;
      sembrar(`esc-asis-${i}-${f}`);
      if (azar() > frecuencia) continue;
      await reg("asistencias", `att-esc-${i + 1}-${f}`, {
        userId: id, userName: a.fullName, userRole: "student", userDni: dni, type: "in", status: "authorized", category: "student",
        checkInMethod: uno(["qr_app", "dni_manual", "quick_pass"]), membershipPlan: plan.name, notes: "Ingreso regular a sala de entrenamiento",
        date: f, time: hora12(Math.min(21, Math.max(6, horaBase + entre(-1, 1))), entre(0, 59)),
      });
      sumar("asistencias");
    }
    // Vencidos que intentaron entrar después de vencer (queda con aviso)
    if (esc === "vencido" && par >= 9) {
      const f = sumarDias(fin, Math.min(par - 1, 4));
      await reg("asistencias", `att-esc-${i + 1}-${f}-vencido`, {
        userId: id, userName: a.fullName, userRole: "student", userDni: dni, type: "in", status: "warning", category: "student",
        checkInMethod: "quick_pass", membershipPlan: plan.name, notes: "⛔ Membresía vencida: se le recordó renovar", date: f, time: hora12(horaBase, 15),
      });
      sumar("ingresos_con_aviso");
    }

    // ---------- Seguimiento de ausencias (por qué no viene) ----------
    const lista = NOTAS_AUSENCIA[esc];
    if (lista) {
      const previas = await api(`/alumnos/${id}/seguimiento-asistencia`).catch(() => []);
      if (!previas.length) {
        const n = lista[(esc === "vencido" ? [0, 1, 2, 3] : [0, 1, 2])[ESCENARIOS.filter((x) => x[4] === esc).findIndex((x) => x[0] === nombre)] || 0];
        await api(`/alumnos/${id}/seguimiento-asistencia`, "POST", { ...n, date: sumarDias(hoy, -entre(0, 3)) }).catch((e) => log("Nota omitida:", e.message));
        sumar("notas_seguimiento");
      }
    }
  }

  log("Escenarios cargados:", resumen);
  return resumen;
}
