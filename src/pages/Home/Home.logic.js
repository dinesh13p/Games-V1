import { categories, filterGames } from '../../data/games.js'

export function readFilters(params) {
    const category = params.get('category') || 'All games'
    return { category: categories.includes(category) ? category : 'All games', query: params.get('q') || '', touchOnly: params.get('touch') === '1' }
}

export function pickGame(candidates, random = Math.random) {
    return candidates.length ? candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))] : null
}

export function catalogueResults(params) {
    return filterGames(readFilters(params))
}
