// ====================== НАСТРОЙКИ ИГРЫ ======================
const ROWS = 9;
const COLS = 9;
const MINES_COUNT = 10;

let board = [];
let revealed = [];
let flagged = [];
let gameOver = false;
let timer = 0;
let timerInterval = null;

// Настройки хаба (синхронизируются на лету)
let theme = "light";
let accentColor = "green";
let currentLang = 'ru';

// ====================== ПЕРЕВОДЫ ======================
const translations = {
    ru: {
        title: "Сапёр",
        minesLabel: "МИНЫ",
        timeLabel: "ВРЕМЯ",
        resetBtn: "Новая игра",
        winTitle: "Победа!",
        winSubtitle: "Вы разминировали всё поле!",
        loseTitle: "Бум!",
        loseSubtitle: "Вы подорвались на мине",
        playAgain: "Играть снова"
    },
    en: {
        title: "Minesweeper",
        minesLabel: "MINES",
        timeLabel: "TIME",
        resetBtn: "New Game",
        winTitle: "Victory!",
        winSubtitle: "You cleared the entire field!",
        loseTitle: "Boom!",
        loseSubtitle: "You hit a mine",
        playAgain: "Play Again"
    }
};

// ====================== СОЗДАНИЕ ИГРЫ ======================
function createBoard() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    revealed = Array(ROWS).fill().map(() => Array(COLS).fill(false));
    flagged = Array(ROWS).fill().map(() => Array(COLS).fill(false));

    let planted = 0;
    while (planted < MINES_COUNT) {
        const r = Math.floor(Math.random() * ROWS);
        const c = Math.floor(Math.random() * COLS);
        if (board[r][c] !== -1) {
            board[r][c] = -1;
            planted++;
        }
    }

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] === -1) continue;
            board[r][c] = countMinesAround(r, c);
        }
    }
}

function countMinesAround(row, col) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const r = row + dr, c = col + dc;
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === -1) count++;
        }
    }
    return count;
}

// ====================== РЕНДЕР ПОЛЯ ======================
function renderBoard(showAllMines = false) {
    const container = document.getElementById('board');
    if (!container) return;
    container.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    container.innerHTML = '';

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;

            if (revealed[r][c] || (showAllMines && board[r][c] === -1)) {
                cell.classList.add('revealed');
                if (board[r][c] === -1) {
                    cell.classList.add('mine');
                } else if (board[r][c] > 0) {
                    cell.textContent = board[r][c];
                    cell.style.color = getNumberColor(board[r][c]);
                }
            } else if (flagged[r][c]) {
                cell.classList.add('flagged');
            }

            if (!showAllMines && !gameOver) {
                cell.addEventListener('click', handleLeftClick);
                cell.addEventListener('contextmenu', handleRightClick);
            }

            container.appendChild(cell);
        }
    }
}

function getNumberColor(num) {
    const colors = ['#1976d2', '#388e3c', '#d32f2f', '#7b1fa2', '#f57c00', '#0097a7', '#212121', '#607d8b'];
    return colors[num - 1] || '#000';
}

// ====================== ЛОГИКА КЛИКОВ ======================
function handleLeftClick(e) {
    if (gameOver) return;
    const row = +e.target.dataset.row;
    const col = +e.target.dataset.col;

    if (flagged[row][col]) return;

    if (board[row][col] === -1) {
        gameLost();
        return;
    }

    revealCell(row, col);
    checkWin();
}

function handleRightClick(e) {
    e.preventDefault();
    if (gameOver) return;
    const row = +e.target.dataset.row;
    const col = +e.target.dataset.col;

    if (revealed[row][col]) return;

    flagged[row][col] = !flagged[row][col];
    renderBoard();
    updateMinesLeft();
}

function revealCell(row, col) {
    if (revealed[row][col] || flagged[row][col]) return;
    revealed[row][col] = true;

    if (board[row][col] === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = row + dr, c = col + dc;
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                    revealCell(r, c);
                }
            }
        }
    }
    renderBoard();
}

// ====================== ФИНАЛЫ ИГРЫ ======================
function gameLost() {
    gameOver = true;
    clearInterval(timerInterval);
    renderBoard(true);

    document.getElementById('overlay-title').textContent = translations[currentLang].loseTitle;
    document.getElementById('overlay-subtitle').textContent = translations[currentLang].loseSubtitle;
    document.getElementById('overlay').style.display = 'flex';
}

function checkWin() {
    let unrevealedSafe = 0;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (!revealed[r][c] && board[r][c] !== -1) unrevealedSafe++;
        }
    }
    if (unrevealedSafe === 0) {
        gameOver = true;
        clearInterval(timerInterval);
        document.getElementById('overlay-title').textContent = translations[currentLang].winTitle;
        document.getElementById('overlay-subtitle').textContent = translations[currentLang].winSubtitle;
        document.getElementById('overlay').style.display = 'flex';
    }
}

function updateMinesLeft() {
    const flags = flagged.flat().filter(f => f).length;
    document.getElementById('mines-left').textContent = MINES_COUNT - flags;
}

// ====================== ТАЙМЕР ======================
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timer = 0;
    updateTimeDisplay();

    timerInterval = setInterval(() => {
        timer++;
        updateTimeDisplay();
    }, 1000);
}

function updateTimeDisplay() {
    const min = Math.floor(timer / 60);
    const sec = timer % 60;
    document.getElementById('time').textContent = `${min}:${sec.toString().padStart(2, '0')}`;
}

// ====================== НОВАЯ ИГРА ======================
function newGame() {
    gameOver = false;
    document.getElementById('overlay').style.display = 'none';
    createBoard();
    renderBoard();
    updateMinesLeft();
    startTimer();
}

// ====================== ДВУСТРОННЯЯ СИНХРОНИЗАЦИЯ НАСТРОЕК ======================
function applyTheme() {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    const btn = document.getElementById("themeBtn");
    if (btn) btn.textContent = theme === "light" ? "🌗" : "🌓";
}

function applyAccentColor() {
    document.body.setAttribute("data-color", accentColor);
    localStorage.setItem("accentColor", accentColor);
}

function applyLanguage() {
    localStorage.setItem("lang", currentLang);
    const t = translations[currentLang];
    
    // Кнопка-планета теперь меняется при клике!
    const langBtn = document.getElementById("langBtn");
    if (langBtn) {
        langBtn.textContent = currentLang === "ru" ? "🌍" : "🌎";
    }
    
    document.getElementById('game-title').textContent = t.title;
    document.getElementById('mines-label').textContent = t.minesLabel;
    document.getElementById('time-label').textContent = t.timeLabel;
    document.getElementById('reset-btn').textContent = t.resetBtn;
    if (document.getElementById('play-again-btn')) document.getElementById('play-again-btn').textContent = t.playAgain;
}

function loadMenuSettings() {
    theme = localStorage.getItem("theme") || "light";
    accentColor = localStorage.getItem("accentColor") || "green";
    currentLang = localStorage.getItem("lang") || "ru";

    applyTheme();
    applyAccentColor();
    applyLanguage();
}

// ====================== ИНИЦИАЛИЗАЦИЯ И СЛУШАТЕЛИ ======================
function init() {
    loadMenuSettings();

    // Переключатели в шапке
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
            
            // Если игра уже закончена, на лету переводим оверлей результатов
            if (gameOver) {
                const isWin = flagged.flat().filter(f => f).length === MINES_COUNT;
                document.getElementById('overlay-title').textContent = isWin ? translations[currentLang].winTitle : translations[currentLang].loseTitle;
                document.getElementById('overlay-subtitle').textContent = isWin ? translations[currentLang].winSubtitle : translations[currentLang].loseSubtitle;
            }
        });
    }

    // Системные кнопки
    document.getElementById('back-btn').addEventListener('click', () => {
        clearInterval(timerInterval);
        window.location.href = '../../index.html';
    });
    document.getElementById('reset-btn').addEventListener('click', newGame);
    document.getElementById('play-again-btn').addEventListener('click', newGame);

    newGame();
}

window.onload = init;
