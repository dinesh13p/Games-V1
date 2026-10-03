import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, COLS, ROWS,
    initializeObjects, checkCollisions
} from './FroggerGame.logic'
import './FroggerGame.css'

const FroggerGame = () => {
    const canvasRef = useRef(null)
    const animationRef = useRef(null)
    const touchStartX = useRef(0)
    const touchStartY = useRef(0)

    const [gameStarted, setGameStarted] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [score, setScore] = useState(0)
    const [timeLeft, setTimeLeft] = useState(30)
    const [gameWon, setGameWon] = useState(false)
    const [highScore, setHighScore] = useState(() => {
        try {
            const saved = localStorage.getItem('froggerHighScore')
            return saved ? parseInt(saved) : 0
        } catch { return 0 }
    })
    const [completions, setCompletions] = useState(0)
    const [isMobile, setIsMobile] = useState(false)

    const gameState = useRef({
        frogX: 4,
        frogY: 11,
        cars: [],
        logs: [],
        gameTime: 30
    })

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const initializeLevel = useCallback(() => {
        const objects = initializeObjects(completions)
        gameState.current.frogX = 4
        gameState.current.frogY = 11
        gameState.current.cars = objects.cars
        gameState.current.logs = objects.logs
        gameState.current.gameTime = 30
    }, [completions])

    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const state = gameState.current
        const darkMode = completions % 2 === 1

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        // Draw zones
        if (darkMode) {
            ctx.fillStyle = '#1a3a1a'
            ctx.fillRect(0, 0, CANVAS_WIDTH, GRID_SIZE)
            ctx.fillRect(0, 6 * GRID_SIZE, CANVAS_WIDTH, GRID_SIZE)
            ctx.fillRect(0, 10 * GRID_SIZE, CANVAS_WIDTH, 2 * GRID_SIZE)
            ctx.fillStyle = '#1a1a3a'
            ctx.fillRect(0, GRID_SIZE, CANVAS_WIDTH, 2 * GRID_SIZE)
            ctx.fillStyle = '#222'
            ctx.fillRect(0, 3 * GRID_SIZE, CANVAS_WIDTH, 3 * GRID_SIZE)
            ctx.fillRect(0, 7 * GRID_SIZE, CANVAS_WIDTH, 3 * GRID_SIZE)
        } else {
            ctx.fillStyle = '#90EE90'
            ctx.fillRect(0, 0, CANVAS_WIDTH, GRID_SIZE)
            ctx.fillRect(0, 6 * GRID_SIZE, CANVAS_WIDTH, GRID_SIZE)
            ctx.fillRect(0, 10 * GRID_SIZE, CANVAS_WIDTH, 2 * GRID_SIZE)
            ctx.fillStyle = '#4169E1'
            ctx.fillRect(0, GRID_SIZE, CANVAS_WIDTH, 2 * GRID_SIZE)
            ctx.fillStyle = '#696969'
            ctx.fillRect(0, 3 * GRID_SIZE, CANVAS_WIDTH, 3 * GRID_SIZE)
            ctx.fillRect(0, 7 * GRID_SIZE, CANVAS_WIDTH, 3 * GRID_SIZE)
        }

        // Draw logs
        ctx.fillStyle = darkMode ? '#4b2e0e' : '#8B4513'
        state.logs.forEach(log => {
            const x = log.x * GRID_SIZE
            const y = log.y * GRID_SIZE
            const width = log.width * GRID_SIZE
            ctx.fillRect(x, y, width, GRID_SIZE)
            ctx.fillStyle = darkMode ? '#2d1a07' : '#654321'
            ctx.fillRect(x + 5, y + 10, width - 10, GRID_SIZE - 20)
            ctx.fillStyle = darkMode ? '#4b2e0e' : '#8B4513'
        })

        // Draw cars
        state.cars.forEach(car => {
            const x = car.x * GRID_SIZE
            const y = car.y * GRID_SIZE
            const usePurple = completions > 0 && completions % 2 === 0 && !darkMode
            ctx.fillStyle = usePurple ? '#A020F0' : (darkMode ? '#b91c1c' : '#FF0000')
            ctx.fillRect(x, y + 10, GRID_SIZE, GRID_SIZE - 20)
            ctx.fillStyle = usePurple ? '#222' : '#222'
            ctx.fillRect(x + 10, y + 15, 10, 10)
            ctx.fillRect(x + 30, y + 15, 10, 10)
        })

        // Draw frog
        ctx.fillStyle = darkMode ? '#22d3ee' : '#32CD32'
        const frogPixelX = state.frogX * GRID_SIZE + 10
        const frogPixelY = state.frogY * GRID_SIZE + 10
        ctx.fillRect(frogPixelX, frogPixelY, GRID_SIZE - 20, GRID_SIZE - 20)
        ctx.fillStyle = darkMode ? '#fff' : '#000'
        ctx.fillRect(frogPixelX + 5, frogPixelY + 5, 8, 8)
        ctx.fillRect(frogPixelX + 17, frogPixelY + 5, 8, 8)

        // Grid lines
        ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 1
        for (let i = 0; i <= ROWS; i++) {
            ctx.beginPath()
            ctx.moveTo(0, i * GRID_SIZE)
            ctx.lineTo(CANVAS_WIDTH, i * GRID_SIZE)
            ctx.stroke()
        }
        for (let i = 0; i <= COLS; i++) {
            ctx.beginPath()
            ctx.moveTo(i * GRID_SIZE, 0)
            ctx.lineTo(i * GRID_SIZE, CANVAS_HEIGHT)
            ctx.stroke()
        }

        // UI
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 20px Inter'
        ctx.textAlign = 'left'
        ctx.fillText(`Score: ${score}`, 10, 30)
        ctx.textAlign = 'right'
        ctx.fillText(`Time: ${timeLeft}`, CANVAS_WIDTH - 10, 30)

        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 36px Inter'
            ctx.textAlign = 'center'
            ctx.fillText(gameWon ? 'You Win!' : 'Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)
            ctx.font = 'bold 20px Inter'
            ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
            if (score === highScore && score > 0) {
                ctx.fillStyle = '#FFD700'
                ctx.fillText('New High Score!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
            }
        }

        if (isPaused && !gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 32px Inter'
            ctx.textAlign = 'center'
            ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
        }

        if (!gameStarted && !gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 28px Inter'
            ctx.textAlign = 'center'
            ctx.fillText('Frogger', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
            ctx.font = '18px Inter'
            ctx.fillText('Cross the road and river safely!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
            ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
        }
    }, [score, timeLeft, gameOver, gameWon, gameStarted, isPaused, highScore, completions])

    const moveFrog = useCallback((direction) => {
        if (!gameStarted || gameOver || isPaused) return
        const state = gameState.current
        switch (direction) {
            case 'up': if (state.frogY > 0) { state.frogY--; setScore(prev => prev + 10) } break
            case 'down': if (state.frogY < ROWS - 1) state.frogY++; break
            case 'left': if (state.frogX > 0) state.frogX--; break
            case 'right': if (state.frogX < COLS - 1) state.frogX++; break
        }
    }, [gameStarted, gameOver, isPaused])

    const updateGame = useCallback(() => {
        if (!gameStarted || gameOver || isPaused) return
        const state = gameState.current

        // Update cars
        state.cars.forEach(car => {
            car.x += car.direction * car.speed
            if (car.x > COLS + 1) car.x = -2
            if (car.x < -2) car.x = COLS + 1
        })

        // Update logs
        state.logs.forEach(log => {
            log.x += log.direction * log.speed
            if (log.x > COLS + 2) log.x = -log.width - 1
            if (log.x < -log.width - 1) log.x = COLS + 2
        })

        // Check collisions
        const result = checkCollisions(state.frogX, state.frogY, state.cars, state.logs, completions)

        if (result.collision) {
            setGameOver(true)
            if (score > highScore) {
                setHighScore(score)
                localStorage.setItem('froggerHighScore', score.toString())
            }
            return
        }

        if (result.win) {
            setCompletions(prev => prev + 1)
            setScore(prev => prev + timeLeft * 10)
            setTimeLeft(30)
            initializeLevel()
            return
        }

        if (result.onLog) {
            state.frogX += result.logDirection * result.logSpeed
            if (state.frogX < 0) state.frogX = COLS - 1
            if (state.frogX >= COLS) state.frogX = 0
        }
    }, [gameStarted, gameOver, isPaused, completions, score, timeLeft, highScore, initializeLevel])

    const gameLoop = useCallback(() => {
        updateGame()
        render()
        if (!gameOver && gameStarted && !isPaused) {
            animationRef.current = requestAnimationFrame(gameLoop)
        }
    }, [updateGame, render, gameOver, gameStarted, isPaused])

    const startGame = useCallback(() => {
        setGameStarted(true)
        setGameOver(false)
        setGameWon(false)
        setIsPaused(false)
        setScore(0)
        setTimeLeft(30)
        initializeLevel()
        animationRef.current = requestAnimationFrame(gameLoop)
    }, [initializeLevel, gameLoop])

    const restartGame = useCallback(() => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        setGameStarted(false)
        setGameOver(false)
        setGameWon(false)
        setIsPaused(false)
        setScore(0)
        setTimeLeft(30)
        setCompletions(0)
        setTimeout(() => startGame(), 0)
    }, [startGame])

    const togglePause = useCallback(() => {
        if (!gameStarted || gameOver) return
        setIsPaused(prev => {
            const newPaused = !prev
            if (!newPaused) animationRef.current = requestAnimationFrame(gameLoop)
            else if (animationRef.current) cancelAnimationFrame(animationRef.current)
            return newPaused
        })
    }, [gameStarted, gameOver, gameLoop])

    // Timer
    useEffect(() => {
        if (!gameStarted || gameOver || isPaused) return
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setGameOver(true)
                    if (score > highScore) {
                        setHighScore(score)
                        localStorage.setItem('froggerHighScore', score.toString())
                    }
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [gameStarted, gameOver, isPaused, score, highScore])

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!gameStarted && e.key === ' ') { e.preventDefault(); startGame(); return }
            if (gameStarted && e.key === ' ') { e.preventDefault(); togglePause(); return }
            if (!gameStarted || gameOver || isPaused) return
            switch (e.key) {
                case 'ArrowUp': e.preventDefault(); moveFrog('up'); break
                case 'ArrowDown': e.preventDefault(); moveFrog('down'); break
                case 'ArrowLeft': e.preventDefault(); moveFrog('left'); break
                case 'ArrowRight': e.preventDefault(); moveFrog('right'); break
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [gameStarted, gameOver, isPaused, startGame, togglePause, moveFrog])

    // Touch controls
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const handleTouchStart = (e) => {
            e.preventDefault()
            if (!gameStarted && !gameOver) { startGame(); return }
            touchStartX.current = e.touches[0].clientX
            touchStartY.current = e.touches[0].clientY
        }
        const handleTouchMove = (e) => {
            e.preventDefault()
            if (!gameStarted || gameOver || isPaused) return
            const deltaX = e.touches[0].clientX - touchStartX.current
            const deltaY = e.touches[0].clientY - touchStartY.current
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > 30) {
                    moveFrog(deltaX > 0 ? 'right' : 'left')
                    touchStartX.current = e.touches[0].clientX
                    touchStartY.current = e.touches[0].clientY
                }
            } else {
                if (Math.abs(deltaY) > 30) {
                    moveFrog(deltaY > 0 ? 'down' : 'up')
                    touchStartX.current = e.touches[0].clientX
                    touchStartY.current = e.touches[0].clientY
                }
            }
        }
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
        return () => {
            canvas.removeEventListener('touchstart', handleTouchStart)
            canvas.removeEventListener('touchmove', handleTouchMove)
        }
    }, [gameStarted, gameOver, isPaused, startGame, moveFrog])

    useEffect(() => {
        if (gameStarted && !gameOver && !isPaused) {
            animationRef.current = requestAnimationFrame(gameLoop)
        }
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
    }, [gameStarted, gameOver, isPaused, gameLoop])

    const resetScore = () => {
        setHighScore(0)
        localStorage.removeItem('froggerHighScore')
    }

    return (
        <div className="frogger-container">
            <div className="frogger-header">
                <h1>🐸 Frogger</h1>
                <button onClick={resetScore} className="reset-btn">Reset High Score</button>
            </div>

            <div className="frogger-stats">
                <div className="stat"><span>Score</span><span>{score}</span></div>
                <div className="stat"><span>High Score</span><span>{highScore}</span></div>
                <div className="stat"><span>Time</span><span>{timeLeft}s</span></div>
                <div className="stat"><span>Progress</span><span>{Math.max(0, 11 - gameState.current.frogY)}/12</span></div>
            </div>

            <div className="frogger-game-area">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="frogger-canvas"
                />

                {isMobile && (
                    <div className="frogger-mobile-controls">
                        <button onClick={() => moveFrog('up')} className="up">↑</button>
                        <div className="row">
                            <button onClick={() => moveFrog('left')}>←</button>
                            <button onClick={() => moveFrog('down')}>↓</button>
                            <button onClick={() => moveFrog('right')}>→</button>
                        </div>
                    </div>
                )}

                <div className="frogger-controls">
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

export default FroggerGame