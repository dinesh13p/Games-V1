import test from 'node:test'
import assert from 'node:assert/strict'
import { games, filterGames, findGame } from '../src/data/games.js'
import { readFilters, pickGame } from '../src/pages/Home/Home.logic.js'

test('the catalogue has fifteen distinct routes and game folders', () => {
    assert.equal(games.length, 15)
    assert.equal(new Set(games.map(game => game.path)).size, 15)
    assert.equal(new Set(games.map(game => game.component)).size, 15)
})
test('desktop-only games remain clearly distinguished', () => {
    assert.deepEqual(games.filter(game => !game.mobile).map(game => game.id), ['pacman', 'spaceinvaders'])
    assert.equal(filterGames({ touchOnly: true }).length, 13)
})
test('search, category and touch filters compose without changing source data', () => {
    assert.deepEqual(filterGames({ query: ' gomoku ', category: 'Strategy', touchOnly: true }).map(game => game.id), ['go'])
    assert.equal(filterGames({ query: 'not-a-game' }).length, 0)
    assert.equal(games.length, 15)
    assert.equal(filterGames({ category: 'Sports' }).length, 2)
})
test('URL filters tolerate unknown categories and preserve search text', () => {
    assert.deepEqual(readFilters(new URLSearchParams('category=bogus&q=snake&touch=1')), { category: 'All games', query: 'snake', touchOnly: true })
})
test('random selection stays inside filtered results and handles an empty shelf', () => {
    const candidates = filterGames({ category: 'Sports' })
    assert.equal(pickGame(candidates, () => 0).id, 'pong')
    assert.equal(pickGame(candidates, () => .999).id, 'archery')
    assert.equal(pickGame([]), null)
    assert.equal(findGame('/baghchal/').id, 'baghchal')
    assert.equal(findGame('/missing'), undefined)
})
