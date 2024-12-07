import { Scenes } from "telegraf";
import { userLanguage } from "../bot.js";
import client from "../db/db.js";
import { messagesRu, messagesUz } from "../utils/language.js";
import handleMainMenu from "./mainMenu.js";
import { checkUserRegistered, isAdmin } from "./checkUserRegister.js";
const { WizardScene } = Scenes;

const getLanguage = (ctx) => {
  const userId = ctx.from.id;
  return userLanguage[userId] || "uz";
};

// 1. Foydalanuvchidan ismni olish
const askFirstName = (ctx) => {
  const language = getLanguage(ctx);
  ctx.reply(language === "uz" ? messagesUz.username : messagesRu.username);
  return ctx.wizard.next();
};

// 2. Foydalanuvchidan telefon raqamni olish
const askPhoneNumber = (ctx) => {
  ctx.wizard.state.first_name = ctx.message.text;
  const language = getLanguage(ctx);
  const options = {
    reply_markup: {
      keyboard: [
        [
          {
            text: language === "uz" ? messagesUz.phone : messagesRu.phone,
            request_contact: true,
          },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
  ctx.reply(
    language === "uz" ? messagesUz.phoneApprove : messagesRu.phoneApprove,
    options
  );

  return ctx.wizard.next();
};

// 3. Ma'lumotlarni saqlash
const saveUserInfo = async (ctx) => {
  const phone_number = ctx.message.contact.phone_number;
  const { first_name} = ctx.wizard.state;
  const chat = ctx.chat;
  const language = getLanguage(ctx);

  // Ma'lumotlarni bazaga yozish
  const query = `
        INSERT INTO users (first_name, last_name, phone_number, chat_id,tg_name)
        VALUES ($1, $2, $3, $4,$5)
        RETURNING *;
      `;
  const values = [first_name, chat?.last_name, phone_number, chat.id,chat.username]; // chat_id ni qo'shish

  try {
    const res = await client.query(query, values);
    const isRegistered = await checkUserRegistered(chat.id);
    const isAdmined = await isAdmin(chat.id);
    ctx.reply(
      language === "uz"
        ? messagesUz.saveUser
        : messagesRu.saveUser,
      handleMainMenu(ctx,language,isRegistered,isAdmined)
    );
  } catch (err) {
    console.error("Bazaga yozishda xatolik:", err);
    ctx.reply(
      language === "uz"
        ? messagesUz.error
        : messagesRu.error
    );
  }

  return ctx.scene.leave();
};


const userInfoWizard = new WizardScene(
  "user_info_wizard",
  askFirstName,
  askPhoneNumber,
  saveUserInfo
);

export default userInfoWizard;
