import { GoogleSpreadsheet } from "google-spreadsheet";
import config from "../config/index.js";
import getFormattedDate from "./formatedDate.js";

// Google Sheets autentifikatsiya qilish funksiyasi
const docs = {};

async function accessGoogleSheet(type) {
  try {
    if (!docs[type]) {
      const doc = new GoogleSpreadsheet(config[`SHEET_${type}`]);
      await doc.useServiceAccountAuth({
        client_email: config.client_email,
        private_key: config.private_key.replace(/\\n/g, "\n"),
      });
      await doc.loadInfo();
      docs[type] = doc;
    }
    return docs[type];
  } catch (err) {
    console.error(`Google Sheetsga ulanishda xato (${type}):`, err);
    throw err;
  }
}

async function updateOrInsertRow(sheet, applicationId, data) {
  const rows = await sheet.getRows();
  const existingRow = rows.find((row) => row.ID === applicationId.toString());
  if (existingRow) {
    Object.keys(data).forEach((key) => {
      if (!existingRow[key] || String(existingRow[key]).trim() === "") {
        existingRow[key] = data[key];
      }
    });
    await existingRow.save();
  } else {
    await sheet.addRow({ ID: applicationId, ...data });
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
  const doc = await accessGoogleSheet("GRAPH");
  await updateOrInsertRow(doc.sheetsByIndex[0], applicationId, {
    Merchant: merchant,
    Operator: operator,
    Bank: bank,
    Date: getFormattedDate(date),
    Link: link,
  });
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
  const doc = await accessGoogleSheet("LIMIT");
  await updateOrInsertRow(doc.sheetsByIndex[0], applicationId, {
    Limit: `'${limit}`,
    Anor_Limit: `'${anor_limit}`,
    Davr_Limit: `'${davr_limit}`,
    Bank: bank,
    Merchant: merchant,
    Client: user,
    Date: date,
  });
}

async function updateSheetStatus(applicationId, status) {
  const doc = await accessGoogleSheet("LIMIT");
  await updateOrInsertRow(doc.sheetsByIndex[0], applicationId, {
    Status: status,
  });
}

async function updateSheetPartner(applicationId, partner) {
  const doc = await accessGoogleSheet("LIMIT");
  await updateOrInsertRow(doc.sheetsByIndex[0], applicationId, {
    Partner: partner,
  });
}

async function updateSheetManager(applicationId, manager) {
  const doc = await accessGoogleSheet("LIMIT");
  await updateOrInsertRow(doc.sheetsByIndex[0], applicationId, {
    Manager: manager,
  });
}

async function updateSheetOver(
  applicationId,
  total_sum,
  product,
  period,
  phone
) {
  const doc = await accessGoogleSheet("LIMIT");
  await updateOrInsertRow(doc.sheetsByIndex[0], applicationId, {
    "Суммма Оформленных": `'${total_sum}`,
    product: product,
    period: period,
    phone: phone,
  });
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
  const doc = await accessGoogleSheet("LIMIT");
  await updateOrInsertRow(doc.sheetsById[2033090203], applicationId, {
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

async function saveGroupInfo(chatId, chatTitle) {
  const doc = await accessGoogleSheet("GROUPS");
  await updateOrInsertRow(doc.sheetsByIndex[0], chatId, {
    ChatID: chatId,
    GroupName: chatTitle,
    AddedAt: new Date().toISOString(),
  });
}

async function updateGroupStatus(chatId) {
  const doc = await accessGoogleSheet("GROUPS");
  await updateOrInsertRow(doc.sheetsByIndex[0], chatId, { Status: "Active" });
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
