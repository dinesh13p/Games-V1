import { Link } from 'react-router-dom'
import { games } from '../../data/games'
import { nodeProp, objectProp } from '../../utils/propTypes'

export default function GameLayout({ children, game }) {
    const next = games[(games.indexOf(game) + 1) % games.length]
    return <main id="main-content" className="site-width game-page" tabIndex={-1}>
        <div className="game-breadcrumb"><Link to="/#collection">Back to the collection</Link><span>No. {game.number} / {games.length}</span></div>
        <div className="game-heading">
            <div><p className="eyebrow">{game.category} / {game.players}</p><h1>{game.title}</h1><p>{game.description}</p></div>
            <div className="game-device"><span>{game.input}</span>{game.dimensional && <span>Animated 3D relief / optional flat view</span>}</div>
        </div>
        <div className="game-workbench">{children}</div>
        <details className="game-field-notes"><summary>How to play &amp; field notes</summary><div><p>{game.controls}</p><p>{game.note}</p><p>Scores, where supported, stay in this browser. Nothing is sent to a leaderboard.</p></div></details>
        <div className="next-game"><span>Another round of something else?</span><Link to={next.path}>Next in the collection: {next.title}</Link></div>
    </main>
}
GameLayout.propTypes = { children: nodeProp, game: objectProp }
