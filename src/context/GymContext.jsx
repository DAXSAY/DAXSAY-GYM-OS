import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { INITIAL_PHYSIO_TEMPLATES } from "../data/physioTemplates";
import { api, guardarToken, obtenerToken, alPerderSesion } from "../api/cliente";
import {
  INITIAL_EXERCISES,
  INITIAL_ROUTINES,
  INITIAL_PRODUCTS,
  INITIAL_NOTIFICATION_RULES,
  INITIAL_NOTIFICATION_LOGS,
  INITIAL_CLASSES,
  INITIAL_NUTRITION_PLANS,
  INITIAL_BODY_ASSESSMENTS,
  INITIAL_ATTENDANCES,
  INITIAL_STAFF_CONTRACTS,
  INITIAL_PHYSIO_RECORDS,
  INITIAL_APPOINTMENTS,
  INITIAL_PAYROLL_ENTRIES,
} from "../data/initialData";
import { hoyISO } from "../utils/fecha";
import { useColeccion, avisar } from "./coleccion";

const GymContext = createContext(null);

// Claves que usaban versiones anteriores para guardar en el navegador.
// Hoy todo se guarda en MySQL; estas claves solo se leen una vez para
// subir a la base los datos que hubiera en este equipo.
const STORAGE_KEYS = {
  EXERCISES: "radicalgym_ejercicios_propios_v4",
  ROUTINES: "radicalgym_routines_v3",
  PRODUCTS: "radicalgym_products_v3",
  NOTIFICATION_RULES: "radicalgym_notification_rules_v3",
  NOTIFICATION_LOGS: "radicalgym_notification_logs_v3",
  CLASSES: "radicalgym_classes_v3",
  NUTRITION_PLANS: "radicalgym_nutrition_plans_v3",
  BODY_ASSESSMENTS: "radicalgym_body_assessments_v3",
  ATTENDANCES: "radicalgym_attendances_v3",
  STAFF_CONTRACTS: "radicalgym_staff_contracts_v3",
  PHYSIO_RECORDS: "radicalgym_physio_records_v3",
  PHYSIO_TEMPLATES: "radicalgym_physio_templates_v3",
  APPOINTMENTS: "radicalgym_appointments_v3",
  PAYROLL_ENTRIES: "radicalgym_payroll_entries_v3",
};

// Limpia datos de versiones anteriores (demostración, spinning, sesiones viejas)
try {
  const vigentes = new Set([
    ...Object.values(STORAGE_KEYS),
    STORAGE_KEYS.ROUTINES + "_asignaciones",
    "radicalgym_token",
  ]);
  Object.keys(localStorage)
    .filter((k) => k.startsWith("radicalgym_") && !vigentes.has(k))
    .forEach((k) => localStorage.removeItem(k));
} catch (e) {
  /* localStorage no disponible */
}

// "Octubre 2026" según la fecha de hoy (Lima)
const mesActual = () => {
  const [a, m] = hoyISO().split("-");
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return `${meses[Number(m) - 1]} ${a}`;
};

export const GymProvider = ({ children }) => {
  // --- Datos que vienen de MySQL (API) ---
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [staffDirectory, setStaffDirectory] = useState([]); // nombre y cargo del personal
  // Configuración del gimnasio (WhatsApp del gimnasio y del administrador...)
  const [gymConfig, setGymConfig] = useState({});
  const saveGymConfig = async (datos) => {
    const r = await api("/configuracion", { method: "PUT", body: datos });
    setGymConfig(r);
    return r;
  };
  // Turno de caja abierto / último cerrado (recepción y administración)
  const [cashShift, setCashShift] = useState(null);
  // Sesión del usuario (validada por la API)
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  // --- Registros de los módulos (MySQL, tabla registros_app) ---
  const [asignacionesRutina, setAsignacionesRutina, cargarAsignaciones, reiniciarAsignaciones] =
    useColeccion("asignaciones_rutina");
  const [exercises, setExercises, cargarEjercicios, reiniciarEjercicios] = useColeccion("ejercicios");
  const [routines, setRoutines, cargarRutinas, reiniciarRutinas] = useColeccion("rutinas");
  // Productos de la tienda: viven en la tabla `productos` (API /tienda)
  const [products, setProducts] = useState([]);
  const [foods, setFoods] = useState([]); // catálogo de alimentos (nutrición)
  const [notificationRules, setNotificationRules, cargarReglas, reiniciarReglas] =
    useColeccion("reglas_notificacion");
  const [notificationLogs, setNotificationLogs, cargarNotificaciones, reiniciarNotificaciones] =
    useColeccion("notificaciones");
  const [classes, setClasses, cargarClases, reiniciarClases] = useColeccion("clases");
  const [nutritionPlans, setNutritionPlans, cargarDietas, reiniciarDietas] = useColeccion("planes_nutricion");
  const [bodyAssessments, setBodyAssessments, cargarEvaluaciones, reiniciarEvaluaciones] =
    useColeccion("evaluaciones_corporales");
  const [attendances, setAttendances, cargarAsistencias, reiniciarAsistencias] = useColeccion("asistencias");
  const [staffContracts, setStaffContracts, cargarContratos, reiniciarContratos] = useColeccion("contratos");
  // Contratos con la etiqueta de duración siempre presente (registros antiguos no la tenían)
  const contratosNormalizados = useMemo(
    () =>
      staffContracts.map((c) =>
        c.contractDurationLabel
          ? c
          : {
              ...c,
              contractDurationLabel:
                c.contractType === "3_months" ? "Contrato 3 Meses" : c.contractType === "6_months" ? "Contrato 6 Meses" : "Contrato 1 Año",
            },
      ),
    [staffContracts],
  );
  const [physioRecords, setPhysioRecords, cargarFisio, reiniciarFisio] = useColeccion("fisioterapia");
  const [physioTemplates, setPhysioTemplates, cargarPlantillas, reiniciarPlantillas] =
    useColeccion("plantillas_fisioterapia");
  const [appointments, setAppointments, cargarCitas, reiniciarCitas] = useColeccion("citas");
  const [payrollEntries, setPayrollEntries, cargarPlanilla, reiniciarPlanilla] = useColeccion("planilla");

  // Rutina asignada a cada alumno: { idAlumno: idRutina }
  const routineAssignments = useMemo(
    () => Object.fromEntries(asignacionesRutina.map((a) => [a.memberId, a.routineId])),
    [asignacionesRutina],
  );
  const setRoutineAssignments = (actualizar) =>
    setAsignacionesRutina((prev) => {
      const actual = Object.fromEntries(prev.map((a) => [a.memberId, a.routineId]));
      const nuevo = typeof actualizar === "function" ? actualizar(actual) : actualizar;
      return Object.entries(nuevo)
        .filter(([, routineId]) => routineId)
        .map(([memberId, routineId]) => ({ id: String(memberId), memberId: String(memberId), routineId }));
    });

  // módulo de la base -> [cargar, reiniciar, clave antigua del navegador, datos base]
  const COLECCIONES = {
    asignaciones_rutina: [cargarAsignaciones, reiniciarAsignaciones, STORAGE_KEYS.ROUTINES + "_asignaciones", []],
    ejercicios: [cargarEjercicios, reiniciarEjercicios, STORAGE_KEYS.EXERCISES, []],
    rutinas: [cargarRutinas, reiniciarRutinas, STORAGE_KEYS.ROUTINES, INITIAL_ROUTINES],
    reglas_notificacion: [cargarReglas, reiniciarReglas, STORAGE_KEYS.NOTIFICATION_RULES, INITIAL_NOTIFICATION_RULES],
    notificaciones: [cargarNotificaciones, reiniciarNotificaciones, STORAGE_KEYS.NOTIFICATION_LOGS, INITIAL_NOTIFICATION_LOGS],
    clases: [cargarClases, reiniciarClases, STORAGE_KEYS.CLASSES, INITIAL_CLASSES],
    planes_nutricion: [cargarDietas, reiniciarDietas, STORAGE_KEYS.NUTRITION_PLANS, INITIAL_NUTRITION_PLANS],
    evaluaciones_corporales: [cargarEvaluaciones, reiniciarEvaluaciones, STORAGE_KEYS.BODY_ASSESSMENTS, INITIAL_BODY_ASSESSMENTS],
    asistencias: [cargarAsistencias, reiniciarAsistencias, STORAGE_KEYS.ATTENDANCES, INITIAL_ATTENDANCES],
    contratos: [cargarContratos, reiniciarContratos, STORAGE_KEYS.STAFF_CONTRACTS, INITIAL_STAFF_CONTRACTS],
    fisioterapia: [cargarFisio, reiniciarFisio, STORAGE_KEYS.PHYSIO_RECORDS, INITIAL_PHYSIO_RECORDS],
    plantillas_fisioterapia: [cargarPlantillas, reiniciarPlantillas, STORAGE_KEYS.PHYSIO_TEMPLATES, INITIAL_PHYSIO_TEMPLATES],
    citas: [cargarCitas, reiniciarCitas, STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS],
    planilla: [cargarPlanilla, reiniciarPlanilla, STORAGE_KEYS.PAYROLL_ENTRIES, INITIAL_PAYROLL_ENTRIES],
  };
  // Setters para la migración desde el navegador
  const SETTERS = {
    asignaciones_rutina: setAsignacionesRutina,
    ejercicios: setExercises,
    rutinas: setRoutines,
    reglas_notificacion: setNotificationRules,
    notificaciones: setNotificationLogs,
    clases: setClasses,
    planes_nutricion: setNutritionPlans,
    evaluaciones_corporales: setBodyAssessments,
    asistencias: setAttendances,
    contratos: setStaffContracts,
    fisioterapia: setPhysioRecords,
    plantillas_fisioterapia: setPhysioTemplates,
    citas: setAppointments,
    planilla: setPayrollEntries,
  };

  // =================================================================
  // SESIÓN Y CARGA DE DATOS DESDE MYSQL
  // =================================================================
  const limpiarSesion = () => {
    guardarToken(null);
    setCurrentUser(null);
    setMembers([]);
    setPlans([]);
    setTrainers([]);
    setTransactions([]);
    setProducts([]);
    Object.values(COLECCIONES).forEach(([, reiniciar]) => reiniciar());
  };

  // Carga los datos que viven en MySQL
  const loadServerData = async (silencioso = false) => {
    if (!silencioso) setDataLoading(true);
    // El alumno no consulta caja ni directorio del personal
    const esAlumno = currentUser?.role === "student";
    try {
      // allSettled: si un rol no tiene permiso para algo, lo demás igual carga
      const [alumnos, planes, entrenadores, movimientos, registros, personal, productosApi, config] = await Promise.allSettled([
        api("/alumnos"),
        api("/planes"),
        api("/entrenadores"),
        esAlumno ? Promise.resolve([]) : api("/caja"),
        api("/registros"),
        esAlumno ? Promise.resolve([]) : api("/personal"),
        esAlumno || !currentUser?.modules?.some((m) => ["store", "finance", "dashboard"].includes(m))
          ? Promise.resolve([])
          : api("/tienda/productos"),
        api("/configuracion"),
      ]);
      // Catálogo de alimentos: solo para quien arma dietas
      if (!esAlumno && currentUser?.modules?.includes("nutrition")) {
        api("/alimentos").then(setFoods).catch(() => setFoods([]));
      }
      const valor = (r, defecto) => (r.status === "fulfilled" ? r.value : defecto);
      setMembers(valor(alumnos, []));
      setPlans(valor(planes, []));
      setTrainers(valor(entrenadores, []));
      setTransactions(valor(movimientos, []));
      setStaffDirectory(valor(personal, []));
      setGymConfig(valor(config, {}));
      const listaProductos = valor(productosApi, []);
      setProducts(listaProductos);
      // Una sola vez: productos que quedaron guardados solo en este navegador
      if (!silencioso && productosApi.status === "fulfilled" && listaProductos.length === 0 && currentUser?.permissions?.store?.crear) migrarProductosLocales();

      if (registros.status === "rejected") {
        avisar("error", `No se pudieron cargar los registros: ${registros.reason?.message || ""}`);
      }
      const datos = valor(registros, {});
      Object.entries(COLECCIONES).forEach(([modulo, [cargar, , claveAntigua, base]]) => {
        const m = datos[modulo];
        if (!m) return cargar([], false);
        cargar(m.registros, m.editar);
        // Primera vez: se suben a MySQL los datos que había en este navegador
        if (!silencioso && m.registros.length === 0 && m.editar) {
          let locales = null;
          try {
            const crudo = localStorage.getItem(claveAntigua);
            if (crudo) locales = JSON.parse(crudo);
          } catch {
            locales = null;
          }
          if (modulo === "asignaciones_rutina" && locales && !Array.isArray(locales)) {
            locales = Object.entries(locales)
              .filter(([, r]) => r)
              .map(([memberId, routineId]) => ({ id: String(memberId), memberId: String(memberId), routineId }));
          }
          const iniciales = Array.isArray(locales) && locales.length ? locales : base;
          if (Array.isArray(iniciales) && iniciales.length) SETTERS[modulo](iniciales);
        }
        // La copia del navegador se borra solo cuando ya está segura en MySQL
        if (m.registros.length > 0) {
          try {
            localStorage.removeItem(claveAntigua);
          } catch {
            /* nada */
          }
        }
      });
    } catch (e) {
      console.error("Error cargando datos del servidor", e);
    } finally {
      if (!silencioso) setDataLoading(false);
    }
  };

  // Varias sesiones a la vez (admin, recepción, fisio...): cada pantalla se
  // actualiza sola cada 60 s y al volver a la pestaña, para ver lo que
  // registraron los demás sin recargar la página.
  useEffect(() => {
    if (!currentUser?.id) return;
    let ultima = Date.now();
    const refrescar = () => {
      if (document.visibilityState !== "visible" || Date.now() - ultima < 15000) return;
      ultima = Date.now();
      loadServerData(true);
    };
    const t = setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - ultima >= 60000) {
        ultima = Date.now();
        loadServerData(true);
      }
    }, 10000);
    window.addEventListener("focus", refrescar);
    document.addEventListener("visibilitychange", refrescar);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", refrescar);
      document.removeEventListener("visibilitychange", refrescar);
    };
  }, [currentUser?.id]);

  // Al abrir la app: si hay token, se valida con la API
  useEffect(() => {
    alPerderSesion(() => limpiarSesion());
    if (!obtenerToken()) {
      setAuthChecked(true);
      return;
    }
    api("/auth/yo")
      .then(({ usuario }) => setCurrentUser(usuario))
      .catch(() => limpiarSesion())
      .finally(() => setAuthChecked(true));
  }, []);

  // Cada vez que cambia el usuario conectado, se recargan sus datos
  useEffect(() => {
    if (currentUser?.id) loadServerData();
  }, [currentUser?.id]);

  // Estado de la caja por turnos: se actualiza al cobrar, matricular o gastar
  const veCaja = !!currentUser?.modules?.some((m) => m === "cash" || m === "finance");
  const refreshCashShift = async () => {
    if (!veCaja) return setCashShift(null);
    try {
      setCashShift(await api("/turnos-caja/actual"));
    } catch {
      /* sin conexión: se reintenta en el próximo cambio */
    }
  };
  useEffect(() => {
    if (!currentUser?.id) return setCashShift(null);
    const t = setTimeout(refreshCashShift, 400);
    return () => clearTimeout(t);
  }, [currentUser?.id, veCaja, transactions, members]);

  // Real-time status recalculation for members based on current reference date
  const computeMemberStatus = (endDateStr) => {
    const today = new Date(hoyISO()); // Using consistent system date context
    const end = new Date(endDateStr);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "expired";
    if (diffDays <= 7) return "expiring_soon";
    return "active";
  };

  // Helper getters
  const getMemberById = (id) => members.find((m) => m.id === id);
  const getTrainerById = (id) => trainers.find((t) => t.id === id);
  const getRoutineById = (id) => routines.find((r) => r.id === id);
  const getPlanById = (id) => plans.find((p) => p.id === id);
  const getProductById = (id) => products.find((p) => p.id === id);

  // =================================================================
  // ALUMNOS Y MATRÍCULAS (MySQL)
  // =================================================================
  // Agrega la rutina asignada (guardada local) a cada alumno
  const withRoutine = (m) => ({ ...m, assignedRoutineId: routineAssignments[m.id] || "" });
  const membersView = useMemo(() => members.map(withRoutine), [members, routineAssignments]);

  const replaceMember = (actualizado) =>
    setMembers((prev) => prev.map((m) => (m.id === actualizado.id ? actualizado : m)));

  const refreshTransactions = async () => {
    try {
      setTransactions(await api("/caja"));
    } catch (e) {
      console.error(e);
    }
  };

  // Registra alumno + primera matrícula. El pago entra solo a caja (trigger).
  const addMember = async (memberData) => {
    try {
      const nuevo = await api("/alumnos", { method: "POST", body: memberData });
      if (memberData.assignedRoutineId) {
        setRoutineAssignments((prev) => ({ ...prev, [nuevo.id]: memberData.assignedRoutineId }));
      }
      const { cuentaNueva, ...alumno } = nuevo;
      setMembers((prev) => [alumno, ...prev]);
      refreshTransactions();
      return nuevo;
    } catch (e) {
      alert(e.message);
      return null;
    }
  };

  const updateMember = async (id, memberData) => {
    try {
      replaceMember(await api(`/alumnos/${id}`, { method: "PUT", body: memberData }));
      return true;
    } catch (e) {
      alert(e.message);
      return false;
    }
  };

  // Crea o restablece el acceso del alumno al portal (usuario y clave = DNI)
  const resetStudentAccess = async (id) => {
    try {
      const r = await api(`/alumnos/${id}/cuenta`, { method: "POST" });
      const { cuentaNueva, ...alumno } = r;
      replaceMember(alumno);
      return r;
    } catch (e) {
      alert(e.message);
      return null;
    }
  };

  // Baja del alumno (su historial se conserva en la base)
  const deleteMember = async (id) => {
    try {
      await api(`/alumnos/${id}`, { method: "DELETE" });
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  const renewMembership = async (memberId, planId, paymentMethod, discount = 0, amountPaid, debtDueDate) => {
    try {
      replaceMember(
        await api(`/alumnos/${memberId}/renovar`, {
          method: "POST",
          body: { planId, paymentMethod, discount, amountPaid, debtDueDate },
        }),
      );
      refreshTransactions();
      return true;
    } catch (e) {
      alert(e.message);
      return false;
    }
  };

  // Cobro de saldo pendiente (deuda) de un alumno
  const payMemberDebt = async (memberId, monto, metodoPago, notas, fechaLimite) => {
    const actualizado = await api(`/alumnos/${memberId}/pagos`, {
      method: "POST",
      body: { monto, metodoPago, notas, fechaLimite: fechaLimite || undefined },
    });
    replaceMember(actualizado);
    refreshTransactions();
    return actualizado;
  };

  // Reprograma hasta cuándo el alumno cancelará su saldo
  const setDebtDueDate = async (memberId, fecha) => {
    const actualizado = await api(`/alumnos/${memberId}/fecha-limite`, { method: "PUT", body: { fecha } });
    replaceMember(actualizado);
    window.dispatchEvent(new Event("radicalgym:alertas"));
    return actualizado;
  };

  // Catálogo de alimentos (el nutricionista agrega los suyos)
  const saveFood = async (datos, id) => {
    const r = await api(id ? `/alimentos/${id}` : "/alimentos", { method: id ? "PUT" : "POST", body: datos });
    setFoods((prev) => (id ? prev.map((f) => (f.id === id ? r : f)) : [...prev, r]));
    return r;
  };
  const hideFood = async (id) => {
    await api(`/alimentos/${id}`, { method: "DELETE" });
    setFoods((prev) => prev.filter((f) => f.id !== id));
  };

  // Congelamiento de membresía (reglas del plan; la membresía se alarga los mismos días)
  const freezeMember = async (memberId, datos) => {
    const r = await api(`/alumnos/${memberId}/congelamientos`, { method: "POST", body: datos });
    replaceMember(r.member);
    return r;
  };

  // accion: "terminar" (vuelve antes; los días no usados se pierden) | "anular" (se devuelven los días)
  const closeFreeze = async (memberId, freezeId, accion, reason) => {
    const r = await api(`/alumnos/${memberId}/congelamientos/${freezeId}/${accion}`, { method: "POST", body: { reason } });
    replaceMember(r.member);
    return r.member;
  };

  const assignTrainerToMember = (memberId, trainerId) =>
    updateMember(memberId, { assignedTrainerId: trainerId || "" });

  const assignRoutineToMember = (memberId, routineId) => {
    setRoutineAssignments((prev) => ({ ...prev, [memberId]: routineId }));
    const member = members.find((m) => m.id === memberId);
    if (member && routineId) {
      setRoutines((prev) =>
        prev.map((r) =>
          r.id === routineId
            ? { ...r, targetStudentId: member.id, targetStudentName: member.fullName }
            : r,
        ),
      );
    }
  };

  // =================================================================
  // PLANES (MySQL)
  // =================================================================
  const addPlan = async (planData) => {
    try {
      const nuevo = await api("/planes", { method: "POST", body: planData });
      setPlans((prev) => [...prev, nuevo].sort((a, b) => a.price - b.price));
    } catch (e) {
      alert(e.message);
    }
  };

  const updatePlan = async (id, planData) => {
    try {
      const actual = plans.find((p) => p.id === id) || {};
      const editado = await api(`/planes/${id}`, { method: "PUT", body: { ...actual, ...planData } });
      setPlans((prev) => prev.map((p) => (p.id === id ? editado : p)));
    } catch (e) {
      alert(e.message);
    }
  };

  const deletePlan = async (id) => {
    try {
      await api(`/planes/${id}`, { method: "DELETE" });
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  // Trainer management
  const addTrainer = (trainerData) => {
    const newTrainer = {
      ...trainerData,
      id: `trainer-${Date.now()}`,
    };
    setTrainers((prev) => [...prev, newTrainer]);
  };

  const updateTrainer = (id, trainerData) => {
    setTrainers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...trainerData } : t)),
    );
  };

  const deleteTrainer = (id) => {
    setTrainers((prev) => prev.filter((t) => t.id !== id));
  };

  // Exercise management
  const addExercise = (exerciseData) => {
    const newExercise = {
      ...exerciseData,
      id: `ex-${Date.now()}`,
    };
    setExercises((prev) => [newExercise, ...prev]);
  };

  const updateExercise = (id, exerciseData) => {
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...exerciseData } : e)),
    );
  };

  const deleteExercise = (id) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  // Routine management
  const addRoutine = (routineData) => {
    const newRoutine = {
      ...routineData,
      id: `routine-${Date.now()}`,
      createdDate: hoyISO(),
    };
    setRoutines((prev) => [newRoutine, ...prev]);
  };

  const updateRoutine = (id, routineData) => {
    setRoutines((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...routineData } : r)),
    );
  };

  const deleteRoutine = (id) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
  };

  // =================================================================
  // TIENDA (MySQL: productos, ventas, kárdex)
  // =================================================================
  const refreshProducts = async () => {
    try {
      setProducts(await api("/tienda/productos"));
    } catch (e) {
      console.error(e);
    }
  };

  const migrarProductosLocales = async () => {
    let locales = [];
    try {
      locales = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || "[]");
    } catch {
      locales = [];
    }
    if (!Array.isArray(locales) || !locales.length) return;
    for (const p of locales) {
      try {
        await api("/tienda/productos", { method: "POST", body: p });
      } catch {
        /* sin permiso o duplicado: se omite */
      }
    }
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    refreshProducts();
  };

  const reemplazarProducto = (p) => setProducts((prev) => prev.map((x) => (x.id === p.id ? p : x)));

  const addProduct = async (productData) => {
    try {
      const p = await api("/tienda/productos", { method: "POST", body: productData });
      setProducts((prev) => [...prev, p]);
      return p;
    } catch (e) {
      avisar("error", e.message);
      throw e;
    }
  };

  const updateProduct = async (id, productData) => {
    const actual = products.find((p) => p.id === id) || {};
    try {
      const p = await api(`/tienda/productos/${id}`, { method: "PUT", body: { ...actual, ...productData } });
      reemplazarProducto(p);
      return p;
    } catch (e) {
      avisar("error", e.message);
      throw e;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await api(`/tienda/productos/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      avisar("error", e.message);
    }
  };

  // Entrada de mercadería, merma o ajuste por inventario físico (kárdex)
  const moveStock = async (productId, movimiento) => {
    const p = await api(`/tienda/productos/${productId}/movimiento`, { method: "POST", body: movimiento });
    reemplazarProducto(p);
    return p;
  };

  const updateStock = (productId, newStock) =>
    moveStock(productId, { tipo: "ajuste", cantidad: Math.max(0, newStock), motivo: "Ajuste rápido de inventario" }).catch((e) =>
      avisar("error", e.message),
    );

  // Venta del POS: la base descuenta stock, numera el ticket y registra
  // el ingreso en caja (turno abierto). Devuelve el ticket para imprimir.
  const processPOSSale = async (cart, paymentMethod, memberId, customerName) => {
    const venta = await api("/tienda/ventas", {
      method: "POST",
      body: {
        items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
        paymentMethod,
        memberId: memberId || null,
        customerName: customerName || null,
      },
    });
    refreshProducts();
    refreshTransactions();
    return {
      ...venta,
      amount: venta.total,
      relatedMemberName: venta.customer,
      date: venta.date,
    };
  };

  // =================================================================
  // CAJA (MySQL)
  // =================================================================
  // Muestra el movimiento al instante y lo guarda en la base.
  // Si la base lo rechaza, se retira de la pantalla y se avisa.
  const persistTransaction = (tx) => {
    const temporal = { ...tx, id: tx.id || `tmp-${Date.now()}` };
    setTransactions((prev) => [temporal, ...prev]);
    api("/caja", { method: "POST", body: tx })
      .then((guardado) =>
        setTransactions((prev) =>
          prev.map((t) => (t.id === temporal.id ? { ...guardado, items: tx.items } : t)),
        ),
      )
      .catch((e) => {
        setTransactions((prev) => prev.filter((t) => t.id !== temporal.id));
        alert(`No se pudo registrar en caja: ${e.message}`);
      });
    return temporal;
  };

  const addTransaction = (txData) => persistTransaction({ ...txData, id: undefined });

  const deleteTransaction = async (id) => {
    try {
      if (!String(id).startsWith("tmp-")) await api(`/caja/${id}`, { method: "DELETE" });
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  // Notification Rule Management
  const updateNotificationRule = (id, ruleData) => {
    setNotificationRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...ruleData } : r)),
    );
  };

  const toggleNotificationRule = (id) => {
    setNotificationRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    );
  };

  const addNotificationLog = (logData) => {
    const now = new Date();
    const timeStr = `${hoyISO()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const newLog = {
      ...logData,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: timeStr,
    };
    setNotificationLogs((prev) => [newLog, ...prev]);
  };

  const clearNotificationLogs = () => {
    setNotificationLogs([]);
  };

  // Real Web Push Trigger Simulation
  const triggerRealWebNotification = (title, body) => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification(title, {
            body,
            icon: "/icon.png",
          });
        } catch (e) {
          console.log("Push notification shown in container sandbox");
        }
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            try {
              new Notification(title, { body, icon: "/icon.png" });
            } catch (e) {
              console.log("Push notification granted");
            }
          }
        });
      }
    }
  };

  // Send Direct Notification
  const sendDirectNotification = (data) => {
    const now = new Date();
    const timeStr = `${hoyISO()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      recipientId: data.recipientId,
      recipientName: data.recipientName,
      recipientEmail: data.recipientEmail,
      recipientPhone: data.recipientPhone,
      category: data.category,
      channel: data.channel,
      title: data.title,
      message: data.message,
      timestamp: timeStr,
      status: "delivered",
      targetAudience: data.targetAudience,
    };

    setNotificationLogs((prev) => [newLog, ...prev]);

    if (data.channel === "push") {
      triggerRealWebNotification(data.title, data.message);
    }
  };

  // Send Campaign
  const sendManualCampaign = (campaign) => {
    let targetMembers = [];
    if (campaign.specificMemberIds && campaign.specificMemberIds.length > 0) {
      targetMembers = members.filter((m) =>
        campaign.specificMemberIds.includes(m.id),
      );
    } else if (campaign.targetAudience === "active") {
      targetMembers = members.filter(
        (m) => computeMemberStatus(m.membershipEndDate) === "active",
      );
    } else if (campaign.targetAudience === "expiring") {
      targetMembers = members.filter(
        (m) => computeMemberStatus(m.membershipEndDate) === "expiring_soon",
      );
    } else if (campaign.targetAudience === "expired") {
      targetMembers = members.filter(
        (m) => computeMemberStatus(m.membershipEndDate) === "expired",
      );
    } else {
      targetMembers = members;
    }

    const now = new Date();
    const timeStr = `${hoyISO()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const newLogs = [];

    targetMembers.forEach((member) => {
      campaign.channels.forEach((channel) => {
        // Interpolate variables
        let personalizedMsg = campaign.message
          .replace(/{{nombre}}/g, member.fullName)
          .replace(/{{plan}}/g, member.planName)
          .replace(/{{fecha_vencimiento}}/g, member.membershipEndDate)
          .replace(/{{telefono}}/g, member.phone)
          .replace(/{{email}}/g, member.email);

        newLogs.push({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          recipientId: member.id,
          recipientName: member.fullName,
          recipientEmail: member.email,
          recipientPhone: member.phone,
          category: campaign.category,
          channel,
          title: campaign.title.replace(
            /{{nombre}}/g,
            member.fullName.split(" ")[0],
          ),
          message: personalizedMsg,
          timestamp: timeStr,
          status: "delivered",
          targetAudience: campaign.targetAudience,
        });
      });
    });

    if (campaign.channels.includes("push")) {
      triggerRealWebNotification(
        campaign.title,
        campaign.message.replace(/{{nombre}}/g, "Socio"),
      );
    }

    setNotificationLogs((prev) => [...newLogs, ...prev]);
    return targetMembers.length;
  };

  // Class notices management
  const addClassNotice = (classData) => {
    const newClass = {
      ...classData,
      id: `class-${Date.now()}`,
    };
    setClasses((prev) => [newClass, ...prev]);
  };

  const deleteClassNotice = (id) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
  };

  // Computed Renewal Alerts
  const renewalAlerts = useMemo(() => {
    const today = new Date(hoyISO());
    const alerts = [];

    members.forEach((member) => {
      const end = new Date(member.membershipEndDate);
      const diffTime = end.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Show alerts for expired OR expiring within 7 days
      if (daysLeft <= 7) {
        alerts.push({
          memberId: member.id,
          memberName: member.fullName,
          phone: member.phone,
          email: member.email,
          planName: member.planName,
          endDate: member.membershipEndDate,
          daysLeft,
          isExpired: daysLeft < 0,
        });
      }
    });

    // Sort by most urgent (expired first, then closest days)
    return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [members]);

  // Low stock products
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStockAlert);
  }, [products]);

  // Financial Metrics
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let posSalesTotal = 0;
    let membershipsRevenue = 0;

    transactions.forEach((t) => {
      if (t.type === "income") {
        totalIncome += t.amount;
        if (t.category === "pos_sale") posSalesTotal += t.amount;
        if (t.category === "membership") membershipsRevenue += t.amount;
      } else if (t.type === "expense") {
        totalExpense += t.amount;
      }
    });

    const activeMembers = members.filter(
      (m) => computeMemberStatus(m.membershipEndDate) === "active",
    );
    const expiringMembers = members.filter(
      (m) => computeMemberStatus(m.membershipEndDate) === "expiring_soon",
    );
    const expiredMembers = members.filter(
      (m) => computeMemberStatus(m.membershipEndDate) === "expired",
    );
    const activeNotificationRulesCount = notificationRules.filter(
      (r) => r.enabled,
    ).length;

    return {
      totalActiveMembers: activeMembers.length,
      expiringMembersCount: expiringMembers.length,
      expiredMembersCount: expiredMembers.length,
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      posSalesTotal,
      membershipsRevenue,
      activeNotificationRulesCount,
      totalSentNotifications: notificationLogs.length,
    };
  }, [members, transactions, notificationRules, notificationLogs]);

  // WhatsApp reminder message builder
  const generateWhatsAppLink = (member, customNote) => {
    const today = new Date(hoyISO());
    const end = new Date(member.membershipEndDate);
    const diffTime = end.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let cleanPhone = member.phone.replace(/[^0-9]/g, "");
    if (!cleanPhone.startsWith("51") && cleanPhone.length === 9) {
      cleanPhone = "51" + cleanPhone; // Peru country code default if 9 digits
    }

    let message = "";
    if (daysLeft < 0) {
      message = `¡Hola ${member.fullName.split(" ")[0]}! 💪 Te saludamos de RADICAL. Te recordamos que tu membresía (${member.planName}) venció el ${member.membershipEndDate}. ¡Renueva hoy mismo y no pierdas tu progreso en el entrenamiento! Consulta por nuestras promociones exclusivas. ${customNote ? `\n\nNota: ${customNote}` : ""}`;
    } else if (daysLeft === 0) {
      message = `¡Hola ${member.fullName.split(" ")[0]}! 🏋️‍♂️ Te saludamos de RADICAL. Te informamos que tu membresía (${member.planName}) vence HOY ${member.membershipEndDate}. Puedes renovar en recepción o por transferencia/Yape. ¡Te esperamos para entrenar! ${customNote ? `\n\nNota: ${customNote}` : ""}`;
    } else {
      message = `¡Hola ${member.fullName.split(" ")[0]}! ⚡ Te saludamos de RADICAL. Te informamos que a tu membresía (${member.planName}) le quedan ${daysLeft} días de vigencia (vence el ${member.membershipEndDate}). ¡Aprovecha para renovar con anticipación y seguir alcanzando tus metas! ${customNote ? `\n\nNota: ${customNote}` : ""}`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // --- NUTRITION ACTIONS ---
  const addNutritionPlan = (planData) => {
    const newPlan = {
      ...planData,
      id: `nutri-${Date.now()}`,
      createdDate: hoyISO(),
    };
    setNutritionPlans((prev) => [newPlan, ...prev]);
  };

  const updateNutritionPlan = (id, planData) => {
    setNutritionPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...planData } : p)),
    );
  };

  const deleteNutritionPlan = (id) => {
    setNutritionPlans((prev) => prev.filter((p) => p.id !== id));
  };

  // --- BODY ASSESSMENTS (ANTHROPOMETRY & BIOIMPEDANCE) ACTIONS ---
  const addBodyAssessment = (assessmentData) => {
    const newAssessment = {
      ...assessmentData,
      id: `eval-${Date.now()}`,
    };
    setBodyAssessments((prev) => [...prev, newAssessment]);
  };

  const updateBodyAssessment = (id, assessmentData) => {
    setBodyAssessments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...assessmentData } : a)),
    );
  };

  const deleteBodyAssessment = (id) => {
    setBodyAssessments((prev) => prev.filter((a) => a.id !== id));
  };

  const getAssessmentsByMemberId = (memberId) => {
    return bodyAssessments
      .filter((a) => a.memberId === memberId)
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // --- USER AUTHENTICATION & PROFILES ---
  // Inicia sesión contra MySQL (la API verifica la clave con bcrypt)
  const login = async (username, password) => {
    try {
      const { token, usuario } = await api("/auth/ingresar", {
        method: "POST",
        body: { usuario: username, clave: password },
      });
      guardarToken(token);
      setCurrentUser(usuario);
      return { success: true, user: usuario };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  const logout = async () => {
    try {
      await api("/auth/salir", { method: "POST" });
    } catch (e) {
      /* si la sesión ya no existe, igual se limpia */
    }
    limpiarSesion();
  };

  const changePassword = async (actual, nueva) => {
    await api("/auth/clave", { method: "PUT", body: { actual, nueva } });
    setCurrentUser((u) => (u ? { ...u, mustChangePassword: false } : u));
  };

  // --- ATTENDANCE SYSTEM ACTIONS ---
  const recordAttendance = (data) => {
    const now = new Date();
    const dateStr = hoyISO();
    const timeStr = now.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const newRecord = {
      ...data,
      id: `att-${Date.now()}`,
      date: data.date || dateStr,
      time: data.time || timeStr,
    };

    setAttendances((prev) => [newRecord, ...prev]);

    return {
      success: true,
      record: newRecord,
      message: `¡Asistencia registrada para ${data.userName}!`,
    };
  };

  const deleteAttendance = (id) => {
    setAttendances((prev) => prev.filter((a) => a.id !== id));
  };

  // --- STAFF CONTRACT ACTIONS ---
  const addStaffContract = (contractData) => {
    const newContract = {
      ...contractData,
      id: `cnt-${Date.now()}`,
    };
    setStaffContracts((prev) => [newContract, ...prev]);

    // Also auto-create initial payroll entry
    const newPayroll = {
      id: `pyr-${Date.now()}`,
      contractId: newContract.id,
      staffName: newContract.fullName,
      role: newContract.role,
      department: newContract.department,
      month: mesActual(),
      baseSalary: newContract.monthlySalary,
      workedHours: newContract.workedHoursThisMonth || 0,
      hourlyRate: newContract.hourlyRate,
      bonusAmount: 0,
      deductions: 0,
      netPay: newContract.monthlySalary,
      status: "pending",
      receiptNumber: `REC-RH-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setPayrollEntries((prev) => [newPayroll, ...prev]);
  };

  const updateStaffContract = (id, contractData) => {
    setStaffContracts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...contractData } : c)),
    );
  };

  const renewStaffContract = (id, duration, newSalary) => {
    setStaffContracts((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const today = new Date(hoyISO());
        const monthsToAdd =
          duration === "3_months" ? 3 : duration === "6_months" ? 6 : 12;
        const newEnd = new Date(today);
        newEnd.setMonth(newEnd.getMonth() + monthsToAdd);
        const label =
          duration === "3_months"
            ? "Contrato 3 Meses"
            : duration === "6_months"
              ? "Contrato 6 Meses"
              : "Contrato 1 Año";
        const salary = newSalary || c.monthlySalary;
        return {
          ...c,
          contractType: duration,
          contractDurationLabel: label,
          startDate: today.toISOString().split("T")[0],
          endDate: newEnd.toISOString().split("T")[0],
          status: "active",
          monthlySalary: salary,
          paymentStatus: "al_dia",
        };
      }),
    );
  };

  const deleteStaffContract = (id) => {
    setStaffContracts((prev) => prev.filter((c) => c.id !== id));
  };

  // --- PHYSIOTHERAPY CLINICAL ACTIONS ---
  const addPhysioRecord = (recordData) => {
    const existingCount = physioRecords.filter(
      (r) => r.memberId === recordData.memberId,
    ).length;
    const newRecord = {
      ...recordData,
      id: `phy-rec-${Date.now()}`,
      sessionNumber: existingCount + 1,
    };
    setPhysioRecords((prev) => [newRecord, ...prev]);
  };

  const updatePhysioRecord = (id, recordData) => {
    setPhysioRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...recordData } : r)),
    );
  };

  const deletePhysioRecord = (id) => {
    setPhysioRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const getPhysioRecordsByMemberId = (memberId) => {
    return physioRecords
      .filter((r) => r.memberId === memberId)
      .sort((a, b) => b.sessionNumber - a.sessionNumber);
  };

  const addPhysioTemplate = (templateData) => {
    const newTemplate = {
      ...templateData,
      id: `tpl-${Date.now()}`,
      isCustom: true,
    };
    setPhysioTemplates((prev) => [newTemplate, ...prev]);
    return newTemplate;
  };

  const deletePhysioTemplate = (id) => {
    setPhysioTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  // --- APPOINTMENT ACTIONS (NUTRICIÓN & FISIOTERAPIA) ---
  const addAppointment = (appointmentData) => {
    const newAppointment = {
      ...appointmentData,
      id: `apt-${Date.now()}`,
    };
    setAppointments((prev) => [newAppointment, ...prev]);
  };

  const updateAppointmentStatus = (id, status) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );
  };

  const deleteAppointment = (id) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  // --- PAYROLL & SALARIES ACTIONS ---
  const addPayrollEntry = (entryData) => {
    const newEntry = {
      ...entryData,
      id: `pyr-${Date.now()}`,
    };
    setPayrollEntries((prev) => [newEntry, ...prev]);
  };

  const payStaffSalary = (payrollId, paymentMethod, receiptNumber) => {
    const item = payrollEntries.find((p) => p.id === payrollId);
    if (!item) return;

    const receipt =
      receiptNumber || `REC-RH-${Math.floor(1000 + Math.random() * 9000)}`;
    const txId = `tx-sal-${Date.now()}`;
    const todayStr = hoyISO();

    // 1. Create transaction in Finance
    const newTx = {
      id: txId,
      type: "expense",
      category: "salary",
      amount: item.netPay,
      date: todayStr,
      paymentMethod,
      description: `Pago de Sueldo/Nómina: ${item.staffName} (${item.department} - ${item.month})`,
      receiptNumber: receipt,
    };
    persistTransaction(newTx);

    // 2. Mark payroll entry as paid
    setPayrollEntries((prev) =>
      prev.map((p) =>
        p.id === payrollId
          ? {
              ...p,
              status: "paid",
              paymentDate: todayStr,
              paymentMethod,
              transactionId: txId,
              receiptNumber: receipt,
            }
          : p,
      ),
    );

    // 3. Mark contract paymentStatus as al_dia
    setStaffContracts((prev) =>
      prev.map((c) =>
        c.id === item.contractId
          ? {
              ...c,
              paymentStatus: "al_dia",
              lastPaymentDate: todayStr,
            }
          : c,
      ),
    );
  };

  // Borra solo copias antiguas guardadas en el navegador (no toca MySQL)
  const resetToDefaults = () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem(STORAGE_KEYS.ROUTINES + "_asignaciones");
  };

  // Export JSON backup
  const exportDataJSON = () => {
    const backup = {
      version: "1.3",
      exportDate: new Date().toISOString(),
      members,
      plans,
      trainers,
      exercises,
      routines,
      products,
      transactions,
      notificationRules,
      notificationLogs,
      classes,
      nutritionPlans,
      bodyAssessments,
      attendances,
      staffContracts,
      physioRecords,
      appointments,
      payrollEntries,
    };
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `radicalgym_backup_${hoyISO()}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON backup
  const importDataJSON = (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.exercises) setExercises(data.exercises);
      if (data.routines) setRoutines(data.routines);
      if (data.notificationRules) setNotificationRules(data.notificationRules);
      if (data.notificationLogs) setNotificationLogs(data.notificationLogs);
      if (data.classes) setClasses(data.classes);
      if (data.nutritionPlans) setNutritionPlans(data.nutritionPlans);
      if (data.bodyAssessments) setBodyAssessments(data.bodyAssessments);
      if (data.attendances) setAttendances(data.attendances);
      if (data.staffContracts) setStaffContracts(data.staffContracts);
      if (data.physioRecords) setPhysioRecords(data.physioRecords);
      if (data.appointments) setAppointments(data.appointments);
      if (data.payrollEntries) setPayrollEntries(data.payrollEntries);
      return true;
    } catch (e) {
      console.error("Error importing backup JSON", e);
      return false;
    }
  };

  return (
    <GymContext.Provider
      value={{
        members: membersView,
        staffDirectory,
        cashShift,
        refreshCashShift,
        gymConfig,
        saveGymConfig,
        payMemberDebt,
        freezeMember,
        foods,
        saveFood,
        hideFood,
        closeFreeze,
        setDebtDueDate,
        refreshTransactions,
        plans,
        trainers,
        exercises,
        routines,
        products,
        transactions,
        notificationRules,
        notificationLogs,
        classes,
        nutritionPlans,
        bodyAssessments,
        currentUser,
        authChecked,
        dataLoading,
        loadServerData,
        changePassword,
        attendances,
        staffContracts: contratosNormalizados,
        physioRecords,
        physioTemplates,
        appointments,
        payrollEntries,
        addStaffContract,
        updateStaffContract,
        renewStaffContract,
        deleteStaffContract,
        addPhysioRecord,
        updatePhysioRecord,
        deletePhysioRecord,
        getPhysioRecordsByMemberId,
        addPhysioTemplate,
        deletePhysioTemplate,
        addAppointment,
        updateAppointmentStatus,
        deleteAppointment,
        addPayrollEntry,
        payStaffSalary,
        login,
        logout,
        recordAttendance,
        deleteAttendance,
        addMember,
        updateMember,
        deleteMember,
        resetStudentAccess,
        renewMembership,
        assignTrainerToMember,
        assignRoutineToMember,
        addPlan,
        updatePlan,
        deletePlan,
        addTrainer,
        updateTrainer,
        deleteTrainer,
        addExercise,
        updateExercise,
        deleteExercise,
        addRoutine,
        updateRoutine,
        deleteRoutine,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        moveStock,
        refreshProducts,
        processPOSSale,
        addTransaction,
        deleteTransaction,
        updateNotificationRule,
        toggleNotificationRule,
        addNotificationLog,
        sendDirectNotification,
        sendManualCampaign,
        triggerRealWebNotification,
        clearNotificationLogs,
        addClassNotice,
        deleteClassNotice,
        addNutritionPlan,
        updateNutritionPlan,
        deleteNutritionPlan,
        addBodyAssessment,
        updateBodyAssessment,
        deleteBodyAssessment,
        getAssessmentsByMemberId,
        renewalAlerts,
        lowStockProducts,
        metrics,
        getMemberById,
        getTrainerById,
        getRoutineById,
        getPlanById,
        getProductById,
        generateWhatsAppLink,
        resetToDefaults,
        exportDataJSON,
        importDataJSON,
      }}
    >
      {children}
    </GymContext.Provider>
  );
};

export const useGym = () => {
  const context = useContext(GymContext);
  if (!context) {
    throw new Error("useGym must be used within a GymProvider");
  }
  return context;
};
