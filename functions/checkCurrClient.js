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

// Helper function to sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to format card data
const formatCardData = (cardData, language) => {
  const messages = language === "uz" ? messagesUz : messagesRu;
  
  const clientName = cardData.clientFullName || "N/A";
  const cardPan = cardData.cardPan || "N/A";
  const cardExpiry = cardData.cardExpiry || "N/A";
  const installmentLimit = cardData.installmentLimit 
    ? new Intl.NumberFormat("en-US").format(cardData.installmentLimit)
    : "N/A";

  return `
📊 <b>${messages[20]}</b>

👤 <b>${messages[21]}</b> ${clientName}
💳 <b>${messages[22]}</b> ${cardPan}
📅 <b>${messages[23]}</b> ${cardExpiry}
💰 <b>${messages[24]}</b> ${installmentLimit}
  `.trim();
};

// 1. Ask for workflow instance ID
const askWorkflowId = (ctx) => {
  const language = getLanguage(ctx);
  ctx.reply(language === "uz" ? messagesUz[18] : messagesRu[18]);
  return ctx.wizard.next();
};

// 2. Check status with polling
const checkStatus = async (ctx) => {
  const workflowInstanceId = ctx.message.text;
  const chat = ctx.chat;
  const language = getLanguage(ctx);

  const isRegistered = await checkUserRegistered(chat.id);
  const isAdmined = await isAdmin(chat.id);

  try {
    // Show processing message
    const processingMessage = language === "uz" ? messagesUz[19] : messagesRu[19];
    await ctx.reply(processingMessage);

    // Poll up to 3 times within 1 minute (every 20 seconds)
    const maxAttempts = 3;
    const delayBetweenAttempts = 20000; // 20 seconds
    let attempt = 0;
    let isCompleted = false;
    let lastResponse = null;

    while (attempt < maxAttempts && !isCompleted) {
      attempt++;

      try {
        const response = await Billing_API.post(
          "/api/elma/check-curr-client-bot",
          {
            workflowInstanceId: workflowInstanceId,
          }
        );

        lastResponse = response.data;

        // Check if state is "Completed"
        if (lastResponse.state === "Completed") {
          isCompleted = true;
          
          // Format and send card data
          const formattedData = formatCardData(lastResponse.cardData, language);
          await ctx.reply(
            formattedData,
            {
              parse_mode: "HTML",
              ...handleMainMenu(ctx, language, isRegistered, isAdmined)
            }
          );
          break;
        }

        // If not completed and not the last attempt, wait before next attempt
        if (attempt < maxAttempts) {
          await sleep(delayBetweenAttempts);
        }
      } catch (error) {
        console.error(`Error on attempt ${attempt}:`, error);
        
        // If this is the last attempt, throw the error
        if (attempt === maxAttempts) {
          throw error;
        }
        
        // Otherwise, wait and try again
        if (attempt < maxAttempts) {
          await sleep(delayBetweenAttempts);
        }
      }
    }

    // If not completed after all attempts
    if (!isCompleted) {
      const notReadyMessage = language === "uz" ? messagesUz[25] : messagesRu[25];
      await ctx.reply(
        notReadyMessage,
        handleMainMenu(ctx, language, isRegistered, isAdmined)
      );
    }

  } catch (error) {
    console.error("Error in check-curr-client API call:", error);
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

const checkCurrClientWizard = new WizardScene(
  "check_curr_client_wizard",
  askWorkflowId,
  checkStatus
);

export default checkCurrClientWizard;

