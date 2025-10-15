import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const PongGame = () => {
    const navigate = useNavigate()
    const canvasRef = useRef(null)
    const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 })
    const [score, setScore] = useState({ player: 0, ai: 0 })
    const [gameStarted, setGameStarted] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    const gameStateRef = useRef({
        playerY: 0,
        aiY: 0,
        ballX: 0,
        ballY: 0,
        ballSpeedX: 5,
        ballSpeedY: 4,
        paddleHeight: 80,
        paddleWidth: 10,
        ballSize: 10,
        upPressed: false,
        downPressed: false
    })

    // Check if mobile on mount and resize, and set canvas size responsively
    useEffect(() => {
        const updateResponsive = () => {
            setIsMobile(window.innerWidth < 768);
            // Responsive canvas: max 600x400, min 380x260 (larger min for mobile)
            const maxW = 600, maxH = 400, minW = 380, minH = 260;
            let width = Math.min(maxW, Math.max(minW, Math.floor(window.innerWidth * 0.95)));
            let height = Math.round(width * 2 / 3);
            if (height > maxH) { height = maxH; width = Math.round(height * 3 / 2); }
            setCanvasSize({ width, height });
        };
        updateResponsive();
        window.addEventListener('resize', updateResponsive);
        return () => window.removeEventListener('resize', updateResponsive);
    }, []);

    // Mobile paddle movement: allow finger drag to move green paddle (responsive)
    useEffect(() => {
        if (!isMobile) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        let dragging = false;
        let offsetY = 0;

        const getTouchY = (touch) => {
            const rect = canvas.getBoundingClientRect();
            return ((touch.clientY - rect.top) / rect.height) * canvasSize.height;
        };

        const handleTouchStart = (e) => {
            if (e.touches.length !== 1) return;
            const y = getTouchY(e.touches[0]);
            const state = gameStateRef.current;
            if (
                y >= state.playerY &&
                y <= state.playerY + state.paddleHeight
            ) {
                dragging = true;
                offsetY = y - state.playerY;
            }
        };

        const handleTouchMove = (e) => {
            if (!dragging || e.touches.length !== 1) return;
            const y = getTouchY(e.touches[0]);
            const state = gameStateRef.current;
            let newY = y - offsetY;
            newY = Math.max(0, Math.min(canvasSize.height - state.paddleHeight, newY));
            state.playerY = newY;
        };

        const handleTouchEnd = () => {
            dragging = false;
        };

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

        return () => {
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isMobile, canvasSize]);

    const initializeGame = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const state = gameStateRef.current
        state.playerY = canvasSize.height / 2 - state.paddleHeight / 2
        state.aiY = canvasSize.height / 2 - state.paddleHeight / 2
        state.ballX = canvasSize.width / 2
        state.ballY = canvasSize.height / 2
        state.ballSpeedX = 5 * (Math.random() > 0.5 ? 1 : -1)
        state.ballSpeedY = 4 * (Math.random() > 0.5 ? 1 : -1)
    }, [canvasSize])

    const resetBall = useCallback(() => {
        const state = gameStateRef.current
        state.ballX = canvasSize.width / 2
        state.ballY = canvasSize.height / 2
        state.ballSpeedX = 5 * (Math.random() > 0.5 ? 1 : -1)
        state.ballSpeedY = 4 * (Math.random() > 0.5 ? 1 : -1)
    }, [canvasSize])

    const startGame = () => {
        setGameStarted(true)
        setGameOver(false)
        setPaused(false)
        setScore({ player: 0, ai: 0 })
        initializeGame()
    }

    const setPaused = (paused) => {
        setIsPaused(paused)
    }

    useEffect(() => {
        if (isMobile) return; // Don't add keyboard listeners on mobile

        const handleKeyDown = (e) => {
            const state = gameStateRef.current
            if (e.key === "ArrowUp") {
                e.preventDefault()
                state.upPressed = true
            }
            if (e.key === "ArrowDown") {
                e.preventDefault()
                state.downPressed = true
            }
            if (e.key === " ") {
                e.preventDefault()
                if (!gameStarted) {
                    startGame()
                } else if (!gameOver) {
                    setPaused(!isPaused)
                }
            }
        }

        const handleKeyUp = (e) => {
            const state = gameStateRef.current
            if (e.key === "ArrowUp") state.upPressed = false
            if (e.key === "ArrowDown") state.downPressed = false
        }

        document.addEventListener("keydown", handleKeyDown)
        document.addEventListener("keyup", handleKeyUp)

        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            document.removeEventListener("keyup", handleKeyUp)
        }
    }, [gameStarted, gameOver, isPaused, isMobile])

    useEffect(() => {
        if (!gameStarted || gameOver || isPaused) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const width = canvasSize.width;
        const height = canvasSize.height;
        const ctx = canvas.getContext("2d");
        let animationId = null;
        let running = true;

        const gameLoop = () => {
            if (!running) return;
            const state = gameStateRef.current;

            // Move player paddle (keyboard)
            if (!isMobile) {
                if (state.upPressed && state.playerY > 0) {
                    state.playerY -= 6;
                }
                if (state.downPressed && state.playerY < height - state.paddleHeight) {
                    state.playerY += 6;
                }
            }

            // Move AI paddle (smooth interpolation)
            const aiCenter = state.aiY + state.paddleHeight / 2;
            const ballCenter = state.ballY + state.ballSize / 2;
            // Use interpolation for smoother AI movement
            const aiTargetY = ballCenter - state.paddleHeight / 2;
            const aiLerp = isMobile ? 0.25 : 0.15; // Faster on mobile, smoother on desktop
            state.aiY += (aiTargetY - state.aiY) * aiLerp;
            // Clamp AI paddle position
            state.aiY = Math.max(0, Math.min(height - state.paddleHeight, state.aiY));

            // Move ball
            state.ballX += state.ballSpeedX;
            state.ballY += state.ballSpeedY;

            // Collision with top/bottom walls
            if (state.ballY <= 0 || state.ballY + state.ballSize >= height) {
                state.ballSpeedY = -state.ballSpeedY;
            }

            // Collision with player paddle
            if (
                state.ballX <= 20 &&
                state.ballY + state.ballSize >= state.playerY &&
                state.ballY <= state.playerY + state.paddleHeight
            ) {
                state.ballSpeedX = Math.abs(state.ballSpeedX);
                state.ballSpeedY += (Math.random() - 0.5) * 2;
            }

            // Collision with AI paddle
            if (
                state.ballX + state.ballSize >= width - 20 &&
                state.ballY + state.ballSize >= state.aiY &&
                state.ballY <= state.aiY + state.paddleHeight
            ) {
                state.ballSpeedX = -Math.abs(state.ballSpeedX);
                state.ballSpeedY += (Math.random() - 0.5) * 2;
            }

            // Score update and ball reset
            if (state.ballX < 0) {
                setScore(prev => ({ ...prev, ai: prev.ai + 1 }));
                resetBall();
            } else if (state.ballX > width) {
                setScore(prev => ({ ...prev, player: prev.player + 1 }));
                resetBall();
            }

            // Check for game over (first to 10 points)
            if (score.player >= 10 || score.ai >= 10) {
                setGameOver(true);
                running = false;
                return;
            }

            // Clear canvas with dark background
            ctx.fillStyle = "#001122";
            ctx.fillRect(0, 0, width, height);

            // Draw middle dashed line
            ctx.strokeStyle = "#444";
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(width / 2, 0);
            ctx.lineTo(width / 2, height);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw paddles
            ctx.fillStyle = "#00ff00";
            ctx.fillRect(10, state.playerY, state.paddleWidth, state.paddleHeight);
            ctx.fillStyle = "#ff0000";
            ctx.fillRect(width - 20, state.aiY, state.paddleWidth, state.paddleHeight);

            // Draw ball
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(state.ballX, state.ballY, state.ballSize, state.ballSize);

            // Draw score
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 24px Arial";
            ctx.fillText(score.player.toString(), width / 4 - 10, 40);
            ctx.fillText(score.ai.toString(), (3 * width) / 4 - 10, 40);

            animationId = requestAnimationFrame(gameLoop);
        };

        animationId = requestAnimationFrame(gameLoop);

        return () => {
            running = false;
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [gameStarted, gameOver, isPaused, score, resetBall, isMobile, canvasSize]);

    // ...existing code...

    return (
        <div className="min-h-screen bg-gray-900 text-white">

            <main className="flex items-center justify-center p-6">
                <div className="game-board p-8 rounded-2xl fade-in max-w-2xl w-full bg-gray-800 border border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-black">🏓Ping-Pong</h1>
                        <div className="text-right">
                            <div className="text-lg font-semibold text-black">
                                {score.player} - {score.ai}
                            </div>
                            <div className="text-xs text-black">First to 10 wins</div>
                        </div>
                    </div>

                <div className="flex flex-col items-center">
                    <canvas
                        ref={canvasRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        className="border-4 border-gray-300 rounded-lg mb-6 bg-gray-900"
                        style={{ maxWidth: '100%', height: 'auto', width: '100%' }}
                    />

                        {/* Game Controls */}
                                        <div className="flex gap-4 mb-6">
                                            {!gameStarted ? (
                                                <button 
                                                    className="bg-emerald-500 hover:bg-emerald-600 rounded-md text-sm font-semibold transform transition active:scale-95 text-white px-6 py-3"
                                                    onClick={startGame}
                                                >
                                                    🎮 Start Game
                                                </button>
                                            ) : (
                                                <>
                                                    <button 
                                                        className="bg-emerald-500 hover:bg-emerald-600 rounded-md text-sm font-semibold transform transition active:scale-95 text-white px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        onClick={() => setPaused(!isPaused)}
                                                        disabled={gameOver}
                                                    >
                                                        {isPaused ? "▶️ Resume" : "⏸️ Pause"}
                                                    </button>
                                                    <button 
                                                        className="bg-emerald-500 hover:bg-emerald-600 rounded-md text-sm font-semibold transform transition active:scale-95 text-white px-6 py-3"
                                                        onClick={startGame}
                                                    >
                                                        🔄 Restart
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Game Status */}
                    {gameOver && (
                        <div className="text-center mb-4 game-over bg-red-50 p-6 rounded-xl border-2 border-red-200">
                            <h2 className="text-2xl font-bold text-red-600 mb-2">
                                {score.player >= 10 ? "🎉You Win!" : "👎🏻You Lose!"}
                            </h2>
                            <p className="text-gray-700">Final Score: {score.player} - {score.ai}</p>
                        </div>
                    )}

                    {isPaused && !gameOver && (
                        <div className="text-center mb-4 bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                            <h2 className="text-xl font-bold text-blue-600">⏸️ Game Paused</h2>
                            <p className="text-sm text-gray-600 mt-2">Press spacebar to resume</p>
                        </div>
                    )}

                    {!gameStarted && !gameOver && (
                        <div className="text-center mb-4 bg-green-50 p-4 rounded-xl border-2 border-green-200">
                            <h2 className="text-xl font-bold text-green-600">🎯 Ready to Play!</h2>
                            <p className="text-sm text-gray-600 mt-2">Press spacebar or click Start Game</p>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="text-center text-gray-600 text-sm max-w-md">
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <p className="mb-2">🎯 <strong>Controls:</strong> Use ↑ and ↓ arrow keys • Spacebar to pause</p>
                            <p className="mb-2">🏆 First player to reach 10 points wins!</p>
                            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                                <div className="bg-green-100 p-2 rounded">
                                    <span className="font-semibold text-green-700">You:</span> Green paddle (left)
                                </div>
                                <div className="bg-red-100 p-2 rounded">
                                    <span className="font-semibold text-red-700">AI:</span> Red paddle (right)
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </main>
        </div>
    )
}

export default PongGame