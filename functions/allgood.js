import { bot } from "../bot.js";
import config from "../config/index.js";
import client from "../db/db.js";
import client2 from "../db/nasiya.js";
import { extractDate } from "../utils/extractDate.js";
import getFormattedDate from "../utils/formatedDate.js";

// `applications` jadvalidan yangi yozuvlarni o'qish va `bot_applications`ga qo'shish
async function cretaeApplicationsGrafik() {
  let lastCheckedTime = "2024-12-15 17:02:31.438484";
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
        let result = [];
        // `billing_applications` va `merchant`, `merchant_user` jadvallarini qo'shish
        const query = `
          SELECT 
            ba.id, 
            ba.status, 
            ba.backend_application_id, 
            ba.merchant_id,
	          ba.merchant_name,  
	          ba.branch_name,  
	          ba.provider_name,  
            ba.created_at,
            ba.schedule_file, 
            mu.name AS operator_name
          FROM public.billing_applications ba
          left JOIN public.merchant_user mu ON ba.merchant_operator_id = mu.id
          WHERE ba.backend_application_id = $1 AND ba.status='BillingSuccess';
        `;
        const resultAnor = await client2.query(query, [applicationId]);
        if (!resultAnor.rows.length) {
          const query = `
          SELECT 
            ba.id, 
            ba.status, 
            ba.backend_application_id, 
            ba.merchant_id,
	          ba.merchant_name,  
	          ba.branch_name,  
            ba.created_at,
            ba.schedule_file, 
            mu.name AS operator_name
          FROM public.davr_applications ba
          left JOIN public.merchant_user mu ON ba.merchant_operator_id = mu.id
          WHERE ba.backend_application_id = $1;
        `;
          const resultDavr = await client2.query(query, [applicationId]);
          result = resultDavr.rows;
        } else {
          result = resultAnor.rows;
        }

        if (result.length > 0) {
          const row = result[0];
          // messageni channelga yuborish
          const message = `
            📣<b>ПОЗДРАВЛЯЕМ ВАС !</b>📣
Вы успешно оформили рассрочку клиенту.✅🎉
🆔<b>Заявка №: ${row.backend_application_id}</b>
🕒<b>Дата оформления: ${getFormattedDate(row.created_at)}</b>
📌<b>Мерчант: </b>${row.merchant_name ? row.merchant_name : row.branch_name} 
👨🏻‍💻<b>Оператор: </b>${row.operator_name}
🏦<b>Банк:</b>${row.provider_name ? row.provider_name : "DAVRBANK"}
Подробно можете увидеть график платежей: https://pdf.allgoodnasiya.uz/${
            row.schedule_file
          }
          `;

          await bot.telegram.sendMessage(config.channelId, message, {
            parse_mode: "HTML",
          });

          // `merchants_bot` jadvalidan guruhni olish
          const groupQuery = `
            SELECT group_id
            FROM public.merchants_bot
            WHERE merchant_id = $1;
          `;
          const groupResult = await client.query(groupQuery, [row.merchant_id]);
          // groupIdlarni olish
          if (groupResult.rows.length > 0) {
            const chatId = groupResult.rows[0].group_id;
            // Yuboriladigan xabar
            messages.push({ chatId, message });
          }

          // `bot_applications` jadvalidagi statusni 'send'ga o'zgartirish
          const updateQuery = `
           UPDATE bot_applications
           SET status = 'send'
           WHERE application_id = $1;
         `;

          await client.query(updateQuery, [applicationId]);
        }
      }

      // Barcha xabarlarni yuborish
      for (const msg of messages) {
        try {
          // Guruhga xabar yuborish
          await bot.telegram.sendMessage(msg.chatId, msg.message, {
            parse_mode: "HTML",
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

async function sendYesterdayStatics() {
  const queryBotApplications = `
    SELECT id, application_id, status, created_at
    FROM public.bot_applications
    WHERE created_at::date = CURRENT_DATE - INTERVAL '1 day';
  `;

  try {
    const botApplicationsResult = await client.query(queryBotApplications);

    if (botApplicationsResult.rows.length === 0) {
      console.log("Kechagi kun uchun ma'lumot topilmadi.");
      return;
    }

    let totalPriceSum = 0;
    let contractPriceSum = 0;
    const totalApplications = botApplicationsResult.rows.length;
    let date;
    for (const row of botApplicationsResult.rows) {
      const applicationId = row.application_id;
      date = new Date(row.created_at);
      const queryApplications = `
        SELECT total_sum, contract_price
        FROM public.applications
        WHERE id = $1;
      `;

      const applicationsResult = await client2.query(queryApplications, [
        applicationId,
      ]);

      if (applicationsResult.rows.length > 0) {
        let { total_sum, contract_price } = applicationsResult.rows[0];

        // Tiyinlardan so‘mga aylantirish kerak bo‘lsa
        total_sum = parseFloat(total_sum) / 100 || 0;
        contract_price = parseFloat(contract_price) / 100 || 0;

        totalPriceSum += total_sum;
        contractPriceSum += contract_price;
      }
    }

    // Formatlash: Summalarni ikki o‘nlik formatga aylantirish
    const totalPriceFormatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(totalPriceSum);

    const contractPriceFormatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(contractPriceSum);
    const message = `
<b>Статистика за ${extractDate(date)} день: </b>
- Общее количество оформленных заявок: <b>${totalApplications}</b>
- 💸Общая сумма оформленных рассрочки: <b>${totalPriceFormatted}</b>
- 💵Общая сумма оформленных товаров: <b>${contractPriceFormatted}</b>
    `;

    await bot.telegram.sendMessage(config.channelId, message, {
      parse_mode: "HTML",
    });
  } catch (error) {
    console.error("Xatolik yuz berdi:", error);
  }
}

export {
  cretaeApplicationsGrafik,
  sendApplicationGrafik,
  sendYesterdayStatics,
};
