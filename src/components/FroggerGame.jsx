import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const FroggerGame = () => {
    const navigate = useNavigate()
    const canvasRef = useRef(null)
    const animationRef = useRef(null)
    const touchStartX = useRef(0)
    const touchStartY = useRef(0)
    
    // Game state
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
        } catch {
            return 0
        }
    })
    const [completions, setCompletions] = useState(0)
    
    // Mobile detection
    const [isMobile, setIsMobile] = useState(false)
    
    // Game constants
    const CANVAS_WIDTH = 450
    const CANVAS_HEIGHT = 600
    const GRID_SIZE = 50
    const COLS = 9
    const ROWS = 12
    
    // Game objects
    const gameState = useRef({
        frogX: 4, // Grid position (0-8)
        frogY: 11, // Grid position (0-11, bottom to top)
        cars: [],
        logs: [],
        gameTime: 30
    })

    // Initialize moving objects
    const initializeObjects = useCallback(() => {
        const cars = []
        const logs = []
        
        // Create cars for road rows (rows 3-5 and 7-9)
        for (let row = 3; row <= 5; row++) {
            for (let i = 0; i < 3; i++) {
                cars.push({
                    x: i * 3,
                    y: row,
                    direction: row % 2 === 0 ? 1 : -1,
                    speed: 0.02 + Math.random() * 0.01
                })
            }
        }
        
        for (let row = 7; row <= 9; row++) {
            for (let i = 0; i < 3; i++) {
                cars.push({
                    x: i * 3,
                    y: row,
                    direction: row % 2 === 0 ? 1 : -1,
                    speed: 0.02 + Math.random() * 0.01
                })
            }
        }
        
        // Create logs for water rows (rows 1-2)
        for (let row = 1; row <= 2; row++) {
            for (let i = 0; i < 2; i++) {
                logs.push({
                    x: i * 4.5,
                    y: row,
                    direction: row % 2 === 0 ? -1 : 1,
                    speed: 0.015 + Math.random() * 0.005,
                    width: 2.5
                })
            }
        }
        
        return { cars, logs }
    }, [])

    // Check collisions
    const checkCollisions = useCallback(() => {
        const state = gameState.current
        const frogGridX = state.frogX
        const frogGridY = state.frogY
        
        // Check win condition (reaching top row)
        if (frogGridY === 0) {
            // Infinite mode: increment completions, reset frog and objects, add to score
            setCompletions(prev => prev + 1)
            setScore(prevScore => {
                const newScore = prevScore + timeLeft * 10
                if (newScore > highScore) {
                    setHighScore(newScore)
                    try {
                        localStorage.setItem('froggerHighScore', newScore.toString())
                    } catch (error) {
                        console.warn('Could not save high score:', error)
                    }
                }
                return newScore
            })
            setTimeLeft(30)
            setGameWon(false)
            // Reset frog and objects for next round
            const objects = initializeObjects()
            gameState.current = {
                frogX: 4,
                frogY: 11,
                cars: objects.cars,
                logs: objects.logs,
                gameTime: 30
            }
            return
        }
        
        // Check car collisions (road rows)
        if ((frogGridY >= 3 && frogGridY <= 5) || (frogGridY >= 7 && frogGridY <= 9)) {
            state.cars.forEach(car => {
                if (car.y === frogGridY) {
                    const carLeft = car.x
                    const carRight = car.x + 1
                    if (frogGridX >= carLeft && frogGridX <= carRight) {
                        setGameOver(true)
                        if (score > highScore) {
                            setHighScore(score)
                            try {
                                localStorage.setItem('froggerHighScore', score.toString())
                            } catch (error) {
                                console.warn('Could not save high score:', error)
                            }
                        }
                    }
                }
            })
        }
        
        // Check water drowning (water rows without log)
        if (frogGridY >= 1 && frogGridY <= 2) {
            let onLog = false
            state.logs.forEach(log => {
                if (log.y === frogGridY) {
                    const logLeft = log.x
                    const logRight = log.x + log.width
                    if (frogGridX >= logLeft && frogGridX <= logRight) {
                        onLog = true
                        // Move frog with log
                        state.frogX += log.direction * log.speed
                        // Keep frog within bounds
                        if (state.frogX < 0) state.frogX = COLS - 1
                        if (state.frogX >= COLS) state.frogX = 0
                    }
                }
            })
            
            if (!onLog) {
                setGameOver(true)
                if (score > highScore) {
                    setHighScore(score)
                    try {
                        localStorage.setItem('froggerHighScore', score.toString())
                    } catch (error) {
                        console.warn('Could not save high score:', error)
                    }
                }
            }
        }
    }, [score, timeLeft, highScore])

    // Update moving objects
    const updateObjects = useCallback(() => {
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
    }, [])

    // Render game
    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        const state = gameState.current

        // Determine dark mode
        const darkMode = completions > 0 && completions % 3 === 0

        // Clear canvas
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        // Draw background zones
        if (darkMode) {
            // Safe zones (dark green)
            ctx.fillStyle = '#1a3a1a'
            ctx.fillRect(0, 0, CANVAS_WIDTH, GRID_SIZE) // Top safe zone
            ctx.fillRect(0, 6 * GRID_SIZE, CANVAS_WIDTH, GRID_SIZE) // Middle safe zone
            ctx.fillRect(0, 10 * GRID_SIZE, CANVAS_WIDTH, 2 * GRID_SIZE) // Bottom safe zone

            // Water zones (dark blue)
            ctx.fillStyle = '#1a1a3a'
            ctx.fillRect(0, GRID_SIZE, CANVAS_WIDTH, 2 * GRID_SIZE)

            // Road zones (dark gray)
            ctx.fillStyle = '#222'
            ctx.fillRect(0, 3 * GRID_SIZE, CANVAS_WIDTH, 3 * GRID_SIZE)
            ctx.fillRect(0, 7 * GRID_SIZE, CANVAS_WIDTH, 3 * GRID_SIZE)
        } else {
            // Safe zones (green)
            ctx.fillStyle = '#90EE90'
            ctx.fillRect(0, 0, CANVAS_WIDTH, GRID_SIZE) // Top safe zone
            ctx.fillRect(0, 6 * GRID_SIZE, CANVAS_WIDTH, GRID_SIZE) // Middle safe zone
            ctx.fillRect(0, 10 * GRID_SIZE, CANVAS_WIDTH, 2 * GRID_SIZE) // Bottom safe zone

            // Water zones (blue)
            ctx.fillStyle = '#4169E1'
            ctx.fillRect(0, GRID_SIZE, CANVAS_WIDTH, 2 * GRID_SIZE)

            // Road zones (gray)
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
            // Add log texture
            ctx.fillStyle = darkMode ? '#2d1a07' : '#654321'
            ctx.fillRect(x + 5, y + 10, width - 10, GRID_SIZE - 20)
            ctx.fillStyle = darkMode ? '#4b2e0e' : '#8B4513'
        })

        // Draw cars
        ctx.fillStyle = darkMode ? '#b91c1c' : '#FF0000'
        state.cars.forEach(car => {
            const x = car.x * GRID_SIZE
            const y = car.y * GRID_SIZE
            ctx.fillRect(x, y + 10, GRID_SIZE, GRID_SIZE - 20)
            // Add car details
            ctx.fillStyle = darkMode ? '#222' : '#000'
            ctx.fillRect(x + 10, y + 15, 10, 10)
            ctx.fillRect(x + 30, y + 15, 10, 10)
            ctx.fillStyle = darkMode ? '#b91c1c' : '#FF0000'
        })

        // Draw frog
        ctx.fillStyle = darkMode ? '#22d3ee' : '#32CD32'
        const frogPixelX = state.frogX * GRID_SIZE + 10
        const frogPixelY = state.frogY * GRID_SIZE + 10
        ctx.fillRect(frogPixelX, frogPixelY, GRID_SIZE - 20, GRID_SIZE - 20)
        // Add frog eyes
        ctx.fillStyle = darkMode ? '#fff' : '#000'
        ctx.fillRect(frogPixelX + 5, frogPixelY + 5, 8, 8)
        ctx.fillRect(frogPixelX + 17, frogPixelY + 5, 8, 8)

        // Draw grid lines for clarity
        ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255, 255, 255, 0.3)'
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

        // Draw UI overlay
        ctx.fillStyle = darkMode ? '#fff' : '#fff'
        ctx.font = 'bold 20px Inter'
        ctx.textAlign = 'left'
        ctx.fillText(`Score: ${score}`, 10, 30)
        ctx.textAlign = 'right'
        ctx.fillText(`Time: ${timeLeft}`, CANVAS_WIDTH - 10, 30)

        // Draw game over screen
        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 36px Inter'
            ctx.textAlign = 'center'
            if (gameWon) {
                ctx.fillText('You Win!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)
                ctx.fillStyle = darkMode ? '#22d3ee' : '#32CD32'
            } else {
                ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)
                ctx.fillStyle = darkMode ? '#b91c1c' : '#FF6B6B'
            }
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

    // Move frog
    const moveFrog = useCallback((direction) => {
        if (!gameStarted || gameOver || isPaused) return
        
        const state = gameState.current
        
        switch (direction) {
            case 'up':
                if (state.frogY > 0) {
                    state.frogY--
                    setScore(prev => prev + 10)
                }
                break
            case 'down':
                if (state.frogY < ROWS - 1) {
                    state.frogY++
                }
                break
            case 'left':
                if (state.frogX > 0) {
                    state.frogX--
                }
                break
            case 'right':
                if (state.frogX < COLS - 1) {
                    state.frogX++
                }
                break
        }
    }, [gameStarted, gameOver, isPaused])

    // Update game logic
    const updateGame = useCallback(() => {
        if (!gameStarted || gameOver || isPaused) return

        updateObjects()
        checkCollisions()
    }, [gameStarted, gameOver, isPaused, updateObjects, checkCollisions])

    // Game loop
    const gameLoop = useCallback(() => {
        updateGame()
        render()
        if (!gameOver && gameStarted && !isPaused) {
            animationRef.current = requestAnimationFrame(gameLoop)
        }
    }, [updateGame, render, gameOver, gameStarted, isPaused])

    // Timer effect
    useEffect(() => {
        if (!gameStarted || gameOver || isPaused) return

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setGameOver(true)
                    if (score > highScore) {
                        setHighScore(score)
                        try {
                            localStorage.setItem('froggerHighScore', score.toString())
                        } catch (error) {
                            console.warn('Could not save high score:', error)
                        }
                    }
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [gameStarted, gameOver, isPaused, score, highScore])

    // Start game
    const startGame = useCallback(() => {
        setGameStarted(true)
        setGameOver(false)
        setGameWon(false)
        setIsPaused(false)
        setScore(0)
        setTimeLeft(30)
        
        // Reset game state
        const objects = initializeObjects()
        gameState.current = {
            frogX: 4,
            frogY: 11,
            cars: objects.cars,
            logs: objects.logs,
            gameTime: 30
        }
        
        animationRef.current = requestAnimationFrame(gameLoop)
    }, [initializeObjects, gameLoop])

    // Restart game
    const restartGame = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
        }
        startGame()
    }, [startGame])

    // Pause/Resume game
    const togglePause = useCallback(() => {
        if (!gameStarted || gameOver) return
        
        setIsPaused(prev => {
            const newPaused = !prev
            if (!newPaused) {
                animationRef.current = requestAnimationFrame(gameLoop)
            } else if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            return newPaused
        })
    }, [gameStarted, gameOver, gameLoop])

    // Handle keyboard input
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!gameStarted && e.key === ' ') {
                e.preventDefault()
                startGame()
                return
            }
            
            if (gameStarted && e.key === ' ') {
                e.preventDefault()
                togglePause()
                return
            }
            
            if (!gameStarted || gameOver || isPaused) return
            
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault()
                    moveFrog('up')
                    break
                case 'ArrowDown':
                    e.preventDefault()
                    moveFrog('down')
                    break
                case 'ArrowLeft':
                    e.preventDefault()
                    moveFrog('left')
                    break
                case 'ArrowRight':
                    e.preventDefault()
                    moveFrog('right')
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [gameStarted, gameOver, isPaused, startGame, togglePause, moveFrog])

    // Handle mobile controls
    const handleMobileControl = useCallback((direction) => {
        moveFrog(direction)
    }, [moveFrog])

    // Touch controls for mobile
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const handleTouchStart = (e) => {
            e.preventDefault()
            if (!gameStarted && !gameOver) {
                startGame()
                return
            }
            
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
                    if (deltaX > 0) {
                        handleMobileControl('right')
                    } else {
                        handleMobileControl('left')
                    }
                    touchStartX.current = e.touches[0].clientX
                    touchStartY.current = e.touches[0].clientY
                }
            } else {
                if (Math.abs(deltaY) > 30) {
                    if (deltaY > 0) {
                        handleMobileControl('down')
                    } else {
                        handleMobileControl('up')
                    }
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
    }, [gameStarted, gameOver, isPaused, startGame, handleMobileControl])

    // Start animation loop when game starts
    useEffect(() => {
        if (gameStarted && !gameOver && !isPaused) {
            animationRef.current = requestAnimationFrame(gameLoop)
        }
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [gameStarted, gameOver, isPaused, gameLoop])

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="game-board p-8 rounded-2xl fade-in max-w-2xl w-full transform transition-all duration-500">
                <div className="flex justify-between items-center mb-6">
                    <button 
                        className="btn-secondary text-white px-4 py-2 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105"
                        onClick={() => navigate('/')}
                        aria-label="Back to Home"
                    >
                        ← Back to Home
                    </button>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-800">🐸 Frogger</h1>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-semibold text-gray-700">Score: {score}</div>
                        <div className="text-sm text-gray-600">High: {highScore}</div>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    {/* Game Canvas */}
                    <div className="relative mb-6">
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            className="border-4 border-gray-300 rounded-lg shadow-lg"
                            style={{
                                maxWidth: '100%',
                                height: 'auto',
                                aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`
                            }}
                        />
                        
                        {/* Timer bar */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-3/4 h-2 bg-gray-300 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-1000"
                                style={{ width: `${(timeLeft / 30) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Mobile Controls */}
                    {isMobile && (
                        <div className="mb-6">
                            <div className="flex flex-col items-center gap-2">
                                <button 
                                    className="btn-secondary text-white px-4 py-2 rounded-lg font-bold text-2xl transform transition-all duration-200 hover:scale-105"
                                    onClick={() => handleMobileControl('up')}
                                    disabled={!gameStarted || gameOver || isPaused}
                                    aria-label="Move up"
                                >
                                    ↑
                                </button>
                                <div className="flex gap-2">
                                    <button 
                                        className="btn-secondary text-white px-4 py-2 rounded-lg font-bold text-2xl transform transition-all duration-200 hover:scale-105"
                                        onClick={() => handleMobileControl('left')}
                                        disabled={!gameStarted || gameOver || isPaused}
                                        aria-label="Move left"
                                    >
                                        ←
                                    </button>
                                    <button 
                                        className="btn-secondary text-white px-4 py-2 rounded-lg font-bold text-2xl transform transition-all duration-200 hover:scale-105"
                                        onClick={() => handleMobileControl('right')}
                                        disabled={!gameStarted || gameOver || isPaused}
                                        aria-label="Move right"
                                    >
                                        →
                                    </button>
                                </div>
                                <button 
                                    className="btn-secondary text-white px-4 py-2 rounded-lg font-bold text-2xl transform transition-all duration-200 hover:scale-105"
                                    onClick={() => handleMobileControl('down')}
                                    disabled={!gameStarted || gameOver || isPaused}
                                    aria-label="Move down"
                                >
                                    ↓
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Game Controls */}
                    <div className="flex flex-wrap gap-4 mb-6 justify-center">
                        {!gameStarted ? (
                            <button 
                                className="btn-primary text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                                onClick={startGame}
                                aria-label="Start the game"
                            >
                                🎮 Start Game
                            </button>
                        ) : (
                            <button 
                                className="btn-secondary text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                                onClick={togglePause}
                                disabled={gameOver}
                                aria-label={isPaused ? "Resume the game" : "Pause the game"}
                            >
                                {isPaused ? "▶️ Resume" : "⏸️ Pause"}
                            </button>
                        )}
                        
                        <button 
                            className="btn-danger text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                            onClick={restartGame}
                            aria-label="Restart the game"
                        >
                            🔄 Restart
                        </button>
                    </div>

                    {/* Game Status */}
                    {gameOver && (
                        <div className={`text-center mb-4 game-over p-6 rounded-xl border-2 ${
                            gameWon 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <h2 className={`text-2xl font-bold mb-2 ${
                                gameWon ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {gameWon ? '🎉 You Win!' : '💥 Game Over!'}
                            </h2>
                            <p className="text-gray-700">Final Score: {score}</p>
                            {score === highScore && score > 0 && (
                                <p className="text-yellow-600 font-bold animate-bounce">🏆 New High Score!</p>
                            )}
                        </div>
                    )}

                    {isPaused && !gameOver && gameStarted && (
                        <div className="text-center mb-4 bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                            <h2 className="text-xl font-bold text-blue-600">⏸️ Game Paused</h2>
                            <p className="text-sm text-gray-600 mt-2">Press spacebar to resume</p>
                        </div>
                    )}

                    {!gameStarted && !gameOver && (
                        <div className="text-center mb-4 bg-green-50 p-4 rounded-xl border-2 border-green-200">
                            <h2 className="text-xl font-bold text-green-600">🎯 Ready to Cross!</h2>
                            <p className="text-sm text-gray-600 mt-2">Press spacebar or click Start Game</p>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="text-center text-gray-600 text-sm max-w-md">
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <p className="mb-2">🎯 <strong>Controls:</strong> {isMobile ? 'Use direction buttons or swipe • ' : 'Use arrow keys to move • '}Spacebar to pause</p>
                            <p className="mb-2">🐸 Cross roads and rivers to reach the top! Avoid cars and stay on logs in water!</p>
                            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                                <div className="bg-blue-100 p-2 rounded">
                                    <span className="font-semibold">Time:</span> {timeLeft}s
                                </div>
                                <div className="bg-green-100 p-2 rounded">
                                    <span className="font-semibold">Progress:</span> {Math.max(0, 11 - gameState.current.frogY)}/12
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FroggerGame