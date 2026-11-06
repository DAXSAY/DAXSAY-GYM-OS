// Cliente de la API de RADICAL (servidor/index.js)
const CLAVE_TOKEN = "radicalgym_token";

export const obtenerToken = () => {
  try {
    return localStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
};

export const guardarToken = (token) => {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  } catch {
    /* sin almacenamiento disponible */
  }
};

// Se ejecuta cuando la API responde 401 (sesión vencida o cerrada)
let alExpirarSesion = () => {};
export const alPerderSesion = (fn) => {
  alExpirarSesion = fn;
};

export async function api(ruta, { method = "GET", body } = {}) {
  const token = obtenerToken();
  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Verifica que la API esté encendida (npm run dev).");
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    /* respuesta sin JSON */
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401 && ruta !== "/auth/ingresar") alExpirarSesion();
    if (respuesta.status === 502 || respuesta.status === 504) {
      throw new Error("La API no responde. Verifica que esté encendida (npm run dev).");
    }
    throw new Error(datos?.error || `Error ${respuesta.status}`);
  }
  return datos;
}
