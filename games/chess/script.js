document.addEventListener('DOMContentLoaded', () => {

    const body = document.body;
    const themeBtn = document.getElementById("themeBtn");
    const langBtn = document.getElementById("langBtn");
    const colorPicker = document.getElementById("colorPicker");
    const burgerToggle = document.getElementById("burgerToggle");
    const controlsMenu = document.getElementById("controlsMenu");
    const backBtn = document.getElementById("backBtn");
    
    const boardElement = document.getElementById('chessBoard');
    const turnText = document.getElementById('turnText');
    const turnPiece = document.getElementById('turnPiece');
    const gameStatus = document.getElementById('gameStatus');
    const resetBtn = document.getElementById('resetBtn');
    const modeBot = document.getElementById('modeBot');
    const modeTwo = document.getElementById('modeTwo');

    // ===== КНОПКА НАЗАД =====
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });
    }

    let theme = localStorage.getItem("theme") || "light";
    let lang = localStorage.getItem("lang") || "ru";
    let accentColor = localStorage.getItem("accentColor") || "green";
    let gameMode = localStorage.getItem("chessMode") || "bot";

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
        let kingRow, kingCol;
        const king = color === 'white' ? PIECES.white.king : PIECES.black.king;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === king) { kingRow = r; kingCol = c; break; }
            }
        }
        if (kingRow === undefined) return true;
        const enemy = color === 'white' ? 'black' : 'white';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
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
                const piece = board[r][c];
                if (piece && getPieceColor(piece) === color) {
                    for (const m of getSafeMoves(r, c)) {
                        moves.push({ from: { row: r, col: c }, to: m });
                    }
                }
            }
        }
        return moves;
    }

    function botMove() {
        if (isBotThinking || gameOver || currentTurn !== 'black') return;
        isBotThinking = true;
        gameStatus.textContent = lang === 'ru' ? '🤔 Бот думает...' : '🤔 Bot thinking...';
        
        setTimeout(() => {
            const moves = getAllMoves('black');
            if (moves.length === 0) {
                isBotThinking = false;
                updateGameStatus();
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

                if (inCheck) {
                    score -= 100;
                }

                if (moving === '♟' && move.to.row === 7) {
                    score += 5;
                }

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
            updateGameStatus();
        }, 500);
    }

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
                const player = currentTurn === 'white' ? (isRu ? 'Белые' : 'White') : (isRu ? 'Чёрные' : 'Black');
                gameStatus.textContent = isRu ? `Шах! ${player} под шахом` : `Check! ${player} in check`;
            } else {
                gameStatus.textContent = isRu ? 'Игра продолжается' : 'Game continues';
            }
        }
    }

    function updateUI() {
        if (!turnText || !turnPiece) return;
        const isRu = lang === 'ru';
        const name = currentTurn === 'white' ? (isRu ? 'Белых' : 'White') : (isRu ? 'Чёрных' : 'Black');
        turnText.textContent = isRu ? `Ход ${name}` : `${name}'s turn`;
        turnPiece.textContent = currentTurn === 'white' ? PIECES.white.king : PIECES.black.king;
    }

    function renderBoard() {
        if (!boardElement) return;
        boardElement.innerHTML = '';
        
        let kingRow = -1, kingCol = -1;
        if (!gameOver && board.length > 0) {
            const kingSymbol = currentTurn === 'white' ? PIECES.white.king : PIECES.black.king;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (board[r][c] === kingSymbol) {
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
                    cell.style.background = '#ff4444';
                    cell.style.boxShadow = 'inset 0 0 30px rgba(255,0,0,0.8)';
                }

                const piece = board[r][c];
                if (piece) {
                    cell.textContent = piece;
                    const color = getPieceColor(piece);
                    if (color === 'white') {
                        cell.classList.add('white-piece');
                    }
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
                const state = checkGameState(currentTurn);
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
                    if (gameMode === 'bot' && currentTurn === 'black') {
                        gameStatus.textContent = lang === 'ru' ? '🤔 Бот думает...' : '🤔 Bot thinking...';
                    } else {
                        updateGameStatus();
                    }
                }
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

    function initBoard() {
        if (gameMode === 'two') {
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
        } else {
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
        }
        currentTurn = 'white';
        gameOver = false;
        selected = null;
        possibleMoves = [];
        isBotThinking = false;
        updateUI();
        renderBoard();
        updateGameStatus();
    }

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
        if (turnText) turnText.textContent = isRu ? "Ход белых" : "White's turn";
        if (resetBtn) resetBtn.textContent = isRu ? "↻ Новая игра" : "↻ New Game";
        localStorage.setItem("lang", lang);
    }

    function applyMode() {
        modeBot.classList.toggle('active', gameMode === 'bot');
        modeTwo.classList.toggle('active', gameMode === 'two');
        localStorage.setItem("chessMode", gameMode);
        initBoard();
    }

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
            updateGameStatus();
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

    modeBot.addEventListener('click', () => {
        if (gameMode === 'bot') return;
        gameMode = 'bot';
        applyMode();
    });

    modeTwo.addEventListener('click', () => {
        if (gameMode === 'two') return;
        gameMode = 'two';
        applyMode();
    });

    applyTheme();
    applyAccentColor();
    applyLang();
    applyMode();
});