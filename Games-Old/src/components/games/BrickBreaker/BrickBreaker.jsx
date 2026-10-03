import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED,
    BALL_RADIUS, BALL_SPEED, createBricks, checkBallCollision
} from './BrickBreaker.logic'
import './BrickBreaker.css'

const BrickBreaker = () => {
    const canvasRef = useRef(null)
    const animationRef = useRef(null)
    const touchStartX = useRef(0)

    const [gameStarted, setGameStarted] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [gameWon, setGameWon] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [score, setScore] = useState(0)
    const [lives, setLives] = useState(3)
    const [level, setLevel] = useState(1)
    const [highScore, setHighScore] = useState(() => {
        try {
            const saved = localStorage.getItem('brickBreakerHighScore')
            return saved ? parseInt(saved) : 0
        } catch { return 0 }
    })
    const [isMobile, setIsMobile] = useState(false)

    const gameState = useRef({
        paddle: { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - 30 },
        ball: {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT - 50,
            dx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
            dy: -BALL_SPEED
        },
        bricks: createBricks(),
        keys: { left: false, right: false }
    })

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const initializeGame = useCallback(() => {
        const state = gameState.current
        state.paddle = { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - 30 }
        state.ball = {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT - 50,
            dx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
            dy: -BALL_SPEED
        }
        state.bricks = createBricks()
        state.keys = { left: false, right: false }
    }, [])

    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        const state = gameState.current

        // Clear canvas
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
        gradient.addColorStop(0, '#1a1a2e')
        gradient.addColorStop(1, '#16213e')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        // Draw bricks
        state.bricks.forEach(brick => {
            if (brick.visible) {
                ctx.fillStyle = brick.color
                ctx.fillRect(brick.x, brick.y, brick.width, brick.height)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
                ctx.fillRect(brick.x, brick.y, brick.width, 3)
                ctx.fillRect(brick.x, brick.y, 3, brick.height)
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
                ctx.fillRect(brick.x + brick.width - 3, brick.y, 3, brick.height)
                ctx.fillRect(brick.x, brick.y + brick.height - 3, brick.width, 3)
            }
        })

        // Draw paddle
        const paddleGradient = ctx.createLinearGradient(
            state.paddle.x, state.paddle.y,
            state.paddle.x, state.paddle.y + PADDLE_HEIGHT
        )
        paddleGradient.addColorStop(0, '#4CAF50')
        paddleGradient.addColorStop(1, '#2E7D32')
        ctx.fillStyle = paddleGradient
        ctx.fillRect(state.paddle.x, state.paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.fillRect(state.paddle.x, state.paddle.y, PADDLE_WIDTH, 2)

        // Draw ball
        const ballGradient = ctx.createRadialGradient(
            state.ball.x - 2, state.ball.y - 2, 0,
            state.ball.x, state.ball.y, BALL_RADIUS
        )
        ballGradient.addColorStop(0, '#ffffff')
        ballGradient.addColorStop(1, '#ff6b7d')
        ctx.fillStyle = ballGradient
        ctx.beginPath()
        ctx.arc(state.ball.x, state.ball.y, BALL_RADIUS, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowColor = '#ff6b7d'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(state.ball.x, state.ball.y, BALL_RADIUS - 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        // Draw UI
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 18px Arial'
        ctx.textAlign = 'left'
        ctx.fillText(`Score: ${score}`, 20, 30)
        ctx.fillText(`Lives: ${lives}`, 20, 55)
        ctx.textAlign = 'right'
        ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH - 20, 30)
        const remainingBricks = state.bricks.filter(b => b.visible).length
        ctx.fillText(`Bricks: ${remainingBricks}`, CANVAS_WIDTH - 20, 55)

        // Draw overlays
        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            ctx.fillStyle = gameWon ? '#4CAF50' : '#f44336'
            ctx.font = 'bold 36px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(gameWon ? 'Level Complete!' : 'Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 20px Arial'
            ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
            if (score === highScore && score > 0) {
                ctx.fillStyle = '#FFD700'
                ctx.fillText('New High Score!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
            }
        }

        if (isPaused && !gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 32px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
        }

        if (!gameStarted && !gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 32px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('Brick Breaker', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
            ctx.font = '16px Arial'
            ctx.fillText('Use left/right arrows or A/D to move paddle', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
            ctx.fillText('Break all bricks to win!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
            ctx.fillText('Press SPACE or click Start to begin', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)
        }
    }, [score, lives, highScore, gameOver, gameWon, isPaused, gameStarted])

    const updateGame = useCallback(() => {
        if (!gameStarted || gameOver || isPaused) return

        const state = gameState.current
        const { paddle, ball } = state

        // Move paddle
        if (state.keys.left && paddle.x > 0) paddle.x -= PADDLE_SPEED
        if (state.keys.right && paddle.x < CANVAS_WIDTH - PADDLE_WIDTH) paddle.x += PADDLE_SPEED

        // Move ball
        ball.x += ball.dx
        ball.y += ball.dy

        // Speed multiplier
        const speedMultiplier = 1 + (score / 1000) * 0.1
        const currentSpeed = BALL_SPEED * Math.min(speedMultiplier, 1.5)
        const magnitude = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy)
        if (magnitude !== 0) {
            ball.dx = (ball.dx / magnitude) * currentSpeed
            ball.dy = (ball.dy / magnitude) * currentSpeed
        }

        // Check collisions
        const result = checkBallCollision(ball, paddle, state.bricks)
        if (result.lost) {
            setLives(prev => {
                const newLives = prev - 1
                if (newLives <= 0) {
                    setGameOver(true)
                    if (score > highScore) {
                        setHighScore(score)
                        localStorage.setItem('brickBreakerHighScore', score.toString())
                    }
                } else {
                    ball.x = CANVAS_WIDTH / 2
                    ball.y = CANVAS_HEIGHT - 50
                    ball.dx = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1)
                    ball.dy = -BALL_SPEED
                }
                return newLives
            })
        }

        state.ball = result.ball
        state.bricks = result.bricks
        setScore(prev => prev + result.score)

        // Check win
        const remainingBricks = state.bricks.filter(b => b.visible)
        if (remainingBricks.length === 0) {
            setGameWon(true)
            setGameOver(true)
            if (score + result.score > highScore) {
                setHighScore(score + result.score)
                localStorage.setItem('brickBreakerHighScore', (score + result.score).toString())
            }
        }
    }, [gameStarted, gameOver, isPaused, score, highScore])

    const gameLoop = useCallback(() => {
        updateGame()
        render()
        animationRef.current = requestAnimationFrame(gameLoop)
    }, [updateGame, render])

    const startGame = useCallback(() => {
        setGameStarted(true)
        setGameOver(false)
        setGameWon(false)
        setIsPaused(false)
        setScore(0)
        setLives(3)
        setLevel(1)
        initializeGame()
        animationRef.current = requestAnimationFrame(gameLoop)
    }, [initializeGame, gameLoop])

    const restartGame = useCallback(() => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        setGameStarted(false)
        setGameOver(false)
        setGameWon(false)
        setIsPaused(false)
        setScore(0)
        setLives(3)
        setLevel(1)
        setTimeout(() => startGame(), 0)
    }, [startGame])

    const togglePause = useCallback(() => {
        if (!gameStarted || gameOver) return
        setIsPaused(prev => !prev)
    }, [gameStarted, gameOver])

    const resetScore = () => {
        setHighScore(0)
        localStorage.removeItem('brickBreakerHighScore')
    }

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!gameStarted && e.key === ' ') { e.preventDefault(); startGame(); return }
            if (gameStarted && e.key === ' ') { e.preventDefault(); togglePause(); return }
            if (gameOver && e.key === ' ') { e.preventDefault(); restartGame(); return }
            if (!gameStarted || gameOver || isPaused) return
            const state = gameState.current
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                e.preventDefault(); state.keys.left = true
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                e.preventDefault(); state.keys.right = true
            }
        }
        const handleKeyUp = (e) => {
            const state = gameState.current
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.keys.left = false
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.keys.right = false
        }
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [gameStarted, gameOver, isPaused, startGame, togglePause, restartGame])

    // Touch controls
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const handleTouchStart = (e) => {
            e.preventDefault()
            if (!gameStarted && !gameOver) { startGame(); return }
            if (gameOver) { restartGame(); return }
            touchStartX.current = e.touches[0].clientX
        }
        const handleTouchMove = (e) => {
            e.preventDefault()
            if (!gameStarted || gameOver || isPaused) return
            const deltaX = e.touches[0].clientX - touchStartX.current
            if (Math.abs(deltaX) > 20) {
                const state = gameState.current
                if (deltaX > 0) {
                    state.keys.right = true
                    setTimeout(() => { state.keys.right = false }, 100)
                } else {
                    state.keys.left = true
                    setTimeout(() => { state.keys.left = false }, 100)
                }
                touchStartX.current = e.touches[0].clientX
            }
        }
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
        return () => {
            canvas.removeEventListener('touchstart', handleTouchStart)
            canvas.removeEventListener('touchmove', handleTouchMove)
        }
    }, [gameStarted, gameOver, isPaused, startGame, restartGame])

    useEffect(() => {
        animationRef.current = requestAnimationFrame(gameLoop)
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
    }, [gameLoop])

    return (
        <div className="brick-breaker-container">
            <div className="brick-breaker-header">
                <h1>🧱 Brick Breaker</h1>
                <button onClick={resetScore} className="reset-btn">Reset High Score</button>
            </div>

            <div className="brick-breaker-stats">
                <div className="stat"><span>Score</span><span>{score}</span></div>
                <div className="stat"><span>High Score</span><span>{highScore}</span></div>
                <div className="stat"><span>Lives</span><span>{lives}</span></div>
                <div className="stat"><span>Bricks</span><span>{gameState.current.bricks.filter(b => b.visible).length}</span></div>
            </div>

            <div className="brick-breaker-game-area">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="brick-breaker-canvas"
                />

                {isMobile && (
                    <div className="brick-breaker-mobile-controls">
                        <button onTouchStart={() => { gameState.current.keys.left = true; setTimeout(() => { gameState.current.keys.left = false }, 100) }}>
                            ←
                        </button>
                        <button onTouchStart={() => { gameState.current.keys.right = true; setTimeout(() => { gameState.current.keys.right = false }, 100) }}>
                            →
                        </button>
                    </div>
                )}

                <div className="brick-breaker-controls">
                    {!gameStarted ? (
                        <button onClick={startGame} className="btn-primary">Start Game</button>
                    ) : (
                        <>
                            <button onClick={togglePause} disabled={gameOver} className="btn-warning">
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                            {gameOver && (
                                <button onClick={restartGame} className="btn-danger">Restart</button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default BrickBreaker