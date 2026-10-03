import { createElement, useState } from 'react'

const STORAGE_KEY = 'gamesv1-appearance'
const DARK = 'dark'
const LIGHT = 'light'
const DEFAULT_APPEARANCE = DARK

function normalizeAppearance(value) {
    return value === LIGHT || value === DARK ? value : DEFAULT_APPEARANCE
}

function resolveStorage(storage) {
    if (storage !== undefined) return storage
    if (!globalThis.document) return null
    try {
        return globalThis.localStorage
    } catch {
        return null
    }
}

function readAppearance(storage) {
    try {
        return normalizeAppearance(resolveStorage(storage)?.getItem(STORAGE_KEY))
    } catch {
        return DEFAULT_APPEARANCE
    }
}

function serializeAppearance(value) {
    return normalizeAppearance(value)
}

function persistAppearance(value, storage) {
    const appearance = serializeAppearance(value)
    try {
        resolveStorage(storage)?.setItem(STORAGE_KEY, appearance)
    } catch {
        // Appearance still applies when storage is unavailable.
    }
    return appearance
}

function applyAppearance(value, documentElement = globalThis.document?.documentElement) {
    const appearance = normalizeAppearance(value)
    documentElement?.setAttribute('data-appearance', appearance)
    return appearance
}

function initializeAppearance({ storage, documentElement } = {}) {
    const appearance = readAppearance(storage)
    return applyAppearance(appearance, documentElement)
}

function toggleAppearance(value) {
    return normalizeAppearance(value) === DARK ? LIGHT : DARK
}

// Runs as soon as this module is evaluated, before React paints the header.
initializeAppearance()

// The pure helpers stay beside the control so the first-paint initializer and UI use one source.
// eslint-disable-next-line react-refresh/only-export-components
export const appearance = Object.freeze({
    DARK,
    LIGHT,
    DEFAULT_APPEARANCE,
    STORAGE_KEY,
    normalize: normalizeAppearance,
    read: readAppearance,
    serialize: serializeAppearance,
    persist: persistAppearance,
    apply: applyAppearance,
    initialize: initializeAppearance,
    toggle: toggleAppearance,
})

function labelFor(value) {
    return value === DARK ? 'Dark' : 'Light'
}

export default function AppearanceToggle() {
    const [currentAppearance, setCurrentAppearance] = useState(() => initializeAppearance())
    const nextAppearance = toggleAppearance(currentAppearance)
    const currentLabel = labelFor(currentAppearance)
    const nextLabel = labelFor(nextAppearance)

    function handleToggle() {
        const next = toggleAppearance(currentAppearance)
        persistAppearance(next)
        applyAppearance(next)
        setCurrentAppearance(next)
    }

    return createElement(
        'button',
        {
            type: 'button',
            className: 'appearance-toggle',
            'aria-pressed': currentAppearance === DARK,
            'aria-label': `Appearance ${currentLabel}. Switch to ${nextLabel}`,
            title: `Switch to ${nextLabel} appearance`,
            onClick: handleToggle,
        },
        `Switch to ${nextLabel}`,
    )
}
