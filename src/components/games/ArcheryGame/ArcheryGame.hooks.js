import { useCallback, useEffect, useRef, useState } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT, BOW_X, BOW_Y, createLevel, advanceArchery, shootArrow } from './ArcheryGame.logic'
import { renderArchery } from './ArcheryGame.render'

const loadBest = () => {
    try { return Number(localStorage.getItem('archeryHighScore')) || 0 } catch { return 0 }
}
const summary = state => ({ phase: state.phase, score: state.score, highScore: state.highScore,
    level: state.level, arrows: state.arrowsLeft, wind: state.wind, power: Math.floor(state.power) })

export function useArchery() {
    const canvasRef = useRef(null)
    const model = useRef(null)
    if (!model.current) model.current = { ...createLevel(), score: 0, phase: 'ready', highScore: loadBest() }
    const [view, setView] = useState(() => summary(model.current))
    const publish = useCallback(() => {
        const next = summary(model.current)
        setView(previous => Object.keys(next).every(key => next[key] === previous[key]) ? previous : next)
    }, [])
    const startGame = useCallback(() => {
        model.current = { ...createLevel(), score: 0, phase: 'playing', highScore: model.current.highScore }
        canvasRef.current?.focus({ preventScroll: true })
        publish()
    }, [publish])
    const cancelCharge = useCallback(() => {
        model.current.chargeAt = null
        model.current.power = 0
        publish()
    }, [publish])
    const togglePause = useCallback(() => {
        if (!['playing', 'paused'].includes(model.current.phase)) return
        model.current.phase = model.current.phase === 'playing' ? 'paused' : 'playing'
        if (model.current.phase === 'playing') canvasRef.current?.focus({ preventScroll: true })
        cancelCharge()
    }, [cancelCharge])
    const aim = useCallback(event => {
        const rect = canvasRef.current.getBoundingClientRect()
        const x = (event.clientX - rect.left) * CANVAS_WIDTH / rect.width
        const y = (event.clientY - rect.top) * CANVAS_HEIGHT / rect.height
        model.current.bowAngle = Math.atan2(y - BOW_Y, x - BOW_X)
    }, [])
    const startCharge = useCallback(() => {
        const state = model.current
        if (state.phase !== 'playing' || state.arrowsLeft <= 0 || state.chargeAt !== null) return
        state.chargeAt = performance.now()
    }, [])
    const release = useCallback(() => {
        if (model.current.chargeAt === null) return
        model.current = shootArrow(model.current, (performance.now() - model.current.chargeAt) / 1000)
        cancelCharge()
    }, [cancelCharge])
    const onPointerDown = useCallback(event => {
        if (event.button !== 0) return
        if (['ready', 'over'].includes(model.current.phase)) { startGame(); return }
        aim(event)
        event.currentTarget.setPointerCapture(event.pointerId)
        startCharge()
    }, [aim, startCharge, startGame])
    const resetScore = useCallback(() => {
        model.current.highScore = 0
        try { localStorage.removeItem('archeryHighScore') } catch { /* Storage is optional. */ }
        publish()
    }, [publish])

    useEffect(() => {
        let frame, last = 0, elapsed = 0
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
        const loop = now => {
            elapsed += last ? Math.min((now - last) / 1000, 0.05) : 0
            last = now
            if (model.current.phase === 'playing') {
                if (model.current.chargeAt !== null) model.current.power = Math.min((now - model.current.chargeAt) / 20, 100)
                while (elapsed >= 1 / 60 && model.current.phase === 'playing') {
                    model.current = advanceArchery(model.current, reducedMotion.matches)
                    elapsed -= 1 / 60
                }
                const state = model.current
                if (state.phase === 'over' && state.score > state.highScore) {
                    state.highScore = state.score
                    try { localStorage.setItem('archeryHighScore', String(state.score)) } catch { /* Storage is optional. */ }
                }
                publish()
            } else elapsed = 0
            renderArchery(canvasRef.current, model.current)
            frame = requestAnimationFrame(loop)
        }
        frame = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(frame)
    }, [publish])

    useEffect(() => {
        const onKeyDown = event => {
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.target.closest?.('input, select, textarea, [contenteditable="true"]')) return
            if ([' ', 'Enter'].includes(event.key) && event.target.closest?.('button, a')) return
            if (event.key === ' ') {
                event.preventDefault()
                if (event.repeat) return
                if (['ready', 'over'].includes(model.current.phase)) startGame()
                else startCharge()
            }
            if (event.key.toLowerCase() === 'p' && !event.repeat) { event.preventDefault(); togglePause() }
            if (model.current.phase === 'playing' && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
                event.preventDefault()
                model.current.bowAngle += event.key === 'ArrowUp' ? -0.03 : 0.03
            }
        }
        const onKeyUp = event => { if (event.key === ' ') release() }
        const onBlur = () => {
            if (model.current.phase === 'playing') model.current.phase = 'paused'
            cancelCharge()
        }
        const onVisibility = () => { if (document.hidden) onBlur() }
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        window.addEventListener('blur', onBlur)
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
            window.removeEventListener('blur', onBlur)
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [cancelCharge, release, startCharge, startGame, togglePause])
    return { canvasRef, view, startGame, togglePause, onPointerDown, aim, release, cancelCharge, resetScore }
}
