import { useCallback, useEffect, useRef, useState } from 'react'
import { HS_KEY, FLAP_VELOCITY, createFlappyGame, advanceFlappy } from './FlappyBird.logic'
import { renderFlappy } from './FlappyBird.render'

const loadBest = () => {
    try { return Number(localStorage.getItem(HS_KEY)) || 0 } catch { return 0 }
}
const summary = state => ({ phase: state.phase, score: state.score, highScore: state.highScore, won: state.won })

export function useFlappyBird() {
    const canvasRef = useRef(null)
    const model = useRef(null)
    if (!model.current) model.current = { ...createFlappyGame(), highScore: loadBest() }
    const sounds = useRef({})
    const muted = useRef(false)
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [view, setView] = useState(() => summary(model.current))
    const publish = useCallback(() => {
        const next = summary(model.current)
        setView(previous => Object.keys(next).every(key => next[key] === previous[key]) ? previous : next)
    }, [])
    useEffect(() => {
        const audio = Object.fromEntries(['die', 'hit', 'point', 'whoosh'].map(name => [name, new Audio(`/FlappyBird/${name}.mp3`)]))
        sounds.current = audio
        return () => { Object.values(audio).forEach(sound => sound.pause()); sounds.current = {} }
    }, [])
    const playSound = useCallback(name => {
        const sound = sounds.current[name]
        if (!sound || muted.current) return
        sound.currentTime = 0
        sound.volume = 0.5
        sound.play().catch(() => { })
    }, [])
    const startGame = useCallback(() => {
        model.current = { ...createFlappyGame(), highScore: model.current.highScore, phase: 'playing' }
        canvasRef.current?.focus({ preventScroll: true })
        model.current.bird.vy = FLAP_VELOCITY
        model.current.bird.rotation = -0.5
        playSound('whoosh')
        publish()
    }, [playSound, publish])
    const flap = useCallback(() => {
        if (['ready', 'over'].includes(model.current.phase)) { startGame(); return }
        if (model.current.phase !== 'playing') return
        model.current.bird.vy = FLAP_VELOCITY
        playSound('whoosh')
    }, [playSound, startGame])
    const togglePause = useCallback(() => {
        if (!['playing', 'paused'].includes(model.current.phase)) return
        model.current.phase = model.current.phase === 'playing' ? 'paused' : 'playing'
        if (model.current.phase === 'playing') canvasRef.current?.focus({ preventScroll: true })
        Object.values(sounds.current).forEach(sound => sound.pause())
        publish()
    }, [publish])
    const toggleSound = useCallback(() => {
        muted.current = !muted.current
        if (muted.current) Object.values(sounds.current).forEach(sound => sound.pause())
        setSoundEnabled(!muted.current)
    }, [])
    const resetScore = useCallback(() => {
        model.current.highScore = 0
        try { localStorage.removeItem(HS_KEY) } catch { /* Storage is optional. */ }
        publish()
    }, [publish])
    useEffect(() => {
        let frame, last = 0
        const loop = now => {
            const dt = last ? Math.min((now - last) / 1000, 0.033) : 0
            last = now
            if (model.current.phase === 'playing') {
                model.current = advanceFlappy(model.current, dt)
                model.current.events.forEach(playSound)
                if (model.current.score > model.current.highScore) {
                    model.current.highScore = model.current.score
                    try { localStorage.setItem(HS_KEY, String(model.current.score)) } catch { /* Storage is optional. */ }
                }
                publish()
            }
            renderFlappy(canvasRef.current, model.current)
            frame = requestAnimationFrame(loop)
        }
        frame = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(frame)
    }, [playSound, publish])
    useEffect(() => {
        const onKeyDown = event => {
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.target.closest?.('input, select, textarea, [contenteditable="true"]')) return
            if ([' ', 'Enter'].includes(event.key) && event.target.closest?.('button, a')) return
            if (event.key === ' ' || event.key === 'ArrowUp') { event.preventDefault(); if (!event.repeat) flap() }
            if (event.key.toLowerCase() === 'p' && !event.repeat) { event.preventDefault(); togglePause() }
        }
        const onBlur = () => { if (model.current.phase === 'playing') togglePause() }
        const onVisibility = () => { if (document.hidden) onBlur() }
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('blur', onBlur)
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('blur', onBlur)
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [flap, togglePause])
    return { canvasRef, view, startGame, flap, togglePause, resetScore, soundEnabled, toggleSound }
}
