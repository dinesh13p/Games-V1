import React, { useState, useEffect, useCallback, useRef } from "react";

/**
 * Improved Tetris React component
 * - DAS/ARR for smooth key holds
 * - Hold piece
 * - Better mobile touch handling (swipe/tap/double-tap)
 * - LocalStorage high score
 * - Clean UI with Next/Hold previews and responsive layout
 *
 * Drop-in replacement for your previous component.
 */

/* ---------- Config / Constants ---------- */
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 28; // pixels for canvas draw
const CANVAS_WIDTH = BOARD_WIDTH * CELL_SIZE;
const CANVAS_HEIGHT = BOARD_HEIGHT * CELL_SIZE;

const EMPTY = 0;

/* Timing controls — tune to taste */
const BASE_DROP = 800; // ms at level 1
const LEVEL_DROP_DECREMENT = 70; // ms per level up (capped)
const MIN_DROP = 80; // fastest drop cap

/* DAS / ARR (feel) */
const DAS_DELAY = 150; // ms before auto-repeat starts when holding left/right
const ARR_INTERVAL = 60; // ms between repeated moves after DAS

/* Soft drop modifier (accelerates drop and gives small points) */
const SOFT_DROP_INTERVAL = 50;
const SOFT_DROP_POINTS_PER_CELL = 1;

/* Hard drop points multiplier per distance */
const HARD_DROP_POINTS_PER_CELL = 2;

/* Pieces */
const PIECES = {
    I: {
        shape: [[1, 1, 1, 1]],
        color: "#00f5ff",
    },
    O: {
        shape: [
            [1, 1],
            [1, 1],
        ],
        color: "#f7e733",
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
        ],
        color: "#a57cff",
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
        ],
        color: "#48df57",
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
        ],
        color: "#ff6b6b",
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
        ],
        color: "#3b82f6",
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
        ],
        color: "#f59e0b",
    },
};

function randPiece() {
    const keys = Object.keys(PIECES);
    const t = keys[Math.floor(Math.random() * keys.length)];
    const p = { type: t, shape: PIECES[t].shape.map((r) => [...r]), color: PIECES[t].color };
    return p;
}

/* Rotation helper — rotate clockwise with simple kicks (try center, left, right) */
function rotateCW(piece) {
    const s = piece.shape;
    const w = s[0].length;
    const h = s.length;
    const rotated = Array.from({ length: w }, (_, r) => Array(h).fill(0));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (s[y][x]) rotated[x][h - 1 - y] = s[y][x];
    return { ...piece, shape: rotated };
}

/* Create empty board */
function emptyBoard() {
    return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(EMPTY));
}

/* Deep copy board */
function copyBoard(b) {
    return b.map((r) => [...r]);
}

/* Check collision */
function isValid(board, piece, px, py) {
    if (!piece) return false;
    const s = piece.shape;
    for (let y = 0; y < s.length; y++) {
        for (let x = 0; x < s[y].length; x++) {
            if (!s[y][x]) continue;
            const nx = px + x;
            const ny = py + y;
            if (nx < 0 || nx >= BOARD_WIDTH || ny >= BOARD_HEIGHT) return false;
            if (ny >= 0 && board[ny][nx]) return false;
        }
    }
    return true;
}

/* Place piece onto board (returns new board) */
function placePiece(board, piece, px, py) {
    const nb = copyBoard(board);
    const s = piece.shape;
    for (let y = 0; y < s.length; y++) {
        for (let x = 0; x < s[y].length; x++) {
            if (!s[y][x]) continue;
            const nx = px + x;
            const ny = py + y;
            if (ny >= 0 && ny < BOARD_HEIGHT) nb[ny][nx] = piece.color;
        }
    }
    return nb;
}

/* Clear full lines — return {board, cleared} */
function clearLines(board) {
    const newBoard = board.filter((row) => row.some((c) => !c));
    const cleared = BOARD_HEIGHT - newBoard.length;
    while (newBoard.length < BOARD_HEIGHT) newBoard.unshift(Array(BOARD_WIDTH).fill(EMPTY));
    return { board: newBoard, cleared };
}

/* Compute ghost drop Y */
function getGhostY(board, piece, px, py) {
    let gy = py;
    while (isValid(board, piece, px, gy + 1)) gy++;
    return gy;
}

/* Compute drop speed by level */
function dropTimeForLevel(level) {
    const dt = Math.max(MIN_DROP, BASE_DROP - (level - 1) * LEVEL_DROP_DECREMENT);
    return dt;
}

/* Save/load highscore */
const HS_KEY = "tetris_highscore_v1";
function loadHighScore() {
    const v = localStorage.getItem(HS_KEY);
    return v ? parseInt(v, 10) || 0 : 0;
}
function saveHighScore(v) {
    localStorage.setItem(HS_KEY, String(v || 0));
}

/* ---------- React Component ---------- */
export default function Tetris() {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    /* ---------- Game state refs (mutated directly for responsiveness) ---------- */
    const stateRef = useRef({
        board: emptyBoard(),
        current: null, // piece object
        px: 0,
        py: -2, // spawn slightly above
        next: null,
        hold: null,
        holdUsed: false, // one swap per drop
        score: 0,
        lines: 0,
        level: 1,
        dropTimer: dropTimeForLevel(1),
        lastDrop: performance.now(),
        lastSoftDrop: performance.now(),
    });

    /* ---------- React visible state ---------- */
    const [started, setStarted] = useState(false);
    const [paused, setPaused] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [lines, setLines] = useState(0);
    const [level, setLevel] = useState(1);
    const [highScore, setHighScore] = useState(loadHighScore());
    const [isMobile, setIsMobile] = useState(false);
    const [showControlsHint, setShowControlsHint] = useState(true);

    /* ---------- Input management for DAS/ARR ---------- */
    const keysHeld = useRef({ left: false, right: false, down: false });
    const dasTimer = useRef({ left: 0, right: 0 });
    const arrIntervalRef = useRef({ left: null, right: null });

    /* touch handling */
    const touchRef = useRef({
        startX: 0,
        startY: 0,
        startT: 0,
        lastTap: 0,
    });

    /* ---------- Helpers to sync state to React UI ---------- */
    const syncStateToUI = useCallback(() => {
        const s = stateRef.current;
        setScore(s.score);
        setLines(s.lines);
        setLevel(s.level);
    }, []);

    /* Initialize or reset game */
    const resetGameState = useCallback(() => {
        const s = stateRef.current;
        s.board = emptyBoard();
        s.current = randPiece();
        s.next = randPiece();
        s.hold = null;
        s.holdUsed = false;
        s.px = Math.floor((BOARD_WIDTH - s.current.shape[0].length) / 2);
        s.py = -2;
        s.score = 0;
        s.lines = 0;
        s.level = 1;
        s.dropTimer = dropTimeForLevel(1);
        s.lastDrop = performance.now();
        s.lastSoftDrop = performance.now();
        syncStateToUI();
        setGameOver(false);
    }, [syncStateToUI]);

    /* Spawn new piece (after piece placed) */
    const spawnNext = useCallback(() => {
        const s = stateRef.current;
        s.current = s.next || randPiece();
        s.next = randPiece();
        s.px = Math.floor((BOARD_WIDTH - s.current.shape[0].length) / 2);
        s.py = -2;
        s.holdUsed = false;
        // immediate loss check
        if (!isValid(s.board, s.current, s.px, s.py)) {
            // game over
            setGameOver(true);
            setStarted(false);
            const hs = Math.max(s.score, loadHighScore());
            setHighScore(hs);
            saveHighScore(hs);
        }
    }, []);

    /* Score/level update when lines cleared */
    const onLinesCleared = useCallback((count) => {
        if (!count) return;
        // Tetris scoring (classic): 1=40,2=100,3=300,4=1200 times level
        const lineScores = [0, 40, 100, 300, 1200];
        const s = stateRef.current;
        const points = lineScores[count] * s.level;
        s.score += points;
        s.lines += count;
        const newLevel = Math.floor(s.lines / 10) + 1;
        if (newLevel !== s.level) {
            s.level = newLevel;
            s.dropTimer = dropTimeForLevel(newLevel);
            // small visual hint (we update React state below)
        }
        // sync to UI
        syncStateToUI();
    }, [syncStateToUI]);

    /* Hard drop */
    const hardDrop = useCallback(() => {
        if (!started || paused || gameOver) return;
        const s = stateRef.current;
        const gy = getGhostY(s.board, s.current, s.px, s.py);
        const distance = gy - s.py;
        s.py = gy;
        // place and scoring
        s.board = placePiece(s.board, s.current, s.px, s.py);
        s.score += distance * HARD_DROP_POINTS_PER_CELL;
        const { board: nb, cleared } = clearLines(s.board);
        s.board = nb;
        if (cleared) onLinesCleared(cleared);
        spawnNext();
        syncStateToUI();
        s.lastDrop = performance.now();
    }, [started, paused, gameOver, spawnNext, onLinesCleared, syncStateToUI]);

    /* Soft drop (one step) */
    const softDropOne = useCallback(() => {
        if (!started || paused || gameOver) return false;
        const s = stateRef.current;
        if (isValid(s.board, s.current, s.px, s.py + 1)) {
            s.py++;
            s.score += SOFT_DROP_POINTS_PER_CELL;
            syncStateToUI();
            return true;
        } else {
            // place piece
            s.board = placePiece(s.board, s.current, s.px, s.py);
            const { board: nb, cleared } = clearLines(s.board);
            s.board = nb;
            if (cleared) onLinesCleared(cleared);
            spawnNext();
            s.lastDrop = performance.now();
            syncStateToUI();
            return false;
        }
    }, [started, paused, gameOver, spawnNext, onLinesCleared, syncStateToUI]);

    /* Move piece (left/right) with collision check */
    const tryMove = useCallback((dx) => {
        const s = stateRef.current;
        if (!s.current) return false;
        const nx = s.px + dx;
        if (isValid(s.board, s.current, nx, s.py)) {
            s.px = nx;
            return true;
        }
        return false;
    }, []);

    /* Rotate with simple kicks */
    const tryRotate = useCallback(() => {
        const s = stateRef.current;
        if (!s.current) return;
        const r = rotateCW(s.current);
        // try center
        if (isValid(s.board, r, s.px, s.py)) {
            s.current = r;
            return;
        }
        // try small kicks: left, right, up
        if (isValid(s.board, r, s.px - 1, s.py)) {
            s.px -= 1;
            s.current = r;
            return;
        }
        if (isValid(s.board, r, s.px + 1, s.py)) {
            s.px += 1;
            s.current = r;
            return;
        }
        if (isValid(s.board, r, s.px, s.py - 1)) {
            s.py -= 1;
            s.current = r;
            return;
        }
        // else rotation fails
    }, []);

    /* Hold piece */
    const holdPiece = useCallback(() => {
        if (!started || paused || gameOver) return;
        const s = stateRef.current;
        if (s.holdUsed) return; // only one hold per drop
        const current = s.current;
        if (!current) return;
        if (!s.hold) {
            s.hold = { ...current };
            spawnNext();
        } else {
            const temp = s.hold;
            s.hold = { ...current };
            s.current = { ...temp };
            s.px = Math.floor((BOARD_WIDTH - s.current.shape[0].length) / 2);
            s.py = -2;
            if (!isValid(s.board, s.current, s.px, s.py)) {
                setGameOver(true);
                setStarted(false);
                const hs = Math.max(s.score, loadHighScore());
                setHighScore(hs);
                saveHighScore(hs);
            }
        }
        s.holdUsed = true;
        syncStateToUI();
    }, [started, paused, gameOver, spawnNext, syncStateToUI]);

    /* ---------- Rendering (canvas) ---------- */
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const s = stateRef.current;

        // Clear
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // bg
        ctx.fillStyle = "#0b1220";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // draw board cells
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const val = s.board[y][x];
                if (val) {
                    ctx.fillStyle = val;
                    ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                    // subtle inner shadow
                    ctx.strokeStyle = "rgba(0,0,0,0.25)";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x * CELL_SIZE + 1.5, y * CELL_SIZE + 1.5, CELL_SIZE - 3, CELL_SIZE - 3);
                } else {
                    // empty cell subtle grid
                    ctx.fillStyle = "#06111a";
                    ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                }
            }
        }

        // ghost
        if (s.current) {
            const gy = getGhostY(s.board, s.current, s.px, s.py);
            ctx.globalAlpha = 0.28;
            ctx.fillStyle = s.current.color;
            for (let y = 0; y < s.current.shape.length; y++) {
                for (let x = 0; x < s.current.shape[0].length; x++) {
                    if (s.current.shape[y][x]) {
                        ctx.fillRect((s.px + x) * CELL_SIZE + 1, (gy + y) * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                    }
                }
            }
            ctx.globalAlpha = 1;
        }

        // current piece
        if (s.current) {
            for (let y = 0; y < s.current.shape.length; y++) {
                for (let x = 0; x < s.current.shape[0].length; x++) {
                    if (s.current.shape[y][x]) {
                        const fx = (s.px + x) * CELL_SIZE + 1;
                        const fy = (s.py + y) * CELL_SIZE + 1;
                        ctx.fillStyle = s.current.color;
                        ctx.fillRect(fx, fy, CELL_SIZE - 2, CELL_SIZE - 2);
                        // highlight edge
                        ctx.strokeStyle = "rgba(255,255,255,0.08)";
                        ctx.lineWidth = 1;
                        ctx.strokeRect(fx + 0.5, fy + 0.5, CELL_SIZE - 3, CELL_SIZE - 3);
                    }
                }
            }
        }

        // grid lines (subtle)
        ctx.strokeStyle = "rgba(255,255,255,0.03)";
        ctx.lineWidth = 1;
        for (let x = 1; x < BOARD_WIDTH; x++) {
            ctx.beginPath();
            ctx.moveTo(x * CELL_SIZE, 0);
            ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
            ctx.stroke();
        }
        for (let y = 1; y < BOARD_HEIGHT; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * CELL_SIZE);
            ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
            ctx.stroke();
        }
    }, []);

    /* ---------- Game loop (animation frame) ---------- */
    const lastFrameRef = useRef(performance.now());

    const gameLoop = useCallback(
        (now) => {
            rafRef.current = requestAnimationFrame(gameLoop);

            // mobile/resize redraw frequently
            renderCanvas();

            if (!started || paused || gameOver) {
                lastFrameRef.current = now;
                return;
            }

            const s = stateRef.current;

            // handle soft drop when key is held (rate-limited)
            if (keysHeld.current.down) {
                if (now - s.lastSoftDrop >= SOFT_DROP_INTERVAL) {
                    s.lastSoftDrop = now;
                    softDropOne();
                }
            }

            // auto-drop
            if (now - s.lastDrop >= s.dropTimer) {
                // try move down; if can't, lock piece
                if (isValid(s.board, s.current, s.px, s.py + 1)) {
                    s.py++;
                } else {
                    // lock
                    s.board = placePiece(s.board, s.current, s.px, s.py);
                    const { board: nb, cleared } = clearLines(s.board);
                    s.board = nb;
                    if (cleared) onLinesCleared(cleared);
                    spawnNext();
                }
                s.lastDrop = now;
                syncStateToUI();
            }

            // manage DAS/ARR: handled via timers in keydown/keyup handlers (we still keep loop for completeness)
        },
        [started, paused, gameOver, renderCanvas, softDropOne, onLinesCleared, spawnNext, syncStateToUI]
    );

    /* ---------- Start / Restart ---------- */
    const startGame = useCallback(() => {
        resetGameState();
        setStarted(true);
        setPaused(false);
        setGameOver(false);
        // set local UI states
        setScore(0);
        setLines(0);
        setLevel(1);
        // start loop
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(gameLoop);
    }, [resetGameState, gameLoop]);

    const restartGame = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        startGame();
    }, [startGame]);

    /* ---------- Input Handlers (keyboard) ---------- */
    useEffect(() => {
        function onKeyDown(e) {
            // start with space/enter
            if (!started && (e.code === "Space" || e.key === "Enter")) {
                e.preventDefault();
                startGame();
                return;
            }
            if (gameOver && (e.code === "Space" || e.key === "Enter")) {
                e.preventDefault();
                restartGame();
                return;
            }
            if (!started || gameOver) return;

            // pause/resume
            if (e.key === "p" || e.key === "P") {
                setPaused((p) => !p);
                return;
            }

            // left/right/down hold logic, with DAS
            if (["ArrowLeft", "a", "A"].includes(e.key)) {
                e.preventDefault();
                if (keysHeld.current.left) return; // already held
                keysHeld.current.left = true;
                dasTimer.current.left = performance.now();
                // immediate move
                const moved = tryMove(-1);
                if (moved) syncStateToUI();
                // start ARR after DAS
                arrIntervalRef.current.left = setTimeout(() => {
                    arrIntervalRef.current.left = setInterval(() => {
                        const moved2 = tryMove(-1);
                        if (moved2) syncStateToUI();
                    }, ARR_INTERVAL);
                }, DAS_DELAY);
                return;
            }

            if (["ArrowRight", "d", "D"].includes(e.key)) {
                e.preventDefault();
                if (keysHeld.current.right) return;
                keysHeld.current.right = true;
                dasTimer.current.right = performance.now();
                const moved = tryMove(1);
                if (moved) syncStateToUI();
                arrIntervalRef.current.right = setTimeout(() => {
                    arrIntervalRef.current.right = setInterval(() => {
                        const moved2 = tryMove(1);
                        if (moved2) syncStateToUI();
                    }, ARR_INTERVAL);
                }, DAS_DELAY);
                return;
            }

            if (["ArrowDown", "s", "S"].includes(e.key)) {
                e.preventDefault();
                if (keysHeld.current.down) return;
                keysHeld.current.down = true;
                // immediate soft drop one
                softDropOne();
                return;
            }

            if (["ArrowUp", "w", "W"].includes(e.key)) {
                e.preventDefault();
                tryRotate();
                syncStateToUI();
                return;
            }

            if (e.code === "Space") {
                e.preventDefault();
                hardDrop();
                syncStateToUI();
                return;
            }

            if (e.key === "c" || e.key === "C") {
                e.preventDefault();
                holdPiece();
                syncStateToUI();
                return;
            }
        }

        function onKeyUp(e) {
            if (["ArrowLeft", "a", "A"].includes(e.key)) {
                keysHeld.current.left = false;
                if (arrIntervalRef.current.left) {
                    clearInterval(arrIntervalRef.current.left);
                    arrIntervalRef.current.left = null;
                }
            }
            if (["ArrowRight", "d", "D"].includes(e.key)) {
                keysHeld.current.right = false;
                if (arrIntervalRef.current.right) {
                    clearInterval(arrIntervalRef.current.right);
                    arrIntervalRef.current.right = null;
                }
            }
            if (["ArrowDown", "s", "S"].includes(e.key)) {
                keysHeld.current.down = false;
            }
        }

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            // clear intervals
            if (arrIntervalRef.current.left) clearInterval(arrIntervalRef.current.left);
            if (arrIntervalRef.current.right) clearInterval(arrIntervalRef.current.right);
        };
    }, [started, gameOver, tryMove, softDropOne, tryRotate, hardDrop, holdPiece, restartGame, syncStateToUI]);

    /* ---------- Touch controls (mobile) ---------- */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        function onTouchStart(e) {
            if (!e.touches || !e.touches[0]) return;
            const t = e.touches[0];
            touchRef.current.startX = t.clientX;
            touchRef.current.startY = t.clientY;
            touchRef.current.startT = performance.now();
        }

        function onTouchMove(e) {
            // prevent scroll while playing
            if (started && !paused) e.preventDefault();
        }

        function onTouchEnd(e) {
            const now = performance.now();
            const deltaX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX - touchRef.current.startX : 0;
            const deltaY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY - touchRef.current.startY : 0;
            const dt = now - touchRef.current.startT;

            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            // double tap detection (hard drop)
            if (now - touchRef.current.lastTap < 300) {
                // double-tap
                hardDrop();
                touchRef.current.lastTap = 0;
                return;
            }

            // swipes
            if (absX > 30 && absX > absY) {
                if (deltaX > 0) {
                    // swipe right
                    tryMove(1);
                    syncStateToUI();
                } else {
                    // swipe left
                    tryMove(-1);
                    syncStateToUI();
                }
                touchRef.current.lastTap = now;
                return;
            }

            if (absY > 30 && absY > absX) {
                if (deltaY > 0) {
                    // swipe down -> soft drop (or fast drop if long swipe)
                    softDropOne();
                    syncStateToUI();
                } else {
                    // swipe up -> rotate
                    tryRotate();
                    syncStateToUI();
                }
                touchRef.current.lastTap = now;
                return;
            }

            // tap -> rotate
            tryRotate();
            syncStateToUI();
            touchRef.current.lastTap = now;
        }

        canvas.addEventListener("touchstart", onTouchStart, { passive: false });
        canvas.addEventListener("touchmove", onTouchMove, { passive: false });
        canvas.addEventListener("touchend", onTouchEnd, { passive: false });

        return () => {
            canvas.removeEventListener("touchstart", onTouchStart);
            canvas.removeEventListener("touchmove", onTouchMove);
            canvas.removeEventListener("touchend", onTouchEnd);
        };
    }, [started, paused, tryMove, tryRotate, softDropOne, hardDrop, syncStateToUI]);

    /* ---------- Resize & mobile detection ---------- */
    useEffect(() => {
        function onResize() {
            setIsMobile(window.innerWidth < 768);
        }
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    /* ---------- Start animation loop once mounted ---------- */
    useEffect(() => {
        // initial render
        renderCanvas();
        rafRef.current = requestAnimationFrame(gameLoop);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [gameLoop, renderCanvas]);

    /* ---------- Sync visible score/level on mount ---------- */
    useEffect(() => {
        syncStateToUI();
    }, [syncStateToUI]);

    /* ---------- UI Helper: small preview grid JSX ---------- */
    const PiecePreview = ({ piece }) => {
        if (!piece) return <div className="text-xs text-gray-400">—</div>;
        const w = piece.shape[0].length;
        const h = piece.shape.length;
        return (
            <div
                className="inline-grid gap-0"
                style={{
                    gridTemplateColumns: `repeat(${w}, ${CELL_SIZE / 2}px)`,
                    gridTemplateRows: `repeat(${h}, ${CELL_SIZE / 2}px)`,
                }}
            >
                {piece.shape.map((row, ry) =>
                    row.map((cell, rx) => (
                        <div
                            key={`${rx}-${ry}`}
                            style={{
                                width: CELL_SIZE / 2,
                                height: CELL_SIZE / 2,
                                background: cell ? piece.color : "transparent",
                                border: cell ? "1px solid rgba(0,0,0,0.15)" : "1px dashed rgba(255,255,255,0.03)",
                                boxSizing: "border-box",
                            }}
                        />
                    ))
                )}
            </div>
        );
    };

    /* ---------- Control bar handlers (buttons) ---------- */
    const onBtnLeft = () => {
        tryMove(-1);
        syncStateToUI();
    };
    const onBtnRight = () => {
        tryMove(1);
        syncStateToUI();
    };
    const onBtnRotate = () => {
        tryRotate();
        syncStateToUI();
    };
    const onBtnDown = () => {
        softDropOne();
        syncStateToUI();
    };
    const onBtnDrop = () => {
        hardDrop();
        syncStateToUI();
    };
    const onBtnHold = () => {
        holdPiece();
        syncStateToUI();
    };

    /* Toggle hints visibility */
    useEffect(() => {
        const t = setTimeout(() => setShowControlsHint(false), 5000);
        return () => clearTimeout(t);
    }, []);

    /* ---------- Rendering component ---------- */
    const s = stateRef.current;

    return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
            <div className="w-full max-w-5xl">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 md:p-6 shadow-2xl">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">🧩 Tetris — Smooth Controls</h1>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    saveHighScore(0);
                                    setHighScore(0);
                                }}
                                className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-md text-sm"
                                title="Reset high score"
                            >
                                Reset HS
                            </button>
                            <div className="text-right text-sm">
                                <div className="text-xs text-slate-300">High Score</div>
                                <div className="text-base font-semibold">{highScore.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Left: Info & Next/Hold */}
                        <div className="order-2 lg:order-1 flex flex-col gap-4">
                            <div className="bg-slate-700 p-3 rounded-lg text-center">
                                <div className="text-xs text-slate-300">Score</div>
                                <div className="text-2xl font-bold">{score.toLocaleString()}</div>
                            </div>

                            <div className="bg-slate-700 p-3 rounded-lg text-center">
                                <div className="text-xs text-slate-300">Level</div>
                                <div className="text-xl font-bold">{level}</div>
                            </div>

                            <div className="bg-slate-700 p-3 rounded-lg text-center">
                                <div className="text-xs text-slate-300">Lines</div>
                                <div className="text-xl font-bold">{lines}</div>
                            </div>

                            <div className="bg-slate-700 p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs text-slate-300">Next</div>
                                    <div className="text-xs text-slate-300">Hold</div>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="bg-black p-2 rounded-md border border-slate-600">
                                        <PiecePreview piece={s.next} />
                                    </div>
                                    <div className="bg-black p-2 rounded-md border border-slate-600">
                                        <PiecePreview piece={s.hold} />
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <button onClick={() => startGame()} className="flex-1 bg-emerald-500 hover:bg-emerald-600 px-3 py-2 rounded-md font-semibold">
                                        {started && !gameOver ? "Playing" : "Start"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setPaused((p) => !p);
                                        }}
                                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 px-3 py-2 rounded-md font-semibold"
                                    >
                                        {paused ? "Resume" : "Pause"}
                                    </button>
                                </div>

                                <div className="mt-3 flex gap-2">
                                    <button onClick={() => restartGame()} className="flex-1 bg-red-500 hover:bg-red-600 px-3 py-2 rounded-md font-semibold">
                                        Reset
                                    </button>
                                    <button onClick={() => onBtnHold()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-md font-semibold">
                                        Hold
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Center: Game canvas */}
                        <div className="order-1 lg:order-2 flex flex-col items-center">
                            <div className="relative">
                                <canvas
                                    ref={canvasRef}
                                    width={CANVAS_WIDTH}
                                    height={CANVAS_HEIGHT}
                                    style={{
                                        imageRendering: "pixelated",
                                        width: Math.min(480, CANVAS_WIDTH),
                                        height: Math.min(880, CANVAS_HEIGHT),
                                        borderRadius: 12,
                                    }}
                                    className="shadow-lg border-2 border-slate-700 bg-black"
                                />
                                {/* Overlays */}
                                {!started && !gameOver && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center text-slate-200 bg-black/60 p-4 rounded-md">
                                            <div className="text-lg font-bold mb-1">Ready</div>
                                            <div className="text-sm">Press Space or Tap to Start</div>
                                        </div>
                                    </div>
                                )}
                                {gameOver && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center p-4 bg-black/80 rounded-md">
                                            <div className="text-2xl font-bold text-red-400 mb-2">Game Over</div>
                                            <div className="text-sm mb-2">Score: {score.toLocaleString()}</div>
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={() => restartGame()} className="bg-emerald-500 px-3 py-2 rounded-md">
                                                    Play Again
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        saveHighScore(Math.max(score, loadHighScore()));
                                                        setHighScore(loadHighScore());
                                                    }}
                                                    className="bg-slate-700 px-3 py-2 rounded-md"
                                                >
                                                    Save HS
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {paused && !gameOver && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center p-3 bg-black/70 rounded-md">
                                            <div className="text-xl font-bold">Paused</div>
                                            <div className="text-sm">Press P to resume</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile dedicated controls */}
                            <div className="mt-4 w-full lg:hidden">
                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={onBtnLeft} className="bg-slate-600 p-3 rounded-lg">
                                        ⬅
                                    </button>
                                    <button onClick={onBtnRotate} className="bg-slate-600 p-3 rounded-lg">
                                        🔁
                                    </button>
                                    <button onClick={onBtnRight} className="bg-slate-600 p-3 rounded-lg">
                                        ➡
                                    </button>

                                    <button onClick={onBtnDown} className="bg-amber-600 p-3 rounded-lg">
                                        ⬇
                                    </button>
                                    <button onClick={onBtnDrop} className="bg-rose-500 p-3 rounded-lg col-span-2">
                                        ⚡ Drop
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right: Controls & Hints */}
                        <div className="order-3 lg:order-3 flex flex-col gap-4">
                            <div className="bg-slate-700 p-3 rounded-lg">
                                <div className="text-xs text-slate-300 mb-2">Controls</div>
                                <div className="text-sm mb-1">Desktop: ← → move, ↑ rotate, ↓ soft drop, SPACE hard drop, C hold, P pause</div>
                                <div className="text-sm">Mobile: Tap to rotate, swipe to move, double-tap to hard drop</div>
                                {showControlsHint && <div className="mt-2 text-xs text-amber-300">Hint: hold ←/→ for continuous movement (DAS)</div>}
                            </div>

                            <div className="bg-slate-700 p-3 rounded-lg text-center">
                                <div className="text-xs text-slate-300 mb-1">Progress</div>
                                <div className="w-full bg-black h-3 rounded-full overflow-hidden border border-slate-600">
                                    <div
                                        style={{
                                            width: `${(lines % 10) * 10}%`,
                                            height: "100%",
                                            background: "linear-gradient(90deg,#06b6d4,#7c3aed)",
                                            transition: "width 300ms linear",
                                        }}
                                    />
                                </div>
                                <div className="mt-2 text-xs">Next level in {10 - (lines % 10)} lines</div>
                            </div>

                            <div className="bg-slate-700 p-3 rounded-lg">
                                <div className="text-xs text-slate-300 mb-2">Accessibility</div>
                                <div className="text-sm">Canvas uses high-contrast colors and larger cells for visibility</div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop control shortcuts row */}
                    <div className="mt-4 hidden lg:flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <button onClick={onBtnLeft} className="bg-slate-600 px-3 py-2 rounded-md">
                                ←
                            </button>
                            <button onClick={onBtnRotate} className="bg-slate-600 px-3 py-2 rounded-md">
                                Rotate
                            </button>
                            <button onClick={onBtnRight} className="bg-slate-600 px-3 py-2 rounded-md">
                                →
                            </button>
                            <button onClick={onBtnDown} className="bg-amber-600 px-3 py-2 rounded-md">
                                Soft
                            </button>
                            <button onClick={onBtnDrop} className="bg-rose-500 px-3 py-2 rounded-md">
                                Hard
                            </button>
                        </div>

                        <div className="text-sm text-slate-300">Press Space to Start / Drop — Hold arrows to move</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
