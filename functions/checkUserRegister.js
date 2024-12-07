import client from "../db/db.js";

export const checkUserRegistered = async (chatId) => {
  const query = `SELECT * FROM users WHERE chat_id = $1;`;
  const values = [chatId];

  try {
    const res = await client.query(query, values);
    return res.rows.length > 0;
  } catch (err) {
    console.error("Foydalanuvchini tekshirishda xatolik:", err);
    return false;
  }
};

export const isAdmin = async (chatId) => {
  const query = `SELECT * FROM users WHERE chat_id = $1;`;
  const values = [chatId];

  try {
    const res = await client.query(query, values);
    return res.rows[0]?.role==="admin" ? true : false
  } catch (err) {
    console.error("Admin aniqlashda muammo", err);
    return false;
  }
};


