import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';

export default function FlappyBird() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const lastTimeRef = useRef(0);

    const [width] = useState(480);
    const [height] = useState(640);
    const [scale, setScale] = useState(1);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        try {
            const saved = localStorage.getItem('flappyBirdHighScore');
            return saved ? parseInt(saved) : 0;
        } catch {
            return 0;
        }
    });
    const [state, setState] = useState("ready");

    const GRAVITY = 1400;
    const FLAP_VELOCITY = -380;
    const MAX_DROP_SPEED = 900;
    const BIRD_RADIUS = 18;
    const PIPE_WIDTH = 72;
    const PIPE_GAP = 150;
    const PIPE_MIN_GAP_Y = 100;
    const PIPE_SPAWN_INTERVAL = 1.6;
    const PIPE_SPEED = 180;
    const GROUND_HEIGHT = 110;

    const pipesRef = useRef([]);
    const birdRef = useRef({
        x: width * 0.28,
        y: height / 2,
        vy: 0,
        rotation: 0,
    });
    const spawnTimerRef = useRef(0);
    const passedPipeIndexRef = useRef(0);
    const scoreRef = useRef(0);
    const pipeCountRef = useRef(0);

    useEffect(() => {
        function handleResize() {
            const container = canvasRef.current?.parentElement;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const newScale = Math.min(rect.width / width, (rect.height || 9999) / height);
            setScale(newScale);
            const canvas = canvasRef.current;
            if (!canvas) return;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = Math.round(width * newScale) + "px";
            canvas.style.height = Math.round(height * newScale) + "px";
            const ctx = canvas.getContext("2d");
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [width, height]);

    useEffect(() => {
        const flap = () => {
            if (state === "ready") {
                startGame();
            }
            if (state === "playing") {
                birdRef.current.vy = FLAP_VELOCITY;
            }
            if (state === "over") {
                restartGame();
            }
        };

        const onKey = (e) => {
            if (e.code === "Space" || e.key === " " || e.code === "ArrowUp") {
                e.preventDefault();
                flap();
            }
        };

        // Canvas-specific mouse and touch handlers
        const onCanvasClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            flap();
        };

        const onCanvasTouch = (e) => {
            e.preventDefault();
            e.stopPropagation();
            flap();
        };

        window.addEventListener("keydown", onKey);
        
        // Add event listeners only to the canvas
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener("mousedown", onCanvasClick);
            canvas.addEventListener("touchstart", onCanvasTouch, { passive: false });
        }

        return () => {
            window.removeEventListener("keydown", onKey);
            if (canvas) {
                canvas.removeEventListener("mousedown", onCanvasClick);
                canvas.removeEventListener("touchstart", onCanvasTouch);
            }
        };
    }, [state]);

    function startGame() {
        setState("playing");
        pipesRef.current = [];
        spawnTimerRef.current = 0;
        scoreRef.current = 0;
        setScore(0);
        passedPipeIndexRef.current = 0;
        pipeCountRef.current = 0;
        birdRef.current = {
            x: width * 0.28,
            y: height / 2,
            vy: FLAP_VELOCITY,
            rotation: -0.5,
        };
    }

    function restartGame() {
        setState("ready");
        pipesRef.current = [];
        spawnTimerRef.current = 0;
        scoreRef.current = 0;
        setScore(0);
        passedPipeIndexRef.current = 0;
        pipeCountRef.current = 0;
        birdRef.current = {
            x: width * 0.28,
            y: height / 2,
            vy: 0,
            rotation: 0,
        };
    }

    const randRange = (min, max) => Math.random() * (max - min) + min;

    function shouldGapMove(pipeNumber) {
        // Cycles: 25-45, 46-75, 76-100, 101-125, 126-145, 146-175, 176-200, ...
        // 1. 1-24: stationary
        if (pipeNumber <= 24) return false;

        // Find cycle base (0, 100, 200, ...)
        const cycleBase = Math.floor((pipeNumber - 1) / 100) * 100;
        const n = pipeNumber - cycleBase;

        // 25-45: custom pattern
        if (n >= 25 && n <= 45) {
            // Gaps in poles 28, 31, 34, 37, 40, 43 move, others stationary
            return [28, 31, 34, 37, 40, 43].includes(n);
        }
        // 46-75: even moves, odd stationary
        if (n >= 46 && n <= 75) {
            return n % 2 === 0;
        }
        // 76-100: all move
        if (n >= 76 && n <= 100) {
            return true;
        }
        // 101-124: stationary
        if (n >= 101 && n <= 124) {
            return false;
        }
        // 125-145: custom pattern
        if (n >= 125 && n <= 145) {
            return [128, 131, 134, 137, 140, 143].includes(n);
        }
        // 146-175: even moves, odd stationary
        if (n >= 146 && n <= 175) {
            return n % 2 === 0;
        }
        // 176-200: all move
        if (n >= 176 && n <= 200) {
            return true;
        }
        // For n > 200, repeat pattern
        // (function will be called again as cycleBase increases)
        return false;
    }

    function createPipe() {
        const x = width + 40;
        const minY = PIPE_MIN_GAP_Y;
        const maxY = height - GROUND_HEIGHT - PIPE_GAP - 40;
        const gapY = randRange(minY, maxY);
        pipeCountRef.current += 1;
        
        return { 
            x, 
            gapY: gapY,
            originalGapY: gapY,
            pipeNumber: pipeCountRef.current,
            movingGap: shouldGapMove(pipeCountRef.current),
            gapDirection: 1,
            gapSpeed: 80
        };
    }

    function checkCollision(bird, pipes) {
        if (bird.y + BIRD_RADIUS >= height - GROUND_HEIGHT) return true;
        if (bird.y - BIRD_RADIUS <= 0) return true;

        for (let pipe of pipes) {
            const rx = pipe.x;
            const rw = PIPE_WIDTH;
            const topRect = { x: rx, y: 0, w: rw, h: pipe.gapY };
            const bottomRect = {
                x: rx,
                y: pipe.gapY + PIPE_GAP,
                w: rw,
                h: height - GROUND_HEIGHT - (pipe.gapY + PIPE_GAP),
            };

            if (circleRectCollision(bird, topRect) || circleRectCollision(bird, bottomRect)) {
                return true;
            }
        }
        return false;
    }

    function circleRectCollision(circle, rect) {
        const cx = circle.x;
        const cy = circle.y;
        const rx = rect.x;
        const ry = rect.y;
        const rw = rect.w;
        const rh = rect.h;

        const closestX = Math.max(rx, Math.min(cx, rx + rw));
        const closestY = Math.max(ry, Math.min(cy, ry + rh));

        const dx = cx - closestX;
        const dy = cy - closestY;
        return dx * dx + dy * dy < BIRD_RADIUS * BIRD_RADIUS;
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        function drawBackground(ctx, t) {
            const g = ctx.createLinearGradient(0, 0, 0, height);
            g.addColorStop(0, "#87CEEB");
            g.addColorStop(1, "#E0F6FF");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, width, height);

            for (let i = 0; i < 3; i++) {
                const cx = ((t * 0.02) + i * 210) % (width + 120) - 60;
                drawCloud(ctx, cx, 70 + i * 30, 0.9 + i * 0.2);
            }
        }

        function drawCloud(ctx, x, y, s = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(s, s);
            ctx.beginPath();
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.moveTo(0, 0);
            ctx.arc(10, 0, 18, 0, Math.PI * 2);
            ctx.arc(30, 0, 22, 0, Math.PI * 2);
            ctx.arc(50, 0, 18, 0, Math.PI * 2);
            ctx.arc(30, -10, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        function drawGround(ctx) {
            ctx.fillStyle = "#8B7355";
            ctx.fillRect(0, height - GROUND_HEIGHT, width, GROUND_HEIGHT);
            ctx.fillStyle = "rgba(0,0,0,0.1)";
            for (let x = 0; x < width; x += 20) {
                ctx.fillRect(x, height - GROUND_HEIGHT + 50, 12, 6);
            }
        }

        function drawPipes(ctx, pipes) {
            for (let pipe of pipes) {
                const rx = pipe.x;
                const gapY = pipe.gapY;
                drawPipeRect(ctx, rx, 0, PIPE_WIDTH, gapY, true);
                drawPipeRect(ctx, rx, gapY + PIPE_GAP, PIPE_WIDTH, height - GROUND_HEIGHT - (gapY + PIPE_GAP), false);
            }
        }

        function drawPipeRect(ctx, x, y, w, h, flip = false) {
            ctx.save();
            ctx.fillStyle = "#4CAF50";
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = "rgba(0,0,0,0.15)";
            ctx.fillRect(x + w - 8, y, 8, h);
            ctx.fillStyle = "#388E3C";
            if (flip) {
                ctx.fillRect(x - 6, y + h - 12, w + 12, 12);
            } else {
                ctx.fillRect(x - 6, y, w + 12, 12);
            }
            ctx.restore();
        }

        function drawBird(ctx, bird) {
            ctx.save();
            ctx.translate(bird.x, bird.y);
            ctx.rotate(bird.rotation);
            ctx.beginPath();
            ctx.fillStyle = "#FFB74D";
            ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = "#FF9800";
            ctx.ellipse(-3, 6, 10, 4, Math.sin(bird.vy * 0.02) * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = "#333";
            ctx.arc(6, -6, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(14, -2);
            ctx.lineTo(22, -0);
            ctx.lineTo(14, 4);
            ctx.closePath();
            ctx.fillStyle = "#FF5722";
            ctx.fill();
            ctx.restore();
        }

        function drawHUD(ctx) {
            ctx.save();
            ctx.font = "bold 36px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.fillText(scoreRef.current, width / 2 + 2, 80 + 2);
            ctx.fillStyle = "#fff";
            ctx.fillText(scoreRef.current, width / 2, 80);
            ctx.restore();
        }

        function render(now) {
            const t = now / 1000;
            ctx.clearRect(0, 0, width, height);

            drawBackground(ctx, t);
            drawPipes(ctx, pipesRef.current);
            drawGround(ctx);
            drawBird(ctx, birdRef.current);
            drawHUD(ctx);

            if (state === "ready") {
                drawStartOverlay(ctx);
            } else if (state === "over") {
                drawGameOverOverlay(ctx);
            }
        }

        function drawStartOverlay(ctx) {
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.fillRect(0, 0, width, height);
            
            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.fillRect(40, 120, width - 80, 280);
            
            ctx.fillStyle = "#374151";
            ctx.font = "bold 32px Arial";
            ctx.textAlign = "center";
            ctx.fillText("🐦 Flappy Bird", width / 2, 180);
            
            ctx.font = "18px Arial";
            ctx.fillStyle = "#6B7280";
            ctx.fillText("Press Space / Tap to flap and start", width / 2, 220);
            ctx.fillText("🎯 How to Play:", width / 2, 260);
            ctx.fillText("Avoid pipes and stay airborne!", width / 2, 285);
            ctx.fillText("Score increases each time you pass a pipe", width / 2, 310);
            
            ctx.font = "14px Arial";
            ctx.fillStyle = "#9CA3AF";
            ctx.fillText("💡 Tip: Tap gently for better control", width / 2, 340);
            ctx.restore();
        }

        function drawGameOverOverlay(ctx) {
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(0, 0, width, height);
            
            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.fillRect(50, 160, width - 100, 260);
            
            ctx.fillStyle = "#EF4444";
            ctx.font = "bold 32px Arial";
            ctx.textAlign = "center";
            ctx.fillText("💥 Game Over", width / 2, 210);
            
            ctx.font = "bold 22px Arial";
            ctx.fillStyle = "#374151";
            ctx.fillText(`Score: ${scoreRef.current}`, width / 2, 250);
            
            const currentHigh = Math.max(scoreRef.current, highScore);
            ctx.fillStyle = "#059669";
            ctx.fillText(`🏆 High Score: ${currentHigh}`, width / 2, 285);
            
            if (scoreRef.current > highScore) {
                ctx.font = "18px Arial";
                ctx.fillStyle = "#DC2626";
                ctx.fillText("🎉 New High Score! 🎉", width / 2, 315);
            }
            
            ctx.font = "16px Arial";
            ctx.fillStyle = "#6B7280";
            ctx.fillText("Press Space / Tap to restart", width / 2, 360);
            ctx.restore();
        }

        function update(dt) {
            const bird = birdRef.current;

            if (state === "playing") {
                bird.vy += GRAVITY * dt;
                if (bird.vy > MAX_DROP_SPEED) bird.vy = MAX_DROP_SPEED;
                bird.y += bird.vy * dt;

                bird.rotation = Math.max(Math.min(bird.vy / 400, 0.9), -0.9);

                spawnTimerRef.current += dt;
                if (spawnTimerRef.current >= PIPE_SPAWN_INTERVAL) {
                    spawnTimerRef.current = 0;
                    pipesRef.current.push(createPipe());
                }

                for (let pipe of pipesRef.current) {
                    pipe.x -= PIPE_SPEED * dt;
                    
                    // Update moving gap position
                    if (pipe.movingGap) {
                        pipe.gapY += pipe.gapDirection * pipe.gapSpeed * dt;
                        
                        const minY = PIPE_MIN_GAP_Y;
                        const maxY = height - GROUND_HEIGHT - PIPE_GAP - 40;
                        
                        if (pipe.gapY <= minY) {
                            pipe.gapY = minY;
                            pipe.gapDirection = 1;
                        } else if (pipe.gapY >= maxY) {
                            pipe.gapY = maxY;
                            pipe.gapDirection = -1;
                        }
                    }
                }

                if (pipesRef.current.length && pipesRef.current[0].x + PIPE_WIDTH < -20) {
                    pipesRef.current.shift();
                    if (passedPipeIndexRef.current > 0) passedPipeIndexRef.current--;
                }

                for (let i = 0; i < pipesRef.current.length; i++) {
                    const p = pipesRef.current[i];
                    if (!p.passed && p.x + PIPE_WIDTH / 2 < bird.x) {
                        p.passed = true;
                        scoreRef.current += 1;
                        setScore(scoreRef.current);
                        if (scoreRef.current > highScore) {
                            const newHigh = scoreRef.current;
                            setHighScore(newHigh);
                            try {
                                localStorage.setItem('flappyBirdHighScore', newHigh.toString());
                            } catch (error) {
                                console.warn('Could not save high score:', error);
                            }
                        }
                    }
                }

                if (checkCollision(bird, pipesRef.current)) {
                    setState("over");
                }
            } else if (state === "ready") {
                bird.y = height / 2 + Math.sin(Date.now() / 300) * 7;
                bird.rotation = Math.sin(Date.now() / 400) * 0.06;
            } else if (state === "over") {
                if (bird.y + BIRD_RADIUS < height - GROUND_HEIGHT) {
                    bird.vy += GRAVITY * dt;
                    bird.y += bird.vy * dt;
                    bird.rotation = Math.min(Math.max(bird.vy / 400, -0.9), 1.2);
                } else {
                    bird.y = height - GROUND_HEIGHT - BIRD_RADIUS;
                    bird.vy = 0;
                }
            }
        }

        function loop(now) {
            if (!lastTimeRef.current) lastTimeRef.current = now;
            const dt = Math.min((now - lastTimeRef.current) / 1000, 0.033);
            lastTimeRef.current = now;

            try {
                update(dt);
                render(now);
            } catch (err) {
                console.error("Game loop error:", err);
            }

            rafRef.current = requestAnimationFrame(loop);
        }

        rafRef.current = requestAnimationFrame(loop);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
            lastTimeRef.current = 0;
        };
    }, [state, highScore, width, height]);

    const resetScores = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setHighScore(0);
        try {
            localStorage.removeItem('flappyBirdHighScore');
        } catch (error) {
            console.warn('Could not clear high score:', error);
        }
    };

    const handleBackToHome = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">

            <main className="flex items-center justify-center p-6">
                <div className="p-8 rounded-2xl fade-in max-w-2xl w-full transform transition-all duration-500 bg-gray-800 border border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-white">🐦 Flappy Bird</h1>
                        <div className="text-right">
                            <button 
                                className="btn-secondary text-white px-3 py-1 rounded text-sm transform transition-all duration-200 hover:scale-105"
                                onClick={resetScores}
                                aria-label="Reset high score"
                            >
                                Reset High Score
                            </button>
                        </div>
                    </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                        <div className="text-xl font-bold text-blue-600 mb-1">Current Score</div>
                        <div className="text-3xl font-semibold text-gray-700">{score}</div>
                        <div className="text-xs text-gray-500">This Game</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                        <div className="text-xl font-bold text-yellow-600 mb-1">🏆 High Score</div>
                        <div className="text-3xl font-semibold text-gray-700">{highScore}</div>
                        <div className="text-xs text-gray-500">Best Ever</div>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-6 text-center transform transition-all duration-300">
                        {state === "ready" ? (
                            <span className="text-green-600 animate-pulse">🎮 Ready to Fly!</span>
                        ) : state === "playing" ? (
                            <span className="text-blue-600 animate-pulse-slow">🚁 Flying...</span>
                        ) : (
                            <span className="text-red-500 animate-bounce-slow">💥 Crashed!</span>
                        )}
                    </h2>

                    <div 
                        style={{ 
                            transform: `scale(${scale})`, 
                            transformOrigin: "top center", 
                            display: "inline-block" 
                        }}
                    >
                        <div 
                            style={{ 
                                position: "relative", 
                                width, 
                                height, 
                                borderRadius: 16, 
                                overflow: "hidden", 
                                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                                border: "2px solid #E5E7EB"
                            }}
                        >
                            <canvas 
                                ref={canvasRef} 
                                style={{ 
                                    display: "block", 
                                    background: "#87CEEB" 
                                }} 
                                role="presentation"
                                aria-label="Flappy Bird game board"
                            />
                        </div>
                    </div>
                </div>
                </div>
            </main>

            <style jsx>{`
                .fade-in {
                    animation: fadeIn 0.5s ease-in;
                }
                .btn-primary {
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                .btn-primary:hover {
                    background: linear-gradient(135deg, #2563eb, #1e40af);
                    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
                }
                .btn-secondary {
                    background: linear-gradient(135deg, #6b7280, #4b5563);
                    box-shadow: 0 2px 8px rgba(107, 114, 128, 0.3);
                }
                .btn-secondary:hover {
                    background: linear-gradient(135deg, #4b5563, #374151);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-pulse-slow {
                    animation: pulse 2s infinite;
                }
                .animate-bounce-slow {
                    animation: bounce 1s infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                @keyframes bounce {
                    0%, 20%, 53%, 80%, 100% {
                        transform: translate3d(0, 0, 0);
                    }
                    40%, 43% {
                        transform: translate3d(0, -8px, 0);
                    }
                    70% {
                        transform: translate3d(0, -4px, 0);
                    }
                    90% {
                        transform: translate3d(0, -2px, 0);
                    }
                }
            `}</style>
        </div>
    );
}