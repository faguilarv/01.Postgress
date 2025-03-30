//aqui manejamos la base de datos de los pacientes
import { pool } from "../database/connection.js";
import Agendacita from "../model/agendacita.model.js";

//funcion para obtener las citas del paciente
const getAllCitasId = async (paciente_id) => {
  return await Agendacita.getAllCitasId(paciente_id);
};
//funcion para obtener todos los pacientes

const findAll = async () => {
  const { rows } = await pool.query("select * from datapacientes");
  return rows; //retornamos las filas de  los pacientes
};

//funcion para buscar un unico paciente
const findByRut = async (rut) => {
  try {
    // Validación básica del parámetro
    if (!rut || typeof rut !== "string") {
      throw new Error("El RUT debe ser una cadena de texto");
    }

    // Limpieza y normalización del RUT
    const rutLimpio = rut.replace(/[^0-9kK]/g, "").toUpperCase();

    // Validación del formato
    if (!rutLimpio.match(/^[0-9]+[kK]?$/)) {
      throw new Error("Formato de RUT inválido");
    }

    const query = {
      text: `SELECT * FROM datapacientes WHERE rut = $1`,
      values: [rutLimpio], // Buscar solo en formato limpio
    };

    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return null; // Retorna null explícitamente si no se encuentra
    }

    return rows[0];
  } catch (error) {
    console.error(`Error en findByRut para RUT ${rut}:`, error);
    throw error; // Relanza el error para manejo superior
  }
};
//funcion para buscar por id
const findById = async (uid) => {
  const query = {
    text: `select * from datapacientes where uid = $1`,
    values: [uid],
  };
  const { rows } = await pool.query(query);
  return rows[0];
};
//destructuring de parametros
const create = async ({
  rut,
  nombre,
  apellido,
  edad,
  sexo,
  telefono,
  correo,
  direccion,
}) => {
  const query = {
    text: `
      INSERT INTO datapacientes (rut, nombre, apellido, edad, sexo, telefono, correo, direccion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    values: [rut, nombre, apellido, edad, sexo, telefono, correo, direccion],
  };
  const { rows } = await pool.query(query);
  return rows[0];
};

//funcion para eliminar un paciente
const eliminarById = async (uid) => {
  const query = {
    text: ` delete from datapacientes
     where uid = $1
    returning *
    `,
    values: [uid],
  };
  const { rows } = await pool.query(query);
  //devolvemos el objeto
  return rows[0];
};
const update = async (paciente) => {
  const query = {
    text: `
        UPDATE datapacientes
        SET rut = $1,
            nombre = $2,
            apellido = $3,
            edad = $4,
            sexo = $5,
            telefono = $6,
            correo = $7,
            direccion = $8
        WHERE uid = $9
        RETURNING *
        `,
    values: [
      paciente.rut,
      paciente.nombre,
      paciente.apellido,
      paciente.edad,
      paciente.sexo,
      paciente.telefono,
      paciente.correo,
      paciente.direccion,
      paciente.uid,
    ],
  };

  const { rows } = await pool.query(query);
  return rows[0];
};
export const Pacientes = {
  findAll,
  create,
  findByRut,
  eliminarById,
  update,
  findById,
  getAllCitasId,
}; //exportamos las funciones
