// ====================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ======================
let grid = Array.from({ length: 4 }, () => Array(4).fill(0));
let score = 0;
let bestScore = 0;
let hasWon = false;
let isGameOverFlag = false;
let newTilePosition = null;
let mergedPositions = new Set();

// Переменные настроек (будут обновляться на лету)
let theme = "light";
let accentColor = "green";
let currentLang = "ru";

// ====================== ПЕРЕВОДЫ ======================
const translations = {
    en: {
        scoreLabel: 'Score', bestLabel: 'Best', resetBtn: 'Reset',
        winTitle: 'You reached 2048!', winSubtitle: 'Amazing! Keep going?',
        continueBtn: 'Continue', newGameBtn: 'New Game',
        gameOverTitle: 'Game Over', gameOverSubtitle: 'No moves left 😔',
        tryAgainBtn: 'Try Again'
    },
    ru: {
        scoreLabel: 'Счёт', bestLabel: 'Рекорд', resetBtn: 'Новая игра',
        winTitle: 'Вы достигли 2048!', winSubtitle: 'Отлично! Продолжить?',
        continueBtn: 'Продолжить', newGameBtn: 'Новая игра',
        gameOverTitle: 'Игра окончена', gameOverSubtitle: 'Ходов больше нет 😔',
        tryAgainBtn: 'Ещё раз'
    }
};

// ====================== СОХРАНЕНИЕ И ЗАГРУЗКА ИГРЫ ======================
function saveGame() {
    const state = { grid, score, hasWon, bestScore };
    localStorage.setItem('2048_game', JSON.stringify(state));
}

function loadGame() {
    const saved = localStorage.getItem('2048_game');
    if (!saved) return false;
    const data = JSON.parse(saved);
    grid = data.grid;
    score = data.score || 0;
    hasWon = data.hasWon || false;
    bestScore = data.bestScore || 0;
    return true;
}

function saveBestScore() {
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('2048_best', bestScore.toString());
    }
}

function updateBestDisplay() { document.getElementById('best-value').textContent = bestScore; }
function updateScore() { document.getElementById('score-value').textContent = score; }

// ====================== КООРДИНАТЫ И ГЕНЕРАЦИЯ ПЛИТОК ======================
function getTileCoords(row, col) {
    const container = document.getElementById('tiles');
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const GAP = 12;
    const size = (width - GAP * 3) / 4;
    return { left: col * (size + GAP), top: row * (size + GAP), size: Math.max(size, 40) };
}

function createTileElement(value, row, col) {
    const tile = document.createElement('div');
    tile.className = `tile tile-${value}`; 
    tile.textContent = value;
    if (value > 2048) tile.classList.add('tile-super');

    const coords = getTileCoords(row, col);
    tile.style.left = `${coords.left}px`;
    tile.style.top = `${coords.top}px`;
    tile.style.width = `${coords.size}px`;
    tile.style.height = `${coords.size}px`;
    return tile;
}

// ====================== ОТРИСОВКА И ЛОГИКА ИГРЫ ======================
function renderBoard() {
    const tilesContainer = document.getElementById('tiles');
    tilesContainer.innerHTML = '';
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (grid[r][c] === 0) continue;
            const tileEl = createTileElement(grid[r][c], r, c);
            if (newTilePosition === `${r}-${c}`) {
                tileEl.style.transform = 'scale(0.2)'; tilesContainer.appendChild(tileEl);
                requestAnimationFrame(() => { tileEl.style.transition = 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)'; tileEl.style.transform = 'scale(1)'; });
            } else if (mergedPositions.has(`${r}-${c}`)) {
                tileEl.style.transform = 'scale(1.2)'; tilesContainer.appendChild(tileEl);
                requestAnimationFrame(() => { tileEl.style.transition = 'transform 0.15s ease'; tileEl.style.transform = 'scale(1)'; });
            } else { tilesContainer.appendChild(tileEl); }
        }
    }
    newTilePosition = null; mergedPositions.clear(); checkGameState();
}

function addRandomTile() {
    const empty = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) { if (grid[r][c] === 0) empty.push({r, c}); }
    }
    if (empty.length === 0) return;
    const {r, c} = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4; newTilePosition = `${r}-${c}`;
}

function slide(line) {
    let filtered = line.filter(n => n !== 0);
    for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) { const merged = filtered[i] * 2; filtered[i] = merged; score += merged; filtered.splice(i + 1, 1); }
    }
    while (filtered.length < 4) filtered.push(0); return filtered;
}

function transpose(m) { return m.map((_, i) => m.map(row => row[i])); }
function moveLeft()  { moveGeneric(grid.map(row => slide([...row]))); }
function moveRight() { moveGeneric(grid.map(row => slide([...row].reverse()).reverse())); }
function moveUp()    { let t = transpose(grid); moveGeneric(transpose(t.map(col => slide([...col])))); }
function moveDown()  { let t = transpose(grid); moveGeneric(transpose(t.map(col => slide([...col].reverse()).reverse()))); }

function moveGeneric(newGrid) {
    if (JSON.stringify(grid) === JSON.stringify(newGrid)) return;
    grid = newGrid;
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) { if (grid[r][c] !== 0) mergedPositions.add(`${r}-${c}`); }
    }
    addRandomTile(); updateScore(); saveBestScore(); updateBestDisplay(); saveGame(); renderBoard();
}

function checkGameState() {
    if (!hasWon) {
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { if (grid[r][c] >= 2048) { hasWon = true; saveBestScore(); showWinOverlay(); return; } }
    }
    let canMove = false;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (grid[r][c] === 0) canMove = true;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) if (grid[r][c] === grid[r][c+1]) canMove = true;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) if (grid[r][c] === grid[r+1][c]) canMove = true;
    if (!canMove) { isGameOverFlag = true; saveBestScore(); localStorage.removeItem('2048_game'); showGameOverOverlay(); }
}
function showWinOverlay() { document.getElementById('win-overlay').style.display = 'flex'; }
function showGameOverOverlay() { document.getElementById('gameover-overlay').style.display = 'flex'; }
function hideOverlays() { document.getElementById('win-overlay').style.display = 'none'; document.getElementById('gameover-overlay').style.display = 'none'; }

function resetGame() {
    grid = Array.from({ length: 4 }, () => Array(4).fill(0)); score = 0; hasWon = false; isGameOverFlag = false; newTilePosition = null; mergedPositions.clear();
    hideOverlays(); localStorage.removeItem('2048_game'); updateScore(); updateBestDisplay(); addRandomTile(); addRandomTile(); saveGame(); renderBoard();
}

// ====================== ФУНКЦИИ ДВУСТРОННЕЙ СИНХРОНИЗАЦИИ НАСТРОЕК ======================
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

function applyLang() {
    localStorage.setItem("lang", currentLang);
    const t = translations[currentLang];
    
    // Вращение планеты: на русском 🌍, на английском 🌎
    const lBtnEl = document.getElementById("langBtn");
    if (lBtnEl) {
        lBtnEl.textContent = currentLang === "ru" ? "🌍" : "🌎";
    }

    // Тексты в самой игре
    const scoreLabel = document.querySelector('.score-box:nth-child(1) .score-label');
    const bestLabel  = document.querySelector('.score-box:nth-child(2) .score-label');
    const resetBtn   = document.querySelector('.reset-btn');
    if (scoreLabel) scoreLabel.textContent = t.scoreLabel; 
    if (bestLabel) bestLabel.textContent = t.bestLabel; 
    if (resetBtn) resetBtn.textContent = t.resetBtn;

    // Тексты в оверлеях
    const winTitle = document.querySelector('#win-overlay h2'); const winSub = document.querySelector('#win-overlay p'); const winBtn = document.querySelector('#win-overlay .btn-primary');
    if (winTitle && winSub && winBtn) { winTitle.textContent = t.winTitle; winSub.textContent = t.winSubtitle; winBtn.textContent = t.continueBtn; }

    const loseTitle = document.querySelector('#gameover-overlay h2'); const loseSub = document.querySelector('#gameover-overlay p'); const loseBtn = document.querySelector('#gameover-overlay .btn-primary');
    if (loseTitle && loseSub && loseBtn) { loseTitle.textContent = t.gameOverTitle; loseSub.textContent = t.gameOverSubtitle; loseBtn.textContent = t.tryAgainBtn; }
}

function loadMenuSettings() {
    theme = localStorage.getItem("theme") || "light";
    accentColor = localStorage.getItem("accentColor") || "green";
    currentLang = localStorage.getItem("lang") || "ru";

    applyTheme();
    applyAccentColor();
    applyLang();
}

// ====================== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАПУСКЕ ======================
document.addEventListener('DOMContentLoaded', () => {
    loadMenuSettings();

    const savedBest = localStorage.getItem('2048_best'); if (savedBest) bestScore = parseInt(savedBest, 10); updateBestDisplay();
    if (!loadGame()) { resetGame(); } else { updateScore(); renderBoard(); }

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
            applyLang();
        });
    }

    document.querySelector('.reset-btn').addEventListener('click', resetGame);
    document.querySelector('#gameover-overlay .btn-primary').addEventListener('click', resetGame);
    document.querySelector('#win-overlay .btn-primary').addEventListener('click', hideOverlays);
    
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) { backBtn.addEventListener('click', () => { window.location.href = '../../index.html'; }); }

    window.addEventListener('keydown', (e) => {
        if (isGameOverFlag) return;
        if (e.key === 'ArrowLeft'  || e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'ф') moveLeft();
        if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd' || e.key.toLowerCase() === 'в') moveRight();
        if (e.key === 'ArrowUp'    || e.key.toLowerCase() === 'w' || e.key.toLowerCase() === 'ц') moveUp();
        if (e.key === 'ArrowDown'  || e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'ы') moveDown();
    });
});
