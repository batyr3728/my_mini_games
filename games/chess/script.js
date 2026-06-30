document.addEventListener('DOMContentLoaded', () => {

    // ===== ЭЛЕМЕНТЫ =====
    const body = document.body;
    const boardElement = document.getElementById('chessBoard');
    const turnDisplay = document.getElementById('turnDisplay');
    const resetBtn = document.getElementById('reset-btn');
    const backBtn = document.getElementById('back-btn');
    const themeBtn = document.getElementById('themeBtn');
    const langBtn = document.getElementById('langBtn');
    const modeOptions = document.querySelectorAll('.mode-option');
    const modeLabel = document.getElementById('modeLabel');
    const turnLabel = document.getElementById('turnLabel');
    const modeBotText = document.getElementById('modeBotText');
    const modeTwoText = document.getElementById('modeTwoText');

    // ===== НАСТРОЙКИ =====
    let theme = localStorage.getItem("theme") || "light";
    let lang = localStorage.getItem("lang") || "ru";
    let accentColor = localStorage.getItem("accentColor") || "green";
    let gameMode = localStorage.getItem("chessMode") || "bot";

    // ===== ПЕРЕВОДЫ =====
    const translations = {
        ru: {
            bot: 'С ботом',
            two: 'На двоих',
            turnWhite: 'Белые',
            turnBlack: 'Чёрные',
            thinking: '🤔 Бот думает...',
            reset: 'Новая игра',
            mode: 'РЕЖИМ',
            turn: 'ХОД'
        },
        en: {
            bot: 'With bot',
            two: 'Two players',
            turnWhite: 'White',
            turnBlack: 'Black',
            thinking: '🤔 Bot thinking...',
            reset: 'New Game',
            mode: 'MODE',
            turn: 'TURN'
        }
    };

    // ===== ШАХМАТЫ =====
    const PIECES = {
        white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
        black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
    };

    let board = [];
    let selected = null;
    let currentTurn = 'white';
    let gameOver = false;
    let possibleMoves = [];
    let isBotThinking = false;

    // ===== ФУНКЦИИ ШАХМАТ =====
    function getPieceColor(piece) {
        if (!piece) return null;
        if (Object.values(PIECES.white).includes(piece)) return 'white';
        if (Object.values(PIECES.black).includes(piece)) return 'black';
        return null;
    }

    function isValidCell(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
    function isEmpty(piece) { return !piece || piece === ''; }

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
        for (const dc of [-1, 1]) {
            if (isValidCell(row + dir, col + dc)) {
                const target = board[row + dir][col + dc];
                if (target && getPieceColor(target) !== color) moves.push({ row: row + dir, col: col + dc });
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
        const dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
        for (const [dr, dc] of dirs) {
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
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr, dc] of dirs) {
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
        const type = Object.keys(PIECES.white).find(k => PIECES.white[k] === piece) ||
                     Object.keys(PIECES.black).find(k => PIECES.black[k] === piece);
        switch(type) {
            case 'pawn': return getPawnMoves(row, col, color);
            case 'knight': return getKnightMoves(row, col, color);
            case 'bishop': return getBishopMoves(row, col, color);
            case 'rook': return getRookMoves(row, col, color);
            case 'queen': return getQueenMoves(row, col, color);
            case 'king': return getKingMoves(row, col, color);
            default: return [];
        }
    }

    function isKingInCheck(color) {
        // Защита от пустой доски
        if (!board || board.length === 0) return false;
        
        let kingRow, kingCol;
        const king = color === 'white' ? PIECES.white.king : PIECES.black.king;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r] && board[r][c] === king) { kingRow = r; kingCol = c; break; }
            }
        }
        if (kingRow === undefined) return true;
        const enemy = color === 'white' ? 'black' : 'white';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r] && board[r][c];
                if (piece && getPieceColor(piece) === enemy) {
                    const moves = getMoves(r, c);
                    if (moves.some(m => m.row === kingRow && m.col === kingCol)) return true;
                }
            }
        }
        return false;
    }

    function wouldBeInCheck(row, col, newRow, newCol, color) {
        const target = board[newRow][newCol];
        const moving = board[row][col];
        board[newRow][newCol] = moving;
        board[row][col] = '';
        const check = isKingInCheck(color);
        board[row][col] = moving;
        board[newRow][newCol] = target;
        return check;
    }

    function getSafeMoves(row, col) {
        const piece = board[row][col];
        if (!piece) return [];
        const color = getPieceColor(piece);
        return getMoves(row, col).filter(m => !wouldBeInCheck(row, col, m.row, m.col, color));
    }

    function getAllMoves(color) {
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r] && board[r][c];
                if (piece && getPieceColor(piece) === color) {
                    for (const m of getSafeMoves(r, c)) {
                        moves.push({ from: { row: r, col: c }, to: m });
                    }
                }
            }
        }
        return moves;
    }

    // ===== БОТ =====
    function botMove() {
        if (isBotThinking || gameOver || currentTurn !== 'black') return;
        isBotThinking = true;
        updateUI();

        setTimeout(() => {
            const moves = getAllMoves('black');
            if (moves.length === 0) {
                isBotThinking = false;
                updateUI();
                return;
            }

            let bestMove = null;
            let bestScore = -9999;

            for (const move of moves) {
                const captured = board[move.to.row][move.to.col];
                const moving = board[move.from.row][move.from.col];
                board[move.to.row][move.to.col] = moving;
                board[move.from.row][move.from.col] = '';

                const inCheck = isKingInCheck('black');
                let score = 0;

                if (captured) {
                    const capturedColor = getPieceColor(captured);
                    if (capturedColor === 'white') {
                        const pieceValues = {
                            '♔': 1000, '♕': 9, '♖': 5, '♗': 3, '♘': 3, '♙': 1,
                            '♚': 1000, '♛': 9, '♜': 5, '♝': 3, '♞': 3, '♟': 1
                        };
                        score += pieceValues[captured] || 0;
                    }
                }

                if (inCheck) score -= 100;
                if (moving === '♟' && move.to.row === 7) score += 5;
                const centerDist = Math.abs(move.to.row - 3.5) + Math.abs(move.to.col - 3.5);
                score += (7 - centerDist) * 0.1;

                board[move.from.row][move.from.col] = moving;
                board[move.to.row][move.to.col] = captured;

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }

            if (!bestMove) {
                bestMove = moves[Math.floor(Math.random() * moves.length)];
            }

            const piece = board[bestMove.from.row][bestMove.from.col];
            board[bestMove.to.row][bestMove.to.col] = piece;
            board[bestMove.from.row][bestMove.from.col] = '';

            currentTurn = 'white';
            selected = null;
            possibleMoves = [];
            isBotThinking = false;
            updateUI();
            renderBoard();
        }, 400);
    }

    // ===== СОСТОЯНИЕ ИГРЫ =====
    function checkGameState(color) {
        if (!board || board.length === 0) return { status: 'playing' };
        
        let hasMoves = false;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r] && board[r][c];
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

    // ===== ОБНОВЛЕНИЕ UI =====
    function updateUI() {
        const t = translations[lang] || translations.ru;

        modeLabel.textContent = t.mode;
        turnLabel.textContent = t.turn;
        modeBotText.textContent = t.bot;
        modeTwoText.textContent = t.two;

        modeOptions.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.mode === gameMode);
        });

        resetBtn.textContent = t.reset;

        if (isBotThinking) {
            turnDisplay.textContent = t.thinking;
            turnDisplay.className = 'value';
            return;
        }

        if (gameOver) {
            return;
        }

        turnDisplay.textContent = currentTurn === 'white' ? t.turnWhite : t.turnBlack;
        turnDisplay.className = 'value ' + (currentTurn === 'white' ? 'turn-white' : 'turn-black');

        const state = checkGameState(currentTurn);
        if (state.status === 'mate' || state.status === 'stalemate') {
            gameOver = true;
        }
    }

    // ===== ОТРИСОВКА ДОСКИ =====
    function renderBoard() {
        if (!boardElement) return;
        if (!board || board.length === 0) {
            boardElement.innerHTML = '';
            return;
        }

        boardElement.innerHTML = '';

        let kingRow = -1, kingCol = -1;
        if (!gameOver && board.length > 0) {
            const kingSymbol = currentTurn === 'white' ? PIECES.white.king : PIECES.black.king;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (board[r] && board[r][c] === kingSymbol) {
                        kingRow = r;
                        kingCol = c;
                        break;
                    }
                }
                if (kingRow !== -1) break;
            }
        }

        const isCheck = !gameOver && kingRow !== -1 && isKingInCheck(currentTurn);

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                if ((r + c) % 2 === 1) cell.classList.add('dark');

                if (isCheck && r === kingRow && c === kingCol) {
                    cell.classList.add('in-check');
                }

                const piece = board[r] && board[r][c];
                if (piece) {
                    cell.textContent = piece;
                    const color = getPieceColor(piece);
                    if (color === 'white') cell.classList.add('white-piece');
                    if (color === 'black') {
                        cell.classList.add('black-piece');
                        if (gameMode === 'two') {
                            cell.style.transform = 'rotate(180deg)';
                        }
                    }
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
    }

    // ===== ОБРАБОТКА КЛИКА =====
    function handleCellClick(row, col) {
        if (gameOver || isBotThinking) return;
        if (gameMode === 'bot' && currentTurn === 'black') return;

        const piece = board[row][col];
        const color = getPieceColor(piece);

        if (selected) {
            const isMove = possibleMoves.some(m => m.row === row && m.col === col);
            if (isMove) {
                const moving = board[selected.row][selected.col];
                board[row][col] = moving;
                board[selected.row][selected.col] = '';
                currentTurn = currentTurn === 'white' ? 'black' : 'white';

                selected = null;
                possibleMoves = [];
                updateUI();
                renderBoard();

                if (gameMode === 'bot' && !gameOver && currentTurn === 'black') {
                    botMove();
                }
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

    // ===== ИНИЦИАЛИЗАЦИЯ =====
    function initBoard() {
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
        isBotThinking = false;
        renderBoard();
        updateUI();
    }

    // ===== НАСТРОЙКИ =====
    function applyTheme() {
        body.setAttribute("data-theme", theme);
        themeBtn.textContent = theme === "light" ? "🌗" : "🌓";
        localStorage.setItem("theme", theme);
    }

    function applyAccentColor() {
        body.setAttribute("data-color", accentColor);
        localStorage.setItem("accentColor", accentColor);
    }

    function applyLang() {
        localStorage.setItem("lang", lang);
        langBtn.textContent = lang === "ru" ? "🌍" : "🌎";
        updateUI();
    }

    function applyMode(mode) {
        gameMode = mode;
        localStorage.setItem("chessMode", gameMode);
        initBoard();
    }

    function loadSettings() {
        theme = localStorage.getItem("theme") || "light";
        accentColor = localStorage.getItem("accentColor") || "green";
        lang = localStorage.getItem("lang") || "ru";
        gameMode = localStorage.getItem("chessMode") || "bot";

        applyTheme();
        applyAccentColor();
        applyLang();
    }

    // ===== КОСТЫЛЬ: ПРИНУДИТЕЛЬНЫЙ ЗАПУСК =====
    function forceStart() {
        loadSettings();
        
        // Пробуем initBoard сразу
        initBoard();
        
        // Если не помогло — через 100ms ещё раз
        setTimeout(() => {
            if (!boardElement || boardElement.children.length === 0) {
                initBoard();
            }
        }, 100);
        
        // И ещё через 300ms на всякий случай
        setTimeout(() => {
            if (!boardElement || boardElement.children.length === 0) {
                initBoard();
            }
        }, 300);
        
        // Самый жёсткий костыль — эмулируем клик по кнопке "Новая игра"
        setTimeout(() => {
            if (!boardElement || boardElement.children.length === 0) {
                if (resetBtn) {
                    resetBtn.click();
                }
            }
        }, 500);
    }

    // ===== СОБЫТИЯ =====
    backBtn.addEventListener('click', () => window.location.href = '../../index.html');

    themeBtn.addEventListener('click', () => {
        theme = theme === "light" ? "dark" : "light";
        applyTheme();
        renderBoard();
    });

    langBtn.addEventListener('click', () => {
        lang = lang === "ru" ? "en" : "ru";
        applyLang();
    });

    resetBtn.addEventListener('click', initBoard);

    modeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const mode = opt.dataset.mode;
            if (mode === gameMode) return;
            applyMode(mode);
        });
    });

    // ===== СТАРТ С КОСТЫЛЯМИ =====
    forceStart();
});