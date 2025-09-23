import React, { useState, useEffect, useCallback, useRef } from 'react'

const BrickBreaker = () => {
    const canvasRef = useRef(null)
    const animationRef = useRef(null)
    const touchStartX = useRef(0)
    
    // Game constants
    const CANVAS_WIDTH = 600
    const CANVAS_HEIGHT = 400
    const PADDLE_WIDTH = 100
    const PADDLE_HEIGHT = 15
    const PADDLE_SPEED = 8
    const BALL_RADIUS = 8
    const BALL_SPEED = 4
    const BRICK_ROWS = 6
    const BRICK_COLS = 10
    const BRICK_WIDTH = 56
    const BRICK_HEIGHT = 20
    const BRICK_PADDING = 4
    const BRICK_OFFSET_TOP = 60
    const BRICK_OFFSET_LEFT = 8
    
    // Game state
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
        } catch {
            return 0
        }
    })
    
    // Mobile detection
    const [isMobile, setIsMobile] = useState(false)
    
    // Game objects
    const gameState = useRef({
        paddle: { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - 30 },
        ball: { 
            x: CANVAS_WIDTH / 2, 
            y: CANVAS_HEIGHT - 50, 
            dx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
            dy: -BALL_SPEED
        },
        bricks: [],
        keys: { left: false, right: false }
    })
    
    // Brick colors by row
    const BRICK_COLORS = [
        '#ff4757', // red
        '#ff6b7d', // pink
        '#ffa726', // orange
        '#ffcc02', // yellow
        '#26de81', // green
        '#45aaf2'  // blue
    ]
    
    // Initialize bricks
    const initializeBricks = useCallback(() => {
        const bricks = []
        for (let row = 0; row < BRICK_ROWS; row++) {
            for (let col = 0; col < BRICK_COLS; col++) {
                bricks.push({
                    x: col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
                    y: row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
                    width: BRICK_WIDTH,
                    height: BRICK_HEIGHT,
                    color: BRICK_COLORS[row],
                    visible: true,
                    points: (BRICK_ROWS - row) * 10
                })
            }
        }
        return bricks
    }, [])
    
    // Ball collision detection
    const checkBallCollision = useCallback(() => {
        const state = gameState.current
        const { ball, paddle, bricks } = state
        
        // Ball collision with walls
        if (ball.x + BALL_RADIUS > CANVAS_WIDTH || ball.x - BALL_RADIUS < 0) {
            ball.dx = -ball.dx
        }
        
        if (ball.y - BALL_RADIUS < 0) {
            ball.dy = -ball.dy
        }
        
        // Ball collision with bottom (lose life)
        if (ball.y + BALL_RADIUS > CANVAS_HEIGHT) {
            setLives(prev => {
                const newLives = prev - 1
                if (newLives <= 0) {
                    setGameOver(true)
                    if (score > highScore) {
                        setHighScore(score)
                        try {
                            localStorage.setItem('brickBreakerHighScore', score.toString())
                        } catch (error) {
                            console.warn('Could not save high score:', error)
                        }
                    }
                } else {
                    // Reset ball position
                    ball.x = CANVAS_WIDTH / 2
                    ball.y = CANVAS_HEIGHT - 50
                    ball.dx = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1)
                    ball.dy = -BALL_SPEED
                }
                return newLives
            })
        }
        
        // Ball collision with paddle
        if (
            ball.x + BALL_RADIUS > paddle.x &&
            ball.x - BALL_RADIUS < paddle.x + PADDLE_WIDTH &&
            ball.y + BALL_RADIUS > paddle.y &&
            ball.y - BALL_RADIUS < paddle.y + PADDLE_HEIGHT &&
            ball.dy > 0
        ) {
            // Calculate hit position on paddle for angle control
            const hitPos = (ball.x - (paddle.x + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2)
            ball.dx = BALL_SPEED * hitPos * 0.8
            ball.dy = -Math.abs(ball.dy)
            
            // Ensure minimum vertical speed
            if (Math.abs(ball.dy) < BALL_SPEED * 0.5) {
                ball.dy = ball.dy < 0 ? -BALL_SPEED * 0.5 : BALL_SPEED * 0.5
            }
        }
        
        // Ball collision with bricks
        bricks.forEach(brick => {
            if (!brick.visible) return
            
            if (
                ball.x + BALL_RADIUS > brick.x &&
                ball.x - BALL_RADIUS < brick.x + brick.width &&
                ball.y + BALL_RADIUS > brick.y &&
                ball.y - BALL_RADIUS < brick.y + brick.height
            ) {
                brick.visible = false
                ball.dy = -ball.dy
                setScore(prev => prev + brick.points)
                
                // Check if all bricks are destroyed
                const remainingBricks = bricks.filter(b => b.visible)
                if (remainingBricks.length === 0) {
                    setGameWon(true)
                    setGameOver(true)
                    if (score + brick.points > highScore) {
                        setHighScore(score + brick.points)
                        try {
                            localStorage.setItem('brickBreakerHighScore', (score + brick.points).toString())
                        } catch (error) {
                            console.warn('Could not save high score:', error)
                        }
                    }
                }
            }
        })
    }, [score, highScore])
    
    // Update game logic
    const updateGame = useCallback(() => {
        if (!gameStarted || gameOver || isPaused) return
        
        const state = gameState.current
        const { paddle, ball } = state
        
        // Move paddle
        if (state.keys.left && paddle.x > 0) {
            paddle.x -= PADDLE_SPEED
        }
        if (state.keys.right && paddle.x < CANVAS_WIDTH - PADDLE_WIDTH) {
            paddle.x += PADDLE_SPEED
        }
        
        // Move ball
        ball.x += ball.dx
        ball.y += ball.dy
        
        // Ball speed increase over time
        const speedMultiplier = 1 + (score / 1000) * 0.1
        const currentSpeed = BALL_SPEED * Math.min(speedMultiplier, 1.5)
        
        // Normalize ball speed
        const magnitude = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy)
        if (magnitude !== 0) {
            ball.dx = (ball.dx / magnitude) * currentSpeed
            ball.dy = (ball.dy / magnitude) * currentSpeed
        }
        
        // Check collisions
        checkBallCollision()
    }, [gameStarted, gameOver, isPaused, score, checkBallCollision])
    
    // Render game
    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        
        const ctx = canvas.getContext('2d')
        const state = gameState.current
        
        // Clear canvas with gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
        gradient.addColorStop(0, '#1a1a2e')
        gradient.addColorStop(1, '#16213e')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        
        // Draw bricks
        state.bricks.forEach(brick => {
            if (brick.visible) {
                // Main brick
                ctx.fillStyle = brick.color
                ctx.fillRect(brick.x, brick.y, brick.width, brick.height)
                
                // Brick highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
                ctx.fillRect(brick.x, brick.y, brick.width, 3)
                ctx.fillRect(brick.x, brick.y, 3, brick.height)
                
                // Brick shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
                ctx.fillRect(brick.x + brick.width - 3, brick.y, 3, brick.height)
                ctx.fillRect(brick.x, brick.y + brick.height - 3, brick.width, 3)
            }
        })
        
        // Draw paddle
        const paddleGradient = ctx.createLinearGradient(
            state.paddle.x, 
            state.paddle.y, 
            state.paddle.x, 
            state.paddle.y + PADDLE_HEIGHT
        )
        paddleGradient.addColorStop(0, '#4CAF50')
        paddleGradient.addColorStop(1, '#2E7D32')
        ctx.fillStyle = paddleGradient
        ctx.fillRect(state.paddle.x, state.paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT)
        
        // Paddle highlight
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
        
        // Ball glow effect
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
        
        // Draw game over screen
        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 36px Arial'
            ctx.textAlign = 'center'
            
            if (gameWon) {
                ctx.fillStyle = '#4CAF50'
                ctx.fillText('Level Complete!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)
            } else {
                ctx.fillStyle = '#f44336'
                ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)
            }
            
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 20px Arial'
            ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
            
            if (score === highScore && score > 0) {
                ctx.fillStyle = '#FFD700'
                ctx.fillText('New High Score!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
            }
            
            ctx.font = '16px Arial'
            ctx.fillStyle = '#cccccc'
            ctx.fillText('Click Restart to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
        }
        
        // Draw pause screen
        if (isPaused && !gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 32px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
            
            ctx.font = '16px Arial'
            ctx.fillText('Press SPACE to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
        }
        
        // Draw start screen
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
    
    // Game loop
    const gameLoop = useCallback(() => {
        updateGame()
        render()
        animationRef.current = requestAnimationFrame(gameLoop)
    }, [updateGame, render])
    
    // Initialize game
    const initializeGame = useCallback(() => {
        const state = gameState.current
        state.paddle = { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - 30 }
        state.ball = { 
            x: CANVAS_WIDTH / 2, 
            y: CANVAS_HEIGHT - 50, 
            dx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
            dy: -BALL_SPEED
        }
        state.bricks = initializeBricks()
        state.keys = { left: false, right: false }
    }, [initializeBricks])
    
    // Start game
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
    
    // Restart game
    const restartGame = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
        }
        setGameStarted(false)
        setGameOver(false)
        setGameWon(false)
        setIsPaused(false)
        setScore(0)
        setLives(3)
        setLevel(1)
        setTimeout(() => startGame(), 0)
    }, [startGame])
    
    // Toggle pause
    const togglePause = useCallback(() => {
        if (!gameStarted || gameOver) return
        setIsPaused(prev => !prev)
    }, [gameStarted, gameOver])
    
    // Move paddle
    const movePaddle = useCallback((direction) => {
        if (!gameStarted || gameOver || isPaused) return
        
        const state = gameState.current
        if (direction === 'left') {
            state.keys.left = true
            setTimeout(() => { state.keys.left = false }, 100)
        } else if (direction === 'right') {
            state.keys.right = true
            setTimeout(() => { state.keys.right = false }, 100)
        }
    }, [gameStarted, gameOver, isPaused])
    
    // Keyboard controls
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
            
            if (gameOver && e.key === ' ') {
                e.preventDefault()
                restartGame()
                return
            }
            
            if (!gameStarted || gameOver || isPaused) return
            
            const state = gameState.current
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault()
                    state.keys.left = true
                    break
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault()
                    state.keys.right = true
                    break
            }
        }
        
        const handleKeyUp = (e) => {
            const state = gameState.current
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    state.keys.left = false
                    break
                case 'ArrowRight':
                case 'd':
                case 'D':
                    state.keys.right = false
                    break
            }
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
            if (!gameStarted && !gameOver) {
                startGame()
                return
            }
            if (gameOver) {
                restartGame()
                return
            }
            touchStartX.current = e.touches[0].clientX
        }
        
        const handleTouchMove = (e) => {
            e.preventDefault()
            if (!gameStarted || gameOver || isPaused) return
            
            const deltaX = e.touches[0].clientX - touchStartX.current
            if (Math.abs(deltaX) > 20) {
                if (deltaX > 0) {
                    movePaddle('right')
                } else {
                    movePaddle('left')
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
    }, [gameStarted, gameOver, isPaused, startGame, restartGame, movePaddle])
    
    // Initialize animation loop
    useEffect(() => {
        animationRef.current = requestAnimationFrame(gameLoop)
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [gameLoop])
    
    // Mobile detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])
    
    // Reset high score
    const resetScore = () => {
        setHighScore(0)
        try {
            localStorage.removeItem('brickBreakerHighScore')
        } catch (error) {
            console.warn('Could not clear high score:', error)
        }
    }
    
    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <main className="flex items-center justify-center p-6">
                <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl max-w-3xl w-full">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-white">🧱 Brick Breaker</h1>
                        </div>
                        <div className="text-right">
                            <button 
                                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transform transition-all duration-200 hover:scale-105"
                                onClick={resetScore}
                            >
                                Reset High Score
                            </button>
                        </div>
                    </div>
                    
                    {/* Game Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-100 rounded-xl">
                            <div className="text-xl font-bold text-blue-600 mb-1">Score</div>
                            <div className="text-2xl font-semibold text-gray-700">{score}</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-100 rounded-xl">
                            <div className="text-xl font-bold text-yellow-600 mb-1">High Score</div>
                            <div className="text-2xl font-semibold text-gray-700">{highScore}</div>
                        </div>
                        <div className="text-center p-4 bg-red-100 rounded-xl">
                            <div className="text-xl font-bold text-red-600 mb-1">Lives</div>
                            <div className="text-2xl font-semibold text-gray-700">{lives}</div>
                        </div>
                        <div className="text-center p-4 bg-green-100 rounded-xl">
                            <div className="text-xl font-bold text-green-600 mb-1">Bricks</div>
                            <div className="text-2xl font-semibold text-gray-700">
                                {gameState.current.bricks.filter(b => b.visible).length}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center">
                        <h2 className="text-2xl font-bold mb-6 text-center">
                            {gameOver ? (
                                gameWon ? (
                                    <span className="text-green-500">Level Complete!</span>
                                ) : (
                                    <span className="text-red-500">Game Over!</span>
                                )
                            ) : gameStarted ? (
                                isPaused ? (
                                    <span className="text-yellow-600">Paused</span>
                                ) : (
                                    <span className="text-blue-600">Playing...</span>
                                )
                            ) : (
                                <span className="text-green-600">Ready to Break Bricks!</span>
                            )}
                        </h2>
                        
                        {/* Game Canvas */}
                        <div className="relative mb-6">
                            <canvas
                                ref={canvasRef}
                                width={CANVAS_WIDTH}
                                height={CANVAS_HEIGHT}
                                className="border-4 border-white/30 rounded-lg shadow-lg"
                                style={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`
                                }}
                            />
                        </div>
                        
                        {/* Mobile Controls */}
                        {isMobile && (
                            <div className="mb-6">
                                <div className="flex gap-4 justify-center">
                                    <button
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-2xl transform transition-all duration-200 hover:scale-105"
                                        onTouchStart={() => movePaddle('left')}
                                        disabled={!gameStarted || gameOver || isPaused}
                                    >
                                        ←
                                    </button>
                                    <button
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-2xl transform transition-all duration-200 hover:scale-105"
                                        onTouchStart={() => movePaddle('right')}
                                        disabled={!gameStarted || gameOver || isPaused}
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
                                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                                    onClick={startGame}
                                >
                                    Start Game
                                </button>
                            ) : (
                                <>
                                    <button
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                                        onClick={togglePause}
                                        disabled={gameOver}
                                    >
                                        {isPaused ? 'Resume' : 'Pause'}
                                    </button>
                                    {gameOver && (
                                        <button
                                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                                            onClick={restartGame}
                                        >
                                            Restart
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                        
                        {/* Game Status Messages */}
                        {gameOver && (
                            <div className={`text-center mb-4 p-6 rounded-xl border-2 ${
                                gameWon 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-red-50 border-red-200'
                            }`}>
                                <h3 className={`text-2xl font-bold mb-2 ${
                                    gameWon ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {gameWon ? 'Congratulations!' : 'Game Over!'}
                                </h3>
                                <p className="text-gray-700">Final Score: {score}</p>
                                {score === highScore && score > 0 && (
                                    <p className="text-yellow-600 font-bold">New High Score!</p>
                                )}
                            </div>
                        )}
                        
                        {isPaused && !gameOver && gameStarted && (
                            <div className="text-center mb-4 bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200">
                                <h3 className="text-xl font-bold text-yellow-600">Game Paused</h3>
                                <p className="text-sm text-gray-600 mt-2">Press spacebar to resume</p>
                            </div>
                        )}
                        
                        {!gameStarted && !gameOver && (
                            <div className="text-center mb-4 bg-green-50 p-4 rounded-xl border-2 border-green-200">
                                <h3 className="text-xl font-bold text-green-600">Ready to Play!</h3>
                                <p className="text-sm text-gray-600 mt-2">Press spacebar or click Start Game</p>
                            </div>
                        )}
                        
                        {/* Instructions */}
                        <div className="text-center text-white/90 text-sm max-w-md">
                            <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/20">
                                <p className="mb-2">
                                    <strong>Controls:</strong> {isMobile ? 'Use buttons above or swipe • ' : 'Arrow keys or A/D to move • '}Space to pause
                                </p>
                                <p className="mb-2">Break all the bricks with your ball! Don't let it fall!</p>
                                <p>Try to beat your high score!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default BrickBreaker