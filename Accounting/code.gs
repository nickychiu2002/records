const SHEET_RECORD = "Records";
const SHEET_SETTING = "Settings";

function doGet(e) {
  const action = e.parameter.action;

  if (action === "init") {
    return initData();
  }

  if (action === "summary") {
    return getMonthlySummary();
  }

  return ContentService.createTextOutput("OK");
}

// 初始化資料（類別 + 月統計）
function initData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingSheet = ss.getSheetByName(SHEET_SETTING);
  const recordSheet = ss.getSheetByName(SHEET_RECORD);

  const settings = settingSheet.getDataRange().getValues();
  settings.shift();

  const categories = {};
  settings.forEach(row => {
    const type = row[0];
    const cat = row[1];
    if (!categories[type]) categories[type] = [];
    categories[type].push(cat);
  });

  const summary = calcMonthly(recordSheet);

  return json({
    categories,
    summary,
    sheetUrl: ss.getUrl()
  });
}

// 新增記帳
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORD);

  sheet.appendRow([
    data.date,
    data.type,
    data.category,
    data.amount,
    data.note || ""
  ]);

  return json({ status: "success" });
}

// 計算本月
function getMonthlySummary() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORD);
  const data = sheet.getDataRange().getValues();
  data.shift();

  return json(calcMonthlyFromData(data));
}

function calcMonthly(sheet) {
  const data = sheet.getDataRange().getValues();
  data.shift();
  return calcMonthlyFromData(data);
}

function calcMonthlyFromData(data) {
  const now = new Date();
  const ym = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");

  let income = 0;
  let expense = 0;

  data.forEach(r => {
    if (!r[0]) return;
    const date = r[0].toString().slice(0, 7);

    if (date === ym) {
      if (r[1] === "收入") income += Number(r[3]);
      if (r[1] === "支出") expense += Number(r[3]);
    }
  });

  return { income, expense };
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}