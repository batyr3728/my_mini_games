const body = document.body;

const backBtn = document.getElementById("backBtn");
const themeBtn = document.getElementById("themeBtn");
const langBtn = document.getElementById("langBtn");
const resetBtn = document.getElementById("resetBtn");
const result = document.getElementById("result");
const choices = document.querySelectorAll(".choice");

// Вытаскиваем настройки из памяти главного меню
let theme = localStorage.getItem("theme") || "light";
let lang = localStorage.getItem("lang") || "ru";
let accentColor = localStorage.getItem("accentColor") || "green";

// Переменные для хранения текущего состояния раунда (чтобы переводить на лету)
let lastPlayerChoice = null;
let lastCpuChoice = null;
let lastOutcome = null;

// Применяем стартовые цвета и темы
body.setAttribute("data-theme", theme);
body.setAttribute("data-color", accentColor);
if (themeBtn) themeBtn.textContent = theme === "light" ? "🌗" : "🌓";

const text = {
  ru: {
    hint: "Сделай выбор",
    reset: "Сбросить",
    you: "Ты",
    cpu: "Компьютер",
    win: "Ты выиграл 🎉",
    lose: "Ты проиграл 😢",
    draw: "Ничья 😐"
  },
  en: {
    hint: "Make your choice",
    reset: "Reset",
    you: "You",
    cpu: "Computer",
    win: "You win 🎉",
    lose: "You lose 😢",
    draw: "Draw 😐"
  }
};

// Запуск начальной локализации
applyLang();

/* EVENTS */
choices.forEach(btn => {
  btn.addEventListener("click", () => {
    play(btn.dataset.choice);
  });
});

if (resetBtn) resetBtn.onclick = resetGame;

if (backBtn) {
  backBtn.onclick = () => {
    window.location.href = "../../index.html";
  };
}

if (themeBtn) {
  themeBtn.onclick = () => {
    theme = theme === "light" ? "dark" : "light";
    body.setAttribute("data-theme", theme);
    themeBtn.textContent = theme === "light" ? "🌗" : "🌓";
    localStorage.setItem("theme", theme);
  };
}

if (langBtn) {
  langBtn.onclick = () => {
    lang = lang === "ru" ? "en" : "ru";
    applyLang();
  };
}

/* LOGIC */
function play(player) {
  const options = ["rock", "paper", "scissors"];
  const cpu = options[Math.floor(Math.random() * 3)];

  let outcome = "draw";
  if (
    (player === "rock" && cpu === "scissors") ||
    (player === "paper" && cpu === "rock") ||
    (player === "scissors" && cpu === "paper")
  ) outcome = "win";
  else if (player !== cpu) outcome = "lose";

  // Сохраняем выбор в глобальные переменные для перевода
  lastPlayerChoice = player;
  lastCpuChoice = cpu;
  lastOutcome = outcome;

  renderResult();
}

// Вынесли отрисовку в отдельную функцию, чтобы вызывать её и при клике, и при смене языка
function renderResult() {
  if (!result) return;
  
  if (lastPlayerChoice && lastCpuChoice && lastOutcome) {
    result.innerHTML = `
      <p>${text[lang].you}: ${icon(lastPlayerChoice)}</p>
      <p>${text[lang].cpu}: ${icon(lastCpuChoice)}</p>
      <p><strong>${text[lang][lastOutcome]}</strong></p>
    `;
  } else {
    result.innerHTML = `<p id="hint">${text[lang].hint}</p>`;
  }
}

function resetGame() {
  lastPlayerChoice = null;
  lastCpuChoice = null;
  lastOutcome = null;
  renderResult();
}

function applyLang() {
  // Обновляем текст кнопки сброса
  if (resetBtn) resetBtn.textContent = text[lang].reset;
  
  // Вращение планеты: на русском 🌍, на английском 🌎
  if (langBtn) langBtn.textContent = lang === "ru" ? "🌍" : "🌎";
  
  // Перерисовываем экран (он либо обновит язык подсказки, либо переведет текущий бой)
  renderResult();
  
  localStorage.setItem("lang", lang);
}

function icon(v) {
  return v === "rock" ? "🗿" : v === "paper" ? "📄" : "✂️";
}
