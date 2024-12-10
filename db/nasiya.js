import Client from "pg";

const client2 = new Client.Client({
  host: "82.148.1.241",
  user: "otabek_muhammedjanov",
  password: 'F79Ng5UeVvUr',
  database: 'allgood_db', // Bu yerda 'postgres' bazasiga ulanishingiz kerak
  port: 5432,
});

export default client2;
