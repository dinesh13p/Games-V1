import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const PongGame = () => {
    const navigate = useNavigate()
    const canvasRef = useRef(null)
    const [score, setScore] = useState({ player: 0, ai: 0 })
    const [gameStarted, setGameStarted] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)

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

    const initializeGame = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const state = gameStateRef.current
        state.playerY = canvas.height / 2 - state.paddleHeight / 2
        state.aiY = canvas.height / 2 - state.paddleHeight / 2
        state.ballX = canvas.width / 2
        state.ballY = canvas.height / 2
        state.ballSpeedX = 5 * (Math.random() > 0.5 ? 1 : -1)
        state.ballSpeedY = 4 * (Math.random() > 0.5 ? 1 : -1)
    }, [])

    const resetBall = useCallback(() => {
        const canvas = canvasRef.current
        const state = gameStateRef.current
        
        state.ballX = canvas.width / 2
        state.ballY = canvas.height / 2
        state.ballSpeedX = 5 * (Math.random() > 0.5 ? 1 : -1)
        state.ballSpeedY = 4 * (Math.random() > 0.5 ? 1 : -1)
    }, [])

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
    }, [gameStarted, gameOver, isPaused])

    useEffect(() => {
        if (!gameStarted || gameOver || isPaused) return

        const canvas = canvasRef.current
        if (!canvas) return
        
        const ctx = canvas.getContext("2d")
        let animationId

        const gameLoop = () => {
            const state = gameStateRef.current

            // Move player paddle
            if (state.upPressed && state.playerY > 0) {
                state.playerY -= 6
            }
            if (state.downPressed && state.playerY < canvas.height - state.paddleHeight) {
                state.playerY += 6
            }

            // Move AI paddle (simple AI)
            const aiCenter = state.aiY + state.paddleHeight / 2
            const ballCenter = state.ballY + state.ballSize / 2
            
            if (aiCenter < ballCenter && state.aiY < canvas.height - state.paddleHeight) {
                state.aiY += 4
            } else if (aiCenter > ballCenter && state.aiY > 0) {
                state.aiY -= 4
            }

            // Move ball
            state.ballX += state.ballSpeedX
            state.ballY += state.ballSpeedY

            // Collision with top/bottom walls
            if (state.ballY <= 0 || state.ballY + state.ballSize >= canvas.height) {
                state.ballSpeedY = -state.ballSpeedY
            }

            // Collision with player paddle
            if (
                state.ballX <= 20 &&
                state.ballY + state.ballSize >= state.playerY &&
                state.ballY <= state.playerY + state.paddleHeight
            ) {
                state.ballSpeedX = Math.abs(state.ballSpeedX)
                // Add some randomness to ball direction
                state.ballSpeedY += (Math.random() - 0.5) * 2
            }

            // Collision with AI paddle
            if (
                state.ballX + state.ballSize >= canvas.width - 20 &&
                state.ballY + state.ballSize >= state.aiY &&
                state.ballY <= state.aiY + state.paddleHeight
            ) {
                state.ballSpeedX = -Math.abs(state.ballSpeedX)
                state.ballSpeedY += (Math.random() - 0.5) * 2
            }

            // Score update and ball reset
            if (state.ballX < 0) {
                setScore(prev => ({ ...prev, ai: prev.ai + 1 }))
                resetBall()
            } else if (state.ballX > canvas.width) {
                setScore(prev => ({ ...prev, player: prev.player + 1 }))
                resetBall()
            }

            // Check for game over (first to 10 points)
            if (score.player >= 10 || score.ai >= 10) {
                setGameOver(true)
                return
            }

            // Clear canvas with dark background
            ctx.fillStyle = "#001122"
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Draw middle dashed line
            ctx.strokeStyle = "#444"
            ctx.setLineDash([5, 5])
            ctx.beginPath()
            ctx.moveTo(canvas.width / 2, 0)
            ctx.lineTo(canvas.width / 2, canvas.height)
            ctx.stroke()
            ctx.setLineDash([])

            // Draw paddles
            ctx.fillStyle = "#00ff00"
            ctx.fillRect(10, state.playerY, state.paddleWidth, state.paddleHeight)
            
            ctx.fillStyle = "#ff0000"
            ctx.fillRect(canvas.width - 20, state.aiY, state.paddleWidth, state.paddleHeight)

            // Draw ball
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(state.ballX, state.ballY, state.ballSize, state.ballSize)

            // Draw score
            ctx.fillStyle = "#ffffff"
            ctx.font = "bold 24px Arial"
            ctx.fillText(score.player.toString(), canvas.width / 4 - 10, 40)
            ctx.fillText(score.ai.toString(), (3 * canvas.width) / 4 - 10, 40)

            if (!gameOver) {
                animationId = requestAnimationFrame(gameLoop)
            }
        }

        animationId = requestAnimationFrame(gameLoop)

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId)
            }
        }
    }, [gameStarted, gameOver, isPaused, score, resetBall])

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="game-board p-8 rounded-2xl fade-in max-w-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                    <button 
                        className="btn-secondary text-white px-4 py-2 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105"
                        onClick={() => navigate('/')}
                    >
                        ← Back to Home
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800">🏓Ping-Pong</h1>
                    <div className="text-right">
                        <div className="text-lg font-semibold text-gray-700">
                            {score.player} - {score.ai}
                        </div>
                        <div className="text-xs text-gray-600">First to 10 wins</div>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <canvas
                        ref={canvasRef}
                        width={600}
                        height={400}
                        className="border-4 border-gray-300 rounded-lg mb-6 bg-gray-900"
                    />

                    {/* Game Controls */}
                    <div className="flex gap-4 mb-6">
                        {!gameStarted ? (
                            <button 
                                className="btn-primary text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                                onClick={startGame}
                            >
                                🎮 Start Game
                            </button>
                        ) : (
                            <>
                                <button 
                                    className="btn-secondary text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                                    onClick={() => setPaused(!isPaused)}
                                    disabled={gameOver}
                                >
                                    {isPaused ? "▶️ Resume" : "⏸️ Pause"}
                                </button>
                                <button 
                                    className="btn-danger text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
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
        </div>
    )
}

export default PongGame