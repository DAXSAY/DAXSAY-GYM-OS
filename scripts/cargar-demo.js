// =====================================================================
// DATOS DE DEMOSTRACIÓN DE RADICAL
// Carga, usando la misma API que la app (todo queda en MySQL y en regla):
//   20 alumnos con matrícula, 20 rutinas, 20 dietas, 6 evaluaciones de
//   fisioterapia (lesiones / contracturas), asistencias de 15 a 30 días,
//   4 contratos de personal con sus asistencias (puntual / tarde) y pagos,
//   alquiler de 3 meses, servicios y gastos, renovaciones de meses
//   anteriores, 12 productos con 30 ventas, metas y 6 prospectos del CRM.
//
// Uso (con la sesión de ADMINISTRADOR abierta en el navegador, en la consola):
//   const m = await import("/scripts/cargar-demo.js"); await m.cargarDemo();
// O desde Node:  cargarDemo({ base: "http://127.0.0.1:4000/api", token })
// Se puede ejecutar varias veces: lo que ya existe no se duplica.
// =====================================================================

const TZ = "America/Lima";
const hoyISO = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });
const sumarDias = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const nombreMes = (iso) => `${MESES[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const hora12 = (h, m) => `${String(((h + 11) % 12) + 1).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;

// Azar "fijo": cada dato usa su propia semilla (nombre + fecha), así al
// volver a ejecutar sale exactamente igual y nada se duplica.
let semilla = 1;
const sembrar = (clave) => {
  semilla = 2166136261;
  for (const ch of String(clave)) semilla = Math.imul(semilla ^ ch.charCodeAt(0), 16777619) >>> 0;
  semilla = (semilla % 2147483646) + 1;
};
const azar = () => ((semilla = (semilla * 48271) % 2147483647) / 2147483647);
const entre = (a, b) => a + Math.floor(azar() * (b - a + 1));
const uno = (l) => l[Math.floor(azar() * l.length)];

const ALUMNOS = [
  // nombre, sexo, nacimiento, plan, días desde que empezó, días que vino, objetivo, restricción, entrenador?, pagó parcial
  ["Carlos Mendoza Quispe", "M", "1994-03-12", "trimestral", 70, 30, "hipertrofia", "", true, false],
  ["María Fernanda López Huamán", "F", "1998-07-25", "mensual", 25, 20, "perdida_peso", "", true, false],
  ["Jorge Luis Ramírez Torres", "M", "1989-11-02", "anual", 120, 30, "hipertrofia", "Hernia discal L4-L5 controlada", true, false],
  ["Ana Lucía Vargas Paredes", "F", "2000-01-18", "trimestral", 50, 25, "tonificacion", "", true, false],
  ["Diego Alonso Castillo Rojas", "M", "1996-05-30", "mensual", 28, 15, "hipertrofia", "", false, true],
  ["Valeria Sofía Gutiérrez Salas", "F", "1997-09-14", "semestral", 90, 28, "tonificacion", "Asma leve (trae inhalador)", true, false],
  ["Luis Miguel Chávez Flores", "M", "1985-12-08", "trimestral", 60, 18, "perdida_peso", "Hipertensión controlada", true, false],
  ["Camila Andrea Torres Medina", "F", "2002-04-03", "mensual", 20, 15, "tonificacion", "", false, false],
  ["Renato Sebastián Díaz Campos", "M", "1999-08-21", "anual", 150, 30, "rendimiento", "Fisura de tibia derecha (2025), ya consolidada", true, false],
  ["Gabriela Milagros Ríos Espinoza", "F", "1993-02-27", "trimestral", 40, 22, "perdida_peso", "", true, true],
  ["Fernando José Silva Navarro", "M", "1991-06-16", "mensual", 27, 20, "hipertrofia", "", true, false],
  ["Daniela Alejandra Rojas Cárdenas", "F", "2001-10-10", "semestral", 80, 26, "tonificacion", "Esguince de tobillo izquierdo (hace 6 meses)", true, false],
  ["Kevin Andrés Morales Ponce", "M", "2003-03-05", "mensual", 22, 15, "hipertrofia", "", false, false],
  ["Patricia Elena Cruz Benites", "F", "1987-07-19", "trimestral", 55, 20, "salud", "Contractura cervical frecuente", true, false],
  ["Alonso Rafael Vega Zapata", "M", "1995-01-29", "anual", 100, 29, "rendimiento", "", true, false],
  ["Lucero Abigail Herrera Soto", "F", "1999-12-12", "mensual", 26, 18, "perdida_peso", "", true, true],
  ["Óscar Manuel Paredes Luna", "M", "1982-04-22", "trimestral", 65, 16, "salud", "Dolor lumbar mecánico", true, false],
  ["Ximena Paola Flores Aguilar", "F", "2004-06-08", "mensual", 18, 15, "tonificacion", "", false, false],
  ["Rodrigo Iván Cabrera Mejía", "M", "1997-10-01", "semestral", 85, 27, "hipertrofia", "Tendinitis de hombro derecho", true, false],
  ["Sofía Isabel Ramos Villanueva", "F", "1996-02-14", "trimestral", 45, 21, "tonificacion", "", true, false],
];

const LESIONES = {
  2: { zona: "lumbar", eva: 4, motivo: "Dolor lumbar por hernia discal L4-L5", puntos: ["Cuadrado lumbar derecho"], tono: "hipertono", sala: "Evitar peso muerto convencional y sentadilla con barra alta pesada. Priorizar core y bisagra con poco peso.", antecedentes: ["Hernia discal L4-L5"] },
  8: { zona: "rodilla", eva: 2, motivo: "Control post fisura de tibia derecha", puntos: [], tono: "normotono", sala: "Saltos y pliometría solo con autorización. Progresar carga en pierna derecha.", antecedentes: ["Fisura de tibia derecha (2025)"] },
  11: { zona: "tobillo", eva: 3, motivo: "Inestabilidad de tobillo izquierdo post esguince", puntos: ["Peroneos izquierdos"], tono: "hipotono", sala: "Trabajo de propiocepción antes de piernas. Evitar cambios bruscos de dirección.", antecedentes: ["Esguince de tobillo grado II"] },
  13: { zona: "cervical", eva: 5, motivo: "Contractura de trapecio superior", puntos: ["Trapecio superior derecho", "Elevador de la escápula"], tono: "hipertono", sala: "Evitar encogimientos (shrugs) y press militar pesado mientras dure la contractura.", antecedentes: [] },
  16: { zona: "lumbar", eva: 4, motivo: "Lumbalgia mecánica", puntos: ["Paravertebrales lumbares"], tono: "hipertono", sala: "Sin peso muerto ni remo con barra por 2 semanas. Fortalecer glúteo medio y core.", antecedentes: [] },
  18: { zona: "hombro", eva: 5, motivo: "Tendinitis del supraespinoso derecho", puntos: ["Supraespinoso", "Deltoides anterior"], tono: "hipertono", sala: "No elevar el brazo por encima de la cabeza con carga. Sin press tras nuca ni fondos.", antecedentes: ["Tendinitis de hombro"] },
};

const PRODUCTOS = [
  ["Agua San Luis sin gas 625 ml", "bebidas", "San Luis", 1.2, 2.5, 120, 24],
  ["Agua San Luis con gas 625 ml", "bebidas", "San Luis", 1.4, 3, 60, 12],
  ["Gatorade Tropical 500 ml", "bebidas", "Gatorade", 2.8, 5, 80, 15],
  ["Sporade Mandarina 500 ml", "bebidas", "Sporade", 1.9, 3.5, 80, 15],
  ["Powerade Mora Azul 473 ml", "bebidas", "Powerade", 2.5, 4.5, 50, 10],
  ["Proteína Whey Gold Standard 2 lb", "suplementos", "Optimum Nutrition", 160, 230, 12, 3],
  ["Creatina Monohidratada 300 g", "suplementos", "Universal", 75, 120, 15, 4],
  ["Quemador Hydroxycut Hardcore 100 cáps", "suplementos", "MuscleTech", 95, 150, 10, 3],
  ["Pre-entreno C4 Original 30 serv.", "suplementos", "Cellucor", 110, 170, 10, 3],
  ["Barra de proteína Quest 60 g", "snacks", "Quest", 7, 12, 40, 10],
  ["Shaker RADICAL 600 ml", "accesorios", "RADICAL", 8, 20, 25, 5],
  ["Toalla de microfibra RADICAL", "accesorios", "RADICAL", 10, 25, 20, 5],
];

const PERSONAL = [
  ["cnt-demo-1", "Rosa Elvira Quispe Mamani", "40123456", "receptionist", "Recepción mañana", 1300, "Recepción", "06:00", 36],
  ["cnt-demo-2", "Miguel Ángel Torres Vega", "41234567", "trainer", "Entrenador de sala", 1800, "Entrenamiento", "06:00", 48],
  ["cnt-demo-3", "Lucía Fernanda Paz Ortiz", "42345678", "trainer", "Entrenadora funcional", 1700, "Entrenamiento", "14:00", 40],
  ["cnt-demo-4", "Carmen Rosa Delgado Sánchez", "43456789", "maintenance", "Limpieza y mantenimiento", 1130, "Mantenimiento", "07:00", 48],
];

const PROSPECTOS = [
  ["David Flores Ramos", "915154900", "trimestral", "visita", "whatsapp", 2, "16:00", "Vino a preguntar, estaba apurado. Quiere entrenar en las tardes."],
  ["Milagros Torres Pinto", "987451236", "mensual", "redes", "llamada", 0, "19:30", "Escribió por Instagram, pidió que la llamen."],
  ["Brayan Huamán Ccori", "956123478", "anual", "referido", "visita", 1, "18:00", "Lo recomendó Carlos Mendoza. Viene con su pase libre."],
  ["Estefany Rojas Lima", "912345678", "semestral", "whatsapp", "whatsapp", 3, "12:00", "Pregunta por descuento para dos personas."],
  ["Julio César Ancco Quispe", "934567812", "trimestral", "visita", null, 0, "", "Ya se matriculó (demo de seguimiento conseguido)."],
  ["Paola Nicole Salas Rivas", "978654321", "mensual", "llamada", "llamada", -2, "17:00", "No contestó dos veces (demo de baja)."],
];

export async function cargarDemo({ base = "/api", token, log = console.log, catalogoUrl = "/ejercicios/catalogo.json" } = {}) {
  const tok = token || (typeof localStorage !== "undefined" && (localStorage.getItem("radicalgym_token")));
  if (!tok) throw new Error("Inicia sesión como administrador antes de cargar la demo.");
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
  if (yo.usuario?.role !== "admin") throw new Error("La demo solo la puede cargar el administrador.");

  // ---------- Planes ----------
  const planes = (await api("/planes")).filter((p) => p.active !== false);
  const elegir = (dias, palabra) =>
    planes.filter((p) => Number(p.durationDays) === dias).sort((a, b) => (new RegExp(palabra, "i").test(b.name) - new RegExp(palabra, "i").test(a.name)) || (/prueba|promo/i.test(a.name) - /prueba|promo/i.test(b.name)))[0] ||
    planes.slice().sort((a, b) => Math.abs(a.durationDays - dias) - Math.abs(b.durationDays - dias))[0];
  const PLAN = { mensual: elegir(30, "mensual"), trimestral: elegir(90, "trimestral"), semestral: elegir(180, "semestral"), anual: elegir(360, "anual") };
  log("Planes usados:", Object.fromEntries(Object.entries(PLAN).map(([k, p]) => [k, p?.name])));

  // ---------- Personal (contratos) ----------
  const contratos = [];
  for (const [id, nombre, dni, rol, titulo, sueldo, area, entrada, horas] of PERSONAL) {
    const inicio = sumarDias(hoy, -120);
    const c = {
      staffId: `stf-${id}`, fullName: nombre, dni, role: rol, roleTitle: titulo, phone: `9${dni.slice(1)}`, email: "",
      contractType: "1_year", startDate: inicio, endDate: sumarDias(inicio, 365), status: "active",
      monthlySalary: sueldo, hourlyRate: 0, assignedWeeklyHours: horas, workModality: "full_time", department: area,
      paymentStatus: "al_dia", contractDurationLabel: "Contrato 1 Año", shiftStart: entrada,
    };
    await reg("contratos", id, c);
    contratos.push({ id, ...c, entrada });
    sumar("contratos");
  }

  // ---------- Entrenadores (para asignar alumnos) ----------
  const entrenadores = await api("/entrenadores");
  const nombresEntr = entrenadores.map((t) => t.id);

  // ---------- Alumnos ----------
  const existentes = await api("/alumnos");
  const alumnos = [];
  for (const [i, [nombre, sexo, nac, tipoPlan, desde, vino, objetivo, restriccion, conEntr, parcial]] of ALUMNOS.entries()) {
    sembrar(`alumno-${i}`);
    const dni = String(70900001 + i);
    let a = existentes.find((m) => m.dni === dni);
    const plan = PLAN[tipoPlan];
    if (!a) {
      const inicio = sumarDias(hoy, -desde);
      a = await api("/alumnos", "POST", {
        dni, fullName: nombre, gender: sexo, birthDate: nac, phone: `+519${String(51000000 + i * 37311).slice(0, 8)}`,
        email: "", address: uno(["Av. Ejército 1234, Cusco", "Jr. Tacna 450", "Urb. Magisterio B-12", "Calle Saphy 320", "Av. La Cultura 2010"]),
        emergencyContact: { name: "Familiar de " + nombre.split(" ")[0], phone: "+51984000" + String(100 + i), relationship: uno(["Madre", "Padre", "Esposo(a)", "Hermano(a)"]) },
        medicalNotes: restriccion || undefined, objective: objetivo, planId: plan.id, planName: plan.name,
        membershipStartDate: inicio, assignedTrainerId: conEntr && nombresEntr.length ? nombresEntr[i % nombresEntr.length] : undefined,
        amountPaid: parcial ? Math.round(plan.price * 0.6) : undefined, debtDueDate: parcial ? sumarDias(hoy, 7 + i) : undefined,
        paymentMethod: uno(["efectivo", "yape_plin", "tarjeta", "transferencia"]), notes: "Alumno de demostración",
      });
      sumar("alumnos");
    }
    alumnos.push({ ...a, _i: i, _desde: desde, _vino: vino, _objetivo: objetivo });
  }

  // ---------- Catálogo de ejercicios ----------
  let catalogo = [];
  try {
    catalogo = await (await fetch(catalogoUrl)).json();
  } catch {
    catalogo = [];
  }
  const porGrupo = (g, n) => {
    const l = catalogo.filter((x) => x.grupo === g);
    const out = [];
    for (let k = 0; k < n && l.length; k++) out.push(l[(entre(0, l.length - 1) + k * 7) % l.length]);
    return out;
  };
  const ej = (x, series, reps) => ({
    exerciseId: x.id, exerciseName: x.nombre, muscleGroup: x.grupo, sets: series, reps, rir: "RIR 1-2", restSeconds: series >= 4 ? 90 : 60,
    notes: "", gifUrl: x.gif, thumbnailUrl: x.img, steps: x.pasos,
  });
  const PLANTILLAS = {
    hipertrofia: [["Día 1 - Pecho y tríceps", [["pecho", 3], ["triceps", 2]]], ["Día 2 - Espalda y bíceps", [["espalda", 3], ["biceps", 2]]], ["Día 3 - Piernas y hombros", [["cuadriceps", 2], ["isquiotibiales_gluteos", 2], ["hombros", 2]]]],
    perdida_peso: [["Día 1 - Full body A", [["cuadriceps", 1], ["pecho", 1], ["espalda", 1], ["cardio_funcional", 2]]], ["Día 2 - Full body B", [["isquiotibiales_gluteos", 2], ["hombros", 1], ["core_abdomen", 2]]], ["Día 3 - Circuito metabólico", [["cardio_funcional", 3], ["core_abdomen", 2]]]],
    tonificacion: [["Día 1 - Tren inferior", [["isquiotibiales_gluteos", 3], ["cuadriceps", 2], ["pantorrillas", 1]]], ["Día 2 - Tren superior", [["espalda", 2], ["pecho", 1], ["hombros", 1], ["triceps", 1]]], ["Día 3 - Glúteo y core", [["isquiotibiales_gluteos", 3], ["core_abdomen", 2]]]],
    rendimiento: [["Día 1 - Fuerza", [["cuadriceps", 2], ["espalda", 2], ["pecho", 1]]], ["Día 2 - Potencia y core", [["cardio_funcional", 2], ["core_abdomen", 2], ["isquiotibiales_gluteos", 1]]], ["Día 3 - Hipertrofia accesoria", [["hombros", 2], ["biceps", 1], ["triceps", 1], ["pantorrillas", 1]]], ["Día 4 - Acondicionamiento", [["cardio_funcional", 3], ["core_abdomen", 1]]]],
    salud: [["Día 1 - Movilidad y fuerza", [["core_abdomen", 2], ["espalda", 2], ["isquiotibiales_gluteos", 1]]], ["Día 2 - Cardio suave y core", [["cardio_funcional", 2], ["core_abdomen", 2]]]],
  };

  // ---------- Rutinas (una por alumno) y asignación ----------
  for (const a of alumnos) {
    sembrar(`rutina-${a._i}`);
    const tipo = PLANTILLAS[a._objetivo] ? a._objetivo : "tonificacion";
    const id = `routine-demo-${a._i + 1}`;
    const days = PLANTILLAS[tipo].map(([nombre, grupos]) => ({
      dayName: nombre, focus: "", notes: LESIONES[a._i] ? `Cuidado: ${LESIONES[a._i].sala}` : "",
      exercises: grupos.flatMap(([g, n]) => porGrupo(g, n).map((x) => ej(x, tipo === "hipertrofia" ? 4 : 3, tipo === "perdida_peso" ? "15" : tipo === "rendimiento" ? "6-8" : "10-12"))),
    }));
    await reg("rutinas", id, {
      title: `Rutina ${{ hipertrofia: "Hipertrofia", perdida_peso: "Quema grasa", tonificacion: "Tonificación", rendimiento: "Rendimiento", salud: "Salud y movilidad" }[tipo]} · ${a.fullName.split(" ")[0]}`,
      description: "Rutina personalizada diseñada en RADICAL", level: uno(["principiante", "intermedio", "avanzado"]), objective: tipo,
      trainerId: a.assignedTrainerId || nombresEntr[0], trainerName: "Entrenador Principal", targetStudentId: a.id, targetStudentName: a.fullName,
      days, createdDate: sumarDias(hoy, -Math.min(a._desde, 30)),
    });
    await reg("asignaciones_rutina", a.id, { memberId: a.id, routineId: id });
    sumar("rutinas");
  }

  // ---------- Dietas ----------
  const PLATOS_BASE = [
    ["Desayuno", "07:00", "Avena con plátano, claras de huevo y café"],
    ["Media mañana", "10:30", "Yogur griego con fresas y almendras"],
    ["Almuerzo", "13:30", "Pechuga a la plancha, arroz integral, ensalada y palta"],
    ["Merienda", "17:00", "Pan integral con pollo deshilachado"],
    ["Cena", "20:30", "Pescado al horno con verduras salteadas y camote"],
  ];
  for (const a of alumnos) {
    const mujer = a.gender === "F";
    const k = mujer ? 1 : 2;
    const kcal = { perdida_peso: mujer ? 1500 : 1900, hipertrofia: mujer ? 2100 : 2800, rendimiento: mujer ? 2200 : 2900, salud: mujer ? 1700 : 2100, tonificacion: mujer ? 1800 : 2300 }[a._objetivo] || 2000;
    const prot = Math.round((kcal * 0.3) / 4);
    const gras = Math.round((kcal * 0.25) / 9);
    const carb = Math.round((kcal - prot * 4 - gras * 9) / 4);
    await reg("planes_nutricion", `nutri-demo-${a._i + 1}`, {
      title: `Plan ${{ perdida_peso: "déficit", hipertrofia: "volumen limpio", rendimiento: "rendimiento", salud: "saludable", tonificacion: "definición" }[a._objetivo] || "equilibrado"} · ${a.fullName.split(" ")[0]}`,
      targetStudentId: a.id, targetStudentName: a.fullName, objective: a._objetivo,
      dailyCaloriesTarget: kcal, proteinsTargetGrams: prot, carbsTargetGrams: carb, fatsTargetGrams: gras, waterLitersTarget: mujer ? 2.5 : 3,
      trainerName: "Nutricionista Principal", supplements: a._objetivo === "hipertrofia" ? ["Proteína whey post entreno", "Creatina 5 g diarios"] : [],
      hydrationGuidelines: "Un vaso de agua al despertar y 500 ml durante el entrenamiento.", recommendations: "Evitar gaseosas y frituras. Dormir 7-8 horas.",
      meals: PLATOS_BASE.map(([n, h], j) => ({ id: `m${j}`, name: n, time: h, totalCalories: Math.round(kcal / 5), totalProteins: Math.round(prot / 5), totalCarbs: Math.round(carb / 5), totalFats: Math.round(gras / 5), items: [] })),
      plates: PLATOS_BASE.map(([n, h, nota], j) => ({
        id: `p${j}`, name: n, time: h, model: "equilibrado", veg: 40, protein: 30, carbs: 20, fats: 10,
        palms: j === 1 ? 0 : k, fists: j === 0 || j === 1 ? 0 : k, hands: a._objetivo === "perdida_peso" && j === 4 ? 0 : k, thumbs: k,
        fruits: j === 0 || j === 1 ? 1 : 0, dairy: j === 1 ? 1 : 0, nuts: j === 1 ? 1 : 0, oil: j === 2 || j === 4 ? 1 : 0, notes: nota,
      })),
      active: true, createdDate: sumarDias(hoy, -Math.min(a._desde, 20)),
    });
    sumar("dietas");
  }

  // ---------- Fisioterapia (lesiones, contracturas, fisuras) ----------
  for (const [i, L] of Object.entries(LESIONES)) {
    const a = alumnos[Number(i)];
    if (!a) continue;
    sembrar(`fisio-${i}`);
    await reg("fisioterapia", `physio-demo-${Number(i) + 1}`, {
      memberId: a.id, memberName: a.fullName, memberDni: a.dni, memberPhone: a.phone, date: sumarDias(hoy, -entre(3, 15)), time: "10:00 AM",
      physiotherapistId: "physio-1", physiotherapistName: "Fisioterapeuta Principal",
      initialMedicalRestrictions: a.medicalNotes || "Sin restricciones reportadas en la ficha", consultationReason: L.motivo,
      affectedZone: L.zona, affectedZones: [L.zona], affectedZoneSides: {}, painLevelEVA: L.eva,
      posturalEvaluation: "", rangeOfMotion: "Goniometría no registrada", functionalTests: "",
      treatmentsApplied: ["Electroterapia TENS Convencional", "Masoterapia descontracturante"], editableTreatments: [], planRegistered: true,
      studentIndications: [
        { id: "i1", name: L.zona === "cervical" ? "Estiramiento de trapecio lateral" : L.zona === "hombro" ? "Rotaciones de hombro" : "Movilidad de cadera", category: "estiramiento", place: "gimnasio", sets: 3, reps: null, seconds: 30, detail: "Lento, sin dolor" },
        { id: "i2", name: "Hielo en la zona de dolor", category: "cuidados", place: "casa", sets: null, reps: null, seconds: null, detail: "15 minutos después de entrenar" },
      ],
      studentIndicationsNotes: "", gymWorkoutRestrictions: L.sala, homeIndications: "Hielo 15 min y estiramientos suaves en casa.", evolutionNotes: "Evoluciona favorablemente.",
      sessionNumber: 1,
      physicalEvaluation: { history: L.motivo, medicalAntecedents: L.antecedentes, medications: [], posturalVisualEvaluation: { postureFindings: L.zona === "lumbar" ? ["Hiperlordosis Lumbar"] : L.zona === "cervical" ? ["Cabeza Adelantada (Forward Head) leve"] : [] } },
      functionalEvaluation: { rangeOfMotionStatus: "limitado", palpationPainZone: { triggerPoints: L.puntos, muscleTone: L.tono, temperatureEdema: "normal", tenderZoneNotes: "" } },
    });
    sumar("fisioterapia");
  }

  // ---------- Asistencias de alumnos (15 a 30 días cada uno) ----------
  for (const a of alumnos) {
    sembrar(`asistencia-${a._i}`);
    const ventana = Math.min(a._desde, 40);
    const dias = new Set();
    let intentos = 0;
    while (dias.size < Math.min(a._vino, ventana) && intentos++ < 500) dias.add(entre(0, ventana - 1));
    const horaBase = entre(6, 19);
    for (const d of dias) {
      const fecha = sumarDias(hoy, -d);
      const h = Math.min(21, Math.max(6, horaBase + entre(-1, 1)));
      await reg("asistencias", `att-demo-${a._i + 1}-${fecha}`, {
        userId: a.id, userName: a.fullName, userRole: "student", userDni: a.dni, type: "in", status: "authorized", category: "student",
        checkInMethod: uno(["qr_app", "dni_manual", "quick_pass"]), membershipPlan: a.planName, notes: "Ingreso regular a sala de entrenamiento",
        date: fecha, time: hora12(h, entre(0, 59)),
      });
      sumar("asistencias_alumnos");
    }
  }

  // ---------- Asistencia del personal (puntual / tarde / falta / permiso) ----------
  for (const c of contratos) {
    for (let d = 20; d >= 0; d--) {
      const fecha = sumarDias(hoy, -d);
      const diaSem = new Date(`${fecha}T12:00:00Z`).getUTCDay();
      if (diaSem === 0) continue; // domingos libres
      sembrar(`personal-${c.id}-${fecha}`);
      const [hh] = c.entrada.split(":").map(Number);
      const r = azar();
      const estado = r < 0.7 ? "puntual" : r < 0.9 ? "tarde" : r < 0.95 ? "permiso" : "falta";
      const minutos = estado === "tarde" ? entre(6, 25) : estado === "puntual" ? entre(0, 4) : 0;
      await reg("asistencias", `att-demo-${c.id}-${fecha}`, {
        userId: c.staffId, contractId: c.id, userName: c.fullName, userRole: c.role === "trainer" ? "trainer" : "staff", userDni: c.dni,
        type: "in", status: estado, category: "staff", checkInMethod: "quick_pass", scheduledTime: `${c.entrada} - Jornada asignada`,
        hoursWorked: estado === "falta" ? 0 : 8, reason: estado === "tarde" ? uno(["Tráfico", "Problema con el transporte", "Lluvia"]) : estado === "permiso" ? "Cita médica" : estado === "falta" ? "No se presentó" : undefined,
        date: fecha, time: estado === "falta" ? "" : hora12(hh, minutos),
      });
      sumar("asistencias_personal");
    }
  }

  // ---------- Pagos al personal (planilla del mes pasado y del anterior) ----------
  const movsSueldos = (await api("/caja")).map((t) => t.description);
  const mesPasado = sumarDias(`${hoy.slice(0, 7)}-01`, -1);
  const mesAntepasado = sumarDias(`${mesPasado.slice(0, 7)}-01`, -1);
  for (const [k, c] of contratos.entries()) {
    for (const fin of [mesAntepasado, mesPasado]) {
      if (fin === mesAntepasado && k >= 2) continue; // 6 pagos en total
      const bono = k === 1 ? 100 : 0;
      const id = `pyr-demo-${c.id}-${fin.slice(0, 7)}`;
      const pago = sumarDias(fin, 1);
      await reg("planilla", id, {
        contractId: c.id, staffName: c.fullName, role: c.role, department: c.department, month: nombreMes(fin),
        baseSalary: c.monthlySalary, workedHours: c.assignedWeeklyHours * 4, hourlyRate: 0, bonusAmount: bono, deductions: 0,
        netPay: c.monthlySalary + bono, status: "paid", paymentDate: pago, paymentMethod: "transferencia", receiptNumber: `REC-RH-${id.slice(-7)}`,
      });
      const desc = `Pago de Sueldo/Nómina: ${c.fullName} (${c.department} - ${nombreMes(fin)})`;
      if (!movsSueldos.includes(desc)) await api("/caja", "POST", {
        type: "expense", category: "salary", amount: c.monthlySalary + bono, date: pago, paymentMethod: "transferencia",
        description: desc, staffName: c.fullName,
      });
      sumar("pagos_personal");
    }
  }

  // ---------- Alquiler (3 meses), servicios y gastos ----------
  const movsCaja = (await api("/caja")).map((t) => `${t.date}|${t.description}`);
  const caja = async (m) => {
    if (movsCaja.includes(`${m.date}|${m.description}`)) return;
    await api("/caja", "POST", m);
    sumar(m.type === "income" ? "otros_ingresos" : "gastos");
  };
  for (let k = 2; k >= 0; k--) {
    sembrar(`gastos-${k}`);
    const primero = sumarDias(`${hoy.slice(0, 7)}-01`, 0);
    const [y, m] = primero.split("-").map(Number);
    const dia = new Date(Date.UTC(y, m - 1 - k, 3)).toISOString().slice(0, 10);
    if (dia > hoy) continue;
    const mes = nombreMes(dia);
    await caja({ type: "expense", category: "rent", amount: 3500, date: dia, paymentMethod: "transferencia", description: `Alquiler del local - ${mes}` });
    await caja({ type: "expense", category: "utilities", amount: entre(380, 520), date: sumarDias(dia, 7), paymentMethod: "transferencia", description: `Luz (Electro Sur Este) - ${mes}` });
    await caja({ type: "expense", category: "utilities", amount: entre(90, 140), date: sumarDias(dia, 8), paymentMethod: "transferencia", description: `Agua (SEDACUSCO) - ${mes}` });
    await caja({ type: "expense", category: "utilities", amount: 129, date: sumarDias(dia, 9), paymentMethod: "tarjeta", description: `Internet fibra - ${mes}` });
    await caja({ type: "expense", category: "marketing", amount: entre(150, 300), date: sumarDias(dia, 12), paymentMethod: "tarjeta", description: `Publicidad en Facebook e Instagram - ${mes}` });
    await caja({ type: "expense", category: "supplies", amount: entre(80, 160), date: sumarDias(dia, 14), paymentMethod: "efectivo", description: `Útiles de limpieza - ${mes}` });
    if (k === 1) await caja({ type: "expense", category: "maintenance", amount: 450, date: sumarDias(dia, 16), paymentMethod: "efectivo", description: "Mantenimiento de caminadoras" });
    if (k === 0) await caja({ type: "expense", category: "equipment_breakdown", amount: 280, date: sumarDias(dia, 1), paymentMethod: "efectivo", description: "Cambio de cable de polea alta", equipmentName: "Polea alta" });
    // Renovaciones e ingresos de meses anteriores (para que los reportes muestren varios meses)
    if (k > 0) {
      for (let r = 0; r < 8; r++) {
        const p = uno([PLAN.mensual, PLAN.mensual, PLAN.trimestral, PLAN.semestral]);
        await caja({ type: "income", category: "membership", amount: Number(p.price), date: sumarDias(dia, entre(0, 24)), paymentMethod: uno(["efectivo", "yape_plin", "tarjeta"]), description: `Renovación ${p.name} - socio ${r + 1} (${mes})` });
      }
      await caja({ type: "income", category: "personal_training", amount: 250, date: sumarDias(dia, 10), paymentMethod: "yape_plin", description: `Entrenamiento personal x10 sesiones (${mes})` });
      await caja({ type: "income", category: "nutrition", amount: 80, date: sumarDias(dia, 11), paymentMethod: "efectivo", description: `Consulta nutricional (${mes})` });
      await caja({ type: "income", category: "physiotherapy", amount: 120, date: sumarDias(dia, 13), paymentMethod: "tarjeta", description: `Sesiones de fisioterapia (${mes})` });
    }
  }

  // ---------- Productos y 30 ventas ----------
  const actuales = await api("/tienda/productos");
  const prods = [];
  for (const [nombre, cat, marca, costo, precio, stock, minimo] of PRODUCTOS) {
    let p = actuales.find((x) => x.name === nombre);
    if (!p) {
      p = await api("/tienda/productos", "POST", { name: nombre, category: cat, brand: marca, purchaseCost: costo, salePrice: precio, stock, minStockAlert: minimo, description: "" });
      sumar("productos");
    }
    prods.push(p);
  }
  // Las 30 ventas se registran solo la primera vez (cuando se crean los productos)
  const yaDemo = resumen.productos ? 0 : 30;
  sembrar("ventas");
  for (let v = yaDemo; v < 30; v++) {
    const items = [];
    const n = entre(1, 3);
    for (let k = 0; k < n; k++) {
      const p = prods[k === 0 ? entre(0, 4) : entre(0, prods.length - 1)];
      if (!items.some((x) => x.productId === p.id)) items.push({ productId: p.id, quantity: p.category === "bebidas" ? entre(1, 3) : 1 });
    }
    const socio = azar() < 0.6 ? uno(alumnos) : null;
    try {
      await api("/tienda/ventas", "POST", { items, paymentMethod: uno(["efectivo", "efectivo", "yape_plin", "tarjeta"]), memberId: socio?.id, customerName: socio ? undefined : `Cliente demo ${v + 1}` });
      sumar("ventas");
    } catch (e) {
      log("Venta omitida:", e.message);
    }
  }

  // ---------- Metas ----------
  try {
    const turnos = await api("/metas/turnos-recepcion");
    const mes = hoy.slice(0, 7);
    const metas = await api("/metas/metas").catch(() => []);
    for (const t of (turnos.shifts || turnos || []).slice(0, 2)) {
      if (metas.some((m) => m.receptionShiftId === t.id && String(m.start || "").startsWith(mes))) continue;
      await api("/metas/metas", "POST", { type: "recepcion", receptionShiftId: t.id, month: mes, amount: 8000, bonus: 150, notes: "Meta de ventas del mes (demo)" }).then(() => sumar("metas")).catch((e) => log("Meta omitida:", e.message));
    }
    for (const t of entrenadores.slice(0, 2)) {
      if (metas.some((m) => m.staffId === t.id && String(m.start || "").startsWith(mes))) continue;
      await api("/metas/metas", "POST", { type: "entrenador", staffId: t.id, month: mes, category: "general", achievements: 5, bonus: 100, notes: "Logros de alumnos del mes (demo)" }).then(() => sumar("metas")).catch((e) => log("Meta omitida:", e.message));
    }
    const objetivos = await api("/metas/objetivos").catch(() => []);
    for (const [j, a] of alumnos.slice(0, 8).entries()) {
      if ((objetivos || []).some((o) => String(o.memberId) === String(a.id))) continue;
      const lesion = LESIONES[a._i];
      await api("/metas/objetivos", "POST", {
        memberId: a.id, area: lesion ? "fisioterapia" : "nutricion",
        type: lesion ? "reducir_dolor" : a._objetivo === "perdida_peso" ? "bajar_peso" : "ganar_masa",
        description: lesion ? `Bajar el dolor de ${lesion.eva}/10 a 1/10` : a._objetivo === "perdida_peso" ? "Bajar de 82 a 76 kg" : "Subir 2 kg de masa muscular",
        initialValue: lesion ? lesion.eva : a._objetivo === "perdida_peso" ? 82 : 0, targetValue: lesion ? 1 : a._objetivo === "perdida_peso" ? 76 : 2,
        unit: lesion ? "EVA" : "kg", controlDate: sumarDias(hoy, 15 + j),
      }).then(() => sumar("objetivos")).catch((e) => log("Objetivo omitido:", e.message));
    }
  } catch (e) {
    log("Metas omitidas:", e.message);
  }

  // ---------- CRM: prospectos ----------
  try {
    const crm = await api("/prospectos");
    for (const [nombre, cel, tipoPlan, origen, contacto, enDias, hora, nota] of PROSPECTOS) {
      if (crm.some((p) => p.phone.replace(/\D/g, "").endsWith(cel))) continue;
      let p = await api("/prospectos", "POST", {
        fullName: nombre, phone: cel, planId: PLAN[tipoPlan]?.id, source: origen, notes: nota,
        contactType: contacto && enDias >= 0 ? contacto : "", contactDate: contacto && enDias >= 0 ? sumarDias(hoy, enDias) : "", contactTime: contacto && enDias >= 0 ? hora : "",
      });
      sumar("prospectos");
      if (nombre.startsWith("Brayan")) p = await api(`/prospectos/${p.id}/pase`, "POST", { fecha: sumarDias(hoy, 1) });
      if (nombre.startsWith("Julio")) {
        await api(`/prospectos/${p.id}/seguimiento`, "POST", { tipo: "visita", detalle: "Vino el sábado, probó la sala y se matriculó" });
        await api(`/prospectos/${p.id}/estado`, "POST", { estado: "matriculado", memberId: alumnos[4]?.id });
      }
      if (nombre.startsWith("Paola")) {
        await api(`/prospectos/${p.id}/seguimiento`, "POST", { tipo: "llamada", detalle: "Llamé a las 5 pm, no contestó" });
        await api(`/prospectos/${p.id}/seguimiento`, "POST", { tipo: "whatsapp", detalle: "Le escribí por WhatsApp, no respondió" });
        await api(`/prospectos/${p.id}/estado`, "POST", { estado: "de_baja", motivo: "No contesta" });
      }
    }
  } catch (e) {
    log("CRM omitido (¿ejecutaste el script 20?):", e.message);
  }

  log("Demo cargada:", resumen);
  return resumen;
}
