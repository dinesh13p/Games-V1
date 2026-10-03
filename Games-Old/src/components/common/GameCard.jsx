import React from 'react'
import { useNavigate } from 'react-router-dom'

const GameCard = ({ game, index }) => {
    const navigate = useNavigate()
    const colors = [
        'from-purple-500/20 to-pink-500/20',
        'from-blue-500/20 to-cyan-500/20',
        'from-green-500/20 to-emerald-500/20',
        'from-yellow-500/20 to-orange-500/20',
        'from-red-500/20 to-pink-500/20',
        'from-indigo-500/20 to-purple-500/20',
    ]

    return (
        <div
            className={`group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 transition-all duration-300 border border-gray-700/50 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 hover:transform hover:-translate-y-1 ${colors[index % colors.length]}`}
        >
            <div className="mb-4 flex items-center justify-between">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-600 rounded-2xl grid place-items-center text-3xl group-hover:scale-110 transition-transform duration-300">
                    {game.emoji}
                </div>
                {game.isFeatured && (
                    <span className="text-xs px-2 py-1 rounded-md bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-300 border border-purple-500/30">
                        Featured
                    </span>
                )}
            </div>
            <div className="space-y-3">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">
                        {game.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2">
                        {game.description}
                    </p>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 rounded-md bg-gray-700/50 text-gray-300 border border-gray-600/30">
                        {game.category}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-md border ${game.difficulty === 'Easy'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : game.difficulty === 'Medium'
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                        {game.difficulty}
                    </span>
                </div>
                <button
                    onClick={() => navigate(game.path)}
                    className="w-full mt-4 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 text-white font-medium text-sm shadow-lg shadow-purple-500/20"
                >
                    Play Now
                </button>
            </div>
        </div>
    )
}

export default GameCard