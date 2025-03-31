import { Router } from "express";
import agendacitaModel from "../model/agendacita.model.js"; // Importa el modelo correctamente
import { getCitasByRutAndDateRange } from "../controllers/agendacita.controller.js"; // Asegúrate de que esta función esté implementada"

const router = Router();

// Ruta para crear una nueva cita (POST /api/citas)
router.post("/", async (req, res) => {
  try {
    const nuevaCita = await agendacitaModel.createCita(req.body); // Usa createCita del modelo
    res.status(201).json(nuevaCita);
  } catch (error) {
    res.status(400).json({
      error: error.message,
      details: "Verifica los datos de la cita",
    });
  }
});
// Ruta para obtener citas por RUT y rango de fechas (GET /api/citas/rut/:rut)
router.get("/rut/:rut", (req, res) => {
  getCitasByRutAndDateRange(req, res);
});

// Ruta para obtener citas por RUT de paciente (GET /api/citas/paciente/:rut)
router.get("/paciente/:rut", async (req, res) => {
  try {
    const { rut } = req.params;
    // Necesitarías implementar esta función en tu modelo
    const citas = await agendacitaModel.getAllCitasByPacienteRut(rut);
    res.status(200).json(citas);
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener citas del paciente",
      details: error.message,
    });
  }
});

// Ruta para obtener todas las citas (GET /api/citas)
router.get("/", async (req, res) => {
  try {
    const citas = await agendacitaModel.findAll(); // Usa findAll del modelo
    res.status(200).json(citas);
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener citas",
      details: error.message,
    });
  }
});

// Ruta para obtener una cita por ID (GET /api/citas/:id)
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new Error("ID debe ser un número");

    const cita = await agendacitaModel.findById(id); // Usa findById del modelo
    if (!cita) return res.status(404).json({ error: "Cita no encontrada" });

    res.json(cita);
  } catch (error) {
    res.status(400).json({
      error: "Error al obtener cita",
      details: error.message,
    });
  }
});

// Ruta para actualizar una cita (PUT /api/citas/:id)
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new Error("ID debe ser un número");

    const citaActualizada = await agendacitaModel.updateCita({
      id,
      ...req.body,
    });

    if (!citaActualizada) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    res.json(citaActualizada);
  } catch (error) {
    res.status(400).json({
      error: "Error al actualizar cita",
      details: error.message,
    });
  }
});

// Ruta para eliminar una cita (DELETE /api/citas/:id)
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new Error("ID debe ser un número");

    const citaEliminada = await agendacitaModel.eliminarCitaById(id); // Usa eliminarCitaById del modelo

    if (!citaEliminada) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    res.json({
      message: "Cita eliminada correctamente",
      data: citaEliminada,
    });
  } catch (error) {
    res.status(400).json({
      error: "Error al eliminar cita",
      details: error.message,
    });
  }
});

export default router;
