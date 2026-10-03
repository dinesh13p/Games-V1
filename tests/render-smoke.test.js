/* eslint-env node */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server.js'
import { games } from '../src/data/games.js'

// Render-only checks, deliberately not presented as browser/device testing.
test('all 15 game views render; desktop gates and mobile board structures survive integration', async () => {
    const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
    const originalWindow = globalThis.window
    const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    try {
        Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null, setItem: () => {}, removeItem: () => {} } })
        const { default: Layout } = await vite.ssrLoadModule('/src/components/common/GameLayout.jsx')
        for (const width of [320, 390, 1280]) {
            globalThis.window = { innerWidth: width, matchMedia: query => ({ matches: query.includes('pointer: coarse') && width < 768 }) }
            for (const game of games) {
                const { default: Game } = await vite.ssrLoadModule(`/src/components/games/${game.component}/${game.component}.jsx`)
                const html = renderToStaticMarkup(createElement(StaticRouter, { location: game.path }, createElement(Layout, { game }, createElement(Game))))
                assert.match(html, /id="main-content"/)
                assert.match(html, /How to play/)
                assert.ok(html.includes(game.title), `${game.id} heading at ${width}`)
                if (!game.mobile && width < 768) {
                    assert.match(html, /Desktop required/)
                    assert.doesNotMatch(html, /<canvas/)
                } else {
                    assert.doesNotMatch(html, /Desktop required/)
                    assert.match(html, /<button/)
                    if (game.id === 'go') assert.equal((html.match(/data-cell=/g) || []).length, 81)
                    if (game.id === 'baghchal') assert.equal((html.match(/data-position=/g) || []).length, 25)
                    if (game.id === 'minesweeper') assert.equal((html.match(/data-cell=/g) || []).length, 81)
                    if (game.id === 'ludo') {
                        assert.equal((html.match(/data-track-index=/g) || []).length, 52)
                        assert.equal((html.match(/data-home-index=/g) || []).length, 20)
                        assert.equal((html.match(/data-base-color=/g) || []).length, 4)
                    }
                }
            }
        }
        const { default: Home } = await vite.ssrLoadModule('/src/pages/Home/Home.jsx')
        const home = renderToStaticMarkup(createElement(StaticRouter, { location: '/' }, createElement(Home)))
        assert.equal((home.match(/class="catalogue-entry"/g) || []).length, 15)
        assert.equal((home.match(/class="tic-tac-toe-cell/g) || []).length, 9)
        assert.match(home, /Reset board/)
        const filtered = renderToStaticMarkup(createElement(StaticRouter, { location: '/?q=gomoku' }, createElement(Home)))
        assert.equal((filtered.match(/class="catalogue-entry"/g) || []).length, 1)
        const empty = renderToStaticMarkup(createElement(StaticRouter, { location: '/?q=no-such-game' }, createElement(Home)))
        assert.match(empty, /Clear filters/)
    } finally {
        if (originalWindow === undefined) delete globalThis.window
        else globalThis.window = originalWindow
        if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor)
        else delete globalThis.localStorage
        await vite.close()
    }
})
