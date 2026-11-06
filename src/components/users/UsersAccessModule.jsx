// ============================================================
// USUARIOS & ACCESOS (solo administración)
// Una cuenta por persona: cada recepcionista, entrenador, etc. entra
// con su propio usuario, así la caja por turnos sabe quién abrió y
// quién cerró. Las cuentas de alumnos se crean desde su ficha.
// ============================================================
import React, { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  UserPlus,
  ArrowLeft,
  KeyRound,
  Power,
  Search,
  Copy,
  CheckCircle2,
  Pencil,
  Share2,
} from "lucide-react";
import { useGym } from "../../context/GymContext";
import { api } from "../../api/cliente";
import { userCan, ROLES } from "../../config/roles";

const ROLES_PERSONAL = ["admin", "reception", "trainer", "physio", "nutritionist"];
const COLOR_ROL = {
  admin: "bg-purple-100 text-purple-700",
  reception: "bg-amber-100 text-amber-700",
  trainer: "bg-blue-100 text-blue-700",
  physio: "bg-cyan-100 text-cyan-700",
  nutritionist: "bg-emerald-100 text-emerald-700",
};
const fecha = (dt) => (dt ? `${String(dt).slice(8, 10)}/${String(dt).slice(5, 7)}/${String(dt).slice(0, 4)} ${String(dt).slice(11, 16)}` : "Nunca");
const sugerirUsuario = (n, a) =>
  `${n.trim().split(/\s+/)[0] || ""}${a.trim() ? "." + a.trim().split(/\s+/)[0] : ""}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");

const Pantalla = ({ titulo, subtitulo, onVolver, children }) => (
  <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
    <div className="w-full max-w-3xl mx-auto min-h-full p-4 sm:p-6 space-y-5">
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
      {children}
    </div>
  </div>
);

// Tarjeta con las credenciales para entregar al trabajador
const Credenciales = ({ datos, onListo }) => {
  const [copiado, setCopiado] = useState(false);
  const texto = `RADICAL - tu acceso al sistema\nUsuario: ${datos.usuario}\nContraseña temporal: ${datos.clave}\nAl ingresar el sistema te pedirá cambiarla.`;
  return (
    <Pantalla titulo="Credenciales listas" subtitulo="Entrégalas a la persona. Por seguridad no se volverán a mostrar." onVolver={onListo}>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          <div>
            <h3 className="font-black text-slate-900">{datos.nombre}</h3>
            <p className="text-sm text-slate-500">{datos.rol}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase block">Usuario</span>
            <strong className="text-xl font-mono">{datos.usuario}</strong>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase block">Contraseña temporal</span>
            <strong className="text-xl font-mono">{datos.clave}</strong>
          </div>
        </div>
        <p className="text-sm text-slate-500">En su primer ingreso el sistema le pedirá crear una contraseña propia.</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(texto);
              setCopiado(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-4 h-4" /> {copiado ? "Copiado" : "Copiar"}
          </button>
          {datos.telefono && (
            <a
              href={`https://wa.me/51${datos.telefono.replace(/\D/g, "").slice(-9)}?text=${encodeURIComponent(texto)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" /> Enviar por WhatsApp
            </a>
          )}
          <button onClick={onListo} className="ml-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm cursor-pointer">
            Listo
          </button>
        </div>
      </div>
    </Pantalla>
  );
};

// Formulario de alta / edición
const FormUsuario = ({ usuario, onVolver, onGuardado, esUnoMismo }) => {
  const editar = !!usuario;
  const [f, setF] = useState({
    nombres: usuario?.firstName || "",
    apellidos: usuario?.lastName || "",
    dni: usuario?.dni || "",
    telefono: usuario?.phone || "",
    correo: usuario?.email || "",
    titulo: usuario?.title || "",
    rol: usuario?.role || "reception",
    usuario: usuario?.username || "",
    clave: "",
    turnoRecepcion: usuario?.receptionShiftId || "",
    especialidad: usuario?.specialty || "",
    horario: usuario?.schedule || "",
    colegiatura: usuario?.license || "",
    biografia: usuario?.bio || "",
  });
  const [turnos, setTurnos] = useState([]);
  useEffect(() => {
    api("/metas/turnos-recepcion").then(setTurnos).catch(() => setTurnos([]));
  }, []);
  const [usuarioTocado, setUsuarioTocado] = useState(editar);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const cambiar = (k) => (e) => {
    const v = e.target.value;
    setF((p) => {
      const n = { ...p, [k]: v };
      if (!usuarioTocado && (k === "nombres" || k === "apellidos")) n.usuario = sugerirUsuario(n.nombres, n.apellidos);
      return n;
    });
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      if (editar) {
        await api(`/usuarios/${usuario.id}`, { method: "PUT", body: f });
        onGuardado(null);
      } else {
        const r = await api("/usuarios", { method: "POST", body: f });
        onGuardado({
          nombre: r.fullName,
          rol: ROLES[r.role]?.label || r.roleName,
          usuario: r.username,
          clave: r.claveTemporal,
          telefono: f.telefono,
        });
      }
    } catch (er) {
      setError(er.message);
    } finally {
      setEnviando(false);
    }
  };

  const campo = "mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <Pantalla
      titulo={editar ? `Editar a ${usuario.fullName}` : "Nuevo usuario del personal"}
      subtitulo="Cada trabajador debe tener su propia cuenta (por ejemplo, una por recepcionista y turno)."
      onVolver={onVolver}
    >
      <form onSubmit={guardar} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Nombres *</span>
            <input required value={f.nombres} onChange={cambiar("nombres")} className={campo} />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Apellidos *</span>
            <input required value={f.apellidos} onChange={cambiar("apellidos")} className={campo} />
          </label>
          {!editar && (
            <label className="block">
              <span className="text-sm font-bold text-slate-700">DNI</span>
              <input value={f.dni} onChange={cambiar("dni")} maxLength={8} inputMode="numeric" className={campo} />
            </label>
          )}
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Celular *</span>
            <input required value={f.telefono} onChange={cambiar("telefono")} className={campo} />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Correo</span>
            <input type="email" value={f.correo} onChange={cambiar("correo")} className={campo} />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Cargo visible (opcional)</span>
            <input value={f.titulo} onChange={cambiar("titulo")} placeholder="Ej. Recepción turno mañana" className={campo} />
          </label>
        </div>

        <div>
          <span className="text-sm font-bold text-slate-700">Área / rol *</span>
          <div className="mt-1 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ROLES_PERSONAL.map((r) => (
              <button
                type="button"
                key={r}
                disabled={esUnoMismo}
                onClick={() => setF({ ...f, rol: r })}
                className={`p-2.5 rounded-xl border text-sm font-bold cursor-pointer disabled:cursor-not-allowed ${
                  f.rol === r ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"
                }`}
              >
                {ROLES[r]?.label || r}
              </button>
            ))}
          </div>
        </div>

        {f.rol === "reception" && (
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Turno de recepción (para sus metas) *</span>
            <select required value={f.turnoRecepcion} onChange={cambiar("turnoRecepcion")} className={campo}>
              <option value="">Elegir turno…</option>
              {turnos.filter((t) => t.active).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.start && `(${t.start} - ${t.end})`}
                </option>
              ))}
            </select>
          </label>
        )}
        {["trainer", "physio", "nutritionist"].includes(f.rol) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Especialidad</span>
              <input value={f.especialidad} onChange={cambiar("especialidad")} placeholder="Ej. Hipertrofia y fuerza" className={campo} />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Horario de atención</span>
              <input value={f.horario} onChange={cambiar("horario")} placeholder="Ej. Lun a Sáb 6:00 - 14:00" className={campo} />
            </label>
            {f.rol !== "trainer" && (
              <label className="block">
                <span className="text-sm font-bold text-slate-700">N° de colegiatura</span>
                <input value={f.colegiatura} onChange={cambiar("colegiatura")} className={campo} />
              </label>
            )}
            <label className="block sm:col-span-2">
              <span className="text-sm font-bold text-slate-700">Presentación (la ven los alumnos)</span>
              <textarea rows={2} value={f.biografia} onChange={cambiar("biografia")} className={campo} />
            </label>
          </div>
        )}

        {!editar && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Usuario para ingresar *</span>
              <input
                required
                value={f.usuario}
                onChange={(e) => {
                  setUsuarioTocado(true);
                  setF({ ...f, usuario: e.target.value.toLowerCase() });
                }}
                className={`${campo} font-mono`}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Contraseña temporal</span>
              <input value={f.clave} onChange={cambiar("clave")} placeholder="Vacío = se genera una segura" className={`${campo} font-mono`} />
            </label>
          </div>
        )}

        {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
        <button disabled={enviando} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black cursor-pointer">
          {enviando ? "Guardando…" : editar ? "Guardar cambios" : "Crear usuario"}
        </button>
      </form>
    </Pantalla>
  );
};

// ------------------------------------------------------------
// Configuración del gimnasio
// ------------------------------------------------------------
const ConfiguracionGimnasio = () => {
  const { gymConfig, saveGymConfig } = useGym();
  const [f, setF] = useState({
    gym_nombre: gymConfig.gym_nombre || "",
    gym_whatsapp: gymConfig.gym_whatsapp || "",
    admin_whatsapp: gymConfig.admin_whatsapp || "",
    gym_direccion: gymConfig.gym_direccion || "",
    gym_ruc: gymConfig.gym_ruc || "",
  });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const campo = "mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm";
  const guardar = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      await saveGymConfig(f);
      setMsg("Configuración guardada.");
    } catch (er) {
      setError(er.message);
    }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={guardar} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 max-w-3xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block"><span className="text-sm font-bold text-slate-700">Nombre del gimnasio</span><input value={f.gym_nombre} onChange={set("gym_nombre")} className={campo} /></label>
        <label className="block"><span className="text-sm font-bold text-slate-700">RUC</span><input value={f.gym_ruc} onChange={set("gym_ruc")} className={campo} /></label>
        <label className="block sm:col-span-2"><span className="text-sm font-bold text-slate-700">Dirección</span><input value={f.gym_direccion} onChange={set("gym_direccion")} className={campo} /></label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">WhatsApp de recepción</span>
          <input value={f.gym_whatsapp} onChange={set("gym_whatsapp")} placeholder="9XX XXX XXX" className={campo} />
          <span className="text-xs text-slate-500">Los alumnos escriben aquí desde su portal.</span>
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">WhatsApp del administrador / dueño</span>
          <input value={f.admin_whatsapp} onChange={set("admin_whatsapp")} placeholder="9XX XXX XXX" className={campo} />
          <span className="text-xs text-slate-500">A este número se envían los reportes.</span>
        </label>
      </div>
      {msg && <p className="text-sm font-bold text-emerald-700">{msg}</p>}
      {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
      <button className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer">Guardar configuración</button>
    </form>
  );
};

// ------------------------------------------------------------
// Turnos fijos de recepción
// ------------------------------------------------------------
const TurnosRecepcion = () => {
  const [turnos, setTurnos] = useState([]);
  const [nuevo, setNuevo] = useState({ name: "", start: "", end: "" });
  const [error, setError] = useState("");
  const cargar = () => api("/metas/turnos-recepcion").then(setTurnos).catch((e) => setError(e.message));
  useEffect(() => {
    cargar();
  }, []);
  const guardar = async (t) => {
    setError("");
    try {
      await api(`/metas/turnos-recepcion/${t.id}`, { method: "PUT", body: t });
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };
  const crear = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api("/metas/turnos-recepcion", { method: "POST", body: nuevo });
      setNuevo({ name: "", start: "", end: "" });
      cargar();
    } catch (er) {
      setError(er.message);
    }
  };
  const campo = "px-2 py-1.5 rounded-lg border border-slate-300 text-sm";
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 max-w-4xl">
      <p className="text-sm text-slate-600">
        Cada recepcionista pertenece a un turno (se elige en su usuario). Las metas de recepción se asignan por turno y suman
        todo lo cobrado en las cajas que abren las personas de ese turno.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-200">
            <th className="py-2 pr-2">Turno</th>
            <th className="py-2 pr-2">Desde</th>
            <th className="py-2 pr-2">Hasta</th>
            <th className="py-2 pr-2">Personas</th>
            <th className="py-2 pr-2">Activo</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {turnos.map((t, i) => (
            <tr key={t.id} className="border-b border-slate-100">
              <td className="py-2 pr-2"><input value={t.name} onChange={(e) => setTurnos(turnos.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className={`${campo} w-full`} /></td>
              <td className="py-2 pr-2"><input type="time" value={t.start} onChange={(e) => setTurnos(turnos.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} className={campo} /></td>
              <td className="py-2 pr-2"><input type="time" value={t.end} onChange={(e) => setTurnos(turnos.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} className={campo} /></td>
              <td className="py-2 pr-2 text-slate-600">{t.people.map((p) => p.name).join(", ") || "—"}</td>
              <td className="py-2 pr-2"><input type="checkbox" checked={t.active} onChange={(e) => setTurnos(turnos.map((x, j) => (j === i ? { ...x, active: e.target.checked } : x)))} /></td>
              <td className="py-2 text-right"><button onClick={() => guardar(turnos[i])} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer">Guardar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={crear} className="flex flex-wrap items-end gap-2 pt-2 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-600">Nuevo turno<input required value={nuevo.name} onChange={(e) => setNuevo({ ...nuevo, name: e.target.value })} placeholder="Turno 3 - Noche" className={`${campo} block mt-0.5`} /></label>
        <label className="text-xs font-bold text-slate-600">Desde<input type="time" value={nuevo.start} onChange={(e) => setNuevo({ ...nuevo, start: e.target.value })} className={`${campo} block mt-0.5`} /></label>
        <label className="text-xs font-bold text-slate-600">Hasta<input type="time" value={nuevo.end} onChange={(e) => setNuevo({ ...nuevo, end: e.target.value })} className={`${campo} block mt-0.5`} /></label>
        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold cursor-pointer">Agregar turno</button>
      </form>
      {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
    </div>
  );
};

export const UsersAccessModule = () => {
  const { currentUser } = useGym();
  const [pestana, setPestana] = useState("usuarios");
  const [datos, setDatos] = useState({ usuarios: [], cuentasAlumnos: { total: 0, activas: 0 } });
  const [buscar, setBuscar] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [vista, setVista] = useState(null); // nuevo | {editar} | {credenciales}
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const puedeCrear = userCan(currentUser, "users", "crear");
  const puedeEditar = userCan(currentUser, "users", "editar");

  const cargar = () =>
    api("/usuarios")
      .then(setDatos)
      .catch((e) => setError(e.message));
  useEffect(() => {
    cargar();
  }, []);

  const lista = useMemo(
    () =>
      datos.usuarios.filter(
        (u) =>
          (filtroRol === "todos" || u.role === filtroRol) &&
          `${u.fullName} ${u.username} ${u.dni}`.toLowerCase().includes(buscar.toLowerCase()),
      ),
    [datos, buscar, filtroRol],
  );

  const accion = async (fn, ok) => {
    setError("");
    try {
      const r = await fn();
      if (ok) setMensaje(ok);
      await cargar();
      return r;
    } catch (e) {
      setError(e.message);
    }
  };

  const restablecer = async (u) => {
    if (!window.confirm(`¿Restablecer la contraseña de ${u.fullName}? Se cerrarán sus sesiones abiertas.`)) return;
    const r = await accion(() => api(`/usuarios/${u.id}/clave`, { method: "POST", body: {} }));
    if (r) setVista({ credenciales: { nombre: u.fullName, rol: ROLES[u.role]?.label, usuario: r.usuario, clave: r.claveTemporal, telefono: u.phone } });
  };

  if (vista === "nuevo" || vista?.editar)
    return (
      <FormUsuario
        usuario={vista?.editar}
        esUnoMismo={vista?.editar?.id === String(currentUser?.id)}
        onVolver={() => setVista(null)}
        onGuardado={(cred) => {
          cargar();
          setVista(cred ? { credenciales: cred } : null);
          if (!cred) setMensaje("Datos actualizados.");
        }}
      />
    );
  if (vista?.credenciales) return <Credenciales datos={vista.credenciales} onListo={() => setVista(null)} />;

  const porRol = (r) => datos.usuarios.filter((u) => u.role === r && u.active).length;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 rounded-3xl p-6 text-white shadow-lg flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-purple-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Seguridad
          </span>
          <h1 className="text-2xl font-black mt-1">Usuarios & Accesos</h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Crea una cuenta para cada trabajador. Así cada recepcionista abre y cierra su propia caja y queda registrado quién hizo
            cada cobro.
          </p>
        </div>
        {puedeCrear && (
          <button
            onClick={() => setVista("nuevo")}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-black text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Nuevo usuario
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ROLES_PERSONAL.map((r) => (
          <button
            key={r}
            onClick={() => setFiltroRol(filtroRol === r ? "todos" : r)}
            className={`text-left bg-white rounded-2xl border p-4 cursor-pointer ${filtroRol === r ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200"}`}
          >
            <span className="text-xs font-bold text-slate-400 uppercase block">{ROLES[r]?.label}</span>
            <span className="text-xl font-black text-slate-900">{porRol(r)}</span>
            <span className="text-xs text-slate-500 block">activos</span>
          </button>
        ))}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <span className="text-xs font-bold text-slate-400 uppercase block">Alumnos con acceso</span>
          <span className="text-xl font-black text-slate-900">{datos.cuentasAlumnos.activas}</span>
          <span className="text-xs text-slate-500 block">se gestionan en su ficha</span>
        </div>
      </div>

      <div className="flex gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 w-fit">
        {[["usuarios", "Usuarios"], ["turnos", "Turnos de recepción"], ["config", "Configuración del gimnasio"]].map(([k, l]) => (
          <button key={k} onClick={() => setPestana(k)} className={`px-3 py-2 rounded-lg text-sm font-bold cursor-pointer ${pestana === k ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
            {l}
          </button>
        ))}
      </div>
      {pestana === "config" && <ConfiguracionGimnasio />}
      {pestana === "turnos" && <TurnosRecepcion />}
      {pestana === "usuarios" && <>
      {mensaje && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">{mensaje}</div>}
      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por nombre, usuario o DNI…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-200">
                <th className="py-2 pr-3">Trabajador</th>
                <th className="py-2 pr-3">Usuario</th>
                <th className="py-2 pr-3">Área</th>
                <th className="py-2 pr-3">Último ingreso</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((u) => {
                const yo = u.id === String(currentUser?.id);
                return (
                  <tr key={u.id} className={`border-b border-slate-100 ${u.active ? "" : "opacity-60"}`}>
                    <td className="py-3 pr-3">
                      <strong className="text-slate-900 block">{u.fullName}{yo && <span className="text-xs text-blue-600"> (tú)</span>}</strong>
                      <span className="text-xs text-slate-500">{[u.title, u.dni && `DNI ${u.dni}`, u.phone].filter(Boolean).join(" · ") || "—"}</span>
                    </td>
                    <td className="py-3 pr-3 font-mono text-slate-700">{u.username}</td>
                    <td className="py-3 pr-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-black ${COLOR_ROL[u.role] || "bg-slate-100 text-slate-600"}`}>
                        {ROLES[u.role]?.label || u.roleName}
                      </span>
                      {u.receptionShift && <span className="block text-xs text-slate-500 mt-0.5">{u.receptionShift}</span>}
                    </td>
                    <td className="py-3 pr-3 text-slate-500">{fecha(u.lastAccess)}</td>
                    <td className="py-3 pr-3">
                      {!u.active ? (
                        <span className="text-xs font-black text-slate-500">Desactivado</span>
                      ) : u.locked ? (
                        <span className="text-xs font-black text-rose-600">Bloqueado temporalmente</span>
                      ) : u.mustChangePassword ? (
                        <span className="text-xs font-black text-amber-600">Clave temporal</span>
                      ) : (
                        <span className="text-xs font-black text-emerald-600">Activo</span>
                      )}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      {puedeEditar && (
                        <div className="inline-flex gap-1">
                          <button onClick={() => setVista({ editar: u })} title="Editar" className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                            <Pencil className="w-4 h-4 text-slate-600" />
                          </button>
                          <button onClick={() => restablecer(u)} title="Restablecer contraseña" className="p-2 rounded-lg hover:bg-amber-50 cursor-pointer">
                            <KeyRound className="w-4 h-4 text-amber-600" />
                          </button>
                          {!yo && (
                            <button
                              onClick={() =>
                                accion(
                                  () => api(`/usuarios/${u.id}`, { method: "PUT", body: { activo: !u.active } }),
                                  u.active ? `${u.fullName} ya no puede ingresar.` : `${u.fullName} puede volver a ingresar.`,
                                )
                              }
                              title={u.active ? "Desactivar" : "Activar"}
                              className={`p-2 rounded-lg cursor-pointer ${u.active ? "hover:bg-rose-50" : "hover:bg-emerald-50"}`}
                            >
                              <Power className={`w-4 h-4 ${u.active ? "text-rose-600" : "text-emerald-600"}`} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No hay usuarios con ese filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>}
    </div>
  );
};
