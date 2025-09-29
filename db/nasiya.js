import Client from "pg";
import config from "../config/index.js";

const client2 = new Client.Client({
 host: config.PG_NASIYA_HOST,
  user: config.PG_NASIYA_USER,
  password: config.PG_NASIYA_PASSWORD,
  database: config.PG_NASIYA_DATABASE,
  port: config.PG_NASIYA_PORT,
});

export default client2;
