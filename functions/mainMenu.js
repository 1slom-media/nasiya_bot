import { messagesRu, messagesUz } from "../utils/language.js";

const handleMainMenu = async (ctx, language, isRegistered, isAdmin) => {
  let options;
  if (isAdmin && isRegistered) {
    options = {
      reply_markup: {
        keyboard: [
          [
            { text: language === "uz" ? messagesUz.faq : messagesRu.faq },
            {
              text: language === "uz" ? messagesUz.sendMes : messagesRu.sendMes,
            },
          ],
          [
            {
              text: language === "uz" ? messagesUz.sendSMS : messagesRu.sendSMS,
            },
            {
              text:
                language === "uz" ? messagesUz.verifySMS : messagesRu.verifySMS,
            },
          ],
          [
            {
              text:
                language === "uz" ? messagesUz.merchant : messagesRu.merchant,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };
    ctx.reply(
      language === "uz" ? messagesUz.service : messagesRu.service,
      options
    );
  } else if (isRegistered) {
    options = {
      reply_markup: {
        keyboard: [
          [{ text: language === "uz" ? messagesUz.faq : messagesRu.faq }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };
    ctx.reply(
      language === "uz" ? messagesUz.service : messagesRu.service,
      options
    );
  } else {
    options = {
      reply_markup: {
        keyboard: [
          [
            {
              text:
                language === "uz" ? messagesUz.register : messagesRu.register,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };
    ctx.reply(
      language === "uz" ? messagesUz.welcome : messagesRu.welcome,
      options
    );
  }
};

export default handleMainMenu;
