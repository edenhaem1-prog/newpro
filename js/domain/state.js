// ה-store המרכזי. state הוא אובייקט יחיד בזיכרון, נשמר ל-localStorage אחרי כל שינוי.
let state = loadState();

function persist() {
  saveState(state);
}
