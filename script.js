const POOLS = ["vela", "parque", "toboganes", "delfines"];
const POOL_NAMES = {
  vela: "Vela",
  parque: "Parque Azul",
  toboganes: "Toboganes",
  delfines: "Delfines",
};
const POOL_ICONS = {
  vela: "⛵",
  parque: "🏊",
  toboganes: "🎢",
  delfines: "🐬",
};
const SECRET = "VILLASILVANIA";

let state = {
  guards: ["Salvador 1", "Salvador 2", "Salvador 3", "Salvador 4"],
  holidays: [],
  overrides: {},
};

function save() {
  localStorage.setItem("vs_state", JSON.stringify(state));
}
function load() {
  const s = localStorage.getItem("vs_state");
  if (s) state = JSON.parse(s);
}

function doLogin() {
  const v = document.getElementById("pwd-input").value.trim().toUpperCase();
  if (v === SECRET) {
    document.getElementById("login-screen").style.display = "none";
    const app = document.getElementById("main-app");
    app.style.display = "block";
    app.classList.add("visible");
    init();
  } else {
    const err = document.getElementById("login-err");
    err.textContent = "⚠️ Palabra clave incorrecta";
    err.style.animation = "none";
    requestAnimationFrame(() => (err.style.animation = "shake .3s ease"));
    setTimeout(() => (err.textContent = ""), 2500);
  }
}

document.getElementById("pwd-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") doLogin();
});

function doLogout() {
  document.getElementById("main-app").style.display = "none";
  document.getElementById("main-app").classList.remove("visible");
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("pwd-input").value = "";
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isWorkDay(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return true;
  if (state.holidays.includes(dateStr)) return true;
  return false;
}

function dayLabel(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const dow = d.getDay();
  const names = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  let tag = names[dow];
  if (state.holidays.includes(dateStr)) tag += " · Festivo";
  return tag;
}

function workDayIndex(dateStr) {
  const base = new Date("2025-01-01T12:00:00");
  const target = new Date(dateStr + "T12:00:00");
  let count = 0;
  const cur = new Date(base);
  while (cur <= target) {
    const ds = cur.toISOString().slice(0, 10);
    if (isWorkDay(ds)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count - 1;
}

function baseRotation(dateStr) {
  const idx = workDayIndex(dateStr);
  const n = state.guards.length;
  const result = {};
  POOLS.forEach((pool, pi) => {
    const gi = (((idx + pi) % n) + n) % n;
    result[pool] = state.guards[gi] || "—";
  });
  return result;
}

function getRotation(dateStr) {
  if (state.overrides[dateStr]) return state.overrides[dateStr];
  return baseRotation(dateStr);
}

function loadDay() {
  const dateStr = document.getElementById("date-picker").value;
  if (!dateStr) return;
  const badge = document.getElementById("day-label");
  const noWork = document.getElementById("no-work-msg");
  const grid = document.querySelector(".pools-grid");
  badge.textContent = dayLabel(dateStr);
  if (!isWorkDay(dateStr)) {
    badge.className = "day-badge not-work";
    grid.style.opacity = ".3";
    noWork.style.display = "block";
    POOLS.forEach((p) => {
      document.getElementById("name-" + p).textContent = "—";
    });
    return;
  }
  badge.className = "day-badge weekend";
  grid.style.opacity = "1";
  noWork.style.display = "none";
  const rot = getRotation(dateStr);
  POOLS.forEach((p) => {
    const chip = document.getElementById("chip-" + p);
    chip.classList.add("rotating");
    setTimeout(() => {
      document.getElementById("name-" + p).textContent = rot[p] || "—";
      chip.classList.remove("rotating");
    }, 180);
  });
}

function renderHistory() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 3, 0);
  const rows = [];
  const cur = new Date(start);
  while (cur <= end) {
    const ds = cur.toISOString().slice(0, 10);
    if (isWorkDay(ds)) rows.push(ds);
    cur.setDate(cur.getDate() + 1);
  }
  const tbody = document.getElementById("history-body");
  const noHist = document.getElementById("no-history");
  if (!rows.length) {
    noHist.style.display = "block";
    tbody.innerHTML = "";
    return;
  }
  noHist.style.display = "none";
  rows.sort((a, b) => b.localeCompare(a));
  const ts = todayStr();
  tbody.innerHTML = rows
    .map((ds) => {
      const rot = getRotation(ds);
      const isToday = ds === ts;
      const ov = state.overrides[ds] ? " ✏️" : "";
      return `<tr style="${isToday ? "background:rgba(0,180,216,.1);" : ""}" >
      <td>${formatDate(ds)}${ov}</td>
      <td>${rot.vela || "—"}</td>
      <td>${rot.parque || "—"}</td>
      <td>${rot.toboganes || "—"}</td>
      <td>${rot.delfines || "—"}</td>
    </tr>`;
    })
    .join("");
}

function formatDate(ds) {
  const d = new Date(ds + "T12:00:00");
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function loadEditDay() {
  const dateStr = document.getElementById("edit-date-picker").value;
  if (!dateStr) return;
  const badge = document.getElementById("edit-day-label");
  badge.textContent = dayLabel(dateStr);
  badge.className = isWorkDay(dateStr)
    ? "day-badge weekend"
    : "day-badge not-work";
  const rot = isWorkDay(dateStr) ? getRotation(dateStr) : baseRotation(dateStr);
  const grid = document.getElementById("edit-grid");
  grid.innerHTML = POOLS.map(
    (p) => `
    <div class="edit-pool-block">
      <label>${POOL_ICONS[p]} ${POOL_NAMES[p]}</label>
      <select id="edit-sel-${p}">
        ${state.guards.map((g) => `<option value="${g}" ${rot[p] === g ? "selected" : ""}>${g}</option>`).join("")}
      </select>
    </div>
  `,
  ).join("");
}

function saveEdit() {
  const dateStr = document.getElementById("edit-date-picker").value;
  if (!dateStr) return;
  const ov = {};
  POOLS.forEach((p) => {
    ov[p] = document.getElementById("edit-sel-" + p).value;
  });
  state.overrides[dateStr] = ov;
  save();
  renderHistory();
  if (document.getElementById("date-picker").value === dateStr) loadDay();
  showToast("✅ Rotación guardada para " + formatDate(dateStr));
}

function resetEdit() {
  const dateStr = document.getElementById("edit-date-picker").value;
  if (!dateStr) return;
  delete state.overrides[dateStr];
  save();
  loadEditDay();
  renderHistory();
  if (document.getElementById("date-picker").value === dateStr) loadDay();
  showToast("↩️ Rotación restaurada al automático");
}

function renderGuardList() {
  const list = document.getElementById("guard-list");
  list.innerHTML = state.guards
    .map(
      (g, i) => `
    <div class="guard-item">
      <div class="guard-num">${i + 1}</div>
      <input type="text" value="${g}" id="guard-inp-${i}" placeholder="Nombre salvavidas" />
    </div>
  `,
    )
    .join("");
}

function saveGuards() {
  const newGuards = state.guards.map((_, i) => {
    const v = document.getElementById("guard-inp-" + i)?.value.trim();
    return v || state.guards[i];
  });
  if (newGuards.some((g) => !g)) {
    showToast("⚠️ Todos deben tener nombre");
    return;
  }
  state.guards = newGuards;
  save();
  loadDay();
  renderHistory();
  loadEditDay();
  showToast("✅ Salvavidas guardados");
}

function renderHolidayList() {
  const list = document.getElementById("holiday-list");
  if (!state.holidays.length) {
    list.innerHTML =
      '<div style="opacity:.5;font-size:.85rem;padding:.4rem 0;">Sin festivos registrados</div>';
    return;
  }
  list.innerHTML = state.holidays
    .sort()
    .map(
      (h) => `
    <div class="holiday-item">
      <span><span class="holiday-date">${formatDate(h)}</span></span>
      <button class="btn-remove" style="background:none;border:none;cursor:pointer;font-size:1.1rem;color:var(--coral);" onclick="removeHoliday('${h}')">🗑️</button>
    </div>
  `,
    )
    .join("");
}

function addHoliday() {
  const v = document.getElementById("new-holiday-date").value;
  if (!v) return;
  if (!state.holidays.includes(v)) {
    state.holidays.push(v);
    save();
    renderHolidayList();
    renderHistory();
    loadDay();
    showToast("📅 Festivo agregado: " + formatDate(v));
  }
}

function removeHoliday(h) {
  state.holidays = state.holidays.filter((x) => x !== h);
  save();
  renderHolidayList();
  renderHistory();
  loadDay();
  showToast("🗑️ Festivo eliminado");
}

function switchTab(tab, btn) {
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  btn.classList.add("active");
  if (tab === "historial") renderHistory();
  if (tab === "editar") loadEditDay();
  if (tab === "config") {
    renderGuardList();
    renderHolidayList();
  }
}

function showToast(msg) {
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

function init() {
  load();
  const today = todayStr();
  document.getElementById("date-picker").value = today;
  document.getElementById("edit-date-picker").value = today;
  renderGuardList();
  renderHolidayList();
  loadDay();
  loadEditDay();
  renderHistory();
}