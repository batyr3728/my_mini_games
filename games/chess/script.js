document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен');

    // ===== 1. СНАЧАЛА ПОЛУЧАЕМ ВСЕ ЭЛЕМЕНТЫ =====
    const body = document.body;
    const themeBtn = document.getElementById("themeBtn");
    const langBtn = document.getElementById("langBtn");
    const title = document.getElementById("title");
    const colorPicker = document.getElementById("colorPicker");
    const burgerToggle = document.getElementById("burgerToggle");
    const controlsMenu = document.getElementById("controlsMenu");
    
    const boardElement = document.getElementById('chessBoard');
    const turnText = document.getElementById('turnText');
    const turnPiece = document.getElementById('turnPiece');
    const gameStatus = document.getElementById('gameStatus');
    const resetBtn = document.getElementById('resetBtn');

    console.log('boardElement:', boardElement);

    // ===== 2. ПОТОМ НАСТРОЙКИ =====
    let theme = localStorage.getItem("theme") || "light";
    let lang = localStorage.getItem("lang") || "ru";
    let accentColor = localStorage.getItem("accentColor") || "green";

    // ===== 3. ПОТОМ ШАХМАТНЫЕ ПЕРЕМЕННЫЕ =====
    const PIECES = {
        white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
        black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
    };

    let board = [];
    let selected = null;
    let currentTurn = 'white';
    let gameOver = false;
    let possibleMoves = [];

    // ===== 4. ПОТОМ ВСЕ ФУНКЦИИ =====
    function getPieceColor(piece) {
        if (!piece) return null;
        const whitePieces = Object.values(PIECES.white);
        const blackPieces = Object.values(PIECES.black);
        if (whitePieces.includes(piece)) return 'white';
        if (blackPieces.includes(piece)) return 'black';
        return null;
    }

    function isValidCell(row, col) { return row >= 0 && row < 8 && col >= 0 && col < 8; }

    function isEmpty(piece) { return !piece || piece === ''; }

    // ===== ХОДЫ =====
    function getPawnMoves(row, col, color) {
        const moves = [];
        const dir = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;

        if (isValidCell(row + dir, col) && isEmpty(board[row + dir][col])) {
            moves.push({ row: row + dir, col });
            if (row === startRow && isValidCell(row + 2 * dir, col) && isEmpty(board[row + 2 * dir][col])) {
                moves.push({ row: row + 2 * dir, col });
            }
        }

        for (const dcol of [-1, 1]) {
            if (isValidCell(row + dir, col + dcol)) {
                const target = board[row + dir][col + dcol];
                if (target && getPieceColor(target) !== color) {
                    moves.push({ row: row + dir, col: col + dcol });
                }
            }
        }
        return moves;
    }

    function getKnightMoves(row, col, color) {
        const moves = [];
        const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, dc] of offsets) {
            const r = row + dr, c = col + dc;
            if (isValidCell(r, c)) {
                const target = board[r][c];
                if (!target || getPieceColor(target) !== color) moves.push({ row: r, col: c });
            }
        }
        return moves;
    }

    function getBishopMoves(row, col, color) {
        const moves = [];
        const directions = [[-1,-1],[-1,1],[1,-1],[1,1]];
        for (const [dr, dc] of directions) {
            let r = row + dr, c = col + dc;
            while (isValidCell(r, c)) {
                const target = board[r][c];
                if (target) {
                    if (getPieceColor(target) !== color) moves.push({ row: r, col: c });
                    break;
                }
                moves.push({ row: r, col: c });
                r += dr; c += dc;
            }
        }
        return moves;
    }

    function getRookMoves(row, col, color) {
        const moves = [];
        const directions = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr, dc] of directions) {
            let r = row + dr, c = col + dc;
            while (isValidCell(r, c)) {
                const target = board[r][c];
                if (target) {
                    if (getPieceColor(target) !== color) moves.push({ row: r, col: c });
                    break;
                }
                moves.push({ row: r, col: c });
                r += dr; c += dc;
            }
        }
        return moves;
    }

    function getQueenMoves(row, col, color) {
        return [...getBishopMoves(row, col, color), ...getRookMoves(row, col, color)];
    }

    function getKingMoves(row, col, color) {
        const moves = [];
        const offsets = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        for (const [dr, dc] of offsets) {
            const r = row + dr, c = col + dc;
            if (isValidCell(r, c)) {
                const target = board[r][c];
                if (!target || getPieceColor(target) !== color) moves.push({ row: r, col: c });
            }
        }
        return moves;
    }

    function getMoves(row, col) {
        const piece = board[row][col];
        if (!piece) return [];
        const color = getPieceColor(piece);
        const pieceType = Object.keys(PIECES.white).find(key => PIECES.white[key] === piece) ||
                         Object.keys(PIECES.black).find(key => PIECES.black[key] === piece);

        switch (pieceType) {
            case 'pawn': return getPawnMoves(row, col, color);
            case 'knight': return getKnightMoves(row, col, color);
            case 'bishop': return getBishopMoves(row, col, color);
            case 'rook': return getRookMoves(row, col, color);
            case 'queen': return getQueenMoves(row, col, color);
            case 'king': return getKingMoves(row, col, color);
            default: return [];
        }
    }

    // ===== ПРОВЕРКА ШАХА =====
    function isKingInCheck(color) {
        let kingRow, kingCol;
        const kingSymbol = color === 'white' ? PIECES.white.king : PIECES.black.king;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === kingSymbol) { kingRow = r; kingCol = c; break; }
            }
        }
        if (kingRow === undefined) return true;

        const enemyColor = color === 'white' ? 'black' : 'white';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && getPieceColor(piece) === enemyColor) {
                    const moves = getMoves(r, c);
                    if (moves.some(m => m.row === kingRow && m.col === kingCol)) return true;
                }
            }
        }
        return false;
    }

    function wouldBeInCheck(row, col, newRow, newCol, color) {
        const targetPiece = board[newRow][newCol];
        const movingPiece = board[row][col];
        board[newRow][newCol] = movingPiece;
        board[row][col] = '';
        const inCheck = isKingInCheck(color);
        board[row][col] = movingPiece;
        board[newRow][newCol] = targetPiece;
        return inCheck;
    }

    function getSafeMoves(row, col) {
        const piece = board[row][col];
        if (!piece) return [];
        const color = getPieceColor(piece);
        const moves = getMoves(row, col);
        return moves.filter(m => !wouldBeInCheck(row, col, m.row, m.col, color));
    }

    // ===== ПРОВЕРКА СОСТОЯНИЯ =====
    function checkGameState(color) {
        let hasMoves = false;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && getPieceColor(piece) === color) {
                    if (getSafeMoves(r, c).length > 0) { hasMoves = true; break; }
                }
            }
            if (hasMoves) break;
        }

        const inCheck = isKingInCheck(color);

        if (!hasMoves) {
            if (inCheck) return { status: 'mate', winner: color === 'white' ? 'black' : 'white' };
            return { status: 'stalemate' };
        }
        if (inCheck) return { status: 'check' };
        return { status: 'playing' };
    }

    function updateGameStatus() {
        if (!gameOver && gameStatus && board.length > 0) {
            const state = checkGameState(currentTurn);
            const isRu = lang === 'ru';
            if (state.status === 'check') {
                gameStatus.textContent = isRu ? 'Шах!' : 'Check!';
            } else {
                gameStatus.textContent = isRu ? 'Игра продолжается' : 'Game continues';
            }
        }
    }

    function updateUI() {
        if (!turnText || !turnPiece) return;
        const isRu = lang === 'ru';
        const turnName = currentTurn === 'white' ? (isRu ? 'Белых' : 'White') : (isRu ? 'Чёрных' : 'Black');
        turnText.textContent = isRu ? `Ход ${turnName}` : `${turnName}'s turn`;
        turnPiece.textContent = currentTurn === 'white' ? PIECES.white.king : PIECES.black.king;
    }

    function renderBoard() {
        console.log('renderBoard вызван');
        if (!boardElement) {
            console.error('boardElement не найден!');
            return;
        }
        
        boardElement.innerHTML = '';
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                if ((r + c) % 2 === 1) cell.classList.add('dark');

                const piece = board[r][c];
                if (piece) {
                    cell.textContent = piece;
                    const color = getPieceColor(piece);
                    if (color === 'white') cell.classList.add('white-piece');
                    if (color === 'black') cell.classList.add('black-piece');
                }

                if (selected && selected.row === r && selected.col === c) {
                    cell.classList.add('selected');
                }

                if (possibleMoves.some(m => m.row === r && m.col === c)) {
                    cell.classList.add('possible');
                }

                cell.addEventListener('click', () => handleCellClick(r, c));
                boardElement.appendChild(cell);
            }
        }
        console.log('Отрисовка завершена, клеток:', boardElement.children.length);
    }

    function handleCellClick(row, col) {
        if (gameOver) return;

        const piece = board[row][col];
        const color = getPieceColor(piece);

        if (selected) {
            const isPossibleMove = possibleMoves.some(m => m.row === row && m.col === col);
            if (isPossibleMove) {
                const movingPiece = board[selected.row][selected.col];
                board[row][col] = movingPiece;
                board[selected.row][selected.col] = '';

                const newTurn = currentTurn === 'white' ? 'black' : 'white';
                currentTurn = newTurn;

                const state = checkGameState(newTurn);
                const isRu = lang === 'ru';
                if (state.status === 'mate') {
                    gameOver = true;
                    gameStatus.textContent = isRu ?
                        `Мат! Победили ${state.winner === 'white' ? 'белые' : 'чёрные'}` :
                        `Checkmate! ${state.winner === 'white' ? 'White' : 'Black'} wins`;
                } else if (state.status === 'stalemate') {
                    gameOver = true;
                    gameStatus.textContent = isRu ? 'Пат! Ничья' : 'Stalemate! Draw';
                } else {
                    updateGameStatus();
                }

                selected = null;
                possibleMoves = [];
                updateUI();
                renderBoard();
                return;
            }

            if (piece && color === currentTurn) {
                selected = { row, col };
                possibleMoves = getSafeMoves(row, col);
                renderBoard();
                updateUI();
                return;
            }

            selected = null;
            possibleMoves = [];
            renderBoard();
            updateUI();
            return;
        }

        if (piece && color === currentTurn) {
            const moves = getSafeMoves(row, col);
            if (moves.length > 0) {
                selected = { row, col };
                possibleMoves = moves;
                renderBoard();
                updateUI();
            }
        }
    }

    function initBoard() {
        console.log('initBoard вызван');
        board = [
            ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
            ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
            ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
        ];
        currentTurn = 'white';
        gameOver = false;
        selected = null;
        possibleMoves = [];
        updateUI();
        renderBoard();
        updateGameStatus();
    }

    // ===== 5. ПОТОМ ФУНКЦИИ НАСТРОЕК =====
    function applyTheme() {
        body.setAttribute("data-theme", theme);
        if (themeBtn) themeBtn.textContent = theme === "light" ? "🌗" : "🌓";
        localStorage.setItem("theme", theme);
    }

    function applyAccentColor() {
        body.setAttribute("data-color", accentColor);
        localStorage.setItem("accentColor", accentColor);
        document.querySelectorAll(".color-dot").forEach(dot => {
            dot.classList.toggle("active", dot.getAttribute("data-color") === accentColor);
        });
    }

    function applyLang() {
        const isRu = lang === "ru";
        if (title) title.textContent = isRu ? "Шахматы" : "Chess";
        if (turnText) turnText.textContent = isRu ? "Ход белых" : "White's turn";
        if (resetBtn) resetBtn.textContent = isRu ? "↻ Новая игра" : "↻ New Game";
        // НЕ ВЫЗЫВАЕМ updateGameStatus() ЗДЕСЬ!
        localStorage.setItem("lang", lang);
    }

    // ===== 6. ПОТОМ СОБЫТИЯ =====
    if (burgerToggle && controlsMenu) {
        burgerToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            controlsMenu.classList.toggle("open");
        });
        document.addEventListener("click", (e) => {
            if (!controlsMenu.contains(e.target) && e.target !== burgerToggle) {
                controlsMenu.classList.remove("open");
            }
        });
    }

    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            theme = theme === "light" ? "dark" : "light";
            applyTheme();
            renderBoard();
        });
    }

    if (langBtn) {
        langBtn.addEventListener("click", () => {
            lang = lang === "ru" ? "en" : "ru";
            applyLang();
            updateUI();
            updateGameStatus(); // Обновляем статус после смены языка
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

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            initBoard();
            const isRu = lang === 'ru';
            if (gameStatus) gameStatus.textContent = isRu ? 'Игра продолжается' : 'Game continues';
        });
    }

    // ===== 7. САМЫЙ ПОСЛЕДНИЙ ЭТАП =====
    applyTheme();
    applyAccentColor();
    applyLang();
    initBoard();
});