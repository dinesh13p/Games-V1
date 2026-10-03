import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
const { appearance } = await vite.ssrLoadModule('/src/components/common/AppearanceToggle.jsx')

test.after(async () => {
    await vite.close()
})

test('appearance defaults to dark when storage is absent or invalid', () => {
    assert.equal(appearance.read({ getItem: () => null }), appearance.DARK)
    assert.equal(appearance.read({ getItem: () => 'sepia' }), appearance.DARK)
    assert.equal(appearance.read({ getItem: () => '' }), appearance.DARK)
    assert.equal(appearance.read({ getItem: () => appearance.LIGHT }), appearance.LIGHT)
})

test('appearance toggles and persists its serialized value', () => {
    const values = new Map()
    const storage = {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
    }

    assert.equal(appearance.toggle(appearance.DARK), appearance.LIGHT)
    assert.equal(appearance.toggle(appearance.LIGHT), appearance.DARK)
    assert.equal(appearance.serialize('sepia'), appearance.DARK)
    assert.equal(appearance.persist(appearance.LIGHT, storage), appearance.LIGHT)
    assert.equal(values.get(appearance.STORAGE_KEY), appearance.LIGHT)
    assert.equal(appearance.read(storage), appearance.LIGHT)
})

test('appearance initialization writes the selected data attribute', () => {
    const attributes = new Map()
    const documentElement = { setAttribute: (name, value) => attributes.set(name, value) }
    const storage = { getItem: () => appearance.LIGHT }

    assert.equal(appearance.initialize({ storage, documentElement }), appearance.LIGHT)
    assert.equal(attributes.get('data-appearance'), appearance.LIGHT)
})

test('dark and light theme variable mappings remain explicit', async () => {
    const css = await readFile(new URL('../src/styles/themes.css', import.meta.url), 'utf8')
    const darkBlock = css.slice(css.indexOf(':root,'), css.indexOf('\n}\n\n:root[data-appearance="light"]'))
    const lightBlock = css.slice(css.indexOf(':root[data-appearance="light"]'), css.indexOf('\n}\n\n:root,', css.indexOf(':root[data-appearance="light"]')))

    for (const [name, value] of [
        ['paper', '#1f2923'],
        ['surface', '#2b352d'],
        ['ink', '#efe5cf'],
        ['accent', '#c15b3d'],
        ['olive', '#a3ad78'],
        ['line', '#647366'],
    ]) {
        assert.match(darkBlock, new RegExp(`--${name}:\\s*${value}`))
    }
    for (const [name, value] of [
        ['paper', '#e7e1d5'],
        ['surface', '#f1ecdf'],
        ['ink', '#262b25'],
        ['muted', '#626557'],
        ['accent', '#a3422a'],
        ['olive', '#46533b'],
        ['line', '#b9b3a5'],
    ]) {
        assert.match(lightBlock, new RegExp(`--${name}:\\s*${value}`))
    }
})
