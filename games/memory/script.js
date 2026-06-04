// ====================== ПЕРЕМЕННЫЕ ИГРЫ ======================
const emojis = ['🍎','🍌','🍒','🍇','🍉','🍓','🍄','🥝'];
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let isGameOver = false;

// Переменные настроек (будут синхронизироваться на лету)
let theme = "light";
let accentColor = "green";
let currentLang = "ru";

// ====================== ПЕРЕВОДЫ ======================
const translations = {
    ru: {
        movesLabel: "ХОДЫ",
        pairsLabel: "ПАРЫ",
        resetBtn: "Новая игра",
        winTitle: "Поздравляем!",
        winSubtitle: "Вы справились за",
        playAgain: "Играть снова"
    },
    en: {
        movesLabel: "MOVES",
        pairsLabel: "PAIRS",
        resetBtn: "New Game",
        winTitle: "Congratulations!",
        winSubtitle: "You did it in",
        playAgain: "Play Again"
    }
};

// ====================== МЕХАНИКА СОЗДАНИЯ ИГРЫ ======================
function createCards() {
    cards = [];
    const allCards = [...emojis, ...emojis];
    
    // Перемешивание (Твоя оригинальная логика)
    for (let i = allCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
    }

    const board = document.getElementById('board');
    if (board) board.innerHTML = '';

    allCards.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.value = emoji;

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">?</div>
                <div class="card-back">${emoji}</div>
            </div>
        `;

        card.addEventListener('click', () => flipCard(card));
        if (board) board.appendChild(card);
        cards.push(card);
    });
}

// ====================== МЕХАНИКА ПЕРЕВОРОТА КАРТ ======================
function flipCard(card) {
    if (isGameOver || flippedCards.length >= 2 || 
        card.classList.contains('flipped') || 
        card.classList.contains('matched')) return;

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        moves++;
        const movesEl = document.getElementById('moves');
        if (movesEl) movesEl.textContent = moves;

        const [c1, c2] = flippedCards;

        if (c1.dataset.value === c2.dataset.value) {
            c1.classList.add('matched');
            c2.classList.add('matched');
            matchedPairs++;
            
            const pairsEl = document.getElementById('pairs');
            if (pairsEl) pairsEl.textContent = `${matchedPairs} / 8`;

            flippedCards = [];

            if (matchedPairs === 8) endGame();
        } else {
            setTimeout(() => {
                c1.classList.remove('flipped');
                c2.classList.remove('flipped');
                flippedCards = [];
            }, 900);
        }
    }
}

// ====================== ЗАВЕРШЕНИЕ И СБРОС СЕССИЙ ======================
function endGame() {
    isGameOver = true;
    const finalMovesEl = document.getElementById('final-moves');
    const winOverlayEl = document.getElementById('win-overlay');
    if (finalMovesEl) finalMovesEl.textContent = moves;
    if (winOverlayEl) winOverlayEl.style.display = 'flex';
}

function newGame() {
    isGameOver = false;
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;

    const movesEl = document.getElementById('moves');
    const pairsEl = document.getElementById('pairs');
    const winOverlayEl = document.getElementById('win-overlay');

    if (movesEl) movesEl.textContent = '0';
    if (pairsEl) pairsEl.textContent = '0 / 8';
    if (winOverlayEl) winOverlayEl.style.display = 'none';

    createCards();
}

// ====================== ФУНКЦИИ ДВУСТРОННЕЙ СИНХРОНИЗАЦИИ НАСТРОЕК ======================
function applyTheme() {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    const btn = document.getElementById("themeBtn");
    if (btn) btn.textContent = theme === "light" ? "🌗" : "🌓";
}

// Починили: Применяем цвет кастомизации из меню хаба на тег body игры
function applyAccentColor() {
    document.body.setAttribute("data-color", accentColor);
    localStorage.setItem("accentColor", accentColor);
}

function applyLanguage() {
    localStorage.setItem("lang", currentLang);
    const t = translations[currentLang];
    
    // Вращение планеты: на русском 🌍, на английском 🌎
    const lBtn = document.getElementById("langBtn");
    if (lBtn) {
        lBtn.textContent = currentLang === "ru" ? "🌍" : "🌎";
    }

    // Переводы текстов на экране
    const movesLabel = document.getElementById('moves-label');
    const pairsLabel = document.getElementById('pairs-label');
    const resetBtn   = document.getElementById('reset-btn');
    const winTitle   = document.getElementById('win-title');
    const winSub      = document.getElementById('win-subtitle');
    const playAgain  = document.getElementById('play-again-btn');

    if (movesLabel) movesLabel.textContent = t.movesLabel;
    if (pairsLabel) pairsLabel.textContent = t.pairsLabel;
    if (resetBtn)   resetBtn.textContent = t.resetBtn;
    
    // Перевод оверлея победы
    if (winTitle) winTitle.textContent = t.winTitle;
    if (winSub) {
        winSub.innerHTML = `${t.winSubtitle} <span id="final-moves">${moves}</span> ${currentLang === 'ru' ? 'ходов' : 'moves'}`;
    }
    if (playAgain) playAgain.textContent = t.playAgain;
}

function loadMenuSettings() {
    theme = localStorage.getItem("theme") || "light";
    accentColor = localStorage.getItem("accentColor") || "green";
    currentLang = localStorage.getItem("lang") || "ru";

    applyTheme();
    applyAccentColor();
    applyLanguage();
}

// ====================== СЛУШАТЕЛИ И СТАРТ ПРИ ЗАГРУЗКЕ ======================
function init() {
    loadMenuSettings(); // Вытягиваем и настраиваем всё из главного меню

    // Клики по кнопкам управления настройками
    const tBtn = document.getElementById("themeBtn");
    if (tBtn) {
        tBtn.addEventListener("click", () => {
            theme = theme === "light" ? "dark" : "light";
            applyTheme();
        });
    }

    const lBtn = document.getElementById("langBtn");
    if (lBtn) {
        lBtn.addEventListener("click", () => {
            currentLang = currentLang === "ru" ? "en" : "ru";
            applyLanguage();
        });
    }

    // Игровые кнопки возврата и перезапуска
    const backBtn = document.getElementById('back-btn');
    if (backBtn) backBtn.addEventListener('click', () => window.location.href = '../../index.html');
    
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', newGame);
    
    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) playAgainBtn.addEventListener('click', newGame);

    newGame();

    console.log('%cMemory Match синхронизирована ✓ Механика не затронута', 'color:#4caf50; font-weight:700');
}

window.onload = init;
