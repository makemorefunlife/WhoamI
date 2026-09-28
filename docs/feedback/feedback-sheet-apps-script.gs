/**
 * Google Apps Script web app behind GOOGLE_SHEET_WEBHOOK_URL
 * (called from app/api/feedback/route.ts).
 *
 * - Appends rows by HEADER NAME, not column position, so adding fields never
 *   shifts existing columns.
 * - Automatically adds any missing header (e.g. analysis_category) to the
 *   right end of row 1. Existing rows are untouched; old rows simply have
 *   blank cells in the new columns.
 * - Keeps ONE master sheet — filter / pivot by analysis_category,
 *   relationship_type, report_type.
 *
 * Deploy: Extensions → Apps Script → paste → Deploy → Manage deployments →
 * edit the existing Web app deployment → Version: "New version" → Deploy.
 * (Editing the existing deployment keeps the same /exec URL, so the Vercel
 * env var does not change.)
 */

// Leave blank to use the first sheet; or set to your tab name, e.g. "Feedback".
var SHEET_NAME = "";

// Preferred column order when a column has to be created.
var FEEDBACK_COLUMNS = [
  "created_at",
  "analysis_category",
  "relationship_type",
  "report_type",
  "report_id",
  "locale",
  "rating",
  "feedback",
  "email",
  "founder_applied",
  "marketing_agreed",
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = (SHEET_NAME && ss.getSheetByName(SHEET_NAME)) || ss.getSheets()[0];

    var lastCol = sheet.getLastColumn();
    var headers =
      lastCol > 0
        ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
            return String(h).trim();
          })
        : [];

    // Every known column + any unexpected key in the payload.
    var wanted = FEEDBACK_COLUMNS.slice();
    Object.keys(data).forEach(function (k) {
      if (wanted.indexOf(k) === -1) wanted.push(k);
    });

    var missing = wanted.filter(function (k) {
      return headers.indexOf(k) === -1;
    });
    if (missing.length) {
      sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
      headers = headers.concat(missing);
    }

    var row = headers.map(function (h) {
      var v = data[h];
      if (v === undefined || v === null) return "";
      // Free text starting with = + - @ would be run as a formula.
      if (typeof v === "string" && /^[=+\-@]/.test(v)) return "'" + v;
      return v;
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
