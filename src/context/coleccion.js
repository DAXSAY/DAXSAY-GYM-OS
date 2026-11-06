// Colecciones sincronizadas con MySQL (tabla registros_app)
// Cada cambio en la lista se envía solo a la API: lo nuevo o modificado
// con PUT y lo borrado con DELETE. Así no se pierde nada al cerrar el
// navegador y todos los equipos ven la misma información.
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/cliente";

export const avisar = (tipo, mensaje) => {
  try {
    window.dispatchEvent(new CustomEvent("radicalgym:aviso", { detail: { tipo, mensaje } }));
  } catch {
    /* sin ventana */
  }
};

export function useColeccion(modulo) {
  const [items, setItems] = useState([]);
  const sincronizados = useRef(new Map()); // id -> JSON guardado en la base
  const editable = useRef(false);
  const activa = useRef(false);

  /** Carga la lista que llegó de la base (sin reenviarla). */
  const cargar = useCallback((lista, puedeEditar) => {
    const limpia = (lista || []).filter((x) => x && x.id != null);
    sincronizados.current = new Map(limpia.map((x) => [String(x.id), JSON.stringify(x)]));
    editable.current = !!puedeEditar;
    activa.current = true;
    setItems(limpia);
  }, []);

  /** Al cerrar sesión: vacía la lista sin borrar nada en la base. */
  const reiniciar = useCallback(() => {
    activa.current = false;
    editable.current = false;
    sincronizados.current = new Map();
    setItems([]);
  }, []);

  // Si la base rechaza un cambio, la pantalla vuelve a mostrar lo guardado
  // (así nunca se ve un dato que en realidad no se grabó).
  const restaurar = (id, previo) =>
    setItems((prev) => {
      const sin = prev.filter((x) => String(x?.id) !== id);
      return previo === undefined ? sin : [JSON.parse(previo), ...sin];
    });

  useEffect(() => {
    if (!activa.current) return;
    if (!editable.current) {
      // Sin permiso de escritura: se descartan los cambios locales
      const guardado = [...sincronizados.current.values()];
      const actual = items.filter((x) => x && x.id != null).map((x) => JSON.stringify(x));
      const igual = guardado.length === actual.length && actual.every((j) => guardado.includes(j));
      if (!igual) {
        avisar("error", "No tienes permiso para modificar esta información.");
        setItems(guardado.map((j) => JSON.parse(j)));
      }
      return;
    }
    const actuales = new Map();
    items.forEach((x) => {
      if (x && x.id != null) actuales.set(String(x.id), x);
    });

    actuales.forEach((x, id) => {
      const json = JSON.stringify(x);
      const previo = sincronizados.current.get(id);
      if (previo === json) return;
      sincronizados.current.set(id, json);
      api(`/registros/${modulo}/${encodeURIComponent(id)}`, { method: "PUT", body: { datos: x } }).catch((e) => {
        if (previo === undefined) sincronizados.current.delete(id);
        else sincronizados.current.set(id, previo);
        restaurar(id, previo);
        avisar("error", `No se pudo guardar (${modulo}): ${e.message}`);
      });
    });

    [...sincronizados.current.keys()].forEach((id) => {
      if (actuales.has(id)) return;
      const previo = sincronizados.current.get(id);
      sincronizados.current.delete(id);
      api(`/registros/${modulo}/${encodeURIComponent(id)}`, { method: "DELETE" }).catch((e) => {
        sincronizados.current.set(id, previo);
        restaurar(id, previo);
        avisar("error", `No se pudo eliminar (${modulo}): ${e.message}`);
      });
    });
  }, [items, modulo]);

  return [items, setItems, cargar, reiniciar];
}
