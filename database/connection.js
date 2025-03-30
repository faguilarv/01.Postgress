import "dotenv/config";
import pg from "pg";

//DESTRUCTURING
const { Pool } = pg;

const connectionString = process.env.POSTGRES_URL;

export const pool = new Pool({
  connectionString: connectionString,
  //permite cerrar la sesión de la consulta
  allowExitOnIdle: true,
});

try {
  const time = await pool.query("select now() ");
  console.log("Database connected good " + time.rows[0].now);
} catch (error) {
  console.log(error);
}
