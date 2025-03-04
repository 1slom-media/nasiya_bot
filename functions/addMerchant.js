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

// 1. Foydalanuvchidan merchant Nomini olish
const askMerchantName = (ctx) => {
  const language = getLanguage(ctx);
  ctx.reply(language === "uz" ? messagesUz[13] : messagesRu[13]);
  return ctx.wizard.next();
};

const askMerchantChatId = (ctx) => {
  ctx.wizard.state.merchant = ctx.message.text;
  const language = getLanguage(ctx);
  ctx.reply(language === "uz" ? messagesUz[14] : messagesRu[14]);
  return ctx.wizard.next();
};

const askMerchantId = (ctx) => {
  ctx.wizard.state.merchant_chat_id = ctx.message.text;
  const language = getLanguage(ctx);
  ctx.reply(language === "uz" ? messagesUz[15] : messagesRu[15]);
  return ctx.wizard.next();
};

// 2. Ma'lumotlarni saqlash
const saveMessage = async (ctx) => {
  ctx.wizard.state.merchant_id = ctx.message.text;
  const { merchant, merchant_chat_id, merchant_id } = ctx.wizard.state;
  const chat = ctx.chat;
  const language = getLanguage(ctx);

  try {
    // Foydalanuvchiga tasdiq xabarini jo‘natish
    const isRegistered = await checkUserRegistered(chat.id);
    const isAdmined = await isAdmin(chat.id);

    // Avval merchant mavjudligini tekshiramiz
    const checkQuery = `SELECT * FROM merchants_bot WHERE merchant_id = $1;`;
    const checkResult = await client.query(checkQuery, [merchant_id]);

    if (checkResult.rows.length > 0) {
      // Agar merchant allaqachon mavjud bo‘lsa
      return ctx.reply(
        language === "uz"
          ? "Bu merchant allaqachon ro‘yxatdan o‘tgan. Qo‘shimcha ma'lumot uchun @Islombek_TT ga murojaat qiling."
          : "Этот мерчант уже зарегистрирован. Для дополнительной информации обратитесь к @Islombek_TT.",
        handleMainMenu(ctx, language, isRegistered, isAdmined)
      );
    }

    // Merchant mavjud bo‘lmasa, uni qo‘shamiz
    const insertQuery = `
      INSERT INTO merchants_bot (merchant_id, merchant_name, group_id, status) 
      VALUES ($1, $2, $3, 'Active')
      RETURNING *;
    `;
    const values = [merchant_id, merchant, merchant_chat_id];
    await client.query(insertQuery, values);

    ctx.reply(
      language === "uz" ? messagesUz[16] : messagesRu[16],
      handleMainMenu(ctx, language, isRegistered, isAdmined)
    );
  } catch (err) {
    console.error("Bazaga yozishda xatolik:", err);
    ctx.reply(language === "uz" ? messagesUz.error : messagesRu.error);
  }

  return ctx.scene.leave();
};

const addMerchantWizard = new WizardScene(
  "add_merchant_wizard",
  askMerchantName,
  askMerchantChatId,
  askMerchantId,
  saveMessage
);

export default addMerchantWizard;
