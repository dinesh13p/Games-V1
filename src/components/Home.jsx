import React from 'react'
import GamesV1Img from '../assets/GamesV1.png';
import { useNavigate } from 'react-router-dom';

const Home = () => {
	const navigate = useNavigate();
	const games = [
		// Easy Games (Beginner-friendly)
		{ id: 'tictactoe', title: 'Tic-Tac-Toe', emoji: '⭕', description: 'Classic 3x3 strategy game. Get three in a row to win!', path: '/tictactoe', category: 'Strategy', difficulty: 'Easy', isFeatured: true },
		{ id: 'snake', title: 'Snake Game', emoji: '🐍', description: 'Classic snake game. Eat food, grow longer, avoid walls and yourself!', path: '/snake', category: 'Classic', difficulty: 'Easy', isFeatured: true },
		{ id: 'pong', title: 'Ping-Pong Game', emoji: '🏓', description: 'Classic arcade game. Beat the AI with your paddle skills!', path: '/pong', category: 'Sports', difficulty: 'Easy', isFeatured: false },
		{ id: 'brickbreaker', title: 'Brick Breaker', emoji: '🧱', description: 'Break all the bricks with your ball! Don\'t let it fall!', path: '/brickbreaker', category: 'Arcade', difficulty: 'Easy', isFeatured: false },
		
		// Medium Games (Intermediate)
		{ id: 'flappybird', title: 'Flappy Bird', emoji: '🐦', description: 'Navigate through pipes by tapping to flap your wings!', path: '/flappybird', category: 'Arcade', difficulty: 'Medium', isFeatured: true },
		{ id: 'frogger', title: 'Frogger', emoji: '🐸', description: 'Help the frog cross the road and river safely!', path: '/frogger', category: 'Classic', difficulty: 'Medium', isFeatured: false },
		{ id: 'archery', title: 'Archery Game', emoji: '🏹', description: 'Test your precision in this archery challenge!', path: '/archery', category: 'Sports', difficulty: 'Medium', isFeatured: false },
		{ id: 'pacman', title: 'Pac-Man', emoji: '👻', description: 'Navigate the maze, eat pellets, and avoid ghosts! | DESKTOP ONLY', path: '/pacman', category: 'Arcade', difficulty: 'Medium', isFeatured: false },
		{ id: 'tetris', title: 'Tetris', emoji: '🟦', description: 'Classic puzzle game. Fit the falling blocks into complete lines!', path: '/tetris', category: 'Puzzle', difficulty: 'Medium', isFeatured: true },
		
		// Hard Games (Advanced)
		{ id: 'doodlejump', title: 'Doodle Jump', emoji: '🦘', description: 'Jump from platform to platform and avoid falling!', path: '/doodlejump', category: 'Platform', difficulty: 'Hard', isFeatured: false },
		{ id: 'go', title: 'Go Game', emoji: '⚫️⚪️', description: 'Ancient strategy game. Get five in a row to win!', path: '/go', category: 'Strategy', difficulty: 'Hard', isFeatured: false },
		{ id: 'baghchal', title: 'Bagh Chal', emoji: '🐯🐐', description: 'Ancient Nepali strategy game. Tigers vs Goats!', path: '/baghchal', category: 'Strategy', difficulty: 'Hard', isFeatured: false },
		{ id: 'minesweeper', title: 'Minesweeper', emoji: '💣', description: 'Uncover all safe tiles without detonating a mine!', path: '/minesweeper', category: 'Puzzle', difficulty: 'Hard', isFeatured: false },
		{ id: 'spaceinvaders', title: 'Space Invaders', emoji: '🚀', description: 'Defend Earth from alien invasion. Shoot to survive! | DESKTOP ONLY', path: '/spaceinvaders', category: 'Action', difficulty: 'Hard', isFeatured: true },
	]

	const categories = ['All', 'Featured', 'Classic', 'Arcade', 'Action', 'Puzzle', 'Strategy', 'Sports', 'Platform']

	const [selectedCategory, setSelectedCategory] = React.useState('All')
	const [viewMode, setViewMode] = React.useState('grid')

	const filteredGames = games.filter(g => {
		if (selectedCategory === 'All') return true
		if (selectedCategory === 'Featured') return g.isFeatured
		return g.category === selectedCategory
	})

	const featuredGames = games.filter(g => g.isFeatured)

	const handleNavigate = (path) => {
		console.log(`Navigate to: ${path}`)
		// In your actual app, replace with: navigate(path)
	}

	return (
		<div className="min-h-screen bg-gray-900 text-white">
			{/* Header */}
			<header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-center h-16 w-full">
						<div className="flex items-center space-x-2 justify-center w-full">
							<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-600 grid place-items-center">🎮</div>
							<span className="text-2xl font-bold text-red-600">
								GamesV1
							</span>
						</div>
					</div>
				</div>
			</header>

			<main>
				{/* Hero Section */}
				<section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
					<div className="absolute inset-0 bg-black/20" />
					<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
							<div className="space-y-8 flex flex-col items-center justify-center text-center w-full">
								<div className="space-y-4">
									<h1 className="text-4xl md:text-6xl font-bold text-center">
										<span className="text-red-700 block">Epic Games</span>
										<span className="text-white block">Await You</span>
									</h1>
									<p className="text-xl text-gray-300 max-w-lg mx-auto">Dive into our collection of classic and modern games. From retro arcade favorites to new challenges, there's something for every gamer.</p>
								</div>
							<div className="flex flex-row gap-4 justify-center items-center">
							<button onClick={() => {
										const el = document.getElementById('all-games-section');
										if (el) {
											const header = document.querySelector('header');
											const headerHeight = header ? header.offsetHeight : 0;
											const y = el.getBoundingClientRect().top + window.scrollY - headerHeight;
											window.scrollTo({ top: y, behavior: 'smooth' });
										}
							}} className="px-6 py-3 rounded-md bg-purple-600 hover:bg-purple-700 transition-colors">Start Playing</button>
							<button onClick={() => {
								// Select Featured category then scroll to All Games
								setSelectedCategory('Featured');
								setTimeout(() => {
									const el = document.getElementById('all-games-section');
									if (el) {
										const header = document.querySelector('header');
										const headerHeight = header ? header.offsetHeight : 0;
										const y = el.getBoundingClientRect().top + window.scrollY - headerHeight;
										window.scrollTo({ top: y, behavior: 'smooth' });
									}
								}, 0);
							}} className="px-6 py-3 rounded-md bg-pink-600 hover:bg-pink-700 transition-colors">Featured</button>
								</div>
								{/* Fixed layout: Left-Right alignment in single line */}
								<div className="flex items-center justify-between gap-8 text-sm text-gray-400 w-full max-w-md">
									<div className="flex flex-col items-center">
							<span className="text-2xl font-bold text-white">14</span>
										<p>Games Available</p>
									</div>
									<div className="flex flex-col items-center">
										<span className="text-2xl font-bold text-white">Free</span>
										<p>to Play</p>
									</div>
								</div>
							</div>
							<div className="relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl" />
                                <div className="relative rounded-3xl shadow-2xl w-full h-56 md:h-64 lg:h-72 xl:h-80 overflow-hidden flex items-center justify-center bg-gray-900">
                                    <img className="max-h-full max-w-full object-contain" alt="GamesV1 logo" src={GamesV1Img} />
                                </div>
                            </div>
						</div>
					</div>
				</section>

				{/* All Games + Filters */}
				<section id="all-games-section" className="py-16 bg-gray-950">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
							<div>
								<h2 className="text-3xl md:text-4xl font-bold mb-2">All Games</h2>
								<p className="text-gray-400">{filteredGames.length} games available</p>
							</div>
						</div>

						<div className="flex flex-wrap gap-4 mb-8 p-4 bg-gray-800 rounded-xl">
							<div className="flex flex-wrap gap-2 items-center">
								<span className="text-sm text-gray-500">Category:</span>
								{categories.map(c => (
									<button key={c} onClick={() => setSelectedCategory(c)} className={`text-xs px-3 py-1.5 rounded-md border ${selectedCategory === c ? 'bg-purple-600 border-purple-600' : 'border-gray-700 hover:border-gray-600'}`}>{c}</button>
								))}
							</div>
						</div>

						<div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
							{filteredGames.map((game) => (
								<div key={game.id} className="group relative bg-gray-800 rounded-2xl p-6 transition-all duration-300 border border-gray-700 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10">
									<div className="mb-4 flex items-center justify-between">
										<div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl grid place-items-center text-2xl group-hover:scale-110 transition-transform duration-300">{game.emoji}</div>
										{game.isNew && <span className="text-xs px-2 py-1 rounded-md bg-green-500/20 text-green-400 border border-green-500/30">NEW</span>}
									</div>
									<div className="space-y-3">
										<div>
											<h3 className="text-lg font-semibold mb-1 group-hover:text-purple-400 transition-colors">{game.title}</h3>
											<p className="text-gray-400 text-sm line-clamp-2">{game.description}</p>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-xs px-2 py-1 rounded-md border border-gray-600 text-gray-400">{game.category}</span>
											<span className={`text-xs px-2 py-1 rounded-md border ${game.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400 border-green-500/30' : game.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>{game.difficulty}</span>
										</div>
										<button onClick={() => navigate(game.path)} className="w-full mt-4 px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 transition-colors">Play Now</button>
									</div>
								</div>
							))}
						</div>

						{filteredGames.length === 0 && (
							<div className="text-center py-12">
								<p className="text-gray-400 text-lg">No games found with the selected filters.</p>
								<button onClick={() => setSelectedCategory('All')} className="mt-4 px-4 py-2 rounded-md border border-gray-700 hover:border-gray-600">Clear Filters</button>
							</div>
						)}
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="border-t border-gray-800">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-gray-400 text-sm">
					<div className="flex justify-between items-center gap-8">
						<div className="space-y-2">
							<p>© {new Date().getFullYear()} GamesV1.</p>
							<p>Built by Dinesh Poudel</p>
						</div>
						<div>
							<a className="hover:text-white transition-colors" href="https://www.dinesh-poudel.com.np" target="_blank" rel="noreferrer"><b>Portfolio</b></a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	)
}

export default Home