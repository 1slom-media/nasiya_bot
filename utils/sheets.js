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
      Limit: limit,
      Anor_Limit: anor_limit,
      Davr_Limit: davr_limit,
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
    // Statusni faqat bo'sh bo'lsa yangilash
    if (!existingRow.Status || existingRow.Status.trim() === "") {
      existingRow.Status = status;
      await existingRow.save();
    } else {
      console.log(
        `ID: ${applicationId} bo'lgan qatorning Status katagi allaqachon to'ldirilgan.`
      );
    }
  } else {
    console.log(`ID: ${applicationId} bo'lgan qator topilmadi.`);
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
      console.log(
        `ID: ${applicationId} bo'lgan qatorning Partner katagi allaqachon to'ldirilgan.`
      );
    }
  } else {
    console.log(`ID: ${applicationId} bo'lgan qator topilmadi.`);
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
      console.log(
        `ID: ${applicationId} bo'lgan qatorning manager katagi allaqachon to'ldirilgan.`
      );
    }
  } else {
    console.log(`ID: ${applicationId} bo'lgan qator topilmadi.`);
  }
}

// groups uchun
const doc2 = new GoogleSpreadsheet(
  "1bcYMZZ5uMgj7ayVTfdwt4gV-MbgFenFRMbyhqUgg-CY"
);

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
    console.log(`Guruh allaqachon saqlangan: ${chatTitle} (${chatId})`);
  } else {
    await sheet.addRow({
      ChatID: chatId,
      GroupName: chatTitle,
      AddedAt: new Date().toISOString(),
    });
    console.log(`Yangi guruh saqlandi: ${chatTitle} (${chatId})`);
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
    console.log(`Google Sheets yangilandi: ${chatId}`);
  } else {
    console.log(`Google Sheets-da mos chatId topilmadi: ${chatId}`);
  }
}


export { grafikTable, limitTable, updateSheetStatus, saveGroupInfo,updateSheetPartner,updateSheetManager,updateGroupStatus };
