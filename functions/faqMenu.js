import client from "../db/db.js";
import { messagesRu, messagesUz } from "../utils/language.js";
import { safeReply } from "../utils/safeReply.js"; // yangi fayldan

const faqMenu = async (ctx, language) => {
  try {
    const res = await client.query(
      "SELECT id, question FROM faq WHERE lang = $1",
      [language]
    );

    const buttons = res.rows.map((faq) => [{ text: faq.question }]);
    buttons.push([{ text: language === "uz" ? messagesUz.back : messagesRu.back }]);

    await safeReply(
      ctx,
      language === "uz" ? messagesUz.selectQuestion : messagesRu.selectQuestion,
      {
        reply_markup: {
          keyboard: buttons,
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );

    ctx.session.faqQuestions = res.rows;
  } catch (err) {
    console.error("FAQ ni olishda xatolik:", err);
  }
};

export default faqMenu;
