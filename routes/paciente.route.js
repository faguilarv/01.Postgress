//Aqui manejamos las rutas de los pacientes

import { Router } from "express"; //importamos el Router de express
import {
  getAllPacientes,
  getPacienteRut,
  getPacienteById,
  createPaciente,
  deletePaciente,
  updatePaciente,
} from "../controllers/paciente.controller.js";
const router = Router(); //creamos una instancia de Router  para configurar las rutas

//ruta para obtener todos los pacientes
router.get("/pacientes", getAllPacientes); //ruta para obtener todos los pacientes)

//ruta para buscar un paciente por su rut
router.get("/pacientes/rut/:rut", getPacienteRut); //ruta para /pacientes buscar un paciente por su id);

//ruta para buscar un paciente por su id
router.get("/pacientes/:uid", getPacienteById); // Obtener paciente por UID

//ruta para crear un paciente
router.post("/pacientes", createPaciente); //ruta para crear un paciente

//ruta para eliminar un paciente esta es la practica en la industria

router.delete("/pacientes/:uid", deletePaciente);

//Actualizar un paciente
router.put("/pacientes/:uid", updatePaciente);

//exportamos el router por defecto
export default router; //exportamos el router por defecto
