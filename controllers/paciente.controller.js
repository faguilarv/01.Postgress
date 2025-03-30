import { limpiarRut, formatearRUT, validarRUT } from "../shared/utils.js";
import { Pacientes } from "../model/pacientes.model.js";

const handleError = (error, res) => {
  console.error("Error completo:", error);
  if (typeof error === "string") {
    error = { message: error };
  }
  const code = error.status || 500;
  const message = error.message || "Error interno del servidor";
  return { code, message };
};

export const getAllPacientes = async (req, res) => {
  try {
    const pacientes = await Pacientes.findAll();

    const pacientesFormateados = pacientes.map((paciente) => ({
      ...paciente,
      rut: formatearRUT(paciente.rut),
    }));

    return res.json(pacientesFormateados);
  } catch (error) {
    const { code, message } = handleError(error, res);
    return res.status(code).json({ error: message });
  }
};

export const getPacienteRut = async (req, res) => {
  try {
    const { rut } = req.params;

    if (!rut) {
      return res.status(400).json({ error: "El RUT es obligatorio." });
    }

    const rutLimpio = limpiarRut(rut);

    if (!/^[0-9]+[kK]?$/.test(rutLimpio)) {
      return res.status(400).json({
        error: "Formato de RUT inválido",
        rutRecibido: rut,
        rutLimpio: rutLimpio,
      });
    }
    const paciente = await Pacientes.findByRut(rutLimpio);

    if (!paciente) {
      return res.status(404).json({
        error: "Paciente no encontrado",
        rutBuscado: formatearRUT(rutLimpio),
        sugerencia: "Verifique el RUT o registre al paciente",
      });
    }

    return res.json({
      ...paciente,
      rut: formatearRUT(paciente.rut),
    });
  } catch (error) {
    const { code, message } = handleError(error);
    return res.status(code).json({ error: message });
  }
};

export const getPacienteById = async (req, res) => {
  try {
    const uid = Number(req.params.uid);

    if (isNaN(uid)) {
      return res
        .status(400)
        .json({ error: "El UID debe ser un número válido." });
    }

    const paciente = await Pacientes.findById(uid);

    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    return res.json(paciente);
  } catch (error) {
    const { code, message } = handleError(error);
    return res.status(code).json({ error: message });
  }
};

export const createPaciente = async (req, res) => {
  try {
    const { rut, nombre, apellido, edad, sexo, telefono, correo, direccion } =
      req.body;

    // Validaciones
    const validaciones = [
      [
        !rut || typeof rut !== "string" || rut.trim() === "",
        "El RUT es obligatorio y debe ser una cadena válida.",
      ],
      [
        !nombre || typeof nombre !== "string" || nombre.trim() === "",
        "El nombre es obligatorio y debe ser una cadena válida.",
      ],
      [
        !apellido || typeof apellido !== "string" || apellido.trim() === "",
        "El apellido es obligatorio y debe ser una cadena válida.",
      ],
      [
        !edad || typeof edad !== "number" || edad < 0,
        "La edad es obligatoria y debe ser un número positivo.",
      ],
      [
        !sexo || typeof sexo !== "string" || sexo.trim() === "",
        "El sexo es obligatorio y debe ser una cadena válida.",
      ],
      [
        telefono && typeof telefono !== "string",
        "El teléfono debe ser una cadena válida.",
      ],
      [
        correo && typeof correo !== "string",
        "El correo debe ser una cadena válida.",
      ],
      [
        direccion && typeof direccion !== "string",
        "La dirección debe ser una cadena válida.",
      ],
    ];

    for (const [condicion, mensaje] of validaciones) {
      if (condicion) {
        return res.status(400).json({ error: mensaje });
      }
    }

    const rutLimpio = limpiarRut(rut);
    const regex = /^[0-9]+[kK]?$/;

    if (!regex.test(rutLimpio)) {
      return res
        .status(400)
        .json({ error: "El RUT solo puede contener números y la letra 'k'." });
    }

    const nuevoPaciente = await Pacientes.create({
      rut: rutLimpio,
      nombre,
      apellido,
      edad,
      sexo,
      telefono,
      correo,
      direccion,
    });

    res.status(201).json(nuevoPaciente);
  } catch (error) {
    const { code, message } = handleError(error);
    res.status(code).json({ error: message });
  }
};

export const deletePaciente = async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid || typeof uid !== "string") {
      return res.status(400).json({
        error:
          "El ID del paciente es obligatorio y debe ser una cadena válida.",
      });
    }

    const paciente = await Pacientes.eliminarById(uid);

    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    return res.json({ message: "Paciente eliminado" });
  } catch (error) {
    const { code, message } = handleError(error);
    return res.status(code).json({ error: message });
  }
};

export const updatePaciente = async (req, res) => {
  try {
    const { uid } = req.params;
    const { rut, nombre, apellido, edad, sexo, telefono, correo, direccion } =
      req.body;

    if (!uid || typeof uid !== "string") {
      return res.status(400).json({
        error:
          "El ID del paciente es obligatorio y debe ser una cadena válida.",
      });
    }

    const validaciones = [
      [
        nombre && (typeof nombre !== "string" || nombre.trim() === ""),
        "El nombre debe ser una cadena válida.",
      ],
      [
        apellido && (typeof apellido !== "string" || apellido.trim() === ""),
        "El apellido debe ser una cadena válida.",
      ],
      [
        edad !== undefined && (typeof edad !== "number" || edad < 0),
        "La edad debe ser un número positivo.",
      ],
      [
        sexo && (typeof sexo !== "string" || sexo.trim() === ""),
        "El sexo debe ser una cadena válida.",
      ],
      [
        telefono && typeof telefono !== "string",
        "El teléfono debe ser una cadena válida.",
      ],
      [
        correo && typeof correo !== "string",
        "El correo debe ser una cadena válida.",
      ],
      [
        direccion && typeof direccion !== "string",
        "La dirección debe ser una cadena válida.",
      ],
    ];

    for (const [condicion, mensaje] of validaciones) {
      if (condicion) {
        return res.status(400).json({ error: mensaje });
      }
    }

    const pacienteUpdate = {
      uid,
      rut,
      nombre,
      apellido,
      edad,
      sexo,
      telefono,
      correo,
      direccion,
    };
    const paciente = await Pacientes.update(pacienteUpdate);

    return res.json(paciente);
  } catch (error) {
    const { code, message } = handleError(error);
    return res.status(code).json({ error: message });
  }
};
