import { bot, langCommand } from "./bot.js";

bot.command("lang", (ctx) => {
  if (ctx.chat.type !== "private") return;
  langCommand(ctx);
});

bot.launch();
console.log("bot ishga tushdi");
