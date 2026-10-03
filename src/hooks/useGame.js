import { useState, useCallback, useRef, useEffect } from 'react'

export function useGame(initialState, gameLoop) {
    const [gameState, setGameState] = useState(initialState)
    const [isRunning, setIsRunning] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const animationRef = useRef(null)
    const lastTimeRef = useRef(0)

    const start = useCallback(() => {
        setIsRunning(true)
        setIsPaused(false)
        lastTimeRef.current = performance.now()
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
        }
        animationRef.current = requestAnimationFrame(gameLoop)
    }, [gameLoop])

    const pause = useCallback(() => {
        setIsPaused(true)
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
        }
    }, [])

    const resume = useCallback(() => {
        setIsPaused(false)
        lastTimeRef.current = performance.now()
        animationRef.current = requestAnimationFrame(gameLoop)
    }, [gameLoop])

    const reset = useCallback(() => {
        setIsRunning(false)
        setIsPaused(false)
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
        }
        setGameState(initialState)
    }, [initialState])

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [])

    return {
        gameState,
        setGameState,
        isRunning,
        isPaused,
        start,
        pause,
        resume,
        reset,
        animationRef,
        lastTimeRef,
    }
}