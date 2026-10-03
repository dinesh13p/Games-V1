import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPacmanGame, isPacmanControlTarget, movePacman, movePacmanGhosts, PACMAN_KEYS, pacmanGhostDelay } from './PacMan.logic'
import { drawPacman } from './PacMan.render'

export function usePacman() {
    const canvasRef = useRef(null)
    const [state, setState] = useState(() => createPacmanGame())
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768 || window.matchMedia('(hover: none) and (pointer: coarse)').matches)
    const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const [flatChoice, setFlatChoice] = useState(false)
    const [paused, setPaused] = useState(false)
    const [highScore, setHighScore] = useState(0)
    const flat = reducedMotion || flatChoice
    const latest = useRef(state)
    const focusBoard = useCallback(() => canvasRef.current?.focus({ preventScroll: true }), [])

    useEffect(() => { latest.current = state }, [state])
    useEffect(() => { setHighScore(best => Math.max(best, state.score)) }, [state.score])

    useEffect(() => {
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
        const touch = window.matchMedia('(hover: none) and (pointer: coarse)')
        const resize = () => {
            const mobile = window.innerWidth < 768 || touch.matches
            setIsMobile(mobile)
            if (mobile) setPaused(true)
        }
        const updateMotion = () => setReducedMotion(motion.matches)
        const suspend = () => setPaused(true)
        const visibility = () => { if (document.hidden) suspend() }
        window.addEventListener('resize', resize)
        window.addEventListener('blur', suspend)
        document.addEventListener('visibilitychange', visibility)
        motion.addEventListener('change', updateMotion)
        touch.addEventListener('change', resize)
        return () => {
            window.removeEventListener('resize', resize)
            window.removeEventListener('blur', suspend)
            document.removeEventListener('visibilitychange', visibility)
            motion.removeEventListener('change', updateMotion)
            touch.removeEventListener('change', resize)
        }
    }, [])

    const startGame = useCallback(() => {
        if (isMobile) return
        setState(current => createPacmanGame(current.difficulty, 'playing'))
        setPaused(false)
        focusBoard()
    }, [focusBoard, isMobile])
    const togglePause = useCallback(() => { setPaused(value => !value); focusBoard() }, [focusBoard])

    useEffect(() => {
        if (isMobile) return
        const keydown = event => {
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isPacmanControlTarget(event.target)) return
            const direction = PACMAN_KEYS[event.code]
            if (direction && state.status === 'playing' && !paused) {
                event.preventDefault()
                setState(current => movePacman(current, direction.dx, direction.dy))
            } else if (event.code === 'Space' && state.status !== 'playing' && !event.repeat) {
                event.preventDefault()
                startGame()
            } else if (event.code === 'Escape' && state.status === 'playing' && !event.repeat) {
                event.preventDefault()
                togglePause()
            }
        }
        window.addEventListener('keydown', keydown)
        return () => window.removeEventListener('keydown', keydown)
    }, [isMobile, paused, state.status, startGame, togglePause])

    const ghostDelay = pacmanGhostDelay(state)
    useEffect(() => {
        if (state.status !== 'playing' || paused || isMobile) return
        const ghosts = window.setInterval(() => setState(current => movePacmanGhosts(current)), ghostDelay)
        const power = window.setInterval(() => setState(current => current.powerTimer > 0 ? { ...current, powerTimer: Math.max(0, current.powerTimer - 100) } : current), 100)
        return () => { window.clearInterval(ghosts); window.clearInterval(power) }
    }, [ghostDelay, isMobile, paused, state.status])

    useEffect(() => {
        if (isMobile || !canvasRef.current) return
        drawPacman(canvasRef.current, state, flat, flat ? 0 : performance.now())
    }, [state, flat, isMobile])

    useEffect(() => {
        if (isMobile || flat || paused || state.status !== 'playing') return
        let frame, lastFrame = 0
        const animate = time => {
            if (time - lastFrame >= 1000 / 30 && canvasRef.current) {
                drawPacman(canvasRef.current, latest.current, false, time)
                lastFrame = time
            }
            frame = requestAnimationFrame(animate)
        }
        frame = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(frame)
    }, [flat, isMobile, paused, state.status])

    const remaining = useMemo(() => state.maze.reduce((sum, row) => sum + row.filter(cell => cell === 'P' || cell === 'O').length, 0), [state.maze])
    return {
        canvasRef, state, highScore, isMobile, reducedMotion, flat, paused, remaining, startGame, togglePause,
        changeDifficulty: difficulty => { setState(createPacmanGame(difficulty)); setPaused(false) },
        toggleFlat: () => setFlatChoice(value => !value),
        resetHighScore: () => setHighScore(0)
    }
}
