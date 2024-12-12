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

// 1. APPLICATION IDNI OLISH
const askMessage = (ctx) => {
  const language = getLanguage(ctx);
  ctx.reply(language === "uz" ? messagesUz[11] : messagesRu[11]);
  return ctx.wizard.next();
};

// 2. CODE ni olish
const askCode = (ctx) => {
  ctx.wizard.state.application_id = ctx.message.text;
  const language = getLanguage(ctx);
  ctx.reply(language === "uz" ? messagesUz[12] : messagesRu[12]);
  return ctx.wizard.next();
};

// 2. APIGA SO`ROV YUBORISH
const saveMessage = async (ctx) => {
  ctx.wizard.state.code = ctx.message.text;
  const { application_id,code } = ctx.wizard.state;
  const chat = ctx.chat;
  const language = getLanguage(ctx);

  const isRegistered = await checkUserRegistered(chat.id);
  const isAdmined = await isAdmin(chat.id);

  try {
    const response = await Billing_API.post(
      "api/multibilling/verify-otp",
      {
        provider_name: "ANORBANK",
        code:parseInt(code),
        backend_application_id: parseInt(application_id),
      }
    );
    const { data } = response;
    console.log(data,"dt");
    
    if (data.success) {
      await ctx.reply(
        language === "uz" ? messagesUz[10] : messagesRu[10],
        handleMainMenu(ctx, language, isRegistered, isAdmined)
      );
    } else {
      await ctx.reply(
        language === "uz"
          ? `${messagesUz.error}\n-->${data.message}`
          : `${messagesRu.error}\n-->${data.message}`,
        handleMainMenu(ctx, language, isRegistered, isAdmined)
      );
    }
  } catch (error) {
    console.error("Error in API call:", error);
    await ctx.reply(
      language === "uz" ? messagesUz.error : messagesRu.error,
      handleMainMenu(ctx, language, isRegistered, isAdmined)
    );
  }

  return ctx.scene.leave();
};

const verifyOtpWizard = new WizardScene(
  "verify_otp_wizard",
  askMessage,
  askCode,
  saveMessage
);

export default verifyOtpWizard;
