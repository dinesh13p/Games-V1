import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const DoodleJump = () => {
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
    const [highScore, setHighScore] = useState(() => {
        try {
            const saved = localStorage.getItem('doodleJumpHighScore')
            return saved ? parseInt(saved) : 0
        } catch {
            return 0
        }
    })
    
    // Mobile detection
    const [isMobile, setIsMobile] = useState(false)
    
    // Game constants
    // Responsive canvas size
    const [canvasSize, setCanvasSize] = useState({ width: 400, height: 600 })
    const CANVAS_WIDTH = canvasSize.width
    const CANVAS_HEIGHT = canvasSize.height
    const DOODLER_WIDTH = 60
    const DOODLER_HEIGHT = 60
    const PLATFORM_WIDTH = 85
    const PLATFORM_HEIGHT = 15
    const GRAVITY = 0.8
    const JUMP_FORCE = 15
    
    // Game objects
    const gameState = useRef({
        doodler: {
            x: 50,
            y: 500,
            velocityX: 0,
            velocityY: 0,
            onPlatform: false
        },
        platforms: [],
        cameraY: 0,
        isJumping: false,
        keys: {
            left: false,
            right: false
        }
    })

    // Platform class
    const createPlatform = (x, y) => ({
        x,
        y,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT
    })

    // Initialize platforms
    const initializePlatforms = useCallback(() => {
        const platforms = []
        // Create initial platforms
        for (let i = 0; i < 7; i++) {
            const x = Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH)
            const y = 100 + i * 100
            platforms.push(createPlatform(x, y))
        }
        return platforms
    }, [])

    // Generate new platform at top
    const generateNewPlatform = useCallback(() => {
        const topPlatform = gameState.current.platforms[gameState.current.platforms.length - 1]
        const newY = topPlatform.y + 80 + Math.random() * 50
        const newX = Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH)
        return createPlatform(newX, newY)
    }, [CANVAS_WIDTH])

    // Check collision between doodler and platform
    const checkPlatformCollision = useCallback((doodler, platform) => {
        return doodler.x < platform.x + platform.width &&
               doodler.x + DOODLER_WIDTH > platform.x &&
               doodler.y + DOODLER_HEIGHT > platform.y &&
               doodler.y + DOODLER_HEIGHT < platform.y + platform.height + 10 &&
               doodler.velocityY > 0
    }, [])

    // Update game logic
    const updateGame = useCallback(() => {
        if (!gameStarted || gameOver || isPaused) return

        const state = gameState.current
        const { doodler } = state

        // Apply horizontal movement
        if (state.keys.left) {
            doodler.velocityX = Math.max(doodler.velocityX - 1, -8)
        } else if (state.keys.right) {
            doodler.velocityX = Math.min(doodler.velocityX + 1, 8)
        } else {
            doodler.velocityX *= 0.8 // Friction
        }

        // Apply gravity
        doodler.velocityY += GRAVITY

        // Update position
        doodler.x += doodler.velocityX
        doodler.y += doodler.velocityY

        // Wrap around horizontally
        if (doodler.x < -DOODLER_WIDTH) {
            doodler.x = CANVAS_WIDTH
        } else if (doodler.x > CANVAS_WIDTH) {
            doodler.x = -DOODLER_WIDTH
        }

        // Check platform collisions
        state.platforms.forEach(platform => {
            if (checkPlatformCollision(doodler, platform)) {
                doodler.y = platform.y - DOODLER_HEIGHT
                doodler.velocityY = -JUMP_FORCE
                state.isJumping = true
            }
        })

        // Update camera and score
        if (doodler.y < state.cameraY + 200) {
            const newCameraY = doodler.y - 200
            const scoreIncrease = Math.max(0, Math.floor((state.cameraY - newCameraY) / 10))
            if (scoreIncrease > 0) {
                setScore(prev => prev + scoreIncrease)
            }
            state.cameraY = newCameraY
        }

        // Remove platforms that are too far below
        state.platforms = state.platforms.filter(platform => 
            platform.y > state.cameraY - 100
        )

        // Add new platforms at the top
        while (state.platforms.length < 8) {
            state.platforms.push(generateNewPlatform())
        }

        // Check game over
        if (doodler.y > state.cameraY + CANVAS_HEIGHT + 100) {
            setGameOver(true)
            if (score > highScore) {
                const newHigh = score
                setHighScore(newHigh)
                try {
                    localStorage.setItem('doodleJumpHighScore', newHigh.toString())
                } catch (error) {
                    console.warn('Could not save high score:', error)
                }
            }
        }
    }, [gameStarted, gameOver, isPaused, checkPlatformCollision, generateNewPlatform, score, highScore, CANVAS_HEIGHT])

    // Render game
    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Ensure canvas matches size
        if (canvas.width !== CANVAS_WIDTH) canvas.width = CANVAS_WIDTH
        if (canvas.height !== CANVAS_HEIGHT) canvas.height = CANVAS_HEIGHT

        const ctx = canvas.getContext('2d')
        const state = gameState.current

        // Clear canvas
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        // Set camera transform
        ctx.save()
        ctx.translate(0, CANVAS_HEIGHT - state.cameraY)

        // Draw platforms
        ctx.fillStyle = '#8B4513'
        state.platforms.forEach(platform => {
            ctx.fillRect(platform.x, -platform.y, platform.width, platform.height)
        })

        // Draw doodler
        ctx.fillStyle = '#32CD32'
        ctx.fillRect(state.doodler.x, -state.doodler.y - DOODLER_HEIGHT, DOODLER_WIDTH, DOODLER_HEIGHT)
        
        // Draw eyes
        ctx.fillStyle = '#000'
        ctx.fillRect(state.doodler.x + 10, -state.doodler.y - DOODLER_HEIGHT + 10, 8, 8)
        ctx.fillRect(state.doodler.x + 35, -state.doodler.y - DOODLER_HEIGHT + 10, 8, 8)

        ctx.restore()

        // Draw score
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 24px Inter'
        ctx.textAlign = 'center'
        ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, 40)
        
        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 36px Inter'
            ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)
            ctx.font = 'bold 20px Inter'
            ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
            if (score === highScore && score > 0) {
                ctx.fillText('New High Score!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
            }
        }

        if (isPaused && !gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 32px Inter'
            ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
        }

        if (!gameStarted && !gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 28px Inter'
            ctx.fillText('Doodle Jump', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
            ctx.font = '18px Inter'
            ctx.fillText('Use arrow keys to move', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
            ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
        }
    }, [gameStarted, gameOver, isPaused, score, highScore, CANVAS_WIDTH, CANVAS_HEIGHT])

    // Game loop
    const gameLoop = useCallback(() => {
        updateGame()
        render()
        if (!gameOver && !isPaused) {
            animationRef.current = requestAnimationFrame(gameLoop)
        }
    }, [updateGame, render, gameOver, isPaused])

    // Start game
    const startGame = useCallback(() => {
        setGameStarted(true)
        setGameOver(false)
        setIsPaused(false)
        setScore(0)

        // Cancel any previous loop
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
        }
        // Reset game state
        gameState.current = {
            doodler: {
                x: CANVAS_WIDTH / 2 - DOODLER_WIDTH / 2,
                y: 500,
                velocityX: 0,
                velocityY: -JUMP_FORCE,
                onPlatform: false
            },
            platforms: initializePlatforms(),
            cameraY: 0,
            isJumping: true,
            keys: {
                left: false,
                right: false
            }
        }

        animationRef.current = requestAnimationFrame(gameLoop)
    }, [initializePlatforms, gameLoop, CANVAS_WIDTH])

    // Restart game
    const restartGame = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
        }
        setTimeout(() => startGame(), 100)
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
                case 'ArrowLeft':
                    e.preventDefault()
                    gameState.current.keys.left = true
                    break
                case 'ArrowRight':
                    e.preventDefault()
                    gameState.current.keys.right = true
                    break
            }
        }

        const handleKeyUp = (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    gameState.current.keys.left = false
                    break
                case 'ArrowRight':
                    gameState.current.keys.right = false
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [gameStarted, gameOver, isPaused, startGame, togglePause])

    // Handle mobile controls
    const handleMobileControl = useCallback((direction) => {
        if (!gameStarted || gameOver || isPaused) return

        const state = gameState.current
        if (direction === 'left') {
            state.keys.left = true
            state.keys.right = false
            setTimeout(() => { state.keys.left = false }, 120)
        } else if (direction === 'right') {
            state.keys.right = true
            state.keys.left = false
            setTimeout(() => { state.keys.right = false }, 120)
        }
    }, [gameStarted, gameOver, isPaused])

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
            
            if (Math.abs(deltaX) > 20) {
                if (deltaX > 0) {
                    handleMobileControl('right')
                } else {
                    handleMobileControl('left')
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
    }, [gameStarted, gameOver, isPaused, startGame, handleMobileControl])

    // Detect mobile and responsive canvas
    useEffect(() => {
        const updateSize = () => {
            const isMobileDevice = window.innerWidth < 768
            setIsMobile(isMobileDevice)
            // Responsive canvas: fit to parent but keep aspect ratio
            let width = 400
            let height = 600
            if (isMobileDevice) {
                width = Math.min(window.innerWidth - 32, 400)
                height = Math.round(width * 1.5)
            }
            setCanvasSize({ width, height })
        }
        updateSize()
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
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
                        <h1 className="text-3xl font-bold text-gray-800">🦘 Doodle Jump</h1>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-semibold text-gray-700">Score: {score}</div>
                        <div className="text-sm text-gray-600">High: {highScore}</div>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    {/* Game Canvas */}
                    <div className="relative mb-6" style={{ width: CANVAS_WIDTH, maxWidth: '100%' }}>
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            className="border-4 border-gray-300 rounded-lg bg-gradient-to-b from-sky-200 to-sky-400 shadow-lg"
                            style={{
                                width: '100%',
                                height: 'auto',
                                aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`
                            }}
                            tabIndex={0}
                            aria-label="Doodle Jump Game Canvas"
                        />
                    </div>

                    {/* Mobile Controls */}
                    {isMobile && (
                        <div className="mb-6">
                            <div className="flex gap-4 justify-center">
                                <button 
                                    className="btn-secondary text-white px-8 py-4 rounded-lg font-bold text-2xl transform transition-all duration-200 hover:scale-105"
                                    onTouchStart={() => handleMobileControl('left')}
                                    disabled={!gameStarted || gameOver || isPaused}
                                    aria-label="Move left"
                                >
                                    ←
                                </button>
                                <button 
                                    className="btn-secondary text-white px-8 py-4 rounded-lg font-bold text-2xl transform transition-all duration-200 hover:scale-105"
                                    onTouchStart={() => handleMobileControl('right')}
                                    disabled={!gameStarted || gameOver || isPaused}
                                    aria-label="Move right"
                                >
                                    →
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
                        <div className="text-center mb-4 game-over bg-red-50 p-6 rounded-xl border-2 border-red-200">
                            <h2 className="text-2xl font-bold text-red-600 mb-2">💥 Game Over!</h2>
                            <p className="text-gray-700">Final Score: {score}</p>
                            {score === highScore && score > 0 && (
                                <p className="text-yellow-600 font-bold animate-bounce">🎉 New High Score!</p>
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
                            <h2 className="text-xl font-bold text-green-600">🎯 Ready to Jump!</h2>
                            <p className="text-sm text-gray-600 mt-2">Press spacebar or click Start Game</p>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="text-center text-gray-600 text-sm max-w-md">
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <p className="mb-2">🎯 <strong>Controls:</strong> {isMobile ? 'Tap left/right buttons or swipe • ' : 'Use arrow keys to move • '}Spacebar to pause</p>
                            <p className="mb-2">🦘 Jump on platforms to reach higher! The higher you go, the more points you score!</p>
                            <p className="text-xs text-gray-500">Tip: Move to the sides to wrap around the screen!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DoodleJump