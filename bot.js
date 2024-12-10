import { Telegraf, Scenes, session, Markup } from "telegraf";
import config from "./config/index.js";
import { checkUserRegistered, isAdmin } from "./functions/checkUserRegister.js";
import { messagesRu, messagesUz } from "./utils/language.js";
import client from "./db/db.js";
import handleMainMenu from "./functions/mainMenu.js";
import { requestNoPhoto, requestPhoto } from "./functions/requests.js";
import faqMenu from "./functions/faqMenu.js";
import { handleFaq } from "./functions/handleFaq.js";
import { handleRequestView } from "./functions/handleRequestView.js";
import {
  handleAdminReply,
  handleReplyRequest,
} from "./functions/handleReply.js";
import { handleCompleteRequest } from "./functions/completeRequest.js";
import userInfoWizard from "./functions/loginScene.js";
import adminMessageWizard from "./functions/sendMessage.js";
import client2 from "./db/nasiya.js";
import { cretaeApplicationsGrafik, sendApplicationGrafik } from "./functions/allgood.js";

// db connect
client
  .connect()
  .then(() => console.log("Ulanish muvaffaqiyatli"))
  .catch((err) => console.error("Xato yuz berdi:", err));
client2
  .connect()
  .then(() => console.log("Nsiya Ulanish muvaffaqiyatli"))
  .catch((err) => console.error("Nasiya Xato yuz berdi:", err));
setInterval(() => {
  cretaeApplicationsGrafik();
  sendApplicationGrafik();
}, 3*60 * 1000);
const bot = new Telegraf(config.token);
const stage = new Scenes.Stage([userInfoWizard, adminMessageWizard]);
bot.use(
  session({
    defaultSession: () => ({
      faqQuestions: [], // Default qiymat
    }),
  })
);
bot.use(stage.middleware());

// save lang
export const userLanguage = {};
const getLanguage = (ctx) => {
  const userId = ctx.from.id;
  return userLanguage[userId] || "uz"; // Default to Uzbek if no language is set
};

// `/start` command
bot.start(async (ctx) => {
  if (ctx.chat.type !== "private") return;
  // murojatni ko`rish
  const userId = ctx.chat.id;
  const language = userLanguage[userId] || "uz";
  const args = ctx.message.text.split(" ");
  if (args[1] && args[1].startsWith("view_")) {
    const requestId = args[1].split("_")[1];
    return await handleRequestView(ctx, requestId, language);
  } else {
    const isRegistered = await checkUserRegistered(userId);
    const isAdmined = await isAdmin(userId);
    await handleMainMenu(ctx, language, isRegistered, isAdmined);
  }
});
// `/lang` command
const languageKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "O'zbekcha 🇺🇿", callback_data: "uz" }],
      [{ text: "Русский 🇷🇺", callback_data: "ru" }],
    ],
  },
};
const langCommand = (ctx) => {
  if (ctx.chat.type !== "private") return;
  const userId = ctx.from.id;
  const language = userLanguage[userId] || "uz";
  ctx.reply(
    language === "uz" ? messagesUz.changeLanguage : messagesRu.changeLanguage,
    languageKeyboard
  );
};

const changeLanguageCommand = async (ctx) => {
  const userId = ctx.from.id;
  const selectedLanguage = ctx.callbackQuery.data; // 'uz' yoki 'ru'
  userLanguage[userId] = selectedLanguage;
  const isRegistered = await checkUserRegistered(ctx.chat.id);
  const isAdmined = await isAdmin(userId);
  await handleMainMenu(ctx, selectedLanguage, isRegistered, isAdmined);
};

bot.hears([messagesUz.register, messagesRu.register], async (ctx) => {
  ctx.scene.enter("user_info_wizard");
});

bot.hears([messagesUz.faq, messagesRu.faq], async (ctx) => {
  const language = getLanguage(ctx);
  await faqMenu(ctx, language);
});

bot.hears([messagesUz.sendMes, messagesRu.sendMes], async (ctx) => {
  ctx.scene.enter("admin_message_wizard");
});

bot.hears([messagesUz.back, messagesRu.back], async (ctx) => {
  const userId = ctx.chat.id;
  const language = getLanguage(ctx);
  const isRegistered = await checkUserRegistered(userId);
  const isAdmined = await isAdmin(userId);
  await handleMainMenu(ctx, language, isRegistered, isAdmined);
});

bot.on("callback_query", async (ctx) => {
  const callbackData = ctx.callbackQuery.data;
  const language = getLanguage(ctx);
  const requestId = callbackData.split("_")[1];

  if (callbackData === "uz" || callbackData === "ru") {
    await changeLanguageCommand(ctx);
  } else if (callbackData.startsWith("reply_")) {
    await handleReplyRequest(ctx, requestId, language);
  } else if (callbackData.startsWith("complete_")) {
    await handleCompleteRequest(ctx, requestId, language);
  } else {
    await ctx.answerCbQuery(
      language === "uz"
        ? "Kechirasiz, bu savolga javob topilmadi."
        : "Извините, ответ на этот вопрос не найден."
    );
  }
});

// main function
bot.on("message", async (ctx) => {
  const chatType = ctx.chat.type;
  // Faqat guruh va superguruhlar uchun ishlash
  if (chatType === "group" || chatType === "supergroup") {
    const messageText = ctx.message.text || ctx.message.caption; // Xabar matni yoki caption
    const botUsername = ctx.botInfo.username; // Bot username

    if (
      ctx.message.photo &&
      messageText.includes(`@${botUsername}`) &&
      !messageText.includes("/lang")
    ) {
      await requestPhoto(ctx, messageText, botUsername);
    } else if (
      messageText &&
      messageText.includes(`@${botUsername}`) &&
      !messageText.includes("/lang")
    ) {
      await requestNoPhoto(ctx, messageText, botUsername);
    } else {
      console.log("Bot belgilanmagan yoki xabar matn/caption mavjud emas.");
    }
  } else if (chatType === "private") {
    const messageText = ctx.message?.text;
    const language = getLanguage(ctx);
    const faqQuestions = ctx.session?.faqQuestions || [];
    const selectedQuestion = faqQuestions.find(
      (q) => q.question === messageText
    );
    if (messageText == "/lang") {
      return langCommand(ctx);
    } else if (selectedQuestion) {
      const userId = ctx.chat.id;
      const isRegistered = await checkUserRegistered(userId);
      const isAdmined = await isAdmin(userId);
      await handleFaq(ctx, selectedQuestion, language, isRegistered, isAdmined);
    } else if (ctx.session.replyToRequestId) {
      const replyText = ctx.message.text;
      const requestId = ctx.session.replyToRequestId;
      await handleAdminReply(ctx, requestId, replyText, language);
    }
  } else {
    console.log("Bot ishlamoqda");
  }
});

export { bot, langCommand };
