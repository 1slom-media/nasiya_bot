import { messagesRu, messagesUz } from "../utils/language.js";
import { safeReply } from "../utils/safeReply.js"; // qo‘shildi

const handleMainMenu = async (ctx, language, isRegistered, isAdmin) => {
  let options;
  let message;

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
          [
            {
              text:
                language === "uz" ? messagesUz.reqCurrClient : messagesRu.reqCurrClient,
            },
            {
              text:
                language === "uz" ? messagesUz.checkCurrClient : messagesRu.checkCurrClient,
            },
          ],
          [
            {
              text:
                language === "uz" ? messagesUz.checkDavrPayment : messagesRu.checkDavrPayment,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };
    message = language === "uz" ? messagesUz.service : messagesRu.service;
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
    message = language === "uz" ? messagesUz.service : messagesRu.service;
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
    message = language === "uz" ? messagesUz.welcome : messagesRu.welcome;
  }

  // xavfsiz reply
  await safeReply(ctx, message, options);
};

export default handleMainMenu;
