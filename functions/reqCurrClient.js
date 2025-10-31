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

// 1. Ask for phone number or client ID
const askPhoneOrId = (ctx) => {
  const language = getLanguage(ctx);
  ctx.reply(language === "uz" ? messagesUz[17] : messagesRu[17]);
  return ctx.wizard.next();
};

// 2. Send API request
const sendRequest = async (ctx) => {
  const input = ctx.message.text;
  const chat = ctx.chat;
  const language = getLanguage(ctx);

  const isRegistered = await checkUserRegistered(chat.id);
  const isAdmined = await isAdmin(chat.id);

  // MarkdownV2 uchun xavfsiz text generatsiya funksiyasi
  const escapeMarkdown = (text) => {
    if (!text) return "";
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
  };

  try {
    console.log(input, "inp");

    // API chaqiruvi
    const response = await Billing_API.post("/api/elma/req-curr-client-bot", {
      phoneNumber: input,
    });

    const { data } = response;
    console.log(data, "res");

    // API da yozilishdagi xatoni e’tiborga olib, ikkala variantni tekshiramiz
    const workflowInstaceId =
      data?.data?.workflowInstaceId || data?.data?.workflowInstanceId;

    if (data.success && workflowInstaceId) {
      console.log("success case");

      // Matnlarni escape qilamiz
      const safeMessagesUz26 = escapeMarkdown(messagesUz[26]);
      const safeMessagesRu26 = escapeMarkdown(messagesRu[26]);
      const safeWorkflowId = escapeMarkdown(workflowInstaceId);

      // Tilga mos xabar yaratamiz
      const successMessage =
        language === "uz"
          ? `✅ Сўров муваффақиятли юборилди\\!\n\n${safeMessagesUz26}\n\n\`\`\`\n${safeWorkflowId}\n\`\`\`\n\nИлтимос, бу ID рақамни "Жорий мижозни текшириш" тугмаси орқали текширинг\\.`
          : `✅ Запрос успешно отправлен\\!\n\n${safeMessagesRu26}\n\n\`\`\`\n${safeWorkflowId}\n\`\`\`\n\nПожалуйста, проверьте этот ID через кнопку "Проверить текущего клиента"\\.`;

      // Foydalanuvchiga xabar yuboramiz
      await ctx.reply(successMessage, {
        parse_mode: "MarkdownV2",
        ...handleMainMenu(ctx, language, isRegistered, isAdmined),
      });
    } else {
      console.log("else case");
      await ctx.reply(
        language === "uz"
          ? `${messagesUz.error}\n${data.message || ""}`
          : `${messagesRu.error}\n${data.message || ""}`,
        handleMainMenu(ctx, language, isRegistered, isAdmined)
      );
    }
  } catch (error) {
    console.error("Error in req-curr-client API call:", error);
    const errorMessage = error.response?.data?.message || error.message;

    // Xatolikni foydalanuvchiga ko‘rsatamiz
    await ctx.reply(
      language === "uz"
        ? `${messagesUz.error}\n${escapeMarkdown(errorMessage || "")}`
        : `${messagesRu.error}\n${escapeMarkdown(errorMessage || "")}`,
      {
        parse_mode: "MarkdownV2",
        ...handleMainMenu(ctx, language, isRegistered, isAdmined),
      }
    );
  }

  return ctx.scene.leave();
};

const reqCurrClientWizard = new WizardScene(
  "req_curr_client_wizard",
  askPhoneOrId,
  sendRequest
);

export default reqCurrClientWizard;
