const body = document.body;
const themeBtn = document.getElementById("themeBtn");
const langBtn = document.getElementById("langBtn");
const viewBtn = document.getElementById("viewBtn");
const title = document.getElementById("title");

const gamesGrid = document.getElementById("gamesGrid");
const colorPicker = document.getElementById("colorPicker");

// Список всех карточек игр для сортировки
const g2048Btn = document.getElementById("g2048Btn");
const memoryBtn = document.getElementById("memoryBtn");
const minesweeperBtn = document.getElementById("minesweeperBtn");
const rpsBtn = document.getElementById("rpsBtn");
const tttBtn = document.getElementById("tttBtn");
const soonBtns = document.querySelectorAll(".soon");

// Чтение базовых настроек
let theme = localStorage.getItem("theme") || "light";
let lang = localStorage.getItem("lang") || "ru";
let view = localStorage.getItem("view") || "grid";
let accentColor = localStorage.getItem("accentColor") || "green";

// Объект для хранения времени захода в игры
let gameVisits = JSON.parse(localStorage.getItem("gameVisVisits")) || {
  g2048Btn: 0,
  memoryBtn: 0,
  minesweeperBtn: 0,
  rpsBtn: 0,
  tttBtn: 0
};

// Объект со строгими именами игр для алфавитной сортировки
const gameNames = {
  g2048Btn: "2048",
  memoryBtn: "На память",
  minesweeperBtn: "Сапер",
  rpsBtn: "Камень Ножницы Бумага",
  tttBtn: "Крестики Нолики"
};

/* СОРТИРОВКА ИГР (Время захода + Алфавит) */
function sortGames() {
  if (!gamesGrid) return;

  // Собираем все карточки игр в массив
  const cards = [g2048Btn, memoryBtn, minesweeperBtn, rpsBtn, tttBtn].filter(Boolean);

  cards.sort((a, b) => {
    const timeA = gameVisits[a.id] || 0;
    const timeB = gameVisits[b.id] || 0;

    // 1. Сортировка по времени захода (свежие — первыми)
    if (timeA !== timeB) {
      return timeB - timeA;
    }

    // 2. Если не заходили, сортируем по алфавиту названия
    const nameA = gameNames[a.id] || "";
    const nameB = gameNames[b.id] || "";
    return nameA.localeCompare(nameB, lang === "ru" ? "ru" : "en");
  });

  // Перестраиваем элементы в HTML в новом порядке
  cards.forEach(card => gamesGrid.appendChild(card));

  // Заглушки "Скоро" кидаем в самый конец
  soonBtns.forEach(btn => gamesGrid.appendChild(btn));
}

/* ФУНКЦИЯ ФИКСАЦИИ ВРЕМЕНИ ЗАХОДА */
function handleGameClick(gameId, folder) {
  gameVisits[gameId] = Date.now();
  localStorage.setItem("gameVisVisits", JSON.stringify(gameVisits));
  window.location.href = `games/${folder}/index.html`;
}

/* THEME */
function applyTheme() {
  body.setAttribute("data-theme", theme);
  themeBtn.textContent = theme === "light" ? "🌗" : "🌓";
  localStorage.setItem("theme", theme);
}

/* CUSTOM ACCENT COLOR */
function applyAccentColor() {
  body.setAttribute("data-color", accentColor);
  localStorage.setItem("accentColor", accentColor);
  
  document.querySelectorAll(".color-dot").forEach(dot => {
    dot.classList.toggle("active", dot.getAttribute("data-color") === accentColor);
  });
}

/* LANGUAGE (Исправлено под твою чистую структуру HTML) */
function applyLang() {
  const isRu = lang === "ru";
  title.textContent = isRu ? "Мини-игры" : "Mini Games";
  if (langBtn) langBtn.textContent = isRu ? "🌍" : "🌎"; // Вращаем планету в меню
  
  // Меняем текст напрямую внутри кнопок-карточек
  if (g2048Btn) g2048Btn.innerHTML = "2048";
  if (memoryBtn) memoryBtn.innerHTML = isRu ? "На память" : "Memory";
  if (minesweeperBtn) minesweeperBtn.innerHTML = isRu ? "Сапер" : "Minesweeper";
  if (rpsBtn) rpsBtn.innerHTML = isRu ? "Камень<br>Ножницы<br>Бумага" : "Rock<br>Paper<br>Scissors";
  if (tttBtn) tttBtn.innerHTML = isRu ? "Крестики<br>Нолики" : "Tic<br>Tac<br>Toe";
  
  soonBtns.forEach(b => {
    b.textContent = isRu ? "Скоро" : "Soon";
  });
  
  localStorage.setItem("lang", lang);
}

/* VIEW MODE */
function applyView() {
  gamesGrid.classList.remove("grid", "list");
  gamesGrid.classList.add(view);
  viewBtn.textContent = view === "grid" ? "🔳" : "📄";
  localStorage.setItem("view", view);
}

/* НАВИГАЦИЯ С ФИКСАЦИЕЙ КЛИКА */
if (g2048Btn) g2048Btn.addEventListener("click", () => handleGameClick("g2048Btn", "2048"));
if (memoryBtn) memoryBtn.addEventListener("click", () => handleGameClick("memoryBtn", "memory"));
if (minesweeperBtn) minesweeperBtn.addEventListener("click", () => handleGameClick("minesweeperBtn", "minesweeper"));
if (rpsBtn) rpsBtn.addEventListener("click", () => handleGameClick("rpsBtn", "rps"));
if (tttBtn) tttBtn.addEventListener("click", () => handleGameClick("tttBtn", "ttt"));

/* EVENTS */
themeBtn.addEventListener("click", () => {
  theme = theme === "light" ? "dark" : "light";
  applyTheme();
});

langBtn.addEventListener("click", () => {
  lang = lang === "ru" ? "en" : "ru";
  applyLang();
  sortGames(); // Пересортируем, если язык изменился, а заходов не было
});

viewBtn.addEventListener("click", () => {
  view = view === "grid" ? "list" : "grid";
  applyView();
});

if (colorPicker) {
  colorPicker.addEventListener("click", (e) => {
    if (e.target.classList.contains("color-dot")) {
      accentColor = e.target.getAttribute("data-color");
      applyAccentColor();
    }
  });
}

/* INIT */
applyTheme();
applyAccentColor();
applyLang();
applyView();
sortGames(); // Запуск сортировки при старте меню
