import client from "../db/db.js";
import { messagesRu, messagesUz } from "../utils/language.js";
import handleMainMenu from "./mainMenu.js";

export const handleFaq = async (
  ctx,
  selectedQuestion,
  language,
  isRegistered,
  isAdmin
) => {
  try {
    const res = await client.query("SELECT answer FROM faq WHERE id = $1", [
      selectedQuestion.id,
    ]);

    if (res.rows.length > 0) {
      const answer = res.rows[0].answer;
      await ctx.reply(
        answer,
        handleMainMenu(ctx, language, isRegistered, isAdmin)
      );
    } else {
      await ctx.reply(
        language === "uz" ? messagesUz.faqError : messagesRu.faqError,
        handleMainMenu(ctx, language, isRegistered, isAdmin)
      );
    }
  } catch (err) {
    console.error("FAQ javobni olishda xatolik:", err);
    ctx.reply(language === "uz" ? messagesUz.error : messagesRu.error);
  }
};
