// ====================== ПЕРЕМЕННЫЕ ИГРЫ ======================
const emojis = ['🍎','🍌','🍒','🍇','🍉','🍓','🍄','🥝'];
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let isGameOver = false;

// Переменные для отслеживания секретной комбинации
let cheatClickCount = 0;
let lastClickedCardIndex = null;

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
        movesCountText: "ходов",
        playAgain: "Играть снова"
    },
    en: {
        movesLabel: "MOVES",
        pairsLabel: "PAIRS",
        resetBtn: "New Game",
        winTitle: "Congratulations!",
        winSubtitle: "You did it in",
        movesCountText: "moves",
        playAgain: "Play Again"
    }
};

// ====================== МЕХАНИКА СОЗДАНИЯ ИГРЫ ======================
function createCards() {
    cards = [];
    flippedCards = [];
    cheatClickCount = 0; // Сбрасываем чит-код при новой игре
    lastClickedCardIndex = null;
    
    const allCards = [...emojis, ...emojis];
    
    // Перемешивание
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
        card.dataset.index = index; // Запоминаем индекс карты для чит-кода

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">?</div>
                <div class="card-back">${emoji}</div>
            </div>
        `;

        // Оптимизировано под тач-скрины
        card.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Запускаем проверку чит-кода при каждом нажатии
            checkCheatCode(index);
            
            flipCard(card);
        });
        
        if (board) board.appendChild(card);
        cards.push(card);
    });
}

// ====================== СЕКРЕТНЫЙ ЧИТ-КОД (ЛАЗЕЙКА) ======================
function checkCheatCode(currentIndex) {
    if (isGameOver) return;

    // Шаг 1: Ждем 3 нажатия на самую первую ячейку (индекс 0)
    if (currentIndex === 0) {
        if (lastClickedCardIndex === 0 || lastClickedCardIndex === null) {
            cheatClickCount++;
        } else {
            cheatClickCount = 1;
        }
        lastClickedCardIndex = 0;
    } 
    // Шаг 2: Ждем 2 нажатия на вторую ячейку (индекс 1) строго после первой
    else if (currentIndex === 1 && cheatClickCount >= 3 && (lastClickedCardIndex === 0 || lastClickedCardIndex === 1)) {
        cheatClickCount++;
        lastClickedCardIndex = 1;
        
        // Если комбинация сошлась (3 раза на 1-ю + 2 раза на 2-ю)
        if (cheatClickCount === 5) {
            activateXRayCheat();
            cheatClickCount = 0;
            lastClickedCardIndex = null;
        }
    } 
    // Если кликнули на любую другую карту — ломаем комбинацию
    else {
        cheatClickCount = 0;
        lastClickedCardIndex = null;
    }
}

function activateXRayCheat() {
    console.log('%c⚡ Чит-код активирован!', 'color:#ff9800; font-weight:bold;');
    
    // Временно открываем все неугаданные карты
    cards.forEach(card => {
        if (!card.classList.contains('matched')) {
            card.classList.add('flipped');
        }
    });

    // Через 2.5 секунды прячем их обратно
    setTimeout(() => {
        cards.forEach(card => {
            if (!card.classList.contains('matched') && !flippedCards.includes(card)) {
                card.classList.remove('flipped');
            }
        });
    }, 2500);
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
            }, 800);
        }
    }
}

// ====================== ЗАВЕРШЕНИЕ И СБРОС ИГРЫ ======================
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
    if (document.body) document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    const btn = document.getElementById("themeBtn");
    if (btn) btn.textContent = theme === "light" ? "🌗" : "🌓";
}

function applyAccentColor() {
    if (document.body) document.body.setAttribute("data-color", accentColor);
    localStorage.setItem("accentColor", accentColor);
}

function applyLanguage() {
    localStorage.setItem("lang", currentLang);
    const t = translations[currentLang];
    if (!t) return;
    
    const lBtn = document.getElementById("langBtn");
    if (lBtn) lBtn.textContent = currentLang === "ru" ? "🌍" : "🌎";

    const movesLabel = document.getElementById('moves-label');
    const pairsLabel = document.getElementById('pairs-label');
    const resetBtn   = document.getElementById('reset-btn');
    const winTitle   = document.getElementById('win-title');
    const winSub      = document.getElementById('win-subtitle');
    const playAgain  = document.getElementById('play-again-btn');

    if (movesLabel) movesLabel.textContent = t.movesLabel;
    if (pairsLabel) pairsLabel.textContent = t.pairsLabel;
    if (resetBtn)   resetBtn.textContent = t.resetBtn;
    
    if (winTitle) winTitle.textContent = t.winTitle;
    if (winSub) {
        winSub.innerHTML = `${t.winSubtitle} <span id="final-moves">${moves}</span> ${t.movesCountText}`;
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
    loadMenuSettings();

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

    const backBtn = document.getElementById('back-btn');
    if (backBtn) backBtn.addEventListener('click', () => window.location.href = '../../index.html');
    
    const rBtn = document.getElementById('reset-btn');
    if (rBtn) rBtn.addEventListener('click', newGame);
    
    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) playAgainBtn.addEventListener('click', newGame);

    newGame();
}

document.addEventListener('DOMContentLoaded', init);
