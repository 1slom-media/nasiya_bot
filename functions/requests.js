import { Markup } from "telegraf";
import config from "../config/index.js";
import client from "../db/db.js";
import { reqComponent } from "../utils/message.js";
import { messagesUz } from "../utils/language.js";

const requestPhoto = async (ctx, messageText, botUsername) => {
  const photo = ctx.message.photo[ctx.message.photo.length - 1].file_id;

  // Xabar matnini rasmdan keyin yuborish
  const fromUser = ctx.message.from; // userInfo
  const chat = ctx.message.chat; // chatInfo
  const message_id = ctx.message.message_id; // chatInfo

  // dbga yozish
  const query = `
           INSERT INTO requests (chat_id, request_text, status_uz, status_ru, merchant,message_id,first_name,last_name,username)
           VALUES ($1, $2, $3, $4, $5,$6,$7,$8,$9)
           RETURNING id;
         `;
  const cleanedMessage = messageText.replace(`@${botUsername}`, "").trim();

  const values = [
    chat.id,
    cleanedMessage,
    "юборилган",
    "отправил",
    chat.title,
    message_id,
    fromUser?.first_name,
    fromUser?.last_name,
    fromUser?.username,
  ];
  const res = await client.query(query, values);
  const requestId = res.rows[0].id;

  // javob shabloni
  const req = reqComponent(
    requestId,
    chat.title,
    fromUser?.first_name,
    fromUser?.last_name,
    fromUser?.username,
    cleanedMessage
  );

  // Xabarga javob berish
  ctx.reply(req, {
    reply_to_message_id: ctx.message.message_id,
    parse_mode: "HTML",
  });

  // Xabarni support gruhga yuborish
  const inlineKeyboard = Markup.inlineKeyboard([
    [
      {
        text: `${messagesUz.viewReq}`,
        url: `${config.botUrl}?start=view_${requestId}`,
      },
    ],
  ]);
  await ctx.telegram.sendPhoto(config.gropId, photo, {
    parse_mode: "HTML",
    reply_markup: inlineKeyboard.reply_markup,
    caption: req,
  });
};

const requestNoPhoto = async (ctx, messageText, botUsername) => {
  const fromUser = ctx.message.from; // userInfo
  const chat = ctx.message.chat; // chatInfo
  const message_id = ctx.message.message_id; // chatInfo

  // dbga yozish
  const query = `
  INSERT INTO requests (chat_id, request_text, status_uz, status_ru, merchant,message_id,first_name,last_name,username)
  VALUES ($1, $2, $3, $4, $5,$6,$7,$8,$9)
  RETURNING id;
`;
  const cleanedMessage = messageText.replace(`@${botUsername}`, "").trim();

  const values = [
    chat.id,
    cleanedMessage,
    "юборилган",
    "отправил",
    chat.title,
    message_id,
    fromUser?.first_name,
    fromUser?.last_name,
    fromUser?.username,
  ];
  const res = await client.query(query, values);
  const requestId = res.rows[0].id;

  // javob shabloni
  const req = reqComponent(
    requestId,
    chat.title,
    fromUser?.first_name,
    fromUser?.last_name,
    fromUser?.username,
    cleanedMessage
  );

  // Xabarga javob berish
  ctx.reply(req, {
    reply_to_message_id: ctx.message.message_id,
    parse_mode: "HTML",
  });

  // Xabarni support gruhga yuborish
  const inlineKeyboard = Markup.inlineKeyboard([
    [
      {
        text: `${messagesUz.viewReq}`,
        url: `${config.botUrl}?start=view_${requestId}`,
      },
    ],
  ]);
  await ctx.telegram.sendMessage(config.gropId, req, {
    parse_mode: "HTML",
    reply_markup: inlineKeyboard.reply_markup,
  });
};

export { requestPhoto, requestNoPhoto };
