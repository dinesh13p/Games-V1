import React, { useState, useEffect, useCallback, useRef } from 'react'

const DoodleJump = () => {
    const canvasRef = useRef(null)
    const animationRef = useRef(null)
    const touchStartX = useRef(0)
    const touchStartY = useRef(0)

    // Game state
    const [gameStarted, setGameStarted] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)

    // Mobile detection
    const [isMobile, setIsMobile] = useState(false)

    // Game constants
    const [canvasSize, setCanvasSize] = useState({ width: 400, height: 600 })
    const CANVAS_WIDTH = canvasSize.width
    const CANVAS_HEIGHT = canvasSize.height
    const DOODLER_WIDTH = 60
    const DOODLER_HEIGHT = 60
    const PLATFORM_WIDTH = 85
    const PLATFORM_HEIGHT = 15
    const GRAVITY = 0.8
    const JUMP_FORCE = 18
    const MANUAL_JUMP_FORCE = 20

    // Game objects
    const gameState = useRef({
        doodler: {
            x: 200,
            y: 500,
            velocityX: 0,
            velocityY: 0,
            onPlatform: false,
            facingRight: true,
            canJump: false,
            flying: false,
            flyingTimer: 0
        },
        platforms: [],
        cameraY: 0,
        keys: { left: false, right: false, jump: false },
        currentScore: 0,
        maxHeight: 0,
        fallingObjects: [],
        platformCount: 0
    })

    // Falling object factory
    const createFallingObject = (x, y) => ({
        x,
        y,
        width: 24,
        height: 24,
        velocityY: 4 + Math.random() * 2,
        type: Math.random() < 0.5 ? 'bomb' : 'stone'
    })

    // Smart falling object generation
    const maybeAddFallingObject = useCallback(() => {
        const state = gameState.current
        // Do not spawn falling objects if doodler is flying
        if (state.doodler.flying) return;
        // Add a falling object with 1% chance per frame if less than 3 on screen
        if (state.fallingObjects.length < 3 && Math.random() < 0.01) {
            const x = Math.random() * (CANVAS_WIDTH - 24)
            const y = state.cameraY - 30
            state.fallingObjects.push(createFallingObject(x, y))
        }
    }, [CANVAS_WIDTH])

    // Platform factory with type
    const createPlatform = (x, y, type = 'normal') => ({ x, y, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT, type })

    // Initialize platforms
    const initializePlatforms = useCallback(() => {
        const platforms = []
        // Create fewer initial platforms (30% less)
        const initialCount = Math.max(3, Math.floor(10 * 0.7))
        for (let i = 0; i < initialCount; i++) {
            const x = Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH)
            const y = CANVAS_HEIGHT - 80 - i * 80
            // Smart platform generation: spiked, green, normal
            let type = 'normal'
            if (i === 0) type = 'normal'
            else if (i % 5 === 0 && Math.random() < 0.6) type = 'spiked' // 40% reduction
            else if (i % 3 === 0 && Math.random() < 0.28) type = 'green' // 30% reduction
            platforms.push(createPlatform(x, y, type))
        }
        return platforms
    }, [CANVAS_WIDTH, CANVAS_HEIGHT])

    // Generate new platform at the top
    const generateNewPlatform = useCallback(() => {
        const platforms = gameState.current.platforms
        if (platforms.length === 0) return createPlatform(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100)
        
        const highestY = Math.min(...platforms.map(p => p.y))
        const newY = highestY - (60 + Math.random() * 40)
        const newX = Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH)
    // Smart platform generation: spiked, green, normal
    let type = 'normal'
    const rand = Math.random()
    if (rand < 0.15 && Math.random() < 0.6) type = 'spiked' // 40% reduction
    else if (rand < 0.35 && Math.random() < 0.28) type = 'green' // 30% reduction
    return createPlatform(newX, newY, type)
    }, [CANVAS_WIDTH, CANVAS_HEIGHT])

    // AABB collision (only when falling)
    const checkPlatformCollision = useCallback((doodler, platform) => {
        return (
            doodler.x < platform.x + platform.width &&
            doodler.x + DOODLER_WIDTH > platform.x &&
            doodler.y + DOODLER_HEIGHT >= platform.y &&
            doodler.y + DOODLER_HEIGHT <= platform.y + platform.height + 15 &&
            doodler.velocityY > 0
        )
    }, [])

    // Check collision with falling objects
    const checkFallingObjectCollision = useCallback((doodler, fallingObject) => {
        return (
            doodler.x < fallingObject.x + fallingObject.width &&
            doodler.x + DOODLER_WIDTH > fallingObject.x &&
            doodler.y < fallingObject.y + fallingObject.height &&
            doodler.y + DOODLER_HEIGHT > fallingObject.y
        )
    }, [])

    // Mobile control handler
    const handleMobileControl = useCallback((direction) => {
        if (!gameStarted || isPaused || gameOver) return
        
        const state = gameState.current
        if (direction === 'left') {
            state.keys.left = true
            state.keys.right = false
            state.doodler.facingRight = false
            setTimeout(() => {
                state.keys.left = false
            }, 150)
        } else if (direction === 'right') {
            state.keys.right = true
            state.keys.left = false
            state.doodler.facingRight = true
            setTimeout(() => {
                state.keys.right = false
            }, 150)
        }
    }, [gameStarted, isPaused, gameOver])

    // Update world
    const updateGame = useCallback(() => {
        if (!gameStarted || isPaused || gameOver) return

        const state = gameState.current
        const { doodler } = state

        // Horizontal input
        if (state.keys.left) {
            doodler.velocityX = Math.max(doodler.velocityX - 1.5, -8)
            doodler.facingRight = false
        } else if (state.keys.right) {
            doodler.velocityX = Math.min(doodler.velocityX + 1.5, 8)
            doodler.facingRight = true
        } else {
            doodler.velocityX *= 0.9
            if (Math.abs(doodler.velocityX) < 0.3) doodler.velocityX = 0
        }

        // Handle flying
        if (doodler.flying) {
            doodler.flyingTimer -= 1
            if (doodler.flyingTimer <= 0) {
                doodler.flying = false
                doodler.velocityY = 0 // Stop upward movement when flying ends
            }
        }

        // Gravity (reduced when flying)
        if (doodler.flying) {
            doodler.velocityY += GRAVITY * 0.1 // Much less gravity when flying
        } else {
            doodler.velocityY += GRAVITY
        }

        // Update position
        doodler.x += doodler.velocityX
        doodler.y += doodler.velocityY

        // Horizontal wrap
        if (doodler.x < -DOODLER_WIDTH) doodler.x = CANVAS_WIDTH
        else if (doodler.x > CANVAS_WIDTH) doodler.x = -DOODLER_WIDTH

        // Camera logic - follow the doodler up
        if (doodler.y < state.cameraY + CANVAS_HEIGHT / 2) {
            const targetCameraY = doodler.y - CANVAS_HEIGHT / 2
            state.cameraY = targetCameraY
            
            // Update score based on height gained
            const newHeight = Math.max(0, -state.cameraY / 10)
            if (newHeight > state.maxHeight) {
                const heightGain = Math.floor(newHeight - state.maxHeight)
                state.currentScore += heightGain
                state.maxHeight = newHeight
                setScore(state.currentScore)
            }
        }

        // Platform collisions
        let landed = false
        if (doodler.velocityY > 0) {
            for (let platform of state.platforms) {
                if (checkPlatformCollision(doodler, platform)) {
                    if (platform.type === 'spiked') {
                        // Game over on spiked platform
                        setGameOver(true)
                        setGameStarted(false)
                        if (state.currentScore > highScore) {
                            setHighScore(state.currentScore)
                        }
                        return
                    } else if (platform.type === 'green') {
                        // Flying platform
                        doodler.y = platform.y - DOODLER_HEIGHT
                        doodler.velocityY = -JUMP_FORCE * 1.5 // Higher jump
                        doodler.flying = true
                        doodler.flyingTimer = 60 // 1 second of flying at 60fps
                        doodler.canJump = true
                        landed = true
                    } else {
                        // Normal platform
                        doodler.y = platform.y - DOODLER_HEIGHT
                        doodler.velocityY = -JUMP_FORCE
                        doodler.canJump = true
                        landed = true
                    }
                    break
                }
            }
        }

        // Enable jumping if moving upward or just landed
        if (doodler.velocityY <= 0 || landed) {
            doodler.canJump = true
        }

        // Update falling objects
        maybeAddFallingObject()
        state.fallingObjects.forEach(obj => {
            obj.y += obj.velocityY
        })

        // Check collisions with falling objects
        for (let i = state.fallingObjects.length - 1; i >= 0; i--) {
            if (checkFallingObjectCollision(doodler, state.fallingObjects[i])) {
                // Game over on collision
                setGameOver(true)
                setGameStarted(false)
                if (state.currentScore > highScore) {
                    setHighScore(state.currentScore)
                }
                return
            }
        }

        // Remove falling objects that are too far below
        state.fallingObjects = state.fallingObjects.filter(
            obj => obj.y < state.cameraY + CANVAS_HEIGHT + 200
        )

        // Remove platforms that are too far below
        state.platforms = state.platforms.filter(
            p => p.y < state.cameraY + CANVAS_HEIGHT + 200
        )

        // Add new platforms above (30% less than before)
        const maxPlatforms = Math.max(4, Math.floor(12 * 0.7))
        while (state.platforms.length < maxPlatforms) {
            state.platforms.push(generateNewPlatform())
        }

        // Game over if doodler falls below the screen
        if (doodler.y > state.cameraY + CANVAS_HEIGHT + 100) {
            setGameOver(true)
            setGameStarted(false)
            // Update high score
            if (state.currentScore > highScore) {
                setHighScore(state.currentScore)
            }
            return
        }
    }, [gameStarted, isPaused, gameOver, checkPlatformCollision, checkFallingObjectCollision, generateNewPlatform, maybeAddFallingObject, CANVAS_HEIGHT, CANVAS_WIDTH, highScore])

    // Render
    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        const state = gameState.current

        // Clear with sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
        gradient.addColorStop(0, '#87CEEB')
        gradient.addColorStop(1, '#98D8E8')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        // World transform (camera)
        ctx.save()
        ctx.translate(0, -state.cameraY)

        // Platforms
        state.platforms.forEach((platform) => {
            // Only render platforms that are visible
            if (platform.y > state.cameraY - 50 && platform.y < state.cameraY + CANVAS_HEIGHT + 50) {
                // Different colors for different platform types
                if (platform.type === 'spiked') {
                    ctx.fillStyle = '#8B0000' // Dark red
                    ctx.strokeStyle = '#FF0000' // Bright red
                } else if (platform.type === 'green') {
                    ctx.fillStyle = '#00AA00' // Green
                    ctx.strokeStyle = '#00FF00' // Bright green
                } else {
                    ctx.fillStyle = '#8B4513' // Normal brown
                    ctx.strokeStyle = '#654321'
                }
                ctx.lineWidth = 2
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
                ctx.strokeRect(platform.x, platform.y, platform.width, platform.height)
                
                // Add texture/details based on type
                if (platform.type === 'spiked') {
                    // Draw spikes
                    ctx.fillStyle = '#FF0000'
                    for (let i = 0; i < 6; i++) {
                        const spikeX = platform.x + (platform.width / 6) * i + (platform.width / 12)
                        ctx.beginPath()
                        ctx.moveTo(spikeX, platform.y)
                        ctx.lineTo(spikeX - 6, platform.y - 8)
                        ctx.lineTo(spikeX + 6, platform.y - 8)
                        ctx.closePath()
                        ctx.fill()
                    }
                } else if (platform.type === 'green') {
                    // Add glow effect
                    ctx.fillStyle = '#00FF00'
                    ctx.fillRect(platform.x + 2, platform.y + 2, platform.width - 4, 4)
                } else {
                    // Normal platform texture
                    ctx.fillStyle = '#A0522D'
                    ctx.fillRect(platform.x + 2, platform.y + 2, platform.width - 4, 4)
                }
            }
        })

        // Falling objects (stones/bombs)
        state.fallingObjects.forEach((obj) => {
            if (obj.y > state.cameraY - 50 && obj.y < state.cameraY + CANVAS_HEIGHT + 50) {
                ctx.fillStyle = '#444444'
                ctx.strokeStyle = '#000000'
                ctx.lineWidth = 2
                // Draw stone/bomb
                ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
                ctx.strokeRect(obj.x, obj.y, obj.width, obj.height)
                // Add some details to make it look like a bomb/stone
                ctx.fillStyle = '#666666'
                ctx.fillRect(obj.x + 2, obj.y + 2, obj.width - 4, 4)
                ctx.fillStyle = '#FF0000'
                ctx.beginPath()
                ctx.arc(obj.x + obj.width/2, obj.y + obj.height/2, 3, 0, Math.PI * 2)
                ctx.fill()
            }
        })

        // Doodler
        ctx.fillStyle = state.doodler.flying ? '#FFD700' : '#32CD32' // Gold when flying, green when normal
        ctx.strokeStyle = state.doodler.flying ? '#FFA500' : '#228B22'
        ctx.lineWidth = 2
        ctx.fillRect(state.doodler.x, state.doodler.y, DOODLER_WIDTH, DOODLER_HEIGHT)
        ctx.strokeRect(state.doodler.x, state.doodler.y, DOODLER_WIDTH, DOODLER_HEIGHT)

        // Eyes
        ctx.fillStyle = '#000'
        if (state.doodler.facingRight) {
            ctx.fillRect(state.doodler.x + 12, state.doodler.y + 12, 10, 10)
            ctx.fillRect(state.doodler.x + 38, state.doodler.y + 12, 10, 10)
        } else {
            ctx.fillRect(state.doodler.x + 10, state.doodler.y + 12, 10, 10)
            ctx.fillRect(state.doodler.x + 36, state.doodler.y + 12, 10, 10)
        }

        // Mouth
        ctx.beginPath()
        ctx.arc(state.doodler.x + 30, state.doodler.y + 40, 10, 0, Math.PI)
        ctx.fillStyle = '#000'
        ctx.fill()

        // Legs (simple rectangles)
        ctx.fillStyle = state.doodler.flying ? '#FFD700' : '#32CD32'
        ctx.fillRect(state.doodler.x + 15, state.doodler.y + DOODLER_HEIGHT, 8, 8)
        ctx.fillRect(state.doodler.x + 37, state.doodler.y + DOODLER_HEIGHT, 8, 8)

        ctx.restore()

        // HUD
        ctx.fillStyle = '#fff'
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 3
        ctx.font = 'bold 28px Arial'
        ctx.textAlign = 'center'
        ctx.strokeText(`Score: ${score}`, CANVAS_WIDTH / 2, 45)
        ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, 45)

        // Flying indicator
        if (state.doodler.flying) {
            ctx.fillStyle = '#FFD700'
            ctx.strokeStyle = '#000'
            ctx.font = 'bold 16px Arial'
            ctx.strokeText('FLYING!', CANVAS_WIDTH / 2, 75)
            ctx.fillText('FLYING!', CANVAS_WIDTH / 2, 75)
        }

        // Pause overlay
        if (isPaused && gameStarted) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 48px Arial'
            ctx.textAlign = 'center'
            ctx.strokeText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
            ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
            
            ctx.font = 'bold 20px Arial'
            ctx.strokeText('Press P to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
            ctx.fillText('Press P to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
        }

        // Start screen
        if (!gameStarted && !gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 36px Arial'
            ctx.textAlign = 'center'
            ctx.strokeText('Doodle Jump', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 120)
            ctx.fillText('Doodle Jump', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 120)
            
            ctx.font = 'bold 18px Arial'
            ctx.strokeText('Arrow Keys: Move Left/Right', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
            ctx.fillText('Arrow Keys: Move Left/Right', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
            ctx.strokeText('Red Platforms: DEADLY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 35)
            ctx.fillText('Red Platforms: DEADLY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 35)
            ctx.strokeText('Green Platforms: Flying Power!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10)
            ctx.fillText('Green Platforms: Flying Power!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10)
            ctx.strokeText('Avoid Falling Objects!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15)
            ctx.fillText('Avoid Falling Objects!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15)
            ctx.strokeText('Click Start Game to Begin!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
            ctx.fillText('Click Start Game to Begin!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
            
            if (highScore > 0) {
                ctx.font = 'bold 16px Arial'
                ctx.strokeText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80)
                ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80)
            }
        }

        // Game over screen
        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            ctx.fillStyle = '#FF4444'
            ctx.font = 'bold 48px Arial'
            ctx.textAlign = 'center'
            ctx.strokeText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
            ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
            
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 24px Arial'
            ctx.strokeText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
            ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
            
            if (score === highScore && score > 0) {
                ctx.fillStyle = '#FFD700'
                ctx.font = 'bold 20px Arial'
                ctx.strokeText('NEW HIGH SCORE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)
                ctx.fillText('NEW HIGH SCORE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)
            } else if (highScore > 0) {
                ctx.fillStyle = '#fff'
                ctx.font = 'bold 18px Arial'
                ctx.strokeText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)
                ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)
            }
            
            ctx.font = 'bold 16px Arial'
            ctx.strokeText('Click Restart to Play Again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80)
            ctx.fillText('Click Restart to Play Again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80)
        }
    }, [gameStarted, isPaused, gameOver, score, highScore, CANVAS_WIDTH, CANVAS_HEIGHT])

    // Game loop
    const gameLoop = useCallback(() => {
        updateGame()
        render()
        if ((gameStarted && !isPaused && !gameOver) || !gameStarted || gameOver) {
            animationRef.current = requestAnimationFrame(gameLoop)
        }
    }, [updateGame, render, gameStarted, isPaused, gameOver])

    // Start game
    const startGame = useCallback(() => {
        setGameStarted(true)
        setIsPaused(false)
        setGameOver(false)
        setScore(0)

        if (animationRef.current) cancelAnimationFrame(animationRef.current)

        gameState.current = {
            doodler: {
                x: CANVAS_WIDTH / 2 - DOODLER_WIDTH / 2,
                y: CANVAS_HEIGHT - 150,
                velocityX: 0,
                velocityY: -JUMP_FORCE,
                onPlatform: false,
                facingRight: true,
                canJump: true,
                flying: false,
                flyingTimer: 0
            },
            platforms: initializePlatforms(),
            cameraY: 0,
            keys: { left: false, right: false, jump: false },
            currentScore: 0,
            maxHeight: 0,
            fallingObjects: [],
            platformCount: 0
        }

        animationRef.current = requestAnimationFrame(gameLoop)
    }, [initializePlatforms, gameLoop, CANVAS_WIDTH, CANVAS_HEIGHT])

    // Restart
    const restartGame = useCallback(() => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        setTimeout(() => startGame(), 100)
    }, [startGame])

    // Pause/Resume
    const togglePause = useCallback(() => {
        if (!gameStarted || gameOver) return
        setIsPaused((prev) => {
            const next = !prev
            if (!next) {
                animationRef.current = requestAnimationFrame(gameLoop)
            } else if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            return next
        })
    }, [gameStarted, gameOver, gameLoop])

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Start game with Enter or Space
            if (!gameStarted && (e.key === ' ' || e.key === 'Enter')) {
                e.preventDefault()
                startGame()
                return
            }
            
            if (!gameStarted) return

            // Pause toggle
            if ((e.key === 'p' || e.key === 'P') && !gameOver) {
                e.preventDefault()
                togglePause()
                return
            }

            if (isPaused || gameOver) return

            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault()
                    gameState.current.keys.left = true
                    break
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault()
                    gameState.current.keys.right = true
                    break
                default:
                    break
            }
        }

        const handleKeyUp = (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    gameState.current.keys.left = false
                    break
                case 'ArrowRight':
                case 'd':
                case 'D':
                    gameState.current.keys.right = false
                    break
                default:
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [gameStarted, isPaused, gameOver, startGame, togglePause])

    // Touch controls
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const handleTouchStart = (e) => {
            e.preventDefault()
            if (!gameStarted) {
                startGame()
                return
            }
            touchStartX.current = e.touches[0].clientX
            touchStartY.current = e.touches[0].clientY
        }

        const handleTouchMove = (e) => {
            e.preventDefault()
            if (!gameStarted || isPaused || gameOver) return
            const deltaX = e.touches[0].clientX - touchStartX.current
            if (Math.abs(deltaX) > 20) {
                if (deltaX > 0) handleMobileControl('right')
                else handleMobileControl('left')
                touchStartX.current = e.touches[0].clientX
            }
        }

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
        return () => {
            canvas.removeEventListener('touchstart', handleTouchStart)
            canvas.removeEventListener('touchmove', handleTouchMove)
        }
    }, [gameStarted, isPaused, gameOver, startGame, handleMobileControl])

    // Responsive canvas + mobile detection
    useEffect(() => {
        const updateSize = () => {
            const isMobileDevice = window.innerWidth < 768
            setIsMobile(isMobileDevice)
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

    // Initialize render loop
    useEffect(() => {
        animationRef.current = requestAnimationFrame(gameLoop)
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
        }
    }, [gameLoop])

    // Navigation handler
    const handleNavigateHome = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
        }
        window.history.back()
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-6">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl max-w-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                    <button
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105"
                        onClick={handleNavigateHome}
                        aria-label="Back to Home"
                    >
                        ← Back to Home
                    </button>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white">🦘 Doodle Jump</h1>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-semibold text-white">Score: {score}</div>
                        <div className="text-sm text-white/80">High: {highScore}</div>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    {/* Canvas */}
                    <div className="relative mb-6" style={{ width: CANVAS_WIDTH, maxWidth: '100%' }}>
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            className="border-4 border-white/30 rounded-lg shadow-lg cursor-pointer"
                            style={{ width: '100%', height: 'auto', aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
                            tabIndex={0}
                            aria-label="Doodle Jump Game Canvas"
                        />
                    </div>

                    {/* Mobile Controls */}
                    {isMobile && (
                        <div className="mb-6">
                            <div className="flex gap-4 justify-center">
                                <button
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-2xl transform transition-all duration-200 hover:scale-105"
                                    onTouchStart={() => handleMobileControl('left')}
                                    disabled={!gameStarted || isPaused || gameOver}
                                    aria-label="Move left"
                                >
                                    ←
                                </button>
                                <button
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-2xl transform transition-all duration-200 hover:scale-105"
                                    onTouchStart={() => handleMobileControl('right')}
                                    disabled={!gameStarted || isPaused || gameOver}
                                    aria-label="Move right"
                                >
                                    →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex flex-wrap gap-4 mb-6 justify-center">
                        {!gameStarted ? (
                            <button
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                                onClick={startGame}
                                aria-label="Start the game"
                            >
                                🎮 Start Game
                            </button>
                        ) : (
                            <button
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                                onClick={togglePause}
                                disabled={gameOver}
                                aria-label={isPaused ? 'Resume the game' : 'Pause the game'}
                            >
                                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                            </button>
                        )}

                        <button
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                            onClick={restartGame}
                            aria-label="Restart the game"
                        >
                            🔄 Restart
                        </button>
                    </div>

                    {/* Status Messages */}
                    {isPaused && gameStarted && !gameOver && (
                        <div className="text-center mb-4 bg-yellow-400/20 backdrop-blur p-4 rounded-xl border-2 border-yellow-400/50">
                            <h2 className="text-xl font-bold text-white">⏸️ Game Paused</h2>
                            <p className="text-sm text-white/80 mt-2">Press P or Resume button to continue</p>
                        </div>
                    )}

                    {!gameStarted && !gameOver && (
                        <div className="text-center mb-4 bg-green-400/20 backdrop-blur p-4 rounded-xl border-2 border-green-400/50">
                            <h2 className="text-xl font-bold text-white">🎯 Ready to Jump!</h2>
                            <p className="text-sm text-white/80 mt-2">
                                {highScore > 0 ? `Beat your high score of ${highScore}!` : 'How high can you go?'}
                            </p>
                        </div>
                    )}

                    {gameOver && (
                        <div className="text-center mb-4 bg-red-400/20 backdrop-blur p-4 rounded-xl border-2 border-red-400/50">
                            <h2 className="text-xl font-bold text-white">💀 Game Over!</h2>
                            <p className="text-sm text-white/80 mt-2">
                                {score === highScore && score > 0 ? '🎉 New High Score!' : `Final Score: ${score}`}
                            </p>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="text-center text-white/90 text-sm max-w-md">
                        <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/20">
                            <p className="mb-2">
                                🎯 <strong>Controls:</strong> {isMobile ? 'Use buttons above • ' : 'Arrow keys: Move • '}P: Pause
                            </p>
                            <p className="mb-2">🦘 Jump automatically on platforms to reach higher! Avoid red spikes!</p>
                            <p className="mb-2">🟢 Green platforms give you flying powers!</p>
                            <p className="text-xs text-white/70">💣 Watch out for falling objects - they're deadly!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DoodleJump