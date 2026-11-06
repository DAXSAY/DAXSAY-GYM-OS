import { useEffect, useRef, useState } from "react";

// Número que "cuenta" desde el valor anterior hasta el nuevo (0,9 s)
export const NumeroAnimado = ({ valor = 0, decimales = 0, prefijo = "", duracion = 900 }) => {
  const [mostrar, setMostrar] = useState(0);
  const desde = useRef(0);
  useEffect(() => {
    const ini = desde.current;
    const fin = Number(valor) || 0;
    const t0 = performance.now();
    let id;
    const paso = (t) => {
      const p = Math.min(1, (t - t0) / duracion);
      const e = 1 - Math.pow(1 - p, 3);
      setMostrar(ini + (fin - ini) * e);
      if (p < 1) id = requestAnimationFrame(paso);
      else desde.current = fin;
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [valor, duracion]);
  return (
    <>
      {prefijo}
      {mostrar.toLocaleString("es-PE", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}
    </>
  );
};
