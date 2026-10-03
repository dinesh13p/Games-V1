import { useNavigate, useSearchParams } from 'react-router-dom'
import { games } from '../../data/games'
import { catalogueResults, pickGame, readFilters } from './Home.logic'

export function useCatalogue() {
    const [params, setParams] = useSearchParams()
    const navigate = useNavigate()
    const filters = readFilters(params)
    const results = catalogueResults(params)
    let recent = null
    try { recent = games.find(game => game.id === localStorage.getItem('gamesv1-last-played')) || null } catch { /* Storage may be disabled. */ }
    const updateFilter = (key, value) => {
        const next = new URLSearchParams(params)
        if (!value || value === 'All games') next.delete(key)
        else next.set(key, String(value))
        setParams(next, { replace: true, preventScrollReset: true })
    }
    const surprise = () => {
        const needsTouch = window.matchMedia('(pointer: coarse), (max-width: 767px)').matches
        const compatible = results.filter(item => !needsTouch || item.mobile)
        const game = pickGame(compatible.length ? compatible : results)
        if (game) navigate(game.path)
    }
    return { filters, results, recent, updateFilter, surprise, clear: () => setParams({}, { replace: true, preventScrollReset: true }) }
}
