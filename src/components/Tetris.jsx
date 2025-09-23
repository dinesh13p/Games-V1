import React, { useState, useEffect, useCallback, useRef } from 'react'

const Tetris = () => {
    const canvasRef = useRef(null)
    const animationRef = useRef(null)
    const lastDropTime = useRef(0)
    
    // Game constants
    const BOARD_WIDTH = 10
    const BOARD_HEIGHT = 20
    const CELL_SIZE = 30
    const CANVAS_WIDTH = BOARD_WIDTH * CELL_SIZE
    const CANVAS_HEIGHT = BOARD_HEIGHT * CELL_SIZE
    
    // Game state
    const [gameStarted, setGameStarted] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [score, setScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [lines, setLines] = useState(0)
    const [highScore, setHighScore] = useState(() => {
        try {
            const saved = localStorage.getItem('tetrisHighScore')
            return saved ? parseInt(saved) : 0
        } catch {
            return 0
        }
    })
    
    // Mobile detection
    const [isMobile, setIsMobile] = useState(false)
    
    // Tetris pieces (tetrominoes)
    const PIECES = {
        I: {
            shape: [[1, 1, 1, 1]],
            color: '#00f5ff'
        },
        O: {
            shape: [
                [1, 1],
                [1, 1]
            ],
            color: '#ffff00'
        },
        T: {
            shape: [
                [0, 1, 0],
                [1, 1, 1]
            ],
            color: '#a000f0'
        },
        S: {
            shape: [
                [0, 1, 1],
                [1, 1, 0]
            ],
            color: '#00f000'
        },
        Z: {
            shape: [
                [1, 1, 0],
                [0, 1, 1]
            ],
            color: '#f00000'
        },
        J: {
            shape: [
                [1, 0, 0],
                [1, 1, 1]
            ],
            color: '#0000f0'
        },
        L: {
            shape: [
                [0, 0, 1],
                [1, 1, 1]
            ],
            color: '#f0a000'
        }
    }
    
    // Game state
    const gameState = useRef({
        board: Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0)),
        currentPiece: null,
        currentX: 0,
        currentY: 0,
        nextPiece: null,
        dropTime: 1000,
        keys: { left: false, right: false, down: false, rotate: false }
    })
    
    // Create a random piece
    const createPiece = useCallback(() => {
        const pieceTypes = Object.keys(PIECES)
        const type = pieceTypes[Math.floor(Math.random() * pieceTypes.length)]
        return {
            type,
            shape: PIECES[type].shape,
            color: PIECES[type].color
        }
    }, [])
    
    // Rotate piece
    const rotatePiece = useCallback((piece) => {
        const rotated = piece.shape[0].map((_, i) =>
            piece.shape.map(row => row[i]).reverse()
        )
        return { ...piece, shape: rotated }
    }, [])
    
    // Check if position is valid
    const isValidPosition = useCallback((board, piece, x, y) => {
        for (let py = 0; py < piece.shape.length; py++) {
            for (let px = 0; px < piece.shape[py].length; px++) {
                if (piece.shape[py][px]) {
                    const newX = x + px
                    const newY = y + py
                    
                    if (
                        newX < 0 ||
                        newX >= BOARD_WIDTH ||
                        newY >= BOARD_HEIGHT ||
                        (newY >= 0 && board[newY][newX])
                    ) {
                        return false
                    }
                }
            }
        }
        return true
    }, [])
    
    // Place piece on board
    const placePiece = useCallback((board, piece, x, y) => {
        const newBoard = board.map(row => [...row])
        for (let py = 0; py < piece.shape.length; py++) {
            for (let px = 0; px < piece.shape[py].length; px++) {
                if (piece.shape[py][px]) {
                    const newX = x + px
                    const newY = y + py
                    if (newY >= 0) {
                        newBoard[newY][newX] = piece.color
                    }
                }
            }
        }
        return newBoard
    }, [])
    
    // Clear completed lines
    const clearLines = useCallback((board) => {
        const newBoard = board.filter(row => row.some(cell => !cell))
        const linesCleared = BOARD_HEIGHT - newBoard.length
        
        // Add empty rows at the top
        while (newBoard.length < BOARD_HEIGHT) {
            newBoard.unshift(Array(BOARD_WIDTH).fill(0))
        }
        
        return { board: newBoard, linesCleared }
    }, [])
    
    // Calculate score
    const calculateScore = useCallback((linesCleared, level) => {
        const lineScores = [0, 40, 100, 300, 1200]
        return lineScores[linesCleared] * level
    }, [])
    
    // Move piece
    const movePiece = useCallback((direction) => {
        if (!gameStarted || gameOver || isPaused) return
        
        const state = gameState.current
        let newX = state.currentX
        let newY = state.currentY
        let newPiece = state.currentPiece
        
        switch (direction) {
            case 'left':
                newX = state.currentX - 1
                break
            case 'right':
                newX = state.currentX + 1
                break
            case 'down':
                newY = state.currentY + 1
                break
            case 'rotate':
                newPiece = rotatePiece(state.currentPiece)
                break
        }
        
        if (isValidPosition(state.board, newPiece, newX, newY)) {
            state.currentX = newX
            state.currentY = newY
            state.currentPiece = newPiece
        }
    }, [gameStarted, gameOver, isPaused, rotatePiece, isValidPosition])
    
    // Drop piece
    const dropPiece = useCallback(() => {
        if (!gameStarted || gameOver || isPaused) return
        
        const state = gameState.current
        const newY = state.currentY + 1
        
        if (isValidPosition(state.board, state.currentPiece, state.currentX, newY)) {
            state.currentY = newY
        } else {
            // Place piece and spawn new one
            const newBoard = placePiece(state.board, state.currentPiece, state.currentX, state.currentY)
            const { board: clearedBoard, linesCleared } = clearLines(newBoard)
            
            state.board = clearedBoard
            
            // Update score and lines
            if (linesCleared > 0) {
                const points = calculateScore(linesCleared, level)
                setScore(prev => prev + points)
                setLines(prev => {
                    const newLines = prev + linesCleared
                    const newLevel = Math.floor(newLines / 10) + 1
                    if (newLevel > level) {
                        setLevel(newLevel)
                        state.dropTime = Math.max(50, 1000 - (newLevel - 1) * 50)
                    }
                    return newLines
                })
            }
            
            // Spawn new piece
            state.currentPiece = state.nextPiece || createPiece()
            state.nextPiece = createPiece()
            state.currentX = Math.floor((BOARD_WIDTH - state.currentPiece.shape[0].length) / 2)
            state.currentY = 0
            
            // Check game over
            if (!isValidPosition(state.board, state.currentPiece, state.currentX, state.currentY)) {
                setGameOver(true)
                if (score > highScore) {
                    setHighScore(score)
                    try {
                        localStorage.setItem('tetrisHighScore', score.toString())
                    } catch (error) {
                        console.warn('Could not save high score:', error)
                    }
                }
            }
        }
    }, [gameStarted, gameOver, isPaused, isValidPosition, placePiece, clearLines, calculateScore, createPiece, level, score, highScore])
    
    // Render game
    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        
        const ctx = canvas.getContext('2d')
        const state = gameState.current
        
        // Clear canvas
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        
        // Draw board
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (state.board[y][x]) {
                    ctx.fillStyle = state.board[y][x]
                    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
                    ctx.strokeStyle = '#333'
                    ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
                }
            }
        }
        
        // Draw current piece
        if (state.currentPiece) {
            ctx.fillStyle = state.currentPiece.color
            for (let py = 0; py < state.currentPiece.shape.length; py++) {
                for (let px = 0; px < state.currentPiece.shape[py].length; px++) {
                    if (state.currentPiece.shape[py][px]) {
                        const x = (state.currentX + px) * CELL_SIZE
                        const y = (state.currentY + py) * CELL_SIZE
                        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)
                        ctx.strokeStyle = '#fff'
                        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE)
                    }
                }
            }
        }
        
        // Draw grid lines
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 1
        for (let x = 0; x <= BOARD_WIDTH; x++) {
            ctx.beginPath()
            ctx.moveTo(x * CELL_SIZE, 0)
            ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT)
            ctx.stroke()
        }
        for (let y = 0; y <= BOARD_HEIGHT; y++) {
            ctx.beginPath()
            ctx.moveTo(0, y * CELL_SIZE)
            ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE)
            ctx.stroke()
        }
    }, [])
    
    // Game loop
    const gameLoop = useCallback((currentTime) => {
        if (!gameStarted || gameOver || isPaused) {
            render()
            animationRef.current = requestAnimationFrame(gameLoop)
            return
        }
        
        // Auto drop
        if (currentTime - lastDropTime.current > gameState.current.dropTime) {
            dropPiece()
            lastDropTime.current = currentTime
        }
        
        // Handle continuous key presses
        const state = gameState.current
        if (state.keys.left) movePiece('left')
        if (state.keys.right) movePiece('right')
        if (state.keys.down) dropPiece()
        
        render()
        animationRef.current = requestAnimationFrame(gameLoop)
    }, [gameStarted, gameOver, isPaused, dropPiece, movePiece, render])
    
    // Initialize game
    const initializeGame = useCallback(() => {
        const state = gameState.current
        state.board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0))
        state.currentPiece = createPiece()
        state.nextPiece = createPiece()
        state.currentX = Math.floor((BOARD_WIDTH - state.currentPiece.shape[0].length) / 2)
        state.currentY = 0
        state.dropTime = 1000
        setScore(0)
        setLevel(1)
        setLines(0)
    }, [createPiece])
    
    // Start game
    const startGame = useCallback(() => {
        setGameStarted(true)
        setGameOver(false)
        setIsPaused(false)
        initializeGame()
        lastDropTime.current = 0
        animationRef.current = requestAnimationFrame(gameLoop)
    }, [initializeGame, gameLoop])
    
    // Restart game
    const restartGame = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
        }
        setGameStarted(false)
        setGameOver(false)
        setIsPaused(false)
        setTimeout(() => startGame(), 0)
    }, [startGame])
    
    // Toggle pause
    const togglePause = useCallback(() => {
        if (!gameStarted || gameOver) return
        setIsPaused(prev => !prev)
    }, [gameStarted, gameOver])
    
    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!gameStarted && (e.key === ' ' || e.key === 'Enter')) {
                e.preventDefault()
                startGame()
                return
            }
            
            if (gameStarted && e.key === ' ') {
                e.preventDefault()
                togglePause()
                return
            }
            
            if (gameOver && (e.key === ' ' || e.key === 'Enter')) {
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
                    movePiece('left')
                    break
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault()
                    state.keys.right = true
                    movePiece('right')
                    break
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault()
                    state.keys.down = true
                    dropPiece()
                    break
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault()
                    movePiece('rotate')
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
                case 'ArrowDown':
                case 's':
                case 'S':
                    state.keys.down = false
                    break
            }
        }
        
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [gameStarted, gameOver, isPaused, startGame, togglePause, restartGame, movePiece, dropPiece])
    
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
    
    // Mobile controls
    const handleMobileControl = useCallback((action) => {
        switch (action) {
            case 'left':
                movePiece('left')
                break
            case 'right':
                movePiece('right')
                break
            case 'down':
                dropPiece()
                break
            case 'rotate':
                movePiece('rotate')
                break
        }
    }, [movePiece, dropPiece])
    
    // Reset high score
    const resetScore = () => {
        setHighScore(0)
        try {
            localStorage.removeItem('tetrisHighScore')
        } catch (error) {
            console.warn('Could not clear high score:', error)
        }
    }
    
    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <main className="flex items-center justify-center p-6">
                <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl max-w-4xl w-full">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-white">🟦 Tetris</h1>
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
                            <div className="text-2xl font-semibold text-gray-700">{score.toLocaleString()}</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-100 rounded-xl">
                            <div className="text-xl font-bold text-yellow-600 mb-1">High Score</div>
                            <div className="text-2xl font-semibold text-gray-700">{highScore.toLocaleString()}</div>
                        </div>
                        <div className="text-center p-4 bg-green-100 rounded-xl">
                            <div className="text-xl font-bold text-green-600 mb-1">Level</div>
                            <div className="text-2xl font-semibold text-gray-700">{level}</div>
                        </div>
                        <div className="text-center p-4 bg-purple-100 rounded-xl">
                            <div className="text-xl font-bold text-purple-600 mb-1">Lines</div>
                            <div className="text-2xl font-semibold text-gray-700">{lines}</div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center">
                        <h2 className="text-2xl font-bold mb-6 text-center">
                            {gameOver ? (
                                <span className="text-red-500">Game Over!</span>
                            ) : gameStarted ? (
                                isPaused ? (
                                    <span className="text-yellow-600">Paused</span>
                                ) : (
                                    <span className="text-blue-600">Playing...</span>
                                )
                            ) : (
                                <span className="text-green-600">Ready to Play!</span>
                            )}
                        </h2>
                        
                        <div className="flex flex-col lg:flex-row items-start gap-6">
                            {/* Game Canvas */}
                            <div className="relative">
                                <canvas
                                    ref={canvasRef}
                                    width={CANVAS_WIDTH}
                                    height={CANVAS_HEIGHT}
                                    className="border-4 border-white/30 rounded-lg shadow-lg bg-black"
                                />
                                
                                {/* Game overlay messages */}
                                {!gameStarted && !gameOver && (
                                    <div className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <h3 className="text-2xl font-bold mb-4">Tetris</h3>
                                            <p className="mb-4">Arrange falling blocks to clear lines!</p>
                                            <p className="text-sm">Press SPACE or click Start to begin</p>
                                        </div>
                                    </div>
                                )}
                                
                                {gameOver && (
                                    <div className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <h3 className="text-2xl font-bold mb-4 text-red-500">Game Over!</h3>
                                            <p className="mb-2">Final Score: {score.toLocaleString()}</p>
                                            <p className="mb-4">Level: {level} | Lines: {lines}</p>
                                            {score === highScore && score > 0 && (
                                                <p className="text-yellow-400 font-bold mb-4">New High Score!</p>
                                            )}
                                            <p className="text-sm">Press SPACE or click Restart to play again</p>
                                        </div>
                                    </div>
                                )}
                                
                                {isPaused && gameStarted && !gameOver && (
                                    <div className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <h3 className="text-2xl font-bold mb-4">Paused</h3>
                                            <p className="text-sm">Press SPACE to resume</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Next piece preview */}
                            <div className="text-center">
                                <h4 className="text-lg font-semibold mb-4 text-white">Next Piece</h4>
                                <div className="w-24 h-24 bg-black border-2 border-white/30 rounded-lg flex items-center justify-center">
                                    {gameState.current.nextPiece && (
                                        <div className="grid gap-px" style={{
                                            gridTemplateColumns: `repeat(${gameState.current.nextPiece.shape[0].length}, 1fr)`,
                                            gridTemplateRows: `repeat(${gameState.current.nextPiece.shape.length}, 1fr)`
                                        }}>
                                            {gameState.current.nextPiece.shape.map((row, y) =>
                                                row.map((cell, x) => (
                                                    <div
                                                        key={`${x}-${y}`}
                                                        className="w-3 h-3"
                                                        style={{
                                                            backgroundColor: cell ? gameState.current.nextPiece.color : 'transparent'
                                                        }}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Mobile Controls */}
                        {isMobile && (
                            <div className="mt-6 w-full max-w-xs">
                                <div className="grid grid-cols-3 gap-2">
                                    <div></div>
                                    <button
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-bold text-xl"
                                        onClick={() => handleMobileControl('rotate')}
                                        disabled={!gameStarted || gameOver || isPaused}
                                    >
                                        ↻
                                    </button>
                                    <div></div>
                                    <button
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-bold text-xl"
                                        onClick={() => handleMobileControl('left')}
                                        disabled={!gameStarted || gameOver || isPaused}
                                    >
                                        ←
                                    </button>
                                    <button
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-bold text-xl"
                                        onClick={() => handleMobileControl('down')}
                                        disabled={!gameStarted || gameOver || isPaused}
                                    >
                                        ↓
                                    </button>
                                    <button
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-bold text-xl"
                                        onClick={() => handleMobileControl('right')}
                                        disabled={!gameStarted || gameOver || isPaused}
                                    >
                                        →
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* Game Controls */}
                        <div className="flex flex-wrap gap-4 mt-6 justify-center">
                            {!gameStarted ? (
                                <button
                                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold"
                                    onClick={startGame}
                                >
                                    Start Game
                                </button>
                            ) : (
                                <>
                                    <button
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold"
                                        onClick={togglePause}
                                        disabled={gameOver}
                                    >
                                        {isPaused ? 'Resume' : 'Pause'}
                                    </button>
                                    {gameOver && (
                                        <button
                                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold"
                                            onClick={restartGame}
                                        >
                                            Restart
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                        
                        {/* Instructions */}
                        <div className="mt-6 text-center text-white/90 text-sm max-w-md">
                            <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/20">
                                <p className="mb-2">
                                    <strong>Controls:</strong> {isMobile ? 'Use buttons above' : 'Arrow keys or WASD to move • Up/W: Rotate • Space: Pause'}
                                </p>
                                <p className="mb-2">Arrange falling blocks to clear complete horizontal lines!</p>
                                <p className="text-xs text-white/70">Clear multiple lines at once for bonus points!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Tetris