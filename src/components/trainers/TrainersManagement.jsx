import React, { useState } from "react";
import {
  UserSquare2,
  Plus,
  Phone,
  Star,
  Clock,
  Users,
  Trash2,
  Edit3,
} from "lucide-react";
import { useGym } from "../../context/GymContext";
import { TelWhatsApp } from "../common/TelWhatsApp";

export const TrainersManagement = () => {
  const {
    trainers,
    members,
    addTrainer,
    updateTrainer,
    deleteTrainer,
    assignTrainerToMember,
  } = useGym();

  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phone, setPhone] = useState("+51");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [bio, setBio] = useState("");
  const [availableSchedule, setAvailableSchedule] = useState("");
  const [rating, setRating] = useState(4.9);

  // Member assignment modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [memberToAssignId, setMemberToAssignId] = useState("");

  const handleOpenNew = () => {
    setEditingTrainer(null);
    setName("");
    setSpecialization("Hipertrofia & Fuerza");
    setPhone("+51987654321");
    setEmail("entrenador@radicalgym.com");
    setPhotoUrl(
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    );
    setBio(
      "Entrenador certificado apasionado por la técnica correcta y la progresión continua de cargas.",
    );
    setAvailableSchedule("Lun - Sáb: 6:00 AM - 2:00 PM");
    setRating(4.9);
    setIsTrainerModalOpen(true);
  };

  const handleOpenEdit = (trainer) => {
    setEditingTrainer(trainer);
    setName(trainer.name);
    setSpecialization(trainer.specialization);
    setPhone(trainer.phone);
    setEmail(trainer.email);
    setPhotoUrl(trainer.photoUrl);
    setBio(trainer.bio);
    setAvailableSchedule(trainer.availableSchedule);
    setRating(trainer.rating);
    setIsTrainerModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingTrainer) {
      updateTrainer(editingTrainer.id, {
        name,
        specialization,
        phone,
        email,
        photoUrl,
        bio,
        availableSchedule,
        rating,
      });
    } else {
      addTrainer({
        name,
        specialization,
        phone,
        email,
        photoUrl:
          photoUrl ||
          "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&auto=format&fit=crop&q=80",
        bio,
        availableSchedule,
        rating,
      });
    }

    setIsTrainerModalOpen(false);
  };

  const handleAssignMember = (e) => {
    e.preventDefault();
    if (!selectedTrainer || !memberToAssignId) return;

    assignTrainerToMember(memberToAssignId, selectedTrainer.id);
    setIsAssignModalOpen(false);
    setMemberToAssignId("");
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-0.5">
            <UserSquare2 className="w-3.5 h-3.5" />
            <span>Staff de Entrenadores</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            Entrenadores Personales ({trainers.length})
          </h1>
          <p className="text-xs text-gray-500">
            Asignación de coaches a los alumnos, monitoreo de cupos y horarios
            de atención en sala.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 self-start sm:self-auto transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agregar Entrenador</span>
        </button>
      </div>

      {/* Trainers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {trainers.map((trainer) => {
          const assignedStudents = members.filter(
            (m) => m.assignedTrainerId === trainer.id,
          );

          return (
            <div
              key={trainer.id}
              className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-4 flex flex-col justify-between transition-all shadow-xs group"
            >
              <div>
                {/* Image & Header */}
                <div className="relative mb-3">
                  <img
                    src={trainer.photoUrl}
                    alt={trainer.name}
                    className="w-full h-44 rounded-lg object-cover border border-gray-200"
                  />

                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-white/90 backdrop-blur-xs rounded-md text-xs font-bold text-slate-800 flex items-center gap-1 border border-gray-200 shadow-xs">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span>{(trainer.rating || 5).toFixed(1)}</span>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs rounded-md text-xs font-medium text-white shadow-xs">
                    {assignedStudents.length} Alumnos asignados
                  </div>
                </div>

                {/* Trainer Info */}
                <div className="space-y-0.5">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-bold text-sm text-slate-900">
                      {trainer.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(trainer)}
                        className="p-1 text-gray-400 hover:text-slate-700 rounded-md hover:bg-gray-100 cursor-pointer"
                        title="Editar entrenador"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(`¿Eliminar al entrenador ${trainer.name}?`)
                          ) {
                            deleteTrainer(trainer.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded-md hover:bg-gray-100 cursor-pointer"
                        title="Eliminar entrenador"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-blue-600">
                    {trainer.specialization}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2 pt-0.5">
                    {trainer.bio}
                  </p>
                </div>

                {/* Schedule & Contact */}
                <div className="my-3 pt-2.5 border-t border-gray-100 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-xs truncate">
                      {trainer.availableSchedule}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs">{trainer.phone}</span>
                  </div>
                </div>
              </div>

              {/* Action Button: View Students & Assign */}
              <button
                onClick={() => setSelectedTrainer(trainer)}
                className="w-full py-2 bg-gray-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-gray-200 hover:border-blue-200 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Ver Alumnos ({assignedStudents.length})</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Trainer Students Drawer / Modal */}
      {selectedTrainer && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
          <div className="w-full max-w-3xl mx-auto min-h-full sm:px-8 sm:py-8 bg-white overflow-y-auto p-5 text-slate-800">
            <div className="flex items-start justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedTrainer.photoUrl}
                  alt={selectedTrainer.name}
                  className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                />

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedTrainer.name}
                  </h3>
                  <p className="text-xs text-blue-600 font-semibold">
                    {selectedTrainer.specialization}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrainer(null)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-4">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  Alumnos a su cargo
                </h4>

                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Asignar Alumno
                </button>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {members.filter(
                  (m) => m.assignedTrainerId === selectedTrainer.id,
                ).length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-xs bg-gray-50 rounded-lg border border-gray-200">
                    Este entrenador no tiene alumnos asignados actualmente.
                  </div>
                ) : (
                  members
                    .filter((m) => m.assignedTrainerId === selectedTrainer.id)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 bg-gray-50/70 border border-gray-200 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">
                            {m.fullName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Plan: {m.planName} • <TelWhatsApp tel={m.phone} />
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            assignTrainerToMember(m.id, "");
                          }}
                          className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-0.5 bg-rose-50 border border-rose-200 rounded cursor-pointer"
                          title="Desvincular del entrenador"
                        >
                          Desasignar
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedTrainer(null)}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-medium rounded-md cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Member to Trainer Modal */}
      {isAssignModalOpen && selectedTrainer && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
          <div className="w-full max-w-3xl mx-auto min-h-full sm:px-8 sm:py-8 bg-white p-5 text-slate-800">
            <h3 className="text-sm font-bold text-slate-900 mb-0.5">
              Asignar Alumno a {selectedTrainer.name}
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Selecciona un alumno para vincularlo con este entrenador.
            </p>

            <form onSubmit={handleAssignMember} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Seleccionar Alumno
                </label>
                <select
                  required
                  value={memberToAssignId}
                  onChange={(e) => setMemberToAssignId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="">Selecciona un alumno...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.planName}) -{" "}
                      {m.assignedTrainerId === selectedTrainer.id
                        ? "Ya asignado"
                        : "Disponible"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3 py-1.5 text-gray-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-xs cursor-pointer"
                >
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trainer Create / Edit Modal */}
      {isTrainerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
          <div className="w-full max-w-3xl mx-auto min-h-full sm:px-8 sm:py-8 bg-white p-5 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTrainer
                  ? "Editar Entrenador"
                  : "Registrar Nuevo Entrenador"}
              </h3>
              <button
                onClick={() => setIsTrainerModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 my-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mendoza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Especialidad Principal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Hipertrofia & Fuerza / HIIT & Pérdida de Grasa"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Horario Disponible en Gimnasio
                </label>
                <input
                  type="text"
                  placeholder="Ej. Lun - Vie: 6:00 AM - 2:00 PM"
                  value={availableSchedule}
                  onChange={(e) => setAvailableSchedule(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  URL de Foto de Perfil
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Biografía & Certificaciones
                </label>
                <textarea
                  rows={2.5}
                  placeholder="Reseña de experiencia, certificaciones IFBB, NSCA, etc."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsTrainerModalOpen(false)}
                  className="px-3 py-1.5 text-gray-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-xs cursor-pointer transition-all"
                >
                  {editingTrainer ? "Actualizar" : "Guardar Entrenador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
