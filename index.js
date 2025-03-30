//este es el servidor de la aplicacion
//importamos el modulo dotenv para las variables de entorno
import "dotenv/config";
import express from "express";
//importamos cors
import cors from "cors";
import pacienteRoutes from "./routes/paciente.route.js";
import agendacitaRoutes from "./routes/agendacita.route.js"; // Importa el router de agendacita

const app = express();

app.use(cors()); // Middleware para habilitar CORS
// Middleware para habilitar el req.body de las solicitudes en formato JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Middleware para habilitar formularios nativos html

//habilitar archivos estaticos (public)
app.use(express.static("public"));

// //creamos la ruta de los pacientes con un prefijo /api
app.use("/api", pacienteRoutes);
app.use("/api/citas", agendacitaRoutes); // Agrega las rutas de agendacita

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`La app se esta escuchando en el puerto ${PORT}`);
});
