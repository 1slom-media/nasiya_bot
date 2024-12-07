import client from "../db/db.js";
import { messagesRu, messagesUz } from "../utils/language.js";

const faqMenu = async (ctx, language) => {
  try {
    // FAQ savollarini ma'lumotlar bazasidan olish
    const res = await client.query(
      "SELECT id, question FROM faq WHERE lang = $1",
      [language]
    );

    // Savollar uchun tugmalarni yaratish
    const buttons = res.rows.map((faq) => [{ text: faq.question }]);
    buttons.push([{ text: language === "uz" ? messagesUz.back : messagesRu.back }]); // "Back" tugmasi

    await ctx.reply(
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
    ctx.reply(language === "uz" ? messagesUz.error : messagesRu.error);
  }
};

export default faqMenu;
