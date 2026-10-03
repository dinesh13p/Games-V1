// Archery Game Logic

export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600
export const BOW_X = 100
export const BOW_Y = CANVAS_HEIGHT / 2
export const ARROW_SPEED = 12
export const TARGET_SIZE = 60
export const ENEMY_SIZE = 40
export const WIND_STRENGTH = 2

export const TARGET_TYPES = {
    bullseye: { color: '#ff0000', points: 100, size: 1 },
    normal: { color: '#00ff00', points: 50, size: 1.2 },
    large: { color: '#0000ff', points: 25, size: 1.5 }
}

export const createParticles = (x, y, color, count = 8) => {
    const particles = []
    for (let i = 0; i < count; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30,
            color,
            size: Math.random() * 4 + 2
        })
    }
    return particles
}

export const generateTargets = (level, canvasWidth, canvasHeight) => {
    const targets = []
    const numTargets = Math.min(3 + level, 8)

    for (let i = 0; i < numTargets; i++) {
        const type = Math.random() < 0.3 ? 'bullseye' : Math.random() < 0.6 ? 'normal' : 'large'
        targets.push({
            x: 400 + Math.random() * 300,
            y: 100 + Math.random() * 400,
            type,
            moving: level > 2 && Math.random() < 0.4,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            hit: false,
            id: Math.random()
        })
    }
    return targets
}

export const generateEnemies = (level, canvasWidth, canvasHeight) => {
    if (level < 3) return []

    const enemies = []
    const numEnemies = Math.min(Math.floor((level - 2) / 2), 4)

    for (let i = 0; i < numEnemies; i++) {
        enemies.push({
            x: 500 + Math.random() * 200,
            y: canvasHeight - 80,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 0,
            hit: false,
            id: Math.random(),
            points: -30
        })
    }
    return enemies
}

export const checkCollisions = (arrows, targets, enemies, createParticlesFn) => {
    let scoreGained = 0
    const newArrows = [...arrows]
    const newTargets = targets.map(t => ({ ...t }))
    const newEnemies = enemies.map(e => ({ ...e }))

    // Arrow-target collisions
    newArrows.forEach((arrow, arrowIdx) => {
        newTargets.forEach((target, targetIdx) => {
            if (target.hit) return

            const targetInfo = TARGET_TYPES[target.type]
            const targetSize = TARGET_SIZE * targetInfo.size
            const dx = arrow.x - target.x
            const dy = arrow.y - target.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < targetSize / 2) {
                target.hit = true
                scoreGained += targetInfo.points
                createParticlesFn(target.x, target.y, targetInfo.color, 12)
                newArrows[arrowIdx] = { ...arrow, x: -1000 }
            }
        })

        // Arrow-enemy collisions
        newEnemies.forEach((enemy, enemyIdx) => {
            if (enemy.hit) return

            const dx = arrow.x - enemy.x
            const dy = arrow.y - (enemy.y - ENEMY_SIZE / 2)
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < ENEMY_SIZE / 2) {
                enemy.hit = true
                scoreGained += enemy.points
                createParticlesFn(enemy.x, enemy.y, '#8b0000', 8)
                newArrows[arrowIdx] = { ...arrow, x: -1000 }
            }
        })
    })

    return { arrows: newArrows, targets: newTargets, enemies: newEnemies, scoreGained }
}