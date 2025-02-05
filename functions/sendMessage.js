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

const sendMessagesInChunks = async (ctx, resGroups, chunkSize = 50, delay = 30000) => {
  const groups = resGroups.rows;
  let groupIndex = 0;

  // Barcha guruhlarni chunkSize bo'yicha yuborish
  while (groupIndex < groups.length) {
    const currentChunk = groups.slice(groupIndex, groupIndex + chunkSize);
    const promises = currentChunk.map(async (merchant) => {
      const groupId = merchant.group_id;
      try {
        // Guruhga xabar yuborish
        await ctx.telegram.sendMessage(groupId, ctx.wizard.state.text_send);
        await client.query(updateQuery, [groupId]);
      } catch (err) {
        console.error(`Xabar yuborishda xatolik: ${groupId}`, err);
      }
    });

    // Har bir guruhni yuborishdan keyin kutish va keyingisini yuborish
    await Promise.all(promises);
    groupIndex += chunkSize;
    console.log(`Yuborish yakunlandi, ${groupIndex} ta guruhni yubordik. Keyin ${delay / 1000} soniya kutamiz...`);
    await new Promise(resolve => setTimeout(resolve, delay)); // 30 sekund kutish
  }
};


// 1. Foydalanuvchidan ismni olish
const askMessage = (ctx) => {
  const language = getLanguage(ctx);
  ctx.reply(language === "uz" ? messagesUz[9] : messagesRu[9]);
  return ctx.wizard.next();
};

// 2. Ma'lumotlarni saqlash
const saveMessage = async (ctx) => {
  const { text_send } = ctx.wizard.state;
  const chat = ctx.chat;
  const language = getLanguage(ctx);

  // Ma'lumotlarni bazaga yozish
  const query = `
    INSERT INTO admin_messages (first_name, message, tg_name)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [chat?.first_name, text_send, chat.username];

  try {
    // Guruhlarni olish
    const resGroups = await client.query('SELECT * FROM merchants_bot;');

    // Merchant guruhlariga xabar yuborish va guruhlar statusini yangilash
    await sendMessagesInChunks(ctx, resGroups);

    // Foydalanuvchiga tasdiq xabari jo‘natish
    await client.query(query, values);
    const isRegistered = await checkUserRegistered(chat.id);
    const isAdmined = await isAdmin(chat.id);

    ctx.reply(
      language === "uz" ? messagesUz[10] : messagesRu[10],
      handleMainMenu(ctx, language, isRegistered, isAdmined)
    );
  } catch (err) {
    console.error("Bazaga yozishda xatolik:", err);
    ctx.reply(language === "uz" ? messagesUz.error : messagesRu.error);
  }

  return ctx.scene.leave();
};


const adminMessageWizard = new WizardScene(
  "admin_message_wizard",
  askMessage,
  saveMessage
);

export default adminMessageWizard;
