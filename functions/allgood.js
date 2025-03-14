import { Markup } from "telegraf";
import { bot } from "../bot.js";
import config from "../config/index.js";
import client from "../db/db.js";
import client2 from "../db/nasiya.js";
import { extractDate } from "../utils/extractDate.js";
import getFormattedDate from "../utils/formatedDate.js";
import { formatDavrLimit } from "../utils/formatter.js";
import {
  grafikTable,
  limitGraphTable,
  limitTable,
  updateSheetManager,
  updateSheetOver,
  updateSheetPartner,
  updateSheetStatus,
} from "../utils/sheets.js";
import { state } from "../utils/language.js";

// `applications` jadvalidan yangi yozuvlarni o'qish va `bot_applications`ga qo'shish
async function cretaeApplicationsGrafik() {
  let lastCheckedTime = "2025-03-12 10:02:31.438484";
  try {
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
        const queryApplications = `
        SELECT 
    a.total_sum,
    a.contract_price,
    a.period,
    cu.username as phone,
    STRING_AGG(p.name, ', ') AS product,
    CASE
        WHEN COALESCE(NULLIF(a.total_sum::TEXT, '')::NUMERIC, 0) = 0 THEN '0'
        ELSE REPLACE(TO_CHAR(ROUND(COALESCE(NULLIF(a.total_sum::TEXT, '')::NUMERIC, 0) / 100, 2), 'FM999999999.00'), '.', ',')
    END AS total_sum_formated
FROM public.applications AS a
LEFT JOIN public.client_user cu ON a."user" = cu.id
LEFT JOIN public.products p ON a.id = p.application
WHERE a.id = $1
GROUP BY a.id, cu.username;
      `;
        const applicationId = row.application_id;
        const applicationsResult = await client2.query(queryApplications, [
          applicationId,
        ]);
        let totalPrice = 0;
        let contractPrice = 0;
        if (applicationsResult.rows.length) {
          let {
            total_sum,
            contract_price,
            product,
            period,
            phone,
            total_sum_formated,
          } = applicationsResult.rows[0];
          await client.query(
            `UPDATE limit_applications 
             SET success = $1,product_price=$3,total_sum=$4
             WHERE application_id = $2 
             RETURNING status;`,
            [true, applicationId, contract_price, total_sum]
          );
          await updateSheetOver(
            applicationId,
            total_sum_formated,
            product,
            period,
            phone
          );
          totalPrice = parseFloat(total_sum) / 100 || 0;
          contractPrice = parseFloat(contract_price) / 100 || 0;
        }
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
          const totalPriceFormatted = new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(totalPrice);
          const contractPriceFormatted = new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(contractPrice);
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

<b>Заявка №: ${row.backend_application_id}</b>
<b>Дата оформления: ${getFormattedDate(row.created_at)}</b>
<b>Мерчант: </b>${merchant} 
<b>Оператор: </b>${row.operator_name}
<b>Банк:</b>${row.provider_name ? row.provider_name : "DAVRBANK"}
<b>Сумма товара:</b>${contractPriceFormatted}
<b>Сумма рассрочки:</b>${totalPriceFormatted}

График платежей: ${link}
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
  const queryApplicationsDb = `
    SELECT id, status, created_at
    FROM applications
    WHERE created_at::date = CURRENT_DATE - INTERVAL '1 day';
  `;
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
    const applicationsResult = await client2.query(queryApplicationsDb);
    const limitApplicationsResult = await client.query(queryLimitApplications);

    if (botApplicationsResult.rows.length === 0) {
      console.log("Kechagi kun uchun ma'lumot topilmadi.");
      return;
    }
    // bot applicationsdan kerakli ma`lumotlarni olish
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

    // limitApplicationsdan ma`lumotlarni olish
    const totalApp = applicationsResult.rows.length;
    const totalLimitCount = limitApplicationsResult.rows.length;
    const uniqueLimits = new Set();
    let totalLimit = 0;
    let anorLimit = 0;
    let davrLimit = 0;
    for (const row of limitApplicationsResult.rows) {
      let { limit, anor_limit, davr_limit, user } = row;

      // Tiyinlardan so‘mga aylantirish
      limit = parseFloat(limit) / 100 || 0;
      anor_limit = parseFloat(anor_limit) / 100 || 0;
      davr_limit = parseFloat(davr_limit) || 0;
      // `limit` va `user` ni tekshirish uchun noyob kombinatsiya yaratamiz
      const key = `${limit}-${user}`;

      if (!uniqueLimits.has(key)) {
        uniqueLimits.add(key); // Agar oldin mavjud bo‘lmasa, qo‘shamiz

        totalLimit += limit;
        anorLimit += anor_limit;
        davrLimit += Number(davr_limit);
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
    // limitlarni formatlash
    const totalLimitFormatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(totalLimit);
    const anorLimitFormatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(anorLimit);
    // foizni hisoblash
    const percent =
      parseFloat(Number(totalApplications) / Number(totalLimitCount)) * 100;
    const percentFormat = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(percent);
    const saldo = Number(totalLimit) - Number(totalPriceSum);
    const percentLimit =
      parseFloat(Number(totalPriceSum) / Number(totalLimit)) * 100;
    const percentLimitFormat = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(percentLimit));
    const saldoFormat = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(saldo));

    // message
    const message = `
<b>Статистика за ${extractDate(date)} день: </b>
- Количество заявок: <b>${totalApp}</b>
- Количество лимитов: <b>${totalLimitCount}</b>
- Количество оформленных заявок: <b>${totalApplications}</b>
- % оформленных заявок: <b>${percentFormat}</b>

- Выданный лимит: <b>${totalLimitFormatted}</b>
- Сумма оформленных товаров: <b>${contractPriceFormatted}</b>
- Сумма оформленных рассрочек: <b>${totalPriceFormatted}</b>
- Остаточный лимит: <b>${saldoFormat}</b>
- % лимита оформленных заявок: <b>${percentLimitFormat}</b>
    `;

    await bot.telegram.sendMessage(config.channelId, message, {
      parse_mode: "HTML",
    });
  } catch (error) {
    console.error("Xatolik yuz berdi:", error);
  }
}

async function sheetGraph() {
  const selectQuery = `
    SELECT application_id, 
       TO_CHAR(created_at, 'DD/MM/YYYY') AS created_at, 
       manager, 
       provider, 
       CASE
           WHEN COALESCE(NULLIF(TRIM("limit"::TEXT), '')::NUMERIC, 0) = 0 THEN '0'
           ELSE REPLACE(TO_CHAR(ROUND(COALESCE(NULLIF(TRIM("limit"::TEXT), '')::NUMERIC, 0) / 100, 2), 'FM999999999.00'), '.', ',')
       END AS limit_formatted,
       merchant, 
       branch, 
       fio, 
       period, 
       CASE
           WHEN COALESCE(NULLIF(TRIM(total_sum::TEXT), '')::NUMERIC, 0) = 0 THEN '0'
           ELSE REPLACE(TO_CHAR(ROUND(COALESCE(NULLIF(TRIM(total_sum::TEXT), '')::NUMERIC, 0) / 100, 2), 'FM999999999.00'), '.', ',')
       END AS total_sum_formatted,
       CASE
           WHEN COALESCE(NULLIF(TRIM(product_price::TEXT), '')::NUMERIC, 0) = 0 THEN '0'
           ELSE REPLACE(TO_CHAR(ROUND(COALESCE(NULLIF(TRIM(product_price::TEXT), '')::NUMERIC, 0) / 100, 2), 'FM999999999.00'), '.', ',')
       END AS product_price_formatted
FROM public.limit_applications
WHERE success = TRUE AND graph = FALSE;
  `;

  try {
    const result = await client.query(selectQuery);

    for (const row of result.rows) {
      const totalSum = parseFloat(row.total_sum_formatted.replace(",", "."));
      const productPrice = parseFloat(
        row.product_price_formatted.replace(",", ".")
      );
      console.log(row.created_at, "cr");
      console.log(totalSum, "ts");
      console.log(productPrice, "ps");
      const percant =
        productPrice !== 0
          ? ((totalSum - productPrice) / productPrice) * 100
          : 0;
      console.log(percant, "pr");
      const formattedPercant = percant.toFixed(2).replace(".", ",");

      await limitGraphTable(
        row.application_id,
        row.created_at,
        row.provider,
        row.limit_formatted,
        row.manager,
        row.merchant,
        row.branch,
        row.fio,
        row.period,
        row.total_sum_formatted,
        row.product_price_formatted,
        formattedPercant
      );

      // Ma’lumotlar Google Sheet-ga yozilgach, `graph` ni `TRUE` qilib yangilaymiz
      await client.query(
        `UPDATE public.limit_applications SET graph = TRUE WHERE application_id = $1`,
        [row.application_id]
      );
    }
  } catch (error) {
    console.error("Xatolik:", error);
  }
}

async function createLimit() {
  try {
    const newApplications = await client2.query(
      `SELECT 
    a.id AS application_id,
    a.limit_amount, 
    a.approved_amount,
    d.amount_approved AS davr_amount,
    ba.approved_amount AS anor_amount,
    a.provider,
    a.period,
    a."user",
    cu.username AS phone,
    CONCAT(cu.name, ' ', cu.surname) AS fio,
    a.created_at,
    COALESCE(m.name, m2.name) AS merchant_name,
    b.name AS branch_name
FROM applications a
LEFT JOIN davr_applications d ON a.id = d.backend_application_id
LEFT JOIN billing_applications ba ON a.id = ba.backend_application_id
LEFT JOIN public.client_user cu ON a."user" = cu.id
LEFT JOIN merchant m ON a.merchant = m.id
LEFT JOIN branchs b ON a.branch = b.id
LEFT JOIN merchant m2 ON b."merchantId" = m2.id
WHERE a.created_at >= NOW() - INTERVAL '6 hour';
`
    );

    for (const app of newApplications.rows) {
      await client.query(
        `INSERT INTO limit_applications (application_id, "limit", anor_limit, davr_limit, provider,"user",phone,merchant,branch,fio,period) 
         VALUES ($1, $2, $3, $4, $5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (application_id) DO NOTHING`,
        [
          app.application_id,
          app.limit_amount,
          app.anor_amount,
          app.davr_amount,
          app.provider,
          app.user,
          app.phone,
          app.merchant_name,
          app.branch_name,
          app.fio,
          app.period,
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
    const selectQuery = `
    SELECT application_id, id,status 
FROM limit_applications 
WHERE status = 'new' 
AND created_at::DATE = CURRENT_DATE;
  `;
    const selectResult = await client.query(selectQuery);

    let messages = [];
    for (const app of selectResult.rows) {
      try {
        const application = await client2.query(
          `SELECT 
    a.limit_amount, 
    a.approved_amount, 
    d.amount_approved as davr_amount,
    ba.approved_amount as anor_amount,
    a.provider, 
    COALESCE(a.merchant, b."merchantId") AS merchant,
    a.branch, 
    m.name as merchant_name, 
    b.name as branch_name, 
    a.user, 
    TO_CHAR(a.updated_at, 'DD/MM/YYYY') AS updated_at,
    CASE
        WHEN COALESCE(NULLIF(a.limit_amount::TEXT, '')::NUMERIC, 0) = 0 THEN '0'
        ELSE REPLACE(TO_CHAR(ROUND(COALESCE(NULLIF(a.limit_amount::TEXT, '')::NUMERIC, 0) / 100, 2), 'FM999999999.00'), '.', ',')
    END AS limit_formated,
    CASE
        WHEN COALESCE(NULLIF(d.amount_approved::TEXT, '')::NUMERIC, 0) = 0 THEN '0'
        ELSE REPLACE(TO_CHAR(ROUND(COALESCE(NULLIF(d.amount_approved::TEXT, '')::NUMERIC, 0) / 100, 2), 'FM999999999.00'), '.', ',')
    END AS davr_formated,
    CASE
        WHEN COALESCE(NULLIF(ba.approved_amount::TEXT, '')::NUMERIC, 0) = 0 THEN '0'
        ELSE REPLACE(TO_CHAR(ROUND(COALESCE(NULLIF(ba.approved_amount::TEXT, '')::NUMERIC, 0) / 100, 2), 'FM999999999.00'), '.', ',')
    END AS anor_formated,
    cu.name, 
    cu.surname
FROM applications a
LEFT JOIN client_user cu ON a.user = cu.id
LEFT JOIN merchant m ON a.merchant = m.id
LEFT JOIN branchs b ON a.branch = b.id
LEFT JOIN davr_applications d ON a.id = d.backend_application_id
LEFT JOIN billing_applications ba ON a.id = ba.backend_application_id
WHERE a.id = $1;
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
            limit_formated,
            davr_formated,
            anor_formated
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

            // Holatni 'send'ga o'zgartirish
            const updatedLimit = await client.query(
              `UPDATE limit_applications 
               SET status = $1, "limit" = $3, anor_limit = $4, davr_limit = $5, provider = $6 
               WHERE id = $2 
               RETURNING status;`,
              ["send", app.id, limit_amount, anor_amount, davr_amount, provider]
            );

            // xabarni eccelga saqlash
            await limitTable(
              app.application_id,
              limit_formated,
              anor_formated,
              davr_formated,
              provider,
              merchantName,
              `${name} ${surname}`,
              updated_at
            );

            const inlineKeyboard = Markup.inlineKeyboard([
              [
                {
                  text: "Принять",
                  callback_data: `me_${app.application_id}_me`,
                },
              ],
            ]);

            // xabarni supportga yuborish
            await bot.telegram.sendMessage(config.gropId, message, {
              parse_mode: "HTML",
              reply_markup: inlineKeyboard.reply_markup,
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
            console.log("update", app);
            console.log("updated", `${updatedLimit.rows[0].status}`);
          }
        }
      } catch (error) {
        console.log(error.message);
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

// status menu
async function handleUserAction(ctx) {
  const applicationId = ctx.match[2];
  const messageId = ctx.update.callback_query.message.message_id;
  const user =
    ctx.update.callback_query.from.username ||
    ctx.update.callback_query.from.first_name;

  const inlineKeyboard = Markup.inlineKeyboard([
    [
      {
        text: "Оформлено",
        callback_data: `success_${applicationId}_${messageId}`,
      },
      {
        text: "Ошибка банка",
        callback_data: `bank_${applicationId}_${messageId}`,
      },
    ],
    [
      {
        text: "Тест",
        callback_data: `test_${applicationId}_${messageId}`,
      },
      {
        text: "Задолженность",
        callback_data: `debt_${applicationId}_${messageId}`,
      },
    ],
    [
      {
        text: "Карта на 18/24",
        callback_data: `card_${applicationId}_${messageId}`,
      },
      {
        text: "Дубль",
        callback_data: `two_${applicationId}_${messageId}`,
      },
    ],
    [
      {
        text: "Дата оплаты не подходит",
        callback_data: `datareject_${applicationId}_${messageId}`,
      },
    ],
    [
      {
        text: "Недостаточно Лимита",
        callback_data: `limit_${applicationId}_${messageId}`,
      },
    ],
    [
      {
        text: "Клиент отказался",
        callback_data: `reject_${applicationId}_${messageId}`,
      },
    ],
    [
      {
        text: "Другой партнер",
        callback_data: `drp_${applicationId}_${messageId}`,
      },
    ],
  ]);
  await client.query(
    `UPDATE limit_applications 
     SET manager = $1
     WHERE application_id = $2 
     RETURNING status;`,
    [user, applicationId]
  );

  await ctx.reply(`@${user} Заявка принята.`, {
    reply_to_message_id: messageId,
    parse_mode: "HTML",
  });
  await ctx.reply(`Пожалуйста, выберите:`, {
    reply_to_message_id: messageId,
    parse_mode: "HTML",
    reply_markup: inlineKeyboard.reply_markup,
  });
  await updateSheetManager(applicationId, user);
}

async function handleDrpAction(ctx) {
  const applicationId = ctx.match[2];
  // const messageId = ctx.update.callback_query.message.message_id;
  const message_id = ctx.match[3];

  const newInlineKeyboard = Markup.inlineKeyboard([
    [
      {
        text: "Payme Nasiya",
        callback_data: `drp1_${applicationId}_Payme Nasiy`,
      },
      { text: "Intend", callback_data: `drp1_${applicationId}_Intend` },
      { text: "Uzum", callback_data: `drp1_${applicationId}_Uzum` },
      { text: "Open", callback_data: `drp1_${applicationId}_Open` },
      { text: "Alif", callback_data: `drp1_${applicationId}_Alif` },
    ],
    [{ text: "Назад", callback_data: `back_${applicationId}_${message_id}` }],
  ]);

  await ctx.answerCbQuery("Выберите новый вариант партнера.");
  await ctx.editMessageText("Пожалуйста, выберите вариант:", {
    reply_markup: newInlineKeyboard.reply_markup,
  });
}

async function handleBackAction(ctx) {
  const applicationId = ctx.match[2];
  const message_id = ctx.match[3];

  const inlineKeyboard = Markup.inlineKeyboard([
    [
      {
        text: "Оформлено",
        callback_data: `success_${applicationId}_${message_id}`,
      },
      {
        text: "Ошибка банка",
        callback_data: `bank_${applicationId}_${message_id}`,
      },
    ],
    [
      {
        text: "Тест",
        callback_data: `test_${applicationId}_${message_id}`,
      },
      {
        text: "Задолженность",
        callback_data: `debt_${applicationId}_${message_id}`,
      },
    ],
    [
      {
        text: "Карта на 18/24",
        callback_data: `card_${applicationId}_${message_id}`,
      },
      {
        text: "Дубль",
        callback_data: `two_${applicationId}_${message_id}`,
      },
    ],
    [
      {
        text: "Дата оплаты не подходит",
        callback_data: `datareject_${applicationId}_${message_id}`,
      },
    ],
    [
      {
        text: "Недостаточно Лимита",
        callback_data: `limit_${applicationId}_${message_id}`,
      },
    ],
    [
      {
        text: "Клиент отказался",
        callback_data: `reject_${applicationId}_${message_id}`,
      },
    ],
    [
      {
        text: "Другой партнер",
        callback_data: `drp_${applicationId}_${message_id}`,
      },
    ],
  ]);

  await ctx.editMessageText("Пожалуйста, выберите вариант:", {
    reply_markup: inlineKeyboard.reply_markup,
  });
}

async function handleDrp1(ctx) {
  const applicationId = ctx.match[2];
  const partnerName = ctx.match[3];
  await client.query(
    `UPDATE limit_applications 
     SET limit_status = $1,partner=$3
     WHERE application_id = $2 
     RETURNING status;`,
    [state.drp, applicationId, partnerName]
  );
  await updateSheetPartner(applicationId, partnerName);
  await updateSheetStatus(applicationId, state.drp);
  await ctx.editMessageText(
    `Вы выбрали партнера для заявки ID ${applicationId}: ${partnerName}`
  );
}

async function handleStatusAction(ctx) {
  const status = ctx.match[1];
  const applicationId = ctx.match[2];
  const appStatus = state[status];
  await client.query(
    `UPDATE limit_applications 
     SET limit_status = $1
     WHERE application_id = $2 
     RETURNING status;`,
    [appStatus, applicationId]
  );
  await updateSheetStatus(applicationId, appStatus);
  await ctx.editMessageText(
    `📌 Ariza ID: ${applicationId} | Holat: ${appStatus}`
  );
}

export {
  cretaeApplicationsGrafik,
  sendApplicationGrafik,
  sendYesterdayStatics,
  createLimit,
  sendLimit,
  handleUserAction,
  handleDrpAction,
  handleBackAction,
  handleDrp1,
  handleStatusAction,
  sheetGraph,
};
