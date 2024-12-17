import { sendYesterdayStatics } from "../functions/allgood";

const msInDay = 24 * 60 * 60 * 1000; // Kun davomiyligi (millisekundalar)
const targetTime = new Date();
targetTime.setHours(9, 0, 0, 0); // 9:00 da boshlash

// Funksiya faqat birinchi marta 9:00 da ishga tushadi, keyin har kuni takrorlanadi
function scheduleJob() {
  const now = new Date();
  let delay = targetTime - now;

  // Agar hozirgi vaqt 9:00 dan kech bo'lsa, ertangi kun uchun belgilaymiz
  if (delay < 0) {
    delay += msInDay;
  }

  setTimeout(() => {
    sendYesterdayStatics(); // Funksiyani chaqirish
    setInterval(sendYesterdayStatics, msInDay); // Keyin har 24 soatda qayta ishga tushurish
  }, delay);
}

export { scheduleJob };
