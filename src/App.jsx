import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home/Home'
import TicTacToe from './components/games/TicTacToe/TicTacToe'
import Header from './components/common/Header'
import Footer from './components/common/Footer'
import GameLayout from './components/common/GameLayout'
import ErrorBoundary from './components/common/ErrorBoundary'
import { findGame, games } from './data/games'

const components = {
    BaghChalGame: lazy(() => import('./components/games/BaghChalGame/BaghChalGame')),
    SnakeGame: lazy(() => import('./components/games/SnakeGame/SnakeGame')),
    Tetris: lazy(() => import('./components/games/Tetris/Tetris')),
    GoGame: lazy(() => import('./components/games/GoGame/GoGame')),
    PacMan: lazy(() => import('./components/games/PacMan/PacMan')),
    SpaceInvaders: lazy(() => import('./components/games/SpaceInvaders/SpaceInvaders')),
    TicTacToe,
    Minesweeper: lazy(() => import('./components/games/Minesweeper/Minesweeper')),
    PongGame: lazy(() => import('./components/games/PongGame/PongGame')),
    BrickBreaker: lazy(() => import('./components/games/BrickBreaker/BrickBreaker')),
    FlappyBird: lazy(() => import('./components/games/FlappyBird/FlappyBird')),
    FroggerGame: lazy(() => import('./components/games/FroggerGame/FroggerGame')),
    DoodleJump: lazy(() => import('./components/games/DoodleJump/DoodleJump')),
    ArcheryGame: lazy(() => import('./components/games/ArcheryGame/ArcheryGame')),
    Ludo: lazy(() => import('./components/games/Ludo/Ludo')),
}

function RouteEffects() {
    const { pathname, hash } = useLocation()
    useEffect(() => {
        const game = findGame(pathname)
        document.title = game ? `${game.title} | Games / V1` : pathname === '/' ? 'Games / V1 · The browser game room' : 'Page not found | Games / V1'
        if (game) { try { localStorage.setItem('gamesv1-last-played', game.id) } catch { /* Optional local history. */ } }
        const frame = requestAnimationFrame(() => {
            const target = hash ? document.getElementById(hash.slice(1)) : document.getElementById('main-content')
            if (hash && target) target.scrollIntoView()
            else { window.scrollTo({ top: 0, behavior: 'instant' }); target?.focus({ preventScroll: true }) }
        })
        return () => cancelAnimationFrame(frame)
    }, [pathname, hash])
    return null
}

export default function App() {
    const { pathname } = useLocation()
    return <>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <Header />
        <RouteEffects />
        <ErrorBoundary key={pathname}>
            <Routes>
                <Route path="/" element={<Home />} />
                {games.map(game => {
                    const Game = components[game.component]
                    return <Route key={game.id} path={game.path} element={<GameLayout game={game}><Suspense fallback={<p className="game-loading" role="status">Opening {game.title}…</p>}><Game /></Suspense></GameLayout>} />
                })}
                <Route path="*" element={<main className="site-width not-found" id="main-content" tabIndex={-1}><p className="eyebrow">Off the board / 404</p><h1>No game at this address.</h1><p>The collection is still right here.</p><Link className="button button-primary" to="/">Back to the game room</Link></main>} />
            </Routes>
        </ErrorBoundary>
        <Footer />
    </>
}
