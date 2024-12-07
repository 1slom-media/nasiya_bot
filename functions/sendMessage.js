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
const askMessage = (ctx) => {
  const language = getLanguage(ctx);
  ctx.reply(language === "uz" ? messagesUz[9] : messagesRu[9]);
  return ctx.wizard.next();
};

// 2. Ma'lumotlarni saqlash
const saveMessage = async (ctx) => {
  ctx.wizard.state.text_send = ctx.message.text;
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
  const groupQuery = `SELECT * FROM merchants_bot;`;

  try {
    const resGroups = await client.query(groupQuery);

    // Merchant guruhlariga xabar yuborish
    for (const merchant of resGroups.rows) {
      const groupId = merchant.group_id;

      try {
        // Guruhga xabar yuborish
        const sentMessage = await ctx.telegram.sendMessage(groupId, text_send);

        // Yuborilgan xabarni zakrepit qilish (pin qilish)
        await ctx.telegram.pinChatMessage(groupId, sentMessage.message_id, {
          disable_notification: true, // Xabarni zakrepleniye qilsangiz, bildirishnoma jo'natilmaydi
        });

        console.log(`Xabar yuborildi va zakrepit qilindi: ${groupId}`);
      } catch (err) {
        console.error(
          `Xabar yuborishda yoki zakrepit qilishda xatolik: ${groupId}`,
          err
        );
      }
    }

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
