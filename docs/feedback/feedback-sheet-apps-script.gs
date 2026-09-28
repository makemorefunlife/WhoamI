/**
 * Google Apps Script web app behind GOOGLE_SHEET_WEBHOOK_URL
 * (called from app/api/feedback/route.ts).
 *
 * Target is pinned explicitly — never getActiveSpreadsheet():
 *   spreadsheet  1ITb_LH_xyS2aBtQMVv7OGRgD88-Ryt9nUtzAxZh6HXA  ("Aha It's me feedback")
 *   tab          gid 0  ("시트1")
 *
 * - Writes by HEADER NAME, not column position. Existing Korean headers
 *   (일시, 이메일, 평가, 피드백내용, 파운더스 신청여부, 마케팅 동의여부) are
 *   kept and filled exactly as before (date in 일시, Y/N for the two flags).
 * - Report-context columns (analysis_category, relationship_type,
 *   report_type, report_id, locale) are added to the right end of row 1
 *   automatically the first time they are needed. Old rows are untouched.
 * - One master sheet — filter / pivot by analysis_category, relationship_type,
 *   report_type.
 *
 * Deploy: Extensions → Apps Script → paste → Save → Deploy → Manage
 * deployments → edit (pencil) the EXISTING Web app → Version: "New version"
 * → Deploy. Editing the existing deployment keeps the same /exec URL.
 */

var SPREADSHEET_ID = "1ITb_LH_xyS2aBtQMVv7OGRgD88-Ryt9nUtzAxZh6HXA";
var SHEET_GID = 0; // 시트1

// payload key → existing sheet header. Keys not listed use the key itself as header.
var HEADER_BY_KEY = {
  created_at: "일시",
  email: "이메일",
  rating: "평가",
  feedback: "피드백내용",
  founder_applied: "파운더스 신청여부",
  marketing_agreed: "마케팅 동의여부",
};

// Column order used only when a column has to be created.
var KEY_ORDER = [
  "created_at",
  "email",
  "rating",
  "feedback",
  "founder_applied",
  "marketing_agreed",
  "analysis_category",
  "relationship_type",
  "report_type",
  "report_id",
  "locale",
];

function getTargetSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === SHEET_GID) return sheets[i];
  }
  throw new Error("Feedback tab gid=" + SHEET_GID + " not found in " + SPREADSHEET_ID);
}

function headerFor_(key) {
  return HEADER_BY_KEY[key] || key;
}

function cellValue_(key, v) {
  if (v === undefined || v === null) return "";
  if (key === "created_at") {
    var d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  if (typeof v === "boolean") return v ? "Y" : "N";
  // Free text starting with = + - @ would be run as a formula.
  if (typeof v === "string" && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (!data.created_at) data.created_at = new Date().toISOString();
    var sheet = getTargetSheet_();

    var lastCol = sheet.getLastColumn();
    var headers =
      lastCol > 0
        ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
            return String(h).trim();
          })
        : [];

    var keys = KEY_ORDER.slice();
    Object.keys(data).forEach(function (k) {
      if (keys.indexOf(k) === -1) keys.push(k);
    });

    var missing = keys
      .map(headerFor_)
      .filter(function (h) {
        return headers.indexOf(h) === -1;
      });
    if (missing.length) {
      sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
      headers = headers.concat(missing);
    }

    var keyByHeader = {};
    keys.forEach(function (k) {
      keyByHeader[headerFor_(k)] = k;
    });
    var row = headers.map(function (h) {
      var k = keyByHeader[h];
      return k ? cellValue_(k, data[k]) : "";
    });
    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
      ContentService.MimeType.JSON,
    );
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
