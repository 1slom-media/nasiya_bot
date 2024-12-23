import { GoogleSpreadsheet } from "google-spreadsheet";
import config from "../config/index.js";
import getFormattedDate from "./formatedDate.js";

// grafik uchun
const doc = new GoogleSpreadsheet(
  "1Gx6ktv6RPT1UDXTYlNDwqmlwKch2meYaIYpByfaAnhc"
);

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
const doc1 = new GoogleSpreadsheet(
  "1iW2Frv6UGOOdGwXYhFrE68pGfgT2h9yL2Py5KAaGVo4"
);

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
      Limit:limit,
      Anor_Limit:anor_limit,
      Davr_Limit:davr_limit,
      Bank: bank,
      Merchant: merchant,
      Client: user,
      Date: getFormattedDate(date),
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
    // Statusni yangilash
    existingRow.Status = status;
    await existingRow.save();
  } else {
    console.log(`ID: ${applicationId} bo'lgan qator topilmadi.`);
  }
}


export { grafikTable,limitTable,updateSheetStatus};
