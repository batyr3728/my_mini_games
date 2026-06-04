// VARIABLES
const cells = document.querySelectorAll(".cell");
const boardEl = document.getElementById("board");
const indX = document.getElementById("indX");
const indO = document.getElementById("indO");
const avatarO = document.getElementById("avatarO");
const resetBtn = document.getElementById("resetBtn");
const difficultyBtn = document.getElementById("difficultyBtn");
const modeBot = document.getElementById("modeBot");
const modePvp = document.getElementById("modePvp");
const backBtn = document.getElementById("backBtn");
const scoreXEl = document.getElementById("scoreX");
const scoreOEl = document.getElementById("scoreO");
const infiniteBtn = document.getElementById("infiniteBtn");
const infoBtn = document.getElementById("infoBtn");
const settingsModal = document.getElementById("settingsModal");
const closeModalBtn = document.getElementById("closeModal");
const langBtn = document.getElementById("langBtn");
const themeBtn = document.getElementById("themeBtn");

const body = document.body;

let board = Array(9).fill(null);
let current = "X";
let gameOver = false;
let waitingBot = false;
let winLine = [];

let mode = localStorage.getItem("mode") || "bot";
let difficulty = localStorage.getItem("difficulty") || "easy";
let lang = localStorage.getItem("lang") || "ru";
let theme = localStorage.getItem("theme") || "light";
let accentColor = localStorage.getItem("accentColor") || "green";
let infiniteMode = localStorage.getItem("infiniteMode") === "true";

let xMovesOrder = [];
let oMovesOrder = [];

// СБРАСЫВАЕМЫЙ СЧЁТ
let scores = JSON.parse(localStorage.getItem("scores")) || {
  bot: { X: 0, O: 0 },
  pvp: { X: 0, O: 0 }
};

// ПОСТОЯННАЯ СТАТИСТИКА
let stats = JSON.parse(localStorage.getItem("tictactoe_stats")) || {
  pvp: { classic: { X: 0, O: 0 }, infinite: { X: 0, O: 0 } },
  bot: {
    easy: { classic: { player: 0, bot: 0 }, infinite: { player: 0, bot: 0 } },
    hard: { classic: { player: 0, bot: 0 }, infinite: { player: 0, bot: 0 } }
  }
};

let totalBotWinsX = parseInt(localStorage.getItem("totalBotWinsX") || "0");

const dict = {
  ru: { 
    vsBot: "VS BOT", pvp: "2 ИГРОКА", easy: "ЛЕГКО", hard: "СЛОЖНО", reset: "СБРОС",
    settings: "Настройки", permanentStats: "Статистика (навсегда)", pvpTitle: "PvP",
    vsBotTitle: "Против бота", easyTitle: "Лёгкий", hardTitle: "Сложный",
    classic: "Классика", infinite: "Бесконечный", player: "Игрок", bot: "Бот", xWins: "X", oWins: "O"
  },
  en: { 
    vsBot: "VS BOT", pvp: "2 PLAYERS", easy: "EASY", hard: "HARD", reset: "RESET",
    settings: "Settings", permanentStats: "Permanent Stats", pvpTitle: "Vs Bot",
    vsBotTitle: "Vs Bot", easyTitle: "Easy", hardTitle: "Hard",
    classic: "Classic", infinite: "Infinite", player: "Player", bot: "Bot", xWins: "X", oWins: "O"
  }
};

// Все 8 выигрышных комбинаций
const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// Звуковые массивы
const victorySounds = ["sound/victory/among-us-victory.mp3", "sound/victory/flawless-victory.mp3", "sound/victory/mario-sssb-victory.mp3", "sound/victory/plants-vs-zombies-victory.mp3", "sound/victory/rayman-victory.mp3", "sound/victory/tyan-victory.mp3", "sound/victory/ura-pobeda.mp3", "sound/victory/victory-1.mp3", "sound/victory/victory-2.mp3", "sound/victory/victory-3.mp3", "sound/victory/victory-4.mp3"];
const epicVictorySounds = ["sound/victory/epic-victory/ff-victory.mp3", "sound/victory/epic-victory/pvz-final-victory.mp3", "sound/victory/epic-victory/rayman-victory.mp3", "sound/victory/epic-victory/ura-pobeda.mp3"];
const defeatSounds = ["sound/defeat/fail-1.mp3", "sound/defeat/fail-2.mp3", "sound/defeat/fail-3.mp3", "sound/defeat/half-life-death-sound.mp3", "sound/defeat/mario-fail-sound.mp3", "sound/defeat/mission-failed.mp3", "sound/defeat/roblox-death-sound.mp3", "sound/defeat/sound-fail-fallo.mp3", "sound/defeat/spongebob-fail.mp3", "sound/defeat/watch-dogs-failed-mission.mp3"];

const gameSound = document.getElementById("gameSound");

function playRandomVictory() {
  if (!victorySounds.length) return;
  gameSound.src = victorySounds[Math.floor(Math.random() * victorySounds.length)];
  gameSound.volume = 0.7; gameSound.currentTime = 0; gameSound.play().catch(e => e);
}

function playRandomDefeat() {
  if (!defeatSounds.length) return;
  gameSound.src = defeatSounds[Math.floor(Math.random() * defeatSounds.length)];
  gameSound.volume = 0.7; gameSound.currentTime = 0; gameSound.play().catch(e => e);
}

function playRandomEpicVictory() {
  if (!epicVictorySounds.length) return;
  gameSound.src = epicVictorySounds[Math.floor(Math.random() * epicVictorySounds.length)];
  gameSound.volume = 0.85; gameSound.currentTime = 0; gameSound.play().catch(e => e);
}

function fadeOutSound() {
  if (gameSound.paused) return;
  let vol = gameSound.volume;
  const interval = setInterval(() => {
    vol -= 0.04;
    if (vol <= 0.02) { clearInterval(interval); gameSound.pause(); gameSound.currentTime = 0; gameSound.volume = 0.7; } 
    else { gameSound.volume = vol; }
  }, 40);
}

window.addEventListener("beforeunload", () => { gameSound.pause(); gameSound.currentTime = 0; });
document.addEventListener("visibilitychange", () => { if (document.hidden) gameSound.pause(); });
window.addEventListener("pagehide", () => { gameSound.pause(); gameSound.currentTime = 0; });

backBtn.onclick = () => { window.location.href = "../../index.html"; };
function applyLang() {
  modeBot.textContent = dict[lang].vsBot;
  modePvp.textContent = dict[lang].pvp;
  resetBtn.textContent = dict[lang].reset;
  difficultyBtn.textContent = dict[lang][difficulty];
  document.getElementById("modalTitle").textContent = dict[lang].settings;
  if (langBtn) langBtn.textContent = lang === "ru" ? "🌍" : "🌎";

  if (settingsModal.classList.contains("show")) {
    const old = document.querySelector(".stats-container");
    if (old) old.remove();
    renderStats();
  }
}

// INFINITE MODE BUTTON
infiniteBtn.textContent = infiniteMode ? "🔄" : "🎮";

infiniteBtn.onclick = () => {
  infiniteMode = !infiniteMode;
  localStorage.setItem("infiniteMode", infiniteMode);
  infiniteBtn.textContent = infiniteMode ? "🔄" : "🎮";
  resetBoard();
};

// MODAL + СТАТИСТИКА
function saveStats() { localStorage.setItem("tictactoe_stats", JSON.stringify(stats)); }

function renderStats() {
  const container = document.createElement("div");
  container.className = "stats-container";
  container.style.marginTop = "30px";
  container.style.textAlign = "left";
  container.style.fontSize = "14px";
  container.style.lineHeight = "1.6";
  container.style.color = "var(--text)";

  container.innerHTML = `
    <h3>${dict[lang].permanentStats}</h3>
    <b>${dict[lang].pvpTitle}:</b><br>
    • ${dict[lang].classic}: ${dict[lang].xWins} ${stats.pvp.classic.X} — ${dict[lang].oWins} ${stats.pvp.classic.O}<br>
    • ${dict[lang].infinite}: ${dict[lang].xWins} ${stats.pvp.infinite.X} — ${dict[lang].oWins} ${stats.pvp.infinite.O}<br><br>
    <b>${dict[lang].vsBotTitle}:</b><br>
    <b>${dict[lang].easyTitle}:</b><br>
    • ${dict[lang].classic}: ${dict[lang].player} ${stats.bot.easy.classic.player} — ${dict[lang].bot} ${stats.bot.easy.classic.bot}<br>
    • ${dict[lang].infinite}: ${dict[lang].player} ${stats.bot.easy.infinite.player} — ${dict[lang].bot} ${stats.bot.easy.infinite.bot}<br><br>
    <b>${dict[lang].hardTitle}:</b><br>
    • ${dict[lang].classic}: ${dict[lang].player} ${stats.bot.hard.classic.player} — ${dict[lang].bot} ${stats.bot.hard.classic.bot}<br>
    • ${dict[lang].infinite}: ${dict[lang].player} ${stats.bot.hard.infinite.player} — ${dict[lang].bot} ${stats.bot.hard.infinite.bot}<br>
  `;
  document.querySelector(".modal-content").appendChild(container);
}

infoBtn.onclick = () => {
  settingsModal.classList.add("show"); settingsModal.style.display = "flex";
  const old = document.querySelector(".stats-container"); if (old) old.remove();
  renderStats();
};

closeModalBtn.onclick = () => { settingsModal.classList.remove("show"); setTimeout(() => { settingsModal.style.display = "none"; }, 300); };
settingsModal.onclick = (e) => { if (e.target === settingsModal) { settingsModal.classList.remove("show"); setTimeout(() => { settingsModal.style.display = "none"; }, 300); } };
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && settingsModal.classList.contains("show")) { settingsModal.classList.remove("show"); setTimeout(() => { settingsModal.style.display = "none"; }, 300); } });

langBtn.onclick = () => { lang = lang === "ru" ? "en" : "ru"; localStorage.setItem("lang", lang); applyLang(); };
themeBtn.onclick = () => { theme = theme === "dark" ? "light" : "dark"; applyTheme(); };

// ИНДИКАТОР САМОЙ СТАРОЙ КЛЕТКИ
function updateDimmedSymbols() {
  cells.forEach(c => c.classList.remove("oldest"));
  if (!infiniteMode) return;
  if (xMovesOrder.length === 3) { const oldestX = xMovesOrder[0]; if (board[oldestX] === "X" && cells[oldestX].textContent === "X") cells[oldestX].classList.add("oldest"); }
  if (oMovesOrder.length === 3) { const oldestO = oMovesOrder[0]; if (board[oldestO] === "O" && cells[oldestO].textContent === "O") cells[oldestO].classList.add("oldest"); }
}

// GAME FUNCTIONS
function resetBoard(fullReset = false) {
  fadeOutSound(); board.fill(null);
  cells.forEach(c => { c.textContent = ""; c.classList.remove("win", "oldest", "X", "O"); });
  boardEl.classList.remove("draw", "game-over");
  xMovesOrder = []; oMovesOrder = []; current = "X"; gameOver = false; waitingBot = false; winLine = [];
  updateIndicators(); updateDimmedSymbols();
  if (fullReset) { scores = { bot: { X: 0, O: 0 }, pvp: { X: 0, O: 0 } }; localStorage.removeItem("scores"); updateScore(); }
}

function updateIndicators() { indX.classList.toggle("active", current === "X"); indO.classList.toggle("active", current === "O"); }
function updateScore() { scoreXEl.textContent = scores[mode].X; scoreOEl.textContent = scores[mode].O; localStorage.setItem("scores", JSON.stringify(scores)); }
function checkWin(sym) { for (let combo of winningCombinations) { if (combo.every(i => board[i] === sym)) { winLine = combo; return true; } } return false; }
function showWinLine() { queueMicrotask(() => { winLine.forEach(i => cells[i].classList.add("win")); }); }
function isDraw() { if (infiniteMode) return false; return !board.includes(null) && !checkWin("X") && !checkWin("O"); }
function endGame(winner = null) {
  gameOver = true; boardEl.classList.add("game-over"); cells.forEach(c => c.classList.remove("oldest"));

  if (winner) {
    scores[mode][winner]++; updateScore();
    if (mode === "pvp") { const key = infiniteMode ? "infinite" : "classic"; stats.pvp[key][winner]++; } 
    else if (mode === "bot") { const diff = difficulty; const key = infiniteMode ? "infinite" : "classic"; if (winner === "X") stats.bot[diff][key].player++; else if (winner === "O") stats.bot[diff][key].bot++; }
    saveStats();

    if (winner === "X") playRandomVictory(); else if (winner === "O" && mode === "bot") playRandomDefeat(); else playRandomVictory();

    if (winner === "X" && mode === "bot") {
      totalBotWinsX++; localStorage.setItem("totalBotWinsX", totalBotWinsX);
      const milestones = [5, 10, 25, 50, 100]; if (milestones.includes(totalBotWinsX)) playRandomEpicVictory();
    }
  }
}

// PLAYER MOVE
cells.forEach(cell => {
  cell.onclick = () => {
    if (gameOver || waitingBot) return;
    const i = Number(cell.dataset.i); if (board[i] !== null) return;
    makeMove(i, current); if (gameOver) return;
    if (mode === "bot") { setTimeout(() => { if (!gameOver && current === "O") { waitingBot = true; setTimeout(botMove, 400); } }, 0); }
  };
});

function makeMove(index, player) {
  if (board[index] !== null) return;
  board[index] = player; cells[index].textContent = player; cells[index].classList.add(player);
  if (player === "X") xMovesOrder.push(index); else oMovesOrder.push(index);

  if (infiniteMode) {
    if (player === "X" && xMovesOrder.length > 3) { const oldest = xMovesOrder.shift(); board[oldest] = null; cells[oldest].textContent = ""; cells[oldest].classList.remove("X", "O", "win", "oldest"); } 
    else if (player === "O" && oMovesOrder.length > 3) { const oldest = oMovesOrder.shift(); board[oldest] = null; cells[oldest].textContent = ""; cells[oldest].classList.remove("X", "O", "win", "oldest"); }
  }
  updateDimmedSymbols();

  requestAnimationFrame(() => {
    const isWinner = checkWin(player); const draw = isDraw();
    if (isWinner || draw) { endGame(isWinner ? player : null); if (draw && !infiniteMode) boardEl.classList.add("draw"); requestAnimationFrame(() => { if (isWinner) showWinLine(); }); return; }
    current = player === "X" ? "O" : "X"; updateIndicators();
  });
}

// BOT MOVE
function botMove() {
  if (gameOver || !waitingBot) return;
  let move = null;
  if (difficulty === "hard") { move = findWinningMove("O") || findWinningMove("X") || getBestMove(); } 
  else {
    const free = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
    if (Math.random() < 0.3) move = free[Math.floor(Math.random() * free.length)]; else move = findWinningMove("O") || findWinningMove("X") || free[Math.floor(Math.random() * free.length)];
  }
  if (move === null || board[move] !== null) return;
  makeMove(move, "O"); waitingBot = false;
}

function findWinningMove(sym) {
  for (let combo of winningCombinations) {
    const vals = combo.map(i => board[i]); if (vals.filter(v => v === sym).length === 2 && vals.includes(null)) return combo[vals.indexOf(null)];
  }
  return null;
}

function getBestMove() {
  if (board[4] === null) return 4;
  const corners = [0, 2, 6, 8].filter(i => board[i] === null); if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  const sides = [1, 3, 5, 7].filter(i => board[i] === null); if (sides.length) return sides[Math.floor(Math.random() * sides.length)];
  return null;
}

// MODE SWITCH
function applyMode() {
  if (mode === "bot") { avatarO.textContent = "🤖"; difficultyBtn.style.display = "block"; modeBot.classList.add("active"); modePvp.classList.remove("active"); } 
  else { avatarO.textContent = "😺"; difficultyBtn.style.display = "none"; modePvp.classList.add("active"); modeBot.classList.remove("active"); }
  resetBoard(); updateScore(); infiniteBtn.textContent = infiniteMode ? "🔄" : "🎮";
}

modeBot.onclick = () => { mode = "bot"; localStorage.setItem("mode", mode); applyMode(); };
modePvp.onclick = () => { mode = "pvp"; localStorage.setItem("mode", mode); applyMode(); };
difficultyBtn.onclick = () => { difficulty = difficulty === "easy" ? "hard" : "easy"; localStorage.setItem("difficulty", difficulty); applyLang(); };
resetBtn.onclick = () => { resetBoard(); };
resetBtn.oncontextmenu = (e) => { e.preventDefault(); if (confirm("Сбросить видимый счёт? (вечная статистика останется)")) { resetBoard(true); totalBotWinsX = 0; localStorage.removeItem("totalBotWinsX"); } };

// СИНХРОНИЗАЦИЯ КАСТОМИЗАЦИИ
function applyTheme() { body.setAttribute("data-theme", theme); body.dataset.theme = theme; localStorage.setItem("theme", theme); if (themeBtn) themeBtn.textContent = theme === "dark" ? "🌓" : "🌗"; }
function applyAccentColor() { body.setAttribute("data-color", accentColor); localStorage.setItem("accentColor", accentColor); }

function loadMenuSettings() {
  theme = localStorage.getItem("theme") || "light"; accentColor = localStorage.getItem("accentColor") || "green"; lang = localStorage.getItem("lang") || "ru";
  applyTheme(); applyAccentColor(); applyLang(); applyMode();
}

document.addEventListener("DOMContentLoaded", () => { loadMenuSettings(); updateScore(); updateIndicators(); updateDimmedSymbols(); });
ы