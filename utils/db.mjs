// Create PostgreSQL Connection Pool here !
import * as pg from "pg";
const { Pool } = pg.default;
import dotenv from "dotenv";

dotenv.config();

const connectionPool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
});
export default connectionPool;

//store users database in postgres but articles database is in supabase