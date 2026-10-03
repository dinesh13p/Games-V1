import { Component } from 'react'
import { nodeProp } from '../../utils/propTypes'

export default class ErrorBoundary extends Component {
    state = { failed: false }
    static getDerivedStateFromError() { return { failed: true } }
    render() {
        if (this.state.failed) return <div className="game-error" role="alert">
            <h2>This game couldn’t open.</h2>
            <p>Your saved scores are still in this browser. Reload to try again, or return to the collection.</p>
            <button className="button" onClick={() => window.location.reload()}>Reload</button> <a href="/">Return home</a>
        </div>
        return this.props.children
    }
}
ErrorBoundary.propTypes = { children: nodeProp }
