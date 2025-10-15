import React, { useEffect, useState, useMemo, useCallback } from "react";

// Board size options (only 9x9)
const BOARD_SIZES = {
    "9x9": 9
};

// Stone colors
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

function createBoard(size) {
    return Array.from({ length: size }, () => Array(size).fill(EMPTY));
}

function copyBoard(board) {
    return board.map(row => [...row]);
}

// Check for 5 in a row (horizontally, vertically, diagonally)
function checkWin(board, row, col, color) {
    const directions = [
        [1, 0],   // vertical
        [0, 1],   // horizontal
        [1, 1],   // diagonal down-right
        [1, -1],  // diagonal down-left
    ];

    const size = board.length;

    for (const [dr, dc] of directions) {
        let count = 1;

        // forward direction
        let r = row + dr, c = col + dc;
        while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === color) {
            count++;
            r += dr;
            c += dc;
        }

        // backward direction
        r = row - dr;
        c = col - dc;
        while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === color) {
            count++;
            r -= dr;
            c -= dc;
        }

        if (count >= 5) return true;
    }

    return false;
}

// Get neighboring positions (orthogonal) — used for proximity heuristics only
function getNeighbors(row, col, size) {
    const neighbors = [];
    if (row > 0) neighbors.push([row - 1, col]);
    if (row < size - 1) neighbors.push([row + 1, col]);
    if (col > 0) neighbors.push([row, col - 1]);
    if (col < size - 1) neighbors.push([row, col + 1]);
    return neighbors;
}

// Gomoku mode: no groups/captures

// Gomoku: a move is valid if the intersection is empty
function isValidMove(board, row, col, color) {
    if (board[row][col] !== EMPTY) return { valid: false };
    const newBoard = copyBoard(board);
    newBoard[row][col] = color;
    return { valid: true, captured: [], board: newBoard };
}

// ======= Stronger Gomoku AI Engine =======
// Made improvements:
// - Corrected evaluation functions to work for either color
// - Better pattern scoring (open-four, closed-four, open-three double threats)
// - Root move ordering by heuristic evaluation
// - Increased defaults for stronger play (adjustable)

const MAX_DEPTH_DEFAULT = 3; // Significantly reduced depth for instant responses
const SEARCH_TIME_MARGIN_MS = 20; // Minimal margin for fastest responses
let CANDIDATE_RANGE = 2; // Default range for move consideration

// ---------- Zobrist hashing ----------
function initZobrist(size) {
    const zobrist = {
        table: Array.from({ length: size }, () => Array.from({ length: size }, () => [rand32(), rand32()])),
        size
    };
    return zobrist;
}
function rand32() {
    // 32-bit random
    return Math.floor(Math.random() * 0xFFFFFFFF) >>> 0;
}
function computeHash(board, zobrist) {
    let h = 0 >>> 0;
    for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board.length; c++) {
            const v = board[r][c];
            if (v === BLACK) h = (h ^ zobrist.table[r][c][0]) >>> 0;
            else if (v === WHITE) h = (h ^ zobrist.table[r][c][1]) >>> 0;
        }
    }
    return h;
}

// ---------- Transposition table ----------
class TT {
    constructor() { this.table = new Map(); }
    get(key) { return this.table.get(key); }
    set(key, entry) { this.table.set(key, entry); }
    clear() { this.table.clear(); }
}
const tt = new TT();

// ---------- Mutable move / undo helpers ----------
function applyMove(board, r, c, color, undoStack) {
    undoStack.push({ r, c, prev: board[r][c] });
    board[r][c] = color;
}
function undoMove(board, undoStack) {
    const record = undoStack.pop();
    if (!record) return;
    const { r, c, prev } = record;
    board[r][c] = prev;
}

// ---------- Candidate move generator (neighbors within range) ----------
function generateCandidates(board) {
    const size = board.length;
    const seen = new Set();
    const candidates = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] !== EMPTY) {
                // mark neighbors in range
                for (let dr = -CANDIDATE_RANGE; dr <= CANDIDATE_RANGE; dr++) {
                    for (let dc = -CANDIDATE_RANGE; dc <= CANDIDATE_RANGE; dc++) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === EMPTY) {
                            const key = nr + ',' + nc;
                            if (!seen.has(key)) {
                                seen.add(key);
                                candidates.push({ row: nr, col: nc });
                            }
                        }
                    }
                }
            }
        }
    }
    // if board empty (first move), add center
    if (candidates.length === 0) {
        const mid = Math.floor(size / 2);
        return [{ row: mid, col: mid }];
    }
    return candidates;
}

// ---------- Quick tactical checks ----------
function findImmediateWinningMove(board, color) {
    const cands = generateCandidates(board);
    for (const { row, col } of cands) {
        if (board[row][col] !== EMPTY) continue;
        board[row][col] = color;
        const win = checkWin(board, row, col, color);
        board[row][col] = EMPTY;
        if (win) return { row, col };
    }
    return null;
}
function findImmediateOpponentThreat(board, opponentColor) {
    const cands = generateCandidates(board);
    for (const { row, col } of cands) {
        if (board[row][col] !== EMPTY) continue;
        board[row][col] = opponentColor;
        const win = checkWin(board, row, col, opponentColor);
        board[row][col] = EMPTY;
        if (win) return { row, col };
    }
    return null;
}

// ---------- Improved evaluation ----------
// Pattern scoring helpers now take a color parameter so they work for either player

function scorePattern(pattern, color) {
    // pattern is length 9 window with center at index 4
    const center = pattern[4];
    if (center !== EMPTY) return 0; // must be empty for this candidate-based scoring

    let score = 0;
    // examine all 5-length slices
    for (let i = 0; i <= 4; i++) {
        const slice = pattern.slice(i, i + 5);
        if (slice.length < 5) continue;
        const ourCount = slice.filter(p => p === color).length;
        const oppCount = slice.filter(p => (p !== EMPTY && p !== color)).length;
        const emptyCount = slice.filter(p => p === EMPTY).length;

        if (oppCount > 0) {
            // Consider blocking value even when opponent stones present
            if (oppCount === 4 && emptyCount === 1) {
                score += 90000; // Critical block needed
            } else if (oppCount === 3 && emptyCount === 2) {
                score += 3500; // Important block
            }
            continue;
        }

        if (ourCount === 4 && emptyCount === 1) {
            // Check if it's an open-4 (both ends open)
            const startIdx = i;
            const endIdx = i + 4;
            const hasOpenStart = startIdx > 0 && pattern[startIdx - 1] === EMPTY;
            const hasOpenEnd = endIdx < pattern.length - 1 && pattern[endIdx + 1] === EMPTY;
            if (hasOpenStart || hasOpenEnd) {
                score += 150000; // Open-4 is highest priority
            } else {
                score += 100000; // Closed-4 still very strong
            }
        } else if (ourCount === 3 && emptyCount === 2) {
            // Check for open-3
            const startIdx = i;
            const endIdx = i + 4;
            const hasOpenStart = startIdx > 0 && pattern[startIdx - 1] === EMPTY;
            const hasOpenEnd = endIdx < pattern.length - 1 && pattern[endIdx + 1] === EMPTY;
            if (hasOpenStart && hasOpenEnd) {
                score += 8000; // Open-3 is very dangerous
            } else {
                score += 4000; // Closed-3 still strong
            }
        } else if (ourCount === 2 && emptyCount === 3) {
            // Check for open-2
            const startIdx = i;
            const endIdx = i + 4;
            const hasOpenStart = startIdx > 0 && pattern[startIdx - 1] === EMPTY;
            const hasOpenEnd = endIdx < pattern.length - 1 && pattern[endIdx + 1] === EMPTY;
            if (hasOpenStart && hasOpenEnd) {
                score += 800; // Open-2 has good potential
            } else {
                score += 400; // Closed-2 still worth considering
            }
        } else if (ourCount === 1 && emptyCount === 4) {
            score += 40;
        }
    }

    // Additional bonuses for adjacent friendly stones
    const adjacentCount = pattern.slice(3, 6).filter(p => p === color).length;
    score += adjacentCount * 15; // Higher bonus for immediately adjacent stones

    return score;
}

function getPattern(board, row, col, dr, dc) {
    const size = board.length;
    const pattern = [];
    // Get 9 positions in the line (4 before, center, 4 after)
    for (let i = -4; i <= 4; i++) {
        const r = row + i * dr;
        const c = col + i * dc;
        if (r >= 0 && r < size && c >= 0 && c < size) {
            pattern.push(board[r][c]);
        } else {
            pattern.push(-1); // out of bounds mark
        }
    }
    // Replace out-of-bounds (-1) with opponent marker so slices crossing border count as blocked
    for (let i = 0; i < pattern.length; i++) {
        if (pattern[i] === -1) pattern[i] = -9; // unique marker
    }
    return pattern;
}

function evaluatePatterns(board, row, col, color) {
    const directions = [
        [1, 0], [0, 1], [1, 1], [1, -1]
    ];
    let totalScore = 0;
    for (const [dr, dc] of directions) {
        const pattern = getPattern(board, row, col, dr, dc);
        totalScore += scorePattern(pattern, color);
    }
    return totalScore;
}

function evaluateThreats(board, row, col, color) {
    const testBoard = copyBoard(board);
    testBoard[row][col] = color;
    let threatScore = 0;
    if (checkWin(testBoard, row, col, color)) threatScore += 1000000;

    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (const [dr, dc] of directions) {
        const pattern = getPattern(testBoard, row, col, dr, dc);
        threatScore += scorePattern(pattern, color);
    }
    return threatScore;
}

function evaluateStrategicPosition(board, row, col, size, color) {
    let score = 0;
    const neighbors = getNeighbors(row, col, size);
    let nearbyStones = 0;
    for (const [nr, nc] of neighbors) {
        if (board[nr][nc] !== EMPTY) {
            nearbyStones++;
            if (board[nr][nc] === color) score += 8; else score += 2;
        }
    }
    score += nearbyStones * 8;

    // Prefer positions that create multiple threat directions
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    let threatDirs = 0;
    for (const [dr, dc] of directions) {
        const pattern = getPattern(board, row, col, dr, dc);
        if (scorePattern(pattern, color) > 0) threatDirs++;
    }
    score += threatDirs * 300;
    return score;
}

function evaluatePosition(board, row, col, color) {
    const size = board.length;
    const opponentColor = color === BLACK ? WHITE : BLACK;
    let score = 0;

    const result = isValidMove(board, row, col, color);
    score += result.captured.length * 100;

    // Pattern and threat evaluation
    score += evaluatePatterns(board, row, col, color);
    score += evaluateThreats(board, row, col, color) * 0.8;
    score += evaluateThreats(board, row, col, opponentColor) * 0.6; // blocking opponent matters too

    score += evaluateStrategicPosition(board, row, col, size, color);

    // Center control bonus (small)
    const centerDistance = Math.abs(row - (size - 1) / 2) + Math.abs(col - (size - 1) / 2);
    score += Math.max(0, (size - centerDistance)) * 6;

    return score;
}

function getAllValidMoves(board, color) {
    const size = board.length;
    const moves = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === EMPTY) {
                const result = isValidMove(board, r, c, color);
                if (result.valid) {
                    const score = evaluatePosition(board, r, c, color);
                    moves.push({ row: r, col: c, score, captured: result.captured });
                }
            }
        }
    }
    return moves.sort((a, b) => b.score - a.score);
}

function evaluateBoard(board, color) {
    const size = board.length;
    let score = 0;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === color) {
                score += evaluatePosition(board, r, c, color);
            } else if (board[r][c] !== EMPTY) {
                score -= evaluatePosition(board, r, c, board[r][c]) * 0.85;
            }
        }
    }
    return score;
}

// ---------- Quiescence: resolve immediate wins/blocks ----------
function quiescence(board, color, alpha, beta) {
    const winMove = findImmediateWinningMove(board, color);
    if (winMove) return 1000000;
    return evaluateBoard(board, color);
}

// ---------- Negamax with alpha-beta, TT, history heuristic ----------
const HISTORY = {};
function negamaxNode(board, color, depth, alpha, beta, startTime, timeLimitMs, zobrist, undoStack) {
    const opponent = color === BLACK ? WHITE : BLACK;
    const alphaOrig = alpha;

    const inner = (board, color, depth, alpha, beta) => {
        if (performance.now() - startTime > timeLimitMs - SEARCH_TIME_MARGIN_MS) return null;

        const hash = computeHash(board, zobrist);
        const ttEntry = tt.get(hash);
        if (ttEntry && ttEntry.depth >= depth) {
            if (ttEntry.flag === 'EXACT') return ttEntry.value;
            if (ttEntry.flag === 'LOWER') alpha = Math.max(alpha, ttEntry.value);
            if (ttEntry.flag === 'UPPER') beta = Math.min(beta, ttEntry.value);
            if (alpha >= beta) return ttEntry.value;
        }

        if (depth === 0) return quiescence(board, color, alpha, beta);

        let moves = generateCandidates(board);
        // Order root-level moves by heuristic
        moves.sort((a, b) => {
            const sa = evaluatePosition(board, a.row, a.col, color);
            const sb = evaluatePosition(board, b.row, b.col, color);
            return sb - sa;
        });

        const winning = [], blocking = [], rest = [];
        for (const m of moves) {
            const { row, col } = m;
            if (board[row][col] !== EMPTY) continue;
            board[row][col] = color;
            const win = checkWin(board, row, col, color);
            board[row][col] = EMPTY;
            if (win) { winning.push(m); continue; }
            board[row][col] = opponent;
            const oppWin = checkWin(board, row, col, opponent);
            board[row][col] = EMPTY;
            if (oppWin) { blocking.push(m); continue; }
            rest.push(m);
        }

        rest.sort((a, b) => (HISTORY[`${b.row},${b.col}`] || 0) - (HISTORY[`${a.row},${a.col}`] || 0));
        moves = [...winning, ...blocking, ...rest];

        let best = -Infinity;
        for (const m of moves) {
            const { row, col } = m;
            if (board[row][col] !== EMPTY) continue;
            applyMove(board, row, col, color, undoStack);
            const val = inner(board, color === BLACK ? WHITE : BLACK, depth - 1, -beta, -alpha);
            undoMove(board, undoStack);
            if (val === null) return null;
            const score = -val;
            if (score > best) best = score;
            alpha = Math.max(alpha, score);
            if (alpha >= beta) {
                HISTORY[`${row},${col}`] = (HISTORY[`${row},${col}`] || 0) + (1 << depth);
                break;
            }
        }

        const flag = (best <= alphaOrig) ? 'UPPER' : (best >= beta ? 'LOWER' : 'EXACT');
        tt.set(hash, { value: best === -Infinity ? 0 : best, depth, flag });
        return best === -Infinity ? 0 : best;
    };

    return inner(board, color, depth, alpha, beta);
}

// ---------- Iterative deepening driver ----------
function getAIMove(board, color, timeLimitMs = 2000) {
    const size = board.length;
    if (!getAIMove.zobrist || getAIMove.zobrist.size !== size) {
        getAIMove.zobrist = initZobrist(size);
    }
    const zobrist = getAIMove.zobrist;

    // Immediate tactical checks
    const immediateWin = findImmediateWinningMove(board, color);
    if (immediateWin) return immediateWin;
    const opponent = color === BLACK ? WHITE : BLACK;
    const immediateThreat = findImmediateOpponentThreat(board, opponent);
    if (immediateThreat) return { row: immediateThreat.row, col: immediateThreat.col };

    const startTime = performance.now();
    let bestMove = null;
    let bestScore = -Infinity;
    let undoStack = [];
    tt.clear();

    // generate candidates once and order by heuristic (top N)
    let candidates = generateCandidates(board);
    candidates = candidates.map(m => ({ ...m, score: evaluatePosition(board, m.row, m.col, color) }));
    candidates.sort((a, b) => b.score - a.score);
    // keep only top 8 candidates for immediate response
    const TOPK = Math.min(8, candidates.length);
    candidates = candidates.slice(0, TOPK);

    for (let depth = 1; depth <= MAX_DEPTH_DEFAULT; depth++) {
        if (performance.now() - startTime > timeLimitMs - SEARCH_TIME_MARGIN_MS) break;
        let localBest = null;
        let localBestScore = -Infinity;

        for (const m of candidates) {
            if (performance.now() - startTime > timeLimitMs - SEARCH_TIME_MARGIN_MS) break;
            const { row, col } = m;
            if (board[row][col] !== EMPTY) continue;
            applyMove(board, row, col, color, undoStack);
            const val = negamaxNode(board, opponent, depth - 1, -Infinity, Infinity, startTime, timeLimitMs, zobrist, undoStack);
            undoMove(board, undoStack);
            if (val === null) break; // time up
            const score = -val;
            if (score > localBestScore) {
                localBestScore = score;
                localBest = m;
            }
        }

        if (localBest) {
            bestMove = { row: localBest.row, col: localBest.col };
            bestScore = localBestScore;
        }

        if (performance.now() - startTime > timeLimitMs - SEARCH_TIME_MARGIN_MS) break;
    }

    if (!bestMove) {
        const all = getAllValidMoves(board, color);
        return all.length ? { row: all[0].row, col: all[0].col } : null;
    }
    return bestMove;
}

export default function GoGame() {
    const [boardSize, setBoardSize] = useState("9x9");
    const [gameMode, setGameMode] = useState(null); // null -> choose mode, 'pvp' or 'pvc'
    const [board, setBoard] = useState(() => createBoard(BOARD_SIZES[boardSize]));
    const [currentPlayer, setCurrentPlayer] = useState(BLACK);
    const [gameOver, setGameOver] = useState(false);
    const [passes, setPasses] = useState(0);
    const [moveHistory, setMoveHistory] = useState([]);
    const [capturedStones, setCapturedStones] = useState({ black: 0, white: 0 });
    const [isThinking, setIsThinking] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Reset game when settings change
    useEffect(() => {
        const size = BOARD_SIZES[boardSize];
        setBoard(createBoard(size));
        setCurrentPlayer(BLACK);
        setGameOver(false);
        setPasses(0);
        setMoveHistory([]);
        setCapturedStones({ black: 0, white: 0 });
    }, [boardSize, gameMode]);

    const territory = useMemo(() => {
        if (gameOver) {
            return { black: 0, white: 0 };
        }
        return { black: 0, white: 0 };
    }, [board, gameOver]);

    const startGame = (mode) => {
        setGameMode(mode);
    }

    const backToMenu = () => {
        setGameMode(null);
    }

    // Internal move applier used by both human and AI (does not check isThinking)
    const applyMoveImmediate = useCallback((row, col, color) => {
        const result = isValidMove(board, row, col, color);
        if (!result.valid) return false;
        const newBoard = copyBoard(board);
        newBoard[row][col] = color;
        setBoard(newBoard);
        setMoveHistory(prev => [...prev, { row, col, color }]);
        setPasses(0);
        if (checkWin(newBoard, row, col, color)) {
            setGameOver(true);
            return true;
        }
        setCurrentPlayer(color === BLACK ? WHITE : BLACK);
        return true;
    }, [board]);

    const handleCellClick = useCallback((row, col) => {
        if (gameOver) return;
        if (gameMode === "pvc" && currentPlayer === WHITE) return; // AI's turn
        if (isThinking) return;
        applyMoveImmediate(row, col, currentPlayer);
    }, [applyMoveImmediate, currentPlayer, gameMode, gameOver, isThinking]);

    const handlePass = useCallback(() => {
        if (gameOver || isThinking) return;
        if (gameMode === "pvc" && currentPlayer === WHITE) return;

        const newPasses = passes + 1;
        setPasses(newPasses);

        if (newPasses >= 2) {
            setGameOver(true);
        } else {
            setCurrentPlayer(currentPlayer === BLACK ? WHITE : BLACK);
        }
    }, [passes, currentPlayer, gameOver, gameMode, isThinking]);

    // AI move (synchronous, safe against re-entry)
    useEffect(() => {
        if (gameMode !== "pvc" || currentPlayer !== WHITE || gameOver || isThinking) return;

        // Use setTimeout to prevent UI blocking
        const timeoutId = setTimeout(() => {
            setIsThinking(true);
            try {
                // Fixed very fast time limit for immediate responses
                const timeLimitMs = 200; // Constant fast response time
                
                // Keep search space small for quick responses
                CANDIDATE_RANGE = 2; // Fixed small search range
                
                const aiMove = getAIMove(board, WHITE, timeLimitMs);
                if (aiMove) {
                    // Bypass isThinking guard
                    applyMoveImmediate(aiMove.row, aiMove.col, WHITE);
                } else {
                    handlePass();
                }
            } catch (e) {
                console.error('AI error:', e);
            } finally {
                setIsThinking(false);
            }
        }, 10); // tiny delay to let UI update

        return () => clearTimeout(timeoutId);
    }, [board, currentPlayer, gameMode, gameOver, isThinking, applyMoveImmediate, handlePass]);

    const handleReset = () => {
        const size = BOARD_SIZES[boardSize];
        setBoard(createBoard(size));
        setCurrentPlayer(BLACK);
        setGameOver(false);
        setPasses(0);
        setMoveHistory([]);
        setCapturedStones({ black: 0, white: 0 });
    };

    const handleUndo = () => {
        if (moveHistory.length === 0 || gameOver || isThinking) return;

        const newHistory = [...moveHistory];
        const lastMove = newHistory.pop();

        // If playing against AI and last move was AI's, undo one more
        if (gameMode === "pvc" && lastMove.color === WHITE && newHistory.length > 0) {
            newHistory.pop();
        }

        // Rebuild board from history
        const size = BOARD_SIZES[boardSize];
        const newBoard = createBoard(size);
        const newCaptured = { black: 0, white: 0 };

        for (const move of newHistory) {
            const result = isValidMove(newBoard, move.row, move.col, move.color);
            if (result.valid) {
                newBoard[move.row][move.col] = move.color;
            }
        }

        setBoard(newBoard);
        setMoveHistory(newHistory);
        setCapturedStones(newCaptured);
        setCurrentPlayer(newHistory.length % 2 === 0 ? BLACK : WHITE);
        setPasses(0);
    };

    const size = BOARD_SIZES[boardSize];
    const cellSize = isMobile ? 32 : 40;

    if (!gameMode) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <main className="flex items-center justify-center p-6">
                    <div className="p-8 rounded-2xl fade-in max-w-2xl w-full transform transition-all duration-500 bg-gray-800 border border-gray-700">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold mb-4">⚫⚪ Go Game</h1>
                            <p className="text-gray-400 text-lg">Choose your game mode</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button
                                onClick={() => startGame('pvp')}
                                className="group bg-gray-700 hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 border-2 border-gray-600 hover:border-transparent"
                            >
                                <div className="text-6xl mb-4">👥</div>
                                <h2 className="text-2xl font-bold mb-3">Player vs Player</h2>
                                <p className="text-gray-300 group-hover:text-white mb-4">
                                    Play with a friend on the same device
                                </p>
                                <div className="text-sm text-gray-400 group-hover:text-gray-200">
                                    Classic two-player mode
                                </div>
                            </button>

                            <button
                                onClick={() => startGame('pvc')}
                                className="group bg-gray-700 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 border-2 border-gray-600 hover:border-transparent"
                            >
                                <div className="text-6xl mb-4">🤖</div>
                                <h2 className="text-2xl font-bold mb-3">Player vs Computer</h2>
                                <p className="text-gray-300 group-hover:text-white mb-4">
                                    Challenge our AI
                                </p>
                                <div className="text-sm text-gray-400 group-hover:text-gray-200">
                                    Professional AI with iterative deepening
                                </div>
                            </button>
                        </div>

                        <div className="mt-8 text-center text-gray-500 text-sm bg-gray-700 p-4 rounded-xl">
                            <p className="mb-2">🎯 <strong>How to Play:</strong></p>
                            <p>Place stones alternately. First to get five in a row wins (Gomoku-style).</p>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <main className="flex items-center justify-center p-6">
                <div className="game-board p-8 rounded-2xl max-w-7xl w-full bg-gray-800 border border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-white">⚫⚪ Go Game</h1>
                        <div className="flex gap-2">
                            <button
                                onClick={handleUndo}
                                disabled={moveHistory.length === 0 || gameOver || isThinking}
                                className="px-3 py-1 rounded text-sm bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
                            >
                                ↶ Undo
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-3 py-1 rounded text-sm bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                🎮 Reset
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-600 rounded-xl">
                            <div className="text-xl font-bold mb-1">👥</div>
                            <div className="text-xl font-semibold">{gameMode === "pvp" ? "PvP" : "PvC"}</div>
                            <div className="text-xs text-gray-200">Game Mode</div>
                        </div>
                        <div className="text-center p-4 bg-green-600 rounded-xl">
                            <div className="text-xl font-bold mb-1">📊</div>
                            <div className="text-xl font-semibold">{moveHistory.length}</div>
                            <div className="text-xs text-gray-200">Moves</div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        <h2 className="text-2xl font-bold mb-6 text-center">
                            {gameOver ? (
                                <span className="text-green-400">
                                    🎉 Game Over! {currentPlayer === BLACK ? "⚫ Black" : "⚪ White"} Wins!
                                </span>
                            ) : isThinking ? (
                                <span className="text-yellow-400">⚡ AI Computing...</span>
                            ) : (
                                <span className={currentPlayer === BLACK ? "text-gray-300" : "text-gray-100"}>
                                    {currentPlayer === BLACK ? "⚫ Black's" : "⚪ White's"} Turn
                                    {passes === 1 && <span className="text-sm text-yellow-400 ml-2">(1 Pass)</span>}
                                </span>
                            )}
                        </h2>

                        <div className="flex flex-wrap justify-center items-center gap-3 mb-6">
                            <button
                                onClick={handlePass}
                                disabled={gameOver || isThinking || (gameMode === "pvc" && currentPlayer === WHITE)}
                                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold"
                            >
                                Pass Turn
                            </button>
                        </div>

                        <div className="inline-block rounded-2xl p-4 bg-yellow-700 shadow-lg mb-6 overflow-auto max-w-full">
                            <div
                                className="grid gap-0 bg-yellow-600"
                                style={{
                                    gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
                                    padding: `${cellSize / 2}px`
                                }}
                            >
                                {board.map((row, r) =>
                                    row.map((cell, c) => (
                                        <button
                                            key={`${r}-${c}`}
                                            onClick={() => handleCellClick(r, c)}
                                            disabled={gameOver || cell !== EMPTY || isThinking || (gameMode === "pvc" && currentPlayer === WHITE)}
                                            className="relative bg-transparent border-none p-0 cursor-pointer disabled:cursor-not-allowed"
                                            style={{ width: cellSize, height: cellSize }}
                                        >
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="absolute w-full h-0.5 bg-black opacity-30"></div>
                                                <div className="absolute w-0.5 h-full bg-black opacity-30"></div>
                                            </div>

                                            {((size === 9 && ((r === 2 || r === 6) && (c === 2 || c === 6)) || (r === 4 && c === 4))) && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-black opacity-40"></div>
                                                    </div>
                                                )}

                                            {cell !== EMPTY && (
                                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                                    <div
                                                        className={`rounded-full shadow-lg ${cell === BLACK
                                                                ? "bg-gray-900 border-2 border-gray-700"
                                                                : "bg-white border-2 border-gray-200"
                                                            }`}
                                                        style={{ width: cellSize * 0.85, height: cellSize * 0.85 }}
                                                    ></div>
                                                </div>
                                            )}

                                            {!gameOver && cell === EMPTY && !isThinking && !(gameMode === "pvc" && currentPlayer === WHITE) && (
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-50 transition-opacity">
                                                    <div
                                                        className={`rounded-full ${currentPlayer === BLACK ? "bg-gray-900" : "bg-white"
                                                            }`}
                                                        style={{ width: cellSize * 0.7, height: cellSize * 0.7 }}
                                                    ></div>
                                                </div>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="mt-6 text-center text-gray-300 text-sm bg-gray-700 p-4 rounded-xl max-w-2xl">
                            <p className="mb-2">🎯 <strong>How to Play (Gomoku style):</strong></p>
                            <p className="mb-2">
                                Players alternate placing stones. First to make five in a row (horizontal, vertical, or diagonal) wins.
                            </p>
                            <p className="text-xs text-gray-400">
                                Black plays first • Stones stay once placed • You may pass, but passing twice ends the game as a draw
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
