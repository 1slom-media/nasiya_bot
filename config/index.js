import dotenv from "dotenv";
dotenv.config();

const config = {
  token: process.env.TOKEN_BOT,
  gropId: process.env.GROUP_ID,
  botUrl: process.env.URL_BOT,
  PG_PASSWORD: process.env.PG_PASSWORD,
  PG_DATABASE: process.env.PG_DATABASE,
};

export default config;