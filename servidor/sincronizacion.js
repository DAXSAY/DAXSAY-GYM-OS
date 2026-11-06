// =====================================================================
// SINCRONIZACIÓN: registros del sistema  ->  tablas reales de MySQL
// ---------------------------------------------------------------------
// Las pantallas guardan cada registro completo en `registros_app` (JSON).
// Aquí se copia, en la MISMA transacción, a su tabla relacional:
//   citas -> citas
//   rutinas -> rutinas + rutina_dias + rutina_ejercicios
//   asignaciones_rutina -> alumnos.idrutina
//   planes_nutricion -> dietas + dieta_comidas + dieta_alimentos
//   evaluaciones_corporales -> medidas
//   fisioterapia -> sesiones_fisioterapia + sesion_zonas + sesion_tecnicas
//   asistencias -> asistencias_alumno / asistencias_empleado
//   productos, contratos (+ empleados), planilla, clases,
//   reglas_notificacion, notificaciones, plantillas_fisioterapia, ejercicios
// Cada fila guarda `idregistro_app` para saber de qué registro viene.
// =====================================================================
import { consultar, pool } from "./db.js";

// ---------- utilidades de conversión ----------
export class ErrorSincronizacion extends Error {}

const vacio = (v) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");
const txt = (v, max) => (vacio(v) ? null : String(v).trim().slice(0, max));
const num = (v) => (vacio(v) || Number.isNaN(Number(v)) ? null : Number(v));
/** número dentro de un rango (fuera de rango -> null para no romper la columna) */
const rango = (v, min, max, dec = 2) => {
  const n = num(v);
  if (n === null || n < min || n > max) return null;
  return Math.round(n * 10 ** dec) / 10 ** dec;
};
const entero = (v, min, max) => {
  const n = num(v);
  return n === null ? null : Math.min(max, Math.max(min, Math.round(n)));
};
const fecha = (v) => {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v || ""));
  return m ? m[1] : null;
};
const hoy = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });

// Platos de la dieta (los que asigne el nutricionista) -> tabla dieta_platos
const MODELOS_PLATO = ["equilibrado", "mediterraneo", "perdida_grasa", "masa_muscular", "deportivo", "cetogenico", "paleo", "personalizado"];
function platosDieta(d) {
  // Formato nuevo: d.plates = [...]; formato anterior: d.plate (un plato)
  const lista = Array.isArray(d.plates) ? d.plates : d.plate && typeof d.plate === "object" ? [{ name: "Plato principal", ...d.plate }] : [];
  if (lista.length > 12) throw new ErrorSincronizacion("Una dieta puede tener hasta 12 platos");
  const pct = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
  const mano = (v) => Math.max(0, Math.min(9.9, Math.round((Number(v) || 0) * 10) / 10));
  return lista.map((p, i) => {
    const partes = [pct(p.veg), pct(p.protein), pct(p.carbs), pct(p.fats)];
    const suma = partes.reduce((a, b) => a + b, 0);
    if (suma < 95 || suma > 105) throw new ErrorSincronizacion(`El plato ${i + 1} debe sumar 100% (suma ${suma}%)`);
    return [
      i + 1,
      txt(p.name, 60) || `Plato ${i + 1}`,
      hora(p.time),
      MODELOS_PLATO.includes(p.model) ? p.model : "personalizado",
      ...partes,
      mano(p.palms), mano(p.fists), mano(p.hands), mano(p.thumbs),
      mano(p.fruits), mano(p.dairy), mano(p.nuts), mano(p.oil),
      txt(p.notes, 200),
    ];
  });
}

/** "11:00 AM", "08:15 p. m.", "19:30", "7:05" -> "HH:MM:00" */
function hora(v) {
  const s = String(v || "").toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  const m = /(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm|a m|p m)?/.exec(s);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const sufijo = (m[3] || "").replace(" ", "");
  if (sufijo === "pm" && h < 12) h += 12;
  if (sufijo === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
}
/** "09:00 AM - 09:45 AM" -> ["09:00:00", "09:45:00"] */
function franja(v) {
  const partes = String(v || "").split(/\s*[-–]\s*/);
  const ini = hora(partes[0]);
  const fin = partes.length > 1 ? hora(partes.slice(1).join(" ")) : null;
  return [ini, fin];
}
const sumarMinutos = (h, min) => {
  if (!h || !min) return null;
  const [a, b] = h.split(":").map(Number);
  const t = a * 60 + b + Number(min);
  if (t >= 24 * 60) return "23:59:00";
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}:00`;
};
/** fecha y hora "2026-10-30 08:15" / ISO -> "YYYY-MM-DD HH:MM:SS" */
function fechaHora(v) {
  const f = fecha(v);
  if (!f) return null;
  return `${f} ${hora(String(v).slice(10)) || "00:00:00"}`;
}
const url = (v, max = 300) => {
  const s = txt(v, 2000);
  return s && !s.startsWith("data:") && s.length <= max ? s : null;
};
const json = (v) => (v === undefined || v === null ? null : JSON.stringify(v));

const OBJETIVOS = ["hipertrofia", "perdida_peso", "fuerza", "resistencia", "tonificacion", "rehabilitacion"];
const objetivo = (v) => {
  const o = String(v || "").replace("salud_rehabilitacion", "rehabilitacion");
  return OBJETIVOS.includes(o) ? o : "tonificacion";
};
const NIVELES = ["principiante", "intermedio", "avanzado"];
const nivel = (v) => (NIVELES.includes(v) ? v : "principiante");
const METODOS_PAGO = ["efectivo", "tarjeta", "transferencia", "yape_plin"];
const METODO_ASISTENCIA = { qr_app: "qr_app", dni_manual: "dni_manual", barcode: "codigo_barras", quick_pass: "pase_rapido" };
const CANAL = { push: "push", email: "correo", whatsapp: "whatsapp", sms: "sms" };
const CATEGORIA_AVISO = {
  renewal_reminder: "vencimiento",
  class_notice: "clase",
  special_promo: "promocion",
  general_alert: "aviso",
  birthday: "cumpleanos",
};

// ---------- búsqueda de personas ----------
async function idAlumno(cx, v) {
  if (vacio(v) || !/^\d+$/.test(String(v))) return null;
  const [[f]] = await cx.query("SELECT idalumno FROM alumnos WHERE idalumno = ?", [Number(v)]);
  return f ? f.idalumno : null;
}

/** Empleado por id numérico, por contrato del sistema o por nombre completo. */
async function idEmpleado(cx, id, nombre) {
  if (!vacio(id) && /^\d+$/.test(String(id))) {
    const [[f]] = await cx.query("SELECT idempleado FROM empleados WHERE idempleado = ?", [Number(id)]);
    if (f) return f.idempleado;
  }
  if (!vacio(id)) {
    const [[c]] = await cx.query("SELECT idempleado FROM contratos WHERE idregistro_app = ?", [String(id)]);
    if (c) return c.idempleado;
  }
  if (!vacio(nombre)) {
    const n = String(nombre).replace(/\s+/g, " ").trim();
    const [[f]] = await cx.query(
      `SELECT idempleado FROM empleados
        WHERE CONCAT_WS(' ', nombres, apellidos) = ? OR titulo_cargo = ? OR nombres = ?
        ORDER BY activo DESC, idempleado LIMIT 1`,
      [n, n, n],
    );
    if (f) return f.idempleado;
  }
  return null;
}

// ---------- guardado genérico por idregistro_app ----------
async function guardarFila(cx, tabla, pk, idregistro, campos) {
  const [[fila]] = await cx.query(`SELECT ${pk} AS id FROM ${tabla} WHERE idregistro_app = ? LIMIT 1`, [idregistro]);
  const cols = Object.keys(campos);
  const vals = cols.map((c) => campos[c]);
  if (fila) {
    await cx.query(`UPDATE ${tabla} SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE ${pk} = ?`, [...vals, fila.id]);
    return { id: fila.id, nuevo: false };
  }
  const [r] = await cx.query(
    `INSERT INTO ${tabla} (${cols.join(", ")}, idregistro_app) VALUES (${cols.map(() => "?").join(", ")}, ?)`,
    [...vals, idregistro],
  );
  return { id: r.insertId, nuevo: true };
}

// =====================================================================
// Mapeo de cada módulo
// =====================================================================
const ESTADO_CITA = {
  por_atender: "programada", scheduled: "programada", confirmed: "confirmada",
  atendiendo: "atendiendo", atendido: "atendida", completed: "atendida",
  pospuesto: "pospuesta", falta: "falta", cancelled: "cancelada", cancelada: "cancelada",
};

const MAPAS = {
  async citas(cx, id, d) {
    let [ini, fin] = franja(d.timeSlot || d.time);
    if (!fin) fin = sumarMinutos(ini, d.durationMinutes || 45);
    if (!fecha(d.date) || !ini || !fin) throw new ErrorSincronizacion("La cita no tiene fecha u horario válido");
    await guardarFila(cx, "citas", "idcita", id, {
      servicio: d.serviceType === "physiotherapy" ? "fisioterapia" : d.serviceType === "nutrition" ? "nutricion" : "entrenamiento",
      idalumno: await idAlumno(cx, d.memberId),
      idempleado: await idEmpleado(cx, d.staffId, d.staffName),
      fecha: fecha(d.date),
      hora_inicio: ini,
      hora_fin: fin,
      motivo: txt(d.reason, 200),
      consultorio: txt(d.roomOrDesk, 60),
      notas: txt(d.notes, 255),
      recordatorio_enviado: d.reminderSent ? 1 : 0,
      estado: ESTADO_CITA[d.status] || "programada",
    });
  },

  async ejercicios(cx, id, d) {
    if (vacio(d.name)) throw new ErrorSincronizacion("El ejercicio no tiene nombre");
    await guardarFila(cx, "ejercicios", "idejercicio", id, {
      nombre: txt(d.name, 120),
      grupo_muscular: txt(d.muscleGroup, 40) || "otro",
      musculos_secundarios: txt((d.secondaryMuscles || []).join("|"), 200),
      equipo: txt(d.equipment, 40) || "otro",
      dificultad: nivel(d.difficulty),
      instrucciones: txt(Array.isArray(d.steps) && d.steps.length ? d.steps.join(" ") : d.instructions, 1000),
      consejos: txt(d.tips, 500),
      series_repeticiones: txt(d.targetSetsRepsDefault, 40),
      video_url: url(d.gifUrl || d.videoUrl),
      miniatura_url: url(d.thumbnailUrl),
      activo: 1,
    });
  },

  async rutinas(cx, id, d) {
    if (vacio(d.title)) throw new ErrorSincronizacion("La rutina no tiene nombre");
    const dias = Array.isArray(d.days) ? d.days : [];
    const { id: idrutina } = await guardarFila(cx, "rutinas", "idrutina", id, {
      titulo: txt(d.title, 150),
      descripcion: txt(d.description, 500),
      nivel: nivel(d.level),
      objetivo: objetivo(d.objective),
      dias_por_semana: entero(dias.length, 0, 7),
      identrenador: await idEmpleado(cx, d.trainerId, d.trainerName),
      idalumno: await idAlumno(cx, d.targetStudentId),
      fecha: fecha(d.createdDate) || hoy(),
      activo: 1,
    });
    await cx.query("DELETE FROM rutina_dias WHERE idrutina = ?", [idrutina]);
    for (const [i, dia] of dias.entries()) {
      const [r] = await cx.query(
        "INSERT INTO rutina_dias (idrutina, orden, nombre, enfoque, notas) VALUES (?,?,?,?,?)",
        [idrutina, Math.min(i + 1, 127), txt(dia.dayName, 120) || `Día ${i + 1}`, txt(dia.focus, 120), txt(dia.notes, 300)],
      );
      for (const [j, e] of (dia.exercises || []).entries()) {
        const [[propio]] = await cx.query("SELECT idejercicio FROM ejercicios WHERE idregistro_app = ?", [String(e.exerciseId || "")]);
        await cx.query(
          `INSERT INTO rutina_ejercicios (idrutina_dia, idejercicio, codigo_ejercicio, nombre_ejercicio, grupo_muscular,
                                          gif_url, orden, series, repeticiones, rir, descanso_seg, notas)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            r.insertId,
            propio?.idejercicio || null,
            txt(e.exerciseId, 64),
            txt(e.exerciseName, 150),
            txt(e.muscleGroup, 40),
            url(e.gifUrl || e.videoUrl),
            Math.min(j + 1, 127),
            entero(e.sets, 1, 99) || 1,
            txt(e.reps, 20) || "-",
            txt(e.rir, 10),
            entero(e.restSeconds, 0, 3600) ?? 60,
            txt(e.notes, 200),
          ],
        );
      }
    }
  },

  async asignaciones_rutina(cx, id, d) {
    const idalumno = await idAlumno(cx, d.memberId || id);
    if (!idalumno) throw new ErrorSincronizacion("El alumno de la asignación no existe");
    const [[r]] = await cx.query("SELECT idrutina FROM rutinas WHERE idregistro_app = ?", [String(d.routineId || "")]);
    await cx.query("UPDATE alumnos SET idrutina = ? WHERE idalumno = ?", [r?.idrutina || null, idalumno]);
    if (d.routineId && !r) throw new ErrorSincronizacion("La rutina asignada aún no está en la tabla rutinas");
  },

  async planes_nutricion(cx, id, d) {
    if (vacio(d.title)) throw new ErrorSincronizacion("La dieta no tiene nombre");
    const comidas = Array.isArray(d.meals) ? d.meals : [];
    const { id: iddieta } = await guardarFila(cx, "dietas", "iddieta", id, {
      idalumno: await idAlumno(cx, d.targetStudentId),
      idnutricionista: await idEmpleado(cx, d.nutritionistId, d.trainerName || d.nutritionistName),
      titulo: txt(d.title, 120),
      objetivo: objetivo(d.objective),
      calorias_meta: entero(d.dailyCaloriesTarget, 0, 20000) || 0,
      proteinas_g: entero(d.proteinsTargetGrams, 0, 2000) || 0,
      carbohidratos_g: entero(d.carbsTargetGrams, 0, 3000) || 0,
      grasas_g: entero(d.fatsTargetGrams, 0, 1000) || 0,
      agua_litros: rango(d.waterLitersTarget, 0, 99.9, 1) ?? 2,
      comidas_por_dia: Math.min(8, Math.max(1, comidas.length || 1)),
      recomendaciones: txt(d.recommendations, 500),
      suplementos: txt((d.supplements || []).join("|"), 300),
      pautas_hidratacion: txt(d.hydrationGuidelines, 300),
      fecha: fecha(d.createdDate) || hoy(),
      activa: d.active === false ? 0 : 1,
    });
    await cx.query("DELETE FROM dieta_platos WHERE iddieta = ?", [iddieta]);
    for (const fila of platosDieta(d)) {
      try {
        await cx.query(
          `INSERT INTO dieta_platos (iddieta, orden, nombre, hora, modelo, verduras_pct, proteina_pct, carbohidratos_pct, grasas_pct,
                                     palmas_proteina, punos_verduras, manos_carbohidratos, pulgares_grasa,
                                     punos_fruta, dedos_lacteo, punados_frutos_secos, puntas_aceite, indicaciones)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [iddieta, ...fila],
        );
      } catch (e) {
        if (e.code !== "ER_BAD_FIELD_ERROR") throw e;
        // Base sin la actualización 19: se guardan las 4 porciones principales
        const sinExtras = [...fila.slice(0, 12), fila[16]];
        await cx.query(
          `INSERT INTO dieta_platos (iddieta, orden, nombre, hora, modelo, verduras_pct, proteina_pct, carbohidratos_pct, grasas_pct,
                                     palmas_proteina, punos_verduras, manos_carbohidratos, pulgares_grasa, indicaciones)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [iddieta, ...sinExtras],
        );
      }
    }
    await cx.query("DELETE FROM dieta_comidas WHERE iddieta = ?", [iddieta]);
    for (const [i, c] of comidas.entries()) {
      const [r] = await cx.query("INSERT INTO dieta_comidas (iddieta, orden, nombre, hora) VALUES (?,?,?,?)", [
        iddieta,
        Math.min(i + 1, 127),
        txt(c.name, 60) || `Comida ${i + 1}`,
        hora(c.time),
      ]);
      for (const a of c.items || []) {
        // gramos: el dato del sistema o lo que diga la porción ("80 g", "250 ml")
        const deTexto = /(\d+(?:[.,]\d+)?)\s*(g|gr|ml)\b/i.exec(String(a.portion || ""));
        const gramos = rango(a.weightGrams, 0.1, 99999, 1) ?? rango(deTexto?.[1]?.replace(",", "."), 0.1, 99999, 1);
        await cx.query(
          `INSERT INTO dieta_alimentos (iddieta_comida, idalimento, alimento, porcion, gramos, kilocalorias, proteinas_g,
                                        carbohidratos_g, grasas_g, notas)
           VALUES (?, (SELECT idalimento FROM alimentos WHERE idalimento = ? OR nombre = ? ORDER BY idalimento = ? DESC LIMIT 1),?,?,?,?,?,?,?,?)`,
          [
            r.insertId,
            entero(a.foodId, 1, 2147483647) || 0, txt(a.name, 80) || "", entero(a.foodId, 1, 2147483647) || 0,
            txt(a.name, 80) || "Alimento",
            txt(a.portion, 40),
            gramos || 1,
            rango(a.calories, 0, 99999, 1) ?? 0,
            rango(a.proteins, 0, 99999, 1) ?? 0,
            rango(a.carbs, 0, 99999, 1) ?? 0,
            rango(a.fats, 0, 99999, 1) ?? 0,
            txt(a.notes, 150),
          ],
        );
      }
    }
  },

  async evaluaciones_corporales(cx, id, d) {
    const idalumno = await idAlumno(cx, d.memberId);
    if (!idalumno) throw new ErrorSincronizacion("El alumno de la evaluación no existe");
    const p = d.perimeters || {};
    const m = d.measurements || {};
    const s = d.skinfolds || {};
    const b = d.bioimpedance || {};
    const c1 = (v) => rango(v, 0, 9999.9, 1); // DECIMAL(5,1)
    const c4 = (v) => rango(v, 0, 999.9, 1); //  DECIMAL(4,1)
    await guardarFila(cx, "medidas", "idmedida", id, {
      idalumno,
      idevaluador: await idEmpleado(cx, d.evaluatorId, d.evaluatorTrainerName || d.evaluatorName),
      fecha: fecha(d.date) || hoy(),
      hora: hora(d.time),
      peso_kg: rango(d.weightKg, 1, 999.99),
      talla_cm: c1(d.heightCm),
      cuello: c1(p.neck),
      hombros: c1(p.shoulders),
      pecho: c1(p.chest ?? m.chestCm),
      cintura: c1(p.waist ?? m.waistCm),
      abdomen: c1(p.abdomen),
      cadera: c1(p.hip ?? m.hipsCm),
      biceps_relajado_der: c1(p.bicepsRelaxedRight),
      biceps_relajado_izq: c1(p.bicepsRelaxedLeft),
      biceps_contraido_der: c1(p.bicepsFlexedRight ?? m.armsCm),
      biceps_contraido_izq: c1(p.bicepsFlexedLeft),
      antebrazo: c1(p.forearm),
      muslo_superior: c1(p.thighSuperior),
      muslo_medio: c1(p.thighMid ?? m.thighsCm),
      pantorrilla: c1(p.calf),
      pliegue_triceps: c4(s.triceps),
      pliegue_subescapular: c4(s.subscapular),
      pliegue_suprailiaco: c4(s.suprailiac),
      pliegue_abdominal: c4(s.abdominal),
      pliegue_muslo: c4(s.thigh),
      pliegue_pantorrilla: c4(s.calf),
      grasa_porcentaje: c4(b.bodyFatPercentage ?? d.bodyFatPercentage),
      grasa_kg: rango(b.bodyFatKg, 0, 999.99),
      masa_muscular_porcentaje: c4(b.muscleMassPercentage),
      masa_muscular_kg: rango(b.muscleMassKg ?? d.muscleMassKg, 0, 999.99),
      masa_magra_kg: rango(b.leanMassKg, 0, 999.99),
      grasa_visceral: entero(b.visceralFatLevel, 0, 127),
      agua_porcentaje: c4(b.totalBodyWaterPercentage),
      agua_litros: c4(b.totalBodyWaterLiters),
      masa_osea_kg: rango(b.boneMassKg, 0, 99.99),
      metabolismo_basal: entero(b.basalMetabolicRateKcal, 0, 99999),
      edad_metabolica: entero(b.metabolicAge, 0, 127),
      puntuacion_fisica: entero(b.physicalRatingScore, 0, 127),
      observaciones: txt(d.notes, 300),
      notas_objetivo: txt(d.targetGoalNotes, 300),
    });
  },

  async fisioterapia(cx, id, d) {
    const idalumno = await idAlumno(cx, d.memberId);
    if (!idalumno) throw new ErrorSincronizacion("El paciente de la sesión no existe");
    const { id: idsesion } = await guardarFila(cx, "sesiones_fisioterapia", "idsesion_fisioterapia", id, {
      idalumno,
      idfisioterapeuta: await idEmpleado(cx, d.physiotherapistId, d.physiotherapistName),
      fecha: fecha(d.date) || hoy(),
      hora: hora(d.time),
      motivo_consulta: txt(d.consultationReason, 255) || "Sin motivo registrado",
      restricciones_iniciales: txt(d.initialMedicalRestrictions, 300),
      evaluacion_postural: txt(d.posturalEvaluation, 500),
      rango_movimiento: txt(d.rangeOfMotion, 300),
      pruebas_funcionales: txt(d.functionalTests, 300),
      evaluacion_fisica: json(d.physicalEvaluation),
      evaluacion_funcional: json(d.functionalEvaluation),
      dosificacion_ejercicios: json(d.exerciseDosage),
      restricciones_gym: txt(d.gymWorkoutRestrictions, 300),
      indicaciones_casa: txt(d.homeIndications, 300),
      evolucion: txt(d.evolutionNotes, 300),
      proxima_cita: fecha(d.nextAppointmentDate),
      reporte_enviado_en: fechaHora(d.studentReportSentAt),
      reporte_medio:
        { whatsapp: "whatsapp", email: "correo", printed: "impreso" }[d.studentReportDeliveryMethod] || null,
    });
    // Zonas con su dolor (EVA 0-10)
    await cx.query("DELETE FROM sesion_zonas WHERE idsesion_fisioterapia = ?", [idsesion]);
    const zonas = [...new Set([...(d.affectedZones || []), d.affectedZone].filter(Boolean).map((z) => String(z).slice(0, 40)))];
    for (const z of zonas) {
      await cx.query("INSERT INTO sesion_zonas (idsesion_fisioterapia, zona, nivel_dolor) VALUES (?,?,?)", [
        idsesion,
        z,
        entero(d.painLevelEVA, 0, 10) ?? 0,
      ]);
    }
    // Técnicas aplicadas (catálogo tecnicas_fisioterapia)
    await cx.query("DELETE FROM sesion_tecnicas WHERE idsesion_fisioterapia = ?", [idsesion]);
    const tecnicas = [
      ...(d.treatmentsApplied || []),
      ...(d.editableTreatments || []).map((t) => t?.name || t?.title),
    ];
    for (const t of [...new Set(tecnicas.filter((x) => !vacio(x)).map((x) => String(x).trim().slice(0, 100)))]) {
      await cx.query("INSERT IGNORE INTO tecnicas_fisioterapia (nombre) VALUES (?)", [t]);
      await cx.query(
        `INSERT IGNORE INTO sesion_tecnicas (idsesion_fisioterapia, idtecnica)
         SELECT ?, idtecnica FROM tecnicas_fisioterapia WHERE nombre = ?`,
        [idsesion, t],
      );
    }
  },

  async asistencias(cx, id, d) {
    const fechaAsis = fecha(d.date) || hoy();
    const horaAsis = hora(d.time);
    const metodo = METODO_ASISTENCIA[d.checkInMethod] || "dni_manual";
    if (d.category === "staff") {
      const idemp = await idEmpleado(cx, d.contractId || d.userId, d.userName);
      if (!idemp) throw new ErrorSincronizacion("El trabajador no está registrado en empleados");
      const estado = { puntual: "puntual", on_time: "puntual", tarde: "tarde", late: "tarde", falta: "falta", permiso: "permiso" }[d.status] || "puntual";
      const salida = d.type === "out";
      const [[fila]] = await cx.query(
        "SELECT idasistencia_empleado AS id FROM asistencias_empleado WHERE idempleado = ? AND fecha = ?",
        [idemp, fechaAsis],
      );
      let idfila = fila?.id;
      if (!idfila) {
        const [r] = await cx.query(
          `INSERT INTO asistencias_empleado (idempleado, fecha, hora_entrada, hora_salida, estado, observacion, metodo, idregistro_app)
           VALUES (?,?,?,?,?,?,?,?)`,
          [idemp, fechaAsis, salida ? null : horaAsis, salida ? horaAsis : null, estado, txt(d.reason || d.notes, 200), metodo, id],
        );
        idfila = r.insertId;
      } else if (horaAsis) {
        await cx.query(`UPDATE asistencias_empleado SET ${salida ? "hora_salida" : "hora_entrada"} = ? WHERE idasistencia_empleado = ?`, [
          horaAsis,
          idfila,
        ]);
      }
      // El estado y las horas los decide el sistema (no hay horarios cargados en la base)
      await cx.query(
        `UPDATE asistencias_empleado SET estado = ?, observacion = COALESCE(?, observacion), idregistro_app = ?,
                horas_trabajadas = IF(hora_entrada IS NOT NULL AND hora_salida IS NOT NULL, horas_trabajadas, COALESCE(?, horas_trabajadas))
          WHERE idasistencia_empleado = ?`,
        [estado, txt(d.reason || d.notes, 200), id, rango(d.hoursWorked, 0, 9999.99), idfila],
      );
      return;
    }
    const idalumno = await idAlumno(cx, d.memberId || d.userId);
    if (!idalumno) throw new ErrorSincronizacion("El alumno de la asistencia no existe");
    await guardarFila(cx, "asistencias_alumno", "idasistencia_alumno", id, {
      idalumno,
      fecha: fechaAsis,
      hora: horaAsis || "00:00:00",
      tipo: d.type === "out" ? "salida" : "entrada",
      metodo,
      resultado: { warning: "advertencia", denied: "denegado", denegado: "denegado" }[d.status] || "autorizado",
      notas: txt(d.notes || d.reason, 200),
    });
  },

  async productos(cx, id, d) {
    if (vacio(d.name)) throw new ErrorSincronizacion("El producto no tiene nombre");
    await guardarFila(cx, "productos", "idproducto", id, {
      nombre: txt(d.name, 100),
      categoria: ["bebidas", "suplementos", "snacks", "accesorios", "ropa"].includes(d.category) ? d.category : "accesorios",
      precio_compra: rango(d.purchaseCost, 0, 99999999.99) ?? 0,
      precio_venta: rango(d.salePrice, 0, 99999999.99) ?? 0,
      stock: entero(d.stock, 0, 2147483647) ?? 0,
      stock_minimo: entero(d.minStockAlert, 0, 2147483647) ?? 5,
      marca: txt(d.brand, 60),
      codigo_barras: txt(d.barcode, 40),
      descripcion: txt(d.description, 300),
      imagen: url(d.image),
      activo: 1,
    });
  },

  async contratos(cx, id, d) {
    // El trabajador: se busca y, si no existe, se registra en empleados
    let idemp = await idEmpleado(cx, d.staffId, null);
    const dni = /^\d{8}$/.test(String(d.dni || "")) ? String(d.dni) : null;
    if (!idemp && dni) {
      const [[f]] = await cx.query("SELECT idempleado FROM empleados WHERE dni = ?", [dni]);
      idemp = f?.idempleado || null;
    }
    if (!idemp) idemp = await idEmpleado(cx, null, d.fullName);
    if (!idemp) {
      if (vacio(d.fullName)) throw new ErrorSincronizacion("El contrato no tiene el nombre del trabajador");
      const partes = String(d.fullName).trim().split(/\s+/);
      const corte = partes.length >= 4 ? 2 : 1;
      const cargo = {
        trainer: "entrenador", physiotherapist: "fisioterapeuta", nutritionist: "nutricionista",
        receptionist: "recepcion", maintenance: "mantenimiento", manager: "administrador",
      }[d.role] || "recepcion";
      let correo = txt(d.email, 120);
      if (correo) {
        const [[usado]] = await cx.query("SELECT 1 AS x FROM empleados WHERE correo = ?", [correo]);
        if (usado) correo = null;
      }
      const [r] = await cx.query(
        `INSERT INTO empleados (dni, nombres, apellidos, cargo, titulo_cargo, telefono, correo, cuenta_bancaria, fecha_ingreso)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          dni,
          partes.slice(0, corte).join(" ").slice(0, 80),
          (partes.slice(corte).join(" ") || "-").slice(0, 80),
          cargo,
          txt(d.roleTitle, 120),
          txt(d.phone, 20),
          correo,
          txt(d.bankAccount, 40),
          fecha(d.startDate) || hoy(),
        ],
      );
      idemp = r.insertId;
    }
    await guardarFila(cx, "contratos", "idcontrato", id, {
      idempleado: idemp,
      tipo: { "3_months": "3_meses", "6_months": "6_meses", "1_year": "1_anio", indefinite: "indefinido" }[d.contractType] || "indefinido",
      modalidad: { full_time: "tiempo_completo", part_time: "medio_tiempo", hourly: "por_horas" }[d.workModality] || "tiempo_completo",
      fecha_inicio: fecha(d.startDate) || hoy(),
      fecha_fin: fecha(d.endDate),
      sueldo_mensual: rango(d.monthlySalary, 0, 99999999.99) ?? 0,
      tarifa_hora: rango(d.hourlyRate, 0, 99999999.99) ?? 0,
      horas_semanales: entero(d.assignedWeeklyHours, 0, 127) ?? 0,
      documento: url(d.signedDocumentUrl, 200),
      notas: txt(d.notes, 300),
      estado: { active: "vigente", expiring_soon: "por_vencer", expired: "vencido", renewed: "renovado" }[d.status] || "vigente",
    });
  },

  async planilla(cx, id, d) {
    const [[c]] = await cx.query("SELECT idcontrato FROM contratos WHERE idregistro_app = ?", [String(d.contractId || "")]);
    if (!c) throw new ErrorSincronizacion("El contrato de esta planilla aún no está en la tabla contratos");
    const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const m = /([a-záéíóú]+)\s+(\d{4})/i.exec(String(d.month || ""));
    const mes = m ? MESES.indexOf(m[1].toLowerCase().replace("setiembre", "septiembre")) : -1;
    const periodo = mes >= 0 ? `${m[2]}-${String(mes + 1).padStart(2, "0")}` : (fecha(d.paymentDate) || hoy()).slice(0, 7);
    // Se reemplaza la fila (INSERT): así no se dispara el egreso automático
    // de caja del trigger de planilla; el sistema ya registra ese pago.
    await cx.query("DELETE FROM planilla WHERE idregistro_app = ? OR (idcontrato = ? AND periodo = ?)", [id, c.idcontrato, periodo]);
    await cx.query(
      `INSERT INTO planilla (idcontrato, periodo, sueldo_base, horas_trabajadas, tarifa_hora, bonificacion, descuentos,
                             estado, fecha_pago, metodo_pago, comprobante, idregistro_app)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        c.idcontrato,
        periodo,
        rango(d.baseSalary, 0, 99999999.99) ?? 0,
        rango(d.workedHours, 0, 9999.99) ?? 0,
        rango(d.hourlyRate, 0, 99999999.99) ?? 0,
        rango(d.bonusAmount, 0, 99999999.99) ?? 0,
        rango(d.deductions, 0, 99999999.99) ?? 0,
        d.status === "paid" ? "pagado" : "pendiente",
        fecha(d.paymentDate),
        METODOS_PAGO.includes(d.paymentMethod) ? d.paymentMethod : null,
        txt(d.receiptNumber, 30),
        id,
      ],
    );
  },

  async clases(cx, id, d) {
    if (vacio(d.name)) throw new ErrorSincronizacion("La clase no tiene nombre");
    const [ini, fin] = franja(String(d.schedule || "").replace(/^[^\d]*/, ""));
    const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
    const textoDia = String(d.schedule || "").toLowerCase().replace("miercoles", "miércoles").replace("sabado", "sábado");
    const dia = DIAS.findIndex((x) => textoDia.includes(x));
    const f = fecha(d.date);
    if (!f && dia < 0) throw new ErrorSincronizacion("La clase no tiene fecha ni día de la semana");
    await guardarFila(cx, "clases", "idclase", id, {
      nombre: txt(d.name, 120),
      idinstructor: await idEmpleado(cx, d.instructorId, d.instructorName),
      dia_semana: f ? null : dia + 1,
      fecha: f,
      hora_inicio: ini,
      hora_fin: fin && ini && fin > ini ? fin : null,
      sala: txt(d.room, 60),
      capacidad: entero(d.capacity, 1, 32767) ?? 20,
      activa: 1,
    });
  },

  async reglas_notificacion(cx, id, d) {
    await guardarFila(cx, "reglas_notificacion", "idregla", id, {
      nombre: txt(d.name, 120) || "Regla",
      categoria: CATEGORIA_AVISO[d.category] || "aviso",
      activa: d.enabled === false ? 0 : 1,
      canales: txt((d.channels || []).map((c) => CANAL[c] || c).join("|"), 60) || "push",
      momento: txt(d.triggerTiming, 80) || "-",
      dias: entero(d.timingValueDays, -32768, 32767) ?? 0,
      titulo_plantilla: txt(d.templateTitle, 150) || "-",
      cuerpo_plantilla: txt(d.templateBody, 600) || "-",
    });
  },

  async notificaciones(cx, id, d) {
    const idalumno = await idAlumno(cx, d.recipientId);
    const publico = String(d.targetAudience || "").toLowerCase();
    await guardarFila(cx, "notificaciones", "idnotificacion", id, {
      titulo: txt(d.title, 120) || "Aviso",
      mensaje: txt(d.message, 500) || "-",
      destino: idalumno ? "alumno" : publico.includes("alumno") ? "alumnos" : publico.includes("personal") ? "personal" : "todos",
      idalumno,
      tipo: { renewal_reminder: "vencimiento", class_notice: "clase", special_promo: "promocion", birthday: "cumpleanos" }[d.category] || "aviso",
      canal: CANAL[d.channel] || "sistema",
      estado_envio: { sent: "enviado", delivered: "entregado", read: "leido", scheduled: "programado", failed: "fallido" }[d.status] || "entregado",
      fecha: fechaHora(d.timestamp) || `${hoy()} 00:00:00`,
      leida: d.status === "read" ? 1 : 0,
    });
  },

  async plantillas_fisioterapia(cx, id, d) {
    if (vacio(d.name)) throw new ErrorSincronizacion("La plantilla no tiene nombre");
    await guardarFila(cx, "plantillas_fisioterapia", "idplantilla", id, {
      nombre: txt(d.name, 120),
      zona: txt((d.affectedZones || [])[0], 40),
      contenido: JSON.stringify(d),
      activo: 1,
    });
  },
};

// Tabla principal de cada módulo (para eliminar)
const TABLA = {
  citas: ["citas", "idcita"],
  ejercicios: ["ejercicios", "idejercicio"],
  rutinas: ["rutinas", "idrutina"],
  planes_nutricion: ["dietas", "iddieta"],
  evaluaciones_corporales: ["medidas", "idmedida"],
  fisioterapia: ["sesiones_fisioterapia", "idsesion_fisioterapia"],
  productos: ["productos", "idproducto"],
  contratos: ["contratos", "idcontrato"],
  planilla: ["planilla", "idplanilla"],
  clases: ["clases", "idclase"],
  reglas_notificacion: ["reglas_notificacion", "idregla"],
  notificaciones: ["notificaciones", "idnotificacion"],
  plantillas_fisioterapia: ["plantillas_fisioterapia", "idplantilla"],
};

// Orden para copiar lo que ya existe (primero lo que otros necesitan)
export const ORDEN_MODULOS = [
  "ejercicios", "contratos", "planilla", "productos", "rutinas", "asignaciones_rutina",
  "planes_nutricion", "evaluaciones_corporales", "citas", "fisioterapia", "asistencias",
  "clases", "reglas_notificacion", "notificaciones", "plantillas_fisioterapia",
];

// =====================================================================
// API del módulo
// =====================================================================
let activa = false;
export const sincronizacionActiva = () => activa;

/** Comprueba que la base tenga la actualización 07. */
export async function verificarSincronizacion() {
  const [f] = await consultar(
    `SELECT COUNT(*) AS n FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'registros_app' AND column_name = 'sync_estado'`,
  );
  activa = Number(f.n) > 0;
  return activa;
}

/** Copia un registro a su tabla (usa la conexión de la transacción). */
export async function sincronizar(cx, modulo, idregistro, datos) {
  const mapa = MAPAS[modulo];
  if (mapa) await mapa(cx, String(idregistro), datos || {});
}

/** Quita de su tabla un registro eliminado en el sistema. */
export async function eliminarSincronizado(cx, modulo, idregistro) {
  const id = String(idregistro);
  if (modulo === "asignaciones_rutina") {
    if (/^\d+$/.test(id)) await cx.query("UPDATE alumnos SET idrutina = NULL WHERE idalumno = ?", [Number(id)]);
    return;
  }
  if (modulo === "asistencias") {
    await cx.query("DELETE FROM asistencias_alumno WHERE idregistro_app = ?", [id]);
    await cx.query("DELETE FROM asistencias_empleado WHERE idregistro_app = ?", [id]);
    return;
  }
  if (modulo === "ejercicios") {
    // Las rutinas que lo usan conservan el nombre del ejercicio
    await cx.query(
      `UPDATE rutina_ejercicios re JOIN ejercicios e ON e.idejercicio = re.idejercicio
          SET re.idejercicio = NULL WHERE e.idregistro_app = ?`,
      [id],
    );
  }
  const t = TABLA[modulo];
  if (t) await cx.query(`DELETE FROM ${t[0]} WHERE idregistro_app = ?`, [id]);
}

/** Mensaje corto del error para guardarlo en registros_app.sync_detalle */
export const detalleError = (e) => String(e?.sqlMessage || e?.message || e).slice(0, 300);

/**
 * Copia a sus tablas los registros pendientes (o con error si incluirErrores).
 * Cada registro va en su propia transacción: si uno falla, los demás siguen.
 */
export async function sincronizarPendientes({ incluirErrores = false } = {}) {
  if (!activa) return { ok: 0, error: 0 };
  const estados = incluirErrores ? ["pendiente", "error"] : ["pendiente"];
  const resumen = { ok: 0, error: 0 };
  for (const modulo of ORDEN_MODULOS) {
    const filas = await consultar(
      `SELECT idregistro, datos FROM registros_app
        WHERE modulo = ? AND sync_estado IN (${estados.map(() => "?").join(",")})
        ORDER BY fecha_creacion`,
      [modulo, ...estados],
    );
    for (const f of filas) {
      const datos = typeof f.datos === "string" ? JSON.parse(f.datos) : f.datos;
      const cx = await pool.getConnection();
      try {
        await cx.beginTransaction();
        await sincronizar(cx, modulo, f.idregistro, datos);
        await cx.query(
          "UPDATE registros_app SET sync_estado = 'ok', sync_detalle = NULL, sync_fecha = NOW() WHERE modulo = ? AND idregistro = ?",
          [modulo, f.idregistro],
        );
        await cx.commit();
        resumen.ok++;
      } catch (e) {
        await cx.rollback().catch(() => {});
        await consultar(
          "UPDATE registros_app SET sync_estado = 'error', sync_detalle = ?, sync_fecha = NOW() WHERE modulo = ? AND idregistro = ?",
          [detalleError(e), modulo, f.idregistro],
        );
        resumen.error++;
      } finally {
        cx.release();
      }
    }
  }
  return resumen;
}
