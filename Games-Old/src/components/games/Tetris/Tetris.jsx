import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT,
    EMPTY, DAS_DELAY, ARR_INTERVAL, SOFT_DROP_INTERVAL, SOFT_DROP_POINTS_PER_CELL,
    HARD_DROP_POINTS_PER_CELL, randPiece, rotateCW, emptyBoard, copyBoard,
    isValid, placePiece, clearLines, getGhostY, dropTimeForLevel,
    loadHighScore, saveHighScore, getLineScores
} from './Tetris.logic'
import './Tetris.css'

const Tetris = () => {
    const canvasRef = useRef(null)
    const rafRef = useRef(null)
    const stateRef = useRef({
        board: emptyBoard(),
        current: null,
        px: 0,
        py: -2,
        next: null,
        hold: null,
        holdUsed: false,
        score: 0,
        lines: 0,
        level: 1,
        dropTimer: dropTimeForLevel(1),
        lastDrop: performance.now(),
        lastSoftDrop: performance.now()
    })

    const [started, setStarted] = useState(false)
    const [paused, setPaused] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [score, setScore] = useState(0)
    const [lines, setLines] = useState(0)
    const [level, setLevel] = useState(1)
    const [highScore, setHighScore] = useState(loadHighScore())
    const [isMobile, setIsMobile] = useState(false)
    const [showControlsHint, setShowControlsHint] = useState(true)

    const keysHeld = useRef({ left: false, right: false, down: false })
    const arrIntervalRef = useRef({ left: null, right: null })
    const touchRef = useRef({ startX: 0, startY: 0, startT: 0, lastTap: 0 })

    const syncStateToUI = useCallback(() => {
        const s = stateRef.current
        setScore(s.score)
        setLines(s.lines)
        setLevel(s.level)
    }, [])

    const resetGameState = useCallback(() => {
        const s = stateRef.current
        s.board = emptyBoard()
        s.current = randPiece()
        s.next = randPiece()
        s.hold = null
        s.holdUsed = false
        s.px = Math.floor((BOARD_WIDTH - s.current.shape[0].length) / 2)
        s.py = -2
        s.score = 0
        s.lines = 0
        s.level = 1
        s.dropTimer = dropTimeForLevel(1)
        s.lastDrop = performance.now()
        s.lastSoftDrop = performance.now()
        syncStateToUI()
        setGameOver(false)
    }, [syncStateToUI])

    const spawnNext = useCallback(() => {
        const s = stateRef.current
        s.current = s.next || randPiece()
        s.next = randPiece()
        s.px = Math.floor((BOARD_WIDTH - s.current.shape[0].length) / 2)
        s.py = -2
        s.holdUsed = false
        if (!isValid(s.board, s.current, s.px, s.py)) {
            setGameOver(true)
            setStarted(false)
            const hs = Math.max(s.score, loadHighScore())
            setHighScore(hs)
            saveHighScore(hs)
        }
    }, [])

    const onLinesCleared = useCallback((count) => {
        if (!count) return
        const lineScores = getLineScores()
        const s = stateRef.current
        const points = lineScores[count] * s.level
        s.score += points
        s.lines += count
        const newLevel = Math.floor(s.lines / 10) + 1
        if (newLevel !== s.level) {
            s.level = newLevel
            s.dropTimer = dropTimeForLevel(newLevel)
        }
        syncStateToUI()
    }, [syncStateToUI])

    const hardDrop = useCallback(() => {
        if (!started || paused || gameOver) return
        const s = stateRef.current
        const gy = getGhostY(s.board, s.current, s.px, s.py)
        const distance = gy - s.py
        s.py = gy
        s.board = placePiece(s.board, s.current, s.px, s.py)
        s.score += distance * HARD_DROP_POINTS_PER_CELL
        const { board: nb, cleared } = clearLines(s.board)
        s.board = nb
        if (cleared) onLinesCleared(cleared)
        spawnNext()
        syncStateToUI()
        s.lastDrop = performance.now()
    }, [started, paused, gameOver, spawnNext, onLinesCleared, syncStateToUI])

    const softDropOne = useCallback(() => {
        if (!started || paused || gameOver) return false
        const s = stateRef.current
        if (isValid(s.board, s.current, s.px, s.py + 1)) {
            s.py++
            s.score += SOFT_DROP_POINTS_PER_CELL
            syncStateToUI()
            return true
        } else {
            s.board = placePiece(s.board, s.current, s.px, s.py)
            const { board: nb, cleared } = clearLines(s.board)
            s.board = nb
            if (cleared) onLinesCleared(cleared)
            spawnNext()
            s.lastDrop = performance.now()
            syncStateToUI()
            return false
        }
    }, [started, paused, gameOver, spawnNext, onLinesCleared, syncStateToUI])

    const tryMove = useCallback((dx) => {
        const s = stateRef.current
        if (!s.current) return false
        const nx = s.px + dx
        if (isValid(s.board, s.current, nx, s.py)) {
            s.px = nx
            return true
        }
        return false
    }, [])

    const tryRotate = useCallback(() => {
        const s = stateRef.current
        if (!s.current) return
        const r = rotateCW(s.current)
        if (isValid(s.board, r, s.px, s.py)) {
            s.current = r
            return
        }
        if (isValid(s.board, r, s.px - 1, s.py)) {
            s.px -= 1
            s.current = r
            return
        }
        if (isValid(s.board, r, s.px + 1, s.py)) {
            s.px += 1
            s.current = r
            return
        }
        if (isValid(s.board, r, s.px, s.py - 1)) {
            s.py -= 1
            s.current = r
            return
        }
    }, [])

    const holdPiece = useCallback(() => {
        if (!started || paused || gameOver) return
        const s = stateRef.current
        if (s.holdUsed) return
        const current = s.current
        if (!current) return
        if (!s.hold) {
            s.hold = { ...current }
            spawnNext()
        } else {
            const temp = s.hold
            s.hold = { ...current }
            s.current = { ...temp }
            s.px = Math.floor((BOARD_WIDTH - s.current.shape[0].length) / 2)
            s.py = -2
            if (!isValid(s.board, s.current, s.px, s.py)) {
                setGameOver(true)
                setStarted(false)
                const hs = Math.max(s.score, loadHighScore())
                setHighScore(hs)
                saveHighScore(hs)
            }
        }
        s.holdUsed = true
        syncStateToUI()
    }, [started, paused, gameOver, spawnNext, syncStateToUI])

    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const s = stateRef.current

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        ctx.fillStyle = '#0b1220'
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const val = s.board[y][x]
                if (val) {
                    ctx.fillStyle = val
                    ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
                    ctx.strokeStyle = 'rgba(0,0,0,0.25)'
                    ctx.lineWidth = 1
                    ctx.strokeRect(x * CELL_SIZE + 1.5, y * CELL_SIZE + 1.5, CELL_SIZE - 3, CELL_SIZE - 3)
                } else {
                    ctx.fillStyle = '#06111a'
                    ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
                }
            }
        }

        if (s.current) {
            const gy = getGhostY(s.board, s.current, s.px, s.py)
            ctx.globalAlpha = 0.28
            ctx.fillStyle = s.current.color
            for (let y = 0; y < s.current.shape.length; y++) {
                for (let x = 0; x < s.current.shape[0].length; x++) {
                    if (s.current.shape[y][x]) {
                        ctx.fillRect((s.px + x) * CELL_SIZE + 1, (gy + y) * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
                    }
                }
            }
            ctx.globalAlpha = 1

            for (let y = 0; y < s.current.shape.length; y++) {
                for (let x = 0; x < s.current.shape[0].length; x++) {
                    if (s.current.shape[y][x]) {
                        const fx = (s.px + x) * CELL_SIZE + 1
                        const fy = (s.py + y) * CELL_SIZE + 1
                        ctx.fillStyle = s.current.color
                        ctx.fillRect(fx, fy, CELL_SIZE - 2, CELL_SIZE - 2)
                        ctx.strokeStyle = 'rgba(255,255,255,0.08)'
                        ctx.lineWidth = 1
                        ctx.strokeRect(fx + 0.5, fy + 0.5, CELL_SIZE - 3, CELL_SIZE - 3)
                    }
                }
            }
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.03)'
        ctx.lineWidth = 1
        for (let x = 1; x < BOARD_WIDTH; x++) {
            ctx.beginPath()
            ctx.moveTo(x * CELL_SIZE, 0)
            ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT)
            ctx.stroke()
        }
        for (let y = 1; y < BOARD_HEIGHT; y++) {
            ctx.beginPath()
            ctx.moveTo(0, y * CELL_SIZE)
            ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE)
            ctx.stroke()
        }
    }, [])

    const gameLoop = useCallback((now) => {
        rafRef.current = requestAnimationFrame(gameLoop)
        renderCanvas()
        if (!started || paused || gameOver) return

        const s = stateRef.current
        if (keysHeld.current.down) {
            if (now - s.lastSoftDrop >= SOFT_DROP_INTERVAL) {
                s.lastSoftDrop = now
                softDropOne()
            }
        }

        if (now - s.lastDrop >= s.dropTimer) {
            if (isValid(s.board, s.current, s.px, s.py + 1)) {
                s.py++
            } else {
                s.board = placePiece(s.board, s.current, s.px, s.py)
                const { board: nb, cleared } = clearLines(s.board)
                s.board = nb
                if (cleared) onLinesCleared(cleared)
                spawnNext()
            }
            s.lastDrop = now
            syncStateToUI()
        }
    }, [started, paused, gameOver, renderCanvas, softDropOne, onLinesCleared, spawnNext, syncStateToUI])

    const startGame = useCallback(() => {
        resetGameState()
        setStarted(true)
        setPaused(false)
        setGameOver(false)
        setScore(0)
        setLines(0)
        setLevel(1)
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(gameLoop)
    }, [resetGameState, gameLoop])

    const restartGame = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        startGame()
    }, [startGame])

    useEffect(() => {
        function onKeyDown(e) {
            if (!started && (e.code === 'Space' || e.key === 'Enter')) {
                e.preventDefault()
                startGame()
                return
            }
            if (gameOver && (e.code === 'Space' || e.key === 'Enter')) {
                e.preventDefault()
                restartGame()
                return
            }
            if (!started || gameOver) return

            if (e.key === 'p' || e.key === 'P') {
                setPaused(p => !p)
                return
            }

            if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
                e.preventDefault()
                if (keysHeld.current.left) return
                keysHeld.current.left = true
                const moved = tryMove(-1)
                if (moved) syncStateToUI()
                arrIntervalRef.current.left = setTimeout(() => {
                    arrIntervalRef.current.left = setInterval(() => {
                        const moved2 = tryMove(-1)
                        if (moved2) syncStateToUI()
                    }, ARR_INTERVAL)
                }, DAS_DELAY)
                return
            }

            if (['ArrowRight', 'd', 'D'].includes(e.key)) {
                e.preventDefault()
                if (keysHeld.current.right) return
                keysHeld.current.right = true
                const moved = tryMove(1)
                if (moved) syncStateToUI()
                arrIntervalRef.current.right = setTimeout(() => {
                    arrIntervalRef.current.right = setInterval(() => {
                        const moved2 = tryMove(1)
                        if (moved2) syncStateToUI()
                    }, ARR_INTERVAL)
                }, DAS_DELAY)
                return
            }

            if (['ArrowDown', 's', 'S'].includes(e.key)) {
                e.preventDefault()
                if (keysHeld.current.down) return
                keysHeld.current.down = true
                softDropOne()
                return
            }

            if (['ArrowUp', 'w', 'W'].includes(e.key)) {
                e.preventDefault()
                tryRotate()
                syncStateToUI()
                return
            }

            if (e.code === 'Space') {
                e.preventDefault()
                hardDrop()
                syncStateToUI()
                return
            }

            if (e.key === 'c' || e.key === 'C') {
                e.preventDefault()
                holdPiece()
                syncStateToUI()
                return
            }
        }

        function onKeyUp(e) {
            if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
                keysHeld.current.left = false
                if (arrIntervalRef.current.left) {
                    clearInterval(arrIntervalRef.current.left)
                    arrIntervalRef.current.left = null
                }
            }
            if (['ArrowRight', 'd', 'D'].includes(e.key)) {
                keysHeld.current.right = false
                if (arrIntervalRef.current.right) {
                    clearInterval(arrIntervalRef.current.right)
                    arrIntervalRef.current.right = null
                }
            }
            if (['ArrowDown', 's', 'S'].includes(e.key)) {
                keysHeld.current.down = false
            }
        }

        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
            if (arrIntervalRef.current.left) clearInterval(arrIntervalRef.current.left)
            if (arrIntervalRef.current.right) clearInterval(arrIntervalRef.current.right)
        }
    }, [started, gameOver, tryMove, softDropOne, tryRotate, hardDrop, holdPiece, restartGame, syncStateToUI, startGame])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        function onTouchStart(e) {
            if (!e.touches || !e.touches[0]) return
            const t = e.touches[0]
            touchRef.current.startX = t.clientX
            touchRef.current.startY = t.clientY
            touchRef.current.startT = performance.now()
        }

        function onTouchMove(e) {
            if (started && !paused) e.preventDefault()
        }

        function onTouchEnd(e) {
            const now = performance.now()
            const deltaX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX - touchRef.current.startX : 0
            const deltaY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY - touchRef.current.startY : 0
            const absX = Math.abs(deltaX)
            const absY = Math.abs(deltaY)

            if (now - touchRef.current.lastTap < 300) {
                hardDrop()
                touchRef.current.lastTap = 0
                return
            }

            if (absX > 30 && absX > absY) {
                if (deltaX > 0) { tryMove(1); syncStateToUI() }
                else { tryMove(-1); syncStateToUI() }
                touchRef.current.lastTap = now
                return
            }

            if (absY > 30 && absY > absX) {
                if (deltaY > 0) { softDropOne(); syncStateToUI() }
                else { tryRotate(); syncStateToUI() }
                touchRef.current.lastTap = now
                return
            }

            tryRotate()
            syncStateToUI()
            touchRef.current.lastTap = now
        }

        canvas.addEventListener('touchstart', onTouchStart, { passive: false })
        canvas.addEventListener('touchmove', onTouchMove, { passive: false })
        canvas.addEventListener('touchend', onTouchEnd, { passive: false })
        return () => {
            canvas.removeEventListener('touchstart', onTouchStart)
            canvas.removeEventListener('touchmove', onTouchMove)
            canvas.removeEventListener('touchend', onTouchEnd)
        }
    }, [started, paused, tryMove, tryRotate, softDropOne, hardDrop, syncStateToUI])

    useEffect(() => {
        function onResize() {
            setIsMobile(window.innerWidth < 768)
        }
        onResize()
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    useEffect(() => {
        renderCanvas()
        rafRef.current = requestAnimationFrame(gameLoop)
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    }, [gameLoop, renderCanvas])

    useEffect(() => { syncStateToUI() }, [syncStateToUI])

    useEffect(() => {
        const t = setTimeout(() => setShowControlsHint(false), 5000)
        return () => clearTimeout(t)
    }, [])

    const PiecePreview = ({ piece }) => {
        if (!piece) return <div className="preview-empty">—</div>
        return (
            <div className="piece-preview" style={{
                gridTemplateColumns: `repeat(${piece.shape[0].length}, ${CELL_SIZE / 2}px)`,
                gridTemplateRows: `repeat(${piece.shape.length}, ${CELL_SIZE / 2}px)`
            }}>
                {piece.shape.map((row, ry) =>
                    row.map((cell, rx) => (
                        <div
                            key={`${rx}-${ry}`}
                            className="preview-cell"
                            style={{
                                background: cell ? piece.color : 'transparent',
                                border: cell ? '1px solid rgba(0,0,0,0.15)' : '1px dashed rgba(255,255,255,0.03)'
                            }}
                        />
                    ))
                )}
            </div>
        )
    }

    const s = stateRef.current

    return (
        <div className="tetris-container">
            <div className="tetris-wrapper">
                <div className="tetris-header">
                    <h1>🧩 Tetris</h1>
                    <div className="tetris-header-actions">
                        <button onClick={() => { saveHighScore(0); setHighScore(0) }} className="reset-hs-btn">
                            Reset HS
                        </button>
                        <div className="high-score-display">
                            <span>High Score</span>
                            <span>{highScore.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="tetris-grid">
                    <div className="tetris-sidebar">
                        <div className="stat-box">
                            <span>Score</span>
                            <span>{score.toLocaleString()}</span>
                        </div>
                        <div className="stat-box">
                            <span>Level</span>
                            <span>{level}</span>
                        </div>
                        <div className="stat-box">
                            <span>Lines</span>
                            <span>{lines}</span>
                        </div>
                        <div className="preview-box">
                            <div className="preview-labels">
                                <span>Next</span>
                                <span>Hold</span>
                            </div>
                            <div className="preview-pieces">
                                <div className="preview-container">
                                    <PiecePreview piece={s.next} />
                                </div>
                                <div className="preview-container">
                                    <PiecePreview piece={s.hold} />
                                </div>
                            </div>
                            <div className="action-buttons">
                                <button onClick={startGame} className="btn-start">
                                    {started && !gameOver ? 'Playing' : 'Start'}
                                </button>
                                <button onClick={() => setPaused(p => !p)} className="btn-pause">
                                    {paused ? 'Resume' : 'Pause'}
                                </button>
                            </div>
                            <div className="action-buttons">
                                <button onClick={restartGame} className="btn-reset">Reset</button>
                                <button onClick={holdPiece} className="btn-hold">Hold</button>
                            </div>
                        </div>
                    </div>

                    <div className="tetris-board-wrapper">
                        <div className="tetris-canvas-container">
                            <canvas
                                ref={canvasRef}
                                width={CANVAS_WIDTH}
                                height={CANVAS_HEIGHT}
                                className="tetris-canvas"
                            />
                            {!started && !gameOver && (
                                <div className="overlay ready">
                                    <div>Ready</div>
                                    <div>Press Space or Tap to Start</div>
                                </div>
                            )}
                            {gameOver && (
                                <div className="overlay game-over">
                                    <div>Game Over</div>
                                    <div>Score: {score.toLocaleString()}</div>
                                    <div className="overlay-actions">
                                        <button onClick={restartGame}>Play Again</button>
                                        <button onClick={() => { saveHighScore(Math.max(score, loadHighScore())); setHighScore(loadHighScore()) }}>
                                            Save HS
                                        </button>
                                    </div>
                                </div>
                            )}
                            {paused && !gameOver && (
                                <div className="overlay paused">
                                    <div>Paused</div>
                                    <div>Press P to resume</div>
                                </div>
                            )}
                        </div>

                        {isMobile && (
                            <div className="mobile-controls">
                                <button onClick={() => { tryMove(-1); syncStateToUI() }}>⬅</button>
                                <button onClick={() => { tryRotate(); syncStateToUI() }}>🔄</button>
                                <button onClick={() => { tryMove(1); syncStateToUI() }}>➡</button>
                                <button onClick={() => { softDropOne(); syncStateToUI() }}>⬇</button>
                                <button onClick={() => { hardDrop(); syncStateToUI() }}>⚡ Drop</button>
                            </div>
                        )}
                    </div>

                    <div className="tetris-sidebar-right">
                        <div className="controls-box">
                            <span>Controls</span>
                            <div className="controls-text">
                                <p>Desktop: ← → move, ↑ rotate, ↓ soft drop, SPACE hard drop, C hold, P pause</p>
                                <p>Mobile: Tap to rotate, swipe to move, double-tap to hard drop</p>
                            </div>
                            {showControlsHint && <div className="controls-hint">Hint: hold ←/→ for continuous movement (DAS)</div>}
                        </div>
                        <div className="progress-box">
                            <span>Progress</span>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${(lines % 10) * 10}%` }} />
                            </div>
                            <div className="progress-text">Next level in {10 - (lines % 10)} lines</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Tetris