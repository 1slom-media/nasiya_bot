import Client from "pg";
import config from "../config/index.js";

const client = new Client.Client({
  host: "localhost",
  user: "postgres",
  password: config.PG_PASSWORD,
  database: config.PG_DATABASE,
  port: 5432,
});

export default client;
