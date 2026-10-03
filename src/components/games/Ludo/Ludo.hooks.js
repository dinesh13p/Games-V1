import { useCallback, useEffect, useRef, useState } from 'react'
import { applyRoll, createGameState, moveToken, startMatch } from './Ludo.logic.js'

export function useLudoGame() {
    const [game, setGame] = useState(() => createGameState())
    const actionRef = useRef(null)
    const choicesRef = useRef(null)
    const previousPhase = useRef(game.phase)

    useEffect(() => {
        if (game.pendingRoll !== null) choicesRef.current?.querySelector('button:not(:disabled)')?.focus()
        else if (game.phase !== 'lobby' || previousPhase.current !== 'lobby') actionRef.current?.focus()
        previousPhase.current = game.phase
    }, [game.phase, game.pendingRoll])

    const choosePlayers = useCallback((playerCount, pair = game.pair) => {
        setGame(createGameState({ playerCount: Number(playerCount), pair, phase: 'lobby' }))
    }, [game.pair])

    const choosePair = useCallback(pair => {
        setGame(current => createGameState({ playerCount: current.playerCount, pair, phase: 'lobby' }))
    }, [])

    const begin = useCallback(() => setGame(current => startMatch(current)), [])
    const newMatch = useCallback(() => setGame(current => createGameState({ playerCount: current.playerCount, pair: current.pair })), [])

    const roll = useCallback(() => {
        // Sample once per click, outside the updater React may replay in StrictMode.
        const value = 1 + Math.floor(Math.random() * 6)
        setGame(current => applyRoll(current, value))
    }, [])

    const chooseToken = useCallback(tokenId => setGame(current => moveToken(current, tokenId)), [])

    return { game, choosePlayers, choosePair, begin, newMatch, roll, chooseToken, actionRef, choicesRef }
}
