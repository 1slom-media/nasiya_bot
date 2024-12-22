import { bot } from "../bot.js";
import config from "../config/index.js";
import client from "../db/db.js";
import client2 from "../db/nasiya.js";
import { extractDate } from "../utils/extractDate.js";
import getFormattedDate from "../utils/formatedDate.js";
import { formatDavrLimit } from "../utils/formatter.js";
import { grafikTable, limitTable } from "../utils/sheets.js";

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
          const merchant = row.merchant_name
            ? row.merchant_name
            : row.branch_name;
          const bank = row.provider_name ? row.provider_name : "DAVRBANK";
          const link = `https://pdf.allgoodnasiya.uz/${row.schedule_file}`;
          // message yasash
          const message = `
            📣<b>ПОЗДРАВЛЯЕМ ВАС !</b>📣
Вы успешно оформили рассрочку клиенту.✅🎉
🆔<b>Заявка №: ${row.backend_application_id}</b>
🕒<b>Дата оформления: ${getFormattedDate(row.created_at)}</b>
📌<b>Мерчант: </b>${merchant} 
👨🏻‍💻<b>Оператор: </b>${row.operator_name}
🏦<b>Банк:</b>${row.provider_name ? row.provider_name : "DAVRBANK"}
Подробно можете увидеть график платежей: ${link}
          `;
          // excelga qo`shish
          await grafikTable(
            row.backend_application_id,
            merchant,
            row.operator_name,
            bank,
            row.created_at,
            link
          );

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
  // kechagi kun aplictionsni olish
  const queryBotApplications = `
    SELECT id, application_id, status, created_at
    FROM public.bot_applications
    WHERE created_at::date = CURRENT_DATE - INTERVAL '1 day';
  `;
  const queryLimitApplications = `
    SELECT "limit", anor_limit, davr_limit,status, created_at
    FROM public.limit_applications
    WHERE created_at::date = CURRENT_DATE - INTERVAL '1 day' AND status='send';
  `;
  try {
    const botApplicationsResult = await client.query(queryBotApplications);
    const limitApplicationsResult = await client.query(queryLimitApplications);

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
    const totalLimitCount = limitApplicationsResult.rows.length;
    let totalLimit = 0;
    let anorLimit = 0;
    let davrLimit = 0;
    for (const row of limitApplicationsResult.rows) {
      let { limit, anor_limit, davr_limit } = row;
      // Tiyinlardan so‘mga aylantirish kerak bo‘lsa
      limit = parseFloat(limit) / 100 || 0;
      anor_limit = parseFloat(anor_limit) / 100 || 0;
      davr_limit = parseFloat(davr_limit) || 0;

      totalLimit += limit;
      anorLimit += anor_limit;
      davrLimit += Number(davr_limit);
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
    // limitlarni formatlash
    const totalLimitFormatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(totalLimit);
    const anorLimitFormatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(anorLimit);

    const message = `
<b>Статистика за ${extractDate(date)} день: </b>
- Общее количество оформленных заявок: <b>${totalApplications}</b>
- 💸Общая сумма оформленных рассрочки: <b>${totalPriceFormatted}</b>
- 💵Общая сумма оформленных товаров: <b>${contractPriceFormatted}</b>

- Общее количество лимит: <b>${totalLimitCount}</b>
💸<b>Общая лимит:</b>${totalLimitFormatted}
    `;

    await bot.telegram.sendMessage(config.channelId, message, {
      parse_mode: "HTML",
    });
  } catch (error) {
    console.error("Xatolik yuz berdi:", error);
  }
}

async function createLimit() {
  try {
    const newApplications = await client2.query(
      `SELECT a.id AS application_id,
              a.limit_amount, 
              a.approved_amount,
              d.amount_approved AS davr_amount,
              ba.approved_amount AS anor_amount,
              a.provider,
              a.created_at 
       FROM applications a
       LEFT JOIN davr_applications d ON a.id = d.backend_application_id
       LEFT JOIN billing_applications ba ON a.id = ba.backend_application_id
       WHERE a.created_at >= NOW() - INTERVAL '1 minute'`
    );

    for (const app of newApplications.rows) {
      await client.query(
        `INSERT INTO limit_applications (application_id, "limit", anor_limit, davr_limit, provider) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (application_id) DO NOTHING`,
        [
          app.application_id,
          app.limit_amount,
          app.anor_amount,
          app.davr_amount,
          app.provider,
        ]
      );
    }
  } catch (error) {
    console.log(error, "err");
  }
}

async function sendLimit() {
  try {
    console.log("send limit");
    // 'new' statusiga ega bo'lgan barcha `limit_applications` yozuvlarini olish
    const selectQuery = `
      SELECT application_id,id 
      FROM limit_applications 
      WHERE status = 'new';
    `;
    const selectResult = await client.query(selectQuery);
    let messages = [];

    for (const app of selectResult.rows) {
      const application = await client2.query(
        `SELECT 
          a.limit_amount, 
          a.approved_amount, 
          d.amount_approved as davr_amount,
          ba.approved_amount as anor_amount,
          a.provider, 
          a.merchant, 
          a.branch, 
          m.name as merchant_name, 
          b.name as branch_name, 
          a.user, 
          a.updated_at,
          cu.name, 
          cu.surname
        FROM applications a
        LEFT JOIN client_user cu ON a.user = cu.id
        LEFT JOIN merchant m ON a.merchant = m.id
        LEFT JOIN branchs b ON a.branch = b.id
        LEFT JOIN davr_applications d ON a.id = d.backend_application_id
        LEFT JOIN billing_applications ba ON a.id = ba.backend_application_id
        WHERE a.id = $1
        `,
        [app.application_id]
      );

      if (application.rows.length > 0) {
        const {
          limit_amount,
          approved_amount,
          provider,
          merchant_name,
          branch_name,
          name,
          surname,
          davr_amount,
          updated_at,
          anor_amount,
          merchant,
        } = application.rows[0];
        // Agar limit_amount yoki approved_amount 0 dan katta bo'lsa
        if (limit_amount > 0 || approved_amount > 0) {
          // Telegram guruhga xabar yuborish
          const limitFormatted = new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(parseFloat(limit_amount) / 100 || 0);
          const limitAnorFormatted = new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(parseFloat(anor_amount) / 100 || 0);
          const merchantName = merchant_name ? merchant_name : branch_name;
          const message = `
🆔<b>Заявка №: ${app.application_id}</b>
💸<b>Лимит:</b>${limitFormatted}
🚀<b>Давр лимит:</b>${formatDavrLimit(davr_amount)}
✈️<b>Анор лимит:</b>${limitAnorFormatted}

🏦<b>Банк:</b>${provider}
📌<b>Мерчант: </b>${merchantName}
👤<b>Клиент:</b>${name} ${surname}
🕒<b>Дата заявки:</b>${getFormattedDate(updated_at)}
`;
          // xabarni eccelga saqlash
          await limitTable(
            app.application_id,
            limitFormatted,
            limitAnorFormatted,
            formatDavrLimit(davr_amount),
            provider,
            merchantName,
            `${name} ${surname}`,
            updated_at
          );
          // xabarni supportga yuborish
          await bot.telegram.sendMessage(config.gropId, message, {
            parse_mode: "HTML",
          });

          // `merchants_bot` jadvalidan guruhni olish
          const groupQuery = `
            SELECT group_id
            FROM public.merchants_bot
            WHERE merchant_id = $1;
          `;
          const groupResult = await client.query(groupQuery, [merchant]);
          // groupIdlarni olish
          if (groupResult.rows.length > 0) {
            const chatId = groupResult.rows[0].group_id;
            messages.push({ chatId, message });
          }
          console.log("grdan otdik");
          // Holatni 'send'ga o'zgartirish
          await client.query(
            `UPDATE limit_applications SET status = $1,"limit"=$3,anor_limit=$4,davr_limit=$5,provider=$6 WHERE id = $2`,
            ["send", app.id, limit_amount, anor_amount, davr_amount, provider]
          );
          console.log("update");
        }
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
  } catch (error) {
    console.log(error);
  }
}

export {
  cretaeApplicationsGrafik,
  sendApplicationGrafik,
  sendYesterdayStatics,
  createLimit,
  sendLimit,
};
