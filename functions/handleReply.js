import config from "../config/index.js";
import client from "../db/db.js";
import getFormattedDate from "../utils/formatedDate.js";
import { messagesRu, messagesUz } from "../utils/language.js";
import { requestReply } from "../utils/message.js";
import { checkUserRegistered, isAdmin } from "./checkUserRegister.js";
import handleMainMenu from "./mainMenu.js";

export const handleReplyRequest = async (ctx, requestId, language) => {
  await ctx.answerCbQuery(
    language === "uz" ? "Илтимос, жавоб ёзинг:" : "Пожалуйста, напишите ответ:"
  );
  ctx.session.replyToRequestId = requestId;
  await ctx.reply(language === "uz" ? "Жавоб ёзинг:" : "Напишите ответ:");
};

export const handleAdminReply = async (ctx, requestId, replyText, language) => {
  try {
    const query = `SELECT * FROM users WHERE chat_id = $1;`;
    const values = [ctx.chat.id];
    const res = await client.query(query, values);
    const admin = res.rows[0];
    const requestQuery = `SELECT * FROM requests WHERE id = $1`;
    const requestRes = await client.query(requestQuery, [requestId]);

    if (requestRes.rows.length > 0) {
      const request = requestRes.rows[0];
      const groupChatId = config.gropId;
      // gruhga admin javobini yuborish
      const message = await requestReply(requestId, request, admin, replyText);

      //   messageni yuborish
      await ctx.telegram.sendMessage(groupChatId, message, {
        parse_mode: "HTML",
      });

      await ctx.telegram.sendMessage(
        request.chat_id,
        language === "uz"
          ? `💬Админ жавоби: ${replyText} \n👮‍♂️Админ: ${admin.tg_name}\n🕒${
              messagesUz[8]
            } ${getFormattedDate()}`
          : `💬Ответ администратора: ${replyText} \n👮‍♂️Админ: ${
              admin.tg_name
            }\n🕒${messagesRu[8]} ${getFormattedDate()}`,
        {
          reply_to_message_id: request.message_id, // Foydalanuvchi xabariga javob
        }
      );

      // baseni update qilish
      await client.query(
        `UPDATE requests SET status_uz = 'Жавоб берилди', status_ru = 'Ответил' WHERE id = $1`,
        [requestId]
      );

      ctx.session.replyToRequestId = null;
      const userId = ctx.chat.id;
      const isRegistered = await checkUserRegistered(userId);
      const isAdmined = await isAdmin(userId);
      await ctx.reply(
        language === "uz" ? "Жавоб юборилди." : "Ответ отправлен.",
        handleMainMenu(ctx, language,isRegistered,isAdmined)
      );
    } else {
      await ctx.reply(
        language === "uz" ? "Мурожаат топилмади." : "Запрос не найден."
      );
    }
  } catch (err) {
    console.error("Xatolik javob yuborishda:", err);
    await ctx.reply(language === "uz" ? messagesUz.error : messagesRu.error);
  }
};
