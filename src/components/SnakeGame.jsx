import React, { useState, useEffect, useCallback, useRef } from 'react'

const SnakeGame = () => {
    const boardSize = 20
    const initialSpeed = 150
    
    const [snake, setSnake] = useState([[10, 10]])
    const [food, setFood] = useState([5, 5])
    const [direction, setDirection] = useState([0, 1])
    const directionChangedRef = useRef(false)
    const [gameOver, setGameOver] = useState(false)
    const [score, setScore] = useState(0)
    const [gameStarted, setGameStarted] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [speed, setSpeed] = useState(initialSpeed)
    const [cellSize, setCellSize] = useState(20)
    const [isMobile, setIsMobile] = useState(false)
    const [highScore, setHighScore] = useState(() => {
        try {
            const saved = localStorage.getItem('snakeHighScore')
            return saved ? parseInt(saved) : 0
        } catch {
            return 0
        }
    })

    const gridRef = useRef(null)
    const touchStartX = useRef(0)
    const touchStartY = useRef(0)

    // Generate food at random position
    const generateFood = useCallback(() => {
        let newFood
        do {
            newFood = [
                Math.floor(Math.random() * boardSize),
                Math.floor(Math.random() * boardSize)
            ]
        } while (snake.some(segment => segment[0] === newFood[0] && segment[1] === newFood[1]))
        return newFood
    }, [snake, boardSize])

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window)
            setCellSize(window.innerWidth <= 768 ? 15 : 20)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Keyboard controls
    useEffect(() => {
        const handleKeyPress = (e) => {
            e.preventDefault()
            
            if (e.code === 'Space') {
                if (!gameStarted) {
                    startGame()
                } else if (!gameOver) {
                    pauseGame()
                }
                return
            }

            if (!gameStarted || gameOver || isPaused) return
            if (directionChangedRef.current) return

            switch (e.key) {
                case 'ArrowUp':
                    handleDirectionChange([-1, 0])
                    break
                case 'ArrowDown':
                    handleDirectionChange([1, 0])
                    break
                case 'ArrowLeft':
                    handleDirectionChange([0, -1])
                    break
                case 'ArrowRight':
                    handleDirectionChange([0, 1])
                    break
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [gameStarted, gameOver, isPaused, direction])

    // Touch event handlers for mobile
    useEffect(() => {
        if (!isMobile) return
        const grid = gridRef.current
        if (!grid) return

        function handleTouchStart(e) {
            e.preventDefault()
            touchStartX.current = e.touches[0].clientX
            touchStartY.current = e.touches[0].clientY
        }

        function handleTouchMove(e) {
            e.preventDefault()
            if (!gameStarted || gameOver || isPaused) return
            
            const deltaX = e.touches[0].clientX - touchStartX.current
            const deltaY = e.touches[0].clientY - touchStartY.current
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > 20) {
                    if (deltaX > 0 && direction[1] !== -1) handleDirectionChange([0, 1]) // right
                    else if (deltaX < 0 && direction[1] !== 1) handleDirectionChange([0, -1]) // left
                    touchStartX.current = e.touches[0].clientX
                    touchStartY.current = e.touches[0].clientY
                }
            } else {
                if (Math.abs(deltaY) > 20) {
                    if (deltaY > 0 && direction[0] !== -1) handleDirectionChange([1, 0]) // down
                    else if (deltaY < 0 && direction[0] !== 1) handleDirectionChange([-1, 0]) // up
                    touchStartX.current = e.touches[0].clientX
                    touchStartY.current = e.touches[0].clientY
                }
            }
        }

        grid.addEventListener('touchstart', handleTouchStart, { passive: false })
        grid.addEventListener('touchmove', handleTouchMove, { passive: false })
        
        return () => {
            grid.removeEventListener('touchstart', handleTouchStart)
            grid.removeEventListener('touchmove', handleTouchMove)
        }
    }, [direction, gameStarted, gameOver, isPaused, isMobile])

    // Game loop
    useEffect(() => {
        if (gameOver || !gameStarted || isPaused) return

        const interval = setInterval(() => {
            setSnake(prev => {
                const head = prev[0]
                const newHead = [head[0] + direction[0], head[1] + direction[1]]

                // Check wall collision
                if (newHead[0] < 0 || newHead[1] < 0 || newHead[0] >= boardSize || newHead[1] >= boardSize) {
                    setGameOver(true)
                    if (score > highScore) {
                        const newHigh = score
                        setHighScore(newHigh)
                        try {
                            localStorage.setItem('snakeHighScore', newHigh.toString())
                        } catch (error) {
                            console.warn('Could not save high score:', error)
                        }
                    }
                    return prev
                }

                // Check self collision
                if (prev.some(seg => seg[0] === newHead[0] && seg[1] === newHead[1])) {
                    setGameOver(true)
                    if (score > highScore) {
                        const newHigh = score
                        setHighScore(newHigh)
                        try {
                            localStorage.setItem('snakeHighScore', newHigh.toString())
                        } catch (error) {
                            console.warn('Could not save high score:', error)
                        }
                    }
                    return prev
                }

                let newSnake = [newHead, ...prev]

                // Check food collision
                if (newHead[0] === food[0] && newHead[1] === food[1]) {
                    setFood(generateFood())
                    setScore(s => s + 10)
                    // Increase speed slightly
                    setSpeed(currentSpeed => Math.max(80, currentSpeed - 2))
                } else {
                    newSnake.pop()
                }

                return newSnake
            })
        }, speed)

        return () => clearInterval(interval)
    }, [direction, food, gameOver, gameStarted, isPaused, speed, score, highScore, generateFood])

    const startGame = () => {
        setGameStarted(true)
        setIsPaused(false)
    }

    const pauseGame = () => {
        if (gameStarted && !gameOver) {
            setIsPaused(!isPaused)
        }
    }

    const restartGame = () => {
        setSnake([[10, 10]])
        setFood([5, 5])
        setDirection([0, 1])
        setGameOver(false)
        setScore(0)
        setGameStarted(true)
        setIsPaused(false)
        setSpeed(initialSpeed)
        directionChangedRef.current = false
    }

    // Allow only one direction change per tick
    useEffect(() => {
        directionChangedRef.current = false
    }, [snake])

    const handleDirectionChange = (newDirection) => {
        if (!gameStarted || gameOver || isPaused) return
        if (directionChangedRef.current) return
        const [newDirX, newDirY] = newDirection
        const [currentDirX, currentDirY] = direction
        // Prevent reversing into itself
        if (newDirX === -currentDirX && newDirY === -currentDirY) return
        setDirection(newDirection)
        directionChangedRef.current = true
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center py-8">
            <main className="w-full flex flex-col items-center justify-center">
                <div className="max-w-2xl w-full mx-auto p-6 rounded-3xl shadow-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-lg">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-20"></div> {/* Spacer for symmetry */}
                        <h1 className="text-3xl font-bold text-white">🐍 Snake Game</h1>
                        <div className="text-right">
                            <div className="text-lg font-semibold text-white">Score: {score}</div>
                            <div className="text-sm text-gray-300">High: {highScore}</div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        <div 
                            ref={gridRef}
                            className="grid border-4 border-gray-300 rounded-lg overflow-hidden mb-6 bg-gray-50 shadow-lg"
                            style={{
                                gridTemplateRows: `repeat(${boardSize}, ${cellSize}px)`,
                                gridTemplateColumns: `repeat(${boardSize}, ${cellSize}px)`,
                                width: `${cellSize * boardSize}px`,
                                height: `${cellSize * boardSize}px`,
                            }}
                            role="presentation"
                            aria-label="Snake game board"
                        >
                            {Array.from({ length: boardSize }).map((_, row) =>
                                Array.from({ length: boardSize }).map((_, col) => {
                                    const isSnake = snake.some(seg => seg[0] === row && seg[1] === col)
                                    const isHead = snake[0] && snake[0][0] === row && snake[0][1] === col
                                    const isFood = food[0] === row && food[1] === col
                                    
                                    return (
                                        <div
                                            key={`${row}-${col}`}
                                            className={`transition-all duration-100 ${
                                                isHead 
                                                    ? "bg-green-600 shadow-lg animate-pulse" 
                                                    : isSnake 
                                                    ? "bg-green-400" 
                                                    : isFood 
                                                    ? "bg-red-500 rounded-full animate-pulse shadow-md" 
                                                    : "bg-gray-100 hover:bg-gray-200"
                                            }`}
                                        />
                                    )
                                })
                            )}
                        </div>

                        {/* Mobile Controls */}
                        {isMobile && (
                            <div className="mb-6">
                                <div className="flex flex-col items-center gap-2">
                                    <button
                                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold text-2xl transform transition-all duration-200 hover:scale-105 disabled:opacity-50"
                                        onClick={() => handleDirectionChange([-1, 0])}
                                        disabled={!gameStarted || gameOver || isPaused}
                                    >
                                        ↑
                                    </button>
                                    <div className="flex gap-2">
                                        <button
                                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold text-2xl transform transition-all duration-200 hover:scale-105 disabled:opacity-50"
                                            onClick={() => handleDirectionChange([0, -1])}
                                            disabled={!gameStarted || gameOver || isPaused}
                                        >
                                            ←
                                        </button>
                                        <button
                                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold text-2xl transform transition-all duration-200 hover:scale-105 disabled:opacity-50"
                                            onClick={() => handleDirectionChange([0, 1])}
                                            disabled={!gameStarted || gameOver || isPaused}
                                        >
                                            →
                                        </button>
                                    </div>
                                    <button
                                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold text-2xl transform transition-all duration-200 hover:scale-105 disabled:opacity-50"
                                        onClick={() => handleDirectionChange([1, 0])}
                                        disabled={!gameStarted || gameOver || isPaused}
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
                                    className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 font-bold text-white transform transition-all duration-200 hover:scale-105"
                                    onClick={startGame}
                                    aria-label="Start the game"
                                >
                                    🎮 Start Game
                                </button>
                            ) : (
                                <button
                                    className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 font-bold text-white transform transition-all duration-200 hover:scale-105 disabled:opacity-50"
                                    onClick={pauseGame}
                                    disabled={gameOver}
                                    aria-label={isPaused ? "Resume the game" : "Pause the game"}
                                >
                                    {isPaused ? "▶️ Resume" : "⏸️ Pause"}
                                </button>
                            )}
                            {gameOver && (
                                <button
                                    className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 font-bold text-white transform transition-all duration-200 hover:scale-105"
                                    onClick={restartGame}
                                    aria-label="Restart the game"
                                >
                                    🔄 Restart
                                </button>
                            )}
                        </div>

                        {/* Game Status */}
                        {gameOver && (
                            <div className="text-center mb-4 bg-red-400/20 backdrop-blur p-6 rounded-xl border-2 border-red-400/50">
                                <h2 className="text-2xl font-bold text-white mb-2">💀 Game Over!</h2>
                                <p className="text-white/80">Final Score: {score}</p>
                                {score === highScore && score > 0 && (
                                    <p className="text-yellow-400 font-bold animate-bounce">🎉 New High Score!</p>
                                )}
                            </div>
                        )}

                        {isPaused && !gameOver && gameStarted && (
                            <div className="text-center mb-4 bg-blue-400/20 backdrop-blur p-4 rounded-xl border-2 border-blue-400/50">
                                <h2 className="text-xl font-bold text-white">⏸️ Game Paused</h2>
                                <p className="text-sm text-white/80 mt-2">Press spacebar to resume</p>
                            </div>
                        )}

                        {!gameStarted && (
                            <div className="text-center mb-4 bg-green-400/20 backdrop-blur p-4 rounded-xl border-2 border-green-400/50">
                                <h2 className="text-xl font-bold text-white">🎯 Ready to Play!</h2>
                                <p className="text-sm text-white/80 mt-2">Press spacebar or click Start Game</p>
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="text-center text-white/90 text-sm max-w-md">
                            <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/20">
                                <p className="mb-1">🎯 <strong>Controls:</strong> {isMobile ? 'Use direction buttons above • ' : 'Use arrow keys to move • '}Spacebar to pause</p>
                                <p className="mb-2">🍎 Eat red food to grow and increase your score!</p>
                                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                                    <div className="bg-green-400/20 p-2 rounded">
                                        <span className="font-semibold">Length:</span> {snake.length}
                                    </div>
                                    <div className="bg-blue-400/20 p-2 rounded">
                                        <span className="font-semibold">Speed:</span> {Math.round((initialSpeed - speed) / 2 + 1)}x
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

export default SnakeGame