import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../common/Header'
import Footer from '../../common/Footer'
import GameCard from '../../common/GameCard'
import GamesV1Img from '../../../assets/GamesV1.png'
import './Home.css'

const Home = () => {
	const navigate = useNavigate()
	const [selectedCategory, setSelectedCategory] = useState('All')
	const [searchQuery, setSearchQuery] = useState('')

	const games = [
		{ id: 'tictactoe', title: 'Tic-Tac-Toe', emoji: '⭕', description: 'Classic 3x3 strategy game. Get three in a row to win!', path: '/tictactoe', category: 'Strategy', difficulty: 'Easy', isFeatured: true },
		{ id: 'snake', title: 'Snake Game', emoji: '🐍', description: 'Classic snake game. Eat food, grow longer, avoid walls and yourself!', path: '/snake', category: 'Classic', difficulty: 'Easy', isFeatured: true },
		{ id: 'pong', title: 'Ping-Pong', emoji: '🏓', description: 'Classic arcade game. Beat the AI with your paddle skills!', path: '/pong', category: 'Sports', difficulty: 'Easy', isFeatured: false },
		{ id: 'brickbreaker', title: 'Brick Breaker', emoji: '🧱', description: 'Break all the bricks with your ball!', path: '/brickbreaker', category: 'Arcade', difficulty: 'Easy', isFeatured: false },
		{ id: 'flappybird', title: 'Flappy Bird', emoji: '🐦', description: 'Navigate through pipes by tapping to flap!', path: '/flappybird', category: 'Arcade', difficulty: 'Medium', isFeatured: true },
		{ id: 'frogger', title: 'Frogger', emoji: '🐸', description: 'Help the frog cross the road and river safely!', path: '/frogger', category: 'Classic', difficulty: 'Medium', isFeatured: false },
		{ id: 'archery', title: 'Archery', emoji: '🏹', description: 'Test your precision in this archery challenge!', path: '/archery', category: 'Sports', difficulty: 'Medium', isFeatured: false },
		{ id: 'tetris', title: 'Tetris', emoji: '🟦', description: 'Classic puzzle game. Fit the falling blocks!', path: '/tetris', category: 'Puzzle', difficulty: 'Medium', isFeatured: true },
		{ id: 'go', title: 'Go Game', emoji: '⚫️⚪️', description: 'Ancient strategy game (Gomoku Style). | IN PROGRESS', path: '/go', category: 'Strategy', difficulty: 'Medium', isFeatured: false },
		{ id: 'pacman', title: 'Pac-Man', emoji: '👻', description: 'Navigate the maze, eat pellets, avoid ghosts! | DESKTOP ONLY', path: '/pacman', category: 'Arcade', difficulty: 'Medium', isFeatured: false },
		{ id: 'doodlejump', title: 'Doodle Jump', emoji: '🦘', description: 'Jump from platform to platform!', path: '/doodlejump', category: 'Platform', difficulty: 'Hard', isFeatured: false },
		{ id: 'baghchal', title: 'Bagh Chal', emoji: '🐯🐐', description: 'Ancient Nepali strategy game. Tigers vs Goats! | IN PROGRESS', path: '/baghchal', category: 'Strategy', difficulty: 'Hard', isFeatured: false },
		{ id: 'minesweeper', title: 'Minesweeper', emoji: '💣', description: 'Uncover all safe tiles without detonating a mine!', path: '/minesweeper', category: 'Puzzle', difficulty: 'Hard', isFeatured: false },
		{ id: 'spaceinvaders', title: 'Space Invaders', emoji: '🚀', description: 'Defend Earth from alien invasion! | DESKTOP ONLY', path: '/spaceinvaders', category: 'Action', difficulty: 'Hard', isFeatured: true },
	]

	const categories = ['All', 'Featured', 'Classic', 'Arcade', 'Action', 'Puzzle', 'Strategy', 'Sports', 'Platform']

	const filteredGames = games.filter(g => {
		const matchesCategory = selectedCategory === 'All' ||
			(selectedCategory === 'Featured' ? g.isFeatured : g.category === selectedCategory)
		const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			g.description.toLowerCase().includes(searchQuery.toLowerCase())
		return matchesCategory && matchesSearch
	})

	return (
		<div className="min-h-screen bg-gray-900">
			<Header />

			{/* Hero Section */}
			<section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
				<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						<div className="space-y-8">
							<div className="space-y-4">
								<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm">
									<span className="animate-pulse">●</span>
									<span>14 Games Available</span>
								</div>
								<h1 className="text-4xl md:text-6xl font-bold">
									<span className="text-white block">Epic Games</span>
									<span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent block">
										Await You
									</span>
								</h1>
								<p className="text-xl text-gray-300 max-w-lg">
									Dive into our collection of classic and modern games. From retro arcade favorites to new challenges, there's something for every gamer.
								</p>
							</div>
							<div className="flex flex-wrap gap-4">
								<button
									onClick={() => {
										const el = document.getElementById('all-games-section')
										if (el) {
											const header = document.querySelector('header')
											const headerHeight = header ? header.offsetHeight : 0
											const y = el.getBoundingClientRect().top + window.scrollY - headerHeight
											window.scrollTo({ top: y, behavior: 'smooth' })
										}
									}}
									className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 text-white font-medium shadow-lg shadow-purple-500/25"
								>
									Start Playing
								</button>
								<button
									onClick={() => {
										setSelectedCategory('Featured')
										setTimeout(() => {
											const el = document.getElementById('all-games-section')
											if (el) {
												const header = document.querySelector('header')
												const headerHeight = header ? header.offsetHeight : 0
												const y = el.getBoundingClientRect().top + window.scrollY - headerHeight
												window.scrollTo({ top: y, behavior: 'smooth' })
											}
										}, 100)
									}}
									className="px-6 py-3 rounded-lg border border-gray-700 hover:border-purple-500 transition-all duration-300 text-gray-300 hover:text-white"
								>
									Featured Games
								</button>
							</div>
							<div className="flex items-center gap-8 text-sm text-gray-400">
								<div className="flex items-center gap-2">
									<span className="text-2xl font-bold text-white">14</span>
									<span>Games</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-2xl font-bold text-white">Free</span>
									<span>to Play</span>
								</div>
							</div>
						</div>
						<div className="relative flex items-center justify-center">
							<div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl" />
							<div className="relative rounded-3xl shadow-2xl w-full max-w-md overflow-hidden bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-4">
								<img
									className="w-full h-auto object-contain"
									alt="GamesV1 logo"
									src={GamesV1Img}
								/>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* All Games Section */}
			<section id="all-games-section" className="py-16 bg-gray-900/50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
						<div>
							<h2 className="text-3xl md:text-4xl font-bold text-white mb-2">All Games</h2>
							<p className="text-gray-400">{filteredGames.length} games available</p>
						</div>
						<div className="relative">
							<input
								type="text"
								placeholder="Search games..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full md:w-64 px-4 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
							/>
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
						</div>
					</div>

					<div className="flex flex-wrap gap-2 mb-8 p-4 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/30">
						{categories.map(c => (
							<button
								key={c}
								onClick={() => setSelectedCategory(c)}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${selectedCategory === c
										? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
										: 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
									}`}
							>
								{c}
							</button>
						))}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{filteredGames.map((game, index) => (
							<GameCard key={game.id} game={game} index={index} />
						))}
					</div>

					{filteredGames.length === 0 && (
						<div className="text-center py-16">
							<div className="text-6xl mb-4">🎮</div>
							<p className="text-gray-400 text-lg">No games found matching your criteria.</p>
							<button
								onClick={() => {
									setSelectedCategory('All')
									setSearchQuery('')
								}}
								className="mt-4 px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white transition-colors"
							>
								Clear Filters
							</button>
						</div>
					)}
				</div>
			</section>

			<Footer />
		</div>
	)
}

export default Home