import React from 'react'
import { useNavigate } from 'react-router-dom'

const Home = () => {
    const navigate = useNavigate()

    const gameCards = [
        {
            id: 'snake',
            title: 'Snake Game',
            emoji: '🐍',
            description: 'Classic snake game. Eat food, grow longer, avoid walls and yourself!',
            path: '/snake'
        },
        {
            id: 'tictactoe',
            title: 'Tic-Tac-Toe',
            emoji: '✖️⭕',
            description: 'Classic strategy game. Get three in a row to win!',
            path: '/tictactoe'
        },
        {
            id: 'flappybird',
            title: 'Flappy Bird',
            emoji: '🐥',
            description: 'Navigate through pipes by tapping to flap your wings!',
            path: '/flappybird'
        },
        {
            id: 'frogger',
            title: 'Frogger',
            emoji: '🐸',
            description: 'Help the frog cross the road and river safely!',
            path: '/frogger'
        },
        {
            id: 'pong',
            title: 'Ping-Pong Game',
            emoji: '🏓',
            description: 'Classic arcade game. Beat the AI with your paddle skills!',
            path: '/pong'
        },
        {
            id: 'doodlejump',
            title: 'Doodle Jump',
            emoji: '🦘',
            description: 'Jump from platform to platform and avoid falling!',
            path: '/doodlejump'
        },
        {
            id: 'minesweeper',
            title: 'Minesweeper',
            emoji: '💣',
            description: 'Uncover all safe tiles without detonating a mine!',
            path: '/minesweeper'
        },
        {
            id: 'spaceinvaders',
            title: 'Space Invaders',
            emoji: '👾',
            description: 'Defend Earth from alien invasion. Shoot to survive!',
            path: '/spaceinvaders'
        },
        {
            id: 'pacman',
            title: 'Pac-Man',
            emoji: '🥠',
            description: 'Navigate the maze, eat pellets, and avoid ghosts!',
            path: '/pacman'
        }
    ]

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center fade-in max-w-6xl w-full">
                <h1 className="text-6xl font-bold text-white mb-4 pulse-slow">
                    🎮GamesV1
                </h1>
                <p className="text-xl text-white/90 mb-12">
                    Choose the game you want to play!
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {gameCards.map((game, index) => (
                        <div 
                            key={game.id}
                            className="game-card rounded-2xl p-8 text-center transform transition-all duration-300 hover:scale-105"
                            style={{
                                animationDelay: `${index * 0.1}s`
                            }}
                        >
                            <div className="text-6xl mb-4 transform transition-transform duration-300 hover:scale-110">
                                {game.emoji}
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">{game.title}</h2>
                            <p className="text-white/80 mb-6 min-h-[3rem]">
                                {game.description}
                            </p>
                            <button 
                                className="btn-primary text-white font-bold py-4 px-8 rounded-full text-lg w-full transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                onClick={() => navigate(game.path)}
                                aria-label={`Play ${game.title}`}
                            >
                                Play Now
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Home