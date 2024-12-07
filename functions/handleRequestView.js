import client from "../db/db.js";
import { messagesRu, messagesUz, statuses } from "../utils/language.js";
import { requestViewComponent } from "../utils/message.js";

export const handleRequestView = async (ctx, requestId, language) => {
  try {
    const status_name_uz = statuses[0];
    const status_name_ru = statuses[1];

    // dbni update qilish
    const updateStatusQuery = `
        UPDATE requests 
        SET status_uz = $1, status_ru = $2 
        WHERE id = $3 
        RETURNING *;
      `;
    const updateValues = [status_name_uz, status_name_ru, requestId];
    const updateRes = await client.query(updateStatusQuery, updateValues);
    const updatedRequest = updateRes.rows[0];

    if (updatedRequest) {
      const reqStatus =
        language === "uz" ? updatedRequest.status_uz : updatedRequest.status_ru;
      const message = await requestViewComponent(
        requestId,
        updatedRequest,
        reqStatus
      );

      await ctx.reply(message, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: language === "uz" ? "Тугаллаш" : "Завершить",
                callback_data: `complete_${updatedRequest.id}`,
              },
              {
                text: language === "uz" ? "Жавоб ёзиш" : "Ответить",
                callback_data: `reply_${updatedRequest.id}`,
              },
            ],
          ],
        },
      });

      // Foydalanuvchiga murojaat haqida xabar yuborish
      await ctx.telegram.sendMessage(
        updatedRequest.chat_id,
        `
          <b>Сизнинг қуйидаги мурожаатингиз кўриб чиқилмоқда:</b>
📩 <b>${messagesUz[4]}</b>
🆔 <b>ID:</b> ${updatedRequest.id}
📝 <b>${messagesUz[0]}:</b> ${updatedRequest.request_text}
✅ <b>${messagesUz[1]}:</b> ${reqStatus}
              `,
        { parse_mode: "HTML", reply_to_message_id: updatedRequest.message_id }
      );
    } else {
      await ctx.reply(
        language === "uz" ? "Мурожаат топилмади." : "Запрос не найден."
      );
    }
  } catch (err) {
    console.error("Murojaatni olishda xatolik:", err);
    await ctx.reply(language === "uz" ? messagesUz.error : messagesRu.error);
  }
};
