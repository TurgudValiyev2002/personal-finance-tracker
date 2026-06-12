const ENTRIES_KEY = "personal-finance-tracker-v1";
const REPORTS_KEY = "personal-finance-tracker-reports-v1";
const PREFS_KEY = "personal-finance-tracker-prefs-v1";

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
  entries: loadEntries(),
  reports: loadReports(),
  prefs: loadPrefs(),
  activeView: "dashboard",
  selectedMonth: monthKey(new Date())
};

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
  dailyList: document.getElementById("dailyList"),
  dailyChart: document.getElementById("dailyChart"),
  filterType: document.getElementById("filterType"),
  filterCategory: document.getElementById("filterCategory"),
  filterFrom: document.getElementById("filterFrom"),
  filterTo: document.getElementById("filterTo"),
  clearFilters: document.getElementById("clearFilters"),
  transactionTable: document.getElementById("transactionTable"),
  statsRange: document.getElementById("statsRange"),
  insightGrid: document.getElementById("insightGrid"),
  categoryChart: document.getElementById("categoryChart"),
  trendChart: document.getElementById("trendChart"),
  categoryBreakdown: document.getElementById("categoryBreakdown"),
  exportJson: document.getElementById("exportJson"),
  exportCsv: document.getElementById("exportCsv"),
  importJson: document.getElementById("importJson"),
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
    return { theme: "light" };
  }
}

function saveEntries() {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(state.entries));
}

function saveReports() {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(state.reports));
}

function savePrefs() {
  localStorage.setItem(PREFS_KEY, JSON.stringify(state.prefs));
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
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    days: end.getDate()
  };
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
  els.monthHero.classList.add("changed");
  window.setTimeout(() => els.monthHero.classList.remove("changed"), 220);
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
        <td>${formatDate(entry.date)}</td>
        <td><span class="badge ${entry.type}">${entry.type}</span></td>
        <td>${escapeHtml(entry.category)}</td>
        <td>${escapeHtml(entry.description)}</td>
        <td class="amount-col ${entry.type === "earning" ? "amount earning" : "amount cost"}">
          ${entry.type === "earning" ? "+" : "-"}${money(Number(entry.amount))}
        </td>
        <td>${actions}</td>
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
  const byCategory = groupSum(costEntries, "category");
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  const byDay = groupSum(costEntries, "date");
  const topDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
  const activeDays = new Set(entries.map((entry) => entry.date)).size || 1;
  const avgDailyCost = summary.costs / activeDays;
  const savingsRate = summary.earnings > 0 ? (summary.savings / summary.earnings) * 100 : 0;

  els.insightGrid.innerHTML = `
    <article class="insight-card"><span>Top cost category</span><strong>${topCategory ? escapeHtml(topCategory[0]) : "None"}</strong><small>${topCategory ? money(topCategory[1]) : "No costs yet"}</small></article>
    <article class="insight-card"><span>Most expensive day</span><strong>${topDay ? formatShortDate(topDay[0]) : "None"}</strong><small>${topDay ? money(topDay[1]) : "No costs yet"}</small></article>
    <article class="insight-card"><span>Average active-day cost</span><strong>${money(avgDailyCost)}</strong><small>${activeDays} active day${activeDays === 1 ? "" : "s"}</small></article>
    <article class="insight-card"><span>Savings rate</span><strong>${Math.round(savingsRate)}%</strong><small>${money(summary.savings)} net balance</small></article>
  `;

  renderCategoryChart(byCategory);
  renderTrendChart(entries);
  renderCategoryBreakdown(byCategory, summary.costs);
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date(`${date}T00:00:00`));
}

function renderCategoryChart(byCategory) {
  const rows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(...rows.map((row) => row[1]), 1);
  if (!rows.length) {
    els.categoryChart.innerHTML = `<p class="empty-state">No cost data for this range.</p>`;
    return;
  }
  els.categoryChart.innerHTML = rows.map(([category, value]) => `
    <div class="rank-row">
      <strong>${escapeHtml(category)}</strong>
      <div class="rank-track"><div class="rank-fill" style="width:${(value / max) * 100}%"></div></div>
      <span>${money(value)}</span>
    </div>
  `).join("");
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

function monthlyRows(entries) {
  const byMonth = new Map();
  entries.forEach((entry) => {
    const key = entry.date.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, { key, label: monthName(key), short: key.slice(5), costs: 0, earnings: 0 });
    byMonth.get(key)[entry.type === "earning" ? "earnings" : "costs"] += Number(entry.amount);
  });
  return [...byMonth.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function renderCategoryBreakdown(byCategory, total) {
  const rows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  if (!rows.length) {
    els.categoryBreakdown.innerHTML = "";
    return;
  }
  els.categoryBreakdown.innerHTML = rows.map(([category, value]) => {
    const percent = total > 0 ? (value / total) * 100 : 0;
    return `
      <div class="breakdown-row">
        <strong>${escapeHtml(category)}</strong>
        <div class="breakdown-track"><div class="breakdown-fill" style="width:${percent}%"></div></div>
        <span>${Math.round(percent)}% (${money(value)})</span>
      </div>
    `;
  }).join("");
}

function groupSum(entries, key) {
  return entries.reduce((acc, entry) => {
    acc[entry[key]] = (acc[entry[key]] || 0) + Number(entry.amount);
    return acc;
  }, {});
}

function renderAll() {
  applyTheme();
  applyMonthTheme();
  renderReportState();
  renderSummary();
  renderDailyChart();
  renderDailyList();
  renderTransactions();
  renderStatistics();
}

function switchView(view) {
  state.activeView = view;
  els.navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.panel !== view);
  });
  els.pageTitle.textContent = {
    dashboard: "Overview",
    transactions: "Transactions",
    statistics: "Statistics",
    backup: "Backup"
  }[view];
  renderAll();
}

function openEntryDialog(mode, entry = null) {
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

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 2300);
}

function bindEvents() {
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
  els.statsRange.addEventListener("change", renderStatistics);
  els.transactionTable.addEventListener("click", handleTableAction);
  els.exportJson.addEventListener("click", exportJson);
  els.exportCsv.addEventListener("click", exportCsv);
  els.importJson.addEventListener("change", (event) => importJson(event.target.files[0]));
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
  els.monthInput.value = state.selectedMonth;
  populateCategorySelect(els.category, costCategories);
  populateCategorySelect(els.filterCategory, [...new Set([...costCategories, ...earningCategories])], true);
  bindEvents();
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
  renderAll();
}

init();
