import { Link, useLocation } from 'react-router-dom'
import AppearanceToggle from './AppearanceToggle'
import { games } from '../../data/games'

export default function Header() {
    const { pathname } = useLocation()
    return <header className="site-header">
        <div className="site-width header-inner">
            <Link to="/" className="wordmark" aria-label="Games V1 home">
                <span className="brand-mark" aria-hidden="true">g<span>v1</span></span>
                <span>Games<span className="wordmark-edition"> / V1</span></span>
            </Link>
            <span className="header-note">A small collection. A good time.</span>
            <nav aria-label="Main navigation">
                <Link to="/#collection" aria-current={pathname === '/' ? 'page' : undefined}>The collection <span className="nav-count">{games.length}</span></Link>
                <Link to="/#about" className="about-link">A note from the maker</Link>
            </nav>
            <AppearanceToggle />
        </div>
    </header>
}
