import { useEffect, useReducer } from 'react'
import { calculateWinner, createTicTacToeState, emptyScores, getAiMove, ticTacToeReducer } from './TicTacToe.logic.js'

const SCORE_KEYS = { pvp: 'ticTacToeScores', pvc: 'ticTacToeScoresAI' }

const readScores = () => Object.fromEntries(Object.entries(SCORE_KEYS).map(([mode, key]) => {
    try {
        const saved = JSON.parse(localStorage.getItem(key))
        const scores = Object.fromEntries(['X', 'O', 'draws'].map(name => [name,
            Number.isSafeInteger(saved?.[name]) && saved[name] >= 0 ? saved[name] : 0,
        ]))
        return [mode, scores]
    } catch {
        return [mode, emptyScores()]
    }
}))

export const useTicTacToe = () => {
    const [state, dispatch] = useReducer(ticTacToeReducer, undefined, () => createTicTacToeState(readScores()))
    const result = calculateWinner(state.squares)
    const { mode, next, round, squares, difficulty, scores } = state
    const aiThinking = mode === 'pvc' && next === 'O' && !result.winner

    useEffect(() => {
        if (!aiThinking) return
        const timer = window.setTimeout(() => {
            dispatch({ type: 'move', index: getAiMove(squares, difficulty), actor: 'ai', round })
        }, 400)
        return () => window.clearTimeout(timer)
    }, [aiThinking, squares, difficulty, round])

    useEffect(() => {
        try {
            for (const [mode, key] of Object.entries(SCORE_KEYS)) {
                localStorage.setItem(key, JSON.stringify(scores[mode]))
            }
        } catch { /* Scores remain available for this session without storage. */ }
    }, [scores])

    const status = result.winner === 'Draw' ? 'A draw. Another round?'
        : result.winner ? mode === 'pvc'
            ? result.winner === 'X' ? 'You win. Well played.' : 'Computer wins this round.'
            : `Player ${result.winner} wins.`
            : aiThinking ? 'Computer is thinking. O to play.'
                : mode === 'pvc' ? 'Your turn. You are X.' : `Player ${next} to play.`

    return {
        state, result, aiThinking, status,
        play: index => dispatch({ type: 'move', index, actor: 'human', round }),
        restart: () => dispatch({ type: 'restart' }),
        setMode: mode => dispatch({ type: 'mode', mode }),
        setDifficulty: difficulty => dispatch({ type: 'difficulty', difficulty }),
        resetScores: () => dispatch({ type: 'resetScores' }),
    }
}
