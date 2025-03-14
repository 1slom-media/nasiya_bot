import { GoogleSpreadsheet } from "google-spreadsheet";
import config from "../config/index.js";
import getFormattedDate from "./formatedDate.js";

// grafik uchun
const doc = new GoogleSpreadsheet(config.SHEET_GRAPH);

async function accessGoogleSheet() {
  try {
    await doc.useServiceAccountAuth({
      client_email: config.client_email,
      private_key: config.private_key.replace(/\\n/g, "\n"),
    });
    await doc.loadInfo();
  } catch (error) {
    console.error("Google Sheets autentifikatsiya xatosi:", error);
    throw error;
  }
}

async function grafikTable(
  applicationId,
  merchant,
  operator,
  bank,
  date,
  link
) {
  await accessGoogleSheet();
  const sheet = doc.sheetsByIndex[0];

  const rows = await sheet.getRows();
  const existingRow = rows.find((row) => row.ID === applicationId.toString());

  if (existingRow) {
    existingRow.Timestamp = new Date().toISOString();
    await existingRow.save();
  } else {
    // Add new row if requestId is new
    await sheet.addRow({
      ID: applicationId,
      Merchant: merchant,
      Operator: operator,
      Bank: bank,
      Date: getFormattedDate(date),
      Link: link,
    });
  }
}

// limit uchun
const doc1 = new GoogleSpreadsheet(config.SHEET_LIMIT);

async function accessGoogleSheet1() {
  try {
    await doc1.useServiceAccountAuth({
      client_email: config.client_email,
      private_key: config.private_key.replace(/\\n/g, "\n"),
    });
    await doc1.loadInfo();
  } catch (error) {
    console.error("Google Sheets autentifikatsiya xatosi:", error);
    throw error;
  }
}

async function limitTable(
  applicationId,
  limit,
  anor_limit,
  davr_limit,
  bank,
  merchant,
  user,
  date
) {
  await accessGoogleSheet1();
  const sheet = doc1.sheetsByIndex[0];
  const rows = await sheet.getRows();
  const existingRow = rows.find((row) => row.ID === applicationId.toString());

  if (existingRow) {
    existingRow.Timestamp = new Date().toISOString();
    await existingRow.save();
  } else {
    // Add new row if requestId is new
    await sheet.addRow({
      ID: applicationId,
      Limit: `'${limit}`,
      Anor_Limit: `'${anor_limit}`,
      Davr_Limit: `'${davr_limit}`,
      Bank: bank,
      Merchant: merchant,
      Client: user,
      Date: date,
    });
  }
}

async function updateSheetStatus(applicationId, status) {
  await accessGoogleSheet1();
  const sheet = doc1.sheetsByIndex[0];

  // Hamma qatorlarni olish
  const rows = await sheet.getRows();

  // ID orqali qatorni topish
  const existingRow = rows.find((row) => row.ID === applicationId.toString());

  if (existingRow) {
    // Statusni faqat bo'sh bo'lsa yangilash
    if (!existingRow.Status || existingRow.Status.trim() === "") {
      existingRow.Status = status;
      await existingRow.save();
    } else {
      return;
    }
  } else {
    return;
  }
}
async function updateSheetPartner(applicationId, partner) {
  await accessGoogleSheet1();
  const sheet = doc1.sheetsByIndex[0];

  // Hamma qatorlarni olish
  const rows = await sheet.getRows();

  // ID orqali qatorni topish
  const existingRow = rows.find((row) => row.ID === applicationId.toString());

  if (existingRow) {
    // Statusni faqat bo'sh bo'lsa yangilash
    if (!existingRow.Partner || existingRow.Partner.trim() === "") {
      existingRow.Partner = partner;
      await existingRow.save();
    } else {
      return;
    }
  } else {
    return;
  }
}

async function updateSheetManager(applicationId, manager) {
  await accessGoogleSheet1();
  const sheet = doc1.sheetsByIndex[0];

  // Hamma qatorlarni olish
  const rows = await sheet.getRows();

  // ID orqali qatorni topish
  const existingRow = rows.find((row) => row.ID === applicationId.toString());

  if (existingRow) {
    // Statusni faqat bo'sh bo'lsa yangilash
    if (!existingRow.Manager || existingRow.Manager.trim() === "") {
      existingRow.Manager = manager;
      await existingRow.save();
    } else {
      return;
    }
  } else {
    return;
  }
}

async function updateSheetOver(
  applicationId,
  total_sum,
  product,
  period,
  phone
) {
  await accessGoogleSheet1();
  const sheet = doc1.sheetsByIndex[0];

  // Hamma qatorlarni olish
  const rows = await sheet.getRows();

  // ID orqali qatorni topish
  const existingRow = rows.find((row) => row.ID === applicationId.toString());

  if (existingRow) {
    existingRow["Суммма Оформленных"] = `'${total_sum}`;
    existingRow.product = product;
    existingRow.period = period;
    existingRow.phone = phone;
    await existingRow.save();
  } else {
    return;
  }
}

async function limitGraphTable(
  applicationId,
  date,
  bank,
  limit,
  manager,
  merchant,
  branch,
  user,
  period,
  total_sum,
  product_price,
  percant
) {
  await accessGoogleSheet1();
  const sheet = doc1.sheetsById[2033090203]; // GID orqali to‘g‘ri varaqqa murojaat qilish

  const rows = await sheet.getRows();
  const existingRow = rows.find((row) => row.ID === applicationId.toString());
  if (existingRow) {
    existingRow.Timestamp = new Date().toISOString();
    await existingRow.save();
  } else {
    await sheet.addRow({
      ID: applicationId,
      "Дата сделки": date,
      Банк: bank,
      "Сумма Лимита": `'${limit}`,
      "Менеджер AllGood": manager,
      Мерчант: merchant,
      Филиал: branch,
      "ФИО Клиента": user,
      "Период Рассрочки": period,
      "Сумма Товара": `'${product_price}`,
      "Сумма Рассрочки": `'${total_sum}`,
      "Наценка (%)": `${percant}%`,
    });
  }
}

// groups uchun
const doc2 = new GoogleSpreadsheet(config.SHEET_GROUPS);

async function accessGoogleSheet2() {
  try {
    await doc2.useServiceAccountAuth({
      client_email: config.client_email,
      private_key: config.private_key.replace(/\\n/g, "\n"),
    });
    await doc2.loadInfo();
  } catch (error) {
    console.error("Google Sheets autentifikatsiya xatosi:", error);
    throw error;
  }
}

async function saveGroupInfo(chatId, chatTitle) {
  await accessGoogleSheet2();
  const sheet = doc2.sheetsByIndex[0];

  const rows = await sheet.getRows();
  const existingRow = rows.find((row) => row.ChatID === chatId.toString());

  if (existingRow) {
    return;
  } else {
    await sheet.addRow({
      ChatID: chatId,
      GroupName: chatTitle,
      AddedAt: new Date().toISOString(),
    });
    return;
  }
}

async function updateGroupStatus(chatId) {
  await accessGoogleSheet2(); // Google Sheet-ga ulanish
  const sheet = doc2.sheetsByIndex[0]; // Google Sheets 1-varaqqa murojaat qilish
  const rows = await sheet.getRows(); // Google Sheets-dagi barcha qatorlarni olish

  const rowToUpdate = rows.find((row) => row.ChatID === chatId.toString());
  if (rowToUpdate) {
    rowToUpdate.Status = "Active";
    await rowToUpdate.save();
    return;
  } else {
    return;
  }
}

export {
  grafikTable,
  limitTable,
  updateSheetStatus,
  saveGroupInfo,
  updateSheetPartner,
  updateSheetManager,
  updateGroupStatus,
  limitGraphTable,
  updateSheetOver,
};
