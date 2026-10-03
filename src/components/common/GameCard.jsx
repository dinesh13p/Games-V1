import { Link } from 'react-router-dom'
import GameArtwork from './GameArtwork'
import { objectProp } from '../../utils/propTypes'

export default function GameCard({ game }) {
    return <li className="catalogue-entry">
        <Link to={game.path} className="catalogue-link">
            <div className="catalogue-art"><GameArtwork id={game.id} /></div>
            <div className="catalogue-copy">
                <div className="catalogue-kicker"><span>{game.number} / {game.category}</span>{game.dimensional && <span>3D relief</span>}</div>
                <h3>{game.title}</h3>
                <p>{game.description}</p>
                <div className="catalogue-meta"><span>{game.mobile ? 'Touch friendly' : 'Desktop only'}</span><span className="catalogue-play">Play</span></div>
            </div>
        </Link>
    </li>
}
GameCard.propTypes = { game: objectProp }
