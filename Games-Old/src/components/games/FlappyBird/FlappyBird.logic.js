// Flappy Bird Game Logic

export const WIDTH = 480
export const HEIGHT = 640
export const GRAVITY = 1400
export const FLAP_VELOCITY = -380
export const MAX_DROP_SPEED = 900
export const BIRD_RADIUS = 18
export const PIPE_WIDTH = 72
export const PIPE_GAP = 150
export const PIPE_MIN_GAP_Y = 100
export const PIPE_SPAWN_INTERVAL = 1.6
export const PIPE_SPEED = 180
export const GROUND_HEIGHT = 110
export const HS_KEY = 'flappyBirdHighScore'

export const randRange = (min, max) => Math.random() * (max - min) + min

export const shouldPipeMove = (pipeNumber) => {
    if (pipeNumber <= 24) return false
    const cycleBase = Math.floor((pipeNumber - 1) / 100) * 100
    const n = pipeNumber - cycleBase
    if (n >= 25 && n <= 45) return [28, 31, 34, 37, 40, 43].includes(n)
    if (n >= 46 && n <= 75) return n % 2 === 0
    if (n >= 76 && n <= 100) return true
    if (n >= 101 && n <= 124) return false
    if (n >= 125 && n <= 145) return [128, 131, 134, 137, 140, 143].includes(n)
    if (n >= 146 && n <= 175) return n % 2 === 0
    if (n >= 176 && n <= 200) return true
    return false
}

export const createPipe = (pipeCount, width, height) => {
    const x = width + 40
    const minY = PIPE_MIN_GAP_Y
    const maxY = height - GROUND_HEIGHT - PIPE_GAP - 40
    const currentPipeNumber = pipeCount + 1

    if (currentPipeNumber > 100) return null

    if (currentPipeNumber === 100) {
        return {
            x,
            gapY: height / 2,
            originalGapY: height / 2,
            pipeNumber: currentPipeNumber,
            movingGap: false,
            gapDirection: 1,
            gapSpeed: 80,
            isGolden: true,
            isLastPipe: true,
            passed: false
        }
    }

    const gapY = randRange(minY, maxY)
    const shouldMove = shouldPipeMove(currentPipeNumber)

    return {
        x,
        gapY,
        originalGapY: gapY,
        pipeNumber: currentPipeNumber,
        movingGap: shouldMove,
        gapDirection: 1,
        gapSpeed: shouldMove ? 80 : 0,
        isGolden: false,
        isLastPipe: false,
        passed: false
    }
}

export const checkCollision = (bird, pipes, width, height) => {
    if (bird.y + BIRD_RADIUS >= height - GROUND_HEIGHT) return true
    if (bird.y - BIRD_RADIUS <= 0) return true

    for (let pipe of pipes) {
        const rx = pipe.x
        const rw = PIPE_WIDTH
        const topRect = { x: rx, y: 0, w: rw, h: pipe.gapY }
        const bottomRect = {
            x: rx,
            y: pipe.gapY + PIPE_GAP,
            w: rw,
            h: height - GROUND_HEIGHT - (pipe.gapY + PIPE_GAP)
        }

        if (circleRectCollision(bird, topRect) || circleRectCollision(bird, bottomRect)) {
            return true
        }
    }
    return false
}

export const circleRectCollision = (circle, rect) => {
    const cx = circle.x
    const cy = circle.y
    const rx = rect.x
    const ry = rect.y
    const rw = rect.w
    const rh = rect.h

    const closestX = Math.max(rx, Math.min(cx, rx + rw))
    const closestY = Math.max(ry, Math.min(cy, ry + rh))

    const dx = cx - closestX
    const dy = cy - closestY
    return dx * dx + dy * dy < BIRD_RADIUS * BIRD_RADIUS
}