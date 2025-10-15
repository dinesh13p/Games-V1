import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * SnakeGameEnhanced
 * - Canvas rendering for smooth visuals (rounded, glowing snake)
 * - rAF game loop with accumulator for consistent movement timing
 * - Keyboard & touch controls, vibration support
 * - Responsive layout, animated overlays, Tailwind-friendly classes
 *
 * Silent (no audio). Uses localStorage key: snake_highscore_v2
 */

const BOARD_SIZE = 20;
const BASE_SPEED_MS = 140; // move every 140ms (lower = faster)
const CELL_SIZE_DESKTOP = 20;
const CELL_SIZE_MOBILE = 14;
const HS_KEY = "snake_highscore_v2";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function randFood(snake) {
    while (true) {
        const r = Math.floor(Math.random() * BOARD_SIZE);
        const c = Math.floor(Math.random() * BOARD_SIZE);
        if (!snake.some(([sr, sc]) => sr === r && sc === c)) return [r, c];
    }
}

export default function SnakeGameEnhanced() {
    // visual / UI state
    const [isMobile, setIsMobile] = useState(false);
    const [cellSize, setCellSize] = useState(CELL_SIZE_DESKTOP);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        try {
            return parseInt(localStorage.getItem(HS_KEY)) || 0;
        } catch {
            return 0;
        }
    });
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [paused, setPaused] = useState(false);
    const [showHints, setShowHints] = useState(true);
    const [speedFactor, setSpeedFactor] = useState(1); // 1 normal, >1 faster

    // refs for game state (mutated directly)
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const lastTimeRef = useRef(0);
    const accumulatorRef = useRef(0);
    const moveIntervalRef = useRef(BASE_SPEED_MS);
    const directionRef = useRef([0, 1]); // [dr, dc] initial move right (row, col)
    const nextDirectionRef = useRef([0, 1]);
    const directionChangedRef = useRef(false);
    const snakeRef = useRef([[10, 10], [10, 9], [10, 8]]); // head first
    const foodRef = useRef(randFood(snakeRef.current));
    const pendingGrowRef = useRef(0);
    const vibrateOnRef = useRef(true); // optional vibration support
    const touchStartRef = useRef({ x: 0, y: 0, t: 0 });
    const hintTimeoutRef = useRef(null);
    const newHighJustSetRef = useRef(false);

    // responsive sizing
    useEffect(() => {
        const onResize = () => {
            const mobile = window.innerWidth <= 768 || "ontouchstart" in window;
            setIsMobile(mobile);
            setCellSize(mobile ? CELL_SIZE_MOBILE : CELL_SIZE_DESKTOP);
        };
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // helper: save highscore
    const saveHighScore = useCallback((v) => {
        try {
            localStorage.setItem(HS_KEY, String(v));
        } catch { }
        setHighScore(v);
    }, []);

    // reset/hard restart
    const resetGame = useCallback(() => {
        snakeRef.current = [[10, 10], [10, 9], [10, 8]];
        directionRef.current = [0, 1];
        nextDirectionRef.current = [0, 1];
        directionChangedRef.current = false;
        foodRef.current = randFood(snakeRef.current);
        pendingGrowRef.current = 0;
        setScore(0);
        setGameOver(false);
        setPaused(false);
        setGameStarted(false);
        moveIntervalRef.current = BASE_SPEED_MS;
        newHighJustSetRef.current = false;
    }, []);

    useEffect(() => resetGame(), [resetGame]);

    // input: keyboard
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === " " || e.code === "Space") {
                e.preventDefault();
                if (!gameStarted) {
                    setGameStarted(true);
                    setGameOver(false);
                    lastTimeRef.current = performance.now();
                    accumulatorRef.current = 0;
                } else if (gameOver) {
                    resetGame();
                    setGameStarted(true);
                    lastTimeRef.current = performance.now();
                    accumulatorRef.current = 0;
                } else {
                    // pause toggle
                    setPaused((p) => !p);
                }
                return;
            }

            if (!gameStarted || gameOver || paused) return;

            // smooth keyboard responsiveness: immediate dir set to nextDirectionRef but guard reversal
            const keyMap = {
                ArrowUp: [-1, 0],
                w: [-1, 0],
                W: [-1, 0],
                ArrowDown: [1, 0],
                s: [1, 0],
                S: [1, 0],
                ArrowLeft: [0, -1],
                a: [0, -1],
                A: [0, -1],
                ArrowRight: [0, 1],
                d: [0, 1],
                D: [0, 1],
            };
            const nd = keyMap[e.key];
            if (!nd) return;
            e.preventDefault();
            // prevent reversing direction directly
            const [cr, cc] = directionRef.current;
            if (nd[0] === -cr && nd[1] === -cc) return;
            if (!directionChangedRef.current) {
                nextDirectionRef.current = nd;
                directionChangedRef.current = true;
            } else {
                // if already changed this tick, queue the input (simple behavior: allow override)
                nextDirectionRef.current = nd;
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [gameStarted, gameOver, paused, resetGame]);

    // touch (swipe/tap) handling for mobile
    useEffect(() => {
        const el = canvasRef.current;
        if (!el) return;
        function onTouchStart(e) {
            if (!e.touches[0]) return;
            const t = e.touches[0];
            touchStartRef.current = { x: t.clientX, y: t.clientY, t: performance.now() };
        }
        function onTouchEnd(e) {
            const now = performance.now();
            const start = touchStartRef.current;
            if (!start) return;
            const touch = (e.changedTouches && e.changedTouches[0]) || {};
            const dx = (touch.clientX || 0) - start.x;
            const dy = (touch.clientY || 0) - start.y;
            const adx = Math.abs(dx);
            const ady = Math.abs(dy);
            const dt = now - start.t;

            // quick tap: rotate (small movement)
            if (dt < 250 && adx < 12 && ady < 12) {
                // rotate simulated as quick right-turn: up->right->down->left
                // implement rotation as turning right relative to current direction
                const [dr, dc] = directionRef.current;
                const nd = [-dc, dr]; // rotate right 90deg
                const [cr, cc] = directionRef.current;
                if (!(nd[0] === -cr && nd[1] === -cc)) nextDirectionRef.current = nd;
                directionChangedRef.current = true;
                return;
            }

            // swipe detection
            if (adx > ady) {
                if (dx > 0) {
                    // right
                    const nd = [0, 1];
                    const [cr, cc] = directionRef.current;
                    if (!(nd[0] === -cr && nd[1] === -cc)) nextDirectionRef.current = nd;
                } else {
                    // left
                    const nd = [0, -1];
                    const [cr, cc] = directionRef.current;
                    if (!(nd[0] === -cr && nd[1] === -cc)) nextDirectionRef.current = nd;
                }
            } else {
                if (dy > 0) {
                    // down
                    const nd = [1, 0];
                    const [cr, cc] = directionRef.current;
                    if (!(nd[0] === -cr && nd[1] === -cc)) nextDirectionRef.current = nd;
                } else {
                    // up
                    const nd = [-1, 0];
                    const [cr, cc] = directionRef.current;
                    if (!(nd[0] === -cr && nd[1] === -cc)) nextDirectionRef.current = nd;
                }
            }
            directionChangedRef.current = true;
        }

        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("touchend", onTouchEnd, { passive: true });
        return () => {
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchend", onTouchEnd);
        };
    }, [gameStarted, gameOver, paused]);

    // game step: move snake by one cell; lock collision and growth
    const step = useCallback(() => {
        const dir = directionRef.current = nextDirectionRef.current;
        directionChangedRef.current = false;
        const snake = snakeRef.current;
        const head = snake[0];
        const newHead = [head[0] + dir[0], head[1] + dir[1]];

        // wall collision -> game over
        if (newHead[0] < 0 || newHead[1] < 0 || newHead[0] >= BOARD_SIZE || newHead[1] >= BOARD_SIZE) {
            setGameOver(true);
            setGameStarted(false);
            // high score handling
            if (score > highScore) {
                saveHighScore(score);
                newHighJustSetRef.current = true;
                // small vibration on mobile
                if (vibrateOnRef.current && navigator.vibrate) navigator.vibrate(120);
            }
            return;
        }

        // self collision
        if (snake.some(([r, c]) => r === newHead[0] && c === newHead[1])) {
            setGameOver(true);
            setGameStarted(false);
            if (score > highScore) {
                saveHighScore(score);
                newHighJustSetRef.current = true;
                if (vibrateOnRef.current && navigator.vibrate) navigator.vibrate(120);
            }
            return;
        }

        snake.unshift(newHead);

        // food?
        const food = foodRef.current;
        if (newHead[0] === food[0] && newHead[1] === food[1]) {
            // grow and respawn food
            pendingGrowRef.current += 1;
            foodRef.current = randFood(snake);
            setScore((s) => {
                const ns = s + 10;
                if (navigator.vibrate && vibrateOnRef.current) navigator.vibrate(30);
                if (ns > highScore) {
                    saveHighScore(ns);
                    newHighJustSetRef.current = true;
                }
                return ns;
            });
            // slightly speed up
            moveIntervalRef.current = clamp(moveIntervalRef.current - 3, 60, BASE_SPEED_MS);
        } else {
            if (pendingGrowRef.current > 0) {
                pendingGrowRef.current--;
            } else {
                snake.pop();
            }
        }
        snakeRef.current = snake;
    }, [score, highScore, saveHighScore]);

    // main loop via rAF + accumulator (reduces input lag compared to setInterval)
    useEffect(() => {
        function loop(now) {
            rafRef.current = requestAnimationFrame(loop);
            if (!lastTimeRef.current) lastTimeRef.current = now;
            const dt = now - lastTimeRef.current;
            lastTimeRef.current = now;

            // render every frame
            renderFrame();

            if (!gameStarted || paused || gameOver) return;

            // accumulate time scaled by speedFactor
            accumulatorRef.current += dt * speedFactor;
            const interval = moveIntervalRef.current;
            if (accumulatorRef.current >= interval) {
                // consume steps (could consume multiple if lag)
                const steps = Math.floor(accumulatorRef.current / interval);
                accumulatorRef.current -= steps * interval;
                for (let i = 0; i < steps; i++) {
                    step();
                    // after step, reset direction change toggle to allow next inputs
                    directionChangedRef.current = false;
                    if (gameOver) break;
                }
            }
        }
        rafRef.current = requestAnimationFrame(loop);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameStarted, paused, gameOver, step, speedFactor]);

    // drawing to canvas
    const renderFrame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const size = cellSize * BOARD_SIZE;
        // HiDPI support
        const scale = window.devicePixelRatio || 1;
        if (canvas.width !== size * scale || canvas.height !== size * scale) {
            canvas.width = size * scale;
            canvas.height = size * scale;
            canvas.style.width = `${size}px`;
            canvas.style.height = `${size}px`;
        }
        ctx.setTransform(scale, 0, 0, scale, 0, 0);

        // Background gradient animated (subtle)
        const g = ctx.createLinearGradient(0, 0, size, size);
        g.addColorStop(0, "#081226");
        g.addColorStop(0.4, "#081226");
        g.addColorStop(1, "#0b0f1a");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);

        // Soft glowing highlight corners (animated by time)
        const t = performance.now() * 0.0006;
        ctx.globalAlpha = 0.06;
        const lg = ctx.createRadialGradient(size * 0.2 + Math.cos(t) * 40, size * 0.2 + Math.sin(t) * 20, 0, size * 0.2, size * 0.2, size * 0.9);
        lg.addColorStop(0, "#5eead4");
        lg.addColorStop(1, "transparent");
        ctx.fillStyle = lg;
        ctx.fillRect(0, 0, size, size);

        // draw grid background (subtle)
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#07121a";
        ctx.fillRect(0, 0, size, size);

        // draw food with glow
        const food = foodRef.current;
        const fx = food[1] * cellSize;
        const fy = food[0] * cellSize;
        ctx.save();
        ctx.shadowColor = "#ff6b6b";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#ff7a7a";
        roundRectFill(ctx, fx + 2, fy + 2, cellSize - 4, cellSize - 4, cellSize * 0.18);
        ctx.restore();

        // draw snake segments with glow and rounded corners
        const snake = snakeRef.current;
        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = "#34d399"; // neon green glow
        for (let i = snake.length - 1; i >= 0; i--) {
            const [r, c] = snake[i];
            const x = c * cellSize;
            const y = r * cellSize;
            // head is brighter
            if (i === 0) {
                ctx.fillStyle = "#86efac"; // head lighter
                roundRectFill(ctx, x + 1, y + 1, cellSize - 2, cellSize - 2, cellSize * 0.28);
                // small inner highlight
                ctx.fillStyle = "rgba(255,255,255,0.06)";
                roundRectFill(ctx, x + 1 + 3, y + 1 + 3, cellSize - 8, cellSize - 8, cellSize * 0.22);
            } else {
                ctx.fillStyle = "#10b981";
                roundRectFill(ctx, x + 1, y + 1, cellSize - 2, cellSize - 2, cellSize * 0.22);
            }
        }
        ctx.restore();

        // subtle border
        ctx.strokeStyle = "rgba(255,255,255,0.03)";
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, size - 1, size - 1);

        // score overlay corner (drawn here for crispness)
        if (newHighJustSetRef.current) {
            // small pulsing highlight - handled in DOM too
        }
    }, [cellSize]);

    // helper to draw rounded rect fill
    function roundRectFill(ctx, x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
        ctx.fill();
    }

    // small UI timers: hide hints after a few seconds
    useEffect(() => {
        if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = setTimeout(() => setShowHints(false), 4500);
        return () => clearTimeout(hintTimeoutRef.current);
    }, [gameStarted]);

    // small vibration toggle
    const toggleVibration = () => {
        vibrateOnRef.current = !vibrateOnRef.current;
        if (vibrateOnRef.current && navigator.vibrate) navigator.vibrate(20);
    };

    // mobile on-screen control handlers
    const mobilePress = (dir) => {
        if (!gameStarted || paused || gameOver) return;
        const mapping = {
            up: [-1, 0],
            down: [1, 0],
            left: [0, -1],
            right: [0, 1],
            rot: null,
        };
        const nd = mapping[dir];
        if (dir === "rot") {
            // rotate right: turn right
            const [dr, dc] = directionRef.current;
            const nd2 = [-dc, dr];
            if (!(nd2[0] === -dr && nd2[1] === -dc)) nextDirectionRef.current = nd2;
        } else {
            const [cr, cc] = directionRef.current;
            if (!(nd[0] === -cr && nd[1] === -cc)) nextDirectionRef.current = nd;
        }
        directionChangedRef.current = true;
        if (vibrateOnRef.current && navigator.vibrate) navigator.vibrate(20);
    };

    // small UI reactions for new highscore highlight
    useEffect(() => {
        if (score > highScore) {
            setHighScore(score);
            newHighJustSetRef.current = true;
            const id = setTimeout(() => (newHighJustSetRef.current = false), 1400);
            return () => clearTimeout(id);
        }
    }, [score, highScore]);

    // toggle pause via button
    const togglePause = () => {
        if (!gameStarted) return;
        setPaused((p) => !p);
    };

    // start button handler
    const onStart = () => {
        if (!gameStarted) {
            setGameStarted(true);
            setPaused(false);
            lastTimeRef.current = performance.now();
            accumulatorRef.current = 0;
        }
        if (gameOver) {
            resetGame();
            setGameStarted(true);
        }
    };

    // restart handler
    const onRestart = () => {
        resetGame();
        setGameStarted(true);
        lastTimeRef.current = performance.now();
        accumulatorRef.current = 0;
    };

    // UI JSX
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#071226] via-[#0b1226] to-[#120b1f] p-6">
            <div className="w-full max-w-5xl">
                <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-3xl p-5 md:p-8 shadow-2xl backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">🐍 Snake Game</h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className={`text-xs text-slate-300`}>Score</div>
                                <div className={`text-2xl font-bold ${newHighJustSetRef.current ? "text-emerald-300 animate-pulse" : "text-white"}`}>
                                    {score}
                                </div>
                                <div className="text-xs text-slate-400">High: {highScore}</div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        saveHighScore(0);
                                        setHighScore(0);
                                    }}
                                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm text-slate-200 transition-transform active:scale-95"
                                    title="Reset high score"
                                >
                                    Reset HS
                                </button>
                                <button
                                    onClick={toggleVibration}
                                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm text-slate-200 transition-transform active:scale-95"
                                    title="Toggle vibration"
                                >
                                    {vibrateOnRef.current ? "Vib: On" : "Vib: Off"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[auto,1fr,auto] gap-6 items-start">
                        {/* Left controls / hints */}
                        <div className="hidden md:flex flex-col gap-4">

                            <div className="bg-[rgba(255,255,255,0.02)] p-3 rounded-xl border border-[rgba(255,255,255,0.03)]">
                                <div className="text-xs text-slate-300">Speed</div>
                                <div className="mt-2 flex items-center gap-2">
                                    <button
                                        onClick={() => setSpeedFactor((s) => clamp(s - 0.1, 0.5, 2))}
                                        className="px-2 py-1 bg-slate-700 rounded-md text-sm"
                                    >
                                        −
                                    </button>
                                    <div className="text-sm text-slate-200">{speedFactor.toFixed(1)}x</div>
                                    <button
                                        onClick={() => setSpeedFactor((s) => clamp(s + 0.1, 0.5, 2))}
                                        className="px-2 py-1 bg-slate-700 rounded-md text-sm"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Center Canvas */}
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <canvas
                                    ref={canvasRef}
                                    width={cellSize * BOARD_SIZE}
                                    height={cellSize * BOARD_SIZE}
                                    className="rounded-xl shadow-xl"
                                    style={{
                                        width: `${cellSize * BOARD_SIZE}px`,
                                        height: `${cellSize * BOARD_SIZE}px`,
                                        background: "transparent",
                                        display: "block",
                                    }}
                                />
                                {/* Overlays */}
                                {!gameStarted && !gameOver && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center bg-black/60 p-4 rounded-lg animate-fade-in">
                                            <div className="text-lg font-bold text-white mb-1">Ready to Play</div>
                                            <div className="text-sm text-slate-300 mb-2">Press Space or Tap to Start</div>
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={onStart}
                                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-md text-sm font-semibold transform transition active:scale-95"
                                                >
                                                    ▶️ Start
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowHints(true);
                                                        setTimeout(() => setShowHints(false), 3000);
                                                    }}
                                                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm"
                                                >
                                                    Hints
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {paused && !gameOver && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center bg-black/60 p-3 rounded-lg">
                                            <div className="text-lg font-semibold text-amber-300">⏸ Paused</div>
                                            <div className="text-sm text-slate-300">Press Space to Resume</div>
                                        </div>
                                    </div>
                                )}

                                {gameOver && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center bg-black/70 p-4 rounded-lg animate-pop">
                                            <div className="text-2xl font-bold text-red-400 mb-2">💀 Game Over</div>
                                            <div className="text-sm text-slate-200 mb-2">Score: {score}</div>
                                            <div className="flex gap-2 justify-center">
                                                <button 
                                                    onClick={() => {
                                                        resetGame();
                                                        setGameStarted(true);
                                                        lastTimeRef.current = performance.now();
                                                        accumulatorRef.current = 0;
                                                    }} 
                                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-md text-white font-semibold transform transition active:scale-95"
                                                >
                                                    Play Again
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        saveHighScore(score);
                                                    }}
                                                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-white transform transition active:scale-95"
                                                >
                                                    Save HS
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile on-screen controls */}
                            {isMobile && (
                                <div className="mt-4 w-full max-w-md">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onTouchStart={() => mobilePress("up")}
                                            onMouseDown={() => mobilePress("up")}
                                            className="bg-slate-700 text-white px-4 py-3 rounded-lg shadow hover:scale-105 active:scale-95 transition"
                                        >
                                            ↑
                                        </button>
                                        <button
                                            onTouchStart={() => mobilePress("down")}
                                            onMouseDown={() => mobilePress("down")}
                                            className="bg-slate-700 text-white px-4 py-3 rounded-lg shadow hover:scale-105 active:scale-95 transition"
                                        >
                                            ↓
                                        </button>
                                        <button
                                            onTouchStart={() => mobilePress("left")}
                                            onMouseDown={() => mobilePress("left")}
                                            className="bg-slate-700 text-white px-4 py-3 rounded-lg shadow hover:scale-105 active:scale-95 transition"
                                        >
                                            ←
                                        </button>
                                        <button
                                            onTouchStart={() => mobilePress("right")}
                                            onMouseDown={() => mobilePress("right")}
                                            className="bg-slate-700 text-white px-4 py-3 rounded-lg shadow hover:scale-105 active:scale-95 transition"
                                        >
                                            →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right-side info */}
                        <div className="hidden md:flex flex-col gap-4">
                            <div className="bg-[rgba(255,255,255,0.02)] p-3 rounded-xl border border-[rgba(255,255,255,0.03)]">
                                <div className="text-xs text-slate-300">Status</div>
                                <div className="mt-2 text-sm">
                                    {gameOver ? <span className="text-red-300">Game Over</span> : gameStarted ? <span className="text-emerald-300">Playing</span> : <span className="text-slate-300">Ready</span>}
                                </div>
                                <div className="mt-3 text-xs text-slate-400">Keyboard hints</div>
                                <div className="mt-2 text-sm text-slate-200">Space: Start/Pause • Arrow keys to move</div>
                            </div>

                            
                        </div>
                    </div>

                    {/* bottom bar */}
                    <div className="mt-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onStart}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-semibold transition active:scale-95 shadow"
                            >
                                {gameStarted ? (gameOver ? "Restart" : "Playing") : "Start"}
                            </button>
                            <button
                                onClick={togglePause}
                                disabled={!gameStarted}
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white font-semibold transition disabled:opacity-50"
                            >
                                {paused ? "Resume" : "Pause"}
                            </button>
                        </div>

                        <div className="text-xs text-slate-400">
                            {showHints && (
                                <div className="inline-flex items-center gap-2">
                                    <span className="px-2 py-1 rounded bg-slate-700/40 text-white text-xs">Tip</span>
                                    <span>{isMobile ? "Tap/Swipe to control • Double-tap for faster" : "Use arrow keys • Space to start/pause"}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
