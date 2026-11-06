import React, { useState, useMemo } from "react";
import { etiquetaPostura } from "./PosturaEvaluacion";
import { FileText, Search, Copy, Check, Share2 } from "lucide-react";
import confetti from "canvas-confetti";

export const PhysioTextualRecordsView = ({
  records,
  members,
  onSelectSessionToEdit,
  onOpenReportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [selectedRecordId, setSelectedRecordId] = useState(
    records[0]?.id || null,
  );

  // Filter records based on textual search
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const term = searchTerm.toLowerCase();
    return records.filter((r) => {
      const matchName = r.memberName.toLowerCase().includes(term);
      const matchDni = r.memberDni.includes(term);
      const matchReason = r.consultationReason?.toLowerCase().includes(term);
      const matchMeds =
        r.physicalEvaluation?.medicationsText?.toLowerCase().includes(term) ||
        r.physicalEvaluation?.medications?.some((m) =>
          m.toLowerCase().includes(term),
        );
      const matchPosture =
        r.posturalEvaluation?.toLowerCase().includes(term) ||
        r.physicalEvaluation?.posturalVisualEvaluation?.postureFindings?.some(
          (p) => p.toLowerCase().includes(term),
        );
      const matchWilliams =
        r.functionalEvaluation?.williamsEvaluation?.summaryNotes
          ?.toLowerCase()
          .includes(term);
      const matchRestrictions = r.gymWorkoutRestrictions
        ?.toLowerCase()
        .includes(term);
      const matchPhysio = r.physiotherapistName?.toLowerCase().includes(term);

      return (
        matchName ||
        matchDni ||
        matchReason ||
        matchMeds ||
        matchPosture ||
        matchWilliams ||
        matchRestrictions ||
        matchPhysio
      );
    });
  }, [records, searchTerm]);

  const activeRecord = useMemo(() => {
    return (
      records.find((r) => r.id === selectedRecordId) ||
      filteredRecords[0] ||
      records[0] ||
      null
    );
  }, [records, selectedRecordId, filteredRecords]);

  // Generate plain textual representation
  const generatePlainTextRecord = (r) => {
    const lat = r.physicalEvaluation?.posturalVisualEvaluation?.lateralView;
    const knees = r.physicalEvaluation?.posturalVisualEvaluation?.visualKnees;
    const ankles = r.physicalEvaluation?.posturalVisualEvaluation?.visualAnkles;
    const williams = r.functionalEvaluation?.williamsEvaluation;
    const medsText =
      r.physicalEvaluation?.medicationsText ||
      r.physicalEvaluation?.medications?.join(", ") ||
      "Sin medicación reportada";

    let out = `================================================================================\n`;
    out += `FICHA CLÍNICA DE FISIOTERAPIA & REHABILITACIÓN FUNCIONAL\n`;
    out += `================================================================================\n\n`;
    out += `PACIENTE: ${r.memberName.toUpperCase()}\n`;
    out += `DNI: ${r.memberDni} | TELÉFONO: ${r.memberPhone || "No registrado"}\n`;
    out += `FECHA DE ATENCIÓN: ${r.date} a las ${r.time} (Sesión #${r.sessionNumber || 1})\n`;
    out += `PROFESIONAL A CARGO: ${r.physiotherapistName}\n\n`;
    out += `--------------------------------------------------------------------------------\n`;
    out += `1. MOTIVO DE CONSULTA & DIAGNÓSTICO:\n`;
    out += `${r.consultationReason}\n`;
    out += `• Zonas Afectadas: ${r.affectedZones?.join(", ") || r.affectedZone || "Lumbar"}\n`;
    out += `• Nivel de Dolor Inicial (EVA): ${r.painLevelEVA}/10\n`;
    if (r.initialMedicalRestrictions) {
      out += `• Antecedentes Médicos de Inscripción: ${r.initialMedicalRestrictions}\n`;
    }
    out += `\n--------------------------------------------------------------------------------\n`;
    out += `2. MEDICAMENTOS & FARMACOTERAPIA ACTUAL:\n`;
    out += `${medsText}\n`;
    out += `\n--------------------------------------------------------------------------------\n`;
    out += `3. EVALUACIÓN POSTURAL & BIOMECÁNICA (INCLUYE VISIÓN LATERAL & RODILLAS/TOBILLOS):\n`;
    out += `• Resumen Postural: ${r.posturalEvaluation || "Sin alteraciones severas"}\n`;
    if (lat) {
      out += `• VISIÓN LATERAL (SAGITAL):\n`;
      out += `  - Cabeza: ${etiquetaPostura("headPosition", lat.headPosition)}\n`;
      out += `  - Columna Cervical: ${etiquetaPostura("cervicalSpine", lat.cervicalSpine)}\n`;
      out += `  - Columna Dorsal: ${etiquetaPostura("thoracicSpine", lat.thoracicSpine)}\n`;
      out += `  - Columna Lumbar: ${etiquetaPostura("lumbarSpine", lat.lumbarSpine)}\n`;
      if (lat.shoulderPosition) out += `  - Hombros: ${etiquetaPostura("shoulderPosition", lat.shoulderPosition)}\n`;
      if (lat.abdomen) out += `  - Abdomen: ${etiquetaPostura("abdomen", lat.abdomen)}\n`;
      out += `  - Pelvis (Báscula): ${etiquetaPostura("pelvisTilt", lat.pelvisTilt)}\n`;
      out += `  - Rodillas Sagital: ${etiquetaPostura("kneeSagittal", lat.kneeSagittal)}\n`;
      out += `  - Línea de Plomada: ${etiquetaPostura("plumbLineDeviation", lat.plumbLineDeviation)}\n`;
      if (lat.notes) out += `  - Notas de Visión Lateral: ${lat.notes}\n`;
    }
    if (knees) {
      out += `• EVALUACIÓN VISUAL DE RODILLAS:\n`;
      out += `  - Alineación Frontal: ${etiquetaPostura("frontalAlignment", knees.frontalAlignment)}\n`;
      out += `  - Tracking Patelar: ${etiquetaPostura("patellarTracking", knees.patellarTracking)}\n`;
      out += `  - Inflamación / Derrame: ${etiquetaPostura("effusionInflammation", knees.effusionInflammation)}\n`;
      if (knees.details) out += `  - Detalles de Rodillas: ${knees.details}\n`;
    }
    if (ankles) {
      out += `• EVALUACIÓN VISUAL DE TOBILLO Y PIE:\n`;
      out += `  - Alineación Retropié: ${etiquetaPostura("hindfootAlignment", ankles.hindfootAlignment)}\n`;
      out += `  - Arco Plantar: ${etiquetaPostura("plantarArch", ankles.plantarArch)}\n`;
      if (ankles.forefoot) out += `  - Dedos y antepié: ${etiquetaPostura("forefoot", ankles.forefoot)}\n`;
      out += `  - Tendón de Aquiles: ${etiquetaPostura("achillesTendon", ankles.achillesTendon)}\n`;
      if (ankles.details) out += `  - Detalles de Tobillo: ${ankles.details}\n`;
    }
    if (r.physicalEvaluation?.posturalVisualEvaluation?.visualComments) {
      out += `• Comentarios Visuales Generales: ${r.physicalEvaluation.posturalVisualEvaluation.visualComments}\n`;
    }
    out += `\n--------------------------------------------------------------------------------\n`;
    out += `4. EVALUACIÓN FUNCIONAL & PROTOCOLO DE WILLIAMS:\n`;
    out += `• Rango Articular (ROM): ${r.rangeOfMotion}\n`;
    if (williams && williams.enabled) {
      out += `• PROTOCOLO DE FLEXIÓN DE WILLIAMS (COLUMNA LUMBO-SACRA):\n`;
      out += `  - Tolerancia Global: ${williams.overallTolerance.toUpperCase()}\n`;
      williams.exercises.forEach((w) => {
        out += `  [Ej #${w.number}] ${w.name}: ${w.executionStatus} | Dolor EVA: ${w.painEVA}/10 | ${w.clinicalComment}\n`;
      });
      if (williams.summaryNotes)
        out += `  - Conclusión Williams: ${williams.summaryNotes}\n`;
    }
    out += `\n--------------------------------------------------------------------------------\n`;
    out += `5. TRATAMIENTO & TÉCNICAS APLICADAS:\n`;
    if (r.editableTreatments && r.editableTreatments.length > 0) {
      r.editableTreatments
        .filter((t) => t.applied)
        .forEach((t, i) => {
          out += `[${i + 1}] ${t.name} (${t.category})\n    Dosificación: ${t.dosage}\n    ${t.notes ? `Nota: ${t.notes}\n` : ""}`;
        });
    } else {
      out += `${r.treatmentsApplied?.join(", ") || "Terapia manual y ejercicios terapéuticos"}\n`;
    }
    out += `\n--------------------------------------------------------------------------------\n`;
    out += `6. CARTILLA DE EJERCICIOS DOSIFICADOS:\n`;
    if (r.exerciseDosage && r.exerciseDosage.customExercises.length > 0) {
      out += `Título: ${r.exerciseDosage.customCardTitle} (${r.exerciseDosage.customCardFrequency})\n`;
      r.exerciseDosage.customExercises.forEach((ex, i) => {
        out += `${i + 1}. ${ex.name} - ${ex.series} series x ${ex.repsOrTime} (Descanso: ${ex.restSeconds}s)\n`;
        out += `   Indicación Técnica: ${ex.techniqueTips}\n`;
        if (ex.commentsWithImages && ex.commentsWithImages.length > 0) {
          ex.commentsWithImages.forEach((c) => {
            out += `   [Pauta con Foto]: ${c.imageTitle ? `${c.imageTitle}: ` : ""}${c.comment}\n`;
          });
        }
      });
    }
    out += `\n--------------------------------------------------------------------------------\n`;
    out += `7. RESTRICCIONES EN EL GIMNASIO / SALA DE PESAS:\n`;
    out += `${r.gymWorkoutRestrictions || "Adaptación según escala de dolor."}\n\n`;
    out += `8. PAUTAS EN CASA:\n`;
    out += `${r.homeIndications || "Seguir las indicaciones del fisioterapeuta."}\n\n`;
    if (r.nextAppointmentDate) {
      out += `PRÓXIMO CONTROL / CITA: ${r.nextAppointmentDate}\n`;
    }
    out += `================================================================================\n`;
    out += `CENTRO DE FISIOTERAPIA & RENDIMIENTO DEPORTIVO\n`;
    out += `================================================================================\n`;
    return out;
  };

  const handleCopyText = (r) => {
    const text = generatePlainTextRecord(r);
    navigator.clipboard.writeText(text);
    setCopiedId(r.id);
    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    } catch (e) {}
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-cyan-400 text-slate-950 inline-block mb-1">
            Historial Clínico Integral
          </span>
          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Directorio Textual de Evaluaciones y Alumnos</span>
          </h3>
          <p className="text-xs text-slate-400">
            Búsqueda textual exhaustiva en diagnósticos, medicamentos, visión
            lateral, Williams y restricciones.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por texto, diagnóstico, medicamento, Williams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Main Grid: Left List + Right Textual Terminal Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Alumnos & Evaluaciones List */}
        <div className="lg:col-span-4 space-y-2 max-h-[800px] overflow-y-auto pr-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 pb-1 flex items-center justify-between">
            <span>Evaluaciones Encontradas ({filteredRecords.length})</span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-cyan-400 text-xs hover:underline cursor-pointer"
              >
                Limpiar filtro
              </button>
            )}
          </div>

          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-slate-500 text-xs">
              No se encontraron evaluaciones que coincidan con "{searchTerm}".
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const isSelected = activeRecord?.id === rec.id;
              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecordId(rec.id)}
                  className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? "bg-gradient-to-r from-blue-900/40 to-slate-900 border-blue-500 shadow-md ring-2 ring-blue-500/30 text-white"
                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? "bg-blue-500/20 text-blue-300 border-blue-400/30"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      Sesión #{rec.sessionNumber || 1}
                    </span>
                    <span
                      className={`text-xs font-mono ${isSelected ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {rec.date}
                    </span>
                  </div>

                  <div>
                    <h4
                      className={`text-xs font-black ${isSelected ? "text-white" : "text-slate-900"}`}
                    >
                      {rec.memberName}
                    </h4>
                    <p
                      className={`text-xs line-clamp-1 ${isSelected ? "text-cyan-200" : "text-slate-600"}`}
                    >
                      {rec.consultationReason}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span
                      className={
                        isSelected ? "text-slate-400" : "text-slate-500"
                      }
                    >
                      DNI: {rec.memberDni}
                    </span>
                    <span className="font-bold text-amber-500">
                      EVA: {rec.painLevelEVA}/10
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Full Textual Record Inspector */}
        <div className="lg:col-span-8">
          {activeRecord ? (
            <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl p-5 sm:p-6 text-white space-y-4">
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono text-cyan-400 font-bold uppercase block">
                    Visor de Ficha Clínica Textual
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {activeRecord.memberName} · Sesión #
                    {activeRecord.sessionNumber || 1}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeRecord.date} | {activeRecord.time} ·{" "}
                    {activeRecord.physiotherapistName}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyText(activeRecord)}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    {copiedId === activeRecord.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>¡Texto Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Ficha Textual</span>
                      </>
                    )}
                  </button>

                  {onOpenReportModal && (
                    <button
                      type="button"
                      onClick={() => onOpenReportModal(activeRecord)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Ver Reporte Visual</span>
                    </button>
                  )}

                  {onSelectSessionToEdit && (
                    <button
                      type="button"
                      onClick={() => onSelectSessionToEdit(activeRecord)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Editar Ficha
                    </button>
                  )}
                </div>
              </div>

              {/* Monospace Formatted Text Box (Clean, High-Readability Clinical Sheet) */}
              <div className="relative">
                <pre className="w-full bg-black/70 border border-slate-800 rounded-2xl p-4 sm:p-5 text-xs text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[620px] select-text">
                  {generatePlainTextRecord(activeRecord)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 rounded-3xl border border-slate-800 p-12 text-center text-slate-400 text-xs">
              Selecciona una evaluación de la lista para ver su ficha clínica
              textual completa.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
