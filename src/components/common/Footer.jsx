import { Link } from 'react-router-dom'

export default function Footer() {
    return <footer className="site-footer">
        <div className="site-width footer-inner">
            <p><Link to="/">Games / V1</Link><span>Built by Dinesh Poudel</span></p>
            <p className="footer-small">No account. No download. Just play.</p>
            <a href="https://www.dinesh-poudel.com.np" target="_blank" rel="noreferrer">Dinesh’s portfolio</a>
        </div>
    </footer>
}
