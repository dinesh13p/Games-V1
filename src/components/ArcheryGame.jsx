import React, { useState, useEffect, useCallback, useRef } from 'react'

const ArcheryGame = () => {
    const canvasRef = useRef(null)
    const animationRef = useRef(null)
    const mousePos = useRef({ x: 0, y: 0 })
    const touchPos = useRef({ x: 0, y: 0 })
    
    // Game constants
    const CANVAS_WIDTH = 800
    const CANVAS_HEIGHT = 600
    const BOW_X = 100
    const BOW_Y = CANVAS_HEIGHT / 2
    const ARROW_SPEED = 12
    const TARGET_SIZE = 60
    const ENEMY_SIZE = 40
    const WIND_STRENGTH = 2
    
    // Game state
    const [gameStarted, setGameStarted] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [score, setScore] = useState(0)
    const [arrows, setArrows] = useState(10)
    const [level, setLevel] = useState(1)
    const [wind, setWind] = useState(0)
    const [power, setPower] = useState(0)
    const [isCharging, setIsCharging] = useState(false)
    const [highScore, setHighScore] = useState(() => {
        try {
            const saved = localStorage.getItem('archeryHighScore')
            return saved ? parseInt(saved) : 0
        } catch {
            return 0
        }
    })
    
    // Mobile detection
    const [isMobile, setIsMobile] = useState(false)
    
    // Game objects
    const gameState = useRef({
        arrows: [],
        targets: [],
        enemies: [],
        particles: [],
        bowAngle: 0,
        powerCharging: false,
        chargingStartTime: 0
    })
    
    // Target types
    const TARGET_TYPES = {
        bullseye: { color: '#ff0000', points: 100, size: 1 },
        normal: { color: '#00ff00', points: 50, size: 1.2 },
        large: { color: '#0000ff', points: 25, size: 1.5 }
    }
    
    // Create particle effect
    const createParticles = useCallback((x, y, color, count = 8) => {
        const particles = []
        for (let i = 0; i < count; i++) {
            particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 30,
                color,
                size: Math.random() * 4 + 2
            })
        }
        gameState.current.particles.push(...particles)
    }, [])
    
    // Generate targets
    const generateTargets = useCallback(() => {
        const targets = []
        const numTargets = Math.min(3 + level, 8)
        
        for (let i = 0; i < numTargets; i++) {
            const type = Math.random() < 0.3 ? 'bullseye' : Math.random() < 0.6 ? 'normal' : 'large'
            targets.push({
                x: 400 + Math.random() * 300,
                y: 100 + Math.random() * 400,
                type,
                moving: level > 2 && Math.random() < 0.4,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                hit: false,
                id: Math.random()
            })
        }
        
        return targets
    }, [level])
    
    // Generate enemies (moving stick figures)
    const generateEnemies = useCallback(() => {
        if (level < 3) return []
        
        const enemies = []
        const numEnemies = Math.min(Math.floor((level - 2) / 2), 4)
        
        for (let i = 0; i < numEnemies; i++) {
            enemies.push({
                x: 500 + Math.random() * 200,
                y: CANVAS_HEIGHT - 80,
                vx: (Math.random() - 0.5) * 1.5,
                vy: 0,
                hit: false,
                id: Math.random(),
                points: -30
            })
        }
        
        return enemies
    }, [level])
    
    // Initialize level
    const initializeLevel = useCallback(() => {
        gameState.current.targets = generateTargets()
        gameState.current.enemies = generateEnemies()
        gameState.current.arrows = []
        gameState.current.particles = []
        setArrows(10 + level)
        setWind((Math.random() - 0.5) * WIND_STRENGTH)
    }, [generateTargets, generateEnemies, level])
    
    // Calculate bow angle based on mouse/touch position
    const updateBowAngle = useCallback((clientX, clientY) => {
        const canvas = canvasRef.current
        if (!canvas) return
        
        const rect = canvas.getBoundingClientRect()
        const scaleX = CANVAS_WIDTH / rect.width
        const scaleY = CANVAS_HEIGHT / rect.height
        
        const x = (clientX - rect.left) * scaleX
        const y = (clientY - rect.top) * scaleY
        
        mousePos.current = { x, y }
        
        const dx = x - BOW_X
        const dy = y - BOW_Y
        gameState.current.bowAngle = Math.atan2(dy, dx)
    }, [])
    
    // Start charging power
    const startCharging = useCallback(() => {
        if (!gameStarted || gameOver || isPaused || arrows <= 0) return
        setIsCharging(true)
        gameState.current.powerCharging = true
        gameState.current.chargingStartTime = Date.now()
    }, [gameStarted, gameOver, isPaused, arrows])
    
    // Release arrow
    const releaseArrow = useCallback(() => {
        if (!gameStarted || gameOver || isPaused || !isCharging || arrows <= 0) return
        
        const chargeDuration = Date.now() - gameState.current.chargingStartTime
        const arrowPower = Math.min(chargeDuration / 1000, 2) // Max 2 seconds charge
        
        const angle = gameState.current.bowAngle
        const speed = ARROW_SPEED * (0.5 + arrowPower * 0.5) // 50% to 100% speed
        
        gameState.current.arrows.push({
            x: BOW_X + 50,
            y: BOW_Y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            angle: angle,
            id: Math.random(),
            gravity: 0.15,
            windEffect: 0
        })
        
        setArrows(prev => prev - 1)
        setIsCharging(false)
        setPower(0)
        gameState.current.powerCharging = false
    }, [gameStarted, gameOver, isPaused, isCharging, arrows])
    
    // Update power charging
    useEffect(() => {
        if (!isCharging) return
        
        const interval = setInterval(() => {
            const chargeDuration = Date.now() - gameState.current.chargingStartTime
            const currentPower = Math.min(chargeDuration / 1000, 2) * 50 // 0 to 100
            setPower(currentPower)
        }, 16)
        
        return () => clearInterval(interval)
    }, [isCharging])
    
    // Check collisions
    const checkCollisions = useCallback(() => {
        const state = gameState.current
        let scoreGained = 0
        
        // Arrow-target collisions
        state.arrows.forEach(arrow => {
            state.targets.forEach(target => {
                if (target.hit) return
                
                const targetInfo = TARGET_TYPES[target.type]
                const targetSize = TARGET_SIZE * targetInfo.size
                const dx = arrow.x - target.x
                const dy = arrow.y - target.y
                const distance = Math.sqrt(dx * dx + dy * dy)
                
                if (distance < targetSize / 2) {
                    target.hit = true
                    scoreGained += targetInfo.points
                    createParticles(target.x, target.y, targetInfo.color, 12)
                    
                    // Remove arrow
                    arrow.x = -1000
                }
            })
            
            // Arrow-enemy collisions
            state.enemies.forEach(enemy => {
                if (enemy.hit) return
                
                const dx = arrow.x - enemy.x
                const dy = arrow.y - (enemy.y - ENEMY_SIZE / 2)
                const distance = Math.sqrt(dx * dx + dy * dy)
                
                if (distance < ENEMY_SIZE / 2) {
                    enemy.hit = true
                    scoreGained += enemy.points
                    createParticles(enemy.x, enemy.y, '#8b0000', 8)
                    
                    // Remove arrow
                    arrow.x = -1000
                }
            })
        })
        
        setScore(prev => Math.max(0, prev + scoreGained))
    }, [createParticles])
    
    // Update game objects
    const updateGame = useCallback(() => {
        if (!gameStarted || gameOver || isPaused) return
        
        const state = gameState.current
        
        // Update arrows
        state.arrows = state.arrows.filter(arrow => {
            arrow.x += arrow.vx
            arrow.y += arrow.vy
            arrow.vy += arrow.gravity
            arrow.vx += wind * 0.1
            arrow.angle = Math.atan2(arrow.vy, arrow.vx)
            
            return arrow.x < CANVAS_WIDTH + 100 && arrow.y < CANVAS_HEIGHT + 100
        })
        
        // Update moving targets
        state.targets.forEach(target => {
            if (target.moving && !target.hit) {
                target.x += target.vx
                target.y += target.vy
                
                // Bounce off edges
                if (target.x < 300 || target.x > CANVAS_WIDTH - 50) {
                    target.vx = -target.vx
                }
                if (target.y < 50 || target.y > CANVAS_HEIGHT - 50) {
                    target.vy = -target.vy
                }
            }
        })
        
        // Update enemies
        state.enemies.forEach(enemy => {
            if (!enemy.hit) {
                enemy.x += enemy.vx
                
                // Bounce off edges
                if (enemy.x < 400 || enemy.x > CANVAS_WIDTH - 50) {
                    enemy.vx = -enemy.vx
                }
            }
        })
        
        // Update particles
        state.particles = state.particles.filter(particle => {
            particle.x += particle.vx
            particle.y += particle.vy
            particle.vx *= 0.98
            particle.vy *= 0.98
            particle.life--
            particle.size *= 0.95
            
            return particle.life > 0 && particle.size > 0.5
        })
        
        checkCollisions()
        
        // Check level completion
        const allTargetsHit = state.targets.every(target => target.hit)
        const noArrowsLeft = arrows <= 0 && state.arrows.length === 0
        
        if (allTargetsHit) {
            // Level complete - bonus points and next level
            setScore(prev => prev + arrows * 10) // Bonus for remaining arrows
            setLevel(prev => prev + 1)
            initializeLevel()
        } else if (noArrowsLeft) {
            // Game over
            setGameOver(true)
            if (score > highScore) {
                setHighScore(score)
                try {
                    localStorage.setItem('archeryHighScore', score.toString())
                } catch (error) {
                    console.warn('Could not save high score:', error)
                }
            }
        }
    }, [gameStarted, gameOver, isPaused, wind, arrows, checkCollisions, score, highScore, level, initializeLevel])
    
    // Render game
    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        
        const ctx = canvas.getContext('2d')
        const state = gameState.current
        
        // Clear canvas with sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
        gradient.addColorStop(0, '#87ceeb')
        gradient.addColorStop(0.7, '#98fb98')
        gradient.addColorStop(1, '#228b22')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        
        // Draw clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.beginPath()
        ctx.arc(200, 100, 40, 0, Math.PI * 2)
        ctx.arc(240, 100, 50, 0, Math.PI * 2)
        ctx.arc(280, 100, 40, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.beginPath()
        ctx.arc(500, 80, 30, 0, Math.PI * 2)
        ctx.arc(530, 80, 40, 0, Math.PI * 2)
        ctx.arc(560, 80, 30, 0, Math.PI * 2)
        ctx.fill()
        
        // Draw wind indicator
        ctx.fillStyle = '#000'
        ctx.font = 'bold 16px Arial'
        ctx.fillText(`Wind: ${wind > 0 ? '→' : '←'} ${Math.abs(wind).toFixed(1)}`, 20, 30)
        
        // Draw bow
        const bowEndX = BOW_X + Math.cos(state.bowAngle) * 60
        const bowEndY = BOW_Y + Math.sin(state.bowAngle) * 60
        
        ctx.strokeStyle = '#8b4513'
        ctx.lineWidth = 8
        ctx.beginPath()
        ctx.arc(BOW_X, BOW_Y, 40, state.bowAngle - Math.PI/3, state.bowAngle + Math.PI/3)
        ctx.stroke()
        
        // Draw bowstring
        ctx.strokeStyle = '#654321'
        ctx.lineWidth = 2
        const stringOffset = isCharging ? power * 0.3 : 0
        const stringX = BOW_X - Math.cos(state.bowAngle) * stringOffset
        const stringY = BOW_Y - Math.sin(state.bowAngle) * stringOffset
        
        ctx.beginPath()
        ctx.moveTo(BOW_X + Math.cos(state.bowAngle - Math.PI/3) * 40, BOW_Y + Math.sin(state.bowAngle - Math.PI/3) * 40)
        ctx.lineTo(stringX, stringY)
        ctx.lineTo(BOW_X + Math.cos(state.bowAngle + Math.PI/3) * 40, BOW_Y + Math.sin(state.bowAngle + Math.PI/3) * 40)
        ctx.stroke()
        
        // Draw aim line when charging
        if (isCharging) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5])
            ctx.beginPath()
            ctx.moveTo(BOW_X + 50, BOW_Y)
            ctx.lineTo(bowEndX + 100, bowEndY + 100)
            ctx.stroke()
            ctx.setLineDash([])
        }
        
        // Draw targets
        state.targets.forEach(target => {
            if (target.hit) return
            
            const targetInfo = TARGET_TYPES[target.type]
            const size = TARGET_SIZE * targetInfo.size
            
            // Target rings
            ctx.fillStyle = '#fff'
            ctx.beginPath()
            ctx.arc(target.x, target.y, size/2, 0, Math.PI * 2)
            ctx.fill()
            
            ctx.fillStyle = targetInfo.color
            ctx.beginPath()
            ctx.arc(target.x, target.y, size/3, 0, Math.PI * 2)
            ctx.fill()
            
            ctx.fillStyle = '#fff'
            ctx.beginPath()
            ctx.arc(target.x, target.y, size/6, 0, Math.PI * 2)
            ctx.fill()
            
            // Target stand
            ctx.fillStyle = '#8b4513'
            ctx.fillRect(target.x - 2, target.y + size/2, 4, 30)
        })
        
        // Draw enemies (stick figures)
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 3
        state.enemies.forEach(enemy => {
            if (enemy.hit) return
            
            const x = enemy.x
            const y = enemy.y
            
            // Head
            ctx.beginPath()
            ctx.arc(x, y - 30, 8, 0, Math.PI * 2)
            ctx.stroke()
            
            // Body
            ctx.beginPath()
            ctx.moveTo(x, y - 22)
            ctx.lineTo(x, y - 5)
            ctx.stroke()
            
            // Arms
            ctx.beginPath()
            ctx.moveTo(x - 10, y - 15)
            ctx.lineTo(x + 10, y - 15)
            ctx.stroke()
            
            // Legs
            ctx.beginPath()
            ctx.moveTo(x, y - 5)
            ctx.lineTo(x - 8, y + 5)
            ctx.moveTo(x, y - 5)
            ctx.lineTo(x + 8, y + 5)
            ctx.stroke()
        })
        
        // Draw arrows
        ctx.fillStyle = '#8b4513'
        ctx.strokeStyle = '#654321'
        ctx.lineWidth = 3
        state.arrows.forEach(arrow => {
            ctx.save()
            ctx.translate(arrow.x, arrow.y)
            ctx.rotate(arrow.angle)
            
            // Arrow shaft
            ctx.beginPath()
            ctx.moveTo(-15, 0)
            ctx.lineTo(15, 0)
            ctx.stroke()
            
            // Arrow head
            ctx.fillStyle = '#c0c0c0'
            ctx.beginPath()
            ctx.moveTo(15, 0)
            ctx.lineTo(10, -3)
            ctx.lineTo(10, 3)
            ctx.closePath()
            ctx.fill()
            
            // Fletching
            ctx.fillStyle = '#ff0000'
            ctx.beginPath()
            ctx.moveTo(-15, 0)
            ctx.lineTo(-10, -2)
            ctx.lineTo(-10, 2)
            ctx.closePath()
            ctx.fill()
            
            ctx.restore()
        })
        
        // Draw particles
        state.particles.forEach(particle => {
            ctx.fillStyle = particle.color
            ctx.globalAlpha = particle.life / 30
            ctx.beginPath()
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
            ctx.fill()
        })
        ctx.globalAlpha = 1
        
        // Draw power meter
        if (isCharging) {
            const meterWidth = 200
            const meterHeight = 20
            const meterX = CANVAS_WIDTH / 2 - meterWidth / 2
            const meterY = 50
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
            ctx.fillRect(meterX - 2, meterY - 2, meterWidth + 4, meterHeight + 4)
            
            ctx.fillStyle = '#333'
            ctx.fillRect(meterX, meterY, meterWidth, meterHeight)
            
            const powerWidth = (power / 100) * meterWidth
            ctx.fillStyle = power < 30 ? '#ff0000' : power < 70 ? '#ffff00' : '#00ff00'
            ctx.fillRect(meterX, meterY, powerWidth, meterHeight)
            
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 12px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('POWER', CANVAS_WIDTH / 2, meterY + 35)
        }
        
        // Draw UI
        ctx.fillStyle = '#000'
        ctx.font = 'bold 18px Arial'
        ctx.textAlign = 'left'
        ctx.fillText(`Score: ${score}`, 20, 60)
        ctx.fillText(`Arrows: ${arrows}`, 20, 85)
        ctx.fillText(`Level: ${level}`, 20, 110)
        
        ctx.textAlign = 'right'
        ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH - 20, 60)
        
        // Draw overlays
        if (!gameStarted && !gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 36px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('Archery Master', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80)
            
            ctx.font = '18px Arial'
            ctx.fillText('Aim with mouse/touch, hold to charge power', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30)
            ctx.fillText('Hit all targets to advance levels', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 5)
            ctx.fillText('Avoid hitting the stick figures!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
            ctx.fillText('Click Start Game or press Space to begin', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
        }
        
        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 36px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
            
            ctx.font = '20px Arial'
            ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
            ctx.fillText(`Level Reached: ${level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5)
            
            if (score === highScore && score > 0) {
                ctx.fillStyle = '#ffd700'
                ctx.fillText('New High Score!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35)
            }
            
            ctx.fillStyle = '#fff'
            ctx.font = '16px Arial'
            ctx.fillText('Click Restart or press Space to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70)
        }
        
        if (isPaused && gameStarted && !gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 32px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
            
            ctx.font = '16px Arial'
            ctx.fillText('Press P to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)
        }
    }, [power, isCharging, score, arrows, level, highScore, wind, gameStarted, gameOver, isPaused])
    
    // Game loop
    const gameLoop = useCallback(() => {
        updateGame()
        render()
        animationRef.current = requestAnimationFrame(gameLoop)
    }, [updateGame, render])
    
    // Start game
    const startGame = useCallback(() => {
        setGameStarted(true)
        setGameOver(false)
        setIsPaused(false)
        setScore(0)
        setLevel(1)
        initializeLevel()
        animationRef.current = requestAnimationFrame(gameLoop)
    }, [initializeLevel, gameLoop])
    
    // Restart game
    const restartGame = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
        }
        setGameStarted(false)
        setGameOver(false)
        setIsPaused(false)
        setScore(0)
        setLevel(1)
        setTimeout(() => startGame(), 0)
    }, [startGame])
    
    // Toggle pause
    const togglePause = useCallback(() => {
        if (!gameStarted || gameOver) return
        setIsPaused(prev => !prev)
    }, [gameStarted, gameOver])
    
    // Mouse/Touch controls
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        
        const handleMouseMove = (e) => {
            updateBowAngle(e.clientX, e.clientY)
        }
        
        const handleMouseDown = (e) => {
            e.preventDefault()
            if (!gameStarted && !gameOver) {
                startGame()
                return
            }
            if (gameOver) {
                restartGame()
                return
            }
            startCharging()
        }
        
        const handleMouseUp = (e) => {
            e.preventDefault()
            releaseArrow()
        }
        
        const handleTouchMove = (e) => {
            e.preventDefault()
            const touch = e.touches[0]
            updateBowAngle(touch.clientX, touch.clientY)
        }
        
        const handleTouchStart = (e) => {
            e.preventDefault()
            const touch = e.touches[0]
            updateBowAngle(touch.clientX, touch.clientY)
            
            if (!gameStarted && !gameOver) {
                startGame()
                return
            }
            if (gameOver) {
                restartGame()
                return
            }
            startCharging()
        }
        
        const handleTouchEnd = (e) => {
            e.preventDefault()
            releaseArrow()
        }
        
        canvas.addEventListener('mousemove', handleMouseMove)
        canvas.addEventListener('mousedown', handleMouseDown)
        canvas.addEventListener('mouseup', handleMouseUp)
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
        
        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove)
            canvas.removeEventListener('mousedown', handleMouseDown)
            canvas.removeEventListener('mouseup', handleMouseUp)
            canvas.removeEventListener('touchmove', handleTouchMove)
            canvas.removeEventListener('touchstart', handleTouchStart)
            canvas.removeEventListener('touchend', handleTouchEnd)
        }
    }, [updateBowAngle, startCharging, releaseArrow, gameStarted, gameOver, startGame, restartGame])
    
    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === ' ') {
                e.preventDefault()
                if (!gameStarted && !gameOver) {
                    startGame()
                } else if (gameOver) {
                    restartGame()
                } else if (gameStarted && !isPaused) {
                    startCharging()
                }
                return
            }
            
            if (e.key === 'p' || e.key === 'P') {
                e.preventDefault()
                togglePause()
                return
            }
        }
        
        const handleKeyUp = (e) => {
            if (e.key === ' ') {
                e.preventDefault()
                releaseArrow()
            }
        }
        
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [gameStarted, gameOver, isPaused, startGame, restartGame, togglePause, startCharging, releaseArrow])
    
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
            localStorage.removeItem('archeryHighScore')
        } catch (error) {
            console.warn('Could not clear high score:', error)
        }
    }
    
    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <main className="flex items-center justify-center p-6">
                <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl max-w-5xl w-full">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-white">🏹 Archery Master</h1>
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
                        <div className="text-center p-4 bg-green-100 rounded-xl">
                            <div className="text-xl font-bold text-green-600 mb-1">Level</div>
                            <div className="text-2xl font-semibold text-gray-700">{level}</div>
                        </div>
                        <div className="text-center p-4 bg-purple-100 rounded-xl">
                            <div className="text-xl font-bold text-purple-600 mb-1">Arrows</div>
                            <div className="text-2xl font-semibold text-gray-700">{arrows}</div>
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
                                    <span className="text-blue-600">Take Aim!</span>
                                )
                            ) : (
                                <span className="text-green-600">Ready to Shoot!</span>
                            )}
                        </h2>
                        
                        {/* Game Canvas */}
                        <div className="relative mb-6">
                            <canvas
                                ref={canvasRef}
                                width={CANVAS_WIDTH}
                                height={CANVAS_HEIGHT}
                                className="border-4 border-white/30 rounded-lg shadow-lg cursor-crosshair"
                                style={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`
                                }}
                            />
                        </div>
                        
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
                            <div className="text-center mb-4 bg-red-50 p-6 rounded-xl border-2 border-red-200">
                                <h3 className="text-2xl font-bold mb-2 text-red-600">Game Over!</h3>
                                <p className="text-gray-700">Final Score: {score}</p>
                                <p className="text-gray-700">Level Reached: {level}</p>
                                {score === highScore && score > 0 && (
                                    <p className="text-yellow-600 font-bold">New High Score!</p>
                                )}
                            </div>
                        )}
                        
                        {isPaused && !gameOver && gameStarted && (
                            <div className="text-center mb-4 bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200">
                                <h3 className="text-xl font-bold text-yellow-600">Game Paused</h3>
                                <p className="text-sm text-gray-600 mt-2">Press P to resume</p>
                            </div>
                        )}
                        
                        {!gameStarted && !gameOver && (
                            <div className="text-center mb-4 bg-green-50 p-4 rounded-xl border-2 border-green-200">
                                <h3 className="text-xl font-bold text-green-600">Ready to Shoot!</h3>
                                <p className="text-sm text-gray-600 mt-2">Click Start Game or press Space</p>
                            </div>
                        )}
                        
                        {/* Instructions */}
                        <div className="text-center text-white/90 text-sm max-w-2xl">
                            <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/20">
                                <p className="mb-2">
                                    <strong>Controls:</strong> Mouse/Touch to aim • Hold to charge power • Release to shoot • P to pause
                                </p>
                                <p className="mb-2">Hit all targets to advance levels! Avoid hitting stick figures.</p>
                                <div className="grid grid-cols-3 gap-4 mt-4 text-xs">
                                    <div className="bg-red-100 text-red-800 p-2 rounded">
                                        <span className="font-semibold">Bullseye:</span> 100 pts
                                    </div>
                                    <div className="bg-green-100 text-green-800 p-2 rounded">
                                        <span className="font-semibold">Normal:</span> 50 pts
                                    </div>
                                    <div className="bg-blue-100 text-blue-800 p-2 rounded">
                                        <span className="font-semibold">Large:</span> 25 pts
                                    </div>
                                </div>
                                <p className="text-xs text-white/70 mt-2">Wind affects arrow trajectory • Bonus points for remaining arrows!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default ArcheryGame