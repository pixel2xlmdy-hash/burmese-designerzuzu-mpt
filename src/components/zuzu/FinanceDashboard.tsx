import React, { useEffect, useMemo, useState } from "react";

export type FinanceType = "income" | "expense";

export interface FinanceEntry {
  id: string;
  type: FinanceType;
  category: string;
  note: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

const STORAGE_KEY = "mpt_fit_tailor_finance_v1";

const QUICK_EXPENSE_CATEGORIES = [
  "ဝန်ထမ်းလစာ",
  "ပစ္စည်း / ကုန်ကြမ်း ဝယ်စရိတ်",
  "Maintenance ကုန်ကျစရိတ်",
  "ဆိုင်ငှားခ / မီတာခ",
];

const QUICK_INCOME_CATEGORIES = [
  "အပ်ထည် ဝင်ငွေ",
  "အထည်ရောင်းရငွေ",
  "အခြား ဝင်ငွေ",
];

function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMMK(num: number): string {
  const sign = num < 0 ? "-" : "";
  return `${sign}${Math.abs(Math.round(num)).toLocaleString("en-US")}`;
}

function loadEntries(): FinanceEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        (item.type === "income" || item.type === "expense") &&
        typeof item.amount === "number" &&
        !Number.isNaN(item.amount) &&
        typeof item.date === "string"
    );
  } catch {
    return [];
  }
}

function saveEntries(entries: FinanceEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage quota errors safely
  }
}

export function FinanceDashboard() {
  const [entries, setEntries] = useState<FinanceEntry[]>(() => loadEntries());
  const [type, setType] = useState<FinanceType>("expense");
  const [category, setCategory] = useState<string>("ဝန်ထမ်းလစာ");
  const [note, setNote] = useState<string>("");
  const [amountInput, setAmountInput] = useState<string>("");
  const [dateInput, setDateInput] = useState<string>(() => todayISO());
  const [periodTab, setPeriodTab] = useState<"daily" | "monthly" | "yearly">("daily");
  const [filterType, setFilterType] = useState<"all" | FinanceType>("all");
  const [searchText, setSearchText] = useState<string>("");

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  const selectedDay = dateInput || todayISO();
  const selectedMonth = selectedDay.slice(0, 7); // YYYY-MM
  const selectedYear = selectedDay.slice(0, 4); // YYYY

  const handleSwitchType = (nextType: FinanceType) => {
    setType(nextType);
    if (nextType === "expense" && !category.trim()) {
      setCategory("ဝန်ထမ်းလစာ");
    } else if (nextType === "income" && !category.trim()) {
      setCategory("အပ်ထည် ဝင်ငွေ");
    }
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedNum = Number(amountInput.replace(/,/g, "").trim());
    if (!cleanedNum || cleanedNum <= 0) return;

    const finalCategory =
      category.trim() || (type === "expense" ? "အထွေထွေ ကုန်ကျစရိတ်" : "အထွေထွေ ဝင်ငွေ");

    const newItem: FinanceEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      category: finalCategory,
      note: note.trim(),
      amount: cleanedNum,
      date: dateInput || todayISO(),
    };

    setEntries((prev) => [newItem, ...prev]);
    setAmountInput("");
    setNote("");
  };

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((item) => item.id !== id));
  };

  const summarize = (list: FinanceEntry[]) => {
    let income = 0;
    let expense = 0;
    for (const item of list) {
      if (item.type === "income") income += item.amount;
      else expense += item.amount;
    }
    return {
      income,
      expense,
      net: income - expense,
    };
  };

  const dailySummary = useMemo(
    () => summarize(entries.filter((item) => item.date === selectedDay)),
    [entries, selectedDay]
  );

  const monthlySummary = useMemo(
    () => summarize(entries.filter((item) => item.date.startsWith(selectedMonth))),
    [entries, selectedMonth]
  );

  const yearlySummary = useMemo(
    () => summarize(entries.filter((item) => item.date.startsWith(selectedYear))),
    [entries, selectedYear]
  );

  const activeSummary =
    periodTab === "daily"
      ? dailySummary
      : periodTab === "monthly"
      ? monthlySummary
      : yearlySummary;

  const visibleEntries = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return entries.filter((item) => {
      if (periodTab === "daily" && item.date !== selectedDay) return false;
      if (periodTab === "monthly" && !item.date.startsWith(selectedMonth)) return false;
      if (periodTab === "yearly" && !item.date.startsWith(selectedYear)) return false;
      if (filterType !== "all" && item.type !== filterType) return false;
      if (q) {
        const hay = `${item.category} ${item.note} ${item.date}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, periodTab, selectedDay, selectedMonth, selectedYear, filterType, searchText]);

  const quickSuggestions =
    type === "expense" ? QUICK_EXPENSE_CATEGORIES : QUICK_INCOME_CATEGORIES;

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div>
          <h2 className="text-base font-bold">
            Daily / လချုပ် / နှစ်ချုပ် ဝင်ငွေ - ထွက်ငွေ Dashboard
          </h2>
          <p className="text-xs text-muted-foreground">
            လစာ၊ ကုန်ကြမ်း၊ Maintenance စသည်ဖြင့် လိုသလို ရေးထည့်ပြီး အပေါင်း/အနှုတ် တွက်ချက်ရန်
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border p-1 text-xs">
          <button
            type="button"
            onClick={() => setPeriodTab("daily")}
            className={`rounded-md px-2.5 py-1 font-medium ${
              periodTab === "daily" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            Daily ({selectedDay})
          </button>
          <button
            type="button"
            onClick={() => setPeriodTab("monthly")}
            className={`rounded-md px-2.5 py-1 font-medium ${
              periodTab === "monthly" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            လချုပ် ({selectedMonth})
          </button>
          <button
            type="button"
            onClick={() => setPeriodTab("yearly")}
            className={`rounded-md px-2.5 py-1 font-medium ${
              periodTab === "yearly" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            နှစ်ချုပ် ({selectedYear})
          </button>
        </div>
      </div>

      {/* Summary Cards for Active Period */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground">
            {periodTab === "daily"
              ? "နေ့စဉ် ဝင်ငွေ (+)"
              : periodTab === "monthly"
              ? "လချုပ် ဝင်ငွေ (+)"
              : "နှစ်ချုပ် ဝင်ငွေ (+)"}
          </div>
          <div className="mt-1 text-lg font-bold text-emerald-600">
            +{formatMMK(activeSummary.income)}
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground">
            {periodTab === "daily"
              ? "နေ့စဉ် ထွက်ငွေ (-)"
              : periodTab === "monthly"
              ? "လချုပ် ထွက်ငွေ (-)"
              : "နှစ်ချုပ် ထွက်ငွေ (-)"}
          </div>
          <div className="mt-1 text-lg font-bold text-rose-600">
            -{formatMMK(activeSummary.expense)}
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground">
            အပေါင်း / အနှုတ် လက်ကျန် (Net)
          </div>
          <div
            className={`mt-1 text-lg font-bold ${
              activeSummary.net >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {activeSummary.net >= 0
              ? `+${formatMMK(activeSummary.net)}`
              : formatMMK(activeSummary.net)}
          </div>
        </div>
      </div>

      {/* Quick Reference Strip (Daily / Monthly / Yearly) */}
      <div className="grid grid-cols-1 gap-2 rounded-lg border bg-muted/30 p-2.5 text-xs sm:grid-cols-3">
        <div>
          <span className="font-semibold">Daily လက်ကျန်: </span>
          <span className={dailySummary.net >= 0 ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}>
            {dailySummary.net >= 0 ? `+${formatMMK(dailySummary.net)}` : formatMMK(dailySummary.net)}
          </span>
        </div>
        <div>
          <span className="font-semibold">လချုပ် လက်ကျန်: </span>
          <span className={monthlySummary.net >= 0 ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}>
            {monthlySummary.net >= 0 ? `+${formatMMK(monthlySummary.net)}` : formatMMK(monthlySummary.net)}
          </span>
        </div>
        <div>
          <span className="font-semibold">နှစ်ချုပ် လက်ကျန်: </span>
          <span className={yearlySummary.net >= 0 ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}>
            {yearlySummary.net >= 0 ? `+${formatMMK(yearlySummary.net)}` : formatMMK(yearlySummary.net)}
          </span>
        </div>
      </div>

      {/* Entry Form */}
      <form onSubmit={handleAddEntry} className="space-y-3 rounded-lg border p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleSwitchType("expense")}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
              type === "expense"
                ? "bg-rose-600 text-white border-rose-600"
                : "bg-background hover:bg-muted"
            }`}
          >
            ထွက်ငွေ (-) ထည့်မည်
          </button>
          <button
            type="button"
            onClick={() => handleSwitchType("income")}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
              type === "income"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-background hover:bg-muted"
            }`}
          >
            ဝင်ငွေ (+) ထည့်မည်
          </button>
        </div>

        {/* Custom / Quick Category Chips */}
        <div className="flex flex-wrap gap-1.5">
          {quickSuggestions.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setCategory(label)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] ${
                category === label ? "bg-secondary font-semibold" : "hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium">အမျိုးအစား / အကြောင်းအရာ (လိုသလို ရေးပါ)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="ဥပမာ- ဝန်ထမ်းလစာ / Maintenance"
              className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium">ငွေပမာဏ</label>
            <input
              type="number"
              min="1"
              step="any"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="0"
              className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium">ရက်စွဲ</label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium">မှတ်ချက် (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="အသေးစိတ် မှတ်စု..."
              className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            စာရင်း ထည့်သွင်းမည်
          </button>
        </div>
      </form>

      {/* Filter & Search */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`rounded-md border px-2.5 py-1 ${
              filterType === "all" ? "bg-secondary font-semibold" : "hover:bg-muted"
            }`}
          >
            အားလုံး
          </button>
          <button
            type="button"
            onClick={() => setFilterType("income")}
            className={`rounded-md border px-2.5 py-1 ${
              filterType === "income" ? "bg-secondary font-semibold" : "hover:bg-muted"
            }`}
          >
            ဝင်ငွေ (+)
          </button>
          <button
            type="button"
            onClick={() => setFilterType("expense")}
            className={`rounded-md border px-2.5 py-1 ${
              filterType === "expense" ? "bg-secondary font-semibold" : "hover:bg-muted"
            }`}
          >
            ထွက်ငွေ (-)
          </button>
        </div>

        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="လစာ / ကုန်ကြမ်း / မှတ်ချက် ရှာရန်..."
          className="w-full rounded-md border bg-background px-2.5 py-1 text-xs sm:w-56"
        />
      </div>

      {/* Entries List */}
      <div className="divide-y rounded-lg border">
        {visibleEntries.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            ရွေးချယ်ထားသော အချိန်ကာလအတွက် ဝင်ငွေ/ထွက်ငွေ စာရင်း မရှိသေးပါ။
          </div>
        ) : (
          visibleEntries.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 p-2.5 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      item.type === "income"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {item.type === "income" ? "ဝင်ငွေ (+)" : "ထွက်ငွေ (-)"}
                  </span>
                  <span className="font-semibold">{item.category}</span>
                  <span className="text-muted-foreground">({item.date})</span>
                </div>
                {item.note && (
                  <div className="text-[11px] text-muted-foreground">{item.note}</div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`font-bold ${
                    item.type === "income" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {item.type === "income"
                    ? `+${formatMMK(item.amount)}`
                    : `-${formatMMK(item.amount)}`}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteEntry(item.id)}
                  className="rounded border px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  ဖျက်ရန်
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FinanceDashboard;
