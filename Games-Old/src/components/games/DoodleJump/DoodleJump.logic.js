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