/* ═══ CYPH — access log (Google Apps Script) ═══
   The web app behind LOG_URL in auth.js. One script, one sheet, every
   surface: the GitHub Pages deck, investors.cyph.city, events.cyph.city.

   Tabs
     access   timestamp | email | userAgent | referrer | href | viewed | meta
     timings  timestamp | email | reason | totalSec | timings | href | viewed | meta
     viewed   one column, every surface id ever seen; feeds the dropdown

   `viewed` is the surface id auth.js sends (deck/sept26, onepager,
   knicks002/partner, knicks002/invite ...). `meta` is whatever JSON the page
   attached (a guest id on an invite).

   Install / upgrade (the /exec URL does not change):
     1. Extensions -> Apps Script, replace the file contents with this file.
     2. Run `setup` once from the editor (authorize when asked). It writes the
        new header cells, creates the `viewed` tab and puts the dropdown on
        the `viewed` column of both tabs. Existing rows are not touched.
     3. Deploy -> Manage deployments -> pencil -> Version: New -> Deploy.
   Take a copy of the sheet first (File -> Make a copy) as the rollback. */

var SHEETS = {
  access: ["timestamp", "email", "userAgent", "referrer", "href", "viewed", "meta"],
  timings: ["timestamp", "email", "reason", "totalSec", "timings", "href", "viewed", "meta"],
};

/* auth.js posts text/plain so the browser sends no CORS preflight. */
function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    var viewed = typeof d.viewed === "string" ? d.viewed : "";
    if (viewed) ensureViewed_(ss, viewed);
    var meta = d.meta && typeof d.meta === "object" ? JSON.stringify(d.meta) : "";
    if (d.type === "timings") {
      var totalMs = 0;
      var timings = d.timings || {};
      Object.keys(timings).forEach(function (k) {
        totalMs += timings[k];
      });
      sheet_(ss, "timings").appendRow([
        d.timestamp,
        d.email,
        d.reason,
        Math.round(totalMs / 1000),
        JSON.stringify(timings),
        d.href,
        viewed,
        meta,
      ]);
    } else {
      sheet_(ss, "access").appendRow([d.timestamp, d.email, d.userAgent, d.referrer, d.href, viewed, meta]);
    }
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput("ok");
}

/* A GET is a health check, nothing more. */
function doGet() {
  return ContentService.createTextOutput("ok");
}

function sheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

/* The dropdown's source list. Appending here before the row append means a
   first-seen surface is already valid by the time its row lands. */
function ensureViewed_(ss, value) {
  var s = sheet_(ss, "viewed");
  var have = s
    .getRange("A2:A")
    .getValues()
    .map(function (r) {
      return r[0];
    })
    .filter(String);
  if (have.indexOf(value) === -1) s.appendRow([value]);
}

/* Run once from the editor. Idempotent. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var vs = sheet_(ss, "viewed");
  if (!vs.getRange("A1").getValue()) vs.getRange("A1").setValue("viewed");

  Object.keys(SHEETS).forEach(function (name) {
    var s = sheet_(ss, name);
    var want = SHEETS[name];
    var have = s.getRange(1, 1, 1, Math.max(s.getLastColumn(), 1)).getValues()[0];
    want.forEach(function (h, i) {
      if (have[i] !== h) s.getRange(1, i + 1).setValue(h);
    });
    var col = want.indexOf("viewed") + 1;
    /* allowInvalid on purpose: strict validation would make appendRow throw
       on a value the list does not have yet. ensureViewed_ keeps the list
       ahead of the rows anyway, so the filter dropdown is always complete. */
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(vs.getRange("A2:A500"), true)
      .setAllowInvalid(true)
      .build();
    s.getRange(2, col, s.getMaxRows() - 1, 1).setDataValidation(rule);
  });
}
