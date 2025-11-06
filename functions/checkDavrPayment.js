import { Scenes } from "telegraf";
import { userLanguage } from "../bot.js";
import { messagesRu, messagesUz } from "../utils/language.js";
import handleMainMenu from "./mainMenu.js";
import { checkUserRegistered, isAdmin } from "./checkUserRegister.js";
import Billing_API from "../utils/axios.js";
const { WizardScene } = Scenes;

const getLanguage = (ctx) => {
  const userId = ctx.from.id;
  return userLanguage[userId] || "uz";
};

// Helper function to format application data
const formatApplicationData = (result, language) => {
  const messages = language === "uz" ? messagesUz : messagesRu;

  const appId = result.appId || "N/A";
  const appDateCreate = result.appDateCreate || "N/A";
  const status = result.status || "N/A";
  const loanId = result.loanId || "N/A";
  const reason = result.reason || "-";

  return `
📊 <b>${messages[30]}</b>

🆔 <b>${messages[31]}</b> ${appId}
📅 <b>${messages[32]}</b> ${appDateCreate}
📌 <b>${messages[33]}</b> ${status}
💳 <b>${messages[34]}</b> ${loanId}
📝 <b>${messages[35]}</b> ${reason}
  `.trim();
};

// 1. Ask for application ID
const askApplicationId = (ctx) => {
  const language = getLanguage(ctx);
  ctx.reply(language === "uz" ? messagesUz[27] : messagesRu[27]);
  return ctx.wizard.next();
};

// 2. Check Davr payment status
const checkPaymentStatus = async (ctx) => {
  const applicationId = ctx.message.text;
  const chat = ctx.chat;
  const language = getLanguage(ctx);

  const isRegistered = await checkUserRegistered(chat.id);
  const isAdmined = await isAdmin(chat.id);

  try {
    // Send API request
    const response = await Billing_API.post("/davrbank/check-bot-status", {
      backend_application_id: Number(applicationId),
    });

    const { data } = response;

    // Check if the request was successful
    if (data.isSuccess && data.result) {
      const result = data.result;
      const status = result.status;

      // Format the full API response as JSON for display
      const apiResponseJson = JSON.stringify(data, null, 2);
      const codeBlock = `\n\n<b>API Response:</b>\n<code>${apiResponseJson}</code>`;

      // Handle different statuses
      if (status === "MERCHANT_PAYED") {
        // Success - payment completed
        const successMessage =
          language === "uz" ? messagesUz[28] : messagesRu[28];
        await ctx.reply(
          successMessage + codeBlock,
          {
            parse_mode: "HTML",
            ...handleMainMenu(ctx, language, isRegistered, isAdmined)
          }
        );
      } else if (status === "FAILED_MERCHANT_PAY") {
        // Failed - payment not completed
        const failedMessage =
          language === "uz" ? messagesUz[29] : messagesRu[29];
        await ctx.reply(
          failedMessage + codeBlock,
          {
            parse_mode: "HTML",
            ...handleMainMenu(ctx, language, isRegistered, isAdmined)
          }
        );
      } else {
        // Other status - show full details
        const formattedData = formatApplicationData(result, language);
        await ctx.reply(formattedData + codeBlock, {
          parse_mode: "HTML",
          ...handleMainMenu(ctx, language, isRegistered, isAdmined),
        });
      }
    } else {
      // API returned unsuccessful response
      const apiResponseJson = JSON.stringify(data, null, 2);
      const codeBlock = `\n\n<b>API Response:</b>\n<code>${apiResponseJson}</code>`;

      await ctx.reply(
        language === "uz"
          ? `${messagesUz.error}\n${data.status || ""}${codeBlock}`
          : `${messagesRu.error}\n${data.status || ""}${codeBlock}`,
        {
          parse_mode: "HTML",
          ...handleMainMenu(ctx, language, isRegistered, isAdmined)
        }
      );
    }
  } catch (error) {
    console.error("Error in check-davr-payment API call:", error);
    const errorMessage = error.response?.data?.message || error.message;
    await ctx.reply(
      language === "uz"
        ? `${messagesUz.error}\n${errorMessage || ""}`
        : `${messagesRu.error}\n${errorMessage || ""}`,
      handleMainMenu(ctx, language, isRegistered, isAdmined)
    );
  }

  return ctx.scene.leave();
};

const checkDavrPaymentWizard = new WizardScene(
  "check_davr_payment_wizard",
  askApplicationId,
  checkPaymentStatus
);

export default checkDavrPaymentWizard;
