// utils/safeReply.js
export const safeReply = async (ctx, text, options = {}) => {
  try {
    await ctx.reply(text, options);
  } catch (err) {
    if (err?.response?.error_code === 403) {
      console.warn("Foydalanuvchi botni bloklagan:", ctx.from?.id);
    } else {
      console.error("Xabar yuborishda xatolik:", err);
    }
  }
};
