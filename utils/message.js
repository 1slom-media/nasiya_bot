import getFormattedDate from "./formatedDate.js";
import { messagesUz } from "./language.js";

export const reqComponent = (
  requestId,
  merchant,
  first_name,
  last_name,
  phone_number,
  requestText
) => {
  return `
📩 <b>${messagesUz[4]}</b>
🆔 <b>ID:</b> ${requestId}
📌 <b>${messagesUz[7]} </b> ${merchant}
🙋‍♂️ <b>${messagesUz[5]} </b> ${first_name} ${last_name}
📞 <b>${messagesUz[6]} </b> @${phone_number}  
📝 <b>${messagesUz[0]} </b>
${requestText}
    
🕒 <b>${messagesUz[8]} </b> ${getFormattedDate()}
✅ <b>${messagesUz[1]} </b> юборилган
        `;
};

export const resComponent = (requestId, updatedRequest, user, admin) => {
  return `
      📩 <b>${messagesUz[4]}</b>
      🆔 <b>ID:</b> ${requestId}
      📌 <b>${messagesUz[7]}:</b> ${updatedRequest.type}
      🙋‍♂️ <b>${messagesUz[5]}:</b> ${user.first_name} ${user.last_name}
      📞 <b>${messagesUz[6]}:</b> ${user.phone_number}
      📝 <b>${messagesUz[0]}:</b> ${updatedRequest.request_text}
      🕒 <b>Юборилган вақт:</b> ${getFormattedDate(updatedRequest.date)}
      ✅ <b>Хал қилинган вақт:</b> ${getFormattedDate()}
      👨‍💻 <b>Админ:</b> ${admin.tg_name}
      `;
};

export const requestViewComponent = async (
  requestId,
  updatedRequest,
  reqStatus
) => {
  return `
📩 <b>${messagesUz[4]}</b>
🆔 <b>ID:</b> ${requestId}
📌 <b>${messagesUz[7]}:</b> ${updatedRequest.merchant}
🙋‍♂️ <b>${messagesUz[5]}:</b> ${updatedRequest?.first_name} ${
    updatedRequest?.last_name
  }
📞 <b>${messagesUz[6]}:</b> ${updatedRequest?.username}
  
📝 <b>${messagesUz[0]}:</b>
${updatedRequest?.request_text}
  
🕒 <b>${messagesUz[8]}:</b> ${getFormattedDate(updatedRequest?.date)}
✅ <b>${messagesUz[1]}:</b> ${reqStatus}
`;
};

export const requestReply = async (requestId,request,admin,replyText) => {
  return `
🆔 <b>ID:</b> ${requestId}
📌 <b>${messagesUz[7]}:</b> ${request.merchant}
🙋‍♂️ <b>${messagesUz[5]}:</b> ${request.first_name} ${request.last_name}
📞 <b>${messagesUz[6]}:</b> ${request.username}
  
📝 <b>${messagesUz[0]}:</b>
${request.request_text}
  
🕒 <b>Юборилган вақт:</b> ${getFormattedDate(request.date)}
🕒 <b>Жавоб берилган вақт:</b> ${getFormattedDate()}
  
👮‍♂️ <b>Админ:</b> ${admin.tg_name}
💬 <b>Админ жавоби:</b>
"${replyText}"
  `;
};
