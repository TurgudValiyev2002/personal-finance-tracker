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
  limits: defaultLimits(),
  goals: {},
  recurringRules: [],
  notices: defaultNotices(),
  demo: {
    active: false
  },
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
  advisorModelName: "not used yet",
  applyingCloudData: false
};

const mobileQuery = window.matchMedia("(max-width: 760px)");
let cloudSaveTimer = null;
let limitWarningOpen = false;
let periodReviewOpen = false;
let pendingLimitWarning = null;

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
  categorySuggestion: document.getElementById("categorySuggestion"),
  repeatMonthly: document.getElementById("repeatMonthly"),
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
  exportPdfReport: document.getElementById("exportPdfReport"),
  importJson: document.getElementById("importJson"),
  advisorMode: document.getElementById("advisorMode"),
  advisorQuestion: document.getElementById("advisorQuestion"),
  askAdvisor: document.getElementById("askAdvisor"),
  advisorDataPreview: document.getElementById("advisorDataPreview"),
  advisorAnswer: document.getElementById("advisorAnswer"),
  advisorModelName: document.getElementById("advisorModelName"),
  copyAdvisorAnswer: document.getElementById("copyAdvisorAnswer"),
  authButton: document.getElementById("authButton"),
  demoModeButton: document.getElementById("demoModeButton"),
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
  profilePhotoInput: document.getElementById("profilePhotoInput"),
  profileStatsStrip: document.getElementById("profileStatsStrip"),
  profileDetailsList: document.getElementById("profileDetailsList"),
  profileMonthlyTable: document.getElementById("profileMonthlyTable"),
  profileMiniChart: document.getElementById("profileMiniChart"),
  profileTransactionsList: document.getElementById("profileTransactionsList"),
  profileRecommendationList: document.getElementById("profileRecommendationList"),
  settingsForm: document.getElementById("settingsForm"),
  settingsName: document.getElementById("settingsName"),
  settingsSurname: document.getElementById("settingsSurname"),
  settingsGender: document.getElementById("settingsGender"),
  settingsBirthDate: document.getElementById("settingsBirthDate"),
  settingsCountry: document.getElementById("settingsCountry"),
  settingsOriginCountry: document.getElementById("settingsOriginCountry"),
  settingsEmail: document.getElementById("settingsEmail"),
  settingsFeedback: document.getElementById("settingsFeedback"),
  enableNotifications: document.getElementById("enableNotifications"),
  globalDailyLimit: document.getElementById("globalDailyLimit"),
  globalWeeklyLimit: document.getElementById("globalWeeklyLimit"),
  globalMonthlyLimit: document.getElementById("globalMonthlyLimit"),
  saveGlobalLimits: document.getElementById("saveGlobalLimits"),
  limitCategory: document.getElementById("limitCategory"),
  limitPeriod: document.getElementById("limitPeriod"),
  categoryLimitAmount: document.getElementById("categoryLimitAmount"),
  saveCategoryLimit: document.getElementById("saveCategoryLimit"),
  limitStatusList: document.getElementById("limitStatusList"),
  categoryLimitList: document.getElementById("categoryLimitList"),
  goalProgressPanel: document.getElementById("goalProgressPanel"),
  goalMonth: document.getElementById("goalMonth"),
  goalAmount: document.getElementById("goalAmount"),
  saveGoal: document.getElementById("saveGoal"),
  goalList: document.getElementById("goalList"),
  recurringList: document.getElementById("recurringList"),
  applyRecurringNow: document.getElementById("applyRecurringNow"),
  limitDialog: document.getElementById("limitDialog"),
  limitDialogTitle: document.getElementById("limitDialogTitle"),
  limitDialogBody: document.getElementById("limitDialogBody"),
  closeLimitDialog: document.getElementById("closeLimitDialog"),
  ackLimitDialog: document.getElementById("ackLimitDialog"),
  periodReviewDialog: document.getElementById("periodReviewDialog"),
  periodReviewTitle: document.getElementById("periodReviewTitle"),
  periodReviewBody: document.getElementById("periodReviewBody"),
  periodReviewModel: document.getElementById("periodReviewModel"),
  closePeriodReview: document.getElementById("closePeriodReview"),
  ackPeriodReview: document.getElementById("ackPeriodReview"),
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

function defaultLimits() {
  return {
    global: {
      daily: 0,
      weekly: 0,
      monthly: 0
    },
    categories: {}
  };
}

function defaultNotices() {
  return {
    limitWarnings: {},
    periodReviews: {}
  };
}

function cleanLimits(value) {
  const base = defaultLimits();
  if (!value || typeof value !== "object") return base;
  const global = value.global && typeof value.global === "object" ? value.global : {};
  const categories = value.categories && typeof value.categories === "object" ? value.categories : {};
  return {
    global: {
      daily: Number(global.daily) > 0 ? Number(global.daily) : 0,
      weekly: Number(global.weekly) > 0 ? Number(global.weekly) : 0,
      monthly: Number(global.monthly) > 0 ? Number(global.monthly) : 0
    },
    categories: Object.fromEntries(Object.entries(categories).map(([category, periods]) => [
      category,
      {
        daily: Number(periods?.daily) > 0 ? Number(periods.daily) : 0,
        weekly: Number(periods?.weekly) > 0 ? Number(periods.weekly) : 0,
        monthly: Number(periods?.monthly) > 0 ? Number(periods.monthly) : 0
      }
    ]))
  };
}

function cleanNotices(value) {
  return {
    limitWarnings: value?.limitWarnings && typeof value.limitWarnings === "object" ? value.limitWarnings : {},
    periodReviews: value?.periodReviews && typeof value.periodReviews === "object" ? value.periodReviews : {}
  };
}

function cleanGoals(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([month, amount]) => /^\d{4}-\d{2}$/.test(month) && Number(amount) > 0)
    .map(([month, amount]) => [month, Number(Number(amount).toFixed(2))]));
}

function cleanRecurringRules(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((rule) => rule && typeof rule === "object")
    .map((rule) => ({
      id: typeof rule.id === "string" ? rule.id : uid(),
      type: rule.type === "earning" ? "earning" : "cost",
      amount: Math.max(0, Number(rule.amount) || 0),
      category: typeof rule.category === "string" ? rule.category : "Other",
      description: typeof rule.description === "string" ? rule.description : "",
      day: Math.min(31, Math.max(1, Number(rule.day) || 1)),
      startMonth: /^\d{4}-\d{2}$/.test(rule.startMonth || "") ? rule.startMonth : state.selectedMonth,
      active: rule.active !== false
    }))
    .filter((rule) => rule.amount > 0 && rule.description.trim());
}

function saveEntries() {
  if (isLoggedIn() && !state.demo.active) {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(state.entries));
  }
  scheduleCloudSave();
}

function saveReports() {
  if (isLoggedIn() && !state.demo.active) {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(state.reports));
  }
  scheduleCloudSave();
}

function saveFinanceState() {
  scheduleCloudSave();
}

function savePrefs() {
  localStorage.setItem(PREFS_KEY, JSON.stringify(state.prefs));
}

function scheduleCloudSave() {
  if (state.applyingCloudData) return;
  if (!isLoggedIn()) return;
  if (state.demo.active) return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(saveFinanceToCloud, 650);
}

async function saveFinanceToCloud() {
  if (!isLoggedIn() || state.demo.active || !window.financeAuth?.saveFinance) return;
  try {
    await window.financeAuth.saveFinance({
      entries: state.entries,
      reports: state.reports,
      limits: state.limits,
      notices: state.notices,
      goals: state.goals,
      recurringRules: state.recurringRules
    });
    renderAuth();
  } catch (error) {
    showToast(error.message || "Cloud save failed.");
  }
}

function isLoggedIn() {
  if (state.demo.active) return true;
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

function suggestCategory(description, type = selectedType()) {
  const text = description.toLowerCase();
  if (!text.trim()) return "";
  const rules = type === "earning"
    ? [
        ["Salary", ["salary", "wage", "paycheck", "pay cheque", "job"]],
        ["Scholarship", ["scholarship", "grant", "stipend"]],
        ["Freelance", ["freelance", "client", "contract", "project payment"]],
        ["Family Support", ["mom", "dad", "family", "parent"]],
        ["Refund", ["refund", "cashback", "reimbursement"]]
      ]
    : [
        ["Accommodation", ["rent", "dorm", "hostel", "hotel", "airbnb", "accommodation", "room"]],
        ["Transport", ["train", "tram", "bus", "metro", "taxi", "uber", "bolt", "fuel", "ticket", "airport", "car rental"]],
        ["Internet", ["internet", "wifi", "sim", "mobile", "phone bill", "data plan"]],
        ["Food", ["billa", "spar", "grocery", "groceries", "market", "supermarket", "bread", "food", "lunch", "dinner", "breakfast"]],
        ["Restaurant", ["restaurant", "cafe", "coffee", "pizza", "burger", "kebab", "takeaway"]],
        ["Entertainment", ["cinema", "netflix", "game", "karting", "concert", "park", "museum"]],
        ["Travel", ["flight", "booking", "trip", "travel", "visa", "luggage"]],
        ["Health", ["doctor", "pharmacy", "medicine", "hospital", "dentist"]],
        ["Education", ["university", "course", "book", "gpt", "tuition", "education"]]
      ];
  const match = rules.find(([, keywords]) => keywords.some((keyword) => text.includes(keyword)));
  return match?.[0] || "";
}

function renderCategorySuggestion() {
  if (!els.categorySuggestion) return;
  const suggestion = suggestCategory(els.description.value || "", selectedType());
  if (!suggestion || suggestion === els.category.value) {
    els.categorySuggestion.classList.add("hidden");
    els.categorySuggestion.innerHTML = "";
    return;
  }
  els.categorySuggestion.classList.remove("hidden");
  els.categorySuggestion.innerHTML = `
    <span>Suggested category: <strong>${escapeHtml(suggestion)}</strong></span>
    <button type="button" data-suggest-category="${escapeHtml(suggestion)}">Use suggestion</button>
  `;
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
  renderCategorySuggestion();
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

function formatMonthTitle(month) {
  return monthName(month);
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

function startOfWeek(date) {
  const d = new Date(`${date}T00:00:00`);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return localIso(d);
}

function endOfWeek(date) {
  const d = new Date(`${startOfWeek(date)}T00:00:00`);
  d.setDate(d.getDate() + 6);
  return localIso(d);
}

function periodBounds(period, reference = todayIso()) {
  if (period === "daily") {
    return { start: reference, end: reference, label: formatDate(reference) };
  }
  if (period === "weekly") {
    const start = startOfWeek(reference);
    const end = endOfWeek(reference);
    return { start, end, label: `${formatShortDate(start)} - ${formatShortDate(end)}` };
  }
  const month = reference.length === 7 ? reference : reference.slice(0, 7);
  const bounds = monthBounds(month);
  return { start: bounds.start, end: bounds.end, label: monthName(month) };
}

function entriesInPeriod(period, reference = todayIso(), category = "") {
  const bounds = period === "monthly" ? periodBounds(period, state.selectedMonth) : periodBounds(period, reference);
  return state.entries.filter((entry) => {
    if (entry.type !== "cost") return false;
    if (entry.date < bounds.start || entry.date > bounds.end) return false;
    if (category && entry.category !== category) return false;
    return true;
  });
}

function periodCost(period, reference = todayIso(), category = "") {
  return entriesInPeriod(period, reference, category).reduce((sum, entry) => sum + Number(entry.amount), 0);
}

function isMonthSubmitted(month) {
  return Boolean(state.reports[month]?.submittedAt);
}

function canSubmitMonth(month) {
  return todayIso() > monthBounds(month).end && !isMonthSubmitted(month);
}

function recurringDateForMonth(rule, month) {
  const [year, m] = month.split("-").map(Number);
  const day = Math.min(Number(rule.day) || 1, monthBounds(month).days);
  return localIso(new Date(year, m - 1, day));
}

function addRecurringRuleFromEntry(entry) {
  const rule = {
    id: uid(),
    type: entry.type,
    amount: entry.amount,
    category: entry.category,
    description: entry.description,
    day: Number(entry.date.slice(8, 10)),
    startMonth: monthKey(entry.date),
    active: true
  };
  state.recurringRules.push(rule);
  return rule;
}

function applyRecurringForMonth(month = state.selectedMonth) {
  if (!isLoggedIn() || isMonthSubmitted(month)) return 0;
  let added = 0;
  cleanRecurringRules(state.recurringRules).forEach((rule) => {
    if (!rule.active || month < rule.startMonth) return;
    const alreadyAdded = state.entries.some((entry) => entry.recurringRuleId === rule.id && entry.recurringMonth === month);
    if (alreadyAdded) return;
    state.entries.push({
      id: uid(),
      type: rule.type,
      date: recurringDateForMonth(rule, month),
      amount: Number(Number(rule.amount).toFixed(2)),
      category: rule.category,
      description: rule.description,
      recurringRuleId: rule.id,
      recurringMonth: month
    });
    added += 1;
  });
  if (added > 0) saveEntries();
  return added;
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

function renderGoalProgressPanel() {
  if (!els.goalProgressPanel) return;
  const summary = summarize(entriesInMonth());
  const goal = Number(state.goals[state.selectedMonth]) || 0;
  const progress = goal > 0 ? Math.max(0, Math.min(100, (summary.savings / goal) * 100)) : 0;
  const status = goal > 0
    ? summary.savings >= goal
      ? "Goal reached"
      : `${money(Math.max(0, goal - summary.savings))} left`
    : "No target yet";
  els.goalProgressPanel.innerHTML = `
    <article class="goal-progress-card ${goal > 0 && summary.savings >= goal ? "complete" : ""}">
      <div>
        <span class="goal-icon">◎</span>
        <strong>${goal > 0 ? `${monthName(state.selectedMonth)} savings goal` : "Monthly savings goal"}</strong>
        <p>${goal > 0 ? `${money(summary.savings)} saved toward ${money(goal)}.` : "Set a savings target in Settings to track progress for this month."}</p>
      </div>
      <div class="goal-progress-meter">
        <span>${status}</span>
        <div class="goal-bar"><i style="width:${progress}%"></i></div>
      </div>
    </article>
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
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
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
  const topCategory = context.topCategories[0]?.category || "No category yet";
  const largestCost = context.largestCosts[0]?.category || "No large cost yet";
  const latestEntry = entries
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const latestSignal = latestEntry ? formatDate(latestEntry.date) : "No entries yet";
  els.advisorDataPreview.innerHTML = `
    <div><strong>${context.counts.entries}</strong><span>Saved entries available</span></div>
    <div><strong>${topCategory}</strong><span>Main spending signal</span></div>
    <div><strong>${context.counts.activeDays}</strong><span>Active finance days</span></div>
    <div><strong>${largestCost}</strong><span>Largest-cost area</span></div>
    <div><strong>${latestSignal}</strong><span>Latest tracked activity</span></div>
    <div><strong>Auto</strong><span>The question chooses the focus</span></div>
  `;
  els.advisorMode.className = "report-status open";
  els.advisorMode.textContent = "Automatic context ready";
  if (els.advisorModelName) {
    els.advisorModelName.textContent = `Model: ${state.advisorModelName}`;
  }
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
    const result = await callAdvisorApi(question, context);
    els.advisorAnswer.classList.remove("loading");
    els.advisorAnswer.textContent = result.answer;
    els.advisorMode.className = "report-status open";
    els.advisorMode.textContent = "AI answer";
    state.advisorModelName = result.model || "hosted AI";
    if (els.advisorModelName) {
      els.advisorModelName.textContent = `Model: ${state.advisorModelName}`;
    }
  } catch (error) {
    const fallback = localAdvisorAnswer(question, context);
    els.advisorAnswer.classList.remove("loading");
    els.advisorAnswer.textContent = fallback;
    els.advisorMode.className = "report-status waiting";
    els.advisorMode.textContent = "Local fallback answer";
    state.advisorModelName = "local heuristic fallback";
    if (els.advisorModelName) {
      els.advisorModelName.textContent = `Model: ${state.advisorModelName}`;
    }
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
  return {
    answer: answer.trim(),
    model: data?.model ? String(data.model).trim() : ""
  };
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

  renderProfileAvatar(profile, displayName);
  els.profilePageAvatar.dataset.gender = profile.gender || "";
  els.profilePageName.textContent = loggedIn ? displayName : "Profile";
  els.profilePageMeta.textContent = loggedIn
    ? `${user.email || ""} - Cloud finance profile`
    : "Login to see account details and monthly finance summaries.";
  els.profileLogoutButton.classList.toggle("hidden", !loggedIn);
  els.profilePhotoInput.disabled = !loggedIn;

  if (!loggedIn) {
    els.profileDetailsList.innerHTML = `<div><dt>Status</dt><dd>Please login to view profile details.</dd></div>`;
    els.profileStatsStrip.innerHTML = profileStatCards(summarize([]), []);
    els.profileMonthlyTable.innerHTML = monthlySummaryTableHtml(6);
    els.profileMiniChart.innerHTML = `<p class="empty-state">Login to see profile plots.</p>`;
    els.profileTransactionsList.innerHTML = `<p class="empty-state">Login to see profile transactions.</p>`;
    els.profileRecommendationList.innerHTML = `<p class="empty-state">Login and add transactions to get recommendations.</p>`;
    return;
  }

  const allSummary = summarize(state.entries);
  const monthSummary = summarize(entriesInMonth());
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

  els.profileStatsStrip.innerHTML = profileStatCards(allSummary, state.entries);
  els.profileMonthlyTable.innerHTML = monthlySummaryTableHtml(6);
  renderProfileMiniChart();
  renderProfileTransactionsList();
  const costByCategory = groupSum(state.entries.filter((entry) => entry.type === "cost"), "category");
  const recs = buildRecommendations(state.entries, allSummary, costByCategory).slice(0, 4);
  els.profileRecommendationList.innerHTML = recs.length
    ? recs.map((item) => `<article class="profile-rec"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.text)}</p></article>`).join("")
    : `<p class="empty-state">Add several transactions to get stronger recommendations.</p>`;
}

function renderProfileAvatar(profile, displayName) {
  if (profile.photoDataUrl) {
    els.profilePageAvatar.innerHTML = `<img src="${profile.photoDataUrl}" alt="Profile photo">`;
    return;
  }
  const genderIcon = profile.gender === "female" ? "♀" : profile.gender === "male" ? "♂" : "";
  els.profilePageAvatar.textContent = genderIcon || (displayName.slice(0, 1).toUpperCase() || "U");
}

function profileStatCards(summary, entries) {
  const months = new Set(entries.map((entry) => entry.date.slice(0, 7))).size;
  const topCategory = Object.entries(groupSum(entries.filter((entry) => entry.type === "cost"), "category"))
    .sort((a, b) => b[1] - a[1])[0];
  const savingsRate = summary.earnings > 0 ? Math.round((summary.savings / summary.earnings) * 100) : 0;
  return `
    <article><span>Total saved</span><strong>${money(summary.savings)}</strong><small>${savingsRate}% all-time savings rate</small></article>
    <article><span>Tracked months</span><strong>${months}</strong><small>${entries.length} saved transactions</small></article>
    <article><span>Top cost category</span><strong>${topCategory ? escapeHtml(topCategory[0]) : "None"}</strong><small>${topCategory ? money(topCategory[1]) : "No costs yet"}</small></article>
  `;
}

function renderProfileMiniChart() {
  const rows = monthlyRows(state.entries).slice(-6);
  if (!rows.length) {
    els.profileMiniChart.innerHTML = `<p class="empty-state">No monthly data yet.</p>`;
    return;
  }
  const max = Math.max(...rows.flatMap((row) => [row.earnings, row.costs]), 1);
  els.profileMiniChart.innerHTML = `
    <div class="profile-chart-legend"><span>Earnings</span><span>Costs</span></div>
    <div class="profile-bars">
      ${rows.map((row) => `
        <div class="profile-bar-group" title="${row.label}: earnings ${money(row.earnings)}, costs ${money(row.costs)}">
          <div class="profile-bar-pair">
            <i class="income" style="height:${Math.max(4, (row.earnings / max) * 150)}px"></i>
            <i class="cost" style="height:${Math.max(4, (row.costs / max) * 150)}px"></i>
          </div>
          <span>${row.short}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderProfileTransactionsList() {
  const rows = state.entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  if (!rows.length) {
    els.profileTransactionsList.innerHTML = `<p class="empty-state">No transactions yet.</p>`;
    return;
  }
  els.profileTransactionsList.innerHTML = rows.map((entry) => `
    <article>
      <div>
        <strong>${escapeHtml(entry.description)}</strong>
        <span>${formatShortDate(entry.date)} - ${escapeHtml(entry.category)}</span>
      </div>
      <b class="${entry.type}">${entry.type === "earning" ? "+" : "-"}${money(entry.amount)}</b>
    </article>
  `).join("");
}

function renderSettingsPage() {
  if (!els.settingsForm) return;
  const profile = state.auth.profile || {};
  const user = state.auth.user;
  const loggedIn = isLoggedIn();

  [els.settingsName, els.settingsSurname, els.settingsGender, els.settingsBirthDate, els.settingsCountry, els.settingsOriginCountry, els.settingsEmail].forEach((input) => {
    if (input) input.disabled = !loggedIn;
  });
  if (els.settingsForm.querySelector("button")) {
    els.settingsForm.querySelector("button").disabled = !loggedIn;
  }

  els.settingsName.value = profile.name || "";
  els.settingsSurname.value = profile.surname || "";
  els.settingsGender.value = profile.gender || "";
  els.settingsBirthDate.value = profile.birthDate || "";
  els.settingsCountry.value = profile.country || profile.residenceCountry || "";
  els.settingsOriginCountry.value = profile.originCountry || "";
  els.settingsEmail.value = profile.pendingEmail || user?.email || "";
  if (els.settingsFeedback) {
    const pending = profile.pendingEmail ? `Pending email change: ${profile.pendingEmail}. Activate that inbox before the login email changes.` : "";
    els.settingsFeedback.textContent = pending || (loggedIn ? "Settings are ready." : "Login to edit account settings.");
    els.settingsFeedback.className = `auth-feedback ${pending ? "warn" : "success"}`;
  }

  els.globalDailyLimit.value = state.limits.global.daily || "";
  els.globalWeeklyLimit.value = state.limits.global.weekly || "";
  els.globalMonthlyLimit.value = state.limits.global.monthly || "";
  populateCategorySelect(els.limitCategory, costCategories);
  if (els.goalMonth) els.goalMonth.value = state.selectedMonth;
  if (els.goalAmount) els.goalAmount.value = state.goals[state.selectedMonth] || "";
  renderLimitStatus();
  renderCategoryLimits();
  renderGoalList();
  renderRecurringList();
}

function saveSavingsGoal() {
  if (!requireLogin("to save savings goals")) return;
  const month = els.goalMonth.value || state.selectedMonth;
  const amount = Math.max(0, Number(els.goalAmount.value) || 0);
  if (!/^\d{4}-\d{2}$/.test(month) || amount <= 0) {
    showToast("Choose a month and a positive savings goal.");
    return;
  }
  state.goals[month] = Number(amount.toFixed(2));
  saveFinanceState();
  renderAll();
  showToast(`${monthName(month)} savings goal saved.`);
}

function renderGoalList() {
  if (!els.goalList) return;
  const rows = Object.entries(state.goals).sort(([a], [b]) => b.localeCompare(a));
  if (!rows.length) {
    els.goalList.innerHTML = `<p class="empty-state">No savings goals yet.</p>`;
    return;
  }
  els.goalList.innerHTML = rows.map(([month, amount]) => {
    const summary = summarize(state.entries.filter((entry) => entry.date.startsWith(month)));
    const progress = Math.max(0, Math.min(100, (summary.savings / amount) * 100));
    return `
      <article class="goal-row">
        <div>
          <strong>${monthName(month)}</strong>
          <span>${money(summary.savings)} of ${money(amount)}</span>
          <div class="goal-bar"><i style="width:${progress}%"></i></div>
        </div>
        <button class="tiny-button delete" type="button" data-goal-month="${month}">Remove</button>
      </article>
    `;
  }).join("");
}

function handleGoalListClick(event) {
  const button = event.target.closest("button[data-goal-month]");
  if (!button) return;
  delete state.goals[button.dataset.goalMonth];
  saveFinanceState();
  renderAll();
  showToast("Savings goal removed.");
}

function renderRecurringList() {
  if (!els.recurringList) return;
  const rules = cleanRecurringRules(state.recurringRules);
  state.recurringRules = rules;
  if (!rules.length) {
    els.recurringList.innerHTML = `<p class="empty-state">No recurring entries yet. Tick "Repeat this entry monthly" when adding rent, salary, internet, or subscriptions.</p>`;
    return;
  }
  els.recurringList.innerHTML = rules.map((rule) => `
    <article class="recurring-row">
      <div>
        <strong>${escapeHtml(rule.description)}</strong>
        <span>${rule.type} - ${escapeHtml(rule.category)} - ${money(rule.amount)} - every month from day ${rule.day}</span>
      </div>
      <button class="tiny-button delete" type="button" data-recurring-id="${rule.id}">Remove</button>
    </article>
  `).join("");
}

function handleRecurringListClick(event) {
  const button = event.target.closest("button[data-recurring-id]");
  if (!button) return;
  state.recurringRules = state.recurringRules.filter((rule) => rule.id !== button.dataset.recurringId);
  saveFinanceState();
  renderAll();
  showToast("Recurring entry removed.");
}

function applyRecurringNow() {
  if (!requireLogin("to apply recurring entries")) return;
  const count = applyRecurringForMonth(state.selectedMonth);
  renderAll();
  showToast(count ? `${count} recurring ${count === 1 ? "entry" : "entries"} added.` : "No new recurring entries to add.");
}

function limitRows() {
  const rows = [];
  ["daily", "weekly", "monthly"].forEach((period) => {
    const limit = Number(state.limits.global[period]) || 0;
    if (!limit) return;
    const bounds = period === "monthly" ? periodBounds(period, state.selectedMonth) : periodBounds(period);
    rows.push({
      key: `global:${period}:${bounds.start}:${bounds.end}`,
      label: `${period[0].toUpperCase()}${period.slice(1)} cost limit`,
      scope: "All categories",
      period,
      bounds,
      amount: periodCost(period),
      limit
    });
  });

  Object.entries(state.limits.categories || {}).forEach(([category, periods]) => {
    ["daily", "weekly", "monthly"].forEach((period) => {
      const limit = Number(periods[period]) || 0;
      if (!limit) return;
      const bounds = period === "monthly" ? periodBounds(period, state.selectedMonth) : periodBounds(period);
      rows.push({
        key: `category:${category}:${period}:${bounds.start}:${bounds.end}`,
        label: `${category} ${period} limit`,
        scope: category,
        period,
        bounds,
        amount: periodCost(period, todayIso(), category),
        limit
      });
    });
  });
  return rows;
}

function limitTone(row) {
  const ratio = row.limit > 0 ? row.amount / row.limit : 0;
  if (ratio >= 1) return "danger";
  if (ratio >= 0.8) return "warning";
  return "safe";
}

function renderLimitStatus() {
  if (!els.limitStatusList) return;
  const rows = limitRows();
  if (!rows.length) {
    els.limitStatusList.innerHTML = `<p class="empty-state">No spending limits yet. Add a daily, weekly, monthly, or category limit above.</p>`;
    return;
  }
  els.limitStatusList.innerHTML = rows.map((row) => {
    const ratio = row.limit > 0 ? Math.min(140, (row.amount / row.limit) * 100) : 0;
    const tone = limitTone(row);
    return `
      <article class="limit-row ${tone}">
        <div>
          <strong>${escapeHtml(row.label)}</strong>
          <span>${escapeHtml(row.bounds.label)} - ${money(row.amount)} of ${money(row.limit)}</span>
        </div>
        <div class="limit-progress"><i style="width:${Math.min(100, ratio)}%"></i></div>
        <b>${Math.round(ratio)}%</b>
      </article>
    `;
  }).join("");
}

function renderCategoryLimits() {
  if (!els.categoryLimitList) return;
  const rows = [];
  Object.entries(state.limits.categories || {}).forEach(([category, periods]) => {
    Object.entries(periods).forEach(([period, limit]) => {
      if (Number(limit) > 0) rows.push({ category, period, limit: Number(limit) });
    });
  });
  if (!rows.length) {
    els.categoryLimitList.innerHTML = `<p class="empty-state">No category-specific limits yet.</p>`;
    return;
  }
  els.categoryLimitList.innerHTML = rows.map((row) => `
    <article class="category-limit-pill">
      <span><strong>${escapeHtml(row.category)}</strong> ${escapeHtml(row.period)} limit: ${money(row.limit)}</span>
      <button class="tiny-button delete" type="button" data-limit-category="${escapeHtml(row.category)}" data-limit-period="${escapeHtml(row.period)}">Remove</button>
    </article>
  `).join("");
}

function maybeShowLimitWarning() {
  if (!isLoggedIn() || limitWarningOpen || !els.limitDialog) return;
  const candidate = limitRows().find((row) => {
    const tone = limitTone(row);
    if (tone === "safe") return false;
    const key = `${row.key}:${tone}:${Math.floor(row.amount)}`;
    return !state.notices.limitWarnings[key];
  });
  if (!candidate) return;
  const tone = limitTone(candidate);
  const key = `${candidate.key}:${tone}:${Math.floor(candidate.amount)}`;
  pendingLimitWarning = { ...candidate, tone, noticeKey: key };
  limitWarningOpen = true;
  els.limitDialogTitle.textContent = tone === "danger" ? "Limit passed" : "Limit almost reached";
  els.limitDialogBody.textContent = `${candidate.label}: ${money(candidate.amount)} used from ${money(candidate.limit)} in ${candidate.bounds.label}.`;
  if (!els.limitDialog.open) els.limitDialog.showModal();
  sendBrowserLimitNotification(candidate, tone);
}

function acknowledgeLimitWarning() {
  if (pendingLimitWarning) {
    state.notices.limitWarnings[pendingLimitWarning.noticeKey] = new Date().toISOString();
    saveFinanceState();
  }
  pendingLimitWarning = null;
  limitWarningOpen = false;
  if (els.limitDialog?.open) els.limitDialog.close();
}

function sendBrowserLimitNotification(row, tone) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(tone === "danger" ? "Finance limit passed" : "Finance limit warning", {
      body: `${row.label}: ${money(row.amount)} of ${money(row.limit)}`
    });
  } catch {
    // Browser notifications are optional.
  }
}

function completedPeriodReviews() {
  const today = todayIso();
  const reviews = [];
  const weeks = new Map();
  const months = new Map();
  state.entries.forEach((entry) => {
    const weekStart = startOfWeek(entry.date);
    const weekEnd = endOfWeek(entry.date);
    const weekKey = `week:${weekStart}:${weekEnd}`;
    if (!weeks.has(weekKey)) weeks.set(weekKey, { type: "week", key: weekKey, start: weekStart, end: weekEnd, entries: [] });
    weeks.get(weekKey).entries.push(entry);

    const month = entry.date.slice(0, 7);
    const bounds = monthBounds(month);
    const monthKeyValue = `month:${month}`;
    if (!months.has(monthKeyValue)) months.set(monthKeyValue, { type: "month", key: monthKeyValue, start: bounds.start, end: bounds.end, entries: [] });
    months.get(monthKeyValue).entries.push(entry);
  });

  [...weeks.values(), ...months.values()].forEach((period) => {
    if (period.end >= today) return;
    if (!period.entries.length) return;
    if (state.notices.periodReviews[period.key]) return;
    reviews.push(period);
  });
  return reviews.sort((a, b) => a.end.localeCompare(b.end));
}

async function maybeShowPeriodReview() {
  if (!isLoggedIn() || periodReviewOpen || !els.periodReviewDialog) return;
  const review = completedPeriodReviews()[0];
  if (!review) return;
  periodReviewOpen = true;
  const periodName = review.type === "week"
    ? `Week review: ${formatShortDate(review.start)} - ${formatShortDate(review.end)}`
    : `Monthly review: ${monthName(review.start.slice(0, 7))}`;
  els.periodReviewTitle.textContent = periodName;
  els.periodReviewBody.textContent = "Preparing finance recommendation...";
  els.periodReviewModel.textContent = "Model: preparing";
  els.periodReviewDialog.dataset.reviewKey = review.key;
  els.periodReviewDialog.showModal();

  const context = buildAdvisorContext(review.entries);
  const question = review.type === "week"
    ? "Give a short weekly finance review with key risks, strongest category, savings interpretation, and next week advice."
    : "Give a short monthly finance review with key risks, strongest category, savings interpretation, and next month advice.";
  try {
    const result = await callAdvisorApi(question, context);
    els.periodReviewBody.textContent = result.answer;
    els.periodReviewModel.textContent = `Model: ${result.model || "hosted AI"}`;
  } catch {
    els.periodReviewBody.textContent = localAdvisorAnswer(question, context);
    els.periodReviewModel.textContent = "Model: local heuristic fallback";
  }
}

function acknowledgePeriodReview() {
  const key = els.periodReviewDialog?.dataset.reviewKey;
  if (key) {
    state.notices.periodReviews[key] = new Date().toISOString();
    saveFinanceState();
  }
  periodReviewOpen = false;
  if (els.periodReviewDialog?.open) els.periodReviewDialog.close();
}

function renderAll() {
  applyRecurringForMonth(state.selectedMonth);
  applyViewClass();
  syncViewVisibility();
  applyTheme();
  applyMonthTheme();
  renderReportState();
  renderSummary();
  renderRecentMonthsTable();
  renderGoalProgressPanel();
  renderDailyChart();
  renderDailyList();
  renderTransactions();
  renderStatistics();
  renderAdvisor();
  renderProfilePage();
  renderSettingsPage();
  maybeShowLimitWarning();
  window.setTimeout(maybeShowPeriodReview, 0);
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
  if (view === "settings" && !requireLogin("to edit account settings and limits")) return;

  state.activeView = view;
  applyViewClass();
  syncViewVisibility();
  els.pageTitle.textContent = {
    dashboard: "Overview",
    transactions: "Transactions",
    statistics: "Statistics",
    advisor: "AI Advisor",
    profile: "Profile",
    settings: "Settings",
    backup: "Backup",
    about: "About",
    contact: "Contact"
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
    if (els.repeatMonthly) {
      els.repeatMonthly.checked = false;
      els.repeatMonthly.disabled = true;
    }
    renderCategorySuggestion();
    return;
  }
  els.editingId.value = "";
  els.entryDate.value = defaultEntryDate();
  els.amount.value = "";
  els.description.value = "";
  if (els.repeatMonthly) {
    els.repeatMonthly.checked = false;
    els.repeatMonthly.disabled = false;
  }
  setEntryType("cost");
  renderCategorySuggestion();
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
    entry.recurringRuleId = state.entries[existingIndex].recurringRuleId;
    entry.recurringMonth = state.entries[existingIndex].recurringMonth;
    state.entries[existingIndex] = entry;
  } else {
    state.entries.push(entry);
    if (els.repeatMonthly?.checked) {
      const rule = addRecurringRuleFromEntry(entry);
      entry.recurringRuleId = rule.id;
      entry.recurringMonth = monthKey(entry.date);
    }
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
      reports: state.reports,
      limits: state.limits,
      notices: state.notices,
      goals: state.goals,
      recurringRules: state.recurringRules
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
      state.limits = cleanLimits(parsed.limits);
      state.notices = cleanNotices(parsed.notices);
      state.goals = cleanGoals(parsed.goals);
      state.recurringRules = cleanRecurringRules(parsed.recurringRules);
      saveEntries();
      saveReports();
      saveFinanceState();
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

function demoEntries(month = state.selectedMonth) {
  return [
    { id: uid(), type: "earning", date: `${month}-01`, amount: 3210, category: "Salary", description: "Demo monthly salary" },
    { id: uid(), type: "cost", date: `${month}-02`, amount: 720, category: "Accommodation", description: "Demo dorm rent" },
    { id: uid(), type: "cost", date: `${month}-05`, amount: 48, category: "Internet", description: "Demo mobile internet" },
    { id: uid(), type: "cost", date: `${month}-08`, amount: 42, category: "Transport", description: "Demo train ticket" },
    { id: uid(), type: "cost", date: `${month}-12`, amount: 64, category: "Food", description: "Demo Billa groceries" },
    { id: uid(), type: "cost", date: `${month}-18`, amount: 35, category: "Restaurant", description: "Demo cafe dinner" },
    { id: uid(), type: "cost", date: `${month}-22`, amount: 28, category: "Entertainment", description: "Demo cinema" }
  ];
}

function startDemoMode() {
  const salaryRuleId = uid();
  const rentRuleId = uid();
  const internetRuleId = uid();
  state.demo.active = true;
  state.auth = {
    configured: true,
    checked: true,
    user: {
      email: "demo@finance-tracker.local",
      displayName: "Demo User"
    },
    profile: {
      name: "Demo",
      surname: "User",
      displayName: "Demo User",
      gender: "prefer-not",
      birthDate: "1998-01-01",
      country: "Demo Country",
      originCountry: "Demo Origin"
    },
    verified: true
  };
  state.entries = demoEntries().map((entry) => {
    if (entry.description.includes("salary")) return { ...entry, recurringRuleId: salaryRuleId, recurringMonth: state.selectedMonth };
    if (entry.description.includes("rent")) return { ...entry, recurringRuleId: rentRuleId, recurringMonth: state.selectedMonth };
    if (entry.description.includes("internet")) return { ...entry, recurringRuleId: internetRuleId, recurringMonth: state.selectedMonth };
    return entry;
  });
  state.reports = {};
  state.limits = cleanLimits({
    global: { daily: 120, weekly: 450, monthly: 1500 },
    categories: { Food: { daily: 0, weekly: 100, monthly: 300 } }
  });
  state.goals = { [state.selectedMonth]: 1500 };
  state.recurringRules = [
    { id: salaryRuleId, type: "earning", amount: 3210, category: "Salary", description: "Demo monthly salary", day: 1, startMonth: state.selectedMonth, active: true },
    { id: rentRuleId, type: "cost", amount: 720, category: "Accommodation", description: "Demo dorm rent", day: 2, startMonth: state.selectedMonth, active: true },
    { id: internetRuleId, type: "cost", amount: 48, category: "Internet", description: "Demo mobile internet", day: 5, startMonth: state.selectedMonth, active: true }
  ];
  state.notices = defaultNotices();
  state.activeView = "dashboard";
  localStorage.removeItem(ENTRIES_KEY);
  localStorage.removeItem(REPORTS_KEY);
  showWelcome(state.auth.profile);
  renderAll();
  showToast("Demo mode opened with fake data.");
}

function exitDemoMode() {
  state.demo.active = false;
  state.auth = {
    configured: Boolean(window.financeAuth?.configured),
    checked: true,
    user: null,
    profile: null,
    verified: false
  };
  clearPrivateFinance();
  showLogoutAnimation();
  showToast("Demo mode closed.");
}

function exportMonthlyPdfReport() {
  if (!requireLogin("to export monthly PDF reports")) return;
  if (!isMonthSubmitted(state.selectedMonth)) {
    showToast("Submit and lock the month before exporting the final PDF report.");
    return;
  }
  const entries = entriesInMonth().sort((a, b) => a.date.localeCompare(b.date));
  const summary = summarize(entries);
  const byCategory = groupSum(entries.filter((entry) => entry.type === "cost"), "category");
  const topCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const goal = Number(state.goals[state.selectedMonth]) || 0;
  const popup = window.open("", "_blank", "width=900,height=1100");
  if (!popup) {
    showToast("Popup blocked. Allow popups to export the PDF report.");
    return;
  }
  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${monthName(state.selectedMonth)} finance report</title>
        <style>
          body{font-family:Arial,sans-serif;margin:34px;color:#12211f}
          h1{margin:0 0 6px;font-size:30px}
          .muted{color:#64746f}
          .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:22px 0}
          .card{border:1px solid #dce7e4;border-radius:8px;padding:14px}
          .card strong{display:block;font-size:22px;margin-top:8px}
          table{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}
          th,td{border-bottom:1px solid #e4ecea;padding:8px;text-align:left}
          th{background:#eef6f4}
          .positive{color:#168a55;font-weight:700}.negative{color:#c24132;font-weight:700}
          .bar{height:10px;border-radius:999px;background:#e8f1ef;overflow:hidden}
          .bar i{display:block;height:100%;background:#168a55}
          @media print{button{display:none}body{margin:20px}}
        </style>
      </head>
      <body>
        <button onclick="window.print()">Save as PDF / Print</button>
        <h1>${monthName(state.selectedMonth)} Finance Report</h1>
        <p class="muted">Submitted on ${formatDate(state.reports[state.selectedMonth].submittedAt.slice(0, 10))}</p>
        <div class="grid">
          <div class="card">Costs<strong class="negative">${money(summary.costs)}</strong><span class="muted">${summary.costCount} entries</span></div>
          <div class="card">Earnings<strong>${money(summary.earnings)}</strong><span class="muted">${summary.earningCount} entries</span></div>
          <div class="card">Savings<strong class="${summary.savings >= 0 ? "positive" : "negative"}">${money(summary.savings)}</strong><span class="muted">${summary.earnings > 0 ? Math.round((summary.savings / summary.earnings) * 100) : 0}% saved</span></div>
        </div>
        <h2>Savings goal</h2>
        <p>${goal > 0 ? `${money(summary.savings)} saved toward ${money(goal)}.` : "No savings goal was set for this month."}</p>
        <div class="bar"><i style="width:${goal > 0 ? Math.max(0, Math.min(100, (summary.savings / goal) * 100)) : 0}%"></i></div>
        <h2>Top cost categories</h2>
        <table><tbody>${topCategories.length ? topCategories.map(([category, amount]) => `<tr><td>${escapeHtml(category)}</td><td>${money(amount)}</td></tr>`).join("") : `<tr><td>No costs</td><td>${money(0)}</td></tr>`}</tbody></table>
        <h2>Transactions</h2>
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
          <tbody>${entries.map((entry) => `<tr><td>${formatDate(entry.date)}</td><td>${entry.type}</td><td>${escapeHtml(entry.category)}</td><td>${escapeHtml(entry.description)}</td><td>${entry.type === "earning" ? "+" : "-"}${money(entry.amount)}</td></tr>`).join("")}</tbody>
        </table>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
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
  if (code.includes("requires-recent-login")) return "For security, please logout, login again, then change the email.";
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

  if (state.demo.active) {
    els.authButton.textContent = "Demo Profile";
    els.authStatus.textContent = "Demo data only.";
    if (els.demoModeButton) els.demoModeButton.textContent = "Exit demo mode";
  } else if (!configured) {
    els.authButton.textContent = "Connect login";
    els.authStatus.textContent = "Firebase setup needed.";
    if (els.demoModeButton) els.demoModeButton.textContent = "Try demo mode";
  } else if (user && state.auth.verified) {
    els.authButton.textContent = profile.name ? `${profile.name} Profile` : "Profile";
    els.authStatus.textContent = "Cloud sync active.";
    if (els.demoModeButton) els.demoModeButton.textContent = "Try demo mode";
  } else if (user) {
    els.authButton.textContent = "Activate email";
    els.authStatus.textContent = "Email verification needed.";
    if (els.demoModeButton) els.demoModeButton.textContent = "Try demo mode";
  } else {
    els.authButton.textContent = "Login / Register";
    els.authStatus.textContent = "Login to sync data.";
    if (els.demoModeButton) els.demoModeButton.textContent = "Try demo mode";
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

async function submitSettings(event) {
  event.preventDefault();
  if (!requireLogin("to update account settings")) return;
  const profile = {
    ...(state.auth.profile || {}),
    name: els.settingsName.value.trim(),
    surname: els.settingsSurname.value.trim(),
    gender: els.settingsGender.value,
    birthDate: els.settingsBirthDate.value,
    country: els.settingsCountry.value.trim(),
    originCountry: els.settingsOriginCountry.value.trim(),
    email: els.settingsEmail.value.trim()
  };
  profile.displayName = `${profile.name} ${profile.surname}`.trim();

  try {
    const result = await window.financeAuth?.updateAccountSettings(profile);
    if (result?.pendingEmail) {
      showToast("Verification email sent to the new address. Check Inbox and Spam.");
      els.settingsFeedback.textContent = `Pending email change: ${result.pendingEmail}. The login email changes only after activation.`;
      els.settingsFeedback.className = "auth-feedback warn";
    } else {
      showToast("Settings saved.");
      els.settingsFeedback.textContent = "Settings saved successfully.";
      els.settingsFeedback.className = "auth-feedback success";
    }
  } catch (error) {
    const message = authErrorMessage(error);
    showToast(message);
    els.settingsFeedback.textContent = message;
    els.settingsFeedback.className = "auth-feedback error";
  }
}

function saveGlobalLimits() {
  if (!requireLogin("to save spending limits")) return;
  state.limits.global = {
    daily: Math.max(0, Number(els.globalDailyLimit.value) || 0),
    weekly: Math.max(0, Number(els.globalWeeklyLimit.value) || 0),
    monthly: Math.max(0, Number(els.globalMonthlyLimit.value) || 0)
  };
  saveFinanceState();
  renderSettingsPage();
  showToast("Global limits saved.");
}

function saveCategoryLimit() {
  if (!requireLogin("to save category limits")) return;
  const category = els.limitCategory.value;
  const period = els.limitPeriod.value;
  const amount = Math.max(0, Number(els.categoryLimitAmount.value) || 0);
  if (!category || !period || amount <= 0) {
    showToast("Choose category, period, and a positive amount.");
    return;
  }
  state.limits.categories[category] = {
    daily: Number(state.limits.categories[category]?.daily) || 0,
    weekly: Number(state.limits.categories[category]?.weekly) || 0,
    monthly: Number(state.limits.categories[category]?.monthly) || 0,
    [period]: amount
  };
  els.categoryLimitAmount.value = "";
  saveFinanceState();
  renderSettingsPage();
  showToast(`${category} ${period} limit saved.`);
}

function handleCategoryLimitClick(event) {
  const button = event.target.closest("button[data-limit-category]");
  if (!button) return;
  const category = button.dataset.limitCategory;
  const period = button.dataset.limitPeriod;
  if (!state.limits.categories[category]) return;
  state.limits.categories[category][period] = 0;
  if (!Object.values(state.limits.categories[category]).some((value) => Number(value) > 0)) {
    delete state.limits.categories[category];
  }
  saveFinanceState();
  renderSettingsPage();
  showToast("Category limit removed.");
}

async function enableBrowserNotifications() {
  if (!("Notification" in window)) {
    showToast("This browser does not support notifications.");
    return;
  }
  const permission = await Notification.requestPermission();
  showToast(permission === "granted" ? "Browser alerts enabled." : "Browser alerts were not enabled.");
}

async function updateProfilePhoto(file) {
  if (!file || !isLoggedIn()) return;
  try {
    const photoDataUrl = await resizeProfilePhoto(file);
    const profile = { ...(state.auth.profile || {}), photoDataUrl };
    state.auth.profile = profile;
    renderProfilePage();
    await window.financeAuth?.saveProfile(profile);
    showToast("Profile photo updated.");
  } catch (error) {
    showToast(error.message || "Could not update profile photo.");
  } finally {
    els.profilePhotoInput.value = "";
  }
}

function resizeProfilePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not load image."));
      image.onload = () => {
        const size = 320;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const side = Math.min(image.width, image.height);
        const sx = (image.width - side) / 2;
        const sy = (image.height - side) / 2;
        ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function logout() {
  if (state.demo.active) {
    exitDemoMode();
    closeAuthDialog();
    return;
  }
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
    state.limits = defaultLimits();
    state.notices = defaultNotices();
    state.goals = {};
    state.recurringRules = [];
    localStorage.removeItem(ENTRIES_KEY);
    localStorage.removeItem(REPORTS_KEY);
    renderAll();
    return;
  }

  const cloudEntries = Array.isArray(finance.entries) ? finance.entries.filter(isValidEntry) : [];
  const cloudReports = finance.reports && typeof finance.reports === "object" ? finance.reports : {};
  const cloudGoals = cleanGoals(finance.goals);
  const cloudRecurringRules = cleanRecurringRules(finance.recurringRules);
  const hasCloudData = cloudEntries.length || Object.keys(cloudReports).length || Object.keys(cloudGoals).length || cloudRecurringRules.length;
  if (!hasCloudData) {
    state.entries = [];
    state.reports = {};
    state.limits = cleanLimits(finance.limits);
    state.notices = cleanNotices(finance.notices);
    state.goals = cloudGoals;
    state.recurringRules = cloudRecurringRules;
    localStorage.removeItem(ENTRIES_KEY);
    localStorage.removeItem(REPORTS_KEY);
    renderAll();
    return;
  }

  state.applyingCloudData = true;
  state.entries = cloudEntries;
  state.reports = cloudReports;
  state.limits = cleanLimits(finance.limits);
  state.notices = cleanNotices(finance.notices);
  state.goals = cloudGoals;
  state.recurringRules = cloudRecurringRules;
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(state.entries));
  localStorage.setItem(REPORTS_KEY, JSON.stringify(state.reports));
  state.applyingCloudData = false;
  renderAll();
  window.setTimeout(renderProfilePage, 0);
}

function clearPrivateFinance() {
  state.entries = [];
  state.reports = {};
  state.limits = defaultLimits();
  state.notices = defaultNotices();
  state.goals = {};
  state.recurringRules = [];
  localStorage.removeItem(ENTRIES_KEY);
  localStorage.removeItem(REPORTS_KEY);
  if (state.activeView === "advisor" || state.activeView === "profile") {
    state.activeView = "dashboard";
  }
  renderAll();
}

function handleAuthChange(event) {
  if (state.demo.active) return;
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
    radio.addEventListener("change", () => {
      populateCategorySelect(els.category, categoriesForType(selectedType()));
      renderCategorySuggestion();
    });
  });
  els.description?.addEventListener("input", renderCategorySuggestion);
  els.categorySuggestion?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-suggest-category]");
    if (!button) return;
    els.category.value = button.dataset.suggestCategory;
    renderCategorySuggestion();
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
  els.exportPdfReport?.addEventListener("click", exportMonthlyPdfReport);
  els.importJson.addEventListener("change", (event) => importJson(event.target.files[0]));
  els.authButton.addEventListener("click", () => {
    if (isLoggedIn()) {
      switchView("profile");
      return;
    }
    openAuthDialog(state.auth.user ? "profile" : "login");
  });
  els.demoModeButton?.addEventListener("click", () => {
    if (state.demo.active) {
      exitDemoMode();
      return;
    }
    startDemoMode();
    closeAuthDialog();
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
  els.profilePhotoInput.addEventListener("change", (event) => updateProfilePhoto(event.target.files[0]));
  els.settingsForm?.addEventListener("submit", submitSettings);
  els.saveGlobalLimits?.addEventListener("click", saveGlobalLimits);
  els.saveCategoryLimit?.addEventListener("click", saveCategoryLimit);
  els.categoryLimitList?.addEventListener("click", handleCategoryLimitClick);
  els.saveGoal?.addEventListener("click", saveSavingsGoal);
  els.goalList?.addEventListener("click", handleGoalListClick);
  els.applyRecurringNow?.addEventListener("click", applyRecurringNow);
  els.recurringList?.addEventListener("click", handleRecurringListClick);
  els.enableNotifications?.addEventListener("click", enableBrowserNotifications);
  els.closeLimitDialog?.addEventListener("click", acknowledgeLimitWarning);
  els.ackLimitDialog?.addEventListener("click", acknowledgeLimitWarning);
  els.limitDialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    acknowledgeLimitWarning();
  });
  els.closePeriodReview?.addEventListener("click", acknowledgePeriodReview);
  els.ackPeriodReview?.addEventListener("click", acknowledgePeriodReview);
  els.periodReviewDialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    acknowledgePeriodReview();
  });
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
  if (els.limitCategory) populateCategorySelect(els.limitCategory, costCategories);
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
