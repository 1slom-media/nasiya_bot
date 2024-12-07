import config from "../config/index.js";
import client from "../db/db.js";
import getFormattedDate from "../utils/formatedDate.js";
import { messagesRu, messagesUz } from "../utils/language.js";

export const handleCompleteRequest = async (ctx, requestId, language) => {
  try {
    // adminni aniqlash
    const query = `SELECT * FROM users WHERE chat_id = $1;`;
    const values = [ctx.chat.id];
    const res = await client.query(query, values);
    const admin = res.rows[0];

    // murojaatni topish
    const updateStatusQuery = `UPDATE requests SET status_uz = 'Xal qilindi', status_ru = 'Решено' WHERE id = $1 RETURNING *;`;
    const updateRes = await client.query(updateStatusQuery, [requestId]);
    const updatedRequest = updateRes.rows[0];

    if (updatedRequest) {
      const groupChatId = config.gropId;

      await ctx.answerCbQuery(
        language === "uz" ? "Мурожаат тугалланди!" : "Запрос завершен!"
      );
      await ctx.editMessageText(
        language === "uz"
          ? `Мурожаат статуси: Хал қилинди`
          : `Статус обращения: Решено`
      );

      await ctx.telegram.sendMessage(
        updatedRequest.chat_id,
        `
📩 <b>${messagesUz[4]}</b>
🆔 <b>ID:</b> ${updatedRequest.id}
📝 <b>${messagesUz[0]}:</b> ${updatedRequest.request_text}
✅ <b>${messagesUz[1]}:</b> холати ${admin.tg_name} томонидан хал қилинди
            `,
        { parse_mode: "HTML",reply_to_message_id: updatedRequest.message_id }
      );

      // guruhga yuboriladigan matn
      const message = `
📩 <b>${messagesUz[4]}</b>
🆔 <b>ID:</b> ${requestId}
📌 <b>${messagesUz[7]}:</b> ${updatedRequest.merchant}
🙋‍♂️ <b>${messagesUz[5]}:</b> ${updatedRequest.first_name} ${updatedRequest.last_name}
📞 <b>${messagesUz[6]}:</b> ${updatedRequest.username}
📝 <b>${messagesUz[0]}:</b> ${updatedRequest.request_text}
🕒 <b>Юборилган вақт:</b> ${getFormattedDate(updatedRequest.date)}
✅ <b>Хал қилинган вақт:</b> ${getFormattedDate()}
👨‍💻 <b>Админ:</b> ${admin.tg_name}
        `;

      await ctx.telegram.sendMessage(groupChatId, message, {
        parse_mode: "HTML",
      });
    } else {
      await ctx.answerCbQuery(
        language === "uz" ? "Мурожаат топилмади." : "Запрос не найден."
      );
    }
  } catch (err) {
    console.error("Tugallashda xatolik:", err);
    await ctx.answerCbQuery(
      language === "uz" ? messagesUz.error : messagesRu.error
    );
  }
};
