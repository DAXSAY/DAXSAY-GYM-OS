// =====================================================================
// Datos iniciales de la app.
// Los datos de demostración se eliminaron: el sistema trabaja con datos
// reales. Alumnos, planes, entrenadores y caja vienen de MySQL (API).
// Se conservan solo catálogos de referencia: biblioteca de ejercicios
// y reglas de notificación.
// =====================================================================
// Sin datos de demostración: se llena con datos reales
export const INITIAL_PLANS = [];

// Sin datos de demostración: se llena con datos reales
export const INITIAL_TRAINERS = [];

export const INITIAL_EXERCISES = [
  // PECHO
  {
    id: "ex-1",
    name: "Press de Banca Plano con Barra",
    muscleGroup: "pecho",
    secondaryMuscles: ["Tríceps", "Deltoides anterior"],
    equipment: "barra",
    difficulty: "intermedio",
    instructions:
      "Acuéstate sobre el banco plano con los pies firmes en el suelo. Retrae las escápulas, desciende la barra de forma controlada al pecho medio y empuja explosivamente hacia arriba sin bloquear codos bruscamente.",
    tips: "Mantén un arco lumbar natural y los codos en ángulo de 45-60 grados respecto al torso.",
    targetSetsRepsDefault: "4 series x 8-10 reps",
    videoUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-2",
    name: "Press Inclinado con Mancuernas",
    muscleGroup: "pecho",
    secondaryMuscles: ["Deltoides anterior", "Tríceps"],
    equipment: "mancuernas",
    difficulty: "intermedio",
    instructions:
      "Banco a 30-45 grados. Sube las mancuernas con control, estira el pectoral en el fondo y contrae arriba sin chocar las mancuernas.",
    tips: "Excelente para enfatizar la porción clavicular del pectoral.",
    targetSetsRepsDefault: "4 series x 10-12 reps",
    videoUrl: "https://www.youtube.com/watch?v=8iPEnn-ltC8",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-3",
    name: "Aperturas en Poleas (Cruces)",
    muscleGroup: "pecho",
    secondaryMuscles: ["Deltoides anterior"],
    equipment: "polea",
    difficulty: "principiante",
    instructions:
      "Coloca las poleas a media o alta altura. Da un paso al frente con el torso levemente inclinado y junta las manos frente al pecho apretando 1 segundo.",
    tips: "Mantén una ligera flexión constante de codos durante todo el recorrido.",
    targetSetsRepsDefault: "3 series x 12-15 reps",
    videoUrl: "https://www.youtube.com/watch?v=taI4XduLpBe",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-4",
    name: "Fondos en Paralelas para Pecho",
    muscleGroup: "pecho",
    secondaryMuscles: ["Tríceps", "Hombros"],
    equipment: "peso_corporal",
    difficulty: "avanzado",
    instructions:
      "Inclina el torso 30 grados hacia adelante y baja hasta que los codos formen 90 grados, sintiendo el estiramiento en el pectoral.",
    tips: "Evita descender en exceso si tienes molestias en el hombro.",
    targetSetsRepsDefault: "3 series x 8-12 reps",
    videoUrl: "https://www.youtube.com/watch?v=2z8JmcrW-As",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&auto=format&fit=crop&q=80",
  },

  // ESPALDA
  {
    id: "ex-5",
    name: "Dominadas Pronas (Pull-ups)",
    muscleGroup: "espalda",
    secondaryMuscles: ["Bíceps", "Braquial", "Core"],
    equipment: "peso_corporal",
    difficulty: "avanzado",
    instructions:
      "Agarre más ancho que los hombros. Tira con los codos hacia abajo llevando el pecho a la barra y desciende lentamente.",
    tips: "No te balancees; activa la espalda antes de flexionar los brazos.",
    targetSetsRepsDefault: "4 series x 6-10 reps",
    videoUrl: "https://www.youtube.com/watch?v=eGo4IYlbE5g",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-6",
    name: "Jalón al Pecho en Polea Alta",
    muscleGroup: "espalda",
    secondaryMuscles: ["Bíceps", "Dorsal ancho"],
    equipment: "polea",
    difficulty: "principiante",
    instructions:
      "Sujeta la barra ancha, reclina el torso 10 grados y lleva la barra hacia la parte superior del esternón sacando pecho.",
    tips: "Imagina que tiras desde los codos, no desde las muñecas.",
    targetSetsRepsDefault: "4 series x 10-12 reps",
    videoUrl: "https://www.youtube.com/watch?v=CAwf7n6Luuc",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-7",
    name: "Remo con Barra Inclinado (Pendlay / Tradicional)",
    muscleGroup: "espalda",
    secondaryMuscles: ["Erectores espinales", "Trapecio", "Bíceps"],
    equipment: "barra",
    difficulty: "intermedio",
    instructions:
      "Espalda recta paralela o a 45 grados del suelo. Tira de la barra hacia el ombligo apretando las escápulas.",
    tips: "Aprieta el abdomen para proteger la zona lumbar.",
    targetSetsRepsDefault: "4 series x 8-10 reps",
    videoUrl: "https://www.youtube.com/watch?v=G8l_8chR5BE",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-8",
    name: "Remo Gironda en Polea Baja",
    muscleGroup: "espalda",
    secondaryMuscles: ["Bíceps", "Romboide"],
    equipment: "polea",
    difficulty: "principiante",
    instructions:
      "Agarre en V, mantén la espalda erguida y lleva el agarre al abdomen manteniendo los codos pegados.",
    tips: "Pausa de 1 segundo en la máxima contracción.",
    targetSetsRepsDefault: "3 series x 12 reps",
    videoUrl: "https://www.youtube.com/watch?v=GZbfZ033f74",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80",
  },

  // CUADRICEPS Y PIERNAS
  {
    id: "ex-9",
    name: "Sentadilla Trasera con Barra (Back Squat)",
    muscleGroup: "cuadriceps",
    secondaryMuscles: ["Glúteos", "Isquiotibiales", "Core"],
    equipment: "barra",
    difficulty: "intermedio",
    instructions:
      "Barra sobre los trapecios. Desciende flexionando caderas y rodillas hasta romper el paralelo (90 grados) y sube con fuerza empujando el suelo.",
    tips: "Mantén las rodillas alineadas con la punta de los pies y la mirada al frente.",
    targetSetsRepsDefault: "4 series x 6-8 reps",
    videoUrl: "https://www.youtube.com/watch?v=bEv6CCg2BC8",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-10",
    name: "Prensa de Piernas 45 Grados",
    muscleGroup: "cuadriceps",
    secondaryMuscles: ["Glúteos"],
    equipment: "maquina",
    difficulty: "principiante",
    instructions:
      "Pies al ancho de hombros en la plataforma. Baja el peso flexionando rodillas sin despegar el coxis del respaldo y empuja sin bloquear las rodillas al final.",
    tips: "Nunca bloquees las rodillas por completo en la extensión.",
    targetSetsRepsDefault: "4 series x 10-12 reps",
    videoUrl: "https://www.youtube.com/watch?v=IZxyjW7MPJQ",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-11",
    name: "Extensión de Cuádriceps en Máquina",
    muscleGroup: "cuadriceps",
    secondaryMuscles: [],
    equipment: "maquina",
    difficulty: "principiante",
    instructions:
      "Ajusta el cojín sobre los tobillos. Extiende las piernas contrayendo los cuádriceps arriba durante 1 segundo y baja lentamente.",
    tips: "Excelente ejercicio para aislamiento previo o finalizador.",
    targetSetsRepsDefault: "3 series x 12-15 reps",
    videoUrl: "https://www.youtube.com/watch?v=YyvSfVjQeL0",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-12",
    name: "Búlgaras con Mancuernas",
    muscleGroup: "cuadriceps",
    secondaryMuscles: ["Glúteos", "Estabilizadores"],
    equipment: "mancuernas",
    difficulty: "avanzado",
    instructions:
      "Un pie apoyado atrás en un banco y la pierna delantera adelantada. Desciende verticalmente hasta que la rodilla trasera roce el suelo.",
    tips: "Inclinar un poco el torso potencia el trabajo de glúteo.",
    targetSetsRepsDefault: "3 series x 10 reps por pierna",
    videoUrl: "https://www.youtube.com/watch?v=2C-uNgKwPLE",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&auto=format&fit=crop&q=80",
  },

  // ISQUIOS Y GLÚTEOS
  {
    id: "ex-13",
    name: "Hip Thrust con Barra (Empuje de Cadera)",
    muscleGroup: "isquiotibiales_gluteos",
    secondaryMuscles: ["Isquios", "Core"],
    equipment: "barra",
    difficulty: "intermedio",
    instructions:
      "Espalda superior apoyada en un banco, barra acolchada sobre las caderas. Eleva la pelvis empujando con los talones hasta alinear torso y muslos.",
    tips: "Apreta los glúteos en el tope 2 segundos y mete la barbilla al pecho.",
    targetSetsRepsDefault: "4 series x 8-12 reps",
    videoUrl: "https://www.youtube.com/watch?v=SEdqd1n0cvg",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-14",
    name: "Peso Muerto Rumano con Mancuernas / Barra",
    muscleGroup: "isquiotibiales_gluteos",
    secondaryMuscles: ["Erectores", "Espalda alta"],
    equipment: "barra",
    difficulty: "intermedio",
    instructions:
      "Rodillas semiflexionadas y fijas. Empuja las caderas hacia atrás sintiendo un gran estiramiento en los femorales y regresa contrayendo glúteos.",
    tips: "La barra debe deslizarse rozando las piernas todo el tiempo.",
    targetSetsRepsDefault: "4 series x 10-12 reps",
    videoUrl: "https://www.youtube.com/watch?v=JCXUYuzwNrM",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-15",
    name: "Curl Femoral Tumbado en Máquina",
    muscleGroup: "isquiotibiales_gluteos",
    secondaryMuscles: ["Pantorrillas"],
    equipment: "maquina",
    difficulty: "principiante",
    instructions:
      "Boca abajo con el rodillo en la parte posterior de los tobillos. Flexiona las rodillas llevando los talones a los glúteos de manera controlada.",
    tips: "Mantén la pelvis pegada a la banca para no trampear con la zona lumbar.",
    targetSetsRepsDefault: "3 series x 12-15 reps",
    videoUrl: "https://www.youtube.com/watch?v=1Tq3EDRy_yU",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&q=80",
  },

  // HOMBROS
  {
    id: "ex-16",
    name: "Press Militar con Mancuernas Sentado",
    muscleGroup: "hombros",
    secondaryMuscles: ["Tríceps", "Trapecio"],
    equipment: "mancuernas",
    difficulty: "intermedio",
    instructions:
      "Sentado con respaldo a 80-90 grados. Empuja las mancuernas por encima de la cabeza y bájalas a la altura de las orejas.",
    tips: "Evita arquear excesivamente la zona lumbar.",
    targetSetsRepsDefault: "4 series x 8-10 reps",
    videoUrl: "https://www.youtube.com/watch?v=qEwKCR5JCog",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-17",
    name: "Elevaciones Laterales con Mancuernas",
    muscleGroup: "hombros",
    secondaryMuscles: ["Trapecio"],
    equipment: "mancuernas",
    difficulty: "principiante",
    instructions:
      "De pie o sentado, eleva los brazos lateralmente con los codos ligeramente flexionados hasta la altura de los hombros.",
    tips: "Lidera el movimiento con los codos y no uses impulso con el cuerpo.",
    targetSetsRepsDefault: "4 series x 12-15 reps",
    videoUrl: "https://www.youtube.com/watch?v=3VcKaXpzqRo",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-18",
    name: "Face Pulls en Polea Alta con Cuerda",
    muscleGroup: "hombros",
    secondaryMuscles: ["Manguito rotador", "Deltoides posterior", "Trapecio"],
    equipment: "polea",
    difficulty: "principiante",
    instructions:
      "Tira de la cuerda hacia la cara/ojos, rotando externamente los hombros de modo que los nudillos apunten hacia atrás.",
    tips: "Fundamental para la salud y postura del hombro.",
    targetSetsRepsDefault: "3 series x 15 reps",
    videoUrl: "https://www.youtube.com/watch?v=rep-qVOkqgk",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=80",
  },

  // BÍCEPS & TRÍCEPS
  {
    id: "ex-19",
    name: "Curl de Bíceps con Barra Z",
    muscleGroup: "biceps",
    secondaryMuscles: ["Antebrazos"],
    equipment: "barra",
    difficulty: "principiante",
    instructions:
      "De pie con agarre supino en los ángulos de la barra Z. Flexiona los codos sin mover los hombros hacia adelante y baja en 2 segundos.",
    tips: "La barra Z reduce la tensión en las muñecas.",
    targetSetsRepsDefault: "3 series x 10-12 reps",
    videoUrl: "https://www.youtube.com/watch?v=in7PaeYlhrM",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-20",
    name: "Curl Martillo con Mancuernas",
    muscleGroup: "biceps",
    secondaryMuscles: ["Braquial", "Braquiorradial"],
    equipment: "mancuernas",
    difficulty: "principiante",
    instructions:
      "Agarre neutro (palmas enfrentadas). Eleva las mancuernas para desarrollar el grosor del brazo.",
    tips: "Puedes hacerlo alterno o simultáneo.",
    targetSetsRepsDefault: "3 series x 12 reps",
    videoUrl: "https://www.youtube.com/watch?v=zC3nLlEvin4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-21",
    name: "Extensiones de Tríceps en Polea Alta con Cuerda",
    muscleGroup: "triceps",
    secondaryMuscles: [],
    equipment: "polea",
    difficulty: "principiante",
    instructions:
      "Codos pegados a los costados. Empuja la cuerda hacia abajo y separa los extremos al final para máxima contracción.",
    tips: "No muevas los codos de posición fija.",
    targetSetsRepsDefault: "4 series x 12-15 reps",
    videoUrl: "https://www.youtube.com/watch?v=vB5OHsJ3EME",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-22",
    name: "Press Francés con Mancuernas en Banco",
    muscleGroup: "triceps",
    secondaryMuscles: [],
    equipment: "mancuernas",
    difficulty: "intermedio",
    instructions:
      "Acuéstate en el banco con mancuernas en alto. Flexiona únicamente los codos bajando las mancuernas a los lados de la frente y extiende.",
    tips: "Gran énfasis en la cabeza larga del tríceps.",
    targetSetsRepsDefault: "3 series x 10-12 reps",
    videoUrl: "https://www.youtube.com/watch?v=d_KZxkY_0cM",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&auto=format&fit=crop&q=80",
  },

  // CORE Y ABDOMEN
  {
    id: "ex-23",
    name: "Plancha Abdominal Isométrica (Plank)",
    muscleGroup: "core_abdomen",
    secondaryMuscles: ["Glúteos", "Hombros"],
    equipment: "peso_corporal",
    difficulty: "principiante",
    instructions:
      "Apoyo en antebrazos y puntas de pie. Cuerpo en línea recta perfecta sin hundir ni elevar la cadera.",
    tips: "Activa el transverso y glúteos activamente.",
    targetSetsRepsDefault: "3 series x 45-60 segundos",
    videoUrl: "https://www.youtube.com/watch?v=ASdvN_XEl_c",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-24",
    name: "Elevaciones de Piernas Colgado en Barra",
    muscleGroup: "core_abdomen",
    secondaryMuscles: ["Flexores de cadera"],
    equipment: "peso_corporal",
    difficulty: "avanzado",
    instructions:
      "Colgado de la barra, eleva las piernas rectas o flexionadas hacia el pecho contrayendo el abdomen.",
    tips: "Controla el descenso para no generar balanceo.",
    targetSetsRepsDefault: "3 series x 12-15 reps",
    videoUrl: "https://www.youtube.com/watch?v=hdng3Nm1x_E",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-25",
    name: "Rueda Abdominal (Ab Wheel Rollout)",
    muscleGroup: "core_abdomen",
    secondaryMuscles: ["Dorsales", "Hombros"],
    equipment: "otro",
    difficulty: "avanzado",
    instructions:
      "De rodillas, rueda hacia adelante manteniendo la espalda ligeramente redondeada y regresa contrayendo el core.",
    tips: "No permitas que la zona lumbar se arquee en la extensión.",
    targetSetsRepsDefault: "3 series x 8-12 reps",
    videoUrl: "https://www.youtube.com/watch?v=rqiTPdK1c_I",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80",
  },

  // CARDIO Y FUNCIONAL
  {
    id: "ex-26",
    name: "Burpees con Salto",
    muscleGroup: "cardio_funcional",
    secondaryMuscles: ["Pecho", "Piernas", "Core"],
    equipment: "peso_corporal",
    difficulty: "intermedio",
    instructions:
      "Baja a posición de plancha, haz una flexión, recupera los pies y salta verticalmente con los brazos arriba.",
    tips: "Ritmo constante para elevar la frecuencia cardíaca.",
    targetSetsRepsDefault: "4 series x 15 reps o 45 segs",
    videoUrl: "https://www.youtube.com/watch?v=auBLPXO8Fww",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-27",
    name: "Kettlebell Swings (Balanceo con Pesa Rusa)",
    muscleGroup: "cardio_funcional",
    secondaryMuscles: ["Glúteos", "Isquios", "Espalda baja", "Hombros"],
    equipment: "kettlebell",
    difficulty: "intermedio",
    instructions:
      "Bisagra de cadera explosiva. El impulso viene de los glúteos e isquiotibiales, no de los brazos.",
    tips: "Mantén la columna neutra durante toda la trayectoria.",
    targetSetsRepsDefault: "4 series x 20 reps",
    videoUrl: "https://www.youtube.com/watch?v=sSESeQAir2M",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "ex-28",
    name: "Intervalos en Assault Bike / Remo Concept2",
    muscleGroup: "cardio_funcional",
    secondaryMuscles: ["Cuerpo completo"],
    equipment: "maquina",
    difficulty: "intermedio",
    instructions:
      "Sprints de 20 segundos a máxima intensidad seguidos de 40 segundos de pedaleo suave de recuperación.",
    tips: "Ideal para acondicionamiento metabólico post-entrenamiento.",
    targetSetsRepsDefault: "8 a 10 rondas de intervalos",
    videoUrl: "https://www.youtube.com/watch?v=gT8_qQe5W44",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=400&auto=format&fit=crop&q=80",
  },
];

// Sin datos de demostración: se llena con datos reales
export const INITIAL_ROUTINES = [];

// Sin datos de demostración: se llena con datos reales
export const INITIAL_PRODUCTS = [];

// Sin datos de demostración: se llena con datos reales
export const INITIAL_MEMBERS = [];

// Sin datos de demostración: se llena con datos reales
export const INITIAL_TRANSACTIONS = [];

// Sin datos de demostración: se llena con datos reales
export const INITIAL_CLASSES = [];

export const INITIAL_NOTIFICATION_RULES = [
  {
    id: "rule-renew-7d",
    name: "Aviso Preventivo de Renovación (7 días antes)",
    category: "renewal_reminder",
    enabled: true,
    channels: ["push", "email", "whatsapp"],
    triggerTiming: "7 días antes del vencimiento",
    timingValueDays: 7,
    templateTitle: "¡Tu membresía vence pronto! 🏋️‍♂️",
    templateBody:
      "Hola {{nombre}}, te recordamos que tu plan {{plan}} vencerá en {{dias_restantes}} días (el {{fecha_vencimiento}}). Renueva con anticipación y mantén tu tarifa preferencial.",
    badgeTag: "Preventivo",
  },
  {
    id: "rule-renew-3d",
    name: "Aviso Urgente de Renovación (3 días antes)",
    category: "renewal_reminder",
    enabled: true,
    channels: ["push", "email", "whatsapp"],
    triggerTiming: "3 días antes del vencimiento",
    timingValueDays: 3,
    templateTitle: "⚠️ Quedan 3 días de tu membresía",
    templateBody:
      "Hola {{nombre}}, tu plan {{plan}} está a punto de vencer este {{fecha_vencimiento}}. ¡Evita interrupciones en tu rutina y renueva en recepción o en línea hoy mismo!",
    badgeTag: "Crítico",
  },
  {
    id: "rule-renew-expired",
    name: "Alerta de Membresía Vencida (Día 0 / Post-vencimiento)",
    category: "renewal_reminder",
    enabled: true,
    channels: ["push", "whatsapp"],
    triggerTiming: "El día del vencimiento",
    timingValueDays: 0,
    templateTitle: "Tu membresía ha vencido hoy ⛔",
    templateBody:
      "Hola {{nombre}}, tu plan {{plan}} venció el {{fecha_vencimiento}}. ¡Te extrañamos en el gym! Acércate a renovar para seguir entrenando sin perder tu racha.",
    badgeTag: "Vencido",
  },
  {
    id: "rule-class-reminder",
    name: "Recordatorio de Clase Reservada",
    category: "class_notice",
    enabled: true,
    channels: ["push", "whatsapp"],
    triggerTiming: "2 horas antes del inicio de la clase",
    timingValueDays: 0,
    templateTitle: "⏰ ¡Tu clase comienza en 2 horas!",
    templateBody:
      "Hola {{nombre}}, tienes reservada la clase de {{clase}} con el coach {{instructor}} a las {{hora}} en {{sala}}. ¡Prepara tu toalla y botella de agua!",
    badgeTag: "Clases",
  },
  {
    id: "rule-class-cancel-notice",
    name: "Aviso de Cambio o Nueva Clase Especial",
    category: "class_notice",
    enabled: true,
    channels: ["push", "email"],
    triggerTiming: "Disparo manual / Evento de clase",
    timingValueDays: 0,
    templateTitle: "🔥 Masterclass Especial anunciada en RADICAL",
    templateBody:
      "¡Hola {{nombre}}! Abrimos nuevas vacantes para la Masterclass de {{clase}} este fin de semana. ¡Reserva tu lugar antes de que se agoten los cupos!",
    badgeTag: "Especial",
  },
  {
    id: "rule-special-promo",
    name: "Promoción Exclusiva en Tienda y Membresías Anuales",
    category: "special_promo",
    enabled: true,
    channels: ["push", "email", "whatsapp"],
    triggerTiming: "Campañas programadas / Fin de mes",
    timingValueDays: 0,
    templateTitle: "🎉 ¡Oferta Flash: 20% OFF en Suplementos & Planes!",
    templateBody:
      "Hola {{nombre}}, por ser socio activo te regalamos 20% de descuento en proteínas ISO Whey, creatinas y renovación semestral. ¡Válido por 48 horas en recepción!",
    badgeTag: "Promoción",
  },
  {
    id: "rule-birthday",
    name: "Felicitación de Cumpleaños + Shake Gratis",
    category: "birthday",
    enabled: true,
    channels: ["push", "email", "whatsapp"],
    triggerTiming: "El día del cumpleaños del alumno",
    timingValueDays: 0,
    templateTitle: "🎂 ¡Feliz Cumpleaños de parte del equipo RADICAL!",
    templateBody:
      "¡Feliz día {{nombre}}! 🎉 Pasa hoy por la barra de nutrición para reclamar tu Protein Smoothie de regalo y un pase libre para tu mejor amigo.",
    badgeTag: "Fidelización",
  },
];

// Sin datos de demostración: se llena con datos reales
export const INITIAL_NOTIFICATION_LOGS = [];

// Sin datos de demostración: se llena con datos reales
export const INITIAL_NUTRITION_PLANS = [];

// Sin datos de demostración: se llena con datos reales
export const INITIAL_BODY_ASSESSMENTS = [];

// Sin datos de demostración: se llena con datos reales
export const INITIAL_USERS = [];

// Sin datos de demostración: se llena con datos reales
export const INITIAL_ATTENDANCES = [];

// Sin datos de demostración: se llena con datos reales
export const INITIAL_STAFF_CONTRACTS = [];

// Sin datos de demostración: se llena con datos reales
export const INITIAL_PHYSIO_RECORDS = [];

// Sin datos de demostración: se llena con datos reales
export const INITIAL_APPOINTMENTS = [];

// Sin datos de demostración: se llena con datos reales
export const INITIAL_PAYROLL_ENTRIES = [];
