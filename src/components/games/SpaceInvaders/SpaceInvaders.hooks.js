import { useCallback, useEffect, useRef, useState } from 'react'
import { clearSpaceKeys, createSpaceGame, isSpaceControlTarget, stepSpaceGame } from './SpaceInvaders.logic'
import { drawSpaceInvaders } from './SpaceInvaders.render'

const getHud = state => ({ status: state.status, score: state.score, level: state.level, lives: state.lives, remaining: state.enemies.filter(enemy => enemy.alive).length })
const loadBest = () => {
    try { const value = Number(localStorage.getItem('spaceInvadersHighScore')); return Number.isFinite(value) && value >= 0 ? value : 0 }
    catch { return 0 }
}

export function useSpaceInvaders() {
    const canvasRef = useRef(null)
    const stateRef = useRef(null)
    if (!stateRef.current) stateRef.current = createSpaceGame()
    const [hud, setHud] = useState(() => getHud(stateRef.current))
    const published = useRef(hud)
    const [highScore, setHighScore] = useState(loadBest)
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768 || window.matchMedia('(hover: none) and (pointer: coarse)').matches)
    const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const [flatChoice, setFlatChoice] = useState(false)
    const flat = flatChoice || reducedMotion
    const focusBoard = useCallback(() => canvasRef.current?.focus({ preventScroll: true }), [])

    const publish = useCallback(() => {
        const next = getHud(stateRef.current)
        if (Object.keys(next).some(key => next[key] !== published.current[key])) {
            published.current = next
            setHud(next)
        }
    }, [])

    const startGame = useCallback(() => {
        if (isMobile) return
        // An explicit level avoids the old setLevel(1) / stale closure race.
        stateRef.current = createSpaceGame(1, 'playing')
        publish()
        focusBoard()
    }, [focusBoard, isMobile, publish])

    const togglePause = useCallback(() => {
        const state = stateRef.current
        if (state.status !== 'playing' && state.status !== 'paused') return
        state.status = state.status === 'playing' ? 'paused' : 'playing'
        clearSpaceKeys(state)
        publish()
        focusBoard()
    }, [focusBoard, publish])

    useEffect(() => {
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
        const touch = window.matchMedia('(hover: none) and (pointer: coarse)')
        const suspend = () => {
            const state = stateRef.current
            clearSpaceKeys(state)
            if (state.status === 'playing') { state.status = 'paused'; publish() }
        }
        const visibility = () => { if (document.hidden) suspend() }
        const resize = () => {
            const mobile = window.innerWidth < 768 || touch.matches
            setIsMobile(mobile)
            if (mobile) suspend()
        }
        const updateMotion = () => setReducedMotion(motion.matches)
        const focusin = event => { if (isSpaceControlTarget(event.target)) clearSpaceKeys(stateRef.current) }
        window.addEventListener('resize', resize)
        window.addEventListener('blur', suspend)
        document.addEventListener('visibilitychange', visibility)
        document.addEventListener('focusin', focusin)
        motion.addEventListener('change', updateMotion)
        touch.addEventListener('change', resize)
        return () => {
            window.removeEventListener('resize', resize)
            window.removeEventListener('blur', suspend)
            document.removeEventListener('visibilitychange', visibility)
            document.removeEventListener('focusin', focusin)
            motion.removeEventListener('change', updateMotion)
            touch.removeEventListener('change', resize)
        }
    }, [publish])

    useEffect(() => { setHighScore(best => Math.max(best, hud.score)) }, [hud.score])
    useEffect(() => { try { localStorage.setItem('spaceInvadersHighScore', String(highScore)) } catch { /* Storage can be unavailable in private mode. */ } }, [highScore])

    useEffect(() => {
        if (isMobile) return
        const keydown = event => {
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isSpaceControlTarget(event.target)) return
            const state = stateRef.current
            if (event.code === 'Space') {
                event.preventDefault()
                if (state.status === 'playing') state.spacePressed = true
                else if (state.status !== 'paused' && !event.repeat) startGame()
            } else if (event.code === 'Escape' && ['playing', 'paused'].includes(state.status)) {
                event.preventDefault()
                if (!event.repeat) togglePause()
            } else if (event.code === 'KeyR' && state.status !== 'ready') {
                event.preventDefault()
                if (!event.repeat) startGame()
            } else if (state.status === 'playing' && ['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(event.code)) {
                event.preventDefault()
                if (event.code === 'ArrowLeft' || event.code === 'KeyA') state.leftPressed = true
                else state.rightPressed = true
            }
        }
        const keyup = event => {
            const state = stateRef.current
            if (event.code === 'ArrowLeft' || event.code === 'KeyA') state.leftPressed = false
            if (event.code === 'ArrowRight' || event.code === 'KeyD') state.rightPressed = false
            if (event.code === 'Space') state.spacePressed = false
        }
        window.addEventListener('keydown', keydown)
        window.addEventListener('keyup', keyup)
        return () => {
            window.removeEventListener('keydown', keydown)
            window.removeEventListener('keyup', keyup)
            clearSpaceKeys(stateRef.current)
        }
    }, [isMobile, startGame, togglePause])

    useEffect(() => {
        if (!isMobile && canvasRef.current) drawSpaceInvaders(canvasRef.current, stateRef.current, flat)
    }, [hud, flat, isMobile])

    useEffect(() => {
        if (isMobile || hud.status !== 'playing' || !canvasRef.current) return
        let frame, lastTime = performance.now()
        const loop = time => {
            const state = stateRef.current
            stepSpaceGame(state, (time - lastTime) / 1000)
            lastTime = time
            if (canvasRef.current) drawSpaceInvaders(canvasRef.current, state, flat)
            publish()
            if (state.status === 'playing') frame = requestAnimationFrame(loop)
        }
        frame = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(frame)
    }, [flat, hud.status, isMobile, publish])

    return { canvasRef, hud, highScore, isMobile, reducedMotion, flat, startGame, togglePause,
        toggleFlat: () => setFlatChoice(value => !value), resetHighScore: () => setHighScore(0) }
}
