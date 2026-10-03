import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    createGameState, updateAI, moveBall, checkPaddleCollision, checkScore
} from './PongGame.logic'
import './PongGame.css'

const PongGame = () => {
    const canvasRef = useRef(null)
    const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 })
    const [score, setScore] = useState({ player: 0, ai: 0 })
    const [gameStarted, setGameStarted] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    const gameStateRef = useRef(null)

    useEffect(() => {
        const updateResponsive = () => {
            setIsMobile(window.innerWidth < 768)
            const maxW = 600, maxH = 400, minW = 380, minH = 260
            let width = Math.min(maxW, Math.max(minW, Math.floor(window.innerWidth * 0.95)))
            let height = Math.round(width * 2 / 3)
            if (height > maxH) { height = maxH; width = Math.round(height * 3 / 2) }
            setCanvasSize({ width, height })
        }
        updateResponsive()
        window.addEventListener('resize', updateResponsive)
        return () => window.removeEventListener('resize', updateResponsive)
    }, [])

    useEffect(() => {
        if (!isMobile) return
        const canvas = canvasRef.current
        if (!canvas) return
        let dragging = false
        let offsetY = 0
        const getTouchY = (touch) => {
            const rect = canvas.getBoundingClientRect()
            return ((touch.clientY - rect.top) / rect.height) * canvasSize.height
        }
        const handleTouchStart = (e) => {
            if (e.touches.length !== 1) return
            const y = getTouchY(e.touches[0])
            const state = gameStateRef.current
            if (y >= state.playerY && y <= state.playerY + state.paddleHeight) {
                dragging = true
                offsetY = y - state.playerY
            }
        }
        const handleTouchMove = (e) => {
            if (!dragging || e.touches.length !== 1) return
            const y = getTouchY(e.touches[0])
            const state = gameStateRef.current
            let newY = y - offsetY
            newY = Math.max(0, Math.min(canvasSize.height - state.paddleHeight, newY))
            state.playerY = newY
        }
        const handleTouchEnd = () => { dragging = false }
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
        return () => {
            canvas.removeEventListener('touchstart', handleTouchStart)
            canvas.removeEventListener('touchmove', handleTouchMove)
            canvas.removeEventListener('touchend', handleTouchEnd)
        }
    }, [isMobile, canvasSize])

    const initializeGame = useCallback(() => {
        gameStateRef.current = createGameState(canvasSize.width, canvasSize.height)
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
        setIsPaused(false)
        setScore({ player: 0, ai: 0 })
        initializeGame()
    }

    useEffect(() => {
        if (isMobile) return
        const handleKeyDown = (e) => {
            const state = gameStateRef.current
            if (!state) return
            if (e.key === "ArrowUp") { e.preventDefault(); state.upPressed = true }
            if (e.key === "ArrowDown") { e.preventDefault(); state.downPressed = true }
            if (e.key === " ") {
                e.preventDefault()
                if (!gameStarted) startGame()
                else if (!gameOver) setIsPaused(!isPaused)
            }
        }
        const handleKeyUp = (e) => {
            const state = gameStateRef.current
            if (!state) return
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
        if (!gameStarted || gameOver || isPaused) return
        const canvas = canvasRef.current
        if (!canvas) return
        const width = canvasSize.width
        const height = canvasSize.height
        const ctx = canvas.getContext("2d")
        let animationId = null
        let running = true

        const gameLoop = () => {
            if (!running) return
            const state = gameStateRef.current
            if (!state) return

            if (!isMobile) {
                if (state.upPressed && state.playerY > 0) state.playerY -= 6
                if (state.downPressed && state.playerY < height - state.paddleHeight) state.playerY += 6
            }

            updateAI(state, height, isMobile)
            moveBall(state, width, height)
            checkPaddleCollision(state, width)

            const result = checkScore(state, width)
            if (result) {
                if (result.scorer === 'ai') {
                    setScore(prev => ({ ...prev, ai: prev.ai + 1 }))
                } else {
                    setScore(prev => ({ ...prev, player: prev.player + 1 }))
                }
                resetBall()
            }

            if (score.player >= 10 || score.ai >= 10) {
                setGameOver(true)
                running = false
                return
            }

            ctx.fillStyle = "#001122"
            ctx.fillRect(0, 0, width, height)
            ctx.strokeStyle = "#444"
            ctx.setLineDash([5, 5])
            ctx.beginPath()
            ctx.moveTo(width / 2, 0)
            ctx.lineTo(width / 2, height)
            ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = "#00ff00"
            ctx.fillRect(10, state.playerY, state.paddleWidth, state.paddleHeight)
            ctx.fillStyle = "#ff0000"
            ctx.fillRect(width - 20, state.aiY, state.paddleWidth, state.paddleHeight)
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(state.ballX, state.ballY, state.ballSize, state.ballSize)
            ctx.fillStyle = "#ffffff"
            ctx.font = "bold 24px Arial"
            ctx.fillText(score.player.toString(), width / 4 - 10, 40)
            ctx.fillText(score.ai.toString(), (3 * width) / 4 - 10, 40)

            animationId = requestAnimationFrame(gameLoop)
        }

        animationId = requestAnimationFrame(gameLoop)
        return () => {
            running = false
            if (animationId) cancelAnimationFrame(animationId)
        }
    }, [gameStarted, gameOver, isPaused, score, resetBall, isMobile, canvasSize])

    return (
        <div className="pong-container">
            <div className="pong-header">
                <h1>🏓 Ping-Pong</h1>
                <div className="pong-score">
                    <span>{score.player}</span>
                    <span>-</span>
                    <span>{score.ai}</span>
                    <span className="score-label">First to 10 wins</span>
                </div>
            </div>

            <div className="pong-game-area">
                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    className="pong-canvas"
                />

                <div className="pong-controls">
                    {!gameStarted ? (
                        <button onClick={startGame} className="btn-primary">Start Game</button>
                    ) : (
                        <>
                            <button onClick={() => setIsPaused(!isPaused)} disabled={gameOver} className="btn-warning">
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                            <button onClick={startGame} className="btn-primary">Restart</button>
                        </>
                    )}
                </div>

                {gameOver && (
                    <div className={`pong-result ${score.player >= 10 ? 'win' : 'lose'}`}>
                        <h2>{score.player >= 10 ? '🎉 You Win!' : '👎 You Lose!'}</h2>
                        <p>Final Score: {score.player} - {score.ai}</p>
                    </div>
                )}

                {isPaused && !gameOver && (
                    <div className="pong-paused">
                        <h2>⏸️ Game Paused</h2>
                        <p>Press spacebar to resume</p>
                    </div>
                )}

                <div className="pong-instructions">
                    <p>🎯 <strong>Controls:</strong> Use ↑ and ↓ arrow keys • Spacebar to pause</p>
                    <p>🏆 First player to reach 10 points wins!</p>
                </div>
            </div>
        </div>
    )
}

export default PongGame