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
    bullseye: { color: '#a3422a', points: 100, size: 1 },
    normal: { color: '#46533b', points: 50, size: 1.2 },
    large: { color: '#65757a', points: 25, size: 1.5 }
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

export const generateTargets = (level) => {
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

export const generateEnemies = (level, canvasHeight = CANVAS_HEIGHT) => {
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
    const newTargets = targets.map(t => ({ ...t }))
    const newEnemies = enemies.map(e => ({ ...e }))
    const newArrows = []

    // An arrow is consumed by its first hit, including overlapping targets.
    for (const arrow of arrows) {
        let consumed = false
        for (const target of newTargets) {
            if (target.hit) continue
            const targetInfo = TARGET_TYPES[target.type]
            const targetSize = TARGET_SIZE * targetInfo.size
            const dx = arrow.x - target.x
            const dy = arrow.y - target.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < targetSize / 2) {
                target.hit = true
                scoreGained += targetInfo.points
                createParticlesFn?.(target.x, target.y, targetInfo.color, 12)
                consumed = true
                break
            }
        }

        for (const enemy of newEnemies) {
            if (consumed || enemy.hit) continue

            const dx = arrow.x - enemy.x
            const dy = arrow.y - (enemy.y - ENEMY_SIZE / 2)
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < ENEMY_SIZE / 2) {
                enemy.hit = true
                scoreGained += enemy.points
                createParticlesFn?.(enemy.x, enemy.y, '#a3422a', 8)
                consumed = true
            }
        }
        if (!consumed) newArrows.push(arrow)
    }

    return { arrows: newArrows, targets: newTargets, enemies: newEnemies, scoreGained }
}

export const createLevel = (level = 1) => ({
    arrows: [], targets: generateTargets(level), enemies: generateEnemies(level),
    particles: [], bowAngle: 0, arrowsLeft: 10 + level,
    wind: (Math.random() - 0.5) * WIND_STRENGTH, level, chargeAt: null, power: 0
})

export const shootArrow = (state, chargeSeconds) => {
    if (state.phase !== 'playing' || state.arrowsLeft <= 0) return state
    const power = Math.min(Math.max(chargeSeconds, 0), 2)
    const speed = ARROW_SPEED * (0.5 + power * 0.5)
    return { ...state, arrowsLeft: state.arrowsLeft - 1, chargeAt: null, power: 0,
        arrows: [...state.arrows, { x: BOW_X + 50, y: BOW_Y, vx: Math.cos(state.bowAngle) * speed,
            vy: Math.sin(state.bowAngle) * speed, angle: state.bowAngle, gravity: 0.15 }] }
}

export const advanceArchery = (state, reducedMotion = false) => {
    if (state.phase !== 'playing') return state
    const arrows = state.arrows.map(arrow => {
        const vx = arrow.vx + state.wind * 0.1
        const vy = arrow.vy + arrow.gravity
        return { ...arrow, x: arrow.x + arrow.vx, y: arrow.y + arrow.vy, vx, vy, angle: Math.atan2(vy, vx) }
    }).filter(arrow => arrow.x > -100 && arrow.x < CANVAS_WIDTH + 100 && arrow.y < CANVAS_HEIGHT + 100)
    const targets = state.targets.map(target => {
        if (!target.moving || target.hit) return target
        const x = target.x + target.vx, y = target.y + target.vy
        return { ...target, x, y, vx: x < 300 || x > CANVAS_WIDTH - 50 ? -target.vx : target.vx,
            vy: y < 50 || y > CANVAS_HEIGHT - 50 ? -target.vy : target.vy }
    })
    const enemies = state.enemies.map(enemy => {
        if (enemy.hit) return enemy
        const x = enemy.x + enemy.vx
        return { ...enemy, x, vx: x < 400 || x > CANVAS_WIDTH - 50 ? -enemy.vx : enemy.vx }
    })
    const particles = reducedMotion ? [] : state.particles.map(particle => ({
        ...particle, x: particle.x + particle.vx, y: particle.y + particle.vy,
        vx: particle.vx * 0.98, vy: particle.vy * 0.98, life: particle.life - 1, size: particle.size * 0.95
    })).filter(particle => particle.life > 0 && particle.size > 0.5)
    const result = checkCollisions(arrows, targets, enemies, (x, y, color, count) => {
        if (!reducedMotion) particles.push(...createParticles(x, y, color, count))
    })
    const next = { ...state, ...result, particles, score: Math.max(0, state.score + result.scoreGained) }
    if (result.targets.every(target => target.hit)) {
        return { ...next, ...createLevel(state.level + 1), score: next.score + state.arrowsLeft * 10 }
    }
    if (state.arrowsLeft <= 0 && !result.arrows.length) next.phase = 'over'
    return next
}
