import { Link } from 'react-router-dom'
import GameCard from '../../components/common/GameCard'
import GameArtwork from '../../components/common/GameArtwork'
import TicTacToe from '../../components/games/TicTacToe/TicTacToe'
import { categories, games } from '../../data/games'
import { useCatalogue } from './Home.hooks'
import './Home.css'

export default function Home() {
    const { filters, results, recent, updateFilter, surprise, clear } = useCatalogue()
    return <main id="main-content" tabIndex={-1}>
        <section className="home-intro site-width" aria-labelledby="home-title">
            <div className="intro-copy">
                <p className="eyebrow">The browser game room / By Dinesh</p>
                <h1 id="home-title">For the love<br />of <em>one more</em><br />round.</h1>
                <p className="intro-description">Old favourites. Quiet rivalries. The kind of games that turn a spare minute into a good afternoon.</p>
                <div className="intro-actions"><a className="button button-primary" href="#collection">Find your game <span>{games.length}</span></a><Link to="/baghchal" className="text-link">Start with Bagh Chal</Link></div>
                <p className="intro-footnote">Free to play. Made to be played.</p>
            </div>
            <div className="demo-sheet">
                <div className="demo-caption"><span>Table no. 07</span><span>Try a round</span></div>
                <h2>Your move.</h2>
                <p>A real game, right here. You’re X.</p>
                <TicTacToe embedded />
                <div className="demo-footer"><span>Tic-Tac-Toe / vs. computer</span><Link to="/tictactoe">Open game</Link></div>
            </div>
        </section>
        <div className="collection-strip"><div className="site-width"><span>{games.length} ways to spend a little time</span><span>{games.filter(game => game.mobile).length} touch friendly <span aria-hidden="true">/</span> {games.filter(game => !game.mobile).length} keyboard classics</span></div></div>
        <section id="collection" className="site-width collection-section" aria-labelledby="collection-title">
            <div className="collection-heading"><div><p className="eyebrow">Pick up where curiosity takes you</p><h2 id="collection-title">The collection<span> / 01–{String(games.length).padStart(2, '0')}</span></h2></div>{recent && <Link to={recent.path} className="recent-link">Last opened: {recent.title}</Link>}</div>
            <div className="catalogue-tools">
                <div className="category-tabs" role="group" aria-label="Filter by game category">{categories.map(category => <button key={category} aria-pressed={filters.category === category} onClick={() => updateFilter('category', category)}>{category}</button>)}</div>
                <label className="catalogue-search"><span className="visually-hidden">Search the collection</span><input type="search" placeholder="Find a game" value={filters.query} onChange={event => updateFilter('q', event.target.value)} /></label>
            </div>
            <div className="catalogue-options"><p role="status">{results.length} {results.length === 1 ? 'game' : 'games'} on the table</p><label><input type="checkbox" checked={filters.touchOnly} onChange={event => updateFilter('touch', event.target.checked ? '1' : '')} /> Touch friendly only</label><button onClick={surprise} disabled={!results.length} className="surprise-button">Choose for me</button></div>
            {results.length ? <ul className="catalogue-list">{results.map(game => <GameCard key={game.id} game={game} />)}</ul> : <div className="empty-catalogue"><h3>Nothing on this shelf.</h3><p>Try another name or open the full collection.</p><button className="button" onClick={clear}>Clear filters</button></div>}
        </section>
        <section className="spotlight site-width" aria-labelledby="spotlight-title">
            <div className="spotlight-art"><GameArtwork id="baghchal" /><span>बाघचाल / Nepal</span></div>
            <div className="spotlight-copy"><p className="eyebrow">Close to home</p><h2 id="spotlight-title">A small board.<br />A long tradition.</h2><p>Bagh Chal is a game of unequal sides and carefully balanced chances. Four tigers hunt. Twenty goats work together. Every empty point matters.</p><Link className="button button-primary" to="/baghchal">Take a seat at Bagh Chal</Link></div>
        </section>
        <section id="about" className="site-width about-section" aria-labelledby="about-title"><p className="eyebrow">A note from the maker</p><h2 id="about-title">A place for games.<br />Nothing more complicated.</h2><div><p>Hi! I’m Dinesh. This is my collection of browser games, from the arcade classics to Bagh Chal, a game from home. Pick something familiar or learn something new.</p><p>No accounts to make and no downloads to wait for. Best scores are kept on your device. Pac-Man and Space Invaders still belong at a keyboard; the rest are ready for a smaller screen.</p><span className="maker-signature">Dinesh Poudel</span></div></section>
    </main>
}
