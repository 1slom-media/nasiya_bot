import dotenv from "dotenv";
dotenv.config();

const config = {
  token: process.env.TOKEN_BOT,
  gropId: process.env.GROUP_ID,
  channelId:process.env.CHANNEL_ID,
  botUrl: process.env.URL_BOT,
  client_email:process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key:process.env.GOOGLE_PRIVATE_KEY,
  PG_PASSWORD: process.env.PG_PASSWORD,
  PG_DATABASE: process.env.PG_DATABASE,
  BILLING_URL:process.env.BILLING_URL
};

export default config;