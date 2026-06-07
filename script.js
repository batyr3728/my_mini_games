document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const themeBtn = document.getElementById("themeBtn");
  const langBtn = document.getElementById("langBtn");
  const viewBtn = document.getElementById("viewBtn");
  const title = document.getElementById("title");

  const gamesGrid = document.getElementById("gamesGrid");
  const colorPicker = document.getElementById("colorPicker");
  
  // Элементы бургера
  const burgerToggle = document.getElementById("burgerToggle");
  const controlsMenu = document.getElementById("controlsMenu");

  // Список всех карточек игр для сортировки
  const g2048Btn = document.getElementById("g2048Btn");
  const memoryBtn = document.getElementById("memoryBtn");
  const minesweeperBtn = document.getElementById("minesweeperBtn");
  const rpsBtn = document.getElementById("rpsBtn");
  const tttBtn = document.getElementById("tttBtn");
  const sudokuBtn = document.getElementById("sudokuBtn");
  const soonBtns = document.querySelectorAll(".soon");

  // Чтение базовых настроек
  let theme = localStorage.getItem("theme") || "light";
  let lang = localStorage.getItem("lang") || "ru";
  let view = localStorage.getItem("view") || "grid";
  let accentColor = localStorage.getItem("accentColor") || "green";

  let gameVisVisits = JSON.parse(localStorage.getItem("gameVisVisits")) || {
    g2048Btn: 0,
    memoryBtn: 0,
    minesweeperBtn: 0,
    rpsBtn: 0,
    tttBtn: 0,
    sudokuBtn: 0
  };

  const gameNames = {
    g2048Btn: "2048",
    memoryBtn: "На память",
    minesweeperBtn: "Сапер",
    rpsBtn: "Камень Ножницы Бумага",
    tttBtn: "Крестики Нолики",
    sudokuBtn: "Судоку"
  };

  /* ЛОГИКА БУРГЕРА (Три точки) */
  if (burgerToggle && controlsMenu) {
    burgerToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      controlsMenu.classList.toggle("open");
    });

    // Закрываем меню при клике в любое другое место экрана
    document.addEventListener("click", (e) => {
      if (!controlsMenu.contains(e.target) && e.target !== burgerToggle) {
        controlsMenu.classList.remove("open");
      }
    });
  }

  /* СОРТИРОВКА ИГР */
  function sortGames() {
    if (!gamesGrid) return;
    const cards = [g2048Btn, memoryBtn, minesweeperBtn, rpsBtn, tttBtn, sudokuBtn].filter(Boolean);

    cards.sort((a, b) => {
      const timeA = gameVisVisits[a.id] || 0;
      const timeB = gameVisVisits[b.id] || 0;
      if (timeA !== timeB) return timeB - timeA;

      const nameA = gameNames[a.id] || "";
      const nameB = gameNames[b.id] || "";
      return nameA.localeCompare(nameB, lang === "ru" ? "ru" : "en");
    });

    cards.forEach(card => gamesGrid.appendChild(card));
    if (soonBtns) {
      soonBtns.forEach(btn => gamesGrid.appendChild(btn));
    }
  }

  function handleGameClick(gameId, folder) {
    gameVisVisits[gameId] = Date.now();
    localStorage.setItem("gameVisVisits", JSON.stringify(gameVisVisits));
    window.location.href = `games/${folder}/index.html`;
  }

  function applyTheme() {
    if (!body || !themeBtn) return;
    body.setAttribute("data-theme", theme);
    themeBtn.textContent = theme === "light" ? "🌗" : "🌓";
    localStorage.setItem("theme", theme);
  }

  function applyAccentColor() {
    if (!body) return;
    body.setAttribute("data-color", accentColor);
    localStorage.setItem("accentColor", accentColor);
    
    document.querySelectorAll(".color-dot").forEach(dot => {
      dot.classList.toggle("active", dot.getAttribute("data-color") === accentColor);
    });
  }

  function applyLang() {
    const isRu = lang === "ru";
    if (title) title.textContent = isRu ? "Мини-игры" : "Mini Games";
    if (langBtn) langBtn.textContent = isRu ? "🌍" : "🌎";
    
    if (g2048Btn) g2048Btn.innerHTML = "2048";
    if (memoryBtn) memoryBtn.innerHTML = isRu ? "На память" : "Memory";
    if (minesweeperBtn) minesweeperBtn.innerHTML = isRu ? "Сапер" : "Minesweeper";
    if (rpsBtn) rpsBtn.innerHTML = isRu ? "Камень<br>Ножницы<br>Бумага" : "Rock<br>Paper<br>Scissors";
    if (tttBtn) tttBtn.innerHTML = isRu ? "Крестики<br>Нолики" : "Tic<br>Tac<br>Toe";
    if (sudokuBtn) sudokuBtn.innerHTML = isRu ? "Судоку" : "Sudoku";
    
    if (soonBtns) {
      soonBtns.forEach(b => { b.textContent = isRu ? "Скоро" : "Soon"; });
    }
    localStorage.setItem("lang", lang);
  }

  function applyView() {
    if (!gamesGrid || !viewBtn) return;
    gamesGrid.classList.remove("grid", "list");
    gamesGrid.classList.add(view);
    viewBtn.textContent = view === "grid" ? "🔳" : "📄";
    localStorage.setItem("view", view);
  }

  if (g2048Btn) g2048Btn.addEventListener("click", () => handleGameClick("g2048Btn", "2048"));
  if (memoryBtn) memoryBtn.addEventListener("click", () => handleGameClick("memoryBtn", "memory"));
  if (minesweeperBtn) minesweeperBtn.addEventListener("click", () => handleGameClick("minesweeperBtn", "minesweeper"));
  if (rpsBtn) rpsBtn.addEventListener("click", () => handleGameClick("rpsBtn", "rps"));
  if (tttBtn) tttBtn.addEventListener("click", () => handleGameClick("tttBtn", "ttt"));
  if (sudokuBtn) sudokuBtn.addEventListener("click", () => handleGameClick("sudokuBtn", "sudoku"));

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      theme = theme === "light" ? "dark" : "light";
      applyTheme();
    });
  }

  if (langBtn) {
    langBtn.addEventListener("click", () => {
      lang = lang === "ru" ? "en" : "ru";
      applyLang();
      sortGames();
    });
  }

  if (viewBtn) {
    viewBtn.addEventListener("click", () => {
      view = view === "grid" ? "list" : "grid";
      applyView();
    });
  }

  if (colorPicker) {
    colorPicker.addEventListener("click", (e) => {
      if (e.target.classList.contains("color-dot")) {
        accentColor = e.target.getAttribute("data-color");
        applyAccentColor();
      }
    });
  }

  applyTheme();
  applyAccentColor();
  applyLang();
  applyView();
  sortGames();
});
