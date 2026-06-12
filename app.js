const STORAGE_KEY = "personal-finance-tracker-v1";

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

const state = {
  entries: loadEntries(),
  activeView: "dashboard",
  selectedMonth: monthKey(new Date())
};

const els = {
  navItems: document.querySelectorAll(".nav-item"),
  pageTitle: document.getElementById("pageTitle"),
  monthInput: document.getElementById("monthInput"),
  prevMonth: document.getElementById("prevMonth"),
  nextMonth: document.getElementById("nextMonth"),
  entryForm: document.getElementById("entryForm"),
  editingId: document.getElementById("editingId"),
  formTitle: document.getElementById("formTitle"),
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
  categoryChart: document.getElementById("categoryChart"),
  trendChart: document.getElementById("trendChart"),
  filterType: document.getElementById("filterType"),
  filterCategory: document.getElementById("filterCategory"),
  filterFrom: document.getElementById("filterFrom"),
  filterTo: document.getElementById("filterTo"),
  clearFilters: document.getElementById("clearFilters"),
  transactionTable: document.getElementById("transactionTable"),
  statsRange: document.getElementById("statsRange"),
  categoryBreakdown: document.getElementById("categoryBreakdown"),
  exportJson: document.getElementById("exportJson"),
  exportCsv: document.getElementById("exportCsv"),
  importJson: document.getElementById("importJson"),
  toast: document.getElementById("toast")
};

function loadEntries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isValidEntry) : [];
  } catch {
    return [];
  }
}

function isValidEntry(entry) {
  return entry
    && typeof entry.id === "string"
    && ["cost", "earning"].includes(entry.type)
    && typeof entry.date === "string"
    && Number.isFinite(Number(entry.amount))
    && Number(entry.amount) > 0
    && typeof entry.category === "string"
    && typeof entry.description === "string";
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
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
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All categories";
    select.appendChild(allOption);
  }
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
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

function entriesInMonth(month = state.selectedMonth) {
  return state.entries.filter((entry) => entry.date.startsWith(month));
}

function summarize(entries) {
  const costs = entries
    .filter((entry) => entry.type === "cost")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const earnings = entries
    .filter((entry) => entry.type === "earning")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  return {
    costs,
    earnings,
    savings: earnings - costs,
    costCount: entries.filter((entry) => entry.type === "cost").length,
    earningCount: entries.filter((entry) => entry.type === "earning").length
  };
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
    const rows = dayEntries.map(entryCard).join("");
    return `
      <section class="day-group">
        <div class="day-header">
          <span>${formatDate(date)}</span>
          <span>${money(daySummary.earnings - daySummary.costs)}</span>
        </div>
        <div class="day-items">${rows}</div>
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

  els.transactionTable.innerHTML = entries.map((entry) => `
    <tr>
      <td>${formatDate(entry.date)}</td>
      <td><span class="badge ${entry.type}">${entry.type}</span></td>
      <td>${escapeHtml(entry.category)}</td>
      <td>${escapeHtml(entry.description)}</td>
      <td class="amount-col ${entry.type === "earning" ? "amount earning" : "amount cost"}">
        ${entry.type === "earning" ? "+" : "-"}${money(Number(entry.amount))}
      </td>
      <td>
        <div class="action-buttons">
          <button class="tiny-button" type="button" data-action="edit" data-id="${entry.id}">Edit</button>
          <button class="tiny-button delete" type="button" data-action="delete" data-id="${entry.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
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

function renderStatistics() {
  const entries = entriesForStatsRange();
  renderCategoryBreakdown(entries);
  drawCategoryChart(entries);
  drawTrendChart(entries);
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

function renderCategoryBreakdown(entries) {
  const costs = entries.filter((entry) => entry.type === "cost");
  const total = costs.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const byCategory = groupSum(costs, "category");
  const rows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  if (!rows.length) {
    els.categoryBreakdown.innerHTML = `<p class="empty-state">No cost categories for this range.</p>`;
    return;
  }

  els.categoryBreakdown.innerHTML = rows.map(([category, value]) => {
    const percent = total > 0 ? (value / total) * 100 : 0;
    return `
      <div class="breakdown-row">
        <strong>${escapeHtml(category)}</strong>
        <div class="breakdown-track"><div class="breakdown-fill" style="width:${percent}%"></div></div>
        <span>${money(value)}</span>
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

function drawDailyChart() {
  const canvas = els.dailyChart;
  const ctx = scaledContext(canvas);
  const { days } = monthBounds(state.selectedMonth);
  const daily = Array.from({ length: days }, (_, idx) => ({
    label: String(idx + 1),
    cost: 0,
    earning: 0
  }));

  entriesInMonth().forEach((entry) => {
    const day = Number(entry.date.slice(8, 10)) - 1;
    if (daily[day]) daily[day][entry.type] += Number(entry.amount);
  });

  drawGroupedBars(ctx, canvas, daily, {
    leftKey: "cost",
    rightKey: "earning",
    title: "Daily costs and earnings",
    leftColor: "#c24133",
    rightColor: "#128a57",
    leftLabel: "Costs",
    rightLabel: "Earnings"
  });
}

function drawCategoryChart(entries) {
  const canvas = els.categoryChart;
  const ctx = scaledContext(canvas);
  const byCategory = groupSum(entries.filter((entry) => entry.type === "cost"), "category");
  const rows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([label, value]) => ({ label, value }));
  drawHorizontalBars(ctx, canvas, rows, "Cost by category", "#0f766e");
}

function drawTrendChart(entries) {
  const canvas = els.trendChart;
  const ctx = scaledContext(canvas);
  const byMonth = new Map();
  entries.forEach((entry) => {
    const key = entry.date.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, { label: key, savings: 0 });
    byMonth.get(key).savings += entry.type === "earning" ? Number(entry.amount) : -Number(entry.amount);
  });
  const rows = [...byMonth.values()].sort((a, b) => a.label.localeCompare(b.label));
  drawLineChart(ctx, canvas, rows, "Savings trend", "#0f766e");
}

function scaledContext(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

function clearCanvas(ctx, canvas) {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.fillStyle = "#fbfdfc";
  ctx.fillRect(0, 0, rect.width, rect.height);
  return rect;
}

function drawGroupedBars(ctx, canvas, rows, config) {
  const rect = clearCanvas(ctx, canvas);
  const pad = { top: 38, right: 18, bottom: 34, left: 48 };
  const chartW = rect.width - pad.left - pad.right;
  const chartH = rect.height - pad.top - pad.bottom;
  const max = Math.max(...rows.flatMap((r) => [r[config.leftKey], r[config.rightKey]]), 1);

  drawTitle(ctx, config.title, pad.left, 22);
  drawLegend(ctx, rect.width - 190, 16, [
    [config.leftColor, config.leftLabel],
    [config.rightColor, config.rightLabel]
  ]);
  drawAxis(ctx, pad, rect, max);

  const groupW = chartW / rows.length;
  const barW = Math.max(2, Math.min(10, groupW * 0.28));
  rows.forEach((row, idx) => {
    const x = pad.left + idx * groupW + groupW / 2;
    const costH = (row[config.leftKey] / max) * chartH;
    const earningH = (row[config.rightKey] / max) * chartH;
    ctx.fillStyle = config.leftColor;
    ctx.fillRect(x - barW - 1, pad.top + chartH - costH, barW, costH);
    ctx.fillStyle = config.rightColor;
    ctx.fillRect(x + 1, pad.top + chartH - earningH, barW, earningH);
    if (rows.length <= 16 || idx % 2 === 0) drawSmallText(ctx, row.label, x - 4, rect.height - 13);
  });
}

function drawHorizontalBars(ctx, canvas, rows, title, color) {
  const rect = clearCanvas(ctx, canvas);
  drawTitle(ctx, title, 16, 24);

  if (!rows.length) {
    drawEmpty(ctx, rect, "No category data yet.");
    return;
  }

  const max = Math.max(...rows.map((r) => r.value), 1);
  const startY = 52;
  const rowH = Math.min(34, (rect.height - startY - 10) / rows.length);
  rows.forEach((row, idx) => {
    const y = startY + idx * rowH;
    const w = ((rect.width - 190) * row.value) / max;
    drawSmallText(ctx, truncate(row.label, 16), 16, y + 19);
    ctx.fillStyle = "#e8f1ef";
    ctx.fillRect(138, y + 5, rect.width - 185, 13);
    ctx.fillStyle = color;
    ctx.fillRect(138, y + 5, w, 13);
    drawSmallText(ctx, money(row.value), rect.width - 70, y + 19);
  });
}

function drawLineChart(ctx, canvas, rows, title, color) {
  const rect = clearCanvas(ctx, canvas);
  const pad = { top: 44, right: 20, bottom: 36, left: 54 };
  const chartW = rect.width - pad.left - pad.right;
  const chartH = rect.height - pad.top - pad.bottom;
  drawTitle(ctx, title, 16, 24);

  if (!rows.length) {
    drawEmpty(ctx, rect, "No savings trend yet.");
    return;
  }

  const values = rows.map((row) => row.savings);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const span = max - min || 1;
  drawAxis(ctx, pad, rect, max, min);

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  rows.forEach((row, idx) => {
    const x = rows.length === 1 ? pad.left + chartW / 2 : pad.left + (idx / (rows.length - 1)) * chartW;
    const y = pad.top + chartH - ((row.savings - min) / span) * chartH;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = color;
  rows.forEach((row, idx) => {
    const x = rows.length === 1 ? pad.left + chartW / 2 : pad.left + (idx / (rows.length - 1)) * chartW;
    const y = pad.top + chartH - ((row.savings - min) / span) * chartH;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    drawSmallText(ctx, row.label.slice(5), x - 8, rect.height - 13);
  });
}

function drawTitle(ctx, title, x, y) {
  ctx.fillStyle = "#13201f";
  ctx.font = "700 15px system-ui, sans-serif";
  ctx.fillText(title, x, y);
}

function drawSmallText(ctx, text, x, y) {
  ctx.fillStyle = "#667471";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText(text, x, y);
}

function drawLegend(ctx, x, y, items) {
  items.forEach(([color, label], idx) => {
    const offset = idx * 84;
    ctx.fillStyle = color;
    ctx.fillRect(x + offset, y, 10, 10);
    drawSmallText(ctx, label, x + offset + 14, y + 10);
  });
}

function drawAxis(ctx, pad, rect, max, min = 0) {
  const chartH = rect.height - pad.top - pad.bottom;
  const chartW = rect.width - pad.left - pad.right;
  ctx.strokeStyle = "#dbe4e2";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, pad.top + chartH);
  ctx.lineTo(pad.left + chartW, pad.top + chartH);
  ctx.stroke();
  drawSmallText(ctx, money(max), 8, pad.top + 4);
  if (min < 0) drawSmallText(ctx, money(min), 8, pad.top + chartH);
}

function drawEmpty(ctx, rect, message) {
  ctx.fillStyle = "#667471";
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillText(message, 18, rect.height / 2);
}

function truncate(text, length) {
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function renderAll() {
  renderSummary();
  renderDailyList();
  renderTransactions();
  renderStatistics();
  drawDailyChart();
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

  const existingIndex = state.entries.findIndex((item) => item.id === entry.id);
  if (existingIndex >= 0) state.entries[existingIndex] = entry;
  else state.entries.push(entry);

  saveEntries();
  resetForm(entry.date);
  renderAll();
  showToast(existingIndex >= 0 ? "Entry updated." : "Entry saved.");
}

function resetForm(date = `${state.selectedMonth}-01`) {
  els.editingId.value = "";
  els.formTitle.textContent = "Add entry";
  els.cancelEdit.classList.add("hidden");
  els.entryDate.value = date;
  els.amount.value = "";
  els.description.value = "";
  setEntryType("cost");
}

function editEntry(id) {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return;
  setEntryType(entry.type);
  els.editingId.value = entry.id;
  els.entryDate.value = entry.date;
  els.amount.value = entry.amount;
  els.category.value = entry.category;
  els.description.value = entry.description;
  els.formTitle.textContent = "Edit entry";
  els.cancelEdit.classList.remove("hidden");
  switchView("dashboard");
  showToast("Editing selected entry.");
}

function deleteEntry(id) {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return;
  const ok = confirm(`Delete "${entry.description}" (${money(entry.amount)})?`);
  if (!ok) return;
  state.entries = state.entries.filter((item) => item.id !== id);
  saveEntries();
  renderAll();
  showToast("Entry deleted.");
}

function exportJson() {
  downloadFile(
    `finance-backup-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), entries: state.entries }, null, 2),
    "application/json"
  );
}

function exportCsv() {
  const header = ["date", "type", "category", "description", "amount"];
  const rows = state.entries
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => header.map((key) => csvCell(entry[key])).join(","));
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
      if (!clean.length && imported.length) throw new Error("No valid entries");
      state.entries = clean;
      saveEntries();
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
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function bindEvents() {
  els.navItems.forEach((item) => {
    item.addEventListener("click", () => switchView(item.dataset.view));
  });
  els.monthInput.addEventListener("change", () => {
    state.selectedMonth = els.monthInput.value || monthKey(new Date());
    resetForm(`${state.selectedMonth}-01`);
    renderAll();
  });
  els.prevMonth.addEventListener("click", () => shiftMonth(-1));
  els.nextMonth.addEventListener("click", () => shiftMonth(1));
  els.typeRadios.forEach((radio) => {
    radio.addEventListener("change", () => populateCategorySelect(els.category, categoriesForType(selectedType())));
  });
  els.entryForm.addEventListener("submit", submitEntry);
  els.cancelEdit.addEventListener("click", () => resetForm(els.entryDate.value || todayIso()));
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
  window.addEventListener("resize", debounce(renderAll, 160));
}

function shiftMonth(delta) {
  const [year, month] = state.selectedMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  state.selectedMonth = monthKey(date);
  els.monthInput.value = state.selectedMonth;
  resetForm(`${state.selectedMonth}-01`);
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

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function init() {
  els.monthInput.value = state.selectedMonth;
  els.entryDate.value = todayIso();
  populateCategorySelect(els.category, costCategories);
  populateCategorySelect(els.filterCategory, [...new Set([...costCategories, ...earningCategories])], true);
  bindEvents();
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
  renderAll();
}

init();
