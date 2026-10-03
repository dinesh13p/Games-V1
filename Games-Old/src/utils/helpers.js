export const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
        case 'Easy':
            return 'bg-green-500/20 text-green-400 border-green-500/30'
        case 'Medium':
            return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        case 'Hard':
            return 'bg-red-500/20 text-red-400 border-red-500/30'
        default:
            return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
}

export const getCategoryEmoji = (category) => {
    const map = {
        Classic: '🎮',
        Arcade: '🕹️',
        Action: '⚡',
        Puzzle: '🧩',
        Strategy: '♟️',
        Sports: '⚽',
        Platform: '🦘',
    }
    return map[category] || '🎯'
}

export const getRandomColor = () => {
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4ade80', '#22c55e', '#fbbf24', '#f59e0b',
        '#f87171', '#ef4444', '#60a5fa', '#3b82f6',
    ]
    return colors[Math.floor(Math.random() * colors.length)]
}

export const clamp = (value, min, max) => {
    return Math.max(min, Math.min(max, value))
}

export const randRange = (min, max) => {
    return Math.random() * (max - min) + min
}