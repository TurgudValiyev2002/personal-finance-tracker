const ENTRIES_KEY = "personal-finance-tracker-v1";
const REPORTS_KEY = "personal-finance-tracker-reports-v1";
const PREFS_KEY = "personal-finance-tracker-prefs-v1";
const ADVISOR_API_URL = window.FINANCE_ADVISOR_API_URL || "https://personal-finance-tracker-phi-liart.vercel.app/api/advisor";

// Private finance records must come from the signed-in cloud account only.
// This prevents a public browser from showing the previous user's cached values.
localStorage.removeItem(ENTRIES_KEY);
localStorage.removeItem(REPORTS_KEY);

const costCategories = [
  "Accommodation",
  "Transport",
  "Internet",
  "Food",
  "Restaurant",
  "Entertainment",
  "Travel",
  "Health",
  "Education",
  "Other"
];

const earningCategories = [
  "Salary",
  "Scholarship",
  "Freelance",
  "Family Support",
  "Refund",
  "Other"
];

const monthProfiles = {
  12: ["theme-december", "Christmas and New Year close", "Close the year carefully and keep the December report clean."],
  3: ["theme-march", "Novruz and spring reset", "A fresh month for checking habits and planning better savings."],
  9: ["theme-september", "Autumn planning", "September is a good month to compare routine spending and study costs."]
};

const seasonProfiles = {
  winter: ["theme-winter", "Winter budget", "Track fixed costs and avoid hidden small expenses."],
  spring: ["theme-spring", "Spring review", "Use this month to refresh spending habits."],
  summer: ["theme-summer", "Summer focus", "Watch travel, food, and entertainment spending carefully."],
  autumn: ["theme-autumn", "Autumn planning", "Good month for routine budget discipline."]
};

const state = {
  entries: [],
  reports: {},
  prefs: loadPrefs(),
  activeView: "dashboard",
  selectedMonth: monthKey(new Date()),
  auth: {
    configured: false,
    checked: false,
    user: null,
    profile: null,
    verified: false
  },
  applyingCloudData: false
};

const mobileQuery = window.matchMedia("(max-width: 760px)");
let cloudSaveTimer = null;

const els = {
  navItems: document.querySelectorAll(".nav-item"),
  pageTitle: document.getElementById("pageTitle"),
  monthSubtitle: document.getElementById("monthSubtitle"),
  monthInput: document.getElementById("monthInput"),
  prevMonth: document.getElementById("prevMonth"),
  nextMonth: document.getElementById("nextMonth"),
  themeToggle: document.getElementById("themeToggle"),
  monthHero: document.getElementById("monthHero"),
  monthHeroTitle: document.getElementById("monthHeroTitle"),
  monthHeroText: document.getElementById("monthHeroText"),
  monthThemeLabel: document.getElementById("monthThemeLabel"),
  reportStatus: document.getElementById("reportStatus"),
  reportHelp: document.getElementById("reportHelp"),
  submitMonth: document.getElementById("submitMonth"),
  seasonScene: document.getElementById("seasonScene"),
  entryActionRow: document.getElementById("entryActionRow"),
  openAddEntry: document.getElementById("openAddEntry"),
  lockNotice: document.getElementById("lockNotice"),
  entryDialog: document.getElementById("entryDialog"),
  entryForm: document.getElementById("entryForm"),
  closeDialog: document.getElementById("closeDialog"),
  saveEntry: document.getElementById("saveEntry"),
  editingId: document.getElementById("editingId"),
  formTitle: document.getElementById("formTitle"),
  modalModeChip: document.getElementById("modalModeChip"),
  modalSubtitle: document.getElementById("modalSubtitle"),
  cancelEdit: document.getElementById("cancelEdit"),
  entryDate: document.getElementById("entryDate"),
  amount: document.getElementById("amount"),
  category: document.getElementById("category"),
  description: document.getElementById("description"),
  typeRadios: document.querySelectorAll("input[name='type']"),
  monthCosts: document.getElementById("monthCosts"),
  monthEarnings: document.getElementById("monthEarnings"),
  monthSavings: document.getElementById("monthSavings"),
  costCount: document.getElementById("costCount"),
  earningCount: document.getElementById("earningCount"),
  savingsRate: document.getElementById("savingsRate"),
  sidebarSavings: document.getElementById("sidebarSavings"),
  savingsBarFill: document.getElementById("savingsBarFill"),
  savingsHint: document.getElementById("savingsHint"),
  quickTypeFilter: document.getElementById("quickTypeFilter"),
  recentMonthsTable: document.getElementById("recentMonthsTable"),
  dailyList: document.getElementById("dailyList"),
  dailyChart: document.getElementById("dailyChart"),
  filterType: document.getElementById("filterType"),
  filterCategory: document.getElementById("filterCategory"),
  filterFrom: document.getElementById("filterFrom"),
  filterTo: document.getElementById("filterTo"),
  clearFilters: document.getElementById("clearFilters"),
  transactionTable: document.getElementById("transactionTable"),
  statsRange: document.getElementById("statsRange"),
  openCostAnalysis: document.getElementById("openCostAnalysis"),
  openProfitAnalysis: document.getElementById("openProfitAnalysis"),
  analysisDialog: document.getElementById("analysisDialog"),
  closeAnalysisDialog: document.getElementById("closeAnalysisDialog"),
  analysisModeChip: document.getElementById("analysisModeChip"),
  analysisTitle: document.getElementById("analysisTitle"),
  analysisSubtitle: document.getElementById("analysisSubtitle"),
  analysisDialogBody: document.getElementById("analysisDialogBody"),
  insightGrid: document.getElementById("insightGrid"),
  primaryChartTitle: document.getElementById("primaryChartTitle"),
  secondaryChartTitle: document.getElementById("secondaryChartTitle"),
  categoryChart: document.getElementById("categoryChart"),
  trendChart: document.getElementById("trendChart"),
  extraStats: document.getElementById("extraStats"),
  exportJson: document.getElementById("exportJson"),
  exportCsv: document.getElementById("exportCsv"),
  importJson: document.getElementById("importJson"),
  advisorMode: document.getElementById("advisorMode"),
  advisorQuestion: document.getElementById("advisorQuestion"),
  askAdvisor: document.getElementById("askAdvisor"),
  advisorDataPreview: document.getElementById("advisorDataPreview"),
  advisorAnswer: document.getElementById("advisorAnswer"),
  copyAdvisorAnswer: document.getElementById("copyAdvisorAnswer"),
  authButton: document.getElementById("authButton"),
  authStatus: document.getElementById("authStatus"),
  authDialog: document.getElementById("authDialog"),
  closeAuthDialog: document.getElementById("closeAuthDialog"),
  authModeChip: document.getElementById("authModeChip"),
  authTitle: document.getElementById("authTitle"),
  authSubtitle: document.getElementById("authSubtitle"),
  authSetupNotice: document.getElementById("authSetupNotice"),
  loginForm: document.getElementById("loginForm"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  showRegister: document.getElementById("showRegister"),
  registerForm: document.getElementById("registerForm"),
  registerName: document.getElementById("registerName"),
  registerSurname: document.getElementById("registerSurname"),
  registerGender: document.getElementById("registerGender"),
  registerBirthDate: document.getElementById("registerBirthDate"),
  registerCountry: document.getElementById("registerCountry"),
  registerOriginCountry: document.getElementById("registerOriginCountry"),
  registerEmail: document.getElementById("registerEmail"),
  registerPassword: document.getElementById("registerPassword"),
  registerPassword2: document.getElementById("registerPassword2"),
  authFeedback: document.getElementById("authFeedback"),
  showLogin: document.getElementById("showLogin"),
  profilePanel: document.getElementById("profilePanel"),
  profileAvatar: document.getElementById("profileAvatar"),
  profileName: document.getElementById("profileName"),
  profileEmail: document.getElementById("profileEmail"),
  profileMeta: document.getElementById("profileMeta"),
  profilePageAvatar: document.getElementById("profilePageAvatar"),
  profilePageName: document.getElementById("profilePageName"),
  profilePageMeta: document.getElementById("profilePageMeta"),
  profileLogoutButton: document.getElementById("profileLogoutButton"),
  profileDetailsList: document.getElementById("profileDetailsList"),
  profileMonthlyTable: document.getElementById("profileMonthlyTable"),
  profileRecommendationList: document.getElementById("profileRecommendationList"),
  verifyNotice: document.getElementById("verifyNotice"),
  refreshVerification: document.getElementById("refreshVerification"),
  resendVerification: document.getElementById("resendVerification"),
  logoutButton: document.getElementById("logoutButton"),
  welcomeOverlay: document.getElementById("welcomeOverlay"),
  welcomeTitle: document.getElementById("welcomeTitle"),
  welcomeSubtitle: document.getElementById("welcomeSubtitle"),
  toast: document.getElementById("toast")
};

function loadEntries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ENTRIES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isValidEntry) : [];
  } catch {
    return [];
  }
}

function loadReports() {
  try {
    const parsed = JSON.parse(localStorage.getItem(REPORTS_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function loadPrefs() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    return {
      theme: parsed.theme === "dark" ? "dark" : "light"
    };
  } catch {
    return {
      theme: "light"
    };
  }
}

function saveEntries() {
  if (isLoggedIn()) {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(state.entries));
  }
  scheduleCloudSave();
}

function saveReports() {
  if (isLoggedIn()) {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(state.reports));
  }
  scheduleCloudSave();
}

function savePrefs() {
  localStorage.setItem(PREFS_KEY, JSON.stringify(state.prefs));
}

function scheduleCloudSave() {
  if (state.applyingCloudData) return;
  if (!isLoggedIn()) return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(saveFinanceToCloud, 650);
}

async function saveFinanceToCloud() {
  if (!isLoggedIn() || !window.financeAuth?.saveFinance) return;
  try {
    await window.financeAuth.saveFinance({
      entries: state.entries,
      reports: state.reports
    });
    renderAuth();
  } catch (error) {
    showToast(error.message || "Cloud save failed.");
  }
}

function isLoggedIn() {
  return Boolean(state.auth.configured && state.auth.user && state.auth.verified);
}

function requireLogin(reason = "to use this feature") {
  if (isLoggedIn()) return true;
  openAuthDialog("login", reason);
  return false;
}

function isValidEntry(entry) {
  return entry
    && typeof entry.id === "string"
    && ["cost", "earning"].includes(entry.type)
    && typeof entry.date === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)
    && Number.isFinite(Number(entry.amount))
    && Number(entry.amount) > 0
    && typeof entry.category === "string"
    && typeof entry.description === "string";
}

function money(value) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR"
  }).format(value || 0);
}

function monthKey(date) {
  const d = date instanceof Date ? date : new Date(`${date}T00:00:00`);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonthKey(month, delta) {
  const [year, m] = month.split("-").map(Number);
  return monthKey(new Date(year, m - 1 + delta, 1));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function selectedType() {
  return document.querySelector("input[name='type']:checked").value;
}

function categoriesForType(type) {
  return type === "earning" ? earningCategories : costCategories;
}

function populateCategorySelect(select, categories, includeAll = false) {
  select.innerHTML = "";
  if (includeAll) {
    select.appendChild(new Option("All categories", "all"));
  }
  categories.forEach((category) => select.appendChild(new Option(category, category)));
}

function setEntryType(type) {
  [...els.typeRadios].forEach((radio) => {
    radio.checked = radio.value === type;
  });
  populateCategorySelect(els.category, categoriesForType(type));
}

function monthBounds(month) {
  const [year, m] = month.split("-").map(Number);
  const start = localIso(new Date(year, m - 1, 1));
  const end = localIso(new Date(year, m, 0));
  return {
    start,
    end,
    days: Number(end.slice(8, 10))
  };
}

function localIso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthName(month) {
  const [year, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(year, m - 1, 1));
}

function monthIndex(month) {
  return Number(month.split("-")[1]);
}

function entriesInMonth(month = state.selectedMonth) {
  return state.entries.filter((entry) => entry.date.startsWith(month));
}

function summarize(entries) {
  const costs = entries.filter((entry) => entry.type === "cost").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const earnings = entries.filter((entry) => entry.type === "earning").reduce((sum, entry) => sum + Number(entry.amount), 0);
  return {
    costs,
    earnings,
    savings: earnings - costs,
    costCount: entries.filter((entry) => entry.type === "cost").length,
    earningCount: entries.filter((entry) => entry.type === "earning").length
  };
}

function isMonthSubmitted(month) {
  return Boolean(state.reports[month]?.submittedAt);
}

function canSubmitMonth(month) {
  return todayIso() > monthBounds(month).end && !isMonthSubmitted(month);
}

function applyTheme() {
  document.body.classList.toggle("dark", state.prefs.theme === "dark");
  els.themeToggle.textContent = state.prefs.theme === "dark" ? "Light mode" : "Dark mode";
}

function applyMonthTheme() {
  const month = monthIndex(state.selectedMonth);
  const season = month === 12 || month <= 2
    ? "winter"
    : month <= 5
      ? "spring"
      : month <= 8
        ? "summer"
        : "autumn";
  const profile = monthProfiles[month] || seasonProfiles[season];

  document.body.classList.remove(
    "theme-december",
    "theme-march",
    "theme-september",
    "theme-winter",
    "theme-spring",
    "theme-summer",
    "theme-autumn"
  );
  document.body.classList.add(profile[0]);
  els.monthThemeLabel.textContent = profile[1];
  els.monthHeroTitle.textContent = monthName(state.selectedMonth);
  els.monthHeroText.textContent = profile[2];
  els.monthSubtitle.textContent = `${monthName(state.selectedMonth)} report`;
  renderSeasonScene(month, season);
  els.monthHero.classList.add("changed");
  window.setTimeout(() => els.monthHero.classList.remove("changed"), 220);
}

function renderSeasonScene(month, season) {
  if (month >= 5 && month <= 8) {
    els.seasonScene.innerHTML = `<span class="season-object sun-orbit"></span>`;
    return;
  }

  if (month === 4 || month === 11) {
    els.seasonScene.innerHTML = [
      `<span class="season-object cloud" style="--x:12%;--duration:8s"></span>`,
      `<span class="season-object cloud" style="--x:54%;--duration:10s"></span>`,
      ...Array.from({ length: 24 }, (_, index) => {
        const x = (index * 29) % 100;
        const duration = 1.8 + (index % 5) * 0.22;
        const delay = -1 * (index % 8) * 0.3;
        return `<span class="season-object rain" style="--x:${x}%;--duration:${duration}s;--delay:${delay}s"></span>`;
      })
    ].join("");
    return;
  }

  const type = month === 12 || season === "winter"
    ? "snow"
    : month === 9 || season === "autumn"
      ? "leaf"
      : month === 3 || season === "spring"
        ? "flower"
        : "sun";
  const count = type === "snow" ? 26 : 18;
  els.seasonScene.innerHTML = Array.from({ length: count }, (_, index) => {
    const x = (index * 37) % 100;
    const size = type === "snow" ? 5 + (index % 6) : 9 + (index % 8);
    const duration = 7 + (index % 6);
    const delay = -1 * (index % 9);
    const drift = ((index % 2 === 0 ? 1 : -1) * (34 + (index % 5) * 13));
    return `<span class="season-object ${type}" style="--x:${x}%;--size:${size}px;--duration:${duration}s;--delay:${delay}s;--drift:${drift}px"></span>`;
  }).join("");
}

function renderReportState() {
  const submitted = isMonthSubmitted(state.selectedMonth);
  const canSubmit = canSubmitMonth(state.selectedMonth);
  const report = state.reports[state.selectedMonth];

  els.reportStatus.className = "report-status";
  els.submitMonth.disabled = !canSubmit;
  els.openAddEntry.disabled = submitted;

  if (submitted) {
    els.reportStatus.classList.add("locked");
    els.reportStatus.textContent = "Submitted and locked";
    els.reportHelp.textContent = `Submitted on ${formatDate(report.submittedAt.slice(0, 10))}. Transactions cannot be changed.`;
    els.submitMonth.textContent = "Report submitted";
    els.lockNotice.textContent = "This month is locked. Add, edit, and delete actions are disabled.";
    return;
  }

  if (canSubmit) {
    els.reportStatus.classList.add("open");
    els.reportStatus.textContent = "Ready to submit";
    els.reportHelp.textContent = "The month has ended. Submit when the transaction list is correct.";
    els.submitMonth.textContent = "Submit monthly report";
    els.lockNotice.textContent = "This month can still be changed until you submit the report.";
    return;
  }

  els.reportStatus.classList.add("waiting");
  els.reportStatus.textContent = "Open report";
  els.reportHelp.textContent = `Submission opens after ${formatDate(monthBounds(state.selectedMonth).end)}.`;
  els.submitMonth.textContent = "Submit monthly report";
  els.lockNotice.textContent = "This month is open for changes.";
}

function renderSummary() {
  const monthly = summarize(entriesInMonth());
  const allTime = summarize(state.entries);
  const savingsRate = monthly.earnings > 0 ? (monthly.savings / monthly.earnings) * 100 : 0;
  const barBase = Math.max(allTime.earnings, allTime.costs, 1);
  const savingsPercent = Math.max(0, Math.min(100, (allTime.savings / barBase) * 100));

  els.monthCosts.textContent = money(monthly.costs);
  els.monthEarnings.textContent = money(monthly.earnings);
  els.monthSavings.textContent = money(monthly.savings);
  els.monthSavings.style.color = monthly.savings >= 0 ? "var(--green)" : "var(--red)";
  els.costCount.textContent = `${monthly.costCount} cost ${monthly.costCount === 1 ? "entry" : "entries"}`;
  els.earningCount.textContent = `${monthly.earningCount} earning ${monthly.earningCount === 1 ? "entry" : "entries"}`;
  els.savingsRate.textContent = monthly.earnings > 0
    ? `${Math.round(savingsRate)}% of earnings saved`
    : "No earnings in this month";

  els.sidebarSavings.textContent = money(allTime.savings);
  els.sidebarSavings.style.color = allTime.savings >= 0 ? "#ffffff" : "#ffc8c0";
  els.savingsBarFill.style.width = `${savingsPercent}%`;
  els.savingsBarFill.style.background = allTime.savings >= 0 ? "#22c55e" : "#f87171";
  els.savingsHint.textContent = allTime.earnings > 0
    ? `${Math.round((allTime.savings / allTime.earnings) * 100)}% saved from all earnings`
    : "No entries yet.";
}

function renderRecentMonthsTable() {
  const months = Array.from({ length: 4 }, (_, index) => shiftMonthKey(state.selectedMonth, index - 3));
  els.recentMonthsTable.innerHTML = `
    <div class="section-heading compact-heading">
      <h3>Last 4 months</h3>
      <span class="section-note">Revenue, costs, and savings</span>
    </div>
    <div class="recent-table-wrap">
      <table class="recent-table">
        <thead>
          <tr><th>Month</th><th>Revenue</th><th>Cost</th><th>Savings</th></tr>
        </thead>
        <tbody>
          ${months.map((month) => {
            const summary = summarize(state.entries.filter((entry) => entry.date.startsWith(month)));
            const isCurrent = month === state.selectedMonth;
            return `
              <tr class="${isCurrent ? "current-month-row" : ""}">
                <td data-label="Month">${formatMonthTitle(month)}</td>
                <td data-label="Revenue">${money(summary.earnings)}</td>
                <td data-label="Cost">${money(summary.costs)}</td>
                <td data-label="Savings" class="${summary.savings >= 0 ? "positive-cell" : "negative-cell"}">${money(summary.savings)}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderDailyChart() {
  const { days } = monthBounds(state.selectedMonth);
  const daily = Array.from({ length: days }, (_, idx) => ({ day: idx + 1, cost: 0, earning: 0 }));
  entriesInMonth().forEach((entry) => {
    const day = Number(entry.date.slice(8, 10)) - 1;
    if (daily[day]) daily[day][entry.type] += Number(entry.amount);
  });
  const max = Math.max(...daily.flatMap((row) => [row.cost, row.earning]), 1);
  els.dailyChart.innerHTML = `
    <div class="chart-legend">
      <span><i class="legend-dot" style="background:var(--red)"></i>Costs</span>
      <span><i class="legend-dot" style="background:var(--green)"></i>Earnings</span>
      <span>Peak day: ${money(max)}</span>
    </div>
    <div class="chart-days">
      ${daily.map((row) => {
        const costHeight = Math.max(2, (row.cost / max) * 145);
        const earningHeight = Math.max(2, (row.earning / max) * 145);
        return `
          <div class="day-bar" title="Day ${row.day}: costs ${money(row.cost)}, earnings ${money(row.earning)}">
            <div class="day-bar-stack">
              <div class="bar-earning" style="height:${earningHeight}px"></div>
              <div class="bar-cost" style="height:${costHeight}px"></div>
            </div>
            <span class="bar-label">${row.day}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderDailyList() {
  const filter = els.quickTypeFilter.value;
  const entries = entriesInMonth()
    .filter((entry) => filter === "all" || entry.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!entries.length) {
    els.dailyList.innerHTML = `<p class="empty-state">No entries for this month and filter.</p>`;
    return;
  }

  const byDay = new Map();
  entries.forEach((entry) => {
    if (!byDay.has(entry.date)) byDay.set(entry.date, []);
    byDay.get(entry.date).push(entry);
  });

  els.dailyList.innerHTML = [...byDay.entries()].map(([date, dayEntries]) => {
    const daySummary = summarize(dayEntries);
    return `
      <section class="day-group">
        <div class="day-header">
          <span>${formatDate(date)}</span>
          <span>${money(daySummary.earnings - daySummary.costs)}</span>
        </div>
        <div class="day-items">${dayEntries.map(entryCard).join("")}</div>
      </section>
    `;
  }).join("");
}

function entryCard(entry) {
  const sign = entry.type === "earning" ? "+" : "-";
  return `
    <div class="entry-row">
      <span class="badge ${entry.type}">${entry.type}</span>
      <div class="entry-main">
        <strong>${escapeHtml(entry.description)}</strong>
        <small>${escapeHtml(entry.category)}</small>
      </div>
      <span class="amount ${entry.type}">${sign}${money(Number(entry.amount))}</span>
    </div>
  `;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function renderTransactions() {
  const entries = filteredTransactions().sort((a, b) => b.date.localeCompare(a.date));
  if (!entries.length) {
    els.transactionTable.innerHTML = `<tr><td colspan="6">No transactions match these filters.</td></tr>`;
    return;
  }

  els.transactionTable.innerHTML = entries.map((entry) => {
    const locked = isMonthSubmitted(monthKey(entry.date));
    const actions = locked
      ? `<span class="report-status locked">Locked</span>`
      : `<div class="action-buttons">
          <button class="tiny-button" type="button" data-action="edit" data-id="${entry.id}">Edit</button>
          <button class="tiny-button delete" type="button" data-action="delete" data-id="${entry.id}">Delete</button>
        </div>`;
    return `
      <tr>
        <td data-label="Date">${formatDate(entry.date)}</td>
        <td data-label="Type"><span class="badge ${entry.type}">${entry.type}</span></td>
        <td data-label="Category">${escapeHtml(entry.category)}</td>
        <td data-label="Description">${escapeHtml(entry.description)}</td>
        <td data-label="Amount" class="amount-col ${entry.type === "earning" ? "amount earning" : "amount cost"}">
          ${entry.type === "earning" ? "+" : "-"}${money(Number(entry.amount))}
        </td>
        <td data-label="Actions">${actions}</td>
      </tr>
    `;
  }).join("");
}

function filteredTransactions() {
  const type = els.filterType.value;
  const category = els.filterCategory.value;
  const from = els.filterFrom.value;
  const to = els.filterTo.value;
  return state.entries.filter((entry) => {
    if (type !== "all" && entry.type !== type) return false;
    if (category !== "all" && entry.category !== category) return false;
    if (from && entry.date < from) return false;
    if (to && entry.date > to) return false;
    return true;
  });
}

function entriesForStatsRange() {
  const range = els.statsRange.value;
  if (range === "all") return [...state.entries];
  if (range === "year") {
    const year = state.selectedMonth.slice(0, 4);
    return state.entries.filter((entry) => entry.date.startsWith(year));
  }
  return entriesInMonth();
}

function renderStatistics() {
  const entries = entriesForStatsRange();
  const summary = summarize(entries);
  const costEntries = entries.filter((entry) => entry.type === "cost");
  const earningEntries = entries.filter((entry) => entry.type === "earning");
  const byCategory = groupSum(costEntries, "category");
  const savingsRate = summary.earnings > 0 ? (summary.savings / summary.earnings) * 100 : 0;
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  const largestEntry = entries.slice().sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  const activeDays = new Set(entries.map((entry) => entry.date)).size;

  els.primaryChartTitle.textContent = "Category share";
  els.secondaryChartTitle.textContent = "Top categories by value";
  els.insightGrid.innerHTML = `
    ${insight("Total movement", money(summary.earnings + summary.costs), `${entries.length} transactions`)}
    ${insight("Top category", topCategory ? escapeHtml(topCategory[0]) : "None", topCategory ? money(topCategory[1]) : "No costs yet", "warn")}
    ${insight("Largest transaction", largestEntry ? money(largestEntry.amount) : "None", largestEntry ? escapeHtml(largestEntry.description) : "No entries yet")}
    ${insight("Savings rate", `${Math.round(savingsRate)}%`, `${activeDays} active day${activeDays === 1 ? "" : "s"}`, savingsRate >= 30 ? "good" : savingsRate >= 10 ? "warn" : "bad")}
  `;
  renderCategoryPie(byCategory, summary.costs);
  renderRankChart(els.trendChart, byCategory, summary.costs);
  els.extraStats.innerHTML = `
    <div class="stat-card-grid">
      ${statCard("General interpretation", generalInterpretation(summary), "This summary compares earnings, costs, and saved balance for the selected range.")}
      ${statCard("Open detailed windows", "Cost / Profit", "Use the buttons above to inspect focused plots in separate windows.")}
      ${statCard("Recommendation", buildRecommendations(entries, summary, byCategory)[0].title, buildRecommendations(entries, summary, byCategory)[0].text)}
    </div>
  `;
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date(`${date}T00:00:00`));
}

function renderCostAnalysis(entries, costEntries, earningEntries, summary, byCategory) {
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  const byDay = groupSum(costEntries, "date");
  const topDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
  const activeDays = new Set(entries.map((entry) => entry.date)).size || 1;
  const avgDailyCost = summary.costs / activeDays;
  const largestCost = costEntries.slice().sort((a, b) => Number(b.amount) - Number(a.amount))[0];

  els.primaryChartTitle.textContent = "Cost by category";
  els.secondaryChartTitle.textContent = "Daily spending intensity";
  els.insightGrid.innerHTML = `
    ${insight("Top cost category", topCategory ? escapeHtml(topCategory[0]) : "None", topCategory ? money(topCategory[1]) : "No costs yet", "warn")}
    ${insight("Most expensive day", topDay ? formatShortDate(topDay[0]) : "None", topDay ? money(topDay[1]) : "No costs yet", "bad")}
    ${insight("Average active-day cost", money(avgDailyCost), `${activeDays} active day${activeDays === 1 ? "" : "s"}`)}
    ${insight("Largest single cost", largestCost ? money(largestCost.amount) : "None", largestCost ? escapeHtml(largestCost.description) : "No costs yet")}
  `;
  renderRankChart(els.categoryChart, byCategory, summary.costs);
  renderDailyHeatChart(costEntries);
  els.extraStats.innerHTML = `
    <div class="stat-card-grid">
      ${statCard("Cost concentration", concentrationText(topCategory, summary.costs), "If one category dominates, that is usually the easiest place to control spending.")}
      ${statCard("Income coverage", summary.costs > 0 ? `${Math.round((summary.earnings / summary.costs) * 100)}%` : "No costs", "This compares earnings against costs for the selected range.")}
      ${statCard("Cost entries", String(costEntries.length), `${earningEntries.length} earning entries in the same range.`)}
    </div>
  `;
}

function renderProfitAnalysis(entries, summary) {
  const rate = summary.earnings > 0 ? (summary.savings / summary.earnings) * 100 : 0;
  const costShare = summary.earnings > 0 ? (summary.costs / summary.earnings) * 100 : 0;
  const rows = monthlyRows(entries);
  const bestMonth = rows.slice().sort((a, b) => (b.earnings - b.costs) - (a.earnings - a.costs))[0];
  const worstMonth = rows.slice().sort((a, b) => (a.earnings - a.costs) - (b.earnings - b.costs))[0];

  els.primaryChartTitle.textContent = "Profit split";
  els.secondaryChartTitle.textContent = "Monthly net balance";
  els.insightGrid.innerHTML = `
    ${insight("Net savings", money(summary.savings), "Earnings minus costs", summary.savings >= 0 ? "good" : "bad")}
    ${insight("Savings rate", `${Math.round(rate)}%`, `${Math.round(costShare)}% of earnings spent`, rate >= 30 ? "good" : rate >= 10 ? "warn" : "bad")}
    ${insight("Best month", bestMonth ? bestMonth.label : "None", bestMonth ? money(bestMonth.earnings - bestMonth.costs) : "No data")}
    ${insight("Weakest month", worstMonth ? worstMonth.label : "None", worstMonth ? money(worstMonth.earnings - worstMonth.costs) : "No data", worstMonth && worstMonth.earnings - worstMonth.costs < 0 ? "bad" : "")}
  `;
  renderProfitSplit(summary);
  renderNetBalanceChart(rows);
  els.extraStats.innerHTML = `
    <div class="stat-card-grid">
      ${statCard("Interpretation", summary.savings >= 0 ? "Positive balance" : "Negative balance", summary.savings >= 0 ? "The selected period produced savings." : "Costs are higher than earnings in this range.")}
      ${statCard("Cost pressure", `${Math.round(costShare)}%`, "Lower cost pressure means earnings are not being consumed quickly.")}
      ${statCard("Next target", targetText(rate), "A practical savings target gives the month a clearer direction.")}
    </div>
  `;
}

function renderCashFlowAnalysis(entries, summary) {
  const rows = monthlyRows(entries);
  const activeDays = activeDayRows(entries);
  const largestTransactions = entries.slice().sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5);

  els.primaryChartTitle.textContent = "Earnings vs costs by month";
  els.secondaryChartTitle.textContent = "Cumulative savings";
  els.insightGrid.innerHTML = `
    ${insight("Total inflow", money(summary.earnings), "All earning entries", "good")}
    ${insight("Total outflow", money(summary.costs), "All cost entries", summary.costs > summary.earnings ? "bad" : "warn")}
    ${insight("Active days", String(activeDays.length), "Days with at least one entry")}
    ${insight("Transactions", String(entries.length), "Records in selected range")}
  `;
  renderTrendChart(entries);
  renderCumulativeChart(rows);
  els.extraStats.innerHTML = `
    <div class="stat-card-grid">
      ${statCard("Most active days", renderInlineList(activeDays.slice(0, 5).map((row) => `${formatShortDate(row.date)}: ${row.count}`)), "These are the days where money movement happened most often.")}
      ${statCard("Largest transactions", renderInlineList(largestTransactions.map((entry) => `${entry.type}: ${money(entry.amount)}`)), "Large transactions usually explain most monthly movement.")}
      ${statCard("Cashflow note", cashflowText(summary), "This is a simple rule-based interpretation from your saved entries.")}
    </div>
  `;
}

function renderRecommendationAnalysis(entries, summary, byCategory) {
  const recommendations = buildRecommendations(entries, summary, byCategory);
  const byCategoryTotal = Object.values(byCategory).reduce((sum, value) => sum + value, 0);

  els.primaryChartTitle.textContent = "Spending priority";
  els.secondaryChartTitle.textContent = "Recommendation focus";
  els.insightGrid.innerHTML = `
    ${insight("Recommendation count", String(recommendations.length), "Based on current saved data")}
    ${insight("Savings health", savingsHealth(summary), money(summary.savings), summary.savings >= 0 ? "good" : "bad")}
    ${insight("Cost categories", String(Object.keys(byCategory).length), money(byCategoryTotal))}
    ${insight("Data strength", entries.length >= 10 ? "Good" : "Limited", `${entries.length} entries`, entries.length >= 10 ? "good" : "warn")}
  `;
  renderRankChart(els.categoryChart, byCategory, summary.costs);
  renderRecommendationFocus(recommendations);
  els.extraStats.innerHTML = `<div class="recommendation-list">${recommendations.map((item) => `
    <article class="recommendation">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.text)}</span>
    </article>
  `).join("")}</div>`;
}

function insight(label, value, note, tone = "") {
  return `<article class="insight-card ${tone}"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`;
}

function statCard(title, value, note) {
  return `<article class="stat-card"><h5>${title}</h5><p><strong>${value}</strong></p><p>${note}</p></article>`;
}

function renderCategoryPie(byCategory, total) {
  const rows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!rows.length || total <= 0) {
    els.categoryChart.innerHTML = `<p class="empty-state">No category data for this range.</p>`;
    return;
  }
  els.categoryChart.innerHTML = pieHtml(rows, total);
}

function pieHtml(rows, total) {
  const colors = ["#0f766e", "#128a57", "#b7791f", "#c24133", "#2563eb", "#7c3aed", "#0891b2", "#db2777"];
  let current = 0;
  const stops = rows.map(([category, value], index) => {
    const start = current;
    const end = current + (value / total) * 360;
    current = end;
    return `${colors[index % colors.length]} ${start}deg ${end}deg`;
  }).join(", ");
  return `
    <div class="pie-summary">
      <div class="pie-chart" style="background:conic-gradient(${stops})"></div>
      <div class="pie-legend">
        ${rows.map(([category, value], index) => `
          <div class="pie-legend-row">
            <span class="pie-dot" style="background:${colors[index % colors.length]}"></span>
            <strong>${escapeHtml(category)}</strong>
            <span>${Math.round((value / total) * 100)}% ${money(value)}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderRankChart(target, byCategory, total) {
  const rows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(...rows.map((row) => row[1]), 1);
  if (!rows.length) {
    target.innerHTML = `<p class="empty-state">No cost data for this range.</p>`;
    return;
  }
  target.innerHTML = rows.map(([category, value]) => {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return rankRowHtml(category, value, max, `${pct}%<br>${money(value)}`);
  }).join("");
}

function rankRowHtml(label, value, max, rightText = money(value), color = "linear-gradient(90deg, var(--teal), color-mix(in srgb, var(--teal) 70%, #22c55e))") {
  return `
    <div class="rank-row">
      <strong>${escapeHtml(label)}</strong>
      <div class="rank-track"><div class="rank-fill" style="width:${max > 0 ? (Math.abs(value) / max) * 100 : 0}%;background:${color}"></div></div>
      <span>${rightText}</span>
    </div>
  `;
}

function renderTrendChart(entries) {
  const rows = monthlyRows(entries);
  const max = Math.max(...rows.flatMap((row) => [row.costs, row.earnings]), 1);
  if (!rows.length) {
    els.trendChart.innerHTML = `<p class="empty-state">No cash flow data for this range.</p>`;
    return;
  }
  els.trendChart.innerHTML = `
    <div class="chart-legend">
      <span><i class="legend-dot" style="background:var(--green)"></i>Earnings</span>
      <span><i class="legend-dot" style="background:var(--red)"></i>Costs</span>
    </div>
    <div class="trend-bars">
      ${rows.map((row) => `
        <div class="trend-item" title="${row.label}: earnings ${money(row.earnings)}, costs ${money(row.costs)}">
          <div class="trend-pair">
            <div class="trend-income" style="height:${Math.max(3, (row.earnings / max) * 185)}px"></div>
            <div class="trend-cost" style="height:${Math.max(3, (row.costs / max) * 185)}px"></div>
          </div>
          <span class="trend-label">${row.short}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderDailyHeatChart(costEntries) {
  const byDate = groupSum(costEntries, "date");
  const rows = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0]));
  const max = Math.max(...rows.map((row) => row[1]), 1);
  if (!rows.length) {
    els.trendChart.innerHTML = `<p class="empty-state">No daily cost data for this range.</p>`;
    return;
  }
  els.trendChart.innerHTML = `<div class="heat-grid">${rows.map(([date, value]) => `
    <div class="heat-cell active" style="--intensity:${Math.max(18, Math.round((value / max) * 86))}%" title="${formatDate(date)}: ${money(value)}">
      ${formatShortDate(date)}
    </div>
  `).join("")}</div>`;
}

function renderProfitSplit(summary) {
  const total = Math.max(summary.earnings, summary.costs, 1);
  els.categoryChart.innerHTML = `
    <div class="mini-bars">
      <div class="mini-row"><strong>Earnings</strong><div class="rank-track"><div class="rank-fill" style="width:${(summary.earnings / total) * 100}%"></div></div><span>${money(summary.earnings)}</span></div>
      <div class="mini-row"><strong>Costs</strong><div class="rank-track"><div class="rank-fill" style="width:${(summary.costs / total) * 100}%;background:var(--red)"></div></div><span>${money(summary.costs)}</span></div>
      <div class="mini-row"><strong>Savings</strong><div class="rank-track"><div class="rank-fill" style="width:${Math.max(0, (summary.savings / total) * 100)}%;background:var(--green)"></div></div><span>${money(summary.savings)}</span></div>
    </div>
  `;
}

function renderNetBalanceChart(rows) {
  const max = Math.max(...rows.map((row) => Math.abs(row.earnings - row.costs)), 1);
  if (!rows.length) {
    els.trendChart.innerHTML = `<p class="empty-state">No monthly balance data for this range.</p>`;
    return;
  }
  els.trendChart.innerHTML = `<div class="rank-chart">${rows.map((row) => {
    const net = row.earnings - row.costs;
    return `<div class="rank-row">
      <strong>${row.short}</strong>
      <div class="rank-track"><div class="rank-fill" style="width:${(Math.abs(net) / max) * 100}%;background:${net >= 0 ? "var(--green)" : "var(--red)"}"></div></div>
      <span>${money(net)}</span>
    </div>`;
  }).join("")}</div>`;
}

function renderCumulativeChart(rows) {
  let cumulative = 0;
  const cumRows = rows.map((row) => {
    cumulative += row.earnings - row.costs;
    return { label: row.short, value: cumulative };
  });
  const max = Math.max(...cumRows.map((row) => Math.abs(row.value)), 1);
  if (!cumRows.length) {
    els.trendChart.innerHTML = `<p class="empty-state">No cumulative data for this range.</p>`;
    return;
  }
  els.trendChart.innerHTML = `<div class="rank-chart">${cumRows.map((row) => `
    <div class="rank-row">
      <strong>${row.label}</strong>
      <div class="rank-track"><div class="rank-fill" style="width:${(Math.abs(row.value) / max) * 100}%;background:${row.value >= 0 ? "var(--green)" : "var(--red)"}"></div></div>
      <span>${money(row.value)}</span>
    </div>
  `).join("")}</div>`;
}

function renderRecommendationFocus(recommendations) {
  const weights = recommendations.map((item, index) => ({ label: `R${index + 1}`, value: item.priority }));
  const max = Math.max(...weights.map((row) => row.value), 1);
  els.trendChart.innerHTML = `<div class="rank-chart">${weights.map((row) => `
    <div class="rank-row">
      <strong>${row.label}</strong>
      <div class="rank-track"><div class="rank-fill" style="width:${(row.value / max) * 100}%"></div></div>
      <span>${row.value}/10</span>
    </div>
  `).join("")}</div>`;
}

function openAnalysisWindow(type) {
  const entries = entriesForStatsRange();
  const summary = summarize(entries);
  const costEntries = entries.filter((entry) => entry.type === "cost");
  const byCategory = groupSum(costEntries, "category");
  const rows = monthlyRows(entries);
  const rangeLabel = els.statsRange.options[els.statsRange.selectedIndex].textContent.toLowerCase();

  els.analysisDialog.classList.toggle("cost-mode", type === "cost");
  els.analysisDialog.classList.toggle("profit-mode", type === "profit");
  els.analysisModeChip.className = `mode-chip ${type === "profit" ? "add" : "edit"}`;
  els.analysisModeChip.textContent = type === "profit" ? "Profit mode" : "Cost mode";
  els.analysisTitle.textContent = type === "profit" ? "Profit analysis" : "Cost analysis";
  els.analysisSubtitle.textContent = `Detailed ${type} statistics for ${rangeLabel}.`;
  els.analysisDialogBody.innerHTML = type === "profit"
    ? profitWindowHtml(entries, summary, rows)
    : costWindowHtml(costEntries, byCategory, summary);
  els.analysisDialog.showModal();
}

function costWindowHtml(costEntries, byCategory, summary) {
  const total = summary.costs;
  const rows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(...rows.map((row) => row[1]), 1);
  const largestCosts = costEntries.slice().sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 7);
  const byDate = groupSum(costEntries, "date");
  const activeDays = Object.entries(byDate).sort((a, b) => b[1] - a[1]);
  const maxDay = Math.max(...activeDays.map((row) => row[1]), 1);
  const avgCost = costEntries.length ? total / costEntries.length : 0;

  return `
    <div class="insight-grid">
      ${insight("Total costs", money(total), `${costEntries.length} cost entries`, total > 0 ? "warn" : "")}
      ${insight("Average cost entry", money(avgCost), "Mean value per cost")}
      ${insight("Cost categories", String(rows.length), "Unique spending groups")}
      ${insight("Largest cost", largestCosts[0] ? money(largestCosts[0].amount) : "None", largestCosts[0] ? escapeHtml(largestCosts[0].description) : "No costs")}
    </div>
    <div class="analysis-grid">
      <section class="analysis-card"><h4>Cost share pie</h4>${rows.length ? pieHtml(rows.slice(0, 8), total) : `<p class="empty-state">No costs yet.</p>`}</section>
      <section class="analysis-card"><h4>Top categories by value</h4><div class="rank-chart">${rows.length ? rows.slice(0, 8).map(([label, value]) => rankRowHtml(label, value, maxCategory, `${Math.round((value / total) * 100)}% ${money(value)}`)).join("") : `<p class="empty-state">No categories yet.</p>`}</div></section>
      <section class="analysis-card"><h4>Most expensive days</h4><div class="rank-chart">${activeDays.length ? activeDays.slice(0, 8).map(([date, value]) => rankRowHtml(formatShortDate(date), value, maxDay, money(value), "var(--red)")).join("") : `<p class="empty-state">No daily costs yet.</p>`}</div></section>
      <section class="analysis-card"><h4>Largest cost entries</h4><div class="rank-chart">${largestCosts.length ? largestCosts.map((entry) => rankRowHtml(entry.description, Number(entry.amount), Number(largestCosts[0].amount), `${formatShortDate(entry.date)} ${money(entry.amount)}`, "var(--amber)")).join("") : `<p class="empty-state">No cost entries yet.</p>`}</div></section>
    </div>
  `;
}

function profitWindowHtml(entries, summary, rows) {
  const rate = summary.earnings > 0 ? (summary.savings / summary.earnings) * 100 : 0;
  const costPressure = summary.earnings > 0 ? (summary.costs / summary.earnings) * 100 : 0;
  const netRows = rows.map((row) => ({ ...row, net: row.earnings - row.costs }));
  const maxNet = Math.max(...netRows.map((row) => Math.abs(row.net)), 1);
  const recs = buildRecommendations(entries, summary, groupSum(entries.filter((entry) => entry.type === "cost"), "category"));
  let cumulative = 0;
  const cumulativeRows = netRows.map((row) => {
    cumulative += row.net;
    return { label: row.short, value: cumulative };
  });
  const maxCum = Math.max(...cumulativeRows.map((row) => Math.abs(row.value)), 1);

  return `
    <div class="insight-grid">
      ${insight("Net savings", money(summary.savings), "Earnings minus costs", summary.savings >= 0 ? "good" : "bad")}
      ${insight("Savings rate", `${Math.round(rate)}%`, `${Math.round(costPressure)}% of earnings spent`, rate >= 30 ? "good" : rate >= 10 ? "warn" : "bad")}
      ${insight("Total earnings", money(summary.earnings), "Income side", "good")}
      ${insight("Total costs", money(summary.costs), "Spending side", summary.costs > summary.earnings ? "bad" : "warn")}
    </div>
    <div class="analysis-grid">
      <section class="analysis-card"><h4>Earnings, costs, savings split</h4>${profitSplitHtml(summary)}</section>
      <section class="analysis-card"><h4>Net balance by month</h4><div class="rank-chart">${netRows.length ? netRows.map((row) => rankRowHtml(row.short, row.net, maxNet, money(row.net), row.net >= 0 ? "var(--green)" : "var(--red)")).join("") : `<p class="empty-state">No monthly data yet.</p>`}</div></section>
      <section class="analysis-card"><h4>Cumulative savings</h4><div class="rank-chart">${cumulativeRows.length ? cumulativeRows.map((row) => rankRowHtml(row.label, row.value, maxCum, money(row.value), row.value >= 0 ? "var(--green)" : "var(--red)")).join("") : `<p class="empty-state">No cumulative data yet.</p>`}</div></section>
      <section class="analysis-card"><h4>AI recommendations</h4><div class="recommendation-list">${recs.map((item) => `<article class="recommendation"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.text)}</span></article>`).join("")}</div></section>
    </div>
  `;
}

function profitSplitHtml(summary) {
  const total = Math.max(summary.earnings, summary.costs, Math.abs(summary.savings), 1);
  return `
    <div class="mini-bars">
      ${rankRowHtml("Earnings", summary.earnings, total, money(summary.earnings), "var(--green)")}
      ${rankRowHtml("Costs", summary.costs, total, money(summary.costs), "var(--red)")}
      ${rankRowHtml("Savings", summary.savings, total, money(summary.savings), summary.savings >= 0 ? "var(--green)" : "var(--red)")}
    </div>
  `;
}

function monthlyRows(entries) {
  const byMonth = new Map();
  entries.forEach((entry) => {
    const key = entry.date.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, { key, label: monthName(key), short: key.slice(5), costs: 0, earnings: 0 });
    byMonth.get(key)[entry.type === "earning" ? "earnings" : "costs"] += Number(entry.amount);
  });
  return [...byMonth.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function activeDayRows(entries) {
  const counts = entries.reduce((acc, entry) => {
    acc[entry.date] = (acc[entry.date] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.count - a.count);
}

function buildRecommendations(entries, summary, byCategory) {
  const recs = [];
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  const rate = summary.earnings > 0 ? (summary.savings / summary.earnings) * 100 : 0;
  const costPressure = summary.earnings > 0 ? (summary.costs / summary.earnings) * 100 : 0;

  if (!entries.length) {
    return [
      { title: "Add more data first", text: "Recommendations become useful after several costs and earnings are recorded.", priority: 8 },
      { title: "Start with categories", text: "Use categories consistently so spending patterns become visible.", priority: 6 },
      { title: "Export backups", text: "Because the app stores data in this browser, keep a JSON backup after important updates.", priority: 5 }
    ];
  }

  if (topCategory && summary.costs > 0 && topCategory[1] / summary.costs > 0.4) {
    recs.push({
      title: `Control ${topCategory[0]} spending`,
      text: `${topCategory[0]} is ${Math.round((topCategory[1] / summary.costs) * 100)}% of your costs. Small reductions here will matter more than many tiny changes elsewhere.`,
      priority: 9
    });
  }

  if (rate < 10 && summary.earnings > 0) {
    recs.push({
      title: "Savings rate is low",
      text: `Your current savings rate is ${Math.round(rate)}%. Try setting a minimum target before flexible spending starts.`,
      priority: 8
    });
  } else if (rate >= 30) {
    recs.push({
      title: "Savings rate is strong",
      text: `You saved about ${Math.round(rate)}% of earnings. The main goal is consistency, not aggressive cuts.`,
      priority: 6
    });
  }

  if (costPressure > 80) {
    recs.push({
      title: "Costs are consuming most earnings",
      text: `${Math.round(costPressure)}% of earnings went to costs. Review recurring or fixed expenses first.`,
      priority: 8
    });
  }

  if (entries.length < 10) {
    recs.push({
      title: "Data is still limited",
      text: "With fewer than 10 entries, treat these recommendations as early signals rather than final conclusions.",
      priority: 7
    });
  }

  recs.push({
    title: "Keep descriptions specific",
    text: "Descriptions like 'lunch', 'metro ticket', or 'hostel' make later review much more useful than generic text.",
    priority: 5
  });

  return recs.slice(0, 5);
}

function concentrationText(topCategory, total) {
  if (!topCategory || total <= 0) return "No cost pattern yet";
  return `${Math.round((topCategory[1] / total) * 100)}% in ${topCategory[0]}`;
}

function targetText(rate) {
  if (rate >= 30) return "Protect current behavior";
  if (rate >= 10) return "Push toward 30%";
  return "Reach 10% first";
}

function cashflowText(summary) {
  if (summary.earnings === 0 && summary.costs === 0) return "No movement yet";
  if (summary.savings >= 0) return "Cash flow is positive";
  return "Cash flow is negative";
}

function savingsHealth(summary) {
  if (summary.earnings === 0) return "Unknown";
  const rate = (summary.savings / summary.earnings) * 100;
  if (rate >= 30) return "Strong";
  if (rate >= 10) return "Okay";
  return "Weak";
}

function generalInterpretation(summary) {
  if (summary.earnings === 0 && summary.costs === 0) return "No data yet";
  if (summary.earnings === 0) return "Only costs recorded";
  if (summary.savings >= 0) return "Positive period";
  return "Costs exceed earnings";
}

function renderInlineList(items) {
  if (!items.length) return "No data";
  return items.map(escapeHtml).join("<br>");
}

function renderAdvisor() {
  if (!els.advisorQuestion) return;
  renderAdvisorPreview();
}

function advisorEntries() {
  return state.entries.slice();
}

function buildAdvisorContext(entries) {
  const summary = summarize(entries);
  const costs = entries.filter((entry) => entry.type === "cost");
  const earnings = entries.filter((entry) => entry.type === "earning");
  const byCategory = groupSum(costs, "category");
  const byMonth = monthlyRows(entries);
  const topCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const largestCosts = costs.slice().sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 8);
  const sampleEntries = entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60);

  return {
    range: "automatic-all-data",
    selectedMonth: state.selectedMonth,
    filters: {
      note: "No manual filters were applied. The user question should decide which months, dates, categories, or descriptions matter."
    },
    summary,
    counts: {
      entries: entries.length,
      costEntries: costs.length,
      earningEntries: earnings.length,
      activeDays: new Set(entries.map((entry) => entry.date)).size
    },
    topCategories: topCategories.map(([category, amount]) => ({ category, amount })),
    monthly: byMonth.map((row) => ({
      month: row.label,
      earnings: row.earnings,
      costs: row.costs,
      savings: row.earnings - row.costs
    })),
    largestCosts: largestCosts.map((entry) => ({
      date: entry.date,
      category: entry.category,
      description: entry.description,
      amount: entry.amount
    })),
    entries: sampleEntries.map((entry) => ({
      date: entry.date,
      type: entry.type,
      category: entry.category,
      description: entry.description,
      amount: entry.amount
    }))
  };
}

function renderAdvisorPreviewLegacy() {
  const entries = advisorEntries();
  const context = buildAdvisorContext(entries);
  const monthEntries = entries.filter((entry) => entry.date.startsWith(state.selectedMonth));
  const monthSummary = summarize(monthEntries);
  const rate = context.summary.earnings > 0 ? Math.round((context.summary.savings / context.summary.earnings) * 100) : 0;
  els.advisorDataPreview.innerHTML = `
    <strong>${context.counts.entries}</strong> entries used<br>
    Costs: <strong>${money(context.summary.costs)}</strong> · Earnings: <strong>${money(context.summary.earnings)}</strong> · Savings: <strong>${money(context.summary.savings)}</strong><br>
    Savings rate: <strong>${rate}%</strong> · Active days: <strong>${context.counts.activeDays}</strong>
  `;
  els.advisorMode.className = "report-status open";
  els.advisorMode.textContent = "Advisor ready";
}

function renderAdvisorPreview() {
  const entries = advisorEntries();
  const context = buildAdvisorContext(entries);
  const monthEntries = entries.filter((entry) => entry.date.startsWith(state.selectedMonth));
  const monthSummary = summarize(monthEntries);
  const rate = context.summary.earnings > 0 ? Math.round((context.summary.savings / context.summary.earnings) * 100) : 0;
  els.advisorDataPreview.innerHTML = `
    <div><strong>${context.counts.entries}</strong><span>Total entries scanned</span></div>
    <div><strong>${money(monthSummary.savings)}</strong><span>${formatMonthTitle(state.selectedMonth)} savings</span></div>
    <div><strong>${money(context.summary.costs)}</strong><span>All-time costs</span></div>
    <div><strong>${rate}%</strong><span>All-time savings rate</span></div>
  `;
  els.advisorMode.className = "report-status open";
  els.advisorMode.textContent = "Automatic context ready";
}

async function askAdvisor() {
  if (!requireLogin("to use AI recommendations")) return;

  const question = els.advisorQuestion.value.trim();
  if (!question) {
    showToast("Please write a question first.");
    return;
  }

  const context = buildAdvisorContext(advisorEntries());
  els.askAdvisor.disabled = true;
  els.advisorAnswer.classList.add("loading");
  els.advisorAnswer.textContent = "Preparing recommendation...";

  try {
    els.advisorAnswer.textContent = "Calling AI advisor...";
    const answer = await callAdvisorApi(question, context);
    els.advisorAnswer.classList.remove("loading");
    els.advisorAnswer.textContent = answer;
    els.advisorMode.className = "report-status open";
    els.advisorMode.textContent = "AI answer";
  } catch (error) {
    const fallback = localAdvisorAnswer(question, context);
    els.advisorAnswer.classList.remove("loading");
    els.advisorAnswer.textContent = fallback;
    els.advisorMode.className = "report-status waiting";
    els.advisorMode.textContent = "Local fallback answer";
  } finally {
    els.askAdvisor.disabled = false;
  }
}

async function callAdvisorApi(question, context) {
  const response = await fetch(ADVISOR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      question,
      context
    })
  });

  if (!response.ok) {
    throw new Error(`Advisor API failed with ${response.status}`);
  }
  const data = await response.json();
  const answer = data?.answer;
  if (!answer) throw new Error("No answer returned");
  return answer.trim();
}

function localAdvisorAnswer(question, context) {
  const summary = context.summary;
  const recs = buildRecommendations(context.entries.map((entry, index) => ({ id: String(index), ...entry })), summary, Object.fromEntries(context.topCategories.map((row) => [row.category, row.amount])));
  const topCategory = context.topCategories[0];
  const largest = context.largestCosts[0];
  const rate = summary.earnings > 0 ? Math.round((summary.savings / summary.earnings) * 100) : 0;
  const lower = question.toLowerCase();

  const lines = [
    "Local fallback recommendation:",
    "",
    `Data checked: ${context.counts.entries} entries. Costs ${money(summary.costs)}, earnings ${money(summary.earnings)}, savings ${money(summary.savings)}.`
  ];

  if (summary.earnings > 0) {
    lines.push(`Current savings rate is about ${rate}%.`);
  }
  if (topCategory) {
    lines.push(`Main cost category is ${topCategory.category} with ${money(topCategory.amount)}.`);
  }
  if (largest) {
    lines.push(`Largest cost entry is ${largest.description} (${largest.category}) on ${largest.date}: ${money(largest.amount)}.`);
  }

  lines.push("");
  lines.push("Recommendations:");

  if (lower.includes("increase") && lower.includes("saving")) {
    lines.push("- First reduce the largest recurring or dominant category, because that gives the fastest savings improvement.");
    lines.push("- Set a target before spending starts, for example saving 10-30% of earnings depending on the month.");
  } else if (lower.includes("reduce") || lower.includes("cost")) {
    lines.push("- Sort by category and attack the top category first. Small categories are less important.");
    lines.push("- Review descriptions in the largest cost entries and separate necessary costs from optional ones.");
  } else if (lower.includes("category")) {
    lines.push("- Focus on the category with the highest share of total costs, then check its largest descriptions.");
  } else {
    lines.push("- Compare earnings, costs, and savings first; then inspect the top category and largest entries.");
  }

  recs.slice(0, 3).forEach((item) => lines.push(`- ${item.title}: ${item.text}`));
  lines.push("");
  lines.push("The online advisor was unavailable, so this answer was produced locally from the finance data.");
  return lines.join("\n");
}

function groupSum(entries, key) {
  return entries.reduce((acc, entry) => {
    acc[entry[key]] = (acc[entry[key]] || 0) + Number(entry.amount);
    return acc;
  }, {});
}

function monthlySummaryTableHtml(count = 4) {
  const rows = [];
  const [year, month] = state.selectedMonth.split("-").map(Number);
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(year, month - 1 - i, 1);
    const key = monthKey(date);
    const summary = summarize(state.entries.filter((entry) => entry.date.startsWith(key)));
    rows.push({
      label: date.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
      ...summary
    });
  }
  return `
    <table>
      <thead><tr><th>Month</th><th>Revenue</th><th>Costs</th><th>Savings</th></tr></thead>
      <tbody>
        ${rows.map((row) => `<tr><td>${row.label}</td><td>${money(row.earnings)}</td><td>${money(row.costs)}</td><td class="${row.savings >= 0 ? "positive" : "negative"}">${money(row.savings)}</td></tr>`).join("")}
      </tbody>
    </table>
  `;
}

function renderProfilePage() {
  if (!els.profileDetailsList) return;
  const profile = state.auth.profile || {};
  const user = state.auth.user;
  const loggedIn = Boolean(user && state.auth.verified);
  const displayName = profile.displayName || [profile.name, profile.surname].filter(Boolean).join(" ") || user?.email || "Profile";
  const avatar = displayName.slice(0, 1).toUpperCase() || "U";

  els.profilePageAvatar.textContent = avatar;
  els.profilePageAvatar.dataset.gender = profile.gender || "";
  els.profilePageName.textContent = loggedIn ? displayName : "Profile";
  els.profilePageMeta.textContent = loggedIn
    ? `${user.email || ""} - Cloud finance profile`
    : "Login to see account details and monthly finance summaries.";
  els.profileLogoutButton.classList.toggle("hidden", !loggedIn);

  if (!loggedIn) {
    els.profileDetailsList.innerHTML = `<div><dt>Status</dt><dd>Please login to view profile details.</dd></div>`;
    els.profileMonthlyTable.innerHTML = monthlySummaryTableHtml(6);
    els.profileRecommendationList.innerHTML = `<p class="empty-state">Login and add transactions to get recommendations.</p>`;
    return;
  }

  const details = [
    ["Name", displayName],
    ["Email", user?.email || "Not logged in"],
    ["Gender", prettyGender(profile.gender)],
    ["Birth date", profile.birthDate || "Not set"],
    ["Age", profile.birthDate ? `${calculateAge(profile.birthDate)} years old` : profile.age ? `${profile.age} years old` : "Not set"],
    ["Country of residence", profile.country || profile.residenceCountry || "Not set"],
    ["Country of origin", profile.originCountry || "Not set"]
  ];
  els.profileDetailsList.innerHTML = details
    .map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join("");

  els.profileMonthlyTable.innerHTML = monthlySummaryTableHtml(6);
  const costByCategory = groupSum(state.entries.filter((entry) => entry.type === "cost"), "category");
  const recs = buildRecommendations(state.entries, summarize(state.entries), costByCategory).slice(0, 4);
  els.profileRecommendationList.innerHTML = recs.length
    ? recs.map((item) => `<article class="profile-rec"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.text)}</p></article>`).join("")
    : `<p class="empty-state">Add several transactions to get stronger recommendations.</p>`;
}

function renderAll() {
  applyViewClass();
  syncViewVisibility();
  applyTheme();
  applyMonthTheme();
  renderReportState();
  renderSummary();
  renderRecentMonthsTable();
  renderDailyChart();
  renderDailyList();
  renderTransactions();
  renderStatistics();
  renderAdvisor();
  renderProfilePage();
}

function syncViewVisibility() {
  els.navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === state.activeView));
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.panel !== state.activeView);
  });
  els.entryActionRow.classList.toggle("hidden", !["dashboard", "transactions"].includes(state.activeView));
}

function switchView(view) {
  if (view === "advisor" && !requireLogin("to use AI recommendations")) return;
  if (view === "profile" && !requireLogin("to view your profile")) return;

  state.activeView = view;
  applyViewClass();
  syncViewVisibility();
  els.pageTitle.textContent = {
    dashboard: "Overview",
    transactions: "Transactions",
    statistics: "Statistics",
    advisor: "AI Advisor",
    profile: "Profile",
    backup: "Backup"
  }[view];
  renderAll();
}

function openEntryDialog(mode, entry = null) {
  if (!requireLogin(mode === "edit" ? "to edit transactions" : "to add transactions")) return;

  if (mode === "add" && isMonthSubmitted(state.selectedMonth)) {
    showToast("This month is submitted and locked.");
    return;
  }

  if (entry && isMonthSubmitted(monthKey(entry.date))) {
    showToast("This entry belongs to a submitted month.");
    return;
  }

  resetForm(entry);
  els.entryDialog.classList.toggle("add-mode", mode === "add");
  els.entryDialog.classList.toggle("edit-mode", mode === "edit");
  els.modalModeChip.className = `mode-chip ${mode}`;
  els.modalModeChip.textContent = mode === "edit" ? "Edit mode" : "Add mode";
  els.formTitle.textContent = mode === "edit" ? "Edit entry" : "Add entry";
  els.modalSubtitle.textContent = mode === "edit"
    ? "Update this transaction before the monthly report is submitted."
    : "Create a new cost or earning for the selected month.";
  els.saveEntry.textContent = mode === "edit" ? "Save changes" : "Save entry";
  els.entryDialog.showModal();
}

function resetForm(entry = null) {
  if (entry) {
    setEntryType(entry.type);
    els.editingId.value = entry.id;
    els.entryDate.value = entry.date;
    els.amount.value = entry.amount;
    els.category.value = entry.category;
    els.description.value = entry.description;
    return;
  }
  els.editingId.value = "";
  els.entryDate.value = defaultEntryDate();
  els.amount.value = "";
  els.description.value = "";
  setEntryType("cost");
}

function defaultEntryDate() {
  return todayIso().startsWith(state.selectedMonth) ? todayIso() : `${state.selectedMonth}-01`;
}

function closeEntryDialog() {
  els.entryDialog.close();
}

function submitEntry(event) {
  event.preventDefault();
  if (!requireLogin("to save transactions")) return;

  const type = selectedType();
  const amount = Number(els.amount.value);
  const entry = {
    id: els.editingId.value || uid(),
    type,
    date: els.entryDate.value,
    amount: Number(amount.toFixed(2)),
    category: els.category.value,
    description: els.description.value.trim()
  };

  if (!isValidEntry(entry)) {
    showToast("Please check the entry fields.");
    return;
  }

  const targetMonth = monthKey(entry.date);
  if (isMonthSubmitted(targetMonth)) {
    showToast("That month is already submitted and locked.");
    return;
  }

  const existingIndex = state.entries.findIndex((item) => item.id === entry.id);
  if (existingIndex >= 0) {
    const oldMonth = monthKey(state.entries[existingIndex].date);
    if (isMonthSubmitted(oldMonth)) {
      showToast("This entry belongs to a submitted month.");
      return;
    }
    state.entries[existingIndex] = entry;
  } else {
    state.entries.push(entry);
  }

  saveEntries();
  closeEntryDialog();
  renderAll();
  showToast(existingIndex >= 0 ? "Entry updated." : "Entry saved.");
}

function editEntry(id) {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return;
  openEntryDialog("edit", entry);
}

function deleteEntry(id) {
  if (!requireLogin("to delete transactions")) return;

  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return;
  if (isMonthSubmitted(monthKey(entry.date))) {
    showToast("Submitted month transactions cannot be deleted.");
    return;
  }
  const ok = confirm(`Delete "${entry.description}" (${money(entry.amount)})?`);
  if (!ok) return;
  state.entries = state.entries.filter((item) => item.id !== id);
  saveEntries();
  renderAll();
  showToast("Entry deleted.");
}

function submitMonthlyReport() {
  if (!requireLogin("to submit monthly reports")) return;

  if (!canSubmitMonth(state.selectedMonth)) {
    showToast("This report cannot be submitted yet.");
    return;
  }
  const summary = summarize(entriesInMonth());
  const ok = confirm(`Submit and lock ${monthName(state.selectedMonth)}?\n\nCosts: ${money(summary.costs)}\nEarnings: ${money(summary.earnings)}\nSavings: ${money(summary.savings)}`);
  if (!ok) return;
  state.reports[state.selectedMonth] = {
    submittedAt: new Date().toISOString(),
    summary
  };
  saveReports();
  renderAll();
  showToast("Monthly report submitted and locked.");
}

function exportJson() {
  downloadFile(
    `finance-backup-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      entries: state.entries,
      reports: state.reports
    }, null, 2),
    "application/json"
  );
}

function exportCsv() {
  const header = ["date", "type", "category", "description", "amount", "monthSubmitted"];
  const rows = state.entries
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => [entry.date, entry.type, entry.category, entry.description, entry.amount, isMonthSubmitted(monthKey(entry.date))]
      .map(csvCell).join(","));
  downloadFile(
    `finance-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
    [header.join(","), ...rows].join("\n"),
    "text/csv"
  );
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const imported = Array.isArray(parsed) ? parsed : parsed.entries;
      if (!Array.isArray(imported)) throw new Error("Invalid backup");
      const clean = imported.filter(isValidEntry);
      state.entries = clean;
      state.reports = parsed.reports && typeof parsed.reports === "object" ? parsed.reports : {};
      saveEntries();
      saveReports();
      renderAll();
      showToast(`Imported ${clean.length} entries.`);
    } catch {
      showToast("Import failed. Please use a valid JSON backup.");
    } finally {
      els.importJson.value = "";
    }
  };
  reader.readAsText(file);
}

function openAuthDialog(mode = "login", reason = "") {
  setAuthMode(mode);
  if (reason) {
    els.authSubtitle.textContent = `Please login or register ${reason}.`;
  }
  els.authDialog.showModal();
}

function closeAuthDialog() {
  els.authDialog.close();
}

function setAuthMode(mode) {
  const loggedIn = Boolean(state.auth.user);
  const registerMode = mode === "register";
  clearAuthFeedback();
  els.loginForm.classList.toggle("hidden", registerMode || loggedIn);
  els.registerForm.classList.toggle("hidden", !registerMode || loggedIn);
  els.profilePanel.classList.toggle("hidden", !loggedIn);
  els.authSetupNotice.classList.toggle("hidden", state.auth.configured);
  els.authModeChip.textContent = loggedIn ? "Profile" : registerMode ? "Registration" : "Login";
  els.authTitle.textContent = loggedIn ? "Profile" : registerMode ? "Create account" : "Login";
  els.authSubtitle.textContent = loggedIn
    ? "Your account keeps finance data synchronized safely."
    : registerMode
      ? "Create an account and activate your email before using protected features."
      : "Login to save your finance data safely in the cloud.";
  renderAuth();
}

function renderAuthLegacyUnused() {
  const user = state.auth.user;
  const profile = state.auth.profile || {};
  const configured = state.auth.configured;

  if (!configured) {
    els.authButton.textContent = "Connect login";
    els.authStatus.textContent = "Firebase setup needed.";
  } else if (user && state.auth.verified) {
    els.authButton.textContent = profile.name ? `${profile.name} Profile` : "Profile";
    els.authStatus.textContent = "Cloud sync active.";
  } else if (user) {
    els.authButton.textContent = "Activate email";
    els.authStatus.textContent = "Email verification needed.";
  } else {
    els.authButton.textContent = "Login / Register";
    els.authStatus.textContent = "Login to sync data.";
  }

  if (!user) return;
  const displayName = profile.displayName || user.displayName || user.email || "User";
  els.profileAvatar.textContent = displayName.slice(0, 1).toUpperCase();
  els.profileName.textContent = displayName;
  els.profileEmail.textContent = user.email || "No email";
  els.profileMeta.textContent = [
    profile.age ? `${profile.age} years old` : "",
    profile.country || "",
    state.auth.verified ? "Email activated" : "Email not activated"
  ].filter(Boolean).join(" · ");
  els.verifyNotice.classList.toggle("hidden", state.auth.verified);
}

function calculateAge(birthDate) {
  if (!birthDate) return "";
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const beforeBirthday = today.getMonth() < born.getMonth()
    || (today.getMonth() === born.getMonth() && today.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age > 0 ? age : "";
}

function prettyGender(value) {
  return {
    female: "Female",
    male: "Male",
    "prefer-not": "Prefer not to say"
  }[value] || value || "Not set";
}

function clearAuthFeedback() {
  if (!els.authFeedback) return;
  els.authFeedback.textContent = "";
  els.authFeedback.className = "auth-feedback hidden";
}

function showAuthFeedback(message, tone = "error") {
  if (!els.authFeedback) {
    showToast(message);
    return;
  }
  els.authFeedback.textContent = message;
  els.authFeedback.className = `auth-feedback ${tone}`;
  if (tone === "error") {
    els.authFeedback.animate([
      { transform: "translateX(0)" },
      { transform: "translateX(-7px)" },
      { transform: "translateX(7px)" },
      { transform: "translateX(0)" }
    ], { duration: 280, iterations: 1 });
  }
}

function authErrorMessage(error) {
  const code = error?.code || "";
  if (code.includes("wrong-password") || code.includes("invalid-credential")) {
    return "Password or email is not correct. Try again carefully.";
  }
  if (code.includes("user-not-found")) return "No account found with this email.";
  if (code.includes("too-many-requests")) return "Too many attempts. Please wait a little and try again.";
  if (code.includes("email-already-in-use")) return "This email already has an account. Please login instead.";
  if (code.includes("weak-password")) return "Password is too weak. Use at least 6 characters.";
  return error?.message || "Something went wrong. Please try again.";
}

function showWelcome(profile = {}) {
  const name = [profile.name, profile.surname].filter(Boolean).join(" ") || profile.displayName || "friend";
  els.welcomeTitle.textContent = `Welcome, ${name}`;
  els.welcomeSubtitle.textContent = "Opening your personal money dashboard.";
  els.welcomeOverlay.classList.remove("hidden");
  setTimeout(() => els.welcomeOverlay.classList.add("hidden"), 1650);
}

function showLogoutAnimation() {
  els.welcomeTitle.textContent = "Logged out";
  els.welcomeSubtitle.textContent = "Private values are cleared from this screen.";
  els.welcomeOverlay.classList.remove("hidden");
  setTimeout(() => els.welcomeOverlay.classList.add("hidden"), 1450);
}

function renderAuth() {
  const user = state.auth.user;
  const profile = state.auth.profile || {};
  const configured = state.auth.configured;

  if (!configured) {
    els.authButton.textContent = "Connect login";
    els.authStatus.textContent = "Firebase setup needed.";
  } else if (user && state.auth.verified) {
    els.authButton.textContent = profile.name ? `${profile.name} Profile` : "Profile";
    els.authStatus.textContent = "Cloud sync active.";
  } else if (user) {
    els.authButton.textContent = "Activate email";
    els.authStatus.textContent = "Email verification needed.";
  } else {
    els.authButton.textContent = "Login / Register";
    els.authStatus.textContent = "Login to sync data.";
  }

  if (!user) return;
  const displayName = profile.displayName || user.displayName || user.email || "User";
  els.profileAvatar.textContent = displayName.slice(0, 1).toUpperCase();
  els.profileName.textContent = displayName;
  els.profileEmail.textContent = user.email || "No email";
  els.profileMeta.textContent = [
    profile.birthDate ? `${calculateAge(profile.birthDate)} years old` : profile.age ? `${profile.age} years old` : "",
    profile.country || profile.residenceCountry || "",
    state.auth.verified ? "Email activated" : "Email not activated"
  ].filter(Boolean).join(" · ");
  els.verifyNotice.classList.toggle("hidden", state.auth.verified);
  els.refreshVerification.classList.toggle("hidden", state.auth.verified);
  els.resendVerification.classList.toggle("hidden", state.auth.verified);
  els.refreshVerification.hidden = state.auth.verified;
  els.resendVerification.hidden = state.auth.verified;
}

async function submitLogin(event) {
  event.preventDefault();
  if (!window.financeAuth?.configured) {
    showToast("Firebase is not connected yet.");
    return;
  }
  try {
    await window.financeAuth.login(els.loginEmail.value.trim(), els.loginPassword.value);
    state.activeView = "dashboard";
    showWelcome(state.auth.profile || {});
    closeAuthDialog();
    showToast("Logged in. Data sync is active.");
  } catch (error) {
    showAuthFeedback(authErrorMessage(error), "error");
    showToast(authErrorMessage(error));
    renderAuth();
  }
}

async function submitRegister(event) {
  event.preventDefault();
  if (!window.financeAuth?.configured) {
    showToast("Firebase is not connected yet.");
    return;
  }
  if (els.registerPassword.value !== els.registerPassword2.value) {
    showToast("Passwords do not match.");
    return;
  }
  try {
    await window.financeAuth.register({
      name: els.registerName.value.trim(),
      surname: els.registerSurname.value.trim(),
      gender: els.registerGender.value,
      birthDate: els.registerBirthDate.value,
      country: els.registerCountry.value.trim(),
      originCountry: els.registerOriginCountry.value.trim(),
      email: els.registerEmail.value.trim(),
      password: els.registerPassword.value
    });
    setAuthMode("profile");
    showToast("Activation email sent. Please check Inbox and Spam.");
  } catch (error) {
    showAuthFeedback(authErrorMessage(error), "error");
    showToast(authErrorMessage(error));
  }
}

async function refreshVerification() {
  try {
    await window.financeAuth?.refreshVerification();
    renderAuth();
    showToast(state.auth.verified ? "Email is activated." : "Email is not activated yet.");
  } catch (error) {
    showToast(error.message || "Verification refresh failed.");
  }
}

async function resendVerification() {
  try {
    await window.financeAuth?.resendVerification();
    showToast("Activation email sent again.");
  } catch (error) {
    showToast(error.message || "Could not send activation email.");
  }
}

async function logout() {
  try {
    await window.financeAuth?.logout();
    clearPrivateFinance();
    showLogoutAnimation();
    closeAuthDialog();
    showToast("Logged out.");
  } catch (error) {
    showToast(error.message || "Logout failed.");
  }
}

function applyCloudFinance(finance) {
  if (!finance) {
    state.entries = [];
    state.reports = {};
    localStorage.removeItem(ENTRIES_KEY);
    localStorage.removeItem(REPORTS_KEY);
    renderAll();
    return;
  }

  const cloudEntries = Array.isArray(finance.entries) ? finance.entries.filter(isValidEntry) : [];
  const cloudReports = finance.reports && typeof finance.reports === "object" ? finance.reports : {};
  const hasCloudData = cloudEntries.length || Object.keys(cloudReports).length;
  if (!hasCloudData) {
    state.entries = [];
    state.reports = {};
    localStorage.removeItem(ENTRIES_KEY);
    localStorage.removeItem(REPORTS_KEY);
    renderAll();
    return;
  }

  state.applyingCloudData = true;
  state.entries = cloudEntries;
  state.reports = cloudReports;
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(state.entries));
  localStorage.setItem(REPORTS_KEY, JSON.stringify(state.reports));
  state.applyingCloudData = false;
  renderAll();
  window.setTimeout(renderProfilePage, 0);
}

function clearPrivateFinance() {
  state.entries = [];
  state.reports = {};
  localStorage.removeItem(ENTRIES_KEY);
  localStorage.removeItem(REPORTS_KEY);
  if (state.activeView === "advisor" || state.activeView === "profile") {
    state.activeView = "dashboard";
  }
  renderAll();
}

function handleAuthChange(event) {
  const detail = event.detail || {};
  state.auth = {
    configured: Boolean(detail.configured),
    checked: true,
    user: detail.user || null,
    profile: detail.profile || null,
    verified: Boolean(detail.verified)
  };
  renderAuth();
  if (state.auth.user && state.auth.verified) {
    applyCloudFinance(detail.finance);
  } else {
    clearPrivateFinance();
  }
}

function handleAuthError(event) {
  showToast(event.detail?.message || "Authentication error.");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 2300);
}

function bindEvents() {
  window.addEventListener("finance-auth-change", handleAuthChange);
  window.addEventListener("finance-auth-error", handleAuthError);
  els.navItems.forEach((item) => item.addEventListener("click", () => switchView(item.dataset.view)));
  els.monthInput.addEventListener("change", () => {
    state.selectedMonth = els.monthInput.value || monthKey(new Date());
    renderAll();
  });
  els.prevMonth.addEventListener("click", () => shiftMonth(-1));
  els.nextMonth.addEventListener("click", () => shiftMonth(1));
  els.themeToggle.addEventListener("click", () => {
    state.prefs.theme = state.prefs.theme === "dark" ? "light" : "dark";
    savePrefs();
    renderAll();
  });
  els.openAddEntry.addEventListener("click", () => openEntryDialog("add"));
  els.submitMonth.addEventListener("click", submitMonthlyReport);
  els.typeRadios.forEach((radio) => {
    radio.addEventListener("change", () => populateCategorySelect(els.category, categoriesForType(selectedType())));
  });
  els.entryForm.addEventListener("submit", submitEntry);
  els.closeDialog.addEventListener("click", closeEntryDialog);
  els.cancelEdit.addEventListener("click", closeEntryDialog);
  els.quickTypeFilter.addEventListener("change", renderDailyList);
  els.filterType.addEventListener("change", renderTransactions);
  els.filterCategory.addEventListener("change", renderTransactions);
  els.filterFrom.addEventListener("change", renderTransactions);
  els.filterTo.addEventListener("change", renderTransactions);
  els.clearFilters.addEventListener("click", clearFilters);
  els.openCostAnalysis.addEventListener("click", () => openAnalysisWindow("cost"));
  els.openProfitAnalysis.addEventListener("click", () => openAnalysisWindow("profit"));
  els.closeAnalysisDialog.addEventListener("click", () => els.analysisDialog.close());
  els.statsRange.addEventListener("change", renderStatistics);
  els.askAdvisor.addEventListener("click", askAdvisor);
  document.querySelectorAll(".preset-question").forEach((button) => {
    button.addEventListener("click", () => {
      els.advisorQuestion.value = button.textContent;
      els.advisorQuestion.focus();
    });
  });
  els.copyAdvisorAnswer.addEventListener("click", copyAdvisorAnswer);
  els.transactionTable.addEventListener("click", handleTableAction);
  els.exportJson.addEventListener("click", exportJson);
  els.exportCsv.addEventListener("click", exportCsv);
  els.importJson.addEventListener("change", (event) => importJson(event.target.files[0]));
  els.authButton.addEventListener("click", () => {
    if (isLoggedIn()) {
      switchView("profile");
      return;
    }
    openAuthDialog(state.auth.user ? "profile" : "login");
  });
  els.closeAuthDialog.addEventListener("click", closeAuthDialog);
  els.showRegister.addEventListener("click", () => setAuthMode("register"));
  els.showLogin.addEventListener("click", () => setAuthMode("login"));
  els.loginForm.addEventListener("submit", submitLogin);
  els.registerForm.addEventListener("submit", submitRegister);
  els.refreshVerification.addEventListener("click", refreshVerification);
  els.resendVerification.addEventListener("click", resendVerification);
  els.logoutButton.addEventListener("click", logout);
  els.profileLogoutButton.addEventListener("click", logout);
  mobileQuery.addEventListener("change", applyDeviceClass);
}

function shiftMonth(delta) {
  const [year, month] = state.selectedMonth.split("-").map(Number);
  state.selectedMonth = monthKey(new Date(year, month - 1 + delta, 1));
  els.monthInput.value = state.selectedMonth;
  renderAll();
}

function clearFilters() {
  els.filterType.value = "all";
  els.filterCategory.value = "all";
  els.filterFrom.value = "";
  els.filterTo.value = "";
  renderTransactions();
}

function handleTableAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "edit") editEntry(button.dataset.id);
  if (button.dataset.action === "delete") deleteEntry(button.dataset.id);
}

function init() {
  applyDeviceClass();
  renderAuth();
  els.monthInput.value = state.selectedMonth;
  populateCategorySelect(els.category, costCategories);
  populateCategorySelect(els.filterCategory, [...new Set([...costCategories, ...earningCategories])], true);
  bindEvents();
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
  renderAll();
}

function applyDeviceClass() {
  document.body.classList.toggle("mobile-view", mobileQuery.matches);
}

function applyViewClass() {
  document.body.dataset.view = state.activeView;
}

async function copyAdvisorAnswer() {
  const text = els.advisorAnswer.textContent.trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast("Advisor answer copied.");
  } catch {
    showToast("Copy failed in this browser.");
  }
}

init();
