import { useCallback, useEffect, useRef, useState } from 'react'
import { createDoodleGame, advanceDoodle } from './DoodleJump.logic'
import { renderDoodle } from './DoodleJump.render'

const summary = state => ({ phase: state.phase, score: state.score, highScore: state.highScore, flying: state.doodler.flying })

export function useDoodleJump() {
    const canvasRef = useRef(null)
    const model = useRef(null)
    if (!model.current) model.current = { ...createDoodleGame(), highScore: 0 }
    const keys = useRef({ left: false, right: false })
    const pointer = useRef(null)
    const [view, setView] = useState(() => summary(model.current))
    const publish = useCallback(() => {
        const next = summary(model.current)
        setView(previous => Object.keys(next).every(key => next[key] === previous[key]) ? previous : next)
    }, [])
    const startGame = useCallback(() => {
        model.current = { ...createDoodleGame(), phase: 'playing', highScore: model.current.highScore }
        canvasRef.current?.focus({ preventScroll: true })
        keys.current = { left: false, right: false }
        pointer.current = null
        publish()
    }, [publish])
    const togglePause = useCallback(() => {
        if (!['playing', 'paused'].includes(model.current.phase)) return
        model.current.phase = model.current.phase === 'playing' ? 'paused' : 'playing'
        if (model.current.phase === 'playing') canvasRef.current?.focus({ preventScroll: true })
        keys.current = { left: false, right: false }
        pointer.current = null
        publish()
    }, [publish])
    const setDirection = useCallback((direction, pressed) => {
        keys.current[direction] = pressed && model.current.phase === 'playing'
    }, [])
    const onPointerDown = useCallback(event => {
        if (model.current.phase !== 'playing') return
        pointer.current = event.clientX
        event.currentTarget.setPointerCapture(event.pointerId)
    }, [])
    const onPointerMove = useCallback(event => {
        if (pointer.current === null || model.current.phase !== 'playing') return
        const delta = event.clientX - pointer.current
        if (Math.abs(delta) < 8) return
        keys.current = { left: delta < 0, right: delta > 0 }
        pointer.current = event.clientX
    }, [])
    const onPointerUp = useCallback(() => {
        pointer.current = null
        keys.current = { left: false, right: false }
    }, [])

    useEffect(() => {
        let frame, last = 0, elapsed = 0
        const loop = now => {
            elapsed += last ? Math.min((now - last) / 1000, 0.05) : 0
            last = now
            if (model.current.phase === 'playing') {
                while (elapsed >= 1 / 60 && model.current.phase === 'playing') {
                    model.current = advanceDoodle(model.current, keys.current)
                    elapsed -= 1 / 60
                }
                if (model.current.phase === 'over') model.current.highScore = Math.max(model.current.highScore, model.current.score)
                publish()
            } else elapsed = 0
            renderDoodle(canvasRef.current, model.current)
            frame = requestAnimationFrame(loop)
        }
        frame = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(frame)
    }, [publish])

    useEffect(() => {
        const onKeyDown = event => {
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.target.closest?.('input, select, textarea, [contenteditable="true"]')) return
            if ([' ', 'Enter'].includes(event.key) && event.target.closest?.('button, a')) return
            const key = event.key.toLowerCase()
            if ([' ', 'enter', 'p'].includes(key)) {
                event.preventDefault()
                if (event.repeat) return
                if (['ready', 'over'].includes(model.current.phase)) startGame()
                else togglePause()
            }
            if (key === 'arrowleft' || key === 'a') { event.preventDefault(); setDirection('left', true) }
            if (key === 'arrowright' || key === 'd') { event.preventDefault(); setDirection('right', true) }
        }
        const onKeyUp = event => {
            if (['ArrowLeft', 'a', 'A'].includes(event.key)) setDirection('left', false)
            if (['ArrowRight', 'd', 'D'].includes(event.key)) setDirection('right', false)
        }
        const onBlur = () => {
            onPointerUp()
            if (model.current.phase === 'playing') { model.current.phase = 'paused'; publish() }
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
    }, [publish, setDirection, startGame, togglePause, onPointerUp])
    return { canvasRef, view, startGame, togglePause, setDirection, onPointerDown, onPointerMove, onPointerUp }
}
