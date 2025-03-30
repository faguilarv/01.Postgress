import { pool } from "../database/connection.js";

// Función para obtener todas las citas
const findAll = async () => {
  const query = `
    SELECT 
      a.id,
      d.rut AS paciente_rut,  -- ¡Obtiene el RUT del paciente!
      a.fecha,
      a.hora,
      a.foliofonasa,
      a.prevision,
      a.motivo
    FROM agendacitas a
    LEFT JOIN datapacientes d ON a.paciente_id = d.uid  -- JOIN con la tabla de pacientes
    ORDER BY a.fecha DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

// Función para obtener una cita por id
const findById = async (id) => {
  try {
    const query = {
      //SELECT * FROM agendacitas WHERE id = $1
      text: `select a.*, d.rut as paciente_rut from agendacitas a
       left join datapacientes d on a.paciente_id = d.uid where a.id = $1`,
      values: [id],
    };
    const { rows } = await pool.query(query);
    return rows[0];
  } catch (error) {
    console.error(`Error al obtener la cita con id ${id}:`, error);
    throw error;
  }
};

// Función para obtener todas las citas de un paciente por su ID
const getAllCitasId = async (paciente_id) => {
  try {
    const query = {
      text: `SELECT * FROM agendacitas WHERE paciente_id = $1`,
      values: [paciente_id],
    };
    const { rows } = await pool.query(query);
    return rows;
  } catch (error) {
    console.error(
      `Error al obtener las citas del paciente con id ${paciente_id}:`,
      error
    );
    throw error;
  }
};
//funcion para obtener todas las citas por Rut
const getAllCitasByPacienteRut = async (rut) => {
  try {
    const query = {
      text: `
        SELECT 
          ac.*,
          d.rut AS paciente_rut  -- ¡Asegúrate de incluir el RUT!
        FROM agendacitas ac
        JOIN datapacientes d ON ac.paciente_id = d.uid  -- Corregido para usar datapacientes
        WHERE d.rut = $1
      `,
      values: [rut],
    };
    const { rows } = await pool.query(query);
    return rows;
  } catch (error) {
    console.error(`Error al obtener citas por RUT ${rut}:`, error);
    throw error;
  }
};

// Función para crear una nueva cita
const createCita = async ({
  paciente_id,
  fecha,
  hora,
  motivo,
  foliofonasa,
  prevision, // Nueva columna añadida
  estado = "pendiente",
}) => {
  try {
    const query = {
      text: `
        INSERT INTO agendacitas (paciente_id, fecha, hora, motivo, foliofonasa, prevision, estado)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      values: [
        paciente_id,
        fecha,
        hora,
        motivo,
        foliofonasa,
        prevision,
        estado,
      ],
    };
    const { rows } = await pool.query(query);
    return rows[0];
  } catch (error) {
    console.error("Error al crear la cita:", error);
    throw error;
  }
};

// Función para actualizar/editar una cita
// Función para actualizar/editar una cita
const updateCita = async ({
  id,
  paciente_id, // Añadir este parámetro
  fecha,
  hora,
  motivo,
  foliofonasa,
  prevision,
  estado = "pendiente", // Valor por defecto
}) => {
  try {
    const query = {
      text: `
        UPDATE agendacitas
        SET paciente_id = $2, fecha = $3, hora = $4, motivo = $5, 
            foliofonasa = $6, prevision = $7, estado = $8
        WHERE id = $1
        RETURNING *
      `,
      values: [
        id,
        paciente_id,
        fecha,
        hora,
        motivo,
        foliofonasa,
        prevision,
        estado,
      ],
    };
    const { rows } = await pool.query(query);
    return rows[0];
  } catch (error) {
    console.error(`Error al actualizar la cita con id ${id}:`, error);
    throw error;
  }
};

// Función para eliminar una cita por id
const eliminarCitaById = async (id) => {
  try {
    const query = {
      text: `
        DELETE FROM agendacitas
        WHERE id = $1
        RETURNING *
      `,
      values: [id],
    };
    const { rows } = await pool.query(query);
    return rows[0];
  } catch (error) {
    console.error(`Error al eliminar la cita con id ${id}:`, error);
    throw error;
  }
};

// Exportamos las funciones
export default {
  findAll,
  findById,
  getAllCitasByPacienteRut,
  getAllCitasId,
  createCita,
  updateCita,
  eliminarCitaById,
};
