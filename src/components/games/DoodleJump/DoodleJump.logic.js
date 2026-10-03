// Doodle Jump Game Logic

export const CANVAS_WIDTH = 400
export const CANVAS_HEIGHT = 600
export const DOODLER_WIDTH = 60
export const DOODLER_HEIGHT = 60
export const PLATFORM_WIDTH = 85
export const PLATFORM_HEIGHT = 15
export const GRAVITY = 0.8
export const JUMP_FORCE = 18

export const createPlatform = (x, y, type = 'normal') => ({
    x, y,
    width: PLATFORM_WIDTH,
    height: PLATFORM_HEIGHT,
    type
})

export const createFallingObject = (x, y) => ({
    x, y,
    width: 24,
    height: 24,
    velocityY: 4 + Math.random() * 2,
    type: Math.random() < 0.5 ? 'bomb' : 'stone'
})

export const initializePlatforms = (canvasWidth, canvasHeight) => {
    const platforms = []
    const initialCount = Math.max(3, Math.floor(10 * 0.7))
    for (let i = 0; i < initialCount; i++) {
        const x = Math.random() * (canvasWidth - PLATFORM_WIDTH)
        const y = canvasHeight - 80 - i * 80
        let type = 'normal'
        if (i === 0) type = 'normal'
        else if (i % 5 === 0 && Math.random() < 0.6) type = 'spiked'
        else if (i % 3 === 0 && Math.random() < 0.28) type = 'green'
        platforms.push(createPlatform(x, y, type))
    }
    return platforms
}

export const generateNewPlatform = (platforms, canvasWidth) => {
    if (platforms.length === 0) return createPlatform(canvasWidth / 2, CANVAS_HEIGHT - 100)
    const highestY = Math.min(...platforms.map(p => p.y))
    const newY = highestY - (60 + Math.random() * 40)
    const newX = Math.random() * (canvasWidth - PLATFORM_WIDTH)
    let type = 'normal'
    const rand = Math.random()
    if (rand < 0.15 && Math.random() < 0.6) type = 'spiked'
    else if (rand < 0.35 && Math.random() < 0.28) type = 'green'
    return createPlatform(newX, newY, type)
}

export const checkPlatformCollision = (doodler, platform) => {
    return (
        doodler.x < platform.x + platform.width &&
        doodler.x + DOODLER_WIDTH > platform.x &&
        doodler.y + DOODLER_HEIGHT >= platform.y &&
        doodler.y + DOODLER_HEIGHT <= platform.y + platform.height + 15 &&
        doodler.velocityY > 0
    )
}

export const checkFallingObjectCollision = (doodler, fallingObject) => {
    return (
        doodler.x < fallingObject.x + fallingObject.width &&
        doodler.x + DOODLER_WIDTH > fallingObject.x &&
        doodler.y < fallingObject.y + fallingObject.height &&
        doodler.y + DOODLER_HEIGHT > fallingObject.y
    )
}

export const createDoodleGame = () => ({
    doodler: { x: CANVAS_WIDTH / 2 - DOODLER_WIDTH / 2, y: CANVAS_HEIGHT - 150,
        velocityX: 0, velocityY: -JUMP_FORCE, facingRight: true, flying: false, flyingTimer: 0 },
    platforms: initializePlatforms(CANVAS_WIDTH, CANVAS_HEIGHT), cameraY: 0,
    score: 0, maxHeight: 0, fallingObjects: [], phase: 'ready'
})

export const advanceDoodle = (state, keys) => {
    if (state.phase !== 'playing') return state
    const doodler = { ...state.doodler }
    const next = { ...state, doodler }
    if (keys.left) { doodler.velocityX = Math.max(doodler.velocityX - 1.5, -8); doodler.facingRight = false }
    else if (keys.right) { doodler.velocityX = Math.min(doodler.velocityX + 1.5, 8); doodler.facingRight = true }
    else {
        doodler.velocityX *= 0.9
        if (Math.abs(doodler.velocityX) < 0.3) doodler.velocityX = 0
    }
    if (doodler.flying && --doodler.flyingTimer <= 0) { doodler.flying = false; doodler.velocityY = 0 }
    doodler.velocityY += GRAVITY * (doodler.flying ? 0.1 : 1)
    doodler.x += doodler.velocityX
    doodler.y += doodler.velocityY
    if (doodler.x < -DOODLER_WIDTH) doodler.x = CANVAS_WIDTH
    else if (doodler.x > CANVAS_WIDTH) doodler.x = -DOODLER_WIDTH
    if (doodler.y < state.cameraY + CANVAS_HEIGHT / 2) {
        next.cameraY = doodler.y - CANVAS_HEIGHT / 2
        next.maxHeight = Math.max(state.maxHeight, -next.cameraY / 10, 0)
        // Keep fractional height until it crosses a whole point.
        next.score = Math.floor(next.maxHeight)
    }
    if (doodler.velocityY > 0) {
        for (const platform of state.platforms) {
            if (!checkPlatformCollision(doodler, platform)) continue
            if (platform.type === 'spiked') { next.phase = 'over'; return next }
            doodler.y = platform.y - DOODLER_HEIGHT
            doodler.velocityY = -JUMP_FORCE * (platform.type === 'green' ? 1.5 : 1)
            if (platform.type === 'green') { doodler.flying = true; doodler.flyingTimer = 60 }
            break
        }
    }
    const objects = [...state.fallingObjects]
    if (objects.length < 3 && Math.random() < 0.01) objects.push(createFallingObject(Math.random() * (CANVAS_WIDTH - 24), next.cameraY - 30))
    next.fallingObjects = objects.map(obj => ({ ...obj, y: obj.y + obj.velocityY }))
    if (next.fallingObjects.some(obj => checkFallingObjectCollision(doodler, obj))) { next.phase = 'over'; return next }
    next.fallingObjects = next.fallingObjects.filter(obj => obj.y < next.cameraY + CANVAS_HEIGHT + 200)
    next.platforms = state.platforms.filter(platform => platform.y < next.cameraY + CANVAS_HEIGHT + 200)
    while (next.platforms.length < Math.max(4, Math.floor(12 * 0.7))) next.platforms.push(generateNewPlatform(next.platforms, CANVAS_WIDTH))
    if (doodler.y > next.cameraY + CANVAS_HEIGHT + 100) next.phase = 'over'
    return next
}
