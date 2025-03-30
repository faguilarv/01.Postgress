import { pool } from "../database/connection.js";
import { limpiarRut, validarRUT } from "../shared/utils.js";
import { Pacientes } from "../model/pacientes.model.js";

const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const findAll = async () => {
  try {
    const query = `
      SELECT a.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido, p.rut as paciente_rut
      FROM agendacitas a
      JOIN datapacientes p ON a.paciente_id = p.uid
      ORDER BY a.fecha DESC, a.hora DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  } catch (error) {
    console.error("Error al obtener todas las citas:", error);
    throw error;
  }
};

export const findById = async (id) => {
  if (isNaN(id)) {
    throw new Error("El ID de cita debe ser un número");
  }

  try {
    const query = {
      text: `
        SELECT a.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido, p.rut as paciente_rut
        FROM agendacitas a
        JOIN datapacientes p ON a.paciente_id = p.uid
        WHERE a.id = $1
      `,
      values: [id],
    };
    const { rows } = await pool.query(query);
    return rows[0];
  } catch (error) {
    console.error(`Error al obtener la cita con id ${id}:`, error);
    throw error;
  }
};

export const create = async (citaData) => {
  return withTransaction(async (client) => {
    const { paciente_rut, fecha, hora, motivo, foliofonasa, prevision } =
      citaData;

    if (!validarRUT(paciente_rut)) {
      throw new Error("Formato de RUT inválido");
    }

    const rutLimpio = limpiarRut(paciente_rut);
    const paciente = await Pacientes.findByRut(rutLimpio);

    if (!paciente) {
      throw new Error("No existe un paciente con ese RUT");
    }

    const query = {
      text: `
        INSERT INTO agendacitas 
          (paciente_id, fecha, hora, motivo, foliofonasa, prevision)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      values: [paciente.uid, fecha, hora, motivo, foliofonasa, prevision],
    };

    const { rows } = await client.query(query);
    return rows[0];
  });
};

export const getAllCitasByPacienteRut = async (rut) => {
  try {
    if (!validarRUT(rut)) {
      throw new Error("Formato de RUT inválido");
    }

    const rutLimpio = limpiarRut(rut);
    const paciente = await Pacientes.findByRut(rutLimpio);

    if (!paciente) {
      throw new Error("No existe un paciente con ese RUT");
    }

    const query = {
      text: `
        SELECT a.* 
        FROM agendacitas a
        WHERE a.paciente_id = $1
        ORDER BY a.fecha DESC, a.hora DESC
      `,
      values: [paciente.uid],
    };

    const { rows } = await pool.query(query);
    return rows;
  } catch (error) {
    console.error("Error al obtener citas del paciente:", error);
    throw error;
  }
};

export const update = async (citaData) => {
  return withTransaction(async (client) => {
    const { id, paciente_rut, fecha, hora, motivo, foliofonasa, prevision } =
      citaData;

    if (paciente_rut) {
      if (!validarRUT(paciente_rut)) {
        throw new Error("Formato de RUT inválido");
      }

      const rutLimpio = limpiarRut(paciente_rut);
      const paciente = await Pacientes.findByRut(rutLimpio);

      if (!paciente) {
        throw new Error("No existe un paciente con ese RUT");
      }
      citaData.paciente_id = paciente.uid;
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    const addField = (value, fieldName) => {
      if (value !== undefined) {
        fields.push(`${fieldName} = $${paramIndex++}`);
        values.push(value);
      }
    };

    addField(citaData.paciente_id, "paciente_id");
    addField(fecha, "fecha");
    addField(hora, "hora");
    addField(motivo, "motivo");
    addField(foliofonasa, "foliofonasa");
    addField(prevision, "prevision");

    if (fields.length === 0) {
      throw new Error("No hay campos para actualizar");
    }

    values.push(id);

    const query = {
      text: `
        UPDATE agendacitas
        SET ${fields.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `,
      values,
    };

    const { rows } = await client.query(query);
    return rows[0];
  });
};

export const eliminarById = async (id) => {
  return withTransaction(async (client) => {
    const query = {
      text: `
        DELETE FROM agendacitas
        WHERE id = $1
        RETURNING *
      `,
      values: [id],
    };

    const { rows } = await client.query(query);
    return rows[0];
  });
};
