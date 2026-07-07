# איפיון — דשבורד ניהול תקציב ביתי (newpro)

> עודכן לאחר הרחבה מלאה (Ultraplan) — משקף את מה שבאמת נבנה, לא רק את
> השלד הראשוני.

## 1. רקע ומטרה

מערכת לוקלית (רצה בדפדפן, ללא שרת, ללא build) לניהול תקציב הוצאות הבית,
בהשראת המודל והפיצ'רים המקצועיים של Actual Budget: תקצוב מעטפתי מלא עם
carryover ו-to-budget, חשבונות + נהנים + התאמת בנק (reconciliation),
מנוע כללים (rules) לקטלוג אוטומטי, תנועות מתוזמנות/חוזרות, ו-5 דוחות
כולל תרשים Sankey. אין sync/multi-device — הכל ב-`localStorage` של
הדפדפן, קובץ `index.html` אחד שנפתח ישירות (`file://`), בלי npm, בלי
build step, בלי framework.

## 2. מושגים מרכזיים (בהשראת Actual)

| מושג ב-Actual                                         | מקביל כאן                                                            |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| Account                                               | **חשבון** — כולל "מחוץ לתקציב" (offBudget), סגירה/פתיחה, יתרה מחושבת |
| Payee                                                 | **נהנה** — נוצר אוטומטית מטקסט חופשי, או נהנה-מיוחד לצורך העברות     |
| Category Group / Category                             | **קבוצת קטגוריה / קטגוריה** — עם סדר, הסתרה, הערה, carryover         |
| Transaction (+ splits, transfers, cleared/reconciled) | **תנועה** — תומכת בפיצול לכמה קטגוריות ובהעברה בין חשבונות           |
| Budgeted / Spent / Leftover / To-Budget               | מנוע תקצוב מעטפתי מלא (ראה סעיף 6)                                   |
| Rule (conditions + actions)                           | **כלל** — קטלוג אוטומטי לפי שדה+אופרטור                              |
| Schedule (recurring transaction)                      | **תנועה מתוזמנת** — תדירות/מרווח/תאריך סיום, preview rows ב-register |
| Reports                                               | 5 דוחות: Net Worth, Cash Flow, Spending, Calendar heatmap, Sankey    |

## 3. מבנה נתונים (localStorage, מפתח `budget_app_state`, `version: 3`)

ישויות עיקריות: `accounts`, `payees`, `categoryGroups`, `categories`,
`transactions` (עם `accountId`, `payeeId`, `cleared`, `reconciled`,
`subtransactions?`, `transferId?`), `budgets` (`{month: {catId: amount}}`),
`income` (`{month: amount}`), `resetAvailable` (`{month: bool}`),
`rules`, `schedules`. מיגרציות סכימה אוטומטיות ב-`core/storage.js` כדי
לא לשבור נתונים קיימים כשגרסת ה-state עולה.

## 4. מסכי המערכת

1. **דשבורד** — סיכום חודשי + טבלת קטגוריות + גרף עוגה.
2. **חשבונות** — רשימה + יתרה מחושבת + סגירה/פתיחה/הוספה.
3. **תנועות (register)** — הוספה עם חשבון/נהנה/פיצול/העברה/cleared,
   סינון לפי חשבון, **התאמת חשבון (reconciliation)** מול יתרת דף חשבון,
   ושורות "תצוגה מקדימה" (preview) של תנועות מתוזמנות קרובות.
4. **תקצוב חודשי** — טבלה מקצועית: תפריט quick-budget (העתק חודש קודם /
   ממוצע 3-6-12 חודשים), תפריט balance (העבר לקטגוריה אחרת / כסה חריגה /
   toggle rollover), הערות, הסתר/הצג, קיפול קבוצות, **גרירה לסידור מחדש**.
5. **ניהול קטגוריות** — כולל פריטים מוסתרים (לצורך שחזור).
6. **כללים** — בניית תנאים (שדה+אופרטור לפי סוג) ופעולות, הרצה אוטומטית
   על תנועה חדשה + "הרץ על תנועות קיימות".
7. **תנועות מתוזמנות** — יומי/שבועי/חודשי/שנתי, התאמת סופ"ש (שישי/שבת),
   סטטוס (הושלם/הוחמץ/מגיע היום/קרוב/מתוזמן), פרסם/פרסם היום/דלג.
8. **דוחות** — 5 תת-דוחות עם ניווט משני, כולם ב-Canvas טהור.

## 5. חישובים מרכזיים (מנוע envelope, `domain/budget.js`)

```
spent[cat][month]     = |סכום תנועות שליליות בקטגוריה החודש| (כולל פיצולים, לא כולל transfers)
leftover[cat][month]  = budgeted - spent + carriedIn
  carriedIn = carryoverEnabled[cat] ? leftover[cat][month-1] : max(leftover[cat][month-1], 0)
toBudget[month]       = income + (resetAvailable[month] ? 0 : toBudget[month-1]) - totalBudgeted
accountBalance[acct]  = סכום כל התנועות (כולל transfers) עד לתאריך
netWorth[date]        = Σ accountBalance על כל החשבונות
```

## 6. מה במפורש מחוץ לתחום (הוחלט ב-Ultraplan, ראה `.claude/plans` להיסטוריה)

- **Goal templates DSL** של Actual (fixed/schedule/%/historical/limit/refill) —
  שפת-תבניות שלמה, לא שווה את המורכבות לתקציב ביתי פרטי.
- **Hold-amount-for-next-month** — הוחלף ב-toggle carryover פשוט.
- **link-schedule כפעולת rule** — נדחה, מורכב מדי ביחס לערך.
- **Multi-currency, bank-sync API, multi-device sync, encryption** — לא
  רלוונטי לאפליקציה לוקלית חד-משתמשית.
- Age of Money / Crossover / Formula-cards / Custom-report-builder —
  דוחות שוליים של Actual, לא מומשו.

## 7. מבנה קבצים

```
newpro/
  index.html
  css/style.css
  data/seed.js
  js/
    core/        # uid, dates (formatDate — לא toISOString, בעיית timezone!), storage (+ מיגרציות)
    domain/       # state, categories, accounts, payees, rules, transactions, budget, schedules, reports
    ui/
      components/  # dropdownMenu, modal (גנריים)
      charts/       # canvasCharts.js — כל סוגי הגרפים ביד, בלי ספרייה
      *View.js        # dashboard, accounts, register, budget, categories, rules, schedules, reports
    app.js             # bootstrap + כל ה-event listeners
```

**הערה קריטית לתחזוקה עתידית:** בכל מקום שמייצרים מחרוזת תאריך מ-`Date`,
להשתמש ב-`formatDate()` (שעון מקומי) ולא ב-`.toISOString()` — האחרון
ממיר ל-UTC ומזיז תאריכים יום אחורה באזורי זמן קדימים מ-UTC (כמו ישראל).
זה גרם לבאג אמיתי בחישוב התאריך הבא של תנועות מתוזמנות, שתוקן.
