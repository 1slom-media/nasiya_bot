import { bot } from "../bot.js";
import client from "../db/db.js";
import client2 from "../db/nasiya.js";

// `applications` jadvalidan yangi yozuvlarni o'qish va `bot_applications`ga qo'shish
async function cretaeApplicationsGrafik() {
  let lastCheckedTime = "2024-12-08 17:02:31.438484";
  try {
    console.log("Allgood_db ma'lumotlar bazasiga ulanish muvaffaqiyatli");

    // Faqat yangi yozuvlarni o'qish (lastCheckedTime qiymatidan keyin)
    const query = `
      SELECT id, status, created_at
      FROM applications
      WHERE status = 'scheduling' AND created_at > $1;
    `;
    const result = await client2.query(query, [lastCheckedTime]);

    if (result.rows.length > 0) {
      // Har bir yangi yozuvni `bot_applications`ga qo'shish
      for (const row of result.rows) {
        const insertQuery = `
          INSERT INTO bot_applications (application_id)
          VALUES ($1)
          ON CONFLICT (application_id) DO NOTHING;
        `;
        await client.query(insertQuery, [row.id]);
        console.log(`Yozuv qo'shildi: ID=${row.id}`);
      }
    } else {
      console.log("Yangi yozuvlar topilmadi.");
    }
    lastCheckedTime = new Date();
  } catch (error) {
    console.error("Xatolik:", error);
  }
}

async function sendApplicationGrafik() {
  try {
    // 'new' statusiga ega bo'lgan barcha `bot_applications` yozuvlarini olish
    const selectQuery = `
      SELECT application_id 
      FROM bot_applications 
      WHERE status = 'new';
    `;
    const selectResult = await client.query(selectQuery);

    if (selectResult.rows.length > 0) {
      let messages = [];

      // Har bir yangi yozuvni ishlash
      for (const row of selectResult.rows) {
        const applicationId = row.application_id;
        
        // `billing_applications` jadvalidan kerakli ma'lumotlarni olish
        const query = `
          SELECT id, status, backend_application_id, merchant_id,
                 merchant_markup, merchant_name,
                 schedule_file
          FROM billing_applications 
          WHERE backend_application_id = $1;
        `;
        const result = await client2.query(query, [applicationId]);

        if (result.rows.length > 0) {
          const row = result.rows[0];

          // `merchants_bot` jadvalidan guruhni olish
          const groupQuery = `
            SELECT group_id
            FROM public.merchants_bot
            WHERE merchant_id = $1;
          `;
          const groupResult = await client.query(groupQuery, [row.merchant_id]);

          if (groupResult.rows.length > 0) {
            const chatId = groupResult.rows[0].group_id;

            // Yuboriladigan xabar
            const message = `
              *Поздравляем Вас\\!*  
              Вы успешно оформили рассрочку клиенту  
              *Заявка № ID* ${row.backend_application_id}  
              *Ссылка линк на pdf рассрочкага:* [pdf документ](https://pdf\\.allgoodnasiya\\.uz/${row.schedule_file.replace(
                /\./g,
                "\\."
              )})
            `.trim();

            // Xabarni yuborishga tayyorlash
            messages.push({ chatId, message });

            // `bot_applications` jadvalidagi statusni 'send'ga o'zgartirish
            const updateQuery = `
              UPDATE bot_applications
              SET status = 'send'
              WHERE application_id = $1;
            `;
            await client.query(updateQuery, [applicationId]);
          }
        }
      }

      // Barcha xabarlarni yuborish
      for (const msg of messages) {
        try {
          // Guruhga xabar yuborish
          await bot.telegram.sendMessage(msg.chatId, msg.message, {
            parse_mode: "MarkdownV2",
          });
        } catch (err) {
          continue;
        }
      }
    } else {
      console.log("Yangi yozuvlar topilmadi.");
    }
  } catch (error) {
    console.error("Bazaga so'rov yuborishda xatolik yuz berdi:", error);
  }
}


export { cretaeApplicationsGrafik, sendApplicationGrafik };
