document.addEventListener("DOMContentLoaded", () => {
    // --- Системные настройки и темы (Синхронизация с Главным меню) ---
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const savedColor = localStorage.getItem("accentColor") || "green";
    document.body.setAttribute("data-color", savedColor);

    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const currentTheme = document.documentElement.getAttribute("data-theme");
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            localStorage.setItem("theme", newTheme);
            document.documentElement.setAttribute("data-theme", newTheme);
        });
    }

    // --- Переменные состояния игры ---
    let currentDifficulty = "easy";
    
    // Матрица-донор: Честный базовый квадрат Sudoku
    const basePattern = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 3, 1, 5, 6, 4, 8, 9, 7],
        [5, 6, 4, 8, 9, 7, 2, 3, 1],
        [8, 9, 7, 2, 3, 1, 5, 6, 4],
        [3, 1, 2, 6, 4, 5, 9, 7, 8],
        [6, 4, 5, 9, 7, 8, 3, 1, 2],
        [9, 7, 8, 3, 1, 2, 6, 4, 5]
    ];

    let solutionGrid = [];
    let playerGrid = [];
    let initialMask = [];
    let selectedCellIndex = null;
    let errorsCount = 0;
    let maxErrors = 10;

    // Переменные для секундомера
    let timerInterval = null;
    let totalSeconds = 0;

    const boardElement = document.getElementById("board");
    const errorValueElement = document.getElementById("error-value");
    const timerValueElement = document.getElementById("timer-value");
    // --- Логика секундомера ---
    function startTimer() {
        clearInterval(timerInterval);
        totalSeconds = 0;
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            totalSeconds++;
            updateTimerDisplay();
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function updateTimerDisplay() {
        if (!timerValueElement) return;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const pad = (num) => num.toString().padStart(2, "0");
        timerValueElement.textContent = `${pad(minutes)}:${pad(seconds)}`;
    }

    // --- Математическая логика генерации ---
    function deepCopyGrid(grid) {
        return grid.map(row => [...row]);
    }

    function shuffleGrid(grid) {
        let workingGrid = deepCopyGrid(grid);
        
        for (let r = 0; r < 9; r += 3) {
            let rows = [r, r + 1, r + 2].sort(() => Math.random() - 0.5);
            let block = [workingGrid[rows[0]], workingGrid[rows[1]], workingGrid[rows[2]]];
            workingGrid[r] = block[0];
            workingGrid[r+1] = block[1];
            workingGrid[r+2] = block[2];
        }

        for (let c = 0; c < 9; c += 3) {
            let cols = [c, c + 1, c + 2].sort(() => Math.random() - 0.5);
            for (let r = 0; r < 9; r++) {
                let temp = [workingGrid[r][cols[0]], workingGrid[r][cols[1]], workingGrid[r][cols[2]]];
                workingGrid[r][cols[0]] = temp[0];
                workingGrid[r][cols[1]] = temp[1];
                workingGrid[r][cols[2]] = temp[2];
            }
        }
        return workingGrid;
    }

    function createPuzzle(solution, diff) {
        let puzzle = deepCopyGrid(solution);
        let mask = Array(9).fill(null).map(() => Array(9).fill(true));
        let cellsToRemove = diff === "medium" ? 42 : diff === "hard" ? 54 : 30;

        while (cellsToRemove > 0) {
            let r = Math.floor(Math.random() * 9);
            let c = Math.floor(Math.random() * 9);
            if (puzzle[r][c] !== 0) {
                puzzle[r][c] = 0;
                mask[r][c] = false;
                cellsToRemove--;
            }
        }
        return { puzzle, mask };
    }
    // --- Отрисовка игрового поля ---
    function renderBoard() {
        if (!boardElement) return;
        boardElement.innerHTML = "";
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                const index = r * 9 + c;
                cell.setAttribute("data-index", index);

                const val = playerGrid[r][c];
                if (val !== 0) {
                    cell.textContent = val;
                    if (initialMask[r][c] || val === solutionGrid[r][c]) {
                        cell.classList.add("initial");
                    } else {
                        cell.classList.add("error");
                    }
                }
                cell.addEventListener("click", () => handleCellSelection(index));
                boardElement.appendChild(cell);
            }
        }
        updateHighlights();
    }

    function handleCellSelection(index) {
        selectedCellIndex = index;
        updateHighlights();
    }

    function updateHighlights() {
        const cells = document.querySelectorAll(".cell");
        cells.forEach(c => c.classList.remove("selected", "highlighted"));
        if (selectedCellIndex === null) return;

        const selR = Math.floor(selectedCellIndex / 9);
        const selC = selectedCellIndex % 9;
        const selVal = playerGrid[selR][selC];
        const selBoxR = Math.floor(selR / 3) * 3;
        const selBoxC = Math.floor(selC / 3) * 3;

        cells.forEach(cell => {
            const idx = parseInt(cell.getAttribute("data-index"));
            const r = Math.floor(idx / 9);
            const c = idx % 9;
            if (idx === selectedCellIndex) { cell.classList.add("selected"); return; }
            if (r === selR || c === selC || (r >= selBoxR && r < selBoxR + 3 && c >= selBoxC && c < selBoxC + 3)) {
                cell.classList.add("highlighted");
            }
            if (selVal !== 0 && playerGrid[r][c] === selVal) { cell.classList.add("selected"); }
        });
    }
    function injectNumber(num) {
        if (selectedCellIndex === null) return;
        const r = Math.floor(selectedCellIndex / 9);
        const c = Math.floor(selectedCellIndex % 9);
        
        if (initialMask[r][c] || playerGrid[r][c] === solutionGrid[r][c]) return;

        if (playerGrid[r][c] !== 0 && playerGrid[r][c] === num) {
            playerGrid[r][c] = 0;
            renderBoard();
            return;
        }

        playerGrid[r][c] = num;

        if (num !== 0 && num !== solutionGrid[r][c]) {
            errorsCount++;
            if (errorValueElement) errorValueElement.textContent = `${errorsCount}/${maxErrors}`;
            if (errorsCount >= maxErrors) triggerGameOver(false);
        }

        renderBoard();
        checkVictoryCondition();
    }

    function checkVictoryCondition() {
        let isWin = true;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (playerGrid[r][c] !== solutionGrid[r][c]) isWin = false;
            }
        }
        if (isWin) triggerGameOver(true);
    }

    const overlay = document.getElementById("overlay");
    const overlayTitle = document.getElementById("overlay-title");
    const overlayDesc = document.getElementById("overlay-description");
    const actionBtn = document.getElementById("action-btn");

    function triggerGameOver(isWin) {
        stopTimer();
        if (!overlay) return;
        if (overlayTitle) overlayTitle.textContent = isWin ? "Победа!" : "Игра окончена";
        
        if (overlayDesc) {
            if (isWin) {
                const timeText = timerValueElement ? timerValueElement.textContent : "";
                overlayDesc.textContent = `Вы успешно решили это судоку за время ${timeText}!`;
            } else {
                overlayDesc.textContent = "Вы совершили слишком много ошибок.";
            }
        }
        overlay.style.display = "flex";
    }

    // Ввод с экранных кнопок
    document.querySelectorAll(".num-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const val = btn.getAttribute("data-val");
            injectNumber(val ? parseInt(val) : 0);
        });
    });

    // Управление с клавиатуры ПК (Стрелочки, WASD/ЦФЫВ)
    document.addEventListener("keydown", (e) => {
        if (overlay && overlay.style.display === "flex") return;

        const key = e.key.toLowerCase();

        if (selectedCellIndex === null && ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "s", "a", "d", "ц", "ы", "ф", "в"].includes(key)) {
            selectedCellIndex = 0; updateHighlights(); return;
        }

        let r = Math.floor(selectedCellIndex / 9);
        let c = selectedCellIndex % 9;

        if (key === "arrowup" || key === "w" || key === "ц") { if (r > 0) r--; }
        else if (key === "arrowdown" || key === "s" || key === "ы") { if (r < 8) r++; }
        else if (key === "arrowleft" || key === "a" || key === "ф") { if (c > 0) c--; }
        else if (key === "arrowright" || key === "d" || key === "в") { if (c < 8) c++; }
        else if (e.key >= "1" && e.key <= "9") { injectNumber(parseInt(e.key)); return; }
        else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") { injectNumber(0); return; }
        else if (e.key === "Escape") { selectedCellIndex = null; updateHighlights(); return; }
        else { return; }

        selectedCellIndex = r * 9 + c;
        updateHighlights();
    });

    // Обработка переключателя сложности
    document.querySelectorAll(".diff-tab").forEach(tab => {
        tab.addEventListener("click", (e) => {
            document.querySelectorAll(".diff-tab").forEach(t => t.classList.remove("active"));
            e.target.classList.add("active");
            currentDifficulty = e.target.getAttribute("data-diff");
            initiateNewGame();
        });
    });

    if (actionBtn && overlay) {
        actionBtn.addEventListener("click", () => { 
            overlay.style.display = "none"; 
            initiateNewGame(); 
        });
    }

    const resetBtn = document.getElementById("reset-btn");
    if (resetBtn) resetBtn.addEventListener("click", initiateNewGame);

    function initiateNewGame() {
        if (currentDifficulty === "medium") {
            maxErrors = 5;
        } else if (currentDifficulty === "hard") {
            maxErrors = 3;
        } else {
            maxErrors = 10;
        }

        solutionGrid = shuffleGrid(basePattern);
        const setup = createPuzzle(solutionGrid, currentDifficulty);
        playerGrid = deepCopyGrid(setup.puzzle); 
        initialMask = setup.mask;
        selectedCellIndex = null; 
        errorsCount = 0;

        if (errorValueElement) errorValueElement.textContent = `0/${maxErrors}`;
        
        startTimer();
        renderBoard();
    }

    initiateNewGame();
});
