import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';

// Single-file, dependency-free Minesweeper for React + Vite
// Save as: src/components/Minesweeper.jsx
// Features: difficulties, timer, flags, win/lose detection, mobile-friendly Flag Mode

function make2D(rows, cols, fn) {
    return Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => fn(r, c)));
}

function neighbors(r, c, rows, cols) {
    const dirs = [-1, 0, 1];
    const list = [];
    for (const dr of dirs) {
        for (const dc of dirs) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) list.push([nr, nc]);
        }
    }
    return list;
}

function createBoard(rows, cols, mines) {
    const total = rows * cols;
    const mineSet = new Set();
    // place mines randomly
    while (mineSet.size < Math.min(mines, total)) {
        mineSet.add(Math.floor(Math.random() * total));
    }

    const board = make2D(rows, cols, (r, c) => ({
        r,
        c,
        isMine: mineSet.has(r * cols + c),
        isRevealed: false,
        isFlagged: false,
        adjacent: 0,
    }));

    // compute adjacent counts
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].isMine) continue;
            let cnt = 0;
            for (const [nr, nc] of neighbors(r, c, rows, cols)) {
                if (board[nr][nc].isMine) cnt++;
            }
            board[r][c].adjacent = cnt;
        }
    }
    return board;
}

function useTimer(isRunning, resetKey) {
    const [secs, setSecs] = useState(0);
    useEffect(() => setSecs(0), [resetKey]);
    useEffect(() => {
        if (!isRunning) return;
        const id = setInterval(() => setSecs((s) => s + 1), 1000);
        return () => clearInterval(id);
    }, [isRunning, resetKey]);
    return secs;
}

const DIFFICULTIES = {
    Beginner: { rows: 9, cols: 9, mines: 10 },
    Intermediate: { rows: 16, cols: 16, mines: 40 },
    Expert: { rows: 16, cols: 30, mines: 99 },
};

export default function Minesweeper() {
    const navigate = useNavigate();
    const [difficulty, setDifficulty] = useState("Beginner");
    const [isMobile, setIsMobile] = useState(false);
    const cfg = DIFFICULTIES[difficulty];

    const [resetKey, setResetKey] = useState(0);
    const [board, setBoard] = useState(() => createBoard(cfg.rows, cfg.cols, cfg.mines));
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [flagMode, setFlagMode] = useState(false); // helpful on mobile
    const firstRevealRef = useRef(true);

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // recreate board when difficulty or reset changes
    useEffect(() => {
        setBoard(createBoard(cfg.rows, cfg.cols, cfg.mines));
        setGameOver(false);
        setWon(false);
        setFlagMode(false);
        firstRevealRef.current = true;
    }, [difficulty, resetKey]);

    const minesLeft = useMemo(() => {
        const flagged = board.flat().filter((c) => c.isFlagged).length;
        return Math.max(cfg.mines - flagged, 0);
    }, [board, cfg.mines]);

    const revealedCount = useMemo(() => board.flat().filter((c) => c.isRevealed).length, [board]);
    const totalSafe = cfg.rows * cfg.cols - cfg.mines;

    // Timer runs while game active
    const time = useTimer(!gameOver && !won && revealedCount > 0, resetKey + difficulty);

    function safeFirstClick(b, r, c) {
        // Ensure first clicked cell is not a mine and preferably zero-adjacent
        if (!b[r][c].isMine && b[r][c].adjacent === 0) return b;
        // regenerate until safe at (r,c)
        for (let tries = 0; tries < 200; tries++) {
            const fresh = createBoard(cfg.rows, cfg.cols, cfg.mines);
            if (!fresh[r][c].isMine) return fresh;
        }
        return b; // fallback
    }

    function floodReveal(b, r, c) {
        const rows = b.length;
        const cols = b[0].length;
        const stack = [[r, c]];
        const seen = new Set();
        while (stack.length) {
            const [cr, cc] = stack.pop();
            const key = cr + "," + cc;
            if (seen.has(key)) continue;
            seen.add(key);
            const cell = b[cr][cc];
            if (cell.isRevealed || cell.isFlagged) continue;
            cell.isRevealed = true;
            if (!cell.isMine && cell.adjacent === 0) {
                for (const [nr, nc] of neighbors(cr, cc, rows, cols)) stack.push([nr, nc]);
            }
        }
    }

    function reveal(r, c) {
        if (gameOver || won) return;
        setBoard((prev) => {
            let b = prev.map((row) => row.map((cell) => ({ ...cell })));

            if (firstRevealRef.current) {
                firstRevealRef.current = false;
                b = safeFirstClick(b, r, c);
            }

            const cell = b[r][c];
            if (cell.isRevealed || cell.isFlagged) return b;

            if (cell.isMine) {
                // reveal all mines
                for (const item of b.flat()) {
                    if (item.isMine) item.isRevealed = true;
                }
                setGameOver(true);
                return b;
            }

            floodReveal(b, r, c);

            const revealed = b.flat().filter((c) => c.isRevealed && !c.isMine).length;
            if (revealed === totalSafe) {
                // flag all remaining mines for satisfaction
                for (const item of b.flat()) if (item.isMine) item.isFlagged = true;
                setWon(true);
            }
            return b;
        });
    }

    function toggleFlag(r, c) {
        if (gameOver || won) return;
        setBoard((prev) => {
            const b = prev.map((row) => row.map((cell) => ({ ...cell })));
            const cell = b[r][c];
            if (cell.isRevealed) return b;
            cell.isFlagged = !cell.isFlagged;
            return b;
        });
    }

    function handleCellPointer(r, c) {
        if (flagMode) toggleFlag(r, c);
        else reveal(r, c);
    }

    function handleContextMenu(e, r, c) {
        e.preventDefault();
        toggleFlag(r, c);
    }

    function reset() {
        setResetKey((k) => k + 1);
    }

    const handleDifficultyChange = (e) => {
        const newDifficulty = e.target.value;
        if (isMobile && (newDifficulty === "Intermediate" || newDifficulty === "Expert")) {
            return; // Don't change difficulty on mobile for these levels
        }
        setDifficulty(newDifficulty);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">

            <main className="flex items-center justify-center p-6">
                <div className="game-board p-8 rounded-2xl fade-in max-w-5xl w-full transform transition-all duration-500 bg-gray-800 border border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-black">💣 Minesweeper</h1>
                        <div className="text-right">
                            <button
                                onClick={reset}
                                className="btn-secondary text-white px-3 py-1 rounded text-sm transform transition-all duration-200 hover:scale-105"
                                aria-label="Reset game"
                            >
                                🎮 Reset
                            </button>
                        </div>
                    </div>

                {/* Game Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                        <div className="text-xl font-bold text-blue-600 mb-1">💣</div>
                        <div className="text-xl font-semibold text-gray-700">{cfg.mines}</div>
                        <div className="text-xs text-gray-500">Mines</div>
                    </div>
                    <div className="text-center p-4 bg-red-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                        <div className="text-xl font-bold text-red-600 mb-1">🚩</div>
                        <div className="text-xl font-semibold text-gray-700">{board.flat().filter((c) => c.isFlagged).length}</div>
                        <div className="text-xs text-gray-500">Flags</div>
                    </div>
                    <div className="text-center p-4 bg-green-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                        <div className="text-xl font-bold text-green-600 mb-1">⏱️</div>
                        <div className="text-xl font-semibold text-gray-700">{time}s</div>
                        <div className="text-xs text-gray-500">Time</div>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    {/* Game Status */}
                    <h2 className="text-2xl font-bold mb-6 text-center transform transition-all duration-300">
                        {won ? (
                            <span className="text-green-600 animate-bounce-slow">🎉 You Win!</span>
                        ) : gameOver ? (
                            <span className="text-red-600 animate-pulse-slow">💥 Boom! Game Over</span>
                        ) : (
                            <span className="text-blue-600">
                                {revealedCount === 0 ? "🎯 Click any cell to start!" : "🕵️ Keep going!"}
                            </span>
                        )}
                    </h2>

                    {/* Game Controls */}
                    <div className="flex flex-wrap justify-center items-center gap-3 mb-6">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-gray-700">Difficulty:</label>
                            <select
                                className="border rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none bg-white text-black"
                                value={difficulty}
                                onChange={handleDifficultyChange}
                            >
                                {Object.keys(DIFFICULTIES).map((k) => (
                                    <option 
                                        key={k} 
                                        value={k}
                                        disabled={isMobile && (k === "Intermediate" || k === "Expert")}
                                    >
                                        {k}
                                        {isMobile && (k === "Intermediate" || k === "Expert") ? " (Desktop Only)" : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => setFlagMode((v) => !v)}
                            className={`px-4 py-2 rounded-lg border shadow-sm text-sm font-semibold transform transition-all duration-200 hover:scale-105 ${
                                flagMode 
                                    ? "bg-red-100 border-red-300 text-red-700" 
                                    : "bg-white hover:bg-gray-50 text-gray-700"
                            }`}
                            aria-pressed={flagMode}
                        >
                            {flagMode ? "🚩 Flag Mode ON" : "🚩 Flag Mode"}
                        </button>
                    </div>

                    {/* Mobile Difficulty Restriction Message */}
                    {isMobile && (difficulty === "Intermediate" || difficulty === "Expert") && (
                        <div className="mb-6 text-center bg-orange-50 p-4 rounded-xl border-2 border-orange-200">
                            <h3 className="text-lg font-bold text-orange-600 mb-2">📱 Mobile Limitation</h3>
                            <p className="text-sm text-gray-700">
                                This difficulty level is optimized for larger screens. Please use a desktop or laptop for the best experience with Intermediate and Expert levels.
                            </p>
                        </div>
                    )}

                    {/* Game Board */}
                    <div
                        className="inline-block rounded-2xl p-4 bg-gray-50 shadow-lg mb-6"
                        role="group"
                        aria-label="Minesweeper board"
                    >
                        <div
                            className="grid gap-1"
                            style={{ gridTemplateColumns: `repeat(${cfg.cols}, minmax(28px, 1fr))` }}
                        >
                            {board.map((row, r) =>
                                row.map((cell, c) => (
                                    <button
                                        key={`${r}-${c}`}
                                        onClick={() => handleCellPointer(r, c)}
                                        onContextMenu={(e) => handleContextMenu(e, r, c)}
                                        disabled={gameOver || won}
                                        aria-label={
                                            cell.isRevealed
                                                ? cell.isMine
                                                    ? "Mine"
                                                    : cell.adjacent === 0
                                                        ? "Empty"
                                                        : `${cell.adjacent} adjacent`
                                                : cell.isFlagged
                                                    ? "Flag"
                                                    : "Hidden"
                                        }
                                        className={
                                            "w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center font-semibold text-sm border " +
                                            "transition-all duration-200 rounded-md transform hover:scale-95 " +
                                            (cell.isRevealed
                                                ? "bg-white border-gray-300 shadow-sm"
                                                : "bg-gray-200 hover:bg-gray-300 active:bg-gray-400 border-gray-300")
                                        }
                                    >
                                        {cell.isRevealed ? (
                                            cell.isMine ? (
                                                <span role="img" aria-label="mine">💣</span>
                                            ) : cell.adjacent > 0 ? (
                                                <span className={adjacentColor(cell.adjacent)}>{cell.adjacent}</span>
                                            ) : (
                                                ""
                                            )
                                        ) : cell.isFlagged ? (
                                            <span role="img" aria-label="flag">🚩</span>
                                        ) : (
                                            ""
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mt-6 text-center text-gray-600 text-sm bg-gray-50 p-4 rounded-xl max-w-2xl">
                        <p className="mb-2">🎯 <strong>How to Play:</strong></p>
                        <p className="mb-2">Uncover all safe tiles without detonating a mine! Numbers show adjacent mines.</p>
                        <p className="text-xs text-gray-500">
                            Left click to reveal • Right click to flag • On mobile: toggle Flag Mode to place flags with a tap
                        </p>
                    </div>
                </div>
                </div>
            </main>
        </div>
    );
}

function adjacentColor(n) {
    // simple color mapping for numbers 1..8
    const map = {
        1: "text-blue-600",
        2: "text-green-600",
        3: "text-red-600",
        4: "text-indigo-700",
        5: "text-yellow-700",
        6: "text-teal-700",
        7: "text-fuchsia-700",
        8: "text-gray-700",
    };
    return map[n] || "";
}