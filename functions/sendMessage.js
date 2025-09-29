import { Scenes } from "telegraf";
import { userLanguage } from "../bot.js";
import client from "../db/db.js";
import { messagesRu, messagesUz } from "../utils/language.js";
import handleMainMenu from "./mainMenu.js";
import { checkUserRegistered, isAdmin } from "./checkUserRegister.js";
const { WizardScene } = Scenes;

const getLanguage = (ctx) => {
  const userId = ctx.from.id;
  return userLanguage[userId] || "uz";
};

const sendMessagesInChunks = async (
  ctx,
  resGroups,
  messageData,
  chunkSize = 50,
  delay = 30000
) => {
  const groups = resGroups.rows;
  let groupIndex = 0;
  // Barcha guruhlarni chunkSize bo'yicha yuborish
  while (groupIndex < groups.length) {
    const currentChunk = groups.slice(groupIndex, groupIndex + chunkSize);
    const promises = currentChunk.map(async (merchant) => {
      const groupId = merchant.group_id;
      try {
        // Media turini aniqlash va mos ravishda yuborish
        await sendMediaToGroup(ctx, groupId, messageData);
      } catch (err) {
        console.error(`Xabar yuborishda xatolik: ${groupId}`, err);
      }
    });

    // Har bir guruhni yuborishdan keyin kutish va keyingisini yuborish
    await Promise.all(promises);
    groupIndex += chunkSize;
    await new Promise((resolve) => setTimeout(resolve, delay)); // 30 sekund kutish
  }
};

// Media turini aniqlash va yuborish funksiyasi
const sendMediaToGroup = async (ctx, groupId, messageData) => {
  const { type, content, caption } = messageData;

  switch (type) {
    case 'text':
      await ctx.telegram.sendMessage(groupId, content);
      break;

    case 'photo':
      await ctx.telegram.sendPhoto(groupId, content, {
        caption: caption || '',
        parse_mode: 'HTML'
      });
      break;

    case 'video':
      await ctx.telegram.sendVideo(groupId, content, {
        caption: caption || '',
        parse_mode: 'HTML'
      });
      break;

    case 'animation': // GIF
      await ctx.telegram.sendAnimation(groupId, content, {
        caption: caption || '',
        parse_mode: 'HTML'
      });
      break;

    case 'document':
      await ctx.telegram.sendDocument(groupId, content, {
        caption: caption || '',
        parse_mode: 'HTML'
      });
      break;

    case 'audio':
      await ctx.telegram.sendAudio(groupId, content, {
        caption: caption || '',
        parse_mode: 'HTML'
      });
      break;

    case 'voice':
      await ctx.telegram.sendVoice(groupId, content, {
        caption: caption || '',
        parse_mode: 'HTML'
      });
      break;

    case 'video_note':
      await ctx.telegram.sendVideoNote(groupId, content);
      break;

    case 'sticker':
      await ctx.telegram.sendSticker(groupId, content);
      break;

    default:
      // Fallback to text message
      await ctx.telegram.sendMessage(groupId, content);
      break;
  }
};

// Media turini aniqlash funksiyasi
const detectMessageType = (ctx) => {
  const message = ctx.message;

  if (message.photo) {
    return {
      type: 'photo',
      content: message.photo[message.photo.length - 1].file_id, // Eng yuqori sifatli rasmni olish
      caption: message.caption || ''
    };
  } else if (message.video) {
    return {
      type: 'video',
      content: message.video.file_id,
      caption: message.caption || ''
    };
  } else if (message.animation) {
    return {
      type: 'animation', // GIF
      content: message.animation.file_id,
      caption: message.caption || ''
    };
  } else if (message.document) {
    return {
      type: 'document',
      content: message.document.file_id,
      caption: message.caption || ''
    };
  } else if (message.audio) {
    return {
      type: 'audio',
      content: message.audio.file_id,
      caption: message.caption || ''
    };
  } else if (message.voice) {
    return {
      type: 'voice',
      content: message.voice.file_id,
      caption: message.caption || ''
    };
  } else if (message.video_note) {
    return {
      type: 'video_note',
      content: message.video_note.file_id,
      caption: ''
    };
  } else if (message.sticker) {
    return {
      type: 'sticker',
      content: message.sticker.file_id,
      caption: ''
    };
  } else if (message.text) {
    return {
      type: 'text',
      content: message.text,
      caption: ''
    };
  } else {
    // Fallback for unknown message types
    return {
      type: 'text',
      content: message.caption || 'Noma\'lum media turi',
      caption: ''
    };
  }
};

// 1. Foydalanuvchidan xabar olish (matn yoki media)
const askMessage = (ctx) => {
  const language = getLanguage(ctx);
  ctx.reply(language === "uz" ?
    "Guruhga yubormoqchi bo'lgan xabar, rasm, video, GIF yoki boshqa media faylni yuboring:" :
    "Отправьте сообщение, изображение, видео, GIF или другой медиафайл, который хотите отправить в группы:");
  return ctx.wizard.next();
};

// 2. Ma'lumotlarni saqlash va yuborish
const saveMessage = async (ctx) => {
  // Media turini aniqlash
  const messageData = detectMessageType(ctx);
  ctx.wizard.state.messageData = messageData;

  const chat = ctx.chat;
  const language = getLanguage(ctx);

  // Ma'lumotlarni bazaga yozish uchun matn tayyorlash
  let messageForDb = '';
  if (messageData.type === 'text') {
    messageForDb = messageData.content;
  } else {
    messageForDb = `[${messageData.type.toUpperCase()}] ${messageData.caption || 'Media fayl'}`;
  }

  // Ma'lumotlarni bazaga yozish
  const query = `
    INSERT INTO admin_messages (first_name, message, tg_name)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [chat?.first_name, messageForDb, chat.username];

  try {
    // Guruhlarni olish
    const resGroups = await client.query("SELECT * FROM merchants_bot;");

    // Merchant guruhlariga xabar yuborish
    await sendMessagesInChunks(ctx, resGroups, messageData);

    // Foydalanuvchiga tasdiq xabari jo‘natish
    await client.query(query, values);
    const isRegistered = await checkUserRegistered(chat.id);
    const isAdmined = await isAdmin(chat.id);

    // Muvaffaqiyat xabari
    const successMessage = language === "uz" ?
      `✅ Xabar muvaffaqiyatli yuborildi!\n📊 Media turi: ${messageData.type}\n📝 Caption: ${messageData.caption || 'Yo\'q'}` :
      `✅ Сообщение успешно отправлено!\n📊 Тип медиа: ${messageData.type}\n📝 Подпись: ${messageData.caption || 'Нет'}`;

    ctx.reply(
      successMessage,
      handleMainMenu(ctx, language, isRegistered, isAdmined)
    );
  } catch (err) {
    console.error("Bazaga yozishda xatolik:", err);
    const errorMessage = language === "uz" ?
      "❌ Xabar yuborishda xatolik yuz berdi. Qayta urinib ko'ring." :
      "❌ Произошла ошибка при отправке сообщения. Попробуйте снова.";
    ctx.reply(errorMessage);
  }

  return ctx.scene.leave();
};

const adminMessageWizard = new WizardScene(
  "admin_message_wizard",
  askMessage,
  saveMessage
);

export default adminMessageWizard;
