export const INITIAL_PHYSIO_TEMPLATES = [
  {
    id: "tpl-lumbar",
    name: "Lumbalgia Mecánica & Sobrecarga de Espalda Baja",
    description:
      "Protocolo para dolor lumbar por compresión, esfuerzo en peso muerto o sentadilla. Descompresión y activación pélvica.",
    category: "Columna & Tronco",
    affectedZones: ["lumbar", "cadera"],
    consultationReason:
      "Lumbalgia mecánica con espasmo protector paravertebral y rigidez lumbopélvica",
    painLevelEVA: 6,
    postureFindings: [
      "Hiperlordosis lumbar",
      "Báscula pélvica anterior",
      "Hombros en ligera antepulsión",
    ],
    postureNotes:
      "Inhibición refleja de glúteo mayor y activación constante compensatoria de erectores espinales.",
    romStatus: "limitado_moderado",
    romDetails:
      "Flexión anterior limitada al 50% por dolor espástico lumbosacro; extensión tolerable.",
    painPhase: "arco_medio",
    dynamicPainEVA: 6,
    painNature: "Punzante en flexión anterior y transición de sedente a bípedo",
    functionalTests: [
      {
        testName: "Test de Thomas",
        joint: "Cadera / Psoas",
        result: "positivo",
        notes: "Retracción de flexores de cadera",
      },
      {
        testName: "Test de Lasègue",
        joint: "Columna Lumbar",
        result: "negativo",
        notes: "Sin compromiso radicular",
      },
      {
        testName: "Test de Schöber",
        joint: "Columna Lumbar",
        result: "positivo",
        notes: "Movilidad lumbosacra reducida",
      },
    ],
    muscleTone: "hipertono_espasmo",
    tempEdema: "calor_local",
    tenderNotes:
      "Puntos gatillo hiperirritables en cuadrado lumbar y paravertebrales L4-L5.",
    exerciseDosage: {
      customCardTitle: "Cartilla de Descompresión Lumbar & Estabilidad Core",
      customCardFrequency: "3 a 4 veces por semana",
      customExercises: [
        {
          id: "ex-t-1",
          name: "Cat-Camel (Gato-Camello) Suave",
          series: 3,
          repsOrTime: "10 repeticiones lentas",
          restSeconds: 45,
          techniqueTips:
            "Movimiento ondulatorio sin forzar arcos extremos de dolor",
          targetZone: "Columna Lumbar y Torácica",
        },
        {
          id: "ex-t-2",
          name: "Puente de Glúteos con Pausa Isométrica",
          series: 4,
          repsOrTime: "12 repeticiones (3s arriba)",
          restSeconds: 60,
          techniqueTips:
            "Empujar con talones y activar glúteos sin arquear lumbares",
          targetZone: "Glúteo Mayor y Cadena Posterior",
        },
        {
          id: "ex-t-3",
          name: "Deadbug con Control Abdominal",
          series: 3,
          repsOrTime: "8 reps por lado",
          restSeconds: 45,
          techniqueTips: "Mantener espalda baja pegada a la colchoneta",
          targetZone: "Core y Transverso Abdominal",
        },
      ],
      progressiveLoads: {
        phase: "descarga_isometrica",
        maxRecommendedKg: 0,
        progressionCriteria:
          "Cero cargas axiales hasta dolor EVA < 3 sostenido",
      },
      exerciseAdaptation: {
        allowedExercises: [
          "Prensa 45° guiada con soporte total",
          "Curl femoral",
          "Jalón al pecho con agarre neutro",
        ],
        prohibitedExercises: [
          "Sentadilla libre con barra",
          "Peso muerto convencional pesado",
          "Press militar de pie",
        ],
        adaptationNotes:
          "Sustituir peso libre por máquinas guiadas con respaldo completo.",
      },
      passiveMobility: {
        techniques: [
          "Estiramiento de psoas en posición de caballero",
          "Descompresión lumbosacra",
        ],
        notes: "30s por posición sin rebotes",
      },
      resistance: {
        intensity: "baja",
        details: "Trabajo isométrico a baja carga y control motor.",
      },
      proprioception: {
        exercises: ["Apoyo monopodal en suelo firme", "Transferencias de peso"],
        level: "inicial",
      },
      vestibular: { enabled: false },
      power: { status: "contraindicado", details: "Impacto suspendido" },
    },
    gymRestrictions:
      "Prohibida sentadilla libre trasnuca y peso muerto con más de 20kg por 14 días. Reemplazar por Prensa 45° con respaldo y Polea alta.",
    homeIndications:
      "Aplicar calor húmedo 15 minutos por la noche. Realizar los 3 ejercicios de la cartilla en días alternos.",
    patientFriendlySummary:
      "Tienes una sobrecarga e inflamación mecánica en la espalda baja (lumbares). Tus vértebras y músculos están tensos como mecanismo de defensa. En el gimnasio puedes entrenar piernas en máquinas con respaldo, pero no cargues barras libres sobre la espalda. Haz la cartilla de 3 ejercicios suaves en casa.",
    additionalObservations: [
      "Espasmo muscular reflejo marcado a nivel L4-L5",
      "Buena tolerancia a la descompresión pasiva",
      "Se recomienda hidratación adecuada y evitar estar más de 45 minutos sentado continuo",
    ],
    isCustom: false,
  },
  {
    id: "tpl-wrist-tendinitis",
    name: "Tendinitis de Muñeca, Túnel Carpiano & Antebrazo",
    description:
      "Protocolo para dolor al agarre, flexión/extensión forzada en press de banca o curl de bíceps con barra.",
    category: "Miembro Superior",
    affectedZones: ["muneca_mano", "codo"],
    consultationReason:
      "Tendinopatía de flexores/extensores de muñeca con dolor punzante al agarre y pronosupinación",
    painLevelEVA: 5,
    postureFindings: ["Hombros enrollados", "Pronación excesiva de antebrazo"],
    postureNotes:
      "Compensación de fuerza de agarre con flexores superficiales por fatiga.",
    romStatus: "limitado_leve",
    romDetails:
      "Extensión de muñeca limitada a 60° con dolor en retináculo flexor; desviación radial conservada.",
    painPhase: "final_rango",
    dynamicPainEVA: 5,
    painNature: "Punzante al cargar mancuernas o apoyar palma en el suelo",
    functionalTests: [
      {
        testName: "Test de Phalen",
        joint: "Muñeca",
        result: "positivo",
        notes: "Parestesia leve en dedos pulgar e índice",
      },
      {
        testName: "Test de Tinel",
        joint: "Túnel Carpiano",
        result: "dudoso",
        notes: "Sensación de hormigueo distal",
      },
      {
        testName: "Test de Finkelstein",
        joint: "Muñeca / De Quervain",
        result: "negativo",
        notes: "Tendón abductor largo no comprometido",
      },
    ],
    muscleTone: "contractura_focal",
    tempEdema: "calor_local",
    tenderNotes:
      "Punto gatillo sensible en pronador redondo y vientre de extensores comunes.",
    exerciseDosage: {
      customCardTitle: "Cartilla de Fortalecimiento & Liberación de Muñeca",
      customCardFrequency: "3 veces por semana",
      customExercises: [
        {
          id: "ex-w-1",
          name: "Deslizamiento Tendinoso y Nervioso de Muñeca",
          series: 3,
          repsOrTime: "12 repeticiones lentas",
          restSeconds: 30,
          techniqueTips: "Extensión suave sin forzar rebotes bruscos",
          targetZone: "Muñeca y Antebrazo",
        },
        {
          id: "ex-w-2",
          name: "Extensión Isométrica de Muñeca con Toalla",
          series: 4,
          repsOrTime: "8 repeticiones de 5 segundos",
          restSeconds: 45,
          techniqueTips:
            "Empujar contra resistencia estática manteniendo muñeca neutra",
          targetZone: "Extensores de Muñeca",
        },
        {
          id: "ex-w-3",
          name: "Rotación de Antebrazo Asistida con Vara Liviana",
          series: 3,
          repsOrTime: "10 reps por lado",
          restSeconds: 30,
          techniqueTips: "Control en fase excéntrica lenta de pronosupinación",
          targetZone: "Pronadores y Supinadores",
        },
      ],
      progressiveLoads: {
        phase: "movilidad_sin_carga",
        maxRecommendedKg: 2,
        progressionCriteria:
          "Aumentar carga solo si el agarre no reproduce molestia punzante",
      },
      exerciseAdaptation: {
        allowedExercises: [
          "Prensa de piernas",
          "Elevaciones laterales con polea en antebrazo",
          "Sentadillas con cinturón de peso",
        ],
        prohibitedExercises: [
          "Press militar con barra recta",
          "Flexiones de brazos con palma plana",
          "Curl de bíceps con barra recta",
        ],
        adaptationNotes:
          "Utilizar agarres neutros (mancuernas) o correas de agarre para no saturar flexores.",
      },
      passiveMobility: {
        techniques: ["Estiramiento de flexores de muñeca con codo extendido"],
        notes: "3 series de 25 segundos",
      },
      resistance: {
        intensity: "baja",
        details: "Isometría analítica en posición neutra articular.",
      },
      proprioception: {
        exercises: ["Apretar pelota de espuma de baja densidad"],
        level: "inicial",
      },
      vestibular: { enabled: false },
      power: { status: "contraindicado" },
    },
    gymRestrictions:
      "Usar muñequeras semi-rígidas con soporte para empujes. Prohibido apoyar palmas en el suelo (usar apoyos con mancuernas para flexiones).",
    homeIndications:
      "Hielo 10 minutos post-ejercicio. Realizar automasaje con pelota suave en el antebrazo.",
    patientFriendlySummary:
      "Tienes una inflamación en los tendones de la muñeca (tendinitis) debido a sobreesfuerzo en los agarres de las pesas. Para sanar rápido, entrena con agarre neutro, ponte muñequeras y no apoyes las palmas en plano. Cumple con los estiramientos diarios.",
    additionalObservations: [
      "Inflamación activa en la inserción tendinosa flexora",
      "Se prescribió uso de muñequeras en entrenamientos de empuje",
    ],
    isCustom: false,
  },
  {
    id: "tpl-ankle-sprain",
    name: "Esguince de Tobillo & Readaptación Articular",
    description:
      "Protocolo de recuperación de ligamento lateral externo, propiocepción y reincorporación a impactos.",
    category: "Miembro Inferior",
    affectedZones: ["tobillo_pie"],
    consultationReason:
      "Esguince de tobillo por inversión forzada con inestabilidad funcional y dolor retromaleolar",
    painLevelEVA: 4,
    postureFindings: ["Pronación de antepié", "Marcha con desbalance lateral"],
    postureNotes:
      "Apoyo tímido en el borde externo con sobrecarga de peroneos laterales.",
    romStatus: "limitado_leve",
    romDetails: "Dorsiflexión reducida a 10° con tope blando inflamatorio.",
    painPhase: "final_rango",
    dynamicPainEVA: 4,
    painNature: "Tirantez y molestia sorda al apoyo completo de peso",
    functionalTests: [
      {
        testName: "Cajón Anterior de Tobillo",
        joint: "Tobillo",
        result: "negativo",
        notes: "Ligamento peroneoastragalino anterior continuo",
      },
      {
        testName: "Bostezo Articular en Inversión",
        joint: "Tobillo",
        result: "dudoso",
        notes: "Leve laxitud comparativa respecto a tobillo sano",
      },
      {
        testName: "Prueba de Apoyo Monopodal",
        joint: "Tobillo / Pie",
        result: "positivo",
        notes: "Dificultad de equilibrio tras 15 segundos",
      },
    ],
    muscleTone: "normotono",
    tempEdema: "edema_leve",
    tenderNotes:
      "Sensibilidad a la palpación sobre ligamento peroneo-astragalino anterior y peroneos.",
    exerciseDosage: {
      customCardTitle: "Cartilla de Propiocepción & Fortalecimiento de Tobillo",
      customCardFrequency: "4 veces por semana",
      customExercises: [
        {
          id: "ex-a-1",
          name: "Apoyo Monopodal con Ojos Abiertos / Cerrados",
          series: 3,
          repsOrTime: "30 segundos por lado",
          restSeconds: 45,
          techniqueTips:
            "Mantener rodilla en ligera flexión de 10° activando el arco del pie",
          targetZone: "Tobillo y Propiocepción",
        },
        {
          id: "ex-a-2",
          name: "Eversión de Tobillo con Banda Elástica",
          series: 3,
          repsOrTime: "15 repeticiones controladas",
          restSeconds: 45,
          techniqueTips:
            "Llevar punta del pie hacia afuera sin rotar la pierna",
          targetZone: "Músculos Peroneos",
        },
        {
          id: "ex-a-3",
          name: "Elevación de Talones en Escalón (Calf Raises)",
          series: 4,
          repsOrTime: "12 repeticiones (fase excéntrica 3s)",
          restSeconds: 60,
          techniqueTips:
            "Bajar talón suavemente por debajo del nivel del escalón",
          targetZone: "Gemelos y Tendón de Aquiles",
        },
      ],
      progressiveLoads: {
        phase: "carga_ligera_adaptativa",
        maxRecommendedKg: 10,
        progressionCriteria:
          "Iniciar trote suave en cinta solo si el apoyo monopodal supera 45s sin tambaleo",
      },
      exerciseAdaptation: {
        allowedExercises: [
          "Bicicleta elíptica sin impacto",
          "Prensa de piernas con pies altos",
          "Natación",
        ],
        prohibitedExercises: [
          "Trote al aire libre en terreno irregular",
          "Saltos a cajón",
          "Ciclismo indoor de pie (alta intensidad)",
        ],
        adaptationNotes:
          "Prohibida la pliometría hasta estabilidad ligamentosa completa.",
      },
      passiveMobility: {
        techniques: ["Movilización de astrágalo hacia posterior con banda"],
        notes: "Ganar dorsiflexión activa",
      },
      resistance: {
        intensity: "moderada",
        details: "Fortalecimiento de estabilizadores dinámicos.",
      },
      proprioception: {
        exercises: ["Bosu ball", "Circunferencias con el pie"],
        level: "intermedio",
      },
      vestibular: { enabled: false },
      power: { status: "fase_preparatoria" },
    },
    gymRestrictions:
      "Prohibidos saltos, saltos a la soga y correr en terreno irregular por 10 días.",
    homeIndications:
      "Crioterapia 12 minutos tras entrenar. Realizar equilibrio sobre una toalla doblada en casa.",
    patientFriendlySummary:
      "Tuviste una torcedura de tobillo que estiró los ligamentos. Para que el tobillo no se vuelva a doblar, necesitamos reentrenar los sensores de equilibrio (propiocepción) y fortalecer los músculos peroneos. Evita trotar y saltar hasta tu próximo control.",
    additionalObservations: [
      "Edema residual en región submaleolar externa en absorción",
      "Buen avance en estabilidad monopodal",
    ],
    isCustom: false,
  },
  {
    id: "tpl-cervical-shoulder",
    name: "Cervicalgia, Trapecios & Manguito Rotador",
    description:
      "Protocolo para dolor cervical, pinzamiento subacromial de hombro y tensión tensional de trapecios.",
    category: "Cervical & Hombro",
    affectedZones: ["cervical", "hombro"],
    consultationReason:
      "Cervicobraquialgia tensional con sobrecarga de trapecio superior y bursitis subacromial",
    painLevelEVA: 6,
    postureFindings: ["Cabeza adelantada", "Hombros protraídos"],
    postureNotes:
      "Tensión excesiva en trapecios superiores con debilidad de serrato anterior.",
    romStatus: "limitado_moderado",
    romDetails:
      "Abducción de hombro con arco doloroso entre 70° y 110°. Rotación cervical derecha limitada al 70%.",
    painPhase: "arco_medio",
    dynamicPainEVA: 6,
    painNature:
      "Opresivo y quemante en trapecio con pinchazo agudo en hombro al elevar el brazo",
    functionalTests: [
      {
        testName: "Test de Neer",
        joint: "Hombro",
        result: "positivo",
        notes: "Dolor en espacio subacromial a 90° de elevación",
      },
      {
        testName: "Test de Hawkins-Kennedy",
        joint: "Hombro",
        result: "positivo",
        notes: "Reproduce pinzamiento de manguito",
      },
      {
        testName: "Test de Spurling",
        joint: "Cervical",
        result: "negativo",
        notes: "Sin compresión radicular cervical aguda",
      },
    ],
    muscleTone: "hipertono_espasmo",
    tempEdema: "normotermico",
    tenderNotes:
      "Puntos gatillo en trapecio superior derecho y angular de la escápula.",
    exerciseDosage: {
      customCardTitle:
        "Cartilla de Movilidad Cervical & Estabilización Escapular",
      customCardFrequency: "3 a 4 veces por semana",
      customExercises: [
        {
          id: "ex-c-1",
          name: "Retracción Cervical (Chin-Tuck) con Doble Mentón",
          series: 3,
          repsOrTime: "12 repeticiones de 4s",
          restSeconds: 30,
          techniqueTips:
            "Deslizar la barbilla hacia atrás sin flexionar la cabeza hacia abajo",
          targetZone: "Flexores Profundos del Cuello",
        },
        {
          id: "ex-c-2",
          name: "Rotación Externa de Hombro con Banda a 0° de Abducción",
          series: 3,
          repsOrTime: "12 repeticiones lentas",
          restSeconds: 45,
          techniqueTips:
            "Toalla entre codo y tronco; codo a 90° pegado al cuerpo",
          targetZone: "Infraespinoso y Redondo Menor",
        },
        {
          id: "ex-c-3",
          name: "Wall Slide (Deslizamiento en Pared con Serrato Anterior)",
          series: 3,
          repsOrTime: "10 repeticiones",
          restSeconds: 45,
          techniqueTips:
            "Empujar antebrazos contra la pared y elevar sin arquear la espalda",
          targetZone: "Serrato Anterior y Estabilidad Escapular",
        },
      ],
      progressiveLoads: {
        phase: "descarga_isometrica",
        maxRecommendedKg: 2,
        progressionCriteria:
          "No realizar press por encima de la cabeza hasta que el Test de Neer sea negativo",
      },
      exerciseAdaptation: {
        allowedExercises: [
          "Remo sentado con agarre neutro",
          "Sentadillas con soporte frontal",
          "Paseo del granjero con carga liviana",
        ],
        prohibitedExercises: [
          "Press militar con barra por delante o trasnuca",
          "Fondos en paralelas profundos",
          "Jalón trasnuca",
        ],
        adaptationNotes:
          "Mantener todos los empujes en el plano escapular (30° por delante del plano coronal).",
      },
      passiveMobility: {
        techniques: [
          "Estiramiento de pectoral menor en marco de puerta",
          "Liberación de trapecio superior",
        ],
        notes: "20 segundos por lado",
      },
      resistance: {
        intensity: "baja",
        details: "Fuerza isométrica del manguito rotador y serrato.",
      },
      proprioception: {
        exercises: ["Control escapular frente al espejo"],
        level: "intermedio",
      },
      vestibular: { enabled: false },
      power: { status: "contraindicado" },
    },
    gymRestrictions:
      "Prohibido press militar de pie y elevaciones frontales pesadas por 14 días. Reemplazar por Remo con agarre neutro.",
    homeIndications:
      "Aplicar calor 15 min en el cuello antes de dormir. Mantener pantalla de trabajo a la altura de los ojos.",
    patientFriendlySummary:
      "Tienes una inflamación en el manguito del hombro y mucha tensión en el cuello/trapecio. Al levantar el brazo se produce un roce que genera el pinchazo. No hagas empujes por encima de la cabeza por dos semanas y realiza los ejercicios para relajar el cuello y activar la escápula.",
    additionalObservations: [
      "Acortamiento de pectoral menor que favorece la antepulsión escapular",
      "Buena respuesta a la punción seca y terapia manual en cuello",
    ],
    isCustom: false,
  },
  {
    id: "tpl-knee-rehab",
    name: "Condromalacia Rotuliana & Rehabilitación de Rodilla",
    description:
      "Protocolo de fortalecimiento de vasto interno, descompresión fémoro-patelar y control de valgo.",
    category: "Miembro Inferior",
    affectedZones: ["rodilla", "cadera"],
    consultationReason:
      "Síndrome de dolor patelofemoral (condromalacia) con crepitación y dolor al bajar escaleras",
    painLevelEVA: 5,
    postureFindings: [
      "Valgo dinámico de rodillas",
      "Alineación de rótula lateralizada",
    ],
    postureNotes:
      "Debilidad de glúteo medio que permite el colapso de la rodilla hacia adentro.",
    romStatus: "completo",
    romDetails:
      "Flexión completa 140° pero con crepitación audible y dolor retropatelar a partir de los 80°.",
    painPhase: "arco_medio",
    dynamicPainEVA: 5,
    painNature:
      "Quemazón sordo retropatelar que empeora tras estar sentado mucho rato",
    functionalTests: [
      {
        testName: "Test de Clarke (Zohlen)",
        joint: "Rótula / Rodilla",
        result: "positivo",
        notes: "Dolor y aprehensión al contraer cuádriceps con compresión",
      },
      {
        testName: "Test de Lachman",
        joint: "Rodilla / LCA",
        result: "negativo",
        notes: "Ligamentos cruzados estables",
      },
      {
        testName: "Test de Trendelenburg",
        joint: "Cadera / Glúteo medio",
        result: "positivo",
        notes: "Caída de pelvis contralateral al apoyo monopodal",
      },
    ],
    muscleTone: "normotono",
    tempEdema: "normotermico",
    tenderNotes: "Hipersensibilidad en faceta articular externa de la rótula.",
    exerciseDosage: {
      customCardTitle: "Cartilla de Fortalecimiento Patelofemoral & Glúteo",
      customCardFrequency: "3 veces por semana",
      customExercises: [
        {
          id: "ex-k-1",
          name: "Knee Setting Isométrico con Toalla en Hueco Poplíteo",
          series: 4,
          repsOrTime: "10 contracciones de 6 segundos",
          restSeconds: 45,
          techniqueTips:
            "Apretar rodilla contra la toalla activando vasto medial oblicuo",
          targetZone: "Vasto Interno de Cuádriceps",
        },
        {
          id: "ex-k-2",
          name: "Clamshell (Ostra) con Miniband en Rodillas",
          series: 4,
          repsOrTime: "15 repeticiones por lado",
          restSeconds: 45,
          techniqueTips:
            "Pies pegados, rotar cadera hacia arriba sin balancear el tronco",
          targetZone: "Glúteo Medio y Rotadores Externos",
        },
        {
          id: "ex-k-3",
          name: "Puente Isquiotibial a 45° con Fitball o Banco",
          series: 3,
          repsOrTime: "10 repeticiones controladas",
          restSeconds: 60,
          techniqueTips: "Elevar cadera con rodillas semiflexionadas",
          targetZone: "Isquiosurales y Cadena Posterior",
        },
      ],
      progressiveLoads: {
        phase: "carga_ligera_adaptativa",
        maxRecommendedKg: 15,
        progressionCriteria:
          "Avanzar a sentadilla profunda solo cuando el Test de Clarke sea negativo",
      },
      exerciseAdaptation: {
        allowedExercises: [
          "Prensa inclinada con pies altos y sin bajar más de 90°",
          "Hip Thrust",
          "Bicicleta estática con asiento alto",
        ],
        prohibitedExercises: [
          "Extensión de cuádriceps en máquina (Leg Extension) pesada",
          "Sentadillas profundas sin soporte",
        ],
        adaptationNotes:
          "Evitar ángulos de flexión mayores a 90° con carga axial directa.",
      },
      passiveMobility: {
        techniques: ["Movilización manual pasiva de rótula en sentido medial"],
        notes: "2 minutos antes de entrenar",
      },
      resistance: {
        intensity: "moderada",
        details: "Isometría y control excéntrico de glúteo medio.",
      },
      proprioception: {
        exercises: ["Sentadilla monopodal corta en step (máximo 15cm)"],
        level: "intermedio",
      },
      vestibular: { enabled: false },
      power: { status: "fase_preparatoria" },
    },
    gymRestrictions:
      "Prohibida la máquina de extensión de cuádriceps con peso. Prohibido bajar en sentadilla más allá de los 90 grados.",
    homeIndications:
      "Hielo 15 min tras caminatas largas. Usar rodillera de centrado rotuliano durante entrenamientos intensos.",
    patientFriendlySummary:
      "Tu dolor proviene del roce de la rótula contra el fémur (condromalacia). Esto ocurre porque el músculo del muslo interno y el glúteo necesitan más fuerza para guiar la rótula en su riel correcto. En el gimnasio no hagas la máquina de patear peso y haz los ejercicios de fortalecimiento indicados.",
    additionalObservations: [
      "Lateralización patelar funcional compensada por hiperpresión externa",
      "Excelente respuesta a la activación de glúteo medio",
    ],
    isCustom: false,
  },
];
