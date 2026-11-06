// Exportar lo que se ve en pantalla (ya filtrado) a Excel o PDF y
// enviarlo al WhatsApp del administrador.
// Las librerías se cargan solo cuando se usan, para no hacer lenta la app.

const limpiarNombre = (s) =>
  String(s || "reporte")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 60);

const valorCelda = (v) => (v === null || v === undefined ? "" : v);

/** Excel (.xlsx) con título, filtros aplicados, tabla y totales */
export async function crearExcel({ titulo, filtros = [], columnas, filas, totales = [] }) {
  const ExcelJS = (await import("exceljs")).default;
  const libro = new ExcelJS.Workbook();
  libro.creator = "RADICAL";
  libro.created = new Date();
  const hoja = libro.addWorksheet("Reporte");
  const n = Math.max(columnas.length, 2);

  const titulo1 = hoja.addRow([titulo]);
  titulo1.font = { bold: true, size: 14, color: { argb: "FF0F172A" } };
  hoja.addRow([`Generado: ${new Date().toLocaleString("es-PE", { timeZone: "America/Lima" })}`]).font = { color: { argb: "FF64748B" } };
  if (filtros.length) hoja.addRow([`Filtros: ${filtros.join(" · ")}`]).font = { italic: true, color: { argb: "FF64748B" } };
  hoja.addRow([]);

  const encabezado = hoja.addRow(columnas.map((c) => c.label));
  encabezado.eachCell((celda) => {
    celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
    celda.alignment = { vertical: "middle" };
  });
  filas.forEach((f) => hoja.addRow(columnas.map((c) => valorCelda(c.excel ? c.excel(f) : f[c.key]))));
  hoja.views = [{ state: "frozen", ySplit: encabezado.number }];
  hoja.autoFilter = { from: { row: encabezado.number, column: 1 }, to: { row: encabezado.number, column: columnas.length } };

  if (totales.length) {
    hoja.addRow([]);
    totales.forEach(([k, v]) => {
      const r = hoja.addRow([k, v]);
      r.getCell(1).font = { bold: true };
    });
  }
  columnas.forEach((c, i) => {
    hoja.getColumn(i + 1).width = Math.min(
      45,
      Math.max(c.label.length + 2, ...filas.slice(0, 200).map((f) => String(valorCelda(c.excel ? c.excel(f) : f[c.key])).length + 2)),
    );
  });
  if (n > columnas.length) hoja.getColumn(n).width = 14;

  const datos = await libro.xlsx.writeBuffer();
  return new File([datos], `${limpiarNombre(titulo)}.xlsx`, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/** PDF horizontal con la tabla filtrada */
export async function crearPDF({ titulo, filtros = [], columnas, filas, totales = [], gimnasio = "RADICAL" }) {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: columnas.length > 6 ? "landscape" : "portrait", unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text(`${gimnasio} · ${titulo}`, 40, 40);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generado: ${new Date().toLocaleString("es-PE", { timeZone: "America/Lima" })}`, 40, 56);
  let y = 70;
  if (filtros.length) {
    const lineas = doc.splitTextToSize(`Filtros: ${filtros.join(" · ")}`, doc.internal.pageSize.getWidth() - 80);
    doc.text(lineas, 40, y);
    y += lineas.length * 11 + 4;
  }
  autoTable(doc, {
    startY: y,
    head: [columnas.map((c) => c.label)],
    body: filas.map((f) => columnas.map((c) => String(valorCelda(c.pdf ? c.pdf(f) : c.excel ? c.excel(f) : f[c.key])))),
    styles: { fontSize: 7.5, cellPadding: 3 },
    headStyles: { fillColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 40, right: 40 },
  });
  if (totales.length) {
    let ty = doc.lastAutoTable.finalY + 18;
    doc.setFontSize(9);
    doc.setTextColor(30);
    totales.forEach(([k, v]) => {
      doc.text(`${k}: ${v}`, 40, ty);
      ty += 12;
    });
  }
  return new File([doc.output("blob")], `${limpiarNombre(titulo)}.pdf`, { type: "application/pdf" });
}

export function descargar(archivo) {
  const url = URL.createObjectURL(archivo);
  const a = document.createElement("a");
  a.href = url;
  a.download = archivo.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Envía el archivo por WhatsApp.
 *  - En celular (y en PC con WhatsApp instalado) abre "Compartir" con el
 *    archivo adjunto: se elige WhatsApp y el chat del administrador.
 *  - Si el navegador no puede adjuntar archivos, lo descarga y abre el chat
 *    del administrador para arrastrar el archivo.
 * Devuelve "compartido" o "descargado".
 */
export async function enviarPorWhatsApp(archivo, numero, texto) {
  try {
    if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
      await navigator.share({ files: [archivo], title: archivo.name, text: texto });
      return "compartido";
    }
  } catch (e) {
    if (e?.name === "AbortError") return "cancelado";
  }
  descargar(archivo);
  const destino = numero ? `https://wa.me/${numero}` : "https://wa.me/";
  window.open(`${destino}?text=${encodeURIComponent(`${texto}\n(Adjunto: ${archivo.name})`)}`, "_blank", "noopener");
  return "descargado";
}
