import React from 'react'
import { useNavigate } from 'react-router-dom'

const Header = () => {
    const navigate = useNavigate()

    return (
        <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-600 grid place-items-center text-xl">
                            🎮
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                            GamesV1
                        </span>
                    </button>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/')}
                            className="text-gray-300 hover:text-white transition-colors text-sm"
                        >
                            Home
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header