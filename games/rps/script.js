const body = document.body;

const backBtn = document.getElementById("backBtn");
const themeBtn = document.getElementById("themeBtn");
const langBtn = document.getElementById("langBtn");
const resetBtn = document.getElementById("resetBtn");
const result = document.getElementById("result");
const choices = document.querySelectorAll(".choice");

// 🛠 ПОЧИНИЛИ ТУТ: Вытаскиваем все настройки из памяти главного меню
let theme = localStorage.getItem("theme") || "light";
let lang = localStorage.getItem("lang") || "ru";
let accentColor = localStorage.getItem("accentColor") || "green";

// Применяем стартовые цвета и темы при первом запуске файла
body.setAttribute("data-theme", theme);
body.setAttribute("data-color", accentColor); // ← Вот эта строчка чинит цвета!
themeBtn.textContent = theme === "light" ? "🌗" : "🌓";

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

applyLang();

/* EVENTS */
choices.forEach(btn => {
  btn.addEventListener("click", () => {
    play(btn.dataset.choice);
  });
});

resetBtn.onclick = resetGame;

backBtn.onclick = () => {
  window.location.href = "../../index.html";
};

themeBtn.onclick = () => {
  theme = theme === "light" ? "dark" : "light";
  body.setAttribute("data-theme", theme);
  themeBtn.textContent = theme === "light" ? "🌗" : "🌓";
  localStorage.setItem("theme", theme);
};

langBtn.onclick = () => {
  lang = lang === "ru" ? "en" : "ru";
  applyLang();
  if (document.getElementById("hint")) resetGame();
};

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

  result.innerHTML = `
    <p>${text[lang].you}: ${icon(player)}</p>
    <p>${text[lang].cpu}: ${icon(cpu)}</p>
    <p><strong>${text[lang][outcome]}</strong></p>
  `;
}

function resetGame() {
  result.innerHTML = `<p id="hint">${text[lang].hint}</p>`;
}

function applyLang() {
  const hintEl = document.getElementById("hint");
  if (hintEl) {
    hintEl.textContent = text[lang].hint;
  }
  resetBtn.textContent = text[lang].reset;
  
  // Вращение планеты: на русском 🌍, на английском 🌎
  if (langBtn) {
    langBtn.textContent = lang === "ru" ? "🌍" : "🌎";
  }
  
  localStorage.setItem("lang", lang);
}

function icon(v) {
  return v === "rock" ? "🗿" : v === "paper" ? "📄" : "✂️";
}
